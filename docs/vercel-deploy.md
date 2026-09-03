# Deploy on Vercel

Production hosting uses [Vercel](https://vercel.com). Vercel Git integration deploys pushes to `master`; GitHub Actions independently runs the test and production-build checks.

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

For My Safari cloud sync, run `supabase/migrate-trip-cloud.sql`, `supabase/migrations/20260903090000_trip_collaboration.sql`, and `supabase/migrations/20260903093000_lock_collaboration_rpc.sql` in order in the Supabase SQL Editor. Add `https://savannaexplorer.com/**` to **Supabase Authentication → URL Configuration → Redirect URLs** and keep email authentication enabled for password-free sign-in links.

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

### 4. Git and CI integration

Connect the GitHub repository in Vercel and set `master` as the production branch. Vercel then creates preview deployments for pull requests and production deployments for pushes to `master`.

The repo includes `.github/workflows/verify-vercel.yml`, which runs `npm test` and `npm run build` for pull requests and pushes to `master`.

No Vercel deployment token is required in GitHub. Application environment variables remain in the Vercel project settings and are applied during the Vercel build.

## Local Vercel CLI

**Windows (recommended)** — build locally, upload `dist/` (avoids `vercel build` / `cmd.exe` issues):

```powershell
npm run build
npx vercel deploy dist --prod --yes
```

Or use the one-click script (same flow):

```powershell
npm run deploy:live
```

First run: `npx vercel link` to connect the local folder to the Vercel project.

**Linux / CI (optional prebuilt path):**

```bash
npm run deploy:live:prebuilt
```

This packages `dist/` with `scripts/package-vercel-output.mjs` instead of calling `vercel build`.

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
| `spawn cmd.exe ENOENT` on Windows | Use `npm run deploy:live` (uploads `dist/` — no local `vercel build`). Or add `C:\Windows\System32` to PATH and set `ComSpec` to `C:\Windows\System32\cmd.exe` |
| Old version after deploy | Hard refresh; check Vercel deployment log for build errors |
| `#parks` blank | Ensure `postbuild` ran (`Wrote 12 hub SPA fallbacks` in build log) |
| 404 on `/countries/namibia` | Confirm prerender step wrote `dist/countries/namibia/index.html` |
| Env vars not applied | Redeploy after changing Vercel env vars |
