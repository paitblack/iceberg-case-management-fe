import React from 'react';
import {
  GitMerge,
  Layers,
  AlertCircle,
  Zap,
  ArrowRight,
  Plus,
  X,
} from 'lucide-react';
import type { DependencyJoinType } from '../../../types/api';
import type { BuilderStep } from '../context/TemplateBuilderContext';
import { useTemplateBuilder } from '../context/TemplateBuilderContext';

interface DependencyPickerProps {
  currentStepId: string;
  allSteps: BuilderStep[];
  selectedDependencies: string[];
  joinType: DependencyJoinType;
  onChangeDependencies: (newDependencies: string[]) => void;
  onChangeJoinType: (newJoinType: DependencyJoinType) => void;
}

export const DependencyPicker: React.FC<DependencyPickerProps> = ({
  currentStepId,
  allSteps,
  selectedDependencies,
  joinType,
  onChangeDependencies,
  onChangeJoinType,
}) => {
  const { backendDagError } = useTemplateBuilder();

  const currentStep = allSteps.find((s) => s.id === currentStepId);
  const isCurrentStepStandalone = currentStep?.isStandalone ?? false;

  // Candidate predecessor steps: any non-standalone step except the current one
  const candidateSteps = allSteps.filter(
    (s) => s.id !== currentStepId && !s.isStandalone,
  );

  const selectedSteps = allSteps.filter((s) =>
    selectedDependencies.includes(s.id),
  );

  const unselectedCandidateSteps = candidateSteps.filter(
    (s) => !selectedDependencies.includes(s.id),
  );

  const toggleDependency = (stepId: string) => {
    if (selectedDependencies.includes(stepId)) {
      onChangeDependencies(selectedDependencies.filter((id) => id !== stepId));
    } else {
      onChangeDependencies([...selectedDependencies, stepId]);
    }
  };

  if (isCurrentStepStandalone) {
    return (
      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/90 flex items-center gap-2.5 text-xs text-amber-900 font-medium">
        <GitMerge className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>Standalone Step:</strong> This step runs in parallel throughout
          the case lifecycle and does not depend on other steps.
        </span>
      </div>
    );
  }

  const hasDependencies = selectedDependencies.length > 0;

  return (
    <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
      {/* Header with Title and Current Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <GitMerge className="w-3.5 h-3.5 text-[#E1007A]" />
          <span>Step Dependencies</span>
          <span className="text-[11px] font-normal text-slate-400">
            (Steps that must finish first)
          </span>
        </div>

        {/* Live Status Badge */}
        {!hasDependencies ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Starts Automatically
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-pink-50 text-[#E1007A] border border-pink-200 shadow-2xs">
            Depends on {selectedDependencies.length} step
            {selectedDependencies.length > 1 ? `s (${joinType})` : ''}
          </span>
        )}
      </div>

      {/* Loop / Cycle Conflict Alert */}
      {backendDagError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 flex-1 min-w-0">
            <p className="font-bold text-rose-900">Workflow Conflict Detected</p>
            <p className="text-[11px] text-rose-700 leading-relaxed font-medium">
              {backendDagError}
            </p>
          </div>
        </div>
      )}

      {/* State A: Has Selected Dependencies -> Flow Pipeline View */}
      {hasDependencies ? (
        <div className="p-3 rounded-xl bg-gradient-to-r from-pink-50/40 via-white to-slate-50/50 border border-pink-200/80 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pink-100/70 pb-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#E1007A]" />
              Depends On ({selectedSteps.length} step{selectedSteps.length > 1 ? 's' : ''})
            </span>

            {/* Join Type Rule Switcher */}
            {selectedDependencies.length > 1 && (
              <div className="flex items-center gap-1 bg-white border border-slate-200/90 p-0.5 rounded-lg text-[11px] shadow-2xs">
                <span className="text-slate-400 pl-1.5 text-[10px] font-bold uppercase tracking-wider">
                  Rule:
                </span>
                <button
                  type="button"
                  onClick={() => onChangeJoinType('ALL')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    joinType === 'ALL'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="All listed steps must finish before unlocking"
                >
                  Require ALL (AND)
                </button>
                <button
                  type="button"
                  onClick={() => onChangeJoinType('ANY')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    joinType === 'ANY'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Any single listed step finishing will unlock"
                >
                  Require ANY (OR)
                </button>
              </div>
            )}
          </div>

          {/* Connected Steps Chips & Flow Arrow */}
          <div className="flex flex-wrap items-center gap-2">
            {selectedSteps.map((step) => (
              <div
                key={step.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-800 border border-pink-300 shadow-2xs"
              >
                <span className="w-4 h-4 rounded-md bg-[#E1007A] text-white text-[9px] font-extrabold flex items-center justify-center">
                  {step.displayOrder}
                </span>
                <span className="truncate max-w-[200px]">{step.name}</span>
                <button
                  type="button"
                  onClick={() => toggleDependency(step.id)}
                  className="p-0.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer ml-1"
                  title="Remove dependency"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#E1007A] pl-1">
              <ArrowRight className="w-3.5 h-3.5" />
              <span className="text-[11px] bg-pink-100/70 text-[#E1007A] px-2 py-0.5 rounded-md font-bold">
                Unlocks {currentStep?.name ? `"${currentStep.name}"` : 'This Step'}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 font-medium">
            {selectedDependencies.length === 1 ? (
              <span>This step will unlock after step {selectedSteps[0]?.displayOrder} is completed.</span>
            ) : joinType === 'ALL' ? (
              <span>All {selectedDependencies.length} previous steps must be completed to unlock this step.</span>
            ) : (
              <span>Completing any 1 of these {selectedDependencies.length} steps will unlock this step.</span>
            )}
          </p>
        </div>
      ) : (
        /* State B: No Dependencies -> Clear Callout Banner */
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gradient-to-r from-emerald-50/80 to-white border border-emerald-200/90 text-xs">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
            <Zap className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-emerald-950">
              Starts Automatically (No Dependencies)
            </p>
            <p className="text-[11px] text-emerald-700/90 mt-0.5 leading-relaxed font-medium">
              This step begins immediately when a case opens. It does not wait on other steps.
            </p>
          </div>
        </div>
      )}

      {/* Available Candidate Steps to Add / Link */}
      {candidateSteps.length === 0 ? (
        <p className="text-[11px] text-slate-400 italic">
          First step in the workflow (no prior steps exist).
        </p>
      ) : unselectedCandidateSteps.length > 0 ? (
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] font-semibold text-slate-600 block">
            {hasDependencies
              ? 'Add another step dependency:'
              : 'Need this step to wait for prior work? Choose required steps:'}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {unselectedCandidateSteps.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => toggleDependency(step.id)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-white text-slate-700 border border-slate-200/90 hover:border-[#E1007A]/50 hover:bg-pink-50/30 hover:text-slate-900 transition-all cursor-pointer shadow-2xs group"
                title={`Set "${step.name}" as a required previous step`}
              >
                <Plus className="w-3 h-3 text-slate-400 group-hover:text-[#E1007A] transition-colors" />
                <span className="w-4 h-4 rounded-md bg-slate-100 group-hover:bg-pink-100 text-[9px] font-bold flex items-center justify-center text-slate-600 group-hover:text-[#E1007A] transition-colors">
                  {step.displayOrder}
                </span>
                <span className="truncate max-w-[200px]">{step.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[10px] text-slate-400 italic pt-1">
          All available steps are already selected as dependencies.
        </p>
      )}
    </div>
  );
};
