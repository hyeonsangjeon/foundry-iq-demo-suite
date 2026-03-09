'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Search24Regular,
  Document24Regular,
  PlugConnected24Regular,
  ChevronRight20Regular,
} from '@fluentui/react-icons'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { WelcomeSplash } from '@/components/welcome-splash'

const demos = [
  {
    id: 'foundry-iq-basic',
    title: 'Foundry IQ Basic',
    description: 'Semantic search, multimodal retrieval, and agentic retrieval trace visualization.',
    features: [
      'Semantic & keyword hybrid search',
      'Multimodal document support',
      'Agentic retrieval trace explorer',
    ],
    icon: Search24Regular,
    href: '/test',
    status: 'active' as const,
  },
  {
    id: 'sharepoint-connector',
    title: 'SharePoint Connector',
    description: 'Index SharePoint documents and search across enterprise content with knowledge bases.',
    features: [
      'SharePoint document indexing',
      'Indexed & Remote knowledge sources',
      'Real-time user permissions',
    ],
    icon: Document24Regular,
    href: null,
    status: 'coming-soon' as const,
  },
  {
    id: 'agent-connector',
    title: 'Agent Connector',
    description: 'MCP RemoteTool integration where AI agents use knowledge bases as grounding tools.',
    features: [
      'MCP RemoteTool protocol',
      'Agent-as-a-service pattern',
      'Knowledge bases as tools',
    ],
    icon: PlugConnected24Regular,
    href: null,
    status: 'coming-soon' as const,
  },
]

const comingSoonInfo: Record<string, string> = {
  'sharepoint-connector': 'Phase 2: Automatically index SharePoint PDF, Word, and Excel documents and make them searchable through the knowledge base.',
  'agent-connector': 'Phase 3: Foundry Agent Service will use the knowledge base as an MCP tool to autonomously search for information.',
}

const comingSoonPhase: Record<string, string> = {
  'sharepoint-connector': 'Phase 2',
  'agent-connector': 'Phase 3',
}

const heroVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  },
}

const cardsContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.45,
    },
  },
}

const cardItemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  },
}

const footerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, delay: 0.6 },
  },
}

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 gap-12">
      {/* Hero */}
      <motion.div variants={heroVariants} initial="hidden" animate="visible" className="text-center max-w-2xl">
        <div className="mb-6 inline-flex w-16 h-16 rounded-2xl bg-accent-subtle items-center justify-center">
          <Image src="/icons/ai-foundry.png" alt="Foundry IQ" width={40} height={40} className="opacity-80" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-fg-default tracking-tight mb-3">
          Foundry IQ Demo Suite
        </h1>
        <p className="text-xl text-fg-muted">
          Intelligent knowledge retrieval for enterprise agents
        </p>
      </motion.div>

      {/* System Status */}
      <WelcomeSplash />

      {/* Cards Grid */}
      <motion.div
        variants={cardsContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-5xl px-4"
      >
        {demos.map((demo) => {
          const isActive = demo.status === 'active'

          if (isActive) {
            return (
              <motion.div key={demo.id} variants={cardItemVariants}>
                <motion.div
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Link href={demo.href!}>
                    <Card className={cn(
                      'flex flex-col h-full p-6 transition-all duration-200',
                      'cursor-pointer',
                      'hover:shadow-lg hover:border-accent-muted',
                      'dark:hover:shadow-[0_0_30px_hsl(var(--color-accent-default)/0.15)]'
                    )}>
                      <div className="w-12 h-12 rounded-xl bg-accent-subtle flex items-center justify-center mb-4">
                        <demo.icon className="w-6 h-6 text-accent" />
                      </div>
                      <div className="mb-3">
                        <Badge variant="default">Active</Badge>
                      </div>
                      <h3 className="text-xl font-semibold text-fg-default mb-2">{demo.title}</h3>
                      <p className="text-sm text-fg-muted leading-relaxed mb-4">{demo.description}</p>
                      <ul className="space-y-1.5 mb-6 flex-1">
                        {demo.features.map((f, i) => (
                          <li key={i} className="text-xs text-fg-subtle flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-accent" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Button size="default" className="w-full bg-accent hover:bg-accent-hover text-fg-on-accent">
                        Try Demo
                        <ChevronRight20Regular className="ml-2 h-4 w-4" />
                      </Button>
                    </Card>
                  </Link>
                </motion.div>
              </motion.div>
            )
          }

          return (
            <motion.div key={demo.id} variants={cardItemVariants}>
              <Card className={cn(
                'group relative flex h-full flex-col overflow-visible p-6 transition-colors duration-200',
                'cursor-default',
                'hover:bg-glass-hover'
              )}>
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-64 -translate-x-1/2 rounded-lg border border-glass-border bg-bg-elevated p-3 text-center text-xs text-fg-muted opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                  {comingSoonInfo[demo.id]}
                </div>
                <div className="opacity-60">
                  <div className="w-12 h-12 rounded-xl bg-bg-elevated flex items-center justify-center mb-4">
                    <demo.icon className="w-6 h-6 text-fg-subtle" />
                  </div>
                  <div className="mb-3">
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-fg-default mb-2">{demo.title}</h3>
                <p className="text-sm text-fg-muted leading-relaxed mb-4">{demo.description}</p>
                <ul className="space-y-1.5 mb-6 flex-1">
                  {demo.features.map((f, i) => (
                    <li key={i} className="text-xs text-fg-subtle flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-fg-subtle" />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-fg-subtle text-center">Coming in {comingSoonPhase[demo.id]}</p>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Foundry IQ Description + Footer */}
      <motion.div variants={footerVariants} initial="hidden" animate="visible" className="text-center max-w-2xl mx-auto">
        <h3 className="text-sm font-semibold text-fg-default mb-2">What is Foundry IQ?</h3>
        <p className="text-xs text-fg-muted mb-3">A managed Knowledge Retrieval engine built on Azure AI Search</p>
        <ul className="space-y-1 mb-6">
          <li className="text-xs text-fg-muted">Planning → Retrieval → Assessment → Synthesis — 4-stage Agentic Retrieval</li>
          <li className="text-xs text-fg-muted">LLM plans the search, evaluates results, and generates evidence-based answers</li>
          <li className="text-xs text-fg-muted">Citations track every answer back to its source — zero hallucination</li>
        </ul>
        <p className="text-sm text-fg-muted">
          Powered by Azure AI Search · Microsoft AI GBB Korea
        </p>
      </motion.div>
    </div>
  )
}
