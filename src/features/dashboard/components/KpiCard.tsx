import React from 'react';
import { cn } from '../../../lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'pink' | 'rose' | 'amber' | 'emerald' | 'blue';
  trend?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'pink',
  trend,
}) => {
  const variantStyles = {
    pink: {
      accent: 'border-t-[#E1007A]',
      iconBg: 'bg-pink-50 text-[#E1007A] border border-pink-200/60',
      badge: 'bg-pink-50 text-[#E1007A]',
      valueColor: 'text-slate-900',
    },
    rose: {
      accent: 'border-t-rose-500',
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-200/60',
      badge: 'bg-rose-50 text-rose-700',
      valueColor: 'text-slate-900',
    },
    amber: {
      accent: 'border-t-amber-500',
      iconBg: 'bg-amber-50 text-amber-700 border border-amber-200/60',
      badge: 'bg-amber-50 text-amber-800',
      valueColor: 'text-slate-900',
    },
    emerald: {
      accent: 'border-t-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
      badge: 'bg-emerald-50 text-emerald-800',
      valueColor: 'text-slate-900',
    },
    blue: {
      accent: 'border-t-blue-500',
      iconBg: 'bg-blue-50 text-blue-700 border border-blue-200/60',
      badge: 'bg-blue-50 text-blue-800',
      valueColor: 'text-slate-900',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className={cn(
        'iceberg-card p-5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all space-y-3.5 flex flex-col justify-between border-t-4',
        style.accent,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={cn('p-2.5 rounded-xl shadow-2xs', style.iconBg)}>
          {icon}
        </div>
      </div>

      <div>
        <div
          className={cn(
            'text-2xl lg:text-3xl font-extrabold tracking-tight',
            style.valueColor,
          )}
        >
          {value}
        </div>
        {subtitle && (
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {trend && (
        <div className="pt-2.5 border-t border-slate-100 text-[10px] font-bold flex items-center justify-between text-slate-500">
          <span className={cn('px-2 py-0.5 rounded-md', style.badge)}>
            {trend}
          </span>
        </div>
      )}
    </div>
  );
};
