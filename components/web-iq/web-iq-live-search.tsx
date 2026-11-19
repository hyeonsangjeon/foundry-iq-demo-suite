'use client';

import * as React from 'react';
import Link from 'next/link';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle';
import Search from 'lucide-react/dist/esm/icons/search';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { WebIqBotCheck } from '@/components/web-iq/web-iq-bot-check';
import { WebIqSourceDetail } from '@/components/web-iq/web-iq-source-detail';
import { WebIqServiceLinks } from '@/components/web-iq/web-iq-service-links';
import { WEB_IQ_DEMO_QUESTIONS } from '@/lib/webIqDemoQuestions';
import { WEB_IQ_SEARCH_DOCUMENTATION, type WebIqSearchResult } from '@/lib/webIqSearch';
import { formatCountdown, safeResultUrl, useWebIqSearch } from '@/components/web-iq/use-web-iq-search';
import { cn } from '@/lib/utils';

const copy = {
  en: {
    title: 'Microsoft Web IQ · Web Search',
    description: 'Find relevant information and sources on the web. For transport, check notices and operating information.',
    boundary: 'Results from this live search do not automatically update the fictional shipment recommendations above.',
    reviewTitle: 'Three checks before using a result',
    routeTitle: 'Does it affect your route?',
    routeHint: 'Match the road name and affected section in the notice to your actual shipment route.',
    dateTitle: 'When does the restriction apply?',
    dateHint: 'Check the notice date and restriction period in the original. Crawl and retrieval times are different.',
    sourceTitle: 'Who published the notice?',
    sourceHint: 'Use “Open original page” to check the notice on the publisher’s site.',
    combinedTitle: 'Use web evidence with your own knowledge base',
    combinedHint: 'In Foundry IQ, choose a knowledge base, then select “Internal + Web IQ” before asking your question.',
    combinedLink: 'Ask with your KB and Web IQ',
    retry: 'Check again',
    label: 'Choose a question to try',
    customToggle: 'Ask your own question',
    customLabel: 'Your question',
    customPlaceholder: 'For example, what road restrictions has Incheon Port announced recently?',
    customHint: 'Enter 3–500 characters. Use public information and leave out confidential details.',
    characters: 'characters',
    queryHint: 'Only the selected or entered question is sent to Web IQ. The example shipment records are not sent.',
    limits: 'Live search allows up to 100 requests per IP in the last 2 minutes and has a daily allowance shared by all visitors. The example scenario remains available.',
    submit: 'Search with Web Search',
    searching: 'Searching with Web Search…',
    cancel: 'Cancel search',
    cancelled: 'Search cancelled.',
    availableIn: 'Search available in',
    empty: 'No usable results for this query.',
    results: 'Web results',
    summary: 'Search summary',
    inspect: 'Inspect relevant passage',
    original: 'Open original page',
    searched: 'Query',
    retrieved: 'Retrieved',
    crawled: 'Crawled',
    updated: 'Last updated',
    docs: 'Web Search API documentation',
  },
  ko: {
    title: 'Microsoft Web IQ · Web Search',
    description: '웹에서 관련 자료와 출처를 찾습니다. 운송 예시에서는 공지와 운영 정보를 확인합니다.',
    boundary: '여기서 조회한 실제 웹 자료는 위 가상 화물의 대응 제안에 자동으로 반영되지 않습니다.',
    reviewTitle: '검색 결과를 활용하기 전에 세 가지를 확인하세요',
    routeTitle: '우리 경로와 겹치나요?',
    routeHint: '공지의 도로명과 통제 구간을 실제 운송 경로와 맞춰 보세요.',
    dateTitle: '언제부터 언제까지인가요?',
    dateHint: '원문의 공지일과 통제 기간을 확인하세요. 수집·조회 시각과는 다릅니다.',
    sourceTitle: '누가 낸 공지인가요?',
    sourceHint: '‘원문 열기’로 발행처 사이트에서 공지를 확인하세요.',
    combinedTitle: '내 지식 베이스에 웹 근거를 더하려면',
    combinedHint: 'Foundry IQ에서 지식 베이스를 고른 뒤, ‘내부 지식 + Web IQ’를 선택하고 질문하세요.',
    combinedLink: '내 지식 베이스와 웹을 함께 조회하기',
    retry: '다시 확인',
    label: '검색해 볼 질문을 선택하세요',
    customToggle: '직접 질문하기',
    customLabel: '궁금한 내용을 입력하세요',
    customPlaceholder: '예: 인천항에서 최근 발표한 도로 통제 공지가 있나요?',
    customHint: '3~500자로 입력하세요. 공개 자료에 관한 질문을 적고, 기밀 정보는 넣지 마세요.',
    characters: '자',
    queryHint: '선택하거나 입력한 질문만 Web IQ로 전달합니다. 예시 화물 자료는 전송하지 않습니다.',
    limits: '실제 검색은 같은 IP에서 최근 2분간 최대 100회까지 이용할 수 있으며, 모든 방문자가 하루 체험 한도를 함께 사용합니다. 예시 시나리오는 계속 이용할 수 있습니다.',
    submit: 'Web Search로 검색',
    searching: 'Web Search로 검색 중…',
    cancel: '검색 취소',
    cancelled: '검색을 취소했습니다.',
    availableIn: '다시 검색할 수 있을 때까지',
    empty: '사용할 수 있는 검색 결과가 없습니다.',
    results: '웹 검색 결과',
    summary: '검색 요약',
    inspect: '관련 본문 확인',
    original: '원문 열기',
    searched: '검색어',
    retrieved: '조회 시각',
    crawled: '수집 시각',
    updated: '최종 갱신',
    docs: 'Web Search API 문서',
  },
};

