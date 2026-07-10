import type { Locale } from '@/lib/i18n'

interface LabeledDescription {
  title: string
  description: string
}

interface SampleReferenceCopy {
  title: string
  snippet: string
}

export interface McpKnowledgeSourceCopy {
  eyebrow: string
  previewBadge: string
  title: string
  subtitle: string
  microsoftLearn: string
  repolisReference: string
  starDemo: string
  tabDemo: string
  tabFlow: string
  tabConfiguration: string
  queryEyebrow: string
  queryTitle: string
  liveMode: string
  sampleMode: string
  questionLabel: string
  questionHint: string
  questionAria: string
  startHere: string
  runLive: string
  runSample: string
  retrieving: string
  loadingPlanning: string
  loadingCalling: string
  loadingSynthesizing: string
  noRetrieval: string
  liveUnavailable: string
  questions: readonly [string, string, string]
  groundedAnswer: string
  responseTitle: string
  liveResult: string
  sampleResult: string
  referencesMetric: string
  elapsedMetric: string
  tokensMetric: string
  noAnswer: string
  referencesTitle: string
  noReferences: string
  openDocument: string
  activityTrace: string
  activityTitle: string
  queryPlanning: string
  queryPlanningDescription: string
  mcpToolCall: string
  rerankedReferences: string
  resultCount: (count: number) => string
  answerSynthesis: string
  answerSynthesisDescription: string
  knowledgeBase: string
  knowledgeSource: string
  tool: string
  reasoning: string
  apiVersion: string
  rawResponse: string
  milliseconds: string
  seconds: string
  flowEyebrow: string
  flowTitle: string
  flowSteps: readonly LabeledDescription[]
  flowFacts: readonly LabeledDescription[]
  responseContract: string
  contractFields: readonly LabeledDescription[]
  configMcpTitle: string
  configKbTitle: string
  configRetrieveTitle: string
  referenceMapping: string
  mcpEndpoint: string
  authentication: string
  authenticationValue: string
  inclusionMode: string
  outputParsing: string
  previewApi: string
  sourceMaterial: string
  resourceMcpTitle: string
  resourceMcpMeta: string
  resourceLearnTitle: string
  resourceLearnMeta: string
  resourceRepolisTitle: string
  resourceRepolisMeta: string
  sampleAnswer: string
  sampleReferences: readonly [SampleReferenceCopy, SampleReferenceCopy]
}

