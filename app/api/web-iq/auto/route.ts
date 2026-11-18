import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getWebIqRequestAuth, isWebIqConfigured } from '@/lib/webIqAuth';
import { abortableAuto, parseWebIqAutoPayload, readWebIqAutoJson, WEB_IQ_AUTO_LOCATION_ID, WEB_IQ_AUTO_QUESTION } from '@/lib/webIqAuto';
import { getTimeZoneServiceQuestion, parseWebIqTimeZonePayload, TIME_ZONE_CITY_IDS } from '@/lib/webIqAutoTimeZone';
import { getWebIqBotProtectionConfig, verifyWebIqBotCheck } from '@/lib/webIqBotCheck';
import { WEB_IQ_AUTO_MICRO_USD } from '@/lib/webIqPricing';
import { reserveWebIqUsage, usageErrorResponse } from '@/lib/webIqUsage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 40;
const headers = { 'Cache-Control': 'no-store' };
const requestFields = {
  language: z.enum(['ko', 'en']),
  turnstileToken: z.unknown().optional(),
};
const requestSchema = z.discriminatedUnion('schemaVersion', [
  z.object({ ...requestFields, schemaVersion: z.literal('webiq.auto.request.v1'),
    locationId: z.literal(WEB_IQ_AUTO_LOCATION_ID) }).strict(),
  z.object({ ...requestFields, schemaVersion: z.literal('webiq.auto.timezone.request.v1'),
    cityId: z.enum(TIME_ZONE_CITY_IDS) }).strict(),
]);

function configured() {
  // A strict opt-in is the operator's execution gate, never proof of current AppID entitlement.
  const appIdConfigured = (process.env.WEBIQ_AUTH_METHOD?.trim() || 'api-key') !== 'entra'
    || Boolean(process.env.WEBIQ_APP_ID?.trim());
  // Auto must use the shared broker; absent configuration must not select the direct-store adapter.
  return process.env.WEBIQ_AUTO_ENABLED === 'true' && isWebIqConfigured() && appIdConfigured
    && Boolean(process.env.DEMO_USAGE_BROKER_URL?.trim()) && Boolean(process.env.DEMO_USAGE_BROKER_SECRET?.trim())
    && Number.isSafeInteger(WEB_IQ_AUTO_MICRO_USD) && WEB_IQ_AUTO_MICRO_USD === 8_000;
}

type ReservationStatus = 'not_reserved' | 'retained' | 'unknown';

function reservationMetadata(reservation: ReservationStatus) {
  return { reservation, estimatedMicroUsd: reservation === 'unknown' ? null : reservation === 'retained' ? WEB_IQ_AUTO_MICRO_USD : 0,
    reservationPotentialMicroUsd: reservation === 'not_reserved' ? 0 : WEB_IQ_AUTO_MICRO_USD };
}

