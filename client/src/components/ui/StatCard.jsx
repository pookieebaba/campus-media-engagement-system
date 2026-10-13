import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,         // { value: number, label: string }
  className = '',
}) {
  const trendUp = trend?.value > 0;
  const trendDown = trend?.value < 0;

  return (
    <div
      className={[
        'bg-stone rounded-2xl shadow-card p-5 flex flex-col gap-3',
        className,
      ].join(' ')}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold font-body text-foreground/60 uppercase tracking-wider">
          {label}
        </p>
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-moss/10 flex items-center justify-center shrink-0">
            <Icon size={18} className="text-moss" aria-hidden="true" />
          </div>
        )}
      </div>

      <p className="font-heading text-3xl font-semibold text-foreground">
        {value ?? '—'}
      </p>

      {trend && (
        <div className="flex items-center gap-1 text-xs font-body">
          {trendUp && <TrendingUp size={14} className="text-moss" aria-hidden="true" />}
          {trendDown && <TrendingDown size={14} className="text-destructive" aria-hidden="true" />}
          <span
            className={
              trendUp
                ? 'text-moss font-semibold'
                : trendDown
                ? 'text-destructive font-semibold'
                : 'text-foreground/60'
            }
          >
            {trend.value > 0 ? '+' : ''}
            {trend.value}
          </span>
          {trend.label && (
            <span className="text-foreground/40">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default StatCard;
