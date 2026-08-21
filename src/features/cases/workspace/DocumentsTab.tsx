import React, { useState } from 'react';
import { FileText, UploadCloud, Download, Lock } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import type { BffCaseDocument } from '../../../types/api';

interface DocumentsTabProps {
  documents: BffCaseDocument[];
  onUploadDocument?: (file: File, category: string) => Promise<void>;
  isUploading?: boolean;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents,
  onUploadDocument,
  isUploading = false,
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<string>('Conveyancing');
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0] && onUploadDocument) {
      onUploadDocument(e.dataTransfer.files[0], selectedCategory);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onUploadDocument) {
      onUploadDocument(e.target.files[0], selectedCategory);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone Card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleFileDrop}
        className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center space-y-3 bg-white ${
          dragActive
            ? 'border-[#E1007A] bg-pink-50/50'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#E1007A] flex items-center justify-center mx-auto shadow-xs">
          <UploadCloud className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800">
            Upload Verified Case Documents & Evidence
          </h3>
          <p className="text-xs text-slate-500">
            Drag and drop contracts, search reports, AML ID certificates, or
            survey reports (PDF, DOCX up to 25MB)
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:border-[#E1007A] focus:outline-none cursor-pointer"
          >
            <option value="Conveyancing">Conveyancing & Memo</option>
            <option value="AML & Identity">AML & Biometric ID</option>
            <option value="Searches & Enquiries">Searches & Enquiries</option>
            <option value="Mortgage Offer">Mortgage Offer</option>
            <option value="Survey & Valuation">Survey & Valuation</option>
          </select>

          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={handleFileInputChange}
              disabled={isUploading}
            />
            <Button
              variant="primary"
              size="sm"
              isLoading={isUploading}
              leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
              className="pointer-events-none"
            >
              Browse Local File
            </Button>
          </label>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Authoritative Case Documents ({documents.length})
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            <Lock className="w-3 h-3 inline mr-1" />
            Cloudflare R2 Object Storage Protected
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-400">
            No documents uploaded to this case yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {doc.fileName}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="info" size="xs">
                        {doc.category}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {(doc.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Uploaded by {doc.uploadedByName} on{' '}
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={doc.downloadUrl || '#'}
                    download={doc.fileName}
                    title="Download document"
                    className="p-2 rounded-xl text-slate-500 hover:text-[#E1007A] hover:bg-pink-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
