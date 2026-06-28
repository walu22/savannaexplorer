# Google Search Console & Bing setup log

Track verification and indexing progress for https://savannaexplorer.com/

**Do not put secrets in this file.** Record dates and status only.

---

## Property details

| Field | Value |
|-------|-------|
| Site URL | `https://savannaexplorer.com` |
| Sitemap URL | `https://savannaexplorer.com/sitemap.xml` |
| Sitemap URL count | 97 (as of v4.15.0) |
| `robots.txt` | Allows all crawlers; references sitemap |

---

## Google Search Console

### Verification

| Item | Status | Notes |
|------|--------|-------|
| Property added | ☑ Done (June 28, 2026) | URL prefix: `https://savannaexplorer.com` |
| Verification method | ☑ DNS TXT (Option A) | Pending user DNS TXT propagation |
| Verified on | ☐ Pending | Waiting for TXT record verification |
| Verified by | | |

**Option A — DNS TXT (recommended)**  
1. GSC → Add property → URL prefix  
2. Choose **Domain name provider** verification  
3. Copy TXT record (`google-site-verification=...`)  
4. Hostinger hPanel → Domains → savannaexplorer.com → DNS → Add TXT at `@`  
5. Wait 5–30 min → Verify in GSC  

**Option B — HTML meta tag**  
1. GSC gives token in `content="..."`  
2. Set `VITE_GSC_VERIFICATION=TOKEN` in `.env` (local only)  
3. `VITE_SITE_URL=https://savannaexplorer.com npm run build`  
4. Deploy `dist/` to `/var/www/savannaexplorer`  
5. Confirm: `curl -s https://savannaexplorer.com/ | grep google-site-verification`  
6. Verify in GSC  

### Sitemap

| Item | Status | Date |
|------|--------|------|
| Sitemap submitted (`sitemap.xml`) | ☐ Pending | June 28, 2026 |
| GSC status | ☐ Pending | |
| Discovered pages | ☐ Pending | |

### Priority URL indexing requests

Use GSC → URL inspection → Request indexing:

- [ ] `https://savannaexplorer.com/`
- [ ] `https://savannaexplorer.com/countries/namibia`
- [ ] `https://savannaexplorer.com/countries/south-africa`
- [ ] `https://savannaexplorer.com/countries/botswana`
- [ ] `https://savannaexplorer.com/parks/kruger`
- [ ] `https://savannaexplorer.com/parks/etosha`
- [ ] `https://savannaexplorer.com/borders/vioolsdrift`
- [ ] `https://savannaexplorer.com/itineraries/desert-to-delta`
- [ ] `https://savannaexplorer.com/stays/sanparks-reservations`
- [ ] `https://savannaexplorer.com/operators/botswana-tourism-operators`

### Weekly check (after setup)

| Date | Indexed pages (GSC) | Impressions | Notes |
|------|---------------------|-------------|-------|
| | | | |

---

## Bing Webmaster Tools

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
curl -s https://savannaexplorer.com/sitemap.xml | grep -c '<loc>'   # expect 97
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
| | | |

