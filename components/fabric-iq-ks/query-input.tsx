'use client'

import { useState, type FormEvent } from 'react'
import {
  Clock3,
  Database,
  Loader2,
  Network,
  Search,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import ontologyGraph from '@/data/fabric-iq-ks/ontology-graph.json'
import sampleQueries from '@/data/fabric-iq-ks/sample-queries.json'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Locale } from '@/lib/i18n'
import { t } from '@/lib/i18n/translations'

type QueryInputProps = {
  locale: Locale
  onSuggestionClick: (queryId: string) => void
  onSubmit: (freeText: string) => void
  loading: boolean
}

const SEMANTIC_JOIN_QUERY_ID = 'q6-semantic-join-dot-compensation'
const FIRST_TRACE_QUERY_ID = 'q5-list-airlines'

function formatCompactCount(value: number | null | undefined) {
  if (typeof value !== 'number') return '0'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  return value.toLocaleString('en-US')
}

function formatSeconds(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`
}

export function QueryInput({ locale, onSuggestionClick, onSubmit, loading }: QueryInputProps) {
  const [value, setValue] = useState('')
  const text = t.fabricIqKs[locale].democratization
  const flightCount = ontologyGraph.nodes.find((node) => node.id === 'Flight')?.count
  const airlineCount = ontologyGraph.nodes.find((node) => node.id === 'Airline')?.count
  const profileStats: Array<{
    label: string
    value: string
    icon: LucideIcon
    tone: string
  }> = [
    {
      label: text.profileStatFlights,
      value: formatCompactCount(flightCount),
      icon: Database,
      tone: 'text-cyan-400',
    },
    {
      label: text.profileStatAirlines,
      value: formatCompactCount(airlineCount),
      icon: Sparkles,
      tone: 'text-emerald-400',
    },
    {
      label: text.profileStatRelations,
      value: String(ontologyGraph.links.length),
      icon: Network,
      tone: 'text-violet-400',
    },
    {
      label: text.profileStatPresets,
      value: String(sampleQueries.queries.length),
      icon: Search,
      tone: 'text-amber-400',
    },
  ]

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const query = value.trim()
    if (!query || loading) return

    onSubmit(query)
    setValue('')
  }

  return (
    <div className="border-b border-stroke-divider pb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" aria-hidden="true" />
          {text.queryPanelBadge}
        </span>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-4">
        {profileStats.map((stat) => {
          const Icon = stat.icon

          return (
            <div
              key={stat.label}
              className="rounded-xl border border-stroke-divider bg-bg-card p-3 shadow-xs"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <Icon className={cn('h-3.5 w-3.5', stat.tone)} aria-hidden="true" />
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-fg-subtle">
                  IQ
                </span>
              </div>
              <div className="font-mono text-xl font-bold text-fg-default">
                {stat.value}
              </div>
              <div className="mt-0.5 text-xs text-fg-muted">
                {stat.label}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mb-4 border-b border-stroke-divider">
        <div className="flex gap-1">
          <span className="border-b-2 border-cyan-400 px-3 py-2 text-sm font-semibold text-cyan-300">
            {text.askTabLabel}
          </span>
          <span className="border-b-2 border-transparent px-3 py-2 text-sm font-semibold text-fg-muted">
            {text.presetsTabLabel}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-[1fr_auto] gap-2">
        <Input
          value={value}
          disabled={loading}
          onChange={(event) => setValue(event.target.value)}
          placeholder={text.inputPlaceholder}
          className={cn(
            'h-10 rounded-lg border-stroke-divider bg-bg-canvas px-3 text-sm focus-visible:ring-cyan-500',
            loading && 'border-cyan-500/50 shadow-[0_0_0_1px_rgba(6,182,212,0.35)]'
          )}
        />
        <Button
          type="submit"
          aria-label={text.askButton}
          disabled={loading || value.trim().length === 0}
          className="h-10 rounded-lg bg-cyan-500 px-3 text-white shadow-sm hover:bg-cyan-400 sm:px-4"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">{text.askButton}</span>
        </Button>
      </form>

      {loading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-fg-muted" role="status">
          <span className="flex gap-1" aria-hidden="true">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-500 [animation-delay:120ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 [animation-delay:240ms]" />
          </span>
          {text.loadingLabel}
        </div>
      )}

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-fg-subtle">
          {text.suggestedHeading}
        </p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {sampleQueries.queries.map((query, index) => {
            const isSemanticJoin = query.id === SEMANTIC_JOIN_QUERY_ID
            const isFirstTrace = query.id === FIRST_TRACE_QUERY_ID
            const SourceIcon = isSemanticJoin ? Network : Database

            return (
              <button
                key={query.id}
                type="button"
                disabled={loading}
                onClick={() => onSuggestionClick(query.id)}
                className={cn(
                  'group flex min-h-[96px] flex-col justify-between rounded-xl border border-stroke-divider bg-bg-card p-3 text-left transition-all hover:border-cyan-400/50 hover:bg-bg-elevated hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60',
                  isSemanticJoin && 'border-violet-500/30 bg-violet-500/5 hover:border-violet-400/60'
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      isSemanticJoin
                        ? 'bg-violet-500/15 text-violet-300'
                        : 'bg-cyan-500/10 text-cyan-300'
                    )}
                  >
                    <SourceIcon className="h-3 w-3" aria-hidden="true" />
                    {isSemanticJoin ? text.semanticJoinShortLabel : text.sourceKindFabricIq}
                  </span>
                  <span className="font-mono text-[10px] text-fg-subtle">
                    Q{index + 1}
                  </span>
                </span>

                <span className="mt-2 line-clamp-3 text-xs font-semibold leading-snug text-fg-default">
                  {query.nl[locale] ?? query.nl.en}
                </span>

                <span className="mt-2 flex items-center justify-between gap-2 text-[10px] text-fg-subtle">
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <Clock3 className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {formatSeconds(query.elapsedMs)} {text.presetReplayLabel}
                    </span>
                  </span>
                  {isFirstTrace && (
                    <Sparkles
                      className="h-3.5 w-3.5 shrink-0 text-amber-300"
                      aria-label={text.vpFiveStar}
                    />
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
