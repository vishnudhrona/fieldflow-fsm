import { createContext, useContext, useState, useMemo, type ReactNode, type FC } from 'react';
import { authService, UserRole, type LoginCredentials, type AuthResponse } from '../services/authService';

export interface AuthContextType {
  user: AuthResponse['user'] | null;
  login: (credentials: LoginCredentials) => Promise<AuthResponse['user'] | undefined>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isTechnician: boolean;
  hasRole: (roles: UserRole | UserRole[] | string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse['user'] | null>(() => {
    try {
      const storedUser = localStorage.getItem('auth_user');
      const token = localStorage.getItem('auth_token');
      if (storedUser && token) {
        return JSON.parse(storedUser);
      }
    } catch {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      if (response.user) {
        setUser(response.user);
      }
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const isAuthenticated = Boolean(user);
  const isAdmin = user?.role === UserRole.ADMIN_DISPATCHER;
  const isTechnician = user?.role === UserRole.TECHNICIAN;

  const hasRole = (roles: UserRole | UserRole[] | string | string[]): boolean => {
    if (!user || !user.role) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user.role as UserRole);
  };

  const contextValue = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthenticated,
      isLoading,
      isAdmin,
      isTechnician,
      hasRole,
    }),
    [user, isLoading, isAuthenticated, isAdmin, isTechnician],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
