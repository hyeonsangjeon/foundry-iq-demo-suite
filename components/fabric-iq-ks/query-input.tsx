'use client'

import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
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

export function QueryInput({ locale, onSuggestionClick, onSubmit, loading }: QueryInputProps) {
  const [value, setValue] = useState('')
  const text = t.fabricIqKs[locale].democratization

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const query = value.trim()
    if (!query || loading) return

    onSubmit(query)
    setValue('')
  }

  return (
    <div className="rounded-2xl border border-stroke-divider bg-bg-card p-5 shadow-md md:p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
        <Input
          value={value}
          disabled={loading}
          onChange={(event) => setValue(event.target.value)}
          placeholder={text.inputPlaceholder}
          className={cn(
            'h-14 flex-1 rounded-xl border-stroke-divider bg-bg-elevated text-base focus-visible:ring-emerald-500',
            loading && 'border-cyan-500/50 shadow-[0_0_0_1px_rgba(6,182,212,0.35)]'
          )}
        />
        <Button
          type="submit"
          disabled={loading || value.trim().length === 0}
          className="h-14 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-7 text-white shadow-md hover:from-emerald-400 hover:to-cyan-400"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {text.askButton}
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

      <div className="mt-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-fg-subtle">
          {text.suggestedHeading}
        </p>
        <div className="flex flex-wrap gap-2">
          {sampleQueries.queries.map((query) => (
            <button
              key={query.id}
              type="button"
              disabled={loading}
              onClick={() => onSuggestionClick(query.id)}
              className="rounded-full border border-stroke-divider bg-bg-elevated px-4 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-bg-elevated/80 hover:text-fg-default disabled:cursor-not-allowed disabled:opacity-60"
            >
              {query.nl[locale] ?? query.nl.en}
              {query.id === 'q5-list-airlines' && (
                <span className="ml-1" aria-label={text.vpFiveStar}>
                  ⭐
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
