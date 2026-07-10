# Foundry MCP Knowledge Source to Fabric MCP

> Discussion note for evaluating whether the new Azure AI Search / Foundry IQ MCP Server Knowledge Source can call an existing Fabric MCP endpoint.
>
> Status: feasibility proposal, not yet validated end-to-end in this repo.

## Short Answer

Yes. The proposed path should be possible if the Fabric MCP endpoint is reachable from Azure AI Search over HTTPS and behaves as an MCP-compliant server.

The target architecture is:

```text
Foundry Agent or Foundry IQ Knowledge Base
  -> Azure AI Search Knowledge Source: kind = mcpServer
    -> Fabric MCP endpoint
      -> Fabric ontology / semantic model / governed data
```

This is different from the current native Fabric IQ Knowledge Source path:

```text
Foundry IQ Knowledge Base
  -> Knowledge Source: kind = fabricIQ
    -> Fabric ontology
```

It is also different from the direct demo-pack path:

```text
Demo script / application
  -> Fabric MCP endpoint directly
```

## Why This Is Interesting

The existing demo-pack already proves that the Fabric MCP endpoint can be called directly with JSON-RPC:

- `tools/list`
- `tools/call`
- `Authorization: Bearer <Fabric token>`

The new MCP Server Knowledge Source path moves that MCP call behind Azure AI Search / Foundry IQ, so the Fabric MCP endpoint can participate as an official Knowledge Source in an agentic retrieval workflow.

That means the same Fabric-backed data could be demonstrated through three routes:

| Route | Path | Purpose |
|---|---|---|
| Direct Fabric MCP | App/script -> Fabric MCP | Fastest, lowest-level proof that the Fabric MCP server works |
| Native Fabric IQ KS | KB -> `kind: fabricIQ` -> Fabric ontology | Product-native Fabric IQ ontology grounding path |
| Generic MCP Server KS | KB -> `kind: mcpServer` -> Fabric MCP | New generic MCP Knowledge Source path for MCP-compliant systems |

## Expected Latency

Yes, the MCP Server Knowledge Source path will usually be slower than Direct Fabric MCP.

Direct Fabric MCP is a single application-to-Fabric MCP call:

```text
client -> Fabric MCP -> Fabric data
```

The MCP Server Knowledge Source path adds at least one orchestration layer:

```text
client -> Azure AI Search / Foundry IQ Retrieve
       -> MCP Server Knowledge Source planner/runtime
       -> Fabric MCP
       -> Fabric data
```

Additional latency can come from:

- Knowledge Base retrieval request processing.
- Agentic planning / reasoning over which Knowledge Source and tool to call.
- MCP tool output parsing and reranking.
- Query-time header passthrough and token validation.
- Optional Foundry Agent orchestration if called through an agent.

For a demo, the tradeoff is acceptable because the value is not raw speed. The value is that Fabric MCP becomes a first-class Knowledge Source in a multi-source Foundry IQ / Azure AI Search grounding pipeline.

## Feasibility Conditions

### 1. Fabric MCP must be reachable from Azure AI Search

The MCP server URL must be an HTTPS endpoint that Azure AI Search can call. A local-only endpoint, private network endpoint, or endpoint blocked by tenant/network policy will not work unless networking is configured accordingly.

### 2. Fabric MCP must be MCP-compatible

The server must expose MCP tools in the shape expected by the MCP Server Knowledge Source feature. The current demo-pack is a good sign because it already calls:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/list"
}
```

and:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "search_ontology",
    "arguments": {}
  }
}
```

### 3. Tool names must be explicitly allowed

The MCP Server Knowledge Source does not automatically expose every MCP tool. The Knowledge Source definition must list the allowed tools.

For the Fabric ontology demo-pack, the initial tool list would likely be:

```text
list_ontology_entity_types
search_ontology
```

### 4. Fabric authentication must be passed through

The existing direct MCP path uses:

```http
Authorization: Bearer <Fabric token>
```

For the generic MCP Server Knowledge Source path, the practical first attempt is query-time header passthrough:

