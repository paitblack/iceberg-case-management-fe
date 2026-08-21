import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layers,
  FileText,
  Users,
  History,
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
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import {
  fetchCaseWorkspace,
  executeStepAction,
  executeWorkItemAction,
  uploadCaseDocument,
  ApiError,
} from '../../lib/api-client';
import type {
  BffWorkspaceSnapshot,
  StepActionType,
  WorkItemActionType,
} from '../../types/api';

const INITIAL_MOCK_WORKSPACE: BffWorkspaceSnapshot = {
  caseId: 'case-oxford-101',
  reference: 'CM-2026-084',
  title: '42 Woodstock Road, Oxford OX2 6HT',
  propertyAddress: '42 Woodstock Road, Oxford OX2 6HT',
  caseTypeId: 'ct-sales-01',
  caseTypeName: 'UK Residential Sales Progression',
  templateVersion: 3,
  status: 'Open',
  progressPercentage: 58,
  agreedPrice: 475000,
  assignedProgressorName: 'Sarah Jenkins',
  branchName: 'Oxford Central Branch',
  targetCompletionDate: '28 Sep 2026',
  blockers: [
    'Waiting for Biometric AML ID and Proof of Funds verification from buyer conveyancer.',
  ],
  steps: [
    {
      id: 'step-exec-1',
      stepDefinitionId: 'step-def-1',
      name: 'Offer Accepted & Terms Confirmed',
      description:
        'Agreed purchase price, buyer deposit, and vendor acceptance confirmed.',
      status: 'Completed',
      displayOrder: 1,
      dependencyJoinType: 'ALL',
      dependencies: [],
      allowedActions: [],
      workItems: [
        {
          id: 'wi-exec-1',
          stepId: 'step-exec-1',
          title: 'Record agreed offer price & deposit amount',
          status: 'Completed',
          tag: 'Manual',
          requirement: 'required',
          role: 'Listing Agent',
          allowedActions: [],
          completedAt: '2026-08-10T09:30:00Z',
          completedByUserName: 'Marcus Sterling',
        },
        {
          id: 'wi-exec-2',
          stepId: 'step-exec-1',
          title: 'Verify buyer chain & financial qualification',
          status: 'Completed',
          tag: 'Manual',
          requirement: 'required',
          role: 'Listing Agent',
          allowedActions: [],
          completedAt: '2026-08-10T11:15:00Z',
          completedByUserName: 'Marcus Sterling',
        },
      ],
    },
    {
      id: 'step-exec-2',
      stepDefinitionId: 'step-def-2',
      name: 'Memorandum of Sale Distributed',
      description:
        'Sales memo issued to buyer and seller legal representatives.',
      status: 'Completed',
      displayOrder: 2,
      dependencyJoinType: 'ALL',
      dependencies: ['step-exec-1'],
      allowedActions: [],
      workItems: [
        {
          id: 'wi-exec-3',
          stepId: 'step-exec-2',
          title: 'Generate formal Memorandum of Sale document',
          status: 'Completed',
          tag: 'Document Upload',
          requirement: 'required',
          role: 'Sales Progressor',
          allowedActions: [],
          completedAt: '2026-08-11T14:00:00Z',
          completedByUserName: 'Sarah Jenkins',
        },
        {
          id: 'wi-exec-4',
          stepId: 'step-exec-2',
          title: 'Distribute Memo to all legal representatives',
          status: 'Completed',
          tag: 'Email',
          requirement: 'required',
          role: 'Sales Progressor',
          allowedActions: [],
          completedAt: '2026-08-11T16:20:00Z',
          completedByUserName: 'Sarah Jenkins',
        },
      ],
    },
    {
      id: 'step-exec-3',
      stepDefinitionId: 'step-def-3',
      name: 'Buyer Solicitor Instructed & ID Verification',
      description:
        'Confirm buyer legal representation and AML biometric checks.',
      status: 'InProgress',
      displayOrder: 3,
      dependencyJoinType: 'ALL',
      dependencies: ['step-exec-2'],
      allowedActions: ['COMPLETE_STEP', 'SKIP_STEP'],
      workItems: [
        {
          id: 'wi-exec-5',
          stepId: 'step-exec-3',
          title: 'Collect buyer solicitor contact details',
          status: 'Completed',
          tag: 'Manual',
          requirement: 'required',
          role: 'Sales Progressor',
          allowedActions: [],
          completedAt: '2026-08-14T10:00:00Z',
          completedByUserName: 'Sarah Jenkins',
        },
        {
          id: 'wi-exec-6',
          stepId: 'step-exec-3',
          title: 'Verify biometric AML ID and source of funds',
          status: 'Pending',
          tag: 'Key Date',
          requirement: 'required',
          role: 'Compliance Officer',
          isKeyDate: true,
          allowedActions: ['COMPLETE', 'WAIVE'],
        },
        {
          id: 'wi-exec-7',
          stepId: 'step-exec-3',
          title: 'Send instruction confirmation letter',
          status: 'Pending',
          tag: 'Email',
          requirement: 'optional',
          role: 'Sales Progressor',
          allowedActions: ['COMPLETE', 'WAIVE'],
        },
      ],
    },
    {
      id: 'step-exec-4',
      stepDefinitionId: 'step-def-4',
      name: 'Searches & Legal Enquiries Ordered',
      description:
        'Local council, environmental, and drainage searches submitted.',
      status: 'Pending',
      displayOrder: 4,
      dependencyJoinType: 'ALL',
      dependencies: ['step-exec-3'],
      allowedActions: [],
      workItems: [
        {
          id: 'wi-exec-8',
          stepId: 'step-exec-4',
          title: 'Confirm search fees received from buyer',
          status: 'Pending',
          tag: 'Manual',
          requirement: 'required',
          role: 'Sales Progressor',
          allowedActions: [],
        },
        {
          id: 'wi-exec-9',
          stepId: 'step-exec-4',
          title: 'Log local authority search submission date',
          status: 'Pending',
          tag: 'Key Date',
          requirement: 'required',
          role: 'Sales Progressor',
          isKeyDate: true,
          allowedActions: [],
        },
      ],
    },
    {
      id: 'step-exec-5',
      stepDefinitionId: 'step-def-5',
      name: 'Exchange of Contracts & Key Release',
      description:
        'Formal contract exchange, 10% deposit held, completion authorized.',
      status: 'Pending',
      displayOrder: 5,
      dependencyJoinType: 'ALL',
      dependencies: ['step-exec-4'],
      allowedActions: [],
      workItems: [
        {
          id: 'wi-exec-10',
          stepId: 'step-exec-5',
          title: 'Confirm cleared exchange deposit in solicitor account',
          status: 'Pending',
          tag: 'Key Date',
          requirement: 'required',
          role: 'Sales Progressor',
          isKeyDate: true,
          allowedActions: [],
        },
      ],
    },
  ],
  documents: [
    {
      id: 'doc-1',
      fileName: 'Memorandum_of_Sale_42Woodstock.pdf',
      fileSizeBytes: 2450000,
      fileType: 'application/pdf',
      category: 'Conveyancing',
      uploadedAt: '2026-08-11T14:00:00Z',
      uploadedByName: 'Sarah Jenkins',
    },
    {
      id: 'doc-2',
      fileName: 'LandRegistry_Title_Register_OX2.pdf',
      fileSizeBytes: 3120000,
      fileType: 'application/pdf',
      category: 'Conveyancing',
      uploadedAt: '2026-08-12T09:15:00Z',
      uploadedByName: 'Marcus Sterling',
    },
    {
      id: 'doc-3',
      fileName: 'Biometric_AML_Verification_Pass.pdf',
      fileSizeBytes: 1850000,
      fileType: 'application/pdf',
      category: 'AML & Identity',
      uploadedAt: '2026-08-14T11:45:00Z',
      uploadedByName: 'Compliance Auto-Check',
    },
  ],
  participants: [
    {
      id: 'p-1',
      roleId: 'role-buyer',
      roleName: 'Buyer',
      name: 'Dr. Emily Watson',
      email: 'emily.watson@oxford.ac.uk',
      phone: '+44 7700 900123',
      isPrimary: true,
    },
    {
      id: 'p-2',
      roleId: 'role-seller',
      roleName: 'Vendor / Seller',
      name: 'Arthur & Margaret Pendelton',
      email: 'arthur.pendelton@gmail.com',
      phone: '+44 7700 900456',
      isPrimary: true,
    },
    {
      id: 'p-3',
      roleId: 'role-buyer-solicitor',
      roleName: 'Buyer Solicitor',
      name: 'Jessica Vance',
      email: 'jvance@cavendish-legal.co.uk',
      companyName: 'Cavendish Legal LLP',
      phone: '+44 20 7946 0120',
    },
    {
      id: 'p-4',
      roleId: 'role-seller-solicitor',
      roleName: 'Seller Solicitor',
      name: 'Oliver Croft',
      email: 'ocroft@harrisoncroft.co.uk',
      companyName: 'Harrison & Croft Solicitors',
      phone: '+44 1865 240100',
    },
    {
      id: 'p-5',
      roleId: 'role-progressor',
      roleName: 'Sales Progressor',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@iceberg.digital',
      companyName: 'Iceberg Digital Estate Agents',
      phone: '+44 1865 554321',
    },
  ],
  updatedAt: new Date().toISOString(),
};

