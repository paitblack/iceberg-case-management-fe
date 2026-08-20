import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'required'
    | 'optional'
    | 'conditional'
    | 'keyDate'
    | 'manual'
    | 'high'
    | 'medium'
    | 'low'
    | 'success'
    | 'info'
    | 'pink'
    | 'warning';
  size?: 'xs' | 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  size = 'sm',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200/60',
    required: 'bg-[#FDF2F8] text-[#E1007A] border-[#FBCFE8]',
    optional: 'bg-slate-100 text-slate-600 border-slate-200',
    conditional: 'bg-amber-50 text-amber-700 border-amber-200',
    keyDate: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    manual: 'bg-slate-100 text-slate-600 border-slate-200',
    high: 'bg-rose-50 text-rose-600 border-rose-200 font-medium',
    medium: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
    low: 'bg-sky-50 text-sky-700 border-sky-200 font-medium',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
    warning: 'bg-amber-50 text-amber-800 border-amber-300 font-medium',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    pink: 'bg-[#E1007A] text-white border-transparent',
  };

  const sizeStyles = {
    xs: 'text-[10px] px-2 py-0.5 font-medium leading-tight',
    sm: 'text-xs px-2.5 py-0.5 font-medium',
    md: 'text-sm px-3 py-1 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
};
