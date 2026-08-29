import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VisibilitySelector } from './VisibilitySelector';
import type { BffParticipant } from '../../../types/api';

const mockParticipants: BffParticipant[] = [
  {
    id: 'part-1',
    name: 'David Reynolds',
    roleName: 'Vendor Solicitor',
    companyName: 'Reynolds & Co Legal',
    roleId: 'role-vendor-solicitor',
  },
  {
    id: 'part-2',
    name: 'Sarah Jenkins',
    roleName: 'Buyer Solicitor',
    companyName: 'Jenkins Law',
    roleId: 'role-buyer-solicitor',
  },
];

describe('VisibilitySelector', () => {
  it('renders Public and Private toggle buttons', () => {
    render(
      <VisibilitySelector
        isPrivate={false}
        onChangeIsPrivate={vi.fn()}
        visibleToParticipantIds={[]}
        onChangeVisibleParticipants={vi.fn()}
        participants={mockParticipants}
      />,
    );

    expect(screen.getByText(/Public/i)).toBeInTheDocument();
    expect(screen.getByText(/Private/i)).toBeInTheDocument();
  });

  it('switches to Private mode and expands participant checkbox selection', () => {
    const handleChangeIsPrivate = vi.fn();
    render(
      <VisibilitySelector
        isPrivate={false}
        onChangeIsPrivate={handleChangeIsPrivate}
        visibleToParticipantIds={[]}
        onChangeVisibleParticipants={vi.fn()}
        participants={mockParticipants}
      />,
    );

    const privateBtn = screen.getByRole('button', { name: /Private/i });
    fireEvent.click(privateBtn);
    expect(handleChangeIsPrivate).toHaveBeenCalledWith(true);
  });

  it('allows selecting individual participants when in Private mode', () => {
    const handleSelectParticipants = vi.fn();
    render(
      <VisibilitySelector
        isPrivate={true}
        onChangeIsPrivate={vi.fn()}
        visibleToParticipantIds={['part-1']}
        onChangeVisibleParticipants={handleSelectParticipants}
        participants={mockParticipants}
      />,
    );

    expect(screen.getByText('David Reynolds')).toBeInTheDocument();
    expect(screen.getByText('Sarah Jenkins')).toBeInTheDocument();

    // Toggle Sarah Jenkins
    const sarahBtn = screen.getByText('Sarah Jenkins').closest('button');
    expect(sarahBtn).toBeInTheDocument();
    if (sarahBtn) {
      fireEvent.click(sarahBtn);
      expect(handleSelectParticipants).toHaveBeenCalledWith(['part-1', 'part-2']);
    }
  });

  it('supports Select All and Clear shortcuts in Private mode', () => {
    const handleSelectParticipants = vi.fn();
    render(
      <VisibilitySelector
        isPrivate={true}
        onChangeIsPrivate={vi.fn()}
        visibleToParticipantIds={[]}
        onChangeVisibleParticipants={handleSelectParticipants}
        participants={mockParticipants}
      />,
    );

    const selectAllBtn = screen.getByText(/Select All/i);
    fireEvent.click(selectAllBtn);
    expect(handleSelectParticipants).toHaveBeenCalledWith(['part-1', 'part-2']);

    const clearBtn = screen.getByText(/Clear/i);
    fireEvent.click(clearBtn);
    expect(handleSelectParticipants).toHaveBeenCalledWith([]);
  });
});
