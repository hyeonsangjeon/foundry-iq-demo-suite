'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';

type TurnstileOptions = {
  sitekey: string;
  action: 'webiq_search' | 'webiq_answer';
  language: 'en' | 'ko';
  size: 'flexible' | 'compact';
  appearance: 'always';
  retry: 'never';
  'refresh-expired': 'manual';
  'refresh-timeout': 'manual';
  callback: (token: string) => void;
  'error-callback': () => void;
  'expired-callback': () => void;
  'timeout-callback': () => void;
  'unsupported-callback': () => void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileOptions) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
};

type CheckStatus = 'loading' | 'checking' | 'verified' | 'expired' | 'error';

type WebIqBotCheckProps = {
  siteKey: string;
  action: 'webiq_search' | 'webiq_answer';
  language: 'en' | 'ko';
  onTokenChange: (token: string | null) => void;
  resetKey: number;
};

const SCRIPT_ID = 'web-iq-turnstile-script';
let scriptPromise: Promise<TurnstileApi> | null = null;

function getTurnstile(): TurnstileApi | undefined {
  return (window as Window & { turnstile?: TurnstileApi }).turnstile;
}

function loadTurnstile(): Promise<TurnstileApi> {
  const ready = getTurnstile();
  if (ready) return Promise.resolve(ready);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;

    const fail = () => {
      window.clearTimeout(timeout);
      script.onload = null;
      script.onerror = null;
      script.remove();
      scriptPromise = null;
      reject(new Error('Bot verification could not load'));
    };
    const timeout = window.setTimeout(fail, 15000);
    script.onerror = fail;
    script.onload = () => {
      const api = getTurnstile();
      if (!api) {
        fail();
        return;
      }
      window.clearTimeout(timeout);
      script.onload = null;
      script.onerror = null;
      resolve(api);
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

const copy = {
  en: {
    label: 'Quick verification before searching',
    loading: 'Loading verification…',
    checking: 'Complete the verification below to search.',
    verified: 'Verification complete. You can search now.',
    expired: 'Verification expired. Please verify again.',
    error: 'Verification could not finish. Please try again.',
    retry: 'Try verification again',
  },
  ko: {
    label: '검색 전 간단한 확인',
    loading: '확인 화면을 불러오는 중…',
    checking: '아래 확인을 마치면 검색할 수 있습니다.',
    verified: '확인됐습니다. 이제 검색할 수 있습니다.',
    expired: '확인 시간이 만료됐습니다. 다시 확인해 주세요.',
    error: '확인을 마치지 못했습니다. 다시 시도해 주세요.',
    retry: '다시 확인하기',
  },
};

/** Managed Turnstile check shared by the two Web IQ search entry points. */
export function WebIqBotCheck({ siteKey, action, language, onTokenChange, resetKey }: WebIqBotCheckProps) {
  const text = copy[language];
  const id = React.useId();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const widgetRef = React.useRef<{ api: TurnstileApi; id: string } | null>(null);
  const callbackRef = React.useRef(onTokenChange);
  const [status, setStatus] = React.useState<CheckStatus>('loading');
  const [attempt, setAttempt] = React.useState(0);
  const [size, setSize] = React.useState<'flexible' | 'compact'>('compact');
  callbackRef.current = onTokenChange;

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateSize = () => setSize(container.clientWidth < 300 ? 'compact' : 'flexible');
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let mountedWidget: { api: TurnstileApi; id: string } | null = null;
    callbackRef.current(null);
    setStatus('loading');

    const clearToken = (nextStatus: CheckStatus) => {
      if (disposed) return;
      callbackRef.current(null);
      setStatus(nextStatus);
    };

    void loadTurnstile().then((api) => {
      if (disposed) return;
      setStatus('checking');
      const widgetId = api.render(container, {
        sitekey: siteKey,
        action,
        language,
        size,
        appearance: 'always',
        retry: 'never',
        'refresh-expired': 'manual',
        'refresh-timeout': 'manual',
        callback: (token) => {
          if (disposed) return;
          callbackRef.current(token);
          setStatus('verified');
        },
        'error-callback': () => clearToken('error'),
        'expired-callback': () => clearToken('expired'),
        'timeout-callback': () => clearToken('expired'),
        'unsupported-callback': () => clearToken('error'),
      });
      mountedWidget = { api, id: widgetId };
      widgetRef.current = mountedWidget;
    }).catch(() => clearToken('error'));

    return () => {
      disposed = true;
      if (widgetRef.current === mountedWidget) widgetRef.current = null;
      if (mountedWidget) mountedWidget.api.remove(mountedWidget.id);
    };
  }, [siteKey, action, language, attempt, size]);

  React.useEffect(() => {
    callbackRef.current(null);
    const widget = widgetRef.current;
    if (!widget) return;
    setStatus('checking');
    try {
      widget.api.reset(widget.id);
    } catch {
      setStatus('error');
    }
  }, [resetKey]);

  return (
    <div className="min-w-0 space-y-2 rounded-xl border border-stroke-divider bg-bg-subtle p-3" aria-labelledby={`${id}-label`}>
      <p id={`${id}-label`} className="text-xs font-medium text-fg-default">{text.label}</p>
      <div ref={containerRef} className="min-h-[65px] w-full min-w-0" />
      <p role={status === 'error' || status === 'expired' ? 'alert' : 'status'} className="text-xs leading-5 text-fg-muted">{text[status]}</p>
      {(status === 'error' || status === 'expired') && (
        <Button type="button" variant="outline" size="sm" onClick={() => setAttempt(value => value + 1)}>{text.retry}</Button>
      )}
    </div>
  );
}
