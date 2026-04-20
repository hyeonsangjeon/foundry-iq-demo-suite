'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import type { Locale } from '@/lib/i18n'
import { scenarioT } from '@/data/scenario-translations'

interface InterludeProps {
  locale: Locale
  onNext: () => void
}

const ICONS: Record<string, string> = {
  database: '🗄️',
  code: '⚙️',
  file: '📄',
  search: '🔍',
  ontology: '🕸️',
  agent: '🤖',
}

export function ScenarioInterlude({ locale, onNext }: InterludeProps) {
  const t = scenarioT.interlude[locale]
  const common = scenarioT.common[locale]

  return (
    <div className="max-w-3xl mx-auto px-4">
      {/* Background image */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-8">
        <Image
          src="/scenario/interlude-fabric.webp"
          alt="Fabric Lakehouse to Foundry IQ data pipeline"
          fill
          className="object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
      </div>

      {/* Eyebrow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400 tracking-wide uppercase mb-4"
      >
        {t.eyebrow}
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-xl md:text-2xl font-bold text-fg-default mb-2"
      >
        {t.title}
      </motion.h2>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-sm text-fg-muted leading-relaxed mb-8 max-w-xl"
      >
        {t.subtitle}
      </motion.p>

      {/* Pipeline visualization */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-8">
        {(t.pipeline as any[]).map((stage: any, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 + i * 0.15 }}
            className="relative"
          >
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 h-full">
              <div className="text-2xl mb-2">{ICONS[stage.icon] || '📦'}</div>
              <div className="text-sm font-semibold text-fg-default mb-1">{stage.label}</div>
              <div className="text-[11px] text-fg-subtle">{stage.sub}</div>
            </div>
            {/* Arrow between cards (hidden on last, hidden on mobile) */}
            {i < 3 && (
              <div className="hidden sm:block absolute top-1/2 -right-2.5 -translate-y-1/2 z-10 text-emerald-500/50 text-sm">
                →
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* ★ Ontology layer — Scene 3b 복선 */}
      {t.ontologyPipeline && (
        <>
          {/* Divider + eyebrow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-6 mb-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-cyan-500/20" />
              <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider">{t.ontologyEyebrow}</span>
              <div className="h-px flex-1 bg-cyan-500/20" />
            </div>
            <p className="text-sm text-fg-default font-semibold mb-1">{t.ontologyTitle}</p>
          </motion.div>

          {/* Ontology screenshot */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-cyan-500/20 mb-4"
          >
            <Image
              src="/scenario/interlude-ontology.webp"
              alt={t.ontologyScreenshotAlt || 'AirlineOntology'}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <p className="text-[10px] text-white/80 font-mono">
                {t.ontologyScreenshotCaption}
              </p>
            </div>
          </motion.div>

          {/* Ontology pipeline — 4 cards (cyan theme) */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
            {(t.ontologyPipeline as any[]).map((stage: any, i: number) => (
              <motion.div
                key={`onto-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.6 + i * 0.15 }}
                className="relative"
              >
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 h-full">
                  <div className="text-2xl mb-2">{ICONS[stage.icon] || '📦'}</div>
                  <div className="text-sm font-semibold text-fg-default mb-1">{stage.label}</div>
                  <div className="text-[11px] text-fg-subtle">{stage.sub}</div>
                </div>
                {i < 3 && (
                  <div className="hidden sm:block absolute top-1/2 -right-2.5 -translate-y-1/2 z-10 text-cyan-500/50 text-sm">→</div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Ontology caption */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.3 }}
            className="text-xs text-fg-muted italic mb-6"
          >
            {t.ontologyCaption}
          </motion.p>
        </>
      )}

      {/* Punchline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: t.ontologyPipeline ? 2.6 : 1.1 }}
        className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 mb-4"
      >
        <p className="text-sm text-fg-default">💡 {t.punchline}</p>
        <p className="text-[10px] text-fg-subtle font-mono mt-1">{t.techTag}</p>
      </motion.div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: t.ontologyPipeline ? 2.8 : 1.3 }}
        className="flex items-center justify-end"
      >
        <button
          onClick={onNext}
          className="px-6 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
        >
          {t.continueButton} →
        </button>
      </motion.div>
    </div>
  )
}
