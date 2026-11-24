/*
 * Zustand UI store managing active navigation page, sidebar collapse,
 * command palette visibility, and transient toast notifications.
 */

import { create } from 'zustand';
import type { AppPage, ToastMessage } from '../types';
import { generateId } from '../utils/formatters';

interface UiState {
  currentPage: AppPage;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  commandPaletteOpen: boolean;
  toasts: ToastMessage[];
  setPage: (page: AppPage) => void;
  toggleSidebar: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  currentPage: 'home',
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  commandPaletteOpen: false,
  toasts: [],
  setPage: (page) => set({ currentPage: page, mobileMenuOpen: false }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  addToast: (toast) => {
    const id = generateId('toast');
    set((state) => ({
      toasts: [...state.toasts.slice(-3), { ...toast, id }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4200);
  },
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
