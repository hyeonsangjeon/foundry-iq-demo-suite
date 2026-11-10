'use strict';

// Offline tests: local HTTP sockets and injected fetch functions only; no Azure calls.
const assert = require('node:assert/strict');
const http = require('node:http');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');
const { createBrokerServer, createManagedIdentityTokenProvider } = require('./server.cjs');
const { buildBundle, writeBundle } = require('./build.cjs');

const env = {
  DEMO_USAGE_BROKER_SECRET: 'test-broker-secret-not-for-production-12345',
  DEMO_USAGE_HASH_SECRET: 'test-ledger-secret-not-for-production-12345',
  DEMO_USAGE_BLOB_URL: 'https://offlinetest.blob.core.windows.net/usage/ledger.json',
  IDENTITY_ENDPOINT: 'http://127.0.0.1:12345/msi/token',
  IDENTITY_HEADER: 'offline-identity-header',
};
const reservation = {
  id: '550e8400-e29b-41d4-a716-446655440000', day: '2026-11-10',
  reservedMicroUsd: 421_000, remainingMicroUsd: 4_579_000, dailyLimitMicroUsd: 5_000_000,
};

function fakeCore(implementation) {
  const calls = [];
  const core = Object.fromEntries(['checkDemoUsage', 'reserveDemoUsage', 'settleDemoUsage'].map(name => [name, async (...args) => {
    calls.push({ name, args });
    if (implementation) return implementation(name, args);
    return name === 'checkDemoUsage' ? undefined : name === 'reserveDemoUsage' ? reservation
      : { ...reservation, chargedMicroUsd: args[1], settled: true };
  }]));
  return { core, calls };
}

async function withServer(core, callback, overrides = {}) {
  const server = createBrokerServer({ core, env, fetchImpl: async url => {
    if (new URL(url).hostname !== '127.0.0.1') throw new Error('Unexpected data-plane call');
    return Response.json({ access_token: 'offline-token', expires_on: Math.floor(Date.now() / 1000) + 3_600 });
  }, ...overrides });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { return await callback(server.address().port); }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}

function request(port, { pathname = '/check', method = 'POST', value = { ip: '203.0.113.1', microUsd: 7_000 },
  raw, authorized = true, headers = {}, chunked = false } = {}) {
  const body = raw === undefined ? JSON.stringify(value) : raw;
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: pathname, method, agent: false,
      headers: { ...(authorized ? { Authorization: `Bearer ${env.DEMO_USAGE_BROKER_SECRET}` } : {}),
        'Content-Type': 'application/json', ...(chunked ? { 'Transfer-Encoding': 'chunked' } : { 'Content-Length': Buffer.byteLength(body) }),
        ...headers } }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers,
        body: JSON.parse(Buffer.concat(chunks).toString('utf8')) }));
    });
    req.on('error', reject);
    req.end(body);
  });
}

test('health is anonymous and does not call the ledger or identity endpoint', async () => {
  const { core, calls } = fakeCore();
  let identityCalls = 0;
  await withServer(core, async port => {
    const result = await request(port, { pathname: '/health', method: 'GET', authorized: false });
    assert.equal(result.status, 200);
    assert.deepEqual(result.body, { ok: true });
    assert.equal(result.headers['cache-control'], 'no-store');
  }, { fetchImpl: async () => { identityCalls++; throw new Error('Unexpected identity call'); } });
  assert.equal(calls.length, 0);
  assert.equal(identityCalls, 0);
});

test('missing and wrong auth are rejected before malformed or oversized bodies', async () => {
  const { core, calls } = fakeCore();
  let identityCalls = 0;
  await withServer(core, async port => {
    for (const options of [{ authorized: false, raw: '{' }, { headers: { Authorization: 'Bearer wrong' }, raw: 'x'.repeat(5_000) }]) {
      const result = await request(port, options);
      assert.equal(result.status, 401);
      assert.deepEqual(result.body, { ok: false, code: 'unauthorized', status: 401 });
    }
  }, { fetchImpl: async () => { identityCalls++; throw new Error('Unexpected identity call'); } });
  assert.equal(calls.length, 0);
  assert.equal(identityCalls, 0);
});

test('startup rejects missing or short server configuration without exposing values', () => {
  const { core } = fakeCore();
  for (const override of [{ DEMO_USAGE_BROKER_SECRET: 'short' }, { DEMO_USAGE_HASH_SECRET: '' }, { DEMO_USAGE_BLOB_URL: '' }]) {
    assert.throws(() => createBrokerServer({ core, env: { ...env, ...override } }), /configuration is incomplete/);
  }
});

