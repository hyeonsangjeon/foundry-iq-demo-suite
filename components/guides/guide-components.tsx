import Link from 'next/link'
import type { ReactNode } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GuideLink {
  href: string
  label: string
}

interface GuideHeroProps {
  eyebrow: string
  title: string
  description: string
  links?: GuideLink[]
}

export function GuideHero({ eyebrow, title, description, links = [] }: GuideHeroProps) {
  return (
    <section className="border-b border-stroke-divider pb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-fg-default md:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-fg-muted md:text-base">
        {description}
      </p>
      {links.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-2 rounded-lg border border-stroke-divider px-4 py-2 text-sm font-semibold text-fg-default transition-colors hover:border-accent-muted hover:bg-bg-hover"
            >
              {link.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

interface GuideSectionProps {
  id?: string
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function GuideSection({ id, title, description, children, className }: GuideSectionProps) {
  return (
    <section id={id} className={cn('space-y-4', className)}>
      <div>
        <h2 className="text-lg font-semibold text-fg-default">{title}</h2>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-fg-muted">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}

interface GuideCard {
  title: string
  description: string
  meta?: string
}

export function GuideCardGrid({ items, columns = 3 }: { items: GuideCard[]; columns?: 2 | 3 | 4 }) {
  const gridClass = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 xl:grid-cols-4',
  }[columns]

  return (
    <div className={cn('grid gap-4', gridClass)}>
      {items.map((item) => (
        <div key={item.title} className="rounded-lg border border-stroke-divider bg-bg-card p-4">
          <CheckCircle className="h-5 w-5 text-emerald-500" />
          <h3 className="mt-3 text-sm font-semibold text-fg-default">{item.title}</h3>
          <p className="mt-2 text-xs leading-5 text-fg-muted">{item.description}</p>
          {item.meta && (
            <p className="mt-3 font-mono text-[11px] text-fg-subtle">{item.meta}</p>
          )}
        </div>
      ))}
    </div>
  )
}

export function GuideSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="grid gap-3 md:grid-cols-2">
      {steps.map((step, index) => (
        <li key={step} className="rounded-lg border border-stroke-divider bg-bg-card p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-fg-on-accent">
              {index + 1}
            </span>
            <p className="text-sm leading-6 text-fg-muted">{step}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

interface TroubleshootingItem {
  issue: string
  fix: string
}

export function TroubleshootingList({ items }: { items: TroubleshootingItem[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.issue} className="rounded-lg border border-stroke-divider bg-bg-card p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <h3 className="text-sm font-semibold text-fg-default">{item.issue}</h3>
              <p className="mt-2 text-xs leading-5 text-fg-muted">{item.fix}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function GuideCallout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-accent-muted bg-accent-subtle p-4">
      <h3 className="text-sm font-semibold text-fg-default">{title}</h3>
      <div className="mt-2 text-sm leading-6 text-fg-muted">{children}</div>
    </div>
  )
}
