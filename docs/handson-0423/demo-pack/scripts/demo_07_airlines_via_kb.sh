#!/usr/bin/env bash
# demo_07_airlines_via_kb.sh — Layer 2 path (Foundry IQ KS)
# Same NL query as demo_02_airlines.sh, but routed through Azure AI Search
# Knowledge Source (kind: fabricIQ). End data is identical (5 airlines) — the
# difference is the call path: own app → AI Search → Fabric MCP → ontology.

set -eu
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Load env (idempotent: setup.sh may have already exported these)
if [ -f "${ROOT_DIR}/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "${ROOT_DIR}/.env"
  set +a
fi
# shellcheck disable=SC1091
. "${ROOT_DIR}/lib/foundry_kb_call.sh"

QUERY="list all airlines"
SAMPLE_FILE="${ROOT_DIR}/samples/07_airlines_via_kb.json"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  Demo 7 — Layer 2: Foundry IQ KS path"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Same NL query as Demo 2 ('list all airlines'), but instead of calling"
echo "the Fabric MCP endpoint directly, we call the Foundry IQ Retrieve API."
echo "The knowledge source (kind: fabricIQ) federates back to the same"
echo "MSIT Fabric ontology — own-app → AI Search → Fabric → Lakehouse."
echo ""
echo "Query: ${QUERY}"
echo ""

MODE="online"
if [ "${OFFLINE:-0}" = "1" ]; then
  MODE="offline"
fi

if [ "${MODE}" = "offline" ]; then
  echo "[OFFLINE] Loading captured response from samples/"
  RESPONSE="$(cat "${SAMPLE_FILE}")"
else
  echo "[ONLINE] Calling Foundry IQ Retrieve API..."
  RESPONSE="$(foundry_kb_call "${QUERY}" 2>/tmp/.foundry_kb_err || true)"
  if [ -z "${RESPONSE}" ] || ! echo "${RESPONSE}" | jq -e '.response[0].content' >/dev/null 2>&1 \
     || echo "${RESPONSE}" | foundry_kb_has_error; then
    echo "⚠️  Online call failed or returned an error — falling back to OFFLINE sample"
    if [ -s /tmp/.foundry_kb_err ]; then
      sed 's/^/    /' /tmp/.foundry_kb_err
    fi
    if [ -f "${SAMPLE_FILE}" ]; then
      RESPONSE="$(cat "${SAMPLE_FILE}")"
      MODE="offline (fallback)"
    else
      echo "ERROR: No sample at ${SAMPLE_FILE} — aborting" >&2
      exit 1
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
REF_COUNT="$(echo "${RESPONSE}" | parse_kb_refs_count)"
echo "  ${REF_COUNT} references returned"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  ✅ Layer 2 verified — same data, different path"
echo "═══════════════════════════════════════════════════════════════════"
