/** Public pricing metadata only. Configuration is not proof of account access. */
export const WEB_IQ_PRICING_PROFILE = 'webiq-2026-11-12-v1';
export const WEB_IQ_SEARCH_MICRO_USD = 7_000;
export const WEB_IQ_BROWSE_MICRO_USD = 1_000;
export const WEB_IQ_ANSWER_MODEL = 'gpt-4o-2024-11-20';
export const WEB_IQ_ANSWER_INPUT_MICRO_USD_PER_TOKEN = 3;
export const WEB_IQ_ANSWER_OUTPUT_MICRO_USD_PER_TOKEN = 12;
export const WEB_IQ_ANSWER_CONTEXT_TOKENS = 128_000;
export const WEB_IQ_ANSWER_MAX_COMPLETION_TOKENS = 2_500;
export const WEB_IQ_ANSWER_RESERVATION_MICRO_USD = WEB_IQ_SEARCH_MICRO_USD
  + WEB_IQ_ANSWER_CONTEXT_TOKENS * WEB_IQ_ANSWER_INPUT_MICRO_USD_PER_TOKEN
  + WEB_IQ_ANSWER_MAX_COMPLETION_TOKENS * WEB_IQ_ANSWER_OUTPUT_MICRO_USD_PER_TOKEN;

export const WEB_IQ_PRICING = {
  search: {
    operation: 'web', unit: 'microUSD/call', checkedAt: '2026-11-12',
    sourceUrl: 'https://learn.microsoft.com/en-us/web-iq/resources/pricing',
    normalPrice: WEB_IQ_SEARCH_MICRO_USD, conservativeReservation: WEB_IQ_SEARCH_MICRO_USD,
    promotionalCondition: null,
  },
  browse: {
    operation: 'browse', unit: 'microUSD/call', checkedAt: '2026-11-12',
    sourceUrl: 'https://learn.microsoft.com/en-us/web-iq/resources/pricing',
    normalPrice: WEB_IQ_BROWSE_MICRO_USD, conservativeReservation: WEB_IQ_BROWSE_MICRO_USD,
    promotionalCondition: null,
  },
  answer: {
    operation: 'synthesis', unit: 'microUSD/token', checkedAt: '2026-11-10',
    sourceUrl: 'https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/',
    model: WEB_IQ_ANSWER_MODEL,
    // Preserve the existing GlobalStandard estimate with a 20% budget margin.
    input: WEB_IQ_ANSWER_INPUT_MICRO_USD_PER_TOKEN, output: WEB_IQ_ANSWER_OUTPUT_MICRO_USD_PER_TOKEN,
    conservativeReservation: WEB_IQ_ANSWER_RESERVATION_MICRO_USD,
    promotionalCondition: null,
  },
  auto: {
    operation: 'auto', unit: 'microUSD/call', checkedAt: '2026-11-12',
    sourceUrl: 'https://learn.microsoft.com/en-us/web-iq/resources/pricing',
    normalPrice: 8_000, advancedNormalPrice: 9_000,
    promotionalCondition: 'Not charged while in beta; current AppID terms and access must be verified.',
    // No executable pricing profile until AppID access, terms and response schema pass the gate.
    conservativeReservation: null, enabled: false,
  },
} as const;

/** Reject unknown, fractional or unsafe prices instead of treating them as free. */
export function isKnownMicroUsd(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
