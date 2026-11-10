import { tokenManager } from '@/lib/token-manager';
import {
  checkDemoUsage as checkCoreUsage,
  reserveDemoUsage as reserveCoreUsage,
  settleDemoUsage as settleCoreUsage,
  DAILY_BUDGET_MICRO_USD,
  DemoDailyBudgetError,
  DemoRateLimitError,
  DemoUsageError,
  DemoUsageUnavailableError,
  type DemoUsageLedgerOptions,
  type DemoUsageReservation,
  type DemoUsageSettlement,
} from '@/lib/demoUsageLedgerCore';

export {
  DAILY_BUDGET_MICRO_USD, IP_RATE_LIMIT, IP_RATE_WINDOW_MS, demoUsageDay,
  DemoUsageError, DemoDailyBudgetError, DemoRateLimitError, DemoUsageUnavailableError,
} from '@/lib/demoUsageLedgerCore';
export type { DemoUsageLedgerOptions, DemoUsageReservation, DemoUsageSettlement } from '@/lib/demoUsageLedgerCore';

const BROKER_TIMEOUT_MS = 25_000;
const MAX_RESPONSE_BYTES = 8 * 1024;
const STORAGE_SCOPE = 'https://storage.azure.com/.default';
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function validateQuery(ip: string, microUsd: number): void {
  if (typeof ip !== 'string' || !ip.trim() || ip.length > 256 || /[\u0000-\u001f\u007f]/.test(ip)
    || !isAmount(microUsd)) throw new DemoUsageUnavailableError();
}

function validateReservation(value: unknown): DemoUsageReservation {
  if (!isRecord(value) || typeof value.id !== 'string' || !ID_PATTERN.test(value.id)
    || typeof value.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.day)
    || Number.isNaN(Date.parse(`${value.day}T00:00:00Z`))
    || new Date(`${value.day}T00:00:00Z`).toISOString().slice(0, 10) !== value.day
    || !isAmount(value.reservedMicroUsd) || value.reservedMicroUsd > DAILY_BUDGET_MICRO_USD
    || !isAmount(value.remainingMicroUsd) || value.remainingMicroUsd > DAILY_BUDGET_MICRO_USD
    || value.dailyLimitMicroUsd !== DAILY_BUDGET_MICRO_USD) throw new DemoUsageUnavailableError();
  return { id: value.id, day: value.day, reservedMicroUsd: value.reservedMicroUsd,
    remainingMicroUsd: value.remainingMicroUsd, dailyLimitMicroUsd: value.dailyLimitMicroUsd };
}

function brokerConfiguration(): { origin: string; secret: string } {
  let url: URL;
  try { url = new URL(process.env.DEMO_USAGE_BROKER_URL ?? ''); } catch { throw new DemoUsageUnavailableError(); }
  const secret = process.env.DEMO_USAGE_BROKER_SECRET ?? '';
  if (url.protocol !== 'https:' || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+azurecontainerapps\.io$/.test(url.hostname)
    || url.port || url.username || url.password || url.search || url.hash || url.pathname !== '/'
    || secret.length < 32 || secret.length > 4096 || /[\s\u0000-\u001f\u007f]/.test(secret)) {
    throw new DemoUsageUnavailableError();
  }
  return { origin: url.origin, secret };
}

async function readBrokerResponse(response: Response): Promise<unknown> {
  if (!response.body) throw new DemoUsageUnavailableError();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_RESPONSE_BYTES) throw new DemoUsageUnavailableError();
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown;
}

function brokerError(body: Record<string, unknown>, httpStatus: number): DemoUsageError {
  if (body.status !== httpStatus
    || (body.retryAfterSeconds !== undefined && (!isAmount(body.retryAfterSeconds) || body.retryAfterSeconds < 1))) {
    return new DemoUsageUnavailableError();
  }
  const retryAfterSeconds = body.retryAfterSeconds as number | undefined;
  if (httpStatus === 429 && body.code === 'daily_budget_exceeded') return new DemoDailyBudgetError(retryAfterSeconds);
  if (httpStatus === 429 && body.code === 'rate_limit_exceeded') return new DemoRateLimitError(retryAfterSeconds);
  if (httpStatus === 503 && body.code === 'usage_unavailable') return new DemoUsageUnavailableError(retryAfterSeconds);
  return new DemoUsageUnavailableError();
}

