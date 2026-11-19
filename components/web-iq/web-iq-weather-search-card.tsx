'use client';

import { useId } from 'react';
import { Button } from '@/components/ui/button';
import { WebIqBotCheck } from '@/components/web-iq/web-iq-bot-check';
import { formatCountdown, useWebIqSearch } from '@/components/web-iq/use-web-iq-search';
import type { WebIqSearchResult } from '@/lib/webIqSearch';
import type { WebIqLanguage } from '@/lib/webIqScenario';

const originalLink = 'inline-flex min-h-11 items-center gap-1 rounded text-sm text-accent underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

function SearchDocument({ item, language }: { item: WebIqSearchResult; language: WebIqLanguage }) {
  return <div className="min-w-0 space-y-1 rounded-lg border border-stroke-divider p-3">
    <p className="break-all text-xs text-fg-muted">{new URL(item.url).hostname}</p>
    <h5 className="break-words text-sm font-semibold">{item.title}</h5>
    <p className="line-clamp-4 break-words border-l-2 border-stroke-divider pl-3 text-sm leading-6 text-fg-muted">{item.content}</p>
    <a href={item.url} target="_blank" rel="noopener noreferrer" className={originalLink}>
      {language === 'ko' ? '원문 열기' : 'Open original page'}<span aria-hidden="true">↗</span><span className="sr-only"> ({item.title})</span>
    </a>
  </div>;
}

export function WebIqWeatherSearchCard({ language, question }: { language: WebIqLanguage; question: string }) {
  const ko = language === 'ko';
  const pick = (en: string, korean: string) => ko ? korean : en;
  const id = useId();
  const search = useWebIqSearch(language, question.trim());
  const [firstResult, ...moreResults] = search.safeResults;

  return <article aria-labelledby={`${id}-product ${id}-title`} className="min-w-0 rounded-xl border border-stroke-divider bg-bg-card p-4 sm:p-5">
    <header className="space-y-2">
      <p id={`${id}-product`} className="text-xs font-semibold text-accent">Web IQ Web Search</p>
      <h4 id={`${id}-title`} className="break-keep text-lg font-semibold">{pick('Weather pages to read', '읽을 수 있는 날씨 문서')}</h4>
      <p className="break-keep text-sm leading-6 text-fg-muted">{pick(
        'Find pages about the weather in Incheon. Read an excerpt, then open the original forecast or report.',
        '인천 날씨를 다룬 문서를 찾습니다. 관련 구절을 먼저 읽고 예보나 기사 원문을 열어보세요.',
      )}</p>
    </header>

    <div className="mt-4 space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={!search.canSubmit} aria-describedby={`${id}-cost`}
          className="h-auto min-h-11 max-w-full whitespace-normal break-keep py-2"
          onClick={event => { if (event.detail <= 1) void search.submit(); }}>
          {search.loading ? pick('Finding pages…', '문서 찾는 중…') : pick('Find pages with Web Search', 'Web Search로 문서 찾기')}
        </Button>
        {search.loading && <Button type="button" variant="ghost" onClick={search.cancelSearch}>{pick('Cancel search', '검색 취소')}</Button>}
      </div>
      <p id={`${id}-cost`} className="text-xs leading-6 text-fg-muted">{pick('Clicking sends one request to Web IQ Web Search.', '누르면 Web IQ Web Search에 1회 요청합니다.')}</p>
      {search.configuration === 'configured' && search.turnstileSiteKey && <WebIqBotCheck siteKey={search.turnstileSiteKey} action="webiq_search"
        language={language} onTokenChange={search.setTurnstileToken} resetKey={search.botResetKey} showServiceLinks={false} />}
      {search.statusText && <div role="status" className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
        {search.statusText}
        {search.configuration !== 'checking' && <Button type="button" variant="ghost" size="sm" onClick={search.checkConfiguration}>{pick('Check again', '다시 확인')}</Button>}
      </div>}
      {search.usageMessage && <div role="alert" className="text-sm text-fg-muted">
        <p>{search.usageMessage}</p>
        {search.remainingSeconds > 0 && <p aria-live="off" className="text-xs tabular-nums">{pick('Available in', '다시 검색할 수 있을 때까지')} {formatCountdown(search.remainingSeconds)}</p>}
      </div>}
      {search.error && <p role="alert" className="text-sm text-status-danger">{search.error}</p>}
      {search.cancelled && <p role="status" className="text-sm text-fg-muted">{pick('Search cancelled.', '검색을 취소했습니다.')}</p>}
    </div>

    <div aria-live="polite" aria-busy={search.loading} className="mt-4 space-y-3 border-t border-stroke-divider pt-4">
      {search.visibleResult ? <>
        <p className="text-xs font-medium text-fg-muted">{pick('Live Web Search results', '실제 Web Search 결과')}</p>
        {search.safeResults.length === 0 && <p className="text-sm text-fg-muted">{pick('No pages found for this question.', '이 질문에 맞는 문서를 찾지 못했습니다.')}</p>}
        {firstResult && <SearchDocument item={firstResult} language={language} />}
        {moreResults.length > 0 && <details>
          <summary className="min-h-11 cursor-pointer content-center rounded text-sm font-medium text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
            {pick(`More pages (${moreResults.length})`, `다른 검색 결과 ${moreResults.length}건`)}
          </summary>
          <div className="space-y-2">{moreResults.map(item => <SearchDocument key={item.url} item={item} language={language} />)}</div>
        </details>}
      </> : <>
        <p className="text-xs font-medium text-fg-muted">{pick('Example search result', '검색 결과 예시')}</p>
        <div className="space-y-1 rounded-lg border border-stroke-divider p-3">
          <h5 className="text-sm font-semibold">{pick('Short-term forecast for South Korea', '기상청 날씨누리 단기예보')}</h5>
          <p className="border-l-2 border-stroke-divider pl-3 text-sm leading-6 text-fg-muted">{pick(
            'The regional forecast covers the Seoul and Incheon area, with expected weather and temperatures.',
            '서울과 인천을 포함한 수도권의 예상 날씨와 기온을 확인할 수 있습니다.',
          )}</p>
          <a href="https://www.weather.go.kr/w/forecast/overall/short-term.do" target="_blank" rel="noopener noreferrer" className={originalLink}>
            {pick('Open the Korea Meteorological Administration forecast', '기상청에서 예보 보기')}<span aria-hidden="true">↗</span>
          </a>
        </div>
      </>}
    </div>
  </article>;
}
