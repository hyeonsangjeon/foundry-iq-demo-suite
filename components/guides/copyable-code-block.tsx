'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CopyableCodeBlockProps {
  code: string
  language?: string
  title?: string
  className?: string
}

export function CopyableCodeBlock({
  code,
  language = 'bash',
  title,
  className,
}: CopyableCodeBlockProps) {
  const [copied, setCopied] = useState(false)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className={cn('overflow-hidden rounded-lg border border-stroke-divider bg-bg-card', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-stroke-divider bg-bg-subtle px-4 py-2">
        <div className="min-w-0">
          {title && (
            <p className="truncate text-xs font-semibold text-fg-muted">
              {title}
            </p>
          )}
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-fg-subtle">
            {language}
          </p>
        </div>
        <button
          type="button"
          onClick={copyCode}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-bg-hover hover:text-fg-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus"
          aria-label={copied ? 'Copied' : 'Copy code'}
          title={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-6 text-fg-default">
        <code>{code}</code>
      </pre>
    </div>
  )
}
