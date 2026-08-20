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

export interface CaseType {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  publishedVersionCount: number;
  activeDraftId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateStep {
  id: string;
  name: string;
  description?: string;
  order: number;
  workItems: TemplateWorkItem[];
}

export interface TemplateWorkItem {
  id: string;
  title: string;
  description?: string;
  required: boolean;
  roleId?: string;
}

export interface TemplateRole {
  id: string;
  name: string;
  description?: string;
}

export interface TemplateDraft {
  id: string;
  caseTypeId: string;
  steps: TemplateStep[];
  roles: TemplateRole[];
  updatedAt: string;
}

export interface CaseSummary {
  id: string;
  caseTypeId: string;
  caseTypeName: string;
  title: string;
  reference: string;
  status: 'active' | 'pending' | 'completed' | 'blocked';
  progressPercentage: number;
  currentStage: string;
  assigneeName: string;
  propertyAddress?: string;
  price?: number;
  updatedAt: string;
}
