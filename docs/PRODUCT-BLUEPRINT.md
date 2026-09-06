# Savanna Explorer Product Blueprint

**Status:** Working product strategy  
**Baseline date:** 5 September 2026  
**Product baseline:** v4.60.1 observability increment, building from readiness baseline `719780c`

**Scope:** Build an acquisition-ready tourism product, beginning with independent travel in Southern Africa.

## 1. The honest ambition

Savanna Explorer should aim to become the world's most trusted and useful independent Southern Africa trip-planning product before it tries to become the broadest tourism website.

“Best” will mean that a traveller can confidently move from inspiration to a usable, verified and offline-ready trip plan with less uncertainty than on any competing product. It will be measured through traveller outcomes, trust, repeat use, performance and commercial traction—not page count or feature count.

The strategic wedge is unusually strong:

- Southern Africa road trips have complicated borders, permits, road conditions, fuel gaps, health decisions and park logistics.
- Generic global planners organise places but rarely solve these regional operational details.
- Traditional guide sites provide information but usually do not turn it into a live, personal plan.
- Tour marketplaces focus on packaged tours and operator enquiries rather than independent travel.

Savanna Explorer can own the space between inspiration, authoritative regional guidance and a practical personal trip workspace.

## 2. What exists today

This baseline describes the repository, not an assumption that every change is already deployed to production.

| Area | Status | Current evidence | Principal gap |
|---|---|---|---|
| Destination coverage | Built | Nine countries with country, regional, attraction, activity and practical content | Uneven depth outside the strongest countries; no expert bylines |
| Routes | Built | 19 curated routes with editable route templates and reviewed logistics | More field verification, alternatives and disruption handling |
| Parks and borders | Built | 27 park records and 30 unique border guides | Automated link checks and live disruption signals |
| Search presence | Built, improving | 203 sitemap URLs, prerendered pages, canonical metadata and JSON-LD | Search Console operating cadence, stronger internal linking and query-led improvements |
| My Safari | Built, improving | Local/cloud trips, route editor, collaboration, readiness, personal tasks and booking records | Reminders, document vault, reservation import, expense splitting and offline trip packs |
| AI planning | Built, guarded | Itinerary generation, input safeguards, rate limiting and analytics events | Verified retrieval with citations, evaluation suite and confidence handling |
| Direct booking discovery | Built | 46 official link-only directories; no payment handling | Verified operator profiles, availability signals and transparent commercial model |
| Offline capability | Partial | Installable PWA shell and network-first cache | Selectable destination/trip downloads, offline maps and reliable cache lifecycle |
| Analytics | Built in code; production activation pending | Privacy-safe product event taxonomy, aggregate report, Vercel Web Analytics/Speed Insights integration, client failures and structured API logs | Enable production services, publish privacy/retention terms, collect four-week baseline and add retention cohorts |
| Editorial operations | Partial, improving | Central 93-record queue, six-gate approval model, correction/history ledger and daily protected monitoring for 18 official advisory links | Authenticated editor UI, real staff assignments and monitoring for remaining source classes |
| Accessibility/testing | Strong foundation | 91 unit tests, 78 desktop/mobile browser scenarios and automated axe checks | WCAG 2.2 manual audit and permanent regression budget |
| Security/privacy | Partial | Supabase RLS, tested collaboration permissions and API validation | CSP/security headers, privacy controls, data export/deletion and formal incident process |
| Revenue | Not built | No tours, payments or paid placement | Evidence-led revenue experiments with clear editorial separation |
| Community/reviews | Not built | No traveller review or moderation system | Only pursue after identity, moderation and fraud controls exist |
| Content administration | Not built | JSON and SQL are maintained through the repository | Editorial CMS/control plane with roles, audit history and preview |

## 3. Product principles

