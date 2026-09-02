import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  Search,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { CreateCaseModal } from '../../features/cases/components/CreateCaseModal';
import { DevPersonaSwitcher } from './DevPersonaSwitcher';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const getPageInfo = () => {
    switch (location.pathname) {
      case '/templates':
        return {
          title: 'Template & Workflow Studio',
          breadcrumb: 'Template Studio',
          subtitle:
            'Configure DAG-based progression stages, work items, and immutable version releases.',
        };
      case '/cases':
      case '/sales-progression':
        return {
          title: 'Case Directory',
          breadcrumb: 'Live Cases',
          subtitle:
            'Track live progression, manage stage executions, and resolve workflow blockers.',
        };
      default:
        return {
          title: 'Operations Dashboard',
          breadcrumb: 'Overview',
          subtitle:
            'Real-time pipeline visibility, milestone throughput, and active case blockers.',
        };
    }
  };

  const { title, breadcrumb } = getPageInfo();

  return (
    <header className="px-8 pt-6 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 bg-transparent">
      {/* Page Title & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
          <Link to="/" className="hover:text-slate-900 transition-colors">
            Iceberg Platform
          </Link>
          <span>/</span>
          <span className="text-slate-400">Case Management</span>
          <span>/</span>
          <span className="text-[#E1007A] font-semibold">{breadcrumb}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {title}
        </h1>
      </div>

      {/* Header Controls & User Identity */}
      <div className="flex items-center gap-3 self-end md:self-center">
        {/* Quick Launch Action Button */}
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsCreateModalOpen(true)}
          className="shadow-sm font-bold"
        >
          New Case
        </Button>

        {/* Quick Search */}
        <div className="relative hidden xl:block w-56">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search cases, files..."
            className="w-full bg-white border border-slate-200/90 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#E1007A] focus:ring-2 focus:ring-[#E1007A]/15 shadow-2xs transition-all"
          />
        </div>

        {/* Tenant / Lifesycle Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-semibold text-slate-700">Lifesycle Hub</span>
          <span className="text-[10px] text-slate-500 font-mono">#UK-104</span>
        </div>

        {/* Schedule / Tasks Calendar */}
        <button
          title="Schedule"
          className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-2xs transition-colors"
        >
          <Calendar className="w-4 h-4" />
        </button>

        {/* Alerts & Notifications */}
        <button
          title="Notifications"
          className="relative w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-2xs transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#E1007A]" />
        </button>

        {/* Developer Persona Switcher (RBAC / PBAC) */}
        <DevPersonaSwitcher />
      </div>

      {/* Start New Case Modal */}
      <CreateCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newCaseId) => navigate(`/cases/${newCaseId}`)}
      />
    </header>
  );
};
