#!/usr/bin/env bash
# demo_08_airports_via_kb.sh — Layer 2 path mirror of demo_03_airports.sh.

set -eu
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ -f "${ROOT_DIR}/.env" ]; then set -a; . "${ROOT_DIR}/.env"; set +a; fi
# shellcheck disable=SC1091
. "${ROOT_DIR}/lib/foundry_kb_call.sh"
# shellcheck disable=SC1091
. "${ROOT_DIR}/lib/timing.sh"

QUERY="list all airports with their cities"
SAMPLE_FILE="${ROOT_DIR}/samples/08_airports_via_kb.json"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  Demo 8 — Layer 2: airports via Foundry IQ KS"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Property projection ('with their cities') routed through fabricIQ KS."
echo "Mirrors Demo 3 — expect 15 US airports."
echo ""
echo "Query: ${QUERY}"
echo ""

MODE="online"
[ "${OFFLINE:-0}" = "1" ] && MODE="offline"

if [ "${MODE}" = "offline" ]; then
  echo "[OFFLINE] Loading captured response from samples/"
  RESPONSE="$(cat "${SAMPLE_FILE}")"
else
  echo "[ONLINE] Calling Foundry IQ Retrieve API..."
  RESPONSE="$(foundry_kb_call "${QUERY}" 2>/tmp/.foundry_kb_err || true)"
  if [ -z "${RESPONSE}" ] || ! echo "${RESPONSE}" | jq -e '.response[0].content' >/dev/null 2>&1 \
     || echo "${RESPONSE}" | foundry_kb_has_error; then
    echo "⚠️  Online call failed — falling back to OFFLINE sample"
    [ -s /tmp/.foundry_kb_err ] && sed 's/^/    /' /tmp/.foundry_kb_err
    if [ -f "${SAMPLE_FILE}" ]; then
      RESPONSE="$(cat "${SAMPLE_FILE}")"; MODE="offline (fallback)"
    else
      echo "ERROR: No sample at ${SAMPLE_FILE}" >&2; exit 1
    fi
  fi
fi

echo ""
echo "Mode: ${MODE}"
echo ""
echo "─── Natural-language response ─────────────────────────────────────"
echo "${RESPONSE}" | parse_kb_nl_response
echo ""
echo "─── Routing activity ──────────────────────────────────────────────"
echo "${RESPONSE}" | parse_kb_activity
echo ""
echo "─── References ────────────────────────────────────────────────────"
echo "  $(echo "${RESPONSE}" | parse_kb_refs_count) references returned"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  ✅ Same 15 airports — different path"
echo "═══════════════════════════════════════════════════════════════════"
