import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getWebIqRequestAuth, isWebIqConfigured } from '@/lib/webIqAuth';
import { getWebIqBotProtectionConfig, verifyWebIqBotCheck } from '@/lib/webIqBotCheck';
import { abortable, browseForbiddenCode, browseRetryAt, isRecord, parseWebIqBrowsePassage, readWebIqBrowseJson, WEB_IQ_BROWSE_MAX_LENGTH } from '@/lib/webIqBrowse';
import { WEB_IQ_BROWSE_MICRO_USD } from '@/lib/webIqPricing';
import { createWebIqBrowseRetryTicket, isWebIqSourceTicketConfigured, verifyWebIqSourceTicket } from '@/lib/webIqSourceTicket';
import { reserveWebIqUsage, usageErrorResponse } from '@/lib/webIqUsage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 40;
const headers = { 'Cache-Control': 'no-store' };
const requestSchema = z.object({
  schemaVersion: z.literal('webiq.browse.request.v1'),
  sourceId: z.string().regex(/^W[1-5]$/),
  sourceTicket: z.string().min(1).max(8_192),
  turnstileToken: z.unknown().optional(),
}).strict();

function configured() {
  return process.env.WEBIQ_BROWSE_ENABLED === 'true'
    && isWebIqConfigured() && isWebIqSourceTicketConfigured()
    && Number.isSafeInteger(WEB_IQ_BROWSE_MICRO_USD) && WEB_IQ_BROWSE_MICRO_USD === 1_000;
}

function failure(code: string, status: number, extra: Record<string, unknown> = {}, extraHeaders: Record<string, string> = {}) {
  return NextResponse.json({ code, error: 'The selected source passage could not be returned.', ...extra },
    { status, headers: { ...headers, ...extraHeaders } });
}

/** Configuration readiness is not evidence of AppID access or broker compatibility. */
export async function GET(request: NextRequest) {
  const bot = getWebIqBotProtectionConfig(request);
  return NextResponse.json({ configured: configured() && bot.configured,
    enabled: process.env.WEBIQ_BROWSE_ENABLED === 'true', access: 'not_verified',
    brokerCompatibility: 'requires_browse_1000',
    botProtectionConfigured: bot.configured, turnstileSiteKey: bot.siteKey,
  }, { headers });
}

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const deadline = Date.now() + 30_000;
  request.signal.addEventListener('abort', abort, { once: true });
  if (request.signal.aborted) controller.abort();
  const timer = setTimeout(abort, 30_000);
  let upstreamTimer: ReturnType<typeof setTimeout> | undefined;
  let requestCount = 0;
  try {
    const body = await abortable(request.json(), controller.signal).catch(() => null);
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) return failure('BROWSE_INVALID_REQUEST', 400);
    if (!configured()) return failure('BROWSE_NOT_CONFIGURED', 503);
    const { sourceId, sourceTicket, turnstileToken } = parsed.data;
    const ticket = verifyWebIqSourceTicket(sourceTicket, sourceId);
    if (!ticket) return failure('BROWSE_SOURCE_EXPIRED_OR_INVALID', 400);
    const botError = await abortable(verifyWebIqBotCheck(request, turnstileToken, 'webiq_browse'), controller.signal);
    if (botError) return botError;
    const auth = await abortable(getWebIqRequestAuth(controller.signal, 'browse'), controller.signal);
    try { await abortable(reserveWebIqUsage(request, WEB_IQ_BROWSE_MICRO_USD), controller.signal); }
    catch (error) { if (controller.signal.aborted) throw error; return usageErrorResponse(error); }
    // Reservation is retained for pending, upstream failure, timeout and cancellation.
    if (controller.signal.aborted || Date.now() >= deadline) throw new Error('Browse deadline exceeded.');
    upstreamTimer = setTimeout(abort, Math.min(20_000, Math.max(1, deadline - Date.now())));
    requestCount = 1;
    const upstream = await abortable(fetch(auth.url, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...auth.headers },
      body: JSON.stringify({ url: ticket.url, query: ticket.query, contentFormat: 'passage',
        maxLength: WEB_IQ_BROWSE_MAX_LENGTH, liveCrawl: 'fallback', renderDynamicPages: false,
        includeWebLinks: false, includeImageLinks: false }),
      signal: controller.signal, redirect: 'error', cache: 'no-store',
    }), controller.signal);
    const payload = await readWebIqBrowseJson(upstream, controller.signal).catch(error => {
      if (controller.signal.aborted) throw error;
      return null;
    });
    const common = { schemaVersion: 'webiq.browse.response.v1', sourceId,
      estimatedMicroUsd: WEB_IQ_BROWSE_MICRO_USD, requestCount };
    if (upstream.status === 202) {
      if (!isRecord(payload) || 'content' in payload || 'title' in payload) return failure('BROWSE_INVALID_RESPONSE', 502, { requestCount });
      const retryAt = browseRetryAt(payload.retryAfter);
      // Retry remains bound to the original source, never a provider-supplied new URL.
      const retryTicket = retryAt ? createWebIqBrowseRetryTicket(ticket, retryAt) : null;
      return NextResponse.json({ ...common, status: 'pending', retryAt, retryTicket }, { status: 202, headers });
    }
    if (upstream.status === 403) return failure(browseForbiddenCode(payload), 403, { requestCount });
    if (upstream.status === 401) return failure('BROWSE_ACCESS_DENIED', 403, { requestCount });
    if (upstream.status === 404) return failure('BROWSE_NOT_FOUND', 404, { requestCount });
    if (upstream.status === 400) return failure('BROWSE_UPSTREAM_INVALID_REQUEST', 400, { requestCount });
    if (upstream.status === 429 || upstream.status === 430) {
      const retryAfter = upstream.headers.get('Retry-After');
      const seconds = retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) : NaN;
      const retryAt = browseRetryAt(isRecord(payload) ? payload.retryAfter : null);
      const retryAfterSeconds = Number.isSafeInteger(seconds) && seconds > 0 && seconds <= 86_400 ? seconds : null;
      return failure('BROWSE_RATE_LIMITED', 429, { requestCount, retryAt, retryAfterSeconds },
        retryAfterSeconds ? { 'Retry-After': String(retryAfterSeconds) } : {});
    }
    if (upstream.status !== 200) return failure('BROWSE_UPSTREAM_FAILED', 502, { requestCount });
    const passage = parseWebIqBrowsePassage(payload);
    if (!passage) return failure('BROWSE_INVALID_RESPONSE', 502, { requestCount });
    // A cross-host canonical response must not be attributed to the selected source.
    if (new URL(passage.url).hostname !== new URL(ticket.url).hostname) {
      return failure('BROWSE_SOURCE_MISMATCH', 502, { requestCount });
    }
    return NextResponse.json({ ...common, ...passage, status: passage.content ? 'passage' : 'empty',
      retrievedAt: new Date().toISOString(), passageMayBePartial: true }, { headers });
  } catch {
    return failure(request.signal.aborted ? 'BROWSE_CANCELLED' : controller.signal.aborted ? 'BROWSE_TIMEOUT' : 'BROWSE_FAILED',
      request.signal.aborted ? 499 : controller.signal.aborted ? 504 : 502, { requestCount });
  } finally {
    clearTimeout(timer);
    if (upstreamTimer) clearTimeout(upstreamTimer);
    request.signal.removeEventListener('abort', abort);
  }
}
