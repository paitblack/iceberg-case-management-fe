import React from 'react';
import { Mail, Phone, Building, UserCheck } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import type { BffParticipant } from '../../../types/api';

interface ParticipantsTabProps {
  participants: BffParticipant[];
}

export const ParticipantsTab: React.FC<ParticipantsTabProps> = ({
  participants,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          Case Stakeholders & Legal Representatives ({participants.length})
        </h3>
        <span className="text-[11px] text-slate-400">
          Synchronized with Lifesycle Contacts Master
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {participants.map((p) => (
          <div
            key={p.id}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <Badge
                  variant={
                    p.roleName.includes('Buyer')
                      ? 'keyDate'
                      : p.roleName.includes('Seller')
                        ? 'required'
                        : p.roleName.includes('Solicitor')
                          ? 'info'
                          : 'default'
                  }
                  size="xs"
                >
                  {p.roleName}
                </Badge>
                <h4 className="text-sm font-extrabold text-slate-900 pt-1">
                  {p.name}
                </h4>
              </div>

              {p.isPrimary && (
                <div
                  title="Primary Contact"
                  className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {p.companyName && (
              <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                {p.companyName}
              </p>
            )}

            <div className="space-y-1.5 pt-1 text-xs border-t border-slate-100">
              <a
                href={`mailto:${p.email}`}
                className="flex items-center gap-2 text-slate-600 hover:text-[#E1007A] transition-colors truncate"
              >
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{p.email}</span>
              </a>

              {p.phone && (
                <a
                  href={`tel:${p.phone}`}
                  className="flex items-center gap-2 text-slate-600 hover:text-[#E1007A] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{p.phone}</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
