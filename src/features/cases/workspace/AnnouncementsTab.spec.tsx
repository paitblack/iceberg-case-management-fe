import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnnouncementsTab } from './AnnouncementsTab';
import type {
  AnnouncementTreeSnapshot,
  BffParticipant,
} from '../../../types/api';

const mockAnnouncements: AnnouncementTreeSnapshot[] = [
  {
    id: 'ann-1',
    caseId: 'case-1',
    authorId: 'user-1',
    authorName: 'Sarah Jenkins',
    authorRole: 'Estate Agent',
    content: 'Mortgage valuation completed. Moving to contract exchange.',
    isPrivate: false,
    visibleToParticipantIds: [],
    mentionedParticipantName: 'Marcus Vance',
    createdAt: '2026-08-29T10:00:00Z',
    replies: [
      {
        id: 'reply-1',
        parentId: 'ann-1',
        caseId: 'case-1',
        authorId: 'user-2',
        authorName: 'David Reynolds',
        authorRole: 'Vendor Solicitor',
        content: 'Draft contracts ready for signature.',
        isPrivate: false,
        visibleToParticipantIds: [],
        mentionedParticipantName: 'Sarah Jenkins',
        createdAt: '2026-08-29T10:30:00Z',
      },
    ],
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

describe('AnnouncementsTab', () => {
  it('renders announcement thread with root and reply mentions', () => {
    render(
      <AnnouncementsTab
        announcements={mockAnnouncements}
        participants={mockParticipants}
        onPostAnnouncement={vi.fn()}
        onPostReply={vi.fn()}
      />,
    );

    expect(
      screen.getByText('Discussions & Announcements'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Mortgage valuation completed. Moving to contract exchange.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Draft contracts ready for signature.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/@Marcus Vance/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/@Sarah Jenkins/i),
    ).toBeInTheDocument();
  });

  it('posts a new root announcement', async () => {
    const handlePostAnnouncement = vi.fn().mockResolvedValue(undefined);
    render(
      <AnnouncementsTab
        announcements={[]}
        participants={mockParticipants}
        onPostAnnouncement={handlePostAnnouncement}
        onPostReply={vi.fn()}
      />,
    );

    const textarea = screen.getByPlaceholderText(
      /Share a case announcement, mortgage update/i,
    );
    fireEvent.change(textarea, {
      target: { value: 'Target completion confirmed for 15th September.' },
    });

    const submitBtn = screen.getByRole('button', {
      name: /Post Announcement/i,
    });
    fireEvent.click(submitBtn);

    expect(handlePostAnnouncement).toHaveBeenCalledWith({
      content: 'Target completion confirmed for 15th September.',
      isPrivate: false,
      visibleToParticipantIds: [],
    });
  });

  it('opens reply composer and posts reply to an announcement', async () => {
    const handlePostReply = vi.fn().mockResolvedValue(undefined);
    render(
      <AnnouncementsTab
        announcements={mockAnnouncements}
        participants={mockParticipants}
        onPostAnnouncement={vi.fn()}
        onPostReply={handlePostReply}
      />,
    );

    const replyBtn = screen.getByRole('button', { name: /^Reply$/i });
    fireEvent.click(replyBtn);

    const replyTextarea = screen.getByPlaceholderText(
      /Write a targeted response/i,
    );
    fireEvent.change(replyTextarea, {
      target: { value: 'Understood, client is reviewing today.' },
    });

    const postReplyBtn = screen.getByRole('button', {
      name: /Post Reply/i,
    });
    fireEvent.click(postReplyBtn);

    expect(handlePostReply).toHaveBeenCalledWith('ann-1', {
      content: 'Understood, client is reviewing today.',
      isPrivate: false,
      visibleToParticipantIds: [],
      mentionedParticipantId: undefined,
    });
  });

  it('filters out current user from mentionable participants dropdown to prevent self-mentions', () => {
    const participantsWithSelf: BffParticipant[] = [
      {
        id: 'part-self',
        name: 'Sarah Jenkins',
        contactId: 'usr_1',
        roleName: 'Estate Agent',
        roleId: 'role-estate-agent',
      },
      {
        id: 'part-other',
        name: 'Marcus Cole',
        contactId: 'usr_agent_2',
        roleName: 'Estate Agent',
        roleId: 'role-estate-agent',
      },
    ];

    render(
      <AnnouncementsTab
        announcements={[]}
        participants={participantsWithSelf}
        onPostAnnouncement={vi.fn()}
        onPostReply={vi.fn()}
      />,
    );

    const select = screen.getByRole('combobox');
    const options = Array.from(select.querySelectorAll('option')).map(
      (opt) => opt.textContent,
    );

    expect(options.some((opt) => opt?.includes('Marcus Cole'))).toBe(true);
    expect(options.some((opt) => opt?.includes('Sarah Jenkins'))).toBe(false);
  });
});

