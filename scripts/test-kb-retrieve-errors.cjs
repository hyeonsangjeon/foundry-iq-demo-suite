'use strict';

// Offline replay only: no env files, credentials or provider requests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');
const filename = path.resolve(__dirname, '../app/api/knowledge-bases/[id]/retrieve/route.ts');
const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function harness(options = {}) {
  const requests = [], logs = [], exports = {};
  const env = { NODE_ENV: 'production', AZURE_SEARCH_ENDPOINT: 'https://offline.search.windows.net/',
    AZURE_SEARCH_API_KEY: 'fixture-only-admin-key', AZURE_SEARCH_API_VERSION: '2025-11-01-preview', ...options.env };
  vm.runInNewContext(source, { exports, URL, Request, Response, AbortController,
    process: { env }, console: Object.fromEntries(['log', 'info', 'warn', 'error'].map(k => [k, (...args) => logs.push(args)])),
    require: name => {
      if (name === 'next/server') return { NextResponse: Response };
      if (name === '@/lib/token-manager') return { tokenManager: { getSearchToken: async () => {
        if (options.authThrows) throw new Error('fixture-private-credential-error');
        return 'fixture-only-token';
      } } };
      throw new Error(`Unexpected import ${name}`);
    },
    fetch: async (url, init) => {
      requests.push({ url, init });
      if (options.fetchThrows) throw new Error('fixture-private-network-error');
      return options.response ? options.response() : Response.json(options.payload ?? { response: [], references: [] },
        { status: options.status || 200, headers: options.headers });
    },
  }, { filename });
  const post = (body = { messages: [], includeActivity: true }, signal) => exports.POST(new Request('https://demo.example/api/knowledge-bases/public-fixture/retrieve', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-ms-query-source-authorization': 'fixture-only-acl' },
    body: typeof body === 'string' ? body : JSON.stringify(body), signal,
  }), { params: Promise.resolve({ id: 'public-fixture' }) });
  return { post, requests, logs };
}

test('Azure502 replay preserves stage/status/known nested code without returning or logging provider material', async () => {
  const h = harness({ status: 502, payload: { error: { code: '', message: 'fixture-private-provider-message',
    details: [{ code: 'InvalidAgentRetrievalRequest', message: 'fixture-private-source-and-endpoint' }] } } });
  const response = await h.post(); const result = await response.json();
  assert.equal(response.status, 502); assert.equal(response.headers.get('X-KB-Error-Schema'), 'kb.retrieve.error.v1');
  assert.equal(result.code, 'KB_RETRIEVAL_FAILED'); assert.equal(result.stage, 'kb');
  assert.equal(result.upstreamStatus, 502); assert.equal(result.providerCode, 'InvalidAgentRetrievalRequest');
  assert.equal(JSON.stringify(result).includes('fixture-'), false);
  assert.equal(Object.hasOwn(result, 'details'), false); assert.equal(Object.hasOwn(result, 'stack'), false);
  assert.equal(h.requests.length, 1); assert.equal(h.logs.length, 0);
});

test('HTTP auth/not-found/rate/timeout errors retain status and bounded Retry-After without retrying', async () => {
  for (const [status, code] of [[403, 'KB_ACCESS_DENIED'], [404, 'KB_NOT_FOUND'], [429, 'KB_RATE_LIMITED'], [504, 'KB_TIMEOUT']]) {
    const h = harness({ status, payload: { error: { code: 'Forbidden' } }, headers: { 'Retry-After': '17' } });
    const response = await h.post(); const result = await response.json();
    assert.equal(response.status, status); assert.equal(result.code, code); assert.equal(result.retryAfterSeconds, 17);
    assert.equal(response.headers.get('Retry-After'), '17'); assert.equal(h.requests.length, 1);
  }
  const h = harness({ status: 429, headers: { 'Retry-After': '999999' } });
  const response = await h.post(); assert.equal((await response.json()).retryAfterSeconds, undefined);
});

test('Success preserves the Azure snapshot and forwards ACL only to the fixed Search endpoint', async () => {
  const payload = { response: [{ role: 'assistant', content: [{ type: 'text', text: 'Fixture answer' }] }],
    references: [{ id: '0', sourceData: { content: 'Fixture passage' } }], activity: [{ type: 'searchIndex' }] };
  const h = harness({ payload }); const response = await h.post();
  assert.deepEqual(await response.json(), payload); assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(h.requests.length, 1); assert.equal(h.requests[0].url, 'https://offline.search.windows.net/knowledgebases/public-fixture/retrieve?api-version=2025-11-01-preview');
  assert.equal(h.requests[0].init.headers['x-ms-query-source-authorization'], 'fixture-only-acl');
  assert.equal(h.requests[0].init.redirect, 'error'); assert.equal(h.logs.length, 0);
});

test('Invalid input or missing configuration never reaches the provider', async () => {
  for (const body of ['{broken', 'null', '[]']) {
    const h = harness(); const response = await h.post(body);
    assert.equal(response.status, 400); assert.equal((await response.json()).code, 'KB_INVALID_REQUEST');
    assert.equal(h.requests.length, 0);
  }
  const h = harness({ env: { AZURE_SEARCH_API_VERSION: '' } });
  assert.equal((await h.post()).status, 503); assert.equal(h.requests.length, 0);
});

test('Auth failure and pre-cancellation are separate safe outcomes before retrieval', async () => {
  const auth = harness({ env: { AZURE_SEARCH_USE_RBAC: 'true' }, authThrows: true });
  const response = await auth.post(); const result = await response.json();
  assert.equal(response.status, 503); assert.equal(result.code, 'KB_AUTH_FAILED');
  assert.equal(JSON.stringify(result).includes('credential'), false); assert.equal(auth.requests.length, 0);
  const abort = new AbortController(); abort.abort(); const h = harness();
  const cancelled = await h.post(undefined, abort.signal);
  assert.equal(cancelled.status, 499); assert.equal((await cancelled.json()).code, 'KB_CANCELLED');
  assert.equal(h.requests.length, 0);
});

test('Network errors and invalid success payloads remain KB failures without exception details', async () => {
  for (const options of [{ fetchThrows: true }, { response: () => new Response('private-not-json') }]) {
    const h = harness(options); const response = await h.post(); const body = await response.json();
    assert.equal(response.status, 502); assert.equal(body.stage, 'kb');
    assert.equal(JSON.stringify(body).includes('private'), false); assert.equal(h.requests.length, 1);
  }
});

test('Unknown provider codes and HTML errors are never reflected to the browser', async () => {
  for (const options of [{ status: 502, payload: { error: { code: 'fixture-private-code', message: 'private body' } } },
    { response: () => new Response('<html>private body</html>', { status: 502 }) }]) {
    const h = harness(options); const response = await h.post(); const body = await response.json();
    assert.equal(response.status, 502); assert.equal(body.providerCode, undefined);
    assert.equal(JSON.stringify(body).includes('private'), false);
  }
});
