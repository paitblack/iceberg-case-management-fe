import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Check,
  ChevronDown,
  Sparkles,
  Lock,
  Globe,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import type { UserPersona } from '../../types/auth';

export const DevPersonaSwitcher: React.FC = () => {
  const { user, availablePersonas, switchPersona } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectPersona = (persona: UserPersona) => {
    switchPersona(persona.id);
    queryClient.invalidateQueries({ queryKey: ['cases'] });
    queryClient.invalidateQueries({ queryKey: ['case-workspace'] });
    setIsOpen(false);
  };

  const getPersonaBadge = (persona: UserPersona) => {
    if (persona.roles.some((r) => r.toLowerCase().includes('progressor') || r.toLowerCase().includes('admin'))) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-pink-700 bg-pink-50 border border-pink-200/80 px-2 py-0.5 rounded-full">
          <Sparkles className="w-2.5 h-2.5 text-[#E1007A]" />
          Super-User
        </span>
      );
    }
    if (persona.roles.some((r) => r.toLowerCase().includes('solicitor') || r.toLowerCase().includes('broker'))) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
          <Briefcase className="w-2.5 h-2.5 text-amber-600" />
          Conveyancer
        </span>
      );
    }
    if (persona.roles.some((r) => r.toLowerCase().includes('agent'))) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-full">
          <ShieldCheck className="w-2.5 h-2.5 text-indigo-600" />
          Internal Agent
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
        <Globe className="w-2.5 h-2.5 text-slate-500" />
        Client / External
      </span>
    );
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      {/* Trigger Button in Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 bg-white border rounded-xl py-1 px-2.5 shadow-2xs cursor-pointer transition-all ${
          isOpen
            ? 'border-[#E1007A] ring-2 ring-[#E1007A]/15 bg-pink-50/20'
            : 'border-slate-200/80 hover:border-slate-300'
        }`}
        title="Switch Development User Persona"
        aria-expanded={isOpen}
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#E1007A] to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-2xs shrink-0">
          {user.avatarText}
        </div>

        {/* User details */}
        <div className="text-left hidden sm:block min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
              {user.name}
            </p>
          </div>
          <p className="text-[10px] text-slate-500 font-medium truncate max-w-[140px]">
            {user.roles[0]}
          </p>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 hidden sm:block transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#E1007A]' : ''
          }`}
        />
      </button>

      {/* Persona Selection Dropdown Card */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-[9999] animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/10"
          style={{ backgroundColor: '#ffffff' }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                <Users className="w-4 h-4 text-[#E1007A]" />
                <span>Simulate User Persona (RBAC)</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                Dev Mode
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Select a persona to test role-based permissions, work item ownership, and fail-closed security.
            </p>
          </div>

          {/* Persona List */}
          <div className="p-2 space-y-1.5 max-h-[380px] overflow-y-auto">
            {availablePersonas.map((persona) => {
              const isSelected = persona.id === user.id;

              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => handleSelectPersona(persona)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'bg-pink-50/50 border-[#E1007A]/40 ring-1 ring-[#E1007A]/20'
                      : 'bg-white border-slate-100 hover:bg-slate-50/80 hover:border-slate-200'
                  }`}
                >
                  {/* Persona Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs ${
                      isSelected
                        ? 'bg-[#E1007A] text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {persona.avatarText}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-extrabold text-slate-900 truncate">
                          {persona.name}
                        </span>
                      </div>
                      {getPersonaBadge(persona)}
                    </div>

                    <p className="text-[10px] font-semibold text-slate-500 line-clamp-1">
                      Roles: {persona.roles.join(', ')}
                    </p>

                    <p className="text-[10.5px] text-slate-400 leading-snug line-clamp-2">
                      {persona.description}
                    </p>
                  </div>

                  {/* Selected check */}
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#E1007A] text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/40 text-[10px] text-slate-400 flex items-center justify-between rounded-b-2xl">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              API Headers: <code className="font-mono text-[9px] text-[#E1007A]">x-mock-roles</code>
            </span>
            <span className="font-mono text-[9px]">
              Company ID: {user.companyId}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
