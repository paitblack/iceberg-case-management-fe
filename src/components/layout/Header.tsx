import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Bell,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { DevPersonaSwitcher } from './DevPersonaSwitcher';

export const Header: React.FC = () => {
  const location = useLocation();

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
    <header className="px-8 pt-5 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/70 bg-white/60 backdrop-blur-xs">
      {/* Page Title & Breadcrumb */}
      <div>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
          <Link to="/" className="hover:text-slate-800 transition-colors">
            Iceberg Platform
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
          <span className="text-slate-500">Case Management</span>
          <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
          <span className="text-[#E1007A] font-semibold bg-pink-50/80 px-2 py-0.5 rounded-md border border-pink-100 text-[11px]">
            {breadcrumb}
          </span>
        </nav>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h1>
      </div>

      {/* Header Controls & User Identity */}
      <div className="flex items-center gap-2.5 self-end md:self-center">
        {/* Tenant / Lifesycle Status Badge */}
        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-700">Lifesycle Hub</span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
              #UK-104
            </span>
          </div>
        </div>

        {/* Schedule / Tasks Calendar */}
        <button
          type="button"
          title="Schedule"
          className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/80 flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
        </button>

        {/* Alerts & Notifications */}
        <button
          type="button"
          title="Notifications"
          className="relative w-9 h-9 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/80 flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#E1007A] ring-2 ring-white" />
        </button>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-slate-200/80 hidden sm:block mx-0.5" />

        {/* Developer Persona Switcher (RBAC / PBAC) */}
        <DevPersonaSwitcher />
      </div>
    </header>
  );
};
