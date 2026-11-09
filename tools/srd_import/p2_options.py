"""HeroForge P2: Unearthed Arcana character traits (UA p.86-91), the Weak Will flaw (UA p.92) and
Complete Scoundrel skill tricks (CS Table 3-2, p.83; descriptions p.84-90). Values transcribed from the books;
benefit text is paraphrased (no verbatim rules text)."""
import sys, re, json
sys.stdout.reconfigure(encoding='utf-8')
OUT = sys.argv[1]
def slug(s): return re.sub(r'[^a-z0-9]+', '-', s.lower().replace('’', '').replace("'", '')).strip('-')
def m(target, value, condition=None): return {'target': target, 'value': value, 'formula': str(value), 'type': 'Untyped', 'condition': condition}
def sk(name, v, cond=None): return m('skill.' + name, v, cond)

# ---------------- TRAITS (Unearthed Arcana) ----------------
T = []
def trait(name, page, benefit, drawback, mods, flags=None, special=None):
    T.append((name, page, benefit, drawback, mods, flags or {}, special))
trait('Abrasive', 87, '+1 on Intimidate checks.', '–1 on Diplomacy and Bluff checks.', [sk('intimidate', 1), sk('diplomacy', -1), sk('bluff', -1)])
trait('Absent-Minded', 87, '+1 on Knowledge checks (does not allow untrained use).', '–1 on Spot and Listen checks.', [sk('knowledge', 1), sk('spot', -1), sk('listen', -1)])
trait('Aggressive', 87, '+2 on initiative checks.', '–1 penalty to Armor Class.', [m('init', 2), m('ac', -1)])
trait('Brawler', 87, '+1 on unarmed attack rolls and grapple checks.', '–1 on all other attack rolls.',
      [m('grapple', 1), m('attack.all', 1, 'Unarmed attacks (not natural weapons)'), m('attack.all', -1, 'All attack rolls other than unarmed attacks and grapple checks')],
      special='Not available to a character with Improved Unarmed Strike; lost if that feat is gained later.')
trait('Cautious', 87, '+1 additional dodge bonus to AC when fighting defensively or using total defense.', '–1 on saves against fear effects.',
      [m('ac.dodge', 1, 'When fighting defensively or taking the total defense action'), m('save.all', -1, 'vs Fear')],
      special='Not available to a character immune to fear; benefit lost if immunity is gained later.')
trait('Detached', 87, '+1 on Will saves.', '–1 on Reflex saves.', [m('save.will', 1), m('save.ref', -1)])
trait('Dishonest', 87, '+1 on Bluff checks.', '–2 on Diplomacy checks.', [sk('bluff', 1), sk('diplomacy', -2)])
trait('Distinctive', 87, '+1 on Reputation checks (Reputation variant).', '–1 on Disguise checks.', [sk('disguise', -1)],
      {'reputationBonus': 1}, special='Only with the Reputation variant (Unearthed Arcana chapter 6).')
trait('Easygoing', 87, '+1 on Gather Information checks.', '–1 on Intimidate and Sense Motive checks.', [sk('gather_information', 1), sk('intimidate', -1), sk('sense_motive', -1)])
trait('Farsighted', 87, '+1 on Spot checks.', '–2 on Search checks.', [sk('spot', 1), sk('search', -2)])
trait('Focused', 88, '+1 on Concentration checks.', '–1 on Spot and Listen checks.', [sk('concentration', 1), sk('spot', -1), sk('listen', -1)])
trait('Hard of Hearing', 88, '+1 on Spot checks.', '–2 on Listen checks.', [sk('spot', 1), sk('listen', -2)])
trait('Hardy', 88, '+1 on Fortitude saves.', '–1 on Reflex saves.', [m('save.fort', 1), m('save.ref', -1)])
trait('Honest', 88, '+1 on Diplomacy checks.', '–1 on Bluff and Sense Motive checks.', [sk('diplomacy', 1), sk('bluff', -1), sk('sense_motive', -1)])
trait('Illiterate', 88, '+1 on checks with one chosen skill (not Decipher Script or Forgery).', 'You cannot read; spending 2 skill points makes you literate and removes the drawback.',
      [], {'requiresChoice': 'skill', 'illiterate': True}, special='Not available if already illiterate due to race, class, or another reason.')
