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

-- Row Level Security
alter table public.experiences enable row level security;
alter table public.site_messages enable row level security;
alter table public.newsletter_subscribers enable row level security;

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
