'use client'

import Link from 'next/link'
import { ArchitectureDiagram } from '@/components/architecture-diagram'
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

      {/* Diagram */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-glass-border bg-bg-elevated/50 backdrop-blur-sm p-6 md:p-10">
          <ArchitectureDiagram />
        </div>
      </div>
    </div>
  )
}
