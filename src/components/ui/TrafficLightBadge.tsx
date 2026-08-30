import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, AlertCircle, Shield, X } from 'lucide-react';
import type { TrafficLightStatus } from '../../types/api';

interface TrafficLightBadgeProps {
  status?: TrafficLightStatus;
  reasons?: string[];
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  interactive?: boolean;
  className?: string;
}

function formatRiskReason(reason: string) {
  // Highlight quoted strings nicely as tokens
  const parts = reason.split(/("[^"]*")/g);
  return parts.map((part, i) => {
    if (part.startsWith('"') && part.endsWith('"')) {
      return (
        <span
          key={i}
          className="font-bold text-slate-900 bg-slate-200/70 px-1 py-0.5 rounded text-[10.5px]"
        >
          {part.slice(1, -1)}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export const TrafficLightBadge: React.FC<TrafficLightBadgeProps> = ({
  status = 'green',
  reasons = [],
  size = 'sm',
  showLabel = true,
  interactive = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const config = {
    green: {
      label: 'On Track',
      description: 'SLA and milestone progression are healthy without delay risk.',
      badgeClasses:
        'bg-emerald-50 text-emerald-700 border-emerald-200/90 hover:bg-emerald-100/70',
      dotClasses: 'bg-emerald-500 shadow-xs shadow-emerald-400',
      pingClasses: 'bg-emerald-400',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
      accentBorder: 'border-l-emerald-500',
    },
    amber: {
      label: 'At Risk',
      description: 'Tasks nearing SLA deadline (<= 3 days) or pending action.',
      badgeClasses:
        'bg-amber-50 text-amber-800 border-amber-200/90 hover:bg-amber-100/70',
      dotClasses: 'bg-amber-500 shadow-xs shadow-amber-400',
      pingClasses: 'bg-amber-400',
      icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
      accentBorder: 'border-l-amber-500',
    },
    red: {
      label: 'Action Required',
      description:
        'Critical overdue tasks or case is currently placed on hold.',
      badgeClasses:
        'bg-rose-50 text-rose-800 border-rose-200/90 hover:bg-rose-100/70',
      dotClasses: 'bg-rose-500 shadow-xs shadow-rose-400',
      pingClasses: 'bg-rose-400',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
      accentBorder: 'border-l-rose-500',
    },
  }[status];

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px] gap-1.5',
    sm: 'px-2.5 py-0.5 text-[11px] gap-1.5',
    md: 'px-3 py-1 text-xs gap-2',
    lg: 'px-3.5 py-1.5 text-sm gap-2',
  }[size];

  const dotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  }[size];

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${isOpen ? 'z-50' : 'z-10'} ${className}`}
    >
      <button
        type="button"
        onClick={(e) => {
          if (!interactive) return;
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => interactive && setIsOpen(true)}
        className={`inline-flex items-center font-bold rounded-full border transition-all cursor-pointer select-none ${config.badgeClasses} ${sizeClasses}`}
        aria-expanded={isOpen}
        title={reasons.length > 0 ? reasons.join(' • ') : config.description}
      >
        <span className="relative flex items-center justify-center">
          {status !== 'green' && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.pingClasses}`}
            />
          )}
          <span
            className={`relative inline-flex rounded-full ${dotSizes} ${config.dotClasses}`}
          />
        </span>
        {showLabel && <span className="tracking-tight">{config.label}</span>}
      </button>

      {/* Solid Opaque Popover Card */}
      {interactive && isOpen && (
        <div
          onMouseLeave={() => setIsOpen(false)}
          className={`absolute z-[9999] bottom-full left-0 mb-2 w-80 sm:w-96 rounded-2xl bg-white text-slate-800 shadow-2xl border border-slate-200 ring-1 ring-black/10 p-4 space-y-3 text-xs animate-in fade-in zoom-in-95 duration-150 border-l-4 ${config.accentBorder} opacity-100 backdrop-blur-none`}
          style={{ backgroundColor: '#ffffff' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 bg-white">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/80">
                {config.icon}
              </div>
              <div>
                <span className="font-extrabold text-slate-900 capitalize text-xs">
                  {config.label} Status
                </span>
                <p className="text-[10px] text-slate-400 font-medium">
                  Dynamic Risk Assessment
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Risk Drivers List */}
          {reasons.length > 0 ? (
            <div className="space-y-2 bg-white">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>Identified Risk Drivers</span>
                <span>{reasons.length} items</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {reasons.map((reason, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700 leading-relaxed text-[11px] whitespace-normal break-words"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      {formatRiskReason(reason)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-600 leading-relaxed font-normal bg-slate-50 p-3 rounded-xl border border-slate-100">
              {config.description}
            </div>
          )}

          {/* Popover Footer */}
          <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 bg-white">
            <span className="flex items-center gap-1 font-medium">
              <Shield className="w-3 h-3 text-[#E1007A]" />
              SLA Risk Engine v1.0
            </span>
            <span className="text-slate-400 font-mono text-[9px]">
              Live Telemetry
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
