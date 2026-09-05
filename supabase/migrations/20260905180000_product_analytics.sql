-- Anonymous, privacy-conscious product funnel events.
-- No trip IDs, user IDs, booking references, notes, emails or exact destinations.

create table if not exists public.product_events (
    id uuid primary key default gen_random_uuid(),
    event_type text not null check (event_type in (
        'route_match_completed', 'route_added_to_trip', 'trip_created',
        'trip_details_updated', 'readiness_task_added', 'readiness_task_completed',
        'booking_record_added', 'booking_status_updated', 'trip_share_created',
        'collaboration_invite_created', 'collaboration_invite_accepted',
        'newsletter_signup', 'client_error'
    )),
    page_type text not null check (char_length(page_type) between 1 and 50),
    source text check (source is null or char_length(source) between 1 and 40),
    status text check (status is null or char_length(status) between 1 and 40),
    item_type text check (item_type is null or char_length(item_type) between 1 and 40),
    country_count smallint check (country_count is null or country_count between 0 and 9),
    has_dates boolean,
    client text not null check (client in ('mobile', 'desktop', 'unknown')),
    app_version text not null check (char_length(app_version) between 1 and 24),
    created_at timestamptz not null default now()
);

create index if not exists product_events_created_at_idx on public.product_events (created_at desc);
create index if not exists product_events_event_type_idx on public.product_events (event_type, created_at desc);

alter table public.product_events enable row level security;

drop policy if exists "Anyone can log product events" on public.product_events;
create policy "Anyone can log product events"
    on public.product_events for insert to anon, authenticated
    with check (true);

revoke all on table public.product_events from anon, authenticated;
grant insert on table public.product_events to anon, authenticated;
