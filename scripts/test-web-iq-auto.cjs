'use strict';

// Offline only: synthetic payloads and injected fetch. No credentials or env files are read.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const compiled = new Map();
const plain = value => JSON.parse(JSON.stringify(value));
function fixture() {
  return { results: [{ evidence: { type: 'structured/weather', content: {
    location: 'Incheon, South Korea', url: 'https://www.msn.com/weather/incheon',
    units: { system: 'Metric', temperature: 'C', speed: 'km/h' },
    currentWeather: { condition: 'Synthetic fixture', temperature: 0, windSpeed: 0, observedAt: new Date().toISOString() },
  } }, citations: [{ url: 'https://www.msn.com/weather/incheon', title: 'Synthetic weather fixture' }] }] };
}

function harness(options = {}) {
  const env = { WEBIQ_AUTH_METHOD: 'api-key', WEBIQ_API_KEY: 'offline-api-key', WEBIQ_AUTO_ENABLED: 'true',
    DEMO_USAGE_BROKER_URL: 'https://offline.azurecontainerapps.io', DEMO_USAGE_BROKER_SECRET: 'offline-broker-secret-not-a-real-credential',
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
        action: 'webiq_auto', challenge_ts: new Date().toISOString(), ...options.botClaims });
    }
    const parsed = new URL(url);
    assert.equal(`${parsed.origin}${parsed.pathname}`, 'https://api.microsoft.ai/v3/auto');
    events.push('auto'); requests.push({ url, body, init });
    assert.equal(init.redirect, 'error'); assert.equal(init.cache, 'no-store');
    if (options.onUpstream) options.onUpstream();
    if (options.upstreamThrows) throw new Error('Ambiguous upstream result');
    if (options.pendingFetch) return new Promise(() => {});
    if (options.response) return options.response();
    return Response.json(options.payload === undefined ? fixture() : options.payload, { status: options.status || 200 });
  };
  const tokenManager = { isServicePrincipalCredential: () => true, getToken: async () => {
    events.push('auth'); if (options.authThrows) throw new Error('offline token failure'); return 'offline-token';
  } };
  const usage = {
    reserveWebIqUsage: async (_request, amount) => {
      events.push('reserve');
      if (options.denial) throw new Error('offline reserve failed or lost response');
      reservations.push(amount);
      if (options.onReserve) options.onReserve();
      return { id: 'offline-not-exposed' };
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
        if (name === 'zod') return require(name);
        throw new Error(`Unexpected Auto dependency ${name}`);
      }, process: { env }, Buffer, URL, Headers, Request, Response, TextEncoder, TextDecoder,
      Uint8Array, AbortController, AbortSignal, setTimeout: (fn, ms) => setTimeout(fn,
        options.shortDeadline && ms >= 20_000 ? 10 : ms), clearTimeout, fetch,
    }, { filename });
    return exports;
  }
  const route = load('app/api/web-iq/auto/route.ts');
  const post = (extra = {}, signal) => route.POST(new Request('https://public-demo.example/api/web-iq/auto', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal,
    body: JSON.stringify({ schemaVersion: 'webiq.auto.request.v1', locationId: 'incheon-port', language: 'ko',
      turnstileToken: `token-${consumed.size}`, ...extra }),
  }));
  return { env, route, load, post, events, reservations, requests };
}

test('Auto lite makes one fixed weather-only request with one 8000 reservation and no settlement/refund', async () => {
  const h = harness(); const response = await h.post(); const result = await response.json();
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(result.status, 'usable'); assert.equal(result.mode, 'lite'); assert.equal(result.requestCount, 1);
  assert.equal(result.estimatedMicroUsd, 8000); assert.equal(result.weather[0].currentWeather.temperature, 0);
  assert.deepEqual(h.events, ['bot', 'reserve', 'auto']); assert.deepEqual(h.reservations, [8000]);
  assert.deepEqual(h.requests[0].body, { query: 'current weather in Incheon', location: 'lat:37.4500;long:126.6167',
    language: 'en', region: 'KR', mode: 'lite', responseFilter: ['weather'], maxResponseLength: 1500, maxCitations: 5 });
  assert.equal(JSON.stringify(result).includes('offline'), false);
});

