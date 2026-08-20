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
export type StepStatus =
  'Completed' | 'In progress' | 'Waiting' | 'Not started' | 'Blocked';
export type CaseLifecycleStatus = 'Open' | 'OnHold' | 'Completed' | 'Cancelled';

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
  // UI Presentation Meta
  status?: StepStatus;
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
 * BFF View Models & Snapshots (PAI-15, PAI-17, PAI-18)
 */

export interface BffCaseListItem {
  id: string;
  reference: string;
  title: string;
  propertyAddress: string;
  caseTypeId: string;
  caseTypeName: string;
  status: 'Open' | 'OnHold' | 'Completed' | 'Cancelled';
  executionStatus: 'active' | 'blocked' | 'completed';
  currentStepId: string;
  currentStepName: string;
  progressPercentage: number;
  agreedPrice?: number;
  assignedOwnerName: string;
  blockerReason?: string;
  nextScheduledChase?: string;
  priority: 'High' | 'Medium' | 'Low';
  slaStatus: 'onTrack' | 'dueToday' | 'overdue';
  updatedAt: string;
}

export interface BffWorkspaceSnapshot {
  caseId: string;
  reference: string;
  title: string;
  propertyAddress: string;
  caseTypeName: string;
  templateVersion: number;
  status: CaseLifecycleStatus;
  progressPercentage: number;
  steps: {
    id: string;
    stepDefinitionId: string;
    name: string;
    status: StepStatus;
    displayOrder: number;
    workItems: {
      id: string;
      title: string;
      status: 'Pending' | 'Completed' | 'Waived';
      tag: WorkItemTag;
      requirement: WorkItemRequirement;
      role: string;
      completedAt?: string;
    }[];
  }[];
  participants: {
    roleId: string;
    roleName: string;
    name: string;
    email: string;
    phone?: string;
  }[];
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
