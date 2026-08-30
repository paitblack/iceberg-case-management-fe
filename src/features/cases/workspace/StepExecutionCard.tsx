import React, { useState } from 'react';
import {
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  FastForward,
  CheckCheck,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { SlaBadge } from '../../../components/ui/SlaBadge';
import { WorkItemExecutionRow } from './WorkItemExecutionRow';
import { StepNotesSection } from './StepNotesSection';
import { InlineTargetDateEditor } from './InlineTargetDateEditor';
import type {
  BffWorkspaceStep,
  BffCaseDocument,
  BffParticipant,
  StepActionType,
  WorkItemActionType,
  AddCaseNotePayload,
} from '../../../types/api';

interface StepExecutionCardProps {
  step: BffWorkspaceStep;
  documents?: BffCaseDocument[];
  participants?: BffParticipant[];
  onStepAction: (stepId: string, action: StepActionType) => Promise<void>;
  onWorkItemAction: (
    stepId: string,
    workItemId: string,
    action: WorkItemActionType,
  ) => Promise<void>;
  onAddNote?: (payload: AddCaseNotePayload) => Promise<void>;
  onUpdateStepTargetDate?: (
    stepId: string,
    targetDate: string | null,
  ) => Promise<void>;
  onUpdateWorkItemTargetDate?: (
    stepId: string,
    workItemId: string,
    targetDate: string | null,
  ) => Promise<void>;
  loadingStepId: string | null;
  loadingWorkItemId: string | null;
  isAddingNote?: boolean;
}

export const StepExecutionCard: React.FC<StepExecutionCardProps> = ({
  step,
  documents = [],
  participants = [],
  onStepAction,
  onWorkItemAction,
  onAddNote,
  onUpdateStepTargetDate,
  onUpdateWorkItemTargetDate,
  loadingStepId,
  loadingWorkItemId,
  isAddingNote = false,
}) => {
  const isCompleted = step.status === 'Completed';
  const isInProgress =
    step.status === 'InProgress' || step.status === 'Available';
  const isPending = step.status === 'Pending';
  const isSkipped = step.status === 'Skipped';

  // Default expanded if InProgress, collapsible if completed/pending
  const [isExpanded, setIsExpanded] = useState<boolean>(
    isInProgress || isCompleted,
  );

  const completedWorkItemsCount = step.workItems.filter(
    (wi) => wi.status === 'Completed' || wi.status === 'Waived',
  ).length;

  const canCompleteStep = step.allowedActions?.includes('COMPLETE_STEP');
  const canSkipStep = step.allowedActions?.includes('SKIP_STEP');
  const isThisStepLoading = loadingStepId === step.id;

  return (
    <div
      className={`rounded-2xl border transition-all shadow-xs overflow-hidden ${
        isCompleted
          ? 'bg-white border-emerald-200/90'
          : isInProgress
            ? 'bg-white border-[#E1007A]/40 ring-2 ring-[#E1007A]/10 shadow-sm'
            : isSkipped
              ? 'bg-slate-50 border-slate-200 opacity-60'
              : 'bg-slate-50/70 border-slate-200'
      }`}
    >
      {/* Step Header Banner */}
      <div className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        {/* Step Badge, Status & Title */}
        <div
          className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer select-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Status Indicator Icon */}
          <div className="shrink-0">
            {isCompleted ? (
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              </div>
            ) : isInProgress ? (
              <div className="w-8 h-8 rounded-xl bg-[#E1007A] text-white flex items-center justify-center font-extrabold text-sm shadow-xs animate-pulse">
                {step.displayOrder}
              </div>
            ) : isPending ? (
              <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">
                <Lock className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs">
                {step.displayOrder}
              </div>
            )}
          </div>

          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={`text-sm md:text-base font-extrabold truncate ${
                  isCompleted
                    ? 'text-slate-800'
                    : isInProgress
                      ? 'text-[#E1007A]'
                      : 'text-slate-600'
                }`}
              >
                {step.name}
              </h3>

              <Badge
                variant={
                  isCompleted
                    ? 'success'
                    : isInProgress
                      ? 'required'
                      : 'default'
                }
                size="xs"
              >
                {step.status}
              </Badge>

              {step.isStandalone && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300/80 px-2 py-0.5 rounded-md">
                  Standalone
                </span>
              )}

              {step.isOptional && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                  (Optional)
                </span>
              )}

              {isPending && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md">
                  <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                  This step is not active yet
                </span>
              )}

              {step.workItems.length > 0 && (
                <span className="text-[11px] font-semibold text-slate-500">
                  {completedWorkItemsCount}/{step.workItems.length} tasks
                </span>
              )}

              {/* Step SLA Badge */}
              <SlaBadge
                slaStatus={step.slaStatus}
                targetDate={step.targetDate}
                size="xs"
                showDate={false}
              />

              {/* Step Target Date Editor */}
              {onUpdateStepTargetDate && (
                <div onClick={(e) => e.stopPropagation()}>
                  <InlineTargetDateEditor
                    targetDate={step.targetDate}
                    onUpdateTargetDate={(date) =>
                      onUpdateStepTargetDate(step.id, date)
                    }
                    title="Milestone Target Date"
                    isReadOnly={isPending || isCompleted || isSkipped}
                    size="xs"
                  />
                </div>
              )}
            </div>

            {step.description && (
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                {step.description}
              </p>
            )}
          </div>
        </div>

        {/* Step Action Buttons (Complete Step / Skip Step) */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {canSkipStep && (
            <Button
              variant="ghost"
              size="xs"
              isLoading={isThisStepLoading}
              onClick={() => onStepAction(step.id, 'SKIP_STEP')}
              leftIcon={<FastForward className="w-3.5 h-3.5" />}
              className="text-slate-500 hover:text-slate-800"
            >
              Skip Step
            </Button>
          )}

          {canCompleteStep && (
            <Button
              variant="primary"
              size="xs"
              isLoading={isThisStepLoading}
              onClick={() => onStepAction(step.id, 'COMPLETE_STEP')}
              leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
            >
              Complete Step
            </Button>
          )}

          {/* Toggle Expand / Collapse */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label={isExpanded ? 'Collapse step' : 'Expand step'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Work Items Section */}
      {isExpanded && (
        <div className="p-4 md:p-5 pt-0 space-y-2.5 border-t border-slate-100/80 bg-slate-50/40">
          {isPending && (
            <div className="p-3.5 mt-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center gap-2.5 text-xs text-amber-900 font-medium">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                This step is not active yet. Complete all prerequisite
                predecessor milestones to unlock task execution.
              </span>
            </div>
          )}

          {step.workItems.length === 0 ? (
            <div className="p-4 rounded-xl text-center text-xs text-slate-400 bg-white border border-dashed border-slate-200 mt-3">
              No specific work items defined for this step.
            </div>
          ) : (
            <div className="space-y-2 pt-3">
              {step.workItems.map((wi) => (
                <WorkItemExecutionRow
                  key={wi.id}
                  workItem={wi}
                  documents={documents}
                  isReadOnly={isPending}
                  isLoading={loadingWorkItemId === wi.id}
                  onAction={(workItemId, action) =>
                    onWorkItemAction(step.id, workItemId, action)
                  }
                  onUpdateTargetDate={
                    onUpdateWorkItemTargetDate
                      ? (date) =>
                          onUpdateWorkItemTargetDate(step.id, wi.id, date)
                      : undefined
                  }
                />
              ))}
            </div>
          )}

          {/* Step Operational Notes Accordion */}
          {onAddNote && (
            <div className="pt-2">
              <StepNotesSection
                stepId={step.id}
                stepName={step.name}
                notes={step.notes || []}
                participants={participants}
                onAddNote={onAddNote}
                isLoading={isAddingNote}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
