# Foundry IQ Demo Suite

Azure AI Search (Foundry IQ) Knowledge Retrieval demo app.
Visualize the Agentic RAG pipeline (Plan → Retrieve → Assess → Synthesize)
and switch between industry-specific Knowledge Bases in real time.

## Knowledge Bases

| KB | Industry | Docs | Data Source |
|----|----------|------|-------------|
| Hotels | Hospitality & Travel | 50 | Azure-Samples/azure-search-sample-data/hotels |
| NASA Earth Book | Earth Science & Space | 85 | Azure-Samples/azure-search-sample-data/nasa-e-book |
| Health Plan | Insurance & Benefits | 410 | Azure-Samples/azure-search-sample-data/health-plan |
| Sustainable AI | Technology & Sustainability | 93 | Azure-Samples/azure-search-sample-data/sustainable-ai-pdf |
| Financial | Financial Services | 304 | SEC.gov + Vanguard public PDFs |

## Features

- **Agentic Retrieval Pipeline** — 4-stage reasoning (Plan → Retrieve → Assess → Synthesize)
- **Industry Knowledge Selector** — 8 industry cards, 5 active KBs
- **Inline Citations** — Every answer traced to source documents
- **Trace Explorer** — Collapsible retrieval trace with Session Overview metrics
- **NASA Image Rendering** — Earth at Night satellite imagery in chat
- **Conversation Starters** — Pre-tested per-KB sample queries
- **Multi-language** — EN / 한국어 / 中文 / 日本語 / हिन्दी
- **Dark Mode** — Full dark/light theme support

## Demos

| Demo | Route | Status |
|------|-------|--------|
| Foundry IQ (KB Playground) | `/test` | ✅ Active |
| What is Foundry IQ? | `/what-is-foundry-iq` | ✅ Active |
| Knowledge Management | `/knowledge` | ✅ Active |
| SharePoint Connector | Phase 2 | 🔧 Coming Soon |
| MCP Agent Grounding | Phase 3 | 🔧 Coming Soon |

## Quick Start

```bash
git clone https://github.com/hyeonsangjeon/foundry-iq-demo-suite.git
cd foundry-iq-demos
npm install
cp .env.example .env.local
# Edit .env.local with your Azure credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See `.env.example` for all options. Required:

```
AZURE_SEARCH_ENDPOINT=https://<your-search>.search.windows.net
AZURE_SEARCH_API_KEY=<admin-or-query-key>
NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT=https://<your-openai>.openai.azure.com
AZURE_OPENAI_API_KEY=<openai-key>
```

## Tech Stack

- **Framework:** Next.js 14 + React 18 + TypeScript
- **Styling:** Tailwind CSS + Custom Design Tokens (tokens.json)
- **Animation:** Framer Motion
- **Icons:** Fluent UI React Icons + Lucide React
- **Azure:** AI Search (2025-11-01-preview) + Azure OpenAI (GPT-4o)
- **Deployment:** Vercel

## Project Structure

```
app/           → Next.js 14 App Router (pages + API routes)
components/    → React components (UI primitives, playground, trace explorer)
lib/           → Utilities (API client, i18n, motion variants)
config/        → Conversation starters JSON + schema
types/         → TypeScript definitions
public/        → Static assets
```

## 👤 Author
**Hyeonsang Jeon**  
Sr. Solution Engineer · Global Black Belt — AI Apps | Microsoft Asia, Korea  

## 📄 License
MIT — See [LICENSE](LICENSE) for details.

## Reference
Phase1 Based on [farzad528/foundry-iq-demo] (MIT License).


