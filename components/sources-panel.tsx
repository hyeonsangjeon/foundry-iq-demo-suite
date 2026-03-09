"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { KnowledgeBaseReference, KnowledgeBaseActivityRecord } from '@/types/knowledge-retrieval'
import { RetrievalJourney } from '@/components/retrieval-journey'
import { cn, cleanTextSnippet } from '@/lib/utils'

/**
 * Get favicon/icon styling for source type
 */
function getSourceIcon(type: string): { bg: string; letter: string; color: string } {
  switch (type) {
    case 'web':
      return { bg: 'bg-blue-100 dark:bg-blue-900/30', letter: 'W', color: 'text-blue-600 dark:text-blue-400' }
    case 'azureBlob':
      return { bg: 'bg-rose-100 dark:bg-rose-900/30', letter: 'B', color: 'text-rose-600 dark:text-rose-400' }
    case 'searchIndex':
      return { bg: 'bg-rose-100 dark:bg-rose-900/30', letter: 'S', color: 'text-rose-600 dark:text-rose-400' }
    case 'indexedOneLake':
      return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', letter: 'O', color: 'text-emerald-600 dark:text-emerald-400' }
    case 'remoteSharePoint':
    case 'indexedSharePoint':
      return { bg: 'bg-violet-100 dark:bg-violet-900/30', letter: 'SP', color: 'text-violet-600 dark:text-violet-400' }
    default:
      return { bg: 'bg-gray-100 dark:bg-gray-800', letter: '?', color: 'text-gray-600 dark:text-gray-400' }
  }
}

interface SourcesPanelProps {
  isOpen: boolean
  onClose: () => void
  references: KnowledgeBaseReference[]
  activity: KnowledgeBaseActivityRecord[]
  query?: string
  messageId: string | number
}

/**
 * Get domain for display (like Perplexity shows domain first)
 */
function getSourceDomain(ref: KnowledgeBaseReference): string {
  switch (ref.type) {
    case 'web': {
      try {
        const url = new URL((ref as any).url || '')
        return url.hostname.replace('www.', '')
      } catch {
        return 'web'
      }
    }
    case 'azureBlob':
      return 'azure.blob'
    case 'searchIndex':
      return 'search.index'
    case 'indexedOneLake':
      return 'onelake'
    case 'remoteSharePoint':
    case 'indexedSharePoint':
      return 'sharepoint'
    default:
      return 'document'
  }
}

/**
 * Get document title for display
 */
function getDocumentTitle(ref: KnowledgeBaseReference): string {
  if (ref.type === 'web' && (ref as any).title) {
    return (ref as any).title
  }
  if (ref.sourceData?.title) {
    return ref.sourceData.title
  }
  switch (ref.type) {
    case 'azureBlob': {
      const blobUrl = (ref as any).blobUrl || ''
      return decodeURIComponent(blobUrl.split('/').pop() || ref.id)
    }
    case 'remoteSharePoint':
    case 'indexedSharePoint': {
      const url = (ref as any).webUrl || (ref as any).docUrl || ''
      return decodeURIComponent(url.split('/').pop() || ref.id)
    }
    case 'indexedOneLake': {
      const docUrl = (ref as any).docUrl || ''
      return decodeURIComponent(docUrl.split('/').pop() || ref.id)
    }
    case 'searchIndex':
      return (ref as any).docKey || ref.id
    default:
      return ref.id
  }
}

/**
 * Get snippet from reference
 */
function getSnippet(ref: KnowledgeBaseReference): string | null {
  if (!ref.sourceData) return null

  if (ref.sourceData.snippet) {
    return cleanTextSnippet(ref.sourceData.snippet)
  }

  if (ref.sourceData.extracts && Array.isArray(ref.sourceData.extracts)) {
    const text = ref.sourceData.extracts.map((e: any) => e.text).join(' ')
    return cleanTextSnippet(text)
  }

  if (ref.sourceData.content) {
    const content = typeof ref.sourceData.content === 'string'
      ? ref.sourceData.content
      : JSON.stringify(ref.sourceData.content)
    return cleanTextSnippet(content.slice(0, 300))
  }

  const textFields = ['text', 'description', 'summary', 'body', 'chunk', 'chunk_content']
  for (const field of textFields) {
    if (ref.sourceData[field] && typeof ref.sourceData[field] === 'string') {
      return cleanTextSnippet(ref.sourceData[field].slice(0, 300))
    }
  }

  return null
}

