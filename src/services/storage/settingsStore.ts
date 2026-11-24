/*
 * Persistence service for user settings and user-created custom personas.
 */

import { STORAGE_KEYS } from '../../config/constants';
import type { Persona, UserSettings } from '../../types';

export const DEFAULT_SETTINGS: UserSettings = {
  userName: 'Explorer',
  model: 'gemini-4-hydrogen',
  thinkingDepth: 'MEDIUM',
  creativity: 0.7,
  language: 'en-IN',
  theme: 'dark',
  animationIntensity: 'medium',
  ttsEnabled: false,
  handsFree: false,
  voiceURI: '',
  ttsRate: 1.0,
  notificationsEnabled: false,
  searchGroundingDefault: false,
};

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function persistSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

export function loadCustomPersonas(): Persona[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_PERSONAS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Persona[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistCustomPersonas(personas: Persona[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PERSONAS, JSON.stringify(personas));
  } catch {
    // Ignore storage errors
  }
}

export function clearSettingsStorage(): void {
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.CUSTOM_PERSONAS);
  localStorage.removeItem(STORAGE_KEYS.DAILY_BRIEFING);
}
