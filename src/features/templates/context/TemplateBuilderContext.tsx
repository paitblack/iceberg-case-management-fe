import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import type {
  DependencyJoinType,
  CaseType,
  TemplatePresetSummary,
  TemplatePresetSchema,
} from '../../../types/api';
import {
  saveCaseTypeDraft,
  publishCaseTypeDraft,
  listCaseTypes,
  createCaseType,
  getCaseType,
  getCaseTypeDraft,
  listTemplatePresets,
  getTemplatePreset,
  ApiError,
} from '../../../lib/api-client';

export type CompletionRuleOption =
  'all-required-work-items' | 'any-required-work-item' | 'manual';

export interface TemplateRole {
  id: string;
  name: string;
  description?: string;
}

export const STANDARD_TEMPLATE_ROLES: TemplateRole[] = [
  {
    id: 'role-estate-agent',
    name: 'Estate Agent / Progressor',
    description: 'Listing Agent & Sales Progression Representative',
  },
  {
    id: 'role-vendor-solicitor',
    name: "Seller's Conveyancer / Solicitor",
    description: "Seller's Legal Conveyancing Representative",
  },
  {
    id: 'role-buyer-solicitor',
    name: "Buyer's Conveyancer / Solicitor",
    description: "Buyer's Legal Conveyancing Representative",
  },
  {
    id: 'role-vendor',
    name: 'Seller / Vendor',
    description: 'Property Owner / Seller Party',
  },
  {
    id: 'role-buyer',
    name: 'Buyer / Purchaser',
    description: 'Purchasing Client Party',
  },
  {
    id: 'role-mortgage-broker',
    name: 'Mortgage Broker / Advisor',
    description: 'Lender Mortgage Financial Advisor',
  },
  {
    id: 'role-surveyor',
    name: 'RICS Surveyor / Valuer',
    description: 'Chartered Building Surveyor / Valuer',
  },
];

export interface BuilderWorkItem {
  id: string;
  name: string;
  description?: string;
  condition?: string;
  ownerRoleId?: string;
  requiredRole?: string;
  requirement: 'required' | 'optional' | 'conditional';
  evidenceRequired?: boolean;
  isKeyDate?: boolean;
}

export interface BuilderStep {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  completionRule: {
    type: CompletionRuleOption;
  };
  dependencyJoinType: DependencyJoinType;
  dependencies: string[]; // predecessor step IDs
  isOptional?: boolean;
  isStandalone?: boolean;
  workItems: BuilderWorkItem[];
}

export interface DependencyEdge {
  fromStepId: string;
  toStepId: string;
}

export interface BackendDraftPayload {
  steps: {
    id: string;
    name: string;
    description?: string;
    displayOrder: number;
    completionRule: { type: string };
    dependencyJoinType: DependencyJoinType;
    isOptional?: boolean;
    isStandalone?: boolean;
    workItems: {
      id: string;
      name: string;
      description?: string;
      condition?: string;
      ownerRoleId?: string;
      requiredRole?: string;
      requirement?: string;
      evidenceRequired?: boolean;
      isKeyDate?: boolean;
    }[];
  }[];
  edges: DependencyEdge[];
  roles?: TemplateRole[];
  reopenAllowedRoleIds?: string[];
}

interface TemplateBuilderState {
  caseTypeId: string;
  name: string;
  description: string;
  category: string;
  versionNumber: number;
  isPublished: boolean;
  steps: BuilderStep[];
  roles: TemplateRole[];
  reopenAllowedRoleIds: string[];
  backendDagError: string | null;
  isSaving: boolean;
  isPublishing: boolean;
  lastSavedAt: Date | null;
  availableCaseTypes: CaseType[];
  isLoadingCaseTypes: boolean;
  availablePresets: TemplatePresetSummary[];
  isLoadingPresets: boolean;
}

interface TemplateBuilderContextValue extends TemplateBuilderState {
  setCaseTypeMeta: (
    name: string,
    description: string,
    category?: string,
  ) => void;
  selectCaseType: (id: string) => Promise<void>;
  createNewTemplate: (
    name: string,
    description?: string,
    presetKey?: string,
  ) => Promise<string>;
  addStep: (initialData?: Partial<BuilderStep>) => void;
  updateStep: (stepId: string, updates: Partial<BuilderStep>) => void;
  removeStep: (stepId: string) => void;
  moveStep: (stepId: string, direction: 'up' | 'down') => void;
  addWorkItem: (stepId: string, initialData?: Partial<BuilderWorkItem>) => void;
  updateWorkItem: (
    stepId: string,
    workItemId: string,
    updates: Partial<BuilderWorkItem>,
  ) => void;
  removeWorkItem: (stepId: string, workItemId: string) => void;
  setStepDependencies: (stepId: string, predecessorStepIds: string[]) => void;
  setStepDependencyJoinType: (
    stepId: string,
    joinType: DependencyJoinType,
  ) => void;
  addRole: (role: { name: string; description?: string }) => TemplateRole;
  updateRole: (roleId: string, updates: Partial<TemplateRole>) => void;
  removeRole: (roleId: string) => void;
  setReopenAllowedRoleIds: (roleIds: string[]) => void;
  toggleReopenAllowedRoleId: (roleId: string) => void;
  loadPreset: (presetKey: string) => Promise<void>;
  toBackendDraftPayload: () => BackendDraftPayload;
  saveDraft: () => Promise<BackendDraftPayload>;
  publishDraft: () => Promise<void>;
  edges: DependencyEdge[];
  refreshCaseTypes: () => Promise<CaseType[]>;
}

