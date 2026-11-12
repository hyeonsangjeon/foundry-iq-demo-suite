import type { WebIqSearchResponse } from '@/lib/webIqSearch';
import type { KnowledgeBaseReference, KnowledgeBaseRetrievalResponse } from '@/types/knowledge-retrieval';
import type { WebIqTelemetry } from '@/lib/webIqTelemetry';

export interface KbAnswerSource {
  title: string;
  content: string;
  url?: string;
}

export interface KbWebAnswerSource extends KbAnswerSource {
  id: string;
  origin: 'internal' | 'web';
  sourceId?: string;
  sourceTicket?: string;
}

export interface KbWebAnswerResponse {
  schemaVersion?: 'webiq.answer.v2';
  answer: string;
  sources: KbWebAnswerSource[];
  webSearch: WebIqSearchResponse;
  trace: { webSearchMs: number; synthesisMs: number };
  kbContextOnly?: boolean;
  telemetry?: WebIqTelemetry;
}

export interface KbWebContext {
  internalAnswer: string;
  sources: KbAnswerSource[];
  internalReferences: KnowledgeBaseReference[];
  usable: boolean;
  outputKind: 'answer' | 'extractive';
  truncation: { internalAnswer: boolean; internalSourcesOmitted: number; internalSourcesTruncated: number; metadataOnlySources: number };
}

export interface KbWebAnswerStatus {
  configured: boolean;
  webSearchConfigured: boolean;
  synthesisConfigured: boolean;
  botProtectionConfigured: boolean;
  turnstileSiteKey: string | null;
}

export interface KbWebKnowledgeSourceMetadata {
  name: string;
  kind?: string;
  alwaysQuerySource?: boolean | null;
  includeReferences?: boolean | null;
  includeReferenceSourceData?: boolean | null;
  rerankerThreshold?: number | null;
  maxSubQueries?: number | null;
  headers?: Record<string, string>;
}

/** Request citable passages without guessing a source kind or changing its retrieval overrides. */
export function buildKbWebKnowledgeSourceParams(
  attachedSources: readonly KbWebKnowledgeSourceMetadata[] = [],
  catalogSources: readonly Pick<KbWebKnowledgeSourceMetadata, 'name' | 'kind'>[] = [],
) {
  const knownKind = (kind: unknown): kind is string => typeof kind === 'string' && Boolean(kind.trim()) && kind !== 'unknown';
  const kinds = new Map(catalogSources.filter(source => source && typeof source.name === 'string' && knownKind(source.kind))
    .map(source => [source.name, source.kind!]));
  const params = attachedSources.flatMap(source => {
    if (!source || typeof source.name !== 'string' || !source.name.trim()) return [];
    const kind = kinds.get(source.name) || source.kind;
    // Missing metadata must keep the existing answer-only/extractive fallback, not invent searchIndex.
    if (!knownKind(kind)) return [];
    return [{
      knowledgeSourceName: source.name,
      kind,
      includeReferences: true,
      includeReferenceSourceData: true,
      ...(typeof source.alwaysQuerySource === 'boolean' ? { alwaysQuerySource: source.alwaysQuerySource } : {}),
      ...(typeof source.rerankerThreshold === 'number' && Number.isFinite(source.rerankerThreshold) ? { rerankerThreshold: source.rerankerThreshold } : {}),
      // Legacy maxSubQueries is absent from the 2025-11-01-preview retrieve contract.
      ...(source.headers ? { headers: { ...source.headers } } : {}),
    }];
  });
  return params.length ? params : undefined;
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
  return extractFullKbSourceContent(reference)?.slice(0, 6000) ?? null;
}

function extractFullKbSourceContent(reference: KnowledgeBaseReference): string | null {
  const source = reference.sourceData;
  if (!source || typeof source !== 'object') return null;
  for (const key of ['content', 'text', 'snippet', 'chunk', 'body', 'description', 'Description']) {
    if (typeof source[key] === 'string' && source[key].trim() && !['{}', '[]'].includes(source[key].trim())) return source[key].trim();
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
  return Object.keys(data).length > 0 ? JSON.stringify(data) : null;
}

/** Shared, bounded adapter for Tech and the KB playground; never mutate the retrieval. */
export function buildKbWebContext(response: KnowledgeBaseRetrievalResponse): KbWebContext {
  const fullAnswer = (response.response || []).flatMap(message => message.content || [])
    .filter(content => content.type === 'text').map(content => content.text).join('\n').trim();
  const allReferences = response.references || [];
  const citable = allReferences.map(reference => ({ reference, content: extractFullKbSourceContent(reference) }))
    .filter((item): item is { reference: KnowledgeBaseReference; content: string } => item.content !== null);
  const selected = citable.slice(0, 20);
  const sources = selected.map(({ reference, content }, index) => {
    const source = reference.sourceData || {};
    const record = reference as unknown as Record<string, unknown>;
    const title = record.title || source.title || source.filename || record.docKey || `Knowledge base source ${index + 1}`;
    const url = record.url || record.webUrl || record.docUrl || source.url || source.webUrl || source.docUrl;
    return { title: String(title).slice(0, 300), content: content.slice(0, 6000),
      ...(typeof url === 'string' && url.length <= 2048 ? { url } : {}) };
  });
  return {
    internalAnswer: fullAnswer.slice(0, 30000), sources,
    internalReferences: structuredClone(selected.map(item => item.reference)),
    usable: Boolean(fullAnswer || sources.length), outputKind: fullAnswer ? 'answer' : 'extractive',
    truncation: { internalAnswer: fullAnswer.length > 30000,
      internalSourcesOmitted: Math.max(0, citable.length - selected.length),
      internalSourcesTruncated: selected.filter(item => item.content.length > 6000).length,
      metadataOnlySources: allReferences.length - citable.length },
  };
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
