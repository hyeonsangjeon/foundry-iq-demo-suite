'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Search24Regular,
  Document24Regular,
  ChevronRight20Regular,
  DataTrending24Regular,
} from '@fluentui/react-icons'
import { ProductFlow } from '@/components/product-flow'
import Image from 'next/image'
import { getLocale, type Locale } from '@/lib/i18n'
import { t } from '@/lib/i18n/translations'
import { ModeToggle, type ViewMode } from '@/components/mode-toggle'
import { FabricIqKsCard } from '@/components/fabric-iq-ks/fabric-iq-ks-card'

// ─── Data ────────────────────────────────────────────────────────────────────

const activeDemo = {
  id: 'foundry-iq-basic',
  title: 'Agentic Retrieval',
  subtitle: 'Azure AI Search',
  description:
    'Query planning, hybrid search, iterative retrieval, and answer synthesis — with full trace visibility and inline citations.',
  features: [
    { label: 'Hybrid Search', desc: 'Vector + keyword simultaneous' },
    { label: 'Agentic Retrieval', desc: '4-stage planning pipeline' },
    { label: 'Inline Citations', desc: 'Every answer traced to source' },
    { label: 'Trace Explorer', desc: 'Full retrieval journey visible' },
  ],
  href: '/test',
  icon: Search24Regular,
}

const sharePointDemo = {
  id: 'sharepoint-connector',
  title: 'SharePoint Indexing',
  subtitle: 'Azure AI Search',
  phase: 'Phase 2',
  description:
    'Connect a SharePoint document library to AI Search. Extract, chunk, embed, and index PDF, DOCX, XLSX, PPTX — zero code required.',
  features: [
    { label: 'Auto-Indexing', desc: 'Extract · Chunk · Embed pipeline' },
    { label: 'Multi-format', desc: 'PDF, DOCX, XLSX, PPTX' },
    { label: '1536-dim Vectors', desc: 'text-embedding-3-large' },
    { label: 'KB Integration', desc: 'Agentic Retrieval ready' },
  ],
  href: '/sharepoint',
  icon: Document24Regular,
}

const fabricIqDemo = {
  id: 'fabric-search-join',
  title: 'Semantic JOIN Demo',
  subtitle: 'Fabric OneLake + Foundry IQ',
  phase: 'Phase 3',
  description:
    'One question answered by combining pre-aggregated Fabric Lakehouse data and policy documents in a unified KB — AI Search routes to both sources simultaneously.',
  features: [
    { label: 'Semantic JOIN', desc: 'One question, two data sources' },
    { label: 'Fabric OneLake', desc: '5.8M structured flight records' },
    { label: 'DOT Policies', desc: '4 PDF regulation documents' },
    { label: 'AI Synthesis', desc: 'Cited answers from both' },
  ],
  href: '/semantic-join',
  icon: DataTrending24Regular,
}

