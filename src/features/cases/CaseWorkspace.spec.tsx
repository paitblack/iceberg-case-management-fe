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
    expect(
      screen.getByText(/Discussions & Announcements/i),
    ).toBeInTheDocument();
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

    expect(screen.getByText(/Seller's Conveyancer/i)).toBeInTheDocument();
    expect(screen.getByText(/David Reynolds/i)).toBeInTheDocument();
  });

  it('renders pending StepExecutionCard with locked indicator and expands to show read-only work items', async () => {
    const mockPendingStep: BffWorkspaceStep = {
      id: 'step-pending-1',
      stepDefinitionId: 'step-def-pending',
      name: 'Exchange of Contracts',
      description: 'Formal contract exchange and deposit transfer.',
      status: 'Pending',
      displayOrder: 3,
      dependencyJoinType: 'ALL',
      dependencies: ['step-test-1'],
      allowedActions: [],
      workItems: [
        {
          id: 'wi-locked-1',
          name: 'Deposit funds verified',
          status: 'Pending',
          requirement: 'required',
          ownerRoleId: 'role-buyer-solicitor',
          allowedActions: ['COMPLETE'],
        },
      ],
    };

    render(
      <StepExecutionCard
        step={mockPendingStep}
        onStepAction={vi.fn()}
        onWorkItemAction={vi.fn()}
        loadingStepId={null}
        loadingWorkItemId={null}
      />,
    );

    // Header shows locked step notice
    expect(screen.getByText('Exchange of Contracts')).toBeInTheDocument();
    expect(screen.getByText('This step is not active yet')).toBeInTheDocument();

    // Click step to expand
    const toggleBtn = screen.getByRole('button', { name: /Expand step/i });
    fireEvent.click(toggleBtn);

    // Shows locked info banner and read-only work item
    expect(
      screen.getByText(
        /Complete all prerequisite predecessor milestones to unlock task execution/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Deposit funds verified')).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();

    // No complete button is rendered
    expect(
      screen.queryByRole('button', { name: /Complete Task/i }),
    ).not.toBeInTheDocument();
  });

  it('renders WorkItemExecutionRow in isReadOnly mode without action buttons', () => {
    const mockWorkItem: BffWorkspaceWorkItem = {
      id: 'wi-readonly-1',
      name: 'Final Completion Statement',
      status: 'Pending',
      requirement: 'required',
      ownerRoleId: 'role-estate-agent',
      allowedActions: ['COMPLETE', 'WAIVE'],
    };

    render(
      <WorkItemExecutionRow
        workItem={mockWorkItem}
        isReadOnly={true}
        onAction={vi.fn()}
        isLoading={false}
      />,
    );

    expect(screen.getByText('Final Completion Statement')).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Complete Task/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Waive/i }),
    ).not.toBeInTheDocument();
  });

  it('renders Standalone and Optional badges on StepExecutionCard', () => {
    const mockStandaloneOptionalStep: BffWorkspaceStep = {
      id: 'step-standalone-1',
      stepDefinitionId: 'step-def-sa',
      name: 'Client AML & Identity Verification',
      status: 'Available',
      displayOrder: 1,
      dependencyJoinType: 'ALL',
      dependencies: [],
      isStandalone: true,
      isOptional: true,
      allowedActions: ['COMPLETE_STEP'],
      workItems: [],
    };

    render(
      <StepExecutionCard
        step={mockStandaloneOptionalStep}
        onStepAction={vi.fn()}
        onWorkItemAction={vi.fn()}
        loadingStepId={null}
        loadingWorkItemId={null}
      />,
    );

    expect(
      screen.getByText('Client AML & Identity Verification'),
    ).toBeInTheDocument();
    expect(screen.getByText('Standalone')).toBeInTheDocument();
    expect(screen.getByText('(Optional)')).toBeInTheDocument();
  });

  it('calculates progression percentage on mandatory steps when optional steps exist', () => {
    const snapshotWithOptionalSteps: BffWorkspaceSnapshot = {
      ...mockSnapshot,
      steps: [
        {
          id: 'step-1',
          stepDefinitionId: 'def-1',
          name: 'Mandatory Step 1',
          status: 'Completed',
          displayOrder: 1,
          dependencyJoinType: 'ALL',
          dependencies: [],
          isOptional: false,
          allowedActions: [],
          workItems: [],
        },
        {
          id: 'step-2',
          stepDefinitionId: 'def-2',
          name: 'Mandatory Step 2',
          status: 'Available',
          displayOrder: 2,
          dependencyJoinType: 'ALL',
          dependencies: ['step-1'],
          isOptional: false,
          allowedActions: [],
          workItems: [],
        },
        {
          id: 'step-3',
          stepDefinitionId: 'def-3',
          name: 'Optional Special Survey',
          status: 'Pending',
          displayOrder: 3,
          dependencyJoinType: 'ALL',
          dependencies: [],
          isOptional: true,
          isStandalone: true,
          allowedActions: [],
          workItems: [],
        },
      ],
    };

    render(<WorkspaceHeader snapshot={snapshotWithOptionalSteps} />);

    // 1 of 2 mandatory steps complete = 50%
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(
      screen.getByText(/1 of 2 mandatory milestones complete/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/0\/1 optional done/i)).toBeInTheDocument();
  });

  it('renders Reopen Case button on WorkspaceHeader when case is Completed and REOPEN is in allowedActions', () => {
    const completedSnapshot: BffWorkspaceSnapshot = {
      ...mockSnapshot,
      status: 'Completed',
      allowedActions: ['REOPEN'],
    };

    const handleOpenModal = vi.fn();
    render(
      <WorkspaceHeader
        snapshot={completedSnapshot}
        onOpenStatusModal={handleOpenModal}
      />,
    );

    const reopenBtn = screen.getByRole('button', { name: /Reopen Case/i });
    expect(reopenBtn).toBeInTheDocument();

    fireEvent.click(reopenBtn);
    expect(handleOpenModal).toHaveBeenCalledWith('REOPEN');
  });

  it('does NOT render Reopen Case button when REOPEN is not allowed for current role', () => {
    const completedSnapshotWithoutReopen: BffWorkspaceSnapshot = {
      ...mockSnapshot,
      status: 'Completed',
      allowedActions: [],
    };

    render(
      <WorkspaceHeader
        snapshot={completedSnapshotWithoutReopen}
        onOpenStatusModal={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole('button', { name: /Reopen Case/i }),
    ).not.toBeInTheDocument();
  });

  it('renders reopened reason banner when case is Open and reopenReason is present', () => {
    const reopenedSnapshot: BffWorkspaceSnapshot = {
      ...mockSnapshot,
      status: 'Open',
      reopenReason:
        'Mortgage offer renewed by bank and property chain restored.',
    };

    render(<WorkspaceHeader snapshot={reopenedSnapshot} />);

    expect(screen.getByText(/This case was reopened/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Mortgage offer renewed by bank and property chain restored./i,
      ),
    ).toBeInTheDocument();
  });
});
