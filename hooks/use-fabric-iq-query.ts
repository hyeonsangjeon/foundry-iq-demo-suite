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

export function useFabricIqQuery() {
  const [result, setResult] = useState<QueryResult | null>(null)

  async function runQuery(opts: { queryId?: string; freeText?: string; mode: Mode; locale: Locale }) {
    setResult({ query: emptyQuery, loading: true, error: null })

    if (opts.mode === 'live') {
      setResult({ query: emptyQuery, loading: false, error: 'Live mode not implemented (T7)' })
      return
    }

    let matched: SampleQuery | undefined
    if (opts.queryId) {
      matched = sampleQueries.queries.find((q) => q.id === opts.queryId)
    } else if (opts.freeText) {
      const text = opts.freeText.toLowerCase()
      matched = sampleQueries.queries.find((q) => q.nl.en.toLowerCase().includes(text.split(' ')[0]))
      if (!matched) matched = sampleQueries.queries[0]
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
