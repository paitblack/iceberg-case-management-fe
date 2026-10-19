import React from 'react';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  CheckCircle2,
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
      id={`step-card-${step.id}`}
      className={`iceberg-card p-5 md:p-6 space-y-4 border transition-all rounded-2xl ${
        step.isStandalone
          ? 'border-amber-200/90 bg-amber-50/10 shadow-xs'
          : step.isOptional
            ? 'border-slate-300/80 border-dashed bg-white shadow-xs'
            : 'border-slate-200/90 bg-white shadow-xs hover:border-slate-300'
      }`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        {/* Step Badge & Editable Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center font-extrabold text-xs text-[#E1007A] shrink-0 shadow-2xs">
            {step.displayOrder}
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={step.name}
              onChange={(e) => updateStep(step.id, { name: e.target.value })}
              placeholder="Milestone Step Name..."
              className="w-full text-base font-bold text-slate-900 bg-transparent focus:outline-none focus:text-[#E1007A] transition-colors"
            />
          </div>
          {isInitialEntry && (
            <span
              title="This step starts immediately upon case creation without waiting for prior milestones."
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0"
            >
              Initial Step
            </span>
          )}
          {step.isStandalone && (
            <span
              title="This step runs in parallel throughout the case."
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
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
          >
            <ChevronUp className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={index === totalSteps - 1}
            onClick={() => moveStep(step.id, 'down')}
            title="Move step down"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
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
      <div className="flex flex-col lg:flex-row gap-3 pt-1 items-stretch lg:items-end">
        {/* Step Description Input */}
        <div className="flex-1 min-w-[280px] space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Operational Scope & Details
          </label>
          <input
            type="text"
            value={step.description || ''}
            onChange={(e) =>
              updateStep(step.id, { description: e.target.value })
            }
            placeholder="e.g. Confirm both legal parties instructed and TA6/TA10 protocol forms issued..."
            className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200/90 focus:border-[#E1007A] rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 placeholder:italic focus:outline-none transition-all shadow-2xs"
          />
        </div>

        {/* Completion Rule & Toggles Group */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="space-y-1 min-w-[170px]">
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
              className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200/90 focus:border-[#E1007A] rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer shadow-2xs transition-all"
            >
              <option value="all-required-work-items">
                All Required Tasks
              </option>
              <option value="any-required-work-item">
                Any Required Task
              </option>
              <option value="manual">Manual Sign-off</option>
            </select>
          </div>

          {/* Compact Checkbox Toggles */}
          <div className="flex items-center gap-2 pt-4">
            <label
              title="Runs in parallel from case start without prerequisite blockers."
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                step.isStandalone
                  ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/90'
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
            </label>

            <label
              title="Optional milestone step; case can complete without this step."
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                step.isOptional
                  ? 'bg-purple-50 text-purple-900 border-purple-300 shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/90'
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
            </label>
          </div>
        </div>
      </div>

      {/* Prerequisites Dependencies Picker */}
      <DependencyPicker
        currentStepId={step.id}
        allSteps={steps}
        selectedDependencies={step.dependencies}
        joinType={step.dependencyJoinType}
        onChangeDependencies={(deps) => setStepDependencies(step.id, deps)}
        onChangeJoinType={(jt) => setStepDependencyJoinType(step.id, jt)}
      />

      {/* Sub Tasks / Checklist Section */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#E1007A]" />
            <h4 className="text-xs font-bold text-slate-800">
              Tasks
            </h4>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.2 rounded-full">
              {step.workItems.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => addWorkItem(step.id)}
            className="text-[11px] font-bold text-[#E1007A] hover:text-[#C70068] bg-pink-50 hover:bg-pink-100/70 border border-pink-200/70 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
          >
            <Plus className="w-3 h-3" />
            <span>Add Task</span>
          </button>
        </div>

        {step.workItems.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400 bg-slate-50/50">
            No tasks configured for this step. Click &ldquo;Add Task&rdquo; to add requirements.
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
