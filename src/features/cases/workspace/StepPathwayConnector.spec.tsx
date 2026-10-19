import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StepPathwayConnector } from './StepPathwayConnector';
import type { BffWorkspaceStep } from '../../../types/api';

describe('StepPathwayConnector', () => {
  const stepA: BffWorkspaceStep = {
    id: 'step-1',
    stepDefinitionId: 'def-1',
    name: 'Conveyancer Instruction & Legal Pack',
    status: 'Completed',
    displayOrder: 2,
    dependencyJoinType: 'ALL',
    dependencies: [],
    workItems: [],
    allowedActions: [],
  };

  const stepB: BffWorkspaceStep = {
    id: 'step-2',
    stepDefinitionId: 'def-2',
    name: 'Mortgage & Valuation / Survey',
    status: 'InProgress',
    displayOrder: 3,
    dependencyJoinType: 'ALL',
    dependencies: ['step-1'],
    workItems: [],
    allowedActions: [],
  };

  it('renders completed to in-progress connector pill with cleared status and stage info', () => {
    render(
      <StepPathwayConnector
        currentStep={stepA}
        nextStep={stepB}
        stepIndex={0}
        totalSteps={2}
      />,
    );

    expect(
      screen.getByText(/Milestone 2 Cleared • Active Stage 3/i),
    ).toBeInTheDocument();
  });

  it('renders linear progression pathway between active steps', () => {
    const activeStepA = { ...stepA, status: 'InProgress' as const };
    render(
      <StepPathwayConnector
        currentStep={activeStepA}
        nextStep={stepB}
        stepIndex={0}
        totalSteps={2}
      />,
    );

    expect(
      screen.getByText(/Linear Progression Pathway → Milestone 3/i),
    ).toBeInTheDocument();
  });

  it('renders unlock information when previous step is in progress and next step is pending', () => {
    const activeStepA = { ...stepA, status: 'InProgress' as const };
    const pendingStepB = { ...stepB, status: 'Pending' as const };
    render(
      <StepPathwayConnector
        currentStep={activeStepA}
        nextStep={pendingStepB}
        stepIndex={0}
        totalSteps={2}
      />,
    );

    expect(
      screen.getByText(/Unlocks after Milestone 2 completion/i),
    ).toBeInTheDocument();
  });

  it('renders cleared status when previous step is completed and next is pending', () => {
    const pendingStepB = { ...stepB, status: 'Pending' as const };
    render(
      <StepPathwayConnector
        currentStep={stepA}
        nextStep={pendingStepB}
        stepIndex={0}
        totalSteps={2}
      />,
    );

    expect(
      screen.getByText(/Milestone 2 Cleared → Pending Milestone 3/i),
    ).toBeInTheDocument();
  });
});
