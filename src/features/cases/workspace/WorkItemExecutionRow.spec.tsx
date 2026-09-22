import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WorkItemExecutionRow } from './WorkItemExecutionRow';
import type { BffWorkspaceWorkItem, BffCaseDocument } from '../../../types/api';

describe('WorkItemExecutionRow - Evidence Flow', () => {
  const baseWorkItem: BffWorkspaceWorkItem = {
    id: 'wi-101',
    name: 'Verify Client Proof of Funds',
    requirement: 'required',
    status: 'Pending',
    evidenceRequired: true,
    allowedActions: ['COMPLETE', 'WAIVE'],
  };

  it('renders "Upload Evidence" button when evidence is required and no document is attached', () => {
    const handleOpenEvidenceModal = vi.fn();
    const handleAction = vi.fn();

    render(
      <WorkItemExecutionRow
        workItem={baseWorkItem}
        documents={[]}
        isLoading={false}
        onAction={handleAction}
        onOpenEvidenceModal={handleOpenEvidenceModal}
      />,
    );

    const uploadEvidenceBtn = screen.getByRole('button', {
      name: /^Upload Evidence$/i,
    });
    expect(uploadEvidenceBtn).toBeInTheDocument();
    expect(uploadEvidenceBtn).not.toBeDisabled();

    fireEvent.click(uploadEvidenceBtn);
    expect(handleOpenEvidenceModal).toHaveBeenCalledTimes(1);
    expect(handleOpenEvidenceModal).toHaveBeenCalledWith(baseWorkItem);
  });

  it('renders "Complete Task" and evidence badge when evidence document is attached', () => {
    const attachedDoc: BffCaseDocument = {
      id: 'doc-999',
      workItemId: 'wi-101',
      fileName: 'bank_statement.pdf',
      fileSizeBytes: 1024,
      fileType: 'application/pdf',
      category: 'Evidence',
      uploadedAt: '2026-09-22T10:00:00Z',
      uploadedByName: 'Agent Smith',
    };

    const handleAction = vi.fn();

    render(
      <WorkItemExecutionRow
        workItem={baseWorkItem}
        documents={[attachedDoc]}
        isLoading={false}
        onAction={handleAction}
      />,
    );

    expect(screen.getByText(/bank_statement.pdf/i)).toBeInTheDocument();

    const completeBtn = screen.getByRole('button', {
      name: /Complete Task/i,
    });
    expect(completeBtn).toBeInTheDocument();
    expect(completeBtn).not.toBeDisabled();

    fireEvent.click(completeBtn);
    expect(handleAction).toHaveBeenCalledWith('wi-101', 'COMPLETE');
  });

  it('renders standard "Complete Task" button when evidence is not required', () => {
    const normalWorkItem: BffWorkspaceWorkItem = {
      ...baseWorkItem,
      id: 'wi-102',
      name: 'Send Introduction Email',
      evidenceRequired: false,
    };

    const handleAction = vi.fn();

    render(
      <WorkItemExecutionRow
        workItem={normalWorkItem}
        documents={[]}
        isLoading={false}
        onAction={handleAction}
      />,
    );

    const completeBtn = screen.getByRole('button', {
      name: /Complete Task/i,
    });
    expect(completeBtn).toBeInTheDocument();

    fireEvent.click(completeBtn);
    expect(handleAction).toHaveBeenCalledWith('wi-102', 'COMPLETE');
  });

  it('allows removing attached evidence document via confirmation modal', async () => {
    const attachedDoc: BffCaseDocument = {
      id: 'doc-999',
      workItemId: 'wi-101',
      fileName: 'bank_statement.pdf',
      fileSizeBytes: 1024,
      fileType: 'application/pdf',
      category: 'Evidence',
      uploadedAt: '2026-09-22T10:00:00Z',
      uploadedByName: 'Agent Smith',
    };

    const handleDelete = vi.fn().mockResolvedValue(undefined);

    render(
      <WorkItemExecutionRow
        workItem={baseWorkItem}
        documents={[attachedDoc]}
        isLoading={false}
        onAction={vi.fn()}
        onDeleteDocument={handleDelete}
      />,
    );

    const removeBtn = screen.getByRole('button', {
      name: 'Remove evidence document',
    });
    expect(removeBtn).toBeInTheDocument();

    fireEvent.click(removeBtn);

    expect(
      screen.getByText(/Are you sure you want to remove "bank_statement.pdf"/i),
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Remove Evidence' });
    fireEvent.click(confirmBtn);

    expect(handleDelete).toHaveBeenCalledWith('doc-999', 'bank_statement.pdf');
  });

  it('renders "Evidence Missing" badge and allows re-attaching when completed task has missing evidence', () => {
    const completedWorkItem: BffWorkspaceWorkItem = {
      ...baseWorkItem,
      status: 'Completed',
      allowedActions: [],
    };

    const handleOpenEvidenceModal = vi.fn();

    render(
      <WorkItemExecutionRow
        workItem={completedWorkItem}
        documents={[]}
        isLoading={false}
        onAction={vi.fn()}
        onOpenEvidenceModal={handleOpenEvidenceModal}
      />,
    );

    expect(screen.getByText('Evidence Missing')).toBeInTheDocument();
    expect(screen.queryByText('Evidence Required')).not.toBeInTheDocument();
    expect(screen.getByText('✓ Done')).toBeInTheDocument();

    const reattachBtn = screen.getByRole('button', { name: /^Re-attach$/i });
    expect(reattachBtn).toBeInTheDocument();

    fireEvent.click(reattachBtn);
    expect(handleOpenEvidenceModal).toHaveBeenCalledTimes(1);
    expect(handleOpenEvidenceModal).toHaveBeenCalledWith(completedWorkItem);
  });

  it('renders "Chase" button and invokes onChase when clicked', () => {
    const handleChase = vi.fn();

    render(
      <WorkItemExecutionRow
        workItem={baseWorkItem}
        documents={[]}
        isLoading={false}
        onAction={vi.fn()}
        onChase={handleChase}
      />,
    );

    const chaseBtn = screen.getByRole('button', { name: /^Chase$/i });
    expect(chaseBtn).toBeInTheDocument();

    fireEvent.click(chaseBtn);
    expect(handleChase).toHaveBeenCalledTimes(1);
    expect(handleChase).toHaveBeenCalledWith(baseWorkItem);
  });
});

