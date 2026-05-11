'use client'

import { useEffect, useState } from 'react'
import { FabricIqHeroPlaceholder } from './fabric-iq-hero-placeholder'
import { getLocale, type Locale } from '@/lib/i18n'

export function FabricIqKsLanding() {
  const [locale, setLocale] = useState<Locale>('en')
  useEffect(() => {
    setLocale(getLocale())
  }, [])

  return (
    <div className="relative min-h-screen text-fg-default">
      <FabricIqHeroPlaceholder locale={locale} />

      {/* T2 will add: <ArchitectureSection /> at bottom */}
      {/* T3 will add: <OntologySection /> below hero */}
      {/* T4 + T5 will add: <DemocratizationSection /> in the middle */}

      <section className="py-16 text-center text-fg-muted text-sm">
        <p>More sections shipping in upcoming PRs.</p>
        <p className="text-xs text-fg-subtle mt-1">
          T2 (Architecture) · T3 (Ontology Graph) · T4 (VP view) · T5 (Reveal animation)
        </p>
      </section>
    </div>
  )
}
