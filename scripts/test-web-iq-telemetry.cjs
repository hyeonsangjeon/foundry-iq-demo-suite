const assert = require('node:assert/strict');
const { harness } = require('./test-web-iq-usage.cjs');

// Uses the existing in-memory route harness: fake credentials and zero real network I/O.
const cases = [];
const test = (name, run) => cases.push({ name, run });
const completion = (extra = {}) => ({ model: 'gpt-4o-2024-11-20', usage: { prompt_tokens: 1000, completion_tokens: 50 },
  choices: [{ finish_reason: 'stop', message: { content: 'Internal observation [I1]. Public update [W1].' } }], ...extra });
const plain = value => JSON.parse(JSON.stringify(value));

test('pricing: integer USD conversion, legacy reservation and disabled Auto gate', () => {
  const p = harness().load('lib/webIqPricing.ts');
  assert.equal(p.WEB_IQ_SEARCH_MICRO_USD, 7 / 1000 * 1000000);
  assert.equal(p.WEB_IQ_BROWSE_MICRO_USD, 1 / 1000 * 1000000);
  assert.equal(p.WEB_IQ_ANSWER_RESERVATION_MICRO_USD, 421000);
  for (const value of [undefined, null, '0', -1, 0.1, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.equal(p.isKnownMicroUsd(value), false);
  assert.equal(p.isKnownMicroUsd(0), true);
  assert.equal(p.WEB_IQ_PRICING.auto.enabled, false);
  assert.equal(p.WEB_IQ_PRICING.auto.conservativeReservation, null);
});

test('answer: additive telemetry preserves legacy contract and exposes only observed safe values', async () => {
  const h = harness();
  const response = await h.routes.answer.POST(h.request('answer', { cost: 0, model: 'fake', tokens: 0 }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.schemaVersion, 'webiq.answer.v2');
  for (const field of ['answer', 'sources', 'webSearch', 'trace', 'kbContextOnly']) assert.ok(Object.hasOwn(body, field));
  assert.equal(body.telemetry.usage.status, 'verified');
  assert.equal(body.telemetry.usage.model, 'gpt-4o-2024-11-20');
  assert.equal(body.telemetry.cost.extraSynthesisMicroUsd, 3600);
  assert.equal(body.telemetry.cost.addedKnownMicroUsd, 10600);
  assert.equal(body.telemetry.cost.settlement, 'settled');
  assert.equal(body.telemetry.cost.kbCostStatus, 'not_included');
  assert.equal(body.telemetry.comparisonClass, 'workflow-observation');
  assert.equal(body.webSearch.results[0].sourceId, 'W1');
  assert.equal(body.sources[1].origin, 'web');
  assert.ok(body.telemetry.timing.webStageWallMs >= body.telemetry.timing.webRequestWallMs);
  assert.ok(body.telemetry.timing.synthesisStageWallMs >= body.telemetry.timing.synthesisRequestWallMs);
  assert.equal(h.requests.filter(item => item.destination === 'web').length, 1);
  assert.equal(h.requests.filter(item => item.destination === 'model').length, 1);
  assert.equal(h.settlements.length, 1);
  const serialized = JSON.stringify(body);
  for (const secret of ['offline-fake-key', 'offline-fake-token', 'reservation-1', '192.0.2.1', 'prompt_tokens', 'choices']) assert.ok(!serialized.includes(secret));
});

test('tickets: only public web results receive capabilities, and capabilities stay outside model context', async () => {
  const h = harness({ env: { WEBIQ_SOURCE_TICKET_SECRET: 'offline-fake-ticket-signing-key-0123456789' },
    webPayload: { webResults: [{ title: 'Public page', url: 'https://www.nasa.gov/earth/', content: 'Public evidence fixture' }] } });
  const response = await h.routes.answer.POST(h.request('answer'));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.webSearch.results[0].sourceTicket);
  assert.equal(body.sources[0].sourceTicket, undefined);
  assert.equal(body.sources[1].sourceTicket, body.webSearch.results[0].sourceTicket);
  const model = h.requests.find(item => item.destination === 'model').body;
  assert.ok(!JSON.stringify(model).includes(body.sources[1].sourceTicket));
  assert.equal(h.requests.filter(item => item.destination === 'web').length, 1);
});

for (const [name, fields] of [
  ['missing usage', { usage: undefined }], ['missing model', { model: undefined }],
  ['model mismatch', { model: 'other-model' }],
  ['negative', { usage: { prompt_tokens: -1, completion_tokens: 0 } }],
  ['fractional', { usage: { prompt_tokens: 1.5, completion_tokens: 0 } }],
  ['overflow', { usage: { prompt_tokens: Number.MAX_SAFE_INTEGER + 1, completion_tokens: 0 } }],
  ['output bound', { usage: { prompt_tokens: 1000, completion_tokens: 2501 } }],
  ['numeric string', { usage: { prompt_tokens: '1000', completion_tokens: 50 } }],
]) {
  test(`usage: ${name} stays unknown and keeps reservation without a paid retry`, async () => {
    const h = harness({ completion: completion(fields) });
    const body = await (await h.routes.answer.POST(h.request('answer'))).json();
    assert.deepEqual(body.telemetry.usage, { status: 'unknown', model: null, inputTokens: null, outputTokens: null });
    assert.equal(body.telemetry.cost.extraSynthesisMicroUsd, null);
    assert.equal(body.telemetry.cost.addedKnownMicroUsd, 7000);
    assert.equal(body.telemetry.cost.settlement, 'reservation_retained');
    assert.equal(h.spent, 421000);
    assert.equal(h.settlements.length, 0);
    assert.equal(h.requests.filter(item => item.destination === 'model').length, 1);
  });
}

test('usage: verified zero remains distinct from missing usage', async () => {
  const h = harness({ completion: completion({ usage: { prompt_tokens: 0, completion_tokens: 0 } }) });
  const body = await (await h.routes.answer.POST(h.request('answer'))).json();
  assert.equal(body.telemetry.usage.status, 'verified');
  assert.equal(body.telemetry.usage.inputTokens, 0);
  assert.equal(body.telemetry.cost.extraSynthesisMicroUsd, 0);
  assert.equal(body.telemetry.cost.addedKnownMicroUsd, 7000);
  assert.equal(h.spent, 7000);
});

test('settlement: one failure keeps successful answer and marks full reservation retained', async () => {
  const h = harness({ settlementThrows: true });
  const response = await h.routes.answer.POST(h.request('answer'));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.answer);
  assert.equal(body.telemetry.cost.settlement, 'reservation_retained');
  assert.equal(body.telemetry.cost.addedKnownMicroUsd, 10600);
  assert.equal(h.spent, 421000);
  assert.equal(h.settlements.length, 1);
  assert.equal(h.requests.filter(item => ['web', 'model'].includes(item.destination)).length, 2);
});

for (const reason of ['length', 'content_filter', 'tool_calls', null]) {
  test(`incomplete: ${reason} is typed failure, no partial answer or second synthesis`, async () => {
    const h = harness({ completion: completion({ choices: [{ finish_reason: reason, message: { content: 'Partial [W1].' } }] }) });
    const response = await h.routes.answer.POST(h.request('answer'));
    assert.equal(response.status, 502);
    const body = await response.json();
    assert.equal(body.code, 'ANSWER_INCOMPLETE');
    assert.equal(body.stage, 'synthesis');
    assert.equal(body.answer, undefined);
    assert.equal(h.settlements.length, 1);
    assert.equal(h.requests.filter(item => item.destination === 'model').length, 1);
  });
}

test('citation: invented IDs, raw URLs, links and images never become clickable evidence', async () => {
  const h = harness({ completion: completion({ choices: [{ finish_reason: 'stop', message: { content: 'Unknown [I99] [W99] https://attacker.example/x ![x](https://attacker.example/a.png)' } }] }) });
  const response = await h.routes.answer.POST(h.request('answer'));
  assert.equal(response.status, 502);
  assert.equal((await response.json()).code, 'CITATION_INVALID');
  const { normalizeKbWebAnswer } = h.load('lib/kbWebAnswer.ts');
  const text = normalizeKbWebAnswer('[I1] [W1] [I99] [W99] [link](https://attacker.example) ![x](https://attacker.example/a.png)', [
    { id: 'I1', origin: 'internal', title: 'A', content: 'A' }, { id: 'W1', origin: 'web', title: 'B', content: 'B' },
  ]);
  assert.match(text, /\[ref_id:0\]/);
  assert.match(text, /\[ref_id:1\]/);
  assert.doesNotMatch(text, /I99|W99|attacker|!\[/);
});

test('empty: no answer and no citable context blocks before bot/auth/reservation', async () => {
  const h = harness();
  const response = await h.routes.answer.POST(h.request('answer', { internalAnswer: '   ', sources: [] }));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, 'KB_CONTEXT_EMPTY');
  assert.deepEqual(h.events, []);
});

test('context: source limits and original trace/reference isolation are explicit', () => {
  const h = harness();
  const { buildKbWebContext } = h.load('lib/kbWebAnswer.ts');
  const references = Array.from({ length: 22 }, (_, index) => ({ id: String(index), type: 'searchIndex', activitySource: 0,
    docKey: `doc-${index}`, sourceData: { title: `Doc ${index}`, content: 'x'.repeat(index === 0 ? 6001 : 12) } }));
  references.unshift({ id: 'meta', type: 'searchIndex', activitySource: 0, sourceData: { title: 'Metadata only', url: 'https://nasa.example' } });
  const response = { response: [{ role: 'assistant', content: [{ type: 'text', text: 'a'.repeat(30001) }] }], activity: [{ id: 0, type: 'searchIndex', elapsedMs: 100 }], references };
  const before = JSON.stringify(response);
  const context = buildKbWebContext(response);
  assert.equal(context.internalAnswer.length, 30000);
  assert.equal(context.sources.length, 20);
  assert.equal(context.sources[0].content.length, 6000);
  assert.deepEqual(plain(context.truncation), { internalAnswer: true, internalSourcesOmitted: 2, internalSourcesTruncated: 1, metadataOnlySources: 1 });
  context.internalReferences[0].sourceData.title = 'Changed';
  context.sources[1].title = 'Changed too';
  assert.equal(JSON.stringify(response), before);
  assert.equal(context.outputKind, 'answer');
  assert.equal(context.usable, true);
});

test('context: extractive-only is usable, metadata-only is empty, answer-only is unverified context', async () => {
  const h = harness();
  const { buildKbWebContext } = h.load('lib/kbWebAnswer.ts');
  const reference = { id: '1', type: 'searchIndex', activitySource: 0, sourceData: { title: 'NASA', content: 'Night lights' } };
  const extractive = buildKbWebContext({ response: [], activity: [], references: [reference] });
  assert.equal(extractive.outputKind, 'extractive');
  assert.equal(extractive.usable, true);
  const empty = buildKbWebContext({ response: [], activity: [], references: [{ ...reference, sourceData: { title: 'NASA' } }] });
  assert.equal(empty.usable, false);
  const response = await h.routes.answer.POST(h.request('answer', { internalAnswer: 'Only answer', sources: [] }));
  const body = await response.json();
  assert.equal(body.kbContextOnly, true);
});

test('parser: rejects forged costs and counts and strips unknown payload fields', async () => {
  const h = harness();
  const { parseWebIqTelemetry } = h.load('lib/webIqTelemetry.ts');
  const body = await (await h.routes.answer.POST(h.request('answer'))).json();
  const valid = body.telemetry;
  assert.ok(parseWebIqTelemetry(valid));
  for (const mutate of [
    v => { v.usage.inputTokens = -1; }, v => { v.usage.inputTokens = 1.5; },
    v => { v.usage.model = 'other'; }, v => { v.cost.extraSynthesisMicroUsd = 0; },
    v => { v.cost.addedKnownMicroUsd = 421000; }, v => { v.cost.pricingProfile = 'unknown'; },
  ]) { const forged = structuredClone(valid); mutate(forged); assert.equal(parseWebIqTelemetry(forged), null); }
  const parsed = parseWebIqTelemetry({ ...valid, reservationId: 'not-allowed', raw: { secret: 'never' } });
  assert.equal(parsed.reservationId, undefined);
  assert.equal(parsed.raw, undefined);
  const timing = parseWebIqTelemetry({ ...valid, timing: { ...valid.timing, webStageWallMs: -1, webRequestWallMs: null } });
  assert.equal(timing.timing.webStageWallMs, null);
  assert.equal(timing.timing.webRequestWallMs, null);
});

(async () => {
  let failures = 0;
  for (const { name, run } of cases) {
    try { await run(); console.log(`PASS ${name}`); } catch (error) { failures++; console.error(`FAIL ${name}`, error); }
  }
  console.log(`${cases.length - failures} passed, ${failures} failed (${cases.length} offline telemetry/context checks).`);
  process.exitCode = failures ? 1 : 0;
})();
