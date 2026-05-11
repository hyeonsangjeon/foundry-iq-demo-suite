'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

type RevealCurtainProps = {
  isVisible: boolean
  /**
   * True only on the first transition from hidden → visible per session.
   * Subsequent persona-toggle visits must pass `false` so the engineer view
   * appears instantly without re-running the curtain animation.
   */
  animateOnFirstReveal: boolean
  children: ReactNode
}

export function RevealCurtain({ isVisible, animateOnFirstReveal, children }: RevealCurtainProps) {
  return (
    <AnimatePresence initial={false}>
      {isVisible && (
        <motion.div
          key="reveal"
          initial={animateOnFirstReveal ? { opacity: 0, height: 0 } : false}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: animateOnFirstReveal ? 0.6 : 0, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          <div className="my-12 flex items-center gap-4">
            <div className="h-px flex-1 bg-stroke-divider" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
              engineer view
            </span>
            <div className="h-px flex-1 bg-stroke-divider" />
          </div>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
