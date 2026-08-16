import api from './api';

export enum UserRole {
  ADMIN_DISPATCHER = 'ADMIN_DISPATCHER',
  TECHNICIAN = 'TECHNICIAN'
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN_DISPATCHER]: 'Administrator',
  [UserRole.TECHNICIAN]: 'Field Technician',
};

export const getRoleLabel = (role?: UserRole | string | null): string => {
  if (!role) return 'Guest';
  return ROLE_LABELS[role as UserRole] || role;
};

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token?: string;
  user?: {
    id?: string | number;
    email: string;
    name?: string;
    role?: UserRole;
  };
  message?: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    if (response.data.user) {
      localStorage.setItem('auth_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },
  
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }
};

export default authService;
