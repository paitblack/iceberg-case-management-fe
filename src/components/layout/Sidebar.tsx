import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, GitBranch, User } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Cases', href: '/cases', icon: FolderKanban },
  { label: 'Workflow Templates', href: '/templates', icon: GitBranch },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-16 md:w-20 bg-[#11131A] flex flex-col items-center py-5 h-screen sticky top-0 z-40 border-r border-slate-800/40">
      {/* Brand Icon */}
      <div className="mb-8">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition-transform">
          <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[11px] border-l-[#E1007A] border-b-[6px] border-b-transparent ml-1" />
        </div>
      </div>

      {/* Main Navigation Items */}
      <div className="flex-1 flex flex-col items-center gap-3 w-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              title={item.label}
              className={({ isActive }) =>
                cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 group relative',
                  isActive
                    ? 'bg-[#E1007A] text-white shadow-md shadow-[#E1007A]/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
                )
              }
            >
              <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
              {/* Tooltip */}
              <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>

      {/* User profile bottom */}
      <div className="mt-auto pt-4 border-t border-slate-800/60 w-full flex justify-center">
        <button
          title="Account"
          className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <User className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};
