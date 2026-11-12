/** Public product documentation only. These records do not attest tenant access or API success. */
export const SERVICE_DOCUMENT_CHECKED_AT = '2026-11-12';

type Copy = { en: string; ko: string };
export type ServiceFeatureId =
  | 'web-search' | 'browse-passage' | 'auto' | 'weather'
  | 'kb-retrieval' | 'answer-synthesis' | 'learn-mcp' | 'search-mcp'
  | 'graph-files' | 'sharepoint-indexer' | 'onelake' | 'ontology'
  | 'agent-service' | 'bot-check' | 'search-index' | 'blob-source'
  | 'web-source' | 'remote-sharepoint';

export interface ServiceReference {
  serviceId: string;
  serviceName: string;
  featureName: string;
  provider: 'Microsoft' | 'Cloudflare';
  role: Copy;
  productStatus: Copy;
  overviewUrl: string;
  featureUrl: string;
  apiUrl: string;
  pricingAccessUrl: string;
  sourceIds: string[];
  statusCheckedAt: string;
}

const urls = {
  S101: 'https://learn.microsoft.com/en-us/web-iq/overview',
  S102: 'https://learn.microsoft.com/en-us/web-iq/reference/web-search',
  S103: 'https://learn.microsoft.com/en-us/web-iq/reference/browse',
  S104: 'https://learn.microsoft.com/en-us/web-iq/concepts/content-formats',
  S105: 'https://learn.microsoft.com/en-us/web-iq/reference/auto',
  S106: 'https://learn.microsoft.com/en-us/web-iq/resources/faq',
  S107: 'https://learn.microsoft.com/en-us/web-iq/resources/pricing',
  S108: 'https://aka.ms/webiq-support-form',
  S109: 'https://learn.microsoft.com/en-us/azure/search/search-what-is-azure-search',
  S110: 'https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-how-to-migrate',
  S111: 'https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-overview',
  S112: 'https://learn.microsoft.com/en-us/rest/api/searchservice/knowledge-retrieval/retrieve?view=rest-searchservice-2026-04-01',
  S113: 'https://azure.microsoft.com/en-us/pricing/details/search/',
  S114: 'https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure',
  S115: 'https://learn.microsoft.com/en-us/rest/api/microsoft-foundry/azureopenai/chat',
  S116: 'https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/',
  S117: 'https://learn.microsoft.com/en-us/training/support/mcp',
  S118: 'https://learn.microsoft.com/en-us/training/support/mcp-developer-reference',
  S119: 'https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-mcp-server',
  S120: 'https://learn.microsoft.com/en-us/graph/overview',
  S121: 'https://learn.microsoft.com/en-us/graph/api/driveitem-list-children?view=graph-rest-1.0',
  S122: 'https://learn.microsoft.com/en-us/azure/search/search-how-to-index-sharepoint-online',
  S123: 'https://learn.microsoft.com/en-us/fabric/onelake/onelake-overview',
  S124: 'https://learn.microsoft.com/en-us/fabric/iq/ontology/overview',
  S125: 'https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-fabric-ontology',
  S126: 'https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-onelake',
  S127: 'https://azure.microsoft.com/en-us/pricing/details/microsoft-fabric/',
  S128: 'https://developers.cloudflare.com/turnstile/',
  S129: 'https://developers.cloudflare.com/turnstile/get-started/server-side-validation/',
  S130: 'https://developers.cloudflare.com/turnstile/plans/',
  S131: 'https://learn.microsoft.com/en-us/azure/foundry/agents/overview',
  S132: 'https://learn.microsoft.com/en-us/azure/foundry/agents/quickstarts/prompt-agent',
  S133: 'https://azure.microsoft.com/en-us/pricing/details/microsoft-foundry/',
  S134: 'https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction',
  S135: 'https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-search-index',
  S136: 'https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-blob',
  S137: 'https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-web',
  S138: 'https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-sharepoint-remote',
} as const;
export const SERVICE_DOCUMENT_URLS = urls;

