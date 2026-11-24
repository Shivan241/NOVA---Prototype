# NOVA — Living Personal AI Assistant

NOVA is a modular personal AI assistant built with React, TypeScript, Tailwind CSS, Framer Motion, Zustand, IndexedDB, Recharts, and the `@google/genai` SDK via an Express server proxy.

## Architecture Overview

```
+-------------------------------------------------------------------+
|                           Browser (SPA)                           |
|                                                                   |
|  Pages (Home, Chat, VoiceMode, Memory, Notes, Tasks, Dashboard)   |
|     |                                                             |
|  Components (orb/, chat/, memory/, dashboard/, layout/, common/)  |
|     |                                                             |
|  Hooks (useChat, useVoice, useMemory, useTheme, useHotkeys)       |
|     |                                                             |
|  Zustand Stores (chatStore, memoryStore, settingsStore, uiStore)  |
|     |                          |                                  |
|  Services/Gemini            Services/Storage (IndexedDB via idb)  |
|  Services/Speech (STT/TTS)  Services/Weather (Open-Meteo)         |
|  Tools Plug-in Registry (src/tools/index.ts)                      |
+-------------------------------------------------------------------+
                                 |
                    SSE / JSON (/api/gemini/*)
                                 v
+-------------------------------------------------------------------+
|                   Express Server (server.ts)                      |
|         server/gemini.ts -> @google/genai + GEMINI_API_KEY        |
+-------------------------------------------------------------------+
```

## Setup & Scripts

1. Configure `GEMINI_API_KEY` in environment secrets.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server (Express + Vite middleware on port 3000):
   ```bash
   npm run dev
   ```
4. Type-check and build for production:
   ```bash
   npm run lint
   npm run build
   npm start
   ```

## Extending NOVA

### Adding a New Tool Plug-in
1. Create a new file in `src/tools/<yourTool>.ts` exporting a `NovaToolDefinition` object (`name`, `description`, `parameters`, `execute`).
2. Import and append your tool to `NOVA_TOOLS` in `src/tools/index.ts`.
3. NOVA automatically exposes the function declaration to Gemini and runs it inside the multi-turn tool loop.

### Adding a New Persona
1. Open `src/config/personas.ts`.
2. Add a plain `Persona` object to `BUILTIN_PERSONAS` with `id`, `name`, `role`, `description`, `systemPrompt`, `accentColor`, `secondaryColor`, `orbStyle`, and `starterPrompts`.
3. Users can also create custom personas at runtime from the Home page.

### Adding a New Page
1. Create your page component under `src/pages/<YourPage>.tsx`.
2. Add the page ID to the `AppPage` union in `src/types/index.ts`.
3. Register the route in `src/App.tsx`, navigation links in `src/components/layout/Sidebar.tsx`, and page title in `src/components/layout/Header.tsx`.
