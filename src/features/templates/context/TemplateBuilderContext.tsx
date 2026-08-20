import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import type { DependencyJoinType } from '../../../types/api';

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
  isSaving: boolean;
  isPublishing: boolean;
  lastSavedAt: Date | null;
}

interface TemplateBuilderContextValue extends TemplateBuilderState {
  setCaseTypeMeta: (
    name: string,
    description: string,
    category?: string,
  ) => void;
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
}

const TemplateBuilderContext =
  createContext<TemplateBuilderContextValue | null>(null);

const DEFAULT_SALES_STEPS: BuilderStep[] = [
  {
    id: 'ui-temp-step-1',
    name: 'Offer Accepted & Terms Confirmed',
    description:
      'Record agreed purchase price, buyer qualification, and vendor acceptance.',
    displayOrder: 1,
    completionRule: { type: 'all-required-work-items' },
    dependencyJoinType: 'ALL',
    dependencies: [],
    workItems: [
      {
        id: 'ui-temp-wi-1',
        name: 'Record agreed offer price & deposit amount',
        requiredRole: 'Listing Agent',
        requirement: 'required',
      },
      {
        id: 'ui-temp-wi-2',
        name: 'Verify buyer chain & financial qualification',
        requiredRole: 'Listing Agent',
        requirement: 'required',
      },
    ],
  },
  {
    id: 'ui-temp-step-2',
    name: 'Memorandum of Sale Distributed',
    description:
      'Issue formal sales memo to buyer and seller conveyancing solicitors.',
    displayOrder: 2,
    completionRule: { type: 'all-required-work-items' },
    dependencyJoinType: 'ALL',
    dependencies: ['ui-temp-step-1'],
    workItems: [
      {
        id: 'ui-temp-wi-3',
        name: 'Generate formal Memorandum of Sale document',
        requiredRole: 'Sales Progressor',
        requirement: 'required',
      },
      {
        id: 'ui-temp-wi-4',
        name: 'Distribute Memo to all legal representatives',
        requiredRole: 'Sales Progressor',
        requirement: 'required',
      },
    ],
  },
  {
    id: 'ui-temp-step-3',
    name: 'Buyer Solicitor Instructed & ID Verification',
    description:
      'Confirm buyer legal representation and AML source of funds verification.',
    displayOrder: 3,
    completionRule: { type: 'all-required-work-items' },
    dependencyJoinType: 'ALL',
    dependencies: ['ui-temp-step-2'],
    workItems: [
      {
        id: 'ui-temp-wi-5',
        name: 'Collect buyer solicitor contact details',
        requiredRole: 'Sales Progressor',
        requirement: 'required',
      },
      {
        id: 'ui-temp-wi-6',
        name: 'Verify biometric AML ID and source of funds',
        requiredRole: 'Compliance Officer',
        requirement: 'required',
        isKeyDate: true,
      },
      {
        id: 'ui-temp-wi-7',
        name: 'Send instruction confirmation letter',
        requiredRole: 'Sales Progressor',
        requirement: 'required',
      },
    ],
  },
  {
    id: 'ui-temp-step-4',
    name: 'Searches & Enquiries Ordered',
    description:
      'Local authority, environmental, and drainage searches submitted.',
    displayOrder: 4,
    completionRule: { type: 'all-required-work-items' },
    dependencyJoinType: 'ALL',
    dependencies: ['ui-temp-step-3'],
    workItems: [
      {
        id: 'ui-temp-wi-8',
        name: 'Confirm search fees received from buyer',
        requiredRole: 'Sales Progressor',
        requirement: 'required',
      },
      {
        id: 'ui-temp-wi-9',
        name: 'Log local authority search submission date',
        requiredRole: 'Sales Progressor',
        requirement: 'required',
        isKeyDate: true,
      },
    ],
  },
];

