import React from 'react';
import {
  GripVertical,
  Trash2,
  Calendar,
  Shield,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import type { BuilderWorkItem } from '../context/TemplateBuilderContext';

interface WorkItemRowProps {
  workItem: BuilderWorkItem;
  onUpdate: (updates: Partial<BuilderWorkItem>) => void;
  onRemove: () => void;
}

const ROLES = [
  'Sales Progressor',
  'Listing Agent',
  'Compliance Officer',
  'Valuer',
  'Branch Manager',
  'Buyer Solicitor',
  'Seller Solicitor',
  'Mortgage Broker',
  'Surveyor',
];

export const WorkItemRow: React.FC<WorkItemRowProps> = ({
  workItem,
  onUpdate,
  onRemove,
}) => {
  const isConditional = workItem.requirement === 'conditional';
  const isMissingCondition = isConditional && !workItem.condition?.trim();

  return (
    <div
      className={`rounded-xl border transition-all shadow-2xs p-3 space-y-2.5 ${
        isMissingCondition
          ? 'bg-amber-50/30 border-amber-300/90 ring-1 ring-amber-300/40'
          : 'bg-white border-slate-200/80 hover:border-slate-300'
      }`}
    >
      {/* Top Header Row: Drag Handle + Name + Role + Requirement + Key Date + Delete */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Left: Drag Handle + Name Input */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="text-slate-400 cursor-grab shrink-0">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={workItem.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Action, check, or evidence requirement name..."
            className="w-full bg-transparent text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:text-[#E1007A]"
          />
        </div>

        {/* Right Controls: Role, Requirement, Key Date, Delete */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {/* Role Selector */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
            <Shield className="w-3 h-3 text-slate-400" />
            <select
              value={workItem.requiredRole}
              onChange={(e) => onUpdate({ requiredRole: e.target.value })}
              className="bg-transparent text-[11px] font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Requirement Badge / Selector */}
          <select
            value={workItem.requirement}
            onChange={(e) =>
              onUpdate({
                requirement: e.target.value as
                  'required' | 'optional' | 'conditional',
              })
            }
            className={`text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 border cursor-pointer focus:outline-none ${
              workItem.requirement === 'required'
                ? 'bg-[#FDF2F8] text-[#E1007A] border-[#FBCFE8]'
                : workItem.requirement === 'conditional'
                  ? 'bg-amber-50 text-amber-800 border-amber-300 font-extrabold'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <option value="required">Required</option>
            <option value="optional">Optional</option>
            <option value="conditional">Conditional</option>
          </select>

          {/* Key Date Toggle Button */}
          <button
            type="button"
            onClick={() => onUpdate({ isKeyDate: !workItem.isKeyDate })}
            title="Mark as Key Date Milestone"
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              workItem.isKeyDate
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium'
                : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>

          {/* Delete Work Item */}
          <button
            type="button"
            onClick={onRemove}
            title="Remove task"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Description & Evidence Row (Directly visible on every task) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={workItem.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Description / Task Scope (e.g. Formal bank mortgage offer letter must be uploaded to evidence files)"
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/90 text-xs text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#E1007A] focus:ring-1 focus:ring-[#E1007A]/20 transition-all"
          />
        </div>

        {/* Evidence Requirement Toggle */}
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer select-none shrink-0 px-2 py-1 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
          <input
            type="checkbox"
            checked={Boolean(workItem.evidenceRequired)}
            onChange={(e) => onUpdate({ evidenceRequired: e.target.checked })}
            className="rounded border-slate-300 text-[#E1007A] focus:ring-[#E1007A] cursor-pointer"
          />
          <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Evidence Required</span>
        </label>
      </div>

      {/* Conditional Rule Field (Mandatory when requirement === 'conditional') */}
      {isConditional && (
        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 space-y-1.5 shadow-2xs animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
              <span>Condition / Requirement Rule</span>
              <span className="text-rose-600 font-extrabold">
                * (Mandatory)
              </span>
            </label>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
              Requirement: Conditional
            </span>
          </div>
          <input
            type="text"
            value={workItem.condition || ''}
            onChange={(e) => onUpdate({ condition: e.target.value })}
            placeholder="e.g. Only mandatory if the buyer is obtaining a mortgage loan"
            className={`w-full px-2.5 py-1.5 rounded-lg bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all ${
              isMissingCondition
                ? 'border border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-200'
                : 'border border-amber-300 focus:border-[#E1007A] focus:ring-1 focus:ring-[#E1007A]/20'
            }`}
          />
          {isMissingCondition && (
            <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 pt-0.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>
                Condition rule is required. Template cannot be saved if left
                empty.
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