const TemplateBuilderContext =
  createContext<TemplateBuilderContextValue | null>(null);

export const DEFAULT_SALES_STEPS: BuilderStep[] = [
  {
    id: 'step-sales-1',
    name: 'Offer Accepted & Onboarding',
    description:
      'Record agreed purchase price, buyer qualification, and vendor onboarding.',
    displayOrder: 1,
    completionRule: { type: 'all-required-work-items' },
    dependencyJoinType: 'ALL',
    dependencies: [],
    workItems: [
      {
        id: 'wi-sales-1',
        name: 'Verify Buyer & Vendor ID / AML Checks',
        ownerRoleId: 'role-estate-agent',
        requiredRole: 'role-estate-agent',
        requirement: 'required',
      },
      {
        id: 'wi-sales-2',
        name: 'Verify Proof of Funds & Deposit',
        ownerRoleId: 'role-estate-agent',
        requiredRole: 'role-estate-agent',
        requirement: 'required',
      },
      {
        id: 'wi-sales-3',
        name: 'Generate & Distribute Memorandum of Sale',
        ownerRoleId: 'role-estate-agent',
        requiredRole: 'role-estate-agent',
        requirement: 'required',
      },
    ],
  },
  {
    id: 'step-sales-2',
    name: 'Conveyancer Instruction & Legal Pack',
    description:
      'Confirm both legal parties instructed and TA6/TA10 protocol forms issued.',
    displayOrder: 2,
    completionRule: { type: 'all-required-work-items' },
    dependencyJoinType: 'ALL',
    dependencies: ['step-sales-1'],
    workItems: [
      {
        id: 'wi-sales-4',
        name: 'Confirm Both Solicitors Instructed',
        ownerRoleId: 'role-estate-agent',
        requiredRole: 'role-estate-agent',
        requirement: 'required',
      },
      {
        id: 'wi-sales-5',
        name: 'Complete TA6 Property Info & TA10 Fittings Forms',
        ownerRoleId: 'role-vendor-solicitor',
        requiredRole: 'role-vendor-solicitor',
        requirement: 'required',
      },
    ],
  },
  {
    id: 'step-sales-3',
    name: 'Mortgage & Valuation / Survey',
    description:
      'Submit mortgage application, complete physical valuation, and review survey.',
    displayOrder: 3,
    completionRule: { type: 'all-required-work-items' },
    dependencyJoinType: 'ALL',
    dependencies: ['step-sales-2'],
    workItems: [
      {
        id: 'wi-sales-6',
        name: 'Book & Complete Lender Valuation',
        ownerRoleId: 'role-mortgage-broker',
        requiredRole: 'role-mortgage-broker',
        requirement: 'required',
        isKeyDate: true,
      },
      {
        id: 'wi-sales-7',
        name: 'Receive Formal Written Mortgage Offer',
        ownerRoleId: 'role-mortgage-broker',
        requiredRole: 'role-mortgage-broker',
        requirement: 'required',
      },
    ],
  },
  {
    id: 'step-sales-4',
    name: 'Property Searches & Enquiries',
    description:
      'Local authority, environmental, and drainage searches submitted and satisfied.',
    displayOrder: 4,
    completionRule: { type: 'all-required-work-items' },
    dependencyJoinType: 'ALL',
    dependencies: ['step-sales-3'],
    workItems: [
      {
        id: 'wi-sales-8',
        name: 'Order Local Authority, Drainage & Environmental Searches',
        ownerRoleId: 'role-buyer-solicitor',
        requiredRole: 'role-buyer-solicitor',
        requirement: 'required',
        isKeyDate: true,
      },
      {
        id: 'wi-sales-9',
        name: 'Satisfy All Enquiries & Approve Final Contract',
        ownerRoleId: 'role-vendor-solicitor',
        requiredRole: 'role-vendor-solicitor',
        requirement: 'required',
      },
    ],
  },
  {
    id: 'step-sales-5',
    name: 'Exchange of Contracts',
    description:
      'Transfer 10% deposit funds, sign TR1 deed, and fix completion date.',
    displayOrder: 5,
    completionRule: { type: 'all-required-work-items' },
    dependencyJoinType: 'ALL',
    dependencies: ['step-sales-4'],
    workItems: [
      {
        id: 'wi-sales-10',
        name: 'Transfer 10% Exchange Deposit Funds',
        ownerRoleId: 'role-buyer-solicitor',
        requiredRole: 'role-buyer-solicitor',
        requirement: 'required',
        isKeyDate: true,
      },
      {
        id: 'wi-sales-11',
        name: 'Formal Exchange of Contracts & Fix Completion Date',
        ownerRoleId: 'role-vendor-solicitor',
        requiredRole: 'role-vendor-solicitor',
        requirement: 'required',
      },
    ],
  },
  {
    id: 'step-sales-6',
    name: 'Completion & Key Handover',
    description: 'Transfer completion balance funds and release property keys.',
    displayOrder: 6,
    completionRule: { type: 'all-required-work-items' },
    dependencyJoinType: 'ALL',
    dependencies: ['step-sales-5'],
    workItems: [
      {
        id: 'wi-sales-12',
        name: 'Transfer Mortgage & Completion Balance Funds',
        ownerRoleId: 'role-buyer-solicitor',
        requiredRole: 'role-buyer-solicitor',
        requirement: 'required',
        isKeyDate: true,
      },
      {
        id: 'wi-sales-13',
        name: 'Confirm Legal Completion & Release Property Keys',
        ownerRoleId: 'role-estate-agent',
        requiredRole: 'role-estate-agent',
        requirement: 'required',
      },
    ],
  },
];

