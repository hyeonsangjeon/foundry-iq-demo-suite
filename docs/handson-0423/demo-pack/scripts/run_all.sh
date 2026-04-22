#!/usr/bin/env bash
# run_all.sh — execute every demo script in sequence, pausing between each.
# Useful for dry-running the whole hands-on before the live session.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

clear
echo "═══════════════════════════════════════════════════════════════════"
echo "  Fabric IQ Ontology — Demo Pack"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

pause() {
  echo ""
  echo "─── press Enter for next demo, Ctrl+C to stop ────────────────────"
  read -r _
  clear
}

scripts=(
  "${SCRIPT_DIR}/demo_01_entities.sh"
  "${SCRIPT_DIR}/demo_02_airlines.sh"
  "${SCRIPT_DIR}/demo_03_airports.sh"
  "${SCRIPT_DIR}/demo_04_flights.sh"
  "${SCRIPT_DIR}/demo_05_fleet.sh"
  "${SCRIPT_DIR}/demo_06_delayed.sh"
  # ─── Layer 2 path (Foundry IQ KS) ───
  "${SCRIPT_DIR}/demo_07_airlines_via_kb.sh"
  "${SCRIPT_DIR}/demo_08_airports_via_kb.sh"
  "${SCRIPT_DIR}/demo_09_flights_via_kb.sh"
  "${SCRIPT_DIR}/demo_10_fleet_via_kb.sh"
  "${SCRIPT_DIR}/demo_11_delayed_via_kb.sh"
  # ─── Killer demo: Semantic JOIN (fabricIQ + searchIndex) ───
  "${SCRIPT_DIR}/demo_12_semantic_join.sh"
)

for script in "${scripts[@]}"; do
  # Run first, then capture rc — `if ! cmd; then $?` reports `!`'s status (0/1),
  # not the script's real exit code, which masks real failures as exit 0.
  "${script}"
  rc=$?
  if [ "${rc}" -ne 0 ]; then
    echo ""
    echo "⚠️  ${script##*/} failed (exit ${rc}). Continuing to next demo."
  fi
  pause
done

echo "✅ Demo run complete."
