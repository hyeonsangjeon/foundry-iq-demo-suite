'use client'

import { motion } from 'framer-motion'
import { CheckmarkCircle20Filled } from '@fluentui/react-icons'
import { t } from '@/lib/i18n/translations'
import type { Locale } from '@/lib/i18n'

interface FabricIqHeroProps {
  locale: Locale
}

export function FabricIqHero({ locale }: FabricIqHeroProps) {
  const text = t.fabricIqKs[locale].hero

  return (
    <section className="relative min-h-[60vh] flex flex-col items-center justify-center pt-24 md:pt-28 pb-16 md:pb-20 px-6 max-w-4xl mx-auto text-center">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0, ease: [0, 0, 0.2, 1] }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 text-[11px] font-semibold tracking-wide uppercase mb-6"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
          {text.badge}
        </span>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0, 0, 0.2, 1] }}
        className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent"
      >
        {text.title}
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0, 0, 0.2, 1] }}
        className="text-base md:text-lg text-fg-muted max-w-2xl mx-auto mb-10"
      >
        {text.subtitle}
      </motion.p>

      {/* Milestone callout */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45, ease: [0, 0, 0.2, 1] }}
        className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-xs md:text-sm text-fg-muted max-w-md"
      >
        <CheckmarkCircle20Filled className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>{text.milestone}</span>
      </motion.div>
    </section>
  )
}
