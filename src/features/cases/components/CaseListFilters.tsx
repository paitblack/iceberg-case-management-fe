import React from 'react';
import { Search, LayoutGrid, List as ListIcon, X } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import type { CaseLifecycleStatus } from '../../../types/api';

interface CaseListFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedCaseTypeId: string;
  onCaseTypeChange: (caseTypeId: string) => void;
  availableStatuses: CaseLifecycleStatus[];
  availableCaseTypes: { id: string; name: string }[];
  viewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
  totalCount: number;
}

export const CaseListFilters: React.FC<CaseListFiltersProps> = ({
  search,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedCaseTypeId,
  onCaseTypeChange,
  availableStatuses,
  availableCaseTypes,
  viewMode,
  onViewModeChange,
  totalCount,
}) => {
  const hasActiveFilters =
    search || selectedStatus !== 'all' || selectedCaseTypeId !== 'all';

  const handleResetFilters = () => {
    onSearchChange('');
    onStatusChange('all');
    onCaseTypeChange('all');
  };

  return (
    <div className="iceberg-card p-4 space-y-3.5 border border-slate-200/90 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Search Bar */}
        <div className="flex-1 min-w-[260px]">
          <Input
            placeholder="Search by property address, client name, reference..."
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full text-xs"
          />
        </div>

        {/* Center: Dynamic Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Status:
            </span>
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {availableStatuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Case Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Type:
            </span>
            <select
              value={selectedCaseTypeId}
              onChange={(e) => onCaseTypeChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              <option value="all">All Case Types</option>
              {availableCaseTypes.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Right: View Mode Toggle & Total Count */}
        <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          <span className="text-xs font-semibold text-slate-500">
            <strong className="text-slate-900">{totalCount}</strong> active
            cases
          </span>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              title="Table View"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#E1007A] shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              title="Grid Cards View"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#E1007A] shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
