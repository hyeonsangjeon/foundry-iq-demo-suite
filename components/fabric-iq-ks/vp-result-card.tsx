'use client'

import { motion } from 'framer-motion'
import { BriefcaseBusiness, ChevronDown, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/lib/i18n'
import { t } from '@/lib/i18n/translations'
import type { SampleQuery } from '@/hooks/use-fabric-iq-query'

type VpResultCardProps = {
  data: SampleQuery['vpAnswer']
  elapsedMs: number
  locale: Locale
  onRevealClick: () => void
  /**
   * When true, the VP card dims to ~70% opacity so the engineer view
   * below carries the visual weight. Used after reveal per spec §8.
   */
  dimmed?: boolean
}

export function VpResultCard({ data, elapsedMs, locale, onRevealClick, dimmed = false }: VpResultCardProps) {
  const text = t.fabricIqKs[locale].democratization
  const seconds = (elapsedMs / 1000).toFixed(1)
  const isAdvisory = 'kind' in data && data.kind === 'advisory'
  const stats = !isAdvisory && 'stats' in data ? data.stats : undefined
  const list = !isAdvisory && 'list' in data ? data.list : undefined
  const narrative = isAdvisory ? (data.narrative[locale] ?? data.narrative.en) : undefined
  const citations = isAdvisory ? data.citations : undefined

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: dimmed ? 0.7 : 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mt-8 rounded-2xl border border-stroke-divider bg-bg-card p-8 shadow-lg md:p-10"
    >
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-fg-muted">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
          </span>
          {text.vpResultLabel} · {seconds}s
        </div>
      </div>

      {isAdvisory ? (
        <div className="rounded-2xl border border-stroke-divider bg-bg-elevated p-6">
          <p className="text-base leading-relaxed text-fg-default md:text-lg">
            {narrative}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-stroke-divider bg-bg-elevated p-6">
          <p className="text-6xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
            {data.primary.value}
          </p>
          <p className="mt-3 text-lg font-semibold text-fg-default">
            {data.primary.label}
          </p>
          <p className="mt-1 text-sm text-fg-muted">
            {data.primary.unit}
          </p>
        </div>
      )}

      {citations && citations.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-fg-subtle">
            {text.citationsLabel}
          </p>
          <ul className="space-y-2">
            {citations.map((citation, index) => (
              <li
                key={`${citation.label}-${index}`}
                className="flex flex-col gap-1 rounded-xl border border-stroke-divider bg-bg-elevated p-4 text-sm sm:flex-row sm:items-baseline sm:gap-3"
              >
                <span className="font-semibold text-fg-default">{citation.label}</span>
                <span className="text-fg-muted">{citation.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {stats && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-stroke-divider bg-bg-elevated p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-fg-subtle">
                {stat.label}
              </p>
              <p className="mt-2 text-xl font-bold text-fg-default">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {list && (
        <ol className="mt-6 space-y-3">
          {list.map((item, index) => (
            <li
              key={item}
              className="flex gap-3 rounded-xl border border-stroke-divider bg-bg-elevated p-4 text-sm text-fg-default"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-500">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-6 flex items-start gap-2 rounded-xl border border-stroke-divider bg-bg-subtle p-4 text-sm text-fg-muted">
        <Database className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" aria-hidden="true" />
        <p>
          <span className="font-semibold text-fg-default">{text.sourceLabel}:</span> {data.source}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onRevealClick}
        className="mt-8 border-emerald-500/40 text-fg-default hover:border-transparent hover:bg-gradient-to-r hover:from-emerald-500 hover:to-cyan-500 hover:text-white"
      >
        {text.revealCta}
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </Button>
    </motion.div>
  )
}
