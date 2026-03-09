'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface ServiceStatus {
  name: string
  status: 'connected' | 'checking' | 'error'
  detail?: string
  latencyMs?: number
}

interface HealthData {
  services: ServiceStatus[]
  timestamp: string
}

interface ServiceHealthPanelProps {
  pingIntervalMs?: number
  className?: string
}

export function ServiceHealthPanel({ pingIntervalMs = 30000, className }: ServiceHealthPanelProps) {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [lastPingAgo, setLastPingAgo] = useState<string>('--')
  const [lastPingTime, setLastPingTime] = useState<number | null>(null)

  const fetchHealth = useCallback(async () => {
    try {
      const resp = await fetch('/api/health')
      if (resp.ok) {
        const data: HealthData = await resp.json()
        setHealth(data)
        setLastPingTime(Date.now())
      }
    } catch {
      // Silently fail — health panel errors shouldn't block the app
    }
  }, [])

  // Initial fetch + interval
  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, pingIntervalMs)
    return () => clearInterval(interval)
  }, [fetchHealth, pingIntervalMs])

  // Update "ago" text every second
  useEffect(() => {
    const tick = setInterval(() => {
      if (lastPingTime) {
        const seconds = Math.floor((Date.now() - lastPingTime) / 1000)
        setLastPingAgo(seconds < 60 ? `${seconds}s ago` : `${Math.floor(seconds / 60)}m ago`)
      }
    }, 1000)
    return () => clearInterval(tick)
  }, [lastPingTime])

  const avgLatency = health
    ? Math.round(
        health.services
          .filter((s) => s.latencyMs != null)
          .reduce((sum, s) => sum + (s.latencyMs || 0), 0) /
          (health.services.filter((s) => s.latencyMs != null).length || 1)
      )
    : null

  return (
    <div className={cn('rounded-xl border border-glass-border bg-glass-surface/50 p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Service Health</span>
        <span className="text-xs text-fg-subtle">🔄 {lastPingAgo}</span>
      </div>

      {/* Services */}
      <div className="space-y-1">
        {health ? (
          health.services.map((svc) => (
            <div key={svc.name}>
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      svc.status === 'connected' && 'bg-green-500',
                      svc.status === 'checking' && 'bg-amber-500 animate-pulse',
                      svc.status === 'error' && 'bg-red-500'
                    )}
                  />
                  <span className="text-sm text-fg-default">{svc.name}</span>
                </div>
                <span className="text-xs text-fg-subtle capitalize">{svc.status}</span>
              </div>
              {svc.detail && (
                <p className="text-xs text-fg-muted pl-4 mt-0.5">{svc.detail}</p>
              )}
            </div>
          ))
        ) : (
          <div className="flex items-center gap-2 py-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm text-fg-muted">Checking...</span>
          </div>
        )}
      </div>

      {/* Divider + Stats */}
      <div className="border-t border-glass-border my-2" />
      <div className="flex items-center justify-between">
        <span className="text-xs text-fg-subtle">Avg Latency</span>
        <span className="text-xs text-fg-subtle">{avgLatency != null ? `${avgLatency}ms` : '--'}</span>
      </div>
    </div>
  )
}
