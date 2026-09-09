# Savanna Explorer product cleanup plan

**Audit date:** 8 September 2026  
**Scope:** Remove obsolete or contradictory build while protecting the product strategy, traveller data, source evidence, public URLs and search equity.

## Product boundary

Savanna Explorer's core product is independent Southern Africa journey planning:

1. discover a country, park, experience or route;
2. test whether the trip is realistic;
3. turn it into an editable My Safari plan;
4. verify high-change logistics through dated sources;
5. take the plan offline or share it with trusted companions.

Features that do not strengthen this path should be removed, consolidated or moved out of the primary traveller experience.

## Audit evidence

- The repository contains 335 tracked working files and the production build transforms 220 modules.
- Source `index.html` is 189 KB and 2,653 lines. The SEO build prunes most hub pages, but a generated country page is still about 194 KB and contains the duplicate `travel-essentials` id twice.
- The global CSS build is 395 KB before gzip. The current layering includes 7,263 lines in `styles.css`, 2,505 lines in `redesign.css`, 960 `body.site-v2` override rules and 92 `!important` declarations across CSS.
- There are 187 public URLs: 9 country pages, 19 route pages, 30 border pages, 27 park pages, 63 stay/operator pages and 29 hubs. Removing a page without a traffic and redirect decision would create avoidable SEO risk.
- The obsolete marketplace datasets, seeding path, product-style AI cards, default ratings and luxury-first prompt were removed on 8 September 2026. The planner now uses reviewed route templates as optional planning anchors.
- The globally loaded chat assistant expects old JSON shapes (`countriesData.countries`, `bordersData.crossings`, and similar fields) that the current datasets do not expose, so much of its intended grounding context is empty.
- The homepage source still contains a ticker, generic fact cards, a plan-trip grid and a trust strip that are hidden or pruned rather than removed. `discover.js` still builds those hidden areas when only the FAQ is requested.
- The global `marked` CDN dependency was removed; AI output is escaped and rendered through a limited local Markdown renderer, and the planner loads on demand.
- The previous relay, nginx and VPS update paths were removed because production uses Vercel functions and Vercel Git deployment.
- README, SOURCES, About data and the fresh-install Supabase schema now reflect the independent route-planning product. Existing live database tables are intentionally left unchanged pending a separately reviewed forward migration.

## What must be protected

| Area | Decision | Reason |
| --- | --- | --- |
| Route Explorer and multi-country feasibility | Keep and deepen | This is the strongest differentiation and the shortest path from research to a workable trip. |
| My Safari, cloud sync, collaboration, readiness, bookings and trip packs | Keep | This is the retention product and holds traveller-created data. |
| Nine country guides, 19 routes, 30 borders and 27 parks | Keep | They form the researched knowledge and SEO foundation. Thin or duplicated passages can be edited without deleting the page family. |
| Editorial workspace, source evidence and freshness checks | Keep | Trust and maintainability are acquisition value, not back-office clutter. |
| Vercel API functions, observability, CI and deployment smoke tests | Keep | These are the live production path. |
| Permanent itinerary and corrected-border redirects | Keep | They protect bookmarks and search equity. |
| Legacy local-storage import in `trip-store.js` | Keep temporarily | Removing it would strand existing users' saved expenses, packing or AI drafts. Sunset only after a measured migration window. |
| Historical Supabase migrations | Keep immutable | Applied migrations are an audit trail. Future cleanup belongs in a new forward migration. |
| Book Direct and its existing profile URLs | Keep pending evidence | It supports the verify-and-book step. Review quality and traffic before consolidating any profile. |

## Removal and consolidation programme

### Phase 1 — Remove contradictions and indisputably dead build

This is the safest and highest-value slice.

1. [x] Replace the legacy AI marketplace context with reviewed route templates.
2. [x] Remove product cards, invented/default ratings, “REAL, verified” claims and luxury-first wording from the AI UI and API prompt.
3. [x] Lazy-load the AI planner only after a traveller opens it and replace the global `marked` dependency with a safe local renderer.
4. [x] Repair the floating assistant: build context server-side from current dataset shapes, reject injected history and origins, escape output, and load it only when opened.
5. [x] Delete the obsolete marketplace datasets after removing their AI and maintenance dependencies.
6. [x] Remove the hidden ticker, facts, plan-trip and old trust-strip markup, their dead `discover.js` rendering functions, unused `discover.json` content and selectors that become unreferenced.
7. [x] Remove the obsolete relay service, nginx deployment files and VPS-only update script after confirming Vercel is the production path.
8. [x] Update README, SOURCES, About data and the fresh-install Supabase schema so they describe the current product.

**Exit gate:** No public or internal surface can display the retired ratings/catalogue, no live bundle imports it, all tests/builds pass, and Vercel remains the only documented deployment path.

### Phase 2 — Give every planning tool one clear job

My Safari becomes the canonical planning workspace. Public tools remain only when they provide a useful no-sign-in entry point.

| Current overlap | Target decision |
| --- | --- |
| AI planner plus floating travel chat | One evidence-grounded assistant with itinerary and Q&A modes. |
| Static planning checklist plus printable trip planner plus My Safari trip pack | One Trip Pack flow. Keep a lean public checklist preview; save, customise and export inside My Safari. |
| Standalone packing generator, Travel Essentials packing tab, printable planner packing and My Safari packing | Keep the public generator as acquisition. All saved progress writes to the active My Safari trip. Other pages show concise guidance and link to it. |
| Cost estimator, expense route and My Safari budget summary | Keep the estimator as an indicative pre-trip tool and `/expenses` as a focused editor over the same active-trip data. Remove independent or duplicated state. |
| Country travel summaries and global planning hubs | Country pages provide contextual summaries; canonical tools own the full workflow and source maintenance. |
| `/plan` containing many large cards | Turn it into a clear planning dashboard grouped by Entry, Journey, Money, Health and On-the-road, with one primary action per job. |

