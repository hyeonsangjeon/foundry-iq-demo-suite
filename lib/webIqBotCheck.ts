import { NextRequest, NextResponse } from 'next/server';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const VERIFY_TIMEOUT_MS = 6_000;
const TOKEN_LIFETIME_MS = 300_000;
const headers = { 'Cache-Control': 'no-store' };

export type WebIqBotAction = 'webiq_search' | 'webiq_answer' | 'webiq_browse';

function configuration() {
  const siteKey = process.env.TURNSTILE_SITE_KEY?.trim() || '';
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim() || '';
  const hostnames = (process.env.TURNSTILE_ALLOWED_HOSTNAMES || '')
    .split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
  const production = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
  const testKey = /^[123]x0{10,}/.test(siteKey) || /^[123]x0{10,}/.test(secret);
  const validHosts = hostnames.length > 0 && hostnames.every(hostname =>
    /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(hostname)
    && !hostname.includes('..')
    && (!production || !['localhost', '127.0.0.1'].includes(hostname)));
  const configured = siteKey.length >= 10 && secret.length >= 16
    && !/\s/.test(siteKey + secret) && validHosts && !(production && testKey);
  return { siteKey, secret, hostnames, configured };
}

/** Only approved request hosts receive the public widget key; missing protection fails closed. */
export function getWebIqBotProtectionConfig(request: Pick<NextRequest, 'url'>) {
  const config = configuration();
  let hostname: string;
  try { hostname = new URL(request.url).hostname.toLowerCase(); } catch {
    return { configured: false, siteKey: null };
  }
  const configured = config.configured && config.hostnames.includes(hostname);
  const { siteKey } = config;
  return { configured, siteKey: configured ? siteKey : null };
}

function errorResponse(code: 'BOT_CHECK_REQUIRED' | 'BOT_CHECK_FAILED' | 'BOT_CHECK_UNAVAILABLE') {
  const unavailable = code === 'BOT_CHECK_UNAVAILABLE';
  return NextResponse.json({
    code,
    error: unavailable
      ? 'Bot verification is temporarily unavailable. Please try again later.'
      : 'Please complete the verification and try your search again.',
  }, { status: unavailable ? 503 : 403, headers });
}

/** Validate every paid request before Azure authentication, reservation, or search. */
export async function verifyWebIqBotCheck(
  request: NextRequest,
  token: unknown,
  action: WebIqBotAction,
): Promise<NextResponse | null> {
  const config = configuration();
  if (!config.configured) return errorResponse('BOT_CHECK_UNAVAILABLE');
  if (token === undefined || token === null || token === '') return errorResponse('BOT_CHECK_REQUIRED');
  if (typeof token !== 'string' || token.length > 2048 || /\s/.test(token)) return errorResponse('BOT_CHECK_FAILED');
  let requestHostname: string;
  try { requestHostname = new URL(request.url).hostname.toLowerCase(); } catch { return errorResponse('BOT_CHECK_FAILED'); }
  if (!config.hostnames.includes(requestHostname)) return errorResponse('BOT_CHECK_FAILED');

  const controller = new AbortController();
  const abort = () => controller.abort();
  request.signal.addEventListener('abort', abort, { once: true });
  if (request.signal.aborted) controller.abort();
  const timeout = setTimeout(abort, VERIFY_TIMEOUT_MS);
  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: config.secret, response: token }),
      cache: 'no-store',
      redirect: 'error',
      signal: controller.signal,
    });
    if (!response.ok) return errorResponse('BOT_CHECK_UNAVAILABLE');
    const result: unknown = await response.json();
    if (!result || typeof result !== 'object' || Array.isArray(result)) return errorResponse('BOT_CHECK_UNAVAILABLE');
    const verification = result as Record<string, unknown>;
    if (typeof verification.success !== 'boolean') return errorResponse('BOT_CHECK_UNAVAILABLE');
    if (!verification.success) return errorResponse('BOT_CHECK_FAILED');
    const issuedAt = typeof verification.challenge_ts === 'string' ? Date.parse(verification.challenge_ts) : NaN;
    const age = Date.now() - issuedAt;
    if (verification.hostname !== requestHostname || verification.action !== action
      || !Number.isFinite(issuedAt) || age < -30_000 || age > TOKEN_LIFETIME_MS) {
      return errorResponse('BOT_CHECK_FAILED');
    }
    if (controller.signal.aborted) return errorResponse('BOT_CHECK_UNAVAILABLE');
    return null;
  } catch {
    return errorResponse('BOT_CHECK_UNAVAILABLE');
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener('abort', abort);
  }
}
