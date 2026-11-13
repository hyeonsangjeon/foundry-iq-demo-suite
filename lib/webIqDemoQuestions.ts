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

/** Public comparison examples pair questions only with material verified for that example. */
export const WEB_IQ_COMPARISON_EXAMPLES: readonly { questionId: string; kbId: string }[] = [
  { questionId: 'nasa-earth-at-night', kbId: 'nasa-earth-book' },
];

/** A missing exact KB disables the example; names of other KBs never imply question fit. */
export function resolveWebIqComparisonExample<T extends { name: string }>(
  questionId: string,
  knowledgeBases: readonly T[],
): { question: WebIqDemoQuestion; kb: T } | null {
  const example = WEB_IQ_COMPARISON_EXAMPLES.find(item => item.questionId === questionId);
  if (!example) return null;
  const question = WEB_IQ_DEMO_QUESTIONS.find(item => item.id === example.questionId);
  const kb = knowledgeBases.find(item => item.name === example.kbId);
  return question && kb ? { question, kb } : null;
}

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
