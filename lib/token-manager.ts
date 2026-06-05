import { ClientSecretCredential, DefaultAzureCredential, ManagedIdentityCredential } from '@azure/identity'

class TokenManager {
  private static instance: TokenManager
  private credential: ClientSecretCredential | DefaultAzureCredential | ManagedIdentityCredential | null = null
  // Per-scope token cache. Different Azure data planes require different
  // audiences (e.g. ai.azure.com vs search.azure.com), so we cache one
  // token per scope instead of a single shared token.
  private cachedTokens: Map<string, { token: string; expiresOn: Date }> = new Map()
  private readonly scope = 'https://ai.azure.com/.default'
  // Azure AI Search data-plane scope (RBAC / Entra ID auth for retrieve, etc.)
  private readonly searchScope = 'https://search.azure.com/.default'

  private constructor() {
    this.initializeCredential()
  }

  private initializeCredential() {
    const authMethod = process.env.AZURE_AUTH_METHOD || 'service-principal'

    try {
      switch (authMethod) {
        case 'service-principal':
          // Use service principal for local development and deployment
          const tenantId = process.env.AZURE_TENANT_ID
          const clientId = process.env.AZURE_CLIENT_ID
          const clientSecret = process.env.AZURE_CLIENT_SECRET

          if (!tenantId || !clientId || !clientSecret) {
            console.warn('Service principal credentials not found, falling back to DefaultAzureCredential')
            this.credential = new DefaultAzureCredential()
          } else {
            console.log('Using Service Principal authentication')
            this.credential = new ClientSecretCredential(tenantId, clientId, clientSecret)
          }
          break

        case 'managed-identity':
          // Use managed identity for Azure deployment
          console.log('Using Managed Identity authentication')
          const managedIdentityClientId = process.env.AZURE_MANAGED_IDENTITY_CLIENT_ID
          this.credential = managedIdentityClientId
            ? new ManagedIdentityCredential(managedIdentityClientId)
            : new ManagedIdentityCredential()
          break

        default:
          // Use DefaultAzureCredential which tries multiple auth methods
          console.log('Using Default Azure Credential (tries multiple methods)')
          this.credential = new DefaultAzureCredential()
      }
    } catch (error) {
      console.error('Failed to initialize credential:', error)
      // Fall back to DefaultAzureCredential as last resort
      this.credential = new DefaultAzureCredential()
    }
  }

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager()
    }
    return TokenManager.instance
  }

  public async getToken(scope: string = this.scope): Promise<string> {
    // Check if we have a cached token for this scope that's still valid
    const cached = this.cachedTokens.get(scope)
    if (cached) {
      const now = new Date()
      const expiresOn = new Date(cached.expiresOn)

      // Refresh token if it expires in less than 5 minutes
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

      if (expiresOn > fiveMinutesFromNow) {
        console.log(`Using cached token for scope ${scope}`)
        return cached.token
      }
    }

    // Get a fresh token
    try {
      if (!this.credential) {
        throw new Error('Azure credential not initialized')
      }

      console.log(`Fetching new token from Azure AD for scope ${scope}...`)
      const tokenResponse = await this.credential.getToken(scope)

      if (!tokenResponse) {
        throw new Error('Failed to get token from Azure AD')
      }

      // Cache the token for this scope
      const entry = {
        token: tokenResponse.token,
        expiresOn: tokenResponse.expiresOnTimestamp
          ? new Date(tokenResponse.expiresOnTimestamp)
          : new Date(Date.now() + 60 * 60 * 1000) // Default to 1 hour if not provided
      }
      this.cachedTokens.set(scope, entry)

      console.log(`Token refreshed for scope ${scope}, expires at ${entry.expiresOn.toISOString()}`)
      return entry.token
    } catch (error) {
      console.error('Failed to get Azure AD token:', error)

      // If we still have a cached token (even if expired), return it as fallback
      const stale = this.cachedTokens.get(scope)
      if (stale) {
        console.warn('Using expired cached token as fallback')
        return stale.token
      }

      throw new Error(`Failed to get Azure AD token: ${error.message}`)
    }
  }

  // Get a token scoped to the Azure AI Search data plane (RBAC / Entra ID auth).
  public async getSearchToken(): Promise<string> {
    return this.getToken(this.searchScope)
  }

  // Force refresh the token for a given scope
  public async refreshToken(scope: string = this.scope): Promise<string> {
    this.cachedTokens.delete(scope)
    return this.getToken(scope)
  }

  // Check if token needs refresh for a given scope
  public needsRefresh(scope: string = this.scope): boolean {
    const cached = this.cachedTokens.get(scope)
    if (!cached) return true

    const now = new Date()
    const expiresOn = new Date(cached.expiresOn)
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

    return expiresOn <= fiveMinutesFromNow
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance()

// Export a helper function for API routes
export async function getFoundryBearerToken(): Promise<string> {
  // First check if we're using a static token (for backwards compatibility)
  const staticToken = process.env.FOUNDRY_BEARER_TOKEN
  if (staticToken && staticToken.length > 100) { // Assume static tokens are JWT format (long)
    return staticToken
  }

  // Otherwise use the token manager for auto-refresh
  return tokenManager.getToken()
}