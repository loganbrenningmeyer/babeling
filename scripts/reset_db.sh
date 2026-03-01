#!/usr/bin/env sh
set -eu

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
# Master list of tables to delete
# -------------------------
ALL_TABLES="
documents
document_images
document_page_blocks
document_pages
document_read_progress
document_sections
glossary_items
page_translations
user_documents
"

# -------------------------
# Drop each table in the master list
# -------------------------
cd "$API_DIR"

for table_name in $ALL_TABLES; do
  echo "Deleting: $table_name"
  PYTHONPATH="src${PYTHONPATH:+:$PYTHONPATH}" python -m api.database.delete_table "$table_name"
done

echo "Re-initializing database..."
PYTHONPATH="src${PYTHONPATH:+:$PYTHONPATH}" python -m api.database.init_db