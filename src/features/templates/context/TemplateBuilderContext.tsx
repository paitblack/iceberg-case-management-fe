import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import type { DependencyJoinType, CaseType } from '../../../types/api';
import {
  saveCaseTypeDraft,
  publishCaseTypeDraft,
  listCaseTypes,
  createCaseType,
  getCaseType,
  ApiError,
} from '../../../lib/api-client';

export type CompletionRuleOption =
  'all-required-work-items' | 'any-required-work-item' | 'manual';

export interface BuilderWorkItem {
  id: string;
  name: string;
  requiredRole: string;
  requirement: 'required' | 'optional' | 'conditional';
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
    workItems: {
      id: string;
      name: string;
      requiredRole: string;
      requirement?: string;
      isKeyDate?: boolean;
    }[];
  }[];
  edges: DependencyEdge[];
}

interface TemplateBuilderState {
  caseTypeId: string;
  name: string;
  description: string;
  category: string;
  versionNumber: number;
  isPublished: boolean;
  steps: BuilderStep[];
  backendDagError: string | null;
  isSaving: boolean;
  isPublishing: boolean;
  lastSavedAt: Date | null;
  availableCaseTypes: CaseType[];
  isLoadingCaseTypes: boolean;
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
    preset?: 'sales' | 'appraisal' | 'commercial',
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
  loadPreset: (presetKey: 'sales' | 'appraisal' | 'commercial') => void;
  toBackendDraftPayload: () => BackendDraftPayload;
  saveDraft: () => Promise<BackendDraftPayload>;
  publishDraft: () => Promise<void>;
  edges: DependencyEdge[];
  refreshCaseTypes: () => Promise<void>;
}

const TemplateBuilderContext =
  createContext<TemplateBuilderContextValue | null>(null);

const DEFAULT_SALES_STEPS: BuilderStep[] = [
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
        requiredRole: 'Listing Agent',
        requirement: 'required',
      },
      {
        id: 'wi-sales-2',
        name: 'Verify Proof of Funds & Deposit',
        requiredRole: 'Listing Agent',
        requirement: 'required',
      },
      {
        id: 'wi-sales-3',
        name: 'Generate & Distribute Memorandum of Sale',
        requiredRole: 'Sales Progressor',
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
        requiredRole: 'Sales Progressor',
        requirement: 'required',
      },
      {
        id: 'wi-sales-5',
        name: 'Complete TA6 Property Info & TA10 Fittings Forms',
        requiredRole: 'Vendor Solicitor',
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
        requiredRole: 'Mortgage Broker',
        requirement: 'required',
        isKeyDate: true,
      },
      {
        id: 'wi-sales-7',
        name: 'Receive Formal Written Mortgage Offer',
        requiredRole: 'Mortgage Broker',
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
        requiredRole: 'Buyer Solicitor',
        requirement: 'required',
        isKeyDate: true,
      },
      {
        id: 'wi-sales-9',
        name: 'Satisfy All Enquiries & Approve Final Contract',
        requiredRole: 'Vendor Solicitor',
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
        requiredRole: 'Buyer Solicitor',
        requirement: 'required',
        isKeyDate: true,
      },
      {
        id: 'wi-sales-11',
        name: 'Formal Exchange of Contracts & Fix Completion Date',
        requiredRole: 'Vendor Solicitor',
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
        requiredRole: 'Buyer Solicitor',
        requirement: 'required',
        isKeyDate: true,
      },
      {
        id: 'wi-sales-13',
        name: 'Confirm Legal Completion & Release Property Keys',
        requiredRole: 'Listing Agent',
        requirement: 'required',
      },
    ],
  },
];

