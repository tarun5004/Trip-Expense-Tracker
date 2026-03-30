/**
 * @module uiStore
 * @description Centralized UI state representing ephemeral client data 
 *              (modals, sidebar toggles, and unified toast queues).
 * @usedBy AppShell, ModalLayout, GroupDetailPage, Forms
 */

import { create } from 'zustand';

export const useUIStore = create((set, get) => ({
  activeGroupId: null,
  sidebarOpen: false,
  activeModal: null, // { type: string, props: object }
  toasts: [], // { id, type, message, duration }

  setActiveGroup: (groupId) => set({ activeGroupId: groupId }),
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  openModal: (type, props = {}) => set({ activeModal: { type, props } }),
  
  closeModal: () => set({ activeModal: null }),
  
  /**
   * Toast management system
   */
  addToast: (toast) => {
    const id = Date.now().toString();
    const newToast = { ...toast, id };
    
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto cleanup logic
    if (toast.duration !== Infinity) {
      setTimeout(() => {
        get().removeToast(id);
      }, toast.duration || 4000);
    }

    return id;
  },
  
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
}));
