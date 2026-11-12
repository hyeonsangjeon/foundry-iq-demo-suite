import { safeWebIqBrowseUrl } from '@/lib/webIqSourceTicket';

export const WEB_IQ_BROWSE_DOCUMENTATION = 'https://learn.microsoft.com/en-us/web-iq/reference/browse';
export const WEB_IQ_BROWSE_MAX_LENGTH = 3_000;
export const WEB_IQ_BROWSE_MAX_RESPONSE_BYTES = 64 * 1_024;

export interface WebIqBrowsePassage {
  schemaVersion: 'webiq.browse.response.v1';
  status: 'passage' | 'empty';
  sourceId: string;
  url: string;
  title: string;
  content: string;
  retrievedAt: string;
  crawledAt?: string;
  lastUpdatedAt?: string;
  passageMayBePartial: true;
  estimatedMicroUsd: number;
  requestCount: 1;
}

export interface WebIqBrowsePending {
  schemaVersion: 'webiq.browse.response.v1';
  status: 'pending';
  sourceId: string;
  retryAt: string | null;
  retryTicket: string | null;
  estimatedMicroUsd: number;
  requestCount: 1;
}

export type WebIqBrowseResponse = WebIqBrowsePassage | WebIqBrowsePending;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function browseRetryAt(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  const normalized = new Date(parsed).toISOString();
  const input = value.includes('.') ? value.replace(/\.(\d{1,3})Z$/, (_, digits: string) => `.${digits.padEnd(3, '0')}Z`) : value.replace(/Z$/, '.000Z');
  return normalized === input ? normalized : null;
}

/** Reads a bounded JSON envelope and observes cancellation even during body streaming. */
export async function readWebIqBrowseJson(response: Response, signal: AbortSignal): Promise<unknown> {
  const declared = response.headers.get('content-length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > WEB_IQ_BROWSE_MAX_RESPONSE_BYTES)) {
    throw new Error('Invalid Browse response.');
  }
  if (!response.body) throw new Error('Invalid Browse response.');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const part = await abortable(reader.read(), signal);
      if (part.done) break;
      length += part.value.byteLength;
      if (length > WEB_IQ_BROWSE_MAX_RESPONSE_BYTES) throw new Error('Invalid Browse response.');
      chunks.push(part.value);
    }
  } finally { void reader.cancel().catch(() => undefined); }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body));
}

export function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(new Error('Browse request aborted.'));
    signal.addEventListener('abort', abort, { once: true });
    promise.then(value => { signal.removeEventListener('abort', abort); resolve(value); },
      error => { signal.removeEventListener('abort', abort); reject(error); });
    if (signal.aborted) abort();
  });
}

export function parseWebIqBrowsePassage(payload: unknown): Pick<WebIqBrowsePassage, 'url' | 'title' | 'content' | 'crawledAt' | 'lastUpdatedAt'> | null {
  if (!isRecord(payload) || payload.isAdult === true
    || ('isAdult' in payload && typeof payload.isAdult !== 'boolean')
    || ['error', 'errors', 'errorCode', 'errorCategory', 'userMessage', 'technicalDetails'].some(key => key in payload)) return null;
  const url = safeWebIqBrowseUrl(payload.url);
  if (!url || typeof payload.title !== 'string' || !payload.title.trim()
    || typeof payload.content !== 'string' || payload.content.length > WEB_IQ_BROWSE_MAX_LENGTH) return null;
  const crawledAt = typeof payload.crawledAt === 'string' && payload.crawledAt.length <= 64 ? payload.crawledAt : undefined;
  const lastUpdatedAt = typeof payload.lastUpdatedAt === 'string' && payload.lastUpdatedAt.length <= 64 ? payload.lastUpdatedAt : undefined;
  return { url, title: payload.title.trim().slice(0, 300), content: payload.content.trim(),
    ...(crawledAt ? { crawledAt } : {}), ...(lastUpdatedAt ? { lastUpdatedAt } : {}) };
}

export function browseForbiddenCode(payload: unknown): string {
  const code = isRecord(payload) && typeof payload.errorCode === 'string' ? payload.errorCode.toLowerCase() : '';
  if (code === 'authcontentformatforbidden') return 'BROWSE_FULL_CONTENT_FORBIDDEN';
  // Only explicit publisher/content policy codes justify a policy diagnosis.
  if (['browseapiisfilteredout', 'browseapiisurlexcluded', 'urlfilteredoutspamadult', 'urlfilteredoutencumbrance', 'urlfilteredoutsource403forbidden'].includes(code)) return 'BROWSE_POLICY_BLOCKED';
  return 'BROWSE_ACCESS_DENIED';
}
