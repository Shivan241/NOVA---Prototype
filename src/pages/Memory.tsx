/*
 * Long-term Memory page displaying the interactive MemoryGraph,
 * searchable/filterable memory cards, and manual memory creation.
 */

import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { MemoryCard } from '../components/memory/MemoryCard';
import { MemoryGraph } from '../components/memory/MemoryGraph';
import { useMemory } from '../hooks/useMemory';
import type { MemoryCategory } from '../types';

const CATEGORIES: Array<'all' | MemoryCategory> = [
  'all',
  'identity',
  'goal',
  'preference',
  'deadline',
  'context',
];

export function MemoryPage() {
  const { memories, createManualMemory, updateMemory, deleteMemory } =
    useMemory();

  const [query, setQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | MemoryCategory>(
    'all'
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('goal');

  const filtered = memories.filter((m) => {
    const matchesCat =
      filterCategory === 'all' || m.category === filterCategory;
    const matchesQuery = m.content.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    const created = await createManualMemory(newContent.trim(), newCategory);
    setSelectedId(created.id);
    setNewContent('');
    setAddModalOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-4 md:px-8 py-6 pb-24 md:pb-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--nova-text)]">
            Long-Term Memory Graph
          </h2>
          <p className="text-sm text-[var(--nova-text-muted)]">
            Facts NOVA remembers across conversations ({memories.length} stored).
          </p>
        </div>
        <Button variant="primary" onClick={() => setAddModalOpen(true)}>
          <Plus className="w-4 h-4" />
          <span>Add Memory</span>
        </Button>
      </div>

      {/* Interactive Node Graph */}
      <MemoryGraph
        memories={memories}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(id)}
      />

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--nova-text-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stored memories…"
            className="w-full rounded-xl nova-surface pl-9 pr-3 py-2 text-sm text-[var(--nova-text)] placeholder:text-[var(--nova-text-muted)] nova-accent-ring"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 nova-surface rounded-xl">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                filterCategory === cat
                  ? 'nova-btn-primary'
                  : 'text-[var(--nova-text-muted)] hover:text-[var(--nova-text)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Memory Cards List */}
      {filtered.length === 0 ? (
        <div className="nova-surface rounded-2xl p-8 text-center space-y-2">
          <p className="text-sm font-medium text-[var(--nova-text)]">
            No memories match your view yet
          </p>
          <p className="text-xs text-[var(--nova-text-muted)]">
            Chat naturally with NOVA about your goals, preferences, or deadlines, or add one manually.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((mem) => (
            <MemoryCard
              key={mem.id}
              memory={mem}
              selected={selectedId === mem.id}
              onSelect={() => setSelectedId(mem.id)}
              onUpdate={(id, patch) => void updateMemory(id, patch)}
              onDelete={(id) => void deleteMemory(id)}
            />
          ))}
        </div>
      )}

      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Long-Term Memory"
        description="Save a personal detail, preference, goal, or deadline for NOVA to remember."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--nova-text-muted)]">
              Category
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
              className="w-full rounded-xl nova-surface px-3 py-2 text-sm text-[var(--nova-text)] capitalize"
            >
              {(['identity', 'goal', 'preference', 'deadline', 'context'] as MemoryCategory[]).map(
                (cat) => (
                  <option key={cat} value={cat} className="bg-slate-900 text-white">
                    {cat}
                  </option>
                )
              )}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--nova-text-muted)]">
              Memory Fact
            </label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              placeholder="e.g. Preparing for a TypeScript systems design interview next month."
              className="w-full rounded-xl nova-surface px-3 py-2 text-sm text-[var(--nova-text)] nova-accent-ring"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void handleAdd()}>
              Save Memory
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
