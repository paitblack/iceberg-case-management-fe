import React from 'react';
import {
  MapPin,
  Calendar,
  User,
  Building2,
  TrendingUp,
  RotateCcw,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { TrafficLightBadge } from '../../../components/ui/TrafficLightBadge';
import { usePermissions } from '../../auth/usePermissions';
import type {
  BffWorkspaceSnapshot,
  CaseStatusAction,
} from '../../../types/api';
import { ExpectedDurationCard } from './ExpectedDurationCard';

interface WorkspaceHeaderProps {
  snapshot: BffWorkspaceSnapshot;
  onOpenStatusModal?: (action: CaseStatusAction) => void;
  showDurationCard?: boolean;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  snapshot,
  onOpenStatusModal,
  showDurationCard = true,
}) => {
  const { canReopenCase } = usePermissions();
  const allowedActions =
    snapshot.allowedActions !== undefined
      ? snapshot.allowedActions
      : snapshot.status === 'Open'
        ? (['HOLD', 'COMPLETE', 'CANCEL'] as CaseStatusAction[])
        : snapshot.status === 'OnHold'
          ? (['RESUME', 'CANCEL'] as CaseStatusAction[])
          : [];
  const steps = snapshot.steps || [];
  const mandatorySteps = steps.filter((s) => !s.isOptional);
  const completedMandatorySteps = mandatorySteps.filter(
    (s) => s.status === 'Completed' || s.status === 'Skipped',
  );
  const optionalStepsCount = steps.filter((s) => s.isOptional).length;
  const completedOptionalStepsCount = steps.filter(
    (s) => s.isOptional && (s.status === 'Completed' || s.status === 'Skipped'),
  ).length;

  const progressPercentage =
    mandatorySteps.length > 0
      ? Math.round(
          (completedMandatorySteps.length / mandatorySteps.length) * 100,
        )
      : snapshot.progressPercentage;

  const canReopen =
    (allowedActions.includes('REOPEN') ||
      snapshot.hasReopenPermission) &&
    canReopenCase(snapshot);
  const isClosed =
    snapshot.status === 'Completed' || snapshot.status === 'Cancelled';

  const headerCardContent = (
    <div className="iceberg-card p-5 sm:p-6 space-y-4 border border-slate-200/90 shadow-2xs bg-white rounded-2xl flex flex-col justify-between">
      {/* Top Header Row: Meta Badges + Actions & Financials */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-1">
        {/* Left: Metadata Tags */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-extrabold text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/90 shadow-2xs">
            {snapshot.reference}
          </span>
          <span className="text-xs font-bold text-[#E1007A] bg-pink-50/80 px-2.5 py-1 rounded-lg border border-pink-200/60">
            {snapshot.caseTypeName || 'Residential Property Sale'} (v
            {snapshot.templateVersion || 1}.0)
          </span>
          <Badge
            variant={
              snapshot.status === 'Open'
                ? 'success'
                : snapshot.status === 'OnHold' ||
                    snapshot.status === 'Cancelled'
                  ? 'warning'
                  : 'default'
            }
            size="sm"
          >
            {snapshot.status}
          </Badge>
          <TrafficLightBadge
            status={snapshot.trafficLight?.status ?? 'green'}
            reasons={snapshot.trafficLight?.reasons ?? []}
            size="sm"
          />
        </div>

        {/* Right: Agreed Price & Horizontal Lifecycle Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          {snapshot.agreedPrice !== undefined && (
            <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl px-3 py-1 text-left sm:text-right">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Agreed Sale Price
              </p>
              <p className="text-sm sm:text-base font-black text-slate-900 font-mono">
                £{snapshot.agreedPrice.toLocaleString('en-GB')}
              </p>
            </div>
          )}

          {onOpenStatusModal && (
            <div className="flex flex-wrap items-center gap-2">
              {/* RESUME */}
              {allowedActions.includes('RESUME') && (
                <button
                  type="button"
                  onClick={() => onOpenStatusModal('RESUME')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Resume Case</span>
                </button>
              )}

              {/* PUT ON HOLD */}
              {allowedActions.includes('HOLD') && (
                <button
                  type="button"
                  onClick={() => onOpenStatusModal('HOLD')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/90 transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-xs cursor-pointer"
                >
                  <PauseCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Put on Hold</span>
                </button>
              )}

              {/* CANCEL */}
              {allowedActions.includes('CANCEL') && (
                <button
                  type="button"
                  onClick={() => onOpenStatusModal('CANCEL')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/90 transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-xs cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Cancel Case</span>
                </button>
              )}

              {/* COMPLETE */}
              {allowedActions.includes('COMPLETE') && (
                <button
                  type="button"
                  onClick={() => onOpenStatusModal('COMPLETE')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-xs shadow-emerald-600/20 cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Complete Case</span>
                </button>
              )}

              {/* REOPEN */}
              {isClosed && canReopen && (
                <button
                  type="button"
                  onClick={() => onOpenStatusModal('REOPEN')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-pink-50 text-[#E1007A] hover:bg-pink-100 border border-[#E1007A]/40 transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#E1007A] shrink-0" />
                  <span>Reopen Case</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Middle Zone: Case Title & Context Metadata */}
      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight truncate">
          {snapshot.title}
        </h1>

        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-500 pt-0.5">
          {snapshot.propertyAddress &&
            snapshot.propertyAddress.trim().toLowerCase() !==
              snapshot.title.trim().toLowerCase() && (
              <span className="flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{snapshot.propertyAddress}</span>
              </span>
            )}
          <span className="flex items-center gap-1.5 font-medium">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{snapshot.branchName || 'Central Office Branch'}</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Progressor:</span>
            <strong className="text-slate-800 font-bold">
              {snapshot.assignedProgressorName || 'Operations Progressor'}
            </strong>
          </span>
          {snapshot.targetCompletionDate && (
            <span className="flex items-center gap-1.5 font-medium text-slate-700 bg-slate-100/90 px-2 py-0.5 rounded-md border border-slate-200/80">
              <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
              <span>
                Target: <strong>{snapshot.targetCompletionDate}</strong>
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Reopened Notice Banner */}
      {snapshot.status === 'Open' && snapshot.reopenReason && (
        <div className="p-3 rounded-xl bg-pink-50/80 border border-pink-200 flex items-start gap-2.5 text-xs shadow-2xs">
          <RotateCcw className="w-4 h-4 text-[#E1007A] shrink-0 mt-0.5" />
          <div className="space-y-0.5 flex-1 min-w-0">
            <p className="font-bold text-pink-950">This case was reopened</p>
            <p className="text-[11px] text-pink-800 leading-relaxed">
              <strong>Reason:</strong> {snapshot.reopenReason}
            </p>
          </div>
        </div>
      )}

      {/* Modern Progress Bar Strip */}
      <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100/90 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-6 h-6 rounded-lg bg-pink-100/80 text-[#E1007A] flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight">
              Workflow Progression Status
            </span>
            <span className="text-slate-500 text-[11px] font-medium">
              ({completedMandatorySteps.length} of {mandatorySteps.length}{' '}
              mandatory milestones complete
              {progressPercentage === 100 && ' — 100% Ready'})
            </span>
            {optionalStepsCount > 0 && (
              <span className="text-[10px] text-slate-400 font-medium">
                ({completedOptionalStepsCount}/{optionalStepsCount} optional done)
              </span>
            )}
          </div>
          <span className="font-mono font-black text-sm text-[#E1007A] bg-pink-50 border border-pink-200/80 px-2 py-0.5 rounded-md shadow-2xs">
            {progressPercentage}%
          </span>
        </div>

        {/* Animated Progress Track */}
        <div className="w-full h-2.5 bg-slate-200/70 rounded-full overflow-hidden p-0.5 border border-slate-200/90">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#E1007A] via-[#F43F5E] to-[#FB7185] transition-all duration-700 ease-out shadow-xs"
            style={{ width: `${Math.max(progressPercentage, 3)}%` }}
          />
        </div>
      </div>
    </div>
  );

  if (!showDurationCard) {
    return headerCardContent;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
      <div className="lg:col-span-8 xl:col-span-9 flex flex-col justify-between">
        {headerCardContent}
      </div>
      <div className="lg:col-span-4 xl:col-span-3 flex flex-col">
        <ExpectedDurationCard snapshot={snapshot} />
      </div>
    </div>
  );
};
