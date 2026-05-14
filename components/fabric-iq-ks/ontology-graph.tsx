'use client'

import { useEffect, useRef, useState } from 'react'
import {
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceLink,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'
import { drag as d3drag } from 'd3-drag'
import { select } from 'd3-selection'

export type OntologyNode = {
  id: string
  type: 'entity' | 'metric'
  color: string
  count: number | null
  schema: Array<{ name: string; type: string; example: string | number }>
}

export type OntologyLink = {
  source: string
  target: string
  label: string
}

type GraphNode = OntologyNode & SimulationNodeDatum

type GraphLink = SimulationLinkDatum<GraphNode> & {
  label: string
}

type OntologyGraphProps = {
  nodes: OntologyNode[]
  links: OntologyLink[]
  selectedId: string | null
  hoveredId: string | null
  onNodeSelect: (id: string | null) => void
  onNodeHover: (id: string | null) => void
}

// Tailwind palette HEX fallbacks — globals.css has no --color-emerald-500 tokens
const colorMap: Record<string, string> = {
  emerald: '#10b981',
  cyan:    '#06b6d4',
  violet:  '#8b5cf6',
  amber:   '#f59e0b',
  rose:    '#f43f5e',
  orange:  '#f97316',
}

const DESKTOP_WIDTH = 700
const DESKTOP_HEIGHT = 600

// Mobile uses a 400x600 viewBox with hand-tuned fixed positions so the
// 6-node graph reads cleanly at 360-414px without the d3-force simulation
// collapsing everything into the center. Coordinates are in viewBox units;
// percentages from the spec converted: x = pct * 400, y = pct * 600.
const MOBILE_WIDTH = 400
const MOBILE_HEIGHT = 600
const MOBILE_POSITIONS: Record<string, { x: number; y: number }> = {
  Compensation: { x: 200, y: 60 },   // 50/10
  Delay:        { x: 200, y: 180 },  // 50/30
  Airline:      { x: 320, y: 270 },  // 80/45
  Aircraft:     { x: 340, y: 420 },  // 85/70
  Flight:       { x: 200, y: 360 },  // 50/60
  Airport:      { x: 80,  y: 420 },  // 20/70
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function isConnected(nodeId: string, focusId: string, links: GraphLink[]): boolean {
  return links.some((l) => {
    const src = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source
    const tgt = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target
    return (src === focusId && tgt === nodeId) || (tgt === focusId && src === nodeId)
  })
}

function getNodeOpacity(node: GraphNode, hoveredId: string | null, selectedId: string | null, links: GraphLink[]): number {
  const focus = hoveredId || selectedId
  if (!focus) return 1
  if (node.id === focus) return 1
  if (isConnected(node.id, focus, links)) return 1
  return 0.3
}

function getEdgeOpacity(link: GraphLink, hoveredId: string | null, selectedId: string | null): number {
  const focus = hoveredId || selectedId
  if (!focus) return 0.6
  const src = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source
  const tgt = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target
  if (src === focus || tgt === focus) return 1
  return 0.15
}

export function OntologyGraph({
  nodes: initialNodes,
  links: initialLinks,
  selectedId,
  hoveredId,
  onNodeSelect,
  onNodeHover,
}: OntologyGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const simRef = useRef<ReturnType<typeof forceSimulation> | null>(null)
  const nodesRef = useRef<GraphNode[]>(initialNodes.map((n) => ({ ...n })))
  const linksRef = useRef<GraphLink[]>(initialLinks.map((l) => ({ ...l, label: l.label })))

  const onNodeSelectRef = useRef(onNodeSelect)
  const onNodeHoverRef = useRef(onNodeHover)
  useEffect(() => {
    onNodeSelectRef.current = onNodeSelect
    onNodeHoverRef.current = onNodeHover
  })

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Build (or rebuild on viewport-class change) the SVG. Mobile and desktop
  // are two distinct paths because at <768px the d3-force simulation can't
  // resolve a clean layout for 6 entities in ~360px of width — it collapses
  // them on top of each other. Mobile path therefore pre-pins positions and
  // skips the simulation entirely.
  useEffect(() => {
    if (!svgRef.current) return

    const svg = select(svgRef.current)
    svg.selectAll('*').remove()

    // Reset any previously-pinned positions so a viewport-class flip starts
    // from a clean slate (mobile→desktop must release fx/fy; desktop→mobile
    // must release prior simulation-driven x/y so MOBILE_POSITIONS wins).
    nodesRef.current.forEach((n) => {
      n.fx = null
      n.fy = null
      n.x = undefined
      n.y = undefined
      n.vx = undefined
      n.vy = undefined
    })
    // Reset link source/target back to id strings — d3-force resolves them
    // to node refs in-place during init, so a viewport flip would otherwise
    // carry stale refs from the prior path.
    linksRef.current.forEach((l, idx) => {
      const original = initialLinks[idx]
      l.source = original.source
      l.target = original.target
    })

    // Stop any prior simulation before rebuilding.
    simRef.current?.stop()
    simRef.current = null

    const edgeGroup = svg.append('g').attr('class', 'edges')
    const nodeGroup = svg.append('g').attr('class', 'nodes')

    // ── Build edges (line + optional label) ─────────────────────────────
    const edges = edgeGroup
      .selectAll<SVGGElement, GraphLink>('.edge-group')
      .data(linksRef.current)
      .enter()
      .append('g')
      .attr('class', 'edge-group')
      .attr('opacity', 0.6)

    edges.append('line').attr('stroke', '#94a3b8').attr('stroke-width', 1.5)

    // Edge labels render only on desktop. On mobile they're omitted entirely
    // (per spec) — the OntologyEntityPanel surfaces relationships textually
    // when a node is tapped instead.
    if (!isMobile) {
      edges
        .append('text')
        .text((d) => d.label as string)
        .attr('text-anchor', 'middle')
        .attr('fill', 'currentColor')
        .attr('font-size', '16px')
        .attr('pointer-events', 'none')
        // Halo: stroke painted under fill so labels stay legible when crossing edge lines
        .style('paint-order', 'stroke')
        .style('stroke', 'hsl(var(--color-bg-card))')
        .style('stroke-width', '4px')
        .style('stroke-linecap', 'round')
        .style('stroke-linejoin', 'round')
    }

    // ── Build node groups ───────────────────────────────────────────────
    const nodeGroups = nodeGroup
      .selectAll<SVGGElement, GraphNode>('.node-group')
      .data(nodesRef.current)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer')
      .on('mouseenter', (_, d) => { onNodeHoverRef.current(d.id) })
      .on('mouseleave', () => { onNodeHoverRef.current(null) })
      .on('click', (event, d) => {
        event.stopPropagation()
        onNodeSelectRef.current(d.id)
      })

    const circleR = isMobile ? 32 : 36
    const labelDy = isMobile ? -42 : -44
    const subDy = isMobile ? 52 : 56
    const labelFont = isMobile ? '16px' : '18px'
    const labelWeight = isMobile ? '700' : '600'
    const subFont = isMobile ? '12px' : '14px'
    // On mobile we use an opaque dark halo so labels read even if they
    // accidentally overlap circles or edge lines. On desktop the bg-card
    // halo blends naturally with the surrounding card surface.
    const haloStroke = isMobile ? 'rgba(0,0,0,0.95)' : 'hsl(var(--color-bg-card))'
    const haloWidth = '4px'

    nodeGroups
      .append('circle')
      .attr('r', circleR)
      .attr('fill', (d) => colorMap[d.color] ?? '#6366f1')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 3)

    nodeGroups
      .append('text')
      .text((d) => d.id)
      .attr('text-anchor', 'middle')
      .attr('dy', labelDy)
      .attr('font-size', labelFont)
      .attr('font-weight', labelWeight)
      .attr('fill', 'currentColor')
      .attr('pointer-events', 'none')
      .style('paint-order', 'stroke')
      .style('stroke', haloStroke)
      .style('stroke-width', haloWidth)
      .style('stroke-linecap', 'round')
      .style('stroke-linejoin', 'round')

    nodeGroups
      .append('text')
      .text((d) => (d.count !== null ? formatCount(d.count) : ''))
      .attr('text-anchor', 'middle')
      .attr('dy', subDy)
      .attr('font-size', subFont)
      .attr('fill', '#94a3b8')
      .attr('pointer-events', 'none')

    // Deselect on SVG background click
    svg.on('click', () => { onNodeSelectRef.current(null) })

    if (isMobile) {
      // Pin every node to its hand-tuned position. Resolve link source/target
      // string refs to the actual node objects so edge x1/y1/x2/y2 reads work.
      const nodeById = new Map<string, GraphNode>()
      nodesRef.current.forEach((n) => {
        const p = MOBILE_POSITIONS[n.id]
        if (p) {
          n.x = p.x
          n.y = p.y
          n.fx = p.x
          n.fy = p.y
        }
        nodeById.set(n.id, n)
      })
      linksRef.current.forEach((l) => {
        if (typeof l.source === 'string') {
          const ref = nodeById.get(l.source)
          if (ref) l.source = ref
        }
        if (typeof l.target === 'string') {
          const ref = nodeById.get(l.target)
          if (ref) l.target = ref
        }
      })

      // Apply positions imperatively — no simulation, no drag.
      nodeGroups.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
      edges
        .select('line')
        .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
        .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
        .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
        .attr('y2', (d) => (d.target as GraphNode).y ?? 0)
      // No drag binding on mobile — taps select via the click handler above.
      return () => {
        // Cleanup of pinned positions handled at next effect entry.
      }
    }

    // ── Desktop path: full d3-force simulation with drag ────────────────
    const simulation = forceSimulation<GraphNode>(nodesRef.current)
      .force(
        'link',
        forceLink<GraphNode, GraphLink>(linksRef.current)
          .id((d) => d.id)
          .distance(140)
      )
      .force('charge', forceManyBody<GraphNode>().strength(-300))
      .force('center', forceCenter(DESKTOP_WIDTH / 2, DESKTOP_HEIGHT / 2))
      .force('collide', forceCollide<GraphNode>(50))
      .alphaDecay(0.04)

    simRef.current = simulation

    const drag = d3drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      })
      .on('drag', (event, d) => {
        d.fx = event.x
        d.fy = event.y
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      })

    nodeGroups.call(drag)

    simulation.on('tick', () => {
      edges
        .select('line')
        .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
        .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
        .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
        .attr('y2', (d) => (d.target as GraphNode).y ?? 0)

      edges
        .select('text')
        .attr('x', (d) => (((d.source as GraphNode).x ?? 0) + ((d.target as GraphNode).x ?? 0)) / 2)
        .attr('y', (d) => (((d.source as GraphNode).y ?? 0) + ((d.target as GraphNode).y ?? 0)) / 2)

      nodeGroups.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })

    return () => { simulation.stop() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile])

  // Update opacity + selected ring when hover/selected changes
  useEffect(() => {
    if (!svgRef.current) return
    const svg = select(svgRef.current)

    svg
      .selectAll<SVGGElement, GraphNode>('.node-group')
      .attr('opacity', (d) => getNodeOpacity(d, hoveredId, selectedId, linksRef.current))

    svg
      .selectAll<SVGGElement, GraphLink>('.edge-group')
      .attr('opacity', (d) => getEdgeOpacity(d, hoveredId, selectedId))

    svg
      .selectAll<SVGCircleElement, GraphNode>('.node-group circle')
      .attr('stroke', (d) => (d.id === selectedId ? 'white' : 'transparent'))
      .attr('stroke-width', (d) => (d.id === selectedId ? 3 : 0))
  }, [hoveredId, selectedId])

  const viewBoxW = isMobile ? MOBILE_WIDTH : DESKTOP_WIDTH
  const viewBoxH = isMobile ? MOBILE_HEIGHT : DESKTOP_HEIGHT

  return (
    <svg
      ref={svgRef}
      width="100%"
      // Desktop: explicit 600px height (matches the original layout). Mobile:
      // omit height so the SVG sizes itself from the viewBox aspect ratio +
      // the parent's full width — w-full alone suffices, h matches naturally.
      {...(isMobile ? {} : { height: '600' })}
      viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
      preserveAspectRatio="xMidYMid meet"
      className={
        isMobile
          ? 'w-full h-auto rounded-2xl bg-card border border-stroke-divider text-fg-default'
          : 'rounded-2xl bg-card border border-stroke-divider text-fg-default'
      }
    />
  )
}
