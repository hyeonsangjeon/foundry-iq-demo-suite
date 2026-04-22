#!/usr/bin/env bash
# demo_06_delayed.sh — operational Signal: current delayed flights.

set -eu
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/../lib/mcp_call.sh"

echo "═══════════════════════════════════════════════════════════════════"
echo "  Demo 6 — Operational Signal: delayed flights"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Filtered query — the ontology interprets 'currently delayed' as a"
echo "status filter and returns matching flights. This is the Signal half"
echo "of the Signal-to-Outcome story."
echo ""
echo "In Demo Suite the same Signal is paired with a Foundry IQ"
echo "searchIndex KS hit on DOT passenger-rights PDFs to produce a"
echo "combined answer: current operational status + compensation rules."
echo ""

RESPONSE=$(mcp_call_tool "search_ontology" \
  '{"naturalLanguageQuery":"which flights are currently delayed","naturalLanguageResponse":true}')

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
echo "─── Row count (delayed flights) ───────────────────────────────────"
echo "${RESPONSE}" | mcp_count_rows
echo ""
echo "─── Natural-language summary (first 15 lines) ────────────────────"
echo "${RESPONSE}" | mcp_extract_nl | head -15
echo ""
echo "─── Raw table preview ────────────────────────────────────────────"
echo "${RESPONSE}" | mcp_render_table | head -20
echo "  ... (preview only)"
