const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Hook-level interaction fixtures only: no browser, credentials, or provider network.
const root = path.resolve(__dirname, '..');
function sourceModule(relative, dependencies = {}) {
  const filename = path.join(root, relative);
  const exports = {};
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(compiled, { exports, URL, require: name => {
    if (name === 'react/jsx-runtime') return require(name);
    if (name in dependencies) return dependencies[name];
    throw new Error(`Unexpected fixture dependency: ${name}`);
  } }, { filename });
  return exports;
}
const autoContract = sourceModule('lib/webIqAuto.ts');
const timeZoneContract = sourceModule('lib/webIqAutoTimeZone.ts');
const serviceReferences = sourceModule('lib/webIqServiceReferences.ts');
const { WebIqAutoTimeZone } = sourceModule('components/web-iq/web-iq-auto-time-zone.tsx', {
  '@/lib/webIqAuto': autoContract, '@/lib/webIqAutoTimeZone': timeZoneContract,
});
const cases = [];
const test = (name, run) => cases.push({ name, run });
const drain = async () => { await new Promise(resolve => setImmediate(resolve)); await new Promise(resolve => setImmediate(resolve)); };
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const readiness = overrides => ({ schemaVersion: 'webiq.auto.readiness.v1', enabled: true, configured: true,
  access: 'not_verified', brokerCompatibility: 'requires_auto_8000', mode: 'lite', productStatus: 'ga',
  estimatedMicroUsd: 8000, botProtectionConfigured: true, turnstileSiteKey: 'offline-site-key', ...overrides });
const weather = overrides => ({ evidenceIndex: 0, status: 'usable', location: 'Incheon, South Korea',
  units: { temperature: '°C', speed: 'km/h' }, currentWeather: { condition: 'OFFLINE_WEATHER_FIXTURE', temperature: 0, windSpeed: 0, observedAt: '2026-11-17T03:00:00Z' },
  citations: [{ url: 'https://weather.microsoft.com/offline-fixture', title: 'OFFLINE_SOURCE', observedAt: '2026-11-17T03:00:00Z', crawledAt: '2026-11-17T04:00:00Z', lastUpdatedAt: '2026-11-17T02:00:00Z' }],
  checks: { location: true, observationTime: true, units: true, source: true }, issues: [], ...overrides });
const result = overrides => ({ schemaVersion: 'webiq.auto.response.v1', status: 'usable', weather: [weather()],
  retrievedAt: '2026-11-17T05:00:00Z', estimatedMicroUsd: 8000, requestCount: 1, mode: 'lite', ...overrides });
