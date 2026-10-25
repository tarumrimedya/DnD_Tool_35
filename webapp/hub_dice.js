/**
 * Hub Dice Roller Engine (3D Physics, Pool, Custom Formula & Dice Drawer)
 * Joyful-Fermi D&D 3.5e Cockpit
 */

// Shared State
window.activeDicePool = { 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0, 100: 0 };
window.diceRollHistory = [];

// ====================================================
// 1. D&D 3.5e Vektör SVG Zar İkonları
// ====================================================
function getDiceIconSvg(die, cls = "w-4 h-4 inline-block align-middle") {
  const d = String(die || '20').toLowerCase().replace('d', '').trim();
  switch (d) {
    case '4':
      return `<svg class="${cls}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,10 90,85 10,85" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>
        <polygon points="50,34 76,76 24,76" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round"/>
        <line x1="50" y1="34" x2="50" y2="10" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="24" y1="76" x2="10" y2="85" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="76" y1="76" x2="90" y2="85" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <text x="50" y="66" text-anchor="middle" fill="currentColor" font-size="24" font-weight="900" font-family="system-ui, sans-serif">4</text>
      </svg>`;
    case '6':
      return `<svg class="${cls}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,12 85,31 85,69 50,88 15,69 15,31" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>
        <polygon points="50,12 85,31 50,50 15,31" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
        <polygon points="15,31 50,50 50,88 15,69" fill="currentColor" fill-opacity="0.35" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
        <line x1="50" y1="50" x2="85" y2="69" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="50" y1="50" x2="50" y2="88" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="50" y1="50" x2="15" y2="31" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <text x="32" y="66" text-anchor="middle" fill="currentColor" font-size="24" font-weight="900" font-family="system-ui, sans-serif">6</text>
      </svg>`;
    case '8':
      return `<svg class="${cls}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,8 86,32 86,68 50,92 14,68 14,32" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>
        <polygon points="50,14 82,65 18,65" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round"/>
        <line x1="50" y1="14" x2="50" y2="8" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="18" y1="65" x2="14" y2="68" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="82" y1="65" x2="86" y2="68" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="18" y1="65" x2="14" y2="32" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="82" y1="65" x2="86" y2="32" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="18" y1="65" x2="50" y2="92" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="82" y1="65" x2="50" y2="92" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <text x="50" y="54" text-anchor="middle" fill="currentColor" font-size="24" font-weight="900" font-family="system-ui, sans-serif">8</text>
      </svg>`;
    case '10':
      return `<svg class="${cls}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,6 86,34 76,76 50,94 24,76 14,34" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>
        <polygon points="50,14 74,44 50,70 26,44" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round"/>
        <line x1="50" y1="14" x2="50" y2="6" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="26" y1="44" x2="14" y2="34" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="74" y1="44" x2="86" y2="34" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="26" y1="44" x2="24" y2="76" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="74" y1="44" x2="76" y2="76" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="50" y1="70" x2="50" y2="94" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="50" y1="70" x2="24" y2="76" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="50" y1="70" x2="76" y2="76" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <text x="50" y="49" text-anchor="middle" fill="currentColor" font-size="20" font-weight="900" font-family="system-ui, sans-serif" letter-spacing="-0.5">10</text>
      </svg>`;
    case '12':
      return `<svg class="${cls}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,6 78,16 94,40 90,70 68,92 32,92 10,70 6,40 22,16" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>
        <polygon points="50,28 73,45 64,72 36,72 27,45" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round"/>
        <line x1="50" y1="28" x2="50" y2="6" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="73" y1="45" x2="94" y2="40" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="64" y1="72" x2="68" y2="92" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="36" y1="72" x2="32" y2="92" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="27" y1="45" x2="6" y2="40" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <text x="50" y="58" text-anchor="middle" fill="currentColor" font-size="22" font-weight="900" font-family="system-ui, sans-serif" letter-spacing="-0.5">12</text>
      </svg>`;
    case '100':
      return `<svg class="${cls}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="44" stroke="currentColor" stroke-width="4.5" fill="currentColor" fill-opacity="0.12"/>
        <circle cx="50" cy="50" r="33" stroke="currentColor" stroke-width="2.5" stroke-dasharray="5 2.5" fill="none" opacity="0.6"/>
        <circle cx="50" cy="50" r="21" stroke="currentColor" stroke-width="3.5" fill="currentColor" fill-opacity="0.3"/>
        <line x1="50" y1="29" x2="50" y2="6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="60.5" y1="31.8" x2="72" y2="11.9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="68.2" y1="39.5" x2="88.1" y2="28" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="71" y1="50" x2="94" y2="50" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="68.2" y1="60.5" x2="88.1" y2="72" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="60.5" y1="68.2" x2="72" y2="88.1" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="50" y1="71" x2="50" y2="94" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="39.5" y1="68.2" x2="28" y2="88.1" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="31.8" y1="60.5" x2="11.9" y2="72" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="29" y1="50" x2="6" y2="50" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="31.8" y1="39.5" x2="11.9" y2="28" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="39.5" y1="31.8" x2="28" y2="11.9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        <text x="50" y="56" text-anchor="middle" fill="currentColor" font-size="16" font-weight="900" font-family="system-ui, sans-serif" letter-spacing="-0.8">100</text>
      </svg>`;
    case '20':
    default:
      return `<svg class="${cls}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>
        <polygon points="28,33 72,33 50,73" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round"/>
        <line x1="28" y1="33" x2="50" y2="4" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="72" y1="33" x2="50" y2="4" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="28" y1="33" x2="10" y2="27" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="72" y1="33" x2="90" y2="27" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="28" y1="33" x2="10" y2="73" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="72" y1="33" x2="90" y2="73" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="50" y1="73" x2="10" y2="73" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="50" y1="73" x2="90" y2="73" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="50" y1="73" x2="50" y2="96" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <text x="50" y="58" text-anchor="middle" fill="currentColor" font-size="22" font-weight="900" font-family="system-ui, sans-serif" letter-spacing="-0.5">20</text>
      </svg>`;
  }
}
window.getDiceIconSvg = getDiceIconSvg;

