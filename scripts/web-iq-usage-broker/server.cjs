'use strict';

const http = require('node:http');
const { createHash, timingSafeEqual } = require('node:crypto');
const { isIP } = require('node:net');

const MAX_BODY_BYTES = 4 * 1024;
const MAX_REQUEST_MS = 30_000;
const ALLOWED_RESERVATIONS = new Set([1_000, 7_000, 421_000]);
const DAILY_LIMIT = 5_000_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function failure(code, status, retryAfterSeconds) {
  return Object.assign(new Error(code), { code, status, retryAfterSeconds });
}

function unavailable() {
  return failure('usage_unavailable', 503);
}

/** Failure metadata only: never include request URLs, identities, credentials, bodies, or stacks. */
function createFailureLogger(logger = entry => process.stderr.write(`${JSON.stringify(entry)}\n`)) {
  return (stage, details = {}) => {
    const entry = { stage };
    if (Number.isInteger(details.status) && details.status >= 100 && details.status <= 599) entry.status = details.status;
    if (typeof details.azureErrorCode === 'string' && /^[A-Za-z0-9_.-]{1,64}$/.test(details.azureErrorCode)) {
      entry.azureErrorCode = details.azureErrorCode;
    }
    if (details.reason) entry.reason = details.reason;
    if (details.errorName) entry.errorName = ['Error', 'TypeError', 'AbortError', 'TimeoutError', 'SyntaxError']
      .includes(details.errorName) ? details.errorName : 'Error';
    try { logger(entry); } catch { /* Diagnostics must not change admission decisions. */ }
  };
}

function bounded(promise, milliseconds, controller) {
  let timeout;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timeout = setTimeout(() => { controller.abort(); reject(unavailable()); }, milliseconds);
    }),
  ]).finally(() => clearTimeout(timeout));
}

/** Uses only ACA's local managed-identity endpoint; never falls back to client secrets. */
function createManagedIdentityTokenProvider({ env = process.env, fetchImpl = fetch, now = Date.now, timeoutMs = 7_500, logger } = {}) {
  let cached;
  let pending;
  const logFailure = createFailureLogger(logger);
  return async function getAccessToken() {
    if (cached && cached.until > now()) return cached.token;
    if (pending) return pending;
    const controller = new AbortController();
    let diagnostic;
    const invalid = reason => { diagnostic = { reason }; return unavailable(); };
    pending = bounded((async () => {
      let endpoint;
      try { endpoint = new URL(env.IDENTITY_ENDPOINT || ''); } catch { throw invalid('invalid_identity_config'); }
      if (!['http:', 'https:'].includes(endpoint.protocol) || endpoint.username || endpoint.password
        || endpoint.hash || !env.IDENTITY_HEADER) throw invalid('invalid_identity_config');
      endpoint.searchParams.set('resource', 'https://storage.azure.com/');
      endpoint.searchParams.set('api-version', '2019-08-01');
      const response = await fetchImpl(endpoint.href, {
        headers: { 'X-IDENTITY-HEADER': env.IDENTITY_HEADER },
        signal: controller.signal, redirect: 'error', cache: 'no-store',
      });
      if (!response.ok) {
        diagnostic = { status: response.status, azureErrorCode: response.headers.get('x-ms-error-code') };
        throw unavailable();
      }
      if (!response.body) throw invalid('empty_token_body');
      const reader = response.body.getReader();
      const chunks = [];
      let length = 0;
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          length += value.byteLength;
          if (length > 32 * 1024) throw invalid('token_response_too_large');
          chunks.push(value);
        }
      } finally {
        await reader.cancel().catch(() => undefined);
      }
      let data;
      try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { throw invalid('invalid_token_json'); }
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw invalid('invalid_token_json');
      const expires = typeof data.expires_on === 'number' ? data.expires_on
        : typeof data.expires_on === 'string' && /^\d+$/.test(data.expires_on) ? Number(data.expires_on) : NaN;
      if (typeof data.access_token !== 'string' || !data.access_token || data.access_token.length > 24 * 1024) {
        throw invalid('invalid_token_value');
      }
      if (!Number.isSafeInteger(expires) || expires * 1000 <= now() + 5_000) throw invalid('invalid_token_expiry');
      if (data.token_type && (typeof data.token_type !== 'string' || data.token_type.toLowerCase() !== 'bearer')) {
        throw invalid('invalid_token_type');
      }
      // Refresh at least a minute before token expiry; never retain a token for over five minutes.
      cached = { token: data.access_token, until: Math.min(expires * 1000 - 60_000, now() + 300_000) };
      return data.access_token;
    })(), Math.min(10_000, Math.max(1, timeoutMs)), controller)
      .catch(error => {
        logFailure('managed_identity', diagnostic || {
          reason: controller.signal.aborted ? 'request_timeout' : 'network_error',
          errorName: controller.signal.aborted ? 'TimeoutError' : error?.name || 'Error',
        });
        cached = undefined;
        throw unavailable();
      })
      .finally(() => { pending = undefined; });
    return pending;
  };
}

