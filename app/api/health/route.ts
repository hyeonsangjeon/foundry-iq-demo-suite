import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface ServiceStatus {
  name: string
  status: 'connected' | 'checking' | 'error'
  detail?: string
  latencyMs?: number
}

export async function GET() {
  const results: ServiceStatus[] = []

  // 1. AI Search ping
  const searchStart = Date.now()
  try {
    const endpoint = process.env.AZURE_SEARCH_ENDPOINT
    const apiKey = process.env.AZURE_SEARCH_API_KEY
    const apiVersion = process.env.AZURE_SEARCH_API_VERSION || '2025-11-01-preview'
    if (!endpoint || !apiKey) {
      results.push({ name: 'Azure AI Search', status: 'error', detail: 'Not configured' })
    } else {
      const searchResp = await fetch(
        `${endpoint}/indexes?api-version=${apiVersion}&$select=name`,
        {
          headers: { 'api-key': apiKey },
          cache: 'no-store',
        }
      )
      const searchLatency = Date.now() - searchStart
      if (searchResp.ok) {
        const data = await searchResp.json()
        const indexNames = (data.value || []).map((i: any) => i.name).join(', ')
        results.push({
          name: 'Azure AI Search',
          status: 'connected',
          detail: indexNames || 'No indexes',
          latencyMs: searchLatency,
        })
      } else {
        results.push({ name: 'Azure AI Search', status: 'error', detail: `HTTP ${searchResp.status}` })
      }
    }
  } catch (e: any) {
    results.push({ name: 'Azure AI Search', status: 'error', detail: e.message })
  }

  // 2. OpenAI ping
  const aoaiStart = Date.now()
  try {
    const aoaiEndpoint = process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT?.replace(/\/$/, '')
    const aoaiKey = process.env.AZURE_OPENAI_API_KEY
    if (!aoaiEndpoint || !aoaiKey) {
      results.push({ name: 'OpenAI', status: 'error', detail: 'Not configured' })
    } else {
      const aoaiResp = await fetch(
        `${aoaiEndpoint}/openai/models?api-version=2024-06-01`,
        {
          headers: { 'api-key': aoaiKey },
          cache: 'no-store',
        }
      )
      const aoaiLatency = Date.now() - aoaiStart
      if (aoaiResp.ok) {
        results.push({ name: 'OpenAI', status: 'connected', detail: 'API accessible', latencyMs: aoaiLatency })
      } else {
        results.push({ name: 'OpenAI', status: 'error', detail: `HTTP ${aoaiResp.status}` })
      }
    }
  } catch (e: any) {
    results.push({ name: 'OpenAI', status: 'error', detail: e.message })
  }

  // 3. Knowledge Base ping
  const kbStart = Date.now()
  try {
    const endpoint = process.env.AZURE_SEARCH_ENDPOINT
    const apiKey = process.env.AZURE_SEARCH_API_KEY
    const apiVersion = process.env.AZURE_SEARCH_API_VERSION || '2025-11-01-preview'
    if (!endpoint || !apiKey) {
      results.push({ name: 'Foundry IQ KB', status: 'error', detail: 'Not configured' })
    } else {
      const kbResp = await fetch(
        `${endpoint}/knowledgebases?api-version=${apiVersion}&$select=name`,
        {
          headers: { 'api-key': apiKey },
          cache: 'no-store',
        }
      )
      const kbLatency = Date.now() - kbStart
      if (kbResp.ok) {
        const data = await kbResp.json()
        const kbCount = (data.value || []).length
        results.push({ name: 'Foundry IQ KB', status: 'connected', detail: `${kbCount} KB(s)`, latencyMs: kbLatency })
      } else {
        results.push({ name: 'Foundry IQ KB', status: 'error', detail: `HTTP ${kbResp.status}` })
      }
    }
  } catch (e: any) {
    results.push({ name: 'Foundry IQ KB', status: 'error', detail: e.message })
  }

  return NextResponse.json({
    services: results,
    timestamp: new Date().toISOString(),
  })
}
