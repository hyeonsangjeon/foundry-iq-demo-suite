<p align="center">
  <img src="public/icons/foundryiq.svg" alt="Foundry IQ" width="72" />
</p>

<h1 align="center">Foundry IQ Demo Suite</h1>

<p align="center">
  <strong>A live Knowledge Retrieval Studio for Azure AI Search, Foundry IQ, Knowledge Sources, Semantic JOIN, Fabric IQ, SharePoint, and MCP Server grounding.</strong>
</p>

<p align="center">
  <a href="https://foundry-iq-demo-suite.vercel.app"><img alt="Live Demo" src="https://img.shields.io/badge/Live%20Demo-Open%20the%20App-38bdf8?style=for-the-badge"></a>
  <a href="https://learn.microsoft.com/azure/search/"><img alt="Azure AI Search" src="https://img.shields.io/badge/Azure%20AI%20Search-Knowledge%20Bases-0078d4?style=for-the-badge"></a>
  <a href="https://nextjs.org/"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge"></a>
  <a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge"></a>
</p>

![Foundry IQ Demo Suite showcase](public/readme/showcase.svg)

![Knowledge Retrieval Studio landing screen](public/readme/hero.jpg)

## The 20-Second Pitch

Most agent demos stop at "chat with a PDF." This repo shows the richer enterprise pattern:

1. A user asks one business question.
2. Azure AI Search plans retrieval through a Knowledge Base.
3. The Knowledge Base routes to the right Knowledge Sources.
4. Indexed Search, SharePoint, Fabric IQ ontology, Blob/PDF/JSON, or MCP Server tools return grounding data.
5. Azure OpenAI synthesizes an answer with citations and inspectable source data.

It is built to be shown live, forked locally, and reused as a practical reference app.

## Why Teams Use It

| What you get | Why it matters |
| --- | --- |
| **A real app, not just snippets** | The repo includes a polished Next.js demo suite with deployed routes and reusable UI. |
| **Multi-source Knowledge Source coverage** | Search Index, SharePoint, Fabric IQ ontology, MCP Server, Blob/PDF/JSON, and Semantic JOIN patterns are represented. |
| **Customer-demo-ready screens** | The live app shows citations, source data, guide pages, scenario pages, and retrieval workflows. |
| **Beginner setup scripts** | A standard-library Python helper creates, lists, retrieves, and deletes KS/KB resources with `--dry-run`. |
| **Smoke-tested workflow** | The live smoke test creates a temporary KS/KB, calls retrieve, and deletes both resources. |

## Demo Map

