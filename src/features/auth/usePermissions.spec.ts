import { describe, expect, it } from 'vitest';
import {
  hasSuperUserRole,
  hasRole,
  formatRoleDisplayName,
  normalizeRole,
} from './usePermissions';

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
});
