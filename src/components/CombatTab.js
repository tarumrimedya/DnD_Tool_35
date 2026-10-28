// Combat Sheet Component

import { RACES } from '../data/racesData.js';
import { CLASSES } from '../data/classesData.js';
import { SPELLS } from '../data/spellsData.js';
import { SAMPLE_EQUIPMENT } from '../data/equipmentData.js';
import { calculateTotalAbilityScores, calculateBAB, calculateSaves, calculateArmorClass } from '../utils/dndEngine.js';

export function renderCombatTab(char) {
  const race = RACES[char.race] || RACES.human;
  const { scores, mods } = calculateTotalAbilityScores(char);
  const babData = calculateBAB(char);
  const saves = calculateSaves(char, mods);
  const ac = calculateArmorClass(char, mods.dex);

  const initBonus = mods.dex + (char.feats.includes('improved_initiative') ? 4 : 0);

  // Total level calculation
  const totalLevel = char.classes.reduce((sum, c) => sum + c.level, 0);
  const classString = char.classes.map(c => `${CLASSES[c.classId]?.name || c.classId} ${c.level}`).join(' / ');

  return `
    <div class="combat-tab-view">
      <!-- Character Summary Header -->
      <div class="char-summary-bar">
        <div style="display:flex; align-items:center; gap:1rem;">
          <div class="char-portrait-mini" style="background:rgba(212,175,55,0.1);display:flex;align-items:center;justify-content:center;font-size:1.8rem;">
            ⚔️
          </div>
          <div>
            <h2>${char.name}</h2>
            <div class="char-summary-meta">
              <span class="char-meta-pill">Lvl ${totalLevel} ${race.name}</span>
              <span class="char-meta-pill">${classString}</span>
              <span class="char-meta-pill">${char.alignment}</span>
              ${char.useFractionalBAB ? '<span class="char-meta-pill" style="border-color:var(--purple-accent);color:#c4b5fd;">Unearthed Arcana Fractional Rules</span>' : ''}
            </div>
          </div>
        </div>

        <!-- HP Controls -->
        <div style="background:rgba(10,14,25,0.85); border:1px solid var(--border-gold); padding:0.6rem 1.2rem; border-radius:12px; display:flex; align-items:center; gap:1.2rem;">
          <div>
            <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Hit Points (HP)</div>
            <div style="font-size:1.5rem; font-weight:700; color:#ef4444; font-family:var(--font-heading);">
              ${char.hp.current} <span style="font-size:0.9rem; color:var(--text-muted);">/ ${char.hp.max}</span>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.25rem;">
            <div style="display:flex; gap:0.3rem;">
              <button class="btn-secondary btn-hp-mod" data-mod="-5" style="padding:0.15rem 0.4rem;font-size:0.75rem;">-5</button>
              <button class="btn-secondary btn-hp-mod" data-mod="-1" style="padding:0.15rem 0.4rem;font-size:0.75rem;">-1</button>
              <button class="btn-secondary btn-hp-mod" data-mod="+1" style="padding:0.15rem 0.4rem;font-size:0.75rem;">+1</button>
              <button class="btn-secondary btn-hp-mod" data-mod="+5" style="padding:0.15rem 0.4rem;font-size:0.75rem;">+5</button>
            </div>
          </div>
        </div>

        <!-- Quick Summary Stats -->
        <div class="char-summary-stats">
          <div class="summary-stat-box highlight">
            <div class="summary-stat-label">Armor Class</div>
            <div class="summary-stat-value">${ac.total}</div>
          </div>
          <div class="summary-stat-box">
            <div class="summary-stat-label">Initiative</div>
            <div class="summary-stat-value" style="cursor:pointer;" id="btn-roll-init" title="Click to Roll Initiative">
              ${initBonus >= 0 ? '+' + initBonus : initBonus}
            </div>
          </div>
          <div class="summary-stat-box">
            <div class="summary-stat-label">BAB</div>
            <div class="summary-stat-value">+${babData.bab}</div>
          </div>
        </div>
      </div>

      <!-- Ability Scores Bar -->
      <div class="ability-grid">
        ${Object.keys(scores).map(stat => `
          <div class="ability-card">
            <div class="ability-name">${stat.toUpperCase()}</div>
            <div class="ability-score">${scores[stat]}</div>
            <div class="ability-mod">${mods[stat] >= 0 ? '+' + mods[stat] : mods[stat]}</div>
          </div>
        `).join('')}
      </div>

      <!-- Main Combat Grid -->
      <div class="grid-main-side">
        <div>
          <!-- Weapons & Melee / Ranged Attacks -->
          <div class="panel gold-border">
            <div class="panel-header">
              <h3 class="panel-title">⚔️ Combat Attacks & Weapon Routines</h3>
              <span style="font-size:0.8rem; color:var(--text-muted);">Base Attack: <strong>${babData.attackRoutine}</strong></span>
            </div>

            <!-- Equipped Weapons List -->
            ${Object.keys(char.equippedSlots || {}).map(slotId => {
              const itemId = char.equippedSlots[slotId];
              const item = SAMPLE_EQUIPMENT[itemId];
              if (!item || !item.weaponData) return '';
              const w = item.weaponData;
              const atkBonus = babData.bab + mods.str + w.enhancement;
              const dmgBonus = mods.str + w.enhancement;

              return `
                <div class="weapon-card">
                  <div class="weapon-name">
                    <h4 class="rule-book-trigger" data-itemid="${item.id}" style="cursor:pointer;display:inline-block;">${item.name} 📖</h4>
                    <p>${w.type} &bull; ${w.properties.join(', ')}</p>
                  </div>
                  <div>
                    <div style="font-size:0.7rem;color:var(--text-muted);">Attack Bonus</div>
                    <div style="font-weight:700;color:var(--gold-light);font-size:1.1rem;">
                      +${atkBonus} <span style="font-size:0.75rem;color:var(--text-muted);">(${babData.attackRoutine.split('/').map(b => '+' + (parseInt(b) + mods.str + w.enhancement)).join('/')})</span>
                    </div>
                  </div>
                  <div>
                    <div style="font-size:0.7rem;color:var(--text-muted);">Damage / Crit</div>
                    <div style="font-weight:700;color:var(--text-main);">${w.damage} + ${dmgBonus} <span style="font-size:0.8rem;color:var(--gold-primary);">(${w.critRange})</span></div>
                  </div>
                  <div style="display:flex; gap:0.5rem;">
                    <button class="btn-roll btn-roll-weapon-atk" data-name="${item.name}" data-mod="${atkBonus}">⚔️ Attack</button>
                    <button class="btn-roll crimson btn-roll-weapon-dmg" data-name="${item.name}" data-dice="${w.damage}" data-mod="${dmgBonus}">💥 Damage</button>
                  </div>
                </div>
              `;
            }).join('')}

            ${!Object.values(char.equippedSlots || {}).some(id => SAMPLE_EQUIPMENT[id]?.weaponData) ? `
              <div class="weapon-card">
                <div class="weapon-name">
                  <h4>Unarmed Strike / Basic Attack</h4>
                  <p>Bludgeoning &bull; Simple</p>
                </div>
                <div>
                  <div style="font-size:0.7rem;color:var(--text-muted);">Attack Bonus</div>
                  <div style="font-weight:700;color:var(--gold-light);font-size:1.1rem;">+${babData.bab + mods.str}</div>
                </div>
                <div>
                  <div style="font-size:0.7rem;color:var(--text-muted);">Damage</div>
                  <div style="font-weight:700;">1d3 + ${mods.str} (20x2)</div>
                </div>
                <div style="display:flex; gap:0.5rem;">
                  <button class="btn-roll btn-roll-weapon-atk" data-name="Unarmed Strike" data-mod="${babData.bab + mods.str}">⚔️ Attack</button>
                  <button class="btn-roll crimson btn-roll-weapon-dmg" data-name="Unarmed Strike" data-dice="1d3" data-mod="${mods.str}">💥 Damage</button>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Spells & Daily Slots -->
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">✨ Arcane / Divine Spells & Daily Slots</h3>
              <span style="font-size:0.8rem; color:var(--text-muted);">Caster Level: <strong>${char.classes.reduce((sum,c) => sum + (CLASSES[c.classId]?.casterType !== 'none' ? c.level : 0), 0) || (char.dmCustomCasting?.enabled ? char.dmCustomCasting.customCasterLevel : 1)}</strong></span>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1rem;">
              <div style="background:rgba(10,14,25,0.7); border:1px solid var(--border-subtle); padding:0.75rem; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-size:0.8rem; font-weight:600;">1st-Level Spell Slots</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">DC: ${10 + 1 + mods.int}</div>
                </div>
                <div style="font-weight:700; font-size:1.1rem; color:var(--gold-light);">
                  ${char.spellSlots?.level1?.used || 0} / ${char.spellSlots?.level1?.total || 4}
                </div>
              </div>
            </div>

            <!-- Known Spells List -->
            <div style="display:flex; flex-direction:column; gap:0.5rem;">
              ${(char.spellsKnown || []).map(spellId => {
                const s = SPELLS[spellId];
                if (!s) return '';
                return `
                  <div style="background:rgba(15,21,35,0.8); border:1px solid var(--border-subtle); padding:0.6rem 0.8rem; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                      <strong class="rule-book-trigger" data-spellid="${s.id}" style="color:var(--gold-light); cursor:pointer;">${s.name} 📖</strong>
                      <span style="font-size:0.75rem; color:var(--text-muted); margin-left:0.5rem;">(${s.level} &bull; ${s.castingTime})</span>
                    </div>
                    <button class="btn-secondary btn-cast-spell" data-name="${s.name}" style="padding:0.2rem 0.6rem; font-size:0.75rem;">✨ Cast Spell</button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Sidebar: Defense & Saves & Active Buffs -->
        <div>
          <!-- Defense Breakdown (AC & Saves) -->
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">🛡️ Defense & Saving Throws</h3>
            </div>

            <!-- AC Breakdown Cards -->
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:0.5rem; margin-bottom:1rem; text-align:center;">
              <div style="background:rgba(10,14,25,0.8); border:1px solid var(--border-gold); padding:0.5rem; border-radius:8px;">
                <div style="font-size:0.65rem; color:var(--text-muted);">Normal AC</div>
                <div style="font-size:1.3rem; font-weight:700; color:var(--gold-light);">${ac.total}</div>
              </div>
              <div style="background:rgba(10,14,25,0.8); border:1px solid var(--border-subtle); padding:0.5rem; border-radius:8px;">
                <div style="font-size:0.65rem; color:var(--text-muted);">Touch AC</div>
                <div style="font-size:1.3rem; font-weight:700; color:var(--text-main);">${ac.touch}</div>
              </div>
              <div style="background:rgba(10,14,25,0.8); border:1px solid var(--border-subtle); padding:0.5rem; border-radius:8px;">
                <div style="font-size:0.65rem; color:var(--text-muted);">Flat-Footed</div>
                <div style="font-size:1.3rem; font-weight:700; color:var(--text-main);">${ac.flatFooted}</div>
              </div>
            </div>

            <!-- Saves List -->
            <div class="saves-grid" style="grid-template-columns:1fr; gap:0.6rem;">
              <div class="save-box">
                <div class="save-info">
                  <h4>Fortitude (CON)</h4>
                  <p>Base: +${saves.fort.base} | Con: +${saves.fort.mod}</p>
                </div>
                <div class="save-val btn-roll-save" data-name="Fortitude Save" data-mod="${saves.fort.total}">+${saves.fort.total}</div>
              </div>
              <div class="save-box">
                <div class="save-info">
                  <h4>Reflex (DEX)</h4>
                  <p>Base: +${saves.ref.base} | Dex: +${saves.ref.mod}</p>
                </div>
                <div class="save-val btn-roll-save" data-name="Reflex Save" data-mod="${saves.ref.total}">+${saves.ref.total}</div>
              </div>
              <div class="save-box">
                <div class="save-info">
                  <h4>Will (WIS)</h4>
                  <p>Base: +${saves.will.base} | Wis: +${saves.will.mod}</p>
                </div>
                <div class="save-val btn-roll-save" data-name="Will Save" data-mod="${saves.will.total}">+${saves.will.total}</div>
              </div>
            </div>
          </div>

          <!-- Active Buffs & Custom Bonus Stack -->
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">⚡ Active Buffs & Custom Modifiers</h3>
            </div>
            <div>
              ${(char.customBonuses || []).length === 0 ? '<p style="font-size:0.85rem;color:var(--text-muted);">No active custom bonuses registered.</p>' : ''}
              ${(char.customBonuses || []).map(b => `
                <div class="bonus-tag ${b.source.includes('DM') ? 'dm-override' : ''}">
                  <strong>${b.name}:</strong> +${b.amount} ${b.target.toUpperCase()} (${b.type})
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
