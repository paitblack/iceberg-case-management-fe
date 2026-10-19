import React, { useState } from 'react';
import {
  Plus,
  CheckSquare,
  ChevronDown,
  FileCheck,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import type { AddAdHocWorkItemPayload } from '../../../types/api';

interface AddAdHocWorkItemModalProps {
  isOpen: boolean;
  stepName: string;
  roles?: Array<{ id: string; name: string; description?: string }>;
  onClose: () => void;
  onSubmit: (payload: AddAdHocWorkItemPayload) => Promise<void>;
  isSubmitting: boolean;
}

export const AddAdHocWorkItemModal: React.FC<AddAdHocWorkItemModalProps> = ({
  isOpen,
  stepName,
  roles = [],
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [name, setName] = useState('');
  const [requirement, setRequirement] = useState<
    'required' | 'optional' | 'conditional'
  >('optional');
  const [targetDate, setTargetDate] = useState('');
  const [ownerRoleId, setOwnerRoleId] = useState('');
  const [evidenceRequired, setEvidenceRequired] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleReset = () => {
    setName('');
    setRequirement('optional');
    setTargetDate('');
    setOwnerRoleId('');
    setEvidenceRequired(false);
    setValidationError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Task name is required.');
      return;
    }

    const payload: AddAdHocWorkItemPayload = {
      name: trimmedName,
      requirement,
      evidenceRequired,
      ownerRoleId: ownerRoleId || undefined,
      targetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
    };

    try {
      await onSubmit(payload);
      handleClose();
    } catch {
      // Error is caught and shown by caller toast
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/15 via-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 shadow-xs shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                Add Custom Task
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70 rounded-full tracking-wide">
                Work Item
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Adding a custom task to milestone step: "{stepName}"
            </p>
          </div>
        </div>
      }
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-slate-600 hover:text-slate-900 font-semibold px-4"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            isLoading={isSubmitting}
            onClick={handleSubmit}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-gradient-to-r from-[#E1007A] to-[#CE0070] hover:from-[#CE0070] hover:to-[#B50060] shadow-sm shadow-[#E1007A]/30 text-white font-bold px-5 py-2 rounded-xl transition-all active:scale-[0.98]"
          >
            Add Task
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {validationError && (
          <div className="p-3.5 bg-rose-50/90 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2 animate-in fade-in duration-150">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Task Name Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="adhoc-task-name"
            className="flex items-center justify-between text-xs font-bold text-slate-700"
          >
            <span>
              Task Name <span className="text-rose-500">*</span>
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              e.g. Inspect boundary wall, Sign deed
            </span>
          </label>
          <input
            id="adhoc-task-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Verify Japanese knotweed indemnity insurance"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl shadow-2xs font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Requirement Level - Segmented Choice Cards */}
        <div className="space-y-1.5 pt-0.5">
          <label
            htmlFor="adhoc-task-requirement"
            className="block text-xs font-bold text-slate-700"
          >
            Requirement Level
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {/* Optional Option */}
            <button
              type="button"
              onClick={() => setRequirement('optional')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                requirement === 'optional'
                  ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Default
                </span>
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    requirement === 'optional'
                      ? 'border-indigo-600 bg-indigo-600'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {requirement === 'optional' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <span className="block font-bold text-xs text-slate-900">
                Optional
              </span>
              <span className="block text-[10px] text-slate-400 leading-tight mt-0.5 font-normal">
                Recommended task
              </span>
            </button>

            {/* Required Option */}
            <button
              type="button"
              onClick={() => setRequirement('required')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                requirement === 'required'
                  ? 'border-rose-600 bg-rose-50/40 ring-2 ring-rose-600/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                  Blocking
                </span>
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    requirement === 'required'
                      ? 'border-rose-600 bg-rose-600'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {requirement === 'required' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <span className="block font-bold text-xs text-slate-900">
                Required
              </span>
              <span className="block text-[10px] text-slate-400 leading-tight mt-0.5 font-normal">
                Must be completed
              </span>
            </button>

            {/* Conditional Option */}
            <button
              type="button"
              onClick={() => setRequirement('conditional')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                requirement === 'conditional'
                  ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-600/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500">
                  Rule-based
                </span>
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    requirement === 'conditional'
                      ? 'border-purple-600 bg-purple-600'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {requirement === 'conditional' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <span className="block font-bold text-xs text-slate-900">
                Conditional
              </span>
              <span className="block text-[10px] text-slate-400 leading-tight mt-0.5 font-normal">
                Triggered on rule
              </span>
            </button>
          </div>

          {/* Accessible hidden select to ensure label mapping and programmatic change compatibility */}
          <select
            id="adhoc-task-requirement"
            value={requirement}
            onChange={(e) =>
              setRequirement(
                e.target.value as 'required' | 'optional' | 'conditional',
              )
            }
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          >
            <option value="optional">Optional (Recommended)</option>
            <option value="required">Required</option>
            <option value="conditional">Conditional</option>
          </select>
        </div>

        {/* Stakeholder Role & Target Date 2-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Stakeholder Role */}
          <div className="p-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl space-y-1.5">
            <label
              htmlFor="adhoc-task-role"
              className="block text-xs font-bold text-slate-700"
            >
              Responsible Stakeholder Role{' '}
              <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <select
                id="adhoc-task-role"
                value={ownerRoleId}
                onChange={(e) => setOwnerRoleId(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer hover:border-slate-300"
              >
                <option value="">-- No specific role assigned --</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Target Date */}
          <div className="p-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl space-y-1.5">
            <label
              htmlFor="adhoc-task-target-date"
              className="block text-xs font-bold text-slate-700"
            >
              Target Date <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <input
                id="adhoc-task-target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Evidence Required Toggle Card */}
        <div
          onClick={() => setEvidenceRequired(!evidenceRequired)}
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
            evidenceRequired
              ? 'bg-gradient-to-r from-pink-50/40 via-white to-pink-50/10 border-[#E1007A]/40 ring-1 ring-[#E1007A]/20 shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                evidenceRequired
                  ? 'bg-pink-50 text-[#E1007A] border border-pink-200/60 shadow-xs'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <label
                htmlFor="adhoc-task-evidence"
                className="block text-xs font-bold text-slate-900 cursor-pointer"
              >
                Evidence Document Required
              </label>
              <span className="block text-[11px] text-slate-500 leading-tight mt-0.5 font-normal">
                File upload or document verification is mandatory before completing
              </span>
            </div>
          </div>

          <input
            id="adhoc-task-evidence"
            type="checkbox"
            checked={evidenceRequired}
            onChange={(e) => setEvidenceRequired(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 text-[#E1007A] rounded border-slate-300 focus:ring-[#E1007A] cursor-pointer ml-3 shrink-0"
          />
        </div>
      </form>
    </Modal>
  );
};
