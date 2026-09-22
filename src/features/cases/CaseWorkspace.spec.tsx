import { describe, it, expect, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from '@testing-library/react';
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
  BffCaseDocument,
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

  it('renders Access Restricted screen when fetchCaseWorkspace returns 403 Forbidden', async () => {
    vi.spyOn(apiClient, 'fetchCaseWorkspace').mockRejectedValue(
      new apiClient.ApiError({
        type: 'urn:problem:forbidden',
        title: 'Forbidden',
        status: 403,
        detail:
          'You are not assigned as an authorized stakeholder or solicitor on this case.',
      }),
    );

    render(
      <MemoryRouter initialEntries={['/cases/case-unauthorized-403']}>
        <Routes>
          <Route path="/cases/:caseId" element={<CaseWorkspacePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: /Access Restricted/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /You are not assigned as an authorized stakeholder or solicitor on this case/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Back to Cases/i }),
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

  it('renders Evidence Required and Evidence badges on WorkItemExecutionRow when evidenceRequired is true', () => {
    const mockEvidenceWorkItem: BffWorkspaceWorkItem = {
      id: 'wi-evidence-1',
      name: 'Mortgage Offer Letter',
      status: 'Pending',
      requirement: 'conditional',
      condition: 'Only mandatory if purchasing with a mortgage loan',
      evidenceRequired: true,
      ownerRoleId: 'role-estate-agent',
      allowedActions: ['COMPLETE'],
    };

    const { rerender } = render(
      <WorkItemExecutionRow
        workItem={mockEvidenceWorkItem}
        documents={[]}
        isReadOnly={false}
        onAction={vi.fn()}
        isLoading={false}
      />,
    );

    // Shows Evidence Required badge and condition rule
    expect(screen.getByText('Evidence Required')).toBeInTheDocument();
    expect(screen.getByText('Condition Rule:')).toBeInTheDocument();
    expect(
      screen.getByText('Only mandatory if purchasing with a mortgage loan'),
    ).toBeInTheDocument();

    // Now re-render with attached evidence document
    rerender(
      <WorkItemExecutionRow
        workItem={mockEvidenceWorkItem}
        documents={[
          {
            id: 'doc-1',
            fileName: 'official-mortgage-offer.pdf',
            fileSizeBytes: 102400,
            fileType: 'application/pdf',
            category: 'EVIDENCE',
            workItemId: 'wi-evidence-1',
            uploadedAt: new Date().toISOString(),
            uploadedByName: 'Sarah Agent',
            downloadUrl: 'https://storage.example.com/mortgage-offer.pdf',
          },
        ]}
        isReadOnly={false}
        onAction={vi.fn()}
        isLoading={false}
      />,
    );

    expect(screen.queryByText('Evidence Required')).not.toBeInTheDocument();
    expect(
      screen.getByText('Evidence: official-mortgage-offer.pdf'),
    ).toBeInTheDocument();
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
    expect(screen.getByText('Independent Milestone:')).toBeInTheDocument();
    expect(
      screen.getByText(
        /You can work on and complete it at any time without waiting for or delaying other steps/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Complete Step/i })).toHaveClass(
      'bg-[#E1007A]',
    );
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

  it('renders Hold, Complete, and Cancel quick action buttons on WorkspaceHeader when case is Open and triggers onOpenStatusModal', () => {
    const openSnapshot: BffWorkspaceSnapshot = {
      ...mockSnapshot,
      status: 'Open',
      allowedActions: ['HOLD', 'COMPLETE', 'CANCEL'],
    };

    const handleOpenModal = vi.fn();
    render(
      <WorkspaceHeader
        snapshot={openSnapshot}
        onOpenStatusModal={handleOpenModal}
      />,
    );

    const holdBtn = screen.getByRole('button', { name: /Put on Hold/i });
    const completeBtn = screen.getByRole('button', { name: /Complete Case/i });
    const cancelBtn = screen.getByRole('button', { name: /Cancel Case/i });

    expect(holdBtn).toBeInTheDocument();
    expect(completeBtn).toBeInTheDocument();
    expect(cancelBtn).toBeInTheDocument();

    fireEvent.click(holdBtn);
    expect(handleOpenModal).toHaveBeenCalledWith('HOLD');

    fireEvent.click(completeBtn);
    expect(handleOpenModal).toHaveBeenCalledWith('COMPLETE');

    fireEvent.click(cancelBtn);
    expect(handleOpenModal).toHaveBeenCalledWith('CANCEL');
  });

  it('renders Resume and Cancel quick action buttons on WorkspaceHeader when case is OnHold and triggers onOpenStatusModal', () => {
    const onHoldSnapshot: BffWorkspaceSnapshot = {
      ...mockSnapshot,
      status: 'OnHold',
      allowedActions: ['RESUME', 'CANCEL'],
    };

    const handleOpenModal = vi.fn();
    render(
      <WorkspaceHeader
        snapshot={onHoldSnapshot}
        onOpenStatusModal={handleOpenModal}
      />,
    );

    const resumeBtn = screen.getByRole('button', { name: /Resume Case/i });
    const cancelBtn = screen.getByRole('button', { name: /Cancel Case/i });

    expect(resumeBtn).toBeInTheDocument();
    expect(cancelBtn).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Put on Hold/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(resumeBtn);
    expect(handleOpenModal).toHaveBeenCalledWith('RESUME');

    fireEvent.click(cancelBtn);
    expect(handleOpenModal).toHaveBeenCalledWith('CANCEL');
  });

  it('renders the companion ExpectedDurationCard within WorkspaceHeader', () => {
    const snapshotWithDuration: BffWorkspaceSnapshot = {
      ...mockSnapshot,
      expectedCompletionDays: 21,
    };

    render(<WorkspaceHeader snapshot={snapshotWithDuration} />);

    expect(screen.getByTestId('expected-duration-card')).toBeInTheDocument();
    expect(screen.getByText('~21 Days')).toBeInTheDocument();
    expect(screen.getByText('Active Pace')).toBeInTheDocument();
  });

  describe('Ad-hoc Case Customization (Epic 1)', () => {
    const mockAdHocStep: BffWorkspaceStep = {
      id: 'step-adhoc-1',
      stepDefinitionId: 'step-adhoc-1',
      name: 'Specialist Japanese Knotweed Survey',
      status: 'Available',
      displayOrder: 3,
      dependencyJoinType: 'ALL',
      dependencies: [],
      isOptional: true,
      isStandalone: true,
      isAdHoc: true,
      allowedActions: ['COMPLETE_STEP'],
      workItems: [
        {
          id: 'wi-adhoc-1',
          stepId: 'step-adhoc-1',
          name: 'Inspect rear garden perimeter',
          status: 'Pending',
          requirement: 'optional',
          isAdHoc: true,
          allowedActions: ['COMPLETE'],
        },
      ],
    };

    it('renders Custom badge on ad-hoc step header', () => {
      render(
        <StepExecutionCard
          step={mockAdHocStep}
          onStepAction={vi.fn()}
          onWorkItemAction={vi.fn()}
          loadingStepId={null}
          loadingWorkItemId={null}
        />,
      );

      expect(
        screen.getByText('Specialist Japanese Knotweed Survey'),
      ).toBeInTheDocument();
      expect(screen.getAllByText('Custom').length).toBeGreaterThanOrEqual(1);
    });

    it('renders Move Up and Move Down buttons when canCustomize is true', () => {
      const handleMoveUp = vi.fn();
      const handleMoveDown = vi.fn();

      render(
        <StepExecutionCard
          step={mockAdHocStep}
          canCustomize={true}
          onMoveStepUp={handleMoveUp}
          onMoveStepDown={handleMoveDown}
          isFirstStep={false}
          isLastStep={false}
          onStepAction={vi.fn()}
          onWorkItemAction={vi.fn()}
          loadingStepId={null}
          loadingWorkItemId={null}
        />,
      );

      const moveUpBtn = screen.getByRole('button', { name: /Move step up/i });
      const moveDownBtn = screen.getByRole('button', {
        name: /Move step down/i,
      });

      expect(moveUpBtn).toBeInTheDocument();
      expect(moveDownBtn).toBeInTheDocument();

      fireEvent.click(moveUpBtn);
      expect(handleMoveUp).toHaveBeenCalledWith('step-adhoc-1');

      fireEvent.click(moveDownBtn);
      expect(handleMoveDown).toHaveBeenCalledWith('step-adhoc-1');
    });

    it('renders Delete button for ad-hoc step and triggers onDeleteStep', () => {
      const handleDeleteStep = vi.fn();

      render(
        <StepExecutionCard
          step={mockAdHocStep}
          canCustomize={true}
          onDeleteStep={handleDeleteStep}
          onStepAction={vi.fn()}
          onWorkItemAction={vi.fn()}
          loadingStepId={null}
          loadingWorkItemId={null}
        />,
      );

      const deleteBtn = screen.getByRole('button', {
        name: /Delete custom step/i,
      });
      expect(deleteBtn).toBeInTheDocument();
      expect(deleteBtn).not.toBeDisabled();

      fireEvent.click(deleteBtn);
      expect(handleDeleteStep).toHaveBeenCalledWith('step-adhoc-1');
    });

    it('disables Delete button when ad-hoc step is InProgress or Completed', () => {
      const inProgressStep: BffWorkspaceStep = {
        ...mockAdHocStep,
        status: 'InProgress',
      };

      render(
        <StepExecutionCard
          step={inProgressStep}
          canCustomize={true}
          onDeleteStep={vi.fn()}
          onStepAction={vi.fn()}
          onWorkItemAction={vi.fn()}
          loadingStepId={null}
          loadingWorkItemId={null}
        />,
      );

      const deleteBtn = screen.getByRole('button', {
        name: /Cannot delete an active or completed step/i,
      });
      expect(deleteBtn).toBeDisabled();
    });

    it('does not render Delete button for standard template steps', () => {
      const standardStep: BffWorkspaceStep = {
        ...mockAdHocStep,
        isAdHoc: false,
      };

      render(
        <StepExecutionCard
          step={standardStep}
          canCustomize={true}
          onDeleteStep={vi.fn()}
          onStepAction={vi.fn()}
          onWorkItemAction={vi.fn()}
          loadingStepId={null}
          loadingWorkItemId={null}
        />,
      );

      expect(
        screen.queryByRole('button', { name: /Delete custom step/i }),
      ).not.toBeInTheDocument();
    });

    it('renders Add Task button inside step when canCustomize is true', () => {
      const handleOpenAddTask = vi.fn();

      render(
        <StepExecutionCard
          step={mockAdHocStep}
          canCustomize={true}
          onOpenAddWorkItem={handleOpenAddTask}
          onStepAction={vi.fn()}
          onWorkItemAction={vi.fn()}
          loadingStepId={null}
          loadingWorkItemId={null}
        />,
      );

      const addTaskBtn = screen.getByRole('button', { name: /Add Task/i });
      expect(addTaskBtn).toBeInTheDocument();

      fireEvent.click(addTaskBtn);
      expect(handleOpenAddTask).toHaveBeenCalledWith('step-adhoc-1');
    });

    it('renders Custom badge and Delete button on ad-hoc WorkItemExecutionRow', () => {
      const mockAdHocWorkItem: BffWorkspaceWorkItem = {
        id: 'wi-custom-99',
        name: 'Check tree preservation order',
        status: 'Pending',
        requirement: 'optional',
        isAdHoc: true,
        allowedActions: ['COMPLETE'],
      };

      const handleDeleteWorkItem = vi.fn();

      render(
        <WorkItemExecutionRow
          workItem={mockAdHocWorkItem}
          canCustomize={true}
          onDelete={handleDeleteWorkItem}
          onAction={vi.fn()}
          isLoading={false}
        />,
      );

      expect(
        screen.getByText('Check tree preservation order'),
      ).toBeInTheDocument();
      expect(screen.getByText('Custom')).toBeInTheDocument();

      const deleteBtn = screen.getByRole('button', {
        name: /Delete custom task/i,
      });
      expect(deleteBtn).toBeInTheDocument();
      expect(deleteBtn).not.toBeDisabled();

      fireEvent.click(deleteBtn);
      expect(handleDeleteWorkItem).toHaveBeenCalledWith('wi-custom-99');
    });

    it('disables Delete button on completed ad-hoc WorkItemExecutionRow', () => {
      const completedAdHocWorkItem: BffWorkspaceWorkItem = {
        id: 'wi-custom-100',
        name: 'Completed environmental review',
        status: 'Completed',
        requirement: 'optional',
        isAdHoc: true,
        allowedActions: [],
      };

      render(
        <WorkItemExecutionRow
          workItem={completedAdHocWorkItem}
          canCustomize={true}
          onDelete={vi.fn()}
          onAction={vi.fn()}
          isLoading={false}
        />,
      );

      const deleteBtn = screen.getByRole('button', {
        name: /Completed tasks cannot be deleted/i,
      });
      expect(deleteBtn).toBeDisabled();
    });

    it('propagates onOpenEvidenceModal when clicking Upload Evidence in StepExecutionCard', () => {
      const mockWorkItemWithEvidence: BffWorkspaceWorkItem = {
        id: 'wi-evidence-1',
        stepId: 'step-test-1',
        title: 'ID Verification',
        requirement: 'required',
        status: 'Pending',
        evidenceRequired: true,
        allowedActions: ['COMPLETE'],
      };

      const stepWithEvidence: BffWorkspaceStep = {
        id: 'step-test-1',
        stepDefinitionId: 'step-def-1',
        name: 'Anti-Money Laundering & Identity Checks',
        status: 'InProgress',
        displayOrder: 1,
        dependencyJoinType: 'ALL',
        dependencies: [],
        workItems: [mockWorkItemWithEvidence],
        allowedActions: [],
      };

      const handleOpenModal = vi.fn();

      render(
        <StepExecutionCard
          step={stepWithEvidence}
          onStepAction={vi.fn()}
          onWorkItemAction={vi.fn()}
          onOpenEvidenceModal={handleOpenModal}
          loadingStepId={null}
          loadingWorkItemId={null}
        />,
      );

      const uploadBtn = screen.getByRole('button', {
        name: /^Upload Evidence$/i,
      });
      expect(uploadBtn).toBeInTheDocument();

      fireEvent.click(uploadBtn);
      expect(handleOpenModal).toHaveBeenCalledTimes(1);
      expect(handleOpenModal).toHaveBeenCalledWith(
        'step-test-1',
        mockWorkItemWithEvidence,
      );
    });

    it('renders UploadEvidenceModal, uploads document, and enables Complete Task button in CaseWorkspacePage', async () => {
      const evidenceWorkItem: BffWorkspaceWorkItem = {
        id: 'wi-evidence-1',
        stepId: 'step-1',
        title: 'Upload Contract Evidence',
        requirement: 'required',
        status: 'Pending',
        evidenceRequired: true,
        allowedActions: ['COMPLETE'],
      };

      const snapshotBeforeUpload: BffWorkspaceSnapshot = {
        ...mockSnapshot,
        steps: [
          {
            id: 'step-1',
            stepDefinitionId: 'step-def-1',
            name: 'Legal Enquiries',
            status: 'InProgress',
            displayOrder: 1,
            dependencyJoinType: 'ALL',
            dependencies: [],
            workItems: [evidenceWorkItem],
            allowedActions: [],
          },
        ],
        documents: [],
      };

      const snapshotAfterUpload: BffWorkspaceSnapshot = {
        ...snapshotBeforeUpload,
        documents: [
          {
            id: 'doc-1',
            workItemId: 'wi-evidence-1',
            fileName: 'signed_contract.pdf',
            fileSizeBytes: 1024,
            fileType: 'application/pdf',
            category: 'Evidence',
            uploadedAt: '2026-09-22T10:00:00Z',
            uploadedByName: 'Agent Smith',
          },
        ],
      };

      vi.spyOn(apiClient, 'fetchCaseWorkspace')
        .mockResolvedValueOnce(snapshotBeforeUpload)
        .mockResolvedValueOnce(snapshotAfterUpload);
      const uploadDocSpy = vi
        .spyOn(apiClient, 'uploadCaseDocument')
        .mockResolvedValue(undefined);
      const executeActionSpy = vi
        .spyOn(apiClient, 'executeWorkItemAction')
        .mockResolvedValue({ success: true, resourceVersion: 1 });

      render(
        <MemoryRouter initialEntries={['/cases/case-test-101']}>
          <Routes>
            <Route path="/cases/:caseId" element={<CaseWorkspacePage />} />
          </Routes>
        </MemoryRouter>,
      );

      const uploadEvidenceBtn = await screen.findByRole('button', {
        name: /^Upload Evidence$/i,
      });
      expect(uploadEvidenceBtn).toBeInTheDocument();

      fireEvent.click(uploadEvidenceBtn);

      const modal = await screen.findByRole('dialog');
      expect(
        within(modal).getByRole('heading', {
          name: /Evidence Verification Required/i,
        }),
      ).toBeInTheDocument();

      const file = new File(['mock pdf content'], 'signed_contract.pdf', {
        type: 'application/pdf',
      });
      const fileInput = within(modal).getByTestId('evidence-file-input');
      fireEvent.change(fileInput, { target: { files: [file] } });

      const submitBtn = within(modal).getByRole('button', {
        name: /^Upload Evidence$/i,
      });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(uploadDocSpy).toHaveBeenCalledWith(
          'case-test-101',
          file,
          'wi-evidence-1',
        );
      });

      // Verify work item is NOT automatically completed
      expect(executeActionSpy).not.toHaveBeenCalled();

      // Verify button transforms to Complete Task once document is attached
      const completeTaskBtn = await screen.findByRole('button', {
        name: /^Complete Task$/i,
      });
      expect(completeTaskBtn).toBeInTheDocument();
      expect(completeTaskBtn).not.toBeDisabled();
    });

    it('allows deleting attached evidence document, which dynamically transforms Complete Task button back to Upload Evidence', async () => {
      const stepWithEvidence: BffWorkspaceStep = {
        id: 'step-ev-2',
        stepDefinitionId: 'step-def-ev-2',
        name: 'Anti-Money Laundering Review',
        status: 'InProgress',
        displayOrder: 1,
        dependencyJoinType: 'ALL',
        dependencies: [],
        allowedActions: [],
        workItems: [
          {
            id: 'wi-evidence-2',
            workItemDefinitionId: 'def-evidence-2',
            title: 'Verify Client Proof of Wealth',
            name: 'Verify Client Proof of Wealth',
            requirement: 'required',
            status: 'Pending',
            evidenceRequired: true,
            allowedActions: ['COMPLETE'],
          },
        ],
      };

      const attachedDoc: BffCaseDocument = {
        id: 'doc-wealth-1',
        workItemId: 'wi-evidence-2',
        fileName: 'wealth_statement.pdf',
        fileSizeBytes: 2048,
        fileType: 'application/pdf',
        category: 'Evidence',
        uploadedAt: '2026-09-22T10:00:00Z',
        uploadedByName: 'Marcus Cole',
      };

      const snapshotWithDoc: BffWorkspaceSnapshot = {
        ...mockSnapshot,
        steps: [stepWithEvidence],
        documents: [attachedDoc],
      };

      const snapshotAfterDelete: BffWorkspaceSnapshot = {
        ...mockSnapshot,
        steps: [stepWithEvidence],
        documents: [],
      };

      vi.spyOn(apiClient, 'fetchCaseWorkspace')
        .mockResolvedValueOnce(snapshotWithDoc)
        .mockResolvedValueOnce(snapshotAfterDelete);
      const deleteDocSpy = vi
        .spyOn(apiClient, 'deleteCaseDocument')
        .mockResolvedValue(undefined);

      render(
        <MemoryRouter initialEntries={['/cases/case-test-101']}>
          <Routes>
            <Route path="/cases/:caseId" element={<CaseWorkspacePage />} />
          </Routes>
        </MemoryRouter>,
      );

      // Verify Complete Task button and attached document chip are present
      expect(
        await screen.findByText(/wealth_statement.pdf/i),
      ).toBeInTheDocument();
      const completeTaskBtn = await screen.findByRole('button', {
        name: /^Complete Task$/i,
      });
      expect(completeTaskBtn).toBeInTheDocument();

      // Click remove evidence button
      const removeBtn = screen.getByRole('button', {
        name: 'Remove evidence document',
      });
      fireEvent.click(removeBtn);

      // Confirm modal opens
      expect(
        screen.getByText(/Are you sure you want to remove "wealth_statement.pdf"/i),
      ).toBeInTheDocument();

      const confirmBtn = screen.getByRole('button', {
        name: 'Remove Evidence',
      });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(deleteDocSpy).toHaveBeenCalledWith(
          'case-test-101',
          'doc-wealth-1',
        );
      });

      // Verify button reverts back to Upload Evidence
      const uploadEvidenceBtn = await screen.findByRole('button', {
        name: /^Upload Evidence$/i,
      });
      expect(uploadEvidenceBtn).toBeInTheDocument();
      expect(screen.getByText('Evidence Required')).toBeInTheDocument();
    });
  });
});
