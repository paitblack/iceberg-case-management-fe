import {
  Check,
  CheckCircle2,
  Calendar,
  Shield,
  FileCheck,
  Slash,
  Lock,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { SlaBadge } from '../../../components/ui/SlaBadge';
import { InlineTargetDateEditor } from './InlineTargetDateEditor';
import type {
  BffWorkspaceWorkItem,
  BffCaseDocument,
  WorkItemActionType,
} from '../../../types/api';

interface WorkItemExecutionRowProps {
  workItem: BffWorkspaceWorkItem;
  documents?: BffCaseDocument[];
  isReadOnly?: boolean;
  onAction: (workItemId: string, action: WorkItemActionType) => Promise<void>;
  onUpdateTargetDate?: (targetDate: string | null) => Promise<void>;
  isLoading: boolean;
}

function formatRoleDisplayName(role?: string, ownerRoleId?: string): string {
  const roleText = role || ownerRoleId;
  if (!roleText) return 'Unassigned Role';

  const standardRoleMap: Record<string, string> = {
    'role-estate-agent': 'Estate Agent / Progressor',
    'role-vendor-solicitor': "Seller's Conveyancer / Solicitor",
    'role-buyer-solicitor': "Buyer's Conveyancer / Solicitor",
    'role-vendor': 'Seller / Vendor',
    'role-buyer': 'Buyer / Purchaser',
    'role-mortgage-broker': 'Mortgage Broker / Advisor',
    'role-surveyor': 'RICS Surveyor / Valuer',
  };

  if (standardRoleMap[roleText]) {
    return standardRoleMap[roleText];
  }

  if (!roleText.startsWith('role-')) {
    return roleText;
  }

  // If it's a slug like "role-halay-basi-12345", format it nicely
  const withoutPrefix = roleText.replace(/^role-/, '');
  const parts = withoutPrefix
    .split('-')
    .filter((p) => !/^[a-z0-9]{6,}$/i.test(p));
  if (parts.length > 0) {
    return parts.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return roleText;
}

export const WorkItemExecutionRow: React.FC<WorkItemExecutionRowProps> = ({
  workItem,
  documents = [],
  isReadOnly = false,
  onAction,
  onUpdateTargetDate,
  isLoading,
}) => {
  const isCompleted = workItem.status === 'Completed';
  const isWaived = workItem.status === 'Waived';

  const canComplete =
    !isReadOnly && workItem.allowedActions?.includes('COMPLETE');
  const canWaive = !isReadOnly && workItem.allowedActions?.includes('WAIVE');

  const linkedDoc = documents.find((d) => d.workItemId === workItem.id);

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
        isReadOnly
          ? 'bg-slate-50/70 border-slate-200 text-slate-500 opacity-80 select-none'
          : isCompleted
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
          {isReadOnly ? (
            <div className="w-5 h-5 rounded-full border border-slate-300 bg-slate-100 flex items-center justify-center text-slate-400">
              <Lock className="w-2.5 h-2.5 text-slate-400" />
            </div>
          ) : isCompleted ? (
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
              className={`text-xs ${
                isReadOnly
                  ? 'text-slate-600 font-semibold'
                  : isCompleted
                    ? 'text-slate-800 font-bold'
                    : isWaived
                      ? 'line-through text-slate-400'
                      : 'text-slate-900 font-bold'
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

            {workItem.evidenceRequired &&
              (linkedDoc ? (
                linkedDoc.downloadUrl ? (
                  <a
                    href={linkedDoc.downloadUrl}
                    download
                    className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-md px-1.5 py-0.5 font-bold hover:underline"
                  >
                    <FileCheck className="w-3 h-3 text-emerald-600" />
                    <span>Evidence: {linkedDoc.fileName}</span>
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-md px-1.5 py-0.5 font-bold">
                    <FileCheck className="w-3 h-3 text-emerald-600" />
                    <span>Evidence: {linkedDoc.fileName}</span>
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200/80 rounded-md px-1.5 py-0.5 font-medium">
                  <FileCheck className="w-3 h-3 text-amber-500" />
                  <span>Evidence Required</span>
                </span>
              ))}

            {/* SLA Badge & Target Date Selector */}
            <SlaBadge
              slaStatus={workItem.slaStatus}
              targetDate={workItem.targetDate}
              size="xs"
              showDate={false}
            />

            {onUpdateTargetDate && (
              <InlineTargetDateEditor
                targetDate={workItem.targetDate}
                onUpdateTargetDate={onUpdateTargetDate}
                title="Task Target Date"
                isReadOnly={isReadOnly || isCompleted || isWaived}
                size="xs"
              />
            )}
          </div>

          {/* Optional Task Description */}
          {workItem.description && (
            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
              {workItem.description}
            </p>
          )}

          {/* Conditional Task Rule Notice */}
          {workItem.requirement === 'conditional' && workItem.condition && (
            <div className="text-[10px] text-amber-800 bg-amber-50/90 border border-amber-200/80 rounded-md px-2 py-0.5 w-fit font-medium flex items-center gap-1.5 my-0.5">
              <span className="font-bold">Condition Rule:</span>
              <span>{workItem.condition}</span>
            </div>
          )}

          {/* Assigned Role & Assignee */}
          <div className="flex flex-wrap items-center gap-x-3 text-[10px] text-slate-500 pt-0.5">
            {(workItem.role || workItem.ownerRoleId || workItem.assignee) && (
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <Shield className="w-3 h-3 text-slate-400 shrink-0" />
                <span>
                  Role:{' '}
                  <span className="font-semibold text-slate-800">
                    {formatRoleDisplayName(workItem.role, workItem.ownerRoleId)}
                  </span>
                  {workItem.assignee && (
                    <span className="ml-1 text-[#E1007A] font-bold">
                      ({workItem.assignee.name}
                      {workItem.assignee.companyName
                        ? ` - ${workItem.assignee.companyName}`
                        : ''}
                      )
                    </span>
                  )}
                </span>
              </span>
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
              <span className="flex items-center gap-1 text-slate-500 font-medium italic">
                <Slash className="w-3 h-3" />
                Waived / Not required
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Task Actions */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {isReadOnly && (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/60">
            <Lock className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Locked</span>
          </div>
        )}

        {canWaive && (
          <Button
            variant="ghost"
            size="xs"
            isLoading={isLoading}
            onClick={() => onAction(workItem.id, 'WAIVE')}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
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
            className="font-bold text-[11px]"
          >
            Complete Task
          </Button>
        )}

        {!isReadOnly && isCompleted && (
          <Badge variant="success" size="xs">
            ✓ Done
          </Badge>
        )}

        {!isReadOnly && isWaived && (
          <Badge variant="default" size="xs">
            Waived
          </Badge>
        )}
      </div>
    </div>
  );
};
