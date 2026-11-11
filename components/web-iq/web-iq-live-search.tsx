'use client';

import * as React from 'react';
import Link from 'next/link';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle';
import Search from 'lucide-react/dist/esm/icons/search';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { WebIqBotCheck } from '@/components/web-iq/web-iq-bot-check';
import { WEB_IQ_DEMO_QUESTIONS } from '@/lib/webIqDemoQuestions';
import { WEB_IQ_SEARCH_DOCUMENTATION, type WebIqSearchResponse } from '@/lib/webIqSearch';
import { cn } from '@/lib/utils';

const copy = {
  en: {
    title: 'Try searching real public-web sources',
    description: 'Use Microsoft Web IQ to find notices and web pages, then check the evidence behind a decision.',
    boundary: 'Results from this live search do not automatically update the fictional shipment recommendations above.',
    reviewTitle: 'Three checks before using a result',
    routeTitle: 'Does it affect your route?',
    routeHint: 'Match the road name and affected section in the notice to your actual shipment route.',
    dateTitle: 'When does the restriction apply?',
    dateHint: 'Check the notice date and restriction period in the original. Crawl and retrieval times are different.',
    sourceTitle: 'Who published the notice?',
    sourceHint: 'Open a result title to check the original page and the issuing organization.',
    combinedTitle: 'Use web evidence with your own knowledge base',
    combinedHint: 'In Foundry IQ, choose a knowledge base, then select “Internal + Web IQ” before asking your question.',
    combinedLink: 'Ask with your KB and Web IQ',
    checking: 'Checking server settings…',
    configured: 'Live search is ready · verify below, then search',
    unconfigured: 'Live search is unavailable until server authentication and bot protection are configured.',
    statusError: 'Could not check server settings.',
    retry: 'Check again',
    label: 'Choose a question to try',
    customToggle: 'Ask your own question',
    customLabel: 'Your question',
    customPlaceholder: 'For example, what road restrictions has Incheon Port announced recently?',
    customHint: 'Enter 3–500 characters. Use public information and leave out confidential details.',
    characters: 'characters',
    queryHint: 'Only the selected or entered question is sent to Web IQ. The example shipment records are not sent.',
    limits: 'Live search allows up to 100 requests per IP in the last 2 minutes and has a daily allowance shared by all visitors. The example scenario remains available.',
    submit: 'Search the web',
    searching: 'Searching…',
    cancel: 'Cancel search',
    cancelled: 'Search cancelled.',
    unavailable: 'Live search is not configured on this server.',
    failure: 'Search failed. Please try again.',
    timeout: 'Search timed out. Please try again.',
    throttled: 'Search requests are temporarily limited. Try again later.',
    dailyLimit: 'Today’s live-search demo allowance has been used. Please return after midnight Korea time.',
    guardUnavailable: 'We could not check the search allowance. Please try again shortly. You can still explore the example scenario.',
    availableIn: 'Search available in',
    invalid: 'Choose a sample question or enter a question of 3–500 characters.',
    botRequired: 'Complete the verification before searching.',
    botFailed: 'Verification was not accepted. Please verify again and retry.',
    botUnavailable: 'Verification is temporarily unavailable. Please try again shortly.',
    empty: 'No usable results for this query.',
    results: 'Web results',
    searched: 'Query',
    retrieved: 'Retrieved',
    crawled: 'Crawled',
    updated: 'Last updated',
    docs: 'Web IQ API documentation',
  },
  ko: {
    title: '실제 공개 웹 자료도 찾아보세요',
    description: 'Microsoft Web IQ로 공지와 웹 페이지를 찾아, 판단에 필요한 근거를 확인합니다.',
    boundary: '여기서 조회한 실제 웹 자료는 위 가상 화물의 대응 제안에 자동으로 반영되지 않습니다.',
    reviewTitle: '검색 결과를 활용하기 전에 세 가지를 확인하세요',
    routeTitle: '우리 경로와 겹치나요?',
    routeHint: '공지의 도로명과 통제 구간을 실제 운송 경로와 맞춰 보세요.',
    dateTitle: '언제부터 언제까지인가요?',
    dateHint: '원문의 공지일과 통제 기간을 확인하세요. 수집·조회 시각과는 다릅니다.',
    sourceTitle: '누가 낸 공지인가요?',
    sourceHint: '결과 제목을 눌러 원문과 공지를 낸 기관을 확인하세요.',
    combinedTitle: '내 지식 베이스에 웹 근거를 더하려면',
    combinedHint: 'Foundry IQ에서 지식 베이스를 고른 뒤, ‘내부 지식 + Web IQ’를 선택하고 질문하세요.',
    combinedLink: '내 지식 베이스와 웹을 함께 조회하기',
    checking: '서버 설정 확인 중…',
    configured: '실제 검색 준비 완료 · 아래 확인을 마친 뒤 검색하세요',
    unconfigured: '서버 인증과 봇 방지 설정을 마치면 실제 웹 검색을 이용할 수 있습니다.',
    statusError: '서버 설정을 확인하지 못했습니다.',
    retry: '다시 확인',
    label: '검색해 볼 질문을 선택하세요',
    customToggle: '직접 질문하기',
    customLabel: '궁금한 내용을 입력하세요',
    customPlaceholder: '예: 인천항에서 최근 발표한 도로 통제 공지가 있나요?',
    customHint: '3~500자로 입력하세요. 공개 자료에 관한 질문을 적고, 기밀 정보는 넣지 마세요.',
    characters: '자',
    queryHint: '선택하거나 입력한 질문만 Web IQ로 전달합니다. 예시 화물 자료는 전송하지 않습니다.',
    limits: '실제 검색은 같은 IP에서 최근 2분간 최대 100회까지 이용할 수 있으며, 모든 방문자가 하루 체험 한도를 함께 사용합니다. 예시 시나리오는 계속 이용할 수 있습니다.',
    submit: '웹 검색',
    searching: '검색 중…',
    cancel: '검색 취소',
    cancelled: '검색을 취소했습니다.',
    unavailable: '이 서버에 실제 웹 검색이 설정되지 않았습니다.',
    failure: '웹 검색에 실패했습니다. 다시 시도해 주세요.',
    timeout: '검색 시간이 초과됐습니다. 다시 시도해 주세요.',
    throttled: '검색 요청이 일시적으로 제한됐습니다. 잠시 후 다시 시도해 주세요.',
    dailyLimit: '오늘의 실제 검색 체험 한도를 모두 사용했습니다. 한국시간 자정 이후 다시 이용해 주세요.',
    guardUnavailable: '검색 이용 한도를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요. 예시 시나리오는 계속 이용할 수 있습니다.',
    availableIn: '다시 검색할 수 있을 때까지',
    invalid: '예시 질문을 고르거나 질문을 3~500자로 입력해 주세요.',
    botRequired: '검색 전에 아래 확인을 마쳐 주세요.',
    botFailed: '확인이 승인되지 않았습니다. 다시 확인한 뒤 검색해 주세요.',
    botUnavailable: '지금은 확인 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
    empty: '사용할 수 있는 검색 결과가 없습니다.',
    results: '웹 검색 결과',
    searched: '검색어',
    retrieved: '조회 시각',
    crawled: '수집 시각',
    updated: '최종 갱신',
    docs: 'Web IQ API 문서',
  },
};