const timeZoneResult = (cityId = 'london', overrides) => ({
  schemaVersion: 'webiq.auto.timezone.response.v1', cityId, status: 'usable',
  seoul: { location: 'Seoul, South Korea', localTime: '2026-11-17T14:00:00+09:00', utcOffset: '9' },
  destination: cityId === 'tokyo' ? { location: 'Tokyo, Japan', localTime: '2026-11-17T14:00:00+09:00', utcOffset: '9' }
    : { location: 'London, United Kingdom', localTime: '2026-11-17T05:00:00Z', utcOffset: '0' },
  differenceMinutes: cityId === 'tokyo' ? 0 : 540, retrievedAt: '2026-11-17T05:00:00Z', estimatedMicroUsd: 8000,
  requestCount: 1, mode: 'lite', ...overrides,
});
function elements(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(item => elements(item, predicate));
  if (!React.isValidElement(node)) return [];
  return [...(predicate(node) ? [node] : []), ...elements(node.props.children, predicate)];
}
function harness(options = {}) {
  const slots = [], jobs = [], calls = [], timers = new Map();
  let cursor = 0, mounted = true, lateUpdates = 0, language = 'en', tree, timerSequence = 0, focusCalls = 0;
  const same = (a, b) => a && b && a.length === b.length && a.every((item, index) => Object.is(item, b[index]));
  const hooks = {
    ...React,
    useState: initial => {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, next => {
        if (!mounted) { lateUpdates++; return; }
        slots[index].value = typeof next === 'function' ? next(slots[index].value) : next;
      }];
    },
    useRef: initial => {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useCallback: (callback, deps) => {
      const index = cursor++;
      if (!(index in slots) || !same(slots[index].deps, deps)) slots[index] = { callback, deps };
      return slots[index].callback;
    },
    useEffect: (run, deps) => {
      const index = cursor++;
      if (!(index in slots) || !same(slots[index].deps, deps)) {
        const previous = slots[index];
        slots[index] = { deps, cleanup: previous?.cleanup };
        jobs.push(() => { slots[index].cleanup?.(); slots[index].cleanup = run(); });
      }
    },
  };
  const Button = ({ children, variant, size, ...props }) => React.createElement('button', props, children);
  const Bot = () => null;
  const exports = {};
  const filename = path.join(root, 'components/web-iq/web-iq-auto-weather.tsx');
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  vm.runInNewContext(compiled, { exports, URL, AbortController, setTimeout: (run, delay) => {
    const id = ++timerSequence; timers.set(id, { run, delay }); return id;
  }, clearTimeout: id => timers.delete(id), fetch: async (url, init = {}) => {
    assert.equal(url, '/api/web-iq/auto');
    calls.push({ url, init });
    if (init.method === 'POST') return options.post ? options.post(url, init) : Response.json(result());
    if (options.getError) throw new Error('OFFLINE_READINESS_FAILURE');
    return Response.json(readiness(options.readiness));
  }, require: name => {
    if (name === 'react') return hooks;
    if (name === 'react/jsx-runtime') return require(name);
    if (name === '@/components/ui/button') return { Button };
    if (name === '@/components/web-iq/web-iq-auto-time-zone') return { WebIqAutoTimeZone };
    if (name === '@/components/web-iq/web-iq-bot-check') return { WebIqBotCheck: Bot };
    if (name === '@/components/web-iq/web-iq-service-links') return { WebIqServiceLinks: () => null };
    if (name === '@/lib/webIqAuto') return autoContract;
    if (name === '@/lib/webIqAutoTimeZone') return timeZoneContract;
    if (name === '@/lib/webIqServiceReferences') return serviceReferences;
    throw new Error(`Unexpected UI dependency: ${name}`);
  } }, { filename });
  const render = (nextLanguage = language) => {
    language = nextLanguage; cursor = 0;
    tree = exports.WebIqAutoWeather({ language });
    const heading = elements(tree, item => item.props.id === 'web-iq-auto-format-title')[0];
    if (heading?.props.ref) heading.props.ref.current = { focus: () => { focusCalls++; } };
    while (jobs.length) jobs.shift()();
    return tree;
  };
  const timeZone = () => elements(tree, item => item.type === WebIqAutoTimeZone)[0];
  const action = kind => elements(kind === 'timezone' ? timeZone().props.controls : tree, item =>
    item.type === Button && item.props['aria-describedby']?.startsWith(`web-iq-auto-${kind}-status`))[0];
  const compareButton = () => elements(tree, item => item.type === Button && item.props['aria-controls'] === 'web-iq-auto-comparison')[0];
  return {
    calls, render,
    html: () => renderToStaticMarkup(tree),
    postCalls: () => calls.filter(item => item.init.method === 'POST'),
    submit: (kind = 'weather', detail = 1) => action(kind).props.onClick({ detail }),
    cancel: (kind = 'weather') => {
      const region = kind === 'timezone' ? timeZone().props.controls : tree;
      elements(region, item => item.type === Button && /Cancel request|조회 취소/.test(item.props.children))[0].props.onClick();
    },
    disabled: (kind = 'weather') => action(kind).props.disabled,
    compare: () => { compareButton().props.onClick(); render(); },
    comparisonOpen: () => compareButton().props['aria-expanded'],
    focusCalls: () => focusCalls,
    city: () => timeZone().props.cityId,
    cityResult: () => timeZone().props.result,
    changeCity: cityId => timeZone().props.onCityChange(cityId),
    timeZoneHtml: () => renderToStaticMarkup(timeZone()),
    bot: () => elements(tree, item => item.type === Bot)[0],
    token: () => { const bot = elements(tree, item => item.type === Bot)[0]; assert.ok(bot); bot.props.onTokenChange('offline-token'); render(); },
    tick: delay => { for (const [id, timer] of [...timers]) if (timer.delay === delay) { timers.delete(id); timer.run(); } render(); },
    flush: async () => { await drain(); return render(); },
    unmount: () => { mounted = false; for (const slot of slots) slot?.cleanup?.(); },
    lateUpdates: () => lateUpdates,
  };
}
async function readyHarness(options, open = true) {
  const h = harness(options);
  h.render();
  await h.flush();
  if (open) h.compare();
  return h;
}

