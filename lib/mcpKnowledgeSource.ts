import type {
  KnowledgeBaseMcpServerActivityRecord,
  KnowledgeBaseReference,
  KnowledgeBaseRetrievalResponse,
} from '@/types/knowledge-retrieval'
import type { Locale } from '@/lib/i18n'
import { mcpKnowledgeSourceI18n } from '@/lib/i18n/mcp-knowledge-source'

export const MICROSOFT_LEARN_MCP_ENDPOINT = 'https://learn.microsoft.com/api/mcp'
export const MICROSOFT_LEARN_MCP_TOOL = 'microsoft_docs_search'
export const MCP_PREVIEW_API_VERSION = '2026-05-01-preview'

export interface McpDemoMetadata {
  mode: 'live' | 'sample'
  apiVersion: string
  knowledgeBaseName: string
  knowledgeSourceName: string
  endpoint: string
  toolName: string
}

export type McpDemoResponse = KnowledgeBaseRetrievalResponse & {
  demo: McpDemoMetadata
}

export interface ParsedMcpReference {
  id: string
  title: string
  url: string | null
  snippet: string
  score: number | null
  toolName: string
}

interface EmbeddedMcpDocument {
  title?: unknown
  content?: unknown
  contentUrl?: unknown
  url?: unknown
}

function parseEmbeddedDocument(reference: KnowledgeBaseReference): EmbeddedMcpDocument {
  const rawContent = reference.sourceData?.content

  if (typeof rawContent !== 'string') {
    return {}
  }

  try {
    const parsed = JSON.parse(rawContent)
    return parsed && typeof parsed === 'object' ? parsed as EmbeddedMcpDocument : {}
  } catch {
    return { content: rawContent }
  }
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function parseMcpReference(reference: KnowledgeBaseReference): ParsedMcpReference {
  const embedded = parseEmbeddedDocument(reference)
  const sourceData = reference.sourceData || {}
  const title =
    readString(embedded.title) ||
    readString(sourceData.title) ||
    readString((reference as { title?: unknown }).title) ||
    `Microsoft Learn result ${Number(reference.id) + 1}`
  const url =
    readString(embedded.contentUrl) ||
    readString(embedded.url) ||
    readString(sourceData.contentUrl) ||
    readString(sourceData.url)
  const content =
    readString(embedded.content) ||
    readString(sourceData.snippet) ||
    'Microsoft Learn content returned by the MCP tool.'

  return {
    id: reference.id,
    title,
    url,
    snippet: content.replace(/\s+/g, ' ').slice(0, 280),
    score: typeof reference.rerankerScore === 'number' ? reference.rerankerScore : null,
    toolName: readString((reference as { toolName?: unknown }).toolName) || MICROSOFT_LEARN_MCP_TOOL,
  }
}

export function extractMcpAnswer(result: KnowledgeBaseRetrievalResponse): string {
  for (const message of result.response || []) {
    const textContent = message.content?.find((content) => content.type === 'text')
    if (textContent?.type === 'text' && textContent.text) {
      return textContent.text
    }
  }

  return ''
}

export function findMcpActivity(
  result: KnowledgeBaseRetrievalResponse
): KnowledgeBaseMcpServerActivityRecord | null {
  const activity = (result.activity || []).find((item) => item.type === 'mcpServer')
  return activity?.type === 'mcpServer' ? activity : null
}

export function buildSampleMcpResponse(question: string, locale: Locale = 'en'): McpDemoResponse {
  const copy = mcpKnowledgeSourceI18n[locale]
  const normalizedQuestion = question.trim() || copy.questions[0]

  return {
    demo: {
      mode: 'sample',
      apiVersion: MCP_PREVIEW_API_VERSION,
      knowledgeBaseName: 'repolis-mslearn-kb',
      knowledgeSourceName: 'microsoft-learn-mcp-ks',
      endpoint: MICROSOFT_LEARN_MCP_ENDPOINT,
      toolName: MICROSOFT_LEARN_MCP_TOOL,
    },
    response: [
      {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: copy.sampleAnswer,
          },
        ],
      },
    ],
    activity: [
      {
        type: 'modelQueryPlanning',
        id: 0,
        inputTokens: 1240,
        outputTokens: 52,
        elapsedMs: 1480,
      },
      {
        type: 'mcpServer',
        id: 1,
        knowledgeSourceName: 'microsoft-learn-mcp-ks',
        queryTime: '2026-07-10T00:00:00.000Z',
        count: 2,
        elapsedMs: 920,
        mcpServerArguments: {
          toolName: MICROSOFT_LEARN_MCP_TOOL,
          toolArguments: {
            query: normalizedQuestion,
          },
        },
      },
      {
        type: 'modelAnswerSynthesis',
        id: 2,
        inputTokens: 2110,
        outputTokens: 184,
        elapsedMs: 2260,
      },
      {
        type: 'agenticReasoning',
        id: 3,
        reasoningTokens: 3620,
        retrievalReasoningEffort: {
          kind: 'medium',
        },
      },
    ],
    references: [
      {
        type: 'mcpServer',
        id: '0',
        activitySource: 1,
        sourceData: {
          content: JSON.stringify({
            title: copy.sampleReferences[0].title,
            content: copy.sampleReferences[0].snippet,
            contentUrl: 'https://learn.microsoft.com/azure/search/agentic-knowledge-source-how-to-mcp-server',
          }),
        },
        rerankerScore: 3.96,
        toolName: MICROSOFT_LEARN_MCP_TOOL,
        title: 'microsoft-learn-mcp-ks microsoft_docs_search 1',
      },
      {
        type: 'mcpServer',
        id: '1',
        activitySource: 1,
        sourceData: {
          content: JSON.stringify({
            title: copy.sampleReferences[1].title,
            content: copy.sampleReferences[1].snippet,
            contentUrl: 'https://learn.microsoft.com/training/support/mcp-developer-reference',
          }),
        },
        rerankerScore: 3.71,
        toolName: MICROSOFT_LEARN_MCP_TOOL,
        title: 'microsoft-learn-mcp-ks microsoft_docs_search 2',
      },
    ],
  }
}
