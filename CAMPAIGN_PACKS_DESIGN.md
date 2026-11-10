# Campaign DB: shared campaign rule DB (design)

Status: approved (2026-11-10): the whole pack is copied to each character, and a pack file uploaded in the Hub attaches to the campaign. Phase 1 is implemented (`campaign_db.js`, Hub local campaigns). Phase 2 is implemented (cloud table, `supabase_auth.js`, Hub DM side); the SQL was run in Supabase on 2026-11-10. Phase 3 is implemented (character sheet). Live test on the cloud campaign "Test Camp" (Vercel preview, 2026-11-10): attach, sheet load, Realtime update, in-use entry kept as removed, detach and rejoin, sub-campaign root and anon RLS passed. It found that Supabase Realtime does not filter DELETE events, so the sheet missed a pack removal; the sheet now listens to DELETE unfiltered and re-fetches.

## Hub state sync (campaigns and notes on every device)

Campaign notes (DM Logs, Campaign Logs), local campaigns and sub-campaigns used to travel between devices only through the legacy Vercel KV sync. They now live in Supabase `public.user_hub_state` (`tools/supabase/user_hub_state.sql`, run once): one row per user, readable and writable only by that user, so DM notes never reach players.

- **Row:** `campaigns` (every Hub campaign with its notes; packs only for local campaigns, since `campaign_packs` owns a cloud campaign's packs) and `deleted_campaign_ids`.
- **When:** at the start of every Hub cloud sync, and 2.5 s after a Hub save.
- **Merge** (`campaign_db.js mergeHubCampaignState`, three-way per campaign): each campaign keeps the hash of its last synced version. If only one side changed since then, that side wins; if both changed, the other device's fields with this device's on top and the notes merged by id (newer `updatedAt` wins). A deleted campaign travels as an id; a campaign missing from the row is never treated as deleted.
- **Until the SQL runs:** the sync stops quietly after the first "table is not installed" error; nothing else changes.
- **Moving off KV:** a device that still syncs through KV uploads its campaigns and notes on its first Hub sync with this code while signed in. After that, KV can be removed.

## Campaign bundle (export / import, Hub)

The Hub settings card "Campaign (DB, Notes, Characters)" replaces the old "Master DB (Library)" export, which merged every character's DB into one file. `campaign_db.js` builds and plans it; `hub.html` (`exportCampaignBundle`, `importCampaignBundleFile`) applies it.

- **File:** `{ format: "dnd35-campaign-bundle", schemaVersion: 1, exportedAt, campaign, subCampaigns, characters }`. `campaign` is the main campaign (a selected sub-campaign resolves to it) with its notes and Campaign DB `packs`; `subCampaigns` carry their own notes; `characters` are the Hub's characters in the campaign and its sub-campaigns. The invite code is left out, and so are the characters' active Campaign DB copies (the packs re-create them). Characters other players own in a cloud campaign are not in the DM's Hub, so they are not in the file.
- **Import, campaign id (or cloud id) unknown:** the campaign, sub-campaigns, notes, packs and characters are created as a local campaign. "Move to Cloud" uploads it.
- **Import, campaign exists:** notes, sub-campaigns, characters and packs are matched by id. Missing: added. Identical: skipped (a re-import changes nothing). Different: a new copy with a new id and "(Imported YYYY-MM-DD)" in its title or name; nothing existing is overwritten. A pack with the same `packId` and different entries is attached as a new version (a copy would duplicate entry ids); on a cloud campaign it is uploaded, and the campaign's characters are reconciled.

## Phase 3 behaviour (character sheet, `char_hud.js`)

- **Load and join:** a character with `cloudCampaignId` subscribes to its campaign's `campaign_packs` (Realtime) and fetches the packs when it loads and when it joins a campaign; the copies are reconciled, the character is saved and the sheet re-renders.
- **DM changes a pack:** the Realtime event makes the sheet fetch and reconcile again, with a "Campaign DB Updated" toast (added / updated / removed / kept).
- **Leaving the campaign:** the copies of that campaign are marked detached and stay on the character.
- **Signed out, or no cloud campaign:** nothing is fetched and the copies are left as they are (a Hub-only campaign is kept current by the Hub).
- **Master DB table:** a copy shows "🏰 Campaign DB", "⚠️ Removed by DM" or "📴 Campaign DB (Detached)".

## Phase 2 setup (once)

1. Supabase dashboard → SQL Editor → New query.
2. Paste `tools/supabase/campaign_packs.sql` and run it. It is safe to run again.
3. Open the Hub signed in. Packs already attached to a cloud campaign in phase 1 are uploaded by the next Hub cloud sync.

Until the table exists, attaching a pack to a cloud campaign fails with "The Campaign DB cloud table is not installed" and nothing changes; local campaigns work as in phase 1.

## Phase 2 behaviour

- **Attach / remove on a cloud campaign:** written to `campaign_packs` first; the Hub changes only when the write succeeds.
- **Signed out:** attaching keeps the pack locally as "not uploaded" and the next sync uploads it. A pack already in the cloud cannot be removed while signed out.
- **Hub cloud sync:** the cloud list replaces the local one (a pack deleted on another device disappears); packs not uploaded yet are uploaded first; then every character in the campaign is reconciled.
- **Copies** are tagged with the cloud campaign id, which is the id the character sheet knows.
- **Characters in a campaign this Hub does not hold** (a player's character in another DM's campaign) are left alone; the sheet keeps them current (phase 3).
- **Moving a campaign to the cloud** uploads its packs. Its sub-campaigns now follow the main campaign's new id; before, their `parentId` kept the old local id.

Naming: **Campaign DB** is the campaign's shared rule database, one of the search sources next to the built-in SRD data, the extra (lazy / opt-in) data and AI. A DM rule pack (e.g. the DM Boons pack) is one unit inside it; the cloud table is `campaign_packs` because it stores one row per pack.

## Problem

- A DM rule pack (for example `exports/dm_boons_master_db_import.json`) reaches a character only by being merged into that character's `customDb`.
- The Hub can merge a pack only into the DM's own characters on the DM's device. A player's cloud character (Supabase `characters` row, owned by the player) cannot receive it. Every player has to import the pack by hand, and nothing updates their copy when the DM changes the pack.
- The DM Pack Manager builds its list by joining every character's `customDb`, so it has no single source of truth.

## Goal

One copy of each pack per campaign, owned and edited only by the DM. Every character in the campaign gets the pack automatically and keeps it current. Character-scoped `customDb` (ADR-011) stays the only thing the rule engine reads.

## Current state (checked in code, 2026-11-10)

- Cloud tables used by `supabase_auth.js`: `campaigns` (`id`, `dm_user_id`, `name`, `description`, `invite_code`, `is_dm_mode`), `campaign_members` (`campaign_id`, `user_id`, `role`), `characters` (`id`, `owner_user_id`, `campaign_id`, `full_data`, `current_hp`, `temp_hp`, ...). The Obsidian note "Supabase Multiplayer and Realtime Architecture" lists older column names (`dm_id`, `user_id`, `data`); the code is authoritative.
- No SQL schema or RLS policy is stored in this repo.
- A player's sheet knows its campaign through `character.cloudCampaignId`.
- Sub-campaigns (`parentId`) exist only in the Hub's local state. A cloud campaign has no parent.
- The DM can write only HP to a player's character (`updateCharacterHpAsDm`).

## Design

### 1. Storage: new `campaign_packs` table

One row per pack per campaign:

| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | uuid PK | |
| `campaign_id` | uuid FK `campaigns.id` ON DELETE CASCADE | |
| `pack_id` | text | `pack.id` from the pack file, e.g. `pack_dm_draconic_boons` |
| `name` | text | |
| `version` | int | +1 on every upload |
| `entries` | jsonb | V2 entries, same shape as the pack file |
| `updated_at` | timestamptz | |

Unique on `(campaign_id, pack_id)`. A separate table (not a column on `campaigns`) because a campaign can have several packs, each is versioned on its own, Realtime can send one changed pack, and the invite-code lookup never downloads pack data.

RLS:
- read: campaign members and the campaign DM
- insert, update, delete: only the campaign DM (`campaigns.dm_user_id = auth.uid()`)

The SQL goes in `tools/supabase/campaign_packs.sql`. You run it once in the Supabase SQL editor; I cannot reach the project.

### 2. Getting entries to the character: tagged copies in `customDb`

The rule engine and every picker already read the character's `customDb`, so the pack is copied there. Each copy gets a tag:

```json
"_campaignPack": { "campaignId": "...", "packId": "pack_dm_draconic_boons", "version": 3, "status": "active" }
```

This is the same idea as the SRD `_snapshot` copies. The character keeps working offline and after leaving the campaign. `rule_engine.js` does not change.

A single pure function, `reconcileCampaignPacks(customDb, packs, refs)`, is shared by the Hub and the sheet and tested in Node:
- **New entry in the pack:** added with the tag.
- **Changed entry (higher version):** the tagged copy is replaced.
- **Entry removed by the DM:** deleted if the character does not use it. If the character uses it (feats, special abilities, buffs), it is kept with `status: "removed"` and the sheet shows a warning.
- **The character's own entries (no tag):** never overwritten. If one clashes with a pack entry by id, or by name with a compatible type, the pack entry is skipped and a warning is shown.
- **Character leaves the campaign:** the copies stay with `status: "detached"` and are no longer updated.

### 3. Main campaign and sub-campaigns

Packs belong to a cloud campaign. In the Hub, a local sub-campaign uses the packs of its root campaign, so the whole main campaign shares one DB. A local campaign that is not in the cloud keeps its packs in `camp.packs` in Hub storage, and the same reconcile function applies them to its local characters.

### 4. When it runs

- **Hub (DM):** attaching, updating or removing a pack writes `campaign_packs`, then reconciles the DM's own characters and NPCs in that campaign.
- **Sheet (player):** if `cloudCampaignId` is set, the sheet reads `campaign_packs` when the character loads, reconciles, and saves. A Realtime subscription on `campaign_packs` (filtered by `campaign_id`) repeats this while the sheet is open.
- **No connection:** the character uses the copies it already has.

### 5. Hub UI changes

- **Pack upload:** a pack JSON uploaded in the Hub ("Rule Pack") attaches the pack to the selected campaign instead of merging it into characters.
- **DM Pack Manager:** lists the campaign's packs (name, version, entry count, Remove) from `campaign_packs`, not the join of every character's DB. This also fixes item 3 from the review.
- **Unchanged:** plain array imports and the Compendium "add custom entry" action keep their current per-character merge, scoped to one campaign.

## Files

| Phase | Files |
| :--- | :--- |
| 1. Shared reconcile + local campaigns | new `campaign_packs.js` (loaded by `hub.html` and `index.html`, added to the `verify_and_sync.js` sync list), `hub.html`, `tools/test_derive_sheet.js` |
| 2. Cloud table + DM side | new `tools/supabase/campaign_packs.sql`, `supabase_auth.js` (fetch, upsert, delete, subscribe), `hub.html` |
| 3. Player side | `char_hud.js` (load + Realtime), `char_store.js` (used-entry refs), warnings in the sheet, `rule_master_ai_schema.json` (`_campaignPack` field) |

Phase 1 needs no Supabase change and can be tested on its own.

## Cross-impact (GEMINI.md section 4)

- `hub.html`: the pack upload flow and the DM Pack Manager change. Plain imports and the Compendium action stay as they are.
- `index.html` and `char_*.js`: new load and Realtime step. Entries arrive in `customDb` in the same V2 shape as today.
- `rule_engine.js`: no change.
- Supabase: one new table and its RLS. Existing tables are not changed.
- Characters that already imported the boon pack by hand: the importers stamp each entry with `pack: "<pack id>"`. On the first reconcile, an untagged entry with the same id and the same `pack` value is adopted as the pack's copy and tagged, so there are no duplicates. Other untagged entries follow the "character's own entries" rule above.
