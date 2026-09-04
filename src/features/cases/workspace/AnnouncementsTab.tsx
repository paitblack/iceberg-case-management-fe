import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Reply,
  AtSign,
  Lock,
  Globe,
  Clock,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { VisibilitySelector } from './VisibilitySelector';
import { useAuth } from '../../auth/AuthContext';
import type {
  AnnouncementTreeSnapshot,
  AnnouncementReplySnapshot,
  BffParticipant,
  CreateAnnouncementPayload,
  CreateAnnouncementReplyPayload,
} from '../../../types/api';

export interface AnnouncementsTabProps {
  announcements?: AnnouncementTreeSnapshot[];
  participants?: BffParticipant[];
  onPostAnnouncement: (payload: CreateAnnouncementPayload) => Promise<void>;
  onPostReply: (
    announcementId: string,
    payload: CreateAnnouncementReplyPayload,
  ) => Promise<void>;
  isPostingAnnouncement?: boolean;
  isPostingReply?: boolean;
}

export const AnnouncementsTab: React.FC<AnnouncementsTabProps> = ({
  announcements = [],
  participants = [],
  onPostAnnouncement,
  onPostReply,
  isPostingAnnouncement = false,
  isPostingReply = false,
}) => {
  // Root Composer State
  const [content, setContent] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [visibleToParticipantIds, setVisibleToParticipantIds] = useState<
    string[]
  >([]);
  const [rootMentionedId, setRootMentionedId] = useState<string>('');
  const [composerError, setComposerError] = useState<string | null>(null);
  const { user } = useAuth();

  const eligibleParticipants = participants.filter((p) => {
    if (!user) return true;
    if (p.id === user.id || p.contactId === user.id) return false;
    if (
      user.name &&
      p.name.trim().toLowerCase() === user.name.trim().toLowerCase()
    ) {
      return false;
    }
    return true;
  });

  // Reply Composer State (keyed by parent announcement ID)
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<string>('');
  const [replyIsPrivate, setReplyIsPrivate] = useState<boolean>(false);
  const [replyVisibleIds, setReplyVisibleIds] = useState<string[]>([]);
  const [mentionedParticipantId, setMentionedParticipantId] =
    useState<string>('');
  const [replyError, setReplyError] = useState<string | null>(null);

  const handleRootSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setComposerError('Please enter announcement content.');
      return;
    }

    setComposerError(null);
    try {
      await onPostAnnouncement({
        content: content.trim(),
        isPrivate,
        visibleToParticipantIds: isPrivate ? visibleToParticipantIds : [],
        mentionedParticipantId: rootMentionedId || undefined,
      });
      setContent('');
      setIsPrivate(false);
      setVisibleToParticipantIds([]);
      setRootMentionedId('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setComposerError(err.message);
      } else {
        setComposerError('Failed to post announcement.');
      }
    }
  };

  const handleReplySubmit = async (parentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      setReplyError('Please enter reply text.');
      return;
    }

    setReplyError(null);
    try {
      await onPostReply(parentId, {
        content: replyContent.trim(),
        isPrivate: replyIsPrivate,
        visibleToParticipantIds: replyIsPrivate ? replyVisibleIds : [],
        mentionedParticipantId: mentionedParticipantId || undefined,
      });
      setReplyContent('');
      setReplyIsPrivate(false);
      setReplyVisibleIds([]);
      setMentionedParticipantId('');
      setActiveReplyId(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setReplyError(err.message);
      } else {
        setReplyError('Failed to post reply.');
      }
    }
  };

  // Sort announcements descending (newest first)
  const sortedAnnouncements = [...announcements].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const getInitials = (name: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Top Announcement Creation Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#E1007A]" />
            <span>Discussions & Announcements</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Broadcast updates, milestones, or targeted inquiries to case stakeholders
            with granular visibility and direct mentions.
          </p>
        </div>

        <form onSubmit={handleRootSubmit} className="space-y-3.5">
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share a case announcement, mortgage update, legal search inquiry, or key milestone memo..."
            className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E1007A]/20 focus:border-[#E1007A] bg-slate-50/50 hover:bg-white focus:bg-white transition-all resize-none shadow-2xs"
            disabled={isPostingAnnouncement}
          />

          {/* Mention Stakeholder Selector */}
          {eligibleParticipants.length > 0 && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <AtSign className="w-3 h-3 text-[#E1007A]" />
                <span>Assign Responder / Mention Stakeholder (Optional):</span>
              </label>
              <select
                value={rootMentionedId}
                onChange={(e) => setRootMentionedId(e.target.value)}
                disabled={isPostingAnnouncement}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#E1007A]/20 focus:border-[#E1007A] text-slate-700 font-medium"
              >
                <option value="">-- No direct mention (Broadcast to everyone) --</option>
                {eligibleParticipants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.roleName || p.roleId})
                    {p.companyName ? ` - ${p.companyName}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Visibility Selector */}
          <VisibilitySelector
            isPrivate={isPrivate}
            onChangeIsPrivate={setIsPrivate}
            visibleToParticipantIds={visibleToParticipantIds}
            onChangeVisibleParticipants={setVisibleToParticipantIds}
            participants={participants}
            disabled={isPostingAnnouncement}
          />

          {composerError && (
            <p className="text-xs text-rose-600 font-medium">{composerError}</p>
          )}

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isPostingAnnouncement}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Post Announcement
            </Button>
          </div>
        </form>
      </div>

      {/* Announcements Stream */}
      <div className="space-y-4">
        {sortedAnnouncements.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white border border-dashed border-slate-200 text-center space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 text-[#E1007A] flex items-center justify-center mx-auto">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">
                No Discussions or Announcements Yet
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Be the first to post a milestone update or start a conversation
                thread with stakeholders on this case.
              </p>
            </div>
          </div>
        ) : (
          sortedAnnouncements.map((announcement) => {
            const isPriv = announcement.isPrivate;
            const visibleCount = (announcement.visibleToParticipantIds || []).length;
            const isReplying = activeReplyId === announcement.id;
            const replies = announcement.replies || [];

            return (
              <div
                key={announcement.id}
                className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden transition-all hover:border-slate-300/90"
              >
                {/* Root Post Card Header & Content */}
                <div className="p-5 space-y-3">
                  {/* Header Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                        {getInitials(announcement.authorName || 'Agent')}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900">
                            {announcement.authorName || 'Case Progressor'}
                          </span>
                          {announcement.authorRole && (
                            <Badge variant="default" size="xs">
                              {announcement.authorRole}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(announcement.createdAt).toLocaleDateString(
                              undefined,
                              {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Visibility & Mention Badges */}
                    <div className="flex items-center gap-2">
                      {announcement.mentionedParticipantName && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                          <AtSign className="w-3 h-3 text-indigo-600" />
                          <span>
                            @{announcement.mentionedParticipantName} • Awaiting
                            Response
                          </span>
                        </span>
                      )}
                      {isPriv ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>
                            Private
                            {visibleCount > 0
                              ? ` (${visibleCount} stakeholders)`
                              : ''}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          <Globe className="w-3 h-3 text-emerald-600" />
                          <span>Public Update</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pl-12 font-normal">
                    {announcement.content}
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pl-12 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        if (isReplying) {
                          setActiveReplyId(null);
                        } else {
                          setActiveReplyId(announcement.id);
                          setReplyContent('');
                          setReplyError(null);
                          setReplyIsPrivate(announcement.isPrivate);
                          setReplyVisibleIds(
                            announcement.visibleToParticipantIds || [],
                          );
                        }
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#E1007A] transition-colors cursor-pointer"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>{isReplying ? 'Cancel Reply' : 'Reply'}</span>
                    </button>

                    {replies.length > 0 && (
                      <span className="text-[11px] font-semibold text-slate-400">
                        {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Nested Replies Thread */}
                {replies.length > 0 && (
                  <div className="bg-slate-50/70 border-t border-slate-100 p-4 md:p-5 pl-8 md:pl-12 space-y-3 relative">
                    {/* Vertical Thread Indicator Line */}
                    <div className="absolute left-6 md:left-9 top-0 bottom-6 w-0.5 bg-slate-200/80" />

                    {replies.map((reply: AnnouncementReplySnapshot) => {
                      const replyIsPriv = reply.isPrivate;
                      return (
                        <div
                          key={reply.id}
                          className={`relative p-3.5 rounded-xl border text-xs space-y-2 ml-3 md:ml-4 shadow-2xs ${
                            replyIsPriv
                              ? 'bg-amber-50/50 border-amber-200/90'
                              : 'bg-white border-slate-200/90'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold">
                                {getInitials(reply.authorName || 'U')}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900">
                                    {reply.authorName || 'Stakeholder'}
                                  </span>
                                  {reply.authorRole && (
                                    <Badge variant="default" size="xs">
                                      {reply.authorRole}
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  {new Date(reply.createdAt).toLocaleDateString(
                                    undefined,
                                    {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    },
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Visibility & Mention Badges */}
                            <div className="flex items-center gap-2">
                              {reply.mentionedParticipantName && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                                  <AtSign className="w-3 h-3 text-indigo-600" />
                                  <span>
                                    @{reply.mentionedParticipantName} • Awaiting
                                    Response
                                  </span>
                                </span>
                              )}

                              {replyIsPriv ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>Private</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                  <Globe className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>Public</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap pl-9">
                            {reply.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Inline Reply Composer */}
                {isReplying && (
                  <div className="bg-slate-50 border-t border-slate-200 p-4 md:p-5 pl-8 md:pl-14">
                    <form
                      onSubmit={(e) => handleReplySubmit(announcement.id, e)}
                      className="p-4 rounded-xl bg-white border border-slate-200 space-y-3.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Reply className="w-3.5 h-3.5 text-[#E1007A]" />
                          <span>
                            Reply to {announcement.authorName || 'Thread'}:
                          </span>
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveReplyId(null);
                            setReplyError(null);
                          }}
                          className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a targeted response, answer inquiry, or request clarification..."
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#E1007A]/20 focus:border-[#E1007A] bg-white resize-none"
                        disabled={isPostingReply}
                      />

                      {/* Mention / Target Stakeholder Selector */}
                      {eligibleParticipants.length > 0 && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                            <AtSign className="w-3 h-3 text-indigo-600" />
                            <span>
                              Assign Responder / Mention Stakeholder (Optional):
                            </span>
                          </label>
                          <select
                            value={mentionedParticipantId}
                            onChange={(e) =>
                              setMentionedParticipantId(e.target.value)
                            }
                            disabled={isPostingReply}
                            className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          >
                            <option value="">
                              -- No specific stakeholder tagged --
                            </option>
                            {eligibleParticipants.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} {p.roleName ? `(${p.roleName})` : ''}{' '}
                                {p.companyName ? `- ${p.companyName}` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Visibility Selector */}
                      <VisibilitySelector
                        isPrivate={replyIsPrivate}
                        onChangeIsPrivate={setReplyIsPrivate}
                        visibleToParticipantIds={replyVisibleIds}
                        onChangeVisibleParticipants={setReplyVisibleIds}
                        participants={participants}
                        disabled={isPostingReply}
                        compact
                      />

                      {replyError && (
                        <p className="text-xs text-rose-600 font-medium">
                          {replyError}
                        </p>
                      )}

                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          disabled={isPostingReply}
                          onClick={() => {
                            setActiveReplyId(null);
                            setReplyError(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          size="xs"
                          isLoading={isPostingReply}
                          leftIcon={<Send className="w-3 h-3" />}
                        >
                          Post Reply
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
