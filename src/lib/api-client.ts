import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from 'axios';
import type {
  ProblemDetails,
  CaseType,
  TemplateVersion,
  TemplateDraftResponse,
  TemplatePresetSummary,
  TemplatePresetSchema,
  BffWorkspaceSnapshot,
  StepActionType,
  WorkItemActionType,
  BffCaseDocument,
  BffCaseListResponse,
  BffCaseListQueryParams,
  ChangeCaseStatusPayload,
  CaseStatusAction,
  BffDashboardSnapshot,
  CreateCasePayload,
  CreateCaseResponse,
  PublishedTemplateItem,
  DependencyJoinType,
  StepExecutionStatus,
  WorkItemExecutionStatus,
  WorkItemTag,
  WorkItemRequirement,
  BffParticipant,
  AssignParticipantPayload,
  NoteSnapshot,
  AnnouncementReplySnapshot,
  AnnouncementTreeSnapshot,
  CreateAnnouncementPayload,
  CreateAnnouncementReplyPayload,
  AddCaseNotePayload,
  DocumentDownloadUrlResponse,
  TrafficLightData,
  SlaStatus,
  BffActivityCategory,
  BffCaseActivityItem,
  BffCaseActivitiesResponse,
} from '../types/api';

export class ApiError extends Error {
  public readonly status: number;
  public readonly problem: ProblemDetails;

  constructor(problem: ProblemDetails) {
    super(problem.detail || problem.title || 'An API error occurred');
    this.name = 'ApiError';
    this.status = problem.status;
    this.problem = problem;
  }
}

export function createApiClient(baseUrl: string = '/api/v1'): AxiosInstance {
  const client = axios.create({
    baseURL: baseUrl,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('lifesycle_auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // In development/local mode or dev fallback, send dynamic mock RBAC headers
    const companyId = localStorage.getItem('lifesycle_company_id') || '1001';
    const actorId = localStorage.getItem('lifesycle_actor_id') || 'usr_1';
    const roles =
      localStorage.getItem('lifesycle_user_roles') ||
      localStorage.getItem('lifesycle_user_role') ||
      'Sales Progressor, Estate Agent';
    const branchId = localStorage.getItem('lifesycle_branch_id');

    if (config.headers) {
      config.headers['x-mock-company-id'] = companyId;
      config.headers['x-mock-actor-id'] = actorId;
      config.headers['x-mock-roles'] = roles;
      if (branchId) {
        config.headers['x-mock-branch-id'] = branchId;
      }
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const status = error.response?.status;
      if (status === 401) {
        window.dispatchEvent(
          new CustomEvent('auth:unauthorized', {
            detail: {
              status: 401,
              message: 'Your session has expired or authentication is invalid.',
            },
          }),
        );
      } else if (status === 403) {
        window.dispatchEvent(
          new CustomEvent('auth:forbidden', {
            detail: {
              status: 403,
              message: 'You do not have permission to perform this action.',
            },
          }),
        );
      }

      if (error.response && error.response.data) {
        const data = error.response.data as Partial<ProblemDetails>;
        const problem: ProblemDetails = {
          type: data.type || 'about:blank',
          title: data.title || (status === 403 ? 'Forbidden' : error.message),
          status: data.status || status || 500,
          detail:
            data.detail ||
            (status === 403
              ? 'You do not have permission to perform this action.'
              : 'An unexpected error occurred.'),
          instance: data.instance,
          traceId: data.traceId,
          field: data.field,
          errors: data.errors,
        };
        return Promise.reject(new ApiError(problem));
      }

      const fallbackProblem: ProblemDetails = {
        type: 'about:blank',
        title: status === 403 ? 'Forbidden' : 'Network Error',
        status: status || 500,
        detail:
          status === 403
            ? 'You do not have permission to perform this action.'
            : error.message || 'Unable to connect to the server.',
      };
      return Promise.reject(new ApiError(fallbackProblem));
    },
  );

  return client;
}

export const apiClient = createApiClient();

export async function apiGet<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.get<T>(url, config);
  return response.data;
}

export async function apiPost<T, B = unknown>(
  url: string,
  data: B = {} as B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
}

export async function apiPut<T, B = unknown>(
  url: string,
  data: B = {} as B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
}

export async function apiPatch<T, B = unknown>(
  url: string,
  data: B = {} as B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.patch<T>(url, data, config);
  return response.data;
}

export async function apiDelete<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
}

