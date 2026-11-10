const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Compile only this module in memory; never load credentials or contact Azure.
const filename = path.resolve(__dirname, '../lib/demoUsageLedgerCore.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, {
  exports: exportsObject,
  require: name => {
    if (name !== 'node:crypto') throw new Error('Core must not load application authentication or dependencies');
    return require(name);
  },
  process: { env: {} }, URL, TextEncoder, TextDecoder, AbortController,
  structuredClone, setTimeout, clearTimeout, fetch: () => { throw new Error('Real network is forbidden in this test'); },
}, { filename });

const { checkDemoUsage, reserveDemoUsage, settleDemoUsage, demoUsageDay, DAILY_BUDGET_MICRO_USD,
  DemoDailyBudgetError, DemoRateLimitError, DemoUsageUnavailableError } = exportsObject;
const START = Date.parse('2026-11-10T03:00:00Z');
const URL_VALUE = 'https://demousage123.blob.core.windows.net/demo-usage/ledger.json';
const SECRET = 'offline-test-hash-secret-32-characters-minimum';

function fakeStore(initial = undefined) {
  let value = initial;
  let version = initial === undefined ? 0 : 1;
  let writes = 0;
  let conflicts = 0;
  let ambiguousNextWrite = false;
  const requests = [];
  const fetchImpl = async (url, init = {}) => {
    assert.equal(url, URL_VALUE);
    assert.equal(init.cache, 'no-store');
    assert.equal(init.redirect, 'error');
    assert.equal(init.headers.Authorization, 'Bearer offline-token');
    assert.equal(init.headers['x-ms-version'], '2023-11-03');
    requests.push(init.method || 'GET');
    if (init.method !== 'PUT') {
      return value === undefined
        ? new Response(null, { status: 404, headers: { 'x-ms-error-code': 'BlobNotFound' } })
        : new Response(JSON.stringify(value), { status: 200, headers: { etag: `"${version}"` } });
    }
    assert.equal(init.headers['x-ms-blob-type'], 'BlockBlob');
    const matches = value === undefined
      ? init.headers['If-None-Match'] === '*'
      : init.headers['If-Match'] === `"${version}"`;
    if (!matches) {
      conflicts++;
      return new Response(null, { status: 412 });
    }
    value = JSON.parse(init.body);
    version++;
    writes++;
    if (ambiguousNextWrite) {
      ambiguousNextWrite = false;
      throw new Error('Response lost after storage committed the write');
    }
    return new Response(null, { status: 201, headers: { etag: `"${version}"` } });
  };
  return {
    options: now => ({ blobUrl: URL_VALUE, hashSecret: SECRET, getAccessToken: async () => 'offline-token', fetchImpl, now, maxAttempts: 10, sleep: async () => {} }),
    get value() { return structuredClone(value); },
    get writes() { return writes; },
    get conflicts() { return conflicts; },
    get requests() { return requests; },
    loseNextWriteResponse() { ambiguousNextWrite = true; },
  };
}

const cases = [];
function test(name, run) { cases.push({ name, run }); }

test('readiness never reserves cost or creates a ledger', async () => {
  const store = fakeStore();
  await checkDemoUsage('192.0.2.1', 421000, store.options(START));
  await checkDemoUsage('192.0.2.1', 421000, store.options(START));
  assert.equal(store.writes, 0);
  assert.equal(store.value, undefined);
});

test('readiness cannot authorize a later request after another visitor exhausts the budget', async () => {
  const store = fakeStore();
  await checkDemoUsage('192.0.2.1', 421000, store.options(START));
  await reserveDemoUsage('192.0.2.2', DAILY_BUDGET_MICRO_USD, store.options(START));
  await assert.rejects(checkDemoUsage('192.0.2.1', 421000, store.options(START)), DemoDailyBudgetError);
  assert.equal(store.writes, 1);
  await assert.rejects(reserveDemoUsage('192.0.2.1', 421000, store.options(START)), DemoDailyBudgetError);
  assert.equal(store.value.days['2026-11-10'].spentMicroUsd, DAILY_BUDGET_MICRO_USD);
});

test('readiness respects IP expiry and rejects corrupt state without writing', async () => {
  const store = fakeStore();
  for (let i = 0; i < 100; i++) await reserveDemoUsage('192.0.2.1', 1, store.options(START));
  await assert.rejects(checkDemoUsage('192.0.2.1', 1, store.options(START + 119999)), DemoRateLimitError);
  await checkDemoUsage('192.0.2.1', 1, store.options(START + 120000));
  assert.equal(store.writes, 100);
  const corrupt = fakeStore(null);
  await assert.rejects(checkDemoUsage('192.0.2.1', 1, corrupt.options(START)), DemoUsageUnavailableError);
  assert.equal(corrupt.writes, 0);
});