test('English uses the same fixed weather intent and port coordinates; callers cannot supply their own', async () => {
  const h = harness(); assert.equal((await h.post({ language: 'en' })).status, 200);
  assert.equal(h.requests[0].body.query, 'current weather in Incheon');
  assert.equal(h.requests[0].body.location, 'lat:37.4500;long:126.6167');
  for (const extra of [{ query: 'arbitrary' }, { locationId: 'seattle' }, { location: 'lat:0;long:0' }, { language: 'fr' }, { mode: 'advanced' },
    { responseFilter: ['web'] }, { scopeName: 'scope' }, { url: 'https://evil.com/' }, { schemaVersion: 'other' }]) {
    const invalid = harness(); assert.equal((await invalid.post(extra)).status, 400); assert.deepEqual(invalid.events, []);
  }
});

test('selected city uses the protected Auto lite route and one weather-sized shared reservation', async () => {
  const zone = (location, localTime, utcOffset) => ({ location, localTime, utcOffset });
  const content = { startTimeZone: zone('Seoul', '2026-11-18T01:00:00+09:00', 9),
    endTimeZone: zone('London', '2026-11-17T16:00:00Z', 0) };
  const h = harness({ payload: { results: [{ evidence: { type: 'structured/timeZone', content } }] } });
  const response = await h.post({ schemaVersion: 'webiq.auto.timezone.request.v1', locationId: undefined, cityId: 'london' });
  const result = await response.json();
  const timeZone = h.load('lib/webIqAutoTimeZone.ts');
  assert.equal(response.status, 200);
  assert.equal(timeZone.isAutoTimeZoneResponse(result, 'london'), true);
  assert.equal(result.differenceMinutes, 540);
  assert.equal(result.schemaVersion, 'webiq.auto.timezone.response.v1');
  assert.equal('weather' in result, false);
  assert.deepEqual(h.events, ['bot', 'reserve', 'auto']);
  assert.deepEqual(h.reservations, [8000]);
  assert.deepEqual(h.requests[0].body, { query: timeZone.getTimeZoneServiceQuestion('london'), location: 'lat:37.5665;long:126.9780',
    language: 'en', region: 'KR', mode: 'lite', responseFilter: ['timezone'], maxResponseLength: 1500, maxCitations: 5 });
});

test('disallowed city data, disabled mode, failed bot verification, and unavailable budget never call Auto', async () => {
  const input = { schemaVersion: 'webiq.auto.timezone.request.v1', locationId: undefined, cityId: 'seattle' };
  for (const invalid of [{ cityId: 'new-york' }, { cityId: '__proto__' }, { query: 'own query' },
    { locationId: 'incheon-port' }, { responseFilter: ['news'] }]) {
    const h = harness();
    assert.equal((await h.post({ ...input, ...invalid })).status, 400);
    assert.deepEqual(h.events, []);
  }
  const off = harness({ env: { WEBIQ_AUTO_ENABLED: 'false' } });
  assert.equal((await off.post(input)).status, 503);
  assert.deepEqual(off.events, []);
  const bot = harness();
  assert.equal((await bot.post({ ...input, turnstileToken: 'bad' })).ok, false);
  assert.deepEqual(bot.events, ['bot']);
  const budget = harness({ denial: true });
  assert.equal((await budget.post(input)).status, 503);
  assert.deepEqual(budget.events, ['bot', 'reserve']);
});

