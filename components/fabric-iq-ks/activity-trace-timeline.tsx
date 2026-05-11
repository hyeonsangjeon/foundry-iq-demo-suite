'use client'

import { motion } from 'framer-motion'
import type { Locale } from '@/lib/i18n'
import { t } from '@/lib/i18n/translations'

type Stage = {
  stage: string
  ms: number
}

type ActivityTraceTimelineProps = {
  stages: Stage[]
  totalMs: number
  locale: Locale
  /**
   * When true, stage bars fill left-to-right with stagger.
   * When false (subsequent persona toggles), segments render at full width
   * instantly (no animation re-run).
   */
  animate: boolean
}

const STAGE_BAR_COLORS: Record<string, string> = {
  modelQueryPlanning: 'bg-emerald-500',
  searchIndex: 'bg-cyan-500',
  fabricIQ: 'bg-violet-500',
  agenticReasoning: 'bg-amber-500',
  modelAnswerSynthesis: 'bg-orange-500',
}

const STAGE_TEXT_COLORS: Record<string, string> = {
  modelQueryPlanning: 'text-emerald-500',
  searchIndex: 'text-cyan-500',
  fabricIQ: 'text-violet-500',
  agenticReasoning: 'text-amber-500',
  modelAnswerSynthesis: 'text-orange-500',
}

function stageBarClass(stage: string): string {
  return STAGE_BAR_COLORS[stage] ?? 'bg-fg-muted'
}

function stageTextClass(stage: string): string {
  return STAGE_TEXT_COLORS[stage] ?? 'text-fg-muted'
}

export function ActivityTraceTimeline({ stages, totalMs, locale, animate }: ActivityTraceTimelineProps) {
  const text = t.fabricIqKs[locale].democratization
  const safeTotal = totalMs > 0 ? totalMs : Math.max(1, stages.reduce((acc, s) => acc + s.ms, 0))

  return (
    <div className="my-8">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg-muted">
        <span className="font-bold text-emerald-500">2.</span>
        {text.traceHeading}
      </h3>
      <div className="rounded-2xl border border-stroke-divider bg-bg-card p-6">
        <div
          className="flex h-8 overflow-hidden rounded-md bg-bg-elevated"
          role="img"
          aria-label={`${text.traceHeading} ${safeTotal.toLocaleString()}ms`}
        >
          {stages.map((s, i) => {
            const widthPct = (s.ms / safeTotal) * 100
            return (
              <motion.div
                key={`${s.stage}-${i}`}
                initial={animate ? { width: 0 } : false}
                animate={{ width: `${widthPct}%` }}
                transition={{
                  delay: animate ? i * 0.2 + 0.4 : 0,
                  duration: animate ? 0.5 : 0,
                  ease: 'easeOut',
                }}
                className={stageBarClass(s.stage)}
                title={`${s.stage}: ${s.ms.toLocaleString()}ms`}
              />
            )
          })}
        </div>

        <ul className="mt-4 space-y-1.5 text-sm font-mono">
          {stages.map((s, i) => (
            <li key={`${s.stage}-label-${i}`} className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-2 ${stageTextClass(s.stage)}`}>
                <span aria-hidden="true">●</span>
                <span>{s.stage}</span>
              </span>
              <span className="text-fg-muted">{s.ms.toLocaleString()}ms</span>
            </li>
          ))}
          <li className="flex items-center justify-between border-t border-stroke-divider pt-2">
            <span className="font-semibold text-fg-default">{text.totalLabel}</span>
            <span className="font-semibold text-fg-default">
              {safeTotal.toLocaleString()}ms · 200 OK
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
