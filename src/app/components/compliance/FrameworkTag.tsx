/**
 * FrameworkTag — compact colored badge for a framework slug.
 * Clicking the tag calls `onFilter` if provided.
 */

import { Badge } from "@/app/components/ui/badge";

const SLUG_COLORS: Record<string, string> = {
  'iso-27001': 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
  'soc-2':     'bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-200',
  'nist-csf':  'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200',
  'hipaa':     'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200',
};

const SLUG_LABELS: Record<string, string> = {
  'iso-27001': 'ISO 27001',
  'soc-2':     'SOC 2',
  'nist-csf':  'NIST CSF',
  'hipaa':     'HIPAA',
};

interface FrameworkTagProps {
  slug: string;
  label?: string;
  onFilter?: (slug: string) => void;
  size?: 'sm' | 'xs';
}

export function FrameworkTag({ slug, label, onFilter, size = 'sm' }: FrameworkTagProps) {
  const colorClass = SLUG_COLORS[slug] ?? 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200';
  const displayLabel = label ?? SLUG_LABELS[slug] ?? slug;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium cursor-default transition-colors
        ${size === 'xs' ? 'text-[10px]' : 'text-xs'}
        ${colorClass}
        ${onFilter ? 'cursor-pointer' : ''}
      `}
      onClick={onFilter ? () => onFilter(slug) : undefined}
      role={onFilter ? 'button' : undefined}
      tabIndex={onFilter ? 0 : undefined}
      onKeyDown={onFilter ? (e) => e.key === 'Enter' && onFilter(slug) : undefined}
    >
      {displayLabel}
    </span>
  );
}
