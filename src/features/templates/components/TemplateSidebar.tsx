import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Save,
  Send,
  Code2,
  Sparkles,
  Check,
  FolderPlus,
  GitBranch,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { useTemplateBuilder } from '../context/TemplateBuilderContext';
import { PublishModal } from './PublishModal';
import { ApiError } from '../../../lib/api-client';

export const TemplateSidebar: React.FC = () => {
  const {
    caseTypeId,
    name,
    description,
    category,
    versionNumber,
    isPublished,
    steps,
    edges,
    backendDagError,
    isSaving,
    lastSavedAt,
    availableCaseTypes,
    selectCaseType,
    createNewTemplate,
    setCaseTypeMeta,
    addStep,
    loadPreset,
    saveDraft,
    toBackendDraftPayload,
  } = useTemplateBuilder();

  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Template form state
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplatePreset, setNewTemplatePreset] = useState<
    'sales' | 'appraisal' | 'commercial'
  >('sales');

  const handleSave = async () => {
    setErrorMessage(null);
    try {
      await saveDraft();
      setShowSavedFeedback(true);
      setTimeout(() => setShowSavedFeedback(false), 2500);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.problem.detail || err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to save draft due to DAG or validation error.');
      }
    }
  };

  const handleCreateNewTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    setErrorMessage(null);
    try {
      await createNewTemplate(
        newTemplateName.trim(),
        newTemplateDesc.trim() || undefined,
        newTemplatePreset,
      );
      setIsNewTemplateModalOpen(false);
      setNewTemplateName('');
      setNewTemplateDesc('');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.problem.detail || err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      }
    }
  };

  const currentPayload = toBackendDraftPayload();

  return (
    <aside className="space-y-5">
      {/* Template Selector & Create New Card */}
      <div className="iceberg-card p-4 space-y-2.5 border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-[#E1007A]" />
            Active Workflow Package
          </label>
          <Button
            variant="ghost"
            size="xs"
            leftIcon={<Plus className="w-3 h-3 text-[#E1007A]" />}
            onClick={() => setIsNewTemplateModalOpen(true)}
            className="text-[11px] font-bold text-[#E1007A]"
          >
            + New Template
          </Button>
        </div>

        <select
          value={caseTypeId}
          onChange={(e) => selectCaseType(e.target.value)}
          className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#E1007A] focus:outline-none cursor-pointer"
        >
          {availableCaseTypes.map((ct) => (
            <option key={ct.id} value={ct.id}>
              {ct.name} (v{ct.publishedVersionCount || 1}.0)
            </option>
          ))}
        </select>
      </div>

      {/* Error Alert Box if any */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 flex-1 min-w-0">
            <p className="font-bold">Backend Validation Error</p>
            <p className="text-[11px] leading-relaxed break-words">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Case Type Identity Card */}
      <div className="iceberg-card p-5 space-y-4 border border-slate-200/90 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-pink-50 border border-pink-200 flex items-center justify-center text-[#E1007A]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Workflow Definition
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Category: {category}
              </p>
            </div>
          </div>
          <Badge variant={isPublished ? 'success' : 'required'} size="xs">
            {isPublished
              ? `v${versionNumber}.0 Live`
              : `Draft v${versionNumber}.1`}
          </Badge>
        </div>

        {/* Form Inputs */}
        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Template Title
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setCaseTypeMeta(e.target.value, description)}
              placeholder="e.g. Residential Sales Progression"
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#E1007A] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Description & Purpose
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setCaseTypeMeta(name, e.target.value)}
              placeholder="Explain the workflow lifecycle and target property transactions..."
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:bg-white focus:border-[#E1007A] focus:outline-none"
            />
          </div>
        </div>

        {/* Quick Presets Loader */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Apply Progression Preset
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => loadPreset('sales')}
              className="px-2 py-1.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-pink-50 hover:text-[#E1007A] transition-colors cursor-pointer text-center"
            >
              Sales
            </button>
            <button
              type="button"
              onClick={() => loadPreset('appraisal')}
              className="px-2 py-1.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-pink-50 hover:text-[#E1007A] transition-colors cursor-pointer text-center"
            >
              Appraisal
            </button>
            <button
              type="button"
              onClick={() => loadPreset('commercial')}
              className="px-2 py-1.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-pink-50 hover:text-[#E1007A] transition-colors cursor-pointer text-center"
            >
              Commercial
            </button>
          </div>
        </div>
      </div>

      {/* Toolbox & Actions Card */}
      <div className="iceberg-card p-5 space-y-3 border border-slate-200/90 shadow-2xs">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Template Actions & Validation
        </h4>

        {/* Add Step Button */}
        <Button
          variant="secondary"
          size="md"
          onClick={() => addStep()}
          leftIcon={<Plus className="w-4 h-4 text-[#E1007A]" />}
          className="w-full justify-center font-bold"
        >
          Add New Step
        </Button>

        {/* Save Draft Button */}
        <Button
          variant={backendDagError ? 'danger' : 'primary'}
          size="md"
          isLoading={isSaving}
          onClick={handleSave}
          leftIcon={
            showSavedFeedback ? (
              <Check className="w-4 h-4 text-white" />
            ) : (
              <Save className="w-4 h-4" />
            )
          }
          className="w-full justify-center font-bold"
        >
          {showSavedFeedback ? 'Draft Saved Successfully!' : 'Save Draft'}
        </Button>

        {lastSavedAt && (
          <p className="text-[10px] text-center text-slate-400 font-medium">
            Last saved at {lastSavedAt.toLocaleTimeString()}
          </p>
        )}

        {/* Publish Version Button */}
        <Button
          variant="outline"
          size="md"
          disabled={Boolean(backendDagError)}
          onClick={() => setIsPublishModalOpen(true)}
          leftIcon={<Send className="w-4 h-4" />}
          className="w-full justify-center font-bold"
        >
          Publish Immutable Version
        </Button>

        {/* JSON Preview Button */}
        <button
          type="button"
          onClick={() => setIsJsonModalOpen(true)}
          className="w-full py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Inspect Backend JSON Payload</span>
        </button>
      </div>

      {/* Backend Live DAG Validation Summary Card */}
      <div
        className={`iceberg-card p-4 space-y-2.5 border transition-all ${
          backendDagError
            ? 'border-rose-300 bg-rose-50/40 shadow-xs'
            : 'border-slate-200/90 shadow-2xs'
        }`}
      >
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles
              className={`w-3.5 h-3.5 ${backendDagError ? 'text-rose-600' : 'text-[#E1007A]'}`}
            />
            Backend DAG Invariants
          </span>
          {backendDagError ? (
            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300 animate-pulse">
              ⚠️ Backend: DAG Cycle Detected
            </span>
          ) : (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              ✓ Backend: Acyclic Flow Valid
            </span>
          )}
        </div>

        {backendDagError && (
          <div className="p-3 rounded-xl bg-white border border-rose-200 text-rose-800 text-[11px] space-y-1 shadow-2xs">
            <p className="font-bold flex items-center gap-1 text-rose-800">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              Backend DAG Validation Error:
            </p>
            <p className="text-[11px] text-rose-700 font-medium leading-relaxed">
              {backendDagError}
            </p>
          </div>
        )}

        <div className="text-[11px] text-slate-600 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Total Steps:</span>
            <span className="font-bold text-slate-900">{steps.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Dependency Edges:</span>
            <span
              className={`font-bold ${backendDagError ? 'text-rose-600' : 'text-slate-900'}`}
            >
              {edges.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Work Items:</span>
            <span className="font-bold text-slate-900">
              {steps.reduce((acc, s) => acc + s.workItems.length, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Publish Confirmation Modal */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
      />

      {/* Create New Workflow Template Modal */}
      <Modal
        isOpen={isNewTemplateModalOpen}
        onClose={() => setIsNewTemplateModalOpen(false)}
        title="Create New Workflow Template"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsNewTemplateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateNewTemplate}
              leftIcon={<FolderPlus className="w-3.5 h-3.5" />}
            >
              Create Template Package
            </Button>
          </>
        }
      >
        <form
          onSubmit={handleCreateNewTemplate}
          className="space-y-4 text-xs text-slate-700"
        >
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Workflow Template Name <span className="text-[#E1007A]">*</span>
            </label>
            <Input
              placeholder="e.g. Commercial Lease Progression"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              className="text-xs"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={newTemplateDesc}
              onChange={(e) => setNewTemplateDesc(e.target.value)}
              placeholder="Describe the workflow purpose..."
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:bg-white focus:border-[#E1007A] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Initial Progression Archetype
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'sales', label: 'Residential Sales (6 Steps)' },
                { key: 'appraisal', label: 'Market Appraisal (3 Steps)' },
                { key: 'commercial', label: 'Commercial Lease (3 Steps)' },
              ].map((p) => (
                <button
                  type="button"
                  key={p.key}
                  onClick={() =>
                    setNewTemplatePreset(
                      p.key as 'sales' | 'appraisal' | 'commercial',
                    )
                  }
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    newTemplatePreset === p.key
                      ? 'border-[#E1007A] bg-pink-50/50 text-[#E1007A] font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs">{p.label}</p>
                </button>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* Raw JSON Payload Modal */}
      <Modal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        title="Backend JSON Payload Contract (PUT /api/v1/case-types/:id/draft)"
        maxWidth="lg"
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-500">
            This structured JSON object is dispatched to the backend when
            clicking &ldquo;Save Draft&rdquo; or &ldquo;Publish&rdquo;.
          </p>
          <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-96">
            {JSON.stringify(currentPayload, null, 2)}
          </pre>
        </div>
      </Modal>
    </aside>
  );
};
