import React from 'react';
import {
  MapPin,
  Calendar,
  User,
  Building2,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import type {
  BffWorkspaceSnapshot,
  CaseStatusAction,
} from '../../../types/api';

interface WorkspaceHeaderProps {
  snapshot: BffWorkspaceSnapshot;
  onOpenStatusModal?: (action: CaseStatusAction) => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  snapshot,
  onOpenStatusModal,
}) => {
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

  const canReopen = snapshot.allowedActions?.includes('REOPEN');
  const isClosed =
    snapshot.status === 'Completed' || snapshot.status === 'Cancelled';

  return (
    <div className="iceberg-card p-6 space-y-5 border border-slate-200/90 shadow-xs">
      {/* Top Meta Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              {snapshot.reference}
            </span>
            <span className="text-xs font-semibold text-[#E1007A] bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100">
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
          </div>

          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight truncate">
            {snapshot.title}
          </h1>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 pt-0.5">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {snapshot.propertyAddress || snapshot.title}
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              {snapshot.branchName || 'Central Office Branch'}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Progressor:{' '}
              <strong className="text-slate-700">
                {snapshot.assignedProgressorName || 'Operations Progressor'}
              </strong>
            </span>
            {snapshot.targetCompletionDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Target: {snapshot.targetCompletionDate}
              </span>
            )}
          </div>
        </div>

        {/* Right Section: Price & Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {isClosed && canReopen && onOpenStatusModal && (
            <Button
              variant="outline"
              size="md"
              onClick={() => onOpenStatusModal('REOPEN')}
              leftIcon={<RotateCcw className="w-4 h-4 text-[#E1007A]" />}
              className="font-bold border-[#E1007A]/40 text-[#E1007A] hover:bg-pink-50 shadow-2xs"
            >
              Reopen Case
            </Button>
          )}

          {snapshot.agreedPrice !== undefined && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-right shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Agreed Sale Price
              </p>
              <p className="text-xl font-extrabold text-slate-900">
                £{snapshot.agreedPrice.toLocaleString('en-GB')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reopened Notice Banner */}
      {snapshot.status === 'Open' && snapshot.reopenReason && (
        <div className="p-3.5 rounded-xl bg-pink-50/80 border border-pink-200 flex items-start gap-2.5 text-xs shadow-2xs">
          <RotateCcw className="w-4 h-4 text-[#E1007A] shrink-0 mt-0.5" />
          <div className="space-y-0.5 flex-1 min-w-0">
            <p className="font-bold text-pink-950">This case was reopened</p>
            <p className="text-[11px] text-pink-800 leading-relaxed">
              <strong>Reason:</strong> {snapshot.reopenReason}
            </p>
          </div>
        </div>
      )}

      {/* Progress Bar Section */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <TrendingUp className="w-4 h-4 text-[#E1007A]" />
            <span className="font-bold text-slate-800">
              Workflow Progression Status
            </span>
            <span className="text-slate-500 text-[11px]">
              ({completedMandatorySteps.length} of {mandatorySteps.length}{' '}
              mandatory milestones complete
              {progressPercentage === 100 && ' — 100% Ready'})
            </span>
            {optionalStepsCount > 0 && (
              <span className="text-[10px] text-slate-400 font-medium">
                ({completedOptionalStepsCount}/{optionalStepsCount} optional
                done)
              </span>
            )}
          </div>
          <span className="font-extrabold text-sm text-[#E1007A]">
            {progressPercentage}%
          </span>
        </div>

        {/* Animated Progress Track */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#E1007A] to-[#FF4B9E] transition-all duration-700 ease-out shadow-xs"
            style={{ width: `${Math.max(progressPercentage, 3)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
