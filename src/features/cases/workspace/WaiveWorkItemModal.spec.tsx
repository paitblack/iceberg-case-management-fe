import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WaiveWorkItemModal } from './WaiveWorkItemModal';

describe('WaiveWorkItemModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    workItemName: 'Obtain Local Authority Search Results',
    stepName: 'Property Searches & Enquiries',
    targetRoleDisplayName: 'Buyer Solicitor',
  };

  it('renders modal details and warning notice', () => {
    render(<WaiveWorkItemModal {...defaultProps} />);

    expect(
      screen.getByRole('dialog', { name: /Waive Checkpoint Task/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Obtain Local Authority Search Results'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Property Searches & Enquiries'),
    ).toBeInTheDocument();
    expect(screen.getByText('Buyer Solicitor')).toBeInTheDocument();
    expect(
      screen.getByText(/Waiving permanently bypasses this checkpoint/i),
    ).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<WaiveWorkItemModal {...defaultProps} isOpen={false} />);
    expect(
      screen.queryByRole('dialog', { name: /Waive Checkpoint Task/i }),
    ).not.toBeInTheDocument();
  });

  it('validates minimum reason length before submitting', () => {
    const onConfirm = vi.fn();
    render(<WaiveWorkItemModal {...defaultProps} onConfirm={onConfirm} />);

    const confirmBtn = screen.getByRole('button', {
      name: /Confirm Waive Task/i,
    });
    // Button is disabled when reason is empty
    expect(confirmBtn).toBeDisabled();

    const textarea = screen.getByLabelText(/Business Justification \/ Note/i);
    fireEvent.change(textarea, { target: { value: 'ab' } });

    // Submit form directly to test validation check
    fireEvent.submit(textarea.closest('form') as HTMLFormElement);

    expect(
      screen.getByText(/Waive reason must be at least 5 characters long/i),
    ).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('populates textarea when clicking a quick reason chip', () => {
    render(<WaiveWorkItemModal {...defaultProps} />);

    const quickChip = screen.getByRole('button', {
      name: /Indemnity insurance policy obtained/i,
    });
    fireEvent.click(quickChip);

    const textarea = screen.getByLabelText(
      /Business Justification \/ Note/i,
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe('Indemnity insurance policy obtained');
  });

  it('calls onConfirm with reason on successful submission', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<WaiveWorkItemModal {...defaultProps} onConfirm={onConfirm} />);

    const textarea = screen.getByLabelText(/Business Justification \/ Note/i);
    fireEvent.change(textarea, {
      target: { value: 'Client agreed to alternative indemnity arrangement' },
    });

    const confirmBtn = screen.getByRole('button', {
      name: /Confirm Waive Task/i,
    });
    expect(confirmBtn).not.toBeDisabled();

    fireEvent.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledWith(
      'Client agreed to alternative indemnity arrangement',
    );
  });

  it('invokes onClose when clicking Cancel button or Escape key', () => {
    const onClose = vi.fn();
    render(<WaiveWorkItemModal {...defaultProps} onClose={onClose} />);

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
