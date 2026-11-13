import { buildKbWebContext, type KbWebAnswerResponse, type KbWebAnswerStatus } from '@/lib/kbWebAnswer';
import { KnowledgeBaseRetrievalError } from '@/lib/api';
import { isAllowedWebIqQuestion } from '@/lib/webIqDemoQuestions';
import { parseWebIqTelemetry } from '@/lib/webIqTelemetry';
import type { KnowledgeBaseRetrievalResponse } from '@/types/knowledge-retrieval';

export type ComparisonState = 'retrieving-kb' | 'retrieving-web' | 'complete' | 'partial' | 'failed' | 'cancelled' | 'blocked_empty';
export type ComparisonErrorStage = 'kb' | 'web' | 'synthesis';
export interface ComparisonSelection {
  kbId: string;
  presetId: string;
  query: string;
  language: 'ko' | 'en';
  settings: Record<string, unknown>;
}
export interface ComparisonRun {
  runId: string;
  attemptId: string;
  selection: ComparisonSelection;
  startedAt: string;
  state: ComparisonState;
  internalTraceResponse?: KnowledgeBaseRetrievalResponse;
  combined?: KbWebAnswerResponse;
  kbRequestWallMs?: number;
  comparisonWallMs?: number;
  webAttemptWallMs?: number;
  errorCode?: string;
  errorStatus?: number;
  errorUpstreamStatus?: number;
  errorProviderCode?: string;
  errorStage?: ComparisonErrorStage;
  retryAfterSeconds?: number;
}

const answerErrorCodes = new Set([
  'ANSWER_FAILED', 'ANSWER_NOT_CONFIGURED', 'QUESTION_NOT_ALLOWED', 'KB_CONTEXT_EMPTY', 'KB_EMPTY',
  'BOT_CHECK_REQUIRED', 'BOT_CHECK_FAILED', 'BOT_CHECK_UNAVAILABLE', 'DAILY_BUDGET_EXHAUSTED', 'RATE_LIMITED',
  'USAGE_GUARD_UNAVAILABLE', 'WEB_SEARCH_FAILED', 'UPSTREAM_INVALID_RESPONSE', 'SYNTHESIS_FAILED',
  'ANSWER_INCOMPLETE', 'CITATION_INVALID', 'UPSTREAM_TIMEOUT', 'UPSTREAM_FAILED', 'INVALID_ANSWER_RESPONSE', 'SNAPSHOT_CHANGED',
]);

export class WebIqComparisonError extends Error {
  public code: string;
  constructor(code: string, public status?: number, public retryAfterSeconds?: number, public stage?: ComparisonErrorStage) {
    const safeCode = answerErrorCodes.has(code) ? code : 'ANSWER_FAILED';
    super(safeCode);
    this.code = safeCode;
    this.name = 'WebIqComparisonError';
  }
}

function comparisonFailure(error: unknown, stage: ComparisonErrorStage) {
  if (error instanceof KnowledgeBaseRetrievalError || error instanceof WebIqComparisonError) {
    return { errorCode: error.code, errorStatus: error.status, errorStage: error.stage || stage,
      errorUpstreamStatus: error instanceof KnowledgeBaseRetrievalError ? error.upstreamStatus : undefined,
      errorProviderCode: error instanceof KnowledgeBaseRetrievalError ? error.providerCode : undefined,
      retryAfterSeconds: error.retryAfterSeconds };
  }
  return { errorCode: stage === 'kb' ? 'KB_RETRIEVAL_FAILED' : 'REQUEST_FAILED', errorStage: stage,
    errorStatus: undefined, errorUpstreamStatus: undefined, errorProviderCode: undefined, retryAfterSeconds: undefined };
}

async function readAnswerResponse(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const header = response.headers.get('Retry-After');
    const retry = header && /^\d+$/.test(header) ? Number(header) : NaN;
    const stage = body?.stage === 'internal' ? 'kb' : body?.stage === 'web' || body?.stage === 'synthesis' ? body.stage : undefined;
    throw new WebIqComparisonError(typeof body?.code === 'string' ? body.code : 'ANSWER_FAILED', response.status,
      Number.isSafeInteger(retry) && retry > 0 && retry <= 86_400 ? retry : undefined, stage);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  return { ...body, telemetry: parseWebIqTelemetry(body.telemetry) ?? undefined };
}

