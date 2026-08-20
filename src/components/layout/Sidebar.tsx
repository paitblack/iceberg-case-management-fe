import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  FileCode,
  TrendingUp,
  Settings,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Cases', href: '/cases', icon: FolderKanban, badge: 'Live' },
  { label: 'Sales Progression', href: '/sales-progression', icon: TrendingUp },
  { label: 'Template Builder', href: '/templates', icon: FileCode },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex flex-col h-screen sticky top-0">
      {/* Brand Logo */}
      <div className="h-16 border-b border-slate-800/80 px-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-sm bg-gradient-to-r from-sky-300 via-indigo-200 to-white bg-clip-text text-transparent">
            Iceberg
          </span>
          <span className="text-xs text-slate-400 block font-normal -mt-0.5">
            Case Management
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
          Operations
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60',
                )
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400">Environment</span>
            <span className="text-emerald-400 text-[11px] font-mono">
              dev-local
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Fastify API</span>
            <span className="text-slate-300 font-mono">:4000</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
