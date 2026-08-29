import React, { useState } from 'react';
import {
  Layers,
  AlertTriangle,
  ChevronRight,
  MoreVertical,
  PauseCircle,
  PlayCircle,
  CheckCircle,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
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
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
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

  return (
    <tr
      onClick={handleClick}
      className="hover:bg-pink-50/30 transition-colors cursor-pointer group border-b border-slate-100"
    >
      {/* Title & Reference */}
      <td className="py-3.5 px-4 min-w-[220px]">
        <div className="font-bold text-slate-900 group-hover:text-[#E1007A] transition-colors leading-snug line-clamp-1">
          {caseItem.title}
        </div>
        {caseItem.reference && (
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
            {caseItem.reference}
          </div>
        )}
      </td>

      {/* Domain / Case Type */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5 text-slate-700 font-medium text-xs">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>{caseItem.caseTypeName}</span>
        </div>
      </td>

      {/* Status & Blockers */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
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
              title="Progression Blocker Active"
              className="flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full"
            >
              <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
              {caseItem.blockersCount}
            </span>
          )}
        </div>
      </td>

      {/* Current Progression Stage */}
      <td className="py-3.5 px-4 min-w-[180px]">
        {caseItem.currentStep ? (
          <div className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                caseItem.currentStep.status === 'Completed'
                  ? 'bg-emerald-500'
                  : caseItem.currentStep.status === 'InProgress'
                    ? 'bg-[#E1007A]'
                    : 'bg-slate-400'
              }`}
            />
            <span className="font-semibold text-slate-800 truncate text-xs">
              {caseItem.currentStep.name}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 italic text-xs">Not started</span>
        )}
      </td>

      {/* Progress Bar */}
      <td className="py-3.5 px-4 min-w-[140px]">
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-500 font-medium">
            <span>
              {progress.completedSteps}/{progress.totalSteps} steps
            </span>
            <span className="font-bold text-[#E1007A]">
              {progress.percentage}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E1007A] rounded-full transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      </td>

      {/* Created Date */}
      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-xs">
        {new Date(caseItem.createdAt).toLocaleDateString()}
      </td>

      {/* Quick Actions Dropdown / Trigger */}
      <td className="py-3.5 px-4 text-right relative">
        <div className="flex items-center justify-end gap-1.5">
          {/* Quick Action Button (Direct if RESUME or HOLD or REOPEN) */}
          {allowedActions.includes('REOPEN') && (
            <button
              type="button"
              onClick={(e) => handleActionClick(e, 'REOPEN')}
              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-pink-50 text-[#E1007A] hover:bg-pink-100 border border-[#E1007A]/30 transition-colors shrink-0 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reopen
            </button>
          )}

          {allowedActions.includes('RESUME') && (
            <button
              type="button"
              onClick={(e) => handleActionClick(e, 'RESUME')}
              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shrink-0 flex items-center gap-1"
            >
              <PlayCircle className="w-3 h-3" /> Resume
            </button>
          )}

          {allowedActions.includes('HOLD') && (
            <button
              type="button"
              onClick={(e) => handleActionClick(e, 'HOLD')}
              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors shrink-0 flex items-center gap-1"
            >
              <PauseCircle className="w-3 h-3" /> Hold
            </button>
          )}

          {/* More Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in"
              >
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Quick Actions
                </div>

                {allowedActions.includes('REOPEN') && (
                  <button
                    type="button"
                    onClick={(e) => handleActionClick(e, 'REOPEN')}
                    className="w-full px-3 py-1.5 text-left text-xs font-semibold text-[#E1007A] hover:bg-pink-50 flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reopen Case</span>
                  </button>
                )}

                {allowedActions.includes('COMPLETE') && (
                  <button
                    type="button"
                    onClick={(e) => handleActionClick(e, 'COMPLETE')}
                    className="w-full px-3 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Complete Case</span>
                  </button>
                )}

                {allowedActions.includes('CANCEL') && (
                  <button
                    type="button"
                    onClick={(e) => handleActionClick(e, 'CANCEL')}
                    className="w-full px-3 py-1.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Cancel Case</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClick}
                  className="w-full px-3 py-1.5 text-left text-xs font-semibold text-[#E1007A] hover:bg-pink-50 flex items-center gap-2 border-t border-slate-100 mt-1"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>Open Workspace</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};
