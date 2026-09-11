import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SalesProgressionTracker } from './SalesProgressionTracker';
import type { BffWorkspaceSnapshot } from '../../../types/api';

const mockSnapshot: BffWorkspaceSnapshot = {
  caseId: 'case-100',
  reference: 'CM-887EFD34',
  title: '14 Elm Road Sale',
  propertyAddress: '14 Elm Road, London',
  caseTypeId: 'ct-sale',
  caseTypeName: 'Residential Sale',
  templateVersion: 1,
  status: 'Open',
  progressPercentage: 33,
  assignedProgressorName: 'Marcus Cole',
  branchName: 'Central Office Branch',
  blockers: ['Grant of probate: Grant of probate delayed at top of chain.'],
  steps: [
    {
      id: 'step-1',
      stepDefinitionId: 'sd-1',
      name: 'Offer Accepted',
      status: 'Completed',
      displayOrder: 1,
      dependencyJoinType: 'ALL',
      dependencies: [],
      allowedActions: [],
      workItems: [],
    },
    {
      id: 'step-2',
      stepDefinitionId: 'sd-2',
      name: 'Memorandum of Sale Sent',
      status: 'Completed',
      displayOrder: 2,
      dependencyJoinType: 'ALL',
      dependencies: ['step-1'],
      allowedActions: [],
      workItems: [],
    },
    {
      id: 'step-3',
      stepDefinitionId: 'sd-3',
      name: 'Buyer Solicitor Instructed',
      status: 'InProgress',
      displayOrder: 3,
      dependencyJoinType: 'ALL',
      dependencies: ['step-2'],
      startedAt: '2026-08-01T10:00:00.000Z',
      allowedActions: ['COMPLETE_STEP'],
      workItems: [
        {
          id: 'wi-1',
          name: 'Add buyer solicitor details',
          status: 'Pending',
          requirement: 'required',
          role: 'role-estate-agent',
          allowedActions: ['COMPLETE'],
        },
      ],
    },
    {
      id: 'step-4',
      stepDefinitionId: 'sd-4',
      name: 'Searches Ordered',
      status: 'Pending',
      displayOrder: 4,
      dependencyJoinType: 'ALL',
      dependencies: ['step-3'],
      allowedActions: [],
      workItems: [],
    },
  ],
  documents: [],
  participants: [],
  updatedAt: '2026-08-01T10:00:00.000Z',
};

