import React from 'react';

interface CaseListSkeletonProps {
  viewMode: 'table' | 'grid';
  count?: number;
}

export const CaseListSkeleton: React.FC<CaseListSkeletonProps> = ({
  viewMode,
  count = 6,
}) => {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-4 shadow-2xs"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-28 bg-slate-200 rounded-lg" />
              <div className="h-4 w-16 bg-slate-200 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-5 w-3/4 bg-slate-200 rounded-lg" />
              <div className="h-3 w-1/2 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-8 bg-slate-100 rounded-xl" />
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="h-3 w-full bg-slate-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="iceberg-card overflow-hidden animate-pulse">
      <div className="p-4 space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0"
          >
            <div className="space-y-1 flex-1">
              <div className="h-4 w-48 bg-slate-200 rounded" />
              <div className="h-3 w-24 bg-slate-100 rounded" />
            </div>
            <div className="h-4 w-32 bg-slate-200 rounded hidden sm:block" />
            <div className="h-4 w-16 bg-slate-200 rounded-full" />
            <div className="h-3 w-28 bg-slate-100 rounded hidden md:block" />
            <div className="h-4 w-4 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};