/** Readiness does no paid work; a successful check does not reserve later capacity. */
export async function checkWebIqAnswerReadiness(signal: AbortSignal): Promise<KbWebAnswerStatus> {
  const body = await readAnswerResponse(await fetch('/api/web-iq/answer', { cache: 'no-store', signal }));
  if (!body || body.configured !== true || !body.botProtectionConfigured || !body.turnstileSiteKey) {
    throw new WebIqComparisonError('ANSWER_NOT_CONFIGURED');
  }
  return body;
}

/** Shared /test and Tech adapter: same original KB snapshot, no second retrieval. */
export async function requestWebIqAnswer(query: string, snapshot: KnowledgeBaseRetrievalResponse, token: string, signal: AbortSignal): Promise<KbWebAnswerResponse> {
  if (!isAllowedWebIqQuestion(query)) throw new WebIqComparisonError('QUESTION_NOT_ALLOWED');
  if (!token) throw new WebIqComparisonError('BOT_CHECK_REQUIRED');
  const context = buildKbWebContext(snapshot);
  if (!context.internalAnswer.trim() && context.sources.length === 0) throw new WebIqComparisonError('KB_EMPTY');
  const body = await readAnswerResponse(await fetch('/api/web-iq/answer', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal,
    body: JSON.stringify({ query: query.trim(), internalAnswer: context.internalAnswer, sources: context.sources, turnstileToken: token }),
  }));
  if (!body || typeof body.answer !== 'string' || !Array.isArray(body.sources) || !body.webSearch) {
    throw new WebIqComparisonError('INVALID_ANSWER_RESPONSE');
  }
  return body;
}

interface ControllerDependencies {
  retrieve: (selection: ComparisonSelection, signal: AbortSignal) => Promise<KnowledgeBaseRetrievalResponse>;
  answer: typeof requestWebIqAnswer;
  onChange: (run: ComparisonRun | null) => void;
  now?: () => number;
  id?: () => string;
}

