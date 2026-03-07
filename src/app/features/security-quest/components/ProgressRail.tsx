import React from 'react';
import { CheckCircle2, Circle, Lock, Play } from 'lucide-react';
import { ALL_MODULES } from '../content/modules';
import type { ModuleStatus } from '../lib/types';

interface ProgressRailProps {
  moduleProgress: Record<string, ModuleStatus>;
  currentModuleId: string | null;
}

const STATUS_ICON = {
  locked: Lock,
  available: Circle,
  active: Play,
  complete: CheckCircle2,
};

const STATUS_STYLE = {
  locked: 'text-gray-300 bg-gray-50',
  available: 'text-slate-400 bg-slate-50',
  active: 'text-blue-600 bg-blue-50 ring-2 ring-blue-200',
  complete: 'text-emerald-600 bg-emerald-50',
};

const LINE_STYLE = {
  locked: 'bg-gray-200',
  available: 'bg-slate-300',
  active: 'bg-blue-400',
  complete: 'bg-emerald-400',
};

export function ProgressRail({ moduleProgress, currentModuleId }: ProgressRailProps) {
  return (
    <nav aria-label="Training progress" className="flex items-center gap-1 overflow-x-auto pb-1">
      {ALL_MODULES.map((mod, index) => {
        const status = moduleProgress[mod.id] ?? 'locked';
        const isCurrent = mod.id === currentModuleId;
        const Icon = isCurrent && status === 'active' ? Play : STATUS_ICON[status];

        return (
          <React.Fragment key={mod.id}>
            {index > 0 && (
              <div className={`h-0.5 w-4 sm:w-6 flex-shrink-0 rounded-full ${LINE_STYLE[status]}`} />
            )}
            <div
              className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${STATUS_STYLE[isCurrent ? 'active' : status]}`}
              aria-current={isCurrent ? 'step' : undefined}
              title={mod.title}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline whitespace-nowrap">{mod.shortTitle}</span>
            </div>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
