# Savanna Explorer — Data Sources

This document records where practical travel data comes from and how we keep content original.

**Last reviewed:** March 2026

A visitor-facing summary also lives on the site at **About This Site** (`#about` / `#about-sources`).

## Editorial policy

- Descriptions, tips, and narratives are **written in our own words**.
- Facts (fees, phone numbers, visa categories, hours) are taken from **official or primary sources** and tagged with `lastVerified` and `sourceUrl` in JSON where possible.
- We **do not copy** text from commercial guidebooks or other tourism websites.
- Users must **confirm requirements before travel** — rules change frequently.

## Data files and sources

| File | Content | Primary sources |
|------|---------|-----------------|
| `data/practical.json` | Utility hub: currency, visa/health matrix, seasons, typical weather, emergencies | Government immigration portals; XE.com (currency reference); WHO / national health advisories (health summaries) |
| `data/health.json` | Malaria zones, yellow fever notes, regional health summaries | WHO malaria programme; national health ministries (reference) |
| `data/events.json` | Festivals, wildlife peaks, seasonal highlights | National tourism boards; public event calendars |
| `data/parks.json` | National park listings, fees, seasons | SANParks, Namibia Wildlife Resorts, Zimparks, Malawi Parks, etc. (`sourceUrl` per park) |
| `data/borders.json` | Border crossing practical info | National immigration and cross-border authority pages (`sourceUrl` per crossing) |
| `data/countries.json` | Country profiles, advice summaries | Original editorial copy informed by official tourism and immigration sites |
| `data/country-depth.json` | Extended country content | Original editorial copy; visa section cross-checked with immigration authorities |
| `data/faqs.json` | Per-country FAQs | Original answers based on official facts |
| `data/guides.json` | Seasons, packing, wildlife | Original editorial |
| `data/itineraries.json` | Route templates | Original editorial |
| `data/regions.json` | Per-country regional breakdowns for country guides | Original editorial informed by official tourism boards |
| `data/marketplace.json` | Curated experience listings | Original editorial; representative pricing tiers |
| `data/image-catalog.json` | Verified Unsplash stock photo IDs | [Unsplash License](https://unsplash.com/license) — free for commercial use with attribution appreciated |
| `data/discover.json` | Homepage facts, news, guides | Original editorial; news items should cite policy changes, not reproduce press releases |
| `data/cross-border.json` | KAZA UniVisa, COMESA Yellow Card, IDP, border fees | Zambia Immigration, COMESA Yellow Card, AA South Africa |
| `data/on-the-ground.json` | Cash, fuel, power, plugs per country | Original editorial informed by tourism boards and utility updates |
| `data/wildlife-calendar.json` | Seasonal wildlife & nature highlights | Original editorial; park authority seasonal guidance |
| `data/itinerary-budgets.json` | Line-item indicative budgets per route template | Original editorial; park fee references from `parks.json` |
| `data/planning-guides.json` | Full country planning guides (read/print) | Original editorial; immigration URLs per country |
| `data/tourism-stats.json` | International arrival context by country | National statistics offices & tourism authorities |
| `data/expense-tracker.json` | Trip expense tracker categories & config | Original editorial |
| `data/itinerary-maps.json` | Google Maps waypoints per route template | Original editorial; Google Maps links |

## Visa & entry (high-change items)

| Country | Official source | Notes |
|---------|-----------------|-------|
| Namibia | https://mha.gov.na | New visa regime from **1 April 2025** — e-visa / visa-on-arrival for many non-reciprocal nationals |
| South Africa | https://www.dha.gov.za | Visa exemption lists updated periodically |
| Botswana | https://www.gov.bw | |
| Zambia | https://www.zambiaimmigration.gov.zm | KAZA UniVisa for Victoria Falls circuit |
| Zimbabwe | https://www.evisa.gov.zw | |
| Mozambique | https://www.evisa.gov.mz | |
| Malawi | https://www.immigration.gov.mw | |
| Lesotho | https://homeaffairs.gov.ls | |
| Eswatini | https://www.gov.sz | |

## Park fees

| Country | Authority |
|---------|-----------|
| South Africa | https://www.sanparks.org/ |
| Namibia | https://www.nwr.com.na/ |
| Botswana | Department of Wildlife & National Parks |
| Zambia | https://www.znp.co.zm/ |
| Zimbabwe | https://www.zimparks.org/ |
| Mozambique | https://www.anac.gov.mz/ |
| Malawi | https://www.malawiparks.org/ |
| Lesotho | https://www.forestry.gov.ls/ |
| Eswatini | https://www.biggameparks.org/ |

## Statistics (Phase 2 — live on site)

| Topic | Source | On-site |
|-------|--------|---------|
| South Africa arrivals | Statistics South Africa / tourism.gov.za | `#tourism-stats` |
| Namibia tourism research | Namibia Tourist Statistical Report | `#tourism-stats` |
| Botswana arrivals | https://statsbots.org.bw/tourism | `#tourism-stats` |
| Regional estimates | National tourism boards | `data/tourism-stats.json` |

Legacy reference table:

| Topic | Source |
|-------|--------|
| South Africa arrivals | Statistics South Africa (Tourism & Migration) |
| Namibia tourism research | https://visitnamibia.com.na/research-center/ |
| Botswana arrivals | https://statsbots.org.bw/tourism |

## Images

Savanna Explorer uses **free stock photography** served from the Unsplash CDN. We do not scrape images from tourism board websites.

### Where to download free Southern Africa tourism photos

| Source | Search / browse | License |
|--------|-----------------|---------|
| **[Unsplash](https://unsplash.com/s/photos/southern-africa)** | [Safari](https://unsplash.com/s/photos/safari-africa), [Victoria Falls](https://unsplash.com/s/photos/victoria-falls), [Cape Town](https://unsplash.com/s/photos/cape-town) | [Unsplash License](https://unsplash.com/license) — free commercial use, attribution appreciated |
| **[Pexels](https://www.pexels.com/search/southern%20africa/)** | Country + activity keywords | [Pexels License](https://www.pexels.com/license/) — free commercial use |
| **[Pixabay](https://pixabay.com/images/search/southern%20africa/)** | Landscapes, wildlife, cities | [Pixabay License](https://pixabay.com/service/license/) |
| **[Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:Tourism_in_Southern_Africa)** | Landmarks, parks, heritage | Per-file (often CC BY-SA — credit required) |
| **[South Africa Tourism media](https://www.southafrica.net/media)** | Official SA campaigns | Media-kit terms (register for use) |

National tourism boards (Namibia, Botswana, etc.) sometimes offer press galleries — always check their terms before hotlinking or downloading.

### How this site applies images

1. Add the Unsplash photo ID (`timestamp-hash` from the image URL) to `data/image-catalog.json`.
2. Map the catalog key in `scripts/apply-stock-images.mjs` (country cards, spots, homepage slots, etc.).
3. Run `npm run verify:images` to confirm every ID returns HTTP 200.
4. Run `npm run seed:images` to propagate across JSON data, `country-meta.js`, `images.js`, `index.html`, and `supabase/seed.sql`.

Homepage hero and “Top Experiences” cards use `data-stock-image` slots wired to the catalog. Country guides, discover grid, itineraries, and marketplace pull from the same catalog.

Attribution notes for select photos live in `data/image-catalog.json` → `attribution`. Credit is appreciated under the Unsplash License but is not required.

### Maintenance

| Task | Command / frequency |
|------|---------------------|
| Verify all catalog URLs | `npm run verify:images` — before deploy or after adding IDs |
| Re-apply images sitewide | `npm run seed:images` |
| Replace a broken Unsplash ID | Update catalog → verify → seed |

## Maintenance schedule

| Data type | Suggested review |
|-----------|------------------|
| Visa / entry | Quarterly |
| Park fees | Annually (or when authorities publish changes) |
| Border hours / fees | Annually |
| Health zones | Annually |
| Events calendar | Annually (before each travel season) |
| Currency rates | Monthly (planning approximations only) |
| Emergency numbers | Annually |

## Supabase (hub mode v4.11+)

Backend tables align with the independent planning hub — no booking or WhatsApp inquiry tracking.

| Table | Purpose |
|-------|---------|
| `site_messages` | Contact form (corrections, feedback, partnerships) |
| `experiences` | Marketplace inspiration (public read) |
| `newsletter_subscribers` | Email signups |

Schema: `supabase/schema.sql`. Upgrading from pre-v4.11: run `supabase/migrate-phase-e.sql`.

## Reporting issues

If you find outdated or incorrect information, note the page, field, and a link to the official source so we can update `lastVerified` and the content.