function exactFields(value, keys) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}

function amount(value, allowZero = false) {
  return Number.isSafeInteger(value) && value >= (allowZero ? 0 : 1) && value <= DAILY_LIMIT;
}

function validPayload(path, value) {
  if (path === '/check' || path === '/reserve') {
    return exactFields(value, ['ip', 'microUsd']) && typeof value.ip === 'string'
      && value.ip.length <= 45 && !value.ip.includes('%') && isIP(value.ip) !== 0
      && amount(value.microUsd) && ALLOWED_RESERVATIONS.has(value.microUsd);
  }
  if (!exactFields(value, ['reservation', 'actualMicroUsd'])) return false;
  const reservation = value.reservation;
  return exactFields(reservation, ['id', 'day', 'reservedMicroUsd', 'remainingMicroUsd', 'dailyLimitMicroUsd'])
    && typeof reservation.id === 'string' && UUID.test(reservation.id)
    && typeof reservation.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(reservation.day)
    && amount(reservation.reservedMicroUsd) && ALLOWED_RESERVATIONS.has(reservation.reservedMicroUsd)
    && amount(reservation.remainingMicroUsd, true) && reservation.dailyLimitMicroUsd === DAILY_LIMIT
    && amount(value.actualMicroUsd, true) && value.actualMicroUsd <= reservation.reservedMicroUsd;
}

function readJson(request, signal) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let length = 0;
    const cleanup = () => {
      request.removeListener('data', onData);
      request.removeListener('end', onEnd);
      request.removeListener('error', onError);
      request.removeListener('aborted', onAbort);
      signal.removeEventListener('abort', onAbort);
    };
    const fail = error => { cleanup(); reject(error); };
    const onData = chunk => {
      length += chunk.length;
      if (length > MAX_BODY_BYTES) { fail(failure('invalid_request', 413)); request.resume(); return; }
      chunks.push(chunk);
    };
    const onEnd = () => {
      cleanup();
      try { resolve(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)))); }
      catch { reject(failure('invalid_request', 400)); }
    };
    const onError = () => fail(failure('invalid_request', 400));
    const onAbort = () => fail(unavailable());
    request.on('data', onData);
    request.once('end', onEnd);
    request.once('error', onError);
    request.once('aborted', onAbort);
    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) onAbort();
  });
}

function respond(response, status, body) {
  if (response.writableEnded || response.destroyed) return;
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (body.retryAfterSeconds) response.setHeader('Retry-After', String(body.retryAfterSeconds));
  if (status >= 400) response.setHeader('Connection', 'close');
  response.end(JSON.stringify(body));
}

function errorResponse(response, error) {
  const known = { daily_budget_exceeded: 429, rate_limit_exceeded: 429, usage_unavailable: 503,
    unauthorized: 401, invalid_request: [400, 413, 415], not_found: 404, method_not_allowed: 405 };
  const allowed = known[error?.code];
  const valid = allowed !== undefined && (Array.isArray(allowed) ? allowed.includes(error.status) : allowed === error?.status);
  const status = valid ? error.status : 503;
  const body = { ok: false, code: valid ? error.code : 'usage_unavailable', status };
  if (valid && Number.isSafeInteger(error.retryAfterSeconds) && error.retryAfterSeconds > 0
    && error.retryAfterSeconds <= 86_400) body.retryAfterSeconds = error.retryAfterSeconds;
  respond(response, status, body);
}

