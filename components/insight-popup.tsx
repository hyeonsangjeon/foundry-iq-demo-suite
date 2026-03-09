'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEffect, useState, useCallback } from 'react'

export interface InsightStep {
  id: number
  title: string
  description: string
  poweredBy: string
  anchor: string | null
  popupSide: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

export const INSIGHT_STEPS: InsightStep[] = [
  {
    id: 1,
    title: 'Scenario Overview',
    description: 'Hotels Knowledge Base에서 자연어로 검색합니다. 50개 호텔 문서에서 정확한 답변을 찾아냅니다.',
    poweredBy: 'Foundry IQ — Knowledge Base',
    anchor: '1',
    popupSide: 'bottom',
  },
  {
    id: 2,
    title: '💡 Planning',
    description: 'Foundry IQ가 검색 계획을 수립합니다. 어떤 소스를 검색할지, 어떤 방식으로 접근할지 자동으로 결정됩니다.',
    poweredBy: 'Azure AI Search — Agentic Retrieval',
    anchor: '2',
    popupSide: 'top',
  },
  {
    id: 3,
    title: '💡 Hybrid Search',
    description: '벡터 검색 + 키워드 검색을 동시에 실행합니다. 의미적으로 유사한 문서와 정확히 일치하는 문서를 함께 가져옵니다.',
    poweredBy: 'Azure AI Search — Hybrid Retrieval',
    anchor: '3',
    popupSide: 'left',
  },
  {
    id: 4,
    title: '💡 Self-Assessment',
    description: '검색 결과가 충분한가? 부족하면 쿼리를 자동으로 리라이팅해서 재검색합니다.',
    poweredBy: 'Azure AI Search — Iterative Query',
    anchor: '4',
    popupSide: 'left',
  },
  {
    id: 5,
    title: '💡 Answer with Citations',
    description: '모든 답변에는 출처가 붙습니다. Citation을 클릭하면 원본 문서의 정확한 위치를 확인할 수 있습니다.',
    poweredBy: 'Foundry IQ — Answer Synthesis',
    anchor: '5',
    popupSide: 'left',
  },
  {
    id: 6,
    title: '💡 Reasoning Effort',
    description: 'Reasoning Effort를 높이면 더 많은 소스를 더 깊이 탐색합니다. 속도 vs 정확도를 상황에 맞게 선택.',
    poweredBy: 'Azure AI Search — Configurable',
    anchor: '6',
    popupSide: 'bottom',
  },
  {
    id: 7,
    title: '🎉 Demo Complete',
    description: 'Foundry IQ는 이미 Production Ready입니다. 지금 바로 여러분의 Knowledge Base에 연결해보세요.',
    poweredBy: 'Foundry IQ — GA',
    anchor: null,
    popupSide: 'center',
  },
]

const POPUP_WIDTH = 320
const POPUP_GAP = 12
const HIGHLIGHT_CLASS = 'tour-highlight-ring'

interface PopupPosition {
  top?: number
  left?: number
  transform?: string
  fallback: boolean
  isCenter: boolean
}

function calculatePosition(
  anchorEl: Element,
  popupSide: InsightStep['popupSide'],
): PopupPosition {
  const rect = anchorEl.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  if (popupSide === 'center') {
    return { fallback: false, isCenter: true }
  }

  let top: number
  let left: number

  switch (popupSide) {
    case 'bottom':
      top = rect.bottom + POPUP_GAP
      left = rect.left + rect.width / 2 - POPUP_WIDTH / 2
      break
    case 'top':
      top = rect.top - POPUP_GAP
      left = rect.left + rect.width / 2 - POPUP_WIDTH / 2
      break
    case 'left':
      top = rect.top + rect.height / 2
      left = rect.left - POPUP_WIDTH - POPUP_GAP
      break
    case 'right':
      top = rect.top + rect.height / 2
      left = rect.right + POPUP_GAP
      break
    default:
      return { fallback: true, isCenter: false }
  }

  // Clamp horizontally
  left = Math.max(8, Math.min(left, vw - POPUP_WIDTH - 8))
  // Clamp vertically (rough estimate: popup ~260px tall)
  top = Math.max(8, Math.min(top, vh - 280))

  const transform =
    popupSide === 'left' || popupSide === 'right' ? 'translateY(-50%)' : undefined

  return { top, left, fallback: false, isCenter: false, transform }
}

interface InsightPopupProps {
  step: InsightStep | null
  totalSteps: number
  onDismiss: () => void
  onNext: () => void
  onPrev: () => void
  className?: string
}

export function InsightPopup({ step, totalSteps, onDismiss, onNext, onPrev, className }: InsightPopupProps) {
  const [position, setPosition] = useState<PopupPosition>({ fallback: true, isCenter: false })

  const computePosition = useCallback(() => {
    if (!step) return

    if (step.popupSide === 'center' || step.anchor === null) {
      setPosition({ fallback: false, isCenter: true })
      return
    }

    const anchorEl = document.querySelector(`[data-tour-step="${step.anchor}"]`)
    if (!anchorEl) {
      setPosition({ fallback: true, isCenter: false })
      return
    }

    setPosition(calculatePosition(anchorEl, step.popupSide))
  }, [step])

  // Add/remove highlight ring on anchor element
  useEffect(() => {
    // Remove any existing highlight first
    const existing = document.querySelector(`.${HIGHLIGHT_CLASS}`)
    if (existing) {
      existing.classList.remove(HIGHLIGHT_CLASS)
    }

    if (!step || step.anchor === null) return

    const anchorEl = document.querySelector(`[data-tour-step="${step.anchor}"]`)
    if (anchorEl) {
      anchorEl.classList.add(HIGHLIGHT_CLASS)
    }

    return () => {
      const highlighted = document.querySelector(`.${HIGHLIGHT_CLASS}`)
      if (highlighted) {
        highlighted.classList.remove(HIGHLIGHT_CLASS)
      }
    }
  }, [step])

  // Compute position and listen for resize/scroll
  useEffect(() => {
    computePosition()

    window.addEventListener('resize', computePosition)
    window.addEventListener('scroll', computePosition, true)

    return () => {
      window.removeEventListener('resize', computePosition)
      window.removeEventListener('scroll', computePosition, true)
    }
  }, [computePosition])

  if (!step) return null

  const isFirst = step.id === 1
  const isLast = step.id === totalSteps

  // Determine wrapper class and style
  let wrapperClassName: string
  let wrapperStyle: React.CSSProperties = {}

  if (position.isCenter) {
    wrapperClassName = 'fixed inset-0 z-50 flex items-center justify-center'
  } else if (position.fallback) {
    wrapperClassName = 'fixed bottom-6 right-6 z-50 w-80'
  } else {
    wrapperClassName = 'fixed z-50 w-80'
    wrapperStyle = {
      top: position.top,
      left: position.left,
      transform: position.transform,
    }
  }

  const motionInitial = position.isCenter
    ? { opacity: 0, scale: 0.95 }
    : { opacity: 0, x: 24 }
  const motionAnimate = position.isCenter
    ? { opacity: 1, scale: 1 }
    : { opacity: 1, x: 0 }
  const motionExit = position.isCenter
    ? { opacity: 0, scale: 0.95 }
    : { opacity: 0, x: 24 }

  return (
    <>
      {/* Backdrop for center mode */}
      {position.isCenter && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onDismiss}
        />
      )}

