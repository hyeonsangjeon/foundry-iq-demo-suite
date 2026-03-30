'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import './semantic-join.css'
import { getLocale, type Locale } from '@/lib/i18n'
import { t } from '@/lib/i18n/translations'

const LIVE_MODE = true

interface PresetItem {
  label: string
  q: string
}

const PRESETS: PresetItem[] = [
  {
    label: "JFK 3hr delay + rights",
    q: "I am currently at JFK airport and my JetBlue domestic flight has been delayed for over 3 hours. How often do delays like this happen at JFK? Under US DOT regulations, what compensation or refund am I entitled to?"
  },
  {
    label: "Cancellation ranking + weather",
    q: "Which US airlines had the highest cancellation rates in 2015, and what does the DOT say about passenger rights when a flight is cancelled due to weather?"
  },
  {
    label: "Delta vs AA + tarmac rules",
    q: "Between Delta and American Airlines, which one has fewer delays? If I end up stuck on the tarmac for a long time, what rules apply?"
  }
]

type RefMap = Record<string, { seq: number; type: 'fabric' | 'foundry'; title: string; sourceLabel: string }>

function formatAnswer(text: string, refMap: RefMap): string {
  // Replace [ref_id:N] with sequential colored badge using refMap
  return text.replace(/\[ref_id:(\d+)\]/g, (_, id) => {
    const entry = refMap[id]
    if (!entry) return ''
    const cls = entry.type === 'fabric' ? 'cite cite-f' : 'cite cite-d'
    return `<span class="${cls}">${entry.seq}</span>`
  })
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function SemanticJoinPage() {
  const [locale, setLocaleState] = useState<Locale>('en')
  useEffect(() => {
    const l = getLocale()
    setLocaleState(l)
    setFabricStatus(t.semanticJoin[l].fabricWaiting)
    setFoundryStatus(t.semanticJoin[l].foundryWaiting)
  }, [])
  const text = t.semanticJoin[locale]

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [queryValue, setQueryValue] = useState('')
  const [running, setRunning] = useState(false)
  const [activeTab, setActiveTab] = useState<'join' | 'profile'>('join')
  const [routerOpen, setRouterOpen] = useState(false)
  const [conceptsOpen, setConceptsOpen] = useState(false)

  // Panel states
  const [fabricActive, setFabricActive] = useState(false)
  const [foundryActive, setFoundryActive] = useState(false)
  const [joinActive, setJoinActive] = useState(false)
  const [answerVisible, setAnswerVisible] = useState(false)

  const [fabricStatus, setFabricStatus] = useState(t.semanticJoin.en.fabricWaiting)
  const [fabricQuery, setFabricQuery] = useState('')
  const [fabricNote, setFabricNote] = useState('')
  const [foundryStatus, setFoundryStatus] = useState(t.semanticJoin.en.foundryWaiting)
  const [foundryQuery, setFoundryQuery] = useState('')
  const [foundryNote, setFoundryNote] = useState('')
  const [fabricDone, setFabricDone] = useState(false)
  const [foundryDone, setFoundryDone] = useState(false)

  const [answerHtml, setAnswerHtml] = useState('')
  const [sourcesData, setSourcesData] = useState<RefMap>({})
  const [liveError, setLiveError] = useState('')

  const cancelRef = useRef(false)

  function fillQuery(idx: number) {
    setSelectedIdx(idx)
    setQueryValue(PRESETS[idx].q)
  }

  function resetPanels() {
    cancelRef.current = false
    setFabricActive(false)
    setFoundryActive(false)
    setJoinActive(false)
    setAnswerVisible(false)
    setFabricStatus(text.fabricWaiting)
    setFabricQuery('')
    setFabricNote('')
    setFoundryStatus(text.foundryWaiting)
    setFoundryQuery('')
    setFoundryNote('')
    setFabricDone(false)
    setFoundryDone(false)
    setAnswerHtml('')
    setSourcesData({})
    setLiveError('')
    setRouterOpen(false)
  }

  async function runMock(idx: number) {
    // Mock fallback - not used when LIVE_MODE=true
    // Minimal implementation to prevent TypeScript errors
    const s = PRESETS[idx]
    resetPanels()
    setRunning(true)

    await delay(300)
    if (cancelRef.current) { setRunning(false); return }

    setFabricActive(true)
    setFoundryActive(true)
    setFabricStatus('Searching...')
    setFoundryStatus('Searching...')

    await delay(600)
    if (cancelRef.current) { setRunning(false); return }

    setFabricQuery('🔍 Mock search query')
    setFoundryQuery('🔍 Mock search query')

    await delay(800)
    if (cancelRef.current) { setRunning(false); return }

    setFabricStatus('Mock data response')
    setFabricNote('📄 Mock data source')
    setFabricDone(true)

    await delay(400)
    if (cancelRef.current) { setRunning(false); return }

    setFoundryStatus('Mock policy response')
    setFoundryNote('📄 Mock policy source')
    setFoundryDone(true)
    setJoinActive(true)

    await delay(600)
    if (cancelRef.current) { setRunning(false); return }

    setAnswerHtml('Mock answer for: ' + s.q)
    setAnswerVisible(true)
    setRunning(false)
  }

  async function runLive() {
    resetPanels()
    setRunning(true)

    // animate panels immediately
    await delay(200)
    setFabricActive(true)
    setFoundryActive(true)
    setFabricStatus('Searching...')
    setFoundryStatus('Searching...')

    try {
      const res = await fetch('/api/semantic-join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryValue }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      const data = await res.json()

      const { answer, fabricRefs, foundryRefs, refMap, searchQueries } = data as {
        answer: string
        fabricRefs: { id: string; title: string }[]
        foundryRefs: { id: string; title: string }[]
        refMap: RefMap
        searchQueries: { text: string; target: string }[]
      }

      // Assign search queries: first query → Fabric (structured data), second → Foundry (policy docs)
      // Both queries use the same unified index, so we assign by order (matches activitySource order)
      setFabricQuery(searchQueries[0] ? `🔍 ${searchQueries[0].text}` : '')
      setFoundryQuery(searchQueries[1] ? `🔍 ${searchQueries[1].text}` : (searchQueries[0] ? `🔍 ${searchQueries[0].text}` : ''))

      if (fabricRefs.length > 0) {
        setFabricStatus(`Found ${fabricRefs.length} structured data source(s)`)
        setFabricNote(`📄 ${Array.from(new Set(fabricRefs.map((r) => r.title))).join(', ')} — Fabric OneLake → AI Search indexed`)
      } else {
        setFabricStatus('No structured data results.')
      }
      setFabricDone(true)

      if (foundryRefs.length > 0) {
        setFoundryStatus(`Found ${foundryRefs.length} policy document(s)`)
        setFoundryNote(`📄 ${Array.from(new Set(foundryRefs.map((r) => r.title))).join(', ')} — Fabric OneLake → AI Search indexed`)
      } else {
        setFoundryStatus('No policy document results.')
      }
      setFoundryDone(true)
      setJoinActive(true)

      await delay(400)
      setSourcesData(refMap)
      setAnswerHtml(formatAnswer(answer, refMap) || answer)
      setAnswerVisible(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setLiveError(msg)
      setFabricStatus('Error retrieving data.')
      setFoundryStatus('Error retrieving data.')
    } finally {
      setRunning(false)
    }
  }

  function runSearch() {
    if (!queryValue.trim()) return
    if (running) {
      cancelRef.current = true
      return
    }
    if (LIVE_MODE) {
      runLive()
    } else {
      if (selectedIdx !== null) {
        runMock(selectedIdx)
      } else {
        // find closest preset match
        const idx = PRESETS.findIndex((p) => p.q === queryValue)
        if (idx >= 0) runMock(idx)
        else runMock(0)
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') runSearch()
  }

  return (
    <div className="mx-auto max-w-[1100px] px-2 py-8 md:px-0">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium font-mono mb-4"
            style={{
              background: 'rgba(96,165,250,0.12)',
              borderColor: 'rgba(96,165,250,0.2)',
              color: 'var(--color-accent, #60a5fa)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--color-accent, #60a5fa)' }} />
            FABRIC + FOUNDRY IQ
          </div>
          <Link
            href="/architecture"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[11px] text-fg-subtle hover:text-fg-muted transition-all"
            title="View architecture diagram"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            Architecture
          </Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-fg-default mb-2">
          <span className="text-accent">{text.pageTitle}</span>
        </h1>
        <p className="text-fg-muted text-base">
          {text.pageSubtitle}{' '}
          <a href="https://www.kaggle.com/datasets/usdot/flight-delays" target="_blank" rel="noopener noreferrer" className="font-mono text-sm bg-bg-elevated px-2 py-0.5 rounded text-accent hover:underline">airline_flights</a>
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { number: '5,819,079', label: text.totalFlights },
          { number: '14', label: text.airlines },
          { number: '9.0', label: text.avgDelay },
          { number: '89,884', label: text.cancelled },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-bg-card border border-glass-border rounded-xl p-5 text-center"
          >
            <div className="text-2xl font-bold font-mono text-accent">{stat.number}</div>
            <div className="text-fg-muted text-sm mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="border-b border-stroke-divider mb-6">
        <div className="flex gap-1">
          {(['join', 'profile'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer',
                activeTab === tab
                  ? 'border-accent text-accent'
                  : 'border-transparent text-fg-muted hover:text-fg-default',
              ].join(' ')}
            >
              {tab === 'join' ? text.tabTry : `📊 ${text.tabDataProfile}`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Semantic JOIN tab ── */}
      {activeTab === 'join' && <>

      {/* Semantic JOIN demo section */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-fg-default mt-2 mb-1">{text.tryTitle}</h2>
        <p className="text-fg-muted text-sm mb-5">
          {text.trySubtitle}
        </p>

        <div className="space-y-4">
          {/* Preset buttons */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-fg-subtle leading-7">{text.tryLabel}</span>
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => fillQuery(idx)}
                className={[
                  'text-xs px-2.5 py-1.5 rounded border transition-colors duration-150',
                  selectedIdx === idx
                    ? 'bg-accent-subtle border-accent/40 text-accent'
                    : 'bg-bg-card border-glass-border text-fg-muted hover:bg-bg-elevated hover:text-fg-default',
                ].join(' ')}
              >
                {preset.label}
              </button>
            ))}
            <a
              href="/fabric_iq_flight_data_profile.html"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-fg-subtle hover:text-fg-muted transition-colors"
              style={{ fontSize: '11px' }}
            >
              {text.offlineLink}
            </a>
          </div>

          {/* Query bar */}
          <div className="flex gap-2">
              <input
                type="text"
                value={queryValue}
                onChange={(e) => setQueryValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled
                placeholder={text.inputPlaceholder}
                className="flex-1 px-3.5 py-2.5 rounded border border-glass-border bg-bg-canvas text-fg-default text-sm placeholder:text-fg-subtle transition-colors disabled:cursor-not-allowed"
                style={{ opacity: 0.85 }}
              />
            <button
              onClick={runSearch}
              disabled={!queryValue.trim()}
              className={[
                'px-4 py-2.5 rounded text-sm font-medium whitespace-nowrap transition-colors duration-150',
                running
                  ? 'bg-bg-elevated text-fg-muted border border-glass-border cursor-pointer'
                  : 'text-accent border-none cursor-pointer hover:opacity-80',
              ].join(' ')}
              style={!running ? { background: 'rgba(96,165,250,0.12)' } : {}}
            >
              {running ? text.cancelButton : text.searchButton}
            </button>
          </div>

          {/* Split panel */}
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)] gap-0 min-h-[220px]">
            {/* Fabric panel */}
            <div
              className={[
                'rounded-xl border p-3.5 transition-all duration-500 overflow-hidden',
                fabricActive
                  ? 'opacity-100 border-l-[3px] bg-bg-canvas'
                  : 'opacity-40 bg-bg-canvas border-glass-border',
              ].join(' ')}
              style={fabricActive ? { borderColor: 'rgba(52,211,153,0.4)', borderLeftColor: '#34d399' } : {}}
            >
              <div
                className="text-[10px] font-medium tracking-widest uppercase px-1.5 py-0.5 rounded inline-block mb-2 font-mono"
                style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}
              >
                {text.fabricLabel}
              </div>
              <div className="font-medium text-sm text-fg-default mb-0.5">{text.fabricTitle}</div>
              <div className="text-xs text-fg-muted mb-2.5">{text.fabricDesc}</div>
              <div
                className={[
                  'font-mono text-xs p-2 rounded min-h-[44px] bg-bg-subtle text-fg-muted transition-all duration-300 leading-relaxed',
                  fabricDone ? 'border-l-2' : '',
                ].join(' ')}
                style={fabricDone ? { borderLeftColor: '#34d399', color: 'var(--fg-default)' } : {}}
              >
                {fabricStatus}
              </div>
              {fabricQuery && (
                <div className="text-[10px] text-fg-subtle font-mono mt-1.5 pt-1.5 border-t border-stroke-divider break-all leading-snug whitespace-pre-wrap">
                  {fabricQuery}
                </div>
              )}
              {fabricNote && (
                <div className="text-[10px] font-mono mt-1 leading-snug" style={{ color: '#34d399' }}>
                  {fabricNote}
                </div>
              )}
            </div>

            {/* JOIN center column */}
            <div className="flex flex-col items-center justify-center text-fg-subtle text-[10px] font-mono gap-1 py-2 md:py-0">
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-500 border',
                  joinActive
                    ? 'join-pulse'
                    : '',
                ].join(' ')}
                style={joinActive
                  ? { background: 'rgba(251,146,60,0.15)', borderColor: 'rgba(251,146,60,0.4)', color: '#fb923c' }
                  : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: 'inherit' }
                }
              >
                +
              </div>
              <span className="text-center leading-tight">{text.joinLabel}</span>
            </div>

            {/* Foundry panel */}
            <div
              className={[
                'rounded-xl border p-3.5 transition-all duration-500 overflow-hidden',
                foundryActive
                  ? 'opacity-100 border-l-[3px] bg-bg-canvas'
                  : 'opacity-40 bg-bg-canvas border-glass-border',
              ].join(' ')}
              style={foundryActive ? { borderColor: 'rgba(167,139,250,0.4)', borderLeftColor: '#a78bfa' } : {}}
            >
              <div
                className="text-[10px] font-medium tracking-widest uppercase px-1.5 py-0.5 rounded inline-block mb-2 font-mono"
                style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}
              >
                {text.foundryLabel}
              </div>
              <div className="font-medium text-sm text-fg-default mb-0.5">{text.foundryTitle}</div>
              <div className="text-xs text-fg-muted mb-2.5">{text.foundryDesc}</div>
              <div
                className={[
                  'font-mono text-xs p-2 rounded min-h-[44px] bg-bg-subtle text-fg-muted transition-all duration-300 leading-relaxed',
                  foundryDone ? 'border-l-2' : '',
                ].join(' ')}
                style={foundryDone ? { borderLeftColor: '#a78bfa', color: 'var(--fg-default)' } : {}}
              >
                {foundryStatus}
              </div>
              {foundryQuery && (
                <div className="text-[10px] text-fg-subtle font-mono mt-1.5 pt-1.5 border-t border-stroke-divider break-all leading-snug whitespace-pre-wrap">
                  {foundryQuery}
                </div>
              )}
              {foundryNote && (
                <div className="text-[10px] font-mono mt-1 leading-snug" style={{ color: '#a78bfa' }}>
                  {foundryNote}
                </div>
              )}
            </div>
          </div>

          {/* Answer box */}
          {liveError && (
            <div className="rounded-xl border border-red-500/30 bg-bg-card px-4 py-3 text-sm text-red-400">
              Error: {liveError}
            </div>
          )}

          <div
            className={[
              'rounded-xl border border-glass-border bg-bg-canvas transition-all duration-500 overflow-hidden',
              answerVisible ? 'opacity-100 p-4' : 'opacity-0 max-h-0 p-0',
            ].join(' ')}
          >
            <div
              className="text-[10px] font-medium tracking-widest uppercase mb-1.5 font-mono"
              style={{ color: '#fb923c' }}
            >
              {text.answerTitle}
            </div>
            <div
              className="text-sm leading-relaxed text-fg-default"
              dangerouslySetInnerHTML={{ __html: answerHtml }}
            />

            {/* Sources list */}
            {Object.keys(sourcesData).length > 0 && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="text-[10px] font-mono font-medium text-fg-subtle uppercase tracking-widest mb-1.5">{text.sourcesTitle}</div>
                <div className="space-y-1">
                  {Object.values(sourcesData)
                    .sort((a, b) => a.seq - b.seq)
                    .map((entry) => (
                      <div key={entry.seq} className="flex items-center gap-2 text-[11px]">
                        <span
                          className="cite flex-shrink-0"
                          style={entry.type === 'fabric'
                            ? { background: 'rgba(52,211,153,0.2)', color: '#34d399' }
                            : { background: 'rgba(167,139,250,0.2)', color: '#a78bfa' }}
                        >
                          {entry.seq}
                        </span>
                        <span className="font-mono text-fg-muted truncate">{entry.title}</span>
                        <span className="text-fg-subtle flex-shrink-0">
                          ({entry.sourceLabel})
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* "How does this work?" toggle */}
            <button
              className="inline-flex items-center gap-1 text-[11px] mt-2.5 py-1 font-mono cursor-pointer hover:underline text-accent"
              onClick={() => setRouterOpen((v) => !v)}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6.5" />
                <path d="M8 7v4M8 5.5v0" />
              </svg>
              <span>{routerOpen ? text.hideExplanation : text.howItWorks}</span>
            </button>

            {/* Router panel */}
            {routerOpen && (
              <div className="mt-3 rounded-xl bg-bg-subtle p-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-fg-default mb-3">
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#fb923c' }} />
                  AI Search — the router behind Semantic JOIN
                </div>

                {/* SVG diagram — premium router flow */}
                <div className="my-4 rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.2)', padding: '24px 20px 20px' }}>
                  <svg width="100%" viewBox="0 0 700 400" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      {/* Per-color arrowhead markers */}
                      <marker id="a-gray" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M2 1L8 5L2 9" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </marker>
                      <marker id="a-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M2 1L8 5L2 9" fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </marker>
                      <marker id="a-purple" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M2 1L8 5L2 9" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </marker>
                      <marker id="a-orange" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M2 1L8 5L2 9" fill="none" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </marker>

                      {/* Glow filters */}
                      <filter id="gl-o" x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur stdDeviation="6" />
                      </filter>
                      <filter id="gl-g" x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur stdDeviation="5" />
                      </filter>
                      <filter id="gl-p" x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur stdDeviation="5" />
                      </filter>

                      {/* Background radial gradient */}
                      <radialGradient id="svgBg" cx="50%" cy="38%" r="55%">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.03" />
                        <stop offset="100%" stopColor="#000" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    {/* Subtle radial background */}
                    <rect width="700" height="400" fill="url(#svgBg)" rx="12" />

                    {/* ─── 1. Your Question ─── */}
                    <rect x="220" y="12" width="260" height="48" rx="12" fill="rgba(255,255,255,0.04)" stroke="#475569" strokeWidth="0.5" />
                    <text fill="#e2e8f0" fontFamily="'JetBrains Mono', monospace" fontSize="13" fontWeight="600" x="350" y="36" textAnchor="middle" dominantBaseline="central" letterSpacing="0.3">Your question</text>

                    {/* Arrow → KB with label pill */}
                    <line x1="350" y1="60" x2="350" y2="100" stroke="#64748b" strokeWidth="0.5" markerEnd="url(#a-gray)" />
                    <rect x="306" y="73" width="88" height="16" rx="8" fill="rgba(0,0,0,0.5)" stroke="#334155" strokeWidth="0.3" />
                    <text fill="#94a3b8" fontFamily="'JetBrains Mono', monospace" fontSize="8.5" fontWeight="500" x="350" y="83" textAnchor="middle" letterSpacing="0.5">POST /retrieve</text>

                    {/* ─── 2. KB Boundary ─── */}
                    <rect x="120" y="104" width="460" height="190" rx="18" fill="rgba(255,255,255,0.012)" stroke="#334155" strokeWidth="0.6" strokeDasharray="6 4" />
                    <text fill="#94a3b8" fontFamily="'JetBrains Mono', monospace" fontSize="10" fontWeight="500" x="155" y="122" letterSpacing="0.3">unified-airline-kb</text>
                    <text fill="#64748b" fontFamily="'JetBrains Mono', monospace" fontSize="9" x="280" y="122">(Knowledge Base)</text>

                    {/* ─── 3. AI Search Router ─── */}
                    {/* Glow layer */}
                    <rect x="250" y="136" width="200" height="48" rx="12" fill="#fb923c" opacity="0.08" filter="url(#gl-o)" />
                    {/* Box */}
                    <rect x="250" y="136" width="200" height="48" rx="12" fill="rgba(251,146,60,0.06)" stroke="#fb923c" strokeWidth="0.75" />
                    <text fill="#fb923c" fontFamily="'JetBrains Mono', monospace" fontSize="12.5" fontWeight="600" x="350" y="153" textAnchor="middle" dominantBaseline="central" letterSpacing="0.3">AI Search router</text>
                    <text fill="#94a3b8" fontFamily="'JetBrains Mono', monospace" fontSize="9" x="350" y="173" textAnchor="middle" dominantBaseline="central" letterSpacing="0.3">Planning + fan-out</text>

                    {/* ─── 4. Fan-out Arrows ─── */}
                    <line x1="290" y1="184" x2="215" y2="222" stroke="#34d399" strokeWidth="1.2" markerEnd="url(#a-green)" className="svg-dash-green" />
                    <line x1="410" y1="184" x2="485" y2="222" stroke="#a78bfa" strokeWidth="1.2" markerEnd="url(#a-purple)" className="svg-dash-purple" />

                    {/* Fan-out labels with pill backgrounds */}
                    <rect x="196" y="198" width="106" height="15" rx="7" fill="rgba(52,211,153,0.08)" />
                    <text fill="#34d399" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="500" x="249" y="208" textAnchor="middle" letterSpacing="0.3">Hybrid search</text>
                    <rect x="398" y="198" width="106" height="15" rx="7" fill="rgba(167,139,250,0.08)" />
                    <text fill="#a78bfa" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="500" x="451" y="208" textAnchor="middle" letterSpacing="0.3">Vector + keyword</text>

                    {/* ─── 5. KS-1 Fabric ─── */}
                    <rect x="146" y="226" width="136" height="48" rx="12" fill="#34d399" opacity="0.06" filter="url(#gl-g)" />
                    <rect x="146" y="226" width="136" height="48" rx="12" fill="rgba(52,211,153,0.04)" stroke="#34d399" strokeWidth="0.6" />
                    <text fill="#34d399" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="600" x="214" y="243" textAnchor="middle" dominantBaseline="central" letterSpacing="0.3">KS-1 Fabric</text>
                    <text fill="#94a3b8" fontFamily="'JetBrains Mono', monospace" fontSize="8.5" x="214" y="261" textAnchor="middle" dominantBaseline="central">indexedOneLake</text>

                    {/* ─── 6. KS-2 Foundry ─── */}
                    <rect x="418" y="226" width="136" height="48" rx="12" fill="#a78bfa" opacity="0.06" filter="url(#gl-p)" />
                    <rect x="418" y="226" width="136" height="48" rx="12" fill="rgba(167,139,250,0.04)" stroke="#a78bfa" strokeWidth="0.6" />
                    <text fill="#a78bfa" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="600" x="486" y="243" textAnchor="middle" dominantBaseline="central" letterSpacing="0.3">KS-2 Foundry</text>
                    <text fill="#94a3b8" fontFamily="'JetBrains Mono', monospace" fontSize="8.5" x="486" y="261" textAnchor="middle" dominantBaseline="central">searchIndex</text>

                    {/* ─── 7. Merge Paths ─── */}
                    <path d="M214 274 L214 304 L348 304" fill="none" stroke="#34d399" strokeWidth="0.6" markerEnd="url(#a-green)" />
                    <path d="M486 274 L486 304 L352 304" fill="none" stroke="#a78bfa" strokeWidth="0.6" markerEnd="url(#a-purple)" />

                    {/* Vertical connector to synthesis */}
                    <line x1="350" y1="305" x2="350" y2="325" stroke="#64748b" strokeWidth="0.4" markerEnd="url(#a-orange)" />

                    {/* ─── 8. LLM Synthesis ─── */}
                    <rect x="260" y="330" width="180" height="48" rx="12" fill="#fb923c" opacity="0.07" filter="url(#gl-o)" />
                    <rect x="260" y="330" width="180" height="48" rx="12" fill="rgba(251,146,60,0.05)" stroke="#fb923c" strokeWidth="0.75" />
                    <text fill="#fb923c" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="600" x="350" y="347" textAnchor="middle" dominantBaseline="central" letterSpacing="0.3">LLM synthesis</text>
                    <text fill="#94a3b8" fontFamily="'JetBrains Mono', monospace" fontSize="8.5" x="350" y="367" textAnchor="middle" dominantBaseline="central">Merge + cite sources</text>

                    {/* ─── Output indicator ─── */}
                    <line x1="350" y1="378" x2="350" y2="396" stroke="#64748b" strokeWidth="0.4" markerEnd="url(#a-gray)" />
                    <text fill="#64748b" fontFamily="'JetBrains Mono', monospace" fontSize="8" x="350" y="396" textAnchor="middle">↓ Cited answer</text>
                  </svg>
                </div>

                {/* Step rows */}
                <div className="space-y-2.5 mt-3">
                  {[
                    { n: 1, label: text.step1Title, desc: text.step1Desc },
                    { n: 2, label: text.step2Title, desc: text.step2Desc },
                    { n: 3, label: text.step3Title, desc: text.step3Desc },
                    { n: 4, label: text.step4Title, desc: text.step4Desc },
                  ].map((step) => (
                    <div key={step.n} className="flex gap-2.5 items-start pl-1">
                      <div
                        className="w-5 h-5 rounded-full text-[10px] font-medium flex items-center justify-center flex-shrink-0 border"
                        style={{ background: 'rgba(251,146,60,0.15)', color: '#fb923c', borderColor: 'rgba(251,146,60,0.3)' }}
                      >
                        {step.n}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-fg-default">{step.label}</div>
                        <div className="text-[11px] text-fg-muted mt-0.5 leading-relaxed">{step.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Data Silo Problem ── */}
                <div className="mt-4 rounded-xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="text-[11px] font-semibold text-fg-default mb-3 flex items-center gap-2">
                    <span style={{ color: '#fb923c' }}>⚠</span> The Data Silo Problem — and how Foundry IQ solves it
                  </div>
                  {/* Source icons */}
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[
                      { label: 'OneLake', sub: 'Fabric', color: '#34d399' },
                      { label: 'SharePoint', sub: 'M365', color: '#60a5fa' },
                      { label: 'Blob', sub: 'Azure', color: '#fbbf24' },
                      { label: 'Web', sub: 'Bing', color: '#94a3b8' },
                    ].map(({ label, sub, color }) => (
                      <div key={label} className="flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-center"
                        style={{ borderColor: `${color}33`, background: `${color}0d` }}>
                        <div className="text-[11px] font-semibold" style={{ color }}>{label}</div>
                        <div className="text-[10px] font-mono" style={{ color: 'var(--color-fg-subtle)' }}>{sub}</div>
                      </div>
                    ))}
                  </div>
                  {/* Arrow */}
                  <div className="flex flex-col items-center my-1.5 text-fg-subtle text-xs font-mono gap-0.5">
                    <div className="flex gap-6 text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>▼ ▼ ▼ ▼</div>
                  </div>
                  {/* KB box */}
                  <div className="rounded-lg border px-3 py-2 text-center" style={{ borderColor: 'rgba(251,146,60,0.3)', background: 'rgba(251,146,60,0.08)' }}>
                    <div className="text-[11px] font-semibold" style={{ color: '#fb923c' }}>Knowledge Base</div>
                    <div className="text-[10px] font-mono text-fg-muted mt-0.5">One API call · Multi-source · Cited answers</div>
                  </div>
                  <p className="text-[11px] text-fg-muted mt-2.5 leading-relaxed">
                    Traditional: separate pipeline per source. Foundry IQ: one KB connects them all — no extra code, no separate APIs.
                  </p>
                </div>

                {/* ── Key Concepts: KB & KS (collapsible) ── */}
                <div className="mt-3 rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <button
                    onClick={() => setConceptsOpen((o) => !o)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/[0.03] transition-colors"
                    style={{ background: 'rgba(0,0,0,0.15)' }}
                  >
                    <span className="text-[11px] font-semibold text-fg-default flex items-center gap-1.5">
                      {text.kc_title}
                    </span>
                    <span className="text-[10px] font-mono text-fg-subtle">{conceptsOpen ? text.kc_hide : text.kc_expand}</span>
                  </button>
                  {conceptsOpen && (
                    <div className="px-3 pb-3 pt-1 space-y-3" style={{ background: 'rgba(0,0,0,0.1)' }}>
                      {/* KB */}
                      <div>
                        <div className="text-[11px] font-semibold text-fg-default mb-1" style={{ color: '#fb923c' }}>
                          Knowledge Base (KB)
                        </div>
                        <p className="text-[11px] text-fg-muted leading-relaxed">
                          {text.kc_kbDesc}
                        </p>
                      </div>
                      {/* KS */}
                      <div>
                        <div className="text-[11px] font-semibold mb-1.5" style={{ color: '#60a5fa' }}>
                          Knowledge Source (KS)
                        </div>
                        <p className="text-[11px] text-fg-muted leading-relaxed mb-2">
                          {text.kc_ksDesc}
                        </p>
                        <div className="space-y-1">
                          {[
                            { type: 'indexedOneLake', desc: text.kc_ks_onelake, color: '#34d399' },
                            { type: 'searchIndex', desc: text.kc_ks_searchIndex, color: '#a78bfa' },
                            { type: 'indexedSharePoint', desc: text.kc_ks_sharepoint, color: '#60a5fa' },
                            { type: 'indexedBlobStorage', desc: text.kc_ks_blob, color: '#fbbf24' },
                            { type: 'web', desc: text.kc_ks_web, color: '#94a3b8' },
                            { type: 'remote SharePoint', desc: text.kc_ks_remotesp, color: '#94a3b8' },
                          ].map(({ type, desc, color }) => (
                            <div key={type} className="flex items-center gap-2">
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${color}1a`, color }}>{type}</span>
                              <span className="text-[10px] text-fg-muted">{desc}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-fg-muted mt-2 leading-relaxed">
                          {text.kc_multiKs}<br />
                          {text.kc_multiAgent}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <a
                          href="https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/what-is-foundry-iq"
                          target="_blank" rel="noopener noreferrer"
                          className="text-[10px] font-mono text-accent hover:underline"
                        >
                          📄 What is Foundry IQ? — Microsoft Learn →
                        </a>
                        <a
                          href="https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/foundry-iq-faq"
                          target="_blank" rel="noopener noreferrer"
                          className="text-[10px] font-mono text-accent hover:underline"
                        >
                          📄 Foundry IQ FAQ — Microsoft Learn →
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── In this demo ── */}
                <div className="mt-3 rounded-xl border px-3 py-3" style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="text-[11px] font-semibold text-fg-default mb-2 flex items-center gap-1.5">
                    <span style={{ color: '#60a5fa' }}>{text.kc_inThisDemo}</span>
                  </div>
                  <div className="font-mono text-[11px] leading-relaxed text-fg-muted">
                    <span style={{ color: '#fb923c', fontWeight: 500 }}>unified-airline-kb</span>
                    <span className="text-fg-subtle"> {text.kc_kbLabel}</span><br />
                    &nbsp;&nbsp;│<br />
                    &nbsp;&nbsp;├── <span style={{ color: '#34d399' }}>KS-1: unified-airline-source</span><br />
                    &nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── Type: <span style={{ color: '#34d399' }}>indexedOneLake</span><br />
                    &nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── Source: {text.kc_ksSource}<br />
                    &nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── Indexer: {text.kc_ksIndexer}<br />
                    &nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;└── {text.kc_ksDocs}<br />
                    &nbsp;&nbsp;│<br />
                    &nbsp;&nbsp;└── Model: <span style={{ color: '#fbbf24' }}>AI Model</span>
                    <span className="text-fg-subtle"> {text.kc_modelLabel}</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── {text.kc_oneQuestion}
                  </div>
                  <div className="mt-2.5 space-y-1">
                    <div className="text-[10px] text-fg-muted">{text.kc_whenSearch}</div>
                    {[
                      text.kc_step1,
                      text.kc_step2,
                      text.kc_step3,
                      text.kc_step4,
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-[10px] text-fg-muted">
                        <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-semibold" style={{ background: 'rgba(251,146,60,0.15)', color: '#fb923c', border: '0.5px solid rgba(251,146,60,0.3)' }}>{i + 1}</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Data lives everywhere section */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-fg-default mb-3">
          {text.dataLivesTitle}
        </h2>
        <div className="bg-bg-card border border-glass-border rounded-xl p-6">
          <p className="text-fg-muted text-sm mb-2.5 leading-relaxed">
            {text.dataLivesDesc}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href="https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/what-is-foundry-iq"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-accent hover:underline"
            >
              What is Foundry IQ? — Microsoft Learn →
            </a>
            <a
              href="https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/foundry-iq-unlocking-ubiquitous-knowledge-for-agents/4470812"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-accent hover:underline"
            >
              Foundry IQ Deep Dive — Tech Community →
            </a>
          </div>
        </div>
      </section>

      {/* One Question, Two Brains section */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-fg-default mb-3">{text.oneQuestionTitle}</h2>
        <div className="bg-bg-card border border-glass-border rounded-xl p-6">
          <div
            className="border-l-[3px] px-4 py-3 rounded-r-lg mb-4 text-sm font-medium text-fg-default"
            style={{
              background: 'linear-gradient(135deg, rgba(96,165,250,0.08), rgba(167,139,250,0.08))',
              borderLeftColor: 'var(--color-accent, #60a5fa)',
            }}
          >
            {text.oneQuestionQuote}
          </div>
          <p className="text-fg-muted text-sm leading-relaxed mb-2">
            {text.oneQuestionDesc1}
          </p>
          <p className="text-fg-muted text-sm leading-relaxed">
            {text.oneQuestionDesc2}
          </p>
        </div>

        {/* Join diagram */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-4 items-center mt-6">
          {/* Fabric source */}
          <div className="bg-bg-card border border-glass-border rounded-xl p-5">
            <div
              className="text-[10px] font-mono font-medium uppercase tracking-widest mb-2"
              style={{ color: '#34d399' }}
            >
              Fabric IQ — Structured
            </div>
            <div className="font-semibold text-sm text-fg-default mb-1">flights table (5.8M rows)</div>
            <div className="text-xs text-fg-muted mb-3">Delay counts, cancellation stats, route data</div>
            <div
              className="mt-3 pt-3 border-t border-glass-border font-mono text-sm"
              style={{ color: '#34d399' }}
            >
              → "2,566 flights delayed 2+ hrs at JFK"
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-1 text-xs font-mono text-fg-subtle">
            <div className="text-2xl" style={{ color: '#fb923c' }}>⚡</div>
            <div className="text-center leading-tight">Semantic<br />JOIN</div>
          </div>

          {/* Foundry source */}
          <div className="bg-bg-card border border-glass-border rounded-xl p-5">
            <div
              className="text-[10px] font-mono font-medium uppercase tracking-widest mb-2"
              style={{ color: '#a78bfa' }}
            >
              Foundry IQ — Unstructured
            </div>
            <div className="font-semibold text-sm text-fg-default mb-1">DOT Policy PDFs (4 docs)</div>
            <div className="text-xs text-fg-muted mb-3">Passenger rights, compensation rules, regulations</div>
            <div
              className="mt-3 pt-3 border-t border-glass-border font-mono text-sm"
              style={{ color: '#a78bfa' }}
            >
              → "Full refund for 3+ hr delays per DOT"
            </div>
          </div>
        </div>
      </section>

      </>} {/* end activeTab === 'join' */}

      {/* ── Data Profile tab ── */}
      {activeTab === 'profile' && (
        <div className="space-y-8">

          {/* Pipeline */}
          <section>
            <h2 className="text-lg font-semibold text-fg-default mb-3">{text.profile_pipelineTitle}</h2>
            <div className="bg-bg-card border border-glass-border rounded-xl p-5">
              <p className="text-fg-muted text-sm mb-4">
                {text.profile_pipelineDesc}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    step: '①',
                    title: text.profile_pipe1Title,
                    sub: text.profile_pipe1Sub,
                    desc: text.profile_pipe1Desc,
                    color: '#34d399',
                  },
                  {
                    step: '②',
                    title: text.profile_pipe2Title,
                    sub: text.profile_pipe2Sub,
                    desc: text.profile_pipe2Desc,
                    color: '#60a5fa',
                  },
                ].map(({ step, title, sub, desc, color }) => (
                  <div key={step} className="rounded-lg border border-glass-border p-4" style={{ background: `${color}0d` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl font-bold" style={{ color }}>{step}</span>
                      <div>
                        <div className="text-sm font-semibold text-fg-default">{title}</div>
                        <div className="text-[11px] font-mono text-fg-subtle">{sub}</div>
                      </div>
                    </div>
                    <p className="text-xs text-fg-muted">{desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-fg-subtle mt-3">
                {text.profile_pipeNote}
              </p>
              <div className="mt-3">
                <a
                  href="https://github.com/hyeonsangjeon/foundry-iq-demo-suite/blob/main/notebooks/fabric_iq_flight_data_profile.ipynb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                  style={{ fontSize: '12px' }}
                >
                  {text.profile_notebookLink}
                </a>
              </div>
            </div>
          </section>

          {/* JSON Files */}
          <section>
            <h2 className="text-lg font-semibold text-fg-default mb-3">
              {text.profile_jsonTitle} <span className="text-sm font-normal text-fg-subtle ml-1">({text.profile_jsonSubtag})</span>
            </h2>
            <div className="bg-bg-card border border-glass-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-glass-border">
                    {[text.profile_thFile, text.profile_thRecords, text.profile_thDesc].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-fg-subtle uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { file: 'airline_delay_stats.json', records: '14', desc: text.profile_json1Desc },
                    { file: 'top_airport_stats.json', records: '30', desc: text.profile_json2Desc },
                    { file: 'monthly_trend.json', records: '12', desc: text.profile_json3Desc },
                    { file: 'cancellation_reasons.json', records: '4', desc: text.profile_json4Desc },
                    { file: 'jfk_detailed_analysis.json', records: '9', desc: text.profile_json5Desc },
                  ].map((row, i) => (
                    <tr key={row.file} className={i % 2 === 1 ? 'bg-bg-elevated/40' : ''}>
                      <td className="px-4 py-3 font-mono text-xs text-accent">{row.file}</td>
                      <td className="px-4 py-3 font-mono text-xs text-fg-default text-center">{row.records}</td>
                      <td className="px-4 py-3 text-xs text-fg-muted">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* PDF Files */}
          <section>
            <h2 className="text-lg font-semibold text-fg-default mb-3">{text.profile_pdfTitle}</h2>
            <p className="text-sm text-fg-muted mb-3">
              {text.profile_pdfDesc}
            </p>

            {/* Source flexibility cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div
                className="rounded-xl border border-glass-border p-4"
                style={{
                  background: 'rgba(52,211,153,0.06)',
                  borderLeftWidth: '3px',
                  borderLeftColor: '#34d399',
                }}
              >
                <div className="text-sm font-semibold text-fg-default mb-1">{text.profile_inThisDemo}</div>
                <div className="text-xs text-fg-muted font-mono">Fabric OneLake → AI Search</div>
                <div className="text-xs text-fg-subtle font-mono mt-0.5">(Files/policies/*.pdf)</div>
              </div>
              <div
                className="rounded-xl border border-glass-border p-4"
                style={{
                  background: 'rgba(167,139,250,0.06)',
                  borderLeftWidth: '3px',
                  borderLeftColor: '#a78bfa',
                  opacity: 0.75,
                }}
              >
                <div className="text-sm font-semibold text-fg-default mb-1">{text.profile_alsoPossible}</div>
                <div className="text-xs text-fg-muted font-mono">SharePoint → AI Search</div>
                <div className="text-xs text-fg-subtle font-mono mt-0.5">(Phase 2 SP Connector demo)</div>
              </div>
            </div>

            <p className="text-sm text-fg-muted mb-3" style={{ fontStyle: 'italic' }}>
              {text.profile_samePdfs}
            </p>

            <p className="text-[11px] font-mono text-fg-subtle mb-3">
              {text.profile_processing}
            </p>

            <div className="bg-bg-card border border-glass-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-glass-border">
                    {[text.profile_thNum, text.profile_thDocument, text.profile_thDesc, text.profile_thSize, text.profile_thSource].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-fg-subtle uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      doc: text.profile_pdf1Title,
                      desc: text.profile_pdf1Desc,
                      size: '419 KB',
                      linkLabel: 'US DOT →',
                      href: 'https://www.transportation.gov/sites/dot.gov/files/2024-12/ANPRM%20Airline%20Passenger%20Rights%20(2105-AF20).pdf',
                    },
                    {
                      doc: text.profile_pdf2Title,
                      desc: text.profile_pdf2Desc,
                      size: '352 KB',
                      linkLabel: 'US DOT →',
                      href: 'https://www.transportation.gov/airconsumer/fly-rights',
                    },
                    {
                      doc: text.profile_pdf3Title,
                      desc: text.profile_pdf3Desc,
                      size: '751 KB',
                      linkLabel: 'Congress.gov →',
                      href: 'https://www.congress.gov/crs-product/R43078',
                    },
                    {
                      doc: text.profile_pdf4Title,
                      desc: text.profile_pdf4Desc,
                      size: '178 KB',
                      linkLabel: 'US DOT →',
                      href: 'https://www.transportation.gov/individuals/aviation-consumer-protection/bumping-oversales',
                    },
                  ].map((row, i) => (
                    <tr key={row.doc} className={i % 2 === 1 ? 'bg-bg-elevated/40' : ''}>
                      <td className="px-4 py-3 font-mono text-xs text-fg-subtle">{i + 1}</td>
                      <td className="px-4 py-3 text-xs text-fg-default">{row.doc}</td>
                      <td className="px-4 py-3 text-fg-muted" style={{ fontSize: '11px', maxWidth: '300px' }}>{row.desc}</td>
                      <td className="px-4 py-3 font-mono text-xs text-fg-muted whitespace-nowrap">{row.size}</td>
                      <td className="px-4 py-3">
                        <a
                          href={row.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline whitespace-nowrap"
                          style={{ fontSize: '12px' }}
                        >
                          {row.linkLabel}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* What is this data */}
          <section>
            <h2 className="text-lg font-semibold text-fg-default mb-3">{text.profile_whatIsTitle}</h2>
            <div className="bg-bg-card border border-glass-border rounded-xl p-5 space-y-3 text-sm text-fg-muted leading-relaxed">
              <p>{text.profile_whatIs1}</p>
              <p>
                {text.profile_whatIs2}{' '}
                <a href="https://www.kaggle.com/datasets/usdot/flight-delays" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{text.profile_whatIs2Link}</a>.
              </p>
              <p>{text.profile_whatIs3}</p>
            </div>
          </section>

          {/* Key Schema */}
          <section>
            <h2 className="text-lg font-semibold text-fg-default mb-3">{text.profile_schemaTitle}</h2>
            <div className="bg-bg-card border border-glass-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-glass-border">
                    {[text.profile_thColumn, text.profile_thType, text.profile_thExample, text.profile_thDesc].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-fg-subtle uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { col: 'AIRLINE', type: 'str', ex: 'AA', desc: text.profile_col1Desc },
                    { col: 'ORIGIN_AIRPORT', type: 'str', ex: 'JFK', desc: text.profile_col2Desc },
                    { col: 'DESTINATION_AIRPORT', type: 'str', ex: 'LAX', desc: text.profile_col3Desc },
                    { col: 'DEPARTURE_DELAY', type: 'int', ex: '45', desc: text.profile_col4Desc },
                    { col: 'ARRIVAL_DELAY', type: 'int', ex: '42', desc: text.profile_col5Desc },
                    { col: 'CANCELLED', type: 'int', ex: '0 / 1', desc: text.profile_col6Desc },
                    { col: 'CANCELLATION_REASON', type: 'str', ex: 'B', desc: text.profile_col7Desc },
                    { col: 'DISTANCE', type: 'int', ex: '2475', desc: text.profile_col8Desc },
                  ].map((row, i) => (
                    <tr key={row.col} className={i % 2 === 1 ? 'bg-bg-elevated/40' : ''}>
                      <td className="px-4 py-3 font-mono text-xs text-accent font-semibold">{row.col}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: '#fbbf24' }}>{row.type}</td>
                      <td className="px-4 py-3 font-mono text-xs text-fg-muted">{row.ex}</td>
                      <td className="px-4 py-3 text-xs text-fg-muted">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* EDA Visualizations */}
          <section>
            <h2 className="text-lg font-semibold text-fg-default mb-3">{text.profile_edaTitle}</h2>
            <div className="mb-4 space-y-2">
              <p className="text-sm text-fg-muted">{text.profile_edaDesc1}</p>
              <p className="text-sm text-fg-muted">
                {text.profile_edaDesc2.split('unified-airline-kb')[0]}
                <span className="font-mono text-fg-default">unified-airline-kb</span>
                {text.profile_edaDesc2.split('unified-airline-kb')[1]}
              </p>
              <a
                href="https://github.com/hyeonsangjeon/foundry-iq-demo-suite/blob/main/notebooks/fabric_iq_flight_data_profile.ipynb"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline inline-block"
                style={{ fontSize: '12px' }}
              >
                {text.profile_edaNotebook}
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: text.profile_chart1,
                  src: '/images/eda/chart_avg_delay_by_airline.jpeg',
                  source: 'airline_delay_stats.json (14 airlines)',
                },
                {
                  title: text.profile_chart2,
                  src: '/images/eda/chart_delay_by_hour.jpeg',
                  source: 'hourly aggregation from flights table',
                },
                {
                  title: text.profile_chart3,
                  src: '/images/eda/chart_cancellation_reasons.jpeg',
                  source: 'cancellation_reasons.json (4 reasons)',
                },
                {
                  title: text.profile_chart4,
                  src: '/images/eda/chart_cancellation_rate.jpeg',
                  source: 'airline_delay_stats.json (14 airlines)',
                },
              ].map((chart) => (
                <div
                  key={chart.title}
                  className="bg-bg-card border border-glass-border rounded-xl p-4"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span>📊</span>
                    <span className="text-sm font-semibold text-fg-default">{chart.title}</span>
                  </div>
                  <p className="text-[11px] font-mono text-fg-subtle mb-3">Source: {chart.source}</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={chart.src}
                    alt={chart.title}
                    className="w-full rounded-lg"
                  />
                </div>
              ))}
            </div>
          </section>

        </div>
      )}

    </div>
  )
}