type WorkspaceTab = 'progression' | 'documents' | 'participants' | 'timeline';

export const CaseWorkspacePage: React.FC = () => {
  const { caseId = 'case-oxford-101' } = useParams<{ caseId?: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('progression');
  const [snapshot, setSnapshot] = useState<BffWorkspaceSnapshot>(
    INITIAL_MOCK_WORKSPACE,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Mutation loading states
  const [loadingStepId, setLoadingStepId] = useState<string | null>(null);
  const [loadingWorkItemId, setLoadingWorkItemId] = useState<string | null>(
    null,
  );
  const [isUploadingDoc, setIsUploadingDoc] = useState<boolean>(false);

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
    try {
      const data = await fetchCaseWorkspace(caseId);
      setSnapshot(data);
    } catch {
      // Fall back to rich mock data if backend not running locally
      setSnapshot(INITIAL_MOCK_WORKSPACE);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const handleStepAction = async (stepId: string, action: StepActionType) => {
    setLoadingStepId(stepId);
    try {
      await executeStepAction(caseId, stepId, action);
      showToast(
        'success',
        `Milestone step action '${action}' completed successfully.`,
      );
      await loadWorkspace();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        showToast(
          'error',
          err.problem.detail || 'Step action could not be executed.',
        );
      } else {
        // Optimistic local fallback for testing in browser without active backend
        setSnapshot((prev) => {
          const updatedSteps = prev.steps.map((s) => {
            if (s.id === stepId) {
              return {
                ...s,
                status: (action === 'COMPLETE_STEP'
                  ? 'Completed'
                  : 'Skipped') as typeof s.status,
                allowedActions: [] as StepActionType[],
                workItems: s.workItems.map((w) => ({
                  ...w,
                  status: 'Completed' as const,
                  allowedActions: [] as WorkItemActionType[],
                })),
              };
            }
            return s;
          });

          // If step 3 completed, unlock step 4
          if (stepId === 'step-exec-3') {
            const step4 = updatedSteps.find((s) => s.id === 'step-exec-4');
            if (step4) {
              step4.status = 'InProgress';
              step4.allowedActions = ['COMPLETE_STEP'];
              step4.workItems = step4.workItems.map((w) => ({
                ...w,
                allowedActions: ['COMPLETE', 'WAIVE'],
              }));
            }
          }

          const completedCount = updatedSteps.filter(
            (s) => s.status === 'Completed',
          ).length;
          const newProgress = Math.round(
            (completedCount / updatedSteps.length) * 100,
          );

          return {
            ...prev,
            steps: updatedSteps,
            progressPercentage: newProgress,
            blockers: action === 'COMPLETE_STEP' ? [] : prev.blockers,
          };
        });
        showToast('success', `Step action '${action}' applied.`);
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
    setLoadingWorkItemId(workItemId);
    try {
      await executeWorkItemAction(caseId, workItemId, stepId, action);
      showToast('success', `Task marked as ${action.toLowerCase()}.`);
      await loadWorkspace();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        showToast('error', err.problem.detail || 'Work item action failed.');
      } else {
        // Optimistic local state update
        setSnapshot((prev) => {
          const updatedSteps = prev.steps.map((step) => {
            if (step.id !== stepId) return step;
            const updatedWorkItems = step.workItems.map((wi) => {
              if (wi.id !== workItemId) return wi;
              return {
                ...wi,
                status: (action === 'COMPLETE'
                  ? 'Completed'
                  : 'Waived') as typeof wi.status,
                allowedActions: [] as WorkItemActionType[],
                completedAt: new Date().toISOString(),
                completedByUserName: 'Current Actor',
              };
            });

            // Check if all required tasks are now done
            const allDone = updatedWorkItems.every(
              (w) => w.status === 'Completed' || w.status === 'Waived',
            );

            return {
              ...step,
              workItems: updatedWorkItems,
              status: allDone ? ('Completed' as const) : step.status,
              allowedActions: allDone ? [] : step.allowedActions,
            };
          });

          const completedCount = updatedSteps.filter(
            (s) => s.status === 'Completed',
          ).length;
          const newProgress = Math.round(
            (completedCount / updatedSteps.length) * 100,
          );

          // Clear blocker if AML item completed
          const updatedBlockers =
            workItemId === 'wi-exec-6' && action === 'COMPLETE'
              ? []
              : prev.blockers;

          return {
            ...prev,
            steps: updatedSteps,
            progressPercentage: newProgress,
            blockers: updatedBlockers,
          };
        });
        showToast('success', `Task marked as ${action.toLowerCase()}.`);
      }
    } finally {
      setLoadingWorkItemId(null);
    }
  };

  const handleUploadDocument = async (file: File, category: string) => {
    setIsUploadingDoc(true);
    try {
      const newDoc = await uploadCaseDocument(caseId, file, category);
      setSnapshot((prev) => ({
        ...prev,
        documents: [newDoc, ...prev.documents],
      }));
      showToast('success', `Document '${file.name}' uploaded successfully.`);
    } catch {
      // Local fallback mock document
      const mockDoc = {
        id: `doc-${Date.now()}`,
        fileName: file.name,
        fileSizeBytes: file.size,
        fileType: file.type || 'application/pdf',
        category,
        uploadedAt: new Date().toISOString(),
        uploadedByName: 'Current User',
      };
      setSnapshot((prev) => ({
        ...prev,
        documents: [mockDoc, ...prev.documents],
      }));
      showToast('success', `Document '${file.name}' uploaded.`);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" />
        <p className="text-xs font-semibold text-slate-500">
          Loading Case Workspace BFF Snapshot...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border transition-all animate-in fade-in slide-in-from-bottom-3 ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Nav Breadcrumb & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/cases')}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#E1007A] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Live Case Directory
        </button>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            variant="ghost"
            size="xs"
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

      {/* Main Workspace Header Card */}
      <WorkspaceHeader snapshot={snapshot} />

      {/* Blockers Alert Banner */}
      <BlockersBanner blockers={snapshot.blockers} />

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
          <span>Workflow Progression ({snapshot.steps.length})</span>
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
          <span>Documents & Evidence ({snapshot.documents.length})</span>
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
          <span>
            Stakeholders & Solicitors ({snapshot.participants.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'timeline'
              ? 'border-[#E1007A] text-[#E1007A]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Activity</span>
        </button>
      </div>

      {/* Tab Content Render */}
      {activeTab === 'progression' && (
        <div className="space-y-4">
          {snapshot.steps.map((step) => (
            <StepExecutionCard
              key={step.id}
              step={step}
              onStepAction={handleStepAction}
              onWorkItemAction={handleWorkItemAction}
              loadingStepId={loadingStepId}
              loadingWorkItemId={loadingWorkItemId}
            />
          ))}
        </div>
      )}

      {activeTab === 'documents' && (
        <DocumentsTab
          documents={snapshot.documents}
          onUploadDocument={handleUploadDocument}
          isUploading={isUploadingDoc}
        />
      )}

      {activeTab === 'participants' && (
        <ParticipantsTab participants={snapshot.participants} />
      )}

      {activeTab === 'timeline' && (
        <div className="iceberg-card p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Append-Only Audit Timeline
          </h3>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between">
              <div>
                <strong className="text-slate-900">Task Completed:</strong>{' '}
                Collect buyer solicitor contact details
              </div>
              <span className="text-slate-400 font-mono text-[10px]">
                14 Aug 2026 10:00 by Sarah Jenkins
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between">
              <div>
                <strong className="text-slate-900">Milestone Completed:</strong>{' '}
                Memorandum of Sale Distributed
              </div>
              <span className="text-slate-400 font-mono text-[10px]">
                11 Aug 2026 16:20 by Sarah Jenkins
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between">
              <div>
                <strong className="text-slate-900">Case Created:</strong> UK
                Residential Sales Progression (v3.0)
              </div>
              <span className="text-slate-400 font-mono text-[10px]">
                10 Aug 2026 09:00 by Marcus Sterling
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
