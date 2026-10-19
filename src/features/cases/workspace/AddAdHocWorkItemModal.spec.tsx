import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddAdHocWorkItemModal } from './AddAdHocWorkItemModal';

describe('AddAdHocWorkItemModal', () => {
  const mockRoles = [
    { id: 'role-buyer-solicitor', name: "Buyer's Solicitor" },
    { id: 'role-vendor-solicitor', name: "Seller's Solicitor" },
  ];

  it('renders form fields with step name and roles', () => {
    render(
      <AddAdHocWorkItemModal
        isOpen={true}
        stepName="Legal Enquiries"
        roles={mockRoles}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting={false}
      />,
    );

    expect(screen.getByText('Add Custom Task')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Adding a custom task to milestone step: "Legal Enquiries"/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Task Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Requirement Level/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Responsible Stakeholder Role/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Add Task/i }),
    ).toBeInTheDocument();
  });

  it('validates empty task name', async () => {
    const handleSubmit = vi.fn();
    render(
      <AddAdHocWorkItemModal
        isOpen={true}
        stepName="Legal Enquiries"
        roles={mockRoles}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
        isSubmitting={false}
      />,
    );

    const submitBtn = screen.getByRole('button', { name: /Add Task/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Task name is required.')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('submits valid task payload', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <AddAdHocWorkItemModal
        isOpen={true}
        stepName="Legal Enquiries"
        roles={mockRoles}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
        isSubmitting={false}
      />,
    );

    const nameInput = screen.getByLabelText(/Task Name/i);
    fireEvent.change(nameInput, {
      target: { value: 'Verify indemnity insurance' },
    });

    const roleSelect = screen.getByLabelText(/Responsible Stakeholder Role/i);
    fireEvent.change(roleSelect, {
      target: { value: 'role-buyer-solicitor' },
    });

    const evidenceCheckbox = screen.getByLabelText(
      /Evidence Document Required/i,
    );
    fireEvent.click(evidenceCheckbox);

    const submitBtn = screen.getByRole('button', { name: /Add Task/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        name: 'Verify indemnity insurance',
        requirement: 'optional',
        evidenceRequired: true,
        ownerRoleId: 'role-buyer-solicitor',
        targetDate: undefined,
      });
    });
  });
});
