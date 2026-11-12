const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Offline inventory: validates official destinations and nearby module placement.
// Public-document HTTP checks are stored metadata; no API or document is fetched here.
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'lib/webIqServiceReferences.ts'), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const moduleObject = { exports: {} };
vm.runInNewContext(output, { exports: moduleObject.exports, module: moduleObject });
const { SERVICE_DOCUMENT_URLS: urls, SERVICE_DOCUMENT_CHECKS: checks, WEB_IQ_SERVICE_REFERENCES: references, serviceFeaturesForSource } = moduleObject.exports;
let count = 0;
function check(name, action) {
  action();
  count += 1;
  process.stdout.write(`PASS ${name}\n`);
}
const officialHosts = new Set(['learn.microsoft.com', 'azure.microsoft.com', 'developers.cloudflare.com', 'aka.ms']);
for (const [id, rawUrl] of Object.entries(urls)) {
  check(`${id} official URL and recorded public-document result`, () => {
    const url = new URL(rawUrl);
    assert.equal(url.protocol, 'https:');
    assert(officialHosts.has(url.hostname));
    assert(!url.username && !url.password);
    assert.equal(checks[id].httpStatus, 200);
    assert(checks[id].title.length > 3);
    assert.equal(checks[id].checkedAt, '2026-11-12');
  });
}
for (const [id, record] of Object.entries(references)) {
  check(`${id} has overview, feature, role and scoped status`, () => {
    assert(Object.values(urls).includes(record.overviewUrl));
    assert(Object.values(urls).includes(record.featureUrl));
    assert(record.role.en && record.role.ko);
    assert(record.productStatus.en && record.productStatus.ko);
    assert(record.sourceIds.length >= 2);
    if (record.provider === 'Cloudflare') assert.equal(record.serviceId, 'cloudflare-turnstile');
  });
}
check('native web source remains distinct from separate Web IQ calls', () => {
  assert.deepEqual(Array.from(serviceFeaturesForSource('web')), ['web-source']);
  assert.notEqual(references['web-source'].featureUrl, references['web-search'].featureUrl);
});
check('source kinds select their own official feature contract', () => {
  for (const kind of ['searchIndex', 'azureBlob', 'web', 'indexedOneLake', 'fabricOntology', 'remoteSharePoint', 'indexedSharePoint', 'ingestedSharePoint', 'mcpServer', 'mcpTool']) {
    const features = Array.from(serviceFeaturesForSource(kind));
    assert(features.length > 0);
    features.forEach(feature => assert(references[feature]));
  }
  assert.notDeepEqual(Array.from(serviceFeaturesForSource('remoteSharePoint')), Array.from(serviceFeaturesForSource('indexedSharePoint')));
});

