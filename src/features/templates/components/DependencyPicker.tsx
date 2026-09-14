import React from 'react';
import { GitMerge, Layers, AlertCircle, Check } from 'lucide-react';
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

  // Candidate predecessor steps: any step except the current one and non-standalone steps
  const candidateSteps = allSteps.filter(
    (s) => s.id !== currentStepId && !s.isStandalone,
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
          <strong>Standalone Step:</strong> This step runs in parallel from case
          initiation and does not require any prior steps to complete.
        </span>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <GitMerge className="w-3.5 h-3.5 text-[#E1007A]" />
          <span>Prerequisites</span>
          <span className="text-[11px] font-normal text-slate-400">
            (Steps that must finish first)
          </span>
        </div>

        {/* Join Type Selector */}
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
            >
              Require ALL
            </button>
            <button
              type="button"
              onClick={() => onChangeJoinType('ANY')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                joinType === 'ANY'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Require ANY
            </button>
          </div>
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

      {/* Checklist of Predecessors */}
      {candidateSteps.length === 0 ? (
        <p className="text-[11px] text-slate-400 italic">
          First step in the workflow (no prior steps exist).
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 pt-0.5">
          {candidateSteps.map((step) => {
            const isChecked = selectedDependencies.includes(step.id);
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => toggleDependency(step.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                  isChecked
                    ? 'bg-pink-50 text-[#E1007A] border-pink-300 font-bold'
                    : 'bg-white text-slate-700 border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center text-[9px] font-bold ${
                    isChecked
                      ? 'bg-[#E1007A] text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {step.displayOrder}
                </div>
                <span className="truncate max-w-[220px]">{step.name}</span>
                {isChecked && <Check className="w-3 h-3 text-[#E1007A] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {selectedDependencies.length > 0 ? (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-0.5">
          <Layers className="w-3 h-3 text-[#E1007A]" />
          <span>
            Requires completion of {selectedDependencies.length} prior step
            {selectedDependencies.length > 1 ? 's' : ''} to unlock.
          </span>
        </div>
      ) : (
        <div className="text-[10px] text-emerald-700 font-medium pt-0.5 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Starts immediately when case is initiated.</span>
        </div>
      )}
    </div>
  );
};
