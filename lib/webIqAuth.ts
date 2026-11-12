import { tokenManager } from '@/lib/token-manager';
import { WEB_IQ_SEARCH_ENDPOINT } from '@/lib/webIqSearch';

export type WebIqEndpoint = 'web' | 'browse' | 'auto';
const ENDPOINTS: Record<WebIqEndpoint, string> = {
  web: WEB_IQ_SEARCH_ENDPOINT,
  browse: 'https://api.microsoft.ai/v3/browse',
  auto: 'https://api.microsoft.ai/v3/auto',
};

const WEB_IQ_SCOPE = 'https://api.microsoft.ai/.default';

function authMethod(): string {
  return process.env.WEBIQ_AUTH_METHOD?.trim() || 'api-key';
}

/** Configuration only; Web IQ AppID binding and permissions still require a live check. */
export function isWebIqConfigured(): boolean {
  const method = authMethod();
  if (method === 'api-key') return Boolean(process.env.WEBIQ_API_KEY?.trim());
  if (method !== 'entra') return false;

  // Require app-only credentials, so missing settings cannot fall back to an Azure CLI user.
  return (process.env.AZURE_AUTH_METHOD || 'service-principal') === 'service-principal'
    && Boolean(process.env.AZURE_TENANT_ID?.trim())
    && Boolean(process.env.AZURE_CLIENT_ID?.trim())
    && Boolean(process.env.AZURE_CLIENT_SECRET?.trim())
    && tokenManager.isServicePrincipalCredential();
}

function awaitToken(promise: Promise<string>, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(new Error('Request aborted'));
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      token => { signal.removeEventListener('abort', onAbort); resolve(token); },
      error => { signal.removeEventListener('abort', onAbort); reject(error); },
    );
    if (signal.aborted) onAbort();
  });
}

/** Server-side credentials for the selected Web IQ authentication method. */
export async function getWebIqRequestAuth(signal: AbortSignal, endpoint: WebIqEndpoint = 'web'): Promise<{
  url: string;
  headers: Record<string, string>;
}> {
  if (!Object.prototype.hasOwnProperty.call(ENDPOINTS, endpoint)) throw new Error('Invalid Web IQ endpoint.');
  if (signal.aborted) throw new Error('Request aborted');
  if (!isWebIqConfigured()) throw new Error('Live Web IQ search is not configured.');

  if (authMethod() === 'api-key') {
    // API keys already select an AppID; an APPID query parameter is invalid for key auth.
    return { url: ENDPOINTS[endpoint], headers: { 'x-apikey': process.env.WEBIQ_API_KEY!.trim() } };
  }

  const url = new URL(ENDPOINTS[endpoint]);
  const appId = process.env.WEBIQ_APP_ID?.trim();
  if (appId) url.searchParams.set('APPID', appId);
  const token = await awaitToken(tokenManager.getToken(WEB_IQ_SCOPE), signal);
  if (signal.aborted) throw new Error('Request aborted');
  return { url: url.href, headers: { Authorization: `Bearer ${token}` } };
}
