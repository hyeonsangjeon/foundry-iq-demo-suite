"use client"

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { KnowledgeBaseReference, KnowledgeBaseActivityRecord } from '@/types/knowledge-retrieval'
import { CitationHoverCard, getShortDomainLabel, getDocumentName } from '@/components/citation-hover-card'
import { SourceKindIcon } from '@/components/source-kind-icon'
import { cn } from '@/lib/utils'

/**
 * InlineCitationsText
 * Renders text content replacing [ref_id:n] markers with interactive citation pills.
 *
 * NEW DESIGN: Perplexity-style domain pills with hover preview cards
 * - Shows source domain/name instead of just numbers
 * - Hover reveals full preview card with title, snippet, relevance
 * - Click triggers onActivate callback
 */
export interface InlineCitationsTextProps {
  text: string
  references?: KnowledgeBaseReference[]
  activity?: KnowledgeBaseActivityRecord[]
  messageId: string | number
  onActivate?: (idx: number, ref?: KnowledgeBaseReference) => void
  className?: string
}

export const InlineCitationsText: React.FC<InlineCitationsTextProps> = ({
  text,
  references = [],
  activity = [],
  messageId,
  onActivate,
  className
}) => {
  const render = React.useMemo(() => {
    if (!text) return null

    // Split text by [ref_id:N] markers, keeping delimiters
    const parts = text.split(/(\[ref_id:\d+\])/g)

    return parts.map((part, i) => {
      const refMatch = part.match(/^\[ref_id:(\d+)\]$/)
      if (refMatch) {
        const refIdx = parseInt(refMatch[1], 10)
        const ref = references[refIdx]

        if (ref) {
          const activityEntry = activity.find((a: KnowledgeBaseActivityRecord) => a.id === ref.activitySource)
          const documentName = getDocumentName(ref)

          const pill = (
            <button
              key={`cite-${i}`}
              type="button"
              onClick={() => {
                if (onActivate) onActivate(refIdx, ref)
                const el = document.getElementById(`ref-${messageId}-${refIdx}`)
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  el.classList.add('ring-2', 'ring-accent', 'ring-offset-1')
                  setTimeout(() => el.classList.remove('ring-2', 'ring-accent', 'ring-offset-1'), 1400)
                }
              }}
              aria-label={`View reference: ${documentName}`}
              className={cn(
                "inline-flex items-center gap-1.5 align-baseline",
                "ml-1 px-2 py-0.5 rounded",
                "bg-bg-subtle hover:bg-bg-hover",
                "border border-stroke-divider hover:border-accent/40",
                "text-[11px] text-fg-muted hover:text-fg-default",
                "transition-all duration-150",
                "focus:outline-none focus:ring-1 focus:ring-accent",
                "cursor-pointer"
              )}
            >
              <SourceKindIcon kind={ref.type} size={12} variant="plain" />
              <span className="truncate max-w-[180px]">{documentName}</span>
            </button>
          )

          return (
            <CitationHoverCard
              key={`hover-${i}`}
              reference={ref}
              activity={activityEntry}
              side="top"
              align="center"
            >
              {pill}
            </CitationHoverCard>
          )
        } else {
          return (
            <span
              key={`cite-${i}`}
              className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded bg-bg-subtle text-[10px] text-fg-subtle"
            >
              [{refIdx + 1}]
            </span>
          )
        }
      }

      // Text segment — render with ReactMarkdown
      if (!part) return null
      return (
        <ReactMarkdown
          key={`md-${i}`}
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold text-fg-default">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>,
            h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3">{children}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2">{children}</h3>,
            code: ({ children }) => <code className="px-1.5 py-0.5 rounded bg-bg-subtle text-[12px] font-mono">{children}</code>,
          }}
        >
          {part}
        </ReactMarkdown>
      )
    })
  }, [text, references, activity, messageId, onActivate])

  return <div className={className}>{render}</div>
}

/**
 * CitationPill - Standalone citation pill component for use in sources footer
 */
interface CitationPillProps {
  reference: KnowledgeBaseReference
  activity?: KnowledgeBaseActivityRecord
  onClick?: () => void
  showHover?: boolean
  className?: string
}

export const CitationPill: React.FC<CitationPillProps> = ({
  reference,
  activity,
  onClick,
  showHover = true,
  className
}) => {
  const documentName = getDocumentName(reference)

  const pill = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5",
        "px-2 py-1 rounded",
        "bg-bg-subtle hover:bg-bg-hover",
        "border border-stroke-divider hover:border-accent/40",
        "text-xs text-fg-muted hover:text-fg-default",
        "transition-all duration-150",
        "focus:outline-none focus:ring-1 focus:ring-accent",
        "cursor-pointer",
        className
      )}
    >
      <SourceKindIcon kind={reference.type} size={14} variant="plain" />
      <span className="truncate max-w-[180px]">{documentName}</span>
    </button>
  )

  if (!showHover) return pill

  return (
    <CitationHoverCard reference={reference} activity={activity}>
      {pill}
    </CitationHoverCard>
  )
}

/**
 * SourcesCountButton - "N sources" button for opening the sources drawer
 */
interface SourcesCountButtonProps {
  references: KnowledgeBaseReference[]
  onClick?: () => void
  className?: string
}

/**
 * Get background color class for source type
 */
function getSourceTypeColor(type: string): string {
  switch (type) {
    case 'web':
      return 'bg-blue-500/20 text-blue-400'
    case 'azureBlob':
    case 'searchIndex':
      return 'bg-pink-500/20 text-pink-400'
    case 'indexedOneLake':
      return 'bg-emerald-500/20 text-emerald-400'
    case 'remoteSharePoint':
    case 'indexedSharePoint':
      return 'bg-purple-500/20 text-purple-400'
    default:
      return 'bg-gray-500/20 text-gray-400'
  }
}

/**
 * Get letter for source type dot
 */
function getSourceTypeLetter(type: string): string {
  switch (type) {
    case 'web': return 'W'
    case 'azureBlob': return 'B'
    case 'searchIndex': return 'S'
    case 'indexedOneLake': return 'O'
    case 'remoteSharePoint':
    case 'indexedSharePoint': return 'SP'
    default: return '?'
  }
}

export const SourcesCountButton: React.FC<SourcesCountButtonProps> = ({
  references,
  onClick,
  className
}) => {
  // Get unique source types for stacked icons
  const uniqueTypes = Array.from(new Set(references.map(r => r.type))).slice(0, 3)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2",
        "px-3.5 py-2 rounded-full",
        "bg-bg-subtle hover:bg-bg-hover",
        "border border-stroke-divider hover:border-accent/40",
        "text-sm font-medium text-fg-default",
        "transition-all duration-150",
        "focus:outline-none focus:ring-1 focus:ring-accent",
        "cursor-pointer",
        className
      )}
    >
      {/* Stacked source type dots with colors */}
      <span className="flex items-center">
        {uniqueTypes.map((type, idx) => (
          <span
            key={type}
            className={cn(
              "w-[18px] h-[18px] rounded flex items-center justify-center",
              "text-[9px] font-bold border-2 border-bg-subtle",
              idx > 0 && "-ml-1",
              getSourceTypeColor(type)
            )}
            style={{ zIndex: uniqueTypes.length - idx }}
          >
            {getSourceTypeLetter(type)}
          </span>
        ))}
      </span>
      <span>{references.length} sources</span>
    </button>
  )
}
