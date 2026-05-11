'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useTypingEffect } from '@/components/scenario/typing-effect'
import type { Locale } from '@/lib/i18n'
import { t } from '@/lib/i18n/translations'

type NlToKqlPanelProps = {
  /**
   * KQL string from `sample-queries.json` (Mock mode) or Live API (T7).
   * Per Master Spec §3.3 v2 KQL fabrication policy: when this is `null`
   * the panel MUST NOT render — never fabricate KQL.
   */
  kql: string | null
  locale: Locale
  /**
   * When true, KQL types in character-by-character (first reveal). When
   * false, the full KQL is shown instantly — used for subsequent persona
   * toggles after the panel has been revealed once, so the typing
   * animation does not re-fire on re-mount (spec §3 visual state matrix
   * row "engineer + revealedOnce=true → Animation: None").
   */
  animate: boolean
}

// 35 chars/sec → 1000 / 35 ≈ 28.6 ms per character.
const TYPING_SPEED_MS = 29

export function NlToKqlPanel({ kql, locale, animate }: NlToKqlPanelProps) {
  // Conditional render per Master Spec §3.3 v2 — never fabricate.
  if (kql === null) return null

  return <NlToKqlPanelBody kql={kql} locale={locale} animate={animate} />
}

/**
 * Body captures `animate` at first render via useState and never updates it.
 *
 * Why: the public NlToKqlPanel switches between two component types
 * (Typing vs Static) based on `animate`. If we keyed that branch directly
 * off the live `animate` prop, any later prop flip would cause React to
 * unmount the typing subtree mid-stream and the user would see a hard
 * jump from partial-KQL to full-KQL.
 *
 * Concretely: when the user runs a new query while still in Engineer
 * view, the parent re-renders with the same `animate` value (the ref
 * latch in democratization-section ensures `animateFirst` stays false
 * after first reveal) but a fresh `kql` prop. Snapshotting `animate`
 * once means the same branch keeps rendering across kql changes, so
 * subsequent KQL updates are shown instantly via the Static branch
 * without re-typing. On Persona toggle to VP, RevealCurtain unmounts the
 * panel entirely via AnimatePresence exit; the re-mount on toggle back
 * captures the fresh `animate` value (false after first reveal) and
 * stays in Static.
 */
function NlToKqlPanelBody({ kql, locale, animate }: { kql: string; locale: Locale; animate: boolean }) {
  const [shouldType] = useState(animate)

  if (shouldType) {
    return <NlToKqlPanelTyping kql={kql} locale={locale} />
  }
  return <NlToKqlPanelStatic kql={kql} locale={locale} />
}

function NlToKqlPanelTyping({ kql, locale }: { kql: string; locale: Locale }) {
  const { displayedText, isComplete } = useTypingEffect(kql, TYPING_SPEED_MS, 200)
  return (
    <NlToKqlPanelLayout
      kql={kql}
      locale={locale}
      displayedText={displayedText}
      isComplete={isComplete}
    />
  )
}

function NlToKqlPanelStatic({ kql, locale }: { kql: string; locale: Locale }) {
  return (
    <NlToKqlPanelLayout
      kql={kql}
      locale={locale}
      displayedText={kql}
      isComplete
    />
  )
}

function NlToKqlPanelLayout({
  kql,
  locale,
  displayedText,
  isComplete,
}: {
  kql: string
  locale: Locale
  displayedText: string
  isComplete: boolean
}) {
  const text = t.fabricIqKs[locale].democratization
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(kql)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard requires a secure context; silently no-op when unavailable.
    }
  }

  return (
    <div className="my-8">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg-muted">
        <span className="font-bold text-emerald-500">1.</span>
        {text.nlToKqlHeading}
      </h3>
      <div className="overflow-hidden rounded-2xl border border-stroke-divider bg-bg-card">
        <div className="flex items-center justify-between border-b border-stroke-divider bg-bg-elevated px-4 py-2">
          <span className="text-xs font-mono text-fg-muted">
            {text.nlToKqlGenLabel}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!isComplete}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-fg-muted transition-colors hover:bg-bg-card hover:text-fg-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={copied ? text.copiedButton : text.copyButton}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                {text.copiedButton}
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                {text.copyButton}
              </>
            )}
          </button>
        </div>
        <pre className="overflow-x-auto p-4 text-sm font-mono leading-relaxed">
          <code className="text-emerald-400">
            {displayedText}
            {!isComplete && (
              <span className="inline-block w-0.5 translate-y-0.5 bg-emerald-400 align-text-bottom animate-pulse ml-0.5 h-[1.1em]">
                &nbsp;
              </span>
            )}
          </code>
        </pre>
      </div>
    </div>
  )
}
