import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
  Home,
  Layers,
  ChevronRight,
  MoreVertical,
  PauseCircle,
  PlayCircle,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Calendar,
  Clock,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { TrafficLightBadge } from '../../../components/ui/TrafficLightBadge';
import { usePermissions } from '../../auth/usePermissions';
import type { BffCaseItem, CaseStatusAction } from '../../../types/api';

interface CaseTableRowProps {
  item?: BffCaseItem;
  caseItem?: BffCaseItem;
  onOpen?: (caseId: string) => void;
  onClick?: () => void;
  onTriggerAction: (caseItem: BffCaseItem, action: CaseStatusAction) => void;
}

export const CaseTableRow: React.FC<CaseTableRowProps> = ({
  item,
  caseItem: legacyCaseItem,
  onOpen,
  onClick: legacyOnClick,
  onTriggerAction,
}) => {
  const caseItem = item || legacyCaseItem;
  const { canReopenCase } = usePermissions();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [menuPlacement, setMenuPlacement] = useState<'bottom' | 'top'>('bottom');
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // Smart placement for 3-dots menu
  useLayoutEffect(() => {
    if (!isMenuOpen || !menuContainerRef.current) return;
    const rect = menuContainerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < 200 && spaceAbove > 200) {
      setMenuPlacement('top');
    } else {
      setMenuPlacement('bottom');
    }
  }, [isMenuOpen]);

  // Click outside listener
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

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

  const handleActionClick = (e: React.MouseEvent, action: CaseStatusAction) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onTriggerAction(caseItem, action);
  };

  const isCancelled = caseItem.status === 'Cancelled';
  const isCompleted = caseItem.status === 'Completed';

  return (
    <tr
      onClick={handleClick}
      className="hover:bg-pink-50/20 transition-all cursor-pointer group border-b border-slate-100 last:border-b-0 relative hover:z-30"
    >
      {/* 1. Case Identity & Title */}
      <td className="py-4 px-4 min-w-[240px]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100/60 border border-pink-200/60 text-[#E1007A] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Home className="w-4 h-4" />
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="font-extrabold text-slate-900 group-hover:text-[#E1007A] transition-colors leading-snug line-clamp-1 text-sm">
              {caseItem.title}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {caseItem.reference && (
                <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100/80 px-1.5 py-0.5 rounded-md border border-slate-200/60">
                  {caseItem.reference}
                </span>
              )}
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                <Calendar className="w-3 h-3 text-slate-400" />
                {new Date(caseItem.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </td>

      {/* 2. Workflow Type */}
      <td className="py-4 px-4 whitespace-nowrap">
        <div className="inline-flex items-center gap-1.5 text-slate-700 font-semibold text-xs bg-slate-50 border border-slate-200/70 px-2.5 py-1 rounded-xl shadow-2xs">
          <Layers className="w-3.5 h-3.5 text-[#E1007A]" />
          <span>{caseItem.caseTypeName}</span>
        </div>
      </td>

      {/* 3. Status & Traffic Light Risk */}
      <td className="py-4 px-4 whitespace-nowrap relative">
        <div className="flex items-center gap-1.5 flex-wrap">
          {!isCancelled && !isCompleted && (
            <TrafficLightBadge
              status={caseItem.trafficLight?.status ?? 'green'}
              reasons={caseItem.trafficLight?.reasons ?? []}
              size="xs"
            />
          )}

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

          {isBlocked && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full shadow-2xs"
              title={`${caseItem.blockersCount} active blocker(s)`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              <span>{caseItem.blockersCount} Blockers</span>
            </span>
          )}
        </div>
      </td>

      {/* 4. Active Progression Milestone */}
      <td className="py-4 px-4 min-w-[200px]">
        {caseItem.currentStep ? (
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 shadow-xs ${
                caseItem.currentStep.status === 'Completed'
                  ? 'bg-emerald-500 shadow-emerald-200'
                  : caseItem.currentStep.status === 'InProgress'
                    ? 'bg-[#E1007A] animate-pulse shadow-pink-300'
                    : 'bg-slate-400'
              }`}
            />
            <span className="font-bold text-slate-800 text-xs truncate">
              {caseItem.currentStep.name}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 text-xs italic">
            No active milestone
          </span>
        )}
      </td>

      {/* 5. Next SLA Deadline */}
      <td className="py-4 px-4 whitespace-nowrap">
        {caseItem.sla?.targetDate ? (
          <div className="flex items-center gap-1.5">
            {caseItem.sla.isOverdue ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full animate-pulse shadow-2xs">
                <Clock className="w-3 h-3 text-rose-600" />
                <span>Overdue</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shadow-2xs">
                <Clock className="w-3 h-3 text-emerald-600" />
                <span>On Track</span>
              </span>
            )}
            <span className="font-mono text-slate-600 text-[11px] font-medium">
              {new Date(caseItem.sla.targetDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 text-xs italic">No SLA set</span>
        )}
      </td>

      {/* 6. Progress Bar */}
      <td className="py-4 px-4 min-w-[150px]">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] text-slate-500 font-medium">
              {progress.completedSteps}/{progress.totalSteps} steps
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
      </td>

      {/* 7. Quick Operational Actions */}
      <td className="py-4 px-4 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          {allowedActions.includes('REOPEN') && canReopenCase(caseItem) && (
            <button
              type="button"
              onClick={(e) => handleActionClick(e, 'REOPEN')}
              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-pink-50 text-[#E1007A] hover:bg-pink-100 border border-[#E1007A]/30 transition-all shrink-0 flex items-center gap-1 shadow-2xs hover:shadow-xs"
            >
              <RotateCcw className="w-3 h-3" /> Reopen
            </button>
          )}

          {allowedActions.includes('RESUME') && (
            <button
              type="button"
              onClick={(e) => handleActionClick(e, 'RESUME')}
              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all shrink-0 flex items-center gap-1 shadow-2xs hover:shadow-xs"
            >
              <PlayCircle className="w-3 h-3" /> Resume
            </button>
          )}

          {allowedActions.includes('HOLD') && (
            <button
              type="button"
              onClick={(e) => handleActionClick(e, 'HOLD')}
              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-all shrink-0 flex items-center gap-1 shadow-2xs hover:shadow-xs"
            >
              <PauseCircle className="w-3 h-3" /> Hold
            </button>
          )}

          {/* More Menu Popover */}
          <div ref={menuContainerRef} className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="More Actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className={`absolute right-0 w-48 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-[9999] animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/10 ${
                  menuPlacement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                }`}
                style={{ backgroundColor: '#ffffff' }}
              >
                <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Case Actions
                </div>

                {allowedActions.includes('REOPEN') && canReopenCase(caseItem) && (
                  <button
                    type="button"
                    onClick={(e) => handleActionClick(e, 'REOPEN')}
                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-[#E1007A] hover:bg-pink-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reopen Case</span>
                  </button>
                )}

                {allowedActions.includes('COMPLETE') && (
                  <button
                    type="button"
                    onClick={(e) => handleActionClick(e, 'COMPLETE')}
                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Complete Case</span>
                  </button>
                )}

                {allowedActions.includes('CANCEL') && (
                  <button
                    type="button"
                    onClick={(e) => handleActionClick(e, 'CANCEL')}
                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Cancel Case</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClick}
                  className="w-full px-3.5 py-2 text-left text-xs font-bold text-[#E1007A] hover:bg-pink-50 flex items-center justify-between border-t border-slate-100 mt-1 transition-colors cursor-pointer"
                >
                  <span>Open Workspace</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};
