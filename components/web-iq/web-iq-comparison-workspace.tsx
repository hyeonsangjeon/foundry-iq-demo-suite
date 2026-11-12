'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { WebIqBotCheck } from '@/components/web-iq/web-iq-bot-check';
import { WebIqAnswerComparison, comparisonErrorText } from '@/components/web-iq/web-iq-answer-comparison';
import { WebIqServiceLinks } from '@/components/web-iq/web-iq-service-links';
import { useWebIqComparison } from '@/components/web-iq/use-web-iq-comparison';
import { fetchKnowledgeBases } from '@/lib/api';
import type { KbWebAnswerStatus } from '@/lib/kbWebAnswer';
import { WEB_IQ_DEMO_QUESTIONS } from '@/lib/webIqDemoQuestions';
import { checkWebIqAnswerReadiness, WebIqComparisonError, type ComparisonSelection } from '@/lib/webIqComparison';

type KbOption = Awaited<ReturnType<typeof fetchKnowledgeBases>>['value'][number];

export function WebIqComparisonWorkspace({ language, onWebSearch }: { language: 'ko' | 'en'; onWebSearch: () => void }) {
  const ko = language === 'ko';
  const pick = (en: string, korean: string) => ko ? korean : en;
  const [kbs, setKbs] = useState<KbOption[]>([]);
  const [kbId, setKbId] = useState('');
  const [presetId, setPresetId] = useState('nasa-earth-at-night');
  const [status, setStatus] = useState<KbWebAnswerStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryUntil, setRetryUntil] = useState(0);
  const [now, setNow] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [preparing, setPreparing] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const preparingRef = useRef(false);
  const execution = useRef(0);
  const preflight = useRef<AbortController | null>(null);
  const readinessController = useRef<AbortController | null>(null);
  const comparison = useWebIqComparison();
  const onToken = useCallback((value: string | null) => { tokenRef.current = value; setToken(value); }, []);
  const retrySeconds = Math.max(0, Math.ceil((retryUntil - now) / 1000));
  useEffect(() => {
    if (!retryUntil) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [retryUntil]);
  useEffect(() => {
    if (comparison.run?.retryAfterSeconds) { setNow(Date.now()); setRetryUntil(Date.now() + comparison.run.retryAfterSeconds * 1000); }
  }, [comparison.run?.attemptId, comparison.run?.retryAfterSeconds]);
  const busy = preparing || comparison.run?.state === 'retrieving-kb' || comparison.run?.state === 'retrieving-web';
  const kb = kbs.find(item => item.name === kbId);
  const question = WEB_IQ_DEMO_QUESTIONS.find(item => item.id === presetId)!;
  const selection: ComparisonSelection = { kbId, presetId, query: question[language], language,
    settings: { includeActivity: true, outputMode: kb?.outputMode || 'answerSynthesis', retrievalReasoningEffort: kb?.retrievalReasoningEffort || { kind: 'low' } } };

  const refresh = useCallback(async () => {
    readinessController.current?.abort();
    const controller = new AbortController();
    readinessController.current = controller;
    setChecking(true);
    setError(null);
    const results = await Promise.allSettled([
      fetchKnowledgeBases(),
      fetch('/api/web-iq/answer', { cache: 'no-store', signal: controller.signal }).then(async response => {
        const body = await response.json();
        if (!response.ok) throw new WebIqComparisonError(body?.code || 'ANSWER_NOT_CONFIGURED', response.status);
        return body as KbWebAnswerStatus;
      }),
    ]);
    if (controller.signal.aborted) return;
    if (results[0].status === 'fulfilled') setKbs(results[0].value.value || []);
    else { setKbs([]); setError('KB_LIST_UNAVAILABLE'); }
    if (results[1].status === 'fulfilled') setStatus(results[1].value);
    else { setStatus(null); setError(results[1].reason instanceof WebIqComparisonError ? results[1].reason.code : 'ANSWER_NOT_CONFIGURED'); }
    setChecking(false);
  }, []);
  useEffect(() => { void refresh(); return () => { readinessController.current?.abort(); preflight.current?.abort(); }; }, [refresh]);
  useEffect(() => {
    execution.current++;
    preparingRef.current = false;
    setPreparing(false);
    comparison.clear();
    onToken(null);
    setResetKey(value => value + 1);
    return () => preflight.current?.abort();
    // Selection identity changes invalidate snapshots; no paid action is started by this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kbId, presetId, language]);

  async function execute(retry = false) {
    if (preparingRef.current || busy || retrySeconds > 0 || !tokenRef.current) return;
    const currentExecution = ++execution.current;
    preparingRef.current = true;
    setPreparing(true);
    setError(null);
    const freshToken = tokenRef.current;
    onToken(null);
    const controller = new AbortController();
    preflight.current = controller;
    try {
      await checkWebIqAnswerReadiness(controller.signal);
      if (controller.signal.aborted || currentExecution !== execution.current) return;
      setPreparing(false);
      if (retry && comparison.run) await comparison.retryWeb(comparison.run.runId, freshToken, selection);
      else await comparison.startComparison(selection, freshToken);
    } catch (reason) {
      if (!controller.signal.aborted && currentExecution === execution.current) {
        setError(reason instanceof WebIqComparisonError ? reason.code : 'REQUEST_FAILED');
        if (reason instanceof WebIqComparisonError && reason.retryAfterSeconds) { setNow(Date.now()); setRetryUntil(Date.now() + reason.retryAfterSeconds * 1000); }
      }
    } finally {
      if (currentExecution === execution.current) {
        preparingRef.current = false;
        setPreparing(false);
        setResetKey(value => value + 1);
      }
    }
  }

  function cancel() {
    execution.current++;
    preparingRef.current = false;
    setPreparing(false);
    setResetKey(value => value + 1);
    preflight.current?.abort();
    comparison.cancel();
    onToken(null);
  }
  return <div className="min-w-0 space-y-6">
    <header><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">{pick('One question, two answers', '같은 질문, 두 답변')}</h2><span className="rounded-md border border-stroke-divider px-2 py-1 text-xs">{comparison.run ? pick('Current run', '이번 실행 결과') : pick('Live query · no results yet until you run', '실제 조회 · 실행 전 결과 없음')}</span></div><p className="mt-3 break-keep text-sm leading-7 text-fg-muted">{pick('Compare the original knowledge-base output with an answer that adds public-web evidence.', '지식 베이스에서 찾은 자료에 웹 근거를 더해 답변을 비교합니다.')}</p></header>
    <p className="rounded-xl border border-stroke-divider bg-bg-subtle p-4 text-sm leading-7">{pick('The shipment story was fictional. Here, use the existing public NASA material to inspect the actual evidence flow. Check KB availability and question fit before running.', '앞의 화물 이야기는 가상 사례입니다. 여기서는 기존 공개 NASA 자료로 실제 근거 흐름을 확인합니다. 실행 전에 KB 접근과 질문에 맞는 자료가 있는지 확인해 주세요.')}</p>
    <section className="space-y-4 rounded-xl border border-stroke-divider bg-bg-card p-5" aria-label={pick('Comparison setup', '비교 준비')}>
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <label className="min-w-0 text-sm">{pick('Knowledge base', '지식 베이스')}<select value={kbId} onChange={event => setKbId(event.target.value)} className="mt-2 min-h-11 w-full min-w-0 rounded-lg border border-stroke-divider bg-bg-card p-2 text-sm focus-visible:ring-2 focus-visible:ring-accent"><option value="">{pick('Choose an existing KB', '기존 KB를 선택하세요')}</option>{kbs.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
        <label className="min-w-0 text-sm">{pick('Allowed question', '허용된 질문')}<select value={presetId} onChange={event => setPresetId(event.target.value)} className="mt-2 min-h-11 w-full min-w-0 rounded-lg border border-stroke-divider bg-bg-card p-2 text-sm focus-visible:ring-2 focus-visible:ring-accent">{WEB_IQ_DEMO_QUESTIONS.map(item => <option value={item.id} key={item.id}>{item[language]}</option>)}</select></label>
      </div>
      <p className="text-sm leading-7">{question[language]}</p>
      <p className="text-xs leading-6 text-fg-muted">Web Search · {pick('The selected question is sent to web search. KB answer context and retrieved passages are sent with web evidence for additional synthesis. Free-text queries are available in Web Search only.', '선택한 질문으로 웹을 검색합니다. KB 답변 문맥·조회 자료와 웹 근거를 함께 추가 답변 생성에 전달합니다. 자유 입력은 웹 검색 탭에서만 제공합니다.')}</p>
      {presetId !== 'nasa-earth-at-night' && <p className="text-xs text-amber-700 dark:text-amber-300">{pick('A matching port KB has not been verified. Select material relevant to this question.', '대응 항만 KB는 확인되지 않았습니다. 이 질문에 맞는 자료를 선택해 주세요.')}</p>}
      {checking ? <p role="status" className="text-sm text-fg-muted">{pick('Checking available features…', '사용 가능한 기능을 확인하고 있습니다…')}</p> : !kbs.length ? <p role="status" className="text-sm text-fg-muted">{pick('No knowledge base is available.', '사용할 지식 베이스가 없습니다.')}</p> : null}
      {(!status?.configured || error) && !checking && <div className="flex flex-wrap items-center gap-3"><p role="status" className="text-sm text-fg-muted">{error === 'KB_LIST_UNAVAILABLE' ? pick('Could not load the existing KB list.', '기존 KB 목록을 확인하지 못했습니다.') : comparisonErrorText(error || 'ANSWER_NOT_CONFIGURED', ko)}</p><Button variant="outline" onClick={() => void refresh()}>{pick('Check again', '연결 다시 확인')}</Button></div>}
      {status?.botProtectionConfigured && status.turnstileSiteKey && !busy && <WebIqBotCheck siteKey={status.turnstileSiteKey} action="webiq_answer" language={language} onTokenChange={onToken} resetKey={resetKey} />}
      {retrySeconds > 0 && <p role="status" className="text-sm text-fg-muted">{pick('Server retry delay remaining', '서버 재시도 대기 시간')}: {retrySeconds}s</p>}
      <div className="flex flex-wrap gap-3"><Button className="min-h-11 w-full sm:w-auto" disabled={!kbId || !token || !status?.configured || checking || busy || retrySeconds > 0} onClick={() => void execute()}>{busy ? pick('Comparing…', '비교 중…') : pick('Compare answers', '두 답변 비교')}</Button>{busy && <Button variant="outline" onClick={cancel}>{pick('Cancel', '취소')}</Button>}{comparison.run?.internalTraceResponse && ['partial', 'cancelled'].includes(comparison.run.state) && <Button variant="outline" disabled={!token || busy || retrySeconds > 0} onClick={() => void execute(true)}>{pick('Retry web step · new paid request', '웹 단계 재시도 · 새 유료 요청')}</Button>}</div>
    </section>
    <WebIqAnswerComparison key={comparison.run?.runId || 'idle'} run={comparison.run} language={language} onWebSearch={onWebSearch} />
    {!comparison.run && <WebIqServiceLinks features={['kb-retrieval', 'web-search', 'answer-synthesis', 'bot-check']} locale={language} />}
    <section className="rounded-xl border border-stroke-divider p-5"><h3 className="text-sm font-semibold">Auto Weather · Beta</h3><p className="mt-2 text-sm leading-7 text-fg-muted">{pick('AppID access, pricing and an actual weather response have not been verified. This separate feature is disabled; comparison continues to use Web Search.', 'AppID 접근·가격·실제 날씨 응답이 확인되지 않아 이 별도 기능은 비활성 상태입니다. 답변 비교는 Web Search를 사용합니다.')}</p><Button variant="outline" className="mt-3" disabled>{pick('Auto weather unavailable', 'Auto 날씨 조회 비활성')}</Button><WebIqServiceLinks features={['auto', 'weather']} locale={language} /></section>
  </div>;
}
