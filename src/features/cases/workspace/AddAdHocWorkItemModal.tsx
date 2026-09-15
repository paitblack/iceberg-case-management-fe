import React, { useState } from 'react';
import { Plus } from 'lucide-react';
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
        <span className="font-bold text-slate-900 text-base">
          Add Custom Task
        </span>
      }
      subtitle={`Adding a custom task to milestone step: "${stepName}"`}
      maxWidth="md"
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            isLoading={isSubmitting}
            onClick={handleSubmit}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Task
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {validationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {validationError}
          </div>
        )}

        {/* Task Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="adhoc-task-name"
            className="block text-xs font-bold text-slate-700"
          >
            Task Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="adhoc-task-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Verify Japanese knotweed indemnity insurance"
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#E1007A]/40 focus:border-[#E1007A] transition-all"
          />
        </div>

        {/* Requirement & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Requirement */}
          <div className="space-y-1.5">
            <label
              htmlFor="adhoc-task-requirement"
              className="block text-xs font-bold text-slate-700"
            >
              Requirement Level
            </label>
            <select
              id="adhoc-task-requirement"
              value={requirement}
              onChange={(e) =>
                setRequirement(
                  e.target.value as 'required' | 'optional' | 'conditional',
                )
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#E1007A]/40 focus:border-[#E1007A] transition-all"
            >
              <option value="optional">Optional (Recommended)</option>
              <option value="required">Required</option>
              <option value="conditional">Conditional</option>
            </select>
          </div>

          {/* Target Date */}
          <div className="space-y-1.5">
            <label
              htmlFor="adhoc-task-target-date"
              className="block text-xs font-bold text-slate-700"
            >
              Target Date{' '}
              <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="adhoc-task-target-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#E1007A]/40 focus:border-[#E1007A] transition-all text-slate-700"
            />
          </div>
        </div>

        {/* Stakeholder Role Assignment */}
        <div className="space-y-1.5">
          <label
            htmlFor="adhoc-task-role"
            className="block text-xs font-bold text-slate-700"
          >
            Responsible Stakeholder Role{' '}
            <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <select
            id="adhoc-task-role"
            value={ownerRoleId}
            onChange={(e) => setOwnerRoleId(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#E1007A]/40 focus:border-[#E1007A] transition-all"
          >
            <option value="">-- No specific role assigned --</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Evidence Required Checkbox */}
        <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
          <input
            id="adhoc-task-evidence"
            type="checkbox"
            checked={evidenceRequired}
            onChange={(e) => setEvidenceRequired(e.target.checked)}
            className="w-4 h-4 text-[#E1007A] rounded border-slate-300 focus:ring-[#E1007A]"
          />
          <label
            htmlFor="adhoc-task-evidence"
            className="cursor-pointer select-none text-xs font-semibold text-slate-800"
          >
            Evidence Document Required{' '}
            <span className="text-[11px] text-slate-400 font-normal">
              (file upload required to complete)
            </span>
          </label>
        </div>
      </form>
    </Modal>
  );
};
