import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from 'axios';
import type {
  ProblemDetails,
  CaseType,
  TemplateVersion,
  BffWorkspaceSnapshot,
  StepActionType,
  WorkItemActionType,
  BffCaseDocument,
  BffCaseListResponse,
  BffCaseListQueryParams,
  ChangeCaseStatusPayload,
  BffDashboardSnapshot,
  CreateCasePayload,
  CreateCaseResponse,
  PublishedTemplateItem,
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
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response && error.response.data) {
        const data = error.response.data as Partial<ProblemDetails>;
        const problem: ProblemDetails = {
          type: data.type || 'about:blank',
          title: data.title || error.message,
          status: data.status || error.response.status,
          detail: data.detail || 'An unexpected error occurred.',
          instance: data.instance,
          traceId: data.traceId,
          field: data.field,
          errors: data.errors,
        };
        return Promise.reject(new ApiError(problem));
      }

      const fallbackProblem: ProblemDetails = {
        type: 'about:blank',
        title: 'Network Error',
        status: error.status || 500,
        detail: error.message || 'Unable to connect to the server.',
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
  data?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
}

export async function apiPut<T, B = unknown>(
  url: string,
  data?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.put<T>(url, data, config);
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

export async function createCaseType(data: {
  name: string;
  description?: string;
}): Promise<CaseType> {
  return apiPost<CaseType>('/case-types', data);
}

export async function getCaseType(caseTypeId: string): Promise<CaseType> {
  return apiGet<CaseType>(`/case-types/${caseTypeId}`);
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

export async function publishCaseTypeDraft(
  caseTypeId: string,
  draftId: string,
): Promise<TemplateVersion> {
  return apiPost<TemplateVersion>(
    `/case-types/${caseTypeId}/drafts/${draftId}/publish`,
  );
}

export async function fetchPublishedTemplates(): Promise<
  PublishedTemplateItem[]
> {
  return apiGet<PublishedTemplateItem[]>('/templates');
}

/**
 * BFF Snapshots & Mutation Actions (PAI-15, PAI-17, PAI-18, Dashboard, Create Case)
 */

export async function createCase(
  payload: CreateCasePayload,
): Promise<CreateCaseResponse> {
  return apiPost<CreateCaseResponse>('/cases', payload);
}

export async function fetchCaseList(
  params?: BffCaseListQueryParams,
): Promise<BffCaseListResponse> {
  return apiGet<BffCaseListResponse>('/bff/cases', { params });
}

export async function fetchCaseWorkspace(
  caseId: string,
): Promise<BffWorkspaceSnapshot> {
  return apiGet<BffWorkspaceSnapshot>(`/bff/case-workspace/${caseId}`);
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
  workItemId: string,
  stepId: string,
  action: WorkItemActionType,
): Promise<{ success: boolean; resourceVersion?: number }> {
  return apiPost<{ success: boolean; resourceVersion?: number }>(
    `/cases/${caseId}/work-items/${workItemId}/action`,
    { stepId, action },
  );
}

export async function uploadCaseDocument(
  caseId: string,
  file: File,
  category: string,
): Promise<BffCaseDocument> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);

  const response = await apiClient.post<BffCaseDocument>(
    `/cases/${caseId}/documents`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response.data;
}
