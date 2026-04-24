#!/usr/bin/env bash
# run_all.sh — execute every demo script in sequence, pausing between each.
# Useful for dry-running the whole hands-on before the live session.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Disable per-script EXIT-trap timing (we track timing here instead).
export TIMING_DISABLE=1

now() {
  if [ -n "${EPOCHREALTIME:-}" ]; then
    printf '%s\n' "${EPOCHREALTIME//,/.}"
  elif command -v python3 >/dev/null 2>&1; then
    python3 -c 'import time; print(f"{time.time():.6f}")'
  else
    date +%s
  fi
}

fmt_secs() {
  awk -v s="$1" 'BEGIN {
    if (s >= 60) { m = int(s/60); printf "%dm %.2fs", m, s - m*60 }
    else { printf "%.2fs", s }
  }'
}

declare -a TIMINGS=()

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

RUN_START=$(now)
for script in "${scripts[@]}"; do
  # Run first, then capture rc — `if ! cmd; then $?` reports `!`'s status (0/1),
  # not the script's real exit code, which masks real failures as exit 0.
  script_start=$(now)
  "${script}"
  rc=$?
  script_end=$(now)
  elapsed=$(awk -v s="${script_start}" -v e="${script_end}" 'BEGIN { printf "%.3f", e - s }')
  pretty=$(fmt_secs "${elapsed}")
  TIMINGS+=("${script##*/}|${elapsed}|${pretty}|${rc}")

  echo ""
  echo "⏱  ${script##*/} finished in ${pretty} (exit ${rc})"

  if [ "${rc}" -ne 0 ]; then
    echo "⚠️  ${script##*/} failed (exit ${rc}). Continuing to next demo."
  fi
  pause
done
RUN_END=$(now)
TOTAL=$(awk -v s="${RUN_START}" -v e="${RUN_END}" 'BEGIN { printf "%.3f", e - s }')
TOTAL_PRETTY=$(fmt_secs "${TOTAL}")

echo "═══════════════════════════════════════════════════════════════════"
echo "  Per-script timing summary"
echo "═══════════════════════════════════════════════════════════════════"
printf "  %-38s %12s   %s\n" "script" "elapsed" "exit"
printf "  %-38s %12s   %s\n" "--------------------------------------" "------------" "----"
for row in "${TIMINGS[@]}"; do
  IFS='|' read -r name secs pretty rc <<<"${row}"
  printf "  %-38s %12s   %s\n" "${name}" "${pretty}" "${rc}"
done
echo ""
echo "⏱  Total wall-clock (excluding pauses cannot be separated): ${TOTAL_PRETTY} (${TOTAL}s)"
echo ""
echo "✅ Demo run complete."
