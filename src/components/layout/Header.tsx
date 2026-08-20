import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const Header: React.FC = () => {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search cases, templates, references..."
            className="w-full bg-slate-900/60 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="info" size="sm">
            Lifesycle Connected
          </Badge>
          <Badge variant="purple" size="sm">
            v0.1.0-alpha
          </Badge>
        </div>

        <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        </button>

        <div className="h-6 w-px bg-slate-800" />

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-medium text-slate-200">
              Agent Workspace
            </p>
            <p className="text-[10px] text-slate-400">Lifesycle Tenant #1001</p>
          </div>
        </div>
      </div>
    </header>
  );
};
