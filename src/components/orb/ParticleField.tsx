/*
 * HTML5 Canvas swirling particle field rendered around and inside the NOVA AI Orb
 * during thinking, listening, and speaking states.
 */

import { useEffect, useRef } from 'react';
import type { AnimationIntensity, OrbState } from '../../types';

interface ParticleFieldProps {
  size: number;
  state: OrbState;
  color: string;
  secondaryColor: string;
  intensity: AnimationIntensity;
  reducedMotion: boolean;
}

interface Particle {
  angle: number;
  radius: number;
  speed: number;
  dotSize: number;
  alpha: number;
}

export function ParticleField({
  size,
  state,
  color,
  secondaryColor,
  intensity,
  reducedMotion,
}: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const count =
      intensity === 'low' ? 14 : intensity === 'high' ? 38 : 26;
    const particles: Particle[] = Array.from({ length: count }, (_, i) => ({
      angle: (Math.PI * 2 * i) / count + Math.random() * 0.4,
      radius: size * (0.24 + Math.random() * 0.2),
      speed: (0.004 + Math.random() * 0.009) * (i % 2 === 0 ? 1 : -1),
      dotSize: 1.4 + Math.random() * 2.2,
      alpha: 0.35 + Math.random() * 0.55,
    }));

    let rafId = 0;

    const renderFrame = () => {
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const speedMultiplier =
        state === 'thinking'
          ? 3.4
          : state === 'speaking'
            ? 2.1
            : state === 'listening'
              ? 1.7
              : 0.55;

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        if (!reducedMotion) {
          p.angle += p.speed * speedMultiplier;
        }
        const wobble =
          state === 'thinking' && !reducedMotion
            ? Math.sin(p.angle * 3) * (size * 0.03)
            : 0;
        const r = p.radius + wobble;
        const x = cx + Math.cos(p.angle) * r;
        const y = cy + Math.sin(p.angle) * r;

        ctx.beginPath();
        ctx.arc(x, y, p.dotSize, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? color : secondaryColor;
        ctx.globalAlpha =
          state === 'idle' ? p.alpha * 0.45 : p.alpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (!reducedMotion) {
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    renderFrame();
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [size, state, color, secondaryColor, intensity, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
    />
  );
}