describe('SalesProgressionTracker', () => {
  it('renders all progression milestones in horizontal stepper', () => {
    render(<SalesProgressionTracker snapshot={mockSnapshot} />);

    expect(
      screen.getAllByText('Buyer Solicitor Instructed').length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Searches Ordered')).toBeInTheDocument();
  });

  it('renders the Current Active Milestone callout bar with next action details', () => {
    render(<SalesProgressionTracker snapshot={mockSnapshot} />);

    expect(screen.getByText('Current Active Milestone')).toBeInTheDocument();
    expect(
      screen.getByText(/Add buyer solicitor details/),
    ).toBeInTheDocument();
  });

  it('triggers onSelectStep when clicking a milestone node', () => {
    const onSelectSpy = vi.fn();
    render(
      <SalesProgressionTracker
        snapshot={mockSnapshot}
        onSelectStep={onSelectSpy}
      />,
    );

    fireEvent.click(screen.getByText('Searches Ordered'));
    expect(onSelectSpy).toHaveBeenCalledWith('step-4');
  });

  it('correctly prioritizes Available step over Pending step as active milestone', () => {
    const availableSnapshot: BffWorkspaceSnapshot = {
      ...mockSnapshot,
      steps: [
        {
          id: 'step-1',
          stepDefinitionId: 'sd-1',
          name: 'Offer Accepted',
          status: 'Completed',
          displayOrder: 1,
          dependencyJoinType: 'ALL',
          dependencies: [],
          allowedActions: [],
          workItems: [],
        },
        {
          id: 'step-2',
          stepDefinitionId: 'sd-2',
          name: 'Draft Contracts Prepared',
          status: 'Available',
          displayOrder: 2,
          dependencyJoinType: 'ALL',
          dependencies: ['step-1'],
          allowedActions: ['COMPLETE_STEP'],
          workItems: [
            {
              id: 'wi-draft-contracts',
              name: 'Prepare contract pack',
              status: 'Pending',
              requirement: 'required',
              role: 'role-vendor-solicitor',
              allowedActions: ['COMPLETE'],
            },
          ],
        },
        {
          id: 'step-3',
          stepDefinitionId: 'sd-3',
          name: 'Exchange of Contracts',
          status: 'Pending',
          displayOrder: 3,
          dependencyJoinType: 'ALL',
          dependencies: ['step-2'],
          allowedActions: [],
          workItems: [],
        },
      ],
    };

    render(<SalesProgressionTracker snapshot={availableSnapshot} />);

    // Step 2 (Available) is active, Next Action shows Step 2's task, not Step 3
    expect(
      screen.getAllByText('Draft Contracts Prepared').length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Prepare contract pack/)).toBeInTheDocument();
    expect(screen.getByText(/Manual task - Seller Solicitor/)).toBeInTheDocument();
  });

  it('renders orphan/standalone step with distinct amber styling and Standalone badge', () => {
    const standaloneSnapshot: BffWorkspaceSnapshot = {
      ...mockSnapshot,
      steps: [
        {
          id: 'step-1',
          stepDefinitionId: 'sd-1',
          name: 'Offer Accepted',
          status: 'Completed',
          displayOrder: 1,
          dependencyJoinType: 'ALL',
          dependencies: [],
          allowedActions: [],
          workItems: [],
        },
        {
          id: 'step-standalone',
          stepDefinitionId: 'sd-sa',
          name: 'Independent Compliance Check',
          status: 'Available',
          displayOrder: 2,
          dependencyJoinType: 'ALL',
          dependencies: [],
          isStandalone: true,
          allowedActions: ['COMPLETE_STEP'],
          workItems: [],
        },
        {
          id: 'step-3',
          stepDefinitionId: 'sd-3',
          name: 'Exchange of Contracts',
          status: 'Pending',
          displayOrder: 3,
          dependencyJoinType: 'ALL',
          dependencies: ['step-1'],
          allowedActions: [],
          workItems: [],
        },
      ],
    };

    const { container } = render(
      <SalesProgressionTracker snapshot={standaloneSnapshot} />,
    );

    // Standalone badge is visible on the orphan milestone node
    expect(screen.getByText('Standalone')).toBeInTheDocument();
    expect(
      screen.getAllByText('Independent Compliance Check').length,
    ).toBeGreaterThanOrEqual(1);

    // Connecting lines flanking the orphan step are disconnected (opacity-0)
    const hiddenLines = container.querySelectorAll('.opacity-0');
    expect(hiddenLines.length).toBeGreaterThan(0);
  });

  it('correctly reflects waived work items in the hover card with Waived indicator and completed progress', () => {
    const snapshotWithWaived: BffWorkspaceSnapshot = {
      ...mockSnapshot,
      steps: [
        {
          id: 'step-1',
          stepDefinitionId: 'sd-1',
          name: 'Offer Accepted',
          status: 'Completed',
          displayOrder: 1,
          dependencyJoinType: 'ALL',
          dependencies: [],
          allowedActions: [],
          workItems: [],
        },
        {
          id: 'step-2',
          stepDefinitionId: 'sd-2',
          name: 'Exchange of Contracts',
          status: 'InProgress',
          displayOrder: 2,
          dependencyJoinType: 'ALL',
          dependencies: ['step-1'],
          allowedActions: ['COMPLETE_STEP'],
          workItems: [
            {
              id: 'wi-waived',
              name: 'Transfer 10% Deposit',
              status: 'Waived',
              requirement: 'required',
              role: 'role-buyer-solicitor',
              allowedActions: [],
            },
            {
              id: 'wi-pending',
              name: 'Sign Contracts & TR1',
              status: 'Pending',
              requirement: 'required',
              role: 'role-buyer-solicitor',
              allowedActions: ['COMPLETE'],
            },
          ],
        },
      ],
    };

    render(<SalesProgressionTracker snapshot={snapshotWithWaived} />);
    const node = screen
      .getAllByText('Exchange of Contracts')[0]
      .closest('div[data-no-drag]');
    expect(node).not.toBeNull();
    if (node) {
      fireEvent.mouseEnter(node);
    }

    expect(screen.getByText(/1\/2 \(50%\)/)).toBeInTheDocument();
    expect(screen.getByText('(1 waived)')).toBeInTheDocument();
    expect(screen.getByText('Transfer 10% Deposit')).toBeInTheDocument();
    expect(screen.getByText('Waived')).toBeInTheDocument();
  });
});

