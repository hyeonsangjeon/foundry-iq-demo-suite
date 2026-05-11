'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ModeToggleRow } from './mode-toggle-row'
import { QueryInput } from './query-input'
import { VpResultCard } from './vp-result-card'
import { useFabricIqQuery, type Mode } from '@/hooks/use-fabric-iq-query'
import type { Locale } from '@/lib/i18n'
import { t } from '@/lib/i18n/translations'

export function DemocratizationSection({ locale }: { locale: Locale }) {
  const [mode, setMode] = useState<Mode>('mock')
  const [persona, setPersona] = useState<'vp' | 'engineer'>('vp')
  const { result, runQuery } = useFabricIqQuery()
  const text = t.fabricIqKs[locale].democratization

  function handleRevealClick() {
    console.log('reveal: T5 will implement')
  }

  return (
    <section className="bg-bg-subtle px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <ModeToggleRow
          mode={mode}
          onModeChange={setMode}
          persona={persona}
          onPersonaChange={setPersona}
          locale={locale}
          liveDisabled
          engineerDisabled
        />

        <QueryInput
          locale={locale}
          loading={result?.loading ?? false}
          onSuggestionClick={(queryId) => runQuery({ queryId, mode, locale })}
          onSubmit={(freeText) => runQuery({ freeText, mode, locale })}
        />

        {result?.error && (
          <div className="mt-6 rounded-xl border border-stroke-divider bg-bg-card p-4 text-sm text-fg-muted">
            {text.errorFallbackLabel} {result.error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {result?.query && !result.loading && !result.error && (
            <VpResultCard
              key={result.query.id}
              data={result.query.vpAnswer}
              elapsedMs={result.query.elapsedMs}
              locale={locale}
              onRevealClick={handleRevealClick}
            />
          )}
        </AnimatePresence>

        {/* T5 adds: <RevealCurtain> ... </RevealCurtain> below */}
      </div>
    </section>
  )
}
