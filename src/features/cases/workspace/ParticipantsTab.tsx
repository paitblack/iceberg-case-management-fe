import React, { useState } from 'react';
import {
  Mail,
  Phone,
  Building,
  UserCheck,
  UserPlus,
  Shield,
  Eye,
  Trash2,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
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
  onAssignParticipant: (payload: AssignParticipantPayload) => Promise<void>;
  onRemoveParticipant: (participantId: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const ParticipantsTab: React.FC<ParticipantsTabProps> = ({
  participants = [],
  onAssignParticipant,
  onRemoveParticipant,
  isSubmitting = false,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [roleId, setRoleId] = useState<string>('role-vendor-solicitor');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isPrimary, setIsPrimary] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const getRoleLabel = (rId: string, fallbackName?: string) => {
    const found = STANDARD_STAKEHOLDER_ROLES.find((r) => r.id === rId);
    if (found) return found.name;
    return fallbackName || rId;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please provide the full contact name.');
      return;
    }

    setFormError(null);
    try {
      await onAssignParticipant({
        roleId,
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        companyName: companyName.trim() || undefined,
        isPrimary,
      });

      setIsAddModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      setCompanyName('');
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
          onClick={() => {
            setFormError(null);
            setIsAddModalOpen(true);
          }}
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
            onClick={() => setIsAddModalOpen(true)}
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
        </div>
      )}

      {/* Add / Assign Stakeholder Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Assign Legal Representative / Stakeholder"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddSubmit}
              isLoading={isSubmitting}
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            >
              Confirm Assignment
            </Button>
          </>
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

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Stakeholder Role <span className="text-[#E1007A]">*</span>
            </label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-xs font-bold text-slate-900 focus:border-[#E1007A] focus:outline-none"
            >
              {STANDARD_STAKEHOLDER_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Full Name / Contact Person{' '}
              <span className="text-[#E1007A]">*</span>
            </label>
            <Input
              placeholder="e.g. David Reynolds"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="e.g. d.reynolds@reynolds-law.co.uk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Direct Phone Number
              </label>
              <Input
                type="tel"
                placeholder="e.g. +44 1865 492001"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Law Firm / Company Name
            </label>
            <Input
              placeholder="e.g. Reynolds & Co Legal"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
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
