'use client'

/**
 * Architecture diagram V2 — Phase 4 TO-BE
 *
 * v1 (today, file indexing) vs v2 (coming, native Ontology KS) side-by-side.
 * Same design system as architecture-diagram.tsx (dark-first glass morphism).
 *
 * Color coding:
 *   Purple → Foundry IQ
 *   Rose   → Fabric IQ (emphasized in v2)
 *   Blue   → Azure / M365
 *   Amber  → Application
 */
export function ArchitectureDiagramV2() {
  return (
    <svg
      width="100%"
      viewBox="0 0 800 840"
      xmlns="http://www.w3.org/2000/svg"
      className="max-w-[800px] mx-auto"
      style={{ fontFamily: 'var(--font-sans, system-ui)' }}
      role="img"
      aria-labelledby="arch-v2-title arch-v2-desc"
    >
      <title id="arch-v2-title">Phase 4 architecture — v1 vs v2 side-by-side comparison</title>
      <desc id="arch-v2-desc">
        Two-column diagram comparing today&apos;s file-indexing pipeline (v1, LIVE) on the left
        with the upcoming native Fabric IQ Knowledge Source integration (v2, PREVIEW) on the right.
        v2 removes Spark SQL aggregation, JSON snapshots, and the OneLake indexer in favor of
        a direct Ontology binding via Fabric Data Agent for real-time natural-language to SQL.
      </desc>
      <defs>
        <marker
          id="arr-marker-v2"
          viewBox="0 0 10 10"
          refX={8}
          refY={5}
          markerWidth={6}
          markerHeight={6}
          orient="auto-start-reverse"
        >
          <path
            d="M2 1L8 5L2 9"
            fill="none"
            stroke="context-stroke"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>

      {/* ── Legend ─────────────────────────────────────────────────── */}
      <g>
        <rect x={110} y={6} width={110} height={26} rx={13} fill="rgba(124,110,237,0.2)" stroke="rgba(155,138,251,0.8)" strokeWidth={1.2} />
        <text x={165} y={19} textAnchor="middle" dominantBaseline="central" fill="#c5bffa" style={{ fontSize: 13, fontWeight: 600 }}>
          Foundry IQ
        </text>
        <rect x={235} y={6} width={100} height={26} rx={13} fill="rgba(224,82,82,0.15)" stroke="rgba(240,112,112,0.8)" strokeWidth={1.2} />
        <text x={285} y={19} textAnchor="middle" dominantBaseline="central" fill="#f7a8a8" style={{ fontSize: 13, fontWeight: 600 }}>
          Fabric IQ
        </text>
        <rect x={350} y={6} width={120} height={26} rx={13} fill="rgba(59,130,246,0.15)" stroke="rgba(96,165,250,0.8)" strokeWidth={1.2} />
        <text x={410} y={19} textAnchor="middle" dominantBaseline="central" fill="#93c5fd" style={{ fontSize: 13, fontWeight: 600 }}>
          Azure / M365
        </text>
        <rect x={485} y={6} width={115} height={26} rx={13} fill="rgba(251,191,36,0.1)" stroke="rgba(251,191,36,0.5)" strokeWidth={1.2} />
        <text x={542} y={19} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.8)" style={{ fontSize: 13, fontWeight: 600 }}>
          Application
        </text>
      </g>

      {/* ── Title bar ──────────────────────────────────────────────── */}
      <g>
        <rect x={40} y={50} width={720} height={40} rx={8} fill="rgba(255,255,255,0.04)" stroke="rgba(251,191,36,0.35)" strokeWidth={1} />
        <text x={400} y={70} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.9)" style={{ fontSize: 15, fontWeight: 600 }}>
          Phase 3 — Fabric + Foundry Integration Evolution
        </text>
      </g>

      {/* ── Column headers ─────────────────────────────────────────── */}
      {/* v1 Today */}
      <g>
        <rect x={40} y={100} width={350} height={40} rx={8} fill="rgba(255,255,255,0.04)" stroke="rgba(251,191,36,0.35)" strokeWidth={1} />
        <text x={215} y={120} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.85)" style={{ fontSize: 14, fontWeight: 500 }}>
          v1 — Today (file indexing)
        </text>
        <rect x={50} y={108} width={40} height={16} rx={8} fill="rgba(74,222,128,0.15)" stroke="rgba(74,222,128,0.6)" strokeWidth={0.8} />
        <text x={70} y={118} textAnchor="middle" dominantBaseline="central" fill="#4ade80" style={{ fontSize: 10, fontWeight: 600 }}>
          LIVE
        </text>
      </g>

      {/* v2 Coming */}
      <g>
        <rect x={410} y={100} width={350} height={40} rx={8} fill="rgba(255,255,255,0.04)" stroke="rgba(240,112,112,0.5)" strokeWidth={1.5} />
        <text x={585} y={120} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.9)" style={{ fontSize: 14, fontWeight: 500 }}>
          v2 — Coming (native Ontology)
        </text>
        <rect x={420} y={108} width={64} height={16} rx={8} fill="rgba(240,112,112,0.15)" stroke="rgba(240,112,112,0.6)" strokeWidth={0.8} />
        <text x={452} y={118} textAnchor="middle" dominantBaseline="central" fill="#f7a8a8" style={{ fontSize: 10, fontWeight: 600 }}>
          PREVIEW
        </text>
      </g>

      {/* Big evolution arrow between columns */}
      <line x1={390} y1={120} x2={410} y2={120} stroke="rgba(240,112,112,0.6)" strokeWidth={3} markerEnd="url(#arr-marker-v2)" />

      {/* ── v1 Main architecture (left) ───────────────────────────── */}
      <FoundryBox x={80} y={160} w={270} h={44} title="Unified KB" sub="Multi-source fan-out" />
      <Arr x={215} y1={204} y2={230} />

      <FoundryBox x={80} y={230} w={120} h={44} title="KS: PDF" sub="Policies" />
      <FoundryBox x={230} y={230} w={120} h={44} title="KS: JSON" sub="Stats (pre-agg)" />

      {/* Fan-in arrows */}
      <path d="M140 274 L140 300 L200 300 L200 320" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} markerEnd="url(#arr-marker-v2)" />
      <path d="M290 274 L290 300 L230 300 L230 320" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} markerEnd="url(#arr-marker-v2)" />

      <FoundryBox x={80} y={320} w={270} h={56} title="LLM synthesis" sub="Data + docs merged" />

      {/* ── v2 Main architecture (right) ⭐ ────────────────────────── */}
      <FoundryBox x={440} y={160} w={270} h={44} title="Unified KB" sub="+ Fabric IQ KS (native)" />
      <Arr x={575} y1={204} y2={230} />

      <FoundryBox x={440} y={230} w={120} h={44} title="KS: PDF" sub="Policies" />
      <FabricBox x={590} y={230} w={130} h={44} title="KS: Fabric IQ ⭐" sub="Ontology native" />

      {/* Fan-in arrows */}
      <path d="M500 274 L500 300 L560 300 L560 320" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} markerEnd="url(#arr-marker-v2)" />
      <path d="M655 274 L655 300 L600 300 L600 320" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} markerEnd="url(#arr-marker-v2)" />

      <FoundryBox x={440} y={320} w={270} h={56} title="LLM synthesis" sub="Ontology + docs merged" />

      {/* ── Data origins divider ───────────────────────────────────── */}
      <line x1={40} y1={410} x2={760} y2={410} stroke="rgba(255,255,255,0.12)" strokeWidth={0.5} strokeDasharray="4 4" />
      <text x={400} y={430} textAnchor="middle" fill="rgba(255,255,255,0.4)" style={{ fontSize: 12 }}>
        Data origins
      </text>

      {/* ── v1 Data origins (left, long pipeline) ─────────────────── */}
      <AzureBox x={80} y={450} w={270} h={44} title="SharePoint Online" sub="DOT airline PDFs" />
      <Arr x={215} y1={494} y2={510} />
      <FoundryBox x={80} y={510} w={270} h={36} title="AI Search index" sub="SP indexer pipeline" />

      <FabricBox x={80} y={560} w={270} h={44} title="Fabric Lakehouse" sub="5.8M flights" />
      <Arr x={215} y1={604} y2={615} />
      <AzureBox x={80} y={615} w={270} h={32} title="Spark SQL aggregation" />
      <Arr x={215} y1={647} y2={658} />
      <AzureBox x={80} y={658} w={270} h={32} title="JSON snapshot (5 files)" />
      <Arr x={215} y1={690} y2={701} />
      <FoundryBox x={80} y={701} w={270} h={32} title="OneLake indexer" />

      {/* ── v2 Data origins (right, simplified + green badge) ─────── */}
      <AzureBox x={440} y={450} w={270} h={44} title="SharePoint Online" sub="DOT airline PDFs" />
      <Arr x={575} y1={494} y2={510} />
      <FoundryBox x={440} y={510} w={270} h={36} title="AI Search index" sub="SP indexer pipeline" />

      <FabricBox x={440} y={560} w={270} h={56} title="Fabric IQ Ontology" sub="Business semantics + relationships" />
      <Arr x={575} y1={616} y2={650} />
      <FabricBox x={440} y={650} w={270} h={44} title="Fabric Data Agent" sub="Real-time NL → SQL" />

      <g>
        <rect x={440} y={710} width={270} height={30} rx={15} fill="rgba(74,222,128,0.1)" stroke="rgba(74,222,128,0.4)" strokeWidth={1} strokeDasharray="4 3" />
        <text x={575} y={725} textAnchor="middle" dominantBaseline="central" fill="#86efac" style={{ fontSize: 12, fontWeight: 500 }}>
          No aggregation · No indexer · No snapshot
        </text>
      </g>

      {/* ── Diff summary ───────────────────────────────────────────── */}
      <line x1={40} y1={760} x2={760} y2={760} stroke="rgba(255,255,255,0.12)" strokeWidth={0.5} strokeDasharray="4 4" />
      <text x={400} y={780} textAnchor="middle" fill="rgba(255,255,255,0.4)" style={{ fontSize: 12 }}>
        What changes in v2
      </text>

      <g>
        <rect x={40} y={790} width={720} height={40} rx={8} fill="rgba(255,255,255,0.03)" stroke="rgba(240,112,112,0.3)" strokeWidth={1} />
        <text x={60} y={805} fill="rgba(255,255,255,0.75)" style={{ fontSize: 11 }}>
          ❌ Removed: Spark SQL aggregation · JSON snapshots · OneLake Indexer · AI Search index (structured)
        </text>
        <text x={60} y={822} fill="rgba(134,239,172,0.9)" style={{ fontSize: 11 }}>
          ✅ Added: Native Fabric IQ KS type · Real-time NL→SQL via Fabric Data Agent · Direct Ontology binding
        </text>
      </g>
    </svg>
  )
}