const comingSoon: Array<{
  id: string
  title: string
  subtitle: string
  phase: string
  icon: typeof DataTrending24Regular
  desc: string
  href?: string
}> = []

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActiveDemoCard({ locale, isExec }: { locale: Locale; isExec: boolean }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-10%' })
  const text = t.landing[locale]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] as const }}
    >
      <Link href={activeDemo.href}>
        <motion.div
          whileHover={{ y: -6 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={cn(
            'group relative overflow-hidden rounded-2xl p-8 md:p-10',
            'border border-stroke-divider',
            'bg-bg-elevated/50 backdrop-blur-sm',
            'hover:border-accent/40',
            'hover:shadow-[0_0_60px_hsl(var(--color-accent-default)/0.12)]',
            'transition-all duration-300',
            'cursor-pointer'
          )}
        >
          <div
            className="pointer-events-none absolute -top-1/2 -right-1/4 w-1/2 h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: 'radial-gradient(ellipse at center, hsl(var(--color-accent-default)/0.08) 0%, transparent 70%)' }}
          />

          <div className="flex flex-col md:flex-row md:items-start gap-8">
            <div className="flex-1 min-w-0">
              <div className="mb-5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-[11px] font-medium text-accent tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Live Demo
              </div>

              <div className="text-xs font-mono text-accent/70 uppercase tracking-widest mb-1">
                {activeDemo.subtitle}
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-fg-default tracking-tight mb-3">
                {isExec ? (text as any).phase1ExecTitle || text.phase1Title : text.phase1Title}
              </h3>
              <p className="text-base text-fg-muted leading-relaxed mb-6 max-w-lg">
                {isExec ? (text as any).phase1ExecDesc || text.phase1Desc : text.phase1Desc}
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {activeDemo.features.map((f) => (
                  <span
                    key={f.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-subtle border border-stroke-divider text-xs text-fg-muted"
                  >
                    <span className="w-1 h-1 rounded-full bg-accent" />
                    <span className="font-medium text-fg-default">{f.label}</span>
                    <span className="hidden sm:inline text-fg-subtle">— {f.desc}</span>
                  </span>
                ))}
              </div>

              <div className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-accent hover:bg-accent-hover text-fg-on-accent text-sm font-semibold transition-colors duration-150">
                {text.phase1Button}
                <ChevronRight20Regular className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            <div className="hidden md:flex shrink-0 rounded-xl bg-accent/5 border border-accent/10 p-4 items-center justify-center self-start mt-6">
              <ProductFlow
                nodes={[
                  { icon: '/icons/foundryiq.svg', label: 'Foundry IQ' },
                  { icon: '/icons/knowledge_base.svg', label: 'Knowledge Base' },
                ]}
                color="accent"
                direction="left"
              />
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}

function SharePointDemoCard({ locale, isExec }: { locale: Locale; isExec: boolean }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-10%' })
  const text = t.landing[locale]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.1, ease: [0, 0, 0.2, 1] as const }}
    >
      <Link href={sharePointDemo.href}>
        <motion.div
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={cn(
            'group relative overflow-hidden rounded-2xl p-6 md:p-8',
            'border border-stroke-divider',
            'bg-bg-elevated/50 backdrop-blur-sm',
            'hover:border-violet-500/40',
            'hover:shadow-[0_0_40px_rgba(139,92,246,0.1)]',
            'transition-all duration-300',
            'cursor-pointer'
          )}
        >
          <div
            className="pointer-events-none absolute -top-1/2 -right-1/4 w-1/2 h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.07) 0%, transparent 70%)' }}
          />

          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-[11px] font-medium text-violet-600 dark:text-violet-400 tracking-wide uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                  Live Demo
                </div>
              </div>

              <div className="text-xs font-mono text-violet-500/70 uppercase tracking-widest mb-1">
                {sharePointDemo.subtitle}
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-fg-default tracking-tight mb-2">
                {isExec ? (text as any).phase2ExecTitle || text.phase2Title : text.phase2Title}
              </h3>
              <p className="text-sm text-fg-muted leading-relaxed mb-5 max-w-lg">
                {isExec ? (text as any).phase2ExecDesc || text.phase2Desc : text.phase2Desc}
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {sharePointDemo.features.map((f) => (
                  <span
                    key={f.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-subtle border border-stroke-divider text-xs text-fg-muted"
                  >
                    <span className="w-1 h-1 rounded-full bg-violet-500" />
                    <span className="font-medium text-fg-default">{f.label}</span>
                    <span className="hidden sm:inline text-fg-subtle">— {f.desc}</span>
                  </span>
                ))}
              </div>

              <div className="inline-flex items-center gap-2 h-10 px-6 rounded-full bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold transition-colors duration-150">
                {text.phase2Button}
                <ChevronRight20Regular className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            <div className="hidden md:flex shrink-0 rounded-xl bg-violet-500/5 border border-violet-500/10 p-4 items-center justify-center self-start mt-6">
              <ProductFlow
                nodes={[
                  { icon: '/icons/sharepoint.svg', label: 'SharePoint (M365)' },
                  { icon: '/icons/foundryiq.svg', label: 'Foundry IQ' },
                ]}
                color="violet"
                direction="right"
              />
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}

function FabricIqDemoCard({ locale, isExec }: { locale: Locale; isExec: boolean }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-10%' })
  const text = t.landing[locale]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.15, ease: [0, 0, 0.2, 1] as const }}
    >
      <Link href={fabricIqDemo.href}>
        <motion.div
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={cn(
            'group relative overflow-hidden rounded-2xl p-6 md:p-8',
            'border border-stroke-divider',
            'bg-bg-elevated/50 backdrop-blur-sm',
            'hover:border-emerald-500/40',
            'hover:shadow-[0_0_40px_rgba(52,211,153,0.1)]',
            'transition-all duration-300',
            'cursor-pointer'
          )}
        >
          <div
            className="pointer-events-none absolute -top-1/2 -right-1/4 w-1/2 h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: 'radial-gradient(ellipse at center, rgba(52,211,153,0.07) 0%, transparent 70%)' }}
          />

          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Demo
                </div>
              </div>

              <div className="text-xs font-mono text-emerald-500/70 uppercase tracking-widest mb-1">
                {fabricIqDemo.subtitle}
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-fg-default tracking-tight mb-2">
                {isExec ? (text as any).phase3ExecTitle || text.phase3Title : text.phase3Title}
              </h3>
              <p className="text-sm text-fg-muted leading-relaxed mb-5 max-w-lg">
                {isExec ? (text as any).phase3ExecDesc || text.phase3Desc : text.phase3Desc}
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {fabricIqDemo.features.map((f) => (
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

              <div className="inline-flex items-center gap-2 h-10 px-6 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors duration-150">
                {text.phase3Button}
                <ChevronRight20Regular className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            <div className="hidden md:flex shrink-0 rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-4 items-center justify-center self-start mt-6">
              <ProductFlow
                nodes={[
                  { icon: '/icons/foundryiq.svg', label: 'Foundry IQ' },
                  { icon: '/icons/onelake-color.svg', label: 'Fabric OneLake' },
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

function ComingSoonCards() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-10%' })

  // Hide the section entirely when no upcoming demos are queued.
  if (comingSoon.length === 0) return null

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {comingSoon.map((demo, i) => {
        const cardContent = (
          <div className={cn(
            'group relative rounded-xl p-5',
            'border border-stroke-divider bg-bg-elevated/30 backdrop-blur-sm',
            'hover:border-stroke-strong hover:bg-bg-elevated/50',
            'transition-all duration-200',
            demo.href && 'cursor-pointer'
          )}>
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-fg-subtle uppercase tracking-wide">{demo.subtitle}</div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-fg-default truncate">{demo.title}</span>
                </div>
                <p className="text-xs text-fg-muted leading-relaxed mt-1">{demo.desc}</p>
                {!demo.href && (
                  <p className="text-[10px] text-fg-subtle mt-2 font-mono uppercase tracking-wide">Coming soon</p>
                )}
                {demo.href && (
                  <p className="text-xs text-accent mt-2">Preview data profile →</p>
                )}
              </div>
              <div className="hidden md:flex shrink-0 items-center gap-2 opacity-60 pt-0.5">
                <div className="flex flex-col items-center gap-0.5">
                  <Image src="/icons/foundryiq.svg" alt="Foundry IQ" width={20} height={20} className="w-5 h-5" />
                  <span className="text-[9px] text-fg-subtle">Foundry IQ</span>
                </div>
                <span className="text-[10px] text-fg-subtle/50">→</span>
                <div className="flex flex-col items-center gap-0.5">
                  <Image src="/icons/fabric_knowledge.svg" alt="Fabric IQ" width={20} height={20} className="w-5 h-5" />
                  <span className="text-[9px] text-fg-subtle">Fabric IQ</span>
                </div>
                <span className="text-[10px] text-fg-subtle/50">→</span>
                <div className="flex flex-col items-center gap-0.5">
                  <Image src="/icons/data-agent.svg" alt="Data Agent" width={20} height={20} className="w-5 h-5" />
                  <span className="text-[9px] text-fg-subtle">Data Agent</span>
                </div>
              </div>
            </div>
          </div>
        )

        return (
          <motion.div
            key={demo.id}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0, 0, 0.2, 1] as const }}
          >
            {demo.href ? (
              <Link href={demo.href}>
                {cardContent}
              </Link>
            ) : (
              cardContent
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function LandingPage() {
  const router = useRouter()
  const [locale, setLocaleState] = useState<Locale>('en')
  const [mode, setMode] = useState<ViewMode>('technical')
  useEffect(() => { setLocaleState(getLocale()) }, [])

  const text = t.landing[locale]
  const isExec = mode === 'executive'

  const toggleMode = (newMode: ViewMode) => {
    if (newMode === 'executive') {
      router.push('/scenario')
      return
    }
    setMode(newMode)
    const url = new URL(window.location.href)
    url.searchParams.delete('mode')
    window.history.replaceState({}, '', url.toString())
  }

  return (
    <div className="relative min-h-screen text-fg-default">

      {/* Title */}
      <div className="pt-12 pb-8 text-center relative">
        {/* Mode toggle — top right */}
        <div className="absolute top-4 right-6">
          <ModeToggle mode={mode} onToggle={toggleMode} locale={locale} />
        </div>
        <h1 className="text-2xl font-semibold text-fg-default">{text.title}</h1>
        <p className="text-sm text-fg-muted mt-1">{text.subtitle}</p>
        <Link
          href="/what-is-foundry-iq"
          className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-full text-xs font-semibold text-accent border border-accent/30 bg-accent/5 hover:bg-accent/10 hover:border-accent/50 transition-all duration-200 shadow-[0_0_12px_hsl(var(--color-accent-default)/0.08)] hover:shadow-[0_0_20px_hsl(var(--color-accent-default)/0.15)]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          {text.whatIsFoundryIQ}
          <ChevronRight20Regular className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Demo Cards */}
      <section className="relative px-6 py-8 max-w-5xl mx-auto flex flex-col gap-6">
        <ActiveDemoCard locale={locale} isExec={isExec} />
        <SharePointDemoCard locale={locale} isExec={isExec} />
        <FabricIqDemoCard locale={locale} isExec={isExec} />
        <FabricIqKsCard locale={locale} />
        <ComingSoonCards />

        {/* Architecture link */}
        <div className="text-center pt-2">
          <Link
            href="/architecture"
            className="inline-flex items-center gap-1.5 text-sm text-fg-subtle hover:text-fg-muted transition-colors"
          >
            View full architecture
            <ChevronRight20Regular className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* Zone 3: Footer */}
      <footer className="py-12 text-center border-t border-stroke-divider">
        <div className="flex items-center justify-center gap-3">
          <Image src="/icons/gbb-logo-white-footer.svg" alt="GBB" width={80} height={10} className="opacity-50" />
          <p className="text-xs text-fg-subtle font-mono tracking-wide">
            {text.footer}
          </p>
        </div>
      </footer>
    </div>
  )
}
