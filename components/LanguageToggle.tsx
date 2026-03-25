'use client'

import * as React from 'react'
import { getLocale, setLocale, LOCALE_LABELS, type Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const LOCALES = Object.keys(LOCALE_LABELS) as Locale[]

export function LanguageToggle() {
  const [locale, setLocaleState] = React.useState<Locale>('en')
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setLocaleState(getLocale())
  }, [])

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleSelect(l: Locale) {
    setOpen(false)
    if (l !== locale) {
      setLocale(l)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1 rounded-full border border-glass-border bg-bg-card px-3 py-1.5',
          'text-xs font-medium text-fg-muted transition-colors duration-fast',
          'hover:bg-bg-elevated hover:text-fg-default',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas'
        )}
        aria-label="Select language"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="text-accent">{LOCALE_LABELS[locale]}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className={cn('transition-transform duration-fast', open && 'rotate-180')}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Language options"
          className={cn(
            'absolute right-0 z-[9999] mt-1.5 min-w-[100px] rounded-xl border border-glass-border bg-bg-card shadow-lg',
            'py-1 overflow-hidden'
          )}
        >
          {LOCALES.map((l) => (
            <button
              key={l}
              role="option"
              aria-selected={l === locale}
              onClick={() => handleSelect(l)}
              className={cn(
                'w-full px-3 py-1.5 text-left text-xs font-medium transition-colors duration-fast',
                l === locale
                  ? 'text-accent bg-accent/5'
                  : 'text-fg-muted hover:bg-bg-elevated hover:text-fg-default'
              )}
            >
              {LOCALE_LABELS[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
