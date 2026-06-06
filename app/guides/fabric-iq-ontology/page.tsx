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
            { title: 'Authorization path is decided', description: 'Use server credential, end-user token passthrough, or a tenant-approved pattern.' },
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
            { title: 'authorization strategy', description: 'Document whether retrieval uses server auth or user auth.' },
          ]}
        />
      </GuideSection>

      <GuideSection title="Steps">
        <GuideSteps
          steps={[
            'Confirm Search auth works. RBAC is preferred for production, API key mode is useful as a rollback path.',
            'Create the Fabric ontology Knowledge Source with the workspace ID and ontology ID.',
            'Create a Knowledge Base and attach the Fabric Knowledge Source.',
            'Ask verification questions that are answerable by the ontology, not by raw document text.',
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
              fix: 'Decide whether the app uses server credentials or end-user authorization. Do not mix both paths without a clear tenant policy.',
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
