import React from 'react';
import {
  Layers,
  CheckSquare,
  Users,
  FileText,
  MessageSquare,
  Shield,
  Clock,
  User,
  Tag,
} from 'lucide-react';
import type { BffCaseActivityItem, BffActivityCategory } from '../../../types/api';

interface ActivityItemCardProps {
  item: BffCaseActivityItem;
  isLast?: boolean;
}

const CATEGORY_CONFIG: Record<
  BffActivityCategory,
  {
    label: string;
    icon: React.ReactNode;
    badgeClass: string;
    iconBg: string;
    accentColor: string;
  }
> = {
  CASE_LIFECYCLE: {
    label: 'Case Lifecycle',
    icon: <Shield className="w-4 h-4" />,
    badgeClass: 'bg-pink-50 text-[#E1007A] border-pink-200/60',
    iconBg: 'bg-pink-50 text-[#E1007A] border-pink-200/80',
    accentColor: '#E1007A',
  },
  STEP: {
    label: 'Milestone',
    icon: <Layers className="w-4 h-4" />,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/60',
    iconBg: 'bg-blue-50 text-blue-700 border-blue-200/80',
    accentColor: '#2563EB',
  },
  WORK_ITEM: {
    label: 'Task Execution',
    icon: <CheckSquare className="w-4 h-4" />,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    accentColor: '#059669',
  },
  PARTICIPANT: {
    label: 'Stakeholders',
    icon: <Users className="w-4 h-4" />,
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/60',
    iconBg: 'bg-purple-50 text-purple-700 border-purple-200/80',
    accentColor: '#7C3AED',
  },
  DOCUMENT: {
    label: 'Documents & Evidence',
    icon: <FileText className="w-4 h-4" />,
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    iconBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    accentColor: '#4F46E5',
  },
  COMMUNICATION: {
    label: 'Communication',
    icon: <MessageSquare className="w-4 h-4" />,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/60',
    iconBg: 'bg-amber-50 text-amber-700 border-amber-200/80',
    accentColor: '#D97706',
  },
};

function formatTimestamp(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoStr;
  }
}

export const ActivityItemCard: React.FC<ActivityItemCardProps> = ({
  item,
  isLast = false,
}) => {
  const config = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.CASE_LIFECYCLE;

  const metadataEntries = Object.entries(item.metadata || {}).filter(
    ([key, value]) =>
      value !== null &&
      value !== undefined &&
      value !== '' &&
      !['id', 'caseId', 'stepId', 'workItemId'].includes(key),
  );

  return (
    <div className="relative flex items-start gap-3.5 group">
      {/* Vertical Timeline Connector Line */}
      {!isLast && (
        <div className="absolute left-4.5 top-9 bottom-0 w-0.5 bg-slate-200/80 group-hover:bg-slate-300 transition-colors -mb-3" />
      )}

      {/* Category Icon Badge */}
      <div
        className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs z-10 transition-transform group-hover:scale-105 ${config.iconBg}`}
      >
        {config.icon}
      </div>

      {/* Activity Card Body */}
      <div className="flex-1 min-w-0 iceberg-card p-4 border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all space-y-2.5 mb-3.5 bg-white">
        {/* Header: Title + Category Pill + Timestamp */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs md:text-sm font-extrabold text-slate-900 tracking-tight">
              {item.title}
            </h4>

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${config.badgeClass}`}
            >
              {config.label}
            </span>

            {item.action && (
              <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200/60">
                {item.action}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium shrink-0">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{formatTimestamp(item.createdAt)}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 leading-relaxed font-normal">
          {item.description}
        </p>

        {/* Metadata Details Chips */}
        {metadataEntries.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {metadataEntries.map(([key, val]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-lg shadow-2xs"
              >
                <Tag className="w-2.5 h-2.5 text-slate-400" />
                <span className="font-bold text-slate-500 capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}:
                </span>
                <span className="text-slate-800 font-semibold truncate max-w-[200px]">
                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* Footer: Actor Info */}
        {item.actor && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-500">
              <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200/80 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                {item.actor.name ? item.actor.name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
              </div>
              <span className="font-bold text-slate-800">{item.actor.name}</span>
              {item.actor.role && (
                <span className="text-[10px] text-slate-400 font-medium">
                  ({item.actor.role})
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
