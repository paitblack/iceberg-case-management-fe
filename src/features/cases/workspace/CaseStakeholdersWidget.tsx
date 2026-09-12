import React, { useState } from 'react';
import {
  Users,
  Mail,
  Phone,
  Building2,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import type {
  BffParticipant,
  AssignParticipantPayload,
} from '../../../types/api';
import {
  REGISTERED_SYSTEM_CONTACTS,
  type RegisteredContact,
} from '../../../types/auth';

export interface CaseStakeholdersWidgetProps {
  participants: BffParticipant[];
  roles?: Array<{ id: string; name: string; description?: string }>;
  onAssignParticipant?: (payload: AssignParticipantPayload) => Promise<void>;
  onRemoveParticipant?: (participantId: string) => Promise<void>;
  isSubmitting?: boolean;
  className?: string;
}

interface PartyConfig {
  partyTag: string;
  cleanRoleTitle: string;
  badgeClass: string;
  avatarClass: string;
  borderLeftClass: string;
}

function getPartyConfig(roleId: string, roleName?: string): PartyConfig {
  const text = (roleId + ' ' + (roleName || '')).toLowerCase();

  // 1. Seller / Vendor side
  if (text.includes('vendor') || text.includes('seller')) {
    const isSolicitor = text.includes('solicitor') || text.includes('conveyanc');
    return {
      partyTag: 'SELLER',
      cleanRoleTitle: isSolicitor ? "Seller's Solicitor" : 'Property Vendor',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 font-extrabold',
      avatarClass: 'bg-amber-100 text-amber-800 border-amber-300',
      borderLeftClass: 'border-l-amber-500',
    };
  }

  // 2. Buyer / Purchaser side
  if (text.includes('buyer') || text.includes('purchaser')) {
    const isSolicitor = text.includes('solicitor') || text.includes('conveyanc');
    return {
      partyTag: 'BUYER',
      cleanRoleTitle: isSolicitor ? "Buyer's Solicitor" : 'Buyer (Purchaser)',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-300 font-extrabold',
      avatarClass: 'bg-sky-100 text-sky-700 border-sky-300',
      borderLeftClass: 'border-l-sky-500',
    };
  }

  // 3. Estate Agency / Progressor
  if (text.includes('agent') || text.includes('progressor')) {
    return {
      partyTag: 'AGENCY',
      cleanRoleTitle: 'Sales Progressor',
      badgeClass: 'bg-pink-50 text-[#E1007A] border-pink-300 font-extrabold',
      avatarClass: 'bg-pink-100 text-[#E1007A] border-pink-300',
      borderLeftClass: 'border-l-[#E1007A]',
    };
  }

  // 4. Financial Advisors & Surveyors
  if (text.includes('mortgage') || text.includes('broker') || text.includes('finance')) {
    return {
      partyTag: 'FINANCE',
      cleanRoleTitle: 'Mortgage Broker',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-300 font-extrabold',
      avatarClass: 'bg-purple-100 text-purple-700 border-purple-300',
      borderLeftClass: 'border-l-purple-500',
    };
  }

  if (text.includes('surveyor') || text.includes('valuation')) {
    return {
      partyTag: 'SURVEY',
      cleanRoleTitle: 'RICS Surveyor',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-extrabold',
      avatarClass: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      borderLeftClass: 'border-l-emerald-500',
    };
  }

  return {
    partyTag: 'PARTY',
    cleanRoleTitle: roleName || 'Stakeholder',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 font-extrabold',
    avatarClass: 'bg-slate-100 text-slate-700 border-slate-300',
    borderLeftClass: 'border-l-slate-400',
  };
}

const getPersonInitials = (name: string) => {
  const parts = name
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const CaseStakeholdersWidget: React.FC<CaseStakeholdersWidgetProps> = ({
  participants,
  roles = [],
  onAssignParticipant,
  onRemoveParticipant,
  isSubmitting = false,
  className = '',
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactId, setContactId] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getRoleDisplayName = (p: BffParticipant) => {
    if (p.roleName) return p.roleName;
    const match = roles.find((r) => r.id === p.roleId);
    if (match) return match.name;
    return p.roleId
      .replace(/^role-/, '')
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const handleOpenAddModal = () => {
    if (roles.length > 0) {
      setSelectedRoleId(roles[0].id);
    }
    setName('');
    setEmail('');
    setPhone('');
    setCompanyName('');
    setContactId(undefined);
    setErrorMessage(null);
    setIsAddModalOpen(true);
  };

  const handleSelectQuickContact = (contact: RegisteredContact | null) => {
    if (!contact) return;
    setName(contact.name);
    setEmail(contact.email);
    setPhone(contact.phone || '');
    setCompanyName(contact.companyName);
    setContactId(contact.id);
  };

  const handleSaveParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter a stakeholder name.');
      return;
    }
    if (!selectedRoleId) {
      setErrorMessage('Please select a role.');
      return;
    }

    if (onAssignParticipant) {
      try {
        await onAssignParticipant({
          roleId: selectedRoleId,
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          companyName: companyName.trim() || undefined,
          contactId,
          isPrimary: true,
        });
        setIsAddModalOpen(false);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Failed to assign stakeholder.');
        }
      }
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-2.5 ${className}`}>
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-pink-50 text-[#E1007A] flex items-center justify-center border border-pink-200/60 shadow-2xs">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Stakeholders & Solicitors</span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-full">
                {participants.length}
              </span>
            </h4>
          </div>
        </div>

        {onAssignParticipant && (
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E1007A] hover:text-[#c4006a] hover:bg-pink-50 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
            title="Add case stakeholder"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        )}
      </div>

      {/* Stakeholders List */}
      {participants.length === 0 ? (
        <div className="py-5 text-center space-y-1 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <p className="text-xs font-medium text-slate-600">
            No Stakeholders Assigned
          </p>
          <p className="text-[11px] text-slate-400">
            Assign contacts to track participants on this case.
          </p>
        </div>
      ) : (
        <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-0.5">
          {participants.map((p) => {
            const rawRoleName = getRoleDisplayName(p);
            const party = getPartyConfig(p.roleId, rawRoleName);
            const isAgent = party.partyTag === 'AGENCY';

            return (
              <div
                key={p.id}
                className={`p-2.5 rounded-xl border border-slate-200/90 border-l-[3.5px] ${party.borderLeftClass} bg-white hover:bg-slate-50/60 transition-all shadow-2xs group space-y-1.5`}
              >
                {/* Header: Party Badge (BUYER / SELLER / AGENCY) + Role Title + Primary & Delete */}
                <div className="flex items-center justify-between gap-1.5 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] tracking-wider uppercase border shrink-0 ${party.badgeClass}`}
                    >
                      {party.partyTag}
                    </span>
                    <span
                      className="text-[11px] font-semibold text-slate-700 truncate"
                      title={rawRoleName}
                    >
                      {party.cleanRoleTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {p.isPrimary && (
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
                        Primary
                      </span>
                    )}
                    {onRemoveParticipant && !isAgent && (
                      <button
                        type="button"
                        onClick={() => onRemoveParticipant(p.id)}
                        disabled={isSubmitting}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                        title="Remove participant"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Middle: Person Avatar + Full Name & Company */}
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg border text-[11px] font-extrabold flex items-center justify-center shrink-0 shadow-2xs ${party.avatarClass}`}
                  >
                    {getPersonInitials(p.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-slate-900 truncate leading-tight">
                      {p.name}
                    </h5>
                    <p className="text-[10.5px] text-slate-500 truncate leading-tight flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{p.companyName || 'Independent'}</span>
                    </p>
                  </div>
                </div>

                {/* Footer: Direct Action Links (Email & Phone) */}
                {(p.email || p.phone) && (
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[10.5px] text-slate-500">
                    {p.email ? (
                      <a
                        href={`mailto:${p.email}`}
                        className="text-slate-600 hover:text-[#E1007A] flex items-center gap-1 truncate transition-colors min-w-0"
                        title={p.email}
                      >
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{p.email}</span>
                      </a>
                    ) : (
                      <span className="text-slate-300 italic text-[10px]">No email</span>
                    )}

                    {p.phone && (
                      <a
                        href={`tel:${p.phone}`}
                        className="text-slate-600 hover:text-[#E1007A] flex items-center gap-1 shrink-0 font-mono text-[10px] transition-colors ml-auto"
                        title={p.phone}
                      >
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{p.phone}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Assign Participant Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add Case Stakeholder"
          subtitle="Designate a legal representative or key participant on this case."
          maxWidth="md"
        >
          <form onSubmit={handleSaveParticipant} className="space-y-4 text-xs">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMessage}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Case Role <span className="text-[#E1007A]">*</span>
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#E1007A]"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Contact Directory Selection */}
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-500">
                Quick-Select from Directory
              </label>
              <select
                defaultValue=""
                onChange={(e) => {
                  const c =
                    REGISTERED_SYSTEM_CONTACTS.find(
                      (item) => item.id === e.target.value,
                    ) || null;
                  handleSelectQuickContact(c);
                }}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:border-[#E1007A]"
              >
                <option value="" disabled>
                  Select known contact...
                </option>
                {REGISTERED_SYSTEM_CONTACTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.companyName} ({c.roleLabel})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Full Name <span className="text-[#E1007A]">*</span>
              </label>
              <Input
                placeholder="e.g. Rachel Sterling"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="contact@lawfirm.co.uk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Company / Firm Name
              </label>
              <Input
                placeholder="e.g. Sterling Legal Solicitors"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Phone Number
              </label>
              <Input
                placeholder="+44 20 ..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={isSubmitting}
              >
                Save Stakeholder
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
