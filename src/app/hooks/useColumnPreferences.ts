/**
 * useColumnPreferences — persist column visibility to localStorage.
 *
 * Usage:
 *   const { columns, setColumns } = useColumnPreferences('tests-columns', DEFAULT_COLUMNS);
 */

import { useState, useEffect } from 'react';

export interface ColumnDef {
  key: string;
  label: string;
  visible: boolean;
  width?: string;
}

export function useColumnPreferences<T extends ColumnDef>(
  storageKey: string,
  defaults: T[],
): { columns: T[]; setColumns: (cols: T[]) => void } {
  const [columns, setColumnsRaw] = useState<T[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved) as T[];
    } catch { /* use defaults */ }
    return defaults;
  });

  // Persist on change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(columns));
  }, [storageKey, columns]);

  return { columns, setColumns: setColumnsRaw };
}
