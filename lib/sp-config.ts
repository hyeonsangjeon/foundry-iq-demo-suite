export const SP_DEMO_MODE = process.env.NEXT_PUBLIC_SP_DEMO_MODE === 'true' ||
  !process.env.SP_APP_ID

// Tier 1: Live mode is not available (no SP Tenant)
// Tier 2: Set to true when SP_APP_ID is configured
export const SP_LIVE_AVAILABLE = !!process.env.NEXT_PUBLIC_SP_LIVE_AVAILABLE

export const SP_CONFIG = {
  mockBasePath: '/mock',
  pollingIntervalMs: 5000,
  mockDurationMs: 40000,
  kbName: 'finance-knowledge-base',
  spKbDisplayName: 'SharePoint Finance KB',
}
