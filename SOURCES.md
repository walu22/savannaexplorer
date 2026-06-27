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

## Statistics (for future Phase 2 use)

| Topic | Source |
|-------|--------|
| South Africa arrivals | Statistics South Africa (Tourism & Migration) |
| Namibia tourism research | https://visitnamibia.com.na/research-center/ |
| Botswana arrivals | https://statsbots.org.bw/tourism |

## Images

- Destination imagery uses **Unsplash** photo IDs referenced in JSON — not scraped from tourism board sites.

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

## Reporting issues

If you find outdated or incorrect information, note the page, field, and a link to the official source so we can update `lastVerified` and the content.