test('default off, incomplete auth/AppID/broker/pricing configuration never reaches bot or upstream', async () => {
  for (const env of [{ WEBIQ_AUTO_ENABLED: undefined }, { WEBIQ_AUTO_ENABLED: 'TRUE' }, { WEBIQ_API_KEY: '' },
    { DEMO_USAGE_BROKER_URL: undefined }, { DEMO_USAGE_BROKER_SECRET: '' },
    { WEBIQ_AUTH_METHOD: 'entra', AZURE_TENANT_ID: 'offline', AZURE_CLIENT_ID: 'offline', AZURE_CLIENT_SECRET: 'offline', WEBIQ_APP_ID: '' }]) {
    const h = harness({ env }); assert.equal((await h.post()).status, 503); assert.deepEqual(h.events, []);
    const ready = await (await h.route.GET(new Request('https://public-demo.example/api/web-iq/auto'))).json();
    assert.equal(ready.configured, false); assert.equal(ready.access, 'not_verified');
  }
});

test('GET readiness performs no network or reservation and does not claim current entitlement', async () => {
  const h = harness(); const response = await h.route.GET(new Request('https://public-demo.example/api/web-iq/auto'));
  const value = await response.json(); assert.equal(value.configured, true); assert.equal(value.access, 'not_verified');
  assert.equal(value.productStatus, 'ga'); assert.equal(value.brokerCompatibility, 'requires_auto_8000');
  assert.equal(value.estimatedMicroUsd, 8000); assert.deepEqual(h.events, []);
});

test('Turnstile Auto action, allowed host, challenge age and replay are required before reservation', async () => {
  for (const options of [{ extra: { turnstileToken: undefined } }, { extra: { turnstileToken: 'bad' } },
    { botClaims: { action: 'webiq_search' } }, { botClaims: { hostname: 'other.example' } },
    { botClaims: { challenge_ts: '2020-01-01T00:00:00Z' } }, { env: { TURNSTILE_SECRET_KEY: '' } }]) {
    const h = harness(options); assert.ok([403, 503].includes((await h.post(options.extra)).status));
    assert.equal(h.reservations.length, 0); assert.equal(h.requests.length, 0);
  }
  const h = harness(); await h.post({ turnstileToken: 'same' });
  assert.equal((await h.post({ turnstileToken: 'same' })).status, 403); assert.equal(h.requests.length, 1);
});

test('token failure and reservation rejection/lost response fail closed without provider or fallback', async () => {
  const missing = harness({ denial: true }); assert.equal((await missing.post()).status, 503);
  assert.deepEqual(missing.events, ['bot', 'reserve']); assert.equal(missing.requests.length, 0);
  const lost = await (await harness({ denial: true }).post()).json();
  assert.equal(lost.reservation, 'unknown'); assert.equal(lost.estimatedMicroUsd, null); assert.equal(lost.reservationPotentialMicroUsd, 8000);
  const h = harness({ authThrows: true, env: { WEBIQ_AUTH_METHOD: 'entra', AZURE_TENANT_ID: 'offline', AZURE_CLIENT_ID: 'offline',
    AZURE_CLIENT_SECRET: 'offline', WEBIQ_APP_ID: 'offline-app' } });
  assert.equal((await h.post()).status, 502); assert.deepEqual(h.events, ['bot', 'auth']);
});

test('Entra uses the explicit configured AppID on the fixed Auto endpoint', async () => {
  const h = harness({ env: { WEBIQ_AUTH_METHOD: 'entra', AZURE_TENANT_ID: 'offline', AZURE_CLIENT_ID: 'offline',
    AZURE_CLIENT_SECRET: 'offline', WEBIQ_APP_ID: 'bound-app' } });
  assert.equal((await h.post()).status, 200);
  assert.equal(h.requests[0].url, 'https://api.microsoft.ai/v3/auto?APPID=bound-app');
  assert.equal(h.requests[0].init.headers.Authorization, 'Bearer offline-token');
});