test('mount performs one readiness GET only; default-off blocks even a direct submit handler', async () => {
  const h = await readyHarness({ readiness: { enabled: false } });
  assert.equal(h.calls.length, 1); assert.equal(h.postCalls().length, 0);
  assert.equal(h.disabled(), true); assert.equal(h.bot(), undefined);
  assert.equal(h.disabled('timezone'), true);
  h.submit(); assert.equal(h.postCalls().length, 0);
  h.submit('timezone'); assert.equal(h.postCalls().length, 0);
  assert.match(h.html(), />GA<\/span>/);
  assert.doesNotMatch(h.html(), /App access unverified/);
  assert.match(h.html(), /Auto is off/); h.unmount();
});

test('readiness failure, missing config, missing bot protection and missing site key all fail closed', async () => {
  for (const options of [{ getError: true }, { readiness: { configured: false } },
    { readiness: { botProtectionConfigured: false } }, { readiness: { turnstileSiteKey: null } }]) {
    const h = await readyHarness(options); h.submit();
    assert.equal(h.disabled(), true); assert.equal(h.postCalls().length, 0); assert.equal(h.bot(), undefined); h.unmount();
  }
});

test('a verified explicit click submits fixed DTO once; a same-tick double click cannot submit twice', async () => {
  const response = deferred();
  const h = await readyHarness({ post: () => response.promise });
  assert.equal(h.bot().props.action, 'webiq_auto'); assert.equal(h.disabled(), true);
  h.submit(); assert.equal(h.postCalls().length, 0);
  h.token(); const beforeReset = h.bot().props.resetKey; h.submit(); h.submit(); h.render();
  assert.equal(h.postCalls().length, 1); assert.equal(h.disabled(), true);
  assert.deepEqual(JSON.parse(h.postCalls()[0].init.body), { schemaVersion: 'webiq.auto.request.v1', locationId: 'incheon-port', language: 'en', turnstileToken: 'offline-token' });
  response.resolve(Response.json(result())); await h.flush();
  assert.match(h.html(), /Evidence checks passed/); assert.match(h.html(), /0 °C/); assert.match(h.html(), /0 km\/h/);
  assert.ok(h.bot().props.resetKey > beforeReset); assert.equal(h.disabled(), true);
  assert.match(h.html(), /Weather observation time/); assert.match(h.html(), /Source observation time/);
  assert.match(h.html(), /Source crawl time/); assert.match(h.html(), /Source last updated/); assert.match(h.html(), /App retrieval time/);
  const rightCard = h.html().split('aria-labelledby="web-iq-format-auto"')[1].split('</article>')[0];
  assert.doesNotMatch(rightCard, /<li[^>]*>Temperature<\/li>/);
  assert.ok(rightCard.indexOf('0 °C') < rightCard.indexOf('Weather evidence details'));
  assert.ok(rightCard.indexOf('Weather observation time') < rightCard.indexOf('Weather evidence details'));
  assert.equal(h.postCalls().length, 1); h.unmount();
});

test('a second pointer click cannot submit again after a fast response and fresh browser token', async () => {
  for (const kind of ['weather', 'timezone']) {
    const h = await readyHarness({ post: () => Response.json(kind === 'weather' ? result() : timeZoneResult()) });
    h.token(); h.submit(kind, 1);
    await h.flush(); h.token();
    assert.equal(h.disabled(kind), false);
    h.submit(kind, 2);
    assert.equal(h.postCalls().length, 1);
    h.submit(kind, 0); // A new keyboard activation still works.
    assert.equal(h.postCalls().length, 2);
    await h.flush();
    h.unmount();
  }
});

