'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface InsightStep {
  id: number
  title: string
  description: string
  poweredBy: string
}

export const INSIGHT_STEPS: InsightStep[] = [
  {
    id: 1,
    title: 'Scenario Overview',
    description: 'Hotels Knowledge Base에서 자연어로 검색합니다. 50개 호텔 문서에서 정확한 답변을 찾아냅니다.',
    poweredBy: 'Foundry IQ — Knowledge Base',
  },
  {
    id: 2,
    title: '💡 Planning',
    description: 'Foundry IQ가 검색 계획을 수립합니다. 어떤 소스를 검색할지, 어떤 방식으로 접근할지 자동으로 결정됩니다.',
    poweredBy: 'Azure AI Search — Agentic Retrieval',
  },
  {
    id: 3,
    title: '💡 Hybrid Search',
    description: '벡터 검색 + 키워드 검색을 동시에 실행합니다. 의미적으로 유사한 문서와 정확히 일치하는 문서를 함께 가져옵니다.',
    poweredBy: 'Azure AI Search — Hybrid Retrieval',
  },
  {
    id: 4,
    title: '💡 Self-Assessment',
    description: '검색 결과가 충분한가? 부족하면 쿼리를 자동으로 리라이팅해서 재검색합니다.',
    poweredBy: 'Azure AI Search — Iterative Query',
  },
  {
    id: 5,
    title: '💡 Answer with Citations',
    description: '모든 답변에는 출처가 붙습니다. Citation을 클릭하면 원본 문서의 정확한 위치를 확인할 수 있습니다.',
    poweredBy: 'Foundry IQ — Answer Synthesis',
  },
  {
    id: 6,
    title: '💡 Reasoning Effort',
    description: 'Reasoning Effort를 높이면 더 많은 소스를 더 깊이 탐색합니다. 속도 vs 정확도를 상황에 맞게 선택.',
    poweredBy: 'Azure AI Search — Configurable',
  },
  {
    id: 7,
    title: '🎉 Demo Complete',
    description: 'Foundry IQ는 이미 Production Ready입니다. 지금 바로 여러분의 Knowledge Base에 연결해보세요.',
    poweredBy: 'Foundry IQ — GA',
  },
]

interface InsightPopupProps {
  step: InsightStep | null
  totalSteps: number
  onDismiss: () => void
  className?: string
}

export function InsightPopup({ step, totalSteps, onDismiss, className }: InsightPopupProps) {
  if (!step) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 24 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'rounded-2xl border p-5 backdrop-blur-lg',
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

        {/* Got it button */}
        <Button
          onClick={onDismiss}
          className="mt-4 w-full bg-accent hover:bg-accent-hover text-fg-on-accent rounded-full h-9 text-sm"
        >
          Got it →
        </Button>
      </motion.div>
    </AnimatePresence>
  )
}
