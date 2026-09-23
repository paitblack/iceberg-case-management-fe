import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WorkItemOutreachModal } from './WorkItemOutreachModal';
import type {
  BffParticipant,
  BffWorkspaceWorkItem,
} from '../../../types/api';

describe('WorkItemOutreachModal - Question Prompt Modal', () => {
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

  const mockWorkItem: BffWorkspaceWorkItem = {
    id: 'wi-101',
    name: 'Local Authority Search Received',
    description: 'Received official local land charges search results from council.',
    status: 'Completed',
    requirement: 'required',
    allowedActions: ['COMPLETE'],
  };

  it('renders question modal with task details and stakeholder prompt', () => {
    render(
      <WorkItemOutreachModal
        isOpen={true}
        onClose={vi.fn()}
        workItem={mockWorkItem}
        stepName="Searches & Enquiries"
        stepId="step-2"
        caseTitle="14 Primrose Hill, London"
        caseId="case-100"
        participants={mockParticipants}
        onOpenInHub={vi.fn()}
      />,
    );

    expect(screen.getByText(/Notify Stakeholders\?/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Local Authority Search Received/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Milestone: Searches & Enquiries/i)).toBeInTheDocument();
    expect(screen.getByText(/Would you like to open the/i)).toBeInTheDocument();
    expect(screen.getByText(/David Vance/i)).toBeInTheDocument();
    expect(screen.getByText(/Emily Smith/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Communications Hub/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Skip \/ Do Not Notify/i })).toBeInTheDocument();
  });

  it('navigates to Communications Hub with pre-filled step and work item context when confirmed', () => {
    const handleOpenInHub = vi.fn();
    const handleClose = vi.fn();

    render(
      <WorkItemOutreachModal
        isOpen={true}
        onClose={handleClose}
        workItem={mockWorkItem}
        stepName="Searches & Enquiries"
        stepId="step-2"
        caseTitle="14 Primrose Hill, London"
        caseId="case-100"
        participants={mockParticipants}
        onOpenInHub={handleOpenInHub}
      />,
    );

    const openHubBtn = screen.getByRole('button', { name: /Open Communications Hub/i });
    fireEvent.click(openHubBtn);

    expect(handleOpenInHub).toHaveBeenCalledTimes(1);
    expect(handleOpenInHub).toHaveBeenCalledWith({
      stepId: 'step-2',
      stepName: 'Searches & Enquiries',
      workItemId: 'wi-101',
      workItemName: 'Local Authority Search Received',
      evidenceRequired: undefined,
      intent: 'PROGRESS_UPDATE',
    });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('closes modal without navigating to Communications Hub when Skip is clicked', () => {
    const handleOpenInHub = vi.fn();
    const handleClose = vi.fn();

    render(
      <WorkItemOutreachModal
        isOpen={true}
        onClose={handleClose}
        workItem={mockWorkItem}
        stepName="Searches & Enquiries"
        stepId="step-2"
        caseTitle="14 Primrose Hill, London"
        caseId="case-100"
        participants={mockParticipants}
        onOpenInHub={handleOpenInHub}
      />,
    );

    const skipBtn = screen.getByRole('button', { name: /Skip \/ Do Not Notify/i });
    fireEvent.click(skipBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleOpenInHub).not.toHaveBeenCalled();
  });
});
