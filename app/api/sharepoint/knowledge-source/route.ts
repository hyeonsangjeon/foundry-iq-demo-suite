import { NextRequest, NextResponse } from 'next/server'
import { SP_DEMO_MODE, SP_CONFIG, SP_LIVE_API_SECRET, REQUIRE_LIVE_SECRET } from '@/lib/sp-config'
import { searchApiCall } from '@/lib/sp-search-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const PREFIX = 'sp-airline-policies'

export async function PUT(request: NextRequest) {
  const isLive = request.nextUrl.searchParams.get('mode') === 'live' && !SP_DEMO_MODE

  console.log(`[SP:knowledge-source] ${isLive ? 'LIVE' : 'MOCK'} mode — creating KS+KB`)

  if (isLive) {
    const secret = request.headers.get('x-live-secret')
    if (REQUIRE_LIVE_SECRET && secret !== SP_LIVE_API_SECRET) {
      console.error(`[SP:knowledge-source] ❌ 401 Unauthorized`)
      return NextResponse.json({ error: 'Unauthorized: invalid live mode secret' }, { status: 401 })
    }
  }

  if (!isLive) {
    console.log(`[SP:knowledge-source] ✅ 200 OK (mock)`)
    return NextResponse.json({
      kbName: SP_CONFIG.kbName,
      displayName: SP_CONFIG.spKbDisplayName,
      status: 'connected'
    })
  }

  // Live mode: create Knowledge Source + connect to KB
  try {
    // Create Knowledge Source (2025-11-01-preview schema)
    await searchApiCall(
      `/knowledgesources/${PREFIX}-kb-source`,
      'PUT',
      {
        name: `${PREFIX}-kb-source`,
        kind: 'searchIndex',
        description: 'SharePoint Airline Policies — DOT regulations, passenger rights, bumping rules',
        searchIndexParameters: {
          searchIndexName: `${PREFIX}-index`,
        },
      },
      '2025-11-01-preview'
    )

    // Create/update KB and connect KS to it (2025-11-01-preview schema)
    await searchApiCall(
      `/knowledgebases/${SP_CONFIG.kbName}`,
      'PUT',
      {
        name: SP_CONFIG.kbName,
        models: [
          {
            kind: 'azureOpenAI',
            azureOpenAIParameters: {
              resourceUri: process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT || '',
              deploymentId: 'gpt-4o',
              modelName: 'gpt-4o',
            },
          },
        ],
        knowledgeSources: [
          {
            name: `${PREFIX}-kb-source`,
          },
        ],
        outputMode: 'answerSynthesis',
      },
      '2025-11-01-preview'
    )

    console.log(`[SP:knowledge-source] ✅ 200 OK — KS+KB created (${SP_CONFIG.kbName})`)
    return NextResponse.json({
      kbName: SP_CONFIG.kbName,
      displayName: SP_CONFIG.spKbDisplayName,
      status: 'connected',
    })
  } catch (error: any) {
    console.error(`[SP:knowledge-source] ❌ ${error.message}`)
    return NextResponse.json(
      { error: error.message || 'Failed to create knowledge source' },
      { status: 500 }
    )
  }
}
