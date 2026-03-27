'use client'

import { cn } from '@/lib/utils'

export type ViewMode = 'technical' | 'executive'

interface ModeToggleProps {
  mode: ViewMode
  onToggle: (mode: ViewMode) => void
}

export function ModeToggle({ mode, onToggle }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-full p-1 bg-white/5 border border-white/10">
      <button
        onClick={() => onToggle('technical')}
        className={cn(
          'px-3 py-1 rounded-full text-xs font-medium transition-all',
          mode === 'technical'
            ? 'bg-white/15 text-white'
            : 'text-white/50 hover:text-white/70'
        )}
      >
        Technical
      </button>
      <button
        onClick={() => onToggle('executive')}
        className={cn(
          'px-3 py-1 rounded-full text-xs font-medium transition-all',
          mode === 'executive'
            ? 'bg-white/15 text-white'
            : 'text-white/50 hover:text-white/70'
        )}
      >
        Executive
      </button>
    </div>
  )
}