export function formatDagError(
  rawError: string,
  currentSteps: BuilderStep[],
): string {
  // 1. Circular dependency detected
  if (rawError.includes('Circular dependency detected in step flow:')) {
    const parts = rawError
      .split('Circular dependency detected in step flow:')[1]
      ?.trim();
    if (parts) {
      const stepIds = parts.split('->').map((s) => s.trim());
      const resolvedNames = stepIds.map((id) => {
        const found = currentSteps.find((s) => s.id === id);
        return found ? `Step ${found.displayOrder} (${found.name})` : id;
      });
      return `Circular dependency loop detected: ${resolvedNames.join(' → ')}. Please remove the cyclic prerequisite dependency to ensure an acyclic progression flow.`;
    }
  }

  // 2. WorkItem references undefined ownerRoleId
  if (rawError.includes('references undefined ownerRoleId')) {
    const match =
      /WorkItem '([^']+)'(?: \(([^)]+)\))? references undefined ownerRoleId '([^']+)'/i.exec(
        rawError,
      );
    if (match) {
      const itemName = match[1];
      const roleId = match[3];
      return `Work Item "${itemName}" has an invalid role ("${roleId}"). Please select a valid role from the list.`;
    }
    const stepMatch =
      /Step '([^']+)'(?: \(([^)]+)\))? references undefined ownerRoleId '([^']+)'/i.exec(
        rawError,
      );
    if (stepMatch) {
      const stepName = stepMatch[1];
      const roleId = stepMatch[3];
      return `Milestone Step "${stepName}" has an invalid role ("${roleId}"). Please select a valid role from the list.`;
    }
  }

  // 3. Orphan work item
  if (rawError.includes('Orphan work item')) {
    return 'Task belongs to a milestone step that does not exist in the template.';
  }

  return rawError;
}

function mapSchemaToSteps(
  schema: {
    steps?: Array<{
      id: string;
      name: string;
      description?: string;
      displayOrder: number;
      completionRule?: { type: string };
      dependencyJoinType?: DependencyJoinType;
      isOptional?: boolean;
      isStandalone?: boolean;
    }>;
    workItems?: Array<{
      id: string;
      stepId: string;
      name: string;
      description?: string;
      requirement: 'required' | 'optional' | 'conditional';
      condition?: string | null;
      evidenceRequired?: boolean;
      ownerRoleId?: string | null;
    }>;
    edges?: Array<{ fromStepId: string; toStepId: string }>;
  },
  validRoles?: TemplateRole[],
): BuilderStep[] {
  const roleIdSet = new Set(validRoles?.map((r) => r.id) || []);
  return (schema.steps || [])
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((s) => {
      const preds = (schema.edges || [])
        .filter((e) => e.toStepId === s.id)
        .map((e) => e.fromStepId);

      const stepWorkItems: BuilderWorkItem[] = (schema.workItems || [])
        .filter((wi) => wi.stepId === s.id)
        .map((wi) => {
          const rawRole = wi.ownerRoleId || undefined;
          const safeRole =
            rawRole && (roleIdSet.size === 0 || roleIdSet.has(rawRole))
              ? rawRole
              : validRoles && validRoles.length > 0
                ? validRoles[0].id
                : undefined;

          return {
            id: wi.id,
            name: wi.name,
            description: wi.description || '',
            condition: wi.condition || '',
            ownerRoleId: safeRole,
            requiredRole: safeRole,
            requirement: wi.requirement,
            evidenceRequired: wi.evidenceRequired || false,
          };
        });

      return {
        id: s.id,
        name: s.name,
        description: s.description || '',
        displayOrder: s.displayOrder,
        completionRule: {
          type:
            (s.completionRule?.type as CompletionRuleOption) ||
            'all-required-work-items',
        },
        dependencyJoinType: s.dependencyJoinType || 'ALL',
        dependencies: s.isStandalone ? [] : preds,
        isOptional: s.isOptional ?? false,
        isStandalone: s.isStandalone ?? false,
        workItems: stepWorkItems,
      };
    });
}

