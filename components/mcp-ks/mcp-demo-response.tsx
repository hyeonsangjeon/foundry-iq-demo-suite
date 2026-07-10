import { memo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Braces from 'lucide-react/dist/esm/icons/braces'
import Clock3 from 'lucide-react/dist/esm/icons/clock-3'
import ExternalLink from 'lucide-react/dist/esm/icons/external-link'
import FileText from 'lucide-react/dist/esm/icons/file-text'
import Route from 'lucide-react/dist/esm/icons/route'
import Sparkles from 'lucide-react/dist/esm/icons/sparkles'
import Wrench from 'lucide-react/dist/esm/icons/wrench'

import {
  extractMcpAnswer,
  findMcpActivity,
  parseMcpReference,
  type McpDemoResponse,
  type ParsedMcpReference,
} from '@/lib/mcpKnowledgeSource'
import type { Locale } from '@/lib/i18n'
import {
  mcpKnowledgeSourceI18n,
  type McpKnowledgeSourceCopy,
} from '@/lib/i18n/mcp-knowledge-source'
import { cn } from '@/lib/utils'

interface McpDemoResponseViewProps {
  result: McpDemoResponse
  locale: Locale
}

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-fg-default">{children}</strong>,
  code: ({ children }) => (
    <code className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-[0.85em] text-fg-default">
      {children}
    </code>
  ),
  a: ({ href, children }) => {
    const label = String(children)
    const isCitation = /^\d+$/.test(label)
    const external = href?.startsWith('http')

    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className={cn(
          'transition-colors',
          isCitation
            ? 'mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded bg-accent-subtle px-1 text-[10px] font-bold text-accent hover:bg-accent hover:text-fg-on-accent'
            : 'font-medium text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent'
        )}
      >
        {children}
        {!isCitation && external ? <ExternalLink className="ml-1 inline h-3 w-3" aria-hidden="true" /> : null}
      </a>
    )
  },
}

function formatElapsed(milliseconds: number | undefined, copy: McpKnowledgeSourceCopy): string {
  if (milliseconds === undefined) return '—'
  return milliseconds < 1000
    ? `${milliseconds} ${copy.milliseconds}`
    : `${(milliseconds / 1000).toFixed(1)} ${copy.seconds}`
}

function addCitationLinks(answer: string, references: ParsedMcpReference[]): string {
  return answer.replace(/\[ref_id:(\d+)\]/g, (_, rawId: string) => {
    const reference = references.find((item) => item.id === rawId)
    const label = Number(rawId) + 1
    return reference?.url ? `[${label}](${reference.url})` : `[${label}](#mcp-reference-${rawId})`
  })
}

function getActivityTokens(activity: McpDemoResponse['activity'][number] | undefined): number {
  if (!activity) return 0

  if (activity.type === 'modelQueryPlanning' || activity.type === 'modelAnswerSynthesis') {
    return activity.inputTokens + activity.outputTokens
  }

  if (activity.type === 'agenticReasoning') {
    return activity.reasoningTokens
  }

  return 0
}

