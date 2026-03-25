import { NextRequest, NextResponse } from 'next/server'

const SEARCH_ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT?.replace(/\s.*$/, '').replace(/\/$/, '')
  || 'https://srch-foundry-iq-demo-ext.search.windows.net'
const API_KEY = process.env.AZURE_SEARCH_API_KEY || ''
const KB_NAME = 'unified-airline-kb'
const API_VERSION = '2025-11-01-preview'

function resolveSourceLabel(activitySource?: unknown): string {
  if (!activitySource) return 'Fabric OneLake'
  const src = typeof activitySource === 'string' ? activitySource : JSON.stringify(activitySource)
  if (src.includes('unified-airline-source') || src.toLowerCase().includes('onelake')) {
    return 'Fabric OneLake'
  }
  // unified-airline-kb has a single KS (indexedOneLake) — always Fabric OneLake
  return 'Fabric OneLake'
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 })
    }

    const url = `${SEARCH_ENDPOINT}/knowledgebases/${KB_NAME}/retrieve?api-version=${API_VERSION}`

    const body = {
      messages: [{ role: 'user', content: [{ type: 'text', text: query }] }]
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 90000)

    let res: Response
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'api-key': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }

    if (!res.ok) {
      const errText = await res.text()
      console.error('KB retrieve error:', res.status, errText)
      return NextResponse.json({ error: `KB retrieve failed: ${res.status}` }, { status: res.status })
    }

    const data = await res.json()

    const answer = data.response?.[0]?.content?.[0]?.text || ''
    // references: flat array — { id, title, activitySource, rerankerScore, docKey, sourceData }
    const references: { id: string; title: string; activitySource?: unknown; rerankerScore: number }[] = data.references || []
    const activity: { type: string; knowledgeSourceName?: string; searchIndexArguments?: { search?: string } }[] = data.activity || []

    // Deduplicate by title (keep first occurrence per title)
    const seenTitles = new Set<string>()
    const uniqueRefs = references.filter((ref) => {
      const t = ref.title || ''
      if (seenTitles.has(t)) return false
      seenTitles.add(t)
      return true
    })

    // Classify by file extension for color: .pdf → 'foundry' (purple), others → 'fabric' (green)
    const fabricRefs: { id: string; title: string }[] = []
    const foundryRefs: { id: string; title: string }[] = []
    for (const ref of uniqueRefs) {
      const title = ref.title || ''
      const refItem = { id: String(ref.id), title }
      if (title.endsWith('.pdf')) {
        foundryRefs.push(refItem)
      } else {
        fabricRefs.push(refItem)
      }
    }

    // Build refMap: ref_id → { seq (1-based sequential), type (color), title, sourceLabel }
    // Fabric refs → seq 1, 2, ... then Foundry refs continue the numbering
    const refMap: Record<string, { seq: number; type: 'fabric' | 'foundry'; title: string; sourceLabel: string }> = {}

    // Build a lookup from title → activitySource for label resolution
    const titleToSource: Record<string, unknown> = {}
    for (const ref of uniqueRefs) {
      titleToSource[ref.title || ''] = ref.activitySource
    }

    let seq = 1
    for (const ref of fabricRefs) {
      refMap[ref.id] = { seq: seq++, type: 'fabric', title: ref.title, sourceLabel: resolveSourceLabel(titleToSource[ref.title]) }
    }
    for (const ref of foundryRefs) {
      refMap[ref.id] = { seq: seq++, type: 'foundry', title: ref.title, sourceLabel: resolveSourceLabel(titleToSource[ref.title]) }
    }

    // Extract search queries from activity entries of type "searchIndex"
    const searchQueries: { text: string; target: string }[] = []
    for (const act of activity) {
      if (act.type === 'searchIndex') {
        const q = act.searchIndexArguments?.search || ''
        if (q) {
          searchQueries.push({ text: q, target: act.knowledgeSourceName || '' })
        }
      }
    }

    return NextResponse.json({ answer, fabricRefs, foundryRefs, refMap, searchQueries, rawReferences: references, rawActivity: activity })
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Query timed out — KB may be processing. Try again.' }, { status: 504 })
    }
    console.error('Semantic join API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
