import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import * as AuthContextModule from './AuthContext';
import {
  usePermissions,
  hasSuperUserRole,
  hasRole,
  formatRoleDisplayName,
  normalizeRole,
} from './usePermissions';
import type { BffWorkspaceWorkItem } from '../../types/api';
import type { UserPersona } from '../../types/auth';

describe('usePermissions & Role Utilities', () => {
  describe('normalizeRole', () => {
    it('normalizes role strings and strips role- prefix', () => {
      expect(normalizeRole('role-buyer-solicitor')).toBe('buyersolicitor');
      expect(normalizeRole('Buyer Solicitor')).toBe('buyersolicitor');
      expect(normalizeRole('  ESTATE AGENT ')).toBe('estateagent');
    });
  });

  describe('hasSuperUserRole', () => {
    it('returns true for administrative and progressor roles', () => {
      expect(hasSuperUserRole(['Sales Progressor'])).toBe(true);
      expect(hasSuperUserRole(['admin'])).toBe(true);
      expect(hasSuperUserRole(['Estate Agent'])).toBe(true);
      expect(hasSuperUserRole(['role-estate-agent'])).toBe(true);
      expect(hasSuperUserRole(['superuser'])).toBe(true);
    });

    it('returns false for external stakeholder roles', () => {
      expect(hasSuperUserRole(['Buyer Solicitor'])).toBe(false);
      expect(hasSuperUserRole(['role-vendor-solicitor'])).toBe(false);
      expect(hasSuperUserRole(['Buyer', 'Vendor'])).toBe(false);
      expect(hasSuperUserRole([])).toBe(false);
      expect(hasSuperUserRole(undefined)).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('matches user roles by slug, name, or case-insensitive keyword', () => {
      const userRoles = ['Buyer Solicitor', 'role-buyer-solicitor'];
      expect(hasRole(userRoles, 'role-buyer-solicitor')).toBe(true);
      expect(hasRole(userRoles, 'Buyer Solicitor')).toBe(true);
      expect(hasRole(userRoles, 'Vendor Solicitor')).toBe(false);
    });
  });

  describe('formatRoleDisplayName', () => {
    it('formats known standard role slugs into friendly titles', () => {
      expect(formatRoleDisplayName('role-buyer-solicitor')).toBe(
        "Buyer's Conveyancer / Solicitor",
      );
      expect(formatRoleDisplayName('role-vendor-solicitor')).toBe(
        "Seller's Conveyancer / Solicitor",
      );
      expect(formatRoleDisplayName('role-estate-agent')).toBe(
        'Estate Agent / Progressor',
      );
      expect(formatRoleDisplayName('role-mortgage-broker')).toBe(
        'Mortgage Broker / Advisor',
      );
    });

    it('falls back gracefully for custom roles', () => {
      expect(formatRoleDisplayName('Custom Inspector')).toBe('Custom Inspector');
      expect(formatRoleDisplayName(undefined)).toBe('Assigned Role');
    });
  });

  describe('usePermissions -> canExecuteWorkItem', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    type AuthValue = ReturnType<typeof AuthContextModule.useAuth>;

    const createMockAuth = (
      userOverrides: Partial<UserPersona> = {},
      contextOverrides: Partial<AuthValue> = {},
    ): AuthValue => {
      const user: UserPersona = {
        id: 'usr-default',
        name: 'Default User',
        email: 'default@example.com',
        companyId: 1,
        roles: [],
        permissions: [],
        description: 'Default',
        avatarText: 'DU',
        badgeVariant: 'default',
        ...userOverrides,
      };

      return {
        user,
        token: 'mock-token',
        roles: user.roles,
        permissions: user.permissions,
        isSuperUser: false,
        availablePersonas: [user],
        switchPersona: vi.fn(),
        setToken: vi.fn(),
        logout: vi.fn(),
        ...contextOverrides,
      };
    };

    const baseWorkItem: BffWorkspaceWorkItem = {
      id: 'wi-1',
      stepId: 'step-1',
      title: 'Upload ID Evidence',
      name: 'Upload ID Evidence',
      status: 'Pending',
      requirement: 'required',
      ownerRoleId: 'role-custom-yumusak-ge',
      role: 'yumuşak ge',
      allowedActions: [],
    };

    it('allows super-user to execute any work item', () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(
        createMockAuth(
          {
            id: 'usr-admin',
            name: 'Sarah Admin',
            email: 'sarah@example.com',
            roles: ['admin'],
            description: 'Admin',
            avatarText: 'SA',
            badgeVariant: 'primary',
          },
          {
            isSuperUser: true,
          },
        ),
      );

      const { result } = renderHook(() => usePermissions());
      const check = result.current.canExecuteWorkItem(baseWorkItem);
      expect(check.canExecute).toBe(true);
      expect(check.targetRoleDisplayName).toBe('yumuşak ge');
    });

    it('allows execution if backend allowedActions explicitly includes COMPLETE', () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(
        createMockAuth({
          id: 'usr-buyer-emily',
          name: 'Emily Davis',
          email: 'emily@example.com',
          roles: ['Buyer'],
          permissions: ['case:read'],
          description: 'Buyer',
          avatarText: 'ED',
          badgeVariant: 'default',
        }),
      );

      const { result } = renderHook(() => usePermissions());
      const workItemWithComplete: BffWorkspaceWorkItem = {
        ...baseWorkItem,
        allowedActions: ['COMPLETE'],
      };

      const check = result.current.canExecuteWorkItem(workItemWithComplete);
      expect(check.canExecute).toBe(true);
    });

    it('allows execution if logged-in user matches the assignee by ID or email', () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(
        createMockAuth({
          id: 'usr-buyer-emily',
          name: 'Emily Davis',
          email: 'emily.davis@example.com',
          roles: ['Buyer'],
          permissions: [],
          description: 'Buyer',
          avatarText: 'ED',
          badgeVariant: 'default',
        }),
      );

      const { result } = renderHook(() => usePermissions());

      // Matching by ID
      const workItemMatchId: BffWorkspaceWorkItem = {
        ...baseWorkItem,
        assignee: {
          id: 'usr-buyer-emily',
          name: 'Emily Davis',
        },
        allowedActions: [],
      };
      expect(result.current.canExecuteWorkItem(workItemMatchId).canExecute).toBe(
        true,
      );

      // Matching by email
      const workItemMatchEmail: BffWorkspaceWorkItem = {
        ...baseWorkItem,
        assignee: {
          id: 'participant-external-99',
          name: 'Emily Davis',
          email: 'emily.davis@example.com',
        },
        allowedActions: [],
      };
      expect(
        result.current.canExecuteWorkItem(workItemMatchEmail).canExecute,
      ).toBe(true);
    });

    it('allows execution if user has work_item:execute permission regardless of task role', () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(
        createMockAuth({
          id: 'usr-agent-marcus',
          name: 'Marcus Cole',
          email: 'marcus@turnerproperties.co.uk',
          roles: ['Estate Agent'],
          permissions: ['work_item:execute'],
          description: 'Estate Agent',
          avatarText: 'MC',
          badgeVariant: 'primary',
        }),
      );

      const { result } = renderHook(() => usePermissions());

      const solicitorWorkItem: BffWorkspaceWorkItem = {
        ...baseWorkItem,
        ownerRoleId: 'role-buyer-solicitor',
        role: "Buyer's Conveyancer / Solicitor",
        allowedActions: [],
      };

      expect(
        result.current.canExecuteWorkItem(solicitorWorkItem).canExecute,
      ).toBe(true);
      expect(
        result.current.canExecuteWorkItem(solicitorWorkItem).targetRoleDisplayName,
      ).toBe("Buyer's Conveyancer / Solicitor");
    });

    it('denies execution when user lacks work_item:execute and task does not allow COMPLETE', () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(
        createMockAuth({
          id: 'usr-unprivileged',
          name: 'Read Only User',
          email: 'readonly@example.com',
          roles: ['guest'],
          permissions: ['case:read'],
          description: 'Guest',
          avatarText: 'RO',
          badgeVariant: 'default',
        }),
      );

      const { result } = renderHook(() => usePermissions());

      const check = result.current.canExecuteWorkItem(baseWorkItem);
      expect(check.canExecute).toBe(false);
      expect(check.targetRoleDisplayName).toBe('yumuşak ge');
    });
  });
});
