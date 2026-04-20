'use client'

import Link from 'next/link'
import { ArchitectureDiagram } from '@/components/architecture-diagram'
import { ArchitectureDiagramV2 } from '@/components/architecture-diagram-v2'
import { ChevronLeft20Regular } from '@fluentui/react-icons'

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

      {/* ────────── NEW: Section divider ────────── */}
      <div className="max-w-4xl mx-auto px-4 pb-2">
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-stroke-divider" />
          <span className="text-xs uppercase tracking-wider text-fg-muted">
            What&apos;s coming next
          </span>
          <div className="flex-1 h-px bg-stroke-divider" />
        </div>
      </div>

      {/* ────────── NEW: v2 diagram (Phase 4 TO-BE) ────────── */}
      <div className="max-w-5xl mx-auto px-4 pb-10">
        <div className="mb-4 text-center">
          <h2 className="text-lg font-semibold text-fg-default mb-1">
            Phase 4 — Foundry IQ + Fabric IQ Native Integration
          </h2>
          <p className="text-xs text-fg-muted">
            Once Fabric IQ becomes a native Knowledge Source type within Foundry IQ (Private Preview),
            the entire aggregation pipeline collapses into a direct Ontology binding.
          </p>
        </div>
        <div className="rounded-2xl border border-glass-border bg-bg-elevated/50 backdrop-blur-sm p-6 md:p-10">
          <ArchitectureDiagramV2 />
        </div>
      </div>
    </div>
  )
}
