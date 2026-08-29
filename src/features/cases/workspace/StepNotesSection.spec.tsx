import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepNotesSection } from './StepNotesSection';
import type { NoteSnapshot, BffParticipant } from '../../../types/api';

const mockNotes: NoteSnapshot[] = [
  {
    id: 'note-1',
    caseId: 'case-1',
    stepId: 'step-101',
    authorId: 'user-agent-1',
    authorName: 'Sarah Jenkins',
    authorRole: 'Estate Agent',
    content: 'Searches submitted to local authority.',
    isPrivate: false,
    visibleToParticipantIds: [],
    createdAt: '2026-08-29T10:00:00Z',
  },
  {
    id: 'note-2',
    caseId: 'case-1',
    stepId: 'step-101',
    authorId: 'user-agent-1',
    authorName: 'Sarah Jenkins',
    authorRole: 'Estate Agent',
    content: 'Private note regarding buyer solicitor response time.',
    isPrivate: true,
    visibleToParticipantIds: ['part-1'],
    createdAt: '2026-08-29T11:00:00Z',
  },
];

const mockParticipants: BffParticipant[] = [
  {
    id: 'part-1',
    name: 'David Reynolds',
    roleName: 'Vendor Solicitor',
    roleId: 'role-vendor-solicitor',
  },
];

describe('StepNotesSection', () => {
  it('renders step notes count and lists existing notes', () => {
    render(
      <StepNotesSection
        stepId="step-101"
        stepName="Property Searches"
        notes={mockNotes}
        participants={mockParticipants}
        onAddNote={vi.fn()}
      />,
    );

    expect(screen.getByText('Step Operational Notes')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(
      screen.getByText('Searches submitted to local authority.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Private note regarding buyer solicitor response time.'),
    ).toBeInTheDocument();
  });

  it('submits a new public step note', async () => {
    const handleAddNote = vi.fn().mockResolvedValue(undefined);
    render(
      <StepNotesSection
        stepId="step-101"
        stepName="Property Searches"
        notes={[]}
        participants={mockParticipants}
        onAddNote={handleAddNote}
      />,
    );

    // Open composer
    const addNoteBtn = screen.getByRole('button', { name: /Add Step Note/i });
    fireEvent.click(addNoteBtn);

    const textarea = screen.getByPlaceholderText(
      /Record an operational memo/i,
    );
    fireEvent.change(textarea, {
      target: { value: 'Environmental search pack returned with no adverse findings.' },
    });

    const submitBtn = screen.getByRole('button', { name: /Save Step Note/i });
    fireEvent.click(submitBtn);

    expect(handleAddNote).toHaveBeenCalledWith({
      stepId: 'step-101',
      content:
        'Environmental search pack returned with no adverse findings.',
      isPrivate: false,
      visibleToParticipantIds: [],
    });
  });
});