test('timezone can verify and submit once before comparison opens, without turning the weather example into a result', async () => {
  const h = await readyHarness({ post: () => Response.json(timeZoneResult()) }, false);
  assert.equal(h.city(), 'london');
  assert.equal(h.comparisonOpen(), false);
  assert.equal(h.bot().props.action, 'webiq_auto');
  h.submit('timezone');
  assert.equal(h.postCalls().length, 0);
  h.token();
  assert.equal(h.disabled('timezone'), false);
  h.submit('timezone');
  h.submit('timezone');
  await h.flush();
  assert.equal(h.comparisonOpen(), false);
  assert.doesNotMatch(h.html(), /id="web-iq-auto-weather-result"/);
  assert.equal(h.postCalls().length, 1);
  assert.deepEqual(JSON.parse(h.postCalls()[0].init.body), {
    schemaVersion: 'webiq.auto.timezone.request.v1', cityId: 'london', language: 'en', turnstileToken: 'offline-token',
  });
  assert.equal(h.cityResult().destination.utcOffset, '0');
  assert.match(h.timeZoneHtml(), /Seoul is 9 hours ahead of London/);
  assert.equal(h.disabled('timezone'), true);
  h.unmount();
});

test('renders both clocks from the November 18 Auto comparison with unnamed locations', async () => {
  const utcTime = 'Wednesday, 2026-11-18T05:43:01Z';
  const actualContent = {
    startTimeZone: { timeZoneName: 'Korean Standard Time', timeZoneAbbreviation: 'KST', utcOffset: 9,
      utcTime, localTime: 'Wednesday, 2026-11-18T14:43:01+09:00' },
    endTimeZone: { timeZoneName: 'Greenwich Mean Time', timeZoneAbbreviation: 'GMT', utcOffset: 0,
      utcTime, localTime: utcTime },
    timeDifference: 'Korean Standard Time is ahead of Greenwich Mean Time by 9 hours. ',
  };
  const parsed = timeZoneContract.parseWebIqTimeZonePayload({
    results: [{ evidence: { type: 'structured/timeZone', content: actualContent } }],
  }, 'london');
  const h = await readyHarness({ post: () => Response.json(timeZoneResult('london', parsed)) }, false);
  h.token();
  h.submit('timezone');
  await h.flush();
  const html = h.timeZoneHtml();
  assert.match(html, /Seoul is 9 hours ahead of London/);
  assert.match(html, /2026-11-18T14:43/);
  assert.match(html, /2026-11-18T05:43/);
  h.unmount();
});

test('both Auto actions share one synchronous lock, and city changes leave a pending weather request alone', async () => {
  const response = deferred();
  const h = await readyHarness({ post: () => response.promise });
  h.token();
  h.submit();
  h.submit('timezone');
  h.changeCity('tokyo');
  h.render();
  assert.equal(h.city(), 'tokyo');
  assert.equal(h.postCalls().length, 1);
  assert.equal(h.postCalls()[0].init.signal.aborted, false);
  assert.equal(h.disabled('timezone'), true);
  assert.match(h.timeZoneHtml(), /Wait for the other Auto request/);
  response.resolve(Response.json(result()));
  await h.flush();
  assert.match(h.html(), /OFFLINE_WEATHER_FIXTURE/);
  assert.doesNotMatch(h.timeZoneHtml(), /OFFLINE_WEATHER_FIXTURE/);
  h.unmount();
});

test('city change invalidates the previous timezone response before render and a late completion cannot unlock a newer request', async () => {
  const previous = deferred(), next = deferred();
  let count = 0;
  const h = await readyHarness({ post: () => (++count === 1 ? previous : next).promise });
  h.token();
  h.submit('timezone');
  h.submit();
  assert.equal(h.postCalls().length, 1);
  h.changeCity('tokyo');
  assert.equal(h.postCalls()[0].init.signal.aborted, true);
  assert.equal(h.postCalls().length, 1);
  h.render();
  h.submit('timezone');
  assert.equal(h.postCalls().length, 1);
  h.token();
  h.submit('timezone');
  h.render();
  previous.resolve(Response.json(timeZoneResult()));
  await h.flush();
  assert.equal(h.cityResult(), null);
  assert.equal(h.disabled('timezone'), true);
  assert.match(h.timeZoneHtml(), /Waiting for Auto/);
  assert.equal(JSON.parse(h.postCalls()[1].init.body).cityId, 'tokyo');
  next.resolve(Response.json(timeZoneResult('tokyo')));
  await h.flush();
  assert.match(h.timeZoneHtml(), /Both cities have the same local time/);
  h.changeCity('seattle');
  h.render();
  assert.equal(h.cityResult(), null);
  assert.match(h.timeZoneHtml(), /time difference between Seoul and Seattle/);
  assert.equal(h.postCalls().length, 2);
  h.unmount();
});

