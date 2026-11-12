export const WEB_IQ_SEARCH_ENDPOINT = 'https://api.microsoft.ai/v3/search/web';
export const WEB_IQ_SEARCH_DOCUMENTATION = 'https://learn.microsoft.com/en-us/web-iq/reference/web-search';
export const WEB_IQ_MAX_RESULTS = 5;
export const WEB_IQ_MAX_CONTENT_LENGTH = 3000;

export interface WebIqSearchResult {
  sourceId?: string;
  sourceTicket?: string;
  title: string;
  url: string;
  content: string;
  crawledAt?: string;
  lastUpdatedAt?: string;
}

export interface WebIqSearchResponse {
  results: WebIqSearchResult[];
  traceId?: string;
  retrievedAt: string;
  query: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function boundedText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text ? text.slice(0, maxLength) : undefined;
}

function safeSourceUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048 || /[\u0000-\u001f\u007f]/.test(value)) {
    return null;
  }

  try {
    const url = new URL(value.trim());
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

/** Normalize Web IQ passages without fabricating citations or missing timestamps. */
export function parseWebIqSearchPayload(
  payload: unknown,
): Pick<WebIqSearchResponse, 'results' | 'traceId'> | null {
  if (!isRecord(payload)) return null;
  if (['errorCode', 'errorCategory', 'userMessage', 'technicalDetails', 'error', 'errors'].some(key => key in payload)) return null;
  // Web IQ omits empty arrays from successful responses. Explicit non-arrays remain invalid.
  if ('webResults' in payload && !Array.isArray(payload.webResults)) return null;
  const webResults = payload.webResults === undefined ? [] : payload.webResults as unknown[];

  const results: WebIqSearchResult[] = [];
  const seenUrls = new Set<string>();

  for (const item of webResults) {
    if (!isRecord(item)) continue;
    const url = safeSourceUrl(item.url);
    const title = boundedText(item.title, 300);
    const content = boundedText(item.content, WEB_IQ_MAX_CONTENT_LENGTH);
    if (!url || !title || !content || seenUrls.has(url)) continue;

    const crawledAt = boundedText(item.crawledAt, 64);
    const lastUpdatedAt = boundedText(item.lastUpdatedAt, 64);
    results.push({
      title,
      url,
      content,
      ...(crawledAt ? { crawledAt } : {}),
      ...(lastUpdatedAt ? { lastUpdatedAt } : {}),
    });
    seenUrls.add(url);
    if (results.length === WEB_IQ_MAX_RESULTS) break;
  }

  const traceId = boundedText(payload.traceId, 200);
  return { results, ...(traceId ? { traceId } : {}) };
}
