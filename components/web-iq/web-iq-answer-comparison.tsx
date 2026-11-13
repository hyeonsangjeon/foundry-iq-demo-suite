'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WebIqSourceDetail } from '@/components/web-iq/web-iq-source-detail';
import { WebIqServiceLinks } from '@/components/web-iq/web-iq-service-links';
import { buildKbWebContext } from '@/lib/kbWebAnswer';
import type { ComparisonErrorStage, ComparisonRun } from '@/lib/webIqComparison';
import type { WebIqSearchResult } from '@/lib/webIqSearch';

export function comparisonErrorText(code: string | undefined, ko: boolean, stage?: ComparisonErrorStage) {
  if (code === 'DAILY_BUDGET_EXHAUSTED') return ko ? '오늘의 체험 한도를 모두 사용했습니다. 한국시간 자정 이후 다시 이용해 주세요.' : 'Today’s shared allowance is exhausted. Return after midnight Korea time.';
  if (code === 'RATE_LIMITED' || code === 'KB_RATE_LIMITED') return ko ? '요청이 일시적으로 제한됐습니다. 표시된 시간 뒤 다시 시도해 주세요.' : 'Requests are temporarily limited. Retry after the indicated time.';
  if (code === 'USAGE_GUARD_UNAVAILABLE') return ko ? '조회 이용 한도를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.' : 'The query allowance could not be checked. Try again shortly.';
  if (code?.startsWith('BOT_CHECK')) return ko ? '계속하려면 확인을 다시 마쳐 주세요.' : 'Complete verification again to continue.';
  if (code === 'ANSWER_NOT_CONFIGURED') return ko ? '실제 비교에 필요한 서비스 설정을 확인하지 못했습니다.' : 'The services required for comparison are not configured.';
  if (code === 'CANCELLED' || code === 'KB_CANCELLED') return ko ? '요청을 취소했습니다. 이미 처리된 호출은 비용에 포함될 수 있습니다.' : 'Request cancelled. Calls already processed may still incur cost.';
  if (code === 'KB_EMPTY' || code === 'KB_CONTEXT_EMPTY') return ko ? '추가 답변에 사용할 KB 답변이나 근거를 받지 못했습니다.' : 'No usable KB answer or citable material was returned for the additional answer.';
  if (code?.startsWith('KB_') || stage === 'kb') return ko ? 'KB 조회를 완료하지 못했습니다. 실행 상세에서 실패 단계를 확인할 수 있습니다.' : 'KB retrieval could not be completed. See the failed stage in run details.';
  if (stage === 'web') return ko ? '웹 근거 조회 단계를 완료하지 못했습니다.' : 'The web-evidence step could not be completed.';
  if (stage === 'synthesis') return ko ? '추가 답변 생성을 완료하지 못했습니다.' : 'Additional answer synthesis could not be completed.';
  return ko ? '이 단계를 완료하지 못했습니다.' : 'This stage could not be completed.';
}

function CitedText({ text, ids, onSelect, language }: { text: string; ids: string[]; onSelect: (id: string) => void; language: 'ko' | 'en' }) {
  return <div className="whitespace-pre-wrap break-words text-sm leading-7 [overflow-wrap:anywhere]">{text.split(/(\[ref_id:[^\]]+\])/g).map((part, index) => {
    const match = part.match(/^\[ref_id:([^\]]+)\]$/);
    if (!match) return <span key={index}>{part}</span>;
    return ids.includes(match[1]) ? <button key={index} type="button" onClick={() => onSelect(match[1])} className="mx-1 inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-accent/30 px-2 text-xs text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label={`${language === 'ko' ? '출처' : 'Source'} ${match[1]}`}>[{match[1]}]</button> : null;
  })}</div>;
}

