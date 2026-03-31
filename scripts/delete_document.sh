#!/usr/bin/env sh
set -eu

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "Usage: sh scripts/delete_document.sh <document_id> [--execute]"
  exit 1
fi

case "$1" in
  ''|*[!0-9]*)
    echo "document_id must be a positive integer"
    exit 1
    ;;
esac

if [ "$#" -eq 2 ] && [ "$2" != "--execute" ]; then
  echo "Only supported flag is --execute"
  exit 1
fi

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
API_DIR="$REPO_DIR/services/api"

if [ ! -d "$API_DIR" ]; then
  echo "Could not find services/api at: $API_DIR"
  exit 1
fi

cd "$API_DIR"
PYTHONPATH="src${PYTHONPATH:+:$PYTHONPATH}" python -m api.database.delete_document "$@"
