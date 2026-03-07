import React, { useState } from 'react';
import { Mail, AlertTriangle, CheckCircle2, Flag, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import type { InboxConfig, InboxMessage, UserAnswer, FeedbackData } from '../../lib/types';
import { MascotHelper } from '../MascotHelper';

type InboxAction = 'safe' | 'suspicious' | 'report';

interface MessageResult {
  messageId: string;
  action: InboxAction;
  isCorrect: boolean;
  scoreEarned: number;
}

interface InboxSimulatorProps {
  config: InboxConfig;
  onAnswer: (answer: UserAnswer, feedback: FeedbackData) => void;
  disabled?: boolean;
}

export function InboxSimulator({ config, onAnswer, disabled }: InboxSimulatorProps) {
  const [results, setResults] = useState<Record<string, MessageResult>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState<{ msg: InboxMessage; action: InboxAction } | null>(null);

  const handleAction = (message: InboxMessage, action: InboxAction) => {
    if (submitted || disabled || results[message.id]) return;

    let score = 0;
    let isCorrect = false;

    if (message.isSuspicious) {
      if (action === 'report') {
        score = config.correctMarkScore + config.reportBonusScore;
        isCorrect = true;
      } else if (action === 'suspicious') {
        score = config.correctMarkScore;
        isCorrect = true;
      } else {
        score = config.wrongOpenPenalty;
        isCorrect = false;
      }
    } else {
      if (action === 'safe') {
        score = config.correctSafeScore;
        isCorrect = true;
      } else if (action === 'suspicious' || action === 'report') {
        score = 0; // False positive - no penalty but no points
        isCorrect = false;
      }
    }

    setResults(prev => ({
      ...prev,
      [message.id]: {
        messageId: message.id,
        action,
        isCorrect,
        scoreEarned: score,
      },
    }));

    setMessageFeedback({ msg: message, action });
  };

  const dismissMessageFeedback = () => {
    setMessageFeedback(null);

    // Auto-submit when all messages are handled
    if (Object.keys(results).length >= config.messages.length - 1) {
      // -1 because the current one was just added but might not be in state yet
      setTimeout(() => handleSubmit(), 100);
    }
  };

  const handleSubmit = () => {
    if (submitted) return;
    const totalHandled = Object.keys(results).length;
    if (totalHandled < config.messages.length) return;

    setSubmitted(true);

    const totalScore = Object.values(results).reduce((sum, r) => sum + r.scoreEarned, 0);
    const correctCount = Object.values(results).filter(r => r.isCorrect).length;

    const maxPerSuspicious = config.correctMarkScore + config.reportBonusScore;
    const suspiciousCount = config.messages.filter(m => m.isSuspicious).length;
    const safeCount = config.messages.length - suspiciousCount;
    const maxScore = (suspiciousCount * maxPerSuspicious) + (safeCount * config.correctSafeScore);

    const answer: UserAnswer = {
      interactionId: config.id,
      selectedOptionIds: Object.entries(results).map(([id, r]) => `${id}:${r.action}`),
      scoreEarned: totalScore,
      maxPossibleScore: maxScore,
      wasCorrect: correctCount >= Math.ceil(config.messages.length * 0.7),
      wasBestPractice: correctCount === config.messages.length,
      topicTags: ['phishing'],
      timestamp: Date.now(),
    };

    const feedback: FeedbackData = {
      type: correctCount === config.messages.length ? 'best-practice' : correctCount >= Math.ceil(config.messages.length * 0.7) ? 'correct' : 'incorrect',
      title: `${correctCount}/${config.messages.length} messages handled correctly.`,
      explanation: correctCount === config.messages.length
        ? 'Perfect inbox review. You correctly identified every message.'
        : `You got ${correctCount} right. Key red flags to watch for: mismatched sender domains, false urgency, requests for credentials or money, and unusual communication channels.`,
      scoreChange: totalScore,
    };

    onAnswer(answer, feedback);
  };

  // Check if all handled
  const allHandled = Object.keys(results).length >= config.messages.length;

  return (
    <div className="space-y-4">
      {config.mascotHint && (
        <MascotHelper message={config.mascotHint} variant="info" compact />
      )}

      {config.context && (
        <p className="text-sm text-gray-600">{config.context}</p>
      )}

      <h3 className="text-base font-semibold text-gray-900">{config.question}</h3>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Mail className="w-3.5 h-3.5" />
        <span>{Object.keys(results).length}/{config.messages.length} reviewed</span>
      </div>

      {/* Inbox */}
      <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
        {config.messages.map(msg => {
          const result = results[msg.id];
          const isExpanded = expandedId === msg.id;

          return (
            <div key={msg.id} className={`transition-colors ${result ? 'bg-gray-50' : 'bg-white'}`}>
              {/* Message row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400"
                aria-expanded={isExpanded}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {result ? (
                    result.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )
                  ) : (
                    <Mail className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900 truncate">{msg.from}</span>
                    <span className="text-xs text-gray-400 truncate">&lt;{msg.fromEmail}&gt;</span>
                    <span className="ml-auto text-xs text-gray-400 flex-shrink-0">{msg.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium truncate">{msg.subject}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{msg.preview}</p>
                </div>
                <div className="flex-shrink-0">
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {/* Expanded detail + actions */}
              {isExpanded && (
                <div className="px-4 pb-3 pt-1 border-t border-gray-100">
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-gray-500 mb-1">From: {msg.from} &lt;{msg.fromEmail}&gt;</p>
                    <p className="text-xs text-gray-500 mb-2">Subject: {msg.subject}</p>
                    <p className="text-sm text-gray-700">{msg.body ?? msg.preview}</p>
                  </div>

                  {!result && !disabled && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(msg, 'safe')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Safe
                      </button>
                      <button
                        onClick={() => handleAction(msg, 'suspicious')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        <Eye className="w-3.5 h-3.5" /> Suspicious
                      </button>
                      <button
                        onClick={() => handleAction(msg, 'report')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                      >
                        <Flag className="w-3.5 h-3.5" /> Report
                      </button>
                    </div>
                  )}

                  {result && (
                    <div className={`text-xs p-2 rounded-lg ${result.isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      <p className="font-medium">
                        {result.isCorrect ? 'Correct' : 'Incorrect'} — you marked this as "{result.action}"
                        {msg.isSuspicious ? ' (it was suspicious)' : ' (it was safe)'}
                      </p>
                      {msg.redFlags.length > 0 && (
                        <ul className="mt-1 space-y-0.5 list-disc list-inside text-gray-600">
                          {msg.redFlags.map((flag, i) => (
                            <li key={i}>{flag}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Message-level feedback toast */}
      {messageFeedback && (
        <div className={`rounded-xl border p-3 ${messageFeedback.msg.isSuspicious && (messageFeedback.action === 'suspicious' || messageFeedback.action === 'report') ? 'bg-emerald-50 border-emerald-200' : !messageFeedback.msg.isSuspicious && messageFeedback.action === 'safe' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {results[messageFeedback.msg.id]?.isCorrect ? 'Good call.' : 'Not quite.'}
              {messageFeedback.msg.isSuspicious && messageFeedback.action === 'report' && ' Reporting earns bonus points.'}
            </p>
            <button
              onClick={dismissMessageFeedback}
              className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
              autoFocus
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Final submit when all done */}
      {allHandled && !submitted && !messageFeedback && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Complete Inbox Review
          </button>
        </div>
      )}
    </div>
  );
}
