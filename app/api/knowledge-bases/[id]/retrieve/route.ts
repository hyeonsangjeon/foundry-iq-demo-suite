import { NextRequest, NextResponse } from 'next/server';
import { tokenManager } from '@/lib/token-manager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT;
const API_KEY = process.env.AZURE_SEARCH_API_KEY;
const API_VERSION = process.env.AZURE_SEARCH_API_VERSION;
const USE_RBAC = process.env.AZURE_SEARCH_USE_RBAC === 'true';
const PROVIDER_CODES = new Set([
  'InvalidAgentRetrievalRequest', 'InvalidRequest', 'InvalidRequestParameter', 'InvalidParameter',
  'BadRequest', 'Unauthorized', 'Forbidden', 'ResourceNotFound', 'IndexNotFound',
  'KnowledgeBaseNotFound', 'TooManyRequests', 'QuotaExceeded', 'ServiceUnavailable',
  'InternalServerError', 'Timeout', 'OperationNotAllowed', 'InvalidCredentials',
]);

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Extract only a known provider code; messages, source content and credentials stay server-side. */
function providerCode(value: unknown, depth = 0): string | undefined {
  if (!value || typeof value !== 'object' || depth > 4) return undefined;
  if (Array.isArray(value)) {
    for (const child of value.slice(0, 10)) {
      const code = providerCode(child, depth + 1);
      if (code) return code;
    }
    return undefined;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.code === 'string' && PROVIDER_CODES.has(record.code)) return record.code;
  for (const key of ['error', 'details', 'innererror', 'innerError']) {
    const code = providerCode(record[key], depth + 1);
    if (code) return code;
  }
  return undefined;
}

function failure(status: number, code: string, options: {
  upstreamStatus?: number; providerCode?: string; retryAfterSeconds?: number;
} = {}) {
  return NextResponse.json({
    schemaVersion: 'kb.retrieve.error.v1', code, stage: 'kb',
    error: 'Knowledge base retrieval could not be completed.', status, ...options,
  }, { status, headers: {
    'Cache-Control': 'no-store', 'X-KB-Error-Schema': 'kb.retrieve.error.v1',
    ...(options.retryAfterSeconds ? { 'Retry-After': String(options.retryAfterSeconds) } : {}),
  } });
}

function upstreamCode(status: number): string {
  if (status === 401 || status === 403) return 'KB_ACCESS_DENIED';
  if (status === 404) return 'KB_NOT_FOUND';
  if (status === 408 || status === 504) return 'KB_TIMEOUT';
  if (status === 429) return 'KB_RATE_LIMITED';
  return 'KB_RETRIEVAL_FAILED';
}

export async function POST(request: NextRequest, context: RouteContext) {
  let body: unknown;
  try { body = await request.json(); } catch { return failure(400, 'KB_INVALID_REQUEST'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return failure(400, 'KB_INVALID_REQUEST');
  if (!ENDPOINT || !API_VERSION || (!USE_RBAC && !API_KEY)) return failure(503, 'KB_NOT_CONFIGURED');
  if (request.signal.aborted) return failure(499, 'KB_CANCELLED');

  let authHeaders: Record<string, string>;
  try {
    authHeaders = USE_RBAC
      ? { Authorization: `Bearer ${await tokenManager.getSearchToken()}` }
      : { 'api-key': API_KEY! };
  } catch {
    return request.signal.aborted ? failure(499, 'KB_CANCELLED') : failure(503, 'KB_AUTH_FAILED');
  }
  if (request.signal.aborted) return failure(499, 'KB_CANCELLED');

  try {
    const { id } = await context.params;
    const url = `${ENDPOINT.trim().replace(/\/+$/, '')}/knowledgebases/${encodeURIComponent(id)}/retrieve?api-version=${encodeURIComponent(API_VERSION)}`;
    const aclHeader = request.headers.get('x-ms-query-source-authorization')
      ?? request.headers.get('x-ms-user-authorization');
    const response = await fetch(url, {
      method: 'POST', cache: 'no-store', redirect: 'error', signal: request.signal,
      headers: { 'Content-Type': 'application/json', ...authHeaders,
        ...(aclHeader ? { 'x-ms-query-source-authorization': aclHeader } : {}) },
      body: JSON.stringify(body),
    });
    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const status = response.status >= 400 && response.status <= 599 ? response.status : 502;
      const retryHeader = response.headers.get('Retry-After') || '';
      const retry = /^\d{1,5}$/.test(retryHeader) ? Number(retryHeader) : 0;
      const safeProviderCode = providerCode(data);
      return failure(status, upstreamCode(status), { upstreamStatus: response.status,
        ...(safeProviderCode ? { providerCode: safeProviderCode } : {}),
        ...(retry > 0 && retry <= 86_400 ? { retryAfterSeconds: retry } : {}),
      });
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return failure(502, 'KB_INVALID_RESPONSE');
    // Keep the successful Azure response intact so comparison reuses the original snapshot.
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return request.signal.aborted ? failure(499, 'KB_CANCELLED') : failure(502, 'KB_RETRIEVAL_FAILED');
  }
}
