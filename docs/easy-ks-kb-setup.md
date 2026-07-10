# Easy Data, Knowledge Source, and Knowledge Base Setup

This guide is the shortest path from local data to a working Foundry IQ Knowledge Base.

Use it when you want to answer this sequence:

```text
local JSON/JSONL/CSV
  -> Azure AI Search index
  -> Knowledge Source
  -> Knowledge Base
  -> retrieve test
  -> optional cleanup
```

## What This Covers

This guide covers:

- Loading simple local data into an Azure AI Search index.
- Creating a Search Index Knowledge Source from that index.
- Creating a Knowledge Base that uses one or more Knowledge Sources.
- Running a retrieval test.
- Cleaning up temporary KS/KB resources.

This guide does not create Fabric backend data, Fabric workspaces, Fabric ontologies, or SharePoint app registrations. Those are upstream system setup tasks. This repo connects to those resources once they exist.

## 1. Configure `.env.local`

Copy the template and fill only local values:

```bash
cp .env.example .env.local
```

Minimum for API-key mode:

```dotenv
AZURE_SEARCH_ENDPOINT=https://your-search.search.windows.net
AZURE_SEARCH_API_KEY=your-search-admin-key
AZURE_SEARCH_API_VERSION=2025-11-01-preview
NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com
AZURE_OPENAI_API_KEY=your-openai-key
```

Check without printing secrets:

```bash
python scripts/foundry_iq_easy_setup.py check
```

## 2. Seed a Simple Search Index

The repo includes a tiny JSONL sample:

```bash
data/sample-knowledge-docs.jsonl
```

Preview the index and document payload first:

```bash
python scripts/foundry_iq_seed_index.py \
  --domain airline \
  --index-name airline-demo-index \
  --data-file data/sample-knowledge-docs.jsonl \
  --dry-run
```

Create or replace the index and upload the sample documents:

```bash
python scripts/foundry_iq_seed_index.py \
  --domain airline \
  --index-name airline-demo-index \
  --data-file data/sample-knowledge-docs.jsonl \
  --replace
```

Expected result:

```json
{
  "indexName": "airline-demo-index",
  "documentsUploaded": 4,
  "semanticConfiguration": "default"
}
```

### Bring Your Own Data

Use JSONL:

```jsonl
{"id":"policy-1","title":"Refund policy","content":"Refunds are available within 30 days.","category":"policy","source":"handbook"}
{"id":"ops-1","title":"Escalation process","content":"Escalate priority incidents within 15 minutes.","category":"operations","source":"runbook"}
```

Use CSV:

```csv
id,title,content,category,source
policy-1,Refund policy,Refunds are available within 30 days.,policy,handbook
ops-1,Escalation process,Escalate priority incidents within 15 minutes.,operations,runbook
```

If your field names differ, map them:

```bash
python scripts/foundry_iq_seed_index.py \
  --domain support \
  --index-name support-demo-index \
  --data-file ./my-data.csv \
  --key-field doc_id \
  --title-field heading \
  --content-field body \
  --category-field topic \
  --source-field source_system \
  --replace
```

The generated index has this simple shape:

| Field | Purpose |
| --- | --- |
| `id` | Search document key |
| `title` | Semantic title field |
| `content` | Main searchable text |
| `category` | Filterable/facetable grouping |
| `source` | Source label or system name |

## 3. Create a Knowledge Source

Attach the Search index as a Knowledge Source:

```bash
python scripts/foundry_iq_easy_setup.py create-search-index-ks \
  --domain airline \
  --ks-name airline-search-ks \
  --index-name airline-demo-index
```

Dry-run version:

```bash
python scripts/foundry_iq_easy_setup.py create-search-index-ks \
  --domain airline \
  --ks-name airline-search-ks \
  --index-name airline-demo-index \
  --dry-run
```

List Knowledge Sources:

```bash
python scripts/foundry_iq_easy_setup.py list-ks
```

## 4. Create a Knowledge Base

Create a KB with one Knowledge Source:

```bash
python scripts/foundry_iq_easy_setup.py create-kb \
  --kb-name airline-demo-kb \
  --ks airline-search-ks \
  --model gpt-4o
```

Attach multiple Knowledge Sources by repeating `--ks`:

```bash
python scripts/foundry_iq_easy_setup.py create-kb \
  --kb-name enterprise-demo-kb \
  --ks airline-search-ks \
  --ks sharepoint-policy-ks \
  --ks fabric-ontology-ks \
  --model gpt-4o \
  --reasoning-effort medium
```

List Knowledge Bases:

```bash
python scripts/foundry_iq_easy_setup.py list-kb
```

## 5. Run a Retrieval Test

```bash
python scripts/foundry_iq_easy_setup.py retrieve \
  --kb-name airline-demo-kb \
  --question "What should we do for an overnight controllable delay?" \
  --include-source-data
```

Use this result to check three things:

- Did the KB pick the expected Knowledge Source?
- Are citations or reference chunks relevant?
- Is the answer good enough before adding more sources?

## 6. Fabric IQ and MCP Knowledge Sources

Fabric IQ assumes your Fabric workspace and ontology already exist:

```bash
python scripts/foundry_iq_easy_setup.py create-fabric-ontology-ks \
  --domain airline \
  --ks-name airline-ontology-ks \
  --workspace-id "<fabric-workspace-guid>" \
  --ontology-id "<fabric-ontology-guid>"
```

MCP Server Knowledge Source:

```bash
python scripts/foundry_iq_easy_setup.py create-mcp-ks \
  --domain docs \
  --ks-name learn-docs-mcp-ks \
  --server-url "https://learn.microsoft.com/api/mcp" \
  --tool microsoft_docs_search
```

## 7. Cleanup

Delete KB first, then KS:

```bash
python scripts/foundry_iq_easy_setup.py delete-kb \
  --kb-name airline-demo-kb \
  --yes

python scripts/foundry_iq_easy_setup.py delete-ks \
  --ks-name airline-search-ks \
  --yes
```

The seed script does not delete Search indexes. If the index was temporary, delete it from Azure Portal, Azure CLI, or a REST client after you confirm nothing depends on it.

## 8. Live Smoke Test

Use this when you want one command to create a temporary KS/KB, retrieve, and clean up:

```bash
python scripts/foundry_iq_live_smoke_test.py --auth-mode api-key
```

The smoke test deletes the temporary Knowledge Base and Knowledge Source in a `finally` block.

## Recommended Workflow

Start narrow:

```text
one domain
one index
one Knowledge Source
one Knowledge Base
one retrieval question
```

Then add complexity:

```text
SharePoint content
Fabric IQ ontology
MCP Server tools
multi-source KB routing
```

This keeps the demo debuggable. If retrieval quality drops after adding a source, you know which source changed the behavior.
