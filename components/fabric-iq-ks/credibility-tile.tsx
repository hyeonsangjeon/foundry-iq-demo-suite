'use client'

import { motion } from 'framer-motion'
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
      className="group block rounded-2xl border border-stroke-divider bg-card shadow-sm p-5 md:p-6 transition-all hover:ring-2 hover:ring-emerald-500/40 hover:border-transparent hover:-translate-y-0.5"
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
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-cyan-500 group-hover:from-emerald-400 group-hover:to-cyan-400 transition-colors shadow-sm">
              {ctaLabel}
            </span>
          </div>
        </div>
      </div>
    </motion.a>
  )
}
