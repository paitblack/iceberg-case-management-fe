import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ChevronRight,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import type { BffPriorityOperationItem } from '../../../types/api';

interface PriorityOperationsListProps {
  items: BffPriorityOperationItem[];
}

export const PriorityOperationsList: React.FC<PriorityOperationsListProps> = ({
  items,
}) => {
  const navigate = useNavigate();

  const formatDueDate = (dateStr?: string) => {
    if (!dateStr)
      return { label: 'No Deadline', isOverdue: false, isToday: false };
    const target = new Date(dateStr);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `${Math.abs(diffDays)} days overdue`,
        isOverdue: true,
        isToday: false,
      };
    }
    if (diffDays === 0) {
      return { label: 'Due Today', isOverdue: false, isToday: true };
    }
    if (diffDays === 1) {
      return { label: 'Due Tomorrow', isOverdue: false, isToday: false };
    }
    return { label: `In ${diffDays} days`, isOverdue: false, isToday: false };
  };

  if (items.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-200 text-center space-y-2">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
        <h4 className="text-xs font-bold text-slate-800">
          All Priority Milestones On Track
        </h4>
        <p className="text-[11px] text-slate-400">
          No overdue or immediate chase tasks pending for your portfolio.
        </p>
      </div>
    );
  }

  return (
    <div className="iceberg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAFBFD] text-slate-500 border-b border-slate-200/80 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Priority Case & Property</th>
              <th className="py-3 px-4">Active Milestone Stage</th>
              <th className="py-3 px-4">Execution Status</th>
              <th className="py-3 px-4">Target SLA Deadline</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {items.map((op) => {
              const dueInfo = formatDueDate(op.dueDate);

              return (
                <tr
                  key={op.caseId}
                  onClick={() => navigate(`/cases/${op.caseId}`)}
                  className="hover:bg-pink-50/30 transition-colors cursor-pointer group"
                >
                  {/* Case Title */}
                  <td className="py-3.5 px-4 min-w-[220px]">
                    <div className="font-bold text-slate-900 group-hover:text-[#E1007A] transition-colors leading-snug">
                      {op.caseTitle}
                    </div>
                  </td>

                  {/* Current Step Name */}
                  <td className="py-3.5 px-4 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E1007A] shrink-0 animate-pulse" />
                      <span className="font-semibold text-slate-800 truncate">
                        {op.currentStepName}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Badge
                      variant={
                        op.status === 'Completed'
                          ? 'success'
                          : op.status === 'InProgress'
                            ? 'required'
                            : 'default'
                      }
                      size="xs"
                    >
                      {op.statusLabel || op.status}
                    </Badge>
                  </td>

                  {/* Target Due Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {dueInfo.isOverdue ? (
                        <span className="flex items-center gap-1 text-[11px] font-extrabold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" />
                          {dueInfo.label}
                        </span>
                      ) : dueInfo.isToday ? (
                        <span className="flex items-center gap-1 text-[11px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          {dueInfo.label}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {dueInfo.label}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Action Link */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 group-hover:text-[#E1007A] transition-colors">
                      Open Workspace <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
