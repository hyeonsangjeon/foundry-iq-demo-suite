'use client'

import { motion } from 'framer-motion'
import { t } from '@/lib/i18n/translations'
import type { Locale } from '@/lib/i18n'

interface FabricIqHeroProps {
  locale: Locale
}

export function FabricIqHero({ locale }: FabricIqHeroProps) {
  const text = t.fabricIqKs[locale].hero
  const productTitle = t.fabricIqKs[locale].card.title

  return (
    <section className="relative mx-auto flex max-w-5xl flex-col items-center justify-center px-4 pb-4 pt-14 text-center sm:px-6 sm:pt-16 md:pb-6 md:pt-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0, ease: [0, 0, 0.2, 1] }}
        className="mb-5 flex flex-wrap items-center justify-center gap-2.5 text-[11px] font-semibold uppercase text-fg-muted"
      >
        <span>{productTitle}</span>
        <span className="h-3 w-px bg-stroke-divider" aria-hidden="true" />
        <span className="inline-flex items-center gap-1.5 text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
          {text.badge}
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0, 0, 0.2, 1] }}
        className="mb-4 max-w-4xl text-4xl font-bold leading-[1.08] tracking-normal text-fg-default md:text-5xl"
      >
        {text.title}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0, 0, 0.2, 1] }}
        className="mx-auto max-w-2xl text-base leading-7 text-fg-muted md:text-lg"
      >
        {text.subtitle}
      </motion.p>
    </section>
  )
}
