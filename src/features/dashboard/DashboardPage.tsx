import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Info,
  ArrowRight,
  AlertTriangle,
  FileCheck2,
  Layers,
  ArrowUpRight,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../lib/utils';

interface CaseRow {
  id: string;
  reference: string;
  property: string;
  caseType: string;
  currentStep: string;
  blocker?: string;
  nextAction: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'In Progress' | 'Blocked' | 'Pending Review';
  owner: string;
  price: number;
}

const activeCases: CaseRow[] = [
  {
    id: 'c-101',
    reference: 'SP-2026-089',
    property: '84 Parkfield Avenue, Kensington',
    caseType: 'Sales Progression (UK Standard)',
    currentStep: 'Searches & Title Review',
    blocker: 'Local authority search delay (ETA 3 days)',
    nextAction: 'Follow up with Kensington Borough Council',
    dueDate: 'Today, 15:00',
    priority: 'High',
    status: 'Blocked',
    owner: 'Sarah Collins',
    price: 1250000,
  },
  {
    id: 'c-102',
    reference: 'SP-2026-092',
    property: '14 Queens Gate Mews, Richmond',
    caseType: 'Sales Progression (UK Standard)',
    currentStep: 'Mortgage Formal Offer',
    blocker: undefined,
    nextAction: 'Verify mortgage deed copy from HSBC',
    dueDate: 'Today, 16:30',
    priority: 'Medium',
    status: 'In Progress',
    owner: 'James Sterling',
    price: 890000,
  },
  {
    id: 'c-103',
    reference: 'MA-2026-031',
    property: '27 Claremont Road, St Albans',
    caseType: 'Market Appraisal & Valuation',
    currentStep: 'Valuation Report Preparation',
    blocker: undefined,
    nextAction: 'Complete comparative desktop analysis',
    dueDate: 'Tomorrow, 10:00',
    priority: 'Low',
    status: 'In Progress',
    owner: 'Emma Watson',
    price: 640000,
  },
  {
    id: 'c-104',
    reference: 'SP-2026-095',
    property: '52 Marlborough Crescent, Bath',
    caseType: 'Sales Progression (UK Standard)',
    currentStep: 'Enquiries & AML Verification',
    blocker: 'Buyer source of funds document incomplete',
    nextAction: 'Request updated bank statements via client portal',
    dueDate: 'Tomorrow, 14:00',
    priority: 'High',
    status: 'Blocked',
    owner: 'Sarah Collins',
    price: 775000,
  },
  {
    id: 'c-105',
    reference: 'CP-2026-012',
    property: 'Units 4-6 Riverside Commercial Park',
    caseType: 'Commercial Lease Progression',
    currentStep: 'Draft Lease Agreement Approval',
    blocker: undefined,
    nextAction: 'Awaiting tenant solicitor draft markups',
    dueDate: '24 Aug, 12:00',
    priority: 'Medium',
    status: 'In Progress',
    owner: 'Marcus Vance',
    price: 1950000,
  },
];