test('timezone rejects a different city response and keeps the error in its own area', async () => {
  const h = await readyHarness({ post: () => Response.json(timeZoneResult('tokyo')) });
  h.token();
  h.submit('timezone');
  await h.flush();
  assert.equal(h.cityResult(), null);
  assert.match(h.timeZoneHtml(), /Time zone evidence could not be verified/);
  const rightCard = h.html().split('aria-labelledby="web-iq-format-auto"')[1].split('</article>')[0];
  assert.doesNotMatch(rightCard, /Time zone evidence could not be verified/);
  assert.equal(h.postCalls().length, 1);
  h.unmount();
});

test('failed requests reset verification, preserve the reservation caveat, and never retry automatically', async () => {
  const h = await readyHarness({ post: () => Response.json({ code: 'USAGE_GUARD_UNAVAILABLE', reservation: 'unknown', estimatedMicroUsd: null, reservationPotentialMicroUsd: 8000 }, { status: 503 }) });
  h.token(); const beforeReset = h.bot().props.resetKey; h.submit(); await h.flush();
  assert.match(h.html(), /shared allowance could not be checked/); assert.match(h.html(), /reservation may remain/);
  assert.ok(h.bot().props.resetKey > beforeReset); assert.equal(h.disabled(), true);
  assert.equal(h.postCalls().length, 1); h.unmount();
});

test('cancellation aborts transport, consumes verification and ignores a late success', async () => {
  const response = deferred(); const h = await readyHarness({ post: () => response.promise });
  h.token(); h.submit(); h.render(); h.cancel(); h.render();
  assert.equal(h.postCalls()[0].init.signal.aborted, true); assert.equal(h.disabled(), true);
  response.resolve(Response.json(result())); await h.flush();
  assert.match(h.html(), /Weather request cancelled/); assert.ok(!h.html().includes('OFFLINE_WEATHER_FIXTURE'));
  assert.equal(h.postCalls().length, 1); h.unmount();
});

test('a language change aborts the previous request, clears its token and rejects stale updates', async () => {
  const response = deferred(); const h = await readyHarness({ post: () => response.promise });
  h.token(); h.submit(); h.render('ko'); await h.flush();
  assert.equal(h.postCalls()[0].init.signal.aborted, true); assert.equal(h.disabled(), true);
  response.resolve(Response.json(result())); await h.flush();
  assert.ok(!h.html().includes('OFFLINE_WEATHER_FIXTURE')); assert.match(h.html(), /인천 날씨 실제 조회/);
  assert.equal(h.postCalls().length, 1); h.unmount();
});

test('unmount aborts in-flight work and late completion makes no state updates', async () => {
  const response = deferred(); const h = await readyHarness({ post: () => response.promise });
  h.token(); h.submit(); h.unmount();
  assert.equal(h.postCalls()[0].init.signal.aborted, true);
  response.resolve(Response.json(result())); await drain(); assert.equal(h.lateUpdates(), 0);
});

test('the 35-second client deadline terminates even an abort-insensitive transport, with no retry', async () => {
  const response = deferred(); const h = await readyHarness({ post: () => response.promise });
  h.token(); h.submit(); h.render(); h.tick(35_000);
  assert.equal(h.postCalls()[0].init.signal.aborted, true); assert.equal(h.disabled(), true);
  assert.match(h.html(), /request timed out/);
  response.resolve(Response.json(result())); await h.flush();
  assert.ok(!h.html().includes('OFFLINE_WEATHER_FIXTURE')); assert.equal(h.postCalls().length, 1); h.unmount();
});

