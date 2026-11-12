'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { getLocale, type Locale } from '@/lib/i18n'
import { t } from '@/lib/i18n/translations'
import { Send20Regular, Bot20Regular, Person20Regular, Settings20Regular, Dismiss20Regular, Code20Regular, ArrowCounterclockwise20Regular, ArrowReset20Regular, ChevronRight20Regular, ChevronDown20Regular } from '@fluentui/react-icons'
import { AgentAvatar } from '@/components/agent-avatar'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { VoiceInput } from '@/components/ui/voice-input'
import { InlineCitationsText, SourcesCountButton } from '@/components/inline-citations'
import { SourcesPanel } from '@/components/sources-panel'
import { SourceKindIcon } from '@/components/source-kind-icon'
import { MCPToolCallDisplay } from '@/components/mcp-tool-call-display'
import { RuntimeSettingsPanel } from '@/components/runtime-settings-panel'
import { fetchKnowledgeBases, fetchKnowledgeSources, retrieveFromKnowledgeBase } from '../lib/api'
import { KBViewCodeModal } from '@/components/kb-view-code-modal'
import { useConversationStarters, conversationStarterRegistry } from '@/lib/conversationStarters'
import { cn, formatRelativeTime, cleanTextSnippet } from '@/lib/utils'
import { TraceExplorer } from '@/components/trace-explorer'
import { InsightPopup, INSIGHT_STEPS, getFoundryInsightSteps } from '@/components/insight-popup'
import { ServiceHealthPanel } from '@/components/service-health-panel'
import { DataExplorer } from '@/components/data-explorer'
import type { KnowledgeBaseRetrievalResponse } from '@/types/knowledge-retrieval'
import { buildKbRetrieveRequest, buildKbWebContext, type KbWebAnswerResponse, type KbWebAnswerStatus } from '@/lib/kbWebAnswer'
import { WEB_IQ_DEMO_QUESTIONS, isAllowedWebIqQuestion } from '@/lib/webIqDemoQuestions'
import { useWebIqUsageLimit } from '@/components/web-iq/use-web-iq-usage-limit'
import { WebIqAnswerComparison } from '@/components/web-iq/web-iq-answer-comparison'
import { WebIqServiceLinks } from '@/components/web-iq/web-iq-service-links'
import { requestWebIqAnswer, WebIqComparisonError, type ComparisonRun } from '@/lib/webIqComparison'
import { WebIqBotCheck } from '@/components/web-iq/web-iq-bot-check'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type KnowledgeAgent = {
  id: string
  name: string
  model?: string
  sources: string[]
  status?: string
  description?: string
  outputConfiguration?: { modality?: string; answerInstructions?: string }
  outputMode?: 'answerSynthesis' | 'extractiveData'
  answerInstructions?: string  // Can be at root level in API response
  retrievalReasoningEffort?: { kind: 'minimal' | 'low' | 'medium' | 'high' }
  retrievalInstructions?: string
  knowledgeSources?: Array<{
    name: string
    kind?: string
    includeReferences?: boolean
    includeReferenceSourceData?: boolean | null
    alwaysQuerySource?: boolean | null
    maxSubQueries?: number | null
    rerankerThreshold?: number | null
    headers?: Record<string, string>
  }>
}

type MessageContent =
  | { type: 'text'; text: string }
  | { type: 'image'; image: { url: string; alt?: string } }

/** Rewrite Azure Blob URLs through our API proxy to hide SAS tokens from the client */
function proxyBlobUrl(url: string): string {
  if (url.includes('.blob.core.windows.net')) {
    return `/api/blob-image?url=${encodeURIComponent(url)}`
  }
  return url
}

/** Look up a ConversationStarter by ID across all registry sets */
function findStarterById(id: string) {
  for (const set of conversationStarterRegistry) {
    const found = set.starters.find(s => s.id === id)
    if (found) return found
  }
  return null
}

/** Strip markdown image syntax and [IMAGE_URL: ...] blocks from text */
function stripImagesFromText(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[IMAGE_URL:\s*[^\]]+\]/g, '')
    .trim()
}

/** Parse markdown image syntax ![alt](url) and [IMAGE_URL: url] from text into mixed content */
function parseImagesFromText(text: string): MessageContent[] {
  const pattern = /!\[[^\]]*\]\(([^)]+)\)|\[IMAGE_URL:\s*([^\]]+)\]/g
  const parts: MessageContent[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index).trim()
    if (before) parts.push({ type: 'text', text: before })
    const url = (match[1] || match[2] || '').trim()
    if (url) parts.push({ type: 'image', image: { url: proxyBlobUrl(url) } })
    lastIndex = match.index + match[0].length
  }

  const after = text.slice(lastIndex).trim()
  if (after) parts.push({ type: 'text', text: after })

  return parts.length > 0 ? parts : [{ type: 'text', text }]
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: MessageContent[]
  timestamp: Date
  references?: Reference[]
  activity?: Activity[]
  webIq?: KbWebAnswerResponse
  internalTraceResponse?: KnowledgeBaseRetrievalResponse
}

type Reference = {
  type: string
  id: string
  activitySource: number
  sourceData?: any
  rerankerScore?: number
  docKey?: string
  blobUrl?: string
  toolName?: string
  serverURL?: string
  content?: string
  searchSensitivityLabelInfo?: {
    displayName: string
    sensitivityLabelId: string
    tooltip?: string
    priority?: number
    color?: string
    isEncrypted?: boolean
  }
  webUrl?: string
  url?: string
  title?: string
}

type Activity = {
  type: string
  id: number
  inputTokens?: number
  outputTokens?: number
  elapsedMs?: number
  knowledgeSourceName?: string
  queryTime?: string
  count?: number
  searchIndexArguments?: any
  azureBlobArguments?: any
  remoteSharePointArguments?: {
    search?: string
    filterExpressionAddOn?: string | null
  }
  webArguments?: {
    search?: string
    language?: string | null
    market?: string | null
    count?: number | null
    freshness?: string | null
  }
}

interface KBPlaygroundViewProps {
  preselectedAgent?: string
}


