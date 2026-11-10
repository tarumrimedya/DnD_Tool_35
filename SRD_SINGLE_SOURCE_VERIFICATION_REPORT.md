# SRD Single-Source Verification Report

Checked 2026-11-10 against srd.dndtools.org (Ultimate SRD Project), on branch `claude/srd-verify-single-source-e1dbdd` (from `main` 8a2ffe1). The analysis sections below were written before any data change; the approved changes are listed at the end under "Applied changes".

## Method

- **Source pages (fetched once, cached outside the repo):** Feat Index `srd/tools/toolsFeatIndex.html` (1,917 rows: name, type, prerequisites, source book), Power Index `srd/tools/toolsPowerIndex.html` (463 rows), Book List `srd/meta/bookList.html`, and the 21 base-class pages that exist on the site for our records (`srd/classes/base*/...`).
- **Scope:** every record with `verification: "unverified"` in the feat and class files, and all 440 records of `srd_powers.json` (no `verification` field).
- **Feats:** matched by name (book-qualified aliases like "X (Player's Handbook II)" and suffixes like "Natural Trickster (Disguise Self)" reduced to the base name; "Improved X" also tried as "X, Improved"). Then the source book must be the same and the prerequisites must agree:
  - `match` = same text after normalising case and punctuation;
  - `equivalent` = different wording, but the same numbers and every feat the site links appears in our text (listed in Appendix A for spot checks);
  - `prerequisite conflict` = anything else (each one read and labelled by hand below).
