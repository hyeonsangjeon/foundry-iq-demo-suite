#!/usr/bin/env bash
# demo_05_fleet.sh — 3-way JOIN: Aircraft × Manufacturer × Airline.
# The "Semantic JOIN" centerpiece.

set -eu
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/../lib/mcp_call.sh"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/../lib/timing.sh"

echo "═══════════════════════════════════════════════════════════════════"
echo "  Demo 5 — 3-way JOIN: aircraft × manufacturer × airline"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "The centerpiece. One natural-language question, three entity"
echo "relationships resolved: Aircraft has a manufacturer property and"
echo "belongs to an Airline (via airline_id). The ontology returns the"
echo "complete fleet with airline names populated."
echo ""

RESPONSE=$(mcp_call_tool "search_ontology" \
  '{"naturalLanguageQuery":"list aircraft with their manufacturers and which airlines own them","naturalLanguageResponse":true}')

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
echo "─── Natural-language summary (first 10 lines) ────────────────────"
echo "${RESPONSE}" | mcp_extract_nl | head -10
echo ""
echo "─── Raw table preview ────────────────────────────────────────────"
echo "${RESPONSE}" | mcp_render_table | head -30