const APPRAISAL_STEPS: BuilderStep[] = [
  {
    id: 'step-app-1',
    name: 'Lead Qualification & Property Intake',
    description: 'Confirm vendor motivation, details, and desktop research.',
    displayOrder: 1,
    completionRule: { type: 'all-required-work-items' },
    dependencyJoinType: 'ALL',
    dependencies: [],
    workItems: [
      {
        id: 'wi-app-1',
        name: 'Confirm client contact details & motivation',
        requiredRole: 'Listing Agent',
        requirement: 'required',
      },
      {
        id: 'wi-app-2',
        name: 'Retrieve Land Registry title & historical comparables',
        requiredRole: 'Listing Agent',
        requirement: 'required',
      },
    ],
  },
  {
    id: 'step-app-2',
    name: 'On-Site Valuation Inspection',
    description: 'Physical property walkthrough, measurements, and appraisal.',
    displayOrder: 2,
    completionRule: { type: 'all-required-work-items' },
    dependencyJoinType: 'ALL',
    dependencies: ['step-app-1'],
    workItems: [
      {
        id: 'wi-app-3',
        name: 'Conduct physical property inspection & measurements',
        requiredRole: 'Valuer',
        requirement: 'required',
        isKeyDate: true,
      },
      {
        id: 'wi-app-4',
        name: 'Capture marketing photos and floorplan draft',
        requiredRole: 'Valuer',
        requirement: 'optional',
      },
    ],
  },
  {
    id: 'step-app-3',
    name: 'Valuation Pack & Agency Agreement',
    description: 'Deliver formal valuation pack and sign agency terms.',
    displayOrder: 3,
    completionRule: { type: 'all-required-work-items' },
    dependencyJoinType: 'ALL',
    dependencies: ['step-app-2'],
    workItems: [
      {
        id: 'wi-app-5',
        name: 'Generate formal appraisal valuation pack',
        requiredRole: 'Listing Agent',
        requirement: 'required',
      },
      {
        id: 'wi-app-6',
        name: 'Present proposal to vendor & sign sole agency terms',
        requiredRole: 'Listing Agent',
        requirement: 'required',
      },
    ],
  },
];

const COMMERCIAL_STEPS: BuilderStep[] = [
  {
    id: 'step-comm-1',
    name: 'Commercial Heads of Terms Agreed',
    description: 'Negotiate commercial lease term, rent review, and covenants.',
    displayOrder: 1,
    completionRule: { type: 'all-required-work-items' },
    dependencyJoinType: 'ALL',
    dependencies: [],
    workItems: [
      {
        id: 'wi-comm-1',
        name: 'Confirm commercial rent, lease term, and break clauses',
        requiredRole: 'Commercial Agent',
        requirement: 'required',
      },
    ],
  },
  {
    id: 'step-comm-2',
    name: 'Tenant Due Diligence & Referencing',
    description: 'Obtain company accounts, credit checks, and guarantor deed.',
    displayOrder: 2,
    completionRule: { type: 'all-required-work-items' },
    dependencyJoinType: 'ALL',
    dependencies: ['step-comm-1'],
    workItems: [
      {
        id: 'wi-comm-2',
        name: 'Obtain 3 years audited accounts and trade references',
        requiredRole: 'Compliance Officer',
        requirement: 'required',
      },
      {
        id: 'wi-comm-3',
        name: 'Execute Director Guarantor Agreement if required',
        requiredRole: 'Compliance Officer',
        requirement: 'optional',
      },
    ],
  },
  {
    id: 'step-comm-3',
    name: 'Lease Drafting & Execution',
    description:
      'Solicitor lease engrossment, rent deposit deed, and completion.',
    displayOrder: 3,
    completionRule: { type: 'all-required-work-items' },
    dependencyJoinType: 'ALL',
    dependencies: ['step-comm-2'],
    workItems: [
      {
        id: 'wi-comm-4',
        name: 'Approve draft commercial lease and rent deposit deed',
        requiredRole: 'Vendor Solicitor',
        requirement: 'required',
      },
      {
        id: 'wi-comm-5',
        name: 'Complete commercial lease and release premises keys',
        requiredRole: 'Commercial Agent',
        requirement: 'required',
      },
    ],
  },
];

