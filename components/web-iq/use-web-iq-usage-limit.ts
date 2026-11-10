'use client';

import { useEffect, useState } from 'react';

export function useWebIqUsageLimit(language: 'ko' | 'en') {
  const [notice, setNotice] = useState<{ code: string; until: number } | null>(null);
  const [now, setNow] = useState(0);
  const remainingSeconds = notice ? Math.max(0, Math.ceil((notice.until - now) / 1000)) : 0;
  useEffect(() => {
    if (!notice?.until) return;
    const tick = () => {
      const time = Date.now();
      setNow(time);
      if (time >= notice.until) setNotice(null);
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [notice]);

  const messageFor = (code: string) => code === 'DAILY_BUDGET_EXHAUSTED'
    ? (language === 'ko' ? '오늘의 실제 검색 체험 한도를 모두 사용했습니다. 한국시간 자정 이후 다시 이용해 주세요.' : 'Today’s live-search allowance has been used. Please return after midnight Korea time.')
    : code === 'RATE_LIMITED'
      ? (language === 'ko' ? '요청이 많아 잠시 쉬고 있습니다.' : 'Too many requests. Please wait before trying again.')
      : code === 'QUESTION_NOT_ALLOWED'
        ? (language === 'ko' ? '화면에 있는 체험 질문을 선택해 주세요.' : 'Choose one of the available demo questions.')
        : (language === 'ko' ? '사용량을 확인하지 못해 실제 검색을 잠시 중단했습니다.' : 'Live search is paused because the usage allowance could not be checked.');

  function responseError(response: Response, payload: unknown): Error | null {
    if (!payload || typeof payload !== 'object') return null;
    const data = payload as { code?: string; retryAfterSeconds?: number; resetsAt?: string };
    if (!['RATE_LIMITED', 'DAILY_BUDGET_EXHAUSTED', 'QUESTION_NOT_ALLOWED', 'USAGE_GUARD_UNAVAILABLE'].includes(data.code || '')) return null;
    const seconds = data.retryAfterSeconds ?? Number(response.headers.get('Retry-After'));
    const until = Number.isFinite(seconds) && seconds > 0 ? Date.now() + seconds * 1000 : Date.parse(data.resetsAt || '');
    setNow(Date.now());
    if (Number.isFinite(until) && until > Date.now()) setNotice({ code: data.code!, until });
    const error = new Error(messageFor(data.code!));
    error.name = 'WebIqUsageLimitError';
    return error;
  }

  return {
    remainingSeconds,
    message: notice ? `${messageFor(notice.code)} ${language === 'ko' ? `다시 시도할 수 있을 때까지 ${remainingSeconds}초` : `Try again in ${remainingSeconds}s`}` : null,
    responseError,
    assertAvailable() {
      if (notice && notice.until > Date.now()) throw new Error(messageFor(notice.code));
    },
  };
}
