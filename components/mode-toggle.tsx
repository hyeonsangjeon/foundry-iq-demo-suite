'use client'

import { cn } from '@/lib/utils'
import type { Locale } from '@/lib/i18n'
import { scenarioT } from '@/data/scenario-translations'

export type ViewMode = 'technical' | 'executive'

interface ModeToggleProps {
  mode: ViewMode
  onToggle: (mode: ViewMode) => void
  locale?: Locale
}

export function ModeToggle({ mode, onToggle, locale = 'en' }: ModeToggleProps) {
  const common = scenarioT.common[locale]
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
        {common.technical}
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
        {common.executive}
      </button>
    </div>
  )
}