test('100 requests in a rolling 120-second window, then exact expiry', async () => {
  const store = fakeStore();
  for (let index = 0; index < 100; index++) await reserveDemoUsage('192.0.2.1', 1, store.options(START));
  await assert.rejects(reserveDemoUsage('192.0.2.1', 1, store.options(START + 119999)), DemoRateLimitError);
  await reserveDemoUsage('192.0.2.1', 1, store.options(START + 120000));
  assert.equal(store.value.days['2026-11-10'].spentMicroUsd, 101);
  assert.equal(Object.values(store.value.ips)[0].length, 1);
});

test('KST midnight resets budget while preserving the IP rolling window', async () => {
  const store = fakeStore();
  const before = Date.parse('2026-11-10T14:59:59Z');
  for (let index = 0; index < 100; index++) await reserveDemoUsage('192.0.2.1', 50000, store.options(before));
  await assert.rejects(reserveDemoUsage('192.0.2.1', 1, store.options(before + 1000)), DemoRateLimitError);
  await reserveDemoUsage('192.0.2.2', 50000, store.options(before + 1000));
  assert.equal(store.value.days['2026-11-10'].spentMicroUsd, DAILY_BUDGET_MICRO_USD);
  assert.equal(store.value.days['2026-11-11'].spentMicroUsd, 50000);
});

test('budget refusals are counted for rate limiting without increasing spend', async () => {
  const store = fakeStore();
  await reserveDemoUsage('192.0.2.1', DAILY_BUDGET_MICRO_USD, store.options(START));
  for (let index = 0; index < 99; index++) await assert.rejects(reserveDemoUsage('192.0.2.1', 1, store.options(START)), DemoDailyBudgetError);
  await assert.rejects(reserveDemoUsage('192.0.2.1', 1, store.options(START)), DemoRateLimitError);
  assert.equal(store.value.days['2026-11-10'].spentMicroUsd, DAILY_BUDGET_MICRO_USD);
});

test('concurrent initial creation and CAS conflicts cannot overspend', async () => {
  const store = fakeStore();
  const results = await Promise.allSettled(Array.from({ length: 10 }, (_, index) => reserveDemoUsage(`192.0.2.${index}`, 600000, store.options(START))));
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 8);
  assert.equal(results.filter(result => result.status === 'rejected' && result.reason instanceof DemoDailyBudgetError).length, 2);
  assert.equal(store.value.days['2026-11-10'].spentMicroUsd, 4800000);
  assert.ok(store.conflicts > 0);
});

test('settlement refunds only the verified difference and is idempotent', async () => {
  const store = fakeStore();
  const reservation = await reserveDemoUsage('192.0.2.1', 1000000, store.options(START));
  const settled = await settleDemoUsage(reservation, 250000, store.options(START + 1));
  const writes = store.writes;
  assert.equal(settled.remainingMicroUsd, 4750000);
  await settleDemoUsage(reservation, 250000, store.options(START + 2));
  assert.equal(store.writes, writes);
  await assert.rejects(settleDemoUsage(reservation, 0, store.options(START + 3)), DemoUsageUnavailableError);
  assert.equal(store.value.days['2026-11-10'].spentMicroUsd, 250000);
});

test('concurrent settlement cannot refund twice', async () => {
  const store = fakeStore();
  const reservation = await reserveDemoUsage('192.0.2.1', 1000000, store.options(START));
  await Promise.all(Array.from({ length: 5 }, () => settleDemoUsage(reservation, 250000, store.options(START + 1))));
  assert.equal(store.value.days['2026-11-10'].spentMicroUsd, 250000);
});

test('settlement after midnight updates the reservation original day', async () => {
  const store = fakeStore();
  const before = Date.parse('2026-11-10T14:59:59Z');
  const reservation = await reserveDemoUsage('192.0.2.1', 1000000, store.options(before));
  await reserveDemoUsage('192.0.2.2', 2000000, store.options(before + 2000));
  await settleDemoUsage(reservation, 250000, store.options(before + 3000));
  assert.equal(store.value.days['2026-11-10'].spentMicroUsd, 250000);
  assert.equal(store.value.days['2026-11-11'].spentMicroUsd, 2000000);
});