trait('Inattentive', 88, '+1 on simple checks with one chosen skill that allows complex skill checks.', '–4 on complex skill checks with that skill.',
      [], {'requiresChoice': 'skill', 'complexSkillChecksVariant': True}, special='Requires the complex skill checks variant; may be taken more than once for different skills.')
trait('Musclebound', 89, '+1 on Strength-based skill checks and ability checks.', '–2 on Dexterity-based skill checks and ability checks.',
      [sk('climb', 1), sk('jump', 1), sk('swim', 1), m('ability.str_check', 1)] +
      [sk(s, -2) for s in ('balance', 'escape_artist', 'hide', 'move_silently', 'open_lock', 'ride', 'sleight_of_hand', 'tumble', 'use_rope')] +
      [m('ability.dex_check', -2, 'Dexterity ability checks')])
trait('Nearsighted', 89, '+1 on Search checks.', '–1 on Spot checks.', [sk('search', 1), sk('spot', -1)])
trait('Nightsighted', 89, '+10 feet to the range of your darkvision.', '–1 on Spot checks in areas of bright light.',
      [sk('spot', -1, 'In bright light')], {'darkvisionBonusFt': 10}, special='Requires darkvision as a racial ability.')
trait('Passionate', 89, '+1 on Fortitude saves.', '–1 on Will saves.', [m('save.fort', 1), m('save.will', -1)])
trait('Plucky', 89, '+1 on Will saves.', '–1 on Fortitude saves.', [m('save.will', 1), m('save.fort', -1)])
trait('Polite', 89, '+1 on Diplomacy checks.', '–2 on Intimidate checks.', [sk('diplomacy', 1), sk('intimidate', -2)])
trait('Quick', 89, '+10 feet to base land speed (or to your highest speed if you have no land speed).', '–1 hit point per level, including 1st (minimum 0 per level).',
      [m('speed.land', 10)], {'frailHpPenalty': True}, special='Requires Constitution 4 or higher.')
trait('Reckless', 89, '+1 on damage rolls after successful melee attacks.', '–1 on melee attack rolls.', [m('damage.melee', 1), m('attack.melee', -1)])
trait('Relentless', 90, '+2 on Constitution checks and other checks to continue tiring activities (as listed for Endurance).', 'Effects that would fatigue you exhaust you instead.',
      [m('ability.con_check', 2, 'Checks to continue tiring activities (Endurance list)')], {'fatigueBecomesExhaustion': True})
trait('Saddleborn', 90, '+1 on Ride checks.', '–1 on Handle Animal checks.', [sk('ride', 1), sk('handle_animal', -1)])
trait('Skinny', 90, '+1 on Escape Artist checks.', '–2 on Strength checks to avoid being bull rushed or overrun.',
      [sk('escape_artist', 1), m('ability.str_check', -2, 'vs Bull Rush / Overrun')])
trait('Slippery', 90, '+1 on Escape Artist checks and grapple checks made to escape or avoid a grapple.', '–1 on all other grapple checks.',
      [sk('escape_artist', 1, 'To escape a grapple'), m('grapple', 1, 'To escape or avoid being grappled'), m('grapple', -1, 'All other grapple checks')])
trait('Slow', 90, '+1 hit point per level.', 'Base land speed is halved (round down to the nearest 5-foot interval).',
      [], {'hpPerLevel': True, 'halfBaseLandSpeed': True}, special='Requires a base land speed of at least 20 feet.')
trait('Specialized', 90, '+1 on checks with one chosen Craft, Knowledge, or Profession skill.', '–2 on all other checks with that skill group.',
      [], {'requiresChoice': 'skillSubtype'})
trait('Spellgifted', 90, '+1 caster level for spells of one chosen school.', '–1 caster level for spells of all other schools.',
      [], {'requiresChoice': 'school'})
