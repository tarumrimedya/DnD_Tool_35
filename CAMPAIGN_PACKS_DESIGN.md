# Campaign DB: shared campaign rule DB (design)

Status: approved (2026-11-10): the whole pack is copied to each character, and a pack file uploaded in the Hub attaches to the campaign. Phase 1 is implemented (`campaign_db.js`, Hub local campaigns); phases 2 and 3 are open.

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
