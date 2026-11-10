import type { WebIqSearchResponse } from '@/lib/webIqSearch';
import type { KnowledgeBaseReference } from '@/types/knowledge-retrieval';

export interface KbAnswerSource {
  title: string;
  content: string;
  url?: string;
}

export interface KbWebAnswerSource extends KbAnswerSource {
  id: string;
  origin: 'internal' | 'web';
}

export interface KbWebAnswerResponse {
  answer: string;
  sources: KbWebAnswerSource[];
  webSearch: WebIqSearchResponse;
  trace: { webSearchMs: number; synthesisMs: number };
  kbContextOnly?: boolean;
}

export interface KbWebAnswerStatus {
  configured: boolean;
  webSearchConfigured: boolean;
  synthesisConfigured: boolean;
}

/** Minimal retrieval has no LLM synthesis: use semantic intents and extractive output. */
export function buildKbRetrieveRequest<T>(query: string, messages: T[], params: Record<string, unknown>) {
  const effort = params.retrievalReasoningEffort as { kind?: string } | undefined;
  if (effort?.kind === 'minimal') {
    return {
      messages: null,
      params: { ...params, outputMode: 'extractiveData', intents: [{ type: 'semantic', search: query }] },
    };
  }
  return { messages, params };
}

/** Exclude empty and metadata-only references from citable synthesis evidence. */
export function extractKbSourceContent(reference: KnowledgeBaseReference): string | null {
  const source = reference.sourceData;
  if (!source || typeof source !== 'object') return null;
  for (const key of ['content', 'text', 'snippet', 'chunk', 'body', 'description', 'Description']) {
    if (typeof source[key] === 'string' && source[key].trim() && !['{}', '[]'].includes(source[key].trim())) return source[key].trim().slice(0, 6000);
  }
  const metadataKeys = new Set(['title', 'name', 'filename', 'fileName', 'id', 'key', 'url', 'webUrl', 'docUrl', 'contentUrl', 'path', 'etag', '@odata.etag', '@search.score', '@search.rerankerScore']);
  const hasData = (value: unknown): boolean => {
    if (typeof value === 'string') return Boolean(value.trim()) && !['{}', '[]'].includes(value.trim());
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value === 'boolean') return true;
    if (Array.isArray(value)) return value.some(hasData);
    return Boolean(value && typeof value === 'object' && Object.values(value).some(hasData));
  };
  const data = Object.fromEntries(Object.entries(source).filter(([key, value]) => !metadataKeys.has(key) && hasData(value)));
  return Object.keys(data).length > 0 ? JSON.stringify(data).slice(0, 6000) : null;
}

/** Only supplied source IDs become clickable citations; model-authored links are removed. */
export function normalizeKbWebAnswer(text: string, sources: KbWebAnswerSource[]): string {
  const ids = new Map(sources.map((source, index) => [source.id, index]));
  return text
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/[^\s<>\])]+/g, '')
    .replace(/\[ref_id:[^\]]*\]/g, '')
    .replace(/\[(I|W)(\d+)\]/g, (marker, kind, number) => {
      const index = ids.get(kind + number);
      return index === undefined ? '' : `[ref_id:${index}]`;
    })
    .trim();
}