1. **Solve the journey, not the click.** Every feature must reduce uncertainty or effort for a real traveller.
2. **Trust is the product.** Entry, health, safety, border, park and fee information must show its source, review date and limits.
3. **Human-reviewed regional depth beats automated breadth.** Do not create thin country pages to manufacture search traffic.
4. **Mobile and unreliable connectivity are default conditions.** Core planning and saved-trip information must remain useful on a modest phone and poor connection.
5. **Planning remains independent.** Recommendations, sponsorships and commercial links must be visibly separated from editorial judgement.
6. **AI assists; verified data decides.** AI must use the site's curated knowledge, cite it and admit when current information is unavailable.
7. **No invisible progress.** Every investment must connect to an outcome metric, quality gate or operational risk reduction.
8. **Build portable value.** Data provenance, documentation, contracts, analytics and clean infrastructure are part of the acquisition asset.

## 4. Target experience and information architecture

### Global navigation

- **Explore:** countries, regions, parks, places, experiences and seasonal inspiration.
- **Routes:** route matcher, route comparison, interactive maps and cross-border circuits.
- **Plan:** visa/entry, borders, health, transport, stays, permits, cost estimator and packing.
- **My Safari:** saved trips, itinerary, bookings, documents, budget, travellers, tasks and offline pack.
- **On the road:** offline route, emergency contacts, phrasebook, border/park notes, fuel anchors and updates.
- **About & trust:** authors, experts, editorial method, source register, corrections, partner policy and disclosures.

### Page families

Every public page should belong to a documented family with a consistent header, hierarchy, actions and trust treatment:

1. Country overview
2. Region or destination guide
3. Park/reserve guide
4. Route guide
5. Border guide
6. Practical planning guide
7. Experience/activity guide
8. Verified provider or official-directory profile
9. Editorial/story page
10. Personal My Safari workspace

### Universal capabilities

- Fast global search with country, place, route, park, border and guide results.
- Save-to-trip on every relevant entity.
- Visible last-reviewed date, author/reviewer and source trail where decisions carry risk.
- Consistent maps, comparison and “what to do next” actions.
- Shareable URLs and printable/offline equivalents.
- Helpful empty, loading, offline and failure states.

## 5. The product workstreams

### A. Trust and editorial control plane

Create a single content model for every high-change fact:

- value and unit;
- country/jurisdiction;
- primary source URL;
- reviewed date, reviewer and review evidence;
- expiry/review frequency;
- confidence and risk class;
- change history;
- traveller-facing disclaimer;
- publication state.

Build an internal editorial dashboard that shows overdue facts, broken sources, upcoming events, unresolved corrections and pages without adequate provenance. High-risk records—entry, health, safety, border status, emergency numbers and fees—must never silently appear current.

**Implemented foundation (v4.69):** the 93-record freshness model, daily advisory-source monitor, six publication gates, authenticated `/editorial` workspace, explicit Supabase member allowlist, owner/approver separation, correction lifecycle and append-only workflow audit events. Production activation still requires applying the migration, adding real accountable members and exercising the RLS policies against the linked Supabase project.

Add public author/reviewer profiles and a transparent correction log. Recruit country-based contributors under written agreements that assign or license usable rights to Savanna Explorer.

### B. Best-in-class discovery

- Replace browsing dead ends with entity-based search and cross-links.
- Let travellers compare countries, routes, parks and seasons around a specific month, budget, vehicle and interest.
- Build a “Where should I go?” matcher that explains every recommendation.
- Turn maps into a primary exploration surface without forcing them to load before they are useful.
- Add saved shortlists and recently viewed items.
- Make seasonal limitations and accessibility needs first-class filters.

### C. My Safari planning operating system

The trip workspace becomes the main retention product:

- Editable trip, travellers, dates, destinations and day-by-day route.
- Personal tasks, intelligent deadlines and readiness risks.
- Structured stays, transport, activities and permit records.
- Confirmation-email import with explicit consent and manual correction.
- Attachments or secure links for travel documents; never expose them through public trip links.
- Shared expenses, balances and settlement export.
- Real-time collaboration, comments and change history.
- Calendar export and reminder delivery controls.
- One-click printable and offline trip pack.
- During-trip mode with today's plan, next drive, offline contacts and critical alerts.

### D. Regional logistics moat

Deepen the data generic planners do not maintain:

- road surface and vehicle suitability by segment;
- seasonal accessibility and realistic driving windows;
- fuel, food, medical and cash anchors;
- border documents, operating hours and typical crossing considerations;
- park gates, permit rules, booking windows and conservation fees;
- safe overnight anchors and no-drive-after-dark guidance;
- mobile connectivity and offline risk;
- alternative route and disruption notes.

