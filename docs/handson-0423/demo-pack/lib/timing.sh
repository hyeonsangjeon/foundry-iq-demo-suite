#!/usr/bin/env bash
# lib/timing.sh — track and report wall-clock execution time.
#
# When sourced, this library:
#   1. Records the start timestamp.
#   2. Registers an EXIT trap that prints the elapsed time.
#
# Usage (sourced once, near the top of a script):
#   source "${SCRIPT_DIR}/../lib/timing.sh"
#
# Disable by exporting TIMING_DISABLE=1 before running the script.

if [ "${TIMING_DISABLE:-0}" = "1" ]; then
  return 0 2>/dev/null || true
fi

# Return current wall-clock time in seconds (with sub-second precision when available).
_timing_now() {
  if [ -n "${EPOCHREALTIME:-}" ]; then
    # bash >= 5: e.g. "1714000000.123456" (locale may use comma)
    printf '%s\n' "${EPOCHREALTIME//,/.}"
  elif command -v python3 >/dev/null 2>&1; then
    python3 -c 'import time; print(f"{time.time():.6f}")'
  else
    # Whole-second fallback (POSIX date)
    date +%s
  fi
}

# Format seconds as "Xm Ys" when >= 60s, otherwise "Y.YYs".
_timing_format() {
  awk -v s="$1" 'BEGIN {
    if (s >= 60) {
      m = int(s / 60); r = s - m * 60
      printf "%dm %.2fs", m, r
    } else {
      printf "%.2fs", s
    }
  }'
}

_timing_print() {
  local end elapsed pretty
  end=$(_timing_now)
  elapsed=$(awk -v s="${__TIMING_START:-$end}" -v e="${end}" 'BEGIN { printf "%.3f", e - s }')
  pretty=$(_timing_format "${elapsed}")
  echo ""
  echo "⏱  Elapsed: ${pretty}  (${elapsed}s)"
}

__TIMING_START=$(_timing_now)
trap _timing_print EXIT
