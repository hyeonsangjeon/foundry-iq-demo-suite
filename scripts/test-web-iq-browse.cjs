'use strict';

// Offline only: fake credentials, injected fetch, no env-file reads or network calls.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const compiled = new Map();
function harness(options = {}) {
  const env = { WEBIQ_AUTH_METHOD: 'api-key', WEBIQ_API_KEY: 'offline-api-key',
    WEBIQ_BROWSE_ENABLED: 'true', WEBIQ_SOURCE_TICKET_SECRET: 'offline-ticket-secret-not-valid-in-production',
    TURNSTILE_SITE_KEY: '0x4AAAAAAAOfflineSiteKey', TURNSTILE_SECRET_KEY: '0x4AAAAAAAOfflineSecretKey',
    TURNSTILE_ALLOWED_HOSTNAMES: 'public-demo.example', ...options.env };
  const events = [], reservations = [], requests = [], modules = new Map(), consumed = new Set();
  const fetch = async (url, init) => {
    const body = JSON.parse(init.body);
    if (url === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
      events.push('bot');
      if (options.botThrows) throw new Error('offline outage');
      const duplicate = consumed.has(body.response); consumed.add(body.response);
      return Response.json({ success: !duplicate && body.response !== 'bad', hostname: 'public-demo.example',
        action: 'webiq_browse', challenge_ts: new Date().toISOString(), ...options.botClaims });
    }
    assert.equal(url, 'https://api.microsoft.ai/v3/browse');
    events.push('browse'); requests.push({ url, body, init });
    assert.equal(init.redirect, 'error'); assert.equal(init.cache, 'no-store');
    assert.equal(init.headers['x-apikey'], 'offline-api-key');
    if (options.upstreamThrows) throw new Error('Ambiguous upstream result');
    if (options.pendingFetch) return new Promise(() => {});
    if (options.response) return options.response();
    return Response.json(options.payload || { url: 'https://science.nasa.gov/earth/', title: 'NASA', content: 'A relevant passage.' },
      { status: options.status || 200, headers: options.headers });
  };
  const tokenManager = { isServicePrincipalCredential: () => true, getToken: async () => { events.push('auth'); return 'offline-token'; } };
  const usage = {
    reserveWebIqUsage: async (_request, amount) => {
      events.push('reserve');
      if (options.denial) throw new Error(options.denial);
      reservations.push(amount); return { id: 'offline-not-exposed' };
    },
    usageErrorResponse: () => Response.json({ code: 'USAGE_GUARD_UNAVAILABLE' }, { status: 503 }),
  };
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (modules.has(filename)) return modules.get(filename);
    if (!compiled.has(filename)) compiled.set(filename, ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText);
    const exports = {}; modules.set(filename, exports);
    vm.runInNewContext(compiled.get(filename), { exports,
      require: name => {
        if (name === 'next/server') return { NextResponse: Response, NextRequest: Request };
        if (name === '@/lib/token-manager') return { tokenManager };
        if (name === '@/lib/webIqUsage') return usage;
        if (name.startsWith('@/')) return load(`${name.slice(2)}.ts`);
        if (['node:crypto','node:net','zod'].includes(name)) return require(name);
        throw new Error(`Unexpected dependency ${name}`);
      }, process: { env }, Buffer, URL, Headers, Request, Response, TextEncoder, TextDecoder,
      Uint8Array, AbortController, AbortSignal, setTimeout: (fn, ms) => setTimeout(fn,
        options.shortDeadline && ms >= 20_000 ? 10 : ms), clearTimeout, fetch,
    }, { filename });
    return exports;
  }
  const tickets = load('lib/webIqSourceTicket.ts');
  const source = tickets.attachWebIqSourceTickets([{ title: 'NASA', url: 'https://science.nasa.gov/earth/', content: 'Search summary.' }], 'NASA Earth at night')[0];
  const route = load('app/api/web-iq/browse/route.ts');
  const post = (extra = {}, signal) => route.POST(new Request('https://public-demo.example/api/web-iq/browse', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal,
    body: JSON.stringify({ schemaVersion: 'webiq.browse.request.v1', sourceId: source.sourceId,
      sourceTicket: source.sourceTicket, turnstileToken: `token-${consumed.size}`, ...extra }),
  }));
  return { env, source, tickets, route, load, post, events, reservations, requests };
}

