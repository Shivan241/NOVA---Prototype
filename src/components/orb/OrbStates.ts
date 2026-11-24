/*
 * Visual state descriptors and color resolution for the living NOVA AI Orb.
 * Uses the central orange/amber accent by default when idle/neutral,
 * respects persona overrides, and shifts with detected conversation mood.
 */

import { ACCENT_PALETTE, MOOD_PALETTES } from '../../config/theme';
import type { Mood, OrbState, OrbVisualStyle } from '../../types';

export interface OrbVisualConfig {
  label: string;
  primary: string;
  secondary: string;
  glow: string;
}

export function resolveOrbColors(
  state: OrbState,
  mood: Mood,
  personaPrimary?: string,
  personaSecondary?: string
): OrbVisualConfig {
  if (state === 'error') {
    return {
      label: 'Connection interrupted',
      primary: '#EF4444',
      secondary: '#F87171',
      glow: 'rgba(239, 68, 68, 0.45)',
    };
  }

  const stateLabels: Record<OrbState, string> = {
    idle: 'Ready',
    listening: 'Listening',
    thinking: 'Thinking',
    speaking: 'Speaking',
    error: 'Error',
  };

  // Persona accent colors override default orange when a persona is selected
  if (personaPrimary && personaSecondary) {
    if (state === 'idle' || mood === 'neutral' || mood === 'calm') {
      return {
        label: stateLabels[state],
        primary: personaPrimary,
        secondary: personaSecondary,
        glow:
          personaPrimary === ACCENT_PALETTE.primary
            ? ACCENT_PALETTE.orbGlow
            : `${personaPrimary}66`,
      };
    }
  }

  // Idle/default fallback uses central orange/amber accent
  if (state === 'idle') {
    return {
      label: stateLabels[state],
      primary: ACCENT_PALETTE.primary,
      secondary: ACCENT_PALETTE.amber,
      glow: ACCENT_PALETTE.orbGlow,
    };
  }

  const moodPalette = MOOD_PALETTES[mood];
  return {
    label: stateLabels[state],
    primary: moodPalette.primary,
    secondary: moodPalette.secondary,
    glow: moodPalette.glow,
  };
}

export function getOrbStyleGeometry(style: OrbVisualStyle): {
  ringDash: string;
  ringOpacity: number;
  orbitSpeedSec: number;
} {
  switch (style) {
    case 'grid':
      return { ringDash: '4 8', ringOpacity: 0.48, orbitSpeedSec: 10 };
    case 'prism':
      return { ringDash: '16 6', ringOpacity: 0.42, orbitSpeedSec: 14 };
    case 'ember':
      return { ringDash: '2 10', ringOpacity: 0.52, orbitSpeedSec: 9 };
    case 'pulse':
      return { ringDash: 'none', ringOpacity: 0.35, orbitSpeedSec: 16 };
    case 'nebula':
      return { ringDash: '10 10', ringOpacity: 0.44, orbitSpeedSec: 12 };
    case 'aurora':
    default:
      return { ringDash: '8 12', ringOpacity: 0.38, orbitSpeedSec: 18 };
  }
}