export function WebIqAnswerComparison({ run, language, onWebSearch }: { run: ComparisonRun | null; language: 'ko' | 'en'; onWebSearch?: () => void }) {
  const [selected, setSelected] = useState<WebIqSearchResult | null>(null);
  const ko = language === 'ko';
  const pick = (en: string, korean: string) => ko ? korean : en;
  if (!run) return <p className="rounded-xl border border-dashed border-stroke-divider p-6 text-sm text-fg-muted">{pick('Choose a question and knowledge base to compare the answers.', '질문과 지식 베이스를 고르면 두 답변을 비교할 수 있습니다.')}</p>;
  const snapshot = run.internalTraceResponse;
  const context = snapshot ? buildKbWebContext(snapshot) : null;
  const combined = run.combined;
  const telemetry = combined?.telemetry;
  const internalText = (snapshot?.response || []).flatMap(message => message.content || []).filter(item => item.type === 'text').map(item => item.text).join('\n');
  const focusSource = (id: string, side: string) => {
    const target = document.getElementById(`${run.runId}-${side}-${id}`);
    const details = target?.closest('details');
    if (details) details.open = true;
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  };
  const ms = (value: number | null | undefined) => value === null || value === undefined ? pick('Not returned', '미제공') : `${value} ms`;
  const money = (value: number | null | undefined) => value === null || value === undefined ? pick('Unknown', '미확인') : `$${(value / 1000000).toFixed(6)}`;
  const states: Record<string, string> = {
    'retrieving-kb': pick('Retrieving knowledge base…', 'KB 조회 중…'),
    'retrieving-web': pick('KB received · requesting web evidence and synthesis…', 'KB 응답 수신 · 웹 근거와 추가 답변 요청 중…'),
    complete: pick('Complete', '완료'), partial: pick('KB received · additional step incomplete', 'KB 응답 수신 · 추가 단계 미완료'), failed: pick('KB retrieval failed', 'KB 조회 실패'),
    cancelled: pick('Cancelled', '취소됨'), blocked_empty: pick('No usable KB material · web synthesis not started', '사용할 KB 근거 없음 · 웹 합성 미실행'),
  };
  return <section className="min-w-0 space-y-5" aria-label={pick('Answer comparison', '답변 비교')} aria-busy={run.state === 'retrieving-kb' || run.state === 'retrieving-web'}>
    <div className="space-y-2">
      <p className="break-keep text-base font-medium [overflow-wrap:anywhere]">{run.selection.query}</p>
      <p className="break-all text-xs text-fg-muted">KB: {run.selection.kbId} · {run.startedAt} · {run.selection.language.toUpperCase()}</p>
      <p role="status" aria-live="polite" className="text-sm font-medium text-accent">{states[run.state]}</p>
      {run.errorCode && <p className="text-sm text-fg-muted">{comparisonErrorText(run.errorCode, ko, run.errorStage)}{run.retryAfterSeconds ? ` ${pick('Server retry delay', '서버 재시도 대기')}: ${run.retryAfterSeconds}s` : ''}</p>}
    </div>
    <div className="grid min-w-0 gap-5 min-[1280px]:grid-cols-2">
      <article className="min-w-0 rounded-xl border border-stroke-divider bg-bg-card">
        <header className="border-b border-stroke-divider p-5"><h3 className="font-semibold">{context?.outputKind === 'extractive' ? pick('Internal search results', '내부 검색 결과') : pick('Knowledge-base answer', '지식 베이스 답변')}</h3><p className="mt-1 text-xs text-fg-muted">Azure AI Search · {pick('Original KB output', '원본 KB 출력')}</p></header>
        <div className="space-y-4 p-5">
          {internalText ? <CitedText language={language} text={internalText} ids={(snapshot?.references || []).map(ref => ref.id)} onSelect={id => focusSource(id, 'kb')} /> : <p className="text-sm leading-7 text-fg-muted">{snapshot ? context?.usable ? pick('Retrieved material is available, but no answer was returned.', '검색 자료는 받았지만 답변은 반환되지 않았습니다.') : pick('No usable KB answer or citable material was found.', '이 질문에 사용할 KB 답변이나 근거를 찾지 못했습니다.') : run.state === 'failed' ? pick('The KB request failed; no KB result was received.', 'KB 요청이 실패해 내부 결과를 받지 못했습니다.') : run.state === 'cancelled' ? pick('The request was cancelled before a KB result was received.', '내부 결과를 받기 전에 요청을 취소했습니다.') : pick('The KB result will appear here.', 'KB 결과가 여기에 표시됩니다.')}</p>}
          {snapshot?.references?.length > 0 && <details><summary className="min-h-11 cursor-pointer text-sm text-accent">{pick('View retrieved material', '검색된 자료 보기')} ({snapshot.references.length})</summary><ul className="space-y-3">{snapshot.references.map((ref, index) => <li key={`${ref.id}-${index}`} id={`${run.runId}-kb-${ref.id}`} tabIndex={-1} className="break-words rounded-lg bg-bg-subtle p-3 text-xs leading-6 focus-visible:ring-2 focus-visible:ring-accent"><strong>[{ref.id}] {String(ref.sourceData?.title || ('title' in ref ? ref.title : '') || ('docKey' in ref ? ref.docKey : '') || ref.type)}</strong><pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap font-sans">{String(ref.sourceData?.content || ref.sourceData?.text || ref.sourceData?.snippet || JSON.stringify(ref.sourceData || {}))}</pre></li>)}</ul></details>}
        </div>
      </article>
      <article className="min-w-0 rounded-xl border border-stroke-divider border-t-accent bg-bg-card">
        <header className="border-b border-stroke-divider p-5"><h3 className="font-semibold">{pick('Answer with web evidence', '웹 근거를 더한 답변')}</h3><p className="mt-1 text-xs text-fg-muted">Web IQ Web Search + Azure OpenAI · {pick('Additional synthesis path', '추가 합성 경로')}</p></header>
        <div className="space-y-4 p-5">
          {combined ? <CitedText language={language} text={combined.answer} ids={combined.sources.map((_, index) => String(index))} onSelect={id => focusSource(id, 'combined')} /> : <p className="text-sm leading-7 text-fg-muted">{run.state === 'blocked_empty' ? pick('No usable KB answer or citable material was found. Web search and additional synthesis were not started.', '사용할 KB 답변이나 근거가 없어 웹 검색과 추가 답변 생성을 시작하지 않았습니다.') : !snapshot && (run.state === 'failed' || run.state === 'cancelled') ? pick('No KB result was received. Web search and additional synthesis were not started.', '내부 결과를 받지 못해 웹 검색과 추가 답변 생성을 시작하지 않았습니다.') : snapshot && (run.state === 'partial' || run.state === 'cancelled') ? pick('The KB result is preserved. The web-supported answer could not be completed.', 'KB 결과는 보존됩니다. 웹 포함 답변은 완성하지 못했습니다.') : pick('The additional answer will appear here.', '웹 근거를 더한 답변이 여기에 표시됩니다.')}</p>}
          {run.state === 'blocked_empty' && onWebSearch && <Button variant="outline" onClick={onWebSearch}>{pick('Check with Web Search', '웹 검색으로 확인')}</Button>}
          {combined && combined.webSearch.results.length === 0 && <p className="text-xs leading-6 text-amber-700 dark:text-amber-300">{pick('No usable web evidence was returned for this question. The answer has no added web evidence.', '이번 질문에 사용할 웹 근거를 받지 못했습니다. 답변에 추가된 웹 근거가 없습니다.')}</p>}
          {combined?.kbContextOnly && <p className="text-xs leading-6 text-amber-700 dark:text-amber-300">{pick('KB context has no citable passages and is unverified.', 'KB 문맥에는 인용 가능한 자료가 없어 출처로 확인되지 않았습니다.')}</p>}
        </div>
      </article>
    </div>
    {snapshot && <p className="text-xs leading-6 text-fg-muted">{pick('Same question · same KB snapshot. This single run is a workflow observation; generation conditions differ and this is not a controlled quality evaluation. KB context is client supplied, not independently verified by the answer server.', '같은 질문 · 같은 KB 조회 자료. 한 번의 실행 비교이며, 답변 생성 조건이 달라 정식 품질 평가로 볼 수 없습니다. KB 문맥은 클라이언트가 전달하며 추가 답변 서버가 직접 검증한 자료가 아닙니다.')}</p>}
    {combined && <section className="space-y-3" aria-label={pick('Actual sources', '실제 출처')}><h3 className="font-medium">{pick('Cited evidence and retrieved web pages', '인용 근거와 검색한 웹 자료')}</h3>{combined.sources.map((source, index) => {
      const cited = combined.answer.includes(`[ref_id:${index}]`);
      const web = source.origin === 'web' ? combined.webSearch.results.find(item => item.url === source.url) : null;
      return <article key={source.id} id={`${run.runId}-combined-${index}`} tabIndex={-1} className="min-w-0 rounded-xl border border-stroke-divider p-4 focus-visible:ring-2 focus-visible:ring-accent"><div className="flex flex-wrap items-center gap-2 text-xs"><span className="text-accent">[{index}] {source.id} · {source.origin === 'web' ? 'Web' : 'KB'}</span><span className="text-fg-muted">{cited ? pick('Cited in this answer', '답변에서 인용됨') : pick('Retrieved · not cited', '검색됨 · 답변 인용 없음')}</span></div><p className="mt-2 break-words text-sm font-medium">{source.title}</p><p className="mt-2 text-xs text-fg-muted">{pick('Search / supplied passage', '검색·전달된 발췌')}</p><details className="mt-2 text-sm"><summary className="min-h-11 cursor-pointer">{pick('Read passage', '발췌 보기')}</summary><p className="whitespace-pre-wrap break-words text-sm leading-7">{source.content}</p></details>{web && <div className="flex flex-wrap items-center gap-3"><Button variant="outline" onClick={() => setSelected(web)}>{pick('Inspect relevant passage', '관련 본문 확인')}</Button><a href={web.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center break-all text-xs text-accent">{pick('Open original page ↗', '원문 열기 ↗')}</a></div>}</article>;
    })}</section>}
    {snapshot && <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg bg-bg-subtle p-4 text-xs leading-6"><span>{pick('KB request wait', 'KB 요청 대기')}: {run.kbRequestWallMs === undefined ? pick('Not measured', '미측정') : `${run.kbRequestWallMs} ms`}</span><span>{pick('Initial comparison wait', '첫 비교 대기')}: {run.comparisonWallMs === undefined ? pick('In progress / not measured', '진행 중·미측정') : `${run.comparisonWallMs} ms`}</span><span>{pick('Latest web attempt estimate', '이번 웹 시도의 추정 비용')}: {telemetry?.usage.status === 'verified' ? money(telemetry.cost.addedKnownMicroUsd) : pick('Full amount unknown', '전체 금액 미확인')}</span></div>}
    {snapshot && <p className="text-xs leading-6 text-fg-muted">{pick('Estimate for this web attempt; KB and infrastructure excluded. Earlier failed or cancelled attempts may add costs that are unknown here.', '이번 웹 시도의 추정액이며 KB·인프라는 제외합니다. 이전 실패·취소 시도의 추가 비용은 여기서 확인되지 않습니다.')}</p>}
    <details className="rounded-xl border border-stroke-divider p-5 text-xs leading-7"><summary className="min-h-11 cursor-pointer text-sm font-medium">{pick('Run details', '실행 상세')}</summary>
      <p className="break-all">Run: {run.runId} · Attempt: {run.attemptId}</p>
      <p>{pick('KB request wait (client)', 'KB 요청 대기 시간(client)')}: {run.kbRequestWallMs ?? '—'} ms · {pick('Initial comparison wait, excluding prior verification', '첫 비교 대기 시간 · 사전 인증 제외')}: {run.comparisonWallMs ?? '—'} ms</p>
      {run.webAttemptWallMs !== undefined && <p>{pick('Web-step request wait (excludes KB and time before retry)', '웹 단계 요청 대기 · KB·재시도 전 대기 제외')}: {run.webAttemptWallMs} ms</p>}
      <p>{pick('KB activity elapsed sum (not wall-clock)', 'KB 활동 시간 합계 · 대기 시간과 다름')}: {snapshot?.activity?.length && snapshot.activity.every(item => typeof item.elapsedMs === 'number' && Number.isFinite(item.elapsedMs) && item.elapsedMs >= 0) ? snapshot.activity.reduce((sum, item) => sum + item.elapsedMs!, 0) + ' ms' : pick('Not returned', '미제공')}</p>
      {telemetry && <><p>{pick('App web stage / provider request', '앱 웹 단계 / provider 요청')}: {ms(telemetry.timing.webStageWallMs)} / {ms(telemetry.timing.webRequestWallMs)} · {pick('Synthesis stage / request', '합성 단계 / 요청')}: {ms(telemetry.timing.synthesisStageWallMs)} / {ms(telemetry.timing.synthesisRequestWallMs)}</p><p>Model: {telemetry.usage.model || pick('Unknown', '미확인')} · Input / output: {telemetry.usage.inputTokens ?? '—'} / {telemetry.usage.outputTokens ?? '—'}</p><p>{pick('Latest web attempt estimate', '이번 웹 시도의 추정 비용')}: Web Search {money(telemetry.cost.webSearchMicroUsd)} + Azure OpenAI {money(telemetry.cost.extraSynthesisMicroUsd)} · {pick('Known subtotal', '확인된 소계')} {money(telemetry.cost.addedKnownMicroUsd)}</p><p>{telemetry.usage.status === 'unknown' ? pick('Full added cost unknown. ', '전체 추가 비용 미확인. ') : ''}{telemetry.cost.settlement === 'reservation_retained' ? pick('Reservation retained; settlement was not confirmed.', '정산 미확인으로 예약 금액을 유지했습니다.') : pick('Settled using verified usage.', '확인된 사용량으로 정산했습니다.')} · {telemetry.cost.pricingProfile}</p></>}
      {!telemetry && <p>{pick('Added usage/cost not returned; billing status unknown.', '추가 사용량·비용 미제공 · 청구 여부 미확인')}</p>}
      <p>{pick('Displayed costs cover this web attempt only. Earlier failed or cancelled attempts may incur additional costs. Estimates exclude KB, infrastructure and Turnstile; the shared $5/day estimate is not an Azure bill cap. 100 requests per IP / rolling 120s, reset at midnight KST.', '표시 금액은 이번 웹 시도에 한정됩니다. 이전 실패·취소 시도에도 추가 비용이 발생할 수 있습니다. 추정액은 KB·인프라·Turnstile을 제외합니다. 일 $5 공유 추정 예산은 Azure 청구 상한이 아닙니다. IP당 rolling 120초 100회, KST 자정 초기화.')}</p>
      {context && <p>{pick('Context limits: 20 sources, 6,000 characters each; answer 30,000; web passage 3,000. Omitted / truncated / metadata-only sources', '문맥 제한: 출처 20개·각 6,000자, 답변 30,000자, 웹 발췌 3,000자. 생략 / 절단 / 메타데이터만 있는 출처')}: {context.truncation.internalSourcesOmitted} / {context.truncation.internalSourcesTruncated} / {context.truncation.metadataOnlySources} · {pick('Answer truncated', '답변 절단')}: {String(context.truncation.internalAnswer)}</p>}
      {run.errorCode && <p>{pick('Error code', '오류 코드')}: {run.errorCode} · {pick('Stage', '단계')}: {run.errorStage === 'kb' ? pick('KB retrieval', 'KB 조회') : run.errorStage === 'web' ? pick('Web evidence', '웹 근거 조회') : run.errorStage === 'synthesis' ? pick('Additional synthesis', '추가 답변 생성') : pick('Not returned', '미제공')}{run.errorStatus !== undefined ? ` · HTTP ${run.errorStatus}` : ''}</p>}
      {(run.errorUpstreamStatus !== undefined || run.errorProviderCode) && <p>{run.errorUpstreamStatus !== undefined ? `${pick('Upstream HTTP status', '상위 서비스 HTTP 상태')}: ${run.errorUpstreamStatus}` : ''}{run.errorProviderCode ? ` · ${pick('Provider code', '서비스 오류 코드')}: ${run.errorProviderCode}` : ''}</p>}
    </details>
    <WebIqServiceLinks features={['kb-retrieval', 'web-search', 'answer-synthesis']} locale={language} />
    {selected && combined && <WebIqSourceDetail key={`${run.runId}-${selected.sourceId || selected.url}`} source={selected} query={combined.webSearch.query} language={language} onClose={() => setSelected(null)} />}
  </section>;
}
