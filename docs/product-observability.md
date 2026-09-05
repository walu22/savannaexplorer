# Product observability

Savanna Explorer v4.60 introduces a privacy-conscious measurement foundation for product decisions, production performance and incident diagnosis.

## What is measured

The browser records only approved event names and coarse dimensions. It never sends trip names, traveller identities, email addresses, booking references, private notes, share/invitation tokens, document contents or exact itinerary data.

| Event | Meaning |
|---|---|
| `route_match_completed` | A traveller completes the route matcher |
| `route_added_to_trip` | A curated route becomes an editable My Safari trip |
| `trip_created` | A trip is created directly or from a country experience |
| `trip_details_updated` | Dates, destinations or traveller count are saved |
| `readiness_task_added` | A personal readiness task is added |
| `readiness_task_completed` | A readiness check is completed or reopened |
| `booking_record_added` | A coarse booking category is added |
| `booking_status_updated` | A booking moves between planned, reserved and confirmed |
| `trip_share_created` | A read-only trip link is enabled |
| `collaboration_invite_created` | An editor or viewer invitation is created |
| `collaboration_invite_accepted` | A private invitation is accepted |
| `newsletter_signup` | A new Supabase newsletter subscription succeeds |
| `client_error` | A deduplicated runtime, resource, network or chunk-load failure occurs |

Allowed dimensions are page type, action source, coarse status/category, number of countries (capped at nine), whether dates exist, mobile/desktop and app version. Analytics URLs keep only validated UTM values and remove fragments plus all other query parameters.

## Delivery channels

- Vercel Web Analytics records page views and the public event name with at most two coarse properties.
- Vercel Speed Insights records real-user Core Web Vitals on the production domain.
- Supabase `product_events` stores the fuller approved aggregate event row for internal reporting.
- Vercel Function logs use one-line structured JSON for request start, completion and failure without request bodies or personal details.
- Optional GA4 receives the same restricted event name and public properties when `VITE_GA4_ID` is configured.

Vercel and Supabase delivery run only on `savannaexplorer.com` and `www.savannaexplorer.com`. Local and preview use can still emit the in-browser `savanna:product-event` event for automated tests, but no analytics request is sent.

## Production activation

1. In the Supabase SQL Editor, run `supabase/migrations/20260905180000_product_analytics.sql`.
2. In the Vercel project, enable Web Analytics and Speed Insights.
3. Deploy the production build.
4. Perform one route-match-to-trip flow, then verify the Vercel dashboards and `product_events` rows.
5. Add the measurement description and retention period to the public privacy policy before relying on the data operationally.

No public role can read `product_events`; anonymous and authenticated clients can only insert rows that satisfy the table constraints. Reporting requires the server-only `SUPABASE_SERVICE_ROLE_KEY`.

## Reporting

```powershell
npm run analytics:product
npm run analytics:product -- --days 90
```

The report shows action volumes, entry sources, page/client mix, errors and app versions. Its ratios are aggregate action-volume ratios—not unique-user conversion or cohort retention. Vercel Web Analytics remains the source for privacy-preserving visitor and page metrics.

## Release review

After four weeks of production data, review:

- route-match to route-add action ratio;
- trip creations with dates and multiple destinations;
- use of readiness, booking, sharing and collaboration actions;
- client errors by category, page type and app version;
- Core Web Vitals by route family and device.

Set improvement targets from this baseline. Do not invent targets before the production sample is stable.
