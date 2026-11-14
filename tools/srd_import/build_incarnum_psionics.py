#!/usr/bin/env python3
"""
Deterministic generator for Joyful-Fermi:
  - database/srd_soulmelds_splat.json (94 soulmelds: 89 Magic of Incarnum + 5 Dragon Magic)
  - database/srd_powers_splat.json (127 powers: 124 Complete Psionic + 3 Magic of Incarnum)
  - exports/incarnum_psionics_classes_feats_races_patch.json (5 races, 25 classes/PrCs, 50 MoI feat fixes, 10 new CPsi feats)

All mechanical descriptions and benefits are freshly paraphrased in official D&D 3.5e RAW English
with Hybrid Canonical V2 + Lego Core V3 (schemaVersion: 3) blocks.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DB_DIR = ROOT / "database"
EXPORT_DIR = ROOT / "exports"

# ---------------------------------------------------------------------------
# V3 Lego Block Factory Helpers
# ---------------------------------------------------------------------------

def slugify(name: str) -> str:
    s = name.lower().replace("'", "").replace(",", "")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s


def b_essentia(summary: str = "Invest essentia up to chakra/meldshaper capacity (free swift reallocation).", max_val: int = 4) -> dict:
    return {
        "type": "resource",
        "name": "Essentia",
        "varKey": "essentia",
        "resMode": "invest",
        "capMode": "chakra",
        "max": max_val,
        "scaling": "flat",
        "reset": "atWill",
        "summary": summary,
    }


def b_pp(pp: int, summary: str = "") -> dict:
    return {
        "type": "resource",
        "name": "Power Points",
        "varKey": "pp",
        "resMode": "spend",
        "max": pp,
        "scaling": "flat",
        "reset": "daily",
        "summary": summary or f"Spend {pp} power point(s) to manifest base power (augmentable up to manifester level).",
    }


def b_stat(targets: list[str], value: int | float, btype: str, summary: str, *, mode: str = "flat", stat: str | None = None, mult: int | float | None = None, condition: str | None = None) -> dict:
    blk: dict = {
        "type": "stat",
        "targets": targets,
        "mode": mode,
        "value": value,
        "btype": btype,
        "summary": summary,
    }
    if stat is not None:
        blk["stat"] = stat
    if mult is not None:
        blk["mult"] = mult
    if condition is not None:
        blk["condition"] = condition
    return blk


def b_roll(kind: str, count: int, die: int, dmg_type: str, summary: str, *, scaling: str = "flat", var_key: str | None = None, var_mode: str | None = None, crit: str = "normal", save: str | None = None, condition: str | None = None) -> dict:
    blk: dict = {
        "type": "roll",
        "kind": kind,
        "count": count,
        "die": die,
        "dmgType": dmg_type,
        "scaling": scaling,
        "crit": crit,
        "summary": summary,
    }
    if var_key is not None:
        blk["varKey"] = var_key
    if var_mode is not None:
        blk["varMode"] = var_mode
    if save is not None:
        blk["save"] = save
    if condition is not None:
        blk["condition"] = condition
    return blk


def b_atk(attack_mode: str, weapon_name: str, dice: str, dmg_type: str, summary: str, *, nat_kind: str = "primary", count: int = 1, rider: str = "", penalty: str = "") -> dict:
    blk: dict = {
        "type": "attack",
        "attackMode": attack_mode,
        "weaponName": weapon_name,
        "dice": dice,
        "dmgType": dmg_type,
        "count": count,
        "summary": summary,
    }
    if attack_mode == "natural":
        blk["natKind"] = nat_kind
    if rider:
        blk["rider"] = rider
    if penalty:
        blk["penalty"] = penalty
    return blk


def b_def(mode: str, summary: str, *, value: str | int | None = None, detail: str | None = None) -> dict:
    blk: dict = {"type": "defense", "mode": mode, "summary": summary}
    if value is not None:
        blk["value"] = value
    if detail is not None:
        blk["detail"] = detail
    return blk


def b_eff(text: str, *, effect_kind: str = "rule") -> dict:
    return {"type": "effect", "effectKind": effect_kind, "text": text, "summary": text}


def b_when(flow: str, branches: list[dict], summary: str) -> dict:
    return {"type": "when", "flow": flow, "branches": branches, "summary": summary}


def branch(cond_kind: str, cond_text: str, effects: list[dict], *, trigger: str | None = None, action: str | None = None) -> dict:
    br: dict = {"condKind": cond_kind, "condText": cond_text, "effects": effects}
    if trigger:
        br["trigger"] = trigger
    if action:
        br["action"] = action
    return br


def sm_desc(shaped: str, essentia: str, binds: dict[str, str], desc_list: list[str], cls_str: str, save_str: str) -> str:
    parts = [f"<p><strong>Meldshaper List:</strong> {cls_str} | <strong>Saving Throw:</strong> {save_str}</p>"]
    if desc_list:
        parts.append(f"<p><strong>Descriptors:</strong> {', '.join(desc_list)}</p>")
    parts.append(f"<p><strong>Shaped Effect:</strong> {shaped}</p>")
    parts.append(f"<p><strong>Essentia Investment:</strong> {essentia}</p>")
    if binds:
        b_lines = "".join(f"<li><strong>{k} Chakra:</strong> {v}</li>" for k, v in binds.items())
        parts.append(f"<p><strong>Chakra Binds:</strong></p><ul>{b_lines}</ul>")
    return "\n".join(parts)


def make_soulmeld(
    name: str,
    page: int,
    classes: list[str],
    chakras: list[str],
    descriptors: list[str],
    save: str,
    shaped: str,
    essentia: str,
    binds: dict[str, str],
    short_desc: str,
    effects: list[dict],
    source: str = "Magic of Incarnum",
    sr: bool = False,
) -> dict:
    learned_cls = {c: 1 for c in classes}
    chakra_str = ", ".join(chakras)
    cls_str = ", ".join(classes)
    tags = ["soulmeld", "incarnum"] + [c.lower() for c in classes] + [d.lower() for d in descriptors]
    if source == "Dragon Magic":
        tags.append("dragon-magic")
    return {
        "id": f"sm-{slugify(name)}",
        "schemaVersion": 3,
        "blueprint": "spell",
        "name": name,
        "type": "Soulmeld",
        "category": "Soulmeld",
        "source": source,
        "page": page,
        "edition": "3.5",
        "verification": "book-verified",
        "slot": "None",
        "spell": {
            "system": "soulmeld",
            "meldshaperList": cls_str,
            "chakraSlots": chakra_str,
            "descriptors": descriptors,
        },
        "learnedAt": {"class": learned_cls, "domain": {}},
        "savingThrow": save,
        "save": save,
        "sr": sr,
        "shapedEffect": shaped,
        "essentiaEffect": essentia,
        "chakraBinds": binds,
        "shortDescription": short_desc,
        "description": sm_desc(shaped, essentia, binds, descriptors, cls_str, save),
        "tags": tags,
        "effects": effects,
        "modifiers": [],
        "damageParts": [],
        "modes": [],
        "ruleFlags": {},
    }


# ---------------------------------------------------------------------------
# 1. SOULMELDS CATALOG (89 Magic of Incarnum + 5 Dragon Magic = 94)
# ---------------------------------------------------------------------------

def build_soulmelds() -> list[dict]:
    E = b_essentia
    S = b_stat
    R = b_roll
    A = b_atk
    D = b_def
    F = b_eff
    W = b_when
    B = branch
    M = make_soulmeld

    items = [
        # 0
        M(
            "Acrobat Boots", 54, ["Incarnate"], ["Feet"], [], "None",
            "Grants a +2 insight bonus on Balance, Escape Artist, Jump, and Tumble checks (Tumble still requires training).",
            "Each invested point of essentia increases the insight bonus on those four skills by +2.",
            {"Feet": "Reduces falling damage taken by 1d6 per point of invested essentia."},
            "+2 (+2/essentia) insight to Balance, Escape Artist, Jump, and Tumble; Feet bind cushions falls.",
            [
                E("Invest essentia to scale insight skill bonus and Feet-bind fall reduction."),
                S(["skill.bal", "skill.esc", "skill.jmp", "skill.tum"], 2, "Insight", "+2 + 2/@essentia insight to Balance, Escape Artist, Jump, Tumble", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Feet Chakra", [R("Healing", 1, 6, "Fall Reduction", "Ignore 1d6/essentia falling damage", scaling="perVar", var_key="essentia")])], "Feet Chakra reduces falling damage."),
            ],
        ),
        # 1
        M(
            "Adamant Pauldrons", 54, ["Incarnate"], ["Shoulders"], [], "None",
            "Provides a 25% chance to negate critical hits and sneak attacks (damage rolls normally).",
            "Grants DR equal to invested essentia, bypassed only by weapons of an alignment opposed to your incarnate alignment.",
            {"Shoulders": "Increases fortification against critical hits and sneak attacks from 25% to 50%."},
            "25% fortification (50% bound to Shoulders); DR @essentia/opposed alignment.",
            [
                E("Grants DR @essentia bypassed by alignment opposed to your incarnate cause."),
                D("Fortification", "25% chance to negate critical hits and sneak attacks.", value="25%"),
                D("DR", "DR @essentia/[opposed incarnate alignment].", value="@essentia"),
                W("while", [B("bound", "Shoulders Chakra", [D("Fortification", "Fortification increases to 50%.", value="50%")])], "Shoulders Chakra upgrades fortification to 50%."),
            ],
        ),
        # 2
        M(
            "Airstep Sandals", 55, ["Incarnate"], ["Feet"], [], "None",
            "Once per round as a move action, fly up to 10 feet (good maneuverability); must end movement on solid support or fall.",
            "Each point of invested essentia extends flight distance by +10 feet.",
            {"Feet": "Upgrades flight maneuverability to perfect (free turns, reverse direction, full upward climb speed)."},
            "Fly 10 ft (+10 ft/essentia) as a move action (good, or perfect when bound to Feet).",
            [
                E("Each invested essentia adds +10 ft to single-move flight distance."),
                D("Sense / Movement", "Fly 10 + 10*@essentia ft (good) once per round as a move action; must land on solid surface."),
                W("while", [B("bound", "Feet Chakra", [D("Sense / Movement", "Flight maneuverability improves to perfect.")])], "Feet Chakra grants perfect flight maneuverability."),
            ],
        ),
        # 3
        M(
            "Ankheg Breastplate", 56, ["Totemist"], ["Throat", "Totem"], ["Acid"], "See text (Reflex half on Throat acid line)",
            "Provides a +2 armor bonus to AC with no max Dex penalty, ACP, or ASF (counts as light armor for speed and features; does not stack with worn armor).",
            "Each point of invested essentia raises the armor bonus by +1.",
            {
                "Throat": "Once per minute as a standard action, spit a 5 ft + 5 ft/essentia line of acid dealing 2d6 + 1d6/essentia acid damage (Reflex half).",
                "Totem": "Gain a 1d8 bite natural attack (primary at full BAB + Str, or secondary at -5 BAB + 1/2 Str) dealing +1d4 acid damage per invested essentia.",
            },
            "+2 (+1/essentia) armor AC; Throat bind spits acid line; Totem bind grants acid-laced 1d8 bite.",
            [
                E("Scales armor bonus (+1/pt), Throat breath length/damage, and Totem bite acid damage."),
                S(["ac.armor"], 2, "Armor", "+2 + @essentia armor bonus (counts as light armor, 0 ACP/ASF).", mode="stat", stat="essentia", mult=1),
                W("when", [B("bound", "Throat Chakra", [R("Damage", 2, 6, "Acid", "1/min standard action line (5 + 5*@essentia ft): 2d6 + @essentia d6 acid (Reflex half).", scaling="perVar", var_key="essentia", save="Reflex half")], action="standard")], "Throat Chakra spits a line of acid 1/min."),
                W("while", [B("bound", "Totem Chakra", [A("natural", "Bite (Ankheg)", "1d8", "P/S/B + Acid", "1d8 bite plus @essentia d4 acid damage.", nat_kind="primary", rider="+@essentia d4 Acid")])], "Totem Chakra grants acidic bite attack."),
            ],
        ),
        # 4
        M(
            "Apparition Ribbon", 57, ["Incarnate"], ["Throat"], [], "None",
            "Allows one reroll on melee miss-chance percentile checks caused by a target's incorporeality.",
            "Grants a +2 insight bonus on weapon damage rolls against incorporeal foes per invested essentia.",
            {"Throat": "As a standard action, become incorporeal (including Cha deflection to AC, minimum +1) for 1 + @essentia rounds, up to meldshaper level rounds/day (locks essentia during use)."},
            "Reroll incorporeal miss chance +2/essentia dmg vs incorporeal; Throat bind grants brief incorporeality.",
            [
                E("Adds +2/essentia insight damage vs incorporeal foes and extends Throat-bind duration."),
                S(["damage"], 0, "Insight", "+2/@essentia damage against incorporeal creatures.", mode="stat", stat="essentia", mult=2, condition="vs incorporeal"),
                F("Reroll melee miss chance percentile roll once per swing against incorporeal targets."),
                W("when", [B("bound", "Throat Chakra", [D("State Flag", "Become incorporeal for 1 + @essentia rounds (max meldshaper level rounds/day).")], action="standard")], "Throat Chakra enables temporary incorporeality."),
            ],
        ),
        # 5
        M(
            "Arcane Focus", 57, ["Incarnate", "Soulborn"], ["Throat"], [], "See text (Fortitude negates daze on Throat bind)",
            "Damaging arcane spells you cast deal +1 bonus damage per target (multi-target spells get +1 per affected creature).",
            "Each invested point of essentia increases the bonus arcane spell damage by +1.",
            {"Throat": "Single-target damaging arcane spells that deal actual damage to a living target force a Fortitude save (soulmeld DC) or daze the target for 1 round."},
            "+1 (+1/essentia) damage to arcane spells; Throat bind dazes single living targets on failed Fortitude save.",
            [
                E("Increases arcane spell bonus damage by +1 per invested essentia."),
                S(["spell.damage"], 1, "Untyped", "+1 + @essentia damage on damaging arcane spells.", mode="stat", stat="essentia", mult=1, condition="arcane damaging spells"),
                W("when", [B("bound", "Throat Chakra", [F("Single-target damaging arcane spell dealing HP damage forces Fortitude save (soulmeld DC) or target is dazed 1 round.")], trigger="spellDamage")], "Throat Chakra adds daze rider to single-target damaging arcane spells."),
            ],
        ),
        # 6
        M(
            "Armguards of Disruption", 59, ["Incarnate", "Soulborn"], ["Arms"], ["Good"], "None",
            "Once per round (declared before attacking), a melee touch attack deals 1d6 damage to an undead creature.",
            "Each invested point of essentia adds +1d6 damage against undead.",
            {"Arms": "Grants an insight bonus to AC and saving throws equal to invested essentia specifically against undead attacks and effects."},
            "1d6 (+1d6/essentia) melee touch damage vs undead 1/round; Arms bind grants +@essentia AC & saves vs undead.",
            [
                E("Scales touch damage vs undead (+1d6/pt) and Arms-bind defense bonus."),
                R("Damage", 1, 6, "Positive/Incarnum", "1/round melee touch vs undead: 1d6 + @essentia d6.", scaling="perVar", var_key="essentia", condition="vs undead"),
                W("while", [B("bound", "Arms Chakra", [S(["ac.total", "save.all"], 0, "Insight", "+@essentia insight to AC and saves vs undead.", mode="stat", stat="essentia", mult=1, condition="vs undead")])], "Arms Chakra wards AC and saves vs undead."),
            ],
        ),
        # 7
        M(
            "Basilisk Mask", 59, ["Totemist"], ["Brow", "Totem"], [], "See text (Fortitude negates petrification on Totem bind)",
            "Grants low-light vision.",
            "Grants darkvision 30 feet per invested point of essentia.",
            {
                "Brow": "Grants the Blind-Fight feat.",
                "Totem": "Full-round action petrifying gaze (30 ft, 1 creature able to see you) turns target to stone for 1 round (Fortitude negates).",
            },
            "Low-light vision & darkvision 30 ft/essentia; Brow grants Blind-Fight; Totem grants 1-round petrifying gaze.",
            [
                E("Provides 30 ft darkvision per point of invested essentia."),
                D("Sense / Movement", "Low-light vision plus darkvision (30 * @essentia ft)."),
                W("while", [B("bound", "Brow Chakra", [F("Grants Blind-Fight feat.", effect_kind="grantFeat")])], "Brow Chakra grants Blind-Fight."),
                W("when", [B("bound", "Totem Chakra", [F("Full-round gaze within 30 ft: target petrified for 1 round (Fortitude negates).")], action="full")], "Totem Chakra provides 1-round petrification gaze."),
            ],
        ),
        # 8
        M(
            "Beast Tamer Circlet", 60, ["Totemist"], ["Crown", "Totem"], [], "None",
            "Grants a +2 insight bonus on Handle Animal and wild empathy checks.",
            "Each invested point of essentia increases the Handle Animal and wild empathy bonus by +2.",
            {
                "Crown": "Enables speak with animals (and Int 1-2 magical beasts) during any round with >= 1 essentia invested.",
                "Totem": "Once per minute, use animal trance while concentrating with >= 1 essentia invested (max 1 min/meldshaper level).",
            },
            "+2 (+2/essentia) Handle Animal & wild empathy; Crown speaks with beasts; Totem grants animal trance.",
            [
                E("Increases Handle Animal/wild empathy insight bonus and powers Crown/Totem binds."),
                S(["skill.han", "wildEmpathy"], 2, "Insight", "+2 + 2*@essentia insight on Handle Animal and wild empathy.", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Crown Chakra", [F("Speak with animals and Int 1-2 magical beasts while >=1 essentia invested.")])], "Crown Chakra enables beast speech."),
                W("when", [B("bound", "Totem Chakra", [F("1/min animal trance (concentration, up to 1 min/meldshaper level) while >=1 essentia invested.")], action="standard")], "Totem Chakra grants animal trance."),
            ],
        ),
        # 9
        M(
            "Behir Gorget", 60, ["Totemist"], ["Throat", "Totem"], ["Electricity"], "See text (Reflex half on Throat lightning line)",
            "Grants a +4 bonus on checks to resist bull rush or trip attempts.",
            "Grants electricity resistance equal to 5 x invested essentia.",
            {
                "Throat": "Once per minute as a standard action, breathe a 5 ft + 5 ft/essentia line of lightning for 2d6 + 1d6/essentia electricity damage (Reflex half).",
                "Totem": "Gain a 1d8 bite attack (primary at full BAB + Str or secondary at -5 BAB + 1/2 Str) dealing +1d4 electricity damage per invested essentia.",
            },
            "+4 vs bull rush/trip; Resist Electricity 5/essentia; Throat spits lightning line; Totem grants shock bite.",
            [
                E("Scales electricity resistance (5/pt), Throat lightning breath, and Totem bite shock dice."),
                S(["cmd.bullRush", "cmd.trip"], 4, "Untyped", "+4 bonus vs bull rush and trip attempts."),
                D("Energy Resistance", "Resistance to electricity equal to 5 * @essentia.", value="5*@essentia"),
                W("when", [B("bound", "Throat Chakra", [R("Damage", 2, 6, "Electricity", "1/min standard action line (5 + 5*@essentia ft): 2d6 + @essentia d6 electricity (Reflex half).", scaling="perVar", var_key="essentia", save="Reflex half")], action="standard")], "Throat Chakra emits a lightning breath line."),
                W("while", [B("bound", "Totem Chakra", [A("natural", "Bite (Behir)", "1d8", "P/S/B + Electricity", "1d8 bite plus @essentia d4 electricity damage.", nat_kind="primary", rider="+@essentia d4 Electricity")])], "Totem Chakra grants electrical bite."),
            ],
        ),
        # 10
        M(
            "Blink Shirt", 60, ["Totemist"], ["Heart", "Totem"], [], "None",
            "At will as a standard action (ending your turn), dimension door self only up to 10 feet.",
            "Each invested point of essentia increases self-teleportation range by +10 feet.",
            {
                "Heart": "Activate or dismiss blink (as the spell, CL = meldshaper level) as a standard action.",
                "Totem": "Reduces the dimension door activation from a standard action to a move action.",
            },
            "At-will self dimension door 10 ft (+10 ft/essentia); Heart grants blink; Totem makes teleport a move action.",
            [
                E("Increases short-range dimension door distance by 10 ft per essentia."),
                D("Sense / Movement", "At-will self-only teleport up to 10 + 10*@essentia ft (standard action, ends turn)."),
                W("while", [B("bound", "Heart Chakra", [F("Use blink (CL = meldshaper level) as standard action.")])], "Heart Chakra grants blink spell effect."),
                W("while", [B("bound", "Totem Chakra", [F("Teleportation ability requires only a move action.")])], "Totem Chakra speeds teleport to a move action."),
            ],
        ),
        # 11
        M(
            "Bloodtalons", 61, ["Totemist"], ["Hands", "Totem"], [], "None",
            "Act normally without penalty while disabled (0 hp) or dying (-1 to -9 hp; no 1-hp bleed or strenuous loss; die at -10 hp).",
            "Grants a +2 bonus on Spot checks per point of invested essentia.",
            {
                "Hands": "Gain Weapon Finesse when attacking with natural weapons.",
                "Totem": "Gain two 1d4 claw attacks with +1 enhancement/essentia on attack rolls; hits inflict 1 hp/essentia bleeding damage on the following round (living foes only).",
            },
            "Diehard-like fight down to -9 hp & +2/essentia Spot; Hands finesses natural attacks; Totem grants bleeding claws.",
            [
                E("Increases Spot bonus (+2/pt) and Totem claw attack enhancement & bleed."),
                D("State Flag", "Fight without penalty at 0 to -9 hp; immune to dying bleed."),
                S(["skill.spt"], 0, "Untyped", "+2 * @essentia bonus on Spot checks.", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Hands Chakra", [F("Weapon Finesse applies to natural weapons.", effect_kind="grantFeat")])], "Hands Chakra grants natural Weapon Finesse."),
                W("while", [B("bound", "Totem Chakra", [A("natural", "Bloodtalon Claws", "1d4", "S", "Two 1d4 claws, +@essentia attack enhancement, +@essentia bleed next round vs living.", count=2, rider="+@essentia Atk, +@essentia/round bleed")])], "Totem Chakra grants bleeding claw attacks."),
            ],
        ),
        # 12
        M(
            "Bloodwar Gauntlets", 61, ["Incarnate"], ["Arms", "Hands"], ["Evil", "Mind-Affecting"], "See text (Fortitude half on Arms detonation)",
            "Grants a +1 morale bonus on melee attack rolls.",
            "Grants a +1 morale bonus on melee damage rolls per point of invested essentia.",
            {
                "Arms": "Standard action unshapes the soulmeld in a 20-ft-radius burst dealing 3d6/essentia damage to all others (Fortitude half).",
                "Hands": "Grants a +4 bonus on rolls to confirm melee critical threats.",
            },
            "+1 morale melee attack, +1/essentia morale melee damage; Hands +4 crit confirm; Arms detonates 3d6/essentia burst.",
            [
                E("Scales melee morale damage (+1/pt) and Arms detonation burst."),
                S(["attack.melee"], 1, "Morale", "+1 morale bonus on melee attack rolls."),
                S(["damage.melee"], 0, "Morale", "+@essentia morale bonus on melee damage rolls.", mode="stat", stat="essentia", mult=1),
                W("when", [B("bound", "Arms Chakra", [R("Damage", 3, 6, "Incarnum", "Unshape soulmeld: 20-ft burst deals 3*@essentia d6 damage (Fortitude half).", scaling="perVar", var_key="essentia", save="Fortitude half")], action="standard")], "Arms Chakra detonates soulmeld."),
                W("while", [B("bound", "Hands Chakra", [S(["attack.critConfirm"], 4, "Untyped", "+4 bonus on critical threat confirmation rolls.")])], "Hands Chakra aids critical confirmation."),
            ],
        ),
        # 13
        M(
            "Bluesteel Bracers", 62, ["Incarnate", "Soulborn"], ["Arms"], [], "None",
            "Grants a +2 insight bonus on initiative checks.",
            "Grants an insight bonus on weapon damage rolls equal to invested essentia.",
            {"Arms": "Extends the +2 initiative bonus to all allies within 30 feet when initiative is rolled."},
            "+2 initiative (shared with allies within 30 ft when Arms-bound) and +@essentia insight weapon damage.",
            [
                E("Adds +1 insight bonus per essentia to weapon damage rolls."),
                S(["init"], 2, "Insight", "+2 insight bonus on initiative checks."),
                S(["damage.weapon"], 0, "Insight", "+@essentia insight bonus on weapon damage rolls.", mode="stat", stat="essentia", mult=1),
                W("while", [B("bound", "Arms Chakra", [F("Allies within 30 ft gain +2 insight bonus on initiative.")])], "Arms Chakra shares initiative bonus."),
            ],
        ),
        # 14
        M(
            "Brass Mane", 62, ["Totemist"], ["Throat", "Totem"], ["Sonic"], "See text (Will negates fatigue on Throat roar)",
            "Grants a +4 competence bonus on Intimidate checks.",
            "Each invested point of essentia increases the Intimidate competence bonus by +2.",
            {
                "Throat": "Once per minute, roar in a 10 ft + 10 ft/essentia radius; non-dragonnes must make a Will save or become fatigued.",
                "Totem": "Gain a 1d8 bite attack (primary or secondary) with +1 enhancement/essentia on attack and damage rolls.",
            },
            "+4 (+2/essentia) Intimidate; Throat roars to fatigue enemies; Totem grants enhanced 1d8 bite.",
            [
                E("Scales Intimidate (+2/pt), Throat roar radius (+10 ft/pt), and Totem bite enhancement."),
                S(["skill.int"], 4, "Competence", "+4 + 2*@essentia competence bonus on Intimidate.", mode="stat", stat="essentia", mult=2),
                W("when", [B("bound", "Throat Chakra", [F("1/min roar (10 + 10*@essentia ft): Will save or fatigued (dragonnes immune).")], action="standard")], "Throat Chakra grants fatiguing roar."),
                W("while", [B("bound", "Totem Chakra", [A("natural", "Bite (Dragonne)", "1d8", "P/S/B", "1d8 bite with +@essentia enhancement on attack and damage.", nat_kind="primary", rider="+@essentia Enh")])], "Totem Chakra grants enhanced dragonne bite."),
            ],
        ),
        # 15
        M(
            "Cerulean Sandals", 63, ["Incarnate", "Soulborn"], ["Feet"], [], "None",
            "Grants continuous water walk (as the spell).",
            "Grants a +5-foot enhancement bonus to base land speed per invested point of essentia.",
            {"Feet": "Use dimension door (self, standard action) in 10-ft increments up to a cumulative pool of 10 ft x meldshaper level, unshaping once exhausted."},
            "Water walk and +5 ft/essentia land speed; Feet bind grants cumulative dimension door pool.",
            [
                E("Increases base land speed by +5 ft per point of invested essentia."),
                D("Sense / Movement", "Continuous water walk effect."),
                S(["speed.land"], 0, "Enhancement", "+5 * @essentia ft enhancement bonus to base land speed.", mode="stat", stat="essentia", mult=5),
                W("when", [B("bound", "Feet Chakra", [F("Use dimension door (10-ft increments, standard action) up to 10 * meldshaper level ft total before unshaping.")], action="standard")], "Feet Chakra grants pooled short-range teleport."),
            ],
        ),
        # 16
        M(
            "Crystal Helm", 63, ["Incarnate", "Soulborn"], ["Crown"], ["Force"], "None",
            "Grants a +2 resistance bonus on Will saves against charm and compulsion effects.",
            "Grants a deflection bonus to Armor Class equal to invested essentia.",
            {"Crown": "Melee attacks gain the [Force] descriptor, striking incorporeal creatures without miss chance."},
            "+2 Will vs charm/compulsion; +@essentia deflection AC; Crown bind makes melee attacks force effects.",
            [
                E("Grants deflection bonus to AC equal to invested essentia."),
                S(["save.will"], 2, "Resistance", "+2 resistance on Will saves vs charm and compulsion.", condition="vs charm/compulsion"),
                S(["ac.deflection"], 0, "Deflection", "+@essentia deflection bonus to AC.", mode="stat", stat="essentia", mult=1),
                W("while", [B("bound", "Crown Chakra", [F("Melee attacks carry the [Force] descriptor against incorporeal foes.")])], "Crown Chakra imbues melee strikes with force."),
            ],
        ),
        # 17
        M(
            "Diadem of Purelight", 63, ["Incarnate", "Soulborn"], ["Crown"], ["Light"], "None",
            "Emits bright light (20 ft) and shadowy illumination (40 ft), granting +2 insight on Spot checks within the light; counts as a light spell of level equal to invested essentia.",
            "Each invested point of essentia extends bright illumination by +10 feet (shadowy radius always equals 2x bright).",
            {"Crown": "Negates all concealment less than total concealment inside its bright light radius (does not pierce invisibility)."},
            "Illuminates 20 (+10/essentia) ft, +2 Spot in light; Crown bind negates partial concealment.",
            [
                E("Expands bright light radius (+10 ft/pt) and sets effective light spell level."),
                S(["skill.spt"], 2, "Insight", "+2 insight on Spot checks inside illuminated area.", condition="inside light radius"),
                W("while", [B("bound", "Crown Chakra", [F("Negates partial concealment (< total) within bright illumination radius.")])], "Crown Chakra strips partial concealment."),
            ],
        ),
        # 18
        M(
            "Disenchanter Mask", 63, ["Totemist"], ["Brow", "Totem"], [], "None",
            "Use detect magic at will (standard action, 10-ft range).",
            "Each invested point of essentia extends detect magic range by +10 feet.",
            {
                "Brow": "Detect magic instantly reveals aura count, strength, and location as if concentrating for 3 rounds.",
                "Totem": "Standard action melee touch (+5 ft reach, no AoOs/other attacks) suppresses a magic item or soulmeld for 10 min on meldshaper check (1d20+ML vs 11+CL).",
            },
            "At-will detect magic (10 + 10/essentia ft); Brow gets instant 3rd-round info; Totem suppresses items/soulmelds.",
            [
                E("Extends detect magic range by +10 ft per invested essentia."),
                F("Detect magic at will (10 + 10*@essentia ft, standard action)."),
                W("while", [B("bound", "Brow Chakra", [F("Detect magic gives immediate 3-round aura detail.")])], "Brow Chakra accelerates detect magic."),
                W("when", [B("bound", "Totem Chakra", [F("Melee touch (+5 ft reach, standard action): meldshaper check vs DC 11 + CL suppresses magic item or soulmeld for 10 min.")], action="standard")], "Totem Chakra suppresses magic gear or soulmelds."),
            ],
        ),
        # 19
        M(
            "Displacer Mantle", 64, ["Totemist"], ["Shoulders", "Totem"], [], "None",
            "Grants a +4 competence bonus on Hide checks.",
            "Each invested point of essentia increases the Hide competence bonus by +2.",
            {
                "Shoulders": "Grants blur-like concealment (20% miss chance; pierced by true seeing, not see invisibility).",
                "Totem": "Full-round action grants two 1d4 tentacle attacks (+5 ft reach, no AoOs, full BAB) with +1 enhancement/essentia to damage.",
            },
            "+4 (+2/essentia) Hide; Shoulders grants 20% blur concealment; Totem grants two +5 ft reach tentacles.",
            [
                E("Increases Hide bonus (+2/pt) and Totem tentacle damage (+1/pt)."),
                S(["skill.hid"], 4, "Competence", "+4 + 2*@essentia competence bonus on Hide.", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Shoulders Chakra", [D("Concealment %", "20% concealment miss chance (pierced by true seeing).", value="20%")])], "Shoulders Chakra grants 20% blur concealment."),
                W("while", [B("bound", "Totem Chakra", [A("natural", "Displacer Tentacles", "1d4", "B", "Two tentacle attacks (full BAB, +5 ft reach, no AoOs, +@essentia damage enhancement).", count=2, rider="+@essentia Dmg Enh")])], "Totem Chakra grants two reach tentacles."),
            ],
        ),
        # 20
        M(
            "Dissolving Spittle", 64, ["Incarnate"], ["Throat"], ["Acid"], "None",
            "As a standard action (provokes AoOs), make a 30-ft ranged touch attack dealing 1d6 acid damage.",
            "Each invested point of essentia increases acid damage by +1d6.",
            {"Throat": "Target suffers the rolled acid damage again on the round after being hit."},
            "30-ft ranged touch 1d6 (+1d6/essentia) acid; Throat bind deals repeat acid damage 1 round later.",
            [
                E("Adds +1d6 acid damage per point of invested essentia."),
                R("Damage", 1, 6, "Acid", "30-ft ranged touch (provokes AoO): 1d6 + @essentia d6 acid.", scaling="perVar", var_key="essentia"),
                W("when", [B("bound", "Throat Chakra", [R("Ongoing / Round", 1, 6, "Acid", "Target takes a second acid damage roll 1 round later.", scaling="perVar", var_key="essentia")], trigger="hit")], "Throat Chakra adds delayed acid damage."),
            ],
        ),
        # 21
        M(
            "Dread Carapace", 65, ["Totemist"], ["Arms", "Feet", "Heart", "Totem"], [], "See text (Will negates shaken on Totem charge)",
            "Take a -1 penalty on natural weapon attack rolls in exchange for +2 damage on bite attacks or +1 damage on other natural attacks.",
            "Each invested point of essentia increases the natural attack penalty by -1 and damage bonus by +2 (bite) or +1 (other natural attacks).",
            {
                "Arms": "Doubles the critical threat range of all natural attacks (does not stack with other threat expansions).",
                "Feet": "Once per minute, gain a +60 ft + 10 ft/essentia enhancement bonus to speed for 1 round.",
                "Heart": "Grants spell resistance equal to 5 + 4 x invested essentia.",
                "Totem": "When charging, enemies within 60 feet who see you become shaken for 1 round (Will negates).",
            },
            "Power-Attack style trade on natural attacks (-1 atk/+2 bite or +1 other per pt); Heart grants SR 5+4/essentia.",
            [
                E("Scales natural attack/damage trade, Feet speed burst, and Heart SR."),
                S(["attack.natural"], -1, "Untyped", "-(1 + @essentia) penalty on natural attack rolls.", mode="stat", stat="essentia", mult=-1),
                S(["damage.natural"], 1, "Untyped", "+1+@essentia natural damage (+2+2*@essentia for bite).", mode="stat", stat="essentia", mult=1),
                W("while", [B("bound", "Arms Chakra", [F("Doubles natural weapon critical threat range.")])], "Arms Chakra doubles natural crit range."),
                W("when", [B("bound", "Feet Chakra", [S(["speed.all"], 60, "Enhancement", "+60 + 10*@essentia ft speed for 1 round (1/min).", mode="stat", stat="essentia", mult=10)], action="free")], "Feet Chakra grants sprint burst."),
                W("while", [B("bound", "Heart Chakra", [D("Spell Resistance", "SR 5 + 4*@essentia.", value="5+4*@essentia")])], "Heart Chakra grants scaling SR."),
                W("when", [B("bound", "Totem Chakra", [F("On charge, enemies within 60 ft who see you are shaken 1 round (Will negates).")], trigger="charge")], "Totem Chakra shakes foes on a charge."),
            ],
        ),
        # 22
        M(
            "Enigma Helm", 66, ["Incarnate", "Soulborn"], ["Crown"], [], "None",
            "Grants continuous nondetection (diviners must beat DC 11 + meldshaper level).",
            "Grants an enhancement bonus on Will saves equal to invested essentia.",
            {"Crown": "Grants complete immunity to enchantment (charm) effects."},
            "Nondetection (DC 11+ML) & +@essentia Will; Crown bind grants immunity to charm effects.",
            [
                E("Adds +1 enhancement bonus on Will saves per invested essentia."),
                D("State Flag", "Protected by nondetection (DC 11 + meldshaper level)."),
                S(["save.will"], 0, "Enhancement", "+@essentia enhancement bonus on Will saves.", mode="stat", stat="essentia", mult=1),
                W("while", [B("bound", "Crown Chakra", [D("Condition Immunity", "Immunity to enchantment (charm) effects.")])], "Crown Chakra blocks charm effects."),
            ],
        ),
        # 23
        M(
            "Fearsome Mask", 66, ["Soulborn"], ["Brow"], ["Mind-Affecting"], "See text (Will negates shaken gaze on Brow bind)",
            "Grants a +2 insight bonus on Intimidate checks.",
            "Each invested point of essentia increases the Intimidate insight bonus by +2.",
            {"Brow": "Gain a mind-affecting gaze attack that leaves enemies shaken for 1 minute (Will negates; allies exempt)."},
            "+2 (+2/essentia) Intimidate; Brow bind grants a gaze that shakes foes for 1 minute.",
            [
                E("Increases Intimidate insight bonus by +2 per invested essentia."),
                S(["skill.int"], 2, "Insight", "+2 + 2*@essentia insight bonus on Intimidate.", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Brow Chakra", [F("Gaze attack shakes enemies (allies immune) for 1 minute (Will negates).")])], "Brow Chakra grants fearsome gaze."),
            ],
        ),
        # 24
        M(
            "Fellmist Robe", 66, ["Incarnate"], ["Soul"], [], "None",
            "Grants 10% concealment against attackers more than 5 feet away (dispersed by 21+ mph wind, reforms 1 round later).",
            "Each invested point of essentia increases concealment miss chance by +5% (up to 50%).",
            {"Soul": "Concealment applies even against adjacent attackers and resists winds up to 50 mph."},
            "10% (+5%/essentia, max 50%) ranged concealment; Soul bind protects in melee & 50 mph winds.",
            [
                E("Increases concealment miss chance by +5% per point of essentia (cap 50%)."),
                D("Concealment %", "10% + 5%*@essentia miss chance (max 50%) vs attackers > 5 ft away.", value="min(50,10+5*@essentia)%"),
                W("while", [B("bound", "Soul Chakra", [D("Concealment %", "Concealment also applies vs adjacent foes; endures up to 50 mph winds.")])], "Soul Chakra covers adjacent melee attacks."),
            ],
        ),
        # 25
        M(
            "Flame Cincture", 67, ["Incarnate", "Soulborn"], ["Waist"], [], "See text (Reflex half on Waist backlash)",
            "Grants fire resistance 10.",
            "Each invested point of essentia increases fire resistance by +5.",
            {"Waist": "As a swift action on your next turn, launch a 60-ft blast dealing fire damage equal to the fire damage prevented by the cincture in the previous round (Reflex half)."},
            "Resist Fire 10 (+5/essentia); Waist bind retorts prevented fire damage as a 60-ft swift blast.",
            [
                E("Increases fire resistance by +5 per invested essentia."),
                D("Energy Resistance", "Fire resistance 10 + 5*@essentia.", value="10+5*@essentia"),
                W("when", [B("bound", "Waist Chakra", [F("Swift action (60 ft): deal fire damage equal to fire damage absorbed last round (Reflex half).")], action="swift")], "Waist Chakra releases absorbed fire."),
            ],
        ),
        # 26
        M(
            "Frost Helm", 67, ["Totemist"], ["Crown", "Totem"], ["Cold", "Sonic"], "See text (Will negates stun on Totem trill)",
            "Protects you and your gear in temperatures between -50 and 90 degrees F without Fortitude saves.",
            "Grants cold resistance equal to 5 x invested essentia.",
            {
                "Crown": "Standard action ranged touch ray dealing 1d6 + 1d6/essentia cold damage.",
                "Totem": "Standard action 20-ft sonic trill stuns 1 + 1/essentia creatures for 1d4 rounds (Will negates; new save if shaken/attacked; 24h immunity on save/break).",
            },
            "Cold weather protection + Resist Cold 5/essentia; Crown fires cold ray; Totem trills to stun foes.",
            [
                E("Grants Resist Cold 5*@essentia and scales Crown ray & Totem trill targets."),
                D("Energy Resistance", "Cold resistance 5*@essentia plus comfort in -50 to 90 F.", value="5*@essentia"),
                W("when", [B("bound", "Crown Chakra", [R("Damage", 1, 6, "Cold", "Standard action ranged touch ray: 1d6 + @essentia d6 cold.", scaling="perVar", var_key="essentia")], action="standard")], "Crown Chakra fires a cold ray."),
                W("when", [B("bound", "Totem Chakra", [F("Standard action 20-ft trill: 1+@essentia targets stunned 1d4 rounds (Will negates; frost worms immune).")], action="standard")], "Totem Chakra emits a stunning trill."),
            ],
        ),
        # 27
        M(
            "Girallon Arms", 68, ["Totemist"], ["Arms", "Totem"], [], "None",
            "Grants a +2 competence bonus on Climb and grapple checks.",
            "Each invested point of essentia increases Climb and grapple bonuses by +2.",
            {
                "Arms": "Rend an opponent hit by two or more claw attacks in a turn for automatic double claw damage (including 2x Str modifier).",
                "Totem": "Gain four 1d4 claw attacks (1 primary + up to 3 secondary at -5 BAB, 1/2 Str; no secondary claws if using a shield) with +1 enhancement/essentia to attack and damage.",
            },
            "+2 (+2/essentia) Climb & grapple; Arms grants claw rend; Totem grants 4 scaling claw attacks.",
            [
                E("Scales Climb/grapple (+2/pt) and Totem claw attack/damage enhancement (+1/pt)."),
                S(["skill.clm", "grapple"], 2, "Competence", "+2 + 2*@essentia competence on Climb and grapple.", mode="stat", stat="essentia", mult=2),
                W("when", [B("bound", "Arms Chakra", [F("Hit same target with >=2 claws to rend for double claw damage (2x Str).")], trigger="multiClawHit")], "Arms Chakra grants claw rend."),
                W("while", [B("bound", "Totem Chakra", [A("natural", "Girallon Claws (1 Primary + 3 Secondary)", "1d4", "S", "4 claws (1 primary, 3 secondary at -5); +@essentia attack/damage enhancement.", count=4, rider="+@essentia Enh")])], "Totem Chakra grows four clawed arms."),
            ],
        ),
        # 28
        M(
            "Gloves of the Poisoned Soul", 68, ["Soulborn"], ["Hands"], ["Evil"], "Fortitude negates",
            "Once per round as a melee touch attack, inject poison dealing 1 Wis initial and 1 Wis secondary damage (Fortitude negates each; 24h cooldown per target).",
            "Each invested point of essentia increases both initial and secondary Wisdom damage by +1.",
            {"Hands": "Poison also deals Strength damage equal to the Wisdom damage dealt (one save resists both)."},
            "1/round touch poison (1+essentia Wis/Wis); Hands bind adds equal Strength poison damage.",
            [
                E("Increases initial and secondary ability damage by +1 per essentia."),
                F("1/round melee touch poison: 1+@essentia Wis initial and secondary (Fortitude negates, 24h cooldown)."),
                W("while", [B("bound", "Hands Chakra", [F("Poison simultaneously inflicts equal Str damage (single Fortitude save).")])], "Hands Chakra adds matching Strength damage."),
            ],
        ),
        # 29
        M(
            "Gorgon Mask", 68, ["Totemist"], ["Throat", "Totem"], [], "See text (Fortitude negates petrification; Reflex half trample)",
            "Grants a +1 resistance bonus on Fortitude saves and a +2 resistance bonus against bull rush, trip, overrun, or trample.",
            "Each invested point of essentia increases both resistance bonuses by +1.",
            {
                "Throat": "Once per day, breathe petrifying gas on an adjacent foe (as flesh to stone, Fortitude negates).",
                "Totem": "Gain a trample attack (full-round move up to 2x speed, 1d8 + 1.5x Str bludgeoning for Medium; Reflex half forfeits AoO at -4).",
            },
            "+1 (+1/essentia) Fort, +2 (+1/essentia) vs maneuvers; Throat petrifies adjacent foe 1/day; Totem grants trample.",
            [
                E("Increases Fortitude and stability resistance bonuses by +1 per essentia."),
                S(["save.fort"], 1, "Resistance", "+1 + @essentia resistance on Fortitude saves.", mode="stat", stat="essentia", mult=1),
                S(["cmd.stability"], 2, "Resistance", "+2 + @essentia resistance vs bull rush, trip, overrun, trample.", mode="stat", stat="essentia", mult=1),
                W("when", [B("bound", "Throat Chakra", [F("1/day adjacent petrifying breath (flesh to stone, Fortitude negates).")], action="standard")], "Throat Chakra grants 1/day petrifying breath."),
                W("when", [B("bound", "Totem Chakra", [R("Damage", 1, 8, "Bludgeoning", "Full-round trample up to 2x speed: 1d8 + 1.5x Str (Reflex half).", save="Reflex half")], action="full")], "Totem Chakra grants trample."),
            ],
        ),
        # 30
        M(
            "Great Raptor Mask", 69, ["Totemist"], ["Brow", "Totem"], [], "None",
            "Grants a +2 competence bonus on Spot checks.",
            "Each invested point of essentia increases the Spot competence bonus by +2.",
            {
                "Brow": "Grants superior low-light vision (5x human range in dim light).",
                "Totem": "Grants the evasion ability (no damage on successful Reflex save for half).",
            },
            "+2 (+2/essentia) Spot; Brow grants 5x low-light vision; Totem grants evasion.",
            [
                E("Increases Spot competence bonus by +2 per invested essentia."),
                S(["skill.spt"], 2, "Competence", "+2 + 2*@essentia competence bonus on Spot.", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Brow Chakra", [D("Sense / Movement", "Superior low-light vision (5x human distance).")])], "Brow Chakra grants 5x low-light vision."),
                W("while", [B("bound", "Totem Chakra", [D("State Flag", "Evasion (0 damage on successful Reflex half save).")])], "Totem Chakra grants evasion."),
            ],
        ),
        # 31
        M(
            "Heart of Fire", 70, ["Totemist"], ["Waist", "Totem"], ["Fire"], "None",
            "Grants a +1 insight bonus on attack and damage rolls against creatures with the [Cold] subtype.",
            "Each invested point of essentia increases attack and damage bonuses vs [Cold] creatures by +1.",
            {
                "Waist": "Attackers striking you with natural weapons, unarmed strikes, or handheld weapons take 1d6/essentia fire damage (grapplers take it each turn; does not stack with Totem).",
                "Totem": "Your natural weapons and unarmed strikes deal +1d4 fire damage per invested essentia (grapplers take it at end of turn).",
            },
            "+1 (+1/essentia) attack & damage vs Cold subtype; Waist burns attackers (1d6/essentia); Totem adds 1d4/essentia fire to natural strikes.",
            [
                E("Scales attack/damage vs Cold subtype (+1/pt), Waist retributive fire, and Totem fire on natural attacks."),
                S(["attack", "damage"], 1, "Insight", "+1 + @essentia insight on attack and damage vs [Cold] creatures.", mode="stat", stat="essentia", mult=1, condition="vs [Cold] subtype"),
                W("while", [B("bound", "Waist Chakra", [R("Damage", 1, 6, "Fire", "Natural/unarmed attackers (and weapon/grapplers) take @essentia d6 fire.", scaling="perVar", var_key="essentia")])], "Waist Chakra scorches melee attackers."),
                W("while", [B("bound", "Totem Chakra", [R("Damage", 1, 4, "Fire", "Natural weapons and unarmed strikes deal +@essentia d4 fire.", scaling="perVar", var_key="essentia")])], "Totem Chakra adds fire to natural attacks."),
            ],
        ),
        # 32
        M(
            "Hunter's Circlet", 70, ["Soulborn", "Totemist"], ["Crown", "Totem"], [], "None",
            "Grants a +2 insight bonus on Heal and Survival checks.",
            "Each invested point of essentia increases Heal and Survival bonuses by +2.",
            {
                "Crown": "Grants the Track feat.",
                "Totem": "Grants limited scent (detect creatures within 15 ft, full-round to determine direction) and +4 competence on Survival checks to track by scent.",
            },
            "+2 (+2/essentia) Heal & Survival; Crown grants Track; Totem grants 15-ft scent & +4 tracking.",
            [
                E("Increases Heal and Survival insight bonuses by +2 per invested essentia."),
                S(["skill.hea", "skill.sur"], 2, "Insight", "+2 + 2*@essentia insight on Heal and Survival.", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Crown Chakra", [F("Grants Track feat.", effect_kind="grantFeat")])], "Crown Chakra grants Track."),
                W("while", [B("bound", "Totem Chakra", [D("Sense / Movement", "15-ft limited scent and +4 competence on Survival checks to track by scent.")])], "Totem Chakra grants scent tracking."),
            ],
        ),
        # 33
        M(
            "Illusion Veil", 71, ["Incarnate", "Soulborn"], ["Brow"], [], "None",
            "Grants a +1 insight bonus to the save DCs of your illusion spells and spell-like abilities.",
            "Adds +1 round per invested essentia to the duration of illusion spells/SLAs cast (no effect on instantaneous spells).",
            {"Brow": "Grants continuous see invisibility plus an insight bonus equal to invested essentia on Spot checks and saves vs illusions."},
            "+1 illusion DC & +1 round/essentia duration; Brow grants see invisibility & +@essentia Spot/saves vs illusion.",
            [
                E("Extends non-instantaneous illusion duration (+1 rd/pt) and Brow Spot/illusion saves."),
                S(["spell.dc.illusion"], 1, "Insight", "+1 insight bonus to illusion spell/SLA save DCs."),
                F("Non-instantaneous illusion spells gain +@essentia rounds duration."),
                W("while", [B("bound", "Brow Chakra", [D("Sense / Movement", "Continuous see invisibility."), S(["skill.spt", "save.illusion"], 0, "Insight", "+@essentia insight on Spot and saves vs illusions.", mode="stat", stat="essentia", mult=1)])], "Brow Chakra pierces invisibility and illusions."),
            ],
        ),
        # 34
        M(
            "Impulse Boots", 71, ["Incarnate", "Soulborn"], ["Feet"], [], "None",
            "Grants the uncanny dodge ability (retain Dex to AC when flat-footed or struck by invisible attacker).",
            "Grants an enhancement bonus on Reflex saves equal to invested essentia.",
            {"Feet": "Grants the evasion ability (0 damage on successful Reflex half save)."},
            "Uncanny dodge & +@essentia Reflex; Feet bind grants evasion.",
            [
                E("Adds +1 enhancement bonus on Reflex saves per invested essentia."),
                D("State Flag", "Uncanny dodge (retain Dex to AC vs flat-footed/invisible foes)."),
                S(["save.ref"], 0, "Enhancement", "+@essentia enhancement bonus on Reflex saves.", mode="stat", stat="essentia", mult=1),
                W("while", [B("bound", "Feet Chakra", [D("State Flag", "Evasion (no damage on successful Reflex save for half).")])], "Feet Chakra grants evasion."),
            ],
        ),
        # 35
        M(
            "Incarnate Avatar", 71, ["Incarnate"], ["Soul"], ["Chaotic", "Evil", "Good", "Lawful"], "None",
            "Assumes an alignment-matched outer-planar appearance (Chaos/Evil/Good/Law); grants no benefit without invested essentia.",
            "Per invested essentia: Chaos +1 insight ranged attack; Evil +2 insight melee damage; Good +1 insight AC; Law +1 insight melee attack.",
            {"Soul": "Chaos: +30 ft enhancement land speed; Evil or Good: Fly 30 ft (good); Law: Immune to daze, paralysis, petrification, stun, and magical slow."},
            "Alignment-keyed scaling (+@essentia ranged atk / +2*@essentia melee dmg / +@essentia AC / +@essentia melee atk); Soul grants speed/flight/immunities.",
            [
                E("Requires >=1 essentia; effect scales strictly by alignment (C/E/G/L)."),
                W("while", [B("state", "Chaotic Alignment", [S(["attack.ranged"], 0, "Insight", "+@essentia insight on ranged attacks.", mode="stat", stat="essentia", mult=1)])], "Chaotic alignment boosts ranged attack rolls."),
                W("while", [B("state", "Evil Alignment", [S(["damage.melee"], 0, "Insight", "+2*@essentia insight on melee damage.", mode="stat", stat="essentia", mult=2)])], "Evil alignment boosts melee damage rolls."),
                W("while", [B("state", "Good Alignment", [S(["ac.total"], 0, "Insight", "+@essentia insight to AC.", mode="stat", stat="essentia", mult=1)])], "Good alignment boosts AC."),
                W("while", [B("state", "Lawful Alignment", [S(["attack.melee"], 0, "Insight", "+@essentia insight on melee attacks.", mode="stat", stat="essentia", mult=1)])], "Lawful alignment boosts melee attack rolls."),
                W("while", [B("bound", "Soul Chakra", [F("Chaos: +30 ft land speed; Good/Evil: Fly 30 ft (good); Law: Immune to daze, paralysis, petrification, stun, slow.")])], "Soul Chakra grants major alignment mobility or immunities."),
            ],
        ),
        # 36
        M(
            "Incarnate Weapon", 72, ["Incarnate"], ["Arms"], ["Chaotic", "Evil", "Good", "Lawful"], "See text (Fortitude negates stun on Arms bind)",
            "Shapes an alignment-matched one-handed melee weapon (Chaos=battleaxe, Evil=flail, Good=warhammer, Law=longsword) usable without nonproficiency penalty, immune to sundering, returning to hand at start of next turn, overcoming aligned DR.",
            "Weapon gains an enhancement bonus on attack and damage rolls equal to invested essentia.",
            {"Arms": "As a move action, charge weapon: next successful melee hit against a foe of opposed alignment forces Fortitude save or stuns until start of your next turn."},
            "Manifests unbreakable aligned weapon (+@essentia atk/dmg); Arms bind charges a stunning strike.",
            [
                E("Grants +1 enhancement on attack & damage per invested essentia."),
                A("weaponImbue", "Incarnate Weapon", "1d8", "Aligned (C/E/G/L)", "Proficient aligned weapon (battleaxe/flail/warhammer/longsword) with +@essentia enhancement.", rider="+@essentia Enh, aligned DR"),
                W("when", [B("bound", "Arms Chakra", [F("Move action charges weapon: next hit vs opposed alignment forces Fortitude save or stuns 1 round.")], action="move")], "Arms Chakra adds alignment stun charge."),
            ],
        ),
        # 37
        M(
            "Keeneye Lenses", 73, ["Incarnate"], ["Brow", "Soul"], [], "None",
            "Grants a +4 insight bonus on Spot checks.",
            "Each invested point of essentia increases the Spot insight bonus by +2.",
            {
                "Brow": "Grants continuous see invisibility.",
                "Soul": "Grants continuous true seeing.",
            },
            "+4 (+2/essentia) Spot; Brow grants see invisibility; Soul grants continuous true seeing.",
            [
                E("Increases Spot insight bonus by +2 per invested essentia."),
                S(["skill.spt"], 4, "Insight", "+4 + 2*@essentia insight bonus on Spot.", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Brow Chakra", [D("Sense / Movement", "Continuous see invisibility.")])], "Brow Chakra perceives invisible creatures."),
                W("while", [B("bound", "Soul Chakra", [D("Sense / Movement", "Continuous true seeing.")])], "Soul Chakra pierces all illusions and disguises."),
            ],
        ),
        # 38
        M(
            "Kraken Mantle", 73, ["Totemist"], ["Arms", "Totem"], [], "None",
            "Grants a +8 competence bonus on Swim checks and allows swimming at full speed (full-round) or half speed (move) on a successful check.",
            "Each invested point of essentia adds +5 feet to effective swim movement speed.",
            {
                "Arms": "Grants +@essentia bonus on grapple checks and deals 1d8 + Str (1d6 Small) bludgeoning damage on a successful grapple check.",
                "Totem": "Allows breathing both water and air continuously (as water breathing).",
            },
            "+8 Swim & +5 ft/essentia swim speed; Arms boosts grapple & constricts 1d8+Str; Totem grants water breathing.",
            [
                E("Scales swim speed (+5 ft/pt) and Arms grapple check bonus (+1/pt)."),
                S(["skill.swm"], 8, "Competence", "+8 competence bonus on Swim checks."),
                S(["speed.swim"], 0, "Untyped", "+5 * @essentia ft effective swim speed.", mode="stat", stat="essentia", mult=5),
                W("while", [B("bound", "Arms Chakra", [S(["grapple"], 0, "Untyped", "+@essentia bonus on grapple checks; grapple check deals 1d8+Str (1d6 Small).", mode="stat", stat="essentia", mult=1)])], "Arms Chakra adds constricting grapple damage."),
                W("while", [B("bound", "Totem Chakra", [D("Sense / Movement", "Continuous water breathing.")])], "Totem Chakra grants aquatic respiration."),
            ],
        ),
        # 39
        M(
            "Krenshar Mask", 73, ["Totemist"], ["Brow", "Totem"], ["Fear", "Mind-Affecting", "Sonic"], "See text (Will negates frightened on Totem shriek)",
            "Grants a +4 competence bonus on Jump and Move Silently checks.",
            "Each invested point of essentia increases Jump and Move Silently bonuses by +2.",
            {
                "Brow": "Grants a competence bonus on Intimidate equal to the mask's Jump/Move Silently bonus (+4 + 2/essentia).",
                "Totem": "Standard action screech within 30 ft frightens one creature that can see you for 1 round (Will negates).",
            },
            "+4 (+2/essentia) Jump & Move Silently; Brow adds equal Intimidate bonus; Totem shrieks to frighten 1 foe.",
            [
                E("Increases Jump, Move Silently (and Brow Intimidate) by +2 per essentia."),
                S(["skill.jmp", "skill.ms"], 4, "Competence", "+4 + 2*@essentia competence on Jump and Move Silently.", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Brow Chakra", [S(["skill.int"], 4, "Competence", "+4 + 2*@essentia competence bonus on Intimidate.", mode="stat", stat="essentia", mult=2)])], "Brow Chakra boosts Intimidate equally."),
                W("when", [B("bound", "Totem Chakra", [F("Standard action screech (30 ft): 1 visible foe frightened 1 round (Will negates; sonic, fear, mind-affecting).")], action="standard")], "Totem Chakra emits frightening screech."),
            ],
        ),
        # 40
        M(
            "Kruthik Claws", 74, ["Totemist"], ["Hands", "Shoulders", "Totem"], ["Acid"], "None",
            "Grants a +4 competence bonus on Hide and Move Silently checks.",
            "Each invested point of essentia increases Hide and Move Silently bonuses by +2.",
            {
                "Hands": "Grants Weapon Finesse when attacking with natural weapons.",
                "Shoulders": "Grants acid resistance 10 + 5 per invested essentia.",
                "Totem": "Gain two 1d6 claw attacks dealing +1d4 acid damage per invested essentia.",
            },
            "+4 (+2/essentia) Hide & Move Silently; Hands finesses natural attacks; Shoulders resists acid; Totem grants 1d6 acid claws.",
            [
                E("Scales Hide/Move Silently (+2/pt), Shoulders acid resistance (+5/pt), and Totem claw acid (+1d4/pt)."),
                S(["skill.hid", "skill.ms"], 4, "Competence", "+4 + 2*@essentia competence on Hide and Move Silently.", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Hands Chakra", [F("Weapon Finesse for natural weapons.", effect_kind="grantFeat")])], "Hands Chakra grants natural Weapon Finesse."),
                W("while", [B("bound", "Shoulders Chakra", [D("Energy Resistance", "Acid resistance 10 + 5*@essentia.", value="10+5*@essentia")])], "Shoulders Chakra grants acid resistance."),
                W("while", [B("bound", "Totem Chakra", [A("natural", "Kruthik Claws", "1d6", "S + Acid", "Two 1d6 claws plus @essentia d4 acid damage.", count=2, rider="+@essentia d4 Acid")])], "Totem Chakra grants acidic scythe claws."),
            ],
        ),
        # 41
        M(
            "Lamia Belt", 74, ["Totemist"], ["Waist", "Totem"], ["Evil"], "None",
            "Grants a +4 competence bonus on Bluff and Hide checks.",
            "Each invested point of essentia increases Bluff and Hide bonuses by +2.",
            {
                "Waist": "Grants a +10-foot enhancement bonus to land speed and the Spring Attack feat.",
                "Totem": "Grow a leonine lower body with two 1d4 secondary claw attacks (-5 BAB) usable after weapon or primary natural attacks.",
            },
            "+4 (+2/essentia) Bluff & Hide; Waist grants +10 ft speed & Spring Attack; Totem grants 2 secondary claws.",
            [
                E("Increases Bluff and Hide competence bonuses by +2 per essentia."),
                S(["skill.blf", "skill.hid"], 4, "Competence", "+4 + 2*@essentia competence on Bluff and Hide.", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Waist Chakra", [S(["speed.land"], 10, "Enhancement", "+10 ft enhancement to land speed."), F("Grants Spring Attack feat.", effect_kind="grantFeat")])], "Waist Chakra grants +10 ft speed and Spring Attack."),
                W("while", [B("bound", "Totem Chakra", [A("natural", "Lion Claws", "1d4", "S", "Two secondary claw attacks (-5 attack bonus, 1/2 Str).", nat_kind="secondary", count=2, penalty="-5 BAB")])], "Totem Chakra adds two secondary claw attacks."),
            ],
        ),
        # 42
        M(
            "Lammasu Mantle", 75, ["Incarnate", "Totemist"], ["Arms", "Shoulders", "Totem"], ["Good"], "See text (Reflex half on Totem fire cone)",
            "Grants a +2 deflection bonus to AC against attacks and effects from evil creatures.",
            "Grants a +1 resistance bonus per invested essentia on saving throws against spells and effects from evil creatures.",
            {
                "Arms": "Extends the AC deflection and save resistance bonuses vs evil to allies within 10 feet.",
                "Shoulders": "Prevents non-good summoned creatures from approaching within 10 feet (as magic circle against evil).",
                "Totem": "Standard action breathes a 15-ft cone of fire dealing 1d4 + 1d4/essentia fire damage (Reflex half).",
            },
            "+2 deflection AC & +@essentia saves vs evil; Arms shares aura; Shoulders blocks evil summons; Totem breathes fire cone.",
            [
                E("Scales save resistance vs evil (+1/pt) and Totem fire breath (+1d4/pt)."),
                S(["ac.deflection"], 2, "Deflection", "+2 deflection AC vs evil creatures.", condition="vs evil"),
                S(["save.all"], 0, "Resistance", "+@essentia resistance on saves vs evil spells/effects.", mode="stat", stat="essentia", mult=1, condition="vs evil"),
                W("while", [B("bound", "Arms Chakra", [F("Allies within 10 ft share deflection AC and resistance save bonuses vs evil.")])], "Arms Chakra projects protective aura."),
                W("while", [B("bound", "Shoulders Chakra", [D("State Flag", "Blocks non-good summoned creatures within 10 ft (as magic circle against evil).")])], "Shoulders Chakra wards off summoned foes."),
                W("when", [B("bound", "Totem Chakra", [R("Damage", 1, 4, "Fire", "Standard action 15-ft cone: 1d4 + @essentia d4 fire (Reflex half).", scaling="perVar", var_key="essentia", save="Reflex half")], action="standard")], "Totem Chakra breathes a 15-ft fire cone."),
            ],
        ),
        # 43
        M(
            "Landshark Boots", 75, ["Totemist"], ["Feet", "Totem"], [], "None",
            "Grants a +4 competence bonus on Jump checks.",
            "Each invested point of essentia increases the Jump competence bonus by +2.",
            {
                "Feet": "While grounded, spend a move action for limited tremorsense detecting count and direction (not pinpoint) of grounded creatures within 10 ft + 5 ft/essentia.",
                "Totem": "Gain 1d6 hand-claws (+@essentia attack/damage enhancement, incompatible with shield); jumping at least 5 ft vertically lets you strike one foe with all 4 claws at full attack bonus as a standard action.",
            },
            "+4 (+2/essentia) Jump; Feet grants move-action limited tremorsense; Totem grants 4-claw leaping pounce.",
            [
                E("Scales Jump (+2/pt), Feet tremorsense (+5 ft/pt), and Totem claw enhancement (+1/pt)."),
                S(["skill.jmp"], 4, "Competence", "+4 + 2*@essentia competence bonus on Jump.", mode="stat", stat="essentia", mult=2),
                W("when", [B("bound", "Feet Chakra", [D("Sense / Movement", "Move action: sense count and direction of grounded creatures within 10 + 5*@essentia ft.")], action="move")], "Feet Chakra grants limited tremorsense."),
                W("while", [B("bound", "Totem Chakra", [A("natural", "Bulette Claws", "1d6", "S", "1d6 claws (+@essentia attack/damage enhancement); 5-ft high jump enables 4-claw standard attack.", count=4, rider="+@essentia Enh")])], "Totem Chakra enables 4-claw jumping attack."),
            ],
        ),
        # 44
        M(
            "Lifebond Vestments", 76, ["Incarnate"], ["Arms", "Heart"], [], "None",
            "Standard action touch heals a living creature up to your meldshaper level in hp while dealing you half that amount (rounded up); 1-hour cooldown per target.",
            "Each invested point of essentia increases the maximum healing per touch by +5 hit points.",
            {
                "Arms": "Increases healing transfer range from touch to 30 feet.",
                "Heart": "Removes the 1-hour per-target cooldown, allowing at-will healing transfers.",
            },
            "Transfer HP as healing (up to ML + 5/essentia, take half dmg); Arms makes 30 ft; Heart removes 1h cooldown.",
            [
                E("Raises per-use healing cap by +5 hit points per invested essentia."),
                R("Healing", 1, 1, "Positive/Transfer", "Standard action heals up to ML + 5*@essentia hp (you take half rounded up; 1h cooldown/target).", scaling="perVar", var_key="essentia"),
                W("while", [B("bound", "Arms Chakra", [F("Healing ability functions at 30-ft range instead of touch.")])], "Arms Chakra extends range to 30 ft."),
                W("while", [B("bound", "Heart Chakra", [F("Eliminates 1-hour per-creature cooldown.")])], "Heart Chakra allows at-will healing."),
            ],
        ),
        # 45
        M(
            "Lightning Gauntlets", 76, ["Incarnate"], ["Hands"], ["Electricity"], "None",
            "As a standard action, make a melee touch attack dealing 1d6 electricity damage.",
            "Each invested point of essentia increases electricity damage by +1d6.",
            {"Hands": "Add the gauntlets' electricity damage once per round to a declared handheld weapon, unarmed, or hand-based natural melee attack (wasted on a miss)."},
            "1d6 (+1d6/essentia) electricity touch attack; Hands bind channels the shock through melee weapon/hand attacks.",
            [
                E("Adds +1d6 electricity damage per invested essentia."),
                R("Damage", 1, 6, "Electricity", "Standard action melee touch: 1d6 + @essentia d6 electricity.", scaling="perVar", var_key="essentia"),
                W("while", [B("bound", "Hands Chakra", [F("Add electricity dice once per round to a declared melee attack (wasted if attack misses).")])], "Hands Chakra channels shock onto melee hits."),
            ],
        ),
        # 46
        M(
            "Lucky Dice", 77, ["Incarnate", "Soulborn"], ["Hands"], [], "None",
            "As a swift action, roll 2d6 and gain a +1 luck bonus for 1 round to one category (attack & damage, saves, or skills & ability checks)—or all three if the 2d6 total equals 7.",
            "Each invested point of essentia extends the luck bonus duration by +1 round (allowing multiple categories to overlap).",
            {"Hands": "Shares the luck bonus with all allies within 30 feet when activated."},
            "Swift +1 luck bonus to chosen roll category (or all on 2d6=7) for 1+@essentia rounds; Hands shares 30 ft.",
            [
                E("Extends luck bonus duration by +1 round per invested essentia."),
                F("Swift action: +1 luck for 1 + @essentia rounds to attack/damage, saves, OR skills/ability checks (all three on 2d6=7)."),
                W("while", [B("bound", "Hands Chakra", [F("Allies within 30 ft receive the active luck bonus.")])], "Hands Chakra shares luck with nearby allies."),
            ],
        ),
        # 47
        M(
            "Mage's Spectacles", 77, ["Incarnate"], ["Brow"], [], "None",
            "Grants a +4 insight bonus on Decipher Script, Spellcraft, and Use Magic Device checks, and enables untrained checks with all three skills.",
            "Each invested point of essentia increases the insight bonus on those skills by +2.",
            {"Brow": "Enables continuous read magic to decipher magical writings."},
            "+4 (+2/essentia) insight & untrained use on Decipher Script, Spellcraft, UMD; Brow grants continuous read magic.",
            [
                E("Increases Decipher Script, Spellcraft, and UMD bonuses by +2 per essentia."),
                S(["skill.dec", "skill.spl", "skill.umd"], 4, "Insight", "+4 + 2*@essentia insight on Decipher Script, Spellcraft, UMD (usable untrained).", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Brow Chakra", [F("Continuous read magic effect.")])], "Brow Chakra deciphers magical scripts automatically."),
            ],
        ),
        # 48
        M(
            "Manticore Belt", 77, ["Totemist"], ["Waist", "Totem"], [], "None",
            "Grants a +2 enhancement bonus on Jump and Spot checks.",
            "Each invested point of essentia increases Jump and Spot bonuses by +2.",
            {
                "Waist": "Grants flight at 10 ft/essentia (clumsy) and the Flyby Attack feat.",
                "Totem": "Standard action fires a volley of spikes equal to invested essentia (30-ft increment, max 150 ft; targets within 30 ft of each other; full BAB, 1d6 + 1/2 Str each).",
            },
            "+2 (+2/essentia) Jump & Spot; Waist grants flight & Flyby Attack; Totem fires @essentia tail spikes (1d6+1/2 Str).",
            [
                E("Scales Jump/Spot (+2/pt), Waist fly speed (10 ft/pt), and Totem spike count (1/pt)."),
                S(["skill.jmp", "skill.spt"], 2, "Enhancement", "+2 + 2*@essentia enhancement on Jump and Spot.", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Waist Chakra", [D("Sense / Movement", "Fly 10*@essentia ft (clumsy)."), F("Grants Flyby Attack feat.", effect_kind="grantFeat")])], "Waist Chakra grants winged flight and Flyby Attack."),
                W("when", [B("bound", "Totem Chakra", [A("natural", "Manticore Tail Spikes", "1d6", "P", "Fire @essentia spikes (30-ft inc., max 150 ft; full BAB; 1d6 + 1/2 Str).", count=1, rider="@essentia spikes/volley")], action="standard")], "Totem Chakra launches tail spike volleys."),
            ],
        ),
        # 49
        M(
            "Mantle of Flame", 78, ["Incarnate"], ["Shoulders"], ["Fire"], "See text (Reflex half on Shoulders pulse)",
            "Melee attackers striking you with body or non-reach handheld weapons suffer 1d6 fire damage; sheds shadowy light in your space.",
            "Each invested point of essentia increases retributive fire damage by +1d6.",
            {"Shoulders": "As a standard action, flare the cloak to deal its fire damage to all adjacent creatures (Reflex half)."},
            "Retaliates with 1d6 (+1d6/essentia) fire against melee hits; Shoulders pulses fire to all adjacent foes.",
            [
                E("Increases retributive and pulsed fire damage by +1d6 per essentia."),
                R("Damage", 1, 6, "Fire", "Attackers striking in melee (non-reach) take 1d6 + @essentia d6 fire.", scaling="perVar", var_key="essentia"),
                W("when", [B("bound", "Shoulders Chakra", [R("Damage", 1, 6, "Fire", "Standard action pulse deals 1d6 + @essentia d6 fire to all adjacent creatures (Reflex half).", scaling="perVar", var_key="essentia", save="Reflex half")], action="standard")], "Shoulders Chakra bursts fire into adjacent squares."),
            ],
        ),
        # 50
        M(
            "Mauling Gauntlets", 78, ["Soulborn"], ["Arms", "Hands"], [], "None",
            "Grants a +2 morale bonus on raw Strength checks (such as breaking doors or bull rush; does not apply to Strength-based skills).",
            "Each invested point of essentia increases the Strength-check morale bonus by +2.",
            {
                "Arms": "Doubles the critical threat range of any wielded melee weapon (does not stack with Keen or Improved Critical).",
                "Hands": "Grants Improved Unarmed Strike and adds the gauntlets' Strength-check morale bonus (+2 + 2/essentia) to unarmed strike damage.",
            },
            "+2 (+2/essentia) morale Strength checks; Arms doubles melee crit range; Hands grants Improved Unarmed Strike & damage bonus.",
            [
                E("Increases morale bonus on Strength checks (and Hands unarmed damage) by +2 per essentia."),
                S(["check.str"], 2, "Morale", "+2 + 2*@essentia morale on Strength ability checks (not skills).", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Arms Chakra", [F("Doubles melee weapon threat range (non-stacking).")])], "Arms Chakra doubles melee critical threat range."),
                W("while", [B("bound", "Hands Chakra", [F("Grants Improved Unarmed Strike.", effect_kind="grantFeat"), S(["damage.unarmed"], 2, "Morale", "+2 + 2*@essentia morale bonus on unarmed strike damage.", mode="stat", stat="essentia", mult=2)])], "Hands Chakra empowers unarmed strikes."),
            ],
        ),
        # 51
        M(
            "Necrocarnum Circlet", 78, ["Incarnate", "Soulborn"], ["Crown"], ["Evil", "Necrocarnum"], "None",
            "Detects the exact presence and location of all undead within 30 feet (functions like blindsight for undead only).",
            "Undead within 30 feet gain turn resistance equal to invested essentia (doubled for undead you animated).",
            {"Crown": "Full-round action (provokes AoO; take unhealable HP damage equal to zombie HD) animates 1 corpse within 30 ft (HD <= meldshaper level) as a controlled necrocarnum zombie (max 1 active)."},
            "30-ft undead blindsight & turn resistance aura; Crown bind animates 1 necrocarnum zombie.",
            [
                E("Grants turn resistance (@essentia, or 2*@essentia for your own undead) within 30 ft."),
                D("Sense / Movement", "Detect exact undead positions within 30 ft (blindsight vs undead)."),
                W("when", [B("bound", "Crown Chakra", [F("Full-round action animates 1 corpse <= ML HD within 30 ft as necrocarnum zombie (costs zombie HD in unhealable HP damage while active).")], action="full")], "Crown Chakra animates a necrocarnum zombie."),
            ],
        ),
        # 52
        M(
            "Necrocarnum Mantle", 79, ["Incarnate", "Soulborn"], ["Throat"], ["Evil", "Necrocarnum"], "None",
            "Grants immunity to new diseases (existing diseases remain unaffected).",
            "Grants a +1 profane bonus per invested essentia on saving throws against mind-affecting effects.",
            {"Throat": "Grants immunity to poison."},
            "Disease immunity & +@essentia profane saves vs mind-affecting; Throat bind grants poison immunity.",
            [
                E("Adds +1 profane bonus per essentia on saves vs mind-affecting effects."),
                D("Condition Immunity", "Immunity to disease."),
                S(["save.mindAffecting"], 0, "Profane", "+@essentia profane bonus on saves vs mind-affecting effects.", mode="stat", stat="essentia", mult=1),
                W("while", [B("bound", "Throat Chakra", [D("Condition Immunity", "Immunity to poison.")])], "Throat Chakra blocks poison."),
            ],
        ),
        # 53
        M(
            "Necrocarnum Shroud", 79, ["Incarnate", "Soulborn"], ["Soul", "Waist"], ["Evil", "Necrocarnum"], "See text (Fortitude half on Soul; Will negates shaken on Waist)",
            "Whenever a living creature takes damage within 5 feet, gain +1 profane bonus on attack and damage rolls for 1 round (or HD rounds if it dies).",
            "Expands the trigger radius by +5 feet per invested point of essentia.",
            {
                "Soul": "Standard action melee touch bestows 1d4 negative levels to a living foe (Fortitude half); gain 1 temp essentia (1 round) and 5 temp hp (1 hour) per level drained.",
                "Waist": "At the start of your turn, enemies inside your shroud radius must succeed on a Will save or become shaken for 1 round.",
            },
            "+1 profane atk/dmg when nearby living foe is hurt/slain; Waist aura shakes foes; Soul touch drains 1d4 levels.",
            [
                E("Expands shroud trigger radius (5 + 5*@essentia ft)."),
                F("+1 profane attack & damage for 1 round (or target HD rounds on death) when living creature takes damage within 5 + 5*@essentia ft."),
                W("when", [B("bound", "Soul Chakra", [F("Standard action touch bestows 1d4 negative levels (Fortitude half); gain 1 temp essentia + 5 temp hp per level bestowed.")], action="standard")], "Soul Chakra drains negative levels for temp essentia/hp."),
                W("while", [B("bound", "Waist Chakra", [F("Start of turn: creatures inside 5 + 5*@essentia ft aura must make Will save or be shaken 1 round.")])], "Waist Chakra radiates fear."),
            ],
        ),
        # 54
        M(
            "Necrocarnum Touch", 80, ["Incarnate", "Soulborn"], ["Arms"], ["Evil", "Necrocarnum"], "See text (Fortitude half on touch/ray)",
            "Grants a +4 profane bonus on Sleight of Hand checks (usable untrained) and Bluff checks to feint in combat.",
            "Allows a standard-action melee touch attack dealing 1d8 damage per invested essentia to living creatures (Fortitude half).",
            {"Arms": "Converts the necrocarnum touch into a 30-ft ranged touch ray dealing 1d8/essentia damage to living targets (Fortitude half)."},
            "+4 profane Sleight of Hand & Bluff (feint) + 1d8/essentia living touch; Arms fires it as a 30-ft ray.",
            [
                E("Unlocks and scales necrocarnum touch/ray damage (1d8 per invested essentia, Fort half)."),
                S(["skill.soh", "skill.blf.feint"], 4, "Profane", "+4 profane on Sleight of Hand (untrained ok) and combat feints."),
                R("Damage", 1, 8, "Necrocarnum", "Standard action melee touch vs living: @essentia d8 (Fortitude half).", scaling="perVar", var_key="essentia", save="Fortitude half"),
                W("when", [B("bound", "Arms Chakra", [R("Damage", 1, 8, "Necrocarnum", "30-ft ranged touch ray vs living: @essentia d8 (Fortitude half).", scaling="perVar", var_key="essentia", save="Fortitude half")], action="standard")], "Arms Chakra projects damage as a 30-ft ray."),
            ],
        ),
        # 55
        M(
            "Necrocarnum Vestments", 80, ["Incarnate", "Soulborn"], ["Heart", "Waist"], ["Evil", "Necrocarnum"], "See text (Fortitude negates cold aura on Waist)",
            "Grants cold resistance 5.",
            "Grants +3 real (non-temporary) bonus hit points per invested point of essentia (reinvesting away lowers current/max hp accordingly).",
            {
                "Heart": "Grants immunity to stunning and death effects.",
                "Waist": "Living creatures ending adjacent to your space at the end of your turn take 1d6 cold damage (Fortitude negates).",
            },
            "Resist Cold 5 & +3/essentia real HP; Heart resists stun/death; Waist chills adjacent living foes.",
            [
                E("Grants +3 real bonus HP per point of invested essentia."),
                D("Energy Resistance", "Cold resistance 5.", value=5),
                S(["hp.max"], 0, "Untyped", "+3 * @essentia bonus HP (non-temporary).", mode="stat", stat="essentia", mult=3),
                W("while", [B("bound", "Heart Chakra", [D("Condition Immunity", "Immunity to stunning and death effects.")])], "Heart Chakra grants stun and death immunity."),
                W("while", [B("bound", "Waist Chakra", [R("Damage", 1, 6, "Cold", "End of turn: adjacent living creatures take 1d6 cold (Fortitude negates).", save="Fortitude negates")])], "Waist Chakra chills adjacent living foes."),
            ],
        ),
        # 56
        M(
            "Necrocarnum Weapon", 81, ["Incarnate", "Soulborn"], ["Hands"], ["Evil", "Necrocarnum"], "None",
            "Imbues a chosen melee weapon to overcome evil-aligned DR for you (unshared; harmless to unshape).",
            "Grants a +1 profane bonus per invested essentia on weapon damage rolls and critical confirmation rolls against living creatures.",
            {"Hands": "Confirming a critical hit (including coup de grace) against a living creature grants temporary essentia equal to invested essentia for 10 rounds (non-stacking)."},
            "Weapon pierces evil DR & +@essentia profane dmg/crit confirm vs living; Hands gains temp essentia on crits.",
            [
                E("Adds +1 profane bonus per essentia to damage and crit confirmation vs living foes."),
                S(["damage.weapon", "attack.critConfirm"], 0, "Profane", "+@essentia profane on damage & crit confirmation vs living.", mode="stat", stat="essentia", mult=1, condition="vs living"),
                W("when", [B("bound", "Hands Chakra", [F("Critical hit vs living creature grants @essentia temporary essentia for 10 rounds.")], trigger="criticalHit")], "Hands Chakra harvests temporary essentia on critical hits."),
            ],
        ),
        # 57
        M(
            "Pauldrons of Health", 81, ["Incarnate", "Soulborn"], ["Shoulders"], [], "None",
            "Grants immunity to disease, sickened, and nauseated conditions.",
            "Grants an enhancement bonus on Fortitude saves equal to invested essentia.",
            {"Shoulders": "Grants immunity to energy drain attacks."},
            "Immune to disease/sickened/nauseated & +@essentia Fort; Shoulders blocks energy drain.",
            [
                E("Adds +1 enhancement bonus on Fortitude saves per invested essentia."),
                D("Condition Immunity", "Immunity to disease, sickened, and nauseated."),
                S(["save.fort"], 0, "Enhancement", "+@essentia enhancement on Fortitude saves.", mode="stat", stat="essentia", mult=1),
                W("while", [B("bound", "Shoulders Chakra", [D("Condition Immunity", "Immunity to energy drain.")])], "Shoulders Chakra grants energy drain immunity."),
            ],
        ),
        # 58
        M(
            "Pegasus Cloak", 81, ["Totemist"], ["Shoulders", "Totem"], [], "None",
            "Grants continuous feather fall and a +2 enhancement bonus on Jump checks.",
            "Each invested point of essentia increases the Jump enhancement bonus by +2.",
            {
                "Shoulders": "True flight at 10 ft per invested essentia (average maneuverability).",
                "Totem": "Move-action limited flight up to 10 ft per invested essentia (average; must begin and end on a solid surface).",
            },
            "Continuous feather fall & +2 (+2/essentia) Jump; Shoulders grants true flight; Totem grants gliding hops.",
            [
                E("Scales Jump (+2/pt) and Shoulders/Totem flight speed (10 ft/pt)."),
                D("State Flag", "Continuous feather fall."),
                S(["skill.jmp"], 2, "Enhancement", "+2 + 2*@essentia enhancement bonus on Jump.", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Shoulders Chakra", [D("Sense / Movement", "Fly 10*@essentia ft (average maneuverability).")])], "Shoulders Chakra grants sustained flight."),
                W("while", [B("bound", "Totem Chakra", [D("Sense / Movement", "Move action fly up to 10*@essentia ft (average; land-to-land).")])], "Totem Chakra grants short-hop flight."),
            ],
        ),
        # 59
        M(
            "Phase Cloak", 82, ["Totemist"], ["Shoulders", "Totem"], [], "See text (Fortitude negates poison on Totem bite)",
            "Grants +4 competence on Climb checks; take 10 on Climb even when threatened and retain Dex to AC while climbing.",
            "Each invested point of essentia increases the Climb competence bonus by +2.",
            {
                "Shoulders": "Whenever moving >= 5 ft as a move action, become ethereal during that move (pass through walls/no AoOs; end each move in valid Material space or shunt 1d6/5 ft; 20% Ethereal encounter check).",
                "Totem": "Gain a 1d4 bite attack (+@essentia attack enhancement) injecting 1d3 Con poison (no secondary damage, Fortitude negates).",
            },
            "+4 (+2/essentia) Climb + take 10/keep Dex; Shoulders phases ethereal during moves; Totem grants Con-poison bite.",
            [
                E("Scales Climb (+2/pt) and Totem venomous bite attack enhancement (+1/pt)."),
                S(["skill.clm"], 4, "Competence", "+4 + 2*@essentia competence on Climb (take 10 under stress, keep Dex).", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Shoulders Chakra", [D("Sense / Movement", "Turn ethereal during move actions (>= 5 ft).")])], "Shoulders Chakra enables phase-stepping."),
                W("while", [B("bound", "Totem Chakra", [A("natural", "Phase Spider Bite", "1d4", "P + Poison", "1d4 bite (+@essentia attack) + 1d3 Con poison (Fort negates).", nat_kind="primary", rider="+@essentia Atk, 1d3 Con poison")])], "Totem Chakra grants venomous spider bite."),
            ],
        ),
        # 60
        M(
            "Phoenix Belt", 82, ["Totemist"], ["Waist", "Totem"], ["Fire"], "See text (Reflex half on Totem fire burst)",
            "Protects you and gear from heat stress between 40 and 140 degrees F without Fortitude saves.",
            "Grants fire resistance equal to 5 x invested essentia.",
            {
                "Waist": "Whenever fire resistance reduces incoming fire damage, gain fast healing 1 for rounds equal to damage negated (non-stacking; longer duration supersedes).",
                "Totem": "As a standard action, unleash a flame ring dealing 1d6/essentia fire damage to all adjacent creatures (Reflex half).",
            },
            "Heat protection & Resist Fire 5/essentia; Waist turns absorbed fire into fast healing 1; Totem bursts 1d6/essentia fire.",
            [
                E("Grants fire resistance (5/pt) and scales Totem flame ring (1d6/pt)."),
                D("Energy Resistance", "Fire resistance 5*@essentia; comfort in 40-140 F.", value="5*@essentia"),
                W("when", [B("bound", "Waist Chakra", [D("State Flag", "When fire resistance absorbs damage, gain fast healing 1 for rounds equal to negated damage.")], trigger="fireResisted")], "Waist Chakra converts resisted fire into regeneration."),
                W("when", [B("bound", "Totem Chakra", [R("Damage", 1, 6, "Fire", "Standard action burst: @essentia d6 fire to adjacent creatures (Reflex half).", scaling="perVar", var_key="essentia", save="Reflex half")], action="standard")], "Totem Chakra creates a flame ring."),
            ],
        ),
        # 61
        M(
            "Planar Chasuble", 83, ["Incarnate"], ["Brow", "Soul"], [], "None",
            "Count as native to planes matching your incarnate alignment (extraplanar on Material; ignore matching alignment traits) and gain Energy Resistance 10 (Chaos=Electricity, Evil=Acid, Good=Cold, Law=Fire).",
            "Each invested point of essentia increases that alignment-keyed energy resistance by +5.",
            {
                "Brow": "Increases your incarnate radiance class feature bonus by +1.",
                "Soul": "Once per week, open a gate (as the spell; 1,000 XP if calling creatures) to a plane matching your alignment.",
            },
            "Alignment-keyed Resist 10 (+5/essentia) & native planar trait immunity; Brow +1 radiance; Soul 1/week gate.",
            [
                E("Increases alignment energy resistance by +5 per invested essentia."),
                D("Energy Resistance", "10 + 5*@essentia resistance (Chaos: Elec, Evil: Acid, Good: Cold, Law: Fire).", value="10+5*@essentia"),
                W("while", [B("bound", "Brow Chakra", [F("Incarnum radiance class bonus increases by +1.")])], "Brow Chakra boosts incarnate radiance."),
                W("when", [B("bound", "Soul Chakra", [F("1/week cast gate to alignment-matched plane (1,000 XP if calling).", effect_kind="castSpell")], action="standard")], "Soul Chakra opens an alignment gate 1/week."),
            ],
        ),
        # 62
        M(
            "Planar Ward", 83, ["Incarnate"], ["Throat"], [], "See text (Will negates banishment on Throat bind)",
            "Suppresses ongoing mental control, charm, compulsion, and new possession attempts while shaped.",
            "Grants a morale bonus on saves against supernatural and spell-like abilities of extraplanar creatures equal to invested essentia.",
            {"Throat": "Extraplanar creatures that strike you in melee must make a Will save (adding their HD; your meldshaper level adds to DC) or be banished to their home plane (24h immunity on save)."},
            "Suppresses charm/compulsion/possession & +@essentia morale vs extraplanar; Throat banishes attackers.",
            [
                E("Adds +1 morale bonus per essentia on saves vs extraplanar Su/Sp abilities."),
                D("Condition Immunity", "Suppresses mental control, charm, compulsion, and possession attempts."),
                S(["save.all"], 0, "Morale", "+@essentia morale on saves vs extraplanar Su/Sp abilities.", mode="stat", stat="essentia", mult=1, condition="vs extraplanar Su/Sp"),
                W("when", [B("bound", "Throat Chakra", [F("Extraplanar melee attackers must save vs Will (+HD vs DC+ML) or return to home plane.")], trigger="struckByExtraplanar")], "Throat Chakra rebounds extraplanar attacks into banishment."),
            ],
        ),
        # 63
        M(
            "Rageclaws", 83, ["Totemist"], ["Hands", "Totem"], ["Mind-Affecting"], "None",
            "Act normally without penalty at 0 to -9 hp (ignore disabled restrictions, unconsciousness, and dying bleed; die at -10 hp).",
            "Each invested point of essentia pushes your death threshold down by 3 hit points (e.g., -13, -16; uninvesting while below new threshold kills you immediately).",
            {
                "Hands": "While below 0 hp, gain a +2 morale bonus on melee attacks, melee damage, and Fortitude saves without rage restrictions.",
                "Totem": "Gain two 1d6 claw attacks (+@essentia enhancement on attack and damage) usable together in a grapple with no -4 penalty.",
            },
            "Fight below 0 hp down to -(10 + 3*essentia); Hands buffs below 0 hp; Totem grants 1d6 grappling claws.",
            [
                E("Lowers lethal HP threshold by -3 per essentia and powers Totem claw enhancement."),
                D("State Flag", "Fight unhindered down to -(10 + 3*@essentia) hit points."),
                W("while", [B("bound", "Hands Chakra", [S(["attack.melee", "damage.melee", "save.fort"], 2, "Morale", "+2 morale on melee attacks/damage and Fort saves while < 0 hp.", condition="hp < 0")])], "Hands Chakra fuels desperation fury below 0 hp."),
                W("while", [B("bound", "Totem Chakra", [A("natural", "Rageclaws", "1d6", "S", "Two 1d6 claws (+@essentia atk/dmg; no -4 grapple penalty).", count=2, rider="+@essentia Enh, full grapple")])], "Totem Chakra grants 1d6 grappling claws."),
            ],
        ),
        # 64
        M(
            "Riding Bracers", 84, ["Incarnate", "Soulborn", "Totemist"], ["Arms", "Totem"], [], "None",
            "Grants a +4 insight bonus on Handle Animal and Ride checks.",
            "Each invested point of essentia increases Handle Animal and Ride bonuses by +2.",
            {
                "Arms": "While mounted, gain a +2 insight bonus on melee damage rolls and a +2 dodge bonus to Armor Class.",
                "Totem": "Handle/push animal or Int 1-2 magical beast mounts as free/move actions without Handle Animal ranks; your mount gains evasion.",
            },
            "+4 (+2/essentia) Handle Animal & Ride; Arms adds +2 dmg/+2 AC mounted; Totem grants mount evasion & swift commands.",
            [
                E("Increases Handle Animal and Ride insight bonuses by +2 per essentia."),
                S(["skill.han", "skill.rid"], 4, "Insight", "+4 + 2*@essentia insight on Handle Animal and Ride.", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Arms Chakra", [S(["damage.melee"], 2, "Insight", "+2 insight melee damage while mounted.", condition="mounted"), S(["ac.dodge"], 2, "Dodge", "+2 dodge AC while mounted.", condition="mounted")])], "Arms Chakra grants mounted combat bonuses."),
                W("while", [B("bound", "Totem Chakra", [F("Free-action handle / move-action push mount; mount gains evasion.")])], "Totem Chakra grants mount evasion."),
            ],
        ),
        # 65
        M(
            "Sailor's Bracers", 84, ["Incarnate", "Soulborn"], ["Arms"], [], "None",
            "Grants a +4 insight bonus on Swim, Profession (sailor), and Use Rope checks, and allows Profession (sailor) untrained.",
            "Each invested point of essentia increases the insight bonus on those three skills by +2.",
            {"Arms": "Swim at full speed (full-round) or half speed (move) and suffer no underwater attack penalties (as freedom of movement)."},
            "+4 (+2/essentia) Swim, Prof (sailor), Use Rope; Arms grants swim speed & unimpeded underwater attacks.",
            [
                E("Increases Swim, Profession (sailor), and Use Rope bonuses by +2 per essentia."),
                S(["skill.swm", "skill.pro", "skill.urp"], 4, "Insight", "+4 + 2*@essentia insight on Swim, Profession (sailor), Use Rope.", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Arms Chakra", [D("Sense / Movement", "Swim full/half speed; ignore underwater melee penalties.")])], "Arms Chakra eliminates underwater combat penalties."),
            ],
        ),
        # 66
        M(
            "Shadow Mantle", 85, ["Totemist"], ["Shoulders", "Totem"], ["Darkness"], "None",
            "Grants a +4 competence bonus on Listen checks.",
            "Each invested point of essentia increases the Listen competence bonus by +2.",
            {
                "Shoulders": "Swift action toggles a globe of magical darkness and matching blindsight in a 5-ft/essentia radius (suppressed by silence).",
                "Totem": "Grants a competence bonus on Hide checks equal to the Listen bonus (+4 + 2/essentia).",
            },
            "+4 (+2/essentia) Listen; Totem adds equal Hide bonus; Shoulders toggles 5 ft/essentia darkness + blindsight.",
            [
                E("Scales Listen (+2/pt), Totem Hide (+2/pt), and Shoulders darkness/blindsight radius (5 ft/pt)."),
                S(["skill.lis"], 4, "Competence", "+4 + 2*@essentia competence bonus on Listen.", mode="stat", stat="essentia", mult=2),
                W("when", [B("bound", "Shoulders Chakra", [D("Sense / Movement", "Swift action toggles magical darkness + blindsight (radius 5*@essentia ft).")], action="swift")], "Shoulders Chakra toggles tactical darkness + blindsight."),
                W("while", [B("bound", "Totem Chakra", [S(["skill.hid"], 4, "Competence", "+4 + 2*@essentia competence bonus on Hide.", mode="stat", stat="essentia", mult=2)])], "Totem Chakra boosts Hide equally."),
            ],
        ),
        # 67
        M(
            "Shedu Crown", 85, ["Totemist"], ["Crown", "Heart", "Totem"], ["Good", "Mind-Affecting"], "See text (Reflex half on Totem trample)",
            "Grants immunity to being pushed back by bull rushes (including telekinesis and forceful hand).",
            "Grants a competence bonus on saving throws against mind-affecting effects equal to invested essentia.",
            {
                "Crown": "Telepathy out to 100 feet with any creature that has a language.",
                "Heart": "Standard action shifts to the Ethereal Plane (free action to return) for up to meldshaper level rounds/day (minimum 1 round/use).",
                "Totem": "Grants a trample attack (full-round move up to 2x speed, 1d8 + 1.5x Str bludgeoning for Medium; Reflex half forfeits AoO at -4).",
            },
            "Bull rush immunity & +@essentia mind-affecting saves; Crown grants 100-ft telepathy; Heart grants ethereal jaunt; Totem tramples.",
            [
                E("Adds +1 competence bonus per essentia on saves vs mind-affecting effects."),
                D("Condition Immunity", "Immune to bull rush forced movement."),
                S(["save.mindAffecting"], 0, "Competence", "+@essentia competence on saves vs mind-affecting effects.", mode="stat", stat="essentia", mult=1),
                W("while", [B("bound", "Crown Chakra", [D("Sense / Movement", "Telepathy 100 ft with creatures possessing a language.")])], "Crown Chakra grants 100-ft telepathy."),
                W("when", [B("bound", "Heart Chakra", [D("Sense / Movement", "Ethereal jaunt up to meldshaper level rounds/day.")], action="standard")], "Heart Chakra shifts onto the Ethereal Plane."),
                W("when", [B("bound", "Totem Chakra", [R("Damage", 1, 8, "Bludgeoning", "Full-round trample up to 2x speed: 1d8 + 1.5x Str (Reflex half).", save="Reflex half")], action="full")], "Totem Chakra grants trample."),
            ],
        ),
        # 68
        M(
            "Sighting Gloves", 86, ["Incarnate", "Soulborn"], ["Hands"], [], "None",
            "Grants a +1 insight bonus on damage rolls with ranged weapons.",
            "Each invested point of essentia increases the ranged damage insight bonus by +1.",
            {"Hands": "Fire or throw into melee without taking the standard -4 penalty (as Precise Shot)."},
            "+1 (+1/essentia) insight ranged weapon damage; Hands bind grants Precise Shot.",
            [
                E("Increases ranged weapon damage insight bonus by +1 per essentia."),
                S(["damage.ranged"], 1, "Insight", "+1 + @essentia insight bonus on ranged weapon damage.", mode="stat", stat="essentia", mult=1),
                W("while", [B("bound", "Hands Chakra", [F("Grants Precise Shot benefit.", effect_kind="grantFeat")])], "Hands Chakra negates -4 firing-into-melee penalty."),
            ],
        ),
        # 69
        M(
            "Silvertongue Mask", 86, ["Incarnate", "Soulborn"], ["Brow", "Throat"], [], "See text (Will negates suggestion on Throat)",
            "Grants a +2 insight bonus on Bluff and Diplomacy checks.",
            "Each invested point of essentia increases Bluff and Diplomacy bonuses by +2.",
            {
                "Brow": "Grants an insight bonus on Sense Motive equal to the mask's Bluff/Diplomacy bonus (+2 + 2/essentia).",
                "Throat": "As a standard action, issue a suggestion (Will negates; 24h cooldown per target regardless of outcome).",
            },
            "+2 (+2/essentia) Bluff & Diplomacy; Brow boosts Sense Motive equally; Throat uses suggestion.",
            [
                E("Increases Bluff, Diplomacy (and Brow Sense Motive) by +2 per essentia."),
                S(["skill.blf", "skill.dip"], 2, "Insight", "+2 + 2*@essentia insight on Bluff and Diplomacy.", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Brow Chakra", [S(["skill.sm"], 2, "Insight", "+2 + 2*@essentia insight on Sense Motive.", mode="stat", stat="essentia", mult=2)])], "Brow Chakra boosts Sense Motive equally."),
                W("when", [B("bound", "Throat Chakra", [F("Standard action suggestion (Will negates, 24h cooldown per target).")], action="standard")], "Throat Chakra implants a suggestion."),
            ],
        ),
        # 70
        M(
            "Soulspark Familiar", 86, ["Incarnate", "Soulborn"], ["Brow", "Crown", "Throat"], ["Alignment"], "None",
            "Shapes a least soulspark companion that grants you the Alertness feat and attacks on command as a free action (must stay within 10 ft at turn end or unshapes).",
            "Choose one mode for all invested essentia: Align Attack (first point aligns, extras +1 dmg vs opposite), Attack/Damage (+1/pt), Deflection AC (+1/pt), Fast Healing (tier x @essentia), or Saves (+1/pt).",
            {
                "Crown": "Upgrades the familiar to a lesser soulspark.",
                "Brow": "Upgrades the familiar to a standard soulspark.",
                "Throat": "Upgrades the familiar to a greater soulspark.",
            },
            "Summons scaling soulspark companion + Alertness; Crown/Brow/Throat upgrade familiar tier.",
            [
                E("Buffs soulspark via chosen focus (Align, Attack/Dmg, Deflection AC, Fast Healing, or Saves)."),
                F("Grants Alertness feat and least soulspark ally within 10 ft.", effect_kind="grantFeat"),
                W("while", [B("bound", "Crown Chakra", [F("Summons lesser soulspark tier.")])], "Crown Chakra upgrades to lesser soulspark."),
                W("while", [B("bound", "Brow Chakra", [F("Summons standard soulspark tier.")])], "Brow Chakra upgrades to standard soulspark."),
                W("while", [B("bound", "Throat Chakra", [F("Summons greater soulspark tier.")])], "Throat Chakra upgrades to greater soulspark."),
            ],
        ),
        # 71
        M(
            "Soulspeaker Circlet", 87, ["Soulborn"], ["Crown", "Throat"], [], "None",
            "Understand one chosen spoken language (does not grant speaking, reading, or writing).",
            "Each invested point of essentia adds one additional spoken language you understand.",
            {
                "Crown": "Allows speaking any languages understood via the soulmeld.",
                "Throat": "Communicate telepathically with any creature within 20 feet per invested essentia that possesses a language.",
            },
            "Understand 1 (+1/essentia) spoken languages; Crown speaks them; Throat grants 20 ft/essentia telepathy.",
            [
                E("Adds 1 spoken language per essentia and scales Throat telepathy range (20 ft/pt)."),
                F("Understand 1 + @essentia chosen spoken languages."),
                W("while", [B("bound", "Crown Chakra", [F("Speak all languages understood through this soulmeld.")])], "Crown Chakra enables speaking translated languages."),
                W("while", [B("bound", "Throat Chakra", [D("Sense / Movement", "Telepathy within 20*@essentia ft to creatures with a language.")])], "Throat Chakra grants scaling telepathy."),
            ],
        ),
        # 72
        M(
            "Spellward Shirt", 88, ["Incarnate", "Soulborn"], ["Heart"], [], "None",
            "Grants spell resistance 5.",
            "Each invested point of essentia increases spell resistance by +4.",
            {"Heart": "Designate four spells of 6th level or lower when shaping; gain complete immunity to them (as spell immunity)."},
            "SR 5 (+4/essentia); Heart bind grants spell immunity to 4 chosen spells of <= 6th level.",
            [
                E("Increases spell resistance by +4 per invested point of essentia."),
                D("Spell Resistance", "SR 5 + 4*@essentia.", value="5+4*@essentia"),
                W("while", [B("bound", "Heart Chakra", [D("Immunity", "Immunity to 4 chosen spells of 6th level or lower (as spell immunity).")])], "Heart Chakra grants 4-spell immunity."),
            ],
        ),
        # 73
        M(
            "Sphinx Claws", 88, ["Totemist"], ["Hands", "Totem"], [], "None",
            "Grants a +1 competence bonus on Strength checks and Strength-based skill checks.",
            "Each invested point of essentia increases the Strength/skill competence bonus by +1.",
            {
                "Hands": "Gain pounce with natural weapons: make a full attack with all natural weapons at the end of a charge (cannot combine with manufactured weapon attacks on that charge).",
                "Totem": "Gain two 1d8 claw attacks (Str bonus to damage) with +1 enhancement/essentia on attack and damage rolls.",
            },
            "+1 (+1/essentia) Strength & Str-skills; Hands grants natural-weapon pounce; Totem grants enhanced 1d8 claws.",
            [
                E("Scales Strength checks/skills (+1/pt) and Totem claw attack/damage enhancement (+1/pt)."),
                S(["check.str", "skill.clm", "skill.jmp", "skill.swm"], 1, "Competence", "+1 + @essentia competence on Strength checks and Str-based skills.", mode="stat", stat="essentia", mult=1),
                W("while", [B("bound", "Hands Chakra", [F("Pounce on charge using natural weapons only.")])], "Hands Chakra enables full natural attacks on a charge."),
                W("while", [B("bound", "Totem Chakra", [A("natural", "Sphinx Claws", "1d8", "S", "Two 1d8 claws with +@essentia attack/damage enhancement.", count=2, rider="+@essentia Enh")])], "Totem Chakra grants heavy sphinx claws."),
            ],
        ),
        # 74
        M(
            "Strongheart Vest", 89, ["Incarnate", "Soulborn"], ["Heart", "Waist"], [], "None",
            "Reduces any ability damage suffered by 1 point (minimum 0).",
            "Each invested point of essentia reduces incoming ability damage by an additional 1 point.",
            {
                "Heart": "Grants immunity to energy drain and death effects.",
                "Waist": "Also reduces ability drain by 1 + invested essentia points per occurrence.",
            },
            "Reduces ability damage by 1 (+1/essentia); Waist also reduces ability drain; Heart grants death/energy drain immunity.",
            [
                E("Increases ability damage (and Waist ability drain) reduction by 1 per essentia."),
                D("DR", "Reduce incoming ability damage by 1 + @essentia per instance.", value="1+@essentia"),
                W("while", [B("bound", "Heart Chakra", [D("Condition Immunity", "Immunity to energy drain and death effects.")])], "Heart Chakra blocks energy drain and death effects."),
                W("while", [B("bound", "Waist Chakra", [D("DR", "Also reduce ability drain by 1 + @essentia per instance.", value="1+@essentia")])], "Waist Chakra shields against ability drain."),
            ],
        ),
        # 75
        M(
            "Theft Gloves", 89, ["Incarnate"], ["Hands"], [], "None",
            "Grants a +2 insight bonus on Disable Device, Open Lock, and Sleight of Hand checks, and enables untrained checks in all three skills.",
            "Each invested point of essentia increases the insight bonus on those three skills by +2.",
            {"Hands": "Grants the trapfinding class feature (locate/disarm magic and DC > 20 traps)."},
            "+2 (+2/essentia) insight & untrained Disable Device, Open Lock, Sleight of Hand; Hands grants trapfinding.",
            [
                E("Increases Disable Device, Open Lock, and Sleight of Hand bonuses by +2 per essentia."),
                S(["skill.dd", "skill.ol", "skill.soh"], 2, "Insight", "+2 + 2*@essentia insight on Disable Device, Open Lock, Sleight of Hand (untrained ok).", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Hands Chakra", [F("Grants trapfinding ability.")])], "Hands Chakra enables finding and disarming complex/magical traps."),
            ],
        ),
        # 76
        M(
            "Therapeutic Mantle", 89, ["Incarnate", "Soulborn"], ["Shoulders"], [], "None",
            "Whenever a spell or effect heals you of hit point damage, it restores bonus hit points equal to the spell's level.",
            "Each invested point of essentia increases the extra healing received by +2 hit points.",
            {"Shoulders": "Grants an insight bonus to caster level equal to invested essentia when casting spells of the healing subschool."},
            "Healing effects on you restore +spell level + 2/essentia hp; Shoulders adds +@essentia CL to healing spells you cast.",
            [
                E("Adds +2 extra HP healed per essentia and boosts Shoulders healing CL (+1/pt)."),
                F("Incoming healing spells/effects restore +spell level + 2*@essentia extra HP."),
                W("while", [B("bound", "Shoulders Chakra", [S(["cl.healing"], 0, "Insight", "+@essentia insight to caster level on [Healing] spells.", mode="stat", stat="essentia", mult=1)])], "Shoulders Chakra empowers healing spells you cast."),
            ],
        ),
        # 77
        M(
            "Threefold Mask of the Chimera", 89, ["Totemist"], ["Crown", "Soul", "Totem"], [], "None",
            "Grants immunity to being flanked.",
            "Grants a +1 competence bonus on Search and Spot checks per invested point of essentia.",
            {
                "Crown": "Take a free extra move action at the end of your turn; suffer -5 (+1/essentia, min 0) to attacks and AC next round and are restricted to a single move or standard action.",
                "Soul": "As Crown, except gain a free extra standard action at turn end, and you can take no actions on your next turn.",
                "Totem": "Gain three natural head attacks (1d8 dragon bite, 1d6 lion bite, 1d6 goat gore), all applying full Str on a full attack (or one as a -5 secondary attack).",
            },
            "Cannot be flanked & +@essentia Search/Spot; Crown/Soul buy extra actions; Totem grants 3 chimerical bites/gore.",
            [
                E("Scales Search/Spot (+1/pt) and reduces Crown/Soul next-turn penalty (min 0 at 5 essentia)."),
                D("State Flag", "Immune to flanking."),
                S(["skill.src", "skill.spt"], 0, "Competence", "+@essentia competence on Search and Spot.", mode="stat", stat="essentia", mult=1),
                W("when", [B("bound", "Crown Chakra", [F("Gain extra move action at turn end; next turn restricted to 1 move/standard and -(5 - @essentia, min 0) atk/AC.")], action="free")], "Crown Chakra grants a borrowed move action."),
                W("when", [B("bound", "Soul Chakra", [F("Gain extra standard action at turn end; skip next turn's actions with -(5 - @essentia, min 0) atk/AC.")], action="free")], "Soul Chakra grants a borrowed standard action."),
                W("while", [B("bound", "Totem Chakra", [A("natural", "Chimera Heads (Dragon 1d8, Lion 1d6, Goat 1d6)", "1d8/1d6/1d6", "P/S/B", "Three full-Str natural attacks on a full attack.", count=3)])], "Totem Chakra sprouts three beast heads."),
            ],
        ),
        # 78
        M(
            "Thunderstep Boots", 90, ["Soulborn"], ["Feet"], ["Sonic"], "See text (Fortitude negates stun on Feet bind)",
            "Melee attacks hitting at the end of a charge deal an extra 1d4 sonic damage.",
            "Each invested point of essentia adds +1d4 sonic damage to charge attacks.",
            {"Feet": "Targets damaged by your thunderstep boots on a charge must succeed on a Fortitude save or be stunned for 1 round."},
            "+1d4 (+1d4/essentia) sonic damage on charge melee hits; Feet bind stuns targets on failed Fortitude save.",
            [
                E("Increases charge sonic damage by +1d4 per invested essentia."),
                R("Damage", 1, 4, "Sonic", "Melee hit on a charge deals +1d4 + @essentia d4 sonic.", scaling="perVar", var_key="essentia", condition="on charge"),
                W("when", [B("bound", "Feet Chakra", [F("Target taking sonic charge damage must save vs Fortitude or be stunned 1 round.")], trigger="chargeHit")], "Feet Chakra adds stunning shockwave to charges."),
            ],
        ),
        # 79
        M(
            "Totem Avatar", 90, ["Totemist"], ["Arms", "Feet", "Heart", "Shoulders", "Totem"], [], "None",
            "Grants real (non-temporary) bonus hit points equal to your meldshaper level (lost if unshaped or suppressed).",
            "Grants an enhancement bonus to your natural armor bonus equal to invested essentia.",
            {
                "Arms": "Grants the Improved Grapple feat.",
                "Feet": "Grants four-legged stability (+4 vs bull rush/overrun/trip) and counts as one size larger vs bull rush, grapple, overrun, or trip (effectively +8 total).",
                "Heart": "Grants damage reduction 5/magic, increased by +1 per invested essentia.",
                "Shoulders": "Increases damage of all your natural weapons by one size category.",
                "Totem": "Grants a morale bonus equal to invested essentia on damage rolls with natural weapons.",
            },
            "+ML HP & +@essentia natural armor; Arms Improved Grapple; Feet +8 stability; Heart DR; Shoulders +1 natural weapon size; Totem +@essentia natural dmg.",
            [
                E("Scales natural armor (+1/pt), Heart DR (+1/pt), and Totem natural weapon damage (+1/pt)."),
                S(["hp.max"], 0, "Untyped", "+meldshaper level bonus hit points (non-temporary)."),
                S(["ac.natural"], 0, "Enhancement", "+@essentia enhancement to natural armor.", mode="stat", stat="essentia", mult=1),
                W("while", [B("bound", "Arms Chakra", [F("Grants Improved Grapple feat.", effect_kind="grantFeat")])], "Arms Chakra grants Improved Grapple."),
                W("while", [B("bound", "Feet Chakra", [S(["cmd.stability"], 8, "Untyped", "+8 effective vs bull rush/overrun/trip (+4 vs grapple).")])], "Feet Chakra anchors against maneuvers."),
                W("while", [B("bound", "Heart Chakra", [D("DR", "DR (5 + @essentia)/magic.", value="(5+@essentia)/magic")])], "Heart Chakra grants scaling magic DR."),
                W("while", [B("bound", "Shoulders Chakra", [F("All natural weapons deal damage as one size larger.")])], "Shoulders Chakra enlarges natural weapon dice."),
                W("while", [B("bound", "Totem Chakra", [S(["damage.natural"], 0, "Morale", "+@essentia morale bonus on natural weapon damage rolls.", mode="stat", stat="essentia", mult=1)])], "Totem Chakra boosts natural weapon damage."),
            ],
        ),
        # 80
        M(
            "Truthseeker Goggles", 91, ["Incarnate", "Soulborn"], ["Brow"], [], "None",
            "Grants a +2 insight bonus on Gather Information, Search, and Sense Motive checks.",
            "Each invested point of essentia increases the insight bonus on those three skills by +2.",
            {"Brow": "Grants darkvision out to 60 feet."},
            "+2 (+2/essentia) insight on Gather Info, Search, Sense Motive; Brow grants 60-ft darkvision.",
            [
                E("Increases Gather Info, Search, and Sense Motive bonuses by +2 per essentia."),
                S(["skill.gi", "skill.src", "skill.sm"], 2, "Insight", "+2 + 2*@essentia insight on Gather Information, Search, Sense Motive.", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Brow Chakra", [D("Sense / Movement", "Darkvision 60 ft.")])], "Brow Chakra grants 60-ft darkvision."),
            ],
        ),
        # 81
        M(
            "Unicorn Horn", 91, ["Totemist"], ["Brow", "Totem"], [], "None",
            "Grants a +2 competence bonus on Move Silently checks and wild empathy checks.",
            "Each invested point of essentia increases Move Silently and wild empathy bonuses by +2.",
            {
                "Brow": "Use detect evil once per round as a standard action.",
                "Totem": "Gain a 1d6 gore natural attack with +@essentia enhancement on attack and damage rolls, dealing +1d6 extra damage against undead.",
            },
            "+2 (+2/essentia) Move Silently & wild empathy; Brow detects evil; Totem grants 1d6 (+1d6 vs undead) gore.",
            [
                E("Scales Move Silently/wild empathy (+2/pt) and Totem gore enhancement (+1/pt)."),
                S(["skill.ms", "wildEmpathy"], 2, "Competence", "+2 + 2*@essentia competence on Move Silently and wild empathy.", mode="stat", stat="essentia", mult=2),
                W("when", [B("bound", "Brow Chakra", [F("Detect evil 1/round as a standard action.")], action="standard")], "Brow Chakra enables at-will detect evil."),
                W("while", [B("bound", "Totem Chakra", [A("natural", "Unicorn Horn Gore", "1d6", "P", "1d6 gore (+@essentia attack/damage; +1d6 vs undead).", nat_kind="primary", rider="+@essentia Enh, +1d6 vs undead")])], "Totem Chakra grants a sacred gore attack."),
            ],
        ),
        # 82
        M(
            "Urskan Greaves", 92, ["Totemist"], ["Feet", "Totem"], [], "None",
            "Move through snow and across ice at normal speed with a +5 bonus on Balance checks on ice.",
            "Grants cold resistance equal to 5 x invested essentia.",
            {
                "Feet": "Grants powerful charge: melee hits on a charge deal +1d4 damage per invested essentia.",
                "Totem": "Overrun targets cannot choose to avoid you, and you gain +2 (+1/essentia) on the Strength check to knock them prone.",
            },
            "Snow/ice stride (+5 Balance on ice) & Resist Cold 5/essentia; Feet adds +1d4/essentia charge dmg; Totem boosts overrun.",
            [
                E("Scales cold resistance (5/pt), Feet charge bonus dice (+1d4/pt), and Totem overrun check (+1/pt)."),
                D("Energy Resistance", "Cold resistance 5*@essentia; ignore snow/ice movement penalties.", value="5*@essentia"),
                W("when", [B("bound", "Feet Chakra", [R("Damage", 1, 4, "Untyped", "Charge melee hit deals +@essentia d4 bonus damage.", scaling="perVar", var_key="essentia")], trigger="chargeHit")], "Feet Chakra boosts charge damage."),
                W("while", [B("bound", "Totem Chakra", [S(["overrun"], 2, "Untyped", "Targets cannot avoid overrun; +2 + @essentia Strength bonus to knock prone.", mode="stat", stat="essentia", mult=1)])], "Totem Chakra forces unstoppable overruns."),
            ],
        ),
        # 83
        M(
            "Vitality Belt", 92, ["Incarnate"], ["Waist"], [], "None",
            "Grants a +4 morale bonus on Constitution checks and Constitution-based skill checks (not Fortitude saves).",
            "Grants real (non-temporary) bonus hit points equal to meldshaper level per invested point of essentia.",
            {"Waist": "Grants immunity to Constitution damage and Constitution drain."},
            "+4 morale Con checks & +(ML * essentia) real HP; Waist grants immunity to Con damage & drain.",
            [
                E("Grants +(meldshaper level * @essentia) non-temporary bonus hit points."),
                S(["check.con"], 4, "Morale", "+4 morale on Con ability checks and Con-based skills (not Fort saves)."),
                S(["hp.max"], 0, "Untyped", "+(meldshaper level * @essentia) bonus HP (non-temporary).", mode="stat", stat="essentia", mult=1),
                W("while", [B("bound", "Waist Chakra", [D("Condition Immunity", "Immunity to Constitution damage and Constitution drain.")])], "Waist Chakra protects Constitution permanently."),
            ],
        ),
        # 84
        M(
            "Wind Cloak", 92, ["Incarnate", "Soulborn"], ["Shoulders"], [], "See text (Fortitude negates wind barrier vs Tiny/smaller flyers)",
            "Grants DR 2/magic against ranged weapons; Tiny and smaller flying creatures must succeed on a Fortitude save to enter your space.",
            "Each invested point of essentia increases ranged DR by +2.",
            {"Shoulders": "Deflect ranged attacks (even flat-footed, no free hand needed) as Deflect Arrows for 1 + @essentia projectiles per round."},
            "DR (2+2*essentia)/magic vs ranged & repels Tiny flyers; Shoulders deflects 1+@essentia ranged shots/round.",
            [
                E("Increases ranged DR (+2/pt) and Shoulders Deflect Arrows count (+1/pt)."),
                D("DR", "DR (2 + 2*@essentia)/magic against ranged weapons.", value="(2+2*@essentia)/magic"),
                W("while", [B("bound", "Shoulders Chakra", [F("Deflect 1 + @essentia ranged attacks per round without free hand, even when flat-footed.")])], "Shoulders Chakra deflects multiple missiles/round."),
            ],
        ),
        # 85
        M(
            "Winter Mask", 93, ["Totemist"], ["Throat", "Totem"], ["Cold"], "See text (Fortitude negates touch fatigue; Reflex half Throat cone)",
            "Melee touch attack inflicts fatigue unless target makes a Fortitude save (cold-immune/resistant targets are unaffected).",
            "The fatigue touch attack also deals 1d4 nonlethal cold damage per invested point of essentia.",
            {
                "Throat": "Once every 1d4 rounds, breathe a 15-ft cone of cold for 2d6 + 2d6/essentia cold damage (Reflex half).",
                "Totem": "Gain a 1d6 bite attack (primary or secondary) dealing +1d4 cold damage per invested essentia.",
            },
            "Fatiguing cold touch (+1d4/essentia nonlethal); Throat breathes 2d6(+2d6/essentia) cold cone; Totem grants frost bite.",
            [
                E("Scales touch nonlethal cold (+1d4/pt), Throat breath cone (+2d6/pt), and Totem bite cold (+1d4/pt)."),
                R("Damage", 1, 4, "Cold (Nonlethal)", "Melee touch inflicts fatigue (Fort negates) + @essentia d4 nonlethal cold.", scaling="perVar", var_key="essentia", save="Fortitude negates"),
                W("when", [B("bound", "Throat Chakra", [R("Damage", 2, 6, "Cold", "1/1d4 rounds 15-ft cone: 2d6 + 2*@essentia d6 cold (Reflex half).", scaling="perVar", var_key="essentia", save="Reflex half")], action="standard")], "Throat Chakra breathes a cone of cold."),
                W("while", [B("bound", "Totem Chakra", [A("natural", "Winter Wolf Bite", "1d6", "P/S/B + Cold", "1d6 bite plus @essentia d4 cold damage.", nat_kind="primary", rider="+@essentia d4 Cold")])], "Totem Chakra grants a winter wolf bite."),
            ],
        ),
        # 86
        M(
            "Worg Pelt", 93, ["Totemist"], ["Feet", "Hands", "Totem"], [], "None",
            "Grants a +2 competence bonus on Hide and Move Silently checks.",
            "Each invested point of essentia increases Hide and Move Silently bonuses by +2.",
            {
                "Feet": "Increases base land speed by +5 ft plus +5 ft per invested essentia.",
                "Hands": "Hitting with any bite attack grants a free-action trip attempt without provoking AoOs or touch attack (and foe cannot counter-trip).",
                "Totem": "Gain a 1d6 bite attack (primary or secondary) with +@essentia enhancement on attack and damage rolls.",
            },
            "+2 (+2/essentia) Hide & Move Silently; Feet +5(+5/essentia) ft speed; Hands bite-trip; Totem 1d6 enhanced bite.",
            [
                E("Scales Hide/Move Silently (+2/pt), Feet speed (+5 ft/pt), and Totem bite enhancement (+1/pt)."),
                S(["skill.hid", "skill.ms"], 2, "Competence", "+2 + 2*@essentia competence on Hide and Move Silently.", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Feet Chakra", [S(["speed.land"], 5, "Untyped", "+5 + 5*@essentia ft base land speed.", mode="stat", stat="essentia", mult=5)])], "Feet Chakra boosts running speed."),
                W("when", [B("bound", "Hands Chakra", [F("Bite hit triggers free-action trip without AoO, touch attack, or counter-trip risk.")], trigger="biteHit")], "Hands Chakra adds wolf trip on bite hits."),
                W("while", [B("bound", "Totem Chakra", [A("natural", "Worg Bite", "1d6", "P/S/B", "1d6 bite with +@essentia enhancement on attack and damage.", nat_kind="primary", rider="+@essentia Enh")])], "Totem Chakra grants worg bite."),
            ],
        ),
        # 87
        M(
            "Wormtail Belt", 94, ["Totemist"], ["Waist", "Totem"], [], "See text (Fortitude negates poison on Totem stinger)",
            "Grants a +2 enhancement bonus to existing natural armor (treats 0 as base natural armor).",
            "Each invested point of essentia increases the natural armor enhancement bonus by +1.",
            {
                "Waist": "Grants the Awesome Blow feat and counts you as one size larger when using it (soulmeld save DC applies).",
                "Totem": "Gain a 1d6 stinger tail natural attack (+@essentia attack enhancement, sole attack per round) injecting 1d4 Str initial poison (no secondary; Fortitude negates).",
            },
            "+2 (+1/essentia) natural armor enhancement; Waist Awesome Blow; Totem 1d6 Str-poison stinger.",
            [
                E("Scales natural armor (+1/pt) and Totem stinger attack enhancement & poison DC (+1/pt)."),
                S(["ac.natural"], 2, "Enhancement", "+2 + @essentia enhancement to natural armor.", mode="stat", stat="essentia", mult=1),
                W("while", [B("bound", "Waist Chakra", [F("Grants Awesome Blow (+1 effective size category, uses soulmeld DC).", effect_kind="grantFeat")])], "Waist Chakra grants Awesome Blow."),
                W("while", [B("bound", "Totem Chakra", [A("natural", "Purple Worm Stinger", "1d6", "P + Poison", "Sole-attack 1d6 stinger (+@essentia attack) + 1d4 Str poison (Fort negates).", nat_kind="primary", rider="+@essentia Atk, 1d4 Str poison")])], "Totem Chakra grants venomous tail stinger."),
            ],
        ),
        # 88
        M(
            "Yrthak Mask", 94, ["Totemist"], ["Brow", "Totem"], ["Sonic"], "None",
            "Grants a +4 competence bonus on Listen checks.",
            "Each invested point of essentia increases the Listen competence bonus by +2.",
            {
                "Brow": "Move action pinpoints creatures with line of effect within 10 ft + 10 ft/essentia (concealment rules still apply); take -4 on Spot but +4 on saves vs visual/gaze/illusion attacks.",
                "Totem": "Once every 2 rounds, fire a 60-ft ranged touch sonic ray dealing 1d6 sonic damage per invested essentia.",
            },
            "+4 (+2/essentia) Listen; Brow echolocates 10+10/essentia ft (+4 vs sight saves, -4 Spot); Totem fires 1d6/essentia sonic ray.",
            [
                E("Scales Listen (+2/pt), Brow echolocation range (+10 ft/pt), and Totem sonic ray (1d6/pt)."),
                S(["skill.lis"], 4, "Competence", "+4 + 2*@essentia competence bonus on Listen.", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Brow Chakra", [D("Sense / Movement", "Move action echolocation pinpoints within 10 + 10*@essentia ft."), S(["skill.spt"], -4, "Untyped", "-4 penalty on Spot checks."), S(["save.visual"], 4, "Untyped", "+4 on saves vs gaze/visual/illusion attacks.")])], "Brow Chakra exchanges Spot for echolocation."),
                W("when", [B("bound", "Totem Chakra", [R("Damage", 1, 6, "Sonic", "1/2 rounds 60-ft ranged touch ray: @essentia d6 sonic.", scaling="perVar", var_key="essentia")], action="standard")], "Totem Chakra fires a sonic ray."),
            ],
        ),
        # 89 (Dragon Magic)
        M(
            "Claws of the Wyrm", 83, ["Soulborn", "Totemist"], ["Arms", "Hands", "Totem"], ["Draconic"], "None",
            "Grants two claw attacks (1d6 Medium, 1d4 Small, 1d8 Large + Str; one as standard action or both as full-round at full BAB; overrides lower base claw dice).",
            "Grants a +1 enhancement bonus on attack and damage rolls with these claws per invested point of essentia.",
            {
                "Arms": "Doubles the critical threat range of these claws to 19-20 (non-stacking).",
                "Hands": "Increases the claws' base damage die by one size step (e.g., 1d6 to 1d8 for Medium).",
                "Totem": "Grants a climb speed equal to half your base land speed (rounded up to nearest 5-ft increment).",
            },
            "Two 1d6 claws (+@essentia atk/dmg); Arms 19-20 crit; Hands steps damage die up; Totem climb speed.",
            [
                E("Adds +1 enhancement on attack and damage rolls with wyrm claws per essentia."),
                A("natural", "Claws of the Wyrm", "1d6", "S", "Two 1d6 claws (full BAB, +@essentia attack and damage enhancement).", count=2, rider="+@essentia Enh"),
                W("while", [B("bound", "Arms Chakra", [F("Doubles claw threat range to 19-20 (non-stacking).")])], "Arms Chakra doubles claw crit range."),
                W("while", [B("bound", "Hands Chakra", [F("Steps wyrm claw base damage die up one size (e.g. 1d6 -> 1d8).")])], "Hands Chakra enlarges claw dice."),
                W("while", [B("bound", "Totem Chakra", [D("Sense / Movement", "Gain climb speed equal to 1/2 base land speed (rounded up to 5 ft).")])], "Totem Chakra grants draconic climb speed."),
            ],
            source="Dragon Magic",
        ),
        # 90 (Dragon Magic)
        M(
            "Dragon Mantle", 83, ["Soulborn", "Totemist"], ["Heart", "Shoulders", "Totem"], ["Draconic"], "None",
            "Grants a +2 enhancement bonus on Fortitude saves.",
            "Grants resistance to acid, cold, electricity, and fire equal to 3 x invested essentia (stacks with existing energy resistances).",
            {
                "Heart": "Grants fast healing equal to invested essentia whenever you are at or below half your maximum hit points.",
                "Shoulders": "Grants DR @essentia/magic, and natural attacks bypass DR as magic while >= 1 essentia is invested.",
                "Totem": "Move-action glide/flight up to 10 ft per invested essentia (poor maneuverability; must start and end on solid surface).",
            },
            "+2 Fort & stacking 4-element Resist 3/essentia; Heart fast heals <= 1/2 HP; Shoulders DR/magic; Totem short flight.",
            [
                E("Scales 4-element stacking resistance (3/pt), Heart fast healing, Shoulders DR, and Totem hop flight."),
                S(["save.fort"], 2, "Enhancement", "+2 enhancement bonus on Fortitude saves."),
                D("Energy Resistance", "Stacking resistance 3*@essentia to acid, cold, electricity, and fire.", value="3*@essentia"),
                W("while", [B("bound", "Heart Chakra", [R("Fast Healing", 1, 1, "Healing", "Fast healing @essentia while at <= 50% max HP.", scaling="perVar", var_key="essentia")])], "Heart Chakra grants bloodied fast healing."),
                W("while", [B("bound", "Shoulders Chakra", [D("DR", "DR @essentia/magic; natural weapons count as magic (>=1 essentia).", value="@essentia/magic")])], "Shoulders Chakra grants magic DR."),
                W("while", [B("bound", "Totem Chakra", [D("Sense / Movement", "Move action fly 10*@essentia ft (poor; solid-to-solid).")])], "Totem Chakra grants wing hops."),
            ],
            source="Dragon Magic",
        ),
        # 91 (Dragon Magic)
        M(
            "Dragon Tail", 84, ["Incarnate", "Totemist"], ["Feet", "Waist", "Totem"], ["Draconic"], "See text (Reflex half on Totem sweep)",
            "Grants a tail attack usable once per round as a standard action for 1d8 + Str bludgeoning (no reach/AoOs/grapple use).",
            "Grants a +1 enhancement bonus on tail attack and damage rolls per invested point of essentia.",
            {
                "Feet": "Grants a +2 (+2/essentia) competence bonus on Balance and Swim checks.",
                "Waist": "Tail gains reach appropriate to your size (still no AoOs) and increases damage to 2d6 + 1.5x Str.",
                "Totem": "As a standard action, tail sweep automatically strikes all adjacent creatures for tail damage (Reflex half).",
            },
            "1d8+Str tail strike (+@essentia enh); Feet +Balance/Swim; Waist reach & 2d6+1.5x Str; Totem adjacent AoE sweep.",
            [
                E("Adds +1 tail enhancement (+1/pt) and Feet Balance/Swim bonus (+2/pt)."),
                A("natural", "Dragon Tail", "1d8", "B", "Standard-action 1d8+Str tail slap (+@essentia attack/damage enhancement).", nat_kind="primary", rider="+@essentia Enh"),
                W("while", [B("bound", "Feet Chakra", [S(["skill.bal", "skill.swm"], 2, "Competence", "+2 + 2*@essentia competence on Balance and Swim.", mode="stat", stat="essentia", mult=2)])], "Feet Chakra stabilizes Balance and Swim."),
                W("while", [B("bound", "Waist Chakra", [F("Tail gains reach (no AoOs) and damage upgrades to 2d6 + 1.5x Str.")])], "Waist Chakra upgrades tail reach and damage."),
                W("when", [B("bound", "Totem Chakra", [F("Standard action tail sweep hits all adjacent creatures for tail damage (Reflex half).")], action="standard")], "Totem Chakra sweeps adjacent squares."),
            ],
            source="Dragon Magic",
        ),
        # 92 (Dragon Magic)
        M(
            "Dragonfire Mask", 84, ["Totemist"], ["Brow", "Throat", "Totem"], ["Draconic", "Fire"], "See text (Reflex half Throat breath; Will negates Totem fear)",
            "Grants low-light vision (non-stacking).",
            "Grants a +2 competence bonus on Spot checks per invested point of essentia.",
            {
                "Brow": "Grants 60-ft darkvision (or extends existing darkvision by +30 ft).",
                "Throat": "Standard action breathes a 30-ft cone dealing 2d6 + 1d6/essentia fire damage (Reflex half; 1d4-round recharge).",
                "Totem": "Once per round as a swift action, emit frightful presence within 10 ft + 10 ft/essentia: foes with fewer HD are shaken for 1 + @essentia rounds (Will negates, 24h immunity).",
            },
            "Low-light & +2/essentia Spot; Brow darkvision; Throat fire breath cone; Totem swift frightful presence.",
            [
                E("Scales Spot (+2/pt), Throat fire cone (+1d6/pt), and Totem frightful presence radius/duration."),
                D("Sense / Movement", "Low-light vision."),
                S(["skill.spt"], 0, "Competence", "+2 * @essentia competence bonus on Spot.", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Brow Chakra", [D("Sense / Movement", "Darkvision 60 ft (or +30 ft to existing darkvision).")])], "Brow Chakra grants or extends darkvision."),
                W("when", [B("bound", "Throat Chakra", [R("Damage", 2, 6, "Fire", "30-ft cone (1d4 rd recharge): 2d6 + @essentia d6 fire (Reflex half).", scaling="perVar", var_key="essentia", save="Reflex half")], action="standard")], "Throat Chakra unleashes fiery breath."),
                W("when", [B("bound", "Totem Chakra", [F("1/round swift frightful presence (10 + 10*@essentia ft): lower-HD foes shaken 1 + @essentia rounds (Will negates).")], action="swift")], "Totem Chakra projects frightful presence."),
            ],
            source="Dragon Magic",
        ),
        # 93 (Dragon Magic)
        M(
            "Elder Spirit", 84, ["Incarnate"], ["Crown", "Soul"], ["Draconic"], "None",
            "Grants a +4 insight bonus on Knowledge (arcana), Knowledge (history), and Use Magic Device checks, and allows untrained checks in all three skills.",
            "Each invested point of essentia increases the insight bonus on those skills by +2.",
            {
                "Crown": "Grants dragon-like immunity to frightful presence, sleep, and paralysis, plus a +4 (+2/essentia) insight bonus on Intimidate.",
                "Soul": "Grants blindsense out to 5 feet per invested point of essentia.",
            },
            "+4 (+2/essentia) K.(arcana/history) & UMD; Crown immune sleep/paralysis/frightful presence & +Intimidate; Soul blindsense.",
            [
                E("Scales Knowledge/UMD (+2/pt), Crown Intimidate (+2/pt), and Soul blindsense (5 ft/pt)."),
                S(["skill.kar", "skill.khi", "skill.umd"], 4, "Insight", "+4 + 2*@essentia insight on K.(arcana), K.(history), UMD (untrained ok).", mode="stat", stat="essentia", mult=2),
                W("while", [B("bound", "Crown Chakra", [D("Condition Immunity", "Immunity to frightful presence, sleep, and paralysis."), S(["skill.int"], 4, "Insight", "+4 + 2*@essentia insight bonus on Intimidate.", mode="stat", stat="essentia", mult=2)])], "Crown Chakra grants dragon immunities and Intimidate."),
                W("while", [B("bound", "Soul Chakra", [D("Sense / Movement", "Blindsense 5*@essentia ft.")])], "Soul Chakra grants blindsense."),
            ],
            source="Dragon Magic",
        ),
    ]
    return items


# ---------------------------------------------------------------------------
# 2. PSIONIC POWERS SUPPLEMENT (124 Complete Psionic + 3 Magic of Incarnum)
# ---------------------------------------------------------------------------

def pwr_desc(discipline: str, subschool: str, descriptors: list[str], level_str: str, pp: int, time: str, rng: str, tgt_or_area: str, dur: str, save: str, pr_str: str, summary: str, augment: str) -> str:
    header = f"<p><strong>Discipline:</strong> {discipline}"
    if subschool:
        header += f" ({subschool})"
    if descriptors:
        header += f" [{', '.join(descriptors)}]"
    header += f" | <strong>Level:</strong> {level_str} | <strong>Power Points:</strong> {pp}</p>"
    meta = (
        f"<p><strong>Manifesting Time:</strong> {time} | <strong>Range:</strong> {rng} | "
        f"<strong>Target/Area:</strong> {tgt_or_area} | <strong>Duration:</strong> {dur} | "
        f"<strong>Saving Throw:</strong> {save} | <strong>Power Resistance:</strong> {pr_str}</p>"
    )
    body = f"<p>{summary}</p>"
    aug = f"<p><strong>Augment:</strong> {augment}</p>" if augment else ""
    return "\n".join(x for x in (header, meta, body, aug) if x)


def make_power(
    name: str,
    page: int,
    discipline: str,
    learned_class: dict[str, int],
    learned_mantle: dict[str, int],
    pp: int,
    casting_time: str,
    rng: str,
    tgt_area: str,
    dur: str,
    save: str,
    sr_str: str,
    short_desc: str,
    body_summary: str,
    effects: list[dict],
    *,
    subschool: str = "",
    descriptors: list[str] | None = None,
    augment: str = "",
    is_area: bool = False,
    action_type: str = "other",
    display: str = "",
    source: str = "Complete Psionic",
) -> dict:
    descs = descriptors or []
    all_lvls = list(learned_class.values()) + list(learned_mantle.values())
    min_lvl = min(all_lvls) if all_lvls else max(1, (pp + 1) // 2)
    cls_str = ", ".join(
        [f"{k} {v}" for k, v in learned_class.items()] + [f"{k} {v}" for k, v in learned_mantle.items()]
    )
    sr_bool = sr_str.lower().startswith("yes") or "yes;" in sr_str.lower()
    tags = ["power", discipline.lower()] + [d.lower() for d in descs]
    if source == "Complete Psionic":
        tags.append("cpsi")
    else:
        tags.append("incarnum")
    return {
        "id": f"pwr-{slugify(name)}",
        "schemaVersion": 3,
        "blueprint": "spell",
        "name": name,
        "type": "Power",
        "category": discipline,
        "subschool": subschool,
        "descriptors": ", ".join(descs),
        "level": min_lvl,
        "learnedAt": {
            "class": learned_class,
            "mantle": learned_mantle,
            "domain": {},
        },
        "slot": "None",
        "source": source,
        "page": page,
        "edition": "3.5",
        "verification": "book-verified",
        "actionType": action_type,
        "castingTime": casting_time,
        "display": display,
        "components": [],
        "materials": "",
        "range": rng,
        "area": tgt_area if is_area else "",
        "target": "" if is_area else tgt_area,
        "duration": dur,
        "save": save,
        "sr": sr_bool,
        "powerPointsCost": pp,
        "augment": augment,
        "shortDescription": short_desc,
        "description": pwr_desc(discipline, subschool, descs, cls_str, pp, casting_time, rng, tgt_area, dur, save, sr_str, body_summary, augment),
        "tags": tags,
        "spell": {
            "system": "psionic",
            "discipline": discipline,
            "level": min_lvl,
            "ppCost": pp,
            "augmentable": bool(augment),
            "descriptors": descs,
        },
        "effects": effects,
        "modifiers": [],
        "damageParts": [],
        "modes": [],
        "ruleFlags": {},
    }


def pw(cls_dict: dict[str, int]) -> dict[str, int]:
    """Expand shorthand psion/wilder keys to canonical V2 learnedAt class map."""
    out: dict[str, int] = {}
    for k, v in cls_dict.items():
        if k == "Psion/Wilder":
            out["Psion"] = v
            out["Wilder"] = v
        else:
            out[k] = v
    return out


def build_powers() -> list[dict]:
    P = make_power
    PP = b_pp
    S = b_stat
    R = b_roll
    A = b_atk
    D = b_def
    F = b_eff
    W = b_when
    B = branch

    return [
        # 0
        P("Adrenaline Boost", 78, "Psychometabolism", pw({"Lurk": 1, "Psychic Warrior": 1}), {"Physical Power": 1}, 1,
          "1 swift action", "Personal", "You", "1 round", "None", "No",
          "Swiftly gain +2 insight to Strength and Dexterity (+1 per 3 extra PP).",
          "Grants a +2 insight bonus to Strength and Dexterity until the start of your next turn.",
          [PP(1), S(["ability.str", "ability.dex"], 2, "Insight", "+2 insight to Str and Dex for 1 round (+1 per 3 extra PP).")],
          augment="Spend 3 extra PP per additional +1 insight bonus to Strength and Dexterity.", display="Olfactory"),
        # 1
        P("Affinity Field, Pain", 78, "Psychometabolism", pw({"Psion/Wilder": 9}), {"Pain and Suffering": 9}, 17,
          "1 standard action", "20 ft.", "20-ft.-radius emanation centered on you", "1 round/level (D)", "Fortitude negates", "Yes",
          "20-ft emanation shares damage, ability damage, and penalties you suffer with excluded allies exempt; healing/bonuses excluded.",
          "Functions as affinity field, except you may exclude chosen creatures and only harmful effects (HP/ability damage and penalty effects, never healing or bonuses) transfer to trapped creatures.",
          [PP(17), F("20-ft aura links enemies (Fort negates) to absorb copies of all damage, ability damage, and penalties you suffer; excludes healing/bonuses.")],
          is_area=True, display="Material and visual"),
        # 2
        P("Analyze Dweomer, Psionic", 78, "Clairsentience", {}, {"Magic": 6}, 11,
          "1 standard action", "Close (25 ft. + 5 ft./2 levels)", "One object or creature", "1 round", "None or Will negates; see text", "No",
          "Identifies magical and psionic properties on one creature or object (as analyze dweomer).",
          "Reveals active spells, powers, magic/psionic item functions, and aura strengths on the target for 1 round, functioning like analyze dweomer.",
          [PP(11), F("Analyze magical/psionic auras and item properties as analyze dweomer (1 round).")],
          display="Visual"),
        # 3
        P("Animate Plants, Psionic", 78, "Psychokinesis", {}, {"Natural World": 7}, 13,
          "1 standard action", "Close (25 ft. + 5 ft./2 levels)", "One Large plant/3 levels or all plants within range", "1 round/level or 1 hour/level", "None", "No",
          "Animates plants to fight or entangle foes (as animate plants).",
          "Psychokinetically animates one Large plant per 3 manifester levels to combat foes, or animates vegetation in range to entangle creatures, as animate plants.",
          [PP(13), F("Animates plants for combat or area entanglement as animate plants.")],
          display="Auditory"),
        # 4
        P("Anticipatory Strike", 78, "Psychoportation", pw({"Psion/Wilder": 5}), {"Time": 5}, 9,
          "1 immediate action", "Personal", "You", "Instantaneous", "None", "No",
          "Immediately take your next turn's full set of actions out of initiative order (cannot use flat-footed or before next turn passes).",
          "Pulls your upcoming turn's normal actions (standard + move, or full-round) forward to execute right now without altering permanent initiative order; consumes your next turn's actions and cannot be reused until after that skipped turn.",
          [PP(9), F("Immediate action: take your next turn's standard+move or full-round action immediately (forfeits next normal turn).")],
          display="Auditory"),
        # 5
        P("Blackstone Hammer", 79, "Psychometabolism", pw({"Psychic Warrior": 6}), {"Elements": 6}, 11,
          "1 standard action", "Touch", "Melee weapon touched", "1 round/level or until discharged", "None (object, harmless) or Fortitude negates", "No (object, harmless) or Yes",
          "Touched weapon deals bludgeoning damage and petrifies struck flesh creatures on failed Fortitude save (1 charge, +1/4 PP).",
          "Converts a touched melee weapon to bludgeoning damage; the next hit against a creature of flesh discharges the power, turning target and gear to inert stone (Fortitude negates).",
          [PP(11), A("weaponImbue", "Blackstone Hammer", "", "B", "Touched weapon deals bludgeoning damage and petrifies struck flesh creature (Fort negates, 1 charge).", rider="Petrify (Fort negates)")],
          augment="Spend 4 extra PP per additional petrification charge stored in the weapon."),
        # 6
        P("Breathless", 79, "Psychometabolism", {}, {"Elements": 3}, 5,
          "1 standard action", "Personal; see text", "You; see text", "10 min./level", "None", "Yes (harmless)",
          "Suspends breathing completely, granting underwater survival and immunity to inhaled toxins (+1 target per 2 PP).",
          "Alters physiology so you require no air, survive underwater or in vacuum, and ignore inhaled hazards for 10 minutes per level.",
          [PP(5), D("Condition Immunity", "Do not need to breathe; immune to inhaled gases/poisons and suffocation.")],
          augment="Spend 2 extra PP per additional touched creature affected."),
        # 7
        P("Burrowing Bonds", 79, "Metacreativity", pw({"Shaper": 4}), {}, 7,
          "1 standard action", "Medium (100 ft. + 10 ft./level)", "One Medium or smaller creature", "1 round/level (D)", "Reflex negates", "No",
          "Crystalline coils bind target for 3d6 piercing then 1d6/round ongoing (forces Concentration DC 20 + half ongoing dmg to manifest).",
          "Binds a creature in burrowing crystal (AC 5, hardness 12, 30 hp; DC 20 Str or DC 25 Escape Artist full-round to break) dealing 3d6 piercing on impact and 1d6 piercing per round while disrupting manifestation.",
          [PP(7), R("Damage", 3, 6, "Piercing", "Initial 3d6 piercing on failed Reflex save, then 1d6/round ongoing.", save="Reflex negates")],
          subschool="Creation", augment="Every 2 extra PP: +1 save/escape DC; OR +1 target size category; OR +1d6 continuous damage."),
        # 8
        P("Call Armor", 80, "Psychoportation", pw({"Psychic Warrior": 1}), {"Justice": 2}, 1,
          "1 round", "0 ft.", "One suit of armor or shield", "1 min./level (D)", "None", "No",
          "Summons a random mundane suit of armor or shield directly onto your body (+1 enh per 4 PP; mithral +4 PP, adamantine +8 PP).",
          "Teleports a specified type of nonmagical armor (donned) or shield (in hand) onto you; disappears back to origin if unequipped for 2 consecutive rounds. Justice mantle pays 3 PP (level 2); Psychic Warrior pays 1 PP (level 1).",
          [PP(1), F("Summon and don specified mundane armor or shield (dismissed if unworn 2 rounds; Justice mantle base cost 3 PP).")],
          subschool="Teleportation", augment="Every 4 extra PP adds +1 enhancement bonus to AC; spend 4 PP for mithral or 8 PP for adamantine."),
        # 9
        P("Celestial Conduit", 80, "Psychokinesis", pw({"Psion/Wilder": 5}), {"Good": 5}, 9,
          "1 standard action", "120 ft.", "120-ft. line", "Instantaneous", "Reflex half", "Yes",
          "120-ft positive-energy line deals 9d6 damage (9d6+18 vs undead; 5d6 vs constructs/objects; +1d6 and +1 DC per PP).",
          "Channels Positive Energy Plane radiance along a 120-ft line for 9d6 positive energy damage (+2/die vs undead; constructs and objects take 5d6), Reflex save for half.",
          [PP(9), R("Damage", 9, 6, "Positive Energy", "120-ft line: 9d6 (+2/die vs undead, 5d6 vs constructs/objects), Reflex half.", save="Reflex half")],
          subschool="", descriptors=["Good"], is_area=True, augment="Each extra PP adds +1d6 damage (+1d6+2 vs undead) and +1 save DC."),
        # 10
        P("Cerebral Phantasm", 80, "Telepathy", pw({"Psion/Wilder": 3}), {}, 5,
          "1 standard action", "Medium (100 ft. + 10 ft./level)", "One creature", "Instantaneous", "Will negates", "Yes",
          "Psychic nightmare inflicts 3d6 nonlethal damage and dazes target for 1d4 rounds (Will negates).",
          "Projects an inner terror into one target's mind; on a failed Will save, target suffers 3d6 nonlethal damage and is dazed for 1d4 rounds.",
          [PP(5), R("Damage", 3, 6, "Nonlethal", "3d6 nonlethal + dazed 1d4 rounds (Will negates).", save="Will negates")],
          descriptors=["Fear", "Mind-Affecting"], augment="Every 2 extra PP increases save DC by +1."),
        # 11
        P("Chaos Fissure", 80, "Telepathy", {}, {"Chaos": 8}, 15,
          "1 standard action", "Close (25 ft. + 5 ft./2 levels)", "20-ft.-radius emanation", "1 round/level (D)", "Will negates or none (object)", "Yes or no (object)",
          "20-ft zone forces all manifested powers to wild surge (with enervation risk) and subjects spells/SLAs to wild magic.",
          "Emanates a chaotic field forcing every psionic manifestation inside to trigger wild surge with psychic enervation possibility and imposing the wild magic planar trait on spells/SLAs.",
          [PP(15), F("20-ft emanation imposes wild surge + enervation on powers and wild magic planar trait on spells/SLAs.")],
          subschool="Compulsion", descriptors=["Mind-Affecting"], is_area=True),
        # 12
        P("Claws of Darkness", 81, "Psychometabolism", {}, {"Light and Darkness": 2}, 3,
          "1 standard action", "Personal", "You", "1 round/level (D)", "None", "No",
          "Gain two 1d4 cold claws (1d6 Large/1d3 Small) with +5 ft swift reach and grapple-slow rider (Fort DC 12+key mod).",
          "Forms two primary natural claw attacks dealing cold damage + Str; swift action extends reach +5 ft; grapple hits inflict slow unless target saves (Fort DC 12 + key ability mod).",
          [PP(3), A("natural", "Shadow Claws", "1d4", "Cold", "Two primary claws dealing 1d4 cold + Str; swift +5 ft reach; grapple inflicts slow (Fort negates).", count=2)],
          descriptors=["Darkness"], augment="Scale claw dice & slow DC (+1 DC per 2 PP spent on damage); or +6 PP to manifest as swift action."),
        # 13
        P("Concussive Detonation", 81, "Psychokinesis", {}, {"Force": 6}, 11,
          "1 standard action", "Medium (100 ft. + 10 ft./level)", "20-ft.-radius burst", "Instantaneous", "Reflex half", "Yes",
          "20-ft burst deals 6d6 force damage to creatures and unattended objects (+1d6 per PP, +1 DC per 2d6).",
          "Creates a telekinetic force explosion in a 20-ft-radius burst dealing 6d6 force damage (Reflex half).",
          [PP(11), R("Damage", 6, 6, "Force", "20-ft burst: 6d6 force damage (Reflex half).", save="Reflex half")],
          descriptors=["Force"], is_area=True, augment="Each extra PP adds +1d6 damage; every +2d6 damage adds +1 save DC."),
        # 14
        P("Cranial Deluge", 81, "Psychometabolism", pw({"Psion/Wilder": 5}), {"Mental Power": 6}, 9,
          "1 round", "Close (25 ft. + 5 ft./2 levels)", "One creature with Int 3+", "Instantaneous", "Fortitude negates", "Yes",
          "1-round casting deals 18d6 damage on failed Fortitude save; killing blows explode the head (prevents raise dead).",
          "Overloads target's cranial pressure after 1 round, dealing 18d6 damage unless Fortitude succeeds; targets slain at <= 0 hp suffer head detonation requiring resurrection. Psion/Wilder 5 (9 PP); Mental Power mantle 6 (11 PP).",
          [PP(9), R("Damage", 18, 6, "Untyped", "18d6 cranial damage after 1-round manifest (Fortitude negates; prevents raise dead on kill).", save="Fortitude negates")],
          augment="Every 2 extra PP increases save DC by +1."),
        # 15
        P("Crystalstorm", 81, "Metacreativity", pw({"Psion/Wilder": 2}), {}, 3,
          "1 standard action", "Close (25 ft. + 5 ft./2 levels)", "Ray", "Instantaneous", "Fortitude partial; see text", "No",
          "Ranged touch ray deals 2d4 slashing plus 1d4 Con damage on failed Fortitude save (+1d4 slashing/PP, +1 Con/2 PP).",
          "Fires a crystal shard ray (ranged touch, ignores PR) dealing 2d4 slashing damage and 1d4 Constitution bleed on a failed Fortitude save.",
          [PP(3), R("Damage", 2, 4, "Slashing", "Ranged touch ray: 2d4 slashing + 1d4 Con damage (Fort negates Con).", save="Fortitude partial")],
          subschool="Creation", action_type="rsak", augment="Each extra PP adds +1d4 slashing; every 2 extra PP adds +1 Con damage."),
        # 16
        P("Damp Power", 82, "Psychometabolism", pw({"Psion/Wilder": 2, "Psychic Warrior": 2}), {"Guardian": 2}, 3,
          "1 immediate action", "Personal", "You", "Until end of next turn", "None", "No",
          "Immediate reaction minimizes all variable numeric effects (damage, healing, etc.) of the next spell/power/SLA/PLA affecting you.",
          "Minimizes every random die roll of the next power, psi-like ability, spell, or spell-like ability that affects you before your next turn ends (affects your share only unless augmented).",
          [PP(3), F("Immediate action: minimize variable dice of next spell/power/SLA/PLA affecting you before end of next turn.")],
          augment="Spend 4 extra PP to minimize an area effect for all creatures you designate within its area."),
        # 17
        P("Dark Despair", 82, "Psychometabolism", {}, {"Evil": 8}, 15,
          "1 standard action", "10 ft.", "10-ft.-radius emanation centered on you", "1 round/level", "See text (Will negates penalties)", "Yes; see text",
          "10-ft evil aura imposes -2 penalties (Will negates), burns good foes for 1d6+ML/round, and grants +2 insight AC/saves vs good.",
          "Creates a 10-ft-radius aura: entrants suffer -2 to attacks, saves, checks, and weapon damage (Will negates); good creatures take 1d6 + ML damage each round inside; you gain +2 insight AC and saves vs good foes.",
          [PP(15), S(["ac.total", "save.all"], 2, "Insight", "+2 insight AC & saves vs good creatures.", condition="vs good"), R("Ongoing / Round", 1, 6, "Evil", "Good foes in 10-ft aura take 1d6 + ML damage per round.")],
          descriptors=["Evil"], is_area=True),
        # 18
        P("Deaden Blow", 82, "Metacreativity", pw({"Lurk": 1, "Psychic Warrior": 1}), {"Guardian": 1}, 3,
          "1 swift action", "Close (25 ft. + 5 ft./2 levels)", "One weapon", "1 round/level", "Will negates (if attended)", "Yes; see text",
          "Sheathes a manufactured weapon in rubbery ectoplasm so all its damage becomes nonlethal (+2 PP for natural weapons).",
          "Wraps a target weapon in ectoplasm so its attacks deal nonlethal damage instead of lethal (Will negates for attended weapons).",
          [PP(3), F("Target weapon deals nonlethal damage for 1 round/level (Will negates if attended).")],
          augment="Spend 2 extra PP to target a natural weapon instead of a manufactured weapon."),
        # 19
        P("Death Knell, Psionic", 82, "Psychometabolism", {}, {"Evil": 2}, 3,
          "1 standard action", "Touch", "One living creature touched", "Instantaneous / 10 min. per HD", "Will negates", "Yes",
          "Kills a dying touched creature and grants 1d8 temp HP, +2 Str, and +1 ML (as death knell).",
          "Snuffs out a dying creature (at <= -1 hp, Will negates) to gain 1d8 temporary hit points, +2 enhancement to Strength, and +1 effective manifester level for 10 minutes per victim HD.",
          [PP(3), F("Execute dying creature (<= -1 hp, Will negates) for 1d8 temp HP, +2 Str, +1 ML.")],
          descriptors=["Death", "Evil"]),
        # 20
        P("Deflection Field", 82, "Psychokinesis", pw({"Psion/Wilder": 1, "Psychic Warrior": 1}), {"Force": 1}, 1,
          "1 swift action", "Personal", "You", "Concentration + 1 round, up to 1 min./level", "None", "No",
          "Swift force band grants +4 deflection bonus to AC while concentrating (+1 round after).",
          "Manifests a spinning force shield granting a +4 deflection bonus to AC as long as you maintain concentration plus 1 lingering round.",
          [PP(1), S(["ac.deflection"], 4, "Deflection", "+4 deflection bonus to AC while concentrating + 1 round.")],
          descriptors=["Force"]),
        # 21
        P("Detain Ectoplasm", 82, "Metacreativity", pw({"Psion/Wilder": 5}), {}, 9,
          "1 standard action", "Medium (100 ft. + 10 ft./level)", "30-ft.-radius burst", "Instantaneous and 1 round/level", "Will negates; see text", "No",
          "Dispels/destroys ectoplasmic effects & constructs in 30-ft burst and banks their ectoplasm for +1 ML on your next metacreativity power.",
          "Acts like dismiss ectoplasm over a 30-ft burst (suppressing psychoactive skins 1d4 rounds, dissipating ectoplasmic constructs on failed Will, or ML check vs DC 11+ML on ongoing effects), storing a reserve that grants +1 ML to one metacreativity power within 1 round/level.",
          [PP(9), F("Dismiss ectoplasmic creatures/effects in 30-ft burst and bank +1 manifester level for your next metacreativity power.")],
          is_area=True),
        # 22
        P("Dimension Hop", 83, "Psychoportation", {}, {"Freedom": 1}, 1,
          "1 swift action", "10 ft.", "You", "Instantaneous", "None", "No",
          "Swiftly teleport up to 10 feet (+5 ft per extra PP) to an unoccupied visible square.",
          "Instantly teleports you to an unoccupied square within line of sight up to 10 feet away.",
          [PP(1), D("Sense / Movement", "Swift short-range teleport 10 ft (+5 ft per extra PP).")],
          subschool="Teleportation", augment="Each extra PP extends teleport distance by +5 feet."),
        # 23
        P("Dimension Twister", 83, "Psychoportation", pw({"Psion/Wilder": 3}), {}, 5,
          "1 standard action", "Close (25 ft. + 5 ft./2 levels)", "One Medium or smaller creature, or 300-lb object", "Instantaneous", "Will negates", "Yes",
          "Violently teleports an enemy within Close range, dealing 5d6 damage (Will negates).",
          "Rips one creature (up to Medium) or object (up to 300 lb) across space to a destination you designate within range, inflicting 5d6 damage from spatial distortion.",
          [PP(5), R("Damage", 5, 6, "Untyped", "5d6 spatial distortion damage + forced teleport in Close range (Will negates).", save="Will negates")],
          subschool="Teleportation", augment="Every 2 extra PP: +1 creature size (or double weight); OR +5 ft displacement; OR +1d6 damage."),
        # 24
        P("Dimensional Pocket", 83, "Psychoportation", pw({"Lurk": 1}), {}, 1,
          "1 standard action", "Touch", "One unattended object (up to 1 lb./level)", "1 hour/level (D)", "None", "No",
          "Stores one unattended small object in an invisible, weightless extradimensional palm pocket.",
          "Tucks one unattended object (up to 1 lb/level) into a hidden, weightless extradimensional pocket in your palm until duration expires or dismissed.",
          [PP(1), F("Conceal one object (up to 1 lb/level) weightlessly in palm extradimensional pocket.")],
          augment="Each extra PP increases weight limit by +1 lb/level; spend 2 extra PP to allow swift-action dismissal."),
        # 25
        P("Discern Lies, Psionic", 84, "Clairsentience", {}, {"Justice": 4}, 7,
          "1 standard action", "Close (25 ft. + 5 ft./2 levels)", "One creature/level within 30 ft. of each other", "Concentration, up to 1 round/level", "Will negates", "No",
          "Reveals deliberate falsehoods spoken by targeted creatures (as discern lies).",
          "Detects intentional lies spoken by targets within range while concentrating (Will negates), functioning as discern lies.",
          [PP(7), F("Detect deliberate falsehoods among 1 target/level while concentrating (as discern lies).")],
          display="Visual"),
        # 26
        P("Distracting Shout", 84, "Psychometabolism", pw({"Psychic Warrior": 2}), {"Chaos": 2}, 3,
          "1 standard action", "15 ft.", "15-ft. cone", "Instantaneous", "Will negates", "Yes",
          "15-ft cone causes creatures failing Will saves to provoke attacks of opportunity from threatening foes (including you).",
          "Emits a battle cry in a 15-ft cone; creatures failing a Will save become momentarily distracted and provoke attacks of opportunity from anyone threatening them.",
          [PP(3), F("15-ft cone: targets failing Will save immediately provoke attacks of opportunity from all threatening creatures.")],
          descriptors=["Mind-Affecting"], is_area=True, augment="Spend 4 extra PP to change the area from a 15-ft cone to a 15-ft burst."),
        # 27
        P("Earth Walk", 84, "Psychometabolism", pw({"Psion/Wilder": 2, "Psychic Warrior": 2}), {"Elements": 2}, 3,
          "1 standard action", "Personal", "You", "1 min./level", "None", "No",
          "Walk across vertical or inverted stone/earth at full speed without Climb checks, retaining Dex to AC and free hands.",
          "Allows effortless traversal of any earthen or stone surface (walls, ceilings) at base speed without Climb checks, free-handed and keeping Dex to AC.",
          [PP(3), D("Sense / Movement", "Spider-climb stone and earth at full speed, keeping Dex to AC and free hands.")],
          augment="Spend 6 extra PP to manifest as a swift action."),
        # 28
        P("Earthquake, Psionic", 84, "Psychokinesis", {}, {"Natural World": 9}, 17,
          "1 standard action", "Long (400 ft. + 40 ft./level)", "80-ft.-radius spread (S)", "1 round", "See text for earthquake", "No",
          "Triggers an intense 80-ft localized tremor collapsing structures and opening fissures (as earthquake).",
          "Induces a localized seismic shock across an 80-ft-radius spread capable of toppling buildings, triggering landslides, and opening fissures, as earthquake.",
          [PP(17), F("80-ft spread violent seismic tremor (as earthquake spell).")],
          is_area=True),
        # 29
        P("Ectoplasmic Swarm", 84, "Metacreativity", pw({"Psion/Wilder": 4}), {}, 7,
          "1 round", "Close (25 ft. + 5 ft./2 levels)", "One ectoplasmic swarm", "Concentration + 2 rounds", "None", "No",
          "Summons an uncontrolled ectoplasmic spider swarm that attacks nearby creatures.",
          "Calls an ectoplasmic swarm (CPsi p.129) that indiscriminately attacks any living creature in its space or pursues the nearest target.",
          [PP(7), F("Summon uncontrolled ectoplasmic spider swarm (Concentration + 2 rounds).")],
          subschool="Creation", augment="Spend 2 extra PP to summon the swarm already occupying creatures' spaces."),
        # 30
        P("Eidetic Lock", 84, "Telepathy", pw({"Psion/Wilder": 1}), {}, 1,
          "1 standard action", "Touch", "1 willing creature", "1 day/level", "Will negates (harmless)", "Yes (harmless)",
          "Imprints one static image or up to 500 words into a willing mind for verbatim recall (+4 PP for permanent).",
          "Locks a single mental picture or 500-word passage into a willing subject's long-term memory for 1 day/level (allowing verbatim recitation or skilled reproduction).",
          [PP(1), F("Store 1 static image or 500-word text in subject's memory for 1 day/level.")],
          subschool="Compulsion", descriptors=["Mind-Affecting"], augment="Spend 4 extra PP to make the duration instantaneous (permanent memory lock)."),
        # 31
        P("Elemental Steward", 85, "Psychoportation", pw({"Psion/Wilder": 2}), {"Elements": 1}, 3,
          "1 round", "Close (25 ft. + 5 ft./2 levels)", "One summoned elemental steward", "1 round/level (D)", "None", "No",
          "Summons an emberling (fire), geodite (sonic), arctine (cold), or tempestan (electricity) steward to fight for you.",
          "Calls one elemental steward (CPsi p.130) matching your chosen energy type, gaining that energy descriptor and acting immediately on your turn.",
          [PP(3), F("Summon chosen elemental steward (cold, electricity, fire, or sonic subtype).")],
          descriptors=["See text"], augment="Every 2 extra PP adds a 50% chance to summon one additional steward of the same kind."),
        # 32
        P("Empower Weapon", 85, "Psychometabolism", pw({"Psychic Warrior": 5}), {}, 9,
          "10 minutes", "Touch", "One weapon touched", "Permanent until discharged (D)", "Will negates (object)", "Yes (object)",
          "Stores one power you know (up to ML - 4 PP total including augments) in a weapon for later PP-free manifestation.",
          "Pre-pays and stores one power (max cost ML - 4 PP) inside a weapon (max 1 empowered weapon at a time) so you can later manifest that exact stored/augmented power without spending PP at activation.",
          [PP(9), F("Store one pre-paid power (max ML - 4 PP) inside a weapon for later PP-free release.")]),
        # 33
        P("Endure Elements, Psionic", 85, "Psychometabolism", pw({"Psion/Wilder": 1, "Psychic Warrior": 1}), {}, 1,
          "1 standard action", "Touch", "Creature touched", "24 hours", "Will negates (harmless)", "Yes (harmless)",
          "Protects touched creature and gear comfortably in extreme temperatures (-50 to 140 F) for 24 hours.",
          "Shields a touched creature from severe hot or cold environmental conditions for 24 hours, functioning as endure elements.",
          [PP(1), D("Energy Resistance", "Comfortably endure temperatures between -50 and 140 F for 24 hours.")]),
        # 34
        P("Energy Arc", 85, "Psychokinesis", pw({"Psion/Wilder": 1}), {}, 1,
          "1 standard action", "15 ft.", "15-ft. cone", "Instantaneous", "Reflex half (object)", "Yes",
          "15-ft cone of cold, electricity, fire, or sonic deals 1d4 energy damage (+1d4 & +1 DC per 2 PP).",
          "Unleashes a 15-ft cone of chosen energy (cold/fire +1/die; electricity +2 DC & +2 vs PR; sonic -1/die & ignores hardness) dealing 1d4 base damage.",
          [PP(1), R("Damage", 1, 4, "Energy (Cold/Elec/Fire/Sonic)", "15-ft cone: 1d4 chosen energy (+elemental riders, Reflex half).", save="Reflex half")],
          descriptors=["See text"], is_area=True, augment="Every 2 extra PP adds +1d4 damage and +1 save DC."),
        # 35
        P("Energy Barrage", 86, "Psychokinesis", pw({"Psion/Wilder": 6}), {}, 11,
          "1 standard action", "Medium (100 ft. + 10 ft./level)", "Three 10-ft. spreads", "Instantaneous", "Reflex half; see text", "No",
          "Detonates three potentially overlapping 10-ft energy spreads each dealing 5d6 damage (+1d6 & +1 DC per 4 PP).",
          "Creates three 10-ft-radius energy explosions (cold, electricity, fire, or sonic; PR No) within Medium range of you and each other; each blast deals 5d6 damage (separate Reflex save per overlapping blast).",
          [PP(11), R("Damage", 5, 6, "Energy (Cold/Elec/Fire/Sonic)", "Three 10-ft spreads each dealing 5d6 damage (Reflex half per spread).", save="Reflex half")],
          descriptors=["See text"], is_area=True, augment="Every 4 extra PP adds +1d6 damage per explosion and +1 save DC."),
        # 36
        P("Energy Claw", 86, "Metacreativity", pw({"Psion/Wilder": 7}), {}, 13,
          "1 standard action", "Medium (100 ft. + 10 ft./level)", "10-ft. claw", "1 round/level (D)", "None", "Yes",
          "Large floating energy claw (+12 touch, grapple 17+Int) grapples one foe and deals 3d6 energy/round.",
          "Creates a Large energy claw (touch +12, grapple +17 + Int; susceptible to dispelling/null psionics) that grapples one opponent and deals 3d6 energy damage per round (cold/fire +1/die & 1.5x vuln opposite; electricity +2 vs PR; sonic -1/die).",
          [PP(13), R("Damage", 3, 6, "Energy (Cold/Elec/Fire/Sonic)", "Grappling Large claw deals 3d6 energy/round (move action to switch targets).")],
          subschool="Creation", descriptors=["See text"], augment="Each extra PP adds +1 to touch/grapple; every 2 extra PP adds +1d6 grapple damage."),
        # 37
        P("Energy Emanation", 86, "Psychokinesis", pw({"Psion/Wilder": 2, "Psychic Warrior": 2}), {}, 3,
          "1 standard action", "5 ft.", "5-ft.-radius emanation centered on you", "1 round/level", "None", "Yes",
          "5-ft aura deals 1d6 chosen energy damage per round with no save (+1d6 per 3 PP).",
          "Surrounds you with a 5-ft energy aura (cold/fire +1/die; electricity +2 vs PR/DC; sonic -1/die & ignores hardness) dealing 1d6 damage each round to all creatures in area.",
          [PP(3), R("Ongoing / Round", 1, 6, "Energy (Cold/Elec/Fire/Sonic)", "5-ft emanation deals 1d6 energy each round to nearby creatures (no save).")],
          descriptors=["See text"], is_area=True, augment="Every 3 extra PP adds +1d6 damage; every 2 bonus dice adds +1 save DC."),
        # 38
        P("Energy Flash", 87, "Psychokinesis", pw({"Psion/Wilder": 4}), {}, 7,
          "1 standard action", "Touch", "Creature touched", "Instantaneous", "Fortitude half", "Yes",
          "Melee touch deals 5d6 chosen energy damage and dazes target for 1 round on failed Fortitude save (+1d6/PP).",
          "Delivers 5d6 cold, electricity, fire, or sonic damage via touch attack and dazes the creature for 1 round unless its Fortitude save succeeds.",
          [PP(7), R("Damage", 5, 6, "Energy (Cold/Elec/Fire/Sonic)", "Touch attack: 5d6 energy + 1-round daze (Fortitude half/negates daze).", save="Fortitude half")],
          descriptors=["See text"], augment="Each extra PP adds +1d6 damage; every +2d6 damage adds +1 save DC."),
        # 39
        P("Energy Lance", 87, "Psychokinesis", pw({"Psion/Wilder": 3}), {}, 5,
          "1 standard action", "Close (25 ft. + 5 ft./2 levels)", "One creature or object", "Instantaneous", "Fortitude half (object); see text", "Yes",
          "Auto-hitting Close-range lance deals 5d6 chosen energy damage plus an elemental debuff (Fortitude half/negates debuff).",
          "Fires a 5d6 lance of chosen energy (Cold: lose next move action; Electricity: -2 Will & Wis checks 1 rd; Fire: -2 attacks & Reflex 1 rd; Sonic: -1/die, ignores hardness, -2 Fort & Concentration 1 rd).",
          [PP(5), R("Damage", 5, 6, "Energy (Cold/Elec/Fire/Sonic)", "5d6 energy + elemental penalty for 1 round (Fortitude half/negates penalty).", save="Fortitude half")],
          descriptors=["See text"], augment="Every 2 extra PP adds +1d6 damage."),
        # 40
        P("Energy Manipulation", 87, "Psychokinesis", {}, {"Energy": 5}, 9,
          "1 standard action", "Close (25 ft. + 5 ft./2 levels)", "Alter one energy effect", "1 round", "None", "Yes",
          "Immediate trigger during 1 round boosts or suppresses a variable energy spell/power/ability by 5 damage dice.",
          "Prepares a 1-round psychic hold; as an immediate action, add or subtract 5 dice from any variable cold/electricity/fire/sonic spell, power, or breath weapon within Close range (discharging the power).",
          [PP(9), F("Trigger as immediate action within 1 round to +/- 5 damage dice on an energy effect in Close range.")],
          augment="Spend 6 extra PP to manifest and trigger immediately as a single immediate action."),
        # 41
        P("Energy Nullification Field", 88, "Psychokinesis", pw({"Kineticist": 5, "Psion/Wilder": 6}), {}, 9,
          "1 standard action", "10 ft.", "10-ft.-radius emanation centered on you", "10 min./level (D)", "None", "No",
          "Functions as null psionics field against powers of one chosen energy descriptor (cold, electricity, fire, or sonic).",
          "Creates a 10-ft emanation suppressing only powers carrying the chosen energy descriptor (Kineticist 5 / 9 PP; Psion/Wilder 6 / 11 PP).",
          [PP(9), F("10-ft aura acts as null psionics field solely against chosen energy descriptor.")],
          is_area=True, augment="Every 4 extra PP increases emanation radius by +5 feet."),
        # 42
        P("Ethereal Abduction", 88, "Psychoportation", pw({"Psion/Wilder": 6}), {}, 11,
          "1 standard action", "Close (25 ft. + 5 ft./2 levels)", "One creature", "1 round/level", "Will negates", "Yes",
          "Banishes one target onto the Ethereal Plane (or pulls an ethereal target to the Material) for 1 round/level (+1 target/PP).",
          "Forces a creature and its gear onto the Ethereal Plane (or draws one from Ethereal to Material if you are ethereal) as psionic ethereal jaunt.",
          [PP(11), F("Force creature onto Ethereal Plane (or pull onto Material) for 1 round/level (Will negates).")],
          augment="Each extra PP affects one additional creature."),
        # 43
        P("Ethereal Agent", 88, "Clairsentience", pw({"Lurk": 5, "Psion/Wilder": 5}), {}, 9,
          "10 minutes", "Unlimited", "Psionic sensor", "Concentration + 5 rounds, up to 10 min./level (D)", "None", "No",
          "Creates an ethereal scouting sensor (40 ft/rd, darkvision 60 ft, blindsense 30 ft, AC 14+Dex, 10 hp) relaying vision.",
          "Forms an ethereal sensor that scouts anywhere regardless of distance/walls while you concentrate (relays Spot/Search at -2 penalty; AC 14+Dex, 10 hp).",
          [PP(9), D("Sense / Movement", "Controllable ethereal sensor with 60-ft darkvision and 30-ft blindsense (Spot/Search -2).")]),
        # 44
        P("Ethereal Volley", 88, "Psychokinesis", pw({"Psychic Warrior": 2}), {"Force": 3}, 5,
          "1 standard action", "Close (25 ft. + 5 ft./2 levels)", "50 projectiles in contact", "10 min./level", "None", "No",
          "Transforms up to 50 projectiles into force missiles treated as ghost touch weapons.",
          "Imbues up to 50 arrows/bolts/ammunition with ectoplasmic force so each fired projectile counts as a ghost touch weapon (Psychic Warrior 2 / 3 PP; Force mantle 3 / 5 PP).",
          [PP(5), F("Up to 50 projectiles function as ghost touch weapons of pure force.")],
          descriptors=["Force"]),
        # 45
        P("Evade Attack", 89, "Psychoportation", pw({"Lurk": 2, "Nomad": 2}), {}, 3,
          "1 immediate action", "Personal", "You", "Instantaneous", "None", "No",
          "Immediately deflects one attack of opportunity provoked by your movement (+4 PP: ML check vs DC 15 to negate a regular hit).",
          "Creates a split-second spatial barrier negating one attack of opportunity triggered during your move action.",
          [PP(3), F("Immediate action negates one attack of opportunity provoked while moving.")],
          augment="Spend 4 extra PP to negate a regular hit instead on a successful ML check (max +10) vs DC 15."),
        # 46
        P("Exhalation of the Bronze Dragon", 89, "Telepathy", pw({"Psion/Wilder": 3, "Psychic Warrior": 3}), {}, 5,
          "1 standard action", "30 ft.", "30-ft. cone", "Instantaneous", "Will negates", "Yes",
          "30-ft cone compels creatures to flee away from you for 1d4 rounds (Will negates).",
          "Exhales repulsive psychic vapor in a 30-ft cone; affected targets failing Will saves must spend their turns moving directly away from you for 1d4 rounds.",
          [PP(5), F("30-ft cone: targets failing Will save must move away from you for 1d4 rounds.")],
          subschool="Compulsion", descriptors=["Mind-Affecting"], is_area=True, augment="Every 2 extra PP increases save DC by +1."),
        # 47
        P("Extend Range", 89, "Psychokinesis", pw({"Lurk": 1, "Psychic Warrior": 1}), {}, 1,
          "1 swift action", "Touch", "One thrown or ranged weapon", "1 round/level", "None", "No",
          "Doubles a held thrown or ranged weapon's range increment (+100% base increment per 4 extra PP).",
          "Telekinetically propels shots/throws from a touched weapon, doubling its range increment for 1 round per level.",
          [PP(1), F("Doubles touched ranged or thrown weapon's range increment for 1 round/level.")],
          augment="Every 4 extra PP adds another +100% to the base range increment."),
        # 48
        P("Extend Reach", 89, "Psychokinesis", pw({"Lurk": 2, "Psychic Warrior": 2}), {}, 3,
          "1 swift action", "Touch", "One melee weapon", "1 round", "None", "No",
          "Shifts a melee weapon's reach +5 feet outward (you no longer threaten the nearer squares; +1 round/PP).",
          "Extends a touched melee weapon's attack distance by 5 feet while shifting its threatened zone exclusively outward by 5 feet.",
          [PP(3), F("Melee weapon strikes 5 ft farther away (does not threaten nearer squares) for 1 round.")],
          augment="Each extra PP extends the duration by +1 round."),
        # 49
        P("Eyes of the Basilisk", 89, "Psychometabolism", pw({"Psion/Wilder": 7}), {}, 13,
          "1 standard action", "30 ft.", "One creature within 30 ft./round", "1 round/level (D)", "Fortitude negates", "Yes",
          "Once per round as a standard action, gaze at one target within 30 ft to permanently turn it to stone (Fortitude negates).",
          "Grants a 30-ft petrifying gaze usable on one target per round as a standard action; enemies may avert eyes (50% chance, concealment) or look away (total concealment).",
          [PP(13), F("Standard action each round petrifies 1 visible target within 30 ft permanently (Fortitude negates).")],),
        # 50
        P("Fiendish Conduit", 89, "Psychokinesis", {}, {"Evil": 5}, 9,
          "1 standard action", "120 ft.", "120-ft. line", "Instantaneous", "Reflex half", "Yes",
          "120-ft negative-energy line deals 9d6 damage to living/constructs or heals undead 9d6 (+1d6 per PP).",
          "As celestial conduit, except channeling the Negative Energy Plane along a 120-ft line to deal 9d6 negative energy damage (healing undead 9d6 instead; Reflex half).",
          [PP(9), R("Damage", 9, 6, "Negative Energy", "120-ft line: 9d6 negative energy damage (heals undead 9d6), Reflex half.", save="Reflex half")],
          descriptors=["Evil"], is_area=True, augment="Each extra PP increases damage (or undead healing) by +1d6 and save DC by +1."),
        # 51
        P("From the Brink", 90, "Psychometabolism", {}, {"Life": 2}, 3,
          "1 immediate action", "Close (25 ft. + 5 ft./2 levels)", "One dying creature", "Instantaneous", "Will negates (harmless)", "No",
          "Immediately stabilizes a dying creature at Close range (+1 PP per HP healed up to 1 hit point).",
          "Halts bleeding and stabilizes one dying target immediately at range; extra PP can restore hit points up to a maximum current total of 1 hp.",
          [PP(3), F("Immediate action stabilizes one dying creature in Close range.")],
          subschool="Healing", augment="Each extra PP restores 1 hp, up to bringing the subject's total to 1 hp."),
        # 52
        P("Glyph of Warding, Psionic", 90, "Metacreativity", pw({"Psion/Wilder": 3}), {}, 5,
          "10 minutes", "Touch", "Object or up to 5 sq. ft./level", "Permanent until discharged (D)", "No (object) or Yes (see glyph of warding)", "Yes",
          "Inscribes an ectoplasmic ward that blasts or triggers a power on trespassers (as glyph of warding).",
          "Functions like glyph of warding, laying down a psionic blast glyph (base 5d8 or stored 3rd-level power); augment scales blast dice by d10s.",
          [PP(5), F("Inscribes psionic trap glyph on object or area (as glyph of warding).")],
          augment="Every 2 extra PP adds +1d10 damage; every +2d10 damage adds +1 save DC."),
        # 53
        P("Greater Glory", 90, "Psychometabolism", {}, {"Good": 8}, 15,
          "1 standard action", "20 ft.", "One good creature/level in 20-ft.-radius burst", "1 round/level", "See text", "Yes",
          "Allies gain 1/duration smite evil (+ML damage), suppression of possession/control, +2 insight AC/saves vs evil, and nauseating aura vs evil attackers.",
          "Empowers up to 1 good creature/level within 20 ft with a one-use +ML damage smite evil, suppression of nongood mental control/possession, +2 insight AC & saves vs evil, and Fortitude-save nausea on evil melee attackers (1d4 rounds).",
          [PP(15), S(["ac.total", "save.all"], 2, "Insight", "Affected good allies gain +2 insight AC & saves vs evil, +ML damage 1x smite evil, and nauseate evil attackers (Fort negates).", condition="vs evil")],
          descriptors=["Good"], is_area=True),
        # 54
        P("Heavy Earth", 90, "Psychometabolism", pw({"Psion/Wilder": 3}), {"Law": 3}, 5,
          "1 standard action", "20 ft.", "20-ft.-radius burst centered on you", "Instantaneous", "Fortitude negates", "Yes",
          "Crushing gravity knocks nearby foes prone and slows them until 1 round after standing (you are slowed 1 rd, never prone, unless +4 PP).",
          "Subjects all creatures in a 20-ft burst to heavy gravity: failed Fortitude knocks prone (multi-legged/stable bonuses apply) and slows until standing + 1 round; saved targets (and you) are slowed 1 round.",
          [PP(5), F("20-ft burst: Fortitude negates prone + slow (until 1 rd after standing); successful targets and caster slowed 1 round.")],
          is_area=True, augment="Spend 4 extra PP to avoid being slowed yourself."),
        # 55
        P("Hungry Touch", 90, "Psychometabolism", {}, {"Consumption": 1}, 1,
          "1 standard action", "Touch", "One creature", "Instantaneous", "Fortitude half; see text", "Yes",
          "Melee touch deals 1d6 damage and grants you equal temporary HP for 10 min (Fortitude halves damage and negates temp HP).",
          "Drains 1d6 life force via melee touch attack and grants matching temporary hit points lasting up to 10 minutes (Fortitude halves damage and blocks temp HP gain).",
          [PP(1), R("Damage", 1, 6, "Untyped", "Touch attack: 1d6 damage + equal temp HP for 10 min (Fort half/blocks temp HP).", save="Fortitude half")],
          augment="Every 2 extra PP adds +1d6 damage and +1 save DC."),
        # 56
        P("Incite Bravery", 91, "Telepathy", pw({"Psychic Warrior": 2}), {"Justice": 2}, 3,
          "1 swift action", "20 ft.", "20-ft.-radius spread centered on you", "1 round/level", "Will negates (harmless)", "Yes (harmless)",
          "Swift 20-ft aura makes you and allies completely immune to fear effects for 1 round/level.",
          "Grants you and all allies within a 20-ft spread immunity to fear effects for 1 round per level.",
          [PP(3), D("Condition Immunity", "You and allies in 20-ft spread are immune to fear effects.")],
          subschool="Compulsion", descriptors=["Mind-Affecting"], is_area=True, augment="Spend 4 extra PP to extend duration to 10 minutes per level."),
        # 57
        P("Inconstant Location", 91, "Psychoportation", pw({"Psion/Wilder": 6, "Psychic Warrior": 6}), {"Chaos": 6}, 11,
          "1 standard action", "Personal", "You", "1 minute", "None", "No",
          "For 1 minute, spend a swift action at the start of each turn to teleport up to your move speed to a visible square without AoOs.",
          "Lets you teleport up to one move action's distance within line of sight at the start of each turn as a swift action without provoking attacks of opportunity.",
          [PP(11), D("Sense / Movement", "Each turn (swift action): teleport up to your move speed within line of sight (no AoO) for 1 min.")],
          subschool="Teleportation", augment="Each extra PP extends duration by +1 round."),
        # 58
        P("Inspire Mount", 91, "Psychometabolism", pw({"Psychic Warrior": 1}), {}, 1,
          "1 standard action", "Touch", "One willing mount", "1 min./level", "Will negates (harmless)", "Yes (harmless)",
          "Touched mount gains +20 ft speed and lets you attempt 1 Ride check to negate a hit (+10 if you already have Mounted Combat).",
          "Grants your mount +20 ft speed and one Mounted Combat hit-negation attempt (+10 competence on Ride if you have Mounted Combat); power ends once negation is attempted.",
          [PP(1), S(["speed.all"], 20, "Untyped", "Mount gains +20 ft speed and one hit-negation Ride attempt.")],
          augment="Spend 6 extra PP to manifest as immediate action; spend 6 extra PP for 10 min/level duration."),
        # 59
        P("Intellect Bomb", 91, "Psychokinesis", {}, {"Destruction": 9}, 17,
          "1 standard action", "Close (25 ft. + 5 ft./2 levels)", "One living creature with Int + 20-ft.-radius burst", "Instantaneous", "Will negates and Reflex half", "Yes",
          "Detonates target's brain (instant kill, Will negates), exploding in a 20-ft burst for Int-score d6 damage and 1-round daze (Reflex half/no daze).",
          "Kills target (or destroys intelligent undead) on failed Will save; backlash deals (target Int score)d6 damage and dazes all creatures in 20 ft for 1 round (Reflex halves damage and negates daze).",
          [PP(17), F("Target dies on failed Will save; brain detonation deals (Int)d6 damage + 1-rd daze in 20-ft burst (Reflex halves & negates daze).")],
          is_area=True),
        # 60
        P("Larval Flayers", 91, "Psychoportation", pw({"Psion/Wilder": 2}), {}, 3,
          "1 round", "Close (25 ft. + 5 ft./2 levels)", "1d3 summoned larval flayers", "1 round/level (D)", "None; see text", "No",
          "Summons 1d3 Tiny larval flayers (CPsi p.133) to attack foes.",
          "Calls 1d3 larval flayers into the same square to immediately fight your enemies on your turn.",
          [PP(3), F("Summon 1d3 larval flayers for 1 round/level.")],
          augment="Every 2 extra PP adds +1 larval flayer; OR +2 PP lets one appear attached and use brain sap (Reflex negates)."),
        # 61
        P("Light Beam", 92, "Psychokinesis", {}, {"Light and Darkness": 4}, 7,
          "1 standard action", "120 ft.", "120-ft. line", "Instantaneous", "Reflex half", "Yes",
          "120-ft line of light (dazzles), shadow (-1/die, hits ethereal fully), or darkness (+1/die in dim/dark) deals 5d6 damage.",
          "Fires a 120-ft beam dealing 5d6 damage (Light: dazzles failed saves; Shadow: -1/die, ignores ethereal miss chance; Darkness: +1/die in shadowy/dark areas).",
          [PP(7), R("Damage", 5, 6, "Light/Shadow/Darkness", "120-ft line: 5d6 damage with light/shadow/darkness mode effects (Reflex half).", save="Reflex half")],
          descriptors=["See text"], is_area=True, augment="Each extra PP adds +1d6 damage."),
        # 62
        P("Light Burst", 92, "Psychokinesis", {}, {"Light and Darkness": 8}, 15,
          "1 standard action", "Long (400 ft. + 40 ft./level)", "80-ft.-radius burst", "Instantaneous", "Reflex partial; see sunburst", "Yes",
          "80-ft blinding solar burst deals 6d6 damage (15d6 to undead) and blinds creatures (as sunburst).",
          "As sunburst over an 80-ft-radius burst, dealing 15d6 base damage to undead (+1d6 per PP, +1 DC per 2d6).",
          [PP(15), R("Damage", 15, 6, "Light", "80-ft burst blinds and burns (15d6 vs undead, 6d6 vs others, Reflex partial).", save="Reflex partial")],
          is_area=True, augment="Each extra PP adds +1d6 damage; every +2d6 damage adds +1 save DC."),
        # 63
        P("Living Arrow", 92, "Metacreativity", pw({"Psychic Warrior": 5}), {}, 9,
          "1 standard action", "Touch", "Projectile weapon touched", "1 round/level (D)", "Will negates (object)", "Yes (object)",
          "First projectile fired each round bends around corners and ignores all cover and concealment.",
          "Animates the first arrow, bolt, or stone fired each round to fly around obstacles to any known target within range, ignoring cover and concealment.",
          [PP(9), F("First fired projectile/round navigates around corners and ignores all cover and concealment.")],
          augment="Every 3 extra PP affects +1 additional projectile per round; spend 2 extra PP for brief clairvoyant view from the arrow."),
        # 64
        P("Mend Wounds", 92, "Psychometabolism", {}, {"Life": 6}, 11,
          "1 standard action", "Touch", "One creature", "Instantaneous", "Will negates (harmless) or Will half", "Yes",
          "Heals touched living target of 55 hit points (or deals 55 damage to undead, Will half; +5 HP/PP).",
          "Channels positive energy on touch to cure 55 hp (or deal 55 damage to undead, Will half).",
          [PP(11), R("Healing", 55, 1, "Positive Energy", "Touch heals 55 hp (or deals 55 damage to undead, Will half).", save="Will half (undead)")],
          subschool="Healing", augment="Each extra PP adds +5 healing/undead damage; spend 4 extra PP to affect all creatures within 20 ft."),
        # 65
        P("Mental Turmoil", 92, "Telepathy", {}, {"Corruption and Madness": 3, "Pain and Suffering": 3}, 5,
          "1 standard action", "Close (25 ft. + 5 ft./2 levels)", "One creature", "1d4+1 rounds", "Will negates", "Yes",
          "Prevents target from casting spells, manifesting powers, using magic/command items, Concentration, or Int/Cha/Dex skills (except Balance/Escape Artist/Ride/Intimidate).",
          "Erects a mental block shutting down spells, powers, SLAs/PLAs, command/trigger/completion items, Concentration, Combat Expertise, metamagic/metapsionic/creation feats, and mental/finesse skills for 1d4+1 rounds.",
          [PP(5), F("Blocks spells, powers, SLAs, Concentration, and most Int/Dex/Cha skills for 1d4+1 rounds (Will negates).")],
          subschool="Compulsion", descriptors=["Mind-Affecting"], augment="Every 2 extra PP increases save DC by +1 and adds +1 target within 15 ft."),
        # 66
        P("Mighty Spring", 93, "Psychokinesis", pw({"Lurk": 1, "Psychic Warrior": 1}), {}, 1,
          "1 swift action", "Personal", "You", "1 round", "None", "No",
          "Swiftly gain +10 enhancement bonus on one Jump check this round (+5 per 2 extra PP).",
          "Telekinetic burst grants a +10 enhancement bonus on a single Jump check during the current round.",
          [PP(1), S(["skill.jmp"], 10, "Enhancement", "+10 enhancement bonus on one Jump check this round.")]),
        # 67
        P("Mind over Energy", 93, "Psychometabolism", pw({"Psion/Wilder": 6, "Psychic Warrior": 6}), {"Guardian": 6}, 11,
          "1 immediate action", "Personal", "You", "1 round/level", "None", "No",
          "Immediate reaction grants complete immunity to cold, electricity, fire, or sonic for 1 round/level.",
          "Instantly fortifies your body against one chosen energy type (cold, electricity, fire, or sonic), granting total immunity for 1 round per level.",
          [PP(11), D("Immunity", "Immediate-action immunity to chosen energy type (cold, electricity, fire, or sonic) for 1 round/level.")]),
        # 68
        P("Mindfire", 93, "Psychometabolism", pw({"Psion/Wilder": 3}), {}, 5,
          "1 standard action", "Touch", "Living creature touched", "Instantaneous", "Fortitude negates", "Yes",
          "Inflicts immediate mindfire disease dealing 1d4 Intelligence damage immediately and daily (Fortitude negates; 2 consecutive saves cure).",
          "Infects touched living foe with mindfire (no incubation), dealing 1d4 Int damage immediately and each day until two consecutive Fortitude saves succeed.",
          [PP(5), F("Touch inflicts mindfire: 1d4 Int damage immediately and daily until 2 consecutive Fort saves (Fort negates).")],
          augment="Every 3 extra PP adds +1 Int damage per interval and +1 save DC."),
        # 69
        P("Moment of Insight", 93, "Clairsentience", pw({"Lurk": 2, "Psychic Warrior": 2}), {}, 3,
          "1 swift action", "Personal", "You", "1 round", "None", "No",
          "Swiftly ignore concealment (except invisibility) enjoyed by creatures within 30 feet for 1 round (+1 round per 2 PP).",
          "Pierces fog, darkness, blur, and other non-invisibility concealment within 30 feet until start of next turn.",
          [PP(3), D("Sense / Movement", "Ignore non-invisibility concealment within 30 ft for 1 round.")],
          augment="Every 2 extra PP extends duration by +1 round."),
        # 70
        P("Perfect Archery", 93, "Clairsentience", pw({"Psychic Warrior": 2}), {}, 3,
          "1 swift action", "Personal", "You", "1 round", "None", "No",
          "Swiftly avoid provoking attacks of opportunity when firing ranged weapons for 1 round (+1 round/PP).",
          "Firing ranged weapons in threatened squares provokes no attacks of opportunity while active.",
          [PP(3), F("Firing ranged weapons does not provoke attacks of opportunity for 1 round.")],
          augment="Each extra PP extends duration by +1 round."),
        # 71
        P("Perfect Riposte", 93, "Clairsentience", pw({"Psychic Warrior": 5}), {"Justice": 6}, 11,
          "1 standard action", "Touch", "Melee weapon touched", "1 round/level", "None (object, harmless)", "No (object, harmless)",
          "Once per round, make an attack of opportunity against a threatened enemy whose melee or natural attack misses you.",
          "Bonds with a wielded melee weapon: 1/round make an AoO against any threatened foe that misses you in melee (Psychic Warrior 5 / 9 PP; Justice 6 / 11 PP).",
          [PP(11), F("1/round attack of opportunity against a threatened attacker who misses you in melee.")],
          augment="Spend 6 extra PP to manifest as a swift action."),
        # 72
        P("Planar Apotheosis", 93, "Psychometabolism", pw({"Psion/Wilder": 4, "Psychic Warrior": 4}), {"Evil": 4, "Good": 4}, 7,
          "1 standard action", "Personal", "You", "1 round/level (D)", "None", "No",
          "Gain 60-ft darkvision, PR 5+ML, energy resistance 10 (acid/cold/elec for celestial; cold/fire for fiendish), and 1/duration smite (+ML dmg).",
          "Channels celestial [Good] or fiendish [Evil] power: 60-ft darkvision, PR 5 + ML, elemental resistances 10, and one smite (+ML damage vs opposed alignment).",
          [PP(7), D("Sense / Movement", "60-ft darkvision."), D("Spell Resistance", "PR 5 + ML.", value="5+ML"), D("Energy Resistance", "Celestial: Acid/Cold/Elec 10 + 1x Smite Evil (+ML); Fiendish: Cold/Fire 10 + 1x Smite Good (+ML).")],
          descriptors=["See text"], augment="Spend 6 extra PP to extend duration to 10 minutes per level."),
        # 73
        P("Planar Champion", 94, "Psychoportation", pw({"Psion/Wilder": 7}), {}, 13,
          "1 round", "Close (25 ft. + 5 ft./2 levels)", "One summoned creature", "1 round/level (D)", "None", "No",
          "Summons either a sibyllic guardian [Good] or a cerebrilith [Evil] (without summoning ability) to fight for you.",
          "Calls an alignment-appropriate planar champion—sibyllic guardian (CPsi p.135) or cerebrilith (EPH p.193)—lacking its own summoning SLA.",
          [PP(13), F("Summon sibyllic guardian (Good) or cerebrilith (Evil) without summoning ability.")],
          descriptors=["See text"], augment="Every 6 extra PP summons one additional champion of the same type."),
        # 74
        P("Planar Embrace", 94, "Psychometabolism", pw({"Psion/Wilder": 8}), {"Evil": 6, "Good": 6}, 15,
          "1 round", "Personal", "You", "1 round/level (D)", "None", "No",
          "Gain wings (fly 2x land speed good for half-celestial, or 1x average for half-fiend) plus half-template SLAs for HD = 1/2 ML.",
          "Imbues half-celestial [Good] or half-fiend [Evil] wings and template spell-like abilities matching HD equal to half your manifester level (Psion/Wilder 8 / 15 PP; Good/Evil mantle 6 / 11 PP).",
          [PP(15), D("Sense / Movement", "Celestial fly 2x speed (good) or Fiendish fly 1x speed (average) plus template SLAs at ML/2 HD.")],
          descriptors=["See text"]),
        # 75
        P("Power Claws", 94, "Psychokinesis", pw({"Psychic Warrior": 2}), {}, 3,
          "1 swift action", "Personal", "You", "1 round/level or until discharged", "None", "No",
          "Swiftly converts next hit with one natural weapon into pure force damage (no incorporeal miss chance, bypasses DR).",
          "Wraps one natural weapon in force so base damage, Str, and weapon bonuses deal force damage on your next hit (+1 charge per 2 PP).",
          [PP(3), A("weaponImbue", "Power Claws", "", "Force", "Next natural weapon hit deals force damage (no incorporeal miss chance; bypasses DR).", rider="Force damage (1 charge)")],
          descriptors=["Force"], augment="Every 2 extra PP adds one additional charge."),
        # 76
        P("Power Thief", 95, "Telepathy", {}, {"Consumption": 7}, 13,
          "1 standard action", "Close (25 ft. + 5 ft./2 levels)", "One creature", "Instantaneous; see text", "Will negates", "Yes",
          "Steals one random power (1 level below target's max) as a 1-use PLA for 1 round (+1 rd/PP) and drains target of ML-2 PP.",
          "Extracts a random power (highest known level - 1) from target on failed Will save; target loses ML - 2 PP and that power for 1 minute while you hold one psi-like use until end of next turn.",
          [PP(13), F("Target loses ML-2 PP and 1 random power for 1 min (Will negates); manifest it 1x before next turn ends.")],
          subschool="Compulsion", descriptors=["Mind-Affecting"], augment="Each extra PP extends retention of the stolen power by +1 round."),
        # 77
        P("Power Weapon", 95, "Psychokinesis", pw({"Psychic Warrior": 2}), {}, 3,
          "1 swift action", "Touch", "Melee or thrown weapon touched", "1 round/level or until discharged", "None", "No",
          "As power claws, except converts the next hit from a touched melee or thrown weapon into pure force damage.",
          "Sheathes a touched melee or thrown weapon in telekinetic force so its next hit deals force damage (base + Str + enhancement), bypassing DR and incorporeal miss chance.",
          [PP(3), A("weaponImbue", "Power Weapon", "", "Force", "Next melee/thrown hit deals force damage (ignores incorporeal miss/DR).", rider="Force damage (1 charge)")],
          descriptors=["Force"], augment="Every 2 extra PP adds one additional charge."),
        # 78
        P("Primal Fear", 95, "Telepathy", pw({"Psion/Wilder": 1, "Psychic Warrior": 1}), {"Corruption and Madness": 1}, 1,
          "1 swift action", "Medium (100 ft. + 10 ft./level)", "One living creature (Int 3+)", "1 round", "Will negates", "Yes",
          "Swiftly inflicts primal terror leaving one target shaken for 1 round (non-stacking; Will negates; +1 target/PP).",
          "Blasts one intelligent living mind at Medium range as a swift action, leaving it shaken for 1 round on a failed Will save (does not stack with other fear).",
          [PP(1), F("Swift action: target shaken for 1 round (Will negates, non-stacking fear).")],
          descriptors=["Mind-Affecting"], augment="Each extra PP targets one additional creature."),
        # 79
        P("Protection from Evil, Psionic", 95, "Telepathy", {}, {"Good": 1}, 1,
          "1 standard action", "Touch", "Creature touched", "1 min./level (D)", "Will negates (harmless)", "No; see protection from evil",
          "Grants +2 deflection AC & +2 resistance saves vs evil, suppresses mental control, and wards off nongood summoned touch attacks.",
          "Functions like protection from evil, warding touched creature against evil attacks (+2 deflection/resistance), compulsion control, and nongood summoned creatures.",
          [PP(1), S(["ac.deflection", "save.all"], 2, "Deflection/Resistance", "+2 deflection AC & +2 resistance saves vs evil; blocks mental control & summons.", condition="vs evil")]),
        # 80
        P("Protection from Good, Psionic", 95, "Telepathy", {}, {"Evil": 1}, 1,
          "1 standard action", "Touch", "Creature touched", "1 min./level (D)", "Will negates (harmless)", "No; see protection from evil",
          "Grants +2 deflection AC & +2 resistance saves vs good, suppresses mental control, and wards off nonevil summoned touch attacks.",
          "As psionic protection from evil, except guarding against good-aligned attackers, mental control, and nonevil summoned creatures.",
          [PP(1), S(["ac.deflection", "save.all"], 2, "Deflection/Resistance", "+2 deflection AC & +2 resistance saves vs good; blocks mental control & summons.", condition="vs good")]),
        # 81
        P("Protection from Psionics", 95, "Clairsentience", {}, {"Guardian": 5}, 9,
          "1 standard action", "Touch", "One creature", "10 min./level", "Will negates (harmless)", "Yes (harmless)",
          "Grants a +3 insight bonus on saving throws against powers and psi-like abilities (+1 per 3 PP).",
          "Shields the touched creature with a +3 insight bonus on saves against psionic powers and psi-like abilities (not Su/Ex).",
          [PP(9), S(["save.psionic"], 3, "Insight", "+3 insight bonus on saves vs powers and psi-like abilities.")],
          augment="Every 3 extra PP increases the save bonus by +1."),
        # 82
        P("Protection from Spells, Psionic", 95, "Psychometabolism", {}, {"Magic": 8}, 15,
          "1 standard action", "Touch", "Creature touched", "10 min./level", "Will negates (harmless, object)", "Yes (harmless, object)",
          "Grants a +8 resistance bonus on saves against spells and spell-like abilities (as protection from spells; +1 target/4 PP).",
          "Provides a +8 resistance bonus on saving throws vs arcane/divine spells and SLAs for 10 min/level, functioning as protection from spells.",
          [PP(15), S(["save.spells"], 8, "Resistance", "+8 resistance bonus on saves vs spells and SLAs (10 min/level).")],
          augment="Every 4 extra PP protects one additional touched creature."),
        # 83
        P("Psychic Containment", 96, "Telepathy", pw({"Psion/Wilder": 3}), {}, 5,
          "1 standard action", "Close (25 ft. + 5 ft./2 levels)", "One psionic creature", "1 round/level", "Will negates", "Yes",
          "Prevents a psionic target from manifesting new powers or PLAs (full-round Will save each turn to break free).",
          "Locks off a psionic creature's reserve so it cannot manifest new powers or PLAs (ongoing non-concentration powers persist); target may spend a full-round action each turn to re-save.",
          [PP(5), F("Target cannot manifest powers or PLAs until duration ends or full-round Will save succeeds.")],
          subschool="Compulsion", descriptors=["Mind-Affecting"], augment="Each extra PP affects one additional psionic creature."),
        # 84
        P("Psychic Scimitar", 96, "Psychometabolism", pw({"Psion/Wilder": 2}), {}, 3,
          "1 standard action", "Medium (100 ft. + 10 ft./level)", "One psychic blade", "1 min./level (D)", "None", "No",
          "Temporarily sacrifices 2 Int to manifest an incorporeal scimitar (AC 22+Int, 4 hp, +2 melee touch, 1d6 dmg) that delivers touch powers <= 4th level at range.",
          "Forms an incorporeal scimitar (costs 2 Int until end; ability damage if destroyed) directed with a standard action within Medium range (+2 melee touch, 1d6 dmg, delivers <= 4th-level touch powers).",
          [PP(3), A("weaponImbue", "Psychic Scimitar", "1d6", "Force/Psychic", "Incorporeal blade (+2 melee touch, 1d6 dmg; can deliver <=4th-level touch powers at Medium range).")],
          augment="Every 2 extra PP increases scimitar damage by +1."),
        # 85
        P("Psychokinetic Weapon", 96, "Psychokinesis", pw({"Psychic Warrior": 4}), {}, 7,
          "1 standard action", "Close (25 ft. + 5 ft./2 levels)", "One weapon", "1 round/level", "Yes (object)", "Yes (object)",
          "Animates one weapon to fly (20 ft, perfect) and attack independently using your BAB + Wis modifier.",
          "Animates a weapon to fly and strike enemies autonomously at your BAB + Wisdom modifier (dealing weapon damage + Wis instead of Str).",
          [PP(7), F("Weapon flies 20 ft (perfect) and attacks using your BAB + Wis modifier for attack and damage.")],
          augment="Every 3 extra PP adds +1 insight to attack; each extra PP adds +5 ft fly speed."),
        # 86
        P("Psychometry", 96, "Clairsentience", pw({"Psion/Wilder": 6}), {"Knowledge": 6}, 11,
          "1 minute", "10 ft.", "10-ft.-radius emanation centered on you", "Concentration, up to 1 min./level (D)", "None", "No",
          "Reads residual psychic impressions of past visitors in the area over successive minutes of concentration.",
          "Reveals creature count, types, duration, alignment, directions, and actions of past groups in a 10-ft emanation (1 aspect per minute studied; foiled by mind blank/cloud mind).",
          [PP(11), F("Read recent historical events and visitors in 10-ft area (1 detail category per minute concentrated).")],
          is_area=True, augment="Each extra PP increases emanation radius by +10 feet."),
        # 87
        P("Psychoportive Shelter", 97, "Psychoportation", pw({"Psion/Wilder": 2}), {}, 3,
          "10 minutes", "10 ft.", "Extradimensional space", "1 hour/level (D)", "None", "No",
          "Opens a shimmering 7-ft extradimensional pocket holding up to 7 Large or smaller creatures (standard action turns entrance invisible).",
          "Creates a secure extradimensional pocket shielding up to 7 occupants from powers/effects across planar lines for 1 hour per level.",
          [PP(3), F("Extradimensional shelter holds 7 Large or smaller creatures; blocks non-planar detection/effects.")],
          augment="Each extra PP adds space for one additional creature of any size."),
        # 88
        P("Psychotic Break", 97, "Telepathy", pw({"Psion/Wilder": 5}), {"Pain and Suffering": 5}, 9,
          "1 standard action", "Medium (100 ft. + 10 ft./level)", "All creatures in 15-ft.-radius burst", "1 round/level", "Will negates", "Yes",
          "15-ft burst drives targets into berserk fury, attacking the nearest creature or whoever last attacked them.",
          "Snaps targets' minds inside a 15-ft burst (Will negates), forcing them to attack the nearest creature (excluding psicrystals) or last attacker each turn without making unrelated AoOs.",
          [PP(9), F("15-ft burst: targets attack nearest creature or last attacker for 1 round/level (Will negates).")],
          subschool="Compulsion", descriptors=["Mind-Affecting"], is_area=True, augment="Every 2 extra PP increases save DC by +1."),
        # 89
        P("Rage of the Remorhaz", 97, "Psychometabolism", pw({"Psychic Warrior": 6}), {}, 11,
          "1 standard action", "Personal", "You", "1 round/level", "None", "No",
          "Skin radiates searing heat dealing 4d6 fire damage to touching creatures, natural/unarmed attackers, and striking melee weapons.",
          "Generates intense body heat dealing 4d6 fire damage to anyone touching you or hitting you with natural/unarmed attacks (or damaging melee weapons that strike you; +1d6 per 2 PP).",
          [PP(11), R("Damage", 4, 6, "Fire", "Touching/natural attackers and striking melee weapons take 4d6 fire damage.")],
          augment="Every 2 extra PP adds +1d6 fire damage (+1 save DC if applicable per +2d6)."),
        # 90
        P("Realized Potential", 97, "Clairsentience", pw({"Psion/Wilder": 3}), {}, 5,
          "1 standard action", "Touch", "Creature touched", "1 round/level", "Will negates (harmless)", "Yes (harmless)",
          "Grants touched creature +1 competence on attacks and saves, plus +2 competence on trained skills.",
          "Awakens future potential in the subject for 1 round per level, granting +1 competence to attack rolls and saves and +2 competence on checks with trained skills.",
          [PP(5), S(["attack", "save.all"], 1, "Competence", "+1 competence on attacks and saves; +2 competence on trained skills.")]),
        # 91
        P("See Invisibility, Psionic", 98, "Clairsentience", pw({"Lurk": 2}), {}, 3,
          "1 standard action", "Personal", "You", "10 min./level", "None", "No",
          "See invisible and ethereal creatures/objects clearly (as see invisibility; +1 willing touched creature per 2 PP).",
          "Grants normal sight of invisible and ethereal things within visual range for 10 min/level, functioning like see invisibility.",
          [PP(3), D("Sense / Movement", "See invisible and ethereal objects and creatures (10 min/level).")],
          augment="Every 2 extra PP includes one additional willing touched creature."),
        # 92
        P("Sensory Gloom", 98, "Psychometabolism", pw({"Lurk": 1}), {}, 1,
          "1 standard action", "Close (25 ft. + 5 ft./2 levels)", "One creature", "1 round/level", "Fortitude negates", "Yes",
          "Shuts down one chosen sense (Sight=concealment/total concealment, Hearing=deafened, Scent/Taste, or Touch=DC 5/10 Balance & no tremorsense).",
          "Severs one sensory pathway on a failed Fortitude save: Sight (fog-like concealment/total >5 ft), Hearing (deafened), Scent/Taste (negates scent), or Touch (Balance DC 5/10 or prone & suppresses tremorsense).",
          [PP(1), F("Suppresses chosen sense (Sight, Hearing, Scent/Taste, or Touch) for 1 round/level (Fortitude negates).")],
          augment="Every 2 extra PP affects +1 additional sense (up to 4) OR increases save DC by +1."),
        # 93
        P("Serenity", 98, "Telepathy", pw({"Psion/Wilder": 2}), {"Repose": 2}, 3,
          "1 standard action", "Medium (100 ft. + 10 ft./level)", "One creature", "Concentration, up to 1 round/level", "Will negates", "Yes",
          "Halts target's violence and suppresses morale bonuses, barbarian rage, fear, and confusion while concentrating (+1 target/2 PP).",
          "Calms one creature (broken by attacks/damage): prevents violent/destructive actions, ends barbarian rage, and suppresses morale bonuses, fear, and confusion during concentration.",
          [PP(3), F("Prevents offensive actions and suppresses rage, morale, fear, and confusion while concentrating (Will negates).")],
          subschool="Compulsion", descriptors=["Mind-Affecting"], augment="Every 2 extra PP targets one additional creature within 30 ft of others."),
        # 94
        P("Shadow Eft", 98, "Psychoportation", pw({"Psion/Wilder": 4}), {}, 7,
          "1 round", "Close (25 ft. + 5 ft./2 levels)", "One summoned shadow eft", "1 round/level (D)", "None", "No",
          "Summons one shadow eft (CPsi p.134) to attack your enemies (+1 eft/4 PP; +2 PP starts one hidden in shadow).",
          "Calls a bone-and-shadow predator (CPsi p.134) that acts immediately on your turn for 1 round per level.",
          [PP(7), F("Summon one shadow eft for 1 round/level.")],
          descriptors=["Evil"], augment="Every 4 extra PP summons +1 shadow eft; spend 2 extra PP to summon one already hidden in shadow."),
        # 95
        P("Shadow Walk, Psionic", 98, "Psychoportation", {}, {"Light and Darkness": 5}, 9,
          "1 standard action", "Touch", "One touched creature/level", "1 hour/level", "Will negates", "Yes",
          "Enters the Plane of Shadow for rapid long-distance overland travel (as shadow walk).",
          "Transports you and touched allies via the border of the Plane of Shadow for rapid travel at 50 mph, as shadow walk.",
          [PP(9), D("Sense / Movement", "High-speed planar travel along Plane of Shadow (as shadow walk).")]),
        # 96
        P("Slow Breathing", 99, "Psychometabolism", pw({"Psion/Wilder": 1, "Psychic Warrior": 1}), {}, 1,
          "1 standard action", "Personal", "You", "1 hour/level", "None", "No",
          "Grants a +4 competence bonus on Fortitude saves against altitude sickness (+4 PP: complete immunity).",
          "Reduces oxygen demand for 1 hour per level, granting +4 competence on saves against altitude sickness.",
          [PP(1), S(["save.altitude"], 4, "Competence", "+4 competence on saves vs altitude sickness (immunity with +4 PP).")],
          augment="Spend 4 extra PP to become immune to altitude sickness."),
        # 97
        P("Speak with Dead, Psionic", 99, "Clairsentience", pw({"Lurk": 3}), {"Death": 3}, 5,
          "10 minutes", "Touch", "One dead creature", "1 min./level", "Will negates; see speak with dead", "No",
          "Compels a corpse to answer up to 5 questions (+1 question per 4 PP; counts as negative energy for Stygian Archon).",
          "Functions as speak with dead, extracting answers to up to 5 questions from a corpse (counts as a negative energy power for Stygian Archon).",
          [PP(5), F("Query corpse for up to 5 answers (as speak with dead; negative energy compatible).")],
          augment="Every 4 extra PP allows one additional question."),
        # 98
        P("Spirit of War", 99, "Telepathy", {}, {"Conflict": 8}, 15,
          "1 standard action", "40 ft.", "40-ft.-radius emanation centered on you", "1 round/level", "None", "No",
          "40-ft aura grants allies +4 competence on attacks and damage, one +10 insight bonus on a save, and one auto-confirmed critical threat.",
          "Inspires you and allies in a 40-ft emanation with +4 competence on attack and damage rolls, one +10 insight save boost, and one automatic critical confirmation during the duration.",
          [PP(15), S(["attack", "damage"], 4, "Competence", "40-ft aura: +4 competence attack & damage, plus 1x +10 insight save and 1x auto-confirm crit.")],
          is_area=True),
        # 99
        P("Stomp, Greater", 99, "Psychokinesis", pw({"Psion/Wilder": 5, "Psychic Warrior": 5}), {}, 9,
          "1 standard action", "120 ft.", "120-ft. line", "Instantaneous", "Reflex negates", "No",
          "120-ft ground shockwave deals 7d6 damage and knocks foes prone (Reflex negates both; +1d6/2 PP).",
          "Transmits a kinetic fissure along a 120-ft line; targets failing Reflex saves take 7d6 damage and fall prone (ignores PR).",
          [PP(9), R("Damage", 7, 6, "Psychokinetic", "120-ft line: 7d6 damage and knocked prone (Reflex negates).", save="Reflex negates")],
          is_area=True, augment="Every 2 extra PP adds +1d6 damage; every +2d6 damage adds +1 save DC."),
        # 100
        P("Stone Mind", 99, "Psychometabolism", pw({"Psion/Wilder": 1, "Psychic Warrior": 1}), {"Natural World": 1}, 1,
          "1 standard action", "Personal", "You", "1 min./level", "None", "No",
          "Grants +4 on Search checks while standing on earth or stone (+2 stacking bonus to notice unusual stonework).",
          "Attunes senses to earth and stone beneath your feet, granting +4 Search (+6 total on unusual stonework, stacking with dwarf stonecunning).",
          [PP(1), S(["skill.src"], 4, "Untyped", "+4 on Search while on earth/stone (+2 additional for stonework, stacks with stonecunning).", condition="on earth or stone")],
          augment="Spend 6 extra PP to manifest as a swift action."),
        # 101
        P("Stygian Bane", 99, "Psychometabolism", pw({"Psychic Warrior": 3}), {}, 5,
          "1 standard action", "Touch", "Weapon touched (or 50 projectiles)", "1 min./level", "Will negates (harmless, object)", "Yes (harmless, object)",
          "Bestows the undead bane property (+2 enhancement, +2d6 damage vs undead) and counts weapon as good-aligned for DR.",
          "Grants touched weapon (or 50 projectiles) the undead bane quality (+2 higher enhancement, +2d6 vs undead) and good alignment for overcoming DR.",
          [PP(5), A("weaponImbue", "Stygian Bane", "", "Good-Aligned", "Grants undead bane (+2 enhancement, +2d6 dmg vs undead) and good-aligned DR bypass.", rider="+2 Enh & +2d6 vs undead")]),
        # 102
        P("Stygian Bolt", 99, "Psychometabolism", pw({"Psion/Wilder": 6}), {}, 11,
          "1 standard action", "120 ft.", "120-ft. line", "Instantaneous", "Reflex negates", "Yes",
          "120-ft black lightning line bestows 1d4 temporary negative levels lasting ML hours (max 15h; undead gain 2d4x5 temp HP for 1h).",
          "Channels Negative Energy Plane lightning in a 120-ft line inflicting 1d4 negative levels (kills if >= HD, else fades in ML hours max 15h; undead gain 2d4x5 temp HP).",
          [PP(11), F("120-ft line: 1d4 negative levels (lasts ML hrs max 15h; undead gain 2d4x5 temp HP for 1h), Reflex negates.")],
          is_area=True, augment="Every 4 extra PP adds +1d4 negative levels (and +2d4x5 temp HP for undead)."),
        # 103
        P("Stygian Conflagration", 100, "Psychometabolism", pw({"Psion/Wilder": 9}), {}, 17,
          "1 standard action", "Medium (100 ft. + 10 ft./level)", "Cylinder (15-ft. radius, 40 ft. high)", "Instantaneous", "Fortitude partial; see text", "Yes",
          "Black flame pillar bestows 1d4 negative levels with no initial save (Fort save after 24h vs permanent level drain; undead gain 1d4x5 temp HP).",
          "Ignites a 15-ft radius, 40-ft tall black flame pillar inflicting 1d4 negative levels (no initial save; Fortitude after 24h prevents permanent level loss; undead gain 1d4x5 temp HP).",
          [PP(17), F("15-ft radius cylinder: 1d4 negative levels (no save initially; Fort at 24h vs permanent drain; undead gain 1d4x5 temp HP).")],
          is_area=True, augment="Every 2 extra PP adds +1 negative level (and +5 temp HP for undead)."),
        # 104
        P("Stygian Discernment", 100, "Clairsentience", pw({"Psion/Wilder": 1, "Psychic Warrior": 1}), {"Death": 1}, 1,
          "1 standard action", "60 ft.", "Cone-shaped emanation", "Concentration, up to 1 min./level", "None", "No",
          "60-ft cone detects undead and negative energy auras; studying for 3 rounds grants +2 insight on next attack, save, or power DC vs located undead.",
          "Reveals presence, count, strength, and location of undead and negative-energy effects over 1-3 rounds; 3 rounds of study yields +2 insight on next attack, save, or DC against that undead.",
          [PP(1), D("Sense / Movement", "60-ft cone detects undead/negative energy auras; 3 rds grants +2 insight vs target undead.")],
          is_area=True),
        # 105
        P("Stygian Disruption", 101, "Psychometabolism", pw({"Psychic Warrior": 4}), {}, 7,
          "1 standard action", "Touch", "One bludgeoning weapon", "1 round/level", "Will negates (harmless, object)", "Yes (harmless, object)",
          "Bestows the disruption special ability on a bludgeoning weapon (undead struck must make Will save or be destroyed).",
          "Imbues a bludgeoning weapon with the disruption quality for 1 round per level, forcing struck undead to succeed on a Will save or be destroyed.",
          [PP(7), A("weaponImbue", "Stygian Disruption", "", "B", "Touched bludgeoning weapon gains undead disruption (Will save or destroy undead).", rider="Disruption vs undead")]),
        # 106
        P("Stygian Dominion", 101, "Psychometabolism", pw({"Psion/Wilder": 5}), {"Death": 5}, 9,
          "1 round", "Medium (100 ft. + 10 ft./level)", "One undead creature", "1 hour/level or until return", "None (or Will negates if augmented)", "Yes",
          "Possesses a mindless undead creature (HD <= ML) with your mental stats, BAB, saves, and powers (+2 PP targets intelligent undead with Will save).",
          "Transfers your mind into a mindless undead vessel (HD <= ML) while your body lies empty; keeps your mental scores, BAB, base saves, and powers while using the undead's physical body.",
          [PP(9), F("Possess mindless undead <= ML HD for 1 hour/level (die if vessel destroyed/duration ends out of range).")],
          augment="Spend 2 extra PP to target intelligent undead (Will negates; re-save every 1d4 rounds)."),
        # 107
        P("Stygian Erasure", 101, "Psychometabolism", pw({"Psychic Warrior": 2}), {}, 3,
          "1 standard action", "Personal", "You", "Instantaneous", "None", "No",
          "Immediately removes one active negative level from yourself (+1 additional negative level per 2 extra PP).",
          "Channels positive energy internally to clear one active negative level (does not restore permanently drained levels).",
          [PP(3), F("Removes 1 active negative level from yourself (+1 per 2 extra PP).")],
          augment="Every 2 extra PP removes one additional negative level."),
        # 108
        P("Stygian Ray", 101, "Psychometabolism", pw({"Psion/Wilder": 2}), {"Death": 2}, 3,
          "1 standard action", "Close (25 ft. + 5 ft./2 levels)", "Ray", "1 round", "None", "Yes",
          "Ranged touch ray inflicts 1d4 temporary negative levels for 1 round (or stuns 1 rd if >= HD; undead gain 5 temp HP for 1 rd).",
          "Fires a black ranged touch ray that bestows 1d4 negative levels for 1 round only (stuns 1 round instead if negative levels >= HD; grants undead 5 temp HP for 1 round).",
          [PP(3), F("Ranged touch ray: 1d4 negative levels for 1 round (stuns if >= HD; undead gain 5 temp HP).")],
          action_type="rsak"),
        # 109
        P("Stygian Touch", 102, "Psychometabolism", pw({"Psychic Warrior": 6}), {}, 11,
          "1 standard action", "Touch", "One creature touched/level", "Instantaneous", "Fortitude negates", "Yes",
          "Up to 1/level melee touch charges each bestow 1 negative level (1h, Fort negates) and grant you 5 temp HP (touching undead heals it 5 temp HP and costs you 5 hp).",
          "Charges your hands for 1 touch per ML: living targets gain 1 negative level for 1 hour and give you 5 temp HP (Fort negates); touching undead grants them 5 temp HP at cost of 5 of your hp.",
          [PP(11), F("1 touch/ML: living foes take 1 negative level (1h, Fort negates) and grant +5 temp HP (+2 PP for 24h duration on a touch).")],
          augment="Spend 2 extra PP to make a designated touch's negative level last 24 hours."),
        # 110
        P("Stygian Veil", 102, "Psychometabolism", pw({"Psion/Wilder": 8}), {"Death": 8}, 15,
          "1 standard action", "Personal", "You", "1 min./level", "None", "No",
          "Grants nearly all undead trait immunities and no Constitution score for 1 min/level (reverses positive/negative healing without changing type).",
          "Conveys undead immunities (mind-affecting, poison, sleep, paralysis, stunning, disease, death, crits, nonlethal, massive damage, ability/energy drain, fatigue/exhaustion, physical ability dmg, non-harmless Fort saves; drops Con bonus HP to min 1/HD).",
          [PP(15), D("Condition Immunity", "Undead-like immunities (mind-affecting, crits, death, drain, poison, physical dmg, Fort saves); Con becomes --.")]),
        # 111
        P("Stygian Ward", 102, "Psychometabolism", {}, {"Life": 4}, 7,
          "1 standard action", "Touch", "Living creature touched", "1 min./level", "Will negates (harmless)", "Yes (harmless)",
          "Protects touched living creature against all death effects, energy drain, and negative energy (as death ward).",
          "Wards a living subject against death effects, energy drain, and negative energy effects for 1 minute per level, functioning as death ward.",
          [PP(7), D("Condition Immunity", "Immunity to death effects, energy drain, and negative energy (as death ward).")]),
        # 112
        P("Stygian Weapon", 102, "Psychometabolism", pw({"Lurk": 2, "Psychic Warrior": 2}), {}, 3,
          "1 swift action", "Touch", "One weapon touched", "1 round", "None (object)", "Yes; see text",
          "Swiftly charges one melee attack this round so hitting delivers the effect of a stygian ray (PR applies).",
          "Infuses one weapon with negative energy so the next melee hit this round also affects the target as stygian ray (1d4 negative levels for 1 round).",
          [PP(3), A("weaponImbue", "Stygian Weapon", "", "Negative Energy", "Swiftly imbues one melee attack this round with stygian ray (1d4 negative levels for 1 round).", rider="Stygian Ray on hit")]),
        # 113
        P("Suggestion, Implanted", 102, "Telepathy", pw({"Psion/Wilder": 4}), {}, 7,
          "1 standard action", "Close (25 ft. + 5 ft./2 levels)", "One creature", "1 day/level or until completed", "Will negates", "Yes",
          "Plants a non-language-dependent conditional suggestion (2-sentence trigger) that activates days later when conditions occur.",
          "As suggestion, except dormant until a specified two-sentence trigger occurs (save rolled at manifestation; undetectable to victim afterwards; +1 target per 2 PP).",
          [PP(7), F("Implants triggered conditional suggestion lasting up to 1 day/level (Will negates on manifest).")],
          subschool="Compulsion", descriptors=["Mind-Affecting"], augment="Every 2 extra PP implants the same trigger in one additional target within 15 ft."),
        # 114
        P("Suppress Schism", 103, "Psychokinesis", pw({"Psion/Wilder": 5}), {}, 9,
          "1 standard action", "Close (25 ft. + 5 ft./2 levels)", "One creature", "Instantaneous + 1 round/level", "Will partial; see text", "Yes",
          "Dispels active telepathy powers, disrupts dual-mind abilities (schism, host feats, Inspired) on failed Will save, and forces ML checks to manifest telepathy.",
          "Runs dispel checks (max +15) against target's active telepathy powers, suppresses dual-mind/possession effects for 1 rd/level (Will negates), and forces DC 11+ML checks to manifest telepathy.",
          [PP(9), F("Dispels active telepathy powers, suppresses schism/dual minds/possession (Will negates), and hinders telepathy manifesting.")],
          augment="Every 2 extra PP increases the Will save DC by +1."),
        # 115
        P("Synchronicity", 103, "Clairsentience", pw({"Psion/Wilder": 1}), {}, 1,
          "1 standard action", "Personal", "You", "1 round", "None", "No",
          "Readies a standard action without declaring a trigger condition (+2 PP: also leave which standard action unspecified until taken).",
          "Grants a free readied standard action usable at any chosen moment before your next turn with no trigger condition required.",
          [PP(1), F("Gain a triggerless readied standard action before next turn (+2 PP to choose action dynamically).")],
          augment="Spend 2 extra PP so you need not specify which standard action you are readying."),
        # 116
        P("Telekinetic Boomerang", 103, "Psychokinesis", pw({"Kineticist": 3, "Psychic Warrior": 3}), {}, 5,
          "1 swift action", "Touch", "One thrown weapon", "1 round/level (D)", "Will negates (object)", "Yes (object)",
          "Swiftly enchants a thrown weapon to return immediately after each attack so it can make iterative throws in the same turn.",
          "Causes a touched thrown weapon to snap back to your hand right after resolving each throw, enabling multiple attacks per turn with one weapon (+1 weapon per 2 PP).",
          [PP(5), F("Thrown weapon returns immediately after each attack for iterative throws in the same round.")],
          augment="Every 2 extra PP imbues one additional thrown weapon."),
        # 117
        P("Telekinetic Buffer", 103, "Psychokinesis", pw({"Psion/Wilder": 5}), {}, 9,
          "1 standard action", "Up to 15 ft.", "Emanation up to 15-ft. radius centered on you", "1 round/level (D)", "None", "Yes",
          "Movable telekinetic aura (0-15 ft) grants +4 cover AC and halves speed of Large or smaller foes entering it.",
          "Creates a chosen-radius (0/5/10/15 ft) aura granting cover (+4 AC) against opponents and halving movement speed of Large or smaller foes (also slows you in tight corridors).",
          [PP(9), S(["ac.cover"], 4, "Cover", "+4 cover bonus to AC and halves speed of Large or smaller foes inside radius.")],
          is_area=True, augment="Every 4 extra PP increases max affected size by 1 category; spend 4 extra PP for standard-action Str 30 bull rush."),
        # 118
        P("Temporal Reiteration", 104, "Psychoportation", pw({"Nomad": 5}), {}, 9,
          "1 swift action", "Personal", "You", "Instantaneous", "None", "No",
          "Swiftly freezes your timers so the past round does not count against any ongoing spell, power, rage, or poison durations on you.",
          "Prevents the elapsed round from subtracting from active durations affecting you (spells, rage, poisons, etc.), effectively extending them by 1 round (+1 person within 30 ft per 4 PP).",
          [PP(9), F("Swift action prevents the current round from counting down ongoing effect durations on you.")],
          augment="Every 4 extra PP shares the duration pause with one additional creature within 30 ft."),
        # 119
        P("Touch of Health", 104, "Psychometabolism", {}, {"Life": 1}, 1,
          "1 standard action", "Touch", "One creature", "Instantaneous", "Will negates (harmless) or Will half", "Yes",
          "Touched living creature heals 2 hit points (or undead takes 2 damage, Will half); +2 HP per extra PP.",
          "Channels a precise trickle of positive energy to cure 2 hit points (or deal 2 damage to undead, Will half).",
          [PP(1), R("Healing", 2, 1, "Positive Energy", "Touch heals 2 hp (+2 hp per extra PP; or deals equal damage to undead, Will half).", save="Will half (undead)")],
          subschool="Healing", augment="Each extra PP adds +2 healing (or +2 damage to undead)."),
        # 120
        P("Urban Strider", 104, "Psychometabolism", pw({"Psion/Wilder": 1, "Psychic Warrior": 1}), {}, 1,
          "1 standard action", "Personal", "You", "1 min./level", "None", "No",
          "Grants +5 competence on Balance/Jump, free 5-ft horizontal jumps, running-start standing jumps, full speed through crowds (+8 PP: walk on walls/windows).",
          "Enhances urban mobility with +5 competence on Balance and Jump, no Balance check when charging sloped surfaces, automatic <= 5-ft jumps, standing jumps treated as running, and unimpeded crowd movement.",
          [PP(1), S(["skill.bal", "skill.jmp"], 5, "Competence", "+5 competence on Balance and Jump; ignore crowd slow and standing-jump penalties.")],
          augment="Spend 8 extra PP to walk vertically or along any city surface as level ground."),
        # 121
        P("Urge Extermination", 104, "Telepathy", pw({"Psion/Wilder": 9}), {}, 17,
          "1 standard action", "Close (25 ft. + 5 ft./2 levels)", "One living creature with <= 90 hp", "Instantaneous", "None", "Yes",
          "No-save psychic kill command slays one living target with 90 or fewer current hit points (+10 HP cap per extra PP).",
          "Snuffs out a living target's mind instantly with no saving throw allowed if it currently has 90 or fewer hit points.",
          [PP(17), F("Slays one living creature at <= 90 current HP with no saving throw (+10 HP limit per PP).")],
          subschool="Compulsion", descriptors=["Mind-Affecting"], augment="Each extra PP raises the HP threshold by +10 hp."),
        # 122
        P("Zone of Alertness", 104, "Telepathy", pw({"Lurk": 2, "Psion/Wilder": 2}), {}, 3,
          "1 standard action", "10 ft.", "You and all allies within 10 ft.", "1 min./level", "Will negates (harmless)", "Yes (harmless)",
          "Links awareness in 10 ft so none are flat-footed if any ally isn't, and grants Spot/Listen bonus equal to linked allies inside.",
          "Synchronizes senses among you and allies staying within 10 ft: shares danger awareness (none flat-footed if one is alert) and grants Spot & Listen bonus equal to linked creature count.",
          [PP(3), S(["skill.spt", "skill.lis"], 1, "Untyped", "Spot & Listen bonus equal to linked allies within 10 ft; shared flat-footed immunity.")],
          subschool="Compulsion", descriptors=["Mind-Affecting"], is_area=True, augment="4 PP: 10 min/lvl; 6 PP: shared anti-flank; 6 PP: swift manifest; 2 PP/5 ft range; 1 PP/+1 Spot/Listen."),
        # 123
        P("Zone of Truth, Psionic", 105, "Telepathy", {}, {"Justice": 2}, 3,
          "1 standard action", "Close (25 ft. + 5 ft./2 levels)", "20-ft.-radius emanation", "1 min./level", "Will negates", "Yes",
          "Prevents creatures inside a 20-ft emanation from speaking deliberate falsehoods (as zone of truth).",
          "Creates a 20-ft golden zone preventing affected creatures (Will negates) from speaking intentional lies for 1 minute per level, as zone of truth.",
          [PP(3), F("20-ft emanation blocks deliberate lies (Will negates, as zone of truth).")],
          subschool="Compulsion", descriptors=["Mind-Affecting"], is_area=True, display="Visual"),
        # 124 (Magic of Incarnum)
        P("Incarnum Fusion", 107, "Metacreativity", pw({"Psychic Warrior": 3, "Shaper": 4}), {}, 5,
          "1 swift action", "Personal", "You", "1 round/level (D)", "None", "No",
          "Swiftly grants DR 2/adamantine and aligns natural claws for DR; invested essentia increases DR (+1/pt) and adds +@essentia atk/dmg to claws.",
          "Fuses incarnum with psionics (Psychic Warrior 3 / 5 PP; Shaper 4 / 7 PP): grants DR 2/adamantine (+1 per invested essentia) and makes natural or claws of the beast claws aligned with +@essentia attack/damage enhancement.",
          [PP(5), b_essentia("Invest essentia into Incarnum Fusion to boost DR and claw enhancement."), D("DR", "DR (2 + @essentia)/adamantine.", value="(2+@essentia)/adamantine"), S(["attack.claw", "damage.claw"], 0, "Enhancement", "Claws bypass alignment DR and gain +@essentia attack/damage.", mode="stat", stat="essentia", mult=1)],
          source="Magic of Incarnum"),
        # 125 (Magic of Incarnum)
        P("Open Chakra, Psionic", 107, "Psychometabolism", pw({"Psion/Wilder": 4, "Psychic Warrior": 4}), {}, 7,
          "1 standard action", "Touch", "Creature touched", "24 hours", "Will negates (harmless)", "Yes (harmless)",
          "Temporarily opens a touched creature's crown, feet, or hands chakra for 24 hours (+6 PP: arms/brow/shoulders; +10 PP: throat/waist).",
          "Pries open one least chakra (crown, feet, or hands) for 24 hours so the subject can bind a soulmeld or magic item to it.",
          [PP(7), F("Opens target's crown, feet, or hands chakra for 24 hours (+6 PP lesser, +10 PP greater).")],
          augment="Spend 6 extra PP to open arms, brow, or shoulders; spend 10 extra PP to open throat or waist.", display="Auditory, material", source="Magic of Incarnum"),
        # 126 (Magic of Incarnum)
        P("Soul Crystal", 107, "Metacreativity", pw({"Psion/Wilder": 7}), {}, 13,
          "1 round", "0 ft.", "One soul-imbued crystal shard", "1 hour/level or until discharged", "None", "No",
          "Creates a crystal shard storing one power you know plus up to 2x ML pre-spent PP so any bearer can manifest (and augment) it at your ML.",
          "Imbues a temporary crystal shard with one known power and a separate reserve of up to 2x ML pre-spent PP; any holder can spend a standard action (provokes AoO) to manifest and augment that power from the crystal's reserve.",
          [PP(13), F("Stores 1 known power + up to 2*ML pre-spent PP in a shareable crystal for 1 hour/level.")],
          display="Material", source="Magic of Incarnum"),
    ]


# ---------------------------------------------------------------------------
# 3. RACES (4 Magic of Incarnum + 1 Complete Psionic = 5 Races)
# ---------------------------------------------------------------------------

def make_race(
    rid: str,
    name: str,
    source: str,
    page: int,
    creature_type: str,
    subtypes: list[str],
    favored_class: str,
    ability_mods: dict[str, int],
    languages: list[str],
    bonus_languages: list[str],
    traits: list[dict[str, str]],
    short_desc: str,
    modifiers: list[dict],
    effects: list[dict],
    *,
    bonus_feats: int = 0,
    darkvision: int = 0,
    low_light: bool = False,
    tags_extra: list[str] | None = None,
) -> dict:
    trait_html = "".join(f"<li><strong>{t['name']}:</strong> {t['desc']}</li>" for t in traits)
    mod_parts = [f"{'+' if v > 0 else ''}{v} {k.upper()}" for k, v in ability_mods.items()] or ["No ability score adjustments"]
    desc = (
        f"<p><strong>Creature Type:</strong> {creature_type}"
        + (f" ({', '.join(subtypes)})" if subtypes else "")
        + f" | <strong>Size:</strong> Medium | <strong>Speed:</strong> 30 ft. | <strong>LA:</strong> +0</p>\n"
        f"<p><strong>Ability Adjustments:</strong> {', '.join(mod_parts)} | <strong>Favored Class:</strong> {favored_class}</p>\n"
        f"<ul>{trait_html}</ul>"
    )
    tags = ["race", slugify(name), "book-verified"] + [s.lower() for s in subtypes] + (tags_extra or [])
    return {
        "id": rid,
        "schemaVersion": 3,
        "blueprint": "race",
        "name": name,
        "type": "Race",
        "category": "Incarnum Race" if "Magic of Incarnum" in source else "Psionic Race",
        "slot": "None",
        "source": source,
        "page": page,
        "edition": "3.5",
        "verification": "book-verified",
        "size": "Medium",
        "baseSpeed": 30,
        "creatureType": creature_type,
        "subtypes": subtypes,
        "favoredClass": favored_class,
        "abilityModifiers": ability_mods,
        "bonusFeats": bonus_feats,
        "bonusSkillPointsPerLevel": 0,
        "darkvision": darkvision,
        "lowLightVision": low_light,
        "levelAdjustment": 0,
        "languages": languages,
        "bonusLanguages": bonus_languages,
        "traits": traits,
        "shortDescription": short_desc,
        "description": desc,
        "tags": tags,
        "modifiers": modifiers,
        "damageParts": [],
        "modes": [],
        "ruleFlags": {},
        "effects": effects,
    }


def build_races() -> list[dict]:
    return [
        make_race(
            "race-azurin", "Azurin", "Magic of Incarnum", 7,
            "Humanoid", ["Human", "Incarnum"], "Soulborn", {},
            ["Common"], ["Any (except secret languages)"],
            [
                {"name": "Humanoid (Human, Incarnum)", "desc": "Counts as human for effects targeting humans; possesses the Incarnum subtype."},
                {"name": "Essentia", "desc": "Base essentia pool increases by 1 (or gains a pool of 1 if none from class/feats)."},
                {"name": "Bonus Feat", "desc": "Gains one extra feat at 1st level."},
                {"name": "Favored Class", "desc": "Soulborn (does not count when calculating multiclass XP penalties)."},
            ],
            "Incarnum-infused human offshoot: +1 essentia pool, bonus 1st-level feat, Medium 30 ft., Favored Class Soulborn.",
            [{"target": "incarnum.essentia", "value": 1, "formula": "1", "type": "racial", "condition": None}],
            [
                b_essentia("Racial +1 point to essentia pool (creates a pool of 1 if you have none).", 1),
                b_eff("Bonus Feat: Gain 1 extra feat at 1st level; counts as Humanoid (Human, Incarnum).", effect_kind="trait"),
            ],
            bonus_feats=1,
            tags_extra=["incarnum"],
        ),
        make_race(
            "race-duskling", "Duskling", "Magic of Incarnum", 10,
            "Fey", ["Extraplanar", "Incarnum"], "Totemist", {"con": 2, "int": -2},
            ["Common", "Sylvan"], ["Elven", "Gnoll", "Gnome", "Goblin", "Halfling"],
            [
                {"name": "Ability Adjustments", "desc": "+2 Constitution, -2 Intelligence."},
                {"name": "Fey (Extraplanar, Incarnum)", "desc": "Immune to effects restricted to humanoids; possesses Low-Light Vision."},
                {"name": "Essentia", "desc": "Base essentia pool increases by 1 (or gains a pool of 1)."},
                {"name": "Speed (Su)", "desc": "Invest essentia into racial speed for +5 ft. enhancement bonus to base land speed per invested point (light or no armor and light load only; maximum limited by character-level essentia capacity)."},
            ],
            "Fey of the soul-mists: +2 Con, -2 Int, Low-Light Vision, +1 essentia, and invest essentia for +5 ft./pt speed.",
            [
                {"target": "ability.con", "value": 2, "formula": "2", "type": "racial", "condition": None},
                {"target": "ability.int", "value": -2, "formula": "-2", "type": "racial", "condition": None},
                {"target": "incarnum.essentia", "value": 1, "formula": "1", "type": "racial", "condition": None},
            ],
            [
                b_stat(["con"], 2, "racial", "+2 Constitution"),
                b_stat(["int"], -2, "racial", "-2 Intelligence"),
                b_essentia("Racial +1 essentia; may invest essentia into racial Speed (+5 ft./essentia while lightly loaded/armored).", 1),
                b_stat(["speed"], 5, "enhancement", "+5 ft. land speed per invested essentia (light/no armor, light load).", mode="perVar", stat="essentia", condition="light or no armor, light load"),
                b_def("vision", "Low-Light Vision; Fey type (immune to humanoid-only spells).", detail="low-light"),
            ],
            low_light=True,
            tags_extra=["incarnum", "fey"],
        ),
        make_race(
            "race-rilkan", "Rilkan", "Magic of Incarnum", 12,
            "Humanoid", ["Reptilian", "Incarnum"], "Incarnate", {"dex": 2, "str": -2},
            ["Common"], ["Any"],
            [
                {"name": "Ability Adjustments", "desc": "+2 Dexterity, -2 Strength."},
                {"name": "Racial Knowledge", "desc": "Treats all Knowledge skills as trained; +1 competence bonus on Knowledge and bardic knowledge checks, increasing by +1 per two soulmelds currently shaped."},
                {"name": "Racial Skill Bonuses", "desc": "+2 racial bonus on Bluff and Diplomacy checks."},
                {"name": "Racial Aid", "desc": "Grants +3 (instead of +2) when successfully using Aid Another on another rilkan."},
            ],
            "Scaled tricksters of incarnum: +2 Dex, -2 Str, +2 Bluff/Diplomacy, all Knowledge trained with meld-scaling bonus.",
            [
                {"target": "ability.dex", "value": 2, "formula": "2", "type": "racial", "condition": None},
                {"target": "ability.str", "value": -2, "formula": "-2", "type": "racial", "condition": None},
                {"target": "skill.bluff", "value": 2, "formula": "2", "type": "racial", "condition": None},
                {"target": "skill.diplomacy", "value": 2, "formula": "2", "type": "racial", "condition": None},
                {"target": "skill.knowledge_all", "value": 1, "formula": "1 + floor(@incarnum.soulmelds/2)", "type": "competence", "condition": None},
            ],
            [
                b_stat(["dex"], 2, "racial", "+2 Dexterity"),
                b_stat(["str"], -2, "racial", "-2 Strength"),
                b_stat(["skill:bluff", "skill:diplomacy"], 2, "racial", "+2 racial bonus on Bluff and Diplomacy."),
                b_stat(["skill:knowledge"], 1, "competence", "All Knowledge skills treated as trained; +1 (+1 per 2 shaped soulmelds) competence on Knowledge and bardic knowledge."),
                b_eff("Racial Aid: Aid Another grants +3 instead of +2 when assisting another rilkan.", effect_kind="trait"),
            ],
            tags_extra=["incarnum", "reptilian"],
        ),
        make_race(
            "race-skarn", "Skarn", "Magic of Incarnum", 15,
            "Humanoid", ["Reptilian", "Incarnum"], "Incarnate", {"str": 2, "dex": -2},
            ["Common"], ["Abyssal", "Celestial", "Draconic", "Elven", "Infernal"],
            [
                {"name": "Ability Adjustments", "desc": "+2 Strength, -2 Dexterity."},
                {"name": "Arm Spines (Ex)", "desc": "Natural weapon dealing 1d6 piercing damage (primary, or off-hand at 1/2 Str while keeping another weapon; cannot attack with both spine and weapon on the same arm in the same round; using shield-arm spine forfeits shield AC until next turn). Treated as lawful-aligned when any soulmeld is bound to the arms chakra."},
                {"name": "Racial Skill Bonuses", "desc": "+2 racial bonus on Climb and Intimidate checks."},
            ],
            "Spine-armed perfectionists: +2 Str, -2 Dex, 1d6 arm spines natural attack (lawful when arms chakra bound), +2 Climb/Intimidate.",
            [
                {"target": "ability.str", "value": 2, "formula": "2", "type": "racial", "condition": None},
                {"target": "ability.dex", "value": -2, "formula": "-2", "type": "racial", "condition": None},
                {"target": "skill.climb", "value": 2, "formula": "2", "type": "racial", "condition": None},
                {"target": "skill.intimidate", "value": 2, "formula": "2", "type": "racial", "condition": None},
            ],
            [
                b_stat(["str"], 2, "racial", "+2 Strength"),
                b_stat(["dex"], -2, "racial", "-2 Dexterity"),
                b_atk("natural", "Arm Spines", "1d6", "piercing", "1d6 piercing natural arm spine; counts as lawful while a soulmeld is bound to the arms chakra.", nat_kind="primary"),
                b_stat(["skill:climb", "skill:intimidate"], 2, "racial", "+2 racial bonus on Climb and Intimidate."),
            ],
            tags_extra=["incarnum", "reptilian"],
        ),
        make_race(
            "race-synad", "Synad", "Complete Psionic", 140,
            "Aberration", ["Psionic"], "Any", {},
            ["Common", "Synad"], ["Any"],
            [
                {"name": "Aberration", "desc": "Immune to spells and effects restricted to humanoids (charm person, dominate person, etc.)."},
                {"name": "Darkvision", "desc": "Darkvision out to 60 feet."},
                {"name": "Naturally Psionic", "desc": "Gains 3 bonus power points at 1st level."},
                {"name": "Threefold Mind (Ex)", "desc": "+2 racial bonus on Will saving throws."},
                {"name": "Oracle (Su)", "desc": "1/day, gain a +2 insight bonus on one initiative check, attack roll, or saving throw (usable after seeing the unmodified roll)."},
                {"name": "Collective (Su)", "desc": "Free action: spend 1 PP to gain a +2 bonus on a Knowledge or Psicraft check."},
                {"name": "Multitask (Su)", "desc": "1/day, spend 1 PP as a free action to gain an extra swift action used solely for a purely mental action (cannot manifest a second power in the same round)."},
            ],
            "Three-minded psionic aberrations: Darkvision 60 ft., +3 bonus PP, +2 Will, Oracle 1/day, Collective, and Multitask 1/day.",
            [
                {"target": "psionic.powerPoints", "value": 3, "formula": "3", "type": "racial", "condition": None},
                {"target": "save.will", "value": 2, "formula": "2", "type": "racial", "condition": None},
            ],
            [
                b_pp(3, "Naturally Psionic: +3 bonus power points at 1st level."),
                b_stat(["will"], 2, "racial", "Threefold Mind: +2 racial bonus on Will saving throws."),
                b_def("vision", "Darkvision 60 ft.; Aberration type (immune to humanoid-only effects).", detail="darkvision 60 ft."),
                b_eff("Oracle 1/day: +2 insight to one initiative, attack, or save; Collective (1 PP, free): +2 Knowledge/Psicraft; Multitask 1/day (1 PP): extra purely mental swift action.", effect_kind="trait"),
            ],
            darkvision=60,
            tags_extra=["psionic", "aberration"],
        ),
    ]


# ---------------------------------------------------------------------------
# 4. FEATS: 50 MoI CATEGORY FIXES + 10 MISSING CPsi FEATS
# ---------------------------------------------------------------------------

def build_feat_fixes() -> list[dict]:
    """Exact IDs in database/srd_feats_splat.json currently mislabeled category='Recitation' -> RAW Table 3-3."""
    def fix(fid: str, name: str, cat: str, feat_types: list[str], note: str = "") -> dict:
        tags = ["feat"] + [ft.lower() for ft in feat_types]
        return {
            "id": fid,
            "name": name,
            "category": cat,
            "featTypes": feat_types,
            "tags": tags,
            "bookVerifiedCategory": cat,
            "bookReference": "Magic of Incarnum Table 3-3 (pp. 34-41)",
            **({"note": note} if note else {}),
        }

    general_ids = [
        ("feat-bonus-essentia", "Bonus Essentia"),
        ("feat-double-chakra", "Double Chakra"),
        ("feat-expanded-soulmeld-capacity", "Expanded Soulmeld Capacity"),
        ("feat-heart-of-incarnum", "Heart of Incarnum"),
        ("feat-improved-essentia-capacity", "Improved Essentia Capacity"),
        ("feat-incarnum-fortified-body", "Incarnum-Fortified Body"),
        ("feat-incarnum-resistance", "Incarnum Resistance"),
        ("feat-necrocarnum-acolyte", "Necrocarnum Acolyte"),
        ("feat-open-least-chakra-crown", "Open Least Chakra (Crown)"),
        ("feat-open-least-chakra-hands", "Open Least Chakra (Hands)"),
        ("feat-open-least-chakra-feet", "Open Least Chakra (Feet)"),
        ("feat-open-lesser-chakra-arms", "Open Lesser Chakra (Arms)"),
        ("feat-open-lesser-chakra-brow", "Open Lesser Chakra (Brow)"),
        ("feat-open-lesser-chakra-shoulders", "Open Lesser Chakra (Shoulders)"),
        ("feat-open-greater-chakra-throat", "Open Greater Chakra (Throat)"),
        ("feat-open-greater-chakra-waist", "Open Greater Chakra (Waist)"),
        ("feat-shape-soulmeld", "Shape Soulmeld"),
        ("feat-share-soulmeld", "Share Soulmeld"),
        ("feat-split-chakra", "Split Chakra"),
    ]
    incarnum_ids = [
        ("feat-azure-enmity", "Azure Enmity", ["Incarnum"]),
        ("feat-azure-talent", "Azure Talent", ["Incarnum", "Psionic"]),
        ("feat-azure-touch", "Azure Touch", ["Incarnum"]),
        ("feat-azure-toughness", "Azure Toughness", ["Incarnum"]),
        ("feat-azure-turning", "Azure Turning", ["Incarnum"]),
        ("feat-azure-wild-shape", "Azure Wild Shape", ["Incarnum"]),
        ("feat-cerulean-fortitude", "Cerulean Fortitude", ["Incarnum"]),
        ("feat-cerulean-reflexes", "Cerulean Reflexes", ["Incarnum"]),
        ("feat-cerulean-will", "Cerulean Will", ["Incarnum"]),
        ("feat-cobalt-charge", "Cobalt Charge", ["Incarnum"]),
        ("feat-cobalt-critical", "Cobalt Critical", ["Incarnum"]),
        ("feat-cobalt-expertise", "Cobalt Expertise", ["Incarnum"]),
        ("feat-cobalt-power", "Cobalt Power", ["Incarnum"]),
        ("feat-cobalt-precision", "Cobalt Precision", ["Incarnum"]),
        ("feat-cobalt-rage", "Cobalt Rage", ["Incarnum"]),
        ("feat-healing-soul", "Healing Soul", ["Incarnum"]),
        ("feat-incarnum-spellshaping", "Incarnum Spellshaping", ["Incarnum"]),
        ("feat-indigo-strike", "Indigo Strike", ["Incarnum"]),
        ("feat-midnight-augmentation", "Midnight Augmentation", ["Incarnum", "Psionic"]),
        ("feat-midnight-dodge", "Midnight Dodge", ["Incarnum"]),
        ("feat-midnight-metamagic", "Midnight Metamagic", ["Incarnum"]),
        ("feat-psycarnum-blade", "Psycarnum Blade", ["Incarnum", "Psionic"]),
        ("feat-sapphire-fist", "Sapphire Fist", ["Incarnum"]),
        ("feat-sapphire-smite", "Sapphire Smite", ["Incarnum"]),
        ("feat-sapphire-sprint", "Sapphire Sprint", ["Incarnum"]),
        ("feat-soulsight", "Soulsight", ["Incarnum"]),
        ("feat-soultouched-spellcasting", "Soultouched Spellcasting", ["Incarnum"]),
    ]
    out = [fix(fid, n, "General", ["General"]) for fid, n in general_ids]
    out += [fix(fid, n, "Incarnum", ft) for fid, n, ft in incarnum_ids]
    out += [
        fix("feat-divine-soultouch", "Divine Soultouch", "Divine", ["Divine"]),
        fix("feat-psycarnum-crystal", "Psycarnum Crystal", "Psionic", ["Psionic"]),
        fix("feat-psycarnum-infusion", "Psycarnum Infusion", "Psionic", ["Psionic"]),
        fix("feat-undead-meldshaper", "Undead Meldshaper", "Monstrous", ["Monstrous"]),
    ]
    return out


def make_feat(
    name: str,
    page: int,
    cat: str,
    feat_types: list[str],
    prereq: str,
    benefit: str,
    effects: list[dict],
    *,
    special: str = "",
    normal: str = "",
    source: str = "Complete Psionic",
) -> dict:
    tags = ["feat"] + [ft.lower().replace(" ", "-") for ft in feat_types] + ["book-verified"]
    desc_parts = [f"<p><strong>Prerequisites:</strong> {prereq}</p>", f"<p><strong>Benefit:</strong> {benefit}</p>"]
    if normal:
        desc_parts.append(f"<p><strong>Normal:</strong> {normal}</p>")
    if special:
        desc_parts.append(f"<p><strong>Special:</strong> {special}</p>")
    return {
        "id": f"feat-{slugify(name)}",
        "schemaVersion": 3,
        "blueprint": "feat",
        "name": name,
        "type": "Feat",
        "category": cat,
        "featTypes": feat_types,
        "scope": "All",
        "slot": "None",
        "source": f"{source} p.{page}",
        "page": page,
        "isFighterBonusFeat": False,
        "bonusFeatFor": [],
        "prerequisites": prereq,
        "prereq": prereq,
        "benefit": benefit,
        "shortDescription": benefit,
        "description": "\n".join(desc_parts),
        "tags": tags,
        "modifiers": [],
        "damageParts": [],
        "modes": [],
        "ruleFlags": {},
        "levelBand": "heroic",
        "edition": "3.5",
        "contentLevel": "summary",
        "verification": "book-verified",
        "effects": effects,
    }


def build_new_feats() -> list[dict]:
    """10 Complete Psionic feats verified missing from database/srd_feats_splat.json."""
    return [
        make_feat(
            "Ectopic Form", 50, "Psionic", ["Psionic"], "Know astral construct power",
            "Sculpt astral constructs into specialized preconfigured forms instead of choosing standard menu options; each selection unlocks a different Ectopic Form.",
            [b_eff("Unlocks one specialized Ectopic Form when manifesting astral construct; repeatable for distinct forms.")],
            special="May be taken multiple times; each instance grants a different form (only one form applies to a given construct).",
        ),
        make_feat(
            "Ectopic Form (Agile Loper)", 51, "Psionic", ["Psionic"], "Know astral construct power",
            "Astral constructs crafted in Agile Loper form gain a +4 bonus on initiative checks and +20 feet to their base land speed.",
            [b_eff("Astral constructs you manifest with this form gain +4 initiative and +20 ft. base speed.")],
        ),
        make_feat(
            "Ectopic Form (Alabaster Aerial)", 51, "Psionic", ["Psionic"], "Know astral construct power",
            "Astral constructs crafted in Alabaster Aerial form gain a fly speed with average maneuverability: 20 ft. (1st-3rd level construct), 30 ft. (4th-6th), or 40 ft. (7th+).",
            [b_eff("Astral constructs gain Fly 20 ft. (average), improving to 30 ft. at 4th level and 40 ft. at 7th level.")],
        ),
        make_feat(
            "Ectopic Form (Amber Tunneler)", 51, "Psionic", ["Psionic"], "Know astral construct power",
            "Astral constructs crafted in Amber Tunneler form gain a burrow speed equal to their base land speed.",
            [b_eff("Astral constructs gain a burrow speed equal to their base land speed.")],
        ),
        make_feat(
            "Ectopic Form (Anathemic Carapace)", 51, "Psionic", ["Psionic"], "Know astral construct power, Ectopic Form (any form)",
            "Construct detonates when destroyed (or on command as a standard action in LoS), dealing 1d6 + 1d6/HD damage to adjacent creatures (Reflex half DC 10 + 1/2 construct HD); damage drops by 1d6 per round after creation.",
            [b_roll("damage", 1, 6, "untyped", "Construct burst deals 1d6 + 1d6/HD (-1d6 per elapsed round) to adjacent foes; Reflex half (DC 10 + 1/2 HD).", save="Reflex half")],
        ),
        make_feat(
            "Ectopic Form (Astral Aquan)", 52, "Psionic", ["Psionic"], "Know astral construct power",
            "Astral constructs crafted in Astral Aquan form gain a 60-foot swim speed.",
            [b_eff("Astral constructs gain a swim speed of 60 feet.")],
        ),
        make_feat(
            "Ectopic Form (Ebony Stinger)", 52, "Psionic", ["Psionic"], "Know astral construct power, Ectopic Form (any form)",
            "Construct attacks deal piercing damage instead of bludgeoning and deliver a poison inflicting 1 point of Constitution damage (Fort negates DC 10 + 1/2 construct HD).",
            [b_eff("Construct attacks deal piercing damage and inflict 1 Con poison damage (Fort DC 10 + 1/2 HD).")],
        ),
        make_feat(
            "Ectopic Form (Emerald Gyre)", 52, "Psionic", ["Psionic"], "Know astral construct power",
            "Astral constructs crafted in Emerald Gyre form sprout a third back limb that grants the Improved Grab special ability (Menu B).",
            [b_eff("Astral constructs gain the Improved Grab (Menu B) special ability.")],
        ),
        make_feat(
            "Ectopic Form (Iridescent Serpent)", 52, "Psionic", ["Psionic"], "Know astral construct power",
            "Select acid, cold, electricity, or fire upon manifesting; the construct gains resistance 10 to that chosen energy type.",
            [b_eff("Astral constructs gain Energy Resistance 10 to one chosen type (acid, cold, electricity, or fire).")],
        ),
        make_feat(
            "Maenad Deafening Scream", 55, "Psionic", ["Psionic", "Racial"], "Maenad",
            "Your racial energy ray (sonic) psi-like ability deals +1 damage per die and deafens damaged targets for 2d6 rounds unless they pass a Fortitude save (DC 10 + 1/2 HD + Con modifier).",
            [b_eff("Racial energy ray (sonic) gains +1 damage/die and deafens targets for 2d6 rounds on failed Fort save (DC 10 + 1/2 HD + Con mod).")],
            normal="Maenad energy ray (sonic) deals -1 damage per die and causes no deafness.",
        ),
    ]


# ---------------------------------------------------------------------------
# 5. CLASSES & PRESTIGE CLASSES (24 Stub Upgrades + cls-erudite = 25)
# ---------------------------------------------------------------------------

def feat_item(name: str, summary: str, ftype: str = "Special") -> dict:
    return {"name": name, "category": "Class Feature", "type": ftype, "summary": summary}


def build_classes_patch() -> tuple[list[dict], dict]:
    splat_path = DB_DIR / "srd_classes_splat.json"
    existing_by_id: dict[str, dict] = {}
    if splat_path.exists():
        for entry in json.loads(splat_path.read_text(encoding="utf-8")):
            if isinstance(entry, dict) and entry.get("id"):
                existing_by_id[entry["id"]] = entry

    def upgrade(
        cid: str,
        name: str,
        book: str,
        page: int,
        role: str,
        short_desc: str,
        features: dict[str, list[dict]],
        effects: list[dict],
        *,
        is_prestige: bool = False,
        max_level: int = 10,
        hit_die: str = "d8",
        bab: str = "medium",
        saves: dict[str, str] | None = None,
        skills_per_lvl: int = 2,
        class_skills: list[str] | None = None,
        prereqs: list[dict] | None = None,
        bonus_feat_levels: list[int] | None = None,
        modifiers: list[dict] | None = None,
        spellcasting: dict | None = None,
        meldshaping: dict | None = None,
        proficiencies: str = "",
        extra_notes: str = "",
    ) -> dict:
        base = dict(existing_by_id.get(cid, {}))
        lvl_rows = []
        for lv in sorted(int(k) for k in features.keys()):
            fn = ", ".join(x["name"] for x in features[str(lv)])
            lvl_rows.append(f"<li><strong>Level {lv}:</strong> {fn}</li>")
        desc = (
            f"<p><strong>Source:</strong> {book} p.{page} | <strong>Role:</strong> {role}</p>\n"
            + (f"<p><strong>Proficiencies:</strong> {proficiencies}</p>\n" if proficiencies else "")
            + (f"<p><strong>Notes:</strong> {extra_notes}</p>\n" if extra_notes else "")
            + f"<p>{short_desc}</p>\n<ul>{''.join(lvl_rows)}</ul>"
        )
        out = {
            "id": cid,
            "schemaVersion": 3,
            "blueprint": "class",
            "name": name,
            "type": "Class",
            "category": "Prestige" if is_prestige else "Base",
            "isPrestige": is_prestige,
            "slot": "None",
            "source": f"{book} p.{page}",
            "page": page,
            "edition": "3.5",
            "contentLevel": "full",
            "verification": "book-verified",
            "patchAction": "upgrade" if cid in existing_by_id else "add",
            "hitDie": base.get("hitDie", hit_die),
            "babProgression": base.get("babProgression", bab),
            "savingThrows": base.get("savingThrows", saves or {"fort": "low", "ref": "low", "will": "high"}),
            "skillPointsPerLevel": base.get("skillPointsPerLevel", skills_per_lvl),
            "maxLevel": base.get("maxLevel", max_level),
            "classSkills": base.get("classSkills", class_skills or []),
            "prerequisites": base.get("prerequisites", prereqs or []),
            "role": role,
            "proficiencies": proficiencies or base.get("proficiencies", "No new weapon, armor, or shield proficiencies."),
            "bonusFeatLevels": bonus_feat_levels or [],
            "spellcasting": spellcasting if spellcasting is not None else base.get("spellcasting", {"type": "none", "ability": None, "spontaneous": False, "spellsPerDay": {}, "spellsKnown": {}}),
            **({"meldshaping": meldshaping} if meldshaping is not None else {}),
            "features": features,
            "addedAbilities": [],
            "shortDescription": short_desc,
            "description": desc,
            "tags": ["class", "prestige" if is_prestige else "base", "incarnum" if "Incarnum" in book else "psionic", "book-verified"],
            "modifiers": modifiers or [],
            "damageParts": [],
            "modes": [],
            "ruleFlags": {"psionicSystem": True} if "Psionic" in book else {"meldshapingSystem": True},
            "effects": effects,
        }
        return out

    # --- Progression helper dicts ---
    inc_meld = {
        "ability": "con",
        "meldshaperLevel": "classLevel",
        "soulmeldsByLevel": [2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9],
        "essentiaByLevel": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26],
        "chakraBindsByLevel": [0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5],
        "chakrasUnlocked": {"2": ["crown"], "4": ["feet", "hands"], "9": ["arms", "brow", "shoulders"], "14": ["throat", "waist"], "16": ["heart"], "19": ["soul"]},
    }
    sb_meld = {
        "ability": "con",
        "meldshaperLevel": "floor(classLevel / 2) from 4th",
        "soulmeldsByLevel": [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5],
        "essentiaByLevel": [0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8, 9, 10],
        "chakraBindsByLevel": [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3],
        "chakrasUnlocked": {"8": ["crown", "feet", "hands"], "14": ["arms", "brow", "shoulders"], "18": ["throat", "waist"]},
    }
    tot_meld = {
        "ability": "con",
        "meldshaperLevel": "classLevel",
        "soulmeldsByLevel": [2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9],
        "essentiaByLevel": [1, 2, 2, 3, 3, 4, 5, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20],
        "chakraBindsByLevel": [0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5],
        "chakrasUnlocked": {"2": ["totem"], "5": ["crown", "feet", "hands"], "9": ["arms", "brow", "shoulders"], "14": ["throat", "waist"], "17": ["heart"]},
    }
    ardent_pp = [2, 6, 11, 17, 25, 35, 46, 58, 72, 88, 106, 126, 147, 170, 195, 221, 250, 280, 311, 343]
    ardent_known = list(range(2, 22))
    dm_pp = [0, 1, 2, 3, 4, 6, 8, 10, 12, 14, 18, 22, 26, 30, 35, 40, 45, 50, 55, 62]
    dm_known = [0, 0, 0, 0, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9]
    dm_max_lvl = [0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6]
    lurk_pp = [1, 2, 3, 5, 7, 11, 15, 19, 23, 27, 35, 43, 51, 59, 67, 79, 91, 103, 115, 127]
    lurk_known = list(range(1, 21))
    lurk_max_lvl = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 6, 6]
    eru_pp = [2, 6, 11, 17, 25, 35, 46, 58, 72, 88, 106, 126, 147, 170, 195, 221, 250, 280, 311, 343]
    eru_unique = [1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11]
    eru_max_lvl = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9]
    zc_pp = [1, 2, 3, 5, 7, 11, 15, 19, 23, 27]
    zc_known = [1, 2, 2, 3, 3, 3, 4, 4, 4, 5]
    zc_max_lvl = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4]

    classes = [
        # --- MoI Base Classes (3) ---
        upgrade(
            "cls-incarnate", "Incarnate", "Magic of Incarnum", 20,
            "Versatile Alignment Meldshaper",
            "Primary Con-based meldshaper channeling pure alignment-tinted soul energy (9 soulmelds, 26 essentia, 5 chakra binds up to Soul).",
            {
                "1": [feat_item("Aura", "Powerful alignment aura matching your extreme moral/ethical component (Ex).", "Ex"),
                      feat_item("Detect Opposition", "At-will detection of creatures with opposite alignment along your non-neutral axis (Sp).", "Sp"),
                      feat_item("Meldshaping", "Shape 2 soulmelds from the Incarnate list (DC 10 + essentia + Con); 1 essentia.", "Su")],
                "2": [feat_item("Chakra Bind (Crown)", "Bind shaped soulmelds or magic items to your crown chakra (1 bind).", "Su")],
                "3": [feat_item("Expanded Soulmeld Capacity +1", "Increase maximum essentia capacity of shaped soulmelds by +1.", "Ex"),
                      feat_item("Incarnum Radiance 1/day", "Free action for 3 + Con rounds: alignment-based insight/dodge/melee bonus (+1/+2/+3/+4 scaling at 6/11/16).", "Su")],
                "4": [feat_item("Chakra Binds (Feet, Hands)", "Unlock feet and hands chakras for binding.", "Su")],
                "5": [feat_item("Rapid Meldshaping 1/day", "Shape one soulmeld as a full-round action (replaces or fills an open meld slot).", "Su")],
                "6": [feat_item("Extra Chakra Bind (2)", "Maximum simultaneous chakra binds increases to 2.", "Su")],
                "7": [feat_item("Share Incarnum Radiance", "Allies within 30 ft. sharing at least one alignment component gain your Incarnum Radiance bonus.", "Su")],
                "8": [feat_item("Incarnum Radiance 2/day", "Use Incarnum Radiance twice per day.", "Su")],
                "9": [feat_item("Chakra Binds (Arms, Brow, Shoulders)", "Unlock lesser chakras (arms, brow, shoulders).", "Su")],
                "10": [feat_item("Extra Chakra Bind (3)", "Maximum simultaneous chakra binds increases to 3.", "Su")],
                "11": [feat_item("Rapid Meldshaping 2/day", "Shape a soulmeld rapidly twice per day.", "Su")],
                "12": [feat_item("Meldshaping Advancement", "Essentia pool reaches 12 (6 soulmelds, 3 binds).", "Su")],
                "13": [feat_item("Incarnum Radiance 3/day", "Use Incarnum Radiance three times per day.", "Su")],
                "14": [feat_item("Chakra Binds (Throat, Waist)", "Unlock greater chakras (throat, waist; 4 binds).", "Su")],
                "15": [feat_item("Expanded Soulmeld Capacity +2", "Soulmeld essentia capacity bonus increases to +2.", "Ex")],
                "16": [feat_item("Chakra Bind (Heart)", "Unlock the heart chakra.", "Su")],
                "17": [feat_item("Rapid Meldshaping 3/day", "Shape a soulmeld rapidly three times per day.", "Su")],
                "18": [feat_item("Incarnum Radiance 4/day", "Use Incarnum Radiance four times per day (5 binds).", "Su")],
                "19": [feat_item("Chakra Bind (Soul)", "Unlock the soul chakra.", "Su")],
                "20": [feat_item("Perfect Meldshaper", "1/day for 3 + Con rounds: fill all shaped soulmelds to max capacity without draining your essentia pool.", "Su"),
                       feat_item("True Incarnation", "Creature type becomes Outsider (Native) matching your alignment.", "Su")],
            },
            [b_essentia("Incarnate essentia pool scales 1 to 26; Expanded Soulmeld Capacity +1 at 3rd (+2 at 15th).", 26),
             b_eff("Shapes up to 9 soulmelds and unlocks up to 5 chakra binds (Crown 2nd through Soul 19th).")],
            max_level=20, hit_die="d6", bab="low", saves={"fort": "high", "ref": "low", "will": "high"},
            proficiencies="Simple weapons, light and medium armor, shields (except tower shields).",
            meldshaping=inc_meld,
        ),
        upgrade(
            "cls-soulborn", "Soulborn", "Magic of Incarnum", 25,
            "Alignment Champion Martial Meldshaper",
            "Full-BAB d10 martial champion wielding Smite Opposition, Incarnum Defense immunities, bonus Incarnum feats, and half-progression soulmelds from 4th level.",
            {
                "1": [feat_item("Aura", "Strong alignment aura corresponding to your extreme moral/ethical alignment.", "Ex"),
                      feat_item("Smite Opposition 1/day", "Melee strike against opposed alignment adds Cha to attack and class level to damage.", "Su")],
                "2": [feat_item("Incarnum Defense", "Alignment-based immunity (LG: fear; CG: paralysis/slow; LE: stun; CE: exhaustion/fatigue).", "Su")],
                "3": [feat_item("Bonus Feat", "Gain a bonus Incarnum feat you qualify for.", "Ex")],
                "4": [feat_item("Meldshaping", "Shape 1 soulmeld from the Soulborn list (meldshaper level = 1/2 Soulborn level).", "Su")],
                "5": [feat_item("Smite Opposition 2/day", "Use Smite Opposition twice per day.", "Su")],
                "6": [feat_item("Essentia Pool 1", "Gain 1 base essentia point.", "Su")],
                "7": [feat_item("Bonus Feat", "Gain a bonus Incarnum feat.", "Ex")],
                "8": [feat_item("Chakra Binds (Crown, Feet, Hands)", "Unlock least chakras (1 chakra bind).", "Su")],
                "9": [feat_item("Share Incarnum Defense 1/day", "1/day grant your Incarnum Defense immunity to one ally.", "Su")],
                "10": [feat_item("Smite Opposition 3/day", "Use Smite Opposition three times per day.", "Su")],
                "11": [feat_item("Bonus Feat", "Gain a bonus Incarnum feat.", "Ex")],
                "12": [feat_item("Meldshaping Advancement", "3 soulmelds shaped, 4 essentia.", "Su")],
                "13": [feat_item("Share Incarnum Defense 2/day", "Share Incarnum Defense twice per day.", "Su")],
                "14": [feat_item("Chakra Binds (Arms, Brow, Shoulders)", "Unlock lesser chakras (2 binds).", "Su")],
                "15": [feat_item("Smite Opposition 4/day", "Use Smite Opposition four times per day.", "Su")],
                "16": [feat_item("Meldshaping Advancement", "4 soulmelds shaped, 6 essentia.", "Su")],
                "17": [feat_item("Share Incarnum Defense 3/day", "Share Incarnum Defense three times per day.", "Su")],
                "18": [feat_item("Chakra Binds (Throat, Waist)", "Unlock greater chakras (3 binds).", "Su")],
                "19": [feat_item("Timeless Body", "No longer take ability penalties for aging or age magically.", "Ex")],
                "20": [feat_item("Smite Opposition 5/day", "Smite Opposition 5/day (5 soulmelds, 10 essentia).", "Su")],
            },
            [b_essentia("Soulborn essentia pool begins at 6th level and scales to 10 at 20th.", 10),
             b_eff("Full BAB martial meldshaper: Smite Opposition up to 5/day, Incarnum Defense, bonus feats at 3/7/11, 5 soulmelds.")],
            max_level=20, hit_die="d10", bab="high", saves={"fort": "high", "ref": "low", "will": "low"},
            proficiencies="All simple and martial weapons; light, medium, and heavy armor; shields (except tower shields).",
            bonus_feat_levels=[3, 7, 11],
            meldshaping=sb_meld,
        ),
        upgrade(
            "cls-totemist", "Totemist", "Magic of Incarnum", 29,
            "Primal Magical-Beast Meldshaper",
            "3/4-BAB d8 primal meldshaper unlocking the unique Totem chakra at 2nd level (up to double bind at 11th and +2 Totem capacity at 15th).",
            {
                "1": [feat_item("Wild Empathy", "Improve animal/magical-beast attitudes as druid + class level.", "Ex"),
                      feat_item("Illiteracy", "Cannot read/write without spending 2 skill points or taking another class.", "Ex"),
                      feat_item("Meldshaping", "Shape 2 soulmelds from the Totemist list; 1 essentia.", "Su")],
                "2": [feat_item("Totem Chakra Bind (+1 Capacity)", "Bind a soulmeld to your exclusive Totem chakra with +1 essentia capacity.", "Su")],
                "3": [feat_item("Totem's Protection", "+4 bonus on saving throws against supernatural abilities of magical beasts.", "Ex")],
                "4": [feat_item("Meldshaping Advancement", "4 soulmelds shaped, 3 essentia.", "Su")],
                "5": [feat_item("Chakra Binds (Crown, Feet, Hands)", "Unlock least chakras.", "Su")],
                "6": [feat_item("Totem Chakra Bind (+1 Meldshaper Level)", "Soulmeld bound to Totem chakra gains +1 meldshaper level (2 total binds).", "Su")],
                "7": [feat_item("Meldshaping Advancement", "5 soulmelds shaped, 5 essentia.", "Su")],
                "8": [feat_item("Rebind Totem Soulmeld 1/day", "Standard action (no AoO): unbind and rebind a shaped soulmeld to your Totem chakra.", "Su")],
                "9": [feat_item("Chakra Binds (Arms, Brow, Shoulders)", "Unlock lesser chakras.", "Su")],
                "10": [feat_item("Extra Chakra Bind (3)", "Total chakra binds increases to 3 (6 soulmelds, 7 essentia).", "Su")],
                "11": [feat_item("Totem Chakra Bind (Double Bind)", "Bind a single soulmeld to both your Totem chakra and another unlocked chakra simultaneously (counts as 1 bind).", "Su")],
                "12": [feat_item("Rebind Totem Soulmeld 2/day", "Rebind Totem soulmeld twice per day.", "Su")],
                "13": [feat_item("Meldshaping Advancement", "7 soulmelds shaped, 10 essentia.", "Su")],
                "14": [feat_item("Chakra Binds (Throat, Waist)", "Unlock greater chakras (4 binds).", "Su")],
                "15": [feat_item("Totem Chakra Bind (+2 Capacity)", "Totem chakra essentia capacity bonus rises to +2.", "Su")],
                "16": [feat_item("Rebind Totem Soulmeld 3/day", "Rebind Totem soulmeld three times per day.", "Su")],
                "17": [feat_item("Chakra Bind (Heart)", "Unlock the heart chakra.", "Su")],
                "18": [feat_item("Extra Chakra Bind (5)", "Total chakra binds reaches 5 (16 essentia).", "Su")],
                "19": [feat_item("Meldshaping Advancement", "9 soulmelds shaped, 18 essentia.", "Su")],
                "20": [feat_item("Totem Embodiment", "1/day for 3 + Con rounds: double the essentia capacity of your Totem chakra without extra essentia cost (20 essentia).", "Su")],
            },
            [b_essentia("Totemist essentia pool scales 1 to 20; Totem chakra gains +1 capacity at 2nd (+2 at 15th).", 20),
             b_eff("Shapes up to 9 soulmelds, up to 5 chakra binds including exclusive Totem chakra and Double Bind at 11th.")],
            max_level=20, hit_die="d8", bab="medium", saves={"fort": "high", "ref": "high", "will": "low"},
            proficiencies="Simple weapons, light armor, shields (except tower shields).",
            meldshaping=tot_meld,
        ),
        # --- MoI Prestige Classes (10) ---
        upgrade(
            "cls-incandescent-champion", "Incandescent Champion", "Magic of Incarnum", 115,
            "Radiant Good Essentia Striker",
            "10-level good-aligned d10 PrC channeling invested essentia into melee damage, self/ally fast healing, radiant aura, and temporary essentia overload.",
            {
                "1": [feat_item("Incandescent Strike", "Invest essentia as a swift action for +1d6 damage per invested point on melee attacks against non-good foes (or bonus damage).", "Su")],
                "2": [feat_item("Fast Healing (Self)", "Gain Fast Healing equal to essentia invested in this feature.", "Su")],
                "3": [feat_item("Unbearable Countenance", "Invest essentia to impose dazzled/shaken radiance on nearby enemies.", "Su")],
                "4": [feat_item("Incarnum Overload 1/day", "Boost one soulmeld/feat/ability essentia capacity by +Cha (min +1) for 1 round.", "Ex")],
                "5": [feat_item("Incandescent Ray", "At-will ranged touch ray dealing 1d6/essentia radiant soul damage.", "Su")],
                "6": [feat_item("Essentia Pool (5)", "Class essentia pool reaches 5.", "Su")],
                "7": [feat_item("Incarnum Overload 2/day", "Use Incarnum Overload twice per day.", "Ex")],
                "8": [feat_item("Incandescent Aura", "Passive radiant soul aura dealing damage/illumination based on invested essentia.", "Su")],
                "9": [feat_item("Fast Healing (Allies)", "Share fast healing equal to invested essentia with nearby good allies.", "Su")],
                "10": [feat_item("Incandescent Apotheosis", "Become an Incandescent Construct/radiant outsider state briefly; 8 class essentia.", "Su")],
            },
            [b_essentia("Grants +1..+8 class essentia pool across 10 levels.", 8),
             b_eff("Essentia-fueled melee bonus dice, fast healing (self and allies), incandescent ray, and Incarnum Overload.")],
            is_prestige=True, max_level=10,
        ),
        upgrade(
            "cls-incarnum-blade", "Incarnum Blade", "Magic of Incarnum", 121,
            "Blademeld Martial Prestige",
            "5-level full-BAB d10 martial PrC wrapping a signature melee weapon in a customizable blademeld bound to progressive chakras (up to Dual Binding at 5th).",
            {
                "1": [feat_item("Shape Blademeld", "Wrap a chosen melee weapon in incarnum granting enhancement/combat effects scaling with level.", "Su"),
                      feat_item("Blademeld Chakra Binds (Crown, Feet, Hands)", "Bind blademeld to least chakras (crown: anti-flank, feet: +2 init, hands: disarm/sunder edge).", "Su")],
                "2": [feat_item("Blademeld Chakra Binds (Arms, Brow, Shoulders)", "Unlock lesser chakras for your blademeld.", "Su")],
                "3": [feat_item("Rebind Blademeld", "Standard action (no AoO), 1 + Con/day: shift your blademeld to another unlocked chakra.", "Su"),
                      feat_item("Blademeld Chakra Binds (Throat, Waist)", "Unlock greater chakras for your blademeld.", "Su")],
                "4": [feat_item("Blademeld Chakra Bind (Heart)", "Unlock the heart chakra for your blademeld.", "Su")],
                "5": [feat_item("Dual Chakra Binding", "Bind your blademeld to two chakras simultaneously (soul chakra unlocked; Rebind can shift both).", "Su")],
            },
            [b_eff("Wraps a melee weapon in a blademeld bound to up to two chakras simultaneously (least through soul) with swift rebinding.")],
            is_prestige=True, max_level=5,
        ),
        upgrade(
            "cls-ironsoul-forgemaster", "Ironsoul Forgemaster", "Magic of Incarnum", 126,
            "Dwarven Craft & Shield/Armor Meldshaper",
            "10-level d8 forgemaster PrC advancing meldshaping 9/10 levels while bonding crafted shields (DR), armor (energy resistance), and weapons (daze).",
            {
                "1": [feat_item("Shield Bond", "Invest essentia into a self-crafted shield for acid/cold/fire/elec/sonic or DR/defense benefits.", "Su")],
                "2": [feat_item("Secrets of the Forge", "Gain Craft Magic Arms and Armor as a bonus feat (ignoring prerequisites); +1 meldshaping.", "Ex")],
                "3": [feat_item("Forge Lore", "Bonus on Craft (armorsmithing/weaponsmithing) and Appraise; +1 meldshaping.", "Ex")],
                "4": [feat_item("Chakra Bind (Arms)", "Unlock the arms chakra; +1 meldshaping.", "Su")],
                "5": [feat_item("Armor Bond", "Invest essentia into self-crafted armor for scaling energy resistance or DR; +1 meldshaping.", "Su")],
                "6": [feat_item("Chakra Bind (Waist)", "Unlock the waist chakra; +1 meldshaping.", "Su")],
                "7": [feat_item("Meldshaping Advancement", "+1 level of existing meldshaping class (6th/7).", "Su")],
                "8": [feat_item("Chakra Bind (Shoulders)", "Unlock the shoulders chakra; +1 meldshaping.", "Su")],
                "9": [feat_item("Weapon Bond", "Invest essentia into a self-crafted weapon for damage and dazing strikes (Fort save); +1 meldshaping.", "Su")],
                "10": [feat_item("Chakra Bind (Heart)", "Unlock the heart chakra; +1 meldshaping (9/10 progression).", "Su")],
            },
            [b_eff("+9/10 meldshaping progression; unlocks Arms, Waist, Shoulders, Heart chakras; Shield/Armor/Weapon Bonds accepting essentia.")],
            is_prestige=True, max_level=10, bonus_feat_levels=[2],
        ),
        upgrade(
            "cls-necrocarnate", "Necrocarnate", "Magic of Incarnum", 132,
            "Soul-Harvesting Evil Meldshaper",
            "13-level evil PrC advancing meldshaper level 13/13 while unlocking lesser/greater/heart/soul chakras, extra soulmelds, Necrocarnum Soulshield, and Harvest Soul.",
            {
                "1": [feat_item("Harvest Soul (1 minute)", "1-minute ritual on a fresh corpse grants ceil(level/2) temporary essentia for 24 hours.", "Su"),
                      feat_item("Improved Meldshaper Level", "Advances meldshaper level at every necrocarnate level.", "Su")],
                "2": [feat_item("Necrocarnum Soulshield", "Gain a profane bonus on all saving throws equal to the number of shaped necrocarnum soulmelds.", "Su")],
                "3": [feat_item("Chakra Binds (Arms, Brow, Shoulders)", "Unlock lesser chakras.", "Su")],
                "4": [feat_item("Extra Chakra Bind & Extra Soulmeld", "+1 chakra bind and +1 soulmeld shaped.", "Su")],
                "5": [feat_item("Essentia Trap", "Immediate action within 100 ft. of a dying creature: gain 1/2 its HD in temporary essentia until end of next turn.", "Su")],
                "6": [feat_item("Necrocarnum Zombie Master (Half Damage)", "Take only half HP damage (1/2 zombie HD, min 1) when animating a necrocarnum zombie.", "Ex")],
                "7": [feat_item("Extra Soulmeld", "+1 soulmeld shaped.", "Su")],
                "8": [feat_item("Chakra Binds (Throat, Waist) & Extra Chakra Bind", "Unlock greater chakras and +1 chakra bind.", "Su")],
                "9": [feat_item("Expanded Necrocarnum Meld Capacity", "+1 essentia capacity on all necrocarnum soulmelds (stacks with Expanded Soulmeld Capacity).", "Ex")],
                "10": [feat_item("Extra Soulmeld & Harvest Soul (Full-Round)", "+1 soulmeld; Harvest Soul takes only a full-round action.", "Su")],
                "11": [feat_item("Chakra Bind (Heart)", "Unlock the heart chakra.", "Su")],
                "12": [feat_item("Extra Chakra Bind", "+1 chakra bind.", "Su")],
                "13": [feat_item("Chakra Bind (Soul), Extra Soulmeld & 2 Zombies", "Unlock soul chakra, +1 soulmeld, and animate up to two necrocarnum zombies simultaneously.", "Su")],
            },
            [b_eff("+13/13 meldshaper level, +4 soulmelds, +3 chakra binds (through Soul), Harvest Soul, Essentia Trap, and Necrocarnum Soulshield.")],
            is_prestige=True, max_level=13,
        ),
        upgrade(
            "cls-sapphire-hierarch", "Sapphire Hierarch", "Magic of Incarnum", 136,
            "Lawful Divine-Meldshaper Theurge",
            "10-level lawful dual-progression PrC advancing BOTH existing divine spellcasting and meldshaping at all 10 levels, with DR/adamantine and Sapphire Body fortification.",
            {
                "1": [feat_item("Consultation 3/level", "Consult the Sapphire Eidolon as commune (3 uses per class level, paying XP cost).", "Sp"),
                      feat_item("Smite Chaos 1/day", "Melee smite against chaotic foes (+Cha attack, +class level damage).", "Su"),
                      feat_item("Dual Advancement (1st)", "+1 existing divine spellcasting level and +1 existing meldshaping level.", "Su")],
                "2": [feat_item("Favored of the Eidolon", "Resistance/immunity against chaotic effects and compulsion control.", "Ex")],
                "3": [feat_item("Damage Reduction 1/adamantine", "Gain DR 1/adamantine.", "Ex")],
                "4": [feat_item("Smite Chaos 2/day", "Smite Chaos usable twice per day.", "Su")],
                "5": [feat_item("Sapphire Body (25% Fortification)", "25% chance to negate critical hits and sneak attacks.", "Ex")],
                "6": [feat_item("Damage Reduction 2/adamantine", "DR improves to 2/adamantine.", "Ex")],
                "7": [feat_item("Smite Chaos 3/day", "Smite Chaos usable three times per day.", "Su")],
                "8": [feat_item("Timeless Body", "Immune to aging penalties and magical aging.", "Ex")],
                "9": [feat_item("Damage Reduction 3/adamantine", "DR improves to 3/adamantine.", "Ex")],
                "10": [feat_item("Consultation 1/month & Sapphire Body (50% Fortification)", "Additional periodic consultation and upgraded fortification (10/10 divine + meldshaping).", "Ex")],
            },
            [b_def("dr", "DR 1/adamantine at 3rd, 2/adamantine at 6th, 3/adamantine at 9th.", value="1-3/adamantine"),
             b_def("fortification", "Sapphire Body grants 25% fortification at 5th (50% at 10th).", value="25-50%"),
             b_eff("+10/10 divine spellcasting AND +10/10 meldshaping progression; Smite Chaos 1-3/day.")],
            is_prestige=True, max_level=10,
        ),
        upgrade(
            "cls-soulcaster", "Soulcaster", "Magic of Incarnum", 142,
            "Arcane-Incarnum Dual Theurge",
            "10-level d4 theurge PrC advancing BOTH arcane spellcasting and meldshaping at all 10 levels while enabling Arcane Investment and Magical Distillation.",
            {
                "1": [feat_item("Arcane Investment 1", "Invest essentia into an arcane spell as you cast it to boost caster level, save DC, or penetration.", "Su"),
                      feat_item("Dual Advancement", "+1 existing arcane spellcasting level and +1 existing meldshaping level every class level (1-10).", "Su")],
                "3": [feat_item("Chakra Binds (Least/Lesser)", "Unlock additional chakra bind slot/tier access.", "Su")],
                "7": [feat_item("Arcane Investment 2", "Apply two Arcane Investment augmentations or higher essentia cap to spells.", "Su")],
                "8": [feat_item("Chakra Binds (Greater)", "Expand available chakra bind access.", "Su")],
                "10": [feat_item("Magical Distillation", "Sacrifice an unused arcane spell slot as a swift action to add temporary essentia equal to spell level for 1 round.", "Su")],
            },
            [b_eff("+10/10 arcane spellcasting AND +10/10 meldshaping progression; invest essentia into spells via Arcane Investment and convert slots at 10th.")],
            is_prestige=True, max_level=10,
        ),
        upgrade(
            "cls-spinemeld-warrior", "Spinemeld Warrior", "Magic of Incarnum", 147,
            "Skarn Dual-Spine Combat Prestige",
            "10-level skarn d10 full-BAB warrior PrC granting Twin Spine Fighting + TWF, Spine Enhancement with essentia, Spine Rend, Arms chakra bind, and Adamantine Spines.",
            {
                "1": [feat_item("Twin Spine Fighting & Two-Weapon Fighting", "Attack with arm spines on both arms as two light weapons; gain Two-Weapon Fighting as a bonus feat (ignoring Dex 15).", "Ex")],
                "2": [feat_item("Noble Familiarity", "+1/2 level competence on Knowledge (nobility & royalty) and noble merchant contacts.", "Ex"),
                      feat_item("Spine Enhancement", "Invest essentia into arm spines for enhancement bonus and elemental/alignment weapon qualities.", "Su")],
                "3": [feat_item("Meldshaping (1 Soulmeld, 2 Essentia)", "Gain 1 soulmeld slot and rising essentia pool.", "Su")],
                "4": [feat_item("Meldshaping Advancement", "Essentia pool reaches 3.", "Su")],
                "5": [feat_item("Spine Rend", "When hitting a foe with both arm spines in one round, deal extra automatic rend damage.", "Ex")],
                "6": [feat_item("Meldshaping Advancement", "Essentia pool reaches 4.", "Su")],
                "7": [feat_item("Chakra Bind (Arms)", "Unlock arms chakra bind (2 soulmelds, 5 essentia, 1 bind).", "Su")],
                "8": [feat_item("Meldshaping Advancement", "Essentia pool reaches 6.", "Su")],
                "9": [feat_item("Adamantine Spines", "Arm spines overcome damage reduction as adamantine weapons.", "Ex")],
                "10": [feat_item("Mastery (7 Essentia)", "2 soulmelds, 7 essentia, 1 arms chakra bind.", "Su")],
            },
            [b_essentia("Spinemeld Warrior grants up to 7 essentia, 2 soulmelds, and Arms chakra bind at 7th.", 7),
             b_eff("Full BAB martial skarn PrC: Twin Spine Fighting + TWF, Spine Enhancement, Spine Rend (5th), Adamantine Spines (9th).")],
            is_prestige=True, max_level=10, bonus_feat_levels=[1],
            meldshaping={"ability": "con", "soulmeldsByLevel": [0, 0, 1, 1, 1, 1, 2, 2, 2, 2], "essentiaByLevel": [0, 1, 2, 3, 3, 4, 5, 6, 6, 7], "chakraBindsByLevel": [0, 0, 0, 0, 0, 0, 1, 1, 1, 1], "chakrasUnlocked": {"7": ["arms"]}},
        ),
        upgrade(
            "cls-totem-rager", "Totem Rager", "Magic of Incarnum", 153,
            "Barbarian-Totemist Rage Meldshaper",
            "10-level d10 PrC advancing meldshaping 8/10 levels while granting bonus Rage essentia, Extra Rage, DR 1-2/-, Extended Rage, and +2 Totem capacity.",
            {
                "1": [feat_item("Totem Rage", "Cobalt Rage capacity +1; while raging with a Totem soulmeld, gain ceil/floor(level/2) min 1 bonus essentia.", "Su"),
                      feat_item("Wild Empathy", "Stacks with totemist/druid wild empathy.", "Ex")],
                "2": [feat_item("Extra Rage & Meldshaping", "+1 daily rage; +1 existing meldshaping level.", "Ex")],
                "3": [feat_item("Damage Reduction 1/-", "Gain DR 1/- (stacks with barbarian DR); +1 meldshaping.", "Ex")],
                "4": [feat_item("Chakra Binds (Crown, Feet, Hands)", "Unlock least chakras; +1 meldshaping.", "Su")],
                "5": [feat_item("Extended Rage", "Rage duration increases by rounds equal to essentia invested in Cobalt Rage; +1 meldshaping.", "Ex")],
                "6": [feat_item("Meldshaping Pause", "No meldshaping advancement at 6th level.", "Ex")],
                "7": [feat_item("Damage Reduction 2/-", "DR increases to 2/-; +1 meldshaping.", "Ex")],
                "8": [feat_item("Extra Rage", "+1 daily rage; +1 meldshaping.", "Ex")],
                "9": [feat_item("Chakra Binds (Arms, Brow, Shoulders)", "Unlock lesser chakras; +1 meldshaping.", "Su")],
                "10": [feat_item("Totem Chakra Bind (+2 Capacity)", "Totem chakra capacity bonus increases to +2; +1 meldshaping (8/10).", "Su")],
            },
            [b_def("dr", "DR 1/- at 3rd, 2/- at 7th (stacks with barbarian DR).", value="1-2/-"),
             b_eff("+8/10 meldshaping (skips 1st/6th), +1 Cobalt Rage capacity, bonus essentia while raging, Extra Rage at 2nd/8th, Extended Rage at 5th.")],
            is_prestige=True, max_level=10,
        ),
        upgrade(
            "cls-umbral-disciple", "Umbral Disciple", "Magic of Incarnum", 158,
            "Shadow Stealth Essentia Assassin",
            "10-level d6 stealth PrC granting 7 essentia, +2/essentia Balance/Climb/Jump/Tumble, +3d6 Sneak Attack, Embrace of Shadow concealment/Hide in Plain Sight, and blindsight.",
            {
                "1": [feat_item("Sept Knowledge", "+2 Knowledge/Gather Information after speaking with a sept member (+5 at stronghold).", "Ex"),
                      feat_item("Step of the Bodiless", "Invest essentia for +2 enhancement per point on Balance, Climb, Jump, and Tumble.", "Su")],
                "2": [feat_item("Sneak Attack +1d6", "Deal +1d6 sneak attack damage.", "Ex")],
                "3": [feat_item("Embrace of Shadow", "10% miss chance per invested essentia (grants Hide in Plain Sight at 20%+).", "Su")],
                "5": [feat_item("Sneak Attack +2d6", "Sneak attack increases to +2d6.", "Ex")],
                "7": [feat_item("Sight of the Eyeless", "Invest essentia for blindsight 10 ft. per point of invested essentia.", "Su")],
                "8": [feat_item("Sneak Attack +3d6", "Sneak attack increases to +3d6.", "Ex")],
                "9": [feat_item("Soulchilling Strike", "Invest essentia to deal Strength damage with melee strikes against flat-footed/flanked foes.", "Su")],
                "10": [feat_item("Kiss of the Shadows", "Convert melee attacks into shadow incorporeal touch attacks with invested essentia.", "Su")],
            },
            [b_essentia("Umbral Disciple gains +1..+7 essentia pool for shadow stealth abilities.", 7),
             b_roll("damage", 3, 6, "sneak", "Sneak attack scales +1d6 (2nd), +2d6 (5th), +3d6 (8th)."),
             b_eff("Step of the Bodiless (+2/essentia acrobatic skills), Embrace of Shadow (10%/essentia miss chance + HiPS at 2+), Sight of the Eyeless (10 ft./essentia blindsight).")],
            is_prestige=True, max_level=10,
        ),
        upgrade(
            "cls-witchborn-binder", "Witchborn Binder", "Magic of Incarnum", 162,
            "Anti-Arcane Incarnum Inquisitor",
            "10-level d6 inquisitor PrC advancing meldshaping 5/10 levels (odd levels) with Detect Magic, Meldshield, Dispelling Orb, Mage Shackles, Word of Abrogation, and Spiritflay.",
            {
                "1": [feat_item("Detect Magic", "Use detect magic at will.", "Sp"),
                      feat_item("Meldshield", "Invest essentia for insight bonus on saves against arcane spells/SLAs; +1 meldshaping.", "Su"),
                      feat_item("Royal Purse", "Receive royal inquisitorial stipend/gear support (improves at 10th).", "Ex")],
                "2": [feat_item("Dispelling Orb", "Hurl ranged touch orb within 30 ft. to targeted-dispel arcane magic (+2 essentia pool).", "Su")],
                "3": [feat_item("Meldshaping (+1)", "+1 existing meldshaping level.", "Su")],
                "4": [feat_item("Mage Shackles", "Standard action: entrap arcane caster within 30 ft. in incarnum shackles suppressing casting/teleports.", "Su")],
                "5": [feat_item("Meldshaping (+1)", "+1 existing meldshaping level.", "Su")],
                "6": [feat_item("Word of Abrogation", "Counterspell enemy arcane spells using incarnum; +1 essentia pool.", "Sp")],
                "7": [feat_item("Meldshaping (+1)", "+1 existing meldshaping level.", "Su")],
                "8": [feat_item("Spiritflay", "Rip soulstuff from an arcane caster to deal damage and suppress spell slots.", "Su")],
                "9": [feat_item("Meldshaping (+1)", "+1 existing meldshaping level.", "Su")],
                "10": [feat_item("Grim Integument & Royal Purse 1/year", "Trap foe within 30 ft. in an incarnum coffin shroud; +1 meldshaping (5/10).", "Su")],
            },
            [b_essentia("Grants +2 total bonus essentia (+1 at 2nd, +1 at 6th).", 2),
             b_eff("+5/10 meldshaping (odd levels), at-will Detect Magic, Meldshield anti-arcane save bonus, Dispelling Orb, Mage Shackles, Word of Abrogation, Spiritflay.")],
            is_prestige=True, max_level=10,
        ),
        # --- Complete Psionic Base Classes (4, including new cls-erudite) ---
        upgrade(
            "cls-ardent", "Ardent", "Complete Psionic", 5,
            "Wisdom-Based Mantle Manifester",
            "20-level d6 3/4-BAB psionic philosopher channeling 2-6 philosophical Mantles (9th-level powers, 343 base PP, ML limited only by character level for mantle learning).",
            {
                "1": [feat_item("Assume Psionic Mantles (2)", "Select 2 philosophical mantles gaining each mantle's granted power and power list; learn 2 starting powers.", "Ex")],
                "2": [feat_item("Assume Psionic Mantle (3rd)", "Gain a 3rd psionic mantle and its granted power.", "Ex")],
                "5": [feat_item("Assume Psionic Mantle (4th)", "Gain a 4th psionic mantle and its granted power.", "Ex")],
                "10": [feat_item("Assume Psionic Mantle (5th)", "Gain a 5th psionic mantle and its granted power.", "Ex")],
                "15": [feat_item("Assume Psionic Mantle (6th)", "Gain a 6th psionic mantle and its granted power.", "Ex")],
            },
            [b_pp(343, "Base PP scales 2 (1st) to 343 (20th) + Wis bonus PP; learns powers up to highest level affordable by ML."),
             b_eff("Assumes 2 mantles at 1st and +1 mantle at 2nd, 5th, 10th, 15th (6 total), gaining each mantle's granted ability.")],
            max_level=20, hit_die="d6", bab="medium", saves={"fort": "low", "ref": "low", "will": "high"},
            proficiencies="All simple weapons; light, medium, and heavy armor; shields (except tower shields).",
            spellcasting={"type": "psionic", "ability": "wis", "spontaneous": True, "powerPointsByLevel": ardent_pp, "powersKnownByLevel": ardent_known, "mantlesAtLevels": [1, 1, 2, 5, 10, 15], "spellsPerDay": {}, "spellsKnown": {}},
        ),
        upgrade(
            "cls-divine-mind", "Divine Mind", "Complete Psionic", 9,
            "Mantle-Aura Psionic Paladin",
            "20-level d10 psionic champion of faith radiating scalable 5-50 ft. Psychic Auras (Attack/Defense/Perception + Mantle auras), Divine Grace at 4th, and 6th-level powers from 5th.",
            {
                "1": [feat_item("Wild Talent", "Gain Wild Talent (+2 bonus PP) as a bonus feat.", "Ex"),
                      feat_item("Mantle (1st)", "Select first divine mantle (granted power + power list).", "Ex"),
                      feat_item("Psychic Aura (5 ft.)", "Project Attack, Defense, Perception, or Mantle aura in a 5-ft. radius.", "Su")],
                "3": [feat_item("Psychic Aura (10 ft.)", "Aura radius expands to 10 ft.", "Su")],
                "4": [feat_item("Divine Grace", "Add Charisma bonus (if positive) to all saving throws.", "Su")],
                "5": [feat_item("Psychic Aura (15 ft.) & Manifesting (1st)", "Aura radius 15 ft.; begin learning 1st-level mantle powers (4 base PP).", "Su")],
                "6": [feat_item("Mantle (2nd)", "Gain a second divine mantle.", "Ex")],
                "7": [feat_item("Psychic Aura (20 ft.)", "Aura radius 20 ft.", "Su")],
                "8": [feat_item("Change Aura (Standard Action) & 2nd-Lvl Powers", "Switch active psychic aura as a standard action; unlock 2nd-level powers.", "Ex")],
                "9": [feat_item("Psychic Aura (25 ft.)", "Aura radius 25 ft.", "Su")],
                "10": [feat_item("Psychic Aura (Second Aura)", "Project two psychic auras simultaneously.", "Su")],
                "11": [feat_item("Psychic Aura (30 ft.) & 3rd-Lvl Powers", "Aura radius 30 ft.; unlock 3rd-level powers.", "Su")],
                "12": [feat_item("Mantle (3rd)", "Gain a third divine mantle.", "Ex")],
                "13": [feat_item("Psychic Aura (35 ft.)", "Aura radius 35 ft.", "Su")],
                "14": [feat_item("Change Aura (Move Action) & 4th-Lvl Powers", "Switch active aura as a move action; unlock 4th-level powers.", "Ex")],
                "15": [feat_item("Psychic Aura (40 ft.)", "Aura radius 40 ft.", "Su")],
                "17": [feat_item("Psychic Aura (45 ft.) & 5th-Lvl Powers", "Aura radius 45 ft.; unlock 5th-level powers.", "Su")],
                "18": [feat_item("Change Aura (Swift Action)", "Switch active aura as a swift action.", "Ex")],
                "19": [feat_item("Psychic Aura (50 ft.)", "Aura radius 50 ft.", "Su")],
                "20": [feat_item("Psychic Aura (Third Aura) & 6th-Lvl Powers", "Project three auras simultaneously; unlock 6th-level powers (62 base PP).", "Su")],
            },
            [b_stat(["fort", "ref", "will"], 0, "untyped", "Divine Grace (4th+): add positive Cha modifier to all saving throws.", mode="perVar", stat="cha"),
             b_pp(62, "Wild Talent (+2 PP) at 1st; class PP scales 0 (1st), 1-3 (2nd-4th), 4..62 (5th-20th), ML = 1/2 class level from 5th."),
             b_eff("Radiates up to 3 simultaneous Psychic Auras (5-50 ft.) plus 3 Mantles and 1st-6th level manifesting from 5th.")],
            max_level=20, hit_die="d10", bab="medium", saves={"fort": "high", "ref": "low", "will": "high"},
            proficiencies="All simple and martial weapons; all armor (light, medium, heavy); shields (except tower shields).",
            bonus_feat_levels=[1],
            modifiers=[{"target": "save.all", "value": 0, "formula": "this.classes['divine-mind']?.level >= 4 ? max(0, @abilities.cha.mod) : 0", "type": "untyped", "condition": "Divine Mind 4+"}],
            spellcasting={"type": "psionic", "ability": "wis", "spontaneous": True, "manifesterLevel": "1/2 class level (from 5th)", "powerPointsByLevel": dm_pp, "powersKnownByLevel": dm_known, "maxPowerLevelByLevel": dm_max_lvl, "spellsPerDay": {}, "spellsKnown": {}},
        ),
        upgrade(
            "cls-lurk", "Lurk", "Complete Psionic", 13,
            "Int-Based Psionic Infiltrator",
            "20-level d6 3/4-BAB psionic rogue combining Int-fueled 6th-level manifesting (127 PP), scalable Lurk Augments (up to 3 at once at 18th), Psionic Sneak Attack (+4d6), Evasion, and Slippery Mind.",
            {
                "1": [feat_item("Lurk Augment", "Imbue next melee attack (uses 3 + Int/day + augment PP) with effects like Additional Sneak Attack or Unfocusing Strike.", "Ex")],
                "2": [feat_item("Psionic Sneak Attack +1d6", "While psionically focused, deal +1d6 sneak attack damage.", "Ex")],
                "6": [feat_item("Initiative Boost", "Add Intelligence modifier on initiative checks.", "Ex")],
                "7": [feat_item("Psionic Sneak Attack +2d6", "Psionic sneak attack rises to +2d6.", "Ex")],
                "9": [feat_item("Evasion", "Take no damage on successful Reflex saves for half.", "Ex")],
                "10": [feat_item("Lurk Augment (Two at Once)", "Apply two different lurk augments to a single attack.", "Ex")],
                "12": [feat_item("Psionic Sneak Attack +3d6", "Psionic sneak attack rises to +3d6.", "Ex")],
                "15": [feat_item("Slippery Mind", "Attempt a second save 1 round later after failing a save vs. an enchantment.", "Ex")],
                "17": [feat_item("Psionic Sneak Attack +4d6", "Psionic sneak attack rises to +4d6.", "Ex")],
                "18": [feat_item("Lurk Augment (Three at Once)", "Apply up to three lurk augments simultaneously.", "Ex")],
            },
            [b_pp(127, "Base PP scales 1 to 127 + Int bonus PP; 1st-6th level powers (20 powers known)."),
             b_roll("damage", 4, 6, "sneak", "Psionic Sneak Attack (while focused): +1d6 (2nd) to +4d6 (17th)."),
             b_stat(["init"], 0, "untyped", "Initiative Boost (6th+): add Int modifier to initiative.", mode="perVar", stat="int"),
             b_def("evasion", "Evasion (9th+), Slippery Mind (15th+).")],
            max_level=20, hit_die="d6", bab="medium", saves={"fort": "low", "ref": "high", "will": "high"},
            proficiencies="All simple and martial weapons; light armor; shields (except tower shields).",
            modifiers=[{"target": "init", "value": 0, "formula": "this.classes.lurk?.level >= 6 ? max(0, @abilities.int.mod) : 0", "type": "untyped", "condition": "Lurk 6+"}],
            spellcasting={"type": "psionic", "ability": "int", "spontaneous": True, "powerPointsByLevel": lurk_pp, "powersKnownByLevel": lurk_known, "maxPowerLevelByLevel": lurk_max_lvl, "spellsPerDay": {}, "spellsKnown": {}},
        ),
        upgrade(
            "cls-erudite", "Erudite", "Complete Psionic", 153,
            "Scholarly Repertoire Psion Variant",
            "20-level d4 variant Psion learning unlimited powers into a personal repertoire (8h meditation + 20 XP/lvl) while limited to 1-11 Unique Powers per Day, plus Psicrystal Affinity and 5 bonus feats.",
            {
                "1": [feat_item("Psicrystal Affinity", "Gain Psicrystal Affinity as a bonus feat.", "Ex"),
                      feat_item("Bonus Feat", "Bonus psionic, metapsionic, or psionic item creation feat.", "Ex"),
                      feat_item("Powers Discovered & Unique Powers/Day", "Start with 2 + Int 1st-level psion/wilder powers; manifest 1 unique power/day (total casts capped only by PP).", "Ex")],
                "5": [feat_item("Bonus Feat", "Bonus psionic, metapsionic, or psionic item creation feat (3 unique powers/day, 3rd-lvl powers).", "Ex")],
                "10": [feat_item("Bonus Feat", "Bonus psionic, metapsionic, or psionic item creation feat (6 unique powers/day, 5th-lvl powers).", "Ex")],
                "15": [feat_item("Bonus Feat", "Bonus psionic, metapsionic, or psionic item creation feat (8 unique powers/day, 8th-lvl powers).", "Ex")],
                "20": [feat_item("Bonus Feat", "Bonus psionic, metapsionic, or psionic item creation feat (11 unique powers/day, 9th-lvl powers, 343 base PP).", "Ex")],
            },
            [b_pp(343, "Psion PP progression (2 to 343 + Int bonus PP), 1-11 Unique Powers/Day across 1st-9th level powers."),
             b_eff("Starts with Psicrystal Affinity + 5 bonus feats (1/5/10/15/20); gains 2 powers/level and can transcribe any psion/wilder or discipline-1 power via 8h meditation + 20 XP/erudite level.")],
            is_prestige=False, max_level=20, hit_die="d4", bab="low", saves={"fort": "low", "ref": "low", "will": "high"},
            skills_per_lvl=2,
            class_skills=["concentration", "craft_alchemy", "craft_armor", "craft_weapon", "decipher_script", "gather_information", "k_psionics", "k_arcana", "k_arch", "k_dungeon", "k_geo", "k_history", "k_local", "k_nature", "k_nobility", "k_religion", "k_planes", "profession", "psicraft"],
            prereqs=[],
            proficiencies="Club, dagger, heavy crossbow, light crossbow, quarterstaff, and shortspear; no armor or shield proficiency.",
            bonus_feat_levels=[1, 5, 10, 15, 20],
            spellcasting={"type": "psionic", "ability": "int", "spontaneous": True, "powerPointsByLevel": eru_pp, "uniquePowersPerDayByLevel": eru_unique, "maxPowerLevelByLevel": eru_max_lvl, "spellsPerDay": {}, "spellsKnown": {}},
        ),
        # --- Complete Psionic Prestige Classes (8) ---
        upgrade(
            "cls-anarchic-initiate", "Anarchic Initiate", "Complete Psionic", 17,
            "Chaotic Wild-Surge Psionic Prestige",
            "10-level full-manifesting (10/10) d6 chaotic PrC granting Chaotic Surge, Anarchic Grace, Wild Surge +1/+2, Psychic Enervation postponement, and Limbo Chaotic Breaches.",
            {
                "1": [feat_item("Chaotic Surge", "Powers deal fluctuating damage (+25% random spikes) or bonus effects; +1 manifesting.", "Su")],
                "2": [feat_item("Anarchic Grace", "Chance to warp space/time to avoid harmful attacks; +1 manifesting.", "Su")],
                "3": [feat_item("Wild Surge +1 & Psychic Enervation", "Gain/improve Wild Surge by +1 and gain Psychic Enervation.", "Su")],
                "4": [feat_item("Clarity of Confusion", "+2 insight bonus on saves vs. compulsions and [Lawful] effects.", "Su")],
                "6": [feat_item("Chaotic Breach, Minor", "Rip open a minor planar breach to Limbo; +1 manifesting.", "Su")],
                "7": [feat_item("Wild Surge +2", "Wild Surge bonus improves to +2.", "Su")],
                "8": [feat_item("Postpone Enervation", "Delay Psychic Enervation penalty; +1 manifesting.", "Su")],
                "10": [feat_item("Chaotic Breach, Complete", "1/day punch a full chaotic breach into Limbo (10/10 manifesting).", "Su")],
            },
            [b_eff("+10/10 manifesting progression; Wild Surge +1 (3rd) / +2 (7th), Chaotic Surge, +2 insight vs. compulsions/[Lawful] at 4th, and Limbo Breaches.")],
            is_prestige=True, max_level=10,
        ),
        upgrade(
            "cls-ebon-saint", "Ebon Saint", "Complete Psionic", 22,
            "Psionic Mind-Thief & Assassin",
            "5-level 4/5-manifesting d6 infiltrator PrC with Dire Strike (+Xd6/debuffs), Shadowfriend (+class level Hide/Move Silently while focused), Thought Theft, Mind Interrogation, and Steal Form.",
            {
                "1": [feat_item("Dire Strike", "Special strike following a successful feint/flank triggering Ebon Saint riders.", "Ex"),
                      feat_item("Shadowfriend", "While psionically focused, gain enhancement bonus equal to class level on Hide and Move Silently.", "Ex")],
                "2": [feat_item("Thought Theft & +1 Manifesting", "Extract imminent tactical/hazard knowledge from a Dire Strike target.", "Su")],
                "3": [feat_item("Mind Interrogation, Sneak Attack +1d6 & +1 Manifesting", "+1d6 sneak attack and telepathic fact extraction on Dire Strike.", "Su")],
                "4": [feat_item("Steal Form & +1 Manifesting", "Assume the exact physical appearance and surface identity of a Dire Strike victim.", "Su")],
                "5": [feat_item("Disappear from the Mind & +1 Manifesting", "Erase your presence from a victim's immediate perception right in front of them (4/5 manifesting).", "Su")],
            },
            [b_stat(["skill:hide", "skill:move_silently"], 1, "enhancement", "Shadowfriend: +class level enhancement to Hide and Move Silently while psionically focused.", mode="perVar", stat="classLevel", condition="psionically focused"),
             b_roll("damage", 1, 6, "sneak", "Sneak Attack +1d6 at 3rd level; 4/5 manifesting (2nd-5th).")],
            is_prestige=True, max_level=5,
        ),
        upgrade(
            "cls-ectopic-adept", "Ectopic Adept", "Complete Psionic", 26,
            "Astral Construct Sculptor Prestige",
            "5-level 4/5-manifesting d4 PrC granting Resilient Construct (+DR/HP), 2 bonus Ectopic Form feats (2nd/4th), Rapid Creation (standard action), and Double Creation (two constructs at once at 5th).",
            {
                "1": [feat_item("Resilient Construct", "Astral constructs you manifest gain improved resilience/defenses.", "Su")],
                "2": [feat_item("Ectopic Form (Bonus Feat) & +1 Manifesting", "Gain any Ectopic Form feat as a bonus feat.", "Ex")],
                "3": [feat_item("Rapid Creation & +1 Manifesting", "Manifest astral construct as a standard action a number of times/day equal to class level.", "Ex")],
                "4": [feat_item("Ectopic Form (Bonus Feat) & +1 Manifesting", "Gain a second bonus Ectopic Form feat.", "Ex")],
                "5": [feat_item("Double Creation & +1 Manifesting", "Maintain two separate astral constructs simultaneously (4/5 manifesting).", "Su")],
            },
            [b_eff("+4/5 manifesting (2nd-5th); 2 bonus Ectopic Form feats (2nd/4th), Rapid Creation standard-action astral construct (3rd), Double Creation (5th).")],
            is_prestige=True, max_level=5, bonus_feat_levels=[2, 4],
        ),
        upgrade(
            "cls-flayerspawn-psychic", "Flayerspawn Psychic", "Complete Psionic", 30,
            "Illithid-Blooded Mind Blast Prestige",
            "10-level 6/10-manifesting d6 PrC granting Mind Blast cone scaling from 15 ft. (1d4 stun, 1/day) up to 60 ft. (3d4 stun, 5/day) plus 3 bonus Illithid feats (2nd/4th/8th).",
            {
                "1": [feat_item("Illithid Blast (15-ft. Cone, Stun 1d4)", "Gain Illithid Blast feat; stun foes in 15-ft. cone for 1d4 rounds.", "Su")],
                "2": [feat_item("Illithid Feat & +1 Manifesting", "Gain a bonus Illithid feat you qualify for.", "Ex")],
                "3": [feat_item("Illithid Blast 2/day", "Use Illithid Blast twice per day.", "Su")],
                "4": [feat_item("Illithid Feat & +1 Manifesting", "Gain a bonus Illithid feat.", "Ex")],
                "5": [feat_item("Illithid Blast 3/day & +1 Manifesting", "Use Illithid Blast three times per day.", "Su")],
                "6": [feat_item("Illithid Blast (30-ft. Cone, Stun 2d4)", "Cone expands to 30 ft. and stuns for 2d4 rounds.", "Su")],
                "7": [feat_item("Illithid Blast 4/day & +1 Manifesting", "Use Illithid Blast four times per day.", "Su")],
                "8": [feat_item("Illithid Feat", "Gain a third bonus Illithid feat.", "Ex")],
                "9": [feat_item("Illithid Blast 5/day & +1 Manifesting", "Use Illithid Blast five times per day.", "Su")],
                "10": [feat_item("Illithid Blast (60-ft. Cone, Stun 3d4) & +1 Manifesting", "Cone expands to 60 ft. and stuns for 3d4 rounds (6/10 manifesting: 2,4,5,7,9,10).", "Su")],
            },
            [b_eff("+6/10 manifesting (2/4/5/7/9/10); Illithid Blast scaling 15->30->60 ft. (1d4->2d4->3d4 stun) up to 5/day; bonus Illithid feats at 2/4/8.")],
            is_prestige=True, max_level=10, bonus_feat_levels=[2, 4, 8],
        ),
        upgrade(
            "cls-illumine-soul", "Illumine Soul", "Complete Psionic", 33,
            "Positive-Energy Undead-Bane Soulknife",
            "5-level d10 Soulknife PrC stacking Improved Mind Blade & Psychic Strike, adding Positive Energy Conduit/Ray/Healing/Flare, 1-min Death Ward on focus expend, and permanent Undead Bane mind blade.",
            {
                "1": [feat_item("Positive Energy Conduit", "Psychic strike charges automatically with positive energy against undead.", "Su"),
                      feat_item("Improved Mind Blade & Psychic Strike", "Levels stack with soulknife for mind blade enhancement, abilities, and psychic strike.", "Ex")],
                "2": [feat_item("Positive Energy Ray", "Project a 60-ft. ranged touch positive energy ray from your mind blade vs. undead.", "Ps"),
                      feat_item("Death Ward", "Expend psionic focus to gain death ward protection for 1 minute.", "Ps")],
                "3": [feat_item("Undead Mind Bane", "Mind blade permanently gains the undead bane (+2/+2d6) special ability.", "Su")],
                "4": [feat_item("Positive Energy Healing", "1/day heal yourself with positive energy.", "Su")],
                "5": [feat_item("Positive Energy Flare", "Standard action + expend psionic focus: 30-ft. burst of positive energy damaging all undead.", "Ps")],
            },
            [b_eff("Stacks with Soulknife for mind blade/psychic strike; permanent Undead Bane at 3rd, Death Ward on focus expend (2nd), Positive Energy Ray/Healing/Flare.")],
            is_prestige=True, max_level=5,
            extra_notes="Complete Psionic Table 2-5 prints 5th-level Reflex save as +7 (errata/typo for +1 under low save progression).",
        ),
        upgrade(
            "cls-soulbow", "Soulbow", "Complete Psionic", 36,
            "Mind Arrow Archer Prestige",
            "10-level d10 PrC projecting free-action 1d8 Wis-damage composite-longbow Mind Arrows (up to +2 enhancement & +3 ranged abilities, Close Combat Shot, Phase Arrow) plus 5 ranged bonus feats.",
            {
                "1": [feat_item("Mind Arrow", "Free action: manifest 1d8 (crit x3, 110 ft.) semisolid mind arrows (uses Wis for damage) compatible with Rapid Shot/Manyshot.", "Su"),
                      feat_item("Bonus Feat (1st)", "Bonus ranged feat from the Soulbow list.", "Ex")],
                "2": [feat_item("Mind Arrow Enhancement (+1)", "Imbue mind arrows with +1 worth of ranged special abilities.", "Su")],
                "3": [feat_item("+1 Mind Arrow & Bonus Feat", "Mind arrows gain +1 enhancement bonus; gain bonus ranged feat.", "Su")],
                "4": [feat_item("Close Combat Shot", "Shoot mind arrows in threatened squares without provoking attacks of opportunity.", "Ex")],
                "5": [feat_item("Bonus Feat (5th)", "Gain a bonus ranged feat.", "Ex")],
                "6": [feat_item("Mind Arrow Enhancement (+2)", "Mind arrow special ability budget improves to +2.", "Su")],
                "7": [feat_item("+2 Mind Arrow & Bonus Feat", "Mind arrow enhancement rises to +2; gain bonus ranged feat.", "Su")],
                "8": [feat_item("Phase Arrow", "Full-attack action + expend psionic focus: fire one phase mind arrow ignoring cover/armor/wall barriers.", "Ps")],
                "9": [feat_item("Bonus Feat (9th)", "Gain a bonus ranged feat.", "Ex")],
                "10": [feat_item("Mind Arrow Enhancement (+3)", "Mind arrow special ability budget reaches +3 (stacks with soulknife).", "Su")],
            },
            [b_atk("ranged", "Mind Arrow", "1d8", "piercing", "Free-action psychic arrow (1d8, crit x3, 110 ft., adds Wis to damage); +1/+2 enhancement at 3rd/7th and +1/+2/+3 ranged qualities."),
             b_eff("5 bonus ranged feats (1/3/5/7/9), Close Combat Shot (4th), Phase Arrow (8th).")],
            is_prestige=True, max_level=10, bonus_feat_levels=[1, 3, 5, 7, 9],
        ),
        upgrade(
            "cls-storm-disciple", "Storm Disciple", "Complete Psionic", 40,
            "Tempestuous Full-BAB Psionic Warrior",
            "5-level full-BAB d10 3/5-manifesting PrC radiating an expanding Shocking Aura (5-15 ft.), Electricity Resistance 5-15, Stormwalker, and Thundering weapons at 5th.",
            {
                "1": [feat_item("Shocking Aura (5 ft.)", "Always-active 5-ft. aura dealing electricity damage (suppressible).", "Ex")],
                "2": [feat_item("Resistance to Electricity 5 & +1 Manifesting", "Gain Electricity Resistance 5.", "Ex")],
                "3": [feat_item("Shocking Aura (10 ft.), Stormwalker & +1 Manifesting", "Aura expands to 10 ft.; move unhindered through storms/wind.", "Ex")],
                "4": [feat_item("Resistance to Electricity 15 & +1 Manifesting", "Electricity Resistance rises to 15.", "Ex")],
                "5": [feat_item("Shocking Aura (15 ft.) & Thunderblade", "Aura reaches 15 ft.; wielded weapon gains the thundering special ability (3/5 manifesting: 2nd-4th).", "Su")],
            },
            [b_def("resist", "Electricity Resistance 5 (2nd), 15 (4th).", value="5-15", detail="electricity"),
             b_eff("Full BAB, +3/5 manifesting (2nd-4th), Shocking Aura 5/10/15 ft., Stormwalker (3rd), Thunderblade (5th).")],
            is_prestige=True, max_level=5,
        ),
        upgrade(
            "cls-zerth-cenobite", "Zerth Cenobite", "Complete Psionic", 43,
            "Temporal Monk-Psionic Prestige",
            "10-level d8 monk-stacking PrC (stacks unarmed damage, AC bonus, unarmored speed) with Psychic Warrior-list powers (up to 4th), Temporal Distillation extra actions, Backslip rerolls, Timeless Step, and Temporal Strike.",
            {
                "1": [feat_item("Monk Abilities", "Stack zerth cenobite levels with monk for unarmed damage, AC bonus, and unarmored speed.", "Ex"),
                      feat_item("Temporal Distillation (Move Action)", "1/day gain an extra move action on your turn (plus Wis-based 1st-level psychic warrior powers).", "Su")],
                "2": [feat_item("Backslip 1/day", "Immediate action 1/day: reroll one roll before success/failure is declared.", "Ps")],
                "3": [feat_item("Timeless Step", "Standard action 1/day: skip forward up to Wis mod rounds in time.", "Ps")],
                "4": [feat_item("Precognition 1/day", "1/day add +2 insight to an attack, damage, save, or skill check after rolling (unlocks 2nd-lvl powers).", "Ps")],
                "5": [feat_item("Temporal Distillation (Standard Action)", "Extra action from Temporal Distillation upgrades to a standard action.", "Su")],
                "6": [feat_item("Backslip 2/day", "Use Backslip twice per day.", "Ps")],
                "7": [feat_item("Precognition 2/day", "Use Precognition twice per day (unlocks 3rd-lvl powers).", "Ps")],
                "8": [feat_item("Temporal Strike", "1/day swift action after unarmed hit: knock foe forward through time (Will save).", "Ps")],
                "9": [feat_item("Precognitive Surge", "1/day add combined monk + zerth cenobite level (max +25) as insight bonus to one roll or AC.", "Ps")],
                "10": [feat_item("Temporal Distillation (Full-Round) & Timeless Body", "Extra full-round action via Temporal Distillation; 1/day become invulnerable in static time until end of next turn (4th-lvl powers).", "Ps")],
            },
            [b_pp(27, "Own psychic warrior-list manifesting: 1 to 27 base PP (+Wis), 1 to 5 powers known up to 4th level."),
             b_eff("Stacks with Monk (unarmed/AC/speed); grants Temporal Distillation (move->standard->full-round), Backslip 1-2/day, Timeless Step, Precognition, Temporal Strike, Precognitive Surge, Timeless Body.")],
            is_prestige=True, max_level=10,
            spellcasting={"type": "psionic", "ability": "wis", "spontaneous": True, "powerPointsByLevel": zc_pp, "powersKnownByLevel": zc_known, "maxPowerLevelByLevel": zc_max_lvl, "spellsPerDay": {}, "spellsKnown": {}},
        ),
    ]

    audit_notes = {
        "cls-soul-eater": "Already present in database/srd_classes_legacy.json (Book of Vile Darkness); Magic of Incarnum p.194 Souleater is a monster entry, not a prestige class.",
        "spinewyrm-rider": "Not present in Magic of Incarnum; MoI p.147 prestige class is Spinemeld Warrior (cls-spinemeld-warrior), upgraded in this patch.",
        "cls-illumine-soul": "Complete Psionic p.33 Table 2-5 contains a known book typo printing 5th-level Reflex save as +7 instead of +1 (low save progression).",
        "synad-multitask-enhanced": "Already present in database/srd_feats_splat.json (feat-synad-multitask-enhanced); Maenad Fury & Maenad Scream also present; only the 10 genuinely missing CPsi feats are emitted in newFeats.",
    }
    return classes, audit_notes


def build_patch_bundle() -> dict:
    classes, audit_notes = build_classes_patch()
    return {
        "schemaVersion": 3,
        "patchId": "incarnum-psionics-classes-feats-races-patch",
        "sources": ["Magic of Incarnum", "Complete Psionic"],
        "races": build_races(),
        "classes": classes,
        "featCategoryFixes": build_feat_fixes(),
        "newFeats": build_new_feats(),
        "auditNotes": audit_notes,
    }


def main() -> None:
    soulmelds = build_soulmelds()
    powers = build_powers()
    patch = build_patch_bundle()

    DB_DIR.mkdir(parents=True, exist_ok=True)
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)

    (DB_DIR / "srd_soulmelds_splat.json").write_text(json.dumps(soulmelds, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (DB_DIR / "srd_powers_splat.json").write_text(json.dumps(powers, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (EXPORT_DIR / "incarnum_psionics_classes_feats_races_patch.json").write_text(json.dumps(patch, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(
        f"Generated: soulmelds={len(soulmelds)}, powers={len(powers)}, "
        f"races={len(patch['races'])}, classes={len(patch['classes'])}, "
        f"featFixes={len(patch['featCategoryFixes'])}, newFeats={len(patch['newFeats'])}"
    )


if __name__ == "__main__":
    main()


