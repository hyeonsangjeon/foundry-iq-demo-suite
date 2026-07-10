import type { Locale } from '@/lib/i18n'

interface ReferenceFact {
  label: string
  value: string
}

export interface LiveKnowledgeSourcesCopy {
  eyebrow: string
  title: string
  description: string
  facts: readonly [ReferenceFact, ReferenceFact, ReferenceFact]
  officialManual: string
  officialRepo: string
  mcpGuide: string
  fabricGuide: string
  combinedGuide: string
}

export const liveKnowledgeSourcesI18n: Record<Locale, LiveKnowledgeSourcesCopy> = {
  en: {
    eyebrow: 'Runnable Microsoft reference',
    title: 'Deploy live MCP and Fabric Ontology sources from the official accelerator',
    description:
      'This app demonstrates the experience and response contract. Use Microsoft\'s official execution manual for deployment scripts, notebooks, REST samples, mcp-only / byo-fabric / full modes, combined Knowledge Base routing, and current public-preview limits.',
    facts: [
      { label: 'Deployment modes', value: 'mcp-only · byo-fabric · full' },
      { label: 'Inspect the evidence', value: 'activity · references · sourceData' },
      { label: 'Fast evaluation', value: '30-second offline replay' },
    ],
    officialManual: 'Open execution manual',
    officialRepo: 'Source repository',
    mcpGuide: 'MCP setup',
    fabricGuide: 'Fabric setup',
    combinedGuide: 'Combined routing',
  },
  ko: {
    eyebrow: '실행 가능한 Microsoft 공식 레퍼런스',
    title: '공식 accelerator에서 MCP와 Fabric Ontology 라이브 소스를 배포하세요',
    description:
      '이 앱은 사용자 경험과 응답 구조를 보여주는 데모입니다. 실제 배포 스크립트, 노트북, REST 샘플, mcp-only / byo-fabric / full 모드, 통합 Knowledge Base 라우팅, 최신 공개 미리 보기 제약은 Microsoft 공식 실행 매뉴얼에서 확인하세요.',
    facts: [
      { label: '배포 모드', value: 'mcp-only · byo-fabric · full' },
      { label: '근거 확인', value: 'activity · references · sourceData' },
      { label: '빠른 평가', value: '30초 오프라인 리플레이' },
    ],
    officialManual: '실행 매뉴얼 열기',
    officialRepo: '소스 저장소',
    mcpGuide: 'MCP 설정',
    fabricGuide: 'Fabric 설정',
    combinedGuide: '통합 라우팅',
  },
  zh: {
    eyebrow: '可运行的 Microsoft 官方参考',
    title: '从官方加速器部署实时 MCP 与 Fabric Ontology 数据源',
    description:
      '本应用用于演示交互体验和响应契约。部署脚本、笔记本、REST 示例、mcp-only / byo-fabric / full 模式、组合知识库路由以及最新公共预览限制，请参阅 Microsoft 官方执行手册。',
    facts: [
      { label: '部署模式', value: 'mcp-only · byo-fabric · full' },
      { label: '检查证据', value: 'activity · references · sourceData' },
      { label: '快速评估', value: '30 秒离线回放' },
    ],
    officialManual: '打开执行手册',
    officialRepo: '源代码存储库',
    mcpGuide: 'MCP 设置',
    fabricGuide: 'Fabric 设置',
    combinedGuide: '组合路由',
  },
  ja: {
    eyebrow: '実行可能な Microsoft 公式リファレンス',
    title: '公式アクセラレーターから MCP と Fabric Ontology のライブソースを展開',
    description:
      'このアプリは操作体験とレスポンス契約を示すデモです。展開スクリプト、ノートブック、REST サンプル、mcp-only / byo-fabric / full モード、統合 Knowledge Base ルーティング、最新のパブリックプレビュー制限は Microsoft 公式実行マニュアルを参照してください。',
    facts: [
      { label: '展開モード', value: 'mcp-only · byo-fabric · full' },
      { label: '根拠を確認', value: 'activity · references · sourceData' },
      { label: 'すばやく評価', value: '30 秒のオフラインリプレイ' },
    ],
    officialManual: '実行マニュアルを開く',
    officialRepo: 'ソースリポジトリ',
    mcpGuide: 'MCP セットアップ',
    fabricGuide: 'Fabric セットアップ',
    combinedGuide: '統合ルーティング',
  },
  hi: {
    eyebrow: 'चलाने योग्य Microsoft आधिकारिक संदर्भ',
    title: 'आधिकारिक accelerator से लाइव MCP और Fabric Ontology स्रोत तैनात करें',
    description:
      'यह ऐप अनुभव और प्रतिक्रिया अनुबंध का डेमो है। तैनाती स्क्रिप्ट, नोटबुक, REST नमूने, mcp-only / byo-fabric / full मोड, संयुक्त Knowledge Base रूटिंग और नवीनतम सार्वजनिक पूर्वावलोकन सीमाओं के लिए Microsoft का आधिकारिक निष्पादन मैनुअल देखें।',
    facts: [
      { label: 'तैनाती मोड', value: 'mcp-only · byo-fabric · full' },
      { label: 'साक्ष्य देखें', value: 'activity · references · sourceData' },
      { label: 'तेज़ मूल्यांकन', value: '30 सेकंड ऑफ़लाइन रीप्ले' },
    ],
    officialManual: 'निष्पादन मैनुअल खोलें',
    officialRepo: 'स्रोत रिपॉज़िटरी',
    mcpGuide: 'MCP सेटअप',
    fabricGuide: 'Fabric सेटअप',
    combinedGuide: 'संयुक्त रूटिंग',
  },
}