Rename the country-page `travel-essentials` anchor to a unique country-scoped id so it cannot collide with the global Travel Essentials hub.

Progress on 8 September 2026:

- [x] Give country Travel Essentials its own stable `country-travel-essentials` anchor while retaining the global hub URL.
- [x] Retire the duplicated printable Trip Planner implementation and preserve its old anchor on a canonical My Safari Trip Pack entry card.
- [x] Turn the public planning checklist into a lean, ungated preview; trip-specific customisation and offline export now belong to My Safari.
- [x] Keep the packing generator as a no-sign-in preview, save progress only to the active My Safari trip, and retain legacy packing import for existing travellers.
- [x] Replace the duplicate Travel Essentials packing catalogue with concise principles and links to the canonical generator and My Safari.
- [x] Merge itinerary and Q&A into one lazy-loaded, evidence-grounded Savanna Guide with explicit modes and one shared accessible drawer.
- [x] Keep the cost estimator as a no-save indicative tool and make the expense editor operate only on the active My Safari trip, while retaining legacy expense import.
- [x] Restructure `/plan` into the five traveller jobs with one primary action per job.

**Exit gate:** Each traveller job has one canonical implementation, all secondary surfaces link into it, and no planning state is stored in two unrelated formats.

### Phase 3 — Remove the CSS and page-shell patchwork

Progress on 8 September 2026:

- [x] Give the Plan page family one shell stylesheet and remove its duplicate utility, navigation, toolbar and focused-route overrides from the legacy global stylesheets.
- [x] Replace decorative CSS gradients with a restrained solid-colour system while retaining accessible solid overlays on photography.
- [x] Establish shared type, spacing and control-alignment tokens, then apply readable minimums to the country, route, journey, Plan and My Safari working surfaces.

1. Freeze visual regression screenshots for the home, country, route, border, park, Plan and My Safari page families.
2. Extract shared components for header, page hero, trust/source card, filters, result cards, status notices, footer and modal/dialog treatment.
3. Move rules from `styles.css` and `redesign.css` into the relevant component/page-family files, using existing tokens as the contract.
4. Remove each old selector immediately after its markup has migrated; do not create a third override layer.
5. Split or prune the country page shell so a country route does not carry unrelated hub markup and duplicate ids.
6. Load page-family CSS where practical instead of shipping the complete 395 KB stylesheet to every route.
7. Replace inline presentation in the AI UI and other modules with component classes.

**Targets:** no duplicate ids, no route relying on hidden unrelated page sections, substantially fewer `site-v2` overrides and `!important` rules, and lower mobile CSS/HTML transfer without a framework rewrite.

### Phase 4 — Consolidate duplicated content data safely

Country information currently spans `countries.json`, `country-depth.json`, `country-quickfacts.json`, `country-weather.json`, `country-discovery.json`, `planning-guides.json` and several practical datasets. Much of that is useful, but repeated prose and facts increase maintenance risk.

1. Define a canonical country content schema with stable entity ids and explicit provenance for high-change facts.
2. Map every current field to canonical, derived, archive or delete.
3. Generate country cards, quick facts, guide summaries and search records from the canonical entity instead of copying text.
4. Preserve long-form editorial material only where it adds a distinct traveller decision or route insight.
5. Block unsourced high-risk claims from being promoted into current summaries.
6. Archive one-off enrichment scripts after their output and provenance are documented.

**Exit gate:** One fact has one maintained source of truth, derived views are reproducible, and deleting duplicate prose cannot erase unique research.

### Phase 5 — Clean the Supabase and operational surface

1. Stop the marketplace seed workflow and remove it from setup instructions.
2. Back up and measure the production `experiences` table before changing it.
3. Add a forward migration to revoke obsolete public access and later drop the table only when the replacement assistant no longer reads it and retention requirements are satisfied.
4. Move the deprecated root `supabase_schema.sql` and pre-current upgrade scripts into a clearly labelled historical archive, while leaving dated applied migrations untouched.
5. Replace old Hostinger/GCP handoff notes with one buyer-readable Vercel/Supabase operations runbook.
6. Remove local ignored `relay-function/node_modules` after the relay is formally retired.

**Exit gate:** A new maintainer can identify the live schema, deployment route, secrets, migrations and rollback process without reading obsolete infrastructure instructions.

## Safe deletion rules

- Do not delete a public page until Search Console, analytics and inbound links have been checked.
- Use a permanent redirect to the nearest equivalent traveller job for every retired URL.
- Do not remove a local-storage key until existing data has been imported or the migration window has elapsed.
- Do not edit an already-applied migration; add a new forward migration.
- Do not delete source evidence merely because the public wording was removed.
- Remove code in small vertical slices with unit tests, browser checks, accessibility checks and a production smoke test after each slice.

## Recommended execution order

1. **AI/catalogue contradiction cleanup** — highest trust risk and clear legacy scope.
2. **Dead homepage/source and old hosting removal** — low product risk, immediate maintainability win.
3. **Planning-tool consolidation** — largest user-experience improvement.
4. **Country shell and CSS consolidation** — largest technical/performance improvement.
5. **Canonical content model** — largest long-term editorial improvement.
6. **Database and documentation retirement** — complete after usage and backup checks.

The first implementation slice should be the AI/catalogue cleanup. It removes the clearest conflict with the product promise without touching traveller-created plans, public guide URLs or the new feasibility engine.