Every route claim should distinguish official fact, editorial judgement and map estimate.

### E. AI that can be trusted

- Retrieve from the reviewed Savanna Explorer knowledge base instead of relying on model memory.
- Cite the exact source and review date behind high-risk answers.
- Separate inspiration from requirements and refuse unsupported certainty.
- Generate itinerary changes as structured proposals that the traveller accepts into My Safari.
- Add regression evaluations for unsafe routing, invented requirements, stale fees, impossible pacing and prompt injection.
- Track cost, latency, completion and correction rates per generation.
- Provide a non-AI path for every critical planning job.

### F. Offline and on-trip reliability

- Let the traveller download one trip or country rather than caching the whole site accidentally.
- Cache a versioned manifest of required pages, maps, contacts, phrases and itinerary data.
- Show download size, last refresh time and stale-data warnings.
- Queue safe edits while offline and resolve sync conflicts visibly.
- Offer low-bandwidth and reduced-image modes.
- Test loss of connectivity in automated browser flows.

### G. Responsible marketplace and revenue

Do not become a full booking marketplace prematurely. Progress through controlled stages:

1. **Free planning hub:** audience, newsletter and saved trips.
2. **Transparent referral links:** relevant partners only, disclosed at link and page level, with editorial ranking untouched.
3. **Premium planner:** optional paid features such as advanced offline packs, document organisation, group expense tools and specialist route packs; retain a genuinely useful free core.
4. **Verified operator leads:** only after licence checks, response standards, complaints handling, ranking disclosures and partner agreements exist.
5. **B2B data/licensing:** structured route and destination data, widgets or planning tools for tourism boards and travel businesses.
6. **Booking/payment layer:** only after legal, tax, consumer-protection, refund, fraud and support obligations are fully designed.

Never publish paid rankings disguised as editorial recommendations. Do not build traveller reviews until identity, proof-of-experience, moderation, appeals and fraud detection are funded and operational.

### H. Growth, brand and community

- Define query clusters from Search Console evidence, not intuition.
- Build original field guides, route comparisons and answer pages that finish the traveller's task.
- Create an email lifecycle: inspiration → saved route → readiness prompts → pre-departure checks → post-trip feedback.
- Establish a recognisable visual and editorial voice with original photography and local expertise over time.
- Form data/content partnerships with tourism authorities, parks and credible regional experts.
- Build shareable trip summaries and collaborative planning as organic acquisition loops.
- Expand languages only after analytics identifies meaningful demand and the review operation can maintain every translation.

## 6. Design standard

The interface should feel calm, assured and distinctively Southern African—not like a generic booking template.

- Maintain a documented token system for colour, type, spacing, elevation, motion and state.
- Use one global header pattern and one predictable mobile navigation pattern.
- Give each page one dominant user job and one primary action.
- Use photography as evidence and atmosphere, with proper rights, credit records, focal points and responsive sizes.
- Keep long country pages navigable with a sticky section index, reading progress and meaningful summaries.
- Design maps, tables and comparison tools for keyboard, touch and screen-reader use.
- Meet WCAG 2.2 AA as a release requirement, backed by automated and scheduled manual audits.
- Respect reduced motion, zoom, high contrast, language direction and 44px-class touch comfort.

## 7. Engineering and operational standard

The current Vite/Supabase/Vercel architecture is adequate for the next stage. A framework rewrite is not a milestone. Revisit architecture only when measured scaling, editorial preview or server-rendering requirements justify the cost.

### Required engineering work

- Add real-user Core Web Vitals monitoring and page-family performance budgets.
- Target p75 LCP at or below 2.5s, INP at or below 200ms and CLS at or below 0.1 on mobile and desktop.
- Add Content Security Policy and appropriate security/privacy headers.
- Inventory dependencies, secrets, Supabase policies and public API abuse controls.
- Separate domain logic from rendering, with schemas and migrations for durable trip data.
- Add preview deployments, smoke tests and rollback instructions for every production release.
- Test critical flows against offline mode, failed APIs, old local data and cloud-sync conflicts.
- Create backups and test restoration for production data.
- Track client errors, API errors, AI failures and sync failures without collecting unnecessary personal data.
- Keep an architecture decision log and buyer-readable operational runbooks.

