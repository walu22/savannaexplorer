#!/usr/bin/env bash
# Deploy dist/ to Hostinger VPS via rsync over SSH.
# Usage (after npm run build):
#   DEPLOY_HOST=31.97.56.157 DEPLOY_USER=root DEPLOY_PATH=/var/www/html ./scripts/deploy-rsync.sh

set -euo pipefail

: "${DEPLOY_HOST:?Set DEPLOY_HOST (e.g. savannaexplorer.com)}"
: "${DEPLOY_USER:?Set DEPLOY_USER (SSH user on Hostinger VPS)}"
: "${DEPLOY_PATH:?Set DEPLOY_PATH (web root, e.g. .../public_html)}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -d dist ]]; then
  echo "dist/ not found — run: VITE_SITE_URL=https://savannaexplorer.com npm run build"
  exit 1
fi

echo "Backing up remote ${DEPLOY_PATH} ..."
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" \
  "test -d '${DEPLOY_PATH}' && cp -a '${DEPLOY_PATH}' '${DEPLOY_PATH}_backup_$(date +%Y%m%d_%H%M%S)' || mkdir -p '${DEPLOY_PATH}'"

echo "Uploading dist/ to ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/ ..."
rsync -avz --delete dist/ "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

echo "Done. Verify: https://savannaexplorer.com/ (footer should show v4.13.0 after hard refresh)"
