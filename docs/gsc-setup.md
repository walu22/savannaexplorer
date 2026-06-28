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
| Property added | ☐ Pending | URL prefix: `https://savannaexplorer.com` |
| Verification method | ☐ DNS TXT ☐ HTML meta | See below |
| Verified on | | |
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
| Sitemap submitted (`sitemap.xml`) | ☐ | |
| GSC status | ☐ Success ☐ Error | |
| Discovered pages | | |

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
| Site added | ☐ | |
| Verified | ☐ | Import from GSC or separate verification |
| Sitemap submitted | ☐ | `https://savannaexplorer.com/sitemap.xml` |

---

## Google Analytics 4 (optional)

| Item | Status | Notes |
|------|--------|-------|
| GA4 property created | ☐ | https://analytics.google.com |
| Measurement ID | | Format `G-XXXXXXXXXX` — store in `.env` / GitHub secret only |
| Live on site | ☐ | Set `VITE_GA4_ID`, rebuild, redeploy |
| Realtime data confirmed | ☐ | |

---

## Production smoke tests

Run after any deploy:

```bash
curl -sI https://savannaexplorer.com/sitemap.xml | head -3
curl -s https://savannaexplorer.com/sitemap.xml | grep -c '<loc>'   # expect 97
curl -sL https://savannaexplorer.com/countries/namibia | grep '<title>'
curl -sL https://savannaexplorer.com/stays/sanparks-reservations | grep '<title>'
```

---

## Errors & resolution

| Date | Error | Resolution |
|------|-------|------------|
| | | |
