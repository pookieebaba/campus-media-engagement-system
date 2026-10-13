import React from 'react';

const variantClasses = {
  // RSVP statuses
  going: 'bg-moss/10 text-moss-dark border border-moss/20',
  not_going: 'bg-destructive/10 text-destructive-dark border border-destructive/20',
  pending: 'bg-terracotta/10 text-terracotta-dark border border-terracotta/20',
  // Attendance statuses
  present: 'bg-moss/10 text-moss-dark border border-moss/20',
  absent: 'bg-destructive/10 text-destructive-dark border border-destructive/20',
  late: 'bg-terracotta/10 text-terracotta-dark border border-terracotta/20',
  excused: 'bg-sand text-foreground border border-border',
  // Event statuses
  draft: 'bg-stone text-foreground border border-border',
  published: 'bg-moss/10 text-moss-dark border border-moss/20',
  ongoing: 'bg-terracotta/10 text-terracotta-dark border border-terracotta/20',
  completed: 'bg-stone text-foreground border border-border',
  cancelled: 'bg-destructive/10 text-destructive-dark border border-destructive/20',
  // Roles
  head: 'bg-moss/10 text-moss-dark border border-moss/20',
  faculty: 'bg-terracotta/10 text-terracotta-dark border border-terracotta/20',
  student: 'bg-sand text-foreground border border-border',
  // Generic
  default: 'bg-stone text-foreground border border-border',
};

export function Badge({ variant = 'default', children, className = '' }) {
  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-body',
        variantClasses[variant] ?? variantClasses.default,
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}

export default Badge;
