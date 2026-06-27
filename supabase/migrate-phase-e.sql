-- Hub mode Phase E migration (v4.11.0)
-- Run once in Supabase SQL Editor on projects created with pre-v4.11 schema.sql
--
-- Replaces legacy booking-era tables (quotations, inquiries) with site_messages.

-- 1. Create the new contact table
create table if not exists public.site_messages (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    topic text not null,
    message text not null,
    created_at timestamptz not null default now()
);

alter table public.site_messages enable row level security;

drop policy if exists "Anyone can submit site messages" on public.site_messages;
create policy "Anyone can submit site messages"
    on public.site_messages for insert
    with check (true);

-- 2. Migrate existing quotation rows (if any)
do $$
begin
    if exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'quotations'
    ) then
        insert into public.site_messages (name, email, topic, message, created_at)
        select
            name,
            email,
            coalesce(nullif(trim(travel_style), ''), 'general'),
            coalesce(message, ''),
            created_at
        from public.quotations;
    end if;
end $$;

-- 3. Drop legacy booking-era tables and policies
drop policy if exists "Anyone can submit quotations" on public.quotations;
drop policy if exists "Anyone can submit inquiries" on public.inquiries;
drop policy if exists "Allow public to insert inquiries" on public.inquiries;

drop table if exists public.inquiries;
drop table if exists public.quotations;