test('each upstream error and ambiguous response loss retain the full reservation, with exactly one call', async () => {
  for (const options of [{ status: 400 }, { status: 401 }, { status: 403 }, { status: 429 }, { status: 500 },
    { status: 503 }, { status: 504 }, { status: 202 }, { upstreamThrows: true }]) {
    const h = harness(options); const result = await (await h.post()).json();
    assert.equal(result.requestCount, 1); assert.equal(result.estimatedMicroUsd, 8000);
    assert.deepEqual(h.reservations, [8000]); assert.equal(h.requests.length, 1);
  }
});

test('pre-abort is zero calls; cancellation after reservation never invokes Auto or refunds', async () => {
  const controller = new AbortController(); controller.abort(); const h = harness();
  assert.equal((await h.post({}, controller.signal)).status, 499); assert.deepEqual(h.events, []);
  const later = new AbortController(); const second = harness({ onReserve: () => later.abort() });
  const response = await second.post({}, later.signal); const result = await response.json();
  assert.equal(response.status, 499); assert.equal(result.requestCount, 0); assert.equal(second.requests.length, 0);
  assert.deepEqual(second.reservations, [8000]);
  assert.notEqual(result.reservation, 'not_reserved'); assert.equal(result.reservationPotentialMicroUsd, 8000);
});

test('hanging upstream deadline and cancellation while reading a body stay one call without retry', async () => {
  const h = harness({ pendingFetch: true, shortDeadline: true });
  assert.equal((await h.post()).status, 504); assert.equal(h.requests.length, 1); assert.deepEqual(h.reservations, [8000]);
  const controller = new AbortController();
  const stream = harness({ response: () => new Response(new ReadableStream({ start() { setTimeout(() => controller.abort(), 5); } })) });
  assert.equal((await stream.post({}, controller.signal)).status, 499); assert.equal(stream.requests.length, 1);
  assert.deepEqual(stream.reservations, [8000]);
});

test('empty evidence, unsupported types and malformed envelopes cannot be usable weather', async () => {
  for (const payload of [{ results: [] }, { results: [{ evidence: { type: 'text', content: 'Weather page' }, citations: [] }] }]) {
    const h = harness({ payload }); const result = await (await h.post()).json(); assert.equal(result.status, 'empty');
    assert.deepEqual(h.reservations, [8000]);
  }
  for (const payload of [null, {}, { results: {} }, { results: [], errorCode: 'failure' }]) {
    const h = harness({ payload }); assert.equal((await h.post()).status, 502); assert.equal(h.requests.length, 1);
  }
});

test('unit, location, current observation and same-result supporting citation are independent usable gates', () => {
  const parse = harness().load('lib/webIqAuto.ts').parseWebIqAutoPayload;
  const mutations = [
    content => { delete content.units; }, content => { content.location = 'Seattle, Washington'; },
    content => { delete content.currentWeather.observedAt; }, content => { content.currentWeather.observedAt = '2026-11-17T09:00:00'; },
    content => { content.currentWeather.observedAt = '2026-02-30T09:00:00Z'; },
    content => { content.currentWeather.observedAt = new Date(Date.now() - 7 * 60 * 60_000).toISOString(); },
    content => { content.currentWeather.observedAt = new Date(Date.now() + 10 * 60_000).toISOString(); },
    content => { content.url = 'https://localhost/weather'; },
  ];
  for (const mutate of mutations) { const value = fixture(); mutate(value.results[0].evidence.content); assert.equal(parse(value).status, 'not_verified'); }
  const missing = fixture(); missing.results[0].citations = []; assert.equal(parse(missing).status, 'not_verified');
  const otherResult = fixture(); const citations = otherResult.results[0].citations; otherResult.results[0].citations = [];
  otherResult.results.push({ evidence: { type: 'text', content: 'other' }, citations });
  assert.equal(parse(otherResult).status, 'not_verified');
});

