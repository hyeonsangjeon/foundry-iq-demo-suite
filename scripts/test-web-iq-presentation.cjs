const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');

// Presentation-only regression checks: no credential files, browser, or network.
const root = path.resolve(__dirname, '..');
const cases = [];
const test = (name, run) => cases.push({ name, run });
const plain = value => JSON.parse(JSON.stringify(value));

function modules({ interactive = false } = {}) {
  const cache = new Map();
  let query = new URLSearchParams();
  const replacements = [];
  const stopped = [];
  let stateIndex = 0;
  const hooks = interactive ? {
    ...React,
    useState: initial => {
      const index = stateIndex++;
      return [initial, next => { if (index === 1) stopped.push(next); }];
    },
    useMemo: run => run(), useCallback: run => run, useEffect: () => {},
  } : React;
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename);
    const exports = {};
    cache.set(filename, exports);
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    vm.runInNewContext(compiled, {
      exports, URLSearchParams,
      require: name => {
        if (name === 'react') return hooks;
        if (name === 'react/jsx-runtime') return require(name);
        if (name === 'next/navigation') return {
          usePathname: () => '/web-iq', useSearchParams: () => query,
          useRouter: () => ({ replace: url => replacements.push(url) }),
        };
        if (name === 'next/image') return props => React.createElement('img', { src: props.src, alt: props.alt });
        if (name === 'next/link') return props => React.createElement('a', { href: props.href }, props.children);
        if (name.startsWith('lucide-react/')) return () => React.createElement('span');
        if (name === '@/components/ui/button') return { Button: ({ children, variant, size, ...props }) => React.createElement('button', props, children) };
        if (name === '@/lib/utils') return { cn: (...items) => items.filter(Boolean).join(' ') };
        if (name === '@/lib/i18n') return { getLocale: () => 'en' };
        if (name.startsWith('@/components/web-iq/') && !/web-iq-(presentation|speaker-notes)$/.test(name)) {
          return new Proxy({}, { get: () => () => React.createElement('div') });
        }
        if (name.startsWith('@/')) {
          const file = name.slice(2);
          return load(fs.existsSync(path.join(root, `${file}.tsx`)) ? `${file}.tsx` : `${file}.ts`);
        }
        throw new Error(`Unexpected presentation dependency: ${name}`);
      },
    }, { filename });
    return exports;
  }
  return {
    load, replacements, stopped,
    setQuery: value => { query = new URLSearchParams(value); stateIndex = 0; },
  };
}

function elements(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(item => elements(item, predicate));
  if (!React.isValidElement(node)) return [];
  return [...(predicate(node) ? [node] : []), ...elements(node.props.children, predicate)];
}

const h = modules();
const presentation = h.load('components/web-iq/web-iq-presentation.ts');
const { WEB_IQ_PRESENTATION_STAGES: stages } = presentation;
const { WebIqSpeakerNotes } = h.load('components/web-iq/web-iq-speaker-notes.tsx');
const { WebIqDemo } = h.load('components/web-iq/web-iq-demo.tsx');

test('all six stages retain paired scripts, the 90-second story, and the fictional stock records', () => {
  assert.deepEqual(plain(stages.map(stage => stage.id)), [1, 2, 3, 4, 5, 6]);
  assert.equal(presentation.WEB_IQ_PRESENTATION_DURATION, 90);
  assert.equal(new Set(stages.map(stage => stage.narration.ko)).size, 6);
  assert.equal(new Set(stages.map(stage => stage.narration.en)).size, 6);
  for (const stage of stages) {
    assert.ok(stage.narration.ko.length > 20);
    assert.ok(stage.narration.en.length > 20);
  }
  assert.deepEqual(plain(h.load('lib/webIqScenario.ts').WEB_IQ_SHIPMENTS.map(item => [item.id, item.stockDays])), [['A', 4], ['B', 20], ['C', 12]]);
  assert.match(stages[4].narration.en, /approval before booking/);
  assert.match(stages[5].narration.ko, /책임자 승인을 받아야/);
});

test('manual and playback stage updates replace stale internal-only comparison mode', () => {
  for (let index = 0; index < 6; index++) {
    const params = new URLSearchParams('sources=internal&comparison=manual&signal=unrelated');
    for (const [key, value] of Object.entries(presentation.webIqPresentationStageUpdate(index))) params.set(key, value);
    assert.equal(params.get('scene'), String(index));
    assert.equal(params.get('sources'), index < 2 ? 'internal' : 'web');
    assert.equal(params.get('signal'), 'closure');
    assert.equal(params.get('comparison'), 'guided');
  }
});

