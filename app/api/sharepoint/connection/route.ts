import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { SP_DEMO_MODE, SP_LIVE_API_SECRET } from '@/lib/sp-config'
import { getSPAccessToken } from '@/lib/sp-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const isLive = request.nextUrl.searchParams.get('mode') === 'live' && !SP_DEMO_MODE

  console.log(`[SP:connection] ${isLive ? 'LIVE' : 'MOCK'} mode — checking connection status`)

  if (isLive) {
    const secret = request.headers.get('x-live-secret')
    if (secret !== SP_LIVE_API_SECRET) {
      console.error(`[SP:connection] ❌ 401 Unauthorized`)
      return NextResponse.json({ error: 'Unauthorized: invalid live mode secret' }, { status: 401 })
    }
  }

  if (!isLive) {
    const filePath = path.join(process.cwd(), 'public', 'mock', 'sp-connection.json')
    const data = JSON.parse(await readFile(filePath, 'utf-8'))
    console.log(`[SP:connection] ✅ 200 OK (mock)`)
    return NextResponse.json(data)
  }

  // Live mode: check env vars and test connections
  const spAppId = process.env.SP_APP_ID
  const spAppSecret = process.env.SP_APP_SECRET
  const spTenantId = process.env.SP_TENANT_ID
  const spSiteUrl = process.env.SP_SITE_URL
  const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT

  let spConnected = false
  let siteName = 'Unknown'

  // Test SharePoint token acquisition
  if (spAppId && spAppSecret && spTenantId && spSiteUrl) {
    try {
      await getSPAccessToken()
      spConnected = true
      siteName = 'Communication site'
    } catch {
      spConnected = false
    }
  }

  // Extract search service name from endpoint
  let searchServiceName = ''
  if (searchEndpoint) {
    const match = searchEndpoint.match(/https:\/\/([^.]+)\./)
    searchServiceName = match ? match[1] : searchEndpoint
  }

  console.log(`[SP:connection] ✅ 200 OK (SP:${spConnected}, Search:${!!searchEndpoint})`)
  return NextResponse.json({
    sharepoint: {
      connected: spConnected,
      siteUrl: spSiteUrl || '',
      siteName,
    },
    entraApp: {
      configured: !!(spAppId && spAppSecret && spTenantId),
      appName: 'SharePoint-AI-Indexer',
    },
    aiSearch: {
      connected: !!searchEndpoint,
      serviceName: searchServiceName,
    },
    embedding: {
      ready: !!process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT,
      model: 'text-embedding-3-large',
    },
  })
}
