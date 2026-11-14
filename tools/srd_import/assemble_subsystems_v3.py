#!/usr/bin/env python3
"""
Deterministic, idempotent assembler for Joyful-Fermi Subsystems Compendium V3:
  - Applies exports/tome_of_magic_classes_feats_patch.json
  - Applies exports/incarnum_psionics_classes_feats_races_patch.json
  - Merges 5 splat races + 38 ToM/MoI/CPsi classes & PrCs into database/srd_classes_splat.json
    (preserving legacy chassis keys hd/bab/fort/ref/will/skills & provenance;
     normalizing verification='verified' and edition='3.5'; leaving core OGL srd_classes_races.json untouched)
  - Applies 50 MoI feat category fixes + 10 CPsi feats + 37 ToM feats into database/srd_feats_splat.json
    (ensuring levelBand='heroic', verification='verified', provenance.book='... p.N', contentLevel='summary';
     leaving core OGL srd_feats.json untouched)
  - Registers all 5 new lazy chunks in database/srd_index.json (eagerLoad: false),
    purges deleted stub IDs (cls-shadowcaster-not-implemented, cls-truenamer-not-implemented),
    updates modified class/feat index rows, and emits index rows for the 5 new chunks.
"""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DB_DIR = ROOT / "database"
EXPORT_DIR = ROOT / "exports"

NEW_CHUNKS = [
    "srd_vestiges_splat.json",
    "srd_mysteries_splat.json",
    "srd_utterances_splat.json",
    "srd_soulmelds_splat.json",
    "srd_powers_splat.json",
]

BAB_MAP = {"high": 1, "full": 1, "good": 1, "medium": 0.75, "med": 0.75, "low": 0.5, "poor": 0.5}
SAVE_MAP = {"high": "good", "good": "good", "low": "poor", "poor": "poor"}


