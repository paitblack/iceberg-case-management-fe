/**
 * RFC 9457 Problem Details representation
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  traceId?: string;
  field?: string;
  errors?: Record<string, string[]>;
}

/**
 * Bounded Context: Case Management Core Contracts
 */

export type DependencyJoinType = 'ALL' | 'ANY';
export type CompletionRuleType = 'ALL_REQUIRED' | 'ANY_REQUIRED' | 'MANUAL';
export type WorkItemRequirement = 'required' | 'optional' | 'conditional';
export type WorkItemTag =
  'Manual' | 'Key Date' | 'Email' | 'Document Upload' | 'Public Update';
export type StepExecutionStatus =
  'Pending' | 'Available' | 'InProgress' | 'Completed' | 'Skipped';
export type WorkItemExecutionStatus = 'Pending' | 'Completed' | 'Waived';
export type CaseLifecycleStatus = 'Open' | 'OnHold' | 'Completed' | 'Cancelled';

export type StepActionType = 'COMPLETE_STEP' | 'SKIP_STEP';
export type WorkItemActionType = 'COMPLETE' | 'WAIVE';
export type CaseStatusAction = 'HOLD' | 'RESUME' | 'COMPLETE' | 'CANCEL';

export interface ChangeCaseStatusPayload {
  action: CaseStatusAction;
  reason?: string;
}

export interface CreateCasePayload {
  title: string;
  templateVersionId: string;
  propertyAddress?: string;
  agreedPrice?: number;
  branchName?: string;
}

export interface CreateCaseResponse {
  id: string;
  reference?: string;
}

export interface PublishedTemplateItem {
  id: string;
  name: string;
  versionNumber: number;
  description?: string;
  caseTypeId: string;
  stepCount?: number;
}

export interface DueRule {
  type: 'none' | 'daysAfterPredecessor' | 'fixedDate';
  days?: number;
  predecessorStepId?: string;
  label?: string;
}

export interface ParticipantRoleDefinition {
  id: string;
  name: string;
  description?: string;
  canManageCase?: boolean;
  canViewInternalNotes?: boolean;
}

export interface CustomFieldDefinition {
  id: string;
  name: string;
  fieldType: 'string' | 'number' | 'boolean' | 'date' | 'currency';
  required: boolean;
}

export interface DependencyEdge {
  fromStepId: string;
  toStepId: string;
}

export interface WorkItemDefinition {
  id: string;
  stepId: string;
  name: string;
  description?: string;
  requirement: WorkItemRequirement;
  condition?: string;
  dueRule?: DueRule;
  evidenceRequired?: boolean;
  ownerRoleId?: string | null;
  tag?: WorkItemTag;
}

export interface StepDefinition {
  id: string;
  name: string;
  description?: string;
  ownerRoleId?: string | null;
  displayOrder: number;
  completionRule?: CompletionRuleType;
  dependencyJoinType?: DependencyJoinType;
  requirement?: WorkItemRequirement;
  workItems: WorkItemDefinition[];
  status?: StepExecutionStatus;
  completedTasks?: number;
  totalTasks?: number;
}

export interface TemplateDraft {
  id: string;
  companyId: number;
  caseTypeId: string;
  name: string;
  description?: string;
  steps: StepDefinition[];
  workItems: WorkItemDefinition[];
  edges: DependencyEdge[];
  roles: ParticipantRoleDefinition[];
  customFields: CustomFieldDefinition[];
  version: number;
}

export interface TemplateVersion {
  id: string;
  companyId: number;
  caseTypeId: string;
  versionNumber: number;
  name: string;
  description?: string;
  steps: StepDefinition[];
  workItems: WorkItemDefinition[];
  edges: DependencyEdge[];
  roles: ParticipantRoleDefinition[];
  customFields: CustomFieldDefinition[];
  publishedByUserId: string;
  publishedAt: string;
}

