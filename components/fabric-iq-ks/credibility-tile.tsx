'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'

export interface CredibilityTileProps {
  title: string
  subtitle: string
  ctaLabel: string
  href: string
  icon?: ReactNode
  delay?: number
}

export function CredibilityTile({
  title,
  subtitle,
  ctaLabel,
  href,
  icon,
  delay = 0,
}: CredibilityTileProps) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.45, delay, ease: [0, 0, 0.2, 1] }}
      className="group block rounded-lg border border-stroke-divider bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-md md:p-6"
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="shrink-0 mt-0.5 text-emerald-500" aria-hidden="true">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-fg-default leading-tight">{title}</h3>
          <p className="text-sm text-fg-muted mt-1 leading-snug">{subtitle}</p>
          <div className="mt-4">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:underline md:text-sm">
              {ctaLabel}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </motion.a>
  )
}
