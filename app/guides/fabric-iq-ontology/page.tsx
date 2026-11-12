
import { WebIqServiceLinks } from '@/components/web-iq/web-iq-service-links';
import { CopyableCodeBlock } from '@/components/guides/copyable-code-block'
import {
  GuideCardGrid,
  GuideCallout,
  GuideHero,
  GuideSection,
  GuideSteps,
  TroubleshootingList,
} from '@/components/guides/guide-components'

const createFabricKs = `python scripts/foundry_iq_easy_setup.py create-fabric-ontology-ks \\
  --domain airline \\
  --ks-name airline-ontology-ks \\
  --workspace-id "<fabric-workspace-guid>" \\
  --ontology-id "<fabric-ontology-guid>"

# Save the redacted payload for review
python scripts/foundry_iq_easy_setup.py create-fabric-ontology-ks \\
  --domain airline \\
  --ks-name airline-ontology-ks \\
  --workspace-id "<fabric-workspace-guid>" \\
  --ontology-id "<fabric-ontology-guid>" \\
  --dry-run \\
  --save-payload /tmp/fabric-ontology-ks.payload.json`

const createKnowledgeBase = `python scripts/foundry_iq_easy_setup.py create-kb \\
  --kb-name airline-fabric-kb \\
  --ks airline-ontology-ks \\
  --model gpt-4o`

const verifyRetrieval = `python scripts/foundry_iq_easy_setup.py retrieve \\
  --kb-name airline-fabric-kb \\
  --question "Which operational metric changed most this month?"

# Cleanup demo resources
python scripts/foundry_iq_easy_setup.py delete-kb \\
  --kb-name airline-fabric-kb \\
  --yes

python scripts/foundry_iq_easy_setup.py delete-ks \\
  --ks-name airline-ontology-ks \\
  --yes`

export const metadata = {
  title: 'Fabric IQ Ontology Guide | Foundry IQ Demo Suite',
  description: 'Connect an existing Fabric IQ ontology to Foundry IQ as a Knowledge Source.',
}

export default function FabricIqOntologyGuidePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <GuideHero
        eyebrow="Guide"
        title="Connect an existing Fabric IQ ontology"
        description="This page is for the Knowledge Source connection only. Fabric workspace setup, Lakehouse ingestion, ontology modeling, and Data Agent internals stay outside this app."
        links={[
          { href: '/fabric-iq-ks', label: 'Open Fabric IQ demo' },
          { href: '/knowledge', label: 'Open Knowledge' },
          { href: '/playground', label: 'Try Playground' },
        ]}
      />

      <WebIqServiceLinks features={['ontology', 'kb-retrieval', 'onelake']} context="documentation" className="grid gap-3 md:grid-cols-2" />

      <GuideCallout title="Preview requirements · checked November 12, 2026">
        Fabric Ontology Knowledge Sources are in preview. Search and the Fabric workspace
        must use the same Microsoft Entra tenant. Retrieval requires an end-user access token
        for Fabric, in addition to authentication to Azure AI Search. This setup script uses
        2026-05-01-preview; current Microsoft Learn examples use 2026-08-01-preview.
        <a className="ml-1 text-accent hover:underline" href="https://learn.microsoft.com/azure/search/agentic-knowledge-source-how-to-fabric-ontology" target="_blank" rel="noopener noreferrer">Read the current Microsoft Learn requirements ↗</a>
      </GuideCallout>

      <GuideCallout title="Excluded scope">
        This guide does not create Fabric workspaces, load Lakehouse data, design ontologies,
        or configure Data Agent internals. It assumes those assets already exist and are accessible.
      </GuideCallout>

      <GuideSection title="Prerequisites">
        <GuideCardGrid
          columns={2}
          items={[
            { title: 'Fabric workspace exists', description: 'You have the workspace ID and the app/user has access.' },
            { title: 'Lakehouse or table data exists', description: 'The ontology is grounded on already prepared Fabric data.' },
            { title: 'Ontology exists', description: 'You have the ontology ID that the Knowledge Source will reference.' },
            { title: 'Same tenant and end-user authorization', description: 'Search and Fabric must share an Entra tenant. Authenticate to Search and pass a Fabric end-user token at retrieval time.' },
          ]}
        />
      </GuideSection>

      <GuideSection title="Required inputs">
        <GuideCardGrid
          columns={2}
          items={[
            { title: 'workspace ID', description: 'Fabric workspace GUID.', meta: '<fabric-workspace-guid>' },
            { title: 'ontology ID', description: 'Fabric ontology GUID.', meta: '<fabric-ontology-guid>' },
            { title: 'KS name', description: 'Unique Knowledge Source name.', meta: 'airline-ontology-ks' },
            { title: 'KB name', description: 'Knowledge Base that attaches the Fabric KS.', meta: 'airline-fabric-kb' },
            { title: 'model deployment', description: 'Azure OpenAI deployment used by the KB.', meta: 'gpt-4o' },
            { title: 'authorization strategy', description: 'Configure Search authentication and the Fabric end-user token separately.' },
          ]}
        />
      </GuideSection>

      <GuideSection title="Steps">
        <GuideSteps
          steps={[
            'Confirm Search auth works. RBAC is preferred for production, API key mode is useful as a rollback path.',
            'Create the Fabric ontology Knowledge Source with the workspace ID and ontology ID.',
            'Create a Knowledge Base and attach the Fabric Knowledge Source.',
            'Retrieve with a Fabric end-user token and ask questions answerable by the ontology. The generic retrieval command below also needs the required token passthrough; see the Microsoft Learn example.',
          ]}
        />
      </GuideSection>

      <section className="grid gap-6 lg:grid-cols-3">
        <CopyableCodeBlock title="Create Fabric Ontology KS" code={createFabricKs} />
        <CopyableCodeBlock title="Create KB" code={createKnowledgeBase} />
        <CopyableCodeBlock title="Verify" code={verifyRetrieval} />
      </section>

      <GuideSection title="Troubleshooting">
        <TroubleshootingList
          items={[
            {
              issue: 'Preview API mismatch',
              fix: 'Fabric ontology and MCP server Knowledge Sources may require a newer preview API version than basic Search index sources.',
            },
            {
              issue: 'Ontology ID not found',
              fix: 'Confirm the workspace ID and ontology ID belong together and that the caller has access.',
            },
            {
              issue: 'Authorization failure',
              fix: 'Check Search authentication separately from the Fabric end-user token. Confirm that Search and the Fabric workspace share the same Entra tenant and that the user can access the ontology.',
            },
            {
              issue: 'Question bypasses ontology semantics',
              fix: 'Ask business questions that match ontology concepts, measures, and relationships instead of raw keyword lookup questions.',
            },
          ]}
        />
      </GuideSection>
    </div>
  )
}