function getD20IconSvg(cls = "w-4 h-4 inline-block align-middle") {
  return getDiceIconSvg(20, cls);
}
window.getD20IconSvg = getD20IconSvg;

function getFormulaDiceIconSvg(formula, cls = "w-4 h-4 inline-block align-middle") {
  const str = String(formula || '').toLowerCase();
  let die = '20';
  if (str.includes('d100') || str.includes('d%')) die = '100';
  else if (str.includes('d12')) die = '12';
  else if (str.includes('d10')) die = '10';
  else if (str.includes('d8')) die = '8';
  else if (str.includes('d6')) die = '6';
  else if (str.includes('d4') || str.includes('d3') || str.includes('d2')) die = '4';
  else if (str.includes('d20')) die = '20';
  return getDiceIconSvg(die, cls);
}
window.getFormulaDiceIconSvg = getFormulaDiceIconSvg;

// ====================================================
// 2. Çekmece (Drawer) Açma / Kapama Kontrolü
// ====================================================
function toggleHubDiceDrawer(forceState) {
  const drawer = document.getElementById('hub-dice-drawer');
  const backdrop = document.getElementById('hub-dice-backdrop');
  if (!drawer || !backdrop) return;

  const isCurrentlyOpen = !drawer.classList.contains('translate-x-full');
  const shouldOpen = (typeof forceState === 'boolean') ? forceState : !isCurrentlyOpen;

  if (shouldOpen) {
    backdrop.classList.remove('hidden');
    requestAnimationFrame(() => {
      backdrop.classList.remove('opacity-0');
      backdrop.classList.add('opacity-100');
      drawer.classList.remove('translate-x-full');
      drawer.classList.add('translate-x-0');
    });
    // Verileri güncelle
    initDiceColor();
    updateDicePoolDisplay();
    renderDiceHistory();
    renderCustomTemplates();
  } else {
    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0');
    drawer.classList.remove('translate-x-0');
    drawer.classList.add('translate-x-full');
    setTimeout(() => {
      backdrop.classList.add('hidden');
    }, 300);
  }
}
window.toggleHubDiceDrawer = toggleHubDiceDrawer;

// ESC Tuşu ile çekmeceyi kapat
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const drawer = document.getElementById('hub-dice-drawer');
    if (drawer && !drawer.classList.contains('translate-x-full')) {
      toggleHubDiceDrawer(false);
    }
  }
});

// ====================================================
// 3. Zar Havuzu ve Serbest Zar Masası
// ====================================================
function handleDieClick(sides) {
  const instant = document.getElementById('dice-instant-mode')?.checked;
  if (instant) {
    rollSingleDie(sides);
    return;
  }
  window.activeDicePool[sides] = (window.activeDicePool[sides] || 0) + 1;
  updateDicePoolDisplay();
}
window.handleDieClick = handleDieClick;

function updateDicePoolDisplay() {
  const summaryEl = document.getElementById('dice-pool-summary');
  const mod = parseInt(document.getElementById('dice-pool-mod')?.value) || 0;

  const activeParts = [];
  [4, 6, 8, 10, 12, 20, 100].forEach(s => {
    const count = window.activeDicePool[s] || 0;
    const countBadge = document.getElementById('die-count-' + s);
    if (countBadge) {
      countBadge.textContent = count > 0 ? `×${count}` : '';
    }
    if (count > 0) {
      activeParts.push(`${count}d${s}`);
    }
  });

  if (summaryEl) {
    if (activeParts.length === 0) {
      summaryEl.textContent = 'Zar seçilmedi (Butonlara tıklayın)';
      summaryEl.className = 'text-xs text-slate-500 font-mono';
    } else {
      let formula = activeParts.join(' + ');
      if (mod !== 0) {
        formula += ` ${mod >= 0 ? '+' : '-'} ${Math.abs(mod)}`;
      }
      summaryEl.textContent = formula;
      summaryEl.className = 'text-sm md:text-base font-extrabold text-amber-300 font-mono truncate';
    }
  }
}
window.updateDicePoolDisplay = updateDicePoolDisplay;

function resetDicePool() {
  window.activeDicePool = { 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0, 100: 0 };
  const modEl = document.getElementById('dice-pool-mod');
  if (modEl) modEl.value = 0;
  updateDicePoolDisplay();
}
window.resetDicePool = resetDicePool;

