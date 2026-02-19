#!/usr/bin/env sh
set -eu

if [ "$#" -lt 1 ]; then
  echo "Usage: sh scripts/delete_tables.sh <table1> [table2 ...]"
  exit 1
fi

# -------------------------
# Resolve repo paths from home directory
# -------------------------
REPO_DIR="$HOME/Documents/GitHub/babeling"
API_DIR="$REPO_DIR/services/api"

if [ ! -d "$API_DIR" ]; then
  echo "Could not find services/api at: $API_DIR"
  exit 1
fi

# -------------------------
# Drop each requested table
# -------------------------
cd "$API_DIR"
for table_name in "$@"; do
  PYTHONPATH="src${PYTHONPATH:+:$PYTHONPATH}" python -m api.database.delete_table "$table_name"
done
