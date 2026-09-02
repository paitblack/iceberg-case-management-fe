import { useMemo } from 'react';
import { useAuth } from './AuthContext';
import { SUPER_USER_ROLE_KEYWORDS } from '../../types/auth';
import type {
  BffWorkspaceWorkItem,
  BffCaseDocument,
  CaseStatusAction,
} from '../../types/api';

/**
 * Normalizes a role string for flexible case-insensitive matching against role IDs or names.
 */
export function normalizeRole(role: string): string {
  if (!role) return '';
  return role
    .trim()
    .toLowerCase()
    .replace(/^role-/, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Checks if a given role or list of roles matches super-user/internal agent keywords.
 */
export function hasSuperUserRole(roles?: string[]): boolean {
  if (!roles || roles.length === 0) return false;
  return roles.some((role) => {
    const normalized = role.trim().toLowerCase();
    return SUPER_USER_ROLE_KEYWORDS.some((kw) => normalized.includes(kw));
  });
}

/**
 * Formats a role slug or key into human-readable display name.
 */
export function formatRoleDisplayName(role?: string, ownerRoleId?: string): string {
  const roleText = role || ownerRoleId;
  if (!roleText) return 'Assigned Role';

  const standardRoleMap: Record<string, string> = {
    'role-estate-agent': 'Estate Agent / Progressor',
    'role-vendor-solicitor': "Seller's Conveyancer / Solicitor",
    'role-buyer-solicitor': "Buyer's Conveyancer / Solicitor",
    'role-vendor': 'Seller / Vendor',
    'role-buyer': 'Buyer / Purchaser',
    'role-mortgage-broker': 'Mortgage Broker / Advisor',
    'role-surveyor': 'RICS Surveyor / Valuer',
  };

  if (standardRoleMap[roleText]) {
    return standardRoleMap[roleText];
  }

  if (!roleText.startsWith('role-')) {
    return roleText;
  }

  const withoutPrefix = roleText.replace(/^role-/, '');
  const parts = withoutPrefix
    .split('-')
    .filter((p) => !/^[a-z0-9]{6,}$/i.test(p));
  if (parts.length > 0) {
    return parts.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return roleText;
}

/**
 * Checks if user possesses a target role (handling IDs, slugs, and display names).
 */
export function hasRole(roles: string[] | undefined, targetRole: string | undefined): boolean {
  if (!roles || roles.length === 0 || !targetRole) return false;
  const targetNorm = normalizeRole(targetRole);
  if (!targetNorm) return false;

  return roles.some((r) => {
    const userRoleNorm = normalizeRole(r);
    return userRoleNorm === targetNorm || userRoleNorm.includes(targetNorm) || targetNorm.includes(userRoleNorm);
  });
}

export function usePermissions() {
  const { user, roles, permissions } = useAuth();

  const isSuperUser = useMemo(() => hasSuperUserRole(roles), [roles]);

  const can = useMemo(() => {
    return (permission: string): boolean => {
      if (isSuperUser) return true;
      return permissions.includes(permission);
    };
  }, [isSuperUser, permissions]);

  const canExecuteWorkItem = useMemo(() => {
    return (
      workItem: BffWorkspaceWorkItem,
    ): {
      canExecute: boolean;
      reason?: string;
      targetRoleDisplayName: string;
    } => {
      const targetRoleDisplayName = formatRoleDisplayName(
        workItem.role,
        workItem.ownerRoleId,
      );

      // Super-users (Progressor / Admin / Estate Agent) can execute any work item
      if (isSuperUser) {
        return { canExecute: true, targetRoleDisplayName };
      }

      // Check if work item has an assigned role requirement
      const targetRoleId = workItem.ownerRoleId || workItem.role;
      if (!targetRoleId) {
        return { canExecute: true, targetRoleDisplayName };
      }

      // Check if current user has matching role
      const matchesRole =
        hasRole(roles, targetRoleId) ||
        (workItem.role ? hasRole(roles, workItem.role) : false);

      if (matchesRole) {
        return { canExecute: true, targetRoleDisplayName };
      }

      return {
        canExecute: false,
        reason: `Only ${targetRoleDisplayName} can complete this task.`,
        targetRoleDisplayName,
      };
    };
  }, [isSuperUser, roles]);

  const canDownloadDocument = useMemo(() => {
    return (doc: BffCaseDocument): boolean => {
      if (doc.canDownload === false) return false;
      return true;
    };
  }, []);

  const canManageTemplates = useMemo(() => {
    return (): boolean => isSuperUser;
  }, [isSuperUser]);

  const canCreatePrivateNote = useMemo(() => {
    return (): boolean => isSuperUser;
  }, [isSuperUser]);

  const canReopenCase = useMemo(() => {
    return (caseData?: {
      hasReopenPermission?: boolean;
      allowedActions?: CaseStatusAction[];
    }): boolean => {
      if (isSuperUser) return true;
      if (caseData?.hasReopenPermission === true) return true;
      if (caseData?.allowedActions?.includes('REOPEN')) return true;
      return false;
    };
  }, [isSuperUser]);

  return {
    user,
    roles,
    permissions,
    isSuperUser,
    hasSuperUserRole: (testRoles?: string[]) => hasSuperUserRole(testRoles || roles),
    hasRole: (targetRole: string) => hasRole(roles, targetRole),
    can,
    canExecuteWorkItem,
    canDownloadDocument,
    canManageTemplates,
    canCreatePrivateNote,
    canReopenCase,
  };
}
