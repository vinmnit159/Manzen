import React from 'react';
import { Zap, Flame } from 'lucide-react';

interface ScorePanelProps {
  score: number;
  streak: number;
}

export function ScorePanel({ score, streak }: ScorePanelProps) {
  return (
    <div className="flex items-center gap-3" aria-label={`Score: ${score} points. Streak: ${streak}`}>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
        <Zap className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
        <span className="text-xs font-semibold font-mono tabular-nums">{score}</span>
        <span className="text-xs text-slate-400">pts</span>
      </div>
      {streak >= 2 && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-50 text-orange-700 animate-in fade-in-0 duration-200">
          <Flame className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="text-xs font-semibold">{streak}x</span>
        </div>
      )}
    </div>
  );
}
