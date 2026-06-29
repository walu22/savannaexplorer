#!/usr/bin/env bash
# Apply Savanna Explorer nginx security headers on the production VPS.
# Requires SSH config host "deploy-host" (see deploy-production workflow).

set -euo pipefail

SNIPPET_SRC="${1:-deploy/nginx/savannaexplorer-csp.conf}"
SNIPPET_DEST="/etc/nginx/snippets/savannaexplorer-csp.conf"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/savannaexplorer}"

if [ ! -f "$SNIPPET_SRC" ]; then
    echo "Missing snippet: $SNIPPET_SRC"
    exit 1
fi

echo "Uploading nginx security snippet..."
ssh -F "$HOME/.ssh/config" deploy-host "sudo mkdir -p $(dirname "${SNIPPET_DEST}")"
scp -F "$HOME/.ssh/config" "$SNIPPET_SRC" "deploy-host:/tmp/savannaexplorer-csp.conf.new"

ssh -F "$HOME/.ssh/config" deploy-host "DEPLOY_PATH='${DEPLOY_PATH}' SNIPPET_DEST='${SNIPPET_DEST}' bash -s" <<'REMOTE'
set -euo pipefail

sudo mv /tmp/savannaexplorer-csp.conf.new "${SNIPPET_DEST}"
sudo chmod 644 "${SNIPPET_DEST}"

# Find site config serving the app root
SITE=""
for candidate in /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf; do
    [ -f "$candidate" ] || continue
    if sudo grep -q "${DEPLOY_PATH}" "$candidate" 2>/dev/null || sudo grep -q 'savannaexplorer' "$candidate" 2>/dev/null; then
        SITE="$candidate"
        break
    fi
done

if [ -z "$SITE" ]; then
    echo "Could not locate nginx site config for ${DEPLOY_PATH}"
    exit 1
fi

echo "Patching nginx site config: ${SITE}"

# Remove inline security headers so the snippet is the single source of truth
sudo sed -i \
    -e '/Strict-Transport-Security/d' \
    -e '/X-Frame-Options/d' \
    -e '/X-Content-Type-Options/d' \
    -e '/Referrer-Policy/d' \
    -e '/Content-Security-Policy/d' \
    "$SITE"

# Ensure include exists inside the server block (once)
if ! sudo grep -q 'savannaexplorer-csp.conf' "$SITE"; then
    sudo sed -i "/server {/a\\    include ${SNIPPET_DEST};" "$SITE"
fi

sudo nginx -t
sudo systemctl reload nginx
echo "Nginx security headers updated."
REMOTE
