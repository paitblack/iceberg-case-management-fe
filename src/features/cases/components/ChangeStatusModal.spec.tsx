import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ChangeStatusModal } from './ChangeStatusModal';
import type { BffCaseItem } from '../../../types/api';

const mockCaseItem: BffCaseItem = {
  id: 'case-test-101',
  caseTypeId: 'ct-sales',
  caseTypeName: 'Residential Sales Progression',
  title: '42 High Street Sale',
  status: 'Completed',
  statusLabel: 'Completed',
  progress: { totalSteps: 6, completedSteps: 6, percentage: 100 },
  blockersCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
  allowedActions: ['REOPEN'],
};

describe('ChangeStatusModal Component', () => {
  it('renders REOPEN mode with info policy and mandatory reason textarea', () => {
    render(
      <ChangeStatusModal
        isOpen={true}
        onClose={vi.fn()}
        caseItem={mockCaseItem}
        action="REOPEN"
        onConfirm={vi.fn()}
        isLoading={false}
      />,
    );

    expect(screen.getByText('Reopen Case')).toBeInTheDocument();
    expect(screen.getByText(/Reopen Policy/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Reason for reopening this case/i),
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Confirm Reopen/i });
    expect(confirmBtn).toBeDisabled();
  });

  it('enforces minimum 10 characters validation for REOPEN action', async () => {
    const handleConfirm = vi.fn();
    render(
      <ChangeStatusModal
        isOpen={true}
        onClose={vi.fn()}
        caseItem={mockCaseItem}
        action="REOPEN"
        onConfirm={handleConfirm}
        isLoading={false}
      />,
    );

    const textarea = screen.getByPlaceholderText(
      /Please specify the reason for reopening/i,
    );
    const confirmBtn = screen.getByRole('button', { name: /Confirm Reopen/i });

    // Type 5 chars (less than 10)
    act(() => {
      fireEvent.change(textarea, { target: { value: 'short' } });
    });
    expect(confirmBtn).toBeDisabled();
    expect(
      screen.getByText(/Please provide at least 10 characters/i),
    ).toBeInTheDocument();

    // Type 15 chars (valid)
    act(() => {
      fireEvent.change(textarea, {
        target: { value: 'Mortgage approval renewed and chain restored' },
      });
    });
    expect(confirmBtn).not.toBeDisabled();

    // Submit
    await act(async () => {
      fireEvent.click(confirmBtn);
    });
    expect(handleConfirm).toHaveBeenCalledWith(
      'case-test-101',
      'REOPEN',
      'Mortgage approval renewed and chain restored',
    );
  });

  it('renders CANCEL mode with danger button and confirmation', () => {
    render(
      <ChangeStatusModal
        isOpen={true}
        onClose={vi.fn()}
        caseItem={mockCaseItem}
        action="CANCEL"
        onConfirm={vi.fn()}
        isLoading={false}
      />,
    );

    expect(screen.getByText('Cancel Case Workflow')).toBeInTheDocument();
    const cancelBtn = screen.getByRole('button', {
      name: /Confirm & Cancel Case/i,
    });
    expect(cancelBtn).toBeInTheDocument();
    expect(cancelBtn).not.toBeDisabled();
  });
});
