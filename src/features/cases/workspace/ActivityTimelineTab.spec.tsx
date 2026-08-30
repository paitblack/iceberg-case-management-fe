import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivityTimelineTab } from './ActivityTimelineTab';
import * as apiClient from '../../../lib/api-client';
import type { BffCaseActivitiesResponse } from '../../../types/api';

const mockResponse: BffCaseActivitiesResponse = {
  contractVersion: '1.0.0',
  generatedAt: '2026-08-31T00:55:00.000Z',
  items: [
    {
      id: 'log-1',
      caseId: 'case-100',
      category: 'WORK_ITEM',
      action: 'COMPLETE',
      title: 'Work Item Completed',
      description: 'Work item "Verify Passport" was completed.',
      actor: {
        id: 'user-1',
        name: 'Sarah Jenkins',
        role: 'Estate Agent',
      },
      metadata: {
        stepName: 'ID & AML Verification',
        workItemName: 'Verify Passport',
      },
      createdAt: '2026-08-31T00:50:00.000Z',
    },
    {
      id: 'log-2',
      caseId: 'case-100',
      category: 'CASE_LIFECYCLE',
      action: 'HOLD',
      title: 'Case Put On Hold',
      description: 'Case was put on hold: Awaiting survey.',
      actor: {
        id: 'user-1',
        name: 'Sarah Jenkins',
        role: 'Estate Agent',
      },
      metadata: {
        holdReason: 'Awaiting survey.',
      },
      createdAt: '2026-08-28T09:15:00.000Z',
    },
  ],
  meta: {
    totalCount: 2,
    hasMore: true,
    nextCursor: 'log-2',
  },
  availableCategories: [
    'CASE_LIFECYCLE',
    'STEP',
    'WORK_ITEM',
    'PARTICIPANT',
    'DOCUMENT',
    'COMMUNICATION',
  ],
};

describe('ActivityTimelineTab', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and renders activity timeline events grouped chronologically', async () => {
    vi.spyOn(apiClient, 'fetchCaseActivities').mockResolvedValue(mockResponse);

    render(<ActivityTimelineTab caseId="case-100" />);

    expect(
      screen.getByText(/Loading activity timeline events.../i),
    ).toBeInTheDocument();

    expect(
      await screen.findByText('Work Item Completed'),
    ).toBeInTheDocument();
    expect(screen.getByText('Case Put On Hold')).toBeInTheDocument();
    expect(
      screen.getByText('Work item "Verify Passport" was completed.'),
    ).toBeInTheDocument();
    expect(screen.getByText('2 events logged')).toBeInTheDocument();
  });

  it('filters activities when category filter pill is clicked', async () => {
    const fetchSpy = vi
      .spyOn(apiClient, 'fetchCaseActivities')
      .mockResolvedValue(mockResponse);

    render(<ActivityTimelineTab caseId="case-100" />);

    await screen.findByText('Work Item Completed');

    // Click Tasks category pill
    const tasksPill = screen.getByRole('button', { name: /Tasks/i });
    fireEvent.click(tasksPill);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('case-100', {
        category: 'WORK_ITEM',
        limit: 20,
        cursor: undefined,
      });
    });
  });

  it('loads more activities when clicking Load More button', async () => {
    const fetchSpy = vi
      .spyOn(apiClient, 'fetchCaseActivities')
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce({
        contractVersion: '1.0.0',
        generatedAt: '2026-08-31T01:00:00.000Z',
        items: [
          {
            id: 'log-3',
            caseId: 'case-100',
            category: 'DOCUMENT',
            action: 'CREATE',
            title: 'Document Uploaded',
            description: 'Title Deed uploaded.',
            actor: { name: 'Sarah Jenkins' },
            createdAt: '2026-08-25T12:00:00.000Z',
          },
        ],
        meta: { totalCount: 3, hasMore: false },
        availableCategories: ['DOCUMENT'],
      });

    render(<ActivityTimelineTab caseId="case-100" />);

    await screen.findByText('Work Item Completed');

    const loadMoreBtn = screen.getByRole('button', {
      name: /Load More Activities/i,
    });
    fireEvent.click(loadMoreBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('case-100', {
        category: undefined,
        limit: 20,
        cursor: 'log-2',
      });
    });

    expect(await screen.findByText('Document Uploaded')).toBeInTheDocument();
  });

  it('renders empty state when no activities are returned', async () => {
    vi.spyOn(apiClient, 'fetchCaseActivities').mockResolvedValue({
      contractVersion: '1.0.0',
      generatedAt: '2026-08-31T00:55:00.000Z',
      items: [],
      meta: { totalCount: 0, hasMore: false },
      availableCategories: [],
    });

    render(<ActivityTimelineTab caseId="case-100" />);

    expect(
      await screen.findByText('No Activities Logged Yet'),
    ).toBeInTheDocument();
  });
});
