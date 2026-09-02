import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ParticipantsTab } from './ParticipantsTab';
import type { BffParticipant } from '../../../types/api';

describe('ParticipantsTab & Directory Stakeholder Assignment', () => {
  const mockParticipants: BffParticipant[] = [
    {
      id: 'part_1',
      caseId: 'case_1',
      roleId: 'role-estate-agent',
      roleName: 'Estate Agent & Sales Progressor',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@iceberg-agency.co.uk',
      phone: '+44 20 7946 0912',
      companyName: 'Iceberg Estate Agency',
      isPrimary: true,
      createdAt: new Date().toISOString(),
    },
  ];

  it('renders existing participants list with badges', () => {
    render(
      <ParticipantsTab
        participants={mockParticipants}
        onAssignParticipant={vi.fn()}
        onRemoveParticipant={vi.fn()}
      />,
    );

    expect(screen.getByText('Sarah Jenkins')).toBeDefined();
    expect(screen.getByText('Iceberg Estate Agency')).toBeDefined();
    expect(screen.getByText('Case Stakeholders & Legal Network (1)')).toBeDefined();
  });

  it('opens modal, searches registered directory, and assigns David Vance', async () => {
    const onAssign = vi.fn().mockResolvedValue(undefined);

    render(
      <ParticipantsTab
        participants={mockParticipants}
        onAssignParticipant={onAssign}
        onRemoveParticipant={vi.fn()}
      />,
    );

    // Open modal
    const openBtn = screen.getByText('Assign Stakeholder / Solicitor');
    act(() => {
      fireEvent.click(openBtn);
    });

    expect(
      screen.getByText('Assign Stakeholder from Registered Directory'),
    ).toBeDefined();

    // Type in search bar to filter for "David"
    const searchInput = screen.getByPlaceholderText(
      'Search by name, company, role, or email...',
    );
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'David' } });
    });

    // David Vance card should be visible
    expect(screen.getByText('David Vance')).toBeDefined();
    expect(screen.getByText(/Vance & Co Legal Partners/)).toBeDefined();

    // Click on David Vance to select him
    act(() => {
      fireEvent.click(screen.getByText('David Vance'));
    });

    // Check summary box shows "Ready to link: David Vance (Vance & Co Legal Partners)"
    expect(
      screen.getByText(/Ready to link: David Vance/),
    ).toBeDefined();

    // Submit assignment
    const submitBtn = screen.getByTestId('assign-stakeholder-submit-btn');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(onAssign).toHaveBeenCalledWith(
      expect.objectContaining({
        contactId: 'usr_buyer_sol_3',
        name: 'David Vance',
        email: 'david.vance@vance-legal.co.uk',
        companyName: 'Vance & Co Legal Partners',
        isPrimary: true,
      }),
    );
  });
});
