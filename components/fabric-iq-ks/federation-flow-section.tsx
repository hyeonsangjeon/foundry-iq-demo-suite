'use client'

import { motion } from 'framer-motion'
import {
  DataBarVertical20Regular,
  CodeBlock20Regular,
  Rocket20Regular,
} from '@fluentui/react-icons'
import { t } from '@/lib/i18n/translations'
import type { Locale } from '@/lib/i18n'
import { FederationFlowDiagram } from './federation-flow-diagram'
import { CredibilityTile } from './credibility-tile'

interface FederationFlowSectionProps {
  locale: Locale
}

// NOTE: Field Analysis link is intentionally a TODO per task spec §4.3 —
// final URL to be confirmed at PR review. Pointing to repo README for now.
const FIELD_ANALYSIS_HREF =
  'https://github.com/hyeonsangjeon/foundry-iq-demo-suite/blob/main/README.md#field-analysis'
const DEMO_PACK_HREF =
  'https://github.com/hyeonsangjeon/foundry-iq-demo-suite/tree/main/docs/handson-0423/demo-pack'
const ENROLLMENT_HREF = 'https://aka.ms/FoundryIQ-FabricIQsource'

export function FederationFlowSection({ locale }: FederationFlowSectionProps) {
  const text = t.fabricIqKs[locale].federationFlow

  return (
    <section className="py-16 md:py-24 px-6 max-w-7xl mx-auto">
      {/* Section heading */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
        className="mb-10 md:mb-14"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-fg-default tracking-tight">
          {text.heading}
        </h2>
        <p className="text-fg-muted text-sm mt-2">{text.diagramCaption}</p>
      </motion.div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-12">
        {/* Left: flow diagram */}
        <div>
          <FederationFlowDiagram locale={locale} />
        </div>

        {/* Right: credibility tiles */}
        <div className="flex flex-col gap-4">
          <CredibilityTile
            title={text.statsTitle}
            subtitle={text.statsSubtitle}
            ctaLabel={text.statsCta}
            href={FIELD_ANALYSIS_HREF}
            icon={<DataBarVertical20Regular className="w-5 h-5" />}
            delay={0}
          />
          <CredibilityTile
            title={text.demoPackTitle}
            subtitle={text.demoPackSubtitle}
            ctaLabel={text.demoPackCta}
            href={DEMO_PACK_HREF}
            icon={<CodeBlock20Regular className="w-5 h-5" />}
            delay={0.1}
          />
          <CredibilityTile
            title={text.enrollmentTitle}
            subtitle={text.enrollmentSubtitle}
            ctaLabel={text.enrollmentCta}
            href={ENROLLMENT_HREF}
            icon={<Rocket20Regular className="w-5 h-5" />}
            delay={0.2}
          />
        </div>
      </div>
    </section>
  )
}
