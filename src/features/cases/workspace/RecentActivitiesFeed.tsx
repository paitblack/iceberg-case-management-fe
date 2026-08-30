import React from 'react';
import {
  History,
  ArrowRight,
  Layers,
  CheckSquare,
  Users,
  FileText,
  MessageSquare,
  Shield,
  Clock,
} from 'lucide-react';
import type { BffCaseActivityItem, BffActivityCategory } from '../../../types/api';

interface RecentActivitiesFeedProps {
  activities?: BffCaseActivityItem[];
  onViewFullTimeline: () => void;
}

const CATEGORY_ICON_MAP: Record<
  BffActivityCategory,
  { icon: React.ReactNode; bg: string }
> = {
  CASE_LIFECYCLE: {
    icon: <Shield className="w-3 h-3" />,
    bg: 'bg-pink-50 text-[#E1007A] border-pink-200/80',
  },
  STEP: {
    icon: <Layers className="w-3 h-3" />,
    bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
  },
  WORK_ITEM: {
    icon: <CheckSquare className="w-3 h-3" />,
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  },
  PARTICIPANT: {
    icon: <Users className="w-3 h-3" />,
    bg: 'bg-purple-50 text-purple-700 border-purple-200/80',
  },
  DOCUMENT: {
    icon: <FileText className="w-3 h-3" />,
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  },
  COMMUNICATION: {
    icon: <MessageSquare className="w-3 h-3" />,
    bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
  },
};

function formatRelativeTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return 'Recently';
  }
}

export const RecentActivitiesFeed: React.FC<RecentActivitiesFeedProps> = ({
  activities = [],
  onViewFullTimeline,
}) => {
  const displayItems = activities.slice(0, 5);

  return (
    <div className="iceberg-card p-4 space-y-3.5 border border-slate-200/90 shadow-2xs bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-pink-50 text-[#E1007A] border border-pink-200/60 shadow-2xs">
            <History className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-extrabold text-slate-900 tracking-tight">
            Recent Activity Stream
          </h4>
        </div>

        <button
          type="button"
          onClick={onViewFullTimeline}
          className="text-[11px] font-bold text-[#E1007A] hover:text-[#C00068] transition-colors inline-flex items-center gap-0.5 cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Activities List */}
      {displayItems.length === 0 ? (
        <div className="py-6 text-center text-slate-400 space-y-1">
          <History className="w-5 h-5 mx-auto text-slate-300" />
          <p className="text-[11px] font-medium">No recent events recorded</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayItems.map((item) => {
            const config =
              CATEGORY_ICON_MAP[item.category] || CATEGORY_ICON_MAP.CASE_LIFECYCLE;

            return (
              <div
                key={item.id}
                onClick={onViewFullTimeline}
                className="p-2.5 rounded-xl bg-slate-50/70 hover:bg-pink-50/40 border border-slate-200/70 hover:border-pink-200/80 transition-all cursor-pointer group flex items-start gap-2.5 shadow-2xs"
              >
                <div
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${config.bg}`}
                >
                  {config.icon}
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-bold text-slate-900 group-hover:text-[#E1007A] transition-colors truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>

                  <p className="text-[10.5px] text-slate-600 line-clamp-1 leading-snug">
                    {item.description}
                  </p>

                  {item.actor && (
                    <p className="text-[9.5px] text-slate-400 font-medium truncate pt-0.5">
                      by <span className="font-semibold text-slate-700">{item.actor.name}</span>
                      {item.actor.role ? ` (${item.actor.role})` : ''}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Link */}
      <button
        type="button"
        onClick={onViewFullTimeline}
        className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 text-center text-xs font-bold text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
      >
        <span>View Full Audit Trail</span>
        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
};