test('partial and empty responses remain distinct; unknown measurements are not converted to zero', async () => {
  for (const payload of [result({ status: 'empty', weather: [] }), result({ status: 'not_verified', weather: [weather({ status: 'not_verified', location: null, units: {}, currentWeather: {}, citations: [], checks: { location: false, observationTime: false, units: false, source: false }, issues: ['location', 'observationTime', 'units', 'source'] })] })]) {
    const h = await readyHarness({ post: () => Response.json(payload) }); h.token(); h.submit(); await h.flush();
    assert.match(h.html(), payload.status === 'empty' ? /No weather evidence returned/ : /Weather checks incomplete/);
    assert.ok(!h.html().includes('0 °C')); assert.ok(!h.html().includes('0 km/h'));
    if (payload.status === 'not_verified') assert.match(h.html(), /Not returned \/ unverified/);
    h.unmount();
  }
});

test('malformed or oversized evidence DTOs cannot render as usable weather', async () => {
  for (const payload of [result({ weather: [weather({ checks: { location: false, observationTime: false, units: false, source: false } })] }), result({ weather: Array.from({ length: 21 }, () => weather()) })]) {
    const h = await readyHarness({ post: () => Response.json(payload) }); h.token(); h.submit(); await h.flush();
    assert.match(h.html(), /Weather evidence could not be verified/); assert.ok(!h.html().includes('OFFLINE_WEATHER_FIXTURE')); h.unmount();
  }
});

test('only safe HTTPS source links render; forecast and alert details are collapsed and separately dated', async () => {
  const payload = result({ weather: [weather({ citations: [{ url: 'javascript:alert(1)', title: 'UNSAFE_LINK' }, { url: 'https://weather.microsoft.com/fixture', title: 'SAFE_LINK' }], forecastedWeather: [{ validDate: '2026-11-18', condition: 'FORECAST_FIXTURE', temperatureHigh: 0, temperatureLow: -1 }], alerts: [{ name: 'ALERT_FIXTURE', status: 'active', effectiveAt: '2026-11-17T03:00:00Z', expiresAt: '2026-11-17T06:00:00Z', issuingAuthority: 'OFFLINE_AUTHORITY', url: 'http://insecure.example.com/alert' }] })] });
  const h = await readyHarness({ post: () => Response.json(payload) }); h.token(); h.submit(); await h.flush();
  const html = h.html(); assert.ok(!html.includes('href="javascript:')); assert.ok(!html.includes('href="http:'));
  assert.match(html, /href="https:\/\/weather.microsoft.com\/fixture"/);
  assert.match(html, /Forecast · dates as returned/); assert.match(html, /Issued \/ effective \/ expires/); assert.match(html, /OFFLINE_AUTHORITY/);
  const resultHtml = html.slice(html.indexOf('id="web-iq-auto-weather-result"')).split('</article>')[0];
  assert.equal((resultHtml.match(/<details /g) || []).length, 3);
  assert.doesNotMatch(resultHtml, /<details[^>]+open/);
  assert.match(resultHtml, /Check port conditions and any current alerts separately/);
  h.unmount();
});

