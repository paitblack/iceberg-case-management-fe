import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  ArrowDownCircle,
  Inbox,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { CaseListFilters } from './components/CaseListFilters';
import { CaseCard } from './components/CaseCard';
import { CaseTableRow } from './components/CaseTableRow';
import { CaseListSkeleton } from './components/CaseListSkeleton';
import { ChangeStatusModal } from './components/ChangeStatusModal';
import { CreateCaseModal } from './components/CreateCaseModal';
import { fetchCaseList, changeCaseStatus, ApiError } from '../../lib/api-client';
import type {
  BffCaseItem,
  BffCaseListMeta,
  BffCaseListAvailableFilters,
  CaseStatusAction,
} from '../../types/api';

const DEFAULT_FILTERS: BffCaseListAvailableFilters = {
  statuses: ['Open', 'OnHold', 'Completed', 'Cancelled'],
  caseTypes: [],
};

export const CasesPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [items, setItems] = useState<BffCaseItem[]>([]);
  const [meta, setMeta] = useState<BffCaseListMeta>({
    totalCount: 0,
    hasMore: false,
  });
  const [availableFilters, setAvailableFilters] =
    useState<BffCaseListAvailableFilters>(DEFAULT_FILTERS);

  // Filter query states
  const [search, setSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCaseTypeId, setSelectedCaseTypeId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Loading & Action states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isMutatingStatus, setIsMutatingStatus] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [selectedCaseForAction, setSelectedCaseForAction] =
    useState<BffCaseItem | null>(null);
  const [pendingAction, setPendingAction] = useState<CaseStatusAction | null>(
    null,
  );
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Data fetching logic
  const loadCases = useCallback(
    async (cursor?: string) => {
      setErrorMessage(null);
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
      } catch (err: unknown) {
        if (!cursor) {
          setItems([]);
          setMeta({ totalCount: 0, hasMore: false });
        }
        if (err instanceof ApiError) {
          setErrorMessage(err.problem.detail || err.message);
        } else if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Failed to fetch cases from backend database.');
        }
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

  const handleTriggerAction = (
    caseItem: BffCaseItem,
    action: CaseStatusAction,
  ) => {
    setSelectedCaseForAction(caseItem);
    setPendingAction(action);
    setIsStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async (
    caseId: string,
    action: CaseStatusAction,
    reason?: string,
  ) => {
    setIsMutatingStatus(true);
    try {
      await changeCaseStatus(caseId, { action, reason });

      // Refresh list directly from backend
      await loadCases();

      setToastMessage({
        type: 'success',
        text: `Case status updated successfully to ${action}.`,
      });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.problem.detail || err.message
          : 'Failed to update case status on backend.';
      setToastMessage({
        type: 'error',
        text: msg,
      });
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setIsMutatingStatus(false);
      setIsStatusModalOpen(false);
      setSelectedCaseForAction(null);
      setPendingAction(null);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedStatus('all');
    setSelectedCaseTypeId('all');
  };

  const handleOpenCase = (caseId: string) => {
    navigate(`/cases/${caseId}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold text-white animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-200" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 flex-1 min-w-0">
            <p className="font-bold">Backend Error</p>
            <p className="text-[11px] leading-relaxed break-words">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Case Management Directory
            </h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              {meta.totalCount} active cases
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time live portfolio tracking, quick operational status
            transitions, and progression telemetry.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="font-bold shadow-md shadow-pink-500/10 shrink-0"
        >
          + New Case
        </Button>
      </div>

      {/* Filter Toolbar */}
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

      {/* Content Rendering: Loading vs Data vs Empty */}
      {isLoading ? (
        <CaseListSkeleton viewMode={viewMode} count={5} />
      ) : items.length === 0 ? (
        <div className="iceberg-card p-12 text-center space-y-4 border border-slate-200/90 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Inbox className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-slate-800">
              No Cases Found in Backend
            </h3>
            <p className="text-xs text-slate-500">
              {search || selectedStatus !== 'all' || selectedCaseTypeId !== 'all'
                ? 'No active cases match your current filter parameters. Try clearing your filters.'
                : 'There are currently no cases in the database for your organization. Launch a new workflow case to get started.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {search ||
            selectedStatus !== 'all' ||
            selectedCaseTypeId !== 'all' ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Clear Filters
              </Button>
            ) : null}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Start First Case
            </Button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <CaseCard
              key={item.id}
              item={item}
              onOpen={handleOpenCase}
              onTriggerAction={handleTriggerAction}
            />
          ))}
        </div>
      ) : (
        /* Table Layout */
        <div className="iceberg-card overflow-hidden border border-slate-200/90 shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Case Identity & Title</th>
                  <th className="py-3 px-4">Workflow Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Progression Milestone</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <CaseTableRow
                    key={item.id}
                    item={item}
                    onOpen={handleOpenCase}
                    onTriggerAction={handleTriggerAction}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination / Load More Footer */}
      {!isLoading && meta.hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="md"
            isLoading={isLoadingMore}
            onClick={handleLoadMore}
            leftIcon={<ArrowDownCircle className="w-4 h-4" />}
            className="font-bold text-slate-700 bg-white"
          >
            Load Next 10 Cases
          </Button>
        </div>
      )}

      {/* Change Status Modal Dialog */}
      {selectedCaseForAction && pendingAction && (
        <ChangeStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => {
            setIsStatusModalOpen(false);
            setSelectedCaseForAction(null);
            setPendingAction(null);
          }}
          caseItem={selectedCaseForAction}
          action={pendingAction}
          onConfirm={handleConfirmStatusChange}
          isLoading={isMutatingStatus}
        />
      )}

      {/* Create New Case Modal Dialog */}
      <CreateCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(_newCaseId) => {
          setIsCreateModalOpen(false);
          loadCases();
        }}
      />
    </div>
  );
};
