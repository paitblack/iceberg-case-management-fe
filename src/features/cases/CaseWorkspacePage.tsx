import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layers,
  FileText,
  Users,
  MessageSquare,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { WorkspaceHeader } from './workspace/WorkspaceHeader';
import { BlockersBanner } from './workspace/BlockersBanner';
import { StepExecutionCard } from './workspace/StepExecutionCard';
import { DocumentsTab } from './workspace/DocumentsTab';
import { ParticipantsTab } from './workspace/ParticipantsTab';
import { AnnouncementsTab } from './workspace/AnnouncementsTab';
import { ChangeStatusModal } from './components/ChangeStatusModal';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import {
  fetchCaseWorkspace,
  executeStepAction,
  executeWorkItemAction,
  uploadCaseDocument,
  assignCaseParticipant,
  removeCaseParticipant,
  addCaseNote,
  createCaseAnnouncement,
  createAnnouncementReply,
  changeCaseStatus,
  setStepTargetDate,
  setWorkItemTargetDate,
  ApiError,
} from '../../lib/api-client';
import type {
  BffWorkspaceSnapshot,
  StepActionType,
  WorkItemActionType,
  AssignParticipantPayload,
  AddCaseNotePayload,
  CreateAnnouncementPayload,
  CreateAnnouncementReplyPayload,
  CaseStatusAction,
} from '../../types/api';

type WorkspaceTab = 'progression' | 'documents' | 'participants' | 'announcements';

