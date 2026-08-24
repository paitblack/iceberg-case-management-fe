import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import {
  TemplateBuilderProvider,
  useTemplateBuilder,
} from './context/TemplateBuilderContext';
import * as apiClient from '../../lib/api-client';

describe('TemplateBuilderContext & State Management', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(apiClient, 'listCaseTypes').mockResolvedValue([]);
    vi.spyOn(apiClient, 'listTemplatePresets').mockResolvedValue([
      {
        key: 'sales',
        name: 'UK Residential Sales Progression',
        category: 'Sales Progression',
        description: 'Standard sales flow',
        stepCount: 6,
        roleCount: 7,
      },
    ]);
    vi.spyOn(apiClient, 'saveCaseTypeDraft').mockResolvedValue({
      id: 'test-case-type-101',
      version: 1,
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TemplateBuilderProvider initialCaseTypeId="test-case-type-101">
      {children}
    </TemplateBuilderProvider>
  );

  it('initializes with default sales progression steps and auto-computed edges', async () => {
    const { result } = renderHook(() => useTemplateBuilder(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoadingCaseTypes).toBe(false);
    });

    expect(result.current.caseTypeId).toBe('test-case-type-101');
    expect(result.current.steps.length).toBeGreaterThan(0);
    expect(result.current.edges.length).toBeGreaterThan(0);
    expect(result.current.name).toContain('Sales');
    expect(result.current.roles.length).toBeGreaterThan(0);
  });

  it('adds a new step and re-indexes displayOrder correctly', async () => {
    const { result } = renderHook(() => useTemplateBuilder(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoadingCaseTypes).toBe(false);
    });

    const initialCount = result.current.steps.length;

    act(() => {
      result.current.addStep({
        name: 'Custom Conveyancing Review Step',
        completionRule: { type: 'manual' },
      });
    });

    expect(result.current.steps.length).toBe(initialCount + 1);
    const addedStep = result.current.steps[result.current.steps.length - 1];
    expect(addedStep.name).toBe('Custom Conveyancing Review Step');
    expect(addedStep.displayOrder).toBe(initialCount + 1);
    expect(addedStep.completionRule.type).toBe('manual');
  });

  it('adds and updates work items within a step', async () => {
    const { result } = renderHook(() => useTemplateBuilder(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoadingCaseTypes).toBe(false);
    });

    const firstStep = result.current.steps[0];
    const initialWiCount = firstStep.workItems.length;

    act(() => {
      result.current.addWorkItem(firstStep.id, {
        name: 'Upload identity document proof',
        ownerRoleId: 'role-estate-agent',
        requiredRole: 'role-estate-agent',
        requirement: 'required',
        isKeyDate: true,
      });
    });

    const updatedFirstStep = result.current.steps.find(
      (s) => s.id === firstStep.id,
    );
    expect(updatedFirstStep?.workItems.length).toBe(initialWiCount + 1);
    const addedWi =
      updatedFirstStep?.workItems[updatedFirstStep.workItems.length - 1];
    expect(addedWi?.name).toBe('Upload identity document proof');
    expect(addedWi?.ownerRoleId).toBe('role-estate-agent');
    expect(addedWi?.isKeyDate).toBe(true);
  });

  it('allows adding and removing custom roles dynamically', async () => {
    const { result } = renderHook(() => useTemplateBuilder(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoadingCaseTypes).toBe(false);
    });

    const initialRoleCount = result.current.roles.length;

    let createdRole = { id: '', name: '' };
    act(() => {
      createdRole = result.current.addRole({
        name: 'Structural Engineer',
        description: 'Performs specialist structural inspections',
      });
    });

    expect(result.current.roles.length).toBe(initialRoleCount + 1);
    expect(createdRole.id).toContain('structural-engineer');
    expect(
      result.current.roles.some((r) => r.name === 'Structural Engineer'),
    ).toBe(true);

    // Remove the custom role
    act(() => {
      result.current.removeRole(createdRole.id);
    });

    expect(result.current.roles.length).toBe(initialRoleCount);
  });

  it('loads dynamic preset from backend endpoint', async () => {
    vi.spyOn(apiClient, 'getTemplatePreset').mockResolvedValue({
      key: 'commercial',
      name: 'Commercial Property Acquisition',
      category: 'Commercial',
      description: 'Commercial lease and acquisition workflow',
      roles: [
        {
          id: 'role-comm-agent',
          name: 'Commercial Agent',
          description: 'Commercial representative',
        },
      ],
      steps: [
        {
          id: 'step-c-1',
          name: 'Heads of Terms',
          description: 'Agree lease terms',
          displayOrder: 1,
          ownerRoleId: 'role-comm-agent',
          completionRule: { type: 'all-required-work-items' },
          dependencyJoinType: 'ALL',
        },
      ],
      workItems: [
        {
          id: 'wi-c-1',
          stepId: 'step-c-1',
          name: 'Sign Heads of Terms',
          requirement: 'required',
          evidenceRequired: true,
          ownerRoleId: 'role-comm-agent',
        },
      ],
      edges: [],
      customFields: [],
    });

    const { result } = renderHook(() => useTemplateBuilder(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoadingCaseTypes).toBe(false);
    });

    await act(async () => {
      await result.current.loadPreset('commercial');
    });

    expect(result.current.name).toBe('Commercial Property Acquisition');
    expect(result.current.category).toBe('Commercial');
    expect(result.current.roles.some((r) => r.id === 'role-comm-agent')).toBe(
      true,
    );
    expect(result.current.steps).toHaveLength(1);
    expect(result.current.steps[0].workItems).toHaveLength(1);
  });

  it('updates dependencies and computes edges matching backend contract', async () => {
    const { result } = renderHook(() => useTemplateBuilder(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoadingCaseTypes).toBe(false);
    });

    const step1 = result.current.steps[0];
    const step2 = result.current.steps[1];

    await act(async () => {
      result.current.setStepDependencies(step2.id, [step1.id]);
    });

    const hasEdge = result.current.edges.some(
      (e) => e.fromStepId === step1.id && e.toStepId === step2.id,
    );
    expect(hasEdge).toBe(true);

    const payload = result.current.toBackendDraftPayload();
    expect(payload.steps).toBeDefined();
    expect(payload.edges).toBeDefined();
    expect(
      payload.edges.some(
        (e) => e.fromStepId === step1.id && e.toStepId === step2.id,
      ),
    ).toBe(true);
  });

  it('validates that conditional work items must have a condition rule before saving', async () => {
    const { result } = renderHook(() => useTemplateBuilder(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoadingCaseTypes).toBe(false);
    });

    const firstStep = result.current.steps[0];

    // Add a conditional work item without a condition
    act(() => {
      result.current.addWorkItem(firstStep.id, {
        name: 'Chase Mortgage Offer',
        requirement: 'conditional',
        condition: '',
        description: 'Formal bank mortgage offer letter must be uploaded.',
      });
    });

    // Attempting to save should fail validation
    await act(async () => {
      await expect(result.current.saveDraft()).rejects.toThrow(
        /is set to Conditional, but no condition rule was specified/i,
      );
    });

    // Provide the condition rule
    const addedWi = result.current.steps[0].workItems.find(
      (w) => w.name === 'Chase Mortgage Offer',
    );
    expect(addedWi).toBeDefined();

    act(() => {
      if (addedWi) {
        result.current.updateWorkItem(firstStep.id, addedWi.id, {
          condition: 'Only mandatory if the buyer is obtaining a mortgage loan',
          evidenceRequired: true,
        });
      }
    });

    // Now save should proceed and pass condition and description
    await act(async () => {
      await expect(result.current.saveDraft()).resolves.toBeDefined();
    });
  });

  it('includes standard role IDs in workItems and roles in backend payload', async () => {
    const { result } = renderHook(() => useTemplateBuilder(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoadingCaseTypes).toBe(false);
    });

    const payload = result.current.toBackendDraftPayload();
    expect(payload.roles).toBeDefined();
    expect(payload.roles?.some((r) => r.id === 'role-estate-agent')).toBe(true);

    const firstStep = payload.steps[0];
    const firstWi = firstStep.workItems[0];
    expect(firstWi.ownerRoleId).toBe('role-estate-agent');
  });
});
