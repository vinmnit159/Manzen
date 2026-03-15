import { AlertTriangle, CheckCircle, Database } from 'lucide-react';

export function LoadingState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-gray-500">Loading tests…</p>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-red-200 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </div>
      <p className="text-base font-medium text-gray-900 mb-1">Failed to load tests</p>
      <button onClick={onRetry} className="mt-3 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm">
        Try again
      </button>
    </div>
  );
}

export function EmptyState({ hasFilters, onClear, onSeed }: { hasFilters: boolean; onClear: () => void; onSeed?: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <CheckCircle className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-base font-medium text-gray-900 mb-1">No tests found</p>
      <p className="text-sm text-gray-500 mb-4">
        {hasFilters ? 'No tests match your current filters.' : 'No tests have been created yet.'}
      </p>
      <div className="flex gap-2">
        {hasFilters && (
          <button onClick={onClear} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
            Clear filters
          </button>
        )}
        {onSeed && !hasFilters && (
          <button
            onClick={onSeed}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            Seed 14 Policy Tests
          </button>
        )}
      </div>
    </div>
  );
}
