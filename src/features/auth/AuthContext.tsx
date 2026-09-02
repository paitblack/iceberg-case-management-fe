import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  UserPersona,
  PREDEFINED_PERSONAS,
  DEFAULT_ACTIVE_PERSONA,
  SUPER_USER_ROLE_KEYWORDS,
} from '../../types/auth';

interface AuthContextValue {
  user: UserPersona;
  token: string | null;
  roles: string[];
  permissions: string[];
  isSuperUser: boolean;
  availablePersonas: UserPersona[];
  switchPersona: (personaId: string) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY_PERSONA = 'iceberg_active_persona_id';
const STORAGE_KEY_TOKEN = 'lifesycle_auth_token';
const STORAGE_KEY_COMPANY_ID = 'lifesycle_company_id';
const STORAGE_KEY_ACTOR_ID = 'lifesycle_actor_id';
const STORAGE_KEY_ROLES = 'lifesycle_user_roles';
const STORAGE_KEY_BRANCH_ID = 'lifesycle_branch_id';

export function isUserSuperUser(roles: string[]): boolean {
  if (!roles || roles.length === 0) return false;
  return roles.some((role) => {
    const normalized = role.trim().toLowerCase();
    return SUPER_USER_ROLE_KEYWORDS.some((kw) => normalized.includes(kw));
  });
}

function syncLocalStorage(persona: UserPersona, token: string | null) {
  try {
    localStorage.setItem(STORAGE_KEY_PERSONA, persona.id);
    localStorage.setItem(STORAGE_KEY_COMPANY_ID, String(persona.companyId));
    localStorage.setItem(STORAGE_KEY_ACTOR_ID, persona.id);
    localStorage.setItem(STORAGE_KEY_ROLES, persona.roles.join(', '));
    if (persona.branchId) {
      localStorage.setItem(STORAGE_KEY_BRANCH_ID, persona.branchId);
    } else {
      localStorage.removeItem(STORAGE_KEY_BRANCH_ID);
    }
    if (token) {
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    }
  } catch {
    // Ignore storage quota errors in test/private browsing environments
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activePersona, setActivePersona] = useState<UserPersona>(() => {
    try {
      const savedPersonaId = localStorage.getItem(STORAGE_KEY_PERSONA);
      if (savedPersonaId) {
        const match = PREDEFINED_PERSONAS.find((p) => p.id === savedPersonaId);
        if (match) return match;
      }
    } catch {
      // Fallback to default
    }
    return DEFAULT_ACTIVE_PERSONA;
  });

  const [token, setTokenState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_TOKEN);
    } catch {
      return null;
    }
  });

  // Keep localStorage aligned on mount and changes
  useEffect(() => {
    syncLocalStorage(activePersona, token);
  }, [activePersona, token]);

  const switchPersona = useCallback((personaId: string) => {
    const target = PREDEFINED_PERSONAS.find((p) => p.id === personaId);
    if (target) {
      setActivePersona(target);
      syncLocalStorage(target, token);
      // Dispatch custom event to notify components or queries to reload if needed
      window.dispatchEvent(
        new CustomEvent('auth:persona-changed', { detail: target }),
      );
    }
  }, [token]);

  const setToken = useCallback((newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem(STORAGE_KEY_TOKEN, newToken);
    } else {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    }
  }, []);

  const logout = useCallback(() => {
    setActivePersona(DEFAULT_ACTIVE_PERSONA);
    setTokenState(null);
    try {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_PERSONA);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const isSuperUser = useMemo(
    () => isUserSuperUser(activePersona.roles),
    [activePersona.roles],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: activePersona,
      token,
      roles: activePersona.roles,
      permissions: activePersona.permissions,
      isSuperUser,
      availablePersonas: PREDEFINED_PERSONAS,
      switchPersona,
      setToken,
      logout,
    }),
    [activePersona, token, isSuperUser, switchPersona, setToken, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    // Provide a safe fallback if accessed outside AuthProvider (e.g. isolated test environments)
    return {
      user: DEFAULT_ACTIVE_PERSONA,
      token: null,
      roles: DEFAULT_ACTIVE_PERSONA.roles,
      permissions: DEFAULT_ACTIVE_PERSONA.permissions,
      isSuperUser: true,
      availablePersonas: PREDEFINED_PERSONAS,
      switchPersona: () => {},
      setToken: () => {},
      logout: () => {},
    };
  }
  return context;
}
