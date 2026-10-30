// Character Builder & Wizard Component

import { RACES } from '../data/racesData.js';
import { CLASSES } from '../data/classesData.js';
import { FEATS } from '../data/featsData.js';

export function renderBuilderTab(char) {
  return `
    <div class="builder-tab-view">
      <div class="panel gold-border">
        <div class="panel-header">
          <h3 class="panel-title">🛠️ Interactive Character Builder & Level Up</h3>
          <span style="font-size:0.8rem; color:var(--text-muted);">Quick Edit & Creation Wizard</span>
        </div>

        <form id="form-builder" style="display:flex; flex-direction:column; gap:1.5rem;">
          <!-- Basic Details -->
          <div class="grid-2col">
            <div class="form-group">
              <label class="form-label">Character Name</label>
              <input type="text" class="form-input" id="builder-name" value="${char.name}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Player Name</label>
              <input type="text" class="form-input" id="builder-player" value="${char.player || ''}" />
            </div>
          </div>

          <!-- Race & Alignment -->
          <div class="grid-2col">
            <div class="form-group">
              <label class="form-label">Race</label>
              <select class="form-select" id="builder-race">
                ${Object.keys(RACES).map(raceId => `
                  <option value="${raceId}" ${char.race === raceId ? 'selected' : ''}>
                    ${RACES[raceId].name} (${RACES[raceId].size}, Speed ${RACES[raceId].speed}ft)
                  </option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Alignment</label>
              <select class="form-select" id="builder-alignment">
                <option value="Lawful Good" ${char.alignment === 'Lawful Good' ? 'selected' : ''}>Lawful Good</option>
                <option value="Neutral Good" ${char.alignment === 'Neutral Good' ? 'selected' : ''}>Neutral Good</option>
                <option value="Chaotic Good" ${char.alignment === 'Chaotic Good' ? 'selected' : ''}>Chaotic Good</option>
                <option value="Lawful Neutral" ${char.alignment === 'Lawful Neutral' ? 'selected' : ''}>Lawful Neutral</option>
                <option value="True Neutral" ${char.alignment === 'True Neutral' ? 'selected' : ''}>True Neutral</option>
                <option value="Chaotic Neutral" ${char.alignment === 'Chaotic Neutral' ? 'selected' : ''}>Chaotic Neutral</option>
                <option value="Lawful Evil" ${char.alignment === 'Lawful Evil' ? 'selected' : ''}>Lawful Evil</option>
                <option value="Neutral Evil" ${char.alignment === 'Neutral Evil' ? 'selected' : ''}>Neutral Evil</option>
                <option value="Chaotic Evil" ${char.alignment === 'Chaotic Evil' ? 'selected' : ''}>Chaotic Evil</option>
              </select>
            </div>
          </div>

          <!-- Base Ability Scores -->
          <div>
            <h4 style="color:var(--gold-light); margin-bottom:0.75rem;">Base Ability Scores (Before Race / Items)</h4>
            <div class="grid-3col">
              ${Object.keys(char.baseAbilityScores).map(stat => `
                <div class="form-group">
                  <label class="form-label">${stat.toUpperCase()}</label>
                  <input type="number" min="3" max="25" class="form-input builder-base-stat" data-stat="${stat}" value="${char.baseAbilityScores[stat]}" />
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Class Levels Multiclassing -->
          <div>
            <h4 style="color:var(--gold-light); margin-bottom:0.75rem;">Class & Multiclass Levels</h4>
            <div class="grid-2col">
              <div class="form-group">
                <label class="form-label">Primary Class Level (Fighter)</label>
                <input type="number" min="0" max="20" class="form-input" id="builder-cls-fighter" value="${char.classes.find(c => c.classId === 'fighter')?.level || 0}" />
              </div>
              <div class="form-group">
                <label class="form-label">Secondary Class Level (Duskblade / Wizard)</label>
                <input type="number" min="0" max="20" class="form-input" id="builder-cls-duskblade" value="${char.classes.find(c => c.classId === 'duskblade')?.level || 0}" />
              </div>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:1rem;">
            <button type="submit" class="btn-primary" style="padding:0.75rem 2rem;">💾 Save & Update Character</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
