import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { attachWebIqSourceTickets } from '@/lib/webIqSourceTicket';
import { getWebIqRequestAuth, isWebIqConfigured } from '@/lib/webIqAuth';
import { getWebIqBotProtectionConfig, verifyWebIqBotCheck } from '@/lib/webIqBotCheck';
import { reserveWebIqUsage, usageErrorResponse, WEB_IQ_CALL_MICRO_USD } from '@/lib/webIqUsage';
import {
  parseWebIqSearchPayload,
  WEB_IQ_MAX_CONTENT_LENGTH,
  WEB_IQ_MAX_RESULTS,
  type WebIqSearchResponse,
} from '@/lib/webIqSearch';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 40;

const searchRequestSchema = z.object({
  query: z.string().trim().min(3).max(500),
  turnstileToken: z.unknown().optional(),
});
const responseHeaders = { 'Cache-Control': 'no-store' };

export async function GET(request: NextRequest) {
  const botProtection = getWebIqBotProtectionConfig(request);
  return NextResponse.json(
    { configured: isWebIqConfigured() && botProtection.configured,
      botProtectionConfigured: botProtection.configured, turnstileSiteKey: botProtection.siteKey },
    { headers: responseHeaders },
  );
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.' },
      { status: 400, headers: responseHeaders },
    );
  }

  const parsedRequest = searchRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: 'Enter a query between 3 and 500 characters.' },
      { status: 400, headers: responseHeaders },
    );
  }

  if (!isWebIqConfigured()) {
    return NextResponse.json(
      { error: 'Live Web IQ search is not configured.' },
      { status: 503, headers: responseHeaders },
    );
  }

  const { query, turnstileToken } = parsedRequest.data;
  const botError = await verifyWebIqBotCheck(request, turnstileToken, 'webiq_search');
  if (botError) return botError;
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  request.signal.addEventListener('abort', onAbort, { once: true });
  if (request.signal.aborted) controller.abort();
  const timeout = setTimeout(onAbort, 30_000);

  try {
    const auth = await getWebIqRequestAuth(controller.signal);
    if (controller.signal.aborted) throw new Error('Request aborted');
    try {
      await reserveWebIqUsage(request, WEB_IQ_CALL_MICRO_USD);
    } catch (error) {
      return usageErrorResponse(error);
    }
    // Once reserved, failures/cancellations keep the charge: upstream may have billed it.
    if (controller.signal.aborted) throw new Error('Request aborted');
    const upstream = await fetch(auth.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...auth.headers,
      },
      body: JSON.stringify({
        query,
        maxResults: WEB_IQ_MAX_RESULTS,
        contentFormat: 'passage',
        maxLength: WEB_IQ_MAX_CONTENT_LENGTH,
      }),
      signal: controller.signal,
      cache: 'no-store',
      redirect: 'error',
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: 'Live Web IQ search could not be completed.', upstreamStatus: upstream.status },
        { status: upstream.status === 429 ? 429 : 502, headers: responseHeaders },
      );
    }

    let payload: unknown;
    try {
      payload = await upstream.json();
    } catch {
      return NextResponse.json(
        { error: 'Web IQ returned an invalid response.' },
        { status: 502, headers: responseHeaders },
      );
    }

    const parsedResponse = parseWebIqSearchPayload(payload);
    if (!parsedResponse) {
      return NextResponse.json(
        { error: 'Web IQ returned an invalid response.' },
        { status: 502, headers: responseHeaders },
      );
    }

    const result: WebIqSearchResponse = {
      ...parsedResponse,
      results: attachWebIqSourceTickets(parsedResponse.results, query),
      retrievedAt: new Date().toISOString(),
      query,
    };
    return NextResponse.json(result, { headers: responseHeaders });
  } catch {
    return NextResponse.json(
      { error: controller.signal.aborted ? 'Live Web IQ search timed out.' : 'Live Web IQ search could not be completed.' },
      { status: controller.signal.aborted ? 504 : 502, headers: responseHeaders },
    );
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener('abort', onAbort);
  }
}