test('strict routes, media types, and JSON reject before ledger calls', async () => {
  const { core, calls } = fakeCore();
  let identityCalls = 0;
  await withServer(core, async port => {
    for (const [options, status] of [
      [{ pathname: '/other' }, 404], [{ pathname: '/check?x=1' }, 404], [{ method: 'GET' }, 405],
      [{ headers: { 'Content-Type': 'text/plain' } }, 415], [{ headers: { 'Content-Encoding': 'gzip' } }, 415],
      [{ raw: '{' }, 400], [{ raw: Buffer.from([0xff]) }, 400], [{ value: [] }, 400],
      [{ value: null }, 400], [{ value: { ip: '203.0.113.1', microUsd: 7_000, extra: true } }, 400],
    ]) assert.equal((await request(port, options)).status, status);
  }, { fetchImpl: async () => { identityCalls++; throw new Error('Unexpected identity call'); } });
  assert.equal(calls.length, 0);
  assert.equal(identityCalls, 0);
});

test('both declared and chunked oversized bodies are rejected', async () => {
  const { core, calls } = fakeCore();
  await withServer(core, async port => {
    for (const chunked of [false, true]) {
      const result = await request(port, { raw: ' '.repeat(4_097), chunked });
      assert.equal(result.status, 413);
    }
  });
  assert.equal(calls.length, 0);
});

test('only valid IPs and the two Web IQ reservation amounts reach the core', async () => {
  const { core, calls } = fakeCore();
  await withServer(core, async port => {
    for (const ip of ['hostname', '203.0.113.1, 1.2.3.4', ' 203.0.113.1', 'fe80::1%en0', null]) {
      assert.equal((await request(port, { value: { ip, microUsd: 7_000 } })).status, 400);
    }
    for (const microUsd of [0, -1, 1, 7_000.5, 5_000_001, '7000', null]) {
      assert.equal((await request(port, { value: { ip: '203.0.113.1', microUsd } })).status, 400);
    }
    assert.equal(calls.length, 0);
    for (const [pathname, ip, microUsd] of [['/check', '203.0.113.1', 7_000], ['/reserve', '2001:db8::1', 421_000]]) {
      const result = await request(port, { pathname, value: { ip, microUsd } });
      assert.equal(result.status, 200);
      assert.equal(result.body.ok, true);
      assert.equal(calls.at(-1).args[0], ip);
      assert.equal(calls.at(-1).args[1], microUsd);
      assert.equal(calls.at(-1).args[2].blobUrl, env.DEMO_USAGE_BLOB_URL);
      assert.equal(typeof calls.at(-1).args[2].getAccessToken, 'function');
    }
  });
});

test('settlement requires its exact reservation envelope and bounded actual amount', async () => {
  const { core, calls } = fakeCore();
  await withServer(core, async port => {
    for (const value of [
      { reservation, actualMicroUsd: -1 }, { reservation, actualMicroUsd: 421_001 },
      { reservation: { ...reservation, id: 'bad' }, actualMicroUsd: 7_000 },
      { reservation: { ...reservation, dailyLimitMicroUsd: 10_000_000 }, actualMicroUsd: 7_000 },
      { reservation: { ...reservation, extra: true }, actualMicroUsd: 7_000 },
      { reservation, actualMicroUsd: 7_000, extra: true },
    ]) assert.equal((await request(port, { pathname: '/settle', value })).status, 400);
    assert.equal(calls.length, 0);
    const result = await request(port, { pathname: '/settle', value: { reservation, actualMicroUsd: 10_600 } });
    assert.equal(result.status, 200);
    assert.equal(result.body.result.chargedMicroUsd, 10_600);
    assert.equal(result.body.result.settled, true);
    assert.equal(calls.length, 1);
  });
});

test('core budget/rate/unavailable errors preserve safe status and Retry-After only', async () => {
  for (const [code, status, retryAfterSeconds] of [['rate_limit_exceeded', 429, 17], ['daily_budget_exceeded', 429, 12_345], ['usage_unavailable', 503, undefined]]) {
    const { core } = fakeCore(() => { throw Object.assign(new Error('Do not return private details'), { code, status, retryAfterSeconds }); });
    await withServer(core, async port => {
      const result = await request(port);
      assert.equal(result.status, status);
      assert.deepEqual(result.body, { ok: false, code, status, ...(retryAfterSeconds ? { retryAfterSeconds } : {}) });
      assert.equal(result.headers['retry-after'], retryAfterSeconds ? String(retryAfterSeconds) : undefined);
    });
  }
});