test('Q16 signed tickets reject tampering, mismatch, expiry, private URL and missing signing configuration', () => {
  const h = harness();
  const verified = h.tickets.verifyWebIqSourceTicket(h.source.sourceTicket, 'W1');
  assert.equal(verified.query, 'NASA Earth at night'); assert.equal(verified.attempt, 1);
  assert.equal(h.tickets.verifyWebIqSourceTicket(`${h.source.sourceTicket}x`, 'W1'), null);
  assert.equal(h.tickets.verifyWebIqSourceTicket(h.source.sourceTicket, 'W2'), null);
  assert.equal(h.tickets.verifyWebIqSourceTicket(h.source.sourceTicket, 'W1', verified.expiresAt), null);
  for (const url of ['http://nasa.gov/', 'https://localhost/', 'https://127.0.0.1/', 'https://0x7f000001/',
    'https://[::1]/', 'https://user:pass@nasa.gov/', 'https://nasa.gov:444/', 'https://nasa.gov/#',
    'https://metadata.google.internal/', 'https://api.internal/', 'https://foo.local/', 'https://nasa.gov/\n',
    'javascript:alert(1)', 'https://nasa.gov\\@127.0.0.1/']) {
    assert.equal(h.tickets.safeWebIqBrowseUrl(url), null, url);
    assert.equal(h.tickets.attachWebIqSourceTickets([{ title: 'x', url, content: 'x' }], 'q')[0].sourceTicket, undefined);
  }
  assert.equal(harness({ env: { WEBIQ_SOURCE_TICKET_SECRET: '' } }).source.sourceTicket, undefined);
  const allowed = harness({ env: { WEBIQ_BROWSE_ALLOWED_HOSTS: 'www.nasa.gov' } });
  assert.equal(allowed.source.sourceTicket, undefined);
});

test('Q15 auth helper uses only fixed endpoints, API keys omit APPID, invalid endpoint is rejected', async () => {
  const h = harness({ env: { WEBIQ_APP_ID: 'not-an-entra-client-id' } });
  const auth = h.load('lib/webIqAuth.ts'); const signal = new AbortController().signal;
  for (const [kind, pathname] of [['web', '/v3/search/web'], ['browse', '/v3/browse'], ['auto', '/v3/auto']]) {
    const value = await auth.getWebIqRequestAuth(signal, kind);
    assert.equal(value.url, `https://api.microsoft.ai${pathname}`);
    assert.equal(value.headers['x-apikey'], 'offline-api-key');
  }
  await assert.rejects(auth.getWebIqRequestAuth(signal, 'https://evil.example/'));
  const entra = harness({ env: { WEBIQ_AUTH_METHOD: 'entra', AZURE_TENANT_ID: 'offline', AZURE_CLIENT_ID: 'offline', AZURE_CLIENT_SECRET: 'offline', WEBIQ_APP_ID: 'bound-app' } });
  const result = await entra.load('lib/webIqAuth.ts').getWebIqRequestAuth(signal, 'browse');
  assert.equal(result.url, 'https://api.microsoft.ai/v3/browse?APPID=bound-app');
  assert.equal(result.headers.Authorization, 'Bearer offline-token');
});

test('Q17 Browse returns separate passage with one reservation, one upstream and no model call', async () => {
  const h = harness(); const response = await h.post(); const result = await response.json();
  assert.equal(response.status, 200); assert.equal(result.status, 'passage');
  assert.equal(result.sourceId, 'W1'); assert.equal(result.estimatedMicroUsd, 1_000);
  assert.equal(result.requestCount, 1); assert.equal(result.passageMayBePartial, true);
  assert.deepEqual(h.events, ['bot', 'reserve', 'browse']); assert.deepEqual(h.reservations, [1_000]);
  assert.equal(h.requests.length, 1);
  assert.deepEqual(h.requests[0].body, { url: h.source.url, query: 'NASA Earth at night', contentFormat: 'passage',
    maxLength: 3_000, liveCrawl: 'fallback', renderDynamicPages: false, includeWebLinks: false, includeImageLinks: false });
  assert.equal(JSON.stringify(result).includes('offline'), false);
});

