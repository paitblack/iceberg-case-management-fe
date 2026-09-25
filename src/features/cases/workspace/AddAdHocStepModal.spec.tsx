import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddAdHocStepModal } from './AddAdHocStepModal';

describe('AddAdHocStepModal', () => {
  it('renders form fields when open', () => {
    render(
      <AddAdHocStepModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting={false}
      />,
    );

    expect(screen.getByText('Add Custom Step')).toBeInTheDocument();
    expect(screen.getByLabelText(/Step Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Optional Step/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Create Step/i }),
    ).toBeInTheDocument();
  });

  it('validates required step name on submit', async () => {
    const handleSubmit = vi.fn();
    render(
      <AddAdHocStepModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
        isSubmitting={false}
      />,
    );

    const submitBtn = screen.getByRole('button', { name: /Create Step/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Step name is required.')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('allows adding inline tasks and submits valid payload', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <AddAdHocStepModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        isSubmitting={false}
      />,
    );

    // Enter step name
    const stepNameInput = screen.getByLabelText(/Step Name/i);
    fireEvent.change(stepNameInput, {
      target: { value: 'Structural Timber Survey' },
    });

    // Add inline task
    const addTaskBtn = screen.getByRole('button', { name: /Add Task/i });
    fireEvent.click(addTaskBtn);

    // Type task name
    const taskInput = screen.getByPlaceholderText(
      /Task description \/ title.../i,
    );
    fireEvent.change(taskInput, {
      target: { value: 'Obtain damp and timber report' },
    });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Create Step/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        name: 'Structural Timber Survey',
        isOptional: false,
        placement: 'in_sequence',
        insertAfterStepId: undefined,
        targetDate: undefined,
        workItems: [
          {
            name: 'Obtain damp and timber report',
            requirement: 'optional',
            evidenceRequired: false,
            targetDate: undefined,
          },
        ],
      });
    });
  });

  it('submits with standalone placement when Parallel Track is selected', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <AddAdHocStepModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
        isSubmitting={false}
      />,
    );

    const stepNameInput = screen.getByLabelText(/Step Name/i);
    fireEvent.change(stepNameInput, {
      target: { value: 'Independent Boundary Inspection' },
    });

    const parallelOption = screen.getByText('Parallel Track');
    fireEvent.click(parallelOption);

    const submitBtn = screen.getByRole('button', { name: /Create Step/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        name: 'Independent Boundary Inspection',
        isOptional: false,
        placement: 'standalone',
        insertAfterStepId: undefined,
        targetDate: undefined,
        workItems: undefined,
      });
    });
  });
});
