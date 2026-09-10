import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Sparkles,
  Home,
  PoundSterling,
  AlertCircle,
  Users,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Building2,
  Mail,
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

  // Pre-populate default operator (logged-in user) for internal estate agent/progressor role
  useEffect(() => {
    if (isOpen && templateRoles.length > 0) {
      setStakeholders((prev) => {
        const next = { ...prev };
        // If internal agent role exists and not set, pre-fill with current agent
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
            console.warn(`Failed to assign stakeholder for role '${roleId}':`, err);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start New Case Workflow"
      maxWidth="lg"
      footer={
        <>
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
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Launch Case Workflow
          </Button>
        </>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4 text-xs text-slate-700 max-h-[72vh] overflow-y-auto pr-1"
      >
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 flex-1 min-w-0">
              <p className="font-bold">Cannot Create Case</p>
              <p className="text-[11px] leading-relaxed break-words">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* Title Input */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Case Title <span className="text-[#E1007A]">*</span>
          </label>
          <Input
            placeholder="e.g. 42 Woodstock Road Sale Progression"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            className="text-xs"
          />
          <p className="text-[10px] text-slate-400">
            A clear title identifying the property or conveyancing transaction.
          </p>
        </div>

        {/* Template Selector */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>
              Workflow Template Package{' '}
              <span className="text-[#E1007A]">*</span>
            </span>
            {isLoadingTemplates && (
              <span className="text-[10px] text-slate-400 font-normal animate-pulse">
                Fetching published versions...
              </span>
            )}
          </label>

          {templates.length === 0 && !isLoadingTemplates ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
              <p className="font-bold">No Published Templates Found</p>
              <p className="text-[11px]">
                Please publish a workflow template in the Template Studio first
                to launch new cases.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {templates.map((tpl) => {
                const isSelected = tpl.id === templateVersionId;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setTemplateVersionId(tpl.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                      isSelected
                        ? 'border-[#E1007A] bg-pink-50/50 ring-2 ring-[#E1007A]/10 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center ${
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
                      <Badge
                        variant={isSelected ? 'required' : 'default'}
                        size="xs"
                      >
                        v{tpl.versionNumber}.0
                      </Badge>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-1 pl-7">
                      {tpl.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic Stakeholder Assignment Section */}
        <div className="space-y-3 pt-2 border-t border-slate-200/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#E1007A]" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Key Case Stakeholders (Required by Template)
                </h4>
                <p className="text-[10px] text-slate-400">
                  Assign required contacts to launch the case. Single-operator
                  progressors manage updates on their behalf.
                </p>
              </div>
            </div>
            <Badge variant="required" size="xs">
              {requiredRoles.length} Required
            </Badge>
          </div>

          <div className="space-y-2.5">
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

              return (
                <div
                  key={role.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-[#E1007A]" />
                      <span className="font-bold text-slate-800 text-[11px]">
                        {role.name} <span className="text-[#E1007A]">*</span>
                      </span>
                    </div>
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
                        className="text-[10px] font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:border-[#E1007A] cursor-pointer"
                      >
                        <option value="" disabled>
                          Quick-Pick from Directory...
                        </option>
                        {matchingContacts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.companyName})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">
                        Full Name <span className="text-[#E1007A]">*</span>
                      </label>
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
                        className="text-xs bg-white"
                        required
                      />
                    </div>

                    <div className="space-y-0.5">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
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
                          className="pl-7 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">
                        Company / Firm Name (Optional)
                      </label>
                      <div className="relative">
                        <Building2 className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
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
                          className="pl-7 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">
                        Phone Number (Optional)
                      </label>
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
                        className="text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Optional Stakeholders Accordion */}
          {optionalRoles.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() =>
                  setIsOptionalStakeholdersOpen((prev) => !prev)
                }
                className="flex items-center justify-between w-full p-2 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
              >
                <span>
                  Additional Stakeholders (Optional: Broker, Surveyor) (
                  {optionalRoles.length})
                </span>
                {isOptionalStakeholdersOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {isOptionalStakeholdersOpen && (
                <div className="mt-2 space-y-2">
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

                    return (
                      <div
                        key={role.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 text-[11px]">
                            {role.name}
                          </span>
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
                              className="text-[10px] font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:border-[#E1007A] cursor-pointer"
                            >
                              <option value="" disabled>
                                Quick-Pick from Directory...
                              </option>
                              {matchingContacts.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} ({c.companyName})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Full Name"
                            value={assigned.name}
                            onChange={(e) =>
                              handleUpdateStakeholder(
                                role.id,
                                'name',
                                e.target.value,
                              )
                            }
                            className="text-xs bg-white"
                          />
                          <Input
                            placeholder="Email"
                            value={assigned.email}
                            onChange={(e) =>
                              handleUpdateStakeholder(
                                role.id,
                                'email',
                                e.target.value,
                              )
                            }
                            className="text-xs bg-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Property Address */}
        <div className="space-y-1 pt-2 border-t border-slate-200/80">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Property Address (Optional)
          </label>
          <div className="relative">
            <Home className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <Input
              placeholder="e.g. 42 Woodstock Road, Oxford"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>
        </div>

        {/* Agreed Sale Price */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Agreed Transaction Price (Optional)
          </label>
          <div className="relative">
            <PoundSterling className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <Input
              placeholder="e.g. 475000"
              value={agreedPrice}
              onChange={(e) => setAgreedPrice(e.target.value)}
              className="pl-8 text-xs font-mono"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
