import React, { useState } from 'react';
import {
  Mail,
  Phone,
  Building,
  UserCheck,
  UserPlus,
  Shield,
  Eye,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import type { BffParticipant } from '../../../types/api';

interface ParticipantsTabProps {
  participants?: BffParticipant[];
  onAddParticipant?: (participant: BffParticipant) => void;
}

export const ParticipantsTab: React.FC<ParticipantsTabProps> = ({
  participants = [],
  onAddParticipant,
}) => {
  const [list, setList] = useState<BffParticipant[]>(participants);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [roleName, setRoleName] = useState('Buyer Solicitor');
  const [isPrimary, setIsPrimary] = useState(false);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const newP: BffParticipant = {
      id: `p-${Date.now()}`,
      roleId: `role-${roleName.toLowerCase().replace(/\s+/g, '-')}`,
      roleName,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      companyName: companyName.trim() || undefined,
      isPrimary,
    };

    setList((prev) => [...prev, newP]);
    if (onAddParticipant) {
      onAddParticipant(newP);
    }

    setIsAddModalOpen(false);
    setName('');
    setEmail('');
    setPhone('');
    setCompanyName('');
    setIsPrimary(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header with Role Visibility Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#E1007A]" />
            Case Stakeholders & Multi-Party Legal Network ({list.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based milestone visibility, solicitor assignments, and secure
            communication ledger.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<UserPlus className="w-3.5 h-3.5" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Assign Stakeholder / Solicitor
        </Button>
      </div>

      {/* Role Visibility Information Box */}
      <div className="p-4 rounded-2xl bg-pink-50/40 border border-pink-100 text-xs text-slate-600 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <Eye className="w-4 h-4 text-[#E1007A]" />
          <span>Role-Based Access & Information Boundary Rules</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          <strong>Estate Agents & Progressors:</strong> Full access to all
          stages, internal notes, and audit timeline. •{' '}
          <strong>Buyer & Buyer Solicitor:</strong> Access to buyer AML
          verification, search results, and mortgage milestone status. •{' '}
          <strong>Seller & Seller Solicitor:</strong> Access to TA6/TA10
          protocol forms, contract pack approval, and completion funds.
        </p>
      </div>

      {/* Stakeholders Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((p) => (
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
                <h4 className="text-sm font-bold text-slate-900 pt-1">
                  {p.name}
                </h4>
                {p.companyName && (
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Building className="w-3 h-3 text-slate-400" />
                    {p.companyName}
                  </p>
                )}
              </div>

              {p.isPrimary && (
                <span
                  title="Primary Legal Contact"
                  className="p-1 rounded-md bg-pink-50 text-[#E1007A]"
                >
                  <UserCheck className="w-4 h-4" />
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-600">
              <a
                href={`mailto:${p.email}`}
                className="flex items-center gap-2 hover:text-[#E1007A] transition-colors py-0.5"
              >
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{p.email}</span>
              </a>
              {p.phone && (
                <a
                  href={`tel:${p.phone}`}
                  className="flex items-center gap-2 hover:text-[#E1007A] transition-colors py-0.5"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{p.phone}</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

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
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddSubmit}
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
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Stakeholder Role <span className="text-[#E1007A]">*</span>
            </label>
            <select
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-xs font-bold text-slate-900 focus:border-[#E1007A] focus:outline-none"
            >
              <option value="Buyer Solicitor">
                Buyer Solicitor (Buyer Legal Rep)
              </option>
              <option value="Seller Solicitor">
                Seller Solicitor (Vendor Legal Rep)
              </option>
              <option value="Buyer / Purchaser">Buyer / Purchaser</option>
              <option value="Vendor / Seller">Vendor / Seller</option>
              <option value="Mortgage Broker">Mortgage Broker / Advisor</option>
              <option value="Surveyor">RICS Surveyor / Valuer</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Full Name / Contact Person{' '}
              <span className="text-[#E1007A]">*</span>
            </label>
            <Input
              placeholder="e.g. Jessica Vance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Email Address <span className="text-[#E1007A]">*</span>
              </label>
              <Input
                type="email"
                placeholder="e.g. j.vance@legal.co.uk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Direct Phone Number
              </label>
              <Input
                type="tel"
                placeholder="e.g. +44 20 7946 0120"
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
              placeholder="e.g. Cavendish Legal LLP"
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
              className="text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Designate as Primary Legal Representative for this party
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};