export function SourcesPanel({
  isOpen,
  onClose,
  references,
  activity,
  query,
  messageId
}: SourcesPanelProps) {
  const [width, setWidth] = useState(420)
  const [isResizing, setIsResizing] = useState(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(420)

  const minWidth = 300
  const maxWidth = 600

  // Handle mouse down on resize handle
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = width
  }, [width])

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      // Calculate new width based on how far we've dragged from start
      const delta = startXRef.current - e.clientX
      const newWidth = startWidthRef.current + delta

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  // Deduplicate references by URL/key
  const uniqueRefs = React.useMemo(() => {
    const seen = new Set<string>()
    return references.filter(ref => {
      const key = (ref as any).blobUrl || (ref as any).url || (ref as any).webUrl || (ref as any).docUrl || (ref as any).docKey || ref.id
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [references])

  if (!isOpen) return null

  return (
    <div
      className="relative h-full flex-shrink-0 flex"
      style={{ width }}
    >
      {/* Resize Handle - Perplexity style thin line */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          "absolute left-0 top-0 bottom-0 w-[3px] cursor-col-resize z-10",
          "bg-transparent hover:bg-accent/60",
          "transition-colors duration-150",
          isResizing && "bg-accent"
        )}
      >
        {/* Invisible wider hit area */}
        <div className="absolute -left-2 -right-2 top-0 bottom-0" />
      </div>

      {/* Panel Content */}
      <div className="flex-1 h-full bg-white dark:bg-[#1a1a1a] border-l border-gray-200 dark:border-gray-700/50 flex flex-col overflow-hidden">
        {/* Header - Perplexity style */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {uniqueRefs.length} sources
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close panel"
          >
            <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        {/* Sources list - Perplexity style */}
        <div className="flex-1 overflow-y-auto">
          <div className="py-2">
            {uniqueRefs.map((ref, idx) => (
              <SourceItem
                key={`${ref.id}-${idx}`}
                reference={ref}
                index={idx}
                messageId={messageId}
              />
            ))}
          </div>
        </div>

        {/* Journey Timeline (collapsible at bottom) */}
        <div className="border-t border-gray-100 dark:border-gray-800">
          <RetrievalJourney
            activity={activity}
            references={references}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Individual source item - Perplexity style
 */
interface SourceItemProps {
  reference: KnowledgeBaseReference
  index: number
  messageId: string | number
}

function SourceItem({ reference, index, messageId }: SourceItemProps) {
  const domain = getSourceDomain(reference)
  const title = getDocumentTitle(reference)
  const snippet = getSnippet(reference)
  const iconStyle = getSourceIcon(reference.type)

  const url = (reference as any).url || (reference as any).webUrl || (reference as any).docUrl || null

  return (
    <div
      id={`ref-${messageId}-${index}`}
      className={cn(
        "px-5 py-3",
        "hover:bg-gray-50 dark:hover:bg-gray-800/50",
        "transition-colors duration-100",
        url && "cursor-pointer",
        index > 0 && "border-t border-gray-100 dark:border-gray-800/50"
      )}
      onClick={() => {
        if (url) window.open(url, '_blank', 'noopener,noreferrer')
      }}
    >
      {/* Domain with favicon */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
          "text-[9px] font-bold",
          iconStyle.bg,
          iconStyle.color
        )}>
          {iconStyle.letter}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {domain}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1 leading-snug">
        {title}
      </h3>

      {/* Snippet */}
      {snippet && (
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">
          {snippet}
        </p>
      )}
    </div>
  )
}

// Re-export for backwards compatibility
export function SourcesDrawer(props: SourcesPanelProps) {
  return <SourcesPanel {...props} />
}
