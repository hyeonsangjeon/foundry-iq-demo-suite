'use client'

import * as React from 'react'
import Image from 'next/image'
import BookOpen from 'lucide-react/dist/esm/icons/book-open'
import Braces from 'lucide-react/dist/esm/icons/braces'
import CircleAlert from 'lucide-react/dist/esm/icons/circle-alert'
import Database from 'lucide-react/dist/esm/icons/database'
import ExternalLink from 'lucide-react/dist/esm/icons/external-link'
import FileSearch from 'lucide-react/dist/esm/icons/file-search'
import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle'
import MessageSquareText from 'lucide-react/dist/esm/icons/message-square-text'
import Radio from 'lucide-react/dist/esm/icons/radio'
import Search from 'lucide-react/dist/esm/icons/search'
import Send from 'lucide-react/dist/esm/icons/send'
import Server from 'lucide-react/dist/esm/icons/server'
import Sparkles from 'lucide-react/dist/esm/icons/sparkles'
import Star from 'lucide-react/dist/esm/icons/star'
import Workflow from 'lucide-react/dist/esm/icons/workflow'

import { LiveKnowledgeSourcesReference } from '@/components/live-knowledge-sources-reference'
import { McpDemoResponseView } from '@/components/mcp-ks/mcp-demo-response'
import { CopyableCodeBlock } from '@/components/guides/copyable-code-block'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { getLocale, type Locale } from '@/lib/i18n'
import {
  mcpKnowledgeSourceI18n,
  type McpKnowledgeSourceCopy,
} from '@/lib/i18n/mcp-knowledge-source'
import {
  buildSampleMcpResponse,
  MCP_PREVIEW_API_VERSION,
  MICROSOFT_LEARN_MCP_ENDPOINT,
  MICROSOFT_LEARN_MCP_TOOL,
  type McpDemoResponse,
} from '@/lib/mcpKnowledgeSource'
import { cn } from '@/lib/utils'

type DemoMode = 'live' | 'sample'

interface QueryErrorPayload {
  error?: string
  details?: string
}

const CREATE_MCP_KS = JSON.stringify(
  {
    name: 'microsoft-learn-mcp-ks',
    kind: 'mcpServer',
    description: 'Official Microsoft Learn documentation, queried live through MCP.',
    mcpServerParameters: {
      serverURL: MICROSOFT_LEARN_MCP_ENDPOINT,
      tools: [
        {
          name: MICROSOFT_LEARN_MCP_TOOL,
          outputParsing: {
            kind: 'auto',
          },
          inclusionMode: 'reranked',
          maxOutputTokens: 1000,
        },
      ],
    },
  },
  null,
  2
)

const CREATE_KNOWLEDGE_BASE = JSON.stringify(
  {
    name: 'repolis-mslearn-kb',
    description: 'Microsoft Learn MCP grounding with answer synthesis.',
    outputMode: 'answerSynthesis',
    retrievalReasoningEffort: {
      kind: 'medium',
    },
    knowledgeSources: [
      {
        name: 'microsoft-learn-mcp-ks',
      },
    ],
    models: [
      {
        kind: 'azureOpenAI',
        azureOpenAIParameters: {
          resourceUri: 'https://<resource>.cognitiveservices.azure.com',
          deploymentId: '<deployment>',
          modelName: '<model>',
        },
      },
    ],
    retrievalInstructions: 'Always call microsoft_docs_search before answering.',
    answerInstructions: 'Use only Microsoft Learn references and reply in the language of the question.',
  },
  null,
  2
)

const FLOW_STEP_ICONS = [MessageSquareText, Database, Server, FileSearch, Sparkles] as const
const FLOW_STEP_META = [
  'messages[]',
  'answerSynthesis',
  'kind: mcpServer',
  MICROSOFT_LEARN_MCP_TOOL,
  'response + activity',
] as const

