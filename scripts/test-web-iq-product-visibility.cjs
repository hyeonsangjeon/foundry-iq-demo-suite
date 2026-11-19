const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Render product identity and official-link placement without browser effects or network.
const root = path.resolve(__dirname, '..');
const cache = new Map();
let requests = 0;
const icon = props => React.createElement('svg', props);
const button = React.forwardRef(({ children, variant, size, ...props }, ref) => React.createElement('button', { ...props, ref }, children));
function load(relative) {
  if (cache.has(relative)) return cache.get(relative);
  const filename = path.resolve(root, relative);
  const exports = {};
  cache.set(relative, exports);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(compiled, { exports, URL, AbortController, structuredClone,
    fetch: () => { requests++; throw new Error('Unexpected API request during static product rendering'); },
    require: name => {
      if (name === 'react' || name === 'react/jsx-runtime') return require(name);
      if (name === 'next/link') return { default: ({ children, ...props }) => React.createElement('a', props, children) };
      if (name.startsWith('lucide-react')) return name === 'lucide-react' ? { ExternalLink: icon, LoaderCircle: icon, X: icon } : { default: icon };
      if (name === '@/components/ui/button') return { Button: button };
      if (name === '@/components/ui/textarea') return { Textarea: React.forwardRef((props, ref) => React.createElement('textarea', { ...props, ref })) };
      if (name === '@/components/web-iq/web-iq-bot-check') return { WebIqBotCheck: () => null };
      if (name === '@/lib/utils') return { cn: (...values) => values.filter(Boolean).join(' ') };
      if (name === '@/lib/i18n') return { getLocale: () => 'en' };
      if (name.startsWith('@/')) {
        const stem = name.slice(2);
        return load(fs.existsSync(path.join(root, `${stem}.tsx`)) ? `${stem}.tsx` : `${stem}.ts`);
      }
      throw new Error(`Unexpected dependency: ${name}`);
    },
  }, { filename });
  return exports;
}
const references = load('lib/webIqServiceReferences.ts').WEB_IQ_SERVICE_REFERENCES;
const Search = load('components/web-iq/web-iq-live-search.tsx').WebIqLiveSearch;
const Comparison = load('components/web-iq/web-iq-answer-comparison.tsx').WebIqAnswerComparison;
const Browse = load('components/web-iq/web-iq-source-detail.tsx').WebIqSourceDetail;
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
const expanded = html => html.replace(/<details\b[^>]*>[\s\S]*?<\/details>/g, '').replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/g, '');
const text = html => html.replace(/<[^>]*>/g, '');
function visibleLinksBefore(html, features, boundary) {
  const visible = expanded(html);
  const end = visible.indexOf(boundary);
  assert.ok(end >= 0, `Missing content boundary ${boundary}`);
  for (const feature of features) {
    for (const url of [references[feature].overviewUrl, references[feature].featureUrl]) {
      assert.ok(visible.indexOf(url) >= 0 && visible.indexOf(url) < end, `${feature} official link must be visible before controls/results`);
    }
  }
}
function action(html, label) {
  const match = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].find(item => text(item[2]) === label);
  assert.ok(match, `Missing action ${label}`);
  return match[1];
}
const cases = [];
const test = (name, run) => cases.push({ name, run });

test('Web Search identity and official links precede the form; the named paid action stays gated in KO/EN', () => {
  for (const language of ['ko', 'en']) {
    const html = render(Search, { language });
    assert.match(expanded(html), /<h2[^>]*>Microsoft Web IQ · Web Search<\/h2>/);
    visibleLinksBefore(html, ['web-search'], '<form');
    assert.match(action(html, language === 'ko' ? 'Web Search로 검색' : 'Search with Web Search'), /disabled/);
  }
});

