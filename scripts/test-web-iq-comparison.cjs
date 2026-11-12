const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Pure controller + transport tests. No credential files, real network, or browser.
const root = path.resolve(__dirname, '..');
const cases = [];
const test = (name, run) => cases.push({ name, run });
const plain = value => JSON.parse(JSON.stringify(value));
const flush = () => new Promise(resolve => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function modules(fetch = () => { throw new Error('Unexpected network request'); }) {
  const cache = new Map();
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename);
    const exports = {};
    cache.set(filename, exports);
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(compiled, {
      exports, require: name => {
        if (name.startsWith('@/')) return load(`${name.slice(2)}.ts`);
        throw new Error(`Unexpected dependency: ${name}`);
      },
      fetch, Response, Request, Headers, AbortController, AbortSignal, structuredClone,
      performance, crypto: require('node:crypto').webcrypto,
    }, { filename });
    return exports;
  }
  return load;
}
const load = modules();
const { WebIqComparisonController, WebIqComparisonError } = load('lib/webIqComparison.ts');
const questions = load('lib/webIqDemoQuestions.ts');
const query = questions.WEB_IQ_DEMO_QUESTIONS.find(item => item.id === 'nasa-earth-at-night').en;
function selection(extra = {}) {
  return { kbId: 'nasa-earth-book', presetId: 'nasa-earth-at-night', query, language: 'en', settings: { includeActivity: true, outputMode: 'answerSynthesis' }, ...extra };
}
function snapshot(extra = {}) {
  return { response: [{ role: 'assistant', content: [{ type: 'text', text: 'Original internal answer [ref_id:0].' }] }],
    activity: [{ id: 0, type: 'searchIndex', elapsedMs: 20, knowledgeSourceName: 'sample', count: 1, queryTime: '2026-11-12T00:00:00Z' }],
    references: [{ id: '0', type: 'searchIndex', activitySource: 0, docKey: 'public-sample', sourceData: { title: 'Public NASA fixture', content: 'Internal passage fixture' } }], ...extra };
}
function answer() {
  return { schemaVersion: 'webiq.answer.v2', answer: 'Web-supported fixture [ref_id:1].',
    sources: [{ id: 'I1', origin: 'internal', title: 'Internal', content: 'Internal passage fixture' },
      { id: 'W1', origin: 'web', title: 'Web', content: 'Web passage fixture', url: 'https://nasa.example/night' }],
    webSearch: { results: [], query, retrievedAt: '2026-11-12T00:00:00Z' }, trace: { webSearchMs: 3, synthesisMs: 5 } };
}
function controller(options = {}) {
  let latest, clock = 0, sequence = 0;
  const changes = [], calls = { kb: [], web: [] };
  const instance = new WebIqComparisonController({
    retrieve: async (...args) => { calls.kb.push(args); return options.retrieve ? options.retrieve(...args) : snapshot(); },
    answer: async (...args) => { calls.web.push(args); return options.answer ? options.answer(...args) : answer(); },
    onChange: run => { latest = run; changes.push(run); }, now: () => clock, id: () => `offline-${++sequence}`,
  });
  return { instance, calls, changes, get latest() { return latest; }, setClock: value => { clock = value; } };
}

test('KB transport: Tech preserves valid retrieval overrides and requests passages without obsolete maxSubQueries', async () => {
  const calls = [];
  const transport = modules(async (url, init) => { calls.push({ url, init }); return Response.json(snapshot()); });
  const { buildKbWebKnowledgeSourceParams, buildKbRetrieveRequest } = transport('lib/kbWebAnswer.ts');
  const attached = [{ name: 'public-nasa', kind: 'azureBlob', includeReferences: false, includeReferenceSourceData: false,
    alwaysQuerySource: false, rerankerThreshold: 0, maxSubQueries: 2, headers: { 'x-fixture': 'offline-only' } },
  { name: 'attached-web', kind: 'web', alwaysQuerySource: true }];
  const catalog = [{ name: 'public-nasa', kind: 'searchIndex' }, { name: 'not-attached', kind: 'azureBlob' }];
  const before = JSON.stringify({ attached, catalog });
  const request = buildKbRetrieveRequest(query, [{ role: 'user', content: [{ type: 'text', text: query }] }], {
    includeActivity: true, outputMode: 'answerSynthesis', retrievalReasoningEffort: { kind: 'medium' },
    knowledgeSourceParams: buildKbWebKnowledgeSourceParams(attached, catalog),
  });
  await transport('lib/api.ts').retrieveFromKnowledgeBase('nasa-earth-book', request.messages, request.params, new AbortController().signal);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/knowledge-bases/nasa-earth-book/retrieve');
  const body = JSON.parse(calls[0].init.body);
  assert.deepEqual(body.knowledgeSourceParams, [{ knowledgeSourceName: 'public-nasa', kind: 'searchIndex',
    includeReferences: true, includeReferenceSourceData: true, alwaysQuerySource: false,
    rerankerThreshold: 0, headers: { 'x-fixture': 'offline-only' } },
  { knowledgeSourceName: 'attached-web', kind: 'web', includeReferences: true, includeReferenceSourceData: true, alwaysQuerySource: true }]);
  assert.equal(body.outputMode, 'answerSynthesis');
  assert.deepEqual(body.retrievalReasoningEffort, { kind: 'medium' });
  assert.equal(body.includeActivity, true);
  assert.equal(JSON.stringify({ attached, catalog }), before);
});

