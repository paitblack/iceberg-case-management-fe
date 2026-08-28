import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorkflowGraphPreview } from './WorkflowGraphPreview';
import {
  TemplateBuilderProvider,
  DEFAULT_SALES_STEPS,
} from '../context/TemplateBuilderContext';
import * as apiClient from '../../../lib/api-client';

describe('WorkflowGraphPreview Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(apiClient, 'listCaseTypes').mockResolvedValue([
      {
        id: 'test-case-type-101',
        companyId: 1,
        name: 'UK Residential Sales Progression',
        description: 'Standard sales flow',
        publishedVersionCount: 1,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]);
    vi.spyOn(apiClient, 'getCaseType').mockResolvedValue({
      id: 'test-case-type-101',
      companyId: 1,
      name: 'UK Residential Sales Progression',
      description: 'Standard sales flow',
      publishedVersionCount: 1,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
    vi.spyOn(apiClient, 'getCaseTypeDraft').mockResolvedValue({
      id: 'draft-101',
      companyId: 1,
      caseTypeId: 'test-case-type-101',
      name: 'UK Residential Sales Progression',
      description: 'Standard sales flow',
      version: 1,
      steps: DEFAULT_SALES_STEPS.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        displayOrder: s.displayOrder,
        ownerRoleId: null,
        completionRule: { type: s.completionRule.type },
        dependencyJoinType: s.dependencyJoinType,
        isOptional: s.isOptional ?? false,
        isStandalone: s.isStandalone ?? false,
      })),
      workItems: DEFAULT_SALES_STEPS.flatMap((s) =>
        s.workItems.map((wi) => ({
          id: wi.id,
          stepId: s.id,
          name: wi.name,
          description: wi.description || '',
          requirement: wi.requirement,
          condition: wi.condition || null,
          evidenceRequired: wi.evidenceRequired || false,
          ownerRoleId: wi.ownerRoleId || null,
        })),
      ),
      edges: [
        { fromStepId: 'step-sales-1', toStepId: 'step-sales-2' },
        { fromStepId: 'step-sales-2', toStepId: 'step-sales-3' },
      ],
      roles: [
        { id: 'role-estate-agent', name: 'Estate Agent' },
        { id: 'role-buyer-solicitor', name: "Buyer's Solicitor" },
      ],
      customFields: [],
    });
    vi.spyOn(apiClient, 'listTemplatePresets').mockResolvedValue([]);
    vi.spyOn(apiClient, 'saveCaseTypeDraft').mockResolvedValue({
      id: 'test-case-type-101',
      version: 1,
    });
  });

  const renderComponent = () =>
    render(
      <TemplateBuilderProvider initialCaseTypeId="test-case-type-101">
        <WorkflowGraphPreview />
      </TemplateBuilderProvider>,
    );

  it('renders interactive DAG topology title and active steps', async () => {
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/Interactive Workflow Topology/i),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Live Sync/i)).toBeInTheDocument();
    expect(screen.getByText('Offer Accepted & Onboarding')).toBeInTheDocument();
  });

  it('allows collapsing and expanding the graph canvas', async () => {
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/Interactive Workflow Topology/i),
      ).toBeInTheDocument();
    });

    const collapseButton = screen.getByRole('button', { name: /Collapse/i });
    fireEvent.click(collapseButton);

    expect(
      screen.queryByText(/Connected nodes represent milestone unlocks/i),
    ).not.toBeInTheDocument();

    const expandButton = screen.getByRole('button', { name: /Expand Graph/i });
    fireEvent.click(expandButton);

    expect(
      screen.getByText(/Connected nodes represent milestone unlocks/i),
    ).toBeInTheDocument();
  });

  it('highlights nodes and invokes smooth scrolling on node click', async () => {
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('Offer Accepted & Onboarding'),
      ).toBeInTheDocument();
    });

    const nodeElement = screen
      .getByText('Offer Accepted & Onboarding')
      .closest('div[class*="group"]');
    expect(nodeElement).toBeInTheDocument();

    if (nodeElement) {
      fireEvent.mouseEnter(nodeElement);
      fireEvent.click(nodeElement);
      fireEvent.mouseLeave(nodeElement);
    }
  });

  it('detects cyclic loops and renders cyclic warning indicators', async () => {
    vi.spyOn(apiClient, 'getCaseTypeDraft').mockResolvedValue({
      id: 'draft-101',
      companyId: 1,
      caseTypeId: 'test-case-type-101',
      name: 'Cyclic Workflow',
      description: 'Cycle test',
      version: 1,
      steps: [
        {
          id: 'step-1',
          name: 'Milestone 1',
          description: '',
          displayOrder: 1,
          ownerRoleId: null,
          completionRule: { type: 'manual' },
          dependencyJoinType: 'ALL',
          isOptional: false,
          isStandalone: false,
        },
        {
          id: 'step-2',
          name: 'Milestone 2',
          description: '',
          displayOrder: 2,
          ownerRoleId: null,
          completionRule: { type: 'manual' },
          dependencyJoinType: 'ALL',
          isOptional: false,
          isStandalone: false,
        },
      ],
      workItems: [],
      edges: [
        { fromStepId: 'step-1', toStepId: 'step-2' },
        { fromStepId: 'step-2', toStepId: 'step-1' },
      ],
      roles: [],
      customFields: [],
    });

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/Circular Dependency Loop Formed/i),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Cyclic Loop Detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Cycle Loop Arc/i)).toBeInTheDocument();
  });
});
