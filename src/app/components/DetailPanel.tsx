/**
 * Generic DetailPanel
 *
 * A slide-over side panel for displaying detailed information about a
 * selected record (evidence, control, finding, etc.).
 *
 * Usage:
 *   <DetailPanel
 *     title="Evidence Detail"
 *     subtitle="Uploaded 2 days ago"
 *     onClose={() => setSelectedId(null)}
 *     actions={<Button>Edit</Button>}
 *   >
 *     <Section title="Details" icon={<Info />}>...</Section>
 *   </DetailPanel>
 */

import React from 'react';
import { X } from 'lucide-react';

export interface DetailPanelProps {
  /** Panel heading */
  title: string;
  /** Optional subtitle or metadata line below the title */
  subtitle?: string;
  /** Called when the panel should be dismissed */
  onClose: () => void;
  /** Optional action buttons in the panel header */
  actions?: React.ReactNode;
  /** Panel body content */
  children?: React.ReactNode;
  /** Width class for the panel (default: "w-full max-w-2xl") */
  width?: string;
}

export function DetailPanel({
  title,
  subtitle,
  onClose,
  actions,
  children,
  width = 'w-full max-w-2xl',
}: DetailPanelProps) {
  // Close on Escape key
  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 h-full ${width} bg-white shadow-2xl z-50 flex flex-col overflow-hidden`}
        role="complementary"
        aria-label={title}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900 truncate">{title}</h2>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {actions}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {children}
        </div>
      </aside>
    </>
  );
}

/**
 * A key-value metadata row for use inside DetailPanel.
 */
export function DetailMetaRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-2 border-b border-gray-100 last:border-0">
      <span className="w-36 shrink-0 text-xs font-medium text-gray-500 uppercase tracking-wide pt-0.5">
        {label}
      </span>
      <span className="text-sm text-gray-900 flex-1">{value}</span>
    </div>
  );
}

/**
 * Empty state for a detail panel section.
 */
export function DetailEmptyState({
  message = 'No data available.',
}: {
  message?: string;
}) {
  return (
    <div className="flex items-center justify-center py-8">
      <p className="text-sm text-gray-400 italic">{message}</p>
    </div>
  );
}
