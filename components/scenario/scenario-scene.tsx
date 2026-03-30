'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import type { Locale } from '@/lib/i18n'
import { scenarioT } from '@/data/scenario-translations'
import { TypingText } from './typing-effect'
import { cn } from '@/lib/utils'

const sceneImages: Record<1 | 2 | 3, { src: string; alt: string }> = {
  1: { src: '/scenario/scene1-chat.webp', alt: 'AI-powered customer service chat' },
  2: { src: '/scenario/scene2-pipeline.webp', alt: 'SharePoint auto-indexing pipeline' },
  3: { src: '/scenario/scene3-semantic-join.webp', alt: 'Semantic JOIN dashboard' },
}

interface SceneProps {
  sceneNumber: 1 | 2 | 3
  locale: Locale
  onNext: () => void
  onPrev: () => void
}

export function ScenarioScene({ sceneNumber, locale, onNext, onPrev }: SceneProps) {
  const sectionKey = `scene${sceneNumber}` as const
  const t = scenarioT[sectionKey][locale]
  const common = scenarioT.common[locale]
  const [answerDone, setAnswerDone] = useState(false)

  if (sceneNumber === 3) {
    return <Scene3 t={t} common={common} onNext={onNext} onPrev={onPrev} answerDone={answerDone} setAnswerDone={setAnswerDone} />
  }

  return <Scene12 t={t} common={common} sceneNumber={sceneNumber} onNext={onNext} onPrev={onPrev} answerDone={answerDone} setAnswerDone={setAnswerDone} />
}

/* ─── Scene 1 & 2: Before / After 2-panel ──────────────────────────────────── */

function Scene12({
  t, common, sceneNumber, onNext, onPrev, answerDone, setAnswerDone,
}: {
  t: any; common: any; sceneNumber: number; onNext: () => void; onPrev: () => void; answerDone: boolean; setAnswerDone: (v: boolean) => void
}) {
  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Scene image */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6">
        <Image src={sceneImages[sceneNumber as 1 | 2].src} alt={sceneImages[sceneNumber as 1 | 2].alt} fill className="object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
      </div>

      {/* Scene label */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
        <span className="text-xs font-mono text-fg-subtle">{t.sceneLabel}</span>
      </motion.div>

      {/* Scenario card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-xl border border-stroke-divider bg-bg-elevated/50 backdrop-blur-sm p-5 mb-6"
      >
        <h2 className="text-xl font-bold text-fg-default mb-3">{t.title}</h2>
        {sceneNumber === 1 && (
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">📞</span>
            <p className="text-sm text-fg-muted italic">&quot;{t.customerQuery}&quot;</p>
          </div>
        )}
        {sceneNumber === 2 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">⚠️</span>
              <span className="text-xs font-semibold text-amber-400">{t.alertSender}</span>
            </div>
            <p className="text-sm text-fg-muted">{t.alertMessage}</p>
          </div>
        )}
      </motion.div>

      {/* 2-panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Before */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-xl border border-red-500/20 bg-red-500/5 p-5"
        >
          <h3 className="text-sm font-semibold text-red-400 mb-3">{t.beforeTitle}</h3>
          <ul className="space-y-2 mb-3">
            {(t.beforeSteps as string[]).map((step: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-fg-muted">
                <span className="text-red-500/60 shrink-0 mt-0.5">•</span>
                {step}
              </li>
            ))}
          </ul>
          <div className="text-xs font-semibold text-red-400">{t.beforeTotal}</div>
        </motion.div>

        {/* After */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5"
        >
          <h3 className="text-sm font-semibold text-emerald-400 mb-3">{t.afterTitle}</h3>

          {/* Scene 2: indexing pipeline mini-viz */}
          {sceneNumber === 2 && t.indexingStages && (
            <div className="mb-3">
              <div className="text-[10px] text-fg-subtle font-mono mb-1.5">{t.indexingLabel}</div>
              <div className="flex items-center gap-1 mb-1">
                {(t.indexingStages as string[]).map((stage: string, i: number) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-[10px] font-mono text-emerald-400">
                      {stage} ✓
                    </span>
                    {i < (t.indexingStages as string[]).length - 1 && (
                      <span className="text-emerald-500/40">→</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-fg-subtle font-mono">{t.indexingStats}</div>
            </div>
          )}

          {/* Answer with typing effect */}
          <div className="text-sm text-fg-default leading-relaxed mb-3 min-h-[80px]">
            <TypingText text={t.answer} speed={15} startDelay={800} onComplete={() => setAnswerDone(true)} />
          </div>

          {/* Citations */}
          {answerDone && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5 mb-3">
              {(t.citations as any[]).map((c: any) => (
                <div key={c.index} className="flex items-center gap-2 text-xs">
                  <span className="w-4 h-4 flex items-center justify-center rounded bg-accent/20 text-accent text-[10px] font-bold">
                    {c.index}
                  </span>
                  <span className="text-fg-muted">{c.source}</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-fg-subtle">{c.origin}</span>
                </div>
              ))}
            </motion.div>
          )}

          <div className="text-xs font-semibold text-emerald-400">⚡ {t.afterTime}</div>
        </motion.div>
      </div>

      {/* Insight */}
      {answerDone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-accent/20 bg-accent/5 p-4 mb-4"
        >
          <p className="text-sm text-fg-default">💡 {t.insight}</p>
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

/* ─── Scene 3: Killer Scene (single panel) ─────────────────────────────────── */

function Scene3({
  t, common, onNext, onPrev, answerDone, setAnswerDone,
}: {
  t: any; common: any; onNext: () => void; onPrev: () => void; answerDone: boolean; setAnswerDone: (v: boolean) => void
}) {
  return (
    <div className="max-w-3xl mx-auto px-4">
      {/* Scene image */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6">
        <Image src={sceneImages[3].src} alt={sceneImages[3].alt} fill className="object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 mb-4">
        <span className="text-xs font-mono text-fg-subtle">{t.sceneLabel}</span>
        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-400">
          ★ {t.starLabel}
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

      {/* VP request */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 mb-4"
      >
        <div className="flex items-start gap-3">
          <span className="text-lg shrink-0">📊</span>
          <p className="text-sm text-fg-muted italic">&quot;{t.vpQuery}&quot;</p>
        </div>
      </motion.div>

      {/* "Previously impossible" label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 mb-5"
      >
        {t.impossibleLabel}
      </motion.div>

      {/* Answer */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 mb-4"
      >
        <div className="text-sm text-fg-default leading-relaxed mb-4 min-h-[80px]">
          <TypingText text={t.answer} speed={15} startDelay={1000} onComplete={() => setAnswerDone(true)} />
        </div>

        {/* Citations */}
        {answerDone && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5">
            {(t.citations as any[]).map((c: any) => (
              <div key={c.index} className="flex items-center gap-2 text-xs">
                <span className={cn(
                  'w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold',
                  c.type === 'Data' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-violet-500/20 text-violet-400'
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
      </motion.div>

      {/* Insight */}
      {answerDone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-accent/20 bg-accent/5 p-4 mb-6"
        >
          <p className="text-sm text-fg-default">💡 {t.insight}</p>
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
