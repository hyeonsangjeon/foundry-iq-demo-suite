#!/usr/bin/env bash
# demo_01_entities.sh — inspect the ontology schema (list_ontology_entity_types).
# Shows the full data model: 13 entities, properties, timeseries, source mappings.

set -eu
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/../lib/mcp_call.sh"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/../lib/timing.sh"

echo "═══════════════════════════════════════════════════════════════════"
echo "  Demo 1 — Ontology Schema Inspection"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Tool: list_ontology_entity_types"
echo "What this shows: every entity type in the ontology, with its"
echo "properties, timeseries signals, and the Fabric Lakehouse/Kusto"
echo "tables each property is mapped to."
echo ""

RESPONSE=$(mcp_call_tool "list_ontology_entity_types" '{"includeProperties":true}')

if echo "${RESPONSE}" | jq -e '.error' >/dev/null 2>&1; then
  echo "─── ❌ MCP error ───────────────────────────────────────────────"
  echo "${RESPONSE}" | mcp_print_error
  echo ""
  echo "💡 The MCP server returned an error for this call."
  echo "   Check the token (re-run: source ./setup.sh) and try again."
  exit 1
fi

# Locate the entity-list array regardless of response shape:
#   - .result.structuredContent.values   (recent shape)
#   - .result.structuredContent          (sometimes the array is here directly)
#   - .result.content[0].text -> JSON .values  (text-wrapped fallback)
ENTITIES=$(echo "${RESPONSE}" | jq -c '
  (
    (.result.structuredContent.values // empty)
    // (if (.result.structuredContent | type) == "array" then .result.structuredContent else empty end)
    // ((.result.content[0].text // "{}") | fromjson? | .values // empty)
    // []
  )
')

echo "─── Entity types in this ontology ────────────────────────────────"
echo "${ENTITIES}" | jq -r '
  if (type == "array") and (length > 0) then
    .[] | "  \(.name)  —  \((.properties // []) | length) props, \((.timeseriesProperties // []) | length) ts"
  else
    "  (unexpected response shape — no entities found)"
  end
'

echo ""
echo "─── Total entity count ───────────────────────────────────────────"
echo "${ENTITIES}" | jq -r 'if type == "array" then length else 0 end'

echo ""
echo "💡 Each of these entities is a real Fabric table (Lakehouse or Kusto)"
echo "   automatically exposed to natural-language queries via Fabric IQ."
