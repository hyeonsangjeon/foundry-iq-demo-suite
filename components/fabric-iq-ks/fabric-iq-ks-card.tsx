'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { ChevronRight20Regular } from '@fluentui/react-icons'
import { cn } from '@/lib/utils'
import { ProductFlow } from '@/components/product-flow'
import { t } from '@/lib/i18n/translations'
import type { Locale } from '@/lib/i18n'

interface FabricIqKsCardProps {
  locale: Locale
}

export function FabricIqKsCard({ locale }: FabricIqKsCardProps) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-10%' })
  const text = t.fabricIqKs[locale].card

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.2, ease: [0, 0, 0.2, 1] as const }}
    >
      <Link href="/fabric-iq-ks">
        <motion.div
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={cn(
            'group relative overflow-hidden rounded-2xl p-6 md:p-8',
            'border border-stroke-divider',
            'bg-bg-elevated/50 backdrop-blur-sm',
            'hover:border-cyan-500/40',
            'hover:shadow-[0_0_40px_rgba(34,211,238,0.12)]',
            'transition-all duration-300',
            'cursor-pointer'
          )}
        >
          <div
            className="pointer-events-none absolute -top-1/2 -right-1/4 w-1/2 h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(34,211,238,0.08) 0%, transparent 70%)',
            }}
          />

          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {text.badgeLabel}
                </div>
                <div className="text-[10px] font-mono text-fg-subtle uppercase tracking-wide">
                  {text.badge}
                </div>
              </div>

              <div className="text-xs font-mono text-cyan-500/70 uppercase tracking-widest mb-1">
                {text.subtitle}
              </div>
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                {text.title}
              </h3>
              <p className="text-sm text-fg-muted leading-relaxed mb-5 max-w-lg">
                {text.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {text.features.map((f) => (
                  <span
                    key={f.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-subtle border border-stroke-divider text-xs text-fg-muted"
                  >
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    <span className="font-medium text-fg-default">{f.label}</span>
                    <span className="hidden sm:inline text-fg-subtle">— {f.desc}</span>
                  </span>
                ))}
              </div>

              <div className="inline-flex items-center gap-2 h-10 px-6 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold transition-colors duration-150">
                {text.button}
                <ChevronRight20Regular className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            <div className="hidden md:flex shrink-0 rounded-xl bg-cyan-500/5 border border-cyan-500/10 p-4 items-center justify-center self-start mt-6">
              {/*
                NOTE: ProductFlow currently supports color: 'accent' | 'violet' | 'emerald'.
                Per T1 spec §9, fall back to "emerald" until ProductFlow gains "cyan" support
                in a later polish task. Phase 3 and Phase 4 share emerald flow visual for now.
              */}
              <ProductFlow
                nodes={[
                  { icon: '/icons/foundryiq.svg', label: 'Foundry IQ' },
                  { icon: '/icons/fabric_knowledge.svg', label: 'Fabric IQ' },
                  { icon: '/icons/data-agent.svg', label: 'Data Agent' },
                ]}
                color="emerald"
                direction="left"
              />
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}
