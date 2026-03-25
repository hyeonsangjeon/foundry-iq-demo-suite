'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getLocale } from '@/lib/i18n'
import { t } from '@/lib/i18n/translations'

export interface InsightStep {
  id: number
  title: string
  description: string
  poweredBy: string
}

export function getFoundryInsightSteps(): InsightStep[] {
  const locale = getLocale()
  const steps = t.foundryInsight[locale]?.steps ?? t.foundryInsight.en.steps
  return steps.map((s, i) => ({ id: i + 1, ...s }))
}

// Legacy export for SSR compatibility — falls back to English
export const INSIGHT_STEPS: InsightStep[] = t.foundryInsight.en.steps.map((s, i) => ({ id: i + 1, ...s }))

interface InsightPopupProps {
  step: InsightStep | null
  totalSteps: number
  onDismiss: () => void
  onNext: () => void
  onPrev: () => void
  className?: string
  insightType?: 'foundry' | 'sp'
}

export function InsightPopup({ step, totalSteps, onDismiss, onNext, onPrev, className, insightType = 'foundry' }: InsightPopupProps) {
  if (!step) return null

  const isFirst = step.id === 1
  const isLast = step.id === totalSteps
  const locale = getLocale()
  const navText = insightType === 'sp'
    ? (t.spInsight[locale] ?? t.spInsight.en)
    : (t.foundryInsight[locale] ?? t.foundryInsight.en)

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
              {navText.prev}
            </Button>
          )}
          <div className="flex-1" />
          {isLast ? (
            <Button
              onClick={onDismiss}
              className="bg-accent hover:bg-accent-hover text-fg-on-accent rounded-full h-9 text-sm px-4"
            >
              {navText.complete}
            </Button>
          ) : (
            <Button
              onClick={onNext}
              className="bg-accent hover:bg-accent-hover text-fg-on-accent rounded-full h-9 text-sm px-4"
            >
              {navText.next}
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
