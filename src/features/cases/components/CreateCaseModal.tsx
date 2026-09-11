import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Home,
  PoundSterling,
  AlertCircle,
  Users,
  ChevronDown,
  ChevronUp,
  Building2,
  Mail,
  Phone,
  Check,
  User,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import {
  createCase,
  fetchPublishedTemplates,
  assignCaseParticipant,
  ApiError,
} from '../../../lib/api-client';
import { useAuth } from '../../auth/AuthContext';
import {
  REGISTERED_SYSTEM_CONTACTS,
  type RegisteredContact,
} from '../../../types/auth';
import {
  STANDARD_TEMPLATE_ROLES,
  type TemplateRole,
} from '../../templates/context/TemplateBuilderContext';
import type { PublishedTemplateItem } from '../../../types/api';

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newCaseId: string) => void;
}

interface StakeholderInput {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  contactId?: string;
}

const getRoleInitials = (roleName: string) => {
  const words = roleName.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(Boolean);
  if (words.length === 0) return 'RO';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const getRoleBadgeStyle = (roleId: string) => {
  const id = roleId.toLowerCase();
  if (id.includes('agent') || id.includes('progressor')) {
    return {
      avatarBg: 'bg-pink-100 text-[#E1007A] border-pink-200',
      badge: 'bg-pink-50 text-[#E1007A] border-pink-200',
    };
  }
  if (id.includes('solicitor') || id.includes('conveyanc')) {
    return {
      avatarBg: 'bg-amber-100 text-amber-800 border-amber-200',
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  }
  if (id.includes('buyer')) {
    return {
      avatarBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  }
  if (id.includes('vendor') || id.includes('seller')) {
    return {
      avatarBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    };
  }
  return {
    avatarBg: 'bg-slate-100 text-slate-700 border-slate-200',
    badge: 'bg-slate-50 text-slate-700 border-slate-200',
  };
};

export const CreateCaseModal: React.FC<CreateCaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form state
  const [title, setTitle] = useState<string>('');
  const [templateVersionId, setTemplateVersionId] = useState<string>('');
  const [propertyAddress, setPropertyAddress] = useState<string>('');
  const [agreedPrice, setAgreedPrice] = useState<string>('');

  // Stakeholders assignment state (keyed by roleId)
  const [stakeholders, setStakeholders] = useState<
    Record<string, StakeholderInput>
  >({});
  const [isOptionalStakeholdersOpen, setIsOptionalStakeholdersOpen] =
    useState<boolean>(false);

  // Templates state
  const [templates, setTemplates] = useState<PublishedTemplateItem[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load published templates on modal open
  useEffect(() => {
    if (isOpen) {
      setIsLoadingTemplates(true);
      setErrorMessage(null);
      fetchPublishedTemplates()
        .then((res) => {
          if (res && res.length > 0) {
            setTemplates(res);
            setTemplateVersionId(res[0].id);
          } else {
            setTemplates([]);
            setTemplateVersionId('');
          }
        })
        .catch(() => {
          setTemplates([]);
          setTemplateVersionId('');
        })
        .finally(() => {
          setIsLoadingTemplates(false);
        });
    }
  }, [isOpen]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateVersionId),
    [templates, templateVersionId],
  );

  // Derive template roles dynamically (domain-agnostic)
  const templateRoles = useMemo<TemplateRole[]>(() => {
    if (
      selectedTemplate?.roles &&
      Array.isArray(selectedTemplate.roles) &&
      selectedTemplate.roles.length > 0
    ) {
      return selectedTemplate.roles.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        isRequired: r.isRequired ?? r.required ?? false,
        minOccurrences: r.minOccurrences,
        maxOccurrences: r.maxOccurrences,
      }));
    }
    // Fallback to standard conveyancing roles preset
    return STANDARD_TEMPLATE_ROLES;
  }, [selectedTemplate]);

  const requiredRoles = useMemo(
    () =>
      templateRoles.filter(
        (r) => r.isRequired || (r.minOccurrences && r.minOccurrences > 0),
      ),
    [templateRoles],
  );

  const optionalRoles = useMemo(
    () =>
      templateRoles.filter(
        (r) => !r.isRequired && (!r.minOccurrences || r.minOccurrences === 0),
      ),
    [templateRoles],
  );

  const assignedRequiredCount = useMemo(() => {
    return requiredRoles.filter(
      (r) =>
        stakeholders[r.id]?.name && stakeholders[r.id].name.trim().length > 0,
    ).length;
  }, [requiredRoles, stakeholders]);

  const allRequiredAssigned =
    requiredRoles.length > 0 &&
    assignedRequiredCount === requiredRoles.length;

  // Pre-populate default operator (logged-in user) for internal estate agent/progressor role
  useEffect(() => {
    if (isOpen && templateRoles.length > 0) {
      setStakeholders((prev) => {
        const next = { ...prev };
        const agentRole = templateRoles.find(
          (r) =>
            r.id === 'role-estate-agent' ||
            r.id.toLowerCase().includes('agent') ||
            r.id.toLowerCase().includes('progressor'),
        );
        if (agentRole && !next[agentRole.id]?.name) {
          next[agentRole.id] = {
            name: user?.name || 'Sarah Jenkins',
            email: user?.email || 'sarah.jenkins@iceberg-agency.co.uk',
            phone: '+44 20 7946 0912',
            companyName: 'Iceberg Estate Agency',
            contactId: user?.id,
          };
        }
        return next;
      });
    }
  }, [isOpen, templateRoles, user]);

  const handleSelectDirectoryContact = (
    roleId: string,
    contact: RegisteredContact | null,
  ) => {
    if (!contact) return;
    setStakeholders((prev) => ({
      ...prev,
      [roleId]: {
        name: contact.name,
        email: contact.email,
        phone: contact.phone || '',
        companyName: contact.companyName,
        contactId: contact.id,
      },
    }));
  };

  const handleUpdateStakeholder = (
    roleId: string,
    field: keyof StakeholderInput,
    value: string,
  ) => {
    setStakeholders((prev) => {
      const existing = prev[roleId] || {
        name: '',
        email: '',
        phone: '',
        companyName: '',
      };
      return {
        ...prev,
        [roleId]: {
          ...existing,
          [field]: value,
        },
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please enter a descriptive case title.');
      return;
    }
    if (!templateVersionId) {
      setErrorMessage('Please select a workflow template version.');
      return;
    }

    // Validate that all required template roles have a contact assigned
    for (const role of requiredRoles) {
      const assigned = stakeholders[role.id];
      if (!assigned || !assigned.name.trim()) {
        setErrorMessage(
          `Please assign a contact for the required stakeholder: "${role.name}".`,
        );
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const targetCaseTypeId =
        selectedTemplate?.caseTypeId || selectedTemplate?.id;

      const payload = {
        title: title.trim(),
        caseTypeId: targetCaseTypeId,
        propertyAddress: propertyAddress.trim() || undefined,
        agreedPrice: agreedPrice
          ? Number(agreedPrice.replace(/[^0-9.]/g, ''))
          : undefined,
      };

      // 1. Create Case in database
      const res = await createCase(payload);
      const newCaseId = res.id;

      // 2. Assign initial stakeholders to the case directory
      const assignmentTasks = Object.entries(stakeholders)
        .filter(([_, contact]) => contact.name.trim().length > 0)
        .map(([roleId, contact]) =>
          assignCaseParticipant(newCaseId, {
            roleId,
            name: contact.name.trim(),
            email: contact.email?.trim() || undefined,
            phone: contact.phone?.trim() || undefined,
            companyName: contact.companyName?.trim() || undefined,
            contactId: contact.contactId || undefined,
            isPrimary: true,
          }).catch((err) => {
            console.warn(
              `Failed to assign stakeholder for role '${roleId}':`,
              err,
            );
          }),
        );

      await Promise.allSettled(assignmentTasks);

      onClose();
      if (onSuccess) {
        onSuccess(newCaseId);
      } else {
        navigate(`/cases/${newCaseId}`);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.problem.detail || err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to create case in backend database.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isInternalAgentRole = (roleId: string) => {
    const id = roleId.toLowerCase();
    return (
      id === 'role-estate-agent' ||
      id.includes('agent') ||
      id.includes('progressor')
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start New Case Workflow"
      subtitle="Configure transaction particulars and assign required legal representatives."
      maxWidth="7xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>Workflow:</span>
            <span className="font-semibold text-slate-900">
              {selectedTemplate?.name || 'None selected'}
            </span>
            <span className="text-slate-300">|</span>
            <span
              className={
                allRequiredAssigned
                  ? 'text-emerald-700 font-semibold flex items-center gap-1.5'
                  : 'text-slate-600 font-medium flex items-center gap-1.5'
              }
            >
              {allRequiredAssigned ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
              )}
              {assignedRequiredCount} of {requiredRoles.length} Required Parties Ready
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleSubmit}
              disabled={templates.length === 0}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Launch Case Workflow
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-xs text-slate-700">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 flex-1 min-w-0">
              <p className="font-semibold text-xs text-rose-900">Cannot Create Case</p>
              <p className="text-[11px] leading-relaxed break-words text-rose-700">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* 2-Column Responsive Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Left Column (5 cols): Case Setup, Property Particulars & Template */}
          <div className="lg:col-span-5 space-y-5">
            {/* Card 1: Case Particulars */}
            <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/90 space-y-4 shadow-2xs">
              <div className="border-b border-slate-200/70 pb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Case Particulars
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  General identifiers and conveyancing property details.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Case Title <span className="text-[#E1007A]">*</span>
                </label>
                <Input
                  placeholder="e.g. 42 Woodstock Road Sale Progression"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                  className="text-xs bg-white border-slate-200 shadow-2xs font-medium focus:border-[#E1007A]"
                />
                <p className="text-[10px] text-slate-400">
                  A clear reference identifying the property or conveyancing matter.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Property Address (Optional)
                  </label>
                  <div className="relative">
                    <Home className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <Input
                      placeholder="e.g. 42 Woodstock Road, Oxford"
                      value={propertyAddress}
                      onChange={(e) => setPropertyAddress(e.target.value)}
                      className="pl-8 text-xs bg-white border-slate-200 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Agreed Price (Optional)
                  </label>
                  <div className="relative">
                    <PoundSterling className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <Input
                      placeholder="e.g. 475000"
                      value={agreedPrice}
                      onChange={(e) => setAgreedPrice(e.target.value)}
                      className="pl-8 text-xs font-mono bg-white border-slate-200 shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Workflow Progression Template */}
            <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/90 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Workflow Template <span className="text-[#E1007A]">*</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Governs progression milestones, tasks, and role requirements.
                  </p>
                </div>
                {isLoadingTemplates && (
                  <span className="text-[10px] text-slate-400 animate-pulse">
                    Loading templates...
                  </span>
                )}
              </div>

              {templates.length === 0 && !isLoadingTemplates ? (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
                  <p className="font-semibold">No Published Templates</p>
                  <p className="text-[11px]">
                    Publish a workflow template in the Template Studio first.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {templates.map((tpl) => {
                    const isSelected = tpl.id === templateVersionId;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => setTemplateVersionId(tpl.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                          isSelected
                            ? 'border-[#E1007A] bg-white ring-1 ring-[#E1007A]/25 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center ${
                                isSelected
                                  ? 'bg-[#E1007A] text-white'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              <Layers className="w-3 h-3" />
                            </div>
                            <span className="font-bold text-slate-900 text-xs">
                              {tpl.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {tpl.stepCount !== undefined && (
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                                {tpl.stepCount} steps
                              </span>
                            )}
                            <Badge
                              variant={isSelected ? 'required' : 'default'}
                              size="xs"
                            >
                              v{tpl.versionNumber}.0
                            </Badge>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 line-clamp-2 pl-7">
                          {tpl.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Card 3: Readiness Summary Widget */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Setup Progress</span>
                <span className="font-bold text-slate-900">
                  {assignedRequiredCount} / {requiredRoles.length} Required Parties
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    allRequiredAssigned ? 'bg-emerald-500' : 'bg-[#E1007A]'
                  }`}
                  style={{
                    width: `${
                      requiredRoles.length > 0
                        ? (assignedRequiredCount / requiredRoles.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                {allRequiredAssigned
                  ? 'All mandatory case roles have been designated and verified.'
                  : 'Complete contact information for all required parties to proceed.'}
              </p>
            </div>
          </div>

          {/* Right Column (7 cols): Stakeholders & Legal Network Directory */}
          <div className="lg:col-span-7 space-y-3.5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    Case Stakeholders & Legal Network
                    <span className="text-[10px] font-normal text-slate-500">
                      ({requiredRoles.length} required
                      {optionalRoles.length > 0
                        ? `, ${optionalRoles.length} optional`
                        : ''}
                      )
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Assign contacts for mandatory conveyancing roles. Progressors
                    manage workflow tasks on their behalf.
                  </p>
                </div>
              </div>

              <Badge
                variant={allRequiredAssigned ? 'success' : 'default'}
                size="xs"
              >
                {allRequiredAssigned
                  ? 'All Required Ready'
                  : `${assignedRequiredCount} / ${requiredRoles.length} Configured`}
              </Badge>
            </div>

            {/* Scrollable Stakeholder List (Shows comfortably, scrolls cleanly) */}
            <div className="max-h-[560px] overflow-y-auto pr-1.5 space-y-3">
              {requiredRoles.map((role) => {
                const assigned = stakeholders[role.id] || {
                  name: '',
                  email: '',
                  phone: '',
                  companyName: '',
                };
                const matchingContacts = REGISTERED_SYSTEM_CONTACTS.filter(
                  (c) => c.roleId === role.id,
                );
                const isFilled = assigned.name.trim().length > 0;
                const isAgent = isInternalAgentRole(role.id);
                const roleStyle = getRoleBadgeStyle(role.id);

                return (
                  <div
                    key={role.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 shadow-2xs ${
                      isAgent
                        ? 'bg-slate-50/50 border-slate-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Card Top Row: Role Identity, Tags, Directory Selector, Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] border shrink-0 ${roleStyle.avatarBg}`}
                        >
                          {getRoleInitials(role.name)}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs">
                            {role.name}
                          </span>
                          <span className="text-[#E1007A] font-bold text-xs">*</span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            Required
                          </span>
                          {isAgent && (
                            <span className="text-[10px] font-semibold text-[#E1007A] bg-pink-50 border border-pink-100 px-2 py-0.5 rounded-full">
                              Your Agency (Logged In)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isFilled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Check className="w-3 h-3 stroke-[2.5]" /> Assigned
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            Pending Assignment
                          </span>
                        )}

                        {matchingContacts.length > 0 && (
                          <select
                            onChange={(e) => {
                              const contact =
                                REGISTERED_SYSTEM_CONTACTS.find(
                                  (c) => c.id === e.target.value,
                                ) || null;
                              handleSelectDirectoryContact(role.id, contact);
                            }}
                            defaultValue=""
                            className="text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:border-[#E1007A] cursor-pointer shadow-2xs"
                          >
                            <option value="" disabled>
                              Select from directory ({matchingContacts.length})...
                            </option>
                            {matchingContacts.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} — {c.companyName}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    {/* 2x2 Clean Input Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-slate-600">
                          Full Name <span className="text-[#E1007A]">*</span>
                        </label>
                        <div className="relative">
                          <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <Input
                            placeholder={`e.g. ${role.name} contact name`}
                            value={assigned.name}
                            onChange={(e) =>
                              handleUpdateStakeholder(
                                role.id,
                                'name',
                                e.target.value,
                              )
                            }
                            className="pl-8 text-xs bg-slate-50/60 hover:bg-white focus:bg-white border-slate-200 rounded-lg shadow-2xs"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-slate-600">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <Input
                            type="email"
                            placeholder="client@example.co.uk"
                            value={assigned.email}
                            onChange={(e) =>
                              handleUpdateStakeholder(
                                role.id,
                                'email',
                                e.target.value,
                              )
                            }
                            className="pl-8 text-xs bg-slate-50/60 hover:bg-white focus:bg-white border-slate-200 rounded-lg shadow-2xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-slate-600">
                          Company / Firm Name
                        </label>
                        <div className="relative">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <Input
                            placeholder="e.g. Sterling Legal, Private Client"
                            value={assigned.companyName}
                            onChange={(e) =>
                              handleUpdateStakeholder(
                                role.id,
                                'companyName',
                                e.target.value,
                              )
                            }
                            className="pl-8 text-xs bg-slate-50/60 hover:bg-white focus:bg-white border-slate-200 rounded-lg shadow-2xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-slate-600">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <Input
                            placeholder="+44 20 ..."
                            value={assigned.phone}
                            onChange={(e) =>
                              handleUpdateStakeholder(
                                role.id,
                                'phone',
                                e.target.value,
                              )
                            }
                            className="pl-8 text-xs bg-slate-50/60 hover:bg-white focus:bg-white border-slate-200 rounded-lg shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Optional Stakeholders Collapsible Section */}
              {optionalRoles.length > 0 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setIsOptionalStakeholdersOpen((prev) => !prev)}
                    className="flex items-center justify-between w-full p-3 rounded-xl bg-slate-100/70 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer border border-slate-200"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      Additional Stakeholders ({optionalRoles.length} optional roles)
                    </span>
                    {isOptionalStakeholdersOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {isOptionalStakeholdersOpen && (
                    <div className="mt-2.5 space-y-3">
                      {optionalRoles.map((role) => {
                        const assigned = stakeholders[role.id] || {
                          name: '',
                          email: '',
                          phone: '',
                          companyName: '',
                        };
                        const matchingContacts =
                          REGISTERED_SYSTEM_CONTACTS.filter(
                            (c) => c.roleId === role.id,
                          );
                        const isFilled = assigned.name.trim().length > 0;
                        const roleStyle = getRoleBadgeStyle(role.id);

                        return (
                          <div
                            key={role.id}
                            className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3 hover:border-slate-300 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] border shrink-0 ${roleStyle.avatarBg}`}
                                >
                                  {getRoleInitials(role.name)}
                                </div>
                                <span className="font-bold text-slate-900 text-xs">
                                  {role.name}
                                </span>
                                <Badge variant="optional" size="xs">
                                  Optional
                                </Badge>
                              </div>

                              <div className="flex items-center gap-2">
                                {isFilled && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    <Check className="w-3 h-3 stroke-[2.5]" /> Assigned
                                  </span>
                                )}

                                {matchingContacts.length > 0 && (
                                  <select
                                    onChange={(e) => {
                                      const contact =
                                        REGISTERED_SYSTEM_CONTACTS.find(
                                          (c) => c.id === e.target.value,
                                        ) || null;
                                      handleSelectDirectoryContact(
                                        role.id,
                                        contact,
                                      );
                                    }}
                                    defaultValue=""
                                    className="text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:border-[#E1007A] cursor-pointer shadow-2xs"
                                  >
                                    <option value="" disabled>
                                      Select from directory ({matchingContacts.length})...
                                    </option>
                                    {matchingContacts.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name} — {c.companyName}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div className="space-y-1">
                                <label className="block text-[11px] font-medium text-slate-600">
                                  Full Name
                                </label>
                                <div className="relative">
                                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                                  <Input
                                    placeholder={`e.g. ${role.name} contact name`}
                                    value={assigned.name}
                                    onChange={(e) =>
                                      handleUpdateStakeholder(
                                        role.id,
                                        'name',
                                        e.target.value,
                                      )
                                    }
                                    className="pl-8 text-xs bg-slate-50/60 hover:bg-white focus:bg-white border-slate-200 rounded-lg shadow-2xs"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[11px] font-medium text-slate-600">
                                  Email Address
                                </label>
                                <div className="relative">
                                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                                  <Input
                                    type="email"
                                    placeholder="client@example.co.uk"
                                    value={assigned.email}
                                    onChange={(e) =>
                                      handleUpdateStakeholder(
                                        role.id,
                                        'email',
                                        e.target.value,
                                      )
                                    }
                                    className="pl-8 text-xs bg-slate-50/60 hover:bg-white focus:bg-white border-slate-200 rounded-lg shadow-2xs"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[11px] font-medium text-slate-600">
                                  Company / Firm Name
                                </label>
                                <div className="relative">
                                  <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                                  <Input
                                    placeholder="e.g. Firm or practice"
                                    value={assigned.companyName}
                                    onChange={(e) =>
                                      handleUpdateStakeholder(
                                        role.id,
                                        'companyName',
                                        e.target.value,
                                      )
                                    }
                                    className="pl-8 text-xs bg-slate-50/60 hover:bg-white focus:bg-white border-slate-200 rounded-lg shadow-2xs"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[11px] font-medium text-slate-600">
                                  Phone Number
                                </label>
                                <div className="relative">
                                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                                  <Input
                                    placeholder="+44 20 ..."
                                    value={assigned.phone}
                                    onChange={(e) =>
                                      handleUpdateStakeholder(
                                        role.id,
                                        'phone',
                                        e.target.value,
                                      )
                                    }
                                    className="pl-8 text-xs bg-slate-50/60 hover:bg-white focus:bg-white border-slate-200 rounded-lg shadow-2xs"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};