export const DashboardPage: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'sales' | 'blocked'
  >('all');

  const filteredCases = activeCases.filter((c) => {
    if (selectedFilter === 'sales') return c.caseType.includes('Sales');
    if (selectedFilter === 'blocked') return c.status === 'Blocked';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Executive Operational Header Card */}
      <Card className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-7 relative overflow-hidden border-slate-200/90 shadow-xs">
        <div className="space-y-4 max-w-2xl">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#E1007A] bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200">
                <Layers className="w-3 h-3" /> Reusable Case Foundation
              </span>
              <span className="text-xs text-slate-400">
                • Multi-Domain Enabled
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              14 critical milestones scheduled across 8 active cases
            </h2>
            <p className="text-xs lg:text-sm text-slate-600 leading-relaxed">
              Workflow progression is active across Sales Progression, Market
              Appraisals, and Commercial Leases. 3 items require compliance or
              solicitor sign-off.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link to="/cases">
              <Button
                variant="primary"
                size="md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Explore Active Cases
              </Button>
            </Link>
            <Link to="/templates">
              <Button variant="secondary" size="md">
                Configure Workflow Templates
              </Button>
            </Link>
          </div>
        </div>

        {/* Milestone Completion Gauge */}
        <div className="flex flex-col items-center lg:items-end gap-2 shrink-0">
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#E1007A]"
                  strokeDasharray="72, 100"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl font-extrabold text-slate-900 leading-none">
                  72%
                </span>
                <span className="text-[9px] font-medium text-slate-500 mt-0.5">
                  on-time rate
                </span>
              </div>
            </div>
          </div>
          <p className="text-[11px] font-medium text-slate-500">
            11 of 14 milestones on schedule
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
              <FileCheck2 className="w-3 h-3" /> 8 Verified
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
              <AlertTriangle className="w-3 h-3" /> 3 Blocked
            </span>
          </div>
        </div>
      </Card>

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span>Active Cases</span>
            <Info className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">28</p>
          <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3 h-3" /> +15% this quarter
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span>Milestones Due Today</span>
            <Info className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">14</p>
          <p className="text-xs text-slate-500">4 awaiting proof upload</p>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span>Active Blockers</span>
            <Info className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-rose-600">3</p>
          <p className="text-xs text-rose-600/90 font-medium">
            Third-party search & AML
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span>Avg. Cycle Time</span>
            <Info className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">38d</p>
          <p className="text-xs text-slate-500">Offer to exchange avg.</p>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span>Pipeline Value</span>
            <Info className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">£14.8M</p>
          <p className="text-xs text-slate-500">Across 3 branch teams</p>
        </Card>
      </div>

      {/* Main Operations Grid: Priority Worklist & Activity Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Operational Worklist Table */}
        <div className="lg:col-span-8 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Priority Workflow Operations
              </h3>
              <p className="text-xs text-slate-500">
                Ordered by execution urgency and next required milestone action
              </p>
            </div>

            {/* Segmented Filter */}
            <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl text-xs">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  selectedFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All (5)
              </button>
              <button
                onClick={() => setSelectedFilter('sales')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  selectedFilter === 'sales'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sales Progression
              </button>
              <button
                onClick={() => setSelectedFilter('blocked')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  selectedFilter === 'blocked'
                    ? 'bg-white text-rose-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Blocked Only
              </button>
            </div>
          </div>

          <div className="iceberg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFBFD] text-slate-500 border-b border-slate-200/80 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Case Reference & Property</th>
                    <th className="py-3 px-4">Current Step / Stage</th>
                    <th className="py-3 px-4">Blocker & Next Action</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Handler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                  {filteredCases.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {row.property}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono text-[#E1007A] font-semibold">
                            {row.reference}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            • {formatCurrency(row.price)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {row.currentStep}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {row.caseType}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        {row.blocker ? (
                          <div className="flex items-start gap-1.5 text-rose-600">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span className="text-[11px] font-medium leading-tight">
                              {row.blocker}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-700 font-medium">
                            {row.nextAction}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {row.dueDate}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge
                          variant={
                            row.status === 'In Progress'
                              ? 'info'
                              : row.status === 'Blocked'
                                ? 'high'
                                : 'medium'
                          }
                          size="xs"
                        >
                          {row.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {row.owner}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Real-time Operational Insights & Workflow Health */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#E1007A]" />
              Operational Highlights
            </h3>
            <Badge variant="required" size="xs">
              Live Updates
            </Badge>
          </div>

          <div className="space-y-3">
            {/* Card 1: Conveyance Chain Alert */}
            <div className="p-4 rounded-2xl bg-[#FFF5F7] border border-[#FED7E2] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E1007A]">
                  Chain Risk Alert
                </span>
                <span className="text-[10px] text-slate-500">12 min ago</span>
              </div>
              <p className="text-xs font-bold text-slate-900 leading-snug">
                Search delay flagged for 84 Parkfield Avenue (Upper chain
                affected)
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Kensington Borough search turnaround increased by 4 business
                days. Milestone target has been flagged for review.
              </p>
            </div>

            {/* Card 2: Compliance Verification */}
            <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Compliance Action
                </span>
                <span className="text-[10px] text-slate-500">1h ago</span>
              </div>
              <p className="text-xs font-bold text-slate-900 leading-snug">
                AML biometric verification completed for 14 Queens Gate Mews
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Buyer identity proof accepted via portal integration. DAG
                dependency unlocked for mortgage deed review.
              </p>
            </div>

            {/* Card 3: Template Release Notification */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Template Version Status
                </span>
                <span className="text-[10px] font-mono text-[#E1007A] font-semibold">
                  v3.0 Live
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 leading-snug">
                UK Residential Sales Progression template is active
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                12 ordered milestones, 34 validated work items, and immutable
                snapshot protection enabled across 24 active cases.
              </p>
              <Link
                to="/templates"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#E1007A] hover:text-[#C70068] pt-1"
              >
                Manage in Template Studio &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
