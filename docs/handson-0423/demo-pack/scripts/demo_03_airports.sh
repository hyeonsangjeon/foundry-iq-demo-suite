#!/usr/bin/env bash
# demo_03_airports.sh — property projection query.

set -eu
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/../lib/mcp_call.sh"

echo "═══════════════════════════════════════════════════════════════════"
echo "  Demo 3 — Property Projection: airports with cities"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Same entity but the request specifies which properties to return."
echo "The ontology projects down to (airport_id, airport_name, city)."
echo ""

RESPONSE=$(mcp_call_tool "search_ontology" \
  '{"naturalLanguageQuery":"list all airports with their cities","naturalLanguageResponse":true}')

if echo "${RESPONSE}" | jq -e '.error' >/dev/null 2>&1; then
  echo "─── ❌ MCP error ───────────────────────────────────────────────"
  echo "${RESPONSE}" | mcp_print_error
  echo ""
  echo "💡 Check the token (re-run: source ./setup.sh) and try again."
  exit 1
fi

echo "─── Fields returned ───────────────────────────────────────────────"
echo "${RESPONSE}" | mcp_show_fields
echo ""
echo "─── Row count ─────────────────────────────────────────────────────"
echo "${RESPONSE}" | mcp_count_rows
echo ""
echo "─── Natural-language summary ──────────────────────────────────────"
echo "${RESPONSE}" | mcp_extract_nl
echo ""
echo "─── Raw table preview ────────────────────────────────────────────"
echo "${RESPONSE}" | mcp_render_table | head -25
