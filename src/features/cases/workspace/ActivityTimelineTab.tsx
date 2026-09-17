import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  History,
  RotateCw,
  Filter,
  Layers,
  CheckSquare,
  Users,
  FileText,
  Calendar,
  AlertCircle,
  Search,
  X,
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

export type SmartPreset =
  'ALL' | 'CRITICAL' | 'STEPS' | 'TASKS' | 'DOCUMENTS' | 'MY_ACTIONS';

export type TimeframeOption =
  'ALL_TIME' | 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS';

const SMART_PRESETS: Array<{
  id: SmartPreset;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: 'ALL', label: 'All', icon: <History className="w-3.5 h-3.5" /> },
  {
    id: 'CRITICAL',
    label: 'Critical',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  { id: 'STEPS', label: 'Steps', icon: <Layers className="w-3.5 h-3.5" /> },
  {
    id: 'TASKS',
    label: 'Tasks',
    icon: <CheckSquare className="w-3.5 h-3.5" />,
  },
  {
    id: 'DOCUMENTS',
    label: 'Documents',
    icon: <FileText className="w-3.5 h-3.5" />,
  },
  {
    id: 'MY_ACTIONS',
    label: 'My Actions',
    icon: <Users className="w-3.5 h-3.5" />,
  },
];

const TIMEFRAME_OPTIONS: Array<{
  id: TimeframeOption;
  label: string;
}> = [
  { id: 'ALL_TIME', label: 'All Time' },
  { id: 'TODAY', label: 'Today' },
  { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
  { id: 'LAST_30_DAYS', label: 'Last 30 Days' },
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
  const [smartPreset, setSmartPreset] = useState<SmartPreset>('ALL');
  const [timeframe, setTimeframe] = useState<TimeframeOption>('ALL_TIME');
  const [searchTerm, setSearchTerm] = useState<string>('');

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

  const handleSmartPresetSelect = (preset: SmartPreset) => {
    setSmartPreset(preset);
    if (preset === 'TASKS') {
      setSelectedCategory('WORK_ITEM');
    } else if (preset === 'STEPS') {
      setSelectedCategory('STEP');
    } else if (preset === 'DOCUMENTS') {
      setSelectedCategory('DOCUMENT');
    } else if (preset === 'ALL') {
      setSelectedCategory('ALL');
    }
  };

  const handleResetFilters = () => {
    setSmartPreset('ALL');
    setTimeframe('ALL_TIME');
    setSearchTerm('');
    setSelectedCategory('ALL');
  };

  const handleLoadMore = () => {
    if (nextCursor && !isLoadingMore) {
      loadActivities(selectedCategory, nextCursor);
    }
  };

  // Client-side smart filtering (multi-criteria)
  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      // 1. Smart Preset Filter
      if (smartPreset === 'CRITICAL') {
        const isCritical =
          item.severity === 'CRITICAL' ||
          ['HOLD', 'CANCEL', 'REOPEN', 'SKIP', 'DISCARD', 'DELETE'].includes(
            item.action,
          );
        if (!isCritical) return false;
      } else if (smartPreset === 'STEPS') {
        if (item.category !== 'STEP' && item.category !== 'CASE_LIFECYCLE') {
          return false;
        }
      } else if (smartPreset === 'TASKS') {
        if (item.category !== 'WORK_ITEM') {
          return false;
        }
      } else if (smartPreset === 'DOCUMENTS') {
        if (item.category !== 'DOCUMENT') {
          return false;
        }
      } else if (smartPreset === 'MY_ACTIONS') {
        if (!item.actor?.id && !item.actor?.name) {
          return false;
        }
      }

      // 2. Timeframe Filter
      if (timeframe !== 'ALL_TIME') {
        try {
          const itemDate = new Date(item.createdAt);
          const now = new Date();
          if (timeframe === 'TODAY') {
            const isToday =
              itemDate.getDate() === now.getDate() &&
              itemDate.getMonth() === now.getMonth() &&
              itemDate.getFullYear() === now.getFullYear();
            if (!isToday) return false;
          } else if (timeframe === 'LAST_7_DAYS') {
            const diffDays =
              (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays > 7) return false;
          } else if (timeframe === 'LAST_30_DAYS') {
            const diffDays =
              (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays > 30) return false;
          }
        } catch {
          // ignore parsing error
        }
      }

      // 3. Live Text Search Filter
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchDesc = item.description.toLowerCase().includes(query);
        const matchActor = item.actor?.name?.toLowerCase().includes(query);
        const matchStep = item.context?.stepName?.toLowerCase().includes(query);
        const matchWorkItem = item.context?.workItemName
          ?.toLowerCase()
          .includes(query);
        const matchFile = item.context?.fileName?.toLowerCase().includes(query);
        const matchMetadata = Object.values(item.metadata || {}).some(
          (v) => typeof v === 'string' && v.toLowerCase().includes(query),
        );

        if (
          !matchTitle &&
          !matchDesc &&
          !matchActor &&
          !matchStep &&
          !matchWorkItem &&
          !matchFile &&
          !matchMetadata
        ) {
          return false;
        }
      }

      return true;
    });
  }, [activities, smartPreset, timeframe, searchTerm]);

  // Group activities chronologically by period (without collapsing items)
  const groupedActivities = useMemo(() => {
    const groups: { [key: string]: BffCaseActivityItem[] } = {};
    for (const item of filteredActivities) {
      const groupKey = getPeriodGroup(item.createdAt);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    }
    return groups;
  }, [filteredActivities]);

  const groupKeys = Object.keys(groupedActivities);
  const isFiltered =
    smartPreset !== 'ALL' ||
    timeframe !== 'ALL_TIME' ||
    searchTerm.trim() !== '' ||
    selectedCategory !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Header & Smart Filter Controls Bar */}
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
                {isFiltered && (
                  <span className="text-[10px] font-bold text-[#E1007A] bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200/60">
                    Showing {filteredActivities.length} of {activities.length}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chronological activity log of step progression, tasks,
                documents, and communications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Clear filters
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              isLoading={isRefreshing}
              leftIcon={<RotateCw className="w-3.5 h-3.5" />}
              onClick={() => loadActivities(selectedCategory, undefined, true)}
              className="shrink-0"
            >
              Refresh Stream
            </Button>
          </div>
        </div>

        {/* Smart Presets & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          {/* Smart Preset Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" /> Filter:
            </span>
            {SMART_PRESETS.map((preset) => {
              const isSelected = smartPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSmartPresetSelect(preset.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none shadow-2xs ${
                    isSelected
                      ? 'bg-[#E1007A] text-white shadow-pink-500/20'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                  }`}
                >
                  {preset.icon}
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>

          {/* Controls: Search Box + Timeframe Dropdown */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            {/* Live Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search activities, tasks, actors..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E1007A]/20 focus:border-[#E1007A] transition-all text-slate-800 placeholder:text-slate-400 font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md cursor-pointer"
                  aria-label="Clear search input"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Timeframe Selector */}
            <div className="relative shrink-0">
              <select
                value={timeframe}
                onChange={(e) =>
                  setTimeframe(e.target.value as TimeframeOption)
                }
                className="pl-2.5 pr-7 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E1007A]/20 focus:border-[#E1007A] transition-all cursor-pointer appearance-none"
              >
                {TIMEFRAME_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Calendar className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
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
      ) : filteredActivities.length === 0 ? (
        /* Empty State */
        <div className="iceberg-card p-12 text-center space-y-3 border border-slate-200/90 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <History className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">
              {isFiltered
                ? 'No Matching Activities'
                : 'No Activities Logged Yet'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isFiltered
                ? 'Try adjusting your smart filters, search query, or timeframe.'
                : 'As milestones progress, tasks are completed, or communications occur, they will appear here in chronological order.'}
            </p>
          </div>
          {isFiltered && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetFilters}
              className="mt-2 text-xs"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        /* Chronological Timeline Stream (No Collapsing) */
        <div className="space-y-6">
          {groupKeys.map((periodKey) => {
            const periodItems = groupedActivities[periodKey];
            if (!periodItems || periodItems.length === 0) return null;

            return (
              <div key={periodKey} className="space-y-3">
                {/* Period Section Header */}
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/60">
                    {periodKey}
                  </span>
                  <div className="h-px bg-slate-200/80 flex-1" />
                </div>

                {/* Individual Activity Items List */}
                <div className="pl-1 sm:pl-3 space-y-1">
                  {periodItems.map((item, idx) => (
                    <ActivityItemCard
                      key={item.id}
                      item={item}
                      isLast={idx === periodItems.length - 1}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-2 text-center">
              <Button
                variant="secondary"
                size="sm"
                isLoading={isLoadingMore}
                onClick={handleLoadMore}
                className="text-xs font-semibold px-4"
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
