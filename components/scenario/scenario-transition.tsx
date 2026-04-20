'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import type { Locale } from '@/lib/i18n'
import { scenarioT } from '@/data/scenario-translations'

interface TransitionProps {
  transitionNumber: 1 | 2 | 3 | 4
  locale: Locale
  onNext: () => void
}

export function ScenarioTransition({ transitionNumber, locale, onNext }: TransitionProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
        onNext()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onNext])

  if (transitionNumber === 1) return <Transition1 locale={locale} onNext={onNext} />
  if (transitionNumber === 2) return <Transition2 locale={locale} onNext={onNext} />
  if (transitionNumber === 3) return <Transition3New locale={locale} onNext={onNext} />
  return <Transition4 locale={locale} onNext={onNext} />
}

function Transition1({ locale, onNext }: { locale: Locale; onNext: () => void }) {
  const t = scenarioT.transition1[locale]
  const common = scenarioT.common[locale]
  return (
    <div onClick={onNext} className="flex flex-col items-center justify-center min-h-[60dvh] px-6 pb-20 cursor-pointer text-center">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
        <span className="text-4xl mb-4 block">⚠️</span>
        <h2 className="text-2xl md:text-3xl font-bold text-amber-400 mb-3">{t.warning}</h2>
        <p className="text-base text-fg-muted">{t.detail}</p>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 2 }}
        className="text-sm text-fg-subtle mt-8"
      >
        {common.clickToContinue} →
      </motion.p>
    </div>
  )
}

function Transition2({ locale, onNext }: { locale: Locale; onNext: () => void }) {
  const t = scenarioT.transition2[locale]
  const common = scenarioT.common[locale]
  return (
    <div onClick={onNext} className="flex flex-col items-center justify-center min-h-[60dvh] px-6 pb-20 cursor-pointer text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full rounded-2xl border border-stroke-divider bg-bg-elevated/60 backdrop-blur-sm p-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">💬</span>
          <span className="text-xs font-semibold text-fg-muted">{t.sender}</span>
        </div>
        <p className="text-base text-fg-default leading-relaxed italic">&quot;{t.message}&quot;</p>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 2 }}
        className="text-sm text-fg-subtle mt-8"
      >
        {common.clickToContinue} →
      </motion.p>
    </div>
  )
}

function Transition3New({ locale, onNext }: { locale: Locale; onNext: () => void }) {
  const t = scenarioT.transition3[locale]
  const common = scenarioT.common[locale]
  return (
    <div onClick={onNext} className="flex flex-col items-center justify-center min-h-[60dvh] px-6 pb-20 cursor-pointer">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-3xl rounded-2xl overflow-hidden border border-stroke-divider shadow-2xl"
      >
        {/* VP photo as framed image */}
        <div className="relative w-full aspect-[16/9]">
          <Image
            src="/scenario/transition3.webp"
            alt="VP requesting deeper data breakdown"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

          {/* Slack message card overlay (bottom) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="absolute bottom-5 left-5 right-5 md:left-8 md:right-8 md:bottom-7 rounded-xl border border-amber-500/40 bg-bg-elevated/85 backdrop-blur-md p-4 md:p-5 shadow-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">💬</span>
              <span className="text-xs font-semibold text-amber-400">{t.sender}</span>
            </div>
            <p className="text-sm md:text-base text-fg-default leading-relaxed italic">&ldquo;{t.message}&rdquo;</p>
          </motion.div>
        </div>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ delay: 3 }}
        className="text-sm text-fg-subtle mt-6 text-center"
      >
        {common.clickToContinue} →
      </motion.p>
    </div>
  )
}

function Transition4({ locale, onNext }: { locale: Locale; onNext: () => void }) {
  const t = scenarioT.transition4[locale]
  const common = scenarioT.common[locale]
  return (
    <div onClick={onNext} className="flex flex-col items-center justify-center min-h-[60dvh] px-6 pb-20 cursor-pointer text-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="w-3 h-3 rounded-full bg-accent" />
          <span className="w-6 h-px bg-white/20" />
          <span className="w-3 h-3 rounded-full bg-violet-500" />
          <span className="w-6 h-px bg-white/20" />
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
        </div>
        <p className="text-lg md:text-xl text-fg-default leading-relaxed max-w-lg">{t.message}</p>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 2 }}
        className="text-sm text-fg-subtle mt-8"
      >
        {common.clickToContinue} →
      </motion.p>
    </div>
  )
}
