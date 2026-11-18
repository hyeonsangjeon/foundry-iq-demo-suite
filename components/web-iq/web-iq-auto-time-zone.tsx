'use client';

import type { ReactNode } from 'react';

import {
  getTimeZoneQuestion,
  TIME_ZONE_CITY_IDS,
  TIME_ZONE_CITY_LABELS,
  type TimeZoneCityId,
  type WebIqAutoTimeZoneResponse,
} from '@/lib/webIqAutoTimeZone';
import { WEB_IQ_AUTO_DOCUMENTATION } from '@/lib/webIqAuto';
import type { WebIqLanguage } from '@/lib/webIqScenario';

interface TimeZonePanelProps {
  language: WebIqLanguage;
  cityId: TimeZoneCityId;
  onCityChange: (cityId: TimeZoneCityId) => void;
  result: WebIqAutoTimeZoneResponse | null;
  controls: ReactNode;
}

function differenceText(minutes: number | null, destination: string, language: WebIqLanguage) {
  const ko = language === 'ko';
  if (minutes === null) return ko ? '두 도시의 시차를 확인하지 못했습니다.' : 'We couldn’t confirm the time difference between the two cities.';
  if (minutes === 0) return ko ? '두 도시의 시각이 같습니다.' : 'Both cities have the same local time.';
  const absolute = Math.abs(minutes);
  const hours = Math.floor(absolute / 60);
  const remainder = absolute % 60;
  const duration = [
    hours > 0 && (ko ? `${hours}시간` : `${hours} hour${hours === 1 ? '' : 's'}`),
    remainder > 0 && (ko ? `${remainder}분` : `${remainder} minute${remainder === 1 ? '' : 's'}`),
  ].filter(Boolean).join(' ');
  return ko
    ? `서울은 ${destination}보다 ${duration} ${minutes > 0 ? '빠릅니다' : '느립니다'}.`
    : `Seoul is ${duration} ${minutes > 0 ? 'ahead of' : 'behind'} ${destination}.`;
}

function CityClock({ label, localTime, language }: { label: string; localTime: string; language: WebIqLanguage }) {
  // The provider includes the city's calendar date. Converting the instant to the viewer's zone can change the day.
  const parts = /(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(localTime);
  return (
    <div className="min-w-0 rounded-lg border border-stroke-divider bg-bg-subtle px-4 py-3">
      <dt className="text-sm font-medium text-fg-muted">{label}</dt>
      <dd className="mt-1">
        {parts ? (
          <time dateTime={`${parts[1]}T${parts[2]}`}>
            <span className="block text-3xl font-semibold tabular-nums tracking-tight text-fg-default">{parts[2]}</span>
            <span className="mt-1 block text-sm text-fg-muted">
              {new Intl.DateTimeFormat(language === 'ko' ? 'ko-KR' : 'en-US', {
                dateStyle: 'long', timeZone: 'UTC',
              }).format(new Date(`${parts[1]}T00:00:00Z`))}
            </span>
          </time>
        ) : <span className="break-words text-base font-medium">{localTime}</span>}
      </dd>
    </div>
  );
}

export function WebIqAutoTimeZone({ language, cityId, onCityChange, result, controls }: TimeZonePanelProps) {
  const ko = language === 'ko';
  const destination = TIME_ZONE_CITY_LABELS[cityId][language];
  const activeResult = result?.cityId === cityId ? result : null;
  const clocks = [
    { label: ko ? '서울' : 'Seoul', entry: activeResult?.seoul },
    { label: destination, entry: activeResult?.destination },
  ].flatMap(({ label, entry }) => entry ? [{ label, entry }] : []);

  return (
    <section aria-labelledby="web-iq-time-zone-title" className="min-w-0 space-y-4 rounded-xl border border-stroke-divider bg-bg-card p-4 sm:p-5">
      <h3 id="web-iq-time-zone-title" className="break-keep text-lg font-semibold text-fg-default">
        {ko ? '서울과 몇 시간 차이 날까요?' : 'What’s the time difference from Seoul?'}
      </h3>
      <div>
        <label htmlFor="web-iq-time-zone-city" className="mb-2 block text-sm font-medium text-fg-muted">
          {ko ? '비교할 도시' : 'City to compare'}
        </label>
        <select id="web-iq-time-zone-city" value={cityId} onChange={event => onCityChange(event.target.value as TimeZoneCityId)}
          className="min-h-11 w-full rounded-lg border border-stroke-divider bg-bg-subtle px-3 text-sm text-fg-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-56">
          {TIME_ZONE_CITY_IDS.map(city => <option key={city} value={city}>{TIME_ZONE_CITY_LABELS[city][language]}</option>)}
        </select>
      </div>
      <p aria-live="polite" className="break-keep text-base font-medium leading-7">{getTimeZoneQuestion(cityId, language)}</p>
      {controls}
      {activeResult && (
        <div className="space-y-3 border-t border-stroke-divider pt-4">
          <div aria-live="polite" aria-atomic="true" className="space-y-3">
            {clocks.length > 0 && (
              <dl className="grid min-w-0 gap-3 sm:grid-cols-2">
                {clocks.map(({ label, entry }) => (
                  <CityClock key={label} label={label} localTime={entry.localTime} language={language} />
                ))}
              </dl>
            )}
            <p className="break-keep text-sm font-medium leading-6 text-fg-default">
              {differenceText(activeResult.differenceMinutes, destination, language)}
            </p>
          </div>
          <details className="min-w-0 border-t border-stroke-divider">
            <summary className="min-h-11 cursor-pointer content-center break-keep rounded text-sm font-medium text-fg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              {ko ? 'Auto는 어떤 값을 돌려줬나요?' : 'What did Auto return?'}
            </summary>
            {clocks.length ? (
              <>
                <code className="text-xs font-medium text-fg-muted">structured/timeZone</code>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {clocks.map(({ label, entry }) => (
                    <dl key={label} aria-label={label} className="space-y-2 rounded-lg bg-bg-subtle p-3 text-xs">
                      {Object.entries({
                        location: entry.location,
                        localTime: entry.derivedFromUtc ? entry.derivedFromUtc.localTime : entry.localTime,
                        utcOffset: entry.utcOffset,
                        ...(entry.derivedFromUtc ? { utcTime: entry.derivedFromUtc.utcTime } : {}),
                      }).map(([field, value]) => (
                        <div key={field}>
                          <dt className="font-mono text-fg-muted">{field}</dt>
                          <dd className="mt-0.5 break-all font-mono text-fg-default">{value ?? (ko ? '응답에 없음' : 'Not returned')}</dd>
                        </div>
                      ))}
                      {entry.derivedFromUtc && <div>
                        <dt className="text-fg-muted">{ko ? 'UTC 시각과 오프셋으로 계산한 현지 시각' : 'Local time calculated from UTC time and offset'}</dt>
                        <dd className="mt-0.5 break-all font-mono text-fg-default">{entry.localTime}</dd>
                      </div>}
                    </dl>
                  ))}
                </div>
              </>
            ) : <p className="text-sm text-fg-muted">{ko ? '확인된 시간대 항목이 없습니다.' : 'No time zone fields could be verified.'}</p>}
            <a href={`${WEB_IQ_AUTO_DOCUMENTATION}#time-zone-object`} target="_blank" rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1 rounded text-sm font-medium text-accent underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              {ko ? '시간대 응답 공식 문서' : 'Time zone response documentation'}
              <span aria-hidden="true">↗</span><span className="sr-only">{ko ? ' (새 탭)' : ' (opens in a new tab)'}</span>
            </a>
          </details>
        </div>
      )}
    </section>
  );
}
