'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { Locale } from '@/lib/i18n'
import { t } from '@/lib/i18n/translations'
import type { Mode } from '@/hooks/use-fabric-iq-query'

type Persona = 'vp' | 'engineer'

type ModeToggleRowProps = {
  mode: Mode
  onModeChange: (m: Mode) => void
  persona: Persona
  onPersonaChange: (p: Persona) => void
  locale: Locale
  liveDisabled?: boolean
  engineerDisabled?: boolean
  /**
   * Fires when the user attempts to interact with the disabled Live toggle
   * (click on the dimmed Live segment). Parent typically surfaces a toast
   * explaining the sign-in requirement. No-op if not provided.
   */
  onLiveBlocked?: () => void
  /**
   * Fires when the user clicks the "Sign in to enable Live" CTA. Parent
   * surfaces the placeholder modal/toast. Hidden if not provided.
   */
  onSignInClick?: () => void
}

export function ModeToggleRow({
  mode,
  onModeChange,
  persona,
  onPersonaChange,
  locale,
  liveDisabled = false,
  engineerDisabled = false,
  onLiveBlocked,
  onSignInClick,
}: ModeToggleRowProps) {
  const text = t.fabricIqKs[locale].democratization

  return (
    <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-500">
          Section 3
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-fg-default md:text-4xl">
          {text.sectionHeading}
        </h2>
        <p className="mt-3 text-sm text-fg-muted md:text-base">
          {text.sectionSubheading}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row md:flex-col md:items-end">
        <SegmentedControl label={text.modeLabel}>
          <ToggleButton
            active={mode === 'mock'}
            onClick={() => onModeChange('mock')}
          >
            {text.modeMock}
          </ToggleButton>
          <ToggleButton
            active={mode === 'live'}
            disabled={liveDisabled}
            // The native `title` attribute provides keyboard-friendly + screen-reader-friendly
            // tooltip. The visual hover tooltip is rendered by SegmentedControl's group below.
            title={liveDisabled ? text.liveDisabledTooltip : undefined}
            onClick={() => {
              if (liveDisabled) {
                onLiveBlocked?.()
                return
              }
              onModeChange('live')
            }}
          >
            {text.modeLive}
          </ToggleButton>
        </SegmentedControl>

        {liveDisabled && (mode === 'mock') && (
          <div className="flex flex-col items-start gap-1 sm:items-end md:items-end">
            <p className="text-[11px] text-fg-subtle">
              {text.mockVerifiedCaption}
            </p>
            {onSignInClick && (
              <button
                type="button"
                onClick={onSignInClick}
                className="text-xs font-medium text-emerald-500 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
              >
                {text.signInCta}
              </button>
            )}
          </div>
        )}

        <SegmentedControl label={text.personaLabel}>
          <ToggleButton
            active={persona === 'vp'}
            onClick={() => onPersonaChange('vp')}
          >
            {text.personaVp}
          </ToggleButton>
          <ToggleButton
            active={persona === 'engineer'}
            disabled={engineerDisabled}
            title={engineerDisabled ? text.personaEngineerTooltipDisabled : undefined}
            onClick={() => onPersonaChange('engineer')}
          >
            {text.personaEngineer}
          </ToggleButton>
        </SegmentedControl>
      </div>
    </div>
  )
}

function SegmentedControl({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-stroke-divider bg-bg-card p-2 shadow-xs">
      <span className="pl-2 text-xs font-semibold uppercase tracking-[0.12em] text-fg-subtle">
        {label}
      </span>
      <div className="flex rounded-xl bg-bg-subtle p-1">
        {children}
      </div>
    </div>
  )
}

function ToggleButton({
  active,
  disabled,
  title,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  title?: string
  onClick: () => void
  children: ReactNode
}) {
  // We use `aria-disabled` (not native `disabled`) so the click event still
  // reaches the parent's onClick handler. The handler can then decide to
  // either swallow the click silently (default) or surface an explainer
  // (T7-Mock Live toggle → `onLiveBlocked` toast).
  return (
    <button
      type="button"
      aria-disabled={disabled || undefined}
      title={title}
      onClick={(e) => {
        if (disabled) {
          e.preventDefault()
          // Still call onClick so the parent can fire a side effect
          // (e.g. a toast) — the parent is responsible for NOT mutating
          // state when disabled.
        }
        onClick()
      }}
      className={cn(
        'h-8 rounded-lg px-3 text-xs font-semibold transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas',
        active
          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-sm'
          : 'text-fg-muted hover:bg-bg-card hover:text-fg-default',
        disabled && 'cursor-not-allowed opacity-45 hover:bg-transparent hover:text-fg-muted'
      )}
    >
      {children}
    </button>
  )
}
