/*
 * Application-wide constants for storage keys, DB version, layout tokens, and hotkeys.
 */

export const APP_NAME = 'NOVA';
export const DB_NAME = 'nova_assistant_db';
export const DB_VERSION = 2;

export const STORAGE_KEYS = {
  SETTINGS: 'nova_settings_v1',
  CUSTOM_PERSONAS: 'nova_custom_personas_v1',
  DAILY_BRIEFING: 'nova_daily_briefing_v1',
} as const;

export const DEFAULT_HOTKEYS = {
  COMMAND_PALETTE: 'k',
  NEW_CHAT: 'n',
  VOICE_MODE: 'm',
} as const;

export const Z_INDEX = {
  SIDEBAR: 20,
  HEADER: 20,
  MOBILE_NAV: 30,
  VOICE_OVERLAY: 40,
  MODAL: 50,
  TOAST: 50,
} as const;

export const CONTROL_BAR = {
  HEIGHT_CLASS: 'h-9',
  GAP_CLASS: 'gap-2',
} as const;

export const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024; // 8 MB
export const ALLOWED_ATTACHMENT_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
] as const;
