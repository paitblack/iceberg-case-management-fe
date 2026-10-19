import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';
import * as apiClient from '../../lib/api-client';
import type { BffDashboardSnapshot } from '../../types/api';

const mockDashboardData: BffDashboardSnapshot = {
  contractVersion: '1.0.0',
  generatedAt: '2026-08-21T10:00:00.000Z',
  activeCasesCount: 42,
  activeBlockersCount: 7,
  priorityOperations: [
    {
      caseId: 'case-test-1',
      caseTitle: '10 Downing Street, London',
      currentStepName: 'Contract Exchange Preparation',
      status: 'InProgress',
      statusLabel: 'In Progress',
      dueDate: '2026-08-22T10:00:00.000Z',
    },
  ],
  metrics: {
    avgCycleTimeDays: 35,
    milestonesDueToday: 12,
    pipelineValueAmount: 18500000,
    pipelineValueCurrency: 'GBP',
  },
};

describe('Operations Dashboard UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders all 5 KPI cards from BFF snapshot', async () => {
    vi.spyOn(apiClient, 'fetchDashboardSnapshot').mockResolvedValue(
      mockDashboardData,
    );

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('42')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('35 Days')).toBeInTheDocument();
    expect(screen.getByText('£18.5M')).toBeInTheDocument();
  });

  it('renders priority operations worklist with milestone stage and due date', async () => {
    vi.spyOn(apiClient, 'fetchDashboardSnapshot').mockResolvedValue(
      mockDashboardData,
    );

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText('10 Downing Street, London'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Contract Exchange Preparation'),
    ).toBeInTheDocument();
    expect(screen.getByText('Open Workspace')).toBeInTheDocument();
  });
});
