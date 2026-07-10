import BookOpen from 'lucide-react/dist/esm/icons/book-open'
import ExternalLink from 'lucide-react/dist/esm/icons/external-link'
import Github from 'lucide-react/dist/esm/icons/github'
import Route from 'lucide-react/dist/esm/icons/route'

import { liveKnowledgeSourcesI18n } from '@/lib/i18n/live-knowledge-sources'
import type { Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const OFFICIAL_REPO = 'https://github.com/microsoft/azure-ai-search-foundry-iq-live-knowledge-sources'
const MCP_GUIDE = `${OFFICIAL_REPO}/blob/main/docs/03-mcp-server-ks.md`
const FABRIC_GUIDE = `${OFFICIAL_REPO}/blob/main/docs/04-fabric-ontology-ks.md`
const COMBINED_GUIDE = `${OFFICIAL_REPO}/blob/main/docs/05-combined-kb-routing.md`

interface LiveKnowledgeSourcesReferenceProps {
  locale: Locale
  focus: 'mcp' | 'fabric'
  className?: string
}

export function LiveKnowledgeSourcesReference({
  locale,
  focus,
  className,
}: LiveKnowledgeSourcesReferenceProps) {
  const copy = liveKnowledgeSourcesI18n[locale]
  const focusedGuide = focus === 'mcp'
    ? { href: MCP_GUIDE, label: copy.mcpGuide }
    : { href: FABRIC_GUIDE, label: copy.fabricGuide }
  const secondaryGuide = focus === 'mcp'
    ? { href: FABRIC_GUIDE, label: copy.fabricGuide }
    : { href: MCP_GUIDE, label: copy.mcpGuide }

  return (
    <section
      aria-labelledby={`live-knowledge-sources-${focus}`}
      className={cn('overflow-hidden rounded-lg border border-stroke-divider bg-bg-card', className)}
    >
      <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2 text-accent">
            <Github className="h-4 w-4" aria-hidden="true" />
            <p className="text-[11px] font-semibold uppercase">{copy.eyebrow}</p>
          </div>
          <h2
            id={`live-knowledge-sources-${focus}`}
            className="mt-2 max-w-3xl text-base font-semibold leading-6 text-fg-default sm:text-lg"
          >
            {copy.title}
          </h2>
          <p className="mt-2 max-w-4xl text-xs leading-6 text-fg-muted sm:text-sm">
            {copy.description}
          </p>
        </div>

        <dl className="grid border-t border-stroke-divider bg-bg-subtle/50 sm:grid-cols-3 lg:grid-cols-1 lg:border-l lg:border-t-0">
          {copy.facts.map((fact) => (
            <div
              key={fact.label}
              className="border-b border-stroke-divider px-5 py-3.5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 lg:border-b lg:border-r-0"
            >
              <dt className="text-[10px] font-semibold uppercase text-fg-subtle">{fact.label}</dt>
              <dd className="mt-1 text-xs font-medium text-fg-default">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-stroke-divider px-5 py-4 sm:px-6">
        <ReferenceLink href={OFFICIAL_REPO} label={copy.officialRepo} icon={Github} primary />
        <ReferenceLink href={focusedGuide.href} label={focusedGuide.label} icon={BookOpen} />
        <ReferenceLink href={secondaryGuide.href} label={secondaryGuide.label} icon={BookOpen} />
        <ReferenceLink href={COMBINED_GUIDE} label={copy.combinedGuide} icon={Route} />
      </div>
    </section>
  )
}

function ReferenceLink({
  href,
  label,
  icon: Icon,
  primary = false,
}: {
  href: string
  label: string
  icon: typeof Github
  primary?: boolean
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-semibold transition-colors hover:underline',
        primary ? 'text-accent' : 'text-fg-muted hover:text-fg-default'
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
      <ExternalLink className="h-3 w-3" aria-hidden="true" />
    </a>
  )
}
