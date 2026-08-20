import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from 'axios';
import type { ProblemDetails } from '../types/api';

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

export function createApiClient(baseUrl: string = '/api'): AxiosInstance {
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