test('unknown reservations and excessive settlement amounts cannot adjust budget', async () => {
  const store = fakeStore();
  const reservation = await reserveDemoUsage('192.0.2.1', 1000000, store.options(START));
  await assert.rejects(settleDemoUsage({ ...reservation, id: '00000000-0000-0000-0000-000000000000' }, 0, store.options(START)), DemoUsageUnavailableError);
  await assert.rejects(settleDemoUsage(reservation, 1000001, store.options(START)), DemoUsageUnavailableError);
  assert.equal(store.value.days['2026-11-10'].spentMicroUsd, 1000000);
});

test('corrupt stored null and inconsistent spend fail closed without PUT', async () => {
  const nullStore = fakeStore(null);
  await assert.rejects(reserveDemoUsage('192.0.2.1', 1, nullStore.options(START)), DemoUsageUnavailableError);
  assert.equal(nullStore.writes, 0);
  const store = fakeStore();
  await reserveDemoUsage('192.0.2.1', 1000000, store.options(START));
  const corrupted = store.value;
  corrupted.days['2026-11-10'].spentMicroUsd = 0;
  const corruptStore = fakeStore(corrupted);
  await assert.rejects(reserveDemoUsage('192.0.2.1', 1, corruptStore.options(START)), DemoUsageUnavailableError);
  assert.equal(corruptStore.writes, 0);
});

test('uncertain committed write is not retried or refunded', async () => {
  const store = fakeStore();
  store.loseNextWriteResponse();
  await assert.rejects(reserveDemoUsage('192.0.2.1', 1000000, store.options(START)), DemoUsageUnavailableError);
  assert.equal(store.writes, 1);
  assert.equal(store.value.days['2026-11-10'].spentMicroUsd, 1000000);
});

test('expired reservation fails closed and current plus two earlier days remain', async () => {
  const store = fakeStore();
  const reservation = await reserveDemoUsage('192.0.2.1', 1, store.options(START));
  await reserveDemoUsage('192.0.2.1', 1, store.options(START + 86400000));
  await reserveDemoUsage('192.0.2.1', 1, store.options(START + 2 * 86400000));
  assert.deepEqual(Object.keys(store.value.days), ['2026-11-10', '2026-11-11', '2026-11-12']);
  await reserveDemoUsage('192.0.2.1', 1, store.options(START + 3 * 86400000));
  await assert.rejects(settleDemoUsage(reservation, 0, store.options(START + 3 * 86400000)), DemoUsageUnavailableError);
});

test('only HMAC hashes, timestamps, reservation ids and costs are persisted', async () => {
  const store = fakeStore();
  await reserveDemoUsage('2001:db8::42', 10, store.options(START));
  const serialized = JSON.stringify(store.value);
  assert.ok(!serialized.includes('2001:db8::42'));
  assert.ok(!serialized.includes(SECRET));
  assert.match(Object.keys(store.value.ips)[0], /^[0-9a-f]{64}$/);
});

test('missing configuration, SAS URLs and missing containers fail closed', async () => {
  await assert.rejects(reserveDemoUsage('192.0.2.1', 1), DemoUsageUnavailableError);
  const store = fakeStore();
  await assert.rejects(reserveDemoUsage('192.0.2.1', 1, { ...store.options(START), blobUrl: `${URL_VALUE}?sig=invalid` }), DemoUsageUnavailableError);
  await assert.rejects(reserveDemoUsage('192.0.2.1', 1, { ...store.options(START), fetchImpl: async () => new Response(null, { status: 404, headers: { 'x-ms-error-code': 'ContainerNotFound' } }) }), DemoUsageUnavailableError);
  assert.equal(store.writes, 0);
});

test('the standalone core requires an explicit token provider', async () => {
  const store = fakeStore();
  const options = { ...store.options(START), getAccessToken: undefined };
  await assert.rejects(checkDemoUsage('192.0.2.1', 1, options), DemoUsageUnavailableError);
  await assert.rejects(reserveDemoUsage('192.0.2.1', 1, options), DemoUsageUnavailableError);
  assert.equal(store.requests.length, 0);
});

test('hung store requests are bounded even if an adapter ignores abort', async () => {
  const store = fakeStore();
  const started = Date.now();
  await assert.rejects(reserveDemoUsage('192.0.2.1', 1, { ...store.options(START), requestTimeoutMs: 20, fetchImpl: () => new Promise(() => {}) }), DemoUsageUnavailableError);
  assert.ok(Date.now() - started < 1000);
});

(async () => {
  assert.equal(demoUsageDay(Date.parse('2026-11-10T15:00:00Z')), '2026-11-11');
  for (const { name, run } of cases) {
    await run();
    process.stdout.write(`PASS ${name}\n`);
  }
  process.stdout.write(`${cases.length} offline ledger tests passed; no Azure calls.\n`);
})().catch(error => { console.error(error); process.exitCode = 1; });
