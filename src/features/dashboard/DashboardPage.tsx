import React from 'react';
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Plus,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../lib/utils';
import type { CaseSummary } from '../../types/api';

const mockCases: CaseSummary[] = [
  {
    id: 'case-101',
    caseTypeId: 'ct-sales',
    caseTypeName: 'Residential Sales Progression',
    title: '42 Highfield Lane, St Albans',
    reference: 'SALES-2026-089',
    status: 'active',
    progressPercentage: 65,
    currentStage: 'Conveyancing & Searches',
    assigneeName: 'Sarah Jenkins',
    propertyAddress: '42 Highfield Lane, St Albans, AL1 4TW',
    price: 475000,
    updatedAt: '2026-08-20T14:30:00Z',
  },
  {
    id: 'case-102',
    caseTypeId: 'ct-sales',
    caseTypeName: 'Residential Sales Progression',
    title: '18 Meadow View, Harpenden',
    reference: 'SALES-2026-092',
    status: 'blocked',
    progressPercentage: 40,
    currentStage: 'Mortgage Offer Approval',
    assigneeName: 'Alex Morgan',
    propertyAddress: '18 Meadow View, Harpenden, AL5 2PQ',
    price: 620000,
    updatedAt: '2026-08-19T11:20:00Z',
  },
  {
    id: 'case-103',
    caseTypeId: 'ct-market',
    caseTypeName: 'Market Appraisal Flow',
    title: '7 Oakwood Crescent, Redbourn',
    reference: 'APP-2026-014',
    status: 'active',
    progressPercentage: 90,
    currentStage: 'Valuation Presentation',
    assigneeName: 'Sarah Jenkins',
    propertyAddress: '7 Oakwood Crescent, AL3 7NP',
    price: 550000,
    updatedAt: '2026-08-20T16:00:00Z',
  },
];

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Case Progression Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time case visibility, active milestone blockers, and pipeline
            throughput.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm">
            Export Report
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Case
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Active Cases</p>
            <h3 className="text-2xl font-bold text-white">24</h3>
            <p className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> +12% from last month
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">
              Blockers / At Risk
            </p>
            <h3 className="text-2xl font-bold text-white">3</h3>
            <p className="text-[11px] text-amber-400 mt-0.5">
              Requires Agent attention
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">
              Completed (This Month)
            </p>
            <h3 className="text-2xl font-bold text-white">18</h3>
            <p className="text-[11px] text-emerald-400 mt-0.5">
              Avg 42 days to exchange
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Pipeline Value</p>
            <h3 className="text-2xl font-bold text-white">£12.4M</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Across 4 branch offices
            </p>
          </div>
        </Card>
      </div>

      {/* Active Progression Cases */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            Recent Sales Progressions
          </h2>
          <span className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer">
            View All Cases &rarr;
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {mockCases.map((c) => (
            <Card
              key={c.id}
              hoverable
              className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-indigo-400 font-semibold">
                    {c.reference}
                  </span>
                  <Badge
                    variant={
                      c.status === 'active'
                        ? 'info'
                        : c.status === 'blocked'
                          ? 'danger'
                          : 'success'
                    }
                  >
                    {c.status.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    • {c.caseTypeName}
                  </span>
                </div>
                <h4 className="text-base font-semibold text-white">
                  {c.title}
                </h4>
                <p className="text-xs text-slate-400">{c.propertyAddress}</p>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="text-left md:text-right">
                  <p className="text-[11px] text-slate-400">Agreed Price</p>
                  <p className="text-sm font-semibold text-slate-100">
                    {c.price ? formatCurrency(c.price) : '—'}
                  </p>
                </div>

                <div className="w-36 space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-indigo-400 font-medium">
                      {c.progressPercentage}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full"
                      style={{ width: `${c.progressPercentage}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    {c.currentStage}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[11px] text-slate-400">Assigned Agent</p>
                  <p className="text-xs font-medium text-slate-200">
                    {c.assigneeName}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
