/** Fixed regional weather lookup for the Incheon Port demo. */
export const WEB_IQ_AUTO_DOCUMENTATION = 'https://learn.microsoft.com/en-us/web-iq/reference/auto';
export const WEB_IQ_AUTO_LOCATION_ID = 'incheon-port';
// UN/LOCODE KRINC (3727N 12637E), used as Auto's geographic context.
export const WEB_IQ_AUTO_LOCATION = 'lat:37.4500;long:126.6167';
export const WEB_IQ_AUTO_QUESTION = 'current weather in Incheon';
export const WEB_IQ_AUTO_MAX_RESPONSE_BYTES = 64 * 1_024;

export interface WebIqAutoReadiness {
  schemaVersion: 'webiq.auto.readiness.v1';
  enabled: boolean;
  configured: boolean;
  access: 'not_verified';
  brokerCompatibility: 'requires_auto_8000';
  mode: 'lite';
  productStatus: 'ga';
  estimatedMicroUsd: number;
  botProtectionConfigured: boolean;
  turnstileSiteKey: string | null;
}

export interface WebIqAutoCitation {
  url: string;
  title?: string;
  source?: string;
  observedAt?: string;
  crawledAt?: string;
  lastUpdatedAt?: string;
}

export interface WebIqAutoUnits {
  system?: string;
  temperature?: string;
  speed?: string;
  pressure?: string;
  distance?: string;
  height?: string;
  time?: string;
}

export interface WebIqAutoWeatherEvidence {
  evidenceIndex: number;
  status: 'usable' | 'not_verified';
  location: string | null;
  url?: string;
  units: WebIqAutoUnits;
  currentWeather: { condition?: string; temperature?: number; windSpeed?: number; observedAt?: string };
  forecastedWeather?: { validDate?: string; condition?: string; temperatureHigh?: number; temperatureLow?: number }[];
  alerts?: { name?: string; severity?: string; status?: string; issuingAuthority?: string; url?: string;
    description?: string; safetyGuidance?: string; issuedAt?: string; effectiveAt?: string; expiresAt?: string }[];
  citations: WebIqAutoCitation[];
  checks: { location: boolean; observationTime: boolean; units: boolean; source: boolean };
  issues: string[];
}

export interface WebIqAutoResponse {
  schemaVersion: 'webiq.auto.response.v1';
  status: 'usable' | 'not_verified' | 'empty';
  weather: WebIqAutoWeatherEvidence[];
  retrievedAt: string;
  estimatedMicroUsd: number;
  requestCount: 1;
  mode: 'lite';
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, max = 200): string | undefined {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) return undefined;
  return value.trim();
}

function number(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** Links are displayed only; the server never retrieves provider-supplied URLs. */
function publicUrl(value: unknown): string | undefined {
  const raw = text(value, 2_048);
  if (!raw || raw.includes('\\')) return undefined;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.port || url.username || url.password || url.hash
      || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(url.hostname)
      || /\.(?:local|internal|localhost|test|invalid|example)$/i.test(url.hostname)) return undefined;
    return url.href;
  } catch { return undefined; }
}

/** An explicit offset is required; crawl/update/retrieval times are never observations. */
function timestamp(value: unknown): string | undefined {
  const raw = text(value, 64);
  const match = raw && /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})$/.exec(raw);
  if (!match) return undefined;
  const offset = match[4] === 'Z' ? 0 : (match[4][0] === '+' ? 1 : -1)
    * (Number(match[4].slice(1, 3)) * 60 + Number(match[4].slice(4, 6)));
  if (Math.abs(offset) > 14 * 60 || (match[4] !== 'Z' && Number(match[4].slice(4, 6)) > 59)) return undefined;
  const time = Date.parse(raw);
  if (!Number.isFinite(time)) return undefined;
  const local = new Date(time + offset * 60_000).toISOString();
  const expected = `${match[1]}T${match[2]}.${(match[3] || '').slice(0, 3).padEnd(3, '0')}Z`;
  return local === expected ? new Date(time).toISOString() : undefined;
}

