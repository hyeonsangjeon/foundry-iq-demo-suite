
import { WebIqServiceLinks } from '@/components/web-iq/web-iq-service-links';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight20Regular } from '@fluentui/react-icons';

import { buttonVariants } from '@/components/ui/button';
import type { Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function WebIqCard({ locale }: { locale: Locale }) {
  const isKorean = locale === 'ko';

  return (
    <article data-testid="web-iq-card" className="overflow-hidden rounded-2xl border border-stroke-divider bg-bg-elevated/50">
      <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_260px] md:items-center md:p-8">
        <div className="min-w-0">
          <p className="mb-3 text-xs font-medium text-fg-subtle">
            {isKorean ? '가상 시나리오 · 제조·물류' : 'Illustrative scenario · Manufacturing'}
          </p>
          <h3 className="text-2xl font-bold tracking-tight text-fg-default md:text-3xl">Web IQ</h3>
          <p className="mt-2 text-base font-semibold text-fg-default">
            {isKorean ? '어느 화물에 우선 운송을 배정할까요?' : 'Which shipment should receive priority transport?'}
          </p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-fg-muted">
            {isKorean
              ? '같은 재고·운송 자료를 바탕으로, 웹 도로 공지가 우선 운송 판단을 바꾸는지 확인합니다.'
              : 'See whether a web road notice changes the priority transport recommendation when the internal stock and route records stay the same.'}
          </p>
          <WebIqServiceLinks features={['web-search']} locale={locale} context="sample" className="mt-4" />
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/web-iq?view=executive" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
              {isKorean ? 'Executive · 90초' : 'Executive · 90s'}
              <ChevronRight20Regular className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/web-iq?view=technical" className={buttonVariants({ size: 'sm', variant: 'outline' })}>
              {isKorean ? 'Tech · 근거 확인' : 'Tech · See evidence'}
            </Link>
          </div>
        </div>
        <Image
          src="/web-iq/01_owner_question.png"
          width={1672}
          height={941}
          sizes="(max-width: 767px) 90vw, 260px"
          alt={isKorean ? '항만 사무실에서 화물 운송 순서를 고민하는 가상의 제조기업 오너' : 'A fictional business owner weighing shipment priorities in a port office'}
          className="aspect-video w-full rounded-xl object-cover"
        />
      </div>
    </article>
  );
}
