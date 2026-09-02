-- Savanna Explorer v4.37 — authenticated trip sync and token-based sharing
-- Run once in the Supabase SQL Editor or through `supabase db push`.

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

create index if not exists user_trips_user_updated_idx
    on public.user_trips (user_id, updated_at desc);

create index if not exists user_trips_share_lookup_idx
    on public.user_trips (share_token)
    where share_enabled = true and deleted_at is null;

alter table public.user_trips enable row level security;

drop policy if exists "Owners can read their trips" on public.user_trips;
create policy "Owners can read their trips"
    on public.user_trips for select to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Owners can create their trips" on public.user_trips;
create policy "Owners can create their trips"
    on public.user_trips for insert to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "Owners can update their trips" on public.user_trips;
create policy "Owners can update their trips"
    on public.user_trips for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists "Owners can delete their trips" on public.user_trips;
create policy "Owners can delete their trips"
    on public.user_trips for delete to authenticated
    using ((select auth.uid()) = user_id);

-- Public visitors never receive table access. This function returns one enabled
-- trip only when its unguessable UUID token is supplied exactly.
create or replace function public.get_shared_trip(p_token uuid)
returns table (data jsonb, updated_at timestamptz)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select ut.data, ut.updated_at
    from public.user_trips as ut
    where ut.share_token = p_token
      and ut.share_enabled = true
      and ut.deleted_at is null
    limit 1;
$$;

revoke all on function public.get_shared_trip(uuid) from public;
grant execute on function public.get_shared_trip(uuid) to anon, authenticated;
