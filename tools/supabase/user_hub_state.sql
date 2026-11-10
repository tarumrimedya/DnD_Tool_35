-- Hub state per user: the user's campaigns (local, cloud and sub-campaigns) with their notes, so the Hub
-- shows the same campaigns and DM notes on every device. Replaces the legacy Vercel KV sync for this data.
-- Characters stay in public.characters, cloud campaign rule packs in public.campaign_packs.
--
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste this file -> Run.
-- It is safe to run again: every statement checks what already exists.
--
-- Access: only the owner reads and writes their row (DM notes are never visible to players).

create table if not exists public.user_hub_state (
  owner_user_id        uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  campaigns            jsonb not null default '[]'::jsonb check (jsonb_typeof(campaigns) = 'array'),
  deleted_campaign_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(deleted_campaign_ids) = 'array'),
  updated_at           timestamptz not null default now(),
  constraint user_hub_state_size check (pg_column_size(campaigns) < 8000000)
);

alter table public.user_hub_state enable row level security;

drop policy if exists user_hub_state_select on public.user_hub_state;
create policy user_hub_state_select on public.user_hub_state
  for select using (owner_user_id = auth.uid());

drop policy if exists user_hub_state_insert on public.user_hub_state;
create policy user_hub_state_insert on public.user_hub_state
  for insert with check (owner_user_id = auth.uid());

drop policy if exists user_hub_state_update on public.user_hub_state;
create policy user_hub_state_update on public.user_hub_state
  for update using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

drop policy if exists user_hub_state_delete on public.user_hub_state;
create policy user_hub_state_delete on public.user_hub_state
  for delete using (owner_user_id = auth.uid());

create or replace function public.uhs_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists user_hub_state_touch on public.user_hub_state;
create trigger user_hub_state_touch
  before update on public.user_hub_state
  for each row execute function public.uhs_touch_updated_at();
