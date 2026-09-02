import React from 'react';
import { Globe, Lock, Users, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import type { BffParticipant } from '../../../types/api';

export interface VisibilitySelectorProps {
  isPrivate: boolean;
  onChangeIsPrivate: (isPrivate: boolean) => void;
  visibleToParticipantIds: string[];
  onChangeVisibleParticipants: (ids: string[]) => void;
  participants?: BffParticipant[];
  disabled?: boolean;
  compact?: boolean;
}

export const VisibilitySelector: React.FC<VisibilitySelectorProps> = ({
  isPrivate,
  onChangeIsPrivate,
  visibleToParticipantIds,
  onChangeVisibleParticipants,
  participants = [],
  disabled = false,
  compact = false,
}) => {
  const toggleParticipant = (participantId: string) => {
    if (disabled) return;
    if (visibleToParticipantIds.includes(participantId)) {
      onChangeVisibleParticipants(
        visibleToParticipantIds.filter((id) => id !== participantId),
      );
    } else {
      onChangeVisibleParticipants([...visibleToParticipantIds, participantId]);
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    onChangeVisibleParticipants(participants.map((p) => p.id));
  };

  const handleClearAll = () => {
    if (disabled) return;
    onChangeVisibleParticipants([]);
  };

  return (
    <div className="space-y-3">
      {/* Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <span>Access & Visibility</span>
        </label>

        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChangeIsPrivate(false)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              !isPrivate
                ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200/60'
                : 'text-slate-500 hover:text-slate-800'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>Public (All Case Parties)</span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onChangeIsPrivate(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isPrivate
                ? 'bg-white text-amber-800 shadow-xs border border-amber-300/80'
                : 'text-slate-500 hover:text-slate-800'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Private (Selected Stakeholders)</span>
          </button>
        </div>
      </div>

      {/* Expanded Participant Selection Panel for Private Notes */}
      {isPrivate && (
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/90 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Select external stakeholders granted visibility:</span>
            </span>

            {participants.length > 0 && !disabled && (
              <div className="flex items-center gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-amber-300">•</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {participants.length === 0 ? (
            <p className="text-[11px] text-amber-800/80 italic">
              No external stakeholders are currently assigned to this case.
            </p>
          ) : (
            <div
              className={`grid gap-1.5 ${
                compact
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}
            >
              {participants.map((p) => {
                const isSelected = visibleToParticipantIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleParticipant(p.id)}
                    className={`flex items-start gap-2 p-2 rounded-lg text-left transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-white border-amber-300 text-amber-950 shadow-2xs font-semibold'
                        : 'bg-amber-100/50 border-amber-200/60 text-amber-800 hover:bg-white/80'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="mt-0.5 shrink-0 text-amber-700">
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-amber-700" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-amber-500/70" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs truncate font-bold text-slate-800">
                          {p.name}
                        </span>
                        {p.roleName && (
                          <Badge variant="default" size="xs">
                            {p.roleName}
                          </Badge>
                        )}
                      </div>
                      {p.companyName && (
                        <p className="text-[10px] text-slate-500 truncate">
                          {p.companyName}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <p className="text-[10px] text-amber-700/90 leading-tight">
            * Internal staff, progressors, and the note author will always retain full visibility.
          </p>
        </div>
      )}
    </div>
  );
};
