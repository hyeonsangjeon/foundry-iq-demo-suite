'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Pause from 'lucide-react/dist/esm/icons/pause';
import Play from 'lucide-react/dist/esm/icons/play';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import { Button } from '@/components/ui/button';
import { WebIqLiveSearch } from '@/components/web-iq/web-iq-live-search';
import { WebIqComparisonWorkspace } from '@/components/web-iq/web-iq-comparison-workspace';
import { WebIqServiceLinks } from '@/components/web-iq/web-iq-service-links';
import { WebIqComparison } from '@/components/web-iq/web-iq-comparison';
import { WebIqSpeakerNotes } from '@/components/web-iq/web-iq-speaker-notes';
import {
  WEB_IQ_LAST_PRESENTATION_STAGE, WEB_IQ_PRESENTATION_DURATION, WEB_IQ_PRESENTATION_STAGES,
  webIqPresentationSourceUpdate, webIqPresentationStageIndex, webIqPresentationStageUpdate,
} from '@/components/web-iq/web-iq-presentation';
import { getLocale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
  WEB_IQ_EVIDENCE, WEB_IQ_QUESTION, WEB_IQ_SHIPMENTS,
  evaluateWebIqScenario, type WebIqLanguage, type WebIqSignal,
} from '@/lib/webIqScenario';

