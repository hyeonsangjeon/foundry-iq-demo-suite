// lib/sp-search-auth.ts

const DEFAULT_API_VERSION = '2024-11-01-preview'

export async function searchApiCall(
  path: string,
  method: string,
  body?: any,
  apiVersion?: string
): Promise<any> {
  const endpoint = process.env.AZURE_SEARCH_ENDPOINT?.replace(/\/$/, '')
  const apiKey = process.env.AZURE_SEARCH_API_KEY

  if (!endpoint || !apiKey) {
    throw new Error('Missing AZURE_SEARCH_ENDPOINT or AZURE_SEARCH_API_KEY')
  }

  const version = apiVersion || DEFAULT_API_VERSION
  const url = `${endpoint}${path}?api-version=${version}`

  const headers: Record<string, string> = {
    'api-key': apiKey,
    'Content-Type': 'application/json',
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`AI Search API error: ${res.status} ${path} — ${errorText}`)
  }

  // Some responses may be empty (204, 202)
  if (res.status === 204 || res.status === 202) return null

  const text = await res.text()
  return text ? JSON.parse(text) : null
}
