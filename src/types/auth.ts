/**
 * Authentication and Role-Based Access Control (RBAC/PBAC) Types
 */

export interface UserPersona {
  id: string;
  name: string;
  fullname?: string;
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
  {
    id: 'usr_mortgage_7',
    name: 'Oliver Grant',
    email: 'oliver@grantfinancial.co.uk',
    companyId: 1001,
    roles: ['Mortgage Broker', 'role-mortgage-broker'],
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
      'Mortgage advisor tracking mortgage offers and mortgage deed approvals.',
    avatarText: 'OG',
    badgeVariant: 'warning',
  },
  {
    id: 'usr_surveyor_8',
    name: 'Claire Harrison',
    email: 'claire@harrisonsurveys.co.uk',
    companyId: 1001,
    roles: ['Surveyor', 'role-surveyor'],
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
      'RICS Chartered Surveyor executing structural survey and valuation inspection.',
    avatarText: 'CH',
    badgeVariant: 'warning',
  },
];

export const DEFAULT_ACTIVE_PERSONA = PREDEFINED_PERSONAS[0];

export interface RegisteredContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companyName: string;
  jobTitle?: string;
  roleId: string;
  roleLabel: string;
  category: 'STAFF' | 'SOLICITOR' | 'CLIENT' | 'ADVISOR';
  avatarInitials: string;
}

export const REGISTERED_SYSTEM_CONTACTS: RegisteredContact[] = [
  // 1. Internal Progressor & Agents
  {
    id: 'usr_1',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@iceberg-agency.co.uk',
    phone: '+44 20 7946 0912',
    companyName: 'Iceberg Estate Agency',
    jobTitle: 'Senior Sales Progressor',
    roleId: 'role-estate-agent',
    roleLabel: 'Estate Agent & Sales Progressor',
    category: 'STAFF',
    avatarInitials: 'SJ',
  },
  {
    id: 'usr_agent_2',
    name: 'Marcus Cole',
    email: 'marcus.cole@iceberg-agency.co.uk',
    phone: '+44 20 7946 0855',
    companyName: 'Iceberg Estate Agency',
    jobTitle: 'Branch Operations Lead',
    roleId: 'role-estate-agent',
    roleLabel: 'Estate Agent & Sales Progressor',
    category: 'STAFF',
    avatarInitials: 'MC',
  },

  // 2. Solicitors & Conveyancers
  {
    id: 'usr_buyer_sol_3',
    name: 'David Vance',
    email: 'david.vance@vance-legal.co.uk',
    phone: '+44 161 496 0233',
    companyName: 'Vance & Co Legal Partners',
    jobTitle: 'Partner Conveyancer',
    roleId: 'role-buyer-solicitor',
    roleLabel: "Buyer's Conveyancer (Buyer Solicitor)",
    category: 'SOLICITOR',
    avatarInitials: 'DV',
  },
  {
    id: 'usr_vendor_sol_4',
    name: 'Rachel Sterling',
    email: 'rachel.sterling@sterling-law.co.uk',
    phone: '+44 113 496 0789',
    companyName: 'Sterling Conveyancing Group',
    jobTitle: 'Senior Solicitor',
    roleId: 'role-vendor-solicitor',
    roleLabel: "Seller's Conveyancer (Vendor Solicitor)",
    category: 'SOLICITOR',
    avatarInitials: 'RS',
  },
  {
    id: 'usr_sol_5',
    name: 'Alexander Wright',
    email: 'a.wright@wrightlaw.co.uk',
    phone: '+44 117 496 0451',
    companyName: 'Wright & Bell Solicitors',
    jobTitle: 'Head of Residential Property',
    roleId: 'role-buyer-solicitor',
    roleLabel: "Buyer's Conveyancer (Buyer Solicitor)",
    category: 'SOLICITOR',
    avatarInitials: 'AW',
  },
  {
    id: 'usr_sol_6',
    name: 'Eleanor Campbell',
    email: 'e.campbell@highlandlegal.co.uk',
    phone: '+44 131 496 0882',
    companyName: 'Highland Legal Practice',
    jobTitle: 'Property Law Associate',
    roleId: 'role-vendor-solicitor',
    roleLabel: "Seller's Conveyancer (Vendor Solicitor)",
    category: 'SOLICITOR',
    avatarInitials: 'EC',
  },

  // 3. Financial Advisors & Surveyors
  {
    id: 'usr_mortgage_7',
    name: 'Oliver Grant',
    email: 'oliver@grantfinancial.co.uk',
    phone: '+44 20 7946 0341',
    companyName: 'Grant Financial Solutions',
    jobTitle: 'Chartered Mortgage Broker',
    roleId: 'role-mortgage-broker',
    roleLabel: 'Mortgage Broker / Financial Advisor',
    category: 'ADVISOR',
    avatarInitials: 'OG',
  },
  {
    id: 'usr_surveyor_8',
    name: 'Claire Harrison',
    email: 'claire@harrisonsurveys.co.uk',
    phone: '+44 121 496 0199',
    companyName: 'Harrison Chartered Surveyors',
    jobTitle: 'Senior RICS Valuer',
    roleId: 'role-surveyor',
    roleLabel: 'RICS Surveyor / Property Valuer',
    category: 'ADVISOR',
    avatarInitials: 'CH',
  },

  // 4. Clients (Buyers & Vendors)
  {
    id: 'usr_client_5',
    name: 'Emily & John Smith',
    email: 'emily.smith@example.com',
    phone: '+44 7700 900142',
    companyName: 'Private Purchaser',
    jobTitle: 'Buyer',
    roleId: 'role-buyer',
    roleLabel: 'Buyer / Purchaser',
    category: 'CLIENT',
    avatarInitials: 'JS',
  },
  {
    id: 'usr_client_9',
    name: 'Arthur Pendelton',
    email: 'arthur.p@outlook.com',
    phone: '+44 7700 900588',
    companyName: 'Private Vendor',
    jobTitle: 'Property Owner',
    roleId: 'role-vendor',
    roleLabel: 'Seller / Vendor',
    category: 'CLIENT',
    avatarInitials: 'AP',
  },
];
