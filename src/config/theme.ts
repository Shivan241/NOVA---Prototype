/*
 * Theme presets, central orange accent palette, and mood-driven color mappings
 * for the NOVA Orb and UI controls.
 */

import type { Mood, ThemeMode } from '../types';

export const ACCENT_PALETTE = {
  primary: '#FF7A1A',
  hover: '#FF8F3D',
  pressed: '#E86500',
  amber: '#F59E0B',
  soft: 'rgba(255, 122, 26, 0.14)',
  glow: 'rgba(255, 122, 26, 0.25)',
  orbGlow: 'rgba(255, 122, 26, 0.44)',
  foregroundOnAccent: '#0B0F19',
} as const;

export const THEME_OPTIONS: {
  id: ThemeMode;
  label: string;
  description: string;
}[] = [
  { id: 'dark', label: 'Midnight Dark', description: 'Deep slate surface with crisp contrast' },
  { id: 'light', label: 'Daylight', description: 'Clean bright canvas for daytime clarity' },
  { id: 'amoled', label: 'AMOLED Black', description: 'Pure true-black canvas for OLED screens' },
  { id: 'glass', label: 'Frosted Glass', description: 'Translucent layered surfaces over mesh glow' },
];

export interface MoodPalette {
  label: string;
  primary: string;
  secondary: string;
  glow: string;
}

export const MOOD_PALETTES: Record<Mood, MoodPalette> = {
  calm: {
    label: 'Calm',
    primary: '#FF7A1A',
    secondary: '#FBBF24',
    glow: 'rgba(255, 122, 26, 0.42)',
  },
  excited: {
    label: 'Excited',
    primary: '#FF5E1A',
    secondary: '#FBBF24',
    glow: 'rgba(255, 94, 26, 0.48)',
  },
  focused: {
    label: 'Focused',
    primary: '#10B981',
    secondary: '#34D399',
    glow: 'rgba(16, 185, 129, 0.42)',
  },
  sad: {
    label: 'Reflective',
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    glow: 'rgba(139, 92, 246, 0.42)',
  },
  neutral: {
    label: 'Balanced',
    primary: ACCENT_PALETTE.primary,
    secondary: '#FF9E44',
    glow: ACCENT_PALETTE.orbGlow,
  },
};
