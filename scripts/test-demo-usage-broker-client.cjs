const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const BROKER = 'https://usage-demo.example.eastus.azurecontainerapps.io';
const SECRET = 'offline-broker-secret-with-at-least-32-characters';
const BLOB = 'https://demousage123.blob.core.windows.net/demo-usage/ledger.json';
const IP = '192.0.2.1';
const RESERVATION = {
  id: '00000000-0000-4000-8000-000000000001', day: '2026-11-10',
  reservedMicroUsd: 7000, remainingMicroUsd: 4993000, dailyLimitMicroUsd: 5000000,
};

function loadClient({ env = {}, fetchImpl, fastTimeout = false } = {}) {
  const modules = new Map();
  const requests = [];
  const tokenScopes = [];
  const timers = [];
  const config = { DEMO_USAGE_BROKER_URL: BROKER, DEMO_USAGE_BROKER_SECRET: SECRET, ...env };
  for (const [key, value] of Object.entries(config)) if (value === undefined) delete config[key];
  function load(name) {
    if (modules.has(name)) return modules.get(name);
    if (name === '@/lib/token-manager') return { tokenManager: { getToken: async scope => {
      tokenScopes.push(scope);
      return 'offline-token';
    } } };
    if (name === 'node:crypto') return require(name);
    if (!['@/lib/demoUsageLedger', '@/lib/demoUsageLedgerCore'].includes(name)) throw new Error('Unexpected module');
    const filename = path.resolve(__dirname, `../${name.slice(2)}.ts`);
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const exportsObject = {};
    modules.set(name, exportsObject);
    vm.runInNewContext(compiled, {
      exports: exportsObject, require: load, process: { env: config },
      URL, TextEncoder, TextDecoder, AbortController, structuredClone,
      setTimeout: (callback, milliseconds) => {
        timers.push(milliseconds);
        return setTimeout(callback, fastTimeout ? Math.min(milliseconds, 15) : milliseconds);
      },
      clearTimeout,
      fetch: async (url, init) => {
        requests.push({ url, init });
        if (!fetchImpl) throw new Error('Real network is forbidden');
        return fetchImpl(url, init);
      },
    }, { filename });
    return exportsObject;
  }
  return { client: load('@/lib/demoUsageLedger'), requests, tokenScopes, timers };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function unavailable(harness, operation) {
  return assert.rejects(operation, error => error instanceof harness.client.DemoUsageUnavailableError
    && error.code === 'usage_unavailable' && error.status === 503);
}

const cases = [];
function test(name, run) { cases.push({ name, run }); }

test('check, reserve and settle use the agreed authenticated POST protocol', async () => {
  const harness = loadClient({ fetchImpl: async (url, init) => {
    assert.equal(init.method, 'POST');
    assert.equal(init.headers.Authorization, `Bearer ${SECRET}`);
    assert.equal(init.headers['Content-Type'], 'application/json');
    assert.equal(init.cache, 'no-store');
    assert.equal(init.redirect, 'error');
    if (url.endsWith('/check')) {
      assert.deepEqual(JSON.parse(init.body), { ip: IP, microUsd: 7000 });
      return json({ ok: true });
    }
    if (url.endsWith('/reserve')) {
      assert.deepEqual(JSON.parse(init.body), { ip: IP, microUsd: 7000 });
      return json({ ok: true, result: RESERVATION });
    }
    assert.equal(url, `${BROKER}/settle`);
    assert.deepEqual(JSON.parse(init.body), { reservation: RESERVATION, actualMicroUsd: 2000 });
    return json({ ok: true, result: { ...RESERVATION, remainingMicroUsd: 4998000, chargedMicroUsd: 2000, settled: true } });
  } });
  await harness.client.checkDemoUsage(IP, 7000);
  const reservation = await harness.client.reserveDemoUsage(IP, 7000);
  assert.equal(reservation.reservedMicroUsd, 7000);
  const settlement = await harness.client.settleDemoUsage(reservation, 2000);
  assert.equal(settlement.chargedMicroUsd, 2000);
  assert.equal(settlement.settled, true);
  assert.deepEqual(harness.requests.map(request => request.url), [`${BROKER}/check`, `${BROKER}/reserve`, `${BROKER}/settle`]);
  assert.deepEqual(harness.tokenScopes, []);
  assert.deepEqual(harness.timers, [25000, 25000, 25000]);
});

test('known quota errors preserve type, status and optional retry delay', async () => {
  for (const [code, status, retryAfterSeconds, className] of [
    ['rate_limit_exceeded', 429, 120, 'DemoRateLimitError'],
    ['daily_budget_exceeded', 429, 6000, 'DemoDailyBudgetError'],
    ['daily_budget_exceeded', 429, undefined, 'DemoDailyBudgetError'],
    ['usage_unavailable', 503, 10, 'DemoUsageUnavailableError'],
  ]) {
    const harness = loadClient({ fetchImpl: async () => json({ ok: false, code, status, retryAfterSeconds }, status) });
    await assert.rejects(harness.client.reserveDemoUsage(IP, 7000), error => error instanceof harness.client[className]
      && error.code === code && error.status === status && error.retryAfterSeconds === retryAfterSeconds);
    assert.equal(harness.requests.length, 1);
  }
});

test('unknown and contradictory error envelopes fail closed without leaking messages', async () => {
  for (const [body, status] of [
    [{ ok: false, code: 'unauthorized', status: 401, message: SECRET }, 401],
    [{ ok: false, code: 'invalid_request', status: 400 }, 400],
    [{ ok: false, code: 'daily_budget_exceeded', status: 429 }, 200],
    [{ ok: false, code: 'rate_limit_exceeded', status: 429, retryAfterSeconds: '120' }, 429],
    [{ ok: false, code: 'rate_limit_exceeded', status: 429, retryAfterSeconds: -1 }, 429],
    [{ ok: true, result: RESERVATION }, 500],
  ]) {
    const harness = loadClient({ fetchImpl: async () => json(body, status) });
    await unavailable(harness, harness.client.reserveDemoUsage(IP, 7000));
    assert.equal(harness.requests.length, 1);
    assert.equal(harness.tokenScopes.length, 0);
  }
});

test('invalid origin or missing secret never sends credentials or falls back to Blob', async () => {
  for (const invalid of [
    '', 'http://usage.azurecontainerapps.io', 'https://azurecontainerapps.io',
    'https://usage.azurecontainerapps.io.evil.test', 'https://usage.azurecontainerapps.io/path',
    'https://usage.azurecontainerapps.io?key=value', 'https://usage.azurecontainerapps.io#fragment',
    'https://user@usage.azurecontainerapps.io', 'https://usage.azurecontainerapps.io:8443',
  ]) {
    const harness = loadClient({ env: { DEMO_USAGE_BROKER_URL: invalid } });
    await unavailable(harness, harness.client.reserveDemoUsage(IP, 7000));
    assert.equal(harness.requests.length, 0);
    assert.equal(harness.tokenScopes.length, 0);
  }
  for (const secret of [undefined, '', 'too-short', `${SECRET}\n`]) {
    const harness = loadClient({ env: { DEMO_USAGE_BROKER_SECRET: secret } });
    await unavailable(harness, harness.client.checkDemoUsage(IP, 7000));
    assert.equal(harness.requests.length, 0);
  }
});

test('malformed reservation responses never authorize paid work', async () => {
  for (const result of [
    null, {}, { ...RESERVATION, id: 'not-a-uuid' }, { ...RESERVATION, day: '2026-02-30' },
    { ...RESERVATION, reservedMicroUsd: '7000' }, { ...RESERVATION, reservedMicroUsd: 6999 },
    { ...RESERVATION, remainingMicroUsd: -1 }, { ...RESERVATION, remainingMicroUsd: 5000000 },
    { ...RESERVATION, dailyLimitMicroUsd: 5000001 },
  ]) {
    const harness = loadClient({ fetchImpl: async () => json({ ok: true, result }) });
    await unavailable(harness, harness.client.reserveDemoUsage(IP, 7000));
    assert.equal(harness.requests.length, 1);
  }
});

test('settlement response must match the reservation and verified actual charge', async () => {
  const valid = { ...RESERVATION, remainingMicroUsd: 4998000, chargedMicroUsd: 2000, settled: true };
  for (const result of [
    { ...valid, id: '00000000-0000-4000-8000-000000000002' },
    { ...valid, day: '2026-11-11' }, { ...valid, reservedMicroUsd: 8000 },
    { ...valid, chargedMicroUsd: 1999 }, { ...valid, chargedMicroUsd: '2000' },
    { ...valid, settled: false }, { ...valid, remainingMicroUsd: 5000000 },
  ]) {
    const harness = loadClient({ fetchImpl: async () => json({ ok: true, result }) });
    await unavailable(harness, harness.client.settleDemoUsage(RESERVATION, 2000));
    assert.equal(harness.requests.length, 1);
  }
});

test('invalid inputs fail before any broker request', async () => {
  const harness = loadClient();
  for (const [ip, amount] of [['', 7000], [IP, -1], [IP, 0.1], [`${IP}\n`, 7000]]) {
    await unavailable(harness, harness.client.reserveDemoUsage(ip, amount));
  }
  await unavailable(harness, harness.client.settleDemoUsage(RESERVATION, 7001));
  assert.equal(harness.requests.length, 0);
});

test('lost reserve or settlement responses are not retried and do not switch stores', async () => {
  for (const operation of ['reserve', 'settle']) {
    let committed = 0;
    const harness = loadClient({ fetchImpl: async () => { committed++; throw new Error('Response lost after commit'); } });
    await unavailable(harness, operation === 'reserve'
      ? harness.client.reserveDemoUsage(IP, 7000) : harness.client.settleDemoUsage(RESERVATION, 2000));
    assert.equal(committed, 1);
    assert.equal(harness.requests.length, 1);
    assert.equal(harness.tokenScopes.length, 0);
  }
});

test('redirect responses, oversized bodies and invalid JSON fail closed', async () => {
  for (const response of [
    new Response(null, { status: 307, headers: { Location: 'https://example.test' } }),
    new Response('x'.repeat(8193)), new Response('{'), json(null), json({ ok: 'true', result: RESERVATION }),
  ]) {
    const harness = loadClient({ fetchImpl: async () => response });
    await unavailable(harness, harness.client.reserveDemoUsage(IP, 7000));
    assert.equal(harness.requests.length, 1);
  }
  const harness = loadClient({ fetchImpl: async () => json({ ok: true, result: RESERVATION }) });
  await unavailable(harness, harness.client.checkDemoUsage(IP, 7000));
});

test('25-second total deadline bounds hanging fetch and response body without retry', async () => {
  for (const fetchImpl of [
    () => new Promise(() => {}),
    async () => new Response(new ReadableStream({ start() {} })),
  ]) {
    const harness = loadClient({ fetchImpl, fastTimeout: true });
    const started = Date.now();
    await unavailable(harness, harness.client.reserveDemoUsage(IP, 7000));
    assert.ok(Date.now() - started < 1000);
    assert.equal(harness.requests.length, 1);
    assert.deepEqual(harness.timers, [25000]);
    assert.equal(harness.requests[0].init.signal.aborted, true);
  }
});

test('explicit core adapters bypass the configured broker without ambient authentication', async () => {
  const harness = loadClient();
  let writes = 0;
  const result = await harness.client.reserveDemoUsage(IP, 7000, {
    blobUrl: BLOB, hashSecret: SECRET, getAccessToken: async () => 'injected-token',
    fetchImpl: async (url, init) => {
      assert.equal(url, BLOB);
      assert.equal(init.headers.Authorization, 'Bearer injected-token');
      if (init.method === 'PUT') { writes++; return new Response(null, { status: 201 }); }
      return new Response(null, { status: 404, headers: { 'x-ms-error-code': 'BlobNotFound' } });
    },
  });
  assert.equal(result.reservedMicroUsd, 7000);
  assert.equal(writes, 1);
  assert.equal(harness.requests.length, 0);
  assert.equal(harness.tokenScopes.length, 0);
});

test('without broker configuration the wrapper retains direct tokenManager storage auth', async () => {
  const harness = loadClient({
    env: { DEMO_USAGE_BROKER_URL: undefined, DEMO_USAGE_BLOB_URL: BLOB, DEMO_USAGE_HASH_SECRET: SECRET },
    fetchImpl: async (url, init) => {
      assert.equal(url, BLOB);
      assert.equal(init.headers.Authorization, 'Bearer offline-token');
      return new Response(null, { status: 404, headers: { 'x-ms-error-code': 'BlobNotFound' } });
    },
  });
  await harness.client.checkDemoUsage(IP, 7000);
  assert.deepEqual(harness.tokenScopes, ['https://storage.azure.com/.default']);
  assert.equal(harness.requests.length, 1);
});

(async () => {
  for (const { name, run } of cases) {
    await run();
    process.stdout.write(`PASS ${name}\n`);
  }
  process.stdout.write(`${cases.length} offline broker-client tests passed; no network or credentials.\n`);
})().catch(error => { console.error(error); process.exitCode = 1; });
