import type { ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';

function getEmptySelectValue(key: string) {
  return `__empty__${key}`;
}

export interface FilterSelectOption {
  value: string;
  label: string;
}

export interface FilterSelectConfig {
  key: string;
  value: string;
  placeholder: string;
  options: FilterSelectOption[];
  onChange: (value: string) => void;
}

export interface ActiveFilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface PageFilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  selects?: FilterSelectConfig[];
  auxiliary?: ReactNode;
  resultCount?: number;
  resultLabel?: string;
  activeFilters?: ActiveFilterChip[];
  onClearAll?: () => void;
  className?: string;
}

export function PageFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search',
  selects = [],
  auxiliary,
  resultCount,
  resultLabel = 'results',
  activeFilters = [],
  onClearAll,
  className,
}: PageFilterBarProps) {
  return (
    <Card className={cn('p-4 sm:p-5', className)}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.6fr))]">
            {onSearchChange ? (
              <div className="relative md:col-span-2 xl:col-span-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchValue ?? ''}
                  onChange={(event) => onSearchChange(event.target.value)}
                  className="pl-9"
                  placeholder={searchPlaceholder}
                />
              </div>
            ) : null}

            {selects.map((select) => (
              <Select
                key={select.key}
                value={select.value === '' ? getEmptySelectValue(select.key) : select.value}
                onValueChange={(value) => select.onChange(value === getEmptySelectValue(select.key) ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={select.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {select.options.map((option) => (
                    <SelectItem
                      key={`${select.key}-${option.value || 'empty'}`}
                      value={option.value === '' ? getEmptySelectValue(select.key) : option.value}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 xl:min-w-[12rem] xl:justify-end">
            {typeof resultCount === 'number' ? (
              <div className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">{resultCount}</span> {resultLabel}
              </div>
            ) : null}
            {onClearAll ? (
              <Button variant="ghost" size="sm" onClick={onClearAll}>
                Clear all
              </Button>
            ) : null}
          </div>
        </div>

        {auxiliary ? <div>{auxiliary}</div> : null}

        {activeFilters.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Active filters</span>
            {activeFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={filter.onRemove}
                className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
              >
                <span>{filter.label}</span>
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
