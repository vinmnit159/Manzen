import type { ReactNode } from 'react';

export const STATIC_INTEGRATIONS: { name: string; category: string; description: string }[] = [];

export function redactConfigKeyLabel(key: string) {
  return /(token|secret|password|key|webhook)/i.test(key) ? `${key}: configured` : key;
}

function StaticBadge({ children, className }: { children: ReactNode; className: string }) {
  return (
    <div className={`flex h-full w-full items-center justify-center rounded-full text-[10px] font-semibold ${className}`}>
      {children}
    </div>
  );
}

export function StaticIcon({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const tone = (() => {
    switch (name) {
      case 'Slack':
        return 'bg-[#4A154B] text-white';
      case 'AWS':
        return 'bg-[#232F3E] text-white';
      case 'Cloudflare':
        return 'bg-[#F38020] text-white';
      case 'Google Workspace':
        return 'bg-[#1A73E8] text-white';
      case 'Intercom':
        return 'bg-[#1F8DED] text-white';
      case 'New Relic':
        return 'bg-[#00AC69] text-white';
      case 'Notion':
        return 'bg-black text-white';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  })();

  return (
    <div className={className} aria-hidden="true">
      <StaticBadge className={tone}>{initials}</StaticBadge>
    </div>
  );
}
