import React from 'react';
import { CheckCircle2, Clock, Edit3, AlertCircle, FileText } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────

export interface PolicyFilter {
  search: string;
  status: string;
}

export type SortKey = 'name' | 'version' | 'status' | 'createdAt';

export const POLICY_STATUSES = ['PUBLISHED', 'DRAFT', 'REVIEW', 'ARCHIVED'] as const;

export const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string; icon: React.ElementType }
> = {
  PUBLISHED: { label: 'Published',  bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500',  icon: CheckCircle2 },
  DRAFT:     { label: 'Draft',      bg: 'bg-gray-50',   text: 'text-gray-600',   dot: 'bg-gray-400',   icon: Edit3 },
  REVIEW:    { label: 'In Review',  bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500',  icon: Clock },
  ARCHIVED:  { label: 'Archived',   bg: 'bg-red-50',    text: 'text-red-600',    dot: 'bg-red-400',    icon: AlertCircle },
};

export function getStatusCfg(status: string) {
  return STATUS_CONFIG[status] ?? { label: status, bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400', icon: FileText };
}
