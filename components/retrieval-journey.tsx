"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, Zap, Search, Brain, PenTool, Check, Sparkles } from 'lucide-react'
import {
  KnowledgeBaseActivityRecord,
  KnowledgeBaseReference,
  isRetrievalActivity
} from '@/types/knowledge-retrieval'
import { cn } from '@/lib/utils'
import { formatElapsedTime } from '@/lib/trace/transform'

interface RetrievalJourneyProps {
  activity: KnowledgeBaseActivityRecord[]
  references: KnowledgeBaseReference[]
  className?: string
}

/**
 * Extract the search query from an activity record
 */
function getActivityQuery(activity: KnowledgeBaseActivityRecord): string | null {
  switch (activity.type) {
    case 'searchIndex':
      return (activity as any).searchIndexArguments?.search || null
    case 'azureBlob':
      return (activity as any).azureBlobArguments?.search || null
    case 'web':
      return (activity as any).webArguments?.search || null
    case 'remoteSharePoint':
      return (activity as any).remoteSharePointArguments?.search || null
    case 'indexedSharePoint':
      return (activity as any).indexedSharePointArguments?.search || null
    case 'indexedOneLake':
      return (activity as any).indexedOneLakeArguments?.search || null
    default:
      return null
  }
}

/**
 * Format large numbers with K/M suffix
 */
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
  return num.toString()
}

/**
 * A "round" in the agentic retrieval process
 * Each round starts with query planning and includes subsequent searches
 */
interface RetrievalRound {
  roundNumber: number
  planning: KnowledgeBaseActivityRecord | null
  searches: Array<{
    activity: KnowledgeBaseActivityRecord
    query: string
    count: number
    elapsedMs: number
    sourceName: string
  }>
  totalDocs: number
  totalSearchTime: number
  planningTime: number
}

/**
 * Parse activities into structured rounds
 * The agentic retrieval process is iterative:
 * Planning → Searches → Planning → More Searches → Reasoning → Answer
 */
function parseIntoRounds(activities: KnowledgeBaseActivityRecord[]): {
  rounds: RetrievalRound[]
  reasoning: KnowledgeBaseActivityRecord | null
  synthesis: KnowledgeBaseActivityRecord | null
} {
  const rounds: RetrievalRound[] = []
  let currentRound: RetrievalRound | null = null
  let reasoning: KnowledgeBaseActivityRecord | null = null
  let synthesis: KnowledgeBaseActivityRecord | null = null

  // Sort by id to ensure correct order
  const sorted = [...activities].sort((a, b) => a.id - b.id)

  for (const act of sorted) {
    if (act.type === 'modelQueryPlanning') {
      // Start a new round
      if (currentRound) {
        rounds.push(currentRound)
      }
      currentRound = {
        roundNumber: rounds.length + 1,
        planning: act,
        searches: [],
        totalDocs: 0,
        totalSearchTime: 0,
        planningTime: act.elapsedMs || 0
      }
    } else if (isRetrievalActivity(act)) {
      // Add search to current round
      if (!currentRound) {
        // No planning yet, create a round without planning
        currentRound = {
          roundNumber: rounds.length + 1,
          planning: null,
          searches: [],
          totalDocs: 0,
          totalSearchTime: 0,
          planningTime: 0
        }
      }
      const query = getActivityQuery(act) || 'Unknown query'
      const count = (act as any).count || 0
      const elapsedMs = act.elapsedMs || 0
      const sourceName = (act as any).knowledgeSourceName || act.type

      currentRound.searches.push({
        activity: act,
        query,
        count,
        elapsedMs,
        sourceName
      })
      currentRound.totalDocs += count
      currentRound.totalSearchTime += elapsedMs
    } else if (act.type === 'agenticReasoning') {
      // Finalize current round before reasoning
      if (currentRound) {
        rounds.push(currentRound)
        currentRound = null
      }
      reasoning = act
    } else if (act.type === 'modelAnswerSynthesis') {
      synthesis = act
    }
  }

  // Don't forget the last round
  if (currentRound) {
    rounds.push(currentRound)
  }

  return { rounds, reasoning, synthesis }
}

/**
 * Calculate summary stats from activities
 */
function calculateStats(activities: KnowledgeBaseActivityRecord[]) {
  const retrievalActivities = activities.filter(isRetrievalActivity)
  const totalDocs = retrievalActivities.reduce((sum, a) => sum + ((a as any).count || 0), 0)
  const totalTime = activities.reduce((sum, a) => sum + (a.elapsedMs || 0), 0)

  return {
    queries: retrievalActivities.length,
    docs: totalDocs,
    time: totalTime
  }
}

