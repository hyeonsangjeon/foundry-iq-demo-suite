'use client'

import { t } from '@/lib/i18n/translations'
import type { Locale } from '@/lib/i18n'

type OntologyNarrationProps = {
  locale: Locale
}

export function OntologyNarration({ locale }: OntologyNarrationProps) {
  const text = t.fabricIqKs[locale].ontology

  return (
    <div className="flex flex-col gap-4 max-w-prose">
      <h2 className="text-2xl md:text-3xl font-bold text-fg-default">
        {text.heading}
      </h2>
      <p className="text-fg-muted leading-relaxed">
        {text.body}
      </p>
      <div className="mt-4 text-sm font-medium" style={{ color: '#10b981' }}>
        {text.hint}
      </div>
    </div>
  )
}
