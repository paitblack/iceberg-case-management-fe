import React, { useState } from 'react';
import { Lock, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useTemplateBuilder } from '../context/TemplateBuilderContext';
import { ApiError } from '../../../lib/api-client';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { name, versionNumber, steps, edges, publishDraft, isPublishing } =
    useTemplateBuilder();

  const [publishError, setPublishError] = useState<string | null>(null);

  const handleConfirmPublish = async () => {
    setPublishError(null);
    try {
      await publishDraft();
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setPublishError(err.problem.detail || err.message);
      } else if (err instanceof Error) {
        setPublishError(err.message);
      } else {
        setPublishError('Failed to publish template version.');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Publish Immutable Template Version"
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isPublishing}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isPublishing}
            onClick={handleConfirmPublish}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Confirm & Publish v{versionNumber + 1}.0
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-xs text-slate-600">
        {publishError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 flex-1 min-w-0">
              <p className="font-bold">Backend DAG / Validation Error</p>
              <p className="text-[11px] leading-relaxed break-words">
                {publishError}
              </p>
            </div>
          </div>
        )}

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-slate-900">
              Immutable Version Snapshot Guarantee
            </p>
            <p className="text-slate-600 leading-relaxed">
              Once published, this template draft will be frozen into an
              immutable{' '}
              <span className="font-bold text-slate-800">
                TemplateVersion v{versionNumber + 1}.0
              </span>
              . Any ongoing live cases will remain safely bound to their
              original version snapshots.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between font-semibold text-slate-800">
            <span>Template Name</span>
            <span>{name}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Total Progression Steps</span>
            <span className="font-bold text-slate-900">
              {steps.length} steps
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>DAG Dependency Edges</span>
            <span className="font-bold text-slate-900">
              {edges.length} edges
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Target Version</span>
            <span className="font-mono font-bold text-[#E1007A]">
              v{versionNumber + 1}.0
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 italic">
          <Lock className="w-3 h-3 inline mr-1 text-slate-400" />
          All DAG invariants and acyclicity checks are strictly verified by
          Kahn&apos;s algorithm on the backend.
        </p>
      </div>
    </Modal>
  );
};