test('parser inspects later results without borrowing citations, measurements or timestamps from another result', () => {
  const parse = harness().load('lib/webIqAuto.ts').parseWebIqAutoPayload;
  const value = fixture(); const partial = fixture().results[0]; delete partial.evidence.content.units;
  value.results.unshift(partial); const result = parse(value);
  assert.equal(result.status, 'usable'); assert.equal(result.weather[0].status, 'not_verified');
  assert.equal(result.weather[1].status, 'usable'); assert.equal(result.weather[1].evidenceIndex, 1);
  const observation = fixture(); delete observation.results[0].evidence.content.currentWeather.observedAt;
  observation.results.push({ evidence: { type: 'text', content: 'Another result' },
    citations: [{ ...observation.results[0].citations[0], observedAt: new Date().toISOString() }] });
  assert.equal(parse(observation).status, 'not_verified');
});

test('only a matching weather citation supplies a missing observation timestamp', () => {
  const parse = harness().load('lib/webIqAuto.ts').parseWebIqAutoPayload;
  const value = fixture();
  const { currentWeather } = value.results[0].evidence.content;
  delete currentWeather.observedAt;
  const citation = value.results[0].citations[0];
  const url = citation.url;
  const observed = new Date().toISOString();
  citation.observedAt = observed.replace('Z', '0000Z');
  const result = parse(value);
  assert.equal(result.status, 'usable'); assert.equal(result.weather[0].currentWeather.observedAt, observed);
  citation.url = 'https://www.msn.com/weather/other';
  assert.equal(parse(value).weather[0].currentWeather.observedAt, undefined);
  citation.url = url;
  currentWeather.observedAt = 'not a timestamp';
  assert.equal(parse(value).status, 'not_verified');
  delete currentWeather.observedAt;
  value.results[0].citations.push({ url, observedAt: new Date(Date.parse(observed) - 60_000).toISOString() });
  assert.equal(parse(value).weather[0].currentWeather.observedAt, undefined);
  value.results[0].citations.pop();
  delete citation.observedAt;
  Object.assign(citation, { crawledAt: observed, lastUpdatedAt: observed });
  assert.equal(parse(value).status, 'not_verified');
});

test('accepts named Incheon localities but never treats country context or nearby cities as Incheon', () => {
  const parse = harness().load('lib/webIqAuto.ts').parseWebIqAutoPayload;
  const value = fixture();
  for (const location of ['Incheon, South Korea', 'Jung-gu, Incheon, South Korea', 'Incheon, Incheon, South Korea',
    '대한민국 인천광역시 중구', '인천광역시, 대한민국', 'Incheon Metropolitan City']) {
    value.results[0].evidence.content.location = location;
    assert.equal(parse(value).status, 'usable', location);
  }
  for (const location of ['대한민국', 'South Korea', 'Seoul, South Korea', 'Jung-gu', 'Incheon Road, Seoul', 'Incheon, China']) {
    value.results[0].evidence.content.location = location;
    assert.equal(parse(value).weather[0].checks.location, false, location);
  }
});

test('omitted optional weather is not invented; true zeros, forecast validity and alert authority/time fields survive separately', () => {
  const parse = harness().load('lib/webIqAuto.ts').parseWebIqAutoPayload;
  const value = fixture(); const c = value.results[0].evidence.content;
  delete c.currentWeather.windSpeed;
  c.forecastedWeather = [{ validDate: '2026-11-18', temperatureHigh: 0, temperatureLow: -2 }];
  c.alerts = [{ name: 'Synthetic advisory', status: 'Recent', issuingAuthority: 'Synthetic fixture authority',
    url: 'https://www.weather.gov/alerts', effectiveAt: '2026-11-17T01:00:00Z', expiresAt: '2026-11-17T02:00:00Z' }];
  const out = parse(value).weather[0]; assert.equal(out.currentWeather.temperature, 0);
  assert.equal('windSpeed' in out.currentWeather, false); assert.equal(out.forecastedWeather[0].temperatureHigh, 0);
  assert.equal(out.forecastedWeather[0].validDate, '2026-11-18'); assert.equal(out.alerts[0].status, 'Recent');
  assert.equal(out.alerts[0].url, 'https://www.weather.gov/alerts'); assert.notEqual(out.url, out.alerts[0].url);
  assert.equal('alerts' in parse(fixture()).weather[0], false);
});

