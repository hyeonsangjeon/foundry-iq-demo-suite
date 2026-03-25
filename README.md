# Knowledge Retrieval Studio

> Azure AI Search · Foundry IQ Demo Suite

**Live Demo:** [foundry-iq-demo-suite.vercel.app](https://foundry-iq-demo-suite.vercel.app)

A deployable reference app showcasing Foundry IQ's Knowledge Retrieval capabilities
— from single KB search to multi-source Semantic JOIN with live API.

---

## What this demo shows

| Phase | Feature | Data Source | Status |
|-------|---------|-------------|--------|
| 1 | Agentic Retrieval | Azure Blob Storage → KB (8 KBs) | ✅ Live |
| 2 | SharePoint Connector | SharePoint Document Library → KB | ✅ Live |
| 3 | Semantic JOIN | Fabric OneLake (JSON + PDF) → unified KB | ✅ Live |

### Phase 3 Highlight: Semantic JOIN

One question answered by combining structured data (Fabric OneLake aggregated JSON)
with unstructured documents (DOT regulation PDFs) — AI Search routes to both sources
simultaneously and synthesizes a cited answer.

---

## Architecture

- **Frontend:** Next.js 14 + Tailwind CSS
- **Hosting:** Vercel
- **Search:** Azure AI Search (Agentic Retrieval, KB Retrieve API)
- **Knowledge Bases:** 8 KBs (Hotels, Finance, Health, NASA, IDFC Banking, Sustainable AI, SharePoint Policies, Unified Airline)
- **Data Sources:** Fabric OneLake, SharePoint, Azure Blob Storage
- **Model:** Azure OpenAI (answerSynthesis via Managed Identity — no API key)
- **i18n:** 5 languages (EN, 한국어, 中文, 日本語, हिन्दी)

---

## Quick Start

### Prerequisites

- Node.js 18+
- Azure AI Search resource with Agentic Retrieval enabled
- Azure OpenAI resource (for answerSynthesis)

### Setup

```bash
git clone https://github.com/hyeonsangjeon/foundry-iq-demo-suite.git
cd foundry-iq-demo-suite
cp .env.example .env.local
# Edit .env.local with your Azure credentials
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

```dotenv
AZURE_SEARCH_ENDPOINT=https://your-search.search.windows.net
AZURE_SEARCH_API_KEY=your-key
AZURE_SEARCH_API_VERSION=2025-11-01-preview
NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT=https://your-openai.cognitiveservices.azure.com
```

See [.env.example](.env.example) for the full list including Service Principal auth and Foundry project settings.

---

## Knowledge Bases

| KB Name | Documents | Source | Use Case |
|---------|-----------|--------|----------|
| hotels-sample | ~50 | Azure Blob (JSON) | Hotel reviews search |
| finance-docs | 296 | Azure Blob (PDF) | SEC/Vanguard financial docs |
| health-plan | 410 | Azure Blob (PDF) | Health plan documents |
| nasa-earth-book | ~85 | Azure Blob (PDF/JSON) | NASA Earth at Night |
| idfc-banking | 413 | Azure Blob (PDF) | IDFC Bank investor docs |
| sustainable-ai | 93 | Azure Blob (PDF) | Microsoft Responsible AI |
| sp-airline-policies | — | SharePoint (PDF) | DOT airline regulations |
| unified-airline | 244 | Fabric OneLake (JSON+PDF) | ★ Phase 3 Semantic JOIN |

---

## Key Concepts

**Knowledge Base (KB)** — The container. Groups multiple data sources into one
searchable endpoint. One API call, multiple sources, cited answers.

**Knowledge Source (KS)** — The data plug. Each KS connects to one source:
indexedOneLake, searchIndex, indexedSharePoint, indexedBlobStorage, web, remote SharePoint.

**Semantic JOIN** — One question that requires both structured data (numbers)
and unstructured documents (policies) to answer. AI Search routes to both,
LLM synthesizes a unified answer with citations from each source.

---

## Project Structure

```
app/
├── page.tsx                    # Landing page
├── test/                       # Phase 1: Foundry IQ Agentic Retrieval
├── knowledge/                  # KB management
├── sharepoint/                 # Phase 2: SharePoint Connector
├── semantic-join/              # Phase 3: Semantic JOIN (Live API)
├── what-is-foundry-iq/         # Foundry IQ explainer (4 languages)
├── api/
│   ├── knowledge-bases/        # KB CRUD API
│   ├── sharepoint/             # SP connector API
│   └── semantic-join/          # Phase 3 KB Retrieve API
components/                     # Shared UI components
lib/
├── i18n.ts                     # Internationalization
└── i18n/translations.ts        # 5-language translations
scripts/                        # Azure setup scripts
notebooks/                      # Fabric notebook (EDA + data aggregation)
public/
├── fabric_iq_flight_data_profile.html  # Phase 3 backup (mock simulation)
└── icons/                      # App icons
```

---

## Resources

- [What is Foundry IQ? — Microsoft Learn](https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/what-is-foundry-iq)
- [Foundry IQ FAQ — Microsoft Learn](https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/foundry-iq-faq)
- [Foundry IQ Deep Dive — Tech Community](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/foundry-iq-unlocking-ubiquitous-knowledge-for-agents/4470812)
- [IQ Series: Foundry IQ — Tech Community](https://techcommunity.microsoft.com/blog/azuredevcommunityblog/announcing-the-iq-series-foundry-iq/4501862)
- [Kaggle: US DOT Flight Delays 2015](https://www.kaggle.com/datasets/usdot/flight-delays)

---

## Author

**Hyeonsang Jeon** — Sr. Solution Engineer, Microsoft AI Global Black Belt.

---

*Powered by Azure AI Search · Foundry IQ*

## Reference

Phase 1 based on [farzad528/azure-ai-search-knowledge-retrieval-demo](https://github.com/farzad528/azure-ai-search-knowledge-retrieval-demo) (MIT License).


