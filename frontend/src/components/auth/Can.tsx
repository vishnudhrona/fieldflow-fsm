import type { FC, ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../services/authService';

export interface CanProps {
  roles: UserRole | UserRole[] | string | string[];
  children: ReactNode | ((context: { user: any; isAdmin: boolean; isTechnician: boolean }) => ReactNode);
  fallback?: ReactNode;
}

export const Can: FC<CanProps> = ({ roles, children, fallback = null }) => {
  const { user, hasRole, isAdmin, isTechnician } = useAuth();

  const isAllowed = hasRole(roles);

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  if (typeof children === 'function') {
    return <>{children({ user, isAdmin, isTechnician })}</>;
  }

  return <>{children}</>;
};

export default Can;
