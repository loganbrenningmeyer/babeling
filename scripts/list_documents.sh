#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
API_DIR="$REPO_DIR/services/api"

if [ ! -d "$API_DIR" ]; then
  echo "Could not find services/api at: $API_DIR"
  exit 1
fi

cd "$API_DIR"
PYTHONPATH="src${PYTHONPATH:+:$PYTHONPATH}" python -m api.database.list_documents
