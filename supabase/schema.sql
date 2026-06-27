-- Savanna Explorer — Supabase schema
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

-- Experiences (marketplace listings)
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

-- WhatsApp inquiry tracking
create table if not exists public.inquiries (
    id uuid primary key default gen_random_uuid(),
    experience_id text references public.experiences (id) on delete set null,
    message text,
    source text not null default 'whatsapp',
    created_at timestamptz not null default now()
);

-- Contact / quotation form submissions
create table if not exists public.quotations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    travelers text,
    travel_style text,
    itineraries text[],
    message text,
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
alter table public.inquiries enable row level security;
alter table public.quotations enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- Public read for marketplace experiences
create policy "Anyone can read experiences"
    on public.experiences for select
    using (true);

-- Anonymous inserts for lead capture (no public reads)
create policy "Anyone can submit inquiries"
    on public.inquiries for insert
    with check (true);

create policy "Anyone can submit quotations"
    on public.quotations for insert
    with check (true);

create policy "Anyone can subscribe to newsletter"
    on public.newsletter_subscribers for insert
    with check (true);
