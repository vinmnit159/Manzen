import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

type FilterValue = string | string[];
type FilterShape = Record<string, FilterValue>;

interface UseUrlFilterStateOptions<T extends FilterShape> {
  defaults: T;
  arrayKeys?: Array<keyof T>;
}

export function useUrlFilterState<T extends FilterShape>({ defaults, arrayKeys = [] }: UseUrlFilterStateOptions<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const arrayKeySet = useMemo(() => new Set(arrayKeys.map(String)), [arrayKeys]);

  const filters = useMemo(() => {
    const next = {} as T;
    for (const [key, defaultValue] of Object.entries(defaults)) {
      if (arrayKeySet.has(key)) {
        const raw = searchParams.get(key);
        next[key as keyof T] = (raw ? raw.split(',').filter(Boolean) : defaultValue) as T[keyof T];
      } else {
        next[key as keyof T] = (searchParams.get(key) ?? defaultValue) as T[keyof T];
      }
    }
    return next;
  }, [arrayKeySet, defaults, searchParams]);

  function update(updates: Partial<T>) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (arrayKeySet.has(key)) {
        const items = Array.isArray(value) ? value.filter(Boolean) : [];
        if (items.length === 0) next.delete(key);
        else next.set(key, items.join(','));
      } else {
        const text = String(value ?? '');
        if (!text) next.delete(key);
        else next.set(key, text);
      }
    }
    setSearchParams(next, { replace: true });
  }

  function reset() {
    const next = new URLSearchParams(searchParams);
    for (const key of Object.keys(defaults)) {
      next.delete(key);
    }
    setSearchParams(next, { replace: true });
  }

  return { filters, update, reset };
}
