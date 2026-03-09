"use client"

import * as React from 'react'
import * as HoverCard from '@radix-ui/react-hover-card'
import { KnowledgeBaseReference, KnowledgeBaseActivityRecord, isRetrievalActivity } from '@/types/knowledge-retrieval'
import { cn, cleanTextSnippet } from '@/lib/utils'

/**
 * Get background color class for source type icon
 */
function getSourceIconStyle(type: string): { bg: string; text: string; letter: string } {
  switch (type) {
    case 'web':
      return { bg: 'bg-blue-500/15', text: 'text-blue-400', letter: 'W' }
    case 'azureBlob':
      return { bg: 'bg-pink-500/15', text: 'text-pink-400', letter: 'B' }
    case 'searchIndex':
      return { bg: 'bg-pink-500/15', text: 'text-pink-400', letter: 'S' }
    case 'indexedOneLake':
      return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', letter: 'O' }
    case 'remoteSharePoint':
    case 'indexedSharePoint':
      return { bg: 'bg-purple-500/15', text: 'text-purple-400', letter: 'SP' }
    default:
      return { bg: 'bg-gray-500/15', text: 'text-gray-400', letter: '?' }
  }
}

interface CitationHoverCardProps {
  reference: KnowledgeBaseReference
  activity?: KnowledgeBaseActivityRecord
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
}

/**
 * Get display domain/path for a reference
 */
function getReferenceDomain(ref: KnowledgeBaseReference): string {
  switch (ref.type) {
    case 'web': {
      try {
        const url = new URL((ref as any).url || '')
        return url.hostname.replace('www.', '')
      } catch {
        return 'web'
      }
    }
    case 'azureBlob': {
      const blobUrl = (ref as any).blobUrl || ''
      const parts = blobUrl.split('/')
      const container = parts[3] || 'blob'
      return container
    }
    case 'remoteSharePoint':
    case 'indexedSharePoint': {
      const webUrl = (ref as any).webUrl || (ref as any).docUrl || ''
      try {
        const url = new URL(webUrl)
        return url.hostname.replace('www.', '')
      } catch {
        return 'sharepoint'
      }
    }
    case 'indexedOneLake': {
      const docUrl = (ref as any).docUrl || ''
      const parts = docUrl.split('/')
      return parts[2] || 'onelake'
    }
    case 'searchIndex':
      return (ref as any).docKey?.split('/')[0] || 'index'
    default:
      return (ref as any).type || 'unknown'
  }
}

/**
 * Get document title for a reference
 */
function getReferenceTitle(ref: KnowledgeBaseReference): string {
  // Web references have explicit title
  if (ref.type === 'web' && (ref as any).title) {
    return (ref as any).title
  }

  // Try to get from source data
  if (ref.sourceData?.title) {
    return ref.sourceData.title
  }

  // Extract from URL/path
  switch (ref.type) {
    case 'azureBlob': {
      const blobUrl = (ref as any).blobUrl || ''
      const filename = blobUrl.split('/').pop() || ''
      return decodeURIComponent(filename)
    }
    case 'remoteSharePoint':
    case 'indexedSharePoint': {
      const url = (ref as any).webUrl || (ref as any).docUrl || ''
      const filename = url.split('/').pop() || ''
      return decodeURIComponent(filename)
    }
    case 'indexedOneLake': {
      const docUrl = (ref as any).docUrl || ''
      const filename = docUrl.split('/').pop() || ''
      return decodeURIComponent(filename)
    }
    case 'searchIndex':
      return (ref as any).docKey || ref.id
    default:
      return ref.id
  }
}

/**
 * Get snippet text from reference
 */
function getReferenceSnippet(ref: KnowledgeBaseReference): string | null {
  if (!ref.sourceData) return null

  // Try snippet field first
  if (ref.sourceData.snippet) {
    return cleanTextSnippet(ref.sourceData.snippet)
  }

  // Try extracts array
  if (ref.sourceData.extracts && Array.isArray(ref.sourceData.extracts)) {
    const text = ref.sourceData.extracts.map((e: any) => e.text).join(' ')
    return cleanTextSnippet(text)
  }

  // Try content field
  if (ref.sourceData.content) {
    const content = typeof ref.sourceData.content === 'string'
      ? ref.sourceData.content
      : JSON.stringify(ref.sourceData.content)
    return cleanTextSnippet(content.slice(0, 300))
  }

  // Try any text-like fields in sourceData
  const textFields = ['text', 'description', 'summary', 'body', 'chunk', 'chunk_content']
  for (const field of textFields) {
    if (ref.sourceData[field] && typeof ref.sourceData[field] === 'string') {
      return cleanTextSnippet(ref.sourceData[field].slice(0, 300))
    }
  }

  return null
}

