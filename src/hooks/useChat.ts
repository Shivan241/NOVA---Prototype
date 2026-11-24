/*
 * Primary chat hook handling message sending, immediate assistant placeholders,
 * streaming chunk updates, inline error recovery with Retry, auto-titling,
 * multimodal attachments, tool execution logging, mood updates, and TTS playback.
 */

import { useCallback, useRef } from 'react';
import { generateChatTitle, sendChatWithTools } from '../services/gemini/chat';
import { GeminiApiClientError } from '../services/gemini/client';
import { useChatStore } from '../store/chatStore';
import { useMemoryStore } from '../store/memoryStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUiStore } from '../store/uiStore';
import type { Attachment, ChatMessage } from '../types';
import { generateId } from '../utils/formatters';
import { detectMoodFromText } from '../utils/mood';
import { useMemory } from './useMemory';
import { useVoice } from './useVoice';

function formatFriendlyChatError(err: unknown): string {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'Network offline — check your internet connection and retry.';
  }
  if (err instanceof GeminiApiClientError) {
    return err.message;
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  return 'Unable to reach Gemini right now. Please retry.';
}

export function useChat() {
  const abortRef = useRef<AbortController | null>(null);

  const chats = useChatStore((s) => s.chats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingText = useChatStore((s) => s.streamingText);
  const createChat = useChatStore((s) => s.createChat);
  const renameChat = useChatStore((s) => s.renameChat);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const updateMessageContent = useChatStore((s) => s.updateMessageContent);
  const deleteMessage = useChatStore((s) => s.deleteMessage);
  const truncateMessagesAfter = useChatStore((s) => s.truncateMessagesAfter);
  const setOrbState = useChatStore((s) => s.setOrbState);
  const setMood = useChatStore((s) => s.setMood);
  const setActiveToolName = useChatStore((s) => s.setActiveToolName);
  const setStreaming = useChatStore((s) => s.setStreaming);

  const settings = useSettingsStore((s) => s.settings);
  const activePersonaId = useSettingsStore((s) => s.activePersonaId);
  const getPersonaById = useSettingsStore((s) => s.getPersonaById);

  const memories = useMemoryStore((s) => s.memories);
  const getToolContext = useMemoryStore((s) => s.getToolContext);
  const logAnalytics = useMemoryStore((s) => s.logAnalytics);
  const addToast = useUiStore((s) => s.addToast);

  const { extractAndSave } = useMemory();
  const { speak } = useVoice();

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false, '');
    setOrbState('idle');
    setActiveToolName(null);
  }, [setStreaming, setOrbState, setActiveToolName]);

  const executeAssistantTurn = useCallback(
    async (
      chatId: string,
      historyMessages: ChatMessage[],
      userPromptText: string,
      personaId: string,
      enableSearch: boolean,
      forceSpeak = false
    ): Promise<string | null> => {
      const persona = getPersonaById(personaId);
      const controller = new AbortController();
      abortRef.current = controller;

      // Create an assistant placeholder message immediately so TypingIndicator renders right away
      const assistantPlaceholderId = generateId('msg');
      const placeholderMsg: ChatMessage = {
        id: assistantPlaceholderId,
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
        status: 'streaming',
      };
      await appendMessage(chatId, placeholderMsg);

      setStreaming(true, '');
      setOrbState('thinking');
      setActiveToolName(null);

      try {
        const result = await sendChatWithTools({
          messages: historyMessages,
          persona,
          settings,
          memories,
          enableSearch,
          toolContext: getToolContext(),
          onToken: (textSoFar) => {
            setOrbState('speaking');
            setStreaming(true, textSoFar);
            void updateMessage(chatId, assistantPlaceholderId, {
              content: textSoFar,
              status: 'streaming',
            });
          },
          onToolActivity: (toolName) => {
            setActiveToolName(toolName);
            void logAnalytics({ type: 'tool', toolName });
          },
          signal: controller.signal,
        });

        const replyText =
          result.text || 'I completed the requested action for you.';
        const replyMood = detectMoodFromText(`${userPromptText} ${replyText}`);

        await updateMessage(
          chatId,
          assistantPlaceholderId,
          {
            content: replyText,
            status: 'done',
            error: undefined,
            sources: result.sources.length > 0 ? result.sources : undefined,
            toolCalls: result.toolCalls.length > 0 ? result.toolCalls : undefined,
            mood: replyMood,
          },
          replyMood,
          true
        );

        void logAnalytics({ type: 'message', mood: replyMood });
        void extractAndSave(userPromptText, replyText);

        setStreaming(false, '');
        setActiveToolName(null);

        if (forceSpeak || settings.ttsEnabled || settings.handsFree) {
          speak(replyText);
        } else {
          setOrbState('idle');
        }

        return replyText;
      } catch (err) {
        setStreaming(false, '');
        setActiveToolName(null);

        if (err instanceof DOMException && err.name === 'AbortError') {
          await updateMessage(
            chatId,
            assistantPlaceholderId,
            {
              status: 'done',
              content: useChatStore.getState().streamingText || 'Generation stopped.',
            },
            undefined,
            true
          );
          setOrbState('idle');
          return null;
        }

        const friendlyError = formatFriendlyChatError(err);
        console.error('[NOVA:chat] Failed to stream assistant reply:', err);

        await updateMessage(
          chatId,
          assistantPlaceholderId,
          {
            status: 'error',
            error: friendlyError,
            content: '',
          },
          undefined,
          true
        );

        setOrbState('error');
        addToast({
          title: 'NOVA could not reply',
          description: friendlyError,
          variant: 'error',
        });
        setTimeout(() => setOrbState('idle'), 1600);
        return null;
      } finally {
        abortRef.current = null;
      }
    },
    [
      getPersonaById,
      settings,
      memories,
      getToolContext,
      appendMessage,
      updateMessage,
      setStreaming,
      setOrbState,
      setActiveToolName,
      logAnalytics,
      extractAndSave,
      speak,
      addToast,
    ]
  );

  const sendMessage = useCallback(
    async (
      rawText: string,
      options?: {
        attachments?: Attachment[];
        enableSearch?: boolean;
        forceSpeak?: boolean;
      }
    ): Promise<string | null> => {
      const content = rawText.trim();
      const attachments = options?.attachments ?? [];
      if (!content && attachments.length === 0) return null;

      let targetChat = activeChat;
      const isBrandNewChat = !targetChat || targetChat.messages.length === 0;
      if (!targetChat) {
        targetChat = await createChat(activePersonaId);
      }

      const detectedMood = detectMoodFromText(content);
      setMood(detectedMood);

      const userMsg: ChatMessage = {
        id: generateId('msg'),
        role: 'user',
        content: content || 'Analyze attached file',
        createdAt: Date.now(),
        attachments: attachments.length > 0 ? attachments : undefined,
        mood: detectedMood,
        status: 'done',
      };

      const historyBeforeReply = [...targetChat.messages, userMsg];
      await appendMessage(targetChat.id, userMsg, detectedMood);
      void logAnalytics({ type: 'message', mood: detectedMood });

      if (isBrandNewChat && content) {
        void generateChatTitle(content).then((generatedTitle) => {
          void renameChat(targetChat!.id, generatedTitle);
        });
      }

      return executeAssistantTurn(
        targetChat.id,
        historyBeforeReply,
        userMsg.content,
        targetChat.personaId,
        options?.enableSearch ?? settings.searchGroundingDefault,
        Boolean(options?.forceSpeak)
      );
    },
    [
      activeChat,
      activePersonaId,
      createChat,
      renameChat,
      setMood,
      appendMessage,
      logAnalytics,
      executeAssistantTurn,
      settings.searchGroundingDefault,
    ]
  );

  const regenerateFromMessage = useCallback(
    async (messageId: string) => {
      if (!activeChat || isStreaming) return;
      const idx = activeChat.messages.findIndex((m) => m.id === messageId);
      if (idx === -1) return;

      const targetMsg = activeChat.messages[idx];
      let userIdx = idx;
      if (targetMsg.role === 'assistant') {
        userIdx = idx - 1;
      }
      if (userIdx < 0) return;

      const userMessage = activeChat.messages[userIdx];
      await truncateMessagesAfter(activeChat.id, userMessage.id);

      const sliceHistory = activeChat.messages.slice(0, userIdx + 1);
      await executeAssistantTurn(
        activeChat.id,
        sliceHistory,
        userMessage.content,
        activeChat.personaId,
        settings.searchGroundingDefault
      );
    },
    [
      activeChat,
      isStreaming,
      truncateMessagesAfter,
      executeAssistantTurn,
      settings.searchGroundingDefault,
    ]
  );

  const editAndResendMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (!activeChat || isStreaming || !newContent.trim()) return;
      const idx = activeChat.messages.findIndex((m) => m.id === messageId);
      if (idx === -1) return;

      await updateMessageContent(activeChat.id, messageId, newContent.trim());
      await truncateMessagesAfter(activeChat.id, messageId);

      const updatedHistory = activeChat.messages
        .slice(0, idx + 1)
        .map((m) => (m.id === messageId ? { ...m, content: newContent.trim() } : m));

      await executeAssistantTurn(
        activeChat.id,
        updatedHistory,
        newContent.trim(),
        activeChat.personaId,
        settings.searchGroundingDefault
      );
    },
    [
      activeChat,
      isStreaming,
      updateMessageContent,
      truncateMessagesAfter,
      executeAssistantTurn,
      settings.searchGroundingDefault,
    ]
  );

  return {
    activeChat,
    isStreaming,
    streamingText,
    sendMessage,
    stopGeneration,
    regenerateFromMessage,
    editAndResendMessage,
    deleteMessage: (messageId: string) =>
      activeChat ? deleteMessage(activeChat.id, messageId) : Promise.resolve(),
  };
}
