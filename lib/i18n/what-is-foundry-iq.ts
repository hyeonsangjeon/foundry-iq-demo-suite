export type Lang = 'en' | 'ko' | 'zh' | 'hi'

export interface I18nData {
  badge: string
  h1_1: string
  h1_2: string
  hero_sub: string
  cta_demo: string
  cta_docs: string
  scroll: string
  pipe_label: string
  pipe_title: string
  pipe_desc: string
  s1_name: string
  s1_brief: string
  s2_name: string
  s2_brief: string
  s3_name: string
  s3_brief: string
  s4_name: string
  s4_brief: string
  pill_label: string
  pill_title: string
  pill_desc: string
  p1_title: string
  p1_desc: string
  p1_stat: string
  p2_title: string
  p2_desc: string
  p2_stat: string
  p3_title: string
  p3_desc: string
  p3_stat: string
  iq_label: string
  iq_title: string
  iq_desc: string
  iq1_desc: string
  iq1_tag: string
  iq2_desc: string
  iq2_tag: string
  iq3_desc: string
  iq3_tag: string
  cta_title: string
  cta_sub: string
  cta_launch: string
}

export interface PipeStepDetail {
  label: string
  color: string
  text: string
}

export interface PipeDetailData {
  plan: PipeStepDetail
  retrieve: PipeStepDetail
  assess: PipeStepDetail
  synthesize: PipeStepDetail
}

