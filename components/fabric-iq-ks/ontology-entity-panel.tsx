'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { t } from '@/lib/i18n/translations'
import type { Locale } from '@/lib/i18n'
import type { OntologyNode } from './ontology-graph'

const colorMap: Record<string, string> = {
  emerald: '#10b981',
  cyan:    '#06b6d4',
  violet:  '#8b5cf6',
  amber:   '#f59e0b',
  rose:    '#f43f5e',
  orange:  '#f97316',
}

type OntologyEntityPanelProps = {
  node: OntologyNode | null
  onClose: () => void
  locale: Locale
}

const TITLE_ID = 'ontology-entity-panel-title'

export function OntologyEntityPanel({ node, onClose, locale }: OntologyEntityPanelProps) {
  const text = t.fabricIqKs[locale].ontology
  const [isMobile, setIsMobile] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  // a11y refs: panel root for focus-trap scope, close button for initial focus,
  // previouslyFocused so we can restore the trigger element on close.
  const panelRef = useRef<HTMLElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Focus management + Escape key + Tab focus-trap while panel is open.
  // The panel acts as a modal dialog visually (full backdrop, z-50) so it must
  // also behave as one for keyboard / screen-reader users.
  useEffect(() => {
    if (!node) return

    previouslyFocusedRef.current = (document.activeElement as HTMLElement | null) ?? null
    // Defer focus by a frame so the close button has mounted before we focus it.
    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus()
    }, 0)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return

      // Focus trap: cycle Tab focus within panel-only focusable elements.
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKeyDown)
      // Restore focus to the element that opened the panel (typically the SVG node).
      previouslyFocusedRef.current?.focus?.()
    }
  }, [node, onClose])

  const panelVariants = isMobile
    ? {
        initial: { y: '100%' },
        animate: { y: 0 },
        exit:    { y: '100%' },
      }
    : {
        initial: { x: '100%' },
        animate: { x: 0 },
        exit:    { x: '100%' },
      }

  // Honor prefers-reduced-motion: framer-motion's JS-driven spring is not
  // covered by the global CSS reduced-motion rule, so override per-component.
  const panelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, damping: 30, stiffness: 300 }
  const backdropTransition = prefersReducedMotion ? { duration: 0 } : undefined

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {node && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {node && (
          <motion.aside
            key="panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={TITLE_ID}
            tabIndex={-1}
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={panelTransition}
            // Inline backgroundColor + isolation wins over any ancestor glass-effect
            // override and prevents backdrop-filter bleed-through. Keep in sync with
            // the bg-card token in tailwind.config.js / globals.css.
            style={{
              backgroundColor: 'hsl(var(--color-bg-card))',
              isolation: 'isolate',
            }}
            className={
              isMobile
                ? 'fixed bottom-0 left-0 right-0 z-50 border-t border-stroke-divider shadow-2xl rounded-t-2xl overflow-y-auto p-6 flex flex-col gap-5 max-h-[80vh]'
                : 'fixed top-0 right-0 bottom-0 z-50 w-[380px] border-l border-stroke-divider shadow-2xl overflow-y-auto p-6 flex flex-col gap-5'
            }
          >
            {/* Close button */}
            <div className="flex justify-end">
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="text-fg-muted hover:text-fg-default transition-colors text-sm px-3 py-1 rounded-lg hover:bg-bg-subtle"
                aria-label={text.schemaPanelClose}
              >
                ✕
              </button>
            </div>

            {/* Entity header */}
            <div className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: colorMap[node.color] ?? '#6366f1' }}
              />
              <h3 id={TITLE_ID} className="text-xl font-bold text-fg-default">{node.id}</h3>
            </div>

            <p className="text-sm text-fg-muted -mt-3">
              {node.type === 'entity' ? text.schemaPanelEntityLabel : text.schemaPanelMetricLabel}
              {node.count !== null && (
                <> · {node.count.toLocaleString()} {text.schemaPanelRecordsLabel}</>
              )}
            </p>

            <hr className="border-stroke-divider" />

            {/* Schema */}
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-fg-default mb-2">
                {text.schemaPanelTitle} ({node.schema.length} properties)
              </p>

              {node.schema.map((field) => (
                <div key={field.name} className="py-2 border-b border-stroke-divider last:border-b-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm text-fg-default">{field.name}</span>
                    <span className="text-xs text-fg-subtle bg-bg-subtle px-2 py-0.5 rounded font-mono">
                      {field.type}
                    </span>
                  </div>
                  <p className="text-xs text-fg-subtle mt-0.5 font-mono">
                    {text.schemaPanelExampleLabel}: {String(field.example)}
                  </p>
                </div>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
