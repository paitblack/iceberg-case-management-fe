import React from 'react';
import { Timer, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import type { BffWorkspaceSnapshot } from '../../../types/api';

export interface ExpectedDurationCardProps {
  snapshot: BffWorkspaceSnapshot;
  className?: string;
}

export const ExpectedDurationCard: React.FC<ExpectedDurationCardProps> = ({
  snapshot,
  className = '',
}) => {
  const { status, expectedCompletionDays, steps = [] } = snapshot;

  const mandatorySteps = steps.filter((s) => !s.isOptional);
  const completedMandatorySteps = mandatorySteps.filter(
    (s) => s.status === 'Completed' || s.status === 'Skipped',
  );
  const remainingMandatoryCount = Math.max(
    0,
    mandatorySteps.length - completedMandatorySteps.length,
  );

  const isCompleted = status === 'Completed' || expectedCompletionDays === 0;
  const isCancelled = status === 'Cancelled';
  const hasActiveEstimation =
    !isCompleted &&
    !isCancelled &&
    typeof expectedCompletionDays === 'number' &&
    expectedCompletionDays > 0;

  return (
    <div
      data-testid="expected-duration-card"
      className={`iceberg-card px-3 py-2 border border-slate-200/90 shadow-2xs bg-white rounded-2xl flex flex-col justify-between relative overflow-hidden ${className}`}
    >
      {/* Decorative subtle background gradient */}
      <div
        className={`absolute -right-8 -top-8 w-24 h-24 rounded-full blur-xl pointer-events-none opacity-30 transition-colors ${
          isCompleted
            ? 'bg-emerald-200'
            : hasActiveEstimation
              ? 'bg-pink-100'
              : 'bg-slate-100'
        }`}
      />

      {/* Header Row: Icon, Title & Dynamic Status Badge */}
      <div className="flex items-center justify-between gap-2 relative z-10 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center border shadow-2xs shrink-0 ${
              isCompleted
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200/70'
                : hasActiveEstimation
                  ? 'bg-pink-50 text-[#E1007A] border-pink-200/70'
                  : 'bg-slate-50 text-slate-500 border-slate-200/70'
            }`}
          >
            <Timer className="w-3 h-3" />
          </div>
          <span className="text-[11px] font-bold text-slate-900 tracking-tight truncate">
            Expected Duration
          </span>
        </div>

        {/* State Badge */}
        {isCompleted ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
            <span>Target Met</span>
          </span>
        ) : isCancelled ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shrink-0">
            <AlertCircle className="w-2.5 h-2.5 text-rose-500" />
            <span>Case Closed</span>
          </span>
        ) : hasActiveEstimation ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Pace</span>
          </span>
        ) : (
          <Badge
            variant="default"
            size="xs"
            className="bg-slate-100 text-slate-600 border border-slate-200/80 shrink-0 font-semibold text-[8.5px] py-0 px-1.5"
          >
            Pending 1st Milestone
          </Badge>
        )}
      </div>

      {/* Middle Metric Section */}
      <div className="relative z-10 my-0.5 shrink-0">
        {isCompleted ? (
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-base font-extrabold text-emerald-600 font-mono tracking-tight flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Completed</span>
            </div>
            <p className="text-[10px] font-medium text-emerald-700">
              0 Days Remaining
            </p>
          </div>
        ) : isCancelled ? (
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-base font-extrabold text-slate-500 font-mono tracking-tight">
              Closed
            </div>
            <p className="text-[10px] font-medium text-slate-400">
              Process discontinued
            </p>
          </div>
        ) : hasActiveEstimation ? (
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-base font-extrabold text-slate-900 font-mono tracking-tight">
              ~{expectedCompletionDays}{' '}
              {expectedCompletionDays === 1 ? 'Day' : 'Days'}
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[10px] font-medium text-slate-600 truncate">
                {remainingMandatoryCount} mandatory remaining
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-base font-extrabold text-slate-400 font-mono tracking-tight">
              -- Days
            </div>
            <p className="text-[10px] font-medium text-slate-400 truncate">
              Empirical regression awaiting initial data
            </p>
          </div>
        )}
      </div>

      {/* Bottom Context / Description (Compact 1-line for test compatibility & clarity) */}
      <div className="pt-1 border-t border-slate-100 relative z-10 text-[9.5px] text-slate-400 leading-tight truncate shrink-0">
        {isCompleted ? (
          <p className="truncate">
            All milestones successfully fulfilled. Target delivery achieved.
          </p>
        ) : isCancelled ? (
          <p className="truncate">
            No remaining duration for cancelled case.
          </p>
        ) : hasActiveEstimation ? (
          <p className="truncate">
            Based on case pace & template benchmark velocity.
          </p>
        ) : (
          <p className="truncate">
            Estimation activates automatically once the first step is completed
            based on empirical velocity.
          </p>
        )}
      </div>
    </div>
  );
};
