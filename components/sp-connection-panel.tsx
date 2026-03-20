'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  CheckmarkCircle20Filled,
  DismissCircle20Filled,
  ShareMultiple20Regular,
  PersonKey20Regular,
  Search20Regular,
  Cube20Regular,
  Info16Regular,
} from '@fluentui/react-icons'

interface ConnectionData {
  sharepoint: { connected: boolean; siteUrl: string; siteName: string }
  entraApp: { configured: boolean; appName: string }
  aiSearch: { connected: boolean; serviceName: string }
  embedding: { ready: boolean; model: string }
}

interface ConnectionItem {
  key: string
  label: string
  detail: string
  status: boolean
  icon: React.ComponentType<{ className?: string }>
  tooltip: string
}

interface SPConnectionPanelProps {
  data: ConnectionData | null
  isLoading?: boolean
  className?: string
}

export function SPConnectionPanel({ data, isLoading, className }: SPConnectionPanelProps) {
  const items: ConnectionItem[] = data
    ? [
        {
          key: 'sharepoint',
          label: 'SharePoint Site',
          detail: data.sharepoint.siteName,
          status: data.sharepoint.connected,
          icon: ShareMultiple20Regular,
          tooltip: 'Source document library where your enterprise documents are stored',
        },
        {
          key: 'entra',
          label: 'Entra App Registration',
          detail: data.entraApp.appName,
          status: data.entraApp.configured,
          icon: PersonKey20Regular,
          tooltip: 'Azure AD app that grants AI Search permission to read SharePoint files',
        },
        {
          key: 'aiSearch',
          label: 'Azure AI Search',
          detail: data.aiSearch.serviceName,
          status: data.aiSearch.connected,
          icon: Search20Regular,
          tooltip: 'Search service that indexes, chunks, and vectorizes your documents',
        },
        {
          key: 'embedding',
          label: 'Embedding Model',
          detail: data.embedding.model,
          status: data.embedding.ready,
          icon: Cube20Regular,
          tooltip: 'AI model that converts text chunks into 1536-dimensional vectors for semantic search',
        },
      ]
    : []

  return (
    <div className={cn('rounded-xl border border-glass-border bg-glass-surface/50 p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
          Connection Status
        </span>
        {data && (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            All Systems Ready
          </span>
        )}
      </div>

      {/* Items */}
      <div className="space-y-1">
        {isLoading || !data ? (
          // Shimmer skeleton
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="w-4 h-4 rounded-full bg-fg-subtle/20 animate-pulse shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-32 rounded bg-fg-subtle/20 animate-pulse" />
                <div className="h-2.5 w-24 rounded bg-fg-subtle/10 animate-pulse" />
              </div>
            </div>
          ))
        ) : (
          items.map((item, i) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.2 }}
                className="flex items-center gap-3 py-2"
              >
                <div className={cn(
                  'shrink-0 w-7 h-7 rounded-lg flex items-center justify-center',
                  item.status
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                )}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-fg-default truncate">{item.label}</span>
                    <span className="relative group/tip shrink-0" tabIndex={0}>
                      <Info16Regular className="w-3.5 h-3.5 text-fg-subtle cursor-help" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-[11px] text-fg-default bg-bg-elevated border border-stroke-divider rounded-lg shadow-lg opacity-0 group-hover/tip:opacity-100 group-focus/tip:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                        {item.tooltip}
                      </span>
                    </span>
                    {item.status ? (
                      <CheckmarkCircle20Filled className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    ) : (
                      <DismissCircle20Filled className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-fg-subtle truncate font-mono">{item.detail}</p>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Divider */}
      {data && (
        <>
          <div className="border-t border-glass-border my-3" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-fg-subtle">Site URL</span>
            <span className="text-xs text-fg-muted font-mono truncate max-w-[200px]">
              {data.sharepoint.siteUrl.replace('https://', '')}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
