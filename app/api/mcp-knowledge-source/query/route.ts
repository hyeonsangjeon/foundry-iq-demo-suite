import { NextRequest, NextResponse } from 'next/server'

import {
  MCP_PREVIEW_API_VERSION,
  MICROSOFT_LEARN_MCP_ENDPOINT,
  MICROSOFT_LEARN_MCP_TOOL,
} from '@/lib/mcpKnowledgeSource'
import { tokenManager } from '@/lib/token-manager'
import type { KnowledgeBaseRetrievalResponse } from '@/types/knowledge-retrieval'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 180

const DEFAULT_KNOWLEDGE_BASE = 'accel-live-mcp-only-kb'
const DEFAULT_KNOWLEDGE_SOURCE = 'accel-live-microsoft-learn-mcp-ks'

function getRuntimeSeconds(): number {
  const configured = Number(process.env.MCP_KS_MAX_RUNTIME_SECONDS || 90)
  if (!Number.isFinite(configured)) return 90
  return Math.min(180, Math.max(11, Math.floor(configured)))
}

function readUpstreamError(responseText: string): string {
  try {
    const parsed = JSON.parse(responseText) as {
      error?: { message?: string } | string
      message?: string
    }

    if (typeof parsed.error === 'string') return parsed.error
    if (parsed.error?.message) return parsed.error.message
    if (parsed.message) return parsed.message
  } catch {
    // The upstream can return an empty or non-JSON error body.
  }

  return 'Azure AI Search did not return an error description.'
}

export async function POST(request: NextRequest) {
  const endpoint = process.env.AZURE_SEARCH_ENDPOINT?.replace(/\/$/, '')
  const apiKey = process.env.AZURE_SEARCH_API_KEY
  const useRbac = process.env.AZURE_SEARCH_USE_RBAC === 'true'
  const apiVersion = process.env.MCP_KS_API_VERSION || MCP_PREVIEW_API_VERSION
  const knowledgeBaseName =
    process.env.MCP_KS_KNOWLEDGE_BASE_NAME ||
    process.env.MSDOCS_KB_NAME ||
    DEFAULT_KNOWLEDGE_BASE
  const knowledgeSourceName =
    process.env.MCP_KS_KNOWLEDGE_SOURCE_NAME ||
    process.env.MSDOCS_KS_NAME ||
    DEFAULT_KNOWLEDGE_SOURCE

  if (!endpoint || (!useRbac && !apiKey)) {
    return NextResponse.json(
      {
        error: 'The live MCP demo is not configured.',
        details: 'Set Azure AI Search credentials or switch to sample mode.',
      },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }

  const question =
    body && typeof body === 'object' && 'question' in body
      ? (body as { question?: unknown }).question
      : null

  if (typeof question !== 'string' || !question.trim()) {
    return NextResponse.json({ error: 'A question is required.' }, { status: 400 })
  }

  if (question.trim().length > 2000) {
    return NextResponse.json(
      { error: 'Keep the question under 2,000 characters.' },
      { status: 400 }
    )
  }

  const maxRuntimeInSeconds = getRuntimeSeconds()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), (maxRuntimeInSeconds + 10) * 1000)

  try {
    const authHeaders: Record<string, string> = useRbac
      ? { Authorization: 'Bearer ' + await tokenManager.getSearchToken() }
      : { 'api-key': apiKey! }
    const url =
      endpoint +
      '/knowledgebases/' +
      encodeURIComponent(knowledgeBaseName) +
      '/retrieve?api-version=' +
      encodeURIComponent(apiVersion)
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: question.trim(),
              },
            ],
          },
        ],
        knowledgeSourceParams: [
          {
            knowledgeSourceName,
            kind: 'mcpServer',
            includeReferenceSourceData: true,
          },
        ],
        maxRuntimeInSeconds,
      }),
      cache: 'no-store',
      signal: controller.signal,
    })
    const responseText = await upstream.text()

    if (!upstream.ok) {
      return NextResponse.json(
        {
          error: 'The live Microsoft Learn MCP query failed.',
          details: readUpstreamError(responseText),
          upstreamStatus: upstream.status,
        },
        { status: upstream.status }
      )
    }

    let data: KnowledgeBaseRetrievalResponse
    try {
      data = JSON.parse(responseText) as KnowledgeBaseRetrievalResponse
    } catch {
      return NextResponse.json(
        { error: 'Azure AI Search returned an invalid JSON response.' },
        { status: 502 }
      )
    }

    return NextResponse.json(
      {
        ...data,
        demo: {
          mode: 'live',
          apiVersion,
          knowledgeBaseName,
          knowledgeSourceName,
          endpoint: MICROSOFT_LEARN_MCP_ENDPOINT,
          toolName: MICROSOFT_LEARN_MCP_TOOL,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        {
          error: 'The live Microsoft Learn MCP query timed out.',
          details: 'Try a narrower question or use sample mode.',
        },
        { status: 504 }
      )
    }

    return NextResponse.json(
      {
        error: 'The live Microsoft Learn MCP query could not be completed.',
        details: error instanceof Error ? error.message : 'Unknown server error.',
      },
      { status: 500 }
    )
  } finally {
    clearTimeout(timeout)
  }
}