trait('Stout', 90, '+2 on Strength checks to avoid being bull rushed or overrun.', '–1 on Escape Artist checks.',
      [m('ability.str_check', 2, 'vs Bull Rush / Overrun'), sk('escape_artist', -1)])
trait('Suspicious', 90, '+1 on Sense Motive checks.', '–1 on Diplomacy and Intimidate checks.', [sk('sense_motive', 1), sk('diplomacy', -1), sk('intimidate', -1)])
trait('Torpid', 90, '+1 on saves against enchantment (compulsion) effects.', '–2 on initiative checks.', [m('save.all', 1, 'vs Enchantment (Compulsion)'), m('init', -2)])
trait('Uncivilized', 90, '+1 on Handle Animal checks and wild empathy checks.', '–1 on Bluff, Diplomacy, and Gather Information checks.',
      [sk('handle_animal', 1), m('wildEmpathy', 1, 'Wild empathy checks'), sk('bluff', -1), sk('diplomacy', -1), sk('gather_information', -1)])

def trait_rec(t):
    name, page, ben, drw, mods, flags, special = t
    short = f'Benefit: {ben} Drawback: {drw}' + (f' Special: {special}' if special else '')
    return {'id': 'trait-' + slug(name), 'schemaVersion': 2, 'name': name, 'type': 'Trait', 'category': 'Character Trait',
            'source': f'Unearthed Arcana p.{page}', 'slot': 'None', 'action': 'Passive',
            'prerequisites': special or '', 'prereq': special or '', 'benefit': ben, 'drawback': drw,
            'shortDescription': short, 'description': f'<p><strong>Benefit:</strong> {ben}</p><p><strong>Drawback:</strong> {drw}</p>' + (f'<p><strong>Special:</strong> {special}</p>' if special else ''),
            'tags': ['trait', 'unearthed arcana'], 'modifiers': mods, 'damageParts': [], 'modes': [],
            'ruleFlags': dict(flags, isTrait=True), 'tacticalBadges': ['Character Trait'],
            'tier': 'heroic', 'contentLevel': 'summary', 'verification': 'verified',
            'provenance': {'origin': 'rulebook', 'book': 'Unearthed Arcana', 'page': page}}

weak_will = {'id': 'flaw-weak-will', 'schemaVersion': 2, 'name': 'Weak Will', 'type': 'Flaw', 'category': 'Flaw',
             'source': 'Unearthed Arcana, p. 92', 'slot': 'None', 'slotDiff': 1, 'action': 'Passive', 'prerequisites': '1st level only',
             'shortDescription': '-3 penalty on Will saves. Grants +1 Bonus Feat.', 'benefit': '-3 penalty on Will saves. Grants +1 Bonus Feat.',
             'modifiers': [{'target': 'save.will', 'value': -3, 'type': 'Untyped'}], 'damageParts': [],
             'ruleFlags': {'isFlaw': True, 'grantsBonusFeat': 1}, 'tacticalBadges': ['Flaw (+1 Bonus Feat)', '-3 Will Saves'],
             'tier': 'heroic', 'contentLevel': 'summary', 'verification': 'verified',
             'provenance': {'origin': 'rulebook', 'book': 'Unearthed Arcana', 'page': 92}}

