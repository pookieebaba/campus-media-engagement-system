import React from 'react';
import { Loader2 } from 'lucide-react';

const variantClasses = {
  primary:
    'bg-moss text-white hover:bg-moss-dark active:bg-moss-dark focus-visible:ring-moss',
  secondary:
    'bg-sand text-foreground hover:bg-border active:bg-border focus-visible:ring-moss',
  ghost:
    'bg-transparent text-moss hover:bg-stone active:bg-stone focus-visible:ring-moss',
  danger:
    'bg-destructive text-white hover:bg-destructive-dark active:bg-destructive-dark focus-visible:ring-destructive',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

const iconSizes = {
  sm: 14,
  md: 16,
  lg: 18,
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  children,
  className = '',
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-body font-semibold',
        'rounded-full transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        variantClasses[variant] ?? variantClasses.primary,
        sizeClasses[size] ?? sizeClasses.md,
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <Loader2 size={iconSizes[size]} className="animate-spin" />
      ) : (
        Icon && iconPosition === 'left' && <Icon size={iconSizes[size]} aria-hidden="true" />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon size={iconSizes[size]} aria-hidden="true" />
      )}
    </button>
  );
}

export default Button;