export function RetrievalJourney({ activity, references, className }: RetrievalJourneyProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const stats = calculateStats(activity)
  const { rounds, reasoning, synthesis } = parseIntoRounds(activity)

  if (activity.length === 0) return null

  // Get reasoning tokens if available
  const reasoningTokens = reasoning ? (reasoning as any).reasoningTokens || 0 : 0

  return (
    <div className={cn("p-4", className)}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between",
          "px-4 py-3 rounded-lg",
          "bg-bg-subtle border border-stroke-divider",
          "hover:bg-bg-hover hover:border-accent/40",
          "transition-all duration-150"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-accent" />
          </div>
          <div className="text-left">
            <div className="text-[13px] font-semibold text-fg-default">
              View Retrieval Journey
            </div>
            <div className="text-[11px] text-fg-subtle">
              {stats.queries} queries • {stats.docs} docs • {formatElapsedTime(stats.time)}
            </div>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-fg-muted" />
        </motion.div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-1">
              {/* Retrieval Rounds */}
              {rounds.map((round, idx) => (
                <RoundSection
                  key={round.roundNumber}
                  round={round}
                  isFirst={idx === 0}
                />
              ))}

              {/* Reasoning Step */}
              {reasoning && (
                <StepRow
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  iconBg="bg-purple-500"
                  label="Reasoning & Selection"
                  time={reasoning.elapsedMs}
                  detail={
                    reasoningTokens > 0
                      ? `${formatNumber(reasoningTokens)} reasoning tokens • Selected ${references.length} sources`
                      : `Selected ${references.length} of ${stats.docs} documents`
                  }
                />
              )}

              {/* Answer Synthesis */}
              {synthesis && (
                <StepRow
                  icon={<PenTool className="w-3.5 h-3.5" />}
                  iconBg="bg-emerald-500"
                  label="Answer Synthesis"
                  time={synthesis.elapsedMs}
                  detail="Generated answer with citations"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * A single round of query planning + searches
 */
interface RoundSectionProps {
  round: RetrievalRound
  isFirst: boolean
}

function RoundSection({ round, isFirst }: RoundSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasMultipleRounds = round.roundNumber > 1 || round.planning !== null

  return (
    <div className="space-y-1">
      {/* Planning header (if exists) */}
      {round.planning && (
        <StepRow
          icon={<Brain className="w-3.5 h-3.5" />}
          iconBg="bg-blue-500"
          label={isFirst ? "Query Planning" : `Iteration ${round.roundNumber}`}
          time={round.planningTime}
          detail={`Decomposed into ${round.searches.length} sub-queries`}
        />
      )}

      {/* Searches section */}
      {round.searches.length > 0 && (
        <div className="ml-4">
          {/* Source header with expand/collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-bg-subtle transition-colors"
          >
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.15 }}
            >
              <ChevronRight className="w-4 h-4 text-fg-muted" />
            </motion.div>
            <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
              <Search className="w-3 h-3 text-white" />
            </div>
            <span className="text-[13px] font-medium text-fg-default flex-1 text-left">
              {round.searches[0]?.sourceName || 'Search'}
            </span>
            <span className="text-[10px] font-mono text-fg-subtle">
              {formatElapsedTime(round.totalSearchTime)}
            </span>
          </button>

          {/* Expanded queries */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="ml-8 space-y-1.5 pb-2">
                  {round.searches.map((search, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 px-3 py-2 rounded-md bg-bg-subtle border-l-2 border-accent"
                    >
                      <code className="flex-1 text-[11px] text-fg-muted font-mono leading-relaxed break-words">
                        &quot;{search.query}&quot;
                      </code>
                      <span className="text-[10px] text-fg-subtle whitespace-nowrap">
                        {search.count} docs
                      </span>
                    </div>
                  ))}
                  {/* Summary row */}
                  <div className="text-[11px] text-fg-subtle px-3 pt-1">
                    Retrieved {round.totalDocs} documents
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

/**
 * Generic step row component
 */
interface StepRowProps {
  icon: React.ReactNode
  iconBg: string
  label: string
  time?: number
  detail?: string
}

function StepRow({ icon, iconBg, label, time, detail }: StepRowProps) {
  return (
    <div className="flex items-center gap-3 py-2 px-3">
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-white",
        iconBg
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-fg-default">{label}</span>
          {time !== undefined && (
            <span className="text-[10px] font-mono text-fg-subtle">
              {formatElapsedTime(time)}
            </span>
          )}
        </div>
        {detail && (
          <div className="text-[11px] text-fg-subtle">{detail}</div>
        )}
      </div>
    </div>
  )
}
