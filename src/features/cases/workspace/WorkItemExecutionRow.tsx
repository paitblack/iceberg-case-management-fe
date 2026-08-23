import React from 'react';
import {
  Check,
  CheckCircle2,
  Calendar,
  Shield,
  FileCheck,
  Slash,
  User,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import type {
  BffWorkspaceWorkItem,
  WorkItemActionType,
} from '../../../types/api';

interface WorkItemExecutionRowProps {
  workItem: BffWorkspaceWorkItem;
  onAction: (workItemId: string, action: WorkItemActionType) => Promise<void>;
  isLoading: boolean;
}

export const WorkItemExecutionRow: React.FC<WorkItemExecutionRowProps> = ({
  workItem,
  onAction,
  isLoading,
}) => {
  const isCompleted = workItem.status === 'Completed';
  const isWaived = workItem.status === 'Waived';
  const isPending = workItem.status === 'Pending';

  const canComplete = workItem.allowedActions?.includes('COMPLETE');
  const canWaive = workItem.allowedActions?.includes('WAIVE');

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
        isCompleted
          ? 'bg-emerald-50/40 border-emerald-200/80 text-emerald-950'
          : isWaived
            ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-75'
            : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
      }`}
    >
      {/* Left: Status Icon + Title + Metadata */}
      <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
        {/* Status Indicator Checkmark */}
        <div className="shrink-0 mt-0.5 sm:mt-0">
          {isCompleted ? (
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          ) : isWaived ? (
            <div className="w-5 h-5 rounded-full bg-slate-300 text-white flex items-center justify-center">
              <Slash className="w-3 h-3" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-transparent hover:border-[#E1007A] transition-colors" />
          )}
        </div>

        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-xs font-bold ${
                isCompleted
                  ? 'text-slate-800'
                  : isWaived
                    ? 'line-through text-slate-400'
                    : 'text-slate-900'
              }`}
            >
              {workItem.name || workItem.title}
            </span>

            {/* Badges */}
            {workItem.tag && (
              <Badge
                variant={
                  workItem.tag === 'Key Date'
                    ? 'keyDate'
                    : workItem.tag === 'Document Upload'
                      ? 'info'
                      : 'manual'
                }
                size="xs"
              >
                {workItem.tag}
              </Badge>
            )}

            <Badge
              variant={
                workItem.requirement === 'required'
                  ? 'required'
                  : workItem.requirement === 'conditional'
                    ? 'warning'
                    : 'default'
              }
              size="xs"
            >
              {workItem.requirement}
            </Badge>
          </div>

          {/* Optional Task Description */}
          {workItem.description && (
            <p className="text-[11px] text-slate-500 line-clamp-2">
              {workItem.description}
            </p>
          )}

          {/* Conditional Task Rule Notice */}
          {workItem.requirement === 'conditional' && workItem.condition && (
            <div className="text-[10px] text-amber-800 bg-amber-50/90 border border-amber-200/80 rounded-md px-2 py-0.5 w-fit font-medium flex items-center gap-1 my-0.5">
              <span className="font-bold">Condition:</span>
              <span>{workItem.condition}</span>
            </div>
          )}

          {/* Assigned Role & Completion Info */}
          <div className="flex flex-wrap items-center gap-x-3 text-[10px] text-slate-500 pt-0.5">
            {workItem.assignee ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-pink-50/80 border border-pink-200/70 text-[#E1007A] font-bold text-[10px]">
                <User className="w-3 h-3 text-[#E1007A] shrink-0" />
                <span>
                  {workItem.assignee.name}
                  {workItem.assignee.companyName
                    ? ` (${workItem.assignee.companyName})`
                    : ''}
                </span>
              </span>
            ) : (
              (workItem.role || workItem.ownerRoleId) && (
                <span className="flex items-center gap-1 text-slate-600 font-medium">
                  <Shield className="w-3 h-3 text-slate-400" />
                  Role: {workItem.role || workItem.ownerRoleId}
                </span>
              )
            )}

            {workItem.isKeyDate && (
              <span className="flex items-center gap-1 text-amber-600 font-bold">
                <Calendar className="w-3 h-3" />
                Key Date Milestone
              </span>
            )}

            {isCompleted && workItem.completedAt && (
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <FileCheck className="w-3 h-3 text-emerald-600" />
                Completed on{' '}
                {new Date(workItem.completedAt).toLocaleDateString()}{' '}
                {workItem.completedByUserName &&
                  `by ${workItem.completedByUserName}`}
              </span>
            )}

            {isWaived && (
              <span className="text-slate-400 italic">Waived by Authority</span>
            )}
          </div>
        </div>
      </div>

      {/* Right Action Buttons */}
      {isPending && (
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {canWaive && (
            <Button
              variant="ghost"
              size="xs"
              isLoading={isLoading}
              onClick={() => onAction(workItem.id, 'WAIVE')}
              className="text-slate-500 hover:text-slate-800"
            >
              Waive
            </Button>
          )}

          {canComplete && (
            <Button
              variant="primary"
              size="xs"
              isLoading={isLoading}
              onClick={() => onAction(workItem.id, 'COMPLETE')}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Complete Task
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
