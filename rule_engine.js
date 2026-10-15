/**
 * D&D 3.5e Declarative Rule & Modifier Engine
 * Handles ability modifiers, stacking rules, dynamic feat mechanics:
 * - Weapon Finesse (STR -> DEX attack substitution for light/finessable weapons)
 * - Shadow Blade (Adds DEX mod to damage for Shadow Hand weapons & stances)
 * - Power Attack (Attack penalty to damage bonus scaled by grip: 1x 1H, 2x 2H, 0x Off-hand)
 * - Bonus Stacking: Enhancement, Morale, Luck, Insight, Competence, Armor, Shield, Natural Armor
 *   take Math.max(); Dodge and Untyped bonuses stack.
 */

const RuleEngine = {
  // Calculate D&D 3.5e Ability Modifier: floor((score - 10) / 2)
  getAbilityMod(score) {
    return Math.floor(((Number(score) || 10) - 10) / 2);
  },

  // Check if weapon qualifies for Weapon Finesse
  isFinessable(weapon) {
    if (!weapon) return false;
    const name = (weapon.name || '').toLowerCase();
    const type = (weapon.type || '').toLowerCase();
    const tags = Array.isArray(weapon.tags) ? weapon.tags.map(t => t.toLowerCase()) : [];
    
    // Light weapons or explicitly finessable weapons
    if (weapon.isLight || tags.includes('light') || tags.includes('finessable')) return true;
    if (name.includes('rapier') || name.includes('whip') || name.includes('spiked chain') || name.includes('dagger') || name.includes('short sword')) return true;
    return false;
  },

  // Check if weapon belongs to Shadow Hand discipline
  isShadowHandWeapon(weapon) {
    if (!weapon) return false;
    const name = (weapon.name || '').toLowerCase();
    const discipline = (weapon.discipline || '').toLowerCase();
    if (discipline === 'shadow hand') return true;
    const shadowWeapons = ['dagger', 'short sword', 'sai', 'siangham', 'unarmed strike', 'spiked chain'];
    return shadowWeapons.some(sw => name.includes(sw));
  },

  // Resolve bonus stacking according to D&D 3.5e rules
  resolveBonusStacking(bonusList) {
    const stackingTypes = ['dodge', 'untyped', 'circumstance'];
    const buckets = {};
    let total = 0;

    bonusList.forEach(item => {
      const type = (item.type || 'untyped').toLowerCase();
      const val = Number(item.val) || 0;

      // Penalties always stack in D&D 3.5e
      if (val < 0) {
        total += val;
        return;
      }

      if (stackingTypes.includes(type)) {
        total += val;
      } else {
        if (!buckets[type] || val > buckets[type]) {
          buckets[type] = val;
        }
      }
    });

    Object.values(buckets).forEach(v => {
      total += v;
    });

    return total;
  },

  // Evaluate Weapon Attack Modifiers & Damage
  evaluateWeaponAttack(character, weapon, options = {}) {
    const {
      grip = weapon.grip || '1-Hand',
      powerAttack = 0,
      flanking = false,
      charge = false,
      higherGround = false,
      activeStance = character.activeStance || 'None',
      customModifiers = []
    } = options;

    const bab = Number(character.bab) || 0;
    const strMod = this.getAbilityMod(character.abilities?.str || 10);
    const dexMod = this.getAbilityMod(character.abilities?.dex || 10);

    // Feat detections
    const feats = (character.feats || []).map(f => (typeof f === 'string' ? f : f.name).toLowerCase());
    const hasWeaponFinesse = feats.some(f => f.includes('weapon finesse'));
    const hasShadowBlade = feats.some(f => f.includes('shadow blade'));
    const hasWeaponFocus = feats.some(f => f.includes('weapon focus') && (f.includes(weapon.name.toLowerCase()) || f.includes('all')));
    const hasWeaponSpec = feats.some(f => f.includes('weapon specialization') && (f.includes(weapon.name.toLowerCase()) || f.includes('all')));

    // 1. Attack Stat Calculation
    let attackStatMod = strMod;
    let attackStatName = 'STR';

    if (hasWeaponFinesse && this.isFinessable(weapon) && dexMod > strMod) {
      attackStatMod = dexMod;
      attackStatName = 'DEX (Weapon Finesse)';
    }

    // Power attack penalty: cannot exceed BAB
    const effectivePA = Math.min(bab, Math.max(0, Number(powerAttack) || 0));

    // Attack bonuses list
    const attackBonusItems = [
      { type: 'untyped', val: bab, source: 'BAB' },
      { type: 'untyped', val: attackStatMod, source: attackStatName },
      { type: 'untyped', val: -effectivePA, source: 'Power Attack Penalty' }
    ];

    if (weapon.attBonus) {
      attackBonusItems.push({ type: weapon.bonusType || 'enhancement', val: weapon.attBonus, source: 'Weapon Enhancement' });
    }
    if (hasWeaponFocus) {
      attackBonusItems.push({ type: 'untyped', val: 1, source: 'Weapon Focus' });
    }
    if (flanking) {
      attackBonusItems.push({ type: 'untyped', val: 2, source: 'Flanking' });
    }
    if (charge) {
      attackBonusItems.push({ type: 'untyped', val: 2, source: 'Charge' });
    }
    if (higherGround) {
      attackBonusItems.push({ type: 'untyped', val: 1, source: 'Higher Ground' });
    }

    // Add active external attack modifiers
    customModifiers.forEach(m => {
      if (m.bonusAtk) {
        attackBonusItems.push({ type: m.bonusType || 'untyped', val: m.bonusAtk, source: m.name });
      }
    });

    const netAttackBonus = this.resolveBonusStacking(attackBonusItems);

    // 2. Damage Calculation
    let strDamageMultiplier = 1.0;
    let paDamageMultiplier = 1;

    if (grip === '2-Hand') {
      strDamageMultiplier = 1.5;
      paDamageMultiplier = 2;
    } else if (grip === 'Off-Hand') {
      strDamageMultiplier = 0.5;
      paDamageMultiplier = 0;
    }

    const baseStrDmg = Math.floor(strMod * strDamageMultiplier);
    const paDmg = effectivePA * paDamageMultiplier;

    const damageBonusItems = [
      { type: 'untyped', val: baseStrDmg, source: `STR (${grip})` },
      { type: 'untyped', val: paDmg, source: `Power Attack (${paDamageMultiplier}x)` }
    ];

    if (weapon.dmgBonus) {
      damageBonusItems.push({ type: weapon.bonusType || 'enhancement', val: weapon.dmgBonus, source: 'Weapon Enhancement' });
    }
    if (hasWeaponSpec) {
      damageBonusItems.push({ type: 'untyped', val: 2, source: 'Weapon Specialization' });
    }

    // Shadow Blade: Add DEX mod to damage if in Shadow Hand stance and using Shadow Hand weapon
    const isShadowStance = (activeStance.toLowerCase().includes('shadow') || activeStance.toLowerCase().includes('island of blades') || activeStance.toLowerCase().includes('child of shadow') || activeStance.toLowerCase().includes('assassin'));
    if (hasShadowBlade && isShadowStance && this.isShadowHandWeapon(weapon)) {
      damageBonusItems.push({ type: 'untyped', val: dexMod, source: 'Shadow Blade (DEX)' });
    }

    const netFlatDamage = this.resolveBonusStacking(damageBonusItems);

    // Iterative attacks for 3.5e: BAB >= 16 -> 4 attacks (+0/-5/-10/-15), BAB >= 11 -> 3, BAB >= 6 -> 2, otherwise 1
    const iteratives = [netAttackBonus];
    if (bab >= 6) iteratives.push(netAttackBonus - 5);
    if (bab >= 11) iteratives.push(netAttackBonus - 10);
    if (bab >= 16) iteratives.push(netAttackBonus - 15);

    return {
      netAttackBonus,
      iteratives,
      attackStatName,
      attackStatMod,
      effectivePA,
      baseDice: weapon.extraDmg || weapon.dice || '1d8',
      netFlatDamage,
      critMin: weapon.critMin || 20,
      critMult: weapon.critMult || 2,
      damageType: weapon.dmgType || 'Slashing',
      attackBonusItems,
      damageBonusItems
    };
  },

  // Calculate Armor Class (Normal, Touch, Flat-Footed)
  evaluateAC(character, options = {}) {
    const dexMod = this.getAbilityMod(character.abilities?.dex || 10);
    const { combatExpertise = 0, fightingDefensively = false, totalDefense = false, charge = false } = options;

    let dodgeBonus = 0;
    if (combatExpertise > 0) dodgeBonus += Math.min(5, combatExpertise);
    if (fightingDefensively) dodgeBonus += 2;
    if (totalDefense) dodgeBonus += 4;

    const baseAC = 10;
    const armorBonus = character.acBreakdown?.armor || 0;
    const shieldBonus = character.acBreakdown?.shield || 0;
    const naturalBonus = character.acBreakdown?.natural || 0;
    const deflectionBonus = character.acBreakdown?.deflection || 0;
    const sizeBonus = character.acBreakdown?.size || 0;

    let effectiveDex = dexMod;
    if (character.maxDexToAc !== undefined && character.maxDexToAc !== null) {
      effectiveDex = Math.min(effectiveDex, character.maxDexToAc);
    }

    let penalty = 0;
    if (charge) penalty += 2;

    const total = baseAC + armorBonus + shieldBonus + naturalBonus + deflectionBonus + sizeBonus + effectiveDex + dodgeBonus - penalty;
    const touch = baseAC + deflectionBonus + sizeBonus + effectiveDex + dodgeBonus - penalty;
    
    // Flat-footed loses Dex and Dodge (unless Uncanny Dodge)
    const hasUncannyDodge = (character.specialAbilities || []).some(a => (typeof a === 'string' ? a : a.name).toLowerCase().includes('uncanny dodge'));
    const flat = baseAC + armorBonus + shieldBonus + naturalBonus + deflectionBonus + sizeBonus + (hasUncannyDodge ? effectiveDex : 0) - penalty;

    return { total, touch, flat, dodgeBonus, effectiveDex };
  },

  // Calculate Saving Throws
  evaluateSaves(character) {
    const conMod = this.getAbilityMod(character.abilities?.con || 10);
    const dexMod = this.getAbilityMod(character.abilities?.dex || 10);
    const wisMod = this.getAbilityMod(character.abilities?.wis || 10);

    const baseFort = character.baseSaves?.fort || 0;
    const baseRef = character.baseSaves?.ref || 0;
    const baseWill = character.baseSaves?.will || 0;

    const resist = character.saveBonuses?.resistance || 0;

    return {
      fort: baseFort + conMod + resist,
      ref: baseRef + dexMod + resist,
      will: baseWill + wisMod + resist
    };
  }
};

// Export for module systems or attach to window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RuleEngine;
} else if (typeof window !== 'undefined') {
  window.RuleEngine = RuleEngine;
}
