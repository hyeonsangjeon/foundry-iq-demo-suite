// SP_DEMO_MODE: true when SP credentials are missing → ?mode=live still returns mock
export const SP_DEMO_MODE = !process.env.SP_APP_ID

// Tier 2: Set to true when SP_APP_ID is configured
export const SP_LIVE_AVAILABLE = !!process.env.NEXT_PUBLIC_SP_LIVE_AVAILABLE

export const SP_CONFIG = {
  mockBasePath: '/mock',
  pollingIntervalMs: 5000,
  mockDurationMs: 40000,
  kbName: 'sp-airline-policies-kb',
  spKbDisplayName: 'SharePoint Airline KB',
}

// Live mode authentication (client-side — bundled into client JS for demo gating)
export const SP_LIVE_SECRET = 'gbb2026!'

// Server-side secret for live API authentication (not exposed to client bundle)
export const SP_LIVE_API_SECRET = process.env.SP_LIVE_API_SECRET || 'gbb2026!'
