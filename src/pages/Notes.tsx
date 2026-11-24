/*
 * Notes workspace supporting creating, searching, pinning, editing, and deleting notes.
 */

import { Pin, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useMemoryStore } from '../store/memoryStore';
import { formatDateShort } from '../utils/formatters';

export function NotesPage() {
  const notes = useMemoryStore((s) => s.notes);
  const addNote = useMemoryStore((s) => s.addNote);
  const updateNote = useMemoryStore((s) => s.updateNote);
  const deleteNote = useMemoryStore((s) => s.deleteNote);

  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(query.toLowerCase()) ||
      n.content.toLowerCase().includes(query.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
  );

  const openCreate = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setTagsRaw('');
    setModalOpen(true);
  };

  const openEdit = (noteId: string) => {
    const target = notes.find((n) => n.id === noteId);
    if (!target) return;
    setEditingId(target.id);
    setTitle(target.title);
    setContent(target.content);
    setTagsRaw(target.tags.join(', '));
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    const tags = tagsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingId) {
      await updateNote(editingId, {
        title: title.trim() || 'Untitled Note',
        content: content.trim(),
        tags,
      });
    } else {
      await addNote({
        title: title.trim() || 'Untitled Note',
        content: content.trim(),
        tags,
        pinned: false,
      });
    }
    setModalOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-4 md:px-8 py-6 pb-24 md:pb-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--nova-text)]">
            Notes
          </h2>
          <p className="text-sm text-[var(--nova-text-muted)]">
            Saved directly or via NOVA&apos;s note-taking tool ({notes.length} notes).
          </p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--nova-text-muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes by title, body, or tag…"
          className="w-full rounded-xl nova-surface pl-9 pr-3 py-2 text-sm text-[var(--nova-text)] placeholder:text-[var(--nova-text-muted)] nova-accent-ring"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="nova-surface rounded-2xl p-10 text-center space-y-3">
          <p className="text-sm font-medium text-[var(--nova-text)]">
            No notes found
          </p>
          <p className="text-xs text-[var(--nova-text-muted)]">
            Create a note here or ask NOVA in chat to jot something down for you.
          </p>
          <Button variant="secondary" size="sm" onClick={openCreate}>
            Create First Note
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((note) => (
            <div
              key={note.id}
              onClick={() => openEdit(note.id)}
              className="nova-surface rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-[var(--accent)] transition-colors cursor-pointer"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-[var(--nova-text)] line-clamp-1">
                    {note.title}
                  </h3>
                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        void updateNote(note.id, { pinned: !note.pinned })
                      }
                      aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        note.pinned
                          ? 'text-[var(--accent)]'
                          : 'text-[var(--nova-text-muted)] hover:text-[var(--nova-text)]'
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteNote(note.id)}
                      aria-label="Delete note"
                      className="p-1.5 rounded-lg text-[var(--nova-text-muted)] hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[var(--nova-text-muted)] whitespace-pre-wrap line-clamp-5 leading-relaxed">
                  {note.content}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--nova-text-muted)] pt-2 border-t border-[var(--nova-border)]">
                <span>{formatDateShort(note.updatedAt)}</span>
                {note.tags.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{note.tags.join(' / ')}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Note' : 'New Note'}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--nova-text-muted)]">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
              className="w-full rounded-xl nova-surface px-3 py-2 text-sm text-[var(--nova-text)] nova-accent-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--nova-text-muted)]">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Write your note…"
              className="w-full rounded-xl nova-surface px-3 py-2 text-sm text-[var(--nova-text)] nova-accent-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--nova-text-muted)]">
              Tags (comma separated)
            </label>
            <input
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="work, ideas, architecture"
              className="w-full rounded-xl nova-surface px-3 py-2 text-sm text-[var(--nova-text)] nova-accent-ring"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void handleSave()}>
              Save Note
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
