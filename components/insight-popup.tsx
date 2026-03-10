'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface InsightStep {
  id: number
  title: string
  description: string
  poweredBy: string
}

export const INSIGHT_STEPS: InsightStep[] = [
  {
    id: 1,
    title: 'Scenario Overview',
    description: 'Search the Hotels Knowledge Base using natural language. Find precise answers from 50 hotel documents.',
    poweredBy: 'Foundry IQ — Knowledge Base',
  },
  {
    id: 2,
    title: '💡 Planning',
    description: 'Foundry IQ builds a search plan. It automatically decides which sources to search and how to approach them.',
    poweredBy: 'Azure AI Search — Agentic Retrieval',
  },
  {
    id: 3,
    title: '💡 Hybrid Search',
    description: 'Runs vector search + keyword search simultaneously. Retrieves both semantically similar and exact-match documents together.',
    poweredBy: 'Azure AI Search — Hybrid Retrieval',
  },
  {
    id: 4,
    title: '💡 Self-Assessment',
    description: 'Are the search results sufficient? If not, the query is automatically rewritten and re-executed.',
    poweredBy: 'Azure AI Search — Iterative Query',
  },
  {
    id: 5,
    title: '💡 Answer with Citations',
    description: 'Every answer includes source citations. Click a citation to see the exact location in the original document.',
    poweredBy: 'Foundry IQ — Answer Synthesis',
  },
  {
    id: 6,
    title: '💡 Reasoning Effort',
    description: 'Increasing Reasoning Effort explores more sources in greater depth. Choose between speed vs. accuracy to fit the situation.',
    poweredBy: 'Azure AI Search — Configurable',
  },
  {
    id: 7,
    title: '🎉 Demo Complete',
    description: 'Foundry IQ is already Production Ready. Connect your own Knowledge Base and get started right now.',
    poweredBy: 'Foundry IQ — GA',
  },
]

interface InsightPopupProps {
  step: InsightStep | null
  totalSteps: number
  onDismiss: () => void
  onNext: () => void
  onPrev: () => void
  className?: string
}

export function InsightPopup({ step, totalSteps, onDismiss, onNext, onPrev, className }: InsightPopupProps) {
  if (!step) return null

  const isFirst = step.id === 1
  const isLast = step.id === totalSteps

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 24 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'rounded-2xl border p-5 backdrop-blur-lg',
          'bg-accent-subtle/10 border-accent-muted/30',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h4 className="text-lg font-semibold text-fg-default">{step.title}</h4>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-fg-muted">{step.id}/{totalSteps}</span>
            <button
              onClick={onDismiss}
              className="text-fg-muted hover:text-fg-default transition-colors text-sm leading-none"
              aria-label="Close insight"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-fg-muted leading-relaxed">
          {step.description}
        </p>

        {/* Powered By badge */}
        <div className="mt-4 px-3 py-2 rounded-lg bg-glass-surface border border-glass-border text-xs text-accent">
          <span className="text-accent mr-1">✦</span>
          Powered by: {step.poweredBy}
        </div>

        {/* Navigation buttons */}
        <div className="mt-4 flex items-center gap-2">
          {!isFirst && (
            <Button
              onClick={onPrev}
              variant="ghost"
              className="rounded-full h-9 text-sm px-4 text-fg-muted hover:text-fg-default"
            >
              ← Prev
            </Button>
          )}
          <div className="flex-1" />
          {isLast ? (
            <Button
              onClick={onDismiss}
              className="bg-accent hover:bg-accent-hover text-fg-on-accent rounded-full h-9 text-sm px-4"
            >
              🎉 Complete
            </Button>
          ) : (
            <Button
              onClick={onNext}
              className="bg-accent hover:bg-accent-hover text-fg-on-accent rounded-full h-9 text-sm px-4"
            >
              Got it →
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
