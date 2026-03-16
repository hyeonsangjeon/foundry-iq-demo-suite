'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  ArrowDownload20Regular,
  TextAlignJustify20Regular,
  BrainCircuit20Regular,
  DatabaseSearch20Regular,
  CheckmarkCircle20Filled,
  Circle20Regular,
  SpinnerIos20Regular,
} from '@fluentui/react-icons'

export interface PipelineStage {
  name: string
  label: string
  icon: string
  status: 'waiting' | 'active' | 'complete'
  progress: number
  description: string
}

export interface IndexerStatus {
  overallProgress: number
  elapsedMs: number
  estimatedRemainingMs: number
  stages: PipelineStage[]
  documents: Array<{
    id: string
    name: string
    type: string
    status: string
    chunks: number | null
  }>
  isComplete: boolean
  totalChunks: number
}

export interface SPIndexingPipelineProps {
  status: IndexerStatus | null
  onComplete: () => void
}

function StageIcon({ iconName, className }: { iconName: string; className?: string }) {
  switch (iconName) {
    case 'extract':
      return <ArrowDownload20Regular className={className} />
    case 'chunk':
      return <TextAlignJustify20Regular className={className} />
    case 'embed':
      return <BrainCircuit20Regular className={className} />
    case 'index':
      return <DatabaseSearch20Regular className={className} />
    default:
      return <Circle20Regular className={className} />
  }
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

function formatEta(ms: number): string {
  if (ms <= 0) return 'Done'
  const s = Math.ceil(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m > 0) return `~${m}m ${sec}s`
  return `~${sec}s`
}

export function SPIndexingPipeline({ status, onComplete }: SPIndexingPipelineProps) {
  const [showFlash, setShowFlash] = useState(false)
  const completedRef = useRef(false)

  // Handle completion flash + callback
  useEffect(() => {
    if (status?.isComplete && !completedRef.current) {
      completedRef.current = true
      setShowFlash(true)
      setTimeout(() => setShowFlash(false), 800)
      setTimeout(() => onComplete(), 3000)
    }
  }, [status?.isComplete, onComplete])

  if (!status) {
    return (
      <div className="rounded-xl border border-glass-border bg-glass-surface/50 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <SpinnerIos20Regular className="w-5 h-5 text-accent animate-spin" />
          <span className="text-sm text-fg-muted">Initializing pipeline...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative rounded-xl border border-glass-border bg-glass-surface/50 p-5 space-y-5 overflow-hidden">
      {/* Flash effect on completion */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-white dark:bg-white/20 z-20 pointer-events-none rounded-xl"
          />
        )}
      </AnimatePresence>

      {/* Stage Pipeline Bar */}
      <div className="grid grid-cols-4 gap-2">
        {status.stages.map((stage, i) => (
          <div key={stage.name} className="relative">
            {/* Connector arrow */}
            {i < status.stages.length - 1 && (
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 z-10 text-fg-subtle text-[10px]">
                ›
              </div>
            )}
            <div
              className={cn(
                'rounded-lg border p-3 transition-all duration-300',
                stage.status === 'complete' && 'bg-green-500/10 border-green-500/30',
                stage.status === 'active' && 'bg-accent/10 border-accent/30',
                stage.status === 'waiting' && 'bg-bg-subtle/30 border-stroke-divider opacity-50'
              )}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <div className={cn(
                  'w-6 h-6 rounded-md flex items-center justify-center shrink-0',
                  stage.status === 'complete' && 'bg-green-500/20 text-green-500',
                  stage.status === 'active' && 'bg-accent/20 text-accent',
                  stage.status === 'waiting' && 'bg-fg-subtle/10 text-fg-subtle'
                )}>
                  {stage.status === 'active' ? (
                    <SpinnerIos20Regular className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <StageIcon iconName={stage.icon} className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="text-[11px] font-semibold text-fg-default leading-tight">
                  {stage.label}
                </span>
              </div>

              {/* Stage progress bar */}
              <div className="h-1 rounded-full bg-bg-subtle overflow-hidden">
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    stage.status === 'complete' ? 'bg-green-500' : 'bg-accent'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${stage.progress * 100}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>

              <p className="text-[10px] text-fg-subtle mt-1.5 leading-tight hidden sm:block">
                {stage.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Document Status List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-fg-muted uppercase tracking-wide">
            Documents
          </span>
          <span className="text-xs text-fg-subtle">
            {status.documents.filter(d => d.status === 'indexed').length} / {status.documents.length} indexed
          </span>
        </div>
        <div className="max-h-64 overflow-y-auto space-y-0.5 pr-1">
          <AnimatePresence initial={false}>
            {status.documents.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02, duration: 0.15 }}
                className={cn(
                  'flex items-center gap-2.5 py-1.5 px-2 rounded-lg transition-colors',
                  doc.status === 'indexed' && 'bg-green-500/5',
                  doc.status === 'indexing' && 'bg-accent/5'
                )}
              >
                {doc.status === 'indexed' ? (
                  <CheckmarkCircle20Filled className="w-3.5 h-3.5 text-green-500 shrink-0" />
                ) : doc.status === 'indexing' ? (
                  <SpinnerIos20Regular className="w-3.5 h-3.5 text-accent animate-spin shrink-0" />
                ) : (
                  <Circle20Regular className="w-3.5 h-3.5 text-fg-subtle/40 shrink-0" />
                )}
                <span className={cn(
                  'flex-1 text-xs truncate',
                  doc.status === 'indexed' ? 'text-fg-default' :
                  doc.status === 'indexing' ? 'text-accent' : 'text-fg-subtle'
                )}>
                  {doc.name}
                </span>
                {doc.chunks !== null && (
                  <span className="text-[10px] text-fg-subtle shrink-0 font-mono">
                    {doc.chunks} chunks
                  </span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-fg-muted">
          <span>Overall Progress</span>
          <span className="font-mono font-semibold text-fg-default">
            {status.overallProgress.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-bg-subtle overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full transition-colors duration-300',
              status.isComplete ? 'bg-green-500' : 'bg-accent'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${status.overallProgress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-fg-subtle font-mono">
          <span>Elapsed: {formatElapsed(status.elapsedMs)}</span>
          {status.isComplete ? (
            <span className="text-green-500 font-semibold">
              Complete — {status.totalChunks} chunks indexed
            </span>
          ) : (
            <span>ETA: {formatEta(status.estimatedRemainingMs)}</span>
          )}
        </div>
      </div>
    </div>
  )
}