export function KBPlaygroundView({ preselectedAgent }: KBPlaygroundViewProps) {
  const [locale, setLocaleState] = useState<Locale>('en')
  useEffect(() => { setLocaleState(getLocale()) }, [])
  const text = t.foundryIQ[locale]
  const [agents, setAgents] = useState<KnowledgeAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<KnowledgeAgent | null>(null)
  const [agentsLoading, setAgentsLoading] = useState<boolean>(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [includeWebIq, setIncludeWebIq] = useState(false)
  const [comparisonRun, setComparisonRun] = useState<ComparisonRun | null>(null)
  const [webIqRetryUntil, setWebIqRetryUntil] = useState(0)
  const [webIqRetryNow, setWebIqRetryNow] = useState(0)
  const webIqRetrySeconds = Math.max(0, Math.ceil((webIqRetryUntil - webIqRetryNow) / 1000))
  useEffect(() => {
    if (!webIqRetryUntil) return
    setWebIqRetryNow(Date.now())
    const timer = window.setInterval(() => setWebIqRetryNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [webIqRetryUntil])
  const retainWebRetryDelay = (error: unknown) => {
    if (error instanceof WebIqComparisonError && error.retryAfterSeconds) {
      setWebIqRetryNow(Date.now())
      setWebIqRetryUntil(Date.now() + error.retryAfterSeconds * 1000)
    }
  }
  const webIqLanguage = locale === 'ko' ? 'ko' : 'en'
  const webIqUsage = useWebIqUsageLimit(webIqLanguage)
  const [webIqStatus, setWebIqStatus] = useState<KbWebAnswerStatus | null>(null)
  const [webIqStatusLoading, setWebIqStatusLoading] = useState(false)
  const [webIqStatusFailed, setWebIqStatusFailed] = useState(false)
  const webIqStatusController = useRef<AbortController | null>(null)
  const [webIqBotToken, setWebIqBotToken] = useState<string | null>(null)
  const [webIqBotResetKey, setWebIqBotResetKey] = useState(0)
  const webIqBotTokenRef = useRef<string | null>(null)
  const handleWebIqBotToken = useCallback((token: string | null) => {
    webIqBotTokenRef.current = token
    setWebIqBotToken(token)
  }, [])
  const resetWebIqBotCheck = useCallback(() => {
    handleWebIqBotToken(null)
    setWebIqBotResetKey(key => key + 1)
  }, [handleWebIqBotToken])
  const combinedController = useRef<AbortController | null>(null)
  const requestGeneration = useRef(0)
  const refreshWebIqStatus = async () => {
    webIqStatusController.current?.abort()
    const controller = new AbortController()
    webIqStatusController.current = controller
    setWebIqStatusLoading(true)
    setWebIqStatusFailed(false)
    try {
      const response = await fetch('/api/web-iq/answer', { signal: controller.signal, cache: 'no-store' })
      const status = await response.json()
      if (controller.signal.aborted) return
      // Usage errors still carry widget configuration, so a temporary limit cannot trap the form.
      const validStatus = status && typeof status.configured === 'boolean' && typeof status.botProtectionConfigured === 'boolean'
        && (status.turnstileSiteKey === null || typeof status.turnstileSiteKey === 'string')
      if (validStatus) setWebIqStatus(status)
      webIqUsage.responseError(response, status)
      setWebIqStatusFailed(!response.ok || !validStatus)
    } catch {
      if (!controller.signal.aborted) setWebIqStatusFailed(true)
    } finally {
      if (webIqStatusController.current === controller) {
        webIqStatusController.current = null
        setWebIqStatusLoading(false)
      }
    }
  }
  useEffect(() => {
    void refreshWebIqStatus()
    return () => {
      webIqStatusController.current?.abort()
      webIqStatusController.current = null
      combinedController.current?.abort()
      requestGeneration.current += 1
    }
  }, [])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [viewCodeOpen, setViewCodeOpen] = useState(false)
  const [insightStepIndex, setInsightStepIndex] = useState<number | null>(null)
  const [healthOpen, setHealthOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'explorer'>('chat')
  const [sourcesPanel, setSourcesPanel] = useState<{
    isOpen: boolean
    messageId: string | null
    references: Reference[]
    activity: Activity[]
    query?: string
  }>({ isOpen: false, messageId: null, references: [], activity: [] })
  const [showCostEstimates, setShowCostEstimates] = useState(() => {
    // Load from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showCostEstimates')
      return saved !== null ? saved === 'true' : false // Default to hidden
    }
    return false
  })
  const [runtimeSettings, setRuntimeSettings] = useState<{
    outputMode?: 'answerSynthesis' | 'extractiveData'
    reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high'
    globalHeaders?: Record<string, string>
    answerInstructions?: string
    retrievalInstructions?: string
    knowledgeSourceParams: Array<{
      knowledgeSourceName: string
      kind: string
      alwaysQuerySource?: boolean
      includeReferences?: boolean
      includeReferenceSourceData?: boolean
      rerankerThreshold?: number | null
      maxSubQueries?: number | null
      headers?: Record<string, string>
    }>
  }>({
    outputMode: 'answerSynthesis',
    reasoningEffort: 'low',
    globalHeaders: {},
    answerInstructions: '',
    retrievalInstructions: '',
    knowledgeSourceParams: []
  })



  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Derived insight step from index (locale-aware)
  const foundrySteps = getFoundryInsightSteps()
  const currentInsightStep = insightStepIndex !== null ? foundrySteps[insightStepIndex] : null

  // Get search endpoint from env
  const searchEndpoint = process.env.NEXT_PUBLIC_SEARCH_ENDPOINT || process.env.NEXT_PUBLIC_AZURE_SEARCH_ENDPOINT || ''

  // Save cost display preference
  const toggleCostEstimates = () => {
    const newValue = !showCostEstimates
    setShowCostEstimates(newValue)
    if (typeof window !== 'undefined') {
      localStorage.setItem('showCostEstimates', newValue.toString())
    }
  }

  // Keyboard shortcuts for insight popup navigation
  useEffect(() => {
    if (insightStepIndex === null) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInsightStepIndex(null)
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        setInsightStepIndex(prev => {
          if (prev === null) return null
          return prev < foundrySteps.length - 1 ? prev + 1 : null
        })
      } else if (e.key === 'ArrowLeft') {
        setInsightStepIndex(prev => {
          if (prev === null || prev === 0) return prev
          return prev - 1
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [insightStepIndex])

  // Load agents
  useEffect(() => {
    const loadAgents = async () => {
      try {
        setAgentsLoading(true)
          // Fetch both knowledge bases and knowledge sources
          const [kbData, ksData] = await Promise.all([
            fetchKnowledgeBases(),
            fetchKnowledgeSources()
          ])

          // Create a mapping of knowledge source name → kind
          const ksKindMap = new Map<string, string>()
          ksData.value?.forEach((ks: any) => {
            if (ks.name && ks.kind) {
              ksKindMap.set(ks.name, ks.kind)
            }
          })

          const data = kbData
        const rawAgents = data.value || []

        const agentsList = rawAgents.map(agent => ({
          id: agent.name,
          name: agent.name,
          model: agent.models?.[0]?.azureOpenAIParameters?.modelName,
            sources: (agent.knowledgeSources || []).map((ks: any) => ks.name),
          status: 'active',
          description: agent.description,
          outputConfiguration: agent.outputConfiguration,
          outputMode: agent.outputMode,
          answerInstructions: agent.answerInstructions,
          retrievalReasoningEffort: agent.retrievalReasoningEffort,
          retrievalInstructions: agent.retrievalInstructions,
            // Enrich knowledge sources with actual kind values from API
            knowledgeSources: (agent.knowledgeSources || []).map((ks: any) => ({
              ...ks,
              kind: ksKindMap.get(ks.name) || ks.kind // Use API kind or existing kind
            }))
        }))

        setAgents(agentsList)

        // Auto-select agent based on preselectedAgent prop or first agent
        if (agentsList.length > 0) {
          let agentToSelect = agentsList[0]

          // If preselectedAgent is provided, try to find it
          if (preselectedAgent) {
            const foundAgent = agentsList.find(a => a.id === preselectedAgent || a.name === preselectedAgent)
            if (foundAgent) {
              agentToSelect = foundAgent
            }
          }

          setSelectedAgent(agentToSelect)
          
          // Initialize runtime settings from the selected knowledge base defaults
          const reasoningEffort = agentToSelect.retrievalReasoningEffort?.kind || 'low'
          
          // Determine output mode from either outputMode or outputConfiguration.modality
          const outputMode = agentToSelect.outputMode || 
                            (agentToSelect.outputConfiguration?.modality as 'answerSynthesis' | 'extractiveData') || 
                            'answerSynthesis'
          
          setRuntimeSettings({
            outputMode: outputMode,
            reasoningEffort: reasoningEffort,
            globalHeaders: {},
            answerInstructions: agentToSelect.answerInstructions || agentToSelect.outputConfiguration?.answerInstructions || '',
            retrievalInstructions: agentToSelect.retrievalInstructions || '',
            knowledgeSourceParams: []
          })
          
          // Start fresh - no chat history persistence
          // loadChatHistory(agentToSelect.id)
        }
      } catch (err) {
        console.error('Failed to load agents:', err)
      } finally {
        setAgentsLoading(false)
      }
    }

    loadAgents()
  }, [preselectedAgent])

  // Watch for preselectedAgent changes and update selection
  useEffect(() => {
    if (preselectedAgent && agents.length > 0) {
      const foundAgent = agents.find(a => a.id === preselectedAgent || a.name === preselectedAgent)
      if (foundAgent && foundAgent.id !== selectedAgent?.id) {
        setSelectedAgent(foundAgent)
        setMessages([]) // Clear messages when switching agents
        
        // Use the retrievalReasoningEffort.kind directly from the knowledge base
        const reasoningEffort = foundAgent.retrievalReasoningEffort?.kind || 'low'
        
        // Determine output mode from either outputMode or outputConfiguration.modality
        const outputMode = foundAgent.outputMode || 
                          (foundAgent.outputConfiguration?.modality as 'answerSynthesis' | 'extractiveData') || 
                          'answerSynthesis'
        
        setRuntimeSettings({ // Apply knowledge base defaults when switching agents
          outputMode: outputMode,
          reasoningEffort: reasoningEffort,
          globalHeaders: {},
          answerInstructions: foundAgent.answerInstructions || foundAgent.outputConfiguration?.answerInstructions || '',
          retrievalInstructions: foundAgent.retrievalInstructions || '',
          knowledgeSourceParams: []
        })
      }
    }
  }, [preselectedAgent, agents])

  // Chat history persistence DISABLED - always start fresh
  // const loadChatHistory = (agentId: string) => {
  //   try {
  //     const stored = localStorage.getItem(`kb-playground-${agentId}`)
  //     if (stored) {
  //       const parsed = JSON.parse(stored)
  //       const messagesWithDates = parsed.map((msg: any) => ({
  //         ...msg,
  //         timestamp: new Date(msg.timestamp)
  //       }))
  //       setMessages(messagesWithDates)
  //     } else {
  //       setMessages([])
  //     }
  //   } catch (err) {
  //     console.error('Failed to load chat history:', err)
  //     setMessages([])
  //   }
  // }

  // const saveChatHistory = (agentId: string, msgs: Message[]) => {
  //   try {
  //     localStorage.setItem(`kb-playground-${agentId}`, JSON.stringify(msgs))
  //   } catch (err) {
  //     console.error('Failed to save chat history:', err)
  //   }
  // }

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Save messages when they change - DISABLED (no persistence)
  // useEffect(() => {
  //   if (selectedAgent && messages.length > 0) {
  //     saveChatHistory(selectedAgent.id, messages)
  //   }
  // }, [messages, selectedAgent])

  // Load conversation starters for the selected agent
  const { starters, isGeneralFallback: isGeneral } = useConversationStarters(selectedAgent?.id)

  // Voice input handler
  const handleVoiceInput = (transcript: string) => {
    setInput(prev => prev + (prev ? ' ' : '') + transcript)
    textareaRef.current?.focus()
  }

  const buildKnowledgeSourceParams = () => {
    const userOverrides = runtimeSettings.knowledgeSourceParams && runtimeSettings.knowledgeSourceParams.length > 0
      ? runtimeSettings.knowledgeSourceParams
      : null

    const attachedParams = (selectedAgent?.knowledgeSources || []).map(ks => ({
      knowledgeSourceName: ks.name,
      kind: ks.kind,
      alwaysQuerySource: ks.alwaysQuerySource ?? undefined,
      includeReferences: ks.includeReferences ?? true,
      includeReferenceSourceData: ks.includeReferenceSourceData ?? true,
      rerankerThreshold: ks.rerankerThreshold ?? undefined,
      maxSubQueries: ks.maxSubQueries ?? undefined,
      headers: ks.headers
    }))
    const baseParams = includeWebIq
      ? attachedParams.map(param => ({ ...param, ...userOverrides?.find(override => override.knowledgeSourceName === param.knowledgeSourceName) }))
      : userOverrides || attachedParams

    if (!baseParams || baseParams.length === 0) {
      return undefined
    }

    return baseParams
      .map((param) => {
        const name = param.knowledgeSourceName || (param as any).name
        if (!name) {
          return null
        }

        const cleanedParam: any = {
          knowledgeSourceName: name,
          kind: param.kind || 'searchIndex'
        }

        if (param.alwaysQuerySource === true) cleanedParam.alwaysQuerySource = true
        cleanedParam.includeReferences = includeWebIq || param.includeReferences !== false
        cleanedParam.includeReferenceSourceData = includeWebIq || param.includeReferenceSourceData !== false

        if (typeof param.rerankerThreshold === 'number') cleanedParam.rerankerThreshold = param.rerankerThreshold
        if (typeof param.maxSubQueries === 'number') cleanedParam.maxSubQueries = param.maxSubQueries

        if (param.headers && Object.keys(param.headers).length > 0) {
          cleanedParam.headers = param.headers
        }

        return cleanedParam
      })
      .filter(Boolean)
  }

  const checkCombinedReadiness = async (query: string, signal: AbortSignal) => {
    if (!includeWebIq) return null
    webIqUsage.assertAvailable()
    if (!isAllowedWebIqQuestion(query)) throw new Error(locale === 'ko' ? '화면에 있는 Web IQ 체험 질문을 선택해 주세요.' : 'Choose one of the available Web IQ demo questions.')
    if (query.trim().length < 3 || query.trim().length > 1000) throw new Error(locale === 'ko' ? 'Web IQ 검색에 사용할 질문을 3~1,000자로 입력해 주세요.' : 'Web IQ queries must contain 3–1,000 characters.')
    const token = webIqBotTokenRef.current
    if (!token) throw new Error(locale === 'ko' ? '사람 확인을 마친 다음 다시 보내 주세요.' : 'Complete the human verification, then send your question again.')
    // Reserve one token for this run before any knowledge-base retrieval starts.
    handleWebIqBotToken(null)
    let status: KbWebAnswerStatus
    try {
      const response = await fetch('/api/web-iq/answer', { cache: 'no-store', signal })
      status = await response.json()
      const usageError = webIqUsage.responseError(response, status)
      if (usageError) throw usageError
      if (!response.ok) throw new Error('Configuration unavailable')
      if (!status || typeof status.configured !== 'boolean') throw new Error('Invalid configuration')
    } catch (error) {
      if (signal.aborted) throw error
      if (error instanceof Error && error.name === 'WebIqUsageLimitError') throw error
      throw new Error(locale === 'ko' ? 'Web IQ 연결 설정을 확인하지 못했습니다. 다시 시도해 주세요.' : 'Could not check Web IQ configuration. Try again.')
    }
    if (signal.aborted) return null
    setWebIqStatus(status)
    if (!status.botProtectionConfigured || !status.turnstileSiteKey) throw new Error(locale === 'ko' ? '사람 확인 기능을 준비 중입니다. 잠시 후 다시 시도하거나 KB만 사용해 주세요.' : 'Human verification is unavailable. Try again later or use the selected KB only.')
    if (!status.configured) throw new Error(locale === 'ko' ? 'Web IQ와 Azure OpenAI 답변 모델의 연결 설정이 필요합니다. 설정을 마치거나 KB만 사용해 질문해 주세요.' : 'Combined Web IQ answers are not configured. Configure Web IQ and an Azure OpenAI answer deployment, or use the selected KB only.')
    return token
  }

  const addWebEvidence = async (query: string, response: KnowledgeBaseRetrievalResponse, signal: AbortSignal, turnstileToken: string | null, kbRequestStarted: number, startedAt: string) => {
    if (!includeWebIq) return { ...response, webIq: undefined, internalTraceResponse: undefined }
    const snapshot = structuredClone(response)
    const context = buildKbWebContext(snapshot)
    const generation = requestGeneration.current
    const run: ComparisonRun = {
      runId: crypto.randomUUID(), attemptId: crypto.randomUUID(), startedAt, kbRequestWallMs: Math.round(performance.now() - kbRequestStarted),
      selection: { kbId: selectedAgent!.id, presetId: WEB_IQ_DEMO_QUESTIONS.find(item => item[webIqLanguage] === query)?.id || '', query, language: webIqLanguage, settings: structuredClone(runtimeSettings) },
      state: context.usable ? 'retrieving-web' : 'blocked_empty', internalTraceResponse: snapshot,
    }
    // Publish the original immediately; later web failures cannot remove it.
    setComparisonRun(run)
    if (!context.usable) { setComparisonRun({ ...run, comparisonWallMs: Math.round(performance.now() - kbRequestStarted) }); return { ...snapshot, webIq: undefined, internalTraceResponse: snapshot } }
    let result: KbWebAnswerResponse
    try {
      result = await requestWebIqAnswer(query, snapshot, turnstileToken || '', signal)
      if (generation !== requestGeneration.current || signal.aborted) return { ...snapshot, webIq: undefined, internalTraceResponse: snapshot }
      setComparisonRun({ ...run, state: 'complete', combined: result, comparisonWallMs: Math.round(performance.now() - kbRequestStarted) })
    } catch (error) {
      if (generation === requestGeneration.current) { retainWebRetryDelay(error); setComparisonRun({ ...run, comparisonWallMs: Math.round(performance.now() - kbRequestStarted), retryAfterSeconds: error instanceof WebIqComparisonError ? error.retryAfterSeconds : undefined, state: signal.aborted ? 'cancelled' : 'partial', errorCode: signal.aborted ? 'CANCELLED' : error instanceof WebIqComparisonError ? error.code : 'REQUEST_FAILED' }) }
      return { ...snapshot, webIq: undefined, internalTraceResponse: snapshot }
    }
    const references = result.sources.map((source, index) => source.origin === 'internal'
      ? { ...context.internalReferences[Number(source.id.slice(1)) - 1], id: String(index), title: `KB · ${source.title}`, sourceData: { ...context.internalReferences[Number(source.id.slice(1)) - 1]?.sourceData, title: `KB · ${source.title}` } }
      : { type: 'web' as const, id: String(index), activitySource: -1, title: `Web · ${source.title}`, url: source.url || '', sourceData: { title: `Web · ${source.title}`, content: source.content } })
    return {
      response: [{ role: 'assistant' as const, content: [{ type: 'text' as const, text: result.answer }] }],
      references, activity: snapshot.activity, webIq: result, internalTraceResponse: snapshot,
    }
  }

  const retryComparisonWeb = async () => {
    if (!comparisonRun?.internalTraceResponse || isLoading || webIqRetrySeconds > 0 || !webIqBotTokenRef.current || comparisonRun.selection.kbId !== selectedAgent?.id || comparisonRun.selection.language !== webIqLanguage || JSON.stringify(comparisonRun.selection.settings) !== JSON.stringify(runtimeSettings)) return
    const generation = requestGeneration.current
    const controller = new AbortController()
    combinedController.current = controller
    const freshToken = webIqBotTokenRef.current
    handleWebIqBotToken(null)
    setIsLoading(true)
    const run = { ...comparisonRun, attemptId: crypto.randomUUID(), state: 'retrieving-web' as const, errorCode: undefined }
    setComparisonRun(run)
    const attemptStarted = performance.now()
    try {
      const combined = await requestWebIqAnswer(run.selection.query, run.internalTraceResponse!, freshToken, controller.signal)
      if (generation === requestGeneration.current && !controller.signal.aborted) setComparisonRun({ ...run, state: 'complete', combined, webAttemptWallMs: Math.round(performance.now() - attemptStarted) })
    } catch (error) {
      if (generation === requestGeneration.current) { retainWebRetryDelay(error); setComparisonRun({ ...run, webAttemptWallMs: Math.round(performance.now() - attemptStarted), retryAfterSeconds: error instanceof WebIqComparisonError ? error.retryAfterSeconds : undefined, state: controller.signal.aborted ? 'cancelled' : 'partial', errorCode: controller.signal.aborted ? 'CANCELLED' : error instanceof WebIqComparisonError ? error.code : 'REQUEST_FAILED' }) }
    } finally {
      if (generation === requestGeneration.current) { setIsLoading(false); resetWebIqBotCheck() }
    }
  }

  const changeEvidenceMode = (enabled: boolean) => {
    if (isLoading || enabled === includeWebIq) return
    const lastQuestion = [...messages].reverse().find(message => message.role === 'user')?.content.find(content => content.type === 'text')
    if (!input.trim() && lastQuestion?.type === 'text') setInput(lastQuestion.text)
    resetWebIqBotCheck()
    setIncludeWebIq(enabled)
    setComparisonRun(null)
    setMessages([])
    setSourcesPanel({ isOpen: false, messageId: null, references: [], activity: [] })
  }

  const sendPrompt = async (prompt: string, starterId?: string | null) => {
    if (!selectedAgent || isLoading) return

    const contentParts: MessageContent[] = [{ type: 'text', text: prompt }]

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: contentParts,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setComparisonRun(null)
    const generation = ++requestGeneration.current
    combinedController.current?.abort()
    const controller = new AbortController()
    combinedController.current = controller

    try {
      const turnstileToken = await checkCombinedReadiness(prompt, controller.signal)
      if (generation !== requestGeneration.current || controller.signal.aborted) return
      const azureMessages = [
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content.filter(c => c.type === 'text').map(c => ({ type: 'text', text: (c as { type: 'text'; text: string }).text }))
        })),
        {
          role: 'user' as const,
          content: contentParts.filter(c => c.type === 'text').map(c => ({ type: 'text', text: (c as { type: 'text'; text: string }).text }))
        }
      ]

      // Transform runtime settings to match API expectations
      const apiParams: any = {
        includeActivity: true  // Always include activity for retrieval journey
      }

      // Add global headers if present
      if (runtimeSettings.globalHeaders && Object.keys(runtimeSettings.globalHeaders).filter(k => k && runtimeSettings.globalHeaders![k]).length > 0) {
        apiParams.globalHeaders = runtimeSettings.globalHeaders
      }

      if (runtimeSettings.outputMode) {
        apiParams.outputMode = runtimeSettings.outputMode
      }

      if (runtimeSettings.reasoningEffort) {
        // Azure API expects an object with 'kind' property, not a string
        apiParams.retrievalReasoningEffort = {
          kind: runtimeSettings.reasoningEffort
        }
      }

      const knowledgeSourceParams = buildKnowledgeSourceParams()
      if (knowledgeSourceParams && knowledgeSourceParams.length > 0) {
        apiParams.knowledgeSourceParams = knowledgeSourceParams
      }

      const retrieveRequest = buildKbRetrieveRequest(prompt, azureMessages, apiParams)
      const kbRequestStarted = performance.now()
      const runStartedAt = new Date().toISOString()
      const kbResponse = await retrieveFromKnowledgeBase(selectedAgent.id, retrieveRequest.messages, retrieveRequest.params, controller.signal)
      if (generation !== requestGeneration.current) return
      const response = await addWebEvidence(prompt, kbResponse, controller.signal, turnstileToken, kbRequestStarted, runStartedAt)
      if (generation !== requestGeneration.current) return


      // Use the starterId passed directly as a parameter — avoids stale state reads
      const capturedStarterId = starterId ?? null

      let contentItems: MessageContent[] = []
      if (response.response && response.response.length > 0) {
        const rc = response.response[0].content || []
        for (const c of rc) {
          if (capturedStarterId) {
            // For starter-triggered requests: strip KB-returned images (non-deterministic)
            // and accumulate text only; the starter image will be prepended below.
            if ((c as any).type !== 'image') {
              const text = (c as any).text || ''
              if (text) {
                const cleaned = stripImagesFromText(text)
                if (cleaned) contentItems.push({ type: 'text', text: cleaned })
              }
            }
          } else {
            // Free-text requests: keep existing behaviour (images + text as-is)
            if ((c as any).type === 'image' && (c as any).image?.url) {
              contentItems.push({ type: 'image', image: { url: proxyBlobUrl((c as any).image.url) } })
            } else {
              const text = (c as any).text || ''
              if (text) contentItems.push(...parseImagesFromText(text))
            }
          }
        }
      }

      // Prepend the starter-mapped image when a starter was clicked
      if (capturedStarterId) {
        const starter = findStarterById(capturedStarterId)
        if (starter?.imageUrl) {
          contentItems.unshift({
            type: 'image',
            image: { url: proxyBlobUrl(starter.imageUrl), alt: starter.imageAlt }
          })
        }
      }

      if (contentItems.length === 0) {
        contentItems = [{ type: 'text', text: 'I apologize, but I was unable to generate a response.' }]
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: contentItems,
        timestamp: new Date(),
        references: response.references || [],
        activity: response.activity || [],
        webIq: response.webIq,
        internalTraceResponse: response.internalTraceResponse,
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      if (generation !== requestGeneration.current) return
      
      // Extract meaningful error message
      let errorText = locale === 'ko' ? '요청을 처리하지 못했습니다. 다시 시도해 주세요.' : 'Error processing request. Please try again.'
      if (err instanceof Error) {
        errorText = `❌ ${locale === 'ko' ? '오류' : 'Error'}: ${err.message}`
      } else if (typeof err === 'string') {
        errorText = `❌ ${locale === 'ko' ? '오류' : 'Error'}: ${err}`
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: [{ type: 'text', text: errorText }],
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      if (combinedController.current === controller) combinedController.current = null
      if (generation === requestGeneration.current) {
        if (includeWebIq) resetWebIqBotCheck()
        setIsLoading(false)
      }
    }
  }

  const handleAgentChange = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    if (agent) {
      requestGeneration.current += 1
      combinedController.current?.abort()
      resetWebIqBotCheck()
      setIsLoading(false)
      setIncludeWebIq(false)
      setSelectedAgent(agent)
      setComparisonRun(null)
      // Always start fresh - no history loading
      setMessages([])

      // Apply knowledge base defaults from API when switching agents
      const reasoningEffort = agent.retrievalReasoningEffort?.kind || 'low'
      const outputMode = agent.outputMode ||
                        (agent.outputConfiguration?.modality as 'answerSynthesis' | 'extractiveData') ||
                        'answerSynthesis'

      setRuntimeSettings({
        outputMode: outputMode,
        reasoningEffort: reasoningEffort,
        globalHeaders: {},
        answerInstructions: agent.answerInstructions || agent.outputConfiguration?.answerInstructions || '',
        retrievalInstructions: agent.retrievalInstructions || '',
        knowledgeSourceParams: [] // Will be populated by RuntimeSettingsPanel from agent.knowledgeSources
      })
    }
  }

  const handleClearChat = () => {
    setComparisonRun(null)
    requestGeneration.current += 1
    combinedController.current?.abort()
    if (includeWebIq) resetWebIqBotCheck()
    setIsLoading(false)
    // Simply clear the messages array - no localStorage involvement
    setMessages([])
    // Also close sources panel when clearing chat
    setSourcesPanel({ isOpen: false, messageId: null, references: [], activity: [] })
  }

  const handleOpenSourcesPanel = (messageId: string, references: Reference[], activity: Activity[], query?: string) => {
    setSourcesPanel({
      isOpen: true,
      messageId,
      references,
      activity,
      query
    })
  }

  const handleCloseSourcesPanel = () => {
    setSourcesPanel(prev => ({ ...prev, isOpen: false }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !selectedAgent || isLoading) return

    const contentParts: MessageContent[] = [{ type: 'text', text: input }]

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: contentParts,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setComparisonRun(null)
    const generation = ++requestGeneration.current
    combinedController.current?.abort()
    const controller = new AbortController()
    combinedController.current = controller

    try {
      const turnstileToken = await checkCombinedReadiness(input, controller.signal)
      if (generation !== requestGeneration.current || controller.signal.aborted) return
      const azureMessages = [
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content.filter(c => c.type === 'text').map(c => ({ type: 'text', text: (c as { type: 'text'; text: string }).text }))
        })),
        {
          role: 'user' as const,
          content: contentParts.filter(c => c.type === 'text').map(c => ({ type: 'text', text: (c as { type: 'text'; text: string }).text }))
        }
      ]

      // Transform runtime settings to match API expectations
      const apiParams: any = {
        includeActivity: true  // Always include activity for retrieval journey
      }

      // Add global headers if present
      if (runtimeSettings.globalHeaders && Object.keys(runtimeSettings.globalHeaders).filter(k => k && runtimeSettings.globalHeaders![k]).length > 0) {
        apiParams.globalHeaders = runtimeSettings.globalHeaders
      }

      if (runtimeSettings.outputMode) {
        apiParams.outputMode = runtimeSettings.outputMode
      }

      if (runtimeSettings.reasoningEffort) {
        // Azure API expects an object with 'kind' property, not a string
        apiParams.retrievalReasoningEffort = {
          kind: runtimeSettings.reasoningEffort
        }
      }

      const knowledgeSourceParamsSubmit = buildKnowledgeSourceParams()
      if (knowledgeSourceParamsSubmit && knowledgeSourceParamsSubmit.length > 0) {
        apiParams.knowledgeSourceParams = knowledgeSourceParamsSubmit
      }

      const retrieveRequest = buildKbRetrieveRequest(input, azureMessages, apiParams)
      const kbRequestStarted = performance.now()
      const runStartedAt = new Date().toISOString()
      const kbResponse = await retrieveFromKnowledgeBase(selectedAgent.id, retrieveRequest.messages, retrieveRequest.params, controller.signal)
      if (generation !== requestGeneration.current) return
      const response = await addWebEvidence(input, kbResponse, controller.signal, turnstileToken, kbRequestStarted, runStartedAt)
      if (generation !== requestGeneration.current) return


      let contentItems: MessageContent[] = []
      if (response.response && response.response.length > 0) {
        const rc = response.response[0].content || []
        for (const c of rc) {
          if ((c as any).type === 'image' && (c as any).image?.url) {
            contentItems.push({ type: 'image', image: { url: proxyBlobUrl((c as any).image.url) } })
          } else {
            const text = (c as any).text || ''
            if (text) contentItems.push(...parseImagesFromText(text))
          }
        }
      }
      if (contentItems.length === 0) {
        contentItems = [{ type: 'text', text: 'I apologize, but I was unable to generate a response.' }]
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: contentItems,
        timestamp: new Date(),
        references: response.references || [],
        activity: response.activity || [],
        webIq: response.webIq,
        internalTraceResponse: response.internalTraceResponse,
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      if (generation !== requestGeneration.current) return
      
      // Extract meaningful error message
      let errorText = locale === 'ko' ? '요청을 처리하지 못했습니다. 다시 시도해 주세요.' : 'Error processing request. Please try again.'
      if (err instanceof Error) {
        errorText = `❌ ${locale === 'ko' ? '오류' : 'Error'}: ${err.message}`
      } else if (typeof err === 'string') {
        errorText = `❌ ${locale === 'ko' ? '오류' : 'Error'}: ${err}`
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: [{ type: 'text', text: errorText }],
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      if (combinedController.current === controller) combinedController.current = null
      if (generation === requestGeneration.current) {
        if (includeWebIq) resetWebIqBotCheck()
        setIsLoading(false)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  if (agentsLoading) {
    return (
      <div className="h-[calc(100vh-7rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="h-8 w-8 border-2 border-fg-muted border-t-transparent rounded-full animate-spin" aria-label="Loading agents" />
          </div>
          <p className="text-sm text-fg-muted">Loading knowledge bases…</p>
        </div>
      </div>
    )
  }

  if (!selectedAgent) {
    return (
      <div className="h-[calc(100vh-7rem)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">No knowledge bases found</h2>
          <p className="text-fg-muted">Please create a knowledge base to start testing.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-stroke-divider p-4 sm:p-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex w-full min-w-0 flex-1 items-center gap-3 sm:gap-4">
              <AgentAvatar size={44} iconSize={22} variant="subtle" title={selectedAgent.name} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-semibold text-xl truncate">{text.title}</h1>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Select value={selectedAgent.id} onValueChange={handleAgentChange}>
                      <SelectTrigger className="w-full min-w-0 sm:w-[280px]">
                        <SelectValue placeholder={text.selectKB} />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-fg-muted">•</span>
                    <span className="text-sm text-fg-muted">{selectedAgent.sources.length} source{selectedAgent.sources.length !== 1 && 's'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <Link
                href="/architecture"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[11px] text-fg-subtle hover:text-fg-muted transition-all"
                title="View architecture diagram"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                Architecture
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHealthOpen(!healthOpen)}
                title="Toggle service health"
              >
                ● Health
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInsightStepIndex(0)}
                title="Show demo insights"
              >
                💡 Insights
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewCodeOpen(true)}
                aria-label="View code"
                title="View code to reproduce this conversation"
              >
                <Code20Regular className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearChat}
                disabled={messages.length === 0}
                aria-label="Reset chat"
                title="Reset conversation"
              >
                <ArrowCounterclockwise20Regular className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsOpen(!settingsOpen)}
                aria-label="Settings"
              >
                <Settings20Regular className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 border-b border-stroke-divider px-4">
          <button
            className={cn('px-3 py-2 text-sm transition-colors', activeTab === 'chat' ? 'border-b-2 border-accent text-fg-default font-medium' : 'text-fg-muted hover:text-fg-default')}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          <button
            className={cn('px-3 py-2 text-sm transition-colors', activeTab === 'explorer' ? 'border-b-2 border-accent text-fg-default font-medium' : 'text-fg-muted hover:text-fg-default')}
            onClick={() => setActiveTab('explorer')}
          >
            Data Explorer
          </button>
        </div>

        {activeTab === 'explorer' ? (
          <DataExplorer agentId={selectedAgent?.id || preselectedAgent} />
        ) : (
        <>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {includeWebIq && !comparisonRun && <WebIqServiceLinks features={['kb-retrieval', 'web-search', 'answer-synthesis']} locale={webIqLanguage} />}
            {includeWebIq && comparisonRun && <div className="min-w-0 space-y-3"><WebIqAnswerComparison key={comparisonRun.runId} run={comparisonRun} language={webIqLanguage} />{isLoading && <Button variant="outline" onClick={() => { combinedController.current?.abort(); setComparisonRun(value => value ? { ...value, state: 'cancelled', errorCode: 'CANCELLED' } : null); }}>{locale === 'ko' ? '웹 단계 취소' : 'Cancel web step'}</Button>}{['partial', 'cancelled'].includes(comparisonRun.state) && <Button variant="outline" disabled={isLoading || !webIqBotToken || webIqRetrySeconds > 0} onClick={() => void retryComparisonWeb()}>{locale === 'ko' ? '웹 단계 재시도 · 새 유료 요청' : 'Retry web step · new paid request'}</Button>}</div>}
          {/* Service Health Panel */}
          {healthOpen && (
            <ServiceHealthPanel className="mb-4" />
          )}
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block mb-6">
                <AgentAvatar size={64} iconSize={32} variant="subtle" title={selectedAgent.name} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Start testing your knowledge base</h3>
              <p className="text-fg-muted max-w-md mx-auto mb-3">
                Ask questions to test how your knowledge base retrieves and synthesizes information from your sources.
              </p>

              {/* Dynamic Conversation Starters */}
              {includeWebIq ? <p className="text-sm text-fg-muted">{locale === 'ko' ? '아래에서 Web IQ 체험 질문을 골라 주세요.' : 'Choose a Web IQ demo question below.'}</p> : isGeneral ? (
                <div className="max-w-xl mx-auto mt-6">
                  <Card className="bg-bg-subtle border-dashed border-stroke-divider">
                    <CardContent className="p-6 text-left">
                      <div className="text-sm font-medium mb-2">No domain-specific starters yet</div>
                      <p className="text-xs text-fg-muted mb-4">Create or configure a knowledge base with domain sources to see tailored prompts here.</p>
                      <div className="space-y-2">
                        {["Summarize key themes across the most recent documents.", "What gaps or missing details should I clarify next?"].map((g, i) => (
                          <button
                            key={i}
                            onClick={() => sendPrompt(g)}
                            disabled={isLoading}
                            className="w-full text-left p-3 rounded-md bg-bg-card hover:bg-bg-hover transition text-xs border border-stroke-divider disabled:opacity-60"
                          >{g}</button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
                  {starters.map((s, idx) => (
                      <Card
                        key={idx}
                        className={cn('relative cursor-pointer hover:elevation-sm hover:scale-105 transition-all duration-150 bg-bg-card border border-stroke-divider active:scale-95')}
                        onClick={() => {
                          if (s.imageUrl) {
                            // Starter has a mapped image — pass starterId directly to avoid stale state
                            sendPrompt(s.prompt, s.id)
                          } else {
                            // No mapped image — populate input field as before
                            setInput(s.prompt)
                            textareaRef.current?.focus()
                          }
                        }}
                      >
                        <CardContent className="p-4 text-left space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-[11px] uppercase tracking-wide text-fg-muted font-medium">{s.complexity}</div>
                            <div className="flex items-center gap-1">
                              {s.complexity === 'Advanced' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-subtle text-accent">Multi-source</span>}
                            </div>
                          </div>
                          <div className="text-sm font-medium leading-snug">{s.label}</div>
                          <p className="text-xs text-fg-muted leading-snug">{s.prompt}</p>
                        </CardContent>
                      </Card>
                    ))}

                </div>
              )}
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                locale={locale}
                agent={selectedAgent}
                showCostEstimates={showCostEstimates}
                onOpenSources={(refs, activity, query) => handleOpenSourcesPanel(message.id, refs, activity, query)}
              />
            ))
          )}

          {isLoading && (
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-full bg-accent-subtle">
                <Bot20Regular className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={cn('border-t border-stroke-divider p-6', includeWebIq && 'max-h-[50dvh] shrink-0 overflow-y-auto')}>
          {messages.length > 0 && (
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => {
                  handleClearChat()
                  setInput('')
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-fg-muted hover:text-fg-default border border-stroke-divider rounded-lg hover:bg-bg-subtle transition-colors"
                title="New conversation"
              >
                <ArrowReset20Regular className="w-4 h-4" />
                <span className="hidden sm:inline">New Chat</span>
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset className="space-y-2" disabled={isLoading}>
              <legend className="mb-2 text-xs font-medium text-fg-muted">{locale === 'ko' ? '답변에 사용할 근거' : 'Answer evidence'}</legend>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant={includeWebIq ? 'outline' : 'default'} aria-pressed={!includeWebIq} onClick={() => changeEvidenceMode(false)}>
                  {selectedAgent.knowledgeSources?.some(source => source.kind === 'web') ? (locale === 'ko' ? '선택한 KB만' : 'Selected KB only') : (locale === 'ko' ? '내부 지식만' : 'Internal only')}
                </Button>
                <Button type="button" size="sm" variant={includeWebIq ? 'default' : 'outline'} aria-pressed={includeWebIq} onClick={() => changeEvidenceMode(true)}>
                  {locale === 'ko' ? '내부 지식 + Web IQ' : 'Internal + Web IQ'}
                </Button>
              </div>
              {includeWebIq && <p className="text-xs text-fg-muted" role="status">
                {webIqStatusLoading
                  ? (locale === 'ko' ? 'Web IQ 연결을 확인하고 있습니다.' : 'Checking the Web IQ connection.')
                  : webIqStatusFailed && !webIqUsage.message
                  ? (locale === 'ko' ? 'Web IQ 연결을 확인하지 못했습니다. 아래에서 다시 확인해 주세요.' : 'Could not check the Web IQ connection. Check again below.')
                  : webIqStatus?.botProtectionConfigured === false
                  ? (locale === 'ko' ? '사람 확인 기능을 준비 중입니다. 지금은 KB만 사용해 주세요.' : 'Human verification is unavailable. Use the selected KB only for now.')
                  : webIqStatus?.configured === false
                  ? (locale === 'ko' ? 'Web IQ와 답변 모델 연결이 필요합니다. 설정 전에는 웹 답변을 생성하지 않습니다.' : 'Web IQ and the answer model need configuration before combined answers can run.')
                  : (locale === 'ko' ? '같은 질문으로 공개 웹을 검색하고, KB와 웹 근거를 구분해 답변합니다.' : 'Search the public web with this question, then answer with KB and web sources identified separately.')}
              </p>}
              {includeWebIq && (webIqStatusFailed || !webIqStatus?.configured) && <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={webIqStatusLoading || webIqUsage.remainingSeconds > 0}
                onClick={() => void refreshWebIqStatus()}
              >
                {webIqStatusLoading ? (locale === 'ko' ? '확인 중…' : 'Checking…') : (locale === 'ko' ? '연결 다시 확인' : 'Check again')}
              </Button>}
              {runtimeSettings.reasoningEffort === 'minimal' && <p className="text-xs text-fg-muted">{locale === 'ko' ? 'Minimal 검색은 의미 기반 intents로 원문 근거를 반환합니다.' : 'Minimal retrieval uses semantic intents and returns source passages.'}</p>}
            </fieldset>
            {includeWebIq && <fieldset className="space-y-2" disabled={isLoading}>
              <legend className="text-xs font-medium text-fg-muted">{locale === 'ko' ? '체험 질문 선택' : 'Choose a demo question'}</legend>
              <div className="flex flex-wrap gap-2">
                {WEB_IQ_DEMO_QUESTIONS.map(question => <Button key={question.id} type="button" size="sm" variant={input === question[webIqLanguage] ? 'default' : 'outline'} className="h-auto whitespace-normal text-left" aria-pressed={input === question[webIqLanguage]} onClick={() => { setComparisonRun(null); setInput(question[webIqLanguage]) }}>{question[webIqLanguage]}</Button>)}
              </div>
              <p className="text-xs text-fg-muted">{locale === 'ko' ? '예시 질문으로 실제 웹 근거를 확인합니다. Web IQ 체험은 IP당 최근 2분간 100회, 모든 방문자 합계 하루 $5까지 이용할 수 있습니다.' : 'Try a curated question with real web evidence. Web IQ allows 100 requests per IP per rolling 2 minutes, within a shared $5 daily allowance.'}</p>
            </fieldset>}
            {includeWebIq && webIqStatus?.botProtectionConfigured && webIqStatus.turnstileSiteKey && !isLoading && <WebIqBotCheck
              siteKey={webIqStatus.turnstileSiteKey}
              action="webiq_answer"
              language={webIqLanguage}
              onTokenChange={handleWebIqBotToken}
              resetKey={webIqBotResetKey}
            />}
            {includeWebIq && webIqRetrySeconds > 0 && <p role="status" className="text-xs text-fg-muted">{locale === 'ko' ? '서버 재시도 대기 시간' : 'Server retry delay remaining'}: {webIqRetrySeconds}s</p>}
            {includeWebIq && webIqUsage.message && <p role="status" className="text-sm text-fg-muted">{webIqUsage.message}</p>}
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={text.queryPlaceholder}
                className="min-h-[60px] max-h-[200px] resize-none pr-24"
                disabled={isLoading}
                readOnly={includeWebIq}
              />
              <div className="absolute bottom-3 right-3 flex gap-1">
                <VoiceInput
                  onTranscript={handleVoiceInput}
                  disabled={isLoading || includeWebIq}
                />
                <Button
                  type="submit"
                  size="icon"
                  aria-label={locale === 'ko' ? '보내기' : 'Send'}
                  className="h-11 w-11"
                  disabled={!input.trim() || isLoading || (includeWebIq && (!webIqStatus?.configured || !webIqBotToken || webIqUsage.remainingSeconds > 0 || webIqRetrySeconds > 0 || !isAllowedWebIqQuestion(input)))}
                >
                  <Send20Regular className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-fg-muted">
              {includeWebIq ? (locale === 'ko' ? '질문을 선택하고 사람 확인을 마친 다음 보내기 버튼을 누르세요.' : 'Select a question, complete human verification, then press Send.') : 'Press Enter to send, Shift+Enter for new line. Click mic for voice input.'}
            </p>
          </form>
        </div>
        </>
        )}
      </div>

      {/* Sources Panel - Perplexity-style side panel */}
      <SourcesPanel
        isOpen={sourcesPanel.isOpen}
        onClose={handleCloseSourcesPanel}
        references={sourcesPanel.references as any}
        activity={sourcesPanel.activity as any}
        query={sourcesPanel.query}
        messageId={sourcesPanel.messageId || ''}
      />

      {/* Insight Popup - fixed bottom-right */}
      {currentInsightStep && (
        <div className="fixed bottom-6 right-6 z-40 w-80">
          <InsightPopup
            step={currentInsightStep}
            totalSteps={foundrySteps.length}
            onDismiss={() => setInsightStepIndex(null)}
            onNext={() => setInsightStepIndex(prev => prev !== null && prev < foundrySteps.length - 1 ? prev + 1 : null)}
            onPrev={() => setInsightStepIndex(prev => prev !== null && prev > 0 ? prev - 1 : prev)}
          />
        </div>
      )}

      {/* Right Drawer - Settings Panel */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="border-l border-stroke-divider bg-bg-card overflow-hidden"
          >
            <div className="h-full overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold">Runtime Settings</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSettingsOpen(false)}
                  >
                    <Dismiss20Regular className="h-4 w-4" />
                  </Button>
                </div>

                {/* Runtime Settings Panel */}
                <RuntimeSettingsPanel
                  knowledgeSources={selectedAgent.knowledgeSources || []}
                  settings={runtimeSettings}
                  onSettingsChange={settings => { setRuntimeSettings(settings); setComparisonRun(null); requestGeneration.current += 1; combinedController.current?.abort(); setIsLoading(false) }}
                  hasWebSource={selectedAgent.knowledgeSources?.some(ks => ks.name?.toLowerCase().includes('web')) || false}
                />

                {/* Display Settings */}
                <div className="pt-6 mt-6 border-t border-stroke-divider">
                  <h4 className="text-sm font-medium mb-3">Display Options</h4>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex-1">
                        <div className="text-sm text-fg-default group-hover:text-accent transition-colors">
                          Show cost estimates
                        </div>
                        <div className="text-xs text-fg-muted">
                          Display estimated Azure AI Search costs per query
                        </div>
                        <a
                          href="https://azure.microsoft.com/pricing/details/search/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          Learn More
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showCostEstimates}
                        onClick={toggleCostEstimates}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
                          showCostEstimates ? "bg-accent" : "bg-bg-subtle border border-stroke-divider"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-bg-canvas shadow transition-transform",
                            showCostEstimates ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </button>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Code Modal */}
      {selectedAgent && (
        <KBViewCodeModal
          isOpen={viewCodeOpen}
          onClose={() => setViewCodeOpen(false)}
          agentId={selectedAgent.id}
          agentName={selectedAgent.name}
          messages={messages}
          searchEndpoint={searchEndpoint}
          runtimeSettings={runtimeSettings}
        />
      )}
    </div>
  )
}

function MessageBubble({ message, locale, agent, showCostEstimates, onOpenSources }: {
  message: Message
  locale: Locale
  agent?: KnowledgeAgent
  showCostEstimates?: boolean
  onOpenSources?: (refs: Reference[], activity: Activity[], query?: string) => void
}) {
  const isUser = message.role === 'user'
  const [traceExpanded, setTraceExpanded] = useState(false)

  // Check if we have trace data (new format)
  const hasTraceData = message.activity && message.activity.length > 0 && message.references

  // Filter out MCP tool calls from regular references
  const regularRefs = message.references?.filter(ref => ref.type !== 'mcpTool') || []

  // Extract MCP tool calls from references
  const mcpToolCalls = message.references?.filter(ref => ref.type === 'mcpTool').map(ref => ({
    toolName: ref.toolName || '',
    serverURL: ref.serverURL || '',
    ref_id: parseInt(ref.id) || 0,
    title: ref.sourceData?.title || '',
    content: ref.sourceData?.content || ''
  })) || []

  return (
    <div
      className={cn('flex items-start gap-4', isUser && 'flex-row-reverse')}
    >
      <div className={cn(
        'p-2 rounded-full',
        isUser ? 'bg-bg-subtle' : 'bg-accent-subtle'
      )}>
        {isUser ? (
          <Person20Regular className="h-4 w-4" />
        ) : (
          <Bot20Regular className="h-4 w-4 text-accent" />
        )}
      </div>

      <div className={cn('flex-1 max-w-[80%] min-w-0', isUser && 'flex justify-end')}>
        <div className={cn(
          'rounded-lg p-4 overflow-hidden',
          isUser
            ? 'bg-accent text-fg-on-accent ml-12'
            : 'bg-bg-card border border-stroke-divider'
        )}>
          <div className="prose prose-sm max-w-none space-y-3 overflow-x-auto">
            {message.content.map((content, index) => {
              if (content.type === 'image') {
                const altText = content.image.alt || 'NASA satellite observation'
                const caption = content.image.alt || 'NASA Earth Observation — click to enlarge'
                return (
                  <div key={index} className="my-4 group relative">
                    <div className="rounded-xl overflow-hidden border border-glass-border shadow-md hover:shadow-xl transition-shadow duration-300 bg-bg-elevated">
                      <img
                        src={content.image.url}
                        alt={altText}
                        className="w-full max-h-[32rem] object-contain cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                        onClick={() => window.open(content.image.url, '_blank')}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-fg-subtle text-center">{caption} — click to enlarge</p>
                  </div>
                )
              }
              const firstText = message.content.find(c => c.type === 'text')
              return (
                <div key={index} className="whitespace-pre-wrap break-words">
                  <InlineCitationsText
                    text={content.text}
                    references={message.references as any}
                    activity={message.activity as any}
                    messageId={message.id}
                    onActivate={() => onOpenSources?.(regularRefs, message.activity || [], firstText?.type === 'text' ? firstText.text : undefined)}
                  />
                </div>
              )
            })}
          </div>

          {/* Perplexity-style Sources Button - Opens Drawer */}
          {!isUser && message.webIq && (
            <div className="mt-4 space-y-3 rounded-lg border border-stroke-divider bg-bg-subtle p-3">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-md border border-stroke-divider px-2 py-1">{locale === 'ko' ? 'KB 출처' : 'KB sources'} · {message.webIq.sources.filter(source => source.origin === 'internal').length}</span>
                <span className="rounded-md border border-accent/30 px-2 py-1 text-accent">{locale === 'ko' ? 'Web IQ 출처' : 'Web IQ sources'} · {message.webIq.sources.filter(source => source.origin === 'web').length}</span>
              </div>
              <p className="text-xs text-fg-muted">{message.webIq.webSearch.results.length === 0
                ? (locale === 'ko' ? 'Web IQ에서 사용할 수 있는 웹 자료를 찾지 못했습니다. 이 답변에 추가된 웹 근거는 없습니다.' : 'Web IQ returned no usable pages. No web-source evidence was added to this answer.')
                : (locale === 'ko' ? '인용의 KB·Web 표기로 각 근거가 지식 베이스와 웹 중 어디에서 왔는지 구분할 수 있습니다.' : 'KB and Web citation labels identify the origin of each source in this combined answer.')}</p>
              {message.webIq.kbContextOnly && <p className="text-xs text-amber-600 dark:text-amber-400">{locale === 'ko' ? 'KB가 원문 근거 없이 답변 내용만 반환했습니다. 해당 내용은 출처로 확인되지 않아 KB 인용을 붙이지 않았습니다.' : 'The KB returned answer context without source passages. That context is unverified and has no KB citation in this answer.'}</p>}
              <details className="text-xs text-fg-muted">
                <summary className="cursor-pointer font-medium">{locale === 'ko' ? '답변 생성 과정' : 'App composition trace'}</summary>
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  <li>{locale === 'ko' ? '선택한 지식 베이스의 조회를 완료했습니다.' : 'Selected knowledge base retrieval completed.'}</li>
                  <li>{locale === 'ko' ? 'Web IQ가 같은 질문으로 웹을 검색했습니다' : 'Web IQ searched the question'} · {message.webIq.trace.webSearchMs} ms · {message.webIq.webSearch.results.length}{locale === 'ko' ? '개 페이지' : ' pages'}.</li>
                  <li>{locale === 'ko' ? 'Azure OpenAI가 제공된 근거를 모아 답변을 생성했습니다' : 'Azure OpenAI combined the supplied evidence'} · {message.webIq.trace.synthesisMs} ms.</li>
                </ol>
                <p className="mt-2 break-all">{locale === 'ko' ? '웹 검색어' : 'Web query'}: {message.webIq.webSearch.query}</p>
                <p className="mt-1">{locale === 'ko' ? '조회 시각' : 'Retrieved'}: {message.webIq.webSearch.retrievedAt}</p>
                {message.webIq.webSearch.traceId && <p className="mt-1 break-all">{locale === 'ko' ? 'Web IQ 추적 ID' : 'Web IQ trace'}: {message.webIq.webSearch.traceId}</p>}
              </details>
            </div>
          )}
          {!isUser && regularRefs.length > 0 && (
            <div className="mt-4 pt-4 border-t border-stroke-divider">
              <SourcesCountButton
                references={regularRefs as any}
                onClick={() => {
                  const firstText = message.content.find(c => c.type === 'text')
                  onOpenSources?.(regularRefs, message.activity || [], isUser ? undefined : (firstText?.type === 'text' ? firstText.text : undefined))
                }}
              />
            </div>
          )}

          {/* Debug info - shows when there are no references */}
          {!isUser && regularRefs.length === 0 && message.activity && message.activity.length > 0 && (
            <div className="mt-3 text-[10px] text-fg-muted italic">
              No sources returned (activity: {message.activity.length} steps)
            </div>
          )}

          {/* Collapsible Retrieval Trace Section */}
          {!isUser && hasTraceData && (
            <div className="mt-4 pt-4 border-t border-stroke-divider">
              {/* Summary Bar */}
              <button
                type="button"
                onClick={() => setTraceExpanded(prev => !prev)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-stroke-divider bg-bg-subtle hover:bg-bg-card transition-colors cursor-pointer text-left"
                aria-expanded={traceExpanded}
              >
                {traceExpanded ? (
                  <ChevronDown20Regular className="h-4 w-4 text-fg-muted flex-shrink-0" />
                ) : (
                  <ChevronRight20Regular className="h-4 w-4 text-fg-muted flex-shrink-0" />
                )}
                <span className="text-xs font-medium text-fg-muted">
                  {message.webIq ? (locale === 'ko' ? 'KB 검색 과정' : 'KB Retrieval Trace') : 'Retrieval Trace'}
                </span>
                <span className="text-xs text-fg-subtle">·</span>
                <span className="text-xs text-fg-subtle">
                  {message.activity!.length} step{message.activity!.length !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-fg-subtle">·</span>
                <span className="text-xs text-fg-subtle">
                  {message.activity!.reduce((sum, a) => sum + (a.elapsedMs || 0), 0)}ms
                </span>
              </button>

              {/* Expanded TraceExplorer */}
              <AnimatePresence initial={false}>
                {traceExpanded && (
                  <motion.div
                    key="trace-explorer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4">
                      <TraceExplorer
                        response={message.internalTraceResponse || {
                          response: [{
                            role: 'assistant',
                            content: message.content.map(c =>
                              c.type === 'text'
                                ? { type: 'text', text: c.text }
                                : c.type === 'image'
                                  ? { type: 'image', image: { url: c.image.url } }
                                  : { type: 'text', text: '' }
                            )
                          }],
                          activity: message.activity as any || [],
                          references: message.references as any || []
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* MCP Tool Calls (if any) */}
          {mcpToolCalls.length > 0 && (
            <div className="mt-4 pt-4 border-t border-stroke-divider">
              <MCPToolCallDisplay toolCalls={mcpToolCalls} />
            </div>
          )}

          <div className="mt-3 flex items-center justify-between text-xs text-fg-muted">
            <span>{formatRelativeTime(message.timestamp)}</span>
          </div>
        </div>

              </div>
    </div>
  )
}