test('unexpected failures and mismatched error status fail closed without exception text', async () => {
  for (const error of [new Error(env.DEMO_USAGE_BROKER_SECRET), { code: 'rate_limit_exceeded', status: 200 }, null]) {
    const { core } = fakeCore(() => { throw error; });
    await withServer(core, async port => {
      const result = await request(port);
      assert.equal(result.status, 503);
      assert.deepEqual(result.body, { ok: false, code: 'usage_unavailable', status: 503 });
    });
  }
});

test('request deadline returns safe 503 when a dependency never resolves', async () => {
  const { core } = fakeCore(() => new Promise(() => {}));
  await withServer(core, async port => {
    assert.equal((await request(port)).status, 503);
  }, { requestTimeoutMs: 15 });
});

test('managed identity uses local endpoint, coalesces concurrent calls, and bounds cache to five minutes', async () => {
  let time = Date.parse('2026-11-10T09:00:00Z');
  const calls = [];
  const token = createManagedIdentityTokenProvider({ env, now: () => time, fetchImpl: async (url, options) => {
    calls.push({ url, options });
    return Response.json({ access_token: 'offline-token', expires_on: String(time / 1000 + 3_600), token_type: 'Bearer' });
  } });
  assert.deepEqual(await Promise.all([token(), token(), token()]), ['offline-token', 'offline-token', 'offline-token']);
  assert.equal(calls.length, 1);
  const url = new URL(calls[0].url);
  assert.equal(url.origin, 'http://127.0.0.1:12345');
  assert.equal(url.searchParams.get('resource'), 'https://storage.azure.com/');
  assert.equal(url.searchParams.get('api-version'), '2019-08-01');
  assert.equal(calls[0].options.headers['X-IDENTITY-HEADER'], env.IDENTITY_HEADER);
  assert.equal(calls[0].options.redirect, 'error');
  time += 299_999;
  assert.equal(await token(), 'offline-token');
  assert.equal(calls.length, 1);
  time += 1;
  await token();
  assert.equal(calls.length, 2);
});

test('managed identity refreshes before expiry and never caches a failed fetch', async () => {
  let time = Date.parse('2026-11-10T09:00:00Z');
  let count = 0;
  const token = createManagedIdentityTokenProvider({ env, now: () => time, fetchImpl: async () => {
    count++;
    if (count === 1) throw new Error('Token service failed');
    return Response.json({ access_token: 'offline-token', expires_on: time / 1000 + 120 });
  } });
  await assert.rejects(token(), { code: 'usage_unavailable', status: 503 });
  await token();
  time += 60_000;
  await token();
  assert.equal(count, 3);
});

test('managed identity rejects unavailable configuration, invalid responses, oversize, and timeout', async () => {
  let calls = 0;
  const missing = createManagedIdentityTokenProvider({ env: { AZURE_CLIENT_SECRET: 'must-not-be-used' }, fetchImpl: async () => { calls++; } });
  await assert.rejects(missing(), { code: 'usage_unavailable' });
  assert.equal(calls, 0);
  for (const response of [new Response('', { status: 500 }), Response.json({ access_token: 'expired', expires_on: 1 }),
    Response.json({ expires_on: 9_999_999_999 }), new Response('x'.repeat(33 * 1024)), new Response('{')]) {
    const token = createManagedIdentityTokenProvider({ env, fetchImpl: async () => response });
    await assert.rejects(token(), { code: 'usage_unavailable', status: 503 });
  }
  const token = createManagedIdentityTokenProvider({ env, timeoutMs: 10, fetchImpl: () => new Promise(() => {}) });
  await assert.rejects(token(), { code: 'usage_unavailable', status: 503 });
});

test('MI acquisition failure becomes 503 before invoking the core or data plane', async () => {
  let networkCalls = 0;
  const { core, calls } = fakeCore();
  await withServer(core, async port => {
    const result = await request(port);
    assert.equal(result.status, 503);
    assert.deepEqual(result.body, { ok: false, code: 'usage_unavailable', status: 503 });
  }, { fetchImpl: async url => { networkCalls++; assert.equal(new URL(url).hostname, '127.0.0.1'); return new Response('', { status: 500 }); } });
  assert.equal(networkCalls, 1);
  assert.equal(calls.length, 0);
});

