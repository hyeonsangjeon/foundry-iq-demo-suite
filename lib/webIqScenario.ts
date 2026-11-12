export type WebIqLanguage = 'en' | 'ko';

export type Localized = { en: string; ko: string };

export type WebIqSignal = 'closure' | 'unrelated';

type ShipmentId = 'A' | 'B' | 'C';

interface WebIqScene {
  id: number;
  image: string;
  duration: number;
  title: Localized;
  narration: Localized;
}

interface WebIqShipment {
  id: ShipmentId;
  name: Localized;
  stockDays: number;
  route: string[];
}

interface WebIqEvidence {
  id: string;
  title: Localized;
  body: Localized;
  kind: 'internal' | 'web';
}

interface WebIqDecision {
  shipmentId: ShipmentId;
  action: Localized;
  reason: Localized;
  priority: boolean;
  evidenceIds: string[];
}

interface WebIqEvaluation {
  decisions: WebIqDecision[];
  trace: Array<{ title: Localized; detail: Localized }>;
  prioritySlotsUsed: number;
}

// All data and notices in this module are fictional. Scene duration is a
// presentation cue, not measured retrieval latency or an operational promise.
export const WEB_IQ_SCENES: readonly WebIqScene[] = [
  {
    id: 1,
    image: '/web-iq/01_owner_question.png',
    duration: 10,
    title: {
      en: 'Which shipment should receive priority transport?',
      ko: '어느 화물에 우선 운송을 배정할까요?',
    },
    narration: {
      en: 'Three shipments are due to arrive, but only one can receive priority transport. Which should we choose?',
      ko: '화물 세 건이 들어올 예정이지만, 우선 운송은 한 건만 가능합니다. 어느 화물에 배정할까요?',
    },
  },
  {
    id: 2,
    image: '/web-iq/02_internal_plan.png',
    duration: 15,
    title: {
      en: 'Start with stock levels',
      ko: '재고 여유부터 확인합니다',
    },
    narration: {
      en: 'Internal records show A has the least stock, with just four days remaining. Before proposing priority transport, we need to check whether its route is affected.',
      ko: '내부 자료상 A의 재고는 4일분으로 가장 적습니다. 우선 운송 여부는 A가 이용할 도로에 통제가 있는지 확인한 뒤 판단하겠습니다.',
    },
  },
  {
    id: 3,
    image: '/web-iq/03_external_signal.png',
    duration: 15,
    title: {
      en: 'Does this notice affect our routes?',
      ko: '이 공지가 우리 운송 경로에 영향을 줄까요?',
    },
    narration: {
      en: 'In this fictional notice, the port remains open but one road is closed. We check whether any of our shipments use it.',
      ko: '가상 웹 공지에는 항만은 계속 운영되지만 도로 한 곳이 통제된다고 나옵니다. 우리 화물이 그 도로를 이용하는지 확인합니다.',
    },
  },
  {
    id: 4,
    image: '/web-iq/04_critical_shipment.png',
    duration: 15,
    title: {
      en: 'Which shipments use the affected road?',
      ko: '통제 도로를 이용하는 화물을 가립니다',
    },
    narration: {
      en: 'A and B both use the closed port access road. C uses a different road, so this notice does not affect its route. We identify the affected shipments before choosing a response.',
      ko: 'A와 B는 통제된 항만 연결 도로를 이용합니다. C는 다른 도로를 이용하므로 이 공지의 영향을 받지 않습니다. 대응을 정하기 전에 먼저 영향받는 화물을 가립니다.',
    },
  },
  {
    id: 5,
    image: '/web-iq/05_targeted_decision.png',
    duration: 20,
    title: {
      en: 'Checks and approval come before booking',
      ko: '예약 전 확인과 승인이 필요합니다',
    },
    narration: {
      en: 'A and B are affected, but A has only four days of stock and B has 20. Propose the one priority slot for A, check regular rerouting for B, and keep C on its current plan. Check availability, arrival time and cost, then obtain owner approval before booking.',
      ko: 'A와 B 모두 경로 통제의 영향을 받지만 재고는 A가 4일분, B가 20일분입니다. 우선 운송 한 자리는 A에 제안하고 B는 일반 운송의 우회를 확인하며 C는 기존 계획을 유지합니다. 예약 전 운송 가능 여부와 도착 시각, 비용을 확인하고 책임자 승인을 받아야 합니다.',
    },
  },
  {
    id: 6,
    image: '/web-iq/06_decision_summary.png',
    duration: 15,
    title: {
      en: 'Focus priority transport where production is at risk',
      ko: '생산 차질이 우려되는 화물에 우선 운송을 집중합니다',
    },
    narration: {
      en: 'Combining internal stock records with the web notice shows that A has both low stock and a blocked route. Propose priority transport for A, check a detour for B, and keep C on its current plan. Focusing the response this way helps reduce production disruption risk and avoid unnecessary expedited transport costs. Availability, arrival time, cost, and owner approval must be confirmed before booking.',
      ko: '웹 공지를 더하면 재고가 적은 A의 운송 경로도 막혔다는 점을 알 수 있습니다. A에 우선 운송을 제안하고 B는 우회 가능성을 확인하며 C는 기존 계획을 유지합니다. 이렇게 필요한 화물에 대응을 집중하면 생산 차질 위험과 불필요한 긴급 운송비를 줄이는 데 도움이 됩니다. 예약 전에는 운송 가능 여부와 도착 예정 시각, 비용을 확인하고 책임자 승인을 받아야 합니다.',
    },
  },
];