test('KO/EN comparison opens without readiness, focuses its heading on every click, and presents format examples', async () => {
  for (const language of ['ko', 'en']) {
    const h = await readyHarness({ readiness: { enabled: false } }, false);
    h.render(language); await h.flush();
    assert.equal(h.comparisonOpen(), false);
    assert.doesNotMatch(h.html(), /id="web-iq-auto-format-title"/);
    assert.equal(h.focusCalls(), 0);
    h.compare();
    assert.equal(h.comparisonOpen(), true);
    assert.equal(h.focusCalls(), 1);
    h.compare();
    assert.equal(h.focusCalls(), 2);
    const html = h.html();
    const format = html.match(/<section[^>]+aria-labelledby="web-iq-auto-format-title"[\s\S]*?<\/section>/)?.[0];
    assert.ok(format);
    assert.match(html, language === 'ko' ? /인천항에서 출발하려는데, 지금 날씨가 어떤가요\?/ : /I’m leaving from Incheon Port\. What’s the weather like right now\?/);
    assert.match(format, language === 'ko' ? /응답 형식 예시/ : /Format examples/);
    const cards = [...format.matchAll(/<article\b[\s\S]*?<\/article>/g)].map(item => item[0]);
    assert.equal(cards.length, 2);
    const searchFields = language === 'ko'
      ? ['검색 결과 예시', '기상청 날씨누리 단기예보', '수도권의 예상 날씨와 기온', '기상청에서 예보 보기']
      : ['Example search result', 'Short-term forecast for South Korea', 'Seoul and Incheon area', 'Open the Korea Meteorological Administration forecast'];
    for (const field of searchFields) assert.ok(cards[0].includes(field));
    assert.match(cards[0], /href="https:\/\/www\.weather\.go\.kr\/w\/forecast\/overall\/short-term\.do"/);
    assert.doesNotMatch(cards[0], /<(?:button|time)/);
    const autoFields = language === 'ko' ? ['기온', '풍속', '관측 시각', '출처'] : ['Temperature', 'Wind speed', 'Observation time', 'Source'];
    assert.deepEqual([...cards[1].matchAll(/<li\b[^>]*>([^<]+)<\/li>/g)].map(item => item[1]), autoFields);
    assert.ok(cards[1].includes(serviceReferences.WEB_IQ_SERVICE_REFERENCES.auto.featureUrl + '#weather-object'));
    assert.equal((cards[1].match(/<a /g) || []).length, 1);
    assert.doesNotMatch(cards[1], /<time|OFFLINE_WEATHER_FIXTURE/);
    assert.equal(h.postCalls().length, 0);
    assert.equal(h.disabled(), true); h.unmount();
  }
});

test('execution details start collapsed while both actions, request count and availability are visible in context', async () => {
  const h = await readyHarness({ readiness: { enabled: false } });
  const html = h.html();
  const details = html.match(/<details\b[^>]+id="web-iq-auto-execution-details"[\s\S]*?<\/details>/)?.[0];
  assert.ok(details); assert.ok(!/<details[^>]+open/.test(details));
  assert.match(details, /Request limits and API details/);
  assert.match(details, /Shared demo estimate limit/); assert.match(details, /reservation may remain/);
  const visible = html.replace(details, '');
  assert.match(visible, /Check Incheon weather/); assert.match(visible, /Check local time in both cities/);
  assert.match(visible, /Auto is off/);
  assert.equal((visible.match(/Clicking sends one request to Web IQ Auto/g) || []).length, 2);
  assert.match(visible, /href="https:\/\/learn.microsoft.com\/en-us\/web-iq\/overview"/);
  assert.match(visible, /href="https:\/\/learn.microsoft.com\/en-us\/web-iq\/reference\/auto"/);
  assert.equal(h.postCalls().length, 0); h.unmount();
});

test('the shared Auto Turnstile identifies Auto in Korean and English', () => {
  const filename = path.join(root, 'components/web-iq/web-iq-bot-check.tsx'); const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, { exports, require: name => {
    if (name === 'react' || name === 'react/jsx-runtime') return require(name);
    if (name === '@/components/ui/button') return { Button: props => React.createElement('button', props, props.children) };
    if (name === '@/components/web-iq/web-iq-service-links') return { WebIqServiceLinks: () => null };
    throw new Error(`Unexpected bot dependency: ${name}`);
  } }, { filename });
  for (const language of ['ko', 'en']) {
    const html = renderToStaticMarkup(React.createElement(exports.WebIqBotCheck, { siteKey: 'offline-site-key', action: 'webiq_auto', language, onTokenChange: () => {}, resetKey: 0 }));
    assert.match(html, language === 'ko' ? /Auto 조회 전 브라우저 확인/ : /Browser check before using Auto/);
  }
});

(async () => {
  let failed = 0;
  for (const { name, run } of cases) {
    try { await run(); console.log(`PASS ${name}`); } catch (error) { failed++; console.error(`FAIL ${name}`, error); }
  }
  console.log(`${cases.length - failed} passed, ${failed} failed (${cases.length} offline Auto UI checks; provider calls 0).`);
  process.exitCode = failed ? 1 : 0;
})();