test('comparison names Web Search and Microsoft Foundry Models separately before execution and on a KB failure', () => {
  for (const language of ['ko', 'en']) {
    const failed = { runId: 'offline-run', attemptId: 'offline-attempt', state: 'failed', startedAt: '2026-11-14T00:00:00Z',
      selection: { kbId: 'nasa-earth-book', presetId: 'nasa-earth-at-night', query: 'offline fixture', language, settings: {} },
      errorCode: 'KB_RETRIEVAL_FAILED', errorStage: 'kb', errorStatus: 502 };
    for (const run of [null, failed]) {
      const html = render(Comparison, { run, language });
      assert.match(expanded(html), /<h3[^>]*>Microsoft Web IQ · Web Search \+ Microsoft Foundry Models<\/h3>/);
      assert.ok(text(expanded(html)).includes(language === 'ko'
        ? 'Web Search가 관련 페이지를 찾으면 Microsoft Foundry에 배포한 모델이 웹 자료와 지식 베이스 자료를 함께 읽고 두 번째 답변을 작성합니다.'
        : 'Web Search finds relevant pages. A model in Microsoft Foundry combines those pages with the KB material to write the second answer.'));
    }
  }
});

test('completed comparison retains product roles and visible official links before the actual generated answer', () => {
  for (const language of ['ko', 'en']) {
    const webSource = { sourceId: 'W1', title: 'WEB_SOURCE_FIXTURE', url: 'https://science.nasa.gov/earth/', content: 'WEB_PASSAGE_FIXTURE' };
    const run = { runId: 'offline-complete', attemptId: 'offline-attempt', state: 'complete', startedAt: '2026-11-14T00:00:00Z',
      selection: { kbId: 'nasa-earth-book', presetId: 'nasa-earth-at-night', query: 'offline fixture', language, settings: {} },
      internalTraceResponse: { response: [{ role: 'assistant', content: [{ type: 'text', text: 'KB_FIXTURE' }] }], references: [], activity: [] },
      combined: { answer: 'ADDITIONAL_ANSWER_FIXTURE', sources: [{ ...webSource, id: 'W1', origin: 'web' }], webSearch: { query: 'offline fixture', results: [webSource], retrievedAt: '2026-11-14T00:00:00Z' }, trace: { webSearchMs: 1, synthesisMs: 1 } } };
    const html = render(Comparison, { run, language });
    visibleLinksBefore(html, ['web-search', 'answer-synthesis'], 'ADDITIONAL_ANSWER_FIXTURE');
    assert.ok(expanded(html).includes('KB_FIXTURE'));
    action(html, language === 'ko' ? '관련 본문 확인' : 'Inspect relevant passage');
    const original = language === 'ko' ? '원문 열기' : 'Open original page';
    const originalLink = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].find(item => text(item[2]).startsWith(original));
    assert.ok(originalLink?.[1].includes(`href="${webSource.url}"`));
    assert.match(originalLink[1], /target="_blank" rel="noopener noreferrer"/);
  }
});

test('Browse dialog identifies the product and puts official docs before the separately gated passage request', () => {
  for (const language of ['ko', 'en']) {
    const html = render(Browse, { language, query: 'offline fixture', source: { title: 'SOURCE_FIXTURE', content: 'SEARCH_SNIPPET_FIXTURE',
      url: 'https://science.nasa.gov/earth/', sourceId: 'W1', sourceTicket: 'offline-ticket' } });
    assert.match(expanded(html), /<h2[^>]*>Microsoft Web IQ · Browse<\/h2>/);
    const label = language === 'ko' ? '관련 본문 확인' : 'Inspect relevant passage';
    visibleLinksBefore(html, ['browse-passage'], label);
    assert.match(action(html, label), /disabled/);
    const original = language === 'ko' ? '원문 열기' : 'Open original page';
    assert.ok(html.includes(`href="https://science.nasa.gov/earth/" target="_blank" rel="noopener noreferrer">${original}`));
    assert.ok(html.includes(language === 'ko' ? 'URL이 색인에 없을 때만 새 수집을 요청' : 'only when the URL is missing from the index'));
    assert.ok(expanded(html).includes('SEARCH_SNIPPET_FIXTURE'));
  }
});

let failures = 0;
for (const { name, run } of cases) {
  try { run(); console.log(`PASS ${name}`); } catch (error) { failures++; console.error(`FAIL ${name}`, error); }
}
assert.equal(requests, 0, 'Static product rendering must not submit API requests');
console.log(`${cases.length - failures} passed, ${failures} failed (${cases.length} offline product checks; API requests0).`);
process.exitCode = failures ? 1 : 0;
