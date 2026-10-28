#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Joyful-Fermi D&D 3.5e Canonical V2 SRD Compendium ETL Pipeline
==============================================================
Reads Foundry VTT D35E .db files + local srd_core_catalog.json enrichment
and emits the zero-patchwork Canonical V2 modular compendium into:
  - database/srd_*.json
  - webapp/database/srd_*.json
"""

import hashlib
import html
import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path

DB_DIR = Path(r"D:\Downloads\dnd 3.5 DB")
REPO_DIR = Path(r"C:\Users\tarum\Documents\antigravity\joyful-fermi")
OUT_DIR = REPO_DIR / "database"
WEBAPP_OUT_DIR = REPO_DIR / "webapp" / "database"

# ---------------------------------------------------------------------------
# Helpers: Slug, HTML Clean, Compendium Link Stripper
# ---------------------------------------------------------------------------

def slugify(text: str, prefix: str = "") -> str:
    s = (text or "").lower().strip()
    s = s.replace("'", "").replace("’", "").replace("+", " plus ")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    if prefix:
        return f"{prefix}-{s}"
    return s

COMPENDIUM_LINK_RE = re.compile(r"@Compendium\[[^\]]+\]\{([^}]+)\}")
INLINE_ROLL_RE = re.compile(r"\[\[/?(?:r|roll)?\s*([^\]]+)\]\]")
HTML_TAG_RE = re.compile(r"<[^>]+>")

def clean_html(raw: str) -> str:
    if not raw or not isinstance(raw, str):
        return ""
    txt = COMPENDIUM_LINK_RE.sub(r"<strong>\1</strong>", raw)
    txt = INLINE_ROLL_RE.sub(r"\1", txt)
    txt = txt.replace("\u00a0", " ").replace("&nbsp;", " ")
    return txt.strip()

def strip_to_plain(raw: str, max_len: int = 280) -> str:
    if not raw or not isinstance(raw, str):
        return ""
    txt = COMPENDIUM_LINK_RE.sub(r"\1", raw)
    txt = INLINE_ROLL_RE.sub(r"\1", txt)
    txt = HTML_TAG_RE.sub(" ", txt)
    txt = html.unescape(txt)
    txt = re.sub(r"\s+", " ", txt).strip()
    if max_len and len(txt) > max_len:
        return txt[: max_len - 1].rstrip() + "…"
    return txt

def parse_number(val, default=0):
    if val is None or val == "":
        return default
    if isinstance(val, (int, float)):
        return val
    try:
        if "." in str(val):
            return float(val)
        return int(val)
    except Exception:
        return default

# ---------------------------------------------------------------------------
# Canonical V2 Target & Bonus Type Mappings
# ---------------------------------------------------------------------------

FOUNDRY_SKILL_MAP = {
    "apr": "appraise",
    "aut": "autohypnosis",
    "blc": "balance",
    "blf": "bluff",
    "clm": "climb",
    "coc": "concentration",
    "crf": "craft",
    "dip": "diplomacy",
    "dev": "disable_device",
    "dis": "disguise",
    "dsc": "decipher_script",
    "esc": "escape_artist",
    "fog": "forgery",
    "gif": "gather_information",
    "han": "handle_animal",
    "hea": "heal",
    "hid": "hide",
    "int": "intimidate",
    "jmp": "jump",
    "kar": "knowledge_arcana",
    "kdu": "knowledge_dungeoneering",
    "ken": "knowledge_architecture",
    "kge": "knowledge_geography",
    "khi": "knowledge_history",
    "klo": "knowledge_local",
    "kna": "knowledge_nature",
    "kno": "knowledge_nobility",
    "kpl": "knowledge_planes",
    "kps": "knowledge_psionics",
    "kre": "knowledge_religion",
    "lis": "listen",
    "mos": "move_silently",
    "opl": "open_lock",
    "per": "perform",
    "pro": "profession",
    "psi": "psicraft",
    "rid": "ride",
    "sen": "sense_motive",
    "slt": "sleight_of_hand",
    "spl": "spellcraft",
    "spt": "spot",
    "src": "search",
    "sur": "survival",
    "swm": "swim",
    "tmb": "tumble",
    "umd": "use_magic_device",
    "uro": "use_rope",
    "ste": "stealth",
}

BONUS_TYPE_MAP = {
    "enh": "enhancement",
    "enhancement": "enhancement",
    "morale": "morale",
    "luck": "luck",
    "sacred": "sacred",
    "profane": "profane",
    "competence": "competence",
    "circumstance": "circumstance",
    "insight": "insight",
    "deflection": "deflection",
    "dodge": "dodge",
    "natural": "natural",
    "racial": "racial",
    "resist": "resistance",
    "resistance": "resistance",
    "inherent": "inherent",
    "trait": "trait",
    "penalty": "penalty",
    "base": "base",
    "replace": "replace",
    "untyped": "untyped",
    "": "untyped",
}

SUBTARGET_MAP = {
    "ability:str": "ability.str",
    "ability:dex": "ability.dex",
    "ability:con": "ability.con",
    "ability:int": "ability.int",
    "ability:wis": "ability.wis",
    "ability:cha": "ability.cha",
    "ac:ac": "ac.total",
    "ac:aac": "ac.armor",
    "ac:sac": "ac.shield",
    "ac:nac": "ac.natural",
    "attack:attack": "attack.all",
    "attack:babattack": "attack.bab",
    "damage:damage": "damage.all",
    "damage:wdamage": "damage.weapon",
    "savingThrows:allSavingThrows": "save.all",
    "savingThrows:fort": "save.fort",
    "savingThrows:ref": "save.ref",
    "savingThrows:will": "save.will",
    "misc:init": "init",
    "misc:mhp": "hp.max",
    "misc:cmb": "cmb",
    "misc:sneakAttack": "damage.sneakAttack",
    "misc:spellResistance": "sr",
    "misc:fortification": "fortification",
    "misc:fastHeal": "fastHealing",
    "misc:turnUndead": "turnUndead",
    "skills:skills": "skill.all",
    "speed:allSpeeds": "speed.all",
    "speed:landSpeed": "speed.land",
    "speed:flySpeed": "speed.fly",
    "speed:swimSpeed": "speed.swim",
    "speed:climbSpeed": "speed.climb",
    "psionic:powerPoints": "psionic.powerPoints",
    "prestigeCl:arcaneCl": "cl.arcane",
    "prestigeCl:divineCl": "cl.divine",
}

def normalize_formula(formula_str: str) -> str:
    if not formula_str:
        return "0"
    f = str(formula_str).strip()
    f = f.replace("@item.level", "@cl")
    return f

def convert_foundry_changes(changes_list) -> list:
    modifiers = []
    if not isinstance(changes_list, list):
        return modifiers
    for ch in changes_list:
        if not isinstance(ch, list) or len(ch) < 4:
            continue
        raw_formula, cat, sub, btype = str(ch[0]).strip(), str(ch[1]).strip(), str(ch[2]).strip(), str(ch[3]).strip()
        key = f"{cat}:{sub}"
        if key in SUBTARGET_MAP:
            target = SUBTARGET_MAP[key]
        elif cat == "skill" and sub.startswith("skill."):
            sk_code = sub.split(".", 1)[1]
            sk_slug = FOUNDRY_SKILL_MAP.get(sk_code, sk_code)
            target = f"skill.{sk_slug}"
        elif cat == "spells" and "spell" in sub:
            m = re.search(r"spell(\d+)\.bonus", sub)
            target = f"spellSlot.level{m.group(1)}" if m else "spellSlot.bonus"
        else:
            target = f"{cat}.{sub}" if sub else cat

        norm_type = BONUS_TYPE_MAP.get(btype.lower(), btype.lower() or "untyped")
        # In Foundry, ac:aac with type 'base' is Armor bonus; ac:sac with 'base' is Shield bonus; ac:nac with 'enh' is Natural Armor Enhancement
        if target == "ac.armor" and norm_type == "base":
            norm_type = "armor"
        elif target == "ac.shield" and norm_type == "base":
            norm_type = "shield"
        elif target == "ac.natural" and norm_type == "enhancement":
            norm_type = "natural_enhancement"

        clean_form = normalize_formula(raw_formula)
        num_val = parse_number(clean_form, None)
        modifiers.append({
            "target": target,
            "value": num_val if isinstance(num_val, (int, float)) else 0,
            "formula": clean_form,
            "type": norm_type,
            "condition": None,
        })
    return modifiers

# ---------------------------------------------------------------------------
# Damage Type & DamageParts Normalization
# ---------------------------------------------------------------------------

DMG_CODE_MAP = {
    "P": "Piercing",
    "S": "Slashing",
    "B": "Bludgeoning",
    "P or S": "Piercing/Slashing",
    "B or P": "Bludgeoning/Piercing",
    "B and P": "Bludgeoning & Piercing",
    "P and S": "Piercing & Slashing",
}

def normalize_dmg_type(raw_type: str) -> str:
    if not raw_type:
        return "Untyped"
    t = str(raw_type).strip()
    return DMG_CODE_MAP.get(t, t.title() if t.islower() else t)

def build_weapon_damage_parts(dice_str: str, dmg_type: str, bonus: int = 0, source: str = "Base") -> list:
    if not dice_str:
        return []
    d = str(dice_str).strip()
    # Check if Burst formula like '1d6+(((@critMult))-(1))d10'
    if "@critMult" in d and "d10" in d:
        base_dice = d.split("+")[0].strip()
        return [
            {
                "dice": base_dice,
                "bonus": 0,
                "type": normalize_dmg_type(dmg_type),
                "multiplyOnCrit": False,
                "onCritOnly": False,
                "source": source,
            },
            {
                "dice": "1d10",
                "bonus": 0,
                "type": normalize_dmg_type(dmg_type),
                "multiplyOnCrit": False,
                "onCritOnly": True,
                "critScaleByMult": True,
                "source": f"{source} (Crit)",
            },
        ]
    return [
        {
            "dice": d,
            "bonus": bonus,
            "type": normalize_dmg_type(dmg_type),
            "multiplyOnCrit": source == "Base",
            "onCritOnly": False,
            "source": source,
        }
    ]

def convert_spell_damage_parts(damage_obj: dict, source_name: str = "Spell") -> list:
    parts = []
    if not isinstance(damage_obj, dict):
        return parts
    raw_parts = damage_obj.get("parts", [])
    if not isinstance(raw_parts, list):
        return parts
    for pt in raw_parts:
        if isinstance(pt, list) and len(pt) >= 2:
            raw_formula = normalize_formula(str(pt[0]))
            raw_dtype = pt[1]
            if isinstance(raw_dtype, dict):
                dtype_str = raw_dtype.get("custom") or raw_dtype.get("values", ["Untyped"])[0]
            else:
                dtype_str = str(raw_dtype or "Untyped")
            parts.append({
                "dice": raw_formula,
                "bonus": 0,
                "type": normalize_dmg_type(dtype_str),
                "multiplyOnCrit": False,
                "onCritOnly": False,
                "source": source_name,
            })
    return parts

# ---------------------------------------------------------------------------
# Slot Mapping
# ---------------------------------------------------------------------------

FOUNDRY_SLOT_MAP = {
    "head": "Head",
    " headband": "Head",
    "headband": "Head",
    "eyes": "Eyes",
    "neck": "Neck",
    "shoulders": "Shoulders",
    "body": "Body",
    "chest": "Torso",
    "torso": "Torso",
    "belt": "Waist",
    "waist": "Waist",
    "wrists": "Wrists",
    "hands": "Hands",
    "ring": "Ring",
    "feet": "Feet",
    "shield": "Off-Hand/Shield",
    "armor": "Armor",
    "slotless": "Slotless",
}

def map_slot(raw_slot: str, eq_type: str = "", weapon_sub: str = "") -> str:
    if eq_type == "armor":
        return "Armor"
    if eq_type == "shield":
        return "Off-Hand/Shield"
    if weapon_sub == "2h" or weapon_sub == "ranged":
        return "Two-Hand"
    if weapon_sub in ("light", "1h"):
        return "Main Hand"
    s = (raw_slot or "").lower().strip()
    return FOUNDRY_SLOT_MAP.get(s, "Slotless")

# ---------------------------------------------------------------------------
# Load Local srd_core_catalog.json Enrichment Map
# ---------------------------------------------------------------------------

def load_local_catalog_enrichment():
    cat_path = REPO_DIR / "srd_core_catalog.json"
    if not cat_path.exists():
        return {}, {}, []
    entries = json.loads(cat_path.read_text(encoding="utf-8"))
    by_name = {}
    children_by_parent = {}
    custom_entries = []

    for e in entries:
        name = (e.get("name") or "").strip()
        parent = e.get("parent")
        if parent or "↳" in name:
            p_key = (parent or "").lower().strip()
            if "bastard sword" in p_key:
                p_key = "bastard sword"
            elif "dwarven waraxe" in p_key:
                p_key = "dwarven waraxe"
            children_by_parent.setdefault(p_key, []).append(e)
            continue

        norm_name = name.lower()
        if "bastard sword" in norm_name:
            norm_name = "bastard sword"
        elif "dwarven waraxe" in norm_name:
            norm_name = "dwarven waraxe"
        by_name[norm_name] = e

        # Keep custom entries not in standard Foundry SRD (Warlock Invocations, Tome of Battle Martial feats)
        if e.get("category") in ("Warlock Invocation", "Martial") and e.get("type") in ("Special Ability", "Feat"):
            custom_entries.append(e)

    return by_name, children_by_parent, custom_entries

# ---------------------------------------------------------------------------
# 1. Build srd_equipment.json
# ---------------------------------------------------------------------------

SPECIAL_MATERIAL_MODS = {
    "mithral": {
        "armorMod": {"maxDexBonusIncrease": 2, "acpReduction": 3, "asfReduction": 10, "speedCategoryStepDown": 1, "weightMult": 0.5},
        "bypassDR": "silver",
        "summary": "Half weight; Armor/Shield: +2 Max Dex, ACP reduced by 3 (min 0), -10% ASF, Medium/Heavy treated as one category lighter for movement.",
    },
    "adamantine": {
        "armorMod": {"drByCategory": {"Light": "1/-", "Medium": "2/-", "Heavy": "3/-"}, "acpReduction": 1},
        "weaponMod": {"ignoreHardnessBelow": 20, "attackMasterworkBonus": 1},
        "bypassDR": "adamantine",
        "summary": "Weapon: bypasses hardness < 20 and Adamantine DR. Armor: grants DR 1/- (Light), 2/- (Medium), or 3/- (Heavy).",
    },
    "darkwood": {
        "armorMod": {"acpReduction": 2, "weightMult": 0.5},
        "weaponMod": {"weightMult": 0.5, "attackMasterworkBonus": 1},
        "summary": "Wooden masterwork items weigh half as much; Darkwood shield ACP reduced by 2.",
    },
    "cold iron": {
        "bypassDR": "cold iron",
        "summary": "Mined deep underground and forged at lower temperature; bypasses Cold Iron DR (Fey/Demons).",
    },
    "alchemical silver": {
        "weaponMod": {"damagePenalty": -1},
        "bypassDR": "silver",
        "summary": "Bypasses Silver DR (Lycanthropes/Devils), -1 penalty on weapon damage rolls.",
    },
}

def build_weapon_modes(name: str, prof: str, handedness: str, dmg_parts: list, crit_range: int, crit_mult: int, rng: int, rule_flags: dict, children: list) -> list:
    modes = []
    norm_name = name.lower()

    # Special case: Bastard Sword & Dwarven Waraxe
    if norm_name in ("bastard sword", "dwarven waraxe"):
        modes.append({
            "id": "1h-exotic",
            "label": "One-Handed (Exotic)",
            "handedness": "1h",
            "proficiency": "Exotic",
            "combatScope": "melee",
            "strMult": 1.0,
            "critRange": crit_range,
            "critMult": crit_mult,
            "damageParts": dmg_parts,
            "modifiers": [],
            "ruleFlags": dict(rule_flags),
        })
        modes.append({
            "id": "2h-martial",
            "label": "Two-Handed (Martial)",
            "handedness": "2h",
            "proficiency": "Martial",
            "combatScope": "melee",
            "strMult": 1.5,
            "critRange": crit_range,
            "critMult": crit_mult,
            "damageParts": dmg_parts,
            "modifiers": [],
            "ruleFlags": {**rule_flags, "twoHanded": True},
        })
        return modes

    # Special case: Lance
    if norm_name == "lance":
        modes.append({
            "id": "2h-melee",
            "label": "Two-Handed",
            "handedness": "2h",
            "proficiency": prof,
            "combatScope": "melee",
            "strMult": 1.5,
            "critRange": crit_range,
            "critMult": crit_mult,
            "damageParts": dmg_parts,
            "modifiers": [],
            "ruleFlags": dict(rule_flags),
        })
        modes.append({
            "id": "1h-mounted",
            "label": "Mounted One-Handed",
            "handedness": "1h",
            "proficiency": prof,
            "combatScope": "melee",
            "strMult": 1.5,
            "critRange": crit_range,
            "critMult": crit_mult,
            "damageParts": dmg_parts,
            "modifiers": [],
            "ruleFlags": {**rule_flags, "mountedChargeDouble": True},
        })
        return modes

    # Special case: Double Weapons
    if rule_flags.get("doubleWeapon") or children:
        modes.append({
            "id": "primary-head",
            "label": "Primary Head (TWF)",
            "handedness": "1h",
            "proficiency": prof,
            "combatScope": "melee",
            "strMult": 1.0,
            "critRange": crit_range,
            "critMult": crit_mult,
            "damageParts": dmg_parts,
            "modifiers": [],
            "ruleFlags": dict(rule_flags),
        })
        for ch in children:
            ch_dice = ch.get("dice") or (dmg_parts[0]["dice"] if dmg_parts else "1d6")
            ch_dtype = ch.get("dmgType") or (dmg_parts[0]["type"] if dmg_parts else "Bludgeoning")
            ch_cmin = parse_number(ch.get("critMin"), crit_range)
            ch_cmult = parse_number(ch.get("critMult"), crit_mult)
            modes.append({
                "id": "offhand-head",
                "label": "Off-Hand Head (TWF)",
                "handedness": "light",
                "proficiency": prof,
                "combatScope": "melee",
                "strMult": 0.5,
                "critRange": ch_cmin,
                "critMult": ch_cmult,
                "damageParts": build_weapon_damage_parts(ch_dice, ch_dtype, 0, "Off-Hand Head"),
                "modifiers": [],
                "ruleFlags": {"isLight": True, "doubleWeaponOffHand": True},
            })
        modes.append({
            "id": "2h-single",
            "label": "Single Head (Two-Handed)",
            "handedness": "2h",
            "proficiency": prof,
            "combatScope": "melee",
            "strMult": 1.5,
            "critRange": crit_range,
            "critMult": crit_mult,
            "damageParts": dmg_parts,
            "modifiers": [],
            "ruleFlags": {**rule_flags, "twoHanded": True},
        })
        return modes

    # Standard Ranged
    if handedness == "ranged":
        modes.append({
            "id": "ranged",
            "label": "Ranged",
            "handedness": "ranged",
            "proficiency": prof,
            "combatScope": "ranged",
            "strMult": 1.0 if "composite" in norm_name or rule_flags.get("thrown") else 0.0,
            "rangeIncrement": rng,
            "critRange": crit_range,
            "critMult": crit_mult,
            "damageParts": dmg_parts,
            "modifiers": [],
            "ruleFlags": dict(rule_flags),
        })
        return modes

    # Standard Light Melee
    if handedness == "light":
        modes.append({
            "id": "melee-light",
            "label": "Melee (Light)",
            "handedness": "light",
            "proficiency": prof,
            "combatScope": "melee",
            "strMult": 1.0,
            "critRange": crit_range,
            "critMult": crit_mult,
            "damageParts": dmg_parts,
            "modifiers": [],
            "ruleFlags": dict(rule_flags),
        })
    elif handedness == "1h":
        modes.append({
            "id": "melee-1h",
            "label": "One-Handed",
            "handedness": "1h",
            "proficiency": prof,
            "combatScope": "melee",
            "strMult": 1.0,
            "critRange": crit_range,
            "critMult": crit_mult,
            "damageParts": dmg_parts,
            "modifiers": [],
            "ruleFlags": dict(rule_flags),
        })
        modes.append({
            "id": "melee-2h",
            "label": "Two-Handed",
            "handedness": "2h",
            "proficiency": prof,
            "combatScope": "melee",
            "strMult": 1.5,
            "critRange": crit_range,
            "critMult": crit_mult,
            "damageParts": dmg_parts,
            "modifiers": [],
            "ruleFlags": {**rule_flags, "twoHanded": True},
        })
    else:  # 2h melee
        modes.append({
            "id": "melee-2h",
            "label": "Two-Handed",
            "handedness": "2h",
            "proficiency": prof,
            "combatScope": "melee",
            "strMult": 1.5,
            "critRange": crit_range,
            "critMult": crit_mult,
            "damageParts": dmg_parts,
            "modifiers": [],
            "ruleFlags": {**rule_flags, "twoHanded": True},
        })

    # Add Thrown mode if weapon is throwable
    if rule_flags.get("thrown") or (rng and rng > 0 and handedness != "ranged"):
        modes.append({
            "id": "thrown",
            "label": f"Thrown ({rng or 10} ft.)",
            "handedness": handedness,
            "proficiency": prof,
            "combatScope": "ranged",
            "strMult": 1.0,
            "rangeIncrement": rng or 10,
            "critRange": crit_range,
            "critMult": crit_mult,
            "damageParts": dmg_parts,
            "modifiers": [],
            "ruleFlags": {**rule_flags, "thrown": True},
        })

    return modes

def process_equipment(local_by_name: dict, children_by_parent: dict) -> list:
    equipment = []
    seen_ids = set()

    # 1A. Weapons & Ammo
    with open(DB_DIR / "weapons-and-ammo.db", "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            obj = json.loads(line)
            name = obj.get("name", "").strip()
            d = obj.get("data", {})
            ftype = obj.get("type", "weapon")
            norm_name = name.lower()
            local_match = local_by_name.get(norm_name, {})

            if ftype == "loot" or d.get("subType") == "ammo":
                item_id = slugify(name, "ammo")
                if item_id in seen_ids:
                    continue
                seen_ids.add(item_id)
                desc = clean_html(d.get("description", {}).get("value", ""))
                equipment.append({
                    "id": item_id,
                    "foundryId": obj.get("_id"),
                    "schemaVersion": 2,
                    "name": name,
                    "type": "Ammo",
                    "category": "Ammunition",
                    "slot": "Slotless",
                    "source": local_match.get("source", "SRD 3.5e"),
                    "cost": parse_number(d.get("price"), 0),
                    "weight": parse_number(d.get("weight"), 0),
                    "quantity": parse_number(d.get("quantity"), 1),
                    "description": desc,
                    "shortDescription": local_match.get("benefit") or strip_to_plain(desc, 200),
                    "tags": ["ammo", "ammunition"],
                    "modifiers": convert_foundry_changes(d.get("changes", [])),
                    "damageParts": [],
                    "modes": [],
                    "ruleFlags": {},
                })
                continue

            item_id = slugify(name, "wpn")
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            wtype = (d.get("weaponType") or "simple").title()
            wsub = (d.get("weaponSubtype") or "1h").lower()
            wdata = d.get("weaponData", {})
            props = d.get("properties", {})

            dice_roll = wdata.get("damageRoll") or local_match.get("dice") or "1d4"
            dmg_type = normalize_dmg_type(wdata.get("damageType") or local_match.get("dmgType") or "Bludgeoning")
            crit_range = parse_number(wdata.get("critRange"), local_match.get("critMin", 20))
            crit_mult = parse_number(wdata.get("critMult"), local_match.get("critMult", 2))
            rng = parse_number(wdata.get("range"), local_match.get("range", 0))

            local_flags = local_match.get("ruleFlags", {})
            is_light = (wsub == "light") or bool(local_match.get("isLight"))
            finessable = is_light or bool(props.get("fin")) or bool(local_flags.get("finessable")) or bool(local_match.get("finessable"))
            rule_flags = {
                "isLight": is_light,
                "twoHanded": wsub in ("2h", "ranged"),
                "finessable": finessable,
                "reach": bool(props.get("rch")) or bool(local_flags.get("reach")),
                "brace": bool(props.get("brc")) or bool(local_flags.get("brace")),
                "doubleWeapon": bool(props.get("dbl")) or bool(local_flags.get("doubleWeapon")),
                "thrown": bool(props.get("thr")) or bool(local_flags.get("thrown")),
                "trip": bool(props.get("trp")) or bool(local_flags.get("trip")),
                "disarm": bool(props.get("dis")) or bool(local_flags.get("disarm")),
                "nonlethal": bool(props.get("nnl")) or bool(local_flags.get("nonlethal")),
                "monk": bool(props.get("mnk")) or bool(local_flags.get("monk")),
            }
            # Remove False flags to keep JSON clean
            rule_flags = {k: v for k, v in rule_flags.items() if v}

            dmg_parts = build_weapon_damage_parts(dice_roll, dmg_type, 0, "Base")
            children = children_by_parent.get(norm_name, [])
            modes = build_weapon_modes(name, wtype, wsub, dmg_parts, crit_range, crit_mult, rng, rule_flags, children)

            desc = clean_html(d.get("description", {}).get("value", ""))
            tags = list({wtype.lower(), wsub, dmg_type.lower(), *rule_flags.keys()})

            equipment.append({
                "id": item_id,
                "foundryId": obj.get("_id"),
                "schemaVersion": 2,
                "name": name,
                "type": "Weapon",
                "category": wtype,
                "handedness": wsub,
                "slot": map_slot("", "weapon", wsub),
                "source": local_match.get("source", "SRD 3.5e"),
                "cost": parse_number(d.get("price"), local_match.get("cost", 0)),
                "weight": parse_number(d.get("weight"), local_match.get("weight", 0)),
                "critRange": crit_range,
                "critMult": crit_mult,
                "rangeIncrement": rng,
                "description": desc,
                "shortDescription": local_match.get("benefit") or strip_to_plain(desc, 220),
                "tags": sorted(tags),
                "modifiers": convert_foundry_changes(d.get("changes", [])),
                "damageParts": dmg_parts,
                "modes": modes,
                "ruleFlags": rule_flags,
            })

    # Ensure any weapon in local srd_core_catalog.json that wasn't in weapons-and-ammo.db is also included
    for norm_name, loc in local_by_name.items():
        if loc.get("type") != "Weapon":
            continue
        clean_name = "Bastard Sword" if "bastard sword" in norm_name else ("Dwarven Waraxe" if "dwarven waraxe" in norm_name else loc["name"])
        item_id = slugify(clean_name, "wpn")
        if item_id in seen_ids:
            continue
        seen_ids.add(item_id)
        wtype = loc.get("category", "Martial")
        wsub = "light" if loc.get("isLight") else ("ranged" if loc.get("combatScope") == "ranged" else ("2h" if "Two-Handed" in (loc.get("weaponType") or "") else "1h"))
        crit_range = parse_number(loc.get("critMin"), 20)
        crit_mult = parse_number(loc.get("critMult"), 2)
        rng = parse_number(loc.get("range"), 0)
        rflags = dict(loc.get("ruleFlags") or {})
        if loc.get("isLight"):
            rflags["isLight"] = True
        if loc.get("finessable"):
            rflags["finessable"] = True
        dmg_parts = build_weapon_damage_parts(loc.get("dice", "1d6"), loc.get("dmgType", "Slashing"), 0, "Base")
        children = children_by_parent.get(norm_name, [])
        modes = build_weapon_modes(clean_name, wtype, wsub, dmg_parts, crit_range, crit_mult, rng, rflags, children)
        equipment.append({
            "id": item_id,
            "foundryId": None,
            "schemaVersion": 2,
            "name": clean_name,
            "type": "Weapon",
            "category": wtype,
            "handedness": wsub,
            "slot": map_slot("", "weapon", wsub),
            "source": loc.get("source", "SRD 3.5e"),
            "cost": parse_number(loc.get("cost"), 0),
            "weight": parse_number(loc.get("weight"), 0),
            "critRange": crit_range,
            "critMult": crit_mult,
            "rangeIncrement": rng,
            "description": loc.get("benefit", ""),
            "shortDescription": loc.get("benefit", ""),
            "tags": sorted(list(set(loc.get("tags", [])))),
            "modifiers": [],
            "damageParts": dmg_parts,
            "modes": modes,
            "ruleFlags": rflags,
        })

    # 1B. Armors & Shields
    with open(DB_DIR / "armors-and-shields.db", "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            obj = json.loads(line)
            name = obj.get("name", "").strip()
            d = obj.get("data", {})
            eq_type = (d.get("equipmentType") or "armor").lower()
            eq_sub = (d.get("equipmentSubtype") or "lightArmor").lower()
            is_shield = eq_type == "shield" or "shield" in eq_sub or "buckler" in name.lower()
            v2_type = "Shield" if is_shield else "Armor"
            prefix = "shd" if is_shield else "arm"
            item_id = slugify(name, prefix)
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            local_match = local_by_name.get(name.lower(), {})
            armor_blk = d.get("armor", {})
            ac_val = parse_number(armor_blk.get("value"), local_match.get("acBonus", 0))
            max_dex = parse_number(armor_blk.get("dex"), None)
            acp_raw = parse_number(armor_blk.get("acp"), 0)
            acp = -abs(acp_raw) if acp_raw != 0 else 0
            asf = parse_number(d.get("spellFailure"), local_match.get("spellFailure", 0))

            cat_label = "Shield" if is_shield else ("Light" if "light" in eq_sub else ("Medium" if "medium" in eq_sub else "Heavy"))
            mods = convert_foundry_changes(d.get("changes", []))
            if ac_val > 0:
                mods.insert(0, {
                    "target": "ac.shield" if is_shield else "ac.armor",
                    "value": ac_val,
                    "formula": str(ac_val),
                    "type": "shield" if is_shield else "armor",
                    "condition": None,
                })
            if "tower shield" in name.lower():
                mods.append({
                    "target": "attack.all",
                    "value": -2,
                    "formula": "-2",
                    "type": "penalty",
                    "condition": "Tower Shield Encumbrance",
                })

            desc = clean_html(d.get("description", {}).get("value", ""))
            equipment.append({
                "id": item_id,
                "foundryId": obj.get("_id"),
                "schemaVersion": 2,
                "name": name,
                "type": v2_type,
                "category": cat_label,
                "slot": "Off-Hand/Shield" if is_shield else "Armor",
                "source": local_match.get("source", "SRD 3.5e"),
                "cost": parse_number(d.get("price"), local_match.get("cost", 0)),
                "weight": parse_number(d.get("weight"), local_match.get("weight", 0)),
                "acBonus": ac_val,
                "maxDex": max_dex,
                "checkPenalty": acp,
                "spellFailure": asf,
                "speed30": local_match.get("speed30", "20 ft." if cat_label in ("Medium", "Heavy") else "30 ft."),
                "speed20": local_match.get("speed20", "15 ft." if cat_label in ("Medium", "Heavy") else "20 ft."),
                "description": desc,
                "shortDescription": local_match.get("benefit") or strip_to_plain(desc, 220),
                "tags": [v2_type.lower(), cat_label.lower()],
                "modifiers": mods,
                "damageParts": [],
                "modes": [],
                "ruleFlags": dict(local_match.get("ruleFlags") or {}),
            })

    # 1C. Special Materials (materials.db + core D&D 3.5e special materials)
    with open(DB_DIR / "materials.db", "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            obj = json.loads(line)
            name = obj.get("name", "").strip()
            d = obj.get("data", {})
            item_id = slugify(name, "mat")
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)
            desc = clean_html(d.get("description", {}).get("value", ""))
            spec = SPECIAL_MATERIAL_MODS.get(name.lower(), {})
            equipment.append({
                "id": item_id,
                "foundryId": obj.get("_id"),
                "schemaVersion": 2,
                "name": name,
                "type": "Material",
                "category": "Special Material",
                "slot": "None",
                "source": "SRD 3.5e",
                "hardness": parse_number(d.get("hardness"), 10),
                "hpPerInch": parse_number(d.get("hpPerInch"), 20),
                "description": desc,
                "shortDescription": spec.get("summary") or strip_to_plain(desc, 220),
                "tags": ["material", slugify(name)],
                "modifiers": convert_foundry_changes(d.get("changes", [])),
                "damageParts": [],
                "modes": [],
                "ruleFlags": spec,
            })

    # Ensure core special materials (Mithral, Adamantine, Darkwood, Cold Iron, Alchemical Silver) exist even if not in materials.db
    for mat_key, spec in SPECIAL_MATERIAL_MODS.items():
        mat_id = slugify(mat_key, "mat")
        if mat_id not in seen_ids:
            seen_ids.add(mat_id)
            equipment.append({
                "id": mat_id,
                "foundryId": None,
                "schemaVersion": 2,
                "name": mat_key.title(),
                "type": "Material",
                "category": "Special Material",
                "slot": "None",
                "source": "SRD 3.5e / DMG p.283",
                "hardness": 20 if mat_key == "adamantine" else (15 if mat_key == "mithral" else 10),
                "hpPerInch": 40 if mat_key == "adamantine" else 30,
                "description": f"<p>{spec['summary']}</p>",
                "shortDescription": spec["summary"],
                "tags": ["material", slugify(mat_key)],
                "modifiers": [],
                "damageParts": [],
                "modes": [],
                "ruleFlags": spec,
            })

    # 1D. Weapon & Armor Enhancements (enhancements.db)
    with open(DB_DIR / "enhancements.db", "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            obj = json.loads(line)
            name = obj.get("name", "").strip()
            d = obj.get("data", {})
            item_id = slugify(name, "enh")
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)
            enh_type = (d.get("enhancementType") or "weapon").title()
            wdata = d.get("weaponData", {})
            props = d.get("properties", {})
            dmg_parts = []
            if wdata.get("damageRoll"):
                dmg_parts = build_weapon_damage_parts(wdata["damageRoll"], wdata.get("damageType") or "Untyped", 0, name)

            rflags = {}
            if props.get("kee") or "keen" in name.lower():
                rflags["keen"] = True
            if props.get("spd") or "speed" in name.lower():
                rflags["speed"] = True
            if props.get("thr") or "throwing" in name.lower():
                rflags["thrown"] = True
            if props.get("def") or "defending" in name.lower():
                rflags["defending"] = True
            if "fortification" in name.lower():
                rflags["fortification"] = 25 if "light" in name.lower() else (75 if "moderate" in name.lower() else 100)

            desc = clean_html(d.get("description", {}).get("value", ""))
            equipment.append({
                "id": item_id,
                "foundryId": obj.get("_id"),
                "schemaVersion": 2,
                "name": name,
                "type": "Enhancement",
                "category": f"{enh_type} Enhancement",
                "slot": "None",
                "source": "SRD 3.5e / DMG",
                "enhIncrease": parse_number(d.get("enhIncrease"), 0),
                "flatCost": parse_number(d.get("price"), 0),
                "casterLevel": parse_number(d.get("baseCl"), 0),
                "requirements": d.get("requirements", ""),
                "description": desc,
                "shortDescription": strip_to_plain(desc, 220),
                "tags": ["enhancement", enh_type.lower()],
                "modifiers": convert_foundry_changes(d.get("changes", [])),
                "damageParts": dmg_parts,
                "modes": [],
                "ruleFlags": rflags,
            })

    # 1E. Magic Items (magic-items.db) & Mundane Gear (items.db)
    for db_name, v2_type, id_prefix in [("magic-items.db", "MagicItem", "mi"), ("items.db", "Gear", "gear")]:
        with open(DB_DIR / db_name, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                obj = json.loads(line)
                name = obj.get("name", "").strip()
                d = obj.get("data", {})
                item_id = slugify(name, id_prefix)
                if item_id in seen_ids:
                    continue
                seen_ids.add(item_id)

                eq_type = (d.get("equipmentType") or d.get("subType") or "wondrous").lower()
                eq_sub = (d.get("equipmentSubtype") or "wondrous").lower()
                slot = map_slot(d.get("slot", ""), eq_type, "")
                desc = clean_html(d.get("description", {}).get("value", "") or d.get("unidentified", {}).get("description", ""))
                mods = convert_foundry_changes(d.get("changes", []))

                equipment.append({
                    "id": item_id,
                    "foundryId": obj.get("_id"),
                    "schemaVersion": 2,
                    "name": name,
                    "type": v2_type,
                    "category": eq_sub.title(),
                    "slot": slot,
                    "source": "SRD 3.5e",
                    "cost": parse_number(d.get("price"), 0),
                    "weight": parse_number(d.get("weight"), 0),
                    "casterLevel": parse_number(d.get("baseCl"), 0),
                    "description": desc,
                    "shortDescription": strip_to_plain(desc, 220),
                    "tags": [v2_type.lower(), eq_sub, slot.lower()],
                    "modifiers": mods,
                    "damageParts": convert_spell_damage_parts(d.get("damage", {}), name),
                    "modes": [],
                    "ruleFlags": {},
                })

    return equipment

# ---------------------------------------------------------------------------
# 2. Build srd_feats.json (Feats + Tome of Battle + Warlock Invocations)
# ---------------------------------------------------------------------------

PREREQ_ABILITY_RE = re.compile(r"\b(Str|Dex|Con|Int|Wis|Cha)\s+(\d+)\b", re.IGNORECASE)
PREREQ_BAB_RE = re.compile(r"base attack bonus\s*\+?(\d+)", re.IGNORECASE)
PREREQ_CASTER_RE = re.compile(r"caster level\s*(\d+)", re.IGNORECASE)

def extract_feat_prereq_text(desc_html: str) -> str:
    if not desc_html:
        return ""
    m = re.search(r"Prerequisites?:?\s*</(?:b|strong)>\s*([^<]+)", desc_html, re.IGNORECASE)
    if m:
        return html.unescape(m.group(1)).strip().rstrip(".")
    return ""

def parse_prereq_struct(prereq_str) -> dict:
    if not prereq_str:
        return {}
    if isinstance(prereq_str, list):
        prereq_str = ", ".join(str(x) for x in prereq_str if x)
    else:
        prereq_str = str(prereq_str)
    struct = {}
    abilities = {}
    for ab_m in PREREQ_ABILITY_RE.finditer(prereq_str):
        abilities[ab_m.group(1).lower()] = int(ab_m.group(2))
    if abilities:
        struct["abilities"] = abilities
    bab_m = PREREQ_BAB_RE.search(prereq_str)
    if bab_m:
        struct["bab"] = int(bab_m.group(1))
    cl_m = PREREQ_CASTER_RE.search(prereq_str)
    if cl_m:
        struct["casterLevel"] = int(cl_m.group(1))
    return struct

def process_feats(local_by_name: dict, custom_entries: list) -> list:
    feats = []
    seen_ids = set()

    with open(DB_DIR / "feats.db", "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            obj = json.loads(line)
            name = obj.get("name", "").strip()
            d = obj.get("data", {})
            item_id = slugify(name, "feat")
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            local_match = local_by_name.get(name.lower(), {})
            desc = clean_html(d.get("description", {}).get("value", ""))
            raw_req = d.get("requirements", "")
            if isinstance(raw_req, list):
                raw_req = ", ".join(str(x) for x in raw_req if x)
            prereq_text = local_match.get("prereq") or extract_feat_prereq_text(desc) or str(raw_req or "")
            is_fighter = bool(local_match.get("isFighterBonusFeat")) or ("fighter bonus feat" in desc.lower())
            cat = local_match.get("category") or ("Fighter" if is_fighter else ("Metamagic" if d.get("metamagic", {}).get("enabled") else "General"))

            feats.append({
                "id": item_id,
                "foundryId": obj.get("_id"),
                "schemaVersion": 2,
                "name": name,
                "type": "Feat",
                "category": cat,
                "slot": "None",
                "source": local_match.get("source", "SRD 3.5e"),
                "isFighterBonusFeat": is_fighter,
                "prerequisites": prereq_text,
                "prereqStruct": parse_prereq_struct(prereq_text),
                "description": desc or local_match.get("description", ""),
                "shortDescription": local_match.get("benefit") or strip_to_plain(desc, 240),
                "tags": sorted(list({"feat", cat.lower(), *(["fighter"] if is_fighter else [])})),
                "modifiers": convert_foundry_changes(d.get("changes", [])),
                "damageParts": [],
                "modes": [],
                "ruleFlags": dict(local_match.get("ruleFlags") or {}),
            })

    # Merge any local catalog Feats & Warlock Invocations not in Foundry feats.db
    for loc in list(local_by_name.values()) + custom_entries:
        ltype = loc.get("type")
        if ltype not in ("Feat", "Special Ability"):
            continue
        name = loc.get("name", "").strip()
        prefix = "inv" if loc.get("category") == "Warlock Invocation" else "feat"
        item_id = slugify(name, prefix)
        if item_id in seen_ids or slugify(name, "feat") in seen_ids:
            continue
        seen_ids.add(item_id)

        prereq_text = loc.get("prereq", "")
        is_fighter = bool(loc.get("isFighterBonusFeat"))
        cat = loc.get("category", "General")
        feats.append({
            "id": item_id,
            "foundryId": None,
            "schemaVersion": 2,
            "name": name,
            "type": "SpecialAbility" if ltype == "Special Ability" else "Feat",
            "category": cat,
            "tier": loc.get("tier"),
            "minLevel": loc.get("minLevel"),
            "slot": "None",
            "source": loc.get("source", "SRD 3.5e"),
            "isFighterBonusFeat": is_fighter,
            "prerequisites": prereq_text,
            "prereqStruct": parse_prereq_struct(prereq_text),
            "description": loc.get("description") or loc.get("benefit", ""),
            "shortDescription": loc.get("benefit") or loc.get("description", ""),
            "tags": sorted(list({ltype.lower(), cat.lower(), *(loc.get("tags") or [])})),
            "modifiers": [],
            "damageParts": [],
            "modes": [],
            "ruleFlags": dict(loc.get("ruleFlags") or {}),
        })

    return feats

# ---------------------------------------------------------------------------
# 3. Build srd_classes_races.json (Classes, Class Abilities, Races, Racial Abilities)
# ---------------------------------------------------------------------------

def convert_spell_progression(matrix: list) -> dict:
    """Converts Foundry [[lvl, s0, s1, ..., s9], ...] into { "1": [s0..s9], ... }"""
    out = {}
    if not isinstance(matrix, list):
        return out
    for row in matrix:
        if isinstance(row, list) and len(row) >= 2:
            lvl = str(row[0])
            slots = [int(x) if isinstance(x, (int, float)) and x >= 0 else None for x in row[1:]]
            if any(s is not None for s in slots):
                out[lvl] = slots
    return out

def process_classes_and_races(local_by_name: dict) -> list:
    records = []
    seen_ids = set()

    # 3A. Classes (classes.db)
    with open(DB_DIR / "classes.db", "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            obj = json.loads(line)
            name = obj.get("name", "").strip()
            d = obj.get("data", {})
            item_id = slugify(name, "cls")
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            c_skills = [FOUNDRY_SKILL_MAP.get(k, k) for k, v in (d.get("classSkills") or {}).items() if v]
            saves = d.get("savingThrows", {})
            desc = clean_html(d.get("description", {}).get("value", ""))

            records.append({
                "id": item_id,
                "foundryId": obj.get("_id"),
                "schemaVersion": 2,
                "name": name,
                "type": "Class",
                "category": (d.get("classType") or "base").title(),
                "slot": "None",
                "source": "SRD 3.5e",
                "hitDie": parse_number(d.get("hd"), 8),
                "babProgression": d.get("bab", "med"),
                "skillPointsPerLevel": parse_number(d.get("skillsPerLevel"), 2),
                "savingThrows": {
                    "fort": saves.get("fort", {}).get("value", "low"),
                    "ref": saves.get("ref", {}).get("value", "low"),
                    "will": saves.get("will", {}).get("value", "low"),
                },
                "classSkills": sorted(list(set(c_skills))),
                "spellcasting": {
                    "type": d.get("spellcastingType") or None,
                    "ability": d.get("spellcastingAbility") or None,
                    "spontaneous": bool(d.get("spellcastingSpontaneus")),
                    "spellsPerDay": convert_spell_progression(d.get("spellsPerLevel", [])),
                    "spellsKnown": convert_spell_progression(d.get("spellsKnownPerLevel", [])),
                } if d.get("spellcastingType") else None,
                "addedAbilities": d.get("addedAbilities", []),
                "description": desc,
                "shortDescription": strip_to_plain(desc, 240),
                "tags": ["class", (d.get("classType") or "base").lower()],
                "modifiers": convert_foundry_changes(d.get("changes", [])),
                "damageParts": [],
                "modes": [],
                "ruleFlags": {},
            })

    # 3B. Class Abilities (class-abilities.db)
    with open(DB_DIR / "class-abilities.db", "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            obj = json.loads(line)
            name = obj.get("name", "").strip()
            d = obj.get("data", {})
            item_id = slugify(name, "cab")
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)
            desc = clean_html(d.get("description", {}).get("value", ""))
            assoc_classes = (d.get("associations") or {}).get("classes", [])
            records.append({
                "id": item_id,
                "foundryId": obj.get("_id"),
                "schemaVersion": 2,
                "name": name,
                "type": "ClassAbility",
                "category": "Class Feature",
                "slot": "None",
                "source": "SRD 3.5e",
                "abilityType": d.get("abilityType") or "ex",
                "associations": assoc_classes,
                "description": desc,
                "shortDescription": strip_to_plain(desc, 220),
                "tags": ["class-ability"],
                "modifiers": convert_foundry_changes(d.get("changes", [])),
                "damageParts": convert_spell_damage_parts(d.get("damage", {}), name),
                "modes": [],
                "ruleFlags": {},
            })

    # 3C. Races (racialfeatures.db + local catalog Standard Races)
    with open(DB_DIR / "racialfeatures.db", "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            obj = json.loads(line)
            name = obj.get("name", "").strip()
            d = obj.get("data", {})
            item_id = slugify(name, "race")
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)
            local_match = local_by_name.get(name.lower(), {})
            desc = clean_html(d.get("description", {}).get("value", ""))
            mods = convert_foundry_changes(d.get("changes", []))
            records.append({
                "id": item_id,
                "foundryId": obj.get("_id"),
                "schemaVersion": 2,
                "name": name,
                "type": "Race",
                "category": local_match.get("category", "Standard Race"),
                "slot": "None",
                "source": local_match.get("source", "SRD 3.5e"),
                "size": local_match.get("size", "Medium"),
                "baseSpeed": parse_number(local_match.get("baseSpeed"), 30),
                "favoredClass": local_match.get("favoredClass", "Any"),
                "bonusFeats": parse_number(local_match.get("bonusFeats"), 0),
                "bonusSkillPointsPerLevel": parse_number(local_match.get("bonusSkillPointsPerLevel"), 0),
                "description": desc or local_match.get("benefit", ""),
                "shortDescription": local_match.get("benefit") or strip_to_plain(desc, 220),
                "tags": ["race", slugify(name)],
                "modifiers": mods,
                "damageParts": [],
                "modes": [],
                "ruleFlags": {},
            })

    # 3D. Racial Abilities (racial-abilities.db)
    with open(DB_DIR / "racial-abilities.db", "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            obj = json.loads(line)
            name = obj.get("name", "").strip()
            d = obj.get("data", {})
            item_id = slugify(name, "rab")
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)
            desc = clean_html(d.get("description", {}).get("value", ""))
            records.append({
                "id": item_id,
                "foundryId": obj.get("_id"),
                "schemaVersion": 2,
                "name": name,
                "type": "RacialTrait",
                "category": "Racial Ability",
                "slot": "None",
                "source": "SRD 3.5e",
                "description": desc,
                "shortDescription": strip_to_plain(desc, 220),
                "tags": ["racial-trait"],
                "modifiers": convert_foundry_changes(d.get("changes", [])),
                "damageParts": convert_spell_damage_parts(d.get("damage", {}), name),
                "modes": [],
                "ruleFlags": {},
            })

    return records

# ---------------------------------------------------------------------------
# 4. Build srd_combat_rules.json (38 Conditions + 37 Buffs + 21 Damage Types)
# ---------------------------------------------------------------------------

RAW_CONDITION_RULES = {
    "blinded": {
        "modifiers": [
            {"target": "ac.total", "value": -2, "formula": "-2", "type": "penalty", "condition": None},
            {"target": "skill.search", "value": -4, "formula": "-4", "type": "penalty", "condition": None},
        ],
        "ruleFlags": {"loseDexToAC": True, "halfSpeed": True, "actionRestriction": "Cannot see: -2 AC, loses Dex to AC, 50% miss chance on attacks, -4 on Str/Dex skills."},
    },
    "cowering": {
        "modifiers": [{"target": "ac.total", "value": -2, "formula": "-2", "type": "penalty", "condition": None}],
        "ruleFlags": {"loseDexToAC": True, "actionRestriction": "Frozen in fear: can take no actions, -2 AC, loses Dex bonus to AC."},
    },
    "dazed": {
        "modifiers": [],
        "ruleFlags": {"actionRestriction": "Unable to act normally: can take no actions, but retains full AC."},
    },
    "dazzled": {
        "modifiers": [
            {"target": "attack.all", "value": -1, "formula": "-1", "type": "penalty", "condition": None},
            {"target": "skill.search", "value": -1, "formula": "-1", "type": "penalty", "condition": None},
            {"target": "skill.spot", "value": -1, "formula": "-1", "type": "penalty", "condition": None},
        ],
        "ruleFlags": {},
    },
    "deafened": {
        "modifiers": [{"target": "init", "value": -4, "formula": "-4", "type": "penalty", "condition": None}],
        "ruleFlags": {"actionRestriction": "Cannot hear: -4 Initiative, auto-fails Listen checks, 20% arcane/divine verbal spell failure."},
    },
    "disabled": {
        "modifiers": [],
        "ruleFlags": {"halfSpeed": True, "actionRestriction": "At 0 HP: only a single Move or Standard action per round (Standard action deals 1 HP damage unless self-healing)."},
    },
    "entangled": {
        "modifiers": [
            {"target": "attack.all", "value": -2, "formula": "-2", "type": "penalty", "condition": None},
            {"target": "ability.dex", "value": -4, "formula": "-4", "type": "penalty", "condition": None},
        ],
        "ruleFlags": {"halfSpeed": True, "actionRestriction": "Ensnared: moves at half speed, cannot run or charge, Concentration DC 15 + spell level to cast."},
    },
    "exhausted": {
        "modifiers": [
            {"target": "ability.str", "value": -6, "formula": "-6", "type": "penalty", "condition": None},
            {"target": "ability.dex", "value": -6, "formula": "-6", "type": "penalty", "condition": None},
        ],
        "ruleFlags": {"halfSpeed": True, "actionRestriction": "Moves at half speed, cannot run or charge (-6 Str, -6 Dex). 1 hour rest reduces to Fatigued."},
    },
    "fascinated": {
        "modifiers": [
            {"target": "skill.spot", "value": -4, "formula": "-4", "type": "penalty", "condition": None},
            {"target": "skill.listen", "value": -4, "formula": "-4", "type": "penalty", "condition": None},
        ],
        "ruleFlags": {"actionRestriction": "Stands quietly: takes no actions other than paying attention to the fascinating effect."},
    },
    "fatigued": {
        "modifiers": [
            {"target": "ability.str", "value": -2, "formula": "-2", "type": "penalty", "condition": None},
            {"target": "ability.dex", "value": -2, "formula": "-2", "type": "penalty", "condition": None},
        ],
        "ruleFlags": {"actionRestriction": "Cannot run or charge (-2 Str, -2 Dex). 8 hours complete rest removes Fatigue."},
    },
    "flat-footed": {
        "modifiers": [],
        "ruleFlags": {"loseDexToAC": True, "actionRestriction": "Loses Dexterity bonus to AC and cannot make Attacks of Opportunity."},
    },
    "frightened": {
        "modifiers": [
            {"target": "attack.all", "value": -2, "formula": "-2", "type": "penalty", "condition": None},
            {"target": "save.all", "value": -2, "formula": "-2", "type": "penalty", "condition": None},
            {"target": "skill.all", "value": -2, "formula": "-2", "type": "penalty", "condition": None},
        ],
        "ruleFlags": {"actionRestriction": "Must flee from source of fear if possible (-2 attacks, saves, skills, ability checks)."},
    },
    "grappling": {
        "modifiers": [{"target": "attack.all", "value": -4, "formula": "-4", "type": "penalty", "condition": "Grapple Attack"}],
        "ruleFlags": {"loseDexToAC": True, "actionRestriction": "Grappling: no movement, threatens no squares, loses Dex vs non-grapplers, only light weapons/natural attacks."},
    },
    "helpless": {
        "modifiers": [{"target": "ac.total", "value": -4, "formula": "-4", "type": "penalty", "condition": "vs Melee"}],
        "ruleFlags": {"loseDexToAC": True, "effectiveDexZero": True, "actionRestriction": "Helpless (Effective Dex 0 / -5 mod): Melee attacks get +4 against you; adjacent foes can deliver Coup de Grace."},
    },
    "invisible": {
        "modifiers": [{"target": "attack.all", "value": 2, "formula": "2", "type": "untyped", "condition": "vs Sighted"}],
        "ruleFlags": {"actionRestriction": "+2 attack vs sighted foes and ignores their Dex to AC; 50% concealment miss chance."},
    },
    "nauseated": {
        "modifiers": [],
        "ruleFlags": {"actionRestriction": "Nauseated: Unable to attack, cast spells, or concentrate. Only a single Move Action per turn."},
    },
    "panicked": {
        "modifiers": [
            {"target": "save.all", "value": -2, "formula": "-2", "type": "penalty", "condition": None},
            {"target": "skill.all", "value": -2, "formula": "-2", "type": "penalty", "condition": None},
        ],
        "ruleFlags": {"actionRestriction": "Panicked: Drops held items and flees at top speed (or cowers if cornered)."},
    },
    "paralyzed": {
        "modifiers": [],
        "ruleFlags": {"loseDexToAC": True, "effectiveDexZero": True, "actionRestriction": "Frozen & Helpless (Effective Str 0, Dex 0): Unable to move or act physically; purely mental actions only."},
    },
    "prone": {
        "modifiers": [{"target": "attack.melee", "value": -4, "formula": "-4", "type": "penalty", "condition": None}],
        "ruleFlags": {"actionRestriction": "On ground: -4 melee attack, cannot use ranged weapons (except crossbow); -4 AC vs melee, +4 AC vs ranged."},
    },
    "shaken": {
        "modifiers": [
            {"target": "attack.all", "value": -2, "formula": "-2", "type": "penalty", "condition": None},
            {"target": "save.all", "value": -2, "formula": "-2", "type": "penalty", "condition": None},
            {"target": "skill.all", "value": -2, "formula": "-2", "type": "penalty", "condition": None},
        ],
        "ruleFlags": {},
    },
    "sickened": {
        "modifiers": [
            {"target": "attack.all", "value": -2, "formula": "-2", "type": "penalty", "condition": None},
            {"target": "damage.weapon", "value": -2, "formula": "-2", "type": "penalty", "condition": None},
            {"target": "save.all", "value": -2, "formula": "-2", "type": "penalty", "condition": None},
            {"target": "skill.all", "value": -2, "formula": "-2", "type": "penalty", "condition": None},
        ],
        "ruleFlags": {},
    },
    "staggered": {
        "modifiers": [],
        "ruleFlags": {"actionRestriction": "Staggered: May take only a single Move Action or Standard Action each round (not both)."},
    },
    "stunned": {
        "modifiers": [{"target": "ac.total", "value": -2, "formula": "-2", "type": "penalty", "condition": None}],
        "ruleFlags": {"loseDexToAC": True, "actionRestriction": "Stunned: Drops everything held, can take no actions, -2 penalty to AC, loses Dexterity bonus to AC."},
    },
}

def process_combat_rules() -> list:
    rules = []
    seen_ids = set()

    # 4A. Conditions (conditions.db)
    with open(DB_DIR / "conditions.db", "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            obj = json.loads(line)
            name = obj.get("name", "").strip()
            item_id = slugify(name, "cnd")
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)
            desc = clean_html(obj.get("content", ""))
            raw_spec = RAW_CONDITION_RULES.get(name.lower(), {"modifiers": [], "ruleFlags": {}})
            rules.append({
                "id": item_id,
                "foundryId": obj.get("_id"),
                "schemaVersion": 2,
                "name": name,
                "type": "Condition",
                "category": "Combat Condition",
                "slot": "None",
                "source": "SRD 3.5e",
                "durationCategory": "condition",
                "description": desc,
                "shortDescription": strip_to_plain(desc, 220),
                "tags": ["condition", slugify(name)],
                "modifiers": raw_spec["modifiers"],
                "damageParts": [],
                "modes": [],
                "ruleFlags": raw_spec["ruleFlags"],
            })

    # 4B. Common Buffs (commonbuffs.db)
    with open(DB_DIR / "commonbuffs.db", "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            obj = json.loads(line)
            name = obj.get("name", "").strip()
            d = obj.get("data", {})
            item_id = slugify(name, "buf")
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)
            desc = clean_html(d.get("description", {}).get("value", ""))
            mods = convert_foundry_changes(d.get("changes", []))
            cflags = {k: v for k, v in (d.get("changeFlags") or {}).items() if v}
            if "haste" in name.lower():
                cflags["extraAttackFullAttack"] = True
                mods.append({"target": "speed.all", "value": 30, "formula": "30", "type": "enhancement", "condition": None})
            # Determine duration category for 8-hour Long Rest auto-clear
            dur_cat = "permanent" if name.lower() in ("inertial armor",) else ("hour" if name.lower() in ("mage armor",) else "short")
            rules.append({
                "id": item_id,
                "foundryId": obj.get("_id"),
                "schemaVersion": 2,
                "name": name,
                "type": "Buff",
                "category": "Spell / Combat Buff",
                "slot": "None",
                "source": "SRD 3.5e",
                "defaultCasterLevel": parse_number(d.get("level"), 1),
                "durationCategory": dur_cat,
                "description": desc,
                "shortDescription": strip_to_plain(desc, 220) or f"Active buff: {name}",
                "tags": ["buff", slugify(name)],
                "modifiers": mods,
                "damageParts": [],
                "modes": [],
                "ruleFlags": cflags,
            })

    # 4C. Damage Types (damage-types.db)
    with open(DB_DIR / "damage-types.db", "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            obj = json.loads(line)
            name = obj.get("name", "").strip()
            d = obj.get("data", {})
            item_id = slugify(name, "dt")
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)
            desc = clean_html(d.get("description", {}).get("value", ""))
            rules.append({
                "id": item_id,
                "foundryId": obj.get("_id"),
                "schemaVersion": 2,
                "name": name,
                "type": "DamageType",
                "category": d.get("damageType") or "Energy/Physical",
                "slot": "None",
                "source": "SRD 3.5e",
                "isPiercing": bool(d.get("isPiercing")),
                "isSlashing": bool(d.get("isSlashing")),
                "isBludgeoning": bool(d.get("isBludgeoning")),
                "description": desc,
                "shortDescription": strip_to_plain(desc, 180) or name,
                "tags": ["damage-type", slugify(name)],
                "modifiers": [],
                "damageParts": [],
                "modes": [],
                "ruleFlags": {},
            })

    return rules

# ---------------------------------------------------------------------------
# 5. Build srd_spells.json (673 Spells + 441 Psionic Powers)
# ---------------------------------------------------------------------------

SCHOOL_MAP = {
    "abj": "Abjuration",
    "con": "Conjuration",
    "div": "Divination",
    "enc": "Enchantment",
    "evo": "Evocation",
    "ill": "Illusion",
    "nec": "Necromancy",
    "trs": "Transmutation",
    "uni": "Universal",
}

def process_spells_and_powers() -> list:
    spells = []
    seen_ids = set()

    for db_name, v2_type, id_prefix in [("spells.db", "Spell", "spl"), ("powers.db", "Power", "pwr")]:
        with open(DB_DIR / db_name, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                obj = json.loads(line)
                name = obj.get("name", "").strip()
                d = obj.get("data", {})
                item_id = slugify(name, id_prefix)
                if item_id in seen_ids:
                    continue
                seen_ids.add(item_id)

                sch_code = (d.get("school") or "uni").lower()
                school_name = SCHOOL_MAP.get(sch_code, sch_code.title())
                learned = d.get("learnedAt", {})
                class_levels = {cls_pair[0]: cls_pair[1] for cls_pair in (learned.get("class") or []) if isinstance(cls_pair, list) and len(cls_pair) >= 2}
                domain_levels = {dom_pair[0]: dom_pair[1] for dom_pair in (learned.get("domain") or []) if isinstance(dom_pair, list) and len(dom_pair) >= 2}

                comps = d.get("components", {})
                comp_list = []
                if comps.get("verbal"):
                    comp_list.append("V")
                if comps.get("somatic"):
                    comp_list.append("S")
                if comps.get("material"):
                    comp_list.append("M")
                if comps.get("focus"):
                    comp_list.append("F")
                if comps.get("divineFocus"):
                    comp_list.append("DF")

                raw_desc = d.get("shortDescription") or d.get("description", {}).get("value", "")
                desc = clean_html(raw_desc)
                snip = strip_to_plain(d.get("snip") or desc, 220)
                min_lvl = min(class_levels.values()) if class_levels else (min(domain_levels.values()) if domain_levels else parse_number(d.get("level"), 1))

                spells.append({
                    "id": item_id,
                    "foundryId": obj.get("_id"),
                    "schemaVersion": 2,
                    "name": name,
                    "type": v2_type,
                    "category": school_name,
                    "subschool": d.get("subschool") or "",
                    "descriptors": d.get("types") or "",
                    "level": min_lvl,
                    "learnedAt": {
                        "class": class_levels,
                        "domain": domain_levels,
                    },
                    "slot": "None",
                    "source": "SRD 3.5e",
                    "actionType": d.get("actionType") or "other",
                    "castingTime": (d.get("activation") or {}).get("type", "standard"),
                    "components": comp_list,
                    "materials": (d.get("materials") or {}).get("value", ""),
                    "range": (d.get("range") or {}).get("units", ""),
                    "area": d.get("spellArea") or "",
                    "target": (d.get("target") or {}).get("value", ""),
                    "duration": d.get("spellDuration") or "",
                    "save": (d.get("save") or {}).get("description", "None") or "None",
                    "sr": bool(d.get("sr")),
                    "powerPointsCost": parse_number(d.get("powerPointsCost"), 0) if v2_type == "Power" else None,
                    "description": desc,
                    "shortDescription": snip,
                    "tags": [v2_type.lower(), school_name.lower()],
                    "modifiers": convert_foundry_changes(d.get("changes", [])),
                    "damageParts": convert_spell_damage_parts(d.get("damage", {}), name),
                    "modes": [],
                    "ruleFlags": {},
                })

    return spells

# ---------------------------------------------------------------------------
# 6. Build srd_monsters.json (645 Bestiary Monsters)
# ---------------------------------------------------------------------------

SIZE_CODE_MAP = {
    "fine": "Fine",
    "dim": "Diminutive",
    "tiny": "Tiny",
    "sm": "Small",
    "med": "Medium",
    "lg": "Large",
    "huge": "Huge",
    "grg": "Gargantuan",
    "col": "Colossal",
}

def process_monsters() -> list:
    monsters = []
    seen_ids = set()

    with open(DB_DIR / "bestiary.db", "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            obj = json.loads(line)
            name = obj.get("name", "").strip()
            if not name or name.startswith("#"):
                continue
            d = obj.get("data", {})
            item_id = slugify(name, "mst")
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            ab = d.get("abilities", {})
            abilities = {k: parse_number((ab.get(k) or {}).get("value"), 10) for k in ("str", "dex", "con", "int", "wis", "cha")}
            attr = d.get("attributes", {})
            ac_blk = attr.get("ac", {})
            saves_blk = attr.get("savingThrows", {})
            spd_blk = attr.get("speed", {})
            details = d.get("details", {})
            traits = d.get("traits", {})

            # Extract embedded attacks, feats, and racialHD/creatureType from items
            emb_items = obj.get("items", [])
            attacks = []
            feats = []
            creature_type = details.get("type") or "Magical Beast"
            hd_str = f"{parse_number((attr.get('hd') or {}).get('total'), 1)}d8"

            for it in emb_items:
                itype = it.get("type")
                iname = it.get("name", "")
                idata = it.get("data", {})
                if itype == "class" and (idata.get("classType") == "racial" or not creature_type or creature_type == "None"):
                    creature_type = iname
                    lvl = parse_number(idata.get("levels"), 1)
                    hd_die = parse_number(idata.get("hd"), 8)
                    hd_str = f"{lvl}d{hd_die}"
                elif itype == "feat":
                    feats.append(iname)
                elif itype in ("attack", "weapon"):
                    wdata = idata.get("weaponData", {})
                    dmg_parts = convert_spell_damage_parts(idata.get("damage", {}), iname)
                    if not dmg_parts and wdata.get("damageRoll"):
                        dmg_parts = build_weapon_damage_parts(wdata["damageRoll"], wdata.get("damageType") or "Physical", 0, iname)
                    attacks.append({
                        "name": iname,
                        "attackType": idata.get("attackType") or "natural",
                        "actionType": idata.get("actionType") or "mwak",
                        "attackBonus": parse_number(idata.get("attackBonus"), 0),
                        "damageParts": dmg_parts,
                    })

            notes_html = clean_html((details.get("notes") or {}).get("value", "") or (details.get("biography") or {}).get("value", ""))
            cr_val = parse_number(details.get("totalCr") or details.get("cr"), 1)
            size_label = SIZE_CODE_MAP.get(traits.get("size", "med"), "Medium")

            monsters.append({
                "id": item_id,
                "foundryId": obj.get("_id"),
                "schemaVersion": 2,
                "name": name,
                "type": "Monster",
                "category": creature_type,
                "size": size_label,
                "cr": cr_val,
                "alignment": details.get("alignment") or "Neutral",
                "environment": details.get("environment") or "Any",
                "hitDice": hd_str,
                "hp": parse_number((attr.get("hp") or {}).get("max"), 10),
                "init": parse_number((attr.get("init") or {}).get("total"), 0),
                "ac": {
                    "total": parse_number((ac_blk.get("normal") or {}).get("total"), 10),
                    "touch": parse_number((ac_blk.get("touch") or {}).get("total"), 10),
                    "flatFooted": parse_number((ac_blk.get("flatFooted") or {}).get("total"), 10),
                },
                "saves": {
                    "fort": parse_number((saves_blk.get("fort") or {}).get("total"), 0),
                    "ref": parse_number((saves_blk.get("ref") or {}).get("total"), 0),
                    "will": parse_number((saves_blk.get("will") or {}).get("total"), 0),
                },
                "speed": {
                    "land": parse_number((spd_blk.get("land") or {}).get("total"), 30),
                    "fly": parse_number((spd_blk.get("fly") or {}).get("total"), 0),
                    "swim": parse_number((spd_blk.get("swim") or {}).get("total"), 0),
                    "climb": parse_number((spd_blk.get("climb") or {}).get("total"), 0),
                    "burrow": parse_number((spd_blk.get("burrow") or {}).get("total"), 0),
                },
                "abilities": abilities,
                "attacks": attacks,
                "feats": feats,
                "description": notes_html,
                "shortDescription": f"{size_label} {creature_type} (CR {cr_val}, HP {parse_number((attr.get('hp') or {}).get('max'), 10)}, AC {parse_number((ac_blk.get('normal') or {}).get('total'), 10)})",
                "tags": ["monster", creature_type.lower(), size_label.lower()],
            })

    return monsters

# ---------------------------------------------------------------------------
# Main Builder & Index Generator
# ---------------------------------------------------------------------------

def write_json_and_hash(filepath: Path, data) -> tuple[str, int]:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    WEBAPP_OUT_DIR.mkdir(parents=True, exist_ok=True)
    raw_bytes = json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    filepath.write_bytes(raw_bytes)
    shutil.copy2(filepath, WEBAPP_OUT_DIR / filepath.name)
    digest = hashlib.sha256(raw_bytes).hexdigest()[:16]
    return digest, len(raw_bytes)

def main():
    print("Starting Joyful-Fermi Canonical V2 SRD Compendium ETL Pipeline...")
    local_by_name, children_by_parent, custom_entries = load_local_catalog_enrichment()

    chunks = {
        "srd_equipment.json": process_equipment(local_by_name, children_by_parent),
        "srd_feats.json": process_feats(local_by_name, custom_entries),
        "srd_classes_races.json": process_classes_and_races(local_by_name),
        "srd_combat_rules.json": process_combat_rules(),
        "srd_spells.json": process_spells_and_powers(),
        "srd_monsters.json": process_monsters(),
    }

    chunk_meta = {}
    search_index = []

    for fname, records in chunks.items():
        fpath = OUT_DIR / fname
        fhash, fsize = write_json_and_hash(fpath, records)
        chunk_meta[fname] = {
            "count": len(records),
            "bytes": fsize,
            "hash": fhash,
            "eagerLoad": fname in ("srd_equipment.json", "srd_feats.json", "srd_classes_races.json", "srd_combat_rules.json"),
        }
        print(f"  [OK] {fname:24s} -> {len(records):4d} entries | {fsize / 1024:8.1f} KB | hash={fhash}")

        for rec in records:
            lvl = rec.get("level") if rec.get("type") in ("Spell", "Power") else (rec.get("cr") if rec.get("type") == "Monster" else rec.get("minLevel"))
            idx_item = {
                "id": rec["id"],
                "n": rec["name"],
                "t": rec["type"],
                "c": rec.get("category", ""),
                "s": rec.get("slot", "None"),
                "f": fname,
            }
            if lvl is not None:
                idx_item["l"] = lvl
            if rec.get("isFighterBonusFeat"):
                idx_item["fb"] = 1
            search_index.append(idx_item)

    compendium_hash = hashlib.sha256(
        json.dumps(chunk_meta, sort_keys=True).encode("utf-8")
    ).hexdigest()[:16]

    index_payload = {
        "schemaVersion": 2,
        "version": "2.0.0",
        "compendiumHash": compendium_hash,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "totalEntries": len(search_index),
        "chunks": chunk_meta,
        "index": search_index,
    }

    idx_hash, idx_size = write_json_and_hash(OUT_DIR / "srd_index.json", index_payload)
    print(f"  [OK] {'srd_index.json':24s} -> {len(search_index):4d} entries | {idx_size / 1024:8.1f} KB | compendiumHash={compendium_hash}")
    print("ETL Pipeline completed successfully!")

if __name__ == "__main__":
    main()
