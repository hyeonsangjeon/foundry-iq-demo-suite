import { CopyableCodeBlock } from '@/components/guides/copyable-code-block'
import {
  GuideCardGrid,
  GuideCallout,
  GuideHero,
  GuideSection,
  GuideSteps,
  TroubleshootingList,
} from '@/components/guides/guide-components'

const createMcpKs = `python scripts/foundry_iq_easy_setup.py create-mcp-ks \\
  --domain docs \\
  --ks-name learn-docs-mcp-ks \\
  --server-url "https://learn.microsoft.com/api/mcp" \\
  --tool microsoft_docs_search \\
  --output-parsing auto \\
  --inclusion-mode reranked \\
  --max-output-tokens 1000`

const createKnowledgeBase = `python scripts/foundry_iq_easy_setup.py create-kb \\
  --kb-name docs-mcp-kb \\
  --ks learn-docs-mcp-ks \\
  --model gpt-4o`

const verifyRetrieval = `python scripts/foundry_iq_easy_setup.py retrieve \\
  --kb-name docs-mcp-kb \\
  --question "How do I create an Azure AI Search knowledge source for MCP?"

# Cleanup demo resources
python scripts/foundry_iq_easy_setup.py delete-kb \\
  --kb-name docs-mcp-kb \\
  --yes

python scripts/foundry_iq_easy_setup.py delete-ks \\
  --ks-name learn-docs-mcp-ks \\
  --yes`

export const metadata = {
  title: 'MCP Server Guide | Foundry IQ Demo Suite',
  description: 'Connect a remote HTTPS MCP server as a Foundry IQ Knowledge Source.',
}

export default function McpServerGuidePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <GuideHero
        eyebrow="Guide"
        title="Connect a remote MCP server as a Knowledge Source"
        description="MCP Server Knowledge Sources let a Knowledge Base call a remote HTTPS MCP tool during retrieval. Start with the Microsoft Learn MCP endpoint because it is a simple no-auth sample."
        links={[
          { href: '/knowledge-sources', label: 'View Knowledge Sources' },
          { href: '/knowledge', label: 'Open Knowledge' },
          { href: '/playground', label: 'Try Playground' },
        ]}
      />

      <GuideCallout title="Remote server requirement">
        Local stdio MCP servers cannot be attached directly. Use a reachable HTTPS MCP server
        or a managed connection pattern approved for the tenant.
      </GuideCallout>

      <GuideSection title="Required inputs">
        <GuideCardGrid
          columns={2}
          items={[
            { title: 'server URL', description: 'HTTPS endpoint for the MCP server.', meta: 'https://learn.microsoft.com/api/mcp' },
            { title: 'tool name', description: 'Exact tool name exposed by the MCP server.', meta: 'microsoft_docs_search' },
            { title: 'output parsing mode', description: 'How the tool output is parsed into retrieval data.', meta: 'auto' },
            { title: 'inclusion mode', description: 'Whether output is reranked or always included.', meta: 'reranked' },
            { title: 'max output tokens', description: 'Token budget for MCP tool output.', meta: '1000' },
            { title: 'KB name', description: 'Knowledge Base that attaches the MCP KS.', meta: 'docs-mcp-kb' },
          ]}
        />
      </GuideSection>

      <GuideSection title="Auth patterns">
        <GuideCardGrid
          columns={4}
          items={[
            { title: 'No auth', description: 'Use for public MCP endpoints such as the Microsoft Learn sample.' },
            { title: 'Stored headers', description: 'Server-side stored headers can work for simple tenant-owned services.' },
            { title: 'Foundry connection', description: 'Use a managed connection when the platform requires centralized credential handling.' },
            { title: 'Query-time passthrough', description: 'Forward end-user authorization only when the MCP server is designed for it.' },
          ]}
        />
      </GuideSection>

      <GuideSection title="Steps">
        <GuideSteps
          steps={[
            'Confirm the MCP server is reachable over HTTPS from the Search service environment.',
            'Create an MCP Server Knowledge Source with the server URL and exact tool name.',
            'Create a Knowledge Base and attach the MCP Knowledge Source.',
            'Ask a question that should trigger the MCP tool and inspect the returned references.',
          ]}
        />
      </GuideSection>

      <section className="grid gap-6 lg:grid-cols-3">
        <CopyableCodeBlock title="Create MCP Server KS" code={createMcpKs} />
        <CopyableCodeBlock title="Create KB" code={createKnowledgeBase} />
        <CopyableCodeBlock title="Verify" code={verifyRetrieval} />
      </section>

      <GuideSection title="Troubleshooting">
        <TroubleshootingList
          items={[
            {
              issue: 'MCP server not reachable',
              fix: 'Use a public HTTPS endpoint or make sure firewall, DNS, and TLS configuration allow Search to reach it.',
            },
            {
              issue: 'Tool name mismatch',
              fix: 'Check the exact MCP tool name. A display label is not always the same as the callable tool identifier.',
            },
            {
              issue: 'Output too large',
              fix: 'Reduce max output tokens or make the MCP tool return smaller structured results.',
            },
            {
              issue: 'Timeout',
              fix: 'Reduce tool latency, simplify the query, or increase runtime settings where supported.',
            },
          ]}
        />
      </GuideSection>
    </div>
  )
}
