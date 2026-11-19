const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Exercise the real card and its shared search hook. No browser tokens or remote services.
const root = path.join(__dirname, '..', 'components', 'web-iq');
const compile = name => ts.transpileModule(fs.readFileSync(path.join(root, name), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText;
const cardCode = compile('web-iq-weather-search-card.tsx');
const hookCode = compile('use-web-iq-search.ts');
const initial = { configured: true, botProtectionConfigured: true, turnstileSiteKey: 'offline-site' };
const question = 'current weather in Incheon';
const reply = (body, status = 200) => ({ ok: status === 200, status, headers: new Headers(), json: async () => body });
const Button = ({ variant, size, ...props }) => React.createElement('button', props);
const Bot = () => null;
function find(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => find(child, predicate));
  if (!React.isValidElement(node)) return [];
  return [...(predicate(node) ? [node] : []), ...find(node.props.children, predicate)];
}

function setup(readiness = initial, language = 'en') {
  let cursor = 0, tree, disposed = false, lateUpdates = 0;
  const slots = [], effects = [], calls = [];
  const same = (a,b) => !!a && a.length === b.length && a.every((v,i) => Object.is(v,b[i]));
  const hooks = {
    ...React, useId: () => 'weather-search',
    useState(value) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { value };
      return [slots[index].value, next => {
        if (disposed) { lateUpdates++; return; }
        slots[index].value = typeof next === 'function' ? next(slots[index].value) : next;
      }];
    },
    useRef(value) { const index = cursor++; return slots[index] ||= { current: value }; },
    useCallback(fn, deps) {
      const index = cursor++;
      if (!same(slots[index]?.deps, deps)) slots[index] = { fn, deps };
      return slots[index].fn;
    },
    useEffect(fn, deps) {
      const index = cursor++;
      if (same(slots[index]?.deps, deps)) return;
      const previous = slots[index]?.cleanup;
      slots[index] = { deps };
      effects.push(() => { previous?.(); slots[index].cleanup = fn(); });
    },
  };
  let searchHook;
  const load = code => {
    const exports = {};
    vm.runInNewContext(code, { exports, URL, AbortController, window: { setTimeout, clearTimeout, setInterval, clearInterval },
      fetch(url, init) {
        assert.equal(url, '/api/web-iq/search');
        if (!init.method) { calls.push({ method: 'GET' }); return Promise.resolve(reply(readiness)); }
        assert.equal(init.method, 'POST');
        return new Promise(resolve => calls.push({ method: 'POST', init, resolve }));
      },
      require(name) {
        if (name === 'react') return hooks;
        if (name === 'react/jsx-runtime') return require(name);
        if (name.endsWith('/ui/button')) return { Button };
        if (name.endsWith('/web-iq-bot-check')) return { WebIqBotCheck: Bot };
        if (name.endsWith('/use-web-iq-search')) return searchHook;
        throw Error('Unexpected module ' + name);
      },
    });
    return exports;
  };
  searchHook = load(hookCode);
  const { WebIqWeatherSearchCard } = load(cardCode);
  function render(locale = language) {
    language = locale; cursor = 0;
    tree = WebIqWeatherSearchCard({ question, language });
    while (effects.length) effects.shift()();
  }
  render();
  const action = () => find(tree, n => n.type === Button && n.props['aria-describedby'])[0];
  const bot = () => find(tree, n => n.type === Bot)[0];
  return {
    render, calls, action, bot, html: () => renderToStaticMarkup(tree),
    async flush() { await new Promise(resolve => setImmediate(resolve)); render(); },
    token() { assert.equal(bot().props.action, 'webiq_search'); bot().props.onTokenChange('offline-token'); render(); },
    click(detail = 1) { action().props.onClick({detail}); },
    unmount() { for (const slot of slots) slot.cleanup?.(); disposed = true; },
    lateUpdates: () => lateUpdates,
  };
}