export interface CaseType {
  id: string;
  companyId: number;
  name: string;
  description?: string | null;
  publishedVersionCount: number;
  activeDraftId?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * BFF Snapshots & View Models (PAI-15, PAI-17, PAI-18, Dashboard)
 */

export interface BffCaseItemProgress {
  totalSteps: number;
  completedSteps: number;
  percentage: number;
}

export interface BffCaseItemCurrentStep {
  id: string;
  name: string;
  status: StepExecutionStatus;
  statusLabel: string;
}

export interface BffCaseItem {
  id: string;
  caseTypeId: string;
  caseTypeName: string;
  title: string;
  status: CaseLifecycleStatus;
  statusLabel: string;
  progress: BffCaseItemProgress;
  currentStep?: BffCaseItemCurrentStep;
  blockersCount: number;
  createdAt: string;
  allowedActions: CaseStatusAction[];
  reference?: string;
  propertyAddress?: string;
  price?: number;
  assigneeName?: string;
}

export interface BffCaseListMeta {
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface BffCaseListAvailableFilters {
  statuses: CaseLifecycleStatus[];
  caseTypes: { id: string; name: string }[];
}

export interface BffCaseListResponse {
  contractVersion: string;
  generatedAt: string;
  items: BffCaseItem[];
  meta: BffCaseListMeta;
  availableFilters: BffCaseListAvailableFilters;
}

export interface BffCaseListQueryParams {
  search?: string;
  status?: string;
  caseTypeId?: string;
  limit?: number;
  cursor?: string;
}

/**
 * Operations Dashboard BFF Snapshot
 */

export interface BffPriorityOperationItem {
  caseId: string;
  caseTitle: string;
  currentStepName: string;
  status: StepExecutionStatus;
  statusLabel: string;
  dueDate?: string;
  priority?: 'High' | 'Medium' | 'Low';
}

export interface BffDashboardMetrics {
  avgCycleTimeDays: number;
  milestonesDueToday: number;
  pipelineValueAmount: number;
  pipelineValueCurrency: string;
}

export interface BffDashboardSnapshot {
  contractVersion: string;
  generatedAt: string;
  activeCasesCount: number;
  activeBlockersCount: number;
  priorityOperations: BffPriorityOperationItem[];
  metrics: BffDashboardMetrics;
}

export interface BffWorkspaceWorkItem {
  id: string;
  stepId: string;
  title: string;
  description?: string;
  status: WorkItemExecutionStatus;
  tag: WorkItemTag;
  requirement: WorkItemRequirement;
  role: string;
  isKeyDate?: boolean;
  allowedActions: WorkItemActionType[];
  completedAt?: string;
  completedByUserName?: string;
}

export interface BffWorkspaceStep {
  id: string;
  stepDefinitionId: string;
  name: string;
  description?: string;
  status: StepExecutionStatus;
  displayOrder: number;
  dependencyJoinType: DependencyJoinType;
  dependencies: string[];
  allowedActions: StepActionType[];
  workItems: BffWorkspaceWorkItem[];
}

export interface BffCaseDocument {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  fileType: string;
  category: string;
  uploadedAt: string;
  uploadedByName: string;
  downloadUrl?: string;
}

export interface BffParticipant {
  id: string;
  roleId: string;
  roleName: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  isPrimary?: boolean;
}

export interface BffWorkspaceSnapshot {
  caseId: string;
  reference: string;
  title: string;
  propertyAddress: string;
  caseTypeId: string;
  caseTypeName: string;
  templateVersion: number;
  status: CaseLifecycleStatus;
  progressPercentage: number;
  agreedPrice?: number;
  assignedProgressorName: string;
  branchName: string;
  targetCompletionDate?: string;
  blockers: string[];
  steps: BffWorkspaceStep[];
  documents: BffCaseDocument[];
  participants: BffParticipant[];
  updatedAt: string;
}

export type CaseSummary = {
  id: string;
  caseTypeId: string;
  caseTypeName: string;
  title: string;
  reference: string;
  status: 'active' | 'blocked' | 'completed';
  progressPercentage: number;
  currentStage: string;
  assigneeName: string;
  propertyAddress?: string;
  price?: number;
  updatedAt: string;
};