      <div className={wrapperClassName} style={wrapperStyle}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={motionInitial}
            animate={motionAnimate}
            exit={motionExit}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'rounded-2xl border p-5 backdrop-blur-lg w-80',
              'bg-accent-subtle/10 border-accent-muted/30',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <h4 className="text-lg font-semibold text-fg-default">{step.title}</h4>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-fg-muted">{step.id}/{totalSteps}</span>
                <button
                  onClick={onDismiss}
                  className="text-fg-muted hover:text-fg-default transition-colors text-sm leading-none"
                  aria-label="Close insight"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-fg-muted leading-relaxed">
              {step.description}
            </p>

            {/* Powered By badge */}
            <div className="mt-4 px-3 py-2 rounded-lg bg-glass-surface border border-glass-border text-xs text-accent">
              <span className="text-accent mr-1">✦</span>
              Powered by: {step.poweredBy}
            </div>

            {/* Navigation buttons */}
            <div className="mt-4 flex items-center gap-2">
              {!isFirst && (
                <Button
                  onClick={onPrev}
                  variant="ghost"
                  className="rounded-full h-9 text-sm px-4 text-fg-muted hover:text-fg-default"
                >
                  ← Prev
                </Button>
              )}
              <div className="flex-1" />
              {isLast ? (
                <Button
                  onClick={onDismiss}
                  className="bg-accent hover:bg-accent-hover text-fg-on-accent rounded-full h-9 text-sm px-4"
                >
                  🎉 Complete
                </Button>
              ) : (
                <Button
                  onClick={onNext}
                  className="bg-accent hover:bg-accent-hover text-fg-on-accent rounded-full h-9 text-sm px-4"
                >
                  Got it →
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  )
}