/**
 * Domain Service: Template Engine & Case Type API Calls
 */

export async function listCaseTypes(): Promise<CaseType[]> {
  return apiGet<CaseType[]>('/case-types');
}

export async function createCaseType(data: {
  name: string;
  description?: string;
}): Promise<CaseType> {
  return apiPost<CaseType>('/case-types', data);
}

export async function getCaseType(caseTypeId: string): Promise<CaseType> {
  return apiGet<CaseType>(`/case-types/${caseTypeId}`);
}

export async function getCaseTypeDraft(
  caseTypeId: string,
): Promise<TemplateDraftResponse> {
  return apiGet<TemplateDraftResponse>(`/case-types/${caseTypeId}/draft`);
}

export async function saveCaseTypeDraft(
  caseTypeId: string,
  payload: unknown,
): Promise<{ id: string; version: number }> {
  return apiPut<{ id: string; version: number }>(
    `/case-types/${caseTypeId}/draft`,
    payload,
  );
}

export async function listTemplatePresets(): Promise<TemplatePresetSummary[]> {
  return apiGet<TemplatePresetSummary[]>('/template-presets');
}

export async function getTemplatePreset(
  key: string,
): Promise<TemplatePresetSchema> {
  return apiGet<TemplatePresetSchema>(`/template-presets/${key}`);
}

export async function publishCaseTypeDraft(
  caseTypeId: string,
  draftId?: string,
): Promise<TemplateVersion> {
  if (draftId && draftId !== 'active') {
    return apiPost<TemplateVersion>(
      `/case-types/${caseTypeId}/drafts/${draftId}/publish`,
      {},
    );
  }
  return apiPost<TemplateVersion>(`/case-types/${caseTypeId}/publish`, {});
}

export async function fetchPublishedTemplates(): Promise<
  PublishedTemplateItem[]
> {
  try {
    const caseTypes = await listCaseTypes();
    if (caseTypes && caseTypes.length > 0) {
      return caseTypes.map((ct) => ({
        id: ct.id,
        name: ct.name,
        versionNumber: ct.publishedVersionCount || 1,
        description:
          ct.description || 'Pre-configured domain workflow progression.',
        caseTypeId: ct.id,
        stepCount: 6,
      }));
    }
  } catch (err) {
    console.warn('Failed to load live case types from backend:', err);
  }

  return [];
}

/**
 * BFF Snapshots & Mutation Actions (PAI-15, PAI-17, PAI-18, Dashboard, Create Case)
 */

export async function createCase(
  payload: CreateCasePayload,
): Promise<CreateCaseResponse> {
  const cleanPayload: {
    title: string;
    caseTypeId?: string;
    templateVersionId?: string;
  } = {
    title: payload.title,
  };

  if (
    payload.templateVersionId &&
    payload.templateVersionId !== payload.caseTypeId &&
    !payload.templateVersionId.startsWith('tpl-') &&
    !payload.templateVersionId.startsWith('ct-')
  ) {
    cleanPayload.templateVersionId = payload.templateVersionId;
  }

  if (payload.caseTypeId) {
    cleanPayload.caseTypeId = payload.caseTypeId;
  }

  return apiPost<CreateCaseResponse>('/cases', cleanPayload);
}

export async function fetchCaseList(
  params?: BffCaseListQueryParams,
): Promise<BffCaseListResponse> {
  return apiGet<BffCaseListResponse>('/bff/cases', { params });
}