test('slow initial MI is acquired before starting the independent Blob/core deadline', async () => {
  let releaseToken;
  let identityStarted;
  const started = new Promise(resolve => { identityStarted = resolve; });
  const gate = new Promise(resolve => { releaseToken = resolve; });
  let identityCalls = 0;
  let requestStartedAt;
  let coreStartedAt;
  const originalNow = Date.now;
  let clockAdvance = 0;
  const { core, calls } = fakeCore(async (_, args) => {
    coreStartedAt = Date.now();
    assert.equal(args[2].operationTimeoutMs, 12_000);
    assert.equal(await args[2].getAccessToken(), 'slow-offline-token');
    assert.equal(await args[2].getAccessToken(), 'slow-offline-token');
    return undefined;
  });
  Date.now = () => originalNow() + clockAdvance;
  try {
    await withServer(core, async port => {
      requestStartedAt = Date.now();
      const pending = request(port);
      await started;
      assert.equal(calls.length, 0);
      // Advance logical time beyond the core's 3-second Blob timeout without
      // actually waiting or performing a network call.
      clockAdvance = 3_500;
      releaseToken();
      assert.equal((await pending).status, 200);
      assert.equal(calls.length, 1);
      assert.ok(coreStartedAt - requestStartedAt >= 3_500);
      assert.equal(identityCalls, 1);
    }, { fetchImpl: async () => {
      identityCalls++;
      identityStarted();
      await gate;
      return Response.json({ access_token: 'slow-offline-token', expires_on: Math.floor(Date.now() / 1000) + 3_600 });
    } });
  } finally { Date.now = originalNow; }
});

test('overall request deadline still stops MI wait and prevents any core call', async () => {
  let releaseToken;
  const gate = new Promise(resolve => { releaseToken = resolve; });
  const { core, calls } = fakeCore();
  await withServer(core, async port => {
    assert.equal((await request(port)).status, 503);
    assert.equal(calls.length, 0);
    releaseToken();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(calls.length, 0);
  }, { requestTimeoutMs: 15, fetchImpl: async () => {
    await gate;
    return Response.json({ access_token: 'late-offline-token', expires_on: Math.floor(Date.now() / 1000) + 3_600 });
  } });
});

function loadCore() {
  const filename = path.resolve(__dirname, '../../lib/demoUsageLedgerCore.ts');
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const coreModule = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename })(require, coreModule, coreModule.exports);
  return coreModule.exports;
}

test('real shared core roundtrip reserves, settles idempotently, and preflight performs no write', async () => {
  let ledger = null;
  let etag = 0;
  let writes = 0;
  let identityCalls = 0;
  const fetchImpl = async (url, options) => {
    if (new URL(url).hostname === '127.0.0.1') {
      identityCalls++;
      return Response.json({ access_token: 'offline-token', expires_on: Math.floor(Date.now() / 1000) + 3_600 });
    }
    assert.equal(url, env.DEMO_USAGE_BLOB_URL);
    assert.equal(options.headers.Authorization, 'Bearer offline-token');
    if (options.method === 'PUT') {
      assert.equal(options.headers[ledger === null ? 'If-None-Match' : 'If-Match'], ledger === null ? '*' : `"${etag}"`);
      ledger = JSON.parse(options.body); etag++; writes++;
      return new Response(null, { status: 201 });
    }
    return ledger === null ? new Response(null, { status: 404, headers: { 'x-ms-error-code': 'BlobNotFound' } })
      : Response.json(ledger, { headers: { ETag: `"${etag}"` } });
  };
  await withServer(loadCore(), async port => {
    assert.equal((await request(port)).status, 200);
    assert.equal(writes, 0);
    const held = await request(port, { pathname: '/reserve', value: { ip: '203.0.113.1', microUsd: 421_000 } });
    assert.equal(held.status, 200);
    assert.equal(held.body.result.remainingMicroUsd, 4_579_000);
    assert.equal(writes, 1);
    const value = { reservation: held.body.result, actualMicroUsd: 10_600 };
    const settled = await request(port, { pathname: '/settle', value });
    assert.equal(settled.body.result.remainingMicroUsd, 4_989_400);
    assert.equal(writes, 2);
    const duplicate = await request(port, { pathname: '/settle', value });
    assert.deepEqual(duplicate.body, settled.body);
    assert.equal(writes, 2);
    assert.equal((await request(port, { pathname: '/settle', value: { ...value, actualMicroUsd: 7_000 } })).status, 503);
    assert.equal(writes, 2);
  }, { fetchImpl });
  assert.equal(identityCalls, 1);
  assert.equal(JSON.stringify(ledger).includes('203.0.113.1'), false);
});

test('bundle contains only builtins and parses; build rejects an unignored destination', () => {
  const bundle = buildBundle();
  const runtimeRequires = [...bundle.matchAll(/require\(["']([^"']+)["']\)/g)].map(match => match[1]);
  assert.ok(runtimeRequires.every(name => name.startsWith('node:')));
  assert.ok(bundle.includes('const bundledLedgerCore'));
  new vm.Script(bundle);
  assert.throws(() => writeBundle('scripts/web-iq-usage-broker/generated.cjs'), /not git-ignored/);
  assert.throws(() => writeBundle('/tmp/broker.cjs'), /git-ignored directory/);
});