function McpDemoResponseViewComponent({ result, locale }: McpDemoResponseViewProps) {
  const copy = mcpKnowledgeSourceI18n[locale]
  const answer = extractMcpAnswer(result)
  const references = (result.references || []).map(parseMcpReference)
  const mcpActivity = findMcpActivity(result)
  const planning = result.activity.find((item) => item.type === 'modelQueryPlanning')
  const synthesis = result.activity.find((item) => item.type === 'modelAnswerSynthesis')
  const reasoning = result.activity.find((item) => item.type === 'agenticReasoning')
  const totalElapsed = result.activity.reduce((sum, activity) => sum + (activity.elapsedMs || 0), 0)
  const totalTokens = result.activity.reduce((sum, activity) => sum + getActivityTokens(activity), 0)
  const toolQuery = mcpActivity?.mcpServerArguments.toolArguments.query
  const answerWithCitations = addCitationLinks(answer, references)

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
      <section className="min-w-0 rounded-lg border border-stroke-divider bg-bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stroke-divider px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-fg-subtle">{copy.groundedAnswer}</p>
            <h2 className="mt-1 text-base font-semibold text-fg-default">{copy.responseTitle}</h2>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
              result.demo.mode === 'live'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                result.demo.mode === 'live' ? 'bg-emerald-500' : 'bg-amber-500'
              )}
            />
            {result.demo.mode === 'live' ? copy.liveResult : copy.sampleResult}
          </span>
        </div>

        <div className="grid grid-cols-3 border-b border-stroke-divider bg-bg-subtle/50">
          <Metric label={copy.referencesMetric} value={String(references.length)} />
          <Metric label={copy.elapsedMetric} value={formatElapsed(totalElapsed, copy)} />
          <Metric
            label={copy.tokensMetric}
            value={totalTokens > 0 ? totalTokens.toLocaleString(locale) : '—'}
          />
        </div>

        <div className="px-5 py-6">
          <div className="prose-sm max-w-none text-sm leading-7 text-fg-muted">
            {answer ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {answerWithCitations}
              </ReactMarkdown>
            ) : (
              <p>{copy.noAnswer}</p>
            )}
          </div>
        </div>

        <div className="border-t border-stroke-divider">
          <div className="flex items-center gap-2 px-5 py-4">
            <FileText className="h-4 w-4 text-accent" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-fg-default">{copy.referencesTitle}</h3>
          </div>
          <div className="divide-y divide-stroke-divider">
            {references.length > 0 ? (
              references.map((reference, index) => (
                <ReferenceRow
                  key={reference.id}
                  reference={reference}
                  index={index}
                  openDocument={copy.openDocument}
                />
              ))
            ) : (
              <p className="px-5 pb-5 text-sm text-fg-muted">{copy.noReferences}</p>
            )}
          </div>
        </div>
      </section>

      <aside className="min-w-0 rounded-lg border border-stroke-divider bg-bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase text-fg-subtle">{copy.activityTrace}</p>
            <h2 className="mt-1 text-base font-semibold text-fg-default">{copy.activityTitle}</h2>
          </div>
          <Route className="h-5 w-5 text-accent" aria-hidden="true" />
        </div>

        <div className="mt-6 space-y-0">
          <TraceStep
            icon={Sparkles}
            title={copy.queryPlanning}
            detail={copy.queryPlanningDescription}
            meta={formatElapsed(planning?.elapsedMs, copy)}
            first
          />
          <TraceStep
            icon={Wrench}
            title={copy.mcpToolCall}
            detail={
              typeof toolQuery === 'string' && toolQuery
                ? toolQuery
                : 'microsoft_docs_search'
            }
            meta={formatElapsed(mcpActivity?.elapsedMs, copy)}
          />
          <TraceStep
            icon={FileText}
            title={copy.rerankedReferences}
            detail={copy.resultCount(mcpActivity?.count || references.length)}
            meta={mcpActivity?.knowledgeSourceName || result.demo.knowledgeSourceName}
          />
          <TraceStep
            icon={Sparkles}
            title={copy.answerSynthesis}
            detail={copy.answerSynthesisDescription}
            meta={formatElapsed(synthesis?.elapsedMs, copy)}
            last
          />
        </div>

        <dl className="mt-6 divide-y divide-stroke-divider border-y border-stroke-divider text-xs">
          <DefinitionRow term={copy.knowledgeBase} value={result.demo.knowledgeBaseName} />
          <DefinitionRow term={copy.knowledgeSource} value={result.demo.knowledgeSourceName} />
          <DefinitionRow term={copy.tool} value={result.demo.toolName} />
          <DefinitionRow
            term={copy.reasoning}
            value={reasoning?.type === 'agenticReasoning' ? reasoning.retrievalReasoningEffort.kind : '—'}
          />
          <DefinitionRow term={copy.apiVersion} value={result.demo.apiVersion} />
        </dl>

        <details className="group mt-5">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-fg-muted hover:text-fg-default">
            <Braces className="h-4 w-4" aria-hidden="true" />
            {copy.rawResponse}
          </summary>
          <pre className="mt-3 max-h-80 overflow-auto rounded-md bg-bg-subtle p-3 text-[10px] leading-5 text-fg-muted">
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      </aside>
    </div>
  )
}

export const McpDemoResponseView = memo(McpDemoResponseViewComponent)

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-r border-stroke-divider px-4 py-3 last:border-r-0">
      <p className="truncate text-[10px] font-semibold uppercase text-fg-subtle">{label}</p>
      <p className="mt-1 truncate font-mono text-xs font-semibold text-fg-default">{value}</p>
    </div>
  )
}

function ReferenceRow({
  reference,
  index,
  openDocument,
}: {
  reference: ParsedMcpReference
  index: number
  openDocument: string
}) {
  return (
    <article id={`mcp-reference-${reference.id}`} className="px-5 py-4">
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-accent-subtle text-[10px] font-bold text-accent">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h4 className="text-sm font-semibold leading-5 text-fg-default">{reference.title}</h4>
            {reference.score !== null ? (
              <span className="shrink-0 font-mono text-[10px] text-fg-subtle">
                {reference.score.toFixed(2)}
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-3 text-xs leading-5 text-fg-muted">{reference.snippet}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10px] text-fg-subtle">{reference.toolName}</span>
            {reference.url ? (
              <a
                href={reference.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
              >
                {openDocument}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}

function TraceStep({
  icon: Icon,
  title,
  detail,
  meta,
  first = false,
  last = false,
}: {
  icon: typeof Clock3
  title: string
  detail: string
  meta: string
  first?: boolean
  last?: boolean
}) {
  return (
    <div className="relative grid grid-cols-[28px_minmax(0,1fr)] gap-3 pb-5 last:pb-0">
      {!first ? <span className="absolute left-[13px] top-0 h-3 w-px -translate-y-full bg-stroke-divider" /> : null}
      {!last ? <span className="absolute left-[13px] top-7 h-[calc(100%-20px)] w-px bg-stroke-divider" /> : null}
      <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-md border border-stroke-divider bg-bg-subtle text-accent">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <div className="min-w-0 pt-0.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-xs font-semibold text-fg-default">{title}</h3>
          <span className="max-w-[45%] truncate font-mono text-[10px] text-fg-subtle" title={meta}>
            {meta}
          </span>
        </div>
        <p className="mt-1 break-words text-[11px] leading-5 text-fg-muted">{detail}</p>
      </div>
    </div>
  )
}

function DefinitionRow({ term, value }: { term: string; value: string }) {
  return (
    <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3 py-2.5">
      <dt className="text-fg-subtle">{term}</dt>
      <dd className="truncate text-right font-mono text-[10px] text-fg-default" title={value}>
        {value}
      </dd>
    </div>
  )
}
