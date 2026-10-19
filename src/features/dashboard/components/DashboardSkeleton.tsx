import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 5 KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-3 shadow-2xs"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="h-7 w-7 bg-slate-100 rounded-xl" />
            </div>
            <div className="h-8 w-24 bg-slate-200 rounded-lg" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Priority Operations Skeleton */}
      <div className="iceberg-card p-5 space-y-4">
        <div className="h-5 w-48 bg-slate-200 rounded-lg" />
        <div className="space-y-3 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0"
            >
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-64 bg-slate-200 rounded" />
                <div className="h-3 w-36 bg-slate-100 rounded" />
              </div>
              <div className="h-4 w-20 bg-slate-200 rounded-full" />
              <div className="h-4 w-28 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
