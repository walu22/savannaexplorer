-- Savanna Explorer — Supabase schema (hub mode v4.11+)
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)
--
-- Upgrading from pre-v4.11 (quotations / inquiries tables)?
-- Run supabase/migrate-phase-e.sql first, then this file is optional for fresh installs.

-- Marketplace inspiration listings (planning reference — not products for sale)
create table if not exists public.experiences (
    id text primary key,
    title text not null,
    category text not null,
    location text not null,
    duration text not null,
    price_range text,
    rating numeric(2, 1),
    badge text,
    best_time text,
    image_url text,
    description text,
    created_at timestamptz not null default now()
);

create index if not exists experiences_category_idx on public.experiences (category);

-- Contact form messages (corrections, feedback, partnerships — not trip bookings)
create table if not exists public.site_messages (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    topic text not null,
    message text not null,
    created_at timestamptz not null default now()
);

-- Newsletter signups
create table if not exists public.newsletter_subscribers (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    created_at timestamptz not null default now()
);

-- AI Safari Planner usage (anonymous inserts from the public site)
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

-- Row Level Security
alter table public.experiences enable row level security;
alter table public.site_messages enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.ai_planner_events enable row level security;

-- Public read for marketplace inspiration
create policy "Anyone can read experiences"
    on public.experiences for select
    using (true);

-- Anonymous inserts for contact and newsletter (no public reads)
create policy "Anyone can submit site messages"
    on public.site_messages for insert
    with check (true);

create policy "Anyone can subscribe to newsletter"
    on public.newsletter_subscribers for insert
    with check (true);

create policy "Anyone can log planner events"
    on public.ai_planner_events for insert
    with check (true);
