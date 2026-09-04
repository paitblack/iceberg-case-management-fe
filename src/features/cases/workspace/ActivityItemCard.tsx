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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TECHNICAL_ID_KEY_REGEX = /^(id|_id|.*[iI]ds?)$/;

const EXCLUDED_KEYS = new Set([
  'content',
  'isPrivate',
  'entityType',
  'entityId',
  'storageKey',
  'hash',
  'checksum',
  'resourceVersion',
  'version',
  'aiSummaryLength',
  'aiSummary',
  'beforeState',
  'afterState',
  'rawMetadata',
  'action',
  'title',
  'mentionedParticipantName',
]);

const KEY_DISPLAY_LABELS: Record<string, string> = {
  stepName: 'Milestone',
  workItemName: 'Task',
  holdReason: 'Hold Reason',
  cancellationReason: 'Cancellation Reason',
  reopenReason: 'Reopen Reason',
  targetDate: 'Target Date',
  fileName: 'File',
  fileSize: 'Size',
  fileType: 'Type',
  roleName: 'Role',
  reason: 'Reason',
  status: 'Status',
};

function formatMetadataKey(key: string): string {
  if (KEY_DISPLAY_LABELS[key]) {
    return KEY_DISPLAY_LABELS[key];
  }
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function formatMetadataValue(key: string, val: unknown): string | null {
  if (val === null || val === undefined || val === '') {
    return null;
  }

  // Reject boolean values like isPrivate: false
  if (typeof val === 'boolean') {
    return null;
  }

  // Reject UUID strings
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (UUID_REGEX.test(trimmed)) {
      return null;
    }
    // Check if it's an ISO date string
    if (key.toLowerCase().includes('date') && !isNaN(Date.parse(trimmed))) {
      try {
        const d = new Date(trimmed);
        return d.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }

  // Handle arrays
  if (Array.isArray(val)) {
    if (val.length === 0) return null;
    const filtered = val
      .filter((v) => typeof v === 'string' && !UUID_REGEX.test(v.trim()))
      .map(String);
    if (filtered.length === 0) return null;
    return filtered.join(', ');
  }

  // Reject plain objects (should not dump raw JSON in UI chips)
  if (typeof val === 'object') {
    return null;
  }

  if (typeof val === 'number') {
    if (key.toLowerCase().includes('size')) {
      if (val < 1024) return `${val} B`;
      if (val < 1024 * 1024) return `${(val / 1024).toFixed(1)} KB`;
      return `${(val / (1024 * 1024)).toFixed(1)} MB`;
    }
    return String(val);
  }

  return String(val);
}

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

  const metadataEntries = Object.entries(item.metadata || {})
    .filter(([key]) => !EXCLUDED_KEYS.has(key) && !TECHNICAL_ID_KEY_REGEX.test(key))
    .map(([key, val]) => {
      const formattedVal = formatMetadataValue(key, val);
      return {
        key,
        label: formatMetadataKey(key),
        value: formattedVal,
      };
    })
    .filter((entry): entry is { key: string; label: string; value: string } => entry.value !== null);

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
            {metadataEntries.map(({ key, label, value }) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-lg shadow-2xs"
              >
                <Tag className="w-2.5 h-2.5 text-slate-400" />
                <span className="font-bold text-slate-500">
                  {label}:
                </span>
                <span className="text-slate-800 font-semibold truncate max-w-[280px]">
                  {value}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* Footer: Actor Info */}
        {item.actor && (item.actor.name || item.actor.role) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-500">
              <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200/80 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                {item.actor.name && !UUID_REGEX.test(item.actor.name)
                  ? item.actor.name.charAt(0).toUpperCase()
                  : <User className="w-3 h-3" />}
              </div>
              <span className="font-bold text-slate-800">
                {UUID_REGEX.test(item.actor.name || '')
                  ? 'System User'
                  : (item.actor.name || 'System')}
              </span>
              {item.actor.role && !UUID_REGEX.test(item.actor.role) && (
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
