/*
 * Syncs the selected theme mode (dark, light, amoled, glass) onto <html>
 * and checks prefers-reduced-motion alongside animation intensity settings.
 */

import { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import type { AnimationIntensity } from '../types';

export function useTheme() {
  const theme = useSettingsStore((s) => s.settings.theme);
  const animationIntensity = useSettingsStore(
    (s) => s.settings.animationIntensity
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
    root.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const effectiveMotion: AnimationIntensity =
    prefersReducedMotion || animationIntensity === 'low'
      ? 'low'
      : animationIntensity;

  return {
    theme,
    prefersReducedMotion,
    effectiveMotion,
  };
}
