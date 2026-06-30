# Google Cloud — tumahelper-ai-dev

Operator reference for Savanna Explorer on the connected GCP project.

| Field | Value |
|-------|-------|
| Project ID | `tumahelper-ai-dev` |
| Account | `waluka.mubita@tumahelper.com` |
| Region | global |
| Site | https://savannaexplorer.com |

**Do not commit service account keys or API keys to this repo.**

---

## 1. Search Console auto-resubmit (do first)

Uses the Search Console API — **free**, no meaningful credit burn.

### On your machine (where `gcloud` is logged in)

```bash
chmod +x scripts/provision-gsc-gcp.sh
./scripts/provision-gsc-gcp.sh
```

This will:

1. Enable `searchconsole.googleapis.com` on `tumahelper-ai-dev`
2. Create service account `savannaexplorer-gsc@tumahelper-ai-dev.iam.gserviceaccount.com`
3. Download `./gsc-key.json` (gitignored)

### Manual GSC step (required once)

Add the service account email as **Owner** in [Search Console → Users](https://search.google.com/search-console).

### Store secret + verify

```bash
npm run setup:gsc -- --file ./gsc-key.json --github-secret
```

After that, every deploy and the **Submit search indexing** workflow resubmits the sitemap to Google.

---

## 2. Google Analytics 4 (free, not GCP-billed)

1. [analytics.google.com](https://analytics.google.com) → create property for `savannaexplorer.com`
2. Copy Measurement ID (`G-XXXXXXXXXX`)
3. GitHub secret: `VITE_GA4_ID`
4. Redeploy

---

## 3. Gemini API (content pipeline — low cost)

Good for drafting or refreshing country guides, planning guides, and meta descriptions from existing JSON.

1. GCP Console → **APIs & Services → Library** → enable **Generative Language API**
2. **Credentials → Create API key** (restrict to Generative Language API)
3. Store as GitHub secret `GEMINI_API_KEY` (future scripts — not wired yet)

Estimated cost at your scale: **$1–10/month** for batch content jobs.

---

## 4. Google Maps Platform (itinerary/park maps)

1. Enable **Maps JavaScript API** + **Directions API** (or **Static Maps** for cheaper previews)
2. Create API key; restrict to `savannaexplorer.com`
3. Maps has a **$200/month free credit** separate from the $300 trial

Use case: embedded route maps on itinerary pages instead of static Unsplash images.

---

## 5. Firebase Hosting (optional — replace Hostinger)

If SSH/rsync deploy becomes painful:

1. `firebase init hosting` in this repo
2. Deploy `dist/` after `npm run build`
3. Point DNS to Firebase

Static hosting cost on GCP is very low; $300 credit would last years at typical traffic.

---

## Credit expectations

| Service | Typical monthly cost |
|---------|---------------------|
| Search Console API | $0 |
| GA4 | $0 |
| Gemini (batch jobs) | $1–10 |
| Maps (moderate use) | $0 (free tier) |
| Firebase Hosting | $0–5 |
| Cloud Functions (optional) | $0 at your scale |

The $300 trial is far more than needed for SEO + analytics. Spend credits deliberately on **Maps** or **Gemini** when you want product upgrades, not on infrastructure you already have on Hostinger.

---

## Cloud agent note

Cursor’s verified GCP connection lives on your account. Cloud agents run in an isolated VM **without** your `gcloud` credentials. Run `provision-gsc-gcp.sh` locally, or paste the service account JSON into GitHub Secrets.