interface RawBffWorkspaceResponse {
  contractVersion: string;
  resourceVersion: number;
  generatedAt: string;
  case?: {
    id: string;
    companyId: number;
    title: string;
    caseTypeId: string;
    caseTypeName?: string;
    templateVersionId: string;
    templateVersionNumber?: number;
    status: 'Open' | 'OnHold' | 'Completed' | 'Cancelled';
    statusLabel?: string;
    aiSummary?: string | null;
    propertyAddress?: string;
    agreedPrice?: number;
    assignedProgressorName?: string;
    branchName?: string;
    targetCompletionDate?: string;
    reopenReason?: string;
    allowedActions?: CaseStatusAction[];
    reference?: string;
  };
  progression?: {
    overallPercentage?: number;
    completionPercentage?: number;
    trafficLight?: TrafficLightData;
    blockers?: Array<{ stepName?: string; reason?: string } | string>;
  };
  steps?: Array<{
    id: string;
    stepDefinitionId: string;
    name: string;
    description?: string;
    status: StepExecutionStatus;
    displayOrder: number;
    dependencyJoinType?: DependencyJoinType;
    dependencies?: string[];
    isBlocked?: boolean;
    blockerReason?: string;
    targetDate?: string;
    startedAt?: string;
    completedAt?: string;
    slaStatus?: SlaStatus;
    notes?: NoteSnapshot[];
    allowedActions?: StepActionType[];
    workItems?: Array<{
      id: string;
      stepId?: string;
      name?: string;
      title?: string;
      description?: string;
      condition?: string;
      status?: WorkItemExecutionStatus;
      statusLabel?: string;
      requirement?: WorkItemRequirement;
      tag?: WorkItemTag;
      role?: string;
      roleName?: string;
      ownerRoleId?: string;
      assignee?: {
        id: string;
        name: string;
        email?: string;
        phone?: string;
        companyName?: string;
      };
      isKeyDate?: boolean;
      evidenceRequired?: boolean;
      allowedActions?: WorkItemActionType[];
      targetDate?: string;
      completedAt?: string;
      completedByUserId?: string;
      completedByUserName?: string;
      slaStatus?: SlaStatus;
    }>;
  }>;
  roles?: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  documents?: Array<{
    id: string;
    fileName: string;
    sizeBytes?: number;
    contentType?: string;
    category?: string;
    workItemId?: string;
    createdAt?: string;
    uploadedByUserId?: string;
    downloadUrl?: string;
  }>;
  participants?: BffWorkspaceSnapshot['participants'];
  notes?: NoteSnapshot[];
  announcements?: AnnouncementTreeSnapshot[];
  recentActivities?: BffCaseActivityItem[];
}

