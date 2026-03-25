'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ─── Hotels Types & Helpers (unchanged) ───

type Hotel = {
  HotelId: string
  HotelName: string
  Description: string
  Category: string
  Tags: string[]
  Rating: number
  Address?: {
    StreetAddress?: string
    City?: string
    StateProvince?: string
    PostalCode?: string
    Country?: string
  }
}

// Category → color map
const categoryColors: Record<string, { bg: string; text: string; dot: string }> = {
  'Budget':    { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500' },
  'Boutique':  { bg: 'bg-violet-500/10',  text: 'text-violet-500',  dot: 'bg-violet-500' },
  'Resort':    { bg: 'bg-amber-500/10',   text: 'text-amber-500',   dot: 'bg-amber-500' },
  'Luxury':    { bg: 'bg-rose-500/10',    text: 'text-rose-500',    dot: 'bg-rose-500' },
  'Suite':     { bg: 'bg-sky-500/10',     text: 'text-sky-500',     dot: 'bg-sky-500' },
  'Extended-Stay': { bg: 'bg-teal-500/10', text: 'text-teal-500',  dot: 'bg-teal-500' },
}
const defaultCategoryColor = { bg: 'bg-fg-subtle/10', text: 'text-fg-muted', dot: 'bg-fg-subtle' }

// Tag → color palette (cycles through)
const tagPalette = [
  { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
  { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  { bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/20' },
  { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
]

function tagColor(tag: string) {
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  return tagPalette[Math.abs(hash) % tagPalette.length]
}

// Star rating → color
function ratingColor(r: number): string {
  if (r >= 4.5) return 'text-yellow-400'
  if (r >= 4.0) return 'text-amber-400'
  if (r >= 3.0) return 'text-orange-400'
  return 'text-fg-subtle'
}

function ratingStars(r: number) {
  const full = Math.floor(r)
  const half = r - full >= 0.5
  const stars: string[] = []
  for (let i = 0; i < full; i++) stars.push('★')
  if (half) stars.push('½')
  return stars.join('')
}

function SkeletonCard() {
  return (
    <Card className="p-4 animate-pulse">
      <div className="h-4 bg-bg-subtle rounded w-3/4 mb-3" />
      <div className="h-3 bg-bg-subtle rounded w-1/4 mb-2" />
      <div className="h-3 bg-bg-subtle rounded w-1/2 mb-3" />
      <div className="flex gap-1">
        <div className="h-4 bg-bg-subtle rounded w-12" />
        <div className="h-4 bg-bg-subtle rounded w-14" />
      </div>
    </Card>
  )
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  const catColor = categoryColors[hotel.Category] || defaultCategoryColor
  const city = hotel.Address
    ? [hotel.Address.City, hotel.Address.StateProvince].filter(Boolean).join(', ')
    : null

  return (
    <Card className="group relative p-4 hover:bg-bg-hover transition-all duration-200 overflow-hidden">
      {/* Category accent bar */}
      <div className={cn('absolute top-0 left-0 w-1 h-full rounded-l-lg', catColor.dot)} />

      {/* Header: Name + Rating */}
      <div className="flex items-start justify-between mb-2 pl-2">
        <h4 className="text-sm font-semibold text-fg-default line-clamp-1 flex-1">{hotel.HotelName}</h4>
        {hotel.Rating != null && (
          <span className={cn('text-xs font-semibold shrink-0 ml-2', ratingColor(hotel.Rating))}>
            {ratingStars(hotel.Rating)} {hotel.Rating.toFixed(1)}
          </span>
        )}
      </div>

      {/* Category pill */}
      <div className="pl-2 mb-2">
        <span className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
          catColor.bg, catColor.text
        )}>
          <span className={cn('w-1.5 h-1.5 rounded-full', catColor.dot)} />
          {hotel.Category}
        </span>
      </div>

      {/* City with pin icon */}
      {city && (
        <p className="text-xs text-fg-subtle pl-2 mb-2 flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 text-rose-400">
            <path d="M5 1C3.34 1 2 2.34 2 4c0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4a1 1 0 110-2 1 1 0 010 2z" fill="currentColor" />
          </svg>
          <span className="text-fg-muted">{city}</span>
        </p>
      )}

      {/* Tags */}
      {hotel.Tags && hotel.Tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-2 mt-1">
          {hotel.Tags.slice(0, 3).map((tag: string) => {
            const tc = tagColor(tag)
            return (
              <span
                key={tag}
                className={cn(
                  'inline-flex items-center rounded-md border px-1.5 py-0 text-[9px] font-medium',
                  tc.bg, tc.text, tc.border
                )}
              >
                {tag}
              </span>
            )
          })}
          {hotel.Tags.length > 3 && (
            <span className="text-[9px] text-fg-subtle">+{hotel.Tags.length - 3}</span>
          )}
        </div>
      )}
    </Card>
  )
}

// ─── Document Overview Types & Data ───

type DocumentMeta = {
  id: string
  name: string
  source: string
  date: string
  description: string
  tags: string[]
  sourceUrl?: string
}

type IndustryDocuments = {
  [industryId: string]: {
    label: string
    description?: string
    documents: DocumentMeta[]
  }
}

// Accent bar colors per industry (left border, like HotelCard's category bar)
const industryAccentColors: Record<string, string> = {
  'financial': 'bg-green-500',
  'nasa': 'bg-cyan-500',
  'health-plan': 'bg-violet-500',
  'sustainable-ai': 'bg-emerald-500',
  'idfc-banking': 'bg-amber-500',
  'sharepoint-airline': 'bg-blue-500',
}

const industryDocuments: IndustryDocuments = {
  'financial': {
    label: 'Finance Knowledge Base',
    description: 'US SEC official investor guides and Vanguard market research reports. Covers mutual funds, ETFs, bond markets, portfolio construction, and 2025 economic outlook. All documents are publicly available from government and institutional sources.',
    documents: [
      {
        id: 'sec-mutual-funds',
        name: 'Mutual Funds & ETFs — A Guide for Investors',
        source: 'sec.gov',
        date: '2024',
        description: 'Comprehensive guide covering mutual fund and ETF investment basics, fees, and risks.',
        tags: ['Mutual Funds', 'ETFs', 'SEC'],
        sourceUrl: 'https://www.sec.gov/investor/pubs/sec-guide-to-mutual-funds.pdf'
      },
      {
        id: 'sec-saving-investing',
        name: 'Saving and Investing — A Roadmap',
        source: 'sec.gov',
        date: '2024',
        description: 'Step-by-step roadmap for building a savings and investment plan.',
        tags: ['Savings', 'Investing', 'Beginners'],
        sourceUrl: 'https://www.sec.gov/investor/pubs/sec-guide-to-savings-and-investing.pdf'
      },
      {
        id: 'sec-students',
        name: 'Saving and Investing for Students',
        source: 'sec.gov',
        date: '2024',
        description: 'Introduction to saving and investing tailored for students.',
        tags: ['Students', 'Financial Literacy'],
        sourceUrl: 'https://www.sec.gov/investor/pubs/savings-investing-for-students.pdf'
      },
      {
        id: 'vanguard-outlook',
        name: '2025 Economic & Market Outlook',
        source: 'vanguard.com',
        date: '2025',
        description: 'Global economic and market forecast for 2025 including rates, inflation, and growth.',
        tags: ['Outlook', 'Economy', 'Markets'],
        sourceUrl: 'https://corporate.vanguard.com/content/dam/corp/research/pdf/isg_vemo_2025.pdf'
      },
      {
        id: 'vanguard-fixed-income',
        name: 'Q1 2025 Fixed Income Perspectives',
        source: 'vanguard.com',
        date: 'Q1 2025',
        description: 'Bond market analysis with rate trajectory and credit spread outlook.',
        tags: ['Fixed Income', 'Bonds', 'Rates'],
        sourceUrl: 'https://corporate.vanguard.com/content/dam/corp/articles/pdf/afi_perspectives_q1_2025_a_real_deal.pdf'
      },
      {
        id: 'vanguard-workbook',
        name: 'Investing Foundations Workbook 2024',
        source: 'vanguard.com',
        date: '2024',
        description: 'Hands-on workbook covering core investing principles and portfolio construction.',
        tags: ['Workbook', 'Fundamentals'],
        sourceUrl: 'https://digital-assets.vanguard.com/retail/publicsite/en/documents/InvestingFoundationsWorkbook_2024%20v7.pdf'
      }
    ]
  },
  'nasa': {
    label: 'NASA Earth Science Knowledge Base',
    description: 'NASA\'s Earth at Night e-book (200 pages, 40MB PDF) — satellite observations of nighttime city lights, urbanization patterns, and climate change indicators. Page-split indexed to fit AI Search 16MB extraction limit. Part of the Azure AI Search official sample dataset with scientific imagery references.',
    documents: [
      {
        id: 'nasa-earth-at-night',
        name: 'Earth at Night',
        source: 'NASA (azure-search-sample-data)',
        date: '2019',
        description: 'Satellite observations of Earth at night — city lights, human activity patterns, and nighttime environmental phenomena.',
        tags: ['Satellite', 'Night Lights', 'Climate'],
        sourceUrl: 'https://github.com/Azure-Samples/azure-search-sample-data/tree/main/nasa-e-book'
      },
      {
        id: 'nasa-earth-book',
        name: 'NASA Earth Book 2019',
        source: 'NASA (azure-search-sample-data)',
        date: '2019',
        description: 'Comprehensive Earth science reference (200pp, page-split indexed) covering atmosphere, oceans, land, ice, and human impact from NASA observations.',
        tags: ['Earth Science', 'Atmosphere', 'Oceans', 'Research', '200 Pages'],
        sourceUrl: 'https://github.com/Azure-Samples/azure-search-sample-data/tree/main/nasa-e-book'
      }
    ]
  },
  'health-plan': {
    label: 'Health Plan Knowledge Base',
    description: 'Fictional Northwind and Contoso employee health insurance plans — coverage details, deductibles, wellness benefits, employee handbook, and role library. Azure AI Search official demo dataset used across Microsoft documentation and tutorials.',
    documents: [
      {
        id: 'hp-benefit-options',
        name: 'Benefit Options',
        source: 'Contoso (azure-search-sample-data)',
        date: 'Sample',
        description: 'Overview of all available health plan options with comparison of coverage levels and costs.',
        tags: ['Plans', 'Comparison', 'Coverage'],
        sourceUrl: 'https://github.com/Azure-Samples/azure-search-sample-data/blob/main/health-plan/Benefit_Options.pdf'
      },
      {
        id: 'hp-northwind-plus',
        name: 'Northwind Health Plus Benefits Details',
        source: 'Northwind (azure-search-sample-data)',
        date: 'Sample',
        description: 'Premium plan with comprehensive coverage — medical, dental, vision, prescription, and mental health.',
        tags: ['Northwind Plus', 'Premium', 'Full Coverage'],
        sourceUrl: 'https://github.com/Azure-Samples/azure-search-sample-data/blob/main/health-plan/Northwind_Health_Plus_Benefits_Details.pdf'
      },
      {
        id: 'hp-northwind-standard',
        name: 'Northwind Standard Benefits Details',
        source: 'Northwind (azure-search-sample-data)',
        date: 'Sample',
        description: 'Standard plan with essential coverage and lower premiums for cost-conscious employees.',
        tags: ['Northwind Standard', 'Essential', 'Budget'],
        sourceUrl: 'https://github.com/Azure-Samples/azure-search-sample-data/blob/main/health-plan/Northwind_Standard_Benefits_Details.pdf'
      },
      {
        id: 'hp-perksplus',
        name: 'PerksPlus',
        source: 'Contoso (azure-search-sample-data)',
        date: 'Sample',
        description: 'Employee wellness and perks program — gym memberships, wellness reimbursements, and lifestyle benefits.',
        tags: ['Wellness', 'Perks', 'Lifestyle'],
        sourceUrl: 'https://github.com/Azure-Samples/azure-search-sample-data/blob/main/health-plan/PerksPlus.pdf'
      },
      {
        id: 'hp-employee-handbook',
        name: 'Employee Handbook',
        source: 'Contoso (azure-search-sample-data)',
        date: 'Sample',
        description: 'Company policies, code of conduct, leave policies, and workplace guidelines.',
        tags: ['Policies', 'HR', 'Handbook'],
        sourceUrl: 'https://github.com/Azure-Samples/azure-search-sample-data/blob/main/health-plan/employee_handbook.pdf'
      },
      {
        id: 'hp-role-library',
        name: 'Role Library',
        source: 'Contoso (azure-search-sample-data)',
        date: 'Sample',
        description: 'Job descriptions, role responsibilities, career levels, and competency frameworks.',
        tags: ['Roles', 'Careers', 'Competencies'],
        sourceUrl: 'https://github.com/Azure-Samples/azure-search-sample-data/blob/main/health-plan/role_library.pdf'
      }
    ]
  },
  'sustainable-ai': {
    label: 'Sustainable AI Knowledge Base',
    description: 'Microsoft\'s 2025 research report on accelerating sustainability with AI. Covers energy efficiency metrics, carbon tracking frameworks, green computing practices, and environmental impact measurement. Includes diagrams and charts processed via OCR.',
    documents: [
      {
        id: 'sai-accelerating',
        name: 'Accelerating Sustainability with AI 2025',
        source: 'Microsoft (azure-search-sample-data)',
        date: '2025',
        description: 'Research report on AI-driven sustainability — energy efficiency, carbon tracking, green computing, and environmental impact measurement.',
        tags: ['Sustainability', 'Green AI', 'Energy', 'Carbon'],
        sourceUrl: 'https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/msc/documents/presentations/CSR/Accelerating-Sustainability-with-AI-2025.pdf'
      }
    ]
  },
  'idfc-banking': {
    label: 'IDFC Banking Knowledge Base',
    description: 'IDFC First Bank investor presentations (Q3 FY26), integrated annual report (FY25), and Reserve Bank of India (RBI) digital payment authentication regulations. Real-world banking KPIs, ESG strategy, and regulatory compliance documents from India\'s financial sector.',
    documents: [
      {
        id: 'idfc-investor-pres',
        name: 'IDFC Investor Presentation Q3 FY26',
        source: 'idfcfirst.bank.in',
        date: 'Jan 2026',
        description: 'Latest quarterly results — NIM 5.76%, CASA 51.6%, 1,066 branches, deposit growth 25% YoY.',
        tags: ['Q3 FY26', 'KPI', 'NIM', 'CASA'],
        sourceUrl: 'https://www.idfcfirst.bank.in/content/dam/idfcfirstbank/pdf/financial-results/Investor-Presentation-Q3-FY26-updated-Final.pdf'
      },
      {
        id: 'idfc-annual-report',
        name: 'IDFC Integrated Annual Report FY 2024-25',
        source: 'idfcfirst.bank.in',
        date: 'FY25',
        description: 'Full-year strategy, ESG initiatives, digital transformation, and microfinance portfolio review.',
        tags: ['Strategy', 'ESG', 'Digital'],
        sourceUrl: 'https://www.idfcfirst.bank.in/content/dam/idfcfirstbank/pdf/annual-report/INTEGRATED-ANNUAL-REPORT-FY-2024-25.pdf'
      },
      {
        id: 'rbi-auth-directions',
        name: 'RBI Digital Payment Authentication Directions 2025',
        source: 'rbi.org.in',
        date: 'Sep 2025',
        description: 'Mandatory 2FA and risk-based authentication for all digital payments. Effective April 1, 2026.',
        tags: ['RBI', 'Compliance', 'Authentication', 'Apr 2026'],
        sourceUrl: 'https://rbidocs.rbi.org.in/rdocs/notification/PDFs/NT79258FF36ECA8F4886B3B01F55D166C2B2.PDF'
      }
    ]
  },
  'sharepoint-airline': {
    label: 'Airline Policies Knowledge Base',
    description: 'US Department of Transportation (DOT) official airline passenger rights documents — ANPRM proposed compensation rules, Fly Rights consumer guide, Congressional Research Service regulatory analysis, and involuntary denied boarding (bumping) policies. Indexed from SharePoint via the Phase 2 connector.',
    documents: [
      {
        id: 'anprm-airline-rights',
        name: 'ANPRM: Airline Passenger Rights (2105-AF20)',
        source: 'US DOT (transportation.gov)',
        date: '2024',
        description: 'Proposed rules for cash compensation, rebooking requirements, meals/lodging for delays, and disability protections.',
        tags: ['ANPRM', 'Compensation', 'DOT'],
        sourceUrl: 'https://www.transportation.gov/sites/dot.gov/files/2024-12/ANPRM%20Airline%20Passenger%20Rights%20(2105-AF20).pdf'
      },
      {
        id: 'fly-rights-guide',
        name: 'Fly Rights: Consumer Guide to Air Travel',
        source: 'US DOT (transportation.gov)',
        date: '2024',
        description: 'Official consumer guide covering overbooking/bumping compensation, baggage rules, tarmac delays, and complaint procedures.',
        tags: ['Consumer Guide', 'Bumping', 'Tarmac'],
        sourceUrl: 'https://www.transportation.gov/airconsumer/fly-rights'
      },
      {
        id: 'crs-passenger-rights',
        name: 'CRS Report: Airline Passenger Rights (R43078)',
        source: 'Congressional Research Service',
        date: '2024',
        description: 'Federal regulatory framework analysis — DOT authority, denied boarding compensation history, and EU regulation comparison.',
        tags: ['CRS', 'Regulation', 'EU Comparison'],
        sourceUrl: 'https://crsreports.congress.gov/product/pdf/R/R43078'
      },
      {
        id: 'bumping-oversales',
        name: 'Bumping & Oversales Policy',
        source: 'US DOT (transportation.gov)',
        date: '2024',
        description: 'DOT rules on involuntary denied boarding, compensation tiers, and airline obligations when flights are oversold.',
        tags: ['Oversales', 'Denied Boarding', 'DOT'],
        sourceUrl: 'https://www.transportation.gov/individuals/aviation-consumer-protection/bumping-oversales'
      }
    ]
  }
}

// Map agentName (KB id) → industry id
const agentToIndustry: Record<string, string> = {
  'hotels-knowledge-base': 'hotels',
  'financial-knowledge-base': 'financial',
  'nasa-earth-book': 'nasa',
  'health-plan-kb': 'health-plan',
  'sustainable-ai-kb': 'sustainable-ai',
  'idfc-banking-kb': 'idfc-banking',
  'sp-airline-policies-kb': 'sharepoint-airline',
}

function DocumentOverviewCard({ doc, industryId }: { doc: DocumentMeta; industryId: string }) {
  const accent = industryAccentColors[industryId] || 'bg-fg-subtle'

  return (
    <Card className="group relative p-4 hover:bg-bg-hover transition-all duration-200 overflow-hidden glass-surface">
      {/* Accent bar */}
      <div className={cn('absolute top-0 left-0 w-1 h-full rounded-l-lg', accent)} />

      <div className="pl-2">
        {/* Header: PDF icon + Name */}
        <div className="flex items-start gap-2 mb-2">
          <span className="text-base shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-red-400">
              <path d="M4 1h5.5L13 4.5V13a2 2 0 01-2 2H4a2 2 0 01-2-2V3a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <path d="M9 1v4h4" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <text x="3.5" y="12" fontSize="5" fontWeight="bold" fill="currentColor">PDF</text>
            </svg>
          </span>
          <h4 className="text-sm font-semibold text-fg-default line-clamp-2 flex-1">{doc.name}</h4>
        </div>

        {/* Source + Date row */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-fg-subtle flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
              <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1" fill="none" />
              <path d="M5 1C5 1 2 4 2 5.5S3.5 9 5 9s3-2 3-3.5S5 1 5 1z" stroke="currentColor" strokeWidth="0.7" fill="none" />
              <line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="0.7" />
            </svg>
            {doc.source}
          </span>
          <span className={cn(
            'inline-flex items-center rounded-full px-1.5 py-0 text-[9px] font-semibold',
            'bg-accent-subtle text-accent'
          )}>
            {doc.date}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-fg-muted line-clamp-2 mb-2">{doc.description}</p>

        {/* Tags */}
        {doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {doc.tags.map((tag) => {
              const tc = tagColor(tag)
              return (
                <span
                  key={tag}
                  className={cn(
                    'inline-flex items-center rounded-md border px-1.5 py-0 text-[9px] font-medium',
                    tc.bg, tc.text, tc.border
                  )}
                >
                  {tag}
                </span>
              )
            })}
          </div>
        )}

        {/* Source Link */}
        {doc.sourceUrl && (
          <a
            href={doc.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-[10px] text-accent hover:text-accent-hover transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
              <path d="M8 5.5V8a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1h2.5M6 1h3v3M4 6l5-5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            View source
          </a>
        )}
      </div>
    </Card>
  )
}

// ─── Main DataExplorer Component ───

interface DataExplorerProps {
  agentId?: string
}

export function DataExplorer({ agentId }: DataExplorerProps) {
  const industryId = agentId ? (agentToIndustry[agentId] || null) : null
  const isHotels = !industryId || industryId === 'hotels'
  const industryData = industryId ? industryDocuments[industryId] : null

  // Hotels state (only used when isHotels)
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isHotels) {
      setLoading(false)
      return
    }
    const fetchData = async () => {
      try {
        setLoading(true)
        const resp = await fetch('/api/search-docs?index=hotels-sample&top=50')
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const data = await resp.json()
        setHotels(data.value || [])
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error'
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isHotels])

  if (isHotels && error) {
    return (
      <div className="flex items-center justify-center h-full text-fg-muted text-sm">
        Failed to load data: {error}
      </div>
    )
  }

  // Hotels mode — original rendering
  if (isHotels) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b border-stroke-divider space-y-1">
          <div className="text-xs text-fg-muted font-medium">
            {loading ? 'Loading...' : `${hotels.length} hotels in Knowledge Base`}
          </div>
          <p className="text-[11px] text-fg-subtle leading-relaxed">
            50 sample hotels from the Azure AI Search hotels-sample index — ratings, rooms, amenities, locations, and pricing across Budget, Boutique, Resort, Luxury, Suite, and Extended-Stay categories.
          </p>
          <a
            href="https://github.com/Azure-Samples/azure-search-sample-data/tree/main/hotels"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-accent hover:text-accent-hover transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
              <path d="M8 5.5V8a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1h2.5M6 1h3v3M4 6l5-5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            View source dataset
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 overflow-y-auto flex-1">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : hotels.map((hotel) => <HotelCard key={hotel.HotelId} hotel={hotel} />)
          }
        </div>
      </div>
    )
  }

  // Document overview mode — non-Hotels industries
  const docs = industryData?.documents || []
  const label = industryData?.label || 'Knowledge Base'
  const countText = docs.length === 1
    ? `1 document in ${label}`
    : `${docs.length} documents in ${label}`

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-stroke-divider space-y-1">
        <div className="text-xs text-fg-muted font-medium">{countText}</div>
        {industryData?.description && (
          <p className="text-[11px] text-fg-subtle leading-relaxed">{industryData.description}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 overflow-y-auto flex-1">
        {docs.map((doc) => (
          <DocumentOverviewCard key={doc.id} doc={doc} industryId={industryId!} />
        ))}
      </div>
    </div>
  )
}
