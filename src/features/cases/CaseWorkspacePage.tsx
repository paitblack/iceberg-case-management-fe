import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layers,
  FileText,
  MessageSquare,
  History,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Plus,
  Mail,
} from 'lucide-react';
import { WorkspaceHeader } from './workspace/WorkspaceHeader';
import { AiCaseSummaryCard } from './workspace/AiCaseSummaryCard';
import { SalesProgressionTracker } from './workspace/SalesProgressionTracker';
import { BlockersBanner } from './workspace/BlockersBanner';
import { StepExecutionCard } from './workspace/StepExecutionCard';
import { DocumentsTab } from './workspace/DocumentsTab';
import { AnnouncementsTab } from './workspace/AnnouncementsTab';
import {
  CommunicationsTab,
  type InitialCommunicationContext,
} from './workspace/CommunicationsTab';
import { ActivityTimelineTab } from './workspace/ActivityTimelineTab';
import { RecentActivitiesFeed } from './workspace/RecentActivitiesFeed';
import { CaseStakeholdersWidget } from './workspace/CaseStakeholdersWidget';
import { ExpectedDurationCard } from './workspace/ExpectedDurationCard';
import { ChangeStatusModal } from './components/ChangeStatusModal';
import { AddAdHocStepModal } from './workspace/AddAdHocStepModal';
import { AddAdHocWorkItemModal } from './workspace/AddAdHocWorkItemModal';
import { ConfirmDeleteModal } from './workspace/ConfirmDeleteModal';
import { UploadEvidenceModal } from './workspace/UploadEvidenceModal';
import { WorkItemOutreachModal } from './workspace/WorkItemOutreachModal';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { usePermissions } from '../auth/usePermissions';
import {
  fetchCaseWorkspace,
  executeStepAction,
  executeWorkItemAction,
  uploadCaseDocument,
  deleteCaseDocument,
  getDocumentDownloadUrl,
  assignCaseParticipant,
  removeCaseParticipant,
  addCaseNote,
  createCaseAnnouncement,
  createAnnouncementReply,
  changeCaseStatus,
  setStepTargetDate,
  setWorkItemTargetDate,
  addAdHocStep,
  reorderSteps,
  deleteAdHocStep,
  addAdHocWorkItem,
  deleteAdHocWorkItem,
  listCaseCommunications,
  sendCaseCommunication,
  generateCommunicationDraft,
  ApiError,
} from '../../lib/api-client';
import type {
  BffWorkspaceSnapshot,
  BffWorkspaceStep,
  BffWorkspaceWorkItem,
  CommunicationIntent,
  StepActionType,
  WorkItemActionType,
  AssignParticipantPayload,
  AddCaseNotePayload,
  CreateAnnouncementPayload,
  CreateAnnouncementReplyPayload,
  CaseStatusAction,
  AddAdHocStepPayload,
  AddAdHocWorkItemPayload,
  BffCaseCommunication,
  SendCommunicationPayload,
  GenerateCommunicationDraftPayload,
} from '../../types/api';

type WorkspaceTab =
  | 'progression'
  | 'documents'
  | 'participants'
  | 'announcements'
  | 'communications'
  | 'activities';

