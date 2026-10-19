import React, { useState, useEffect } from 'react';
import {
  Slash,
  AlertTriangle,
  X,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export interface WaiveWorkItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  workItemName: string;
  stepName?: string;
  targetRoleDisplayName?: string;
  isSubmitting?: boolean;
}

const QUICK_REASONS = [
  'Indemnity insurance policy obtained',
  'Handled directly outside system',
  'Not applicable for this transaction type',
  'Client instructed to bypass checkpoint',
];

export const WaiveWorkItemModal: React.FC<WaiveWorkItemModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  workItemName,
  stepName,
  targetRoleDisplayName,
  isSubmitting = false,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Please provide a reason for waiving this task.');
      return;
    }
    if (trimmed.length < 5) {
      setError('Waive reason must be at least 5 characters long.');
      return;
    }
    setError(null);
    await onConfirm(trimmed);
  };

  const handleSelectQuickReason = (selected: string) => {
    setReason(selected);
    setError(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="waive-task-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b border-amber-100 bg-[#FFFDF7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shrink-0">
              <Slash className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="waive-task-title"
                  className="text-base font-extrabold text-slate-900 tracking-tight"
                >
                  Waive Checkpoint Task
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                  <ShieldAlert className="w-3 h-3 text-amber-600" /> Audit Impact
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Bypass this milestone requirement and record the business justification.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Target Task Summary Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Target Task
              </span>
              {targetRoleDisplayName && (
                <span className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                  {targetRoleDisplayName}
                </span>
              )}
            </div>

            <div className="font-bold text-slate-900 text-sm">
              {workItemName}
            </div>

            {stepName && (
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <span className="font-medium text-slate-400">Milestone:</span>
                <span className="font-semibold text-slate-700">{stepName}</span>
              </div>
            )}
          </div>

          {/* Warning Banner */}
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-bold">Are you sure you want to waive this task?</span>
              <p className="text-[11px] text-amber-800">
                Waiving permanently bypasses this checkpoint. The reason you provide will be logged in the case audit trail, activity timeline, and step notes.
              </p>
            </div>
          </div>

          {/* Quick Reasons Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
              <Sparkles className="w-3 h-3 text-[#E1007A]" />
              <span>Quick Reasons:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REASONS.map((qr) => (
                <button
                  key={qr}
                  type="button"
                  onClick={() => handleSelectQuickReason(qr)}
                  className={`text-[10px] px-2 py-1 rounded-md border font-medium transition-colors cursor-pointer ${
                    reason === qr
                      ? 'bg-amber-100 border-amber-300 text-amber-950 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {qr}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Textarea */}
          <div className="space-y-1.5">
            <label
              htmlFor="waive-reason"
              className="block text-xs font-bold text-slate-800"
            >
              Business Justification / Note <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="waive-reason"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Explain why this task is being waived..."
              className={`w-full text-xs p-3 rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all resize-none ${
                error
                  ? 'border-rose-300 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-amber-200 focus:border-amber-400'
              }`}
            />
            {error && (
              <p className="text-[11px] font-medium text-rose-600">{error}</p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={!reason.trim() || isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              leftIcon={<Slash className="w-3.5 h-3.5" />}
            >
              Confirm Waive Task
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