test('Q16 raw URL, forged source, expired ticket and strict extra fields cause no verification, reservation or paid call', async () => {
  for (const fields of [{ url: 'https://www.nasa.gov/' }, { query: 'changed' }, { maxLength: 99 },
    { sourceId: 'I1' }, { sourceId: 'W2' }, { sourceTicket: 'tampered' }, { renderDynamicPages: true }]) {
    const h = harness(); assert.equal((await h.post(fields)).status, 400); assert.equal(h.events.length, 0);
  }
});

test('Q14 missing, invalid, wrong action/host/age and provider replay rejection happen before reservation', async () => {
  for (const options of [{ extra: { turnstileToken: undefined } }, { extra: { turnstileToken: 'bad' } },
    { botClaims: { action: 'webiq_search' } }, { botClaims: { hostname: 'other.example' } },
    { botClaims: { challenge_ts: '2020-01-01T00:00:00Z' } }]) {
    const h = harness(options); assert.equal((await h.post(options.extra)).status, 403); assert.equal(h.reservations.length, 0); assert.equal(h.requests.length, 0);
  }
  const h = harness(); assert.equal((await h.post({ turnstileToken: 'same-token' })).status, 200);
  assert.equal((await h.post({ turnstileToken: 'same-token' })).status, 403);
  assert.equal(h.requests.length, 1); // Siteverify rejection, not a global exactly-once guarantee.
});

test('Q18/Q19 202 has no content, never polls and only offers one signed source-bound earliest-time retry', async () => {
  const retryAt = new Date(Date.now() + 40).toISOString();
  const h = harness({ status: 202, payload: { url: 'https://different.nasa.gov/crawl', retryAfter: retryAt } });
  const first = await (await h.post()).json();
  assert.equal(first.status, 'pending'); assert.equal('content' in first, false); assert.ok(first.retryTicket);
  assert.equal(h.tickets.verifyWebIqSourceTicket(first.retryTicket, 'W1'), null);
  await new Promise(resolve => setTimeout(resolve, 60));
  const retry = h.tickets.verifyWebIqSourceTicket(first.retryTicket, 'W1');
  assert.equal(retry.url, h.source.url); assert.equal(retry.attempt, 2);
  assert.equal(h.requests.length, 1);
  const second = await (await h.post({ sourceTicket: first.retryTicket })).json();
  assert.equal(second.status, 'pending'); assert.equal(second.retryTicket, null);
  assert.deepEqual(h.reservations, [1_000, 1_000]); assert.equal(h.requests.length, 2);
});

test('Q18 missing or invalid retryAfter is pending without automatic or unbounded retry', async () => {
  for (const retryAfter of [undefined, 'tomorrow', '2026-01-01T00:00:00+09:00', '2026-02-30T00:00:00Z', '9999-01-01T00:00:00Z']) {
    const h = harness({ status: 202, payload: { retryAfter } });
    const result = await (await h.post()).json(); assert.equal(result.status, 'pending');
    assert.equal(result.retryTicket, null); assert.equal(h.requests.length, 1);
  }
});

test('Q20 403 distinguishes full-content, explicit policy and unknown access without fallback', async () => {
  for (const [errorCode, code] of [['AuthContentFormatForbidden', 'BROWSE_FULL_CONTENT_FORBIDDEN'],
    ['URLFilteredOutEncumbrance', 'BROWSE_POLICY_BLOCKED'], ['unknown', 'BROWSE_ACCESS_DENIED']]) {
    const h = harness({ status: 403, payload: { errorCode } }); const response = await h.post();
    assert.equal(response.status, 403); assert.equal((await response.json()).code, code);
    assert.equal(h.requests.length, 1); assert.deepEqual(h.reservations, [1_000]);
  }
});

