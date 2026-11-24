/*
 * Core TypeScript domain interfaces and strict union types for NOVA.
 */

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export type Mood = 'calm' | 'excited' | 'focused' | 'sad' | 'neutral';

export type ThemeMode = 'dark' | 'light' | 'amoled' | 'glass';

export type AnimationIntensity = 'low' | 'medium' | 'high';

export type SpeechLanguage = 'en-IN' | 'hi-IN' | 'en-US' | 'hinglish';

export type AppPage =
  | 'home'
  | 'chat'
  | 'voice'
  | 'memory'
  | 'notes'
  | 'tasks'
  | 'dashboard'
  | 'settings';

export type PersonaId =
  | 'friend'
  | 'study-mentor'
  | 'coder'
  | 'career-coach'
  | 'productivity-manager'
  | 'creative-writer'
  | string;

export type OrbVisualStyle = 'aurora' | 'pulse' | 'prism' | 'ember' | 'grid' | 'nebula';

export interface Persona {
  id: PersonaId;
  name: string;
  role: string;
  description: string;
  systemPrompt: string;
  accentColor: string;
  secondaryColor: string;
  orbStyle: OrbVisualStyle;
  starterPrompts: string[];
  isCustom?: boolean;
}

export type GeminiModelId = 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';

export type ThinkingDepth = 'LOW' | 'MEDIUM' | 'HIGH' | 'XHIGH';

export interface ModelConfig {
  id: GeminiModelId;
  label: string;
  description: string;
  supportsThinking: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataBase64: string;
  previewUrl?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ToolInvocationRecord {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  attachments?: Attachment[];
  sources?: GroundingSource[];
  toolCalls?: ToolInvocationRecord[];
  mood?: Mood;
  editedAt?: number;
  status?: 'streaming' | 'done' | 'error';
  error?: string;
  isDemo?: boolean;
}

export interface ChatConversation {
  id: string;
  title: string;
  personaId: PersonaId;
  messages: ChatMessage[];
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  detectedMood: Mood;
  isDemo?: boolean;
}

export type MemoryCategory = 'identity' | 'goal' | 'preference' | 'deadline' | 'context';

export interface MemoryItem {
  id: string;
  content: string;
  category: MemoryCategory;
  confidence: number;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isDemo?: boolean;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  isDemo?: boolean;
}

export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  reminderAt?: number;
  notified?: boolean;
  priority: TaskPriority;
  completed: boolean;
  createdAt: number;
  isDemo?: boolean;
}

export interface PlannerBlock {
  id: string;
  date: string; // YYYY-MM-DD
  startHour: number; // 0-23.5
  durationHours: number;
  title: string;
  category: 'deep-work' | 'meeting' | 'learning' | 'personal';
  completed: boolean;
  isDemo?: boolean;
}

export interface AnalyticsEvent {
  id: string;
  type: 'message' | 'tool' | 'voice' | 'memory';
  dateKey: string; // YYYY-MM-DD
  toolName?: string;
  mood?: Mood;
  timestamp: number;
  isDemo?: boolean;
}

export interface DailyBriefing {
  dateKey: string;
  greeting: string;
  motivationalLine: string;
  learningSuggestion: string;
  focusSummary: string;
  generatedAt: number;
}

export interface UserSettings {
  userName: string;
  model: GeminiModelId;
  thinkingDepth: ThinkingDepth;
  creativity: number; // 0.0 to 1.0
  language: SpeechLanguage;
  theme: ThemeMode;
  animationIntensity: AnimationIntensity;
  ttsEnabled: boolean;
  handsFree: boolean;
  voiceURI: string;
  ttsRate: number;
  notificationsEnabled: boolean;
  searchGroundingDefault: boolean;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'info' | 'success' | 'warning' | 'error';
}

export interface ToolExecutionContext {
  addNote: (note: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<NoteItem>;
  searchNotes: (query: string) => Promise<NoteItem[]>;
  pinNote: (idOrTitle: string, pinned: boolean) => Promise<NoteItem | null>;
  addTask: (task: Omit<TaskItem, 'id' | 'createdAt' | 'completed'>) => Promise<TaskItem>;
  listTasks: (includeCompleted?: boolean) => Promise<TaskItem[]>;
  completeTask: (idOrTitle: string) => Promise<TaskItem | null>;
  addPlannerBlock: (block: Omit<PlannerBlock, 'id' | 'completed'>) => Promise<PlannerBlock>;
  getDayPlan: (date: string) => Promise<PlannerBlock[]>;
}

export interface NovaToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'OBJECT';
    properties: Record<
      string,
      {
        type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'ARRAY';
        description: string;
        enum?: string[];
        items?: { type: 'STRING' };
      }
    >;
    required: string[];
  };
  execute: (
    args: Record<string, unknown>,
    ctx: ToolExecutionContext
  ) => Promise<Record<string, unknown>>;
}
