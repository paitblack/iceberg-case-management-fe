import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../../features/auth/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresSuperUser?: boolean;
  requiredPermission?: string;
  requiredRole?: string;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiresSuperUser = false,
  requiredPermission,
  requiredRole,
  redirectTo = '/cases',
}) => {
  const { isSuperUser, can, hasRole } = usePermissions();
  const location = useLocation();

  let isAuthorized = true;

  if (requiresSuperUser && !isSuperUser) {
    isAuthorized = false;
  } else if (requiredPermission && !can(requiredPermission)) {
    isAuthorized = false;
  } else if (requiredRole && !hasRole(requiredRole) && !isSuperUser) {
    isAuthorized = false;
  }

  if (!isAuthorized) {
    // Notify window for toast feedback if listener is registered
    window.dispatchEvent(
      new CustomEvent('auth:forbidden', {
        detail: {
          message: 'You do not have permission to access this administration page.',
          path: location.pathname,
        },
      }),
    );
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
