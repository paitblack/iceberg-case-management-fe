import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CommunicationsTab } from './CommunicationsTab';
import type { BffParticipant, BffCaseCommunication } from '../../../types/api';

describe('CommunicationsTab - AI Outreach & Branded Email Template', () => {
  const mockParticipants: BffParticipant[] = [
    {
      id: 'part-1',
      name: 'David Vance',
      email: 'david.vance@vancelaw.co.uk',
      phone: '+44 20 7946 0912',
      roleId: 'role-buyer-conveyancer',
      roleName: "Buyer's Conveyancer",
      companyName: 'Vance Legal LLP',
      isPrimary: true,
    },
    {
      id: 'part-2',
      name: 'Emily Smith',
      email: 'emily.smith@example.com',
      phone: '+44 7700 900123',
      roleId: 'role-buyer',
      roleName: 'Buyer',
      isPrimary: true,
    },
  ];

  const mockCommunications: BffCaseCommunication[] = [
    {
      id: 'comm-101',
      caseId: 'case-1',
      stepId: 'step-1',
      workItemId: 'wi-1',
      recipientEmail: 'david.vance@vancelaw.co.uk',
      recipientName: 'David Vance',
      recipientRole: "Buyer's Conveyancer",
      senderName: 'Sarah Jenkins',
      senderRole: 'Sales Progressor',
      senderEmail: 'sarah.jenkins@iceberg-digital.co.uk',
      senderPhone: '+44 20 7946 0001',
      subject: 'Urgent: Proof of Funds Required - 14 Primrose Hill',
      bodyText: 'Dear David,\n\nPlease provide the requested documentation.\n\nKind regards,\nSarah',
      status: 'SENT_SIMULATED',
      intent: 'DOCUMENT_REQUEST',
      createdAt: '2026-09-23T10:00:00Z',
    },
  ];

  it('renders recipient selector, Iceberg branded template card, and sent history', () => {
    render(
      <CommunicationsTab
        caseId="case-1"
        caseTitle="14 Primrose Hill, London"
        participants={mockParticipants}
        communications={mockCommunications}
        onSendCommunication={vi.fn()}
        onGenerateDraft={vi.fn()}
      />,
    );

    expect(screen.getByText(/Communications & Chasing Hub/i)).toBeInTheDocument();
    expect(screen.getAllByText(/ICEBERG DIGITAL/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/14 Primrose Hill, London/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/David Vance/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Outbox & History/i)).toBeInTheDocument();
    expect(screen.getByText(/Urgent: Proof of Funds Required - 14 Primrose Hill/i)).toBeInTheDocument();
  });

  it('calls onGenerateDraft when Generate AI Draft button is clicked and populates editor', async () => {
    const handleGenerateDraft = vi.fn().mockResolvedValue({
      subject: 'Action Required: Proof of Funds - 14 Primrose Hill',
      bodyText: 'Dear David Vance,\n\nWe require the Proof of Funds to complete Step 1.\n\nKind regards,\nSarah Jenkins',
      bodyHtml: '<p>Dear David Vance,</p><p>We require the Proof of Funds to complete Step 1.</p>',
    });

    render(
      <CommunicationsTab
        caseId="case-1"
        caseTitle="14 Primrose Hill, London"
        participants={mockParticipants}
        communications={[]}
        onSendCommunication={vi.fn()}
        onGenerateDraft={handleGenerateDraft}
      />,
    );

    const generateBtn = screen.getByRole('button', {
      name: /Generate with AI/i,
    });
    fireEvent.click(generateBtn);

    expect(handleGenerateDraft).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue(/Action Required: Proof of Funds - 14 Primrose Hill/i),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByDisplayValue(/We require the Proof of Funds to complete Step 1/i),
    ).toBeInTheDocument();
  });

  it('allows user to edit subject and body, then sends communication successfully', async () => {
    const handleSend = vi.fn().mockResolvedValue(undefined);

    render(
      <CommunicationsTab
        caseId="case-1"
        caseTitle="14 Primrose Hill, London"
        participants={mockParticipants}
        communications={[]}
        onSendCommunication={handleSend}
        onGenerateDraft={vi.fn()}
      />,
    );

    const subjectInput = screen.getByPlaceholderText(/Email subject line/i);
    fireEvent.change(subjectInput, {
      target: { value: 'Custom Subject - Update on Searches' },
    });

    const bodyTextarea = screen.getByPlaceholderText(/Write or generate your email body/i);
    fireEvent.change(bodyTextarea, {
      target: { value: 'Hi David,\n\nHere is a quick custom note.\n\nThanks,\nSarah' },
    });

    const sendBtn = screen.getByRole('button', {
      name: /Send to \d+ Stakeholder/i,
    });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(handleSend).toHaveBeenCalledTimes(1);
    });

    expect(handleSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Custom Subject - Update on Searches',
        bodyText: expect.stringContaining('Here is a quick custom note'),
        recipientEmail: 'david.vance@vancelaw.co.uk',
        recipientName: 'David Vance',
      }),
    );
  });

  it('renders extendable accordion for multi-stakeholder dispatches in outbox history', () => {
    const multiRecipientComms: BffCaseCommunication[] = [
      {
        id: 'comm-group-1',
        caseId: 'case-1',
        recipientEmail: 'david.vance@vancelaw.co.uk',
        recipientName: 'David Vance',
        recipientRole: "Buyer's Conveyancer",
        senderName: 'Sarah Jenkins',
        senderRole: 'Sales Progressor',
        subject: 'Task Complete: Local Authority Search Received',
        bodyText: 'Search has been received and verified.',
        status: 'SENT_SIMULATED',
        intent: 'PROGRESS_UPDATE',
        createdAt: '2026-09-23T11:00:00Z',
      },
      {
        id: 'comm-group-2',
        caseId: 'case-1',
        recipientEmail: 'emily.smith@example.com',
        recipientName: 'Emily Smith',
        recipientRole: 'Buyer',
        senderName: 'Sarah Jenkins',
        senderRole: 'Sales Progressor',
        subject: 'Task Complete: Local Authority Search Received',
        bodyText: 'Search has been received and verified.',
        status: 'SENT_SIMULATED',
        intent: 'PROGRESS_UPDATE',
        createdAt: '2026-09-23T11:00:01Z',
      },
    ];

    render(
      <CommunicationsTab
        caseId="case-1"
        caseTitle="14 Primrose Hill, London"
        participants={mockParticipants}
        communications={multiRecipientComms}
        onSendCommunication={vi.fn()}
        onGenerateDraft={vi.fn()}
      />,
    );

    // Primary recipient rendered
    expect(screen.getAllByText(/David Vance/i).length).toBeGreaterThan(0);
    // Expand toggle button rendered with "+1 stakeholders"
    const toggleButton = screen.getByRole('button', {
      name: /Toggle stakeholders list/i,
    });
    expect(toggleButton).toHaveTextContent('+1 stakeholders');

    // Click to expand stakeholders
    fireEvent.click(toggleButton);

    // Secondary recipient Emily Smith now visible in the accordion list
    expect(screen.getByText(/All Stakeholders \(2\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Emily Smith/i).length).toBeGreaterThan(0);

    // Click again to collapse
    fireEvent.click(toggleButton);
    expect(screen.queryByText(/All Stakeholders \(2\)/i)).not.toBeInTheDocument();
  });
});

