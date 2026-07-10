'use client'

import { motion } from 'framer-motion'
import { BriefcaseBusiness, ChevronDown, Database, FileText, Link2 } from 'lucide-react'
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

type CitationSource = 'fabricIQ' | 'searchIndex'

function citationSourceOf(citation: { source?: string }): CitationSource | undefined {
  return citation.source === 'fabricIQ' || citation.source === 'searchIndex'
    ? citation.source
    : undefined
}

export function VpResultCard({ data, elapsedMs, locale, onRevealClick, dimmed = false }: VpResultCardProps) {
  const text = t.fabricIqKs[locale].democratization
  const seconds = (elapsedMs / 1000).toFixed(1)
  const isAdvisory = 'kind' in data && data.kind === 'advisory'
  const stats = !isAdvisory && 'stats' in data ? data.stats : undefined
  const list = !isAdvisory && 'list' in data ? data.list : undefined
  const narrative = isAdvisory ? (data.narrative[locale] ?? data.narrative.en) : undefined
  const citations = isAdvisory ? data.citations : undefined

  // Multi-source badge: count distinct citation source kinds (fabricIQ, searchIndex)
  const distinctSourceKinds = citations
    ? new Set(
        citations
          .map((c) => citationSourceOf(c))
          .filter((s): s is CitationSource => Boolean(s))
      )
    : new Set<CitationSource>()
  const showMultiSourceBadge = isAdvisory && distinctSourceKinds.size >= 2
  const badgeLabel = showMultiSourceBadge
    ? text.multiSourceBadge.replace('{count}', String(distinctSourceKinds.size))
    : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: dimmed ? 0.7 : 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mt-8 rounded-lg border border-stroke-divider bg-bg-card p-5 shadow-sm sm:p-6 md:p-8"
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-fg-muted">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
          </span>
          {text.vpResultLabel} · {seconds}s
        </div>
        {showMultiSourceBadge && (
          <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-fg-default sm:self-auto">
            <Link2 className="h-3.5 w-3.5 text-violet-500" aria-hidden="true" />
            {badgeLabel}
          </span>
        )}
      </div>

      {isAdvisory ? (
        <div className="border-y border-stroke-divider py-5 sm:py-6">
          <p className="text-base leading-relaxed text-fg-default md:text-lg">
            {narrative}
          </p>
        </div>
      ) : (
        <div className="border-y border-stroke-divider py-5 sm:py-6">
          <p className="text-5xl font-bold tracking-normal text-emerald-400 md:text-6xl">
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
          <p className="mb-3 text-xs font-semibold uppercase tracking-normal text-fg-subtle">
            {text.citationsLabel}
          </p>
          <ul className="divide-y divide-stroke-divider border-y border-stroke-divider">
            {citations.map((citation, index) => {
              const sourceKind = citationSourceOf(citation)
              const isFabric = sourceKind === 'fabricIQ'
              const isSearch = sourceKind === 'searchIndex'
              const Icon = isFabric ? Database : isSearch ? FileText : null
              const iconColorClass = isFabric
                ? 'text-violet-500'
                : isSearch
                  ? 'text-cyan-500'
                  : 'text-fg-subtle'
              const sourceLabel = isFabric
                ? text.sourceKindFabricIq
                : isSearch
                  ? text.sourceKindSearchIndex
                  : null

              return (
                <li
                  key={`${citation.label}-${index}`}
                  className="flex flex-col gap-1 py-3.5 text-sm sm:flex-row sm:items-baseline sm:gap-3"
                >
                  {Icon && (
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 ${iconColorClass}`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {sourceLabel && <span className="sr-only">{sourceLabel}</span>}
                    </span>
                  )}
                  <span className="font-semibold text-fg-default">{citation.label}</span>
                  <span className="text-fg-muted">{citation.detail}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {stats && (
        <div className="mt-6 grid grid-cols-1 divide-y divide-stroke-divider border-y border-stroke-divider md:grid-cols-3 md:divide-x md:divide-y-0">
          {stats.map((stat) => (
            <div key={stat.label} className="p-4">
              <p className="text-xs font-semibold uppercase tracking-normal text-fg-subtle">
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
        <ol className="mt-6 divide-y divide-stroke-divider border-y border-stroke-divider">
          {list.map((item, index) => (
            <li
              key={item}
              className="flex items-center gap-3 py-3.5 text-sm text-fg-default"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-500">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-6 flex items-start gap-2 border-t border-stroke-divider pt-4 text-sm text-fg-muted">
        <Database className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" aria-hidden="true" />
        <p>
          <span className="font-semibold text-fg-default">{text.sourceLabel}:</span> {data.source}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onRevealClick}
        className="mt-6 w-full justify-center border-emerald-500/40 text-fg-default hover:border-emerald-500 hover:bg-emerald-500 hover:text-white sm:w-auto"
      >
        {text.revealCta}
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </Button>
    </motion.div>
  )
}
