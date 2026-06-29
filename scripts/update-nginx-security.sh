#!/usr/bin/env bash
# Apply Savanna Explorer nginx CSP on the production VPS (inline site config patch).
# Requires SSH config host "deploy-host" (see deploy-production workflow).

set -euo pipefail

SNIPPET_SRC="${1:-deploy/nginx/savannaexplorer-csp.conf}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/savannaexplorer}"

if [ ! -f "$SNIPPET_SRC" ]; then
    echo "Missing snippet: $SNIPPET_SRC"
    exit 1
fi

echo "Patching nginx CSP on production..."
scp -F "$HOME/.ssh/config" "$SNIPPET_SRC" "deploy-host:/tmp/savannaexplorer-csp.conf"

ssh -F "$HOME/.ssh/config" deploy-host "DEPLOY_PATH='${DEPLOY_PATH}' bash -s" <<'REMOTE'
set -euo pipefail

CSP_VALUE=$(sed -n 's/^add_header Content-Security-Policy "\(.*\)" always;$/\1/p' /tmp/savannaexplorer-csp.conf)
if [ -z "$CSP_VALUE" ]; then
    echo "Remote CSP parse failed"
    exit 1
fi

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

echo "Updating nginx site config: ${SITE}"
sudo cp "$SITE" "${SITE}.bak.$(date +%Y%m%d_%H%M%S)"

export CSP_VALUE SITE
sudo CSP_VALUE="$CSP_VALUE" SITE="$SITE" python3 <<'PY'
import os, re, pathlib

site = os.environ["SITE"]
csp = os.environ["CSP_VALUE"]
path = pathlib.Path(site)
text = path.read_text()
replacement = f'add_header Content-Security-Policy "{csp}" always;'
if "Content-Security-Policy" in text:
    text = re.sub(
        r'add_header Content-Security-Policy "[^"]*" always;',
        replacement,
        text,
    )
else:
    text = text.replace("server {", f"server {{\n    {replacement}", 1)
path.write_text(text)
PY

sudo nginx -t
sudo systemctl reload nginx
rm -f /tmp/savannaexplorer-csp.conf
echo "Nginx CSP updated."
REMOTE
