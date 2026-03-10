'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowRight20Regular,
  BuildingFactory20Regular,
  HeartPulse20Regular,
  MoneyHand20Regular,
  ShoppingBag20Regular,
  Building20Regular,
  Globe20Regular,
  ShieldCheckmark20Regular,
  EarthLeaf20Regular
} from '@fluentui/react-icons'
import { useRouter } from 'next/navigation'

interface IndustryKnowledgeBase {
  id: string
  name: string
  industry: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
  agentName: string // The actual agent name in Azure AI Search
  available: boolean
}

const INDUSTRY_KNOWLEDGE_BASES: IndustryKnowledgeBase[] = [
  {
    id: 'manufacturing',
    name: 'Manufacturing Knowledge Base',
    industry: 'Manufacturing & Supply Chain',
    description: 'Equipment manuals, P&IDs, SOPs, safety documentation, maintenance logs, and technical specifications',
    icon: BuildingFactory20Regular,
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-600 dark:text-orange-500',
    agentName: 'manufacturing-knowledge-base',
    available: false
  },
  {
    id: 'healthcare',
    name: 'Healthcare Knowledge Base',
    industry: 'Healthcare & Life Sciences',
    description: 'Clinical trial protocols, FDA filings, research papers, treatment guidelines, and patient care documentation',
    icon: HeartPulse20Regular,
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-600 dark:text-red-500',
    agentName: 'healthcare-knowledge-base',
    available: false
  },
  {
    id: 'financial',
    name: 'Financial Knowledge Base',
    industry: 'Financial Services',
    description: '10-Ks, 10-Qs, earnings reports, market research, analyst reports, regulatory filings, and financial compliance documentation',
    icon: MoneyHand20Regular,
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-600 dark:text-green-500',
    agentName: 'financial-knowledge-base',
    available: false
  },
  {
    id: 'hotels',
    name: 'Hotels Knowledge Base',
    industry: 'Hospitality & Travel',
    description: '50 sample hotels with ratings, rooms, amenities, locations, and pricing across multiple categories',
    icon: Building20Regular,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-500',
    agentName: 'hotels-knowledge-base',
    available: true
  },
  {
    id: 'zava',
    name: 'Zava Knowledge Base',
    industry: 'Retail & Events',
    description: 'Marathon event data, popup safety guidelines, store operations, crowd management protocols, and supply chain logistics',
    icon: ShoppingBag20Regular,
    iconBg: 'bg-slate-500/10',
    iconColor: 'text-slate-600 dark:text-slate-400',
    agentName: 'zava-knowledge-base',
    available: false
  },
  {
    id: 'nasa',
    name: 'NASA Earth Science KB',
    industry: 'Earth Science & Space',
    description: 'NASA Earth at Night observations covering climate data, satellite imagery analysis, and earth science research',
    icon: Globe20Regular,
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    agentName: 'nasa-earth-book',
    available: true
  },
  {
    id: 'health-plan',
    name: 'Health Plan KB',
    industry: 'Insurance & Benefits',
    description: 'Northwind and Contoso health insurance plans with coverage details, deductibles, benefits, and policy terms',
    icon: ShieldCheckmark20Regular,
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-600 dark:text-violet-400',
    agentName: 'health-plan-kb',
    available: true
  },
  {
    id: 'sustainable-ai',
    name: 'Sustainable AI KB',
    industry: 'Technology & Sustainability',
    description: 'AI environmental impact research, energy efficiency metrics, green computing practices, and sustainability diagrams',
    icon: EarthLeaf20Regular,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    agentName: 'sustainable-ai-kb',
    available: true
  }
]

export function IndustryKnowledgeSelector() {
  const router = useRouter()
  const [selectedKB, setSelectedKB] = useState<string | null>(null)

  const handleSelectKB = (kb: IndustryKnowledgeBase) => {
    setSelectedKB(kb.id)
    // Navigate to playground with selected agent
    router.push(`/test?agent=${kb.agentName}`)
  }

  return (
    <div className="min-h-[calc(100vh-7rem)] flex flex-col items-center justify-center p-6 bg-gradient-to-br from-bg-canvas via-bg-canvas to-accent-subtle/5">
      <div className="max-w-6xl w-full space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <h1 className="text-4xl font-bold text-fg-default">
            Choose Your Industry
          </h1>
          <p className="text-lg text-fg-muted max-w-2xl mx-auto">
            Select a pre-configured knowledge base to explore industry-specific AI-powered search and answer synthesis
          </p>
        </motion.div>

        {/* Knowledge Base Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...INDUSTRY_KNOWLEDGE_BASES].sort((a, b) => {
            if (a.available === b.available) return 0
            return a.available ? -1 : 1
          }).map((kb, index) => {
            const Icon = kb.icon
            const isSelected = selectedKB === kb.id

            return (
              <motion.div
                key={kb.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className={cn(
                    "h-full transition-all duration-300",
                    kb.available
                      ? cn(
                          "cursor-pointer hover:shadow-xl hover:-translate-y-1",
                          isSelected
                            ? "border-accent shadow-lg ring-2 ring-accent ring-offset-2 ring-offset-bg-canvas"
                            : "hover:border-accent/50"
                        )
                      : "opacity-60 cursor-default"
                  )}
                  onClick={() => kb.available && handleSelectKB(kb)}
                >
                  <CardHeader className="space-y-4">
                    {/* Icon */}
                    <div className={cn("w-16 h-16 rounded-xl flex items-center justify-center", kb.iconBg)}>
                      <Icon className={cn("h-8 w-8", kb.iconColor)} />
                    </div>

                    {/* Title & Industry */}
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{kb.name}</CardTitle>
                      <div className="text-sm font-medium text-accent">
                        {kb.industry}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Description */}
                    <CardDescription className="text-sm leading-relaxed">
                      {kb.description}
                    </CardDescription>

                    {/* CTA Button or unavailable indicator */}
                    {kb.available ? (
                      <Button
                        className="w-full group"
                        variant={isSelected ? "default" : "outline"}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectKB(kb)
                        }}
                      >
                        {isSelected ? "Opening..." : "Try Now"}
                        <ArrowRight20Regular className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    ) : (
                      <p className="text-sm text-fg-subtle text-center">No data connected</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Helper Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <p className="text-sm text-fg-muted">
            Each knowledge base is pre-configured with industry-specific data sources and retrieval settings
          </p>
        </motion.div>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
