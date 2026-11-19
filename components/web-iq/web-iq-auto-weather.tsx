'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { WebIqWeatherSearchCard } from '@/components/web-iq/web-iq-weather-search-card';
import { WebIqAutoTimeZone } from '@/components/web-iq/web-iq-auto-time-zone';
import { WebIqBotCheck } from '@/components/web-iq/web-iq-bot-check';
import { WebIqServiceLinks } from '@/components/web-iq/web-iq-service-links';
import { WEB_IQ_AUTO_LOCATION_ID, WEB_IQ_AUTO_QUESTION, type WebIqAutoReadiness, type WebIqAutoResponse, type WebIqAutoWeatherEvidence } from '@/lib/webIqAuto';
import { isAutoTimeZoneResponse, type TimeZoneCityId, type WebIqAutoTimeZoneResponse } from '@/lib/webIqAutoTimeZone';
import type { WebIqLanguage } from '@/lib/webIqScenario';
import { WEB_IQ_SERVICE_REFERENCES } from '@/lib/webIqServiceReferences';

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isReadiness(value: unknown): value is WebIqAutoReadiness {
  return record(value) && value.schemaVersion === 'webiq.auto.readiness.v1'
    && typeof value.enabled === 'boolean' && typeof value.configured === 'boolean'
    && typeof value.botProtectionConfigured === 'boolean'
    && (value.turnstileSiteKey === null || typeof value.turnstileSiteKey === 'string')
    && value.access === 'not_verified' && value.brokerCompatibility === 'requires_auto_8000'
    && value.mode === 'lite' && value.productStatus === 'ga' && value.estimatedMicroUsd === 8_000;
}

function safeSourceUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.includes('\\')) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.hash
      && /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(url.hostname)
      && !/\.(?:local|internal|localhost|test|invalid|example)$/i.test(url.hostname) ? url.href : null;
  } catch { return null; }
}

function isAutoResponse(value: unknown): value is WebIqAutoResponse {
  if (!record(value) || value.schemaVersion !== 'webiq.auto.response.v1' || value.mode !== 'lite'
    || value.requestCount !== 1 || value.estimatedMicroUsd !== 8_000
    || !['usable', 'not_verified', 'empty'].includes(String(value.status))
    || typeof value.retrievedAt !== 'string' || !Number.isFinite(Date.parse(value.retrievedAt))
    || !Array.isArray(value.weather) || value.weather.length > 20) return false;
  const validText = (item: unknown) => item === undefined || typeof item === 'string';
  const validNumber = (item: unknown) => item === undefined || typeof item === 'number' && Number.isFinite(item);
  for (const item of value.weather) {
    if (!record(item) || !Number.isInteger(item.evidenceIndex)
      || !['usable', 'not_verified'].includes(String(item.status))
      || !(item.location === null || typeof item.location === 'string')
      || !record(item.units) || !Object.values(item.units).every(validText)
      || !record(item.currentWeather) || !validText(item.currentWeather.condition)
      || !validText(item.currentWeather.observedAt) || !validNumber(item.currentWeather.temperature)
      || !validNumber(item.currentWeather.windSpeed) || !record(item.checks)
      || !['location', 'observationTime', 'units', 'source'].every(key => typeof item.checks[key] === 'boolean')
      || !Array.isArray(item.issues) || !item.issues.every(issue => typeof issue === 'string')
      || !Array.isArray(item.citations) || item.citations.length > 50
      || !item.citations.every(cite => record(cite) && typeof cite.url === 'string'
        && ['title', 'source', 'observedAt', 'crawledAt', 'lastUpdatedAt'].every(key => validText(cite[key])))) return false;
    if (item.forecastedWeather !== undefined && (!Array.isArray(item.forecastedWeather) || item.forecastedWeather.length > 14
      || !item.forecastedWeather.every(forecast => record(forecast) && validText(forecast.validDate)
        && validText(forecast.condition) && validNumber(forecast.temperatureHigh) && validNumber(forecast.temperatureLow)))) return false;
    if (item.alerts !== undefined && (!Array.isArray(item.alerts) || item.alerts.length > 20
      || !item.alerts.every(alert => record(alert) && Object.values(alert).every(validText)))) return false;
    const passed = Object.values(item.checks).every(Boolean);
    if ((item.status === 'usable') !== passed) return false;
  }
  const expectedStatus = value.weather.some(item => item.status === 'usable') ? 'usable' : value.weather.length ? 'not_verified' : 'empty';
  return value.status === expectedStatus;
}

