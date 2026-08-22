import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { WorkspaceHeader } from './workspace/WorkspaceHeader';
import { BlockersBanner } from './workspace/BlockersBanner';
import { WorkItemExecutionRow } from './workspace/WorkItemExecutionRow';
import { StepExecutionCard } from './workspace/StepExecutionCard';
import { CaseWorkspacePage } from './CaseWorkspacePage';
import * as apiClient from '../../lib/api-client';
import type {
  BffWorkspaceSnapshot,
  BffWorkspaceStep,
  BffWorkspaceWorkItem,
} from '../../types/api';

const mockSnapshot: BffWorkspaceSnapshot = {
  caseId: 'case-test-101',
  reference: 'SP-2026-TEST',
  title: '10 Downing Street, London',
  propertyAddress: '10 Downing Street, London, SW1A 2AA',
  caseTypeId: 'ct-sales',
  caseTypeName: 'Residential Sales Progression',
  templateVersion: 2,
  status: 'Open',
  progressPercentage: 45,
  agreedPrice: 1500000,
  assignedProgressorName: 'Jane Progressor',
  branchName: 'Mayfair Branch',
  targetCompletionDate: '30 Oct 2026',
  blockers: ['Awaiting AML source of funds evidence from buyer solicitor.'],
  steps: [],
  documents: [],
  participants: [],
  updatedAt: '2026-08-20T10:00:00Z',
};

describe('Case Workspace Components', () => {
  it('renders WorkspaceHeader with title, price, and progress bar percentage', () => {
    render(<WorkspaceHeader snapshot={mockSnapshot} />);

    expect(screen.getByText('10 Downing Street, London')).toBeInTheDocument();
    expect(screen.getByText('SP-2026-TEST')).toBeInTheDocument();
    expect(screen.getByText('£1,500,000')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders BlockersBanner when blockers are present', () => {
    render(<BlockersBanner blockers={mockSnapshot.blockers} />);

    expect(
      screen.getByText(/Active Progression Blockers/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Awaiting AML source of funds evidence from buyer solicitor.',
      ),
    ).toBeInTheDocument();
  });

  it('renders WorkItemExecutionRow and triggers complete action', async () => {
    const mockWorkItem: BffWorkspaceWorkItem = {
      id: 'wi-test-1',
      stepId: 'step-test-1',
      title: 'Verify AML identity proof documents',
      description: 'Check biometric passport & utility bill',
      status: 'Pending',
      tag: 'Key Date',
      requirement: 'required',
      role: 'Compliance Officer',
      isKeyDate: true,
      allowedActions: ['COMPLETE', 'WAIVE'],
    };

    const handleAction = vi.fn();

    render(
      <WorkItemExecutionRow
        workItem={mockWorkItem}
        onAction={handleAction}
        isLoading={false}
      />,
    );

    expect(
      screen.getByText('Verify AML identity proof documents'),
    ).toBeInTheDocument();
    expect(screen.getByText('Key Date')).toBeInTheDocument();

    const completeBtn = screen.getByRole('button', { name: /Complete/i });
    expect(completeBtn).toBeInTheDocument();

    fireEvent.click(completeBtn);
    expect(handleAction).toHaveBeenCalledWith('wi-test-1', 'COMPLETE');
  });

  it('renders StepExecutionCard and handles step complete action', async () => {
    const mockStep: BffWorkspaceStep = {
      id: 'step-test-1',
      stepDefinitionId: 'step-def-1',
      name: 'Mortgage Valuation Inspection',
      description: 'Bank valuer conducts property inspection.',
      status: 'Available',
      displayOrder: 2,
      dependencyJoinType: 'ALL',
      dependencies: ['step-test-0'],
      allowedActions: ['COMPLETE_STEP', 'SKIP_STEP'],
      workItems: [],
    };

    const handleStepAction = vi.fn();

    render(
      <StepExecutionCard
        step={mockStep}
        onStepAction={handleStepAction}
        onWorkItemAction={vi.fn()}
        loadingStepId={null}
        loadingWorkItemId={null}
      />,
    );

    expect(
      screen.getByText('Mortgage Valuation Inspection'),
    ).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();

    const completeStepBtn = screen.getByRole('button', {
      name: /Complete Step/i,
    });
    expect(completeStepBtn).toBeInTheDocument();

    fireEvent.click(completeStepBtn);
    expect(handleStepAction).toHaveBeenCalledWith(
      'step-test-1',
      'COMPLETE_STEP',
    );
  });

  it('renders the complete CaseWorkspacePage with all tabs', async () => {
    vi.spyOn(apiClient, 'fetchCaseWorkspace').mockResolvedValue(mockSnapshot);

    render(
      <MemoryRouter initialEntries={['/cases/case-test-101']}>
        <Routes>
          <Route path="/cases/:caseId" element={<CaseWorkspacePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', {
        name: /10 Downing Street, London/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Workflow Progression/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Documents & Evidence/i)).toBeInTheDocument();
    expect(screen.getByText(/Stakeholders & Solicitors/i)).toBeInTheDocument();
    expect(screen.getByText(/Timeline & Notes/i)).toBeInTheDocument();
  });

  it('renders WorkItemExecutionRow with dynamic assignee badge', () => {
    const mockWorkItemWithAssignee: BffWorkspaceWorkItem = {
      id: 'wi-test-2',
      title: 'Approve draft contract pack',
      status: 'Pending',
      requirement: 'required',
      ownerRoleId: 'role-vendor-solicitor',
      assignee: {
        id: 'part-1',
        name: 'David Reynolds',
        companyName: 'Reynolds & Co Legal',
      },
      allowedActions: ['COMPLETE', 'WAIVE'],
    };

    render(
      <WorkItemExecutionRow
        workItem={mockWorkItemWithAssignee}
        onAction={vi.fn()}
        isLoading={false}
      />,
    );

    expect(
      screen.getByText(/David Reynolds \(Reynolds & Co Legal\)/i),
    ).toBeInTheDocument();
  });
});
