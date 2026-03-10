'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Search24Regular,
  Document24Regular,
  PlugConnected24Regular,
  ChevronRight20Regular,
} from '@fluentui/react-icons'

// ─── Data ────────────────────────────────────────────────────────────────────

const activeDemo = {
  id: 'foundry-iq-basic',
  title: 'Agentic Retrieval',
  subtitle: 'Azure AI Search',
  description:
    'Query planning, hybrid search, iterative retrieval, and answer synthesis — with full trace visibility and inline citations.',
  features: [
    { label: 'Hybrid Search', desc: 'Vector + keyword simultaneous' },
    { label: 'Agentic Retrieval', desc: '4-stage planning pipeline' },
    { label: 'Inline Citations', desc: 'Every answer traced to source' },
    { label: 'Trace Explorer', desc: 'Full retrieval journey visible' },
  ],
  href: '/test',
  icon: Search24Regular,
}

const comingSoon = [
  {
    id: 'sharepoint-connector',
    title: 'SharePoint Indexing',
    subtitle: 'Azure AI Search',
    phase: 'Phase 2',
    icon: Document24Regular,
    desc: 'Index SharePoint documents and search across enterprise content with semantic retrieval.',
  },
  {
    id: 'agent-connector',
    title: 'MCP Agent Grounding',
    subtitle: 'Azure AI Search',
    phase: 'Phase 3',
    icon: PlugConnected24Regular,
    desc: 'MCP RemoteTool integration — AI agents use knowledge bases as grounding sources.',
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActiveDemoCard() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-10%' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] as const }}
    >
      <Link href={activeDemo.href}>
        <motion.div
          whileHover={{ y: -6 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={cn(
            'group relative overflow-hidden rounded-2xl p-8 md:p-10',
            'border border-stroke-divider',
            'bg-bg-elevated/50 backdrop-blur-sm',
            'hover:border-accent/40',
            'hover:shadow-[0_0_60px_hsl(var(--color-accent-default)/0.12)]',
            'transition-all duration-300',
            'cursor-pointer'
          )}
        >
          <div
            className="pointer-events-none absolute -top-1/2 -right-1/4 w-1/2 h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: 'radial-gradient(ellipse at center, hsl(var(--color-accent-default)/0.08) 0%, transparent 70%)' }}
          />

          <div className="flex flex-col md:flex-row md:items-start gap-8">
            <div className="flex-1 min-w-0">
              <div className="mb-5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-[11px] font-medium text-accent tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Live Demo
              </div>

              <div className="text-xs font-mono text-accent/70 uppercase tracking-widest mb-1">
                {activeDemo.subtitle}
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-fg-default tracking-tight mb-3">
                {activeDemo.title}
              </h3>
              <p className="text-base text-fg-muted leading-relaxed mb-6 max-w-lg">
                {activeDemo.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {activeDemo.features.map((f) => (
                  <span
                    key={f.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-subtle border border-stroke-divider text-xs text-fg-muted"
                  >
                    <span className="w-1 h-1 rounded-full bg-accent" />
                    <span className="font-medium text-fg-default">{f.label}</span>
                    <span className="hidden sm:inline text-fg-subtle">— {f.desc}</span>
                  </span>
                ))}
              </div>

              <div className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-accent hover:bg-accent-hover text-fg-on-accent text-sm font-semibold transition-colors duration-150">
                Launch Demo
                <ChevronRight20Regular className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            <div className="hidden md:flex shrink-0 w-28 h-28 rounded-2xl bg-accent/10 border border-accent/20 items-center justify-center">
              <activeDemo.icon className="w-12 h-12 text-accent" />
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}

function ComingSoonCards() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-10%' })

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {comingSoon.map((demo, i) => (
        <motion.div
          key={demo.id}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: i * 0.1, ease: [0, 0, 0.2, 1] as const }}
        >
          <div className={cn(
            'group relative overflow-hidden rounded-xl p-5',
            'border border-stroke-divider bg-bg-elevated/30 backdrop-blur-sm',
            'hover:border-stroke-strong hover:bg-bg-elevated/50',
            'transition-all duration-200'
          )}>
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 w-56 rounded-lg border border-glass-border bg-bg-elevated p-3 text-xs text-fg-muted shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center">
              {demo.desc}
            </div>

            <div className="flex items-start gap-3">
              <div className="shrink-0 w-9 h-9 rounded-lg bg-bg-subtle border border-stroke-divider flex items-center justify-center opacity-50">
                <demo.icon className="w-5 h-5 text-fg-subtle" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-fg-subtle uppercase tracking-wide">{demo.subtitle}</div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-fg-default truncate">{demo.title}</span>
                  <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-bg-subtle border border-stroke-divider text-fg-subtle font-mono">
                    {demo.phase}
                  </span>
                </div>
                <p className="text-xs text-fg-subtle">Coming soon</p>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="relative min-h-screen text-fg-default">

      {/* Title */}
      <div className="pt-12 pb-8 text-center">
        <h1 className="text-2xl font-semibold text-fg-default">Knowledge Retrieval Studio</h1>
        <p className="text-sm text-fg-muted mt-1">Azure AI Search &middot; Foundry IQ</p>
      </div>

      {/* Demo Cards */}
      <section className="relative px-6 py-8 max-w-5xl mx-auto flex flex-col gap-6">
        <ActiveDemoCard />
        <ComingSoonCards />
      </section>

      {/* Zone 3: Footer */}
      <footer className="py-12 text-center border-t border-stroke-divider">
        <p className="text-xs text-fg-subtle font-mono tracking-wide">
          Powered by Azure AI Search &middot; Microsoft AI GBB Korea
        </p>
      </footer>
    </div>
  )
}
