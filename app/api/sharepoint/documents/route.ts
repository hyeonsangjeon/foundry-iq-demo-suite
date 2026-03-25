import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { SP_DEMO_MODE, SP_LIVE_API_SECRET, REQUIRE_LIVE_SECRET } from '@/lib/sp-config'
import { getSPAccessToken } from '@/lib/sp-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const isLive = request.nextUrl.searchParams.get('mode') === 'live' && !SP_DEMO_MODE

  console.log(`[SP:documents] ${isLive ? 'LIVE' : 'MOCK'} mode — fetching documents`)

  if (isLive) {
    const secret = request.headers.get('x-live-secret')
    if (REQUIRE_LIVE_SECRET && secret !== SP_LIVE_API_SECRET) {
      console.error(`[SP:documents] ❌ 401 Unauthorized`)
      return NextResponse.json({ error: 'Unauthorized: invalid live mode secret' }, { status: 401 })
    }
  }

  if (!isLive) {
    const filePath = path.join(process.cwd(), 'public', 'mock', 'sp-documents.json')
    const data = JSON.parse(await readFile(filePath, 'utf-8'))
    console.log(`[SP:documents] ✅ ${data.documents.length} documents returned (mock)`)
    return NextResponse.json(data)
  }

  // Live mode: fetch documents from SharePoint via Graph API
  try {
    const token = await getSPAccessToken()
    const siteUrl = process.env.SP_SITE_URL || ''

    // Extract hostname from SP_SITE_URL (e.g., "l4t2.sharepoint.com")
    const hostname = new URL(siteUrl).hostname

    // Get site ID
    const siteRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${hostname}:/`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!siteRes.ok) {
      throw new Error(`Failed to get site: ${siteRes.status}`)
    }
    const site = await siteRes.json()
    const siteId = site.id

    // Get documents from AI_AirlinePolicies folder
    const docsRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:/AI_AirlinePolicies:/children`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!docsRes.ok) {
      throw new Error(`Failed to get documents: ${docsRes.status}`)
    }
    const docsData = await docsRes.json()

    // Transform to mock format
    let totalSize = 0
    const documents = (docsData.value || []).map((item: any) => {
      const ext = (item.name.split('.').pop() || '').toLowerCase()
      const size = item.size || 0
      totalSize += size
      return {
        id: item.id,
        name: item.name,
        type: ext,
        size,
        lastModified: item.lastModifiedDateTime,
        webUrl: item.webUrl,
        status: 'pending',
        chunks: null,
      }
    })

    const formats = Array.from(new Set(documents.map((d: any) => d.type.toUpperCase()))).sort()

    console.log(`[SP:documents] ✅ ${documents.length} documents returned (live)`)
    return NextResponse.json({
      documents,
      summary: {
        totalDocuments: documents.length,
        totalSizeBytes: totalSize,
        supportedFormats: formats.length > 0 ? formats : ['PDF'],
      },
    })
  } catch (error: any) {
    console.error(`[SP:documents] ❌ ${error.message}`)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch SharePoint documents' },
      { status: 500 }
    )
  }
}
