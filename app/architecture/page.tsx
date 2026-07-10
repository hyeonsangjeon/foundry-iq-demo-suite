'use client'

import Link from 'next/link'
import {
  ArrowUpRight20Regular,
  BranchForkLink20Regular,
  ChevronLeft20Regular,
  PlugConnected20Regular,
} from '@fluentui/react-icons'

import { ArchitectureDiagram } from '@/components/architecture-diagram'
import { ArchitectureDiagramV2 } from '@/components/architecture-diagram-v2'
import { LiveKnowledgeSourcesArchitecture } from '@/components/live-knowledge-sources-architecture'

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-bg-canvas text-fg-default">
      {/* Header */}
      <div className="border-b border-stroke-divider bg-bg-subtle/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg-default transition-colors"
          >
            <ChevronLeft20Regular className="w-3.5 h-3.5" />
            Home
          </Link>
          <h1 className="text-sm font-semibold text-fg-default">
            Architecture Overview
          </h1>
        </div>
      </div>

      {/* ⚠️ DO NOT TOUCH: Existing v1 diagram (Phase 1~3) */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-glass-border bg-bg-elevated/50 backdrop-blur-sm p-6 md:p-10">
          <ArchitectureDiagram />
        </div>
      </div>

      {/* Public preview architecture */}
      <div className="max-w-4xl mx-auto px-4 pb-2">
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-stroke-divider" />
          <span className="text-xs uppercase tracking-wider text-fg-muted">
            Public preview evolution
          </span>
          <div className="flex-1 h-px bg-stroke-divider" />
        </div>
      </div>

      {/* Fabric Ontology Knowledge Source */}
      <div className="max-w-5xl mx-auto px-4 pb-10">
        <div className="mb-4 text-center">
          <h2 className="text-lg font-semibold text-fg-default mb-1">
            Phase 4 — Foundry IQ + Fabric IQ Native Integration
          </h2>
          <p className="text-xs text-fg-muted">
            Fabric IQ is now available as a native Knowledge Source type within Foundry IQ
            in public preview, collapsing the aggregation pipeline into a direct Ontology binding.
          </p>
        </div>
        <div className="rounded-2xl border border-glass-border bg-bg-elevated/50 backdrop-blur-sm p-6 md:p-10">
          <ArchitectureDiagramV2 />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-2">
        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-stroke-divider" />
          <span className="text-xs uppercase tracking-wider text-fg-muted">
            Live Knowledge Sources
          </span>
          <div className="h-px flex-1 bg-stroke-divider" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-12">
        <div className="mb-4 text-center">
          <h2 className="mb-1 text-lg font-semibold text-fg-default">
            MCP Server + Fabric Ontology routing
          </h2>
          <p className="mx-auto max-w-3xl text-xs leading-5 text-fg-muted">
            One Foundry IQ Knowledge Base can route a question to live Microsoft Learn tools,
            Fabric business semantics, or both, then return a cited answer with inspectable activity,
            references, and source data.
          </p>
        </div>

        <div className="rounded-2xl border border-glass-border bg-bg-elevated/50 p-4 backdrop-blur-sm md:p-8">
          <LiveKnowledgeSourcesArchitecture />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <ArchitectureLink
            href="/mcp-ks"
            icon={PlugConnected20Regular}
            title="MCP Server KS demo"
            description="Live Microsoft Learn retrieval"
          />
          <ArchitectureLink
            href="/fabric-iq-ks"
            icon={BranchForkLink20Regular}
            title="Fabric Ontology demo"
            description="Business-semantic grounding"
          />
          <ArchitectureLink
            href="https://github.com/microsoft/azure-ai-search-foundry-iq-live-knowledge-sources"
            icon={ArrowUpRight20Regular}
            title="Microsoft accelerator"
            description="Deploy, notebooks, and REST samples"
            external
          />
        </div>
      </div>
    </div>
  )
}

function ArchitectureLink({
  href,
  icon: Icon,
  title,
  description,
  external = false,
}: {
  href: string
  icon: typeof PlugConnected20Regular
  title: string
  description: string
  external?: boolean
}) {
  const className =
    'group flex items-center gap-3 rounded-lg border border-stroke-divider bg-bg-elevated/40 px-4 py-3 transition-colors hover:border-accent/40 hover:bg-bg-elevated'
  const content = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-fg-default group-hover:text-accent">
          {title}
        </span>
        <span className="mt-0.5 block text-[11px] text-fg-muted">{description}</span>
      </span>
    </>
  )

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  )
}
