#!/usr/bin/env bash
# foundry_kb_call.sh — Layer 2 path helpers.
#
# Calls Foundry IQ Retrieve API (Azure AI Search side) with a Knowledge Source
# of kind=fabricIQ. The KS internally federates back to the same MSIT Fabric
# ontology that Layer 1 (lib/mcp_call.sh) hits directly.
#
# Usage:
#   source lib/foundry_kb_call.sh
#   foundry_kb_call "list all airlines"
#   foundry_kb_call "list all airlines" "airline-ontology-ks"
#
# Required env vars (load via setup.sh / .env):
#   AZURE_SEARCH_ENDPOINT       e.g. https://srch-foundry-iq-demo-ext.search.windows.net
#   AZURE_SEARCH_API_KEY        AI Search admin key
#   AZURE_SEARCH_API_VERSION    e.g. 2025-11-01-preview
#   KB_NAME                  e.g. unified-airline-fabriciq-kb
#   DEFAULT_KS_NAME          e.g. airline-ontology-ks
#   MSIT_TENANT_ID           e.g. 72f988bf-86f1-41af-91ab-2d7cd011db47

# Note: do NOT use `set -eu` here — sourced into demo scripts that already set it.

# ─── Internal: env validation ────────────────────────────────────
_foundry_require_env() {
  local missing=""
  for v in AZURE_SEARCH_ENDPOINT AZURE_SEARCH_API_KEY AZURE_SEARCH_API_VERSION KB_NAME MSIT_TENANT_ID; do
    if [ -z "$(eval "echo \${$v:-}")" ] || [ "$(eval "echo \${$v:-}")" = "{YOUR_AZURE_SEARCH_ADMIN_KEY}" ]; then
      missing="${missing} $v"
    fi
  done
  if [ -n "$missing" ]; then
    echo "ERROR: Missing or placeholder env vars for Layer 2:${missing}" >&2
    echo "       Update .env (see .env.example Layer 2 section)." >&2
    return 1
  fi
  return 0
}

# ─── Issue MSIT OBO token (search scope) ───────────────────────────────────
issue_msit_search_token() {
  az account get-access-token \
    --tenant "${MSIT_TENANT_ID}" \
    --scope https://search.azure.com/.default \
    --query accessToken -o tsv 2>/dev/null
}

# ─── Foundry IQ Retrieve API call ──────────────────────────────────────────
# arg1: NL query (required)
# arg2: KS name (optional, defaults to $DEFAULT_KS_NAME or "airline-ontology-ks")
foundry_kb_call() {
  local query="${1:?NL query required}"
  # Note: do NOT use ${2:-default} — bash parses default up to first `}` and
  # appends a stray literal `}` when default contains braces. Use guard instead.
  local ks_name="${2-}"
  [ -z "${ks_name}" ] && ks_name="${DEFAULT_KS_NAME:-airline-ontology-ks}"

  _foundry_require_env || return 1

  local search_token
  search_token="$(issue_msit_search_token)"
  if [ -z "${search_token}" ]; then
    echo "ERROR: Failed to issue MSIT OBO search token." >&2
    echo "       Try: az login --tenant ${MSIT_TENANT_ID}" >&2
    return 1
  fi

  # Compact JSON payload (avoid multi-line heredoc — same -32603 lesson as Layer 1).
  local payload
  payload=$(jq -n \
    --arg q "$query" \
    --arg ks "$ks_name" \
    '{
      messages: [{role: "user", content: [{type: "text", text: $q}]}],
      knowledgeSourceParams: [{
        knowledgeSourceName: $ks,
        kind: "fabricIQ",
        includeReferences: true,
        includeReferenceSourceData: true
      }],
      includeActivity: true
    }' | jq -c '.')

  curl -sS -X POST \
    "${AZURE_SEARCH_ENDPOINT}/knowledgebases/${KB_NAME}/retrieve?api-version=${AZURE_SEARCH_API_VERSION}" \
    -H "api-key: ${AZURE_SEARCH_API_KEY}" \
    -H "Content-Type: application/json" \
    -H "x-ms-query-source-authorization: ${search_token}" \
    -d "${payload}"
}

# ─── Foundry IQ Retrieve API call — multi-KS variant ───────────────────────
# Accepts a caller-supplied knowledgeSourceParams JSON array, enabling
# cross-source (semantic JOIN) queries. fabricIQ KS still requires the
# MSIT OBO header, so we always issue it.
#
# arg1: NL query
# arg2: JSON array string for knowledgeSourceParams
#       e.g. '[{"knowledgeSourceName":"ks-a","kind":"fabricIQ",...},
#              {"knowledgeSourceName":"ks-b","kind":"searchIndex",...}]'
foundry_kb_call_multi() {
  local query="${1:?NL query required}"
  local ks_params_json="${2:?knowledgeSourceParams JSON array required}"

  _foundry_require_env || return 1

  local search_token
  search_token="$(issue_msit_search_token)"
  if [ -z "${search_token}" ]; then
    echo "ERROR: Failed to issue MSIT OBO search token." >&2
    echo "       Try: az login --tenant ${MSIT_TENANT_ID}" >&2
    return 1
  fi

  local payload
  payload=$(jq -n \
    --arg q "$query" \
    --argjson ks "$ks_params_json" \
    '{
      messages: [{role: "user", content: [{type: "text", text: $q}]}],
      knowledgeSourceParams: $ks,
      includeActivity: true
    }' | jq -c '.')

  curl -sS -X POST \
    "${AZURE_SEARCH_ENDPOINT}/knowledgebases/${KB_NAME}/retrieve?api-version=${AZURE_SEARCH_API_VERSION}" \
    -H "api-key: ${AZURE_SEARCH_API_KEY}" \
    -H "Content-Type: application/json" \
    -H "x-ms-query-source-authorization: ${search_token}" \
    -d "${payload}"
}

# ─── Response helpers ──────────────────────────────────────────────────────
parse_kb_nl_response() {
  jq -r '
    (.response[0].content[]? | select(.type=="text") | .text) //
    "(no NL response — see raw JSON)"
  '
}

parse_kb_activity() {
  jq -r '
    (.activity[]? |
      "  - " + (.type // "?") +
      (if .knowledgeSourceName then ": " + .knowledgeSourceName else "" end) +
      (if .elapsedMs then "  [" + (.elapsedMs|tostring) + "ms]" else "" end)
    ) // "  (no activity trace)"
  '
}

parse_kb_refs_count() {
  jq -r '(.references // []) | length'
}

# Detect a KS-side error wrapped inside Retrieve response (HTTP 200 OK with errors[]).
# Note: the previous form `(.error // empty) != null or ...` is broken because
# `// empty` emits NO value when .error is absent, which collapses the whole
# `or` expression to no output, so jq -e returns false and real errors slip
# through. Use a null-safe grouped form instead.
foundry_kb_has_error() {
  jq -e '
    ((.error // null) != null)
    or (((.references // []) | map(select(.type == "error")) | length) > 0)
  ' >/dev/null 2>&1
}
