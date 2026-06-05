'use client'

import { useState } from 'react'
import sampleQueries from '@/data/fabric-iq-ks/sample-queries.json'
import type { Locale } from '@/lib/i18n'

export type Mode = 'mock' | 'live'

export type SampleQuery = (typeof sampleQueries.queries)[number]

export type QueryResult = {
  query: SampleQuery
  loading: boolean
  error: string | null
}

const emptyQuery = null as unknown as SampleQuery

const UNIFIED_KB_ID = 'unified-airline-kb'

// --- Live retrieve response shape (Azure AI Search KB v2025-11-01-preview) ---
type RetrieveActivity = {
  type?: string
  id?: number
  elapsedMs?: number
  knowledgeSourceName?: string
  searchIndexArguments?: { search?: string }
}

type RetrieveReference = {
  type?: string
  id?: string
  title?: string
  docKey?: string
  rerankerScore?: number
  sourceData?: Record<string, any> | null
}

type RetrieveResponse = {
  response?: Array<{ content?: Array<{ type?: string; text?: string }> }>
  activity?: RetrieveActivity[]
  references?: RetrieveReference[]
}

function extractAnswerText(data: RetrieveResponse): string {
  const parts =
    data.response?.flatMap((msg) =>
      (msg.content ?? [])
        .filter((c) => c.type === 'text' && typeof c.text === 'string')
        .map((c) => c.text as string)
    ) ?? []
  return parts.join('\n\n').trim()
}

function buildQueryPlan(data: RetrieveResponse): string | null {
  const searches = (data.activity ?? [])
    .filter((a) => a.type === 'searchIndex' && a.searchIndexArguments?.search)
    .map((a, i) => `[${i + 1}] search: "${a.searchIndexArguments!.search}"`)
  if (searches.length === 0) return null
  const source = (data.activity ?? []).find((a) => a.knowledgeSourceName)?.knowledgeSourceName
  const header = `// Foundry IQ query plan — ${source ?? UNIFIED_KB_ID}`
  return [header, ...searches].join('\n')
}

function buildCitations(data: RetrieveResponse) {
  return (data.references ?? [])
    .slice()
    .sort((a, b) => (b.rerankerScore ?? 0) - (a.rerankerScore ?? 0))
    .slice(0, 4)
    .map((ref) => {
      const label = ref.title || ref.sourceData?.title || `Reference ${ref.id ?? ''}`.trim()
      const detail =
        ref.sourceData?.snippet ||
        ref.sourceData?.chunk ||
        (typeof ref.rerankerScore === 'number'
          ? `reranker score ${ref.rerankerScore.toFixed(2)}`
          : ref.docKey || '')
      return { label, detail, source: 'searchIndex' as const }
    })
}

function buildTrace(data: RetrieveResponse) {
  return (data.activity ?? [])
    .filter((a) => typeof a.elapsedMs === 'number' && a.elapsedMs > 0)
    .map((a) => ({ stage: a.type ?? 'unknown', ms: a.elapsedMs as number }))
}

/**
 * Adapts a real Knowledge Base retrieve response into the SampleQuery shape
 * consumed by the Fabric IQ KS democratization UI (VpResultCard advisory
 * variant + NL→KQL panel + trace timeline + raw JSON panel).
 */
function adaptRetrieveToSampleQuery(queryId: string, data: RetrieveResponse): SampleQuery {
  const trace = buildTrace(data)
  const elapsedMs = trace.reduce((acc, s) => acc + s.ms, 0)
  const answerText = extractAnswerText(data) || 'No answer text returned.'
  const seconds = (elapsedMs / 1000).toFixed(1)

  const adapted = {
    id: queryId,
    nl: {},
    vpAnswer: {
      kind: 'advisory',
      narrative: { en: answerText },
      citations: buildCitations(data),
      source: `Foundry IQ · ${UNIFIED_KB_ID} · live retrieval · ${seconds}s`,
    },
    kql: buildQueryPlan(data),
    trace,
    elapsedMs,
    rawJson: JSON.stringify(data, null, 2),
  }

  return adapted as unknown as SampleQuery
}

export function useFabricIqQuery() {
  const [result, setResult] = useState<QueryResult | null>(null)

  async function runQuery(opts: { queryId: string; mode: Mode; locale?: Locale }) {
    setResult({ query: emptyQuery, loading: true, error: null })

    const matched = sampleQueries.queries.find((q) => q.id === opts.queryId)

    if (opts.mode === 'live') {
      const locale = opts.locale ?? 'en'
      const questionText =
        (matched?.nl as Record<string, string> | undefined)?.[locale] ||
        matched?.nl?.en ||
        opts.queryId

      try {
        const res = await fetch(`/api/knowledge-bases/${UNIFIED_KB_ID}/retrieve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: [{ type: 'text', text: questionText }] }],
          }),
        })

        if (!res.ok) {
          const errBody = await res.json().catch(() => null)
          throw new Error(
            errBody?.azureError?.error?.message ||
              errBody?.error ||
              `Retrieve failed (${res.status})`
          )
        }

        const data: RetrieveResponse = await res.json()
        setResult({
          query: adaptRetrieveToSampleQuery(opts.queryId, data),
          loading: false,
          error: null,
        })
        return
      } catch (e: any) {
        // Resilient demo fallback: if the live call fails, fall back to the
        // verified mock response for the same query so the UI still renders.
        if (matched) {
          console.warn('[fabric-iq-ks] live retrieve failed, falling back to mock:', e?.message)
          setResult({ query: matched, loading: false, error: null })
          return
        }
        setResult({ query: emptyQuery, loading: false, error: e?.message ?? 'Live query failed' })
        return
      }
    }

    if (!matched) {
      setResult({ query: emptyQuery, loading: false, error: 'No matching mock query' })
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 1500))

    setResult({ query: matched, loading: false, error: null })
  }

  function clear() {
    setResult(null)
  }

  return { result, runQuery, clear }
}
