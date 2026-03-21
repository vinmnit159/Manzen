import type { TestStatus, TestCategory, TestType } from '@/services/api/tests';

// ─── Config ───────────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<TestStatus, { label: string; bg: string; text: string; dot: string }> = {
  OK:                { label: 'OK',                bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500'  },
  Due_soon:          { label: 'Due Soon',          bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  Overdue:           { label: 'Overdue',           bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500'    },
  Needs_remediation: { label: 'Needs Remediation', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
};

export const CATEGORY_OPTIONS: TestCategory[] = ['Custom', 'Engineering', 'HR', 'IT', 'Policy', 'Risks'];
export const STATUS_OPTIONS: TestStatus[] = ['OK', 'Due_soon', 'Overdue', 'Needs_remediation'];
export const TYPE_OPTIONS: TestType[] = ['Document', 'Automated', 'Pipeline'];

export const CATEGORY_COLOR: Record<TestCategory, string> = {
  Custom:      'bg-gray-100 text-gray-700',
  Engineering: 'bg-blue-100 text-blue-700',
  HR:          'bg-pink-100 text-pink-700',
  IT:          'bg-cyan-100 text-cyan-700',
  Policy:      'bg-indigo-100 text-indigo-700',
  Risks:       'bg-orange-100 text-orange-700',
};

// ─── Column config ────────────────────────────────────────────────────────────
export interface ColumnConfig { id: string; label: string; visible: boolean; sortable: boolean; minWidth?: number; }

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'name',     label: 'Test Name', visible: true,  sortable: true,  minWidth: 220 },
  { id: 'category', label: 'Category',  visible: true,  sortable: true,  minWidth: 110 },
  { id: 'type',     label: 'Type',      visible: true,  sortable: true,  minWidth: 100 },
  { id: 'owner',    label: 'Owner',     visible: true,  sortable: false, minWidth: 140 },
  { id: 'status',   label: 'Status',    visible: true,  sortable: true,  minWidth: 140 },
  { id: 'dueDate',  label: 'Due Date',  visible: true,  sortable: true,  minWidth: 110 },
  { id: 'actions',  label: 'Actions',   visible: true,  sortable: false, minWidth: 120 },
];