export const WEB_IQ_SHIPMENTS: readonly WebIqShipment[] = [
  {
    id: 'A',
    name: { en: 'Shipment A', ko: '화물 A' },
    stockDays: 4,
    route: ['port-access-road'],
  },
  {
    id: 'B',
    name: { en: 'Shipment B', ko: '화물 B' },
    stockDays: 20,
    route: ['port-access-road'],
  },
  {
    id: 'C',
    name: { en: 'Shipment C', ko: '화물 C' },
    stockDays: 12,
    route: ['alternate-access-road'],
  },
];

export const WEB_IQ_QUESTION: Localized = {
  en: 'Three shipments are due to arrive, but only one can receive priority transport. Which should we choose?',
  ko: '화물 세 건이 들어올 예정이지만, 우선 운송은 한 건만 가능합니다. 어느 화물에 배정할까요?',
};

export const WEB_IQ_EVIDENCE: readonly WebIqEvidence[] = [
  {
    id: 'inventory',
    title: { en: 'Sample stock and routes', ko: '예시 재고와 운송 경로' },
    body: {
      en: 'A has four days of stock and B has 20; both use the port access road (port-access-road). C has 12 days of stock and uses a different road (alternate-access-road). All shipment and inventory records are fictional.',
      ko: 'A는 재고가 4일분, B는 20일분이며 둘 다 항만 연결 도로(port-access-road)를 이용합니다. C는 재고가 12일분이고 다른 도로(alternate-access-road)를 이용합니다. 모든 화물과 재고는 가상 데이터입니다.',
    },
    kind: 'internal',
  },
  {
    id: 'allocation-policy',
    title: { en: 'Sample priority rule', ko: '예시 우선 운송 기준' },
    body: {
      en: 'At most one shipment can receive priority transport. To qualify, it must use the closed road and have seven days of stock or less. Of those that qualify, we propose the shipment with the least stock. Carrier availability, expected arrival time, and cost must be confirmed before owner approval and booking.',
      ko: '우선 운송은 최대 한 건만 제안할 수 있습니다. 통제 도로를 이용하면서 재고가 7일분 이하인 화물만 후보입니다. 후보 중 재고가 가장 적은 화물에 우선 운송을 제안합니다. 운송 가능 여부, 도착 예정 시각, 비용을 확인하고 책임자 승인을 받은 후에만 예약할 수 있습니다.',
    },
    kind: 'internal',
  },
  {
    id: 'road-notice',
    title: { en: 'Sample road closure notice', ko: '예시 도로 통제 공지' },
    body: {
      en: 'The fictional notice concerns either the port access road (port-access-road) or a road none of our shipments uses (unrelated-access-road). The port remains open. We consider changes only for shipments using the affected road.',
      ko: '가상 공지는 항만 연결 도로(port-access-road) 또는 세 화물 모두 이용하지 않는 도로(unrelated-access-road)의 통제를 가정합니다. 항만은 계속 운영되며, 통제 도로를 이용하는 화물에 대해서만 운송 계획 변경을 검토합니다.',
    },
    kind: 'web',
  },
];

const TIGHT_STOCK_DAYS = 7;
const PRIORITY_SLOT_LIMIT = 1;

/**
 * Evaluates fictional records locally to explain a decision, without retrieval
 * calls or transport execution. Slots used are proposed allocations only.
 */
