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

After the page loads, scroll to the footer. You should see **v4.39.0** next to the copyright line.

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
- **My Safari** — separate cloud-synced trips, private collaboration invitations, and a day-by-day route builder
- Enriched guides for Zambia, Zimbabwe, Mozambique, Malawi, Lesotho, and Eswatini

### Production build

```powershell
npm run build
npm run preview
```

Preview runs at **http://localhost:4173** by default.

## Supabase (optional backend)

The site works offline with local JSON data. Connect **Supabase** to store marketplace listings, contact form messages, newsletter signups, and optional authenticated My Safari trip sync.

### Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env` and add your project URL and anon key (Dashboard → **Project Settings** → **API**)
3. In the Supabase **SQL Editor**, run:
   - `supabase/schema.sql` — creates tables and row-level security policies (fresh installs)
   - `supabase/migrate-phase-e.sql` — only if upgrading from pre-v4.11 (`quotations` / `inquiries` tables)
   - `supabase/migrate-trip-cloud.sql` — adds owner-only trip sync and token-based read-only sharing to an existing project
   - `supabase/migrations/20260903090000_trip_collaboration.sql` — adds expiring editor/viewer invitations and collaboration activity
   - `supabase/migrations/20260903093000_lock_collaboration_rpc.sql` — restricts collaboration functions to authenticated travellers
   - `supabase/seed.sql` — loads marketplace inspiration listings
4. In **Authentication → URL Configuration**, set the production site URL and allow `https://savannaexplorer.com/**` plus the local development URL.
5. Keep email authentication enabled, then restart the dev server: `npm run dev`

Without `.env`, forms fall back to **mailto** and marketplace data loads from `data/marketplace.json`.

Set `VITE_SITE_URL` in `.env` before `npm run build` so `sitemap.xml` and canonical URLs use your production domain.

### Production deploy (Vercel)

See **`docs/vercel-deploy.md`** for full setup. Summary:

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new)
2. Add `VITE_*` environment variables in the Vercel project settings
3. Point `savannaexplorer.com` DNS to Vercel
4. Enable Vercel Git integration for the repository
5. Every push to `master` is verified by GitHub Actions and deployed by Vercel

Legacy Hostinger SSH deploy has been removed from CI in favour of Vercel.

### SEO & routing (v4.13+)

- Country pages use real paths: `/countries/namibia` (legacy `#namibia` hashes redirect automatically)
- Per-country `<title>`, meta description, Open Graph, Twitter Card, and JSON-LD
- `public/sitemap.xml` and `public/robots.txt` generated at build time
- SPA hosting: `vercel.json` rewrites + prerendered HTML in `dist/` (see `docs/vercel-deploy.md`)

### SEO Phase 3 (v4.14+)

- **Build-time prerender** — `postbuild` writes `dist/countries/*`, `dist/parks/*`, `dist/borders/*`, and `dist/itineraries/*` with correct meta tags and crawlable HTML (78 URLs in sitemap)
- **Expanded routes** — `/parks/kruger`, `/borders/vioolsdrift`, `/itineraries/desert-to-delta` scroll to or open the matching section in the SPA
- **BreadcrumbList** JSON-LD on detail pages
- **Optional analytics** — set `VITE_GA4_ID` and `VITE_GSC_VERIFICATION` in `.env` before `npm run build`

After deploying, submit `https://savannaexplorer.com/sitemap.xml` in [Google Search Console](https://search.google.com/search-console).

**Handoff docs for operators:** see `docs/ANTIGRAVITY-HANDOFF.md` and log progress in `docs/gsc-setup.md`.

### Book Direct index (v4.15+)

- **Passport visa helper** — pick your passport in Travel Tools; visa column, summary, and trip checklist personalize (v4.19)
- **Transport & logistics** hub at `#transport` — air gateways, regional flights, car hire, SIM/data, cross-border checklist (v4.18)
- **Stays & operators** hub at `#book-direct` — 46 official link-only directories (park camps, private concessions, regional tourism boards, licensed operators)
- SEO URLs: `/stays/sanparks-reservations`, `/operators/botswana-tourism-operators`, etc.
- Country Travelling tab shows per-country stay/operator links
- Sitemap grows automatically with each new listing (46 book-direct SEO pages at v4.17)

### Tables

| Table | Purpose |
|-------|---------|
| `experiences` | Marketplace inspiration listings (public read) |
| `site_messages` | Contact form submissions (corrections, feedback, partnerships) |
| `newsletter_subscribers` | Email signups |
| `ai_planner_events` | AI Safari Planner opens and generation attempts (anonymous insert) |
| `user_trips` | Owner-protected My Safari cloud copies, deletion tombstones, and revocable share tokens |
| `trip_collaborators` | Editor/viewer access accepted through private invitations |
| `trip_collaboration_invites` | Expiring single-use collaboration tokens |
| `trip_activity` | Recent collaboration changes and access events |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (port 5173) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
