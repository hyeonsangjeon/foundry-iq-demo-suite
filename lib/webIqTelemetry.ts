import {
  estimateAnswerSynthesisMicroUsd, WEB_IQ_ANSWER_CONTEXT_TOKENS,
  WEB_IQ_ANSWER_MAX_COMPLETION_TOKENS, WEB_IQ_ANSWER_MODEL,
  WEB_IQ_PRICING_PROFILE, WEB_IQ_SEARCH_MICRO_USD,
} from '@/lib/webIqPricing';

export interface WebIqTelemetry {
  schemaVersion: 'webiq.telemetry.v1';
  timing: {
    webStageWallMs: number | null;
    webRequestWallMs: number | null;
    synthesisStageWallMs: number | null;
    synthesisRequestWallMs: number | null;
  };
  usage: {
    status: 'verified' | 'unknown';
    model: string | null;
    inputTokens: number | null;
    outputTokens: number | null;
  };
  cost: {
    currency: 'USD'; unit: 'microUSD'; kind: 'estimate';
    webSearchMicroUsd: number;
    extraSynthesisMicroUsd: number | null;
    addedKnownMicroUsd: number;
    kbCostStatus: 'not_included';
    pricingProfile: string;
    settlement: 'settled' | 'reservation_retained';
  };
  truncation: {
    internalAnswer: boolean;
    internalSourcesOmitted: number | null;
    internalSourcesAtLimit: boolean;
    internalSourcesAtCharacterLimit: number;
    webPassageMayBePartial: true;
  };
  comparisonClass: 'workflow-observation';
}

const safeCount = (value: unknown, max: number): value is number => typeof value === 'number'
  && Number.isSafeInteger(value) && value >= 0 && value <= max;
const safeMs = (value: unknown): number | null => typeof value === 'number'
  && Number.isFinite(value) && value >= 0 && value <= 300_000 ? Math.round(value) : null;

/** Only usage and model observed in this server's completion establish an estimate. */
export function verifiedAnswerUsage(completion: unknown): WebIqTelemetry['usage'] {
  const unknown: WebIqTelemetry['usage'] = { status: 'unknown', model: null, inputTokens: null, outputTokens: null };
  if (!completion || typeof completion !== 'object') return unknown;
  const value = completion as { model?: unknown; usage?: { prompt_tokens?: unknown; completion_tokens?: unknown } };
  if (value.model !== WEB_IQ_ANSWER_MODEL || !safeCount(value.usage?.prompt_tokens, WEB_IQ_ANSWER_CONTEXT_TOKENS)
    || !safeCount(value.usage?.completion_tokens, WEB_IQ_ANSWER_MAX_COMPLETION_TOKENS)) return unknown;
  return { status: 'verified', model: WEB_IQ_ANSWER_MODEL,
    inputTokens: value.usage.prompt_tokens, outputTokens: value.usage.completion_tokens };
}

/** Safe additive DTO: never return a raw completion, reservation, IP or credential. */
export function buildWebIqTelemetry(options: {
  completion: unknown;
  timing: WebIqTelemetry['timing'];
  settled: boolean;
  internalAnswer: string;
  sourceContents: string[];
}): WebIqTelemetry {
  const usage = verifiedAnswerUsage(options.completion);
  const extraSynthesisMicroUsd = usage.status === 'verified'
    ? estimateAnswerSynthesisMicroUsd(usage.inputTokens!, usage.outputTokens!) : null;
  return {
    schemaVersion: 'webiq.telemetry.v1',
    timing: {
      webStageWallMs: safeMs(options.timing.webStageWallMs), webRequestWallMs: safeMs(options.timing.webRequestWallMs),
      synthesisStageWallMs: safeMs(options.timing.synthesisStageWallMs), synthesisRequestWallMs: safeMs(options.timing.synthesisRequestWallMs),
    },
    usage,
    cost: { currency: 'USD', unit: 'microUSD', kind: 'estimate', webSearchMicroUsd: WEB_IQ_SEARCH_MICRO_USD,
      extraSynthesisMicroUsd, addedKnownMicroUsd: WEB_IQ_SEARCH_MICRO_USD + (extraSynthesisMicroUsd ?? 0),
      kbCostStatus: 'not_included', pricingProfile: WEB_IQ_PRICING_PROFILE,
      settlement: options.settled ? 'settled' : 'reservation_retained' },
    truncation: {
      // At a boundary the server cannot distinguish exact length from client truncation.
      internalAnswer: options.internalAnswer.length >= 30_000,
      internalSourcesOmitted: null,
      internalSourcesAtLimit: options.sourceContents.length >= 20,
      internalSourcesAtCharacterLimit: options.sourceContents.filter(content => content.length >= 6_000).length,
      webPassageMayBePartial: true,
    },
    comparisonClass: 'workflow-observation',
  };
}