function clock(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

export function WebIqDemo() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [language, setLanguage] = useState<WebIqLanguage>('en');
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [captions, setCaptions] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [evidenceVisit, setEvidenceVisit] = useState(0);
  const view = params.get('view') === 'technical' ? 'technical' : 'executive';
  const techMode = params.get('tech') === 'search' ? 'search' : params.get('tech') === 'scenario' ? 'scenario' : 'compare';
  const rawScene = Number(params.get('scene') || 0);
  const sceneIndex = webIqPresentationStageIndex(rawScene);
  const scene = WEB_IQ_PRESENTATION_STAGES[sceneIndex];
  const includeWeb = view === 'executive' ? scene.includeWeb : params.get('sources') === 'web';
  const signal: WebIqSignal = view === 'technical' && params.get('signal') === 'unrelated' ? 'unrelated' : 'closure';
  const ko = language === 'ko';
  const pick = (en: string, korean: string) => ko ? korean : en;
  const result = useMemo(() => evaluateWebIqScenario(includeWeb, signal), [includeWeb, signal]);
  const totalElapsed = WEB_IQ_PRESENTATION_STAGES.slice(0, sceneIndex).reduce((sum, item) => sum + item.duration, 0) + elapsed;

  useEffect(() => { setLanguage(getLocale() === 'ko' ? 'ko' : 'en'); }, []);
  useEffect(() => { setElapsed(0); }, [sceneIndex]);

  const updateUrl = useCallback((updates: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([key, value]) => next.set(key, value));
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [params, pathname, router]);

  const goToScene = useCallback((next: number, auto = false) => {
    if (!auto) setPlaying(false);
    setElapsed(0);
    updateUrl(webIqPresentationStageUpdate(next));
  }, [updateUrl]);

  function togglePlayback() {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (totalElapsed >= WEB_IQ_PRESENTATION_DURATION) {
      goToScene(0, true);
    } else {
      // Resume the selected stage without resetting its elapsed time.
      updateUrl(webIqPresentationStageUpdate(sceneIndex));
    }
    setPlaying(true);
  }

  useEffect(() => {
    if (!playing || view !== 'executive') return;
    const timer = window.setInterval(() => setElapsed(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [playing, view]);

  useEffect(() => {
    if (!playing || elapsed < scene.duration) return;
    if (sceneIndex === WEB_IQ_LAST_PRESENTATION_STAGE) {
      setElapsed(scene.duration);
      setPlaying(false);
    } else {
      goToScene(sceneIndex + 1, true);
    }
  }, [elapsed, playing, scene.duration, sceneIndex, goToScene]);

  useEffect(() => {
    const onVisibility = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (view !== 'executive' || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, button, a, [contenteditable="true"]')) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        goToScene(sceneIndex + (event.key === 'ArrowRight' ? 1 : -1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goToScene, sceneIndex, view]);

  useEffect(() => {
    if (view === 'technical' && selectedEvidence) {
      const target = document.getElementById(`evidence-${selectedEvidence}`);
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedEvidence, evidenceVisit, view]);

  function selectView(next: 'executive' | 'technical') {
    setPlaying(false);
    updateUrl({ view: next, ...(next === 'executive' ? webIqPresentationStageUpdate(sceneIndex) : {}) });
  }

  function openEvidence(id: string) {
    setSelectedEvidence(id);
    setEvidenceVisit(value => value + 1);
    setPlaying(false);
    updateUrl({ view: 'technical', tech: 'scenario' });
  }

  const sourceButtons = (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={pick('Information to compare', '비교할 정보')}>
      {[false, true].map(web => (
        <Button key={String(web)} size="sm" variant={includeWeb === web ? 'default' : 'outline'} aria-pressed={includeWeb === web}
          onClick={() => {
            setPlaying(false);
            setElapsed(0);
            updateUrl(view === 'executive' ? webIqPresentationSourceUpdate(sceneIndex, web) : { sources: web ? 'web' : 'internal', comparison: 'manual' });
          }}>
          {web ? pick('Internal records + web notice', '내부 자료 + 웹 공지') : pick('Internal records only', '내부 자료만')}
        </Button>
      ))}
    </div>
  );

  const decisions = (
    <section aria-labelledby="web-iq-decision-title" className="rounded-xl border border-stroke-divider bg-bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stroke-divider p-5">
        <h2 id="web-iq-decision-title" className="text-base font-semibold">{pick('Recommendations by shipment', '화물별 대응 제안')}</h2>
        <span className="text-xs text-fg-muted">{pick('Priority slots proposed', '우선 운송 배정안')} {result.prioritySlotsUsed} / 1</span>
      </div>
      <div className="divide-y divide-stroke-divider">
        {result.decisions.map(decision => (
          <div key={decision.shipmentId} className={cn('p-5 sm:flex sm:gap-4', decision.priority && 'bg-amber-500/5')}>
            <div className={cn('mb-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold sm:mb-0', decision.priority ? 'border-amber-500/40 text-amber-600 dark:text-amber-300' : 'border-stroke-divider text-fg-muted')}>
              {decision.shipmentId}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold">{decision.action[language]}</h3>
              <p className="mt-1 text-sm leading-6 text-fg-muted">{decision.reason[language]}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {decision.evidenceIds.map(id => (
                  <button key={id} onClick={() => openEvidence(id)} className="rounded text-left text-xs text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                    {id === 'road-notice' ? pick('Web · road notice', '웹 · 도로 공지') : id === 'inventory' ? pick('Internal · inventory', '내부 · 재고') : pick('Internal · policy', '내부 · 배정 기준')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <header className="flex flex-col gap-4 border-b border-stroke-divider pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Web IQ</h1>
          <p className="mt-1 text-sm text-fg-muted">{view === 'executive' ? pick('Use internal stock records and web notices to assess whether priority transport is needed.', '내부 재고와 웹 공지를 함께 검토해 우선 운송이 필요한지 판단합니다.') : pick('Compare the same KB result with an answer that adds public-web evidence.', '같은 KB 결과에 공개 웹 근거를 더해 두 답변을 비교합니다.')}</p>
        </div>
        <div role="group" aria-label={pick('Presentation view', '발표 화면')} className="flex w-fit gap-1 rounded-xl border border-stroke-divider bg-bg-subtle p-1">
          {(['executive', 'technical'] as const).map(mode => (
            <Button key={mode} size="sm" variant={view === mode ? 'secondary' : 'ghost'} aria-pressed={view === mode} onClick={() => selectView(mode)}>
              {mode === 'executive' ? 'Executive' : 'Tech'}
            </Button>
          ))}
        </div>
      </header>

      {view === 'executive' && <section className="space-y-4" aria-labelledby="web-iq-question">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-subtle">
          <span>{pick('Illustrative scenario · fictional data', '예시 시나리오 · 가상 데이터')}</span>
          <Link href="/test" className="text-accent hover:underline">{pick('Try your knowledge base', '내 지식 베이스로 질문하기')}</Link>
        </div>
        <h2 id="web-iq-question" className="max-w-4xl text-xl font-medium leading-relaxed sm:text-2xl">{WEB_IQ_QUESTION[language]}</h2>
        {sourceButtons}
        <nav aria-label={pick('Walkthrough stages', '시나리오 단계')}>
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {WEB_IQ_PRESENTATION_STAGES.map((item, index) => (
              <li key={item.id} className="min-w-0">
                <button type="button" aria-current={sceneIndex === index ? 'step' : undefined} aria-controls="web-iq-walkthrough" onClick={() => goToScene(index)}
                  className={cn('flex h-full min-h-[4rem] w-full items-start gap-2 rounded-lg border p-3 text-left text-xs leading-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent', sceneIndex === index ? 'border-accent bg-accent/10 text-fg-default' : 'border-stroke-divider text-fg-muted hover:bg-bg-hover')}>
                  <span className="text-accent">{item.id}</span><span className="break-keep">{item.label[language]}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </section>}

      {view === 'executive' ? (
        <>
          <section id="web-iq-walkthrough" className="overflow-hidden rounded-2xl border border-stroke-divider bg-bg-card" aria-label={pick('Executive walkthrough', 'Executive 시나리오')}>
            <div className="grid lg:grid-cols-[1.35fr_1fr]">
              <div className="relative min-w-0 bg-bg-subtle">
                {sceneIndex === 3 && includeWeb && signal === 'closure' ? <div className="flex h-full min-h-56 flex-col justify-center gap-4 p-6 sm:p-8">
                  <h3 className="text-lg font-semibold">{pick('Match the notice to each route', '공지와 화물별 경로를 맞춰 봅니다')}</h3>
                  {WEB_IQ_SHIPMENTS.map(shipment => <div key={shipment.id} className="flex items-center gap-4 rounded-xl border border-stroke-divider bg-bg-card p-4"><strong className="text-xl">{shipment.id}</strong><div><p className="text-sm font-medium">{shipment.id === 'C' ? pick('Different route · not affected by this notice', '다른 경로 · 이 공지의 영향 없음') : pick('Port access road · affected', '항만 연결 도로 · 통제 영향 있음')}</p><p className="mt-1 break-all text-xs text-fg-muted">{shipment.route.join(', ')}</p></div></div>)}
                </div> : <Image src={scene.image} alt={scene.title[language]} width={1672} height={941} priority={sceneIndex === 0}
                  sizes="(min-width: 1024px) 60vw, 100vw" className="h-full min-h-56 w-full object-cover object-right" />}
              </div>
              <div className="flex flex-col justify-between gap-5 p-5 sm:p-7">
                <div>
                  <p className="text-xs font-medium text-accent">{String(sceneIndex + 1).padStart(2, '0')} / 06 · {scene.label[language]}</p>
                  <h3 className="mt-3 break-keep text-xl font-semibold leading-snug sm:text-2xl">{scene.title[language]}</h3>
                  <p className="mt-4 break-keep text-sm leading-7 text-fg-muted">{scene.narration[language]}</p>
                </div>
                <div className="border-t border-stroke-divider pt-4 text-sm leading-6">
                  {sceneIndex < 2 ? (
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-fg-muted">
                      {WEB_IQ_SHIPMENTS.map(shipment => <span key={shipment.id}><strong className="text-fg-default">{shipment.id}</strong> · {shipment.stockDays}{pick(' days of stock', '일분 재고')}</span>)}
                    </div>
                  ) : sceneIndex === 2 ? (
                    <p>{pick('The port remains open, but a road closure has been reported. Do any of our shipments use that road?', '항만은 계속 운영되지만 도로 통제 공지가 나왔습니다. 우리 화물 중 이 도로를 이용하는 건이 있나요?')}</p>
                  ) : (
                    <p className="text-fg-muted">{pick('Carrier availability → Arrival time and cost → Owner approval', '운송 가능 여부 → 도착 예정 시각·비용 → 책임자 승인')}</p>
                  )}
                </div>
              </div>
            </div>
            {captions && <p lang="en" className="border-t border-stroke-divider bg-bg-subtle px-5 py-4 text-sm leading-6 text-fg-muted sm:px-7">{scene.narration.en}</p>}
          </section>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={togglePlayback}>
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {playing ? pick('Pause', '일시 정지') : pick('Play 90s walkthrough', '90초 시나리오 재생')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => goToScene(0)} aria-label={pick('Restart walkthrough', '시나리오 처음부터')} title={pick('Restart the story with the original settings', '비교 조건을 초기화하고 처음부터 보기')}><RotateCcw className="h-4 w-4" /></Button>
                <span className="text-xs tabular-nums text-fg-muted" aria-label={pick('Presentation elapsed time', '시나리오 진행 시간')}>{clock(totalElapsed)} / 01:30</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" aria-pressed={captions} onClick={() => setCaptions(value => !value)}>{pick('EN captions', '영어 자막')}</Button>
                <Button size="sm" variant="outline" disabled={sceneIndex === 0} onClick={() => goToScene(sceneIndex - 1)} aria-label={pick('Previous scene', '이전 장면')}><ArrowLeft className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" disabled={sceneIndex === WEB_IQ_LAST_PRESENTATION_STAGE} onClick={() => goToScene(sceneIndex + 1)} aria-label={pick('Next scene', '다음 장면')}><ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
          {decisions}
          <WebIqServiceLinks features={['kb-retrieval', 'web-search', 'answer-synthesis']} locale={language} context="sample" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-fg-muted">{pick('The question and internal records stay the same. See whether the web notice changes the recommendation.', '질문과 내부 자료는 같습니다. 웹 공지가 우선 운송 판단을 바꾸는지 비교해 보세요.')}</p>
            <Button variant="outline" onClick={() => { setPlaying(false); updateUrl({ view: 'technical', tech: 'compare' }); }}>{pick('Compare real KB answers', '실제 KB 답변 비교하기')}<ArrowRight className="h-4 w-4" /></Button>
          </div>
          <WebIqSpeakerNotes language={language} stageIndex={sceneIndex} onSelectStage={goToScene} />
        </>
      ) : (
        <>
          <div role="group" aria-label={pick('Tech sections', 'Tech 화면')} className="flex flex-wrap gap-2 border-b border-stroke-divider pb-4">
            {(['compare', 'search', 'scenario'] as const).map(mode => <Button key={mode} variant={techMode === mode ? 'secondary' : 'ghost'} className="min-h-11" aria-pressed={techMode === mode} onClick={() => updateUrl({ tech: mode })}>{mode === 'compare' ? pick('Compare answers', '답변 비교') : mode === 'search' ? pick('Web Search', '웹 검색') : pick('Fictional scenario evidence', '가상 사례 근거')}</Button>)}
          </div>
          {techMode === 'compare' ? <WebIqComparisonWorkspace language={language} onWebSearch={() => updateUrl({ tech: 'search' })} /> : techMode === 'search' ? <WebIqLiveSearch language={language} /> : <>
          <p className="text-xs text-fg-muted">{pick('Illustrative scenario · fictional data', '예시 시나리오 · 가상 데이터')}</p>
          {sourceButtons}
          <section className="flex flex-col gap-3 rounded-xl border border-stroke-divider bg-bg-subtle p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">{pick('Change the notice. Compare the recommendation.', '공지를 바꿔 판단을 비교해 보세요')}</h2>
              <p className="mt-1 text-sm text-fg-muted">{pick('A closure on a road we do not use should not change our plan.', '우리 화물이 지나지 않는 도로라면, 통제 공지가 있어도 계획은 그대로입니다.')}</p>
            </div>
            <label className="flex flex-col gap-1 text-xs text-fg-muted">
              {pick('Illustrative web notice', '예시 웹 공지')}
              <select aria-label={pick('Illustrative web notice', '예시 웹 공지')} value={signal} onChange={event => updateUrl({ signal: event.target.value, comparison: 'manual' })} className="max-w-full rounded-lg border border-stroke-divider bg-bg-card p-2.5 text-sm text-fg-default">
                <option value="closure">{pick('Port access road closed', '항만 연결 도로 통제')}</option>
                <option value="unrelated">{pick('A different road is closed', '운송 경로 밖의 도로 통제')}</option>
              </select>
            </label>
          </section>
          <WebIqComparison language={language} includeWeb={includeWeb} signal={signal} result={result}
            onSelectSource={web => updateUrl({ sources: web ? 'web' : 'internal', comparison: 'manual' })}
            onOpenEvidence={openEvidence} />
          <section className="grid gap-5 lg:grid-cols-2" aria-label={pick('Scenario evidence', '시나리오 근거')}>
            {WEB_IQ_EVIDENCE.map(evidence => (
              <article id={`evidence-${evidence.id}`} tabIndex={-1} key={evidence.id} className={cn('scroll-mt-24 rounded-xl border bg-bg-card p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent', selectedEvidence === evidence.id ? 'border-accent ring-1 ring-accent' : 'border-stroke-divider', evidence.id === 'inventory' && 'lg:col-span-2')}>
                <p className="text-xs font-medium text-accent">{evidence.kind === 'web' ? pick('Web source · fictional example', '웹 출처 · 가상 예시') : pick('Internal source · fictional example', '내부 출처 · 가상 예시')}</p>
                <h3 className="mt-2 font-semibold">{evidence.title[language]}</h3>
                <p className="mt-2 text-sm leading-6 text-fg-muted">{evidence.body[language]}</p>
                {evidence.id === 'road-notice' && <p className="mt-3 rounded-lg bg-bg-subtle p-3 text-sm"><code>{signal === 'closure' ? 'port-access-road' : 'unrelated-access-road'}</code> · {pick('Road closed · Port open', '도로 통제 · 항만 운영 중')}{!includeWeb && <span className="block pt-1 text-xs text-fg-subtle">{pick('Not used in this recommendation', '현재 판단에는 이 공지를 반영하지 않습니다.')}</span>}</p>}
                {evidence.id === 'inventory' && (
                  <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                    {WEB_IQ_SHIPMENTS.map(shipment => <div key={shipment.id} className="min-w-0 rounded-lg bg-bg-subtle p-4"><dt className="text-sm font-semibold">{shipment.name[language]}</dt><dd className="mt-1 text-sm text-fg-muted">{shipment.stockDays}{pick(' days of stock', '일분 재고')}</dd><dd className="mt-2 break-all font-mono text-xs text-fg-subtle">{shipment.route.join(', ')}</dd></div>)}
                  </dl>
                )}
              </article>
            ))}
          </section>
          <details className="rounded-xl border border-stroke-divider bg-bg-card p-5 sm:p-6">
            <summary className="cursor-pointer font-semibold">{pick('Inspect the decision trace and scenario data', '판단 과정과 시나리오 데이터 자세히 보기')}</summary>
            <p className="mt-1 text-xs text-fg-subtle">{pick('This decision trace is based on fictional data. It is not a record of an actual Web IQ search.', '가상 데이터를 바탕으로 구성한 판단 과정입니다. 실제 Web IQ 검색 기록은 아닙니다.')}</p>
            <ol className="mt-5 space-y-5">
              {result.trace.map((step, index) => <li key={step.title.en} className="flex gap-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs text-accent">{index + 1}</span><div><h3 className="text-sm font-medium">{step.title[language]}</h3><p className="mt-1 text-sm leading-6 text-fg-muted">{step.detail[language]}</p></div></li>)}
            </ol>
            <details className="mt-6 border-t border-stroke-divider pt-4"><summary className="cursor-pointer text-sm text-fg-muted">{pick('View scenario data as JSON', '시나리오 데이터를 JSON으로 보기')}</summary><pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-bg-subtle p-4 text-xs leading-6">{JSON.stringify({ includeWeb, signal, shipments: WEB_IQ_SHIPMENTS, evaluation: result }, null, 2)}</pre></details>
          </details>
          </>}
        </>
      )}
      <footer className="flex flex-wrap gap-x-6 gap-y-2 border-t border-stroke-divider pt-5 text-xs text-fg-muted">
        <Link href="/test" className="text-accent hover:underline">{pick('Advanced experiments with your KB', '내 지식 베이스로 고급 실험')}</Link>
        <Link href="/guides" className="hover:underline">{pick('Setup and deployment guides', '구성·배포 가이드')}</Link>
        <a href="https://github.com/microsoft/azure-ai-search-foundry-iq-live-knowledge-sources" target="_blank" rel="noopener noreferrer" className="hover:underline">{pick('Microsoft repository · Search / MCP / Fabric', 'Microsoft 저장소 · Search / MCP / Fabric')}</a>
        <p className="w-full text-xs leading-6 text-fg-subtle">{pick('Advanced experiments are separate from this verified NASA example. Knowledge-base and question fit must be checked for each experiment.', '고급 실험은 이 NASA 검증 예시와 별개입니다. 사용하는 KB와 질문의 적합성은 실험마다 직접 확인해야 합니다.')}</p>
      </footer>
    </div>
  );
}
