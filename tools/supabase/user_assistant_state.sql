-- Assistant persistent memory & scoped chat history per user (Sprint E4.4).
-- Stores global/ruleset preferences, per-character/campaign chat histories (owner-private),
-- and DM-private character notes without polluting public.characters or public.user_hub_state.
--
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste this file -> Run.
-- Safe to re-run: every statement is idempotent.
--
-- Access: strictly owner-only (players' tactical chats and preferences are never visible to other campaign members).

create table if not exists public.user_assistant_state (
  owner_user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  state         jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object'),
  updated_at    timestamptz not null default now(),
  constraint user_assistant_state_size check (pg_column_size(state) < 500000)
);

alter table public.user_assistant_state enable row level security;

drop policy if exists user_assistant_state_select on public.user_assistant_state;
create policy user_assistant_state_select on public.user_assistant_state
  for select using (owner_user_id = auth.uid());

drop policy if exists user_assistant_state_insert on public.user_assistant_state;
create policy user_assistant_state_insert on public.user_assistant_state
  for insert with check (owner_user_id = auth.uid());

drop policy if exists user_assistant_state_update on public.user_assistant_state;
create policy user_assistant_state_update on public.user_assistant_state
  for update using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

drop policy if exists user_assistant_state_delete on public.user_assistant_state;
create policy user_assistant_state_delete on public.user_assistant_state
  for delete using (owner_user_id = auth.uid());

create or replace function public.uas_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists user_assistant_state_touch on public.user_assistant_state;
create trigger user_assistant_state_touch
  before update on public.user_assistant_state
  for each row execute function public.uas_touch_updated_at();
