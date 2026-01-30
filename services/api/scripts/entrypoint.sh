#!/usr/bin/env bash
set -euo pipefail

fetch_if_missing () {
  local url="$1"
  local path="$2"

  if [[ -z "${url}" ]]; then
    echo "No URL set for ${path}, skipping."
    return 0
  fi

  if [[ -f "${path}" ]]; then
    echo "Found ${path} (cached)."
    return 0
  fi

  echo "Downloading ${path}..."
  mkdir -p "$(dirname "${path}")"
  curl -L --fail --progress-bar "${url}" -o "${path}"
  echo "Downloaded ${path}."
}

fetch_if_missing "${DEFINITIONS_DB_URL:-}" "${DEFINITIONS_DB_PATH:-/data/definitions.sqlite}"
fetch_if_missing "${BINARYALIGN_CKPT_URL:-}" "${BINARYALIGN_CKPT_PATH:-/data/models/binaryalign/model.ckpt}"

exec uvicorn api.main:app --host 0.0.0.0 --port 8000