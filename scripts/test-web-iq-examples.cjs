const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Public-example pairing and rendered setup checks. All API/controller work is mocked.
const root = path.resolve(__dirname, '..');
const cases = [];
const test = (name, run) => cases.push({ name, run });
const plain = value => JSON.parse(JSON.stringify(value));
const flush = () => new Promise(resolve => setImmediate(resolve));
const jsx = (type, props) => ({ type, props: props || {} });
function compile(relative, requireModule, globals = {}) {
  const filename = path.resolve(root, relative);
  const exports = {};
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(compiled, { exports, require: requireModule, ...globals }, { filename });
  return exports;
}
const noDependency = name => { throw new Error(`Unexpected dependency: ${name}`); };
const questions = compile('lib/webIqDemoQuestions.ts', noDependency);
const kbAdapter = compile('lib/kbWebAnswer.ts', noDependency);
const nasaQuestion = questions.WEB_IQ_DEMO_QUESTIONS.find(item => item.id === 'nasa-earth-at-night');
const nasaKb = { name: 'nasa-earth-book', outputMode: 'answerSynthesis', retrievalReasoningEffort: { kind: 'medium' },
  knowledgeSources: [{ name: 'nasa-earth-book-source', alwaysQuerySource: false, rerankerThreshold: 0 }] };
const unrelatedKb = { name: 'accel-live-combined-kb', description: 'Unverified material', knowledgeSources: [] };
function elements(tree) {
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...[].concat(tree.props?.children || []).flatMap(elements)];
}
function text(tree) {
  if (typeof tree === 'string' || typeof tree === 'number') return String(tree);
  if (!tree || typeof tree !== 'object') return '';
  return [].concat(tree.props?.children || []).map(text).join(' ');
}
function workspace({ knowledgeBases = [unrelatedKb, nasaKb], listFails = false, language = 'en' } = {}) {
  const slots = [];
  let index = 0;
  let queuedEffects = [];
  const calls = { starts: [], retries: [], readiness: 0 };
  const comparison = { run: null, clear() {}, cancel() {},
    async startComparison(...args) { calls.starts.push(args); },
    async retryWeb(...args) { calls.retries.push(args); } };
  const react = {
    useState(initial) {
      const slot = index++;
      if (!(slot in slots)) slots[slot] = typeof initial === 'function' ? initial() : initial;
      return [slots[slot], value => { slots[slot] = typeof value === 'function' ? value(slots[slot]) : value; }];
    },
    useRef(initial) {
      const slot = index++;
      if (!(slot in slots)) slots[slot] = { current: initial };
      return slots[slot];
    },
    useCallback(callback, dependencies) {
      const slot = index++;
      const previous = slots[slot];
      if (!previous || dependencies.some((value, i) => value !== previous.dependencies[i])) slots[slot] = { dependencies, callback };
      return slots[slot].callback;
    },
    useEffect(callback, dependencies) {
      const slot = index++;
      const previous = slots[slot];
      if (!previous || dependencies.some((value, i) => value !== previous.dependencies[i])) {
        queuedEffects.push(() => { previous?.cleanup?.(); slots[slot] = { dependencies, cleanup: callback() }; });
      }
    },
  };
  class MockComparisonError extends Error {}
  const imports = {
    react,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '@/components/ui/button': { Button: 'button' },
    '@/components/web-iq/web-iq-bot-check': { WebIqBotCheck: 'bot-check' },
    '@/components/web-iq/web-iq-answer-comparison': { WebIqAnswerComparison: 'comparison', comparisonErrorText: code => code },
    '@/components/web-iq/web-iq-service-links': { WebIqServiceLinks: 'service-links' },
    '@/components/web-iq/use-web-iq-comparison': { useWebIqComparison: () => comparison },
    '@/lib/api': {
      async fetchKnowledgeBases() { if (listFails) throw new Error('offline inaccessible KB list'); return { value: knowledgeBases }; },
      async fetchKnowledgeSources() { return { value: [{ name: 'nasa-earth-book-source', kind: 'searchIndex' }] }; },
    },
    '@/lib/kbWebAnswer': kbAdapter,
    '@/lib/webIqDemoQuestions': questions,
    '@/lib/webIqComparison': {
      WebIqComparisonError: MockComparisonError,
      async checkWebIqAnswerReadiness() { calls.readiness++; return { configured: true }; },
    },
  };
  const Component = compile('components/web-iq/web-iq-comparison-workspace.tsx', name => {
    if (!(name in imports)) throw new Error(`Unexpected workspace dependency: ${name}`);
    return imports[name];
  }, {
    AbortController, Date, window: { setInterval, clearInterval },
    fetch: async url => { assert.equal(url, '/api/web-iq/answer'); return { ok: true, json: async () => ({ configured: true, botProtectionConfigured: true, turnstileSiteKey: 'offline-site-key' }) }; },
  }).WebIqComparisonWorkspace;
  let tree;
  function render() { index = 0; tree = Component({ language, onWebSearch() {} }); return tree; }
  async function settle() {
    for (let i = 0; i < 4; i++) {
      render();
      const effects = queuedEffects; queuedEffects = [];
      effects.forEach(effect => effect());
      await flush();
    }
    return render();
  }
  return { calls, settle, get tree() { return tree; },
    token() { elements(tree).find(item => item.type === 'bot-check').props.onTokenChange('offline-fresh-token'); render(); },
    compare() { return elements(tree).find(item => item.type === 'button' && text(item).includes(language === 'ko' ? '두 답변 비교' : 'Compare answers')); },
  };
}

