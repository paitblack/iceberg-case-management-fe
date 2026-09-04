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

  it('renders the Current Position card with all 4 telemetry columns', () => {
    render(<SalesProgressionTracker snapshot={mockSnapshot} />);

    expect(screen.getByText('Current position')).toBeInTheDocument();

    // Col 1: Current Blocker
    expect(screen.getByText(/current blocker/i)).toBeInTheDocument();
    expect(screen.getByText('Grant of probate')).toBeInTheDocument();
    expect(
      screen.getByText('Grant of probate delayed at top of chain.'),
    ).toBeInTheDocument();

    // Col 2: Next Action
    expect(screen.getByText(/next action/i)).toBeInTheDocument();
    expect(
      screen.getByText('Add buyer solicitor details'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Manual task - Estate Agent'),
    ).toBeInTheDocument();

    // Col 3: Next Chase
    expect(screen.getByText(/next chase/i)).toBeInTheDocument();
    expect(screen.getByText('Action Required')).toBeInTheDocument();
    expect(
      screen.getByText('Chase Grant of probate'),
    ).toBeInTheDocument();

    // Col 4: Days in Current Milestone
    expect(
      screen.getAllByText('Buyer Solicitor Instructed').length,
    ).toBeGreaterThanOrEqual(1);
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

  it('renders None when there are no active blockers', () => {
    const unblockedSnapshot: BffWorkspaceSnapshot = {
      ...mockSnapshot,
      blockers: [],
    };

    render(<SalesProgressionTracker snapshot={unblockedSnapshot} />);

    expect(screen.getByText('None')).toBeInTheDocument();
    expect(
      screen.getByText('All milestone progression clear'),
    ).toBeInTheDocument();
  });
});
