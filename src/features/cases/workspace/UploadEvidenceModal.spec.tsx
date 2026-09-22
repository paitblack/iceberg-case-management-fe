import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UploadEvidenceModal } from './UploadEvidenceModal';

describe('UploadEvidenceModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    workItemName: 'Verify Anti-Money Laundering Identification',
    stepName: 'Client Due Diligence',
    targetRoleDisplayName: 'Compliance Officer',
    isSubmitting: false,
    errorMessage: null,
  };

  it('renders modal dialog with task details and policy explanation when open', () => {
    render(<UploadEvidenceModal {...defaultProps} />);

    expect(
      screen.getByRole('heading', { name: /Evidence Verification Required/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Verify Anti-Money Laundering Identification'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Client Due Diligence/i)).toBeInTheDocument();
    expect(screen.getByText(/Compliance Officer/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Documentary evidence is required/i),
    ).toBeInTheDocument();
  });

  it('does not render dialog content when isOpen is false', () => {
    render(<UploadEvidenceModal {...defaultProps} isOpen={false} />);

    expect(
      screen.queryByRole('heading', {
        name: /Evidence Verification Required/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('allows file selection and displays file preview details', () => {
    render(<UploadEvidenceModal {...defaultProps} />);

    const submitBtn = screen.getByRole('button', {
      name: /^Upload Evidence$/i,
    });
    expect(submitBtn).toBeDisabled();

    const file = new File(['dummy evidence document content'], 'passport.pdf', {
      type: 'application/pdf',
    });
    const fileInput = screen.getByTestId('evidence-file-input');

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText('passport.pdf')).toBeInTheDocument();
    expect(submitBtn).not.toBeDisabled();
  });

  it('allows clearing selected file', () => {
    render(<UploadEvidenceModal {...defaultProps} />);

    const file = new File(['dummy test content'], 'contract.pdf', {
      type: 'application/pdf',
    });
    const fileInput = screen.getByTestId('evidence-file-input');

    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(screen.getByText('contract.pdf')).toBeInTheDocument();

    const removeBtn = screen.getByRole('button', {
      name: /Remove selected file/i,
    });
    fireEvent.click(removeBtn);

    expect(screen.queryByText('contract.pdf')).not.toBeInTheDocument();
    const submitBtn = screen.getByRole('button', {
      name: /^Upload Evidence$/i,
    });
    expect(submitBtn).toBeDisabled();
  });

  it('calls onSubmit with selected file when submitting the form', () => {
    const onSubmit = vi.fn();
    render(<UploadEvidenceModal {...defaultProps} onSubmit={onSubmit} />);

    const file = new File(['evidence sample'], 'financial_statement.pdf', {
      type: 'application/pdf',
    });
    const fileInput = screen.getByTestId('evidence-file-input');

    fireEvent.change(fileInput, { target: { files: [file] } });

    const submitBtn = screen.getByRole('button', {
      name: /^Upload Evidence$/i,
    });
    fireEvent.click(submitBtn);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(file);
  });

  it('renders backend error alert when errorMessage is provided', () => {
    render(
      <UploadEvidenceModal
        {...defaultProps}
        errorMessage="File format not supported by storage provider."
      />,
    );

    expect(
      screen.getByText('File format not supported by storage provider.'),
    ).toBeInTheDocument();
  });

  it('calls onClose when Cancel or backdrop close button is clicked', () => {
    const onClose = vi.fn();
    render(<UploadEvidenceModal {...defaultProps} onClose={onClose} />);

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