export const i18n: Record<Lang, I18nData> = {
  en: {
    badge: 'Public Preview — Built on Azure AI Search',
    h1_1: 'The Knowledge Layer',
    h1_2: 'for AI Agents',
    hero_sub:
      'One unified endpoint. Multi-source retrieval. Permission-aware grounding. Foundry IQ turns Azure AI Search into an agentic retrieval engine that plans, searches, and synthesizes — so your agents don\'t hallucinate.',
    cta_demo: 'Launch Demo',
    cta_docs: 'Microsoft Docs ↗',
    scroll: 'Scroll',
    pipe_label: 'AGENTIC RETRIEVAL PIPELINE',
    pipe_title: 'Retrieval as a reasoning task.',
    pipe_desc:
      'Traditional RAG sends one query to one index. Foundry IQ treats retrieval as a multi-step reasoning process — an LLM plans sub-queries, executes hybrid search, self-assesses quality, and synthesizes grounded answers with citations.',
    s1_name: 'Plan',
    s1_brief: 'LLM decomposes complex queries into focused sub-queries',
    s2_name: 'Retrieve',
    s2_brief: 'Vector + keyword search across all sources simultaneously',
    s3_name: 'Assess',
    s3_brief: 'Reflective search — iterates if results are insufficient',
    s4_name: 'Synthesize',
    s4_brief: 'Grounded answer with inline citations',
    pill_label: 'CORE CAPABILITIES',
    pill_title: 'Three pillars of intelligent retrieval.',
    pill_desc:
      'Knowledge Bases, Agentic Retrieval, and Grounded Answers — replacing fragmented RAG pipelines with a single, reusable knowledge layer.',
    p1_title: 'Knowledge Bases',
    p1_desc:
      'Topic-centric collections connecting Blob Storage, SharePoint, OneLake, and the web into one reusable endpoint. Automatic indexing, chunking, and vectorization included.',
    p1_stat: 'knowledge sources per KB',
    p2_title: 'Agentic Retrieval',
    p2_desc:
      'Self-reflective query engine powered by LLM reasoning. Plans sub-queries, selects sources, runs parallel hybrid search, and iterates until quality thresholds are met.',
    p2_stat: 'RAG answer quality improvement',
    p3_title: 'Grounded Answers',
    p3_desc:
      'Every answer includes inline citations traced to source documents. Agents reason over raw data — no hallucination, full auditability.',
    p3_stat: 'citation-backed responses',
    iq_label: 'MICROSOFT INTELLIGENCE LAYER',
    iq_title: 'Where Foundry IQ fits.',
    iq_desc:
      'Three IQ workloads provide agents with comprehensive organizational context. Foundry IQ is the knowledge layer — connecting enterprise data with the right permissions.',
    iq1_desc:
      'Managed knowledge layer. Connects structured & unstructured data across Azure, SharePoint, OneLake, and the web.',
    iq1_tag: 'THIS DEMO',
    iq2_desc:
      'Semantic intelligence for business data. Ontologies, semantic models, and graphs over OneLake and Power BI.',
    iq2_tag: 'BUSINESS DATA',
    iq3_desc:
      'Contextual intelligence for M365. Collaboration signals from documents, meetings, chats, and workflows.',
    iq3_tag: 'WORK SIGNALS',
    cta_title: 'See it in action.',
    cta_sub:
      'From Knowledge Base query to Trace visualization — experience the full pipeline.',
    cta_launch: 'Launch Demo Suite',
  },
  ko: {
    badge: '퍼블릭 프리뷰 — Azure AI Search 기반',
    h1_1: 'AI 에이전트를 위한',
    h1_2: '지식 계층',
    hero_sub:
      '하나의 통합 엔드포인트. 다중 소스 검색. 권한 인식 그라운딩. Foundry IQ는 Azure AI Search를 에이전틱 검색 엔진으로 전환합니다 — 계획, 검색, 합성을 자동화하여 에이전트의 할루시네이션을 방지합니다.',
    cta_demo: '데모 시작',
    cta_docs: 'Microsoft 문서 ↗',
    scroll: '스크롤',
    pipe_label: '에이전틱 검색 파이프라인',
    pipe_title: '검색을 추론 과제로.',
    pipe_desc:
      '기존 RAG는 하나의 쿼리를 하나의 인덱스에 보냅니다. Foundry IQ는 검색을 다단계 추론으로 취급합니다 — LLM이 서브쿼리를 계획하고, 하이브리드 검색을 실행하고, 품질을 평가하고, 인용 포함 답변을 생성합니다.',
    s1_name: '계획',
    s1_brief: 'LLM이 복잡한 쿼리를 세부 서브쿼리로 분해',
    s2_name: '검색',
    s2_brief: '벡터 + 키워드 검색을 모든 소스에서 동시 실행',
    s3_name: '평가',
    s3_brief: '반성적 검색 — 결과 부족 시 자동 재검색',
    s4_name: '합성',
    s4_brief: '인라인 인용 포함 근거 기반 답변',
    pill_label: '핵심 기능',
    pill_title: '지능형 검색의 세 가지 축.',
    pill_desc:
      'Knowledge Base, 에이전틱 검색, 근거 기반 답변 — 파편화된 RAG 파이프라인을 하나의 재사용 가능한 지식 계층으로 대체합니다.',
    p1_title: 'Knowledge Base',
    p1_desc:
      'Blob Storage, SharePoint, OneLake, 웹 등 여러 데이터 소스를 하나의 재사용 가능한 엔드포인트로 연결합니다. 자동 인덱싱, 청킹, 벡터화 포함.',
    p1_stat: 'KB당 지식 소스',
    p2_title: '에이전틱 검색',
    p2_desc:
      'LLM 추론 기반의 자기 반성적 쿼리 엔진. 서브쿼리 계획, 소스 선택, 병렬 하이브리드 검색, 품질 충족까지 반복합니다.',
    p2_stat: 'RAG 답변 품질 향상',
    p3_title: '근거 기반 답변',
    p3_desc:
      '모든 답변에 소스 문서 추적 인라인 인용이 포함됩니다. 에이전트가 원시 데이터를 기반으로 추론 — 할루시네이션 없음, 완전한 감사 추적.',
    p3_stat: '인용 기반 응답',
    iq_label: '마이크로소프트 인텔리전스 레이어',
    iq_title: 'Foundry IQ의 위치.',
    iq_desc:
      '세 가지 IQ 워크로드가 에이전트에 종합적인 조직 컨텍스트를 제공합니다. Foundry IQ는 지식 계층으로서 올바른 권한으로 기업 데이터를 연결합니다.',
    iq1_desc:
      '관리형 지식 계층. Azure, SharePoint, OneLake, 웹의 정형/비정형 데이터를 연결합니다.',
    iq1_tag: '이 데모',
    iq2_desc:
      '비즈니스 데이터를 위한 시맨틱 인텔리전스. OneLake과 Power BI의 온톨로지, 시맨틱 모델, 그래프.',
    iq2_tag: '비즈니스 데이터',
    iq3_desc: 'M365를 위한 컨텍스트 인텔리전스. 문서, 미팅, 채팅, 워크플로의 협업 시그널.',
    iq3_tag: '업무 시그널',
    cta_title: '직접 체험해보세요.',
    cta_sub: 'Knowledge Base 쿼리부터 Trace 시각화까지 — 전체 파이프라인을 경험하세요.',
    cta_launch: '데모 시작하기',
  },
  zh: {
    badge: '公共预览版 — 基于 Azure AI Search',
    h1_1: 'AI 智能体的',
    h1_2: '知识层',
    hero_sub:
      '统一端点、多源检索、权限感知接地。Foundry IQ 将 Azure AI Search 转变为代理检索引擎 — 自动规划、搜索和合成，确保智能体不会产生幻觉。',
    cta_demo: '启动演示',
    cta_docs: 'Microsoft 文档 ↗',
    scroll: '滚动',
    pipe_label: '代理检索管道',
    pipe_title: '检索即推理任务。',
    pipe_desc:
      '传统 RAG 将单个查询发送到单个索引。Foundry IQ 将检索视为多步推理 — LLM 规划子查询、执行混合搜索、自我评估质量，并生成带引用的接地答案。',
    s1_name: '规划',
    s1_brief: 'LLM 将复杂查询分解为聚焦的子查询',
    s2_name: '检索',
    s2_brief: '向量 + 关键字搜索在所有源上同时执行',
    s3_name: '评估',
    s3_brief: '反思性搜索 — 结果不足时自动迭代',
    s4_name: '合成',
    s4_brief: '带内联引用的接地答案',
    pill_label: '核心能力',
    pill_title: '智能检索的三大支柱。',
    pill_desc:
      '知识库、代理检索和接地答案 — 用单一可复用的知识层替代碎片化的 RAG 管道。',
    p1_title: '知识库',
    p1_desc:
      '以主题为中心，将 Blob 存储、SharePoint、OneLake、网络连接为一个可复用端点。包含自动索引、分块和向量化。',
    p1_stat: '每个 KB 的知识源数',
    p2_title: '代理检索',
    p2_desc:
      '由 LLM 推理驱动的自反查询引擎。规划子查询、选择源、并行混合搜索，迭代直到满足质量阈值。',
    p2_stat: 'RAG 答案质量提升',
    p3_title: '接地答案',
    p3_desc:
      '每个答案都附带追溯到源文档的内联引用。智能体基于原始数据推理 — 无幻觉，完全可审计。',
    p3_stat: '引用支持的响应',
    iq_label: '微软智能层',
    iq_title: 'Foundry IQ 的定位。',
    iq_desc:
      '三个 IQ 工作负载为智能体提供全面的组织上下文。Foundry IQ 是知识层 — 以正确的权限连接企业数据。',
    iq1_desc:
      '托管知识层。连接 Azure、SharePoint、OneLake 和网络上的结构化和非结构化数据。',
    iq1_tag: '本演示',
    iq2_desc:
      '面向业务数据的语义智能。OneLake 和 Power BI 上的本体、语义模型和图谱。',
    iq2_tag: '业务数据',
    iq3_desc: '面向 M365 的上下文智能。来自文档、会议、聊天和工作流的协作信号。',
    iq3_tag: '工作信号',
    cta_title: '实际体验。',
    cta_sub: '从知识库查询到 Trace 可视化 — 体验完整管道。',
    cta_launch: '启动演示套件',
  },
  hi: {
    badge: 'पब्लिक प्रीव्यू — Azure AI Search पर निर्मित',
    h1_1: 'AI एजेंट्स के लिए',
    h1_2: 'नॉलेज लेयर',
    hero_sub:
      'एक एकीकृत एंडपॉइंट। मल्टी-सोर्स रिट्रीवल। परमिशन-अवेयर ग्राउंडिंग। Foundry IQ, Azure AI Search को एजेंटिक रिट्रीवल इंजन में बदलता है — प्लान, सर्च, और सिंथेसाइज़ करता है ताकि एजेंट्स हैलुसिनेट न करें।',
    cta_demo: 'डेमो लॉन्च',
    cta_docs: 'Microsoft डॉक्स ↗',
    scroll: 'स्क्रॉल',
    pipe_label: 'एजेंटिक रिट्रीवल पाइपलाइन',
    pipe_title: 'रिट्रीवल एक रीज़निंग टास्क।',
    pipe_desc:
      'पारंपरिक RAG एक क्वेरी को एक इंडेक्स पर भेजता है। Foundry IQ रिट्रीवल को मल्टी-स्टेप रीज़निंग मानता है — LLM सब-क्वेरीज़ प्लान करता है, हाइब्रिड सर्च करता है, क्वालिटी असेस करता है, और साइटेशन के साथ उत्तर सिंथेसाइज़ करता है।',
    s1_name: 'प्लान',
    s1_brief: 'LLM जटिल क्वेरीज़ को फोकस्ड सब-क्वेरीज़ में विभाजित करता है',
    s2_name: 'रिट्रीव',
    s2_brief: 'सभी सोर्स पर एक साथ वेक्टर + कीवर्ड सर्च',
    s3_name: 'असेस',
    s3_brief: 'रिफ्लेक्टिव सर्च — अपर्याप्त पर पुनरावृत्ति',
    s4_name: 'सिंथेसाइज़',
    s4_brief: 'इनलाइन साइटेशन के साथ ग्राउंडेड उत्तर',
    pill_label: 'मुख्य क्षमताएँ',
    pill_title: 'इंटेलिजेंट रिट्रीवल के तीन स्तंभ।',
    pill_desc:
      'नॉलेज बेस, एजेंटिक रिट्रीवल, और ग्राउंडेड आंसर्स — फ्रैगमेंटेड RAG पाइपलाइन्स को एक रियूज़ेबल नॉलेज लेयर से रिप्लेस करते हैं।',
    p1_title: 'नॉलेज बेस',
    p1_desc:
      'Blob Storage, SharePoint, OneLake, वेब को एक रियूज़ेबल एंडपॉइंट से जोड़ता है। ऑटोमैटिक इंडेक्सिंग, चंकिंग, वेक्टराइज़ेशन शामिल।',
    p1_stat: 'प्रति KB नॉलेज सोर्स',
    p2_title: 'एजेंटिक रिट्रीवल',
    p2_desc:
      'LLM रीज़निंग द्वारा संचालित सेल्फ-रिफ्लेक्टिव क्वेरी इंजन। सब-क्वेरीज़ प्लान, सोर्स सेलेक्ट, पैरेलल हाइब्रिड सर्च, क्वालिटी तक इटरेट।',
    p2_stat: 'RAG उत्तर गुणवत्ता सुधार',
    p3_title: 'ग्राउंडेड आंसर्स',
    p3_desc:
      'हर उत्तर सोर्स डॉक्यूमेंट्स से ट्रेस किए गए इनलाइन साइटेशन के साथ। एजेंट्स रॉ डेटा पर रीज़न करते हैं — कोई हैलुसिनेशन नहीं।',
    p3_stat: 'साइटेशन-बैक्ड रिस्पॉन्सेज़',
    iq_label: 'माइक्रोसॉफ्ट इंटेलिजेंस लेयर',
    iq_title: 'Foundry IQ कहाँ फिट होता है।',
    iq_desc:
      'तीन IQ वर्कलोड एजेंट्स को संगठनात्मक कॉन्टेक्स्ट प्रदान करते हैं। Foundry IQ नॉलेज लेयर है — सही परमिशन से एंटरप्राइज़ डेटा कनेक्ट करता है।',
    iq1_desc:
      'मैनेज्ड नॉलेज लेयर। Azure, SharePoint, OneLake, वेब पर डेटा कनेक्ट करता है।',
    iq1_tag: 'यह डेमो',
    iq2_desc:
      'बिज़नेस डेटा के लिए सिमैंटिक इंटेलिजेंस। OneLake और Power BI पर ऑन्टोलॉजीज़ और ग्राफ्स।',
    iq2_tag: 'बिज़नेस डेटा',
    iq3_desc: 'M365 के लिए कॉन्टेक्स्चुअल इंटेलिजेंस। डॉक्यूमेंट्स, मीटिंग्स, चैट्स से सिग्नल्स।',
    iq3_tag: 'वर्क सिग्नल्स',
    cta_title: 'एक्शन में देखें।',
    cta_sub: 'नॉलेज बेस क्वेरी से Trace विज़ुअलाइज़ेशन तक — पूरी पाइपलाइन अनुभव करें।',
    cta_launch: 'डेमो सुइट लॉन्च',
  },
}

