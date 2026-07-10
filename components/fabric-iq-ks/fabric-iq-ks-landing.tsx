'use client'

import { useEffect, useState } from 'react'
import { LiveKnowledgeSourcesReference } from '@/components/live-knowledge-sources-reference'
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

      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <LiveKnowledgeSourcesReference locale={locale} focus="fabric" />
      </div>

      <OntologySection locale={locale} />

      <DemocratizationSection locale={locale} />

      {/* T5 will add: reveal animation + engineer panels inside DemocratizationSection */}

      <FederationFlowSection locale={locale} />
    </div>
  )
}
