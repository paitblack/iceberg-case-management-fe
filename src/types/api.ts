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
export type CaseStatusAction =
  'HOLD' | 'RESUME' | 'COMPLETE' | 'CANCEL' | 'REOPEN';

export interface ChangeCaseStatusPayload {
  action: CaseStatusAction;
  reason?: string;
}

export interface CreateCasePayload {
  title: string;
  templateVersionId?: string;
  caseTypeId?: string;
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
  isOptional?: boolean;
  isStandalone?: boolean;
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
  reopenAllowedRoleIds?: string[];
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
  reopenAllowedRoleIds?: string[];
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

export interface TemplatePresetSummary {
  key: string;
  name: string;
  category: string;
  description: string;
  stepCount: number;
  roleCount: number;
}

export interface TemplatePresetSchema {
  key: string;
  name: string;
  category: string;
  description: string;
  roles: Array<{ id: string; name: string; description?: string }>;
  steps: Array<{
    id: string;
    name: string;
    description: string;
    displayOrder: number;
    ownerRoleId: string | null;
    completionRule: { type: string };
    dependencyJoinType: DependencyJoinType;
    isOptional?: boolean;
    isStandalone?: boolean;
  }>;
  edges: Array<{ id?: string; fromStepId: string; toStepId: string }>;
  workItems: Array<{
    id: string;
    stepId: string;
    name: string;
    description?: string;
    requirement: WorkItemRequirement;
    condition?: string;
    evidenceRequired: boolean;
    ownerRoleId: string | null;
  }>;
  customFields: Array<{
    id: string;
    name: string;
    fieldType: string;
    required: boolean;
    options?: string[];
  }>;
  reopenAllowedRoleIds?: string[];
}

export interface TemplateDraftResponse {
  id: string;
  companyId: number;
  caseTypeId: string;
  name: string;
  description: string;
  version: number;
  roles: Array<{ id: string; name: string; description?: string }>;
  steps: Array<{
    id: string;
    name: string;
    description: string;
    displayOrder: number;
    ownerRoleId: string | null;
    completionRule: { type: string };
    dependencyJoinType: DependencyJoinType;
    isOptional?: boolean;
    isStandalone?: boolean;
  }>;
  workItems: Array<{
    id: string;
    stepId: string;
    name: string;
    description?: string;
    requirement: WorkItemRequirement;
    condition?: string | null;
    evidenceRequired: boolean;
    ownerRoleId: string | null;
  }>;
  edges: Array<{ id?: string; fromStepId: string; toStepId: string }>;
  customFields: Array<{
    id: string;
    name: string;
    fieldType: string;
    required: boolean;
    options?: string[];
  }>;
  reopenAllowedRoleIds?: string[];
}

export type TrafficLightStatus = 'green' | 'amber' | 'red';

export interface TrafficLightData {
  status: TrafficLightStatus;
  reasons: string[];
}

export type SlaStatus =
  | 'ON_TRACK'
  | 'AT_RISK'
  | 'OVERDUE'
  | 'COMPLETED_ON_TIME'
  | 'COMPLETED_LATE'
  | 'NONE';

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

export interface BffCaseItemSla {
  targetDate?: string;
  isOverdue: boolean;
  overdueWorkItemCount: number;
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
  trafficLight?: TrafficLightData;
  sla?: BffCaseItemSla;
  blockersCount: number;
  createdAt: string;
  allowedActions: CaseStatusAction[];
  hasReopenPermission?: boolean;
  reopenReason?: string;
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
  trafficLight?: TrafficLightStatus;
  dueDate?: string;
  priority?: 'High' | 'Medium' | 'Low';
}

export interface BffDashboardMetrics {
  avgCycleTimeDays: number;
  milestonesDueToday: number;
  pipelineValueAmount: number;
  pipelineValueCurrency: string;
}

export interface BffDashboardRiskOverview {
  greenCases: number;
  amberCases: number;
  redCases: number;
}

export interface BffDashboardSnapshot {
  contractVersion: string;
  generatedAt: string;
  activeCasesCount: number;
  activeBlockersCount: number;
  riskOverview?: BffDashboardRiskOverview;
  priorityOperations: BffPriorityOperationItem[];
  metrics: BffDashboardMetrics;
}

export interface AssigneeInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
}

