import React from 'react';
import {
  Layers,
  AlertTriangle,
  ChevronRight,
  Calendar,
  PauseCircle,
  PlayCircle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Home,
  Clock,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { TrafficLightBadge } from '../../../components/ui/TrafficLightBadge';
import { usePermissions } from '../../auth/usePermissions';
import type { BffCaseItem, CaseStatusAction } from '../../../types/api';

interface CaseCardProps {
  item?: BffCaseItem;
  caseItem?: BffCaseItem;
  onOpen?: (caseId: string) => void;
  onClick?: () => void;
  onTriggerAction?: (caseItem: BffCaseItem, action: CaseStatusAction) => void;
}

export const CaseCard: React.FC<CaseCardProps> = ({
  item,
  caseItem: legacyCaseItem,
  onOpen,
  onClick: legacyOnClick,
  onTriggerAction,
}) => {
  const caseItem = item || legacyCaseItem;
  const { canReopenCase } = usePermissions();
  if (!caseItem) return null;

  const handleClick = () => {
    if (onOpen) onOpen(caseItem.id);
    else if (legacyOnClick) legacyOnClick();
  };

  const isBlocked = (caseItem.blockersCount ?? 0) > 0;
  const allowedActions = caseItem.allowedActions || [];
  const progress = caseItem.progress || {
    totalSteps: 0,
    completedSteps: 0,
    percentage: 0,
  };

  const handleAction = (e: React.MouseEvent, action: CaseStatusAction) => {
    e.stopPropagation();
    if (onTriggerAction) {
      onTriggerAction(caseItem, action);
    }
  };

  const isCancelled = caseItem.status === 'Cancelled';
  const isCompleted = caseItem.status === 'Completed';

  return (
    <div
      onClick={handleClick}
      className="iceberg-card p-5 space-y-4 border border-slate-200/90 hover:border-[#E1007A]/50 hover:shadow-lg hover:shadow-pink-500/5 transition-all cursor-pointer group flex flex-col justify-between"
    >
      <div className="space-y-3.5">
        {/* Top Badges Bar */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {!isCancelled && !isCompleted && (
              <TrafficLightBadge
                status={caseItem.trafficLight?.status ?? 'green'}
                reasons={caseItem.trafficLight?.reasons ?? []}
                size="xs"
              />
            )}

            <Badge variant="info" size="xs">
              <Layers className="w-3 h-3 mr-1" />
              {caseItem.caseTypeName}
            </Badge>

            <Badge
              variant={
                caseItem.status === 'Open'
                  ? 'success'
                  : caseItem.status === 'OnHold'
                    ? 'warning'
                    : 'default'
              }
              size="xs"
            >
              {caseItem.statusLabel || caseItem.status}
            </Badge>
          </div>

          {isBlocked && (
            <span className="flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              {caseItem.blockersCount}{' '}
              {caseItem.blockersCount === 1 ? 'Blocker' : 'Blockers'}
            </span>
          )}
        </div>

        {/* Title & Reference */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100/60 border border-pink-200/60 text-[#E1007A] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform mt-0.5">
            <Home className="w-4 h-4" />
          </div>

          <div className="space-y-0.5 min-w-0 flex-1">
            <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#E1007A] transition-colors leading-snug line-clamp-2">
              {caseItem.title}
            </h3>
            {caseItem.reference && (
              <p className="text-[10px] font-mono font-semibold text-slate-400">
                {caseItem.reference}
              </p>
            )}
          </div>
        </div>

        {/* Current Progression Stage */}
        {caseItem.currentStep && (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  caseItem.currentStep.status === 'Completed'
                    ? 'bg-emerald-500'
                    : caseItem.currentStep.status === 'InProgress'
                      ? 'bg-[#E1007A] animate-pulse'
                      : 'bg-slate-400'
                }`}
              />
              <span className="text-[11px] text-slate-500 truncate">
                Current:
              </span>
              <span className="text-xs font-bold text-slate-800 truncate">
                {caseItem.currentStep.name}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-1">
              {caseItem.currentStep.statusLabel || caseItem.currentStep.status}
            </span>
          </div>
        )}

        {/* SLA Target Date Info */}
        {caseItem.sla?.targetDate && (
          <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Target SLA:</span>
            </span>
            <div className="flex items-center gap-1.5">
              {caseItem.sla.isOverdue ? (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md animate-pulse">
                  Overdue
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                  On Track
                </span>
              )}
              <span className="font-mono text-slate-700 font-medium">
                {new Date(caseItem.sla.targetDate).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progress Track, Quick Actions & Footer */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-[11px] text-slate-500">
              {progress.completedSteps} of {progress.totalSteps} steps
            </span>
            <span className="font-extrabold text-xs text-[#E1007A]">
              {progress.percentage}%
            </span>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
            <div
              className="h-full bg-gradient-to-r from-[#E1007A] to-[#FF4B9E] rounded-full transition-all duration-500 shadow-2xs"
              style={{ width: `${Math.min(100, Math.max(0, progress.percentage))}%` }}
            />
          </div>
        </div>

        {/* Quick Actions Buttons */}
        {allowedActions.length > 0 && onTriggerAction && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {allowedActions.includes('REOPEN') && canReopenCase(caseItem) && (
              <button
                type="button"
                onClick={(e) => handleAction(e, 'REOPEN')}
                className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-pink-50 text-[#E1007A] hover:bg-pink-100 border border-[#E1007A]/30 transition-colors flex items-center gap-1 shadow-2xs"
              >
                <RotateCcw className="w-3 h-3" /> Reopen
              </button>
            )}

            {allowedActions.includes('RESUME') && (
              <button
                type="button"
                onClick={(e) => handleAction(e, 'RESUME')}
                className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1 shadow-2xs"
              >
                <PlayCircle className="w-3 h-3" /> Resume
              </button>
            )}

            {allowedActions.includes('HOLD') && (
              <button
                type="button"
                onClick={(e) => handleAction(e, 'HOLD')}
                className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-1 shadow-2xs"
              >
                <PauseCircle className="w-3 h-3" /> Hold
              </button>
            )}

            {allowedActions.includes('COMPLETE') && (
              <button
                type="button"
                onClick={(e) => handleAction(e, 'COMPLETE')}
                className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1 shadow-2xs"
              >
                <CheckCircle className="w-3 h-3 text-emerald-600" /> Complete
              </button>
            )}

            {allowedActions.includes('CANCEL') && (
              <button
                type="button"
                onClick={(e) => handleAction(e, 'CANCEL')}
                className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1 shadow-2xs"
              >
                <XCircle className="w-3 h-3" /> Cancel
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span className="flex items-center gap-1 font-medium">
            <Calendar className="w-3 h-3" />
            {new Date(caseItem.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>

          <span className="flex items-center gap-1 font-bold text-slate-600 group-hover:text-[#E1007A] transition-colors">
            Open Workspace <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
