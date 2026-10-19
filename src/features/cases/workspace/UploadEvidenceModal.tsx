import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileCheck,
  UploadCloud,
  X,
  AlertCircle,
  FileText,
  Trash2,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export interface UploadEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File) => Promise<void> | void;
  workItemName: string;
  stepName?: string;
  targetRoleDisplayName?: string;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const UploadEvidenceModal: React.FC<UploadEvidenceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  workItemName,
  stepName,
  targetRoleDisplayName,
  isSubmitting = false,
  errorMessage = null,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setIsDragging(false);
      setLocalError(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  const handleFile = useCallback((file: File) => {
    setLocalError(null);
    setSelectedFile(file);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSubmitting) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isSubmitting) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setLocalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || isSubmitting) return;
    await onSubmit(selectedFile);
  };

  if (!isOpen) return null;

  const displayError = localError || errorMessage;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-evidence-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100 bg-[#FAFBFD]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-200/80 flex items-center justify-center text-[#E1007A] shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="upload-evidence-title"
                  className="text-base font-extrabold text-slate-900 tracking-tight"
                >
                  Evidence Verification Required
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Policy
                  Guard
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Attach supporting documentation to verify and complete this
                checkpoint.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Target Task Summary Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Checkpoint Task
              </span>
              {targetRoleDisplayName && (
                <span className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                  {targetRoleDisplayName}
                </span>
              )}
            </div>

            <div className="font-bold text-slate-900 text-sm">
              {workItemName}
            </div>

            {stepName && (
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <span className="font-medium text-slate-400">Milestone:</span>
                <span className="font-semibold text-slate-700">{stepName}</span>
              </div>
            )}

            <div className="pt-1 text-[11px] text-slate-500 leading-relaxed border-t border-slate-200/60 flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Documentary evidence is required before completing this
                checkpoint. Once uploaded, the task will be unlocked and ready
                to complete.
              </span>
            </div>
          </div>

          {/* Error Message Alert */}
          {displayError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 font-medium">{displayError}</div>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            data-testid="evidence-file-input"
            onChange={handleInputChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.webp"
          />

          {/* File Dropzone or Preview */}
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#E1007A] bg-pink-50/60 scale-[0.99]'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/60 hover:bg-slate-50'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center mx-auto text-slate-400 mb-2.5">
                <UploadCloud className="w-6 h-6 text-[#E1007A]" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800">
                  <span className="text-[#E1007A] hover:underline">
                    Click to upload
                  </span>{' '}
                  or drag and drop evidence file
                </p>
                <p className="text-[11px] text-slate-400">
                  PDF, DOCX, XLSX, or Images
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/90 flex items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate max-w-[260px]">
                    {selectedFile.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {formatBytes(selectedFile.size)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={isSubmitting}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Remove selected file"
                title="Remove selected file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={!selectedFile || isSubmitting}
              leftIcon={<UploadCloud className="w-4 h-4" />}
              className="text-xs font-bold"
            >
              Upload Evidence
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
