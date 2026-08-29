import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Send,
  Lock,
  Globe,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { VisibilitySelector } from './VisibilitySelector';
import type {
  NoteSnapshot,
  BffParticipant,
  AddCaseNotePayload,
} from '../../../types/api';

export interface StepNotesSectionProps {
  stepId: string;
  stepName: string;
  notes?: NoteSnapshot[];
  participants?: BffParticipant[];
  onAddNote: (payload: AddCaseNotePayload) => Promise<void>;
  isLoading?: boolean;
}

export const StepNotesSection: React.FC<StepNotesSectionProps> = ({
  stepId,
  stepName,
  notes = [],
  participants = [],
  onAddNote,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(notes.length > 0);
  const [isComposerOpen, setIsComposerOpen] = useState<boolean>(false);
  const [content, setContent] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [visibleToParticipantIds, setVisibleToParticipantIds] = useState<
    string[]
  >([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setErrorMsg('Please enter note text.');
      return;
    }

    setErrorMsg(null);
    try {
      await onAddNote({
        stepId,
        content: content.trim(),
        isPrivate,
        visibleToParticipantIds: isPrivate ? visibleToParticipantIds : [],
      });
      setContent('');
      setIsPrivate(false);
      setVisibleToParticipantIds([]);
      setIsComposerOpen(false);
      setIsOpen(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to save step note.');
      }
    }
  };

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
      {/* Header Bar */}
      <div className="p-3 bg-slate-50/80 flex items-center justify-between gap-3 border-b border-slate-100">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#E1007A]" />
          <span>Step Operational Notes</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-200/80 text-[10px] font-extrabold text-slate-700">
            {notes.length}
          </span>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {!isComposerOpen && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setIsOpen(true);
              setIsComposerOpen(true);
            }}
            leftIcon={<Plus className="w-3 h-3" />}
            className="text-xs text-[#E1007A] hover:bg-pink-50"
          >
            Add Step Note
          </Button>
        )}
      </div>

      {/* Expandable Body */}
      {isOpen && (
        <div className="p-3.5 space-y-3">
          {/* Note Composer Form */}
          {isComposerOpen && (
            <form
              onSubmit={handleSubmit}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">
                    New Note for {stepName}:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsComposerOpen(false);
                      setErrorMsg(null);
                    }}
                    className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Record an operational memo, stakeholder update, or blocker detail..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#E1007A]/20 focus:border-[#E1007A] bg-white resize-none"
                  disabled={isLoading}
                />
              </div>

              {/* Visibility Selector */}
              <VisibilitySelector
                isPrivate={isPrivate}
                onChangeIsPrivate={setIsPrivate}
                visibleToParticipantIds={visibleToParticipantIds}
                onChangeVisibleParticipants={setVisibleToParticipantIds}
                participants={participants}
                disabled={isLoading}
                compact
              />

              {errorMsg && (
                <p className="text-[11px] text-rose-600 font-medium">
                  {errorMsg}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={isLoading}
                  onClick={() => {
                    setIsComposerOpen(false);
                    setErrorMsg(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="xs"
                  isLoading={isLoading}
                  leftIcon={<Send className="w-3 h-3" />}
                >
                  Save Step Note
                </Button>
              </div>
            </form>
          )}

          {/* Notes List */}
          {sortedNotes.length === 0 && !isComposerOpen ? (
            <p className="text-xs text-slate-400 italic py-1">
              No operational notes recorded for this milestone yet.
            </p>
          ) : (
            <div className="space-y-2">
              {sortedNotes.map((note) => {
                const isPriv = note.isPrivate;
                const visibleCount = (note.visibleToParticipantIds || []).length;
                return (
                  <div
                    key={note.id}
                    className={`p-3 rounded-lg border text-xs space-y-1.5 transition-all ${
                      isPriv
                        ? 'bg-amber-50/40 border-amber-200/80'
                        : 'bg-white border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">
                          {note.authorName || 'Internal Progressor'}
                        </span>
                        {note.authorRole && (
                          <Badge variant="default" size="xs">
                            {note.authorRole}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isPriv ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                            <Lock className="w-2.5 h-2.5" />
                            <span>
                              Private
                              {visibleCount > 0 ? ` (${visibleCount} shared)` : ''}
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                            <Globe className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Public</span>
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(note.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
