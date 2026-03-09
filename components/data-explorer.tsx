'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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

// Category → color map
const categoryColors: Record<string, { bg: string; text: string; dot: string }> = {
  'Budget':    { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500' },
  'Boutique':  { bg: 'bg-violet-500/10',  text: 'text-violet-500',  dot: 'bg-violet-500' },
  'Resort':    { bg: 'bg-amber-500/10',   text: 'text-amber-500',   dot: 'bg-amber-500' },
  'Luxury':    { bg: 'bg-rose-500/10',    text: 'text-rose-500',    dot: 'bg-rose-500' },
  'Suite':     { bg: 'bg-sky-500/10',     text: 'text-sky-500',     dot: 'bg-sky-500' },
  'Extended-Stay': { bg: 'bg-teal-500/10', text: 'text-teal-500',  dot: 'bg-teal-500' },
}
const defaultCategoryColor = { bg: 'bg-fg-subtle/10', text: 'text-fg-muted', dot: 'bg-fg-subtle' }

// Tag → color palette (cycles through)
const tagPalette = [
  { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
  { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  { bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/20' },
  { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
]

function tagColor(tag: string) {
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  return tagPalette[Math.abs(hash) % tagPalette.length]
}

// Star rating → color
function ratingColor(r: number): string {
  if (r >= 4.5) return 'text-yellow-400'
  if (r >= 4.0) return 'text-amber-400'
  if (r >= 3.0) return 'text-orange-400'
  return 'text-fg-subtle'
}

function ratingStars(r: number) {
  const full = Math.floor(r)
  const half = r - full >= 0.5
  const stars: string[] = []
  for (let i = 0; i < full; i++) stars.push('★')
  if (half) stars.push('½')
  return stars.join('')
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
  const catColor = categoryColors[hotel.Category] || defaultCategoryColor
  const city = hotel.Address
    ? [hotel.Address.City, hotel.Address.StateProvince].filter(Boolean).join(', ')
    : null

  return (
    <Card className="group relative p-4 hover:bg-bg-hover transition-all duration-200 overflow-hidden">
      {/* Category accent bar */}
      <div className={cn('absolute top-0 left-0 w-1 h-full rounded-l-lg', catColor.dot)} />

      {/* Header: Name + Rating */}
      <div className="flex items-start justify-between mb-2 pl-2">
        <h4 className="text-sm font-semibold text-fg-default line-clamp-1 flex-1">{hotel.HotelName}</h4>
        {hotel.Rating != null && (
          <span className={cn('text-xs font-semibold shrink-0 ml-2', ratingColor(hotel.Rating))}>
            {ratingStars(hotel.Rating)} {hotel.Rating.toFixed(1)}
          </span>
        )}
      </div>

      {/* Category pill */}
      <div className="pl-2 mb-2">
        <span className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
          catColor.bg, catColor.text
        )}>
          <span className={cn('w-1.5 h-1.5 rounded-full', catColor.dot)} />
          {hotel.Category}
        </span>
      </div>

      {/* City with pin icon */}
      {city && (
        <p className="text-xs text-fg-subtle pl-2 mb-2 flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 text-rose-400">
            <path d="M5 1C3.34 1 2 2.34 2 4c0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4a1 1 0 110-2 1 1 0 010 2z" fill="currentColor" />
          </svg>
          <span className="text-fg-muted">{city}</span>
        </p>
      )}

      {/* Tags */}
      {hotel.Tags && hotel.Tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-2 mt-1">
          {hotel.Tags.slice(0, 3).map((tag: string) => {
            const tc = tagColor(tag)
            return (
              <span
                key={tag}
                className={cn(
                  'inline-flex items-center rounded-md border px-1.5 py-0 text-[9px] font-medium',
                  tc.bg, tc.text, tc.border
                )}
              >
                {tag}
              </span>
            )
          })}
          {hotel.Tags.length > 3 && (
            <span className="text-[9px] text-fg-subtle">+{hotel.Tags.length - 3}</span>
          )}
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
