import React, { useState } from 'react';
import type { MultipleChoiceConfig, UserAnswer, FeedbackData } from '../../lib/types';
import { MascotHelper } from '../MascotHelper';

interface MultipleChoiceCardProps {
  config: MultipleChoiceConfig;
  onAnswer: (answer: UserAnswer, feedback: FeedbackData) => void;
  disabled?: boolean;
}

export function MultipleChoiceCard({ config, onAnswer, disabled }: MultipleChoiceCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (optionId: string) => {
    if (submitted || disabled) return;
    setSelectedId(optionId);
  };

  const handleSubmit = () => {
    if (!selectedId || submitted || disabled) return;
    const option = config.options.find(o => o.id === selectedId);
    if (!option) return;

    setSubmitted(true);

    const bestOption = config.options.find(o => o.isBestPractice) ?? config.options.find(o => o.isCorrect);
    const maxScore = bestOption?.scoreImpact ?? 150;

    const answer: UserAnswer = {
      interactionId: config.id,
      selectedOptionIds: [selectedId],
      scoreEarned: option.scoreImpact,
      maxPossibleScore: maxScore + (bestOption?.reportBonus ? 50 : 0),
      wasCorrect: option.isCorrect,
      wasBestPractice: option.isBestPractice ?? false,
      topicTags: option.topicTags,
      timestamp: Date.now(),
    };

    const feedback: FeedbackData = {
      type: option.isBestPractice ? 'best-practice' : option.isCorrect ? 'correct' : 'incorrect',
      title: option.feedbackTitle,
      explanation: option.feedbackExplanation,
      takeaway: option.takeaway,
      scoreChange: option.scoreImpact,
      reportBonus: option.reportBonus,
    };

    onAnswer(answer, feedback);
  };

  return (
    <div className="space-y-4">
      {config.mascotHint && (
        <MascotHelper message={config.mascotHint} variant="info" compact />
      )}

      {config.context && (
        <p className="text-sm text-gray-600 leading-relaxed">{config.context}</p>
      )}

      <h3 className="text-base font-semibold text-gray-900">{config.question}</h3>

      <div className="space-y-2" role="radiogroup" aria-label={config.question}>
        {config.options.map((option) => {
          const isSelected = selectedId === option.id;
          return (
            <button
              key={option.id}
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelect(option.id)}
              disabled={submitted || disabled}
              className={`
                w-full text-left px-4 py-3 rounded-xl border-2 transition-all
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'}
                ${(submitted || disabled) ? 'cursor-default opacity-80' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5
                  flex items-center justify-center transition-colors
                  ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'}
                `}>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{option.label}</p>
                  {option.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {!submitted && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!selectedId || disabled}
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Submit Answer
          </button>
        </div>
      )}
    </div>
  );
}
