import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { SP_DEMO_MODE, SP_LIVE_API_SECRET, REQUIRE_LIVE_SECRET } from '@/lib/sp-config'
import { searchApiCall } from '@/lib/sp-search-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const PREFIX = 'sp-airline-policies'

export async function GET(request: NextRequest) {
  const isLive = request.nextUrl.searchParams.get('mode') === 'live' && !SP_DEMO_MODE

  console.log(`[SP:index-pipeline/status] ${isLive ? 'LIVE' : 'MOCK'} mode — polling status`)

  if (isLive) {
    const secret = request.headers.get('x-live-secret')
    if (REQUIRE_LIVE_SECRET && secret !== SP_LIVE_API_SECRET) {
      console.error(`[SP:index-pipeline/status] ❌ 401 Unauthorized`)
      return NextResponse.json({ error: 'Unauthorized: invalid live mode secret' }, { status: 401 })
    }
  }

  if (!isLive) {
    const startedAt = Number(request.nextUrl.searchParams.get('startedAt') || '0')
    if (!startedAt) return NextResponse.json({ error: 'Missing startedAt' }, { status: 400 })

    const elapsedMs = Date.now() - startedAt

    const timelinePath = path.join(process.cwd(), 'public', 'mock', 'sp-indexer-timeline.json')
    const timeline = JSON.parse(await readFile(timelinePath, 'utf-8'))

    const docsPath = path.join(process.cwd(), 'public', 'mock', 'sp-documents.json')
    const docsData = JSON.parse(await readFile(docsPath, 'utf-8'))

    const totalDuration = timeline.totalDurationMs
    const overallProgress = Math.min((elapsedMs / totalDuration) * 100, 100)
    const isComplete = elapsedMs >= totalDuration

    const stages = timeline.stages.map((stage: any) => ({
      ...stage,
      status: elapsedMs < stage.startMs ? 'waiting'
        : elapsedMs >= stage.endMs ? 'complete'
        : 'active',
      progress: Math.max(0, Math.min((elapsedMs - stage.startMs) / (stage.endMs - stage.startMs), 1))
    }))

    // Calculate per-document status based on overall progress
    const documents = docsData.documents.map((doc: any, index: number) => {
      const docProgress = Math.max(0, (overallProgress - (index / docsData.documents.length) * 100) * (docsData.documents.length / 100))
      const docComplete = docProgress >= 1
      return {
        ...doc,
        status: isComplete || docComplete ? 'indexed' :
                docProgress > 0 ? 'indexing' : 'pending',
        chunks: (isComplete || docComplete) ? timeline.documentChunks[doc.id] || null : null
      }
    })

    console.log(`[SP:index-pipeline/status] ✅ ${Math.round(overallProgress)}% (mock)`)
    return NextResponse.json({
      overallProgress: Math.round(overallProgress * 10) / 10,
      elapsedMs,
      estimatedRemainingMs: Math.max(0, totalDuration - elapsedMs),
      stages,
      documents,
      isComplete,
      totalChunks: timeline.totalChunks
    })
  }

  // Live mode: poll actual indexer status
  try {
    const data = await searchApiCall(
      `/indexers/${PREFIX}-indexer/status`,
      'GET',
      undefined,
      '2024-07-01'
    )

    const lastResult = data.lastResult || {}
    const status = lastResult.status || 'unknown'
    const itemsProcessed = lastResult.itemsProcessed || 0
    const itemCount = lastResult.itemCount || 0
    const errorMessage = lastResult.errorMessage || null

    let overallProgress = 0
    let isComplete = false

    if (status === 'success') {
      overallProgress = 100
      isComplete = true
    } else if (status === 'inProgress') {
      overallProgress = itemCount > 0 ? Math.round((itemsProcessed / itemCount) * 100 * 10) / 10 : 0
    } else if (status === 'transientFailure') {
      return NextResponse.json({
        overallProgress: 0,
        elapsedMs: 0,
        estimatedRemainingMs: 0,
        stages: [],
        documents: [],
        isComplete: false,
        error: errorMessage || 'Indexer encountered a transient failure',
      })
    }

    // Map to simplified stage format for live mode
    const stages = [
      { name: 'extract', label: 'Extract Content', icon: 'extract', status: overallProgress > 0 ? 'complete' : 'active', progress: overallProgress > 0 ? 1 : 0 },
      { name: 'chunk', label: 'Chunk Text', icon: 'chunk', status: overallProgress > 25 ? 'complete' : overallProgress > 0 ? 'active' : 'waiting', progress: Math.min(1, Math.max(0, (overallProgress - 0) / 25)) },
      { name: 'embed', label: 'Generate Embeddings', icon: 'embed', status: overallProgress > 50 ? 'complete' : overallProgress > 25 ? 'active' : 'waiting', progress: Math.min(1, Math.max(0, (overallProgress - 25) / 25)) },
      { name: 'index', label: 'Index Documents', icon: 'index', status: overallProgress >= 100 ? 'complete' : overallProgress > 50 ? 'active' : 'waiting', progress: Math.min(1, Math.max(0, (overallProgress - 50) / 50)) },
    ]

    // Get actual index document count (chunks)
    let indexDocCount = 0
    try {
      const endpoint = process.env.AZURE_SEARCH_ENDPOINT?.replace(/\/$/, '')
      const apiKey = process.env.AZURE_SEARCH_API_KEY
      if (endpoint && apiKey) {
        const countRes = await fetch(
          `${endpoint}/indexes/${PREFIX}-index/docs/$count?api-version=2024-11-01-preview`,
          { headers: { 'api-key': apiKey } }
        )
        if (countRes.ok) {
          const countText = await countRes.text()
          indexDocCount = parseInt(countText, 10) || 0
        }
      }
    } catch {
      // count failure is non-fatal
    }

    console.log(`[SP:index-pipeline/status] ✅ ${overallProgress}% complete=${isComplete} chunks=${indexDocCount || itemsProcessed} (live)`)
    return NextResponse.json({
      overallProgress,
      elapsedMs: 0,
      estimatedRemainingMs: 0,
      stages,
      documents: [],
      isComplete,
      totalChunks: indexDocCount || itemsProcessed,
      indexDocCount,
    })
  } catch (error: any) {
    console.error(`[SP:index-pipeline/status] ❌ ${error.message}`)
    return NextResponse.json(
      { error: error.message || 'Failed to get indexer status' },
      { status: 500 }
    )
  }
}
