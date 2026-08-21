import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Plus, ArrowDownCircle, Inbox } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { CaseListFilters } from './components/CaseListFilters';
import { CaseCard } from './components/CaseCard';
import { CaseTableRow } from './components/CaseTableRow';
import { CaseListSkeleton } from './components/CaseListSkeleton';
import { fetchCaseList } from '../../lib/api-client';
import type {
  BffCaseItem,
  BffCaseListMeta,
  BffCaseListAvailableFilters,
} from '../../types/api';

const DEFAULT_MOCK_ITEMS: BffCaseItem[] = [
  {
    id: 'case-oxford-101',
    caseTypeId: 'ct-sales-01',
    caseTypeName: 'UK Residential Sales Progression',
    title: '42 Woodstock Road, Oxford OX2 6HT',
    reference: 'CM-2026-084',
    status: 'Open',
    statusLabel: 'Open',
    progress: {
      totalSteps: 5,
      completedSteps: 2,
      percentage: 58,
    },
    currentStep: {
      id: 'step-exec-3',
      name: 'Buyer Solicitor Instructed & ID Verification',
      status: 'InProgress',
      statusLabel: 'In Progress',
    },
    blockersCount: 1,
    createdAt: '2026-08-10T09:00:00Z',
    allowedActions: ['HOLD', 'COMPLETE', 'CANCEL', 'UPLOAD_DOCUMENT'],
  },
  {
    id: 'case-102',
    caseTypeId: 'ct-sales-01',
    caseTypeName: 'UK Residential Sales Progression',
    title: '14 Queens Gate Mews, Richmond, TW10 6RF',
    reference: 'SP-2026-092',
    status: 'Open',
    statusLabel: 'Open',
    progress: {
      totalSteps: 6,
      completedSteps: 4,
      percentage: 65,
    },
    currentStep: {
      id: 'step-102-4',
      name: 'Mortgage Formal Offer Received',
      status: 'InProgress',
      statusLabel: 'In Progress',
    },
    blockersCount: 0,
    createdAt: '2026-08-12T11:20:00Z',
    allowedActions: ['HOLD', 'COMPLETE', 'CANCEL'],
  },
  {
    id: 'case-103',
    caseTypeId: 'ct-appraisal-01',
    caseTypeName: 'Market Appraisal & Valuation',
    title: '27 Claremont Road, St Albans, AL1 4DX',
    reference: 'MA-2026-031',
    status: 'Open',
    statusLabel: 'Open',
    progress: {
      totalSteps: 4,
      completedSteps: 3,
      percentage: 85,
    },
    currentStep: {
      id: 'step-103-3',
      name: 'Valuation Report Preparation',
      status: 'InProgress',
      statusLabel: 'In Progress',
    },
    blockersCount: 0,
    createdAt: '2026-08-14T16:00:00Z',
    allowedActions: ['HOLD', 'COMPLETE', 'CANCEL'],
  },
  {
    id: 'case-104',
    caseTypeId: 'ct-sales-01',
    caseTypeName: 'UK Residential Sales Progression',
    title: '52 Marlborough Crescent, Bath, BA1 2SQ',
    reference: 'SP-2026-095',
    status: 'OnHold',
    statusLabel: 'On Hold',
    progress: {
      totalSteps: 5,
      completedSteps: 2,
      percentage: 40,
    },
    currentStep: {
      id: 'step-104-2',
      name: 'Enquiries & AML Biometric Verification',
      status: 'InProgress',
      statusLabel: 'In Progress',
    },
    blockersCount: 2,
    createdAt: '2026-08-15T10:15:00Z',
    allowedActions: ['RESUME', 'CANCEL'],
  },
  {
    id: 'case-105',
    caseTypeId: 'ct-commercial-01',
    caseTypeName: 'Commercial Lease Conveyancing',
    title: 'Units 4-6 Riverside Commercial Park, Bristol',
    reference: 'CP-2026-012',
    status: 'Open',
    statusLabel: 'Open',
    progress: {
      totalSteps: 4,
      completedSteps: 2,
      percentage: 50,
    },
    currentStep: {
      id: 'step-105-2',
      name: 'Tenant Credit & Commercial Referencing',
      status: 'InProgress',
      statusLabel: 'In Progress',
    },
    blockersCount: 0,
    createdAt: '2026-08-16T15:45:00Z',
    allowedActions: ['HOLD', 'COMPLETE', 'CANCEL'],
  },
  {
    id: 'case-106',
    caseTypeId: 'ct-sales-01',
    caseTypeName: 'UK Residential Sales Progression',
    title: '19 Redland Park, Bristol, BS6 6NP',
    reference: 'SP-2026-099',
    status: 'Completed',
    statusLabel: 'Completed',
    progress: {
      totalSteps: 5,
      completedSteps: 5,
      percentage: 100,
    },
    currentStep: {
      id: 'step-106-5',
      name: 'Completion & Key Release',
      status: 'Completed',
      statusLabel: 'Completed',
    },
    blockersCount: 0,
    createdAt: '2026-08-01T12:00:00Z',
    allowedActions: [],
  },
];