/** Validate a received DTO; absent or malformed telemetry stays unknown, never zero. */
export function parseWebIqTelemetry(value: unknown): WebIqTelemetry | null {
  if (!value || typeof value !== 'object') return null;
  const dto = value as WebIqTelemetry;
  if (dto.schemaVersion !== 'webiq.telemetry.v1' || dto.comparisonClass !== 'workflow-observation'
    || !dto.timing || !dto.usage || !dto.cost || !dto.truncation) return null;
  const { cost, usage, truncation } = dto;
  // Previously saved v1 telemetry used GPT-4o at buffered rates of 3/12 microUSD per token.
  // This profile is read-only. Live settlement always checks the current provider model.
  const legacyProfile = cost.pricingProfile === 'webiq-2026-11-12-v1';
  if (cost.currency !== 'USD' || cost.unit !== 'microUSD' || cost.kind !== 'estimate'
    || cost.kbCostStatus !== 'not_included' || (!legacyProfile && cost.pricingProfile !== WEB_IQ_PRICING_PROFILE)
    || cost.webSearchMicroUsd !== WEB_IQ_SEARCH_MICRO_USD
    || !['settled', 'reservation_retained'].includes(cost.settlement)) return null;
  if (!['verified', 'unknown'].includes(usage.status)) return null;
  if (usage.status === 'verified') {
    const expectedModel = legacyProfile ? 'gpt-4o-2024-11-20' : WEB_IQ_ANSWER_MODEL;
    const inputLimit = legacyProfile ? 128_000 : WEB_IQ_ANSWER_CONTEXT_TOKENS;
    if (usage.model !== expectedModel || !safeCount(usage.inputTokens, inputLimit)
      || !safeCount(usage.outputTokens, WEB_IQ_ANSWER_MAX_COMPLETION_TOKENS)) return null;
    const expected = legacyProfile ? usage.inputTokens * 3 + usage.outputTokens * 12
      : estimateAnswerSynthesisMicroUsd(usage.inputTokens, usage.outputTokens);
    if (cost.extraSynthesisMicroUsd !== expected || cost.addedKnownMicroUsd !== WEB_IQ_SEARCH_MICRO_USD + expected) return null;
  } else if (usage.model !== null || usage.inputTokens !== null || usage.outputTokens !== null
    || cost.extraSynthesisMicroUsd !== null || cost.addedKnownMicroUsd !== WEB_IQ_SEARCH_MICRO_USD) return null;
  if (typeof truncation.internalAnswer !== 'boolean' || typeof truncation.internalSourcesAtLimit !== 'boolean'
    || truncation.webPassageMayBePartial !== true || !safeCount(truncation.internalSourcesAtCharacterLimit, 20)
    || !(truncation.internalSourcesOmitted === null || safeCount(truncation.internalSourcesOmitted, Number.MAX_SAFE_INTEGER))) return null;
  return {
    schemaVersion: dto.schemaVersion, comparisonClass: dto.comparisonClass,
    timing: {
      webStageWallMs: safeMs(dto.timing.webStageWallMs), webRequestWallMs: safeMs(dto.timing.webRequestWallMs),
      synthesisStageWallMs: safeMs(dto.timing.synthesisStageWallMs), synthesisRequestWallMs: safeMs(dto.timing.synthesisRequestWallMs),
    },
    usage: { status: usage.status, model: usage.model, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens },
    cost: { currency: 'USD', unit: 'microUSD', kind: 'estimate', webSearchMicroUsd: cost.webSearchMicroUsd,
      extraSynthesisMicroUsd: cost.extraSynthesisMicroUsd, addedKnownMicroUsd: cost.addedKnownMicroUsd,
      kbCostStatus: 'not_included', pricingProfile: cost.pricingProfile, settlement: cost.settlement },
    truncation: { internalAnswer: truncation.internalAnswer, internalSourcesOmitted: truncation.internalSourcesOmitted,
      internalSourcesAtLimit: truncation.internalSourcesAtLimit, internalSourcesAtCharacterLimit: truncation.internalSourcesAtCharacterLimit,
      webPassageMayBePartial: true },
  };
}
