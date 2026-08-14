import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
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
    if (error.response) {
      if (error.response.status === 401) {
        console.warn('Session expired or unauthorized.');
      }
      console.error(`[API Error ${error.response.status}]:`, error.response.data);
    } else if (error.request) {
      console.warn('[API Network Error]: No response from backend at', API_BASE_URL);
    } else {
      console.error('[API Setup Error]:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
