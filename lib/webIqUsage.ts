import { isIP } from 'node:net';
import { NextRequest, NextResponse } from 'next/server';

import { DemoUsageError, reserveDemoUsage } from '@/lib/demoUsageLedger';
import { isAllowedWebIqQuestion } from '@/lib/webIqDemoQuestions';
import {
  WEB_IQ_SEARCH_MICRO_USD, WEB_IQ_ANSWER_MAX_COMPLETION_TOKENS, WEB_IQ_ANSWER_INPUT_MICRO_USD_PER_TOKEN,
  WEB_IQ_ANSWER_OUTPUT_MICRO_USD_PER_TOKEN, WEB_IQ_ANSWER_CONTEXT_TOKENS, WEB_IQ_ANSWER_RESERVATION_MICRO_USD,
} from '@/lib/webIqPricing';
import { verifiedAnswerUsage } from '@/lib/webIqTelemetry';

// Microsoft Web IQ /web: $7 per 1,000 calls, verified 2026-11-10.
export const WEB_IQ_CALL_MICRO_USD = WEB_IQ_SEARCH_MICRO_USD;
export const ANSWER_MAX_COMPLETION_TOKENS = WEB_IQ_ANSWER_MAX_COMPLETION_TOKENS;
// gpt-4o 2024-11-20 GlobalStandard: verified retail $2.50/$10 per million,
// with a 20% budget margin. Cache discounts are deliberately not assumed.
export const ANSWER_INPUT_MICRO_USD_PER_TOKEN = WEB_IQ_ANSWER_INPUT_MICRO_USD_PER_TOKEN;
export const ANSWER_OUTPUT_MICRO_USD_PER_TOKEN = WEB_IQ_ANSWER_OUTPUT_MICRO_USD_PER_TOKEN;
export const ANSWER_CONTEXT_TOKENS = WEB_IQ_ANSWER_CONTEXT_TOKENS;
export const ANSWER_RESERVATION_MICRO_USD = WEB_IQ_ANSWER_RESERVATION_MICRO_USD;

export function answerPricingConfigured(): boolean {
  // A deployment alias alone does not establish its model or price.
  return process.env.WEBIQ_ANSWER_PRICING_MODEL === 'gpt-4o-2024-11-20';
}

export function answerUsageMicroUsd(completion: unknown): number | null {
  const usage = verifiedAnswerUsage(completion);
  if (usage.status !== 'verified') return null;
  return WEB_IQ_CALL_MICRO_USD + usage.inputTokens! * ANSWER_INPUT_MICRO_USD_PER_TOKEN + usage.outputTokens! * ANSWER_OUTPUT_MICRO_USD_PER_TOKEN;
}

/** Trust only the hosting provider's overwritten IP header. Local mode is explicit. */
export function demoClientIp(request: NextRequest): string {
  if (process.env.VERCEL === '1') {
    const value = request.headers.get('x-vercel-forwarded-for')?.trim() || '';
    if (isIP(value) === 4) return value;
    if (isIP(value) === 6) {
      const canonical = new URL(`http://[${value}]/`).hostname.slice(1, -1);
      // IPv4-mapped IPv6 addresses share the same bucket as their IPv4 form.
      const mapped = /^::ffff:([0-9a-f]+):([0-9a-f]+)$/.exec(canonical);
      if (mapped) {
        const high = parseInt(mapped[1], 16);
        const low = parseInt(mapped[2], 16);
        return `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
      }
      return canonical;
    }
    throw new Error('Trusted client IP unavailable');
  }
  // This mode must only be used with a server bound to loopback. Never trust Host/XFF.
  if (process.env.DEMO_USAGE_LOCAL_ONLY === 'true') return '127.0.0.1';
  throw new Error('Trusted client IP unavailable');
}

export function questionNotAllowed(query: string): NextResponse | null {
  return isAllowedWebIqQuestion(query) ? null : NextResponse.json({
    code: 'QUESTION_NOT_ALLOWED',
    error: '공개 체험에서는 화면에 있는 예시 질문을 선택해 주세요.',
  }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
}

/** Errors are intentionally independent of upstream configuration/credential errors. */
export function usageErrorResponse(error: unknown): NextResponse {
  const headers: Record<string, string> = { 'Cache-Control': 'no-store' };
  if (error instanceof DemoUsageError && error.code !== 'usage_unavailable') {
    const daily = error.code === 'daily_budget_exceeded';
    const seconds = Math.max(1, Math.ceil(error.retryAfterSeconds || 1));
    headers['Retry-After'] = String(seconds);
    return NextResponse.json({
      code: daily ? 'DAILY_BUDGET_EXHAUSTED' : 'RATE_LIMITED',
      error: daily
        ? '오늘의 실제 검색 체험 한도를 모두 사용했습니다. 한국시간 자정 이후 다시 이용해 주세요.'
        : `요청이 많아 잠시 쉬고 있습니다. ${seconds}초 후 다시 시도해 주세요.`,
      retryAfterSeconds: seconds,
      resetsAt: new Date(Date.now() + seconds * 1_000).toISOString(),
    }, { status: 429, headers });
  }
  return NextResponse.json({
    code: 'USAGE_GUARD_UNAVAILABLE',
    error: '사용량을 확인하지 못해 실제 검색을 잠시 중단했습니다. 예시 시나리오는 계속 볼 수 있습니다.',
  }, { status: 503, headers });
}

export async function reserveWebIqUsage(request: NextRequest, microUsd: number) {
  return reserveDemoUsage(demoClientIp(request), microUsd);
}
