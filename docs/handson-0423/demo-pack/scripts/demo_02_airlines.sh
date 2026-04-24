#!/usr/bin/env bash
# demo_02_airlines.sh — simple single-entity query.

set -eu
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/../lib/mcp_call.sh"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/../lib/timing.sh"

echo "═══════════════════════════════════════════════════════════════════"
echo "  Demo 2 — Simple Query: 'list all airlines'"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "The smallest Fabric IQ interaction — a natural-language question,"
echo "no SQL, no schema lookup. The ontology figures out the table and"
echo "returns rows + a prose summary."
echo ""

RESPONSE=$(mcp_call_tool "search_ontology" \
  '{"naturalLanguageQuery":"list all airlines","naturalLanguageResponse":true}')

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
