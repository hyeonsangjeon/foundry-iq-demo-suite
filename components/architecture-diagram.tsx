'use client'

/**
 * Architecture diagram — converted from knowledge_retrieval_studio.html SVG
 * Colour convention:
 *   Purple (#EEEDFE / #534AB7) → Foundry IQ
 *   Red    (#FCEBEB / #A32D2D) → Fabric IQ
 *   Blue   (#E6F1FB / #185FA5) → Azure / M365
 *   Gray   (#F1EFE8 / #5F5E5A) → Our app
 *
 * In dark mode every fill is toned down for glass-morphism readability.
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
      <rect x={40} y={12} width={14} height={14} rx={3} fill="#EEEDFE" stroke="#534AB7" strokeWidth={0.5} />
      <text x={60} y={22} dominantBaseline="central" className="fill-[#534AB7] dark:fill-[#a9a0f0] text-xs">
        Foundry IQ
      </text>
      <rect x={170} y={12} width={14} height={14} rx={3} fill="#FCEBEB" stroke="#A32D2D" strokeWidth={0.5} />
      <text x={190} y={22} dominantBaseline="central" className="fill-[#A32D2D] dark:fill-[#ef8888] text-xs">
        Fabric IQ
      </text>
      <rect x={290} y={12} width={14} height={14} rx={3} fill="#E6F1FB" stroke="#185FA5" strokeWidth={0.5} />
      <text x={310} y={22} dominantBaseline="central" className="fill-[#185FA5] dark:fill-[#7db8e8] text-xs">
        Azure / M365
      </text>
      <rect x={420} y={12} width={14} height={14} rx={3} fill="#F1EFE8" stroke="#5F5E5A" strokeWidth={0.5} />
      <text x={440} y={22} dominantBaseline="central" className="fill-[#5F5E5A] dark:fill-[#b4b2a9] text-xs">
        Our app
      </text>

      {/* ── App title ──────────────────────────────────────────────── */}
      <g>
        <rect x={40} y={44} width={600} height={40} rx={8} fill="#F1EFE8" stroke="#5F5E5A" strokeWidth={0.5} className="dark:fill-white/5 dark:stroke-white/10" />
        <text x={340} y={64} textAnchor="middle" dominantBaseline="central" className="fill-[#2C2C2A] dark:fill-white/90 text-sm font-medium">
          Knowledge Retrieval Studio
        </text>
      </g>

      {/* ── Landing page ───────────────────────────────────────────── */}
      <g>
        <rect x={40} y={100} width={600} height={44} rx={8} fill="#F1EFE8" stroke="#5F5E5A" strokeWidth={0.5} className="dark:fill-white/5 dark:stroke-white/10" />
        <text x={340} y={122} textAnchor="middle" dominantBaseline="central" className="fill-[#2C2C2A] dark:fill-white/80 text-sm font-medium">
          Landing page — 3 demo cards
        </text>
      </g>

      {/* ── Arrows → Phase cards ───────────────────────────────────── */}
      {[150, 340, 530].map((x) => (
        <line key={x} x1={x} y1={144} x2={x} y2={180} stroke="#888780" strokeWidth={1.5} markerEnd="url(#arr-marker)" className="dark:stroke-white/30" />
      ))}

      {/* ── Phase cards ────────────────────────────────────────────── */}
      {[
        { x: 60, label: 'Phase 1', sub: 'Agentic Retrieval' },
        { x: 250, label: 'Phase 2', sub: 'SharePoint indexing' },
        { x: 440, label: 'Phase 3', sub: 'Fabric + Foundry JOIN' },
      ].map(({ x, label, sub }) => (
        <g key={label}>
          <rect x={x} y={180} width={180} height={56} rx={8} fill="#F1EFE8" stroke="#5F5E5A" strokeWidth={0.5} className="dark:fill-white/5 dark:stroke-white/10" />
          <text x={x + 90} y={200} textAnchor="middle" dominantBaseline="central" className="fill-[#2C2C2A] dark:fill-white/90 text-sm font-medium">
            {label}
          </text>
          <text x={x + 90} y={220} textAnchor="middle" dominantBaseline="central" className="fill-[#5F5E5A] dark:fill-white/50 text-xs">
            {sub}
          </text>
          {/* LIVE badge */}
          <rect x={x + 8} y={173} width={40} height={16} rx={8} fill="#EAF3DE" stroke="#3B6D11" strokeWidth={0.5} />
          <text x={x + 28} y={183} textAnchor="middle" dominantBaseline="central" style={{ fill: '#27500A', fontSize: 10, fontWeight: 500 }}>
            LIVE
          </text>
        </g>
      ))}

      {/* ── Arrows → detail rows ───────────────────────────────────── */}
      {[150, 340, 530].map((x) => (
        <line key={`d-${x}`} x1={x} y1={236} x2={x} y2={274} stroke="#888780" strokeWidth={1.5} markerEnd="url(#arr-marker)" className="dark:stroke-white/30" />
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
      <path d="M485 394 L485 416 L510 416 L510 426" fill="none" stroke="#888780" strokeWidth={1.5} markerEnd="url(#arr-marker)" className="dark:stroke-white/30" />
      <path d="M575 394 L575 416 L550 416 L550 426" fill="none" stroke="#888780" strokeWidth={1.5} markerEnd="url(#arr-marker)" className="dark:stroke-white/30" />
      <FoundryBox x={440} y={426} w={180} h={56} title="LLM synthesis" sub="Data + docs merged" />

      {/* ── Divider: Data origins ──────────────────────────────────── */}
      <line x1={40} y1={516} x2={640} y2={516} stroke="#B4B2A9" strokeWidth={0.5} strokeDasharray="4 4" className="dark:stroke-white/15" />
      <text x={340} y={536} textAnchor="middle" className="fill-[#888780] dark:fill-white/40 text-xs">
        Data origins
      </text>

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
        <path key={i} d={d} fill="none" stroke="#534AB7" strokeWidth={1.5} strokeDasharray="6 3" markerEnd="url(#arr-marker)" opacity={0.7} className="dark:stroke-[#a9a0f0]" />
      ))}

      {/* ── Divider: Infrastructure ────────────────────────────────── */}
      <line x1={40} y1={710} x2={640} y2={710} stroke="#B4B2A9" strokeWidth={0.5} strokeDasharray="4 4" className="dark:stroke-white/15" />
      <text x={340} y={730} textAnchor="middle" className="fill-[#888780] dark:fill-white/40 text-xs">
        Infrastructure
      </text>

      {/* ── Infrastructure boxes ───────────────────────────────────── */}
      <AppBox x={40} y={745} w={290} h={36} title="Next.js 14 + Vercel" />
      <FoundryBox x={340} y={745} w={300} h={36} title="AI Search + Azure OpenAI + Embedding" />
      <FabricBox x={40} y={795} w={290} h={36} title="Fabric Trial + Spark + OneLake" />
      <AzureBox x={340} y={795} w={300} h={36} title="Azure Blob + SharePoint + Entra" />
    </svg>
  )
}