# ---------------- SKILL TRICKS (Complete Scoundrel) ----------------
S = [  # name, category, page, prerequisite text, paraphrased benefit
 ('Acrobatic Backstab', 'Movement', 84, 'Tumble 12 ranks', 'After tumbling through a foe’s space, that foe is flat-footed against your next melee attack.'),
 ('Assume Quirk', 'Interaction', 85, 'Disguise 5 ranks', 'People familiar with the person you impersonate gain no bonus to see through your disguise.'),
 ('Back on Your Feet', 'Movement', 85, 'Tumble 12 ranks', 'Stand up from prone as an immediate action.'),
 ('Clarity of Vision', 'Mental', 85, 'Spot 12 ranks', 'Notice invisible creatures for 1 round.'),
 ('Clever Improviser', 'Manipulation', 85, 'Disable Device 5 ranks, Open Lock 5 ranks', 'No penalty on Disable Device or Open Lock checks for working without tools.'),
 ('Collector of Stories', 'Mental', 85, 'Knowledge (any) 5 ranks', '+5 on Knowledge checks made to identify creatures.'),
 ('Conceal Spellcasting', 'Manipulation', 85, 'Concentration 1 rank, Sleight of Hand 5 ranks, Spellcraft 1 rank', 'Hide the fact that you are casting a spell from onlookers.'),
 ('Corner Perch', 'Movement', 85, 'Climb 8 ranks', 'Brace yourself in a corner or chimney so both hands stay free.'),
 ('Dismount Attack', 'Movement', 86, 'Ride 5 ranks', 'Leap from a moving mount and charge an enemy in the same round.'),
 ('Easy Escape', 'Manipulation', 86, 'Medium or smaller size, Escape Artist 8 ranks', 'Bonus on checks to escape a grapple or pin.'),
 ('Escape Attack', 'Movement', 86, 'Escape Artist 8 ranks', 'Make an attack in the same round you break free of a grapple.'),
 ('Extreme Leap', 'Movement', 86, 'Jump 5 ranks', 'A successful long jump of at least 10 feet grants 10 feet of extra movement that round.'),
 ('False Theurgy', 'Manipulation', 86, 'Bluff or Sleight of Hand 8 ranks, Spellcraft 8 ranks', 'Make a spell you cast look like a different spell of the same level.'),
 ('Group Fake-Out', 'Interaction', 87, 'Bluff 8 ranks', 'Feint against several opponents with a single check.'),
 ('Healing Hands', 'Manipulation', 87, 'Heal 5 ranks', 'Stabilizing a dying creature also restores 1d6 hit points.'),
 ('Hidden Blade', 'Manipulation', 87, 'Sleight of Hand 5 ranks, Quick Draw', 'Draw a concealed weapon as a move action; the target is treated as flat-footed against it.'),
 ('Leaping Climber', 'Movement', 87, 'Climb 5 ranks, Jump 5 ranks', 'Add the distance of a jump to the start of a climb.'),
 ('Listen to This', 'Mental', 87, 'Listen 5 ranks', 'Repeat exactly something you recently overheard.'),
 ('Magical Appraisal', 'Mental', 87, 'Appraise 5 ranks, Knowledge (arcana) 5 ranks, Spellcraft 12 ranks', 'Identify the properties of a magic item.'),
 ('Mosquito’s Bite', 'Manipulation', 87, 'Sleight of Hand 12 ranks', 'A flat-footed target does not notice damage you deal it with a light weapon.'),
 ('Never Outnumbered', 'Interaction', 87, 'Intimidate 8 ranks', 'Demoralize several opponents in combat with a single check.'),
 ('Nimble Charge', 'Movement', 87, 'Balance 5 ranks', 'Run or charge across a difficult surface without a Balance check.'),
 ('Nimble Stand', 'Movement', 88, 'Tumble 8 ranks', 'Stand up from prone without provoking attacks of opportunity.'),
 ('Opening Tap', 'Manipulation', 88, 'Open Lock 12 ranks', 'Open a lock as a swift action.'),
 ('Point It Out', 'Mental', 88, 'Spot 8 ranks', 'Let an ally make a free Spot check to notice something you have spotted.'),
 ('Quick Escape', 'Manipulation', 88, 'Escape Artist 12 ranks', 'Slip out of a grapple or restraints faster than normal.'),
 ('Quick Swimmer', 'Movement', 88, 'Swim 5 ranks', 'Swim 10 extra feet on a successful check.'),
 ('Second Impression', 'Interaction', 88, 'Bluff 5 ranks, Disguise 5 ranks', 'Use a Bluff check to recover a disguise that has been seen through.'),
 ('Shrouded Dance', 'Manipulation', 89, 'Hide 8 ranks, Perform (dance) 5 ranks', 'Gain concealment for 1 round as a move action.'),
 ('Slipping Past', 'Movement', 89, 'Escape Artist 5 ranks, Tumble 5 ranks', 'Move through a tight space without the usual penalties.'),
 ('Social Recovery', 'Interaction', 89, 'Bluff 8 ranks, Diplomacy 5 ranks', 'Make a Bluff check to make up for a failed Diplomacy check.'),
 ('Speedy Ascent', 'Movement', 89, 'Climb 5 ranks', 'Climb 10 extra feet on a successful check.'),
 ('Spot the Weak Point', 'Mental', 89, 'Spot 12 ranks', 'Make your next attack against the target a touch attack.'),
 ('Sudden Draw', 'Manipulation', 89, 'Sleight of Hand 8 ranks, Quick Draw', 'Draw a concealed weapon as part of an attack of opportunity.'),
 ('Swift Concentration', 'Mental', 90, 'Concentration 12 ranks', 'Maintain concentration on a spell as a swift action.'),
 ('Timely Misdirection', 'Interaction', 90, 'Bluff 8 ranks', 'A successful feint lets you avoid attacks of opportunity from that foe.'),
 ('Tumbling Crawl', 'Movement', 90, 'Tumble 5 ranks', 'Crawl 5 feet without provoking attacks of opportunity.'),
 ('Twisted Charge', 'Movement', 90, 'Balance 5 ranks, Tumble 5 ranks', 'Change direction once during a charge.'),
 ('Up the Hill', 'Movement', 90, 'Balance 5 ranks, Jump 5 ranks', 'Move up slopes or stairs at normal speed.'),
 ('Walk the Walls', 'Movement', 90, 'Climb 12 ranks, Tumble 5 ranks', 'Run straight up a wall for 1 round.'),
 ('Wall Jumper', 'Movement', 90, 'Climb 5 ranks, Jump 5 ranks', 'Leap off a wall as if you had a running start.'),
 ('Whip Climber', 'Manipulation', 90, 'Use Rope 5 ranks, proficiency with whip', 'Use a whip as a grappling hook.'),
]
SKILLKEY = lambda s: s.lower().replace(' ', '_').replace('(', '').replace(')', '')
def prereq_struct(txt):
    skills, feats, other = {}, [], []
    for part in [p.strip() for p in txt.split(',')]:
        mm = re.match(r'^(.+?) (\d+) ranks?$', part)
        if mm and ' or ' not in mm.group(1) and '(any)' not in mm.group(1):
            skills[SKILLKEY(mm.group(1))] = int(mm.group(2))
        elif part in ('Quick Draw',): feats.append(part)
        else: other.append(part)
    out = {}
    if skills: out['skills'] = skills
    if feats: out['feats'] = feats
    if other: out['other'] = other
    return out