function WeatherResult({ result, language }: { result: WebIqAutoResponse; language: WebIqLanguage }) {
  const observationClock = new Intl.DateTimeFormat(language === 'ko' ? 'ko-KR' : 'en-GB', {
    timeZone: 'Asia/Seoul', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
  const pick = (en: string, ko: string) => language === 'ko' ? ko : en;
  const unknown = pick('Not returned / unverified', '반환 없음 / 미확인');
  const measurement = (value: number | undefined, unit: string | undefined) =>
    value === undefined ? unknown : `${value} ${unit || pick('(unit unverified)', '(단위 미확인)')}`;
  const statusLabel = (status: WebIqAutoResponse['status']) => status === 'usable'
    ? pick('Evidence checks passed', '근거 확인 항목 충족') : status === 'empty'
      ? pick('No weather evidence returned', '반환된 날씨 근거 없음')
      : pick('Weather checks incomplete', '날씨 확인 미완료');
  const checkLabels: Record<keyof WebIqAutoWeatherEvidence['checks'], string> = {
    location: pick('Incheon region', '인천 지역'),
    observationTime: pick('Observation time', '관측 시각'),
    units: pick('Measurement units', '측정 단위'),
    source: pick('Source in this result', '같은 결과의 출처'),
  };
  const weather = [...result.weather].sort((a, b) => Number(b.status === 'usable') - Number(a.status === 'usable'));

  return <div id="web-iq-auto-weather-result" className="min-w-0 space-y-4" aria-live="polite">
    {weather.length === 0 && <p className="text-sm font-medium">{statusLabel(result.status)}</p>}
    {weather.map(item => <div key={item.evidenceIndex} className="min-w-0 space-y-3 rounded-lg border border-stroke-divider bg-bg-card p-3">
      <dl className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-3 text-sm">
        <div>
          <dt className="text-fg-muted">{pick('Temperature', '기온')}</dt>
          <dd className="mt-1 break-words text-xl font-semibold">{measurement(item.currentWeather.temperature, item.units.temperature)}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">{pick('Weather observation time', '날씨 관측 시각')}</dt>
          <dd className="mt-1 break-words text-sm font-medium">{item.currentWeather.observedAt && Number.isFinite(Date.parse(item.currentWeather.observedAt))
            ? <time dateTime={item.currentWeather.observedAt} title={item.currentWeather.observedAt}>{observationClock.format(Date.parse(item.currentWeather.observedAt))}</time>
            : unknown}</dd>
        </div>
      </dl>
      <dl className="grid min-w-0 grid-cols-2 gap-3 border-t border-stroke-divider pt-3 text-sm">
        <div><dt className="text-fg-muted">{pick('Conditions', '날씨 상태')}</dt><dd className="mt-1 break-words">{item.currentWeather.condition || unknown}</dd></div>
        <div><dt className="text-fg-muted">{pick('Wind speed', '풍속')}</dt><dd className="mt-1 break-words">{measurement(item.currentWeather.windSpeed, item.units.speed)}</dd></div>
      </dl>
      <p className="break-words text-xs leading-6 text-fg-muted">{item.location || unknown} · {statusLabel(item.status)}</p>
      <div className="min-w-0">
        <p className="text-sm font-medium">{pick('Sources attached to this result', '이 결과에 첨부된 출처')}</p>
        {!item.citations.length && <p className="mt-1 text-sm text-fg-muted">{unknown}</p>}
        {item.citations.map((cite, index) => {
          const url = safeSourceUrl(cite.url);
          return <div key={`${cite.url}-${index}`} className="min-w-0 text-xs leading-6 text-fg-muted">
            {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center break-all text-sm text-accent underline">{cite.title || new URL(url).hostname}</a>
              : <p>{pick('Source link could not be verified', '출처 링크를 확인할 수 없음')}</p>}
          </div>;
        })}
      </div>
      <details className="space-y-2 border-t border-stroke-divider" aria-label={pick('Weather evidence details', '날씨 근거 상세')}>
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium">{pick('Weather evidence details', '날씨 근거 상세')}</summary>
        <p className="break-keep text-xs leading-6 text-fg-muted">{pick(
          'Regional weather describes the Incheon area. Check port conditions and any current alerts separately.',
          '이 결과는 인천 지역 날씨를 설명합니다. 항만 현장 상황과 현재 경보는 별도로 확인하세요.',
        )}</p>
        <p className="break-keep text-xs leading-6 text-fg-muted">{pick(
          'The app checks for an observation between 6 hours ago and 5 minutes ahead. Observation, forecast, source crawl, source update and app retrieval times refer to different events.',
          '앱은 관측 시각이 최근 6시간 이내이고 미래 5분을 넘지 않는지 확인합니다. 관측·예보·출처 수집·갱신·앱 조회 시각은 각각 다른 시점을 가리킵니다.',
        )}</p>
        <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
          {(Object.keys(checkLabels) as (keyof typeof checkLabels)[]).map(key => (
            <div key={key} className="flex flex-wrap justify-between gap-x-3 rounded-lg bg-bg-subtle p-2">
              <dt>{checkLabels[key]}</dt>
              <dd className={item.checks[key] ? 'font-medium text-accent' : 'text-fg-muted'}>
                {item.checks[key] ? pick('Confirmed', '확인') : pick('Unverified', '미확인')}
              </dd>
            </div>
          ))}
        </dl>
        {item.citations.map((cite, index) => <dl key={`${cite.url}-${index}`} className="break-all text-xs leading-6 text-fg-muted">
          {cite.source && <div><dt className="inline">{pick('Source', '출처')} </dt><dd className="inline">{cite.source}</dd></div>}
          {cite.observedAt && <div><dt className="inline">{pick('Source observation time', '출처의 관측 시각')} </dt><dd className="inline">{cite.observedAt}</dd></div>}
          {cite.crawledAt && <div><dt className="inline">{pick('Source crawl time', '출처 수집 시각')} </dt><dd className="inline">{cite.crawledAt}</dd></div>}
          {cite.lastUpdatedAt && <div><dt className="inline">{pick('Source last updated', '출처 최종 갱신')} </dt><dd className="inline">{cite.lastUpdatedAt}</dd></div>}
        </dl>)}
      </details>
      {item.forecastedWeather && item.forecastedWeather.length > 0 && <details className="space-y-2 border-t border-stroke-divider">
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium">{pick('Forecast · dates as returned', '예보 · 반환된 날짜 기준')}</summary>
        {item.forecastedWeather.map((forecast, index) => (
          <p key={index} className="break-words text-sm leading-7 text-fg-muted">
            {forecast.validDate || unknown} · {forecast.condition || unknown} · {pick('High', '최고')} {measurement(forecast.temperatureHigh, item.units.temperature)} / {pick('Low', '최저')} {measurement(forecast.temperatureLow, item.units.temperature)}
          </p>
        ))}
      </details>}
      {item.alerts && item.alerts.length > 0 && <details className="space-y-3 border-t border-stroke-divider">
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium">{pick('Returned weather alerts', '반환된 기상 경보')}</summary>
        {item.alerts.map((alert, index) => {
          const url = safeSourceUrl(alert.url);
          return <div key={index} className="space-y-1 break-words text-sm leading-7 text-fg-muted">
            <p className="font-medium">{alert.name || unknown}</p>
            <p>{pick('Severity / status', '심각도 / 상태')} · {alert.severity || unknown} / {alert.status || unknown}</p>
            <p>{pick('Issuing authority', '발행 기관')} · {alert.issuingAuthority || unknown}</p>
            {alert.description && <p>{alert.description}</p>}
            {alert.safetyGuidance && <p>{alert.safetyGuidance}</p>}
            <p>{pick('Issued / effective / expires', '발행 / 발효 / 만료')} · {alert.issuedAt || unknown} / {alert.effectiveAt || unknown} / {alert.expiresAt || unknown}</p>
            {url && <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center break-all text-accent underline">{pick('Open alert source', '경보 출처 열기')}</a>}
          </div>;
        })}
      </details>}
    </div>)}
    <p className="break-all text-xs leading-6 text-fg-muted">{pick('App retrieval time', '앱 조회 시각')} · <time dateTime={result.retrievedAt}>{result.retrievedAt}</time> · Auto lite · {pick('1 request', '요청 1회')}</p>
  </div>;
}

type AutoRequestKind = 'weather' | 'timezone';
type PendingRequest = { kind: AutoRequestKind; controller: AbortController; timer: ReturnType<typeof setTimeout>; generation: number };
const AUTO_DOCS = WEB_IQ_SERVICE_REFERENCES.auto;

/** Two public examples share browser verification and one in-flight Auto request. */
export function WebIqAutoWeather({ language }: { language: WebIqLanguage }) {
  const ko = language === 'ko';
  const pick = (en: string, korean: string) => ko ? korean : en;
  const [readiness, setReadiness] = React.useState<WebIqAutoReadiness | null>(null);
  const [configuration, setConfiguration] = React.useState<'checking' | 'loaded' | 'error'>('checking');
  const [token, setToken] = React.useState<string | null>(null);
  const tokenRef = React.useRef<string | null>(null);
  const [resetKey, setResetKey] = React.useState(0);
  const [loading, setLoading] = React.useState<AutoRequestKind | null>(null);
  const [notices, setNotices] = React.useState<Partial<Record<AutoRequestKind, string>>>({});
  const [result, setResult] = React.useState<WebIqAutoResponse | null>(null);
  const [cityId, setCityId] = React.useState<TimeZoneCityId>('london');
  const cityRef = React.useRef<TimeZoneCityId>('london');
  const [timeZoneResult, setTimeZoneResult] = React.useState<WebIqAutoTimeZoneResponse | null>(null);
  const generation = React.useRef(0);
  const pending = React.useRef<PendingRequest | null>(null);
  const ready = Boolean(readiness?.enabled && readiness.configured && readiness.botProtectionConfigured && readiness.turnstileSiteKey?.trim());

  React.useEffect(() => {
    const current = ++generation.current;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      if (generation.current === current) setConfiguration('error');
    }, 10_000);
    setReadiness(null);
    setConfiguration('checking');
    setResult(null);
    setTimeZoneResult(null);
    setNotices({});
    setLoading(null);
    tokenRef.current = null;
    setToken(null);
    setResetKey(value => value + 1);
    void (async () => {
      try {
        const response = await fetch('/api/web-iq/auto', { cache: 'no-store', signal: controller.signal });
        const payload: unknown = await response.json();
        if (generation.current !== current) return;
        if (controller.signal.aborted) throw new Error('Auto readiness timed out');
        if (!response.ok || !isReadiness(payload)) throw new Error('Invalid Auto readiness');
        setReadiness(payload);
        setConfiguration('loaded');
      } catch {
        if (generation.current === current) setConfiguration('error');
      } finally { clearTimeout(timer); }
    })();
    return () => {
      generation.current++;
      controller.abort();
      clearTimeout(timer);
      const request = pending.current;
      pending.current = null;
      if (request) { clearTimeout(request.timer); request.controller.abort(); }
      tokenRef.current = null;
    };
  }, [language]);

  const onTokenChange = React.useCallback((value: string | null) => {
    tokenRef.current = value;
    setToken(value);
  }, []);

  function consumeToken() {
    tokenRef.current = null;
    setToken(null);
    setResetKey(value => value + 1);
  }

  function setNotice(kind: AutoRequestKind, message?: string) {
    setNotices(current => ({ ...current, [kind]: message }));
  }

  function timeoutMessage(kind: AutoRequestKind) {
    return kind === 'weather' ? pick('The weather request timed out.', '날씨 조회 시간이 초과됐습니다.')
      : pick('The time zone request timed out.', '시차 조회 시간이 초과됐습니다.');
  }

  function errorMessage(kind: AutoRequestKind, code: unknown) {
    if (code === 'AUTO_NOT_CONFIGURED') return pick('Auto is unavailable in this app.', '이 앱에서 Auto를 사용할 수 없습니다.');
    if (code === 'AUTO_ACCESS_DENIED') return pick('Auto access was not accepted for this app.', '이 앱의 Auto 접근이 승인되지 않았습니다.');
    if (code === 'BOT_CHECK_REQUIRED' || code === 'BOT_CHECK_FAILED' || code === 'BOT_CHECK_UNAVAILABLE') return pick('Browser verification was not accepted. Verify again before a new request.', '브라우저 확인이 승인되지 않았습니다. 새 요청 전에 다시 확인해 주세요.');
    if (code === 'DAILY_BUDGET_EXHAUSTED') return pick('The shared daily allowance is used. It resets at midnight Korea time.', '공유 일 한도를 모두 사용했습니다. 한국시간 자정에 초기화됩니다.');
    if (code === 'RATE_LIMITED' || code === 'AUTO_RATE_LIMITED') return pick('Requests are temporarily limited. No automatic retry is made.', '요청이 일시적으로 제한됐습니다. 자동으로 재시도하지 않습니다.');
    if (code === 'USAGE_GUARD_UNAVAILABLE') return pick('The shared allowance could not be checked. Auto is unavailable.', '공유 이용 한도를 확인하지 못해 Auto를 사용할 수 없습니다.');
    if (code === 'AUTO_TIMEOUT') return timeoutMessage(kind);
    return kind === 'weather' ? pick('Weather evidence could not be verified.', '날씨 근거를 확인하지 못했습니다.')
      : pick('Time zone evidence could not be verified.', '시차 근거를 확인하지 못했습니다.');
  }

  function finishRequest(request: PendingRequest) {
    if (pending.current !== request) return;
    pending.current = null;
    clearTimeout(request.timer);
    setLoading(null);
    consumeToken();
  }

  function stopRequest(request: PendingRequest) {
    finishRequest(request);
    request.controller.abort();
  }

  function changeCity(nextCityId: TimeZoneCityId) {
    if (cityRef.current === nextCityId) return;
    cityRef.current = nextCityId;
    setCityId(nextCityId);
    setTimeZoneResult(null);
    setNotice('timezone');
    if (pending.current?.kind === 'timezone') stopRequest(pending.current);
  }

  async function requestAuto(kind: AutoRequestKind) {
    // Reserve the shared slot and take the token before either button can submit again.
    const turnstileToken = tokenRef.current;
    if (pending.current || !ready || !turnstileToken) return;
    const requestCity = cityRef.current;
    const controller = new AbortController();
    const request: PendingRequest = {
      kind, controller, generation: generation.current,
      timer: setTimeout(() => {
        if (pending.current !== request || generation.current !== request.generation) return;
        stopRequest(request);
        setNotice(kind, timeoutMessage(kind));
      }, 35_000),
    };
    pending.current = request;
    tokenRef.current = null;
    setToken(null);
    setLoading(kind);
    setNotice(kind);
    if (kind === 'weather') setResult(null);
    else setTimeZoneResult(null);
    const active = () => pending.current === request && generation.current === request.generation;
    try {
      const selection = kind === 'weather'
        ? { schemaVersion: 'webiq.auto.request.v1', locationId: WEB_IQ_AUTO_LOCATION_ID }
        : { schemaVersion: 'webiq.auto.timezone.request.v1', cityId: requestCity };
      const response = await fetch('/api/web-iq/auto', { method: 'POST', cache: 'no-store', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selection, language, turnstileToken }) });
      const payload: unknown = await response.json();
      if (!active()) return;
      if (!response.ok) { setNotice(kind, errorMessage(kind, record(payload) ? payload.code : null)); return; }
      if (kind === 'weather' && isAutoResponse(payload)) setResult(payload);
      else if (kind === 'timezone' && isAutoTimeZoneResponse(payload, requestCity)) setTimeZoneResult(payload);
      else setNotice(kind, errorMessage(kind, 'AUTO_INVALID_RESPONSE'));
    } catch {
      if (active()) setNotice(kind, kind === 'weather'
        ? pick('The weather response was lost or could not be read.', '날씨 응답을 받지 못했거나 읽을 수 없습니다.')
        : pick('The time zone response was lost or could not be read.', '시차 응답을 받지 못했거나 읽을 수 없습니다.'));
    } finally {
      if (active()) finishRequest(request);
    }
  }

  function cancelRequest(kind: AutoRequestKind) {
    const request = pending.current;
    if (request?.kind !== kind) return;
    stopRequest(request);
    setNotice(kind, kind === 'weather' ? pick('Weather request cancelled.', '날씨 조회를 취소했습니다.')
      : pick('Time zone request cancelled.', '시차 조회를 취소했습니다.'));
  }

  function requestControls(kind: AutoRequestKind) {
    const statusId = `web-iq-auto-${kind}-status`;
    const requestId = `web-iq-auto-${kind}-request`;
    const inProgress = loading === kind;
    const status = configuration === 'checking' ? pick('Checking this app’s settings…', '이 앱의 설정 확인 중…')
      : configuration === 'error' ? pick('Could not check this app’s settings.', '이 앱의 설정을 확인하지 못했습니다.')
        : !readiness?.enabled ? pick('Auto is off for this app.', '이 앱의 Auto는 꺼져 있습니다.')
          : !ready ? pick('Auto is unavailable in this app’s current configuration.', '현재 앱 설정에서 Auto를 사용할 수 없습니다.')
            : inProgress ? pick('Waiting for Auto…', 'Auto 응답을 기다리고 있습니다…')
              : loading ? pick('Wait for the other Auto request to finish.', '다른 Auto 조회가 끝나면 시작할 수 있습니다.')
                : !token && kind === 'timezone' ? <a className="text-accent underline underline-offset-4" href="#web-iq-auto-verification">{pick('Verify your browser in the Auto card above', '위 Auto 카드에서 브라우저 확인하기')}</a>
                  : '';
    return <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={kind === 'weather' ? 'default' : 'outline'} disabled={!ready || !token || loading !== null}
          onClick={event => {
            // Verification can renew between the two clicks of a double-click.
            if (event.detail <= 1) void requestAuto(kind);
          }}
          aria-describedby={status ? `${statusId} ${requestId}` : requestId} className="h-auto min-h-11 max-w-full whitespace-normal break-keep py-2">
          {kind === 'weather' ? pick('Get weather values with Auto', 'Auto로 날씨 값 받기') : pick('Check local time in both cities', '두 도시 시차 조회')}
        </Button>
        {inProgress && <Button type="button" variant="ghost" onClick={() => cancelRequest(kind)} className="min-h-11">{pick('Cancel request', '조회 취소')}</Button>}
      </div>
      <p id={requestId} className="break-keep text-xs leading-6 text-fg-muted">{pick('Clicking sends one request to Web IQ Auto.', '누르면 Web IQ Auto에 1회 요청합니다')}</p>
      {status && <p id={statusId} role="status" className="break-keep text-xs leading-6 text-fg-muted">{status}</p>}
      {notices[kind] && <p role="alert" className="break-keep text-sm leading-6 text-fg-default">{notices[kind]}</p>}
    </div>;
  }

  return (
    <section className="min-w-0 space-y-6" aria-labelledby="web-iq-auto-title">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="web-iq-auto-title" className="break-keep text-xl font-semibold">Web IQ Auto</h2>
          <span className="rounded-md border border-accent/40 bg-accent/10 px-2 py-1 text-xs font-medium text-accent">GA</span>
        </div>
        <p className="max-w-3xl break-keep text-sm leading-7 text-fg-muted">{pick(
          'Web Search finds pages you can read. Web IQ Auto can return the weather as numbers and times, so your app can display current conditions directly.',
          'Web Search는 날씨를 확인할 웹페이지를 찾아줍니다. Web IQ Auto는 기온과 풍속을 숫자로 돌려줘서 앱의 날씨 카드에 바로 표시할 수 있습니다.',
        )}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          {([
            [AUTO_DOCS.overviewUrl, pick('About Microsoft Web IQ', 'Microsoft Web IQ 소개')],
            [AUTO_DOCS.featureUrl, pick('Official Auto documentation', 'Auto 공식 문서')],
          ] as const).map(([href, label]) => <a key={href} href={href} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1 rounded text-sm font-medium text-accent underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
            {label}<span aria-hidden="true">↗</span><span className="sr-only">{pick(' (opens in a new tab)', ' (새 탭)')}</span>
          </a>)}
        </div>
      </header>

      <section className="min-w-0 space-y-4" aria-labelledby="web-iq-auto-weather-question">
        <h3 id="web-iq-auto-weather-question" className="break-keep text-lg font-semibold leading-7">{pick(
          'I’m leaving from Incheon Port. What’s the weather like right now?',
          '인천항에서 출발하려는데, 지금 날씨가 어떤가요?',
        )}</h3>
        <div className="grid min-w-0 items-start gap-4 md:grid-cols-2">
          <WebIqWeatherSearchCard language={language} question={WEB_IQ_AUTO_QUESTION} />
          <article aria-labelledby="web-iq-format-auto" className="min-w-0 space-y-4 rounded-xl border border-accent/40 bg-bg-card p-4 sm:p-5">
            <header className="space-y-2">
              <p className="text-xs font-semibold text-accent">Web IQ Auto</p>
              <h4 id="web-iq-format-auto" className="break-keep text-lg font-semibold">{pick('Weather values for your app', '앱에 표시할 날씨 값')}</h4>
              <p className="break-keep text-sm leading-6 text-fg-muted">{pick('Get the temperature and wind speed for Incheon, together with the observation time and source.', '인천의 기온과 풍속을 관측 시각, 출처와 함께 받습니다.')}</p>
            </header>
            {requestControls('weather')}
            {ready && readiness?.turnstileSiteKey && <div id="web-iq-auto-verification" className="scroll-mt-20" tabIndex={-1}>
              <WebIqBotCheck siteKey={readiness.turnstileSiteKey} action="webiq_auto" language={language}
                onTokenChange={onTokenChange} resetKey={resetKey} showServiceLinks={false} />
            </div>}
            <div className="space-y-3 rounded-lg border border-stroke-divider bg-bg-subtle p-4">
              <p className="text-xs font-semibold text-fg-muted">{result ? pick('Live Auto response', '이번 Auto 조회 결과') : pick('Weather card preview', '날씨 카드 미리보기')}</p>
              {result ? <WeatherResult result={result} language={language} /> : <>
                <dl className="grid grid-cols-2 gap-3">
                  {[[pick('Temperature', '기온'), '°C'], [pick('Wind speed', '풍속'), 'km/h']].map(([label, unit]) => (
                    <div key={unit}>
                      <dt className="text-xs text-fg-muted">{label}</dt>
                      <dd className="mt-1 flex items-baseline gap-1.5">
                        <span aria-hidden="true" className="text-2xl font-semibold">—</span>
                        <span className="sr-only">{pick('Available after lookup', '조회 후 표시')}</span>
                        <span className="text-sm text-fg-muted">{unit}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="border-t border-stroke-divider pt-3 text-xs leading-5 text-fg-muted">{pick('Observation time and source appear with the live readings.', '조회하면 관측 시각과 출처도 함께 표시됩니다.')}</p>
              </>}
            </div>
            <a href={`${AUTO_DOCS.featureUrl}#weather-object`} target="_blank" rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1 rounded text-sm text-accent underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              {pick('Weather response documentation', '날씨 응답 공식 문서')}<span aria-hidden="true">↗</span>
            </a>
          </article>
        </div>
      </section>

      <WebIqAutoTimeZone language={language} cityId={cityId} onCityChange={changeCity} result={timeZoneResult} controls={requestControls('timezone')} />

      <details className="min-w-0 border-t border-stroke-divider pt-1" id="web-iq-auto-execution-details">
        <summary className="min-h-11 cursor-pointer content-center rounded text-xs font-medium text-fg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{pick('Request limits and API details', '조회 조건·API 자세히')}</summary>
        <div className="space-y-3 pb-1">
          <p className="break-keep text-xs leading-6 text-fg-muted">{pick('Auto lite reserves $0.008 per request (8,000 microUSD). The reservation may remain after cancellation, timeout or a lost response.', 'Auto lite는 요청당 $0.008(8,000µUSD)을 예약하며 취소·시간 초과·응답 유실 시 예약이 유지될 수 있습니다.')}</p>
          <p className="break-keep text-xs leading-6 text-fg-muted">{pick('Shared demo estimate limit: $5 per Korea-time day. Request limit: 100 per IP in a rolling 120 seconds. A new request requires fresh verification and an explicit click.', '데모 추정 한도는 한국시간 하루 $5를 공유하며, 같은 IP에서 최근 120초간 100회까지입니다. 새 요청에는 다시 확인한 뒤 직접 누르는 동작이 필요합니다.')}</p>
          <WebIqServiceLinks features={['auto', 'bot-check']} locale={language} context="documentation" compact />
        </div>
      </details>
    </section>
  );
}
