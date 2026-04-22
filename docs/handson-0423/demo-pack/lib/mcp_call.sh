#!/usr/bin/env bash
# lib/mcp_call.sh — JSON-RPC helper for the Fabric IQ Ontology MCP endpoint.
#
# Usage (sourced):
#   source ./lib/mcp_call.sh
#   mcp_call_tool "search_ontology" '{"naturalLanguageQuery":"list all airlines"}'
#   mcp_extract_nl < response.json

set -eu

_mcp_require_env() {
  if [ -z "${FABRIC_TOKEN:-}" ] || [ -z "${MCP_URL:-}" ]; then
    echo "❌ FABRIC_TOKEN or MCP_URL not set. Run: source ./setup.sh" >&2
    return 1
  fi
}

# ---- list MCP tools ------------------------------------------------------
mcp_list_tools() {
  _mcp_require_env || return 1
  curl -s -X POST "${MCP_URL}" \
    -H "Authorization: Bearer ${FABRIC_TOKEN}" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
}

# ---- call a named MCP tool -----------------------------------------------
mcp_call_tool() {
  _mcp_require_env || return 1
  local tool_name="${1:?tool name required}"
  # Note: do NOT use ${2:-{}} — bash parses the default as `{` and leaves a
  # stray literal `}` appended to the value, corrupting the JSON payload and
  # triggering MCP -32603 errors. Use a separate guard instead.
  local arguments="${2-}"
  [ -z "${arguments}" ] && arguments="{}"
  local request_id="${3:-$RANDOM}"

  local payload
  payload=$(cat <<JSON
{
  "jsonrpc": "2.0",
  "id": ${request_id},
  "method": "tools/call",
  "params": { "name": "${tool_name}", "arguments": ${arguments} }
}
JSON
)

  curl -s -X POST "${MCP_URL}" \
    -H "Authorization: Bearer ${FABRIC_TOKEN}" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d "${payload}"
}

# ---- extract NL response (schema-independent) ----------------------------
mcp_extract_nl() {
  jq -r '
    .result.structuredContent.naturalLanguageResponse
    // ((.result.content[0].text // "{}") | fromjson? | .naturalLanguageResponse)
    // "(no NL response in this payload)"
  '
}

# ---- show field names ----------------------------------------------------
mcp_show_fields() {
  jq -r '
    (.result.structuredContent.raw.Fields
     // ((.result.content[0].text // "{}") | fromjson? | .raw.Fields)
     // ["(no fields)"])
    | join(", ")
  '
}

# ---- count rows ----------------------------------------------------------
mcp_count_rows() {
  jq -r '
    (.result.structuredContent.raw.Value
     // ((.result.content[0].text // "{}") | fromjson? | .raw.Value)
     // [])
    | length
  '
}

# ---- render raw table (best-effort, schema-tolerant) --------------------
mcp_render_table() {
  local raw
  raw=$(jq -c '
    .result.structuredContent.raw
    // ((.result.content[0].text // "{}") | fromjson? | .raw)
    // empty
  ')

  if [ -z "${raw}" ] || [ "${raw}" = "null" ]; then
    echo "(no table — server returned only NL response)"
    return 0
  fi

  echo "${raw}" | jq -r '
    . as $r
    | if ($r.Value | length) == 0 then
        "(empty result set)"
      else
        ($r.Fields | @tsv),
        ($r.Value[] | map(
          if type == "string" then
            if (length > 60) then (.[0:57] + "...") else . end
          else
            tostring
          end
        ) | @tsv)
      end
  ' | column -t -s $'\t' 2>/dev/null || echo "${raw}" | jq .
}

# ---- print error if any --------------------------------------------------
mcp_print_error() {
  jq -r '
    .error |
    if . then
      "❌ MCP error code=\(.code) message=\(.message)" +
      (if .data.requestId then " requestId=\(.data.requestId)" else "" end)
    else
      empty
    end
  '
}
