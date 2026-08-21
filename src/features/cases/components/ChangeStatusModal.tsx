import React, { useState } from 'react';
import {
  PauseCircle,
  PlayCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
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
    }
  };

  const details = getActionDetails();

  const handleConfirm = async () => {
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

        {/* Reason Textarea */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {action === 'CANCEL' || action === 'HOLD'
              ? 'Reason / Explanation (Recommended)'
              : 'Optional Audit Notes'}
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={details.reasonPlaceholder}
            className="w-full rounded-xl bg-white border border-slate-200 p-3 text-xs text-slate-800 focus:border-[#E1007A] focus:outline-none focus:ring-2 focus:ring-[#E1007A]/15"
          />
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
