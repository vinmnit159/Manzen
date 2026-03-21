/**
 * Format an ISO date string as a short locale date (e.g. "Mar 21, 2026").
 * Returns '—' for null/undefined/empty values.
 */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format an ISO date string with time (e.g. "Mar 21, 2026, 2:30 PM").
 * Returns '—' for null/undefined/empty values.
 */
export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
