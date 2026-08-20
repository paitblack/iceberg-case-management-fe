import React from 'react';
import { GitMerge, Layers } from 'lucide-react';
import type { DependencyJoinType } from '../../../types/api';
import type { BuilderStep } from '../context/TemplateBuilderContext';

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
  // Candidate predecessor steps: any step except the current one
  const candidateSteps = allSteps.filter((s) => s.id !== currentStepId);

  const toggleDependency = (stepId: string) => {
    if (selectedDependencies.includes(stepId)) {
      onChangeDependencies(selectedDependencies.filter((id) => id !== stepId));
    } else {
      onChangeDependencies([...selectedDependencies, stepId]);
    }
  };

  return (
    <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <GitMerge className="w-3.5 h-3.5 text-[#E1007A]" />
          <span>Prerequisite Dependencies (DAG Predecessors)</span>
        </div>

        {/* Join Type Selector */}
        {selectedDependencies.length > 1 && (
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-0.5 rounded-lg text-[11px]">
            <span className="text-slate-400 pl-1.5 text-[10px] font-semibold uppercase">
              Join:
            </span>
            <button
              type="button"
              onClick={() => onChangeJoinType('ALL')}
              className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                joinType === 'ALL'
                  ? 'bg-[#E1007A] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ALL (Every predecessor must finish)
            </button>
            <button
              type="button"
              onClick={() => onChangeJoinType('ANY')}
              className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                joinType === 'ANY'
                  ? 'bg-[#E1007A] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ANY (At least one predecessor finishes)
            </button>
          </div>
        )}
      </div>

      {/* Checklist of Predecessors */}
      {candidateSteps.length === 0 ? (
        <p className="text-[11px] text-slate-400 italic">
          First root step in the workflow (no predecessors).
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 pt-1">
          {candidateSteps.map((step) => {
            const isChecked = selectedDependencies.includes(step.id);
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => toggleDependency(step.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  isChecked
                    ? 'bg-[#FDF2F8] text-[#E1007A] border-[#FBCFE8] shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] font-bold ${
                    isChecked
                      ? 'bg-[#E1007A] text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {step.displayOrder}
                </div>
                <span className="truncate max-w-[200px]">{step.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {selectedDependencies.length > 0 && (
        <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-0.5">
          <Layers className="w-3 h-3 text-[#E1007A]" />
          <span>
            {selectedDependencies.length} dependency edge(s) generated for
            backend execution snapshot.
          </span>
        </div>
      )}
    </div>
  );
};
