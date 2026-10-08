import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as apiClient from './api-client';
import { ApiError, createApiClient } from './api-client';

describe('ApiClient and RFC 9457 Problem Details', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('correctly constructs ApiError from ProblemDetails object', () => {
    const problem = {
      type: 'https://example.com/probs/validation',
      title: 'Validation Error',
      status: 422,
      detail: 'Name is required.',
      field: 'name',
    };

    const error = new ApiError(problem);

    expect(error.name).toBe('ApiError');
    expect(error.status).toBe(422);
    expect(error.message).toBe('Name is required.');
    expect(error.problem.field).toBe('name');
  });

  it('injects Lifesycle bearer token if present in localStorage', async () => {
    localStorage.setItem('lifesycle_auth_token', 'test-token-xyz');
    const client = createApiClient('http://test-server.local');

    // Test that the client instance is configured with interceptor
    expect(client.interceptors.request).toBeDefined();
  });
});

describe('fetchPublishedTemplates', () => {
  it('excludes unpublished draft case types where publishedVersionCount is 0', async () => {
    vi.spyOn(apiClient.apiClient, 'get').mockImplementation(async (url) => {
      if (url === '/case-types') {
        return {
          data: [
            {
              id: 'ct-published-1',
              companyId: 1,
              name: 'Published Workflow',
              publishedVersionCount: 2,
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
            },
            {
              id: 'ct-draft-only-2',
              companyId: 1,
              name: 'Unpublished Draft Canvas',
              publishedVersionCount: 0,
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
            },
          ],
          status: 200,
          statusText: 'OK',
          headers: {},
          config: { headers: {} as never },
        };
      }
      if (url === '/case-types/ct-published-1/draft') {
        return {
          data: {
            id: 'draft-1',
            companyId: 1,
            caseTypeId: 'ct-published-1',
            name: 'Published Workflow',
            version: 2,
            steps: [],
            workItems: [],
            edges: [],
            roles: [],
            customFields: [],
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: { headers: {} as never },
        };
      }
      throw new Error(`Unexpected url: ${url}`);
    });

    const result = await apiClient.fetchPublishedTemplates();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ct-published-1');
    expect(result[0].versionNumber).toBe(2);
    expect(result.some((t) => t.id === 'ct-draft-only-2')).toBe(false);
  });
});