function rollSingleDie(sides) {
  const r = Math.floor(Math.random() * sides) + 1;
  const isCrit = (sides === 20 && r === 20) || (sides === 100 && r === 100);

  const onDone = () => {
    addDiceHistoryEntry({
      title: `Serbest 1d${sides}`,
      formula: `1d${sides}`,
      breakdown: `d${sides}: [${r}]`,
      total: r,
      isCrit: isCrit,
      critInfo: (sides === 20 && r === 20) ? '• Doğal 20!' : ((sides === 100 && r === 100) ? '• Mükemmel 100!' : '')
    });
  };

  if (window.Dice3D && typeof Dice3D.roll === 'function' && [4, 6, 8, 10, 12, 20, 100].includes(sides)) {
    try {
      Dice3D.roll([{ type: 'd' + sides, value: r }], onDone);
    } catch (e) {
      onDone();
    }
  } else {
    onDone();
  }
}
window.rollSingleDie = rollSingleDie;

function rollDicePool() {
  const mod = parseInt(document.getElementById('dice-pool-mod')?.value) || 0;
  const parts = [];
  const dice3dList = [];
  const rollBreakdown = [];
  let sumOfDice = 0;
  let hasD20Crit = false;

  [4, 6, 8, 10, 12, 20, 100].forEach(s => {
    const count = window.activeDicePool[s] || 0;
    if (count > 0) {
      parts.push(`${count}d${s}`);
      const rolls = [];
      for (let i = 0; i < count; i++) {
        const r = Math.floor(Math.random() * s) + 1;
        rolls.push(r);
        sumOfDice += r;
        if (s === 20 && r === 20) hasD20Crit = true;
        if ([4, 6, 8, 10, 12, 20, 100].includes(s) && dice3dList.length < 6) {
          dice3dList.push({ type: 'd' + s, value: r });
        }
      }
      rollBreakdown.push(`${count}d${s} [${rolls.join(', ')}]`);
    }
  });

  if (parts.length === 0) {
    rollSingleDie(20);
    return;
  }

  let formulaStr = parts.join(' + ');
  if (mod !== 0) formulaStr += ` ${mod >= 0 ? '+' : '-'} ${Math.abs(mod)}`;
  const grandTotal = sumOfDice + mod;

  let breakdownStr = rollBreakdown.join(' + ');
  if (mod !== 0) breakdownStr += ` ${mod >= 0 ? '+' : '-'} ${Math.abs(mod)}`;

  const onDone = () => {
    addDiceHistoryEntry({
      title: `Havuz Zarı (${parts.join('+')})`,
      formula: formulaStr,
      breakdown: breakdownStr,
      total: grandTotal,
      isCrit: hasD20Crit,
      critInfo: hasD20Crit ? '• Doğal 20!' : ''
    });
  };

  if (window.Dice3D && typeof Dice3D.roll === 'function' && dice3dList.length > 0) {
    try {
      Dice3D.roll(dice3dList, onDone);
    } catch (e) {
      onDone();
    }
  } else {
    onDone();
  }
}
window.rollDicePool = rollDicePool;

// ====================================================
// 4. Zar Rengi ve Palet Yönetimi
// ====================================================
function toggleDiceColorPopover(event) {
  if (event) event.stopPropagation();
  const popover = document.getElementById('dice-color-popover');
  if (popover) {
    popover.classList.toggle('hidden');
  }
}
window.toggleDiceColorPopover = toggleDiceColorPopover;

function selectDiceColor(color, colorName) {
  if (!color) return;
  color = color.trim();
  if (!color.startsWith('#')) color = '#' + color;

  try {
    localStorage.setItem('dnd_dice_color', color);
  } catch (e) {}

  if (window.Dice3D && typeof window.Dice3D.setDiceColor === 'function') {
    window.Dice3D.setDiceColor(color);
  }

  updateDiceColorUI(color);

  const popover = document.getElementById('dice-color-popover');
  if (popover) {
    popover.classList.add('hidden');
  }
}
window.selectDiceColor = selectDiceColor;

function updateDiceColorUI(hexColor) {
  if (!hexColor) return;
  if (!hexColor.startsWith('#')) hexColor = '#' + hexColor;

  const dot = document.getElementById('dice-color-preview-dot');
  if (dot) dot.style.backgroundColor = hexColor;

  const customInput = document.getElementById('dice-custom-color-input');
  if (customInput) customInput.value = hexColor;

  const rollBtn = document.getElementById('dice-roll-pool-btn');
  if (rollBtn) {
    let r = 133, g = 19, b = 22;
    if (hexColor.length >= 7) {
      r = parseInt(hexColor.slice(1, 3), 16) || 0;
      g = parseInt(hexColor.slice(3, 5), 16) || 0;
      b = parseInt(hexColor.slice(5, 7), 16) || 0;
    }
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const isLight = lum > 0.62;
    const lighter = `rgb(${Math.min(255, Math.round(r * 1.35 + 25))}, ${Math.min(255, Math.round(g * 1.35 + 25))}, ${Math.min(255, Math.round(b * 1.35 + 25))})`;
    const darker = `rgb(${Math.max(0, Math.round(r * 0.7 - 20))}, ${Math.max(0, Math.round(g * 0.7 - 20))}, ${Math.max(0, Math.round(b * 0.7 - 20))})`;

    rollBtn.style.background = `linear-gradient(135deg, ${lighter}, ${hexColor} 50%, ${darker})`;
    rollBtn.style.borderColor = lighter;
    rollBtn.style.boxShadow = `0 4px 18px rgba(${r}, ${g}, ${b}, 0.45)`;

    if (isLight) {
      rollBtn.style.color = '#0f172a';
      rollBtn.style.textShadow = 'none';
    } else {
      rollBtn.style.color = '#ffffff';
      rollBtn.style.textShadow = '0 1px 2px rgba(0,0,0,0.6)';
    }
  }
}
window.updateDiceColorUI = updateDiceColorUI;

