'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { getLocale, type Locale } from '@/lib/i18n'
import { ScenarioIntro } from '@/components/scenario/scenario-intro'
import { ScenarioScene } from '@/components/scenario/scenario-scene'
import { ScenarioScene3b } from '@/components/scenario/scenario-scene3b'
import { ScenarioTransition } from '@/components/scenario/scenario-transition'
import { ScenarioInterlude } from '@/components/scenario/scenario-interlude'
import { ScenarioSummary } from '@/components/scenario/scenario-summary'
import { ScenarioStepper } from '@/components/scenario/scenario-stepper'
import { ModeToggle } from '@/components/mode-toggle'
import { scenarioT } from '@/data/scenario-translations'

const TOTAL_STEPS = 11

// Step mapping: 0=intro, 1=scene1, 2=t1, 3=scene2, 4=t2, 5=interlude, 6=scene3, 7=t3(VP), 8=scene3b, 9=t4, 10=summary

export default function ScenarioPage() {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [step, setStep] = useState(0)
  useEffect(() => { setLocaleState(getLocale()) }, [])

  const router = useRouter()
  const common = scenarioT.common[locale]

  const handleModeToggle = useCallback((mode: 'technical' | 'executive') => {
    if (mode === 'technical') router.push('/')
  }, [router])

  const goNext = useCallback(() => {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }, [])

  const goPrev = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0))
  }, [])

  const goToSummary = useCallback(() => {
    setStep(TOTAL_STEPS - 1)
  }, [])

  // Keyboard navigation — skip ArrowRight on Transition steps (they handle it internally)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const isTransitionStep = step === 2 || step === 4 || step === 7 || step === 9
      if (e.key === 'ArrowRight' && !isTransitionStep) goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev, step])

  return (
    <div className="min-h-[100dvh] bg-bg-canvas text-fg-default">
      {/* Header */}
      <div className="border-b border-stroke-divider bg-bg-subtle/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <ModeToggle mode="executive" onToggle={handleModeToggle} locale={locale} />

          <ScenarioStepper currentStep={step} totalSteps={TOTAL_STEPS} />

          {step < TOTAL_STEPS - 1 && (
            <button
              onClick={goToSummary}
              className="whitespace-nowrap text-[11px] text-fg-subtle hover:text-fg-muted transition-colors"
            >
              <span className="hidden sm:inline">{common.skipToSummary} →</span>
              <span className="sm:hidden">→ Summary</span>
            </button>
          )}
          {step === TOTAL_STEPS - 1 && <div className="w-16 sm:w-24" />}
        </div>
      </div>

      {/* Content */}
      <div className="py-8 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
          >
            {step === 0 && <ScenarioIntro locale={locale} onNext={goNext} />}
            {step === 1 && <ScenarioScene sceneNumber={1} locale={locale} onNext={goNext} onPrev={goPrev} />}
            {step === 2 && <ScenarioTransition transitionNumber={1} locale={locale} onNext={goNext} />}
            {step === 3 && <ScenarioScene sceneNumber={2} locale={locale} onNext={goNext} onPrev={goPrev} />}
            {step === 4 && <ScenarioTransition transitionNumber={2} locale={locale} onNext={goNext} />}
            {step === 5 && <ScenarioInterlude locale={locale} onNext={goNext} />}
            {step === 6 && <ScenarioScene sceneNumber={3} locale={locale} onNext={goNext} onPrev={goPrev} />}
            {step === 7 && <ScenarioTransition transitionNumber={3} locale={locale} onNext={goNext} />}
            {step === 8 && <ScenarioScene3b locale={locale} onNext={goNext} onPrev={goPrev} />}
            {step === 9 && <ScenarioTransition transitionNumber={4} locale={locale} onNext={goNext} />}
            {step === 10 && <ScenarioSummary locale={locale} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
