'use client'

import { useEffect, useRef } from 'react'
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

  const WIDTH = 700
  const HEIGHT = 600

  // Initial D3 setup — runs once after mount
  useEffect(() => {
    if (!svgRef.current) return

    const svg = select(svgRef.current)
    svg.selectAll('*').remove()

    const edgeGroup = svg.append('g').attr('class', 'edges')
    const nodeGroup = svg.append('g').attr('class', 'nodes')

    const simulation = forceSimulation<GraphNode>(nodesRef.current)
      .force(
        'link',
        forceLink<GraphNode, GraphLink>(linksRef.current)
          .id((d) => d.id)
          .distance(140)
      )
      .force('charge', forceManyBody<GraphNode>().strength(-300))
      .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
      .force('collide', forceCollide<GraphNode>(50))
      .alphaDecay(0.04)

    simRef.current = simulation

    // Edges
    const edges = edgeGroup
      .selectAll<SVGGElement, GraphLink>('.edge-group')
      .data(linksRef.current)
      .enter()
      .append('g')
      .attr('class', 'edge-group')
      .attr('opacity', 0.6)

    edges.append('line').attr('stroke', '#94a3b8').attr('stroke-width', 1.5)

    edges
      .append('text')
      .text((d) => d.label as string)
      .attr('text-anchor', 'middle')
      .attr('fill', 'currentColor')
      .attr('font-size', '16px')
      .attr('pointer-events', 'none')
      // Halo: stroke painted under fill so labels stay legible when crossing edge lines
      // (Tailwind/PostCSS don't transform SVG style attrs, so we set them inline here.)
      .style('paint-order', 'stroke')
      .style('stroke', 'hsl(var(--color-bg-card))')
      .style('stroke-width', '4px')
      .style('stroke-linecap', 'round')
      .style('stroke-linejoin', 'round')

    // Drag
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

    // Nodes
    const nodeGroups = nodeGroup
      .selectAll<SVGGElement, GraphNode>('.node-group')
      .data(nodesRef.current)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer')
      .call(drag)
      .on('mouseenter', (_, d) => { onNodeHoverRef.current(d.id) })
      .on('mouseleave', () => { onNodeHoverRef.current(null) })
      .on('click', (event, d) => {
        event.stopPropagation()
        onNodeSelectRef.current(d.id)
      })

    nodeGroups
      .append('circle')
      .attr('r', 36)
      .attr('fill', (d) => colorMap[d.color] ?? '#6366f1')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 3)

    // Label above circle
    nodeGroups
      .append('text')
      .text((d) => d.id)
      .attr('text-anchor', 'middle')
      .attr('dy', -44)
      .attr('font-size', '18px')
      .attr('font-weight', '600')
      .attr('fill', 'currentColor')
      .attr('pointer-events', 'none')
      // Halo so the entity name stays readable over crossing edges in dense layouts.
      .style('paint-order', 'stroke')
      .style('stroke', 'hsl(var(--color-bg-card))')
      .style('stroke-width', '4px')
      .style('stroke-linecap', 'round')
      .style('stroke-linejoin', 'round')

    // Count label below circle
    nodeGroups
      .append('text')
      .text((d) => (d.count !== null ? formatCount(d.count) : ''))
      .attr('text-anchor', 'middle')
      .attr('dy', 56)
      .attr('font-size', '14px')
      .attr('fill', '#94a3b8')
      .attr('pointer-events', 'none')

    // Deselect on SVG background click
    svg.on('click', () => { onNodeSelectRef.current(null) })

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
  }, [])

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

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="600"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="rounded-2xl bg-card border border-stroke-divider text-fg-default"
    />
  )
}
