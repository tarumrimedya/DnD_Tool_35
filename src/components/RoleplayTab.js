// Roleplay & Bio Sheet Component

import { SKILLS } from '../data/skillsData.js';
import { FEATS } from '../data/featsData.js';
import { ITEM_SLOTS, SAMPLE_EQUIPMENT } from '../data/equipmentData.js';
import { calculateTotalAbilityScores, calculateSkills, calculateArmorClass, calculateCarryingCapacity } from '../utils/dndEngine.js';

export function renderRoleplayTab(char) {
  const { scores, mods } = calculateTotalAbilityScores(char);
  const ac = calculateArmorClass(char, mods.dex);
  const skills = calculateSkills(char, mods, ac.checkPenalty);
  const capacity = calculateCarryingCapacity(scores.str);

  return `
    <div class="roleplay-tab-view">
      <!-- Top Grid: Bio & Character Profile + Equipment Slots -->
      <div class="grid-main-side" style="margin-bottom:1.5rem;">
        <!-- Bio Profile Card -->
        <div class="panel gold-border">
          <div class="panel-header">
            <h3 class="panel-title">📜 Character Bio & Identity</h3>
          </div>
          <div class="grid-2col" style="margin-bottom:1rem; font-size:0.9rem;">
            <div><strong>Character Name:</strong> ${char.name}</div>
            <div><strong>Player:</strong> ${char.player || 'Player'}</div>
            <div><strong>Alignment:</strong> ${char.alignment}</div>
            <div><strong>Deity:</strong> ${char.deity}</div>
            <div><strong>Gender / Age:</strong> ${char.gender}, ${char.age} yrs</div>
            <div><strong>Height / Weight:</strong> ${char.height}, ${char.weight}</div>
          </div>
          <div style="margin-bottom:1rem;">
            <strong style="color:var(--gold-light);">Background & Personality:</strong>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-top:0.25rem; line-height:1.5;">${char.bio}</p>
          </div>
          <div>
            <strong style="color:var(--gold-light);">Quest Notes & Relics:</strong>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-top:0.25rem;">${char.notes}</p>
          </div>
        </div>

        <!-- Carrying Capacity & Load Bar -->
        <div class="panel">
          <div class="panel-header">
            <h3 class="panel-title">🎒 Carrying Capacity</h3>
          </div>
          <div style="text-align:center; margin-bottom:1rem;">
            <div style="font-size:0.75rem; color:var(--text-muted);">Strength Score: ${scores.str}</div>
            <div style="font-size:1.4rem; font-weight:700; color:var(--gold-light);">${capacity.light} lbs Max Light Load</div>
          </div>
          <div style="font-size:0.8rem; display:flex; flex-direction:column; gap:0.5rem;">
            <div style="display:flex; justify-content:space-between; background:rgba(10,14,25,0.7); padding:0.4rem 0.8rem; border-radius:6px;">
              <span>Light Load:</span> <strong>0 - ${capacity.light} lbs</strong>
            </div>
            <div style="display:flex; justify-content:space-between; background:rgba(10,14,25,0.7); padding:0.4rem 0.8rem; border-radius:6px;">
              <span>Medium Load:</span> <strong>${capacity.light + 1} - ${capacity.medium} lbs</strong>
            </div>
            <div style="display:flex; justify-content:space-between; background:rgba(10,14,25,0.7); padding:0.4rem 0.8rem; border-radius:6px;">
              <span>Heavy Load:</span> <strong>${capacity.medium + 1} - ${capacity.heavy} lbs</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Equipment Slots Grid -->
      <div class="panel gold-border" style="margin-bottom:1.5rem;">
        <div class="panel-header">
          <h3 class="panel-title">🛡️ Magic Items & Equipment Slots</h3>
          <span style="font-size:0.8rem; color:var(--text-muted);">Body Slot Allocation</span>
        </div>
        <div class="equipment-slots-grid">
          ${ITEM_SLOTS.map(slot => {
            const itemId = char.equippedSlots[slot.id];
            const item = SAMPLE_EQUIPMENT[itemId];

            return `
              <div class="equipment-slot-card">
                <div class="slot-icon">💎</div>
                <div class="slot-details" style="flex:1;">
                  <h5>${slot.name}</h5>
                  ${item ? `
                    <div class="slot-item-name rule-book-trigger" data-itemid="${item.id}">
                      ${item.name} 📖
                    </div>
                  ` : `
                    <span style="font-size:0.8rem; color:var(--text-muted); italic;">(Empty Slot)</span>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Skill Ranks & Synergies Matrix -->
      <div class="panel" style="margin-bottom:1.5rem;">
        <div class="panel-header">
          <h3 class="panel-title">📊 Skill Ranks & Synergy Matrix</h3>
          <span style="font-size:0.8rem; color:var(--text-muted);">Armor Penalty: <strong>${ac.checkPenalty}</strong></span>
        </div>

        <div class="skills-table-container">
          <table class="skills-table">
            <thead>
              <tr>
                <th>Skill Name</th>
                <th>Key Ability</th>
                <th>Ranks</th>
                <th>Ability Mod</th>
                <th>Synergy</th>
                <th>ACP</th>
                <th>Total Mod</th>
                <th>Roll Check</th>
              </tr>
            </thead>
            <tbody>
              ${Object.keys(SKILLS).map(skillId => {
                const s = SKILLS[skillId];
                const calc = skills[skillId];
                if (!calc) return '';

                return `
                  <tr>
                    <td>
                      <span class="skill-name rule-book-trigger" data-skillid="${s.id}">
                        ${s.name} ${s.trainedOnly ? '🔒' : ''} 📖
                      </span>
                    </td>
                    <td style="text-transform:uppercase; font-size:0.75rem; color:var(--text-muted);">${s.ability}</td>
                    <td><strong>${calc.ranks}</strong></td>
                    <td>${calc.abilityMod >= 0 ? '+' + calc.abilityMod : calc.abilityMod}</td>
                    <td>
                      ${calc.synergy > 0 ? `<span class="synergy-badge">+${calc.synergy} Synergy</span>` : '-'}
                    </td>
                    <td>${s.armorCheckPenalty ? calc.penalty : 0}</td>
                    <td style="font-weight:700; color:var(--gold-light); font-size:0.95rem;">
                      ${calc.total >= 0 ? '+' + calc.total : calc.total}
                    </td>
                    <td>
                      <button class="btn-roll btn-roll-skill" data-name="${s.name} Check" data-mod="${calc.total}" style="padding:0.2rem 0.5rem; font-size:0.75rem;">
                        ⚡ Roll
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Feats & Special Abilities -->
      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">🏅 Feats & Special Abilities</h3>
        </div>
        <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:1rem;">
          ${(char.feats || []).map(featId => {
            const f = FEATS[featId];
            if (!f) return '';
            return `
              <div style="background:rgba(10,14,25,0.7); border:1px solid var(--border-subtle); border-radius:8px; padding:0.75rem;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <strong class="rule-book-trigger" data-featid="${f.id}" style="color:var(--gold-light); cursor:pointer;">
                    ${f.name} 📖
                  </strong>
                  <span class="rulebook-badge">${f.type}</span>
                </div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">
                  Prereqs: ${f.prereqs}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}
