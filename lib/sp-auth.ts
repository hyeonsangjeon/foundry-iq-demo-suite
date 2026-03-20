// lib/sp-auth.ts

let cachedToken: { token: string; expiresAt: number } | null = null

export async function getSPAccessToken(): Promise<string> {
  const tenantId = process.env.SP_TENANT_ID
  const clientId = process.env.SP_APP_ID
  const clientSecret = process.env.SP_APP_SECRET

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Missing SP auth environment variables (SP_TENANT_ID, SP_APP_ID, SP_APP_SECRET)')
  }

  // Return cached token if still valid (5 min buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 5 * 60 * 1000) {
    return cachedToken.token
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
  })

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Failed to acquire SP access token: ${res.status} ${errorText}`)
  }

  const data = await res.json()

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  return cachedToken.token
}
