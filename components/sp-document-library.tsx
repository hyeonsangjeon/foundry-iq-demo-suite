'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  DocumentPdf20Regular,
  Document20Regular,
  TableSimple20Regular,
  SlideText20Regular,
  ArrowRight20Regular,
  SpinnerIos20Regular,
} from '@fluentui/react-icons'

interface SPDocument {
  id: string
  name: string
  type: string
  size: number
  lastModified: string
  webUrl: string
  status: string
  chunks: number | null
}

interface DocumentsData {
  documents: SPDocument[]
  summary: {
    totalDocuments: number
    totalSizeBytes: number
    supportedFormats: string[]
  }
}

interface SPDocumentLibraryProps {
  data: DocumentsData | null
  isLoading?: boolean
  isIndexing?: boolean
  onIndexClick?: () => void
  className?: string
}

function formatSize(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatTotalSize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  if (mb >= 1024) return (mb / 1024).toFixed(1) + ' GB'
  return mb.toFixed(1) + ' MB'
}

function FileTypeIcon({ type }: { type: string }) {
  switch (type.toLowerCase()) {
    case 'pdf':
      return <DocumentPdf20Regular className="w-4 h-4 text-red-500" />
    case 'docx':
    case 'doc':
      return <Document20Regular className="w-4 h-4 text-blue-500" />
    case 'xlsx':
    case 'xls':
      return <TableSimple20Regular className="w-4 h-4 text-green-500" />
    case 'pptx':
    case 'ppt':
      return <SlideText20Regular className="w-4 h-4 text-orange-500" />
    default:
      return <Document20Regular className="w-4 h-4 text-fg-muted" />
  }
}

export function SPDocumentLibrary({
  data,
  isLoading,
  isIndexing,
  onIndexClick,
  className,
}: SPDocumentLibraryProps) {
  return (
    <div className={cn('rounded-xl border border-glass-border bg-glass-surface/50 p-4 flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
          SharePoint Documents
        </span>
        {data?.summary?.supportedFormats && (
          <span className="text-xs text-fg-subtle font-mono">
            {data.summary.supportedFormats.join(' · ')}
          </span>
        )}
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto max-h-72 space-y-0.5 pr-1">
        {isLoading || !data ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2 px-2">
              <div className="w-4 h-4 rounded bg-fg-subtle/20 animate-pulse shrink-0" />
              <div className="flex-1 h-3 rounded bg-fg-subtle/20 animate-pulse" />
              <div className="w-12 h-3 rounded bg-fg-subtle/10 animate-pulse" />
            </div>
          ))
        ) : (
          data.documents.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.15 }}
              className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-bg-subtle/50 transition-colors group"
            >
              <FileTypeIcon type={doc.type} />
              <span className="flex-1 text-xs text-fg-default truncate font-medium group-hover:text-accent transition-colors">
                {doc.name}
              </span>
              <span className="text-[10px] text-fg-subtle shrink-0 font-mono">
                {formatSize(doc.size)}
              </span>
            </motion.div>
          ))
        )}
      </div>

      {/* Summary + CTA */}
      {data && (
        <>
          <div className="border-t border-glass-border mt-3 pt-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-fg-muted">
                Total: <span className="font-semibold text-fg-default">{data.summary?.totalDocuments ?? data.documents.length} documents</span>
                {' · '}
                <span className="font-semibold text-fg-default">{formatTotalSize(data.summary?.totalSizeBytes ?? 0)}</span>
              </span>
            </div>
            <button
              onClick={onIndexClick}
              disabled={isIndexing}
              className={cn(
                'w-full flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-semibold transition-all duration-150',
                isIndexing
                  ? 'bg-accent/50 text-fg-on-accent cursor-not-allowed'
                  : 'bg-accent hover:bg-accent-hover text-fg-on-accent shadow-sm hover:shadow-md'
              )}
            >
              {isIndexing ? (
                <>
                  <SpinnerIos20Regular className="w-4 h-4 animate-spin" />
                  Indexing in progress...
                </>
              ) : (
                <>
                  Index These Documents
                  <ArrowRight20Regular className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
