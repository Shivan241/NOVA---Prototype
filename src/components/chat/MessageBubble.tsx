/*
 * Renders an individual chat message with structured AST Markdown,
 * syntax-styled code blocks with copy action, streaming TypingIndicator placeholder,
 * inline error recovery card with Retry / Open Settings, grounding citations,
 * tool logs, attachments, and edit/regenerate/delete/speak actions.
 */

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  FileText,
  Pencil,
  RotateCcw,
  Settings,
  Trash2,
  Volume2,
  Wrench,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { ChatMessage } from '../../types';
import { formatFileSize, formatTimeShort } from '../../utils/formatters';
import {
  parseInlineMarkdown,
  parseMarkdownBlocks,
  type MarkdownBlock,
} from '../../utils/markdown';
import { TypingIndicator } from './TypingIndicator';

interface MessageBubbleProps {
  message: ChatMessage;
  activeToolName?: string | null;
  onEdit?: (id: string, nextContent: string) => void;
  onRegenerate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSpeak?: (text: string) => void;
  onOpenSettings?: () => void;
}

function InlineRenderer({ text }: { text: string }) {
  const tokens = parseInlineMarkdown(text);
  return (
    <>
      {tokens.map((token, idx) => {
        if (token.type === 'bold') {
          return (
            <strong key={idx} className="font-semibold text-[var(--nova-text)]">
              {token.value}
            </strong>
          );
        }
        if (token.type === 'italic') {
          return (
            <em key={idx} className="italic">
              {token.value}
            </em>
          );
        }
        if (token.type === 'code') {
          return (
            <code
              key={idx}
              className="font-mono text-[0.85em] px-1.5 py-0.5 rounded-md bg-[var(--accent-soft)] text-[var(--accent)]"
            >
              {token.value}
            </code>
          );
        }
        if (token.type === 'link') {
          return (
            <a
              key={idx}
              href={token.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-[var(--accent)]/60 hover:decoration-[var(--accent)] text-[var(--accent)]"
            >
              {token.label}
            </a>
          );
        }
        return <span key={idx}>{token.value}</span>;
      })}
    </>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-300/60 dark:border-slate-700/80 bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800 bg-slate-900/90 text-xs text-slate-400">
        <span className="font-mono">{language}</span>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-xs leading-relaxed font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function BlockRenderer({ block }: { block: MarkdownBlock }): ReactNode {
  switch (block.type) {
    case 'heading': {
      const cls =
        block.level === 1
          ? 'text-lg font-semibold mt-4 mb-2'
          : block.level === 2
            ? 'text-base font-semibold mt-3.5 mb-1.5'
            : 'text-sm font-semibold mt-3 mb-1';
      return (
        <h3 className={`${cls} text-[var(--nova-text)]`}>
          <InlineRenderer text={block.text} />
        </h3>
      );
    }
    case 'code':
      return <CodeBlock language={block.language} code={block.code} />;
    case 'list': {
      const ListTag = block.ordered ? 'ol' : 'ul';
      return (
        <ListTag
          className={`my-2 space-y-1.5 pl-5 ${
            block.ordered ? 'list-decimal' : 'list-disc'
          }`}
        >
          {block.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              <InlineRenderer text={item} />
            </li>
          ))}
        </ListTag>
      );
    }
    case 'blockquote':
      return (
        <blockquote className="my-2.5 px-3.5 py-2 rounded-xl bg-slate-500/8 border border-slate-500/15 text-sm italic text-[var(--nova-text-muted)]">
          <InlineRenderer text={block.text} />
        </blockquote>
      );
    case 'table':
      return (
        <div className="my-3 overflow-x-auto rounded-xl border border-[var(--nova-border)]">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-500/10 border-b border-[var(--nova-border)]">
                {block.headers.map((h, idx) => (
                  <th key={idx} className="px-3 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="border-b last:border-b-0 border-[var(--nova-border)]"
                >
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2">
                      <InlineRenderer text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'hr':
      return <hr className="my-3 border-[var(--nova-border)]" />;
    case 'paragraph':
    default:
      return (
        <p className="my-1.5 leading-relaxed">
          <InlineRenderer text={block.text} />
        </p>
      );
  }
}

export function MessageBubble({
  message,
  activeToolName,
  onEdit,
  onRegenerate,
  onDelete,
  onSpeak,
  onOpenSettings,
}: MessageBubbleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const isUser = message.role === 'user';
  const isStreaming = message.status === 'streaming';
  const isError = message.status === 'error';
  const blocks = parseMarkdownBlocks(message.content);

  const missingKeyError =
    Boolean(message.error) &&
    (message.error!.toLowerCase().includes('api key') ||
      message.error!.toLowerCase().includes('gemini_api_key'));

  const handleSaveEdit = () => {
    if (draft.trim() && onEdit) {
      onEdit(message.id, draft.trim());
    }
    setEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`group flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
    >
      <div
        className={`max-w-[90%] md:max-w-[78%] rounded-2xl px-4 py-3 text-[15px] ${
          isUser
            ? 'nova-btn-primary shadow-sm'
            : isError
              ? 'nova-surface border-rose-500/40 text-[var(--nova-text)]'
              : 'nova-surface text-[var(--nova-text)]'
        }`}
      >
        {/* Attachments preview */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-2">
            {message.attachments.map((att) =>
              att.mimeType.startsWith('image/') && att.previewUrl ? (
                <img
                  key={att.id}
                  src={att.previewUrl}
                  alt={att.name}
                  className="max-h-48 rounded-xl object-cover border border-black/15"
                />
              ) : (
                <div
                  key={att.id}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs bg-black/15"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="truncate max-w-[180px]">{att.name}</span>
                  <span className="opacity-70">{formatFileSize(att.size)}</span>
                </div>
              )
            )}
          </div>
        )}

        {/* Tool invocations log */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-2.5 space-y-1 border-b border-[var(--nova-border)] pb-2 text-xs text-[var(--nova-text-muted)]">
            {message.toolCalls.map((tc) => (
              <div key={tc.id} className="flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                <span className="font-mono">
                  {tc.name.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Error card inside assistant bubble */}
        {isError ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-rose-500">
                  {missingKeyError
                    ? 'Gemini API Key Required'
                    : 'NOVA could not generate a reply'}
                </p>
                <p className="text-xs text-[var(--nova-text-muted)] leading-relaxed">
                  {missingKeyError
                    ? 'Add your Gemini API key in Settings > Secrets (or check connection in Settings).'
                    : message.error || 'An unexpected error occurred.'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {onRegenerate && (
                <button
                  type="button"
                  onClick={() => onRegenerate(message.id)}
                  className="min-h-[34px] px-3 rounded-xl nova-btn-primary text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              )}
              {missingKeyError && onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="min-h-[34px] px-3 rounded-xl nova-surface-elevated text-xs font-medium text-[var(--nova-text)] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Open Settings</span>
                </button>
              )}
            </div>
          </div>
        ) : editing ? (
          <div className="space-y-2 min-w-[240px]">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full rounded-xl bg-black/15 border border-black/20 px-3 py-2 text-sm text-[var(--accent-fg)] focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-2.5 py-1 text-xs rounded-lg bg-black/10 hover:bg-black/20 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 text-white font-medium cursor-pointer"
              >
                Save &amp; Resend
              </button>
            </div>
          </div>
        ) : isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed font-medium">
            {message.content}
          </p>
        ) : isStreaming && !message.content ? (
          <TypingIndicator toolName={activeToolName} />
        ) : (
          <div className="space-y-1">
            {blocks.map((block, idx) => (
              <BlockRenderer key={idx} block={block} />
            ))}
            {isStreaming && (
              <span
                className="inline-block w-1.5 h-4 ml-1 align-middle bg-[var(--accent)] animate-pulse"
                aria-hidden="true"
              />
            )}
          </div>
        )}

        {/* Grounding citations */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-[var(--nova-border)]">
            <p className="text-xs font-medium text-[var(--nova-text-muted)] mb-1.5">
              Sources
            </p>
            <div className="flex flex-col gap-1">
              {message.sources.map((src) => (
                <a
                  key={src.uri}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline truncate"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{src.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Unboxed quiet metadata + action bar */}
      <div className="mt-1.5 flex items-center gap-2 px-1 text-xs text-[var(--nova-text-muted)]">
        <span className="tabular-nums">{formatTimeShort(message.createdAt)}</span>
        {message.editedAt && (
          <>
            <span aria-hidden="true">·</span>
            <span>Edited</span>
          </>
        )}
        {!isStreaming && !isError && (
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            {!isUser && onSpeak && (
              <button
                type="button"
                onClick={() => onSpeak(message.content)}
                aria-label="Speak message"
                className="p-1 rounded-md hover:bg-slate-500/10 hover:text-[var(--nova-text)] cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            )}
            {isUser && onEdit && (
              <button
                type="button"
                onClick={() => {
                  setDraft(message.content);
                  setEditing(true);
                }}
                aria-label="Edit message"
                className="p-1 rounded-md hover:bg-slate-500/10 hover:text-[var(--nova-text)] cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {onRegenerate && (
              <button
                type="button"
                onClick={() => onRegenerate(message.id)}
                aria-label="Regenerate response"
                className="p-1 rounded-md hover:bg-slate-500/10 hover:text-[var(--nova-text)] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(message.id)}
                aria-label="Delete message"
                className="p-1 rounded-md hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
