import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Trash2,
  GitCommit,
  Split,
  ChevronDown,
  ArrowDownCircle,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import type { AddAdHocStepPayload } from '../../../types/api';

function formatStepSelectLabel(step: { displayOrder: number; name: string }): string {
  const cleanedName = step.name.replace(/^step\s*\d+\s*[:\-–]?\s*/i, '').trim();
  return `Step ${step.displayOrder}: ${cleanedName || step.name}`;
}

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
  const [isOptional, setIsOptional] = useState(false);
  const [targetDate, setTargetDate] = useState('');
  const [tasks, setTasks] = useState<InitialTaskItem[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (defaultInsertAfterStepId) {
        setInsertAfterStepId(defaultInsertAfterStepId);
      } else if (inSequenceSteps.length > 0) {
        setInsertAfterStepId(inSequenceSteps[inSequenceSteps.length - 1].id);
      } else {
        setInsertAfterStepId('');
      }
    }
  }, [isOpen, defaultInsertAfterStepId, inSequenceSteps]);

  const handleReset = () => {
    setStepName('');
    setIsOptional(false);
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
      // Handled by caller toast
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500/15 to-purple-500/10 border border-[#E1007A]/20 flex items-center justify-center text-[#E1007A] shadow-xs shrink-0">
            <GitCommit className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                Add Custom Step
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-pink-50 text-[#E1007A] border border-pink-200/70 rounded-full tracking-wide">
                Milestone
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Add a new milestone step to this case progression.
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
            Create Step
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

        {/* Step Name Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="adhoc-step-name"
            className="flex items-center justify-between text-xs font-bold text-slate-700"
          >
            <span>
              Step Name <span className="text-rose-500">*</span>
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              e.g. Survey, Search, Title Report
            </span>
          </label>
          <input
            id="adhoc-step-name"
            type="text"
            required
            value={stepName}
            onChange={(e) => setStepName(e.target.value)}
            placeholder="e.g. Additional Environmental Survey Review"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#E1007A] rounded-xl shadow-2xs font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#E1007A]/10 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Workflow Placement Strategy */}
        <div className="space-y-2 pt-0.5">
          <label className="block text-xs font-bold text-slate-700">
            Workflow Placement
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Option 1: In-Sequence */}
            <button
              type="button"
              onClick={() => setPlacement('in_sequence')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                placement === 'in_sequence'
                  ? 'border-[#E1007A] bg-gradient-to-br from-pink-50/50 via-white to-pink-50/20 ring-2 ring-[#E1007A]/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50/70 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between w-full mb-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    placement === 'in_sequence'
                      ? 'bg-[#E1007A] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <GitCommit className="w-4 h-4" />
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    placement === 'in_sequence'
                      ? 'border-[#E1007A] bg-[#E1007A]'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {placement === 'in_sequence' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <div>
                <span className="block font-bold text-xs text-slate-900 leading-tight">
                  In Workflow
                </span>
                <span className="block text-[11px] text-slate-500 mt-1 leading-snug font-normal">
                  Sequential progression tied to preceding steps
                </span>
              </div>
            </button>

            {/* Option 2: Standalone */}
            <button
              type="button"
              onClick={() => setPlacement('standalone')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                placement === 'standalone'
                  ? 'border-indigo-600 bg-gradient-to-br from-indigo-50/50 via-white to-indigo-50/20 ring-2 ring-indigo-600/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50/70 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between w-full mb-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    placement === 'standalone'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Split className="w-4 h-4" />
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    placement === 'standalone'
                      ? 'border-indigo-600 bg-indigo-600'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {placement === 'standalone' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <div>
                <span className="block font-bold text-xs text-slate-900 leading-tight">
                  Parallel Track
                </span>
                <span className="block text-[11px] text-slate-500 mt-1 leading-snug font-normal">
                  Runs independently without blocking the sequence
                </span>
              </div>
            </button>
          </div>

          {/* If In-Sequence, show Insert After Dropdown */}
          {placement === 'in_sequence' && inSequenceSteps.length > 0 && (
            <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-2 mt-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <ArrowDownCircle className="w-4 h-4 text-[#E1007A]" />
                  <span>Place Step After</span>
                </div>
                <span className="text-[11px] text-slate-400 font-normal">
                  Connects into progression DAG
                </span>
              </div>
              <div className="relative">
                <select
                  id="adhoc-step-insert-after"
                  value={insertAfterStepId}
                  onChange={(e) => setInsertAfterStepId(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-10 py-2.5 text-xs bg-white border border-slate-200 rounded-xl shadow-2xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#E1007A]/20 focus:border-[#E1007A] transition-all cursor-pointer hover:border-slate-300"
                >
                  <option value="">At the beginning (Step 1)</option>
                  {inSequenceSteps.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatStepSelectLabel(s)}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Optional Milestone & Target SLA Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Is Optional Toggle Card */}
          <div
            onClick={() => setIsOptional(!isOptional)}
            className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
              isOptional
                ? 'bg-slate-50/90 border-slate-200 hover:border-slate-300'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              id="adhoc-step-optional"
              type="checkbox"
              checked={isOptional}
              onChange={(e) => setIsOptional(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 text-[#E1007A] rounded border-slate-300 focus:ring-[#E1007A] cursor-pointer"
            />
            <div className="min-w-0">
              <label
                htmlFor="adhoc-step-optional"
                className="block text-xs font-bold text-slate-800 cursor-pointer"
              >
                Optional Step
              </label>
              <span className="block text-[11px] text-slate-400 leading-tight mt-0.5">
                Non-blocking milestone
              </span>
            </div>
          </div>

          {/* Target SLA Date Input */}
          <div className="p-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl flex flex-col justify-between">
            <label
              htmlFor="adhoc-step-target-date"
              className="block text-xs font-bold text-slate-700"
            >
              Target Date <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative mt-1.5">
              <input
                id="adhoc-step-target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#E1007A]/20 focus:border-[#E1007A] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Initial Tasks Section */}
        <div className="pt-3 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                Tasks & Checklist Items
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full border border-slate-200/60">
                {tasks.length}
              </span>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={handleAddTask}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="font-bold text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-100 shadow-2xs"
            >
              Add Task
            </Button>
          </div>

          {tasks.length === 0 ? (
            <div className="p-4 border border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
              <p className="text-xs text-slate-400 font-medium">
                No initial tasks added yet. You can also add tasks later once the milestone is created.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {tasks.map((task, idx) => (
                <div
                  key={task.id}
                  className="p-3 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-2.5 text-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400 text-[11px] w-5 text-center">
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
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E1007A]/20 focus:border-[#E1007A] font-medium transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(task.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pl-7 pt-1 border-t border-slate-100 text-[11px]">
                    {/* Requirement Select */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-medium">Type:</span>
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
                        className="px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#E1007A] cursor-pointer"
                      >
                        <option value="optional">Optional</option>
                        <option value="required">Required</option>
                        <option value="conditional">Conditional</option>
                      </select>
                    </div>

                    {/* Evidence Required */}
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
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
                      <span className="text-slate-600 font-medium">
                        Evidence Doc Required
                      </span>
                    </label>

                    {/* Target Date */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-medium">Due:</span>
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
                        className="px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#E1007A]"
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
