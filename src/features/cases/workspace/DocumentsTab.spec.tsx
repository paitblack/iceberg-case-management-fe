import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DocumentsTab } from './DocumentsTab';
import * as AuthContextModule from '../../auth/AuthContext';
import type { BffCaseDocument, BffWorkspaceStep } from '../../../types/api';
import type { UserPersona } from '../../../types/auth';

describe('DocumentsTab - Document Deletion and Evidence Lifecycle', () => {
  const mockDocs: BffCaseDocument[] = [
    {
      id: 'doc-gen-1',
      fileName: 'floorplan.pdf',
      fileSizeBytes: 2048,
      fileType: 'application/pdf',
      category: 'General',
      uploadedAt: '2026-09-22T10:00:00Z',
      uploadedByName: 'Marcus Cole',
    },
    {
      id: 'doc-pending-2',
      workItemId: 'wi-pending-1',
      fileName: 'proof_of_funds.pdf',
      fileSizeBytes: 4096,
      fileType: 'application/pdf',
      category: 'Evidence',
      uploadedAt: '2026-09-22T11:00:00Z',
      uploadedByName: 'Marcus Cole',
    },
    {
      id: 'doc-completed-3',
      workItemId: 'wi-completed-1',
      fileName: 'aml_identity.pdf',
      fileSizeBytes: 1024,
      fileType: 'application/pdf',
      category: 'Evidence',
      uploadedAt: '2026-09-22T09:00:00Z',
      uploadedByName: 'Marcus Cole',
    },
  ];

  const mockSteps: BffWorkspaceStep[] = [
    {
      id: 'step-1',
      stepDefinitionId: 'step-def-1',
      name: 'Financial Due Diligence',
      status: 'InProgress',
      displayOrder: 1,
      dependencyJoinType: 'ALL',
      isOptional: false,
      isStandalone: false,
      isAdHoc: false,
      dependencies: [],
      isBlocked: false,
      slaStatus: 'ON_TRACK',
      notes: [],
      allowedActions: [],
      workItems: [
        {
          id: 'wi-pending-1',
          workItemDefinitionId: 'def-1',
          name: 'Verify Proof of Funds',
          requirement: 'required',
          status: 'Pending',
          statusLabel: 'Pending',
          evidenceRequired: true,
          isAdHoc: false,
          slaStatus: 'ON_TRACK',
          allowedActions: ['COMPLETE'],
        },
        {
          id: 'wi-completed-1',
          workItemDefinitionId: 'def-2',
          name: 'Verify AML Identity',
          requirement: 'required',
          status: 'Completed',
          statusLabel: 'Completed',
          evidenceRequired: true,
          isAdHoc: false,
          slaStatus: 'ON_TRACK',
          allowedActions: [],
        },
      ],
    },
  ];

  type AuthValue = ReturnType<typeof AuthContextModule.useAuth>;

  const mockAuth = (roles: string[], permissions: string[]): AuthValue => {
    const user: UserPersona = {
      id: 'usr-test',
      name: 'Test Agent',
      email: 'test@example.com',
      companyId: 1001,
      roles,
      permissions,
      description: 'Test User',
      avatarText: 'TA',
      badgeVariant: 'primary',
    };

    return {
      user,
      token: 'mock-token',
      roles,
      permissions,
      isSuperUser: roles.includes('admin') || roles.includes('superuser'),
      availablePersonas: [user],
      switchPersona: vi.fn(),
      setToken: vi.fn(),
      logout: vi.fn(),
    };
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders document library with general and evidence documents', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(
      mockAuth(['Estate Agent'], ['document:delete']),
    );

    render(
      <DocumentsTab
        documents={mockDocs}
        steps={mockSteps}
      />,
    );

    expect(screen.getByText('floorplan.pdf')).toBeInTheDocument();
    expect(screen.getByText('proof_of_funds.pdf')).toBeInTheDocument();
    expect(screen.getByText('aml_identity.pdf')).toBeInTheDocument();
    expect(screen.getByText(/Step 1: Verify Proof of Funds/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 1: Verify AML Identity/i)).toBeInTheDocument();
  });

  it('allows agent to delete general case document via confirmation modal', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(
      mockAuth(['Estate Agent'], ['document:delete']),
    );
    const handleDelete = vi.fn().mockResolvedValue(undefined);

    render(
      <DocumentsTab
        documents={mockDocs}
        steps={mockSteps}
        onDeleteDocument={handleDelete}
      />,
    );

    const deleteBtn = screen.getByRole('button', {
      name: 'Delete floorplan.pdf',
    });
    expect(deleteBtn).toBeInTheDocument();
    expect(deleteBtn).not.toBeDisabled();

    fireEvent.click(deleteBtn);

    expect(
      screen.getByText(/Are you sure you want to permanently delete "floorplan.pdf"\?/i),
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /^Delete Document$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleDelete).toHaveBeenCalledWith('doc-gen-1', 'floorplan.pdf');
    });
  });

  it('disables delete button for completed task evidence when user is not admin', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(
      mockAuth(['role-estate-agent'], ['document:delete']),
    );

    render(
      <DocumentsTab
        documents={mockDocs}
        steps={mockSteps}
        onDeleteDocument={vi.fn()}
      />,
    );

    const completedDocDeleteBtn = screen.getByRole('button', {
      name: /Evidence for a completed milestone task/i,
    });
    expect(completedDocDeleteBtn).toBeDisabled();
  });

  it('allows administrator to delete completed task evidence with audit caution warning', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(
      mockAuth(['admin'], ['document:delete']),
    );
    const handleDelete = vi.fn().mockResolvedValue(undefined);

    render(
      <DocumentsTab
        documents={mockDocs}
        steps={mockSteps}
        onDeleteDocument={handleDelete}
      />,
    );

    const completedDocDeleteBtn = screen.getByRole('button', {
      name: 'Delete aml_identity.pdf',
    });
    expect(completedDocDeleteBtn).not.toBeDisabled();

    fireEvent.click(completedDocDeleteBtn);

    expect(
      screen.getByText(/Caution: "aml_identity.pdf" is verified supporting evidence for completed milestone task "Verify AML Identity"/i),
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /^Delete Document$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleDelete).toHaveBeenCalledWith('doc-completed-3', 'aml_identity.pdf');
    });
  });
});
