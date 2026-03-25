'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  i18n,
  pipeDetail,
  STEP_KEYS,
  STEP_META,
  type Lang,
  type StepKey,
} from '@/lib/i18n/what-is-foundry-iq'
import { getLocale } from '@/lib/i18n'

// ─── Shared SVG Icons ─────────────────────────────────────────────────────────

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function ExternalLinkIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
    </svg>
  )
}

// ─── Reveal wrapper ───────────────────────────────────────────────────────────

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px 0px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0, 0, 0.2, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WhatIsFoundryIQPage() {
  const [currentLang, setCurrentLang] = useState<Lang>('en')
  const [activeStep, setActiveStep] = useState<StepKey>('plan')

  useEffect(() => {
    const locale = getLocale()
    if (locale in i18n) setCurrentLang(locale as Lang)
  }, [])

  const t = i18n[currentLang]
  const detail = pipeDetail[currentLang][activeStep]
  const stepMeta = STEP_META[activeStep]

  return (
    <div
      className="relative min-h-screen text-white overflow-x-hidden"
      style={{ background: '#06080d', fontFamily: "'Outfit', 'Noto Sans KR', 'Noto Sans SC', 'Noto Sans Devanagari', var(--font-sans), sans-serif" }}
    >
      {/* Ambient background orbs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="fiq-orb fiq-orb-1" />
        <div className="fiq-orb fiq-orb-2" />
        <div className="fiq-orb fiq-orb-3" />
      </div>

      {/* Noise texture overlay */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          opacity: 0.025,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'repeat',
          backgroundSize: '256px',
        }}
      />

      {/* Page nav bar — sticky within scroll container, sits below app-shell header */}
      <div
        className="sticky top-0 z-10"
        style={{
          backdropFilter: 'blur(20px) saturate(1.4)',
          background: 'rgba(6,8,13,0.85)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="max-w-[1100px] mx-auto px-5 md:px-8 py-3.5 flex justify-between items-center">
          {/* Left: back link + page title */}
          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium tracking-wide transition-colors duration-200"
              style={{ color: 'rgba(255,255,255,0.55)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#e8eaed')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
            >
              <ArrowLeftIcon />
              Demo Suite
            </Link>
            <div
              className="hidden md:flex items-center gap-2 text-[14px] font-bold pl-5"
              style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', color: '#e8eaed' }}
            >
              <span
                className="w-[7px] h-[7px] rounded-full"
                style={{
                  background: 'var(--accent-cyan)',
                  boxShadow: '0 0 10px var(--accent-cyan)',
                  animation: 'fiq-pulse 2s ease-in-out infinite',
                }}
              />
              What is Foundry IQ?
            </div>
          </div>

        </div>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section
        className="relative z-[2] flex flex-col justify-center items-center text-center min-h-[auto] md:min-h-[90vh]"
        style={{ paddingTop: '60px', paddingBottom: '60px', paddingLeft: '20px', paddingRight: '20px' }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0, 0, 0.2, 1], delay: 0.2 }}
          className="inline-flex items-center gap-2 rounded-full text-[12px] font-medium tracking-[0.04em] mb-10"
          style={{
            padding: '6px 16px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--accent-green)', boxShadow: '0 0 8px rgba(52,211,153,0.5)' }}
          />
          {t.badge}
        </motion.div>

        {/* H1 */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0, 0, 0.2, 1], delay: 0.4 }}
          className="font-extrabold tracking-[-0.04em] mb-6"
          style={{ fontSize: 'clamp(44px, 6.5vw, 82px)', lineHeight: 1.08 }}
        >
          <span
            style={{
              background: 'linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-cyan) 50%, var(--accent-purple) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {t.h1_1}
          </span>
          <br />
          <span style={{ color: '#e8eaed' }}>{t.h1_2}</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0, 0, 0.2, 1], delay: 0.6 }}
          className="font-light leading-relaxed mb-12 max-w-[620px]"
          style={{ fontSize: 'clamp(15px, 1.8vw, 19px)', color: 'rgba(255,255,255,0.55)' }}
        >
          {t.hero_sub}
        </motion.p>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0, 0, 0.2, 1], delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <Link
            href="/test"
            className="inline-flex items-center gap-2.5 rounded-full font-semibold text-[15px] no-underline transition-all duration-200"
            style={{
              padding: '14px 32px',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
              color: '#000',
              boxShadow: '0 0 30px rgba(77,166,255,0.2)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 0 50px rgba(77,166,255,0.35)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 0 30px rgba(77,166,255,0.2)'
            }}
          >
            {t.cta_demo}
            <ArrowRightIcon />
          </Link>
          <a
            href="https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/what-is-foundry-iq"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full font-medium text-[14px] no-underline transition-all duration-200"
            style={{
              padding: '14px 28px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.55)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
              e.currentTarget.style.color = '#e8eaed'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.55)'
            }}
          >
            {t.cta_docs}
          </a>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0, 0, 0.2, 1], delay: 1.1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span
            className="text-[10px] tracking-[0.2em] uppercase"
            style={{ fontFamily: 'var(--font-mono), JetBrains Mono, monospace', color: 'rgba(255,255,255,0.30)' }}
          >
            {t.scroll}
          </span>
          <div
            className="w-px h-7"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.30), transparent)',
              animation: 'fiq-bob 2s ease-in-out infinite',
            }}
          />
        </motion.div>
      </section>

      {/* ── PIPELINE ─────────────────────────────────────────────────────────── */}
      <section className="relative z-[2] py-[110px]">
        <div className="max-w-[1100px] mx-auto px-5 md:px-8">
          <Reveal>
            <div
              className="text-[11px] font-medium tracking-[0.2em] uppercase mb-4"
              style={{ fontFamily: 'var(--font-mono), JetBrains Mono, monospace', color: 'var(--accent-cyan)' }}
            >
              {t.pipe_label}
            </div>
            <h2
              className="font-bold tracking-[-0.03em] leading-[1.15] mb-4"
              style={{ fontSize: 'clamp(30px, 3.8vw, 46px)' }}
            >
              {t.pipe_title}
            </h2>
            <p
              className="font-light leading-[1.7] mb-[52px] max-w-[640px]"
              style={{ fontSize: '16px', color: 'rgba(255,255,255,0.55)' }}
            >
              {t.pipe_desc}
            </p>
          </Reveal>

          {/* Pipeline steps */}
          <Reveal delay={0.1}>
            <div className="flex flex-col md:flex-row w-full">
              {STEP_KEYS.map((key, idx) => {
                const meta = STEP_META[key]
                const isActive = activeStep === key
                const isLast = idx === STEP_KEYS.length - 1
                const iconBgMap: Record<string, string> = {
                  'si-plan': 'rgba(77,166,255,0.12)',
                  'si-retrieve': 'rgba(56,217,212,0.12)',
                  'si-assess': 'rgba(155,122,255,0.12)',
                  'si-synth': 'rgba(255,140,66,0.12)',
                }
                const iconColorMap: Record<string, string> = {
                  'si-plan': 'var(--accent-blue)',
                  'si-retrieve': 'var(--accent-cyan)',
                  'si-assess': 'var(--accent-purple)',
                  'si-synth': 'var(--accent-orange)',
                }
                return (
                  <button
                    key={key}
                    onClick={() => setActiveStep(key)}
                    className="flex-1 relative flex flex-col items-center text-center cursor-pointer transition-all duration-300 border-0 text-white"
                    style={{
                      padding: '26px 18px',
                      border: `1px solid ${isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'}`,
                      background: isActive ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                      backdropFilter: 'blur(16px)',
                      borderRadius:
                        idx === 0
                          ? '14px 0 0 14px'
                          : isLast
                          ? '0 14px 14px 0'
                          : '0',
                      ...(idx === 0 ? {} : { marginLeft: '-1px' }),
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                      }
                    }}
                  >
                    <div
                      className="text-[10px] font-semibold tracking-[0.15em] mb-2.5"
                      style={{ fontFamily: 'var(--font-mono), JetBrains Mono, monospace', color: 'rgba(255,255,255,0.30)' }}
                    >
                      {meta.num}
                    </div>
                    <div
                      className="w-[42px] h-[42px] rounded-[11px] flex items-center justify-center text-[19px] mb-3 transition-all duration-300"
                      style={{
                        background: iconBgMap[meta.iconClass],
                        color: iconColorMap[meta.iconClass],
                        transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                        boxShadow: isActive ? `0 0 28px ${meta.activeGlow}` : 'none',
                      }}
                    >
                      {meta.icon}
                    </div>
                    <div className="text-[14px] font-semibold tracking-[-0.01em] mb-1.5">
                      {t[`s${idx + 1}_name` as keyof typeof t]}
                    </div>
                    <div className="text-[11.5px] leading-[1.5]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {t[`s${idx + 1}_brief` as keyof typeof t]}
                    </div>
                    {/* Divider between steps (desktop only) */}
                    {!isLast && (
                      <div
                        className="hidden md:block absolute right-[-1px] top-1/2 -translate-y-1/2 w-[2px] h-[40%] z-[1]"
                        style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.15), transparent)' }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </Reveal>

          {/* Pipeline detail panel */}
          <Reveal delay={0.2}>
            <div
              className="mt-5 rounded-[14px]"
              style={{
                padding: '28px 32px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(16px)',
                minHeight: '120px',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeStep}-${currentLang}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
                >
                  <div
                    className="text-[11px] font-semibold tracking-[0.1em] uppercase mb-2.5"
                    style={{
                      fontFamily: 'var(--font-mono), JetBrains Mono, monospace',
                      color: detail.color,
                    }}
                  >
                    {detail.label}
                  </div>
                  <p className="text-[14.5px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {detail.text}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── THREE PILLARS ─────────────────────────────────────────────────────── */}
      <section className="relative z-[2] py-[110px]">
        <div className="max-w-[1100px] mx-auto px-5 md:px-8">
          <Reveal>
            <div
              className="text-[11px] font-medium tracking-[0.2em] uppercase mb-4"
              style={{ fontFamily: 'var(--font-mono), JetBrains Mono, monospace', color: 'var(--accent-cyan)' }}
            >
              {t.pill_label}
            </div>
            <h2
              className="font-bold tracking-[-0.03em] leading-[1.15] mb-4"
              style={{ fontSize: 'clamp(30px, 3.8vw, 46px)' }}
            >
              {t.pill_title}
            </h2>
            <p
              className="font-light leading-[1.7] mb-[52px] max-w-[640px]"
              style={{ fontSize: '16px', color: 'rgba(255,255,255,0.55)' }}
            >
              {t.pill_desc}
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px]">
            {/* Pillar 1 */}
            <Reveal delay={0}>
              <PillarCard
                icon="📚"
                iconBg="rgba(77,166,255,0.10)"
                topGlow="linear-gradient(90deg, transparent, var(--accent-blue), transparent)"
                title={t.p1_title}
                desc={t.p1_desc}
                stat="10+"
                statLabel={t.p1_stat}
                refHref="https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/foundry-iq-boost-response-relevance-by-36-with-agentic-retrieval/4470720"
                refLabel="Microsoft Tech Community"
              />
            </Reveal>
            {/* Pillar 2 */}
            <Reveal delay={0.1}>
              <PillarCard
                icon="🧠"
                iconBg="rgba(56,217,212,0.10)"
                topGlow="linear-gradient(90deg, transparent, var(--accent-cyan), transparent)"
                title={t.p2_title}
                desc={t.p2_desc}
                stat="+36%"
                statLabel={t.p2_stat}
                refHref="https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/foundry-iq-boost-response-relevance-by-36-with-agentic-retrieval/4470720"
                refLabel="Microsoft Tech Community"
              />
            </Reveal>
            {/* Pillar 3 */}
            <Reveal delay={0.2}>
              <PillarCard
                icon="🎯"
                iconBg="rgba(155,122,255,0.10)"
                topGlow="linear-gradient(90deg, transparent, var(--accent-purple), transparent)"
                title={t.p3_title}
                desc={t.p3_desc}
                stat="100%"
                statLabel={t.p3_stat}
                refHref="https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/what-is-foundry-iq"
                refLabel="Microsoft Learn"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 3 IQ STRIP ───────────────────────────────────────────────────────── */}
      <section className="relative z-[2] py-[110px]">
        <div className="max-w-[1100px] mx-auto px-5 md:px-8">
          <Reveal>
            <div
              className="text-[11px] font-medium tracking-[0.2em] uppercase mb-4"
              style={{ fontFamily: 'var(--font-mono), JetBrains Mono, monospace', color: 'var(--accent-cyan)' }}
            >
              {t.iq_label}
            </div>
            <h2
              className="font-bold tracking-[-0.03em] leading-[1.15] mb-[52px]"
              style={{ fontSize: 'clamp(30px, 3.8vw, 46px)' }}
            >
              {t.iq_title}
            </h2>
          </Reveal>

          {/* Zone A: 3IQ Flow Cards */}
          <Reveal delay={0.1}>
            <div className="relative w-full">
              {/* SVG flow connector — behind cards, desktop only */}
              <svg
                className="absolute top-1/2 left-0 w-full h-[60px] -translate-y-1/2 z-0 pointer-events-none hidden md:block"
                viewBox="0 0 1000 60"
                preserveAspectRatio="none"
              >
                {/* Work → Fabric: dashed dimmed */}
                <path d="M 310 30 L 345 30" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={2} strokeLinecap="round" strokeDasharray="8 6" opacity={0.4} />
                {/* Fabric → Foundry: solid + glow */}
                <path d="M 655 30 L 690 30" fill="none" stroke="var(--accent-blue)" strokeWidth={2} strokeLinecap="round" opacity={0.8} style={{ filter: 'drop-shadow(0 0 6px var(--accent-blue))' }} />
                {/* Fabric → Foundry: particle animation */}
                <path d="M 655 30 L 690 30" fill="none" stroke="var(--accent-blue)" strokeWidth={3} strokeLinecap="round" strokeDasharray="4 20" opacity={0.9}>
                  <animate attributeName="stroke-dashoffset" from="0" to="-48" dur="2s" repeatCount="indefinite" />
                </path>
                {/* Arrow heads */}
                <polygon points="690,22 706,30 690,38" fill="var(--accent-blue)" style={{ filter: 'drop-shadow(0 0 4px var(--accent-blue))' }} />
                <polygon points="345,25 355,30 345,35" fill="rgba(255,255,255,0.15)" opacity={0.4} />
              </svg>

              <div className="relative z-[1] grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Work IQ — dimmed */}
                <div
                  className="rounded-[14px] text-center transition-all duration-300"
                  style={{
                    padding: '22px',
                    border: '1.5px dashed rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    opacity: 0.6,
                  }}
                >
                  <div className="text-[16px] font-semibold mb-2">Work IQ</div>
                  <p className="text-[1.25rem] italic leading-[1.4] mb-3" style={{ color: 'var(--text-primary, #e8eaed)' }}>
                    &ldquo;{t.iq3_question}&rdquo;
                  </p>
                  <p className="text-[12.5px] leading-[1.55]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {t.iq3_desc}
                  </p>
                </div>

                {/* Fabric IQ — dimmed + Phase 3 */}
                <div
                  className="rounded-[14px] text-center transition-all duration-300"
                  style={{
                    padding: '22px',
                    border: '1.5px dashed rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    opacity: 0.7,
                  }}
                >
                  <div className="text-[16px] font-semibold mb-2">Fabric IQ</div>
                  <p className="text-[1.25rem] italic leading-[1.4] mb-3" style={{ color: 'var(--text-primary, #e8eaed)' }}>
                    &ldquo;{t.iq2_question}&rdquo;
                  </p>
                  <p className="text-[12.5px] leading-[1.55]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {t.iq2_desc}
                  </p>
                  <span
                    className="inline-block mt-3 rounded-full text-[10px] font-semibold tracking-[0.1em] uppercase"
                    style={{
                      padding: '4px 12px',
                      fontFamily: 'var(--font-mono), JetBrains Mono, monospace',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'rgba(255,255,255,0.30)',
                    }}
                  >
                    {t.iq2_tag}
                  </span>
                </div>

                {/* Foundry IQ — active */}
                <div
                  className="rounded-[14px] text-center transition-all duration-300"
                  style={{
                    padding: '22px',
                    border: '1px solid rgba(77,166,255,0.25)',
                    background: 'rgba(77,166,255,0.04)',
                  }}
                >
                  <div className="text-[16px] font-semibold mb-2">Foundry IQ</div>
                  <p className="text-[1.25rem] italic leading-[1.4] mb-3" style={{ color: 'var(--text-primary, #e8eaed)' }}>
                    &ldquo;{t.iq1_question}&rdquo;
                  </p>
                  <p className="text-[12.5px] leading-[1.55]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {t.iq1_desc}
                  </p>
                  <span
                    className="inline-block mt-3 rounded-full text-[10px] font-semibold tracking-[0.1em] uppercase"
                    style={{
                      padding: '4px 12px',
                      fontFamily: 'var(--font-mono), JetBrains Mono, monospace',
                      background: 'rgba(77,166,255,0.12)',
                      color: 'var(--accent-blue)',
                    }}
                  >
                    {t.iq1_tag}
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Zone B: Focus text */}
          <Reveal delay={0.2}>
            <p className="text-center text-[1rem] mt-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {t.iq_focus}
            </p>
          </Reveal>

          {/* Zone C: Fabric→Foundry banner */}
          <Reveal delay={0.3}>
            <div
              className="mt-8 flex items-center gap-4 rounded-xl"
              style={{
                padding: '20px 24px',
                border: '1px dashed rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <div className="text-2xl" aria-hidden="true">🔗</div>
              <div>
                <strong style={{ color: 'var(--text-primary, #e8eaed)' }}>{t.ff_title}</strong>
                <p className="text-[0.9rem] mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {t.ff_desc}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA SECTION ──────────────────────────────────────────────────────── */}
      <section className="relative z-[2] text-center" style={{ padding: '100px 32px 60px' }}>
        <div className="max-w-[1100px] mx-auto">
          <Reveal>
            <h2
              className="font-bold tracking-[-0.03em] mb-5"
              style={{ fontSize: 'clamp(26px, 3.2vw, 40px)' }}
            >
              {t.cta_title}
            </h2>
            <p className="text-[15px] mb-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {t.cta_sub}
            </p>
            <Link
              href="/test"
              className="inline-flex items-center gap-2.5 rounded-full font-semibold text-[15px] no-underline transition-all duration-200"
              style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
                color: '#000',
                boxShadow: '0 0 30px rgba(77,166,255,0.2)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 0 50px rgba(77,166,255,0.35)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 0 30px rgba(77,166,255,0.2)'
              }}
            >
              {t.cta_launch}
              <ArrowRightIcon />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── REFERENCES ───────────────────────────────────────────────────────── */}
      <div className="relative z-[2] max-w-[1100px] mx-auto px-5 md:px-8">
        <Reveal>
          <div
            className="py-10"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div
              className="text-[10px] tracking-[0.2em] uppercase mb-3.5"
              style={{ fontFamily: 'var(--font-mono), JetBrains Mono, monospace', color: 'rgba(255,255,255,0.30)' }}
            >
              References
            </div>
            <ul className="list-none flex flex-col gap-2">
              {[
                {
                  href: 'https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/what-is-foundry-iq',
                  label: 'What is Foundry IQ? — Microsoft Learn',
                },
                {
                  href: 'https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/foundry-iq-unlocking-ubiquitous-knowledge-for-agents/4470812',
                  label: 'Foundry IQ: Unlock knowledge retrieval for agents — Tech Community',
                },
                {
                  href: 'https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/foundry-iq-boost-response-relevance-by-36-with-agentic-retrieval/4470720',
                  label: '+36% response relevance with agentic retrieval — Tech Community',
                },
                {
                  href: 'https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-overview',
                  label: 'Agentic Retrieval Overview — Microsoft Learn',
                },
                {
                  href: 'https://devblogs.microsoft.com/foundry/foundry-iq-agent-framework-integration/',
                  label: 'Foundry IQ in Agent Framework — DevBlog',
                },
              ].map(ref => (
                <li key={ref.href}>
                  <a
                    href={ref.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[12.5px] no-underline transition-colors duration-200"
                    style={{ color: 'var(--accent-blue)' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = 'var(--accent-cyan)'
                      e.currentTarget.style.textDecoration = 'underline'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = 'var(--accent-blue)'
                      e.currentTarget.style.textDecoration = 'none'
                    }}
                  >
                    <ExternalLinkIcon />
                    {ref.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer
        className="relative z-[2] text-center"
        style={{ padding: '28px 32px', borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="max-w-[1100px] mx-auto">
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Powered by Azure AI Search — Microsoft AI GBB Asia
          </p>
        </div>
      </footer>
    </div>
  )
}

// ─── Pillar Card ─────────────────────────────────────────────────────────────

interface PillarCardProps {
  icon: string
  iconBg: string
  topGlow: string
  title: string
  desc: string
  stat: string
  statLabel: string
  refHref: string
  refLabel: string
}

function PillarCard({ icon, iconBg, topGlow, title, desc, stat, statLabel, refHref, refLabel }: PillarCardProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="relative overflow-hidden rounded-[18px] transition-all duration-[350ms] cursor-default"
      style={{
        padding: '32px 24px',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'}`,
        background: hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(16px)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top border glow */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300"
        style={{ background: topGlow, opacity: hovered ? 1 : 0 }}
      />
      <div
        className="w-12 h-12 rounded-[13px] flex items-center justify-center text-[22px] mb-[18px]"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div className="text-[18px] font-semibold tracking-[-0.02em] mb-2.5">{title}</div>
      <p className="text-[13.5px] leading-[1.65]" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {desc}
      </p>
      <div
        className="mt-[18px] pt-3.5"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontFamily: 'var(--font-mono), JetBrains Mono, monospace',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.30)',
          letterSpacing: '0.04em',
        }}
      >
        <strong
          className="block mb-0.5"
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#e8eaed',
            fontFamily: 'Outfit, var(--font-sans), sans-serif',
          }}
        >
          {stat}
        </strong>
        {statLabel}
        <br />
        <a
          href={refHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 no-underline transition-colors duration-200 mt-1.5"
          style={{ color: 'var(--accent-blue)', fontSize: '10px', fontFamily: 'var(--font-mono), JetBrains Mono, monospace' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--accent-cyan)'
            e.currentTarget.style.textDecoration = 'underline'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--accent-blue)'
            e.currentTarget.style.textDecoration = 'none'
          }}
        >
          <ExternalLinkIcon size={10} />
          {refLabel}
        </a>
      </div>
    </div>
  )
}
