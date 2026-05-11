'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import type { Locale } from '@/lib/i18n'
import { t } from '@/lib/i18n/translations'

type RawJsonPanelProps = {
  /** Pretty-printed JSON string. Rendered as text — never as HTML. */
  json: string
  locale: Locale
}

export function RawJsonPanel({ json, locale }: RawJsonPanelProps) {
  const text = t.fabricIqKs[locale].democratization
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard requires a secure context; silently no-op when unavailable.
    }
  }

  return (
    <div className="my-8">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg-muted">
        <span className="font-bold text-emerald-500">3.</span>
        {text.rawJsonHeading}
      </h3>
      <div className="overflow-hidden rounded-2xl border border-stroke-divider bg-bg-card">
        <div className="flex items-center justify-between border-b border-stroke-divider bg-bg-elevated px-4 py-2">
          <span className="text-xs font-mono text-fg-muted">application/json</span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-fg-muted transition-colors hover:bg-bg-card hover:text-fg-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus"
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
        <pre className="max-h-80 overflow-x-auto overflow-y-auto p-4 text-sm font-mono leading-relaxed text-fg-default">
          <code>{json}</code>
        </pre>
      </div>
    </div>
  )
}
