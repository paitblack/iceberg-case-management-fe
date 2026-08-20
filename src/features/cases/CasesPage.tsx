import React, { useState } from 'react';
import { FolderKanban, Search, Filter, Plus, MoreVertical } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { CaseSummary } from '../../types/api';

const initialCases: CaseSummary[] = [
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
  {
    id: 'case-104',
    caseTypeId: 'ct-sales',
    caseTypeName: 'Residential Sales Progression',
    title: '102 Victoria Street, St Albans',
    reference: 'SALES-2026-095',
    status: 'completed',
    progressPercentage: 100,
    currentStage: 'Completion & Key Handover',
    assigneeName: 'David Bell',
    propertyAddress: '102 Victoria Street, AL1 3TG',
    price: 395000,
    updatedAt: '2026-08-18T10:15:00Z',
  },
];

export const CasesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredCases = initialCases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.propertyAddress?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === 'all' || c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <FolderKanban className="w-7 h-7 text-indigo-400" />
            Cases Directory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse, filter and advance active sales progressions and interactive
            cases.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Start New Case
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <Card className="flex flex-col sm:flex-row items-center gap-4 py-3">
        <div className="flex-1 w-full">
          <Input
            placeholder="Filter by property address, client, or case reference..."
            leftIcon={<Search className="w-4 h-4" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs">
            {['all', 'active', 'blocked', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Filter className="w-3.5 h-3.5" />}
          >
            Filter
          </Button>
        </div>
      </Card>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 glass-panel">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Case Reference & Title</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Current Stage</th>
              <th className="py-3 px-4">Progress</th>
              <th className="py-3 px-4">Agreed Price</th>
              <th className="py-3 px-4">Last Updated</th>
              <th className="py-3 px-4 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {filteredCases.map((c) => (
              <tr
                key={c.id}
                className="hover:bg-slate-900/40 transition-colors cursor-pointer"
              >
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-white">{c.title}</div>
                  <div className="text-[11px] font-mono text-indigo-400 mt-0.5">
                    {c.reference}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-300">{c.caseTypeName}</td>
                <td className="py-3.5 px-4">
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
                </td>
                <td className="py-3.5 px-4 font-medium text-slate-200">
                  {c.currentStage}
                </td>
                <td className="py-3.5 px-4">
                  <div className="w-24 space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{c.progressPercentage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${c.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-100">
                  {c.price ? formatCurrency(c.price) : '—'}
                </td>
                <td className="py-3.5 px-4 text-slate-400">
                  {formatDate(c.updatedAt)}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
