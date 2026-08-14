import api from './api';

export enum UserRole {
  ADMIN_DISPATCHER = 'ADMIN_DISPATCHER',
  TECHNICIAN = 'TECHNICIAN'
}

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

  /**
   * Log out and clear local credentials
   */
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  /**
   * Check if token exists
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }
};

export default authService;
