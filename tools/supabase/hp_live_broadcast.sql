-- Live Hit Points broadcast: who may send and receive on the private Realtime channels.
--
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to run again (drops and recreates its own two policies).
--
-- Topics used by the app (private channels, supabase.channel(topic, { config: { private: true } })):
--   hp:user:<auth user id>      the signed-in user's own devices (sheet <-> Hub)
--   hp:campaign:<campaign id>   everyone in that campaign (DM Hub <-> player sheets)
--
-- Only these two topic shapes are opened; every other topic stays closed to these policies.
-- Do NOT turn off "Allow public access" in Realtime Settings: the app's existing
-- database-change subscriptions use public channels and would stop working.
-- RLS is already enabled on realtime.messages; do not run ALTER TABLE ... ENABLE ROW LEVEL SECURITY.

drop policy if exists "hp live receive" on realtime.messages;
drop policy if exists "hp live send" on realtime.messages;

create policy "hp live receive"
on realtime.messages
for select
to authenticated
using (
  realtime.messages.extension in ('broadcast')
  and (
    (select realtime.topic()) = 'hp:user:' || (select auth.uid())::text
    or (
      (select realtime.topic()) like 'hp:campaign:%'
      and (
        exists (
          select 1 from public.campaign_members m
          where m.user_id = (select auth.uid())
            and 'hp:campaign:' || m.campaign_id::text = (select realtime.topic())
        )
        or exists (
          select 1 from public.campaigns c
          where c.dm_user_id = (select auth.uid())
            and 'hp:campaign:' || c.id::text = (select realtime.topic())
        )
      )
    )
  )
);

create policy "hp live send"
on realtime.messages
for insert
to authenticated
with check (
  realtime.messages.extension in ('broadcast')
  and (
    (select realtime.topic()) = 'hp:user:' || (select auth.uid())::text
    or (
      (select realtime.topic()) like 'hp:campaign:%'
      and (
        exists (
          select 1 from public.campaign_members m
          where m.user_id = (select auth.uid())
            and 'hp:campaign:' || m.campaign_id::text = (select realtime.topic())
        )
        or exists (
          select 1 from public.campaigns c
          where c.dm_user_id = (select auth.uid())
            and 'hp:campaign:' || c.id::text = (select realtime.topic())
        )
      )
    )
  )
);
