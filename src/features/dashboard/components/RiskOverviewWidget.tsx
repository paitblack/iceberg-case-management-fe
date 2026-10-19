import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import type { BffDashboardRiskOverview } from '../../../types/api';

interface RiskOverviewWidgetProps {
  riskOverview?: BffDashboardRiskOverview;
  totalActiveCases: number;
}

export const RiskOverviewWidget: React.FC<RiskOverviewWidgetProps> = ({
  riskOverview = { greenCases: 0, amberCases: 0, redCases: 0 },
  totalActiveCases,
}) => {
  const navigate = useNavigate();
  const { greenCases, amberCases, redCases } = riskOverview;

  const totalEvaluated = greenCases + amberCases + redCases;
  const greenPct =
    totalEvaluated > 0 ? Math.round((greenCases / totalEvaluated) * 100) : 100;
  const amberPct =
    totalEvaluated > 0 ? Math.round((amberCases / totalEvaluated) * 100) : 0;
  const redPct =
    totalEvaluated > 0 ? Math.round((redCases / totalEvaluated) * 100) : 0;

  return (
    <div className="iceberg-card p-5 md:p-6 border border-slate-200/90 shadow-2xs space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-pink-50 text-[#E1007A] border border-pink-200/60">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Portfolio SLA Health & Traffic Light Risk
            </h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Live Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated risk classification based on active blockers, task overdue dates, and case hold states.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/cases')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E1007A] hover:text-[#C00068] transition-colors cursor-pointer self-start sm:self-center bg-pink-50 hover:bg-pink-100/70 border border-pink-200/60 px-3 py-1.5 rounded-xl shadow-2xs"
        >
          <span>View All Workflows</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Multi-Segment Health Distribution Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span className="text-slate-500">Portfolio Risk Breakdown</span>
          <span className="font-extrabold text-slate-900">
            {totalActiveCases} Active Workflows
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex p-0.5 gap-0.5 border border-slate-200/80 shadow-inner">
          {greenPct > 0 && (
            <div
              className="h-full bg-emerald-500 rounded-l-full transition-all duration-700"
              style={{ width: `${greenPct}%` }}
              title={`On Track: ${greenCases} cases (${greenPct}%)`}
            />
          )}
          {amberPct > 0 && (
            <div
              className="h-full bg-amber-400 transition-all duration-700"
              style={{ width: `${amberPct}%` }}
              title={`At Risk: ${amberCases} cases (${amberPct}%)`}
            />
          )}
          {redPct > 0 && (
            <div
              className="h-full bg-rose-500 rounded-r-full transition-all duration-700"
              style={{ width: `${redPct}%` }}
              title={`Action Required: ${redCases} cases (${redPct}%)`}
            />
          )}
        </div>
      </div>

      {/* 3 Risk Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
        {/* Green - On Track */}
        <div
          onClick={() => navigate('/cases')}
          className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-emerald-50/30 border border-emerald-200/90 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group flex items-start gap-3.5 shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-950">
                On Track
              </span>
              <span className="text-xl font-extrabold text-emerald-800 font-mono">
                {greenCases}
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 line-clamp-1 font-medium">
              Healthy milestones & SLAs
            </p>
          </div>
        </div>

        {/* Amber - At Risk */}
        <div
          onClick={() => navigate('/cases')}
          className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 to-amber-50/30 border border-amber-200/90 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group flex items-start gap-3.5 shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <AlertCircle className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-amber-950">
                At Risk
              </span>
              <span className="text-xl font-extrabold text-amber-800 font-mono">
                {amberCases}
              </span>
            </div>
            <p className="text-[11px] text-amber-700 line-clamp-1 font-medium">
              Due soon (&lt;= 3 days remaining)
            </p>
          </div>
        </div>

        {/* Red - Action Required */}
        <div
          onClick={() => navigate('/cases')}
          className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/70 to-rose-50/30 border border-rose-200/90 hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group flex items-start gap-3.5 shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-rose-950">
                Action Required
              </span>
              <span className="text-xl font-extrabold text-rose-800 font-mono">
                {redCases}
              </span>
            </div>
            <p className="text-[11px] text-rose-700 line-clamp-1 font-medium">
              Overdue tasks or case OnHold
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
