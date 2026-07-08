# Google Search Console & Bing setup log

Track verification and indexing progress for https://savannaexplorer.com/

**Do not put secrets in this file.** Record dates and status only.

---

## Property details

| Field | Value |
|-------|-------|
| Site URL | `https://savannaexplorer.com` |
| Sitemap URL | `https://savannaexplorer.com/sitemap.xml` |
| Sitemap URL count | 160 (as of v4.34.0) |
| `robots.txt` | Allows all crawlers; references sitemap |

---

## Google Search Console

### Verification

| Item | Status | Notes |
|------|--------|-------|
| Property added | ☑ Done (June 28, 2026) | URL prefix: `https://savannaexplorer.com` |
| Verification method | ☑ HTML File | `google017a1951885e383b.html` generated and deployed via CI |
| Verified on | ☑ June 28, 2026 | Verified by user in GSC UI |
| Verified by | walu22 | |

**Option C — HTML File (Used)**  
1. User provided HTML file name (`google017a1951885e383b.html`).
2. Added file to `public/` and deployed via GitHub Actions.
3. User verified in GSC.


### Sitemap

| Item | Status | Date |
|------|--------|------|
| Sitemap submitted (`sitemap.xml`) | ☑ Done | June 28, 2026 |
| Auto-resubmit on deploy | ☑ IndexNow (160 URLs) + optional GSC API | v4.34.1+ |
| GSC API auto-resubmit | ☐ Pending `GSC_SERVICE_ACCOUNT_JSON` secret | GCP project: `tumahelper-ai-dev` |
| Discovered pages | Expect **160 URLs** after next crawl | |

### Priority URL indexing requests

Use GSC → URL inspection → Request indexing:

- [x] `https://savannaexplorer.com/`
- [x] `https://savannaexplorer.com/countries/namibia`
- [x] `https://savannaexplorer.com/countries/south-africa`
- [x] `https://savannaexplorer.com/countries/botswana`
- [x] `https://savannaexplorer.com/parks/kruger`
- [x] `https://savannaexplorer.com/parks/etosha`
- [x] `https://savannaexplorer.com/borders/vioolsdrift`
- [x] `https://savannaexplorer.com/itineraries/desert-to-delta`
- [x] `https://savannaexplorer.com/stays/sanparks-reservations`
- [x] `https://savannaexplorer.com/guides/planning/namibia`
- [x] `https://savannaexplorer.com/plan`

### Weekly check (after setup)

| Date | Indexed pages (GSC) | Impressions | Notes |
|------|---------------------|-------------|-------|
| | | | |

---

## Automated search indexing (v4.34.1+)

After each successful deploy, `scripts/submit-search-indexing.mjs` runs automatically:

1. **IndexNow** — notifies Bing, Yandex, Naver, and other IndexNow partners with all sitemap URLs (160) plus priority pages.
2. **Google Search Console** (optional) — resubmits the sitemap via API if GitHub secret `GSC_SERVICE_ACCOUNT_JSON` is set.

### One-time GSC API setup (for Google auto-resubmit)

**GCP project:** `tumahelper-ai-dev` (account: `waluka.mubita@tumahelper.com`) — see `docs/gcp-tumahelper-ai-dev.md`

#### Automated (run locally where `gcloud` is authenticated)

```bash
chmod +x scripts/provision-gsc-gcp.sh
./scripts/provision-gsc-gcp.sh
```

Then add `savannaexplorer-gsc@tumahelper-ai-dev.iam.gserviceaccount.com` as **Owner** in Search Console → Users, and:

```bash
npm run setup:gsc -- --file ./gsc-key.json --github-secret
```

#### Manual (Cloud Console UI)

1. [Google Cloud Console](https://console.cloud.google.com/) → project **tumahelper-ai-dev** → **APIs & Services → Library** → enable **Google Search Console API**.
2. **Credentials → Create credentials → Service account** → create key (JSON) and download it.
3. [Search Console](https://search.google.com/search-console) → **Settings → Users and permissions** → add the service account `client_email` as **Owner**.
4. From this repo (with [GitHub CLI](https://cli.github.com/) logged in as repo admin):

```bash
npm run setup:gsc -- --file ./gsc-key.json --github-secret
```

This verifies API access, resubmits the sitemap once, and stores the JSON in GitHub secret `GSC_SERVICE_ACCOUNT_JSON`.

**Manual secret upload:** GitHub → repo **Settings → Secrets and variables → Actions** → New secret → name `GSC_SERVICE_ACCOUNT_JSON` → paste full JSON file contents.

**Re-run indexing without deploy:** Actions → **Submit search indexing** → Run workflow.

Without this secret, IndexNow still notifies Bing; Google relies on sitemap crawls or manual GSC resubmit.

---

| Item | Status | Date |
|------|--------|------|
| Site added | ☐ Pending | |
| Verified | ☐ Pending | Import from GSC or separate verification |
| Sitemap submitted | ☐ Pending | `https://savannaexplorer.com/sitemap.xml` |

---

## Google Analytics 4 (optional)

| Item | Status | Notes |
|------|--------|-------|
| GA4 property created | ☐ Skipped / Pending | No GA4 Measurement ID provided yet |
| Measurement ID | Pending | Format `G-XXXXXXXXXX` — store in `.env` / GitHub secret only |
| Live on site | ☐ Pending | Set `VITE_GA4_ID,` rebuild, redeploy |
| Realtime data confirmed | ☐ Pending | |

---

## Production smoke tests

Run after any deploy:

```bash
curl -sI https://savannaexplorer.com/sitemap.xml | head -3
curl -s https://savannaexplorer.com/sitemap.xml | grep -c '<loc>'   # expect 160
curl -sL https://savannaexplorer.com/countries/namibia | grep '<title>'
curl -sL https://savannaexplorer.com/stays/sanparks-reservations | grep '<title>'
```

**Smoke Test Results (June 28, 2026):**
- `/sitemap.xml`: Checked and returned status 200 with exactly **97** `<loc>` entries.
- `/countries/namibia`: Title verified as `<title>Namibia Travel Guide | Savanna Explorer</title>`.
- `/stays/sanparks-reservations`: Title verified as `<title>SANParks rest camps & lodges | Savanna Explorer</title>`.
- Homepage: Checked and verified that the `#book-direct` section is present.

---

## Errors & resolution

| Date | Error | Resolution |
|------|-------|------------|
| June 28, 2026 | GitHub Actions Deploy timeout: `ssh: connect to host 31.97.56.157 port 22: Connection timed out` | **Resolved**: User opened Hostinger hPanel VPS firewall for inbound TCP port 22 (`0.0.0.0/0`). |
| June 28, 2026 | `ssh-keyscan` exited with code 1 in GitHub Actions | Bypassed by statically declaring the verified host public key in the workflow's `known_hosts` file. |
| June 28, 2026 | Load key `/home/runner/.ssh/deploy_key`: error in libcrypto | **Resolved**: SSH private key secret in GitHub was corrupted by Windows text-mode pipe translation. Re-uploaded raw binary contents using CMD redirection. |



