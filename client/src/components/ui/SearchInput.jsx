import React, { forwardRef } from 'react';
import { Search, X } from 'lucide-react';

export const SearchInput = forwardRef(function SearchInput(
  {
    value,
    onChange,
    onClear,
    placeholder = 'Search…',
    className = '',
    ...props
  },
  ref
) {
  return (
    <div className={['relative flex items-center', className].join(' ')}>
      <Search
        size={16}
        className="absolute left-3 text-foreground/40 pointer-events-none"
        aria-hidden="true"
      />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={[
          'w-full pl-9 pr-8 py-2 text-sm font-body text-foreground bg-background',
          'border border-border rounded-full transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-1',
          'placeholder:text-foreground/40',
        ].join(' ')}
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 p-0.5 rounded-full text-foreground/40 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
});

export default SearchInput;
