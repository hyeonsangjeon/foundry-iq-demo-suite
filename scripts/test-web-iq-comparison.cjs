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
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function comparisonView(run, language) {
  const filename = path.join(root, 'components/web-iq/web-iq-answer-comparison.tsx');
  const exports = {};
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(compiled, { exports, require: name => {
    if (name === 'react' || name === 'react/jsx-runtime') return require(name);
    if (name === '@/lib/kbWebAnswer') return load('lib/kbWebAnswer.ts');
    if (name === '@/components/ui/button') return { Button: ({ children }) => React.createElement('button', null, children) };
    if (name === '@/components/web-iq/web-iq-source-detail') return { WebIqSourceDetail: () => null };
    if (name === '@/components/web-iq/web-iq-service-links') return { WebIqServiceLinks: () => null };
    throw new Error(`Unexpected view dependency: ${name}`);
  } }, { filename });
  return renderToStaticMarkup(React.createElement(exports.WebIqAnswerComparison, { run, language }));
}
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
  assert.equal(h.latest.errorCode, 'KB_RETRIEVAL_FAILED');
  assert.equal(h.latest.errorStage, 'kb');
});

test('KB HTTP failures: safe status/stage reach the controller and both locales without false preservation or downstream work', async () => {
  for (const status of [400, 401, 403, 404, 429, 502, 504]) {
    const expectedCode = { 400: 'KB_INVALID_REQUEST', 401: 'KB_AUTH_FAILED', 403: 'KB_ACCESS_DENIED',
      404: 'KB_NOT_FOUND', 429: 'KB_RATE_LIMITED', 502: 'KB_RETRIEVAL_FAILED', 504: 'KB_TIMEOUT' }[status];
    const calls = [];
    let bodyReads = 0, latest, webCalls = 0;
    const transport = modules(async (url, init) => {
      calls.push({ url, init });
      const response = Response.json({ error: 'do-not-expose-provider-body', details: 'do-not-expose-credential', code: 'unsafe-code' },
        { status, headers: { 'Retry-After': '17' } });
      response.json = async () => { bodyReads++; throw new Error('Provider error bodies must not be read'); };
      return response;
    });
    const { retrieveFromKnowledgeBase } = transport('lib/api.ts');
    const { WebIqComparisonController: Controller } = transport('lib/webIqComparison.ts');
    const instance = new Controller({
      retrieve: (picked, signal) => retrieveFromKnowledgeBase(picked.kbId, [], {}, signal),
      answer: () => { webCalls++; throw new Error('Unexpected downstream request'); },
      onChange: run => { latest = run; },
    });
    await instance.startComparison(selection(), 'fresh-token');
    assert.equal(calls.length, 1);
    assert.equal(bodyReads, 0);
    assert.equal(webCalls, 0);
    assert.equal(latest.state, 'failed');
    assert.equal(latest.internalTraceResponse, undefined);
    assert.equal(latest.errorCode, expectedCode);
    assert.equal(latest.errorStatus, status);
    assert.equal(latest.errorStage, 'kb');
    assert.equal(latest.retryAfterSeconds, 17);
    assert.doesNotMatch(JSON.stringify(latest), /do-not-expose|unsafe-code|fresh-token/);
    for (const language of ['ko', 'en']) {
      const markup = comparisonView(latest, language);
      assert.match(markup, new RegExp(`HTTP ${status}`));
      assert.match(markup, new RegExp(expectedCode));
      assert.match(markup, language === 'ko' ? /웹 검색과 추가 답변 생성을 시작하지 않았습니다/ : /Web search and additional synthesis were not started/);
      assert.doesNotMatch(markup, /보존|preserved|will appear here|여기에 표시됩니다/);
    }
  }
});

test('KB proxy v1 errors: allowlisted provider metadata survives without old body, stack or credential fields', async () => {
  const safe = { schemaVersion: 'kb.retrieve.error.v1', code: 'KB_RETRIEVAL_FAILED', stage: 'kb', status: 502,
    upstreamStatus: 502, providerCode: 'InvalidAgentRetrievalRequest', retryAfterSeconds: 23,
    details: 'do-not-expose-details', stack: 'do-not-expose-stack' };
  const transport = modules(async () => Response.json(safe, { status: 502, headers: { 'X-KB-Error-Schema': 'kb.retrieve.error.v1' } }));
  const { retrieveFromKnowledgeBase } = transport('lib/api.ts');
  const { WebIqComparisonController: Controller } = transport('lib/webIqComparison.ts');
  let latest;
  const instance = new Controller({ retrieve: (picked, signal) => retrieveFromKnowledgeBase(picked.kbId, [], {}, signal),
    answer: () => { throw new Error('Unexpected paid downstream request'); }, onChange: run => { latest = run; } });
  await instance.startComparison(selection(), 'fresh-token');
  assert.equal(latest.errorStatus, 502);
  assert.equal(latest.errorUpstreamStatus, 502);
  assert.equal(latest.errorProviderCode, 'InvalidAgentRetrievalRequest');
  assert.equal(latest.retryAfterSeconds, 23);
  assert.doesNotMatch(JSON.stringify(latest), /do-not-expose|details|stack|fresh-token/);
  assert.match(comparisonView(latest, 'en'), /InvalidAgentRetrievalRequest/);
  for (const invalid of [{ ...safe, schemaVersion: 'unrecognized' }, { ...safe, code: 'do-not-expose-code' },
    { ...safe, stage: 'do-not-expose-stage' }, { ...safe, status: 401 }]) {
    const mod = modules(async () => Response.json(invalid, { status: 502, headers: { 'X-KB-Error-Schema': 'kb.retrieve.error.v1' } }))('lib/api.ts');
    await assert.rejects(mod.retrieveFromKnowledgeBase('sample', [], {}), error => error.code === 'KB_RETRIEVAL_FAILED'
      && error.status === 502 && error.upstreamStatus === undefined && error.providerCode === undefined && error.retryAfterSeconds === undefined);
  }
  const forged = modules(async () => Response.json({ ...safe, providerCode: 'do-not-expose-provider', upstreamStatus: '502', retryAfterSeconds: 1000000 },
    { status: 502, headers: { 'X-KB-Error-Schema': 'kb.retrieve.error.v1' } }))('lib/api.ts');
  await assert.rejects(forged.retrieveFromKnowledgeBase('sample', [], {}), error => error.code === 'KB_RETRIEVAL_FAILED'
    && error.providerCode === undefined && error.upstreamStatus === undefined && error.retryAfterSeconds === undefined);
});

