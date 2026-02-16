#!/usr/bin/env sh
set -eu

# -------------------------
# Resolve repo paths from home directory
# -------------------------
REPO_DIR="$HOME/projects/babeling"
API_DIR="$REPO_DIR/services/api"

if [ ! -d "$API_DIR" ]; then
  echo "Could not find services/api at: $API_DIR"
  exit 1
fi

# -------------------------
# Drop each requested table
# -------------------------
cd "$API_DIR"
PYTHONPATH="src${PYTHONPATH:+:$PYTHONPATH}" python -m api.database.init_db
