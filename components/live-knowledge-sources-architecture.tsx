'use client'

export function LiveKnowledgeSourcesArchitecture() {
  return (
    <svg
      width="100%"
      viewBox="0 0 900 700"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto max-w-[900px]"
      style={{ fontFamily: 'var(--font-sans, system-ui)' }}
      role="img"
      aria-labelledby="live-ks-architecture-title live-ks-architecture-desc"
    >
      <title id="live-ks-architecture-title">
        MCP Server and Fabric Ontology Knowledge Source runtime architecture
      </title>
      <desc id="live-ks-architecture-desc">
        A client calls one Foundry IQ Knowledge Base. The retrieval planner routes each question to
        a Microsoft Learn MCP Server Knowledge Source, a Fabric Ontology Knowledge Source, or both,
        then returns a grounded answer with activity, references, and source data.
      </desc>

      <defs>
        <marker
          id="live-ks-arrow"
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

      <Legend x={110} width={130} label="Application" color="amber" />
      <Legend x={255} width={130} label="Foundry IQ" color="purple" />
      <Legend x={400} width={140} label="MCP Server" color="blue" />
      <Legend x={555} width={150} label="Fabric Ontology" color="rose" />

      <Box
        x={330}
        y={58}
        w={240}
        h={52}
        title="Demo Suite / Agent"
        sub="One business question"
        color="amber"
      />
      <Arrow x1={450} y1={110} x2={450} y2={140} />

      <Box
        x={290}
        y={140}
        w={320}
        h={62}
        title="Foundry IQ Knowledge Base"
        sub="One /retrieve endpoint + answer synthesis"
        color="purple"
      />
      <Arrow x1={450} y1={202} x2={450} y2={232} />

      <Box
        x={290}
        y={232}
        w={320}
        h={62}
        title="Agentic retrieval planner"
        sub="Selects one live source or routes to both"
        color="purple"
      />

      <path
        d="M450 294 L450 318 L230 318 L230 342"
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth={1.5}
        markerEnd="url(#live-ks-arrow)"
      />
      <path
        d="M450 294 L450 318 L670 318 L670 342"
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth={1.5}
        markerEnd="url(#live-ks-arrow)"
      />

      <Box
        x={70}
        y={342}
        w={320}
        h={72}
        title="MCP Server Knowledge Source"
        sub="microsoft_docs_search | Streamable HTTP"
        color="blue"
      />
      <Box
        x={510}
        y={342}
        w={320}
        h={72}
        title="Fabric Ontology Knowledge Source"
        sub="Ontology + Data Agent | query-time auth"
        color="rose"
      />

      <line
        x1={390}
        y1={430}
        x2={510}
        y2={430}
        stroke="rgba(134,239,172,0.65)"
        strokeWidth={1.5}
        strokeDasharray="6 4"
      />
      <text
        x={450}
        y={446}
        textAnchor="middle"
        fill="rgba(134,239,172,0.85)"
        style={{ fontSize: 11, fontWeight: 500 }}
      >
        combined KB routing
      </text>

      <Arrow x1={230} y1={414} x2={230} y2={468} />
      <Arrow x1={670} y1={414} x2={670} y2={468} />

      <Box
        x={70}
        y={468}
        w={320}
        h={64}
        title="Microsoft Learn MCP"
        sub="Live official docs | no ingestion pipeline"
        color="blue"
      />
      <Box
        x={510}
        y={468}
        w={320}
        h={64}
        title="Fabric IQ Ontology"
        sub="Business entities, measures, and relationships"
        color="rose"
      />

      <path
        d="M230 532 L230 562 L370 562 L370 590"
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth={1.5}
        markerEnd="url(#live-ks-arrow)"
      />
      <path
        d="M670 532 L670 562 L530 562 L530 590"
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth={1.5}
        markerEnd="url(#live-ks-arrow)"
      />

      <Box
        x={240}
        y={590}
        w={420}
        h={72}
        title="Grounded response"
        sub="answer + activity + references + sourceData"
        color="purple"
      />

      <text
        x={450}
        y={688}
        textAnchor="middle"
        fill="rgba(255,255,255,0.45)"
        style={{ fontSize: 11 }}
      >
        Deployment modes: mcp-only | byo-fabric | full
      </text>
    </svg>
  )
}

type BoxColor = 'amber' | 'purple' | 'blue' | 'rose'

const colors: Record<BoxColor, { fill: string; stroke: string; text: string; sub: string }> = {
  amber: {
    fill: 'rgba(251,191,36,0.08)',
    stroke: 'rgba(251,191,36,0.5)',
    text: 'rgba(255,255,255,0.92)',
    sub: 'rgba(255,255,255,0.55)',
  },
  purple: {
    fill: 'rgba(124,110,237,0.12)',
    stroke: 'rgba(155,138,251,0.65)',
    text: '#c5bffa',
    sub: 'rgba(197,191,250,0.72)',
  },
  blue: {
    fill: 'rgba(59,130,246,0.1)',
    stroke: 'rgba(96,165,250,0.65)',
    text: '#93c5fd',
    sub: 'rgba(147,197,253,0.72)',
  },
  rose: {
    fill: 'rgba(224,82,82,0.1)',
    stroke: 'rgba(240,112,112,0.65)',
    text: '#f7a8a8',
    sub: 'rgba(247,168,168,0.72)',
  },
}

function Box({
  x,
  y,
  w,
  h,
  title,
  sub,
  color,
}: {
  x: number
  y: number
  w: number
  h: number
  title: string
  sub: string
  color: BoxColor
}) {
  const palette = colors[color]

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        fill={palette.fill}
        stroke={palette.stroke}
        strokeWidth={1.2}
      />
      <text
        x={x + w / 2}
        y={y + h / 2 - 9}
        textAnchor="middle"
        dominantBaseline="central"
        fill={palette.text}
        style={{ fontSize: 14, fontWeight: 600 }}
      >
        {title}
      </text>
      <text
        x={x + w / 2}
        y={y + h / 2 + 12}
        textAnchor="middle"
        dominantBaseline="central"
        fill={palette.sub}
        style={{ fontSize: 12 }}
      >
        {sub}
      </text>
    </g>
  )
}

function Legend({
  x,
  width,
  label,
  color,
}: {
  x: number
  width: number
  label: string
  color: BoxColor
}) {
  const palette = colors[color]

  return (
    <g>
      <rect
        x={x}
        y={8}
        width={width}
        height={26}
        rx={13}
        fill={palette.fill}
        stroke={palette.stroke}
        strokeWidth={1.2}
      />
      <text
        x={x + width / 2}
        y={21}
        textAnchor="middle"
        dominantBaseline="central"
        fill={palette.text}
        style={{ fontSize: 12, fontWeight: 600 }}
      >
        {label}
      </text>
    </g>
  )
}

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="rgba(255,255,255,0.4)"
      strokeWidth={1.5}
      markerEnd="url(#live-ks-arrow)"
    />
  )
}
