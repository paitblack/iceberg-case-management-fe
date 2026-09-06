import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ExpectedDurationCard } from './ExpectedDurationCard';
import type { BffWorkspaceSnapshot } from '../../../types/api';

const baseMockSnapshot: BffWorkspaceSnapshot = {
  caseId: 'case-test-1',
  reference: 'CM-TEST-001',
  title: '42 Baker Street, London',
  propertyAddress: '42 Baker Street, London',
  caseTypeId: 'ct-sales',
  caseTypeName: 'Residential Property Sale',
  templateVersion: 1,
  status: 'Open',
  progressPercentage: 20,
  assignedProgressorName: 'Sarah Jenkins',
  branchName: 'Central Branch',
  blockers: [],
  documents: [],
  participants: [],
  updatedAt: new Date().toISOString(),
  steps: [
    {
      id: 'step-1',
      stepDefinitionId: 'sd-1',
      name: 'Onboarding & AML',
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
      stepDefinitionId: 'sd-2',
      name: 'Searches & Inquiries',
      status: 'InProgress',
      displayOrder: 2,
      dependencyJoinType: 'ALL',
      dependencies: ['step-1'],
      isOptional: false,
      allowedActions: [],
      workItems: [],
    },
    {
      id: 'step-3',
      stepDefinitionId: 'sd-3',
      name: 'Exchange of Contracts',
      status: 'Pending',
      displayOrder: 3,
      dependencyJoinType: 'ALL',
      dependencies: ['step-2'],
      isOptional: false,
      allowedActions: [],
      workItems: [],
    },
  ],
};

describe('ExpectedDurationCard', () => {
  it('renders State 1 (Initial/Pending) with neutral badge and empirical velocity explanation when expectedCompletionDays is null', () => {
    const snapshot: BffWorkspaceSnapshot = {
      ...baseMockSnapshot,
      expectedCompletionDays: null,
    };

    render(<ExpectedDurationCard snapshot={snapshot} />);

    expect(screen.getByText('Expected Duration')).toBeInTheDocument();
    expect(screen.getByText('Pending 1st Milestone')).toBeInTheDocument();
    expect(screen.getByText('-- Days')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Estimation activates automatically once the first step is completed based on empirical velocity/i,
      ),
    ).toBeInTheDocument();
  });

  it('renders State 1 when expectedCompletionDays is undefined', () => {
    const snapshot: BffWorkspaceSnapshot = {
      ...baseMockSnapshot,
      expectedCompletionDays: undefined,
    };

    render(<ExpectedDurationCard snapshot={snapshot} />);

    expect(screen.getByText('Pending 1st Milestone')).toBeInTheDocument();
    expect(screen.getByText('-- Days')).toBeInTheDocument();
  });

  it('renders State 2 (In Progress) with active estimation, pace subtitle, and remaining milestone count', () => {
    const snapshot: BffWorkspaceSnapshot = {
      ...baseMockSnapshot,
      expectedCompletionDays: 14,
    };

    render(<ExpectedDurationCard snapshot={snapshot} />);

    expect(screen.getByText('~14 Days')).toBeInTheDocument();
    expect(screen.getByText('Active Pace')).toBeInTheDocument();
    expect(
      screen.getByText(/Based on case pace & template benchmark/i),
    ).toBeInTheDocument();
    // 3 total mandatory, 1 completed => 2 remaining
    expect(screen.getByText(/2 mandatory/i)).toBeInTheDocument();
  });

  it('renders State 2 singular day when expectedCompletionDays is 1', () => {
    const snapshot: BffWorkspaceSnapshot = {
      ...baseMockSnapshot,
      expectedCompletionDays: 1,
    };

    render(<ExpectedDurationCard snapshot={snapshot} />);

    expect(screen.getByText('~1 Day')).toBeInTheDocument();
  });

  it('renders State 3 (Case Completed) when status is Completed', () => {
    const snapshot: BffWorkspaceSnapshot = {
      ...baseMockSnapshot,
      status: 'Completed',
      expectedCompletionDays: 0,
    };

    render(<ExpectedDurationCard snapshot={snapshot} />);

    expect(screen.getByText('Target Met')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('0 Days Remaining')).toBeInTheDocument();
    expect(
      screen.getByText(/All milestones successfully fulfilled/i),
    ).toBeInTheDocument();
  });

  it('renders State 3 when expectedCompletionDays is 0 even if status is not explicitly Completed', () => {
    const snapshot: BffWorkspaceSnapshot = {
      ...baseMockSnapshot,
      expectedCompletionDays: 0,
    };

    render(<ExpectedDurationCard snapshot={snapshot} />);

    expect(screen.getByText('Target Met')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders Cancelled state when case status is Cancelled', () => {
    const snapshot: BffWorkspaceSnapshot = {
      ...baseMockSnapshot,
      status: 'Cancelled',
      expectedCompletionDays: null,
    };

    render(<ExpectedDurationCard snapshot={snapshot} />);

    expect(screen.getByText('Case Closed')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
    expect(
      screen.getByText(/No remaining duration for cancelled case/i),
    ).toBeInTheDocument();
  });
});
