/*
 * Conversation export (Markdown, JSON, PDF) and JSON import utilities.
 */

import { jsPDF } from 'jspdf';
import type { ChatConversation, ChatMessage } from '../types';
import { formatDateShort, formatTimeShort, generateId } from './formatters';

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function sanitizeFileSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'nova-chat'
  );
}

export function chatToMarkdown(chat: ChatConversation): string {
  const header = [
    `# ${chat.title}`,
    `Persona: ${chat.personaId} · Created ${formatDateShort(chat.createdAt)}`,
    '',
    '---',
    '',
  ];

  const body = chat.messages.map((msg) => {
    const speaker = msg.role === 'user' ? 'You' : 'NOVA';
    const time = formatTimeShort(msg.createdAt);
    const sourcesBlock =
      msg.sources && msg.sources.length > 0
        ? `\n\nSources:\n${msg.sources.map((s) => `- [${s.title}](${s.uri})`).join('\n')}`
        : '';
    return `### ${speaker} (${time})\n\n${msg.content}${sourcesBlock}\n`;
  });

  return [...header, ...body].join('\n');
}

export function exportChatAsMarkdown(chat: ChatConversation): void {
  const md = chatToMarkdown(chat);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  triggerDownload(blob, `${sanitizeFileSlug(chat.title)}.md`);
}

export function exportChatAsJson(chat: ChatConversation): void {
  const blob = new Blob([JSON.stringify(chat, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  triggerDownload(blob, `${sanitizeFileSlug(chat.title)}.json`);
}

export function exportChatAsPdf(chat: ChatConversation): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const maxWidth = pageWidth - margin * 2;
  let y = 52;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(chat.title, margin, y);
  y += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Persona: ${chat.personaId} | Exported ${new Date().toLocaleDateString()}`,
    margin,
    y
  );
  y += 24;

  for (const msg of chat.messages) {
    if (y > pageHeight - 70) {
      doc.addPage();
      y = 50;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(37, 99, 235);
    const label = `${msg.role === 'user' ? 'You' : 'NOVA'} · ${formatTimeShort(msg.createdAt)}`;
    doc.text(label, margin, y);
    y += 14;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    const lines = doc.splitTextToSize(msg.content || '(Attachment)', maxWidth) as string[];

    for (const line of lines) {
      if (y > pageHeight - 48) {
        doc.addPage();
        y = 50;
      }
      doc.text(line, margin, y);
      y += 14;
    }
    y += 12;
  }

  doc.save(`${sanitizeFileSlug(chat.title)}.pdf`);
}

export function parseImportedChatJson(rawText: string): ChatConversation {
  const parsed = JSON.parse(rawText) as Partial<ChatConversation>;
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.messages)) {
    throw new Error('Invalid chat JSON file: missing messages array.');
  }

  const normalizedMessages: ChatMessage[] = parsed.messages
    .filter((m): m is ChatMessage => Boolean(m && typeof m.content === 'string'))
    .map((m) => ({
      id: typeof m.id === 'string' ? m.id : generateId('msg'),
      role: m.role === 'user' || m.role === 'assistant' ? m.role : 'assistant',
      content: m.content,
      createdAt: typeof m.createdAt === 'number' ? m.createdAt : Date.now(),
      sources: Array.isArray(m.sources) ? m.sources : undefined,
      mood: m.mood,
    }));

  return {
    id: generateId('chat'),
    title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title : 'Imported Chat',
    personaId: typeof parsed.personaId === 'string' ? parsed.personaId : 'friend',
    messages: normalizedMessages,
    pinned: Boolean(parsed.pinned),
    createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : Date.now(),
    updatedAt: Date.now(),
    detectedMood: parsed.detectedMood ?? 'neutral',
  };
}
