import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import {
  TemplateBuilderProvider,
  useTemplateBuilder,
} from './context/TemplateBuilderContext';

describe('TemplateBuilderContext & State Management', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TemplateBuilderProvider initialCaseTypeId="test-case-type-101">
      {children}
    </TemplateBuilderProvider>
  );

  it('initializes with default sales progression steps and auto-computed edges', () => {
    const { result } = renderHook(() => useTemplateBuilder(), { wrapper });

    expect(result.current.caseTypeId).toBe('test-case-type-101');
    expect(result.current.steps.length).toBeGreaterThan(0);
    expect(result.current.edges.length).toBeGreaterThan(0);
    expect(result.current.name).toContain('Sales');
  });

  it('adds a new step and re-indexes displayOrder correctly', () => {
    const { result } = renderHook(() => useTemplateBuilder(), { wrapper });
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

  it('adds and updates work items within a step', () => {
    const { result } = renderHook(() => useTemplateBuilder(), { wrapper });
    const firstStep = result.current.steps[0];
    const initialWiCount = firstStep.workItems.length;

    act(() => {
      result.current.addWorkItem(firstStep.id, {
        name: 'Upload identity document proof',
        requiredRole: 'Compliance Officer',
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
    expect(addedWi?.requiredRole).toBe('Compliance Officer');
    expect(addedWi?.isKeyDate).toBe(true);
  });

  it('updates dependencies and computes edges matching backend contract', () => {
    const { result } = renderHook(() => useTemplateBuilder(), { wrapper });
    const step1 = result.current.steps[0];
    const step2 = result.current.steps[1];

    act(() => {
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

  it('generates the exact JSON payload expected by backend PUT /api/v1/case-types/:id/draft', () => {
    const { result } = renderHook(() => useTemplateBuilder(), { wrapper });
    const payload = result.current.toBackendDraftPayload();

    expect(Array.isArray(payload.steps)).toBe(true);
    expect(Array.isArray(payload.edges)).toBe(true);

    const firstStep = payload.steps[0];
    expect(firstStep).toHaveProperty('id');
    expect(firstStep).toHaveProperty('name');
    expect(firstStep).toHaveProperty('displayOrder');
    expect(firstStep).toHaveProperty('completionRule');
    expect(firstStep).toHaveProperty('dependencyJoinType');
    expect(firstStep).toHaveProperty('workItems');

    expect(typeof firstStep.completionRule.type).toBe('string');
    expect(['ALL', 'ANY']).toContain(firstStep.dependencyJoinType);
  });
});
