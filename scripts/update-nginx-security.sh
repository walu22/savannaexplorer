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
import os, re, pathlib, sys

site = os.environ["SITE"]
csp = os.environ["CSP_VALUE"]
path = pathlib.Path(site)
text = path.read_text()
replacement = f'add_header Content-Security-Policy "{csp}" always;'

patterns = [
    r'add_header Content-Security-Policy "[^"]*"(?: always)?;',
    r"add_header Content-Security-Policy '[^']*'(?: always)?;",
]

updated = text
for pattern in patterns:
    updated, count = re.subn(pattern, replacement, updated)
    if count:
        print(f"Replaced {count} CSP header(s) via {pattern}")

if updated == text:
    updated = updated.replace("server {", f"server {{\n    {replacement}", 1)
    print("Inserted CSP header after server {")

if "connect-src" not in updated:
    print("ERROR: connect-src not present in nginx config after patch")
    sys.exit(1)

path.write_text(updated)
PY

sudo nginx -t
sudo systemctl reload nginx

# Verify live response from origin includes connect-src
sleep 1
HEADERS=$(curl -fsSI -H 'Host: savannaexplorer.com' "http://127.0.0.1/" | tr -d '\r')
echo "$HEADERS" | grep -qi 'connect-src' || {
    echo "ERROR: Origin response missing connect-src in CSP"
    echo "$HEADERS" | grep -i content-security-policy || true
    exit 1
}

rm -f /tmp/savannaexplorer-csp.conf
echo "Nginx CSP updated and verified."
REMOTE
