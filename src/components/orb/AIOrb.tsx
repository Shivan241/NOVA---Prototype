/*
 * Flagship living AI Orb centerpiece combining Framer Motion physics,
 * SVG orbital rings, microphone-reactive ripples, speech waveform bars,
 * swirling particle canvas, and mood/persona color shifts.
 */

import { motion } from 'framer-motion';
import { useId } from 'react';
import { useTheme } from '../../hooks/useTheme';
import type { Mood, OrbState, OrbVisualStyle } from '../../types';
import { getOrbStyleGeometry, resolveOrbColors } from './OrbStates';
import { ParticleField } from './ParticleField';

interface AIOrbProps {
  state: OrbState;
  mood: Mood;
  orbStyle?: OrbVisualStyle;
  personaPrimary?: string;
  personaSecondary?: string;
  micAmplitude?: number;
  size?: number;
  onClick?: () => void;
  ariaLabel?: string;
}

const WAVE_BAR_INDEXES = [0, 1, 2, 3, 4, 5, 6];

export function AIOrb({
  state,
  mood,
  orbStyle = 'aurora',
  personaPrimary,
  personaSecondary,
  micAmplitude = 0,
  size = 180,
  onClick,
  ariaLabel = 'NOVA AI Orb',
}: AIOrbProps) {
  const gradId = useId();
  const { effectiveMotion, prefersReducedMotion } = useTheme();
  const colors = resolveOrbColors(state, mood, personaPrimary, personaSecondary);
  const geometry = getOrbStyleGeometry(orbStyle);
  const reduced = prefersReducedMotion || effectiveMotion === 'low';

  const coreScale =
    state === 'listening'
      ? 1 + Math.min(0.22, micAmplitude * 0.28)
      : state === 'speaking'
        ? 1.05
        : state === 'thinking'
          ? 0.96
          : 1;

  const rippleScale = 1.15 + micAmplitude * 0.45;

  const Wrapper = onClick ? motion.button : motion.div;

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-label={ariaLabel}
      animate={
        state === 'error' && !reduced
          ? { x: [0, -7, 7, -5, 5, 0] }
          : { x: 0 }
      }
      transition={{ duration: 0.42 }}
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center select-none rounded-full nova-accent-ring ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Ambient radial halo */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 rounded-full blur-2xl pointer-events-none"
        animate={
          reduced
            ? { opacity: 0.5, scale: 1 }
            : state === 'idle'
              ? { scale: [0.95, 1.08, 0.95], opacity: [0.4, 0.65, 0.4] }
              : state === 'listening'
                ? { scale: rippleScale, opacity: 0.72 }
                : state === 'thinking'
                  ? { scale: [0.96, 1.12, 0.96], opacity: [0.55, 0.8, 0.55] }
                  : state === 'speaking'
                    ? { scale: [1, 1.14, 1.02, 1.1], opacity: 0.75 }
                    : { scale: 1.05, opacity: 0.7 }
        }
        transition={{
          duration: state === 'idle' ? 4.2 : 1.4,
          repeat: state === 'listening' || reduced ? 0 : Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
        }}
      />

      {/* Swirling Particle Canvas */}
      {size >= 96 && (
        <ParticleField
          size={size}
          state={state}
          color={colors.primary}
          secondaryColor={colors.secondary}
          intensity={effectiveMotion}
          reducedMotion={reduced}
        />
      )}

      {/* Listening concentric ripples driven by mic amplitude */}
      {state === 'listening' && (
        <>
          <motion.span
            aria-hidden="true"
            className="absolute rounded-full border pointer-events-none"
            style={{
              width: size * 0.78,
              height: size * 0.78,
              borderColor: colors.secondary,
            }}
            animate={{
              scale: 1 + micAmplitude * 0.42,
              opacity: 0.35 + micAmplitude * 0.5,
            }}
            transition={{ duration: 0.12 }}
          />
          {!reduced && (
            <motion.span
              aria-hidden="true"
              className="absolute rounded-full border pointer-events-none"
              style={{
                width: size * 0.74,
                height: size * 0.74,
                borderColor: colors.primary,
              }}
              animate={{ scale: [1, 1.42], opacity: [0.65, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </>
      )}

      {/* Outer geometric SVG orbital ring */}
      <motion.svg
        viewBox="0 0 200 200"
        className="absolute inset-0 w-full h-full pointer-events-none"
        animate={
          reduced
            ? { rotate: 0 }
            : {
                rotate: state === 'thinking' ? 360 : 360,
              }
        }
        transition={{
          duration:
            state === 'thinking'
              ? 4
              : geometry.orbitSpeedSec,
          repeat: reduced ? 0 : Infinity,
          ease: 'linear',
        }}
      >
        <defs>
          <radialGradient id={`${gradId}-core`} cx="36%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="32%" stopColor={colors.secondary} stopOpacity="0.95" />
            <stop offset="76%" stopColor={colors.primary} stopOpacity="0.98" />
            <stop offset="100%" stopColor="#090D16" stopOpacity="0.96" />
          </radialGradient>
        </defs>

        <circle
          cx="100"
          cy="100"
          r="84"
          fill="none"
          stroke={colors.secondary}
          strokeOpacity={geometry.ringOpacity}
          strokeWidth="1.5"
          strokeDasharray={geometry.ringDash === 'none' ? undefined : geometry.ringDash}
        />

        {state === 'thinking' && (
          <circle
            cx="100"
            cy="100"
            r="72"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.55"
            strokeWidth="2"
            strokeDasharray="44 120"
            strokeLinecap="round"
          />
        )}
      </motion.svg>

      {/* Core Living Sphere */}
      <motion.div
        animate={
          reduced
            ? { scale: 1 }
            : state === 'idle'
              ? { scale: [0.97, 1.03, 0.97] }
              : { scale: coreScale }
        }
        transition={{
          duration: state === 'idle' ? 3.8 : 0.18,
          repeat: state === 'idle' && !reduced ? Infinity : 0,
          ease: 'easeInOut',
        }}
        style={{
          width: size * 0.56,
          height: size * 0.56,
          background: `radial-gradient(circle at 34% 30%, rgba(255,255,255,0.85) 0%, ${colors.secondary} 34%, ${colors.primary} 78%, #090d16 100%)`,
          boxShadow: `0 0 ${Math.round(size * 0.22)}px ${colors.glow}, inset 0 0 18px rgba(255,255,255,0.28)`,
        }}
        className="relative rounded-full flex items-center justify-center overflow-hidden"
      >
        {/* Speaking waveform bars inside the core */}
        {state === 'speaking' && (
          <div
            className="flex items-center justify-center gap-1 h-1/2 px-2"
            aria-hidden="true"
          >
            {WAVE_BAR_INDEXES.map((bar) => (
              <motion.span
                key={bar}
                className="w-1 rounded-full bg-white/90"
                animate={
                  reduced
                    ? { height: '36%' }
                    : {
                        height: ['24%', `${55 + ((bar * 19) % 40)}%`, '22%'],
                      }
                }
                transition={{
                  duration: 0.45 + bar * 0.06,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </Wrapper>
  );
}
