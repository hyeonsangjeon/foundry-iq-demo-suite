'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { ChevronRight20Regular } from '@fluentui/react-icons'

import { ProductFlow } from '@/components/product-flow'
import type { Locale } from '@/lib/i18n'
import { mcpKnowledgeSourceI18n } from '@/lib/i18n/mcp-knowledge-source'
import { cn } from '@/lib/utils'

interface McpKsCardProps {
  locale: Locale
}

export function McpKsCard({ locale }: McpKsCardProps) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-10%' })
  const text = mcpKnowledgeSourceI18n[locale]
  const features = [
    { label: text.flowFacts[0].title, desc: 'microsoft_docs_search' },
    { label: text.flowFacts[1].title, desc: 'kind: mcpServer' },
    { label: text.referencesMetric, desc: 'response · activity · references' },
    { label: text.authentication, desc: text.authenticationValue },
  ]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.25, ease: [0, 0, 0.2, 1] as const }}
    >
      <Link href="/mcp-ks" data-testid="mcp-ks-card">
        <motion.div
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={cn(
            'group relative cursor-pointer overflow-hidden rounded-2xl p-6 md:p-8',
            'border border-stroke-divider bg-bg-elevated/50 backdrop-blur-sm',
            'transition-all duration-300',
            'hover:border-amber-500/40 hover:shadow-[0_0_40px_rgba(245,158,11,0.1)]'
          )}
        >
          <div
            className="pointer-events-none absolute -right-1/4 -top-1/2 h-full w-1/2 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(245,158,11,0.07) 0%, transparent 70%)',
            }}
          />

          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium uppercase text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  {text.tabDemo}
                </div>
                <div className="font-mono text-[10px] uppercase text-amber-700 dark:text-amber-300">
                  {text.previewBadge}
                </div>
              </div>

              <div className="mb-1 font-mono text-xs uppercase text-amber-700 dark:text-amber-300">
                Azure AI Search · MCP Server
              </div>
              <h3 className="mb-2 text-2xl font-bold text-fg-default md:text-3xl">
                {text.title}
              </h3>
              <p className="mb-5 max-w-xl text-sm leading-relaxed text-fg-muted">
                {text.subtitle}
              </p>

              <div className="mb-6 flex flex-wrap gap-2">
                {features.map((feature) => (
                  <span
                    key={feature.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-stroke-divider bg-bg-subtle px-3 py-1.5 text-xs text-fg-muted"
                  >
                    <span className="h-1 w-1 rounded-full bg-amber-500" />
                    <span className="font-medium text-fg-default">{feature.label}</span>
                    <span className="hidden text-fg-subtle sm:inline">— {feature.desc}</span>
                  </span>
                ))}
              </div>

              <div className="inline-flex h-10 items-center gap-2 rounded-full bg-amber-500 px-6 text-sm font-semibold text-gray-950 transition-colors duration-150 hover:bg-amber-400">
                {text.runLive}
                <ChevronRight20Regular className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>

            <div className="mt-6 hidden shrink-0 items-center justify-center self-start rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 md:flex">
              <ProductFlow
                nodes={[
                  { icon: '/icons/mcp.svg', label: 'Microsoft Learn MCP' },
                  { icon: '/icons/knowledge_base.svg', label: 'Knowledge Base' },
                  { icon: '/icons/foundryiq.svg', label: 'Foundry IQ' },
                ]}
                color="accent"
                direction="right"
              />
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}
