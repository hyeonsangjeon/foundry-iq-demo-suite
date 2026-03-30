'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { Locale } from '@/lib/i18n'
import { scenarioT } from '@/data/scenario-translations'
import { CounterAnimation } from './counter-animation'

interface ScenarioSummaryProps {
  locale: Locale
}

export function ScenarioSummary({ locale }: ScenarioSummaryProps) {
  const t = scenarioT.summary[locale]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-2xl md:text-3xl font-bold text-fg-default text-center mb-10"
      >
        {t.title}
      </motion.h2>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {(t.kpis as any[]).map((kpi: any, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
            className="rounded-2xl border border-stroke-divider bg-bg-elevated/50 backdrop-blur-sm p-5 text-center"
          >
            <div className="text-xs text-fg-subtle mb-3">{kpi.label}</div>
            <div className="text-sm text-red-400 line-through mb-1">{kpi.before}</div>
            <div className="text-2xl font-bold text-emerald-400">
              <CounterAnimation target={kpi.after} duration={1200} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-wrap items-center justify-center gap-3"
      >
        {(t.ctas as any[]).map((cta: any, i: number) => (
          <Link
            key={i}
            href={cta.href}
            className={
              i === 0
                ? 'px-6 py-2.5 rounded-full bg-accent hover:bg-accent-hover text-fg-on-accent text-sm font-semibold transition-colors'
                : 'px-6 py-2.5 rounded-full border border-stroke-divider bg-white/5 hover:bg-white/10 text-sm text-fg-muted hover:text-fg-default transition-colors'
            }
          >
            {cta.label}
          </Link>
        ))}
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center text-xs text-fg-subtle mt-12 font-mono"
      >
        {scenarioT.common[locale].poweredBy}
      </motion.p>
    </div>
  )
}
