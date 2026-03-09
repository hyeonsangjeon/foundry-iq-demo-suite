import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const indexName = searchParams.get('index') || 'hotels-sample'
  const top = searchParams.get('top') || '50'

  const endpoint = process.env.AZURE_SEARCH_ENDPOINT
  const apiKey = process.env.AZURE_SEARCH_API_KEY
  const apiVersion = process.env.AZURE_SEARCH_API_VERSION || '2025-11-01-preview'

  if (!endpoint || !apiKey) {
    return NextResponse.json({ error: 'Missing AZURE_SEARCH_ENDPOINT or AZURE_SEARCH_API_KEY' }, { status: 500 })
  }

  try {
    const resp = await fetch(
      `${endpoint}/indexes/${indexName}/docs/search?api-version=${apiVersion}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
        body: JSON.stringify({
          search: '*',
          top: parseInt(top),
          select: 'HotelId,HotelName,Description,Category,Tags,Rating,Address',
        }),
        cache: 'no-store',
      }
    )
    if (!resp.ok) {
      return NextResponse.json({ error: `HTTP ${resp.status}` }, { status: resp.status })
    }
    const data = await resp.json()
    return NextResponse.json(data)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
