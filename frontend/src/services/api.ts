import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL;

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const simulatedNetwork = localStorage.getItem('fsm_simulated_network');
    if (simulatedNetwork === 'OFFLINE') {
      return Promise.reject(new Error('Network error: Device is currently in OFFLINE mode.'));
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
