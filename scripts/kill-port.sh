#!/usr/bin/env bash
# kill-port.sh — Safely stop any process listening on a target TCP port (macOS compatible)
# Usage:
#   ./scripts/kill-port.sh <port>
#   PORT=3000 ./scripts/kill-port.sh
#   ./scripts/kill-port.sh --force <port>   # immediately SIGKILL if needed
#
# Behavior:
# - Sends SIGTERM first, waits up to 5 seconds for clean shutdown
# - If still running, escalates to SIGKILL
# - No-op if no process is listening on the port

set -euo pipefail

FORCE=false
PORT="${PORT:-}"

usage() {
  echo "Usage: $0 [--force] <port>" 1>&2
}

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --force)
      FORCE=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [[ -z "${PORT}" ]]; then
        PORT="$1"
        shift
      else
        echo "Error: unexpected argument '$1'" 1>&2
        usage
        exit 1
      fi
      ;;
  esac
done

if [[ -z "${PORT}" ]]; then
  echo "Error: target <port> is required" 1>&2
  usage
  exit 1
fi

if ! [[ "${PORT}" =~ ^[0-9]+$ ]]; then
  echo "Error: port must be numeric, got '${PORT}'" 1>&2
  exit 1
fi

# Find PIDs listening on the given port (TCP LISTEN)
# -t prints only PIDs (easier to script)
# Suppress errors if none found
PIDS=$(lsof -nP -iTCP:"${PORT}" -sTCP:LISTEN -t 2>/dev/null || true)

if [[ -z "${PIDS}" ]]; then
  echo "No process is listening on port ${PORT}. Nothing to do."
  exit 0
fi

echo "Found process(es) listening on port ${PORT}: ${PIDS}"

if [[ "${FORCE}" == "true" ]]; then
  echo "FORCE mode: sending SIGKILL to: ${PIDS}"
  kill -KILL ${PIDS} || true
  echo "Port ${PORT} should now be free."
  exit 0
fi

# Graceful stop first
echo "Sending SIGTERM to: ${PIDS}"
kill -TERM ${PIDS} || true

# Wait up to 5 seconds for processes to exit
for i in {1..5}; do
  sleep 1
  STILL_RUNNING=()
  for pid in ${PIDS}; do
    if kill -0 "$pid" 2>/dev/null; then
      STILL_RUNNING+=("$pid")
    fi
  done
  if [[ ${#STILL_RUNNING[@]} -eq 0 ]]; then
    echo "All processes exited gracefully. Port ${PORT} is free."
    exit 0
  fi
  echo "Waiting... still running: ${STILL_RUNNING[*]}"
  PIDS="${STILL_RUNNING[*]}"
done

# Escalate if needed
if [[ -n "${PIDS}" ]]; then
  echo "Escalating: sending SIGKILL to: ${PIDS}"
  kill -KILL ${PIDS} || true
fi

echo "Port ${PORT} should now be free."
