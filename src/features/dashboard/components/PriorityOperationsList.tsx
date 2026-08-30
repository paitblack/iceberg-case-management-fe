import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ChevronRight,
  Clock,
  CheckCircle2,
  Calendar,
  Home,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { TrafficLightBadge } from '../../../components/ui/TrafficLightBadge';
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
      <div className="p-10 rounded-2xl bg-white border border-dashed border-slate-200 text-center space-y-2.5 shadow-2xs">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center mx-auto shadow-2xs">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">
          All Priority Milestones On Track
        </h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          No overdue or immediate chase tasks pending for your active portfolio.
        </p>
      </div>
    );
  }

  return (
    <div className="iceberg-card border border-slate-200/90 shadow-2xs rounded-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3.5 px-4">Priority Case & Property</th>
              <th className="py-3.5 px-4">Active Milestone Stage</th>
              <th className="py-3.5 px-4">Execution Status & Risk</th>
              <th className="py-3.5 px-4">Target SLA Deadline</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {items.map((op) => {
              const dueInfo = formatDueDate(op.dueDate);

              return (
                <tr
                  key={op.caseId}
                  onClick={() => navigate(`/cases/${op.caseId}`)}
                  className="hover:bg-pink-50/25 transition-colors cursor-pointer group relative hover:z-30"
                >
                  {/* Case Title with Property Icon */}
                  <td className="py-4 px-4 min-w-[240px]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100/60 border border-pink-200/60 text-[#E1007A] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        <Home className="w-4 h-4" />
                      </div>
                      <div className="font-extrabold text-slate-900 group-hover:text-[#E1007A] transition-colors leading-snug text-xs md:text-sm line-clamp-1">
                        {op.caseTitle}
                      </div>
                    </div>
                  </td>

                  {/* Current Step Name */}
                  <td className="py-4 px-4 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#E1007A] shrink-0 animate-pulse shadow-xs shadow-pink-300" />
                      <span className="font-bold text-slate-800 truncate text-xs">
                        {op.currentStepName}
                      </span>
                    </div>
                  </td>

                  {/* Status & Traffic Light */}
                  <td className="py-4 px-4 whitespace-nowrap relative">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {op.trafficLight && (
                        <TrafficLightBadge
                          status={op.trafficLight}
                          size="xs"
                        />
                      )}
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
                    </div>
                  </td>

                  {/* Target Due Date */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {dueInfo.isOverdue ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full animate-pulse shadow-2xs">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          {dueInfo.label}
                        </span>
                      ) : dueInfo.isToday ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shadow-2xs">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {dueInfo.label}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-semibold bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-full shadow-2xs">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {dueInfo.label}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Action Link */}
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 group-hover:text-[#E1007A] transition-colors bg-slate-50 group-hover:bg-pink-50 border border-slate-200/80 group-hover:border-pink-200/80 px-2.5 py-1 rounded-xl shadow-2xs">
                      <span>Open Workspace</span>
                      <ChevronRight className="w-3.5 h-3.5" />
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
