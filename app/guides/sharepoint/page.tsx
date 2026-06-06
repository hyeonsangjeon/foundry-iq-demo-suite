import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CopyableCodeBlock } from '@/components/guides/copyable-code-block'
import {
  GuideCardGrid,
  GuideCallout,
  GuideHero,
  GuideSection,
  GuideSteps,
  TroubleshootingList,
} from '@/components/guides/guide-components'

const sharePointEnv = `SP_TENANT_ID="<tenant-guid>"
SP_APP_ID="<app-client-id>"
SP_APP_SECRET="<client-secret>"
SP_SITE_URL="https://contoso.sharepoint.com/sites/your-site"
NEXT_PUBLIC_SP_LIVE_AVAILABLE=true`

const localCheck = `python scripts/foundry_iq_easy_setup.py check
npm run dev

# Open the SharePoint setup page
# http://localhost:3000/sharepoint`

export const metadata = {
  title: 'SharePoint Guide | Foundry IQ Demo Suite',
  description: 'Beginner guide for indexed SharePoint data in the Foundry IQ demo app.',
}

export default function SharePointGuidePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <GuideHero
        eyebrow="Guide"
        title="Index SharePoint content and connect it to a Knowledge Base"
        description="This guide covers indexed SharePoint content. It uses the app's SharePoint page and API routes to discover documents, create an index pipeline, create a Knowledge Source, and verify the Knowledge Base."
        links={[
          { href: '/sharepoint', label: 'Open SharePoint setup' },
          { href: '/knowledge', label: 'Open Knowledge' },
          { href: '/playground', label: 'Try Playground' },
        ]}
      />

      <GuideCallout title="Scope">
        This is not Remote SharePoint ACL passthrough. Treat it as an indexed SharePoint pipeline:
        Graph reads the site content, Azure AI Search indexes it, and the Knowledge Base retrieves from Search.
      </GuideCallout>

      <GuideSection title="Required environment keys">
        <GuideCardGrid
          columns={2}
          items={[
            { title: 'SP_TENANT_ID', description: 'Tenant that owns the SharePoint site.' },
            { title: 'SP_APP_ID', description: 'App registration used for Microsoft Graph access.' },
            { title: 'SP_APP_SECRET', description: 'Secret for the SharePoint app registration. Never expose this client-side.' },
            { title: 'SP_SITE_URL', description: 'Full SharePoint site URL.' },
            { title: 'NEXT_PUBLIC_SP_LIVE_AVAILABLE', description: 'Set true to enable live SharePoint UI flows.' },
            { title: 'Search auth', description: 'Search API key or RBAC must already work for indexing and KS creation.' },
          ]}
        />
      </GuideSection>

      <section className="grid gap-6 lg:grid-cols-2">
        <CopyableCodeBlock title="SharePoint env placeholders" code={sharePointEnv} />
        <CopyableCodeBlock title="Local check" code={localCheck} />
      </section>

      <GuideSection title="Flow">
        <GuideSteps
          steps={[
            'Open the SharePoint setup page and run the connection check.',
            'Discover documents from the configured SharePoint site.',
            'Create or run the indexing pipeline so Search has indexed documents.',
            'Create the SharePoint Knowledge Source from the indexed content.',
            'Create or open the Knowledge Base and verify answers in the playground.',
          ]}
        />
      </GuideSection>

      <GuideSection title="Where to run each step">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['/sharepoint', 'SharePoint setup', 'Connection check, discovery, indexing, and KS creation.'],
            ['/knowledge', 'Knowledge page', 'Inspect KB and source wiring after pipeline creation.'],
            ['/playground', 'Playground', 'Ask verification questions and inspect citations.'],
          ].map(([href, title, description]) => (
            <Link
              key={href}
              href={href}
              className="group rounded-lg border border-stroke-divider bg-bg-card p-4 transition-colors hover:border-accent-muted hover:bg-bg-elevated"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-fg-default">{title}</h3>
                <ArrowRight className="h-4 w-4 text-fg-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg-default" />
              </div>
              <p className="mt-2 text-xs leading-5 text-fg-muted">{description}</p>
            </Link>
          ))}
        </div>
      </GuideSection>

      <GuideSection title="Troubleshooting">
        <TroubleshootingList
          items={[
            {
              issue: 'Graph permission missing',
              fix: 'Confirm the app registration has the required Microsoft Graph application permissions and admin consent.',
            },
            {
              issue: 'Invalid site URL',
              fix: 'Use the full site URL, not a document library URL or a single file URL.',
            },
            {
              issue: 'Indexer failed',
              fix: 'Check the indexer status details first. Most failures are permissions, unsupported files, or field mapping issues.',
            },
            {
              issue: 'Search API auth failure',
              fix: 'If RBAC is enabled, confirm the service principal has the required Search roles. If using API key mode, keep the key valid.',
            },
          ]}
        />
      </GuideSection>
    </div>
  )
}
