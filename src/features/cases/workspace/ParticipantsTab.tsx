import React, { useState, useMemo, useEffect } from 'react';
import {
  Mail,
  Phone,
  Building,
  UserCheck,
  UserPlus,
  Shield,
  Eye,
  Trash2,
  Search,
  Check,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import {
  REGISTERED_SYSTEM_CONTACTS,
  type RegisteredContact,
} from '../../../types/auth';
import type {
  BffParticipant,
  AssignParticipantPayload,
} from '../../../types/api';

export const STANDARD_STAKEHOLDER_ROLES = [
  {
    id: 'role-vendor-solicitor',
    label: "Seller's Conveyancer (Vendor Solicitor)",
    name: 'Seller Solicitor',
  },
  {
    id: 'role-buyer-solicitor',
    label: "Buyer's Conveyancer (Buyer Solicitor)",
    name: 'Buyer Solicitor',
  },
  {
    id: 'role-vendor',
    label: 'Seller / Vendor',
    name: 'Vendor',
  },
  {
    id: 'role-buyer',
    label: 'Buyer / Purchaser',
    name: 'Buyer',
  },
  {
    id: 'role-estate-agent',
    label: 'Estate Agent & Sales Progressor',
    name: 'Estate Agent',
  },
  {
    id: 'role-mortgage-broker',
    label: 'Mortgage Broker / Financial Advisor',
    name: 'Mortgage Broker',
  },
  {
    id: 'role-surveyor',
    label: 'RICS Surveyor / Property Valuer',
    name: 'Surveyor',
  },
];

interface ParticipantsTabProps {
  participants?: BffParticipant[];
  roles?: Array<{ id: string; name: string; description?: string }>;
  onAssignParticipant: (payload: AssignParticipantPayload) => Promise<void>;
  onRemoveParticipant: (participantId: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const ParticipantsTab: React.FC<ParticipantsTabProps> = ({
  participants = [],
  roles = [],
  onAssignParticipant,
  onRemoveParticipant,
  isSubmitting = false,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const availableRoles =
    roles && roles.length > 0
      ? roles.map((r) => ({
          id: r.id,
          label: r.name,
          name: r.name,
        }))
      : STANDARD_STAKEHOLDER_ROLES;

  // Form state
  const [roleId, setRoleId] = useState<string>(
    availableRoles[0]?.id || 'role-vendor-solicitor',
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedContact, setSelectedContact] =
    useState<RegisteredContact | null>(null);
  const [isPrimary, setIsPrimary] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (
      availableRoles.length > 0 &&
      !availableRoles.some((r) => r.id === roleId)
    ) {
      setRoleId(availableRoles[0].id);
    }
  }, [availableRoles, roleId]);

  // Filter and sort directory contacts based on search query and selected role
  const filteredContacts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return REGISTERED_SYSTEM_CONTACTS.filter((c) => {
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.roleLabel.toLowerCase().includes(q) ||
        (c.jobTitle && c.jobTitle.toLowerCase().includes(q))
      );
    }).sort((a, b) => {
      // Prioritize contacts matching the chosen role
      const aMatches = a.roleId === roleId ? 1 : 0;
      const bMatches = b.roleId === roleId ? 1 : 0;
      return bMatches - aMatches;
    });
  }, [searchQuery, roleId]);

  // When modal opens or role changes, auto-recommend the first matching contact if none selected
  const handleOpenModal = () => {
    setFormError(null);
    setSearchQuery('');
    const recommended = REGISTERED_SYSTEM_CONTACTS.find(
      (c) => c.roleId === roleId,
    );
    setSelectedContact(recommended || REGISTERED_SYSTEM_CONTACTS[0]);
    setIsAddModalOpen(true);
  };

  const handleRoleChange = (newRoleId: string) => {
    setRoleId(newRoleId);
    // If the currently selected contact doesn't match, pick a recommended one
    const matching = REGISTERED_SYSTEM_CONTACTS.find(
      (c) => c.roleId === newRoleId,
    );
    if (matching) {
      setSelectedContact(matching);
    }
  };

  const getRoleLabel = (rId: string, fallbackName?: string) => {
    const found = availableRoles.find((r) => r.id === rId);
    if (found) return found.name;
    return fallbackName || rId;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact) {
      setFormError('Please select a registered contact from the directory.');
      return;
    }

    setFormError(null);
    try {
      await onAssignParticipant({
        roleId,
        contactId: selectedContact.id,
        name: selectedContact.name,
        email: selectedContact.email,
        phone: selectedContact.phone,
        companyName: selectedContact.companyName,
        isPrimary,
      });

      setIsAddModalOpen(false);
      setSearchQuery('');
      setSelectedContact(null);
      setIsPrimary(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Failed to assign participant.');
      }
    }
  };

  const handleRemove = async (pId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to remove this legal participant from the case?',
      )
    ) {
      return;
    }
    setDeletingId(pId);
    try {
      await onRemoveParticipant(pId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header with Role Visibility Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#E1007A]" />
            Case Stakeholders & Legal Network ({participants.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based milestone visibility, conveyancer assignments, and secure
            communication ledger.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<UserPlus className="w-3.5 h-3.5" />}
          onClick={handleOpenModal}
        >
          Assign Stakeholder / Solicitor
        </Button>
      </div>

      {/* Role Visibility Information Box */}
      <div className="p-4 rounded-2xl bg-pink-50/40 border border-pink-100 text-xs text-slate-600 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <Eye className="w-4 h-4 text-[#E1007A]" />
          <span>Role-Based Access & Dynamic Work Item Ownership</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Assigned solicitors and parties will automatically be mapped to
          governing milestone work items in the Workflow Progression timeline.
        </p>
      </div>

      {/* Stakeholders Cards Grid */}
      {participants.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-dashed border-slate-200 text-center space-y-3">
          <Shield className="w-8 h-8 text-slate-300 mx-auto" />
          <div className="max-w-sm mx-auto space-y-1">
            <h4 className="text-sm font-bold text-slate-700">
              No Stakeholders Assigned
            </h4>
            <p className="text-xs text-slate-400">
              Assign buyer, seller, conveyancers, and surveyors to enable
              multi-party tracking and dynamic task ownership.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            onClick={handleOpenModal}
          >
            Add First Stakeholder
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {participants.map((p) => {
            const roleLabel = getRoleLabel(p.roleId, p.roleName);
            const isDeleting = deletingId === p.id;

            return (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-3 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge
                        variant={
                          p.roleId.includes('buyer')
                            ? 'keyDate'
                            : p.roleId.includes('vendor')
                              ? 'required'
                              : p.roleId.includes('solicitor')
                                ? 'info'
                                : 'default'
                        }
                        size="xs"
                      >
                        {roleLabel}
                      </Badge>

                      {p.isPrimary && (
                        <span
                          title="Primary Contact for Party"
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-pink-50 text-[#E1007A] border border-pink-200/60"
                        >
                          <UserCheck className="w-3 h-3" />
                          Primary
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 pt-1 truncate">
                      {p.name}
                    </h4>

                    {p.companyName && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                        <Building className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{p.companyName}</span>
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(p.id)}
                    disabled={isDeleting}
                    title="Remove participant"
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                  {p.email && (
                    <a
                      href={`mailto:${p.email}`}
                      className="flex items-center gap-2 hover:text-[#E1007A] transition-colors py-0.5 truncate"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{p.email}</span>
                    </a>
                  )}
                  {p.phone && (
                    <a
                      href={`tel:${p.phone}`}
                      className="flex items-center gap-2 hover:text-[#E1007A] transition-colors py-0.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{p.phone}</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}

          {/* Quick Add Placeholder Card */}
          <button
            type="button"
            onClick={handleOpenModal}
            className="p-5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#E1007A]/50 hover:bg-pink-50/20 transition-all flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-[#E1007A] group cursor-pointer min-h-[140px]"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-pink-100 flex items-center justify-center transition-colors">
              <UserPlus className="w-4 h-4 text-slate-500 group-hover:text-[#E1007A]" />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-700 group-hover:text-[#E1007A]">
                Assign Stakeholder
              </p>
              <p className="text-[10px] text-slate-400">
                Add solicitor, buyer, seller, or agent
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Directory-Based Assign Stakeholder Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Assign Stakeholder from Registered Directory"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={!selectedContact}
              onClick={handleAddSubmit}
              leftIcon={<Check className="w-3.5 h-3.5" />}
              data-testid="assign-stakeholder-submit-btn"
            >
              Assign Stakeholder
            </Button>
          </div>
        }
      >
        <form
          onSubmit={handleAddSubmit}
          className="space-y-4 text-xs text-slate-700"
        >
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {formError}
            </div>
          )}

          {/* 1. Role Selection */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Case Role to Assign <span className="text-[#E1007A]">*</span>
            </label>
            <select
              value={roleId}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-xs font-bold text-slate-900 focus:border-[#E1007A] focus:outline-none shadow-2xs"
            >
              {availableRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Directory Autocomplete Search */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Search & Select Contact <span className="text-[#E1007A]">*</span>
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <Input
                placeholder="Search by name, company, role, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs bg-slate-50/60 focus:bg-white"
              />
            </div>
          </div>

          {/* 3. Filtered Contacts Directory Cards */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Directory Contacts ({filteredContacts.length})</span>
              <span className="text-[#E1007A]">Click to select</span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
              {filteredContacts.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No matching contacts found in directory for &quot;{searchQuery}&quot;
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const isSelected = selectedContact?.id === contact.id;
                  const isRoleMatch = contact.roleId === roleId;

                  return (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-pink-50/80 border-[#E1007A] shadow-xs'
                          : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {/* Left: Avatar + Info */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSelected
                              ? 'bg-[#E1007A] text-white shadow-2xs'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {contact.avatarInitials}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs truncate">
                              {contact.name}
                            </span>
                            {isRoleMatch && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-pink-700 bg-pink-100 px-1.5 py-0.2 rounded">
                                <Sparkles className="w-2.5 h-2.5 text-[#E1007A]" />
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">
                            {contact.companyName}{' '}
                            {contact.jobTitle ? `• ${contact.jobTitle}` : ''}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {contact.email}{' '}
                            {contact.phone ? `• ${contact.phone}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Right: Selected Checkmark */}
                      <div className="shrink-0">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-[#E1007A] text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-300 bg-white" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 4. Selected Summary Box */}
          {selectedContact && (
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-950">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 min-w-0">
                <p className="font-bold text-emerald-900">
                  Ready to link: {selectedContact.name} ({selectedContact.companyName})
                </p>
                <p className="text-[11px] text-emerald-800">
                  Assigned as <strong>{getRoleLabel(roleId)}</strong> for this case.
                </p>
              </div>
            </div>
          )}

          {/* 5. Primary Checkbox */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <input
              type="checkbox"
              id="isPrimaryCheck"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="rounded border-slate-300 text-[#E1007A] focus:ring-[#E1007A]"
            />
            <label
              htmlFor="isPrimaryCheck"
              className="text-xs font-semibold text-slate-700 cursor-pointer select-none"
            >
              Designate as Primary Contact for this Role
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};
