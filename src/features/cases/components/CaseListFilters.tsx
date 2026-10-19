import React from 'react';
import { Search, LayoutGrid, List as ListIcon, X, ChevronDown, Layers } from 'lucide-react';
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
    Boolean(search) || selectedStatus !== 'all' || selectedCaseTypeId !== 'all';

  const handleResetFilters = () => {
    onSearchChange('');
    onStatusChange('all');
    onCaseTypeChange('all');
  };

  const statusTabList: { label: string; value: string }[] = [
    { label: 'All Cases', value: 'all' },
    ...availableStatuses.map((st) => ({ label: st, value: st })),
  ];

  return (
    <div className="iceberg-card p-4 space-y-3.5 border border-slate-200/90 shadow-2xs">
      {/* Top Row: Search + Case Type Dropdown + View Mode */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[280px]">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by property address, client name, reference..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200/90 rounded-xl placeholder-slate-400 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#E1007A]/20 focus:border-[#E1007A] transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Controls: Workflow Type Filter + View Mode Switcher */}
        <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
          {/* Case Type Dropdown */}
          <div className="relative inline-flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Layers className="w-3.5 h-3.5 text-[#E1007A]" />
            </div>
            <select
              value={selectedCaseTypeId}
              onChange={(e) => onCaseTypeChange(e.target.value)}
              className="appearance-none pl-8 pr-8 py-2 text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E1007A]/20 focus:border-[#E1007A] transition-all cursor-pointer max-w-[200px] truncate shadow-2xs"
            >
              <option value="all">All Workflow Types</option>
              {availableCaseTypes.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Reset Filters CTA if active */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 px-3 py-2 rounded-xl border border-rose-200 transition-all cursor-pointer shadow-2xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              title="Table View"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#E1007A] shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              title="Grid Cards View"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#E1007A] shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Quick Status Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div role="tablist" className="flex flex-wrap items-center gap-1.5">
          {statusTabList.map((tab) => {
            const isSelected = selectedStatus === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onStatusChange(tab.value)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#E1007A] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <span className="text-[11px] font-semibold text-slate-500">
          Showing <strong className="text-slate-900">{totalCount}</strong> results
        </span>
      </div>
    </div>
  );
};