export const pipeDetail: Record<Lang, PipeDetailData> = {
  en: {
    plan: {
      label: 'QUERY PLANNING',
      color: 'var(--accent-blue)',
      text: 'The LLM analyzes your query and conversation history, then decomposes complex questions into focused sub-queries. Each sub-query targets specific knowledge sources, enabling multi-hop reasoning — answering questions that require connecting information across multiple documents.',
    },
    retrieve: {
      label: 'HYBRID SEARCH EXECUTION',
      color: 'var(--accent-cyan)',
      text: 'All sub-queries run simultaneously across knowledge sources using hybrid search — combining vector similarity with keyword matching. Semantic reranking surfaces the most relevant passages. Supports Blob Storage, SharePoint, OneLake, and web sources through a single endpoint.',
    },
    assess: {
      label: 'SELF-ASSESSMENT & ITERATION',
      color: 'var(--accent-purple)',
      text: 'A fine-tuned semantic classifier evaluates whether retrieved results sufficiently answer the query. If gaps exist, the engine automatically rewrites and re-executes queries — iterating until quality thresholds are met. Configurable via Retrieval Reasoning Effort (minimal → low → medium → high).',
    },
    synthesize: {
      label: 'ANSWER SYNTHESIS',
      color: 'var(--accent-orange)',
      text: 'The LLM generates a coherent answer grounded entirely in retrieved content. Every claim is backed by inline citations pointing to specific source documents. Output modes: extractive content (raw references) or synthesized answers with full source attribution.',
    },
  },
  ko: {
    plan: {
      label: '쿼리 계획',
      color: 'var(--accent-blue)',
      text: 'LLM이 쿼리와 대화 히스토리를 분석하여 복잡한 질문을 세부 서브쿼리로 분해합니다. 각 서브쿼리는 특정 지식 소스를 타겟으로 하며, 여러 문서의 정보를 연결하는 멀티홉 추론이 가능합니다.',
    },
    retrieve: {
      label: '하이브리드 검색 실행',
      color: 'var(--accent-cyan)',
      text: '모든 서브쿼리가 하이브리드 검색으로 동시 실행됩니다 — 벡터 유사도와 키워드 매칭을 결합합니다. 시맨틱 리랭킹으로 가장 관련성 높은 구절을 찾습니다. 단일 엔드포인트로 Blob Storage, SharePoint, OneLake, 웹 소스를 지원합니다.',
    },
    assess: {
      label: '자체 평가 및 반복',
      color: 'var(--accent-purple)',
      text: '파인튜닝된 시맨틱 분류기가 검색 결과의 충분성을 평가합니다. 부족하면 쿼리를 자동 재작성하고 재실행 — 품질 임계치를 충족할 때까지 반복합니다. Retrieval Reasoning Effort(minimal → low → medium → high)로 조절 가능.',
    },
    synthesize: {
      label: '답변 합성',
      color: 'var(--accent-orange)',
      text: 'LLM이 검색된 콘텐츠만을 기반으로 일관된 답변을 생성합니다. 모든 주장에는 특정 소스 문서를 가리키는 인라인 인용이 포함됩니다. 출력 모드: 추출형 콘텐츠(원시 참조) 또는 소스 귀속 포함 합성 답변.',
    },
  },
  zh: {
    plan: {
      label: '查询规划',
      color: 'var(--accent-blue)',
      text: 'LLM 分析您的查询和对话历史，将复杂问题分解为聚焦的子查询。每个子查询针对特定知识源，实现多跳推理 — 回答需要跨多个文档连接信息的问题。',
    },
    retrieve: {
      label: '混合搜索执行',
      color: 'var(--accent-cyan)',
      text: '所有子查询使用混合搜索同时在知识源上运行 — 结合向量相似度和关键字匹配。语义重排序呈现最相关的段落。通过单一端点支持 Blob 存储、SharePoint、OneLake 和网络源。',
    },
    assess: {
      label: '自我评估与迭代',
      color: 'var(--accent-purple)',
      text: '微调的语义分类器评估检索结果是否充分。存在差距时，引擎自动重写和重新执行查询 — 迭代直到满足质量阈值。可通过检索推理力度（minimal → low → medium → high）配置。',
    },
    synthesize: {
      label: '答案合成',
      color: 'var(--accent-orange)',
      text: 'LLM 完全基于检索内容生成连贯答案。每个论断都附有指向特定源文档的内联引用。输出模式：提取内容（原始引用）或带完整来源归属的合成答案。',
    },
  },
  hi: {
    plan: {
      label: 'क्वेरी प्लानिंग',
      color: 'var(--accent-blue)',
      text: 'LLM आपकी क्वेरी और कन्वर्सेशन हिस्ट्री का विश्लेषण करता है, जटिल प्रश्नों को फोकस्ड सब-क्वेरीज़ में विभाजित करता है। प्रत्येक सब-क्वेरी विशिष्ट नॉलेज सोर्स को टारगेट करती है, मल्टी-हॉप रीज़निंग सक्षम करती है।',
    },
    retrieve: {
      label: 'हाइब्रिड सर्च एक्जीक्यूशन',
      color: 'var(--accent-cyan)',
      text: 'सभी सब-क्वेरीज़ हाइब्रिड सर्च से नॉलेज सोर्स पर एक साथ रन होती हैं — वेक्टर सिमिलैरिटी और कीवर्ड मैचिंग को मिलाकर। सिमैंटिक रीरैंकिंग सबसे प्रासंगिक पैसेज सामने लाती है।',
    },
    assess: {
      label: 'सेल्फ-असेसमेंट',
      color: 'var(--accent-purple)',
      text: 'फाइन-ट्यून्ड सिमैंटिक क्लासिफायर मूल्यांकन करता है कि रिज़ल्ट्स पर्याप्त हैं या नहीं। गैप होने पर इंजन ऑटोमैटिकली क्वेरीज़ रीराइट और री-एक्जीक्यूट करता है — क्वालिटी थ्रेशोल्ड तक इटरेट करता है।',
    },
    synthesize: {
      label: 'आंसर सिंथेसिस',
      color: 'var(--accent-orange)',
      text: 'LLM पूरी तरह रिट्रीव्ड कंटेंट पर आधारित सुसंगत उत्तर जेनरेट करता है। हर दावे को विशिष्ट सोर्स डॉक्यूमेंट्स के इनलाइन साइटेशन द्वारा समर्थित किया जाता है।',
    },
  },
}

export type StepKey = 'plan' | 'retrieve' | 'assess' | 'synthesize'

export const STEP_KEYS: StepKey[] = ['plan', 'retrieve', 'assess', 'synthesize']

export const STEP_META: Record<StepKey, { num: string; icon: string; iconClass: string; activeGlow: string }> = {
  plan: {
    num: 'STEP 01',
    icon: '⚡',
    iconClass: 'si-plan',
    activeGlow: 'rgba(77,166,255,0.25)',
  },
  retrieve: {
    num: 'STEP 02',
    icon: '🔍',
    iconClass: 'si-retrieve',
    activeGlow: 'rgba(56,217,212,0.25)',
  },
  assess: {
    num: 'STEP 03',
    icon: '🔄',
    iconClass: 'si-assess',
    activeGlow: 'rgba(155,122,255,0.25)',
  },
  synthesize: {
    num: 'STEP 04',
    icon: '✨',
    iconClass: 'si-synth',
    activeGlow: 'rgba(255,140,66,0.25)',
  },
}

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'ko', label: '한국어' },
  { code: 'zh', label: '中文' },
  { code: 'hi', label: 'हिन्दी' },
]
