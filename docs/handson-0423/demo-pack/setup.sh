#!/usr/bin/env bash
# setup.sh — load configuration and acquire a Fabric API bearer token.
#
# Usage:
#   source ./setup.sh        # exports FABRIC_TOKEN, MCP_URL, etc.
#   ./scripts/demo_02_airlines.sh  # any demo script now works
#
# This script is idempotent. Re-run whenever the token expires (~1 hour).

set -eu

# ---- Locate .env ---------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"

if [ ! -f "${ENV_FILE}" ]; then
  echo "❌ .env not found at ${ENV_FILE}" >&2
  echo "   Copy .env.example to .env and adjust if needed:" >&2
  echo "   cp .env.example .env" >&2
  return 1 2>/dev/null || exit 1
fi

# shellcheck disable=SC1090
source "${ENV_FILE}"
export TENANT_ID WORKSPACE_ID ONTOLOGY_ID MCP_HOST MCP_URL

# ---- Verify az context ---------------------------------------------------
CURRENT_TENANT="$(az account show --query tenantId -o tsv 2>/dev/null || true)"

if [ -z "${CURRENT_TENANT}" ] || [ "${CURRENT_TENANT}" != "${TENANT_ID}" ]; then
  echo "🔐 Signing into tenant ${TENANT_ID} ..."
  az login --tenant "${TENANT_ID}" --only-show-errors >/dev/null
fi

ACCOUNT="$(az account show --query user.name -o tsv)"
echo "✅ Signed in as ${ACCOUNT} (tenant: ${TENANT_ID})"

# ---- Acquire Fabric token ------------------------------------------------
FABRIC_TOKEN="$(az account get-access-token \
  --scope https://api.fabric.microsoft.com/.default \
  --query accessToken -o tsv)"

if [ -z "${FABRIC_TOKEN}" ]; then
  echo "❌ Failed to obtain Fabric API token" >&2
  return 1 2>/dev/null || exit 1
fi

export FABRIC_TOKEN
echo "✅ Fabric token acquired (length: ${#FABRIC_TOKEN}, prefix: ${FABRIC_TOKEN:0:20}...)"
echo "✅ MCP endpoint: ${MCP_URL}"

# ---- Layer 2 path readiness check ---------------------------------------
echo ""
echo "[Layer 2 / Foundry IQ KS path]"
if [ -z "${AZURE_SEARCH_API_KEY:-}" ] || [ "${AZURE_SEARCH_API_KEY:-}" = "{YOUR_AZURE_SEARCH_ADMIN_KEY}" ]; then
  echo "  ⚠️  AZURE_SEARCH_API_KEY not configured — demo_07_*~demo_11_* will use OFFLINE samples"
  echo "      To enable online: edit .env (Layer 2 section)"
else
  if [ "${CURRENT_TENANT}" != "${MSIT_TENANT_ID:-}" ]; then
    echo "  ⚠️  Current az tenant (${CURRENT_TENANT}) ≠ MSIT_TENANT_ID — Layer 2 OBO will fail"
    echo "      Run: az login --tenant ${MSIT_TENANT_ID:-72f988bf-...}"
  else
    echo "  ✅ Layer 2 ready (AI Search key set + MSIT tenant active)"
  fi
fi
export AZURE_SEARCH_ENDPOINT AZURE_SEARCH_API_KEY AZURE_SEARCH_API_VERSION KB_NAME DEFAULT_KS_NAME SEARCH_INDEX_KS_NAME MSIT_TENANT_ID

echo ""
echo "Ready. Try:"
echo "  ./scripts/demo_01_entities.sh         (Layer 1 — MCP direct)"
echo "  ./scripts/demo_07_airlines_via_kb.sh  (Layer 2 — Foundry IQ KS)"
