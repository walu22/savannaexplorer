# Editorial freshness dashboard

The dashboard is an internal, read-only review queue for the site's highest-change facts. It is generated locally and is not published with the traveller-facing website.

Run:

```bash
npm run editorial:freshness
```

Open `.reports/editorial-freshness.html` in a browser. The matching JSON snapshot is written beside it for future CI, monitoring, or CMS integration.

Generate the companion approval and accountability view with:

```bash
npm run editorial:control
```

Open `.reports/editorial-control-centre.html`. It combines the same 93-record freshness queue with named ownership, an independent approver, publication state, correction blocking and a per-record history. The matching JSON snapshot is suitable for later CI or a protected CMS interface.

Workflow data lives in `data/editorial-workflow.json`. Its `people`, `assignments`, `corrections` and `events` arrays are intentionally empty at the first release: no person was invented from a workstation name or generic editorial label. Until real accountable people are added, existing evidence-backed public records appear as `published-unassigned` and fail the ownership and explicit-approval gates.

A record is publishable in the control model only when all six gates pass: official source, complete evidence, freshness, a named active owner plus a different named active approver, an approved or published decision, and no open correction. Approved and published assignments require an `approvedAt` date. Invalid people, record IDs, states or dates stop report generation rather than silently weakening the workflow.

The workflow schema uses:

- `people`: `id`, display `name`, operational `role`, and optional `active` flag;
- `assignments`: a tracked `recordId`, `ownerId`, optional `approverId`, workflow `status`, `updatedAt`, and `approvedAt` for approved or published work;
- `corrections`: unique `id`, `recordId`, named `ownerId`, status, summary, `openedAt`, and `closedAt` when resolved or rejected;
- `events`: unique `id`, `recordId`, event type, accountable `actorId` or explicit `actorName`, date and note.

Allowed assignment states are `draft`, `in-review`, `changes-requested`, `approved`, `published` and `blocked`. Corrections may be `open`, `investigating`, `resolved` or `rejected`. The owner and approver cannot be the same person.

Check the live health of all 18 country-advisory source links with:

```bash
npm run editorial:advisory-health
```

That command writes `.reports/advisory-health.json`. Production also runs the same check daily through the protected `/api/cron/advisory-health` Vercel Cron endpoint. A broken source, invalid source URL, missing review date or overdue human review makes the run fail so it is visible in Vercel logs and failed-run monitoring. Government sites that explicitly block or rate-limit the monitor are classified as `guarded`, not incorrectly reported as broken.

The automated check proves reachability only. It never advances `lastVerified`, edits public advice or treats an HTTP success as evidence that the authority's content has not changed. A human must read the official pages, record the finding in `data/editorial-review-evidence.json`, and deliberately update the country review date.

## First-slice coverage

- visa and entry summaries, including both the quick summary and passport matrix;
- border hours, fees, and requirements;
- park fees and gate information;
- emergency contact numbers;
- official travel-advisory links.

The dashboard uses a 30-day review cadence for travel-advisory links and a 90-day cadence for the other high-change categories. Travel advisories carry country-specific `lastVerified` dates so one review never advances untouched destinations. A record becomes `due-soon` during the final 30 days of its review window. The automated advisory monitor uses a narrower seven-day warning window for urgent operational alerts, while the dashboard keeps the full 30-day window for editorial planning. Month-only dates are treated as the final day of that month.

Review evidence is stored separately in `data/editorial-review-evidence.json`, keyed by the stable record IDs in the dashboard. A complete evidence record requires a reviewer, review date, outcome, written finding and valid HTTPS evidence links. Keeping evidence separate from traveller-facing copy makes the audit trail inspectable without bloating the public data.

Park reviews distinguish current exact tariffs, the latest official published tariff that still needs reconfirmation, and authorities that do not expose a dependable current public tariff. In the latter case, unsupported numeric estimates are removed from the public fee table rather than advanced with a new review date.

Visa reviews treat a passport group as a convenience filter, not a legal category. Where a combined EU/Schengen or SADC profile contains different nationality rules, the public result must require an exact-passport check rather than promote the most generous allowance to the whole group. Visa-free duration, arrival eligibility and application-channel claims need record-level authority evidence; a generic government homepage is not enough. Country pages and the interactive matrix must be updated together so they cannot contradict each other.

Border reviews use the usable overlap between both sides of a crossing rather than the latest closing time published by either country. When no dependable current authority schedule or live wait-time feed is available, the public record says to confirm directly; old operating hours, numeric wait ranges and vehicle-fee estimates are not advanced with a new review date. Opposite-side names are treated as one crossing, while renamed or corrected URL slugs retain permanent redirects.

The next control-plane increment should connect the validated workflow model to an authenticated editor interface, populate it with real accountable people, and extend source monitoring beyond travel advisories.
