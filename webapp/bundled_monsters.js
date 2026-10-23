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
    description: "Mind flayers are sadistic subterranean masterminds that wield devastating psionic powers and feast upon brains."
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
    description: "An iron golem has a humanoid body made of iron. It weighs about 5,000 pounds and strikes with colossal, crushing force."
  }
];