def trick_rec(t):
    name, cat, page, pre, ben = t
    return {'id': 'trick-' + slug(name), 'schemaVersion': 2, 'name': name, 'type': 'Skill Trick', 'category': cat,
            'source': f'Complete Scoundrel p.{page}', 'slot': 'None', 'prerequisites': pre, 'prereq': pre, 'prereqStruct': prereq_struct(pre),
            'benefit': ben, 'shortDescription': ben, 'description': f'<p><strong>Prerequisite:</strong> {pre}.</p><p><strong>Benefit:</strong> {ben}</p>',
            'cost': {'skillPoints': 2}, 'usage': 'Once per encounter unless the trick states otherwise',
            'tags': ['skill trick', cat.lower(), 'complete scoundrel'], 'modifiers': [], 'damageParts': [], 'modes': [],
            'ruleFlags': {'isSkillTrick': True}, 'tier': 'heroic', 'contentLevel': 'summary', 'verification': 'verified',
            'provenance': {'origin': 'rulebook', 'book': 'Complete Scoundrel', 'page': page, 'table': 'Table 3-2: Skill Tricks'}}

recs = [trait_rec(t) for t in T] + [trick_rec(s) for s in S]
json.dump({'splat': recs, 'weakWill': weak_will}, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print(len(T), 'traits,', len(S), 'skill tricks, + Weak Will flaw')
