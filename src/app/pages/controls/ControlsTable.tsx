import React from 'react';
import { Control, ColumnConfig, ControlStatus } from './types';

interface ControlsTableProps {
  controls: Control[];
  columns: ColumnConfig[];
  onSort?: (column: string) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

export function ControlsTable({ 
  controls, 
  columns, 
  onSort, 
  sortColumn, 
  sortDirection 
}: ControlsTableProps) {
  const getStatusColor = (status: ControlStatus) => {
    switch (status) {
      case ControlStatus.IMPLEMENTED:
        return 'bg-green-100 text-green-800';
      case ControlStatus.PARTIALLY_IMPLEMENTED:
        return 'bg-yellow-100 text-yellow-800';
      case ControlStatus.NOT_IMPLEMENTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSort = (columnId: string) => {
    if (onSort && columns.find(col => col.id === columnId)?.sortable) {
      onSort(columnId);
    }
  };

  const renderCell = (control: Control, column: ColumnConfig) => {
    switch (column.id) {
      case 'isoReference':
        return (
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
            {control.isoReference}
          </span>
        );
      
      case 'title':
        return (
          <span className="font-medium text-gray-900">
            {control.title}
          </span>
        );
      
      case 'description':
        return (
          <span className="text-gray-600 text-sm line-clamp-2">
            {control.description}
          </span>
        );
      
      case 'status':
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(control.status)}`}>
            {control.status.replace('_', ' ').toLowerCase()}
          </span>
        );
      
      case 'justification':
        return (
          <span className="text-gray-600 text-sm">
            {control.justification || '-'}
          </span>
        );
      
      case 'createdAt':
        return (
          <span className="text-sm text-gray-600">
            {new Date(control.createdAt).toLocaleDateString()}
          </span>
        );
      
      default:
        return null;
    }
  };

  const visibleColumns = columns.filter(col => col.visible);

  if (controls.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">No controls found</div>
        <p className="text-gray-400 text-sm mt-2">
          Try adjusting your filters or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {visibleColumns.map((column) => (
                <th
                  key={column.id}
                  onClick={() => handleSort(column.id)}
                  className={`px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  style={{ minWidth: column.minWidth }}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortColumn === column.id && (
                      <svg
                        className={`w-4 h-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {controls.map((control, index) => (
              <tr 
                key={control.id} 
                className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
              >
                {visibleColumns.map((column) => (
                  <td 
                    key={column.id} 
                    className="px-6 py-4 whitespace-nowrap align-top"
                  >
                    {renderCell(control, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}