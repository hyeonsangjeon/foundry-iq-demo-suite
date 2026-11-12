'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { getLocale, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { WEB_IQ_SERVICE_REFERENCES, type ServiceFeatureId } from '@/lib/webIqServiceReferences';

export interface WebIqServiceLinksProps {
  features: ServiceFeatureId[];
  locale?: Locale | 'en' | 'ko';
  context?: 'sample' | 'placeholder' | 'documentation' | 'implemented';
  className?: string;
  compact?: boolean;
}

/** Product links stay separate from run citations and never imply runtime access. */
export function WebIqServiceLinks({ features, locale, context = 'implemented', className, compact = false }: WebIqServiceLinksProps) {
  const [storedLocale, setStoredLocale] = useState<Locale>('en');
  useEffect(() => { if (!locale) setStoredLocale(getLocale()); }, [locale]);
  const language = (locale || storedLocale) === 'ko' ? 'ko' : 'en';
  const ko = language === 'ko';
  const contextLabel = context === 'sample' ? (ko ? '설명용 예시' : 'Illustrative sample')
    : context === 'placeholder' ? (ko ? '앱 미구현' : 'App placeholder')
      : context === 'documentation' ? (ko ? '구성 안내' : 'Setup documentation')
        : (ko ? '앱에 구현된 경로 · 실행 결과는 별도 표시' : 'Implemented app path · run results shown separately');
  return (
    <div className={cn('grid min-w-0 gap-3 text-xs break-keep [overflow-wrap:anywhere]', features.length > 1 && 'sm:grid-cols-2 xl:grid-cols-3', className)} data-service-links="official">
      {Array.from(new Set(features)).map((featureId) => {
        const item = WEB_IQ_SERVICE_REFERENCES[featureId];
        return (
          <div key={featureId} data-service-feature={featureId} data-service-compact={compact || undefined} className={cn('min-w-0 text-fg-muted', compact ? 'py-0' : 'rounded-lg border border-stroke-divider bg-bg-card p-3')}>
            <p className="font-medium text-fg-default">{item.serviceName} · {compact && featureId === 'bot-check' ? (ko ? '타사 브라우저 확인' : 'Third-party browser check') : item.featureName}</p>
            {!compact && <p className="mt-1 leading-5">{item.role[language]}</p>}
            <div className={cn(compact && 'flex flex-wrap items-start gap-x-4')}>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <OfficialLink href={item.overviewUrl}>{ko ? '서비스 소개' : 'Service overview'}</OfficialLink>
              <OfficialLink href={item.featureUrl}>{ko ? '기능 문서' : 'Feature docs'}</OfficialLink>
            </div>
            <details className={compact ? 'min-w-0' : 'mt-1'}>
              <summary className="min-h-11 cursor-pointer content-center rounded text-fg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{compact ? (ko ? '서비스 상태' : 'Service status') : (ko ? '서비스 상태와 조회 범위' : 'Service status and scope')}</summary>
              <dl className="space-y-1 leading-5">
                <div><dt className="inline font-medium">{ko ? '제품 상태: ' : 'Product status: '}</dt><dd className="inline">{item.productStatus[language]}</dd></div>
                <div><dt className="inline font-medium">{ko ? '앱 기능: ' : 'App feature: '}</dt><dd className="inline">{featureId === 'auto' || featureId === 'weather' ? (ko ? '비활성 · 접근·가격·실행 검증 필요' : 'Disabled · access, price and runtime verification required') : contextLabel}</dd></div>
                <div><dt className="inline font-medium">{ko ? '구성 상태: ' : 'Configuration status: '}</dt><dd className="inline">{ko ? '이 문서 링크에서는 미확인' : 'Unknown from documentation links'}</dd></div>
                <div><dt className="inline font-medium">{ko ? '실행 상태: ' : 'Runtime status: '}</dt><dd className="inline">{ko ? '이 문서 링크는 실제 실행의 증거가 아닙니다.' : 'Documentation links are not evidence of an API run.'}</dd></div>
                <div><dt className="inline font-medium">{ko ? '공식 문서 확인일: ' : 'Documentation checked: '}</dt><dd className="inline">{item.statusCheckedAt} KST</dd></div>
              </dl>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <OfficialLink href={item.apiUrl}>{ko ? 'API 참조' : 'API reference'}</OfficialLink>
                <OfficialLink href={item.pricingAccessUrl}>{ko ? '가격·접근 조건' : 'Pricing / access'}</OfficialLink>
              </div>
            </details>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OfficialLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded font-medium text-accent underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{children}<span className="ml-1" aria-hidden="true">↗</span><span className="sr-only"> ({'opens in a new tab / 새 탭'})</span></a>;
}
