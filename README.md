# Savanna Explorer

Southern Africa independent travel planning hub — country guides, route templates, parks, borders, and official resource links.

## About this site

On the live site, open **About This Site** (`#about`) for our editorial policy, data sourcing, partner guidelines, and hub FAQs (including “Can you book my trip?”). Developer reference: `SOURCES.md` and `data/about.json`.

## Local preview (required after June 2026 refactor)

The site uses **ES modules** and JSON data files. It **must** be run with **Vite** — `npx serve` or opening `index.html` directly will **not** show the latest features.

### Windows (PowerShell)

Open your project folder:

```powershell
cd C:\Users\k9pur\.gemini\antigravity\scratch\savannaexplorer
```

Pull the latest code, install dependencies, and start the dev server:

```powershell
git pull origin master
npm install
npm run dev
```

`npm install` automatically creates `.env` with the Supabase credentials (or run `npm run setup:env` manually).

Then open **http://localhost:5173** in your browser (not port 3000 or 5500).

Use a hard refresh if the page looks stale: **Ctrl + Shift + R**

### Verify you have the latest build

After the page loads, scroll to the footer. You should see **v4.13.0** next to the copyright line.

You should also have these files/folders (not the old flat layout):

- `data/guides.json`, `data/itineraries.json`, `data/countries.json`
- `js/app.js`, `js/modules/`
- `package.json` with a `"dev": "vite"` script

The old root files `main.js`, `country-guide.js`, and `itinerary-data.js` were removed in the refactor.

### What to look for

- Country detail pages with tabs: **About**, **Travelling**, **Attractions**, **Activities**, **Routes**, plus **official resource links** (tourism, immigration, parks) on the Travelling tab
- **Itineraries** section with filter tabs (All / Single Country / Cross-Border), **View Route** planning templates, and indicative budgets (not quotes)
- **Marketplace** activity inspiration with cost bands, planning tips, and official resource links (31 listings)
- **Country guides** with regional breakdowns for every destination
- **Trip checklist** — printable planner in Travel Tools (`#plan`): countries, route template, visa notes, official links, borders, packing
- Enriched guides for Zambia, Zimbabwe, Mozambique, Malawi, Lesotho, and Eswatini

### Production build

```powershell
$env:VITE_SITE_URL="https://savannaexplorer.com"
npm run build
npm run preview
```

Preview runs at **http://localhost:4173** by default.

### Deploy to https://savannaexplorer.com

Production runs on a **Hostinger VPS** (nginx). The live site is updated by uploading the Vite `dist/` folder — there is no auto-deploy until GitHub Actions secrets are configured.

#### Option A — GitHub Actions (recommended)

1. In GitHub → **Settings → Secrets and variables → Actions**, add:

   | Secret | Example |
   |--------|---------|
   | `DEPLOY_HOST` | `31.97.56.157` or `savannaexplorer.com` |
   | `DEPLOY_USER` | SSH user from Hostinger hPanel (often `root` or your VPS user) |
   | `DEPLOY_PATH` | Web root, e.g. `/home/u123456789/domains/savannaexplorer.com/public_html` |
   | `DEPLOY_SSH_KEY` | Private key (PEM) that matches the public key on the VPS |
   | `VITE_SUPABASE_URL` | (optional) defaults match `scripts/setup-env.mjs` |
   | `VITE_SUPABASE_ANON_KEY` | (optional) publishable anon key |

2. Merge to `master` or run **Actions → Deploy to production → Run workflow**.

3. Confirm the footer shows **v4.13.0** and `/countries/namibia` loads after a hard refresh.

#### Option B — Manual rsync from your machine

```powershell
$env:VITE_SITE_URL="https://savannaexplorer.com"
npm run build
$env:DEPLOY_HOST="31.97.56.157"
$env:DEPLOY_USER="YOUR_SSH_USER"
$env:DEPLOY_PATH="/path/to/public_html"
npm run deploy:rsync
```

#### nginx SPA routing

After the first Vite deploy, ensure nginx serves `index.html` for client routes (`/countries/*`). See `deploy/nginx-savannaexplorer.conf` and reload nginx after editing.

## Supabase (optional backend)

The site works offline with local JSON data. Connect **Supabase** to store marketplace listings, contact form messages, and newsletter signups.

### Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env` and add your project URL and anon key (Dashboard → **Project Settings** → **API**)
3. In the Supabase **SQL Editor**, run:
   - `supabase/schema.sql` — creates tables and row-level security policies (fresh installs)
   - `supabase/migrate-phase-e.sql` — only if upgrading from pre-v4.11 (`quotations` / `inquiries` tables)
   - `supabase/seed.sql` — loads marketplace inspiration listings
4. Restart the dev server: `npm run dev`

Without `.env`, forms fall back to **mailto** and marketplace data loads from `data/marketplace.json`.

Set `VITE_SITE_URL` in `.env` before `npm run build` so `sitemap.xml` and canonical URLs use your production domain.

### SEO & routing (v4.13+)

- Country pages use real paths: `/countries/namibia` (legacy `#namibia` hashes redirect automatically)
- Per-country `<title>`, meta description, Open Graph, Twitter Card, and JSON-LD
- `public/sitemap.xml` and `public/robots.txt` generated at build time
- SPA hosting: `public/_redirects` included for Netlify-style hosts (all routes → `index.html`)

### Tables

| Table | Purpose |
|-------|---------|
| `experiences` | Marketplace inspiration listings (public read) |
| `site_messages` | Contact form submissions (corrections, feedback, partnerships) |
| `newsletter_subscribers` | Email signups |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (port 5173) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
