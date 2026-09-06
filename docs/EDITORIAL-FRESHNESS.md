# Editorial freshness dashboard

The dashboard is an internal, read-only review queue for the site's highest-change facts. It is generated locally and is not published with the traveller-facing website.

Run:

```bash
npm run editorial:freshness
```

Open `.reports/editorial-freshness.html` in a browser. The matching JSON snapshot is written beside it for future CI, monitoring, or CMS integration.

## First-slice coverage

- visa and entry summaries, including both the quick summary and passport matrix;
- border hours, fees, and requirements;
- park fees and gate information;
- emergency contact numbers;
- official travel-advisory links.

The dashboard uses a 30-day review cadence for travel-advisory links and a 90-day cadence for the other high-change categories. A record becomes `due-soon` during the final 30 days of its review window. Month-only dates are treated as the final day of that month.

This first version deliberately exposes duplicated or stale datasets instead of merging them silently. A later control-plane increment should add named reviewers, captured evidence, publication states, correction ownership, change history, and automated source-link checks.