test('KB transport: missing catalog/kind never guesses searchIndex and preserves minimal and answer-only fallbacks', async () => {
  const calls = [];
  const original = snapshot({ references: [{ id: '0', type: 'searchIndex', activitySource: 0, docKey: 'metadata-only' }] });
  const transport = modules(async (url, init) => { calls.push({ url, init }); return Response.json(original); });
  const { buildKbWebKnowledgeSourceParams, buildKbRetrieveRequest, buildKbWebContext } = transport('lib/kbWebAnswer.ts');
  const missing = [{ name: 'missing-kind' }, { name: 'unknown-kind', kind: 'unknown' }];
  assert.equal(buildKbWebKnowledgeSourceParams(missing), undefined);
  assert.deepEqual(plain(buildKbWebKnowledgeSourceParams([...missing, { name: 'known-attached', kind: 'azureBlob',
    alwaysQuerySource: null, rerankerThreshold: null, maxSubQueries: null }])),
    [{ knowledgeSourceName: 'known-attached', kind: 'azureBlob', includeReferences: true, includeReferenceSourceData: true }]);
  const request = buildKbRetrieveRequest(query, [], { includeActivity: true, outputMode: 'answerSynthesis',
    retrievalReasoningEffort: { kind: 'minimal' }, knowledgeSourceParams: buildKbWebKnowledgeSourceParams(missing) });
  const result = await transport('lib/api.ts').retrieveFromKnowledgeBase('nasa-earth-book', request.messages, request.params, new AbortController().signal);
  assert.equal(calls.length, 1);
  const body = JSON.parse(calls[0].init.body);
  assert.equal(Object.hasOwn(body, 'knowledgeSourceParams'), false);
  assert.equal(Object.hasOwn(body, 'messages'), false);
  assert.equal(body.outputMode, 'extractiveData');
  assert.deepEqual(body.intents, [{ type: 'semantic', search: query }]);
  const context = buildKbWebContext(result);
  assert.equal(context.internalAnswer, original.response[0].content[0].text);
  assert.equal(context.sources.length, 0);
  assert.equal(context.usable, true);
});

test('normal: Tech controller retrieves KB once, publishes original immediately, and synthesizes once', async () => {
  const web = deferred();
  const original = snapshot(), before = JSON.stringify(original);
  const h = controller({ retrieve: () => original, answer: () => web.promise });
  const pending = h.instance.startComparison(selection(), 'fresh-token-one');
  await flush();
  assert.equal(h.calls.kb.length, 1);
  assert.equal(h.calls.web.length, 1);
  assert.equal(h.latest.state, 'retrieving-web');
  assert.deepEqual(plain(h.latest.internalTraceResponse), original);
  h.latest.internalTraceResponse.references[0].sourceData.content = 'Consumer mutation';
  h.setClock(100);
  web.resolve(answer()); await pending;
  assert.equal(h.latest.state, 'complete');
  assert.equal(h.latest.internalTraceResponse.references[0].sourceData.content, 'Internal passage fixture');
  assert.equal(JSON.stringify(original), before);
  assert.equal(h.latest.comparisonWallMs, 100);
  assert.equal(h.latest.webAttemptWallMs, 100);
});

