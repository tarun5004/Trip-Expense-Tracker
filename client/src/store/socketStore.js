/**
 * @module socketStore
 * @description Holds realtime connection metrics globally accessible to display offline warnings or sync loaders.
 * @usedBy Main Layout, Offline Banners
 */

import { create } from 'zustand';

export const useSocketStore = create((set) => ({
  status: 'idle', // 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'
  lastEvent: null, // { type: "expense:created", timestamp: 161000.. }
  
  setStatus: (status) => set({ status }),
  
  setLastEvent: (event) => set({ lastEvent: event }), // Triggered by useRealtime
}));