test('Q20/Q21 404, empty, 400, 429, malformed, adult and excessive bodies retain reservations without fallback', async () => {
  for (const [options, status, code] of [
    [{ status: 404 }, 404, 'BROWSE_NOT_FOUND'], [{ status: 400 }, 400, 'BROWSE_UPSTREAM_INVALID_REQUEST'],
    [{ status: 429, headers: { 'Retry-After': '12' } }, 429, 'BROWSE_RATE_LIMITED'],
    [{ response: () => new Response('{') }, 502, 'BROWSE_INVALID_RESPONSE'],
    [{ payload: { url: 'https://www.nasa.gov/', title: 'NASA', content: 'x'.repeat(3_001) } }, 502, 'BROWSE_INVALID_RESPONSE'],
    [{ payload: { url: 'https://www.nasa.gov/', title: 'NASA', content: 'x', isAdult: true } }, 502, 'BROWSE_INVALID_RESPONSE'],
    [{ response: () => new Response('x'.repeat(65_537)) }, 502, 'BROWSE_INVALID_RESPONSE'],
    [{ response: () => new Response('{}', { headers: { 'Content-Length': '65537' } }) }, 502, 'BROWSE_INVALID_RESPONSE'],
    [{ upstreamThrows: true }, 502, 'BROWSE_FAILED'],
    [{ payload: { url: 'https://different.nasa.gov/', title: 'Other source', content: 'Must not be attributed to selected source.' } }, 502, 'BROWSE_SOURCE_MISMATCH'],
  ]) {
    const h = harness(options); const response = await h.post(); const result = await response.json();
    assert.equal(response.status, status); assert.equal(result.code, code); assert.equal(h.requests.length, 1);
    assert.deepEqual(h.reservations, [1_000]);
    if (status === 429) assert.equal(response.headers.get('Retry-After'), '12');
  }
  const h = harness({ payload: { url: 'https://science.nasa.gov/', title: 'NASA', content: '' } });
  assert.equal((await (await h.post()).json()).status, 'empty');
});

test('Q21 deadline and cancelled requests stop after at most one upstream and retain its reservation', async () => {
  const h = harness({ pendingFetch: true, shortDeadline: true });
  const timed = await h.post(); assert.equal(timed.status, 504); assert.equal((await timed.json()).code, 'BROWSE_TIMEOUT');
  assert.deepEqual(h.reservations, [1_000]); assert.equal(h.requests.length, 1);
  const cancel = harness({ pendingFetch: true }); const controller = new AbortController();
  const pending = cancel.post({}, controller.signal);
  while (!cancel.requests.length) await new Promise(resolve => setImmediate(resolve));
  controller.abort(); const response = await pending;
  assert.equal(response.status, 499); assert.equal((await response.json()).code, 'BROWSE_CANCELLED');
  assert.deepEqual(cancel.reservations, [1_000]); assert.equal(cancel.requests.length, 1);
});

test('Q12 flag/secret disabled and ledger failure fail closed; readiness GET never pays or claims access', async () => {
  for (const env of [{ WEBIQ_BROWSE_ENABLED: 'false' }, { WEBIQ_SOURCE_TICKET_SECRET: '' }]) {
    const h = harness({ env }); assert.equal((await h.post()).status, env.WEBIQ_SOURCE_TICKET_SECRET === '' ? 400 : 503);
    assert.equal(h.requests.length, 0); assert.equal(h.reservations.length, 0);
  }
  const h = harness({ denial: 'offline' }); assert.equal((await h.post()).status, 503);
  assert.equal(h.requests.length, 0);
  const ready = harness(); const result = await (await ready.route.GET(new Request('https://public-demo.example/api/web-iq/browse'))).json();
  assert.equal(result.configured, true); assert.equal(result.access, 'not_verified');
  assert.equal(ready.events.length, 0);
});
