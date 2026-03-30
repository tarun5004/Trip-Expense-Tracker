/**
 * @module draftStore
 * @description Utilizes Zustand's persist middleware to save in-progress expense forms
 *              into Session Storage. Prevents data loss during accidental refreshes.
 * @usedBy ExpenseForm wizard
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useDraftStore = create(
  persist(
    (set) => ({
      draftExpense: null, // DraftExpenseObject

      setDraft: (draft) => set({ draftExpense: draft }),
      
      updateDraft: (partialData) => set((state) => ({
        draftExpense: state.draftExpense 
          ? { ...state.draftExpense, ...partialData } 
          : partialData, // initialize if null
      })),
      
      clearDraft: () => set({ draftExpense: null }),
    }),
    {
      name: 'splitsmart-draft-storage',
      // Persist to session storage so it resets if they close the tab explicitly
      storage: createJSONStorage(() => sessionStorage), 
    }
  )
);
