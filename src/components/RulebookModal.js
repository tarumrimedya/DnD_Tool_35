// Original Rulebook Description Modal Popup Component

export function renderRulebookModal(itemData, onClose) {
  if (!itemData) return '';

  return `
    <div class="modal-overlay" id="rulebook-modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <span class="rulebook-badge">${itemData.sourceBook || 'D&D 3.5e Rulebook'}</span>
            <h3 class="modal-title" style="margin-top: 0.25rem;">${itemData.name || itemData.id}</h3>
          </div>
          <button class="btn-close" id="btn-close-modal">&times;</button>
        </div>
        <div class="modal-body">
          ${itemData.prereqs ? `<div class="modal-meta-grid"><div><strong>Prerequisites:</strong> ${itemData.prereqs}</div><div><strong>Type:</strong> ${itemData.type || 'Feat'}</div></div>` : ''}
          ${itemData.level ? `<div class="modal-meta-grid"><div><strong>Spell Level:</strong> ${itemData.level}</div><div><strong>School:</strong> ${itemData.school}</div></div>` : ''}
          ${itemData.castingTime ? `<div class="modal-meta-grid"><div><strong>Casting Time:</strong> ${itemData.castingTime}</div><div><strong>Range:</strong> ${itemData.range}</div></div>` : ''}
          ${itemData.weaponData ? `<div class="modal-meta-grid"><div><strong>Damage:</strong> ${itemData.weaponData.damage} (${itemData.weaponData.critRange})</div><div><strong>Type:</strong> ${itemData.weaponData.type}</div></div>` : ''}
          ${itemData.traits ? `<div style="margin-bottom:1rem;"><strong>Racial Traits:</strong><ul>${itemData.traits.map(t => `<li style="margin-left:1.2rem;margin-top:0.2rem;">${t}</li>`).join('')}</ul></div>` : ''}
          
          <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; border-left: 3px solid var(--gold-primary);">
            <p style="white-space: pre-line;">${itemData.description || 'No detailed book description available.'}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}
