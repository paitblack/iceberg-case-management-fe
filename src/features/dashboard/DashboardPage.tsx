import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  AlertTriangle,
  Clock,
  Activity,
  TrendingUp,
  RotateCw,
  ArrowRight,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { KpiCard } from './components/KpiCard';
import { PriorityOperationsList } from './components/PriorityOperationsList';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { fetchDashboardSnapshot } from '../../lib/api-client';
import type { BffDashboardSnapshot } from '../../types/api';

const DEFAULT_MOCK_DASHBOARD: BffDashboardSnapshot = {
  contractVersion: '1.0.0',
  generatedAt: new Date().toISOString(),
  activeCasesCount: 42,
  activeBlockersCount: 7,
  priorityOperations: [
    {
      caseId: 'case-oxford-101',
      caseTitle: '42 Woodstock Road, Oxford OX2 6HT (CM-2026-084)',
      currentStepName: 'Buyer Solicitor Instructed & ID Verification',
      status: 'InProgress',
      statusLabel: 'In Progress',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(), // Due today
      priority: 'High',
    },
    {
      caseId: 'case-104',
      caseTitle: '52 Marlborough Crescent, Bath, BA1 2SQ (SP-2026-095)',
      currentStepName: 'Enquiries & AML Biometric Verification',
      status: 'InProgress',
      statusLabel: 'In Progress',
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day overdue
      priority: 'High',
    },
    {
      caseId: 'case-102',
      caseTitle: '14 Queens Gate Mews, Richmond, TW10 6RF (SP-2026-092)',
      currentStepName: 'Mortgage Formal Offer Received',
      status: 'InProgress',
      statusLabel: 'In Progress',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(), // Due tomorrow
      priority: 'Medium',
    },
    {
      caseId: 'case-103',
      caseTitle: '27 Claremont Road, St Albans, AL1 4DX (MA-2026-031)',
      currentStepName: 'Valuation Report Preparation',
      status: 'InProgress',
      statusLabel: 'In Progress',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(), // In 3 days
      priority: 'Low',
    },
  ],
  metrics: {
    avgCycleTimeDays: 38,
    milestonesDueToday: 14,
    pipelineValueAmount: 14850000,
    pipelineValueCurrency: 'GBP',
  },
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<BffDashboardSnapshot>(
    DEFAULT_MOCK_DASHBOARD,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadDashboard = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetchDashboardSnapshot();
      setData(res);
    } catch {
      // Offline fallback
      setData(DEFAULT_MOCK_DASHBOARD);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const formatPipelineValue = (amount: number, currency: string) => {
    const symbol = currency === 'GBP' ? '£' : '$';
    if (amount >= 1_000_000) {
      return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (amount >= 1_000) {
      return `${symbol}${(amount / 1_000).toFixed(0)}K`;
    }
    return `${symbol}${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Operations Portfolio Dashboard
            </h2>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Live Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time pipeline progression, critical milestone deadlines, and
            active blocker alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            isLoading={isRefreshing}
            leftIcon={<RotateCw className="w-3.5 h-3.5" />}
            onClick={() => loadDashboard(true)}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => navigate('/templates')}
          >
            New Workflow
          </Button>
        </div>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* 5 KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard
              title="Active Cases"
              value={data.activeCasesCount}
              subtitle="Open & On-Hold Workflows"
              icon={<FolderKanban className="w-4 h-4" />}
              variant="pink"
              trend="+3 this week"
            />

            <KpiCard
              title="Active Blockers"
              value={data.activeBlockersCount}
              subtitle="Immediate Attention Required"
              icon={<AlertTriangle className="w-4 h-4" />}
              variant="rose"
              trend={
                data.activeBlockersCount > 0 ? 'Action Needed' : 'No Blockers'
              }
            />

            <KpiCard
              title="Due Today"
              value={data.metrics.milestonesDueToday}
              subtitle="Target Milestone SLA"
              icon={<Clock className="w-4 h-4" />}
              variant="amber"
              trend="14 pending tasks"
            />

            <KpiCard
              title="Avg Cycle Time"
              value={`${data.metrics.avgCycleTimeDays} Days`}
              subtitle="Instruction to Completion"
              icon={<Activity className="w-4 h-4" />}
              variant="blue"
              trend="Target: 45 Days"
            />

            <KpiCard
              title="Pipeline Value"
              value={formatPipelineValue(
                data.metrics.pipelineValueAmount,
                data.metrics.pipelineValueCurrency,
              )}
              subtitle="Agreed Portfolio Value"
              icon={<TrendingUp className="w-4 h-4" />}
              variant="emerald"
              trend="42 live properties"
            />
          </div>

          {/* Main Priority Operations Worklist */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#E1007A]" />
                  Urgent Progression & Milestone Deadlines
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Critical milestones requiring progressor communication,
                  evidence verification, or key date actions.
                </p>
              </div>

              <Button
                variant="ghost"
                size="xs"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => navigate('/cases')}
              >
                View Full Case Directory
              </Button>
            </div>

            <PriorityOperationsList items={data.priorityOperations} />
          </div>
        </>
      )}
    </div>
  );
};
