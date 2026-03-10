import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy for Azure Blob Storage images.
 * Keeps SAS tokens server-side so they never leak to the client.
 *
 * Usage: GET /api/blob-image?url=https://stfoundryiqdemo2.blob.core.windows.net/...
 * Only allows requests to our own storage account.
 */

const ALLOWED_HOST = 'stfoundryiqdemo2.blob.core.windows.net'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  try {
    const parsed = new URL(url)
    if (parsed.hostname !== ALLOWED_HOST) {
      return NextResponse.json({ error: 'Forbidden host' }, { status: 403 })
    }

    const res = await fetch(url)
    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream fetch failed' }, { status: res.status })
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }
}
