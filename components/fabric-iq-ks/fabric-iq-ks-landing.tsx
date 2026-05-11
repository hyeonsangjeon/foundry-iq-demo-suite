'use client'

import { useEffect, useState } from 'react'
import { FabricIqHero } from './fabric-iq-hero'
import { OntologySection } from './ontology-section'
import { DemocratizationSection } from './democratization-section'
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

      <DemocratizationSection locale={locale} />

      {/* T5 will add: reveal animation + engineer panels inside DemocratizationSection */}

      <FederationFlowSection locale={locale} />
    </div>
  )
}
