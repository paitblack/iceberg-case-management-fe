import React, { useState, useMemo, useEffect } from 'react';
import {
  Mail,
  Sparkles,
  Send,
  Clock,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Layers,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useAuth } from '../../auth/AuthContext';
import type {
  BffParticipant,
  BffCaseCommunication,
  CommunicationIntent,
  GenerateCommunicationDraftPayload,
  SendCommunicationPayload,
} from '../../../types/api';

export interface InitialCommunicationContext {
  stepId?: string;
  stepName?: string;
  workItemId?: string;
  workItemName?: string;
  evidenceRequired?: boolean;
  targetRole?: string;
  recipientId?: string;
  intent?: CommunicationIntent;
}

export interface CommunicationsTabProps {
  caseId: string;
  caseTitle: string;
  participants?: BffParticipant[];
  communications?: BffCaseCommunication[];
  initialContext?: InitialCommunicationContext | null;
  onSendCommunication: (payload: SendCommunicationPayload) => Promise<void>;
  onGenerateDraft: (
    payload: GenerateCommunicationDraftPayload,
  ) => Promise<{ subject: string; bodyText: string; bodyHtml: string }>;
  isSending?: boolean;
  isGeneratingDraft?: boolean;
}

const getParticipantRole = (p: BffParticipant): string =>
  p.roleName || p.roleId;

