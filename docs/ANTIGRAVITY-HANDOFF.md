# Antigravity handoff — SEO & production

**Mission:** Maintain the Vercel production deployment, verify https://savannaexplorer.com in Google Search Console, submit the sitemap (165 URLs), and optionally add GA4.

**Repo:** `walu22/savannaexplorer`  
**Local path:** `C:\Users\k9pur\.gemini\antigravity\scratch\savannaexplorer`  
**Prod:** Vercel project serving `savannaexplorer.com`
**Version:** v4.35.0 (footer shows version after hard refresh)

---

## Decisions (defaults — proceed unless user overrides)

| Question | Decision |
|----------|----------|
| GSC verification | **Option A — DNS TXT** first. Fall back to Option B (HTML meta) only if DNS access fails. |
| GA4 | **Yes, set up** if user provides `G-XXXXXXXXXX`. Skip if not provided after one ask. |
| Test deploy commit | **Yes** — after GitHub Actions secrets are configured, push a doc-only commit to `master` and confirm workflow succeeds. |

---

## Task order

### 1. Sync & verify prod

```powershell
cd C:\Users\k9pur\.gemini\antigravity\scratch\savannaexplorer
git pull origin master
npm install
npm run dev   # footer v4.35.0 at http://localhost:5173
```

Confirm live:
- `#book-direct` section exists
- `/sitemap.xml` → 165 URLs
- `/countries/namibia` page source title = "Namibia Travel Guide"

Log results in `docs/gsc-setup.md`.

### 2. Google Search Console

Follow `docs/gsc-setup.md`. Summary:

1. Add property `https://savannaexplorer.com` (URL prefix)
2. Verify via **DNS TXT** at the active DNS provider
3. Submit sitemap: `sitemap.xml`
4. Request indexing for 10 priority URLs (listed in gsc-setup.md)

**If DNS fails:** ask user for GSC meta token → set `VITE_GSC_VERIFICATION` in `.env` → build → deploy.

### 3. Bing Webmaster

https://www.bing.com/webmasters — import from GSC or verify separately, submit same sitemap.

### 4. GA4 (if ID provided)

1. Add `VITE_GA4_ID=G-XXXXXXXXXX` to local `.env`
2. Add same as GitHub secret for Actions builds
3. `VITE_SITE_URL=https://savannaexplorer.com npm run build`
4. Deploy `dist/`
5. Confirm gtag in page source; check GA4 Realtime

### 5. Vercel Git deployment

Vercel Git integration deploys `master`. GitHub Actions workflow `.github/workflows/verify-vercel.yml` runs tests and a production build as an independent CI check.

Keep application variables in Vercel → Project → Settings → Environment Variables:

| Variable | Purpose |
|----------|---------|
| `VITE_SITE_URL` | Production canonical URL |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable key |
| `VITE_GSC_VERIFICATION` | Optional Search Console verification |
| `VITE_GA4_ID` | Optional GA4 measurement ID |

Test: push a reviewed change to `master`, confirm Actions → Verify Vercel release succeeds, then confirm the corresponding production deployment is Ready in Vercel.

### 6. Build verification (GSC meta / GA4)

```powershell
$env:VITE_SITE_URL="https://savannaexplorer.com"
$env:VITE_GSC_VERIFICATION="test-token-for-local-build-only"
$env:VITE_GA4_ID="G-TEST12345"
npm run build
Select-String -Path dist\index.html -Pattern "google-site-verification|gtag"
```

Remove test values before production deploy unless real tokens.

---

## Key files

| File | Role |
|------|------|
| `docs/gsc-setup.md` | Status log — update as you complete steps |
| `scripts/generate-sitemap.mjs` | 165 URLs at build time |
| `scripts/prerender-seo.mjs` | SEO HTML per route |
| `vite.config.js` | Injects GSC + GA4 at build |
| `.env.example` | Env var reference |
| `.github/workflows/verify-vercel.yml` | Test and production-build verification |

---

## Do NOT

- Commit `.env`, passwords, or private keys
- Add booking/payment flows
- Break prerender routes (`/countries/*`, `/parks/*`, `/stays/*`, etc.)

---

## Done when

- [ ] GSC verified + sitemap Success
- [ ] 10 URLs requested for indexing
- [ ] Bing sitemap submitted
- [ ] `docs/gsc-setup.md` filled in with dates
- [ ] (Optional) GA4 Realtime working
- [ ] (Optional) GitHub Actions deploy green on `master`