test('web failure: internal answer and original references survive with partial status and no auto retry', async () => {
  const h = controller({ answer: () => { throw new WebIqComparisonError('WEB_SEARCH_FAILED', 502); } });
  await h.instance.startComparison(selection(), 'fresh-token-one');
  assert.equal(h.latest.state, 'partial');
  assert.equal(h.latest.errorCode, 'WEB_SEARCH_FAILED');
  assert.deepEqual(plain(h.latest.internalTraceResponse), snapshot());
  assert.equal(h.latest.combined, undefined);
  assert.equal(h.calls.kb.length, 1);
  assert.equal(h.calls.web.length, 1);
});

test('snapshot isolation: web adapter mutations cannot change the preserved left pane', async () => {
  const h = controller({ answer: (_query, supplied) => {
    supplied.references[0].sourceData.content = 'Mutated in external adapter';
    supplied.response[0].content[0].text = 'Mutated answer';
    return answer();
  } });
  await h.instance.startComparison(selection(), 'fresh-token-one');
  assert.deepEqual(plain(h.latest.internalTraceResponse), snapshot());
});

for (const code of ['SYNTHESIS_FAILED', 'ANSWER_INCOMPLETE', 'CITATION_INVALID']) {
  test(`web failure ${code}: success remains confined to the internal pane`, async () => {
    const h = controller({ answer: () => { throw new WebIqComparisonError(code, 502); } });
    await h.instance.startComparison(selection(), 'fresh-token-one');
    assert.equal(h.latest.state, 'partial');
    assert.equal(h.latest.errorCode, code);
    assert.ok(h.latest.internalTraceResponse);
    assert.equal(h.latest.combined, undefined);
    assert.equal(h.calls.web.length, 1);
  });
}

test('KB failure: web/model stage never starts', async () => {
  const h = controller({ retrieve: () => { throw new Error('Offline retrieval failure'); } });
  await h.instance.startComparison(selection(), 'fresh-token-one');
  assert.equal(h.latest.state, 'failed');
  assert.equal(h.latest.internalTraceResponse, undefined);
  assert.equal(h.calls.web.length, 0);
});

for (const empty of [snapshot({ response: [], references: [] }), snapshot({ response: [], references: [{ id: 'm', type: 'searchIndex', activitySource: 0, sourceData: { title: 'Metadata only' } }] })]) {
  test('KB empty or metadata-only: blocked_empty preserves original and has zero web calls', async () => {
    const h = controller({ retrieve: () => empty });
    await h.instance.startComparison(selection(), 'fresh-token-one');
    assert.equal(h.latest.state, 'blocked_empty');
    assert.equal(h.calls.web.length, 0);
    assert.deepEqual(plain(h.latest.internalTraceResponse), empty);
    await assert.rejects(h.instance.retryWeb(h.latest.runId, 'fresh-token-two', selection()), error => error.code === 'SNAPSHOT_CHANGED');
    assert.equal(h.calls.kb.length, 1);
  });
}

test('KB extractive-only: citable material permits additional synthesis without inventing an internal answer', async () => {
  const extractive = snapshot({ response: [] });
  const h = controller({ retrieve: () => extractive });
  await h.instance.startComparison(selection({ settings: { retrievalReasoningEffort: { kind: 'minimal' }, outputMode: 'extractiveData' } }), 'fresh-token-one');
  assert.equal(h.latest.state, 'complete');
  assert.deepEqual(plain(h.calls.web[0][1].response), []);
  assert.equal(h.calls.kb.length, 1);
  assert.equal(h.calls.web.length, 1);
});

test('double-click: synchronous lock permits one KB and one web stage', async () => {
  const kb = deferred(), h = controller({ retrieve: () => kb.promise });
  const first = h.instance.startComparison(selection(), 'fresh-token-one');
  await h.instance.startComparison(selection(), 'fresh-token-two');
  assert.equal(h.calls.kb.length, 1);
  kb.resolve(snapshot()); await first;
  assert.equal(h.calls.web.length, 1);
});

