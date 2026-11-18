export const TIME_ZONE_CITY_IDS = ['london', 'seattle', 'tokyo'] as const;
export type TimeZoneCityId = (typeof TIME_ZONE_CITY_IDS)[number];

export const TIME_ZONE_CITY_LABELS = {
  london: { en: 'London', ko: '런던' },
  seattle: { en: 'Seattle', ko: '시애틀' },
  tokyo: { en: 'Tokyo', ko: '도쿄' },
} as const;

export function getTimeZoneQuestion(cityId: TimeZoneCityId, language: 'ko' | 'en'): string {
  const city = TIME_ZONE_CITY_LABELS[cityId][language];
  return language === 'ko' ? `서울과 ${city}${cityId === 'tokyo' ? '는' : '은'} 지금 몇 시간 차이가 나나요?`
    : `What is the current time difference between Seoul and ${city}?`;
}

export const WEB_IQ_AUTO_SEOUL_LOCATION = 'lat:37.5665;long:126.9780';

/** One time-difference intent for the provider; the visible question stays localized. */
export function getTimeZoneServiceQuestion(cityId: TimeZoneCityId): string {
  return `time difference between Seoul and ${TIME_ZONE_CITY_LABELS[cityId].en}`;
}

interface TimeZoneEntry {
  location: string;
  localTime: string;
  // Preserve the actual fields when we derive a dated local clock from the provider's UTC clock.
  derivedFromUtc?: { utcTime: string; localTime: string | null };
  // The numeric hours supplied by Web IQ, represented as text for display.
  utcOffset: string | null;
}

interface TimeZoneComparison {
  status: 'usable' | 'not_verified' | 'empty';
  seoul: TimeZoneEntry | null;
  destination: TimeZoneEntry | null;
  differenceMinutes: number | null;
}

export interface WebIqAutoTimeZoneResponse extends TimeZoneComparison {
  schemaVersion: 'webiq.auto.timezone.response.v1';
  cityId: TimeZoneCityId;
  retrievedAt: string;
  requestCount: 1;
  mode: 'lite';
  estimatedMicroUsd: number;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function displayText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 200
    && !/[\u0000-\u001f\u007f]/.test(value);
}

type City = TimeZoneCityId | 'seoul';
const cityPatterns: Record<City, RegExp> = {
  seoul: /\bseoul\b|서울/i,
  london: /\blondon\b|런던/i,
  seattle: /\bseattle\b|시애틀/i,
  tokyo: /\btokyo\b|도쿄/i,
};

function matchesCity(location: string, city: City): boolean {
  if (!cityPatterns[city].test(location)) return false;
  if (Object.entries(cityPatterns).some(([name, pattern]) => name !== city && pattern.test(location))) return false;
  // Distinguish London, UK from other places named London when a qualifier is supplied.
  if (city !== 'london') return true;
  const qualifiers = location.toLowerCase().replace(/greater london|london|런던|united kingdom|england|great britain|u\.?k\.?|영국|잉글랜드|그레이터|\bgb\b/g, '');
  return !qualifiers.replace(/[\s,().-]/g, '');
}

function offsetMinutes(hours: unknown): number | null {
  if (typeof hours !== 'number' || !Number.isFinite(hours) || Math.abs(hours) > 14) return null;
  const minutes = hours * 60;
  return Number.isInteger(minutes) ? minutes : null;
}

// The API may prefix localTime with a weekday, or omit its UTC offset.
function timedOffset(localTime: string): number | null {
  const suffix = /\d:\d{2}(?:\.\d+)?\s*(Z|([+-])(\d{2}):(\d{2}))$/i.exec(localTime);
  if (!suffix) return null;
  if (suffix[1].toUpperCase() === 'Z') return 0;
  const minutes = Number(suffix[3]) * 60 + Number(suffix[4]);
  if (Number(suffix[4]) >= 60 || minutes > 840) return null;
  return suffix[2] === '-' ? -minutes : minutes;
}

function localClockFromUtc(utcTime: unknown, minutes: number | null): string | null {
  if (!displayText(utcTime) || minutes === null) return null;
  // utcTime is defined as UTC even if the source omits the zero-offset suffix.
  const match = /^(?:[^\d,]{1,24}(?:,\s*|\s+))?(\d{4}-\d{2}-\d{2})[T ]((?:[01]\d|2[0-3]):[0-5]\d)(?::([0-5]\d)(?:\.(\d+))?)?(?:Z|[+]00:00)?$/i.exec(utcTime.trim());
  if (!match) return null;
  const utc = Date.parse(`${match[1]}T${match[2]}:${match[3] || '00'}.${(match[4] || '').slice(0, 3).padEnd(3, '0')}Z`);
  if (!Number.isFinite(utc) || new Date(utc).toISOString().slice(0, 10) !== match[1]) return null;
  return new Date(utc + minutes * 60_000).toISOString().slice(0, 19);
}

