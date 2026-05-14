'use client'

import { useState } from 'react'
import { OntologyGraph } from './ontology-graph'
import { OntologyNarration } from './ontology-narration'
import { OntologyEntityPanel } from './ontology-entity-panel'
import graphData from '@/data/fabric-iq-ks/ontology-graph.json'
import type { Locale } from '@/lib/i18n'
import type { OntologyNode } from './ontology-graph'

export function OntologySection({ locale }: { locale: Locale }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const selectedNode = (graphData.nodes as OntologyNode[]).find((n) => n.id === selectedId) ?? null

  return (
    <section className="pt-4 md:pt-6 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-12 items-start">
          <OntologyGraph
            nodes={graphData.nodes as OntologyNode[]}
            links={graphData.links}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onNodeSelect={setSelectedId}
            onNodeHover={setHoveredId}
          />
          <OntologyNarration locale={locale} />
        </div>
      </div>
      <OntologyEntityPanel
        node={selectedNode}
        onClose={() => setSelectedId(null)}
        locale={locale}
      />
    </section>
  )
}
