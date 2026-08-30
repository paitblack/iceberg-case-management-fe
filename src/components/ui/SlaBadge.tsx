import React from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import type { SlaStatus } from '../../types/api';

interface SlaBadgeProps {
  slaStatus?: SlaStatus;
  targetDate?: string;
  size?: 'xs' | 'sm' | 'md';
  showDate?: boolean;
  className?: string;
}

export const SlaBadge: React.FC<SlaBadgeProps> = ({
  slaStatus,
  targetDate,
  size = 'xs',
  showDate = false,
  className = '',
}) => {
  if (!slaStatus || slaStatus === 'NONE') {
    if (!targetDate) return null;

    const formattedDate = new Date(targetDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });

    return (
      <span
        className={`inline-flex items-center gap-1 font-medium text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200 text-[10px] ${className}`}
      >
        <Calendar className="w-3 h-3 text-slate-400" />
        <span>Target: {formattedDate}</span>
      </span>
    );
  }

  const formatTargetDateText = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const config = {
    OVERDUE: {
      label: 'Overdue',
      icon: <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />,
      classes:
        'bg-rose-50 text-rose-700 border-rose-200 font-bold shadow-2xs animate-pulse',
    },
    AT_RISK: {
      label: 'Due Soon (<= 3d)',
      icon: <Clock className="w-3 h-3 text-amber-600 shrink-0" />,
      classes: 'bg-amber-50 text-amber-800 border-amber-200 font-bold shadow-2xs',
    },
    ON_TRACK: {
      label: 'On Track',
      icon: <Clock className="w-3 h-3 text-emerald-600 shrink-0" />,
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
    },
    COMPLETED_ON_TIME: {
      label: 'Completed On Time',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />,
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
    },
    COMPLETED_LATE: {
      label: 'Completed Late',
      icon: <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />,
      classes: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
    },
    NONE: {
      label: '',
      icon: null,
      classes: '',
    },
  }[slaStatus];

  if (!config.label) return null;

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-0.5 text-[11px] gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  }[size];

  const dateText = showDate && targetDate ? ` • ${formatTargetDateText(targetDate)}` : '';

  return (
    <span
      className={`inline-flex items-center rounded-md border ${config.classes} ${sizeClasses} ${className}`}
      title={targetDate ? `Target SLA: ${formatTargetDateText(targetDate)}` : undefined}
    >
      {config.icon}
      <span>{config.label}{dateText}</span>
    </span>
  );
};
