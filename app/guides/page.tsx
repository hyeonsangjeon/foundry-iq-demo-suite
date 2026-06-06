import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle,
  Code2,
  Database,
  FileText,
  Plug,
  ShieldCheck,
} from 'lucide-react'
import { CopyableCodeBlock } from '@/components/guides/copyable-code-block'

const quickstart = `# 1) Check local Search configuration
python scripts/foundry_iq_easy_setup.py check

# 2) Connect an existing Search index as a Knowledge Source
python scripts/foundry_iq_easy_setup.py create-search-index-ks \\
  --domain airline \\
  --ks-name airline-policy-ks \\
  --index-name airline-policy-index

# 3) Create a Knowledge Base from one or more Knowledge Sources
python scripts/foundry_iq_easy_setup.py create-kb \\
  --kb-name airline-ops-kb \\
  --ks airline-policy-ks \\
  --model gpt-4o

# 4) Verify retrieval
python scripts/foundry_iq_easy_setup.py retrieve \\
  --kb-name airline-ops-kb \\
  --question "What compensation policy applies to delayed flights?"`

const fabricIq = `# This assumes the Fabric workspace and ontology already exist.
python scripts/foundry_iq_easy_setup.py create-fabric-ontology-ks \\
  --domain airline \\
  --ks-name airline-ontology-ks \\
  --workspace-id "<fabric-workspace-guid>" \\
  --ontology-id "<fabric-ontology-guid>"`

const mcp = `# Public Microsoft Learn MCP sample
python scripts/foundry_iq_easy_setup.py create-mcp-ks \\
  --domain docs \\
  --ks-name learn-docs-mcp-ks \\
  --server-url "https://learn.microsoft.com/api/mcp" \\
  --tool microsoft_docs_search`

const sharePointEnv = `SP_TENANT_ID="<tenant-guid>"
SP_APP_ID="<app-client-id>"
SP_APP_SECRET="<client-secret>"
SP_SITE_URL="https://contoso.sharepoint.com/sites/your-site"
NEXT_PUBLIC_SP_LIVE_AVAILABLE=true`

const guideCards = [
  {
    title: 'Search Index KS',
    description: 'Use an existing Azure AI Search index as the fastest first Knowledge Source.',
    href: '/guides/search-index',
    icon: ShieldCheck,
  },
  {
    title: 'SharePoint',
    description: 'Index SharePoint content, create a KS, then attach it to a Knowledge Base.',
    href: '/guides/sharepoint',
    icon: FileText,
  },
  {
    title: 'Fabric IQ Ontology',
    description: 'Connect an existing Fabric ontology without rebuilding Fabric backend data setup.',
    href: '/guides/fabric-iq-ontology',
    icon: Plug,
  },
  {
    title: 'MCP Server KS',
    description: 'Attach a remote HTTPS MCP tool such as Microsoft Learn MCP.',
    href: '/guides/mcp-server',
    icon: Database,
  },
]

const envRows = [
  ['AZURE_SEARCH_ENDPOINT', 'Required', 'Search service URL'],
  ['AZURE_SEARCH_API_KEY', 'Required for api-key mode', 'Keep for rollback even when RBAC is enabled'],
  ['AZURE_SEARCH_API_VERSION', 'Required', 'Use 2025-11-01-preview or 2026-05-01-preview for preview KS types'],
  ['AZURE_SEARCH_USE_RBAC', 'Optional', 'true for Search RBAC, false for api-key mode'],
  ['AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET', 'Required for RBAC', 'Service principal used for Search bearer token'],
  ['NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT', 'Required for KB model config', 'Azure OpenAI resource endpoint'],
  ['SP_*', 'SharePoint only', 'Required only for SharePoint live setup'],
]

export const metadata = {
  title: 'Guides | Foundry IQ Demo Suite',
  description: 'Beginner-friendly guides and scripts for creating Foundry IQ knowledge sources and knowledge bases.',
}

