'use client'

import { useEffect, useRef, useState } from 'react'
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
  // Spec §3 calls this `revealedOnce`. We implement the latch as a ref —
  // not state — so it satisfies three constraints simultaneously:
  //
  //   (a) Stable within the same render where the click handler flips
  //       persona to 'engineer'. React 18 batches setState calls in the
  //       same handler tick, so deriving `animateFirst` from a state
  //       flag set in `handleRevealClick` would evaluate to `false` on
  //       Render 1 (persona='engineer' AND revealedOnce=true together)
  //       and silently suppress the wow animation.
  //
  //   (b) Mutating the ref does NOT trigger a re-render that flips
  //       framer-motion `transition.duration` to 0 mid-animation. The
  //       ref is set in a useEffect after Render 1 commits; the
  //       subsequent re-renders that read `animateFirst=false` pass an
  //       unchanged `animate` prop to motion components, so in-flight
  //       animations are not interrupted.
  //
  //   (c) Once latched, stays latched until unmount / page refresh —
  //       even if the user quickly toggles back to VP before the
  //       orchestrated animations finish. Spec §3 visual state matrix +
  //       §10 acceptance #8 require "once per session" REGARDLESS of
  //       interim toggles. A previous timer-based implementation
  //       cancelled the promotion on `engineerVisible=false`, which
  //       caused the curtain + stagger to replay on toggle-back —
  //       reviewer flagged this as a Block.
  const hasPlayedRevealRef = useRef(false)
  const { result, runQuery } = useFabricIqQuery()
  const text = t.fabricIqKs[locale].democratization

  function handleRevealClick() {
    setPersona('engineer')
  }

  const engineerVisible = persona === 'engineer'
  const animateFirst = engineerVisible && !hasPlayedRevealRef.current

  useEffect(() => {
    if (engineerVisible && !hasPlayedRevealRef.current) {
      hasPlayedRevealRef.current = true
    }
  }, [engineerVisible])

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
