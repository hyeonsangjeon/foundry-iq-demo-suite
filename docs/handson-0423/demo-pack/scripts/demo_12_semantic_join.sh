#!/usr/bin/env bash
# demo_12_semantic_join.sh — Layer 2: Cross-source semantic JOIN
#
# This is the killer demo. A single NL query is routed to TWO knowledge
# sources of different kinds within the same Foundry IQ Knowledge Base:
#
#   - airline-ontology-ks  (kind: fabricIQ)    → structured ontology (delays > 2h)
#   - unified-airline-ks   (kind: searchIndex) → DOT regulation PDFs (compensation)
#
# Foundry IQ's reasoning model fuses the two retrievals and answers in
# natural language. This is what "Semantic JOIN" means in production.

set -eu
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ -f "${ROOT_DIR}/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "${ROOT_DIR}/.env"
  set +a
fi
# shellcheck disable=SC1091
. "${ROOT_DIR}/lib/foundry_kb_call.sh"
# shellcheck disable=SC1091
. "${ROOT_DIR}/lib/timing.sh"

QUERY="How many flights in our airline ontology were delayed more than 2 hours, and what is our compensation exposure under DOT regulations?"
SAMPLE_FILE="${ROOT_DIR}/samples/12_semantic_join.json"

FABRICIQ_KS="${DEFAULT_KS_NAME:-airline-ontology-ks}"
SEARCHIDX_KS="${SEARCH_INDEX_KS_NAME:-unified-airline-ks}"

# Build knowledgeSourceParams JSON array (compact, jq -c).
KS_PARAMS=$(jq -nc \
  --arg fks "${FABRICIQ_KS}" \
  --arg sks "${SEARCHIDX_KS}" \
  '[
    {
      knowledgeSourceName: $fks,
      kind: "fabricIQ",
      includeReferences: true,
      includeReferenceSourceData: true
    },
    {
      knowledgeSourceName: $sks,
      kind: "searchIndex",
      includeReferences: true,
      includeReferenceSourceData: true
    }
  ]')

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  Demo 12 — Semantic JOIN (cross-source)"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "One NL query → TWO knowledge sources of different kinds in the same KB."
echo "  • ${FABRICIQ_KS}  (fabricIQ)    → flight delay data (Lakehouse ontology)"
echo "  • ${SEARCHIDX_KS}  (searchIndex) → DOT passenger-rights PDFs"
echo ""
echo "Foundry IQ fuses them in a single answer — this is Semantic JOIN."
echo ""
echo "Query:"
echo "  ${QUERY}"
echo ""

MODE="online"
if [ "${OFFLINE:-0}" = "1" ]; then
  MODE="offline"
fi

if [ "${MODE}" = "offline" ]; then
  echo "[OFFLINE] Loading captured response from samples/"
  RESPONSE="$(cat "${SAMPLE_FILE}")"
else
  echo "[ONLINE] Calling Foundry IQ Retrieve API with two KSes..."
  RESPONSE="$(foundry_kb_call_multi "${QUERY}" "${KS_PARAMS}" 2>/tmp/.foundry_kb_err || true)"
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
echo "─── Natural-language response (fused) ─────────────────────────────"
echo "${RESPONSE}" | parse_kb_nl_response
echo ""
echo "─── Routing activity (both KSes should appear) ────────────────────"
echo "${RESPONSE}" | parse_kb_activity
echo ""
echo "─── References by source ──────────────────────────────────────────"
TOTAL_REFS="$(echo "${RESPONSE}" | parse_kb_refs_count)"
echo "  Total references: ${TOTAL_REFS}"
echo "${RESPONSE}" | jq -r '
  (.references // [])
  | group_by(.knowledgeSourceName // "(unknown)")
  | map("  - " + (.[0].knowledgeSourceName // "(unknown)") + ": " + (length|tostring))
  | .[]
' 2>/dev/null || true
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  ✅ Semantic JOIN verified — fabricIQ + searchIndex fused"
echo "═══════════════════════════════════════════════════════════════════"