const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const componentPath = path.join(root, 'components/web-iq/web-iq-service-links.tsx');
const componentOutput = ts.transpileModule(fs.readFileSync(componentPath, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const componentModule = { exports: {} };
vm.runInNewContext(componentOutput, {
  exports: componentModule.exports,
  module: componentModule,
  require: name => {
    if (name === '@/lib/i18n') return { getLocale: () => 'en' };
    if (name === '@/lib/utils') return { cn: (...args) => args.filter(Boolean).join(' ') };
    if (name === '@/lib/webIqServiceReferences') return moduleObject.exports;
    return require(name);
  },
});
for (const language of ['en', 'ko']) {
  for (const feature of Object.keys(references)) {
    check(`${language} ${feature}: overview and feature links render before details`, () => {
      const html = renderToStaticMarkup(React.createElement(componentModule.exports.WebIqServiceLinks, { features: [feature], locale: language }));
      const visible = html.slice(0, html.indexOf('<details'));
      assert(visible.includes(language === 'ko' ? '서비스 소개' : 'Service overview'));
      assert(visible.includes(language === 'ko' ? '기능 문서' : 'Feature docs'));
      assert(visible.includes('target="_blank" rel="noopener noreferrer"'));
      assert(visible.includes(references[feature].role[language]));
    });
  }
}

// Every row in vault 05 §6 has a concrete UI module. Redirect-only aliases are
// represented by their target. Controller/UI tests cover actual runtime behavior.
const placements = [
  ['/web-iq Executive', 'components/web-iq/web-iq-demo.tsx'],
  ['/web-iq Tech Search', 'components/web-iq/web-iq-live-search.tsx'],
  ['/web-iq D02 comparison', 'components/web-iq/web-iq-answer-comparison.tsx'],
  ['/web-iq D01 Browse', 'components/web-iq/web-iq-source-detail.tsx'],
  ['/web-iq Auto off', 'components/web-iq/web-iq-demo.tsx'],
  ['Browser verification', 'components/web-iq/web-iq-bot-check.tsx'],
  ['/', 'components/landing-page.tsx'],
  ['/', 'components/web-iq/web-iq-card.tsx'],
  ['/', 'components/fabric-iq-ks/fabric-iq-ks-card.tsx'],
  ['/', 'components/mcp-ks/mcp-ks-card.tsx'],
  ['/what-is-foundry-iq', 'app/what-is-foundry-iq/page.tsx'],
  ['/architecture', 'app/architecture/page.tsx'],
  ['/test KB selection', 'components/industry-knowledge-selector.tsx'],
  ['/test KB query', 'components/kb-playground-view.tsx'],
  ['/playground + /playground/[agentId] redirect', 'components/playground-view.tsx'],
  ['/knowledge + /knowledge-bases redirect', 'app/knowledge/page.tsx'],
  ['/knowledge-bases/[id]', 'app/knowledge-bases/[id]/page.tsx'],
  ['/knowledge-sources', 'components/knowledge-source-card.tsx'],
  ['/knowledge-sources/quick-create', 'app/knowledge-sources/quick-create/page.tsx'],
  ['/knowledge/create', 'app/knowledge/create/page.tsx'],
  ['/knowledge/[id] redirect + edit', 'app/knowledge/[id]/edit/page.tsx'],
  ['Create KB source picker', 'components/forms/create-knowledge-base-form.tsx'],
  ['Edit KB source picker', 'components/forms/edit-knowledge-base-form.tsx'],
  ['/sharepoint', 'components/sp-demo-hub.tsx'],
  ['/guides/sharepoint', 'app/guides/sharepoint/page.tsx'],
  ['/mcp-ks', 'components/mcp-ks/mcp-knowledge-source-demo.tsx'],
  ['/guides/mcp-server', 'app/guides/mcp-server/page.tsx'],
  ['/fabric-iq-ks', 'components/fabric-iq-ks/fabric-iq-ks-landing.tsx'],
  ['/guides/fabric-iq-ontology', 'app/guides/fabric-iq-ontology/page.tsx'],
  ['/guides', 'app/guides/page.tsx'],
  ['/guides/search-index', 'app/guides/search-index/page.tsx'],
  ['/scenario', 'app/scenario/page.tsx'],
  ['/semantic-join', 'app/semantic-join/page.tsx'],
  ['/agents', 'app/agents/page.tsx'],
  ['/agent-builder', 'app/agent-builder/page.tsx'],
];
for (const [route, filename] of placements) {
  check(`${route}: nearby product-link module`, () => {
    const code = fs.readFileSync(path.join(root, filename), 'utf8');
    assert(code.includes('WebIqServiceLinks'), `${filename} missing its product-link module`);
  });
}
check('product links are visible, safe external anchors separate from citations', () => {
  const code = fs.readFileSync(path.join(root, 'components/web-iq/web-iq-service-links.tsx'), 'utf8');
  const beforeDetails = code.slice(0, code.indexOf('<details'));
  assert(beforeDetails.includes('item.overviewUrl'));
  assert(beforeDetails.includes('item.featureUrl'));
  assert(code.includes('rel="noopener noreferrer"'));
  assert(!code.includes('ref_id:'));
  assert(!code.includes('fetch('));
});
process.stdout.write(`${count} offline service-link checks passed.\n`);