function initDiceColor() {
  let savedColor = '#851316';
  try {
    if (typeof localStorage !== 'undefined') {
      savedColor = localStorage.getItem('dnd_dice_color') || '#851316';
    }
  } catch (e) {}
  if (window.Dice3D && typeof window.Dice3D.setDiceColor === 'function') {
    window.Dice3D.setDiceColor(savedColor);
  }
  updateDiceColorUI(savedColor);
}
window.initDiceColor = initDiceColor;

document.addEventListener('click', function(e) {
  const popover = document.getElementById('dice-color-popover');
  const btn = document.getElementById('dice-color-btn');
  if (popover && !popover.classList.contains('hidden')) {
    if (!popover.contains(e.target) && (!btn || !btn.contains(e.target))) {
      popover.classList.add('hidden');
    }
  }
});

// ====================================================
// 5. Zar Geçmişi (History) ve Son Sonuç Kartı
// ====================================================
function loadDiceHistory() {
  try {
    const saved = localStorage.getItem('dnd_dice_history');
    if (saved) {
      window.diceRollHistory = JSON.parse(saved);
    }
  } catch (e) {
    window.diceRollHistory = [];
  }
}
window.loadDiceHistory = loadDiceHistory;

function addDiceHistoryEntry(entry, triggerToast = true) {
  if (!entry) return;
  const now = new Date();
  const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const record = {
    id: 'roll_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    title: entry.title || 'Zar Atışı',
    formula: entry.formula || '',
    breakdown: entry.breakdown || '',
    total: entry.total !== undefined ? entry.total : 0,
    timestamp: timeStr,
    isCrit: !!entry.isCrit,
    critDamage: entry.critDamage || null,
    critInfo: entry.critInfo || '',
    icon: entry.icon || '⚡'
  };

  window.diceRollHistory.unshift(record);
  if (window.diceRollHistory.length > 100) {
    window.diceRollHistory = window.diceRollHistory.slice(0, 100);
  }
  try {
    localStorage.setItem('dnd_dice_history', JSON.stringify(window.diceRollHistory));
  } catch (e) {}

  updateLastResultCard(record);
  renderDiceHistory();

  if (triggerToast && typeof showHubDiceToast === 'function') {
    showHubDiceToast({
      charName: record.title,
      checkLabel: record.formula || 'Zar Atışı',
      icon: record.icon || '⚡',
      iconBg: record.isCrit ? 'bg-amber-900/60 text-amber-300 border border-amber-500/40' : 'bg-indigo-900/40 text-indigo-300 border border-indigo-500/40',
      badgeBg: record.isCrit ? 'bg-amber-950/90 text-amber-300 border border-amber-500/40' : 'bg-slate-700/80 text-slate-200 border border-slate-600/50',
      d20: record.total,
      mod: 0,
      modStr: '',
      total: record.total,
      isNat20: record.isCrit,
      isNat1: false
    });
  }
}
window.addDiceHistoryEntry = addDiceHistoryEntry;

function clearDiceHistory() {
  if (!confirm('Tüm zar geçmişini silmek istediğinize emin misiniz?')) return;
  window.diceRollHistory = [];
  try {
    localStorage.removeItem('dnd_dice_history');
  } catch (e) {}
  renderDiceHistory();
}
window.clearDiceHistory = clearDiceHistory;

function updateLastResultCard(record) {
  const labelEl = document.getElementById('dice-last-label');
  const breakdownEl = document.getElementById('dice-last-breakdown');
  const totalEl = document.getElementById('dice-last-total');
  const critBadge = document.getElementById('dice-last-crit-badge');
  const iconEl = document.getElementById('dice-last-icon');

  if (labelEl) labelEl.textContent = `${record.title} [${record.timestamp}]`;
  if (breakdownEl) breakdownEl.textContent = `${record.formula ? record.formula + ': ' : ''}${record.breakdown} ${record.critInfo || ''}`;
  if (totalEl) totalEl.textContent = record.total;

  if (iconEl) {
    const str = ((record.formula || '') + ' ' + (record.title || '') + ' ' + (record.breakdown || '')).toLowerCase();
    let dieType = '20';
    if (str.includes('d4')) dieType = '4';
    else if (str.includes('d6')) dieType = '6';
    else if (str.includes('d8')) dieType = '8';
    else if (str.includes('d100')) dieType = '100';
    else if (str.includes('d10')) dieType = '10';
    else if (str.includes('d12')) dieType = '12';
    else if (str.includes('d20')) dieType = '20';

    iconEl.innerHTML = getDiceIconSvg(dieType, 'w-7 h-7 inline-block text-amber-300');
  }

  if (critBadge) {
    if (record.isCrit) {
      critBadge.classList.remove('hidden');
      critBadge.textContent = record.critDamage ? `⚡ KRİTİK! (${record.critDamage} Hasar)` : '⚡ KRİTİK TEHDİTİ!';
    } else {
      critBadge.classList.add('hidden');
    }
  }
}
window.updateLastResultCard = updateLastResultCard;

