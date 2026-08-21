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
      bg: 'bg-pink-50/50',
      text: 'text-[#E1007A]',
      border: 'border-pink-100',
      iconBg: 'bg-[#FDF2F8] text-[#E1007A]',
    },
    rose: {
      bg: 'bg-rose-50/50',
      text: 'text-rose-600',
      border: 'border-rose-100',
      iconBg: 'bg-rose-100/80 text-rose-600',
    },
    amber: {
      bg: 'bg-amber-50/50',
      text: 'text-amber-700',
      border: 'border-amber-100',
      iconBg: 'bg-amber-100/80 text-amber-700',
    },
    emerald: {
      bg: 'bg-emerald-50/50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-100/80 text-emerald-700',
    },
    blue: {
      bg: 'bg-blue-50/50',
      text: 'text-blue-700',
      border: 'border-blue-100',
      iconBg: 'bg-blue-100/80 text-blue-700',
    },
  };

  const style = variantStyles[variant];

  return (
    <div className="iceberg-card p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={cn('p-2 rounded-xl', style.iconBg)}>{icon}</div>
      </div>

      <div>
        <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </div>
        {subtitle && (
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {trend && (
        <div className="pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-500 flex items-center gap-1">
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};