test('cancel during KB: late ignored-abort success cannot overwrite a new run', async () => {
  const old = deferred(); let count = 0;
  const h = controller({ retrieve: () => ++count === 1 ? old.promise : snapshot() });
  const first = h.instance.startComparison(selection(), 'fresh-token-one');
  const oldId = h.latest.runId;
  h.instance.cancel();
  assert.equal(h.latest.state, 'cancelled');
  assert.equal(h.calls.kb[0][1].aborted, true);
  await h.instance.startComparison(selection(), 'fresh-token-two');
  const newId = h.latest.runId;
  assert.notEqual(newId, oldId);
  old.resolve(snapshot({ response: [{ content: [{ type: 'text', text: 'Stale text' }] }] })); await first;
  assert.equal(h.latest.runId, newId);
  assert.equal(h.latest.state, 'complete');
  assert.equal(h.calls.kb.length, 2);
  assert.equal(h.calls.web.length, 1);
});

test('cancel during web: preserve original result and ignore late combined success', async () => {
  const web = deferred(), h = controller({ answer: () => web.promise });
  const first = h.instance.startComparison(selection(), 'fresh-token-one');
  await flush();
  assert.equal(h.latest.state, 'retrieving-web');
  h.instance.cancel();
  assert.equal(h.latest.state, 'cancelled');
  assert.deepEqual(plain(h.latest.internalTraceResponse), snapshot());
  web.resolve(answer()); await first;
  assert.equal(h.latest.state, 'cancelled');
  assert.equal(h.latest.combined, undefined);
  assert.equal(h.calls.web[0][3].aborted, true);
});

test('invalidate on selection/language/clear: old response has no visible consumer', async () => {
  const web = deferred(), h = controller({ answer: () => web.promise });
  const pending = h.instance.startComparison(selection(), 'fresh-token-one');
  await flush();
  h.instance.invalidate();
  assert.equal(h.latest, null);
  web.reject(new Error('Late rejected stale request')); await pending;
  assert.equal(h.latest, null);
});

test('retry web: same snapshot, new attempt and token, zero extra KB, original wait plus separate retry wait', async () => {
  let attempts = 0; const retry = deferred();
  const h = controller({ answer: () => ++attempts === 1 ? Promise.reject(new WebIqComparisonError('WEB_SEARCH_FAILED')) : retry.promise });
  await h.instance.startComparison(selection(), 'fresh-token-one');
  const original = plain(h.latest.internalTraceResponse), runId = h.latest.runId, attemptId = h.latest.attemptId, initialWait = h.latest.comparisonWallMs;
  h.setClock(100000);
  const pending = h.instance.retryWeb(runId, 'fresh-token-two', selection());
  h.setClock(100050);
  retry.resolve(answer()); await pending;
  assert.equal(h.calls.kb.length, 1);
  assert.equal(h.calls.web.length, 2);
  assert.equal(h.latest.runId, runId);
  assert.notEqual(h.latest.attemptId, attemptId);
  assert.equal(h.calls.web[0][2], 'fresh-token-one');
  assert.equal(h.calls.web[1][2], 'fresh-token-two');
  assert.deepEqual(plain(h.calls.web[1][1]), original);
  assert.equal(h.latest.comparisonWallMs, initialWait);
  assert.equal(h.latest.webAttemptWallMs, 50);
});

test('retry selection mismatch: changing KB/question/language/settings never reuses an old snapshot', async () => {
  const h = controller({ answer: () => { throw new Error('Fail for retry fixture'); } });
  await h.instance.startComparison(selection(), 'fresh-token-one');
  for (const change of [{ kbId: 'different' }, { query: 'changed query' }, { language: 'ko' }, { settings: { outputMode: 'extractiveData' } }]) {
    await assert.rejects(h.instance.retryWeb(h.latest.runId, 'fresh-token-two', selection(change)), error => error.code === 'SNAPSHOT_CHANGED');
  }
  assert.equal(h.calls.kb.length, 1);
  assert.equal(h.calls.web.length, 1);
});

test('selection capture: caller mutation cannot change run/query/settings or source mappings', async () => {
  const kb = deferred(), h = controller({ retrieve: () => kb.promise }), picked = selection();
  const pending = h.instance.startComparison(picked, 'fresh-token-one');
  picked.query = 'Mutated external question'; picked.settings.outputMode = 'changed';
  kb.resolve(snapshot()); await pending;
  assert.equal(h.latest.selection.query, query);
  assert.equal(h.latest.selection.settings.outputMode, 'answerSynthesis');
  assert.equal(h.calls.web[0][0], query);
});

