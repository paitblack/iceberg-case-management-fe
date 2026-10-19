import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

describe('ConfirmDeleteModal', () => {
  it('renders title and description when open', () => {
    render(
      <ConfirmDeleteModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete Custom Step"
        description="Are you sure you want to delete this step?"
      />,
    );

    expect(screen.getByText('Delete Custom Step')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to delete this step?'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const handleConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <ConfirmDeleteModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
        title="Delete Custom Step"
        description="Are you sure you want to delete this step?"
        confirmButtonText="Confirm Delete"
      />,
    );

    const deleteBtn = screen.getByRole('button', { name: /Confirm Delete/i });
    fireEvent.click(deleteBtn);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <ConfirmDeleteModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
        title="Delete Custom Step"
        description="Are you sure you want to delete this step?"
      />,
    );

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