// Static public-document GET results; not service integration results.
export const SERVICE_DOCUMENT_CHECKS = {
  S101: {"httpStatus": 200, "title": "Microsoft Web IQ overview | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/web-iq/overview", "checkedAt": "2026-11-12"},
  S102: {"httpStatus": 200, "title": "Web Search REST API reference | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/web-iq/reference/web-search", "checkedAt": "2026-11-12"},
  S103: {"httpStatus": 200, "title": "Browse REST API reference | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/web-iq/reference/browse", "checkedAt": "2026-11-12"},
  S104: {"httpStatus": 200, "title": "Passages and content formats in Microsoft Web IQ | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/web-iq/concepts/content-formats", "checkedAt": "2026-11-12"},
  S105: {"httpStatus": 200, "title": "Auto REST API reference (Beta) | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/web-iq/reference/auto", "checkedAt": "2026-11-12"},
  S106: {"httpStatus": 200, "title": "Microsoft Web IQ frequently asked questions | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/web-iq/resources/faq", "checkedAt": "2026-11-12"},
  S107: {"httpStatus": 200, "title": "Microsoft Web IQ pricing | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/web-iq/resources/pricing", "checkedAt": "2026-11-12"},
  S108: {"httpStatus": 200, "title": "Engage Center", "finalUrl": "https://engagecenter.microsoft.com/#view/Microsoft_AzureCXP_EngageHub/EngageHubMenu.MenuView/~/helpSupport/targetExperience/sfb/sapId/143d582a-dc9f-f111-b8dc-70a8a58bc692", "checkedAt": "2026-11-12"},
  S109: {"httpStatus": 200, "title": "Introduction to Azure AI Search - Azure AI Search | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/azure/search/search-what-is-azure-search", "checkedAt": "2026-11-12"},
  S110: {"httpStatus": 200, "title": "Migrate Agentic Retrieval Code - Azure AI Search | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-how-to-migrate", "checkedAt": "2026-11-12"},
  S111: {"httpStatus": 200, "title": "Agentic Retrieval Overview - Azure AI Search | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-overview", "checkedAt": "2026-11-12"},
  S112: {"httpStatus": 200, "title": "Knowledge Retrieval - Retrieve - REST API (Azure Search Service) | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/rest/api/searchservice/knowledge-retrieval/retrieve?view=rest-searchservice-2026-04-01", "checkedAt": "2026-11-12"},
  S113: {"httpStatus": 200, "title": "Pricing - Foundry IQ | Microsoft Azure", "finalUrl": "https://azure.microsoft.com/en-us/pricing/details/search/", "checkedAt": "2026-11-12"},
  S114: {"httpStatus": 200, "title": "Foundry Models sold by Azure - Microsoft Foundry | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure", "checkedAt": "2026-11-12"},
  S115: {"httpStatus": 200, "title": "Microsoft Foundry REST Reference - Azure OpenAI - Chat | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/rest/api/microsoft-foundry/azureopenai/chat", "checkedAt": "2026-11-12"},
  S116: {"httpStatus": 200, "title": "Azure OpenAI Service - Pricing | Microsoft Azure", "finalUrl": "https://azure.microsoft.com/en-us/pricing/details/azure-openai/", "checkedAt": "2026-11-12"},
  S117: {"httpStatus": 200, "title": "Microsoft Learn MCP Server overview | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/training/support/mcp", "checkedAt": "2026-11-12"},
  S118: {"httpStatus": 200, "title": "Microsoft Learn MCP Server developer reference documentation | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/training/support/mcp-developer-reference", "checkedAt": "2026-11-12"},
  S119: {"httpStatus": 200, "title": "Create an MCP Server Knowledge Source - Azure AI Search | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-mcp-server", "checkedAt": "2026-11-12"},
  S120: {"httpStatus": 200, "title": "Microsoft Graph overview - Microsoft Graph | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/graph/overview", "checkedAt": "2026-11-12"},
  S121: {"httpStatus": 200, "title": "List the contents of a folder - Microsoft Graph v1.0 | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/graph/api/driveitem-list-children?view=graph-rest-1.0", "checkedAt": "2026-11-12"},
  S122: {"httpStatus": 200, "title": "SharePoint in Microsoft 365 Indexer - Azure AI Search | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/azure/search/search-how-to-index-sharepoint-online", "checkedAt": "2026-11-12"},
  S123: {"httpStatus": 200, "title": "OneLake, the unified data lake - Microsoft Fabric | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/fabric/onelake/onelake-overview", "checkedAt": "2026-11-12"},
  S124: {"httpStatus": 200, "title": "What Is Ontology (Preview)? - Microsoft Fabric | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/fabric/iq/ontology/overview", "checkedAt": "2026-11-12"},
  S125: {"httpStatus": 200, "title": "Create a Fabric Ontology Knowledge Source - Azure AI Search | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-fabric-ontology", "checkedAt": "2026-11-12"},
  S126: {"httpStatus": 200, "title": "Create an Indexed OneLake Knowledge Source for Agentic Retrieval - Azure AI Search | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-onelake", "checkedAt": "2026-11-12"},
  S127: {"httpStatus": 200, "title": "Microsoft Fabric - Pricing | Microsoft Azure", "finalUrl": "https://azure.microsoft.com/en-us/pricing/details/microsoft-fabric/", "checkedAt": "2026-11-12"},
  S128: {"httpStatus": 200, "title": "Overview · Cloudflare Turnstile docs", "finalUrl": "https://developers.cloudflare.com/turnstile/", "checkedAt": "2026-11-12"},
  S129: {"httpStatus": 200, "title": "Validate the token · Cloudflare Turnstile docs", "finalUrl": "https://developers.cloudflare.com/turnstile/get-started/server-side-validation/", "checkedAt": "2026-11-12"},
  S130: {"httpStatus": 200, "title": "Cloudflare Turnstile plans · Cloudflare Turnstile docs", "finalUrl": "https://developers.cloudflare.com/turnstile/plans/", "checkedAt": "2026-11-12"},
  S131: {"httpStatus": 200, "title": "What is Microsoft Foundry Agent Service? - Microsoft Foundry | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/azure/foundry/agents/overview", "checkedAt": "2026-11-12"},
  S132: {"httpStatus": 200, "title": "Quickstart: Create a prompt agent - Microsoft Foundry | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/azure/foundry/agents/quickstarts/prompt-agent", "checkedAt": "2026-11-12"},
  S133: {"httpStatus": 200, "title": "Microsoft Foundry - Pricing | Microsoft Azure", "finalUrl": "https://azure.microsoft.com/en-us/pricing/details/microsoft-foundry/", "checkedAt": "2026-11-12"},
  S134: {"httpStatus": 200, "title": "Introduction to Blob (object) Storage - Azure Storage | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction", "checkedAt": "2026-11-12"},
  S135: {"httpStatus": 200, "title": "Create a Search Index Knowledge Source - Azure AI Search | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-search-index", "checkedAt": "2026-11-12"},
  S136: {"httpStatus": 200, "title": "Create a Blob Knowledge Source for Agentic Retrieval - Azure AI Search | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-blob", "checkedAt": "2026-11-12"},
  S137: {"httpStatus": 200, "title": "Create Web Knowledge Source for Agentic Retrieval - Azure AI Search | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-web", "checkedAt": "2026-11-12"},
  S138: {"httpStatus": 200, "title": "Create a SharePoint (Remote) Knowledge Source - Azure AI Search | Microsoft Learn", "finalUrl": "https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-sharepoint-remote", "checkedAt": "2026-11-12"},
} as const;

