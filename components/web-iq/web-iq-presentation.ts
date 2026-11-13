import { WEB_IQ_SCENES } from '@/lib/webIqScenario';

const labels = {
  en: ['The question', 'Internal records only', 'Web notice', 'Affected shipments', 'Proposed action', 'Takeaway'],
  ko: ['질문', '내부 자료만 활용', '웹 공지', '영향받는 화물', '대응 제안', '핵심 정리'],
};

export const WEB_IQ_PRESENTATION_STAGES = WEB_IQ_SCENES.map((scene, index) => ({
  ...scene,
  label: { en: labels.en[index], ko: labels.ko[index] },
  includeWeb: index >= 2,
}));

export const WEB_IQ_PRESENTATION_DURATION = WEB_IQ_PRESENTATION_STAGES.reduce((sum, stage) => sum + stage.duration, 0);
export const WEB_IQ_LAST_PRESENTATION_STAGE = WEB_IQ_PRESENTATION_STAGES.length - 1;

export function webIqPresentationStageIndex(value: number): number {
  return Number.isInteger(value) ? Math.max(0, Math.min(WEB_IQ_LAST_PRESENTATION_STAGE, value)) : 0;
}

/** Every stage selector and playback transition uses the same source mode. */
export function webIqPresentationStageUpdate(value: number): Record<string, string> {
  const index = webIqPresentationStageIndex(value);
  return {
    scene: String(index),
    sources: WEB_IQ_PRESENTATION_STAGES[index].includeWeb ? 'web' : 'internal',
    signal: 'closure',
    comparison: 'guided',
  };
}

/** Changing materials moves to a stage that actually uses those materials. */
export function webIqPresentationSourceUpdate(value: number, includeWeb: boolean): Record<string, string> {
  const index = webIqPresentationStageIndex(value);
  return webIqPresentationStageUpdate(includeWeb ? Math.max(2, index) : Math.min(1, index));
}
