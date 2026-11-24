/*
 * Animated typing/tool-activity indicator shown while NOVA prepares a response.
 */

import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  toolName?: string | null;
}

export function TypingIndicator({ toolName }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-3 py-2 text-xs text-[var(--nova-text-muted)]">
      <div className="flex items-center gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: i * 0.16,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <span>
        {toolName
          ? `Running ${toolName.replace(/_/g, ' ')}…`
          : 'NOVA is thinking…'}
      </span>
    </div>
  );
}
