'use client'

import { motion } from 'framer-motion'
import { ChevronDown20Regular } from '@fluentui/react-icons'
import { t } from '@/lib/i18n/translations'
import type { Locale } from '@/lib/i18n'

interface FederationFlowDiagramProps {
  locale: Locale
}

type Accent = 'top' | 'middle' | 'bottom'

interface FlowNode {
  label: string
  accent: Accent
}

interface FlowEdge {
  label: string
}

export function FederationFlowDiagram({ locale }: FederationFlowDiagramProps) {
  const text = t.fabricIqKs[locale].federationFlow

  const nodes: FlowNode[] = [
    { label: text.foundryIqLabel, accent: 'top' },
    { label: text.fabricIqKsLabel, accent: 'middle' },
    { label: text.fabricWorkspaceLabel, accent: 'middle' },
    { label: text.lakehouseLabel, accent: 'bottom' },
  ]

  const edges: FlowEdge[] = [
    { label: text.retrieveApiLabel },
    { label: text.federatedMcpLabel },
    { label: text.dataAgentLabel },
  ]

  const accentClasses: Record<Accent, string> = {
    top: 'border-l-4 border-l-emerald-500',
    middle: 'border-l-4 border-l-transparent',
    bottom: 'border-l-4 border-l-cyan-500',
  }

  return (
    <div className="flex flex-col items-stretch gap-0">
      {nodes.map((node, i) => (
        <div key={`node-${i}`} className="flex flex-col items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4, delay: i * 0.15, ease: [0, 0, 0.2, 1] }}
            className={`rounded-2xl border border-stroke-divider bg-card shadow-sm px-5 py-4 md:px-6 md:py-5 ${accentClasses[node.accent]}`}
          >
            <div className="text-sm md:text-base font-semibold text-fg-default">
              {node.label}
            </div>
          </motion.div>

          {i < edges.length ? (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: i * 0.15 + 0.075 }}
              className="flex items-center justify-center gap-2 py-2 md:py-3"
              aria-hidden="false"
            >
              <ChevronDown20Regular className="w-4 h-4 text-fg-subtle shrink-0" />
              <span className="text-xs text-fg-muted">{edges[i].label}</span>
            </motion.div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
