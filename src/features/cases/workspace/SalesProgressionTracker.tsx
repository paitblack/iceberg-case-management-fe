import React, { useMemo } from 'react';
import { Check } from 'lucide-react';
import type {
  BffWorkspaceSnapshot,
} from '../../../types/api';

interface SalesProgressionTrackerProps {
  snapshot: BffWorkspaceSnapshot;
  onSelectStep?: (stepId: string) => void;
}

function formatRoleLabel(roleIdOrText?: string | null): string {
  if (!roleIdOrText) return 'Sales Progressor';
  const roleText = roleIdOrText.toLowerCase();

  if (
    roleText.includes('vendor-solicitor') ||
    roleText.includes('seller-solicitor')
  ) {
    return 'Seller Solicitor';
  }
  if (
    roleText.includes('buyer-solicitor') ||
    roleText.includes('purchaser-solicitor')
  ) {
    return 'Buyer Solicitor';
  }
  if (roleText.includes('estate-agent') || roleText.includes('agent')) {
    return 'Estate Agent';
  }
  if (roleText.includes('broker') || roleText.includes('mortgage')) {
    return 'Mortgage Broker';
  }
  if (roleText.includes('vendor') || roleText.includes('seller')) {
    return 'Seller';
  }
  if (roleText.includes('buyer') || roleText.includes('purchaser')) {
    return 'Buyer';
  }

  const withoutPrefix = roleIdOrText.replace(/^role-/, '');
  const parts = withoutPrefix
    .split('-')
    .filter((p) => !/^[a-z0-9]{6,}$/i.test(p));
  if (parts.length > 0) {
    return parts.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return roleIdOrText;
}

export const SalesProgressionTracker: React.FC<SalesProgressionTrackerProps> = ({
  snapshot,
  onSelectStep,
}) => {
  const steps = useMemo(() => {
    return [...(snapshot.steps || [])].sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );
  }, [snapshot.steps]);

  // Determine current active step index
  const currentStepIndex = useMemo(() => {
    if (steps.length === 0) return -1;
    const inProgressIdx = steps.findIndex((s) => s.status === 'InProgress');
    if (inProgressIdx !== -1) return inProgressIdx;

    const pendingIdx = steps.findIndex((s) => s.status === 'Pending');
    if (pendingIdx !== -1) return pendingIdx;

    // If all completed, index is past the last step
    return steps.length;
  }, [steps]);

  const currentStep = useMemo(() => {
    if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
      return steps[currentStepIndex];
    }
    return steps[steps.length - 1];
  }, [steps, currentStepIndex]);

  // Telemetry: 1. Current Blocker
  const currentBlocker = useMemo(() => {
    if (snapshot.blockers && snapshot.blockers.length > 0) {
      const raw = snapshot.blockers[0];
      let title = raw;
      let detail = raw;
      if (raw.includes(':')) {
        const parts = raw.split(':');
        title = parts[0]?.trim() || raw;
        detail = parts.slice(1).join(':').trim() || raw;
      } else if (raw.includes(' - ')) {
        const parts = raw.split(' - ');
        title = parts[0]?.trim() || raw;
        detail = parts.slice(1).join(' - ').trim() || raw;
      }
      return {
        title,
        detail,
        isBlocked: true,
      };
    }

    if (currentStep?.blockerReason) {
      return {
        title: 'Milestone Blocker',
        detail: currentStep.blockerReason,
        isBlocked: true,
      };
    }

    return {
      title: 'None',
      detail: 'All milestone progression clear',
      isBlocked: false,
    };
  }, [snapshot.blockers, currentStep]);

  // Telemetry: 2. Next Action
  const nextAction = useMemo(() => {
    if (currentStep) {
      const pendingTask = currentStep.workItems?.find(
        (w) => w.status === 'Pending',
      );
      if (pendingTask) {
        const title = pendingTask.name || pendingTask.title || 'Execute Task';
        let detail = `Manual task - ${snapshot.assignedProgressorName || 'Sales Progressor'}`;
        if (pendingTask.assignee?.name) {
          detail = `Assigned: ${pendingTask.assignee.name}`;
        } else if (pendingTask.role || pendingTask.ownerRoleId) {
          detail = `Manual task - ${formatRoleLabel(pendingTask.role || pendingTask.ownerRoleId)}`;
        }
        return { title, detail };
      }
      return {
        title: currentStep.name,
        detail: 'Milestone progression review',
      };
    }
    return {
      title: 'All Actions Completed',
      detail: 'Case ready for final resolution',
    };
  }, [currentStep, snapshot.assignedProgressorName]);

  // Telemetry: 3. Next Chase
  const nextChase = useMemo(() => {
    if (snapshot.status === 'OnHold') {
      return {
        title: 'Held',
        detail: currentBlocker.isBlocked
          ? `Chase ${currentBlocker.title}`
          : 'Chase hold resolution',
        isUrgent: true,
      };
    }

    if (currentStep?.targetDate) {
      try {
        const d = new Date(currentStep.targetDate);
        const formatted = d.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
        });
        return {
          title: `Due ${formatted}`,
          detail: `Chase ${currentStep.name}`,
          isUrgent: false,
        };
      } catch {
        // fallback
      }
    }

    if (currentBlocker.isBlocked) {
      return {
        title: 'Action Required',
        detail: `Chase ${currentBlocker.title}`,
        isUrgent: true,
      };
    }

    return {
      title: 'Routine Review',
      detail: `Chase ${currentStep?.name || 'next milestone'}`,
      isUrgent: false,
    };
  }, [snapshot.status, currentStep, currentBlocker]);

  // Telemetry: 4. Days in Current Milestone
  const daysInMilestone = useMemo(() => {
    const dateStr = currentStep?.startedAt || snapshot.updatedAt;
    let diffDays = 0;
    if (dateStr) {
      try {
        const started = new Date(dateStr).getTime();
        const now = Date.now();
        diffDays = Math.max(
          0,
          Math.floor((now - started) / (1000 * 60 * 60 * 24)),
        );
      } catch {
        diffDays = 0;
      }
    }

    const daysText = diffDays === 1 ? '1 day' : `${diffDays} days`;
    const milestoneName = currentStep?.name || 'Current Milestone';

    return {
      days: daysText,
      milestoneName,
    };
  }, [currentStep, snapshot.updatedAt]);

  if (steps.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* 1. Milestone Stepper Bar Card */}
      <div className="iceberg-card p-4 sm:p-5 border border-slate-200/90 shadow-2xs bg-white">
        <div className="overflow-x-auto pb-2 scrollbar-thin">
          <div className="min-w-fit flex items-start justify-between px-2 py-1">
            {steps.map((step, idx) => {
              const isCompleted =
                step.status === 'Completed' || step.status === 'Skipped';
              const isCurrent = currentStepIndex === idx;
              const isLast = idx === steps.length - 1;
              const isLinePink = isCompleted && idx < currentStepIndex;

              return (
                <React.Fragment key={step.id}>
                  {/* Step Node */}
                  <div
                    onClick={() => onSelectStep?.(step.id)}
                    className="flex flex-col items-center text-center cursor-pointer group shrink-0 min-w-[80px] max-w-[110px] select-none"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectStep?.(step.id);
                      }
                    }}
                  >
                    {/* Circle */}
                    <div
                      className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center font-extrabold text-xs transition-all shadow-2xs group-hover:scale-110 group-active:scale-95 ${
                        isCompleted
                          ? 'bg-[#E1007A] text-white shadow-pink-200'
                          : isCurrent
                            ? 'bg-[#E1007A] text-white ring-4 ring-pink-100 shadow-md'
                            : 'bg-slate-100 text-slate-400 border border-slate-200 group-hover:border-[#E1007A]/50 group-hover:bg-pink-50/50 group-hover:text-[#E1007A]'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    {/* Step Label */}
                    <span
                      className={`mt-2 text-[11px] leading-snug line-clamp-2 px-1 transition-colors ${
                        isCompleted || isCurrent
                          ? 'font-bold text-slate-800 group-hover:text-[#E1007A]'
                          : 'font-medium text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>

                  {/* Connecting Line between steps */}
                  {!isLast && (
                    <div className="flex-1 min-w-[20px] md:min-w-[32px] max-w-[64px] h-0.5 mt-[15px] md:mt-[17px] shrink self-start">
                      <div
                        className={`h-full transition-colors ${
                          isLinePink ? 'bg-[#E1007A]' : 'bg-slate-200'
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Current Position Telemetry Card */}
      <div className="iceberg-card p-4 sm:p-5 border border-slate-200/90 shadow-2xs bg-white space-y-3.5">
        <h4 className="text-xs md:text-sm font-extrabold text-slate-900 tracking-tight">
          Current position
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0 lg:divide-x lg:divide-slate-100">
          {/* Col 1: Current Blocker */}
          <div className="lg:pr-4 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Current Blocker
            </span>
            <p
              className={`text-xs md:text-sm font-extrabold leading-snug line-clamp-1 ${
                currentBlocker.isBlocked ? 'text-slate-900' : 'text-emerald-700'
              }`}
            >
              {currentBlocker.title}
            </p>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
              {currentBlocker.detail}
            </p>
          </div>

          {/* Col 2: Next Action */}
          <div className="lg:px-4 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Next Action
            </span>
            <p className="text-xs md:text-sm font-extrabold text-slate-900 leading-snug line-clamp-1">
              {nextAction.title}
            </p>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
              {nextAction.detail}
            </p>
          </div>

          {/* Col 3: Next Chase */}
          <div className="lg:px-4 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Next Chase
            </span>
            <p
              className={`text-xs md:text-sm font-extrabold leading-snug line-clamp-1 ${
                nextChase.isUrgent ? 'text-amber-800' : 'text-slate-900'
              }`}
            >
              {nextChase.title}
            </p>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
              {nextChase.detail}
            </p>
          </div>

          {/* Col 4: Days in Current Milestone */}
          <div className="lg:pl-4 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Days in Current Milestone
            </span>
            <p className="text-xs md:text-sm font-extrabold text-slate-900 leading-snug line-clamp-1">
              {daysInMilestone.days}
            </p>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
              {daysInMilestone.milestoneName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
