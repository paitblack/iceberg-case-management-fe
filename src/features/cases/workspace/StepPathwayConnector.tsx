import React from 'react';
import { CheckCircle2, ArrowDown, Lock } from 'lucide-react';
import type { BffWorkspaceStep } from '../../../types/api';

interface StepPathwayConnectorProps {
  currentStep: BffWorkspaceStep;
  nextStep: BffWorkspaceStep;
  stepIndex?: number;
  totalSteps?: number;
}

export const StepPathwayConnector: React.FC<StepPathwayConnectorProps> = ({
  currentStep,
  nextStep,
}) => {
  const isCurrentCompleted = currentStep.status === 'Completed';
  const isCurrentInProgress =
    currentStep.status === 'InProgress' || currentStep.status === 'Available';
  const isNextInProgress =
    nextStep.status === 'InProgress' || nextStep.status === 'Available';
  const isNextCompleted = nextStep.status === 'Completed';
  const isNextPending = nextStep.status === 'Pending';

  // Determine line style and pill theme
  let trackColorClass = 'border-slate-300';
  let pillBgClass = 'bg-slate-50 border-slate-200 text-slate-600';
  let iconNode = <ArrowDown className="w-3 h-3 text-slate-400" />;
  let labelText = `Proceeding to Stage ${nextStep.displayOrder}`;

  if (isCurrentCompleted && isNextCompleted) {
    trackColorClass = 'bg-emerald-500';
    pillBgClass =
      'bg-emerald-50/90 border-emerald-200/90 text-emerald-800 shadow-2xs';
    iconNode = <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
    labelText = `Milestone ${currentStep.displayOrder} Completed → Stage ${nextStep.displayOrder}`;
  } else if (isCurrentCompleted && isNextInProgress) {
    trackColorClass = 'bg-gradient-to-b from-emerald-500 to-[#E1007A]';
    pillBgClass =
      'bg-gradient-to-r from-emerald-50/90 via-white to-pink-50/90 border-pink-200/80 text-slate-800 shadow-2xs';
    iconNode = (
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E1007A]"></span>
      </span>
    );
    labelText = `Milestone ${currentStep.displayOrder} Cleared • Active Stage ${nextStep.displayOrder}`;
  } else if (isCurrentCompleted && isNextPending) {
    trackColorClass = 'bg-gradient-to-b from-emerald-500 to-slate-300';
    pillBgClass = 'bg-slate-50 border-slate-200 text-slate-700 shadow-2xs';
    iconNode = <Lock className="w-3 h-3 text-slate-400" />;
    labelText = `Milestone ${currentStep.displayOrder} Cleared → Pending Milestone ${nextStep.displayOrder}`;
  } else if (isCurrentInProgress && isNextInProgress) {
    trackColorClass = 'bg-gradient-to-b from-[#E1007A] via-pink-400 to-[#E1007A]';
    pillBgClass =
      'bg-pink-50/90 border-pink-200 text-[#E1007A] shadow-2xs font-semibold';
    iconNode = <ArrowDown className="w-3 h-3 text-[#E1007A]" />;
    labelText = `Linear Progression Pathway → Milestone ${nextStep.displayOrder}`;
  } else if (isCurrentInProgress && isNextPending) {
    trackColorClass = 'border-dashed border-slate-300';
    pillBgClass = 'bg-slate-50 border-slate-200 text-slate-600 shadow-2xs';
    iconNode = <Lock className="w-3 h-3 text-slate-400" />;
    labelText = `Unlocks after Milestone ${currentStep.displayOrder} completion`;
  } else if (isNextPending) {
    trackColorClass = 'border-dashed border-slate-200';
    pillBgClass = 'bg-slate-50/80 border-slate-200/70 text-slate-400';
    iconNode = <Lock className="w-2.5 h-2.5 text-slate-300" />;
    labelText = `Pending Milestone ${nextStep.displayOrder}`;
  }

  return (
    <div
      className="relative flex flex-col items-center my-0.5 py-1 select-none"
      aria-hidden="true"
    >
      {/* Top track segment */}
      <div
        className={`w-0.5 h-3 ${
          trackColorClass.includes('border')
            ? `border-l-2 ${trackColorClass}`
            : trackColorClass
        }`}
      />

      {/* Pathway Milestone Connector Badge */}
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] border font-medium transition-all duration-200 hover:scale-102 ${pillBgClass}`}
      >
        {iconNode}
        <span>{labelText}</span>
        <ArrowDown className="w-2.5 h-2.5 opacity-60 ml-0.5" />
      </div>

      {/* Bottom track segment leading into next card */}
      <div
        className={`w-0.5 h-3 ${
          trackColorClass.includes('border')
            ? `border-l-2 ${trackColorClass}`
            : trackColorClass
        }`}
      />
    </div>
  );
};
