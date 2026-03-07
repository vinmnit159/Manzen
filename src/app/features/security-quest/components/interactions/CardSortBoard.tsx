import React, { useState, useCallback } from 'react';
import { ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import type { SortConfig, UserAnswer, FeedbackData } from '../../lib/types';
import { MascotHelper } from '../MascotHelper';

interface CardSortBoardProps {
  config: SortConfig;
  onAnswer: (answer: UserAnswer, feedback: FeedbackData) => void;
  disabled?: boolean;
}

export function CardSortBoard({ config, onAnswer, disabled }: CardSortBoardProps) {
  const [items, setItems] = useState(() =>
    // Shuffle items initially
    [...config.items].sort(() => Math.random() - 0.5),
  );
  const [submitted, setSubmitted] = useState(false);

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    if (submitted || disabled) return;
    if (toIndex < 0 || toIndex >= items.length) return;
    setItems(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, [submitted, disabled, items.length]);

  const handleSubmit = () => {
    if (submitted || disabled) return;
    setSubmitted(true);

    const userOrder = items.map(i => i.id);
    const correctOrder = config.correctOrder;

    // Count how many are in the correct position
    let correctCount = 0;
    for (let i = 0; i < userOrder.length; i++) {
      if (userOrder[i] === correctOrder[i]) correctCount++;
    }
    const isPerfect = correctCount === correctOrder.length;
    const isPartial = correctCount >= Math.ceil(correctOrder.length / 2);

    const scoreEarned = isPerfect ? config.perfectScore : isPartial ? config.partialScore : 0;
    const maxScore = config.perfectScore;

    const answer: UserAnswer = {
      interactionId: config.id,
      selectedOptionIds: userOrder,
      scoreEarned,
      maxPossibleScore: maxScore,
      wasCorrect: isPerfect || isPartial,
      wasBestPractice: isPerfect,
      topicTags: config.topicTags,
      timestamp: Date.now(),
    };

    const feedback: FeedbackData = {
      type: isPerfect ? 'best-practice' : isPartial ? 'correct' : 'incorrect',
      title: isPerfect ? 'Perfect ranking!' : isPartial ? `${correctCount}/${correctOrder.length} in the right position.` : 'Not quite right.',
      explanation: isPerfect ? config.feedbackCorrect : config.feedbackIncorrect,
      scoreChange: scoreEarned,
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

      <p className="text-xs text-gray-400">
        Use the arrow buttons to reorder. Top = strongest / safest, bottom = weakest / riskiest.
      </p>

      <div className="space-y-1.5" role="list" aria-label="Sortable items">
        {items.map((item, index) => (
          <div
            key={item.id}
            role="listitem"
            aria-label={`Position ${index + 1}: ${item.label}`}
            className={`
              flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 bg-white
              transition-all
              ${submitted ? 'border-gray-200' : 'border-gray-200 hover:border-gray-300'}
            `}
          >
            <div className="flex-shrink-0 text-gray-300">
              <GripVertical className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold flex items-center justify-center">
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
              {item.description && (
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
              )}
            </div>
            {!submitted && !disabled && (
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button
                  onClick={() => moveItem(index, index - 1)}
                  disabled={index === 0}
                  aria-label={`Move ${item.label} up`}
                  className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveItem(index, index + 1)}
                  disabled={index === items.length - 1}
                  aria-label={`Move ${item.label} down`}
                  className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!submitted && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={disabled}
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Submit Ranking
          </button>
        </div>
      )}
    </div>
  );
}
