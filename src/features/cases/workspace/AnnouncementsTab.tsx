import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Reply,
  AtSign,
  Lock,
  Globe,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { VisibilitySelector } from './VisibilitySelector';
import { useAuth } from '../../auth/AuthContext';
import { ApiError } from '../../../lib/api-client';
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

  const mentionableParticipants = useMemo(() => {
    if (!participants || !user) return participants || [];
    return participants.filter((p) => {
      const isSelf =
        p.id === user.id ||
        p.contactId === user.id ||
        (user.name &&
          p.name.trim().toLowerCase() === user.name.trim().toLowerCase()) ||
        (user.fullname &&
          p.name.trim().toLowerCase() === user.fullname.trim().toLowerCase());
      return !isSelf;
    });
  }, [participants, user]);

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
      if (err instanceof ApiError) {
        setComposerError(err.problem.detail || err.message);
      } else if (err instanceof Error) {
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
      if (err instanceof ApiError) {
        setReplyError(err.problem.detail || err.message);
      } else if (err instanceof Error) {
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

  const [filterTab, setFilterTab] = useState<'all' | 'mentions' | 'private'>('all');

  const filteredAnnouncements = useMemo(() => {
    if (filterTab === 'mentions') {
      return sortedAnnouncements.filter((a) => Boolean(a.mentionedParticipantName));
    }
    if (filterTab === 'private') {
      return sortedAnnouncements.filter((a) => a.isPrivate);
    }
    return sortedAnnouncements;
  }, [sortedAnnouncements, filterTab]);

  const mentionsCount = useMemo(
    () => sortedAnnouncements.filter((a) => Boolean(a.mentionedParticipantName)).length,
    [sortedAnnouncements],
  );

  const privateCount = useMemo(
    () => sortedAnnouncements.filter((a) => a.isPrivate).length,
    [sortedAnnouncements],
  );

  const getInitials = (name: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatMentionBadge = (name?: string): string => {
    if (!name) return '';
    const clean = name.replace(/^@+/, '').trim();
    return `@${clean}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Stat Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-50 border border-pink-100 text-[#E1007A] flex items-center justify-center shadow-2xs shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              Discussions & Announcements
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Case communication stream with stakeholder mentions and visibility controls.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All ({announcements.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('mentions')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              filterTab === 'mentions'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Mentions ({mentionsCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('private')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              filterTab === 'private'
                ? 'bg-white text-amber-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-3 h-3 text-amber-600" />
            <span>Private ({privateCount})</span>
          </button>
        </div>
      </div>


      {/* Top Announcement Creation Card */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
        {/* Persona Header Bar */}
        <div className="px-5 py-2.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
              {getInitials(user?.name || 'Me')}
            </div>
            <span>
              Posting as <strong className="text-slate-800 font-semibold">{user?.name || 'Agent'}</strong>
              {user?.roles?.[0] ? ` (${user.roles[0].replace('role-', '')})` : ''}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Direct mentions notify assigned stakeholders
          </span>
        </div>

        <form onSubmit={handleRootSubmit} className="p-5 space-y-3.5">
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share a case announcement, mortgage update, legal search inquiry, or key milestone memo..."
            className="w-full text-xs p-3.5 rounded-xl border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-[#E1007A]/20 focus:border-[#E1007A] bg-white transition-all resize-none placeholder:text-slate-400 font-normal leading-relaxed shadow-2xs"
            disabled={isPostingAnnouncement}
          />

          {/* Action Row with Mention Selector and Submit Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
            {mentionableParticipants.length > 0 && (
              <div className="relative flex-1 max-w-md">
                <div className="relative flex items-center">
                  <div className="absolute left-3 pointer-events-none text-indigo-500">
                    <AtSign className="w-3.5 h-3.5" />
                  </div>
                  <select
                    value={rootMentionedId}
                    onChange={(e) => setRootMentionedId(e.target.value)}
                    disabled={isPostingAnnouncement}
                    title="Assign Responder / Mention Stakeholder (Optional)"
                    className="w-full text-xs pl-8 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-slate-700 font-medium transition-all appearance-none cursor-pointer shadow-2xs"
                  >
                    <option value="">-- No direct mention (Broadcast to everyone) --</option>
                    {mentionableParticipants.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.roleName || p.roleId})
                        {p.companyName ? ` - ${p.companyName}` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 pointer-events-none text-slate-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end ml-auto">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isPostingAnnouncement}
                leftIcon={<Send className="w-3.5 h-3.5" />}
                className="shadow-xs hover:shadow-sm font-semibold"
              >
                Post Announcement
              </Button>
            </div>
          </div>

          {/* Visibility Selector */}
          <div className="pt-2.5 border-t border-slate-100">
            <VisibilitySelector
              isPrivate={isPrivate}
              onChangeIsPrivate={setIsPrivate}
              visibleToParticipantIds={visibleToParticipantIds}
              onChangeVisibleParticipants={setVisibleToParticipantIds}
              participants={participants}
              disabled={isPostingAnnouncement}
            />
          </div>

          {composerError && (
            <p className="text-xs text-rose-600 font-medium">{composerError}</p>
          )}
        </form>
      </div>

      {/* Announcements Stream */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white border border-dashed border-slate-200 text-center space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 text-[#E1007A] flex items-center justify-center mx-auto">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">
                {filterTab === 'all'
                  ? 'No Discussions or Announcements Yet'
                  : `No announcements found matching filter '${filterTab}'`}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {filterTab === 'all'
                  ? 'Be the first to post a milestone update or start a conversation thread with stakeholders on this case.'
                  : 'Try selecting a different filter tab or clear the filter to view all announcements.'}
              </p>
            </div>
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => {
            const isPriv = announcement.isPrivate;
            const visibleCount = (announcement.visibleToParticipantIds || []).length;
            const isReplying = activeReplyId === announcement.id;
            const replies = announcement.replies || [];

            return (
              <div
                key={announcement.id}
                className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden"
              >
                {/* Header Row */}
                <div className="px-5 py-3.5 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white flex items-center justify-center text-xs font-bold shadow-xs ring-1 ring-slate-900/10">
                      {getInitials(announcement.authorName || 'Agent')}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {announcement.authorName || 'Case Progressor'}
                        </span>
                        {announcement.authorRole && (
                          <span className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/70 px-2 py-0.5 rounded-full">
                            {announcement.authorRole}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-medium">
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
                  <div className="flex flex-wrap items-center gap-2">
                    {announcement.mentionedParticipantName && (
                      <span className="inline-flex items-center text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg shadow-2xs">
                        <span>
                          {formatMentionBadge(announcement.mentionedParticipantName)} • Awaiting
                          Response
                        </span>
                      </span>
                    )}
                    {isPriv ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg shadow-2xs">
                        <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>
                          Private
                          {visibleCount > 0
                            ? ` (${visibleCount} stakeholders)`
                            : ''}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg shadow-2xs">
                        <Globe className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Public Update</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Message Body Content */}
                <div className="p-5">
                  <div className="text-[13px] text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
                    {announcement.content}
                  </div>
                </div>

                {/* Action Bar Footer */}
                <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#E1007A] bg-white hover:bg-pink-50/60 rounded-xl border border-slate-200/80 hover:border-pink-200 transition-all cursor-pointer shadow-2xs"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>{isReplying ? 'Cancel Reply' : 'Reply'}</span>
                  </button>

                  {replies.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-100/90 px-2.5 py-1 rounded-full border border-slate-200/60">
                      <MessageSquare className="w-3 h-3 text-slate-400" />
                      <span>
                        {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                      </span>
                    </span>
                  )}
                </div>

                {/* Nested Replies Thread */}
                {replies.length > 0 && (
                  <div className="bg-slate-50/70 border-t border-slate-100 p-4 sm:p-5 space-y-3">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
                      <Reply className="w-3 h-3 text-slate-400 rotate-180" />
                      <span>Responses ({replies.length})</span>
                    </div>

                    {replies.map((reply: AnnouncementReplySnapshot) => {
                      const replyIsPriv = reply.isPrivate;
                      return (
                        <div
                          key={reply.id}
                          className={`p-4 rounded-xl border text-xs space-y-2.5 shadow-2xs transition-all ${
                            replyIsPriv
                              ? 'bg-amber-50/40 border-amber-200/80'
                              : 'bg-white border-slate-200/80 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-800 to-slate-700 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
                                {getInitials(reply.authorName || 'U')}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 text-xs">
                                    {reply.authorName || 'Stakeholder'}
                                  </span>
                                  {reply.authorRole && (
                                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/70 px-1.5 py-0.5 rounded">
                                      {reply.authorRole}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
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
                            <div className="flex items-center gap-1.5">
                              {reply.mentionedParticipantName && (
                                <span className="inline-flex items-center text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md shadow-2xs">
                                  <span>
                                    {formatMentionBadge(reply.mentionedParticipantName)} • Awaiting
                                    Response
                                  </span>
                                </span>
                              )}

                              {replyIsPriv ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-200/60">
                                  <Lock className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                  <span>Private</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                  <Globe className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                  <span>Public</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-[12.5px] text-slate-700 leading-relaxed whitespace-pre-wrap pl-9 font-normal">
                            {reply.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Inline Reply Composer */}
                {isReplying && (
                  <div className="bg-slate-50/70 border-t border-slate-200/80 p-4 sm:p-5">
                    <form
                      onSubmit={(e) => handleReplySubmit(announcement.id, e)}
                      className="p-4 rounded-xl bg-white border border-slate-200/90 space-y-3 shadow-xs"
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
                        className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E1007A]/20 focus:border-[#E1007A] bg-slate-50/30 focus:bg-white resize-none shadow-2xs font-normal"
                        disabled={isPostingReply}
                      />

                      {/* Mention & Actions Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
                        {mentionableParticipants.length > 0 && (
                          <div className="relative flex-1 max-w-sm">
                            <div className="relative flex items-center">
                              <div className="absolute left-2.5 pointer-events-none text-indigo-500">
                                <AtSign className="w-3.5 h-3.5" />
                              </div>
                              <select
                                value={mentionedParticipantId}
                                onChange={(e) =>
                                  setMentionedParticipantId(e.target.value)
                                }
                                disabled={isPostingReply}
                                className="w-full text-xs pl-7 pr-7 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none text-slate-700 cursor-pointer shadow-2xs"
                              >
                                <option value="">
                                  -- No specific stakeholder tagged --
                                </option>
                                {mentionableParticipants.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} {p.roleName ? `(${p.roleName})` : ''}{' '}
                                    {p.companyName ? `- ${p.companyName}` : ''}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-2.5 pointer-events-none text-slate-400">
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 self-end sm:self-auto ml-auto">
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
                      </div>

                      {/* Visibility Selector */}
                      <div className="pt-2 border-t border-slate-100">
                        <VisibilitySelector
                          isPrivate={replyIsPrivate}
                          onChangeIsPrivate={setReplyIsPrivate}
                          visibleToParticipantIds={replyVisibleIds}
                          onChangeVisibleParticipants={setReplyVisibleIds}
                          participants={participants}
                          disabled={isPostingReply}
                          compact
                        />
                      </div>

                      {replyError && (
                        <p className="text-xs text-rose-600 font-medium">
                          {replyError}
                        </p>
                      )}
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

