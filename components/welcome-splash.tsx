'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import Image from 'next/image'

const healthChecks = [
  { id: 'kb', label: 'Knowledge Base', tag: 'KB', delay: 400 },
  { id: 'search', label: 'Azure AI Search', tag: 'SEARCH', delay: 800 },
  { id: 'openai', label: 'OpenAI GPT-4o', tag: 'LLM', delay: 1200 },
  { id: 'engine', label: 'Agentic Retrieval', tag: 'ENGINE', delay: 1600 },
]

interface WelcomeSplashProps {
  className?: string
}

export function WelcomeSplash({ className }: WelcomeSplashProps) {
  const [completedChecks, setCompletedChecks] = useState<Set<string>>(new Set())
  const [showReady, setShowReady] = useState(false)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    healthChecks.forEach((check) => {
      timers.push(
        setTimeout(() => {
          setCompletedChecks((prev) => new Set(Array.from(prev).concat(check.id)))
        }, check.delay)
      )
    })

    timers.push(
      setTimeout(() => setShowReady(true), healthChecks[healthChecks.length - 1].delay + 500)
    )

    return () => timers.forEach(clearTimeout)
  }, [])

  const progress = completedChecks.size / healthChecks.length
  const circumference = 2 * Math.PI * 18 // r=18

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
      className={cn(
        'relative w-full max-w-xl overflow-hidden rounded-2xl',
        'border border-glass-border/60',
        'bg-gradient-to-br from-glass-surface/80 via-glass-surface/40 to-transparent',
        'backdrop-blur-xl shadow-lg',
        'dark:shadow-[0_0_40px_hsl(var(--color-accent-default)/0.06)]',
        className
      )}
    >
      {/* Animated top border glow */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, hsl(var(--color-accent-default) / 0.6), transparent)',
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: showReady ? 0.3 : 0.8 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      <div className="relative px-6 py-5">
        <div className="flex flex-col items-center gap-4">
          {/* Logo with progress ring */}
          <div className="relative shrink-0">
            <svg width="48" height="48" viewBox="0 0 48 48" className="transform -rotate-90">
              {/* Track */}
              <circle
                cx="24" cy="24" r="18"
                fill="none"
                stroke="hsl(var(--color-stroke-divider))"
                strokeWidth="2"
                opacity="0.3"
              />
              {/* Progress */}
              <motion.circle
                cx="24" cy="24" r="18"
                fill="none"
                stroke={showReady ? 'rgb(34 197 94)' : 'hsl(var(--color-accent-default))'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference * (1 - progress) }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </svg>
            {/* Logo centered inside ring */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src="/icons/ai-foundry.png"
                alt="Foundry IQ"
                width={22}
                height={22}
                className={cn(
                  'transition-all duration-500',
                  showReady ? 'opacity-100' : 'opacity-60'
                )}
              />
            </div>
          </div>

          {/* Content */}
          <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="text-center">
                <h2 className="text-sm font-semibold text-fg-default tracking-wide">
                  Foundry IQ
                </h2>
                <AnimatePresence mode="wait">
                  {showReady ? (
                    <motion.p
                      key="ready"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-[11px] text-accent font-medium"
                    >
                      All systems operational
                    </motion.p>
                  ) : (
                    <motion.p
                      key="init"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[11px] text-fg-subtle"
                    >
                      Connecting services...
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Status badge — inline next to title block */}
              <AnimatePresence mode="wait">
                {showReady ? (
                  <motion.div
                    key="online"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20"
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                    </span>
                    <span className="text-[10px] font-semibold text-green-500 uppercase tracking-widest">
                      Online
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="init-badge"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/5 border border-accent/10"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    <span className="text-[10px] font-medium text-accent/70 uppercase tracking-widest">
                      Init
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Service grid */}
            <div className="grid grid-cols-4 gap-1.5">
              {healthChecks.map((check, i) => {
                const isDone = completedChecks.has(check.id)
                return (
                  <motion.div
                    key={check.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.3 }}
                    className={cn(
                      'relative rounded-lg px-2.5 py-2 text-center transition-all duration-400',
                      'border',
                      isDone
                        ? 'bg-green-500/5 border-green-500/15'
                        : 'bg-bg-elevated/30 border-glass-border/40'
                    )}
                  >
                    {/* Completion flash */}
                    <AnimatePresence>
                      {isDone && (
                        <motion.div
                          initial={{ opacity: 0.6 }}
                          animate={{ opacity: 0 }}
                          transition={{ duration: 0.8 }}
                          className="absolute inset-0 rounded-lg bg-green-500/10"
                        />
                      )}
                    </AnimatePresence>

                    {/* Tag */}
                    <div className={cn(
                      'text-[9px] font-bold uppercase tracking-[0.12em] mb-1 transition-colors duration-300',
                      isDone ? 'text-green-500' : 'text-fg-subtle/50'
                    )}>
                      {check.tag}
                    </div>

                    {/* Status indicator */}
                    {isDone ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                        className="mx-auto w-3.5 h-3.5 rounded-full bg-green-500/20 flex items-center justify-center"
                      >
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <motion.path
                            d="M1.5 4L3.2 5.7L6.5 2.3"
                            stroke="rgb(34 197 94)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                          />
                        </svg>
                      </motion.div>
                    ) : (
                      <div className="mx-auto w-3.5 h-3.5 rounded-full border border-fg-subtle/30 border-t-transparent animate-spin" />
                    )}

                    {/* Label */}
                    <div className={cn(
                      'text-[9px] mt-1 leading-tight transition-colors duration-300 truncate',
                      isDone ? 'text-fg-default' : 'text-fg-subtle/40'
                    )}>
                      {check.label}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom progress bar */}
      <div className="h-0.5 bg-bg-elevated/50">
        <motion.div
          className="h-full bg-gradient-to-r from-accent/60 via-accent to-accent/60"
          initial={{ width: '0%' }}
          animate={{ width: showReady ? '100%' : `${progress * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  )
}
