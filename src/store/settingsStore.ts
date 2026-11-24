/*
 * Zustand settings store managing theme, Gemini model, thinking depth,
 * speech language, voice selection, animation intensity, and custom personas.
 */

import { create } from 'zustand';
import { BUILTIN_PERSONAS } from '../config/personas';
import {
  clearSettingsStorage,
  DEFAULT_SETTINGS,
  loadCustomPersonas,
  loadSettings,
  persistCustomPersonas,
  persistSettings,
} from '../services/storage/settingsStore';
import type { Persona, PersonaId, UserSettings } from '../types';

interface SettingsState {
  settings: UserSettings;
  customPersonas: Persona[];
  activePersonaId: PersonaId;
  updateSettings: (patch: Partial<UserSettings>) => void;
  setActivePersonaId: (id: PersonaId) => void;
  addCustomPersona: (persona: Persona) => void;
  deleteCustomPersona: (id: PersonaId) => void;
  getAllPersonas: () => Persona[];
  getPersonaById: (id: PersonaId) => Persona;
  resetAllSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: loadSettings(),
  customPersonas: loadCustomPersonas(),
  activePersonaId: 'friend',

  updateSettings: (patch) =>
    set((state) => {
      const next = { ...state.settings, ...patch };
      persistSettings(next);
      return { settings: next };
    }),

  setActivePersonaId: (id) => set({ activePersonaId: id }),

  addCustomPersona: (persona) =>
    set((state) => {
      const next = [...state.customPersonas, { ...persona, isCustom: true }];
      persistCustomPersonas(next);
      return { customPersonas: next, activePersonaId: persona.id };
    }),

  deleteCustomPersona: (id) =>
    set((state) => {
      const next = state.customPersonas.filter((p) => p.id !== id);
      persistCustomPersonas(next);
      return {
        customPersonas: next,
        activePersonaId:
          state.activePersonaId === id ? 'friend' : state.activePersonaId,
      };
    }),

  getAllPersonas: () => [...BUILTIN_PERSONAS, ...get().customPersonas],

  getPersonaById: (id) => {
    const all = [...BUILTIN_PERSONAS, ...get().customPersonas];
    return all.find((p) => p.id === id) ?? BUILTIN_PERSONAS[0];
  },

  resetAllSettings: () => {
    clearSettingsStorage();
    set({
      settings: DEFAULT_SETTINGS,
      customPersonas: [],
      activePersonaId: 'friend',
    });
  },
}));
