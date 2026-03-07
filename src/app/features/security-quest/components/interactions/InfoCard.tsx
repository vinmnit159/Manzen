import React from 'react';
import { Shield, Lock, Info } from 'lucide-react';
import type { InfoCardConfig } from '../../lib/types';
import { MascotHelper } from '../MascotHelper';

interface InfoCardProps {
  config: InfoCardConfig;
  onContinue: () => void;
  disabled?: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  shield: Shield,
  lock: Lock,
  info: Info,
};

export function InfoCard({ config, onContinue, disabled }: InfoCardProps) {
  const Icon = config.icon ? ICON_MAP[config.icon] ?? Info : Info;

  return (
    <div className="space-y-4">
      {config.mascotComment && (
        <MascotHelper message={config.mascotComment} />
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-blue-600" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">{config.title}</h3>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed">{config.body}</p>

        {config.bullets && config.bullets.length > 0 && (
          <ul className="space-y-1.5 pt-1">
            {config.bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400 mt-2" aria-hidden="true" />
                {bullet}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onContinue}
          disabled={disabled}
          className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          autoFocus
        >
          Continue
        </button>
      </div>
    </div>
  );
}
