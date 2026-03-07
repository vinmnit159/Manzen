import React from 'react';
import { CheckCircle2, XCircle, Star, AlertTriangle } from 'lucide-react';
import type { FeedbackData } from '../lib/types';

interface FeedbackPanelProps {
  feedback: FeedbackData;
  onContinue: () => void;
  continueLabel?: string;
}

const FEEDBACK_STYLES = {
  'best-practice': {
    border: 'border-emerald-300',
    bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    titleColor: 'text-emerald-900',
    Icon: Star,
    badge: 'Best Practice',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  },
  correct: {
    border: 'border-blue-300',
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
    Icon: CheckCircle2,
    badge: 'Correct',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  incorrect: {
    border: 'border-red-300',
    bg: 'bg-red-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    titleColor: 'text-red-900',
    Icon: XCircle,
    badge: 'Incorrect',
    badgeClass: 'bg-red-100 text-red-700',
  },
  info: {
    border: 'border-slate-300',
    bg: 'bg-slate-50',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    titleColor: 'text-slate-900',
    Icon: AlertTriangle,
    badge: '',
    badgeClass: '',
  },
};

export function FeedbackPanel({ feedback, onContinue, continueLabel = 'Continue' }: FeedbackPanelProps) {
  const style = FEEDBACK_STYLES[feedback.type];
  const { Icon } = style;

  return (
    <div
      className={`rounded-xl border-2 ${style.border} ${style.bg} p-5 space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${style.iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${style.iconColor}`} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-sm font-semibold ${style.titleColor}`}>
              {feedback.title}
            </span>
            {style.badge && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.badgeClass}`}>
                {style.badge}
              </span>
            )}
            {feedback.scoreChange !== 0 && (
              <span className={`text-xs font-mono font-semibold ${feedback.scoreChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {feedback.scoreChange > 0 ? '+' : ''}{feedback.scoreChange} pts
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {feedback.explanation}
          </p>
          {feedback.takeaway && (
            <p className="text-xs text-gray-500 mt-2 italic border-t border-gray-200 pt-2">
              Takeaway: {feedback.takeaway}
            </p>
          )}
          {feedback.reportBonus && (
            <p className="text-xs text-emerald-600 font-medium mt-1">
              +50 pts reporting bonus
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          onClick={onContinue}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          autoFocus
        >
          {continueLabel}
        </button>
      </div>
    </div>
  );
}
