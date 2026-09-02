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

-- Authenticated My Safari workspaces (v4.37+)
create table if not exists public.user_trips (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    client_id text not null check (char_length(client_id) between 1 and 128),
    data jsonb not null check (jsonb_typeof(data) = 'object'),
    share_token uuid not null default gen_random_uuid() unique,
    share_enabled boolean not null default false,
    deleted_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, client_id)
);

create index if not exists user_trips_user_updated_idx on public.user_trips (user_id, updated_at desc);
create index if not exists user_trips_share_lookup_idx on public.user_trips (share_token)
    where share_enabled = true and deleted_at is null;

alter table public.user_trips enable row level security;

create policy "Owners can read their trips" on public.user_trips for select to authenticated
    using ((select auth.uid()) = user_id);
create policy "Owners can create their trips" on public.user_trips for insert to authenticated
    with check ((select auth.uid()) = user_id);
create policy "Owners can update their trips" on public.user_trips for update to authenticated
    using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners can delete their trips" on public.user_trips for delete to authenticated
    using ((select auth.uid()) = user_id);

create or replace function public.get_shared_trip(p_token uuid)
returns table (data jsonb, updated_at timestamptz)
language sql stable security definer set search_path = public, pg_temp
as $$
    select ut.data, ut.updated_at from public.user_trips as ut
    where ut.share_token = p_token and ut.share_enabled = true and ut.deleted_at is null
    limit 1;
$$;

revoke all on function public.get_shared_trip(uuid) from public;
grant execute on function public.get_shared_trip(uuid) to anon, authenticated;
