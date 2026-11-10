import { createHmac, randomUUID } from 'node:crypto';

export const DAILY_BUDGET_MICRO_USD = 5_000_000;
export const IP_RATE_LIMIT = 100;
export const IP_RATE_WINDOW_MS = 120_000;

const DAY_MS = 86_400_000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const MAX_LEDGER_BYTES = 2 * 1024 * 1024;
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export class DemoUsageError extends Error {
  constructor(
    message: string,
    public readonly code: 'daily_budget_exceeded' | 'rate_limit_exceeded' | 'usage_unavailable',
    public readonly status: 429 | 503,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class DemoDailyBudgetError extends DemoUsageError {
  constructor(retryAfterSeconds?: number) {
    super('The public demo has reached its daily API budget.', 'daily_budget_exceeded', 429, retryAfterSeconds);
  }
}

export class DemoRateLimitError extends DemoUsageError {
  constructor(retryAfterSeconds?: number) {
    super('Too many requests. Please try again shortly.', 'rate_limit_exceeded', 429, retryAfterSeconds);
  }
}

export class DemoUsageUnavailableError extends DemoUsageError {
  constructor(retryAfterSeconds?: number) {
    super('Public demo usage protection is unavailable.', 'usage_unavailable', 503, retryAfterSeconds);
  }
}

export interface DemoUsageReservation {
  id: string;
  day: string;
  reservedMicroUsd: number;
  remainingMicroUsd: number;
  dailyLimitMicroUsd: number;
}

export interface DemoUsageSettlement extends DemoUsageReservation {
  chargedMicroUsd: number;
  settled: true;
}

/** Optional adapters are for offline tests; production uses Azure Blob and server configuration. */
export interface DemoUsageLedgerOptions {
  now?: number | (() => number);
  blobUrl?: string;
  hashSecret?: string;
  fetchImpl?: typeof fetch;
  getAccessToken?: () => Promise<string>;
  maxAttempts?: number;
  requestTimeoutMs?: number;
  operationTimeoutMs?: number;
  sleep?: (milliseconds: number) => Promise<void>;
}

interface StoredReservation {
  at: number;
  reservedMicroUsd: number;
  settledMicroUsd?: number;
}

interface LedgerDay {
  spentMicroUsd: number;
  reservations: Record<string, StoredReservation>;
}

interface UsageLedger {
  version: 1;
  updatedAt: number;
  days: Record<string, LedgerDay>;
  ips: Record<string, number[]>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export function demoUsageDay(now: number): string {
  if (!isAmount(now) || now > 8_640_000_000_000_000 - KST_OFFSET_MS) throw new DemoUsageUnavailableError();
  return new Date(now + KST_OFFSET_MS).toISOString().slice(0, 10);
}

function nextDayDelay(now: number): number {
  const nextMidnight = (Math.floor((now + KST_OFFSET_MS) / DAY_MS) + 1) * DAY_MS - KST_OFFSET_MS;
  return Math.max(1, Math.ceil((nextMidnight - now) / 1000));
}

/** A malformed ledger never becomes a fresh budget or an empty rate window. */
function validateLedger(value: unknown): UsageLedger {
  if (!isRecord(value) || value.version !== 1 || !isAmount(value.updatedAt)
    || !isRecord(value.days) || !isRecord(value.ips)) throw new DemoUsageUnavailableError();
  const updatedAt = value.updatedAt;
  const lastDay = demoUsageDay(updatedAt);
  if (!Object.prototype.hasOwnProperty.call(value.days, lastDay)) throw new DemoUsageUnavailableError();
  for (const [day, entry] of Object.entries(value.days)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(Date.parse(`${day}T00:00:00Z`))
      || new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) !== day || day > lastDay
      || !isRecord(entry) || !isAmount(entry.spentMicroUsd) || entry.spentMicroUsd > DAILY_BUDGET_MICRO_USD
      || !isRecord(entry.reservations)) throw new DemoUsageUnavailableError();
    let sum = 0;
    for (const [id, reservation] of Object.entries(entry.reservations)) {
      if (!ID_PATTERN.test(id) || !isRecord(reservation) || !isAmount(reservation.at)
        || reservation.at > value.updatedAt || demoUsageDay(reservation.at) !== day
        || !isAmount(reservation.reservedMicroUsd) || reservation.reservedMicroUsd > DAILY_BUDGET_MICRO_USD
        || ('settledMicroUsd' in reservation && (!isAmount(reservation.settledMicroUsd)
          || reservation.settledMicroUsd > reservation.reservedMicroUsd))) throw new DemoUsageUnavailableError();
      sum += (reservation.settledMicroUsd as number | undefined) ?? reservation.reservedMicroUsd;
      if (!Number.isSafeInteger(sum)) throw new DemoUsageUnavailableError();
    }
    if (sum !== entry.spentMicroUsd) throw new DemoUsageUnavailableError();
  }
  for (const [hash, timestamps] of Object.entries(value.ips)) {
    if (!/^[0-9a-f]{64}$/.test(hash) || !Array.isArray(timestamps) || timestamps.length > IP_RATE_LIMIT
      || timestamps.some((at, index) => !isAmount(at) || at > updatedAt
        || (index > 0 && at < timestamps[index - 1]))) throw new DemoUsageUnavailableError();
  }
  return value as unknown as UsageLedger;
}

function prepareLedger(value: unknown | null, now: number): UsageLedger {
  const ledger = value === null
    ? { version: 1 as const, updatedAt: now, days: { [demoUsageDay(now)]: { spentMicroUsd: 0, reservations: {} } }, ips: {} }
    : structuredClone(validateLedger(value));
  // Fail closed on significant backwards clock movement; small skew keeps state monotonic.
  if (ledger.updatedAt > now + 60_000) throw new DemoUsageUnavailableError();
  ledger.updatedAt = Math.max(now, ledger.updatedAt);
  const day = demoUsageDay(ledger.updatedAt);
  const oldestDay = demoUsageDay(Math.max(0, ledger.updatedAt - 2 * DAY_MS));
  ledger.days = Object.fromEntries(Object.entries(ledger.days).filter(([key]) => key >= oldestDay));
  ledger.days[day] ??= { spentMicroUsd: 0, reservations: {} };
  ledger.ips = Object.fromEntries(Object.entries(ledger.ips)
    .map(([hash, timestamps]) => [hash, timestamps.filter(at => at > ledger.updatedAt - IP_RATE_WINDOW_MS)] as const)
    .filter(([, timestamps]) => timestamps.length > 0));
  return ledger;
}

function reservationResult(id: string, day: string, reservedMicroUsd: number, ledger: UsageLedger): DemoUsageReservation {
  return { id, day, reservedMicroUsd, remainingMicroUsd: DAILY_BUDGET_MICRO_USD - ledger.days[day].spentMicroUsd, dailyLimitMicroUsd: DAILY_BUDGET_MICRO_USD };
}

function awaitWithSignal<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DemoUsageUnavailableError());
    signal.addEventListener('abort', abort, { once: true });
    promise.then(value => { signal.removeEventListener('abort', abort); resolve(value); }, error => {
      signal.removeEventListener('abort', abort);
      reject(error);
    });
    if (signal.aborted) abort();
  });
}