| Demo | Route | What to show |
| --- | --- | --- |
| Agentic Retrieval | [`/test`](https://foundry-iq-demo-suite.vercel.app/test) | KB retrieval, answer synthesis, references, and trace-style inspection. |
| Knowledge Management | [`/knowledge`](https://foundry-iq-demo-suite.vercel.app/knowledge) | Knowledge Bases and Knowledge Sources as manageable Azure AI Search resources. |
| SharePoint Connector | [`/sharepoint`](https://foundry-iq-demo-suite.vercel.app/sharepoint) | Enterprise content discovery, indexing, KS creation, and KB verification. |
| Semantic JOIN | [`/semantic-join`](https://foundry-iq-demo-suite.vercel.app/semantic-join) | Structured flight metrics joined with DOT policy PDFs in one grounded answer. |
| Fabric IQ Ontology KS | [`/fabric-iq-ks`](https://foundry-iq-demo-suite.vercel.app/fabric-iq-ks) | Ontology-aware reasoning over business entities instead of raw tables. |
| Guided Setup | [`/guides`](https://foundry-iq-demo-suite.vercel.app/guides) | Copyable steps for creating Knowledge Sources and Knowledge Bases. |

## Product Screens

| Semantic JOIN | Fabric IQ Ontology KS |
| --- | --- |
| <img src="public/readme/semantic-join.jpg" alt="Semantic JOIN demo screen" width="540"> | <img src="public/readme/fabric-iq-ks.jpg" alt="Fabric IQ Knowledge Source demo screen" width="540"> |

| Guided Setup | Landing Experience |
| --- | --- |
| <img src="public/readme/guides.jpg" alt="Guided setup screen" width="540"> | <img src="public/readme/hero.jpg" alt="Knowledge Retrieval Studio landing screen" width="540"> |

## Architecture

![Foundry IQ Demo Suite architecture](public/readme/architecture.svg)

At runtime, the app calls Azure AI Search Knowledge Base APIs. A Knowledge Base references one or more Knowledge Sources. Each source can represent indexed data, enterprise documents, live ontology calls, or remote MCP tools. Azure OpenAI handles answer synthesis over the retrieved references.

## Runtime Workflow

![Foundry IQ retrieval workflow](public/readme/workflow.svg)

The important idea is not only retrieval. It is **routing**. The retrieval layer decides which Knowledge Source should answer, then returns cited grounding data that the app can inspect.

## The Signature Scenario: Semantic JOIN

One customer-style question needs two kinds of evidence:

- **Structured data:** Fabric OneLake aggregated airline delay metrics.
- **Unstructured documents:** DOT regulation and policy PDFs.
- **One answer:** synthesized with citations from both sources.

That is the enterprise agent pattern this repo is designed to make obvious: curated operational data plus policy knowledge, joined at retrieval time.

## Knowledge Source Coverage

| Knowledge Source path | Included | Demo value |
| --- | --- | --- |
| `searchIndex` | Yes | Fastest path for existing Azure AI Search indexes. |
| Indexed SharePoint | Yes | Shows enterprise collaboration content as KB grounding. |
| Fabric IQ ontology | Yes | Live ontology queries through a Knowledge Source. |
| MCP Server | Yes | Remote HTTPS tools become retrieval-time grounding sources. |
| Blob / PDF / JSON | Yes | Baseline document and dataset grounding patterns. |
| Web URL | Pattern ready | Fits the same Knowledge Source model. |

## Guided Setup

The app includes guide pages that map directly to script commands:

- [`/guides/search-index`](https://foundry-iq-demo-suite.vercel.app/guides/search-index)
- [`/guides/sharepoint`](https://foundry-iq-demo-suite.vercel.app/guides/sharepoint)
- [`/guides/fabric-iq-ontology`](https://foundry-iq-demo-suite.vercel.app/guides/fabric-iq-ontology)
- [`/guides/mcp-server`](https://foundry-iq-demo-suite.vercel.app/guides/mcp-server)

The helper script intentionally uses only the Python standard library:

```bash
python scripts/foundry_iq_easy_setup.py check

python scripts/foundry_iq_easy_setup.py create-search-index-ks \
  --domain airline \
  --ks-name airline-policy-ks \
  --index-name airline-policy-index \
  --dry-run

python scripts/foundry_iq_easy_setup.py create-kb \
  --kb-name airline-ops-kb \
  --ks airline-policy-ks \
  --model gpt-4o
```

Supported commands include `check`, `list-ks`, `list-kb`, `create-search-index-ks`, `create-fabric-ontology-ks`, `create-mcp-ks`, `create-kb`, `retrieve`, `delete-ks`, and `delete-kb`.

## Quick Start

```bash
git clone https://github.com/hyeonsangjeon/foundry-iq-demo-suite.git
cd foundry-iq-demo-suite

cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

Minimum local environment:

```dotenv
AZURE_SEARCH_ENDPOINT=https://your-search.search.windows.net
AZURE_SEARCH_API_KEY=your-search-key
AZURE_SEARCH_API_VERSION=2025-11-01-preview
NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT=https://your-openai.cognitiveservices.azure.com
```

RBAC mode:

```dotenv
AZURE_SEARCH_USE_RBAC=true
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-service-principal-client-id
AZURE_CLIENT_SECRET=your-service-principal-secret
```

For full setup options, see [.env.example](.env.example).

## Validate Locally

```bash
npm run build
python3 -m unittest scripts/test_foundry_iq_easy_setup.py
python3 -m py_compile scripts/foundry_iq_easy_setup.py scripts/foundry_iq_live_smoke_test.py
```

Live smoke test:

```bash
python3 scripts/foundry_iq_live_smoke_test.py --auth-mode api-key
```

The smoke test creates a temporary Knowledge Source and Knowledge Base, calls retrieve, and deletes both resources in a `finally` cleanup block.

## Project Structure

```text
app/
  test/                    # Agentic retrieval playground
  knowledge/               # Knowledge Base management
  sharepoint/              # SharePoint indexing and KS flow
  semantic-join/           # Structured + unstructured multi-source demo
  fabric-iq-ks/            # Fabric IQ ontology Knowledge Source demo
  guides/                  # Beginner setup guides
  api/                     # Next.js API routes for Search, KB, SharePoint
components/
  guides/                  # Guide UI primitives
  ui/                      # Shared UI components
lib/                       # API clients, auth, i18n, utility logic
scripts/
  foundry_iq_easy_setup.py # KS/KB setup helper
  foundry_iq_live_smoke_test.py
public/readme/             # README screenshots and diagrams
```

## Tech Stack

- Next.js 14 App Router
- React 18 + TypeScript
- Tailwind CSS
- Azure AI Search Knowledge Bases and Knowledge Sources
- Azure OpenAI answer synthesis
- Vercel deployment
- Optional Azure Search RBAC via service principal

## Useful Microsoft Docs

- [Azure AI Search knowledge bases](https://learn.microsoft.com/rest/api/searchservice/knowledge-bases)
- [Create a Fabric Ontology knowledge source](https://learn.microsoft.com/azure/search/agentic-knowledge-source-how-to-fabric-ontology)
- [Create an MCP Server knowledge source](https://learn.microsoft.com/azure/search/agentic-knowledge-source-how-to-mcp-server)
- [What is Foundry IQ?](https://learn.microsoft.com/azure/foundry/agents/concepts/what-is-foundry-iq)
- [Foundry IQ FAQ](https://learn.microsoft.com/azure/foundry/agents/concepts/foundry-iq-faq)

## Lineage

Phase 1 builds on [farzad528/azure-ai-search-knowledge-retrieval-demo](https://github.com/farzad528/azure-ai-search-knowledge-retrieval-demo) under the MIT License.

## Author

**Hyeonsang Jeon** - Sr. Solution Engineer, Microsoft AI Global Black Belt

Built for technical demos, customer conversations, and hands-on exploration of Knowledge Sources and agentic retrieval.
