import React from 'react';
import { MapPin, Calendar, User, Building2, TrendingUp } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import type { BffWorkspaceSnapshot } from '../../../types/api';

interface WorkspaceHeaderProps {
  snapshot: BffWorkspaceSnapshot;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  snapshot,
}) => {
  const completedStepsCount = snapshot.steps.filter(
    (s) => s.status === 'Completed',
  ).length;

  return (
    <div className="iceberg-card p-6 space-y-5 border border-slate-200/90 shadow-xs">
      {/* Top Meta Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              {snapshot.reference}
            </span>
            <span className="text-xs font-semibold text-[#E1007A] bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100">
              {snapshot.caseTypeName} (v{snapshot.templateVersion}.0)
            </span>
            <Badge
              variant={
                snapshot.status === 'Open'
                  ? 'success'
                  : snapshot.status === 'OnHold'
                    ? 'warning'
                    : 'default'
              }
              size="sm"
            >
              {snapshot.status}
            </Badge>
          </div>

          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            {snapshot.title}
          </h1>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 pt-0.5">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {snapshot.propertyAddress}
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              {snapshot.branchName}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Progressor:{' '}
              <strong className="text-slate-700">
                {snapshot.assignedProgressorName}
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

        {/* Agreed Price Highlight */}
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

      {/* Progress Bar Section */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#E1007A]" />
            <span className="font-bold text-slate-800">
              Workflow Progression Status
            </span>
            <span className="text-slate-500 text-[11px]">
              ({completedStepsCount} of {snapshot.steps.length} milestones
              complete)
            </span>
          </div>
          <span className="font-extrabold text-sm text-[#E1007A]">
            {snapshot.progressPercentage}%
          </span>
        </div>

        {/* Animated Progress Track */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#E1007A] to-[#FF4B9E] transition-all duration-700 ease-out shadow-xs"
            style={{ width: `${Math.max(snapshot.progressPercentage, 3)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
