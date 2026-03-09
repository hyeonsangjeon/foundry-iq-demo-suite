'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Hotel = {
  HotelId: string
  HotelName: string
  Description: string
  Category: string
  Tags: string[]
  Rating: number
  Address?: {
    StreetAddress?: string
    City?: string
    StateProvince?: string
    PostalCode?: string
    Country?: string
  }
}

function SkeletonCard() {
  return (
    <Card className="p-4 animate-pulse">
      <div className="h-4 bg-bg-subtle rounded w-3/4 mb-3" />
      <div className="h-3 bg-bg-subtle rounded w-1/4 mb-2" />
      <div className="h-3 bg-bg-subtle rounded w-1/2 mb-3" />
      <div className="flex gap-1">
        <div className="h-4 bg-bg-subtle rounded w-12" />
        <div className="h-4 bg-bg-subtle rounded w-14" />
      </div>
    </Card>
  )
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  return (
    <Card className="p-4 hover:bg-bg-hover transition-colors">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold text-fg-default line-clamp-1">{hotel.HotelName}</h4>
        <span className="text-xs text-fg-muted shrink-0 ml-2">
          {hotel.Rating != null ? `★ ${hotel.Rating}` : ''}
        </span>
      </div>
      <p className="text-xs text-fg-muted mb-2">{hotel.Category}</p>
      {hotel.Address && (
        <p className="text-xs text-fg-subtle">
          {[hotel.Address.City, hotel.Address.StateProvince].filter(Boolean).join(', ')}
        </p>
      )}
      {hotel.Tags && hotel.Tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {hotel.Tags.slice(0, 3).map((tag: string) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  )
}

export function DataExplorer() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const resp = await fetch('/api/search-docs?index=hotels-sample&top=50')
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const data = await resp.json()
        setHotels(data.value || [])
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error'
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-fg-muted text-sm">
        Failed to load data: {error}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-stroke-divider text-xs text-fg-muted">
        {loading ? 'Loading...' : `${hotels.length} hotels in Knowledge Base`}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 overflow-y-auto flex-1">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : hotels.map((hotel) => <HotelCard key={hotel.HotelId} hotel={hotel} />)
        }
      </div>
    </div>
  )
}