export const CommunicationsTab: React.FC<CommunicationsTabProps> = ({
  caseId,
  caseTitle,
  participants = [],
  communications = [],
  initialContext,
  onSendCommunication,
  onGenerateDraft,
  isSending = false,
  isGeneratingDraft = false,
}) => {
  const { user } = useAuth();

  // Active Context from Step/Task trigger
  const [context, setContext] = useState<InitialCommunicationContext | null>(
    initialContext ?? null,
  );

  useEffect(() => {
    if (initialContext) {
      setContext(initialContext);
      if (initialContext.intent) {
        setIntent(initialContext.intent);
      }
      if (initialContext.workItemName) {
        const prefix =
          initialContext.intent === 'DOCUMENT_REQUEST'
            ? 'Action Required: Evidence for '
            : 'Update on ';
        setSubject(`${prefix}${initialContext.workItemName} – ${caseTitle}`);
        setBodyText(
          `Dear Stakeholders,\n\nI hope this email finds you well. I am writing regarding the ongoing sales progression for ${caseTitle}.\n\nPlease be advised that the task "${initialContext.workItemName}"${initialContext.stepName ? ` under milestone "${initialContext.stepName}"` : ''} has been completed.\n\nPlease let us know if any further information is needed to proceed.\n\nKind regards,\n${user?.name || 'Sarah Jenkins'}\nSales Progressor`,
        );
      }
      // Attempt to auto-select matching recipient by role or id
      if (initialContext.recipientId) {
        setSelectedRecipientIds([initialContext.recipientId]);
      } else if (initialContext.targetRole && participants.length > 0) {
        const matches = participants.filter(
          (p) =>
            p.roleId.toLowerCase() === initialContext.targetRole?.toLowerCase() ||
            p.roleName?.toLowerCase() ===
            initialContext.targetRole?.toLowerCase(),
        );
        if (matches.length > 0) {
          setSelectedRecipientIds(matches.map((m) => m.id));
        }
      }
    }
  }, [initialContext, participants, caseTitle, user]);

  // Multi-Recipient Selection
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>(() => {
    if (initialContext?.recipientId) return [initialContext.recipientId];
    if (participants.length > 0) return [participants[0].id];
    return [];
  });

  const selectedParticipants = useMemo(() => {
    return participants.filter((p) => selectedRecipientIds.includes(p.id));
  }, [participants, selectedRecipientIds]);

  const primaryRecipient = selectedParticipants[0] || participants[0] || null;

  const toggleRecipient = (id: string) => {
    setSelectedRecipientIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Composer Form State
  const [intent, setIntent] = useState<CommunicationIntent>(
    initialContext?.intent ||
    (initialContext?.evidenceRequired ? 'DOCUMENT_REQUEST' : 'PROGRESS_UPDATE'),
  );
  const [tone, setTone] = useState<'professional' | 'urgent' | 'friendly'>(
    'professional',
  );

  const defaultSubject = useMemo(() => {
    if (context?.workItemName) {
      return `${intent === 'DOCUMENT_REQUEST' ? 'Action Required: Evidence for ' : 'Update on '}${context.workItemName} – ${caseTitle}`;
    }
    return `Sales Progression Update – ${caseTitle}`;
  }, [context, intent, caseTitle]);

  const [subject, setSubject] = useState<string>(defaultSubject);
  const [bodyText, setBodyText] = useState<string>(() => {
    const recipName = primaryRecipient?.name || 'Stakeholder';
    return `Dear ${recipName},\n\nI hope this email finds you well. I am writing regarding the ongoing sales progression for ${caseTitle}.\n\nPlease let us know if any further information is needed to proceed.\n\nKind regards,\n${user?.name || 'Sarah Jenkins'}\nSales Progressor`;
  });

  const [composerError, setComposerError] = useState<string | null>(null);

  // Search & Filter in Sent History
  const [historySearch, setHistorySearch] = useState<string>('');
  const [expandedCommId, setExpandedCommId] = useState<string | null>(null);
  const [expandedRecipientsId, setExpandedRecipientsId] = useState<string | null>(null);

  // Progressor sender info derived from current session / persona
  const senderName = user?.name || 'Sarah Jenkins';
  const senderRole = 'Sales Progressor';
  const senderEmail = user?.email || 'sarah.jenkins@iceberg-digital.co.uk';
  const senderPhone = '+44 20 7946 0912';

  // Handle AI Draft Generation
  const handleGenerateAiDraft = async () => {
    if (selectedParticipants.length === 0) {
      setComposerError('Please select at least one recipient before generating a draft.');
      return;
    }
    setComposerError(null);
    try {
      const target = primaryRecipient || selectedParticipants[0];
      const draft = await onGenerateDraft({
        recipientEmail: target?.email || 'stakeholder@example.com',
        recipientName: target?.name || 'Stakeholder',
        recipientRole: target ? getParticipantRole(target) : undefined,
        caseTitle,
        stepName: context?.stepName,
        workItemName: context?.workItemName,
        evidenceRequired: context?.evidenceRequired,
        selectedRoles: selectedParticipants.map(getParticipantRole),
        intent,
        tone,
        senderName,
        senderRole,
      });

      if (draft.subject) {
        setSubject(draft.subject);
      }
      if (draft.bodyText) {
        setBodyText(draft.bodyText);
      }
    } catch (err: unknown) {
      setComposerError(
        err instanceof Error
          ? err.message
          : 'Failed to generate AI email draft.',
      );
    }
  };

  // Handle Dispatch / Send
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedParticipants.length === 0) {
      setComposerError('Please select at least one recipient.');
      return;
    }
    if (!subject.trim()) {
      setComposerError('Email subject cannot be empty.');
      return;
    }
    if (!bodyText.trim()) {
      setComposerError('Email body cannot be empty.');
      return;
    }

    setComposerError(null);
    try {
      const primary = primaryRecipient || selectedParticipants[0];
      await onSendCommunication({
        stepId: context?.stepId,
        workItemId: context?.workItemId,
        recipientEmail: primary?.email || 'stakeholder@example.com',
        recipientName: primary?.name || 'Stakeholder',
        recipientRole: primary ? getParticipantRole(primary) : undefined,
        recipients: selectedParticipants.map((p) => ({
          email: p.email || 'stakeholder@example.com',
          name: p.name,
          role: getParticipantRole(p),
        })),
        senderName,
        senderRole,
        senderEmail,
        senderPhone,
        subject: subject.trim(),
        bodyText: bodyText.trim(),
        intent,
        status: 'SENT_SIMULATED',
      });
    } catch (err: unknown) {
      setComposerError(
        err instanceof Error ? err.message : 'Failed to dispatch communication.',
      );
    }
  };

  // Grouped History: collapses multi-recipient communications into a single entry with extendable stakeholders
  const groupedHistory = useMemo(() => {
    const list = communications || [];
    const sorted = [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    interface GroupedCommunicationItem {
      id: string;
      recipientName: string;
      recipientEmail: string;
      recipientRole?: string;
      status: string;
      createdAt: string;
    }

    interface GroupedCommunication {
      primaryId: string;
      subject: string;
      bodyText: string;
      createdAt: string;
      stepId?: string;
      workItemId?: string;
      recipients: GroupedCommunicationItem[];
    }

    const groups: GroupedCommunication[] = [];

    for (const comm of sorted) {
      // Find matching group with same subject, bodyText, and created within 15 seconds
      const existing = groups.find((g) => {
        if (g.subject !== comm.subject || g.bodyText !== comm.bodyText) return false;
        const timeDiff = Math.abs(
          new Date(g.createdAt).getTime() - new Date(comm.createdAt).getTime(),
        );
        return timeDiff < 15000;
      });

      if (existing) {
        if (!existing.recipients.some((r) => r.id === comm.id || r.recipientEmail === comm.recipientEmail)) {
          existing.recipients.push({
            id: comm.id,
            recipientName: comm.recipientName,
            recipientEmail: comm.recipientEmail,
            recipientRole: comm.recipientRole,
            status: comm.status,
            createdAt: comm.createdAt,
          });
        }
      } else {
        groups.push({
          primaryId: comm.id,
          subject: comm.subject,
          bodyText: comm.bodyText,
          createdAt: comm.createdAt,
          stepId: comm.stepId,
          workItemId: comm.workItemId,
          recipients: [
            {
              id: comm.id,
              recipientName: comm.recipientName,
              recipientEmail: comm.recipientEmail,
              recipientRole: comm.recipientRole,
              status: comm.status,
              createdAt: comm.createdAt,
            },
          ],
        });
      }
    }

    return groups;
  }, [communications]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    const query = historySearch.toLowerCase().trim();
    if (!query) return groupedHistory;
    return groupedHistory.filter((g) => {
      const matchSubject = g.subject.toLowerCase().includes(query);
      const matchBody = g.bodyText.toLowerCase().includes(query);
      const matchRecipients = g.recipients.some(
        (r) =>
          r.recipientName.toLowerCase().includes(query) ||
          r.recipientEmail.toLowerCase().includes(query) ||
          (r.recipientRole && r.recipientRole.toLowerCase().includes(query)),
      );
      return matchSubject || matchBody || matchRecipients;
    });
  }, [groupedHistory, historySearch]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center text-[#E1007A]">
              <Mail className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Communications & Chasing Hub
            </h2>
            <Badge variant="info" size="xs">
              AI-Powered
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Compose and dispatch contextual chasing emails with Iceberg Digital branded templates and AI draft generation.
          </p>
        </div>

        {/* Linked Task Context Pill */}
        {context?.workItemName && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs">
            <Layers className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <div className="truncate max-w-xs">
              <span className="font-semibold text-amber-800">Linked: </span>
              <span className="font-bold">{context.workItemName}</span>
              {context.stepName && (
                <span className="text-[11px] text-amber-700 ml-1">
                  ({context.stepName})
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setContext(null)}
              className="text-amber-500 hover:text-amber-800 ml-1 text-xs font-bold cursor-pointer"
              title="Detach task context"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* 2-Column Responsive Layout: Composer & Branded Template on Left (7 cols), Outbox History on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Composer & Live Branded Template */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-4">
          <form onSubmit={handleSend} className="space-y-4">
            {/* Control Bar: Recipient Picker + Intent + Tone */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5">
              {/* Stakeholders Multi-Selection & Quick Role Filters */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Recipients ({selectedParticipants.length}/{participants.length})
                    </span>
                  </div>

                  {/* Selection Shortcuts: All or Clear */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedRecipientIds(participants.map((p) => p.id))
                      }
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRecipientIds([])}
                      className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Checkbox List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {participants.map((p) => {
                    const isChecked = selectedRecipientIds.includes(p.id);
                    const roleName = getParticipantRole(p);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${isChecked
                            ? 'bg-pink-50/40 border-[#E1007A]/40 shadow-2xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRecipient(p.id)}
                          aria-label={p.name}
                          className="mt-0.5 rounded text-[#E1007A] focus:ring-[#E1007A]/20 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-900 truncate">
                              {p.name}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1 py-0.2 rounded">
                              {roleName}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate">
                            {p.email || 'No email provided'}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Intent & Tone Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Intent Chips */}
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Outreach Intent
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(
                      [
                        { id: 'DOCUMENT_REQUEST', label: 'Doc Request' },
                        { id: 'MILESTONE_CHASE', label: 'Milestone Chase' },
                        { id: 'PROGRESS_UPDATE', label: 'Progress Update' },
                      ] as const
                    ).map((chip) => {
                      const isSelected = intent === chip.id;
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => setIntent(chip.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${isSelected
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tone Chips */}
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Email Tone
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(
                      [
                        { id: 'professional', label: 'Professional' },
                        { id: 'urgent', label: 'Urgent' },
                        { id: 'friendly', label: 'Friendly' },
                      ] as const
                    ).map((chip) => {
                      const isSelected = tone === chip.id;
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => setTone(chip.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${isSelected
                              ? 'bg-[#E1007A] text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* AI Draft Trigger Button */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium">
                  Auto-fill subject and body using Gemini LLM context:
                </span>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={handleGenerateAiDraft}
                  isLoading={isGeneratingDraft}
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-[#E1007A]" />}
                  className="font-bold text-[11px] border-[#E1007A]/30 text-[#E1007A] hover:bg-pink-50"
                >
                  {isGeneratingDraft ? 'Generating Draft...' : 'Generate with AI'}
                </Button>
              </div>
            </div>

            {/* Iceberg Digital Branded Email Template Preview & Editor Canvas */}
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              {/* Email Brand Header Bar */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 text-white flex items-center justify-between border-b border-pink-500/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#E1007A] flex items-center justify-center font-black text-white text-xs shadow-xs">
                    I
                  </div>
                  <div>
                    <span className="font-black tracking-wider text-xs text-white">
                      ICEBERG DIGITAL
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold ml-1.5">
                      • Sales Progression
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block text-[10px] font-mono text-pink-300 bg-pink-950/60 border border-pink-800/60 rounded px-1.5 py-0.5 font-bold">
                    Ref: {caseId.slice(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Email Meta Info Bar */}
              <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-12 text-[10px] font-bold uppercase text-slate-400">
                    From:
                  </span>
                  <span className="font-semibold text-slate-700">
                    {senderName} &lt;{senderEmail}&gt; (Sales Progressor)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12 text-[10px] font-bold uppercase text-slate-400">
                    To:
                  </span>
                  <span className="font-bold text-slate-900">
                    {primaryRecipient ? primaryRecipient.name : 'Select recipients'}
                    {selectedParticipants.length > 1 && (
                      <span className="font-normal text-slate-500 ml-1.5 text-xs">
                        (+ {selectedParticipants.length - 1} other stakeholders)
                      </span>
                    )}
                  </span>
                  {primaryRecipient && getParticipantRole(primaryRecipient) && (
                    <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                      {getParticipantRole(primaryRecipient)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12 text-[10px] font-bold uppercase text-slate-400">
                    Property:
                  </span>
                  <span className="font-semibold text-slate-800 truncate">
                    {caseTitle}
                  </span>
                </div>
              </div>

              {/* Editable Subject Field */}
              <div className="p-3.5 border-b border-slate-200 flex items-center gap-2">
                <span className="w-12 text-xs font-bold text-slate-500 shrink-0">
                  Subject:
                </span>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject line"
                  className="flex-1 text-xs font-bold text-slate-900 focus:outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Editable Body Area */}
              <div className="p-4 bg-white">
                <textarea
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder="Write or generate your email body..."
                  rows={9}
                  className="w-full text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none resize-y min-h-[160px] font-normal"
                />
              </div>

              {/* Sales Progressor Signature Block */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-800 to-slate-950 text-white font-bold text-xs flex items-center justify-center border-2 border-pink-500 shadow-xs shrink-0">
                    {senderName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div className="space-y-0.5 text-xs flex-1">
                    <div className="font-black text-slate-900">
                      {senderName}
                    </div>
                    <div className="text-[11px] font-semibold text-[#E1007A]">
                      Sales Progression Specialist
                    </div>
                    <div className="text-[10px] text-slate-500 pt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>✉️ {senderEmail}</span>
                      <span>📞 {senderPhone}</span>
                      <span>🏢 Iceberg Digital Case Management</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/80 text-[10px] text-slate-400 italic">
                  Confidential communication sent on behalf of the transaction stakeholders regarding property sales progression.
                </div>
              </div>
            </div>

            {/* Error Message */}
            {composerError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{composerError}</span>
              </div>
            )}

            {/* Send Dispatch Actions */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Simulated Mode: Recorded to Case History (No external SMTP)</span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSending}
                disabled={selectedParticipants.length === 0}
                leftIcon={<Send className="w-3.5 h-3.5" />}
                className="font-bold text-xs shadow-xs"
              >
                Send to {selectedParticipants.length} Stakeholder
                {selectedParticipants.length === 1 ? '' : 's'} (Simulated)
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column: Sent Communications Outbox / History */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-bold text-slate-900">
                  Outbox & History
                </h3>
                <Badge variant="default" size="xs">
                  {communications.length}
                </Badge>
              </div>
            </div>

            {/* Search Filter */}
            {communications.length > 0 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Filter sent messages..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
            )}

            {/* Communications List */}
            {filteredHistory.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-700">
                  No Communications Logged Yet
                </div>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  When you send an email draft to a stakeholder, it will appear here in the dispatch outbox.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredHistory.map((group) => {
                  const isBodyExpanded = expandedCommId === group.primaryId;
                  const isRecipientsExpanded =
                    expandedRecipientsId === group.primaryId;
                  const hasMultipleRecipients = group.recipients.length > 1;
                  const primaryRecipient = group.recipients[0];
                  const dateFormatted = new Date(group.createdAt).toLocaleString(
                    'en-GB',
                    {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    },
                  );

                  return (
                    <div
                      key={group.primaryId}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 truncate">
                              {primaryRecipient.recipientName}
                            </span>
                            {primaryRecipient.recipientRole && (
                              <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                                {primaryRecipient.recipientRole}
                              </span>
                            )}
                            {hasMultipleRecipients && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedRecipientsId(
                                    isRecipientsExpanded ? null : group.primaryId,
                                  )
                                }
                                aria-label="Toggle stakeholders list"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-[#E1007A] bg-pink-50 hover:bg-pink-100 border border-pink-200 px-2 py-0.5 rounded-full cursor-pointer transition-colors"
                              >
                                <Users className="w-3 h-3" />
                                <span>+{group.recipients.length - 1} stakeholders</span>
                                {isRecipientsExpanded ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-800 truncate">
                            {group.subject}
                          </div>
                        </div>

                        <Badge variant="success" size="xs">
                          Delivered
                        </Badge>
                      </div>

                      {/* Extendable Accordion for Multiple Stakeholders */}
                      {hasMultipleRecipients && isRecipientsExpanded && (
                        <div className="p-2.5 bg-white rounded-lg border border-pink-100 shadow-2xs space-y-1.5 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100">
                            <span>All Stakeholders ({group.recipients.length})</span>
                            <span className="text-[9px] text-emerald-600 font-semibold">
                              Simulated Dispatch
                            </span>
                          </div>
                          <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto">
                            {group.recipients.map((r) => (
                              <div
                                key={r.id}
                                className="py-1 flex items-center justify-between gap-2 text-[11px]"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-semibold text-slate-800 truncate">
                                    {r.recipientName}
                                  </span>
                                  {r.recipientRole && (
                                    <span className="text-[9px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
                                      {r.recipientRole}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono truncate">
                                  {r.recipientEmail}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                        <span>{dateFormatted}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCommId(isBodyExpanded ? null : group.primaryId)
                          }
                          className="font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isBodyExpanded ? 'Hide' : 'View Email'}</span>
                          {isBodyExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {/* Expanded Email Body Preview */}
                      {isBodyExpanded && (
                        <div className="mt-2 p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed font-mono text-[11px]">
                          {group.bodyText}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationsTab;