test('expired verification after long KB: preserve snapshot and wait for explicit fresh-token retry', async () => {
  const kb = deferred(), h = controller({ retrieve: () => kb.promise });
  const pending = h.instance.startComparison(selection(), 'old-token');
  h.setClock(300001); kb.resolve(snapshot()); await pending;
  assert.equal(h.latest.state, 'partial');
  assert.equal(h.latest.errorCode, 'BOT_CHECK_REQUIRED');
  assert.equal(h.calls.web.length, 0);
  await h.instance.retryWeb(h.latest.runId, 'fresh-token-two', selection());
  assert.equal(h.latest.state, 'complete');
  assert.equal(h.calls.kb.length, 1);
  assert.equal(h.calls.web.length, 1);
});

test('rate failure: controller preserves Retry-After for UI countdown without retrying', async () => {
  const h = controller({ answer: () => { throw new WebIqComparisonError('RATE_LIMITED', 429, 37); } });
  await h.instance.startComparison(selection(), 'fresh-token-one');
  assert.equal(h.latest.retryAfterSeconds, 37);
  assert.equal(h.latest.state, 'partial');
  assert.equal(h.calls.web.length, 1);
});

test('invalid preset/missing token: no retrieval or web work', async () => {
  const h = controller();
  await assert.rejects(h.instance.startComparison(selection({ query: 'An arbitrary question' }), 'token'), error => error.code === 'QUESTION_NOT_ALLOWED');
  await assert.rejects(h.instance.startComparison(selection(), ''), error => error.code === 'BOT_CHECK_REQUIRED');
  assert.equal(h.calls.kb.length, 0);
  assert.equal(h.calls.web.length, 0);
});

test('transport: same shared snapshot adapter bounds context and sends no client costs/model/usage', async () => {
  const calls = [];
  const mod = modules(async (url, init) => { calls.push({ url, init }); return Response.json(answer()); })('lib/webIqComparison.ts');
  const original = snapshot(), before = JSON.stringify(original);
  const result = await mod.requestWebIqAnswer(query, original, 'fresh-token-one', new AbortController().signal);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/web-iq/answer');
  const body = JSON.parse(calls[0].init.body);
  assert.deepEqual(Object.keys(body).sort(), ['internalAnswer', 'query', 'sources', 'turnstileToken']);
  assert.equal(body.sources.length, 1);
  assert.equal(body.internalAnswer, original.response[0].content[0].text);
  assert.equal(JSON.stringify(original), before);
  assert.equal(result.telemetry, undefined);
});

test('transport: missing/forged usage is not displayed as zero cost', async () => {
  const response = answer();
  response.telemetry = { schemaVersion: 'webiq.telemetry.v1', usage: { status: 'unknown', inputTokens: 0, outputTokens: 0 }, cost: { extraSynthesisMicroUsd: 0 } };
  const mod = modules(async () => Response.json(response))('lib/webIqComparison.ts');
  const result = await mod.requestWebIqAnswer(query, snapshot(), 'fresh-token-one', new AbortController().signal);
  assert.equal(result.telemetry, undefined);
});

test('transport: Retry-After response reaches typed client error', async () => {
  const mod = modules(async () => Response.json({ code: 'RATE_LIMITED' }, { status: 429, headers: { 'Retry-After': '17' } }))('lib/webIqComparison.ts');
  await assert.rejects(mod.requestWebIqAnswer(query, snapshot(), 'fresh-token-one', new AbortController().signal), error => error.code === 'RATE_LIMITED' && error.retryAfterSeconds === 17);
});

test('transport: null, primitive, array and malformed successful JSON get typed invalid-response errors', async () => {
  for (const payload of ['null', '42', '[]', '"text"', '{']) {
    const mod = modules(async () => new Response(payload, { status: 200 }))('lib/webIqComparison.ts');
    await assert.rejects(mod.requestWebIqAnswer(query, snapshot(), 'fresh-token-one', new AbortController().signal), error => error.code === 'INVALID_ANSWER_RESPONSE');
    await assert.rejects(mod.checkWebIqAnswerReadiness(new AbortController().signal), error => error.code === 'ANSWER_NOT_CONFIGURED');
  }
});

(async () => {
  let failures = 0;
  for (const { name, run } of cases) {
    try { await run(); console.log(`PASS ${name}`); } catch (error) { failures++; console.error(`FAIL ${name}`, error); }
  }
  console.log(`${cases.length - failures} passed, ${failures} failed (${cases.length} offline comparison checks).`);
  process.exitCode = failures ? 1 : 0;
})();
