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
      className={`iceberg-card p-5 lg:p-6 border border-slate-200/90 shadow-xs bg-white rounded-2xl flex flex-col justify-between h-full relative overflow-hidden ${className}`}
    >
      {/* Decorative subtle background gradient */}
      <div
        className={`absolute -right-12 -top-12 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-40 transition-colors ${
          isCompleted
            ? 'bg-emerald-200'
            : hasActiveEstimation
              ? 'bg-pink-100'
              : 'bg-slate-100'
        }`}
      />

      {/* Header Row: Icon, Title & Dynamic Status Badge */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-2xs shrink-0 ${
              isCompleted
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200/70'
                : hasActiveEstimation
                  ? 'bg-pink-50 text-[#E1007A] border-pink-200/70'
                  : 'bg-slate-50 text-slate-500 border-slate-200/70'
            }`}
          >
            <Timer className="w-4 h-4" />
          </div>
          <span className="text-sm font-extrabold text-slate-900 tracking-tight truncate">
            Expected Duration
          </span>
        </div>

        {/* State Badge */}
        {isCompleted ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0 shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Target Met</span>
          </span>
        ) : isCancelled ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shrink-0 shadow-2xs">
            <AlertCircle className="w-3 h-3 text-rose-500" />
            <span>Case Closed</span>
          </span>
        ) : hasActiveEstimation ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Pace</span>
          </span>
        ) : (
          <Badge
            variant="default"
            size="xs"
            className="bg-slate-100 text-slate-600 border border-slate-200/80 shrink-0 font-bold"
          >
            Pending 1st Milestone
          </Badge>
        )}
      </div>

      {/* Middle Metric Section */}
      <div className="my-4 relative z-10">
        {isCompleted ? (
          <div className="space-y-0.5">
            <div className="text-2xl md:text-3xl font-extrabold text-emerald-600 font-mono tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-7 h-7 text-emerald-500 shrink-0" />
              <span>Completed</span>
            </div>
            <p className="text-[11px] font-medium text-emerald-700">
              0 Days Remaining
            </p>
          </div>
        ) : isCancelled ? (
          <div className="space-y-0.5">
            <div className="text-2xl md:text-3xl font-extrabold text-slate-500 font-mono tracking-tight">
              Closed
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              Process discontinued
            </p>
          </div>
        ) : hasActiveEstimation ? (
          <div className="space-y-0.5">
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              ~{expectedCompletionDays}{' '}
              {expectedCompletionDays === 1 ? 'Day' : 'Days'}
            </div>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-xs font-semibold text-slate-700">
                Based on case pace & template benchmark
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            <div className="text-2xl md:text-3xl font-extrabold text-slate-400 font-mono tracking-tight">
              -- Days
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              Empirical regression awaiting initial data
            </p>
          </div>
        )}
      </div>

      {/* Bottom Context / Description */}
      <div className="pt-3 border-t border-slate-100 relative z-10 text-xs">
        {isCompleted ? (
          <p className="text-slate-500 leading-relaxed">
            All milestones successfully fulfilled. Target delivery achieved.
          </p>
        ) : isCancelled ? (
          <p className="text-slate-500 leading-relaxed">
            No remaining duration for cancelled case.
          </p>
        ) : hasActiveEstimation ? (
          <div className="flex items-center justify-between gap-2 text-slate-500">
            <span className="text-slate-500">Remaining milestones:</span>
            <span className="font-bold text-slate-800 font-mono">
              {remainingMandatoryCount} mandatory
            </span>
          </div>
        ) : (
          <p className="text-slate-500 leading-relaxed">
            Estimation activates automatically once the first step is completed
            based on empirical velocity.
          </p>
        )}
      </div>
    </div>
  );
};