export const TemplateBuilderProvider: React.FC<{
  children: React.ReactNode;
  initialCaseTypeId?: string;
}> = ({ children, initialCaseTypeId }) => {
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [availableCaseTypes, setAvailableCaseTypes] = useState<CaseType[]>([]);
  const [isLoadingCaseTypes, setIsLoadingCaseTypes] = useState<boolean>(true);

  const [availablePresets, setAvailablePresets] = useState<
    TemplatePresetSummary[]
  >([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState<boolean>(true);

  const [caseTypeId, setCaseTypeId] = useState<string>(initialCaseTypeId || '');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Custom');
  const [versionNumber, setVersionNumber] = useState<number>(1);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [steps, setSteps] = useState<BuilderStep[]>([]);
  const [roles, setRoles] = useState<TemplateRole[]>([]);
  const [reopenAllowedRoleIds, setReopenAllowedRoleIds] = useState<string[]>(
    [],
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [backendDagError, setBackendDagError] = useState<string | null>(null);
  const isInitialLoadDoneRef = useRef<boolean>(false);
  const skipNextAutoSaveRef = useRef<boolean>(true);

  const toggleReopenAllowedRoleId = useCallback((roleId: string) => {
    setReopenAllowedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  }, []);

  const selectCaseType = useCallback(async (selectedId: string) => {
    if (!selectedId) return;
    isInitialLoadDoneRef.current = false;
    skipNextAutoSaveRef.current = true;
    setCaseTypeId(selectedId);
    setBackendDagError(null);
    try {
      const [ct, draft] = await Promise.all([
        getCaseType(selectedId).catch((e) => {
          console.warn('Failed to getCaseType:', e);
          return null;
        }),
        getCaseTypeDraft(selectedId).catch((e) => {
          console.warn('Failed to getCaseTypeDraft:', e);
          return null;
        }),
      ]);

      if (!isMountedRef.current) return;

      if (ct) {
        setName(ct.name);
        setDescription(ct.description || '');
        setVersionNumber(ct.publishedVersionCount || 1);
        setIsPublished(ct.publishedVersionCount > 0);
      } else if (draft?.name) {
        setName(draft.name);
        if (draft.description) setDescription(draft.description);
      }

      if (draft) {
        const loadedRoles: TemplateRole[] = (draft.roles || []).map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description || '',
        }));

        setRoles(loadedRoles);
        setReopenAllowedRoleIds(draft.reopenAllowedRoleIds || []);

        if (draft.steps && draft.steps.length > 0) {
          const mappedSteps = mapSchemaToSteps(draft, loadedRoles);
          setSteps(mappedSteps);
        } else {
          setSteps([]);
        }
      } else if (ct) {
        setRoles([]);
        setSteps([]);
        setReopenAllowedRoleIds([]);
      }
      isInitialLoadDoneRef.current = true;
    } catch (err) {
      console.warn('Failed to load case type draft:', err);
    }
  }, []);

  const refreshCaseTypes = useCallback(async (): Promise<CaseType[]> => {
    if (!isMountedRef.current) return [];
    setIsLoadingCaseTypes(true);
    try {
      const types = await listCaseTypes();
      if (!isMountedRef.current) return [];
      const safeTypes = types || [];
      setAvailableCaseTypes(safeTypes);
      return safeTypes;
    } catch {
      if (isMountedRef.current) {
        setAvailableCaseTypes([]);
      }
      return [];
    } finally {
      if (isMountedRef.current) {
        setIsLoadingCaseTypes(false);
      }
    }
  }, []);

  const refreshPresets = useCallback(async (): Promise<
    TemplatePresetSummary[]
  > => {
    if (!isMountedRef.current) return [];
    setIsLoadingPresets(true);
    try {
      const presets = await listTemplatePresets();
      if (!isMountedRef.current) return [];
      const safePresets = presets || [];
      setAvailablePresets(safePresets);
      return safePresets;
    } catch {
      if (isMountedRef.current) {
        setAvailablePresets([]);
      }
      return [];
    } finally {
      if (isMountedRef.current) {
        setIsLoadingPresets(false);
      }
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const types = await refreshCaseTypes();
      void refreshPresets();
      if (types && types.length > 0) {
        const targetId =
          initialCaseTypeId && types.some((t) => t.id === initialCaseTypeId)
            ? initialCaseTypeId
            : types[0].id;
        await selectCaseType(targetId);
      }
    };
    void init();
  }, [refreshCaseTypes, refreshPresets, selectCaseType, initialCaseTypeId]);

  const addRole = useCallback(
    (roleData: { name: string; description?: string }): TemplateRole => {
      const slug = roleData.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const newRole: TemplateRole = {
        id: `role-${slug || 'custom'}-${Date.now().toString(36)}`,
        name: roleData.name.trim(),
        description: roleData.description?.trim() || roleData.name.trim(),
      };
      setRoles((prev) => [...prev, newRole]);
      return newRole;
    },
    [],
  );

  const updateRole = useCallback(
    (roleId: string, updates: Partial<TemplateRole>) => {
      setRoles((prev) =>
        prev.map((r) => (r.id === roleId ? { ...r, ...updates } : r)),
      );
    },
    [],
  );

  const removeRole = useCallback((roleId: string) => {
    setReopenAllowedRoleIds((prev) => prev.filter((id) => id !== roleId));
    setRoles((prev) => {
      const nextRoles = prev.filter((r) => r.id !== roleId);
      const fallbackId = nextRoles[0]?.id || undefined;
      setSteps((prevSteps) =>
        prevSteps.map((step) => ({
          ...step,
          workItems: step.workItems.map((wi) =>
            wi.ownerRoleId === roleId || wi.requiredRole === roleId
              ? {
                  ...wi,
                  ownerRoleId: fallbackId,
                  requiredRole: fallbackId,
                }
              : wi,
          ),
        })),
      );
      return nextRoles;
    });
  }, []);

  const loadPreset = useCallback(async (presetKey: string) => {
    try {
      const schema: TemplatePresetSchema = await getTemplatePreset(presetKey);
      if (!isMountedRef.current) return;

      setName(schema.name);
      setDescription(schema.description || '');
      setCategory(schema.category || 'Sales Progression');

      const loadedRoles =
        schema.roles && schema.roles.length > 0
          ? schema.roles.map((r) => ({
              id: r.id,
              name: r.name,
              description: r.description || '',
            }))
          : STANDARD_TEMPLATE_ROLES;

      setRoles(loadedRoles);
      setReopenAllowedRoleIds(schema.reopenAllowedRoleIds || []);
      const mappedSteps = mapSchemaToSteps(schema, loadedRoles);
      setSteps(mappedSteps);
    } catch (err) {
      console.warn(`Failed to load preset '${presetKey}':`, err);
    }
  }, []);

  const createNewTemplate = useCallback(
    async (
      newName: string,
      newDesc?: string,
      presetKey?: string,
    ): Promise<string> => {
      setIsSaving(true);
      try {
        const created = await createCaseType({
          name: newName.trim(),
          description: newDesc?.trim() || undefined,
        });

        const newId = created.id;
        setCaseTypeId(newId);
        setName(created.name);
        setDescription(created.description || '');
        setVersionNumber(1);
        setIsPublished(false);

        let initialRoles: TemplateRole[] = STANDARD_TEMPLATE_ROLES;
        let initialSteps: BuilderStep[] = [
          {
            id: `step-${Date.now()}-1`,
            name: 'Initial Milestone Step',
            description: '',
            displayOrder: 1,
            completionRule: { type: 'all-required-work-items' },
            dependencyJoinType: 'ALL',
            dependencies: [],
            workItems: [
              {
                id: `wi-${Date.now()}-1`,
                name: 'Initial required check',
                ownerRoleId: initialRoles[0]?.id || undefined,
                requiredRole: initialRoles[0]?.id || undefined,
                requirement: 'required',
              },
            ],
          },
        ];
        let initialCategory = 'Custom Workflow';

        if (presetKey) {
          try {
            const schema = await getTemplatePreset(presetKey);
            if (schema) {
              initialCategory = schema.category;
              if (schema.roles && schema.roles.length > 0) {
                initialRoles = schema.roles.map((r) => ({
                  id: r.id,
                  name: r.name,
                  description: r.description || '',
                }));
              }
              initialSteps = mapSchemaToSteps(schema, initialRoles);
            }
          } catch {
            // fallback to default
          }
        }

        setRoles(initialRoles);
        setSteps(initialSteps);
        setCategory(initialCategory);

        // Save initial draft immediately to the new CaseType
        const validRoleIds = new Set(initialRoles.map((r) => r.id));
        const dto = {
          steps: initialSteps.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description || s.name,
            displayOrder: s.displayOrder,
            completionRule: s.completionRule,
            dependencyJoinType: s.dependencyJoinType,
            isOptional: s.isOptional ?? false,
            isStandalone: s.isStandalone ?? false,
          })),
          workItems: initialSteps.flatMap((s) =>
            s.workItems.map((wi) => {
              const safeRole =
                wi.ownerRoleId && validRoleIds.has(wi.ownerRoleId)
                  ? wi.ownerRoleId
                  : initialRoles[0]?.id || undefined;

              return {
                id: wi.id,
                stepId: s.id,
                name: wi.name,
                description: wi.description?.trim() || undefined,
                requirement: wi.requirement,
                condition: wi.condition?.trim() || undefined,
                ownerRoleId: safeRole,
                evidenceRequired: wi.evidenceRequired || false,
              };
            }),
          ),
          edges: [],
          roles: initialRoles.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description || r.name,
          })),
          customFields: [],
        };

        try {
          await saveCaseTypeDraft(newId, dto);
        } catch {
          // Local fallback
        }

        await refreshCaseTypes();
        await selectCaseType(newId);
        return newId;
      } finally {
        setIsSaving(false);
      }
    },
    [refreshCaseTypes, selectCaseType],
  );

  // Compute edges automatically from step dependencies
  const edges = useMemo<DependencyEdge[]>(() => {
    const computed: DependencyEdge[] = [];
    for (const step of steps) {
      for (const depId of step.dependencies) {
        if (steps.some((s) => s.id === depId)) {
          computed.push({ fromStepId: depId, toStepId: step.id });
        }
      }
    }
    return computed;
  }, [steps]);

  const setCaseTypeMeta = useCallback(
    (newName: string, newDescription: string, newCategory?: string) => {
      setName(newName);
      setDescription(newDescription);
      if (newCategory) setCategory(newCategory);
    },
    [],
  );

  const addStep = useCallback(
    (initialData?: Partial<BuilderStep>) => {
      setSteps((prev) => {
        const nextOrder = prev.length + 1;
        const defaultRoleId = roles[0]?.id || undefined;
        const isStandalone = initialData?.isStandalone ?? false;
        const newStep: BuilderStep = {
          id: `ui-step-${Date.now()}`,
          name: initialData?.name || `Step ${nextOrder}: New Milestone`,
          description: initialData?.description || '',
          displayOrder: nextOrder,
          completionRule: initialData?.completionRule || {
            type: 'all-required-work-items',
          },
          dependencyJoinType: initialData?.dependencyJoinType || 'ALL',
          dependencies: isStandalone ? [] : initialData?.dependencies || [],
          isOptional: initialData?.isOptional ?? false,
          isStandalone: isStandalone,
          workItems: initialData?.workItems || [
            {
              id: `ui-wi-${Date.now()}-1`,
              name: 'Initial action item',
              ownerRoleId: defaultRoleId,
              requiredRole: defaultRoleId,
              requirement: 'required',
            },
          ],
        };
        return [...prev, newStep];
      });
    },
    [roles],
  );

  const updateStep = useCallback(
    (stepId: string, updates: Partial<BuilderStep>) => {
      setSteps((prev) => {
        return prev.map((step) => {
          if (step.id === stepId) {
            const nextIsStandalone =
              updates.isStandalone !== undefined
                ? updates.isStandalone
                : step.isStandalone;
            return {
              ...step,
              ...updates,
              dependencies: nextIsStandalone
                ? []
                : (updates.dependencies ?? step.dependencies),
            };
          }
          if (updates.isStandalone === true) {
            return {
              ...step,
              dependencies: step.dependencies.filter((dep) => dep !== stepId),
            };
          }
          return step;
        });
      });
    },
    [],
  );

  const removeStep = useCallback((stepId: string) => {
    setSteps((prev) => {
      const filtered = prev.filter((s) => s.id !== stepId);
      return filtered.map((step, idx) => ({
        ...step,
        displayOrder: idx + 1,
        dependencies: step.dependencies.filter((dep) => dep !== stepId),
      }));
    });
  }, []);

  const moveStep = useCallback((stepId: string, direction: 'up' | 'down') => {
    setSteps((prev) => {
      const index = prev.findIndex((s) => s.id === stepId);
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === prev.length - 1) return prev;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const newSteps = [...prev];
      const [moved] = newSteps.splice(index, 1);
      newSteps.splice(targetIndex, 0, moved);

      return newSteps.map((step, idx) => ({
        ...step,
        displayOrder: idx + 1,
      }));
    });
  }, []);

  const addWorkItem = useCallback(
    (stepId: string, initialData?: Partial<BuilderWorkItem>) => {
      setSteps((prev) =>
        prev.map((step) => {
          if (step.id !== stepId) return step;
          const defaultRoleId = roles[0]?.id || undefined;
          const newWorkItem: BuilderWorkItem = {
            id: `ui-wi-${Date.now()}`,
            name: initialData?.name || 'New required action',
            description: initialData?.description || '',
            condition: initialData?.condition || '',
            ownerRoleId:
              initialData?.ownerRoleId ||
              initialData?.requiredRole ||
              defaultRoleId,
            requiredRole:
              initialData?.ownerRoleId ||
              initialData?.requiredRole ||
              defaultRoleId,
            requirement: initialData?.requirement || 'required',
            evidenceRequired: initialData?.evidenceRequired || false,
            isKeyDate: initialData?.isKeyDate || false,
          };
          return {
            ...step,
            workItems: [...step.workItems, newWorkItem],
          };
        }),
      );
    },
    [roles],
  );

  const updateWorkItem = useCallback(
    (stepId: string, workItemId: string, updates: Partial<BuilderWorkItem>) => {
      setSteps((prev) =>
        prev.map((step) => {
          if (step.id !== stepId) return step;
          return {
            ...step,
            workItems: step.workItems.map((wi) =>
              wi.id === workItemId ? { ...wi, ...updates } : wi,
            ),
          };
        }),
      );
    },
    [],
  );

  const removeWorkItem = useCallback((stepId: string, workItemId: string) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id !== stepId) return step;
        return {
          ...step,
          workItems: step.workItems.filter((wi) => wi.id !== workItemId),
        };
      }),
    );
  }, []);

  const checkBackendDraft = useCallback(
    async (nextSteps: BuilderStep[], nextEdges: DependencyEdge[]) => {
      const activeId = caseTypeId;
      if (!activeId) return;

      const validRoleIds = new Set(roles.map((r) => r.id));
      const getValidRoleId = (roleId?: string): string | undefined => {
        if (roleId && validRoleIds.has(roleId)) {
          return roleId;
        }
        return roles[0]?.id || undefined;
      };

      const dto = {
        steps: nextSteps.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description || s.name,
          displayOrder: s.displayOrder,
          dependencyJoinType: s.dependencyJoinType,
          isOptional: s.isOptional ?? false,
          isStandalone: s.isStandalone ?? false,
        })),
        workItems: nextSteps.flatMap((s) =>
          s.workItems.map((wi) => ({
            id: wi.id,
            stepId: s.id,
            name: wi.name,
            description: wi.description?.trim() || undefined,
            requirement: wi.requirement,
            condition:
              wi.requirement === 'conditional'
                ? wi.condition?.trim() || 'Conditional requirement'
                : undefined,
            evidenceRequired: wi.evidenceRequired || false,
            ownerRoleId: getValidRoleId(wi.ownerRoleId || wi.requiredRole),
          })),
        ),
        edges: nextEdges.map((e) => ({
          fromStepId: e.fromStepId,
          toStepId: e.toStepId,
        })),
        roles: roles.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description || r.name,
        })),
        customFields: [],
        reopenAllowedRoleIds: reopenAllowedRoleIds.filter((id) =>
          validRoleIds.has(id),
        ),
      };

      try {
        await saveCaseTypeDraft(activeId, dto);
        if (!isMountedRef.current) return;
        setBackendDagError(null);
        setLastSavedAt(new Date());
      } catch (err: unknown) {
        if (!isMountedRef.current) return;
        if (err instanceof ApiError) {
          if (err.problem.status === 404) {
            const types = await listCaseTypes();
            if (!isMountedRef.current) return;
            if (types && types.length > 0) {
              setAvailableCaseTypes(types);
              const freshId = types[0].id;
              setCaseTypeId(freshId);
              try {
                await saveCaseTypeDraft(freshId, dto);
                if (!isMountedRef.current) return;
                setBackendDagError(null);
                setLastSavedAt(new Date());
                return;
              } catch (retryErr) {
                if (!isMountedRef.current) return;
                if (retryErr instanceof ApiError) {
                  setBackendDagError(
                    formatDagError(
                      retryErr.problem.detail || retryErr.message,
                      nextSteps,
                    ),
                  );
                  return;
                }
              }
            }
          }
          if (isMountedRef.current) {
            setBackendDagError(
              formatDagError(err.problem.detail || err.message, nextSteps),
            );
          }
        } else if (err instanceof Error) {
          if (isMountedRef.current) {
            setBackendDagError(formatDagError(err.message, nextSteps));
          }
        }
      }
    },
    [caseTypeId, availableCaseTypes, roles, reopenAllowedRoleIds],
  );

  const setStepDependencies = useCallback(
    (stepId: string, predecessorStepIds: string[]) => {
      setSteps((prev) => {
        const nextSteps = prev.map((step) =>
          step.id === stepId
            ? { ...step, dependencies: predecessorStepIds }
            : step,
        );

        // Compute updated edges for backend DAG validation
        const nextEdges: DependencyEdge[] = [];
        for (const s of nextSteps) {
          for (const depId of s.dependencies) {
            if (nextSteps.some((step) => step.id === depId)) {
              nextEdges.push({ fromStepId: depId, toStepId: s.id });
            }
          }
        }

        // Trigger backend DAG validator immediately on edge toggle!
        void checkBackendDraft(nextSteps, nextEdges);

        return nextSteps;
      });
    },
    [checkBackendDraft],
  );

  const setStepDependencyJoinType = useCallback(
    (stepId: string, joinType: DependencyJoinType) => {
      setSteps((prev) =>
        prev.map((step) =>
          step.id === stepId ? { ...step, dependencyJoinType: joinType } : step,
        ),
      );
    },
    [],
  );

  const toBackendDraftPayload = useCallback((): BackendDraftPayload => {
    const validRoleIds = new Set(roles.map((r) => r.id));
    const getValidRoleId = (roleId?: string): string | undefined => {
      if (roleId && validRoleIds.has(roleId)) {
        return roleId;
      }
      return roles[0]?.id || undefined;
    };

    return {
      steps: steps.map((step) => ({
        id: step.id,
        name: step.name,
        description: step.description,
        displayOrder: step.displayOrder,
        completionRule: { type: step.completionRule.type },
        dependencyJoinType: step.dependencyJoinType,
        isOptional: step.isOptional ?? false,
        isStandalone: step.isStandalone ?? false,
        workItems: step.workItems.map((wi) => {
          const safeRole = getValidRoleId(wi.ownerRoleId || wi.requiredRole);
          return {
            id: wi.id,
            name: wi.name,
            description: wi.description || undefined,
            condition:
              wi.requirement === 'conditional' ? wi.condition : undefined,
            ownerRoleId: safeRole,
            requiredRole: safeRole,
            requirement: wi.requirement,
            evidenceRequired: wi.evidenceRequired || false,
            isKeyDate: wi.isKeyDate,
          };
        }),
      })),
      edges: edges,
      roles: roles,
      reopenAllowedRoleIds: reopenAllowedRoleIds.filter((id) =>
        validRoleIds.has(id),
      ),
    };
  }, [steps, edges, roles, reopenAllowedRoleIds]);

  const saveDraft = useCallback(async (): Promise<BackendDraftPayload> => {
    setIsSaving(true);
    try {
      const activeCaseTypeId = caseTypeId;

      // Validate that all conditional work items specify a condition rule
      for (const s of steps) {
        for (const wi of s.workItems) {
          if (wi.requirement === 'conditional' && !wi.condition?.trim()) {
            const err = new Error(
              `Task "${wi.name || 'Untitled'}" in milestone "${s.name}" is set to Conditional, but no condition rule was specified. Please provide a condition rule before saving.`,
            );
            setBackendDagError(err.message);
            throw err;
          }
        }
      }

      const validRoleIds = new Set(roles.map((r) => r.id));
      const getValidRoleId = (roleId?: string): string | undefined => {
        if (roleId && validRoleIds.has(roleId)) {
          return roleId;
        }
        return roles[0]?.id || undefined;
      };

      const dto = {
        steps: steps.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description || s.name,
          displayOrder: s.displayOrder,
          dependencyJoinType: s.dependencyJoinType,
          isOptional: s.isOptional ?? false,
          isStandalone: s.isStandalone ?? false,
        })),
        workItems: steps.flatMap((s) =>
          s.workItems.map((wi) => ({
            id: wi.id,
            stepId: s.id,
            name: wi.name,
            description: wi.description?.trim() || undefined,
            requirement: wi.requirement,
            condition:
              wi.requirement === 'conditional'
                ? wi.condition?.trim()
                : undefined,
            evidenceRequired: wi.evidenceRequired || false,
            ownerRoleId: getValidRoleId(wi.ownerRoleId || wi.requiredRole),
          })),
        ),
        edges: edges.map((e) => ({
          fromStepId: e.fromStepId,
          toStepId: e.toStepId,
        })),
        roles: roles.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description || r.name,
        })),
        customFields: [],
        reopenAllowedRoleIds: reopenAllowedRoleIds.filter((id) =>
          validRoleIds.has(id),
        ),
      };

      try {
        await saveCaseTypeDraft(activeCaseTypeId, dto);
        setBackendDagError(null);
        setLastSavedAt(new Date());
        return toBackendDraftPayload();
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          setBackendDagError(
            formatDagError(err.problem.detail || err.message, steps),
          );
        } else if (err instanceof Error) {
          setBackendDagError(formatDagError(err.message, steps));
        }
        throw err;
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    caseTypeId,
    steps,
    edges,
    roles,
    reopenAllowedRoleIds,
    toBackendDraftPayload,
  ]);

  const publishDraft = useCallback(async (): Promise<void> => {
    setIsPublishing(true);
    try {
      await saveDraft();

      const res = await publishCaseTypeDraft(caseTypeId);
      if (res && res.versionNumber) {
        setVersionNumber(res.versionNumber);
      } else {
        setVersionNumber((prev) => prev + 1);
      }

      setIsPublished(true);
      await refreshCaseTypes();
    } finally {
      setIsPublishing(false);
    }
  }, [caseTypeId, saveDraft, refreshCaseTypes]);

  useEffect(() => {
    if (!caseTypeId || !isInitialLoadDoneRef.current) return;
    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      void saveDraft().catch(() => {});
    }, 600);

    return () => clearTimeout(timer);
  }, [caseTypeId, steps, roles, edges, reopenAllowedRoleIds, saveDraft]);

  const value = useMemo(
    () => ({
      caseTypeId,
      name,
      description,
      category,
      versionNumber,
      isPublished,
      steps,
      roles,
      reopenAllowedRoleIds,
      edges,
      backendDagError,
      isSaving,
      isPublishing,
      lastSavedAt,
      availableCaseTypes,
      isLoadingCaseTypes,
      availablePresets,
      isLoadingPresets,
      setCaseTypeMeta,
      selectCaseType,
      createNewTemplate,
      addStep,
      updateStep,
      removeStep,
      moveStep,
      addWorkItem,
      updateWorkItem,
      removeWorkItem,
      setStepDependencies,
      setStepDependencyJoinType,
      addRole,
      updateRole,
      removeRole,
      setReopenAllowedRoleIds,
      toggleReopenAllowedRoleId,
      loadPreset,
      toBackendDraftPayload,
      saveDraft,
      publishDraft,
      refreshCaseTypes,
    }),
    [
      caseTypeId,
      name,
      description,
      category,
      versionNumber,
      isPublished,
      steps,
      roles,
      reopenAllowedRoleIds,
      edges,
      backendDagError,
      isSaving,
      isPublishing,
      lastSavedAt,
      availableCaseTypes,
      isLoadingCaseTypes,
      availablePresets,
      isLoadingPresets,
      setCaseTypeMeta,
      selectCaseType,
      createNewTemplate,
      addStep,
      updateStep,
      removeStep,
      moveStep,
      addWorkItem,
      updateWorkItem,
      removeWorkItem,
      setStepDependencies,
      setStepDependencyJoinType,
      addRole,
      updateRole,
      removeRole,
      setReopenAllowedRoleIds,
      toggleReopenAllowedRoleId,
      loadPreset,
      toBackendDraftPayload,
      saveDraft,
      publishDraft,
      refreshCaseTypes,
    ],
  );

  return (
    <TemplateBuilderContext.Provider value={value}>
      {children}
    </TemplateBuilderContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useTemplateBuilder(): TemplateBuilderContextValue {
  const ctx = useContext(TemplateBuilderContext);
  if (!ctx) {
    throw new Error(
      'useTemplateBuilder must be used within a TemplateBuilderProvider',
    );
  }
  return ctx;
}
