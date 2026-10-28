// DM & Custom Overrides Panel Component

import { CLASSES } from '../data/classesData.js';

export function renderDMOverridesTab(char) {
  return `
    <div class="dm-overrides-tab-view">
      <!-- Section 1: Unearthed Arcana Fractional Rules -->
      <div class="panel gold-border" style="margin-bottom:1.5rem;">
        <div class="panel-header">
          <h3 class="panel-title">📚 Unearthed Arcana Fractional Rules</h3>
          <span style="font-size:0.8rem; color:var(--purple-accent);">Multiclassing Variants</span>
        </div>

        <div class="grid-2col">
          <div style="background:rgba(10,14,25,0.7); border:1px solid var(--border-subtle); padding:1rem; border-radius:8px;">
            <label style="display:flex; align-items:center; gap:0.75rem; cursor:pointer;">
              <input type="checkbox" id="toggle-fractional-bab" ${char.useFractionalBAB ? 'checked' : ''} style="width:18px;height:18px;" />
              <div>
                <strong style="color:var(--gold-light);">Enable Fractional Base Attack Bonus (BAB)</strong>
                <p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">
                  Sums fractional BAB per level (+1.0 Good, +0.75 Average, +0.5 Poor) before rounding down. Prevents fractional losses when multiclassing.
                </p>
              </div>
            </label>
          </div>

          <div style="background:rgba(10,14,25,0.7); border:1px solid var(--border-subtle); padding:1rem; border-radius:8px;">
            <label style="display:flex; align-items:center; gap:0.75rem; cursor:pointer;">
              <input type="checkbox" id="toggle-fractional-saves" ${char.useFractionalSaves ? 'checked' : ''} style="width:18px;height:18px;" />
              <div>
                <strong style="color:var(--gold-light);">Enable Fractional Base Saving Throws</strong>
                <p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">
                  Grants +2.0 base save bonus only the first time a good save is gained across all classes (+0.5/lvl Good, +0.333/lvl Poor).
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Section 2: DM Custom Class Caster Options -->
      <div class="panel gold-border" style="margin-bottom:1.5rem;">
        <div class="panel-header">
          <h3 class="panel-title">✨ DM Custom Spellcasting Assignment</h3>
          <span style="font-size:0.8rem; color:var(--gold-light);">Homebrew / DM Rule Option</span>
        </div>

        <div style="background:rgba(10,14,25,0.7); border:1px solid var(--border-subtle); padding:1rem; border-radius:8px;">
          <label style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem; cursor:pointer;">
            <input type="checkbox" id="toggle-dm-casting" ${char.dmCustomCasting?.enabled ? 'checked' : ''} style="width:18px;height:18px;" />
            <div>
              <strong style="color:var(--gold-light);">Grant Custom Spellcasting to Non-Caster Classes</strong>
              <p style="font-size:0.8rem; color:var(--text-muted);">Allows non-caster classes (or any character) to cast spells scaling with Character Level as Wizard, Sorcerer, Cleric, Warlock, etc.</p>
            </div>
          </label>

          <div class="grid-2col" style="display:${char.dmCustomCasting?.enabled ? 'grid' : 'none'};" id="dm-casting-options">
            <div class="form-group">
              <label class="form-label">Spellcasting Progression Class</label>
              <select class="form-select" id="dm-caster-type">
                <option value="wizard" ${char.dmCustomCasting?.casterType === 'wizard' ? 'selected' : ''}>Wizard (Arcane Prepared)</option>
                <option value="sorcerer" ${char.dmCustomCasting?.casterType === 'sorcerer' ? 'selected' : ''}>Sorcerer (Arcane Spontaneous)</option>
                <option value="cleric" ${char.dmCustomCasting?.casterType === 'cleric' ? 'selected' : ''}>Cleric (Divine Prepared)</option>
                <option value="warlock" ${char.dmCustomCasting?.casterType === 'warlock' ? 'selected' : ''}>Warlock (Invocations)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Custom Caster Level Override</label>
              <input type="number" min="1" max="20" class="form-input" id="dm-caster-level" value="${char.dmCustomCasting?.customCasterLevel || 4}" />
            </div>
          </div>
        </div>
      </div>

      <!-- Section 3: Add Custom Item / Spell / DM Bonus Stack -->
      <div class="panel gold-border">
        <div class="panel-header">
          <h3 class="panel-title">➕ Add Custom Bonus / Stat Override</h3>
        </div>

        <form id="form-add-bonus" style="display:flex; flex-direction:column; gap:1rem; margin-bottom:1.5rem;">
          <div class="grid-3col">
            <div class="form-group">
              <label class="form-label">Bonus Name / Label</label>
              <input type="text" class="form-input" id="bonus-name" placeholder="e.g. DM Sacred Blessing" required />
            </div>
            <div class="form-group">
              <label class="form-label">Target Stat / Parameter</label>
              <select class="form-select" id="bonus-target">
                <option value="str">Strength (STR)</option>
                <option value="dex">Dexterity (DEX)</option>
                <option value="con">Constitution (CON)</option>
                <option value="int">Intelligence (INT)</option>
                <option value="wis">Wisdom (WIS)</option>
                <option value="cha">Charisma (CHA)</option>
                <option value="ac">Armor Class (AC)</option>
                <option value="fort">Fortitude Save</option>
                <option value="ref">Reflex Save</option>
                <option value="will">Will Save</option>
                <option value="saves">All Saving Throws</option>
                <option value="attack">Attack Rolls</option>
                <option value="skills">All Skill Checks</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Bonus Value / Amount</label>
              <input type="number" class="form-input" id="bonus-amount" placeholder="e.g. +2" required />
            </div>
          </div>

          <div class="grid-2col">
            <div class="form-group">
              <label class="form-label">Bonus Type</label>
              <select class="form-select" id="bonus-type">
                <option value="Enhancement">Enhancement</option>
                <option value="Morale">Morale</option>
                <option value="Luck">Luck</option>
                <option value="Sacred">Sacred</option>
                <option value="Armor">Armor</option>
                <option value="Shield">Shield</option>
                <option value="Deflection">Deflection</option>
                <option value="Competence">Competence</option>
                <option value="Untyped">Untyped</option>
                <option value="DM Override">DM Override</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Source Description</label>
              <input type="text" class="form-input" id="bonus-source" placeholder="e.g. House Rule / Relic" />
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end;">
            <button type="submit" class="btn-primary">➕ Add Bonus to Stack</button>
          </div>
        </form>

        <!-- Active Bonus List with Delete Buttons -->
        <div>
          <h4 style="color:var(--gold-light); margin-bottom:0.75rem;">Current Active Custom Bonuses</h4>
          <div style="display:flex; flex-direction:column; gap:0.5rem;">
            ${(char.customBonuses || []).map((b, idx) => `
              <div style="background:rgba(10,14,25,0.7); border:1px solid var(--border-subtle); padding:0.6rem 0.8rem; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong style="color:var(--gold-light);">${b.name}</strong>
                  <span style="font-size:0.8rem; color:var(--text-muted); margin-left:0.5rem;">
                    &rarr; +${b.amount} ${b.target.toUpperCase()} (${b.type}) &bull; ${b.source}
                  </span>
                </div>
                <button class="btn-secondary btn-delete-bonus" data-index="${idx}" style="color:#ef4444; border-color:rgba(239,68,68,0.4); padding:0.2rem 0.6rem; font-size:0.75rem;">
                  🗑️ Remove
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}
