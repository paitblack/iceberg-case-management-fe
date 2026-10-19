import React from 'react';
import { Mail, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import type {
  BffParticipant,
  BffWorkspaceWorkItem,
  CommunicationIntent,
  GenerateCommunicationDraftPayload,
  SendCommunicationPayload,
} from '../../../types/api';
import type { InitialCommunicationContext } from './CommunicationsTab';

export interface WorkItemOutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  workItem: BffWorkspaceWorkItem;
  stepName?: string;
  stepId?: string;
  caseTitle?: string;
  caseTypeName?: string;
  caseId?: string;
  participants?: BffParticipant[];
  intent?: CommunicationIntent;
  onOpenInHub?: (context?: InitialCommunicationContext) => void;
  onSendCommunication?: (payload: SendCommunicationPayload) => Promise<void>;
  onGenerateDraft?: (
    payload: GenerateCommunicationDraftPayload,
  ) => Promise<{ subject: string; bodyText: string; bodyHtml: string }>;
  isSending?: boolean;
}

const getParticipantRole = (p: BffParticipant): string =>
  p.roleName || p.roleId;

export const WorkItemOutreachModal: React.FC<WorkItemOutreachModalProps> = ({
  isOpen,
  onClose,
  workItem,
  stepName,
  stepId,
  caseTitle,
  caseId,
  participants = [],
  intent = 'PROGRESS_UPDATE',
  onOpenInHub,
}) => {
  if (!isOpen) return null;

  const handleConfirmOpenHub = () => {
    if (onOpenInHub) {
      onOpenInHub({
        stepId,
        stepName,
        workItemId: workItem.id,
        workItemName: workItem.name || workItem.title,
        evidenceRequired: workItem.evidenceRequired,
        intent,
      });
    }
    onClose();
  };

  const workItemTitle = workItem.name || workItem.title || 'Task';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/70">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center text-[#E1007A] shrink-0 mt-0.5">
              <Mail className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">
                  Notify Stakeholders?
                </h3>
                <Badge variant="info" size="xs">
                  Optional
                </Badge>
                {workItem.status === 'Completed' && (
                  <Badge variant="success" size="xs">
                    Completed
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Task outreach and communication dispatch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Box */}
        <div className="p-5 space-y-4">
          {/* Highlight Task Summary Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
                Milestone: {stepName || 'Current Stage'}
              </span>
              {caseId && (
                <span className="font-mono text-[10px] text-slate-400">
                  Ref: {caseId.slice(0, 8).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-slate-900 text-sm">
                {workItemTitle}
              </span>
            </div>

            {caseTitle && (
              <p className="text-xs text-slate-600 truncate">
                Property: <span className="font-medium text-slate-800">{caseTitle}</span>
              </p>
            )}
          </div>

          {/* Question / Prompt */}
          <p className="text-xs leading-relaxed text-slate-600">
            <strong>"{workItemTitle}"</strong> has been completed. Would you like to open the{' '}
            <strong className="text-slate-900">Communications Hub</strong> to draft and dispatch an email update to case stakeholders?
          </p>

          {/* Stakeholders hint preview */}
          {participants.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Available Stakeholders ({participants.length}):
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {participants.slice(0, 4).map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-700 border border-slate-200/80"
                  >
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-[9px] text-slate-500 font-medium">
                      ({getParticipantRole(p)})
                    </span>
                  </span>
                ))}
                {participants.length > 4 && (
                  <span className="text-[10px] font-semibold text-slate-400">
                    +{participants.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Skip / Do Not Notify
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleConfirmOpenHub}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="font-bold text-xs shadow-xs"
          >
            Open Communications Hub
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WorkItemOutreachModal;
