'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import type { Locale } from '@/lib/i18n'
import { scenarioT } from '@/data/scenario-translations'
import { CounterAnimation } from './counter-animation'

interface ScenarioIntroProps {
  locale: Locale
  onNext: () => void
}

export function ScenarioIntro({ locale, onNext }: ScenarioIntroProps) {
  const t = scenarioT.intro[locale]

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-8 text-center overflow-y-auto">
      {/* Hero background image */}
      <div className="relative w-full max-w-2xl aspect-video rounded-2xl overflow-hidden mb-8">
        <Image
          src="/scenario/intro-dashboard..webp"
          alt="SkyLine Airlines Customer Service Portal"
          fill
          className="object-cover opacity-90"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
      </div>

      {/* Airline badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-fg-muted">
          <span className="w-2 h-2 rounded-full bg-accent" />
          {t.airline}
        </div>
      </motion.div>

      {/* Portal title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-2xl md:text-3xl font-bold text-fg-default mb-2"
      >
        {t.portalTitle}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-sm text-fg-muted mb-10"
      >
        {t.role}
      </motion.p>

      {/* Pain metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-xl w-full"
      >
        {(t.painMetrics as any[]).map((m: any, i: number) => (
          <div
            key={i}
            className="rounded-2xl border border-stroke-divider bg-bg-elevated/50 backdrop-blur-sm p-5"
          >
            <div className="text-3xl font-bold text-fg-default mb-1">
              <CounterAnimation target={`${m.value}${m.unit}`} />
            </div>
            <div className="text-xs text-fg-muted">{m.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Hook line */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="text-lg text-fg-muted italic mb-8"
      >
        {t.hook}
      </motion.p>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.5 }}
        onClick={onNext}
        className="px-8 py-3 rounded-full bg-accent hover:bg-accent-hover text-fg-on-accent font-semibold text-sm transition-colors"
      >
        {t.startButton} →
      </motion.button>
    </div>
  )
}