/** Generation guards apply even when a provider ignores AbortSignal. No automatic retry. */
export class WebIqComparisonController {
  private generation = 0;
  private controller: AbortController | null = null;
  private current: ComparisonRun | null = null;
  private started = 0;
  private webAttemptStarted: number | null = null;
  private now: () => number;
  private id: () => string;
  constructor(private deps: ControllerDependencies) {
    this.now = deps.now || (() => performance.now());
    this.id = deps.id || (() => crypto.randomUUID());
  }
  private emit(run: ComparisonRun | null) {
    this.current = run;
    this.deps.onChange(run ? structuredClone(run) : null);
  }
  invalidate() {
    this.generation++;
    this.controller?.abort();
    this.controller = null;
    this.webAttemptStarted = null;
    this.emit(null);
  }
  cancel() {
    if (!this.controller) return;
    this.generation++;
    this.controller?.abort();
    this.controller = null;
    if (this.current) this.emit({ ...this.current, state: 'cancelled',
      comparisonWallMs: this.current.comparisonWallMs ?? Math.round(this.now() - this.started),
      ...(this.webAttemptStarted === null ? {} : { webAttemptWallMs: Math.round(this.now() - this.webAttemptStarted) }),
      errorCode: 'CANCELLED', errorStatus: undefined, errorUpstreamStatus: undefined, errorProviderCode: undefined,
      errorStage: this.current.internalTraceResponse ? 'web' : 'kb' });
    this.webAttemptStarted = null;
  }
  async startComparison(selection: ComparisonSelection, token: string) {
    // Synchronous lock closes the double-click gap before React rerenders.
    if (this.controller) return;
    if (!isAllowedWebIqQuestion(selection.query)) throw new WebIqComparisonError('QUESTION_NOT_ALLOWED');
    if (!token) throw new WebIqComparisonError('BOT_CHECK_REQUIRED');
    const generation = ++this.generation;
    const controller = new AbortController();
    this.controller = controller;
    this.started = this.now();
    this.webAttemptStarted = null;
    const run: ComparisonRun = { runId: this.id(), attemptId: this.id(), selection: structuredClone(selection), startedAt: new Date().toISOString(), state: 'retrieving-kb' };
    this.emit(run);
    try {
      const response = await this.deps.retrieve(run.selection, controller.signal);
      if (generation !== this.generation) return;
      run.internalTraceResponse = structuredClone(response);
      run.kbRequestWallMs = Math.round(this.now() - this.started);
      const context = buildKbWebContext(run.internalTraceResponse);
      if (!context.internalAnswer.trim() && context.sources.length === 0) {
        run.state = 'blocked_empty';
        this.emit({ ...run, comparisonWallMs: Math.round(this.now() - this.started) });
        return;
      }
      run.state = 'retrieving-web';
      this.emit(run);
      // The client cannot extend a token's lifetime. Keep the KB result for explicit retry.
      if (this.now() - this.started >= 300000) throw new WebIqComparisonError('BOT_CHECK_REQUIRED');
      this.webAttemptStarted = this.now();
      run.combined = await this.deps.answer(run.selection.query, structuredClone(run.internalTraceResponse), token, controller.signal);
      if (generation !== this.generation) return;
      run.state = 'complete';
      this.emit({ ...run, comparisonWallMs: Math.round(this.now() - this.started), webAttemptWallMs: Math.round(this.now() - this.webAttemptStarted) });
    } catch (error) {
      if (generation !== this.generation) return;
      run.state = controller.signal.aborted || error instanceof KnowledgeBaseRetrievalError && ['CANCELLED', 'KB_CANCELLED'].includes(error.code)
        ? 'cancelled' : run.internalTraceResponse ? 'partial' : 'failed';
      Object.assign(run, comparisonFailure(error, run.internalTraceResponse ? 'web' : 'kb'));
      if (!run.internalTraceResponse) run.kbRequestWallMs = Math.round(this.now() - this.started);
      this.emit({ ...run, comparisonWallMs: Math.round(this.now() - this.started),
        ...(this.webAttemptStarted === null ? {} : { webAttemptWallMs: Math.round(this.now() - this.webAttemptStarted) }) });
    } finally {
      if (generation === this.generation) { this.controller = null; this.webAttemptStarted = null; }
    }
  }
  async retryWeb(runId: string, token: string, selection: ComparisonSelection) {
    if (this.controller) return;
    const previous = this.current;
    if (!previous || previous.runId !== runId || !previous.internalTraceResponse || previous.state === 'blocked_empty'
      || JSON.stringify(previous.selection) !== JSON.stringify(selection)) throw new WebIqComparisonError('SNAPSHOT_CHANGED');
    if (!token) throw new WebIqComparisonError('BOT_CHECK_REQUIRED');
    const generation = ++this.generation;
    const controller = new AbortController();
    this.controller = controller;
    const run = { ...previous, attemptId: this.id(), state: 'retrieving-web' as ComparisonState, combined: undefined,
      errorCode: undefined, errorStatus: undefined, errorUpstreamStatus: undefined, errorProviderCode: undefined,
      errorStage: undefined, retryAfterSeconds: undefined, webAttemptWallMs: undefined };
    this.webAttemptStarted = this.now();
    this.emit(run);
    try {
      run.combined = await this.deps.answer(run.selection.query, structuredClone(run.internalTraceResponse!), token, controller.signal);
      if (generation !== this.generation) return;
      this.emit({ ...run, state: 'complete', webAttemptWallMs: Math.round(this.now() - this.webAttemptStarted) });
    } catch (error) {
      if (generation !== this.generation) return;
      this.emit({ ...run, state: controller.signal.aborted ? 'cancelled' : 'partial', ...comparisonFailure(error, 'web'),
        webAttemptWallMs: Math.round(this.now() - this.webAttemptStarted) });
    } finally {
      if (generation === this.generation) { this.controller = null; this.webAttemptStarted = null; }
    }
  }
}