const DEFAULT_FILTERS: BffCaseListAvailableFilters = {
  statuses: ['Open', 'OnHold', 'Completed', 'Cancelled'],
  caseTypes: [
    { id: 'ct-sales-01', name: 'UK Residential Sales Progression' },
    { id: 'ct-appraisal-01', name: 'Market Appraisal & Valuation' },
    { id: 'ct-commercial-01', name: 'Commercial Lease Conveyancing' },
  ],
};

export const CasesPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [items, setItems] = useState<BffCaseItem[]>(DEFAULT_MOCK_ITEMS);
  const [meta, setMeta] = useState<BffCaseListMeta>({
    totalCount: DEFAULT_MOCK_ITEMS.length,
    hasMore: false,
  });
  const [availableFilters, setAvailableFilters] =
    useState<BffCaseListAvailableFilters>(DEFAULT_FILTERS);

  // Filter query states
  const [search, setSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCaseTypeId, setSelectedCaseTypeId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Data fetching logic
  const loadCases = useCallback(
    async (cursor?: string) => {
      if (cursor) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const queryParams = {
          search: search.trim() || undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          caseTypeId:
            selectedCaseTypeId !== 'all' ? selectedCaseTypeId : undefined,
          limit: 10,
          cursor,
        };

        const res = await fetchCaseList(queryParams);

        if (cursor) {
          setItems((prev) => [...prev, ...res.items]);
        } else {
          setItems(res.items);
        }

        setMeta(res.meta);
        if (res.availableFilters) {
          setAvailableFilters(res.availableFilters);
        }
      } catch {
        // Graceful mock fallback for offline local testing
        let filtered = [...DEFAULT_MOCK_ITEMS];

        if (search.trim()) {
          const q = search.toLowerCase();
          filtered = filtered.filter(
            (c) =>
              c.title.toLowerCase().includes(q) ||
              (c.reference && c.reference.toLowerCase().includes(q)) ||
              c.caseTypeName.toLowerCase().includes(q),
          );
        }

        if (selectedStatus !== 'all') {
          filtered = filtered.filter((c) => c.status === selectedStatus);
        }

        if (selectedCaseTypeId !== 'all') {
          filtered = filtered.filter(
            (c) => c.caseTypeId === selectedCaseTypeId,
          );
        }

        setItems(filtered);
        setMeta({
          totalCount: filtered.length,
          hasMore: false,
        });
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [search, selectedStatus, selectedCaseTypeId],
  );

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const handleLoadMore = () => {
    if (meta.hasMore && meta.nextCursor) {
      loadCases(meta.nextCursor);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building className="w-6 h-6 text-[#E1007A]" />
            Live Case Directory & Progression
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-domain workflow progression, milestone dependencies,
            and blocker tracking.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/templates')}
        >
          New Case Workflow
        </Button>
      </div>

      {/* Dynamic Filters Bar */}
      <CaseListFilters
        search={search}
        onSearchChange={setSearch}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedCaseTypeId={selectedCaseTypeId}
        onCaseTypeChange={setSelectedCaseTypeId}
        availableStatuses={availableFilters.statuses}
        availableCaseTypes={availableFilters.caseTypes}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalCount={meta.totalCount}
      />

      {/* Main List / Table Render */}
      {isLoading ? (
        <CaseListSkeleton viewMode={viewMode} />
      ) : items.length === 0 ? (
        <div className="p-16 rounded-2xl bg-white border border-dashed border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            No matching cases found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search terms, status filters, or case type
            selection.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearch('');
              setSelectedStatus('all');
              setSelectedCaseTypeId('all');
            }}
          >
            Clear All Filters
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((caseItem) => (
            <CaseCard
              key={caseItem.id}
              caseItem={caseItem}
              onClick={() => navigate(`/cases/${caseItem.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="iceberg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFBFD] text-slate-500 border-b border-slate-200/80 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Case Title & Reference</th>
                  <th className="py-3 px-4">Domain Type</th>
                  <th className="py-3 px-4">Status & Blockers</th>
                  <th className="py-3 px-4">Current Milestone Stage</th>
                  <th className="py-3 px-4">Progression</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {items.map((caseItem) => (
                  <CaseTableRow
                    key={caseItem.id}
                    caseItem={caseItem}
                    onClick={() => navigate(`/cases/${caseItem.id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination / Load More */}
      {meta.hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="secondary"
            size="md"
            isLoading={isLoadingMore}
            onClick={handleLoadMore}
            leftIcon={<ArrowDownCircle className="w-4 h-4 text-[#E1007A]" />}
            className="font-bold"
          >
            Load More Cases
          </Button>
        </div>
      )}
    </div>
  );
};
