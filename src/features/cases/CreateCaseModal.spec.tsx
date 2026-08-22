import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CreateCaseModal } from './components/CreateCaseModal';
import * as apiClient from '../../lib/api-client';
import type { PublishedTemplateItem } from '../../types/api';

const mockTemplates: PublishedTemplateItem[] = [
  {
    id: 'tpl-test-sales-v3',
    name: 'UK Residential Sales Progression',
    versionNumber: 3,
    description: '12-stage standard conveyancing progression.',
    caseTypeId: 'ct-sales-01',
    stepCount: 12,
  },
  {
    id: 'tpl-test-appraisal-v1',
    name: 'Market Appraisal & Valuation',
    versionNumber: 1,
    description: 'Vendor proposal workflow.',
    caseTypeId: 'ct-appraisal-01',
    stepCount: 4,
  },
];

describe('CreateCaseModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders template options and preview card', async () => {
    vi.spyOn(apiClient, 'fetchPublishedTemplates').mockResolvedValue(
      mockTemplates,
    );

    render(
      <MemoryRouter>
        <CreateCaseModal isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(/12-stage standard conveyancing progression/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Start New Case Workflow')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/e.g. 42 Woodstock Road Sale Progression/i),
    ).toBeInTheDocument();
  });

  it('validates empty title before submitting', async () => {
    vi.spyOn(apiClient, 'fetchPublishedTemplates').mockResolvedValue(
      mockTemplates,
    );

    render(
      <MemoryRouter>
        <CreateCaseModal isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>,
    );

    await screen.findByText(/12-stage standard conveyancing progression/i);

    const submitBtn = screen.getByRole('button', {
      name: /Launch Case Workflow/i,
    });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/Please enter a descriptive case title/i),
    ).toBeInTheDocument();
  });

  it('calls createCase API with payload and calls onSuccess', async () => {
    vi.spyOn(apiClient, 'fetchPublishedTemplates').mockResolvedValue(
      mockTemplates,
    );
    const createSpy = vi
      .spyOn(apiClient, 'createCase')
      .mockResolvedValue({ id: 'new-case-123', reference: 'CM-2026-999' });
    const successSpy = vi.fn();

    render(
      <MemoryRouter>
        <CreateCaseModal
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={successSpy}
        />
      </MemoryRouter>,
    );

    await screen.findByText(/12-stage standard conveyancing progression/i);

    // Enter title
    const titleInput = screen.getByPlaceholderText(
      /e.g. 42 Woodstock Road Sale Progression/i,
    );
    fireEvent.change(titleInput, {
      target: { value: '99 Oxford High Street - Sale' },
    });

    // Submit
    const submitBtn = screen.getByRole('button', {
      name: /Launch Case Workflow/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '99 Oxford High Street - Sale',
          caseTypeId: 'ct-sales-01',
        }),
      );
      expect(successSpy).toHaveBeenCalledWith('new-case-123');
    });
  });
});
