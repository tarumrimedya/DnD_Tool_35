-- Campaign DB: rule packs shared by a campaign (CAMPAIGN_PACKS_DESIGN.md, phase 2).
--
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste this file -> Run.
-- It is safe to run again: every statement checks what already exists.
--
-- Assumes the tables the app already uses (supabase_auth.js):
--   public.campaigns        (id uuid, dm_user_id uuid, ...)
--   public.campaign_members (campaign_id uuid, user_id uuid, role text)
-- If campaigns.id is not uuid in your project, change the type of campaign_packs.campaign_id to match.
--
-- Access:
--   read   : the campaign's DM and its members (players who joined with the invite code)
--   write  : only the campaign's DM (campaigns.dm_user_id = auth.uid())

create table if not exists public.campaign_packs (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  pack_id     text not null,
  name        text not null default '',
  version     integer not null default 1 check (version >= 1),
  entries     jsonb not null default '[]'::jsonb check (jsonb_typeof(entries) = 'array'),
  updated_by  uuid default auth.uid(),
  updated_at  timestamptz not null default now(),
  unique (campaign_id, pack_id),
  -- one pack stays well below the size of a character row; 107 DM boons are about 150 KB
  constraint campaign_packs_entries_size check (pg_column_size(entries) < 4000000)
);

create index if not exists campaign_packs_campaign_id_idx on public.campaign_packs (campaign_id);

-- Helper checks run as the table owner, so they do not depend on the RLS policies of
-- campaigns / campaign_members. Own names, so existing helper functions are not replaced.
create or replace function public.cdb_is_campaign_dm(c_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.campaigns c where c.id = c_id and c.dm_user_id = auth.uid());
$$;

create or replace function public.cdb_is_campaign_member(c_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.campaign_members m where m.campaign_id = c_id and m.user_id = auth.uid());
$$;

revoke all on function public.cdb_is_campaign_dm(uuid) from public;
revoke all on function public.cdb_is_campaign_member(uuid) from public;
grant execute on function public.cdb_is_campaign_dm(uuid) to authenticated;
grant execute on function public.cdb_is_campaign_member(uuid) to authenticated;

alter table public.campaign_packs enable row level security;

drop policy if exists campaign_packs_select on public.campaign_packs;
create policy campaign_packs_select on public.campaign_packs
  for select to authenticated
  using (public.cdb_is_campaign_dm(campaign_id) or public.cdb_is_campaign_member(campaign_id));

drop policy if exists campaign_packs_insert on public.campaign_packs;
create policy campaign_packs_insert on public.campaign_packs
  for insert to authenticated
  with check (public.cdb_is_campaign_dm(campaign_id));

drop policy if exists campaign_packs_update on public.campaign_packs;
create policy campaign_packs_update on public.campaign_packs
  for update to authenticated
  using (public.cdb_is_campaign_dm(campaign_id))
  with check (public.cdb_is_campaign_dm(campaign_id));

drop policy if exists campaign_packs_delete on public.campaign_packs;
create policy campaign_packs_delete on public.campaign_packs
  for delete to authenticated
  using (public.cdb_is_campaign_dm(campaign_id));

grant select, insert, update, delete on public.campaign_packs to authenticated;

-- Keep updated_at / updated_by current on every change.
create or replace function public.cdb_touch_campaign_pack()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists campaign_packs_touch on public.campaign_packs;
create trigger campaign_packs_touch
  before insert or update on public.campaign_packs
  for each row execute function public.cdb_touch_campaign_pack();

-- Realtime: the character sheet listens for pack changes of its campaign (phase 3).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'campaign_packs'
     ) then
    execute 'alter publication supabase_realtime add table public.campaign_packs';
  end if;
end;
$$;
