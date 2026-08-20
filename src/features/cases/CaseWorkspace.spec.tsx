import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { WorkspaceHeader } from './workspace/WorkspaceHeader';
import { BlockersBanner } from './workspace/BlockersBanner';
import { WorkItemExecutionRow } from './workspace/WorkItemExecutionRow';
import { StepExecutionCard } from './workspace/StepExecutionCard';
import { CaseWorkspacePage } from './CaseWorkspacePage';
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

  it('renders WorkItemExecutionRow with role and triggers complete action', async () => {
    const mockWorkItem: BffWorkspaceWorkItem = {
      id: 'wi-test-1',
      stepId: 'step-test-1',
      title: 'Obtain Proof of Deposit from Buyer',
      status: 'Pending',
      tag: 'Key Date',
      requirement: 'required',
      role: 'Sales Progressor',
      isKeyDate: true,
      allowedActions: ['COMPLETE', 'WAIVE'],
    };

    const handleAction = vi.fn().mockResolvedValue(undefined);

    render(
      <WorkItemExecutionRow
        workItem={mockWorkItem}
        onAction={handleAction}
        isLoading={false}
      />,
    );

    expect(
      screen.getByText('Obtain Proof of Deposit from Buyer'),
    ).toBeInTheDocument();
    expect(screen.getByText('Role: Sales Progressor')).toBeInTheDocument();
    expect(screen.getByText('Key Date Milestone')).toBeInTheDocument();

    const completeBtn = screen.getByRole('button', { name: /Complete Task/i });
    expect(completeBtn).toBeInTheDocument();

    fireEvent.click(completeBtn);
    expect(handleAction).toHaveBeenCalledWith('wi-test-1', 'COMPLETE');
  });

  it('renders StepExecutionCard with step actions when allowed', async () => {
    const mockStep: BffWorkspaceStep = {
      id: 'step-test-1',
      stepDefinitionId: 'sdef-1',
      name: 'Memorandum of Sale Distributed',
      status: 'InProgress',
      displayOrder: 2,
      dependencyJoinType: 'ALL',
      dependencies: [],
      allowedActions: ['COMPLETE_STEP'],
      workItems: [],
    };

    const handleStepAction = vi.fn().mockResolvedValue(undefined);
    const handleWorkItemAction = vi.fn().mockResolvedValue(undefined);

    render(
      <StepExecutionCard
        step={mockStep}
        onStepAction={handleStepAction}
        onWorkItemAction={handleWorkItemAction}
        loadingStepId={null}
        loadingWorkItemId={null}
      />,
    );

    expect(
      screen.getByText('Memorandum of Sale Distributed'),
    ).toBeInTheDocument();
    expect(screen.getByText('InProgress')).toBeInTheDocument();

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
    render(
      <MemoryRouter initialEntries={['/cases/case-oxford-101']}>
        <Routes>
          <Route path="/cases/:caseId" element={<CaseWorkspacePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', {
        name: /42 Woodstock Road, Oxford OX2 6HT/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Workflow Progression/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Documents & Evidence/i)).toBeInTheDocument();
    expect(screen.getByText(/Stakeholders & Solicitors/i)).toBeInTheDocument();
  });
});