function buildRetrievePayload(question: string): string {
  return JSON.stringify(
    {
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: question,
            },
          ],
        },
      ],
      knowledgeSourceParams: [
        {
          knowledgeSourceName: 'microsoft-learn-mcp-ks',
          kind: 'mcpServer',
          includeReferenceSourceData: true,
        },
      ],
      maxRuntimeInSeconds: 90,
    },
    null,
    2
  )
}

export function McpKnowledgeSourceDemo() {
  const [locale, setLocale] = React.useState<Locale>('en')
  const [activeTab, setActiveTab] = React.useState('demo')
  const [mode, setMode] = React.useState<DemoMode>('live')
  const [question, setQuestion] = React.useState<string>(mcpKnowledgeSourceI18n.en.questions[0])
  const [liveResult, setLiveResult] = React.useState<McpDemoResponse | null>(null)
  const [sampleResult, setSampleResult] = React.useState<McpDemoResponse>(() =>
    buildSampleMcpResponse(mcpKnowledgeSourceI18n.en.questions[0], 'en')
  )
  const [isLoading, setIsLoading] = React.useState(false)
  const [notice, setNotice] = React.useState<string | null>(null)
  const copy = mcpKnowledgeSourceI18n[locale]

  React.useEffect(() => {
    const nextLocale = getLocale()
    const nextCopy = mcpKnowledgeSourceI18n[nextLocale]

    setLocale(nextLocale)
    setQuestion(nextCopy.questions[0])
    setSampleResult(buildSampleMcpResponse(nextCopy.questions[0], nextLocale))
    setLiveResult(null)
    setNotice(null)
  }, [])

  const activeResult = mode === 'live' ? liveResult : sampleResult
  const retrievePayload = React.useMemo(
    () => buildRetrievePayload(copy.questions[0]),
    [copy.questions]
  )

  const submitQuery = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedQuestion = question.trim()

    if (!normalizedQuestion || isLoading) return

    setNotice(null)

    if (mode === 'sample') {
      setSampleResult(buildSampleMcpResponse(normalizedQuestion, locale))
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/mcp-knowledge-source/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: normalizedQuestion,
        }),
      })
      const payload = await response.json() as McpDemoResponse | QueryErrorPayload

      if (!response.ok) {
        const errorPayload = payload as QueryErrorPayload
        throw new Error(errorPayload.details || errorPayload.error || copy.liveUnavailable)
      }

      setLiveResult(payload as McpDemoResponse)
    } catch (error) {
      setSampleResult(buildSampleMcpResponse(normalizedQuestion, locale))
      setMode('sample')
      const details = error instanceof Error && error.message !== copy.liveUnavailable
        ? ` ${error.message}`
        : ''
      setNotice(`${copy.liveUnavailable}${details}`)
    } finally {
      setIsLoading(false)
    }
  }

  const selectMode = (nextMode: DemoMode) => {
    setMode(nextMode)
    setNotice(null)
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-12">
      <header className="flex flex-col gap-5 border-b border-stroke-divider pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-stroke-divider bg-bg-card">
            <Image src="/icons/mcp.svg" alt="" width={28} height={28} priority />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase text-accent">{copy.eyebrow}</span>
              <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                {copy.previewBadge}
              </span>
              <span className="font-mono text-[10px] text-fg-subtle">{MCP_PREVIEW_API_VERSION}</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-fg-default md:text-3xl">
              {copy.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-fg-muted">
              {copy.subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <a
            href="https://learn.microsoft.com/azure/search/agentic-knowledge-source-how-to-mcp-server"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-accent hover:underline"
          >
            {copy.microsoftLearn}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <a
            href="https://github.com/hyeonsangjeon/Repolis/blob/main/SCHOLARS.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-fg-muted hover:text-fg-default hover:underline"
          >
            {copy.repolisReference}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <a
            href="https://github.com/hyeonsangjeon/foundry-iq-demo-suite"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-fg-muted hover:text-fg-default hover:underline"
          >
            <Star className="h-3.5 w-3.5" aria-hidden="true" />
            {copy.starDemo}
          </a>
        </div>
      </header>

      <LiveKnowledgeSourcesReference locale={locale} focus="mcp" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-lg p-1 sm:w-auto">
          <TabsTrigger
            value="demo"
            className="min-w-0 flex-1 gap-1 rounded-md px-1.5 text-[11px] sm:flex-none sm:gap-2 sm:px-4 sm:text-sm"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            {copy.tabDemo}
          </TabsTrigger>
          <TabsTrigger
            value="flow"
            className="min-w-0 flex-1 gap-1 rounded-md px-1.5 text-[11px] sm:flex-none sm:gap-2 sm:px-4 sm:text-sm"
          >
            <Workflow className="h-4 w-4" aria-hidden="true" />
            {copy.tabFlow}
          </TabsTrigger>
          <TabsTrigger
            value="configuration"
            className="min-w-0 flex-1 gap-1 rounded-md px-1.5 text-[11px] sm:flex-none sm:gap-2 sm:px-4 sm:text-sm"
          >
            <Braces className="h-4 w-4" aria-hidden="true" />
            {copy.tabConfiguration}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="mt-6">
          <section className="rounded-lg border border-stroke-divider bg-bg-card p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase text-fg-subtle">{copy.queryEyebrow}</p>
                <h2 className="mt-1 text-base font-semibold text-fg-default">{copy.queryTitle}</h2>
              </div>
              <ModeControl mode={mode} disabled={isLoading} copy={copy} onChange={selectMode} />
            </div>

            <form className="mt-5" onSubmit={submitQuery}>
              <div className="grid gap-2 sm:grid-cols-3">
                {copy.questions.map((sampleQuestion, index) => (
                  <button
                    key={sampleQuestion}
                    type="button"
                    onClick={() => setQuestion(sampleQuestion)}
                    disabled={isLoading}
                    className={cn(
                      'min-h-[92px] rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                      question === sampleQuestion
                        ? 'border-accent/50 bg-accent-subtle text-accent'
                        : 'border-stroke-divider bg-bg-subtle text-fg-muted hover:border-accent-muted hover:text-fg-default'
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-semibold text-fg-subtle">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {index === 0 ? (
                        <span className="text-[10px] font-semibold text-accent">{copy.startHere}</span>
                      ) : null}
                    </span>
                    <span className="mt-2 block text-xs font-medium leading-5">{sampleQuestion}</span>
                  </button>
                ))}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3 text-[11px]">
                    <label htmlFor="mcp-question" className="font-semibold text-fg-default">
                      {copy.questionLabel}
                    </label>
                    <span className="text-right text-fg-subtle">
                      {mode === 'live' ? copy.questionHint : copy.sampleResult} ·{' '}
                      {question.length.toLocaleString(locale)}/2,000
                    </span>
                  </div>
                  <Textarea
                    id="mcp-question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    disabled={isLoading}
                    maxLength={2000}
                    aria-label={copy.questionAria}
                    className="min-h-[104px] resize-y rounded-lg bg-bg-subtle font-normal leading-6"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !question.trim()}
                  className="h-11 min-w-32 gap-2 rounded-lg md:mb-0"
                >
                  {isLoading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden="true" />
                  )}
                  {isLoading ? copy.retrieving : mode === 'live' ? copy.runLive : copy.runSample}
                </Button>
              </div>
            </form>

            {isLoading ? <LoadingStages copy={copy} /> : null}
          </section>

          {notice ? (
            <div
              role="status"
              className="mt-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-5 text-amber-800 dark:text-amber-200"
            >
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{notice}</p>
            </div>
          ) : null}

          <div className="mt-5">
            {activeResult ? (
              <McpDemoResponseView result={activeResult} locale={locale} />
            ) : (
              <EmptyResult label={copy.noRetrieval} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="flow" className="mt-6">
          <RequestFlow copy={copy} />
        </TabsContent>

        <TabsContent value="configuration" className="mt-6">
          <Configuration copy={copy} retrievePayload={retrievePayload} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ModeControl({
  mode,
  disabled,
  copy,
  onChange,
}: {
  mode: DemoMode
  disabled: boolean
  copy: McpKnowledgeSourceCopy
  onChange: (mode: DemoMode) => void
}) {
  return (
    <div
      role="group"
      aria-label={`${copy.liveMode} / ${copy.sampleMode}`}
      className="inline-flex w-fit items-center rounded-lg border border-stroke-divider bg-bg-subtle p-1"
    >
      <button
        type="button"
        aria-pressed={mode === 'live'}
        disabled={disabled}
        onClick={() => onChange('live')}
        className={cn(
          'inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          mode === 'live' ? 'bg-bg-card text-fg-default shadow-sm' : 'text-fg-muted hover:text-fg-default'
        )}
      >
        <Radio className="h-3.5 w-3.5" aria-hidden="true" />
        {copy.liveMode}
      </button>
      <button
        type="button"
        aria-pressed={mode === 'sample'}
        disabled={disabled}
        onClick={() => onChange('sample')}
        className={cn(
          'inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          mode === 'sample' ? 'bg-bg-card text-fg-default shadow-sm' : 'text-fg-muted hover:text-fg-default'
        )}
      >
        <Database className="h-3.5 w-3.5" aria-hidden="true" />
        {copy.sampleMode}
      </button>
    </div>
  )
}

function LoadingStages({ copy }: { copy: McpKnowledgeSourceCopy }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-5 grid gap-2 border-t border-stroke-divider pt-4 text-[11px] text-fg-muted sm:grid-cols-3"
    >
      <LoadingStage icon={Sparkles} label={copy.loadingPlanning} />
      <LoadingStage icon={Server} label={copy.loadingCalling} />
      <LoadingStage icon={FileSearch} label={copy.loadingSynthesizing} />
    </div>
  )
}

function LoadingStage({
  icon: Icon,
  label,
}: {
  icon: typeof Sparkles
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
      <Icon className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

function EmptyResult({ label }: { label: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-stroke-divider bg-bg-subtle/40 px-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-stroke-divider bg-bg-card">
        <Search className="h-5 w-5 text-fg-subtle" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-sm font-semibold text-fg-default">{label}</h2>
    </div>
  )
}

function RequestFlow({ copy }: { copy: McpKnowledgeSourceCopy }) {
  return (
    <div className="space-y-6">
      <section>
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase text-accent">{copy.flowEyebrow}</p>
          <h2 className="mt-1 text-xl font-semibold text-fg-default">{copy.flowTitle}</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {copy.flowSteps.map((step, index) => {
            const Icon = FLOW_STEP_ICONS[index]
            const meta = FLOW_STEP_META[index]
            return (
              <article key={step.title} className="relative rounded-lg border border-stroke-divider bg-bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-subtle text-accent">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-[10px] text-fg-subtle">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="mt-5 text-sm font-semibold text-fg-default">{step.title}</h3>
                <p className="mt-2 text-xs leading-5 text-fg-muted">{step.description}</p>
                <p className="mt-4 truncate font-mono text-[10px] text-accent" title={meta}>{meta}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-stroke-divider bg-bg-card p-5 md:grid-cols-3">
        <FlowFact icon={Radio} title={copy.flowFacts[0].title} body={copy.flowFacts[0].description} />
        <FlowFact icon={Database} title={copy.flowFacts[1].title} body={copy.flowFacts[1].description} />
        <FlowFact icon={BookOpen} title={copy.flowFacts[2].title} body={copy.flowFacts[2].description} />
      </section>

      <section className="overflow-hidden rounded-lg border border-stroke-divider bg-bg-card">
        <div className="border-b border-stroke-divider px-5 py-4">
          <h2 className="text-sm font-semibold text-fg-default">{copy.responseContract}</h2>
        </div>
        <div className="grid divide-y divide-stroke-divider md:grid-cols-3 md:divide-x md:divide-y-0">
          <ContractField name="response" detail={copy.contractFields[0].description} />
          <ContractField name="activity" detail={copy.contractFields[1].description} />
          <ContractField name="references" detail={copy.contractFields[2].description} />
        </div>
      </section>
    </div>
  )
}

function FlowFact({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Radio
  title: string
  body: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
      <div>
        <h3 className="text-xs font-semibold text-fg-default">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-fg-muted">{body}</p>
      </div>
    </div>
  )
}

function ContractField({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="p-5">
      <code className="font-mono text-xs font-semibold text-accent">{name}</code>
      <p className="mt-2 text-xs leading-5 text-fg-muted">{detail}</p>
    </div>
  )
}

function Configuration({
  copy,
  retrievePayload,
}: {
  copy: McpKnowledgeSourceCopy
  retrievePayload: string
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-3">
        <CopyableCodeBlock title={copy.configMcpTitle} code={CREATE_MCP_KS} language="json" />
        <CopyableCodeBlock title={copy.configKbTitle} code={CREATE_KNOWLEDGE_BASE} language="json" />
        <CopyableCodeBlock title={copy.configRetrieveTitle} code={retrievePayload} language="json" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-lg border border-stroke-divider bg-bg-card">
          <div className="border-b border-stroke-divider px-5 py-4">
            <h2 className="text-sm font-semibold text-fg-default">{copy.referenceMapping}</h2>
          </div>
          <dl className="divide-y divide-stroke-divider text-xs">
            <ConfigurationRow term={copy.mcpEndpoint} value={MICROSOFT_LEARN_MCP_ENDPOINT} />
            <ConfigurationRow term={copy.tool} value={MICROSOFT_LEARN_MCP_TOOL} />
            <ConfigurationRow term={copy.authentication} value={copy.authenticationValue} />
            <ConfigurationRow term={copy.inclusionMode} value="reranked" />
            <ConfigurationRow term={copy.outputParsing} value="auto" />
            <ConfigurationRow term={copy.previewApi} value={MCP_PREVIEW_API_VERSION} />
          </dl>
        </div>

        <div className="rounded-lg border border-stroke-divider bg-bg-card p-5">
          <h2 className="text-sm font-semibold text-fg-default">{copy.sourceMaterial}</h2>
          <div className="mt-4 space-y-3">
            <ResourceLink
              href="https://github.com/microsoft/azure-ai-search-foundry-iq-live-knowledge-sources"
              title={copy.resourceMcpTitle}
              meta={copy.resourceMcpMeta}
            />
            <ResourceLink
              href="https://learn.microsoft.com/azure/search/agentic-knowledge-source-how-to-mcp-server"
              title={copy.resourceLearnTitle}
              meta={copy.resourceLearnMeta}
            />
            <ResourceLink
              href="https://github.com/hyeonsangjeon/Repolis/blob/main/SCHOLARS.md"
              title={copy.resourceRepolisTitle}
              meta={copy.resourceRepolisMeta}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function ConfigurationRow({ term, value }: { term: string; value: string }) {
  return (
    <div className="grid gap-1 px-5 py-3 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-4">
      <dt className="font-semibold text-fg-subtle">{term}</dt>
      <dd className="break-all font-mono text-[11px] text-fg-default">{value}</dd>
    </div>
  )
}

function ResourceLink({ href, title, meta }: { href: string; title: string; meta: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start justify-between gap-3 rounded-md border border-stroke-divider bg-bg-subtle px-4 py-3 transition-colors hover:border-accent-muted"
    >
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-fg-default group-hover:text-accent">{title}</span>
        <span className="mt-1 block text-[11px] text-fg-subtle">{meta}</span>
      </span>
      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fg-subtle group-hover:text-accent" aria-hidden="true" />
    </a>
  )
}
