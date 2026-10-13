import React, { forwardRef } from 'react';

export const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    required = false,
    id,
    className = '',
    wrapperClassName = '',
    rows = 4,
    ...props
  },
  ref
) {
  const textareaId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={['flex flex-col gap-1', wrapperClassName].join(' ')}>
      {label && (
        <label
          htmlFor={textareaId}
          className="text-sm font-semibold text-foreground font-body"
        >
          {label}
          {required && (
            <span className="text-destructive ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        required={required}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        className={[
          'w-full px-3 py-2 text-sm font-body text-foreground bg-background',
          'border rounded-xl transition-colors resize-vertical',
          error
            ? 'border-destructive focus:ring-destructive'
            : 'border-border focus:ring-moss',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          'placeholder:text-foreground/40',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        ].join(' ')}
        {...props}
      />
      {error && (
        <p
          id={`${textareaId}-error`}
          role="alert"
          className="text-xs text-destructive font-body mt-0.5"
        >
          {error}
        </p>
      )}
    </div>
  );
});

export default Textarea;
