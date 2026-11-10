"""P1 (rest): class source pages from each book's table of contents, plus requirements for three
prestige classes that had none. All values were read from the rulebooks:
PHB contents (p.3), DMG contents (p.4), XPH contents (p.3), ToB / PHB2 / CM contents, CW contents (p.4),
CAr contents (p.4); requirements: CW p.34 (Frenzied Berserker), CW p.45 (Invisible Blade), CD p.70 (Ur-Priest).
Usage: p1_class_pages.py <database dir> [--apply]
"""
import sys, os, json, re
sys.stdout.reconfigure(encoding='utf-8')
DB = sys.argv[1]; APPLY = '--apply' in sys.argv
PHB = {'barbarian': 24, 'bard': 26, 'cleric': 30, 'druid': 33, 'fighter': 37, 'monk': 39, 'paladin': 42, 'ranger': 46, 'rogue': 49, 'sorcerer': 51, 'wizard': 55}
DMG_NPC = {'adept-npc': 107, 'aristocrat-npc': 108, 'commoner-npc': 108, 'expert-npc': 109, 'warrior-npc': 109}
DMG_PRC = {'arcane-archer': 176, 'arcane-trickster': 177, 'archmage': 178, 'assassin': 180, 'blackguard': 181, 'dragon-disciple': 183, 'duelist': 185,
           'dwarven-defender': 186, 'eldritch-knight': 187, 'hierophant': 188, 'horizon-walker': 189, 'loremaster': 190, 'mystic-theurge': 192,
           'red-wizard': 193, 'shadowdancer': 194, 'thaumaturgist': 196}
XPH = {'psion-telepath': 19, 'psion-shaper': 19, 'psion-nomad': 19, 'psion-egoist': 19, 'psion-kineticist': 19, 'psion-seer': 19,
       'psychic-warrior': 24, 'soulknife': 26, 'wilder': 29,
       'cerebremancer': 141, 'elocator': 142, 'psionic-fist': 144, 'slayer': 146, 'metamind': 147, 'psion-uncarnate': 148,
       'pyrokineticist': 151, 'thrallherd': 153, 'war-mind': 155}  # SRD Psionic Fist = Fist of Zuoken, Slayer = Illithid Slayer
OTHER = {'crusader': ('Tome of Battle', 8), 'swordsage': ('Tome of Battle', 15), 'warblade': ('Tome of Battle', 20),
         'bloodstorm-blade': ('Tome of Battle', 100), 'jade-phoenix-mage': ('Tome of Battle', 113),
         'duskblade': ("Player's Handbook II", 19), 'abjurant-champion': ('Complete Mage', 50),
         'dervish': ('Complete Warrior', 25), 'spellsword': ('Complete Warrior', 79), 'warlock': ('Complete Arcane', 5)}
PAGES = {}
for k, p in PHB.items(): PAGES['cls-' + k] = ('PHB', p, True)
for k, p in DMG_NPC.items(): PAGES['cls-' + k] = ('DMG', p, True)
for k, p in DMG_PRC.items(): PAGES['cls-' + k] = ("Dungeon Master's Guide", p, False)
for k, p in XPH.items(): PAGES['cls-' + k] = ('XPH', p, True)
for k, (b, p) in OTHER.items(): PAGES['cls-' + k] = (b, p, False)
R = lambda text, key, **kw: dict({'text': text, 'key': key}, **kw)
PREREQS = {
    'cls-frenzied-berserker': [
        R('Alignment: Any nonlawful', 'alignment', allowed=['NG', 'CG', 'TN', 'CN', 'NE', 'CE']),
        R('Base Attack Bonus: +6', 'bab', min=6),
        R('Feat: Cleave', 'feat', name='Cleave'), R('Feat: Destructive Rage', 'feat', name='Destructive Rage'),
        R('Feat: Intimidating Rage', 'feat', name='Intimidating Rage'), R('Feat: Power Attack', 'feat', name='Power Attack')],
    'cls-invisible-blade': [
        R('Skill: Bluff 8 ranks', 'skill', skill='bluff', ranks=8), R('Skill: Sense Motive 6 ranks', 'skill', skill='sense_motive', ranks=6),
        R('Feat: Far Shot', 'feat', name='Far Shot'), R('Feat: Point Blank Shot', 'feat', name='Point Blank Shot'),
        R('Feat: Weapon Focus (dagger, kukri, or punching dagger)', 'feat', name='Weapon Focus'),
        R('Special: Must defeat a worthy opponent in single combat using only daggers, kukris, or punching daggers', 'special')],
    'cls-ur-priest': [
        R('Alignment: Any evil', 'alignment', allowed=['LE', 'NE', 'CE']),
        R('Base Save Bonus: Fort +3, Will +3', 'special'),
        R('Skill: Bluff 6 ranks', 'skill', skill='bluff', ranks=6), R('Skill: Knowledge (arcana) 5 ranks', 'skill', skill='knowledge_arcana', ranks=5),
        R('Skill: Knowledge (the planes) 5 ranks', 'skill', skill='knowledge_planes', ranks=5),
        R('Skill: Knowledge (religion) 8 ranks', 'skill', skill='knowledge_religion', ranks=8), R('Skill: Spellcraft 8 ranks', 'skill', skill='spellcraft', ranks=8),
        R('Feat: Iron Will', 'feat', name='Iron Will'), R('Feat: Spell Focus (evil)', 'feat', name='Spell Focus'),
        R('Special: Must have no ability to cast divine spells (a lost ability, as with an ex-cleric, is forsaken)', 'special'),
        R('Special: Must be trained by another ur-priest', 'special')],
}
path = os.path.join(DB, 'srd_classes_races.json')
data = json.load(open(path, encoding='utf-8'))
log = []
for e in data:
    i = e.get('id')
    if i in PAGES:
        book, page, srd = PAGES[i]
        cur = str(e.get('source') or '')
        if not re.search(r'p\.?\s?\d', cur):
            full = {'PHB': "Player's Handbook", 'DMG': "Dungeon Master's Guide", 'XPH': 'Expanded Psionics Handbook'}.get(book, book)
            new = f'SRD / {book} p.{page}' if (srd and cur.upper().startswith('SRD')) else f'{full} p.{page}'
            log.append(f'{i}: {cur!r} -> {new!r}'); e['source'] = new
    if i in PREREQS and not e.get('prerequisites'):
        e['prerequisites'] = PREREQS[i]; log.append(f'{i}: prerequisites +{len(PREREQS[i])}')
print('\n'.join(log)); print(len(log), 'changes')
missing = [e['id'] for e in data if e.get('type') == 'Class' and not re.search(r'p\.?\s?\d', str(e.get('source') or ''))]
print('classes still without a page:', missing)
if APPLY:
    with open(path, 'w', encoding='utf-8', newline='') as f: f.write(json.dumps(data, indent=2, ensure_ascii=False) + '\n')
    print('applied')
