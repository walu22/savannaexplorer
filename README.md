# Savanna Explorer

Southern Africa tourism guide — country pages, itineraries, parks, and trip planning.

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

After the page loads, scroll to the footer. You should see **v4.3.0** next to the copyright line.

You should also have these files/folders (not the old flat layout):

- `data/guides.json`, `data/itineraries.json`, `data/countries.json`
- `js/app.js`, `js/modules/`
- `package.json` with a `"dev": "vite"` script

The old root files `main.js`, `country-guide.js`, and `itinerary-data.js` were removed in the refactor.

### What to look for

- Country detail pages with tabs: **About**, **Travelling**, **Attractions**, **Activities**, **Routes**
- **Itineraries** section with **View Route** buttons and route maps in the detail modal
- **Contact** section (`#contact`) with quotation form
- Enriched guides for Zambia, Zimbabwe, Mozambique, Malawi, Lesotho, and Eswatini

### Production build

```powershell
npm run build
npm run preview
```

Preview runs at **http://localhost:4173** by default.

## Supabase (optional backend)

The site works offline with local JSON data. Connect **Supabase** to store marketplace listings, quotation requests, newsletter signups, and WhatsApp inquiry tracking.

### Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env` and add your project URL and anon key (Dashboard → **Project Settings** → **API**)
3. In the Supabase **SQL Editor**, run:
   - `supabase/schema.sql` — creates tables and row-level security policies
   - `supabase/seed.sql` — loads marketplace experiences
4. Restart the dev server: `npm run dev`

Without `.env`, forms fall back to **mailto** and marketplace data loads from `data/marketplace.json`.

### Tables

| Table | Purpose |
|-------|---------|
| `experiences` | Marketplace tours (public read) |
| `inquiries` | WhatsApp inquiry tracking |
| `quotations` | Contact / quote form submissions |
| `newsletter_subscribers` | Email signups |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (port 5173) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
