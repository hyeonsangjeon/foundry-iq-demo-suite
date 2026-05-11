'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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

export function OntologyEntityPanel({ node, onClose, locale }: OntologyEntityPanelProps) {
  const text = t.fabricIqKs[locale].ontology
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

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
            className="fixed inset-0 z-40 bg-black/30"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {node && (
          <motion.aside
            key="panel"
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={
              isMobile
                ? 'fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-stroke-divider shadow-2xl rounded-t-2xl overflow-y-auto p-6 flex flex-col gap-5 max-h-[80vh]'
                : 'fixed top-0 right-0 bottom-0 z-50 w-[380px] bg-card border-l border-stroke-divider shadow-2xl overflow-y-auto p-6 flex flex-col gap-5'
            }
          >
            {/* Close button */}
            <div className="flex justify-end">
              <button
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
              <h3 className="text-xl font-bold text-fg-default">{node.id}</h3>
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
