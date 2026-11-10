'use client';

import type { ReactNode } from 'react';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WEB_IQ_SHIPMENTS, evaluateWebIqScenario, type WebIqLanguage, type WebIqSignal } from '@/lib/webIqScenario';

type ComparisonProps = {
  language: WebIqLanguage;
  includeWeb: boolean;
  signal: WebIqSignal;
  result: ReturnType<typeof evaluateWebIqScenario>;
  onSelectSource: (includeWeb: boolean) => void;
  onOpenEvidence: (id: string) => void;
};

export function WebIqComparison({ language, includeWeb, signal, result, onSelectSource, onOpenEvidence }: ComparisonProps) {
  const pick = (en: string, ko: string) => language === 'ko' ? ko : en;
  const baseline = evaluateWebIqScenario(false, signal);
  const noticeRoad = signal === 'closure' ? 'port-access-road' : 'unrelated-access-road';
  const affected = includeWeb ? WEB_IQ_SHIPMENTS.filter(shipment => shipment.route.includes(noticeRoad)) : [];
  const hasImpact = affected.length > 0;

  return (
    <section aria-labelledby="web-iq-comparison-title" className="space-y-6 break-keep">
      <div>
        <p className="text-xs font-medium text-accent">{pick('Compare the same fictional records', '같은 가상 자료로 전후 비교')}</p>
        <h2 id="web-iq-comparison-title" className="mt-2 text-xl font-semibold">{pick('What does the web notice add to the decision?', '웹 공지가 어떤 판단을 더해 주나요?')}</h2>
        <p className="mt-2 text-sm leading-6 text-fg-muted">{pick('Keep the stock records and allocation rule fixed. Match the road in the notice to each shipment’s route.', '재고와 배정 기준은 그대로 두고, 공지에 나온 도로를 각 화물의 운송 경로와 맞춰 봅니다.')}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className={cn('flex flex-col rounded-xl border bg-bg-card p-5', !includeWeb ? 'border-accent' : 'border-stroke-divider')}>
          <div className="flex items-center justify-between gap-3 text-xs">
            <p className="font-medium text-fg-muted">{pick('Internal records only', '내부 자료만 활용')}</p>
            <span className={!includeWeb ? 'text-accent' : 'text-fg-subtle'}>{!includeWeb ? pick('Selected', '현재 선택') : pick('Before adding the notice', '웹 공지 반영 전')}</span>
          </div>
          <h3 className="mt-4 text-lg font-semibold">{pick('A has the least stock. Its road still needs checking.', 'A의 재고가 빠듯하지만, 도로 상황은 아직 모릅니다.')}</h3>
          <p className="mt-3 text-sm leading-6 text-fg-muted">{pick('A has four days of stock. Internal records alone do not confirm a closure on its route, so priority transport is not yet proposed.', 'A의 재고는 4일분입니다. 내부 자료만으로는 이용할 도로가 통제됐는지 알 수 없어, 아직 우선 운송을 제안하지 않습니다.')}</p>
          <p className="mt-4 border-t border-stroke-divider pt-4 text-sm">{pick('Check A’s road · Keep B and C on plan', 'A의 도로 상황 확인 · B와 C는 기존 계획 유지')}</p>
          {includeWeb && <Button size="sm" variant="outline" className="mt-4 w-fit" onClick={() => onSelectSource(false)}>{pick('View internal records only', '내부 자료만으로 보기')}</Button>}
        </article>

        <article className={cn('flex flex-col rounded-xl border p-5', includeWeb ? 'border-accent bg-accent/5' : 'border-dashed border-stroke-divider bg-bg-card')}>
          <div className="flex items-center justify-between gap-3 text-xs">
            <p className="font-medium text-accent">{pick('Add the web notice', '웹 공지까지 반영')}</p>
            <span className={includeWeb ? 'text-accent' : 'text-fg-subtle'}>{includeWeb ? pick('Selected', '현재 선택') : pick('Not applied yet', '아직 반영하지 않음')}</span>
          </div>
          <h3 className="mt-4 text-lg font-semibold">{!includeWeb
            ? pick('Check whether the notice affects our shipments.', '이 공지가 우리 화물에 해당하는지 확인해 보세요.')
            : hasImpact
              ? pick('There are now grounds to propose priority transport for A.', 'A에 우선 운송을 제안할 근거가 생겼습니다.')
              : pick('The notice concerns a different road. The recommendation stays the same.', '우리 경로와 무관한 공지라면, 판단은 그대로입니다.')}</h3>
          <p className="mt-3 text-sm leading-6 text-fg-muted">{!includeWeb
            ? pick('Add the notice to identify affected routes, then use stock levels to decide which shipment needs priority transport.', '웹 공지를 더하면 어떤 화물의 경로가 영향을 받는지 대조하고, 재고와 함께 우선 운송 필요성을 판단할 수 있습니다.')
            : hasImpact
              ? pick('A and B use the closed road. Of the two, only A meets the rule of seven days of stock or less.', 'A와 B가 통제 도로를 이용합니다. 둘 중 재고가 7일분 이하인 A만 우선 운송 기준에 해당합니다.')
              : pick('None of A, B, or C uses the road in this notice. It gives us no new reason to change their plans; A’s own road still needs checking.', 'A·B·C 모두 이번 공지의 도로를 이용하지 않습니다. 계획을 바꿀 근거가 추가되지 않았으며, A의 도로 상황은 더 확인해야 합니다.')}</p>
          {includeWeb ? <p className="mt-4 border-t border-stroke-divider pt-4 text-sm">{hasImpact
            ? pick('A: priority proposal · B: check a detour · C: keep plan', 'A 우선 운송 제안 · B 우회 검토 · C 계획 유지')
            : pick('Check A’s road · Keep B and C on plan', 'A의 도로 상황 확인 · B와 C는 기존 계획 유지')}</p>
            : <Button size="sm" className="mt-4 w-fit" onClick={() => onSelectSource(true)}>{pick('Add the web notice to compare', '웹 공지를 더해 비교하기')}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>}
        </article>
      </div>

      <div className="overflow-hidden rounded-xl border border-stroke-divider bg-bg-card">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stroke-divider p-5">
          <div>
            <h3 className="font-semibold">{pick('Which shipments does this notice affect?', '이 공지가 어느 화물에 해당하나요?')}</h3>
            <p className="mt-2 text-sm text-fg-muted">{!includeWeb
              ? pick('The web notice is not applied. Route restrictions remain unconfirmed.', '웹 공지를 반영하기 전입니다. 화물별 경로 통제 여부는 아직 확인되지 않았습니다.')
              : signal === 'closure'
                ? pick('Notice: port access road closed · Port remains open', '공지: 항만 연결 도로 통제 · 항만은 계속 운영')
                : pick('Notice: a road outside our routes is closed · Port remains open', '공지: 운송 경로 밖의 도로 통제 · 항만은 계속 운영')}</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-fg-muted" aria-live="polite">
            <span>{pick('Shipments matched', '공지 해당 화물')} <strong className="text-fg-default">{includeWeb ? `${affected.length} / 3` : pick('Not checked', '대조 전')}</strong></span>
            <span>{pick('Priority proposals', '우선 운송 제안')} <strong className="text-fg-default">{result.prioritySlotsUsed} / 1</strong></span>
          </div>
        </div>
        <ol className="divide-y divide-stroke-divider">
          {WEB_IQ_SHIPMENTS.map(shipment => {
            const decision = result.decisions.find(item => item.shipmentId === shipment.id)!;
            const before = baseline.decisions.find(item => item.shipmentId === shipment.id)!;
            const matches = includeWeb && shipment.route.includes(noticeRoad);
            const changed = decision.action.en !== before.action.en;
            return (
              <li key={shipment.id} className={cn('p-5', decision.priority && 'bg-amber-500/5')}>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <h4 className="font-semibold">{shipment.name[language]}</h4>
                  <span className={cn('rounded-full border px-2.5 py-1 text-xs', changed ? 'border-accent/40 text-accent' : 'border-stroke-divider text-fg-muted')}>
                    {changed ? pick('Recommendation changed', '대응 제안 변경') : pick('Recommendation unchanged', '기존 판단 유지')}
                  </span>
                </div>
                <dl className="grid gap-5 lg:grid-cols-[1fr_1fr_1.35fr]">
                  <div>
                    <dt className="text-xs text-fg-subtle">{pick('1 · Internal records', '1 · 내부 자료')}</dt>
                    <dd className="mt-2 text-sm font-medium">{shipment.stockDays}{pick(' days of stock', '일분 재고')} · {shipment.route.includes('port-access-road') ? pick('Port access road', '항만 연결 도로') : pick('Another road', '다른 도로')}</dd>
                    <dd className="mt-2"><EvidenceButton onClick={() => onOpenEvidence('inventory')}>{pick('Stock and route evidence', '재고·경로 근거 보기')}</EvidenceButton></dd>
                  </div>
                  <div>
                    <dt className="text-xs text-fg-subtle">{pick('2 · Match against the notice', '2 · 웹 공지와 대조')}</dt>
                    <dd className={cn('mt-2 text-sm font-medium', matches ? 'text-accent' : 'text-fg-muted')}>{!includeWeb
                      ? pick('Not checked yet', '아직 대조하지 않음')
                      : matches ? pick('Uses the road named in the notice', '공지의 통제 구간에 해당') : pick('This notice does not cover its route', '이번 공지의 통제 구간과 무관')}</dd>
                    {includeWeb && <dd className="mt-2"><EvidenceButton onClick={() => onOpenEvidence('road-notice')}>{pick('Web notice evidence', '웹 공지 근거 보기')}</EvidenceButton></dd>}
                  </div>
                  <div>
                    <dt className="text-xs text-fg-subtle">{pick('3 · Recommendation', '3 · 대응 제안')}</dt>
                    <dd className="mt-2 text-sm font-semibold">{decision.action[language]}</dd>
                    <dd className="mt-2 text-xs leading-5 text-fg-muted">{matches
                      ? decision.priority
                        ? pick('Affected route + stock ≤ 7 days → priority candidate', '통제 경로 이용 + 재고 7일분 이하 → 우선 운송 후보')
                        : pick('Affected route, but stock exceeds 7 days → check regular rerouting', '통제 경로를 이용하지만 재고가 7일분 초과 → 일반 운송 우회 검토')
                      : decision.reason[language]}</dd>
                    {changed && <dd className="mt-2 text-xs text-fg-subtle">{pick('Before: ', '반영 전: ')}{before.action[language]}</dd>}
                  </div>
                </dl>
              </li>
            );
          })}
        </ol>
        <div className="border-t border-stroke-divider px-5 py-4 text-xs leading-6 text-fg-muted">
          {pick('Priority rule: affected route + stock ≤ 7 days · At most one shipment.', '배정 기준: 통제 경로 이용 + 재고 7일분 이하 · 최대 한 건.')}{' '}
          <EvidenceButton onClick={() => onOpenEvidence('allocation-policy')}>{pick('View allocation rule', '배정 기준 근거 보기')}</EvidenceButton>
        </div>
      </div>

      <aside className="rounded-xl border border-accent/25 bg-accent/5 p-5">
        <h3 className="font-semibold">{pick('How this helps the business', '그래서 업무에는 어떤 도움이 되나요?')}</h3>
        <p className="mt-2 text-sm leading-7 text-fg-muted">{!includeWeb
          ? pick('Stock levels identify urgency. Adding a relevant web notice helps target transport changes at shipments whose routes are affected.', '재고 정보로 긴급성을 파악하고, 관련 웹 공지를 더해 경로에 문제가 생긴 화물에 대응을 집중할 수 있습니다.')
          : hasImpact
            ? pick('Focus the one priority slot on A and check regular rerouting for B. This helps manage production disruption risk without moving every shipment to expensive expedited transport.', '한 자리뿐인 우선 운송을 A에 집중하고, B는 일반 운송의 우회 가능성을 확인합니다. 모든 화물을 긴급 운송으로 돌리지 않으면서 생산 차질 위험과 불필요한 운송비를 줄이기 위한 판단입니다.')
            : pick('Screening out notices unrelated to our routes helps avoid unnecessary plan changes. Keep monitoring A’s low stock while B and C stay on plan.', '우리 경로와 무관한 공지를 걸러내면 불필요한 운송 계획 변경을 줄일 수 있습니다. 재고가 빠듯한 A는 계속 확인하고, B와 C는 기존 계획을 유지합니다.')}</p>
        <p className="mt-3 text-xs leading-5 text-fg-subtle">{pick('Illustrative benefit, not measured savings. Confirm availability, arrival time, cost, and owner approval before booking.', '가상 사례의 기대 효과이며 실제 절감 실적은 아닙니다. 예약 전 운송 가능 여부·도착 예정 시각·비용 확인과 책임자 승인이 필요합니다.')}</p>
      </aside>
    </section>
  );
}

function EvidenceButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="rounded text-left text-xs text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{children}</button>;
}
