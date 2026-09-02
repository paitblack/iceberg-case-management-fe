import React, { useState, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  Download,
  Lock,
  CheckCircle2,
  AlertCircle,
  Shield,
  Plus,
  FileCheck2,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import type { BffCaseDocument, BffWorkspaceStep } from '../../../types/api';

interface DocumentsTabProps {
  documents?: BffCaseDocument[];
  steps?: BffWorkspaceStep[];
  onUploadDocument?: (file: File, workItemId?: string) => Promise<void>;
  onDownloadDocument?: (documentId: string, fileName?: string) => Promise<void>;
  isUploading?: boolean;
}

function formatRoleDisplayName(role?: string, ownerRoleId?: string): string {
  const roleText = role || ownerRoleId;
  if (!roleText) return 'Unassigned Role';

  const standardRoleMap: Record<string, string> = {
    'role-estate-agent': 'Estate Agent / Progressor',
    'role-vendor-solicitor': "Seller's Conveyancer / Solicitor",
    'role-buyer-solicitor': "Buyer's Conveyancer / Solicitor",
    'role-vendor': 'Seller / Vendor',
    'role-buyer': 'Buyer / Purchaser',
    'role-mortgage-broker': 'Mortgage Broker / Advisor',
    'role-surveyor': 'RICS Surveyor / Valuer',
  };

  if (standardRoleMap[roleText]) {
    return standardRoleMap[roleText];
  }

  if (!roleText.startsWith('role-')) {
    return roleText;
  }

  const withoutPrefix = roleText.replace(/^role-/, '');
  const parts = withoutPrefix
    .split('-')
    .filter((p) => !/^[a-z0-9]{6,}$/i.test(p));
  if (parts.length > 0) {
    return parts.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return roleText;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents = [],
  steps = [],
  onUploadDocument,
  onDownloadDocument,
  isUploading = false,
}) => {
  const [activeUploadWorkItemId, setActiveUploadWorkItemId] = useState<
    string | null
  >(null);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const generalFileInputRef = useRef<HTMLInputElement>(null);
  const taskFileInputRef = useRef<HTMLInputElement>(null);

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

  const docList = documents || [];

  // Filter steps that have work items requiring evidence
  const stepsWithEvidence = (steps || []).filter((step) =>
    (step.workItems || []).some((wi) => wi.evidenceRequired),
  );

  const totalEvidenceTasksCount = stepsWithEvidence.reduce(
    (acc, step) =>
      acc + (step.workItems || []).filter((wi) => wi.evidenceRequired).length,
    0,
  );

  const satisfiedEvidenceTasksCount = stepsWithEvidence.reduce(
    (acc, step) =>
      acc +
      (step.workItems || []).filter(
        (wi) =>
          wi.evidenceRequired && docList.some((d) => d.workItemId === wi.id),
      ).length,
    0,
  );

  const handleTaskUploadClick = (workItemId: string) => {
    setActiveUploadWorkItemId(workItemId);
    if (taskFileInputRef.current) {
      taskFileInputRef.current.value = '';
      taskFileInputRef.current.click();
    }
  };

  const handleTaskFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (
      e.target.files &&
      e.target.files[0] &&
      activeUploadWorkItemId &&
      onUploadDocument
    ) {
      const file = e.target.files[0];
      onUploadDocument(file, activeUploadWorkItemId);
    }
  };

  const handleGeneralFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onUploadDocument) {
      onUploadDocument(e.target.files[0], undefined);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hidden File Inputs */}
      <input
        ref={taskFileInputRef}
        type="file"
        onChange={handleTaskFileChange}
        className="hidden"
      />
      <input
        ref={generalFileInputRef}
        type="file"
        onChange={handleGeneralFileChange}
        className="hidden"
      />

      {/* SECTION 1: Step Structure with Evidence Work Items */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span>Required Task Evidence</span>
              <span className="px-2 py-0.5 rounded-full bg-pink-50 text-[#E1007A] text-[10px] font-bold border border-pink-200">
                {satisfiedEvidenceTasksCount}/{totalEvidenceTasksCount}{' '}
                Satisfied
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Tasks in the progression workflow requiring authoritative evidence
              documents before completion.
            </p>
          </div>
        </div>

        {stepsWithEvidence.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-400">
            No milestone steps in this case currently require evidence
            documents.
          </div>
        ) : (
          <div className="space-y-4">
            {stepsWithEvidence.map((step) => {
              const evidenceItems = (step.workItems || []).filter(
                (wi) => wi.evidenceRequired,
              );

              return (
                <div
                  key={step.id}
                  className="rounded-2xl border border-slate-200/90 bg-slate-50/40 overflow-hidden shadow-xs"
                >
                  {/* Step Header Banner (Matches Workflow Progression) */}
                  <div className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border-b border-slate-100">
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {/* Step Number Badge */}
                      <div className="w-8 h-8 rounded-xl bg-[#E1007A] text-white flex items-center justify-center font-extrabold text-sm shadow-xs shrink-0">
                        {step.displayOrder}
                      </div>

                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm md:text-base font-extrabold text-slate-900 truncate">
                            {step.name}
                          </h3>

                          <Badge variant="required" size="xs">
                            {step.status}
                          </Badge>

                          <span className="text-[11px] font-semibold text-slate-500">
                            {evidenceItems.length} evidence{' '}
                            {evidenceItems.length === 1 ? 'task' : 'tasks'}
                          </span>
                        </div>

                        {step.description && (
                          <p className="text-xs text-slate-500 line-clamp-1 font-normal">
                            {step.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Work Items in this Step */}
                  <div className="p-4 md:p-5 space-y-2.5">
                    {evidenceItems.map((wi) => {
                      const linkedDoc = docList.find(
                        (d) => d.workItemId === wi.id,
                      );
                      const isTaskUploading =
                        isUploading && activeUploadWorkItemId === wi.id;
                      const isSatisfied = !!linkedDoc;

                      return (
                        <div
                          key={wi.id}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                            isSatisfied
                              ? 'bg-emerald-50/30 border-emerald-200/80'
                              : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                          }`}
                        >
                          {/* Left: Status Icon + Title + Metadata */}
                          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                            {/* Status Icon */}
                            <div className="shrink-0 mt-0.5 sm:mt-0">
                              {isSatisfied ? (
                                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-pink-50 border-2 border-pink-200 text-[#E1007A] flex items-center justify-center">
                                  <FileCheck2 className="w-3 h-3 text-[#E1007A]" />
                                </div>
                              )}
                            </div>

                            <div className="space-y-0.5 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">
                                  {wi.name || wi.title}
                                </span>

                                {wi.tag && (
                                  <Badge
                                    variant={
                                      wi.tag === 'Key Date'
                                        ? 'keyDate'
                                        : 'manual'
                                    }
                                    size="xs"
                                  >
                                    {wi.tag}
                                  </Badge>
                                )}

                                <Badge
                                  variant={
                                    wi.requirement === 'required'
                                      ? 'required'
                                      : 'warning'
                                  }
                                  size="xs"
                                >
                                  {wi.requirement}
                                </Badge>

                                {isSatisfied ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-md px-1.5 py-0.5 font-bold">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Evidence Attached</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200/80 rounded-md px-1.5 py-0.5 font-bold">
                                    <AlertCircle className="w-3 h-3 text-amber-500" />
                                    <span>Evidence Required</span>
                                  </span>
                                )}
                              </div>

                              {/* Task Description */}
                              {wi.description && (
                                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                                  {wi.description}
                                </p>
                              )}

                              {/* Conditional Rule Notice */}
                              {wi.requirement === 'conditional' &&
                                wi.condition && (
                                  <div className="text-[10px] text-amber-800 bg-amber-50/90 border border-amber-200/80 rounded-md px-2 py-0.5 w-fit font-medium flex items-center gap-1.5 my-0.5">
                                    <span className="font-bold">
                                      Condition Rule:
                                    </span>
                                    <span>{wi.condition}</span>
                                  </div>
                                )}

                              {/* Assigned Role & Assignee */}
                              {(wi.role || wi.ownerRoleId || wi.assignee) && (
                                <div className="flex flex-wrap items-center gap-x-3 text-[10px] text-slate-500 pt-0.5">
                                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                                    <Shield className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>
                                      Role:{' '}
                                      <span className="font-semibold text-slate-800">
                                        {formatRoleDisplayName(
                                          wi.role,
                                          wi.ownerRoleId,
                                        )}
                                      </span>
                                      {wi.assignee && (
                                        <span className="ml-1 text-[#E1007A] font-bold">
                                          ({wi.assignee.name}
                                          {wi.assignee.companyName
                                            ? ` - ${wi.assignee.companyName}`
                                            : ''}
                                          )
                                        </span>
                                      )}
                                    </span>
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Upload Button or Evidence File Actions */}
                          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                            {isSatisfied ? (
                              <div className="flex items-center gap-2">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
                                  <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="truncate max-w-[150px]">
                                    {linkedDoc?.fileName}
                                  </span>
                                </div>

                                {linkedDoc?.canDownload !== false ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDownloadClick(
                                        linkedDoc.id,
                                        linkedDoc.fileName,
                                      )
                                    }
                                    disabled={downloadingDocId === linkedDoc.id}
                                    className="p-1.5 rounded-lg border border-slate-200 hover:border-[#E1007A] text-slate-600 hover:text-[#E1007A] transition-colors cursor-pointer disabled:opacity-50"
                                    title="Download File"
                                  >
                                    {downloadingDocId === linkedDoc.id ? (
                                      <span className="w-3.5 h-3.5 border-2 border-[#E1007A] border-t-transparent rounded-full animate-spin inline-block" />
                                    ) : (
                                      <Download className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-bold"
                                    title="Access Restricted: You do not have permission to download this document."
                                  >
                                    <Lock className="w-3 h-3 text-amber-600" />
                                    Restricted
                                  </span>
                                )}

                                <Button
                                  variant="ghost"
                                  size="xs"
                                  isLoading={isTaskUploading}
                                  onClick={() => handleTaskUploadClick(wi.id)}
                                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-900"
                                >
                                  Replace
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="primary"
                                size="xs"
                                isLoading={isTaskUploading}
                                onClick={() => handleTaskUploadClick(wi.id)}
                                leftIcon={
                                  <UploadCloud className="w-3.5 h-3.5" />
                                }
                                className="font-bold text-[11px]"
                              >
                                Upload Document
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Submitted Authoritative Case Documents */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Authoritative Case Documents ({docList.length})
            </h3>
            <span className="text-[11px] text-slate-400">
              Immutable encrypted storage backed by Cloudflare R2
            </span>
          </div>

          <Button
            variant="secondary"
            size="xs"
            isLoading={isUploading && activeUploadWorkItemId === null}
            onClick={() => {
              setActiveUploadWorkItemId(null);
              generalFileInputRef.current?.click();
            }}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="font-bold text-xs"
          >
            Upload General Document
          </Button>
        </div>

        {docList.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-400">
            No documents uploaded yet for this case. Upload evidence in the
            steps above or attach a general document.
          </div>
        ) : (
          <div className="iceberg-card overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFBFD] text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Linked Step & Task</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Uploaded By</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {docList.map((doc) => {
                  const linkedStepAndTask = (steps || []).reduce<
                    | {
                        stepName: string;
                        stepDisplayOrder: number;
                        taskName: string;
                      }
                    | undefined
                  >((found, step) => {
                    if (found) return found;
                    const wi = step.workItems?.find(
                      (w) => w.id === doc.workItemId,
                    );
                    if (wi) {
                      return {
                        stepName: step.name,
                        stepDisplayOrder: step.displayOrder,
                        taskName: wi.name || wi.title || 'Task',
                      };
                    }
                    return undefined;
                  }, undefined);

                  return (
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
                        {linkedStepAndTask ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border bg-pink-50 text-[#E1007A] border-pink-200 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-[#E1007A] shrink-0" />
                            <span>
                              Step {linkedStepAndTask.stepDisplayOrder}:{' '}
                              {linkedStepAndTask.taskName}
                            </span>
                          </div>
                        ) : (
                          <Badge variant="default" size="xs">
                            {doc.category || 'General Document'}
                          </Badge>
                        )}
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
                        {doc.canDownload === false ? (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"
                            title="Access Restricted: You do not have permission to download this document."
                          >
                            <Lock className="w-3 h-3 text-amber-600" />
                            Access Restricted
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadClick(doc.id, doc.fileName)
                            }
                            disabled={downloadingDocId === doc.id}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E1007A] hover:text-[#C70068] hover:underline cursor-pointer disabled:opacity-50"
                          >
                            {downloadingDocId === doc.id ? (
                              <span className="w-3.5 h-3.5 border-2 border-[#E1007A] border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span>Download</span>
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
    </div>
  );
};
