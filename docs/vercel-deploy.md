# Deploy on Vercel

Production hosting uses [Vercel](https://vercel.com) instead of SSH/rsync to Hostinger. Every push to `master` can deploy automatically once the project is linked.

## One-time setup

### 1. Import the repo

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import **walu22/savannaexplorer** from GitHub
3. Vercel reads `vercel.json` automatically:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Install command:** `npm ci`

Do **not** override these unless debugging — the postbuild prerender step must run.

### 2. Environment variables

In Vercel → **Project → Settings → Environment Variables**, add for **Production** (and Preview if you want):

| Variable | Example | Required |
|----------|---------|----------|
| `VITE_SITE_URL` | `https://savannaexplorer.com` | Yes |
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | Yes |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_...` | Yes |
| `VITE_GSC_VERIFICATION` | Google Search Console tag value | Optional |
| `VITE_GA4_ID` | `G-XXXXXXXXXX` | Optional |

Redeploy after adding or changing variables (Vite bakes them in at build time).

### 3. Custom domain

1. Vercel → **Project → Settings → Domains**
2. Add `savannaexplorer.com` and `www.savannaexplorer.com`
3. Update DNS at your registrar (replace Hostinger A record):

   | Type | Name | Value |
   |------|------|--------|
   | A | `@` | `76.76.21.21` |
   | CNAME | `www` | `cname.vercel-dns.com` |

   (Use the exact values Vercel shows in the Domains panel — they may differ.)

4. Wait for DNS propagation, then confirm HTTPS is active in Vercel.

### 4. GitHub Actions (optional)

The repo includes `.github/workflows/deploy-production.yml`, which builds in CI and runs `vercel deploy dist --prod`. This is **optional** if you already use Vercel’s Git integration (recommended — one deploy per push, no duplicate builds).

To use the workflow instead of (or alongside) Vercel Git hooks, add GitHub **Actions secrets**:

| Secret | Where to get it |
|--------|-----------------|
| `VERCEL_TOKEN` | Vercel → Account → Tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` after `npx vercel link`, or team settings |
| `VERCEL_PROJECT_ID` | same file |

Keep existing `VITE_*` secrets in GitHub if the workflow builds there.

**Tip:** Prefer a single deploy path — either Vercel Git **or** the GitHub workflow — to avoid two production deploys per merge.

## Local Vercel CLI

```bash
npm install
npm run build
npx vercel deploy dist --prod
```

First run: `npx vercel link` to connect the local folder to the Vercel project.

## What Vercel serves

- **SPA fallback** — unknown paths rewrite to `/index.html` (see `vercel.json`)
- **Prerendered SEO pages** — `dist/countries/*`, `dist/parks/*`, etc. from `postbuild` take precedence over the fallback
- **Hub sections** — `/parks`, `/embassies`, … have dedicated `index.html` fallbacks
- **Static assets** — long cache on `/assets/*`

## Turning off Hostinger

After Vercel serves `savannaexplorer.com` correctly:

1. Confirm footer version and country pages on the live domain
2. Stop using Hostinger deploy secrets (`DEPLOY_HOST`, `DEPLOY_SSH_KEY`, …)
3. Optionally shut down the VPS or repoint it elsewhere

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Old version after deploy | Hard refresh; check Vercel deployment log for build errors |
| `#parks` blank | Ensure `postbuild` ran (`Wrote 8 hub SPA fallbacks` in build log) |
| 404 on `/countries/namibia` | Confirm prerender step wrote `dist/countries/namibia/index.html` |
| Env vars not applied | Redeploy after changing Vercel env vars |