test('public comparison exposes only the verified NASA pair; server question allowlist remains unchanged', () => {
  assert.deepEqual(plain(questions.WEB_IQ_COMPARISON_EXAMPLES), [{ questionId: 'nasa-earth-at-night', kbId: 'nasa-earth-book' }]);
  assert.deepEqual(plain(questions.WEB_IQ_DEMO_QUESTIONS.map(item => item.id)), ['port-road-notices', 'incheon-port-notices', 'nasa-earth-at-night']);
  for (const question of questions.WEB_IQ_DEMO_QUESTIONS) {
    assert.equal(questions.isAllowedWebIqQuestion(question.ko), true);
    assert.equal(questions.isAllowedWebIqQuestion(question.en), true);
  }
});

test('pair resolver selects exact verified KB regardless of unrelated catalog ordering', () => {
  const result = questions.resolveWebIqComparisonExample('nasa-earth-at-night', Object.freeze([unrelatedKb, nasaKb]));
  assert.equal(result.kb, nasaKb);
  assert.equal(result.question, nasaQuestion);
  for (const id of ['port-road-notices', 'incheon-port-notices', 'unknown']) {
    assert.equal(questions.resolveWebIqComparisonExample(id, [nasaKb, unrelatedKb]), null);
  }
});

test('missing or merely similar KB names never substitute for the verified source', () => {
  for (const name of ['accel-live-combined-kb', 'NASA-earth-book', 'nasa-earth-book-copy', 'nasa-earth-book ']) {
    assert.equal(questions.resolveWebIqComparisonExample('nasa-earth-at-night', [{ name }]), null);
  }
  assert.equal(questions.resolveWebIqComparisonExample('nasa-earth-at-night', []), null);
});

test('rendered KO/EN example setup has one NASA question and no independent KB selector', async () => {
  for (const language of ['ko', 'en']) {
    const ui = workspace({ language }); await ui.settle();
    const selects = elements(ui.tree).filter(item => item.type === 'select');
    assert.equal(selects.length, 1);
    const options = elements(selects[0]).filter(item => item.type === 'option');
    assert.equal(options.length, 1);
    assert.equal(options[0].props.value, nasaQuestion.id);
    assert.equal(text(options[0]), nasaQuestion[language]);
    assert.ok(text(ui.tree).includes(language === 'ko' ? '예시 질문' : 'Example question'));
    assert.equal(text(ui.tree).includes(unrelatedKb.name), false);
  }
});

test('running the NASA example passes its paired KB, same localized question and citable-source flags', async () => {
  for (const language of ['ko', 'en']) {
    const ui = workspace({ language }); await ui.settle(); ui.token();
    assert.equal(ui.compare().props.disabled, false);
    ui.compare().props.onClick(); await ui.settle();
    assert.equal(ui.calls.readiness, 1);
    assert.equal(ui.calls.starts.length, 1);
    const [selection, token] = ui.calls.starts[0];
    assert.equal(selection.kbId, nasaKb.name);
    assert.equal(selection.query, nasaQuestion[language]);
    assert.equal(selection.language, language);
    assert.equal(token, 'offline-fresh-token');
    assert.deepEqual(plain(selection.settings.knowledgeSourceParams), [{ knowledgeSourceName: 'nasa-earth-book-source', kind: 'searchIndex',
      includeReferences: true, includeReferenceSourceData: true, alwaysQuerySource: false, rerankerThreshold: 0 }]);
  }
});

test('NASA missing blocks even a direct handler call with a valid token; no other KB is queried', async () => {
  const ui = workspace({ knowledgeBases: [unrelatedKb] }); await ui.settle(); ui.token();
  assert.equal(ui.compare().props.disabled, true);
  assert.ok(text(ui.tree).includes('not available in the current KB list'));
  ui.compare().props.onClick(); await ui.settle();
  assert.equal(ui.calls.readiness, 0);
  assert.equal(ui.calls.starts.length, 0);
});

test('inaccessible or malformed KB catalog disables the example without a silent fallback', async () => {
  for (const fixture of [{ listFails: true }, { knowledgeBases: { name: 'nasa-earth-book' } }]) {
    const ui = workspace(fixture); await ui.settle(); ui.token();
    assert.equal(ui.compare().props.disabled, true);
    assert.ok(text(ui.tree).includes('Could not load the existing KB list'));
    ui.compare().props.onClick(); await ui.settle();
    assert.equal(ui.calls.starts.length, 0);
    assert.equal(ui.calls.readiness, 0);
  }
});

(async () => {
  let failures = 0;
  for (const { name, run } of cases) {
    try { await run(); console.log(`PASS ${name}`); } catch (error) { failures++; console.error(`FAIL ${name}`, error); }
  }
  console.log(`${cases.length - failures} passed, ${failures} failed (${cases.length} offline example checks).`);
  process.exitCode = failures ? 1 : 0;
})();