/**
 * Get retrieval source info from activity
 */
function getRetrievalInfo(activity?: KnowledgeBaseActivityRecord): { source: string; time: number } | null {
  if (!activity || !isRetrievalActivity(activity)) return null

  return {
    source: activity.knowledgeSourceName,
    time: activity.elapsedMs || 0
  }
}

export function CitationHoverCard({
  reference,
  activity,
  children,
  side = 'top',
  align = 'center'
}: CitationHoverCardProps) {
  const domain = getReferenceDomain(reference)
  const title = getReferenceTitle(reference)
  const snippet = getReferenceSnippet(reference)
  const iconStyle = getSourceIconStyle(reference.type)

  // Debug: Log reference data on hover (will show in console)
  React.useEffect(() => {
    console.log('🔍 Citation HoverCard reference:', {
      id: reference.id,
      type: reference.type,
      hasSourceData: !!reference.sourceData,
      sourceDataKeys: reference.sourceData ? Object.keys(reference.sourceData) : [],
      snippet: snippet ? snippet.slice(0, 50) + '...' : 'no snippet',
      title
    })
  }, [reference, snippet, title])

  return (
    <HoverCard.Root openDelay={200} closeDelay={100}>
      <HoverCard.Trigger asChild>
        {children}
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          className={cn(
            "z-50 w-[300px] rounded-[10px] border border-stroke-divider bg-bg-card p-3.5",
            "shadow-lg shadow-black/40",
            "animate-in fade-in-0 zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "data-[side=bottom]:slide-in-from-top-2",
            "data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2",
            "data-[side=top]:slide-in-from-bottom-2"
          )}
          side={side}
          align={align}
          sideOffset={8}
        >
          {/* Header with colored icon */}
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className={cn(
              "w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0",
              "text-xs font-bold",
              iconStyle.bg,
              iconStyle.text
            )}>
              {iconStyle.letter}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-fg-subtle truncate">{domain}</div>
              <div className="text-[13px] font-semibold text-fg-default truncate mt-0.5">{title}</div>
            </div>
          </div>

          {/* Snippet */}
          {snippet && (
            <div className="text-xs text-fg-muted leading-relaxed line-clamp-3">
              {snippet}
            </div>
          )}

          <HoverCard.Arrow className="fill-bg-card" />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}

/**
 * Utility to get short domain label for inline citation pills
 */
export function getShortDomainLabel(ref: KnowledgeBaseReference): string {
  return getReferenceDomain(ref)
}

/**
 * Utility to get document name/filename for inline citation pills
 * Returns a meaningful name like "gpt-5-system-card.pdf" instead of just domain
 */
export function getDocumentName(ref: KnowledgeBaseReference): string {
  // Try to get title from sourceData first
  if (ref.sourceData?.title) {
    return truncateLabel(ref.sourceData.title, 30)
  }

  // Web references have explicit title
  if (ref.type === 'web' && (ref as any).title) {
    return truncateLabel((ref as any).title, 30)
  }

  // Extract filename from URL/path
  switch (ref.type) {
    case 'azureBlob': {
      const blobUrl = (ref as any).blobUrl || ''
      const filename = blobUrl.split('/').pop() || ''
      if (filename) return truncateLabel(decodeURIComponent(filename), 30)
      break
    }
    case 'remoteSharePoint':
    case 'indexedSharePoint': {
      const url = (ref as any).webUrl || (ref as any).docUrl || ''
      const filename = url.split('/').pop() || ''
      if (filename) return truncateLabel(decodeURIComponent(filename), 30)
      break
    }
    case 'indexedOneLake': {
      const docUrl = (ref as any).docUrl || ''
      const filename = docUrl.split('/').pop() || ''
      if (filename) return truncateLabel(decodeURIComponent(filename), 30)
      break
    }
    case 'searchIndex': {
      const docKey = (ref as any).docKey || ''
      if (docKey) {
        // docKey might be a path like "container/folder/file.pdf"
        const filename = docKey.split('/').pop() || docKey
        return truncateLabel(decodeURIComponent(filename), 30)
      }
      break
    }
    case 'web': {
      // For web, try URL path or use domain
      try {
        const url = new URL((ref as any).url || '')
        const pathParts = url.pathname.split('/').filter(Boolean)
        if (pathParts.length > 0) {
          return truncateLabel(decodeURIComponent(pathParts[pathParts.length - 1]), 30)
        }
        return url.hostname.replace('www.', '')
      } catch {
        return 'web'
      }
    }
  }

  // Fallback to ID
  return truncateLabel(ref.id, 30)
}

/**
 * Truncate label to max length with ellipsis
 */
function truncateLabel(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 1) + '…'
}
