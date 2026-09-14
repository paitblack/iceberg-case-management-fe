import React from 'react';
import {
  GripVertical,
  Trash2,
  Calendar,
  Shield,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import {
  useTemplateBuilder,
  type BuilderWorkItem,
} from '../context/TemplateBuilderContext';

interface WorkItemRowProps {
  workItem: BuilderWorkItem;
  onUpdate: (updates: Partial<BuilderWorkItem>) => void;
  onRemove: () => void;
}

export const WorkItemRow: React.FC<WorkItemRowProps> = ({
  workItem,
  onUpdate,
  onRemove,
}) => {
  const { roles } = useTemplateBuilder();
  const isConditional = workItem.requirement === 'conditional';
  const isMissingCondition = isConditional && !workItem.condition?.trim();

  const hasValidRole = Boolean(
    workItem.ownerRoleId && roles.some((r) => r.id === workItem.ownerRoleId),
  );
  const selectedRoleId = hasValidRole
    ? (workItem.ownerRoleId as string)
    : roles.length > 0
      ? roles[0].id
      : '';

  return (
    <div
      className={`rounded-xl border transition-all shadow-2xs p-3 space-y-1.5 ${
        isMissingCondition
          ? 'bg-amber-50/30 border-amber-300/90 ring-1 ring-amber-300/40'
          : 'bg-white border-slate-200/80 hover:border-slate-300'
      }`}
    >
      {/* Top Header Row: Drag Handle + Name + Role + Requirement + Evidence + Key Date + Delete */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Left: Drag Handle + Name Input */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="text-slate-300 hover:text-slate-500 cursor-grab shrink-0 transition-colors">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={workItem.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Action, check, or evidence requirement name..."
            className="w-full bg-transparent text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:text-[#E1007A] transition-colors"
          />
        </div>

        {/* Right Controls: Role, Requirement, Evidence, Key Date, Delete */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {/* Role Selector with proper comfortable width */}
          <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-lg px-2.5 py-1 transition-colors">
            <Shield className="w-3 h-3 text-slate-400 shrink-0" />
            <select
              value={selectedRoleId}
              onChange={(e) =>
                onUpdate({
                  ownerRoleId: e.target.value || undefined,
                  requiredRole: e.target.value || undefined,
                })
              }
              className="bg-transparent text-[11px] font-semibold text-slate-700 focus:outline-none cursor-pointer max-w-[170px] truncate"
            >
              {roles.length === 0 && <option value="">No roles defined</option>}
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
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
            className={`text-[10px] font-bold uppercase tracking-wider rounded-lg px-2.5 py-1 border cursor-pointer focus:outline-none transition-colors ${
              workItem.requirement === 'required'
                ? 'bg-pink-50 text-[#E1007A] border-pink-200 font-extrabold'
                : workItem.requirement === 'conditional'
                  ? 'bg-amber-50 text-amber-800 border-amber-300 font-extrabold'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <option value="required">Required</option>
            <option value="optional">Optional</option>
            <option value="conditional">Conditional</option>
          </select>

          {/* Evidence Requirement Toggle Button */}
          <button
            type="button"
            onClick={() =>
              onUpdate({ evidenceRequired: !workItem.evidenceRequired })
            }
            title={
              workItem.evidenceRequired
                ? 'Evidence document required'
                : 'Toggle evidence requirement'
            }
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs transition-colors cursor-pointer ${
              workItem.evidenceRequired
                ? 'bg-sky-50 text-sky-700 border-sky-200 font-semibold shadow-2xs'
                : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold hidden md:inline">
              Evidence
            </span>
          </button>

          {/* Key Date Toggle Button */}
          <button
            type="button"
            onClick={() => onUpdate({ isKeyDate: !workItem.isKeyDate })}
            title={
              workItem.isKeyDate
                ? 'Key Milestone Date'
                : 'Mark as Key Date Milestone'
            }
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              workItem.isKeyDate
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold shadow-2xs'
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
            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Description Sub-row: Inline and Clean (No giant separate box) */}
      <div className="pl-6">
        <input
          type="text"
          value={workItem.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Add guidance or evidence notes for this task (optional)..."
          className="w-full px-2 py-1 rounded-md text-[11px] text-slate-600 placeholder:text-slate-400 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-200 focus:border-[#E1007A]/40 focus:ring-1 focus:ring-pink-500/10 focus:outline-none transition-all"
        />
      </div>

      {/* Conditional Rule Field (Mandatory when requirement === 'conditional') */}
      {isConditional && (
        <div className="pl-6 pt-1">
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 space-y-1.5 shadow-2xs animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                <span>Condition / Requirement Rule</span>
                <span className="text-rose-600 font-extrabold">* (Required)</span>
              </label>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                Conditional Task
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
                  Condition rule is required. Template cannot be saved if left empty.
                </span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