/** Readiness reads local configuration only; a reservation still checks broker support atomically. */
export async function GET(request: NextRequest) {
  const bot = getWebIqBotProtectionConfig(request);
  return NextResponse.json({ schemaVersion: 'webiq.auto.readiness.v1',
    configured: configured() && bot.configured, enabled: process.env.WEBIQ_AUTO_ENABLED === 'true',
    access: 'not_verified', brokerCompatibility: 'requires_auto_8000', mode: 'lite', productStatus: 'ga',
    estimatedMicroUsd: WEB_IQ_AUTO_MICRO_USD, botProtectionConfigured: bot.configured, turnstileSiteKey: bot.siteKey,
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
  let reserved = false;
  let reservationAttempted = false;
  let schemaVersion = 'webiq.auto.response.v1';
  const fail = (code: string, status: number) => NextResponse.json({ schemaVersion, code,
    error: schemaVersion === 'webiq.auto.timezone.response.v1' ? 'The time-zone comparison could not be verified.'
      : 'Weather evidence could not be verified. No fallback or automatic retry was made.',
    requestCount, mode: 'lite', ...reservationMetadata(reserved ? 'retained' : reservationAttempted ? 'unknown' : 'not_reserved'),
  }, { status, headers });
  try {
    if (controller.signal.aborted) throw new Error('Auto cancelled before validation.');
    const body = await readWebIqAutoJson(request, controller.signal, 4_096).catch(error => {
      if (controller.signal.aborted) throw error;
      return null;
    });
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) return fail('AUTO_INVALID_REQUEST', 400);
    const cityId = parsed.data.schemaVersion === 'webiq.auto.timezone.request.v1' ? parsed.data.cityId : null;
    if (cityId) schemaVersion = 'webiq.auto.timezone.response.v1';
    if (!configured()) return fail('AUTO_NOT_CONFIGURED', 503);
    const { language, turnstileToken } = parsed.data;
    const botError = await abortableAuto(verifyWebIqBotCheck(request, turnstileToken, 'webiq_auto'), controller.signal);
    if (botError) return botError;
    const auth = await abortableAuto(getWebIqRequestAuth(controller.signal, 'auto'), controller.signal);
    reservationAttempted = true;
    try { await abortableAuto(reserveWebIqUsage(request, WEB_IQ_AUTO_MICRO_USD), controller.signal); reserved = true; }
    catch (error) {
      if (controller.signal.aborted) throw error;
      const denied = usageErrorResponse(error);
      const body = await denied.json();
      // A transport failure may conceal a committed reservation. Do not report it as a free attempt.
      const knownDenial = denied.status === 429 && ['RATE_LIMITED', 'DAILY_BUDGET_EXHAUSTED'].includes(body.code);
      return NextResponse.json({ ...body, schemaVersion, requestCount, mode: 'lite',
        ...reservationMetadata(knownDenial ? 'not_reserved' : 'unknown') }, { status: denied.status, headers: denied.headers });
    }
    // The entire 8,000 microUSD reservation remains charged even for cancellation, empty evidence or response loss.
    if (controller.signal.aborted || Date.now() >= deadline) throw new Error('Auto deadline exceeded.');
    upstreamTimer = setTimeout(abort, Math.min(20_000, Math.max(1, deadline - Date.now())));
    requestCount = 1;
    const upstream = await abortableAuto(fetch(auth.url, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...auth.headers },
      body: JSON.stringify({ query: cityId ? getTimeZoneServiceQuestion(cityId, language) : WEB_IQ_AUTO_QUESTION[language],
        language, region: 'KR', mode: 'lite', responseFilter: [cityId ? 'timezone' : 'weather'], maxResponseLength: 1_500, maxCitations: 5 }),
      signal: controller.signal, redirect: 'error', cache: 'no-store',
    }), controller.signal);
    if (upstream.status !== 200) {
      void upstream.body?.cancel().catch(() => undefined);
      if (upstream.status === 401 || upstream.status === 403) return fail('AUTO_ACCESS_DENIED', 403);
      if (upstream.status === 429 || upstream.status === 430) return fail('AUTO_RATE_LIMITED', 429);
      return fail('AUTO_UPSTREAM_FAILED', 502);
    }
    const payload = await readWebIqAutoJson(upstream, controller.signal).catch(error => {
      if (controller.signal.aborted) throw error;
      return null;
    });
    const result = cityId ? parseWebIqTimeZonePayload(payload, cityId) : parseWebIqAutoPayload(payload);
    if (!result) return fail('AUTO_INVALID_RESPONSE', 502);
    return NextResponse.json({ schemaVersion, ...(cityId ? { cityId } : {}), ...result,
      retrievedAt: new Date().toISOString(), mode: 'lite', estimatedMicroUsd: WEB_IQ_AUTO_MICRO_USD, requestCount,
    }, { headers });
  } catch {
    return fail(request.signal.aborted ? 'AUTO_CANCELLED' : controller.signal.aborted ? 'AUTO_TIMEOUT' : 'AUTO_FAILED',
      request.signal.aborted ? 499 : controller.signal.aborted ? 504 : 502);
  } finally {
    clearTimeout(timer);
    if (upstreamTimer) clearTimeout(upstreamTimer);
    request.signal.removeEventListener('abort', abort);
  }
}
