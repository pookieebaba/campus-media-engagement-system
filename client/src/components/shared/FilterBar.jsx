import React from 'react';
import { SearchInput } from '../ui/SearchInput.jsx';

/**
 * filters: Array<{ name: string, label: string, options: Array<{value, label}> }>
 * values: object
 * onChange: (name, value) => void
 * onSearchChange: (value) => void
 * searchValue: string
 */
export function FilterBar({
  filters = [],
  values = {},
  onChange,
  searchValue = '',
  onSearchChange,
  onClearSearch,
  searchPlaceholder = 'Search…',
  className = '',
}) {
  return (
    <div className={['flex flex-wrap items-center gap-3', className].join(' ')}>
      {onSearchChange && (
        <SearchInput
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={onClearSearch}
          placeholder={searchPlaceholder}
          className="min-w-[200px]"
        />
      )}
      {filters.map((filter) => (
        <select
          key={filter.name}
          value={values[filter.name] ?? ''}
          onChange={(e) => onChange?.(filter.name, e.target.value)}
          aria-label={filter.label}
          className="px-3 py-2 text-sm font-body text-foreground bg-background border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-1 appearance-none"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}

export default FilterBar;
