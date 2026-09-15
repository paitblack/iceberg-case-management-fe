import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, GitCommit, Split } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import type { AddAdHocStepPayload } from '../../../types/api';

interface InitialTaskItem {
  id: string;
  name: string;
  requirement: 'required' | 'optional' | 'conditional';
  evidenceRequired: boolean;
  targetDate?: string;
}

interface AddAdHocStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: AddAdHocStepPayload) => Promise<void>;
  isSubmitting: boolean;
  existingSteps?: Array<{
    id: string;
    name: string;
    displayOrder: number;
    isStandalone?: boolean;
  }>;
  defaultInsertAfterStepId?: string;
}

export const AddAdHocStepModal: React.FC<AddAdHocStepModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  existingSteps = [],
  defaultInsertAfterStepId,
}) => {
  const inSequenceSteps = useMemo(() => {
    return existingSteps
      .filter((s) => !s.isStandalone)
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [existingSteps]);

  const [stepName, setStepName] = useState('');
  const [placement, setPlacement] = useState<'in_sequence' | 'standalone'>('in_sequence');
  const [insertAfterStepId, setInsertAfterStepId] = useState<string>('');
  const [isOptional, setIsOptional] = useState(true);
  const [targetDate, setTargetDate] = useState('');
  const [tasks, setTasks] = useState<InitialTaskItem[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultInsertAfterStepId) {
      setInsertAfterStepId(defaultInsertAfterStepId);
    } else if (inSequenceSteps.length > 0) {
      setInsertAfterStepId(inSequenceSteps[inSequenceSteps.length - 1].id);
    } else {
      setInsertAfterStepId('');
    }
  }, [defaultInsertAfterStepId, inSequenceSteps]);

  const handleReset = () => {
    setStepName('');
    setIsOptional(true);
    setTargetDate('');
    setTasks([]);
    setValidationError(null);
    setPlacement('in_sequence');
    if (defaultInsertAfterStepId) {
      setInsertAfterStepId(defaultInsertAfterStepId);
    } else if (inSequenceSteps.length > 0) {
      setInsertAfterStepId(inSequenceSteps[inSequenceSteps.length - 1].id);
    } else {
      setInsertAfterStepId('');
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleAddTask = () => {
    const newTask: InitialTaskItem = {
      id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: '',
      requirement: 'optional',
      evidenceRequired: false,
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const handleRemoveTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateTask = (
    id: string,
    field: keyof InitialTaskItem,
    value: unknown,
  ) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedName = stepName.trim();
    if (!trimmedName) {
      setValidationError('Step name is required.');
      return;
    }

    // Validate any added tasks have names
    for (let i = 0; i < tasks.length; i++) {
      if (!tasks[i].name.trim()) {
        setValidationError(`Task #${i + 1} must have a name, or delete it.`);
        return;
      }
    }

    const payload: AddAdHocStepPayload = {
      name: trimmedName,
      isOptional,
      placement,
      insertAfterStepId:
        placement === 'in_sequence' && insertAfterStepId
          ? insertAfterStepId
          : undefined,
      targetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
      workItems:
        tasks.length > 0
          ? tasks.map((t) => ({
              name: t.name.trim(),
              requirement: t.requirement,
              evidenceRequired: t.evidenceRequired,
              targetDate: t.targetDate
                ? new Date(t.targetDate).toISOString()
                : undefined,
            }))
          : undefined,
    };

    try {
      await onSubmit(payload);
      handleClose();
    } catch {
      // Error handling is handled in the caller with toasts
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <span className="font-bold text-slate-900 text-base">
          Add Custom Step
        </span>
      }
      subtitle="Add a new milestone step to this case progression."
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
            Create Step
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

        {/* Step Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="adhoc-step-name"
            className="block text-xs font-bold text-slate-700"
          >
            Step Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="adhoc-step-name"
            type="text"
            required
            value={stepName}
            onChange={(e) => setStepName(e.target.value)}
            placeholder="e.g. Additional Environmental Survey Review"
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#E1007A]/40 focus:border-[#E1007A] transition-all"
          />
        </div>

        {/* Workflow Placement Strategy */}
        <div className="space-y-2 pt-0.5">
          <label className="block text-xs font-bold text-slate-700">
            Workflow Placement
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Option 1: In-Sequence */}
            <button
              type="button"
              onClick={() => setPlacement('in_sequence')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                placement === 'in_sequence'
                  ? 'border-[#E1007A] bg-pink-50/40 ring-1 ring-[#E1007A]'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                <GitCommit className="w-3.5 h-3.5 text-[#E1007A]" />
                <span>In Workflow</span>
              </div>
              <span className="text-[11px] text-slate-500 leading-tight">
                Sequential milestone in progression
              </span>
            </button>

            {/* Option 2: Standalone */}
            <button
              type="button"
              onClick={() => setPlacement('standalone')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                placement === 'standalone'
                  ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                <Split className="w-3.5 h-3.5 text-indigo-600" />
                <span>Parallel Track</span>
              </div>
              <span className="text-[11px] text-slate-500 leading-tight">
                Runs independently alongside
              </span>
            </button>
          </div>

          {/* If In-Sequence, show Insert After Dropdown */}
          {placement === 'in_sequence' && inSequenceSteps.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <label
                htmlFor="adhoc-step-insert-after"
                className="text-xs font-semibold text-slate-700 shrink-0"
              >
                Place after:
              </label>
              <select
                id="adhoc-step-insert-after"
                value={insertAfterStepId}
                onChange={(e) => setInsertAfterStepId(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#E1007A]/40 text-slate-800 font-medium"
              >
                <option value="">At the beginning (Step 1)</option>
                {inSequenceSteps.map((s) => (
                  <option key={s.id} value={s.id}>
                    Step {s.displayOrder}: {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Optional & Target Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Is Optional Checkbox */}
          <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <input
              id="adhoc-step-optional"
              type="checkbox"
              checked={isOptional}
              onChange={(e) => setIsOptional(e.target.checked)}
              className="w-4 h-4 text-[#E1007A] rounded border-slate-300 focus:ring-[#E1007A]"
            />
            <label
              htmlFor="adhoc-step-optional"
              className="cursor-pointer select-none text-xs font-semibold text-slate-800"
            >
              Optional Step{' '}
              <span className="text-[11px] text-slate-400 font-normal">
                (non-blocking)
              </span>
            </label>
          </div>

          {/* Target Date */}
          <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200/80 rounded-xl">
            <label
              htmlFor="adhoc-step-target-date"
              className="text-xs font-semibold text-slate-700 shrink-0 pl-1"
            >
              Target Date:
            </label>
            <input
              id="adhoc-step-target-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#E1007A]/40 transition-all text-slate-700"
            />
          </div>
        </div>

        {/* Initial Tasks Section */}
        <div className="pt-2.5 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Tasks <span className="text-slate-400 font-normal">({tasks.length})</span>
            </span>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={handleAddTask}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Task
            </Button>
          </div>

          {tasks.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {tasks.map((task, idx) => (
                <div
                  key={task.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400 text-[11px] w-5">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      required
                      value={task.name}
                      onChange={(e) =>
                        handleUpdateTask(task.id, 'name', e.target.value)
                      }
                      placeholder="Task description / title..."
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E1007A]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(task.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pl-7">
                    {/* Requirement Select */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Type:
                      </span>
                      <select
                        value={task.requirement}
                        onChange={(e) =>
                          handleUpdateTask(
                            task.id,
                            'requirement',
                            e.target.value as
                              'required' | 'optional' | 'conditional',
                          )
                        }
                        className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#E1007A]"
                      >
                        <option value="optional">Optional</option>
                        <option value="required">Required</option>
                        <option value="conditional">Conditional</option>
                      </select>
                    </div>

                    {/* Evidence Required */}
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={task.evidenceRequired}
                        onChange={(e) =>
                          handleUpdateTask(
                            task.id,
                            'evidenceRequired',
                            e.target.checked,
                          )
                        }
                        className="w-3.5 h-3.5 text-[#E1007A] rounded border-slate-300 focus:ring-[#E1007A]"
                      />
                      <span className="text-[11px] text-slate-600 font-medium">
                        Evidence Doc Required
                      </span>
                    </label>

                    {/* Target Date */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Due:
                      </span>
                      <input
                        type="date"
                        value={task.targetDate || ''}
                        onChange={(e) =>
                          handleUpdateTask(
                            task.id,
                            'targetDate',
                            e.target.value,
                          )
                        }
                        className="px-2 py-0.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#E1007A]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};
