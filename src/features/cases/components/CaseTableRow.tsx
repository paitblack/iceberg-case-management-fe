import React from 'react';
import { Layers, AlertTriangle, ChevronRight } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import type { BffCaseItem } from '../../../types/api';

interface CaseTableRowProps {
  caseItem: BffCaseItem;
  onClick: () => void;
}

export const CaseTableRow: React.FC<CaseTableRowProps> = ({
  caseItem,
  onClick,
}) => {
  const isBlocked = caseItem.blockersCount > 0;

  return (
    <tr
      onClick={onClick}
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
              {caseItem.progress.completedSteps}/{caseItem.progress.totalSteps}{' '}
              steps
            </span>
            <span className="font-bold text-[#E1007A]">
              {caseItem.progress.percentage}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E1007A] rounded-full transition-all duration-500"
              style={{ width: `${caseItem.progress.percentage}%` }}
            />
          </div>
        </div>
      </td>

      {/* Created Date */}
      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-xs">
        {new Date(caseItem.createdAt).toLocaleDateString()}
      </td>

      {/* Actions */}
      <td className="py-3.5 px-4 text-right">
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#E1007A] transition-colors ml-auto" />
      </td>
    </tr>
  );
};
