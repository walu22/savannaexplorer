#!/usr/bin/env bash
# Provision Google Search Console API credentials in GCP.
# Run on a machine where gcloud is authenticated (e.g. your laptop with Cursor GCP connected).
#
# Project: tumahelper-ai-dev
# Account: waluka.mubita@tumahelper.com
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-tumahelper-ai-dev}"
SA_ID="${GSC_SA_ID:-savannaexplorer-gsc}"
SA_EMAIL="${SA_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
KEY_FILE="${GSC_KEY_FILE:-./gsc-key.json}"
API="searchconsole.googleapis.com"

echo "=== Savanna Explorer GSC provisioning ==="
echo "Project:  ${PROJECT_ID}"
echo "SA email: ${SA_EMAIL}"
echo "Key file: ${KEY_FILE}"
echo

if ! command -v gcloud >/dev/null 2>&1; then
    echo "gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

gcloud config set project "${PROJECT_ID}"

echo "→ Enabling ${API}..."
gcloud services enable "${API}" --project="${PROJECT_ID}"

if gcloud iam service-accounts describe "${SA_EMAIL}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
    echo "→ Service account already exists: ${SA_EMAIL}"
else
    echo "→ Creating service account ${SA_ID}..."
    gcloud iam service-accounts create "${SA_ID}" \
        --project="${PROJECT_ID}" \
        --display-name="Savanna Explorer Search Console"
fi

if [[ -f "${KEY_FILE}" ]]; then
    echo "→ Key file ${KEY_FILE} already exists — skipping key creation."
else
    echo "→ Creating JSON key..."
    gcloud iam service-accounts keys create "${KEY_FILE}" \
        --project="${PROJECT_ID}" \
        --iam-account="${SA_EMAIL}"
    chmod 600 "${KEY_FILE}"
fi

cat <<EOF

=== GCP done. One manual step in Search Console ===

Add this email as Owner in Google Search Console:
  ${SA_EMAIL}

  1. Open https://search.google.com/search-console
  2. Select https://savannaexplorer.com
  3. Settings → Users and permissions → Add user
  4. Paste: ${SA_EMAIL}
  5. Permission: Owner → Add

Then verify and store the GitHub secret:

  npm run setup:gsc -- --file ${KEY_FILE} --github-secret

Or upload ${KEY_FILE} manually as GitHub secret GSC_SERVICE_ACCOUNT_JSON.

EOF

if [[ "${1:-}" == "--verify" ]]; then
    echo "→ Running setup:gsc verification..."
    npm run setup:gsc -- --file "${KEY_FILE}" --github-secret
fi
