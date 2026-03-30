/**
 * @module apiClient
 * @description Central Axios instance for all frontend-to-backend pipeline routing.
 *              Intercepts auth-headers, traces Request IDs, and orchestrates 401 token refreshing loops.
 * @connectsTo util/auth.js (synchronous memory), axios
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import auth from '../utils/auth';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial for httpOnly refresh cookies!
});

// We need to track the refresh state globally so parallel failing requests don't spawn 10 refresh calls
let isRefreshing = false;
let failedQueue = [];

// Helper queue processor
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// --- REQUEST BOOTSTRAPPER --- //
apiClient.interceptors.request.use((config) => {
  const token = auth.getAccessToken();
  
  // Attach Jwt
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Attach Tracing UUID
  if (config.headers) {
    config.headers['X-Request-ID'] = uuidv4();
  }

  return config;
}, (error) => Promise.reject(error));

// --- RESPONSE ROUTER --- //
apiClient.interceptors.response.use(
  (response) => response.data?.data || response.data, 
  async (error) => {
    const originalRequest = error.config;

    // Custom Error Normalization Bubble
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // We are already running a refresh loop, push to the queue and wait
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      // Mark the original so we don't infinitely loop
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt Silent Refresh logic fetching the httpOnly Cookie
        const refreshRes = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {}, { 
          withCredentials: true 
        });

        const newAccessToken = refreshRes.data?.data?.accessToken || refreshRes.data?.accessToken;
        
        // 1. Update Volatile Memory
        auth.setAccessToken(newAccessToken);
        
        // 2. Clear Queue pushing the new token downward linearly
        processQueue(null, newAccessToken);
        
        // 3. Retry the originally failed request with the new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
        
      } catch (err) {
        // The Refresh token expired. Catastrophe scenario -> Force logout
        processQueue(err, null);
        auth.clearAccessToken();
        
        // Force redirect without React components relying entirely on the browser DOM since this is a global Axios scope
        if (typeof window !== 'undefined') {
          window.location.href = '/auth?tab=login&expired=true';
        }

        return Promise.reject(err?.response?.data || { message: "Session expired. Please log in again." });
      } finally {
        isRefreshing = false;
      }
    }

    // Normalized throw mapping our backend standard
    return Promise.reject(error.response?.data || { message: error.message || "Network Error" });
  }
);

export default apiClient;
