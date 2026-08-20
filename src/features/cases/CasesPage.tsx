import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Layers,
  Building,
} from 'lucide-react';
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
    title: '84 Parkfield Avenue, Kensington',
    reference: 'SP-2026-089',
    status: 'blocked',
    progressPercentage: 55,
    currentStage: 'Searches & Title Review',
    assigneeName: 'Sarah Collins',
    propertyAddress: '84 Parkfield Avenue, London, W8 6HN',
    price: 1250000,
    updatedAt: '2026-08-20T14:30:00Z',
  },
  {
    id: 'case-102',
    caseTypeId: 'ct-sales',
    caseTypeName: 'Residential Sales Progression',
    title: '14 Queens Gate Mews, Richmond',
    reference: 'SP-2026-092',
    status: 'active',
    progressPercentage: 65,
    currentStage: 'Mortgage Formal Offer',
    assigneeName: 'James Sterling',
    propertyAddress: '14 Queens Gate Mews, Richmond, TW10 6RF',
    price: 890000,
    updatedAt: '2026-08-20T11:20:00Z',
  },
  {
    id: 'case-103',
    caseTypeId: 'ct-market',
    caseTypeName: 'Market Appraisal & Valuation',
    title: '27 Claremont Road, St Albans',
    reference: 'MA-2026-031',
    status: 'active',
    progressPercentage: 85,
    currentStage: 'Valuation Report Preparation',
    assigneeName: 'Emma Watson',
    propertyAddress: '27 Claremont Road, St Albans, AL1 4DX',
    price: 640000,
    updatedAt: '2026-08-19T16:00:00Z',
  },
  {
    id: 'case-104',
    caseTypeId: 'ct-sales',
    caseTypeName: 'Residential Sales Progression',
    title: '52 Marlborough Crescent, Bath',
    reference: 'SP-2026-095',
    status: 'blocked',
    progressPercentage: 40,
    currentStage: 'Enquiries & AML Verification',
    assigneeName: 'Sarah Collins',
    propertyAddress: '52 Marlborough Crescent, Bath, BA1 2SQ',
    price: 775000,
    updatedAt: '2026-08-19T10:15:00Z',
  },
  {
    id: 'case-105',
    caseTypeId: 'ct-commercial',
    caseTypeName: 'Commercial Lease Progression',
    title: 'Units 4-6 Riverside Commercial Park',
    reference: 'CP-2026-012',
    status: 'active',
    progressPercentage: 50,
    currentStage: 'Draft Lease Agreement Approval',
    assigneeName: 'Marcus Vance',
    propertyAddress: 'Riverside Park, Bristol, BS1 6XN',
    price: 1950000,
    updatedAt: '2026-08-18T15:45:00Z',
  },
  {
    id: 'case-106',
    caseTypeId: 'ct-sales',
    caseTypeName: 'Residential Sales Progression',
    title: '19 Redland Park, Bristol',
    reference: 'SP-2026-099',
    status: 'completed',
    progressPercentage: 100,
    currentStage: 'Completion & Key Handover',
    assigneeName: 'James Sterling',
    propertyAddress: '19 Redland Park, Bristol, BS6 6NP',
    price: 520000,
    updatedAt: '2026-08-17T12:00:00Z',
  },
];

export const CasesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredCases = initialCases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.propertyAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.caseTypeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === 'all' || c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building className="w-6 h-6 text-[#E1007A]" />
            Active Case Directory & Progression
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track multi-domain workflow executions, milestone dependencies, and
            assigned responsibilities.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/cases/case-oxford-101')}
        >
          Start New Case
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <Card className="flex flex-col sm:flex-row items-center gap-4 py-3 border-slate-200/90 shadow-2xs">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search by property, client, reference, or case type..."
            leftIcon={<Search className="w-4 h-4" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            {['all', 'active', 'blocked', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1 rounded-lg capitalize font-semibold transition-all ${
                  selectedStatus === status
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {status === 'all' ? 'All (6)' : status}
              </button>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Filter className="w-3.5 h-3.5" />}
          >
            Filter
          </Button>
        </div>
      </Card>

      {/* Cases Table */}
      <div className="iceberg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFBFD] text-slate-500 border-b border-slate-200/80 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Case Reference & Property</th>
                <th className="py-3 px-4">Domain Package / Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Current Progression Stage</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4">Agreed Value</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCases.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/cases/${c.id}`)}
                  className="hover:bg-pink-50/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{c.title}</div>
                    <div className="text-[11px] font-mono text-[#E1007A] font-semibold mt-0.5">
                      {c.reference}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {c.caseTypeName}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        c.status === 'active'
                          ? 'info'
                          : c.status === 'blocked'
                            ? 'high'
                            : 'success'
                      }
                      size="xs"
                    >
                      {c.status.toUpperCase()}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {c.currentStage}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="w-24 space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                        <span>{c.progressPercentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#E1007A] rounded-full transition-all"
                          style={{ width: `${c.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {c.price ? formatCurrency(c.price) : '—'}
                  </td>

                  <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                    {c.assigneeName}
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {formatDate(c.updatedAt)}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
