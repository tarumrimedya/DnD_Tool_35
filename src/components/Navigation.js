// Top Navigation Component

export function renderNavigation(activeTab, charName) {
  return `
    <header class="app-header">
      <div class="brand-title">
        <span style="font-size:1.5rem;">⚔️</span>
        <h1>D&D 3.5e Character Creator</h1>
        <span class="brand-badge">SRD + Expanded Books</span>
      </div>

      <nav class="nav-tabs">
        <button class="nav-tab ${activeTab === 'combat' ? 'active' : ''}" data-tab="combat">
          <span>⚔️</span> Combat Sheet
        </button>
        <button class="nav-tab ${activeTab === 'roleplay' ? 'active' : ''}" data-tab="roleplay">
          <span>📜</span> Roleplay & Bio
        </button>
        <button class="nav-tab ${activeTab === 'builder' ? 'active' : ''}" data-tab="builder">
          <span>🛠️</span> Character Builder
        </button>
        <button class="nav-tab ${activeTab === 'dm_overrides' ? 'active' : ''}" data-tab="dm_overrides">
          <span>⚙️</span> DM Overrides
        </button>
      </nav>

      <div class="header-actions">
        <button class="btn-secondary" id="btn-export-json" title="Export Character to JSON">📥 Export</button>
        <label class="btn-secondary" style="cursor:pointer;" title="Import Character JSON">
          📤 Import
          <input type="file" id="file-import-json" accept=".json" style="display:none;" />
        </label>
        <button class="btn-secondary" id="btn-reset-sample" title="Reload Sample Character">🔄 Reload Sample</button>
      </div>
    </header>
  `;
}