```http
fabric-mcp-ks-header-name: Authorization
fabric-mcp-ks-header-value: Bearer <Fabric access token>
```

This keeps the Fabric token out of the Knowledge Source definition and allows each request to carry the right user or service token.

## Example Knowledge Source Shape

Illustrative REST shape:

```http
PUT https://<search-service>.search.windows.net/knowledgesources/fabric-mcp-ks?api-version=2026-05-01-preview
api-key: <search-admin-key>
Content-Type: application/json
Prefer: return=representation
```

```json
{
  "name": "fabric-mcp-ks",
  "kind": "mcpServer",
  "description": "Generic MCP Server Knowledge Source pointing to the Fabric MCP endpoint.",
  "mcpServerParameters": {
    "serverURL": "https://<fabric-mcp-endpoint>",
    "tools": [
      {
        "name": "list_ontology_entity_types",
        "outputParsing": {
          "kind": "auto"
        },
        "inclusionMode": "reranked",
        "maxOutputTokens": 1000
      },
      {
        "name": "search_ontology",
        "outputParsing": {
          "kind": "auto"
        },
        "inclusionMode": "reranked",
        "maxOutputTokens": 4000
      }
    ]
  }
}
```

## Example Retrieve Call

Illustrative request:

```http
POST https://<search-service>.search.windows.net/knowledgebases/<kb-name>/retrieve?api-version=2026-05-01-preview
api-key: <search-query-or-admin-key>
Content-Type: application/json
fabric-mcp-ks-header-name: Authorization
fabric-mcp-ks-header-value: Bearer <fabric-access-token>
```

```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "List all airlines from our airline ontology."
        }
      ]
    }
  ],
  "knowledgeSourceParams": [
    {
      "knowledgeSourceName": "fabric-mcp-ks",
      "kind": "mcpServer"
    }
  ],
  "includeActivity": true
}
```

## Validation Plan

1. Confirm direct Fabric MCP still works.
   - Run `tools/list`.
   - Run `search_ontology` with a known query.

2. Create a generic `mcpServer` Knowledge Source that points to the same Fabric MCP URL.

3. Add the new `mcpServer` Knowledge Source to a test Knowledge Base.

4. Call `/retrieve` with query-time Fabric authorization headers.

5. Compare outputs across three paths:
   - Direct Fabric MCP.
   - Native `fabricIQ` KS.
   - Generic `mcpServer` KS to Fabric MCP.

6. Capture latency and response quality:
   - End-to-end elapsed time.
   - Whether activity traces show the MCP KS and expected tool.
   - Whether output parsing preserves tables, fields, and references well enough.

## Main Risks

| Risk | Why It Matters | Mitigation |
|---|---|---|
| Fabric MCP endpoint not reachable from Azure AI Search | KS runtime cannot call it | Use public HTTPS endpoint or approved network path |
| Fabric token passthrough rejected | Fabric MCP requires a specific auth context | Test query-time `Authorization` passthrough first |
| MCP transport mismatch | Direct JSON-RPC success may not guarantee KS runtime compatibility | Validate with `tools/list` through KS path |
| Output parsing is weak | Fabric results may not become good rerankable passages | Start with `auto`, then try JSON-specific parsing |
| Slower than direct MCP | Extra orchestration hop is expected | Position as governance/multi-source integration path, not fastest path |

## Recommended Demo Message

The clean story is not "MCP Server KS replaces Fabric IQ KS."

The cleaner message is:

> Fabric can be grounded in Foundry IQ through both a native Fabric IQ Knowledge Source and a generic MCP Server Knowledge Source. The native `fabricIQ` path is product-specialized. The generic `mcpServer` path proves that any MCP-compliant enterprise data surface, including Fabric MCP, can become an agentic Knowledge Source.

## References

- Microsoft Learn: [Create an MCP Server knowledge source](https://learn.microsoft.com/azure/search/agentic-knowledge-source-how-to-mcp-server)
- Local direct MCP helper: `docs/handson-0423/demo-pack/lib/mcp_call.sh`
- Local native Fabric IQ KS helper: `docs/handson-0423/demo-pack/lib/foundry_kb_call.sh`
