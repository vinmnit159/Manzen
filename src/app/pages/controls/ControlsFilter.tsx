import React, { useState } from 'react';
import { ControlFilter, ControlStatus } from './types';

interface ControlsFilterProps {
  filter: ControlFilter;
  onFilterChange: (filter: ControlFilter) => void;
  onClearFilters: () => void;
}

export function ControlsFilter({ filter, onFilterChange, onClearFilters }: ControlsFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (field: keyof ControlFilter, value: any) => {
    onFilterChange({
      ...filter,
      [field]: value,
    });
  };

  const clearFilters = () => {
    onClearFilters();
  };

  const hasActiveFilters = filter.search || filter.status || filter.isoReference;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
        >
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* Search */}
          <div>
            <label htmlFor="search-control" className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              id="search-control"
              type="text"
              value={filter.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by title or description..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status-filter"
              value={filter.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All Statuses</option>
              <option value={ControlStatus.NOT_IMPLEMENTED}>Not Implemented</option>
              <option value={ControlStatus.PARTIALLY_IMPLEMENTED}>Partially Implemented</option>
              <option value={ControlStatus.IMPLEMENTED}>Implemented</option>
            </select>
          </div>

          {/* ISO Reference Filter */}
          <div>
            <label htmlFor="iso-filter" className="block text-sm font-medium text-gray-700 mb-2">
              ISO Reference
            </label>
            <input
              id="iso-filter"
              type="text"
              value={filter.isoReference}
              onChange={(e) => handleFilterChange('isoReference', e.target.value)}
              placeholder="e.g., A.5.1, A.8.1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Clear Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}