export const CaseWorkspacePage: React.FC = () => {
  const { caseId = '' } = useParams<{ caseId?: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('progression');
  const [snapshot, setSnapshot] = useState<BffWorkspaceSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Mutation loading states
  const [loadingStepId, setLoadingStepId] = useState<string | null>(null);
  const [loadingWorkItemId, setLoadingWorkItemId] = useState<string | null>(
    null,
  );
  const [isUploadingDoc, setIsUploadingDoc] = useState<boolean>(false);
  const [isSubmittingParticipant, setIsSubmittingParticipant] =
    useState<boolean>(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);
  const [isPostingAnnouncement, setIsPostingAnnouncement] =
    useState<boolean>(false);
  const [isPostingReply, setIsPostingReply] = useState<boolean>(false);
  const [statusModalAction, setStatusModalAction] =
    useState<CaseStatusAction | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadWorkspace = useCallback(async () => {
    setErrorBanner(null);
    if (!caseId) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await fetchCaseWorkspace(caseId);
      if (data) {
        setSnapshot(data);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.problem.detail || err.message
          : `Failed to load case '${caseId}' from backend.`;
      setErrorBanner(msg);
      setSnapshot(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const handleStepAction = async (stepId: string, action: StepActionType) => {
    if (!caseId) return;
    setLoadingStepId(stepId);
    try {
      await executeStepAction(caseId, stepId, action);
      showToast(
        'success',
        `Milestone step action '${action}' completed successfully.`,
      );
      await loadWorkspace();
    } catch (err) {
      if (err instanceof ApiError) {
        showToast('error', err.problem.detail || err.message);
      } else {
        showToast('error', 'Failed to execute step action on backend.');
      }
    } finally {
      setLoadingStepId(null);
    }
  };

  const handleWorkItemAction = async (
    stepId: string,
    workItemId: string,
    action: WorkItemActionType,
  ) => {
    if (!caseId) return;
    setLoadingWorkItemId(workItemId);
    try {
      await executeWorkItemAction(caseId, stepId, workItemId, action);
      showToast(
        'success',
        `Work item '${action}' executed successfully on backend.`,
      );
      await loadWorkspace();
    } catch (err) {
      if (err instanceof ApiError) {
        showToast('error', err.problem.detail || err.message);
      } else {
        showToast('error', 'Failed to execute work item action on backend.');
      }
    } finally {
      setLoadingWorkItemId(null);
    }
  };

  const handleUploadDocument = async (file: File, workItemId?: string) => {
    if (!caseId) return;
    setIsUploadingDoc(true);
    try {
      await uploadCaseDocument(caseId, file, workItemId);
      showToast('success', `Document "${file.name}" uploaded successfully.`);
      await loadWorkspace();
    } catch (err) {
      if (err instanceof ApiError) {
        showToast('error', err.problem.detail || err.message);
      } else {
        showToast('error', 'Failed to upload document to backend storage.');
      }
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleAssignParticipant = async (payload: AssignParticipantPayload) => {
    if (!caseId) return;
    setIsSubmittingParticipant(true);
    try {
      await assignCaseParticipant(caseId, payload);
      showToast(
        'success',
        `Stakeholder "${payload.name}" assigned successfully.`,
      );
      await loadWorkspace();
    } catch (err) {
      if (err instanceof ApiError) {
        showToast('error', err.problem.detail || err.message);
      } else {
        showToast('error', 'Failed to assign stakeholder on backend.');
      }
      throw err;
    } finally {
      setIsSubmittingParticipant(false);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!caseId) return;
    try {
      await removeCaseParticipant(caseId, participantId);
      showToast('success', 'Stakeholder removed from case.');
      await loadWorkspace();
    } catch (err) {
      if (err instanceof ApiError) {
        showToast('error', err.problem.detail || err.message);
      } else {
        showToast('error', 'Failed to remove stakeholder from backend.');
      }
      throw err;
    }
  };

  const handleAddNote = async (payload: AddCaseNotePayload) => {
    if (!caseId) return;
    setIsSubmittingNote(true);
    try {
      await addCaseNote(caseId, payload);
      showToast(
        'success',
        payload.isPrivate
          ? 'Private internal note recorded.'
          : 'Step note recorded successfully.',
      );
      await loadWorkspace();
    } catch (err) {
      if (err instanceof ApiError) {
        showToast('error', err.problem.detail || err.message);
      } else {
        showToast('error', 'Failed to post note on backend.');
      }
      throw err;
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handlePostAnnouncement = async (
    payload: CreateAnnouncementPayload,
  ) => {
    if (!caseId) return;
    setIsPostingAnnouncement(true);
    try {
      await createCaseAnnouncement(caseId, payload);
      showToast('success', 'Announcement broadcasted to case discussions.');
      await loadWorkspace();
    } catch (err) {
      if (err instanceof ApiError) {
        showToast('error', err.problem.detail || err.message);
      } else {
        showToast('error', 'Failed to broadcast announcement.');
      }
      throw err;
    } finally {
      setIsPostingAnnouncement(false);
    }
  };

  const handlePostReply = async (
    announcementId: string,
    payload: CreateAnnouncementReplyPayload,
  ) => {
    if (!caseId) return;
    setIsPostingReply(true);
    try {
      await createAnnouncementReply(caseId, announcementId, payload);
      showToast('success', 'Reply posted to discussion thread.');
      await loadWorkspace();
    } catch (err) {
      if (err instanceof ApiError) {
        showToast('error', err.problem.detail || err.message);
      } else {
        showToast('error', 'Failed to post reply.');
      }
      throw err;
    } finally {
      setIsPostingReply(false);
    }
  };

  const handleUpdateStepTargetDate = async (
    stepId: string,
    targetDate: string | null,
  ) => {
    if (!caseId) return;
    try {
      await setStepTargetDate(caseId, stepId, targetDate);
      showToast(
        'success',
        targetDate
          ? 'Milestone target SLA deadline updated.'
          : 'Milestone target date cleared.',
      );
      await loadWorkspace();
    } catch (err) {
      if (err instanceof ApiError) {
        showToast('error', err.problem.detail || err.message);
      } else {
        showToast('error', 'Failed to update milestone target date.');
      }
      throw err;
    }
  };

  const handleUpdateWorkItemTargetDate = async (
    _stepId: string,
    workItemId: string,
    targetDate: string | null,
  ) => {
    if (!caseId) return;
    try {
      await setWorkItemTargetDate(caseId, workItemId, targetDate);
      showToast(
        'success',
        targetDate
          ? 'Task target SLA deadline updated.'
          : 'Task target date cleared.',
      );
      await loadWorkspace();
    } catch (err) {
      if (err instanceof ApiError) {
        showToast('error', err.problem.detail || err.message);
      } else {
        showToast('error', 'Failed to update task target date.');
      }
      throw err;
    }
  };

  const handleConfirmStatusChange = async (
    targetCaseId: string,
    action: CaseStatusAction,
    reason?: string,
  ) => {
    setIsUpdatingStatus(true);
    try {
      await changeCaseStatus(targetCaseId, { action, reason });
      showToast(
        'success',
        action === 'REOPEN'
          ? 'Case successfully reopened and returned to Open status.'
          : `Case status changed successfully (${action}).`,
      );
      await loadWorkspace();
    } catch (err) {
      if (err instanceof ApiError) {
        showToast('error', err.problem.detail || err.message);
      } else {
        showToast('error', 'Failed to update case status on backend.');
      }
      throw err;
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-4">
        <Spinner size="lg" />
        <p className="text-xs font-semibold text-slate-500 animate-pulse">
          Loading case workspace progression snapshot...
        </p>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="space-y-6 pb-16">
        <button
          type="button"
          onClick={() => navigate('/cases')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer group w-fit"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Case Directory</span>
        </button>

        <div className="iceberg-card p-12 text-center space-y-4 border border-slate-200/90 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto text-rose-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-slate-800">
              Case Not Found in Backend Database
            </h3>
            <p className="text-xs text-slate-500">
              {errorBanner ||
                `The requested case identifier "${caseId}" does not exist in the database or could not be loaded.`}
            </p>
          </div>
          <div className="flex justify-center pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/cases')}
            >
              Return to Case Directory
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const stepsList = snapshot.steps || [];
  const documentsList = snapshot.documents || [];
  const participantsList = snapshot.participants || [];
  const blockersList = snapshot.blockers || [];

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border text-xs animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/cases')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer group w-fit"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Case Directory</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            isLoading={isRefreshing}
            onClick={() => {
              setIsRefreshing(true);
              loadWorkspace();
            }}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Snapshot
          </Button>
        </div>
      </div>

      {errorBanner && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Main Workspace Header Card */}
      <WorkspaceHeader
        snapshot={snapshot}
        onOpenStatusModal={(action) => setStatusModalAction(action)}
      />

      {/* Blockers Alert Banner */}
      <BlockersBanner blockers={blockersList} />

      {/* Workspace Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('progression')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'progression'
              ? 'border-[#E1007A] text-[#E1007A]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Workflow Progression ({stepsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'documents'
              ? 'border-[#E1007A] text-[#E1007A]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Documents & Evidence ({documentsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('participants')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'participants'
              ? 'border-[#E1007A] text-[#E1007A]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Stakeholders & Solicitors ({participantsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'announcements'
              ? 'border-[#E1007A] text-[#E1007A]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>
            Discussions & Announcements ({(snapshot.announcements || []).length})
          </span>
        </button>
      </div>

      {/* Tab Content Render */}
      {activeTab === 'progression' && (
        <div className="space-y-4">
          {stepsList.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-dashed border-slate-200 text-center space-y-2">
              <Layers className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">
                No Progression Steps Initialized
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                This case instance is waiting for milestone instantiation from
                its template version.
              </p>
            </div>
          ) : (
            stepsList.map((step) => (
              <StepExecutionCard
                key={step.id}
                step={step}
                documents={documentsList}
                participants={participantsList}
                onStepAction={handleStepAction}
                onWorkItemAction={handleWorkItemAction}
                onAddNote={handleAddNote}
                onUpdateStepTargetDate={handleUpdateStepTargetDate}
                onUpdateWorkItemTargetDate={handleUpdateWorkItemTargetDate}
                loadingStepId={loadingStepId}
                loadingWorkItemId={loadingWorkItemId}
                isAddingNote={isSubmittingNote}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <DocumentsTab
          documents={documentsList}
          steps={stepsList}
          onUploadDocument={handleUploadDocument}
          isUploading={isUploadingDoc}
        />
      )}

      {activeTab === 'participants' && (
        <ParticipantsTab
          participants={participantsList}
          roles={snapshot.roles || []}
          onAssignParticipant={handleAssignParticipant}
          onRemoveParticipant={handleRemoveParticipant}
          isSubmitting={isSubmittingParticipant}
        />
      )}

      {activeTab === 'announcements' && (
        <AnnouncementsTab
          announcements={snapshot.announcements || []}
          participants={participantsList}
          onPostAnnouncement={handlePostAnnouncement}
          onPostReply={handlePostReply}
          isPostingAnnouncement={isPostingAnnouncement}
          isPostingReply={isPostingReply}
        />
      )}

      {/* Change Status Modal (e.g. Reopen Case) */}
      <ChangeStatusModal
        isOpen={statusModalAction !== null}
        onClose={() => setStatusModalAction(null)}
        caseItem={
          snapshot
            ? {
                id: snapshot.caseId,
                caseTypeId: snapshot.caseTypeId,
                caseTypeName: snapshot.caseTypeName,
                title: snapshot.title,
                status: snapshot.status,
                statusLabel: snapshot.status,
                progress: {
                  totalSteps: stepsList.length,
                  completedSteps: stepsList.filter(
                    (s) => s.status === 'Completed' || s.status === 'Skipped',
                  ).length,
                  percentage: snapshot.progressPercentage,
                },
                blockersCount: blockersList.length,
                createdAt: snapshot.updatedAt,
                allowedActions: snapshot.allowedActions || [],
              }
            : null
        }
        action={statusModalAction}
        onConfirm={handleConfirmStatusChange}
        isLoading={isUpdatingStatus}
      />
    </div>
  );
};