function createStore(options: DemoUsageLedgerOptions) {
  let url: URL;
  try { url = new URL(options.blobUrl ?? process.env.DEMO_USAGE_BLOB_URL ?? ''); } catch { throw new DemoUsageUnavailableError(); }
  if (url.protocol !== 'https:' || !/^[a-z0-9]{3,24}\.blob\.core\.windows\.net$/.test(url.hostname)
    || url.port || url.username || url.password || url.search || url.hash
    || !/^\/[^/]+\/.+/.test(url.pathname)) throw new DemoUsageUnavailableError();
  const requestTimeoutMs = Math.min(5_000, Math.max(1, options.requestTimeoutMs ?? 3_000));
  const deadline = Date.now() + Math.min(20_000, Math.max(1, options.operationTimeoutMs ?? 12_000));
  const fetchImpl = options.fetchImpl ?? fetch;
  const getAccessToken = options.getAccessToken;
  if (typeof getAccessToken !== 'function') throw new DemoUsageUnavailableError();
  let token: Promise<string> | undefined;

  async function request<T>(operation: (headers: Record<string, string>, signal: AbortSignal) => Promise<T>): Promise<T> {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new DemoUsageUnavailableError();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.min(remaining, requestTimeoutMs));
    try {
      token ??= getAccessToken();
      const accessToken = await awaitWithSignal(token, controller.signal);
      if (!accessToken || controller.signal.aborted) throw new DemoUsageUnavailableError();
      return await awaitWithSignal(operation({
        Authorization: `Bearer ${accessToken}`,
        'x-ms-version': '2023-11-03',
        'x-ms-date': new Date().toUTCString(),
      }, controller.signal), controller.signal);
    } catch {
      throw new DemoUsageUnavailableError();
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    deadline,
    read: () => request(async (headers, signal) => {
      const response = await fetchImpl(url.href, { headers, signal, cache: 'no-store', redirect: 'error' });
      // Only an absent blob in an existing store is initialized. Missing containers fail closed.
      if (response.status === 404 && response.headers.get('x-ms-error-code') === 'BlobNotFound') return { etag: null, value: null };
      const etag = response.headers.get('etag');
      if (!response.ok || !etag || !response.body) throw new DemoUsageUnavailableError();
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          length += value.byteLength;
          if (length > MAX_LEDGER_BYTES) throw new DemoUsageUnavailableError();
          chunks.push(value);
        }
      } finally {
        await reader.cancel().catch(() => undefined);
      }
      const bytes = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      return { etag, value: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown };
    }),
    write: (etag: string | null, ledger: UsageLedger) => request(async (headers, signal) => {
      const body = JSON.stringify(ledger);
      if (new TextEncoder().encode(body).byteLength > MAX_LEDGER_BYTES) throw new DemoUsageUnavailableError();
      const response = await fetchImpl(url.href, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json', 'x-ms-blob-type': 'BlockBlob',
          ...(etag === null ? { 'If-None-Match': '*' } : { 'If-Match': etag }) },
        body, signal, cache: 'no-store', redirect: 'error',
      });
      if (response.status === 412) return false;
      if (response.status !== 200 && response.status !== 201) throw new DemoUsageUnavailableError();
      return true;
    }),
  };
}