### Definition of done

A major feature is complete only when it has:

1. A defined traveller outcome and analytics event.
2. Desktop, mobile, keyboard and screen-reader consideration.
3. Unit tests for business rules and browser tests for the main flow.
4. Empty, loading, error and offline states where applicable.
5. Security and privacy review proportional to its data.
6. Content/source ownership and review rules.
7. Performance impact checked against budget.
8. Documentation, version bump and clean commit.
9. Staged verification before production promotion.
10. A post-release metric and review date.

## 8. Measurement system

First record a trustworthy four-week baseline. Targets should then be set from evidence instead of invented numbers.

### North-star outcome

**Activated travel plans:** trips in which a traveller saves a route or destination, sets dates and completes at least three meaningful planning actions.

### Supporting metrics

| Dimension | Metrics |
|---|---|
| Discovery | Search impressions/clicks, non-brand queries, landing engagement, internal-search success |
| Activation | Route-to-trip conversion, first saved item, dates set, first booking/task added |
| Retention | Return within 7/30 days, trips with a second session, collaboration invitations accepted |
| Planning value | Readiness progress, itinerary completion, offline pack downloads, booking records confirmed |
| Trust | High-risk facts in date, primary-source coverage, correction time, broken-source count |
| Quality | p75 Core Web Vitals, error-free sessions, failed sync rate, accessibility regressions |
| Growth | Subscriber conversion, useful email engagement, shared-trip acquisition, returning organic users |
| Commercial | Qualified referral clicks, premium trial/conversion, revenue per activated trip, refund/support rate |

Analytics must exclude passports, booking references, private notes, document contents and precise itinerary data unless the user has given informed, purpose-specific consent.

## 9. Delivery roadmap

Durations are working ranges, not promises. Each phase advances only when its exit gate is met.

### Phase 0 — Measurement and risk baseline (2–4 weeks)

- Implement consent-aware event taxonomy across discovery and My Safari.
- Add real-user performance and client/API error monitoring.
- Run a site-wide accessibility, performance, security-header, broken-link and content-freshness audit.
- Create KPI, content-risk and release dashboards.
- Fix stale operator documentation and formalise backup/rollback checks.

**Exit gate:** We can measure the full route-discovery-to-trip-activation funnel and see production quality failures.

### Phase 1 — Planner completion (4–8 weeks)

- Finish reminders and deadline controls on the newly structured readiness data.
- Add booking editing, richer transport/stay fields and calendar export.
- Add traveller roles, comments, expense splitting and conflict-safe collaboration.
- Build private document-link storage and a printable/offline trip pack.
- Redesign My Safari navigation so long plans remain manageable on mobile.

**Exit gate:** A real cross-border trip can be planned, shared, checked and taken offline without another planning application.

### Phase 2 — Trust control plane (6–10 weeks, overlaps Phase 1)

- Define content schemas and risk classes.
- Build editorial dashboard, source monitoring, expiry queue and correction workflow.
- Add author/reviewer profiles and on-page provenance.
- Audit all high-risk facts; block or label records that cannot be verified.
- Add local expert/contributor workflow and rights agreements.

**Exit gate:** Every published high-risk fact has an owner, current primary source, review date and visible status.

### Phase 3 — Discovery and design system (6–10 weeks)

- Implement global entity search and intent-based navigation.
- Consolidate design tokens/components and page-family templates.
- Improve home, route, country, park and border journeys around clear next actions.
- Build explainable “where/when/which route” matching and saved shortlists.
- Complete image rights/performance pipeline and manual WCAG 2.2 AA audit.

**Exit gate:** Travellers can reach the right country/route/planning answer quickly on mobile, and every major page family passes the quality bar.

### Phase 4 — On-trip product (6–10 weeks)

- Selectable offline country and trip packs.
- Today view, next-drive information, emergency contacts and phrase shortcuts.
- Stale-data prompts and reconnection/sync behaviour.
- Low-bandwidth mode and field testing on modest Android devices.

