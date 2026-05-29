'use client'

import { useState } from 'react'
import sampleQueries from '@/data/fabric-iq-ks/sample-queries.json'

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

  async function runQuery(opts: { queryId: string; mode: Mode }) {
    setResult({ query: emptyQuery, loading: true, error: null })

    if (opts.mode === 'live') {
      setResult({ query: emptyQuery, loading: false, error: 'Live mode not implemented (T7)' })
      return
    }

    const matched = sampleQueries.queries.find((q) => q.id === opts.queryId)

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
