/*
 * Individual memory card supporting inline editing, category reassignment, and deletion.
 */

import { Check, Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { MemoryCategory, MemoryItem } from '../../types';
import { formatDateShort } from '../../utils/formatters';

interface MemoryCardProps {
  memory: MemoryItem;
  selected?: boolean;
  onSelect?: () => void;
  onUpdate: (id: string, patch: Partial<MemoryItem>) => void;
  onDelete: (id: string) => void;
}

const CATEGORIES: MemoryCategory[] = [
  'identity',
  'goal',
  'preference',
  'deadline',
  'context',
];

export function MemoryCard({
  memory,
  selected,
  onSelect,
  onUpdate,
  onDelete,
}: MemoryCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(memory.content);
  const [category, setCategory] = useState<MemoryCategory>(memory.category);

  const handleSave = () => {
    if (!draft.trim()) return;
    onUpdate(memory.id, { content: draft.trim(), category });
    setEditing(false);
  };

  return (
    <div
      onClick={onSelect}
      style={
        selected
          ? {
              borderColor: 'var(--accent)',
              boxShadow: '0 0 0 1px var(--accent-glow)',
            }
          : undefined
      }
      className={`nova-surface rounded-2xl p-4 transition-colors ${
        onSelect ? 'cursor-pointer' : ''
      }`}
    >
      {editing ? (
        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            className="w-full rounded-xl nova-surface-elevated px-3 py-2 text-sm text-[var(--nova-text)] nova-accent-ring"
          />
          <div className="flex items-center justify-between gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MemoryCategory)}
              className="rounded-lg nova-surface-elevated px-2.5 py-1.5 text-xs capitalize text-[var(--nova-text)]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  {c}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setEditing(false)}
                aria-label="Cancel edit"
                className="p-1.5 rounded-lg hover:bg-slate-500/10 text-[var(--nova-text-muted)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleSave}
                aria-label="Save memory"
                className="p-1.5 rounded-lg nova-btn-primary cursor-pointer"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <p className="text-sm font-medium text-[var(--nova-text)] leading-relaxed">
              {memory.content}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--nova-text-muted)]">
              <span className="capitalize">{memory.category}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {Math.round(memory.confidence * 100)}% confidence
              </span>
              <span aria-hidden="true">·</span>
              <span>{formatDateShort(memory.updatedAt)}</span>
            </div>
          </div>
          <div
            className="flex items-center gap-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setDraft(memory.content);
                setCategory(memory.category);
                setEditing(true);
              }}
              aria-label="Edit memory"
              className="p-2 rounded-lg text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:bg-slate-500/10 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(memory.id)}
              aria-label="Delete memory"
              className="p-2 rounded-lg text-[var(--nova-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
