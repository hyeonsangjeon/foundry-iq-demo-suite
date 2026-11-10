'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowDown20Regular,
  ArrowRight20Regular,
  ArrowUpRight20Regular,
  BookOpen20Regular,
  BranchForkLink20Regular,
  ChevronLeft20Regular,
  Database20Regular,
  DocumentMultiple20Regular,
  Globe20Regular,
  PlugConnected20Regular,
  Search20Regular,
} from '@fluentui/react-icons';

import { getLocale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type Language = 'en' | 'ko';
type Copy = { en: string; ko: string };
type MenuItem = {
  href: string;
  title: Copy;
  description: Copy;
  detail: Copy;
  icon: typeof Search20Regular;
};

const menus: MenuItem[] = [
  {
    href: '/test',
    title: { en: 'Foundry IQ', ko: 'Foundry IQ' },
    description: { en: 'Ask your knowledge base a question.', ko: '내 지식 베이스에 질문합니다.' },
    detail: { en: 'Choose a KB, review its answer and sources, then add Web IQ when you need public-web context.', ko: '지식 베이스를 고르고 답변과 출처를 확인합니다. 공개 웹 정보가 필요하면 Web IQ를 추가합니다.' },
    icon: Search20Regular,
  },
  {
    href: '/knowledge',
    title: { en: 'Knowledge', ko: '지식 관리' },
    description: { en: 'Choose which information the app can use.', ko: '답변에 활용할 자료를 연결합니다.' },
    detail: { en: 'View and manage knowledge bases and their connected knowledge sources in Azure AI Search.', ko: 'Azure AI Search의 지식 베이스와 연결된 지식 원본을 확인하고 관리합니다.' },
    icon: Database20Regular,
  },
  {
    href: '/sharepoint',
    title: { en: 'SharePoint', ko: 'SharePoint' },
    description: { en: 'Make team documents searchable.', ko: '팀 문서를 검색 가능한 지식으로 만듭니다.' },
    detail: { en: 'Walk through connecting, indexing, and querying a document library. Sample and configured live modes are available.', ko: '문서 라이브러리 연결부터 색인, 질문까지 따라갑니다. 예시 모드와 연결 설정 후 사용하는 실제 조회 모드가 있습니다.' },
    icon: DocumentMultiple20Regular,
  },
  {
    href: '/semantic-join',
    title: { en: 'Semantic Join', ko: '시맨틱 조인' },
    description: { en: 'Read operational data alongside policy.', ko: '운영 데이터와 업무 규정을 함께 봅니다.' },
    detail: { en: 'Use example questions to query operational data alongside policy. The live KB searches OneLake content indexed in Azure AI Search.', ko: '예시 질문으로 운영 데이터와 업무 규정을 함께 조회합니다. Azure AI Search에 색인된 OneLake 자료를 실제 지식 베이스에서 검색합니다.' },
    icon: BranchForkLink20Regular,
  },
  {
    href: '/mcp-ks',
    title: { en: 'MCP KS', ko: 'MCP KS' },
    description: { en: 'Bring Microsoft Learn into the answer.', ko: 'Microsoft Learn 문서를 답변의 근거로 씁니다.' },
    detail: { en: 'Query Microsoft Learn through an MCP Server knowledge source. Inspect live sources and activity, or explore a sample.', ko: 'MCP Server 지식 원본을 통해 Microsoft Learn을 조회합니다. 실제 출처와 조회 과정을 확인하거나 예시를 살펴볼 수 있습니다.' },
    icon: PlugConnected20Regular,
  },
  {
    href: '/fabric-iq-ks',
    title: { en: 'Fabric IQ KS', ko: 'Fabric IQ KS' },
    description: { en: 'Explore data in business terms.', ko: '업무 용어와 관계로 데이터를 이해합니다.' },
    detail: { en: 'Explore an ontology example and existing-KB queries. The guide covers native Fabric Ontology setup; this page starts with sample data.', ko: '온톨로지 예시와 기존 지식 베이스 조회를 살펴봅니다. 화면은 예시 데이터로 시작하며, Fabric Ontology 직접 연결은 구성 가이드에서 안내합니다.' },
    icon: BranchForkLink20Regular,
  },
  {
    href: '/web-iq',
    title: { en: 'Web IQ', ko: 'Web IQ' },
    description: { en: 'See what public-web information adds.', ko: '웹 정보가 판단에 어떤 차이를 만드는지 봅니다.' },
    detail: { en: 'Executive explains the value with a fictional shipment story. Tech runs public-web searches. Use Foundry IQ to combine them with your KB.', ko: 'Executive는 가상의 화물 시나리오로 설명하고, Tech는 실제 공개 웹을 검색합니다. 내 지식 베이스와 함께 질문하려면 Foundry IQ로 이동합니다.' },
    icon: Globe20Regular,
  },
  {
    href: '/guides',
    title: { en: 'Guides', ko: '구성 가이드' },
    description: { en: 'Connect the sources you need.', ko: '필요한 원본을 직접 연결합니다.' },
    detail: { en: 'Follow setup guidance for Search Index, SharePoint, MCP Server, and Fabric Ontology knowledge sources.', ko: 'Search Index, SharePoint, MCP Server, Fabric Ontology 지식 원본의 설정 방법을 확인합니다.' },
    icon: BookOpen20Regular,
  },
];

export default function ArchitecturePage() {
  const [language, setLanguage] = useState<Language>('en');
  useEffect(() => { setLanguage(getLocale() === 'ko' ? 'ko' : 'en'); }, []);
  const pick = (en: string, ko: string) => language === 'ko' ? ko : en;

  return (
    <main className="min-h-screen break-keep bg-bg-canvas text-fg-default">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-fg-muted transition-colors hover:text-fg-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
          <ChevronLeft20Regular className="h-4 w-4" aria-hidden="true" />
          {pick('Home', '홈')}
        </Link>

        <header className="mb-10 mt-7 max-w-3xl">
          <p className="mb-3 text-sm font-medium text-accent">Foundry IQ Demo Suite · {pick('Architecture', '아키텍처')}</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{pick('How a question becomes a grounded answer', '질문 하나가 근거 있는 답변이 되기까지')}</h1>
          <p className="mt-5 text-base leading-7 text-fg-muted">
            {pick('Find relevant knowledge, add public-web information when needed, and review the answer with its sources. Here is how this app connects the Microsoft services behind that experience.', '필요한 자료를 찾고, 공개 웹 정보를 더해 답변과 출처를 함께 확인합니다. 이 앱에서 각 Microsoft 서비스가 맡는 역할을 한눈에 살펴보세요.')}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PageLink href="/test" primary>{pick('Ask your knowledge base', '내 지식 베이스로 질문하기')}</PageLink>
            <PageLink href="/web-iq">{pick('Explore the Web IQ story', 'Web IQ 시나리오 보기')}</PageLink>
          </div>
        </header>

        <section aria-labelledby="answer-flow-heading" className="rounded-2xl border border-stroke-divider bg-bg-card p-5 sm:p-8">
          <div className="mb-7">
            <h2 id="answer-flow-heading" className="text-xl font-semibold">{pick('The answer flow', '답변이 만들어지는 흐름')}</h2>
            <p className="mt-2 text-sm leading-6 text-fg-muted">{pick('Start in Foundry IQ. The app queries the knowledge base first; Web IQ adds a second step when you select it.', 'Foundry IQ 메뉴에서 시작합니다. 먼저 지식 베이스를 조회하고, Web IQ를 선택하면 웹 정보를 추가로 살펴봅니다.')}</p>
          </div>

          <figure aria-labelledby="answer-flow-heading">
            <div className="mx-auto max-w-2xl rounded-xl border border-accent/30 bg-accent/10 px-5 py-5 text-center">
              <p className="text-xs font-medium text-accent">{pick('Your question · Foundry IQ menu', '사용자의 질문 · Foundry IQ 메뉴')}</p>
              <p className="mt-2 text-lg font-medium">{pick('What do our records tell us, and does the latest web information change the answer?', '우리 자료로는 어떻게 보이나요? 최근 웹 정보를 더하면 답이 달라질까요?')}</p>
            </div>
            <FlowArrow label={pick('The app queries your selected knowledge base', '앱이 선택한 지식 베이스에 질문합니다')} />

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-xl border border-stroke-divider bg-bg-canvas p-5 sm:p-6">
                <p className="text-xs font-semibold text-accent">{pick('01 · Knowledge-base retrieval', '01 · 지식 베이스 조회')}</p>
                <h3 className="mt-2 text-xl font-semibold">Foundry IQ</h3>
                <p className="mt-1 text-sm font-medium text-fg-muted">Azure AI Search · Knowledge Base</p>
                <p className="mt-4 text-sm leading-6 text-fg-muted">{pick('The knowledge base finds relevant evidence in its connected sources and returns it with references.', '지식 베이스가 연결된 원본에서 질문에 필요한 자료를 찾아 출처와 함께 돌려줍니다.')}</p>

                <div className="mt-5 space-y-3 border-t border-stroke-divider pt-5">
                  <SourceRow icon={Database20Regular} title="Search Index · Azure Blob Storage" description={pick('Searchable documents and records', '검색할 수 있도록 준비된 문서와 기록')} />
                  <SourceRow icon={DocumentMultiple20Regular} title="SharePoint · Microsoft OneLake" description={pick('Team documents and business data', '팀 문서와 업무 데이터')} />
                  <SourceRow icon={PlugConnected20Regular} title="Microsoft Learn MCP" description={pick('Official documentation retrieved through an MCP Server source', 'MCP Server 원본으로 조회하는 공식 문서')} />
                  <SourceRow icon={BranchForkLink20Regular} title="Fabric IQ · Ontology" description={pick('Business entities and relationships · setup guide', '업무 대상과 관계를 연결하는 온톨로지 · 구성 가이드')} href="/guides/fabric-iq-ontology" />
                </div>
                <p className="mt-4 text-xs leading-5 text-fg-subtle">{pick('Each KB uses the sources configured for it. These are connection options, not a claim that every source is active.', '실제 조회 대상은 선택한 지식 베이스의 설정에 따릅니다. 위 목록은 연결 가능한 경로이며, 모든 원본이 연결되어 있다는 뜻은 아닙니다.')}</p>

                <div className="mt-5 rounded-lg border border-stroke-divider bg-bg-subtle p-4">
                  <p className="text-sm font-semibold">Azure OpenAI</p>
                  <p className="mt-1 text-xs leading-5 text-fg-muted">{pick('A model configured on the KB can plan the search and write the answer, according to its reasoning and output settings.', '지식 베이스에 설정된 모델이 검색 계획과 답변 생성을 돕습니다. 사용 범위는 추론 및 출력 설정에 따릅니다.')}</p>
                </div>
              </div>

              <div className="flex flex-col rounded-xl border border-dashed border-accent/50 bg-accent/5 p-5 sm:p-6">
                <p className="text-xs font-semibold text-accent">{pick('02 · Optional: add Web IQ to the KB results', '02 · 선택 시 추가: 지식 베이스 조회 결과에 Web IQ 더하기')}</p>
                <h3 className="mt-2 text-xl font-semibold">Microsoft Web IQ</h3>
                <p className="mt-1 text-sm font-medium text-fg-muted">{pick('Search the public web', '공개 웹 검색')}</p>
                <p className="mt-4 text-sm leading-6 text-fg-muted">{pick('The app makes a separate Web IQ request to find web pages relevant to the question.', '앱이 Web IQ를 별도로 호출해 질문과 관련된 웹 페이지를 찾습니다.')}</p>
                <div className="mt-5 rounded-lg border border-stroke-divider bg-bg-canvas p-4">
                  <SourceRow icon={Globe20Regular} title={pick('Public notices, news, and web pages', '공개 공지, 뉴스, 웹 페이지')} description={pick('The search request contains the question. KB passages are passed to the answer model below.', '웹 검색에는 질문을 전달합니다. 지식 베이스의 원문 근거는 아래 답변 모델에 전달합니다.')} />
                </div>
                <FlowArrow label={pick('KB evidence + KB answer, if returned + web results', '지식 베이스 원문 근거 + 답변(반환된 경우) + 웹 검색 결과')} />
                <div className="rounded-lg border border-accent/30 bg-bg-canvas p-4">
                  <p className="text-sm font-semibold">Azure OpenAI</p>
                  <p className="mt-2 text-sm leading-6 text-fg-muted">{pick('The app asks the model to combine both results, distinguish internal and web findings, and cite the evidence.', '앱이 두 결과를 모델에 전달합니다. 모델은 내부 자료와 웹에서 확인한 내용을 구분하고, 근거를 인용해 답변을 정리합니다.')}</p>
                </div>
                <p className="mt-5 text-xs leading-5 text-fg-muted">{pick('This Web IQ path is connected by the app. It is separate from the knowledge base’s own knowledge-source settings.', '이 Web IQ 경로는 앱에서 연결합니다. 지식 베이스 자체의 지식 원본 설정과는 별도입니다.')}</p>
              </div>
            </div>

            <FlowArrow label={pick('Review the answer and follow its sources', '답변을 읽고, 출처를 따라 근거를 확인합니다')} />
            <div className="rounded-xl border border-stroke-divider bg-bg-subtle p-5 sm:p-6">
              <h3 className="text-center text-lg font-semibold">{pick('An answer you can check', '근거를 확인하며 검토하는 답변')}</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold">{pick('Knowledge base only', '지식 베이스만 활용')}</p>
                  <p className="mt-1 text-sm leading-6 text-fg-muted">{pick('Read the KB response and inspect the returned references and retrieval activity.', '지식 베이스의 응답을 읽고, 반환된 출처와 조회 과정을 살펴봅니다.')}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">{pick('Knowledge base + Web IQ', '지식 베이스 + Web IQ')}</p>
                  <p className="mt-1 text-sm leading-6 text-fg-muted">{pick('Compare what the KB established with what the web adds, including gaps or conflicting evidence.', '기존 자료에서 알 수 있는 내용과 웹에서 더 확인한 내용을 비교합니다. 근거가 부족하거나 서로 다르면 그 점도 확인합니다.')}</p>
                </div>
              </div>
            </div>
            <figcaption className="mt-5 text-sm leading-6 text-fg-muted">{pick('The Web IQ Executive story uses fictional data to explain this value. Live public-web search is in Tech; combined KB and web answers are in the Foundry IQ menu.', 'Web IQ의 Executive 시나리오는 이 가치를 설명하는 가상 사례입니다. 실제 웹 검색은 Tech에서, 내 지식 베이스와 웹을 함께 활용한 답변은 Foundry IQ 메뉴에서 확인합니다.')}</figcaption>
          </figure>
        </section>

        <section aria-labelledby="usage-flow-heading" className="mt-8 rounded-2xl border border-stroke-divider bg-bg-card p-5 sm:p-8">
          <h2 id="usage-flow-heading" className="text-xl font-semibold">{pick('Live web searches run within shared limits', '실제 웹 검색은 한도를 확인한 뒤 실행합니다')}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-fg-muted">{pick('Before a paid Web IQ request starts, the server reserves its estimated maximum cost. Requests share one usage record, so simultaneous visitors cannot spend the same remaining allowance.', '유료 Web IQ 호출을 시작하기 전에 서버가 예상 최대 비용을 먼저 확보합니다. 모든 요청이 하나의 사용 기록을 함께 확인하므로, 여러 방문자가 동시에 남은 한도를 중복 사용하지 않습니다.')}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-stroke-divider bg-bg-canvas p-4">
              <p className="text-sm font-semibold">{pick('100 requests per IP in a rolling 2-minute window', 'IP별 최근 2분 동안 최대 100회')}</p>
              <p className="mt-1 text-xs leading-5 text-fg-muted">{pick('The rate allowance returns as earlier requests leave the window.', '앞선 요청이 2분 범위를 벗어나면 다시 이용할 수 있습니다.')}</p>
            </div>
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
              <p className="text-sm font-semibold">{pick('$5 per day, shared by all visitors', '모든 방문자가 함께 쓰는 하루 $5 한도')}</p>
              <p className="mt-1 text-xs leading-5 text-fg-muted">{pick('Resets at midnight Korea time. Waiting 2 minutes does not reset the daily budget.', '한국시간 자정에 초기화됩니다. 2분이 지나도 하루 금액 한도는 초기화되지 않습니다.')}</p>
            </div>
          </div>

          <figure className="mt-6" aria-labelledby="usage-control-caption">
            <figcaption id="usage-control-caption" className="mb-3 text-xs font-semibold text-accent">{pick('Usage approval path', '사용 가능 여부를 확인하는 경로')}</figcaption>
            <ol className="flex flex-col gap-3 lg:flex-row">
              {[
                { title: pick('Browser', '브라우저'), detail: pick('Choose a demo question', '체험할 질문 선택') },
                { title: 'Next.js', detail: pick('Server requests approval', '서버에서 사용 요청') },
                { title: 'Azure Container Apps', detail: pick('Usage service reserves the cost', '사용량 서비스에서 비용 확보') },
                { title: 'NSP · Enforced', detail: pick('Managed identity authenticates access', '관리 ID로 접근 인증') },
                { title: 'Azure Blob Storage', detail: pick('Private usage ledger', '비공개 사용량 원장') },
              ].map((step, index, steps) => (
                <li key={step.title} className="flex min-w-0 flex-1 flex-col items-center gap-3 lg:flex-row">
                  <div className="w-full flex-1 rounded-lg border border-stroke-divider bg-bg-canvas p-4 lg:min-h-32">
                    <p className="text-xs font-medium text-accent">{String(index + 1).padStart(2, '0')}</p>
                    <p className="mt-2 text-sm font-semibold">{step.title}</p>
                    <p className="mt-1 text-xs leading-5 text-fg-muted">{step.detail}</p>
                  </div>
                  {index < steps.length - 1 && <ArrowDown20Regular className="h-4 w-4 shrink-0 text-accent lg:-rotate-90" aria-hidden="true" />}
                </li>
              ))}
            </ol>
            <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-4">
              <p className="text-sm font-semibold">{pick('After the reservation succeeds, the Next.js server runs the search', '비용 확보에 성공하면 Next.js 서버가 검색을 실행합니다')}</p>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-6 text-fg-muted">
                <span>Next.js</span><ArrowRight20Regular className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <span>{pick('Web IQ search', 'Web IQ 검색')}</span><ArrowRight20Regular className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <span>{pick('Optional Azure OpenAI synthesis', '필요시 Azure OpenAI 추가 답변')}</span>
              </p>
              <p className="mt-2 text-xs leading-5 text-fg-muted">{pick('The usage service only approves and records usage. Questions, source passages, and paid AI requests follow the answer flow above.', '사용량 서비스는 사용 승인과 기록을 담당합니다. 질문·원문 근거·유료 AI 요청은 위의 답변 생성 경로로 처리합니다.')}</p>
            </div>
          </figure>

          <p className="mt-4 text-sm leading-6 text-fg-muted">{pick('If the allowance is exhausted or usage cannot be checked, paid Web IQ calls stop. The fictional Executive scenario remains available.', '한도를 모두 사용했거나 사용량을 확인할 수 없으면 유료 Web IQ 호출을 시작하지 않습니다. Executive의 가상 시나리오는 계속 볼 수 있습니다.')}</p>

          <details className="mt-5 rounded-xl border border-stroke-divider bg-bg-canvas p-4">
            <summary className="cursor-pointer text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">{pick('What is stored, protected, and counted?', '무엇을 저장하고, 어디까지 한도에 포함하나요?')}</summary>
            <dl className="mt-4 grid gap-5 text-sm leading-6 sm:grid-cols-2">
              <div>
                <dt className="font-semibold">{pick('Stored information', '저장하는 정보')}</dt>
                <dd className="mt-1 text-fg-muted">{pick('Only a hash of the IP address, timestamps, reservations, and cost totals are stored. Questions and KB passages are not sent to the usage service or saved in its ledger.', '원장에는 IP 주소의 해시, 요청 시각, 예약 내역, 비용만 저장합니다. 질문과 지식 베이스 원문은 사용량 서비스로 보내거나 원장에 저장하지 않습니다.')}</dd>
              </div>
              <div>
                <dt className="font-semibold">{pick('Access and consistency', '접근 보호와 동시 요청 처리')}</dt>
                <dd className="mt-1 text-fg-muted">{pick('Server authentication protects the usage API. Its managed identity accesses Blob through an NSP Enforced subscription rule. Atomic updates keep reservations consistent across requests.', '사용량 API는 서버 인증으로 보호합니다. 관리 ID가 NSP Enforced의 구독 허용 규칙을 통해 Blob에 접근합니다. 원자적 갱신으로 동시에 들어온 요청의 예약 금액을 일관되게 반영합니다.')}</dd>
              </div>
              <div>
                <dt className="font-semibold">{pick('What the $5 covers', '$5 한도에 포함되는 비용')}</dt>
                <dd className="mt-1 text-fg-muted">{pick('Web IQ searches and the additional Azure OpenAI answer that combines web and KB results. Existing KB retrieval and infrastructure costs are outside this budget.', 'Web IQ 검색과 웹·지식 베이스 결과를 함께 정리하는 추가 Azure OpenAI 답변 비용입니다. 기존 지식 베이스 조회와 인프라 운영 비용은 이 한도에 포함되지 않습니다.')}</dd>
              </div>
              <div>
                <dt className="font-semibold">{pick('Current operation', '현재 운영 방식')}</dt>
                <dd className="mt-1 text-fg-muted">{pick('One small usage-service instance stays running in Azure Container Apps. The application remains on Vercel, where it calls Web IQ and Azure OpenAI after approval.', 'Azure Container Apps에서 작은 사용량 서비스 인스턴스 1개를 상시 유지합니다. 앱은 Vercel에서 실행되며, 사용 승인 후 Web IQ와 Azure OpenAI를 호출합니다.')}</dd>
              </div>
            </dl>
          </details>
        </section>

        <section aria-labelledby="menus-heading" className="mt-12">
          <h2 id="menus-heading" className="text-2xl font-semibold">{pick('Where to try each part', '각 기능은 어디서 확인하나요?')}</h2>
          <p className="mt-2 text-sm leading-6 text-fg-muted">{pick('Choose a menu by what you want to learn or connect.', '살펴보고 싶은 내용에 맞춰 메뉴를 선택하세요.')}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {menus.map(item => <MenuCard key={item.href} item={item} language={language} />)}
          </div>
          <p className="mt-4 text-xs leading-5 text-fg-subtle">{pick('Fabric IQ KS live mode currently queries an existing indexed KB and can fall back to a sample if the request fails. Native ontology setup is a separate guide.', 'Fabric IQ KS의 실제 조회 모드는 현재 색인된 기존 지식 베이스를 사용하며, 요청이 실패하면 예시 결과를 표시할 수 있습니다. 온톨로지 직접 연결은 별도 가이드에서 안내합니다.')}</p>
        </section>

        <footer className="mt-10 border-t border-stroke-divider pt-6">
          <p className="mb-3 text-sm font-medium">{pick('Microsoft product references', 'Microsoft 제품 참고 자료')}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-fg-muted">
            <ReferenceLink href="https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/foundry-iq-faq">Foundry IQ · Azure AI Search</ReferenceLink>
            <ReferenceLink href="https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-fabric-ontology">Fabric Ontology</ReferenceLink>
            <ReferenceLink href="https://microsoft.github.io/azure-ai-search-foundry-iq-live-knowledge-sources/">{pick('Live Knowledge Sources manual', 'Live Knowledge Sources 실행 가이드')}</ReferenceLink>
          </div>
        </footer>
      </div>
    </main>
  );
}

function FlowArrow({ label }: { label: string }) {
  return <div className="flex items-center justify-center gap-2 py-4 text-center text-xs leading-5 text-fg-muted"><ArrowDown20Regular className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" /><span>{label}</span></div>;
}

function SourceRow({ icon: Icon, title, description, href }: { icon: typeof Search20Regular; title: string; description: string; href?: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
      <div>
        {href ? <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium hover:text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">{title}<ArrowRight20Regular className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /></Link> : <p className="text-sm font-medium">{title}</p>}
        <p className="mt-1 text-xs leading-5 text-fg-muted">{description}</p>
      </div>
    </div>
  );
}

function PageLink({ href, primary, children }: { href: string; primary?: boolean; children: ReactNode }) {
  return <Link href={href} className={cn('inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', primary ? 'border-accent bg-accent text-fg-on-accent hover:bg-accent/90' : 'border-stroke-divider hover:border-accent/50 hover:bg-bg-subtle')}>{children}<ArrowRight20Regular className="h-4 w-4" aria-hidden="true" /></Link>;
}

function MenuCard({ item, language }: { item: MenuItem; language: Language }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className="group rounded-xl border border-stroke-divider bg-bg-card p-5 transition-colors hover:border-accent/50 hover:bg-bg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
      <div className="flex items-center gap-2 text-accent"><Icon className="h-5 w-5" aria-hidden="true" /><h3 className="text-sm font-semibold">{item.title[language]}</h3><ArrowRight20Regular className="ml-auto h-4 w-4" aria-hidden="true" /></div>
      <p className="mt-3 text-base font-medium">{item.description[language]}</p>
      <p className="mt-2 text-sm leading-6 text-fg-muted">{item.detail[language]}</p>
    </Link>
  );
}

function ReferenceLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">{children}<ArrowUpRight20Regular className="h-4 w-4" aria-hidden="true" /></a>;
}
