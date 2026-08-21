import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface BlockersBannerProps {
  blockers: string[];
}

export const BlockersBanner: React.FC<BlockersBannerProps> = ({ blockers }) => {
  if (!blockers || blockers.length === 0) return null;

  return (
    <div className="p-4 rounded-2xl bg-amber-50/95 border border-amber-300 text-amber-950 shadow-xs flex items-start gap-3.5 transition-all animate-in fade-in">
      <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
        <AlertTriangle className="w-4 h-4" />
      </div>

      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
            Active Progression Blockers ({blockers.length})
          </h3>
          <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
            Action Required
          </span>
        </div>

        {blockers.length === 1 ? (
          <p className="text-xs font-semibold text-amber-900 leading-relaxed">
            {blockers[0]}
          </p>
        ) : (
          <ul className="list-disc list-inside space-y-1 text-xs font-medium text-amber-900">
            {blockers.map((blocker, index) => (
              <li key={index} className="leading-relaxed">
                {blocker}
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-1.5 text-[11px] text-amber-700/90 pt-0.5">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>
            These tasks must be resolved by their assigned roles before
            subsequent milestones can be unlocked.
          </span>
        </div>
      </div>
    </div>
  );
};
