/**
 * Generic FormModal
 *
 * A reusable modal dialog wrapper that follows the existing Manzen
 * modal pattern (fixed overlay + centered white card).  Handles:
 *   - Overlay / backdrop
 *   - Title + optional subtitle
 *   - Scrollable body content slot
 *   - Consistent footer with a primary action button and a Cancel button
 *   - Error message display
 *   - Loading state on the primary button
 *
 * Usage:
 *   <FormModal
 *     title="Add Document"
 *     subtitle="Upload a new compliance document."
 *     submitLabel="Upload"
 *     loading={uploading}
 *     error={error}
 *     onSubmit={handleSubmit}
 *     onClose={() => setOpen(false)}
 *   >
 *     <input ... />
 *   </FormModal>
 */

import React from 'react';

export interface FormModalProps {
  /** Modal title */
  title: string;
  /** Optional subtitle / description shown below the title */
  subtitle?: string;
  /** Label for the primary submit button (default: "Save") */
  submitLabel?: string;
  /** Label for the cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Whether the form is currently submitting */
  loading?: boolean;
  /** Error message to display above the footer */
  error?: string;
  /** Called when the form is submitted */
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  /** Called when modal should be closed */
  onClose: () => void;
  /** Form body content */
  children?: React.ReactNode;
  /** Max width class for the modal panel (default: "max-w-md") */
  maxWidth?: string;
}

export function FormModal({
  title,
  subtitle,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  loading = false,
  error,
  onSubmit,
  onClose,
  children,
  maxWidth = 'max-w-md',
}: FormModalProps) {
  // Close on backdrop click
  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  // Close on Escape key
  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-modal-title"
    >
      <div className={`bg-white rounded-lg shadow-xl w-full ${maxWidth} p-6 max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <h2 id="form-modal-title" className="text-lg font-semibold mb-1">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
        )}

        {/* Body form */}
        <form onSubmit={onSubmit} className="space-y-4">
          {children}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {/* Footer */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving…' : submitLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {cancelLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Convenience label + input wrapper for use inside FormModal.
 *
 * Automatically associates the label with its input via a generated id.
 *
 * Usage:
 *   <FormField label="API Key" required>
 *     <FormInput type="password" ... />
 *   </FormField>
 */
export interface FormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  /** Override the generated id used to link label ↔ input */
  id?: string;
  children: React.ReactElement;
}

let _counter = 0;

export function FormField({ label, required, hint, id, children }: FormFieldProps) {
  // Generate a stable id for label association
  const [fieldId] = React.useState(() => id ?? `form-field-${++_counter}`);

  // Clone the child element to inject the id prop
  const child = React.cloneElement(children, {
    id: fieldId,
    ...(required ? { 'aria-required': true } : {}),
  });

  return (
    <div>
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {hint && <span className="text-gray-400 font-normal ml-1">({hint})</span>}
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      {child}
    </div>
  );
}

/** Standard text/password/number input styled for FormModal */
export function FormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 ${props.className ?? ''}`}
    />
  );
}

/** Standard select styled for FormModal */
export function FormSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 ${props.className ?? ''}`}
    />
  );
}