function readEntry(value: unknown): TimeZoneEntry | null {
  if (!record(value) || !displayText(value.location)) return null;
  const minutes = offsetMinutes(value.utcOffset);
  if (value.utcOffset != null && minutes === null) return null;
  const rawLocal = displayText(value.localTime) ? value.localTime.trim() : null;
  let localTime = rawLocal;
  let derivedFromUtc: TimeZoneEntry['derivedFromUtc'];
  if (!localTime || !/\b\d{4}\b/.test(localTime)) {
    const derived = localClockFromUtc(value.utcTime, minutes);
    if (!derived || !displayText(value.utcTime)) return null;
    // A returned 24-hour clock fragment must agree with the fully dated UTC calculation.
    const partialClock = rawLocal && /^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(rawLocal);
    if (partialClock && `${partialClock[1].padStart(2, '0')}:${partialClock[2]}` !== derived.slice(11, 16)) return null;
    derivedFromUtc = { utcTime: value.utcTime.trim(), localTime: rawLocal };
    localTime = derived;
  }
  // Keep the returned wall clock, including its calendar date. Never use the browser's zone.
  if (!/\b\d{4}\b/.test(localTime) || !/(?:^|[^\d:])(?:[01]?\d|2[0-3]):[0-5]\d/.test(localTime)) return null;
  const date = /(\d{4}-\d{2}-\d{2})[T ]/.exec(localTime)?.[1];
  if (date) {
    const clock = /^(?:[^\d,]{1,24}(?:,\s*|\s+))?\d{4}-\d{2}-\d{2}[T ](?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?\s*(?:Z|[+-](\d{2}):([0-5]\d))?$/i.exec(localTime);
    if (!clock || (clock[1] && Number(clock[1]) * 60 + Number(clock[2]) > 840)) return null;
    const instant = Date.parse(`${date}T00:00:00Z`);
    if (!Number.isFinite(instant) || new Date(instant).toISOString().slice(0, 10) !== date) return null;
  }
  const localOffset = timedOffset(localTime);
  if (minutes !== null && localOffset !== null && minutes !== localOffset) return null;
  return { location: value.location.trim(), localTime, utcOffset: minutes === null ? null : String(value.utcOffset),
    ...(derivedFromUtc ? { derivedFromUtc } : {}) };
}

function entryOffset(entry: TimeZoneEntry | null): number | null {
  if (!entry) return null;
  return entry.utcOffset === null ? timedOffset(entry.localTime) : offsetMinutes(Number(entry.utcOffset));
}

function compareEntries(seoul: TimeZoneEntry | null, destination: TimeZoneEntry | null): number | null {
  const from = entryOffset(seoul);
  const to = entryOffset(destination);
  return from === null || to === null ? null : from - to;
}

/** Read only structured/timeZone results; the order of the locations is not guaranteed. */
export function parseWebIqTimeZonePayload(payload: unknown, cityId: TimeZoneCityId): TimeZoneComparison | null {
  if (!record(payload) || !Array.isArray(payload.results) || payload.results.length > 20
    || ['error', 'errors', 'errorCode', 'errorCategory', 'userMessage', 'technicalDetails'].some(key => key in payload)) return null;
  let seoul: TimeZoneEntry | null = null;
  let destination: TimeZoneEntry | null = null;
  let hasTimeZone = false;
  for (const result of payload.results) {
    if (!record(result) || !record(result.evidence) || result.evidence.type !== 'structured/timeZone') continue;
    hasTimeZone = true;
    const content = result.evidence.content;
    if (!record(content)) continue;
    const entries = [content.startTimeZone, content.endTimeZone];
    if (Array.isArray(content.timeZones)) entries.push(...content.timeZones.slice(0, 20));
    for (const raw of entries) {
      const entry = readEntry(raw);
      if (!entry) continue;
      if (matchesCity(entry.location, 'seoul') && (!seoul || entryOffset(seoul) === null)) seoul = entry;
      if (matchesCity(entry.location, cityId) && (!destination || entryOffset(destination) === null)) destination = entry;
    }
  }
  const differenceMinutes = compareEntries(seoul, destination);
  return { status: differenceMinutes !== null ? 'usable' : hasTimeZone ? 'not_verified' : 'empty',
    seoul, destination, differenceMinutes };
}

function isCityEntry(value: unknown, city: City): value is TimeZoneEntry | null {
  if (value === null) return true;
  if (!record(value) || (value.utcOffset !== null && (typeof value.utcOffset !== 'string'
    || !/^-?\d{1,2}(?:\.\d+)?$/.test(value.utcOffset)))) return false;
  let fields = value;
  if (value.derivedFromUtc !== undefined) {
    const source = value.derivedFromUtc;
    if (!record(source) || !displayText(source.utcTime) || (source.localTime !== null && !displayText(source.localTime))) return false;
    fields = { ...value, utcTime: source.utcTime, localTime: source.localTime };
  }
  const entry = readEntry({ ...fields, utcOffset: value.utcOffset === null ? null : Number(value.utcOffset) });
  if (!entry || entry.localTime !== value.localTime || Boolean(entry.derivedFromUtc) !== Boolean(value.derivedFromUtc)) return false;
  return matchesCity(entry.location, city);
}

/** Validate the response discriminator and selected city before applying it to the visible card. */
export function isAutoTimeZoneResponse(value: unknown, cityId: TimeZoneCityId): value is WebIqAutoTimeZoneResponse {
  if (!record(value) || value.schemaVersion !== 'webiq.auto.timezone.response.v1' || value.cityId !== cityId
    || value.mode !== 'lite' || value.requestCount !== 1 || value.estimatedMicroUsd !== 8_000
    || typeof value.retrievedAt !== 'string' || !Number.isFinite(Date.parse(value.retrievedAt))
    || !isCityEntry(value.seoul, 'seoul') || !isCityEntry(value.destination, cityId)) return false;
  const difference = compareEntries(value.seoul, value.destination);
  if (value.differenceMinutes !== difference) return false;
  if (difference !== null) return value.status === 'usable';
  return value.status === 'not_verified' || (value.status === 'empty' && value.seoul === null && value.destination === null);
}