export const mcpKnowledgeSourceI18n: Record<Locale, McpKnowledgeSourceCopy> = {
  en: {
    eyebrow: 'Azure AI Search',
    previewBadge: 'Public preview',
    title: 'Microsoft Learn MCP Knowledge Source',
    subtitle:
      'Official Microsoft documentation, retrieved live through a keyless MCP server and synthesized by a Foundry IQ Knowledge Base.',
    microsoftLearn: 'Microsoft Learn',
    repolisReference: 'Repolis reference',
    starDemo: 'Star this demo',
    tabDemo: 'Live demo',
    tabFlow: 'Flow',
    tabConfiguration: 'Setup',
    queryEyebrow: 'Query console',
    queryTitle: 'Ask official Microsoft documentation',
    liveMode: 'Live',
    sampleMode: 'Sample',
    questionLabel: 'Question',
    questionHint: 'Microsoft Learn · live retrieval',
    questionAria: 'Question for Microsoft Learn',
    startHere: 'Start here',
    runLive: 'Run live',
    runSample: 'Run sample',
    retrieving: 'Retrieving',
    loadingPlanning: 'Planning query',
    loadingCalling: 'Calling Microsoft Learn MCP',
    loadingSynthesizing: 'Synthesizing references',
    noRetrieval: 'No retrieval yet',
    liveUnavailable: 'Live query unavailable. A representative sample response is shown instead.',
    questions: [
      'How does an MCP Server Knowledge Source work in Azure AI Search?',
      'Which tools are available from the Microsoft Learn MCP Server?',
      'What happens when authentication is omitted from an mcpServer Knowledge Source?',
    ],
    groundedAnswer: 'Grounded answer',
    responseTitle: 'Microsoft Learn response',
    liveResult: 'Live result',
    sampleResult: 'Sample result',
    referencesMetric: 'References',
    elapsedMetric: 'Elapsed',
    tokensMetric: 'Tokens',
    noAnswer: 'No synthesized answer was returned.',
    referencesTitle: 'Microsoft Learn references',
    noReferences: 'No references were returned.',
    openDocument: 'Open document',
    activityTrace: 'Activity trace',
    activityTitle: 'How the answer was built',
    queryPlanning: 'Query planning',
    queryPlanningDescription: 'Selects the MCP source and rewrites the tool query.',
    mcpToolCall: 'MCP tool call',
    rerankedReferences: 'Reranked references',
    resultCount: (count) => `${count} official documentation results`,
    answerSynthesis: 'Answer synthesis',
    answerSynthesisDescription: 'Builds a cited answer in the language of the question.',
    knowledgeBase: 'Knowledge Base',
    knowledgeSource: 'Knowledge Source',
    tool: 'Tool',
    reasoning: 'Reasoning',
    apiVersion: 'API version',
    rawResponse: 'Raw retrieval response',
    milliseconds: 'ms',
    seconds: 's',
    flowEyebrow: 'Runtime path',
    flowTitle: 'One retrieve call, live documentation',
    flowSteps: [
      {
        title: 'User question',
        description: 'A natural-language question enters the Knowledge Base retrieve action.',
      },
      {
        title: 'Knowledge Base',
        description: 'The retrieval model plans the call and selects the Microsoft Learn source.',
      },
      {
        title: 'MCP Knowledge Source',
        description: 'Azure AI Search invokes the allowlisted tool over Streamable HTTP.',
      },
      {
        title: 'Microsoft Learn',
        description: 'Official documentation results return live and are reranked for the question.',
      },
      {
        title: 'Cited answer',
        description: 'The Knowledge Base synthesizes the final answer with traceable references.',
      },
    ],
    flowFacts: [
      { title: 'Live at retrieval time', description: 'The MCP server is queried for every grounded request.' },
      { title: 'No ingestion pipeline', description: 'No indexer, chunking job, or document copy is required.' },
      { title: 'Official source', description: 'The allowlisted tool searches Microsoft Learn documentation.' },
    ],
    responseContract: 'Response contract',
    contractFields: [
      { title: 'response', description: 'Synthesized answer with inline ref_id markers.' },
      { title: 'activity', description: 'Tool name, arguments, result count, and elapsed time.' },
      { title: 'references', description: 'Reranked Microsoft Learn documents and source data.' },
    ],
    configMcpTitle: '1. MCP Knowledge Source',
    configKbTitle: '2. Knowledge Base',
    configRetrieveTitle: '3. Retrieve request',
    referenceMapping: 'Reference mapping',
    mcpEndpoint: 'MCP endpoint',
    authentication: 'Authentication',
    authenticationValue: 'None (public endpoint)',
    inclusionMode: 'Inclusion mode',
    outputParsing: 'Output parsing',
    previewApi: 'Preview API',
    sourceMaterial: 'Source material',
    resourceMcpTitle: 'Official Live Knowledge Sources accelerator',
    resourceMcpMeta: 'Deploy MCP-only, BYO Fabric, or full',
    resourceLearnTitle: 'Azure AI Search MCP Server Knowledge Source',
    resourceLearnMeta: 'Microsoft Learn · preview specification',
    resourceRepolisTitle: 'Repolis Scholars',
    resourceRepolisMeta: 'VEGA · Microsoft Learn MCP prototype',
    sampleAnswer:
      'An MCP Server Knowledge Source calls a remote MCP tool at retrieval time to fetch current information. You provide the server URL and an explicit tool allowlist, then Azure AI Search reranks the returned content and the Knowledge Base synthesizes a cited answer. [ref_id:0] The Microsoft Learn MCP Server is a public Streamable HTTP endpoint that can be used without authentication and exposes official documentation tools. [ref_id:1]',
    sampleReferences: [
      {
        title: 'Create an MCP Server knowledge source (preview)',
        snippet:
          'MCP Server knowledge sources connect compatible endpoints to agentic retrieval and query live data without an ingestion pipeline.',
      },
      {
        title: 'Microsoft Learn MCP Server developer reference',
        snippet:
          'The public Streamable HTTP endpoint provides documentation search, page fetch, and code sample search tools.',
      },
    ],
  },
  ko: {
    eyebrow: 'Azure AI Search',
    previewBadge: '퍼블릭 프리뷰',
    title: 'Microsoft Learn MCP 지식 소스',
    subtitle:
      '인증이 필요 없는 MCP 서버로 Microsoft 공식 문서를 실시간 검색하고, Foundry IQ Knowledge Base가 인용 포함 답변으로 합성합니다.',
    microsoftLearn: 'Microsoft Learn',
    repolisReference: 'Repolis 참고',
    starDemo: '이 데모에 스타',
    tabDemo: '라이브 데모',
    tabFlow: '흐름',
    tabConfiguration: '설정',
    queryEyebrow: '질의 콘솔',
    queryTitle: 'Microsoft 공식 문서에 질문하기',
    liveMode: '라이브',
    sampleMode: '샘플',
    questionLabel: '질문',
    questionHint: 'Microsoft Learn · 실시간 검색',
    questionAria: 'Microsoft Learn에 보낼 질문',
    startHere: '첫 질문',
    runLive: '라이브 실행',
    runSample: '샘플 실행',
    retrieving: '검색 중',
    loadingPlanning: '질의 계획',
    loadingCalling: 'Microsoft Learn MCP 호출',
    loadingSynthesizing: '인용 합성',
    noRetrieval: '아직 검색 결과가 없습니다',
    liveUnavailable: '라이브 질의를 사용할 수 없어 대표 샘플 응답으로 전환했습니다.',
    questions: [
      'MCP Server Knowledge Source는 Azure AI Search에서 어떻게 동작하나요?',
      'Microsoft Learn MCP Server로 어떤 도구를 사용할 수 있나요?',
      'mcpServer Knowledge Source에 인증을 생략하면 어떻게 되나요?',
    ],
    groundedAnswer: '근거 기반 답변',
    responseTitle: 'Microsoft Learn 응답',
    liveResult: '라이브 결과',
    sampleResult: '샘플 결과',
    referencesMetric: '인용',
    elapsedMetric: '소요 시간',
    tokensMetric: '토큰',
    noAnswer: '합성된 답변이 반환되지 않았습니다.',
    referencesTitle: 'Microsoft Learn 인용 문서',
    noReferences: '반환된 인용 문서가 없습니다.',
    openDocument: '문서 열기',
    activityTrace: '활동 추적',
    activityTitle: '답변 생성 과정',
    queryPlanning: '질의 계획',
    queryPlanningDescription: 'MCP 소스를 선택하고 도구 질의를 다시 구성합니다.',
    mcpToolCall: 'MCP 도구 호출',
    rerankedReferences: '재정렬된 인용',
    resultCount: (count) => `공식 문서 ${count}건`,
    answerSynthesis: '답변 합성',
    answerSynthesisDescription: '질문 언어에 맞춰 인용 포함 답변을 생성합니다.',
    knowledgeBase: 'Knowledge Base',
    knowledgeSource: 'Knowledge Source',
    tool: '도구',
    reasoning: '추론 수준',
    apiVersion: 'API 버전',
    rawResponse: '원시 검색 응답',
    milliseconds: 'ms',
    seconds: '초',
    flowEyebrow: '런타임 경로',
    flowTitle: '한 번의 retrieve 호출로 최신 공식 문서까지',
    flowSteps: [
      {
        title: '사용자 질문',
        description: '자연어 질문이 Knowledge Base retrieve 요청으로 들어갑니다.',
      },
      {
        title: 'Knowledge Base',
        description: '검색 모델이 호출을 계획하고 Microsoft Learn 소스를 선택합니다.',
      },
      {
        title: 'MCP 지식 소스',
        description: 'Azure AI Search가 허용 목록의 도구를 Streamable HTTP로 호출합니다.',
      },
      {
        title: 'Microsoft Learn',
        description: '최신 공식 문서 결과를 실시간으로 받아 질문 관련도에 따라 재정렬합니다.',
      },
      {
        title: '인용 포함 답변',
        description: 'Knowledge Base가 추적 가능한 인용과 함께 최종 답변을 합성합니다.',
      },
    ],
    flowFacts: [
      { title: '검색 시점 실시간 호출', description: '근거가 필요한 요청마다 MCP 서버를 직접 질의합니다.' },
      { title: '수집 파이프라인 불필요', description: '인덱서, 청킹 작업, 문서 복사가 필요하지 않습니다.' },
      { title: 'Microsoft 공식 소스', description: '허용된 도구가 Microsoft Learn 문서만 검색합니다.' },
    ],
    responseContract: '응답 계약',
    contractFields: [
      { title: 'response', description: 'ref_id 인라인 인용이 포함된 합성 답변입니다.' },
      { title: 'activity', description: '도구 이름, 인수, 결과 수, 소요 시간을 보여줍니다.' },
      { title: 'references', description: '재정렬된 Microsoft Learn 문서와 원본 데이터입니다.' },
    ],
    configMcpTitle: '1. MCP 지식 소스',
    configKbTitle: '2. Knowledge Base',
    configRetrieveTitle: '3. Retrieve 요청',
    referenceMapping: '참조 설정',
    mcpEndpoint: 'MCP 엔드포인트',
    authentication: '인증',
    authenticationValue: '없음 (공개 엔드포인트)',
    inclusionMode: '포함 모드',
    outputParsing: '출력 파싱',
    previewApi: '프리뷰 API',
    sourceMaterial: '참고 자료',
    resourceMcpTitle: 'Microsoft 공식 Live Knowledge Sources accelerator',
    resourceMcpMeta: 'MCP-only, BYO Fabric, 전체 배포',
    resourceLearnTitle: 'Azure AI Search MCP Server Knowledge Source',
    resourceLearnMeta: 'Microsoft Learn · 프리뷰 사양',
    resourceRepolisTitle: 'Repolis Scholars',
    resourceRepolisMeta: 'VEGA · Microsoft Learn MCP 프로토타입',
    sampleAnswer:
      'MCP Server Knowledge Source는 검색 시점에 원격 MCP 도구를 호출해 최신 정보를 가져옵니다. 서버 URL과 명시적인 도구 허용 목록을 지정하면 Azure AI Search가 반환된 내용을 재정렬하고 Knowledge Base가 인용 포함 답변으로 합성합니다. [ref_id:0] Microsoft Learn MCP Server는 인증 없이 사용할 수 있는 공개 Streamable HTTP 엔드포인트로, Microsoft 공식 문서 도구를 제공합니다. [ref_id:1]',
    sampleReferences: [
      {
        title: 'MCP Server Knowledge Source 만들기 (프리뷰)',
        snippet:
          'MCP 호환 엔드포인트를 에이전틱 검색에 연결하고, 별도 수집 파이프라인 없이 실시간 데이터를 질의합니다.',
      },
      {
        title: 'Microsoft Learn MCP Server 개발자 참조',
        snippet:
          '공개 Streamable HTTP 엔드포인트에서 문서 검색, 페이지 가져오기, 코드 샘플 검색 도구를 제공합니다.',
      },
    ],
  },
  zh: {
    eyebrow: 'Azure AI Search',
    previewBadge: '公共预览版',
    title: 'Microsoft Learn MCP 知识源',
    subtitle:
      '通过免身份验证的 MCP 服务器实时检索 Microsoft 官方文档，并由 Foundry IQ 知识库合成带引用的答案。',
    microsoftLearn: 'Microsoft Learn',
    repolisReference: 'Repolis 参考',
    starDemo: '为此演示加星',
    tabDemo: '实时演示',
    tabFlow: '流程',
    tabConfiguration: '配置',
    queryEyebrow: '查询控制台',
    queryTitle: '查询 Microsoft 官方文档',
    liveMode: '实时',
    sampleMode: '示例',
    questionLabel: '问题',
    questionHint: 'Microsoft Learn · 实时检索',
    questionAria: '向 Microsoft Learn 提问',
    startHere: '从这里开始',
    runLive: '实时运行',
    runSample: '运行示例',
    retrieving: '正在检索',
    loadingPlanning: '规划查询',
    loadingCalling: '调用 Microsoft Learn MCP',
    loadingSynthesizing: '合成引用',
    noRetrieval: '尚无检索结果',
    liveUnavailable: '实时查询不可用，已切换为代表性示例响应。',
    questions: [
      'MCP Server Knowledge Source 在 Azure AI Search 中如何工作？',
      'Microsoft Learn MCP Server 提供哪些工具？',
      'mcpServer Knowledge Source 省略身份验证时会发生什么？',
    ],
    groundedAnswer: '基于依据的答案',
    responseTitle: 'Microsoft Learn 响应',
    liveResult: '实时结果',
    sampleResult: '示例结果',
    referencesMetric: '引用',
    elapsedMetric: '耗时',
    tokensMetric: '令牌',
    noAnswer: '未返回合成答案。',
    referencesTitle: 'Microsoft Learn 引用',
    noReferences: '未返回引用。',
    openDocument: '打开文档',
    activityTrace: '活动跟踪',
    activityTitle: '答案生成过程',
    queryPlanning: '查询规划',
    queryPlanningDescription: '选择 MCP 源并重写工具查询。',
    mcpToolCall: 'MCP 工具调用',
    rerankedReferences: '重排后的引用',
    resultCount: (count) => `${count} 条官方文档结果`,
    answerSynthesis: '答案合成',
    answerSynthesisDescription: '使用问题所用语言生成带引用的答案。',
    knowledgeBase: '知识库',
    knowledgeSource: '知识源',
    tool: '工具',
    reasoning: '推理',
    apiVersion: 'API 版本',
    rawResponse: '原始检索响应',
    milliseconds: '毫秒',
    seconds: '秒',
    flowEyebrow: '运行时路径',
    flowTitle: '一次 retrieve 调用，实时官方文档',
    flowSteps: [
      { title: '用户问题', description: '自然语言问题进入知识库 retrieve 操作。' },
      { title: '知识库', description: '检索模型规划调用并选择 Microsoft Learn 源。' },
      { title: 'MCP 知识源', description: 'Azure AI Search 通过 Streamable HTTP 调用允许的工具。' },
      { title: 'Microsoft Learn', description: '实时返回官方文档结果，并按相关性重新排序。' },
      { title: '带引用的答案', description: '知识库使用可追溯引用合成最终答案。' },
    ],
    flowFacts: [
      { title: '检索时实时调用', description: '每个需要依据的请求都会查询 MCP 服务器。' },
      { title: '无需采集管道', description: '无需索引器、分块任务或文档复制。' },
      { title: '官方来源', description: '允许的工具只搜索 Microsoft Learn 文档。' },
    ],
    responseContract: '响应契约',
    contractFields: [
      { title: 'response', description: '包含内联 ref_id 标记的合成答案。' },
      { title: 'activity', description: '工具名称、参数、结果数量和耗时。' },
      { title: 'references', description: '重排后的 Microsoft Learn 文档和源数据。' },
    ],
    configMcpTitle: '1. MCP 知识源',
    configKbTitle: '2. 知识库',
    configRetrieveTitle: '3. Retrieve 请求',
    referenceMapping: '参考配置',
    mcpEndpoint: 'MCP 端点',
    authentication: '身份验证',
    authenticationValue: '无（公共端点）',
    inclusionMode: '包含模式',
    outputParsing: '输出解析',
    previewApi: '预览 API',
    sourceMaterial: '参考资料',
    resourceMcpTitle: 'Microsoft 官方 Live Knowledge Sources accelerator',
    resourceMcpMeta: '部署 MCP-only、BYO Fabric 或完整模式',
    resourceLearnTitle: 'Azure AI Search MCP Server Knowledge Source',
    resourceLearnMeta: 'Microsoft Learn · 预览规范',
    resourceRepolisTitle: 'Repolis Scholars',
    resourceRepolisMeta: 'VEGA · Microsoft Learn MCP 原型',
    sampleAnswer:
      'MCP Server Knowledge Source 在检索时调用远程 MCP 工具以获取最新信息。配置服务器 URL 和明确的工具允许列表后，Azure AI Search 会重新排序返回内容，再由知识库合成带引用的答案。[ref_id:0] Microsoft Learn MCP Server 是无需身份验证的公共 Streamable HTTP 端点，并提供 Microsoft 官方文档工具。[ref_id:1]',
    sampleReferences: [
      {
        title: '创建 MCP Server Knowledge Source（预览）',
        snippet: '将兼容 MCP 的端点连接到代理检索，无需采集管道即可查询实时数据。',
      },
      {
        title: 'Microsoft Learn MCP Server 开发者参考',
        snippet: '公共 Streamable HTTP 端点提供文档搜索、页面获取和代码示例搜索工具。',
      },
    ],
  },
  ja: {
    eyebrow: 'Azure AI Search',
    previewBadge: 'パブリックプレビュー',
    title: 'Microsoft Learn MCP ナレッジソース',
    subtitle:
      '認証不要の MCP サーバーから Microsoft 公式ドキュメントをリアルタイムで検索し、Foundry IQ ナレッジベースが引用付き回答を合成します。',
    microsoftLearn: 'Microsoft Learn',
    repolisReference: 'Repolis 参照',
    starDemo: 'このデモにスター',
    tabDemo: 'ライブ',
    tabFlow: 'フロー',
    tabConfiguration: '設定',
    queryEyebrow: 'クエリコンソール',
    queryTitle: 'Microsoft 公式ドキュメントに質問',
    liveMode: 'ライブ',
    sampleMode: 'サンプル',
    questionLabel: '質問',
    questionHint: 'Microsoft Learn · ライブ検索',
    questionAria: 'Microsoft Learn への質問',
    startHere: '最初の質問',
    runLive: 'ライブ実行',
    runSample: 'サンプル実行',
    retrieving: '検索中',
    loadingPlanning: 'クエリを計画',
    loadingCalling: 'Microsoft Learn MCP を呼び出し',
    loadingSynthesizing: '引用を合成',
    noRetrieval: 'まだ検索結果はありません',
    liveUnavailable: 'ライブクエリを利用できないため、代表サンプルを表示しています。',
    questions: [
      'MCP Server Knowledge Source は Azure AI Search でどのように動作しますか？',
      'Microsoft Learn MCP Server ではどのツールを利用できますか？',
      'mcpServer Knowledge Source で認証を省略するとどうなりますか？',
    ],
    groundedAnswer: '根拠に基づく回答',
    responseTitle: 'Microsoft Learn の回答',
    liveResult: 'ライブ結果',
    sampleResult: 'サンプル結果',
    referencesMetric: '引用',
    elapsedMetric: '所要時間',
    tokensMetric: 'トークン',
    noAnswer: '合成された回答が返されませんでした。',
    referencesTitle: 'Microsoft Learn の引用',
    noReferences: '引用は返されませんでした。',
    openDocument: 'ドキュメントを開く',
    activityTrace: 'アクティビティ',
    activityTitle: '回答の生成過程',
    queryPlanning: 'クエリ計画',
    queryPlanningDescription: 'MCP ソースを選択し、ツールクエリを書き換えます。',
    mcpToolCall: 'MCP ツール呼び出し',
    rerankedReferences: '再ランクされた引用',
    resultCount: (count) => `公式ドキュメント ${count} 件`,
    answerSynthesis: '回答合成',
    answerSynthesisDescription: '質問と同じ言語で引用付き回答を生成します。',
    knowledgeBase: 'ナレッジベース',
    knowledgeSource: 'ナレッジソース',
    tool: 'ツール',
    reasoning: '推論',
    apiVersion: 'API バージョン',
    rawResponse: '生の検索レスポンス',
    milliseconds: 'ms',
    seconds: '秒',
    flowEyebrow: 'ランタイム経路',
    flowTitle: '1 回の retrieve 呼び出しで最新の公式文書へ',
    flowSteps: [
      { title: 'ユーザーの質問', description: '自然言語の質問がナレッジベースの retrieve 操作に入ります。' },
      { title: 'ナレッジベース', description: '検索モデルが呼び出しを計画し、Microsoft Learn ソースを選びます。' },
      { title: 'MCP ナレッジソース', description: 'Azure AI Search が許可されたツールを Streamable HTTP で呼び出します。' },
      { title: 'Microsoft Learn', description: '公式ドキュメントをリアルタイムで取得し、関連度で再ランクします。' },
      { title: '引用付き回答', description: 'ナレッジベースが追跡可能な引用付きの最終回答を合成します。' },
    ],
    flowFacts: [
      { title: '検索時にライブ呼び出し', description: '根拠が必要なリクエストごとに MCP サーバーを照会します。' },
      { title: '取り込みパイプライン不要', description: 'インデクサー、分割処理、文書コピーは不要です。' },
      { title: '公式ソース', description: '許可されたツールが Microsoft Learn のみを検索します。' },
    ],
    responseContract: 'レスポンス契約',
    contractFields: [
      { title: 'response', description: 'インライン ref_id を含む合成回答です。' },
      { title: 'activity', description: 'ツール名、引数、結果件数、所要時間です。' },
      { title: 'references', description: '再ランクされた Microsoft Learn 文書とソースデータです。' },
    ],
    configMcpTitle: '1. MCP ナレッジソース',
    configKbTitle: '2. ナレッジベース',
    configRetrieveTitle: '3. Retrieve リクエスト',
    referenceMapping: '参照設定',
    mcpEndpoint: 'MCP エンドポイント',
    authentication: '認証',
    authenticationValue: 'なし（公開エンドポイント）',
    inclusionMode: '包含モード',
    outputParsing: '出力解析',
    previewApi: 'プレビュー API',
    sourceMaterial: '参考資料',
    resourceMcpTitle: 'Microsoft 公式 Live Knowledge Sources accelerator',
    resourceMcpMeta: 'MCP-only、BYO Fabric、フルを展開',
    resourceLearnTitle: 'Azure AI Search MCP Server Knowledge Source',
    resourceLearnMeta: 'Microsoft Learn · プレビュー仕様',
    resourceRepolisTitle: 'Repolis Scholars',
    resourceRepolisMeta: 'VEGA · Microsoft Learn MCP プロトタイプ',
    sampleAnswer:
      'MCP Server Knowledge Source は検索時にリモート MCP ツールを呼び出して最新情報を取得します。サーバー URL と明示的なツール許可リストを設定すると、Azure AI Search が返却内容を再ランクし、ナレッジベースが引用付き回答を合成します。[ref_id:0] Microsoft Learn MCP Server は認証不要の公開 Streamable HTTP エンドポイントで、Microsoft 公式ドキュメント用ツールを提供します。[ref_id:1]',
    sampleReferences: [
      {
        title: 'MCP Server Knowledge Source の作成（プレビュー）',
        snippet: 'MCP 互換エンドポイントをエージェンティック検索に接続し、取り込みなしでライブデータを照会します。',
      },
      {
        title: 'Microsoft Learn MCP Server 開発者リファレンス',
        snippet: '公開 Streamable HTTP エンドポイントで文書検索、ページ取得、コードサンプル検索を提供します。',
      },
    ],
  },
  hi: {
    eyebrow: 'Azure AI Search',
    previewBadge: 'सार्वजनिक पूर्वावलोकन',
    title: 'Microsoft Learn MCP ज्ञान स्रोत',
    subtitle:
      'बिना प्रमाणीकरण वाले MCP सर्वर से Microsoft के आधिकारिक दस्तावेज़ लाइव खोजें और Foundry IQ ज्ञानकोष से उद्धरण सहित उत्तर बनाएं।',
    microsoftLearn: 'Microsoft Learn',
    repolisReference: 'Repolis संदर्भ',
    starDemo: 'इस डेमो को स्टार दें',
    tabDemo: 'लाइव',
    tabFlow: 'प्रवाह',
    tabConfiguration: 'सेटअप',
    queryEyebrow: 'क्वेरी कंसोल',
    queryTitle: 'Microsoft के आधिकारिक दस्तावेज़ों से पूछें',
    liveMode: 'लाइव',
    sampleMode: 'नमूना',
    questionLabel: 'प्रश्न',
    questionHint: 'Microsoft Learn · लाइव पुनर्प्राप्ति',
    questionAria: 'Microsoft Learn के लिए प्रश्न',
    startHere: 'यहां से शुरू करें',
    runLive: 'लाइव चलाएं',
    runSample: 'नमूना चलाएं',
    retrieving: 'खोज जारी',
    loadingPlanning: 'क्वेरी योजना',
    loadingCalling: 'Microsoft Learn MCP कॉल',
    loadingSynthesizing: 'संदर्भ संयोजन',
    noRetrieval: 'अभी कोई परिणाम नहीं',
    liveUnavailable: 'लाइव क्वेरी उपलब्ध नहीं है, इसलिए प्रतिनिधि नमूना दिखाया गया है।',
    questions: [
      'Azure AI Search में MCP Server Knowledge Source कैसे काम करता है?',
      'Microsoft Learn MCP Server में कौन से टूल उपलब्ध हैं?',
      'mcpServer Knowledge Source में प्रमाणीकरण न देने पर क्या होता है?',
    ],
    groundedAnswer: 'स्रोत-आधारित उत्तर',
    responseTitle: 'Microsoft Learn उत्तर',
    liveResult: 'लाइव परिणाम',
    sampleResult: 'नमूना परिणाम',
    referencesMetric: 'संदर्भ',
    elapsedMetric: 'समय',
    tokensMetric: 'टोकन',
    noAnswer: 'संयोजित उत्तर नहीं मिला।',
    referencesTitle: 'Microsoft Learn संदर्भ',
    noReferences: 'कोई संदर्भ नहीं मिला।',
    openDocument: 'दस्तावेज़ खोलें',
    activityTrace: 'गतिविधि ट्रेस',
    activityTitle: 'उत्तर कैसे बना',
    queryPlanning: 'क्वेरी योजना',
    queryPlanningDescription: 'MCP स्रोत चुनता है और टूल क्वेरी को दोबारा लिखता है।',
    mcpToolCall: 'MCP टूल कॉल',
    rerankedReferences: 'पुनः क्रमित संदर्भ',
    resultCount: (count) => `${count} आधिकारिक दस्तावेज़ परिणाम`,
    answerSynthesis: 'उत्तर संयोजन',
    answerSynthesisDescription: 'प्रश्न की भाषा में उद्धरण सहित उत्तर बनाता है।',
    knowledgeBase: 'ज्ञानकोष',
    knowledgeSource: 'ज्ञान स्रोत',
    tool: 'टूल',
    reasoning: 'तर्क',
    apiVersion: 'API संस्करण',
    rawResponse: 'कच्चा पुनर्प्राप्ति उत्तर',
    milliseconds: 'मि.से.',
    seconds: 'से.',
    flowEyebrow: 'रनटाइम पथ',
    flowTitle: 'एक retrieve कॉल, लाइव आधिकारिक दस्तावेज़',
    flowSteps: [
      { title: 'उपयोगकर्ता प्रश्न', description: 'प्राकृतिक भाषा का प्रश्न ज्ञानकोष retrieve कार्रवाई में जाता है।' },
      { title: 'ज्ञानकोष', description: 'पुनर्प्राप्ति मॉडल कॉल की योजना बनाता है और Microsoft Learn स्रोत चुनता है।' },
      { title: 'MCP ज्ञान स्रोत', description: 'Azure AI Search Streamable HTTP पर अनुमत टूल को कॉल करता है।' },
      { title: 'Microsoft Learn', description: 'आधिकारिक दस्तावेज़ लाइव लौटते हैं और प्रासंगिकता के आधार पर क्रमित होते हैं।' },
      { title: 'उद्धरण सहित उत्तर', description: 'ज्ञानकोष ट्रेस किए जा सकने वाले संदर्भों के साथ अंतिम उत्तर बनाता है।' },
    ],
    flowFacts: [
      { title: 'पुनर्प्राप्ति के समय लाइव', description: 'हर स्रोत-आधारित अनुरोध पर MCP सर्वर से पूछा जाता है।' },
      { title: 'इंजेशन पाइपलाइन नहीं', description: 'इंडेक्सर, चंकिंग जॉब या दस्तावेज़ कॉपी की जरूरत नहीं।' },
      { title: 'आधिकारिक स्रोत', description: 'अनुमत टूल Microsoft Learn दस्तावेज़ खोजता है।' },
    ],
    responseContract: 'उत्तर अनुबंध',
    contractFields: [
      { title: 'response', description: 'इनलाइन ref_id चिह्नों वाला संयोजित उत्तर।' },
      { title: 'activity', description: 'टूल नाम, तर्क, परिणाम संख्या और समय।' },
      { title: 'references', description: 'पुनः क्रमित Microsoft Learn दस्तावेज़ और स्रोत डेटा।' },
    ],
    configMcpTitle: '1. MCP ज्ञान स्रोत',
    configKbTitle: '2. ज्ञानकोष',
    configRetrieveTitle: '3. Retrieve अनुरोध',
    referenceMapping: 'संदर्भ मैपिंग',
    mcpEndpoint: 'MCP एंडपॉइंट',
    authentication: 'प्रमाणीकरण',
    authenticationValue: 'कोई नहीं (सार्वजनिक एंडपॉइंट)',
    inclusionMode: 'समावेशन मोड',
    outputParsing: 'आउटपुट पार्सिंग',
    previewApi: 'पूर्वावलोकन API',
    sourceMaterial: 'स्रोत सामग्री',
    resourceMcpTitle: 'Microsoft आधिकारिक Live Knowledge Sources accelerator',
    resourceMcpMeta: 'MCP-only, BYO Fabric या full तैनात करें',
    resourceLearnTitle: 'Azure AI Search MCP Server Knowledge Source',
    resourceLearnMeta: 'Microsoft Learn · पूर्वावलोकन विनिर्देश',
    resourceRepolisTitle: 'Repolis Scholars',
    resourceRepolisMeta: 'VEGA · Microsoft Learn MCP प्रोटोटाइप',
    sampleAnswer:
      'MCP Server Knowledge Source पुनर्प्राप्ति के समय दूरस्थ MCP टूल को कॉल करके ताज़ा जानकारी लाता है। सर्वर URL और स्पष्ट टूल अनुमति सूची देने पर Azure AI Search परिणामों को पुनः क्रमित करता है और ज्ञानकोष उद्धरण सहित उत्तर बनाता है। [ref_id:0] Microsoft Learn MCP Server बिना प्रमाणीकरण वाला सार्वजनिक Streamable HTTP एंडपॉइंट है जो Microsoft के आधिकारिक दस्तावेज़ टूल देता है। [ref_id:1]',
    sampleReferences: [
      {
        title: 'MCP Server Knowledge Source बनाएं (पूर्वावलोकन)',
        snippet: 'MCP-संगत एंडपॉइंट को एजेंटिक पुनर्प्राप्ति से जोड़ें और इंजेशन के बिना लाइव डेटा खोजें।',
      },
      {
        title: 'Microsoft Learn MCP Server डेवलपर संदर्भ',
        snippet: 'सार्वजनिक Streamable HTTP एंडपॉइंट दस्तावेज़ खोज, पेज फ़ेच और कोड नमूना खोज टूल देता है।',
      },
    ],
  },
}
