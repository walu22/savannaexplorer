-- AI Safari Planner usage analytics (v4.35+)
-- Run in Supabase SQL Editor after schema.sql on existing projects.

create table if not exists public.ai_planner_events (
    id uuid primary key default gen_random_uuid(),
    event_type text not null check (event_type in ('open', 'generate')),
    country text,
    duration smallint,
    category text,
    budget text,
    status text check (status is null or status in ('success', 'error')),
    catalog_matches smallint,
    latency_ms integer,
    generation_method text,
    error_code text,
    client text check (client is null or client in ('mobile', 'desktop')),
    app_version text,
    created_at timestamptz not null default now()
);

create index if not exists ai_planner_events_created_at_idx
    on public.ai_planner_events (created_at desc);

create index if not exists ai_planner_events_event_type_idx
    on public.ai_planner_events (event_type);

create index if not exists ai_planner_events_country_idx
    on public.ai_planner_events (country)
    where event_type = 'generate';

alter table public.ai_planner_events enable row level security;

-- Anonymous inserts from the public site (no reads via anon key)
create policy "Anyone can log planner events"
    on public.ai_planner_events for insert
    with check (true);