export const TemplateBuilderProvider: React.FC<{
  children: React.ReactNode;
  initialCaseTypeId?: string;
}> = ({ children, initialCaseTypeId = 'ct-sales-01' }) => {
  const [caseTypeId] = useState<string>(initialCaseTypeId);
  const [name, setName] = useState<string>('UK Residential Sales Progression');
  const [description, setDescription] = useState<string>(
    'Standard England & Wales conveyance and sales progression workflow with AML, searches, mortgage offer, and exchange.',
  );
  const [category, setCategory] = useState<string>('Sales Progression');
  const [versionNumber, setVersionNumber] = useState<number>(3);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [steps, setSteps] = useState<BuilderStep[]>(DEFAULT_SALES_STEPS);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Compute edges automatically from step dependencies
  const edges = useMemo<DependencyEdge[]>(() => {
    const computed: DependencyEdge[] = [];
    for (const step of steps) {
      for (const depId of step.dependencies) {
        // ensure predecessor exists
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
        id: `ui-temp-step-${Date.now()}`,
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
            id: `ui-temp-wi-${Date.now()}-1`,
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
      // Re-index display orders and remove stepId from any dependency lists
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
            id: `ui-temp-wi-${Date.now()}`,
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

  const setStepDependencies = useCallback(
    (stepId: string, predecessorStepIds: string[]) => {
      setSteps((prev) =>
        prev.map((step) =>
          step.id === stepId
            ? { ...step, dependencies: predecessorStepIds }
            : step,
        ),
      );
    },
    [],
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
        setSteps([
          {
            id: 'ui-temp-app-1',
            name: 'Lead Qualification & Property Intake',
            displayOrder: 1,
            completionRule: { type: 'all-required-work-items' },
            dependencyJoinType: 'ALL',
            dependencies: [],
            workItems: [
              {
                id: 'ui-temp-wi-app-1',
                name: 'Confirm client contact details & motivation',
                requiredRole: 'Listing Agent',
                requirement: 'required',
              },
              {
                id: 'ui-temp-wi-app-2',
                name: 'Retrieve Land Registry title & historical sales data',
                requiredRole: 'Listing Agent',
                requirement: 'required',
              },
            ],
          },
          {
            id: 'ui-temp-app-2',
            name: 'On-Site Valuation Inspection',
            displayOrder: 2,
            completionRule: { type: 'all-required-work-items' },
            dependencyJoinType: 'ALL',
            dependencies: ['ui-temp-app-1'],
            workItems: [
              {
                id: 'ui-temp-wi-app-3',
                name: 'Conduct physical property inspection & room measurements',
                requiredRole: 'Valuer',
                requirement: 'required',
                isKeyDate: true,
              },
              {
                id: 'ui-temp-wi-app-4',
                name: 'Take marketing preparation photos',
                requiredRole: 'Valuer',
                requirement: 'optional',
              },
            ],
          },
          {
            id: 'ui-temp-app-3',
            name: 'Valuation Report & Agency Proposal',
            displayOrder: 3,
            completionRule: { type: 'all-required-work-items' },
            dependencyJoinType: 'ALL',
            dependencies: ['ui-temp-app-2'],
            workItems: [
              {
                id: 'ui-temp-wi-app-5',
                name: 'Generate formal appraisal valuation pack',
                requiredRole: 'Listing Agent',
                requirement: 'required',
              },
              {
                id: 'ui-temp-wi-app-6',
                name: 'Present proposal to vendor & agree marketing terms',
                requiredRole: 'Listing Agent',
                requirement: 'required',
              },
            ],
          },
        ]);
      } else if (presetKey === 'commercial') {
        setName('Commercial Lease Conveyancing');
        setDescription(
          'Commercial lease negotiations, tenant referencing, draft lease terms, and guarantor verification.',
        );
        setCategory('Commercial');
        setSteps([
          {
            id: 'ui-temp-comm-1',
            name: 'Heads of Terms Agreed',
            displayOrder: 1,
            completionRule: { type: 'all-required-work-items' },
            dependencyJoinType: 'ALL',
            dependencies: [],
            workItems: [
              {
                id: 'ui-temp-wi-comm-1',
                name: 'Confirm commercial rent, lease term, and rent review intervals',
                requiredRole: 'Commercial Agent',
                requirement: 'required',
              },
            ],
          },
          {
            id: 'ui-temp-comm-2',
            name: 'Tenant Credit & Commercial Referencing',
            displayOrder: 2,
            completionRule: { type: 'all-required-work-items' },
            dependencyJoinType: 'ALL',
            dependencies: ['ui-temp-comm-1'],
            workItems: [
              {
                id: 'ui-temp-wi-comm-2',
                name: 'Obtain 3 years audited accounts and trade references',
                requiredRole: 'Compliance Officer',
                requirement: 'required',
              },
            ],
          },
        ]);
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
      const payload = toBackendDraftPayload();
      console.log(
        `[TemplateBuilder] Saving draft payload for caseTypeId '${caseTypeId}':`,
        JSON.stringify(payload, null, 2),
      );

      // Simulate slight network delay if running mock or real backend
      await new Promise((resolve) => setTimeout(resolve, 350));

      setLastSavedAt(new Date());
      return payload;
    } finally {
      setIsSaving(false);
    }
  }, [caseTypeId, toBackendDraftPayload]);

  const publishDraft = useCallback(async (): Promise<void> => {
    setIsPublishing(true);
    try {
      const payload = toBackendDraftPayload();
      console.log(
        `[TemplateBuilder] Publishing template version for caseTypeId '${caseTypeId}':`,
        JSON.stringify(payload, null, 2),
      );
      await new Promise((resolve) => setTimeout(resolve, 400));
      setVersionNumber((prev) => prev + 1);
      setIsPublished(true);
    } finally {
      setIsPublishing(false);
    }
  }, [caseTypeId, toBackendDraftPayload]);

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
      isSaving,
      isPublishing,
      lastSavedAt,
      setCaseTypeMeta,
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
      isSaving,
      isPublishing,
      lastSavedAt,
      setCaseTypeMeta,
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