const cases = [];
function test(name, run) { cases.push({name, run}); }
test('KO/EN examples and action are visible before readiness; mount only checks configuration', async () => {
  for (const language of ['ko','en']) {
    const h = setup(initial, language); await h.flush();
    const html = h.html(), label = language === 'ko' ? 'Web Search로 문서 찾기' : 'Find pages with Web Search';
    assert.match(html, language === 'ko' ? /읽을 수 있는 날씨 문서/ : /Weather pages to read/);
    assert.ok(html.indexOf(label) < html.indexOf('www.weather.go.kr'));
    assert.match(html, language === 'ko' ? /검색 결과 예시/ : /Example search result/);
    assert.equal(h.action().props.disabled,true); assert.equal(h.calls.length,1);
    h.click(); assert.equal(h.calls.length,1); h.unmount();
  }
});
test('an unconfigured service or missing bot protection leaves only the example and a disabled action', async () => {
  const h=setup({...initial,botProtectionConfigured:false}); await h.flush();
  assert.equal(h.bot(),undefined); assert.equal(h.action().props.disabled,true); assert.match(h.html(), /Live search is unavailable/);
  assert.equal(h.calls.length,1); h.unmount();
});
test('mouse double-click / keyboard uses the same one-time token, paid route and shared weather query', async () => {
  const h=setup(); await h.flush(); h.token();
  h.click(0); h.click(1); h.click(2);
  const post=h.calls.at(-1);
  assert.equal(h.calls.filter(c=>c.method==='POST').length,1);
  assert.deepEqual(JSON.parse(post.init.body),{query:question,turnstileToken:'offline-token'});
  const item={url:'https://example.org/forecast',title:'OFFLINE_RESULT',content:'Returned weather passage'};
  post.resolve(reply({query:question,retrievedAt:'2026-11-19T00:00:00Z',results:[item,
    {...item,url:'https://example.org/news',title:'Second page'},
    {...item,url:'javascript:alert(1)',title:'Unsafe fixture'}]}));
  await h.flush(); const html=h.html();
  assert.match(html,/Live Web Search results/); assert.match(html,/OFFLINE_RESULT/); assert.match(html,/Returned weather passage/);
  assert.match(html,/href="https:\/\/example.org\/forecast"/); assert.match(html,/<details><summary[^>]*>More pages \(1\)/);
  assert.doesNotMatch(html,/Unsafe fixture|www\.weather\.go\.kr/); assert.equal(h.action().props.disabled,true);
  h.token(); h.click(2); assert.equal(h.calls.length,2);
  h.click(1); assert.equal(h.calls.length,3); h.calls.at(-1).resolve(reply({query:question,retrievedAt:'now',results:[]}));
  await h.flush(); assert.match(h.html(),/No pages found/); h.unmount();
});
test('expired verification and shared allowance surface server messages without a second POST', async () => {
  for (const [code, status, message] of [['BOT_CHECK_FAILED',403,/verify again/i],['DAILY_BUDGET_EXHAUSTED',429,/midnight Korea time/]]) {
    const h=setup(); await h.flush(); h.token(); h.click(); h.calls.at(-1).resolve(reply({code},status));
    await h.flush(); assert.match(h.html(),message); assert.equal(h.action().props.disabled,true);
    assert.equal(h.calls.length,2); h.unmount();
  }
});
test('language change and unmount abort requests and discard late results', async () => {
  const h=setup(); await h.flush(); h.token(); h.click(); const first=h.calls.at(-1);
  h.render('ko'); assert.equal(first.init.signal.aborted,true);
  first.resolve(reply({query:question,retrievedAt:'now',results:[{url:'https://example.org',title:'STALE',content:'stale'}]}));
  await h.flush(); assert.doesNotMatch(h.html(),/STALE/); assert.match(h.html(),/검색 결과 예시/);
  h.token(); h.click(); const last=h.calls.at(-1); h.unmount(); assert.equal(last.init.signal.aborted,true);
  last.resolve(reply({query:question,retrievedAt:'now',results:[]})); await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.lateUpdates(),0);
});
(async () => {
  for (const {name,run} of cases) { await run(); console.log('PASS',name); }
  console.log(cases.length + ' offline weather-search card checks passed.');
})().catch(error=>{ console.error(error); process.exitCode=1; });