/* ─── Primitive helpers ─────────────────────────────────────────────────────── */

function Arr({ x, y1, y2 }: { x: number; y1: number; y2: number }) {
  return <line x1={x} y1={y1} x2={x} y2={y2} stroke="#888780" strokeWidth={1.5} markerEnd="url(#arr-marker)" className="dark:stroke-white/30" />
}

interface BoxProps {
  x: number
  y: number
  w: number
  h: number
  title: string
  sub?: string
}

function FoundryBox({ x, y, w, h, title, sub }: BoxProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="#EEEDFE" stroke="#534AB7" strokeWidth={0.5} className="dark:fill-[#534AB7]/15 dark:stroke-[#534AB7]/40" />
      <text x={x + w / 2} y={sub ? y + h / 2 - 8 : y + h / 2} textAnchor="middle" dominantBaseline="central" className="fill-[#3C3489] dark:fill-[#c5bffa] text-sm font-medium">
        {title}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 10} textAnchor="middle" dominantBaseline="central" className="fill-[#534AB7] dark:fill-[#a9a0f0] text-xs">
          {sub}
        </text>
      )}
    </g>
  )
}

function FabricBox({ x, y, w, h, title, sub }: BoxProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="#FCEBEB" stroke="#A32D2D" strokeWidth={0.5} className="dark:fill-[#A32D2D]/15 dark:stroke-[#A32D2D]/40" />
      <text x={x + w / 2} y={sub ? y + h / 2 - 8 : y + h / 2} textAnchor="middle" dominantBaseline="central" className="fill-[#791F1F] dark:fill-[#f0a0a0] text-sm font-medium">
        {title}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 10} textAnchor="middle" dominantBaseline="central" className="fill-[#A32D2D] dark:fill-[#ef8888] text-xs">
          {sub}
        </text>
      )}
    </g>
  )
}

function AzureBox({ x, y, w, h, title, sub }: BoxProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="#E6F1FB" stroke="#185FA5" strokeWidth={0.5} className="dark:fill-[#185FA5]/15 dark:stroke-[#185FA5]/40" />
      <text x={x + w / 2} y={sub ? y + h / 2 - 8 : y + h / 2} textAnchor="middle" dominantBaseline="central" className="fill-[#0C447C] dark:fill-[#a0cef0] text-sm font-medium">
        {title}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 10} textAnchor="middle" dominantBaseline="central" className="fill-[#185FA5] dark:fill-[#7db8e8] text-xs">
          {sub}
        </text>
      )}
    </g>
  )
}

function AppBox({ x, y, w, h, title, sub }: BoxProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="#F1EFE8" stroke="#5F5E5A" strokeWidth={0.5} className="dark:fill-white/5 dark:stroke-white/10" />
      <text x={x + w / 2} y={sub ? y + h / 2 - 8 : y + h / 2} textAnchor="middle" dominantBaseline="central" className="fill-[#2C2C2A] dark:fill-white/90 text-sm font-medium">
        {title}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 10} textAnchor="middle" dominantBaseline="central" className="fill-[#5F5E5A] dark:fill-white/50 text-xs">
          {sub}
        </text>
      )}
    </g>
  )
}