function date(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? value : undefined;
}

function locationMatches(value: string | null): boolean {
  if (!value) return false;
  const withoutCountry = value.replace(/\b(?:republic of korea|south korea|korea)\b|대한민국|한국/gi, ',');
  const city = /^inche?on(?:\s+(?:port|metropolitan city))?$|^인천(?:항|광역시)?$/i;
  // Localized labels can include a district or repeat the province and city.
  const parts = withoutCountry.replace(/(인천광역시|인천)\s+(?=[가-힣])/g, '$1,')
    .split(/[,，]/).map(part => part.trim()).filter(Boolean);
  return parts.some(part => city.test(part)) && parts.every(part => city.test(part)
    || /^(?:[a-z]+(?:-[a-z]+)*(?:-(?:gu|gun|dong)| district)|[가-힣]+(?:구|군|동))$/i.test(part));
}

function supportedUnit(value: string | undefined, kind: 'temperature' | 'speed'): boolean {
  // Demo policy, not a service enum: retain unfamiliar supplied units but do not verify them.
  const normalized = value?.toLowerCase();
  return Boolean(normalized && (kind === 'temperature'
    ? ['c', 'f', '°c', '°f', 'k', 'celsius', 'fahrenheit', 'kelvin']
    : ['m/s', 'km/h', 'kph', 'kmph', 'mph', 'knots', 'knot', 'kt', 'kts']).includes(normalized));
}

function citation(value: unknown): WebIqAutoCitation | null {
  if (!record(value) || value.isAdult === true || ('isAdult' in value && typeof value.isAdult !== 'boolean')) return null;
  const url = publicUrl(value.url);
  if (!url) return null;
  const fields = { title: text(value.title, 300), source: text(value.source), observedAt: timestamp(value.observedAt),
    crawledAt: text(value.crawledAt, 64), lastUpdatedAt: text(value.lastUpdatedAt, 64) };
  return { url, ...Object.fromEntries(Object.entries(fields).filter(([, item]) => item !== undefined)) };
}

