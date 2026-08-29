import React, { useState } from 'react';
import {
  PauseCircle,
  PlayCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Info,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import type { CaseStatusAction, BffCaseItem } from '../../../types/api';

interface ChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: BffCaseItem | null;
  action: CaseStatusAction | null;
  onConfirm: (
    caseId: string,
    action: CaseStatusAction,
    reason?: string,
  ) => Promise<void>;
  isLoading: boolean;
}

export const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({
  isOpen,
  onClose,
  caseItem,
  action,
  onConfirm,
  isLoading,
}) => {
  const [reason, setReason] = useState<string>('');

  if (!caseItem || !action) return null;

  const isReopen = action === 'REOPEN';
  const isReasonTooShort = isReopen && reason.trim().length < 10;

  const getActionDetails = () => {
    switch (action) {
      case 'HOLD':
        return {
          title: 'Put Case On Hold',
          description:
            'Pause case SLA and progress tracking until client or third party requirements are satisfied.',
          icon: <PauseCircle className="w-5 h-5 text-amber-600" />,
          btnText: 'Confirm & Put On Hold',
          btnVariant: 'primary' as const,
          reasonPlaceholder:
            'Reason for putting on hold (e.g. Awaiting client probate grant)...',
        };
      case 'RESUME':
        return {
          title: 'Resume Active Progression',
          description:
            'Re-open and resume automated workflow SLA tracking for this case.',
          icon: <PlayCircle className="w-5 h-5 text-emerald-600" />,
          btnText: 'Confirm & Resume Case',
          btnVariant: 'primary' as const,
          reasonPlaceholder: 'Optional notes on resumption...',
        };
      case 'COMPLETE':
        return {
          title: 'Mark Case as Completed',
          description:
            'Officially close all active progression steps and archive the case execution.',
          icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
          btnText: 'Confirm & Complete Case',
          btnVariant: 'primary' as const,
          reasonPlaceholder: 'Completion sign-off notes...',
        };
      case 'CANCEL':
        return {
          title: 'Cancel Case Workflow',
          description:
            'Terminate this case. Ongoing step executions will be marked as cancelled.',
          icon: <XCircle className="w-5 h-5 text-rose-600" />,
          btnText: 'Confirm & Cancel Case',
          btnVariant: 'danger' as const,
          reasonPlaceholder:
            'State reason for cancellation (e.g. Vendor withdrew sale)...',
        };
      case 'REOPEN':
        return {
          title: 'Reopen Case',
          description:
            'Reopen this closed case and return its workflow progression to Open status.',
          icon: <RotateCcw className="w-5 h-5 text-[#E1007A]" />,
          btnText: 'Confirm Reopen',
          btnVariant: 'primary' as const,
          reasonPlaceholder:
            'Please specify the reason for reopening (e.g. buyer mortgage approved, chain restored)...',
        };
    }
  };

  const details = getActionDetails();

  const handleConfirm = async () => {
    if (isReasonTooShort) return;
    await onConfirm(caseItem.id, action, reason.trim() || undefined);
    setReason('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={details.title}
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Back
          </Button>
          <Button
            variant={details.btnVariant}
            size="sm"
            isLoading={isLoading}
            disabled={isLoading || isReasonTooShort}
            onClick={handleConfirm}
          >
            {details.btnText}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-xs text-slate-600">
        {/* Info Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
          <div className="shrink-0 mt-0.5">{details.icon}</div>
          <div className="space-y-1">
            <p className="font-extrabold text-slate-900 text-sm">
              {caseItem.title}
            </p>
            <p className="text-slate-500 leading-relaxed">
              {details.description}
            </p>
          </div>
        </div>

        {isReopen && (
          <div className="p-3 rounded-xl bg-pink-50 border border-pink-200 text-pink-900 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#E1007A] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Reopen Policy</p>
              <p className="text-[11px] text-pink-700 leading-relaxed">
                Reopening will return this case to 'Open' status. Completed
                steps will remain completed, allowing you to proceed with
                remaining steps.
              </p>
            </div>
          </div>
        )}

        {action === 'COMPLETE' && (
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Completion Eligibility</p>
              <p className="text-[11px] text-purple-700 leading-relaxed">
                All mandatory milestone steps are verified. Any remaining
                optional steps will not block case closure and will be safely
                archived.
              </p>
            </div>
          </div>
        )}

        {/* Reason Textarea */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {isReopen ? (
              <span className="flex items-center gap-1">
                Reason for reopening this case{' '}
                <span className="text-[#E1007A]">*</span>
              </span>
            ) : action === 'CANCEL' || action === 'HOLD' ? (
              'Reason / Explanation (Recommended)'
            ) : (
              'Optional Audit Notes'
            )}
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={details.reasonPlaceholder}
            className={`w-full rounded-xl bg-white border p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 ${
              isReasonTooShort && reason.length > 0
                ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-500/15'
                : 'border-slate-200 focus:border-[#E1007A] focus:ring-[#E1007A]/15'
            }`}
          />
          {isReopen &&
            reason.trim().length > 0 &&
            reason.trim().length < 10 && (
              <p className="text-[11px] text-amber-600 font-medium">
                Please provide at least 10 characters explaining why the case is
                being reopened ({reason.trim().length}/10).
              </p>
            )}
        </div>

        {action === 'CANCEL' && (
          <div className="flex items-center gap-1.5 text-[11px] text-rose-600 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>
              This action will abort active work items and audit this decision.
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
};
