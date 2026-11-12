import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';

import type { WebIqSearchResult } from '@/lib/webIqSearch';

const AUDIENCE = 'webiq.browse.v1';
const LIFETIME_MS = 600_000;
const MAX_TICKET_LENGTH = 8_192;

export interface WebIqSourceTicket {
  audience: typeof AUDIENCE;
  sourceId: string;
  url: string;
  query: string;
  issuedAt: number;
  expiresAt: number;
  notBefore: number;
  attempt: 1 | 2;
  nonce: string;
}

/** Public HTTPS destinations only. The application never fetches this URL itself. */
export function safeWebIqBrowseUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2_048 || value !== value.trim() || value.includes('#')
    || /[\u0000-\u0020\u007f\\]/.test(value)) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.port
      || isIP(host) || host.startsWith('[') || !host.includes('.')
      || /(?:^|\.)(?:localhost|local|internal|intranet|home|lan|test|invalid|example)$/.test(host)
      || host === 'metadata.google.internal' || host === 'metadata.azure.com'
      || host === 'instance-data.ec2.internal' || host.endsWith('.localhost')) return null;
    const allowed = (process.env.WEBIQ_BROWSE_ALLOWED_HOSTS || '').split(',')
      .map(item => item.trim().toLowerCase()).filter(Boolean);
    if (allowed.length && !allowed.includes(host)) return null;
    return url.href;
  } catch { return null; }
}

function signingSecret(): string | null {
  const secret = process.env.WEBIQ_SOURCE_TICKET_SECRET || '';
  return secret.length >= 32 && secret.length <= 4_096 && !/\s/.test(secret) ? secret : null;
}

export function isWebIqSourceTicketConfigured(): boolean {
  return signingSecret() !== null;
}

function sign(value: WebIqSourceTicket): string | null {
  const secret = signingSecret();
  if (!secret) return null;
  const body = Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
}

/** Tickets originate only from the server's normalized public Web Search results. */
export function attachWebIqSourceTickets(results: WebIqSearchResult[], query: string): WebIqSearchResult[] {
  const normalizedQuery = query.trim();
  const now = Date.now();
  return results.map((result, index) => {
    const sourceId = `W${index + 1}`;
    const url = safeWebIqBrowseUrl(result.url);
    const sourceTicket = url && normalizedQuery && normalizedQuery.length <= 1_000 ? sign({
      audience: AUDIENCE, sourceId, url, query: normalizedQuery,
      issuedAt: now, expiresAt: now + LIFETIME_MS, notBefore: now,
      attempt: 1, nonce: randomUUID(),
    }) : null;
    return { ...result, sourceId, ...(sourceTicket ? { sourceTicket } : {}) };
  });
}

/** A capability is integrity/expiry bound; it is not a global exactly-once replay claim. */
export function verifyWebIqSourceTicket(ticket: string, sourceId: string, now = Date.now()): WebIqSourceTicket | null {
  const secret = signingSecret();
  if (!secret || typeof ticket !== 'string' || ticket.length > MAX_TICKET_LENGTH) return null;
  const parts = ticket.split('.');
  if (parts.length !== 2 || !parts.every(part => /^[A-Za-z0-9_-]+$/.test(part))) return null;
  const [body, signature] = parts;
  const expected = createHmac('sha256', secret).update(body).digest();
  const supplied = Buffer.from(signature, 'base64url');
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  let value: WebIqSourceTicket;
  try { value = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch { return null; }
  const fields = ['audience', 'sourceId', 'url', 'query', 'issuedAt', 'expiresAt', 'notBefore', 'attempt', 'nonce'];
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).length !== fields.length || !fields.every(key => key in value)
    || value.audience !== AUDIENCE || value.sourceId !== sourceId || !/^W[1-5]$/.test(value.sourceId)
    || typeof value.query !== 'string' || !value.query.trim() || value.query.length > 1_000
    || safeWebIqBrowseUrl(value.url) !== value.url || ![1, 2].includes(value.attempt)
    || typeof value.nonce !== 'string' || !/^[0-9a-f-]{36}$/.test(value.nonce)
    || ![value.issuedAt, value.expiresAt, value.notBefore].every(Number.isSafeInteger)
    || value.expiresAt - value.issuedAt !== LIFETIME_MS || value.issuedAt > now
    || now >= value.expiresAt || value.notBefore < value.issuedAt
    || value.notBefore >= value.expiresAt || now < value.notBefore) return null;
  return value;
}

export function createWebIqBrowseRetryTicket(ticket: WebIqSourceTicket, retryAt: string): string | null {
  const notBefore = Date.parse(retryAt);
  if (ticket.attempt !== 1 || !Number.isSafeInteger(notBefore)
    || notBefore < Date.now() || notBefore >= ticket.expiresAt) return null;
  return sign({ ...ticket, attempt: 2, notBefore, nonce: randomUUID() });
}
