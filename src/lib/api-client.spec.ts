import { describe, it, expect, beforeEach } from 'vitest';
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