async function updateLedger<T>(options: DemoUsageLedgerOptions, transition: (ledger: UsageLedger) => {
  result?: T; rejection?: DemoUsageError; unchanged?: boolean;
}): Promise<T> {
  const store = createStore(options);
  const attempts = Math.min(10, Math.max(1, options.maxAttempts ?? 6));
  for (let attempt = 0; attempt < attempts; attempt++) {
    const snapshot = await store.read();
    const now = typeof options.now === 'function' ? options.now() : options.now ?? Date.now();
    const ledger = prepareLedger(snapshot.etag === null ? null : validateLedger(snapshot.value), now);
    const outcome = transition(ledger);
    if (outcome.unchanged || await store.write(snapshot.etag, ledger)) {
      if (outcome.rejection) throw outcome.rejection;
      return outcome.result!;
    }
    // Only a definite ETag conflict is retried. Uncertain writes never trigger a refund.
    const delay = 15 + Math.floor(Math.random() * 35) + attempt * 10;
    if (Date.now() + delay >= store.deadline) throw new DemoUsageUnavailableError();
    await (options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms))))(delay);
  }
  throw new DemoUsageUnavailableError();
}

/** Read-only readiness hint. The subsequent reservation must still check atomically. */
export async function checkDemoUsage(ip: string, microUsd: number, options: DemoUsageLedgerOptions = {}): Promise<void> {
  const secret = options.hashSecret ?? process.env.DEMO_USAGE_HASH_SECRET ?? '';
  if (secret.length < 32 || typeof ip !== 'string' || !ip.trim() || ip.length > 256
    || /[\u0000-\u001f\u007f]/.test(ip) || !isAmount(microUsd)) throw new DemoUsageUnavailableError();
  const hash = createHmac('sha256', secret).update(ip.trim().toLowerCase()).digest('hex');
  const snapshot = await createStore(options).read();
  const now = typeof options.now === 'function' ? options.now() : options.now ?? Date.now();
  const ledger = prepareLedger(snapshot.etag === null ? null : validateLedger(snapshot.value), now);
  const timestamps = ledger.ips[hash] ?? [];
  if (timestamps.length >= IP_RATE_LIMIT) {
    throw new DemoRateLimitError(Math.max(1, Math.ceil((timestamps[0] + IP_RATE_WINDOW_MS - ledger.updatedAt) / 1000)));
  }
  if (microUsd > DAILY_BUDGET_MICRO_USD - ledger.days[demoUsageDay(ledger.updatedAt)].spentMicroUsd) {
    throw new DemoDailyBudgetError(nextDayDelay(ledger.updatedAt));
  }
}