- **Classes:** Hit Die and skill points from the class text; BAB progression from the level table (BAB at last level = level → good, ¾ → medium, ½ → poor); good/poor saves from the 1st-level row (+2 = good); max level = rows in the table.
- **Powers:** name (EPH style "X, Psionic", "X, Greater" also tried), discipline (record `category`; `Kin` read as Psychokinesis), and level per class for Psion, Wilder, Psychic Warrior and the six discipline lists.
- **Book column:** "in Kitap" = a PDF of that book is in `G:\Drive'ım\FRP\D&D\Kitap\`, so a conflict can be settled from the book.

## Summary

| File | Records | Match | Equivalent wording | Prerequisite conflict | Source-book conflict | Book on site, feat missing | Book not on site |
|---|---:|---:|---:|---:|---:|---:|---:|
| `database/srd_feats_splat.json` | 982 | 499 | 206 | 40 | 8 | 6 | 223 |
| `database/srd_feats_legacy.json` | 345 | 1 | 0 | 0 | 7 | 0 | 337 |
| `database/srd_feats_epic.json` | 23 | 5 | 0 | 0 | 2 | 7 | 9 |

| File | Records | Match | Conflict | Not on site |
|---|---:|---:|---:|---:|
| `database/srd_classes_splat.json` + `srd_classes_legacy.json` | 42 | 18 | 3 | 21 |
| `database/srd_powers.json` | 440 | 186 (64 of them only because discipline powers are also keyed under `Psion`) | 125 | 129 |

### Key findings

1. **711 feats** agree with the site (book + prerequisites) and can move to `cross-checked`.
2. **569 feats come from books the site does not cover** (Forgotten Realms, Eberron, Dragonlance, Ravenloft, 3.0 books such as Oriental Adventures, Savage Species, Book of Vile Darkness). The site cannot verify them; only the books can.
3. **40 prerequisite conflicts** in `srd_feats_splat.json`: 7 are site typos or garbled cells, 12 are wording only, 8 are cases where the site lists no prerequisite, and 13 are real value differences. Every one of these books is in Kitap, so the book can settle them.
4. **17 source-book conflicts**: the same feat name appears on the site under a different book (often a reprint, e.g. Book of Vile Darkness → Fiendish Codex I). These need a decision, not just a value fix.
5. **Classes:** 18 of 21 site-covered classes match; 3 conflict (Healer Hit Die, Shaman Fortitude, Mariner source book). 21 classes (12 Unearthed Arcana racial paragons, 4 City of Splendors: Waterdeep, 4 Player's Companion, Oriental Adventures Samurai) are not on the site.
6. **Powers: `srd_powers.json` is not a clean 3.5 XPH list.** 129 records are not in the site's power index; their names and levels (Astral Construct I–IX, Bite of the Tiger, Lesser Concussion, Charm Person, Domination, Psion-only lists) match the 3.0 *Psionics Handbook*, not the 3.5 *Expanded Psionics Handbook*. Several 3.0 records also carry an EPH name ("Teleport", "Fly", "Plane Shift") with 3.0 levels; they show up as level conflicts. 100 records have a different discipline. This is larger than a verification pass: it needs a decision on whether to drop the 3.0 records and rebuild the file from the EPH.
7. **Data defects found along the way:** "Persistant Refusal" (typo for Persistent Refusal, Fiendish Codex II); 67 powers have `category: "Kin"` instead of "Psychokinesis"; two classes are still named "Shadowcaster (NOT IMPLEMENTED)" and "Truenamer (NOT IMPLEMENTED)" (their stats match the site).

## Feats

### `database/srd_feats_splat.json`

#### Prerequisite conflicts

| Feat | Book (in Kitap) | Kind | Record | Site | Note |
|---|---|---|---|---|---|
| Melee Weapon Mastery | Player's Handbook II p.81 (yes) | site typo | Proficient with selected weapon, Weapon Focus with selected weapon, Weapon Specialization with selected weapon, base attack bonus +8 | Proficiency with selected weapon. Weapon Focus with selected weapon, Weapon Specialization with selected weapon, base attack bonus 48. | Site reads "base attack bonus 48"; same prerequisites otherwise. |
| Ranged Weapon Mastery | Player's Handbook II p.82 (yes) | site typo | Proficiency with selected weapon, Weapon Focus with selected weapon, Weapon Specialization with selected weapon, Base attack bonus +8 | Proficiency with selected weapon. Weapon Focus with selected weapon, Weapon Specialization with selected weapon, base attack bonus +3. | Site reads BAB +3; record has +8 (same as Melee Weapon Mastery). Book check. |
| Arterial Strike | Complete Warrior p.96 (yes) | wording | BAB +4, Sneak Attack +1d6 | Sneak attack ability, base attack bonus +4. | Sneak Attack +1d6 vs "sneak attack ability"; same rule. |
| Spontaneous Wounder | Complete Divine p.85 (yes) | value | Knowledge (religion) 4 ranks, nongood | Wis 13, Knowledge (religion) 4 ranks, nongood alignment, able to cast any inflict wounds spell. | Site adds Wis 13 and "able to cast any inflict wounds spell". |
| Sacred Healing | Complete Divine p.84 (yes) | site garbled + wording | Heal 8 ranks, ability to turn/rebuke undead | Heal 8 ranks, ability to turn undead.73 | Site "turn undead.73" (page number leaked); record says turn/rebuke. Book check. |
| Sanctify Relic | Complete Divine p.84 (yes) | value | Any other item creation feat, caster level 7th | Any other item creation feat. | Record adds caster level 7th. |
| Appraise Magic Value | Complete Adventurer p.103 (yes) | site has no prerequisite | Appraise 5 ranks, Knowledge (Arcana) 5 ranks, Spellcraft 5 ranks | - | Site lists "-"; record has 3 skill prerequisites. |
| Devoted Tracker | Complete Adventurer p.108 (yes) | site has no prerequisite | Track, smite evil, wild empathy | - | Site lists "-". |
| Dive for Cover | Complete Adventurer p.108 (yes) | site has no prerequisite | Base Ref +4 | - | Site lists "-". |
| Hear the Unseen | Complete Adventurer p.110 (yes) | site has no prerequisite | Listen 5 ranks, Blind-fight | - | Site lists "-". |
| Natural Bond | Complete Adventurer p.111 (yes) | site has no prerequisite | Animal companion | - | Site lists "-". |
| Obscure Lore | Complete Adventurer p.111 (yes) | site has no prerequisite | Bardic Knowledge or lore class feature | - | Site lists "-". |
| Dire Stun | Complete Psionic p.49 (yes) | wording | Lurk Augment, Extra Lurk Augment | Lurk augment class feature (page 14), Extra Lurk Augment. | Same prerequisites, site adds a page reference. |
| Psionic Mastery | Complete Psionic p.59 (yes) | site garbled | Able to manifest powers or use psi-like abilities | Ability to manifest psionic powers or use psi-like abilities. Benefits: You can take 10 on manifester level checks (as if the manifester level check were a skill check). | Site cell also contains the Benefit text; prerequisite identical. |
| Metamagic Spell Trigger | Complete Mage p.45 (yes) | wording | Any metamagic feat, Use Magic Device or Spellcraft 15 ranks | Any metamagic feat, Use Magic Device 15 ranks or Spellcraft 15 ranks. | Same rule. |
| Borne Aloft | Complete Mage p.40 (yes) | site garbled | Ability to cast 5th-level spells | Ability to cast 5th-level spells.77 | Site "5th-level spells.77" (page number leaked); otherwise identical. |
| Battlecaster Defense | Complete Mage p.39 (yes) | value | Combat Casting or warmage edge, base attack bonus +1, Spellcraft 4 ranks | Combat Casting, base attack bonus +1, caster level 1st. | Record: Combat Casting or warmage edge, Spellcraft 4 ranks; site: Combat Casting, caster level 1st. |
| Spontaneous Domains | Complete Champion p.62 (yes) | wording | Ability to cast 3rd level spells; access to 2 or more domains | Ability to cast 3rd-level spells, access to two or more cleric domains. | Same rule. |
| Retrieve Spell | Complete Champion p.62 (yes) | wording | Any 2 divine feats, ability to turn or rebuke undead | Any two divine feats, ability to turn or rebuke undead. | Same rule. |
| Imbued Healing | Complete Champion p.60 (yes) | wording | Ability to cast Conjuration (healing) spells, access to 1 or more domains | Ability to cast conjuration (healing) spells; access to one or more domains. | Same rule. |
| Umbral Shroud | Complete Champion p.63 (yes) | value | Ability to cast 3rd level spells; access to 2 or more domains | Ability to cast 3rd-level spells. | Record adds "access to 2 or more domains". |
| Moradin's Smile | Races of Stone p.142 (yes) | value | None | Dwarf. | Record None; site Dwarf. |
| Earth Power | Races of Stone p.138 (yes) | value | Earth Sense | Con 13, Wis 13, Earth Sense. | Site adds Con 13, Wis 13. |
| Able Learner | Races of Destiny p.150 (yes) | wording | Human or doppelganger, must take at 1st level | Human or doppelganger. | Record adds "must take at 1st level" (from the feat's Special line). |
| Diverse Background | Races of Destiny p.156 (yes) | wording | Half-human, must take at 1st level | Half-human. | Record adds "must take at 1st level" (from the feat's Special line). |
| Scorpion's Grasp | Sandstorm p.52 (yes) | value | Str 13, Dex 13, Improved Unarmed Strike, Improved Grapple | Str 13, Improved Unarmed Strike, Improved Grapple. | Record adds Dex 13. |
| Touchstone | Sandstorm p.53 (yes) | value | Knowledge (local) 8 ranks or native 250 gp item | Knowledge (local) 8 ranks, or possession of a touchstone key | Record: "native 250 gp item"; site: "possession of a touchstone key". |
| Improved Cohort | Heroes of Battle p.98 (yes) | site garbled | Cha 15, Leadership | Cha 15, Leadership.289 | Site "Leadership.289" (page number leaked); otherwise identical. |
| Spirit Sense | Heroes of Horror p.124 (yes) | wording | Wis 12, near-death experience | Wisdom 12, must have had a near-death experience (that is, must have fallen below 0 hit points). | Same rule. |
| Bind Vestige | Tome of Magic p.72 (yes) | site has no prerequisite | If you can bind vestiges through other means you cannot take this feat. | - | Record text is a Special line, not a prerequisite; site "-" is probably right. |
| Bonus Essentia | Magic of Incarnum p.35 (yes) | value | Con 13, Character level 13th | Con 13, character level 6th. | Character level 13th (record) vs 6th (site). |
| Necrocarnum Acolyte | Magic of Incarnum p.39 (yes) | site garbled | Ability to shape soulmelds, non-good alignment | Ability to shape soulmelds, nongood alignment. Benefits: You can shape soulmelds with the necrocarnum descriptor regardless of your alignment. You gain a +1 profane bonus on the save DCs of your necrocarnum soulmelds. | Site cell also contains the Benefit text; prerequisite identical. |
| Planar Touchstone | Planar Handbook p.41 (yes) | wording | Knowledge (the planes) 8 ranks, object from touchstone site | Portable object of at least 250 gp value native to any designated planar touchstone site, Knowledge (the planes) 8 ranks. | Same rule (record abbreviates the 250 gp object). |
| Personal Touchstone | Planar Handbook p.41 (yes) | wording | Planar Touchstone, Knowledge (the planes) 8 ranks, object from planar touchstone site | Planar Touchstone, a portable object of at least 250 gp value native to a chosen planar touchstone plane, Knowledge (the planes) 8 ranks. | Same rule (record abbreviates the 250 gp object). |
| Hands of a Healer | Book of Exalted Deeds p.43 (yes) | site has no prerequisite | Cha 13, lay on hands class ability | - | Site lists "-". |
| Spreading Breath | Draconomicon p.74 (yes) | value | Con 13, Breath weapon, Shape Breath,  size Small or larger | Con 15, breath weapon, Shape Breath, size Small or larger. | Con 13 (record) vs Con 15 (site). |
| Endure Blows | Draconomicon p.70 (yes) | value | Con 13, dragon type, Toughness | Con 19, dragon type, Toughness. | Con 13 (record) vs Con 19 (site). |
| Improved Rapidstrike | Draconomicon p.70 (yes) | value | BAB +15, Rapidstrike | Dex 9, one or more pairs of natural weapons, aberration, dragon, elemental, magical beast, or plant type, base attack bonus +15, Rapidstrike. | Site adds Dex 9, natural weapon pairs, creature types. |
| Lifebond | Libris Mortis p.28 (yes) | value | Cha 13, undead type | Cha 11, undead type. | Cha 13 (record) vs Cha 11 (site). |
| Ocular Spell | Lords of Madness p.181 (yes) | wording | Knowledge (dungeoneering) 4 ranks, 2 or more eyes. | Knowledge (dungeoneering) 4 ranks, two or more eyes. | "2 or more" vs "two or more". |

#### Source-book conflicts (same name, different book on the site)

| Feat | Record source (in Kitap) | Site book(s) and prerequisites |
|---|---|---|
| Shifter Defense | Eberron Campaign Setting p.60 (no) | Monster Manual III: Shifter, two other shifter feats. |
| Gestalt Anchor | Races of Eberron p.112 (yes) | Complete Psionic: Any host feat or kalashtar, base Will save +3. |
| Spiritual Force | Races of Eberron p.113 (yes) | Complete Psionic: Any other host feat, mind blade class feature. |
| Strength of Two | Races of Eberron p.113 (yes) | Complete Psionic: Any other host feat. |
| Adamantine Body | Races of Eberron p.118 (yes) | Monster Manual III: Warforged, 1st level only. |
| Aberration Banemagic | Player's Guide to Eberron p.86 (no) | Lords of Madness: - |
| Dorje Mastery | Magic of Eberron p.46 (no) | Complete Psionic: Craft Dorje, manifester level 9th. |
| Graft Flesh | Lords of Madness p.216 (yes) | Libris Mortis: Heal 10 ranks. |

#### Not on the site although the site covers the book

| Feat | Record source (in Kitap) | Note |
|---|---|---|
| Pious Defense | Complete Divine p.86 (yes) | Site feat index has no entry. |
| Pious Soul | Complete Divine p.86 (yes) | Site feat index has no entry. |
| Pious Spellsurge | Complete Divine p.87 (yes) | Site feat index has no entry. |
| Elemental Adapt | Complete Mage p.42 (yes) | Site feat index has no entry. |
| Extend Spreading Breath | Draconomicon p.70 (yes) | Site has Spreading Breath only. |
| Persistant Refusal | Fiendish Codex II p.85 (yes) | Site has "Persistent Refusal": our name is misspelled. |

#### Not on the site: book not covered by the site

| Book (in Kitap) | Count | Feats |
|---|---:|---|
| Champions of Ruin (no) | 39 | Bloodsoaked Intimidate, Chakram Ricochet, Craven, Demonsworn Knight, Dire Flail Smash, Dirty Rat, Doomspeak, Entangling Spell, Evil Embraced, Feral Animal Companion, Flay Foe, Hellbound Knight, Improved Fiendish Servant, Initiate of Ghaunadaur, Initiate of Gruumsh, Initiate of Kossuth, Initiate of Loviatar, Initiate of Varae, Lingering Spell, Malign Spell Focus, Metanode Spell, Mortifying Attack, Mutilator, Natural Bully, Node Defense, Node Sensitive, Node Spellcasting, Node Store, Profane Outburst, Pulverize Foe, Reaping Spell, Scion of Sorrow, Shadowform Familiar, Shadowstrike, Skewer Foe, Snatch Trophy, Tormented Knight, Touch of Benevolence, Via Negativa |
| Champions of Valor (no) | 29 | Broken One's Sacrifice, Caramendine Monk, Defender of the Homeland, Detect Shadow Weave User, Druuth Slayer, Duerran Metaform Training, Duerran Stealth Training, From Smite to Song, Initiate of Anhur, Initiate of Arvoreen, Initiate of Baravar Cloakshadow, Initiate of Eilistraee, Initiate of Horus-re, Initiate of Milil, Initiate of Nobanion, Initiate of Torm, Initiate of Tymora, Initiate of the Holy Realm, Knight of Tyr's Merciful Sword, Knight of the Red Falcon, Knight of the Risen Scepter, Mark of the Triad, Overcome Shadow Weave, Paladin of the Noble Heart, Silver Blood, Silver Fang, Smiting Power, Sun Soul Monk, Sword of the Arcane Order |
| City of Splendors: Waterdeep (no) | 6 | Dungeoneer's Intuition, Hand of Tyr, Initiate of Shar, Jester's Magic, Lunar Magic, Veil of Cyric |
| Dragonlance Campaign Setting (no) | 13 | Cornered Rat, Draconian Breath Weapon, Flyby Breath, Honor-Bound, Hulking Brute, Improved Draconian Breath Weapon, Improved Resist Dragonfear, Reserves of Strength, Resist Dragonfear, Spear of Doom, Spectacular Death Throes, Strafing Breath, Tremendous Charge |
| Eberron Campaign Setting (no) | 13 | Aberrant Dragonmark, Action Boost, Attune Magic Weapon, Beast Shape, Double Steel Strike, Greater Shifter Defense, Heroic Spirit, Improved Damage Reduction, Knight Training, Recognize Impostor, Serpent Strike, Soothe the Beast, Totem Companion |
| Magic of Eberron (no) | 31 | Augment Elemental, Cull Wand Essence, Deathless Fleshgrafter, Dragon Prophesier, Dragon Totem Focus, Dragon Totem Lorekeeper, Dragon Totem Scion, Eldeen Plantgrafter, Elemental Grafter, Elemental Helmsman, Elemental Smite, Etch Schema, Heroic Companion, Heroic Focus, Improved Homunculus, Prophecy's Artifex, Prophecy's Explorer, Prophecy's Hero, Prophecy's Mind, Prophecy's Shaper, Prophecy's Shepherd, Prophecy's Slayer, Psiforged Body, Psionic Luck, Psychic Rush, Quicken Dragonmark (Greater), Quicken Dragonmark (Least), Quicken Dragonmark (Lesser), Rapid Infusion, Symbiont Mastery, Wand Surge |
| Player's Guide to Eberron (no) | 27 | Battlebred, Binding Brand, Chosen of the Deathless, Death's Blood, Dragon's Insight, Du'ulora Ancestor, Hashalaq Ancestor, Indomitable Discipline, Manifest Druid, Mastery of Chaos and Order, Mastery of Day and Night, Mastery of Dreams, Mastery of Faerie Enchantment, Mastery of Ice and Fire, Mastery of Madness, Mastery of Twilight Denizens, Mastery of Twisted Shadow, Mastery of the Azure Sky, Mastery of the Battleground, Mastery of the Dead, Mastery of the Mists, Mastery of the Silver Void, Shield of Blades, Shield of Denieth, Spirit of the Stallion, Unnatural Enemy, Valenar Trample |
| Player's Guide to Faerun (yes) | 18 | Arcane Schooling, Blessed of the Seven Sisters, Blooded, Discipline, Favored of the Zulkirs, Foe Hunter, Gift of Discernment, Knifefighter, Lliira's Blessing, Otherworldly, Saddleback, Shadow Weave Magic, Snake Blood, Spellcasting Prodigy (Cha), Spellcasting Prodigy (Int), Spellcasting Prodigy (Wis), Spider Bite, Touch of Hate |
| Races of Eberron (yes) | 11 | Aerenal Beastmaster, Brute Fighting, Dancing with Shadows, Daylight Adaptation, Heroic Metamagic, Kalashtar Thoughtshifter, Master Linguist, Path of Shadows, Ragewild Fighting, Shield of Thought, Soulblade Warrior |
| Secrets of Sarlona (no) | 26 | Ascetic Psion, Breath Control, Dream Scion, Dream of Contact, Dream of Insight, Dream of Instinct, Dream of Perception, Dream of Strength, Dream of the Moment, Edgewalker Sentinel, Flying Tiger, Gestalt Might, Hazing Strike, Insidious Terror, Kalashtar Mindlink, Mind Mask, Monk's Spade Mind Blade, Mountain Stance, Pole Master, Psychic Warfare, Quori Dread, Repel Outsider, Stone Breaker, Stunning Master, Tashalatora, Wind and Fire |
| Secrets of Xen'drik (no) | 10 | Blessed of Vulkoor, Drow Scorpion Warrior, Drow Skirmisher, Earthquake Stomp, Echoing Spell, Elder Giant Magic, Giant Banemagic, Jungle Veteran, Mysterious Magic, Rending Claws |

### `database/srd_feats_legacy.json`

#### Source-book conflicts (same name, different book on the site)

| Feat | Record source (in Kitap) | Site book(s) and prerequisites |
|---|---|---|
| Dark Speech | Book of Vile Darkness p.48 (yes) | Fiendish Codex I: Will save bonus +5, Int 15, Cha 15. |
| Evil Brand | Book of Vile Darkness p.49 (yes) | Fiendish Codex I: - |
| Thrall To Demon | Book of Vile Darkness p.50 (yes) | Fiendish Codex I: Chaotic evil alignment. |
| Verminfriend | Book of Vile Darkness p.50 (yes) | Drow of the Underdark: Drow. |
| Willing Deformity | Book of Vile Darkness p.50 (yes) | Heroes of Horror: Evil alignment. |
| Cool Head | Oriental Adventures p.61 (yes) | Complete Scoundrel: Any two mental skill tricks. |
| Sea Legs | Oriental Adventures p.65 (yes) | Frostburn: - / Stormwrack: - |

#### Not on the site: book not covered by the site

| Book (in Kitap) | Count | Feats |
|---|---:|---|
| Age of Mortals (no) | 18 | Charming, Discipline, Education, Haggler, Heroic Surge, Horned Stampede, Improved Leech Item, Improved Taunt, Leech Item, Lucky, Mimic, Quick Leech, Quick-Thinking, Sharp-Eyed, Spellcasting Prodigy, Street Smart, Stubborn, Trustworthy |
| Book of Vile Darkness (yes) | 17 | Boost Spell Resistance, Boost Spell-like Ability, Corrupt Spell-like Ability, Deformity (Clawed Hands), Deformity (Eyes), Deformity (Face), Deformity (Gaunt), Deformity (Obese), Disciple Of Darkness, Lich Loved, Poison Immunity, Sacrificial Mastery, Vile Ki Strike, Vile Martial Strike, Vile Natural Attack, Violate Spell, Violate Spell-like Ability |
| Champions of Darkness (no) | 31 | Brawler, Darkness Within, Deadly Presence, Death's Favor, Deathly Pallor, Dirge of Woe, Dispassionate Dread Companion, Energy Drain, Equestrian, Ethereal Touch, Extra Domain, Extra Wounds, Feral Rearing, Hearthlore, Hollow, Life-force Sacrifice, Machiavellian, Mechanical Aptitude, Mesmerizing, Mimicry, Piercing Gaze, Second Sight, Shadow Affinity, Skeletal Dread Companion, Skywise, Tantric Ability, Target Vulnerable Spot, Tarokka Natural, Unseen Sensor, Unwholesome Ichor, Vampiric Regeneration |
| Heroes of Light (no) | 20 | Beastial Conscience, Blessed, Conscience, Dabbler, Detect Virtue, Eidetic Memory, Heroism, Hope, Kiss of Dawn, Knowledgeable, Library, Literacy, Resolute, Sanctity, Sanity, Secret Society, Test of Virtue, Unicorn's Fellowship, University Education, Wealth |
| Magic of Faerun (yes) | 3 | Attune Gem, Spell Girding, Spellfire Wielder |
| Oriental Adventures (yes) | 52 | Art of Fascination, Artist, Attention to Detail, Blood Sorcerer, Born Duelist, Choke Hold, Craft Crystal Weapon, Craft Talisman, Discipline, Falling Star Strike, Fearsome and Fearless, Gifted General, Grappling Block, Great Crafter, Great Diplomat, Great Stamina, Great Teamwork, Great Throw, Honest Merchant, Iaijutsu Master, Improved Aid, Kami's Intuition, Karmic Twin, Keen Intellect, Lion Spy, Luck of Heroes, Magic in the Blood, Magical Artisan, Magistrate's Mind, Many Masks, Nezumi Scent, Oni's Bane, Power Attack - Iaijutsu, Power Attack - Shadowlands, Powerful Voice, Resist Poison, Resist Taint, Saddleback, Scholar of Nature, Silver Tongue, Smooth Talk, Soul of Honor, Soul of Loyalty, Soul of Sincerity, Spell Power, Spellcaster Support, Strength of the Charger, Strength of the Crab, Strong Soul, Unbalancing Strike, Warrior Instinct, Warrior Shugenja |
| Player's Companion (no) | 24 | Adrenaline Rush, Choke, Conviction of Ideals, Endure Deprivation, Enhanced Combat Reflexes, Even Breathing, Favored Enemy Critical Strike, Feast Upon My Enemy, Half-Armored Fighting, Improved Concentration, Influence, Interposition, Lunging Thrust, Mad Dash, Man of the People, Mechanical Mindedness, Phalanx, Shield Huddle, Subvocalization, Title, Two Shields, Unarmed Throw, Victual Magic, Weather Sense |
| Races of Faerun (yes) | 69 | Aftersight, Ancestral Spirit, Arachnid Rider, Arctic Adaptation, Azerblood, Batrider, Blood of The Warlord, Calishite Elementalist, Caravanner, Celestial Bloodline, Chondathan Missionary, Deepening Darkness, Disentangler, Drow Eyes, Duergar Mindshaper, Eldritch Linguist, Elemental Bloodline, Enervative Healing, Eyes Of Light, Fiendish Bloodline, Forest Gnome Phantasist, Genie Lore, Gift Of Tongues, Gold Dwarf Dweomersmith, Grim Visage, Hammer Fist, Harem Trained, Headlong Rush, Healing Flames, Hin Wandermage, Improved Energy Resistance, Improved Levitation, Improved Low Blow, Infernal Bargainer, Iron Mind, Jotunbrud, Jungle Stamina, Light To Daylight, Lightbringer, Lolth's Blessing, Low Blow, Metallurgy, Might Makes Right, Nobody's Fool, Oral History, Outsider Wings, Plague Resistant, Planetouched Animal Affinity, Reckless Offensive, Rock Gnome Trickster, Runesmith, Sacred Tattoo, Shadow Shield, Shadow Song, Shield Dwarf Warder, Skyrider, Southern Magician, Spell-like Ability Focus, Spire Walking, Stone Colossus, Stone Slide, Stoneblood, Stoneshaper, Stonewalker Fist, Summon Earth Elemental, Svirfneblin Figment Master, Talfirian Song, Tattoo Magic, Theocrat |
| Ravenloft (no) | 13 | Back to the Wall, Cold One, Courage, Dead Man Walking, Ethereal Empathy, Ghostsight, Haunted, Jaded, Lunatic, Open Mind, Redhead, Reincarnated, Voice of Wrath |
| Savage Species (yes) | 59 | Area Attack, Assume Supernatural Ability, Blowhard, Bonus Breath, Controlled Respiration, Crush, Cumbrous Dodge, Cumbrous Fortitude, Cumbrous Reflexes, Cumbrous Will, Deadly Poison, Deep Denizen, Desert Dweller, Detach, Dust Cloud, Extended Reach, Extra Item Space, Final Strike, Gape Of The Serpent, Grass Trekker, Great Flyby Attack, Greater Mighty Roar, Greater Multigrab, Improved Assume Supernatural Ability, Improved Scent, Improved Web, Inured To Energy, Involuntary Rage, Irresistible Gaze, Mighty Leaping, Mighty Roar, Multigrab, Multitasking, Multivoice, Narrowed Gaze, Pain Mastery, Peak Hopper, Pervasive Gaze, Piercing Gaze, Poison Immunity, Poison Resistance, Prehensile Tail, Quick Change, Rapid Breath, Rending Constriction, Reverberation, Roll With It, Scramble, Stamp, Supernatural Transformation, Surrogate Spellcasting, Swamp Stalker, Thick-skinned, Thunderclap, Treefriend, Uncanny Scent, Vicious Wound, Virulent Poison, Winter's Child |
| Underdark (no) | 3 | Caver, Enhanced Adhesive, Graft Illithid Flesh |
| Van Richten's Arsenal (no) | 28 | Alchemical Homunculus, Ancestral Legacy, Corporeal Purgative, Corporeal Purifier, Emotional Purgative, Enlightened Child, Essential Coagulant, Hexbreaker, Holistic Purifier, Indomitable, Innocence Coagulant, Logical Mind, Memory Coagulant, Muse, Nine Lives, Philosophical Child, Philosophical Purifier, Portents, Quintessence, Regenerative Salve, Scent of the Grave, Smitten, Spirit of Light, Spiritual Purgative, Sworn Enemy, Tissue Regenerator, Unseen, Warding Gesture |

### `database/srd_feats_epic.json`

#### Source-book conflicts (same name, different book on the site)

| Feat | Record source (in Kitap) | Site book(s) and prerequisites |
|---|---|---|
| Improved Skirmish | Complete Adventurer p.192 (yes) | Complete Scoundrel: Skirmish +2d6/+1 AC. |
| Axiomatic Strike | Player's Guide to Faerun p.135 (yes) | Complete Warrior: Ki strike (lawful), Stunning Fist. |

#### Not on the site although the site covers the book

| Feat | Record source (in Kitap) | Note |
|---|---|---|
| Combat Insight | Complete Warrior p.151 (yes) | Site feat index has no entry; the site does not index non-ELH epic feats. |
| Epic Combat Expertise | Complete Warrior p.151 (yes) | Site feat index has no entry; the site does not index non-ELH epic feats. |
| Epic Sunder | Complete Warrior p.151 (yes) | Site feat index has no entry; the site does not index non-ELH epic feats. |
| Wield Oversized Weapon | Complete Warrior p.153 (yes) | Site feat index has no entry; the site does not index non-ELH epic feats. |
| Epic Devotion | Complete Divine p.89 (yes) | Site feat index has no entry; the site does not index non-ELH epic feats. |
| Improved Sudden Strike | Complete Adventurer p.192 (yes) | Site feat index has no entry; the site does not index non-ELH epic feats. |
| Legendary Acrobat | Complete Adventurer p.192 (yes) | Site feat index has no entry; the site does not index non-ELH epic feats. |

#### Not on the site: book not covered by the site

| Book (in Kitap) | Count | Feats |
|---|---:|---|
| Player's Guide to Faerun (yes) | 9 | Chosen Weapon Specialization, Divine Spell Penetration, Enhance Effect, Epic Counterspell, Epic Spellfire Wielder, Improved Cooperative Metamagic, Improved Snatch Spell, Improved Spellpool Access, Inscribe Epic Rune |

## Classes

### Conflicts

| Class | Field | Record | Site | Book in Kitap |
|---|---|---|---|---|
| Healer | hitDie | d8 | d6 | no |
| Mariner | book | Age of Mortals | Dragonlance Campaign Setting | no / no |
| Shaman | fort | poor | good (table: 1st-level saves +2/+0/+2) | yes |

### Match (Hit Die, BAB, saves, skill points, max level, book all agree)

Archivist (Heroes of Horror); Ardent (Complete Psionic); Artificer (Eberron Campaign Setting); Binder (Tome of Magic); Divine Mind (Complete Psionic); Dragonfire Adept (Dragon Magic); Incarnate (Magic of Incarnum); Lurk (Complete Psionic); Mystic (Dragonlance Campaign Setting); Noble (Dragonlance Campaign Setting); Shadowcaster (NOT IMPLEMENTED) (Tome of Magic); Shugenja (Complete Divine); Soulborn (Magic of Incarnum); Spirit Shaman (Complete Divine); Totemist (Magic of Incarnum); Truenamer (NOT IMPLEMENTED) (Tome of Magic); Wu Jen (Complete Arcane); Sohei (Oriental Adventures).

### Not on the site

| Class | File | Book (in Kitap) | Record values |
|---|---|---|---|
| Cloistered Cleric | classes_splat | Unearthed Arcana (yes) | d6, BAB low, Fort good/Ref poor/Will good, 6+Int, 20 levels |
| Drow Paragon | classes_splat | Unearthed Arcana (yes) | d6, BAB medium, Fort poor/Ref good/Will poor, 4+Int, 3 levels |
| Dwarf Paragon | classes_splat | Unearthed Arcana (yes) | d10, BAB high, Fort good/Ref poor/Will poor, 2+Int, 3 levels |
| Elf Paragon | classes_splat | Unearthed Arcana (yes) | d8, BAB medium, Fort poor/Ref good/Will poor, 2+Int, 3 levels |
| Gnome Paragon | classes_splat | Unearthed Arcana (yes) | d6, BAB medium, Fort good/Ref poor/Will good, 4+Int, 3 levels |
| Gray Hand Enforcer | classes_splat | City of Splendors: Waterdeep (no) | d10, BAB high, Fort good/Ref poor/Will poor, 2+Int, 20 levels |
| Half-Dragon Paragon | classes_splat | Unearthed Arcana (yes) | d12, BAB high, Fort good/Ref poor/Will good, 4+Int, 3 levels |
| Half-Elf Paragon | classes_splat | Unearthed Arcana (yes) | d8, BAB medium, Fort poor/Ref good/Will poor, 4+Int, 3 levels |
| Half-Orc Paragon | classes_splat | Unearthed Arcana (yes) | d8, BAB high, Fort good/Ref poor/Will poor, 4+Int, 3 levels |
| Halfling Paragon | classes_splat | Unearthed Arcana (yes) | d6, BAB medium, Fort poor/Ref good/Will poor, 4+Int, 3 levels |
| Human Paragon | classes_splat | Unearthed Arcana (yes) | d8, BAB medium, Fort poor/Ref poor/Will good, 4+Int, 3 levels |
| Knight of the Blue Moon | classes_splat | City of Splendors: Waterdeep (no) | d8, BAB medium, Fort good/Ref poor/Will good, 2+Int, 20 levels |
| Moonstar Agent | classes_splat | City of Splendors: Waterdeep (no) | d6, BAB medium, Fort poor/Ref good/Will good, 4+Int, 20 levels |
| Orc Paragon | classes_splat | Unearthed Arcana (yes) | d10, BAB high, Fort good/Ref poor/Will poor, 2+Int, 3 levels |
| Sun Soul Monk | classes_splat | City of Splendors: Waterdeep (no) | d8, BAB medium, Fort poor/Ref good/Will good, 4+Int, 20 levels |
| Tiefling Paragon | classes_splat | Unearthed Arcana (yes) | d8, BAB medium, Fort good/Ref good/Will good, 4+Int, 3 levels |
| Exemplar (Player's Companion) | classes_legacy | Player's Companion (no) | d10, BAB high, Fort good/Ref good/Will poor, 4+Int, 20 levels |
| Friar | classes_legacy | Player's Companion (no) | d8, BAB medium, Fort good/Ref poor/Will good, 2+Int, 20 levels |
| Inventor | classes_legacy | Player's Companion (no) | d6, BAB low, Fort poor/Ref good/Will good, 6+Int, 20 levels |
| Magnifico | classes_legacy | Player's Companion (no) | d6, BAB medium, Fort poor/Ref good/Will good, 6+Int, 20 levels |
| Samurai (Oriental Adventures) | classes_legacy | Oriental Adventures (yes) | d10, BAB high, Fort good/Ref poor/Will good, 4+Int, 20 levels |

## Powers (`database/srd_powers.json`)

Matched by name: 311; all matched names are Expanded Psionics Handbook powers on the site ({"EPH":310,"CPsi":1}). Clean matches: 186, of which 64 differ only in modelling (a discipline power such as "Seer 4" is stored as `{Seer: 4, Psion: 4}`).

### Conflicts

| Power | Diff | Record discipline | Site discipline | Record levels | Site levels |
|---|---|---|---|---|---|
| Adapt Body | discipline | Metacreativity | Psychometabolism | {"Psion":5,"Psychic Warrior":5,"Wilder":5} | Psion/wilder 5, psychic warrior 5 |
| Affinity Field | discipline | Metacreativity | Psychometabolism | {"Psion":9,"Wilder":9} | Psion/wilder 9 |
| Animal Affinity | discipline | Metacreativity | Psychometabolism | {"Egoist":2,"Psion":2,"Psychic Warrior":2} | Egoist 2, psychic warrior 2 |
| Assimilate | discipline | Metacreativity | Psychometabolism | {"Psion":9,"Wilder":9} | �Psion/wilder 9 |
| Astral Construct | discipline | Psychometabolism | Metacreativity | {"Shaper":1,"Psion":1} | Shaper 1 |
| Astral Seed | discipline | Psychometabolism | Metacreativity | {"Shaper":8,"Psion":8} | Shaper 8 |
| Banishment (site: BANISHMENT, PSIONIC) | level | Psychoportation | Psychoportation | {"Psion":6} | Nomad 6 |
| Biofeedback | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":1,"Psion":2,"Wilder":2} | Psion/wilder 2, psychic warrior 1 |
| Bite of the Wolf | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":1} | Psychic warrior 1 |
| Body Adjustment | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":2,"Psion":3,"Wilder":3} | Psion/wilder 3, psychic warrior 2 |
| Body Equilibrium | discipline | Metacreativity | Psychometabolism | {"Psion":2,"Psychic Warrior":2,"Wilder":2} | Psion/wilder 2, psychic warrior 2 |
| Body Purification | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":2,"Psion":3,"Wilder":3} | Psion/wilder 3, psychic warrior 2 |
| Bolt | discipline | Psychometabolism | Metacreativity | {"Psion":1,"Wilder":1} | Psion/wilder 1 |
| Breath of the Black Dragon | discipline | Metacreativity | Psychometabolism | {"Psion":6,"Psychic Warrior":6,"Wilder":6} | Psion/wilder 6, psychic warrior 6 |
| Chameleon | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":1,"Egoist":2,"Psion":2} | Egoist 2, psychic warrior 1 |
| Claws of the Beast | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":1} | Psychic warrior 1 |
| Claws of the Vampire | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":3} | Psychic warrior 3 |
| Compression | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":1} | Psychic warrior 1 |
| Concealing Amorpha | discipline | Psychometabolism | Metacreativity | {"Psion":2,"Psychic Warrior":2,"Wilder":2} | Psion/wilder 2, psychic warrior 2 |
| Concealing Amorpha, Greater | discipline | Psychometabolism | Metacreativity | {"Psychic Warrior":3,"Shaper":3,"Psion":3} | Shaper 3, psychic warrior 3 |
| Contingency (site: CONTINGENCY, PSIONIC) | discipline + level | Psychometabolism | Clairsentience | {"Psion":7} | Psion/wilder 6 |
| Create Sound | discipline | Psychometabolism | Metacreativity | {"Psion":1,"Wilder":1} | Psion/wilder 1 |
| Crystal Shard | discipline | Psychometabolism | Metacreativity | {"Psion":1,"Wilder":1} | Psion/wilder 1 |
| Crystallize | discipline | Psychometabolism | Metacreativity | {"Shaper":6,"Psion":6} | Shaper 6 |
| Darkvision (site: DARKVISION, PSIONIC) | level | Clairsentience | Clairsentience | {"Psion":2} | Psion/wilder 3, psychic warrior 2 |
| Daze (site: DAZE, PSIONIC) | level | Telepathy | Telepathy | {"Psion":0} | Psion/wilder 1 |
| Dimension Door (site: DIMENSION DOOR, PSIONIC) | level | Psychoportation | Psychoportation | {"Psion":4} | Psion/wilder 4, psychic warrior 4 |
| Dimensional Anchor (site: DIMENSIONAL ANCHOR, PSIONIC) | level | Psychoportation | Psychoportation | {"Psion":4} | Nomad 4 |
| Disintegrate (site: DISINTEGRATE, PSIONIC) | discipline + level | Kin | Psychoportation | {"Psion":6} | Psion/wilder 6 |
| Dismiss Ectoplasm | discipline | Psychometabolism | Metacreativity | {"Psion":3,"Wilder":3} | Psion/wilder 3 |
| Dismissal (site: DISMISSAL, PSIONIC) | level | Psychoportation | Psychoportation | {"Psion":4} | Nomad 4 |
| Dissolving Touch | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":2} | Psychic warrior 2 |
| Dissolving Weapon | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":2} | Psychic warrior 2 |
| Divination (site: DIVINATION, PSIONIC) | level | Clairsentience | Clairsentience | {"Psion":4} | Psion/wilder 4 |
| Duodimensional Claw | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":3} | Psychic warrior 3 |
| Ecto Protection | discipline | Psychometabolism | Metacreativity | {"Psion":1,"Wilder":1} | Psion/wilder 1 |
| Ectoplasmic Cocoon | discipline | Psychometabolism | Metacreativity | {"Shaper":3,"Psion":3} | Shaper 3 |
| Ectoplasmic Form | discipline | Metacreativity | Psychometabolism | {"Egoist":3,"Psion":3,"Psychic Warrior":3} | Egoist 3, psychic warrior 3 |
| Ectoplasmic Shambler | discipline | Psychometabolism | Metacreativity | {"Psion":5,"Wilder":5} | Psion/wilder 5 |
| Elfsight | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":1,"Psion":2,"Wilder":2} | Psion/wilder 2, psychic warrior 1 |
| Empathic Transfer | discipline | Metacreativity | Psychometabolism | {"Egoist":2,"Psion":2,"Psychic Warrior":2} | Egoist 2, psychic warrior 2 |
| Energy Adaptation | discipline | Metacreativity | Psychometabolism | {"Psion":4,"Psychic Warrior":4,"Wilder":4} | Psion/wilder 4, psychic warrior 4 |
| Energy Adaptation, Specified | discipline | Metacreativity | Psychometabolism | {"Psion":2,"Psychic Warrior":2,"Wilder":2} | Psion/wilder 2, psychic warrior 2 |
| Energy Conversion | discipline | Metacreativity | Psychometabolism | {"Psion":7,"Wilder":7} | Psion/wilder 7 |
| Energy Wall | discipline | Psychometabolism | Metacreativity | {"Psion":3,"Wilder":3} | Psion/wilder 3 |
| Entangling Ectoplasm | discipline | Psychometabolism | Metacreativity | {"Psion":1,"Wilder":1} | Psion/wilder 1 |
| Ethereal Jaunt (site: ETHEREAL JAUNT, PSIONIC) | level | Psychoportation | Psychoportation | {"Psion":6} | Nomad 7 |
| Etherealness (site: ETHEREALNESS, PSIONIC) | level | Psychoportation | Psychoportation | {"Psion":7} | Psion/wilder 9 |
| Evade Burst | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":3,"Psion":7,"Wilder":7} | Psion/wilder 7, psychic warrior 3 |
| Exhalation of the Black Dragon | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":3} | Psychic warrior 3 |
| Expansion | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":1} | Psychic warrior 1 |
| Fabricate (site: FABRICATE, PSIONIC) | discipline + level | Psychometabolism | Metacreativity | {"Psion":4} | Shaper 4 |
| Fabricate, Greater Psionic | discipline | Psychometabolism | Metacreativity | {"Shaper":6,"Psion":6} | Shaper 6 |
| Fabricate, Psionic | discipline | Psychometabolism | Metacreativity | {"Shaper":4,"Psion":4} | Shaper 4 |
| Fission | discipline | Metacreativity | Psychometabolism | {"Egoist":7,"Psion":7} | Egoist 7 |
| Fly (site: FLY, PSIONIC) | level | Psychoportation | Psychoportation | {"Psion":3} | Nomad 4 |
| Form of Doom | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":6} | Psychic warrior 6 |
| Freedom of Movement (site: FREEDOM OF MOVEMENT, PSIONIC) | level | Psychoportation | Psychoportation | {"Psion":4} | Psion/wilder 4, psychic warrior 4 |
| Fuse Flesh | discipline | Metacreativity | Psychometabolism | {"Psion":6,"Wilder":6} | Psion/wilder 6 |
| Fusion | discipline | Metacreativity | Psychometabolism | {"Egoist":8,"Psion":8} | Egoist 8 |
| Genesis | discipline | Psychometabolism | Metacreativity | {"Shaper":9,"Psion":9} | �Shaper 9 |
| Graft Weapon | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":3} | Psychic warrior 3 |
| Grease (site: GREASE, PSIONIC) | discipline + level | Psychometabolism | Metacreativity | {"Psion":1} | Psion/wilder 1 |
| Grease, Psionic | discipline | Psychometabolism | Metacreativity | {"Psion":1,"Wilder":1} | Psion/wilder 1 |
| Grip of Iron | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":1} | Psychic warrior 1 |
| Hail of Crystals | discipline | Psychometabolism | Metacreativity | {"Shaper":5,"Psion":5} | Shaper 5 |
| Hammer | discipline | Metacreativity | Psychometabolism | {"Psion":1,"Psychic Warrior":1,"Wilder":1} | Psion/wilder 1, psychic warrior 1 |
| Hustle | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":2,"Egoist":3,"Psion":3} | Egoist 3, psychic warrior 2 |
| Identify (site: IDENTIFY, PSIONIC) | level | Clairsentience | Clairsentience | {"Psion":1} | Psion/wilder 2 |
| Immovability | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":4} | Psychic warrior 4 |
| Incarnate | discipline | Psychometabolism | Metacreativity | {"Psion":5,"Wilder":5} | Psion/wilder 5 |
| Insanity | level | Telepathy | Telepathy | {"Wilder":7} | Psion/wilder 7 |
| Iron Body (site: IRON BODY, PSIONIC) | level | Metacreativity | Metacreativity | {"Psion":8} | Psion/wilder 8 |
| Iron Body, Psionic | discipline | Psychometabolism | Metacreativity | {"Psion":8,"Wilder":8} | Psion/wilder 8 |
| Keen Edge, Psionic | discipline | Psychometabolism | Metacreativity | {"Psion":3,"Psychic Warrior":3,"Wilder":3} | Psion/wilder 3, psychic warrior 3 |
| Knock (site: KNOCK, PSIONIC) | level | Psychoportation | Psychoportation | {"Psion":2} | Psion/wilder 2 |
| Leech Field | discipline | Metacreativity | Psychometabolism | {"Psion":5,"Wilder":5} | Psion/wilder 5 |
| Levitate (site: LEVITATE, PSIONIC) | level | Psychoportation | Psychoportation | {"Psion":2} | Nomad 2, psion/wilder 2, psychic warrior 2 |
| Major Creation (site: MAJOR CREATION, PSIONIC) | discipline + level | Psychometabolism | Metacreativity | {"Psion":5} | Psion/wilder 5 |
| Major Creation, Psionic | discipline | Psychometabolism | Metacreativity | {"Psion":5,"Wilder":5} | Psion/wilder 5 |
| Matter Manipulation | discipline | Kin | Metacreativity | {"Psion":8,"Wilder":8} | Psion/wilder 8 |
| Metamorphosis | discipline | Metacreativity | Psychometabolism | {"Egoist":4,"Psion":4} | Egoist 4 |
| Metamorphosis, Greater | discipline | Metacreativity | Psychometabolism | {"Egoist":9,"Psion":9} | Egoist 9 |
| Metaphysical Claw | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":1} | Psychic warrior 1 |
| Metaphysical Weapon | discipline | Psychometabolism | Metacreativity | {"Psychic Warrior":1} | Psychic warrior 1 |
| Mind Blank (site: MIND BLANK, PSIONIC) | level | Telepathy | Telepathy | {"Psion":8} | Psion/wilder 8 |
| Minor Creation (site: MINOR CREATION, PSIONIC) | discipline + level | Psychometabolism | Metacreativity | {"Psion":1} | Shaper 1 |
| Oak Body | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":5,"Psion":7,"Wilder":7} | Psion/wilder 7, psychic warrior 5 |
| Painful Strike | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":2} | Psychic warrior 2 |
| Phase Door (site: PHASE DOOR, PSIONIC) | level | Psychoportation | Psychoportation | {"Psion":7} | Psion/wilder 7 |
| Plane Shift (site: PLANE SHIFT, PSIONIC) | level | Psychoportation | Psychoportation | {"Psion":7} | Psion/wilder 5 |
| Prevenom | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":1} | Psychic warrior 1 |
| Prevenom Weapon | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":1} | Psychic warrior 1 |
| Psionic Lion's Charge | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":2} | Psychic warrior 2 |
| Psionic Repair Damage | discipline | Psychometabolism | Metacreativity | {"Shaper":2,"Psion":2} | Shaper 2 |
| Psionic Revivify | discipline | Metacreativity | Psychometabolism | {"Egoist":5,"Psion":5} | Egoist 5 |
| Psionic Scent | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":2} | Psychic warrior 2 |
| Psychic Vampire | discipline | Metacreativity | Psychometabolism | {"Egoist":4,"Psion":4,"Psychic Warrior":4} | Egoist 4, psychic warrior 4 |
| Psychofeedback | discipline | Metacreativity | Psychometabolism | {"Egoist":5,"Psion":5,"Psychic Warrior":5} | Egoist 5, psychic warrior 5 |
| Quintessence | discipline | Psychometabolism | Metacreativity | {"Shaper":4,"Psion":4} | Shaper 4 |
| Restoration, Psionic | discipline | Metacreativity | Psychometabolism | {"Egoist":6,"Psion":6} | Egoist 6 |
| Restore Extremity | discipline | Metacreativity | Psychometabolism | {"Egoist":5,"Psion":5} | Egoist 5 |
| See Invisibility (site: SEE INVISIBILITY, PSIONIC) | level | Clairsentience | Clairsentience | {"Psion":2} | Lurk 2 |
| Sequester (site: SEQUESTER, PSIONIC) | level | Clairsentience | Clairsentience | {"Psion":7} | Psion/wilder 7 |
| Shadow Body | discipline | Metacreativity | Psychometabolism | {"Psion":8,"Wilder":8} | Psion/wilder 8 |
| Share Pain | discipline | Metacreativity | Psychometabolism | {"Psion":2,"Wilder":2} | Psion/wilder 2 |
| Share Pain, Forced | discipline | Metacreativity | Psychometabolism | {"Psion":3,"Wilder":3} | Psion/wilder 3 |
| Strength of My Enemy | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":2} | Psychic warrior 2 |
| Suggestion (site: SUGGESTION, PSIONIC) | level | Telepathy | Telepathy | {"Psion":2} | Telepath 2 |
| Suspend Life | discipline | Metacreativity | Psychometabolism | {"Psion":6,"Psychic Warrior":6,"Wilder":6} | Psion/wilder 6, psychic warrior 6 |
| Sustenance | discipline | Metacreativity | Psychometabolism | {"Psion":2,"Psychic Warrior":2,"Wilder":2} | Psion/wilder 2, psychic warrior 2 |
| Swarm of Crystals | discipline | Psychometabolism | Metacreativity | {"Psion":2,"Wilder":2} | Psion/wilder 2 |
| Synesthete | discipline | Metacreativity | Psychometabolism | {"Psion":1,"Psychic Warrior":1,"Wilder":1} | Psion/wilder 1, psychic warrior 1 |
| Telekinetic Sphere (site: TELEKINETIC SPHERE, PSIONIC) | level | Kin | Psychokinesis | {"Psion":8} | Kineticist 8 |
| Teleport (site: TELEPORT, PSIONIC) | level | Psychoportation | Psychoportation | {"Psion":5} | Nomad 5 |
| Thicken Skin | discipline | Metacreativity | Psychometabolism | {"Egoist":1,"Psion":1,"Psychic Warrior":1} | Egoist 1, psychic warrior 1 |
| Touchsight | discipline | Metacreativity | Psychometabolism | {"Psion":3,"Wilder":3} | Psion/wilder 3 |
| True Creation | discipline + level | Psychometabolism | Metacreativity | {"Psion":8} | Shaper 9 |
| True Metabolism | discipline | Metacreativity | Psychometabolism | {"Psion":8,"Wilder":8} | Psion/wilder 8 |
| True Seeing (site: TRUE SEEING, PSIONIC) | level | Clairsentience | Clairsentience | {"Psion":5} | Psion/wilder 5 |
| Truevenom | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":4} | Psychic warrior 4 |
| Truevenom Weapon | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":4} | Psychic warrior 4 |
| Vampiric Blade | discipline | Metacreativity | Psychometabolism | {"Psychic Warrior":3} | Psychic warrior 3 |
| Vigor | discipline | Metacreativity | Psychometabolism | {"Psion":1,"Psychic Warrior":1,"Wilder":1} | Psion/wilder 1, psychic warrior 1 |
| Wall of Ectoplasm | discipline | Psychometabolism | Metacreativity | {"Psion":4,"Wilder":4} | Psion/wilder 4 |

### Not on the site (3.0 *Psionics Handbook* names/levels)

| Power | Record discipline | Record levels |
|---|---|---|
| Ablating | Kin | {"Psion":6} |
| Adamant Grasp | Metacreativity | {} |
| Amplified Invisibility | Kin | {"Psion":4} |
| Astral Construct I | Psychometabolism | {"Psion":1} |
| Astral Construct II | Psychometabolism | {"Psion":2} |
| Astral Construct III | Psychometabolism | {"Psion":3} |
| Astral Construct IV | Psychometabolism | {"Psion":4} |
| Astral Construct IX | Psychometabolism | {"Psion":9} |
| Astral Construct V | Psychometabolism | {"Psion":5} |
| Astral Construct VI | Psychometabolism | {"Psion":6} |
| Astral Construct VII | Psychometabolism | {"Psion":7} |
| Astral Construct VIII | Psychometabolism | {"Psion":8} |
| Astral Projection | Psychoportation | {"Psion":9} |
| Astral Steed | Psychoportation | {"Psion":3} |
| Augury | Clairsentience | {"Psion":2} |
| Biocurrent | Kin | {"Psion":1} |
| Bite of the Tiger | Metacreativity | {"Psion":3} |
| Breath of the Dragon | Metacreativity | {"Psion":6} |
| Brilliant Blast | Kin | {"Psion":5} |
| Burning Ray | Psychometabolism | {"Psion":2} |
| Call Cohort | Psychoportation | {} |
| Charm Monster | Telepathy | {"Psion":3} |
| Charm Person | Telepathy | {"Psion":1} |
| Clairaudience/Clairvoyance | Clairsentience | {"Psion":2} |
| Clairtangency | Kin | {"Psion":5} |
| Claws of the Bear | Metacreativity | {"Psion":2} |
| Combat Precognition | Clairsentience | {"Psion":1} |
| Combat Prescience | Clairsentience | {"Psion":2} |
| Concussion | Kin | {"Psion":2} |
| Cone of Sound | Kin | {"Psion":3} |
| Confidante | Telepathy | {"Psion":9} |
| Control Shadow | Kin | {"Psion":0} |
| Create Food and Water | Psychometabolism | {"Psion":3} |
| Déjà Vu | Telepathy | {"Psion":1,"Wilder":1} |
| Detect Poison | Clairsentience | {"Psion":0} |
| Detect Thoughts | Telepathy | {"Psion":2} |
| Detonation | Kin | {"Psion":9} |
| Displacement | Metacreativity | {"Psion":3} |
| Dissolution | Kin | {"Psion":9} |
| Divert Teleport | Psychoportation | {"Psion":7,"Wilder":7} |
| Domination | Telepathy | {"Psion":4} |
| Duodimensional Hand | Metacreativity | {"Psion":3} |
| Ecto Puppet | Psychometabolism | {"Psion":2} |
| Ectoplasmic Armor | Psychometabolism | {"Psion":5} |
| Ectoplasmic Cocoon, Mass | Psychometabolism | {"Shaper":7,"Psion":7} |
| Emulate Power | Clairsentience | {"Psion":7} |
| Energy Barrier | Metacreativity | {"Psion":5} |
| Expanded Vision | Clairsentience | {"Psion":1} |
| Far Punch | Kin | {"Psion":0} |
| Fatal Attraction | Telepathy | {"Psion":4} |
| Feather Fall | Psychoportation | {"Psion":1} |
| Feel Light | Metacreativity | {"Psion":1} |
| Feel Sound | Metacreativity | {"Psion":1} |
| Finger of Fire | Psychometabolism | {"Psion":0} |
| Firefall | Psychometabolism | {"Psion":1} |
| Flaming Shroud | Psychometabolism | {"Psion":6} |
| Forced Mindlink | Telepathy | {"Psion":4} |
| Foresight | Clairsentience | {"Psion":8} |
| Glide | Psychoportation | {"Psion":2} |
| Greater Biocurrent | Kin | {"Psion":6} |
| Greater Concussion | Kin | {"Psion":3} |
| Greater Domination | Telepathy | {"Psion":5} |
| Greater Emulation | Clairsentience | {"Psion":9} |
| Hear Light | Metacreativity | {"Psion":1} |
| Improved Anchored Navigation | Clairsentience | {"Psion":7} |
| Improved Biofeedback | Metacreativity | {"Psion":3} |
| Improved Clairtangency | Kin | {"Psion":8} |
| Improved Etherealness | Psychoportation | {"Psion":8} |
| Improved Fabricate | Psychometabolism | {"Psion":6} |
| Improved Fly | Psychoportation | {"Psion":6} |
| Improved Telekinesis | Kin | {"Psion":7} |
| Improved Vigor | Metacreativity | {"Psion":6} |
| Inkling | Clairsentience | {"Psion":0} |
| Intrusive Sense Link | Telepathy | {"Psion":2} |
| Invisibility | Kin | {"Psion":2} |
| Invisibility Purge | Clairsentience | {"Psion":3} |
| Know Direction | Clairsentience | {"Psion":0} |
| Know Location | Clairsentience | {"Psion":1} |
| Lesser Body Adjustment | Metacreativity | {"Psion":1} |
| Lesser Concussion | Kin | {"Psion":1} |
| Lesser Domination | Telepathy | {"Psion":3} |
| Lesser Metaphysical Weapon | Psychometabolism | {"Psion":1} |
| Lesser Mindlink | Telepathy | {"Psion":1} |
| Lesser Natural Armor | Metacreativity | {"Psion":0} |
| Mass Cocoon | Psychometabolism | {"Psion":7} |
| Mass Concussion | Kin | {"Psion":4} |
| Mass Domination | Telepathy | {"Psion":7} |
| Mass Suggestion | Telepathy | {"Psion":6} |
| Matter Rearrangement | Kin | {"Psion":5} |
| Mind Store | Psychometabolism | {"Psion":8} |
| Monster Domination | Telepathy | {"Psion":9} |
| Natural Armor | Metacreativity | {"Psion":4} |
| Negate Psionics | Kin | {"Psion":3} |
| Nondetection | Clairsentience | {"Psion":3} |
| Null Psionics Field | Kin | {"Kineticist":6,"Psion":6} |
| Painful Touch | Metacreativity | {"Psion":2} |
| Poison Sense | Clairsentience | {"Psion":3} |
| Polymorph Self | Metacreativity | {"Psion":4} |
| Power Turning | Kin | {"Psion":7} |
| Prescience, Offensive | Clairsentience | {"Psion":1,"Psychic Warrior":1,"Wilder":1} |
| Probability Travel | Psychoportation | {"Psion":9} |
| Psycholuminescence | Psychometabolism | {"Psion":1} |
| Recall Pain | Clairsentience | {"Psion":2} |
| Rejuvenation | Metacreativity | {"Psion":3} |
| See Sound | Metacreativity | {"Psion":1} |
| Sending | Psychoportation | {"Psion":5} |
| Sense Psionics | Telepathy | {"Psion":5} |
| Sense Psychoportation | Psychoportation | {"Nomad":3,"Psion":3} |
| Sever the Tie | Kin | {"Psion":2} |
| Shapechange | Metacreativity | {"Psion":9} |
| Shield of Prudence | Clairsentience | {"Psion":6} |
| Spider Climb | Psychoportation | {"Psion":1} |
| Steadfast Gaze | Clairsentience | {"Psion":1} |
| Sudden Minor Creation | Psychometabolism | {"Psion":2} |
| Tailor Memory | Telepathy | {"Psion":4} |
| Talons | Metacreativity | {"Psion":0} |
| Telekinesis | Kin | {"Psion":4} |
| Teleport without Error | Psychoportation | {"Psion":7} |
| Temporal Velocity | Psychoportation | {"Psion":9} |
| Thrall | Telepathy | {"Psion":9} |
| Trinket | Psychometabolism | {"Psion":0} |
| True Concussion | Kin | {"Psion":7} |
| True Domination | Telepathy | {"Psion":8} |
| True Telekinesis | Kin | {"Psion":9} |
| Undead Sense | Clairsentience | {"Psion":3} |
| Valor | Metacreativity | {} |
| Verve | Metacreativity | {"Psion":0} |
| Vigilance | Clairsentience | {} |
| Whitefire | Psychometabolism | {"Psion":3} |

## Proposed next step (waits for approval)

1. Feats `match` + `equivalent` → `verification: "cross-checked"`, `provenance.crossCheck: { site: "srd.dndtools.org", page: "srd/tools/toolsFeatIndex.html", checked: "2026-11-10" }`.
2. Feat prerequisite and source conflicts → read the book in Kitap (all affected books are there); book value wins, record becomes `verified`. Site typos/garbled cells keep the record value after the book check.
3. Classes: 18 matches → `cross-checked`; Healer (Miniatures Handbook is not in Kitap → site value d6 under the user's rule), Shaman (Oriental Adventures is in Kitap → book), Mariner (neither Dragonlance Campaign Setting nor Age of Mortals is in Kitap → site book) settled accordingly.
4. Powers: decide first whether to remove the 3.0 records and rebuild the discipline/level data from the EPH (in Kitap) rather than patching record by record.
5. Fix the "Persistant Refusal" name and the `Kin` category as separate small changes.

## Appendix A: feats accepted as equivalent wording

| Feat | Record | Site |
|---|---|---|
| Crushing Strike | Proficiency with a bludgeoning weapon, Weapon Focus with a bludgeoning weapon, Melee Weapon Mastery (bludgeoning), Weapon Specialization with a bludgeoning weapon, base attack bonus +14 | Proficiency with a bludgeoning weapon, Weapon Focus with a bludgeoning weapon, Weapon Mastery (bludgeoning), Weapon Specialization with a bludgeoning weapon, base attack bonus +14. |
| Celestial Sorcerer Wings | Sorcerer 1st level, Celestial Sorcerer Heritage | Celestial Sorcerer Heritage, sorcerer level 1st. |
| Infernal Sorcerer Heritage | Sorcerer 1st level | Sorcerer level 1st. |
| Greater Resiliency | Damage Reduction | Damage reduction as a class feature or innate ability. |
| Pain Touch | Wis 15, BAB +2, Stunning Fist | Wis 15, Stunning Fist, base attack bonus +2. |
| Divine Resistance | Ability to turn/rebuke undead, Divine Cleansing | Turn or rebuke undead ability, Divine Cleansing. |
| Divine Vigor | Ability to turn/rebuke undead | Turn or rebuke undead ability. |
| Arcane Defense | Spell Focus in specific School | Spell Focus in the chosen school. |
| Heighten Spell-Like Ability | Spell-like ability at caster level 6th | Spell-like ability at caster level 6th or higher. |
| Deft Strike | Int 13, Spot 10 ranks, Combat Expertise, sneak attack | Int 13, Combat Expertise, Spot 10 ranks, sneak attack. |
| Dire Flail Mind Blade | Mind blade, shape mind blade | Ability to generate a mind blade, shape mind blade class feature. |
| Dwarven Urgrosh Mind Blade | Mind blade, shape mind blade | Ability to generate a mind blade, shape mind blade class feature. |
| Enhanced Beneficence | Psychic Aura | Psychic aura class feature. |
| Euphoric Reduction | Surging euphoria +1 | Surging euphoria +1 class feature. |
| Invest Armor | Armor Proficiency | Proficient with armor worn. |
| Lurk Augment, Extra | Lurk Augment | Lurk augment class feature. |
| Lurk Augment, Ranged | Lurk Augment | lurk augment class feature. |
| Lurk Master | Lurk Augment | Lurk augment class feature. |
| Mental Juggernaut | Ability to gain psionic focus (Not verified) | Ability to gain psionic focus. |
| Mind Cleave | Mind blade, psychic strike | Mind blade class feature, psychic strike class feature. |
| Mind Empowerment | Mind blade, psychic strike, Mind Cleave | Mind blade class feature, psychic strike class feature, Mind Cleave. |
| Mind Strike, Focused | Mind blade, psychic strike +1d8 | Ability to generate a mind blade, psychic strike +1d8. |
| Mind Strike, Swift | Mind blade, psychic strike +2d8 | Ability to generate a mind blade, psychic strike+2d8. |
| Orc Double Axe Mind Blade | Mind blade, shape mind blade | Ability to generate a mind blade, shape mind blade class feature. |
| Postpone Enervation | Psychic enervation, wild surge +2 | Psychic enervation class feature, wild surge +2. |
| Privileged Energy | Ability to manifest energy missile (Not verified) | Ability to manifest the energy missile power. |
| Dazzling Energy | Ability to manifest energy missile (Not verified), Privileged Energy | Know energy missile power, Privileged Energy. |
| Skin of the Construct | Know astral construct (Not verified) | Know astral construct power. |
| Stygian Archon | Know two negative energy powers (Not verified) | Know two powers that utilize negative energy. |
| Don Mantle | Tap Mantle | TapMantle. |
| Extra Aura | Don Mantle, psychic aura | Don Mantle, psychic aura class feature. |
| Two-Bladed Mind Blade | Mind blade, shape mind blade | Ability to generate a mind blade, shape mind blade class feature. |
| Volatile Escalation | Volatile Mind | Volatile mind class feature. |
| Volatile Leech | Volatile Mind | Volatile mind class feature. |
| Duergar Expansion | Duergar, expansion | Duergar, expansion psi-like ability. |
| Duergar Invisibility | Duergar, invisibility | Duergar, invisibility psi-like ability. |
| Githyanki Charm | Githyanki, psionic daze (Not verified) | Githyanki, psionic daze psi-like ability. |
| Githyanki Control | Githyanki, far hand (Not verified) | Githyanki, far hand psi-like ability. |
| Githyanki Dismissal | Githyanki, dimension door (Not verified) | Githyanki. dimension door psi-like ability. |
| Githyanki Ectoform | Githyanki, concealing amorpha (Not verified) | Githyanki, concealing amorpha psi-like ability. |
| Githzerai Burst | Githzerai, cat fall (Not verified) | Githzerai, cat fall psi-like ability. |
| Githzerai Feedback | Githzerai, inertial armor (Not verified) | Githzerai, inertial armor psi-like ability. |
| Githzerai Knock | Githzerai, concussion blast (Not verified) | Githzerai, concussion blast psi-like ability. |
| Githzerai Link | Githzerai, psionic daze | Githzerai, psionic daze psi-like ability. |
| Half-Giant Stomp | Half-giant, Stomp | Half-giant, slump racial trait. |
| Half-Giant Thunderer | Half-giant, Stomp | Half-giant, stomp racial trait. |
| Thri-Kreen Claw | Thri-Kreen, metaphysical claw | Thri-kreen, metaphysical claw psi-like ability. |
| Thri-Kreen Displacement | Thri-Kreen, psionic displacement | Thri-kreen, psionic displacement psi-like ability. |
| Thri-Kreen Poison | (No Suggestions), poison | Thri-kreen, poison bite. |
| Dorje Mastery | Manifester level 9th | Craft Dorje, manifester level 9th. |
| Spiritual Force | Any other host feat, mind blade | Any other host feat, mind blade class feature. |
| Illithid Blast | Illithid Heritage, two other illithid feats, manifester level 5th | Illithid Heritage, two other illithid teats. manifester level 5th. |
| Illithid Extraction | Illithid Heritage, Illithid Grapple x4 | Illithid Heritage, Illithid Grapple (4). |
| Illithid Legacy, Greater | Illithid Heritage, one other illithid feat, manifester level 7th | Illithid Legacy any one other illithid feat, manifester level 7th. |
| Metapower | Able to manifest psionic powers, any other metapsionic feat | Ability to manifest psionic powers, any other metapsionic feat. |
| Paraelemental Power | Privileged Energy of the selected type | Privileged Energy. |
| Stygian Power | Know two negative energy powers, Stygian Archon (Not verified) | Stygian Archon, know two powers that utilize negative energy. |
| Dazzling Illusion | Spell focus (illusion) or Illusionist 1st level | Spell Focus (illusion) or illusionist level 1st. |
| Defending Spirit | Watchful spirit class feature | Watchful spirit class feature (see the wu jen class in Complete Arcane). |
| Favored Magic Foe | Knowledge 6 ranks or favored enemy class feature | Knowledge 6 ranks (in appropriate skill; see below) or favored enemy class feature. |
| Hasty Spirit | Watchful spirit class feature | Watchful spirit class feature (see the wu jen class in Complete Arcane). |
| Insightful Divination | Spell focus (divination) or Diviner 1st level | Spell Focus (divination) or diviner level 1st. |
| Metamagic School Focus | Spell focus (chosen school) or specialist wizard | Spell Focus (chosen school) or specialist wizard in chosen school. |
| Piercing Evocation | Spell Focus (evocation) or Evoker 1st level | Spell Focus (evocation) or evoker level 1st. |
| Toughening Transmutation | Spell focus (transmutation) or Transmuter 1st level | Spell Focus (transmutation) or transmuter level 1st. |
| Unsettling Enchantment | Spell focus (enchantment) or Enchanter 1st level | Spell Focus (enchantment) or enchanter level 1st. |
| Vengeful Spirit | Watchful spirit class feature | Watchful spirit class feature (see the wu jen class in Complete Arcane). |
| Fey Legacy | Nonlawful alignment, Fey Heritage, character 9th level | Nonlawful alignment, Fey Heritage, character level 9th. |
| Fey Presence | Nonlawful alignment, Fey Heritage, character 6th level | Nonlawful alignment, Fey Heritage, character level 6th. |
| Fiendish Heritage | Non-good alignment | Nongood alignment. |
| Fiendish Legacy | Non-good alignment, Fiendish Heritage, Character level 9th | Nongood alignment, Fiendish Heritage, character level 9th. |
| Fiendish Power | Non-good alignment, Fiendish Heritage | Nongood alignment, Fiendish Heritage. |
| Fiendish Presence | Non-good alignment, Fiendish Heritage, character level 6th | Nongood alignment, Fiendish Heritage, character level 6th. |
| Fiendish Resistance | Non-good alignment, Fiendish Heritage | Nongood alignment, Fiendish Heritage. |
| Energy Gestalt | Spell Focus (evocation), CL 3rd | Spell Focus (evocation), caster level 3rd. |
| Third Time's The Charm | Character level 3rd, any luck feat, Luck domain | Character level 3rd, any luck feat, access to the Luck domain. |
| Awesome Smite | Power Attack, Base Attack +6, Smite Ability | Power Attack, base attack bonus +6, smite ability. |
| Bestial Charge | Base Attack +4, Wild Shape class feature | Base attack bonus +4, wild shape class feature. |
| Holy Potency | Base Attack +4, Ability to spontaneously cast cure or inflict spells, ability to turn or rebuke undead | Base attack bonus +4, ability to spontaneously cast cure or inflict spells, ability to turn or rebuke undead. |
| Venom's Gift | Two other wild feats, wild shape class feature, ability to assume plant form using wild shape | Any two wild feats, wild shape class feature, ability to assume plant form using wild shape. |
| Rampaging Bull Rush | Improved Bull Rush, size Large or larger, rage class feature | Improved Bull Rush, rage ability, size Large or larger (goliaths qualify by virtue of their powerful build racial trait). |
| Fling Enemy | Str 19, Rock Hurling or racial ability to throw rocks, size Large or larger (or Powerful Build) | Str 19, Rock Hurling or racial ability to throw rocks, size Large or larger (goliaths qualify by virtue of their powerful build racial trait). |
| Shielded Manifesting | Concentration 5 ranks, Combat Manifestation, Shield Proficiency | Concentration 5 ranks, Combat Manifesting, Shield Proficiency. |
| Altitude Adaptation | Base Fort  +2 | Base Fortitude save bonus +2. |
| Arctic Priest | Cold or Winter Domain | Access to Cold or Winter cleric domain. |
| Beckon the Frozen | Augment Summoning, Spell Focus (Conj) | Augment Summoning, Spell Focus (conjuration). |
| Cold Endurance | Base Fort  +2 | Base Fortitude save bonus +2. |
| Improved Cold Endurance | Base Fort  +6, Cold Endurance | Base Fortitude save bonus +6, Cold Endurance. |
| Faith in the Frost | Ability to turn or rebuke creatures, Cold or Winter domain | Ability to turn or rebuke creatures, access to Cold or Winter cleric domain. |
| Frozen Berserker | Barbarian Rage Ability | Ability to rage. |
| Frozen Wild Shape | Base Fort  +6, wild shape ability | Base Fortitude save bonus +6, wild shape ability. |
| Mark of Hleid | Patron deity must be Hleid | Your patron deity must be Hleid. |
| Sugliin Mastery | BAB +5, EWP (sugliin) | Base attack bonus +5, Exotic Weapon Proficiency (sugliin). |
| Blessed by Tem-Et-Nu | Patron deity Tem-Et-Nu, ritual | Patron deity Tem-Et-Nu, must have defeated a hippopotamus in single combat. |
| Drift Magic | Knowledge (local) 4 ranks, ability to cast spells | Knowledge (local wasteland region) 4 ranks, ability to cast spells. |
| Eagle's Fury | Dex 15, proficiency with the eagle's claw weapon | Dex 15, proficiency with eagle's claw. |
| Heat Endurance | Base Fort +2 | Base Fortitude save +2. |
| Improved Heat Endurance | Base Fort +6, Heat Endurance | Base Fortitude save +6, Heat Endurance. |
| Judged by Aurifar | Patron deity Aurifar, ritual | Patron deity Aurifar, must have survived at least three days in the waste without water. |
| Light of Aurifar | Ability to turn or rebuke undead, access to the Fire or Sun domain | Ability to turn or rebuke undead, access to either the Fire or Sun domain. |
| Sand Camouflage | Sandskimmer, Hide 5 ranks | Hide 5 ranks, Sandskimmer. |
| Breathing Link | Aquatic elf, or water genasi, Base Will +2 | Aquatic elf or water genasi, base Will save +2. |
| Archivist of Nature | Dark knowledge class feature | Dark knowledge. |
| Blood Calls to Blood | Spontaneous arcane caster, fiend ancestor | Spontaneous arcane caster, must be descended from a fiend. |
| Corrupt Spell Focus | Nongood alignment | Any nongood alignment. |
| Disease Immunity | Con 13 | Constitution 13. |
| Draconic Archivist | Dark knowledge class feature | Dark knowledge. |
| Oneiromancy | Dreamtelling, Spellcaster | Dreamtelling, ability to cast spells of any sort. |
| Improved Oneiromancy | Oneiromancy, Dreamtelling, Spellcaster | Dreamcasting, Oneiromancy, spellcaster. |
| Font of Life | Living Creature | Must be a living creature. |
| Pure Soul | Non-evil alignment, no taint | Any nonevil alignment, no taint. |
| Tainted Fury | Con 13, Moderate Corruption | Constitution 13, moderate corruption. |
| Unnatural Will | Cha 12, Iron will | Charisma 12, Iron Will. |
| Blade Meditation | Concentration 1 rank, BAB +4, one martial maneuver | Concentration 1 rank, base attack bonus +4, one maneuver from any discipline. |
| Ironheart Aura | One Iron Heart strike | One Iron Heart stance. |
| Shadow Trickster | Caster level 1st, one Shadow Hand stance | Caster level 1st, one Shadow Hand strike. |
| Tiger Blooded | Ability to rage, wild shape, or shift; one Tiger Claw maneuver | Ability to rage, shift (such as the shifter ability from the EBERRON campaign setting or the bloodclaw master prestige class feature), or wild shape; one Tiger Claw maneuver. |
| White Raven Defense | One White Raven maneuver | One White Raven stance. |
| Faith Unswerving | Devoted Bulwark, BAB +6, two Devoted Spirit maneuvers | Devoted Bulwark, base arrack bonus +6, two Devoted Spirit maneuvers. |
| Perfect Clarity of Mind and Body | Unnerving Calm, BAB +6, two Diamond Mind maneuvers | Unnerving Calm, base arrack bonus +6, two Diamond Mind maneuvers. |
| Stormguard Warrior | Proficient with bastard sword, dwarven waraxe, longsword, or two-bladed sword; Ironheart Aura; BAB +6; two Iron Heart maneuvers | Proficiency with an Iron Heart preferred weapon (bastard sword, dwarven waraxe, longsword, or two-bladed sword), Ironheart Aura, base attack bonus +6, two Iron Heart maneuvers. |
| Improved Bind Vestige | Bind Vestige feat | Bind Vestige. |
| Practiced Binder | Bind Vestige feat | Bind Vestige. |
| Favored Vestige | Soulbinding | Soul binding. |
| Ignore Special Requirements | Soulbinding | Soul binding. |
| Improved Binding | Soulbinding, Intimidate 4 ranks | Soul binding, Intimidate 4 ranks. |
| Skilled Pact Making | Soulbinding, base Will save +4 | Soul binding, base Will save +4. |
| Share Soulmeld | Ability to shape soulmelds; familiar, animal companion, or mount with whom you can share spells. | Ability to shape soulmelds and a familiar, animal companion, or mount with whom you can share spells. |
| Azure Enmity | Con 13, Favoured Enemy class feature | Con 13, favored enemy class feature. |
| Azure Talent | Con 13, power point reserve | Con 13, a power point reserve. |
| Azure Touch | Con 13, Lay on Hands or Wholeness of Body | Con 13, lay on hands or wholeness of body class feature. |
| Cobalt Expertise | Con 13, Int 13, Combat Expertise feat | Con 13, Int 13, Combat Expertise. |
| Cobalt Power | Con 13, Str 13, Power Attack feat | Con 13, Str 13, Power Attack. |
| Cobalt Precision | Con 13, Point Blank Shot feat | Con 13, Point Blank Shot. |
| Indigo Strike | Con 13, skirmish, sneak attack, or sudden strike class feature. | Con 13 and skirmish, sneak attack, or sudden strike class feature. |
| Midnight Augmentation | Con 13, ability to manifest 2nd level powers | Con 13, ability to manifest 2nd-level psionic powers. |
| Sapphire Fist | Con 13, Stunning Fist feat | Con 13, Stunning Fist. |
| Sapphire Smite | Con 13, ability to Smite | Con 13, ability to smite (smite evil class feature, smite domain power, or similar ability). |
| Psycarnum Crystal | Con 13, Psicrystal Affinity feat, essentia pool | Con 13, Psicrystal Affinity*, essentia pool. |
| Trap Engineer | Knowledge (arch & eng) 1 rank, Knowledge (dungeoneering) 4 ranks | Knowledge (architecture and engineering) 1 rank, Knowledge (dungeoneering) 4 ranks. |
| Gnome Tunnel Acrobatics | Gnome or BAB +4, Knowledge (dungeoneering) 2 ranks, Tumble 9 ranks | Gnome; or base attack bonus +4, Knowledge (dungeoneering) 2 ranks, and Tumble 9 ranks. |
| Undermountain Tactics | Dwarf or gnome or BAB +6, Knowledge (dungeoneering) 2 ranks | Dwarf or gnome; or base attack bonus +6 and Knowledge (dungeoneering) 2 ranks. |
| Hammer and Piton | Str 15, Climb 3 ranks | Strength 15, Climb 3 ranks. |
| Favored | Membership in guild, organization, or church | Membership in a guild, church, or other organization. |
| Energy Affinity | Knowledge(arcana) 5 ranks, spells of acid, electricity, fire, cold | Knowledge (arcana) 5 ranks, able to cast at least one spell of each of these energy types: acid, cold, electricity, and fire. |
| Celestial Summoning Specialist | Knowledge (the planes) 2 ranks, Knowledge (religion) 2 ranks, nonevil alignment, summon monster ability | Nonevil alignment, Knowledge (the planes) 2 ranks, Knowledge (religion) 2 ranks, ability to cast any summon monster spell. |
| Fiendish Summoning Specialist | Knowledge (the planes) 2 ranks, Knowledge (religion) 2 ranks, nongood alignment, summon monster ability | Nongood alignment, Knowledge (the planes) 2 ranks, Knowledge (religion) 2 ranks, ability to cast any summon monster spell. |
| Neraph Throw | Wis 15, Knowledge (the planes) 5 ranks | Dex 15, Knowledge (the planes) 5 ranks. |
| Planar Familiar | Ability to acquire new familiar, compatible alignment, sufficient arcane spellcaster level, Knowledge (the planes) 5 ranks | Ability to ac quire a new familiar, compatible alignment, sufficient arcane spellcaster level, Knowledge (the planes) 5 ranks. |
| Improved Elemental Heritage | Air, Earth, Fire or Water Heritage | Air Heritage, Earth Heritage, Fire Heritage, or Water Heritage. |
| Improved Outer Planar Heritage | Anarchic, Axiomatic, Celestial or Fiendish Heritage | Anarchic Heritage, Axiomatic Heritage, Celestial Heritage, or Fiendish Heritage. |
| Holy Ki Strike | Cha 15, Improved Unarmed Strike, Ki strike (lawful), Sanctify Ki Strike | Cha 15, Improved Unarmed Strike, Ki strike (holy), Sanctify Ki Strike. |
| Improved Maneuverability | Fly speed 150, Hover or Wingover | Fly speed 150 feet, Hover or Wingover. |
| Large and in Charge | Natural Reach 10 feet, size Large or Larger | Natural reach of 10 feet or more, size Large or larger. |
| Tempest Breath | Con 13, Breath weapon, Power Attack, size Large or larger | Str 13, breath weapon, Power Attack, size Large or larger. |
| Shock Wave | Str 13, dragon type, size Large or larger, Power Attack | Str 13, dragon, size Large or larger, Power Attack. |
| Snatch and Swallow | Con 19, dragon type, Snatch, Improved Snatch | Con 19, dragon, Snatch, Improved Snatch, size Huge or larger. |
| Rend | Two claw attacks, Str 13, Snatch, Power Attack | Two claw attacks, Str 13, Power Attack, Snatch, size Huge or larger. |
| Suppress Weakness | Energy vulnerability, Iron Will | Vulnerability to energy, Iron Will. |
| Overcome Weakness | Energy vulnerability, Iron Will, Suppress Weakness | Vulnerability to energy, Iron Will, Suppress Weakness. |
| Wingstorm | Str 13, dragon type, fly speed 20, Hover, Power Attack, size Large or Larger. | Str 13, dragon, fly speed 20, Hover, Power Attack, size Large or larger. |
| Double Draconic Aura | Character level 12th, ability to project two draconic auras | Character level 12th, ability to project two different draconic auras. |
| Heart of Dragons | Dragonblood subtype, draconic feat, Knowledge (religion) 3 ranks | Dragonblood subtype, any draconic feat, Knowledge (religion) 3 ranks. |
| Slayer of Dragons | Knowledge (religion) 4 ranks, no dragonblood subtype, no draconic feats | Knowledge (religion) 4 ranks, must not be of the dragonblood subtype, must not have any draconic feats. |
| Dragonfire Channeling | Cha 11, dragonblood subtype, ability to turn/rebuke undead or elementals | Cha 11, dragonblood subtype, ability to turn or rebuke undead or elementals. |
| Initiate of Bahamut | Cleric level 3rd, dragonblood subtype, deity Bahamut | Cleric level 3rd. dragonblood subtype, deity Baharnut. |
| Initiate of Falazure | Cleric level 3rd, dragonblood subtype, deity Falazure | Cleric level 3rd, dragonblood subtype, deity Falaazure. |
| Black Dragon Lineage | Draconic Heritage (black), Sorcerer 3rd | Draconic Heritage (black), sorcerer level 3rd. |
| Blue Dragon Lineage | Draconic Heritage (blue), Sorcerer 3rd | Draconic Heritage (blue), sorcerer level 3rd. |
| Brass Dragon Lineage | Draconic Heritage (brass), Sorcerer 3rd | Draconic Heritage (brass), sorcerer level 3rd. |
| Bronze Dragon Lineage | Draconic Heritage (bronze), Sorcerer 3rd | Draconic Heritage (bronze), sorcerer level 3rd. |
| Copper Dragon Lineage | Draconic Heritage (copper), Sorcerer 3rd | Draconic Heritage (copper), sorcerer level 3rd. |
| Draconic Armor | Draconic Heritage, Sorcerer 1st | Draconic Heritage, sorcerer level 1st. |
| Draconic Knowledge | Draconic Heritage, Sorcerer 1st | Draconic Heritage, sorcerer level 1st. |
| Draconic Vigor | Draconic Heritage, Sorcerer 1st | Draconic Heritage, sorcerer level 1st. |
| Gold Dragon Lineage | Draconic Heritage (gold), Sorcerer 3rd | Draconic Heritage (gold), sorcerer level 3rd. |
| Green Dragon Lineage | Draconic Heritage (green), Sorcerer 3rd | Draconic Heritage (green), sorcerer level 3rd. |
| Red Dragon Lineage | Draconic Heritage (red), Sorcerer 3rd | Draconic Heritage (red), sorcerer level 3rd. |
| Silver Dragon Lineage | Draconic Heritage (silver), Sorcerer 3rd | Draconic Heritage (silver), sorcerer level 3rd. |
| White Dragon Lineage | Draconic Heritage (white), Sorcerer 3rd | Draconic Heritage (white), sorcerer level 3rd. |
| Dragonfire Inspiration | Cha 11, dragonblood subtype, bardic music | Cha 11, dragonblood subtype, bardic. |
| Dragonfire Strike | Cha 11, dragonblood subtype, sneak attack/sudden strike/skirmish | Cha 11, dragonblood subtype, and one of these class features: sneak attack, sudden strike, or skirmish. |
| Contagious Paralysis | Paralysis extraordinary or supernatural ability | Paralysis as an extraordinary or supernatural ability. |
| Eviscerator | Cha 13, undead type, Daunting Presence, Death Master, Improved Critical, BAB +1 | Cha 13, undead type, Death Master, Daunting Presence, Improved Critical, base attack bonus +1. |
| Improved Paralysis | Undead type, paralysis extraordinary ability, Ability Focus (paralysis) | Undead type, paralysis special ability, Ability Focus (paralysis). |
| Lifesense | Cha 13, Con - | Cha 13, Con —(no Constitution score). |
| Clinging Breath | Con 13, Breath weapon | Con 13, breath weapon with recharge time expressed in rounds. |
| Brand of the Nine Hells | Lawful Evil alignment, Devil | Lawful evil, devil. |
| Mark of Avernus | Brand of the Nine Hells, alleigance to Bel | Brand of the Nine Hells, allegiance to Bel. |
| Mark of Cania | Brand of the Nine Hells, alleigance to Mephistopheles | Brand of the Nine Hells, allegiance to Mephistopheles. |
| Mark of Dis | Brand of the Nine Hells, alleigance to Dispater | Brand of the Nine Hells, allegiance to Dispater. |
| Mark of Maladomini | Brand of the Nine Hells, alleigance to Baalzebul | Brand of the Nine Hells, allegiance to Baalzebul. |
| Mark of Malbolge | Brand of the Nine Hells, alleigance to Glasya | Brand of the Nine Hells, allegiance to Glasya. |
| Mark of Minauros | Brand of the Nine Hells, alleigance to Mammon | Brand of the Nine Hells, allegiance to Mammon. |
| Mark of Nessus | Brand of the Nine Hells, alleigance to Asmodeus | Brand of the Nine Hells, allegiance to Asmodeus. |
| Mark of Phlegethos | Brand of the Nine Hells, alleigance to Fierna and Belial | Brand of the Nine Hells, allegiance to Belial or Fierna. |
| Mark of Stygia | Brand of the Nine Hells, alleigance to Levistus | Brand of the Nine Hells, allegiance to Levistus. |
| Supernatural Instincts | Combat Reflexes feat | Combat Reflexes. |
| Vengeful Surge | Iron Will feat | Iron Will. |
| Devil's Favor | Humanoid or Monstrous Humanoid, Pact with a Devil | Pact with devil. |
| Devil's Aura | Humanoid or Monstrous Humanoid, Cha 13, Intimidate 9 ranks, Devil's Favor feat | Cha 13, Intimidate 9 ranks, Devil's Favor. |
| Devil's Flesh | Humanoid or Monstrous Humanoid, Con 15, Devil's Favor feat | Con 15, Devils Favor. |
| Devil's Sight | Humanoid or Monstrous Humanoid, Wis 15, Devil's Favor feat | Wis 15, Devil's Favor. |
| Devil's Stamina | Humanoid or Monstrous Humanoid, base Fortitude save +3, Devil's Favor feat | Devil's Favor, base Fortitude save +3. |
| Devil's Tongue | Humanoid or Monstrous Humanoid, Cha 15, Devil's Favor feat | Cha 15, Devil's Favor. |
| Divine Defiance | Ability to turn or rebuke undead, Divine caster level 3rd | Divine caster level 3rd, ability to turn or rebuke undead. |

## Applied changes (2026-11-10, approved by the user)

The user approved three things: records that agree with the site become `cross-checked`; conflicts are settled from the book in the Kitap folder, or from the site when the book is missing; and the powers file is rebuilt from the EPH. Only srd.dndtools.org and the user's rulebook PDFs were used. `node tools/verify_and_sync.js`: ALL CHECKS PASSED (245/245).

### Feats

- **712 cross-checked** with the site (`provenance.crossCheck`): every `match` and `equivalent` row above, plus *Necrocarnum Acolyte* (the site cell holds the record's prerequisite and some extra Benefit text).
- **66 verified** from the book (`provenance.book` = "Book p.N"). That covers all 40 prerequisite conflicts, 14 of the 17 source-book conflicts and the 13 feats missing from the site. Scanned books (CAdv, CW, BoVD, BoED, HoB, RoD, ToM, PGtF, RoS, OA) were read as page images.
- Source-book conflicts: in each of the 14 settled cases the feat **is** in the record's book. The site lists a different feat of the same name, or a reprint (e.g. *Dark Speech* BoVD p.48 vs FC1). The record keeps its book. *Shifter Defense* (ECS), *Aberration Banemagic* (PGtE) and *Dorje Mastery* (MoE) stay `unverified`, because those books are not in the library and the site does not have their version.
- Site errors found by the book: Appraise Magic Value, Devoted Tracker, Dive for Cover, Hear the Unseen, Natural Bond, Obscure Lore and Hands of a Healer have real prerequisites (the site shows "-"). Melee/Ranged Weapon Mastery need BAB +8. In all of these the record was right.
- Record errors fixed from the book:

| Feat | Before | Book |
|---|---|---|
| `feat-melee-weapon-mastery` | Proficient with selected weapon, Weapon Focus with selected weapon, Weapon Specialization with selected weapon, base attack bonus +8 | Proficiency with selected weapon, Weapon Focus with selected weapon, Weapon Specialization with selected weapon, base attack bonus +8 |
| `feat-ranged-weapon-mastery` | Proficiency with selected weapon, Weapon Focus with selected weapon, Weapon Specialization with selected weapon, Base attack bonus +8 | Proficiency with selected weapon, Weapon Focus with selected weapon, Weapon Specialization with selected weapon, base attack bonus +8 |
| `feat-arterial-strike` | BAB +4, Sneak Attack +1d6 | Sneak attack ability, base attack bonus +4 |
| `feat-spontaneous-wounder` | Knowledge (religion) 4 ranks, nongood | Wis 13, Knowledge (religion) 4 ranks, nongood alignment, able to cast any inflict wounds spell |
| `feat-sacred-healing-cd` | Heal 8 ranks, ability to turn/rebuke undead | Heal 8 ranks, ability to turn undead |
| `feat-sanctify-relic` | Any other item creation feat, caster level 7th | Any other item creation feat |
| `feat-appraise-magic-value` | Appraise 5 ranks, Knowledge (Arcana) 5 ranks, Spellcraft 5 ranks | Appraise 5 ranks, Knowledge (arcana) 5 ranks, Spellcraft 5 ranks |
| `feat-dive-for-cover` | Base Ref +4 | Base Reflex save bonus +4 |
| `feat-hear-the-unseen` | Listen 5 ranks, Blind-fight | Listen 5 ranks, Blind-Fight |
| `feat-obscure-lore` | Bardic Knowledge or lore class feature | Bardic knowledge or lore class feature |
| `feat-dire-stun` | Lurk Augment, Extra Lurk Augment | Lurk augment class feature, Extra Lurk Augment |
| `feat-psionic-mastery` | Able to manifest powers or use psi-like abilities | Ability to manifest psionic powers or use psi-like abilities |
| `feat-metamagic-spell-trigger` | Any metamagic feat, Use Magic Device or Spellcraft 15 ranks | Any metamagic feat, Use Magic Device 15 ranks or Spellcraft 15 ranks |
| `feat-battlecaster-defense` | Combat Casting or warmage edge, base attack bonus +1, Spellcraft 4 ranks | Combat Casting, base attack bonus +1, caster level 1st |
| `feat-spontaneous-domains` | Ability to cast 3rd level spells; access to 2 or more domains | Ability to cast 3rd-level spells, access to two or more cleric domains |
| `feat-retrieve-spell` | Any 2 divine feats, ability to turn or rebuke undead | Any two divine feats, ability to turn or rebuke undead |
| `feat-imbued-healing` | Ability to cast Conjuration (healing) spells, access to 1 or more domains | Ability to cast conjuration (healing) spells; access to one or more domains |
| `feat-umbral-shroud` | Ability to cast 3rd level spells; access to 2 or more domains | Ability to cast 3rd-level spells |
| `feat-moradins-smile` | None | Dwarf |
| `feat-earth-power` | Earth Sense | Con 13, Wis 13, Earth Sense |
| `feat-able-learner` | Human or doppelganger, must take at 1st level | Human or doppelganger |
| `feat-diverse-background` | Half-human, must take at 1st level | Half-human |
| `feat-scorpions-grasp` | Str 13, Dex 13, Improved Unarmed Strike, Improved Grapple | Str 13, Improved Unarmed Strike, Improved Grapple |
| `feat-touchstone` | Knowledge (local) 8 ranks or native 250 gp item | Knowledge (local) 8 ranks for the area in which the touchstone lies, or possession of a touchstone key (a portable object native to the touchstone's area and worth at least 250 gp) |
| `feat-spirit-sense` | Wis 12, near-death experience | Wis 12, must have had a near-death experience (must have fallen below 0 hit points) |
| `feat-bind-vestige` | If you can bind vestiges through other means you cannot take this feat. | None |
| `feat-bonus-essentia` | Con 13, Character level 13th | Con 13, character level 6th |
| `feat-planar-touchstone` | Knowledge (the planes) 8 ranks, object from touchstone site | Portable object of at least 250 gp value native to any designated planar touchstone site, Knowledge (the planes) 8 ranks |
| `feat-personal-touchstone` | Planar Touchstone, Knowledge (the planes) 8 ranks, object from planar touchstone site | Planar Touchstone, a portable object of at least 250 gp value native to a chosen planar touchstone plane, Knowledge (the planes) 8 ranks |
| `feat-spreading-breath` | Con 13, Breath weapon, Shape Breath,  size Small or larger | Con 15, breath weapon, Shape Breath, size Small or larger |
| `feat-endure-blows` | Con 13, dragon type, Toughness | Con 19, dragon type, Toughness |
| `feat-improved-rapidstrike` | BAB +15, Rapidstrike | Dex 9, one or more pairs of natural weapons, aberration, dragon, elemental, magical beast, or plant type, base attack bonus +15, Rapidstrike |
| `feat-lifebond` | Cha 13, undead type | Cha 11, undead type |
| `feat-ocular-spell` | Knowledge (dungeoneering) 4 ranks, 2 or more eyes. | Knowledge (dungeoneering) 4 ranks, two or more eyes |
| `feat-spiritual-force-re` | Kalashtar, ability to generate mind blade | Kalashtar, ability to generate a mind blade |
| `feat-strength-of-two-re` | Kalashtar or Inspired | Kalashtar, ability to generate a mind blade |
| `feat-dark-speech` | Base Will  +5, Int 15, Cha 15 | Base Will save bonus +5, Int 15, Cha 15 |
| `feat-cool-head-oa` | Human, Unicorn clan | Unicorn clan |
| `feat-sea-legs-oa` | Human, Crab clan | Crab clan |
| `feat-axiomatic-strike-pgtf` | Smite Anarchy class feature, any lawful alignment | Smite anarchy class feature, any lawful alignment |
| `feat-extend-spreading-breath` | Con 13, Breath weapon, Shape Breath,  Spreading Breath, size Small or larger | Con 15, breath weapon, Shape Breath, Spreading Breath, size Small or larger |
| `feat-epic-devotion` | Wis 21, Iron Will, alignment different then the chosen component, patron deity who doesn't accept clerics who have the chosen component. | Wis 21, Iron Will, alignment different from the chosen component, patron deity who does not accept clerics who have the chosen component |
| `feat-improved-sudden-strike` | Sudden Strike +8d6 | Sudden strike +8d6 |

- Renamed (id unchanged, the old name kept in `aliases`): Elemental Adapt → **Elemental Adept**; Persistant Refusal → **Persistent Refusal**. Source page fixed: `feat-diverse-background` Races of Destiny p.156 → Races of Destiny p.150.
- `tools/test_derive_sheet.js`: the P3 feat check now also accepts `verified`, but only with a `provenance.book` citation ending in a page number.

### Classes

| Class | Result |
|---|---|
| `cls-archivist` | cross-checked |
| `cls-ardent` | cross-checked |
| `cls-artificer` | cross-checked |
| `cls-binder` | cross-checked |
| `cls-divine-mind` | cross-checked |
| `cls-dragonfire-adept` | cross-checked |
| `cls-incarnate` | cross-checked |
| `cls-lurk` | cross-checked |
| `cls-mystic` | cross-checked |
| `cls-noble` | cross-checked |
| `cls-shadowcaster-not-implemented` | cross-checked |
| `cls-shugenja` | cross-checked |
| `cls-soulborn` | cross-checked |
| `cls-spirit-shaman` | cross-checked |
| `cls-totemist` | cross-checked |
| `cls-truenamer-not-implemented` | cross-checked |
| `cls-wu-jen` | cross-checked |
| `cls-sohei` | cross-checked |
| `cls-healer` | d8 -> d6 |
| `cls-mariner` | Age of Mortals -> Dragonlance Campaign Setting |
| `cls-shaman` | verified, Fort stays poor |

Shaman: the book (OA Table 2-3, p.23) wins over the site. Its Fort is +0 at 1st level, so the record's poor Fort stays. Healer and Mariner take the site value, because their books are not in the library. Note: Mariner now cites *Dragonlance Campaign Setting* but stays in the opt-in `srd_classes_legacy.json` (`3.5-licensed`). The other Dragonlance Campaign Setting classes (*Mystic*, *Noble*) are in `srd_classes_splat.json` as `3.5`. Which chunk Dragonlance classes belong in is a separate decision.

### Powers (`database/srd_powers.json` rebuilt from the EPH)

- **287** EPH powers kept, every one `cross-checked` against `srd/magic/psionics/powers/powersAllCore.html`. Ids and engine fields (`modifiers`, `damageParts`, `modes`, `ruleFlags`, `buffTargetMode`, `tempHpFormula`, `sizeModifier`, `shortDescription`) are kept.
- Field changes against the old records: category 135, castingTime 287, range 287, target 287, learnedAt 141, subschool 112, duration 58, save 20, sr 6, powerPointsCost 16, level 1. Manifesting time, range and target changed on every record. The old data used tokens such as "round" and "touch": 241 powers were "round" (the action economy read that as a standard action) and 257 were "touch". Now the EPH text is used ("1 standard action", "Close (25 ft. + 5 ft./2 levels)").
- Discipline: the old file had Metacreativity and Psychometabolism swapped on many records and used "Kin" for Psychokinesis. Discipline powers are now listed only under their discipline (`{Seer: 4}`, not `{Seer: 4, Psion: 4}`); the spell UI already knows the discipline names. Power point cost is the cost at the lowest listed level (e.g. *Hustle* 3, for psychic warrior 2). *Claws of the Beast* says "see text", so it gets the standard 2 × level − 1 = 1.
- Headers the SRD leaves to another power ("This power functions like X") are copied from X: Cloud Mind, Mass ← Cloud Mind; Concealing Amorpha, Greater ← Concealing Amorpha; Ectoplasmic Cocoon, Mass ← Ectoplasmic Cocoon; Energy Adaptation, Specified ← Energy Adaptation; Fabricate, Greater Psionic ← Fabricate, Psionic; Mind Switch, True ← Mind Switch; Mindlink, Thieving ← Mindlink; Prevenom Weapon ← Prevenom; Reality Revision ← Bend Reality; Recall Death ← Recall Agony; Sense Link, Forced ← Sense Link; Share Pain, Forced ← Share Pain; Teleport, Psionic Greater ← Teleport, Psionic; Time Hop, Mass ← Time Hop; True Creation ← Major Creation, Psionic; Truevenom Weapon ← Truevenom; Weapon of Energy ← Claw of Energy. *Teleport, Psionic Greater* says "As the greater teleport spell", and that spell says "functions like teleport", so its header comes from *Teleport, Psionic*.
- *Minor Creation* (`pwr-minor-creation`) is renamed **Minor Creation, Psionic** (the file had no EPH record for it).
- **153 3.0 records removed.** 37 are the same power renamed; their names are now aliases of the EPH power, so a lookup or snapshot by the old name finds it (checked: "Teleport" → `pwr-teleport-psionic`, "Astral Construct III" → `pwr-astral-construct`). The rest have no 3.5 equivalent. A saved character that knows one keeps its own customDb snapshot.
- `srd_index.json`: removed rows dropped; name, discipline, level and aliases (`a`) refreshed on the kept rows and the two renamed feats. `verify_and_sync.js` adds missing rows but never removes or edits existing ones, so this was done here. Power test count 440 → 287.

| Removed record | Now an alias of |
|---|---|
| Ablating (`pwr-ablating`) | — (no 3.5 power) |
| Adamant Grasp (`pwr-adamant-grasp`) | — (no 3.5 power) |
| Amplified Invisibility (`pwr-amplified-invisibility`) | — (no 3.5 power) |
| Astral Construct I (`pwr-astral-construct-i`) | Astral Construct |
| Astral Construct II (`pwr-astral-construct-ii`) | Astral Construct |
| Astral Construct III (`pwr-astral-construct-iii`) | Astral Construct |
| Astral Construct IV (`pwr-astral-construct-iv`) | Astral Construct |
| Astral Construct IX (`pwr-astral-construct-ix`) | Astral Construct |
| Astral Construct V (`pwr-astral-construct-v`) | Astral Construct |
| Astral Construct VI (`pwr-astral-construct-vi`) | Astral Construct |
| Astral Construct VII (`pwr-astral-construct-vii`) | Astral Construct |
| Astral Construct VIII (`pwr-astral-construct-viii`) | Astral Construct |
| Astral Projection (`pwr-astral-projection`) | — (no 3.5 power) |
| Astral Steed (`pwr-astral-steed`) | — (no 3.5 power) |
| Augury (`pwr-augury`) | — (no 3.5 power) |
| Banishment (`pwr-banishment`) | Banishment, Psionic |
| Biocurrent (`pwr-biocurrent`) | — (no 3.5 power) |
| Bite of the Tiger (`pwr-bite-of-the-tiger`) | — (no 3.5 power) |
| Breath of the Dragon (`pwr-breath-of-the-dragon`) | — (no 3.5 power) |
| Brilliant Blast (`pwr-brilliant-blast`) | — (no 3.5 power) |
| Burning Ray (`pwr-burning-ray`) | — (no 3.5 power) |
| Call Cohort (`pwr-call-cohort`) | — (no 3.5 power) |
| Charm Monster (`pwr-charm-monster`) | — (no 3.5 power) |
| Charm Person (`pwr-charm-person`) | — (no 3.5 power) |
| Clairaudience/Clairvoyance (`pwr-clairaudience-clairvoyance`) | — (no 3.5 power) |
| Clairtangency (`pwr-clairtangency`) | — (no 3.5 power) |
| Claws of the Bear (`pwr-claws-of-the-bear`) | — (no 3.5 power) |
| Combat Precognition (`pwr-combat-precognition`) | — (no 3.5 power) |
| Combat Prescience (`pwr-combat-prescience`) | — (no 3.5 power) |
| Concussion (`pwr-concussion`) | — (no 3.5 power) |
| Cone of Sound (`pwr-cone-of-sound`) | — (no 3.5 power) |
| Confidante (`pwr-confidante`) | — (no 3.5 power) |
| Contingency (`pwr-contingency`) | Contingency, Psionic |
| Control Shadow (`pwr-control-shadow`) | — (no 3.5 power) |
| Create Food and Water (`pwr-create-food-and-water`) | — (no 3.5 power) |
| Darkvision (`pwr-darkvision`) | Darkvision, Psionic |
| Daze (`pwr-daze`) | Daze, Psionic |
| Detect Poison (`pwr-detect-poison`) | — (no 3.5 power) |
| Detect Thoughts (`pwr-detect-thoughts`) | — (no 3.5 power) |
| Detonation (`pwr-detonation`) | — (no 3.5 power) |
| Dimension Door (`pwr-dimension-door`) | Dimension Door, Psionic |
| Dimensional Anchor (`pwr-dimensional-anchor`) | Dimensional Anchor, Psionic |
| Disintegrate (`pwr-disintegrate`) | Disintegrate, Psionic |
| Dismissal (`pwr-dismissal`) | Dismissal, Psionic |
| Displacement (`pwr-displacement`) | — (no 3.5 power) |
| Dissolution (`pwr-dissolution`) | — (no 3.5 power) |
| Divination (`pwr-divination`) | Divination, Psionic |
| Domination (`pwr-domination`) | — (no 3.5 power) |
| Duodimensional Hand (`pwr-duodimensional-hand`) | — (no 3.5 power) |
| Ecto Puppet (`pwr-ecto-puppet`) | — (no 3.5 power) |
| Ectoplasmic Armor (`pwr-ectoplasmic-armor`) | — (no 3.5 power) |
| Emulate Power (`pwr-emulate-power`) | — (no 3.5 power) |
| Energy Barrier (`pwr-energy-barrier`) | — (no 3.5 power) |
| Ethereal Jaunt (`pwr-ethereal-jaunt`) | Ethereal Jaunt, Psionic |
| Etherealness (`pwr-etherealness`) | Etherealness, Psionic |
| Expanded Vision (`pwr-expanded-vision`) | — (no 3.5 power) |
| Fabricate (`pwr-fabricate`) | Fabricate, Psionic |
| Far Punch (`pwr-far-punch`) | — (no 3.5 power) |
| Fatal Attraction (`pwr-fatal-attraction`) | — (no 3.5 power) |
| Feather Fall (`pwr-feather-fall`) | — (no 3.5 power) |
| Feel Light (`pwr-feel-light`) | — (no 3.5 power) |
| Feel Sound (`pwr-feel-sound`) | — (no 3.5 power) |
| Finger of Fire (`pwr-finger-of-fire`) | — (no 3.5 power) |
| Firefall (`pwr-firefall`) | — (no 3.5 power) |
| Flaming Shroud (`pwr-flaming-shroud`) | — (no 3.5 power) |
| Fly (`pwr-fly`) | Fly, Psionic |
| Forced Mindlink (`pwr-forced-mindlink`) | — (no 3.5 power) |
| Foresight (`pwr-foresight`) | — (no 3.5 power) |
| Freedom of Movement (`pwr-freedom-of-movement`) | Freedom of Movement, Psionic |
| Glide (`pwr-glide`) | — (no 3.5 power) |
| Grease (`pwr-grease`) | Grease, Psionic |
| Greater Biocurrent (`pwr-greater-biocurrent`) | — (no 3.5 power) |
| Greater Concussion (`pwr-greater-concussion`) | — (no 3.5 power) |
| Greater Domination (`pwr-greater-domination`) | — (no 3.5 power) |
| Greater Emulation (`pwr-greater-emulation`) | — (no 3.5 power) |
| Hear Light (`pwr-hear-light`) | — (no 3.5 power) |
| Identify (`pwr-identify`) | Identify, Psionic |
| Improved Anchored Navigation (`pwr-improved-anchored-navigation`) | — (no 3.5 power) |
| Improved Biofeedback (`pwr-improved-biofeedback`) | — (no 3.5 power) |
| Improved Clairtangency (`pwr-improved-clairtangency`) | — (no 3.5 power) |
| Improved Etherealness (`pwr-improved-etherealness`) | — (no 3.5 power) |
| Improved Fabricate (`pwr-improved-fabricate`) | — (no 3.5 power) |
| Improved Fly (`pwr-improved-fly`) | — (no 3.5 power) |
| Improved Telekinesis (`pwr-improved-telekinesis`) | — (no 3.5 power) |
| Improved Vigor (`pwr-improved-vigor`) | — (no 3.5 power) |
| Inkling (`pwr-inkling`) | — (no 3.5 power) |
| Intrusive Sense Link (`pwr-intrusive-sense-link`) | — (no 3.5 power) |
| Invisibility (`pwr-invisibility`) | — (no 3.5 power) |
| Invisibility Purge (`pwr-invisibility-purge`) | — (no 3.5 power) |
| Iron Body (`pwr-iron-body`) | Iron Body, Psionic |
| Knock (`pwr-knock`) | Knock, Psionic |
| Know Direction (`pwr-know-direction`) | — (no 3.5 power) |
| Know Location (`pwr-know-location`) | — (no 3.5 power) |
| Lesser Body Adjustment (`pwr-lesser-body-adjustment`) | — (no 3.5 power) |
| Lesser Concussion (`pwr-lesser-concussion`) | — (no 3.5 power) |
| Lesser Domination (`pwr-lesser-domination`) | — (no 3.5 power) |
| Lesser Metaphysical Weapon (`pwr-lesser-metaphysical-weapon`) | — (no 3.5 power) |
| Lesser Mindlink (`pwr-lesser-mindlink`) | — (no 3.5 power) |
| Lesser Natural Armor (`pwr-lesser-natural-armor`) | — (no 3.5 power) |
| Levitate (`pwr-levitate`) | Levitate, Psionic |
| Major Creation (`pwr-major-creation`) | Major Creation, Psionic |
| Mass Cocoon (`pwr-mass-cocoon`) | — (no 3.5 power) |
| Mass Concussion (`pwr-mass-concussion`) | — (no 3.5 power) |
| Mass Domination (`pwr-mass-domination`) | — (no 3.5 power) |
| Mass Suggestion (`pwr-mass-suggestion`) | — (no 3.5 power) |
| Matter Rearrangement (`pwr-matter-rearrangement`) | — (no 3.5 power) |
| Mind Blank (`pwr-mind-blank`) | Mind Blank, Psionic |
| Mind Store (`pwr-mind-store`) | — (no 3.5 power) |
| Monster Domination (`pwr-monster-domination`) | — (no 3.5 power) |
| Natural Armor (`pwr-natural-armor`) | — (no 3.5 power) |
| Negate Psionics (`pwr-negate-psionics`) | — (no 3.5 power) |
| Nondetection (`pwr-nondetection`) | — (no 3.5 power) |
| Painful Touch (`pwr-painful-touch`) | — (no 3.5 power) |
| Phase Door (`pwr-phase-door`) | Phase Door, Psionic |
| Plane Shift (`pwr-plane-shift`) | Plane Shift, Psionic |
| Poison Sense (`pwr-poison-sense`) | — (no 3.5 power) |
| Polymorph Self (`pwr-polymorph-self`) | — (no 3.5 power) |
| Power Turning (`pwr-power-turning`) | — (no 3.5 power) |
| Probability Travel (`pwr-probability-travel`) | — (no 3.5 power) |
| Psycholuminescence (`pwr-psycholuminescence`) | — (no 3.5 power) |
| Recall Pain (`pwr-recall-pain`) | — (no 3.5 power) |
| Rejuvenation (`pwr-rejuvenation`) | — (no 3.5 power) |
| See Invisibility (`pwr-see-invisibility`) | — (no 3.5 power) |
| See Sound (`pwr-see-sound`) | — (no 3.5 power) |
| Sending (`pwr-sending`) | — (no 3.5 power) |
| Sense Psionics (`pwr-sense-psionics`) | — (no 3.5 power) |
| Sense Psychoportation (`pwr-sense-psychoportation`) | — (no 3.5 power) |
| Sequester (`pwr-sequester`) | Sequester, Psionic |
| Sever the Tie (`pwr-sever-the-tie`) | — (no 3.5 power) |
| Shapechange (`pwr-shapechange`) | — (no 3.5 power) |
| Shield of Prudence (`pwr-shield-of-prudence`) | — (no 3.5 power) |
| Spider Climb (`pwr-spider-climb`) | — (no 3.5 power) |
| Steadfast Gaze (`pwr-steadfast-gaze`) | — (no 3.5 power) |
| Sudden Minor Creation (`pwr-sudden-minor-creation`) | — (no 3.5 power) |
| Suggestion (`pwr-suggestion`) | Suggestion, Psionic |
| Tailor Memory (`pwr-tailor-memory`) | — (no 3.5 power) |
| Talons (`pwr-talons`) | — (no 3.5 power) |
| Telekinesis (`pwr-telekinesis`) | — (no 3.5 power) |
| Telekinetic Sphere (`pwr-telekinetic-sphere`) | Telekinetic Sphere, Psionic |
| Teleport (`pwr-teleport`) | Teleport, Psionic |
| Teleport without Error (`pwr-teleport-without-error`) | — (no 3.5 power) |
| Temporal Velocity (`pwr-temporal-velocity`) | — (no 3.5 power) |
| Thrall (`pwr-thrall`) | — (no 3.5 power) |
| Trinket (`pwr-trinket`) | — (no 3.5 power) |
| True Concussion (`pwr-true-concussion`) | — (no 3.5 power) |
| True Domination (`pwr-true-domination`) | — (no 3.5 power) |
| True Seeing (`pwr-true-seeing`) | True Seeing, Psionic |
| True Telekinesis (`pwr-true-telekinesis`) | — (no 3.5 power) |
| Undead Sense (`pwr-undead-sense`) | — (no 3.5 power) |
| Valor (`pwr-valor`) | — (no 3.5 power) |
| Verve (`pwr-verve`) | — (no 3.5 power) |
| Vigilance (`pwr-vigilance`) | — (no 3.5 power) |
| Whitefire (`pwr-whitefire`) | — (no 3.5 power) |

### Still open (not part of this approval)

- 569 feats from books the site does not cover. Many of those books are in Kitap (Races of Faerûn, Player's Guide to Faerûn, Races of Eberron, Savage Species, Oriental Adventures, Book of Vile Darkness, Magic of Faerûn, Lords of Darkness), so a book pass can verify them.
- 21 base classes not on the site. 13 are from Unearthed Arcana (12 racial paragons + Cloistered Cleric), which is in Kitap.