test('material toggles select a compatible stage instead of overriding later-stage scripts', () => {
  assert.equal(presentation.webIqPresentationSourceUpdate(5, false).scene, '1');
  assert.equal(presentation.webIqPresentationSourceUpdate(1, true).scene, '2');
  assert.equal(presentation.webIqPresentationSourceUpdate(4, true).scene, '4');
  assert.equal(presentation.webIqPresentationSourceUpdate(0, false).scene, '0');
});

test('all six stage buttons render above the scene, including buttons 4, 5, and 6', () => {
  h.setQuery('view=executive&scene=1&sources=internal&comparison=manual');
  const html = renderToStaticMarkup(React.createElement(WebIqDemo));
  const nav = html.match(/<nav aria-label="Walkthrough stages">([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(nav);
  assert.equal((nav.match(/aria-controls="web-iq-walkthrough"/g) || []).length, 6);
  for (const stage of stages) assert.ok(nav.includes(stage.label.en));
  assert.ok(html.indexOf('<nav') < html.indexOf('id="web-iq-walkthrough"'));
});

test('stale internal-only URL cannot replace stage 5 content with the stage 2 script', () => {
  h.setQuery('view=executive&scene=4&sources=internal&comparison=manual');
  const html = renderToStaticMarkup(React.createElement(WebIqDemo));
  const hero = html.match(/<section id="web-iq-walkthrough"([\s\S]*?)<\/section>/)?.[1];
  assert.ok(hero.includes(stages[4].title.en));
  assert.ok(hero.includes(stages[4].narration.en));
  assert.ok(!hero.includes(stages[1].narration.en));
});

test('each of six notes buttons shows only the selected Korean and English script', () => {
  for (let selected = 0; selected < stages.length; selected++) {
    const html = renderToStaticMarkup(React.createElement(WebIqSpeakerNotes, { language: 'ko', stageIndex: selected, onSelectStage: () => {} }));
    assert.equal((html.match(/aria-controls="web-iq-selected-script"/g) || []).length, 6);
    assert.equal((html.match(/aria-pressed="true"/g) || []).length, 1);
    assert.equal((html.match(/<p lang="ko"/g) || []).length, 1);
    assert.equal((html.match(/<p lang="en"/g) || []).length, 1);
    assert.ok(!html.includes('<select'));
    for (let index = 0; index < stages.length; index++) {
      assert.equal(html.includes(stages[index].narration.ko), index === selected);
      assert.equal(html.includes(stages[index].narration.en), index === selected);
    }
  }
});

test('stage buttons, notes buttons, playback, and material toggles use the same URL transition', () => {
  const interaction = modules({ interactive: true });
  interaction.setQuery('view=executive&scene=1&sources=internal&comparison=manual');
  const tree = interaction.load('components/web-iq/web-iq-demo.tsx').WebIqDemo();
  const stageButtons = elements(tree, item => item.props['aria-controls'] === 'web-iq-walkthrough');
  stageButtons[4].props.onClick();
  const stageUrl = interaction.replacements.at(-1);
  const notes = elements(tree, item => item.props.onSelectStage)[0];
  const notesTree = interaction.load('components/web-iq/web-iq-speaker-notes.tsx').WebIqSpeakerNotes(notes.props);
  const notesButtons = elements(notesTree, item => item.props['aria-controls'] === 'web-iq-selected-script');
  notesButtons[4].props.onClick();
  assert.equal(interaction.replacements.at(-1), stageUrl);
  const play = elements(tree, item => Array.isArray(item.props.children) && item.props.children.includes('Play 90s walkthrough'))[0];
  play.props.onClick();
  assert.equal(new URL(interaction.replacements.at(-1), 'https://offline.example').searchParams.get('scene'), '1');
  const webMaterial = elements(tree, item => item.props['aria-pressed'] !== undefined && item.props.children === 'Internal records + web notice')[0];
  webMaterial.props.onClick();
  const materialUrl = new URL(interaction.replacements.at(-1), 'https://offline.example');
  assert.equal(materialUrl.searchParams.get('scene'), '2');
  assert.equal(materialUrl.searchParams.get('sources'), 'web');
  assert.ok(interaction.stopped.filter(value => value === false).length >= 3);
});

let failures = 0;
for (const { name, run } of cases) {
  try { run(); console.log(`PASS ${name}`); } catch (error) { failures++; console.error(`FAIL ${name}`, error); }
}
console.log(`${cases.length - failures} passed, ${failures} failed (${cases.length} offline presentation checks).`);
process.exitCode = failures ? 1 : 0;
