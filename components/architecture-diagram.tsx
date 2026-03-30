'use client'

/**
 * Architecture diagram — dark-first glass morphism
 * Color coding via borders + subtle tinted fills:
 *   Purple → Foundry IQ
 *   Rose   → Fabric IQ
 *   Blue   → Azure / M365
 *   Amber  → Application
 */
export function ArchitectureDiagram() {
  return (
    <svg
      width="100%"
      viewBox="0 0 680 840"
      xmlns="http://www.w3.org/2000/svg"
      className="max-w-[680px] mx-auto"
      style={{ fontFamily: 'var(--font-sans, system-ui)' }}
    >
      <defs>
        <marker
          id="arr-marker"
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
      {/* Pill badges — centered row */}
      <g>
        <rect x={50} y={6} width={110} height={26} rx={13} fill="rgba(124,110,237,0.2)" stroke="rgba(155,138,251,0.8)" strokeWidth={1.2} />
        <text x={105} y={19} textAnchor="middle" dominantBaseline="central" fill="#c5bffa" style={{ fontSize: 13, fontWeight: 600 }}>
          Foundry IQ
        </text>
        <rect x={175} y={6} width={100} height={26} rx={13} fill="rgba(224,82,82,0.15)" stroke="rgba(240,112,112,0.8)" strokeWidth={1.2} />
        <text x={225} y={19} textAnchor="middle" dominantBaseline="central" fill="#f7a8a8" style={{ fontSize: 13, fontWeight: 600 }}>
          Fabric IQ
        </text>
        <rect x={290} y={6} width={120} height={26} rx={13} fill="rgba(59,130,246,0.15)" stroke="rgba(96,165,250,0.8)" strokeWidth={1.2} />
        <text x={350} y={19} textAnchor="middle" dominantBaseline="central" fill="#93c5fd" style={{ fontSize: 13, fontWeight: 600 }}>
          Azure / M365
        </text>
        <rect x={425} y={6} width={115} height={26} rx={13} fill="rgba(251,191,36,0.1)" stroke="rgba(251,191,36,0.5)" strokeWidth={1.2} />
        <text x={482} y={19} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.8)" style={{ fontSize: 13, fontWeight: 600 }}>
          Application
        </text>
      </g>

      {/* ── App title ──────────────────────────────────────────────── */}
      <g>
        <rect x={40} y={44} width={600} height={40} rx={8} fill="rgba(255,255,255,0.04)" stroke="rgba(251,191,36,0.35)" strokeWidth={1} />
        <text x={340} y={64} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.9)" style={{ fontSize: 14, fontWeight: 500 }}>
          Knowledge Retrieval Studio
        </text>
      </g>

      {/* ── Landing page ─── */}
      <g>
        <rect x={40} y={100} width={600} height={44} rx={8} fill="rgba(255,255,255,0.04)" stroke="rgba(251,191,36,0.35)" strokeWidth={1} />
        <text x={340} y={122} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.85)" style={{ fontSize: 14, fontWeight: 500 }}>
          Landing page — 3 demo cards
        </text>
      </g>

      {/* ── Arrows → Phase cards ───────────────────────────────────── */}
      {[150, 340, 530].map((x) => (
        <line key={x} x1={x} y1={144} x2={x} y2={180} stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} markerEnd="url(#arr-marker)" />
      ))}

      {/* ── Phase cards ────────────────────────────────────────────── */}
      {[
        { x: 60, label: 'Phase 1', sub: 'Agentic Retrieval' },
        { x: 250, label: 'Phase 2', sub: 'SharePoint indexing' },
        { x: 440, label: 'Phase 3', sub: 'Fabric + Foundry JOIN' },
      ].map(({ x, label, sub }) => (
        <g key={label}>
          <rect x={x} y={180} width={180} height={56} rx={8} fill="rgba(255,255,255,0.04)" stroke="rgba(251,191,36,0.35)" strokeWidth={1} />
          <text x={x + 90} y={200} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.92)" style={{ fontSize: 14, fontWeight: 500 }}>
            {label}
          </text>
          <text x={x + 90} y={220} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.5)" style={{ fontSize: 12 }}>
            {sub}
          </text>
          <rect x={x + 8} y={173} width={40} height={16} rx={8} fill="rgba(74,222,128,0.15)" stroke="rgba(74,222,128,0.6)" strokeWidth={0.8} />
          <text x={x + 28} y={183} textAnchor="middle" dominantBaseline="central" fill="#4ade80" style={{ fontSize: 10, fontWeight: 600 }}>
            LIVE
          </text>
        </g>
      ))}

      {/* ── Arrows → detail rows ───────────────────────────────────── */}
      {[150, 340, 530].map((x) => (
        <line key={`d-${x}`} x1={x} y1={236} x2={x} y2={274} stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} markerEnd="url(#arr-marker)" />
      ))}

      {/* ── PHASE 1 detail ─────────────────────────────────────────── */}
      <AppBox x={60} y={274} w={180} h={44} title="KB selector" sub="7 industry KBs" />
      <Arr x={150} y1={318} y2={350} />
      <FoundryBox x={60} y={350} w={180} h={44} title="POST /retrieve" sub="Foundry IQ KB API" />
      <Arr x={150} y1={394} y2={426} />
      <AppBox x={60} y={426} w={180} h={56} title="Answer + trace" sub="Citation, 4-stage viz" />

      {/* ── PHASE 2 detail ─────────────────────────────────────────── */}
      <AppBox x={250} y={274} w={180} h={44} title="SP demo hub" sub="Simulated / Live mode" />
      <Arr x={340} y1={318} y2={350} />
      <FoundryBox x={250} y={350} w={180} h={44} title="Indexing pipeline" sub="Chunk → embed → index" />
      <Arr x={340} y1={394} y2={426} />
      <FoundryBox x={250} y={426} w={180} h={56} title="KB query" sub="Same /retrieve API" />

      {/* ── PHASE 3 detail ─────────────────────────────────────────── */}
      <FoundryBox x={440} y={274} w={180} h={44} title="Unified KB" sub="Multi-source fan-out" />
      <Arr x={530} y1={318} y2={350} />
      <FoundryBox x={445} y={350} w={80} h={44} title="KS: PDF" sub="Policies" />
      <FoundryBox x={535} y={350} w={80} h={44} title="KS: JSON" sub="Stats" />
      {/* fan-in arrows */}
      <path d="M485 394 L485 416 L510 416 L510 426" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} markerEnd="url(#arr-marker)" />
      <path d="M575 394 L575 416 L550 416 L550 426" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} markerEnd="url(#arr-marker)" />
      <FoundryBox x={440} y={426} w={180} h={56} title="LLM synthesis" sub="Data + docs merged" />

      {/* ── Divider: Data origins ──────────────────────────────────── */}
      <line x1={40} y1={516} x2={640} y2={516} stroke="rgba(255,255,255,0.12)" strokeWidth={0.5} strokeDasharray="4 4" />
      <text x={340} y={536} textAnchor="middle" fill="rgba(255,255,255,0.4)" style={{ fontSize: 12 }}>Data origins</text>

      {/* ── Data origin boxes ──────────────────────────────────────── */}
      <AzureBox x={60} y={552} w={180} h={56} title="Azure Blob Storage" sub="Hotels, Finance, NASA PDFs" />
      <Arr x={150} y1={608} y2={636} />
      <FoundryBox x={60} y={636} w={180} h={44} title="AI Search indexes" sub="7 industry indexes" />

      <AzureBox x={250} y={552} w={180} h={56} title="SharePoint Online" sub="DOT airline 4 PDFs" />
      <Arr x={340} y1={608} y2={636} />
      <FoundryBox x={250} y={636} w={180} h={44} title="AI Search index" sub="SP indexer pipeline" />

      <FabricBox x={440} y={552} w={180} h={56} title="Fabric Lakehouse" sub="5.8M flights + 4 PDFs" />
      <Arr x={530} y1={608} y2={636} />
      <FoundryBox x={440} y={636} w={180} h={44} title="AI Search index" sub="OneLake indexer" />

      {/* ── Connecting dashed arrows (data origin → phase detail) ──── */}
      {[
        'M150 636 L42 636 L42 372 L58 372',
        'M250 658 L238 658 L238 372 L248 372',
        'M440 658 L434 658 L434 372 L443 372',
        'M620 658 L634 658 L634 372 L617 372',
      ].map((d, i) => (
        <path key={i} d={d} fill="none" stroke="rgba(155,138,251,0.6)" strokeWidth={1.5} strokeDasharray="6 3" markerEnd="url(#arr-marker)" />
      ))}

      {/* ── Divider: Infrastructure ────────────────────────────────── */}
      <line x1={40} y1={710} x2={640} y2={710} stroke="rgba(255,255,255,0.12)" strokeWidth={0.5} strokeDasharray="4 4" />
      <text x={340} y={730} textAnchor="middle" fill="rgba(255,255,255,0.4)" style={{ fontSize: 12 }}>Infrastructure</text>

      {/* ── Infrastructure boxes ───────────────────────────────────── */}
      <FoundryBox x={40} y={745} w={290} h={36} title="AI Search + Azure OpenAI + Embedding" />
      <AzureBox x={340} y={745} w={300} h={36} title="SharePoint + Entra + Azure Blob" />
      <FabricBox x={40} y={795} w={290} h={36} title="Fabric + Spark + OneLake" />
      <AppBox x={340} y={795} w={300} h={36} title="Application" />
    </svg>
  )
}

/* ─── Primitive helpers ─────────────────────────────────────────────────────── */

function Arr({ x, y1, y2 }: { x: number; y1: number; y2: number }) {
  return <line x1={x} y1={y1} x2={x} y2={y2} stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} markerEnd="url(#arr-marker)" />
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

function AppBox({ x, y, w, h, title, sub }: BoxProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="rgba(255,255,255,0.04)" stroke="rgba(251,191,36,0.35)" strokeWidth={1} />
      <text x={x + w / 2} y={sub ? y + h / 2 - 8 : y + h / 2} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.9)" style={{ fontSize: 14, fontWeight: 500 }}>{title}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 10} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.5)" style={{ fontSize: 12 }}>{sub}</text>}
    </g>
  )
}