test('KB network, malformed success and abort errors retain only safe metadata and never expose transport messages', async () => {
  const signal = new AbortController();
  const network = modules(async () => { throw new Error('do-not-expose-network-credential'); })('lib/api.ts');
  await assert.rejects(network.retrieveFromKnowledgeBase('sample', [], {}, signal.signal), error =>
    error.code === 'KB_RETRIEVAL_NETWORK_FAILED' && error.stage === 'kb' && error.status === undefined
      && !error.message.includes('do-not-expose'));
  for (const payload of ['{', 'null', '[]', '42', '{"response":"not-array"}', '{"references":null}']) {
    const malformed = modules(async () => new Response(payload, { status: 200 }))('lib/api.ts');
    await assert.rejects(malformed.retrieveFromKnowledgeBase('sample', [], {}), error =>
      error.code === 'KB_INVALID_RESPONSE' && error.stage === 'kb' && error.status === 200);
  }
  signal.abort();
  await assert.rejects(network.retrieveFromKnowledgeBase('sample', [], {}, signal.signal), error => error.code === 'CANCELLED' && error.stage === 'kb');
});

test('KB empty and cancelled-before-KB views never claim a preserved answer', async () => {
  const empty = controller({ retrieve: () => snapshot({ response: [], references: [] }) });
  await empty.instance.startComparison(selection(), 'fresh-token');
  const pending = deferred(), cancelled = controller({ retrieve: () => pending.promise });
  const run = cancelled.instance.startComparison(selection(), 'fresh-token');
  cancelled.instance.cancel();
  for (const language of ['ko', 'en']) {
    const emptyMarkup = comparisonView(empty.latest, language);
    const cancelledMarkup = comparisonView(cancelled.latest, language);
    assert.doesNotMatch(emptyMarkup + cancelledMarkup, /보존|preserved/);
    assert.match(emptyMarkup, language === 'ko' ? /사용할 KB 근거 없음/ : /No usable KB material/);
    assert.match(cancelledMarkup, language === 'ko' ? /내부 결과를 받기 전에 요청을 취소/ : /cancelled before a KB result was received/);
  }
  assert.equal(cancelled.calls.web.length, 0);
  pending.resolve(snapshot()); await run;
});

test('answer failures: safe HTTP code and web/synthesis stage survive while only an existing snapshot gets preservation text', async () => {
  for (const stage of ['web', 'synthesis']) {
    const code = stage === 'web' ? 'WEB_SEARCH_FAILED' : 'SYNTHESIS_FAILED';
    const transport = modules(async () => Response.json({ code, stage, error: 'do-not-expose-answer-body' }, { status: 502 }));
    const { requestWebIqAnswer, WebIqComparisonController: Controller } = transport('lib/webIqComparison.ts');
    let latest;
    const instance = new Controller({ retrieve: async () => snapshot(), answer: requestWebIqAnswer, onChange: run => { latest = run; } });
    await instance.startComparison(selection(), 'fresh-token');
    assert.equal(latest.state, 'partial');
    assert.equal(latest.errorCode, code);
    assert.equal(latest.errorStatus, 502);
    assert.equal(latest.errorStage, stage);
    assert.deepEqual(plain(latest.internalTraceResponse), snapshot());
    assert.doesNotMatch(JSON.stringify(latest), /do-not-expose|fresh-token/);
    for (const language of ['ko', 'en']) {
      const markup = comparisonView(latest, language);
      assert.match(markup, /HTTP 502/);
      assert.match(markup, language === 'ko' ? /KB 결과는 보존됩니다/ : /The KB result is preserved/);
      assert.doesNotMatch(markup, /were not started|시작하지 않았습니다/);
    }
  }
});

test('answer error parsing: unknown provider fields/codes/stages and unbounded retry delays are discarded', async () => {
  const transport = modules(async () => Response.json({ code: 'do-not-expose-code', stage: 'do-not-expose-stage', details: 'do-not-expose-details' },
    { status: 502, headers: { 'Retry-After': '999999999' } }))('lib/webIqComparison.ts');
  await assert.rejects(transport.requestWebIqAnswer(query, snapshot(), 'fresh-token', new AbortController().signal), error =>
    error.code === 'ANSWER_FAILED' && error.status === 502 && error.stage === undefined && error.retryAfterSeconds === undefined
      && !JSON.stringify(error).includes('do-not-expose') && !error.message.includes('do-not-expose'));
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
  const h = controller({ answer: () => ++attempts === 1 ? Promise.reject(new WebIqComparisonError('WEB_SEARCH_FAILED', 502, undefined, 'web')) : retry.promise });
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
  assert.equal(h.latest.errorCode, undefined);
  assert.equal(h.latest.errorStatus, undefined);
  assert.equal(h.latest.errorStage, undefined);
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
