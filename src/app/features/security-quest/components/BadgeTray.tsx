import React from 'react';
import {
  ShieldCheck,
  KeyRound,
  LockKeyhole,
  Search,
  MonitorSmartphone,
  FileLock2,
  Award,
} from 'lucide-react';
import { BADGES } from '../content/badges';

const ICON_MAP: Record<string, React.ElementType> = {
  'shield-check': ShieldCheck,
  'key-round': KeyRound,
  'lock-keyhole': LockKeyhole,
  'search': Search,
  'monitor-smartphone': MonitorSmartphone,
  'file-lock-2': FileLock2,
  'award': Award,
};

interface BadgeTrayProps {
  earnedBadgeIds: string[];
  compact?: boolean;
}

export function BadgeTray({ earnedBadgeIds, compact = false }: BadgeTrayProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap" role="list" aria-label="Earned badges">
      {BADGES.map(badge => {
        const earned = earnedBadgeIds.includes(badge.id);
        const Icon = ICON_MAP[badge.icon] ?? Award;
        const size = compact ? 'w-6 h-6' : 'w-8 h-8';
        const iconSize = compact ? 'w-3 h-3' : 'w-4 h-4';

        return (
          <div
            key={badge.id}
            role="listitem"
            aria-label={`${badge.name}${earned ? ' (earned)' : ' (locked)'}`}
            title={earned ? `${badge.name}: ${badge.description}` : `${badge.name} — not yet earned`}
            className={`
              ${size} rounded-lg flex items-center justify-center transition-all
              ${earned
                ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300 shadow-sm'
                : 'bg-gray-100 text-gray-300'}
            `}
          >
            <Icon className={iconSize} aria-hidden="true" />
          </div>
        );
      })}
    </div>
  );
}