/* ─── Primitive helpers (mirrored from architecture-diagram.tsx) ─────────── */

function Arr({ x, y1, y2 }: { x: number; y1: number; y2: number }) {
  return <line x1={x} y1={y1} x2={x} y2={y2} stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} markerEnd="url(#arr-marker-v2)" />
}

interface BoxProps { x: number; y: number; w: number; h: number; title: string; sub?: string }

function FoundryBox({ x, y, w, h, title, sub }: BoxProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="rgba(124,110,237,0.12)" stroke="rgba(155,138,251,0.6)" strokeWidth={1} />
      <text x={x + w / 2} y={sub ? y + h / 2 - 8 : y + h / 2} textAnchor="middle" dominantBaseline="central" fill="#c5bffa" style={{ fontSize: 14, fontWeight: 500 }}>{title}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 10} textAnchor="middle" dominantBaseline="central" fill="rgba(155,138,251,0.75)" style={{ fontSize: 12 }}>{sub}</text>}
    </g>
  )
}

function FabricBox({ x, y, w, h, title, sub }: BoxProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="rgba(224,82,82,0.1)" stroke="rgba(240,112,112,0.6)" strokeWidth={1} />
      <text x={x + w / 2} y={sub ? y + h / 2 - 8 : y + h / 2} textAnchor="middle" dominantBaseline="central" fill="#f7a8a8" style={{ fontSize: 14, fontWeight: 500 }}>{title}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 10} textAnchor="middle" dominantBaseline="central" fill="rgba(240,112,112,0.7)" style={{ fontSize: 12 }}>{sub}</text>}
    </g>
  )
}

function AzureBox({ x, y, w, h, title, sub }: BoxProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="rgba(59,130,246,0.1)" stroke="rgba(96,165,250,0.6)" strokeWidth={1} />
      <text x={x + w / 2} y={sub ? y + h / 2 - 8 : y + h / 2} textAnchor="middle" dominantBaseline="central" fill="#93c5fd" style={{ fontSize: 14, fontWeight: 500 }}>{title}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 10} textAnchor="middle" dominantBaseline="central" fill="rgba(96,165,250,0.7)" style={{ fontSize: 12 }}>{sub}</text>}
    </g>
  )
}
