import type { Locale } from '@/lib/i18n'

// Public Microsoft documentation reviewed on this date; not a release forecast.
export const FEATURE_STATUS_REVIEWED_AT = '2026-11-12'
export const SEARCH_STABLE_API_VERSION = '2026-04-01'
export const SEARCH_LATEST_PREVIEW_API_VERSION = '2026-08-01-preview'

export const featureAvailability = [
  { name: 'Knowledge bases (minimal / extractive) · Search index · Azure Blob · OneLake · Web KS', status: 'GA', source: 'https://learn.microsoft.com/azure/search/agentic-retrieval-how-to-migrate' },
  { name: 'LLM query planning · answer synthesis · low / medium reasoning', status: 'Preview', source: 'https://learn.microsoft.com/azure/search/search-agentic-retrieval-concept' },
  { name: 'Indexed SharePoint · Remote SharePoint KS', status: 'Preview', source: 'https://learn.microsoft.com/azure/search/agentic-knowledge-source-overview' },
  { name: 'MCP Server KS', status: 'Preview', source: 'https://learn.microsoft.com/azure/search/agentic-knowledge-source-how-to-mcp-server' },
  { name: 'Fabric Ontology · Fabric Data Agent · Work IQ KS', status: 'Preview', source: 'https://learn.microsoft.com/azure/search/agentic-knowledge-source-overview' },
  { name: 'Azure SQL · File KS', status: 'Preview', source: 'https://learn.microsoft.com/azure/search/agentic-knowledge-source-overview' },
  { name: 'Web IQ: Web · News · Images · Videos · Browse', status: 'GA', source: 'https://learn.microsoft.com/web-iq/resources/pricing' },
  { name: 'Web IQ: Auto', status: 'Beta', source: 'https://learn.microsoft.com/web-iq/reference/auto' },
] as const

export const featureAvailabilityCopy: Record<Locale, {
  title: string
  reviewed: string
  scope: string
  feature: string
  status: string
  source: string
  apiNote: string
  demoNote: string
}> = {
  en: {
    title: 'Microsoft feature availability', reviewed: 'Checked', feature: 'Feature', status: 'Status', source: 'Microsoft Learn',
    scope: 'Foundry IQ combines GA retrieval with preview capabilities. GA covers minimal, extractive retrieval; LLM planning and answer synthesis remain preview.',
    apiNote: 'Latest documented Search APIs: stable 2026-04-01 · preview 2026-08-01-preview. An API version shown in a demo identifies the request it uses, not the release status of every feature.',
    demoNote: 'Web KS uses Bing grounding and is separate from Web IQ. Semantic Join is an app scenario. This demo’s SharePoint pipeline creates a searchIndex KS; native SharePoint KS types remain preview. Fabric examples include recorded responses; live Fabric Ontology retrieval requires the same Entra tenant and an end-user token.',
  },
  ko: {
    title: 'Microsoft 기능별 제공 상태', reviewed: '확인일', feature: '기능', status: '제공 상태', source: 'Microsoft Learn',
    scope: 'Foundry IQ는 GA 검색과 프리뷰 기능을 함께 제공합니다. 최소 추론의 발췌형 검색은 GA이며, LLM의 질의 계획과 답변 합성은 프리뷰입니다.',
    apiNote: '공식 문서의 최신 Search API: 안정 버전 2026-04-01 · 프리뷰 2026-08-01-preview. 데모에 표시한 API 버전은 실제 요청에 사용하는 버전이며, 모든 기능의 출시 상태를 뜻하지 않습니다.',
    demoNote: 'Web KS는 Bing 기반으로 Web IQ와 별개입니다. 시맨틱 조인은 앱의 활용 시나리오입니다. 이 데모의 SharePoint 파이프라인은 searchIndex KS를 만들며, 네이티브 SharePoint KS는 프리뷰입니다. Fabric 예시에는 기록된 응답이 포함됩니다. 실제 Fabric Ontology 조회에는 동일한 Entra 테넌트와 최종 사용자 토큰이 필요합니다.',
  },
  zh: {
    title: 'Microsoft 功能提供状态', reviewed: '核查日期', feature: '功能', status: '状态', source: 'Microsoft Learn',
    scope: 'Foundry IQ 同时提供 GA 检索和预览功能。最小推理的抽取式检索已 GA；LLM 查询规划和答案合成仍为预览。',
    apiNote: '官方文档中的最新 Search API：稳定版 2026-04-01 · 预览版 2026-08-01-preview。演示显示的 API 版本代表实际请求版本，并不代表所有功能的发布状态。',
    demoNote: 'Web KS 使用 Bing，与 Web IQ 不同。Semantic Join 是应用场景。本演示的 SharePoint 管道创建 searchIndex KS；原生 SharePoint KS 仍为预览。Fabric 示例包含已录制响应；实时 Fabric Ontology 检索要求同一 Entra 租户和最终用户令牌。',
  },
  ja: {
    title: 'Microsoft 機能の提供状況', reviewed: '確認日', feature: '機能', status: '提供状況', source: 'Microsoft Learn',
    scope: 'Foundry IQ は GA の検索とプレビュー機能を組み合わせます。最小推論による抽出型検索は GA、LLM のクエリ計画と回答合成はプレビューです。',
    apiNote: '公式文書の最新 Search API：安定版 2026-04-01 · プレビュー 2026-08-01-preview。デモの API バージョンは実際のリクエストに使う版であり、全機能の提供状況を表すものではありません。',
    demoNote: 'Web KS は Bing ベースで、Web IQ とは別です。Semantic Join はアプリの利用例です。このデモの SharePoint パイプラインは searchIndex KS を作成し、ネイティブ SharePoint KS はプレビューです。Fabric の例には記録済み応答が含まれます。ライブの Fabric Ontology 検索には同じ Entra テナントとエンドユーザートークンが必要です。',
  },
  hi: {
    title: 'Microsoft सुविधाओं की उपलब्धता', reviewed: 'जाँच की तारीख', feature: 'सुविधा', status: 'स्थिति', source: 'Microsoft Learn',
    scope: 'Foundry IQ में GA retrieval और preview सुविधाएँ दोनों हैं। Minimal, extractive retrieval GA है; LLM query planning और answer synthesis अभी preview हैं।',
    apiNote: 'आधिकारिक दस्तावेज़ों में नवीनतम Search API: stable 2026-04-01 · preview 2026-08-01-preview। डेमो में दिखाई गई API version वास्तविक अनुरोध की version है, सभी सुविधाओं की release स्थिति नहीं।',
    demoNote: 'Web KS, Bing पर आधारित है और Web IQ से अलग है। Semantic Join ऐप का एक उपयोग उदाहरण है। इस डेमो की SharePoint pipeline, searchIndex KS बनाती है; native SharePoint KS अभी preview हैं। Fabric उदाहरणों में रिकॉर्ड किए गए उत्तर हैं; live Fabric Ontology retrieval के लिए एक ही Entra tenant और end-user token चाहिए।',
  },
}