type SourceId = keyof typeof urls;
function reference(
  serviceId: string, serviceName: string, featureName: string, role: Copy,
  productStatus: Copy, overview: SourceId, feature: SourceId, api: SourceId,
  pricing: SourceId, extra: SourceId[] = [], provider: ServiceReference['provider'] = 'Microsoft',
): ServiceReference {
  return {
    serviceId, serviceName, featureName, provider, role, productStatus,
    overviewUrl: urls[overview], featureUrl: urls[feature], apiUrl: urls[api], pricingAccessUrl: urls[pricing],
    sourceIds: Array.from(new Set([overview, feature, api, pricing, ...extra])),
    statusCheckedAt: SERVICE_DOCUMENT_CHECKED_AT,
  };
}
const ga = { en: 'GA', ko: 'GA' };
const preview = { en: 'Preview', ko: '미리 보기' };
const beta = { en: 'Beta · AppID access not verified', ko: '베타 · AppID 접근 미확인' };
const versioned = { en: 'Availability depends on feature and API version', ko: '기능·API 버전별 지원 범위 확인 필요' };

export const WEB_IQ_SERVICE_REFERENCES: Record<ServiceFeatureId, ServiceReference> = {
  'web-search': reference('webiq', 'Microsoft Web IQ', 'Web Search', { en: 'Finds public-web evidence; answer generation is separate.', ko: '공개 웹 근거를 검색합니다. 답변 생성은 별도 단계입니다.' }, ga, 'S101', 'S102', 'S102', 'S107', ['S106']),
  'browse-passage': reference('webiq', 'Microsoft Web IQ', 'Browse passage', { en: 'Retrieves a query-relevant passage from the selected web source, subject to publisher policies.', ko: '선택한 웹 출처에서 질문과 관련된 본문 일부를 가져옵니다. 발행자 정책에 따라 제한됩니다.' }, ga, 'S101', 'S103', 'S103', 'S107', ['S104', 'S106']),
  auto: reference('webiq', 'Microsoft Web IQ', 'Auto', { en: 'Optional typed evidence. Disabled until AppID access, pricing and runtime are verified.', ko: '구조화된 근거를 제공하는 선택 기능입니다. AppID 접근·가격·실제 응답 확인 전에는 비활성입니다.' }, beta, 'S101', 'S105', 'S105', 'S107', ['S106', 'S108']),
  weather: reference('webiq', 'Microsoft Web IQ', 'Auto weather evidence', { en: 'Weather evidence inside Auto; no independent Weather endpoint is connected.', ko: 'Auto 안의 날씨 근거입니다. 독립 Weather API가 연결된 기능은 아닙니다.' }, beta, 'S101', 'S105', 'S105', 'S107', ['S106']),
  'kb-retrieval': reference('azure-ai-search', 'Azure AI Search', 'Knowledge retrieval', { en: 'Retrieves knowledge-base content, citations and activity. Minimal retrieval and preview synthesis have different contracts.', ko: '지식 베이스 자료·인용·조회 과정을 가져옵니다. 최소 검색과 미리 보기 답변 합성의 계약은 다릅니다.' }, versioned, 'S109', 'S111', 'S112', 'S113', ['S110']),
  'answer-synthesis': reference('azure-openai', 'Azure OpenAI', 'Additional answer synthesis', { en: 'Generates the additional answer from KB context and Web IQ evidence using an Azure-hosted model.', ko: 'Azure에서 제공하는 모델로 KB 자료와 웹 근거를 종합해 추가 답변을 생성합니다.' }, versioned, 'S114', 'S115', 'S115', 'S116'),
  'learn-mcp': reference('microsoft-learn-mcp', 'Microsoft Learn MCP Server', 'Documentation tools', { en: 'Provides public Learn documentation and code examples. Sample content is separate from a current tool call.', ko: '공개 Learn 문서와 코드 예제를 제공합니다. 예시 자료와 현재 도구 호출은 구분합니다.' }, { en: 'Public documentation service', ko: '공개 문서 서비스' }, 'S117', 'S118', 'S118', 'S117'),
  'search-mcp': reference('azure-ai-search', 'Azure AI Search', 'MCP Server knowledge source', { en: 'Invokes a remote MCP server during knowledge retrieval; separate from the Learn server itself.', ko: '지식 검색 과정에서 원격 MCP 서버를 호출합니다. Learn 서버 자체와는 별도 구성입니다.' }, preview, 'S109', 'S119', 'S119', 'S113'),
  'graph-files': reference('microsoft-graph', 'Microsoft Graph', 'SharePoint file listing', { en: 'Lists files in a site drive when configured. Listing alone does not prove retrieval ACL enforcement.', ko: '설정된 사이트 드라이브의 파일을 나열합니다. 목록 조회만으로 검색 접근 권한 보장을 입증하지는 않습니다.' }, { en: 'Graph v1.0', ko: 'Graph v1.0' }, 'S120', 'S121', 'S121', 'S121'),
  'sharepoint-indexer': reference('azure-ai-search', 'Azure AI Search', 'SharePoint indexer', { en: 'Indexes SharePoint content; configuration, indexing and permission filtering require separate checks.', ko: 'SharePoint 자료를 색인합니다. 구성·색인 실행·권한 필터는 각각 확인해야 합니다.' }, preview, 'S109', 'S122', 'S122', 'S113'),
  onelake: reference('fabric-onelake', 'Microsoft Fabric OneLake', 'Indexed OneLake source', { en: 'Ingests OneLake files into a Search index; this is separate from live ontology retrieval.', ko: 'OneLake 파일을 Search 인덱스로 수집합니다. 실시간 온톨로지 조회와는 다른 경로입니다.' }, versioned, 'S123', 'S126', 'S126', 'S127', ['S113']),
  ontology: reference('fabric-ontology', 'Microsoft Fabric Ontology', 'Fabric Ontology knowledge source', { en: 'Native retrieval uses end-user authorization. The sample relationship graph is illustrative.', ko: '실제 조회는 최종 사용자 권한을 사용합니다. 화면의 관계 그래프는 설명용 예시입니다.' }, preview, 'S124', 'S125', 'S125', 'S127'),
  'agent-service': reference('foundry-agent-service', 'Microsoft Foundry Agent Service', 'Agent management', { en: 'Product introduction only. Agent management is not connected in this demo.', ko: '제품 소개입니다. 이 데모에는 에이전트 관리가 연결되어 있지 않습니다.' }, { en: 'App placeholder · not connected', ko: '앱 미구현 · 연결되지 않음' }, 'S131', 'S132', 'S132', 'S133'),
  'bot-check': reference('cloudflare-turnstile', 'Cloudflare Turnstile', 'Browser verification', { en: 'Third-party browser check; the server validates each paid action.', ko: '타사 브라우저 확인 서비스입니다. 서버가 유료 동작마다 검증합니다.' }, { en: 'Third-party · not a Microsoft service', ko: '타사 · Microsoft 서비스 아님' }, 'S128', 'S129', 'S129', 'S130', [], 'Cloudflare'),
  'search-index': reference('azure-ai-search', 'Azure AI Search', 'Search Index knowledge source', { en: 'Queries an existing Search index through the knowledge base.', ko: '기존 Search 인덱스를 지식 베이스에서 조회합니다.' }, versioned, 'S109', 'S135', 'S135', 'S113'),
  'blob-source': reference('azure-blob-storage', 'Azure Blob Storage + Azure AI Search', 'Blob knowledge source', { en: 'Ingests Blob documents into an indexed knowledge source.', ko: 'Blob 문서를 색인된 지식 원본으로 수집합니다.' }, versioned, 'S134', 'S136', 'S136', 'S113'),
  'web-source': reference('azure-ai-search', 'Azure AI Search', 'Web knowledge source', { en: 'A native Search knowledge source, distinct from this app’s separate Web IQ calls.', ko: 'Search의 기본 지식 원본입니다. 이 앱이 별도로 호출하는 Web IQ와 구분합니다.' }, versioned, 'S109', 'S137', 'S137', 'S113'),
  'remote-sharepoint': reference('azure-ai-search', 'Azure AI Search', 'Remote SharePoint knowledge source', { en: 'Queries SharePoint with delegated source access; not the indexed SharePoint path.', ko: '위임된 원본 접근 권한으로 SharePoint를 조회합니다. 색인 경로와 구분합니다.' }, preview, 'S109', 'S138', 'S138', 'S113'),
};

/** Maps source kinds to their own documentation; never implies a configured source is accessible. */
export function serviceFeaturesForSource(kind: string): ServiceFeatureId[] {
  switch (kind.toLowerCase()) {
    case 'searchindex': return ['search-index'];
    case 'azureblob': return ['blob-source'];
    case 'web': return ['web-source'];
    case 'indexedonelake': return ['onelake'];
    case 'fabricontology': return ['ontology'];
    case 'remotesharepoint': return ['remote-sharepoint'];
    case 'indexedsharepoint':
    case 'ingestedsharepoint': return ['sharepoint-indexer'];
    case 'mcpserver':
    case 'mcptool': return ['search-mcp'];
    default: return ['kb-retrieval'];
  }
}
