import React, { useState, useMemo, useRef } from 'react';
import {
  FileText,
  Download,
  Lock,
  Search,
  Plus,
  CheckCircle2,
  ShieldCheck,
  Image as ImageIcon,
  FileCode,
  FileSpreadsheet,
  X,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { BffCaseDocument, BffWorkspaceStep } from '../../../types/api';

interface DocumentsTabProps {
  documents?: BffCaseDocument[];
  steps?: BffWorkspaceStep[];
  onUploadDocument?: (file: File, workItemId?: string) => Promise<void>;
  onDownloadDocument?: (documentId: string, fileName?: string) => Promise<void>;
  isUploading?: boolean;
}

type DocumentCategoryFilter = 'ALL' | 'EVIDENCE' | 'GENERAL';

type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'size-desc';

function getFileIcon(fileName: string, fileType?: string) {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  if (extension === 'pdf' || fileType?.includes('pdf')) {
    return {
      icon: FileText,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      label: 'PDF',
    };
  }
  if (
    ['doc', 'docx'].includes(extension) ||
    fileType?.includes('word') ||
    fileType?.includes('document')
  ) {
    return {
      icon: FileText,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      label: 'DOC',
    };
  }
  if (
    ['xls', 'xlsx', 'csv'].includes(extension) ||
    fileType?.includes('sheet') ||
    fileType?.includes('csv')
  ) {
    return {
      icon: FileSpreadsheet,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      label: 'SHEET',
    };
  }
  if (
    ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension) ||
    fileType?.includes('image')
  ) {
    return {
      icon: ImageIcon,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      label: 'IMG',
    };
  }

  return {
    icon: FileCode,
    color: 'text-slate-600 bg-slate-100 border-slate-200',
    label: extension.toUpperCase() || 'FILE',
  };
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents = [],
  steps = [],
  onUploadDocument,
  onDownloadDocument,
  isUploading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<DocumentCategoryFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const generalFileInputRef = useRef<HTMLInputElement>(null);

  const docList = documents || [];

  // Map each workItemId to step and workItem details
  const workItemLookup = useMemo(() => {
    const map = new Map<
      string,
      { stepName: string; stepDisplayOrder: number; taskName: string }
    >();

    for (const step of steps || []) {
      for (const wi of step.workItems || []) {
        map.set(wi.id, {
          stepName: step.name,
          stepDisplayOrder: step.displayOrder,
          taskName: wi.name || wi.title || 'Task',
        });
      }
    }
    return map;
  }, [steps]);

  // Statistics
  const totalCount = docList.length;
  const evidenceDocsCount = docList.filter((d) => !!d.workItemId).length;
  const generalDocsCount = totalCount - evidenceDocsCount;

  const totalBytes = docList.reduce(
    (acc, d) => acc + (d.fileSizeBytes || 0),
    0,
  );

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    let list = [...docList];

    // Filter by category
    if (selectedCategory === 'EVIDENCE') {
      list = list.filter((d) => !!d.workItemId);
    } else if (selectedCategory === 'GENERAL') {
      list = list.filter((d) => !d.workItemId);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((d) => {
        const nameMatch = d.fileName.toLowerCase().includes(q);
        const uploaderMatch = (d.uploadedByName || '')
          .toLowerCase()
          .includes(q);
        const linkedInfo = d.workItemId
          ? workItemLookup.get(d.workItemId)
          : undefined;
        const stepMatch = linkedInfo
          ? linkedInfo.stepName.toLowerCase().includes(q) ||
            linkedInfo.taskName.toLowerCase().includes(q)
          : false;

        return nameMatch || uploaderMatch || stepMatch;
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'date-desc') {
        const timeA = new Date(a.uploadedAt || 0).getTime();
        const timeB = new Date(b.uploadedAt || 0).getTime();
        return timeB - timeA;
      }
      if (sortBy === 'date-asc') {
        const timeA = new Date(a.uploadedAt || 0).getTime();
        const timeB = new Date(b.uploadedAt || 0).getTime();
        return timeA - timeB;
      }
      if (sortBy === 'name-asc') {
        return a.fileName.localeCompare(b.fileName);
      }
      if (sortBy === 'size-desc') {
        const sizeA = a.fileSizeBytes || 0;
        const sizeB = b.fileSizeBytes || 0;
        return sizeB - sizeA;
      }
      return 0;
    });

    return list;
  }, [docList, selectedCategory, searchQuery, sortBy, workItemLookup]);

  const handleDownloadClick = async (
    documentId: string,
    fileName?: string,
  ) => {
    if (!onDownloadDocument) return;
    setDownloadingDocId(documentId);
    try {
      await onDownloadDocument(documentId, fileName);
    } finally {
      setDownloadingDocId(null);
    }
  };

  const handleGeneralFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onUploadDocument) {
      onUploadDocument(e.target.files[0], undefined);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input for General Upload */}
      <input
        ref={generalFileInputRef}
        type="file"
        onChange={handleGeneralFileChange}
        className="hidden"
      />

      {/* Header & Metric Summary Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Case Document Vault & Library
            </h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Secure Archive
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Authoritative document archive for this case progression.
            Download files or upload general documentation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            isLoading={isUploading}
            onClick={() => generalFileInputRef.current?.click()}
            leftIcon={<Plus className="w-4 h-4" />}
            className="font-bold text-xs"
          >
            Upload Case Document
          </Button>
        </div>
      </div>

      {/* Key Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Documents
          </span>
          <div className="text-lg font-black text-slate-900 mt-0.5">
            {totalCount}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Workflow Evidence
          </span>
          <div className="text-lg font-black text-[#E1007A] mt-0.5">
            {evidenceDocsCount}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            General Files
          </span>
          <div className="text-lg font-black text-slate-700 mt-0.5">
            {generalDocsCount}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Storage Size
          </span>
          <div className="text-lg font-black text-slate-900 mt-0.5">
            {formatFileSize(totalBytes)}
          </div>
        </div>
      </div>

      {/* Search, Filter Tabs & Sort Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {(
              [
                { id: 'ALL', label: 'All Files', count: totalCount },
                {
                  id: 'EVIDENCE',
                  label: 'Milestone Evidence',
                  count: evidenceDocsCount,
                },
                { id: 'GENERAL', label: 'General Files', count: generalDocsCount },
              ] as const
            ).map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? 'bg-slate-700 text-slate-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#E1007A] cursor-pointer"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="size-desc">Size (Largest)</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by file name, uploader, or milestone task..."
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E1007A] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Document Library Table */}
      {filteredDocuments.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">
              {docList.length === 0
                ? 'No Case Documents Uploaded Yet'
                : 'No Matching Documents Found'}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {docList.length === 0
                ? 'You can upload evidence documents directly inside milestone tasks in the Progression tab, or attach general files using the upload button above.'
                : `No files matched the search query "${searchQuery}" or category filter.`}
            </p>
          </div>
          {searchQuery && (
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="font-bold text-xs"
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFBFD] text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Document Title</th>
                <th className="py-3.5 px-4">Associated Milestone & Task</th>
                <th className="py-3.5 px-4">Uploaded By</th>
                <th className="py-3.5 px-4">File Size</th>
                <th className="py-3.5 px-4">Date Uploaded</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredDocuments.map((doc) => {
                const iconDetails = getFileIcon(doc.fileName, doc.fileType);
                const IconComponent = iconDetails.icon;

                const linkedInfo = doc.workItemId
                  ? workItemLookup.get(doc.workItemId)
                  : undefined;

                const formattedSize = formatFileSize(doc.fileSizeBytes || 0);

                const uploadDate = doc.uploadedAt;
                const formattedDate = uploadDate
                  ? new Date(uploadDate).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A';

                return (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Document Title & File Type Badge */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${iconDetails.color}`}
                          title={iconDetails.label}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <span
                            className="font-bold text-slate-900 truncate max-w-xs block"
                            title={doc.fileName}
                          >
                            {doc.fileName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {iconDetails.label}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Associated Milestone / Task */}
                    <td className="py-3.5 px-4">
                      {linkedInfo ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-pink-50 text-[#E1007A] border-pink-200 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-[#E1007A] shrink-0" />
                          <span className="truncate max-w-[200px]">
                            Step {linkedInfo.stepDisplayOrder}:{' '}
                            {linkedInfo.taskName}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-medium">
                          General Case File
                        </span>
                      )}
                    </td>

                    {/* Uploaded By */}
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {doc.uploadedByName || 'Authorized User'}
                    </td>

                    {/* File Size */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {formattedSize}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">
                      {formattedDate}
                    </td>

                    {/* Download Action */}
                    <td className="py-3.5 px-4 text-right">
                      {doc.canDownload === false ? (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md"
                          title="Access Restricted: You do not have permission to download this document."
                        >
                          <Lock className="w-3 h-3 text-amber-600" />
                          Restricted
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadClick(doc.id, doc.fileName)
                          }
                          disabled={downloadingDocId === doc.id}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E1007A] hover:text-[#C70068] hover:bg-pink-50 px-2.5 py-1.5 rounded-lg border border-pink-200/80 transition-all cursor-pointer disabled:opacity-50"
                          title={`Download ${doc.fileName}`}
                        >
                          {downloadingDocId === doc.id ? (
                            <>
                              <span className="w-3 h-3 border-2 border-[#E1007A] border-t-transparent rounded-full animate-spin inline-block" />
                              <span>Preparing...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
