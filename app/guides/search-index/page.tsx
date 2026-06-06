import { CopyableCodeBlock } from '@/components/guides/copyable-code-block'
import {
  GuideCardGrid,
  GuideCallout,
  GuideHero,
  GuideSection,
  GuideSteps,
  TroubleshootingList,
} from '@/components/guides/guide-components'

const createSearchIndexKs = `python scripts/foundry_iq_easy_setup.py create-search-index-ks \\
  --domain airline \\
  --ks-name airline-policy-ks \\
  --index-name airline-policy-index

# Preview the REST payload first
python scripts/foundry_iq_easy_setup.py create-search-index-ks \\
  --domain airline \\
  --ks-name airline-policy-ks \\
  --index-name airline-policy-index \\
  --dry-run`

const createKnowledgeBase = `python scripts/foundry_iq_easy_setup.py create-kb \\
  --kb-name airline-ops-kb \\
  --ks airline-policy-ks \\
  --model gpt-4o`

const verifyRetrieval = `python scripts/foundry_iq_easy_setup.py retrieve \\
  --kb-name airline-ops-kb \\
  --question "What compensation policy applies to delayed flights?"

python scripts/foundry_iq_easy_setup.py list-ks
python scripts/foundry_iq_easy_setup.py list-kb

# Cleanup demo resources
python scripts/foundry_iq_easy_setup.py delete-kb \\
  --kb-name airline-ops-kb \\
  --yes

python scripts/foundry_iq_easy_setup.py delete-ks \\
  --ks-name airline-policy-ks \\
  --yes`

export const metadata = {
  title: 'Search Index Guide | Foundry IQ Demo Suite',
  description: 'Create a Foundry IQ Knowledge Source from an existing Azure AI Search index.',
}

export default function SearchIndexGuidePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <GuideHero
        eyebrow="Guide"
        title="Use an existing Search index as a Knowledge Source"
        description="This is the fastest path when your data is already indexed in Azure AI Search. The script only creates the Knowledge Source and Knowledge Base wiring; it does not ingest documents."
        links={[
          { href: '/knowledge-sources', label: 'View Knowledge Sources' },
          { href: '/knowledge', label: 'Open Knowledge' },
          { href: '/playground', label: 'Try Playground' },
        ]}
      />

      <GuideSection
        title="When to choose this path"
        description="Use this route for MVP demos, controlled enterprise datasets, and debugging retrieval quality before adding SharePoint, Fabric IQ, or MCP sources."
      >
        <GuideCardGrid
          items={[
            {
              title: 'Data is already indexed',
              description: 'Documents, chunks, vectors, and fields already exist in an Azure AI Search index.',
            },
            {
              title: 'Index name is stable',
              description: 'You know the exact index name and can query it with the configured Search credential.',
            },
            {
              title: 'Retrieval can be tested quickly',
              description: 'Create one KS, attach it to one KB, then verify answers with a small set of known questions.',
            },
          ]}
        />
      </GuideSection>

      <GuideSection title="Required inputs">
        <GuideCardGrid
          columns={2}
          items={[
            { title: 'domain', description: 'Human label used for generated descriptions.', meta: 'airline' },
            { title: 'knowledge source name', description: 'Unique KS name in the Search service.', meta: 'airline-policy-ks' },
            { title: 'index name', description: 'Existing Azure AI Search index name.', meta: 'airline-policy-index' },
            { title: 'knowledge base name', description: 'KB that will attach to the KS.', meta: 'airline-ops-kb' },
            { title: 'model deployment', description: 'Azure OpenAI deployment used by the KB.', meta: 'gpt-4o' },
            { title: 'auth mode', description: 'API key or Search RBAC, controlled by environment variables.', meta: 'AZURE_SEARCH_USE_RBAC' },
          ]}
        />
      </GuideSection>

      <GuideSection title="Steps">
        <GuideSteps
          steps={[
            'Run check and confirm Search endpoint, API version, auth mode, and Azure OpenAI endpoint are set.',
            'Create a searchIndex Knowledge Source that points at the existing index.',
            'Create a Knowledge Base and attach the Knowledge Source.',
            'Run retrieve with a question that should be answerable from the indexed data.',
          ]}
        />
      </GuideSection>

      <section className="grid gap-6 lg:grid-cols-3">
        <CopyableCodeBlock title="Create Search Index KS" code={createSearchIndexKs} />
        <CopyableCodeBlock title="Create KB" code={createKnowledgeBase} />
        <CopyableCodeBlock title="Verify" code={verifyRetrieval} />
      </section>

      <GuideCallout title="Retrieval quality check">
        Use three short questions with expected answers. If the KB responds vaguely, fix the index fields,
        semantic configuration, or chunking before adding more Knowledge Sources.
      </GuideCallout>

      <GuideSection title="Troubleshooting">
        <TroubleshootingList
          items={[
            {
              issue: 'Wrong index name',
              fix: 'Run list indexes in the Azure portal or Search REST API, then retry with the exact index name.',
            },
            {
              issue: 'Missing semantic configuration',
              fix: 'The KS can be created, but answer quality may be weak. Add title/content fields and semantic ranking where needed.',
            },
            {
              issue: 'API key or RBAC failure',
              fix: 'Run the check command. If RBAC is enabled, the service principal needs Search Index Data Reader on the Search service.',
            },
            {
              issue: 'Empty retrieval results',
              fix: 'Query the index directly first. Confirm documents exist and the question uses terms present in indexed content.',
            },
          ]}
        />
      </GuideSection>
    </div>
  )
}
