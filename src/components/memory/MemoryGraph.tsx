/*
 * Interactive animated node graph visualizing NOVA's long-term memories
 * clustered by category around the user core node.
 */

import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { MemoryCategory, MemoryItem } from '../../types';
import { truncateText } from '../../utils/formatters';

interface MemoryGraphProps {
  memories: MemoryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const CATEGORY_COLORS: Record<MemoryCategory, string> = {
  identity: '#3B82F6',
  goal: '#10B981',
  preference: '#F59E0B',
  deadline: '#EF4444',
  context: '#8B5CF6',
};

const CATEGORIES: MemoryCategory[] = [
  'identity',
  'goal',
  'preference',
  'deadline',
  'context',
];

export function MemoryGraph({
  memories,
  selectedId,
  onSelect,
}: MemoryGraphProps) {
  const [zoom, setZoom] = useState(1);

  const layout = useMemo(() => {
    const cx = 360;
    const cy = 220;

    const categoryNodes = CATEGORIES.map((cat, idx) => {
      const angle = (Math.PI * 2 * idx) / CATEGORIES.length - Math.PI / 2;
      return {
        category: cat,
        x: cx + Math.cos(angle) * 110,
        y: cy + Math.sin(angle) * 86,
        angle,
        color: CATEGORY_COLORS[cat],
      };
    });

    const catMap = new Map(categoryNodes.map((c) => [c.category, c]));
    const catCounts = new Map<MemoryCategory, number>();

    const memoryNodes = memories.map((mem) => {
      const parent = catMap.get(mem.category) ?? categoryNodes[0];
      const indexInCat = catCounts.get(mem.category) ?? 0;
      catCounts.set(mem.category, indexInCat + 1);

      const spread = (indexInCat - 1) * 0.45;
      const dist = 74 + (indexInCat % 2) * 28;
      const nodeAngle = parent.angle + spread;

      return {
        memory: mem,
        x: parent.x + Math.cos(nodeAngle) * dist,
        y: parent.y + Math.sin(nodeAngle) * dist,
        parentX: parent.x,
        parentY: parent.y,
        color: parent.color,
      };
    });

    return { cx, cy, categoryNodes, memoryNodes };
  }, [memories]);

  return (
    <div className="nova-surface rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--nova-text-muted)]">
          {CATEGORIES.map((cat) => (
            <span key={cat} className="inline-flex items-center gap-1.5 capitalize">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[cat] }}
              />
              {cat}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
            aria-label="Zoom out graph"
            className="p-2 rounded-lg hover:bg-slate-500/10 text-[var(--nova-text-muted)] cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            aria-label="Reset zoom"
            className="p-2 rounded-lg hover:bg-slate-500/10 text-[var(--nova-text-muted)] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))))}
            aria-label="Zoom in graph"
            className="p-2 rounded-lg hover:bg-slate-500/10 text-[var(--nova-text-muted)] cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative w-full h-[360px] md:h-[420px] overflow-hidden rounded-xl bg-slate-950/35 border border-[var(--nova-border)]">
        <svg
          viewBox="0 0 720 440"
          className="w-full h-full select-none"
          role="img"
          aria-label="Interactive memory node graph"
        >
          <g
            transform={`translate(${360 * (1 - zoom)}, ${220 * (1 - zoom)}) scale(${zoom})`}
          >
            {/* Core-to-category edges */}
            {layout.categoryNodes.map((cat) => (
              <line
                key={`edge-core-${cat.category}`}
                x1={layout.cx}
                y1={layout.cy}
                x2={cat.x}
                y2={cat.y}
                stroke={cat.color}
                strokeOpacity={0.28}
                strokeWidth={1.5}
              />
            ))}

            {/* Category-to-memory edges */}
            {layout.memoryNodes.map((node) => (
              <line
                key={`edge-mem-${node.memory.id}`}
                x1={node.parentX}
                y1={node.parentY}
                x2={node.x}
                y2={node.y}
                stroke={node.color}
                strokeOpacity={selectedId === node.memory.id ? 0.85 : 0.3}
                strokeWidth={selectedId === node.memory.id ? 2 : 1.2}
              />
            ))}

            {/* Central NOVA Core Node */}
            <g>
              <circle
                cx={layout.cx}
                cy={layout.cy}
                r={26}
                fill="#E86500"
                stroke="#FF8F3D"
                strokeWidth={2}
              />
              <text
                x={layout.cx}
                y={layout.cy + 4}
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="11"
                fontWeight="600"
              >
                YOU
              </text>
            </g>

            {/* Category Hub Nodes */}
            {layout.categoryNodes.map((cat) => (
              <g key={`hub-${cat.category}`}>
                <circle
                  cx={cat.x}
                  cy={cat.y}
                  r={15}
                  fill={cat.color}
                  fillOpacity={0.22}
                  stroke={cat.color}
                  strokeWidth={1.5}
                />
                <text
                  x={cat.x}
                  y={cat.y + 27}
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="10"
                  opacity={0.75}
                >
                  {cat.category}
                </text>
              </g>
            ))}

            {/* Memory Leaf Nodes */}
            {layout.memoryNodes.map((node, idx) => {
              const isSelected = selectedId === node.memory.id;
              return (
                <motion.g
                  key={node.memory.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: Math.min(0.4, idx * 0.03), type: 'spring' }}
                  onClick={() => onSelect(node.memory.id)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 13 : 9.5}
                    fill={node.color}
                    stroke="#FFFFFF"
                    strokeOpacity={isSelected ? 0.95 : 0.35}
                    strokeWidth={isSelected ? 2.5 : 1}
                  />
                  <title>{node.memory.content}</title>
                  <text
                    x={node.x}
                    y={node.y - 14}
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="9.5"
                    opacity={isSelected ? 1 : 0.72}
                  >
                    {truncateText(node.memory.content, 20)}
                  </text>
                </motion.g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
