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

// Live mode authentication (client-side — requires NEXT_PUBLIC_ prefix to be available in browser)
export const SP_LIVE_SECRET = process.env.NEXT_PUBLIC_SP_LIVE_SECRET || ''

// Server-side secret for live API authentication (server-only, never exposed to client)
export const SP_LIVE_API_SECRET = process.env.SP_LIVE_API_SECRET || ''

// Set to false to bypass password prompt for demo/presentation use
export const REQUIRE_LIVE_SECRET = false