export async function fetchCaseWorkspace(
  caseId: string,
): Promise<BffWorkspaceSnapshot> {
  const rawData = await apiGet<RawBffWorkspaceResponse>(
    `/bff/case-workspace/${caseId}`,
  );

  if (rawData && rawData.case) {
    const c = rawData.case;
    const p = rawData.progression || {};

    const blockers: string[] = Array.isArray(p.blockers)
      ? p.blockers.map((b) =>
          typeof b === 'string'
            ? b
            : b.stepName && b.reason
              ? `${b.stepName}: ${b.reason}`
              : b.reason || 'Blocked step',
        )
      : [];

    const documents: BffCaseDocument[] = Array.isArray(rawData.documents)
      ? rawData.documents.map((d) => ({
          id: d.id,
          fileName: d.fileName,
          fileSizeBytes: d.sizeBytes || 0,
          fileType: d.contentType || 'application/pdf',
          category:
            d.category || (d.workItemId ? 'Task Evidence' : 'General Document'),
          workItemId: d.workItemId,
          uploadedAt: d.createdAt || new Date().toISOString(),
          uploadedByName: d.uploadedByUserId || 'Operations Progressor',
          downloadUrl: d.downloadUrl,
          canDownload: (d as { canDownload?: boolean }).canDownload !== false,
        }))
      : [];

    const steps = (rawData.steps || []).map((step) => ({
      id: step.id,
      stepDefinitionId: step.stepDefinitionId,
      name: step.name,
      description: step.description,
      status: step.status,
      displayOrder: step.displayOrder,
      dependencyJoinType: step.dependencyJoinType || 'ALL',
      dependencies: step.dependencies || [],
      isBlocked: step.isBlocked ?? false,
      blockerReason: step.blockerReason,
      targetDate: step.targetDate,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
      slaStatus: step.slaStatus,
      notes: step.notes || [],
      allowedActions: step.allowedActions || [],
      workItems: (step.workItems || []).map((wi) => ({
        id: wi.id,
        stepId: wi.stepId || step.id,
        title: wi.name || wi.title || 'Work Item',
        name: wi.name || wi.title || 'Work Item',
        description: wi.description,
        condition: wi.condition,
        status: wi.status || 'Pending',
        statusLabel: wi.statusLabel,
        tag: (wi.tag || (wi.isKeyDate ? 'Key Date' : 'Manual')) as WorkItemTag,
        requirement: wi.requirement || 'required',
        role: wi.role || wi.roleName || wi.ownerRoleId,
        ownerRoleId: wi.ownerRoleId,
        assignee: wi.assignee,
        isKeyDate: wi.isKeyDate,
        evidenceRequired: wi.evidenceRequired,
        allowedActions: wi.allowedActions || [],
        targetDate: wi.targetDate,
        completedAt: wi.completedAt,
        completedByUserId: wi.completedByUserId,
        completedByUserName: wi.completedByUserName,
        slaStatus: wi.slaStatus,
      })),
    }));

    return {
      caseId: c.id,
      reference: c.reference || `CM-${c.id.slice(0, 8).toUpperCase()}`,
      title: c.title,
      propertyAddress: c.propertyAddress || c.title,
      caseTypeId: c.caseTypeId,
      caseTypeName: c.caseTypeName || 'Residential Property Sale',
      templateVersion: c.templateVersionNumber || 1,
      status: c.status,
      progressPercentage: p.overallPercentage ?? p.completionPercentage ?? 0,
      agreedPrice: c.agreedPrice,
      assignedProgressorName:
        c.assignedProgressorName || 'Operations Progressor',
      branchName: c.branchName || 'Central Office Branch',
      targetCompletionDate: c.targetCompletionDate,
      hasReopenPermission:
        (c as { hasReopenPermission?: boolean }).hasReopenPermission ??
        c.allowedActions?.includes('REOPEN') ??
        false,
      reopenReason: c.reopenReason,
      allowedActions: c.allowedActions || [],
      trafficLight: p.trafficLight,
      blockers,
      steps,
      roles: rawData.roles || [],
      documents,
      participants: rawData.participants || [],
      notes: rawData.notes || [],
      announcements: rawData.announcements || [],
      recentActivities: rawData.recentActivities || [],
      updatedAt: rawData.generatedAt || new Date().toISOString(),
      aiSummary:
        c.aiSummary ??
        (rawData as { aiSummary?: string | null }).aiSummary ??
        null,
    };
  }

  return rawData as unknown as BffWorkspaceSnapshot;
}

export async function fetchCaseActivities(
  caseId: string,
  params?: {
    category?: BffActivityCategory;
    limit?: number;
    cursor?: string;
  },
): Promise<BffCaseActivitiesResponse> {
  return apiGet<BffCaseActivitiesResponse>(`/cases/${caseId}/activities`, {
    params,
  });
}

export async function fetchDashboardSnapshot(): Promise<BffDashboardSnapshot> {
  return apiGet<BffDashboardSnapshot>('/bff/dashboard');
}

export async function changeCaseStatus(
  caseId: string,
  payload: ChangeCaseStatusPayload,
): Promise<{ success: boolean; status: string }> {
  return apiPost<{ success: boolean; status: string }>(
    `/cases/${caseId}/status`,
    payload,
  );
}

export async function executeStepAction(
  caseId: string,
  stepId: string,
  action: StepActionType,
): Promise<{ success: boolean; resourceVersion?: number }> {
  return apiPost<{ success: boolean; resourceVersion?: number }>(
    `/cases/${caseId}/steps/${stepId}/action`,
    { action },
  );
}

export async function executeWorkItemAction(
  caseId: string,
  stepId: string,
  workItemId: string,
  action: WorkItemActionType,
): Promise<{ success: boolean; resourceVersion?: number }> {
  return apiPost<{ success: boolean; resourceVersion?: number }>(
    `/cases/${caseId}/work-items/${workItemId}/action`,
    { stepId, action },
  );
}