function renderDiceHistory() {
  const listEl = document.getElementById('dice-history-list');
  const countEl = document.getElementById('dice-history-count');
  if (!listEl) return;

  if (!Array.isArray(window.diceRollHistory) || window.diceRollHistory.length === 0) {
    loadDiceHistory();
  }

  const list = window.diceRollHistory || [];
  if (countEl) countEl.textContent = `${list.length} Kayıt`;

  if (list.length === 0) {
    listEl.innerHTML = `
      <div class="text-center py-8 text-slate-500 text-xs font-medium">
        Henüz atılmış bir zar kaydı bulunmuyor. Yukarıdan serbest zar atabilirsiniz.
      </div>
    `;
    return;
  }

  listEl.innerHTML = list.map(item => {
    const critClass = item.isCrit ? 'border-rose-500/70 bg-rose-950/20' : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900';
    const critBadge = item.isCrit
      ? `<span class="px-2 py-0.5 rounded bg-rose-600 text-white font-black text-[10px] animate-pulse">⚡ KRİTİK ${item.critDamage ? '(' + item.critDamage + ' Hasar)' : ''}</span>`
      : '';
    const safeFormula = (item.formula || '').replace(/'/g, "\\'");

    return `
      <div class="p-2.5 rounded-xl border ${critClass} flex items-center justify-between gap-2.5 transition">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-bold text-white">${item.title}</span>
            <span class="text-[10px] text-slate-400 font-mono">${item.timestamp}</span>
            ${critBadge}
          </div>
          <div class="text-[11px] text-slate-300 font-mono mt-0.5 break-words">
            ${item.formula ? `<span class="text-amber-400 font-bold">${item.formula}</span> ➔ ` : ''}${item.breakdown}
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <div class="text-right">
            <div class="text-lg font-black ${item.isCrit ? 'text-rose-400' : 'text-amber-400'} font-mono leading-none">
              ${item.total}
            </div>
          </div>
          ${item.formula ? `
            <button onclick="applyFormulaTemplate('${safeFormula}'); rollCustomFormula();"
                    title="Bu formülü tekrar at"
                    class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition active:scale-95 cursor-pointer">
              🔄
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}
window.renderDiceHistory = renderDiceHistory;

// ====================================================
// 6. Serbest Formül & Hedefli Zar Motoru
// ====================================================
const DEFAULT_FORMULA_TEMPLATES = [
  { name: 'Hedef:21 B:+4 (1d6+3 19-20x2)', formula: 'Hedef:21 Bonus:4 Zar:1d6+3 19-20x2' },
  { name: 'Ateş Topu (8d6)', formula: '8d6' },
  { name: 'D20 Testi (+8)', formula: '1d20+8' },
  { name: 'Yüzdelik Zar (1d100)', formula: '1d100' }
];

function escapeFormulaHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function loadFormulaTemplates() {
  try {
    const saved = localStorage.getItem('dnd_custom_dice_templates');
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  const initial = [...DEFAULT_FORMULA_TEMPLATES];
  try {
    localStorage.setItem('dnd_custom_dice_templates', JSON.stringify(initial));
  } catch (e) {}
  return initial;
}

function saveFormulaTemplates(templates) {
  try {
    localStorage.setItem('dnd_custom_dice_templates', JSON.stringify(templates));
  } catch (e) {}
  renderCustomTemplates();
}

function resetFormulaTemplates() {
  saveFormulaTemplates([...DEFAULT_FORMULA_TEMPLATES]);
}
window.resetFormulaTemplates = resetFormulaTemplates;

function renderCustomTemplates() {
  const container = document.getElementById('dice-custom-templates-container');
  if (!container) return;

  const templates = loadFormulaTemplates();
  if (templates.length === 0) {
    container.innerHTML = `
      <div class="text-xs text-slate-500 py-1 flex items-center gap-2">
        <span>Kayıtlı şablon bulunmuyor.</span>
        <button type="button" onclick="resetFormulaTemplates()" class="text-indigo-400 hover:text-indigo-200 underline cursor-pointer text-xs font-medium">Varsayılanları Geri Yükle</button>
      </div>
    `;
    return;
  }

  container.innerHTML = templates.map((t, idx) => {
    const isTarget = (t.formula || '').toLowerCase().includes('hedef');
    const badgeColor = isTarget
      ? 'border-emerald-500/50 text-emerald-300 hover:bg-emerald-950/60'
      : 'border-indigo-500/50 text-indigo-300 hover:bg-indigo-950/60';

    return `
      <div class="inline-flex items-center rounded-lg bg-slate-900 border ${badgeColor} text-xs font-mono transition group shadow-sm">
        <button type="button" onclick="applyFormulaTemplate('${escapeFormulaHtml(t.formula)}')" class="px-2 py-1 text-left truncate hover:underline cursor-pointer" title="${escapeFormulaHtml(t.formula)}">
          ${escapeFormulaHtml(t.name || t.formula)}
        </button>
        <button type="button" onclick="deleteFormulaTemplate(${idx})" class="pr-1.5 pl-0.5 text-slate-500 hover:text-rose-400 opacity-60 group-hover:opacity-100 transition cursor-pointer text-xs font-bold" title="Şablonu Sil">
          &times;
        </button>
      </div>
    `;
  }).join('');
}
window.renderCustomTemplates = renderCustomTemplates;

function applyFormulaTemplate(str) {
  const input = document.getElementById('dice-custom-formula-input');
  if (input) {
    input.value = str;
    input.focus();
  }
}
window.applyFormulaTemplate = applyFormulaTemplate;

function saveCurrentFormulaTemplate() {
  const input = document.getElementById('dice-custom-formula-input');
  const formula = (input?.value || '').trim();
  if (!formula) {
    alert('Lütfen önce formül alanına bir zar ifadesi yazın.\nÖrn: Hedef:21 Bonus:4 Zar:1d6+3 19-20x2');
    return;
  }

  const defaultName = formula.length > 28 ? formula.slice(0, 25) + '...' : formula;
  const name = prompt('Bu zar şablonu için bir isim yazın:', defaultName);
  if (!name || !name.trim()) return;

  const templates = loadFormulaTemplates();
  templates.push({
    name: name.trim(),
    formula: formula,
    isCustom: true
  });
  saveFormulaTemplates(templates);
}
window.saveCurrentFormulaTemplate = saveCurrentFormulaTemplate;

function deleteFormulaTemplate(index) {
  const templates = loadFormulaTemplates();
  if (index >= 0 && index < templates.length) {
    templates.splice(index, 1);
    saveFormulaTemplates(templates);
  }
}
window.deleteFormulaTemplate = deleteFormulaTemplate;

function parseAndRollDiceFormula(inputStr) {
  const raw = (inputStr || '').trim();
  if (!raw) return null;

  let critThreatStart = 20;
  let critThreatEnd = 20;
  let critMultiplier = 2;
  let hasCritNotation = false;

  let cleanStr = raw;
  const critRangeMatch = cleanStr.match(/(\d+)\s*-\s*(\d+)\s*(?:[xX*\/]\s*(\d+))?/);
  if (critRangeMatch) {
    hasCritNotation = true;
    critThreatStart = parseInt(critRangeMatch[1]);
    critThreatEnd = parseInt(critRangeMatch[2]);
    if (critRangeMatch[3]) critMultiplier = parseInt(critRangeMatch[3]);
    cleanStr = cleanStr.replace(critRangeMatch[0], '');
  } else {
    const critMultMatch = cleanStr.match(/(?:[xX*\/]\s*(\d+))/);
    if (critMultMatch) {
      hasCritNotation = true;
      critMultiplier = parseInt(critMultMatch[1]);
      cleanStr = cleanStr.replace(critMultMatch[0], '');
    }
  }

  cleanStr = cleanStr.trim() || '1d20';

  const regex = /([+-]?\s*\d*d\d+|[+-]?\s*\d+)/gi;
  const matches = cleanStr.match(regex);
  if (!matches || matches.length === 0) return null;

  let grandTotal = 0;
  const diceGroups = [];
  const modifiers = [];
  let primaryCheckVal = null;

  matches.forEach(token => {
    const cleanToken = token.replace(/\s+/g, '');
    const sign = cleanToken.startsWith('-') ? -1 : 1;
    const unsigned = cleanToken.replace(/^[+-]/, '');

    if (unsigned.includes('d') || unsigned.includes('D')) {
      const parts = unsigned.toLowerCase().split('d');
      const count = parts[0] === '' ? 1 : Math.min(100, Math.max(1, parseInt(parts[0]) || 1));
      const sides = Math.max(1, parseInt(parts[1]) || 6);

      const rolls = [];
      let groupSum = 0;
      for (let i = 0; i < count; i++) {
        const r = Math.floor(Math.random() * sides) + 1;
        rolls.push(r);
        groupSum += r;
        if (sides === 20 && primaryCheckVal === null) {
          primaryCheckVal = r;
        }
      }
      if (primaryCheckVal === null && rolls.length > 0) {
        primaryCheckVal = rolls[0];
      }

      grandTotal += groupSum * sign;
      diceGroups.push({
        notation: `${sign < 0 ? '-' : ''}${count}d${sides}`,
        count,
        sides,
        rolls,
        sum: groupSum,
        sign
      });
    } else {
      const val = parseInt(unsigned) || 0;
      grandTotal += val * sign;
      modifiers.push(val * sign);
    }
  });

  let isCrit = false;
  if (hasCritNotation && primaryCheckVal !== null) {
    if (primaryCheckVal >= critThreatStart && primaryCheckVal <= critThreatEnd) {
      isCrit = true;
    }
  }

  return {
    rawInput: raw,
    cleanStr,
    diceGroups,
    modifiers,
    grandTotal,
    hasCritNotation,
    critThreatStart,
    critThreatEnd,
    critMultiplier,
    isCrit,
    critDamage: isCrit ? grandTotal * critMultiplier : null,
    timestamp: new Date().toLocaleTimeString('tr-TR')
  };
}

function executeTargetAttackRoll(rawInput, hedefMatch) {
  const hedef = parseInt(hedefMatch[1]);
  const bonusMatch = rawInput.match(/(?:bonus|atk|mod)\s*[:=]\s*([+-]?\s*\d+)/i);
  const bonusVal = bonusMatch ? parseInt(bonusMatch[1].replace(/\s+/g, '')) : 0;

  const zarMatch = rawInput.match(/(?:zar|dice|dmg|hasar)\s*[:=]\s*([^;,\n]+)/i);
  let rawDamageStr = '';
  if (zarMatch) {
    rawDamageStr = zarMatch[1]
      .replace(/(?:hedef|target|dc|ac)\s*[:=]\s*\d+/ig, '')
      .replace(/(?:bonus|atk|mod)\s*[:=]\s*[+-]?\s*\d+/ig, '')
      .trim();
  } else {
    rawDamageStr = rawInput
      .replace(/(?:hedef|target|dc|ac)\s*[:=]\s*\d+/ig, '')
      .replace(/(?:bonus|atk|mod)\s*[:=]\s*[+-]?\s*\d+/ig, '')
      .trim();
  }
  if (!rawDamageStr) rawDamageStr = '1d6';

  let threatMin = 20, threatMax = 20, critMult = 2;
  let damageDiceStr = rawDamageStr;

  const critRangeMatch = damageDiceStr.match(/(\d+)\s*-\s*(\d+)\s*(?:[xX*\/]\s*(\d+))?/);
  if (critRangeMatch) {
    threatMin = parseInt(critRangeMatch[1]);
    threatMax = parseInt(critRangeMatch[2]);
    if (critRangeMatch[3]) critMult = parseInt(critRangeMatch[3]);
    damageDiceStr = damageDiceStr.replace(critRangeMatch[0], '').trim();
  } else {
    const critMultMatch = damageDiceStr.match(/(?:[xX*\/]\s*(\d+))/);
    if (critMultMatch) {
      critMult = parseInt(critMultMatch[1]);
      damageDiceStr = damageDiceStr.replace(critMultMatch[0], '').trim();
    }
  }
  if (!damageDiceStr) damageDiceStr = '1d6';

  const d20 = Math.floor(Math.random() * 20) + 1;
  const attackTotal = d20 + bonusVal;
  const isNat1 = (d20 === 1);
  const isNat20 = (d20 === 20);

  let isHit = false;
  if (isNat1) isHit = false;
  else if (isNat20) isHit = true;
  else isHit = (attackTotal >= hedef);

  const isThreat = isHit && (d20 >= threatMin && d20 <= threatMax);
  let isCritConfirmed = false;
  let confirmD20 = null;
  let confirmTotal = null;
  let confirmDetails = '';

  if (isThreat) {
    confirmD20 = Math.floor(Math.random() * 20) + 1;
    confirmTotal = confirmD20 + bonusVal;
    if (confirmD20 === 20 || confirmTotal >= hedef) {
      isCritConfirmed = true;
      confirmDetails = ` • Teyit: d20 [${confirmD20}] ${bonusVal >= 0 ? '+' : ''}${bonusVal} = ${confirmTotal} >= ${hedef} (TEYİT EDİLDİ!)`;
    } else {
      isCritConfirmed = false;
      confirmDetails = ` • Teyit: d20 [${confirmD20}] ${bonusVal >= 0 ? '+' : ''}${bonusVal} = ${confirmTotal} < ${hedef} (Teyit Edilemedi, Normal Vuruş)`;
    }
  }

  const dmgRegex = /([+-]?\s*\d*d\d+|[+-]?\s*\d+)/gi;
  const dmgMatches = damageDiceStr.match(dmgRegex) || ['1d6'];
  let baseDmgTotal = 0;
  const dmgBreakdownList = [];
  const dmg3dDice = [];

  dmgMatches.forEach(token => {
    const cleanToken = token.replace(/\s+/g, '');
    const sign = cleanToken.startsWith('-') ? -1 : 1;
    const unsigned = cleanToken.replace(/^[+-]/, '');
    if (unsigned.includes('d') || unsigned.includes('D')) {
      const parts = unsigned.toLowerCase().split('d');
      const count = parts[0] === '' ? 1 : Math.min(50, Math.max(1, parseInt(parts[0]) || 1));
      const sides = Math.max(1, parseInt(parts[1]) || 6);
      const rolls = [];
      let gSum = 0;
      for (let i = 0; i < count; i++) {
        const r = Math.floor(Math.random() * sides) + 1;
        rolls.push(r);
        gSum += r;
        if (isHit && [4, 6, 8, 10, 12, 20].includes(sides) && dmg3dDice.length < 5) {
          dmg3dDice.push({ type: 'd' + sides, value: r });
        }
      }
      baseDmgTotal += gSum * sign;
      dmgBreakdownList.push(`${sign < 0 ? '-' : ''}${count}d${sides} [${rolls.join(', ')}]`);
    } else {
      const val = parseInt(unsigned) || 0;
      baseDmgTotal += val * sign;
      dmgBreakdownList.push(`${val * sign >= 0 ? '+' : ''}${val * sign}`);
    }
  });

  const baseDmgBreakdown = dmgBreakdownList.join(' ');
  let finalDamage = 0;
  if (!isHit) finalDamage = 0;
  else if (isHit && !isCritConfirmed) finalDamage = Math.max(0, baseDmgTotal);
  else if (isHit && isCritConfirmed) finalDamage = Math.max(0, baseDmgTotal) * critMult;

  const dice3dList = [{ type: 'd20', value: d20 }];
  if (confirmD20 !== null) dice3dList.push({ type: 'd20', value: confirmD20 });
  if (isHit && dmg3dDice.length > 0) dice3dList.push(...dmg3dDice);

  const bonusStr = (bonusVal >= 0 ? '+' : '') + bonusVal;

  const onDone = () => {
    if (!isHit) {
      addDiceHistoryEntry({
        title: `Hedefli Saldırı: Iskaladı (vs Hedef ${hedef})`,
        formula: `d20${bonusStr} vs Hedef ${hedef} (${rawDamageStr})`,
        breakdown: `Saldırı: d20 [${d20}] ${bonusStr} = ${attackTotal} vs Hedef ${hedef} ❌ ISKALADI${isNat1 ? ' (Doğal 1!)' : ''}`,
        total: 0,
        isCrit: false,
        critInfo: '• Iskaladı (0 Hasar)'
      });
    } else if (isHit && !isCritConfirmed) {
      addDiceHistoryEntry({
        title: `Hedefli Saldırı: İsabet (${finalDamage} Hasar)`,
        formula: `d20${bonusStr} vs Hedef ${hedef} (${rawDamageStr})`,
        breakdown: `Saldırı: d20 [${d20}] ${bonusStr} = ${attackTotal} vs Hedef ${hedef} (İsabet)${confirmDetails} • Hasar: ${baseDmgBreakdown} = ${finalDamage} Hasar`,
        total: finalDamage,
        isCrit: false,
        critInfo: '• İsabet'
      });
    } else {
      addDiceHistoryEntry({
        title: `⚡ KRİTİK İSABET! (${finalDamage} Hasar)`,
        formula: `d20${bonusStr} vs Hedef ${hedef} (${rawDamageStr})`,
        breakdown: `Saldırı: d20 [${d20}] ${bonusStr} = ${attackTotal} vs Hedef ${hedef} (Tehdit: ${threatMin}-${threatMax})${confirmDetails} • Hasar: (${baseDmgBreakdown}) x ${critMult} = ${finalDamage} Hasar!`,
        total: finalDamage,
        isCrit: true,
        critDamage: finalDamage,
        critInfo: `• ⚡ Kritik (${threatMin}-${threatMax}x${critMult}): ${finalDamage} Hasar!`
      });
    }
  };

  if (window.Dice3D && typeof Dice3D.roll === 'function' && dice3dList.length > 0) {
    try {
      Dice3D.roll(dice3dList, onDone);
    } catch (e) {
      onDone();
    }
  } else {
    onDone();
  }
}

function executeStandardCustomFormula(val) {
  const parsed = parseAndRollDiceFormula(val);
  if (!parsed) {
    alert('Zar formülü anlaşılamadı. Örnek geçerli biçimler:\n• Hedef:21 Bonus:4 Zar:1d6+3 19-20x2\n• 12d46+45 18-20x2\n• 3d6+5\n• 8d6');
    return;
  }

  const breakdownParts = parsed.diceGroups.map(g => `${g.notation}: [${g.rolls.join(', ')}]`);
  if (parsed.modifiers.length > 0) {
    const modSum = parsed.modifiers.reduce((a, b) => a + b, 0);
    if (modSum !== 0) {
      breakdownParts.push(`${modSum >= 0 ? '+' : ''}${modSum}`);
    }
  }

  const dice3dList = [];
  parsed.diceGroups.forEach(g => {
    if ([4, 6, 8, 10, 12, 20, 100].includes(g.sides)) {
      g.rolls.forEach(r => {
        if (dice3dList.length < 6) {
          dice3dList.push({ type: 'd' + g.sides, value: r });
        }
      });
    }
  });

  const onDone = () => {
    let critInfo = '';
    if (parsed.hasCritNotation) {
      if (parsed.isCrit) {
        critInfo = `• ⚡ Kritik (${parsed.critThreatStart}-${parsed.critThreatEnd}x${parsed.critMultiplier}): ${parsed.critDamage} Hasar!`;
      } else {
        critInfo = `• Tehdit (${parsed.critThreatStart}-${parsed.critThreatEnd}) tutmadı`;
      }
    }

    addDiceHistoryEntry({
      title: `Serbest Formül (${val})`,
      formula: val,
      breakdown: breakdownParts.join(' • '),
      total: parsed.grandTotal,
      isCrit: parsed.isCrit,
      critDamage: parsed.critDamage,
      critInfo: critInfo
    });
  };

  if (window.Dice3D && typeof Dice3D.roll === 'function' && dice3dList.length > 0) {
    try {
      Dice3D.roll(dice3dList, onDone);
    } catch (e) {
      onDone();
    }
  } else {
    onDone();
  }
}

function rollCustomFormula() {
  const input = document.getElementById('dice-custom-formula-input');
  const val = (input?.value || '').trim();
  if (!val) {
    alert('Lütfen bir zar formülü yazın (Örn: Hedef:21 Bonus:4 Zar:1d6+3 19-20x2 veya 3d6+5)');
    return;
  }

  const hedefMatch = val.match(/(?:hedef|target|dc|ac)\s*[:=]\s*(\d+)/i);
  if (hedefMatch) {
    executeTargetAttackRoll(val, hedefMatch);
    return;
  }

  executeStandardCustomFormula(val);
}
window.rollCustomFormula = rollCustomFormula;

// Sayfa yüklendiğinde inline panel bileşenlerini ve renk seçiciyi ilklendir
window.addEventListener('DOMContentLoaded', () => {
  if (typeof initDiceColor === 'function') initDiceColor();
  if (typeof updateDicePoolDisplay === 'function') updateDicePoolDisplay();
  if (typeof renderDiceHistory === 'function') renderDiceHistory();
  if (typeof renderCustomTemplates === 'function') renderCustomTemplates();
});