export interface BffWorkspaceWorkItem {
  id: string;
  stepId?: string;
  workItemDefinitionId?: string;
  title?: string;
  name?: string;
  description?: string;
  condition?: string;
  status: WorkItemExecutionStatus;
  statusLabel?: string;
  tag?: WorkItemTag;
  requirement: WorkItemRequirement;
  role?: string;
  ownerRoleId?: string;
  assignee?: AssigneeInfo;
  isKeyDate?: boolean;
  evidenceRequired?: boolean;
  allowedActions: WorkItemActionType[];
  targetDate?: string;
  completedAt?: string;
  completedByUserId?: string;
  completedByUserName?: string;
  slaStatus?: SlaStatus;
}

export interface NoteSnapshot {
  id: string;
  caseId: string;
  stepId?: string;
  workItemId?: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  isPrivate: boolean;
  visibleToParticipantIds: string[];
  createdAt: string;
}

export interface AnnouncementReplySnapshot {
  id: string;
  parentId: string;
  caseId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  isPrivate: boolean;
  visibleToParticipantIds: string[];
  mentionedParticipantId?: string;
  mentionedParticipantName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AnnouncementTreeSnapshot {
  id: string;
  caseId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  isPrivate: boolean;
  visibleToParticipantIds: string[];
  createdAt: string;
  updatedAt?: string;
  replies: AnnouncementReplySnapshot[];
}

export interface CreateAnnouncementPayload {
  content: string;
  isPrivate: boolean;
  visibleToParticipantIds: string[];
  mentionedParticipantId?: string;
}

export interface CreateAnnouncementReplyPayload {
  content: string;
  isPrivate: boolean;
  visibleToParticipantIds: string[];
  mentionedParticipantId?: string;
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
  isOptional?: boolean;
  isStandalone?: boolean;
  isBlocked?: boolean;
  blockerReason?: string;
  targetDate?: string;
  startedAt?: string;
  completedAt?: string;
  slaStatus?: SlaStatus;
  notes?: NoteSnapshot[];
  allowedActions: StepActionType[];
  workItems: BffWorkspaceWorkItem[];
}

export interface BffCaseDocument {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  fileType: string;
  category: string;
  workItemId?: string;
  uploadedAt: string;
  uploadedByName: string;
  downloadUrl?: string;
  canDownload?: boolean;
}

export interface DocumentDownloadUrlResponse {
  url: string;
  expiresAt: string;
  fileName: string;
  contentType: string;
  sizeBytes?: number;
}

export interface BffParticipant {
  id: string;
  caseId?: string;
  roleId: string;
  roleName?: string;
  contactId?: string;
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  isPrimary?: boolean;
  createdAt?: string;
}

export interface AssignParticipantPayload {
  roleId: string;
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  contactId?: string;
  isPrimary?: boolean;
}

export type BffCaseNote = NoteSnapshot;

export interface AddCaseNotePayload {
  content: string;
  isPrivate?: boolean;
  visibleToParticipantIds?: string[];
  stepId?: string;
  workItemId?: string;
  authorName?: string;
  authorRole?: string;
}

export type BffActivityCategory =
  | 'CASE_LIFECYCLE'
  | 'STEP'
  | 'WORK_ITEM'
  | 'PARTICIPANT'
  | 'DOCUMENT'
  | 'COMMUNICATION';

export interface BffActivityActor {
  id?: string;
  name: string;
  role?: string;
}

export interface BffCaseActivityItem {
  id: string;
  caseId: string;
  category: BffActivityCategory;
  action: string;
  title: string;
  description: string;
  actor?: BffActivityActor;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface BffCaseActivitiesResponse {
  contractVersion: string;
  generatedAt: string;
  items: BffCaseActivityItem[];
  meta: {
    totalCount: number;
    hasMore: boolean;
    nextCursor?: string;
  };
  availableCategories: BffActivityCategory[];
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
  hasReopenPermission?: boolean;
  reopenReason?: string;
  allowedActions?: CaseStatusAction[];
  trafficLight?: TrafficLightData;
  blockers: string[];
  steps: BffWorkspaceStep[];
  roles?: Array<{ id: string; name: string; description?: string }>;
  documents: BffCaseDocument[];
  participants: BffParticipant[];
  notes?: NoteSnapshot[];
  announcements?: AnnouncementTreeSnapshot[];
  recentActivities?: BffCaseActivityItem[];
  updatedAt: string;
  aiSummary?: string | null;
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
