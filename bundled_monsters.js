/**
 * D&D 3.5e SRD Official Bestiary / Monster Database
 * Conforms strictly to D&D 3.5e RAW rules, Monster Manual & SRD.
 * Rule: NO dummy data, accurate SRD statblocks.
 */

window.DND35_SRD_MONSTERS = [
  {
    id: "kobold",
    name: "Kobold",
    cr: "1/6",
    crNumeric: 0.16,
    size: "Small",
    sizeMod: 1,
    type: "Humanoid (Reptilian)",
    hitDice: "1d8",
    hitDiceStr: "Humanoid (Warrior 1)",
    hp: 4,
    initiative: 1,
    speed: "30 ft. (6 squares)",
    baseSpeed: 30,
    armorBonus: 2,
    shieldBonus: 0,
    naturalArmor: 1,
    deflection: 0,
    ac: 15,
    touchAc: 12,
    flatFootedAc: 14,
    bab: 1,
    grapple: -4,
    abilities: { str: 9, dex: 13, con: 10, int: 10, wis: 9, cha: 8 },
    saves: { fort: 2, ref: 1, will: -1 },
    attacks: [
      {
        name: "Spear",
        type: "Melee",
        bonus: 1,
        damage: "1d6-1",
        crit: "20/x3",
        damageType: "Piercing",
        range: "-"
      },
      {
        name: "Sling",
        type: "Ranged",
        bonus: 3,
        damage: "1d3-1",
        crit: "20/x2",
        damageType: "Bludgeoning",
        range: "50 ft."
      }
    ],
    skills: [
      { name: "Craft (Trapmaking)", mod: 2 },
      { name: "Hide", mod: 6 },
      { name: "Listen", mod: 2 },
      { name: "Move Silently", mod: 2 },
      { name: "Profession (Miner)", mod: 2 },
      { name: "Search", mod: 2 },
      { name: "Spot", mod: 2 }
    ],
    feats: [
      { name: "Alertness" }
    ],
    specialAbilities: [
      { name: "Darkvision 60 ft.", type: "Ex", description: "Kobolds can see in the dark up to 60 feet." },
      { name: "Light Sensitivity", type: "Ex", description: "Dazzled in bright sunlight or within the radius of a daylight spell (-1 to attack rolls, Search, and Spot checks)." }
    ],
    description: "Kobolds are craven reptilian humanoids that worship evil dragons and dwell in underground warrens."
  },
  {
    id: "goblin",
    name: "Goblin",
    cr: "1/3",
    crNumeric: 0.33,
    size: "Small",
    sizeMod: 1,
    type: "Humanoid (Goblinoid)",
    hitDice: "1d8+1",
    hitDiceStr: "Humanoid (Warrior 1)",
    hp: 5,
    initiative: 1,
    speed: "30 ft. (6 squares)",
    baseSpeed: 30,
    armorBonus: 2,
    shieldBonus: 1,
    naturalArmor: 0,
    deflection: 0,
    ac: 15,
    touchAc: 12,
    flatFootedAc: 14,
    bab: 1,
    grapple: -3,
    abilities: { str: 11, dex: 13, con: 12, int: 10, wis: 9, cha: 6 },
    saves: { fort: 3, ref: 1, will: -1 },
    attacks: [
      {
        name: "Morningstar",
        type: "Melee",
        bonus: 2,
        damage: "1d6",
        crit: "20/x2",
        damageType: "Bludgeoning/Piercing",
        range: "-"
      },
      {
        name: "Javelin",
        type: "Ranged",
        bonus: 3,
        damage: "1d4",
        crit: "20/x2",
        damageType: "Piercing",
        range: "30 ft."
      }
    ],
    skills: [
      { name: "Hide", mod: 5 },
      { name: "Listen", mod: 2 },
      { name: "Move Silently", mod: 5 },
      { name: "Ride", mod: 4 },
      { name: "Spot", mod: 2 }
    ],
    feats: [
      { name: "Alertness" }
    ],
    specialAbilities: [
      { name: "Darkvision 60 ft.", type: "Ex", description: "Goblins can see in the dark up to 60 feet." }
    ],
    description: "Goblins are small, black-hearted humanoids that lair in caves and underground dungeons."
  },
  {
    id: "skeleton_warrior",
    name: "Skeleton (Human Warrior)",
    cr: "1/3",
    crNumeric: 0.33,
    size: "Medium",
    sizeMod: 0,
    type: "Undead",
    hitDice: "1d12",
    hitDiceStr: "Undead 1",
    hp: 6,
    initiative: 5,
    speed: "30 ft. (6 squares)",
    baseSpeed: 30,
    armorBonus: 0,
    shieldBonus: 2,
    naturalArmor: 2,
    deflection: 0,
    ac: 15,
    touchAc: 11,
    flatFootedAc: 14,
    bab: 0,
    grapple: 1,
    abilities: { str: 13, dex: 13, con: 10, int: 10, wis: 10, cha: 1 },
    saves: { fort: 0, ref: 1, will: 2 },
    attacks: [
      {
        name: "Scimitar",
        type: "Melee",
        bonus: 1,
        damage: "1d6+1",
        crit: "18-20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Claw",
        type: "Natural",
        bonus: 1,
        damage: "1d4+1",
        crit: "20/x2",
        damageType: "Bludgeoning/Slashing",
        range: "-"
      }
    ],
    skills: [],
    feats: [
      { name: "Improved Initiative" }
    ],
    specialAbilities: [
      { name: "Damage Reduction 5/Bludgeoning", type: "Ex", description: "A skeleton takes 5 less damage from weapons that do not deal bludgeoning damage." },
      { name: "Immunity to Cold", type: "Ex", description: "Immune to cold damage." },
      { name: "Undead Traits", type: "Ex", description: "Immune to mind-affecting effects, poison, sleep, paralysis, stunning, disease, and death effects." },
      { name: "Darkvision 60 ft.", type: "Ex", description: "Can see in total darkness." }
    ],
    description: "Skeletons are the animated bones of the dead, mindless automatons that obey the orders of their evil masters."
  },
  {
    id: "orc_warrior",
    name: "Orc (Warrior 1)",
    cr: "1/2",
    crNumeric: 0.5,
    size: "Medium",
    sizeMod: 0,
    type: "Humanoid (Orc)",
    hitDice: "1d8+1",
    hitDiceStr: "Humanoid (Warrior 1)",
    hp: 5,
    initiative: 0,
    speed: "30 ft. (6 squares)",
    baseSpeed: 30,
    armorBonus: 3,
    shieldBonus: 0,
    naturalArmor: 0,
    deflection: 0,
    ac: 13,
    touchAc: 10,
    flatFootedAc: 13,
    bab: 1,
    grapple: 4,
    abilities: { str: 17, dex: 11, con: 12, int: 8, wis: 7, cha: 6 },
    saves: { fort: 3, ref: 0, will: -2 },
    attacks: [
      {
        name: "Falchion",
        type: "Melee",
        bonus: 4,
        damage: "2d4+4",
        crit: "18-20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Javelin",
        type: "Ranged",
        bonus: 1,
        damage: "1d6+3",
        crit: "20/x2",
        damageType: "Piercing",
        range: "30 ft."
      }
    ],
    skills: [
      { name: "Listen", mod: 1 },
      { name: "Spot", mod: 1 }
    ],
    feats: [
      { name: "Alertness" }
    ],
    specialAbilities: [
      { name: "Darkvision 60 ft.", type: "Ex", description: "Orcs can see in the dark up to 60 feet." },
      { name: "Light Sensitivity", type: "Ex", description: "Dazzled in bright sunlight (-1 on attack rolls, Search, and Spot checks)." }
    ],
    description: "Orcs are aggressive humanoid savages that raid, pillage, and battle with civilized races."
  },
  {
    id: "zombie_commoner",
    name: "Zombie (Human Commoner)",
    cr: "1/2",
    crNumeric: 0.5,
    size: "Medium",
    sizeMod: 0,
    type: "Undead",
    hitDice: "2d12+3",
    hitDiceStr: "Undead 2",
    hp: 16,
    initiative: -1,
    speed: "30 ft. (6 squares)",
    baseSpeed: 30,
    armorBonus: 0,
    shieldBonus: 0,
    naturalArmor: 2,
    deflection: 0,
    ac: 11,
    touchAc: 9,
    flatFootedAc: 11,
    bab: 1,
    grapple: 2,
    abilities: { str: 12, dex: 8, con: 10, int: 10, wis: 10, cha: 1 },
    saves: { fort: 0, ref: -1, will: 3 },
    attacks: [
      {
        name: "Slam",
        type: "Natural",
        bonus: 2,
        damage: "1d6+1",
        crit: "20/x2",
        damageType: "Bludgeoning",
        range: "-"
      },
      {
        name: "Club",
        type: "Melee",
        bonus: 2,
        damage: "1d6+1",
        crit: "20/x2",
        damageType: "Bludgeoning",
        range: "-"
      }
    ],
    skills: [],
    feats: [
      { name: "Toughness" }
    ],
    specialAbilities: [
      { name: "Single Actions Only", type: "Ex", description: "Zombies have poor reflexes and can perform only a single move action or standard action each round." },
      { name: "Damage Reduction 5/Slashing", type: "Ex", description: "Takes 5 less damage from non-slashing weapons." },
      { name: "Undead Traits", type: "Ex", description: "Immune to mind effects, poison, paralysis, disease." },
      { name: "Darkvision 60 ft.", type: "Ex", description: "Can see in total darkness." }
    ],
    description: "Zombies are corpses reanimated by dark and foul magic, moving with relentless, clumsy hunger."
  },
  {
    id: "wolf",
    name: "Wolf",
    cr: "1",
    crNumeric: 1,
    size: "Medium",
    sizeMod: 0,
    type: "Animal",
    hitDice: "2d8+4",
    hitDiceStr: "Animal 2",
    hp: 13,
    initiative: 2,
    speed: "50 ft. (10 squares)",
    baseSpeed: 50,
    armorBonus: 0,
    shieldBonus: 0,
    naturalArmor: 2,
    deflection: 0,
    ac: 14,
    touchAc: 12,
    flatFootedAc: 12,
    bab: 1,
    grapple: 2,
    abilities: { str: 13, dex: 15, con: 15, int: 2, wis: 12, cha: 6 },
    saves: { fort: 5, ref: 5, will: 1 },
    attacks: [
      {
        name: "Bite",
        type: "Natural",
        bonus: 3,
        damage: "1d6+1",
        crit: "20/x2",
        damageType: "Piercing/Slashing",
        range: "-"
      }
    ],
    skills: [
      { name: "Hide", mod: 2 },
      { name: "Listen", mod: 3 },
      { name: "Move Silently", mod: 3 },
      { name: "Spot", mod: 3 },
      { name: "Survival", mod: 1 }
    ],
    feats: [
      { name: "Track" },
      { name: "Weapon Focus (Bite)" }
    ],
    specialAbilities: [
      { name: "Trip", type: "Ex", description: "A wolf that hits with a bite attack can attempt to trip the opponent (+1 check) as a free action without making a touch attack or provoking an attack of opportunity." },
      { name: "Scent", type: "Ex", description: "Can detect approaching enemies, sniff out hidden foes, and track by sense of smell." },
      { name: "Low-Light Vision", type: "Ex", description: "Can see twice as far as a human in starlight, moonlight, and similar low-light conditions." }
    ],
    description: "Wolves are pack hunters known for their persistence, cunning maneuvers, and coordination."
  },
  {
    id: "ghoul",
    name: "Ghoul",
    cr: "1",
    crNumeric: 1,
    size: "Medium",
    sizeMod: 0,
    type: "Undead",
    hitDice: "2d12",
    hitDiceStr: "Undead 2",
    hp: 13,
    initiative: 2,
    speed: "30 ft. (6 squares)",
    baseSpeed: 30,
    armorBonus: 0,
    shieldBonus: 0,
    naturalArmor: 2,
    deflection: 0,
    ac: 14,
    touchAc: 12,
    flatFootedAc: 12,
    bab: 1,
    grapple: 2,
    abilities: { str: 13, dex: 15, con: 10, int: 13, wis: 14, cha: 12 },
    saves: { fort: 0, ref: 2, will: 5 },
    attacks: [
      {
        name: "Bite",
        type: "Natural",
        bonus: 2,
        damage: "1d6+1",
        crit: "20/x2",
        damageType: "Piercing/Slashing",
        range: "-"
      },
      {
        name: "Claw 1",
        type: "Natural",
        bonus: 0,
        damage: "1d3",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Claw 2",
        type: "Natural",
        bonus: 0,
        damage: "1d3",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      }
    ],
    skills: [
      { name: "Balance", mod: 6 },
      { name: "Climb", mod: 5 },
      { name: "Hide", mod: 6 },
      { name: "Jump", mod: 5 },
      { name: "Move Silently", mod: 6 },
      { name: "Spot", mod: 6 }
    ],
    feats: [
      { name: "Multiattack" }
    ],
    specialAbilities: [
      { name: "Ghoul Fever", type: "Su", description: "Bite transmits disease: Fortitude DC 12, incubation 1 day, damage 1d3 Con and 1d3 Dex." },
      { name: "Paralysis", type: "Ex", description: "Those hit by a ghoul's bite or claw must succeed on a DC 12 Fortitude save or be paralyzed for 1d4+1 rounds (Elves are immune)." },
      { name: "+2 Turn Resistance", type: "Ex", description: "Treated as 2 Hit Dice higher for turn or rebuke undead attempts." },
      { name: "Undead Traits", type: "Ex", description: "Immunity to poison, sleep, paralysis, stunning, disease." },
      { name: "Darkvision 60 ft.", type: "Ex", description: "Can see in total darkness." }
    ],
    description: "Ghouls are feral, corpse-eating undead that haunt graveyards, crypts, and ancient barrows."
  },
  {
    id: "gnoll",
    name: "Gnoll",
    cr: "1",
    crNumeric: 1,
    size: "Medium",
    sizeMod: 0,
    type: "Humanoid (Gnoll)",
    hitDice: "2d8+2",
    hitDiceStr: "Humanoid 2",
    hp: 11,
    initiative: 0,
    speed: "30 ft. (6 squares)",
    baseSpeed: 30,
    armorBonus: 2,
    shieldBonus: 2,
    naturalArmor: 1,
    deflection: 0,
    ac: 15,
    touchAc: 10,
    flatFootedAc: 15,
    bab: 1,
    grapple: 3,
    abilities: { str: 15, dex: 10, con: 13, int: 8, wis: 11, cha: 8 },
    saves: { fort: 4, ref: 0, will: 0 },
    attacks: [
      {
        name: "Battleaxe",
        type: "Melee",
        bonus: 3,
        damage: "1d8+2",
        crit: "20/x3",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Shortbow",
        type: "Ranged",
        bonus: 1,
        damage: "1d6",
        crit: "20/x3",
        damageType: "Piercing",
        range: "60 ft."
      }
    ],
    skills: [
      { name: "Listen", mod: 2 },
      { name: "Spot", mod: 3 }
    ],
    feats: [
      { name: "Power Attack" }
    ],
    specialAbilities: [
      { name: "Darkvision 60 ft.", type: "Ex", description: "Can see in total darkness up to 60 feet." }
    ],
    description: "Gnolls are hyena-headed humanoid marauders who strike from the shadows in search of slaves and plunder."
  },
  {
    id: "bugbear",
    name: "Bugbear",
    cr: "2",
    crNumeric: 2,
    size: "Medium",
    sizeMod: 0,
    type: "Humanoid (Goblinoid)",
    hitDice: "3d8+3",
    hitDiceStr: "Humanoid 3",
    hp: 16,
    initiative: 1,
    speed: "30 ft. (6 squares)",
    baseSpeed: 30,
    armorBonus: 2,
    shieldBonus: 1,
    naturalArmor: 3,
    deflection: 0,
    ac: 17,
    touchAc: 11,
    flatFootedAc: 16,
    bab: 2,
    grapple: 4,
    abilities: { str: 15, dex: 12, con: 13, int: 10, wis: 10, cha: 9 },
    saves: { fort: 2, ref: 4, will: 1 },
    attacks: [
      {
        name: "Morningstar",
        type: "Melee",
        bonus: 5,
        damage: "1d8+2",
        crit: "20/x2",
        damageType: "Bludgeoning/Piercing",
        range: "-"
      },
      {
        name: "Javelin",
        type: "Ranged",
        bonus: 3,
        damage: "1d6+2",
        crit: "20/x2",
        damageType: "Piercing",
        range: "30 ft."
      }
    ],
    skills: [
      { name: "Climb", mod: 3 },
      { name: "Hide", mod: 4 },
      { name: "Listen", mod: 4 },
      { name: "Move Silently", mod: 6 },
      { name: "Spot", mod: 4 }
    ],
    feats: [
      { name: "Alertness" },
      { name: "Weapon Focus (Morningstar)" }
    ],
    specialAbilities: [
      { name: "Darkvision 60 ft.", type: "Ex", description: "Can see in total darkness up to 60 feet." },
      { name: "Scent", type: "Ex", description: "Can detect enemies by smell." }
    ],
    description: "Bugbears are the largest and most ferocious of the goblinoid races, towering over their smaller cousins."
  },
  {
    id: "troglodyte",
    name: "Troglodyte",
    cr: "1",
    crNumeric: 1,
    size: "Medium",
    sizeMod: 0,
    type: "Humanoid (Reptilian)",
    hitDice: "2d8+4",
    hitDiceStr: "Humanoid 2",
    hp: 13,
    initiative: -1,
    speed: "30 ft. (6 squares)",
    baseSpeed: 30,
    armorBonus: 0,
    shieldBonus: 0,
    naturalArmor: 6,
    deflection: 0,
    ac: 15,
    touchAc: 9,
    flatFootedAc: 15,
    bab: 1,
    grapple: 1,
    abilities: { str: 10, dex: 9, con: 14, int: 8, wis: 10, cha: 10 },
    saves: { fort: 5, ref: -1, will: 0 },
    attacks: [
      {
        name: "Club",
        type: "Melee",
        bonus: 1,
        damage: "1d6",
        crit: "20/x2",
        damageType: "Bludgeoning",
        range: "-"
      },
      {
        name: "Claw",
        type: "Natural",
        bonus: -1,
        damage: "1d4",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Bite",
        type: "Natural",
        bonus: -1,
        damage: "1d4",
        crit: "20/x2",
        damageType: "Piercing/Slashing",
        range: "-"
      },
      {
        name: "Javelin",
        type: "Ranged",
        bonus: 1,
        damage: "1d6",
        crit: "20/x2",
        damageType: "Piercing",
        range: "30 ft."
      }
    ],
    skills: [
      { name: "Hide", mod: 5 },
      { name: "Listen", mod: 3 }
    ],
    feats: [
      { name: "Multiattack" },
      { name: "Weapon Focus (Javelin)" }
    ],
    specialAbilities: [
      { name: "Stench", type: "Ex", description: "When angry or frightened, secretes oily chemical: all living creatures within 30 ft. must succeed on a DC 13 Fortitude save or be sickened for 10 rounds." },
      { name: "Darkvision 90 ft.", type: "Ex", description: "Superior darkvision in total darkness." }
    ],
    description: "Troglodytes are subterranean reptilian savages renowned for their unbearable stench and predatory cunning."
  },
  {
    id: "ogre",
    name: "Ogre",
    cr: "3",
    crNumeric: 3,
    size: "Large",
    sizeMod: -1,
    type: "Giant",
    hitDice: "4d8+11",
    hitDiceStr: "Giant 4",
    hp: 29,
    initiative: -1,
    speed: "30 ft. (40 ft. base, hide armor)",
    baseSpeed: 30,
    armorBonus: 3,
    shieldBonus: 0,
    naturalArmor: 5,
    deflection: 0,
    ac: 16,
    touchAc: 8,
    flatFootedAc: 16,
    bab: 3,
    grapple: 12,
    abilities: { str: 21, dex: 8, con: 15, int: 6, wis: 10, cha: 7 },
    saves: { fort: 6, ref: 0, will: 1 },
    attacks: [
      {
        name: "Greatclub",
        type: "Melee",
        bonus: 8,
        damage: "2d8+7",
        crit: "20/x2",
        damageType: "Bludgeoning",
        range: "-"
      },
      {
        name: "Javelin",
        type: "Ranged",
        bonus: 1,
        damage: "1d8+5",
        crit: "20/x2",
        damageType: "Piercing",
        range: "30 ft."
      }
    ],
    skills: [
      { name: "Climb", mod: 5 },
      { name: "Listen", mod: 2 },
      { name: "Spot", mod: 2 }
    ],
    feats: [
      { name: "Toughness" },
      { name: "Weapon Focus (Greatclub)" }
    ],
    specialAbilities: [
      { name: "Darkvision 60 ft.", type: "Ex", description: "Can see in total darkness." },
      { name: "Low-Light Vision", type: "Ex", description: "Can see twice as far as human in dim light." }
    ],
    description: "Ogres are hulking brutes that feed on flesh, bully the weak, and smash everything in their path."
  },
  {
    id: "wight",
    name: "Wight",
    cr: "3",
    crNumeric: 3,
    size: "Medium",
    sizeMod: 0,
    type: "Undead",
    hitDice: "4d12",
    hitDiceStr: "Undead 4",
    hp: 26,
    initiative: 1,
    speed: "30 ft. (6 squares)",
    baseSpeed: 30,
    armorBonus: 0,
    shieldBonus: 0,
    naturalArmor: 4,
    deflection: 0,
    ac: 15,
    touchAc: 11,
    flatFootedAc: 14,
    bab: 2,
    grapple: 3,
    abilities: { str: 12, dex: 12, con: 10, int: 11, wis: 13, cha: 15 },
    saves: { fort: 1, ref: 2, will: 5 },
    attacks: [
      {
        name: "Slam",
        type: "Natural",
        bonus: 3,
        damage: "1d4+1",
        crit: "20/x2",
        damageType: "Bludgeoning plus Energy Drain",
        range: "-"
      }
    ],
    skills: [
      { name: "Hide", mod: 8 },
      { name: "Listen", mod: 7 },
      { name: "Move Silently", mod: 16 },
      { name: "Spot", mod: 7 }
    ],
    feats: [
      { name: "Alertness" },
      { name: "Blind-Fight" }
    ],
    specialAbilities: [
      { name: "Energy Drain", type: "Su", description: "Living creature hit by slam takes 1 negative level. DC 14 Fortitude save to remove after 24 hours." },
      { name: "Create Spawn", type: "Su", description: "Any humanoid slain by a wight becomes a wight in 1d4 rounds under its control." },
      { name: "Undead Traits", type: "Ex", description: "Immune to mind effects, poison, sleep, paralysis, stunning." },
      { name: "Darkvision 60 ft.", type: "Ex", description: "Can see in total darkness." }
    ],
    description: "A wight's appearance is a weird and twisted reflection of the form it had in life, driven by pure malice."
  },
  {
    id: "gargoyle",
    name: "Gargoyle",
    cr: "4",
    crNumeric: 4,
    size: "Medium",
    sizeMod: 0,
    type: "Monstrous Humanoid (Earth)",
    hitDice: "4d8+19",
    hitDiceStr: "Monstrous Humanoid 4",
    hp: 37,
    initiative: 2,
    speed: "40 ft. (8 squares), fly 60 ft. (average)",
    baseSpeed: 40,
    armorBonus: 0,
    shieldBonus: 0,
    naturalArmor: 4,
    deflection: 0,
    ac: 16,
    touchAc: 12,
    flatFootedAc: 14,
    bab: 4,
    grapple: 6,
    abilities: { str: 15, dex: 14, con: 18, int: 6, wis: 11, cha: 7 },
    saves: { fort: 5, ref: 6, will: 4 },
    attacks: [
      {
        name: "Claw 1",
        type: "Natural",
        bonus: 6,
        damage: "1d4+2",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Claw 2",
        type: "Natural",
        bonus: 6,
        damage: "1d4+2",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Bite",
        type: "Natural",
        bonus: 4,
        damage: "1d6+1",
        crit: "20/x2",
        damageType: "Piercing/Slashing",
        range: "-"
      },
      {
        name: "Gore",
        type: "Natural",
        bonus: 4,
        damage: "1d6+1",
        crit: "20/x2",
        damageType: "Piercing",
        range: "-"
      }
    ],
    skills: [
      { name: "Hide", mod: 7 },
      { name: "Listen", mod: 4 },
      { name: "Spot", mod: 4 }
    ],
    feats: [
      { name: "Multiattack" },
      { name: "Toughness" }
    ],
    specialAbilities: [
      { name: "Damage Reduction 10/Magic", type: "Su", description: "Takes 10 less damage from weapons that lack a magical enhancement." },
      { name: "Freeze", type: "Ex", description: "Can hold itself completely still, appearing exactly like a stone statue (DC 20 Spot check to notice)." },
      { name: "Darkvision 60 ft.", type: "Ex", description: "Can see in total darkness." }
    ],
    description: "Gargoyles are winged, monstrous predators made of living stone that perch on parapets waiting to ambush."
  },
  {
    id: "minotaur",
    name: "Minotaur",
    cr: "4",
    crNumeric: 4,
    size: "Large",
    sizeMod: -1,
    type: "Monstrous Humanoid",
    hitDice: "6d8+12",
    hitDiceStr: "Monstrous Humanoid 6",
    hp: 39,
    initiative: 0,
    speed: "30 ft. (6 squares)",
    baseSpeed: 30,
    armorBonus: 0,
    shieldBonus: 0,
    naturalArmor: 5,
    deflection: 0,
    ac: 14,
    touchAc: 9,
    flatFootedAc: 14,
    bab: 6,
    grapple: 14,
    abilities: { str: 19, dex: 10, con: 15, int: 7, wis: 10, cha: 8 },
    saves: { fort: 6, ref: 5, will: 5 },
    attacks: [
      {
        name: "Greataxe",
        type: "Melee",
        bonus: 9,
        damage: "3d6+6",
        crit: "20/x3",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Gore",
        type: "Natural",
        bonus: 4,
        damage: "1d8+2",
        crit: "20/x2",
        damageType: "Piercing",
        range: "-"
      }
    ],
    skills: [
      { name: "Intimidate", mod: 2 },
      { name: "Listen", mod: 7 },
      { name: "Search", mod: 2 },
      { name: "Spot", mod: 7 }
    ],
    feats: [
      { name: "Great Fortitude" },
      { name: "Power Attack" },
      { name: "Track" }
    ],
    specialAbilities: [
      { name: "Powerful Charge", type: "Ex", description: "When charging, gore attack deals 4d6+6 damage." },
      { name: "Natural Cunning", type: "Ex", description: "Immune to maze spells, never gets lost, cannot be caught flat-footed." },
      { name: "Scent", type: "Ex", description: "Detect opponents within 30 ft. by scent." },
      { name: "Darkvision 60 ft.", type: "Ex", description: "Can see in total darkness." }
    ],
    description: "Minotaurs are bull-headed monstrous humanoids that stalk labyrinthine mazes and underground chambers."
  },
  {
    id: "owlbear",
    name: "Owlbear",
    cr: "4",
    crNumeric: 4,
    size: "Large",
    sizeMod: -1,
    type: "Magical Beast",
    hitDice: "5d10+25",
    hitDiceStr: "Magical Beast 5",
    hp: 52,
    initiative: 1,
    speed: "30 ft. (6 squares)",
    baseSpeed: 30,
    armorBonus: 0,
    shieldBonus: 0,
    naturalArmor: 5,
    deflection: 0,
    ac: 15,
    touchAc: 10,
    flatFootedAc: 14,
    bab: 5,
    grapple: 14,
    abilities: { str: 21, dex: 12, con: 21, int: 2, wis: 12, cha: 10 },
    saves: { fort: 9, ref: 5, will: 2 },
    attacks: [
      {
        name: "Claw 1",
        type: "Natural",
        bonus: 9,
        damage: "1d6+5",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Claw 2",
        type: "Natural",
        bonus: 9,
        damage: "1d6+5",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Bite",
        type: "Natural",
        bonus: 4,
        damage: "1d8+2",
        crit: "20/x2",
        damageType: "Piercing",
        range: "-"
      }
    ],
    skills: [
      { name: "Listen", mod: 8 },
      { name: "Spot", mod: 8 }
    ],
    feats: [
      { name: "Alertness" },
      { name: "Track" }
    ],
    specialAbilities: [
      { name: "Improved Grab", type: "Ex", description: "If hit with claw, can start grapple as a free action without provoking attack of opportunity." },
      { name: "Squeeze", type: "Ex", description: "Deals 2d6+8 damage automatically with successful grapple check." },
      { name: "Scent", type: "Ex", description: "Can detect nearby creatures by smell." },
      { name: "Low-Light Vision", type: "Ex", description: "Can see twice as far in dim light." }
    ],
    description: "An owlbear's coat is thick fur and feathers, combining the savagery of a bear with the lethal senses of an owl."
  },
  {
    id: "troll",
    name: "Troll",
    cr: "5",
    crNumeric: 5,
    size: "Large",
    sizeMod: -1,
    type: "Giant",
    hitDice: "6d8+36",
    hitDiceStr: "Giant 6",
    hp: 63,
    initiative: 2,
    speed: "30 ft. (6 squares)",
    baseSpeed: 30,
    armorBonus: 0,
    shieldBonus: 0,
    naturalArmor: 5,
    deflection: 0,
    ac: 16,
    touchAc: 11,
    flatFootedAc: 14,
    bab: 4,
    grapple: 14,
    abilities: { str: 23, dex: 14, con: 23, int: 6, wis: 9, cha: 6 },
    saves: { fort: 11, ref: 4, will: 3 },
    attacks: [
      {
        name: "Claw 1",
        type: "Natural",
        bonus: 9,
        damage: "1d6+6",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Claw 2",
        type: "Natural",
        bonus: 9,
        damage: "1d6+6",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Bite",
        type: "Natural",
        bonus: 4,
        damage: "1d6+3",
        crit: "20/x2",
        damageType: "Piercing/Slashing",
        range: "-"
      }
    ],
    skills: [
      { name: "Listen", mod: 5 },
      { name: "Spot", mod: 6 }
    ],
    feats: [
      { name: "Alertness" },
      { name: "Iron Will" },
      { name: "Track" }
    ],
    specialAbilities: [
      { name: "Rend", type: "Ex", description: "If hit with both claw attacks, latches onto the opponent's body and tears the flesh, dealing an additional 2d6+9 damage." },
      { name: "Regeneration 5", type: "Ex", description: "Recovers 5 hp per round. Fire and acid deal normal damage to a troll." },
      { name: "Scent", type: "Ex", description: "Can detect opponents within 30 feet by scent." },
      { name: "Darkvision 90 ft.", type: "Ex", description: "Superior darkvision." }
    ],
    description: "Trolls are fearsome carnivores renowned for their ravenous appetite and uncanny ability to regenerate wounds."
  },
  {
    id: "manticore",
    name: "Manticore",
    cr: "5",
    crNumeric: 5,
    size: "Large",
    sizeMod: -1,
    type: "Magical Beast",
    hitDice: "6d10+24",
    hitDiceStr: "Magical Beast 6",
    hp: 57,
    initiative: 2,
    speed: "30 ft. (6 squares), fly 50 ft. (clumsy)",
    baseSpeed: 30,
    armorBonus: 0,
    shieldBonus: 0,
    naturalArmor: 6,
    deflection: 0,
    ac: 17,
    touchAc: 11,
    flatFootedAc: 15,
    bab: 6,
    grapple: 15,
    abilities: { str: 20, dex: 15, con: 18, int: 7, wis: 12, cha: 9 },
    saves: { fort: 9, ref: 7, will: 3 },
    attacks: [
      {
        name: "Claw 1",
        type: "Natural",
        bonus: 10,
        damage: "2d4+5",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Claw 2",
        type: "Natural",
        bonus: 10,
        damage: "2d4+5",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Bite",
        type: "Natural",
        bonus: 8,
        damage: "1d8+2",
        crit: "20/x2",
        damageType: "Piercing",
        range: "-"
      },
      {
        name: "6 Tail Spikes",
        type: "Ranged",
        bonus: 8,
        damage: "1d8+2",
        crit: "19-20/x2",
        damageType: "Piercing",
        range: "180 ft."
      }
    ],
    skills: [
      { name: "Listen", mod: 5 },
      { name: "Spot", mod: 9 },
      { name: "Survival", mod: 1 }
    ],
    feats: [
      { name: "Flyby Attack" },
      { name: "Multiattack" },
      { name: "Track" }
    ],
    specialAbilities: [
      { name: "Spikes", type: "Ex", description: "With a flick of its tail, a manticore can loose a volley of six spikes as a standard action (180 ft. range, no range penalty, 24 spikes per day)." },
      { name: "Scent", type: "Ex", description: "Can detect approaching enemies by smell." },
      { name: "Darkvision 60 ft.", type: "Ex", description: "Can see in total darkness." }
    ],
    description: "A manticore is a monstrous chimera with the body of a lion, batlike wings, and a tail tipped with iron spikes."
  },
  {
    id: "hill_giant",
    name: "Hill Giant",
    cr: "7",
    crNumeric: 7,
    size: "Large",
    sizeMod: -1,
    type: "Giant",
    hitDice: "12d8+48",
    hitDiceStr: "Giant 12",
    hp: 102,
    initiative: -1,
    speed: "30 ft. (40 ft. base, hide armor)",
    baseSpeed: 30,
    armorBonus: 3,
    shieldBonus: 0,
    naturalArmor: 9,
    deflection: 0,
    ac: 20,
    touchAc: 8,
    flatFootedAc: 20,
    bab: 9,
    grapple: 20,
    abilities: { str: 25, dex: 8, con: 19, int: 6, wis: 10, cha: 7 },
    saves: { fort: 12, ref: 3, will: 4 },
    attacks: [
      {
        name: "Greatclub",
        type: "Melee",
        bonus: 16,
        damage: "2d8+10",
        crit: "20/x2",
        damageType: "Bludgeoning",
        range: "-"
      },
      {
        name: "Rock",
        type: "Ranged",
        bonus: 8,
        damage: "2d6+7",
        crit: "20/x2",
        damageType: "Bludgeoning",
        range: "120 ft."
      }
    ],
    skills: [
      { name: "Climb", mod: 7 },
      { name: "Jump", mod: 7 },
      { name: "Listen", mod: 3 },
      { name: "Spot", mod: 6 }
    ],
    feats: [
      { name: "Cleave" },
      { name: "Improved Bull Rush" },
      { name: "Power Attack" },
      { name: "Improved Sunder" },
      { name: "Weapon Focus (Greatclub)" }
    ],
    specialAbilities: [
      { name: "Rock Throwing", type: "Ex", description: "Can hurl rocks weighing 40 to 50 pounds up to five range increments of 120 feet." },
      { name: "Rock Catching", type: "Ex", description: "Can catch Small, Medium, or Large rocks (or projectiles of similar shape) once per round with a successful Reflex save." },
      { name: "Low-Light Vision", type: "Ex", description: "Can see twice as far in dim light." }
    ],
    description: "Hill giants are selfish, brutal marauders that raid humanoid settlements for food and livestock."
  },
  {
    id: "mind_flayer",
    name: "Mind Flayer (Illithid)",
    cr: "8",
    crNumeric: 8,
    size: "Medium",
    sizeMod: 0,
    type: "Aberration",
    hitDice: "8d8+8",
    hitDiceStr: "Aberration 8",
    hp: 44,
    initiative: 6,
    speed: "30 ft. (6 squares)",
    baseSpeed: 30,
    armorBonus: 0,
    shieldBonus: 0,
    naturalArmor: 3,
    deflection: 0,
    ac: 15,
    touchAc: 12,
    flatFootedAc: 13,
    bab: 6,
    grapple: 7,
    abilities: { str: 12, dex: 14, con: 12, int: 19, wis: 17, cha: 17 },
    saves: { fort: 3, ref: 4, will: 9 },
    attacks: [
      {
        name: "Tentacle 1",
        type: "Natural",
        bonus: 8,
        damage: "1d4+1",
        crit: "20/x2",
        damageType: "Bludgeoning plus Grab",
        range: "-"
      },
      {
        name: "Tentacle 2",
        type: "Natural",
        bonus: 8,
        damage: "1d4+1",
        crit: "20/x2",
        damageType: "Bludgeoning plus Grab",
        range: "-"
      },
      {
        name: "Tentacle 3",
        type: "Natural",
        bonus: 8,
        damage: "1d4+1",
        crit: "20/x2",
        damageType: "Bludgeoning plus Grab",
        range: "-"
      },
      {
        name: "Tentacle 4",
        type: "Natural",
        bonus: 8,
        damage: "1d4+1",
        crit: "20/x2",
        damageType: "Bludgeoning plus Grab",
        range: "-"
      }
    ],
    skills: [
      { name: "Bluff", mod: 11 },
      { name: "Concentration", mod: 11 },
      { name: "Diplomacy", mod: 7 },
      { name: "Hide", mod: 10 },
      { name: "Intimidate", mod: 11 },
      { name: "Knowledge (Arcana)", mod: 12 },
      { name: "Listen", mod: 11 },
      { name: "Move Silently", mod: 10 },
      { name: "Sense Motive", mod: 11 },
      { name: "Spot", mod: 11 }
    ],
    feats: [
      { name: "Combat Casting" },
      { name: "Improved Initiative" },
      { name: "Weapon Finesse" }
    ],
    specialAbilities: [
      { name: "Mind Blast", type: "Sp", description: "60-foot cone: all creatures must succeed on a DC 17 Will save or be stunned for 3d4 rounds (at will)." },
      { name: "Extract", type: "Ex", description: "If a mind flayer begins its turn with all four tentacles attached and succeeds on a grapple check, it extracts and devours the opponent's brain, instantly killing it." },
      { name: "Spell Resistance 25", type: "Ex", description: "Formidable natural resistance to magical spells." },
      { name: "Telepathy 100 ft.", type: "Su", description: "Can communicate mentally with any creature within 100 feet." },
      { name: "Psionics (Sp)", type: "Sp", description: "At will: charm monster (DC 17), detect thoughts (DC 15), levitate, plane shift, suggestion (DC 16)." }
    ],
    spells: [
      { name: "Mind Blast", level: 4, school: "Enchantment", castingTime: "1 standard action", range: "60 ft. cone", duration: "3d4 rounds", savingThrow: "Will negates (DC 17)", spellResistance: "Yes", description: "Cone of psionic energy stuns creatures for 3d4 rounds." },
      { name: "Charm Monster", level: 4, school: "Enchantment", castingTime: "1 standard action", range: "Close (25 ft. + 5 ft./2 levels)", duration: "1 day/level", savingThrow: "Will negates (DC 17)", spellResistance: "Yes", description: "Makes monster believe it is your ally." },
      { name: "Detect Thoughts", level: 2, school: "Divination", castingTime: "1 standard action", range: "60 ft.", duration: "Concentration", savingThrow: "Will negates (DC 15)", spellResistance: "No", description: "Allows listening to surface thoughts." },
      { name: "Suggestion", level: 3, school: "Enchantment", castingTime: "1 standard action", range: "Close (25 ft. + 5 ft./2 levels)", duration: "1 hour/level", savingThrow: "Will negates (DC 16)", spellResistance: "Yes", description: "Compels subject to follow stated course of action." },
      { name: "Levitate", level: 2, school: "Transmutation", castingTime: "1 standard action", range: "Personal", duration: "10 min./level", savingThrow: "None", spellResistance: "No", description: "Subject moves up and down at your direction." },
      { name: "Plane Shift", level: 7, school: "Conjuration", castingTime: "1 standard action", range: "Touch", duration: "Instantaneous", savingThrow: "Will negates (DC 20)", spellResistance: "Yes", description: "Transports creatures to another plane of existence." }
    ],
    description: "Mind flayers are sadistic subterranean masterminds that wield devastating psionic powers and feast upon brains.",
    tags: ["illithid", "mind flayer", "aberration", "psionic"]
  },
  {
    id: "young_red_dragon",
    name: "Young Red Dragon",
    cr: "7",
    crNumeric: 7,
    size: "Large",
    sizeMod: -1,
    type: "Dragon (Fire)",
    hitDice: "13d12+39",
    hitDiceStr: "Dragon 13",
    hp: 123,
    initiative: 0,
    speed: "40 ft. (8 squares), fly 150 ft. (poor)",
    baseSpeed: 40,
    armorBonus: 0,
    shieldBonus: 0,
    naturalArmor: 12,
    deflection: 0,
    ac: 21,
    touchAc: 9,
    flatFootedAc: 21,
    bab: 13,
    grapple: 22,
    abilities: { str: 21, dex: 10, con: 17, int: 12, wis: 13, cha: 12 },
    saves: { fort: 11, ref: 8, will: 9 },
    attacks: [
      {
        name: "Bite",
        type: "Natural",
        bonus: 17,
        damage: "2d6+5",
        crit: "20/x2",
        damageType: "Piercing/Slashing",
        range: "-"
      },
      {
        name: "Claw 1",
        type: "Natural",
        bonus: 15,
        damage: "1d8+2",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Claw 2",
        type: "Natural",
        bonus: 15,
        damage: "1d8+2",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Wing 1",
        type: "Natural",
        bonus: 15,
        damage: "1d6+2",
        crit: "20/x2",
        damageType: "Bludgeoning",
        range: "-"
      },
      {
        name: "Wing 2",
        type: "Natural",
        bonus: 15,
        damage: "1d6+2",
        crit: "20/x2",
        damageType: "Bludgeoning",
        range: "-"
      }
    ],
    skills: [
      { name: "Appraise", mod: 17 },
      { name: "Bluff", mod: 17 },
      { name: "Concentration", mod: 19 },
      { name: "Intimidate", mod: 19 },
      { name: "Knowledge (Arcana)", mod: 17 },
      { name: "Listen", mod: 17 },
      { name: "Search", mod: 17 },
      { name: "Spot", mod: 17 }
    ],
    feats: [
      { name: "Cleave" },
      { name: "Flyby Attack" },
      { name: "Improved Initiative" },
      { name: "Multiattack" },
      { name: "Power Attack" }
    ],
    specialAbilities: [
      { name: "Breath Weapon", type: "Su", description: "40-foot cone of fire, 6d10 fire damage, Reflex DC 19 half (usable once every 1d4 rounds)." },
      { name: "Fire Immunity", type: "Ex", description: "Immune to fire damage; vulnerability to cold (+50% damage from cold)." },
      { name: "Blindsense 60 ft.", type: "Ex", description: "Can pinpoint creatures within 60 feet by sound and scent." },
      { name: "Darkvision 120 ft.", type: "Ex", description: "Superior darkvision in total darkness." }
    ],
    description: "Young red dragons are proud, arrogant, and greedy fire-breathing tyrants that amass hoards in volcanic mountains."
  },
  {
    id: "iron_golem",
    name: "Iron Golem",
    cr: "13",
    crNumeric: 13,
    size: "Large",
    sizeMod: -1,
    type: "Construct",
    hitDice: "18d10+30",
    hitDiceStr: "Construct 18",
    hp: 129,
    initiative: -1,
    speed: "20 ft. (4 squares)",
    baseSpeed: 20,
    armorBonus: 0,
    shieldBonus: 0,
    naturalArmor: 22,
    deflection: 0,
    ac: 30,
    touchAc: 8,
    flatFootedAc: 30,
    bab: 13,
    grapple: 28,
    abilities: { str: 33, dex: 9, con: 10, int: 10, wis: 11, cha: 1 },
    saves: { fort: 6, ref: 5, will: 6 },
    attacks: [
      {
        name: "Slam 1",
        type: "Natural",
        bonus: 23,
        damage: "2d10+11",
        crit: "20/x2",
        damageType: "Bludgeoning",
        range: "-"
      },
      {
        name: "Slam 2",
        type: "Natural",
        bonus: 23,
        damage: "2d10+11",
        crit: "20/x2",
        damageType: "Bludgeoning",
        range: "-"
      }
    ],
    skills: [],
    feats: [
      { name: "Cleave" },
      { name: "Great Cleave" },
      { name: "Power Attack" }
    ],
    specialAbilities: [
      { name: "Damage Reduction 15/Adamantine", type: "Ex", description: "Takes 15 less damage from weapons not forged of adamantine." },
      { name: "Immunity to Magic", type: "Ex", description: "Immune to any spell or spell-like ability that allows spell resistance. Magical fire heals it 1 hp per 3 points of damage." },
      { name: "Breath Weapon", type: "Su", description: "10-foot cube of poisonous green gas: initial damage 1d4 Con, secondary 3d4 Con, Fortitude DC 19 negates." },
      { name: "Construct Traits", type: "Ex", description: "Immune to mind effects, poison, sleep, paralysis, stunning, disease, death effects, critical hits, nonlethal damage." },
      { name: "Darkvision 60 ft.", type: "Ex", description: "Can see in total darkness." }
    ],
    description: "An iron golem has a humanoid body made of iron. It weighs about 5,000 pounds and strikes with colossal, crushing force.",
    tags: ["golem", "iron golem", "construct", "automaton"]
  },
  {
    id: "dretch",
    name: "Dretch (Tanar'ri)",
    cr: "2",
    crNumeric: 2,
    size: "Small",
    sizeMod: 1,
    type: "Outsider (Chaotic, Evil, Extraplanar, Tanar'ri)",
    hitDice: "2d8+4",
    hitDiceStr: "Outsider 2",
    hp: 13,
    initiative: 0,
    speed: "20 ft. (4 squares)",
    baseSpeed: 20,
    armorBonus: 0,
    shieldBonus: 0,
    naturalArmor: 5,
    deflection: 0,
    ac: 16,
    touchAc: 11,
    flatFootedAc: 16,
    bab: 2,
    grapple: -1,
    abilities: { str: 12, dex: 10, con: 14, int: 5, wis: 11, cha: 11 },
    saves: { fort: 5, ref: 3, will: 3 },
    attacks: [
      {
        name: "Claw 1",
        type: "Natural",
        bonus: 4,
        damage: "1d6+1",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Claw 2",
        type: "Natural",
        bonus: 4,
        damage: "1d6+1",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Bite",
        type: "Natural",
        bonus: 2,
        damage: "1d4",
        crit: "20/x2",
        damageType: "Piercing",
        range: "-"
      }
    ],
    skills: [
      { name: "Hide", mod: 5 },
      { name: "Listen", mod: 5 },
      { name: "Move Silently", mod: 5 },
      { name: "Spot", mod: 5 }
    ],
    feats: [
      { name: "Multiattack" }
    ],
    specialAbilities: [
      { name: "Damage Reduction 5/Cold Iron or Good", type: "Su", description: "Takes 5 less damage from weapons that are not cold iron or good-aligned." },
      { name: "Spell-Like Abilities", type: "Sp", description: "1/day: scare (DC 12), stinking cloud (DC 13). Caster level 2nd." },
      { name: "Summon Tanar'ri", type: "Sp", description: "1/day: summon 1 dretch with 35% chance." },
      { name: "Telepathy 100 ft.", type: "Su", description: "Can communicate mentally within 100 ft." },
      { name: "Tanar'ri Traits", type: "Ex", description: "Immune to electricity and poison. Resistance to acid 10, cold 10, fire 10." },
      { name: "Darkvision 60 ft.", type: "Ex", description: "Can see in total darkness." }
    ],
    spells: [
      { name: "Scare", level: 2, school: "Necromancy", castingTime: "1 standard action", range: "Close (25 ft. + 5 ft./2 levels)", duration: "1d4 rounds or 1 round", savingThrow: "Will partial (DC 12)", spellResistance: "Yes", description: "Panics creatures of less than 6 HD." },
      { name: "Stinking Cloud", level: 3, school: "Conjuration", castingTime: "1 standard action", range: "Medium (100 ft. + 10 ft./level)", duration: "1 round/level", savingThrow: "Fortitude negates (DC 13)", spellResistance: "No", description: "Nauseating vapors, 1 round/level." }
    ],
    description: "Dretches are pathetic, bloated demons that make up the rank-and-file hordes of the Abyss.",
    tags: ["tanari", "tanarri", "tanar'ri", "demon", "iblis", "dretch", "outsider", "abyss"]
  },
  {
    id: "babau",
    name: "Babau (Tanar'ri)",
    cr: "6",
    crNumeric: 6,
    size: "Medium",
    sizeMod: 0,
    type: "Outsider (Chaotic, Evil, Extraplanar, Tanar'ri)",
    hitDice: "7d8+14",
    hitDiceStr: "Outsider 7",
    hp: 45,
    initiative: 1,
    speed: "30 ft. (6 squares)",
    baseSpeed: 30,
    armorBonus: 0,
    shieldBonus: 0,
    naturalArmor: 8,
    deflection: 0,
    ac: 19,
    touchAc: 11,
    flatFootedAc: 18,
    bab: 7,
    grapple: 12,
    abilities: { str: 21, dex: 12, con: 14, int: 14, wis: 13, cha: 16 },
    saves: { fort: 7, ref: 6, will: 6 },
    attacks: [
      {
        name: "Claw 1",
        type: "Natural",
        bonus: 12,
        damage: "1d6+5",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Claw 2",
        type: "Natural",
        bonus: 12,
        damage: "1d6+5",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Bite",
        type: "Natural",
        bonus: 7,
        damage: "1d6+2",
        crit: "20/x2",
        damageType: "Piercing",
        range: "-"
      },
      {
        name: "Longspear",
        type: "Melee",
        bonus: 12,
        damage: "1d8+7",
        crit: "20/x3",
        damageType: "Piercing",
        range: "10 ft."
      }
    ],
    skills: [
      { name: "Climb", mod: 10 },
      { name: "Disable Device", mod: 10 },
      { name: "Escape Artist", mod: 9 },
      { name: "Hide", mod: 15 },
      { name: "Listen", mod: 17 },
      { name: "Move Silently", mod: 15 },
      { name: "Open Lock", mod: 9 },
      { name: "Search", mod: 18 },
      { name: "Sense Motive", mod: 9 },
      { name: "Spot", mod: 17 }
    ],
    feats: [
      { name: "Multiattack" },
      { name: "Power Attack" },
      { name: "Cleave" }
    ],
    specialAbilities: [
      { name: "Sneak Attack +2d6", type: "Ex", description: "Deals +2d6 extra precision damage against flat-footed or flanked foes." },
      { name: "Protective Slime", type: "Su", description: "Coated with red jelly: weapons striking babau take 1d8 acid damage (Fortitude DC 15 negates)." },
      { name: "Damage Reduction 10/Cold Iron or Good", type: "Su", description: "Takes 10 less damage unless weapon is cold iron or good." },
      { name: "Spell Resistance 14", type: "Ex", description: "Natural magic resistance." },
      { name: "Spell-Like Abilities", type: "Sp", description: "At will: darkness, dispel magic, see invisibility. Caster level 7th." },
      { name: "Summon Tanar'ri", type: "Sp", description: "1/day: summon 1 babau with 40% chance." },
      { name: "Tanar'ri Traits", type: "Ex", description: "Immune to electricity and poison. Resistance to acid 10, cold 10, fire 10." },
      { name: "Telepathy 100 ft.", type: "Su", description: "Can communicate mentally within 100 ft." }
    ],
    spells: [
      { name: "Darkness", level: 2, school: "Evocation", castingTime: "1 standard action", range: "Touch", duration: "10 min./level", savingThrow: "None", spellResistance: "No", description: "20-ft. radius of supernatural shadow." },
      { name: "Dispel Magic", level: 3, school: "Abjuration", castingTime: "1 standard action", range: "Medium (100 ft. + 10 ft./level)", duration: "Instantaneous", savingThrow: "None", spellResistance: "No", description: "Cancels magical spells and effects." },
      { name: "See Invisibility", level: 2, school: "Divination", castingTime: "1 standard action", range: "Personal", duration: "10 min./level", savingThrow: "None", spellResistance: "No", description: "Reveals invisible creatures or objects." }
    ],
    description: "Babaus are skeletal, horned assassins that serve as the stealthy killers and scouts of the Abyss.",
    tags: ["tanari", "tanarri", "tanar'ri", "demon", "iblis", "babau", "outsider", "abyss", "assassin"]
  },
  {
    id: "succubus",
    name: "Succubus (Tanar'ri)",
    cr: "7",
    crNumeric: 7,
    size: "Medium",
    sizeMod: 0,
    type: "Outsider (Chaotic, Evil, Extraplanar, Tanar'ri)",
    hitDice: "6d8+6",
    hitDiceStr: "Outsider 6",
    hp: 33,
    initiative: 1,
    speed: "30 ft. (6 squares), fly 50 ft. (average)",
    baseSpeed: 30,
    armorBonus: 0,
    shieldBonus: 0,
    naturalArmor: 9,
    deflection: 0,
    ac: 20,
    touchAc: 11,
    flatFootedAc: 19,
    bab: 6,
    grapple: 7,
    abilities: { str: 13, dex: 13, con: 13, int: 16, wis: 14, cha: 26 },
    saves: { fort: 6, ref: 6, will: 7 },
    attacks: [
      {
        name: "Claw 1",
        type: "Natural",
        bonus: 7,
        damage: "1d3+1",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Claw 2",
        type: "Natural",
        bonus: 7,
        damage: "1d3+1",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      }
    ],
    skills: [
      { name: "Bluff", mod: 19 },
      { name: "Concentration", mod: 8 },
      { name: "Diplomacy", mod: 12 },
      { name: "Disguise", mod: 17 },
      { name: "Escape Artist", mod: 8 },
      { name: "Hide", mod: 8 },
      { name: "Intimidate", mod: 17 },
      { name: "Knowledge (Any)", mod: 10 },
      { name: "Listen", mod: 17 },
      { name: "Move Silently", mod: 8 },
      { name: "Search", mod: 10 },
      { name: "Sense Motive", mod: 9 },
      { name: "Spot", mod: 17 }
    ],
    feats: [
      { name: "Dodge" },
      { name: "Mobility" },
      { name: "Persuasive" }
    ],
    specialAbilities: [
      { name: "Energy Drain", type: "Su", description: "Bestows 1 negative level with an embrace or kiss. Fortitude DC 21 to remove after 24 hours." },
      { name: "Spell-Like Abilities", type: "Sp", description: "At will: charm monster (DC 22), detect good, detect thoughts (DC 20), ethereal jaunt, suggestion (DC 21), greater teleport. Caster level 12th." },
      { name: "Change Shape", type: "Su", description: "Can assume the form of any Small or Medium humanoid." },
      { name: "Damage Reduction 10/Cold Iron or Good", type: "Su", description: "Takes 10 less damage unless weapon is cold iron or good." },
      { name: "Spell Resistance 18", type: "Ex", description: "High natural resistance to magic." },
      { name: "Summon Tanar'ri", type: "Sp", description: "1/day: summon 1 vrock with 30% chance." },
      { name: "Tanar'ri Traits", type: "Ex", description: "Immune to electricity and poison. Resistance to acid 10, cold 10, fire 10." },
      { name: "Telepathy 100 ft.", type: "Su", description: "Can communicate mentally within 100 ft." },
      { name: "Tongues", type: "Su", description: "Can continuously speak any language as with tongues spell." }
    ],
    spells: [
      { name: "Charm Monster", level: 4, school: "Enchantment", castingTime: "1 standard action", range: "Close (25 ft. + 5 ft./2 levels)", duration: "1 day/level", savingThrow: "Will negates (DC 22)", spellResistance: "Yes", description: "Makes monster believe it is your ally." },
      { name: "Detect Thoughts", level: 2, school: "Divination", castingTime: "1 standard action", range: "60 ft.", duration: "Concentration, up to 1 min./level", savingThrow: "Will negates (DC 20)", spellResistance: "No", description: "Allows listening to surface thoughts." },
      { name: "Suggestion", level: 3, school: "Enchantment", castingTime: "1 standard action", range: "Close (25 ft. + 5 ft./2 levels)", duration: "1 hour/level", savingThrow: "Will negates (DC 21)", spellResistance: "Yes", description: "Compels subject to follow stated course of action." },
      { name: "Ethereal Jaunt", level: 7, school: "Transmutation", castingTime: "1 standard action", range: "Personal", duration: "1 round/level", savingThrow: "None", spellResistance: "No", description: "You become ethereal for 1 round/level." },
      { name: "Greater Teleport", level: 7, school: "Transmutation", castingTime: "1 standard action", range: "Personal and touch", duration: "Instantaneous", savingThrow: "None", spellResistance: "No", description: "Instantly transports you anywhere without error." },
      { name: "Detect Good", level: 1, school: "Divination", castingTime: "1 standard action", range: "60 ft.", duration: "Concentration, up to 10 min./level", savingThrow: "None", spellResistance: "No", description: "Reveals presence and aura of good creatures." }
    ],
    description: "Succubi are beautiful, winged tempters that lure mortals into wickedness and drain their life energy.",
    tags: ["tanari", "tanarri", "tanar'ri", "demon", "iblis", "succubus", "outsider", "abyss", "charm"]
  },
  {
    id: "vrock",
    name: "Vrock (Tanar'ri)",
    cr: "9",
    crNumeric: 9,
    size: "Large",
    sizeMod: -1,
    type: "Outsider (Chaotic, Evil, Extraplanar, Tanar'ri)",
    hitDice: "10d8+50",
    hitDiceStr: "Outsider 10",
    hp: 95,
    initiative: 2,
    speed: "30 ft. (6 squares), fly 50 ft. (average)",
    baseSpeed: 30,
    armorBonus: 0,
    shieldBonus: 0,
    naturalArmor: 11,
    deflection: 0,
    ac: 22,
    touchAc: 11,
    flatFootedAc: 20,
    bab: 10,
    grapple: 20,
    abilities: { str: 23, dex: 15, con: 21, int: 14, wis: 15, cha: 16 },
    saves: { fort: 12, ref: 9, will: 9 },
    attacks: [
      {
        name: "Claw 1",
        type: "Natural",
        bonus: 15,
        damage: "2d6+6",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Claw 2",
        type: "Natural",
        bonus: 15,
        damage: "2d6+6",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Bite",
        type: "Natural",
        bonus: 13,
        damage: "1d8+3",
        crit: "20/x2",
        damageType: "Piercing",
        range: "-"
      },
      {
        name: "2 Talons",
        type: "Natural",
        bonus: 13,
        damage: "1d6+3",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      }
    ],
    skills: [
      { name: "Concentration", mod: 16 },
      { name: "Diplomacy", mod: 5 },
      { name: "Hide", mod: 9 },
      { name: "Intimidate", mod: 14 },
      { name: "Knowledge (History)", mod: 13 },
      { name: "Listen", mod: 21 },
      { name: "Move Silently", mod: 13 },
      { name: "Search", mod: 13 },
      { name: "Sense Motive", mod: 13 },
      { name: "Spellcraft", mod: 13 },
      { name: "Spot", mod: 21 },
      { name: "Survival", mod: 4 }
    ],
    feats: [
      { name: "Cleave" },
      { name: "Combat Reflexes" },
      { name: "Multiattack" },
      { name: "Power Attack" }
    ],
    specialAbilities: [
      { name: "Spores", type: "Ex", description: "Free action every 3 rounds: releases spore cloud dealing 1d8 damage, plus 1d4 damage/round for 10 rounds as thick vines grow (DC 20 Fortitude)." },
      { name: "Stunning Screech", type: "Su", description: "Once per hour: deafening screech stuns all creatures within 30 ft. for 1 round (Fortitude DC 20 negates)." },
      { name: "Dance of Ruin", type: "Su", description: "Three or more vrocks dancing for 3 rounds unleash wave of crackling energy dealing 5d20 electricity damage to all non-demons within 100 ft. (Reflex DC 18 half)." },
      { name: "Damage Reduction 10/Good", type: "Su", description: "Takes 10 less damage unless weapon is good-aligned." },
      { name: "Spell Resistance 17", type: "Ex", description: "Natural magic resistance." },
      { name: "Spell-Like Abilities", type: "Sp", description: "At will: darkness, mirror image, telekinesis (DC 18), greater teleport. 1/day: heroism. Caster level 12th." },
      { name: "Summon Tanar'ri", type: "Sp", description: "1/day: summon 2d10 dretches (50%) or 1 vrock (35%)." },
      { name: "Tanar'ri Traits", type: "Ex", description: "Immune to electricity and poison. Resistance to acid 10, cold 10, fire 10." },
      { name: "Telepathy 100 ft.", type: "Su", description: "Can communicate mentally within 100 ft." }
    ],
    spells: [
      { name: "Mirror Image", level: 2, school: "Illusion", castingTime: "1 standard action", range: "Personal", duration: "1 min./level", savingThrow: "None", spellResistance: "No", description: "Creates 1d4 (+1 per 3 levels) illusory duplicates." },
      { name: "Telekinesis", level: 5, school: "Transmutation", castingTime: "1 standard action", range: "Long (400 ft. + 40 ft./level)", duration: "Concentration (up to 1 round/level)", savingThrow: "Will negates (DC 18)", spellResistance: "Yes", description: "Moves objects, attacks creatures, or hurls objects or creatures." },
      { name: "Heroism", level: 3, school: "Enchantment", castingTime: "1 standard action", range: "Touch", duration: "10 min./level", savingThrow: "Will negates (harmless)", spellResistance: "Yes", description: "Gives +2 bonus on attack rolls, saves, skill checks." },
      { name: "Greater Teleport", level: 7, school: "Transmutation", castingTime: "1 standard action", range: "Personal and touch", duration: "Instantaneous", savingThrow: "None", spellResistance: "No", description: "Instantly transports you without error." },
      { name: "Darkness", level: 2, school: "Evocation", castingTime: "1 standard action", range: "Touch", duration: "10 min./level", savingThrow: "None", spellResistance: "No", description: "20-ft. radius of supernatural shadow." }
    ],
    description: "Vrocks are giant, vulture-headed demons that screech from above and release deadly spores.",
    tags: ["tanari", "tanarri", "tanar'ri", "demon", "iblis", "vrock", "outsider", "abyss"]
  },
  {
    id: "hezrou",
    name: "Hezrou (Tanar'ri)",
    cr: "11",
    crNumeric: 11,
    size: "Large",
    sizeMod: -1,
    type: "Outsider (Chaotic, Evil, Extraplanar, Tanar'ri)",
    hitDice: "10d8+90",
    hitDiceStr: "Outsider 10",
    hp: 135,
    initiative: 0,
    speed: "30 ft. (6 squares)",
    baseSpeed: 30,
    armorBonus: 0,
    shieldBonus: 0,
    naturalArmor: 14,
    deflection: 0,
    ac: 23,
    touchAc: 9,
    flatFootedAc: 23,
    bab: 10,
    grapple: 19,
    abilities: { str: 21, dex: 10, con: 27, int: 14, wis: 14, cha: 18 },
    saves: { fort: 15, ref: 7, will: 9 },
    attacks: [
      {
        name: "Bite",
        type: "Natural",
        bonus: 14,
        damage: "4d4+5",
        crit: "20/x2",
        damageType: "Piercing",
        range: "-"
      },
      {
        name: "Claw 1",
        type: "Natural",
        bonus: 9,
        damage: "1d8+2",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Claw 2",
        type: "Natural",
        bonus: 9,
        damage: "1d8+2",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      }
    ],
    skills: [
      { name: "Climb", mod: 16 },
      { name: "Concentration", mod: 20 },
      { name: "Escape Artist", mod: 11 },
      { name: "Hide", mod: 7 },
      { name: "Intimidate", mod: 15 },
      { name: "Listen", mod: 21 },
      { name: "Move Silently", mod: 11 },
      { name: "Search", mod: 13 },
      { name: "Spellcraft", mod: 13 },
      { name: "Spot", mod: 21 }
    ],
    feats: [
      { name: "Blind-Fight" },
      { name: "Cleave" },
      { name: "Power Attack" },
      { name: "Toughness" }
    ],
    specialAbilities: [
      { name: "Stench", type: "Ex", description: "Foul odor causes living creatures within 10 ft. to become nauseated for rounds (Fortitude DC 24 negates)." },
      { name: "Improved Grab", type: "Ex", description: "Can start grapple as free action upon hitting with bite." },
      { name: "Damage Reduction 10/Good", type: "Su", description: "Takes 10 less damage unless weapon is good-aligned." },
      { name: "Spell Resistance 19", type: "Ex", description: "Natural magic resistance." },
      { name: "Spell-Like Abilities", type: "Sp", description: "At will: chaos hammer (DC 18), greater teleport, unholy blight (DC 18). 3/day: blasphemy (DC 21), gaseous form. Caster level 13th." },
      { name: "Summon Tanar'ri", type: "Sp", description: "1/day: summon 4d10 dretches (50%) or 1 hezrou (35%)." },
      { name: "Tanar'ri Traits", type: "Ex", description: "Immune to electricity and poison. Resistance to acid 10, cold 10, fire 10." },
      { name: "Telepathy 100 ft.", type: "Su", description: "Can communicate mentally within 100 ft." }
    ],
    spells: [
      { name: "Chaos Hammer", level: 4, school: "Evocation", castingTime: "1 standard action", range: "Medium (100 ft. + 10 ft./level)", duration: "Instantaneous", savingThrow: "Will partial (DC 18)", spellResistance: "Yes", description: "Damages and slows lawful creatures (5d8 damage)." },
      { name: "Unholy Blight", level: 4, school: "Evocation", castingTime: "1 standard action", range: "Medium (100 ft. + 10 ft./level)", duration: "Instantaneous", savingThrow: "Will partial (DC 18)", spellResistance: "Yes", description: "Damages and sickens good creatures (5d8 damage)." },
      { name: "Blasphemy", level: 7, school: "Evocation", castingTime: "1 standard action", range: "30 ft.", duration: "Instantaneous", savingThrow: "None", spellResistance: "Yes", description: "Kills, paralyzes, weakens, or dazes non-evil creatures (DC 21)." },
      { name: "Gaseous Form", level: 3, school: "Transmutation", castingTime: "1 standard action", range: "Touch", duration: "2 min./level", savingThrow: "None", spellResistance: "No", description: "Subject becomes insubstantial and flies slowly." },
      { name: "Greater Teleport", level: 7, school: "Transmutation", castingTime: "1 standard action", range: "Personal and touch", duration: "Instantaneous", savingThrow: "None", spellResistance: "No", description: "Instantly transports you without error." }
    ],
    description: "Hezrous are repulsive, amphibious toad-demons that dwell in the abyssal swamps and mire.",
    tags: ["tanari", "tanarri", "tanar'ri", "demon", "iblis", "hezrou", "outsider", "abyss"]
  },
  {
    id: "glabrezu",
    name: "Glabrezu (Tanar'ri)",
    cr: "13",
    crNumeric: 13,
    size: "Huge",
    sizeMod: -2,
    type: "Outsider (Chaotic, Evil, Extraplanar, Tanar'ri)",
    hitDice: "12d8+120",
    hitDiceStr: "Outsider 12",
    hp: 174,
    initiative: 0,
    speed: "40 ft. (8 squares)",
    baseSpeed: 40,
    armorBonus: 0,
    shieldBonus: 0,
    naturalArmor: 19,
    deflection: 0,
    ac: 27,
    touchAc: 8,
    flatFootedAc: 27,
    bab: 12,
    grapple: 28,
    abilities: { str: 31, dex: 10, con: 31, int: 16, wis: 16, cha: 20 },
    saves: { fort: 18, ref: 8, will: 11 },
    attacks: [
      {
        name: "Pincer 1",
        type: "Natural",
        bonus: 20,
        damage: "2d8+10",
        crit: "20/x2",
        damageType: "Bludgeoning/Piercing",
        range: "-"
      },
      {
        name: "Pincer 2",
        type: "Natural",
        bonus: 20,
        damage: "2d8+10",
        crit: "20/x2",
        damageType: "Bludgeoning/Piercing",
        range: "-"
      },
      {
        name: "Claw 1",
        type: "Natural",
        bonus: 18,
        damage: "1d6+5",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Claw 2",
        type: "Natural",
        bonus: 18,
        damage: "1d6+5",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Bite",
        type: "Natural",
        bonus: 18,
        damage: "1d8+5",
        crit: "20/x2",
        damageType: "Piercing",
        range: "-"
      }
    ],
    skills: [
      { name: "Bluff", mod: 20 },
      { name: "Concentration", mod: 23 },
      { name: "Diplomacy", mod: 7 },
      { name: "Disguise", mod: 5 },
      { name: "Intimidate", mod: 22 },
      { name: "Knowledge (Any)", mod: 16 },
      { name: "Listen", mod: 24 },
      { name: "Move Silently", mod: 13 },
      { name: "Search", mod: 16 },
      { name: "Sense Motive", mod: 16 },
      { name: "Spellcraft", mod: 16 },
      { name: "Spot", mod: 24 }
    ],
    feats: [
      { name: "Cleave" },
      { name: "Great Cleave" },
      { name: "Multiattack" },
      { name: "Power Attack" },
      { name: "Weapon Focus (Pincer)" }
    ],
    specialAbilities: [
      { name: "Improved Grab", type: "Ex", description: "Can start grapple upon pincer hit." },
      { name: "Rend", type: "Ex", description: "Deals 4d8+15 damage if both pincers hit." },
      { name: "Spell-Like Abilities", type: "Sp", description: "At will: chaos hammer (DC 19), confusion (DC 19), dispel magic, mirror image, reverse gravity (DC 22), greater teleport, unholy blight (DC 19). 1/day: power word stun. 1/month: grant wish to mortal." },
      { name: "Damage Reduction 10/Good", type: "Su", description: "Takes 10 less damage unless weapon is good-aligned." },
      { name: "Spell Resistance 21", type: "Ex", description: "High natural magic resistance." },
      { name: "Summon Tanar'ri", type: "Sp", description: "1/day: summon 4d10 dretches or 1d2 vrocks (50%), or 1 glabrezu (20%)." },
      { name: "Tanar'ri Traits", type: "Ex", description: "Immune to electricity and poison. Resistance to acid 10, cold 10, fire 10." },
      { name: "Telepathy 100 ft.", type: "Su", description: "Can communicate mentally within 100 ft." }
    ],
    spells: [
      { name: "Chaos Hammer", level: 4, school: "Evocation", castingTime: "1 standard action", range: "Medium (100 ft. + 10 ft./level)", duration: "Instantaneous", savingThrow: "Will partial (DC 19)", spellResistance: "Yes", description: "Damages and slows lawful creatures." },
      { name: "Confusion", level: 4, school: "Enchantment", castingTime: "1 standard action", range: "Medium (100 ft. + 10 ft./level)", duration: "1 round/level", savingThrow: "Will negates (DC 19)", spellResistance: "Yes", description: "Makes subjects behave bizarrely for 1 round/level." },
      { name: "Dispel Magic", level: 3, school: "Abjuration", castingTime: "1 standard action", range: "Medium (100 ft. + 10 ft./level)", duration: "Instantaneous", savingThrow: "None", spellResistance: "No", description: "Cancels magical spells and effects." },
      { name: "Mirror Image", level: 2, school: "Illusion", castingTime: "1 standard action", range: "Personal", duration: "1 min./level", savingThrow: "None", spellResistance: "No", description: "Creates illusory duplicates." },
      { name: "Reverse Gravity", level: 7, school: "Transmutation", castingTime: "1 standard action", range: "Medium (100 ft. + 10 ft./level)", duration: "1 round/level", savingThrow: "None (DC 22)", spellResistance: "No", description: "Objects and creatures fall upward." },
      { name: "Unholy Blight", level: 4, school: "Evocation", castingTime: "1 standard action", range: "Medium (100 ft. + 10 ft./level)", duration: "Instantaneous", savingThrow: "Will partial (DC 19)", spellResistance: "Yes", description: "Damages and sickens good creatures." },
      { name: "Power Word Stun", level: 8, school: "Enchantment", castingTime: "1 standard action", range: "Close (25 ft. + 5 ft./2 levels)", duration: "See text", savingThrow: "None", spellResistance: "Yes", description: "Stuns creature with 150 hp or less." },
      { name: "Wish", level: 9, school: "Universal", castingTime: "1 standard action", range: "See text", duration: "See text", savingThrow: "See text", spellResistance: "Yes", description: "Alters reality when granted to mortal humanoid." },
      { name: "Greater Teleport", level: 7, school: "Transmutation", castingTime: "1 standard action", range: "Personal and touch", duration: "Instantaneous", savingThrow: "None", spellResistance: "No", description: "Instantly transports you without error." }
    ],
    description: "Glabrezu are towering, four-armed fiends with giant crab claws that tempt power-hungry mortals into ruin.",
    tags: ["tanari", "tanarri", "tanar'ri", "demon", "iblis", "glabrezu", "outsider", "abyss", "wish"]
  },
  {
    id: "marilith",
    name: "Marilith (Tanar'ri)",
    cr: "17",
    crNumeric: 17,
    size: "Large",
    sizeMod: -1,
    type: "Outsider (Chaotic, Evil, Extraplanar, Tanar'ri)",
    hitDice: "16d8+144",
    hitDiceStr: "Outsider 16",
    hp: 216,
    initiative: 4,
    speed: "40 ft. (8 squares)",
    baseSpeed: 40,
    armorBonus: 0,
    shieldBonus: 0,
    naturalArmor: 16,
    deflection: 0,
    ac: 29,
    touchAc: 13,
    flatFootedAc: 25,
    bab: 16,
    grapple: 29,
    abilities: { str: 29, dex: 19, con: 29, int: 18, wis: 18, cha: 24 },
    saves: { fort: 19, ref: 14, will: 14 },
    attacks: [
      {
        name: "Primary Longsword",
        type: "Melee",
        bonus: 25,
        damage: "2d6+9",
        crit: "19-20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "5 Off-Hand Longswords",
        type: "Melee",
        bonus: 25,
        damage: "2d6+4",
        crit: "19-20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Tail Slap",
        type: "Natural",
        bonus: 22,
        damage: "4d6+4",
        crit: "20/x2",
        damageType: "Bludgeoning",
        range: "-"
      }
    ],
    skills: [
      { name: "Bluff", mod: 26 },
      { name: "Concentration", mod: 28 },
      { name: "Diplomacy", mod: 30 },
      { name: "Disguise", mod: 7 },
      { name: "Hide", mod: 19 },
      { name: "Intimidate", mod: 28 },
      { name: "Listen", mod: 31 },
      { name: "Move Silently", mod: 23 },
      { name: "Search", mod: 23 },
      { name: "Sense Motive", mod: 23 },
      { name: "Spellcraft", mod: 23 },
      { name: "Spot", mod: 31 }
    ],
    feats: [
      { name: "Combat Expertise" },
      { name: "Combat Reflexes" },
      { name: "Multiattack" },
      { name: "Multiweapon Fighting" },
      { name: "Power Attack" },
      { name: "Weapon Focus (Longsword)" }
    ],
    specialAbilities: [
      { name: "Improved Grab", type: "Ex", description: "Can grapple with tail slap without provoking." },
      { name: "Constrict 4d6+13", type: "Ex", description: "Deals 4d6+13 damage with successful grapple check." },
      { name: "Damage Reduction 10/Cold Iron and Good", type: "Su", description: "Takes 10 less damage unless weapon is cold iron and good." },
      { name: "Spell Resistance 25", type: "Ex", description: "Formidable spell resistance." },
      { name: "Spell-Like Abilities", type: "Sp", description: "At will: align weapon, blade barrier (DC 23), polymorph, see invisibility, telekinesis (DC 22), greater teleport, unholy aura (DC 25). Caster level 16th." },
      { name: "Summon Tanar'ri", type: "Sp", description: "1/day: summon 4d10 dretches, 1d4 hezrous, or 1 marilith (20%)." },
      { name: "Tanar'ri Traits", type: "Ex", description: "Immune to electricity and poison. Resistance to acid 10, cold 10, fire 10." },
      { name: "Telepathy 100 ft.", type: "Su", description: "Can communicate mentally within 100 ft." }
    ],
    spells: [
      { name: "Blade Barrier", level: 6, school: "Evocation", castingTime: "1 standard action", range: "Medium (100 ft. + 10 ft./level)", duration: "1 min./level", savingThrow: "Reflex half (DC 23)", spellResistance: "Yes", description: "Wall of blades deals 15d6 slashing damage." },
      { name: "Polymorph", level: 4, school: "Transmutation", castingTime: "1 standard action", range: "Touch", duration: "1 min./level", savingThrow: "None", spellResistance: "No", description: "Gives one willing subject a new form." },
      { name: "Telekinesis", level: 5, school: "Transmutation", castingTime: "1 standard action", range: "Long (400 ft. + 40 ft./level)", duration: "Concentration", savingThrow: "Will negates (DC 22)", spellResistance: "Yes", description: "Moves objects or hurls creatures." },
      { name: "Unholy Aura", level: 8, school: "Abjuration", castingTime: "1 standard action", range: "20 ft.", duration: "1 round/level", savingThrow: "Fortitude partial (DC 25)", spellResistance: "Yes", description: "+4 AC, +4 resistance, SR 25 against good spells." },
      { name: "Align Weapon", level: 2, school: "Transmutation", castingTime: "1 standard action", range: "Touch", duration: "1 min./level", savingThrow: "Will negates (harmless)", spellResistance: "Yes", description: "Weapon becomes evil or chaotic aligned." },
      { name: "See Invisibility", level: 2, school: "Divination", castingTime: "1 standard action", range: "Personal", duration: "10 min./level", savingThrow: "None", spellResistance: "No", description: "Reveals invisible creatures." },
      { name: "Greater Teleport", level: 7, school: "Transmutation", castingTime: "1 standard action", range: "Personal and touch", duration: "Instantaneous", savingThrow: "None", spellResistance: "No", description: "Instantly transports you without error." }
    ],
    description: "Mariliths are six-armed serpent fiends who serve as the brilliant, deadly tacticians and generals of demonic armies.",
    tags: ["tanari", "tanarri", "tanar'ri", "demon", "iblis", "marilith", "outsider", "abyss"]
  },
  {
    id: "balor",
    name: "Balor (Tanar'ri)",
    cr: "20",
    crNumeric: 20,
    size: "Large",
    sizeMod: -1,
    type: "Outsider (Chaotic, Evil, Extraplanar, Tanar'ri)",
    hitDice: "20d8+200",
    hitDiceStr: "Outsider 20",
    hp: 290,
    initiative: 11,
    speed: "40 ft. (8 squares), fly 90 ft. (good)",
    baseSpeed: 40,
    armorBonus: 0,
    shieldBonus: 0,
    naturalArmor: 19,
    deflection: 0,
    ac: 35,
    touchAc: 16,
    flatFootedAc: 28,
    bab: 20,
    grapple: 36,
    abilities: { str: 35, dex: 25, con: 31, int: 24, wis: 24, cha: 26 },
    saves: { fort: 22, ref: 19, will: 19 },
    attacks: [
      {
        name: "+1 Vorpal Longsword",
        type: "Melee",
        bonus: 31,
        damage: "2d6+8",
        crit: "19-20/x2",
        damageType: "Slashing plus Vorpal",
        range: "-"
      },
      {
        name: "+1 Flaming Whip",
        type: "Melee",
        bonus: 30,
        damage: "1d4+4 plus 1d6 Fire",
        crit: "20/x2",
        damageType: "Slashing plus Fire",
        range: "15 ft."
      }
    ],
    skills: [
      { name: "Bluff", mod: 31 },
      { name: "Concentration", mod: 33 },
      { name: "Diplomacy", mod: 35 },
      { name: "Disguise", mod: 8 },
      { name: "Hide", mod: 26 },
      { name: "Intimidate", mod: 33 },
      { name: "Knowledge (Any Two)", mod: 30 },
      { name: "Listen", mod: 38 },
      { name: "Move Silently", mod: 30 },
      { name: "Search", mod: 30 },
      { name: "Sense Motive", mod: 30 },
      { name: "Spellcraft", mod: 30 },
      { name: "Spot", mod: 38 },
      { name: "Survival", mod: 7 }
    ],
    feats: [
      { name: "Cleave" },
      { name: "Combat Reflexes" },
      { name: "Greater Two-Weapon Fighting" },
      { name: "Improved Initiative" },
      { name: "Improved Two-Weapon Fighting" },
      { name: "Power Attack" },
      { name: "Two-Weapon Fighting" },
      { name: "Weapon Focus (Longsword)" }
    ],
    specialAbilities: [
      { name: "Death Throes", type: "Ex", description: "When killed, a balor explodes in a blinding flash that deals 100 points of damage to anything within 100 ft. (Reflex DC 30 half)." },
      { name: "Entangle", type: "Ex", description: "Balor's whip can entangle foes like a lasso." },
      { name: "Flaming Body", type: "Su", description: "Any creature grappling a balor takes 6d6 points of fire damage each round." },
      { name: "Vorpal Strike", type: "Su", description: "Natural 20 on attack severed head instantly." },
      { name: "Damage Reduction 15/Cold Iron and Good", type: "Su", description: "Takes 15 less damage unless weapon is cold iron and good." },
      { name: "Spell Resistance 28", type: "Ex", description: "Formidable spell resistance." },
      { name: "Spell-Like Abilities", type: "Sp", description: "At will: blasphemy (DC 25), dominate monster (DC 27), greater dispel magic, power word stun, telekinesis, greater teleport, unholy aura. 1/day: fire storm (DC 26), implosion (DC 27). Caster level 20th." },
      { name: "Summon Tanar'ri", type: "Sp", description: "1/day: summon 4d10 dretches, 1d4 hezrous, or 1 glabrezu/marilith/balor (20%)." },
      { name: "Tanar'ri Traits", type: "Ex", description: "Immune to electricity and poison. Resistance to acid 10, cold 10, fire 10." },
      { name: "Telepathy 100 ft.", type: "Su", description: "Can communicate mentally within 100 ft." }
    ],
    spells: [
      { name: "Fire Storm", level: 8, school: "Evocation", castingTime: "1 standard action", range: "Medium (100 ft. + 10 ft./level)", duration: "Instantaneous", savingThrow: "Reflex half (DC 26)", spellResistance: "Yes", description: "Raging tempest of fire deals 20d6 fire damage." },
      { name: "Implosion", level: 9, school: "Evocation", castingTime: "1 standard action", range: "Close (25 ft. + 5 ft./2 levels)", duration: "Concentration (up to 4 rounds)", savingThrow: "Fortitude negates (DC 27)", spellResistance: "Yes", description: "Destroys one creature per round." },
      { name: "Blasphemy", level: 7, school: "Evocation", castingTime: "1 standard action", range: "30 ft.", duration: "Instantaneous", savingThrow: "None", spellResistance: "Yes", description: "Kills, paralyzes, weakens, or dazes non-evil creatures (DC 25)." },
      { name: "Dominate Monster", level: 9, school: "Enchantment", castingTime: "1 standard action", range: "Close (25 ft. + 5 ft./2 levels)", duration: "1 day/level", savingThrow: "Will negates (DC 27)", spellResistance: "Yes", description: "Controls any creature telepathically." },
      { name: "Greater Dispel Magic", level: 6, school: "Abjuration", castingTime: "1 standard action", range: "Medium (100 ft. + 10 ft./level)", duration: "Instantaneous", savingThrow: "None", spellResistance: "No", description: "As dispel magic, up to +20 on check." },
      { name: "Power Word Stun", level: 8, school: "Enchantment", castingTime: "1 standard action", range: "Close (25 ft. + 5 ft./2 levels)", duration: "See text", savingThrow: "None", spellResistance: "Yes", description: "Stuns creature with 150 hp or less." },
      { name: "Telekinesis", level: 5, school: "Transmutation", castingTime: "1 standard action", range: "Long (400 ft. + 40 ft./level)", duration: "Concentration", savingThrow: "Will negates (DC 20)", spellResistance: "Yes", description: "Moves objects or hurls enemies." },
      { name: "Unholy Aura", level: 8, school: "Abjuration", castingTime: "1 standard action", range: "20 ft.", duration: "1 round/level", savingThrow: "Fortitude partial", spellResistance: "Yes", description: "+4 AC, +4 resistance, SR 25 against good spells." },
      { name: "Greater Teleport", level: 7, school: "Transmutation", castingTime: "1 standard action", range: "Personal and touch", duration: "Instantaneous", savingThrow: "None", spellResistance: "No", description: "Instantly transports you without error." }
    ],
    description: "Balors are towering shadowy humanoids crowned in flames, wielding vorpal swords and fiery whips as the greatest lords of the Abyss.",
    tags: ["tanari", "tanarri", "tanar'ri", "demon", "iblis", "balor", "outsider", "abyss", "vorpal"]
  },
  {
    id: "pit_fiend",
    name: "Pit Fiend (Baatezu)",
    cr: "20",
    crNumeric: 20,
    size: "Large",
    sizeMod: -1,
    type: "Outsider (Evil, Extraplanar, Lawful, Baatezu)",
    hitDice: "18d8+144",
    hitDiceStr: "Outsider 18",
    hp: 225,
    initiative: 12,
    speed: "40 ft. (8 squares), fly 60 ft. (average)",
    baseSpeed: 40,
    armorBonus: 0,
    shieldBonus: 0,
    naturalArmor: 23,
    deflection: 0,
    ac: 40,
    touchAc: 17,
    flatFootedAc: 32,
    bab: 18,
    grapple: 35,
    abilities: { str: 37, dex: 27, con: 27, int: 26, wis: 26, cha: 26 },
    saves: { fort: 19, ref: 19, will: 19 },
    attacks: [
      {
        name: "2 Wings",
        type: "Natural",
        bonus: 28,
        damage: "1d8+13",
        crit: "20/x2",
        damageType: "Bludgeoning",
        range: "-"
      },
      {
        name: "Bite",
        type: "Natural",
        bonus: 28,
        damage: "4d6+13 plus Poison",
        crit: "20/x2",
        damageType: "Piercing plus Poison",
        range: "-"
      },
      {
        name: "2 Claws",
        type: "Natural",
        bonus: 28,
        damage: "2d8+13",
        crit: "20/x2",
        damageType: "Slashing",
        range: "-"
      },
      {
        name: "Tail Slap",
        type: "Natural",
        bonus: 26,
        damage: "2d8+6",
        crit: "20/x2",
        damageType: "Bludgeoning",
        range: "-"
      }
    ],
    skills: [
      { name: "Bluff", mod: 29 },
      { name: "Climb", mod: 34 },
      { name: "Concentration", mod: 29 },
      { name: "Diplomacy", mod: 33 },
      { name: "Disguise", mod: 8 },
      { name: "Hide", mod: 25 },
      { name: "Intimidate", mod: 31 },
      { name: "Knowledge (Any Three)", mod: 29 },
      { name: "Listen", mod: 29 },
      { name: "Move Silently", mod: 29 },
      { name: "Search", mod: 29 },
      { name: "Sense Motive", mod: 29 },
      { name: "Spellcraft", mod: 29 },
      { name: "Spot", mod: 29 }
    ],
    feats: [
      { name: "Cleave" },
      { name: "Great Cleave" },
      { name: "Improved Initiative" },
      { name: "Iron Will" },
      { name: "Multiattack" },
      { name: "Power Attack" },
      { name: "Quicken Spell-Like Ability (Fireball)" }
    ],
    specialAbilities: [
      { name: "Fear Aura", type: "Su", description: "Creatures within 20 ft. panicked (Will DC 27 negates)." },
      { name: "Poison", type: "Ex", description: "Bite injury: 1d6 Con / death, Fortitude DC 27 negates." },
      { name: "Disease (Devil Chills)", type: "Ex", description: "Bite injury: Fortitude DC 27, incubation 1d4 days, damage 1d4 Str." },
      { name: "Damage Reduction 15/Good and Silver", type: "Su", description: "Takes 15 less damage unless weapon is good and silver." },
      { name: "Spell Resistance 32", type: "Ex", description: "Supreme magic resistance." },
      { name: "Spell-Like Abilities", type: "Sp", description: "At will: fireball (DC 21), mass hold monster (DC 27), persistent image, greater teleport, unholy aura. 1/day: meteor swarm, wish." },
      { name: "Summon Baatezu", type: "Sp", description: "2/day: summon 2 bearded devils or 1 bone devil (100%), or 1 horned devil/ice devil (50%)." },
      { name: "Baatezu Traits", type: "Ex", description: "Immune to fire and poison. Resistance to acid 10, cold 10." },
      { name: "Telepathy 100 ft.", type: "Su", description: "Can communicate mentally within 100 ft." }
    ],
    spells: [
      { name: "Fireball", level: 3, school: "Evocation", castingTime: "1 standard action", range: "Long (400 ft. + 40 ft./level)", duration: "Instantaneous", savingThrow: "Reflex half (DC 21)", spellResistance: "Yes", description: "Explosion of flame deals 10d6 fire damage." },
      { name: "Meteor Swarm", level: 9, school: "Evocation", castingTime: "1 standard action", range: "Long (400 ft. + 40 ft./level)", duration: "Instantaneous", savingThrow: "None/Reflex half", spellResistance: "Yes", description: "Four 2-ft. spheres deal 24d6 total bludgeoning and fire damage." },
      { name: "Mass Hold Monster", level: 9, school: "Enchantment", castingTime: "1 standard action", range: "Medium (100 ft. + 10 ft./level)", duration: "1 round/level", savingThrow: "Will negates (DC 27)", spellResistance: "Yes", description: "Paralyzes all creatures in area." },
      { name: "Wish", level: 9, school: "Universal", castingTime: "1 standard action", range: "See text", duration: "See text", savingThrow: "See text", spellResistance: "Yes", description: "Alters reality once per day." },
      { name: "Persistent Image", level: 5, school: "Illusion", castingTime: "1 standard action", range: "Long (400 ft. + 40 ft./level)", duration: "1 min./level", savingThrow: "Will disbelief (DC 23)", spellResistance: "No", description: "Illusion includes sight, sound, and smell." },
      { name: "Unholy Aura", level: 8, school: "Abjuration", castingTime: "1 standard action", range: "20 ft.", duration: "1 round/level", savingThrow: "Fortitude partial", spellResistance: "Yes", description: "+4 AC, +4 resistance, SR 25." },
      { name: "Greater Teleport", level: 7, school: "Transmutation", castingTime: "1 standard action", range: "Personal and touch", duration: "Instantaneous", savingThrow: "None", spellResistance: "No", description: "Instantly transports you without error." }
    ],
    description: "Pit fiends are the undisputed lords and generals of the Nine Hells of Baator, master manipulators of tyrannical evil.",
    tags: ["baatezu", "devil", "seytan", "pit fiend", "outsider", "nine hells"]
  }
];
