import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CasesPage } from './CasesPage';
import * as apiClient from '../../lib/api-client';
import type { BffCaseListResponse } from '../../types/api';

const mockResponse: BffCaseListResponse = {
  contractVersion: '1.0.0',
  generatedAt: '2026-08-21T10:00:00.000Z',
  items: [
    {
      id: 'case-test-quick-01',
      caseTypeId: 'ct-sales-01',
      caseTypeName: 'UK Residential Sales Progression',
      title: '100 King Street, Manchester',
      reference: 'SP-2026-100',
      status: 'Open',
      statusLabel: 'Open',
      progress: {
        totalSteps: 5,
        completedSteps: 2,
        percentage: 40,
      },
      currentStep: {
        id: 'step-100-2',
        name: 'Searches Ordered',
        status: 'InProgress',
        statusLabel: 'In Progress',
      },
      blockersCount: 0,
      createdAt: '2026-08-15T09:00:00Z',
      allowedActions: ['HOLD', 'COMPLETE', 'CANCEL'],
    },
  ],
  meta: {
    totalCount: 1,
    hasMore: false,
  },
  availableFilters: {
    statuses: ['Open', 'OnHold', 'Completed', 'Cancelled'],
    caseTypes: [
      { id: 'ct-sales-01', name: 'UK Residential Sales Progression' },
    ],
  },
};

describe('Case Quick Actions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders quick action buttons matching allowedActions', async () => {
    vi.spyOn(apiClient, 'fetchCaseList').mockResolvedValue(mockResponse);

    render(
      <MemoryRouter>
        <CasesPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText('100 King Street, Manchester'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hold/i })).toBeInTheDocument();
  });

  it('opens confirmation modal and executes status mutation on confirm', async () => {
    vi.spyOn(apiClient, 'fetchCaseList').mockResolvedValue(mockResponse);
    const mutateSpy = vi
      .spyOn(apiClient, 'changeCaseStatus')
      .mockResolvedValue({ success: true, status: 'OnHold' });

    render(
      <MemoryRouter>
        <CasesPage />
      </MemoryRouter>,
    );

    await screen.findByText('100 King Street, Manchester');

    // Click Hold button
    const holdBtn = screen.getByRole('button', { name: /hold/i });
    fireEvent.click(holdBtn);

    // Modal should be open
    expect(screen.getByText('Put Case On Hold')).toBeInTheDocument();

    // Type reason
    const reasonInput = screen.getByPlaceholderText(
      /Reason for putting on hold/i,
    );
    fireEvent.change(reasonInput, {
      target: { value: 'Awaiting probate docs' },
    });

    // Confirm
    const confirmBtn = screen.getByRole('button', {
      name: /Confirm & Put On Hold/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledWith('case-test-quick-01', {
        action: 'HOLD',
        reason: 'Awaiting probate docs',
      });
    });
  });
});
