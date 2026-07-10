'use client'

import { useMemo, useState } from 'react'
import { OntologyGraph } from './ontology-graph'
import { OntologyNarration } from './ontology-narration'
import { OntologyEntityPanel, type OntologyRelation } from './ontology-entity-panel'
import graphData from '@/data/fabric-iq-ks/ontology-graph.json'
import type { Locale } from '@/lib/i18n'
import type { OntologyNode } from './ontology-graph'

export function OntologySection({ locale }: { locale: Locale }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const selectedNode = (graphData.nodes as OntologyNode[]).find((n) => n.id === selectedId) ?? null

  // Compute every link touching the selected node, tagged by direction.
  // Surfaced on mobile (where edge labels in the SVG are hidden) so the
  // relationship vocabulary is still discoverable from the entity panel.
  const relations: OntologyRelation[] = useMemo(() => {
    if (!selectedId) return []
    const out: OntologyRelation[] = []
    for (const l of graphData.links) {
      if (l.source === selectedId) out.push({ direction: 'out', label: l.label, other: l.target })
      else if (l.target === selectedId) out.push({ direction: 'in', label: l.label, other: l.source })
    }
    return out
  }, [selectedId])

  return (
    <section className="px-4 pb-16 pt-2 sm:px-6 md:pb-20 md:pt-4">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_400px] lg:gap-12">
          <div className="order-2 lg:order-1">
            <OntologyGraph
              nodes={graphData.nodes as OntologyNode[]}
              links={graphData.links}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onNodeSelect={setSelectedId}
              onNodeHover={setHoveredId}
            />
          </div>
          <div className="order-1 lg:order-2">
            <OntologyNarration locale={locale} />
          </div>
        </div>
      </div>
      <OntologyEntityPanel
        node={selectedNode}
        relations={relations}
        onClose={() => setSelectedId(null)}
        locale={locale}
      />
    </section>
  )
}
