/**
 * @module authStore
 * @description Manages authentication state purely in-memory.
 *              Tokens are never stored in localStorage to prevent XSS.
 * @usedBy ProtectedRoute component, Axios interceptors, Header Avatar
 */

import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,             // UserObject
  accessToken: null,      // In-memory strictly
  isAuthenticated: false, // Derived boolean flag
  isLoading: true,        // True during initial app bootstrap

  /**
   * Called upon successful login / silent refresh
   */
  setAuth: (user, token) => set({
    user,
    accessToken: token,
    isAuthenticated: !!token,
    isLoading: false,
  }),

  /**
   * Wipes the entire local instance upon logout or 401 triggers.
   */
  clearAuth: () => set({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
  }),

  /**
   * Partially patches the user object (e.g., after changing an avatar)
   */
  updateUser: (partialData) => set((state) => ({
    user: state.user ? { ...state.user, ...partialData } : null,
  })),

  /**
   * To transition out of loading state if bootstrap fails
   */
  setLoading: (status) => set({ isLoading: status }),
}));
