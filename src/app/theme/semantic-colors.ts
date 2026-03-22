/**
 * Semantic Color System — Single source of truth for status, severity,
 * and category colors across the entire application.
 *
 * All status badges, severity indicators, and category tags MUST import
 * from this file instead of defining inline Tailwind color classes.
 *
 * Colors are organized into 5 semantic tiers aligned with Google Material
 * Design guidelines:
 *   success → positive/complete states
 *   warning → attention/pending states
 *   error   → failure/critical states
 *   info    → neutral-informational states
 *   neutral → inactive/archived states
 *
 * Each tier provides: bg (background), text (foreground), dot (indicator),
 * border (optional border), and className (combined shorthand).
 */

// ─── Semantic tiers ──────────────────────────────────────────────────────────

export interface SemanticColor {
  bg: string;
  text: string;
  dot: string;
  border: string;
  /** Combined className for badges: bg + text + border */
  className: string;
}

export const semantic = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200 dark:border-emerald-800',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    border: 'border-amber-200 dark:border-amber-800',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
    border: 'border-red-200 dark:border-red-800',
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500',
    border: 'border-blue-200 dark:border-blue-800',
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
  },
  neutral: {
    bg: 'bg-gray-50 dark:bg-gray-800/30',
    text: 'text-gray-600 dark:text-gray-400',
    dot: 'bg-gray-400',
    border: 'border-gray-200 dark:border-gray-700',
    className: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700',
  },
} as const satisfies Record<string, SemanticColor>;

export type SemanticTier = keyof typeof semantic;

// ─── Status mapping ──────────────────────────────────────────────────────────
// Maps any status string to a semantic tier. Used by the StatusBadge component
// and all status-dependent UI across the app.

const STATUS_TIER_MAP: Record<string, SemanticTier> = {
  // Success
  OK: 'success',
  PASS: 'success',
  PASSED: 'success',
  PUBLISHED: 'success',
  MONITORED: 'success',
  ACTIVE: 'success',
  CONNECTED: 'success',
  COMPLETED: 'success',
  VERIFIED: 'success',
  IMPLEMENTED: 'success',
  COMPLIANT: 'success',
  RESOLVED: 'success',
  MITIGATED: 'success',
  SUCCESS: 'success',
  LOW: 'success',

  // Warning
  PENDING: 'warning',
  REVIEW: 'warning',
  IN_REVIEW: 'warning',
  PENDING_REVIEW: 'warning',
  DUE_SOON: 'warning',
  Due_soon: 'warning',
  ASSESSMENT_DUE: 'warning',
  IN_PROGRESS: 'warning',
  FLAGGED: 'warning',
  NEEDS_REMEDIATION: 'warning',
  Needs_remediation: 'warning',
  MEDIUM: 'warning',
  WARNING: 'warning',
  PARTIAL: 'warning',
  OPEN: 'warning',

  // Error
  FAIL: 'error',
  FAILED: 'error',
  OVERDUE: 'error',
  Overdue: 'error',
  CRITICAL: 'error',
  BLOCKED: 'error',
  ERROR: 'error',
  REQUIRES_ACTION: 'error',
  DISCONNECTED: 'error',
  HIGH: 'error',
  REJECTED: 'error',

  // Info
  NEW: 'info',
  DRAFT: 'info',
  NOT_RUN: 'info',
  Not_Run: 'info',
  TRANSFERRED: 'info',
  ACCEPTED: 'info',
  DEFERRED: 'info',

  // Neutral
  ARCHIVED: 'neutral',
  INACTIVE: 'neutral',
  N_A: 'neutral',
  UNKNOWN: 'neutral',
};

/**
 * Get the semantic color tier for any status string.
 * Falls back to `neutral` for unknown statuses.
 */
export function getStatusTier(status: string): SemanticTier {
  return STATUS_TIER_MAP[status] ?? STATUS_TIER_MAP[status.toUpperCase()] ?? 'neutral';
}

/**
 * Get the full semantic color config for a status string.
 */
export function getStatusColors(status: string): SemanticColor {
  return semantic[getStatusTier(status)];
}

// ─── Severity mapping ────────────────────────────────────────────────────────

const SEVERITY_TIER_MAP: Record<string, SemanticTier> = {
  CRITICAL: 'error',
  HIGH: 'error',
  MEDIUM: 'warning',
  LOW: 'success',
  INFO: 'info',
  INFORMATIONAL: 'info',
};

export function getSeverityColors(severity: string): SemanticColor {
  return semantic[SEVERITY_TIER_MAP[severity.toUpperCase()] ?? 'neutral'];
}

// ─── Category colors ─────────────────────────────────────────────────────────
// For test categories, framework categories, etc. Uses softer tones.

export const categoryColors: Record<string, string> = {
  Custom: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  Engineering: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  HR: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  IT: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  Policy: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  Risks: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export function getCategoryColor(category: string): string {
  return categoryColors[category] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
}
