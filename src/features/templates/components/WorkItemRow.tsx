import React from 'react';
import { GripVertical, Trash2, Calendar, Shield } from 'lucide-react';
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
];

export const WorkItemRow: React.FC<WorkItemRowProps> = ({
  workItem,
  onUpdate,
  onRemove,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-2xs transition-all group">
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
          className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:text-[#E1007A]"
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
                ? 'bg-amber-50 text-amber-700 border-amber-200'
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
  );
};
