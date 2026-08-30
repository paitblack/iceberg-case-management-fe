import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  History,
  RotateCw,
  Filter,
  Layers,
  CheckSquare,
  Users,
  FileText,
  MessageSquare,
  Shield,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { ActivityItemCard } from './ActivityItemCard';
import { fetchCaseActivities } from '../../../lib/api-client';
import type {
  BffCaseActivityItem,
  BffActivityCategory,
  BffCaseActivitiesResponse,
} from '../../../types/api';

interface ActivityTimelineTabProps {
  caseId: string;
}

type FilterOption = 'ALL' | BffActivityCategory;

const FILTER_PILLS: Array<{
  id: FilterOption;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: 'ALL', label: 'All Activities', icon: <History className="w-3.5 h-3.5" /> },
  { id: 'CASE_LIFECYCLE', label: 'Lifecycle', icon: <Shield className="w-3.5 h-3.5" /> },
  { id: 'STEP', label: 'Milestones', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'WORK_ITEM', label: 'Tasks', icon: <CheckSquare className="w-3.5 h-3.5" /> },
  { id: 'PARTICIPANT', label: 'Stakeholders', icon: <Users className="w-3.5 h-3.5" /> },
  { id: 'DOCUMENT', label: 'Documents', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'COMMUNICATION', label: 'Discussions', icon: <MessageSquare className="w-3.5 h-3.5" /> },
];

function getPeriodGroup(isoDate: string): string {
  try {
    const itemDate = new Date(isoDate);
    const now = new Date();

    const isToday =
      itemDate.getDate() === now.getDate() &&
      itemDate.getMonth() === now.getMonth() &&
      itemDate.getFullYear() === now.getFullYear();

    if (isToday) return 'Today';

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      itemDate.getDate() === yesterday.getDate() &&
      itemDate.getMonth() === yesterday.getMonth() &&
      itemDate.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return 'Yesterday';

    const diffTime = now.getTime() - itemDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) return 'This Week';

    return itemDate.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return 'Earlier';
  }
}

export const ActivityTimelineTab: React.FC<ActivityTimelineTabProps> = ({
  caseId,
}) => {
  const [activities, setActivities] = useState<BffCaseActivityItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<FilterOption>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(
    async (category: FilterOption, cursor?: string, isRefresh = false) => {
      if (cursor) {
        setIsLoadingMore(true);
      } else if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const queryParams = {
          category: category !== 'ALL' ? category : undefined,
          limit: 20,
          cursor,
        };

        const res: BffCaseActivitiesResponse = await fetchCaseActivities(
          caseId,
          queryParams,
        );

        if (cursor) {
          setActivities((prev) => [...prev, ...res.items]);
        } else {
          setActivities(res.items);
        }

        setNextCursor(res.meta.nextCursor);
        setHasMore(res.meta.hasMore);
        setTotalCount(res.meta.totalCount);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load activity stream.',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [caseId],
  );

  useEffect(() => {
    loadActivities(selectedCategory);
  }, [loadActivities, selectedCategory]);

  const handleCategorySelect = (category: FilterOption) => {
    setSelectedCategory(category);
  };

  const handleLoadMore = () => {
    if (nextCursor && !isLoadingMore) {
      loadActivities(selectedCategory, nextCursor);
    }
  };

  // Group activities chronologically by period
  const groupedActivities = useMemo(() => {
    const groups: { [key: string]: BffCaseActivityItem[] } = {};
    for (const item of activities) {
      const groupKey = getPeriodGroup(item.createdAt);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    }
    return groups;
  }, [activities]);

  const groupKeys = Object.keys(groupedActivities);

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls Bar */}
      <div className="iceberg-card p-4 space-y-3.5 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-50 text-[#E1007A] border border-pink-200/60 shadow-2xs">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Case Activity & Audit Trail</span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  {totalCount} events logged
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Domain-agnostic chronological event stream of all milestone executions, work items, and communications.
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            isLoading={isRefreshing}
            leftIcon={<RotateCw className="w-3.5 h-3.5" />}
            onClick={() => loadActivities(selectedCategory, undefined, true)}
            className="shrink-0 self-end md:self-center"
          >
            Refresh Stream
          </Button>
        </div>

        {/* Filter Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" /> Filter:
          </span>
          {FILTER_PILLS.map((pill) => {
            const isSelected = selectedCategory === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => handleCategorySelect(pill.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none shadow-2xs ${
                  isSelected
                    ? 'bg-[#E1007A] text-white shadow-pink-500/20'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                }`}
              >
                {pill.icon}
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <Spinner size="md" />
          <p className="text-xs font-semibold text-slate-400 animate-pulse">
            Loading activity timeline events...
          </p>
        </div>
      ) : activities.length === 0 ? (
        /* Empty State */
        <div className="iceberg-card p-12 text-center space-y-3 border border-slate-200/90 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <History className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-sm font-bold text-slate-800">
              No Activities Logged Yet
            </h4>
            <p className="text-xs text-slate-500">
              {selectedCategory !== 'ALL'
                ? `There are no recorded events for the "${selectedCategory}" category in this case.`
                : 'No activities have been recorded on this case instance yet.'}
            </p>
          </div>
          {selectedCategory !== 'ALL' && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategory('ALL')}
              >
                Clear Category Filter
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Grouped Timeline Stream */
        <div className="space-y-6">
          {groupKeys.map((groupKey) => {
            const groupItems = groupedActivities[groupKey] || [];
            return (
              <div key={groupKey} className="space-y-3">
                {/* Period Group Header Sticky Pill */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs border border-slate-200/80 shadow-2xs">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{groupKey}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({groupItems.length})
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-slate-200/70" />
                </div>

                {/* Timeline Items in Group */}
                <div className="pl-1">
                  {groupItems.map((item, idx) => (
                    <ActivityItemCard
                      key={item.id}
                      item={item}
                      isLast={idx === groupItems.length - 1}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Load More Pagination */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                isLoading={isLoadingMore}
                leftIcon={<History className="w-3.5 h-3.5" />}
                className="font-bold shadow-2xs"
              >
                Load More Activities
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
