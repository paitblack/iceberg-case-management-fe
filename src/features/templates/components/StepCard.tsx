import React from 'react';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { WorkItemRow } from './WorkItemRow';
import { DependencyPicker } from './DependencyPicker';
import {
  useTemplateBuilder,
  type BuilderStep,
  type CompletionRuleOption,
} from '../context/TemplateBuilderContext';

interface StepCardProps {
  step: BuilderStep;
  index: number;
  totalSteps: number;
}

export const StepCard: React.FC<StepCardProps> = ({
  step,
  index,
  totalSteps,
}) => {
  const {
    steps,
    updateStep,
    removeStep,
    moveStep,
    addWorkItem,
    updateWorkItem,
    removeWorkItem,
    setStepDependencies,
    setStepDependencyJoinType,
  } = useTemplateBuilder();

  const isInitialEntry = !step.isStandalone && step.dependencies.length === 0;

  return (
    <div
      className={`iceberg-card p-5 md:p-6 space-y-4 border transition-all ${
        step.isStandalone
          ? 'border-amber-200 bg-amber-50/10 shadow-xs'
          : step.isOptional
            ? 'border-slate-300/80 border-dashed bg-white shadow-xs'
            : 'border-slate-200/90 shadow-xs hover:border-slate-300'
      }`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        {/* Step Badge & Editable Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#FDF2F8] border border-[#FBCFE8] flex items-center justify-center font-extrabold text-sm text-[#E1007A] shrink-0">
            {step.displayOrder}
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={step.name}
              onChange={(e) => updateStep(step.id, { name: e.target.value })}
              placeholder="Milestone Step Name..."
              className="w-full text-base font-bold text-slate-900 bg-transparent focus:outline-none focus:text-[#E1007A]"
            />
          </div>
          {isInitialEntry && (
            <span
              title="This step has no incoming dependencies and is active immediately upon case creation."
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0"
            >
              Initial Step
            </span>
          )}
          {step.isStandalone && (
            <span
              title="This step runs in parallel outside the DAG workflow."
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 shrink-0"
            >
              Standalone
            </span>
          )}
          {step.isOptional && (
            <span
              title="This step is optional and not required for case completion."
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 shrink-0"
            >
              Optional
            </span>
          )}
        </div>

        {/* Step Actions (Move Up, Move Down, Delete) */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => moveStep(step.id, 'up')}
            title="Move step up"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={index === totalSteps - 1}
            onClick={() => moveStep(step.id, 'down')}
            title="Move step down"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => removeStep(step.id)}
            title="Delete this milestone step"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ml-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Description, Completion Rule & Compact Toggles Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1 items-end">
        <div className="md:col-span-6 space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Step Description & Operational Scope
          </label>
          <input
            type="text"
            value={step.description || ''}
            onChange={(e) =>
              updateStep(step.id, { description: e.target.value })
            }
            placeholder="e.g. Confirm both legal parties instructed and TA6/TA10 protocol forms issued..."
            className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 placeholder:italic focus:bg-white focus:border-[#E1007A] focus:outline-none transition-colors"
          />
        </div>

        <div className="md:col-span-3 space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Completion Rule
          </label>
          <select
            value={step.completionRule.type}
            onChange={(e) =>
              updateStep(step.id, {
                completionRule: {
                  type: e.target.value as CompletionRuleOption,
                },
              })
            }
            className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:border-[#E1007A] focus:outline-none cursor-pointer"
          >
            <option value="all-required-work-items">
              All Required Work Items
            </option>
            <option value="any-required-work-item">
              Any Required Work Item
            </option>
            <option value="manual">Manual Authority Sign-off</option>
          </select>
        </div>

        {/* Compact Checkbox Toggles with Hover Tooltips */}
        <div className="md:col-span-3 flex items-center gap-2 py-1">
          <label
            title="This step is not linked to the workflow DAG. It activates immediately upon case creation and runs in parallel."
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
              step.isStandalone
                ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="checkbox"
              checked={step.isStandalone || false}
              onChange={(e) =>
                updateStep(step.id, { isStandalone: e.target.checked })
              }
              className="w-3.5 h-3.5 rounded text-[#E1007A] focus:ring-[#E1007A] border-slate-300 cursor-pointer"
            />
            <span>Standalone</span>
            <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
          </label>

          <label
            title="This step is not mandatory for case completion. The case can be completed even if this step remains unfinished."
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
              step.isOptional
                ? 'bg-purple-50 text-purple-900 border-purple-300 shadow-2xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="checkbox"
              checked={step.isOptional || false}
              onChange={(e) =>
                updateStep(step.id, { isOptional: e.target.checked })
              }
              className="w-3.5 h-3.5 rounded text-[#E1007A] focus:ring-[#E1007A] border-slate-300 cursor-pointer"
            />
            <span>Optional</span>
            <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
          </label>
        </div>
      </div>

      {/* Dependencies Picker */}
      <DependencyPicker
        currentStepId={step.id}
        allSteps={steps}
        selectedDependencies={step.dependencies}
        joinType={step.dependencyJoinType}
        onChangeDependencies={(deps) => setStepDependencies(step.id, deps)}
        onChangeJoinType={(jt) => setStepDependencyJoinType(step.id, jt)}
      />

      {/* Sub Work Items List */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#E1007A]" />
            <h4 className="text-xs font-bold text-slate-800">
              Work Items & Action Requirements ({step.workItems.length})
            </h4>
          </div>
          <button
            type="button"
            onClick={() => addWorkItem(step.id)}
            className="text-[11px] font-bold text-[#E1007A] hover:text-[#C70068] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Work Item
          </button>
        </div>

        {step.workItems.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400 bg-slate-50/50">
            No work items configured for this step. Click &ldquo;Add Work
            Item&rdquo; to add actions.
          </div>
        ) : (
          <div className="space-y-2">
            {step.workItems.map((wi) => (
              <WorkItemRow
                key={wi.id}
                workItem={wi}
                onUpdate={(updates) => updateWorkItem(step.id, wi.id, updates)}
                onRemove={() => removeWorkItem(step.id, wi.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
