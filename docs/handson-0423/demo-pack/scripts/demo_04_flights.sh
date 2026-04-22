#!/usr/bin/env bash
# demo_04_flights.sh — 2-way JOIN across Flight and Airline entities.

set -eu
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/../lib/mcp_call.sh"

echo "═══════════════════════════════════════════════════════════════════"
echo "  Demo 4 — 2-way JOIN: flights × airlines"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Flight data and Airline data live in separate Fabric tables. The"
echo "ontology resolves the airline_id → airline_name relationship"
echo "automatically — no JOIN syntax in the request."
echo ""

RESPONSE=$(mcp_call_tool "search_ontology" \
  '{"naturalLanguageQuery":"show me 10 flights with their flight numbers and airlines","naturalLanguageResponse":true}')

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
echo ""
echo "💡 Note any 'airline_name' column — that's the JOIN resolving."
echo "   Same query in SQL would require explicit JOIN airlines ON flights.al_id."