/** Preserve per-result attribution; missing measurements stay absent rather than becoming zero. */
export function parseWebIqAutoPayload(payload: unknown, now = Date.now()): Pick<WebIqAutoResponse, 'status' | 'weather'> | null {
  if (!record(payload) || !Array.isArray(payload.results) || payload.results.length > 20
    || ['error', 'errors', 'errorCode', 'errorCategory', 'userMessage', 'technicalDetails'].some(key => key in payload)) return null;
  const weather: WebIqAutoWeatherEvidence[] = [];
  for (const [evidenceIndex, result] of payload.results.entries()) {
    if (!record(result) || !record(result.evidence) || result.evidence.type !== 'structured/weather'
      || !record(result.evidence.content)) continue;
    const content = result.evidence.content;
    const current = record(content.currentWeather) ? content.currentWeather : {};
    const rawUnits = record(content.units) ? content.units : {};
    const units: WebIqAutoUnits = {};
    for (const key of ['system', 'temperature', 'speed', 'pressure', 'distance', 'height', 'time'] as const) {
      const unit = text(rawUnits[key], 40);
      if (unit) units[key] = unit;
    }
    const currentWeather: WebIqAutoWeatherEvidence['currentWeather'] = {};
    const condition = text(current.condition);
    const temperature = number(current.temperature);
    const windSpeed = number(current.windSpeed);
    const observedAt = timestamp(current.observedAt);
    if (condition) currentWeather.condition = condition;
    if (temperature !== undefined) currentWeather.temperature = temperature;
    if (windSpeed !== undefined) currentWeather.windSpeed = windSpeed;
    const location = text(content.location) || null;
    const url = publicUrl(content.url);
    const citations = Array.isArray(result.citations) && result.citations.length <= 50
      ? result.citations.map(citation).filter((item): item is WebIqAutoCitation => item !== null) : [];
    const supporting = citations.filter(item => item.url === url);
    const citationTimes = supporting.map(item => item.observedAt).filter((item): item is string => Boolean(item));
    // Auto can put the observation time only on this weather result's attribution.
    // Withhold a citation-derived time when sources disagree or an explicit time is malformed.
    const citationObservation = citationTimes.length && citationTimes.every(time => time === citationTimes[0])
      ? citationTimes[0] : undefined;
    const observation = current.observedAt == null ? citationObservation : observedAt;
    if (observation) currentWeather.observedAt = observation;
    // This demo's current-conditions window is explicit: at most six hours old, no more than five minutes ahead.
    const observationTime = Boolean(observation && Date.parse(observation) >= now - 6 * 60 * 60_000
      && Date.parse(observation) <= now + 5 * 60_000
      && citationTimes.every(item => item === observation));
    const checks = { location: locationMatches(location), observationTime,
      units: (temperature !== undefined || windSpeed !== undefined)
        && (temperature === undefined || supportedUnit(units.temperature, 'temperature'))
        && (windSpeed === undefined || supportedUnit(units.speed, 'speed')),
      source: Boolean(url && supporting.length) };
    const issues = Object.entries(checks).filter(([, passed]) => !passed).map(([key]) => key);
    const item: WebIqAutoWeatherEvidence = { evidenceIndex, status: issues.length ? 'not_verified' : 'usable',
      location, ...(url ? { url } : {}), units, currentWeather, citations, checks, issues };
    if (Array.isArray(content.forecastedWeather) && content.forecastedWeather.length <= 14) {
      item.forecastedWeather = content.forecastedWeather.filter(record).map(forecast => {
        const fields = { validDate: date(forecast.validDate), condition: text(forecast.condition),
          temperatureHigh: number(forecast.temperatureHigh), temperatureLow: number(forecast.temperatureLow) };
        return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
      });
    }
    if (Array.isArray(content.alerts) && content.alerts.length <= 20) {
      item.alerts = content.alerts.filter(record).map(alert => {
        const fields = { name: text(alert.name), severity: text(alert.severity), status: text(alert.status),
          issuingAuthority: text(alert.issuingAuthority), url: publicUrl(alert.url), description: text(alert.description, 1_000),
          safetyGuidance: text(alert.safetyGuidance, 1_000), issuedAt: timestamp(alert.issuedAt),
          effectiveAt: timestamp(alert.effectiveAt), expiresAt: timestamp(alert.expiresAt) };
        return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
      });
    }
    weather.push(item);
  }
  return { status: weather.some(item => item.status === 'usable') ? 'usable' : weather.length ? 'not_verified' : 'empty', weather };
}

export function abortableAuto<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(new Error('Auto request aborted.'));
    signal.addEventListener('abort', abort, { once: true });
    promise.then(value => { signal.removeEventListener('abort', abort); resolve(value); },
      error => { signal.removeEventListener('abort', abort); reject(error); });
    if (signal.aborted) abort();
  });
}

/** maxResponseLength limits Web content only; cap the complete streamed weather envelope separately. */
export async function readWebIqAutoJson(response: Pick<Response, 'headers' | 'body'>, signal: AbortSignal,
  maxBytes = WEB_IQ_AUTO_MAX_RESPONSE_BYTES): Promise<unknown> {
  const declared = response.headers.get('content-length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) {
    void response.body?.cancel().catch(() => undefined);
    throw new Error('Auto response too large.');
  }
  if (!response.body) throw new Error('Missing Auto body.');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await abortableAuto(reader.read(), signal);
      if (part.done) break;
      size += part.value.byteLength;
      if (size > maxBytes) throw new Error('Auto response too large.');
      chunks.push(part.value);
    }
  } finally { void reader.cancel().catch(() => undefined); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}