type ConfigurationState = 'checking' | 'configured' | 'unconfigured' | 'error';
type UsageCode = 'RATE_LIMITED' | 'DAILY_BUDGET_EXHAUSTED' | 'USAGE_GUARD_UNAVAILABLE' | 'QUESTION_NOT_ALLOWED';
type UsageNotice = { code: UsageCode; retryAt: number | null };

function isUsageCode(value: unknown): value is UsageCode {
  return value === 'RATE_LIMITED' || value === 'DAILY_BUDGET_EXHAUSTED'
    || value === 'USAGE_GUARD_UNAVAILABLE' || value === 'QUESTION_NOT_ALLOWED';
}

function getRetryDeadline(response: Response, payload: Record<string, unknown>): number | null {
  const now = Date.now();
  if (typeof payload.retryAfterSeconds === 'number' && Number.isFinite(payload.retryAfterSeconds) && payload.retryAfterSeconds > 0) {
    return now + Math.ceil(payload.retryAfterSeconds) * 1000;
  }
  const retryAfter = response.headers.get('Retry-After');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds > 0) return now + Math.ceil(seconds) * 1000;
    const date = Date.parse(retryAfter);
    if (Number.isFinite(date) && date > now) return date;
  }
  const reset = typeof payload.resetsAt === 'string' ? Date.parse(payload.resetsAt) : NaN;
  return Number.isFinite(reset) && reset > now ? reset : null;
}

function formatCountdown(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours, minutes, remainder].map(value => String(value).padStart(2, '0')).join(':');
}

function safeResultUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function isSearchResponse(value: unknown): value is WebIqSearchResponse {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<WebIqSearchResponse>;
  return typeof payload.query === 'string'
    && typeof payload.retrievedAt === 'string'
    && Array.isArray(payload.results)
    && payload.results.every((result) => result && typeof result.title === 'string'
      && typeof result.url === 'string' && typeof result.content === 'string');
}

