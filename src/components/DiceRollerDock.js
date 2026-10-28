// Floating Dice Roller Dock Component

import { getRollLog } from '../utils/diceRoller.js';

export function renderDiceRollerDock() {
  const logs = getRollLog();

  return `
    <div class="dice-roller-dock">
      <div class="dice-dock-header">
        <h4>⚡ Interactive Dice Roller</h4>
        <span style="font-size:0.7rem; color:var(--text-muted);">D&D 3.5e</span>
      </div>

      <div class="dice-btns">
        <button class="btn-dice" data-sides="20">d20</button>
        <button class="btn-dice" data-sides="12">d12</button>
        <button class="btn-dice" data-sides="10">d10</button>
        <button class="btn-dice" data-sides="8">d8</button>
        <button class="btn-dice" data-sides="6">d6</button>
        <button class="btn-dice" data-sides="4">d4</button>
        <button class="btn-dice" data-sides="100">d%</button>
        <button class="btn-dice" id="btn-clear-dice-log" style="background:rgba(220,38,38,0.2);border-color:var(--crimson-primary);color:#fca5a5;">Clear</button>
      </div>

      <div class="dice-log">
        ${logs.length === 0 ? '<div style="color:var(--text-muted);text-align:center;">No rolls recorded yet.</div>' : ''}
        ${logs.map(log => `
          <div class="dice-log-entry ${log.isNat20 ? 'nat20' : ''} ${log.isNat1 ? 'nat1' : ''}">
            <strong>${log.label}:</strong> rolled <span>${log.dice}</span> 
            &rarr; [${log.roll}] ${log.modifier >= 0 ? '+' + log.modifier : log.modifier} = 
            <strong style="font-size:0.9rem;color:${log.isNat20 ? '#4ade80' : log.isNat1 ? '#f87171' : 'var(--gold-light)'}">${log.total}</strong>
            ${log.isNat20 ? '🔥 NAT 20!' : ''} ${log.isNat1 ? '💀 NAT 1!' : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
