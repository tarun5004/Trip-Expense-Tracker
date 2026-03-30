/**
 * @hook useAuth
 * @description Provides authentication methods matching the memory Zustand store, injecting 
 *              mutation/query semantics over it.
 * @usedBy AuthPage, AppShell, ProtectedRoutes
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { queryClient, queryKeys } from '../api/queryClient';
import apiClient from '../api/axios';

const loginUser = async (credentials) => {
  const { data } = await apiClient.post('/auth/login', credentials);
  return data; // { user, accessToken }
};

const registerUser = async (userData) => {
  const { data } = await apiClient.post('/auth/register', userData);
  return data;
};

// Assuming the API provides a /me route for silent refresh or bootstrap
const fetchMe = async () => {
  const { data } = await apiClient.get('/auth/me');
  return data;
};

export const useAuth = () => {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
    },
  });

  const logout = () => {
    clearAuth();
    queryClient.clear(); // Wipe react-query cache completely on logout
  };

  /**
   * Used strictly for bootstrapping the app on reload if we implement a HttpOnly
   * refresh token on the server-side.
   */
  const { refetch: bootstrap } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: fetchMe,
    enabled: false, // Wait until explicit call during initial mount
  });

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout,
    bootstrap,
  };
};

export default useAuth;