export function WebIqLiveSearch({ language }: { language: 'en' | 'ko' }) {
  const text = copy[language];
  const id = React.useId();
  const [questionId, setQuestionId] = React.useState(WEB_IQ_DEMO_QUESTIONS[0].id);
  const [customMode, setCustomMode] = React.useState(false);
  const [customQuery, setCustomQuery] = React.useState('');
  const [turnstileSiteKey, setTurnstileSiteKey] = React.useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);
  const [botResetKey, setBotResetKey] = React.useState(0);
  const [configuration, setConfiguration] = React.useState<ConfigurationState>('checking');
  const [statusAttempt, setStatusAttempt] = React.useState(0);
  const [result, setResult] = React.useState<WebIqSearchResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [cancelled, setCancelled] = React.useState(false);
  const [usageNotice, setUsageNotice] = React.useState<UsageNotice | null>(null);
  const [now, setNow] = React.useState(0);
  const activeRequest = React.useRef<AbortController | null>(null);
  const customInput = React.useRef<HTMLTextAreaElement>(null);
  const selectedQuestion = WEB_IQ_DEMO_QUESTIONS.find(question => question.id === questionId) || WEB_IQ_DEMO_QUESTIONS[0];
  const normalizedQuery = (customMode ? customQuery : selectedQuestion[language]).trim();
  const validQuery = normalizedQuery.length >= 3 && normalizedQuery.length <= 500;
  const visibleResult = result?.query === normalizedQuery ? result : null;
  const remainingSeconds = usageNotice?.retryAt ? Math.max(0, Math.ceil((usageNotice.retryAt - now) / 1000)) : 0;
  const usageMessage = usageNotice?.code === 'DAILY_BUDGET_EXHAUSTED' ? text.dailyLimit
    : usageNotice?.code === 'USAGE_GUARD_UNAVAILABLE' ? text.guardUnavailable
      : usageNotice?.code === 'QUESTION_NOT_ALLOWED' ? text.invalid : text.throttled;

  React.useEffect(() => {
    const retryAt = usageNotice?.retryAt;
    if (!retryAt) return;
    const tick = () => {
      const current = Date.now();
      setNow(current);
      if (current >= retryAt) setUsageNotice(null);
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [usageNotice]);

  React.useEffect(() => {
    const controller = new AbortController();
    setConfiguration('checking');
    setTurnstileSiteKey(null);
    setTurnstileToken(null);
    const timeout = window.setTimeout(() => {
      controller.abort();
      setConfiguration('error');
    }, 10000);

    async function checkConfiguration() {
      try {
        const response = await fetch('/api/web-iq/search', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Configuration unavailable');
        const payload: unknown = await response.json();
        if (!payload || typeof payload !== 'object' || !('configured' in payload)
          || typeof payload.configured !== 'boolean') throw new Error('Invalid configuration');
        if (!controller.signal.aborted) {
          const siteKey = 'turnstileSiteKey' in payload && typeof payload.turnstileSiteKey === 'string'
            ? payload.turnstileSiteKey.trim() : null;
          const botConfigured = 'botProtectionConfigured' in payload && payload.botProtectionConfigured === true;
          const configured = payload.configured && botConfigured && Boolean(siteKey);
          setTurnstileSiteKey(configured ? siteKey : null);
          setConfiguration(configured ? 'configured' : 'unconfigured');
        }
      } catch {
        if (!controller.signal.aborted) setConfiguration('error');
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void checkConfiguration();
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [statusAttempt]);

  React.useEffect(() => () => activeRequest.current?.abort(), []);

  React.useEffect(() => {
    if (customMode) customInput.current?.focus();
  }, [customMode]);

  function clearPreviousSearch() {
    setResult(null);
    setError(null);
    setCancelled(false);
    if (usageNotice?.code === 'QUESTION_NOT_ALLOWED') setUsageNotice(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || configuration !== 'configured' || (usageNotice?.retryAt && usageNotice.retryAt > Date.now())) return;
    if (!validQuery) {
      setError(text.invalid);
      return;
    }
    if (!turnstileToken) {
      setError(text.botRequired);
      return;
    }

    const submissionToken = turnstileToken;
    setTurnstileToken(null);
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setResult(null);
    setError(null);
    setUsageNotice(null);
    setCancelled(false);
    setLoading(true);
    const timeout = window.setTimeout(() => {
      if (activeRequest.current === controller) {
        controller.abort();
        setError(text.timeout);
        setLoading(false);
      }
    }, 35000);

    try {
      const response = await fetch('/api/web-iq/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: normalizedQuery, turnstileToken: submissionToken }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const rawPayload: unknown = await response.json().catch(() => null);
        if (controller.signal.aborted || activeRequest.current !== controller) return;
        const payload = rawPayload && typeof rawPayload === 'object' ? rawPayload as Record<string, unknown> : {};
        if (payload.code === 'BOT_CHECK_REQUIRED' || payload.code === 'BOT_CHECK_FAILED' || payload.code === 'BOT_CHECK_UNAVAILABLE') {
          throw new Error(payload.code === 'BOT_CHECK_REQUIRED' ? text.botRequired
            : payload.code === 'BOT_CHECK_FAILED' ? text.botFailed : text.botUnavailable);
        }
        const code = isUsageCode(payload.code) ? payload.code : response.status === 429 ? 'RATE_LIMITED' : null;
        if (code) {
          setNow(Date.now());
          setUsageNotice({ code, retryAt: getRetryDeadline(response, payload) });
          return;
        }
        const message = response.status === 503 ? text.unavailable
          : response.status === 504 ? text.timeout
            : response.status === 400 ? text.invalid : text.failure;
        if (response.status === 503) setConfiguration('unconfigured');
        throw new Error(message);
      }
      const payload: unknown = await response.json();
      if (!isSearchResponse(payload) || payload.query !== normalizedQuery) throw new Error(text.failure);
      if (!controller.signal.aborted && activeRequest.current === controller) setResult(payload);
    } catch (cause) {
      if (!controller.signal.aborted && activeRequest.current === controller) {
        setError(cause instanceof Error && Object.values(text).includes(cause.message)
          ? cause.message : text.failure);
      }
    } finally {
      window.clearTimeout(timeout);
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoading(false);
        setTurnstileToken(null);
        setBotResetKey(value => value + 1);
      }
    }
  }

  function cancelSearch() {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setLoading(false);
    setCancelled(true);
    setError(null);
    setTurnstileToken(null);
    setBotResetKey(value => value + 1);
  }

  const statusText = configuration === 'error' ? text.statusError : text[configuration];
  const safeResults = visibleResult?.results.filter((item) => safeResultUrl(item.url)) ?? [];

  return (
    <section aria-labelledby={`${id}-title`} className="rounded-2xl border border-stroke-divider bg-bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={`${id}-title`} className="text-lg font-semibold text-fg-default">{text.title}</h2>
          <p className="mt-1 text-sm text-fg-muted">{text.description}</p>
        </div>
        <a href={WEB_IQ_SEARCH_DOCUMENTATION} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline">
          {text.docs}<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
      <p className="mt-3 text-xs leading-5 text-fg-subtle">{text.boundary}</p>
      <div className="mt-5 rounded-xl bg-bg-subtle p-4">
        <h3 className="text-sm font-medium text-fg-default">{text.reviewTitle}</h3>
        <ol className="mt-3 grid gap-4 sm:grid-cols-3">
          {[
            { title: text.routeTitle, hint: text.routeHint },
            { title: text.dateTitle, hint: text.dateHint },
            { title: text.sourceTitle, hint: text.sourceHint },
          ].map((step, index) => (
            <li key={step.title} className="min-w-0">
              <p className="text-xs font-semibold text-fg-default"><span className="mr-1.5 text-accent">{index + 1}.</span>{step.title}</p>
              <p className="mt-1.5 text-xs leading-5 text-fg-muted">{step.hint}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-fg-muted" role="status">
        <span>{statusText}</span>
        {(configuration === 'error' || configuration === 'unconfigured') && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setStatusAttempt((value) => value + 1)}>{text.retry}</Button>
        )}
      </div>

      <form onSubmit={submit} className="mt-5 space-y-3" aria-busy={loading}>
        <fieldset disabled={loading} aria-describedby={`${id}-hint`}>
          <legend className="mb-3 text-sm font-medium text-fg-default">{text.label}</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {WEB_IQ_DEMO_QUESTIONS.map(question => (
              <button key={question.id} type="button" aria-pressed={!customMode && questionId === question.id}
                className={cn('rounded-xl border p-4 text-left text-sm leading-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60', !customMode && questionId === question.id ? 'border-accent bg-accent/10 text-fg-default' : 'border-stroke-divider text-fg-muted hover:border-accent/50')}
                onClick={() => {
                  if (!customMode && question.id === questionId) return;
                  setQuestionId(question.id);
                  setCustomMode(false);
                  clearPreviousSearch();
                }}>
                {question[language]}
              </button>
            ))}
          </div>
          <Button type="button" variant={customMode ? 'secondary' : 'outline'} className="mt-3"
            aria-expanded={customMode} aria-controls={`${id}-custom-question`}
            onClick={() => {
              setCustomMode(value => !value);
              clearPreviousSearch();
            }}>{text.customToggle}</Button>
          <div id={`${id}-custom-question`} hidden={!customMode} className="mt-4 space-y-2">
            <label htmlFor={`${id}-query`} className="block text-sm font-medium text-fg-default">{text.customLabel}</label>
            <Textarea ref={customInput} id={`${id}-query`} value={customQuery} minLength={3} maxLength={500}
              rows={3} disabled={!customMode || loading} placeholder={text.customPlaceholder} aria-describedby={`${id}-custom-hint ${id}-counter`}
              onChange={(event) => {
                setCustomQuery(event.target.value);
                clearPreviousSearch();
              }} />
            <div className="flex flex-wrap items-start justify-between gap-2 text-xs text-fg-muted">
              <p id={`${id}-custom-hint`} className="max-w-prose leading-5">{text.customHint}</p>
              <span id={`${id}-counter`} className="shrink-0 tabular-nums">{customQuery.length} / 500 {text.characters}</span>
            </div>
          </div>
        </fieldset>
        {configuration === 'configured' && turnstileSiteKey && (
          <WebIqBotCheck siteKey={turnstileSiteKey} action="webiq_search" language={language}
            onTokenChange={setTurnstileToken} resetKey={botResetKey} />
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={configuration !== 'configured' || !validQuery || !turnstileToken || loading || remainingSeconds > 0}>
            {loading ? <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
            {loading ? text.searching : text.submit}
          </Button>
          {loading && <Button type="button" variant="outline" onClick={cancelSearch}>{text.cancel}</Button>}
        </div>
        <p id={`${id}-hint`} className="text-xs leading-5 text-fg-muted">{text.queryHint}</p>
        <p className="text-xs leading-5 text-fg-subtle">{text.limits}</p>
      </form>

      {usageNotice && <div className="mt-4 rounded-lg border border-stroke-divider bg-bg-subtle p-4 text-sm text-fg-muted">
        <p role="alert">{usageMessage}</p>
        {remainingSeconds > 0 && <p className="mt-2 font-medium tabular-nums text-fg-default" aria-live="off">{text.availableIn} {formatCountdown(remainingSeconds)}</p>}
      </div>}
      {error && <p role="alert" className="mt-4 text-sm text-status-danger">{error}</p>}
      {cancelled && <p role="status" className="mt-4 text-sm text-fg-muted">{text.cancelled}</p>}
      {visibleResult && (
        <div className="mt-6 space-y-4" aria-live="polite">
          <div className="space-y-1 border-t border-stroke-divider pt-5">
            <h3 className="text-sm font-semibold text-fg-default">{text.results}</h3>
            <p className="break-words text-xs text-fg-muted">{text.searched}: {visibleResult.query}</p>
            <p className="break-words text-xs text-fg-muted">{text.retrieved}: {visibleResult.retrievedAt}</p>
            {visibleResult.traceId && <p className="break-all font-mono text-[11px] text-fg-subtle">traceId: {visibleResult.traceId}</p>}
          </div>
          {safeResults.length === 0 && <p className="text-sm text-fg-muted">{text.empty}</p>}
          {safeResults.map((item) => (
            <article key={item.url} className="rounded-xl border border-stroke-divider p-4">
              <a href={safeResultUrl(item.url)!} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-start gap-2 break-words text-sm font-semibold text-accent hover:underline">
                {item.title}<ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </a>
              <p className="mt-1 break-all text-[11px] text-fg-subtle">{item.url}</p>
              <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-fg-muted">{item.content.length > 1500 ? `${item.content.slice(0, 1500)}…` : item.content}</p>
              {(item.crawledAt || item.lastUpdatedAt) && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-fg-subtle">
                  {item.crawledAt && <span>{text.crawled}: {item.crawledAt}</span>}
                  {item.lastUpdatedAt && <span>{text.updated}: {item.lastUpdatedAt}</span>}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      <div className="mt-6 flex flex-col gap-3 border-t border-stroke-divider pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-medium text-fg-default">{text.combinedTitle}</h3>
          <p className="mt-1 text-xs leading-5 text-fg-muted">{text.combinedHint}</p>
        </div>
        <Link href="/test" className="inline-flex w-fit shrink-0 items-center rounded-lg border border-accent/30 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          {text.combinedLink}
        </Link>
      </div>
    </section>
  );
}
