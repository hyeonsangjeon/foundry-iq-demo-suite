import Image from 'next/image'
import { cn } from '@/lib/utils'

interface FlowNode {
  icon: string   // path under /icons/, e.g. '/icons/foundryiq.svg'
  label: string
}

interface ProductFlowProps {
  nodes: FlowNode[]
  color: 'accent' | 'violet' | 'emerald'
  direction?: 'left' | 'right'
}

const arrowColorMap = {
  accent: 'text-accent/50',
  violet: 'text-violet-500/50',
  emerald: 'text-emerald-500/50',
}

export function ProductFlow({ nodes, color, direction = 'right' }: ProductFlowProps) {
  const arrow = direction === 'left' ? '←' : '→'

  return (
    <div className="flex items-center gap-3">
      {nodes.map((node, i) => (
        <div key={node.label} className="flex items-center gap-3">
          {i > 0 && (
            <span className={cn('text-sm', arrowColorMap[color])}>{arrow}</span>
          )}
          <div className="flex flex-col items-center gap-1">
            <Image src={node.icon} alt={node.label} width={32} height={32} className="w-8 h-8" />
            <span className="text-[10px] text-fg-subtle whitespace-nowrap">{node.label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
