import React, { useState } from 'react';
import {
  Plus,
  Save,
  Check,
  FolderPlus,
  GitBranch,
  AlertCircle,
  Users,
  X,
  UserCheck,
  Pencil,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  CheckSquare,
  ShieldCheck,
  Rocket,
  FileText,
  Activity,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import {
  useTemplateBuilder,
  type TemplateRole,
} from '../context/TemplateBuilderContext';
import { PublishModal } from './PublishModal';
import { ApiError } from '../../../lib/api-client';

type SidebarTab = 'workflow' | 'roles' | 'diagnostics';

export const TemplateSidebar: React.FC = () => {
  const {
    caseTypeId,
    name,
    description,
    category,
    versionNumber,
    isPublished,
    steps,
    roles,
    edges,
    backendDagError,
    isSaving,
    lastSavedAt,
    availableCaseTypes,
    availablePresets,
    selectCaseType,
    createNewTemplate,
    setCaseTypeMeta,
    addStep,
    addRole,
    updateRole,
    removeRole,
    loadPreset,
    saveDraft,
  } = useTemplateBuilder();

  const [activeTab, setActiveTab] = useState<SidebarTab>('workflow');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Template form state
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplatePresetKey, setNewTemplatePresetKey] =
    useState<string>('sales');

  // Add / Edit Role form state
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [isMultipleAssignees, setIsMultipleAssignees] = useState(false);
  const [roleMaxOccurrences, setRoleMaxOccurrences] = useState(5);
  const [isRequiredRole, setIsRequiredRole] = useState(false);

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
        newTemplatePresetKey === 'blank' ? undefined : newTemplatePresetKey,
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

  const handleOpenAddRoleModal = () => {
    setEditingRoleId(null);
    setNewRoleName('');
    setNewRoleDesc('');
    setIsMultipleAssignees(false);
    setRoleMaxOccurrences(5);
    setIsRequiredRole(false);
    setIsAddRoleModalOpen(true);
  };

  const handleOpenEditRoleModal = (role: TemplateRole) => {
    setEditingRoleId(role.id);
    setNewRoleName(role.name);
    setNewRoleDesc(role.description || '');
    const isMultiple = (role.maxOccurrences ?? 1) > 1;
    setIsMultipleAssignees(isMultiple);
    setRoleMaxOccurrences(
      isMultiple ? (role.maxOccurrences ?? 5) : 5,
    );
    setIsRequiredRole(role.isRequired ?? false);
    setIsAddRoleModalOpen(true);
  };

  const handleRoleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const occurrences = isMultipleAssignees
      ? Math.max(2, roleMaxOccurrences || 5)
      : 1;

    if (editingRoleId) {
      updateRole(editingRoleId, {
        name: newRoleName.trim(),
        description: newRoleDesc.trim() || undefined,
        maxOccurrences: occurrences,
        isRequired: isRequiredRole,
        minOccurrences: isRequiredRole ? 1 : 0,
      });
    } else {
      addRole({
        name: newRoleName.trim(),
        description: newRoleDesc.trim() || undefined,
        maxOccurrences: occurrences,
        isRequired: isRequiredRole,
        minOccurrences: isRequiredRole ? 1 : 0,
      });
    }

    setEditingRoleId(null);
    setNewRoleName('');
    setNewRoleDesc('');
    setIsMultipleAssignees(false);
    setRoleMaxOccurrences(5);
    setIsAddRoleModalOpen(false);
  };

  const totalWorkItems = steps.reduce((acc, s) => acc + s.workItems.length, 0);

  const presetList =
    availablePresets.length > 0
      ? availablePresets
      : [
          { key: 'sales', name: 'Sales' },
          { key: 'commercial', name: 'Commercial' },
          { key: 'appraisal', name: 'Appraisal' },
        ];

  return (
    <aside className="h-full flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden relative">
      {/* Radiant Studio Accent Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#E1007A]/70 to-transparent shrink-0" />

      {/* Top Header: Active Workflow Package & Release Status */}
      <div className="p-4 pb-3 space-y-3 border-b border-slate-100 bg-gradient-to-b from-slate-50/70 to-white shrink-0">
        {/* Eyebrow & "+ New Template" Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900 text-white shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E1007A]" />
            <span className="text-[9px] font-bold tracking-wider uppercase">
              Workflow Studio
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsNewTemplateModalOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#E1007A] bg-pink-50/80 hover:bg-pink-100/80 border border-pink-200/80 hover:border-pink-300 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
          >
            <Plus className="w-3 h-3" />
            <span>New Template</span>
          </button>
        </div>

        {/* Active Package Selector with Custom Styled Select Wrapper */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#E1007A]">
            <GitBranch className="w-3.5 h-3.5" />
          </div>
          <select
            value={caseTypeId}
            onChange={(e) => void selectCaseType(e.target.value)}
            className="w-full appearance-none rounded-xl bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-[#E1007A] pl-8 pr-8 py-2 text-xs font-bold text-slate-800 transition-all focus:ring-2 focus:ring-pink-500/10 focus:outline-none cursor-pointer shadow-2xs"
          >
            {availableCaseTypes.map((ct) => (
              <option key={ct.id} value={ct.id}>
                {ct.name} (v{ct.publishedVersionCount || 1}.0)
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Category and Version Badges */}
        <div className="flex items-center justify-between pt-0.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500 bg-slate-100/90 px-2 py-0.5 rounded-md border border-slate-200/60">
            <span className="w-1 h-1 rounded-full bg-slate-400" />
            {category}
          </span>
          {isPublished ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              v{versionNumber}.0 Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#E1007A] bg-pink-50 px-2 py-0.5 rounded-md border border-pink-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E1007A]" />
              Draft v{versionNumber}.1
            </span>
          )}
        </div>
      </div>

      {/* Segmented Control Tabs */}
      <div className="px-4 pt-3 pb-1 shrink-0">
        <div className="grid grid-cols-3 p-1 bg-slate-100/90 rounded-xl gap-1 text-[11px] font-semibold text-slate-500 border border-slate-200/60">
          <button
            type="button"
            onClick={() => setActiveTab('workflow')}
            className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'workflow'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <SlidersHorizontal
              className={`w-3.5 h-3.5 ${
                activeTab === 'workflow' ? 'text-[#E1007A]' : 'text-slate-400'
              }`}
            />
            <span>Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <Users
              className={`w-3.5 h-3.5 ${
                activeTab === 'roles' ? 'text-sky-600' : 'text-slate-400'
              }`}
            />
            <span>Roles</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'roles'
                  ? 'bg-sky-100 text-sky-700'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {roles.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('diagnostics')}
            className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'diagnostics'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <CheckSquare
              className={`w-3.5 h-3.5 ${
                backendDagError
                  ? 'text-rose-600'
                  : activeTab === 'diagnostics'
                    ? 'text-emerald-600'
                    : 'text-slate-400'
              }`}
            />
            <span>Summary</span>
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                backendDagError ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Tab Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0 custom-scrollbar">
        {/* Error Alert Banner if any */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between gap-2 shadow-2xs">
            <div className="flex items-start gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[11px]">Validation Error</p>
                <p className="text-[11px] leading-snug break-words text-rose-700">
                  {errorMessage}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-600 cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab 1: Workflow Definition & Presets */}
        {activeTab === 'workflow' && (
          <div className="space-y-3.5 text-xs">
            {/* Title Field */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <FileText className="w-3 h-3 text-[#E1007A]" />
                <span>Template Title</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setCaseTypeMeta(e.target.value, description)}
                placeholder="e.g. Residential Sales Progression"
                className="w-full rounded-xl bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200/90 focus:border-[#E1007A] px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-pink-500/10 focus:outline-none transition-all shadow-2xs"
              />
            </div>

            {/* Description Field */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <Activity className="w-3 h-3 text-slate-400" />
                <span>Description & Scope</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setCaseTypeMeta(name, e.target.value)}
                placeholder="Conveyancing progression rules, milestone stages, and evidence requirements..."
                className="w-full rounded-xl bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200/90 focus:border-[#E1007A] px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 placeholder:italic focus:ring-2 focus:ring-pink-500/10 focus:outline-none transition-all resize-none shadow-2xs leading-relaxed"
              />
            </div>

            {/* Preset Archetypes Grid */}
            <div className="pt-2.5 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Archetype Preset
                </label>
                <span className="text-[9px] text-slate-400">1-click load</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {presetList.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => void loadPreset(preset.key)}
                    className="group relative p-2.5 rounded-xl text-left border border-slate-200/80 hover:border-[#E1007A]/50 bg-gradient-to-b from-white to-slate-50 hover:to-pink-50/30 transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E1007A]/70 group-hover:scale-125 transition-transform" />
                      <span className="text-[9px] font-mono text-slate-400 group-hover:text-[#E1007A]">
                        Load
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-800 group-hover:text-[#E1007A] transition-colors truncate">
                      {preset.name || preset.key}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Participant Roles Management */}
        {activeTab === 'roles' && (
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800">
                  Stakeholder Roles
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  ({roles.length})
                </span>
              </div>
              <button
                type="button"
                onClick={handleOpenAddRoleModal}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white bg-gradient-to-r from-[#E1007A] to-[#B80063] hover:opacity-95 transition-opacity cursor-pointer shadow-xs"
              >
                <Plus className="w-3 h-3" />
                <span>Add Role</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="p-2.5 rounded-xl bg-white hover:bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition-all duration-150 text-xs flex items-center justify-between gap-2.5 shadow-2xs group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200/60 border border-slate-200/80 flex items-center justify-center text-slate-600 shrink-0 shadow-2xs">
                      <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-800 text-[11px] truncate">
                          {role.name}
                        </span>
                        {role.isRequired ? (
                          <span className="text-[9px] font-bold text-[#E1007A] bg-pink-50 px-1.5 py-0.2 rounded-md border border-pink-200/80 shrink-0">
                            Required
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded-md border border-slate-200/60 shrink-0">
                            Optional
                          </span>
                        )}
                        {(role.maxOccurrences ?? 1) > 1 ? (
                          <span className="text-[9px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded-md border border-sky-200/80 shrink-0">
                            Max {role.maxOccurrences}
                          </span>
                        ) : null}
                      </div>
                      {role.description && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {role.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditRoleModal(role)}
                      title="Edit role"
                      className="text-slate-400 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    {roles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRole(role.id)}
                        title="Remove role"
                        className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Workflow Summary & Flow Status */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-3 text-xs">
            {/* Flow Status Hero Box */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                backendDagError
                  ? 'bg-gradient-to-br from-rose-50/80 via-rose-50/40 to-white border-rose-200/90 text-rose-900 shadow-2xs'
                  : 'bg-gradient-to-br from-emerald-50/80 via-emerald-50/40 to-white border-emerald-200/90 text-emerald-900 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 font-bold text-xs">
                  {backendDagError ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Workflow Conflict Detected</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Workflow Flow Valid</span>
                    </>
                  )}
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    backendDagError
                      ? 'bg-rose-200/70 text-rose-800'
                      : 'bg-emerald-200/70 text-emerald-800'
                  }`}
                >
                  {backendDagError ? 'Conflict' : 'Ready'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {backendDagError
                  ? 'One or more progression steps have circular prerequisites. Please adjust step dependencies to resolve the loop.'
                  : 'All progression stages and prerequisite rules connect seamlessly without any conflicting loops.'}
              </p>
            </div>

            {/* 2x2 Telemetry Metric Chips */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-50/40 to-slate-50/60 border border-violet-100/80 shadow-2xs">
                <div className="flex items-center justify-between text-violet-600 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Steps
                  </span>
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <span className="text-lg font-black text-slate-900">
                  {steps.length}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-50/40 to-slate-50/60 border border-sky-100/80 shadow-2xs">
                <div className="flex items-center justify-between text-sky-600 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Prerequisites
                  </span>
                  <GitBranch className="w-3.5 h-3.5" />
                </div>
                <span
                  className={`text-lg font-black ${
                    backendDagError ? 'text-rose-600' : 'text-slate-900'
                  }`}
                >
                  {edges.length}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-50/40 to-slate-50/60 border border-amber-100/80 shadow-2xs">
                <div className="flex items-center justify-between text-amber-600 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Tasks
                  </span>
                  <CheckSquare className="w-3.5 h-3.5" />
                </div>
                <span className="text-lg font-black text-slate-900">
                  {totalWorkItems}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-50/40 to-slate-50/60 border border-pink-100/80 shadow-2xs">
                <div className="flex items-center justify-between text-[#E1007A] mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Roles
                  </span>
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span className="text-lg font-black text-slate-900">
                  {roles.length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Dock: Fixed Stationary Action Bar */}
      <div className="p-4 bg-gradient-to-t from-slate-50/90 via-slate-50/60 to-white border-t border-slate-200/80 space-y-2.5 mt-auto shrink-0 shadow-inner">
        {/* Live Flow Status Bar */}
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  backendDagError ? 'bg-rose-400' : 'bg-emerald-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  backendDagError ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
              />
            </span>
            <span
              className={`font-bold text-[10px] uppercase tracking-wider ${
                backendDagError ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {backendDagError ? 'Workflow Conflict Detected' : 'Workflow Flow: Ready'}
            </span>
          </div>

          {lastSavedAt ? (
            <span className="text-[10px] text-slate-400 font-medium">
              Saved{' '}
              {lastSavedAt.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium">
              Draft Mode
            </span>
          )}
        </div>

        {/* Button Row: Add Step & Save Draft */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => addStep()}
            leftIcon={<Plus className="w-3.5 h-3.5 text-[#E1007A]" />}
            className="justify-center font-bold text-xs bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all"
          >
            Add Step
          </Button>

          <Button
            variant={backendDagError ? 'danger' : 'primary'}
            size="sm"
            isLoading={isSaving}
            onClick={handleSave}
            leftIcon={
              showSavedFeedback ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )
            }
            className={`justify-center font-bold text-xs shadow-xs transition-all ${
              backendDagError
                ? ''
                : 'bg-gradient-to-r from-[#E1007A] to-[#B80063] hover:from-[#d10071] hover:to-[#a30058] text-white hover:shadow-pink-500/25'
            }`}
          >
            {showSavedFeedback ? 'Saved!' : 'Save Draft'}
          </Button>
        </div>

        {/* Publish Button */}
        <button
          type="button"
          disabled={Boolean(backendDagError)}
          onClick={() => setIsPublishModalOpen(true)}
          className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
            backendDagError
              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              : 'bg-slate-900 hover:bg-slate-800 text-white hover:shadow-md active:scale-[0.99]'
          }`}
        >
          <Rocket className="w-3.5 h-3.5 text-pink-400" />
          <span>Publish Workflow (v{versionNumber}.0)</span>
        </button>
      </div>

      {/* Publish Confirmation Modal */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
      />

      {/* Add / Edit Custom Role Modal */}
      <Modal
        isOpen={isAddRoleModalOpen}
        onClose={() => setIsAddRoleModalOpen(false)}
        title={
          editingRoleId
            ? 'Edit Participant Role'
            : 'Add Custom Participant Role'
        }
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddRoleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRoleFormSubmit}
              leftIcon={
                editingRoleId ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )
              }
            >
              {editingRoleId ? 'Save Changes' : 'Add Role'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleRoleFormSubmit} className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Role Name <span className="text-[#E1007A]">*</span>
            </label>
            <Input
              placeholder="e.g. Commercial Landlord, Structural Engineer"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="text-xs"
              required
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Role Description (Optional)
            </label>
            <textarea
              rows={2}
              value={newRoleDesc}
              onChange={(e) => setNewRoleDesc(e.target.value)}
              placeholder="e.g. Legal conveyancing counsel representing the purchaser in all property matters..."
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 placeholder:italic focus:bg-white focus:border-[#E1007A] focus:outline-none"
            />
          </div>

          {/* Required on Case Creation toggle */}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requiredRoleCheck"
                checked={isRequiredRole}
                onChange={(e) => setIsRequiredRole(e.target.checked)}
                className="rounded border-slate-300 text-[#E1007A] focus:ring-[#E1007A]"
              />
              <label
                htmlFor="requiredRoleCheck"
                className="text-xs font-semibold text-slate-700 cursor-pointer select-none"
              >
                Required on Case Initiation
              </label>
            </div>
            <p className="text-[11px] text-slate-400 pl-6">
              When enabled, initiating a new case with this template mandates assigning a contact to this role.
            </p>
          </div>

          {/* Multiple assignees toggle and maxOccurrences configuration */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allowMultipleAssigneesCheck"
                checked={isMultipleAssignees}
                onChange={(e) => setIsMultipleAssignees(e.target.checked)}
                className="rounded border-slate-300 text-[#E1007A] focus:ring-[#E1007A]"
              />
              <label
                htmlFor="allowMultipleAssigneesCheck"
                className="text-xs font-semibold text-slate-700 cursor-pointer select-none"
              >
                Allow multiple assignees for this role
              </label>
            </div>
            <p className="text-[11px] text-slate-400 pl-6">
              e.g. Joint buyers, co-owners, or multiple partners
            </p>

            {isMultipleAssignees && (
              <div className="pl-6 space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Maximum Assignees
                </label>
                <Input
                  type="number"
                  min={2}
                  max={50}
                  value={roleMaxOccurrences}
                  onChange={(e) =>
                    setRoleMaxOccurrences(
                      Math.max(2, parseInt(e.target.value, 10) || 2),
                    )
                  }
                  className="text-xs w-32"
                />
              </div>
            )}
          </div>
        </form>
      </Modal>

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
              className="text-xs placeholder:text-slate-400 placeholder:italic"
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
              placeholder="e.g. Specialized residential sales progression and mortgage tracking process..."
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 placeholder:italic focus:bg-white focus:border-[#E1007A] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Initial Progression Archetype
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewTemplatePresetKey('blank')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  newTemplatePresetKey === 'blank'
                    ? 'border-[#E1007A] bg-pink-50/50 text-[#E1007A] font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <p className="text-xs">Blank / Custom Canvas</p>
                <p className="text-[10px] text-slate-400 font-normal">
                  Start from scratch
                </p>
              </button>

              {availablePresets.length > 0
                ? availablePresets.map((p) => (
                    <button
                      type="button"
                      key={p.key}
                      onClick={() => setNewTemplatePresetKey(p.key)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        newTemplatePresetKey === p.key
                          ? 'border-[#E1007A] bg-pink-50/50 text-[#E1007A] font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <p className="text-xs">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-normal">
                        {p.stepCount} Steps, {p.roleCount} Roles
                      </p>
                    </button>
                  ))
                : [
                    { key: 'sales', label: 'Residential Sales (6 Steps)' },
                    { key: 'commercial', label: 'Commercial Lease (3 Steps)' },
                    { key: 'appraisal', label: 'Market Appraisal (3 Steps)' },
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.key}
                      onClick={() => setNewTemplatePresetKey(p.key)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        newTemplatePresetKey === p.key
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
    </aside>
  );
};
