'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SPConnectionPanel } from '@/components/sp-connection-panel'
import { SPDocumentLibrary } from '@/components/sp-document-library'
import { SPIndexingPipeline, IndexerStatus } from '@/components/sp-indexing-pipeline'
import { InsightPopup } from '@/components/insight-popup'
import { SP_INSIGHT_STEPS } from '@/components/sp-insight-steps'
import { SP_CONFIG, SP_LIVE_AVAILABLE, SP_LIVE_SECRET } from '@/lib/sp-config'
import { SPModeToggle } from '@/components/sp-mode-toggle'
import {
  ChevronLeft20Regular,
  ArrowRight20Regular,
  CheckmarkCircle20Filled,
  DocumentMultiple20Regular,
  ArrowSync20Regular,
  Search20Regular,
  ShareScreenStart20Regular,
  Open16Regular,
} from '@fluentui/react-icons'

type DemoStep = 'intro' | 'connection' | 'indexing' | 'query' | 'complete'

const STEPS: DemoStep[] = ['intro', 'connection', 'indexing', 'query', 'complete']

const STEP_LABELS: Record<DemoStep, string> = {
  intro: 'Overview',
  connection: 'Connect',
  indexing: 'Index',
  query: 'Query',
  complete: 'Done',
}

interface ConnectionData {
  sharepoint: { connected: boolean; siteUrl: string; siteName: string }
  entraApp: { configured: boolean; appName: string }
  aiSearch: { connected: boolean; serviceName: string }
  embedding: { ready: boolean; model: string }
}

interface DocumentsData {
  documents: any[]
  summary: { totalDocuments: number; totalSizeBytes: number; supportedFormats: string[] }
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: DemoStep }) {
  const currentIndex = STEPS.indexOf(current)

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex
        const isActive = step === current

        return (
          <div key={step} className="flex items-center gap-1">
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200',
              isActive && 'bg-accent text-fg-on-accent',
              isDone && 'bg-green-500/20 text-green-600 dark:text-green-400',
              !isActive && !isDone && 'bg-bg-subtle text-fg-subtle'
            )}>
              {isDone ? (
                <CheckmarkCircle20Filled className="w-3 h-3" />
              ) : (
                <span className="w-3 h-3 rounded-full border flex items-center justify-center text-[9px] font-bold"
                  style={{ borderColor: isActive ? 'currentColor' : undefined }}>
                  {i + 1}
                </span>
              )}
              <span className="hidden sm:inline">{STEP_LABELS[step]}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'w-4 h-px transition-colors duration-200',
                i < currentIndex ? 'bg-green-500' : 'bg-stroke-divider'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Intro Step ───────────────────────────────────────────────────────────────