export function evaluateWebIqScenario(
  includeWeb: boolean,
  signal: WebIqSignal,
): WebIqEvaluation {
  const affectedRoad = signal === 'closure' ? 'port-access-road' : 'unrelated-access-road';
  const affectedShipments = includeWeb
    ? WEB_IQ_SHIPMENTS.filter((shipment) => shipment.route.includes(affectedRoad))
    : [];
  const priorityShipments = affectedShipments
    .filter((shipment) => shipment.stockDays <= TIGHT_STOCK_DAYS)
    .sort((left, right) => left.stockDays - right.stockDays || left.id.localeCompare(right.id))
    .slice(0, PRIORITY_SLOT_LIMIT);
  const priorityIds = new Set(priorityShipments.map((shipment) => shipment.id));
  const affectedIds = new Set(affectedShipments.map((shipment) => shipment.id));

  const decisions: WebIqDecision[] = WEB_IQ_SHIPMENTS.map((shipment) => {
    if (priorityIds.has(shipment.id)) {
      return {
        shipmentId: shipment.id,
        action: { en: 'Propose priority transport', ko: '우선 대체 운송을 제안합니다' },
        reason: {
          en: `This shipment uses the closed road and has ${shipment.stockDays} days of stock. It meets the seven-day priority rule, so priority transport is proposed. Carrier confirmation and owner approval are required before booking.`,
          ko: `이 화물은 통제된 도로를 이용하며, 재고는 ${shipment.stockDays}일분입니다. 7일분 이하 기준에 해당하므로 우선 운송을 제안합니다. 예약 전 운송사 확인과 책임자 승인이 필요합니다.`,
        },
        priority: true,
        evidenceIds: ['inventory', 'allocation-policy', 'road-notice'],
      };
    }

    if (affectedIds.has(shipment.id)) {
      return {
        shipmentId: shipment.id,
        action: { en: 'Check whether regular transport can reroute', ko: '일반 운송의 우회 가능성을 확인합니다' },
        reason: {
          en: `This shipment also uses the closed road, but has ${shipment.stockDays} days of stock, above the seven-day threshold. Check whether regular transport can use an alternative route.`,
          ko: `이 화물도 통제된 도로를 이용하지만 재고가 ${shipment.stockDays}일분으로 7일 기준을 넘습니다. 우선 운송 대신 일반 운송의 우회 가능성을 확인합니다.`,
        },
        priority: false,
        evidenceIds: ['inventory', 'allocation-policy', 'road-notice'],
      };
    }

    if (shipment.stockDays <= TIGHT_STOCK_DAYS) {
      return {
        shipmentId: shipment.id,
        action: { en: 'Monitor A and check its route', ko: 'A의 재고와 도로 상황을 확인합니다' },
        reason: {
          en: `This shipment has only ${shipment.stockDays} days of stock. No route restriction has been confirmed, so we should check road conditions before proposing priority transport.`,
          ko: `이 화물의 재고는 ${shipment.stockDays}일분으로 여유가 적습니다. 다만 경로 통제는 확인되지 않았으므로, 우선 운송을 제안하기 전에 도로 상황을 확인해야 합니다.`,
        },
        priority: false,
        evidenceIds: ['inventory', 'allocation-policy'],
      };
    }

    return {
      shipmentId: shipment.id,
      action: { en: 'Keep the current plan', ko: '기존 계획을 유지합니다' },
      reason: {
        en: `${shipment.stockDays} days of stock remain, and no problem on this route has been confirmed. Keep the existing plan.`,
        ko: `재고가 ${shipment.stockDays}일분 남았고, 이 화물이 지날 도로의 문제도 확인되지 않았습니다. 기존 계획을 유지합니다.`,
      },
      priority: false,
      evidenceIds: ['inventory', 'allocation-policy'],
    };
  });

  const trace: WebIqEvaluation['trace'] = [
    {
      title: { en: 'Example decision · Check stock', ko: '예시 판단 · 재고 확인' },
      detail: {
        en: 'Both views use the same fictional data: A has 4 days of stock, B has 20, and C has 12. Only one shipment can get priority transport.',
        ko: '두 비교 모두 같은 가상 자료를 씁니다. 재고는 A 4일분, B 20일분, C 12일분이며 우선 운송은 한 자리입니다.',
      },
    },
    {
      title: { en: 'Example decision · Check the road', ko: '예시 판단 · 도로 확인' },
      detail: !includeWeb
        ? {
            en: 'Only internal records are used. They do not tell us whether a road is blocked.',
            ko: '내부 자료만 사용합니다. 이 자료만으로는 화물이 지날 도로가 막혔는지 알 수 없습니다.',
          }
        : {
            en: `The sample notice names ${affectedRoad}. Shipments using this road: ${affectedShipments.map((shipment) => shipment.id).join(', ') || 'none'}. The port stays open.`,
            ko: `가상 공지에서 막힌 도로는 ${affectedRoad}입니다. 이 도로를 이용하는 화물: ${affectedShipments.map((shipment) => shipment.id).join(', ') || '없음'}. 항만은 계속 운영됩니다.`,
          },
    },
    {
      title: { en: 'Example decision · Apply the rule', ko: '예시 판단 · 배정 기준 적용' },
      detail: {
        en: `The shipment must use the blocked road and have ${TIGHT_STOCK_DAYS} days of stock or less. Proposed priority allocations: ${priorityShipments.length} of ${PRIORITY_SLOT_LIMIT}.`,
        ko: `막힌 도로를 이용하면서 재고가 ${TIGHT_STOCK_DAYS}일분 이하인 화물만 후보입니다. 우선 운송 배정안은 ${PRIORITY_SLOT_LIMIT}자리 중 ${priorityShipments.length}자리입니다.`,
      },
    },
    {
      title: { en: 'Example decision · Get approval', ko: '예시 판단 · 확인 후 승인' },
      detail: {
        en: 'This is a simulated decision trace, not a record of an actual Web IQ search. No transport has been booked. Carrier availability, expected arrival time, and cost must be confirmed before owner approval and booking.',
        ko: '이 화면은 가상 데이터에 따른 판단 과정이며, 실제 Web IQ 검색 기록이 아닙니다. 운송도 예약되지 않았습니다. 운송 가능 여부, 도착 예정 시각, 비용을 확인한 뒤 책임자 승인을 받아야 예약할 수 있습니다.',
      },
    },
  ];

  return { decisions, trace, prioritySlotsUsed: priorityShipments.length };
}