test('supported explicit unit systems verify without conversion; unfamiliar original units stay visible but unverified', () => {
  const parse = harness().load('lib/webIqAuto.ts').parseWebIqAutoPayload;
  for (const [temperature, speed] of [['C', 'km/h'], ['°F', 'mph'], ['Kelvin', 'm/s'], ['celsius', 'knots']]) {
    const value = fixture(); Object.assign(value.results[0].evidence.content.units, { temperature, speed });
    const parsed = parse(value); assert.equal(parsed.status, 'usable');
    assert.equal(parsed.weather[0].units.temperature, temperature); assert.equal(parsed.weather[0].currentWeather.temperature, 0);
  }
  const value = fixture(); value.results[0].evidence.content.units.temperature = 'bananas';
  const parsed = parse(value); assert.equal(parsed.status, 'not_verified');
  assert.equal(parsed.weather[0].units.temperature, 'bananas'); assert.equal(parsed.weather[0].checks.units, false);
});

test('unsafe/incorrect/adult citations are excluded and never establish same-result attribution', () => {
  const parse = harness().load('lib/webIqAuto.ts').parseWebIqAutoPayload;
  for (const url of ['javascript:alert(1)', 'http://www.msn.com/weather', 'https://127.0.0.1/', 'https://[::1]/',
    'https://user:password@www.msn.com/weather', 'https://metadata.google.internal/', 'https://www.msn.com:444/weather',
    'https://www.msn.com/weather#fragment']) {
    const value = fixture(); value.results[0].evidence.content.url = url; value.results[0].citations[0].url = url;
    assert.equal(parse(value).status, 'not_verified', url);
  }
  for (const extra of [{ isAdult: true }, { isAdult: 'false' }, { url: 'https://www.msn.com/other' }]) {
    const value = fixture(); Object.assign(value.results[0].citations[0], extra); assert.equal(parse(value).status, 'not_verified');
  }
});

test('complete response streaming cap, invalid UTF-8/JSON and oversized request stop safely', async () => {
  for (const response of [() => new Response('{}'.repeat(33_000)), () => new Response('{}', { headers: { 'content-length': '65537' } }),
    () => new Response(new Uint8Array([255])), () => new Response('{malformed')]) {
    const h = harness({ response }); assert.equal((await h.post()).status, 502); assert.deepEqual(h.reservations, [8000]);
  }
  const h = harness(); assert.equal((await h.post({ turnstileToken: 'x'.repeat(5000) })).status, 400);
  assert.deepEqual(h.events, []);
  for (const declared of ['65537', 'not-a-number']) {
    let cancelled = false;
    const oversized = harness({ response: () => new Response(new ReadableStream({ cancel() { cancelled = true; } }),
      { headers: { 'content-length': declared } }) });
    assert.equal((await oversized.post()).status, 502); assert.equal(cancelled, true);
    assert.deepEqual(oversized.reservations, [8000]);
  }
});

test('existing reservation prices remain unchanged and Auto GA has an independent nonzero lite profile', () => {
  const pricing = harness().load('lib/webIqPricing.ts');
  assert.equal(pricing.WEB_IQ_SEARCH_MICRO_USD, 7000); assert.equal(pricing.WEB_IQ_BROWSE_MICRO_USD, 1000);
  assert.equal(pricing.WEB_IQ_ANSWER_RESERVATION_MICRO_USD, 421000); assert.equal(pricing.WEB_IQ_AUTO_MICRO_USD, 8000);
  assert.equal(pricing.WEB_IQ_PRICING.auto.promotionalCondition, null);
  assert.equal(pricing.WEB_IQ_PRICING.auto.conservativeReservation, 8000);
  assert.equal(pricing.WEB_IQ_PRICING.auto.chargedFrom, '2026-11-17');
});