def norm_name(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", (s or "").lower())


def file_sha256_16(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def normalize_book_source(source: str, page: int | None) -> str:
    s = str(source or "").strip()
    if re.search(r"p\.\s*\d+$", s):
        return re.sub(r"p\.\s*(\d+)$", r"p.\1", s)
    if page:
        return f"{s} p.{page}"
    return s


def normalize_class_or_race(rec: dict, existing: dict | None = None) -> dict:
    out = {k: v for k, v in rec.items() if k != "patchAction"}
    if existing:
        for k in ("foundryId", "hd", "bab", "fort", "ref", "will", "skills"):
            if k not in out and k in existing:
                out[k] = existing[k]
        if "provenance" not in out and isinstance(existing.get("provenance"), dict):
            out["provenance"] = dict(existing["provenance"])

    # Ensure legacy chassis aliases exist for Classes (SRD Import P4 parity)
    if out.get("type") == "Class":
        hd_val = out.get("hitDie")
        if "hd" not in out and isinstance(hd_val, str) and hd_val.lower().startswith("d"):
            out["hd"] = int(hd_val[1:])
        if "bab" not in out and out.get("babProgression"):
            out["bab"] = BAB_MAP.get(str(out["babProgression"]).lower(), 0.75)
        sv = out.get("savingThrows") or {}
        if "fort" not in out and sv.get("fort"):
            out["fort"] = SAVE_MAP.get(str(sv["fort"]).lower(), "poor")
        if "ref" not in out and sv.get("ref"):
            out["ref"] = SAVE_MAP.get(str(sv["ref"]).lower(), "poor")
        if "will" not in out and sv.get("will"):
            out["will"] = SAVE_MAP.get(str(sv["will"]).lower(), "poor")
        if "skills" not in out and out.get("skillPointsPerLevel") is not None:
            out["skills"] = out["skillPointsPerLevel"]

    book_src = normalize_book_source(out.get("source", ""), out.get("page"))
    out["source"] = book_src
    out["edition"] = "3.5"
    out["verification"] = "verified"
    prov = dict(out.get("provenance") or {})
    prov.setdefault("origin", "book-verified-v3")
    prov["book"] = book_src
    out["provenance"] = prov
    return out


def normalize_feat(rec: dict) -> dict:
    out = {k: v for k, v in rec.items() if k != "patchAction"}
    book_src = normalize_book_source(out.get("source", ""), out.get("page"))
    out["source"] = book_src
    out["edition"] = "3.5"
    out["levelBand"] = out.get("levelBand") or "heroic"
    out["contentLevel"] = "summary"
    out["verification"] = "verified"
    prov = dict(out.get("provenance") or {})
    prov.setdefault("origin", "book-verified-v3")
    prov["book"] = book_src
    out["provenance"] = prov
    return out


def upsert_by_id(records: list[dict], new_item: dict) -> list[dict]:
    item_id = new_item["id"]
    for i, cur in enumerate(records):
        if isinstance(cur, dict) and cur.get("id") == item_id:
            records[i] = new_item
            return records
    records.append(new_item)
    return records


def index_category(rec: dict) -> str:
    cat = rec.get("category")
    if cat:
        return str(cat)
    sp = rec.get("spell") or {}
    if isinstance(sp, dict):
        if sp.get("mysteryPath"):
            return str(sp["mysteryPath"])
        if sp.get("lexicon"):
            return str(sp["lexicon"])
        if rec.get("type") == "Vestige":
            return "Vestige"
    return ""


def index_level(rec: dict):
    t = rec.get("type")
    if t in ("Spell", "Power", "Maneuver", "Stance", "Vestige", "Soulmeld", "Mystery", "Utterance"):
        if rec.get("level") is not None:
            return rec.get("level")
        sp = rec.get("spell") or {}
        if isinstance(sp, dict):
            if sp.get("vestigeLvl") is not None:
                return sp.get("vestigeLvl")
            if sp.get("maneuverLvl") is not None:
                return sp.get("maneuverLvl")
        return None
    if t == "Monster":
        return rec.get("cr")
    return rec.get("minLevel")


def build_index_row(rec: dict, chunk_name: str, existing: dict | None = None) -> dict:
    row: dict = {
        "id": rec["id"],
        "n": rec["name"],
        "t": rec["type"],
        "c": index_category(rec),
        "s": rec.get("slot") or "None",
        "f": chunk_name,
    }
    if existing:
        for k, v in existing.items():
            if k not in ("id", "n", "t", "c", "s", "f", "l", "fb"):
                row[k] = v
    lvl = index_level(rec)
    if lvl is not None:
        row["l"] = lvl
    if rec.get("isFighterBonusFeat"):
        row["fb"] = 1
    return row


def assemble() -> dict:
    tom_patch = load_json(EXPORT_DIR / "tome_of_magic_classes_feats_patch.json")
    moi_patch = load_json(EXPORT_DIR / "incarnum_psionics_classes_feats_races_patch.json")

    core_classes_races = load_json(DB_DIR / "srd_classes_races.json")
    legacy_classes = load_json(DB_DIR / "srd_classes_legacy.json")
    core_feats = load_json(DB_DIR / "srd_feats.json")
    splat_classes = load_json(DB_DIR / "srd_classes_splat.json")
    splat_feats = load_json(DB_DIR / "srd_feats_splat.json")
    srd_index = load_json(DB_DIR / "srd_index.json")

    existing_cls_by_id = {c["id"]: c for c in splat_classes if isinstance(c, dict) and c.get("id")}

    # --- 1. Merge Classes & Races into database/srd_classes_splat.json ---
    removed_class_ids = {
        old_id
        for old_id, new_id in (tom_patch.get("replaceClassIds") or {}).items()
        if old_id != new_id
    }
    splat_classes = [c for c in splat_classes if c.get("id") not in removed_class_ids]

    modified_class_ids: set[str] = set()
    for race in moi_patch.get("races", []):
        normed = normalize_class_or_race(race, existing_cls_by_id.get(race["id"]))
        upsert_by_id(splat_classes, normed)
        modified_class_ids.add(normed["id"])

    for cls_entry in tom_patch.get("classes", []):
        normed = normalize_class_or_race(cls_entry, existing_cls_by_id.get(cls_entry["id"]))
        upsert_by_id(splat_classes, normed)
        modified_class_ids.add(normed["id"])

    for cls_entry in moi_patch.get("classes", []):
        normed = normalize_class_or_race(cls_entry, existing_cls_by_id.get(cls_entry["id"]))
        upsert_by_id(splat_classes, normed)
        modified_class_ids.add(normed["id"])

    # Verify 0 duplicate IDs and 0 duplicate (type, normalized name) across core + splat + legacy
    seen_cls_ids: set[str] = set()
    seen_cls_names: dict[tuple[str, str], str] = {}
    for src_name, bucket in (
        ("srd_classes_races.json", core_classes_races),
        ("srd_classes_splat.json", splat_classes),
        ("srd_classes_legacy.json", legacy_classes),
    ):
        for rec in bucket:
            rid = rec["id"]
            if rid in seen_cls_ids:
                raise AssertionError(f"Duplicate class/race ID across {src_name}: {rid}")
            seen_cls_ids.add(rid)
            key = (str(rec.get("type", "")).lower(), norm_name(rec.get("name", "")))
            if key in seen_cls_names:
                raise AssertionError(f"Duplicate class/race name across {src_name}: {rec['name']} ({rid} vs {seen_cls_names[key]})")
            seen_cls_names[key] = rid

    save_json(DB_DIR / "srd_classes_splat.json", splat_classes)

    # --- 2. Merge Feat Category Fixes + Additions into database/srd_feats_splat.json ---
    feats_by_id = {f["id"]: f for f in splat_feats if isinstance(f, dict) and f.get("id")}
    modified_feat_ids: set[str] = set()

    for fix in moi_patch.get("featCategoryFixes", []):
        fid = fix["id"]
        if fid not in feats_by_id:
            raise AssertionError(f"Missing feat to fix in srd_feats_splat.json: {fid}")
        rec = feats_by_id[fid]
        rec["category"] = fix["category"]
        rec["featTypes"] = list(fix["featTypes"])
        rec["tags"] = list(fix["tags"])
        rec["bookVerifiedCategory"] = fix["bookVerifiedCategory"]
        rec["bookReference"] = fix["bookReference"]
        modified_feat_ids.add(fid)

    added_feat_ids: set[str] = set()
    for nf in moi_patch.get("newFeats", []) + tom_patch.get("feats", []):
        clean_f = normalize_feat(nf)
        upsert_by_id(splat_feats, clean_f)
        modified_feat_ids.add(clean_f["id"])
        added_feat_ids.add(clean_f["id"])

    # Verify 0 duplicate IDs across srd_feats + srd_feats_splat and 0 name collisions for newly added feats
    seen_feat_ids: set[str] = set()
    existing_feat_names: dict[tuple[str, str], str] = {}
    for src_name, bucket in (("srd_feats.json", core_feats), ("srd_feats_splat.json", splat_feats)):
        for rec in bucket:
            rid = rec["id"]
            if rid in seen_feat_ids:
                raise AssertionError(f"Duplicate feat ID across {src_name}: {rid}")
            seen_feat_ids.add(rid)
            if rid not in added_feat_ids:
                existing_feat_names[(str(rec.get("type", "")).lower(), norm_name(rec.get("name", "")))] = rid

    added_names: set[str] = set()
    for rec in splat_feats:
        if rec["id"] in added_feat_ids:
            nm = norm_name(rec.get("name", ""))
            key = (str(rec.get("type", "")).lower(), nm)
            if key in existing_feat_names:
                raise AssertionError(f"New feat collides with existing feat: {rec['name']} ({rec['id']} vs {existing_feat_names[key]})")
            if nm in added_names:
                raise AssertionError(f"Duplicate newly added feat: {rec['name']} ({rec['id']})")
            added_names.add(nm)

    save_json(DB_DIR / "srd_feats_splat.json", splat_feats)

    # --- 3. Update database/srd_index.json ---
    chunks = srd_index.setdefault("chunks", {})
    for chunk_name in NEW_CHUNKS + ["srd_classes_splat.json", "srd_feats_splat.json"]:
        cpath = DB_DIR / chunk_name
        cdata = load_json(cpath)
        meta = chunks.get(chunk_name, {})
        meta.update({
            "count": len(cdata),
            "bytes": cpath.stat().st_size,
            "hash": file_sha256_16(cpath),
            "eagerLoad": False,
        })
        chunks[chunk_name] = meta

    index_rows: list[dict] = [
        r for r in srd_index.get("index", [])
        if isinstance(r, dict) and r.get("id") not in removed_class_ids
    ]
    row_pos_by_id = {r["id"]: idx for idx, r in enumerate(index_rows) if r.get("id")}

    sync_targets = [
        ("srd_classes_splat.json", splat_classes, modified_class_ids),
        ("srd_feats_splat.json", splat_feats, modified_feat_ids),
    ]
    for cn in NEW_CHUNKS:
        cdata = load_json(DB_DIR / cn)
        sync_targets.append((cn, cdata, {x["id"] for x in cdata if isinstance(x, dict) and x.get("id")}))

    for chunk_name, records, force_update_ids in sync_targets:
        for rec in records:
            if not isinstance(rec, dict) or not rec.get("id"):
                continue
            rid = rec["id"]
            pos = row_pos_by_id.get(rid)
            if pos is None:
                row = build_index_row(rec, chunk_name)
                row_pos_by_id[rid] = len(index_rows)
                index_rows.append(row)
            elif rid in force_update_ids:
                index_rows[pos] = build_index_row(rec, chunk_name, existing=index_rows[pos])

    srd_index["index"] = index_rows
    srd_index["totalEntries"] = len(index_rows)

    all_hashes = []
    for cname in chunks:
        cp = DB_DIR / cname
        if cp.exists():
            h = file_sha256_16(cp)
            chunks[cname]["hash"] = h
            all_hashes.append(h)
    idx_hash = hashlib.sha256(json.dumps(index_rows, separators=(",", ":")).encode("utf-8")).hexdigest()[:16]
    all_hashes.append(idx_hash)
    srd_index["compendiumHash"] = hashlib.sha256(":".join(all_hashes).encode("utf-8")).hexdigest()[:16]

    save_json(DB_DIR / "srd_index.json", srd_index)

    return {
        "totalEntries": srd_index["totalEntries"],
        "srd_classes_splat": len(splat_classes),
        "srd_feats_splat": len(splat_feats),
        **{cn: chunks[cn]["count"] for cn in NEW_CHUNKS},
    }


if __name__ == "__main__":
    summary = assemble()
    print("ASSEMBLE SUMMARY:", json.dumps(summary))
