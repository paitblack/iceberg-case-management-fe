import React, { useState } from 'react';
import { FileText, UploadCloud, Download, Lock } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import type { BffCaseDocument } from '../../../types/api';

interface DocumentsTabProps {
  documents?: BffCaseDocument[];
  onUploadDocument?: (file: File, category: string) => Promise<void>;
  isUploading?: boolean;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents = [],
  onUploadDocument,
  isUploading = false,
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<string>('Conveyancing');
  const [dragActive, setDragActive] = useState<boolean>(false);

  const list = documents || [];

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
        className={`iceberg-card p-6 border-2 border-dashed transition-all text-center space-y-3 ${
          dragActive
            ? 'border-[#E1007A] bg-pink-50/50'
            : 'border-slate-300 hover:border-slate-400 bg-white'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#E1007A] flex items-center justify-center mx-auto shadow-2xs">
          <UploadCloud className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Upload Workflow & Evidence Documents
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-0.5">
            Attach official conveyance contracts, searches, AML biometric
            certifications, or mortgage documents.
          </p>
        </div>

        {/* Category Selector */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-500">
            Category:
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#E1007A]"
          >
            <option value="Conveyancing">Conveyancing & Legal Pack</option>
            <option value="AML / ID Verification">AML & Identity</option>
            <option value="Mortgage & Financial">Mortgage & Valuation</option>
            <option value="Searches & Enquiries">Searches & Enquiries</option>
          </select>
        </div>

        {/* Upload Trigger Input */}
        <div>
          <label className="inline-flex">
            <Button
              variant="secondary"
              size="sm"
              isLoading={isUploading}
              className="cursor-pointer font-bold"
              onClick={() => {
                const el = document.getElementById('case-file-input');
                el?.click();
              }}
            >
              Choose File to Upload
            </Button>
            <input
              id="case-file-input"
              type="file"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Documents List Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Authoritative Case Documents ({list.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            Immutable Storage backed by Cloudflare R2
          </span>
        </div>

        {list.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
            No documents uploaded yet for this case.
          </div>
        ) : (
          <div className="iceberg-card overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFBFD] text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Uploaded By</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {list.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <FileText className="w-4 h-4 text-[#E1007A] shrink-0" />
                        <span className="truncate max-w-xs">
                          {doc.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="required" size="xs">
                        {doc.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {(doc.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {doc.uploadedByName}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                      {new Date(doc.uploadedAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {doc.downloadUrl ? (
                        <a
                          href={doc.downloadUrl}
                          download
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E1007A] hover:underline"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                          <Lock className="w-3 h-3" /> Encrypted
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
