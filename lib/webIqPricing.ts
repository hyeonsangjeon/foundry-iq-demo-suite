/** Public pricing metadata only. Configuration is not proof of account access. */
export const WEB_IQ_PRICING_PROFILE = 'webiq-2026-11-19-v2';
export const WEB_IQ_SEARCH_MICRO_USD = 7_000;
export const WEB_IQ_BROWSE_MICRO_USD = 1_000;
export const WEB_IQ_AUTO_MICRO_USD = 8_000;
export const WEB_IQ_ANSWER_DEPLOYMENT = 'gpt-5.4-mini';
export const WEB_IQ_ANSWER_MODEL = 'gpt-5.4-mini-2026-03-17';
// Global Standard USD per million tokens is numerically equal to microUSD per token.
const RETAIL_INPUT_MICRO_USD_PER_TOKEN = 0.75;
const RETAIL_OUTPUT_MICRO_USD_PER_TOKEN = 4.5;
const ANSWER_BUDGET_MARGIN_PERCENT = 20;
export const WEB_IQ_ANSWER_INPUT_MICRO_USD_PER_TOKEN = RETAIL_INPUT_MICRO_USD_PER_TOKEN * (100 + ANSWER_BUDGET_MARGIN_PERCENT) / 100;
export const WEB_IQ_ANSWER_OUTPUT_MICRO_USD_PER_TOKEN = RETAIL_OUTPUT_MICRO_USD_PER_TOKEN * (100 + ANSWER_BUDGET_MARGIN_PERCENT) / 100;
export const WEB_IQ_ANSWER_CONTEXT_TOKENS = 272_000;
export const WEB_IQ_ANSWER_MAX_COMPLETION_TOKENS = 2_500;
// The shared broker admits this fixed ceiling. Unverified charges keep it in full.
export const WEB_IQ_ANSWER_RESERVATION_MICRO_USD = 421_000;

/** Budget estimate for verified token counts. Treat every input token as uncached. */
export function estimateAnswerSynthesisMicroUsd(inputTokens: number, outputTokens: number): number {
  const retailMicroUsd = inputTokens * RETAIL_INPUT_MICRO_USD_PER_TOKEN + outputTokens * RETAIL_OUTPUT_MICRO_USD_PER_TOKEN;
  // Apply the margin before rounding once to the integer unit accepted by the ledger.
  return Math.ceil(retailMicroUsd * (100 + ANSWER_BUDGET_MARGIN_PERCENT) / 100);
}

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
    operation: 'synthesis', unit: 'microUSD/token', checkedAt: '2026-11-19',
    sourceUrl: 'https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/',
    model: WEB_IQ_ANSWER_MODEL,
    retailInput: RETAIL_INPUT_MICRO_USD_PER_TOKEN, retailOutput: RETAIL_OUTPUT_MICRO_USD_PER_TOKEN,
    budgetMarginPercent: ANSWER_BUDGET_MARGIN_PERCENT,
    input: WEB_IQ_ANSWER_INPUT_MICRO_USD_PER_TOKEN, output: WEB_IQ_ANSWER_OUTPUT_MICRO_USD_PER_TOKEN,
    conservativeReservation: WEB_IQ_ANSWER_RESERVATION_MICRO_USD,
    promotionalCondition: null,
  },
  auto: {
    operation: 'auto', unit: 'microUSD/call', checkedAt: '2026-11-17',
    sourceUrl: 'https://learn.microsoft.com/en-us/web-iq/resources/pricing',
    normalPrice: WEB_IQ_AUTO_MICRO_USD, advancedNormalPrice: 9_000,
    promotionalCondition: null, chargedFrom: '2026-11-17', mode: 'lite',
    // Product availability and executable pricing do not enable this application's route.
    conservativeReservation: WEB_IQ_AUTO_MICRO_USD, enabled: false,
  },
} as const;

/** Reject unknown, fractional or unsafe prices instead of treating them as free. */
export function isKnownMicroUsd(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