export const CaseWorkspacePage: React.FC = () => {
  const { caseId = '' } = useParams<{ caseId?: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('progression');
  const [snapshot, setSnapshot] = useState<BffWorkspaceSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isForbidden, setIsForbidden] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Mutation loading states
  const [loadingStepId, setLoadingStepId] = useState<string | null>(null);
  const [loadingWorkItemId, setLoadingWorkItemId] = useState<string | null>(
    null,
  );
  const [isUploadingDoc, setIsUploadingDoc] = useState<boolean>(false);
  const [uploadingWorkItemId, setUploadingWorkItemId] = useState<string | null>(
    null,
  );
  const [isSubmittingParticipant, setIsSubmittingParticipant] =
    useState<boolean>(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);
  const [isPostingAnnouncement, setIsPostingAnnouncement] =
    useState<boolean>(false);
  const [isPostingReply, setIsPostingReply] = useState<boolean>(false);
  const [statusModalAction, setStatusModalAction] =
    useState<CaseStatusAction | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [targetedStepId, setTargetedStepId] = useState<string | null>(null);

  // Communications Hub State
  const [communicationsList, setCommunicationsList] = useState<
    BffCaseCommunication[]
  >([]);
  const [initialCommContext, setInitialCommContext] =
    useState<InitialCommunicationContext | null>(null);
  const [isSendingCommunication, setIsSendingCommunication] =
    useState<boolean>(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState<boolean>(false);
  const [workItemOutreachContext, setWorkItemOutreachContext] = useState<{
    step: BffWorkspaceStep;
    workItem: BffWorkspaceWorkItem;
    intent: CommunicationIntent;
  } | null>(null);

  // Ad-hoc customization RBAC & modal state
  const { canCustomizeCase } = usePermissions();
  const canCustomize = Boolean(snapshot && canCustomizeCase(snapshot.status));

  const [isAddStepModalOpen, setIsAddStepModalOpen] = useState<boolean>(false);
  const [isSubmittingStep, setIsSubmittingStep] = useState<boolean>(false);
  const [addWorkItemTargetStep, setAddWorkItemTargetStep] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isSubmittingWorkItem, setIsSubmittingWorkItem] =
    useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'step' | 'work_item';
    stepId: string;
    workItemId?: string;
    name: string;
  } | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState<boolean>(false);

  // Evidence upload & verification modal state
  const [evidenceTarget, setEvidenceTarget] = useState<{
    stepId: string;
    stepName: string;
    workItem: BffWorkspaceWorkItem;
  } | null>(null);
  const [isSubmittingEvidence, setIsSubmittingEvidence] =
    useState<boolean>(false);
  const [evidenceErrorMessage, setEvidenceErrorMessage] = useState<
    string | null
  >(null);

  const handleSelectStep = (stepId: string) => {
    setActiveTab('progression');
    setTargetedStepId(stepId);

    setTimeout(() => {
      const el = document.getElementById(`step-card-${stepId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);

    setTimeout(() => {
      setTargetedStepId(null);
    }, 2500);
  };

  const handleViewFullTimeline = () => {
    setActiveTab('activities');

    setTimeout(() => {
      const el = document.getElementById('workspace-tabs-nav');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
  };

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const loadWorkspace = useCallback(async () => {
    setErrorBanner(null);
    setIsForbidden(false);
    if (!caseId) {
      setIsLoading(false);
      return;
    }

    try {
      const [data, comms] = await Promise.all([
        fetchCaseWorkspace(caseId),
        listCaseCommunications(caseId).catch(() => []),
      ]);
      if (data) {
        setSnapshot(data);
      }
      setCommunicationsList(comms);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 403) {
        setIsForbidden(true);
      } else {
        const msg =
          err instanceof ApiError
            ? err.problem.detail || err.message
            : `Failed to load case '${caseId}' from backend.`;
        setErrorBanner(msg);
      }
      setSnapshot(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    const handlePersonaChange = () => {
      loadWorkspace();
    };
    const handleForbidden = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      showToast(
        'error',
        customEvent.detail?.message ||
          'You do not have permission to perform this action.',
      );
    };

    window.addEventListener('auth:persona-changed', handlePersonaChange);
    window.addEventListener('auth:forbidden', handleForbidden);
    return () => {
      window.removeEventListener('auth:persona-changed', handlePersonaChange);
      window.removeEventListener('auth:forbidden', handleForbidden);
    };
  }, [loadWorkspace, showToast]);

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

      // If work item was completed, prompt optional stakeholder outreach modal
      if (action === 'COMPLETE') {
        const step = snapshot?.steps?.find((s) => s.id === stepId);
        const workItem = step?.workItems?.find((w) => w.id === workItemId);
        if (step && workItem) {
          setWorkItemOutreachContext({
            step,
            workItem,
            intent: 'PROGRESS_UPDATE',
          });
        }
      }

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
    if (workItemId) {
      setUploadingWorkItemId(workItemId);
    }
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
      setUploadingWorkItemId(null);
    }
  };

  const handleOpenEvidenceModal = (
    stepId: string,
    workItem: BffWorkspaceWorkItem,
  ) => {
    const step = snapshot?.steps?.find((s) => s.id === stepId);
    setEvidenceErrorMessage(null);
    setEvidenceTarget({
      stepId,
      stepName: step?.name || '',
      workItem,
    });
  };

  const handleUploadEvidence = async (file: File) => {
    if (!caseId || !evidenceTarget) return;
    setIsSubmittingEvidence(true);
    setEvidenceErrorMessage(null);
    try {
      await uploadCaseDocument(caseId, file, evidenceTarget.workItem.id);
      showToast(
        'success',
        evidenceTarget.workItem.status === 'Completed'
          ? `Replacement evidence "${file.name}" attached successfully.`
          : `Evidence "${file.name}" uploaded successfully. Task is now ready to be completed.`,
      );
      setEvidenceTarget(null);
      await loadWorkspace();
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.problem.detail || err.message
          : err instanceof Error
            ? err.message
            : 'Failed to upload evidence and complete task.';
      setEvidenceErrorMessage(msg);
      showToast('error', msg);
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  const handleDownloadDocument = async (
    documentId: string,
    fileName?: string,
  ) => {
    if (!caseId) return;
    try {
      const downloadInfo = await getDocumentDownloadUrl(caseId, documentId);
      if (downloadInfo?.url) {
        let downloadUrl = downloadInfo.url;

        // When Cloudflare R2 credentials use placeholder 'replace-with-account-id' in local development,
        // create a valid simulated document blob to support seamless testing without TLS/DNS failures.
        if (downloadUrl.includes('replace-with-account-id')) {
          showToast(
            'success',
            'Local Dev: Downloading simulated document file.',
          );
          const sampleContent = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 55 >>\nstream\nBT /F1 14 Tf 50 700 Td (Simulated Case Document: ${fileName || downloadInfo.fileName}) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000214 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n318\n%%EOF`;
          const blob = new Blob([sampleContent], {
            type: downloadInfo.contentType || 'application/pdf',
          });
          downloadUrl = URL.createObjectURL(blob);
        }

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName || downloadInfo.fileName || 'document.pdf';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        showToast('error', 'Download link is unavailable.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        showToast('error', err.problem.detail || err.message);
      } else {
        showToast('error', 'Failed to retrieve document download link.');
      }
      throw err;
    }
  };

  const handleDeleteDocument = async (
    documentId: string,
    fileName?: string,
  ) => {
    if (!caseId) return;
    try {
      await deleteCaseDocument(caseId, documentId);
      showToast(
        'success',
        `Document "${fileName || 'File'}" was deleted successfully.`,
      );
      await loadWorkspace();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        showToast('error', err.problem.detail || err.message);
      } else {
        showToast('error', 'Failed to delete document.');
      }
      throw err;
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

  const handlePostAnnouncement = async (payload: CreateAnnouncementPayload) => {
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

  const handleChaseWorkItem = (
    step: BffWorkspaceStep,
    workItem: BffWorkspaceWorkItem,
  ) => {
    setWorkItemOutreachContext({
      step,
      workItem,
      intent: workItem.evidenceRequired
        ? 'DOCUMENT_REQUEST'
        : 'MILESTONE_CHASE',
    });
  };

  const handleOpenOutreachInHub = () => {
    if (!workItemOutreachContext) return;
    const { step, workItem, intent } = workItemOutreachContext;
    const candidateRecipient = (snapshot?.participants || []).find((p) => {
      if (
        workItem.ownerRoleId &&
        (p.roleId === workItem.ownerRoleId || p.roleName === workItem.ownerRoleId)
      ) {
        return true;
      }
      if (
        workItem.role &&
        (p.roleName === workItem.role || p.roleId === workItem.role)
      ) {
        return true;
      }
      if (workItem.assignee?.id && p.id === workItem.assignee.id) return true;
      return false;
    });

    setInitialCommContext({
      stepId: step.id,
      stepName: step.name,
      workItemId: workItem.id,
      workItemName: workItem.name || workItem.title,
      evidenceRequired: workItem.evidenceRequired,
      targetRole: workItem.role || workItem.ownerRoleId,
      recipientId: candidateRecipient?.id,
      intent,
    });
    setWorkItemOutreachContext(null);
    setActiveTab('communications');
  };

  const handleSendCommunication = async (
    payload: SendCommunicationPayload,
  ) => {
    if (!caseId) return;
    setIsSendingCommunication(true);
    try {
      await sendCaseCommunication(caseId, payload);
      showToast(
        'success',
        'Email dispatched (simulated) and recorded in outbox.',
      );
      const updated = await listCaseCommunications(caseId);
      setCommunicationsList(updated);
      setWorkItemOutreachContext(null);
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(
          'error',
          err.problem.detail || err.problem.title || err.message,
        );
      } else {
        showToast('error', 'Failed to dispatch communication.');
      }
      throw err;
    } finally {
      setIsSendingCommunication(false);
    }
  };

  const handleGenerateCommunicationDraft = async (
    payload: GenerateCommunicationDraftPayload,
  ) => {
    if (!caseId) throw new Error('Case ID is required');
    setIsGeneratingDraft(true);
    try {
      return await generateCommunicationDraft(caseId, payload);
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(
          'error',
          err.problem.detail || err.problem.title || err.message,
        );
      } else {
        showToast('error', 'Failed to generate draft with AI.');
      }
      throw err;
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  // Ad-hoc Customization Handlers (Epic 1)
  const handleAddAdHocStep = async (payload: AddAdHocStepPayload) => {
    if (!caseId) return;
    setIsSubmittingStep(true);
    try {
      await addAdHocStep(caseId, payload);
      showToast('success', 'Custom step added successfully.');
      await loadWorkspace();
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(
          'error',
          err.problem.detail || err.problem.title || err.message,
        );
      } else {
        showToast('error', 'Failed to create custom step.');
      }
      throw err;
    } finally {
      setIsSubmittingStep(false);
    }
  };

  const handleReorderStep = async (
    stepId: string,
    direction: 'up' | 'down',
  ) => {
    if (!caseId || !snapshot) return;
    const currentSteps = snapshot.steps || [];
    const index = currentSteps.findIndex((s) => s.id === stepId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentSteps.length) return;

    const reorderedSteps = [...currentSteps];
    const [movedStep] = reorderedSteps.splice(index, 1);
    reorderedSteps.splice(targetIndex, 0, movedStep);

    const inSeq = reorderedSteps.filter((s) => !s.isStandalone);
    const isLinear = inSeq.every((s) => (s.dependencies?.length ?? 0) <= 1);

    // Optimistically update local order and dependencies in UI
    const updatedStepsWithOrder = reorderedSteps.map((s, idx) => {
      const inSeqIdx = inSeq.findIndex((x) => x.id === s.id);
      let optimisticDeps = s.dependencies ?? [];
      if (!s.isStandalone && isLinear && inSeqIdx !== -1) {
        optimisticDeps = inSeqIdx === 0 ? [] : [inSeq[inSeqIdx - 1]!.id];
      }
      return {
        ...s,
        displayOrder: idx + 1,
        dependencies: optimisticDeps,
      };
    });
    setSnapshot({
      ...snapshot,
      steps: updatedStepsWithOrder,
    });

    const stepOrder = reorderedSteps.map((s) => s.id);
    try {
      await reorderSteps(caseId, { stepOrder });
      showToast('success', 'Step order updated successfully.');
      await loadWorkspace();
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(
          'error',
          err.problem.detail || err.problem.title || err.message,
        );
      } else {
        showToast('error', 'Failed to reorder steps. Re-syncing workspace...');
      }
      await loadWorkspace();
    }
  };

  const handleOpenAddWorkItem = (stepId: string) => {
    const step = snapshot?.steps?.find((s) => s.id === stepId);
    if (step) {
      setAddWorkItemTargetStep({ id: step.id, name: step.name });
    }
  };

  const handleAddAdHocWorkItem = async (payload: AddAdHocWorkItemPayload) => {
    if (!caseId || !addWorkItemTargetStep) return;
    setIsSubmittingWorkItem(true);
    try {
      await addAdHocWorkItem(caseId, addWorkItemTargetStep.id, payload);
      showToast('success', 'Custom task added successfully.');
      await loadWorkspace();
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(
          'error',
          err.problem.detail || err.problem.title || err.message,
        );
      } else {
        showToast('error', 'Failed to add custom task.');
      }
      throw err;
    } finally {
      setIsSubmittingWorkItem(false);
    }
  };

  const handlePromptDeleteStep = (stepId: string) => {
    const step = snapshot?.steps?.find((s) => s.id === stepId);
    if (!step || !step.isAdHoc) return;
    if (step.status === 'InProgress' || step.status === 'Completed') {
      showToast('error', 'Cannot delete an active or completed step.');
      return;
    }
    setDeleteTarget({
      type: 'step',
      stepId: step.id,
      name: step.name,
    });
  };

  const handlePromptDeleteWorkItem = (stepId: string, workItemId: string) => {
    const step = snapshot?.steps?.find((s) => s.id === stepId);
    const workItem = step?.workItems?.find((wi) => wi.id === workItemId);
    if (!workItem || !workItem.isAdHoc) return;
    if (workItem.status === 'Completed') {
      showToast('error', 'Completed tasks cannot be deleted.');
      return;
    }
    setDeleteTarget({
      type: 'work_item',
      stepId,
      workItemId,
      name: workItem.name || workItem.title || 'Custom task',
    });
  };

  const handleConfirmDelete = async () => {
    if (!caseId || !deleteTarget) return;
    setIsDeletingItem(true);
    try {
      if (deleteTarget.type === 'step') {
        await deleteAdHocStep(caseId, deleteTarget.stepId);
        showToast('success', `Custom step "${deleteTarget.name}" deleted.`);
      } else if (deleteTarget.type === 'work_item' && deleteTarget.workItemId) {
        await deleteAdHocWorkItem(
          caseId,
          deleteTarget.stepId,
          deleteTarget.workItemId,
        );
        showToast('success', `Custom task "${deleteTarget.name}" deleted.`);
      }
      setDeleteTarget(null);
      await loadWorkspace();
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(
          'error',
          err.problem.detail || err.problem.title || err.message,
        );
      } else {
        showToast('error', 'Failed to delete custom item.');
      }
    } finally {
      setIsDeletingItem(false);
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

  if (isForbidden) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 border border-amber-200">
          <ShieldAlert className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Access Restricted
        </h2>
        <p className="text-sm text-slate-600 max-w-md mb-6">
          You are not assigned as an authorized stakeholder or solicitor on this
          case. Only assigned case participants or system administrators can
          view this workspace.
        </p>
        <Button onClick={() => navigate('/cases')} variant="outline">
          Back to Cases
        </Button>
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
              {errorBanner
                ? 'Unable to Load Case Workspace'
                : 'Case Not Found in Backend Database'}
            </h3>
            <p className="text-xs text-slate-500">
              {errorBanner ||
                `The requested case identifier "${caseId}" does not exist in the database or could not be loaded.`}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2.5 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadWorkspace()}
            >
              Retry
            </Button>
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
    <div className="space-y-4 pb-2 lg:h-[calc(100vh-8.5rem)] lg:max-h-[calc(100vh-8.5rem)] lg:flex lg:flex-col lg:overflow-hidden">
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

      {errorBanner && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Top Action Bar: Back to Case Directory (Left) & Refresh Snapshot (Right) perfectly aligned */}
      <div className="flex items-center justify-between h-9 shrink-0">
        <button
          type="button"
          onClick={() => navigate('/cases')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer group w-fit"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Case Directory</span>
        </button>

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

      {/* 2-Column Responsive Workspace Grid: Main workspace on left, Persistent Sidebar pinned on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left / Main Content Column (8 cols on lg, 9 cols on xl) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6 min-w-0 lg:h-full lg:overflow-y-auto lg:pr-2 pb-16">
          {/* AI Case Resolution Summary Card */}
          <AiCaseSummaryCard
            status={snapshot.status}
            aiSummary={snapshot.aiSummary}
          />

          {/* Main Workspace Header Card */}
          <WorkspaceHeader
            snapshot={snapshot}
            onOpenStatusModal={(action) => setStatusModalAction(action)}
            showDurationCard={false}
          />
          {/* Sales Progression Stepper & Current Position Tracker */}
          <SalesProgressionTracker
            snapshot={snapshot}
            onSelectStep={handleSelectStep}
          />

          {/* Blockers Alert Banner */}
          <BlockersBanner blockers={blockersList} />

          {/* Workspace Tabs Navigation (Stakeholders tab removed) */}
          <div
            id="workspace-tabs-nav"
            className="flex items-center gap-2 border-b border-slate-200 pb-px scroll-mt-6"
          >
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
              onClick={() => setActiveTab('announcements')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'announcements'
                  ? 'border-[#E1007A] text-[#E1007A]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>
                Discussions & Announcements (
                {(snapshot.announcements || []).length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('communications')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'communications'
                  ? 'border-[#E1007A] text-[#E1007A]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Communications Hub ({communicationsList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('activities')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'activities'
                  ? 'border-[#E1007A] text-[#E1007A]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Activity & Audit Trail</span>
            </button>
          </div>

          {/* Tab Content Render */}
          {activeTab === 'progression' && (
            <div className="space-y-4">
              {/* Progression Section Header & Custom Step Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Progression Milestones & Action Steps
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Linear progression pathway and ad-hoc case customizations.
                  </p>
                </div>
                {canCustomize && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setIsAddStepModalOpen(true)}
                    leftIcon={<Plus className="w-4 h-4" />}
                    className="font-bold text-xs shrink-0 self-start sm:self-center"
                  >
                    Add Custom Step
                  </Button>
                )}
              </div>

              {stepsList.length === 0 ? (
                <div className="p-12 rounded-2xl bg-white border border-dashed border-slate-200 text-center space-y-2">
                  <Layers className="w-8 h-8 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700">
                    No Progression Steps Initialized
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    This case instance is waiting for milestone instantiation
                    from its template version.
                  </p>
                </div>
              ) : (
                stepsList.map((step, idx) => (
                  <StepExecutionCard
                    key={step.id}
                    step={step}
                    allSteps={stepsList}
                    documents={documentsList}
                    participants={participantsList}
                    canCustomize={canCustomize}
                    isFirstStep={idx === 0}
                    isLastStep={idx === stepsList.length - 1}
                    onMoveStepUp={(stepId) => handleReorderStep(stepId, 'up')}
                    onMoveStepDown={(stepId) =>
                      handleReorderStep(stepId, 'down')
                    }
                    onDeleteStep={handlePromptDeleteStep}
                    onOpenAddWorkItem={handleOpenAddWorkItem}
                    onDeleteWorkItem={handlePromptDeleteWorkItem}
                    onStepAction={handleStepAction}
                    onWorkItemAction={handleWorkItemAction}
                    onAddNote={handleAddNote}
                    onUpdateStepTargetDate={handleUpdateStepTargetDate}
                    onUpdateWorkItemTargetDate={handleUpdateWorkItemTargetDate}
                    onUploadDocument={handleUploadDocument}
                    onDownloadDocument={handleDownloadDocument}
                    onDeleteDocument={handleDeleteDocument}
                    onOpenEvidenceModal={handleOpenEvidenceModal}
                    loadingStepId={loadingStepId}
                    loadingWorkItemId={loadingWorkItemId}
                    uploadingWorkItemId={uploadingWorkItemId}
                    isAddingNote={isSubmittingNote}
                    isTargeted={targetedStepId === step.id}
                    onChaseWorkItem={handleChaseWorkItem}
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
              onDownloadDocument={handleDownloadDocument}
              onDeleteDocument={handleDeleteDocument}
              isUploading={isUploadingDoc}
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

          {activeTab === 'communications' && (
            <CommunicationsTab
              caseId={caseId}
              caseTitle={snapshot.title || 'Case Progression'}
              participants={participantsList}
              communications={communicationsList}
              initialContext={initialCommContext}
              onSendCommunication={handleSendCommunication}
              onGenerateDraft={handleGenerateCommunicationDraft}
              isSending={isSendingCommunication}
              isGeneratingDraft={isGeneratingDraft}
            />
          )}

          {activeTab === 'activities' && (
            <ActivityTimelineTab caseId={snapshot.caseId} />
          )}
        </div>

        {/* Right Persistent Sidebar Column (Zero column scrollbar - Fixed hierarchical sizing: Aktörler > Activity > Time) */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-3 min-w-0 lg:h-full lg:overflow-hidden pb-1 shrink-0">
          {/* 1. Aktörler (EN BÜYÜK ALAN - Dominant alan, aktivite arttıkça küçülmez) */}
          <div className="flex-1 min-h-[320px] flex flex-col overflow-hidden">
            <CaseStakeholdersWidget
              participants={participantsList}
              roles={snapshot.roles || []}
              onAssignParticipant={handleAssignParticipant}
              onRemoveParticipant={handleRemoveParticipant}
              isSubmitting={isSubmittingParticipant}
              className="h-full flex flex-col"
            />
          </div>

          {/* 2. Recent Activities Özeti (ORTA ALAN - Sabit 185px, aktivite eklendikçe büyümez) */}
          <div className="h-[185px] shrink-0 flex flex-col">
            <RecentActivitiesFeed
              activities={snapshot.recentActivities || []}
              onViewFullTimeline={handleViewFullTimeline}
              className="h-full flex flex-col"
            />
          </div>

          {/* 3. Expected Duration & Timeline (EN KÜÇÜK ALAN - Sabit kompakt 76px) */}
          <div className="h-[76px] shrink-0">
            <ExpectedDurationCard snapshot={snapshot} className="h-full" />
          </div>
        </div>
      </div>

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

      {/* Add Ad-hoc Step Modal */}
      <AddAdHocStepModal
        isOpen={isAddStepModalOpen}
        onClose={() => setIsAddStepModalOpen(false)}
        onSubmit={handleAddAdHocStep}
        isSubmitting={isSubmittingStep}
        existingSteps={snapshot?.steps || []}
      />

      {/* Add Ad-hoc Work Item Modal */}
      <AddAdHocWorkItemModal
        isOpen={addWorkItemTargetStep !== null}
        stepName={addWorkItemTargetStep?.name || ''}
        roles={snapshot?.roles || []}
        onClose={() => setAddWorkItemTargetStep(null)}
        onSubmit={handleAddAdHocWorkItem}
        isSubmitting={isSubmittingWorkItem}
      />

      {/* Confirm Delete Ad-hoc Step or Work Item Modal */}
      <ConfirmDeleteModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={
          deleteTarget?.type === 'step'
            ? 'Delete Custom Step'
            : 'Delete Custom Task'
        }
        description={
          deleteTarget?.type === 'step'
            ? `Are you sure you want to delete custom step "${deleteTarget.name}"? Any associated tasks will also be deleted.`
            : `Are you sure you want to delete custom task "${deleteTarget?.name}"?`
        }
        confirmButtonText={
          deleteTarget?.type === 'step' ? 'Delete Step' : 'Delete Task'
        }
        isDeleting={isDeletingItem}
      />

      {/* Upload Evidence Modal */}
      {evidenceTarget && (
        <UploadEvidenceModal
          isOpen={evidenceTarget !== null}
          onClose={() => {
            if (!isSubmittingEvidence) {
              setEvidenceTarget(null);
              setEvidenceErrorMessage(null);
            }
          }}
          onSubmit={handleUploadEvidence}
          workItemName={
            evidenceTarget.workItem.name ||
            evidenceTarget.workItem.title ||
            'Task'
          }
          stepName={evidenceTarget.stepName}
          targetRoleDisplayName={evidenceTarget.workItem.role}
          isSubmitting={isSubmittingEvidence}
          errorMessage={evidenceErrorMessage}
        />
      )}

      {/* Work Item Stakeholder Outreach Modal */}
      {workItemOutreachContext && (
        <WorkItemOutreachModal
          isOpen={workItemOutreachContext !== null}
          onClose={() => setWorkItemOutreachContext(null)}
          caseId={caseId}
          workItem={workItemOutreachContext.workItem}
          stepName={workItemOutreachContext.step.name}
          caseTitle={snapshot?.title}
          caseTypeName={snapshot?.caseTypeName}
          participants={participantsList}
          intent={workItemOutreachContext.intent}
          onSendCommunication={handleSendCommunication}
          onGenerateDraft={handleGenerateCommunicationDraft}
          onOpenInHub={handleOpenOutreachInHub}
          isSending={isSendingCommunication}
        />
      )}
    </div>
  );
};