export default function GuidesPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <section className="border-b border-stroke-divider pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Guided setup
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-fg-default md:text-4xl">
          Build a Knowledge Base without reading the REST spec first
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-fg-muted md:text-base">
          Use this page as the in-app checklist. Use the script when you want the same steps
          from a terminal with domain-level inputs such as domain, KB name, index name, and ontology IDs.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {guideCards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-lg border border-stroke-divider bg-bg-card p-4 transition-colors hover:border-accent-muted hover:bg-bg-elevated"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <Icon className="h-5 w-5 text-accent" />
                <ArrowRight className="h-4 w-4 text-fg-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg-default" />
              </div>
              <h2 className="text-sm font-semibold text-fg-default">{card.title}</h2>
              <p className="mt-2 text-xs leading-5 text-fg-muted">{card.description}</p>
            </Link>
          )
        })}
      </section>

      <section className="rounded-lg border border-stroke-divider bg-bg-card p-5">
        <h2 className="text-lg font-semibold text-fg-default">Start here</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-fg-muted">
          Run the environment check first, then pick one Knowledge Source path. Search Index is the fastest
          first run; SharePoint is for indexed collaboration content; Fabric IQ is for ontology-grounded reasoning;
          MCP Server is for calling remote tools during retrieval.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div id="environment" className="rounded-lg border border-stroke-divider bg-bg-card p-5">
          <h2 className="text-lg font-semibold text-fg-default">Environment checklist</h2>
          <p className="mt-2 text-sm leading-6 text-fg-muted">
            The app never needs to display secret values. It only needs to know whether the keys exist
            and which auth mode should be used.
          </p>
          <div className="mt-5 overflow-hidden rounded-lg border border-stroke-divider">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-subtle text-fg-subtle">
                <tr>
                  <th className="px-3 py-2 font-semibold">Key</th>
                  <th className="px-3 py-2 font-semibold">Use</th>
                  <th className="px-3 py-2 font-semibold">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke-divider">
                {envRows.map(([key, use, note]) => (
                  <tr key={key}>
                    <td className="px-3 py-2 font-mono text-fg-default">{key}</td>
                    <td className="px-3 py-2 text-fg-muted">{use}</td>
                    <td className="px-3 py-2 text-fg-muted">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <CopyableCodeBlock
          title="Terminal quickstart"
          code={quickstart}
        />
      </section>

      <section id="data" className="rounded-lg border border-stroke-divider bg-bg-card p-5">
        <h2 className="text-lg font-semibold text-fg-default">Data input paths</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            ['Existing Search index', 'Fastest path. Use when data is already indexed and has a semantic configuration.'],
            ['SharePoint pipeline', 'Use the SharePoint page to create source, index, indexer, knowledge source, and KB.'],
            ['Fabric IQ ontology', 'Assume workspace, lakehouse, ontology, and data agent already exist. Connect only the KS here.'],
          ].map(([title, body]) => (
            <div key={title} className="rounded-lg border border-stroke-divider bg-bg-subtle p-4">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <h3 className="mt-3 text-sm font-semibold text-fg-default">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-fg-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="knowledge-sources" className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-stroke-divider bg-bg-card p-5">
          <h2 className="text-lg font-semibold text-fg-default">Knowledge Source recipes</h2>
          <p className="mt-2 text-sm leading-6 text-fg-muted">
            Keep the first run narrow: one domain, one KB, one or two knowledge sources. Add more only after retrieval is stable.
          </p>
          <div className="mt-5 space-y-3 text-sm text-fg-muted">
            <p><span className="font-semibold text-fg-default">searchIndex</span>: existing Azure AI Search index.</p>
            <p><span className="font-semibold text-fg-default">fabricOntology</span>: live Fabric ontology, no ingestion pipeline.</p>
            <p><span className="font-semibold text-fg-default">mcpServer</span>: remote HTTPS MCP tools such as Microsoft Learn MCP.</p>
          </div>
        </div>
        <div className="space-y-4">
          <CopyableCodeBlock title="Fabric IQ Ontology KS" code={fabricIq} />
          <CopyableCodeBlock title="MCP Server KS" code={mcp} />
        </div>
      </section>

      <section id="knowledge-base" className="rounded-lg border border-stroke-divider bg-bg-card p-5">
        <div className="flex items-start gap-3">
          <Code2 className="mt-0.5 h-5 w-5 text-accent" />
          <div>
            <h2 className="text-lg font-semibold text-fg-default">Notebook, Bash, or Python?</h2>
            <p className="mt-2 text-sm leading-6 text-fg-muted">
              Use Python as the source of truth because it can validate inputs, build payloads, and run in CI.
              Keep Bash as a thin wrapper for shell users. Add notebooks only for workshop walkthroughs where
              narrative, screenshots, and cell-by-cell explanation matter.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-stroke-divider bg-bg-card p-5">
          <h2 className="text-lg font-semibold text-fg-default">SharePoint live setup</h2>
          <p className="mt-2 text-sm leading-6 text-fg-muted">
            SharePoint is intentionally separate from Fabric IQ. Configure these values, then use the SharePoint page to run the pipeline.
          </p>
          <div className="mt-5">
            <Link
              href="/sharepoint"
              className="inline-flex items-center gap-2 rounded-lg border border-stroke-divider px-4 py-2 text-sm font-semibold text-fg-default transition-colors hover:border-accent-muted hover:bg-bg-hover"
            >
              Open SharePoint setup
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <CopyableCodeBlock title="SharePoint env keys" code={sharePointEnv} />
      </section>
    </div>
  )
}