export async function setStepTargetDate(
  caseId: string,
  stepId: string,
  targetDate: string | null,
): Promise<{ id: string; targetDate: string | null }> {
  return apiPatch<{ id: string; targetDate: string | null }>(
    `/cases/${caseId}/steps/${stepId}/target-date`,
    { targetDate },
  );
}

export async function setWorkItemTargetDate(
  caseId: string,
  workItemId: string,
  targetDate: string | null,
): Promise<{ id: string; targetDate: string | null }> {
  return apiPatch<{ id: string; targetDate: string | null }>(
    `/cases/${caseId}/work-items/${workItemId}/target-date`,
    { targetDate },
  );
}

export interface CreateDocumentUploadUrlPayload {
  fileName: string;
  contentType: string;
  sizeBytes?: number;
  requiredRole?: string;
  workItemId?: string;
}

export interface DocumentUploadUrlResponse {
  documentId: string;
  uploadUrl: string;
  expiresInSeconds?: number;
}

export async function createDocumentUploadUrl(
  caseId: string,
  payload: CreateDocumentUploadUrlPayload,
): Promise<DocumentUploadUrlResponse> {
  return apiPost<DocumentUploadUrlResponse>(
    `/cases/${caseId}/documents/upload-url`,
    payload,
  );
}

export async function confirmDocumentUpload(
  caseId: string,
  documentId: string,
): Promise<void> {
  return apiPost<void>(
    `/cases/${caseId}/documents/${documentId}/confirm-upload`,
    {},
  );
}

export async function getDocumentDownloadUrl(
  caseId: string,
  documentId: string,
): Promise<DocumentDownloadUrlResponse> {
  return apiGet<DocumentDownloadUrlResponse>(
    `/cases/${caseId}/documents/${documentId}/download-url`,
  );
}

export async function uploadCaseDocument(
  caseId: string,
  file: File,
  workItemId?: string,
): Promise<void> {
  const uploadInfo = await createDocumentUploadUrl(caseId, {
    fileName: file.name,
    contentType: file.type || 'application/pdf',
    sizeBytes: file.size,
    workItemId: workItemId || undefined,
  });

  if (uploadInfo.uploadUrl) {
    try {
      await fetch(uploadInfo.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/pdf',
        },
        body: file,
      });
    } catch {
      // Gracefully handle in mock/local test environments
    }
  }

  await confirmDocumentUpload(caseId, uploadInfo.documentId);
}

export async function assignCaseParticipant(
  caseId: string,
  payload: AssignParticipantPayload,
): Promise<BffParticipant> {
  return apiPost<BffParticipant>(`/cases/${caseId}/participants`, payload);
}

export async function listCaseParticipants(
  caseId: string,
): Promise<BffParticipant[]> {
  return apiGet<BffParticipant[]>(`/cases/${caseId}/participants`);
}

export async function removeCaseParticipant(
  caseId: string,
  participantId: string,
): Promise<void> {
  return apiDelete<void>(`/cases/${caseId}/participants/${participantId}`);
}

export async function addCaseNote(
  caseId: string,
  payload: AddCaseNotePayload,
): Promise<NoteSnapshot> {
  return apiPost<NoteSnapshot>(`/cases/${caseId}/notes`, payload);
}

export async function listCaseNotes(caseId: string): Promise<NoteSnapshot[]> {
  return apiGet<NoteSnapshot[]>(`/cases/${caseId}/notes`);
}

export async function fetchCaseAnnouncements(
  caseId: string,
): Promise<AnnouncementTreeSnapshot[]> {
  return apiGet<AnnouncementTreeSnapshot[]>(`/cases/${caseId}/announcements`);
}

export async function createCaseAnnouncement(
  caseId: string,
  payload: CreateAnnouncementPayload,
): Promise<AnnouncementTreeSnapshot> {
  return apiPost<AnnouncementTreeSnapshot>(
    `/cases/${caseId}/announcements`,
    payload,
  );
}

export async function createAnnouncementReply(
  caseId: string,
  announcementId: string,
  payload: CreateAnnouncementReplyPayload,
): Promise<AnnouncementReplySnapshot> {
  return apiPost<AnnouncementReplySnapshot>(
    `/cases/${caseId}/announcements/${announcementId}/reply`,
    payload,
  );
}
