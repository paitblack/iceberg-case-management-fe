import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CasesPage } from './CasesPage';
import * as apiClient from '../../lib/api-client';
import type { BffCaseListResponse } from '../../types/api';

const mockResponse: BffCaseListResponse = {
  contractVersion: '1.0.0',
  generatedAt: '2026-08-21T10:00:00.000Z',
  items: [
    {
      id: 'case-test-01',
      caseTypeId: 'ct-sales-01',
      caseTypeName: 'UK Residential Sales Progression',
      title: '77 Baker Street, Marylebone',
      reference: 'SP-2026-077',
      status: 'Open',
      statusLabel: 'Open',
      progress: {
        totalSteps: 5,
        completedSteps: 2,
        percentage: 40,
      },
      currentStep: {
        id: 'step-77-2',
        name: 'Searches & Enquiries',
        status: 'InProgress',
        statusLabel: 'In Progress',
      },
      blockersCount: 1,
      createdAt: '2026-08-15T09:00:00Z',
      allowedActions: ['HOLD', 'COMPLETE', 'CANCEL'],
    },
    {
      id: 'case-test-02',
      caseTypeId: 'ct-appraisal-01',
      caseTypeName: 'Market Appraisal & Valuation',
      title: '15 High Street, Oxford',
      reference: 'MA-2026-015',
      status: 'Completed',
      statusLabel: 'Completed',
      progress: {
        totalSteps: 4,
        completedSteps: 4,
        percentage: 100,
      },
      currentStep: {
        id: 'step-15-4',
        name: 'Proposal Accepted',
        status: 'Completed',
        statusLabel: 'Completed',
      },
      blockersCount: 0,
      createdAt: '2026-08-10T11:00:00Z',
      allowedActions: [],
    },
  ],
  meta: {
    totalCount: 2,
    hasMore: false,
  },
  availableFilters: {
    statuses: ['Open', 'OnHold', 'Completed', 'Cancelled'],
    caseTypes: [
      { id: 'ct-sales-01', name: 'UK Residential Sales Progression' },
      { id: 'ct-appraisal-01', name: 'Market Appraisal & Valuation' },
    ],
  },
};

describe('CasesPage & Case List UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and renders case items from BFF response', async () => {
    vi.spyOn(apiClient, 'fetchCaseList').mockResolvedValue(mockResponse);

    render(
      <MemoryRouter initialEntries={['/cases']}>
        <Routes>
          <Route path="/cases" element={<CasesPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText('77 Baker Street, Marylebone'),
    ).toBeInTheDocument();
    expect(screen.getByText('15 High Street, Oxford')).toBeInTheDocument();
    expect(screen.getByText('SP-2026-077')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('filters cases via search bar input', async () => {
    const fetchSpy = vi
      .spyOn(apiClient, 'fetchCaseList')
      .mockResolvedValue(mockResponse);

    render(
      <MemoryRouter initialEntries={['/cases']}>
        <Routes>
          <Route path="/cases" element={<CasesPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByText('77 Baker Street, Marylebone');

    const searchInput = screen.getByPlaceholderText(
      /Search by property address/i,
    );
    fireEvent.change(searchInput, { target: { value: 'Baker' } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Baker' }),
      );
    });
  });

  it('toggles between Table view and Grid card view', async () => {
    vi.spyOn(apiClient, 'fetchCaseList').mockResolvedValue(mockResponse);

    render(
      <MemoryRouter initialEntries={['/cases']}>
        <Routes>
          <Route path="/cases" element={<CasesPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByText('77 Baker Street, Marylebone');

    // Toggle to Grid view
    const gridBtn = screen.getByTitle('Grid Cards View');
    fireEvent.click(gridBtn);

    // Cards should have "Open Workspace"
    expect(await screen.findAllByText(/Open Workspace/i)).toHaveLength(2);

    // Toggle back to Table view
    const tableBtn = screen.getByTitle('Table View');
    fireEvent.click(tableBtn);

    expect(screen.getByText('Case Title & Reference')).toBeInTheDocument();
  });
});