export function WebIqLiveSearch({ language }: { language: 'en' | 'ko' }) {
  const text = copy[language];
  const id = React.useId();
  const [questionId, setQuestionId] = React.useState(WEB_IQ_DEMO_QUESTIONS[0].id);
  const [customMode, setCustomMode] = React.useState(false);
  const [customQuery, setCustomQuery] = React.useState('');
  const [selectedSource, setSelectedSource] = React.useState<WebIqSearchResult | null>(null);
  const customInput = React.useRef<HTMLTextAreaElement>(null);
  const selectedQuestion = WEB_IQ_DEMO_QUESTIONS.find(question => question.id === questionId) || WEB_IQ_DEMO_QUESTIONS[0];
  const normalizedQuery = (customMode ? customQuery : selectedQuestion[language]).trim();
  const {
    turnstileSiteKey, setTurnstileToken, botResetKey, configuration, statusText,
    canSubmit, checkConfiguration, loading, cancelled, error, usageMessage, remainingSeconds,
    visibleResult, safeResults, clearPreviousSearch: clearSearchState, cancelSearch, submit,
  } = useWebIqSearch(language, normalizedQuery);

  function clearPreviousSearch() {
    setSelectedSource(null);
    clearSearchState();
  }

  React.useEffect(() => {
    if (customMode) customInput.current?.focus();
  }, [customMode]);

  return (
    <section aria-labelledby={`${id}-title`} className="min-w-0 rounded-2xl border border-stroke-divider bg-bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 id={`${id}-title`} className="break-keep text-lg font-semibold text-fg-default">{text.title}</h2>
          <p className="mt-1 break-keep text-sm leading-6 text-fg-muted">{text.description}</p>
        </div>
        <a href={WEB_IQ_SEARCH_DOCUMENTATION} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline">
          {text.docs}<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
      <div className="mt-3"><WebIqServiceLinks features={['web-search']} locale={language} /></div>
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
      {statusText && <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-fg-muted" role="status">
        <span>{statusText}</span>
        {(configuration === 'error' || configuration === 'unconfigured') && (
          <Button type="button" variant="ghost" size="sm" onClick={checkConfiguration}>{text.retry}</Button>
        )}
      </div>}

      <form onSubmit={event => { event.preventDefault(); void submit(); }} className="mt-5 space-y-3" aria-busy={loading}>
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
          <Button type="submit" className="h-auto min-h-11 max-w-full whitespace-normal break-keep py-2" disabled={!canSubmit}>
            {loading ? <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
            {loading ? text.searching : text.submit}
          </Button>
          {loading && <Button type="button" variant="outline" onClick={cancelSearch}>{text.cancel}</Button>}
        </div>
        <p id={`${id}-hint`} className="text-xs leading-5 text-fg-muted">{text.queryHint}</p>
        <p className="text-xs leading-5 text-fg-subtle">{text.limits}</p>
      </form>

      {usageMessage && <div className="mt-4 rounded-lg border border-stroke-divider bg-bg-subtle p-4 text-sm text-fg-muted">
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
          {safeResults.map((item, index) => (
            <article key={item.url} className="rounded-xl border border-stroke-divider p-4">
              <p className="mb-2 text-xs font-semibold text-accent">{item.sourceId || `W${index + 1}`} · {new URL(item.url).hostname}</p>
              <h4 className="break-words text-sm font-semibold">{item.title}</h4>
              <p className="mt-1 break-all text-[11px] text-fg-subtle">{item.url}</p>
              <h5 className="mt-3 text-xs font-medium text-fg-default">{text.summary}</h5>
              <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-fg-muted">{item.content.length > 1500 ? `${item.content.slice(0, 1500)}…` : item.content}</p>
              {(item.crawledAt || item.lastUpdatedAt) && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-fg-subtle">
                  {item.crawledAt && <span>{text.crawled}: {item.crawledAt}</span>}
                  {item.lastUpdatedAt && <span>{text.updated}: {item.lastUpdatedAt}</span>}
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button type="button" variant="outline" className="min-h-11" onClick={() => setSelectedSource(item)}>{text.inspect}</Button>
                <a href={safeResultUrl(item.url)!} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm text-accent hover:underline">
                  {text.original}<ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
      {selectedSource && visibleResult && <WebIqSourceDetail key={`${visibleResult.retrievedAt}:${selectedSource.sourceId || selectedSource.url}`} source={selectedSource} query={visibleResult.query} language={language} onClose={() => setSelectedSource(null)} />}
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