function IntroStep({ onNext }: { onNext: () => void }) {
  const boxes = [
    { label: 'SharePoint', sub: 'Documents', icon: DocumentMultiple20Regular, color: 'text-violet-500' },
    { label: 'AI Indexer', sub: 'Extract · Chunk · Embed', icon: ArrowSync20Regular, color: 'text-accent' },
    { label: 'AI Search', sub: 'Vector Index', icon: Search20Regular, color: 'text-blue-500' },
    { label: 'KB Query', sub: 'Agentic Retrieval', icon: ShareScreenStart20Regular, color: 'text-green-500' },
  ]

  return (
    <motion.div
      key="intro"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-5 md:space-y-8"
    >
      <div className="text-center space-y-2">
        <h2 className="text-xl md:text-2xl font-bold text-fg-default">SharePoint to AI Search</h2>
        <p className="text-fg-muted max-w-lg mx-auto text-xs md:text-sm leading-relaxed">
          Connect a SharePoint document library to Azure AI Search and make
          it queryable via Agentic Retrieval — in under 5 minutes.
        </p>
      </div>

      {/* Pipeline diagram — 2x2 grid on mobile, horizontal on desktop */}
      <div className="hidden md:flex items-center justify-center gap-2">
        {boxes.map((box, i) => {
          const Icon = box.icon
          return (
            <div key={box.label} className="flex items-center gap-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className="rounded-xl border border-glass-border bg-glass-surface/50 p-4 w-36 text-center space-y-2"
              >
                <div className={cn('mx-auto w-9 h-9 rounded-lg bg-bg-subtle flex items-center justify-center', box.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-fg-default">{box.label}</p>
                  <p className="text-[10px] text-fg-subtle">{box.sub}</p>
                </div>
              </motion.div>
              {i < boxes.length - 1 && (
                <ArrowRight20Regular className="w-4 h-4 text-fg-subtle shrink-0" />
              )}
            </div>
          )
        })}
      </div>
      {/* Mobile: compact 2x2 grid */}
      <div className="grid grid-cols-2 gap-2 md:hidden">
        {boxes.map((box, i) => {
          const Icon = box.icon
          return (
            <motion.div
              key={box.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              className="rounded-xl border border-glass-border bg-glass-surface/50 p-3 text-center space-y-1.5"
            >
              <div className={cn('mx-auto w-8 h-8 rounded-lg bg-bg-subtle flex items-center justify-center', box.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-fg-default">{box.label}</p>
                <p className="text-[9px] text-fg-subtle leading-tight">{box.sub}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="text-center space-y-1.5">
        <p className="text-xs text-fg-muted">
          Supports PDF, DOCX, XLSX, PPTX, MSG, HTML, TXT, and more
        </p>
        <a
          href="https://learn.microsoft.com/en-us/azure/search/search-how-to-index-sharepoint-online"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-accent hover:text-accent-hover transition-colors"
        >
          View all supported formats
          <Open16Regular className="w-3 h-3" />
        </a>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-accent hover:bg-accent-hover text-fg-on-accent text-sm font-semibold transition-colors duration-150 shadow-sm"
        >
          Start Demo
          <ArrowRight20Regular className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

// ─── Connection Step ──────────────────────────────────────────────────────────

function ConnectionStep({
  connectionData,
  documentsData,
  isLoading,
  onIndex,
  isLiveMode,
  apiError,
}: {
  connectionData: ConnectionData | null
  documentsData: DocumentsData | null
  isLoading: boolean
  onIndex: () => void
  isLiveMode?: boolean
  apiError?: string | null
}) {
  return (
    <motion.div
      key="connection"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-fg-default">SharePoint Connected</h2>
        <p className="text-sm text-fg-muted">
          {isLiveMode
            ? `${documentsData?.summary?.totalDocuments || 4} airline policy documents ready to index`
            : `${documentsData?.summary?.totalDocuments || 4} documents ready to index`}
        </p>
      </div>
      {apiError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <p className="font-medium mb-0.5">Live API Error</p>
          <p className="text-xs text-red-400/80">{apiError}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SPConnectionPanel data={connectionData} isLoading={isLoading} />
        <SPDocumentLibrary
          data={documentsData}
          isLoading={isLoading}
          onIndexClick={onIndex}
        />
      </div>
    </motion.div>
  )
}

// ─── Indexing Step ────────────────────────────────────────────────────────────

function IndexingStep({
  indexerStatus,
  onComplete,
}: {
  indexerStatus: IndexerStatus | null
  onComplete: () => void
}) {
  return (
    <motion.div
      key="indexing"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-fg-default">Indexing Pipeline</h2>
        <p className="text-sm text-fg-muted">Extract · Chunk · Embed · Index</p>
      </div>
      <SPIndexingPipeline status={indexerStatus} onComplete={onComplete} />
    </motion.div>
  )
}

// ─── Complete Step ────────────────────────────────────────────────────────────

function CompleteStep({
  onReset,
  totalChunks,
  documentCount,
}: {
  onReset: () => void
  totalChunks: number
  documentCount: number
}) {
  const router = useRouter()

  return (
    <motion.div
      key="complete"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 25 }}
      className="text-center space-y-6 py-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
        className="mx-auto w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center"
      >
        <CheckmarkCircle20Filled className="w-10 h-10 text-green-500" />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-fg-default">Indexing Complete!</h2>
        <p className="text-fg-muted text-sm">
          {totalChunks} chunks indexed from {documentCount} documents. Your Knowledge Base is ready.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
        {[
          { label: 'Documents', value: String(documentCount) },
          { label: 'Chunks', value: String(totalChunks) },
          { label: 'Dimensions', value: '1536' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-glass-border bg-glass-surface/50 p-3">
            <p className="text-xl font-bold text-accent">{stat.value}</p>
            <p className="text-[11px] text-fg-subtle">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
        <button
          onClick={() => router.push(`/test?agent=${SP_CONFIG.kbName}`)}
          className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-accent hover:bg-accent-hover text-fg-on-accent text-sm font-semibold transition-colors duration-150"
        >
          <Search20Regular className="w-4 h-4" />
          Query Knowledge Base
        </button>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-stroke-divider bg-bg-subtle hover:bg-bg-elevated text-fg-muted text-sm font-medium transition-colors duration-150"
        >
          Try Again
        </button>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-fg-subtle hover:text-fg-muted transition-colors"
      >
        <ChevronLeft20Regular className="w-3.5 h-3.5" />
        Back to Home
      </Link>
    </motion.div>
  )
}

// ─── Main Hub ─────────────────────────────────────────────────────────────────

export function SPDemoHub() {
  const [step, setStep] = useState<DemoStep>('intro')
  const [connectionData, setConnectionData] = useState<ConnectionData | null>(null)
  const [documentsData, setDocumentsData] = useState<DocumentsData | null>(null)
  const [isLoadingConnection, setIsLoadingConnection] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [indexerStatus, setIndexerStatus] = useState<IndexerStatus | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [insightStep, setInsightStep] = useState<number>(0) // 0 = hidden
  const [isLiveMode, setIsLiveMode] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // 페이지 진입 시 항상 Simulated 모드로 시작 (안전한 기본값)
  // sessionStorage의 인증 상태는 유지 — Live 버튼 클릭 시 암호 재입력 없이 전환 가능

  // API URL helper — appends ?mode=live when in live mode
  const apiUrl = useCallback((path: string, extraParams?: string) => {
    const params: string[] = []
    if (isLiveMode) params.push('mode=live')
    if (extraParams) params.push(extraParams)
    return params.length > 0 ? `${path}${path.includes('?') ? '&' : '?'}${params.join('&')}` : path
  }, [isLiveMode])

  // Live mode auth header
  const liveHeaders = useCallback((): HeadersInit => {
    if (!isLiveMode) return {}
    return { 'x-live-secret': SP_LIVE_SECRET }
  }, [isLiveMode])

  // Mode toggle handler — resets all data on switch
  const handleModeToggle = useCallback((live: boolean) => {
    setIsLiveMode(live)
    setConnectionData(null)
    setDocumentsData(null)
    setIndexerStatus(null)
    setStartedAt(null)
    setApiError(null)
    setStep('intro')
    if (pollingRef.current) clearInterval(pollingRef.current)
  }, [])

  // Load connection data when entering connection step
  useEffect(() => {
    if (step === 'connection') {
      setIsLoadingConnection(true)
      setApiError(null)
      Promise.all([
        fetch(apiUrl('/api/sharepoint/connection'), { headers: liveHeaders() }).then(r => {
          if (!r.ok) throw new Error(`Connection API error: ${r.status}`)
          return r.json()
        }),
        fetch(apiUrl('/api/sharepoint/documents'), { headers: liveHeaders() }).then(r => {
          if (!r.ok) throw new Error(`Documents API error: ${r.status}`)
          return r.json()
        }),
      ])
        .then(([conn, docs]) => {
          setConnectionData(conn)
          setDocumentsData(docs)
        })
        .catch((e) => {
          console.error(e)
          setApiError(e.message || 'Failed to connect. Check SP credentials.')
        })
        .finally(() => setIsLoadingConnection(false))
    }
  }, [step, apiUrl])

  // Poll indexer status
  const pollStatus = useCallback(async (at: number) => {
    try {
      const res = await fetch(apiUrl('/api/sharepoint/index-pipeline/status', `startedAt=${at}`), { headers: liveHeaders() })
      if (res.ok) {
        const data: IndexerStatus = await res.json()
        setIndexerStatus(data)
        if (data.isComplete) {
          if (pollingRef.current) clearInterval(pollingRef.current)
        }
      }
    } catch (e) {
      console.error('Poll error:', e)
    }
  }, [apiUrl])

  // Start indexing
  const handleStartIndexing = useCallback(async () => {
    setStep('indexing')
    try {
      const res = await fetch(apiUrl('/api/sharepoint/index-pipeline'), { method: 'POST', headers: { ...liveHeaders() } })
      if (!res.ok) throw new Error(`Pipeline API error: ${res.status}`)
      const data = await res.json()
      const at = data.startedAt as number
      setStartedAt(at)

      // Immediate first poll
      await pollStatus(at)

      // Poll every 5 seconds
      pollingRef.current = setInterval(() => pollStatus(at), SP_CONFIG.pollingIntervalMs)
    } catch (e) {
      console.error('Start indexing error:', e)
    }
  }, [pollStatus])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const handleIndexingComplete = useCallback(() => {
    setStep('complete')
  }, [])

  // Auto-create KS + KB when live indexing completes
  useEffect(() => {
    if (indexerStatus?.isComplete && isLiveMode) {
      fetch(apiUrl('/api/sharepoint/knowledge-source'), { method: 'PUT', headers: { ...liveHeaders() } })
        .then(r => {
          if (!r.ok) {
            return r.json().then(err => {
              console.error(`KS+KB creation failed (${r.status}):`, err)
              throw new Error(err.error || `HTTP ${r.status}`)
            })
          }
          return r.json()
        })
        .then(data => console.log('KS+KB created:', data))
        .catch(err => console.error('KS+KB creation error:', err.message || err))
    }
  }, [indexerStatus?.isComplete, isLiveMode, apiUrl, liveHeaders])

  const handleReset = useCallback(() => {
    setStep('intro')
    setConnectionData(null)
    setDocumentsData(null)
    setIndexerStatus(null)
    setStartedAt(null)
    setInsightStep(0)
    if (pollingRef.current) clearInterval(pollingRef.current)
  }, [])

  // Show insight popup on step transitions
  useEffect(() => {
    if (step === 'connection') setInsightStep(1)
    else if (step === 'indexing') setInsightStep(2)
    else if (step === 'complete') setInsightStep(4)
    else setInsightStep(0)
  }, [step])

  const currentInsight = insightStep > 0 ? SP_INSIGHT_STEPS[insightStep - 1] ?? null : null

  return (
    <div className="min-h-screen bg-bg-canvas text-fg-default">
      {/* Header */}
      <div className="border-b border-stroke-divider bg-bg-subtle/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg-default transition-colors"
          >
            <ChevronLeft20Regular className="w-3.5 h-3.5" />
            Home
          </Link>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-fg-default">SharePoint Connector Demo</h1>
          </div>
          <SPModeToggle
            isLiveMode={isLiveMode}
            isLiveAvailable={SP_LIVE_AVAILABLE}
            onToggle={handleModeToggle}
          />
          <StepIndicator current={step} />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="relative">
          <AnimatePresence mode="wait">
            {step === 'intro' && (
              <IntroStep key="intro" onNext={() => setStep('connection')} />
            )}
            {step === 'connection' && (
              <ConnectionStep
                key="connection"
                connectionData={connectionData}
                documentsData={documentsData}
                isLoading={isLoadingConnection}
                onIndex={handleStartIndexing}
                isLiveMode={isLiveMode}
                apiError={apiError}
              />
            )}
            {step === 'indexing' && (
              <IndexingStep
                key="indexing"
                indexerStatus={indexerStatus}
                onComplete={handleIndexingComplete}
              />
            )}
            {step === 'complete' && (
              <CompleteStep
                key="complete"
                onReset={handleReset}
                totalChunks={indexerStatus?.totalChunks ?? 42}
                documentCount={documentsData?.documents?.length ?? 4}
              />
            )}
          </AnimatePresence>

          {/* Insight Popup */}
          {currentInsight && (
            <div className="mt-6">
              <InsightPopup
                step={currentInsight}
                totalSteps={SP_INSIGHT_STEPS.length}
                onDismiss={() => setInsightStep(0)}
                onNext={() => setInsightStep(prev => Math.min(prev + 1, SP_INSIGHT_STEPS.length))}
                onPrev={() => setInsightStep(prev => Math.max(prev - 1, 1))}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
