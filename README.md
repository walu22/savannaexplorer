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

Then open **http://localhost:5173** in your browser (not port 3000 or 5500).

Use a hard refresh if the page looks stale: **Ctrl + Shift + R**

### Verify you have the latest build

After the page loads, scroll to the footer. You should see **v3.1.0** next to the copyright line.

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

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (port 5173) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