function formatDagError(rawError: string, currentSteps: BuilderStep[]): string {
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
  return rawError;
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

  const [caseTypeId, setCaseTypeId] = useState<string>(initialCaseTypeId || '');
  const [name, setName] = useState<string>('UK Residential Sales Progression');
  const [description, setDescription] = useState<string>(
    'Standard England & Wales conveyance and sales progression workflow with AML, searches, mortgage offer, and exchange.',
  );
  const [category, setCategory] = useState<string>('Sales Progression');
  const [versionNumber, setVersionNumber] = useState<number>(2);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [steps, setSteps] = useState<BuilderStep[]>(DEFAULT_SALES_STEPS);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const refreshCaseTypes = useCallback(async () => {
    if (!isMountedRef.current) return;
    setIsLoadingCaseTypes(true);
    try {
      const types = await listCaseTypes();
      if (!isMountedRef.current) return;
      if (types && types.length > 0) {
        setAvailableCaseTypes(types);
        setCaseTypeId((prevId) => {
          if (!prevId || !types.some((t) => t.id === prevId)) {
            return types[0].id;
          }
          return prevId;
        });
      }
    } catch {
      if (isMountedRef.current) {
        setAvailableCaseTypes([]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingCaseTypes(false);
      }
    }
  }, []);

  useEffect(() => {
    refreshCaseTypes();
  }, [refreshCaseTypes]);

  const selectCaseType = useCallback(
    async (selectedId: string) => {
      setCaseTypeId(selectedId);
      try {
        const ct = await getCaseType(selectedId);
        if (ct) {
          setName(ct.name);
          if (ct.description) setDescription(ct.description);
          setVersionNumber(ct.publishedVersionCount || 1);
          setIsPublished(ct.publishedVersionCount > 0);

          // Infer steps based on name or default
          if (ct.name.toLowerCase().includes('appraisal')) {
            setSteps(APPRAISAL_STEPS);
            setCategory('Valuation & Listing');
          } else if (ct.name.toLowerCase().includes('commercial')) {
            setSteps(COMMERCIAL_STEPS);
            setCategory('Commercial');
          } else {
            setSteps(DEFAULT_SALES_STEPS);
            setCategory('Sales Progression');
          }
        }
      } catch {
        const matched = availableCaseTypes.find((t) => t.id === selectedId);
        if (matched) {
          setName(matched.name);
          if (matched.description) setDescription(matched.description);
          setVersionNumber(matched.publishedVersionCount || 1);
        }
      }
    },
    [availableCaseTypes],
  );

  const createNewTemplate = useCallback(
    async (
      newName: string,
      newDesc?: string,
      preset?: 'sales' | 'appraisal' | 'commercial',
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

        let initialSteps = DEFAULT_SALES_STEPS;
        let cat = 'Sales Progression';
        if (preset === 'appraisal') {
          initialSteps = APPRAISAL_STEPS;
          cat = 'Valuation & Listing';
        } else if (preset === 'commercial') {
          initialSteps = COMMERCIAL_STEPS;
          cat = 'Commercial';
        }
        setSteps(initialSteps);
        setCategory(cat);

        // Save initial draft immediately to the new CaseType
        const dto = {
          steps: initialSteps.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description || s.name,
            displayOrder: s.displayOrder,
            dependencyJoinType: s.dependencyJoinType,
          })),
          workItems: initialSteps.flatMap((s) =>
            s.workItems.map((wi) => ({
              id: wi.id,
              stepId: s.id,
              name: wi.name,
              requirement: wi.requirement,
              evidenceRequired: false,
            })),
          ),
          edges: [],
          roles: [],
          customFields: [],
        };

        try {
          await saveCaseTypeDraft(newId, dto);
        } catch {
          // Local fallback
        }

        await refreshCaseTypes();
        return newId;
      } finally {
        setIsSaving(false);
      }
    },
    [refreshCaseTypes],
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

  const addStep = useCallback((initialData?: Partial<BuilderStep>) => {
    setSteps((prev) => {
      const nextOrder = prev.length + 1;
      const newStep: BuilderStep = {
        id: `ui-step-${Date.now()}`,
        name: initialData?.name || `Step ${nextOrder}: New Milestone`,
        description: initialData?.description || '',
        displayOrder: nextOrder,
        completionRule: initialData?.completionRule || {
          type: 'all-required-work-items',
        },
        dependencyJoinType: initialData?.dependencyJoinType || 'ALL',
        dependencies: initialData?.dependencies || [],
        workItems: initialData?.workItems || [
          {
            id: `ui-wi-${Date.now()}-1`,
            name: 'Initial action item',
            requiredRole: 'Sales Progressor',
            requirement: 'required',
          },
        ],
      };
      return [...prev, newStep];
    });
  }, []);

  const updateStep = useCallback(
    (stepId: string, updates: Partial<BuilderStep>) => {
      setSteps((prev) =>
        prev.map((step) =>
          step.id === stepId ? { ...step, ...updates } : step,
        ),
      );
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
          const newWorkItem: BuilderWorkItem = {
            id: `ui-wi-${Date.now()}`,
            name: initialData?.name || 'New required action',
            requiredRole: initialData?.requiredRole || 'Sales Progressor',
            requirement: initialData?.requirement || 'required',
            isKeyDate: initialData?.isKeyDate || false,
          };
          return {
            ...step,
            workItems: [...step.workItems, newWorkItem],
          };
        }),
      );
    },
    [],
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

  const [backendDagError, setBackendDagError] = useState<string | null>(null);

  const checkBackendDraft = useCallback(
    async (nextSteps: BuilderStep[], nextEdges: DependencyEdge[]) => {
      let activeId = caseTypeId;
      if (!activeId && availableCaseTypes.length > 0) {
        activeId = availableCaseTypes[0].id;
      }
      if (!activeId) return;

      const dto = {
        steps: nextSteps.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description || s.name,
          displayOrder: s.displayOrder,
          dependencyJoinType: s.dependencyJoinType,
        })),
        workItems: nextSteps.flatMap((s) =>
          s.workItems.map((wi) => ({
            id: wi.id,
            stepId: s.id,
            name: wi.name,
            requirement: wi.requirement,
            evidenceRequired: false,
          })),
        ),
        edges: nextEdges.map((e) => ({
          fromStepId: e.fromStepId,
          toStepId: e.toStepId,
        })),
        roles: [],
        customFields: [],
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
    [caseTypeId, availableCaseTypes],
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

  const loadPreset = useCallback(
    (presetKey: 'sales' | 'appraisal' | 'commercial') => {
      if (presetKey === 'sales') {
        setName('UK Residential Sales Progression');
        setDescription(
          'Standard England & Wales conveyance and sales progression workflow with AML, searches, mortgage offer, and exchange.',
        );
        setCategory('Sales Progression');
        setSteps(DEFAULT_SALES_STEPS);
      } else if (presetKey === 'appraisal') {
        setName('Market Appraisal & Valuation Flow');
        setDescription(
          'Lead qualification, desktop valuation, on-site physical inspection, and proposal generation flow.',
        );
        setCategory('Valuation & Listing');
        setSteps(APPRAISAL_STEPS);
      } else if (presetKey === 'commercial') {
        setName('Commercial Lease Conveyancing');
        setDescription(
          'Commercial lease negotiations, tenant referencing, draft lease terms, and guarantor verification.',
        );
        setCategory('Commercial');
        setSteps(COMMERCIAL_STEPS);
      }
    },
    [],
  );

  const toBackendDraftPayload = useCallback((): BackendDraftPayload => {
    return {
      steps: steps.map((step) => ({
        id: step.id,
        name: step.name,
        description: step.description,
        displayOrder: step.displayOrder,
        completionRule: { type: step.completionRule.type },
        dependencyJoinType: step.dependencyJoinType,
        workItems: step.workItems.map((wi) => ({
          id: wi.id,
          name: wi.name,
          requiredRole: wi.requiredRole,
          requirement: wi.requirement,
          isKeyDate: wi.isKeyDate,
        })),
      })),
      edges: edges,
    };
  }, [steps, edges]);

  const saveDraft = useCallback(async (): Promise<BackendDraftPayload> => {
    setIsSaving(true);
    try {
      const activeCaseTypeId = caseTypeId;

      const dto = {
        steps: steps.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description || s.name,
          displayOrder: s.displayOrder,
          dependencyJoinType: s.dependencyJoinType,
        })),
        workItems: steps.flatMap((s) =>
          s.workItems.map((wi) => ({
            id: wi.id,
            stepId: s.id,
            name: wi.name,
            requirement: wi.requirement,
            evidenceRequired: false,
          })),
        ),
        edges: edges.map((e) => ({
          fromStepId: e.fromStepId,
          toStepId: e.toStepId,
        })),
        roles: [],
        customFields: [],
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
  }, [caseTypeId, steps, edges, toBackendDraftPayload]);

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

  const value = useMemo(
    () => ({
      caseTypeId,
      name,
      description,
      category,
      versionNumber,
      isPublished,
      steps,
      edges,
      backendDagError,
      isSaving,
      isPublishing,
      lastSavedAt,
      availableCaseTypes,
      isLoadingCaseTypes,
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
      edges,
      backendDagError,
      isSaving,
      isPublishing,
      lastSavedAt,
      availableCaseTypes,
      isLoadingCaseTypes,
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
