'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import type { Locale } from '@/lib/i18n'
import { scenarioT } from '@/data/scenario-translations'
import { TypingText } from './typing-effect'
import { cn } from '@/lib/utils'

interface Scene3bProps {
  locale: Locale
  onNext: () => void
  onPrev: () => void
}

export function ScenarioScene3b({ locale, onNext, onPrev }: Scene3bProps) {
  const t = scenarioT.scene3b[locale]
  const common = scenarioT.common[locale]
  const [answerDone, setAnswerDone] = useState(false)

  // Note: arrow-key navigation is handled globally in app/scenario/page.tsx

  return (
    <div className="max-w-4xl mx-auto px-4">

      {/* Header + ★★ Killer badge */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 mb-4">
        <span className="text-xs font-mono text-cyan-400">{t.sceneLabel}</span>
        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-400">
          {t.starLabel}
        </span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-xl md:text-2xl font-bold text-fg-default mb-6"
      >
        {t.title}
      </motion.h2>

      {/* VP Question Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 mb-6"
      >
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="text-lg shrink-0">📊</span>
          <p className="text-sm text-fg-muted italic">&quot;{t.vpQuery}&quot;</p>
        </div>
      </motion.div>

      {/* Before / After 2-panel — 이미지와 텍스트 수직 분리 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

        {/* ❌ Before Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-xl border border-red-500/30 overflow-hidden"
        >
          {/* Image zone */}
          <div className="relative w-full aspect-video">
            <Image
              src="/scenario/scene3b_before.webp"
              alt={t.beforeImageAlt || 'Pre-aggregated workflow'}
              fill
              className="object-cover"
            />
          </div>

          {/* Text zone */}
          <div className="p-5 bg-bg-elevated/50">
            <div className="flex items-center gap-2 mb-3">
              <span aria-hidden="true" className="text-red-400 text-xl">❌</span>
              <span className="text-sm font-semibold text-red-400">{t.beforeTitle}</span>
            </div>

            <p className="text-sm text-fg-default mb-3">{t.beforeMessage}</p>

            {/* 조건 태그 — "왜 불가능한지" 시각화 */}
            <ul
              role="list"
              aria-label={t.conditionsLabel || 'Required conditions'}
              className="flex flex-wrap gap-1.5 mb-3 list-none p-0"
            >
              {(t.impossibleDetail as string)
                // Strip locale-specific prefix before the first ':' or '：' (full-width colon)
                .split(/[:：]/)
                .slice(-1)[0]
                .split(/[×·,]/)
                .map((tag: string) => tag.trim())
                .filter((tag: string) => tag.length > 0)
                .map((tag: string, i: number) => (
                  <li
                    key={i}
                    className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 whitespace-nowrap"
                  >
                    {tag}
                  </li>
                ))}
            </ul>

            <div className="text-xs font-semibold text-red-400 font-mono">
              <span aria-hidden="true">⏱️</span> {t.beforeTime}
            </div>
          </div>
        </motion.div>

        {/* ✅ After Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="rounded-xl border border-cyan-500/30 overflow-hidden"
        >
          {/* Image zone */}
          <div className="relative w-full aspect-video">
            <Image
              src="/scenario/scene3b_after.webp"
              alt={t.afterImageAlt || 'Foundry IQ + Fabric IQ Semantic JOIN'}
              fill
              className="object-cover"
            />
          </div>

          {/* Text zone */}
          <div className="p-5 bg-bg-elevated/50">
            <div className="flex items-center gap-2 mb-3">
              <span aria-hidden="true" className="text-cyan-400 text-xl">✅</span>
              <span className="text-sm font-semibold text-cyan-400">{t.afterTitle}</span>
            </div>

            {/* Typing animation answer */}
            <div className="text-sm text-fg-default leading-relaxed mb-3 min-h-[80px]">
              <TypingText text={t.answer} speed={15} startDelay={1000} onComplete={() => setAnswerDone(true)} />
            </div>

            {/* Citations */}
            {answerDone && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5 mb-3">
                {(t.citations as any[]).map((c: any) => (
                  <div key={c.index} className="flex items-center gap-2 text-xs">
                    <span className={cn(
                      'w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold',
                      c.type === 'NL→SQL' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-violet-500/20 text-violet-400'
                    )}>
                      {c.index}
                    </span>
                    <span className="text-fg-muted">{c.source}</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-fg-subtle">{c.origin}</span>
                    {c.desc && <span className="text-[10px] text-fg-subtle">({c.desc})</span>}
                  </div>
                ))}
              </motion.div>
            )}

            <div className="text-xs font-semibold text-cyan-400 font-mono">
              <span aria-hidden="true">⚡</span> {t.afterTime}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Insight */}
      {answerDone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4 mb-6"
        >
          <p className="text-sm text-fg-default"><span aria-hidden="true">💡</span> {t.insight}</p>
          <p className="text-[10px] text-fg-subtle font-mono mt-1">{t.techTag}</p>
        </motion.div>
      )}

      {/* Nav */}
      <div className="flex items-center justify-between">
        <button onClick={onPrev} className="px-4 py-2 rounded-full text-xs text-fg-muted hover:text-fg-default transition-colors">
          ← {common.prev}
        </button>
        <button onClick={onNext} className="px-6 py-2 rounded-full bg-accent hover:bg-accent-hover text-fg-on-accent text-sm font-semibold transition-colors">
          {common.next} →
        </button>
      </div>
    </div>
  )
}
