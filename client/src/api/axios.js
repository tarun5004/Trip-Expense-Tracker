/**
 * @module api/axios
 * @description Centralized Axios instance wiring the in-memory Zustand token into every request natively.
 */

import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: Inject token if available
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor: Global 401 handling
apiClient.interceptors.response.use(
  (response) => response.data, // Unbox data natively
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth(); // Wipe memory & force login
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default apiClient;
