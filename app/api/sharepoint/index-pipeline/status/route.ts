import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { SP_DEMO_MODE } from '@/lib/sp-config'

export async function GET(request: NextRequest) {
  if (SP_DEMO_MODE) {
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
  return NextResponse.json({ error: 'Live mode not implemented' }, { status: 501 })
}
