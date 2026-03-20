import React, { useState } from 'react';
import { GitBranch } from 'lucide-react';
import type { BranchingScenarioConfig, BranchingChoice, UserAnswer, FeedbackData } from '../../lib/types';
import { MascotHelper } from '../MascotHelper';

interface BranchingScenarioProps {
  config: BranchingScenarioConfig;
  onAnswer: (answer: UserAnswer, feedback: FeedbackData) => void;
  disabled?: boolean;
}

interface StepResult {
  stepId: string;
  choiceId: string;
  choice: BranchingChoice;
}

export function BranchingScenario({ config, onAnswer, disabled }: BranchingScenarioProps) {
  const [currentStepId, setCurrentStepId] = useState(config.startStepId);
  const [stepResults, setStepResults] = useState<StepResult[]>([]);
  const [showingFeedback, setShowingFeedback] = useState<BranchingChoice | null>(null);
  const [completed, setCompleted] = useState(false);

  const currentStep = config.steps.find(s => s.id === currentStepId);

  const handleChoice = (choice: BranchingChoice) => {
    if (showingFeedback || completed || disabled) return;

    const result: StepResult = {
      stepId: currentStepId,
      choiceId: choice.id,
      choice,
    };

    setStepResults(prev => [...prev, result]);
    setShowingFeedback(choice);
  };

  const handleContinueFromFeedback = () => {
    if (!showingFeedback) return;

    const choice = showingFeedback;
    setShowingFeedback(null);

    if (choice.nextStepId) {
      setCurrentStepId(choice.nextStepId);
    } else {
      // Scenario complete — aggregate results
      setCompleted(true);
      const allResults = [...stepResults];
      const totalScore = allResults.reduce((sum, r) => sum + r.choice.scoreImpact, 0);

      // Find max possible by taking best option at each step
      let maxScore = 0;
      for (const step of config.steps) {
        // Only count steps that were actually visited or could be on the best path
        const bestChoice = step.choices.reduce((best, c) =>
          c.scoreImpact > best.scoreImpact ? c : best, step.choices[0]!);
        maxScore += bestChoice.scoreImpact + (bestChoice.reportBonus ? 50 : 0);
      }

      const hasReportBonus = allResults.some(r => r.choice.reportBonus);
      const allCorrect = allResults.every(r => r.choice.isCorrect);
      const hasBestPractice = allResults.some(r => r.choice.isBestPractice);

      const answer: UserAnswer = {
        interactionId: config.id,
        selectedOptionIds: allResults.map(r => r.choiceId),
        scoreEarned: totalScore + (hasReportBonus ? 50 : 0),
        maxPossibleScore: maxScore,
        wasCorrect: allCorrect,
        wasBestPractice: hasBestPractice && allCorrect,
        topicTags: config.topicTags,
        timestamp: Date.now(),
      };

      const feedback: FeedbackData = {
        type: hasBestPractice && allCorrect ? 'best-practice' : allCorrect ? 'correct' : 'incorrect',
        title: hasBestPractice && allCorrect
          ? 'Excellent judgment throughout.'
          : allCorrect
            ? 'Good decisions overall.'
            : 'Some choices could have been safer.',
        explanation: allResults.map(r => r.choice.feedbackExplanation).join(' '),
        takeaway: allResults.find(r => r.choice.takeaway)?.choice.takeaway,
        scoreChange: totalScore + (hasReportBonus ? 50 : 0),
        reportBonus: hasReportBonus,
      };

      onAnswer(answer, feedback);
    }
  };

  if (!currentStep) return null;

  return (
    <div className="space-y-4">
      {config.mascotHint && stepResults.length === 0 && (
        <MascotHelper message={config.mascotHint} variant="info" compact />
      )}

      {stepResults.length === 0 && config.context && (
        <p className="text-sm text-gray-600 leading-relaxed">{config.context}</p>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <GitBranch className="w-3.5 h-3.5" />
        <span>{config.title}</span>
        {stepResults.length > 0 && (
          <span className="text-gray-300">Step {stepResults.length + 1}</span>
        )}
      </div>

      {/* Past decisions recap */}
      {stepResults.length > 0 && (
        <div className="space-y-1.5">
          {stepResults.map((r, i) => (
            <div key={r.stepId} className="flex items-start gap-2 text-xs text-gray-400">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-mono">
                {i + 1}
              </span>
              <span>You chose: <em className="text-gray-600">{r.choice.label}</em></span>
            </div>
          ))}
        </div>
      )}

      {/* Current step narrative */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-800 leading-relaxed">{currentStep.narrative}</p>
        {currentStep.mascotComment && (
          <div className="mt-3">
            <MascotHelper message={currentStep.mascotComment} variant="warning" compact />
          </div>
        )}
      </div>

      {/* Step feedback */}
      {showingFeedback && (
        <div className={`rounded-xl border-2 p-4 space-y-2 ${showingFeedback.isCorrect ? showingFeedback.isBestPractice ? 'border-emerald-300 bg-emerald-50' : 'border-blue-300 bg-blue-50' : 'border-red-300 bg-red-50'}`}>
          <p className={`text-sm font-semibold ${showingFeedback.isCorrect ? 'text-emerald-900' : 'text-red-900'}`}>
            {showingFeedback.feedbackTitle}
          </p>
          <p className="text-sm text-gray-700">{showingFeedback.feedbackExplanation}</p>
          {showingFeedback.scoreImpact !== 0 && (
            <p className={`text-xs font-mono font-semibold ${showingFeedback.scoreImpact > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {showingFeedback.scoreImpact > 0 ? '+' : ''}{showingFeedback.scoreImpact} pts
              {showingFeedback.reportBonus && ' (+50 report bonus)'}
            </p>
          )}
          <div className="flex justify-end pt-1">
            <button
              onClick={handleContinueFromFeedback}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              autoFocus
            >
              {showingFeedback.nextStepId ? 'Continue' : 'See Results'}
            </button>
          </div>
        </div>
      )}

      {/* Choices */}
      {!showingFeedback && !completed && (
        <div className="space-y-2">
          {currentStep.choices.map(choice => (
            <button
              key={choice.id}
              onClick={() => handleChoice(choice)}
              disabled={disabled}
              className="w-full text-left px-4 py-3 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
            >
              <p className="text-sm font-medium text-gray-900">{choice.label}</p>
              {choice.description && (
                <p className="text-xs text-gray-500 mt-0.5">{choice.description}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
