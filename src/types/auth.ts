/**
 * Authentication and Role-Based Access Control (RBAC/PBAC) Types
 */

export interface UserPersona {
  id: string;
  name: string;
  email: string;
  companyId: number;
  branchId?: string;
  roles: string[];
  permissions: string[];
  description: string;
  avatarText: string;
  badgeVariant: 'primary' | 'success' | 'warning' | 'default';
}

export const SUPER_USER_ROLE_KEYWORDS = [
  'admin',
  'superuser',
  'progressor',
  'sales progressor',
  'agent',
  'estate agent',
  'role-estate-agent',
  'role-admin',
] as const;

export const DOMAIN_PERMISSIONS = {
  // Case Operations
  CASE_CREATE: 'case:create',
  CASE_READ: 'case:read',
  CASE_STATUS_TRANSITION: 'case:status:transition',
  CASE_REOPEN: 'case:reopen',

  // Workflow & Steps
  STEP_EXECUTE: 'step:execute',
  WORK_ITEM_EXECUTE: 'work_item:execute',
  TARGET_DATE_MANAGE: 'target_date:manage',

  // Stakeholders & Communication
  PARTICIPANT_MANAGE: 'participant:manage',
  NOTE_CREATE: 'note:create',
  ANNOUNCEMENT_CREATE: 'announcement:create',

  // Documents
  DOCUMENT_UPLOAD: 'document:upload',
  DOCUMENT_DOWNLOAD: 'document:download',
  DOCUMENT_DELETE: 'document:delete',

  // Templates & Administration
  TEMPLATE_MANAGE: 'template:manage',
} as const;

export type DomainPermission =
  (typeof DOMAIN_PERMISSIONS)[keyof typeof DOMAIN_PERMISSIONS];

export const PREDEFINED_PERSONAS: UserPersona[] = [
  {
    id: 'usr_1',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@iceberg-agency.co.uk',
    companyId: 1001,
    branchId: '1',
    roles: ['Sales Progressor', 'Estate Agent', 'admin'],
    permissions: Object.values(DOMAIN_PERMISSIONS),
    description:
      'Internal Super-User with full progression, template administrative, and audit rights.',
    avatarText: 'SJ',
    badgeVariant: 'primary',
  },
  {
    id: 'usr_agent_2',
    name: 'Marcus Cole',
    email: 'marcus.cole@iceberg-agency.co.uk',
    companyId: 1001,
    branchId: '1',
    roles: ['Estate Agent', 'role-estate-agent'],
    permissions: [
      DOMAIN_PERMISSIONS.CASE_READ,
      DOMAIN_PERMISSIONS.CASE_CREATE,
      DOMAIN_PERMISSIONS.STEP_EXECUTE,
      DOMAIN_PERMISSIONS.WORK_ITEM_EXECUTE,
      DOMAIN_PERMISSIONS.TARGET_DATE_MANAGE,
      DOMAIN_PERMISSIONS.PARTICIPANT_MANAGE,
      DOMAIN_PERMISSIONS.NOTE_CREATE,
      DOMAIN_PERMISSIONS.ANNOUNCEMENT_CREATE,
      DOMAIN_PERMISSIONS.DOCUMENT_UPLOAD,
      DOMAIN_PERMISSIONS.DOCUMENT_DOWNLOAD,
    ],
    description:
      'Branch estate agent handling client onboarding, AML checks, and sales progression milestones.',
    avatarText: 'MC',
    badgeVariant: 'primary',
  },
  {
    id: 'usr_buyer_sol_3',
    name: 'David Vance',
    email: 'david.vance@vance-legal.co.uk',
    companyId: 1001,
    roles: ['Buyer Solicitor', 'role-buyer-solicitor'],
    permissions: [
      DOMAIN_PERMISSIONS.CASE_READ,
      DOMAIN_PERMISSIONS.STEP_EXECUTE,
      DOMAIN_PERMISSIONS.WORK_ITEM_EXECUTE,
      DOMAIN_PERMISSIONS.DOCUMENT_UPLOAD,
      DOMAIN_PERMISSIONS.DOCUMENT_DOWNLOAD,
      DOMAIN_PERMISSIONS.NOTE_CREATE,
      DOMAIN_PERMISSIONS.ANNOUNCEMENT_CREATE,
    ],
    description:
      'External conveyancer representing buyer for property searches, exchange, and completion.',
    avatarText: 'DV',
    badgeVariant: 'warning',
  },
  {
    id: 'usr_vendor_sol_4',
    name: 'Rachel Sterling',
    email: 'rachel.sterling@sterling-law.co.uk',
    companyId: 1001,
    roles: ['Vendor Solicitor', 'role-vendor-solicitor'],
    permissions: [
      DOMAIN_PERMISSIONS.CASE_READ,
      DOMAIN_PERMISSIONS.STEP_EXECUTE,
      DOMAIN_PERMISSIONS.WORK_ITEM_EXECUTE,
      DOMAIN_PERMISSIONS.DOCUMENT_UPLOAD,
      DOMAIN_PERMISSIONS.DOCUMENT_DOWNLOAD,
      DOMAIN_PERMISSIONS.NOTE_CREATE,
      DOMAIN_PERMISSIONS.ANNOUNCEMENT_CREATE,
    ],
    description:
      'External conveyancer representing seller for draft contracts, title deeds, and enquiries.',
    avatarText: 'RS',
    badgeVariant: 'warning',
  },
  {
    id: 'usr_client_5',
    name: 'Emily & John Smith',
    email: 'emily.smith@example.com',
    companyId: 1001,
    roles: ['Buyer', 'Vendor', 'role-buyer', 'role-vendor'],
    permissions: [
      DOMAIN_PERMISSIONS.CASE_READ,
      DOMAIN_PERMISSIONS.DOCUMENT_DOWNLOAD,
      DOMAIN_PERMISSIONS.DOCUMENT_UPLOAD,
      DOMAIN_PERMISSIONS.NOTE_CREATE,
      DOMAIN_PERMISSIONS.ANNOUNCEMENT_CREATE,
    ],
    description:
      'Property buyer/seller with visibility into progression stages and document upload rights.',
    avatarText: 'JS',
    badgeVariant: 'default',
  },
];

export const DEFAULT_ACTIVE_PERSONA = PREDEFINED_PERSONAS[0];
