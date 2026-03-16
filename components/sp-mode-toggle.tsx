'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface SPModeToggleProps {
  isLiveMode: boolean
  isLiveAvailable: boolean
  onToggle: (live: boolean) => void
}

export function SPModeToggle({ isLiveMode, isLiveAvailable, onToggle }: SPModeToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current)
    }
  }, [])

  const handleLiveClick = () => {
    if (!isLiveAvailable) {
      setShowTooltip(true)
      if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current)
      tooltipTimeout.current = setTimeout(() => setShowTooltip(false), 2500)
      return
    }
    onToggle(true)
  }

  return (
    <div className="relative flex items-center">
      <div className="flex items-center rounded-full border border-glass-border bg-glass-surface/50 p-0.5 gap-0.5">
        {/* Simulated (Mock) */}
        <button
          onClick={() => onToggle(false)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200',
            !isLiveMode
              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
              : 'text-fg-subtle hover:text-fg-muted'
          )}
        >
          <span className={cn(
            'w-1.5 h-1.5 rounded-full',
            !isLiveMode ? 'bg-blue-500' : 'bg-fg-subtle/40'
          )} />
          <span className="hidden sm:inline">Simulated</span>
        </button>

        {/* Live */}
        <button
          onClick={handleLiveClick}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200',
            isLiveMode
              ? 'bg-green-500/20 text-green-600 dark:text-green-400'
              : isLiveAvailable
                ? 'text-fg-subtle hover:text-fg-muted'
                : 'text-fg-subtle/40 cursor-not-allowed'
          )}
        >
          <span className={cn(
            'w-1.5 h-1.5 rounded-full',
            isLiveMode ? 'bg-green-500' : 'bg-fg-subtle/30'
          )} />
          <span className="hidden sm:inline">Live</span>
        </button>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 z-50 w-52 rounded-lg border border-glass-border bg-bg-elevated p-2.5 text-[11px] text-fg-muted shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
          Coming soon — requires SharePoint tenant connection
        </div>
      )}
    </div>
  )
}