/** Atomically count an IP request and reserve its worst-case API cost before upstream work. */
export async function reserveDemoUsage(ip: string, microUsd: number, options: DemoUsageLedgerOptions = {}): Promise<DemoUsageReservation> {
  const secret = options.hashSecret ?? process.env.DEMO_USAGE_HASH_SECRET ?? '';
  if (secret.length < 32 || typeof ip !== 'string' || !ip.trim() || ip.length > 256
    || /[\u0000-\u001f\u007f]/.test(ip) || !isAmount(microUsd)) throw new DemoUsageUnavailableError();
  // Stable HMAC preserves the rolling window across midnight without retaining raw IPs.
  const hash = createHmac('sha256', secret).update(ip.trim().toLowerCase()).digest('hex');
  const id = randomUUID();
  return updateLedger<DemoUsageReservation>(options, ledger => {
    const now = ledger.updatedAt;
    const day = demoUsageDay(now);
    const timestamps = ledger.ips[hash] ?? [];
    if (timestamps.length >= IP_RATE_LIMIT) return { unchanged: true, rejection: new DemoRateLimitError(Math.max(1, Math.ceil((timestamps[0] + IP_RATE_WINDOW_MS - now) / 1000))) };
    ledger.ips[hash] = [...timestamps, now];
    if (microUsd > DAILY_BUDGET_MICRO_USD - ledger.days[day].spentMicroUsd) {
      // Denied budget requests still consume rate capacity, but never reserve paid usage.
      return { rejection: new DemoDailyBudgetError(nextDayDelay(now)) };
    }
    ledger.days[day].spentMicroUsd += microUsd;
    ledger.days[day].reservations[id] = { at: now, reservedMicroUsd: microUsd };
    return { result: reservationResult(id, day, microUsd, ledger) };
  });
}

/** Settle only verified, complete usage. Errors or missing usage must keep the reservation. */
export async function settleDemoUsage(reservation: DemoUsageReservation, actualMicroUsd: number, options: DemoUsageLedgerOptions = {}): Promise<DemoUsageSettlement> {
  if (!reservation || !ID_PATTERN.test(reservation.id) || !/^\d{4}-\d{2}-\d{2}$/.test(reservation.day)
    || !isAmount(reservation.reservedMicroUsd) || !isAmount(actualMicroUsd)
    || actualMicroUsd > reservation.reservedMicroUsd) throw new DemoUsageUnavailableError();
  return updateLedger<DemoUsageSettlement>(options, ledger => {
    const day = ledger.days[reservation.day];
    const stored = day?.reservations[reservation.id];
    if (!stored || stored.reservedMicroUsd !== reservation.reservedMicroUsd
      || (stored.settledMicroUsd !== undefined && stored.settledMicroUsd !== actualMicroUsd)) throw new DemoUsageUnavailableError();
    const unchanged = stored.settledMicroUsd !== undefined;
    if (!unchanged) {
      day.spentMicroUsd -= stored.reservedMicroUsd - actualMicroUsd;
      stored.settledMicroUsd = actualMicroUsd;
    }
    return { unchanged, result: { ...reservationResult(reservation.id, reservation.day, stored.reservedMicroUsd, ledger), chargedMicroUsd: actualMicroUsd, settled: true } };
  });
}
