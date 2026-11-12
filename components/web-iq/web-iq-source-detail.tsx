'use client';

import * as React from 'react';
import { ExternalLink, LoaderCircle, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { WebIqBotCheck } from '@/components/web-iq/web-iq-bot-check';
import { WebIqServiceLinks } from '@/components/web-iq/web-iq-service-links';
import type { WebIqBrowseResponse } from '@/lib/webIqBrowse';
import type { WebIqSearchResult } from '@/lib/webIqSearch';

interface Props {
  source: WebIqSearchResult;
  query: string;
  language: 'en' | 'ko';
  onClose?: () => void;
}

// Ephemeral state for the current source capabilities, so closing/reopening the
// drawer cannot reset the normal UI's two-request limit. No persisted history.
const sourceSessions = new Map<string, { attempts: number; result: WebIqBrowseResponse | null; message: string | null }>();
function rememberSource(key: string, change: Partial<{ attempts: number; result: WebIqBrowseResponse | null; message: string | null }>) {
  const previous = sourceSessions.get(key) || { attempts: 0, result: null, message: null };
  sourceSessions.set(key, { ...previous, ...change });
  if (sourceSessions.size > 40) sourceSessions.delete(sourceSessions.keys().next().value!);
}

const copy = {
  ko: {
    title: '선택한 출처의 관련 본문', close: '본문 닫기', original: '원문 열기', summary: '검색 요약',
    inspect: '관련 본문 확인', retry: '관련 본문 다시 확인', loading: '본문을 확인하고 있습니다…', cancel: '취소',
    checking: '사용 가능한 기능을 확인하고 있습니다…', unavailable: '이 환경에서는 Browse를 사용할 준비가 되지 않았습니다. 원문 링크를 이용해 주세요.',
    ticket: '본문 확인 권한이 없거나 만료됐습니다. 검색 결과를 새로 받아야 합니다. 원문 링크는 계속 이용할 수 있습니다.',
    hint: '선택한 검색 출처의 질문 관련 발췌를 조회합니다. 새 확인과 별도 유료 호출이 필요합니다. 답변을 다시 생성하지 않습니다.',
    pending: '본문 수집을 기다리고 있습니다. 자동으로 다시 조회하지 않습니다.', retryAt: '다시 확인 가능한 시각',
    max: '이 출처의 본문 확인은 이 화면에서 최대 두 번입니다. 새 검색 결과를 받거나 원문을 열어 주세요.',
    empty: '이 출처에서 관련 본문을 받지 못했습니다.', passage: 'Browse 관련 본문 발췌',
    boundary: '질문 관련 일부 발췌입니다. 문장 중간에서 잘리거나 페이지 앞부분이 반환될 수 있습니다. 전체 원문이 아닐 수 있습니다.',
    date: '공지일/적용 기간 확인 필요', retrieved: '조회 시각', crawled: '수집 시각', updated: '최종 갱신',
    failed: '관련 본문을 받지 못했습니다. 검색 요약과 원문 링크는 계속 이용할 수 있습니다.',
    blocked: '이 출처의 본문에 접근할 수 없습니다.', full: '전체 문서 형식 접근이 허용되지 않았습니다. 이 앱은 관련 발췌만 요청합니다.',
    policy: '발행처 또는 콘텐츠 정책으로 본문이 제한됐습니다.', access: '서비스 접근을 확인하지 못했습니다.',
    rate: '요청이 일시적으로 제한됐습니다. 원문의 안내 또는 표시된 시각을 확인해 주세요.',
    allowance: '조회 이용 한도를 확인하지 못해 요청을 중단했습니다. 잠시 후 다시 시도해 주세요.',
    daily: '오늘의 실제 조회 체험 한도를 모두 사용했습니다. 한국시간 자정 이후 다시 이용해 주세요.',
    bot: '계속하려면 확인을 다시 마쳐 주세요.', timeout: '응답을 기다리는 시간이 초과됐습니다.',
    cancelled: '요청을 취소했습니다. 이미 처리된 호출은 비용에 포함될 수 있습니다.',
    cost: '호출당 추가 추정 $0.001 · KB·인프라 제외 · 실제 청구 여부 미확인', details: '조회 정보',
    requestCount: '이 화면의 Browse 요청 수', searched: '검색 질문',
  },
  en: {
    title: 'Relevant passage from this source', close: 'Close passage', original: 'Open original page', summary: 'Search summary',
    inspect: 'Inspect relevant passage', retry: 'Inspect passage again', loading: 'Inspecting the passage…', cancel: 'Cancel',
    checking: 'Checking available features…', unavailable: 'Browse is not ready in this environment. You can open the original page.',
    ticket: 'Passage permission is missing or expired. Run a new search to receive fresh sources. The original link remains available.',
    hint: 'Retrieve a query-related extract from this selected search source. This needs fresh verification and a separate paid call. It does not regenerate the answer.',
    pending: 'A crawl is pending. The app will not poll or retry automatically.', retryAt: 'Earliest retry time',
    max: 'This screen permits at most two passage requests for this source. Run a new search or open the original page.',
    empty: 'No relevant passage was returned for this source.', passage: 'Browse relevant passage',
    boundary: 'This is a query-related excerpt. It can start or end mid-sentence, or fall back to the start of the page. It may not be the full page.',
    date: 'Publication date and effective period still need checking', retrieved: 'Retrieved', crawled: 'Crawled', updated: 'Last updated',
    failed: 'The passage could not be returned. The search summary and original link remain available.',
    blocked: "This source's passage is not accessible.", full: 'Full-document format access was denied. This app requests only relevant passages.',
    policy: 'Publisher or content policy restricts this passage.', access: 'Service access could not be verified.',
    rate: 'Requests are temporarily limited. Check the indicated retry time or original page.',
    allowance: 'The query allowance could not be checked, so the request stopped. Please try again later.',
    daily: "Today's shared demo allowance has been used. Please return after midnight Korea time.",
    bot: 'Please complete verification again to continue.', timeout: 'The request timed out.',
    cancelled: 'Request cancelled. Calls already processed may still incur cost.',
    cost: 'Added estimate $0.001 per call · KB/infrastructure excluded · actual billing unconfirmed', details: 'Retrieval details',
    requestCount: 'Browse requests on this screen', searched: 'Search question',
  },
};

function safeExternalUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function parseBrowseResponse(value: unknown, sourceId: string): WebIqBrowseResponse | null {
  if (!value || typeof value !== 'object') return null;
  const result = value as WebIqBrowseResponse;
  if (result.schemaVersion !== 'webiq.browse.response.v1' || result.sourceId !== sourceId) return null;
  if (result.status === 'pending') return typeof result.retryAt === 'string' || result.retryAt === null ? result : null;
  return (result.status === 'passage' || result.status === 'empty') && typeof result.content === 'string'
    && typeof result.title === 'string' && typeof result.url === 'string' && Boolean(safeExternalUrl(result.url)) ? result : null;
}

/** Native modal dialog supplies focus containment, Escape and trigger focus restoration. */
export function WebIqSourceDetail({ source, query, language, onClose }: Props) {
  const text = copy[language];
  const sessionKey = source.sourceTicket || `${source.sourceId}:${source.url}:${query}`;
  const id = React.useId();
  const dialog = React.useRef<HTMLDialogElement>(null);
  const closeCallback = React.useRef(onClose);
  closeCallback.current = onClose;
  const active = React.useRef<AbortController | null>(null);
  const inFlight = React.useRef(false);
  const [readiness, setReadiness] = React.useState<'checking' | 'ready' | 'unavailable'>('checking');
  const [siteKey, setSiteKey] = React.useState<string | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [resetKey, setResetKey] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<WebIqBrowseResponse | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [attempts, setAttempts] = React.useState(0);
  const [now, setNow] = React.useState(0);
  const safeUrl = safeExternalUrl(source.url);
  const pending = result?.status === 'pending' ? result : null;
  const retryAt = pending?.retryAt ? Date.parse(pending.retryAt) : NaN;
  const canRetry = Boolean(pending?.retryTicket) && attempts < 2 && Number.isFinite(retryAt) && now >= retryAt;
  const ticket = attempts === 0 ? source.sourceTicket : canRetry ? pending?.retryTicket : null;
  const canRequest = readiness === 'ready' && Boolean(ticket && token && source.sourceId) && !loading && (attempts === 0 || canRetry);

  React.useEffect(() => {
    const modal = dialog.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const alreadyLocked = document.body.classList.contains('overflow-hidden');
    document.body.classList.add('overflow-hidden');
    modal?.showModal();
    return () => {
      active.current?.abort();
      if (modal?.open) modal.close();
      if (!alreadyLocked) document.body.classList.remove('overflow-hidden');
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);

  React.useEffect(() => {
    active.current?.abort();
    inFlight.current = false;
    const remembered = sourceSessions.get(sessionKey);
    setLoading(false); setResult(remembered?.result || null); setMessage(remembered?.message || null);
    setAttempts(remembered?.attempts || 0); setToken(null);
    setReadiness('checking'); setSiteKey(null);
    const controller = new AbortController();
    let disposed = false;
    const timer = window.setTimeout(() => controller.abort(), 10_000);
    void fetch('/api/web-iq/browse', { cache: 'no-store', signal: controller.signal }).then(async response => {
      const payload = await response.json();
      if (controller.signal.aborted) return;
      const ready = response.ok && payload.configured === true && payload.botProtectionConfigured === true
        && typeof payload.turnstileSiteKey === 'string';
      setReadiness(ready ? 'ready' : 'unavailable');
      setSiteKey(ready ? payload.turnstileSiteKey : null);
    }).catch(() => { if (!disposed) setReadiness('unavailable'); }).finally(() => window.clearTimeout(timer));
    return () => { disposed = true; controller.abort(); window.clearTimeout(timer); active.current?.abort(); };
  }, [source.sourceId, source.sourceTicket, query, language, sessionKey]);

  React.useEffect(() => {
    if (!pending?.retryAt) return;
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 1_000);
    return () => window.clearInterval(timer);
  }, [pending?.retryAt]);

  const setNotice = (value: string | null) => {
    rememberSource(sessionKey, { message: value }); setMessage(value);
  };

  const cancel = () => {
    active.current?.abort(); active.current = null; inFlight.current = false;
    setLoading(false); setNotice(text.cancelled); setToken(null); setResetKey(value => value + 1);
  };

  async function inspect() {
    if (!canRequest || !ticket || !token || !source.sourceId || inFlight.current) return;
    inFlight.current = true;
    const controller = new AbortController();
    active.current = controller;
    const submissionToken = token;
    rememberSource(sessionKey, { attempts: attempts + 1, message: null });
    setToken(null); setLoading(true); setNotice(null); setAttempts(value => value + 1);
    const timer = window.setTimeout(() => { controller.abort(); setNotice(text.timeout); }, 35_000);
    try {
      const response = await fetch('/api/web-iq/browse', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ schemaVersion: 'webiq.browse.request.v1', sourceId: source.sourceId,
          sourceTicket: ticket, turnstileToken: submissionToken }),
      });
      const payload = await response.json().catch(() => null);
      if (controller.signal.aborted || active.current !== controller) return;
      if (!response.ok) {
        const code = typeof payload?.code === 'string' ? payload.code : '';
        const notice = code === 'BROWSE_SOURCE_EXPIRED_OR_INVALID' ? text.ticket
          : code === 'BROWSE_FULL_CONTENT_FORBIDDEN' ? text.full
            : code === 'BROWSE_POLICY_BLOCKED' ? text.policy
              : code === 'BROWSE_ACCESS_DENIED' ? text.access
                : code === 'BROWSE_RATE_LIMITED' || code === 'RATE_LIMITED' ? text.rate
                  : code === 'DAILY_BUDGET_EXHAUSTED' ? text.daily
                    : code === 'USAGE_GUARD_UNAVAILABLE' ? text.allowance
                      : code.startsWith('BOT_CHECK_') ? text.bot
                        : code === 'BROWSE_TIMEOUT' ? text.timeout : response.status === 403 ? text.blocked : text.failed;
        const seconds = payload?.retryAfterSeconds;
        const header = response.headers.get('Retry-After');
        const deadline = typeof payload?.retryAt === 'string' ? Date.parse(payload.retryAt)
          : Number.isSafeInteger(seconds) && seconds > 0 && seconds <= 86_400 ? Date.now() + seconds * 1_000
            : header && /^\d+$/.test(header) && Number(header) > 0 && Number(header) <= 86_400 ? Date.now() + Number(header) * 1_000 : NaN;
        setNotice(Number.isFinite(deadline) && deadline > Date.now()
          ? `${notice} ${text.retryAt}: ${new Date(deadline).toISOString()}` : notice);
        return;
      }
      const parsed = parseBrowseResponse(payload, source.sourceId);
      if (!parsed) { setNotice(text.failed); return; }
      rememberSource(sessionKey, { result: parsed });
      setResult(parsed);
    } catch {
      if (!controller.signal.aborted && active.current === controller) setNotice(text.failed);
    } finally {
      window.clearTimeout(timer);
      if (active.current === controller) {
        active.current = null; inFlight.current = false; setLoading(false); setToken(null); setResetKey(value => value + 1);
      }
    }
  }

  const close = () => { dialog.current?.close(); closeCallback.current?.(); };

  return (
    <dialog ref={dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-hint`}
      className="fixed inset-y-0 left-auto right-0 m-0 h-[100dvh] max-h-[100dvh] w-full max-w-none border-l border-stroke-divider bg-bg-card p-0 text-fg-default shadow-2xl backdrop:bg-black/40 sm:w-[min(480px,70vw)]"
      onCancel={event => { event.preventDefault(); close(); }}>
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-stroke-divider p-5">
          <h2 id={`${id}-title`} className="text-lg font-semibold">{text.title}</h2>
          <Button aria-label={text.close} variant="ghost" className="h-11 w-11 shrink-0 p-2" onClick={close}><X className="h-5 w-5" aria-hidden="true" /></Button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
          <p className="text-xs font-medium text-accent">{source.sourceId || 'Web'} · {safeUrl ? new URL(safeUrl).hostname : ''}</p>
          <h3 className="mt-2 break-words text-base font-semibold">{source.title}</h3>
          {safeUrl && <a className="mt-2 inline-flex min-h-11 items-center gap-2 break-words text-sm text-accent hover:underline" href={safeUrl} target="_blank" rel="noopener noreferrer">{text.original}<ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" /></a>}
          <section className="mt-5 rounded-xl border border-stroke-divider p-4">
            <h3 className="text-sm font-semibold">{text.summary}</h3>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-fg-muted">{source.content}</p>
          </section>
          <p id={`${id}-hint`} className="mt-5 text-sm leading-6 text-fg-muted">{text.hint}</p>
          <p className="mt-2 text-xs leading-5 text-fg-subtle">{text.cost}</p>
          {!source.sourceTicket && <p role="status" className="mt-4 text-sm text-fg-muted">{text.ticket}</p>}
          {readiness !== 'ready' && <p role="status" className="mt-4 text-sm text-fg-muted">{readiness === 'checking' ? text.checking : text.unavailable}</p>}
          {readiness === 'ready' && siteKey && source.sourceTicket && attempts < 2 && (attempts === 0 || pending?.retryTicket) && (
            <div className="mt-4"><WebIqBotCheck siteKey={siteKey} action="webiq_browse" language={language} onTokenChange={setToken} resetKey={resetKey} /></div>
          )}
          {pending && <div role="status" className="mt-4 rounded-xl border border-stroke-divider bg-bg-subtle p-4 text-sm leading-6">
            <p>{text.pending}</p>
            {pending.retryAt && <p className="mt-2 break-words">{text.retryAt}: {pending.retryAt}</p>}
            {(!pending.retryTicket || attempts >= 2) && <p className="mt-2">{text.max}</p>}
          </div>}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button disabled={!canRequest} onClick={() => void inspect()}>
              {loading && <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />}
              {loading ? text.loading : attempts === 0 ? text.inspect : text.retry}
            </Button>
            {loading && <Button variant="outline" onClick={cancel}>{text.cancel}</Button>}
          </div>
          {message && <p role="alert" className="mt-4 text-sm leading-6 text-fg-muted">{message}</p>}
          {result && result.status !== 'pending' && <section className="mt-6 rounded-xl border border-accent/30 p-4" aria-live="polite">
            <h3 className="text-sm font-semibold">{text.passage}</h3>
            <p className="mt-2 break-words text-sm font-medium">{result.title}</p>
            <a className="mt-1 inline-flex min-h-11 items-center gap-2 break-all text-xs text-accent hover:underline" href={result.url} target="_blank" rel="noopener noreferrer">{result.url}<ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /></a>
            <p className="mt-2 text-xs leading-5 text-fg-muted">{text.boundary}</p>
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6">{result.status === 'empty' ? text.empty : result.content}</p>
            <p className="mt-3 text-xs text-fg-muted">{text.date}</p>
            <dl className="mt-3 space-y-1 break-words text-xs text-fg-subtle">
              <div><dt className="inline">{text.retrieved}: </dt><dd className="inline">{result.retrievedAt}</dd></div>
              {result.crawledAt && <div><dt className="inline">{text.crawled}: </dt><dd className="inline">{result.crawledAt}</dd></div>}
              {result.lastUpdatedAt && <div><dt className="inline">{text.updated}: </dt><dd className="inline">{result.lastUpdatedAt}</dd></div>}
            </dl>
          </section>}
          <details className="mt-5 text-xs leading-5 text-fg-muted">
            <summary className="cursor-pointer py-3">{text.details}</summary>
            <p className="break-words">{text.searched}: {query}</p>
            <p>{text.requestCount}: {attempts}</p>
            <p className="mt-2 break-all">{source.url}</p>
          </details>
        </div>
        <footer className="shrink-0 border-t border-stroke-divider p-4"><WebIqServiceLinks features={['browse-passage']} locale={language} /></footer>
      </div>
    </dialog>
  );
}