/** Dependency injection keeps tests offline. The deployment bundle supplies the shared ledger core. */
function createBrokerServer({ core, env = process.env, fetchImpl = fetch, requestTimeoutMs = MAX_REQUEST_MS, logger } = {}) {
  if (!core) throw new Error('Ledger core is required. Run the broker build script.');
  const secret = env.DEMO_USAGE_BROKER_SECRET || '';
  if (!/^[\x21-\x7e]{32,4096}$/.test(secret) || (env.DEMO_USAGE_HASH_SECRET || '').length < 32
    || !env.DEMO_USAGE_BLOB_URL) throw new Error('Usage broker configuration is incomplete.');
  const digest = createHash('sha256').update(secret).digest();
  const logFailure = createFailureLogger(logger);
  const getAccessToken = createManagedIdentityTokenProvider({ env, fetchImpl, logger });
  const maxDuration = Math.min(MAX_REQUEST_MS, Math.max(1, requestTimeoutMs));
  const server = http.createServer({ maxHeaderSize: 16 * 1024 }, async (request, response) => {
    const controller = new AbortController();
    const deadline = Date.now() + maxDuration;
    const timer = setTimeout(() => { controller.abort(); errorResponse(response, unavailable()); }, maxDuration);
    try {
      if (request.method === 'GET' && request.url === '/health') { respond(response, 200, { ok: true }); return; }
      // Authentication is checked before any body parsing or ledger operation.
      const bearer = /^Bearer ([\x21-\x7e]{1,4096})$/.exec(request.headers.authorization || '');
      if (!bearer || !timingSafeEqual(digest, createHash('sha256').update(bearer[1]).digest())) {
        throw failure('unauthorized', 401);
      }
      if (!['/check', '/reserve', '/settle'].includes(request.url)) throw failure('not_found', 404);
      if (request.method !== 'POST') throw failure('method_not_allowed', 405);
      if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers['content-type'] || '')
        || request.headers['content-encoding']) throw failure('invalid_request', 415);
      const contentLength = request.headers['content-length'];
      if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_BODY_BYTES)) {
        throw failure('invalid_request', 413);
      }
      const payload = await readJson(request, controller.signal);
      if (!validPayload(request.url, payload)) throw failure('invalid_request', 400);
      if (controller.signal.aborted) throw unavailable();
      // Initial MI issuance can take several seconds. Obtain it before starting the
      // core's independent Blob request deadline, within the overall HTTP deadline.
      const accessToken = await bounded(getAccessToken(), Math.max(1, deadline - Date.now()), controller);
      if (controller.signal.aborted || Date.now() >= deadline) throw unavailable();
      const options = {
        blobUrl: env.DEMO_USAGE_BLOB_URL, hashSecret: env.DEMO_USAGE_HASH_SECRET,
        getAccessToken: async () => accessToken,
        operationTimeoutMs: Math.min(12_000, Math.max(1, deadline - Date.now())),
        fetchImpl: async (url, init) => {
          if (controller.signal.aborted) return Promise.reject(unavailable());
          // Node 22+ combines the core's per-operation deadline with the HTTP deadline.
          const signal = AbortSignal.any([controller.signal, init.signal]);
          try {
            const result = await fetchImpl(url, { ...init, signal });
            const azureErrorCode = result.headers.get('x-ms-error-code');
            if (!result.ok && result.status !== 412 && !(result.status === 404 && azureErrorCode === 'BlobNotFound')) {
              logFailure('blob', { status: result.status, azureErrorCode });
            }
            return result;
          } catch (error) {
            logFailure('blob', { reason: signal.aborted ? 'request_timeout' : 'network_error',
              errorName: error?.name || (signal.aborted ? 'AbortError' : 'Error') });
            throw unavailable();
          }
        },
      };
      if (request.url === '/check') {
        await core.checkDemoUsage(payload.ip, payload.microUsd, options);
        respond(response, 200, { ok: true });
      } else {
        const result = request.url === '/reserve'
          ? await core.reserveDemoUsage(payload.ip, payload.microUsd, options)
          : await core.settleDemoUsage(payload.reservation, payload.actualMicroUsd, options);
        respond(response, 200, { ok: true, result });
      }
    } catch (error) {
      errorResponse(response, error);
    } finally {
      clearTimeout(timer);
    }
  });
  server.requestTimeout = MAX_REQUEST_MS;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  server.maxRequestsPerSocket = 100;
  return server;
}

module.exports = { createBrokerServer, createManagedIdentityTokenProvider };

if (require.main === module) {
  try {
    const core = require('./demoUsageLedgerCore.cjs');
    const port = Number(process.env.PORT || 8080);
    if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port.');
    createBrokerServer({ core }).listen(port, '0.0.0.0');
  } catch {
    process.stderr.write('Usage broker startup failed. Check server configuration.\n');
    process.exitCode = 1;
  }
}
