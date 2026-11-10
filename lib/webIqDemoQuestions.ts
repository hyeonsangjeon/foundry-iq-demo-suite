export interface WebIqDemoQuestion {
  id: string;
  ko: string;
  en: string;
}

/** Public demo questions shared by the selection UI and server validation. */
export const WEB_IQ_DEMO_QUESTIONS: readonly WebIqDemoQuestion[] = [
  {
    id: 'port-road-notices',
    ko: '항만 접근 도로 통제 터미널 운영 공지',
    en: 'port access road closure terminal operations advisory',
  },
  {
    id: 'incheon-port-notices',
    ko: '인천항만공사 공식 항만 운영 및 출입 도로 통제 공지',
    en: 'Incheon Port Authority official port operations and access road closure notices',
  },
  {
    id: 'nasa-earth-at-night',
    ko: 'NASA 공식 지구의 야간 위성 관측 자료와 최근 연구',
    en: 'NASA official Earth at Night satellite observations and recent research',
  },
];

/** Derive answer language only from an exact preset; retrieved text cannot override it. */
export function getWebIqQuestionLanguage(query: string): 'ko' | 'en' | null {
  const normalized = query.trim().replace(/\s+/g, ' ');
  for (const question of WEB_IQ_DEMO_QUESTIONS) {
    if (question.ko === normalized) return 'ko';
    if (question.en === normalized) return 'en';
  }
  return null;
}

/** Whitespace differences are allowed; the question itself must match a preset. */
export function isAllowedWebIqQuestion(query: string): boolean {
  return getWebIqQuestionLanguage(query) !== null;
}
