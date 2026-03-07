import React, { useState, useCallback } from 'react';
import { Timer, AlertTriangle } from 'lucide-react';
import type { TimedDecisionConfig, TimedDecisionItem, UserAnswer, FeedbackData } from '../../lib/types';
import { useQuestTimer } from '../../hooks/useQuestTimer';
import { MascotHelper } from '../MascotHelper';

interface TimedChallengeProps {
  config: TimedDecisionConfig;
  onAnswer: (answer: UserAnswer, feedback: FeedbackData) => void;
  disabled?: boolean;
}

interface ItemResult {
  itemId: string;
  selectedOptionId: string;
  scoreEarned: number;
  isCorrect: boolean;
  topicTags: string[];
}

export function TimedChallenge({ config, onAnswer, disabled }: TimedChallengeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ItemResult[]>([]);
  const [showingFeedback, setShowingFeedback] = useState<{ item: TimedDecisionItem; optionId: string } | null>(null);
  const [completed, setCompleted] = useState(false);

  const finishChallenge = useCallback((itemResults: ItemResult[]) => {
    if (completed) return;
    setCompleted(true);

    const totalScore = itemResults.reduce((sum, r) => sum + r.scoreEarned, 0);
    const correctCount = itemResults.filter(r => r.isCorrect).length;
    const allTopics = itemResults.flatMap(r => r.topicTags);

    // Max possible = best option for each item
    const maxScore = config.items.reduce((sum, item) => {
      const best = item.options.reduce((b, o) => {
        const optScore = o.scoreImpact + (o.reportBonus ? 50 : 0);
        return optScore > b ? optScore : b;
      }, 0);
      return sum + best;
    }, 0);

    const answer: UserAnswer = {
      interactionId: config.id,
      selectedOptionIds: itemResults.map(r => r.selectedOptionId),
      scoreEarned: totalScore,
      maxPossibleScore: maxScore,
      wasCorrect: correctCount >= Math.ceil(config.items.length * 0.7),
      wasBestPractice: correctCount === config.items.length,
      topicTags: [...new Set(allTopics)],
      timestamp: Date.now(),
    };

    const answeredCount = itemResults.length;
    const totalItems = config.items.length;

    const feedback: FeedbackData = {
      type: correctCount === totalItems ? 'best-practice' : correctCount >= Math.ceil(totalItems * 0.7) ? 'correct' : 'incorrect',
      title: answeredCount < totalItems
        ? `Time's up! ${correctCount}/${answeredCount} correct (${totalItems - answeredCount} unanswered).`
        : `${correctCount}/${totalItems} decisions correct.`,
      explanation: correctCount === totalItems
        ? 'Outstanding performance under pressure. Every decision was solid.'
        : `You handled ${correctCount} situations correctly. Under time pressure, the key is: pause mentally, verify the source, and when in doubt, report.`,
      scoreChange: totalScore,
    };

    onAnswer(answer, feedback);
  }, [completed, config, onAnswer]);

  const { formattedTime, percentRemaining, isExpired, isUrgent } = useQuestTimer({
    totalSeconds: config.timeLimitSeconds,
    onTimeUp: () => finishChallenge(results),
    active: !completed && !disabled && !showingFeedback,
  });

  const currentItem = config.items[currentIndex];

  const handleOptionSelect = (item: TimedDecisionItem, optionId: string) => {
    if (completed || disabled || isExpired) return;
    const option = item.options.find(o => o.id === optionId);
    if (!option) return;

    const result: ItemResult = {
      itemId: item.id,
      selectedOptionId: optionId,
      scoreEarned: option.scoreImpact + (option.reportBonus ? 50 : 0),
      isCorrect: option.isCorrect,
      topicTags: option.topicTags,
    };

    const newResults = [...results, result];
    setResults(newResults);
    setShowingFeedback({ item, optionId });
  };

  const handleContinueFromFeedback = () => {
    setShowingFeedback(null);

    if (currentIndex >= config.items.length - 1) {
      finishChallenge(results);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (!currentItem && !completed) return null;

  return (
    <div className="space-y-4">
      {currentIndex === 0 && !showingFeedback && config.mascotHint && (
        <MascotHelper message={config.mascotHint} variant="warning" compact />
      )}

      {/* Timer bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className={`w-4 h-4 ${isUrgent ? 'text-red-500' : 'text-slate-500'}`} aria-hidden="true" />
            <span
              className={`text-sm font-mono font-semibold tabular-nums ${isUrgent ? 'text-red-600' : 'text-slate-700'}`}
              aria-live="polite"
              aria-label={`Time remaining: ${formattedTime}`}
            >
              {formattedTime}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            Scenario {Math.min(currentIndex + 1, config.items.length)}/{config.items.length}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? 'bg-red-500' : 'bg-blue-500'}`}
            style={{ width: `${percentRemaining}%` }}
          />
        </div>
      </div>

      {/* Current scenario */}
      {!completed && currentItem && (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            {currentItem.context && (
              <p className="text-xs text-gray-500 mb-2">{currentItem.context}</p>
            )}
            <p className="text-sm text-gray-800 leading-relaxed">{currentItem.scenario}</p>
          </div>

          {/* Quick feedback after selection */}
          {showingFeedback && (
            <div className={`rounded-xl border-2 p-3 ${results[results.length - 1]?.isCorrect ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'}`}>
              {(() => {
                const opt = showingFeedback.item.options.find(o => o.id === showingFeedback.optionId);
                return (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-sm font-semibold ${results[results.length - 1]?.isCorrect ? 'text-emerald-900' : 'text-red-900'}`}>
                        {opt?.feedbackTitle}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{opt?.feedbackExplanation}</p>
                    </div>
                    <button
                      onClick={handleContinueFromFeedback}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
                      autoFocus
                    >
                      {currentIndex >= config.items.length - 1 ? 'Finish' : 'Next'}
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Options */}
          {!showingFeedback && (
            <div className="space-y-2">
              {currentItem.options.map(option => (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(currentItem, option.id)}
                  disabled={disabled || isExpired}
                  className="w-full text-left px-4 py-3 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 disabled:opacity-50"
                >
                  <p className="text-sm font-medium text-gray-900">{option.label}</p>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Time expired message */}
      {isExpired && !completed && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">Time's up! Submitting your answers.</p>
        </div>
      )}
    </div>
  );
}