/** A lost response may hide a committed reservation: never retry or switch stores. */
async function requestBroker(path: '/check' | '/reserve' | '/settle', payload: unknown): Promise<unknown> {
  const { origin, secret } = brokerConfiguration();
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout>;
  const timedOut = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => { controller.abort(); reject(new DemoUsageUnavailableError()); }, BROKER_TIMEOUT_MS);
  });
  try {
    return await Promise.race([timedOut, (async () => {
      const response = await fetch(`${origin}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), signal: controller.signal, cache: 'no-store', redirect: 'error',
      });
      const body = await readBrokerResponse(response);
      if (!isRecord(body)) throw new DemoUsageUnavailableError();
      if (body.ok === false) throw brokerError(body, response.status);
      if (response.status !== 200 || body.ok !== true) throw new DemoUsageUnavailableError();
      if (path === '/check' && body.result !== undefined) throw new DemoUsageUnavailableError();
      return body.result;
    })()]);
  } catch (error) {
    if (error instanceof DemoUsageError) throw error;
    throw new DemoUsageUnavailableError();
  } finally {
    clearTimeout(timeout!);
  }
}

function useBroker(options?: DemoUsageLedgerOptions): boolean {
  // Explicit adapters always exercise the core. Invalid configured broker URLs fail closed.
  return options === undefined && process.env.DEMO_USAGE_BROKER_URL !== undefined;
}

function directOptions(options?: DemoUsageLedgerOptions): DemoUsageLedgerOptions {
  return options ?? { getAccessToken: () => tokenManager.getToken(STORAGE_SCOPE) };
}

/** Read-only readiness hint; a later reservation still checks shared limits atomically. */
export async function checkDemoUsage(ip: string, microUsd: number, options?: DemoUsageLedgerOptions): Promise<void> {
  if (!useBroker(options)) return checkCoreUsage(ip, microUsd, directOptions(options));
  validateQuery(ip, microUsd);
  await requestBroker('/check', { ip, microUsd });
}

/** Reserve worst-case cost in the shared ledger before invoking a paid service. */
export async function reserveDemoUsage(ip: string, microUsd: number, options?: DemoUsageLedgerOptions): Promise<DemoUsageReservation> {
  if (!useBroker(options)) return reserveCoreUsage(ip, microUsd, directOptions(options));
  validateQuery(ip, microUsd);
  const result = validateReservation(await requestBroker('/reserve', { ip, microUsd }));
  if (result.reservedMicroUsd !== microUsd || result.remainingMicroUsd + microUsd > DAILY_BUDGET_MICRO_USD) {
    throw new DemoUsageUnavailableError();
  }
  return result;
}

/** Settle verified usage once; uncertain errors keep the original reservation charged. */
export async function settleDemoUsage(reservation: DemoUsageReservation, actualMicroUsd: number, options?: DemoUsageLedgerOptions): Promise<DemoUsageSettlement> {
  if (!useBroker(options)) return settleCoreUsage(reservation, actualMicroUsd, directOptions(options));
  const expected = validateReservation(reservation);
  if (!isAmount(actualMicroUsd) || actualMicroUsd > expected.reservedMicroUsd) throw new DemoUsageUnavailableError();
  const body = await requestBroker('/settle', { reservation: expected, actualMicroUsd });
  const result = validateReservation(body);
  if (!isRecord(body) || body.settled !== true || body.chargedMicroUsd !== actualMicroUsd
    || result.id !== expected.id || result.day !== expected.day || result.reservedMicroUsd !== expected.reservedMicroUsd
    || result.remainingMicroUsd + actualMicroUsd > DAILY_BUDGET_MICRO_USD) throw new DemoUsageUnavailableError();
  return { ...result, chargedMicroUsd: actualMicroUsd, settled: true };
}
