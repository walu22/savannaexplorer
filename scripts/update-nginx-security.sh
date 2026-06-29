#!/usr/bin/env bash
# Apply Savanna Explorer nginx CSP on the production VPS.
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

export CSP_VALUE DEPLOY_PATH
sudo CSP_VALUE="$CSP_VALUE" DEPLOY_PATH="$DEPLOY_PATH" python3 <<'PY'
import os, re, pathlib, subprocess, sys

csp = os.environ["CSP_VALUE"]
deploy_path = os.environ["DEPLOY_PATH"]
replacement = f'add_header Content-Security-Policy "{csp}" always;'
patterns = [
    r'add_header Content-Security-Policy "[^"]*"(?: always)?;',
    r"add_header Content-Security-Policy '[^']*'(?: always)?;",
]

# Collect nginx configs related to this site
candidates = set()
for root in ("/etc/nginx/sites-enabled", "/etc/nginx/conf.d", "/etc/nginx/snippets"):
    p = pathlib.Path(root)
    if not p.is_dir():
        continue
    for path in p.rglob("*"):
        if path.is_file():
            try:
                text = path.read_text()
            except OSError:
                continue
            if (
                deploy_path in text
                or "savannaexplorer" in text
                or "Content-Security-Policy" in text
            ):
                candidates.add(path)

if not candidates:
    print("ERROR: No nginx config candidates found")
    sys.exit(1)

changed_files = 0
for path in sorted(candidates):
    text = path.read_text()
    updated = text
    total = 0
    for pattern in patterns:
        updated, count = re.subn(pattern, replacement, updated)
        total += count

    if total == 0 and "Content-Security-Policy" not in text and "server {" in text and deploy_path in text:
        updated = updated.replace("server {", f"server {{\n    {replacement}", 1)
        total = 1

    if updated != text:
        path.write_text(updated)
        changed_files += 1
        print(f"Patched {path} ({total} CSP line(s))")

if changed_files == 0:
    print("ERROR: No nginx CSP lines were updated")
    sys.exit(1)

if not any("connect-src" in p.read_text() for p in candidates):
    print("ERROR: connect-src missing after patch")
    sys.exit(1)
PY

sudo nginx -t
sudo systemctl reload nginx

sleep 1
HEADERS=$(curl -fsSI -k --resolve savannaexplorer.com:443:127.0.0.1 "https://savannaexplorer.com/" | tr -d '\r')
echo "$HEADERS" | grep -qi 'connect-src' || {
    echo "ERROR: HTTPS origin response missing connect-src in CSP"
    echo "$HEADERS" | grep -i content-security-policy || true
    exit 1
}

rm -f /tmp/savannaexplorer-csp.conf
echo "Nginx CSP updated and verified over HTTPS."
REMOTE
