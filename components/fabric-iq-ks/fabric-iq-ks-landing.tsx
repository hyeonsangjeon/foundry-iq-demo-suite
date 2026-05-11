'use client'

import { useEffect, useState } from 'react'
import { FabricIqHero } from './fabric-iq-hero'
import { OntologySection } from './ontology-section'
import { FederationFlowSection } from './federation-flow-section'
import { getLocale, type Locale } from '@/lib/i18n'

export function FabricIqKsLanding() {
  const [locale, setLocale] = useState<Locale>('en')
  useEffect(() => {
    setLocale(getLocale())
  }, [])

  return (
    <div className="relative min-h-screen text-fg-default">
      <FabricIqHero locale={locale} />

      <OntologySection locale={locale} />

      {/* T4 + T5 will add: <DemocratizationSection /> in the middle */}

      {/* Temporary placeholder for middle sections — replaced by T4/T5 */}
      <section className="py-16 text-center text-fg-muted text-sm">
        <p>More sections shipping in upcoming PRs.</p>
        <p className="text-xs text-fg-subtle mt-1">
          T4 (VP view) · T5 (Reveal animation)
        </p>
      </section>

      <FederationFlowSection locale={locale} />
    </div>
  )
}
