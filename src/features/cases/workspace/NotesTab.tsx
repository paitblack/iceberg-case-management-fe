import React, { useState } from 'react';
import {
  MessageSquare,
  Lock,
  Globe,
  Send,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import type { BffCaseNote, AddCaseNotePayload } from '../../../types/api';

interface NotesTabProps {
  notes?: BffCaseNote[];
  onAddNote: (payload: AddCaseNotePayload) => Promise<void>;
  isSubmitting?: boolean;
}

export const NotesTab: React.FC<NotesTabProps> = ({
  notes = [],
  onAddNote,
  isSubmitting = false,
}) => {
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setFormError('Please enter note content.');
      return;
    }

    setFormError(null);
    try {
      await onAddNote({
        content: content.trim(),
        isPrivate,
      });
      setContent('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Failed to post case note.');
      }
    }
  };

  // Sort notes descending (newest first)
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="space-y-6">
      {/* Top Creation Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#E1007A]" />
              Case Activity & Progression Notes
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Record internal agent updates or publish shared milestone memos
              for legal representatives.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setIsPrivate(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isPrivate
                  ? 'bg-white text-[#E1007A] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Public Update</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrivate(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isPrivate
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Private Note</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {formError}
            </div>
          )}

          <div className="relative">
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                isPrivate
                  ? 'Write a private internal note (visible only to estate progressors and agency managers)...'
                  : 'Write a milestone update (visible to buyer, seller, and instructed conveyancers)...'
              }
              className={`w-full p-3.5 rounded-xl border text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all resize-none ${
                isPrivate
                  ? 'bg-amber-50/20 border-amber-200/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-200/20'
                  : 'bg-white border-slate-200 focus:border-[#E1007A] focus:ring-2 focus:ring-pink-100'
              }`}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              {isPrivate ? (
                <span className="flex items-center gap-1 text-amber-700 font-semibold">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  Internal only: Excluded from client & solicitor portal
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <Globe className="w-3.5 h-3.5 text-emerald-500" />
                  Public update: Broadcast to all case stakeholders
                </span>
              )}
            </div>

            <Button
              type="submit"
              variant={isPrivate ? 'secondary' : 'primary'}
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Post Note
            </Button>
          </div>
        </form>
      </div>

      {/* Notes Stream Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Timeline Ledger ({sortedNotes.length})</span>
          </h4>
        </div>

        {sortedNotes.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white border border-dashed border-slate-200 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">
              No Notes Recorded Yet
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Post internal notes or stakeholder updates above to build a
              permanent timeline for this sales progression.
            </p>
          </div>
        ) : (
          sortedNotes.map((note) => (
            <div
              key={note.id}
              className={`p-4 md:p-5 rounded-2xl border transition-all space-y-2.5 shadow-2xs ${
                note.isPrivate
                  ? 'bg-amber-50/25 border-amber-200/70'
                  : 'bg-white border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      note.isPrivate
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-pink-100 text-[#E1007A]'
                    }`}
                  >
                    <User className="w-4 h-4" />
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-900">
                      {note.authorName || 'Case Progressor'}
                    </span>
                    {note.authorRole && (
                      <span className="text-[10px] text-slate-500 ml-1.5">
                        ({note.authorRole})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={note.isPrivate ? 'warning' : 'info'}
                    size="xs"
                  >
                    {note.isPrivate ? 'Internal Note' : 'Public Update'}
                  </Badge>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(note.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pl-9">
                {note.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