**Exit gate:** The product remains genuinely useful during a trip with intermittent connectivity.

### Phase 5 — Growth and revenue validation (8–12 weeks)

- Run measured referral and premium-planner experiments.
- Build newsletter lifecycle and post-trip feedback loop.
- Pilot verified profiles with a small number of licensed, high-quality providers.
- Publish ranking, partner, affiliate and complaints policies before monetised discovery.
- Develop B2B data/widget prototypes for tourism partners.

**Exit gate:** At least one revenue model shows repeatable demand without reducing traveller trust or editorial independence.

### Phase 6 — Expansion and acquisition readiness (ongoing)

- Deepen existing nine-country coverage before adding countries.
- Expand only where the content operation can meet the same safety and freshness standard.
- Complete IP register, licence evidence, contracts, privacy records, financial reporting and data-room documentation.
- Reduce founder-only operational knowledge with documented owners and runbooks.
- Maintain cohort, traffic, revenue, uptime and content-quality history suitable for diligence.

**Exit gate:** The business can operate reliably without undocumented knowledge, and a buyer can verify its audience, assets, risks and economics.

## 10. The next four delivery increments

1. **Product observability (implementation and activation complete; baseline in progress):** production analytics, performance telemetry, structured errors and privacy-safe product events are live; record the first four-week baseline next.
2. **Editorial control centre (validated workflow model implemented):** visa, border, park fee, emergency and travel-advisory data feed a 93-record review queue with official-source evidence. The local control centre now enforces six publication gates, separate owner and approver roles, corrections and record history; its deliberately empty people register exposes all 93 legacy records as ownership gaps instead of inventing staff. A protected daily Vercel Cron checks all 18 advisory links without auto-advancing human review dates. Add an authenticated editor UI, real assignments and automated checks for the remaining source classes next.
3. **My Safari trip pack:** calendar export, booking edit, reminders and printable/offline plan.
4. **Global search and unified navigation:** search all countries, regions, parks, routes, borders and guides from one fast interface.

These four increments create the feedback loop, trust moat, retention product and discovery layer needed before responsible monetisation.

## 11. Acquisition-readiness checklist

- Registered brand/domain ownership and documented trademarks where worthwhile.
- Complete repository, infrastructure and vendor ownership under the selling entity.
- Contributor, photo, map, font, data and AI-model rights register.
- Privacy policy, terms, cookie/analytics consent, data retention and account deletion/export.
- No secrets in source control; reviewed RLS/API permissions and incident history.
- Monthly product, cohort, search and revenue reporting with definitions.
- Editorial manuals, source standards, contributor agreements and correction records.
- Tested backups, recovery, deployments, monitoring and support procedures.
- Clear separation of editorial, affiliate, sponsored and user-generated content.
- Financial model showing acquisition channels, gross margin, infrastructure/AI cost and concentration risk.

## 12. What we will deliberately avoid

- Mass-producing thin country or attraction pages.
- Expanding outside Southern Africa before the current data is consistently maintainable.
- Claiming live availability, safety or legal certainty without a reliable source.
- Fake, imported or weakly moderated reviews.
- Paid rankings hidden as recommendations.
- Storing sensitive traveller documents in public trip JSON or share links.
- A large framework rewrite without a measured product or operational benefit.
- Building a payment/booking business before its legal and support obligations are understood.
- Calling the product “best” without traveller outcomes and independent evidence.

## 13. Reference standards and competitive signals

- Google Search Central, [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- Google Search Central, [Structured data introduction](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- Google Search Central, [Using Search Console and Google Analytics together](https://developers.google.com/search/docs/monitor-debug/google-analytics-search-console)
- web.dev, [Core Web Vitals](https://web.dev/articles/vitals)
- W3C, [Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/)
- Wanderlog, [trip-planning feature overview](https://wanderlog.com/pages/help-center)
- SafariBookings, [content quality and transparency](https://www.safaribookings.com/tour-quality-and-transparency)
- SafariBookings, [review verification approach](https://www.safaribookings.com/genuine-reviews)

This blueprint must be reviewed quarterly. Completed capabilities move into the baseline; new work remains explicitly labelled as planned until it is tested and released.
