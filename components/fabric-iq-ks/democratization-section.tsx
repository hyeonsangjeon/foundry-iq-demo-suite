'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ModeToggleRow } from './mode-toggle-row'
import { QueryInput } from './query-input'
import { VpResultCard } from './vp-result-card'
import { RevealCurtain } from './reveal-curtain'
import { NlToKqlPanel } from './nl-to-kql-panel'
import { ActivityTraceTimeline } from './activity-trace-timeline'
import { RawJsonPanel } from './raw-json-panel'
import { useFabricIqQuery, type Mode } from '@/hooks/use-fabric-iq-query'
import type { Locale } from '@/lib/i18n'
import { t } from '@/lib/i18n/translations'

export function DemocratizationSection({ locale }: { locale: Locale }) {
  const [mode, setMode] = useState<Mode>('mock')
  const [persona, setPersona] = useState<'vp' | 'engineer'>('vp')
  // `revealedOnce` tracks whether the curtain animation has played already in
  // this mount. Subsequent persona toggles must not re-fire the animation —
  // per spec §3 visual state matrix.
  //
  // IMPORTANT: we deliberately do NOT flip `revealedOnce` inside the click
  // handler. React 18 batches state updates in the same render, which would
  // make `animateFirst` evaluate to `false` on the first render after the
  // click (persona='engineer' AND revealedOnce=true simultaneously) — and the
  // wow animation would silently never fire.
  //
  // We also can't flip `revealedOnce` in a useEffect immediately after the
  // first render: framer-motion uses the latest `transition` prop for
  // in-flight animations, so promoting `revealedOnce` before the curtain +
  // stagger finish would cut them mid-animation (duration → 0).
  //
  // So we promote `revealedOnce` via a timer sized to cover the orchestrated
  // animations: curtain 600 ms + last activity-trace bar delay (0.4 s + 2 *
  // 0.2 s) + duration 0.5 s ≈ 1300 ms. We use 1500 ms as a safety margin.
  // Typing animation (~200 ms delay + ~6 s for typical KQL) is self-contained
  // — flipping the gate while typing is in progress is harmless because the
  // typing component owns its own timers.
  const [revealedOnce, setRevealedOnce] = useState(false)
  const { result, runQuery } = useFabricIqQuery()
  const text = t.fabricIqKs[locale].democratization

  function handleRevealClick() {
    setPersona('engineer')
  }

  const engineerVisible = persona === 'engineer'
  const animateFirst = engineerVisible && !revealedOnce

  useEffect(() => {
    if (!engineerVisible || revealedOnce) return
    const ORCHESTRATED_ANIM_MS = 1500
    const timer = window.setTimeout(() => setRevealedOnce(true), ORCHESTRATED_ANIM_MS)
    return () => window.clearTimeout(timer)
  }, [engineerVisible, revealedOnce])

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
              dimmed={engineerVisible}
            />
          )}
        </AnimatePresence>

        {result?.query && !result.loading && !result.error && (
          <RevealCurtain isVisible={engineerVisible} animateOnFirstReveal={animateFirst}>
            <NlToKqlPanel kql={result.query.kql ?? null} locale={locale} animate={animateFirst} />
            <ActivityTraceTimeline
              stages={result.query.trace}
              totalMs={result.query.elapsedMs}
              locale={locale}
              animate={animateFirst}
            />
            <RawJsonPanel json={result.query.rawJson} locale={locale} />
            <p className="mt-12 text-center text-fg-muted italic">
              {text.closingLine}
            </p>
          </RevealCurtain>
        )}
      </div>
    </section>
  )
}
