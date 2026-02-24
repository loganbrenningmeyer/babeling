#!/usr/bin/env sh
set -eu

REPO_DIR="$HOME/projects/babeling"
API_DIR="$REPO_DIR/services/api"

cd "$API_DIR/src/api"
modal deploy modal_align.py