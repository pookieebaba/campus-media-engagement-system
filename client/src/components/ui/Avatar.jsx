import React from 'react';

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',   // 32px
  md: 'w-10 h-10 text-sm', // 40px
  lg: 'w-12 h-12 text-base', // 48px
};

// Deterministic color based on name string
const COLORS = [
  'bg-moss/20 text-moss-dark',
  'bg-terracotta/20 text-terracotta-dark',
  'bg-sand text-foreground',
  'bg-destructive/10 text-destructive-dark',
  'bg-stone text-foreground',
];

function getColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return COLORS[hash % COLORS.length];
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name = '', size = 'md', className = '' }) {
  return (
    <div
      className={[
        'inline-flex items-center justify-center rounded-full font-semibold font-body shrink-0',
        sizeClasses[size] ?? sizeClasses.md,
        getColor(name),
        className,
      ].join(' ')}
      aria-hidden="true"
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}

export default Avatar;
