'use client';

import * as React from 'react';
import type { WebIqSearchResponse } from '@/lib/webIqSearch';
import type { WebIqLanguage } from '@/lib/webIqScenario';

const copy = {
  en: {
    checking: 'Checking server settings…',
    unconfigured: 'Live search is unavailable until server authentication and bot protection are configured.',
    statusError: 'Could not check server settings.',
    unavailable: 'Live search is not configured on this server.',
    failure: 'Search failed. Please try again.',
    timeout: 'Search timed out. Please try again.',
    throttled: 'Search requests are temporarily limited. Try again later.',
    dailyLimit: 'Today’s live-search demo allowance has been used. Please return after midnight Korea time.',
    guardUnavailable: 'We could not check the search allowance. Please try again shortly. You can still explore the example scenario.',
    invalid: 'Choose a sample question or enter a question of 3–500 characters.',
    botRequired: 'Complete the verification before searching.',
    botFailed: 'Verification was not accepted. Please verify again and retry.',
    botUnavailable: 'Verification is temporarily unavailable. Please try again shortly.',
  },
  ko: {
    checking: '서버 설정 확인 중…',
    unconfigured: '서버 인증과 봇 방지 설정을 마치면 실제 웹 검색을 이용할 수 있습니다.',
    statusError: '서버 설정을 확인하지 못했습니다.',
    unavailable: '이 서버에 실제 웹 검색이 설정되지 않았습니다.',
    failure: '웹 검색에 실패했습니다. 다시 시도해 주세요.',
    timeout: '검색 시간이 초과됐습니다. 다시 시도해 주세요.',
    throttled: '검색 요청이 일시적으로 제한됐습니다. 잠시 후 다시 시도해 주세요.',
    dailyLimit: '오늘의 실제 검색 체험 한도를 모두 사용했습니다. 한국시간 자정 이후 다시 이용해 주세요.',
    guardUnavailable: '검색 이용 한도를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요. 예시 시나리오는 계속 이용할 수 있습니다.',
    invalid: '예시 질문을 고르거나 질문을 3~500자로 입력해 주세요.',
    botRequired: '검색 전에 아래 확인을 마쳐 주세요.',
    botFailed: '확인이 승인되지 않았습니다. 다시 확인한 뒤 검색해 주세요.',
    botUnavailable: '지금은 확인 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
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

export function formatCountdown(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours, minutes, remainder].map(value => String(value).padStart(2, '0')).join(':');
}

export function safeResultUrl(value: string): string | null {
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

export function useWebIqSearch(language: WebIqLanguage, normalizedQuery: string) {
  const text = copy[language];
  const [turnstileSiteKey, setTurnstileSiteKey] = React.useState<string | null>(null);
  const [turnstileToken, setToken] = React.useState<string | null>(null);
  const tokenRef = React.useRef<string | null>(null);
  const setTurnstileToken = React.useCallback((token: string | null) => {
    tokenRef.current = token;
    setToken(token);
  }, []);
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
  const requestTimer = React.useRef<number | undefined>(undefined);
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
  }, [statusAttempt, language, setTurnstileToken]);

  const abortActiveRequest = React.useCallback(() => {
    const controller = activeRequest.current;
    if (!controller) return false;
    window.clearTimeout(requestTimer.current);
    activeRequest.current = null;
    controller.abort();
    return true;
  }, []);

  React.useEffect(() => () => { abortActiveRequest(); }, [abortActiveRequest]);

  React.useEffect(() => {
    if (abortActiveRequest()) {
      setTurnstileToken(null);
      setBotResetKey(value => value + 1);
    }
    setLoading(false);
    setResult(null);
    setError(null);
    setCancelled(false);
  }, [language, normalizedQuery, abortActiveRequest, setTurnstileToken]);

  function clearPreviousSearch() {
    setResult(null);
    setError(null);
    setCancelled(false);
    if (usageNotice?.code === 'QUESTION_NOT_ALLOWED') setUsageNotice(null);
  }

  async function submit() {
    if (activeRequest.current || loading || configuration !== 'configured' || (usageNotice?.retryAt && usageNotice.retryAt > Date.now())) return;
    if (!validQuery) {
      setError(text.invalid);
      return;
    }
    const submissionToken = tokenRef.current;
    if (!submissionToken) {
      setError(text.botRequired);
      return;
    }

    setTurnstileToken(null);
    const controller = new AbortController();
    activeRequest.current = controller;
    setResult(null);
    setError(null);
    setUsageNotice(null);
    setCancelled(false);
    setLoading(true);
    const timeout = window.setTimeout(() => {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        controller.abort();
        setTurnstileToken(null);
        setBotResetKey(value => value + 1);
        setError(text.timeout);
        setLoading(false);
      }
    }, 35000);
    requestTimer.current = timeout;

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
    abortActiveRequest();
    setLoading(false);
    setCancelled(true);
    setError(null);
    setTurnstileToken(null);
    setBotResetKey(value => value + 1);
  }

  const statusText = configuration === 'configured' ? null
    : configuration === 'error' ? text.statusError : text[configuration];
  const safeResults = visibleResult?.results.filter((item) => safeResultUrl(item.url)) ?? [];

  return {
    turnstileSiteKey, setTurnstileToken, botResetKey, configuration, statusText,
    canSubmit: configuration === 'configured' && validQuery && Boolean(turnstileToken) && !loading && remainingSeconds === 0,
    checkConfiguration: () => setStatusAttempt(value => value + 1),
    loading, cancelled, error, usageMessage: usageNotice ? usageMessage : null, remainingSeconds,
    visibleResult, safeResults, clearPreviousSearch, cancelSearch, submit,
  };
}
