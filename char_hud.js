/**
 * Joyful-Fermi D&D 3.5e — Character HUD, Cloud Sync, Profile, Race/Size/Deity, NPC Studio & Point Buy
 */
    function getDiceIconSvg(die, cls = "w-4 h-4 inline-block align-middle") {
      const d = String(die || '20').toLowerCase().replace('d', '').trim();
      switch (d) {
        case '4':
          return `<svg class="${cls}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="50,10 92,78 12,86" fill="currentColor" fill-opacity="0.14" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>
            <polygon points="50,10 54,54 12,86" fill="currentColor" fill-opacity="0.28" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
            <polygon points="50,10 92,78 54,54" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
            <polygon points="12,86 54,54 92,78" fill="currentColor" fill-opacity="0.34" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
            <text x="53" y="49" text-anchor="middle" fill="currentColor" font-size="22" font-weight="900" font-family="system-ui, -apple-system, sans-serif">4</text>
          </svg>`;
        case '6':
          return `<svg class="${cls}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="50,12 85,31 85,69 50,88 15,69 15,31" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>
            <polygon points="50,12 85,31 50,50 15,31" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
            <polygon points="15,31 50,50 50,88 15,69" fill="currentColor" fill-opacity="0.35" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
            <line x1="50" y1="50" x2="85" y2="69" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
            <line x1="50" y1="50" x2="50" y2="88" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
            <line x1="50" y1="50" x2="15" y2="31" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
            <text x="32" y="66" text-anchor="middle" fill="currentColor" font-size="24" font-weight="900" font-family="system-ui, -apple-system, sans-serif">6</text>
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
            <text x="50" y="54" text-anchor="middle" fill="currentColor" font-size="24" font-weight="900" font-family="system-ui, -apple-system, sans-serif">8</text>
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
            <text x="50" y="49" text-anchor="middle" fill="currentColor" font-size="20" font-weight="900" font-family="system-ui, -apple-system, sans-serif" letter-spacing="-0.5">10</text>
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
            <text x="50" y="58" text-anchor="middle" fill="currentColor" font-size="22" font-weight="900" font-family="system-ui, -apple-system, sans-serif" letter-spacing="-0.5">12</text>
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
            <text x="50" y="56" text-anchor="middle" fill="currentColor" font-size="16" font-weight="900" font-family="system-ui, -apple-system, sans-serif" letter-spacing="-0.8">100</text>
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
            <text x="50" y="58" text-anchor="middle" fill="currentColor" font-size="22" font-weight="900" font-family="system-ui, -apple-system, sans-serif" letter-spacing="-0.5">20</text>
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

    let character = null;
    try { Object.defineProperty(window, 'character', { get: () => character, set: (v) => { character = v; }, configurable: true }); } catch (e) {}
    let masterDb = [];
    try { Object.defineProperty(window, 'masterDb', { get: () => masterDb, set: (v) => { masterDb = v; }, configurable: true }); } catch (e) {}

    // =========================================================================
    // DM CANLI SENKRONİZASYON (VIGNETTE FLASH, TOAST & DİNAMİK HP GÜNCELLEMESİ)
    // =========================================================================
    function triggerDamageVignette(type = 'damage') {
      const overlay = document.getElementById('dm-vignette-overlay');
      if (!overlay) return;
      if (type === 'damage') {
        overlay.style.background = 'radial-gradient(circle, transparent 40%, rgba(225, 29, 72, 0.45) 90%), rgba(225, 29, 72, 0.2)';
      } else {
        overlay.style.background = 'radial-gradient(circle, transparent 40%, rgba(16, 185, 129, 0.45) 90%), rgba(16, 185, 129, 0.18)';
      }
      overlay.classList.remove('opacity-0');
      overlay.classList.add('opacity-100');
      setTimeout(() => {
        overlay.classList.remove('opacity-100');
        overlay.classList.add('opacity-0');
      }, 650);
    }
    window.triggerDamageVignette = triggerDamageVignette;

    window.handleIncomingDmHpEvent = function(evt) {
      if (!evt || evt.type !== 'DM_HP_UPDATE') return;
      if (!character) return;

      const urlParams = new URLSearchParams(window.location.search);
      const reqId = urlParams.get('id') || localStorage.getItem('dnd35_active_character_id');
      const myId = character._hubId || character.id || reqId;

      const matchesId = myId && myId === evt.charId;
      const matchesName = character.name && evt.charName && character.name.toLowerCase().trim() === evt.charName.toLowerCase().trim();

      if (!matchesId && !matchesName) return;

      if (!character._hubId && evt.charId) {
        character._hubId = evt.charId;
      }

      // Tekrarlanan paketleri önleme (Timestamp kontrolü)
      if (window._lastHandledDmEventTs && window._lastHandledDmEventTs >= evt.timestamp) {
        return;
      }
      window._lastHandledDmEventTs = evt.timestamp;

      const delta = evt.delta;
      const isDamage = delta < 0;
      const absDelta = Math.abs(delta);

      if (!character.hp) {
        character.hp = { current: evt.currentHp, max: evt.maxHp, temp: evt.tempHp || 0 };
      }
      character.hp.current = evt.currentHp;
      character.hp.temp = evt.tempHp || 0;
      character.hp._lastDmUpdateTs = evt.timestamp;
      character.hp._lastPlayerChangeTs = 0; // DM HP takes precedence

      // Yerel hafızaya kaydet (tekrar buluta fırlatıp döngü oluşturmamak için triggerCloudSync = false)
      saveStateToStorage(false);

      // DOM'u güncelle
      if (typeof renderCombatCockpit === 'function') {
        try { renderCombatCockpit(); } catch (e) {}
      }
      if (typeof renderAll === 'function') {
        try { renderAll(); } catch (e) {}
      }

      // 1. Ekran Kırmızı / Yeşil Parlama Efekti
      triggerDamageVignette(isDamage ? 'damage' : 'heal');

      // 2. Toast Bildirimi (showDiceTopToast)
      if (typeof showDiceTopToast === 'function') {
        if (isDamage) {
          showDiceTopToast({
            icon: '🩸',
            title: 'DM Applied Damage',
            breakdown: `${absDelta} Damage applied. Remaining HP: ${evt.currentHp}/${evt.maxHp}${evt.tempHp > 0 ? ` (+${evt.tempHp} Temp)` : ''}`,
            total: `-${absDelta} HP`
          });
        } else {
          showDiceTopToast({
            icon: '💚',
            title: 'DM Applied Healing',
            breakdown: `${absDelta} Healing applied. Current HP: ${evt.currentHp}/${evt.maxHp}`,
            total: `+${absDelta} HP`
          });
        }
      }
    };

    // Aynı Cihaz Canlı Senkronizasyon Dinleyicileri (BroadcastChannel & Storage Event)
    try {
      const liveBc = new BroadcastChannel('dnd35_live_sync');
      liveBc.onmessage = (e) => {
        if (e.data && e.data.type === 'DM_HP_UPDATE') {
          window.handleIncomingDmHpEvent(e.data);
        }
      };
    } catch (e) {}

    window.addEventListener('storage', (e) => {
      if (e.key === 'dnd35_latest_dm_event' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          window.handleIncomingDmHpEvent(parsed);
        } catch (err) {}
      }
    });

    window.addEventListener('DOMContentLoaded', async () => {
      // Redirect root (/) without ?id immediately to /hub
      const _urlParams = new URLSearchParams(window.location.search);
      const _hasCharId = _urlParams.get('id');
      const _isRootPath = window.location.pathname === '/' || window.location.pathname === '';
      if (_isRootPath && !_hasCharId) {
        window.location.replace('/hub' + window.location.hash);
        return;
      }

      // 1. Start IndexedDB-First SRD Compendium (~10ms) and Auth check in parallel
      const srdInitPromise = (window.SrdCompendium && typeof window.SrdCompendium.init === 'function')
        ? window.SrdCompendium.init().catch(e => console.warn('SrdCompendium init warning:', e))
        : Promise.resolve();

      const authPromise = (window.SupabaseAuth && typeof window.SupabaseAuth.requireAuth === 'function')
        ? window.SupabaseAuth.requireAuth().catch(e => { console.warn('Auth check warning:', e); return null; })
        : Promise.resolve(true);

      await srdInitPromise;

      // 2. Load local character data immediately (0ms network wait; cloud revalidation runs in background)
      try {
        await loadInitialData();
      } catch (err) {
        console.error('loadInitialData failed, attempting fallback to bundled data:', err);
      }
      if (!character && window.BUNDLED_CHARACTER_DATA) {
        character = JSON.parse(JSON.stringify(window.BUNDLED_CHARACTER_DATA));
      }

      ensureCustomRacesLoaded();
      // Auto-ensure default race traits (e.g. Human Bonus Feat & Skilled) if specialAbilities is empty
      try {
        if (character && character.race && Array.isArray(character.specialAbilities) && character.specialAbilities.length === 0) {
          const catalog = window.BUNDLED_SRD_CORE_CATALOG || [];
          const raceObj = (window.SrdCompendium && typeof window.SrdCompendium.getByName === 'function' ? window.SrdCompendium.getByName(character.race, 'Race') : null)
            || catalog.find(i => i && i.type === 'Race' && i.name.toLowerCase() === character.race.toLowerCase());
          if (raceObj && Array.isArray(raceObj.traits)) {
            raceObj.traits.forEach(t => {
              character.specialAbilities.push({
                name: `${t.name} (${raceObj.name})`,
                source: `${raceObj.name} Race`,
                benefit: t.desc || '',
                action: 'Passive',
                duration: 'Continuous',
                active: true
              });
            });
            if (!character.size && raceObj.size) character.size = raceObj.size;
            if (!character.baseSpeed && raceObj.baseSpeed) character.baseSpeed = raceObj.baseSpeed;
          }
        }
      } catch (e) {
        console.warn('Auto race sync warning:', e);
      }
      try {
        initSkillFilters();
      } catch (err) {
        console.error('initSkillFilters failed:', err);
      }

      // 3. Single-Pass Render: Restore active tab first so only HUD + visible tab render on Frame 1
      try {
        renderAll();
      } catch (e) {
        console.error('Initial renderAll error:', e);
      }
      try { restoreActiveTabAndScroll(); } catch (e) {}

      // 4. Verify Auth & Non-Blocking Background Services
      if (window.SupabaseAuth) {
        const authUser = await authPromise;
        if (!authUser) return;
      }
      try { await CloudSync.init(); } catch (e) {}
      if (window.CloudSync && typeof window.CloudSync.startLiveSyncPolling === 'function') {
        window.CloudSync.startLiveSyncPolling(8000);
      }
      try { initCharacterRealtimeSync(); } catch (e) {}
      try { initTabVisibilitySync(); } catch (e) {}
    });

    let _geminiVerifiedState = null; // null | 'checking' | 'connected' | 'error' | 'empty'
    let _geminiVerifiedModel = '';

    async function verifySettingsGeminiApiKey(forceRefresh = false) {
      const apiKey = (localStorage.getItem('gemini_api_key') || '').trim();
      const liveBadge = document.getElementById('settings-gemini-live-status');
      const maskedSpan = document.getElementById('settings-masked-key');
      const input = document.getElementById('settings-gemini-api-key');

      if (input && document.activeElement !== input) {
        input.value = apiKey;
      }

      if (!apiKey) {
        _geminiVerifiedState = 'empty';
        _geminiVerifiedModel = '';
        if (liveBadge) {
          liveBadge.innerHTML = '<span class="text-amber-400">🟡 Anahtar Girilmedi</span>';
        }
        if (maskedSpan) {
          maskedSpan.innerHTML = '<span class="text-amber-400">Not Configured (Get Free Key)</span>';
        }
        return false;
      }

      const masked = apiKey.length > 10
        ? (apiKey.substring(0, 6) + '...' + apiKey.substring(apiKey.length - 4))
        : 'AIza...';

      if (!forceRefresh && _geminiVerifiedState === 'connected') {
        if (liveBadge) {
          liveBadge.innerHTML = `<span class="text-emerald-400 font-bold">🟢 Gemini AI Active & Online${_geminiVerifiedModel ? ` (${_geminiVerifiedModel})` : ''}</span>`;
        }
        if (maskedSpan) {
          maskedSpan.innerHTML = `<span class="text-emerald-400 font-bold">🟢 ${masked} (Connected & Active)</span>`;
        }
        return true;
      }

      _geminiVerifiedState = 'checking';
      if (liveBadge) {
        liveBadge.innerHTML = '<span class="text-indigo-400 font-bold">🔄 Checking Connection...</span>';
      }
      if (maskedSpan) {
        maskedSpan.innerHTML = `<span class="text-indigo-300">${masked} (Verifying...)</span>`;
      }

      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json().catch(() => ({}));
        const liveList = (data.models || [])
          .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
          .map(m => String(m.name || '').replace(/^models\//, ''))
          .filter(Boolean);
        const models = window.RuleMaster
          ? await RuleMaster.getAvailableGeminiModels(apiKey, forceRefresh)
          : liveList;
        _geminiVerifiedState = 'connected';
        _geminiVerifiedModel = (models && models[0]) || liveList[0] || 'Dynamic AI Ready';

        if (liveBadge) {
          liveBadge.innerHTML = `<span class="text-emerald-400 font-bold">🟢 Gemini AI Active & Online (${_geminiVerifiedModel})</span>`;
        }
        if (maskedSpan) {
          maskedSpan.innerHTML = `<span class="text-emerald-400 font-bold">🟢 ${masked} (Connected • ${models.length} Optimized Models Ready)</span>`;
        }
        return true;
      } catch (err) {
        _geminiVerifiedState = 'error';
        _geminiVerifiedModel = '';
        if (liveBadge) {
          liveBadge.innerHTML = '<span class="text-rose-400 font-bold">🔴 Connection Error / Invalid Key</span>';
        }
        if (maskedSpan) {
          maskedSpan.innerHTML = `<span class="text-rose-400 font-bold">🔴 ${masked} (Verification Failed)</span>`;
        }
        return false;
      }
    }

    function createCleanDnd35Character(summary = {}) {
      const charId = summary.id || ('char_' + Date.now());
      const hpVal = Number(summary.currentHp || summary.maxHp || (summary.hp && (summary.hp.current ?? summary.hp.max)) || summary.hp || 0);
      const acVal = Number(summary.ac?.total || summary.ac || 10);
      const touchVal = Number(summary.ac?.touch || summary.touchAc || 10);
      const flatVal = Number(summary.ac?.flatFooted || Math.max(10, acVal - 2));
      const race = summary.race || '';
      const classes = summary.classes || '';
      const name = summary.name || 'New Character';
      const isNpc = summary.isNpc !== undefined ? Boolean(summary.isNpc) : Boolean(summary.cr);

      const parsedAbilities = summary.abilities ? {
        str: Number(summary.abilities.str) || 10,
        dex: Number(summary.abilities.dex) || 10,
        con: Number(summary.abilities.con) || 10,
        int: Number(summary.abilities.int) || 10,
        wis: Number(summary.abilities.wis) || 10,
        cha: Number(summary.abilities.cha) || 10
      } : { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

      const spellcastingObj = summary.spellcasting ? JSON.parse(JSON.stringify(summary.spellcasting)) : {
        cl: 0,
        ability: 'cha',
        statName: 'CHA',
        slots: []
      };

      return {
        schemaVersion: "2.0",
        id: charId,
        _hubId: charId,
        campaignId: summary.campaignId || null,
        isNpc: isNpc,
        cr: summary.cr || '',
        name: name,
        race: race,
        classes: classes,
        level: Number(summary.level) || 1,
        bab: Number(summary.bab) || 0,
        baseSpeed: Number(summary.baseSpeed) || 30,
        hitDie: summary.hitDie || '',
        alignment: summary.alignment || '',
        abilities: parsedAbilities,
        baseAbilities: JSON.parse(JSON.stringify(parsedAbilities)),
        hp: {
          current: hpVal,
          max: Number(summary.hp?.max || summary.maxHp || hpVal),
          baseMax: Number(summary.hp?.baseMax || summary.maxHp || hpVal),
          conBonusHp: 0,
          temp: Number(summary.hp?.temp) || 0,
          nonlethal: 0
        },
        acBreakdown: {
          armor: 0,
          shield: 0,
          natural: 0,
          deflection: 0,
          size: 0
        },
        ac: {
          total: acVal,
          touch: touchVal,
          flatFooted: flatVal
        },
        baseSaves: {
          fort: Number(summary.saves?.fort?.total || summary.fortSave) || 0,
          ref: Number(summary.saves?.ref?.total || summary.refSave) || 0,
          will: Number(summary.saves?.will?.total || summary.willSave) || 0
        },
        saveBonuses: { resistance: 0 },
        saves: {
          fort: { total: Number(summary.saves?.fort?.total || summary.fortSave) || 0 },
          ref: { total: Number(summary.saves?.ref?.total || summary.refSave) || 0 },
          will: { total: Number(summary.saves?.will?.total || summary.willSave) || 0 }
        },
        portrait: summary.portrait || summary.avatarUrl || '',
        avatarUrl: summary.portrait || summary.avatarUrl || '',
        weapons: Array.isArray(summary.weapons) ? summary.weapons : [],
        activeWeapon: summary.mainWeapon || (summary.weapons?.[0]?.name) || '',
        bodySlots: summary.bodySlots || {
          head: null,
          eyes: null,
          neck: null,
          torso: null,
          armor: null,
          cloak: null,
          waist: null,
          wrists: null,
          hands: null,
          ring1: null,
          ring2: null,
          feet: null
        },
        gearPool: Array.isArray(summary.gearPool) ? summary.gearPool : [],
        inventory: Array.isArray(summary.inventory) ? summary.inventory : [],
        skills: Array.isArray(summary.skills) ? summary.skills : [],
        feats: Array.isArray(summary.feats) ? summary.feats : [],
        specialAbilities: Array.isArray(summary.specialAbilities) ? summary.specialAbilities : [],
        spells: Array.isArray(summary.spells) ? summary.spells : (Array.isArray(summary.spellcasting?.knownSpells) ? summary.spellcasting.knownSpells : []),
        buffs: Array.isArray(summary.buffs) ? summary.buffs : [],
        debuffs: Array.isArray(summary.debuffs) ? summary.debuffs : [],
        spellcasting: spellcastingObj,
        levelProgression: Array.isArray(summary.levelProgression) ? summary.levelProgression : [],
        tomeOfBattle: summary.tomeOfBattle || {
          stances: [],
          readiedManeuvers: []
        },
        combatPins: summary.combatPins || {
          offense_melee: [],
          offense_ranged: [],
          offense_spell: [],
          spell_control: [],
          spell_support: [],
          defense: []
        },
        tactical: summary.tactical || {
          powerAttack: 0,
          flanking: false,
          charge: false,
          higherGround: false,
          combatExpertise: 0,
          fightingDefensively: false,
          totalDefense: false,
          shieldBlockActive: false,
          round: 1,
          weaponSets: {
            activeSets: [1]
          }
        },
        settings: summary.settings || {
          pinDrawerLimit: 5,
          clMode: 'Class Level',
          babSaveSystem: 'standard'
        },
        customDb: Array.isArray(summary.customDb) ? summary.customDb : []
      };
    }

    async function revalidateCharacterFromCloudInBackground(reqId) {
      if (!window.SupabaseAuth || window.SupabaseAuth.isLocalMode()) return false;
      try {
        const cloudChars = await window.SupabaseAuth.fetchUserCharacters();
        if (!Array.isArray(cloudChars) || cloudChars.length === 0) return false;

        let matchedCloud = null;
        if (reqId) {
          matchedCloud = cloudChars.find(c => c.id === reqId);
        }
        if (!matchedCloud) {
          const activeId = localStorage.getItem('dnd35_active_character_id');
          if (activeId) {
            matchedCloud = cloudChars.find(c => c.id === activeId);
          }
        }
        if (!matchedCloud) {
          matchedCloud = cloudChars.find(c => !c.is_npc) || cloudChars[0];
        }
        if (!matchedCloud || !matchedCloud.full_data) return false;

        const cloudFd = matchedCloud.full_data;
        cloudFd.id = matchedCloud.id;
        cloudFd._hubId = matchedCloud.id;

        const localSaved = character || (() => {
          try {
            const raw = localStorage.getItem('dnd35_character');
            return raw ? JSON.parse(raw) : null;
          } catch (e) { return null; }
        })();

        const cloudLvl = Number(cloudFd.level) || (Array.isArray(cloudFd.progression) ? cloudFd.progression.length : 0);
        const localLvl = localSaved ? (Number(localSaved.level) || (Array.isArray(localSaved.progression) ? localSaved.progression.length : 0)) : 0;
        const cloudRowTs = new Date(matchedCloud.updated_at || 0).getTime();
        const cloudFdTs = cloudFd.lastModified ? new Date(cloudFd.lastModified).getTime() : 0;
        const cloudTs = cloudFdTs > 0 ? Math.max(cloudRowTs, cloudFdTs) : cloudRowTs;
        const localModTs = localSaved?.lastModified ? new Date(localSaved.lastModified).getTime() : 0;
        const localCloudTs = localSaved?._cloudUpdatedAt ? new Date(localSaved._cloudUpdatedAt).getTime() : 0;
        const localTs = Math.max(localModTs, localCloudTs);

        const isLocalEmpty = !localSaved ||
                             (!localSaved.classes && !localSaved.class && localLvl <= 1 && (!localSaved.feats || localSaved.feats.length === 0) && (!localSaved.smartNotes || localSaved.smartNotes.length === 0));

        const isSameSnapshot = Boolean(
          localSaved &&
          (localSaved.id === matchedCloud.id || localSaved._hubId === matchedCloud.id) &&
          ((matchedCloud.updated_at && localSaved._cloudUpdatedAt === matchedCloud.updated_at) ||
           (cloudFd.lastModified && localSaved.lastModified && cloudFd.lastModified === localSaved.lastModified) ||
           (cloudFdTs > 0 && localModTs > 0 && cloudFdTs <= localModTs))
        );

        if (isSameSnapshot && !isLocalEmpty) {
          if (matchedCloud.updated_at && character && character._cloudUpdatedAt !== matchedCloud.updated_at) {
            character._cloudUpdatedAt = matchedCloud.updated_at;
            try { localStorage.setItem('dnd35_character', JSON.stringify(character)); } catch (e) {}
          }
          return false;
        }

        // Only overwrite active local character if local is empty, different ID, or cloud is strictly newer
        const shouldAdoptCloud = isLocalEmpty ||
                                 (localSaved.id !== matchedCloud.id && localSaved._hubId !== matchedCloud.id) ||
                                 cloudLvl > localLvl ||
                                 (cloudLvl === localLvl && cloudTs > localTs + 500);

        if (!shouldAdoptCloud) return false;

        if (matchedCloud.updated_at) {
          cloudFd._cloudUpdatedAt = matchedCloud.updated_at;
          if (!cloudFd.lastModified || new Date(matchedCloud.updated_at).getTime() > new Date(cloudFd.lastModified).getTime()) {
            cloudFd.lastModified = matchedCloud.updated_at;
          }
        }

        try {
          const hubRawPre = localStorage.getItem('dnd35_hub_db');
          const hubDbPre = hubRawPre ? JSON.parse(hubRawPre) : null;
          const hubCharPre = (hubDbPre?.characters || []).find(c => c.id === matchedCloud.id);
          const hubNotes = hubCharPre?.smartNotes || hubCharPre?.notesList || hubCharPre?.fullData?.smartNotes || [];
          const localNotes = (localSaved && (localSaved.id === matchedCloud.id || localSaved._hubId === matchedCloud.id)) ? (localSaved.smartNotes || localSaved.notesList || []) : [];
          const cloudNotes = cloudFd.smartNotes || cloudFd.notesList || [];
          const hubNTs = Number(hubCharPre?._notesUpdatedAt || hubCharPre?.fullData?._notesUpdatedAt || 0);
          const localNTs = Number(localSaved?._notesUpdatedAt || 0);
          const cloudNTs = Number(cloudFd._notesUpdatedAt || 0);
          let bestNotes = cloudNotes;
          let bestNTs = cloudNTs;
          if (hubNTs > bestNTs || (hubNotes.length > bestNotes.length && hubNTs >= bestNTs)) {
            bestNotes = hubNotes;
            bestNTs = hubNTs;
          }
          if (localNTs > bestNTs || (localNotes.length > bestNotes.length && localNTs >= bestNTs)) {
            bestNotes = localNotes;
            bestNTs = localNTs;
          }
          if (Array.isArray(bestNotes) && bestNotes.length > 0) {
            cloudFd.smartNotes = bestNotes;
            cloudFd.notesList = bestNotes;
            if (bestNTs > 0) cloudFd._notesUpdatedAt = bestNTs;
          }
          if (hubDbPre && Array.isArray(hubDbPre.characters)) {
            const hIdx = hubDbPre.characters.findIndex(c => c.id === matchedCloud.id);
            if (hIdx >= 0) {
              hubDbPre.characters[hIdx].fullData = cloudFd;
              if (Array.isArray(cloudFd.smartNotes)) {
                hubDbPre.characters[hIdx].smartNotes = cloudFd.smartNotes;
                hubDbPre.characters[hIdx].notesList = cloudFd.smartNotes;
                if (cloudFd._notesUpdatedAt) hubDbPre.characters[hIdx]._notesUpdatedAt = cloudFd._notesUpdatedAt;
              }
              hubDbPre.characters[hIdx].name = matchedCloud.name || cloudFd.name || hubDbPre.characters[hIdx].name;
              hubDbPre.characters[hIdx].classes = cloudFd.classes || hubDbPre.characters[hIdx].classes;
              hubDbPre.characters[hIdx].level = Number(cloudFd.level) || hubDbPre.characters[hIdx].level;
              hubDbPre.characters[hIdx].maxHp = cloudFd.hp?.max || hubDbPre.characters[hIdx].maxHp;
              hubDbPre.characters[hIdx].currentHp = matchedCloud.current_hp !== undefined ? matchedCloud.current_hp : (cloudFd.hp?.current ?? hubDbPre.characters[hIdx].currentHp);
              hubDbPre.characters[hIdx].tempHp = matchedCloud.temp_hp || 0;
              localStorage.setItem('dnd35_hub_db', JSON.stringify(hubDbPre));
            }
          }
        } catch (nErr) {}

        character = cloudFd;
        if (!Array.isArray(character.customDb)) character.customDb = [];
        masterDb = character.customDb;
        localStorage.setItem('dnd35_character', JSON.stringify(character));
        localStorage.setItem('dnd35_active_character_id', character.id);
        renderAll();
        return true;
      } catch (cloudErr) {
        console.warn('Background cloud revalidation notice:', cloudErr);
        return false;
      }
    }

    async function loadInitialData() {
      // Single-pass Local-First Hydration: read dnd35_hub_db and dnd35_character at most once
      let loadedFromHub = false;
      const urlParams = new URLSearchParams(window.location.search);
      const queryId = urlParams.get('id');
      const reqId = queryId || localStorage.getItem('dnd35_active_character_id');

      let hubDb = null;
      try {
        const hubRaw = localStorage.getItem('dnd35_hub_db');
        if (hubRaw) hubDb = JSON.parse(hubRaw);
      } catch (e) {
        console.warn('Hub DB parse notice:', e);
      }

      let parsedSaved = null;
      try {
        const savedChar = localStorage.getItem('dnd35_character');
        if (savedChar) parsedSaved = JSON.parse(savedChar);
      } catch (e) {}

      // 1. Fast Local Hydration from Hub DB or dnd35_character (<2ms, zero network wait)
      try {
        if (reqId && hubDb && Array.isArray(hubDb.characters)) {
          const found = hubDb.characters.find(c => c.id === reqId);
          if (found) {
            if (found.fullData) {
              character = found.fullData;
              character._hubId = reqId;
              if (found.name && character.name !== found.name) {
                character.name = found.name;
              }
              if (found.isNpc !== undefined && character.isNpc === undefined) {
                character.isNpc = found.isNpc;
              }
              if (found.campaignId !== undefined) {
                character.campaignId = found.campaignId;
              }
              if (found.cr && !character.cr) character.cr = found.cr;
              if (!Array.isArray(character.levelProgression) || character.levelProgression.length === 0) {
                if (Array.isArray(found.levelProgression) && found.levelProgression.length > 0) {
                  character.levelProgression = found.levelProgression;
                } else if (Array.isArray(character.progression) && character.progression.length > 0) {
                  character.levelProgression = character.progression;
                } else if (Array.isArray(found.progression) && found.progression.length > 0) {
                  character.levelProgression = found.progression;
                }
              }
              if (!Array.isArray(character.feats) || character.feats.length === 0) {
                if (Array.isArray(found.feats)) character.feats = found.feats;
              }
              if (!Array.isArray(character.specialAbilities) || character.specialAbilities.length === 0) {
                if (Array.isArray(found.specialAbilities)) character.specialAbilities = found.specialAbilities;
              }
              if (!Array.isArray(character.spells) || character.spells.length === 0) {
                if (Array.isArray(found.spells)) character.spells = found.spells;
                else if (Array.isArray(character.spellcasting?.knownSpells)) character.spells = character.spellcasting.knownSpells;
              }
              if (found.spellcasting && (!character.spellcasting || !character.spellcasting.cl)) {
                character.spellcasting = Object.assign({}, found.spellcasting, character.spellcasting || {});
              }
              if (character.spellcasting && (!character.spellcasting.knownSpells || character.spellcasting.knownSpells.length === 0)) {
                if (Array.isArray(character.spells) && character.spells.length > 0) {
                  character.spellcasting.knownSpells = character.spells;
                }
              }
              if (found.currentHp !== undefined) {
                if (!character.hp) character.hp = {};
                const hubHpTs = Number(found.lastHpUpdateTs) || 0;
                const playerHpTs = Number(character.hp._lastPlayerChangeTs) || 0;
                if (hubHpTs >= playerHpTs) {
                  character.hp.current = found.currentHp;
                  character.hp.max = found.maxHp || character.hp.max || 10;
                  character.hp.temp = found.tempHp || 0;
                  character.hp._lastDmUpdateTs = hubHpTs;
                }
              }
              loadedFromHub = true;
            } else {
              character = createCleanDnd35Character(found);
              character._hubId = reqId;
              found.fullData = character;
              localStorage.setItem('dnd35_hub_db', JSON.stringify(hubDb));
              loadedFromHub = true;
            }
          }
        }
      } catch (err) {
        console.warn('Hub character load notice:', err);
      }

      if (!loadedFromHub) {
        if (queryId && parsedSaved && parsedSaved.id !== queryId && parsedSaved._hubId !== queryId) {
          character = createCleanDnd35Character({ id: queryId, name: 'New Character' });
          character._hubId = queryId;
        } else if (parsedSaved) {
          character = parsedSaved;
        }
      }

      // If local storage was completely empty, await cloud once; otherwise revalidate non-blocking in background
      if (!character && window.SupabaseAuth && !window.SupabaseAuth.isLocalMode()) {
        await revalidateCharacterFromCloudInBackground(reqId);
      } else if (window.SupabaseAuth && !window.SupabaseAuth.isLocalMode()) {
        setTimeout(() => { revalidateCharacterFromCloudInBackground(reqId); }, 150);
      }

      // Reconcile HP with already-parsed Hub DB if available
      try {
        if (hubDb && Array.isArray(hubDb.characters) && character) {
          const myHubId = character._hubId || character.id;
          const myName = (character.name || '').trim().toLowerCase();
          const hubMatch = hubDb.characters.find(c => (myHubId && c.id === myHubId) || (myName && (c.name || '').trim().toLowerCase() === myName));
          if (hubMatch) {
            if (!character._hubId && hubMatch.id) character._hubId = hubMatch.id;
            const hubHpTs = Number(hubMatch.lastHpUpdateTs) || 0;
            const playerHpTs = Number(character.hp?._lastPlayerChangeTs) || 0;
            if (hubHpTs >= playerHpTs && hubMatch.currentHp !== undefined) {
              if (!character.hp) character.hp = {};
              character.hp.current = hubMatch.currentHp;
              character.hp.max = hubMatch.maxHp || character.hp.max || 10;
              character.hp.temp = hubMatch.tempHp || 0;
              character.hp._lastDmUpdateTs = hubHpTs;
            }
            if (window.HubNotes && typeof window.HubNotes.getActiveNotesTarget === 'function') {
              window.HubNotes.getActiveNotesTarget();
            }
          }
        }
      } catch (reconErr) {
        console.warn('HP reconciliation warning:', reconErr);
      }

      // Fetch character_data.json ONLY when character is missing or legacy Kazmil is missing core fields
      try {
        let defaultChar = window.BUNDLED_CHARACTER_DATA || null;
        const mightBeKazmil = character && !character.isNpc && (character.name === "Kazmil'in Çırağı" || (!character._hubId && !queryId));
        const kazmilNeedsPatch = mightBeKazmil && (
          !character.bodySlots || Object.keys(character.bodySlots).length === 0 ||
          !character.gearPool || character.gearPool.length === 0 ||
          !character.levelProgression || character.levelProgression.length === 0 ||
          !character.hitDie ||
          !character.tomeOfBattle || !Array.isArray(character.tomeOfBattle.readiedManeuvers) || character.tomeOfBattle.readiedManeuvers.length === 0
        );
        if (!defaultChar && (!character || kazmilNeedsPatch)) {
          try {
            const res = await fetch('character_data.json');
            if (res.ok) defaultChar = await res.json();
          } catch (fetchErr) {
            console.warn('Network fetch of character_data.json failed:', fetchErr);
          }
        }
        if (!character) {
          if (defaultChar) {
            character = JSON.parse(JSON.stringify(defaultChar));
            character.id = character._hubId || 'char_active_player';
            character._hubId = character.id;
            saveStateToStorage(false, true);
          }
        } else {
          let updated = false;
          const isKazmil = !character.isNpc && ((defaultChar && character.name === defaultChar.name) || character.name === "Kazmil'in Çırağı" || (!character._hubId && !queryId));

          if (isKazmil && defaultChar) {
            if (!character.bodySlots || Object.keys(character.bodySlots).length === 0) {
              character.bodySlots = defaultChar.bodySlots;
              updated = true;
            }
            if (!character.gearPool || character.gearPool.length === 0) {
              character.gearPool = defaultChar.gearPool;
              updated = true;
            }
            if (!character.levelProgression || character.levelProgression.length === 0) {
              character.levelProgression = defaultChar.levelProgression;
              updated = true;
            }
            if (!character.hitDie) {
              character.hitDie = defaultChar.hitDie;
              updated = true;
            }
            const prog = character.levelProgression || [];
            if (prog.length >= 6) {
              const sumFirst6 = prog.slice(0, 6).reduce((acc, p) => acc + (Number(p.hpGain) || 0), 0);
              if (sumFirst6 === 23) {
                if (prog[0]) prog[0].hpGain = 4;
                if (prog[1]) prog[1].hpGain = 4;
                if (prog[2]) prog[2].hpGain = 4;
                if (prog[3]) prog[3].hpGain = 4;
                if (prog[4]) prog[4].hpGain = 4;
                if (prog[5]) prog[5].hpGain = 12;
                if (character.hp) {
                  character.hp.baseMax = 32;
                  character.hp.conBonusHp = 12;
                  if (!character.hp.max || character.hp.max < 44) character.hp.max = 44;
                  if (character.hp.current === undefined) character.hp.current = character.hp.max || 44;
                }
                updated = true;
              }
            }
            if (!character.tomeOfBattle || !Array.isArray(character.tomeOfBattle.readiedManeuvers) || character.tomeOfBattle.readiedManeuvers.length === 0) {
              if (defaultChar && defaultChar.tomeOfBattle && Array.isArray(defaultChar.tomeOfBattle.readiedManeuvers) && defaultChar.tomeOfBattle.readiedManeuvers.length > 0) {
                character.tomeOfBattle = JSON.parse(JSON.stringify(defaultChar.tomeOfBattle));
                updated = true;
              }
            }
          } else {
            if (!character.bodySlots) {
              character.bodySlots = { head: null, eyes: null, neck: null, torso: null, armor: null, cloak: null, waist: null, wrists: null, hands: null, ring1: null, ring2: null, feet: null };
              updated = true;
            }
            if (!Array.isArray(character.gearPool)) {
              character.gearPool = [];
              updated = true;
            }
            if (!Array.isArray(character.inventory)) {
              character.inventory = [];
              updated = true;
            }
            if (!character.tomeOfBattle) {
              character.tomeOfBattle = { stances: [], readiedManeuvers: [] };
              updated = true;
            }
          }

          if (character && !Array.isArray(character.periodicHpEffects)) {
            character.periodicHpEffects = [];
          }
          if (typeof ensureAllSkills === 'function') {
            ensureAllSkills(character);
          }
          if (typeof normalizeCharacterSpellcasting === 'function') {
            normalizeCharacterSpellcasting(character);
          }
          if (!character.combatPins || (!character.combatPins.offense_melee && !character.combatPins.offense)) {
            character.combatPins = (defaultChar && defaultChar.combatPins && isKazmil) ? JSON.parse(JSON.stringify(defaultChar.combatPins)) : { offense_melee: [], offense_ranged: [], offense_spell: [], spell_control: [], spell_support: [], defense: [] };
            updated = true;
          }
          if (!character.weaponAttackProfiles) {
            character.weaponAttackProfiles = {};
            updated = true;
          }
          if (!character.tactical) {
            character.tactical = {
              powerAttack: 0, flanking: false, charge: false, higherGround: false, combatExpertise: 0, fightingDefensively: false, totalDefense: false, shieldBlockActive: false, round: 1
            };
            updated = true;
          }
          if (character.tactical && character.tactical.round === undefined) {
            character.tactical.round = 1;
            updated = true;
          }
          if (!character.settings) character.settings = {};
          if (!character.settings.pinDrawerLimit) {
            character.settings.pinDrawerLimit = 5;
            updated = true;
          }
          if (window.SchemaMigrator && typeof window.SchemaMigrator.upgradeCharacterToV2 === 'function' && character.schemaVersion !== 2) {
            character = window.SchemaMigrator.upgradeCharacterToV2(character);
            updated = true;
          }
          if (updated) saveStateToStorage(false);
        }
      } catch (e) {
        console.error('Error hydrating character defaults:', e);
      }

      // 2. Load Character-Scoped Custom DB (character.customDb <-> masterDb)
      if (character) {
        if (!Array.isArray(character.customDb)) {
          character.customDb = [];
        }
        try {
          const legacyRaw = localStorage.getItem('dnd35_master_db');
          if (legacyRaw) {
            const legacyParsed = JSON.parse(legacyRaw);
            if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
              const existingKeys = new Set(character.customDb.map(m => m && (m.id || (m.name || '').toLowerCase().trim())).filter(Boolean));
              legacyParsed.forEach(item => {
                if (!item || typeof item !== 'object' || !item.name) return;
                const k = item.id || item.name.toLowerCase().trim();
                if (!existingKeys.has(k)) {
                  existingKeys.add(k);
                  character.customDb.push(item);
                }
              });
            }
          }
          localStorage.removeItem('dnd35_master_db');
        } catch (e) {}
        try {
          let rawList = character.customDb.filter(m => m && typeof m === 'object' && m.name);
          rawList = rawList.map(item => {
            if (item.name) item.name = sanitizeMojibakeString(item.name);
            if (item.parent) item.parent = sanitizeMojibakeString(item.parent);
            if (item.benefit) item.benefit = sanitizeMojibakeString(item.benefit);
            if (item.description) item.description = sanitizeMojibakeString(item.description);
            return item;
          });
          if (typeof RuleMaster !== 'undefined' && typeof RuleMaster.normalizeDatabaseList === 'function') {
            rawList = RuleMaster.normalizeDatabaseList(rawList);
          } else if (window.SchemaMigrator && typeof window.SchemaMigrator.migrateMasterDbEntryToV2 === 'function') {
            rawList = rawList.map(m => window.SchemaMigrator.migrateMasterDbEntryToV2(m));
          }
          const seen = new Set();
          const deduped = [];
          rawList.forEach(item => {
            if (!item || !item.name) return;
            const k = (item.id || item.name || '').toLowerCase().trim();
            if (seen.has(k)) return;
            seen.add(k);
            if ((item.type === 'Spell' || (item.category || '').includes('Spell')) && item.level === undefined) {
              if (Array.isArray(item.tags) && item.tags.some(t => String(t).toLowerCase() === 'cantrip')) {
                item.level = 0;
              }
            }
            deduped.push(item);
          });
          character.customDb = deduped;
        } catch (syncErr) {
          console.warn('Canonical V2 character.customDb sync warning:', syncErr);
        }
        masterDb = character.customDb;
      } else {
        masterDb = [];
      }
      window.CORE_SPELLS_AND_MANEUVERS_35E = [];
      if (window.RuleMaster && Array.isArray(window.RuleMaster.selectedIds)) {
        window.RuleMaster.selectedIds = new Set();
      } else if (window.RuleMaster && window.RuleMaster.selectedIds instanceof Set) {
        window.RuleMaster.selectedIds.clear();
      }

      if (typeof syncCustomClassesToRuleEngine === 'function') {
        syncCustomClassesToRuleEngine();
      }

      // Enforce D&D 3.5e RAW slot integrity on loaded character
      if (typeof sanitizeBodySlots === 'function' && character) {
        if (sanitizeBodySlots(character)) {
          saveStateToStorage(false);
        }
      }

      // Multi-User Cloud Campaign Integration
      if (typeof updateCampaignNavButton === 'function') {
        updateCampaignNavButton();
      }
      const urlCode = new URLSearchParams(window.location.search).get('code');
      if (urlCode && typeof openJoinCampaignModal === 'function') {
        setTimeout(() => {
          openJoinCampaignModal(urlCode.toUpperCase().trim());
        }, 500);
      }
      if (character?.cloudCampaignId && typeof initCampaignRealtimeListener === 'function') {
        initCampaignRealtimeListener(character.cloudCampaignId);
      }
    }

    let _storageSaveTimer = null;
    let _cloudSaveTimer = null;
    let _pendingCloudSync = false;

    function _commitLocalStorageSave() {
      if (_storageSaveTimer) {
        clearTimeout(_storageSaveTimer);
        _storageSaveTimer = null;
      }
      if (!character) return;
      try {
        localStorage.setItem('dnd35_character', JSON.stringify(character));
      } catch (e) {
        console.warn('dnd35_character save warning:', e);
      }

      // Sync character changes back to Hub Database (dnd35_hub_db)
      try {
        const hubRaw = localStorage.getItem('dnd35_hub_db');
        if (hubRaw) {
          const hubDb = JSON.parse(hubRaw);
          const urlParams = new URLSearchParams(window.location.search);
          const requestedId = urlParams.get('id') || localStorage.getItem('dnd35_active_character_id');
          const charId = character._hubId || character.id || requestedId;
          const charName = (character.name || '').trim().toLowerCase();
          if (Array.isArray(hubDb.characters)) {
            let idx = charId ? hubDb.characters.findIndex(c => c.id === charId) : -1;
            if (idx < 0 && charName) {
              idx = hubDb.characters.findIndex(c => (c.name || '').trim().toLowerCase() === charName);
            }
            if (idx >= 0) {
              if (character._hubId && hubDb.characters[idx].id && character._hubId !== hubDb.characters[idx].id) {
                console.warn(`saveStateToStorage guard: character._hubId (${character._hubId}) !== summary.id (${hubDb.characters[idx].id}). Aborting hub overwrite.`);
                return;
              }
              const hubChar = hubDb.characters[idx];
              const hubHpTs = Number(hubChar.lastHpUpdateTs) || 0;
              const playerHpTs = Number(character.hp?._lastPlayerChangeTs) || 0;

              if (playerHpTs > hubHpTs) {
                hubChar.currentHp = character.hp?.current ?? hubChar.currentHp;
                hubChar.tempHp = character.hp?.temp ?? 0;
                hubChar.lastHpUpdateTs = playerHpTs;
              } else if (hubHpTs > 0 && hubChar.currentHp !== undefined) {
                character.hp.current = hubChar.currentHp;
                character.hp.temp = hubChar.tempHp || 0;
                character.hp._lastDmUpdateTs = hubHpTs;
              }
              const activeWep = (character.weapons || []).find(w => w.name === character.activeWeapon) || (character.weapons || [])[0] || {};
              hubChar.name = character.name || hubChar.name;
              hubChar.race = character.race || hubChar.race;
              hubChar.classes = character.classes || (character.class ? (character.class + ' ' + (character.level || 1)) : hubChar.classes);
              hubChar.level = Number(character.level) || hubChar.level;
              hubChar.maxHp = character.hp?.max ?? hubChar.maxHp;
              hubChar.ac = character.acBreakdown?.total ?? character.ac?.total ?? hubChar.ac;
              hubChar.touchAc = character.acBreakdown?.touch ?? character.ac?.touch ?? hubChar.touchAc;
              hubChar.flatFootedAc = character.acBreakdown?.flat ?? character.ac?.flatFooted ?? hubChar.flatFootedAc;
              hubChar.mainWeapon = activeWep.name || hubChar.mainWeapon || 'Weapon';
              hubChar.attackFormula = (activeWep.dice ? `${activeWep.dice}` : '') || hubChar.attackFormula || '+0';
              hubChar.fortSave = character.evaluatedSaves?.fort ?? character.saves?.fort?.total ?? hubChar.fortSave;
              hubChar.refSave = character.evaluatedSaves?.ref ?? character.saves?.ref?.total ?? hubChar.refSave;
              hubChar.willSave = character.evaluatedSaves?.will ?? character.saves?.will?.total ?? hubChar.willSave;
              hubChar.initBonus = (typeof getCharacterInitiative === 'function') ? getCharacterInitiative().total : (hubChar.initBonus ?? 0);
              if (character.portrait || character.avatarUrl || character.portraitUrl) {
                hubChar.portrait = character.portrait || character.avatarUrl || character.portraitUrl;
                hubChar.avatarUrl = hubChar.portrait;
                hubChar.portraitPosition = character.portraitPosition || '50% 50%';
                hubChar.portraitFit = character.portraitFit || '125%';
              }
              const hubNotesTs = Number(hubChar._notesUpdatedAt || hubChar.fullData?._notesUpdatedAt || 0);
              const charNotesTs = Number(character._notesUpdatedAt || 0);
              if (hubNotesTs > charNotesTs && Array.isArray(hubChar.smartNotes)) {
                character.smartNotes = hubChar.smartNotes;
                character.notesList = hubChar.smartNotes;
                character.notes = hubChar.notes || '';
                character._notesUpdatedAt = hubNotesTs;
              } else if (Array.isArray(character.smartNotes) || Array.isArray(character.notesList)) {
                const syncedNotes = character.smartNotes || character.notesList || [];
                hubChar.smartNotes = syncedNotes;
                hubChar.notesList = syncedNotes;
                hubChar.notes = character.notes || '';
                if (charNotesTs > 0) hubChar._notesUpdatedAt = charNotesTs;
              }
              hubChar.fullData = character;
              localStorage.setItem('dnd35_hub_db', JSON.stringify(hubDb));
            }
          }
        }
      } catch (hubErr) {
        console.warn('Hub auto-sync warning:', hubErr);
      }
    }

    function _commitCloudSave() {
      if (_cloudSaveTimer) {
        clearTimeout(_cloudSaveTimer);
        _cloudSaveTimer = null;
      }
      if (!_pendingCloudSync || !character) return;
      _pendingCloudSync = false;

      if (window.GDriveSync) {
        window.GDriveSync.scheduleAutoSave();
      }
      if (window.SupabaseAuth && !window.SupabaseAuth.isLocalMode()) {
        if (!character.id) {
          character.id = character._hubId || 'char_active_player';
          character._hubId = character.id;
        }
        const curLvl = Number(character.level) || (Array.isArray(character.progression) ? character.progression.length : 0);
        const hasNotes = Array.isArray(character.smartNotes) && character.smartNotes.length > 0;
        if (curLvl === 0 && !character.classes && !character.race && !character.name && !hasNotes && (!character.feats || character.feats.length === 0)) {
          console.warn('saveStateToStorage: Character appears uninitialized/empty, prevented overwriting cloud data.');
        } else {
          const pushedModTs = character.lastModified;
          window.SupabaseAuth.upsertUserCharacter(character).then(savedRow => {
            if (savedRow && savedRow.updated_at && character) {
              character._cloudUpdatedAt = savedRow.updated_at;
              if (character.lastModified === pushedModTs) {
                character.lastModified = savedRow.updated_at;
              }
              try {
                localStorage.setItem('dnd35_character', JSON.stringify(character));
              } catch (e) {}
            }
          }).catch(err => {
            console.warn('upsertUserCharacter background notice:', err);
          });
        }
      }
    }

    function flushPendingStorageSave() {
      if (_storageSaveTimer) {
        _commitLocalStorageSave();
      }
      if (_cloudSaveTimer || _pendingCloudSync) {
        _commitCloudSave();
      }
    }
    window.flushPendingStorageSave = flushPendingStorageSave;
    window.addEventListener('beforeunload', flushPendingStorageSave);
    window.addEventListener('pagehide', flushPendingStorageSave);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushPendingStorageSave();
    });

    function saveStateToStorage(triggerCloudSync = true, immediate = false) {
      if (!character) return;
      if (Array.isArray(masterDb)) {
        character.customDb = masterDb;
      } else if (!Array.isArray(character.customDb)) {
        character.customDb = [];
        masterDb = character.customDb;
      } else {
        masterDb = character.customDb;
      }
      character.lastModified = new Date().toISOString();

      if (immediate) {
        _commitLocalStorageSave();
      } else {
        if (_storageSaveTimer) clearTimeout(_storageSaveTimer);
        _storageSaveTimer = setTimeout(_commitLocalStorageSave, 180);
      }

      if (triggerCloudSync) {
        _pendingCloudSync = true;
        if (immediate) {
          _commitCloudSave();
        } else {
          if (_cloudSaveTimer) clearTimeout(_cloudSaveTimer);
          _cloudSaveTimer = setTimeout(_commitCloudSave, 1000);
        }
      }
    }

    // =========================================================================
    // ⚡ ÇOKLU CİHAZ CANLI SENKRONİZASYON VE SEKME ODAĞI MOTORU
    // =========================================================================
    function initCharacterRealtimeSync() {
      if (!window.SupabaseAuth || window.SupabaseAuth.isLocalMode()) return;
      if (!character || !character.id) return;

      const myCharId = character._hubId || character.id;
      window.SupabaseAuth.subscribeUserCharactersRealtime((payload) => {
        if (!payload || !payload.new) return;
        const incoming = payload.new;

        // Yalnızca aktif karaktere ait güncellemeleri işle
        if (incoming.id !== myCharId && incoming.id !== character.id && incoming.id !== character._hubId) {
          return;
        }
        if (_pendingCloudSync || _cloudSaveTimer) return;

        if (incoming.full_data) {
          const remoteFd = incoming.full_data;
          const remoteUpdatedAt = incoming.updated_at || incoming.last_player_update_ts || '';
          const remoteFdTs = remoteFd.lastModified ? new Date(remoteFd.lastModified).getTime() : 0;
          const localModTs = character.lastModified ? new Date(character.lastModified).getTime() : 0;
          const localCloudTs = character._cloudUpdatedAt ? new Date(character._cloudUpdatedAt).getTime() : 0;

          const isSameSnapshot = Boolean(
            (remoteUpdatedAt && character._cloudUpdatedAt === remoteUpdatedAt) ||
            (remoteFd.lastModified && character.lastModified && remoteFd.lastModified === character.lastModified) ||
            (remoteFdTs > 0 && localModTs > 0 && remoteFdTs <= localModTs)
          );
          if (isSameSnapshot) {
            if (remoteUpdatedAt && character._cloudUpdatedAt !== remoteUpdatedAt) {
              character._cloudUpdatedAt = remoteUpdatedAt;
              try { localStorage.setItem('dnd35_character', JSON.stringify(character)); } catch (e) {}
            }
            return;
          }

          const remoteLvl = Number(remoteFd.level) || (Array.isArray(remoteFd.progression) ? remoteFd.progression.length : 0);
          const localLvl = Number(character.level) || (Array.isArray(character.progression) ? character.progression.length : 0);
          const remoteRowTs = new Date(remoteUpdatedAt || 0).getTime();
          const remoteTs = remoteFdTs > 0 ? Math.max(remoteRowTs, remoteFdTs) : remoteRowTs;
          const localTs = Math.max(localModTs, localCloudTs);

          // Eğer uzaktaki kopya daha yüksek seviyeliyse veya yerelden daha güncelse:
          if (remoteLvl > localLvl || (remoteLvl === localLvl && remoteTs > localTs + 500)) {
            console.log(`[Realtime Sync] Updated character received from another device: Lvl ${remoteLvl}`);
            remoteFd.id = myCharId;
            remoteFd._hubId = myCharId;
            if (remoteUpdatedAt) {
              remoteFd._cloudUpdatedAt = remoteUpdatedAt;
              remoteFd.lastModified = remoteUpdatedAt;
            }
            if (!Array.isArray(remoteFd.customDb)) remoteFd.customDb = [];
            character = remoteFd;
            masterDb = character.customDb;
            localStorage.setItem('dnd35_character', JSON.stringify(character));
            localStorage.setItem('dnd35_active_character_id', myCharId);
            if (window.RuleMaster && typeof RuleMaster.renderTable === 'function') {
              RuleMaster.renderTable();
            }

            // Hub DB'sini de güncelle
            try {
              const hubRaw = localStorage.getItem('dnd35_hub_db');
              if (hubRaw) {
                const hubDb = JSON.parse(hubRaw);
                if (Array.isArray(hubDb.characters)) {
                  const hIdx = hubDb.characters.findIndex(c => c.id === myCharId);
                  if (hIdx >= 0) {
                    hubDb.characters[hIdx].fullData = remoteFd;
                    hubDb.characters[hIdx].level = remoteLvl;
                    hubDb.characters[hIdx].classes = remoteFd.classes || hubDb.characters[hIdx].classes;
                    hubDb.characters[hIdx].currentHp = incoming.current_hp;
                    hubDb.characters[hIdx].maxHp = remoteFd.hp?.max || hubDb.characters[hIdx].maxHp;
                    localStorage.setItem('dnd35_hub_db', JSON.stringify(hubDb));
                  }
                }
              }
            } catch (e) {}

            renderAll();
            if (typeof showDiceTopToast === 'function') {
              const msg = `Character updated from another device (${character.classes || 'Level ' + character.level})!`;
              showDiceTopToast({
                title: '⚡ Live Cloud Sync',
                text: msg,
                breakdown: msg,
                color: 'emerald'
              });
            }
          }
        }
      });
    }

    let _lastVisibilitySyncTs = 0;
    function initTabVisibilitySync() {
      const handleTabFocus = async () => {
        if (document.visibilityState !== 'visible') return;
        const now = Date.now();
        if (now - _lastVisibilitySyncTs < 5000) return;
        _lastVisibilitySyncTs = now;

        if (!window.SupabaseAuth || window.SupabaseAuth.isLocalMode() || !character) return;
        if (_pendingCloudSync || _cloudSaveTimer) return;
        const myCharId = character._hubId || character.id;
        if (!myCharId) return;

        try {
          const cloudChars = await window.SupabaseAuth.fetchUserCharacters();
          if (!Array.isArray(cloudChars)) return;
          const matched = cloudChars.find(c => c.id === myCharId);
          if (matched && matched.full_data) {
            const remoteFd = matched.full_data;
            const remoteUpdatedAt = matched.updated_at || '';
            const remoteFdTs = remoteFd.lastModified ? new Date(remoteFd.lastModified).getTime() : 0;
            const localModTs = character.lastModified ? new Date(character.lastModified).getTime() : 0;
            const localCloudTs = character._cloudUpdatedAt ? new Date(character._cloudUpdatedAt).getTime() : 0;

            const isSameSnapshot = Boolean(
              (remoteUpdatedAt && character._cloudUpdatedAt === remoteUpdatedAt) ||
              (remoteFd.lastModified && character.lastModified && remoteFd.lastModified === character.lastModified) ||
              (remoteFdTs > 0 && localModTs > 0 && remoteFdTs <= localModTs)
            );
            if (isSameSnapshot) {
              if (remoteUpdatedAt && character._cloudUpdatedAt !== remoteUpdatedAt) {
                character._cloudUpdatedAt = remoteUpdatedAt;
                try { localStorage.setItem('dnd35_character', JSON.stringify(character)); } catch (e) {}
              }
              return;
            }

            const remoteLvl = Number(remoteFd.level) || (Array.isArray(remoteFd.progression) ? remoteFd.progression.length : 0);
            const localLvl = Number(character.level) || (Array.isArray(character.progression) ? character.progression.length : 0);
            const remoteRowTs = new Date(remoteUpdatedAt || 0).getTime();
            const remoteTs = remoteFdTs > 0 ? Math.max(remoteRowTs, remoteFdTs) : remoteRowTs;
            const localTs = Math.max(localModTs, localCloudTs);

            if (remoteLvl > localLvl || (remoteLvl === localLvl && remoteTs > localTs + 500)) {
              console.log(`[Tab Focus Sync] Pulled latest character from cloud on tab focus: Lvl ${remoteLvl}`);
              remoteFd.id = myCharId;
              remoteFd._hubId = myCharId;
              if (remoteUpdatedAt) {
                remoteFd._cloudUpdatedAt = remoteUpdatedAt;
                remoteFd.lastModified = remoteUpdatedAt;
              }
              if (!Array.isArray(remoteFd.customDb)) remoteFd.customDb = [];
              character = remoteFd;
              masterDb = character.customDb;
              localStorage.setItem('dnd35_character', JSON.stringify(character));
              if (window.RuleMaster && typeof RuleMaster.renderTable === 'function') {
                RuleMaster.renderTable();
              }
              renderAll();
              if (typeof showDiceTopToast === 'function') {
                const msg = `Loaded latest version from cloud (${character.classes || 'Level ' + character.level}).`;
                showDiceTopToast({
                  title: '🔄 Tab Sync',
                  text: msg,
                  breakdown: msg,
                  color: 'emerald'
                });
              }
            }
          }
        } catch (e) {
          console.warn('initTabVisibilitySync error:', e);
        }
      };

      document.addEventListener('visibilitychange', handleTabFocus);
      window.addEventListener('focus', handleTabFocus);
    }

    window.forceCloudSyncPull = async function() {
      if (!window.SupabaseAuth || window.SupabaseAuth.isLocalMode()) {
        alert('You must be signed in with your Google account to perform this action.');
        return;
      }
      try {
        const cloudChars = await window.SupabaseAuth.fetchUserCharacters();
        if (!Array.isArray(cloudChars) || cloudChars.length === 0) {
          alert('No saved character found in the cloud.');
          return;
        }
        const myId = character?._hubId || character?.id || localStorage.getItem('dnd35_active_character_id');
        let matched = cloudChars.find(c => c.id === myId) || cloudChars[0];
        if (matched && matched.full_data) {
          character = matched.full_data;
          character.id = matched.id;
          character._hubId = matched.id;
          if (matched.updated_at) {
            character._cloudUpdatedAt = matched.updated_at;
            character.lastModified = matched.updated_at;
          }
          localStorage.setItem('dnd35_character', JSON.stringify(character));
          localStorage.setItem('dnd35_active_character_id', character.id);
          renderAll();
          if (typeof showDiceTopToast === 'function') {
            const msg = `"${character.name}" (${character.classes || 'Level ' + character.level}) loaded successfully!`;
            showDiceTopToast({
              title: '✅ Pulled from Cloud',
              text: msg,
              breakdown: msg,
              color: 'emerald'
            });
          } else {
            alert(`"${character.name}" loaded from the cloud successfully!`);
          }
        }
      } catch (err) {
        alert('Error pulling data from cloud: ' + err.message);
      }
    };

    window.forceCloudSyncPush = async function() {
      if (!window.SupabaseAuth || window.SupabaseAuth.isLocalMode()) {
        alert('You must be signed in with your Google account to perform this action.');
        return;
      }
      if (!character) return;
      try {
        character.lastModified = new Date().toISOString();
        const res = await window.SupabaseAuth.upsertUserCharacter(character);
        if (res) {
          if (res.updated_at) {
            character._cloudUpdatedAt = res.updated_at;
            character.lastModified = res.updated_at;
            try { localStorage.setItem('dnd35_character', JSON.stringify(character)); } catch (e) {}
          }
          if (typeof showDiceTopToast === 'function') {
            const msg = `"${character.name}" saved to the cloud successfully!`;
            showDiceTopToast({
              title: '☁️ Pushed to Cloud',
              text: msg,
              breakdown: msg,
              color: 'emerald'
            });
          } else {
            alert(`"${character.name}" saved to the cloud successfully!`);
          }
        }
      } catch (err) {
        alert('Error pushing data to cloud: ' + err.message);
      }
    };

    // =========================================================================
    // 🎟️ KAMPANYAYA KATILIM VE CANLI REALTIME YÖNETİMİ
    // =========================================================================
    function openJoinCampaignModal(prefilledCode = '') {
      if (typeof window.ensureModalsMounted === 'function') window.ensureModalsMounted();
      const modal = document.getElementById('join-campaign-modal');
      if (!modal) return;

      const codeInput = document.getElementById('join-campaign-input-code');
      if (codeInput) {
        codeInput.value = prefilledCode || character?.campaignInviteCode || '';
      }

      const badgeBox = document.getElementById('current-campaign-badge-box');
      const nameEl = document.getElementById('current-campaign-name');
      const codeEl = document.getElementById('current-campaign-code');

      if (character?.campaignInviteCode || character?.cloudCampaignId) {
        if (badgeBox) badgeBox.classList.remove('hidden');
        if (nameEl) nameEl.textContent = character?.campaignName || 'Active Campaign';
        if (codeEl) codeEl.textContent = `CODE: ${character?.campaignInviteCode || 'CLOUD'}`;
      } else {
        if (badgeBox) badgeBox.classList.add('hidden');
      }

      modal.classList.remove('hidden');
      if (codeInput && !prefilledCode) codeInput.focus();
    }

    function closeJoinCampaignModal() {
      const modal = document.getElementById('join-campaign-modal');
      if (modal) modal.classList.add('hidden');
    }

    async function submitJoinCampaign() {
      const code = document.getElementById('join-campaign-input-code')?.value.trim();
      if (!code) {
        alert('Please enter a valid invite code!');
        return;
      }

      if (window.SupabaseAuth?.isLocalMode()) {
        alert('Please sign in with your Google account to join a cloud campaign.');
        return;
      }

      const btn = document.getElementById('btn-submit-join-campaign');
      if (btn) {
        btn.textContent = 'Connecting...';
        btn.disabled = true;
      }

      try {
        const result = await window.SupabaseAuth.joinCampaignWithCharacter(code, character);
        if (result && result.campaign) {
          character.cloudCampaignId = result.campaign.id;
          character.campaignInviteCode = result.campaign.invite_code;
          character.campaignName = result.campaign.name;
          saveStateToStorage();
          updateCampaignNavButton();
          initCampaignRealtimeListener(result.campaign.id);
          closeJoinCampaignModal();

          if (typeof showDiceTopToast === 'function') {
            showDiceTopToast({
              title: `Joined Campaign: ${result.campaign.name}!`,
              formula: `Code: ${result.campaign.invite_code}`,
              breakdown: `Your character is now linked to the DM table.`,
              total: 'OK',
              icon: '🎟️'
            });
          } else {
            alert(`✅ Successfully joined campaign "${result.campaign.name}"!`);
          }
        }
      } catch (err) {
        console.error('joinCampaign error:', err);
        alert('Error joining campaign: ' + (err.message || err));
      } finally {
        if (btn) {
          btn.textContent = 'Join Campaign';
          btn.disabled = false;
        }
      }
    }

    async function leaveCurrentCampaign() {
      if (!character.cloudCampaignId) return;
      if (!confirm('Are you sure you want to leave this campaign?')) return;

      try {
        await window.SupabaseAuth.leaveCampaign(character.cloudCampaignId, character.id);
      } catch (e) {
        console.warn('leaveCampaign warning:', e);
      }

      character.cloudCampaignId = null;
      character.campaignInviteCode = null;
      character.campaignName = null;
      saveStateToStorage();
      updateCampaignNavButton();
      closeJoinCampaignModal();
      alert('You have left the campaign. Your character remains safely stored independently.');
    }

    function updateCampaignNavButton() {
      const btnText = document.getElementById('btn-join-campaign-text');
      const badge = window._modalsMounted !== false ? document.getElementById('settings-campaign-badge') : null;
      if (character?.campaignInviteCode) {
        if (btnText) btnText.textContent = character.campaignInviteCode;
        if (badge) badge.textContent = character.campaignInviteCode;
      } else {
        if (btnText) btnText.textContent = 'Campaign';
        if (badge) badge.textContent = 'Not Linked';
      }
    }

    function initCampaignRealtimeListener(campaignId) {
      if (!campaignId || !window.SupabaseAuth) return;

      window.SupabaseAuth.subscribeCampaignRealtime(campaignId, {
        onHpChange: (evt) => {
          if (evt && (evt.characterId === character.id || evt.characterId === character._hubId || (character.name && evt.charName === character.name))) {
            if (typeof window.handleIncomingDmHpEvent === 'function') {
              window.handleIncomingDmHpEvent({
                type: 'DM_HP_UPDATE',
                charId: evt.characterId,
                currentHp: evt.currentHp,
                tempHp: evt.tempHp || 0,
                lastHpUpdateTs: evt.lastDmHpUpdateTs || Date.now(),
                charName: character.name
              });
            }
          }
        }
      });
    }

    function openSettingsModal() {
      if (typeof window.ensureModalsMounted === 'function') window.ensureModalsMounted();
      const modal = document.getElementById('settings-modal');
      if (!modal) return;
      modal.classList.remove('hidden');
      updateCampaignNavButton();

      // Update & verify Gemini API key live status badge in settings
      verifySettingsGeminiApiKey(false);

      // Update Vercel / Upstash Cloud UI in settings
      if (window.CloudSync) {
        CloudSync.populateSettingsInputs();
        if (CloudSync.isSyncing || CloudSync.isInitializing) {
          CloudSync.updateStatusUI('syncing');
        } else if (CloudSync.pinRequired && !CloudSync.authenticated) {
          CloudSync.updateStatusUI('locked');
        } else if (CloudSync.configured && CloudSync.authenticated) {
          CloudSync.updateStatusUI('synced');
        } else {
          CloudSync.updateStatusUI('unconfigured');
          CloudSync.init();
        }
      }

      // Update House Rules Checkboxes & Skill Consolidation UI
      const noCrit = document.getElementById('house-no-crit-confirm');
      const manCrit = document.getElementById('house-maneuver-crit');
      const setNoCrit = document.getElementById('settings-no-crit-confirm');
      const setManCrit = document.getElementById('settings-maneuver-crit');
      if (setNoCrit) setNoCrit.checked = character?.houseRules?.noCritConfirm ?? true;
      if (setManCrit) setManCrit.checked = character?.houseRules?.maneuverCrit ?? false;
      if (noCrit) noCrit.checked = character?.houseRules?.noCritConfirm ?? true;
      if (manCrit) manCrit.checked = character?.houseRules?.maneuverCrit ?? false;

      const setCritCap = document.getElementById('setting-crit-cap-min');
      if (setCritCap) setCritCap.value = String(character?.houseRules?.critCapMin ?? 15);
      const setKeenStack = document.getElementById('setting-keen-imp-stacking');
      if (setKeenStack) setKeenStack.value = character?.houseRules?.keenImpCritStacking || 'stack_diminishing';
      const setPrecisionRule = document.getElementById('setting-precision-rule');
      if (setPrecisionRule) setPrecisionRule.value = character?.houseRules?.precisionDamageRule || 'once_per_turn';

      updateHouseRuleSkillConsolidationUI();

      // Sync Feat Mode, Caster CL Mode & Ignore ASF in House Rules
      const featModeSel = document.getElementById('setting-feat-mode');
      if (featModeSel && character?.settings?.featMode) {
        featModeSel.value = character.settings.featMode;
      }
      const clModeSel = document.getElementById('setting-cl-mode');
      if (clModeSel) {
        clModeSel.value = character?.settings?.clMode || 'Class Level';
      }
      const casterTypeSel = document.getElementById('setting-caster-type');
      if (casterTypeSel) {
        casterTypeSel.value = character?.settings?.casterType || 'spontaneous';
      }
      if (typeof updateCasterTypeUIState === 'function') updateCasterTypeUIState();
      const asfChk = document.getElementById('setting-ignore-asf');
      if (asfChk) {
        asfChk.checked = character?.settings?.ignoreAsf !== false;
      }
      const babSaveSel = document.getElementById('setting-bab-save-system');
      if (babSaveSel) {
        babSaveSel.value = character?.settings?.babSaveSystem || 'standard';
      }

      const pinLimitSel = document.getElementById('setting-pin-drawer-limit');
      if (pinLimitSel) {
        pinLimitSel.value = character?.settings?.pinDrawerLimit || 5;
      }

      // Populate Rule Sources and Splatbooks Catalog
      if (window.RuleMaster && typeof RuleMaster.renderSourcesCatalog === 'function') {
        RuleMaster.renderSourcesCatalog();
      }
    }

    function onSettingPinDrawerLimitChange() {
      const sel = document.getElementById('setting-pin-drawer-limit');
      if (!sel || !character) return;
      if (!character.settings) character.settings = {};
      const val = Math.max(1, Math.min(9, parseInt(sel.value) || 5));
      character.settings.pinDrawerLimit = val;
      sel.value = val;
      saveStateToStorage(false);
      renderCombatCockpit();
      showDiceTopToast({
        icon: '📌',
        title: 'Drawer Capacity Updated',
        breakdown: `Combat cockpit drawers will show ${val} slots by default (Maximum: 9).`,
        total: `${val} Slot`
      });
    }

    function closeSettingsModal() {
      const modal = document.getElementById('settings-modal');
      if (modal) modal.classList.add('hidden');
    }

    // Direct shortcut to open Settings directly scrolled and highlighted to Masa & Kural Tercihleri
    function openHouseRulesModal() {
      openSettingsModal();
      setTimeout(() => {
        const el = document.getElementById('section-house-rules');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-amber-500/80');
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-amber-500/80');
          }, 2000);
        }
      }, 50);
    }

    function onHouseRuleCritCapChange(val) {
      if (!character.houseRules) character.houseRules = {};
      character.houseRules.critCapMin = Number(val) || 15;
      saveStateToStorage(true);
      if (typeof recalculateOffense === 'function') recalculateOffense();
      showDiceTopToast({
        icon: '🎯',
        title: 'Critical Threat Cap Updated',
        breakdown: `Critical threat range can expand up to a maximum of ${character.houseRules.critCapMin}-20.`,
        total: `Cap: ${character.houseRules.critCapMin}`
      });
    }

    function onHouseRuleKeenStackingChange(val) {
      if (!character.houseRules) character.houseRules = {};
      character.houseRules.keenImpCritStacking = val;
      saveStateToStorage(true);
      if (typeof recalculateOffense === 'function') recalculateOffense();
      showDiceTopToast({
        icon: '⚔️',
        title: 'Critical Stacking Rule Updated',
        breakdown: val === 'stack_diminishing' ? 'Keen and Imp. Critical stack (+1 threat range).' : (val === 'full' ? 'Full Threat Doubling active (4x).' : 'RAW Core 3.5e: Does not stack.'),
        total: val
      });
    }

    function onHouseRulePrecisionChange(val) {
      if (!character.houseRules) character.houseRules = {};
      character.houseRules.precisionDamageRule = val;
      saveStateToStorage(true);
      if (typeof recalculateOffense === 'function') recalculateOffense();
      showDiceTopToast({
        icon: '🗡️',
        title: 'Precision Damage Rule Updated',
        breakdown: val === 'once_per_turn' ? 'Precision dice apply only to the first hit per turn.' : 'Applies to each qualifying hit.',
        total: val
      });
    }

    function updateActionEconomyUI() {
      if (!character.tactical) character.tactical = {};
      if (!character.tactical.spentActions) character.tactical.spentActions = {};

      const roundEl = document.getElementById('action-economy-round');
      if (roundEl) roundEl.textContent = character.tactical.round || 1;

      const spent = character.tactical.spentActions;
      
      const btnStd = document.getElementById('btn-action-std');
      if (btnStd) {
        const isSpent = !!spent.standard;
        btnStd.className = isSpent
          ? 'ui-btn-sm w-full sm:w-24 h-7 px-2.5 rounded-lg text-[11px] sm:text-xs font-bold border transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 bg-slate-900 border-slate-700 text-slate-500 line-through opacity-60 cursor-pointer whitespace-nowrap min-w-0'
          : 'ui-btn-sm w-full sm:w-24 h-7 px-2.5 rounded-lg text-[11px] sm:text-xs font-bold border transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-sm cursor-pointer whitespace-nowrap min-w-0';
        btnStd.innerHTML = isSpent ? '<span class="w-2 h-2 rounded-full bg-slate-500 inline-block shrink-0"></span><span class="truncate">Standard</span>' : '<span class="w-2 h-2 rounded-full bg-emerald-400 inline-block shrink-0"></span><span class="truncate">Standard</span>';
      }

      const btnMove = document.getElementById('btn-action-move');
      if (btnMove) {
        const isSpent = !!spent.move;
        btnMove.className = isSpent
          ? 'ui-btn-sm w-full sm:w-24 h-7 px-2.5 rounded-lg text-[11px] sm:text-xs font-bold border transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 bg-slate-900 border-slate-700 text-slate-500 line-through opacity-60 cursor-pointer whitespace-nowrap min-w-0'
          : 'ui-btn-sm w-full sm:w-24 h-7 px-2.5 rounded-lg text-[11px] sm:text-xs font-bold border transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-sm cursor-pointer whitespace-nowrap min-w-0';
        btnMove.innerHTML = isSpent ? '<span class="w-2 h-2 rounded-full bg-slate-500 inline-block shrink-0"></span><span class="truncate">Move</span>' : '<span class="w-2 h-2 rounded-full bg-emerald-400 inline-block shrink-0"></span><span class="truncate">Move</span>';
      }

      const btnSwift = document.getElementById('btn-action-swift');
      if (btnSwift) {
        const isSpent = !!spent.swift;
        btnSwift.className = isSpent
          ? 'ui-btn-sm w-full sm:w-24 h-7 px-2.5 rounded-lg text-[11px] sm:text-xs font-bold border transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 bg-slate-900 border-slate-700 text-slate-500 line-through opacity-60 cursor-pointer whitespace-nowrap min-w-0'
          : 'ui-btn-sm w-full sm:w-24 h-7 px-2.5 rounded-lg text-[11px] sm:text-xs font-bold border transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 bg-purple-950/80 border-purple-500/60 text-purple-300 shadow-sm cursor-pointer whitespace-nowrap min-w-0';
        btnSwift.innerHTML = isSpent ? '<span class="w-2 h-2 rounded-full bg-slate-500 inline-block shrink-0"></span><span class="truncate">Swift</span>' : '<span class="w-2 h-2 rounded-full bg-purple-400 inline-block shrink-0"></span><span class="truncate">Swift</span>';
      }

      const btnImm = document.getElementById('btn-action-immediate');
      if (btnImm) {
        const isSpent = !!spent.immediate;
        btnImm.className = isSpent
          ? 'ui-btn-sm w-full sm:w-24 h-7 px-2.5 rounded-lg text-[11px] sm:text-xs font-bold border transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 bg-slate-900 border-slate-700 text-slate-500 line-through opacity-60 cursor-pointer whitespace-nowrap min-w-0'
          : 'ui-btn-sm w-full sm:w-24 h-7 px-2.5 rounded-lg text-[11px] sm:text-xs font-bold border transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 bg-rose-950/80 border-rose-500/60 text-rose-300 shadow-sm cursor-pointer whitespace-nowrap min-w-0';
        btnImm.innerHTML = isSpent ? '<span class="w-2 h-2 rounded-full bg-slate-500 inline-block shrink-0"></span><span class="truncate">Immediate</span>' : '<span class="w-2 h-2 rounded-full bg-rose-400 inline-block shrink-0"></span><span class="truncate">Immediate</span>';
      }

      // Render passive badges
      const passiveContainer = document.getElementById('action-economy-passive-badges');
      if (passiveContainer && typeof RuleEngine !== 'undefined' && RuleEngine.evaluateRuleFlags) {
        const flags = RuleEngine.evaluateRuleFlags(character);
        const badges = [];
        if (flags.allowFlatFootedAoO) {
          badges.push('<span class="px-2 py-0.5 rounded bg-blue-950 border border-blue-600/50 text-blue-300 font-semibold" title="Combat Reflexes: Can make Attacks of Opportunity while Flat-Footed">⚡ Flat-Footed AoO</span>');
        }
        if (flags.disabledAtNegativeHp) {
          badges.push('<span class="px-2 py-0.5 rounded bg-rose-950 border border-rose-600/50 text-rose-300 font-semibold" title="Diehard: Remains conscious / Disabled at 0 to -9 HP">🛡️ Diehard (0 to -9 HP)</span>');
        }
        if (flags.castInWildShape) {
          badges.push('<span class="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600/50 text-emerald-300 font-semibold" title="Natural Spell: Can cast spells while in Wild Shape">🐾 Natural Spell</span>');
        }
        if (flags.opposedCheckBonus && Object.values(flags.opposedCheckBonus).some(v => v > 0)) {
          const ops = Object.entries(flags.opposedCheckBonus).filter(([k, v]) => v > 0).map(([k, v]) => `+${v} ${k}`).join(', ');
          badges.push(`<span class="px-2 py-0.5 rounded bg-amber-950 border border-amber-600/50 text-amber-300 font-semibold" title="Maneuver Checks: ${ops}">⚔️ Maneuvers: ${ops}</span>`);
        }
        passiveContainer.innerHTML = badges.join(' ');
      }
    }

    function toggleActionEconomy(type) {
      if (!character.tactical) character.tactical = {};
      if (!character.tactical.spentActions) character.tactical.spentActions = {};
      character.tactical.spentActions[type] = !character.tactical.spentActions[type];
      updateActionEconomyUI();
      saveStateToStorage(false);
    }

    function resetActionEconomy() {
      if (!character) return;
      if (!character.tactical) character.tactical = {};
      character.tactical.spentActions = {
        standard: false,
        move: false,
        swift: false,
        immediate: false
      };
      updateActionEconomyUI();
    }
    window.resetActionEconomy = resetActionEconomy;

    function consumeActionEconomy(actionTypeOrString, sourceLabel = '') {
      if (!character) return false;
      if (!character.tactical) character.tactical = {};
      if (!character.tactical.spentActions) character.tactical.spentActions = {};

      const spent = character.tactical.spentActions;
      const raw = String(
        (actionTypeOrString && typeof actionTypeOrString === 'object')
          ? (actionTypeOrString.castingTime || actionTypeOrString.action || actionTypeOrString.initiationAction || 'standard')
          : (actionTypeOrString || 'standard')
      ).trim().toLowerCase();

      if (/free/i.test(raw)) return false;

      let kind = 'standard';
      if (/full[-\s]*round|1\s*round|^full$/i.test(raw)) kind = 'full';
      else if (/swift/i.test(raw)) kind = 'swift';
      else if (/immediate|reaction/i.test(raw)) kind = 'immediate';
      else if (/move/i.test(raw)) kind = 'move';

      let alreadySpent = false;
      let spentLabel = 'Standard Action';

      if (kind === 'full') {
        alreadySpent = Boolean(spent.standard || spent.move);
        if (spent.standard && spent.move) {
          spentLabel = 'Full-Round Action (Standard + Move)';
        } else if (spent.standard) {
          spentLabel = 'Standard Action (required for Full-Round Action)';
        } else if (spent.move) {
          spentLabel = 'Move Action (required for Full-Round Action)';
        } else {
          spentLabel = 'Full-Round Action';
        }
        spent.standard = true;
        spent.move = true;
      } else {
        alreadySpent = Boolean(spent[kind]);
        const cap = kind.charAt(0).toUpperCase() + kind.slice(1);
        spentLabel = `${cap} Action`;
        spent[kind] = true;
      }

      updateActionEconomyUI();
      saveStateToStorage(false);

      if (alreadySpent && typeof showDiceTopToast === 'function') {
        const roundNum = Number(character.encounterRound || character.tactical?.round) || 1;
        showDiceTopToast({
          icon: '⚠️',
          title: 'Extra Action Used',
          breakdown: `${spentLabel} was already spent in Round ${roundNum}${sourceLabel ? ' • ' + sourceLabel : ''}.`,
          total: 'Extra Action'
        }, { stack: true, toastId: 'action-economy-overuse-toast' });
      }

      return !alreadySpent;
    }
    window.consumeActionEconomy = consumeActionEconomy;

    function advanceCombatTurn() {
      if (!character.tactical) character.tactical = {};
      character.tactical.round = (Number(character.tactical.round) || 1) + 1;
      character.encounterRound = character.tactical.round;
      resetActionEconomy();
      saveStateToStorage(false);
      showDiceTopToast({
        icon: '⚔️',
        title: 'New Turn Started',
        breakdown: `Round ${character.tactical.round}: Full action budget (Standard, Move, Swift, Immediate) refreshed.`,
        total: `Rd ${character.tactical.round}`
      });
    }

    function setHouseRuleSkillConsolidation(isMerged) {
      if (!character.settings) character.settings = {};
      character.settings.mergeSkills = !!isMerged;
      saveStateToStorage(true);
      updateHouseRuleSkillConsolidationUI();
      renderSkills();
      showDiceTopToast({
        icon: isMerged ? '🔗' : '📂',
        title: 'House Rule Updated',
        breakdown: isMerged 
          ? 'Consolidated Skills (7 Groups) enabled.' 
          : 'Switched to Standard D&D 3.5e RAW (46 Skills) mode.',
        total: isMerged ? 'Consolidated' : 'RAW'
      });
    }

    function updateHouseRuleSkillConsolidationUI() {
      const isMerged = character?.settings?.mergeSkills !== false;
      const btnMerged = document.getElementById('hr-skill-mode-merged-btn');
      const btnRaw = document.getElementById('hr-skill-mode-raw-btn');
      const checkMerged = document.getElementById('hr-skill-mode-merged-check');
      const checkRaw = document.getElementById('hr-skill-mode-raw-check');

      if (btnMerged && btnRaw) {
        if (isMerged) {
          btnMerged.className = 'p-2.5 rounded-lg border-2 text-left transition flex items-center justify-between bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-sm cursor-pointer';
          btnRaw.className = 'p-2.5 rounded-lg border-2 text-left transition flex items-center justify-between bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 cursor-pointer';
          if (checkMerged) checkMerged.classList.remove('hidden');
          if (checkRaw) checkRaw.classList.add('hidden');
        } else {
          btnMerged.className = 'p-2.5 rounded-lg border-2 text-left transition flex items-center justify-between bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 cursor-pointer';
          btnRaw.className = 'p-2.5 rounded-lg border-2 text-left transition flex items-center justify-between bg-sky-950/70 border-sky-500 text-sky-300 shadow-sm cursor-pointer';
          if (checkMerged) checkMerged.classList.add('hidden');
          if (checkRaw) checkRaw.classList.remove('hidden');
        }
      }
    }

    async function saveSettingsApiKey() {
      const input = document.getElementById('settings-gemini-api-key');
      const val = input?.value?.trim() || '';
      if (!val) {
        alert('Please enter a valid Gemini API key.');
        return;
      }
      localStorage.setItem('gemini_api_key', val);
      if (window.RuleMaster) {
        RuleMaster._cachedTaskModels = {};
        RuleMaster._discoveredApiModels = null;
        RuleMaster._cachedModels = null;
        RuleMaster.updateApiKeyUi();
      }
      const ok = await verifySettingsGeminiApiKey(true);
      if (ok) {
        alert('✅ Your Google Gemini API Key has been saved and verified (🟢 Active)!');
      } else {
        alert('⚠️ Key saved, but Google Gemini server could not verify it. Please check your key.');
      }
    }

    function clearSettingsApiKey() {
      if (confirm('Are you sure you want to delete your Gemini API key?')) {
        localStorage.removeItem('gemini_api_key');
        localStorage.removeItem('dnd35_gemini_discovered_models');
        const input = document.getElementById('settings-gemini-api-key');
        if (input) input.value = '';
        if (window.RuleMaster) {
          RuleMaster._cachedTaskModels = {};
          RuleMaster._discoveredApiModels = null;
          RuleMaster._cachedModels = null;
          RuleMaster.updateApiKeyUi();
        }
        verifySettingsGeminiApiKey(true);
        alert('🗑️ Your API Key has been removed.');
      }
    }

    async function diagnoseSettingsApiKey() {
      if (window.RuleMaster && typeof RuleMaster.showDiagnosticsModal === 'function') {
        return RuleMaster.showDiagnosticsModal();
      }
      alert('⚠️ RuleMaster is not loaded yet. Please refresh the page.');
    }

    const TAB_INACTIVE_CLASSES = ['bg-slate-800', 'hover:bg-slate-700', 'text-slate-200', 'hover:text-white', 'border-slate-700', 'hover:border-slate-500', 'shadow-md'];
    const TAB_ACTIVE_CLASSES = ['bg-gradient-to-r', 'from-red-600', 'to-rose-600', 'text-white', 'border-red-400', 'shadow-lg', 'shadow-red-950/60', 'ring-2', 'ring-red-400/40'];

    let _isRestoringScroll = false;
    let _restoreScrollTimers = [];

    function cancelScrollRestoration() {
      if (_isRestoringScroll) {
        _isRestoringScroll = false;
        _restoreScrollTimers.forEach(t => clearTimeout(t));
        _restoreScrollTimers = [];
      }
    }

    // Cancel restoration if user manually scrolls or touches
    window.addEventListener('wheel', cancelScrollRestoration, { passive: true });
    window.addEventListener('touchstart', cancelScrollRestoration, { passive: true });
    window.addEventListener('keydown', (e) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Space', 'Home', 'End'].includes(e.code)) {
        cancelScrollRestoration();
      }
    }, { passive: true });

    let _scrollSaveTimer = null;
    function persistScrollPosition() {
      if (_isRestoringScroll) return;
      try {
        const curTab = localStorage.getItem('dnd35_active_tab') || 'tab-combat';
        const y = window.scrollY || document.documentElement.scrollTop || 0;
        localStorage.setItem('dnd35_scroll_' + curTab, y);
        localStorage.setItem('dnd35_last_scroll_y', y);
      } catch (e) {}
    }

    window.addEventListener('scroll', () => {
      if (_isRestoringScroll) return;
      if (_scrollSaveTimer) return;
      _scrollSaveTimer = setTimeout(() => {
        _scrollSaveTimer = null;
        persistScrollPosition();
      }, 100);
    }, { passive: true });

    window.addEventListener('beforeunload', persistScrollPosition);
    window.addEventListener('pagehide', persistScrollPosition);

    const ALL_SHEET_TABS = ['tab-combat', 'tab-spells', 'tab-core', 'tab-skills', 'tab-defense', 'tab-inventory', 'tab-database', 'tab-sync', 'tab-dice'];
    const _dirtyTabs = new Set(ALL_SHEET_TABS);

    function renderTabIfNeeded(tabId, force = false) {
      if (!tabId) tabId = 'tab-combat';
      if (!force && !_dirtyTabs.has(tabId)) return;
      _dirtyTabs.delete(tabId);
      if (tabId === 'tab-core') _dirtyTabs.delete('tab-skills');
      if (tabId === 'tab-skills') _dirtyTabs.delete('tab-core');

      switch (tabId) {
        case 'tab-combat':
          try { renderWeapons(); } catch (e) { console.error('renderWeapons error:', e); }
          try { renderActiveModifiers(); } catch (e) { console.error('renderActiveModifiers error:', e); }
          try { renderActiveBuffs(); } catch (e) { console.error('renderActiveBuffs error:', e); }
          try { renderSpecialDefenses(); } catch (e) { console.error('renderSpecialDefenses error:', e); }
          try { renderCombatCockpit(); } catch (e) { console.error('renderCombatCockpit error:', e); }
          break;
        case 'tab-spells':
          try {
            if (typeof getMagicDisciplineClassLevels === 'function' && typeof autoSelectMagicDisciplineTab === 'function') {
              const progLevels = getMagicDisciplineClassLevels(character);
              const magicSig = `${character.id || character.name || ''}|${character.settings?.clMode || ''}|${character.settings?.casterType || ''}|${character.settings?.casterTypeExplicit ? 1 : 0}|${progLevels.spontaneous || 0},${progLevels.prepared || 0},${progLevels.divine || 0},${progLevels.martial || 0}`;
              if (window._lastMagicDisciplineSig !== magicSig) {
                window._lastMagicDisciplineSig = magicSig;
                window._userManualMagicDiscipline = null;
                if (character) delete character._preferredMagicDiscipline;
                autoSelectMagicDisciplineTab(character, true);
              } else {
                autoSelectMagicDisciplineTab(character);
              }
            }
          } catch (e) { console.error('autoSelectMagicDisciplineTab error:', e); }
          try { renderSpellSlots(); } catch (e) { console.error('renderSpellSlots error:', e); }
          try { renderManeuvers(); } catch (e) { console.error('renderManeuvers error:', e); }
          try { renderKnownSpells(); } catch (e) { console.error('renderKnownSpells error:', e); }
          break;
        case 'tab-core':
        case 'tab-skills':
          try { renderSkills(); } catch (e) { console.error('renderSkills error:', e); }
          try { renderCoreFeatsAndSpecialAbilities(); } catch (e) { console.error('renderCoreFeatsAndSpecialAbilities error:', e); }
          try { renderLevelProgression(); } catch (e) { console.error('renderLevelProgression error:', e); }
          break;
        case 'tab-defense':
          try { renderSpecialDefenses(); } catch (e) { console.error('renderSpecialDefenses error:', e); }
          try { renderDefenseBreakdown(); } catch (e) { console.error('renderDefenseBreakdown error:', e); }
          try { renderActiveBuffs(); } catch (e) { console.error('renderActiveBuffs error:', e); }
          break;
        case 'tab-inventory':
          try { renderInventory(); } catch (e) { console.error('renderInventory error:', e); }
          try { renderConsumables(); } catch (e) { console.error('renderConsumables error:', e); }
          break;
        case 'tab-database':
          if (typeof renderMasterDbTable === 'function') {
            try { renderMasterDbTable(); } catch (e) { console.error('renderMasterDbTable error:', e); }
          }
          if (window.RuleMaster) {
            try { RuleMaster.init(); } catch (e) { console.error('RuleMaster.init error:', e); }
          }
          break;
        case 'tab-dice':
          try { renderDiceHistory(); } catch (e) { console.error('renderDiceHistory error:', e); }
          try { if (typeof updateDicePoolDisplay === 'function') updateDicePoolDisplay(); } catch (e) {}
          try { if (typeof initDiceColor === 'function') initDiceColor(); } catch (e) {}
          try { if (typeof renderCustomTemplates === 'function') renderCustomTemplates(); } catch (e) {}
          break;
      }
    }
    window.renderTabIfNeeded = renderTabIfNeeded;

    function scrollMobileTabIntoView(tabId) {
      const target = document.getElementById(tabId);
      if (!target || !window.matchMedia('(max-width: 767px)').matches) return;
      const tabTop = Math.max(0, Math.round(target.getBoundingClientRect().top + window.scrollY - 8));
      const savedY = parseInt(localStorage.getItem('dnd35_scroll_' + tabId), 10) || 0;
      window.scrollTo({ top: Math.max(tabTop, savedY), left: 0, behavior: 'instant' });
    }

    function switchTab(tabId, isRestoration = false) {
      let prevTab = null;
      try {
        prevTab = localStorage.getItem('dnd35_active_tab') || 'tab-combat';
        if (!isRestoration && prevTab && prevTab !== tabId) {
          const curY = window.scrollY || document.documentElement.scrollTop || 0;
          localStorage.setItem('dnd35_scroll_' + prevTab, curY);
          localStorage.setItem('dnd35_last_scroll_y', curY);
        }
        localStorage.setItem('dnd35_active_tab', tabId);
      } catch (e) {}

      document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
      const target = document.getElementById(tabId);
      if (target) target.classList.remove('hidden');

      // Top Desktop Tab Buttons
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove(...TAB_ACTIVE_CLASSES);
        btn.classList.add(...TAB_INACTIVE_CLASSES);
      });
      const activeBtn = document.getElementById(tabId.replace('tab-', 'tab-btn-'));
      if (activeBtn) {
        activeBtn.classList.remove(...TAB_INACTIVE_CLASSES);
        activeBtn.classList.add(...TAB_ACTIVE_CLASSES);
      }

      // Mobile Bottom Navigation Buttons
      document.querySelectorAll('.mobile-tab-btn').forEach(btn => {
        btn.classList.remove('text-rose-500');
        btn.classList.add('text-slate-400');
      });
      const activeMobileBtn = document.getElementById(tabId.replace('tab-', 'mobile-tab-btn-'));
      if (activeMobileBtn) {
        activeMobileBtn.classList.remove('text-slate-400');
        activeMobileBtn.classList.add('text-rose-500');
      }

      // Render target tab immediately if marked dirty
      renderTabIfNeeded(tabId, false);

      if (!isRestoration && prevTab !== tabId) scrollMobileTabIntoView(tabId);
    }

    function restoreActiveTabAndScroll() {
      try {
        const savedTab = localStorage.getItem('dnd35_active_tab');
        const targetTab = (savedTab && document.getElementById(savedTab)) ? savedTab : 'tab-combat';

        switchTab(targetTab, true);

        const savedScrollStr = localStorage.getItem('dnd35_scroll_' + targetTab) ?? localStorage.getItem('dnd35_last_scroll_y');
        const targetY = parseInt(savedScrollStr, 10);

        if (!isNaN(targetY) && targetY > 0) {
          _isRestoringScroll = true;
          const applyScroll = () => {
            if (!_isRestoringScroll) return;
            window.scrollTo({ top: targetY, left: 0, behavior: 'instant' });
          };

          applyScroll();
          requestAnimationFrame(applyScroll);

          const delays = [40, 100, 200, 400, 700];
          _restoreScrollTimers = delays.map(d => setTimeout(applyScroll, d));

          setTimeout(() => {
            _isRestoringScroll = false;
          }, 800);
        }
      } catch (e) {
        console.error('restoreActiveTabAndScroll error:', e);
      }
    }

    function normalizeCharacterSpellcasting(char) {
      if (!char) return;
      if (!char.spellcasting || typeof char.spellcasting !== 'object') {
        char.spellcasting = {};
      }
      const sc = char.spellcasting;
      const toSlotsArray = (raw) => {
        if (Array.isArray(raw)) return raw;
        if (raw && typeof raw === 'object') {
          return Object.entries(raw).map(([lvl, val]) => {
            if (val && typeof val === 'object') {
              return {
                level: Number(val.level ?? lvl),
                daily: Number(val.daily ?? val.max ?? 0),
                used: Number(val.used ?? 0),
                dmBonus: Number(val.dmBonus ?? 0)
              };
            }
            return { level: Number(lvl), daily: Number(val) || 0, used: 0 };
          });
        }
        return [];
      };

      sc.slots = toSlotsArray(sc.slots);
      sc.preparedSlots = toSlotsArray(sc.preparedSlots);
      sc.divineSlots = toSlotsArray(sc.divineSlots);

      if (char.spellSlots && typeof char.spellSlots === 'object' && sc.slots.length === 0) {
        sc.slots = toSlotsArray(char.spellSlots);
      }
      if (!Array.isArray(sc.knownSpells)) sc.knownSpells = [];
      if (!Array.isArray(sc.preparedSpells)) sc.preparedSpells = [];
      if (!Array.isArray(sc.divineSpells)) sc.divineSpells = [];
    }

    function normalizeLegacyTurkishCharacterData(charObj) {
      if (!charObj || typeof charObj !== 'object') return;
      if (/^erkek$/i.test(String(charObj.gender || '').trim())) charObj.gender = 'Male';
      else if (/^kad[ıi]n$/i.test(String(charObj.gender || '').trim())) charObj.gender = 'Female';

      if (/^medium\s*\(orta\)$/i.test(String(charObj.size || '').trim())) charObj.size = 'Medium';
      else if (/^small\s*\(k[üu][çc][üu]k\)$/i.test(String(charObj.size || '').trim())) charObj.size = 'Small';
      else if (/^large\s*\(b[üu]y[üu]k\)$/i.test(String(charObj.size || '').trim())) charObj.size = 'Large';

      if (charObj.activeWeapon === 'Yumruk (Unarmed)') charObj.activeWeapon = 'Unarmed Strike';
      else if (charObj.activeWeapon === 'Yok') charObj.activeWeapon = 'None';
      if (charObj.activeOffHand === 'Yumruk (Unarmed)') charObj.activeOffHand = 'Unarmed Strike';
      else if (charObj.activeOffHand === 'Yok') charObj.activeOffHand = 'None';

      const normWeaponSet = (ws) => {
        if (!ws || typeof ws !== 'object') return;
        if (ws.set1) {
          if (ws.set1.name === 'Ana El' || ws.set1.name === 'Menzilli Silah') ws.set1.name = 'Main Hand';
          if (ws.set1.mainWeapon === 'Yumruk (Unarmed)') ws.set1.mainWeapon = 'Unarmed Strike';
          else if (ws.set1.mainWeapon === 'Yok') ws.set1.mainWeapon = 'None';
          if (ws.set1.grip === 'Tek El') ws.set1.grip = '1-Hand';
          else if (ws.set1.grip === 'Çift El') ws.set1.grip = '2-Hand';
          else if (ws.set1.grip === 'İkinci El' || ws.set1.grip === 'Ikinci El') ws.set1.grip = 'Off-Hand';
        }
        if (ws.set2) {
          if (ws.set2.name === 'İkinci El' || ws.set2.name === 'Ikinci El' || ws.set2.name === 'Ana El') ws.set2.name = 'Off-Hand';
          if (ws.set2.mainWeapon === 'Yumruk (Unarmed)') ws.set2.mainWeapon = 'Unarmed Strike';
          else if (ws.set2.mainWeapon === 'Yok') ws.set2.mainWeapon = 'None';
          if (ws.set2.grip === 'Tek El') ws.set2.grip = '1-Hand';
          else if (ws.set2.grip === 'Çift El') ws.set2.grip = '2-Hand';
          else if (ws.set2.grip === 'İkinci El' || ws.set2.grip === 'Ikinci El') ws.set2.grip = 'Off-Hand';
        }
      };
      if (charObj.tactical) {
        normWeaponSet(charObj.tactical.weaponSets);
        normWeaponSet(charObj.tactical.meleeWeaponSets);
        normWeaponSet(charObj.tactical.rangedWeaponSets);
      }

      if (Array.isArray(charObj.weapons)) {
        charObj.weapons.forEach(w => {
          if (!w || typeof w !== 'object') return;
          if (w.name === 'Yumruk (Unarmed)') w.name = 'Unarmed Strike';
          if (w.slot === 'Ana El') w.slot = 'Main Hand';
          else if (w.slot === 'İkinci El' || w.slot === 'Ikinci El') w.slot = 'Off-Hand';
          else if (w.slot === 'Çift El') w.slot = 'Two-Handed';
          else if (w.slot === 'Menzilli') w.slot = 'Ranged';
          if (w.grip === 'Tek El') w.grip = '1-Hand';
          else if (w.grip === 'Çift El') w.grip = '2-Hand';
          else if (w.grip === 'İkinci El' || w.grip === 'Ikinci El') w.grip = 'Off-Hand';
          const fixDmgType = (dt) => {
            if (!dt || typeof dt !== 'string') return dt;
            return dt
              .replace(/Ezici\s*\(Öldürücü Olmayan\)/gi, 'Bludgeoning (Nonlethal)')
              .replace(/Delici\s*\(Finesse\)/gi, 'Piercing (Finesse)')
              .replace(/\bDelici\b/gi, 'Piercing')
              .replace(/\bKesici\b/gi, 'Slashing')
              .replace(/\bEzici\b/gi, 'Bludgeoning');
          };
          if (w.type) w.type = fixDmgType(w.type);
          if (w.dmgType) w.dmgType = fixDmgType(w.dmgType);
        });
      }

      const normBuffList = (list) => {
        if (!Array.isArray(list)) return;
        list.forEach(b => {
          if (!b || typeof b !== 'object') return;
          if (typeof b.name === 'string') {
            b.name = b.name.replace(/\s*\((?:Acele|Kutsama|Dua|Yorgun)\)\s*$/i, '').trim();
          }
          if (b.source === 'Condition (Durum)') b.source = 'Condition';
          if (typeof b.durationText === 'string') {
            b.durationText = b.durationText
              .replace(/1 saat \/ CL \(5 Saat\)/gi, '1 hr / CL (5 Hours)')
              .replace(/1 dk \/ CL \(5 Dk\)/gi, '1 min / CL (5 Min)')
              .replace(/1 dk \/ CL/gi, '1 min / CL')
              .replace(/10 dk \/ CL/gi, '10 min / CL')
              .replace(/1 dk \(10 Tur\)/gi, '1 min (10 Rounds)')
              .replace(/1 tur \/ CL \(6 Tur\)/gi, '1 rd / CL (6 Rounds)')
              .replace(/1 tur \/ CL/gi, '1 rd / CL')
              .replace(/(\d+)\s*Tur\b/gi, '$1 Rounds')
              .replace(/8 Saat Dinlenme/gi, '8 Hours Rest')
              .replace(/^Sürekli$/i, 'Continuous')
              .replace(/^Kalıcı$/i, 'Permanent');
          }
        });
      };
      normBuffList(charObj.buffs);
      normBuffList(charObj.debuffs);

      if (Array.isArray(charObj.pinnedActions)) {
        charObj.pinnedActions.forEach(p => {
          if (!p || typeof p !== 'object' || typeof p.action !== 'string') return;
          if (/^standart$/i.test(p.action)) p.action = 'Standard';
          else if (/^h[ıi]zl[ıi](\s*\(swift\))?$/i.test(p.action)) p.action = 'Swift';
          else if (/^tam\s*tur$/i.test(p.action)) p.action = 'Full-Round';
          else if (/^hareket$/i.test(p.action)) p.action = 'Move';
          else if (/^serbest$/i.test(p.action)) p.action = 'Free';
          else if (/^anl[ıi]k$/i.test(p.action)) p.action = 'Immediate';
          else if (/^pasif$/i.test(p.action)) p.action = 'Passive';
        });
      }
    }

    function renderAll(options = {}) {
      if (!character) {
        if (window.BUNDLED_CHARACTER_DATA) {
          character = JSON.parse(JSON.stringify(window.BUNDLED_CHARACTER_DATA));
        } else {
          console.warn('renderAll: character is null and no bundled data available');
          return;
        }
      }

      if (window.SchemaMigrator && typeof window.SchemaMigrator.upgradeCharacterToV2 === 'function' && character.schemaVersion !== 2) {
        character = window.SchemaMigrator.upgradeCharacterToV2(character);
      }
      if (!Array.isArray(character.skills)) {
        character.skills = Object.values(character.skills || {});
        if (typeof ensureAllSkills === 'function') ensureAllSkills(character);
      }
      normalizeLegacyTurkishCharacterData(character);
      normalizeCharacterSpellcasting(character);

      // Recalculate RAW D&D 3.5e character state, equipment bonuses, and active buffs
      if (typeof RuleEngine !== 'undefined' && RuleEngine.recalculateCharacter) {
        try {
          const ceVal = character.tactical?.combatExpertise !== undefined ? character.tactical.combatExpertise : (parseInt(document.getElementById('combat-expertise-val')?.textContent) || 0);
          const fdVal = character.tactical?.fightingDefensively !== undefined ? character.tactical.fightingDefensively : (document.getElementById('toggle-fighting-defensively')?.checked || false);
          const tdVal = character.tactical?.totalDefense !== undefined ? character.tactical.totalDefense : (document.getElementById('toggle-total-defense')?.checked || false);
          const chargeVal = character.tactical?.charge !== undefined ? character.tactical.charge : (document.getElementById('mod-charge')?.checked || false);

          RuleEngine.recalculateCharacter(character, (typeof masterDb !== 'undefined' ? masterDb : []), {
            combatExpertise: ceVal,
            fightingDefensively: fdVal,
            totalDefense: tdVal,
            charge: chargeVal
          });
        } catch (e) {
          console.error('recalculateCharacter error:', e);
        }
      }

      // 1. Core Hero HUD & Abilities (Always rendered immediately so top bar and stats stay live)
      try { renderHUD(); } catch (e) { console.error('renderHUD error:', e); }
      try { renderAbilities(); } catch (e) { console.error('renderAbilities error:', e); }
      try { renderCharacterProfile(); } catch (e) { console.error('renderCharacterProfile error:', e); }

      // 2. Mark all 7 tabs dirty and render only the currently active tab (or all tabs if explicitly requested)
      ALL_SHEET_TABS.forEach(t => _dirtyTabs.add(t));

      if (options && options.allTabs) {
        ALL_SHEET_TABS.forEach(t => renderTabIfNeeded(t, true));
      } else {
        let activeTab = 'tab-combat';
        try {
          const savedTab = localStorage.getItem('dnd35_active_tab');
          if (savedTab && ALL_SHEET_TABS.includes(savedTab)) activeTab = savedTab;
        } catch (e) {}
        renderTabIfNeeded(activeTab, true);
      }
    }

    function isCurrentCampaignDmMode() {
      if (!character) return false;
      try {
        const hubRaw = localStorage.getItem('dnd35_hub_db');
        if (!hubRaw) return false;
        const hubDb = JSON.parse(hubRaw);
        if (!hubDb || !Array.isArray(hubDb.campaigns)) return false;

        let campId = character.campaignId || character.cloudCampaignId || null;
        if (Array.isArray(hubDb.characters)) {
          const charId = character._hubId || character.id;
          const hubChar = charId ? hubDb.characters.find(c => c.id === charId) : null;
          if (hubChar && hubChar.campaignId !== undefined) {
            campId = hubChar.campaignId;
          }
        }
        if (!campId || campId === 'all' || campId === 'unassigned') return false;

        const camp = hubDb.campaigns.find(cp => cp.id === campId || (cp.cloudCampaignId && cp.cloudCampaignId === campId));
        if (!camp) return false;
        if (camp.isDmMode) return true;

        if (camp.parentId) {
          const parentCamp = hubDb.campaigns.find(cp => cp.id === camp.parentId || (cp.cloudCampaignId && cp.cloudCampaignId === camp.parentId));
          if (parentCamp && parentCamp.isDmMode) return true;
        }
        return false;
      } catch (e) {
        return false;
      }
    }

    function renderHUD() {
      const nameEl = document.getElementById('char-name-display');
      if (nameEl) nameEl.textContent = character.name;
      const classEl = document.getElementById('char-classes-display');
      if (classEl) classEl.textContent = character.classes;
      const babEl = document.getElementById('char-bab-display');
      if (babEl) babEl.textContent = '+' + (character.bab || 0);

      // Update Top Hero Bar Character Template Badge
      const topTmplBadge = document.getElementById('core-template-badge');
      if (topTmplBadge) {
        const activeTmpls = (typeof RuleEngine !== 'undefined' && typeof RuleEngine.getCharacterActiveTemplateEntries === 'function')
          ? RuleEngine.getCharacterActiveTemplateEntries(character)
          : [];
        if (activeTmpls.length > 0) {
          const charLevel = (character.levelProgression || []).filter(p => p.active !== false).length || Number(character.level) || 1;
          const totalLa = Number(character.levelAdjustment) || activeTmpls.reduce((acc, t) => acc + (Number(t.levelAdjustment) || 0), 0);
          const ecl = charLevel + totalLa;
          const labelText = activeTmpls.length === 1
            ? activeTmpls[0].name
            : `${activeTmpls.map(t => t.name).join(' + ')}`;
          topTmplBadge.textContent = `🧬 ${labelText}${totalLa > 0 ? ` • LA +${totalLa} (ECL ${ecl})` : ''}`;
          topTmplBadge.title = `Active Character Template(s): ${activeTmpls.map(t => `${t.name} (LA +${t.levelAdjustment || 0})`).join(', ')} | Effective Character Level (ECL): ${ecl} — Click to manage templates`;
          topTmplBadge.classList.remove('hidden');
        } else {
          topTmplBadge.classList.add('hidden');
        }
      }

      // Toggle Level Up vs NPC Statblock button (Edit Statblock only active when DM Mode is active on the campaign)
      const lvlUpBtn = document.getElementById('btn-header-level-up');
      const npcStatBtn = document.getElementById('btn-header-npc-statblock');
      const isDmMode = isCurrentCampaignDmMode();
      if (isDmMode) {
        if (npcStatBtn) npcStatBtn.classList.remove('hidden');
        if (lvlUpBtn) {
          if (character.isNpc) lvlUpBtn.classList.add('hidden');
          else lvlUpBtn.classList.remove('hidden');
        }
      } else {
        if (npcStatBtn) npcStatBtn.classList.add('hidden');
        if (lvlUpBtn) lvlUpBtn.classList.remove('hidden');
      }
      
      const initData = getCharacterInitiative();
      const initStr = (initData.total >= 0 ? '+' : '') + initData.total;
      const dexStr = (initData.dexMod >= 0 ? '+' : '') + initData.dexMod;

      const charInitEl = document.getElementById('char-init-display');
      if (charInitEl) charInitEl.textContent = initStr;

      const vitalsInitTotal = document.getElementById('vitals-init-total');
      if (vitalsInitTotal) vitalsInitTotal.textContent = initStr;

      const vitalsInitDex = document.getElementById('vitals-init-dex');
      if (vitalsInitDex) {
        vitalsInitDex.textContent = `Dex Mod ${dexStr}`;
        if (initData.featBonus > 0) {
          vitalsInitDex.title = `Dex: ${dexStr} • Feat (Imp. Init): +${initData.featBonus}`;
        }
      }

      const speedEl = document.getElementById('char-speed-display');
      if (speedEl) speedEl.textContent = (character.effectiveSpeed || character.baseSpeed || 30) + ' ft';

      const curHp = Number(character.hp?.current) || 0;
      const maxHp = Number(character.hp?.max) || 1;
      const curHpEl = document.getElementById('hp-current-display');
      if (curHpEl) curHpEl.textContent = curHp;
      const maxHpEl = document.getElementById('hp-max-display');
      if (maxHpEl) {
        maxHpEl.textContent = maxHp;
        const conBonus = Number(character.hp?.conBonusHp) || 0;
        if (conBonus !== 0) {
          maxHpEl.title = `Max HP: ${maxHp} (Base: ${Number(character.hp?.baseMax) || (maxHp - conBonus)} ${conBonus >= 0 ? '+' : ''}${conBonus} CON)`;
        } else {
          maxHpEl.title = `Max HP: ${maxHp}`;
        }
      }

      const hpBonusTag = document.getElementById('hp-bonus-tag');
      if (hpBonusTag) {
        hpBonusTag.textContent = '';
        hpBonusTag.title = '';
        hpBonusTag.classList.add('hidden');
      }

      const hpTempTag = document.getElementById('hp-temp-tag');
      const tempHp = Math.max(0, Number(character.hp?.temp) || 0);
      if (hpTempTag) {
        if (tempHp > 0) {
          hpTempTag.textContent = `🛡️ +${tempHp} Temp`;
          hpTempTag.classList.remove('hidden');
        } else {
          hpTempTag.textContent = '';
          hpTempTag.classList.add('hidden');
        }
      }

      const pct = Math.max(0, Math.min(100, Math.round((curHp / maxHp) * 100)));
      const bar = document.getElementById('hp-progress-bar');
      const tempBar = document.getElementById('hp-temp-progress-bar');
      if (bar) {
        if (tempHp > 0) {
          const totalPool = Math.max(maxHp, curHp + tempHp);
          const hpWidth = Math.max(0, Math.min(92, Math.round((curHp / totalPool) * 100)));
          const tempWidth = Math.max(8, 100 - hpWidth);
          bar.style.width = hpWidth + '%';
          if (tempBar) {
            tempBar.style.width = tempWidth + '%';
            tempBar.classList.remove('hidden');
          }
        } else {
          bar.style.width = pct + '%';
          if (tempBar) {
            tempBar.style.width = '0%';
            tempBar.classList.add('hidden');
          }
        }
        if (pct > 50) bar.className = 'bg-emerald-500 h-full transition-all';
        else if (pct > 25) bar.className = 'bg-amber-500 h-full transition-all';
        else bar.className = 'bg-rose-500 h-full transition-all';
      }

      const condBadge = document.getElementById('hp-condition-badge');
      const hpCurrentDisplay = document.getElementById('hp-current-display');
      if (condBadge) {
        if (curHp >= maxHp) {
          condBadge.textContent = 'HEALTHY';
          condBadge.className = 'badge bg-emerald-900/60 text-emerald-300 border border-emerald-600';
          if (hpCurrentDisplay) hpCurrentDisplay.className = 'text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono transition-colors';
        } else if (curHp > maxHp / 2) {
          condBadge.textContent = 'SCRATCHED';
          condBadge.className = 'badge bg-emerald-900/40 text-emerald-200 border border-emerald-700';
          if (hpCurrentDisplay) hpCurrentDisplay.className = 'text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono transition-colors';
        } else if (curHp > 0) {
          condBadge.textContent = 'BLOODIED';
          condBadge.className = 'badge bg-amber-900/60 text-amber-300 border border-amber-600';
          if (hpCurrentDisplay) hpCurrentDisplay.className = 'text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono transition-colors';
        } else if (curHp === 0) {
          condBadge.textContent = 'DISABLED';
          condBadge.className = 'badge bg-orange-950 text-orange-400 border border-orange-700';
          if (hpCurrentDisplay) hpCurrentDisplay.className = 'text-2xl sm:text-3xl font-extrabold text-orange-400 font-mono transition-colors';
        } else if (curHp > -10) {
          condBadge.textContent = 'DYING';
          condBadge.className = 'badge bg-rose-950 text-rose-400 border border-rose-700 animate-pulse';
          if (hpCurrentDisplay) hpCurrentDisplay.className = 'text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono animate-pulse transition-colors';
        } else {
          condBadge.textContent = 'DEAD';
          condBadge.className = 'badge bg-slate-950 text-rose-500 border border-slate-800';
          if (hpCurrentDisplay) hpCurrentDisplay.className = 'text-2xl sm:text-3xl font-extrabold text-rose-500 font-mono transition-colors';
        }
      }

      // Periodic HP Effects (DoT / HoT)
      if (typeof renderPeriodicHpEffects === 'function') {
        renderPeriodicHpEffects();
      }

      // AC Live Evaluation
      let acCalc = null;
      try {
        const ceVal = character.tactical?.combatExpertise !== undefined 
          ? character.tactical.combatExpertise 
          : (parseInt(document.getElementById('defense-combat-expertise-val')?.value || document.getElementById('combat-expertise-val')?.textContent) || 0);
        const fdVal = character.tactical?.fightingDefensively !== undefined
          ? character.tactical.fightingDefensively
          : (document.getElementById('toggle-fighting-defensively')?.checked || document.getElementById('mod-defensive-fighting')?.checked || false);
        const tdVal = character.tactical?.totalDefense !== undefined
          ? character.tactical.totalDefense
          : (document.getElementById('toggle-total-defense')?.checked || document.getElementById('mod-total-defense')?.checked || false);
        const chargeVal = character.tactical?.charge !== undefined
          ? character.tactical.charge
          : (document.getElementById('mod-charge')?.checked || false);

        if (typeof RuleEngine !== 'undefined' && RuleEngine.evaluateAC) {
          acCalc = RuleEngine.evaluateAC(character, {
            combatExpertise: ceVal,
            fightingDefensively: fdVal,
            totalDefense: tdVal,
            charge: chargeVal
          });
        }
      } catch (e) {
        console.error('AC evaluation error in renderHUD:', e);
      }

      const totalAc = (character.isNpc && character.ac?.total) ? character.ac.total : (acCalc?.total ?? character.acBreakdown?.total ?? 10);
      const touchAc = (character.isNpc && character.ac?.touch) ? character.ac.touch : (acCalc?.touch ?? character.acBreakdown?.touch ?? 10);
      const flatAc = (character.isNpc && character.ac?.flatFooted) ? character.ac.flatFooted : (acCalc?.flat ?? character.acBreakdown?.flat ?? 10);

      const acTotalEl = document.getElementById('ac-total-display');
      if (acTotalEl) acTotalEl.textContent = totalAc;
      const acTouchEl = document.getElementById('ac-touch-display');
      if (acTouchEl) acTouchEl.textContent = touchAc;
      const acFlatEl = document.getElementById('ac-flat-display');
      if (acFlatEl) acFlatEl.textContent = flatAc;

      const acNotesEl = document.getElementById('ac-notes-display');
      if (acNotesEl) {
        if (character.isNpc) {
          acNotesEl.textContent = `Natural Armor / Statblock AC: ${totalAc} • Touch ${touchAc} • Flat ${flatAc}`;
          acNotesEl.title = `Creature Armor Class: ${totalAc} (Touch: ${touchAc}, Flat-Footed: ${flatAc})`;
        } else {
          const bd = acCalc?.breakdown || character.acBreakdown || {};
          const sources = character.acBreakdown?.sources || {};
          const armorName = (Array.isArray(sources.armor) && sources.armor[0]?.source) ? sources.armor[0].source : null;
          const shieldName = (Array.isArray(sources.shield) && sources.shield[0]?.source) ? sources.shield[0].source : null;

          const detailedParts = [];
          if (bd.armor) detailedParts.push(`Armor +${bd.armor}${armorName ? ` (${armorName})` : ''}`);
          if (bd.shield) detailedParts.push(`Shield +${bd.shield}${shieldName ? ` (${shieldName})` : ''}`);
          if (bd.dex !== undefined) detailedParts.push(`Dex ${bd.dex >= 0 ? '+' + bd.dex : bd.dex}`);
          if (bd.natural) detailedParts.push(`Nat +${bd.natural}`);
          if (bd.deflection) detailedParts.push(`Defl +${bd.deflection}`);
          if (bd.dodge) detailedParts.push(`Dodge +${bd.dodge}`);
          if (bd.penalty) detailedParts.push(`Penalty ${bd.penalty}`);

          const condAcList = Array.isArray(character.conditionalAcBonuses)
            ? character.conditionalAcBonuses
            : (Array.isArray(character.acBreakdown?.conditionalBonuses) ? character.acBreakdown.conditionalBonuses : []);

          if (condAcList.length > 0) {
            const shortCondParts = condAcList.map(ca => {
              const sign = ca.val >= 0 ? `+${ca.val}` : `${ca.val}`;
              return `${sign} ${ca.type || 'Bonus'} (${ca.condition})`;
            });
            const fullCondParts = condAcList.map(ca => {
              const sign = ca.val >= 0 ? `+${ca.val}` : `${ca.val}`;
              return `${sign} ${ca.type || 'Bonus'} AC ${ca.condition} [${ca.source}]`;
            });
            acNotesEl.textContent = shortCondParts.join(' • ');
            acNotesEl.className = 'h-7 flex items-center justify-center text-[10px] text-teal-300 font-semibold text-center truncate bg-slate-950/50 rounded-md px-2 border border-teal-800/50';
            acNotesEl.title = `Situational AC Bonuses (Not Added to Base AC): ${fullCondParts.join(' • ')} | Base AC Breakdown: ${detailedParts.join(' • ')} (Base 10)`;
          } else {
            acNotesEl.textContent = 'No situational AC bonuses';
            acNotesEl.className = 'h-7 flex items-center justify-center text-[10px] text-slate-500 italic text-center truncate bg-slate-950/50 rounded-md px-2 border border-slate-800/60';
            acNotesEl.title = `AC Breakdown: ${detailedParts.join(' • ')} (Base 10) | Click 'Breakdown' for full details.`;
          }
        }
      }

      // Saves Live Evaluation
      let saves = null;
      try {
        if (typeof RuleEngine !== 'undefined' && RuleEngine.evaluateSaves) {
          saves = RuleEngine.evaluateSaves(character);
        }
      } catch (e) {
        console.error('Saves evaluation error in renderHUD:', e);
      }
      if (!saves) {
        const cMod = (typeof RuleEngine !== 'undefined' && RuleEngine.getAbilityMod) ? RuleEngine.getAbilityMod(character.abilities?.con || 10) : 0;
        const dMod = (typeof RuleEngine !== 'undefined' && RuleEngine.getAbilityMod) ? RuleEngine.getAbilityMod(character.abilities?.dex || 10) : 0;
        const wMod = (typeof RuleEngine !== 'undefined' && RuleEngine.getAbilityMod) ? RuleEngine.getAbilityMod(character.abilities?.wis || 10) : 0;
        saves = character.evaluatedSaves || {
          fort: (character.baseSaves?.fort || 0) + cMod,
          ref: (character.baseSaves?.ref || 0) + dMod,
          will: (character.baseSaves?.will || 0) + wMod
        };
      }
      const saveFortVal = (character.isNpc && character.saves?.fort?.total !== undefined) ? character.saves.fort.total : ((saves && typeof saves.fort === 'number' && !isNaN(saves.fort)) ? saves.fort : (character.saves?.fort?.total ?? 7));
      const saveRefVal = (character.isNpc && character.saves?.ref?.total !== undefined) ? character.saves.ref.total : ((saves && typeof saves.ref === 'number' && !isNaN(saves.ref)) ? saves.ref : (character.saves?.ref?.total ?? 6));
      const saveWillVal = (character.isNpc && character.saves?.will?.total !== undefined) ? character.saves.will.total : ((saves && typeof saves.will === 'number' && !isNaN(saves.will)) ? saves.will : (character.saves?.will?.total ?? 4));

      const saveFortEl = document.getElementById('save-fort-display');
      if (saveFortEl) saveFortEl.textContent = (saveFortVal >= 0 ? '+' : '') + saveFortVal;
      const saveRefEl = document.getElementById('save-ref-display');
      if (saveRefEl) saveRefEl.textContent = (saveRefVal >= 0 ? '+' : '') + saveRefVal;
      const saveWillEl = document.getElementById('save-will-display');
      if (saveWillEl) saveWillEl.textContent = (saveWillVal >= 0 ? '+' : '') + saveWillVal;

      // Update save button hover tooltips with detailed calculation breakdown
      const baseFort = character.baseSaves?.fort || 0;
      const baseRef = character.baseSaves?.ref || 0;
      const baseWill = character.baseSaves?.will || 0;
      const conMod = RuleEngine ? RuleEngine.getAbilityMod(character.abilities?.con || 10) : 0;
      const dexMod = RuleEngine ? RuleEngine.getAbilityMod(character.abilities?.dex || 10) : 0;
      const wisMod = RuleEngine ? RuleEngine.getAbilityMod(character.abilities?.wis || 10) : 0;
      const resBonus = character.saveBonuses?.resistance || 0;
      const clarityBonus = saves.battleClarityBonus || 0;

      const btnFort = saveFortEl?.closest('button');
      if (btnFort) {
        btnFort.title = `🛡️ Fortitude: Base ${baseFort} + CON (${conMod >= 0 ? '+' : ''}${conMod})${resBonus ? ` + Resist (+${resBonus})` : ''}${saves.bonusFort ? ` + Misc (+${saves.bonusFort})` : ''} = ${saves.fort >= 0 ? '+' : ''}${saves.fort}`;
      }
      const btnRef = saveRefEl?.closest('button');
      if (btnRef) {
        btnRef.title = `⚡ Reflex: Base ${baseRef} + DEX (${dexMod >= 0 ? '+' : ''}${dexMod})${resBonus ? ` + Resist (+${resBonus})` : ''}${clarityBonus ? ` + Battle Clarity (+${clarityBonus})` : ''}${saves.bonusRef ? ` + Misc (+${saves.bonusRef})` : ''} = ${saves.ref >= 0 ? '+' : ''}${saves.ref}`;
      }
      const btnWill = saveWillEl?.closest('button');
      if (btnWill) {
        btnWill.title = `🧠 Will: Base ${baseWill} + WIS (${wisMod >= 0 ? '+' : ''}${wisMod})${resBonus ? ` + Resist (+${resBonus})` : ''}${saves.bonusWill ? ` + Misc (+${saves.bonusWill})` : ''} = ${saves.will >= 0 ? '+' : ''}${saves.will}`;
      }

      const savesSubtitle = document.getElementById('saves-subtitle-notes');
      if (savesSubtitle) {
        const activeSaveBuffs = (character.buffs || []).filter(b => b.active && (b.saveBonus || b.fortBonus || b.refBonus || b.willBonus));
        if (activeSaveBuffs.length > 0) {
          savesSubtitle.textContent = `✨ Active: ${activeSaveBuffs.map(b => b.name).join(', ')}`;
          savesSubtitle.className = 'text-[10px] text-emerald-400 text-center truncate';
          savesSubtitle.title = `Active buffs are included in saving throws. Click a save to roll.`;
        } else {
          savesSubtitle.textContent = 'Click to roll save';
          savesSubtitle.className = 'text-[10px] text-amber-300 text-center truncate';
          savesSubtitle.title = 'Click to roll 3D polyhedral dice.';
        }
      }

      // Encounter Round Displays
      if (typeof updateRoundDisplays === 'function') {
        updateRoundDisplays();
      }
    }

    // 👤 CHARACTER IDENTITY & PROFILE (Karakter Özellikleri)
    function getDynamicCharacterEmoji(race = '', gender = '', classes = '') {
      const r = (race || '').toLowerCase().trim();
      const g = (gender || '').toLowerCase().trim();
      const c = (classes || '').toLowerCase().trim();

      const isFemale = g.includes('kad') || g.includes('kız') || g.includes('kiz') || g.includes('fem') || g.includes('woman') || g === 'f';
      const isMale = !isFemale;

      const isElf = r.includes('elf');
      const isDwarf = r.includes('dwarf') || r.includes('cüce') || r.includes('cuce');
      const isOrc = r.includes('orc') || r.includes('ork');
      const isHalfling = r.includes('halfling') || r.includes('buçuk') || r.includes('bucuk') || r.includes('gnome') || r.includes('gnom');
      const isDragon = r.includes('dragon') || r.includes('ejder') || r.includes('kobold');
      const isTiefling = r.includes('tiefling') || r.includes('fiend') || r.includes('demon');
      const isAasimar = r.includes('aasimar') || r.includes('celestial') || r.includes('angel') || r.includes('melek');

      const isArcane = c.includes('sorcerer') || c.includes('wizard') || c.includes('mage') || c.includes('büyü') || c.includes('buyu') || c.includes('warmage') || c.includes('warlock');
      const isMartial = c.includes('warblade') || c.includes('fighter') || c.includes('barbarian') || c.includes('crusader') || c.includes('swordsage') || c.includes('knight') || c.includes('savaş');
      const isDivine = c.includes('cleric') || c.includes('paladin') || c.includes('druid') || c.includes('rahip') || c.includes('favored');
      const isRogue = c.includes('rogue') || c.includes('scout') || c.includes('ninja') || c.includes('assassin') || c.includes('hırsız') || c.includes('hirsiz') || c.includes('thief');
      const isRanger = c.includes('ranger') || c.includes('avcı') || c.includes('avci');
      const isBard = c.includes('bard') || c.includes('ozan');
      const isMonk = c.includes('monk') || c.includes('keşiş') || c.includes('kesis');

      // Specific race overrides
      if (isDragon) return '🐲';
      if (isTiefling) return '😈';
      if (isOrc) return isArcane ? (isFemale ? '🧙‍♀️' : '🧙‍♂️') : '👹';
      if (isAasimar) return '👼';

      // Specific class / role combinations
      if (isArcane) {
        if (isElf) return isFemale ? '🧝‍♀️' : '🧝‍♂️';
        if (isDwarf) return '🧔';
        return isFemale ? '🧙‍♀️' : '🧙‍♂️';
      }
      if (isBard) return '🪕';
      if (isMonk) return isFemale ? '🧘‍♀️' : '🧘‍♂️';
      if (isRanger) return isElf ? (isFemale ? '🧝‍♀️' : '🧝‍♂️') : '🏹';
      if (isRogue) return '🥷';
      if (isDivine) {
        if (c.includes('druid')) return '🌿';
        if (c.includes('paladin')) return '🛡️';
        return isFemale ? '🧝‍♀️' : '☀️';
      }
      if (isMartial) {
        if (c.includes('barbarian')) return '🪓';
        if (isDwarf) return '🧔';
        if (isElf) return isFemale ? '🧝‍♀️' : '🧝‍♂️';
        return isFemale ? '🤺' : '⚔️';
      }

      // Race fallbacks
      if (isDwarf) return '🧔';
      if (isElf) return isFemale ? '🧝‍♀️' : '🧝‍♂️';
      if (isHalfling) return isFemale ? '🧑‍🌾' : '🧒';

      // Default fallback
      return isFemale ? '🧙‍♀️' : '🧙‍♂️';
    }

    function resizeAndCompressImage(file, maxWidth = 400, maxHeight = 400, quality = 0.85) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = (e) => {
          const img = new Image();
          img.onerror = reject;
          img.onload = () => {
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    function triggerPortraitUpload() {
      const input = document.getElementById('profile-portrait-file-input');
      if (input) {
        input.value = '';
        input.click();
      }
    }

    async function handlePortraitFileUpload(event) {
      const file = event.target?.files?.[0];
      if (!file) return;
      try {
        const compressedUrl = await resizeAndCompressImage(file, 800, 1000, 0.88);
        if (!character) character = {};
        character.portrait = compressedUrl;
        initPortraitSettings();
        applyPortraitSettings();
        renderCharacterProfile();
        saveStateToStorage(true);
      } catch (err) {
        console.warn('Canvas compression error, using direct FileReader:', err);
        const reader = new FileReader();
        reader.onload = (e) => {
          if (!character) character = {};
          character.portrait = e.target.result;
          initPortraitSettings();
          applyPortraitSettings();
          renderCharacterProfile();
          saveStateToStorage(true);
        };
        reader.readAsDataURL(file);
      }
    }

    function promptPortraitUrl() {
      const current = character?.portrait && !character.portrait.startsWith('data:') ? character.portrait : '';
      const url = prompt('Enter an image URL for the character portrait:\n(e.g., https://example.com/character.jpg)', current);
      if (url === null) return;
      const clean = url.trim();
      if (!clean) {
        removeCharacterPortrait();
      } else {
        if (!character) character = {};
        character.portrait = clean;
        initPortraitSettings();
        applyPortraitSettings();
        renderCharacterProfile();
        saveStateToStorage(true);
      }
    }

    function removeCharacterPortrait() {
      if (character?.portrait) {
        if (!confirm('Are you sure you want to remove the custom portrait and revert to the dynamic class icon?')) return;
        delete character.portrait;
        delete character.portraitPosition;
        delete character.portraitFit;
      }
      const input = document.getElementById('profile-portrait-file-input');
      if (input) input.value = '';
      applyPortraitSettings();
      renderCharacterProfile();
      saveStateToStorage(true);
    }

    function scrollToPortraitPanel() {
      setStatDistMode('portrait');
      const panel = document.getElementById('profile-portrait-panel');
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        panel.classList.add('ring-2', 'ring-indigo-400');
        setTimeout(() => panel.classList.remove('ring-2', 'ring-indigo-400'), 1200);
      }
    }

    // 👤 KARAKTER RESMİ ODAKLAMA & BOYUTLANDIRMA SİSTEMİ
    let isDraggingPortrait = false;
    let portraitDragStartX = 0;
    let portraitDragStartY = 0;
    let portraitDragStartPosXPct = 50;
    let portraitDragStartYPct = 20;

    function initPortraitSettings() {
      if (!character) character = {};
      if (!character.portraitPosition) character.portraitPosition = '50% 20%';
      if (!character.portraitFit) character.portraitFit = 'cover';
    }

    function setPortraitPositionPercent(x, y) {
      initPortraitSettings();
      const clampedX = Math.max(0, Math.min(100, Math.round(x)));
      const clampedY = Math.max(0, Math.min(100, Math.round(y)));
      character.portraitPosition = `${clampedX}% ${clampedY}%`;
      applyPortraitSettings();
      saveStateToStorage(true);
      renderCharacterProfile();
    }

    function onPortraitDragStart(e) {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.tagName === 'SELECT') return;
      if (!character?.portrait) return;
      isDraggingPortrait = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      portraitDragStartX = clientX;
      portraitDragStartY = clientY;

      const current = parsePositionPercentages(character?.portraitPosition || '50% 20%');
      portraitDragStartPosXPct = current.x;
      portraitDragStartYPct = current.y;

      const vp = document.getElementById('portrait-interactive-viewport');
      if (vp) {
        vp.classList.remove('cursor-grab');
        vp.classList.add('cursor-grabbing');
      }

      window.addEventListener('mousemove', onPortraitDragMove);
      window.addEventListener('mouseup', onPortraitDragEnd);
      window.addEventListener('touchmove', onPortraitDragMove, { passive: false });
      window.addEventListener('touchend', onPortraitDragEnd);
    }

    function onPortraitDragMove(e) {
      if (!isDraggingPortrait) return;
      if (e.touches) e.preventDefault();

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const vp = document.getElementById('portrait-interactive-viewport');
      const rect = vp ? vp.getBoundingClientRect() : { width: 160, height: 200 };

      const deltaX = clientX - portraitDragStartX;
      const deltaY = clientY - portraitDragStartY;

      let newX = portraitDragStartPosXPct - (deltaX / (rect.width || 160)) * 100;
      let newY = portraitDragStartYPct - (deltaY / (rect.height || 200)) * 100;

      newX = Math.max(0, Math.min(100, Math.round(newX)));
      newY = Math.max(0, Math.min(100, Math.round(newY)));

      initPortraitSettings();
      character.portraitPosition = `${newX}% ${newY}%`;
      applyPortraitSettings();
    }

    function onPortraitDragEnd() {
      if (!isDraggingPortrait) return;
      isDraggingPortrait = false;

      const vp = document.getElementById('portrait-interactive-viewport');
      if (vp) {
        vp.classList.remove('cursor-grabbing');
        vp.classList.add('cursor-grab');
      }

      window.removeEventListener('mousemove', onPortraitDragMove);
      window.removeEventListener('mouseup', onPortraitDragEnd);
      window.removeEventListener('touchmove', onPortraitDragMove);
      window.removeEventListener('touchend', onPortraitDragEnd);

      saveStateToStorage(true);
      renderCharacterProfile();
    }

    function onPortraitFitChange() {
      const sel = document.getElementById('portrait-fit-select');
      if (!sel) return;
      initPortraitSettings();
      character.portraitFit = sel.value;
      applyPortraitSettings();
      saveStateToStorage(true);
      renderCharacterProfile();
    }

    function setPortraitFitPreset(fit) {
      initPortraitSettings();
      character.portraitFit = fit;
      applyPortraitSettings();
      saveStateToStorage(true);
      renderCharacterProfile();
    }

    function applyPortraitSettings() {
      initPortraitSettings();
      const hasPortrait = Boolean(character && character.portrait);
      const miniImg = document.getElementById('portrait-mini-img');
      const miniFallback = document.getElementById('portrait-mini-fallback');
      const fallbackIcon = document.getElementById('portrait-fallback-icon');
      const statusBadge = document.getElementById('portrait-status-badge');
      const removeBtn = document.getElementById('profile-portrait-remove-btn');
      const fitSel = document.getElementById('portrait-fit-select');
      const coordsBadge = document.getElementById('portrait-pos-coords');
      const gridGuide = document.getElementById('portrait-grid-guide');

      const parsedPos = parsePositionPercentages(character?.portraitPosition || '50% 20%');
      const position = `${parsedPos.x}% ${parsedPos.y}%`;
      const fit = character?.portraitFit || 'cover';

      if (coordsBadge) {
        coordsBadge.textContent = `📍 X: ${Math.round(parsedPos.x)}%, Y: ${Math.round(parsedPos.y)}%`;
      }
      if (fitSel) fitSel.value = fit;

      const race = document.getElementById('profile-edit-race')?.value || character?.race || 'Human';
      const gender = document.getElementById('profile-edit-gender')?.value || character?.gender || 'Male';
      const classes = character?.classes || '';
      const emoji = getDynamicCharacterEmoji(race, gender, classes);

      if (!hasPortrait) {
        if (miniImg) {
          miniImg.style.backgroundImage = 'none';
          miniImg.classList.add('hidden');
        }
        if (miniFallback) miniFallback.classList.remove('hidden');
        if (fallbackIcon) fallbackIcon.textContent = emoji;
        if (statusBadge) {
          statusBadge.textContent = 'Dynamic Icon';
          statusBadge.className = 'badge bg-slate-800 text-slate-400 border border-slate-700 text-[9px]';
        }
        if (removeBtn) removeBtn.classList.add('hidden');
        if (gridGuide) gridGuide.classList.add('hidden');
      } else {
        if (miniImg) {
          miniImg.classList.remove('hidden');
          miniImg.style.backgroundImage = `url("${character.portrait}")`;
          miniImg.style.backgroundPosition = position;
          miniImg.style.backgroundSize = fit;
          miniImg.style.filter = 'none';
        }
        if (miniFallback) miniFallback.classList.add('hidden');
        if (statusBadge) {
          statusBadge.textContent = 'Custom Image Active';
          statusBadge.className = 'badge bg-emerald-950 text-emerald-300 border border-emerald-700 text-[9px] font-bold';
        }
        if (removeBtn) removeBtn.classList.remove('hidden');
        if (gridGuide) gridGuide.classList.remove('hidden');
      }

      // Live update hero card if present in DOM
      const topAvatarHeroDiv = document.querySelector('#core-top-avatar-box > div:first-child');
      if (topAvatarHeroDiv && hasPortrait) {
        topAvatarHeroDiv.style.backgroundPosition = position;
        topAvatarHeroDiv.style.backgroundSize = fit;
      }
    }

    // 🌌 FULL PAGE WALLPAPER & ATMOSPHERE SYSTEM
    const WALLPAPER_THEMES = {
      'dark-blue': {
        filter: 'saturate(0.85) contrast(1.1) brightness(0.75)',
        gradient: (op) => `linear-gradient(180deg, rgba(8, 14, 30, ${op * 0.95}) 0%, rgba(15, 23, 42, ${op * 0.85}) 50%, rgba(8, 14, 30, ${op}) 100%)`
      },
      'mystic-purple': {
        filter: 'hue-rotate(250deg) saturate(0.9) contrast(1.1) brightness(0.7)',
        gradient: (op) => `linear-gradient(180deg, rgba(20, 10, 35, ${op * 0.95}) 0%, rgba(35, 15, 60, ${op * 0.85}) 50%, rgba(12, 6, 22, ${op}) 100%)`
      },
      'crimson': {
        filter: 'hue-rotate(330deg) saturate(0.95) contrast(1.1) brightness(0.7)',
        gradient: (op) => `linear-gradient(180deg, rgba(35, 10, 15, ${op * 0.95}) 0%, rgba(60, 15, 25, ${op * 0.85}) 50%, rgba(18, 5, 10, ${op}) 100%)`
      },
      'emerald': {
        filter: 'hue-rotate(85deg) saturate(0.85) contrast(1.05) brightness(0.7)',
        gradient: (op) => `linear-gradient(180deg, rgba(8, 28, 18, ${op * 0.95}) 0%, rgba(14, 45, 28, ${op * 0.85}) 50%, rgba(6, 18, 12, ${op}) 100%)`
      },
      'monochrome': {
        filter: 'grayscale(0.65) contrast(1.15) brightness(0.65)',
        gradient: (op) => `linear-gradient(180deg, rgba(10, 12, 16, ${op * 0.95}) 0%, rgba(16, 20, 26, ${op * 0.85}) 50%, rgba(6, 8, 10, ${op}) 100%)`
      },
      'natural': {
        filter: 'contrast(1.05) brightness(0.7)',
        gradient: (op) => `linear-gradient(180deg, rgba(8, 14, 30, ${op * 0.88}) 0%, rgba(10, 16, 32, ${op * 0.75}) 50%, rgba(8, 14, 30, ${op * 0.92}) 100%)`
      }
    };

    function initWallpaperIfEmpty() {
      if (!character) character = {};
      if (!character.wallpaper) {
        character.wallpaper = {
          image: '',
          position: 'center center',
          fit: 'cover',
          theme: 'dark-blue',
          opacity: 0.75,
          blur: 1
        };
      }
    }

    let isDraggingWallpaper = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartPosXPct = 50;
    let dragStartPosYPct = 50;

    function parsePositionPercentages(posStr = '50% 50%') {
      if (!posStr) return { x: 50, y: 50 };
      const s = String(posStr).trim().toLowerCase();
      const map = {
        'center center': { x: 50, y: 50 },
        'center top': { x: 50, y: 0 },
        'center bottom': { x: 50, y: 100 },
        'left top': { x: 0, y: 0 },
        'left center': { x: 0, y: 50 },
        'left bottom': { x: 0, y: 100 },
        'right top': { x: 100, y: 0 },
        'right center': { x: 100, y: 50 },
        'right bottom': { x: 100, y: 100 },
        'top': { x: 50, y: 0 },
        'bottom': { x: 50, y: 100 },
        'left': { x: 0, y: 50 },
        'right': { x: 100, y: 50 },
        'center': { x: 50, y: 50 }
      };
      if (map[s]) return map[s];

      const parts = s.replace(/%/g, '').split(/\s+/);
      if (parts.length === 2) {
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        return {
          x: isNaN(x) ? 50 : Math.max(0, Math.min(100, x)),
          y: isNaN(y) ? 50 : Math.max(0, Math.min(100, y))
        };
      }
      return { x: 50, y: 50 };
    }

    function setWallpaperPositionPercent(x, y) {
      initWallpaperIfEmpty();
      const clampedX = Math.max(0, Math.min(100, Math.round(x)));
      const clampedY = Math.max(0, Math.min(100, Math.round(y)));
      character.wallpaper.position = `${clampedX}% ${clampedY}%`;
      applyWallpaperSettings();
      saveStateToStorage(true);
    }

    function onWallpaperDragStart(e) {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      isDraggingWallpaper = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      dragStartX = clientX;
      dragStartY = clientY;

      const current = parsePositionPercentages(character?.wallpaper?.position || '50% 50%');
      dragStartPosXPct = current.x;
      dragStartPosYPct = current.y;

      const phone = document.getElementById('wallpaper-mini-phone');
      if (phone) {
        phone.classList.remove('cursor-grab');
        phone.classList.add('cursor-grabbing');
      }

      window.addEventListener('mousemove', onWallpaperDragMove);
      window.addEventListener('mouseup', onWallpaperDragEnd);
      window.addEventListener('touchmove', onWallpaperDragMove, { passive: false });
      window.addEventListener('touchend', onWallpaperDragEnd);
    }

    function onWallpaperDragMove(e) {
      if (!isDraggingWallpaper) return;
      if (e.touches) e.preventDefault();

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const phone = document.getElementById('wallpaper-mini-phone');
      const rect = phone ? phone.getBoundingClientRect() : { width: 300, height: 200 };

      const deltaX = clientX - dragStartX;
      const deltaY = clientY - dragStartY;

      let newX = dragStartPosXPct - (deltaX / (rect.width || 300)) * 100;
      let newY = dragStartPosYPct - (deltaY / (rect.height || 200)) * 100;

      newX = Math.max(0, Math.min(100, Math.round(newX)));
      newY = Math.max(0, Math.min(100, Math.round(newY)));

      if (!character) character = {};
      initWallpaperIfEmpty();
      character.wallpaper.position = `${newX}% ${newY}%`;
      applyWallpaperSettings();
    }

    function onWallpaperDragEnd() {
      if (!isDraggingWallpaper) return;
      isDraggingWallpaper = false;

      const phone = document.getElementById('wallpaper-mini-phone');
      if (phone) {
        phone.classList.remove('cursor-grabbing');
        phone.classList.add('cursor-grab');
      }

      window.removeEventListener('mousemove', onWallpaperDragMove);
      window.removeEventListener('mouseup', onWallpaperDragEnd);
      window.removeEventListener('touchmove', onWallpaperDragMove);
      window.removeEventListener('touchend', onWallpaperDragEnd);

      saveStateToStorage(true);
    }

    function applyWallpaperSettings() {
      const wp = character?.wallpaper;
      const layer = document.getElementById('app-wallpaper-layer');
      const imgEl = document.getElementById('app-wallpaper-img');
      const overlayEl = document.getElementById('app-wallpaper-overlay');

      const miniImg = document.getElementById('wallpaper-mini-img');
      const miniOverlay = document.getElementById('wallpaper-mini-overlay');
      const statusBadge = document.getElementById('wallpaper-status-badge');
      const clearBtn = document.getElementById('wallpaper-clear-btn');
      const fitSel = document.getElementById('wallpaper-fit-select');
      const themeSel = document.getElementById('wallpaper-theme-select');
      const opSlider = document.getElementById('wallpaper-opacity-slider');
      const opVal = document.getElementById('wallpaper-opacity-val');
      const blurSlider = document.getElementById('wallpaper-blur-slider');
      const blurVal = document.getElementById('wallpaper-blur-val');
      const coordsBadge = document.getElementById('wallpaper-pos-coords');

      if (!wp || !wp.image) {
        document.body.classList.remove('has-wallpaper');
        if (layer) layer.style.display = 'none';
        if (statusBadge) {
          statusBadge.textContent = 'Default Theme';
          statusBadge.className = 'badge bg-slate-800 text-slate-400 border border-slate-700 text-[9px]';
        }
        if (clearBtn) clearBtn.classList.add('hidden');
        if (miniImg) miniImg.style.backgroundImage = 'none';
        if (miniOverlay) miniOverlay.style.background = 'rgba(15, 23, 42, 0.9)';
        if (coordsBadge) coordsBadge.textContent = '📍 X: %50, Y: %50';
        return;
      }

      document.body.classList.add('has-wallpaper');
      if (layer) layer.style.display = 'block';

      const parsedPos = parsePositionPercentages(wp.position || '50% 50%');
      const position = `${parsedPos.x}% ${parsedPos.y}%`;
      const fit = wp.fit || 'cover';
      const themeKey = wp.theme || 'dark-blue';
      const opacity = typeof wp.opacity === 'number' ? wp.opacity : 0.75;
      const blur = typeof wp.blur === 'number' ? wp.blur : 1;

      const themeConf = WALLPAPER_THEMES[themeKey] || WALLPAPER_THEMES['dark-blue'];

      // Apply to full page background
      if (imgEl) {
        imgEl.style.backgroundImage = `url("${wp.image}")`;
        imgEl.style.backgroundPosition = position;
        imgEl.style.backgroundSize = fit;
        imgEl.style.filter = `${themeConf.filter} blur(${blur}px)`;
      }
      if (overlayEl) {
        overlayEl.style.background = themeConf.gradient(opacity);
      }

      // Apply to mini phone preview in modal
      if (miniImg) {
        miniImg.style.backgroundImage = `url("${wp.image}")`;
        miniImg.style.backgroundPosition = position;
        miniImg.style.backgroundSize = fit;
        miniImg.style.filter = `${themeConf.filter} blur(${Math.min(blur, 2)}px)`;
      }
      if (miniOverlay) {
        miniOverlay.style.background = themeConf.gradient(opacity);
      }

      // Update UI controls in modal
      if (statusBadge) {
        statusBadge.textContent = 'Custom Image Active';
        statusBadge.className = 'badge bg-purple-950 text-purple-300 border border-purple-700 text-[9px] font-bold';
      }
      if (clearBtn) clearBtn.classList.remove('hidden');
      if (fitSel) fitSel.value = fit;
      if (themeSel) themeSel.value = themeKey;
      if (opSlider) opSlider.value = Math.round(opacity * 100);
      if (opVal) opVal.textContent = `%${Math.round(opacity * 100)}`;
      if (blurSlider) blurSlider.value = blur;
      if (blurVal) blurVal.textContent = `${blur}px`;
      if (coordsBadge) {
        coordsBadge.textContent = `📍 X: %${Math.round(parsedPos.x)}, Y: %${Math.round(parsedPos.y)}`;
      }
    }

    function triggerWallpaperUpload() {
      const input = document.getElementById('profile-wallpaper-file-input');
      if (input) {
        input.value = '';
        input.click();
      }
    }

    async function handleWallpaperFileUpload(event) {
      const file = event.target?.files?.[0];
      if (!file) return;
      try {
        const compressedUrl = await resizeAndCompressImage(file, 1280, 720, 0.75);
        initWallpaperIfEmpty();
        character.wallpaper.image = compressedUrl;
        applyWallpaperSettings();
        saveStateToStorage(true);
      } catch (err) {
        console.warn('Wallpaper compression error, using FileReader:', err);
        const reader = new FileReader();
        reader.onload = (e) => {
          initWallpaperIfEmpty();
          character.wallpaper.image = e.target.result;
          applyWallpaperSettings();
          saveStateToStorage(true);
        };
        reader.readAsDataURL(file);
      }
    }

    function promptWallpaperUrl() {
      const current = character?.wallpaper?.image && !character.wallpaper.image.startsWith('data:') ? character.wallpaper.image : '';
      const url = prompt('Enter an image URL for the page background:\n(e.g., https://images.unsplash.com/photo-xxx.jpg)', current);
      if (url === null) return;
      const clean = url.trim();
      if (!clean) {
        clearWallpaper();
      } else {
        initWallpaperIfEmpty();
        character.wallpaper.image = clean;
        applyWallpaperSettings();
        saveStateToStorage(true);
      }
    }

    function clearWallpaper() {
      if (character?.wallpaper?.image) {
        if (!confirm('Are you sure you want to remove the custom page background?')) return;
      }
      if (character) {
        character.wallpaper = null;
      }
      const input = document.getElementById('profile-wallpaper-file-input');
      if (input) input.value = '';
      applyWallpaperSettings();
      saveStateToStorage(true);
    }

    function setWallpaperPosition(pos) {
      initWallpaperIfEmpty();
      character.wallpaper.position = pos;
      applyWallpaperSettings();
      saveStateToStorage(true);
    }

    function onWallpaperFitChange() {
      initWallpaperIfEmpty();
      const sel = document.getElementById('wallpaper-fit-select');
      if (sel) character.wallpaper.fit = sel.value;
      applyWallpaperSettings();
      saveStateToStorage(true);
    }

    function onWallpaperThemeChange() {
      initWallpaperIfEmpty();
      const sel = document.getElementById('wallpaper-theme-select');
      if (sel) character.wallpaper.theme = sel.value;
      applyWallpaperSettings();
      saveStateToStorage(true);
    }

    function onWallpaperOpacityChange() {
      initWallpaperIfEmpty();
      const slider = document.getElementById('wallpaper-opacity-slider');
      if (slider) {
        const val = parseInt(slider.value) || 75;
        character.wallpaper.opacity = val / 100;
        const label = document.getElementById('wallpaper-opacity-val');
        if (label) label.textContent = `%${val}`;
      }
      applyWallpaperSettings();
      saveStateToStorage(true);
    }

    function onWallpaperBlurChange() {
      initWallpaperIfEmpty();
      const slider = document.getElementById('wallpaper-blur-slider');
      if (slider) {
        const val = parseInt(slider.value) || 1;
        character.wallpaper.blur = val;
        const label = document.getElementById('wallpaper-blur-val');
        if (label) label.textContent = `${val}px`;
      }
      applyWallpaperSettings();
      saveStateToStorage(true);
    }

    function scrollToWallpaperPanel() {
      setStatDistMode('portrait');
      const panel = document.getElementById('profile-wallpaper-panel');
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        panel.classList.add('ring-2', 'ring-purple-400');
        setTimeout(() => panel.classList.remove('ring-2', 'ring-purple-400'), 1200);
      }
    }

    function updateProfileModalAvatar() {
      const avatarBox = document.getElementById('profile-modal-avatar-box');
      const removeBtn = document.getElementById('profile-portrait-remove-btn');

      const hasPortrait = Boolean(character && character.portrait);

      if (removeBtn) {
        if (hasPortrait) removeBtn.classList.remove('hidden');
        else removeBtn.classList.add('hidden');
      }

      if (!avatarBox) return;

      if (hasPortrait) {
        const pos = character.portraitPosition || '50% 20%';
        const fit = character.portraitFit || 'cover';
        avatarBox.innerHTML = `<div class="w-full h-full bg-no-repeat" style="background-image: url('${character.portrait}'); background-position: ${pos}; background-size: ${fit};"></div>`;
      } else {
        const race = document.getElementById('profile-edit-race')?.value || character?.race || 'Human';
        const gender = document.getElementById('profile-edit-gender')?.value || character?.gender || 'Male';
        const classes = character?.classes || '';
        const emoji = getDynamicCharacterEmoji(race, gender, classes);
        avatarBox.innerHTML = `<span id="profile-modal-avatar-icon">${emoji}</span>`;
      }
    }

    function renderCharacterProfile() {
      if (!character) return;

      const race = character.race || "Human";
      const rawGender = character.gender || "Male";
      const gender = /^erkek$/i.test(String(rawGender).trim()) ? "Male" : (/^kad[ıi]n$/i.test(String(rawGender).trim()) ? "Female" : rawGender);
      if (character.gender && character.gender !== gender) character.gender = gender;
      const classes = character.classes || "";
      const emoji = getDynamicCharacterEmoji(race, gender, classes);

      // 1. Tab-Core Profile Card Avatar
      const coreAvatarBox = document.getElementById('core-profile-avatar-box');
      if (coreAvatarBox) {
        if (character.portrait) {
          const pos = character.portraitPosition || '50% 20%';
          const fit = character.portraitFit || 'cover';
          coreAvatarBox.innerHTML = `<div class="w-full h-full rounded-xl bg-no-repeat shadow" style="background-image: url('${character.portrait}'); background-position: ${pos}; background-size: ${fit};"></div>`;
        } else {
          coreAvatarBox.innerHTML = `<span id="core-profile-avatar-icon" class="text-2xl">${emoji}</span>`;
        }
      }

      // 2. Top Hero Avatar
      const topAvatarBox = document.getElementById('core-top-avatar-box');
      if (topAvatarBox) {
        if (character.portrait) {
          const pos = character.portraitPosition || '50% 20%';
          const fit = character.portraitFit || 'cover';
          topAvatarBox.innerHTML = `
            <div class="w-full h-full bg-no-repeat transition-transform duration-300 group-hover:scale-105"
                 style="background-image: url('${character.portrait}'); background-position: ${pos}; background-size: ${fit};"></div>
            <div class="absolute inset-x-0 bottom-0 py-1.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span class="text-[10px] text-indigo-200 font-bold flex items-center justify-center gap-1">
                <span>📜</span> <span>Character Profile</span>
              </span>
            </div>
          `;
        } else {
          topAvatarBox.innerHTML = `
            <div class="flex flex-col items-center justify-center p-3 text-center">
              <span id="core-top-avatar-icon" class="text-5xl md:text-6xl mb-1">${emoji}</span>
              <span class="text-[10px] text-slate-400 group-hover:text-indigo-300 transition-colors font-medium">✏️ Add Portrait</span>
            </div>
          `;
        }
      }

      // 3. Modal Avatar, Portrait & Wallpaper Settings
      updateProfileModalAvatar();
      applyPortraitSettings();
      applyWallpaperSettings();

      const nameEl = document.getElementById('core-profile-name');
      if (nameEl) nameEl.textContent = character.name || "Unnamed Character";

      const raceBadge = document.getElementById('core-profile-race-badge');
      if (raceBadge) raceBadge.textContent = race;

      const activeTmpls = (typeof RuleEngine !== 'undefined' && typeof RuleEngine.getCharacterActiveTemplateEntries === 'function')
        ? RuleEngine.getCharacterActiveTemplateEntries(character)
        : [];
      const totalLa = Number(character.levelAdjustment) || activeTmpls.reduce((acc, t) => acc + (Number(t.levelAdjustment) || 0), 0);
      const charLevel = (character.levelProgression || []).filter(p => p.active !== false).length || Number(character.level) || 1;
      const ecl = charLevel + totalLa;

      const profTmplBadge = document.getElementById('core-profile-template-badge');
      if (profTmplBadge) {
        if (activeTmpls.length > 0) {
          profTmplBadge.textContent = `🧬 ${activeTmpls.map(t => t.name).join(' + ')}${totalLa > 0 ? ` (LA +${totalLa})` : ''}`;
          profTmplBadge.classList.remove('hidden');
        } else {
          profTmplBadge.classList.add('hidden');
        }
      }

      const lvlBadge = document.getElementById('core-profile-level-badge');
      if (lvlBadge) {
        if (character.isNpc && character.cr) {
          lvlBadge.textContent = `CR ${character.cr}`;
          lvlBadge.className = "badge bg-rose-950 text-rose-300 border border-rose-700/70 text-[10px] font-bold";
        } else if (character.isNpc) {
          lvlBadge.textContent = `NPC • Lvl ${charLevel}${totalLa > 0 ? ` (ECL ${ecl})` : ''}`;
          lvlBadge.className = "badge bg-amber-950 text-amber-300 border border-amber-700/70 text-[10px] font-bold";
        } else {
          lvlBadge.textContent = totalLa > 0 ? `Level ${charLevel} • ECL ${ecl}` : `Level ${charLevel}`;
          lvlBadge.className = "badge bg-emerald-950 text-emerald-300 border border-emerald-700/70 text-[10px] font-bold";
        }
      }

      const tmplSummaryBar = document.getElementById('core-profile-template-summary-bar');
      if (tmplSummaryBar) {
        if (activeTmpls.length > 0) {
          const tSum = character.templateSummary || {};
          const pills = [];
          if (tSum.creatureType) pills.push(`<span class="px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 font-semibold">Type: ${escapeRaceHtml(tSum.creatureType)}</span>`);
          if (Array.isArray(tSum.dr) && tSum.dr.length > 0) pills.push(`<span class="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60 font-semibold">🛡️ DR ${escapeRaceHtml(tSum.dr.join(' • '))}</span>`);
          if (Number(tSum.sr) > 0) pills.push(`<span class="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-200 border border-purple-700/60 font-semibold">🔮 SR ${tSum.sr}</span>`);
          if (Number(tSum.fastHealing) > 0) pills.push(`<span class="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-semibold">💚 Fast Healing ${tSum.fastHealing}</span>`);
          if (Number(tSum.turnResistance) > 0) pills.push(`<span class="px-1.5 py-0.5 rounded bg-slate-900 text-slate-200 border border-slate-700 font-semibold">☀️ Turn Res +${tSum.turnResistance}</span>`);
          if (Array.isArray(tSum.immunities) && tSum.immunities.length > 0) pills.push(`<span class="px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-700/60 font-semibold">Immunities: ${escapeRaceHtml(tSum.immunities.slice(0, 5).join(', '))}${tSum.immunities.length > 5 ? ` (+${tSum.immunities.length - 5})` : ''}</span>`);
          if (Array.isArray(tSum.resistances) && tSum.resistances.length > 0) pills.push(`<span class="px-1.5 py-0.5 rounded bg-teal-950/80 text-teal-300 border border-teal-700/60 font-semibold">Resist: ${escapeRaceHtml(tSum.resistances.join(', '))}</span>`);
          if (Array.isArray(tSum.damageParts) && tSum.damageParts.length > 0) {
            tSum.damageParts.forEach(dp => {
              pills.push(`<span class="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-700/60 font-semibold">🔥 ${escapeRaceHtml(dp.source || 'Attack')}: ${escapeRaceHtml(dp.dice)}${dp.bonus ? `+${dp.bonus}` : ''} ${escapeRaceHtml(dp.type || '')}</span>`);
            });
          }

          tmplSummaryBar.innerHTML = `
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="text-[10px] font-black uppercase tracking-wider text-purple-300 flex items-center gap-1">
                  <span>🧬</span>
                  <span>Active Templates:</span>
                </span>
                ${activeTmpls.map(t => `
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-purple-900/60 text-white border border-purple-500/70 font-bold text-[11px] shadow-sm">
                    <span>${escapeRaceHtml(t.name)}</span>
                    <span class="text-[9px] font-mono text-purple-200 bg-purple-950/80 px-1 rounded">LA +${Number(t.levelAdjustment) || 0}</span>
                    <button type="button" onclick="quickRemoveCharacterTemplate('${escapeRaceHtml(t.id)}')" class="text-purple-300 hover:text-rose-400 font-black ml-0.5 cursor-pointer" title="Remove ${escapeRaceHtml(t.name)}">✕</button>
                  </span>
                `).join('')}
              </div>
              <div class="flex items-center gap-2 text-[10px] font-mono">
                <span class="px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-amber-500/40 font-bold">Total LA: +${totalLa} • ECL: ${ecl}</span>
                <button type="button" onclick="openProfileEditModal('template')" class="text-purple-300 hover:text-white font-sans font-bold underline cursor-pointer">Manage ➔</button>
              </div>
            </div>
            ${pills.length > 0 ? `<div class="flex flex-wrap items-center gap-1.5 text-[10px] pt-1 border-t border-purple-900/40">${pills.join('')}</div>` : ''}
          `;
          tmplSummaryBar.classList.remove('hidden');
        } else {
          tmplSummaryBar.classList.add('hidden');
          tmplSummaryBar.innerHTML = '';
        }
      }

      const classesEl = document.getElementById('core-profile-classes');
      if (classesEl) classesEl.textContent = character.classes || "Unspecified";

      const hdEl = document.getElementById('core-profile-hd');
      if (hdEl) hdEl.textContent = character.hitDie || "-";

      const raceEl = document.getElementById('core-profile-race');
      if (raceEl) raceEl.textContent = character.race || "Unspecified";

      const alignEl = document.getElementById('core-profile-alignment');
      if (alignEl) alignEl.textContent = character.alignment || "-";

      const deityEl = document.getElementById('core-profile-deity');
      if (deityEl) deityEl.textContent = character.deity || "-";

      const sizeEl = document.getElementById('core-profile-size');
      const cleanSize = String(character.size || "Medium").replace(/\s*\(Orta\)\s*/i, '').trim() || "Medium";
      if (character.size && character.size !== cleanSize) character.size = cleanSize;
      if (sizeEl) sizeEl.textContent = cleanSize;

      const gaEl = document.getElementById('core-profile-gender-age');
      if (gaEl) gaEl.textContent = `${gender || 'Unspecified'}, ${character.age ? ('Age ' + character.age) : '-'}`;

      const hwEl = document.getElementById('core-profile-height-weight');
      if (hwEl) hwEl.textContent = `${character.height || '-'}, ${character.weight || '-'}`;
    }

    function populateProfileInputs() {
      if (!character) return;
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val !== undefined && val !== null ? val : '';
      };
      setVal('profile-edit-name', character.name || '');
      const curRace = character.race || 'Human';
      setVal('profile-edit-race', curRace);
      updateRaceSpotlightTrigger(curRace);
      setVal('profile-edit-alignment', character.alignment || '');
      updateAlignmentDropdownTrigger(character.alignment || '');
      setVal('profile-edit-deity', character.deity || '');
      updateDeitySpotlightTrigger(character.deity || '');
      const cleanSize = String(character.size || 'Medium').replace(/\s*\(Orta\)\s*/i, '').trim() || 'Medium';
      setVal('profile-edit-size', cleanSize);
      updateSizeDropdownTrigger(cleanSize);
      const rawGender = character.gender || '';
      const cleanGender = /^erkek$/i.test(String(rawGender).trim()) ? 'Male' : (/^kad[ıi]n$/i.test(String(rawGender).trim()) ? 'Female' : rawGender);
      setVal('profile-edit-gender', cleanGender);
      setVal('profile-edit-age', character.age || '');
      setVal('profile-edit-height', character.height || '');
      setVal('profile-edit-weight', character.weight || '');
      setVal('profile-edit-speed', character.baseSpeed || 30);

      updateProfileModalAvatar();
      applyPortraitSettings();
      applyWallpaperSettings();
      onProfileRaceChange(character.race || '');
      initModalTemplatesFromCharacter();
    }

    function openProfileEditModal(focusSection = 'identity') {
      openStatDistributionModal('identity');
      if (focusSection === 'template') {
        setTimeout(() => {
          const container = document.getElementById('template-custom-dropdown-container');
          if (container && typeof container.scrollIntoView === 'function') {
            container.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          if (typeof openTemplateSpotlightDropdown === 'function') {
            openTemplateSpotlightDropdown();
          }
        }, 60);
      }
    }

    function closeProfileEditModal() {
      closeStatDistributionModal();
    }

    function saveCharacterProfile() {
      saveStatDistribution();
    }

    // =========================================================================
    // 🧬 D&D 3.5E RAW SRD RACIAL SYSTEM (STANDART IRK ENTEGRASYONU)
    // =========================================================================
    function escapeRaceHtml(str) {
      return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function ensureCustomRacesLoaded() {
      try {
        const cachedRacesJson = localStorage.getItem('dnd35_custom_races');
        if (cachedRacesJson) {
          const cachedRaces = JSON.parse(cachedRacesJson);
          if (Array.isArray(cachedRaces)) {
            if (!window.BUNDLED_SRD_CORE_CATALOG) window.BUNDLED_SRD_CORE_CATALOG = [];
            const raceSel = document.getElementById('profile-edit-race');
            cachedRaces.forEach(r => {
              if (r && r.name) {
                if (!window.BUNDLED_SRD_CORE_CATALOG.some(c => c && c.name && c.name.toLowerCase() === r.name.toLowerCase())) {
                  window.BUNDLED_SRD_CORE_CATALOG.push(r);
                }
                if (raceSel && !Array.from(raceSel.options).some(o => o.value.toLowerCase() === r.name.toLowerCase())) {
                  const opt = document.createElement('option');
                  opt.value = r.name;
                  opt.textContent = `${r.name} (Custom / AI)`;
                  raceSel.appendChild(opt);
                }
              }
            });
          }
        }
      } catch (e) {
        console.warn('Failed to load custom races from storage:', e);
      }
    }

    function renderRaceAiSearchCard(card) {
      card.innerHTML = `
        <div class="space-y-2.5">
          <div class="flex items-center justify-between border-b border-purple-800/60 pb-1.5">
            <div class="flex items-center gap-1.5">
              <span class="text-sm">🔮</span>
              <span class="text-xs font-black text-purple-300 uppercase tracking-wide">Rule Master AI • Custom D&D 3.5e Race Lookup</span>
            </div>
            <span class="text-[9px] font-mono text-purple-400 bg-purple-950 px-1.5 py-0.2 rounded border border-purple-700/60">D&D 3.5e RAW</span>
          </div>
          <p class="text-[10px] text-slate-300 leading-relaxed">
            Search any official D&D 3.5e sourcebook (Eberron, Races of Stone, Races of the Wild, Monster Manual, etc.) and apply ability modifiers, size, speed, and racial traits directly to your character.
          </p>
          <div class="flex items-center gap-1.5">
            <input type="text" id="race-ai-search-input" placeholder="e.g., Warforged, Goliath, Drow, Catfolk, Thri-Kreen..." onkeydown="if(event.key==='Enter') searchRaceViaRuleMasterAi();" class="flex-1 bg-slate-900 border border-purple-500/60 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-bold focus:outline-none focus:border-purple-400">
            <button type="button" id="btn-fetch-race-ai" onclick="searchRaceViaRuleMasterAi()" class="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-extrabold text-xs rounded-lg shadow transition flex items-center gap-1 shrink-0 cursor-pointer">
              <span>🔮</span>
              <span>Rule Master AI</span>
            </button>
          </div>
          <div id="race-ai-status" class="hidden text-[10px] text-amber-300 font-mono flex items-center gap-1.5 pt-0.5"></div>
        </div>
      `;
      card.classList.remove('hidden');
      const input = document.getElementById('race-ai-search-input');
      if (input) setTimeout(() => input.focus(), 50);
    }

    function renderRaceNotFoundCard(card, raceName) {
      const escaped = escapeRaceHtml(raceName);
      card.innerHTML = `
        <div class="space-y-2">
          <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div class="flex items-center gap-1.5">
              <span class="text-sm">🔍</span>
              <span class="text-xs font-bold text-slate-200">"${escaped}" Not Found in Local Compendium</span>
            </div>
            <span class="text-[9px] font-mono text-purple-400 bg-purple-950 px-1.5 py-0.2 rounded border border-purple-700/60">Rule Master AI</span>
          </div>
          <p class="text-[10px] text-slate-400 leading-relaxed">
            Would you like to fetch this race from official D&D 3.5e sources (with ability modifiers, size, speed, and racial traits) via Rule Master AI?
          </p>
          <div class="flex items-center gap-2 pt-1">
            <button type="button" id="btn-fetch-race-ai" onclick="searchRaceViaRuleMasterAi('${escaped.replace(/'/g, "\\'")}')" class="flex-1 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 active:scale-95 text-white font-extrabold text-xs rounded-lg shadow transition flex items-center justify-center gap-1.5 cursor-pointer">
              <span>🔮</span>
              <span>Fetch "${escaped}" via Rule Master AI</span>
            </button>
          </div>
          <div id="race-ai-status" class="hidden text-[10px] text-amber-300 font-mono flex items-center gap-1.5 pt-0.5"></div>
        </div>
      `;
      card.classList.remove('hidden');
    }

    async function searchRaceViaRuleMasterAi(queryName = null) {
      let q = queryName;
      if (!q) {
        const aiInput = document.getElementById('race-ai-search-input');
        if (aiInput && aiInput.value.trim()) q = aiInput.value.trim();
      }
      if (!q) {
        const raceInput = document.getElementById('profile-edit-race');
        if (raceInput && raceInput.value.trim() && !raceInput.value.toLowerCase().includes('diğer') && !raceInput.value.toLowerCase().includes('other')) {
          q = raceInput.value.trim();
        }
      }
      if (!q) {
        const entered = prompt('Enter the name of the official D&D 3.5e race you want to search:\n(e.g., Warforged, Goliath, Drow, Catfolk, Thri-Kreen, Kenku)');
        if (entered && entered.trim()) {
          q = entered.trim();
        } else {
          const aiInput = document.getElementById('race-ai-search-input');
          if (aiInput) aiInput.focus();
          return;
        }
      }

      const statusEl = document.getElementById('race-ai-status');
      const btn = document.getElementById('btn-fetch-race-ai');
      if (btn) btn.disabled = true;
      if (statusEl) {
        statusEl.classList.remove('hidden');
        statusEl.innerHTML = `<span class="animate-spin">⚡</span> <span>🔮 Rule Master AI fetching D&D 3.5e RAW data for "${escapeRaceHtml(q)}"...</span>`;
      }

      try {
        let raceObj = null;
        if (typeof RuleMaster !== 'undefined' && typeof RuleMaster.fetchRaceViaAi === 'function') {
          raceObj = await RuleMaster.fetchRaceViaAi(q, statusEl);
        } else if (typeof RuleMaster !== 'undefined' && typeof RuleMaster.fetchSingleAiRuleObjects === 'function') {
          const key = RuleMaster.getApiKey();
          if (!key) {
            RuleMaster.promptApiKey();
            throw new Error('Gemini API key not configured.');
          }
          const results = await RuleMaster.fetchSingleAiRuleObjects(q, 'Race', key, statusEl);
          if (results && results.length) {
            raceObj = results.find(e => e && (e.type === 'Race' || String(e.type).toLowerCase() === 'race')) || results[0];
          }
        } else {
          throw new Error('Rule Master engine could not be loaded.');
        }

        if (!raceObj || !raceObj.name) {
          throw new Error(`No official D&D 3.5e racial data found for "${q}".`);
        }

        raceObj.type = 'Race';
        if (!raceObj.size) raceObj.size = 'Medium';
        if (!raceObj.baseSpeed) raceObj.baseSpeed = 30;
        if (!Array.isArray(raceObj.traits) && (raceObj.benefit || raceObj.description)) {
          raceObj.traits = [{ name: 'Racial Traits', desc: raceObj.benefit || raceObj.description }];
        }

        // Add to in-memory bundled catalog
        ensureCustomRacesLoaded();
        if (typeof window.BUNDLED_SRD_CORE_CATALOG !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) {
          const existingIdx = window.BUNDLED_SRD_CORE_CATALOG.findIndex(item => item && item.type === 'Race' && item.name.toLowerCase() === raceObj.name.toLowerCase());
          if (existingIdx >= 0) {
            window.BUNDLED_SRD_CORE_CATALOG[existingIdx] = raceObj;
          } else {
            window.BUNDLED_SRD_CORE_CATALOG.push(raceObj);
          }
        }

        // Cache in localStorage
        try {
          let customRaces = [];
          const existingSaved = localStorage.getItem('dnd35_custom_races');
          if (existingSaved) customRaces = JSON.parse(existingSaved) || [];
          const idx = customRaces.findIndex(r => r.name.toLowerCase() === raceObj.name.toLowerCase());
          if (idx >= 0) customRaces[idx] = raceObj;
          else customRaces.push(raceObj);
          localStorage.setItem('dnd35_custom_races', JSON.stringify(customRaces));
        } catch (e) {
          console.warn('Failed to cache race in localStorage:', e);
        }

        // Add option to select if not present
        const raceSel = document.getElementById('profile-edit-race');
        if (raceSel) {
          const hasOpt = Array.from(raceSel.options).some(o => o.value.toLowerCase() === raceObj.name.toLowerCase());
          if (!hasOpt) {
            const opt = document.createElement('option');
            opt.value = raceObj.name;
            opt.textContent = `${raceObj.name} (Rule Master AI)`;
            raceSel.appendChild(opt);
          }
          raceSel.value = raceObj.name;
        }

        // Set input value and update trigger
        const raceInput = document.getElementById('profile-edit-race');
        if (raceInput) raceInput.value = raceObj.name;
        updateRaceSpotlightTrigger(raceObj.name);

        // Render standard preview card
        onProfileRaceChange(raceObj.name);

        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: `Race Found: ${raceObj.name}!`,
            breakdown: `Successfully fetched from D&D 3.5e RAW compendium. Click "Apply Racial Traits" below to apply it to your character.`,
            icon: '🧬'
          });
        }
      } catch (err) {
        console.error(err);
        if (statusEl) {
          statusEl.classList.remove('hidden');
          statusEl.innerHTML = `<span class="text-rose-400">❌ ${escapeRaceHtml(err.message || 'An error occurred')}</span>`;
        } else {
          alert('Race lookup error: ' + err.message);
        }
      } finally {
        if (btn) btn.disabled = false;
      }
    }

    // =========================================================================
    // 🧬 SPOTLIGHT RACE SELECTOR & SEARCH COMBOBOX
    // =========================================================================
    const DND35_RACE_DEFINITIONS = [
      // 1. Standart D&D 3.5e RAW Irkları
      { name: 'Human', label: 'Human', category: 'Core D&D 3.5e RAW Races', icon: '👤', size: 'Medium', speed: 30, tags: ['core', 'bonus feat', 'flexible', 'insan'] },
      { name: 'Elf', label: 'Elf', category: 'Core D&D 3.5e RAW Races', icon: '🏹', size: 'Medium', speed: 30, tags: ['core', '+2 dex', '-2 con', 'sleep immunity'] },
      { name: 'Dwarf', label: 'Dwarf', category: 'Core D&D 3.5e RAW Races', icon: '🛡️', size: 'Medium', speed: 20, tags: ['core', '+2 con', '-2 cha', 'darkvision', 'cuce'] },
      { name: 'Halfling', label: 'Halfling', category: 'Core D&D 3.5e RAW Races', icon: '🍀', size: 'Small', speed: 20, tags: ['core', '+2 dex', '-2 str', 'luck', 'bucukluk'] },
      { name: 'Gnome', label: 'Gnome', category: 'Core D&D 3.5e RAW Races', icon: '🎩', size: 'Small', speed: 20, tags: ['core', '+2 con', '-2 str', 'illusion', 'gnom'] },
      { name: 'Half-Elf', label: 'Half-Elf', category: 'Core D&D 3.5e RAW Races', icon: '✨', size: 'Medium', speed: 30, tags: ['core', 'diplomat', 'adaptable', 'yari-elf'] },
      { name: 'Half-Orc', label: 'Half-Orc', category: 'Core D&D 3.5e RAW Races', icon: '⚔️', size: 'Medium', speed: 30, tags: ['core', '+2 str', '-2 int', 'darkvision', 'yari-ork'] },

      // 2. Genişletilmiş Resmi Irklar (SRD & Ek Kitaplar)
      { name: 'Aasimar', label: 'Aasimar (Planetouched)', category: 'Expanded Official Races', icon: '😇', size: 'Medium', speed: 30, tags: ['planetouched', '+2 wis', '+2 cha', 'daylight'] },
      { name: 'Tiefling', label: 'Tiefling (Planetouched)', category: 'Expanded Official Races', icon: '😈', size: 'Medium', speed: 30, tags: ['planetouched', '+2 dex', '+2 int', '-2 cha', 'darkness'] },
      { name: 'Dragonborn', label: 'Dragonborn of Bahamut', category: 'Expanded Official Races', icon: '🐲', size: 'Medium', speed: 30, tags: ['races of dragon', '+2 con', '-2 dex', 'breath', 'ejderha'] },
      { name: 'Drow', label: 'Drow (Dark Elf)', category: 'Expanded Official Races', icon: '🕷️', size: 'Medium', speed: 30, tags: ['underdark', '+2 dex', '+2 int', 'spell resistance', 'kara elf'] },
      { name: 'Orc', label: 'Orc', category: 'Expanded Official Races', icon: '🪓', size: 'Medium', speed: 30, tags: ['monster manual', '+4 str', 'darkvision', 'ork'] },
      { name: 'Goblin', label: 'Goblin', category: 'Expanded Official Races', icon: '👺', size: 'Small', speed: 30, tags: ['fast small', '+2 dex', '-2 str', 'stealth'] },
      { name: 'Kobold', label: 'Kobold', category: 'Expanded Official Races', icon: '🦎', size: 'Small', speed: 30, tags: ['dragonblood', '+2 dex', '+1 natural ac'] },
      { name: 'Goliath', label: 'Goliath (Races of Stone)', category: 'Expanded Official Races', icon: '⛰️', size: 'Medium', speed: 30, tags: ['races of stone', '+4 str', 'powerful build'] },
      { name: 'Warforged', label: 'Warforged (Eberron)', category: 'Expanded Official Races', icon: '🤖', size: 'Medium', speed: 30, tags: ['living construct', '+2 con', '-2 wis', '-2 cha', 'eberron'] }
    ];

    let _raceSpotlightOpen = false;

    function toggleRaceSpotlightDropdown() {
      if (_raceSpotlightOpen) closeRaceSpotlightDropdown();
      else openRaceSpotlightDropdown();
    }

    function openRaceSpotlightDropdown() {
      const dropdown = document.getElementById('race-spotlight-dropdown');
      const chevron = document.getElementById('race-trigger-chevron');
      const searchInput = document.getElementById('race-spotlight-search');
      if (!dropdown) return;

      dropdown.classList.remove('hidden');
      if (chevron) chevron.classList.add('rotate-180');
      _raceSpotlightOpen = true;

      const q = searchInput ? searchInput.value.trim() : '';
      renderRaceSpotlightItems(q);

      setTimeout(() => {
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }, 50);
    }

    function closeRaceSpotlightDropdown() {
      const dropdown = document.getElementById('race-spotlight-dropdown');
      const chevron = document.getElementById('race-trigger-chevron');
      if (!dropdown) return;

      dropdown.classList.add('hidden');
      if (chevron) chevron.classList.remove('rotate-180');
      _raceSpotlightOpen = false;
    }

    function onRaceSpotlightFilter(val) {
      const clearBtn = document.getElementById('race-spotlight-clear-btn');
      if (clearBtn) {
        if (val && val.trim()) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');
      }
      renderRaceSpotlightItems(val);
    }

    function clearRaceSpotlightFilter() {
      const searchInput = document.getElementById('race-spotlight-search');
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      onRaceSpotlightFilter('');
    }

    function onRaceSpotlightKeydown(e) {
      if (e.key === 'Escape') {
        closeRaceSpotlightDropdown();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const firstBtn = document.querySelector('#race-spotlight-list [data-race-name]');
        if (firstBtn) {
          const raceName = firstBtn.getAttribute('data-race-name');
          selectRaceItem(raceName);
        } else {
          const searchInput = document.getElementById('race-spotlight-search');
          if (searchInput && searchInput.value.trim()) {
            searchRaceViaRuleMasterAi(searchInput.value.trim());
            closeRaceSpotlightDropdown();
          }
        }
      }
    }

    function getAllRacesForSpotlight() {
      ensureCustomRacesLoaded();
      const list = [...DND35_RACE_DEFINITIONS];

      const catalog = (typeof window.BUNDLED_SRD_CORE_CATALOG !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG))
        ? window.BUNDLED_SRD_CORE_CATALOG
        : [];

      catalog.forEach(item => {
        if (item && item.type === 'Race' && !list.some(r => r.name.toLowerCase() === item.name.toLowerCase())) {
          list.push({
            name: item.name,
            label: `${item.name} (Custom / AI)`,
            category: 'Custom / AI-Added Races',
            icon: '🔮',
            size: item.size || 'Medium',
            speed: item.baseSpeed || 30,
            tags: ['custom', 'ai', item.name.toLowerCase()]
          });
        }
      });

      return list;
    }

    function renderRaceSpotlightItems(filterText = '') {
      const listEl = document.getElementById('race-spotlight-list');
      if (!listEl) return;

      const q = (filterText || '').toLowerCase().trim();
      const currentRace = (document.getElementById('profile-edit-race')?.value || character?.race || 'Human').toLowerCase();
      const allRaces = getAllRacesForSpotlight();

      const filtered = q
        ? allRaces.filter(r => {
            const matchName = r.name.toLowerCase().includes(q) || r.label.toLowerCase().includes(q);
            const matchCat = r.category.toLowerCase().includes(q);
            const matchTags = Array.isArray(r.tags) && r.tags.some(t => t.toLowerCase().includes(q));
            return matchName || matchCat || matchTags;
          })
        : allRaces;

      if (filtered.length === 0) {
        listEl.innerHTML = `
          <div class="p-3 text-center space-y-2 bg-purple-950/30 rounded-xl border border-purple-500/40 my-1">
            <span class="text-xl block">🔍</span>
            <div class="text-xs font-bold text-slate-200">"${escapeRaceHtml(filterText)}" not found in list</div>
            <p class="text-[10px] text-slate-400">You can search this race directly from official D&D 3.5e sourcebooks.</p>
            <button type="button" onclick="searchRaceViaRuleMasterAi('${escapeRaceHtml(filterText).replace(/'/g, "\\\'")}'); closeRaceSpotlightDropdown();" class="w-full py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-extrabold text-xs rounded-lg shadow transition flex items-center justify-center gap-1.5 cursor-pointer">
              <span>🔮</span>
              <span>Fetch "${escapeRaceHtml(filterText)}" via Rule Master AI</span>
            </button>
          </div>
        `;
        return;
      }

      const categories = {};
      filtered.forEach(r => {
        if (!categories[r.category]) categories[r.category] = [];
        categories[r.category].push(r);
      });

      let html = '';
      for (const [catName, items] of Object.entries(categories)) {
        html += `
          <div class="pt-1">
            <div class="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-400/90 flex items-center justify-between border-b border-purple-900/30 mb-1">
              <span>${catName}</span>
              <span class="text-[8px] font-mono text-slate-500">${items.length}</span>
            </div>
            <div class="space-y-0.5">
        `;

        items.forEach(r => {
          const isSelected = r.name.toLowerCase() === currentRace;
          const selectedClasses = isSelected
            ? 'bg-purple-900/60 border border-purple-500/80 text-white font-bold'
            : 'bg-slate-900/50 hover:bg-slate-800/80 border border-transparent hover:border-purple-500/30 text-slate-200';

          html += `
            <button type="button" data-race-name="${escapeRaceHtml(r.name)}" onclick="selectRaceItem('${escapeRaceHtml(r.name).replace(/'/g, "\\'")}')" class="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer group active:scale-[0.99] ${selectedClasses}">
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-sm shrink-0">${r.icon || '🧬'}</span>
                <div class="truncate">
                  <div class="text-xs font-bold flex items-center gap-1.5">
                    <span class="truncate">${r.label || r.name}</span>
                    ${isSelected ? '<span class="text-[9px] px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-700 font-mono">Selected</span>' : ''}
                  </div>
                  <div class="text-[9px] text-slate-400 font-mono truncate">
                    ${r.size || 'Medium'} Size • ${r.speed || 30} ft Speed
                  </div>
                </div>
              </div>
              <span class="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">➔</span>
            </button>
          `;
        });

        html += `
            </div>
          </div>
        `;
      }

      if (!q || 'diğer'.includes(q) || 'ai'.includes(q) || 'rule master'.includes(q)) {
        html += `
          <div class="pt-1 border-t border-purple-900/40 mt-1">
            <button type="button" onclick="selectRaceItem('Diğer')" class="w-full text-left px-2.5 py-2 rounded-lg bg-gradient-to-r from-purple-950/70 to-indigo-950/70 hover:from-purple-900/80 hover:to-indigo-900/80 border border-purple-500/40 hover:border-purple-400 text-purple-200 flex items-center justify-between transition cursor-pointer group active:scale-[0.99]">
              <div class="flex items-center gap-2">
                <span class="text-base shrink-0">🔮</span>
                <div>
                  <div class="text-xs font-bold text-purple-200 group-hover:text-white">Other (Search Custom Race via Rule Master AI...)</div>
                  <div class="text-[9px] text-purple-400/80 font-mono">Official D&D 3.5e races such as Thri-Kreen, Catfolk, Illumian, etc.</div>
                </div>
              </div>
              <span class="text-xs text-purple-300 font-bold group-hover:translate-x-0.5 transition-transform">➔</span>
            </button>
          </div>
        `;
      }

      listEl.innerHTML = html;
    }

    function selectRaceItem(raceName) {
      updateRaceSpotlightTrigger(raceName);
      closeRaceSpotlightDropdown();

      const hiddenInput = document.getElementById('profile-edit-race');
      if (hiddenInput) hiddenInput.value = raceName;

      updateProfileModalAvatar();
      onProfileRaceChange(raceName);
    }

    function updateRaceSpotlightTrigger(raceName) {
      const labelEl = document.getElementById('race-trigger-label');
      const iconEl = document.getElementById('race-trigger-icon');
      const hiddenInput = document.getElementById('profile-edit-race');
      if (hiddenInput) hiddenInput.value = raceName;

      const all = getAllRacesForSpotlight();
      const found = all.find(r => r.name.toLowerCase() === (raceName || '').toLowerCase());

      if (found) {
        if (labelEl) labelEl.textContent = found.label || found.name;
        if (iconEl) iconEl.textContent = found.icon || '🧬';
      } else if (raceName && (raceName.toLowerCase().includes('diğer') || raceName.toLowerCase().includes('other'))) {
        if (labelEl) labelEl.textContent = '🔮 Other (Rule Master AI)';
        if (iconEl) iconEl.textContent = '🔮';
      } else {
        if (labelEl) labelEl.textContent = raceName || 'Human';
        if (iconEl) iconEl.textContent = '👤';
      }
    }

    // =========================================================================
    // 🧬 D&D 3.5E CHARACTER TEMPLATES SPOTLIGHT ENGINE (`srd_templates.json`)
    // =========================================================================
    let _templateSpotlightOpen = false;
    let _modalSelectedTemplates = [];

    function getAllTemplatesForSpotlight() {
      if (typeof window !== 'undefined' && window.SrdCompendium && typeof window.SrdCompendium.getAllTemplates === 'function') {
        return window.SrdCompendium.getAllTemplates();
      }
      const catalog = (typeof window.BUNDLED_SRD_CORE_CATALOG !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG))
        ? window.BUNDLED_SRD_CORE_CATALOG
        : [];
      return catalog.filter(item => item && item.type === 'Template');
    }

    function resolveTemplateEntry(idOrName) {
      if (!idOrName) return null;
      if (typeof window !== 'undefined' && window.SrdCompendium && typeof window.SrdCompendium.getTemplate === 'function') {
        const found = window.SrdCompendium.getTemplate(idOrName);
        if (found) return found;
      }
      if (typeof RuleEngine !== 'undefined' && typeof RuleEngine.getMasterDbEntry === 'function') {
        return RuleEngine.getMasterDbEntry(idOrName, 'Template');
      }
      return null;
    }

    function initModalTemplatesFromCharacter() {
      const activeEntries = (typeof RuleEngine !== 'undefined' && typeof RuleEngine.getCharacterActiveTemplateEntries === 'function')
        ? RuleEngine.getCharacterActiveTemplateEntries(character)
        : [];
      _modalSelectedTemplates = activeEntries.map(t => t.id || t.name).filter(Boolean);
      updateTemplateSpotlightTrigger();
      renderModalTemplateTraitsCard();
    }

    function formatTemplateModifierPills(tmpl) {
      if (!tmpl) return [];
      const pills = [];
      if (Array.isArray(tmpl.modifiers)) {
        tmpl.modifiers.forEach(m => {
          if (!m || !m.target) return;
          const t = String(m.target).toLowerCase();
          const val = Number(m.value) || 0;
          if (t.startsWith('ability.') || ['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(t)) {
            if (val === 0) return;
            const stat = t.replace('ability.', '').toUpperCase();
            const cond = m.condition ? ` (${m.condition})` : '';
            pills.push(`${val > 0 ? '+' : ''}${val} ${stat}${cond}`);
          } else if (t === 'ac.natural' || t === 'natural') {
            if (val !== 0) pills.push(`${val > 0 ? '+' : ''}${val} Nat AC`);
          } else if (t === 'ac.deflection') {
            pills.push(`Defl AC = ${m.formula && String(m.formula).includes('@chaMod') ? 'CHA Mod' : `+${val}`}`);
          } else if (t === 'ac.dodge' && val > 0) {
            pills.push(`+${val} ${m.type ? (m.type.charAt(0).toUpperCase() + m.type.slice(1) + ' ') : ''}AC`);
          } else if (t === 'save.all' && val > 0) {
            pills.push(`+${val} All Saves`);
          } else if (t === 'attack.all' && val > 0) {
            pills.push(`+${val} Attack`);
          } else if (t === 'speed.land' && val > 0) {
            pills.push(`+${val} ft. Speed`);
          } else if (t === 'powerpoints' && val > 0) {
            pills.push(`+${val} PP`);
          }
        });
      }
      if (tmpl.dr) pills.push(`DR ${tmpl.dr}`);
      if (tmpl.sr) pills.push(`SR ${String(tmpl.sr).includes('@level') ? tmpl.sr.replace('@level', 'HD') : tmpl.sr}`);
      if (Number(tmpl.fastHealing) > 0) pills.push(`Fast Healing ${tmpl.fastHealing}`);
      if (Number(tmpl.turnResistance) > 0) pills.push(`Turn Res +${tmpl.turnResistance}`);
      return pills;
    }

    function updateTemplateSpotlightTrigger() {
      const labelEl = document.getElementById('template-trigger-label');
      const badgeEl = document.getElementById('template-active-summary-badge');
      const entries = _modalSelectedTemplates.map(id => resolveTemplateEntry(id)).filter(Boolean);
      const totalLa = entries.reduce((acc, t) => acc + (Number(t.levelAdjustment) || 0), 0);
      const charLevel = (character?.levelProgression || []).filter(p => p.active !== false).length || Number(character?.level) || 1;
      const ecl = charLevel + totalLa;

      if (entries.length > 0) {
        if (labelEl) {
          labelEl.textContent = `${entries.map(t => t.name).join(' + ')} (Click to add/remove templates)`;
          labelEl.className = 'text-xs truncate text-purple-200 font-extrabold';
        }
        if (badgeEl) {
          badgeEl.textContent = `${entries.length} Active • LA +${totalLa} • ECL ${ecl}`;
          badgeEl.className = 'text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-200 border border-purple-500/70';
        }
      } else {
        if (labelEl) {
          labelEl.textContent = 'Add or Manage D&D 3.5e Templates (Half-Dragon, Half-Celestial, Lich, Vampire, Lycanthrope...)';
          labelEl.className = 'text-xs truncate text-slate-300';
        }
        if (badgeEl) {
          badgeEl.textContent = 'No Template (LA +0)';
          badgeEl.className = 'text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800';
        }
      }
    }

    function toggleTemplateSpotlightDropdown() {
      if (_templateSpotlightOpen) closeTemplateSpotlightDropdown();
      else openTemplateSpotlightDropdown();
    }

    function openTemplateSpotlightDropdown() {
      const dropdown = document.getElementById('template-spotlight-dropdown');
      const chevron = document.getElementById('template-trigger-chevron');
      const searchInput = document.getElementById('template-spotlight-search');
      if (!dropdown) return;
      _templateSpotlightOpen = true;
      dropdown.classList.remove('hidden');
      if (chevron) chevron.style.transform = 'rotate(180deg)';
      renderTemplateSpotlightItems();
      setTimeout(() => {
        if (searchInput) searchInput.focus();
      }, 25);
    }

    function closeTemplateSpotlightDropdown() {
      const dropdown = document.getElementById('template-spotlight-dropdown');
      const chevron = document.getElementById('template-trigger-chevron');
      _templateSpotlightOpen = false;
      if (dropdown) dropdown.classList.add('hidden');
      if (chevron) chevron.style.transform = 'rotate(0deg)';
    }

    function onTemplateSpotlightFilter(query) {
      const clearBtn = document.getElementById('template-spotlight-clear-btn');
      if (clearBtn) {
        if (query && query.trim().length > 0) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');
      }
      renderTemplateSpotlightItems();
    }

    function clearTemplateSpotlightFilter() {
      const searchInput = document.getElementById('template-spotlight-search');
      const clearBtn = document.getElementById('template-spotlight-clear-btn');
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      if (clearBtn) clearBtn.classList.add('hidden');
      renderTemplateSpotlightItems();
    }

    function renderTemplateSpotlightItems() {
      const listEl = document.getElementById('template-spotlight-list');
      if (!listEl) return;
      const query = (document.getElementById('template-spotlight-search')?.value || '').toLowerCase().trim();
      const catFilter = (document.getElementById('template-spotlight-cat-filter')?.value || 'all').toLowerCase();

      const allTemplates = getAllTemplatesForSpotlight();
      const filtered = allTemplates.filter(t => {
        if (!t) return false;
        const tags = Array.isArray(t.tags) ? t.tags.map(x => String(x).toLowerCase()) : [];
        const cat = String(t.category || '').toLowerCase();
        if (catFilter === 'inherited' && !cat.includes('inherited')) return false;
        if (catFilter === 'acquired' && !cat.includes('acquired')) return false;
        if (catFilter === 'lycanthrope' && !tags.includes('lycanthrope')) return false;
        if (catFilter === 'epic' && !tags.includes('epic') && !tags.includes('psionic') && !tags.includes('planar') && !tags.includes('shadow') && !tags.includes('divine')) return false;

        if (!query) return true;
        const hay = `${t.name} ${t.category || ''} ${t.source || ''} ${t.shortDescription || ''} ${tags.join(' ')}`.toLowerCase();
        return hay.includes(query);
      });

      if (filtered.length === 0) {
        listEl.innerHTML = `<div class="p-3 text-center text-slate-400 italic">No matching D&amp;D 3.5e templates found for "${escapeRaceHtml(query)}".</div>`;
        return;
      }

      const selectedSet = new Set(_modalSelectedTemplates.map(x => String(x).toLowerCase()));
      listEl.innerHTML = filtered.map(t => {
        const isSelected = selectedSet.has(String(t.id).toLowerCase()) || selectedSet.has(String(t.name).toLowerCase());
        const pills = formatTemplateModifierPills(t).slice(0, 6);
        const la = Number(t.levelAdjustment) || 0;
        const cr = Number(t.crIncrease) || 0;
        const acq = t.templateAcquisition || (String(t.category || '').includes('Inherited') ? 'Inherited' : 'Acquired');

        return `
          <button type="button" onclick="toggleModalTemplateItem('${escapeRaceHtml(t.id)}')" class="w-full text-left p-2 rounded-lg border transition flex flex-col gap-1 cursor-pointer ${isSelected ? 'bg-purple-950/80 border-purple-400 text-white shadow-md' : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-purple-500/50 text-slate-200'}">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="text-sm shrink-0">${isSelected ? '✅' : '🧬'}</span>
                <span class="font-extrabold text-xs truncate ${isSelected ? 'text-purple-200' : 'text-white'}">${escapeRaceHtml(t.name)}</span>
                <span class="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-950 text-slate-300 border border-slate-700 shrink-0">${escapeRaceHtml(acq)}</span>
              </div>
              <div class="flex items-center gap-1 shrink-0 font-mono text-[10px]">
                <span class="px-1.5 py-0.5 rounded bg-purple-950 text-purple-200 border border-purple-600/60 font-bold">LA +${la}</span>
                ${cr > 0 ? `<span class="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60 font-bold">CR +${cr}</span>` : ''}
              </div>
            </div>
            ${pills.length > 0 ? `<div class="flex flex-wrap items-center gap-1 text-[10px] font-mono">${pills.map(p => `<span class="px-1.5 py-0.2 rounded bg-slate-950/90 text-emerald-300 border border-slate-800">${escapeRaceHtml(p)}</span>`).join('')}</div>` : ''}
            <div class="text-[10px] text-slate-400 line-clamp-1">${escapeRaceHtml(t.shortDescription || '')}</div>
          </button>
        `;
      }).join('');
    }

    function toggleModalTemplateItem(templateId) {
      if (!templateId) return;
      const idx = _modalSelectedTemplates.findIndex(x => String(x).toLowerCase() === String(templateId).toLowerCase());
      if (idx >= 0) {
        _modalSelectedTemplates.splice(idx, 1);
      } else {
        _modalSelectedTemplates.push(templateId);
      }
      updateTemplateSpotlightTrigger();
      renderTemplateSpotlightItems();
      renderModalTemplateTraitsCard();
      renderStatDistPreviewRow();
    }

    function removeModalTemplateItem(templateId) {
      _modalSelectedTemplates = _modalSelectedTemplates.filter(x => String(x).toLowerCase() !== String(templateId).toLowerCase());
      updateTemplateSpotlightTrigger();
      renderTemplateSpotlightItems();
      renderModalTemplateTraitsCard();
      renderStatDistPreviewRow();
    }

    function clearAllModalTemplates() {
      _modalSelectedTemplates = [];
      updateTemplateSpotlightTrigger();
      renderTemplateSpotlightItems();
      renderModalTemplateTraitsCard();
      renderStatDistPreviewRow();
    }

    function renderModalTemplateTraitsCard() {
      const cardEl = document.getElementById('profile-template-traits-card');
      if (!cardEl) return;
      const entries = _modalSelectedTemplates.map(id => resolveTemplateEntry(id)).filter(Boolean);
      if (entries.length === 0) {
        cardEl.classList.add('hidden');
        cardEl.innerHTML = '';
        return;
      }

      cardEl.classList.remove('hidden');
      cardEl.innerHTML = entries.map(t => {
        const pills = formatTemplateModifierPills(t);
        const la = Number(t.levelAdjustment) || 0;
        const cr = Number(t.crIncrease) || 0;
        const imm = Array.isArray(t.immunities) && t.immunities.length > 0 ? t.immunities.join(', ') : '';
        const res = Array.isArray(t.resistances) && t.resistances.length > 0 ? t.resistances.join(', ') : '';
        const vis = Array.isArray(t.vision) && t.vision.length > 0 ? t.vision.join(', ') : '';
        const attacks = Array.isArray(t.specialAttacks) ? t.specialAttacks : [];
        const qualities = Array.isArray(t.specialQualities) ? t.specialQualities : [];
        const feats = Array.isArray(t.bonusFeats) ? t.bonusFeats : [];

        return `
          <div class="bg-slate-900/95 border border-purple-500/50 rounded-xl p-2.5 space-y-2 shadow">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-sm">🧬</span>
                <span class="font-extrabold text-white text-xs">${escapeRaceHtml(t.name)}</span>
                <span class="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-200 border border-purple-700/60 font-mono font-bold">LA +${la}</span>
                ${cr > 0 ? `<span class="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700/60 font-mono font-bold">CR +${cr}</span>` : ''}
                ${t.creatureType ? `<span class="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-semibold">${escapeRaceHtml(t.creatureType)}</span>` : ''}
                <span class="text-[10px] text-slate-400 font-mono">(${escapeRaceHtml(t.source || 'SRD 3.5e')})</span>
              </div>
              <button type="button" onclick="removeModalTemplateItem('${escapeRaceHtml(t.id)}')" class="px-2 py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-700/60 text-[10px] font-bold transition cursor-pointer">✕ Remove</button>
            </div>

            ${pills.length > 0 ? `
              <div class="flex flex-wrap items-center gap-1 text-[10px] font-mono">
                ${pills.map(p => `<span class="px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-700/50 font-bold">${escapeRaceHtml(p)}</span>`).join('')}
              </div>
            ` : ''}

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-300">
              ${vis ? `<div class="bg-slate-950/70 px-2 py-1 rounded border border-slate-800"><strong class="text-sky-300">Senses:</strong> ${escapeRaceHtml(vis)}</div>` : ''}
              ${imm ? `<div class="bg-slate-950/70 px-2 py-1 rounded border border-slate-800"><strong class="text-amber-300">Immunities:</strong> ${escapeRaceHtml(imm)}</div>` : ''}
              ${res ? `<div class="bg-slate-950/70 px-2 py-1 rounded border border-slate-800"><strong class="text-teal-300">Resistances:</strong> ${escapeRaceHtml(res)}</div>` : ''}
              ${feats.length > 0 ? `<div class="bg-slate-950/70 px-2 py-1 rounded border border-slate-800"><strong class="text-purple-300">Bonus Feats:</strong> ${escapeRaceHtml(feats.join(', '))}</div>` : ''}
            </div>

            ${attacks.length > 0 ? `
              <div class="text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 space-y-0.5">
                <div class="text-[10px] font-bold text-rose-300 uppercase">⚔️ Special Attacks &amp; Breath Weapon</div>
                ${attacks.map(a => `<div class="text-[11px] text-slate-200">• ${escapeRaceHtml(a)}</div>`).join('')}
              </div>
            ` : ''}

            ${qualities.length > 0 ? `
              <div class="text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 space-y-0.5">
                <div class="text-[10px] font-bold text-indigo-300 uppercase">🛡️ Special Qualities</div>
                ${qualities.map(q => `<div class="text-[11px] text-slate-200">• ${escapeRaceHtml(q)}</div>`).join('')}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    }

    function syncCharacterTemplateAbilities() {
      if (!character) return;
      if (!Array.isArray(character.specialAbilities)) character.specialAbilities = [];

      // Remove old template-granted traits
      character.specialAbilities = character.specialAbilities.filter(a => {
        if (!a || typeof a !== 'object') return true;
        if (a.isTemplateTrait) return false;
        const src = String(a.source || '').toLowerCase();
        return !src.endsWith('template');
      });

      const activeEntries = (typeof RuleEngine !== 'undefined' && typeof RuleEngine.getCharacterActiveTemplateEntries === 'function')
        ? RuleEngine.getCharacterActiveTemplateEntries(character)
        : [];

      activeEntries.forEach(t => {
        if (!t) return;
        const srcLabel = `${t.name} Template`;
        const traitsToPush = [
          ...(Array.isArray(t.specialAttacks) ? t.specialAttacks.map(sa => ({ text: sa, action: 'Standard / Attack' })) : []),
          ...(Array.isArray(t.specialQualities) ? t.specialQualities.map(sq => ({ text: sq, action: 'Passive' })) : [])
        ];
        traitsToPush.forEach(item => {
          const rawText = String(item.text || '').trim();
          if (!rawText) return;
          const shortTitle = rawText.split('(')[0].trim() || rawText;
          const fullTitle = `${shortTitle} (${t.name})`;
          const exists = character.specialAbilities.some(a => {
            const an = String(typeof a === 'string' ? a : (a.name || '')).toLowerCase();
            return an === fullTitle.toLowerCase();
          });
          if (!exists) {
            character.specialAbilities.push({
              name: fullTitle,
              source: srcLabel,
              category: 'Special Ability',
              benefit: rawText,
              action: item.action,
              duration: 'Continuous',
              active: true,
              isTemplateTrait: true,
              templateId: t.id
            });
          }
        });
      });
    }

    function quickRemoveCharacterTemplate(templateId) {
      if (!character || !templateId) return;
      const tmpl = resolveTemplateEntry(templateId);
      character.templates = (Array.isArray(character.templates) ? character.templates : []).filter(t => {
        const id = typeof t === 'object' ? (t.id || t.name) : t;
        return String(id).toLowerCase() !== String(templateId).toLowerCase() &&
               (!tmpl || String(id).toLowerCase() !== String(tmpl.name).toLowerCase());
      });
      syncCharacterTemplateAbilities();
      saveStateToStorage(true);
      renderAll();
      if (typeof showDiceTopToast === 'function') {
        showDiceTopToast({
          icon: '🧬',
          title: `Template Removed: ${tmpl ? tmpl.name : templateId}`,
          breakdown: 'All ability, AC, DR, SR, and skill modifiers have been recalculated by the rule engine.'
        });
      }
    }

    document.addEventListener('click', (e) => {
      const container = document.getElementById('race-custom-dropdown-container');
      const raceDropdown = document.getElementById('race-spotlight-dropdown');
      if (_raceSpotlightOpen && container && !container.contains(e.target) && (!raceDropdown || !raceDropdown.contains(e.target))) {
        closeRaceSpotlightDropdown();
      }
      const tmplContainer = document.getElementById('template-custom-dropdown-container');
      const tmplDropdown = document.getElementById('template-spotlight-dropdown');
      if (_templateSpotlightOpen && tmplContainer && !tmplContainer.contains(e.target) && (!tmplDropdown || !tmplDropdown.contains(e.target))) {
        closeTemplateSpotlightDropdown();
      }
      const deityContainer = document.getElementById('deity-custom-dropdown-container');
      const deityDropdown = document.getElementById('deity-spotlight-dropdown');
      if (_deitySpotlightOpen && deityContainer && !deityContainer.contains(e.target) && (!deityDropdown || !deityDropdown.contains(e.target))) {
        closeDeitySpotlightDropdown();
      }
      const alignContainer = document.getElementById('alignment-custom-dropdown-container');
      const alignDropdown = document.getElementById('alignment-custom-dropdown');
      if (_alignmentDropdownOpen && alignContainer && !alignContainer.contains(e.target) && (!alignDropdown || !alignDropdown.contains(e.target))) {
        closeAlignmentDropdown();
      }
      const sizeContainer = document.getElementById('size-custom-dropdown-container');
      if (_sizeDropdownOpen && sizeContainer && !sizeContainer.contains(e.target)) {
        closeSizeDropdown();
      }
      const lvlupClassContainer = document.getElementById('lvlup-class-custom-dropdown-container');
      if (_lvlupClassSpotlightOpen && lvlupClassContainer && !lvlupClassContainer.contains(e.target)) {
        closeLevelUpClassSpotlightDropdown();
      }
      const domainSpotlightModal = document.getElementById('modal-domain-field-spotlight');
      if (domainSpotlightModal && !domainSpotlightModal.classList.contains('hidden') && e.target === domainSpotlightModal) {
        closeDomainFieldSpotlight();
      }
    });

    // =========================================================================
    // =========================================================================
    // 📏 SPOTLIGHT & SYMBOL SIZE SELECTOR
    // =========================================================================
    const DND35_SIZE_DEFINITIONS = [
      { id: 'Fine', label: 'Fine', icon: '🔬', acMod: '+8 AC/Atk', hideMod: '+16 Hide', space: '0.5 ft', desc: 'Fly, insect, or microscopic creatures' },
      { id: 'Diminutive', label: 'Diminutive', icon: '🤏', acMod: '+4 AC/Atk', hideMod: '+12 Hide', space: '1 ft', desc: 'Toad, rat, tiny birds' },
      { id: 'Tiny', label: 'Tiny', icon: '🐾', acMod: '+2 AC/Atk', hideMod: '+8 Hide', space: '2.5 ft', desc: 'Cat, weasel, hawk, viper' },
      { id: 'Small', label: 'Small', icon: '🍄', acMod: '+1 AC/Atk', hideMod: '+4 Hide', space: '5 ft', desc: 'Halfling, Gnome, Kobold, Goblin' },
      { id: 'Medium', label: 'Medium', icon: '👤', acMod: '0 AC/Atk', hideMod: '0 Hide', space: '5 ft', desc: 'Human, Elf, Dwarf, Orc (Standard)' },
      { id: 'Large', label: 'Large', icon: '🦍', acMod: '-1 AC/Atk', hideMod: '-4 Hide', space: '10 ft', desc: 'Ogre, Troll, Horse, Centaur, Minotaur' },
      { id: 'Huge', label: 'Huge', icon: '🐘', acMod: '-2 AC/Atk', hideMod: '-8 Hide', space: '15 ft', desc: 'Giants, Treant, Elephant, Adult Dragons' },
      { id: 'Gargantuan', label: 'Gargantuan', icon: '🌋', acMod: '-4 AC/Atk', hideMod: '-12 Hide', space: '20 ft', desc: 'Wyrm Dragons, Kraken, Purple Worm' },
      { id: 'Colossal', label: 'Colossal', icon: '🪐', acMod: '-8 AC/Atk', hideMod: '-16 Hide', space: '30 ft', desc: 'Tarrasque, Great Wyrm Dragons' }
    ];

    let _sizeDropdownOpen = false;

    function toggleSizeDropdown() {
      if (_sizeDropdownOpen) closeSizeDropdown();
      else openSizeDropdown();
    }

    function openSizeDropdown() {
      const dropdown = document.getElementById('size-custom-dropdown');
      const chevron = document.getElementById('size-trigger-chevron');
      if (!dropdown) return;

      if (dropdown.parentElement !== document.body) {
        document.body.appendChild(dropdown);
      }

      dropdown.classList.remove('hidden');
      dropdown.style.display = 'flex';
      if (chevron) chevron.classList.add('rotate-180');
      _sizeDropdownOpen = true;

      renderSizeItems();
    }

    function closeSizeDropdown() {
      const dropdown = document.getElementById('size-custom-dropdown');
      const chevron = document.getElementById('size-trigger-chevron');
      if (!dropdown) return;

      dropdown.classList.add('hidden');
      dropdown.style.display = 'none';
      if (chevron) chevron.classList.remove('rotate-180');
      _sizeDropdownOpen = false;
    }

    function renderSizeItems() {
      const listEl = document.getElementById('size-options-list');
      if (!listEl) return;

      const currentVal = (document.getElementById('profile-edit-size')?.value || character?.size || 'Medium').toLowerCase();

      let html = '';
      DND35_SIZE_DEFINITIONS.forEach(s => {
        const isSelected = s.id.toLowerCase() === currentVal;
        const selectedClasses = isSelected
          ? 'bg-purple-900/60 border border-purple-500/80 text-white font-bold'
          : 'bg-slate-900/50 hover:bg-slate-800/80 border border-transparent hover:border-purple-500/30 text-slate-200';

        html += `
          <button type="button" onclick="selectSizeItem('${s.id}')" class="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer group active:scale-[0.99] ${selectedClasses}">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-sm shrink-0">${s.icon}</span>
              <div class="truncate">
                <div class="text-xs font-bold flex items-center gap-1.5">
                  <span class="truncate">${s.label}</span>
                  ${isSelected ? '<span class="text-[9px] px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-700 font-mono">Selected</span>' : ''}
                </div>
                <div class="text-[9px] text-purple-300/80 font-mono truncate">
                  ${s.acMod} • ${s.hideMod} • Space: ${s.space}
                </div>
              </div>
            </div>
            <span class="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">➔</span>
          </button>
        `;
      });

      listEl.innerHTML = html;
    }

    function selectSizeItem(sizeId) {
      updateSizeDropdownTrigger(sizeId);
      closeSizeDropdown();

      const hiddenInput = document.getElementById('profile-edit-size');
      if (hiddenInput) hiddenInput.value = sizeId;
    }

    function updateSizeDropdownTrigger(sizeId) {
      const labelEl = document.getElementById('size-trigger-label');
      const iconEl = document.getElementById('size-trigger-icon');
      const hiddenInput = document.getElementById('profile-edit-size');
      if (hiddenInput) hiddenInput.value = sizeId || 'Medium';

      const found = DND35_SIZE_DEFINITIONS.find(s => s.id.toLowerCase() === (sizeId || 'medium').toLowerCase());
      if (found) {
        if (labelEl) labelEl.textContent = found.label;
        if (iconEl) iconEl.textContent = found.icon;
      } else if (sizeId) {
        if (labelEl) labelEl.textContent = sizeId;
        if (iconEl) iconEl.textContent = '👤';
      } else {
        if (labelEl) labelEl.textContent = 'Medium';
        if (iconEl) iconEl.textContent = '👤';
      }
    }

    // =========================================================================
    // ⚖️ SPOTLIGHT & SYMBOL ALIGNMENT SELECTOR (3x3 RAW Interactive Matrix)
    // =========================================================================
    const DND35_ALIGNMENT_DEFINITIONS = [
      // Row 1 (Good):
      { id: 'Lawful Good', label: 'Lawful Good', archetype: 'Crusader', shortCode: 'LG', category: 'Good Alignment Axis', icon: '⚖️', axis: 'Law & Good', desc: 'Honor, justice, righteousness, and protecting the innocent (Paladin)' },
      { id: 'Neutral Good', label: 'Neutral Good', archetype: 'Benefactor', shortCode: 'NG', category: 'Good Alignment Axis', icon: '🕊️', axis: 'Pure Good', desc: 'Compassion, altruism, and helping others without bias' },
      { id: 'Chaotic Good', label: 'Chaotic Good', archetype: 'Rebel', shortCode: 'CG', category: 'Good Alignment Axis', icon: '🏹', axis: 'Freedom & Good', desc: 'Conscience, individual liberty, and kindness above laws' },

      // Row 2 (Neutral):
      { id: 'Lawful Neutral', label: 'Lawful Neutral', archetype: 'Judge', shortCode: 'LN', category: 'Neutral Alignment Axis', icon: '📜', axis: 'Pure Order', desc: 'Rule of law, tradition, discipline, and authority (Monk)' },
      { id: 'True Neutral', label: 'True Neutral', archetype: 'Undecided', shortCode: 'TN', category: 'Neutral Alignment Axis', icon: '☯️', axis: 'Cosmic Balance', desc: 'Natural balance, impartiality, and pragmatism (Druid)' },
      { id: 'Chaotic Neutral', label: 'Chaotic Neutral', archetype: 'Free Spirit', shortCode: 'CN', category: 'Neutral Alignment Axis', icon: '🎭', axis: 'Pure Freedom', desc: "Individualism and following one's own whims (Bard)" },

      // Row 3 (Evil):
      { id: 'Lawful Evil', label: 'Lawful Evil', archetype: 'Dominator', shortCode: 'LE', category: 'Evil Alignment Axis', icon: '⛓️', axis: 'Order & Evil', desc: 'Tyranny, strict hierarchy, and methodical rule' },
      { id: 'Neutral Evil', label: 'Neutral Evil', archetype: 'Malefactor', shortCode: 'NE', category: 'Evil Alignment Axis', icon: '💀', axis: 'Pure Selfishness', desc: 'Unadulterated malice, greed, and self-serving ambition' },
      { id: 'Chaotic Evil', label: 'Chaotic Evil', archetype: 'Destroyer', shortCode: 'CE', category: 'Evil Alignment Axis', icon: '🩸', axis: 'Chaos & Destruction', desc: 'Savagery, slaughter, and ruthless destruction' }
    ];

    let _alignmentDropdownOpen = false;

    function toggleAlignmentDropdown() {
      if (_alignmentDropdownOpen) closeAlignmentDropdown();
      else openAlignmentDropdown();
    }

    function openAlignmentDropdown() {
      const dropdown = document.getElementById('alignment-custom-dropdown');
      const chevron = document.getElementById('alignment-trigger-chevron');
      if (!dropdown) return;

      if (dropdown.parentElement !== document.body) {
        document.body.appendChild(dropdown);
      }

      dropdown.classList.remove('hidden');
      dropdown.style.display = 'flex';
      if (chevron) chevron.classList.add('rotate-180');
      _alignmentDropdownOpen = true;

      renderAlignmentItems();
    }

    function closeAlignmentDropdown() {
      const dropdown = document.getElementById('alignment-custom-dropdown');
      const chevron = document.getElementById('alignment-trigger-chevron');
      if (!dropdown) return;

      dropdown.classList.add('hidden');
      dropdown.style.display = 'none';
      if (chevron) chevron.classList.remove('rotate-180');
      _alignmentDropdownOpen = false;
    }

    function onAlignmentFilter(val) {
      renderAlignmentItems(val);
    }

    function clearAlignmentFilter() {
      renderAlignmentItems('');
    }

    function renderAlignmentItems(filterText = '') {
      const listEl = document.getElementById('alignment-options-list');
      if (!listEl) return;

      const currentVal = (document.getElementById('profile-edit-alignment')?.value || character?.alignment || '').toLowerCase();
      const deityMeta = typeof getCharacterDeityMeta === 'function' ? getCharacterDeityMeta() : null;
      const isClericChar = typeof hasClericDomainCapability === 'function' ? hasClericDomainCapability(character) : false;

      let html = '<div class="grid grid-cols-3 gap-2.5 p-1">';

      DND35_ALIGNMENT_DEFINITIONS.forEach(a => {
        const isSelected = a.id.toLowerCase() === currentVal;
        let compatBadge = '';
        if (deityMeta && deityMeta.found && !deityMeta.isPhilosophical && typeof checkClericDeityAlignmentCompatibility === 'function') {
          const compat = checkClericDeityAlignmentCompatibility(a.id, deityMeta);
          if (compat) {
            if (compat.compatible) {
              compatBadge = '<span class="text-[8px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700/80 px-1 py-0.2 rounded truncate" title="' + escapeDeityHtml(compat.reason || 'Deity Compatible') + '">✓ Compatible</span>';
            } else {
              compatBadge = '<span class="text-[8px] font-mono font-bold text-amber-400 bg-amber-950/80 border border-amber-700/80 px-1 py-0.2 rounded truncate" title="' + escapeDeityHtml(compat.reason || 'Deity Conflict') + '">⚠️ Conflict</span>';
            }
          }
        }

        const selectedClasses = isSelected
          ? 'bg-purple-950/90 border-purple-500 shadow-md ring-1 ring-purple-400 text-white'
          : 'bg-slate-900/70 hover:bg-slate-800/90 border-slate-800 hover:border-purple-500/50 text-slate-200 shadow-sm';

        html += `
          <button type="button" onclick="selectAlignmentItem('${escapeDeityHtml(a.id)}')" class="p-2.5 rounded-xl border flex flex-col justify-between gap-1.5 transition cursor-pointer group active:scale-95 text-left ${selectedClasses}">
            <div class="flex items-center justify-between gap-1">
              <span class="text-lg shrink-0">${a.icon}</span>
              <span class="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-slate-950 border border-slate-700 text-purple-300">${a.shortCode}</span>
            </div>
            <div class="min-w-0">
              <div class="text-xs font-black text-white group-hover:text-purple-200 truncate">${a.label}</div>
              <div class="text-[10px] text-purple-300/80 font-semibold truncate">${a.archetype}</div>
            </div>
            <div class="flex items-center justify-between gap-1 pt-0.5 border-t border-slate-800/60">
              ${compatBadge ? compatBadge : '<span class="text-[8px] text-slate-500 font-mono">' + a.axis + '</span>'}
              ${isSelected ? '<span class="text-[8px] font-mono font-bold text-white bg-purple-600 px-1 py-0.2 rounded shrink-0">Active</span>' : ''}
            </div>
          </button>
        `;
      });

      html += '</div>';
      listEl.innerHTML = html;
    }

    const renderAlignmentSpotlightItems = renderAlignmentItems;
    window.renderAlignmentSpotlightItems = renderAlignmentSpotlightItems;
    window.renderAlignmentItems = renderAlignmentItems;

    function selectAlignmentItem(alignId) {
      updateAlignmentDropdownTrigger(alignId);
      closeAlignmentDropdown();

      const hiddenInput = document.getElementById('profile-edit-alignment');
      if (hiddenInput) hiddenInput.value = alignId;
    }

    function updateAlignmentDropdownTrigger(alignId) {
      const labelEl = document.getElementById('alignment-trigger-label');
      const iconEl = document.getElementById('alignment-trigger-icon');
      const hiddenInput = document.getElementById('profile-edit-alignment');
      if (hiddenInput) hiddenInput.value = alignId || '';

      const found = DND35_ALIGNMENT_DEFINITIONS.find(a => a.id.toLowerCase() === (alignId || '').toLowerCase());
      if (found) {
        if (labelEl) labelEl.textContent = found.label;
        if (iconEl) iconEl.textContent = found.icon;
      } else if (alignId) {
        if (labelEl) labelEl.textContent = alignId;
        if (iconEl) iconEl.textContent = '⚖️';
      } else {
        if (labelEl) labelEl.textContent = 'No Alignment Selected';
        if (iconEl) iconEl.textContent = '⚖️';
      }
    }

    // ☀️ SPOTLIGHT & RULE MASTER DEITY SELECTOR & SEARCH COMBOBOX
    // =========================================================================
    const DND35_DEITY_DEFINITIONS = [
      // 1. İyilik & Işık Panteonu (Good & Honor)
      { name: 'Pelor', title: 'The Shining One (Sun & Healing)', category: 'Pantheon of Good & Light', icon: '☀️', alignment: 'Neutral Good', weapon: 'Heavy Mace', domains: ['Good', 'Healing', 'Strength', 'Sun'], tags: ['gunes', 'sifa', 'healer', 'paladin', 'cleric'] },
      { name: 'Heironeous', title: 'The Invincible (Chivalry & Valor)', category: 'Pantheon of Good & Light', icon: '⚡', alignment: 'Lawful Good', weapon: 'Longsword', domains: ['Glory', 'Good', 'Law', 'War'], tags: ['adalet', 'savas', 'paladin', 'onur', 'knight'] },
      { name: 'Kord', title: 'The Brawler (Strength, Athletics & Courage)', category: 'Pantheon of Good & Light', icon: '🥊', alignment: 'Chaotic Good', weapon: 'Greatsword', domains: ['Chaos', 'Good', 'Luck', 'Strength'], tags: ['guc', 'barbarian', 'fighter', 'cesaret', 'firtina'] },
      { name: 'Corellon Larethian', title: 'First of the Seldarine (Elves, Magic & Arts)', category: 'Pantheon of Good & Light', icon: '🏹', alignment: 'Chaotic Good', weapon: 'Longsword', domains: ['Chaos', 'Good', 'Protection', 'War'], tags: ['elf', 'okcu', 'buyu', 'sanat', 'seldarine'] },
      { name: 'Moradin', title: 'The Soul Forger (Dwarves & Smithing)', category: 'Pantheon of Good & Light', icon: '🔨', alignment: 'Lawful Good', weapon: 'Warhammer', domains: ['Earth', 'Good', 'Law', 'Protection'], tags: ['cuce', 'demirci', 'zanaat', 'koruma', 'dwarf'] },
      { name: 'Ehlonna', title: 'Of the Forests (Woodlands & Nature)', category: 'Pantheon of Good & Light', icon: '🦄', alignment: 'Neutral Good', weapon: 'Longbow', domains: ['Animal', 'Good', 'Plant', 'Sun'], tags: ['ranger', 'druid', 'orman', 'hayvan', 'ok'] },
      { name: 'Yondalla', title: 'The Blessed One (Halflings, Fertility & Protection)', category: 'Pantheon of Good & Light', icon: '🌾', alignment: 'Lawful Good', weapon: 'Short Sword', domains: ['Community', 'Good', 'Law', 'Protection'], tags: ['halfling', 'bucukluk', 'bereket', 'yuva'] },
      { name: 'Bahamut', title: 'The Platinum Dragon (Good Dragons & Justice)', category: 'Pantheon of Good & Light', icon: '🐲', alignment: 'Lawful Good', weapon: 'Heavy Pick', domains: ['Air', 'Cold', 'Dragon', 'Good', 'Luck', 'Protection'], tags: ['dragon', 'ejderha', 'platin', 'paladin'] },

      // 2. Doğa, Bilgi & Denge (Neutral & Balance)
      { name: 'Boccob', title: 'The Uncaring (Magic & Arcane Knowledge)', category: 'Nature, Lore & Balance', icon: '📖', alignment: 'True Neutral', weapon: 'Quarterstaff', domains: ['Knowledge', 'Magic', 'Trickery'], tags: ['wizard', 'arcane', 'bilgi', 'buyu', 'tarafsiz'] },
      { name: 'Fharlanghn', title: 'Dweller on the Horizon (Roads, Travel & Distance)', category: 'Nature, Lore & Balance', icon: '🥾', alignment: 'True Neutral', weapon: 'Quarterstaff', domains: ['Celerity', 'Luck', 'Protection', 'Travel'], tags: ['yolcu', 'seyahat', 'hiz', 'bard', 'kesif'] },
      { name: 'Obad-Hai', title: 'The Shalm (Wild Nature & Seasons)', category: 'Nature, Lore & Balance', icon: '🍂', alignment: 'True Neutral', weapon: 'Quarterstaff', domains: ['Air', 'Animal', 'Earth', 'Fire', 'Plant', 'Water'], tags: ['druid', 'doga', 'element', 'vahsi', 'orman'] },
      { name: 'St. Cuthbert', title: 'Of the Cudgel (Retribution, Discipline & Common Sense)', category: 'Nature, Lore & Balance', icon: '🪓', alignment: 'Lawful Neutral', weapon: 'Heavy Mace', domains: ['Destruction', 'Law', 'Protection', 'Strength'], tags: ['hukum', 'ceza', 'disiplin', 'yasa', 'cleric'] },
      { name: 'Wee Jas', title: 'The Witch Goddess (Death, Magic & Law)', category: 'Nature, Lore & Balance', icon: '🕯️', alignment: 'Lawful Neutral', weapon: 'Dagger', domains: ['Death', 'Domination', 'Law', 'Magic'], tags: ['olum', 'buyu', 'necromancy', 'yasa', 'witch'] },
      { name: 'Olidammara', title: 'The Laughing Rogue (Music, Revelry & Rogues)', category: 'Nature, Lore & Balance', icon: '🎭', alignment: 'Chaotic Neutral', weapon: 'Rapier', domains: ['Chaos', 'Luck', 'Trickery'], tags: ['rogue', 'bard', 'sans', 'hirsiz', 'eglence', 'sarki'] },
      { name: 'Garl Glittergold', title: 'The Joker (Gnomes, Humor & Gemcutting)', category: 'Nature, Lore & Balance', icon: '💎', alignment: 'Chaotic Good', weapon: 'Battleaxe', domains: ['Chaos', 'Good', 'Protection', 'Trickery'], tags: ['gnome', 'gnom', 'mucevher', 'mizah', 'illuzyon'] },

      // 3. Karanlık, Savaş & Yıkım (Evil & Tyranny)
      { name: 'Hextor', title: 'Champion of Evil (Tyranny, War & Discord)', category: 'Darkness, War & Destruction', icon: '⛓️', alignment: 'Lawful Evil', weapon: 'Heavy Flail', domains: ['Destruction', 'Domination', 'Evil', 'Law', 'War'], tags: ['tiran', 'savas', 'zulum', 'kotuluk', 'ordu'] },
      { name: 'Nerull', title: 'The Reaper (Darkness, Murder & the Underworld)', category: 'Darkness, War & Destruction', icon: '💀', alignment: 'Neutral Evil', weapon: 'Scythe', domains: ['Death', 'Evil', 'Trickery'], tags: ['olum', 'reaper', 'tirpan', 'iskelet', 'karanlik'] },
      { name: 'Vecna', title: 'The Maimed Lord (Destructive Secrets & Undeath)', category: 'Darkness, War & Destruction', icon: '👁️‍🗨️', alignment: 'Neutral Evil', weapon: 'Dagger', domains: ['Evil', 'Knowledge', 'Madness'], tags: ['sir', 'lich', 'buyucu', 'hand of vecna', 'eye of vecna'] },
      { name: 'Erythnul', title: 'The Many (Slaughter, Panic & Savagery)', category: 'Darkness, War & Destruction', icon: '🩸', alignment: 'Chaotic Evil', weapon: 'Morningstar', domains: ['Chaos', 'Evil', 'War'], tags: ['katliam', 'vahset', 'kan', 'panik', 'savas'] },
      { name: 'Gruumsh', title: 'One-Eye (Orcs, Conquest & Survival)', category: 'Darkness, War & Destruction', icon: '👁️', alignment: 'Chaotic Evil', weapon: 'Spear', domains: ['Chaos', 'Evil', 'Strength', 'War'], tags: ['ork', 'orc', 'tek goz', 'mizrak', 'fetih'] },
      { name: 'Tiamat', title: 'The Chromatic Dragon (Evil Dragons & Greed)', category: 'Darkness, War & Destruction', icon: '🐉', alignment: 'Lawful Evil', weapon: 'Heavy Pick', domains: ['Destruction', 'Dragon', 'Evil', 'Law', 'Trickery'], tags: ['dragon', 'ejderha', 'renkli', 'hirs', 'bes basli'] },

      // 4. Panteon Dışı & Felsefe
      { name: 'None / Philosophical Faith', title: 'Animism, Cosmic Forces, or Agnostic', category: 'Non-Theistic & Philosophy', icon: '🌀', alignment: 'Any', weapon: '-', domains: ['Universal'], tags: ['yok', 'none', 'felsefe', 'animizm', 'ateist'] }
    ];

    let _deitySpotlightOpen = false;

    function toggleDeitySpotlightDropdown() {
      if (_deitySpotlightOpen) closeDeitySpotlightDropdown();
      else openDeitySpotlightDropdown();
    }

    function openDeitySpotlightDropdown() {
      const dropdown = document.getElementById('deity-spotlight-dropdown');
      const chevron = document.getElementById('deity-trigger-chevron');
      const searchInput = document.getElementById('deity-spotlight-search');
      if (!dropdown) return;

      dropdown.classList.remove('hidden');
      if (chevron) chevron.classList.add('rotate-180');
      _deitySpotlightOpen = true;

      const q = searchInput ? searchInput.value.trim() : '';
      renderDeitySpotlightItems(q);

      setTimeout(() => {
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }, 50);
    }

    function closeDeitySpotlightDropdown() {
      const dropdown = document.getElementById('deity-spotlight-dropdown');
      const chevron = document.getElementById('deity-trigger-chevron');
      if (!dropdown) return;

      dropdown.classList.add('hidden');
      if (chevron) chevron.classList.remove('rotate-180');
      _deitySpotlightOpen = false;
    }

    function onDeitySpotlightFilter(val) {
      const clearBtn = document.getElementById('deity-spotlight-clear-btn');
      if (clearBtn) {
        if (val && val.trim()) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');
      }
      renderDeitySpotlightItems(val);
    }

    function clearDeitySpotlightFilter() {
      const searchInput = document.getElementById('deity-spotlight-search');
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      onDeitySpotlightFilter('');
    }

    function onDeitySpotlightKeydown(e) {
      if (e.key === 'Escape') {
        closeDeitySpotlightDropdown();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const firstBtn = document.querySelector('#deity-spotlight-list [data-deity-name]');
        if (firstBtn) {
          const deityName = firstBtn.getAttribute('data-deity-name');
          selectDeityItem(deityName);
        } else {
          const searchInput = document.getElementById('deity-spotlight-search');
          if (searchInput && searchInput.value.trim()) {
            searchDeityViaRuleMasterAi(searchInput.value.trim());
            closeDeitySpotlightDropdown();
          }
        }
      }
    }

    function escapeDeityHtml(str) {
      return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function getAllDeitiesForSpotlight() {
      const list = [...DND35_DEITY_DEFINITIONS];

      // 1. Character-scoped custom DB / Master DB (character.customDb / window.customMasterDb / masterDb)
      try {
        const customSources = [];
        if (typeof character !== 'undefined' && Array.isArray(character.customDb)) customSources.push(...character.customDb);
        if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) customSources.push(...masterDb);
        if (typeof window !== 'undefined' && Array.isArray(window.customMasterDb)) customSources.push(...window.customMasterDb);

        customSources.forEach(cd => {
          if (cd && cd.name && String(cd.type || '').toLowerCase() === 'deity' && !list.some(d => d.name.toLowerCase() === cd.name.toLowerCase())) {
            list.push({
              name: cd.name,
              title: cd.title || `${cd.name} (Custom / AI)`,
              category: cd.category || 'Custom / AI-Added Deities',
              icon: cd.icon || '🔮',
              rank: cd.rank || 'Lesser Deity',
              alignment: cd.alignment || 'Any',
              weapon: cd.favoredWeapon || cd.weapon || '-',
              favoredWeapon: cd.favoredWeapon || cd.weapon || '-',
              domains: Array.isArray(cd.domains) ? cd.domains : [],
              portfolio: cd.portfolio || '',
              description: cd.description || cd.desc || '',
              tags: Array.isArray(cd.tags) ? cd.tags : ['custom', 'masterdb', 'deity', cd.name.toLowerCase()]
            });
          }
        });
      } catch (e) {
        console.warn('Master DB deities read error:', e);
      }

      // 2. Custom deities from localStorage
      try {
        const saved = localStorage.getItem('dnd35_custom_deities');
        if (saved) {
          const customDeities = JSON.parse(saved);
          if (Array.isArray(customDeities)) {
            customDeities.forEach(cd => {
              if (cd && cd.name && !list.some(d => d.name.toLowerCase() === cd.name.toLowerCase())) {
                list.push({
                  name: cd.name,
                  title: cd.title || `${cd.name} (Custom / AI)`,
                  category: cd.category || 'Custom / AI-Added Deities',
                  icon: cd.icon || '🔮',
                  rank: cd.rank || 'Lesser Deity',
                  alignment: cd.alignment || 'Any',
                  weapon: cd.favoredWeapon || cd.weapon || '-',
                  favoredWeapon: cd.favoredWeapon || cd.weapon || '-',
                  domains: Array.isArray(cd.domains) ? cd.domains : [],
                  portfolio: cd.portfolio || '',
                  description: cd.description || cd.desc || '',
                  tags: ['custom', 'ai', cd.name.toLowerCase()]
                });
              }
            });
          }
        }
      } catch (e) {
        console.warn('Custom deities read error:', e);
      }

      // 3. Catalog lookup
      const catalog = (typeof window.BUNDLED_SRD_CORE_CATALOG !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG))
        ? window.BUNDLED_SRD_CORE_CATALOG
        : [];

      catalog.forEach(item => {
        if (item && item.type === 'Deity' && !list.some(d => d.name.toLowerCase() === item.name.toLowerCase())) {
          list.push({
            name: item.name,
            title: item.title || item.name,
            category: item.category || 'Custom / AI-Added Deities',
            icon: item.icon || '🔮',
            rank: item.rank || 'Lesser Deity',
            alignment: item.alignment || 'Any',
            weapon: item.favoredWeapon || item.weapon || '-',
            favoredWeapon: item.favoredWeapon || item.weapon || '-',
            domains: Array.isArray(item.domains) ? item.domains : [],
            portfolio: item.portfolio || '',
            description: item.description || item.desc || '',
            tags: Array.isArray(item.tags) ? item.tags : ['deity', item.name.toLowerCase()]
          });
        }
      });

      return list;
    }

    // D&D 3.5e RAW Alignment & Deity Compatibility Engine (PHB p. 30 & 32)
    function parseAlignmentAxes(alignStr) {
      if (!alignStr) return null;
      const raw = String(alignStr).trim();
      if (!raw || raw === '-' || raw.toLowerCase() === 'any' || raw.toLowerCase() === 'none') {
        return { lc: 0, ge: 0, isAny: true, label: 'Any' };
      }
      const low = raw.toLowerCase();
      // Short codes
      const codeMap = {
        'lg': { lc: -1, ge: 1, label: 'Lawful Good' },
        'ng': { lc: 0, ge: 1, label: 'Neutral Good' },
        'cg': { lc: 1, ge: 1, label: 'Chaotic Good' },
        'ln': { lc: -1, ge: 0, label: 'Lawful Neutral' },
        'n':  { lc: 0, ge: 0, label: 'True Neutral' },
        'tn': { lc: 0, ge: 0, label: 'True Neutral' },
        'cn': { lc: 1, ge: 0, label: 'Chaotic Neutral' },
        'le': { lc: -1, ge: -1, label: 'Lawful Evil' },
        'ne': { lc: 0, ge: -1, label: 'Neutral Evil' },
        'ce': { lc: 1, ge: -1, label: 'Chaotic Evil' }
      };
      if (codeMap[low]) return { ...codeMap[low], isAny: false };

      let lc = 0;
      if (low.includes('lawful') || low.includes('kurallı') || low.includes('düzenli')) lc = -1;
      else if (low.includes('chaotic') || low.includes('kaotik')) lc = 1;

      let ge = 0;
      if (low.includes('good') || low.includes('iyi')) ge = 1;
      else if (low.includes('evil') || low.includes('kötü')) ge = -1;

      const labelMatrix = {
        '-1,1': 'Lawful Good', '0,1': 'Neutral Good', '1,1': 'Chaotic Good',
        '-1,0': 'Lawful Neutral', '0,0': 'True Neutral', '1,0': 'Chaotic Neutral',
        '-1,-1': 'Lawful Evil', '0,-1': 'Neutral Evil', '1,-1': 'Chaotic Evil'
      };
      return {
        lc,
        ge,
        isAny: false,
        label: labelMatrix[`${lc},${ge}`] || raw
      };
    }

    function getCharacterDeityMeta(char = character, overrideDeityName = null) {
      const rawName = (overrideDeityName !== null ? overrideDeityName : (char?.deity || '')).trim();
      if (!rawName || rawName === '-' || rawName.toLowerCase().includes('none') || rawName.toLowerCase().includes('philosophical')) {
        return {
          found: false,
          isPhilosophical: true,
          name: rawName || 'None / Philosophical Faith',
          alignment: 'Any',
          weapon: '-',
          domains: [],
          icon: '🌀',
          title: 'Animism, Cosmic Forces, or Philosophical Faith'
        };
      }
      const all = getAllDeitiesForSpotlight();
      const match = all.find(d => d.name.toLowerCase() === rawName.toLowerCase());
      if (match) {
        const isPhil = match.name.toLowerCase().includes('none') || match.alignment === 'Any';
        return {
          found: true,
          isPhilosophical: isPhil,
          name: match.name,
          alignment: match.alignment || 'Any',
          weapon: match.weapon || '-',
          domains: Array.isArray(match.domains) ? match.domains : [],
          icon: match.icon || '☀️',
          title: match.title || match.name
        };
      }
      return {
        found: false,
        isPhilosophical: false,
        name: rawName,
        alignment: 'Any',
        weapon: '-',
        domains: [],
        icon: '✨',
        title: rawName
      };
    }

    function checkClericDeityAlignmentCompatibility(charAlignStr, deityObj) {
      if (!deityObj || deityObj.isPhilosophical || !deityObj.alignment || deityObj.alignment === 'Any') {
        return { compatible: true, stepDistance: 0, reason: 'Philosophical Faith / Any Alignment allowed' };
      }
      const c = parseAlignmentAxes(charAlignStr);
      const d = parseAlignmentAxes(deityObj.alignment);
      if (!c || c.isAny || !d || d.isAny) {
        return { compatible: true, stepDistance: 0, reason: 'Alignment unrestricted' };
      }
      const stepDistance = Math.abs(c.lc - d.lc) + Math.abs(c.ge - d.ge);

      // PHB p. 32 Special Rule: St. Cuthbert (LN) only accepts LN or LG clerics
      if (String(deityObj.name || '').toLowerCase().includes('cuthbert')) {
        const ok = (c.lc === -1 && c.ge === 0) || (c.lc === -1 && c.ge === 1);
        return {
          compatible: ok,
          stepDistance,
          reason: ok
            ? `Compatible with St. Cuthbert (Lawful Neutral or Lawful Good)`
            : `PHB p. 32: A Cleric of St. Cuthbert (LN) may only be Lawful Neutral or Lawful Good (current: ${c.label}).`
        };
      }

      // PHB p. 32 Special Rule: A cleric may not be True Neutral unless his deity is True Neutral
      if (c.lc === 0 && c.ge === 0 && !(d.lc === 0 && d.ge === 0)) {
        return {
          compatible: false,
          stepDistance,
          reason: `PHB p. 32: A Cleric cannot be True Neutral unless their deity (${deityObj.name}: ${d.label}) is also True Neutral.`
        };
      }

      if (stepDistance <= 1) {
        return {
          compatible: true,
          stepDistance,
          reason: stepDistance === 0
            ? `Exact alignment match with ${deityObj.name} (${d.label})`
            : `Within 1 step of ${deityObj.name} (${d.label})`
        };
      }
      return {
        compatible: false,
        stepDistance,
        reason: `PHB p. 32 One-Step Rule: Cleric alignment (${c.label}) is ${stepDistance} steps from ${deityObj.name} (${d.label}). Max 1 step allowed.`
      };
    }

    window.parseAlignmentAxes = parseAlignmentAxes;
    window.getCharacterDeityMeta = getCharacterDeityMeta;
    window.checkClericDeityAlignmentCompatibility = checkClericDeityAlignmentCompatibility;

    function renderDeitySpotlightItems(filterText = '') {
      const listEl = document.getElementById('deity-spotlight-list');
      if (!listEl) return;

      const q = (filterText || '').toLowerCase().trim();
      const currentDeity = (document.getElementById('profile-edit-deity')?.value || character?.deity || '').toLowerCase();
      const currentAlign = document.getElementById('profile-edit-alignment')?.value || character?.alignment || '';
      const isClericChar = typeof hasClericDomainCapability === 'function' ? hasClericDomainCapability(character) : false;
      const allDeities = getAllDeitiesForSpotlight();

      const filtered = q
        ? allDeities.filter(d => {
            const matchName = d.name.toLowerCase().includes(q) || (d.title && d.title.toLowerCase().includes(q));
            const matchCat = d.category && d.category.toLowerCase().includes(q);
            const matchAlign = d.alignment && d.alignment.toLowerCase().includes(q);
            const matchWeapon = d.weapon && d.weapon.toLowerCase().includes(q);
            const matchDomains = Array.isArray(d.domains) && d.domains.some(dom => dom.toLowerCase().includes(q));
            const matchTags = Array.isArray(d.tags) && d.tags.some(t => t.toLowerCase().includes(q));
            return matchName || matchCat || matchAlign || matchWeapon || matchDomains || matchTags;
          })
        : allDeities;

      if (filtered.length === 0) {
        listEl.innerHTML = `
          <div class="p-3 text-center space-y-2.5 bg-purple-950/30 rounded-xl border border-purple-500/40 my-1">
            <span class="text-xl block">🔍</span>
            <div class="text-xs font-bold text-slate-200">"${escapeDeityHtml(filterText)}" not found in pantheon</div>
            <p class="text-[10px] text-slate-400">Search official sourcebooks via AI or create a custom deity/patron directly.</p>
            <div class="space-y-1.5 pt-1">
              <button type="button" onclick="searchDeityViaRuleMasterAi('${escapeDeityHtml(filterText).replace(/'/g, "\'")}'); closeDeitySpotlightDropdown();" class="w-full py-2 px-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-extrabold text-xs rounded-lg shadow transition flex items-center justify-center gap-1.5 cursor-pointer">
                <span>🔮</span>
                <span>Fetch "${escapeDeityHtml(filterText)}" via Rule Master AI</span>
              </button>
              <button type="button" onclick="openCustomDeityEditorModal({ name: '${escapeDeityHtml(filterText).replace(/'/g, "\'")}' }); closeDeitySpotlightDropdown();" class="w-full py-2 px-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 hover:text-white border border-slate-700 hover:border-amber-500 font-bold text-xs rounded-lg shadow transition flex items-center justify-center gap-1.5 cursor-pointer">
                <span>✨</span>
                <span>Use "${escapeDeityHtml(filterText)}" as Custom Deity / Patron (Manual Editor)</span>
              </button>
            </div>
          </div>
        `;
        return;
      }

      const categories = {};
      filtered.forEach(d => {
        if (!categories[d.category]) categories[d.category] = [];
        categories[d.category].push(d);
      });

      let html = '';
      for (const [catName, items] of Object.entries(categories)) {
        html += `
          <div class="pt-1">
            <div class="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-400/90 flex items-center justify-between border-b border-purple-900/30 mb-1">
              <span>${catName}</span>
              <span class="text-[8px] font-mono text-slate-500">${items.length}</span>
            </div>
            <div class="space-y-0.5">
        `;

        items.forEach(d => {
          const isSelected = d.name.toLowerCase() === currentDeity;
          const selectedClasses = isSelected
            ? 'bg-purple-900/60 border border-purple-500/80 text-white font-bold'
            : 'bg-slate-900/50 hover:bg-slate-800/80 border border-transparent hover:border-purple-500/30 text-slate-200';

          const domainList = Array.isArray(d.domains) && d.domains.length ? d.domains.join(', ') : '-';
          const compat = currentAlign ? checkClericDeityAlignmentCompatibility(currentAlign, { ...d, isPhilosophical: d.alignment === 'Any' }) : null;
          let alignCompatBadge = '';
          if (compat && d.alignment && d.alignment !== 'Any') {
            if (compat.compatible) {
              alignCompatBadge = compat.stepDistance === 0
                ? `<span class="text-[9px] px-1 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/70 font-mono shrink-0" title="${escapeDeityHtml(compat.reason)}">✓ Exact Align</span>`
                : `<span class="text-[9px] px-1 py-0.2 rounded bg-sky-950/80 text-sky-300 border border-sky-700/70 font-mono shrink-0" title="${escapeDeityHtml(compat.reason)}">✓ 1-Step OK</span>`;
            } else if (isClericChar) {
              alignCompatBadge = `<span class="text-[9px] px-1 py-0.2 rounded bg-rose-950/80 text-rose-300 border border-rose-700/70 font-mono shrink-0" title="${escapeDeityHtml(compat.reason)}">⚠️ >1 Step</span>`;
            }
          }

          html += `
            <button type="button" data-deity-name="${escapeDeityHtml(d.name)}" onclick="selectDeityItem('${escapeDeityHtml(d.name).replace(/'/g, "\'")}')" class="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer group active:scale-[0.99] ${selectedClasses}">
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-sm shrink-0">${d.icon || '☀️'}</span>
                <div class="truncate">
                  <div class="text-xs font-bold flex items-center gap-1.5">
                    <span class="truncate">${d.name}</span>
                    <span class="text-[9px] text-slate-400 font-normal truncate">(${d.title || d.name})</span>
                    ${alignCompatBadge}
                    ${isSelected ? '<span class="text-[9px] px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-700 font-mono">Selected</span>' : ''}
                  </div>
                  <div class="text-[9px] text-purple-300/80 font-mono truncate">
                    ${d.alignment || 'Any'} • Weapon: ${d.weapon || '-'} • Domains: ${domainList}
                  </div>
                </div>
              </div>
              <span class="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">➔</span>
            </button>
          `;
        });

        html += `
            </div>
          </div>
        `;
      }

      if (q && !filtered.some(d => d.name.toLowerCase() === q)) {
        html += `
          <div class="pt-1.5 border-t border-purple-900/40 mt-1 space-y-1">
            <button type="button" onclick="searchDeityViaRuleMasterAi('${escapeDeityHtml(filterText).replace(/'/g, "\'")}'); closeDeitySpotlightDropdown();" class="w-full text-left px-2.5 py-1.5 rounded-lg bg-purple-950/50 hover:bg-purple-900/70 border border-purple-500/40 text-purple-200 flex items-center justify-between transition cursor-pointer group active:scale-[0.99]">
              <div class="flex items-center gap-2">
                <span class="text-sm shrink-0">🔮</span>
                <span class="text-xs font-bold text-purple-200 group-hover:text-white">Fetch "${escapeDeityHtml(filterText)}" via Rule Master AI (Auto-Fill Editor)</span>
              </div>
              <span class="text-xs text-purple-400 group-hover:translate-x-0.5 transition-transform">➔</span>
            </button>
            <button type="button" onclick="openCustomDeityEditorModal({ name: '${escapeDeityHtml(filterText).replace(/'/g, "\'")}' }); closeDeitySpotlightDropdown();" class="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 flex items-center justify-between transition cursor-pointer group active:scale-[0.99]">
              <div class="flex items-center gap-2">
                <span class="text-sm shrink-0">✨</span>
                <span class="text-xs font-bold text-amber-300 group-hover:text-white">Use "${escapeDeityHtml(filterText)}" as Custom Deity / Patron (Manual Editor)</span>
              </div>
              <span class="text-xs text-amber-400 group-hover:translate-x-0.5 transition-transform">➔</span>
            </button>
          </div>
        `;
      }

      if (!q || 'diğer'.includes(q) || 'other'.includes(q) || 'ai'.includes(q) || 'custom'.includes(q) || 'rule master'.includes(q)) {
        html += `
          <div class="pt-1 border-t border-purple-900/40 mt-1 space-y-1">
            <button type="button" onclick="openCustomDeityEditorModal(); closeDeitySpotlightDropdown();" class="w-full text-left px-2.5 py-2 rounded-lg bg-gradient-to-r from-amber-950/60 to-purple-950/60 hover:from-amber-900/70 hover:to-purple-900/70 border border-amber-500/50 hover:border-amber-400 text-amber-200 flex items-center justify-between transition cursor-pointer group active:scale-[0.99]">
              <div class="flex items-center gap-2">
                <span class="text-base shrink-0">✨</span>
                <div>
                  <div class="text-xs font-bold text-amber-200 group-hover:text-white">Create Custom Deity / Patron (Manual Editor)</div>
                  <div class="text-[9px] text-amber-400/80 font-mono">Custom cult power, draconic patron, or forgotten faith</div>
                </div>
              </div>
              <span class="text-xs text-amber-300 font-bold group-hover:translate-x-0.5 transition-transform">➔</span>
            </button>
            <button type="button" onclick="searchDeityViaRuleMasterAi(); closeDeitySpotlightDropdown();" class="w-full text-left px-2.5 py-2 rounded-lg bg-gradient-to-r from-purple-950/70 to-indigo-950/70 hover:from-purple-900/80 hover:to-indigo-900/80 border border-purple-500/40 hover:border-purple-400 text-purple-200 flex items-center justify-between transition cursor-pointer group active:scale-[0.99]">
              <div class="flex items-center gap-2">
                <span class="text-base shrink-0">🔮</span>
                <div>
                  <div class="text-xs font-bold text-purple-200 group-hover:text-white">Other (Search Official Deity via Rule Master AI...)</div>
                  <div class="text-[9px] text-purple-400/80 font-mono">Official deities such as Kelemvor, Mystra, Tempus, Bane, Lolth, etc.</div>
                </div>
              </div>
              <span class="text-xs text-purple-300 font-bold group-hover:translate-x-0.5 transition-transform">➔</span>
            </button>
          </div>
        `;
      }

      listEl.innerHTML = html;
    }

    function selectDeityItem(deityName) {
      if (deityName === 'Diğer' || deityName === 'Other' || deityName === 'custom_deity_create' || deityName === 'Custom Deity') {
        openCustomDeityEditorModal();
        return;
      }

      updateDeitySpotlightTrigger(deityName);
      closeDeitySpotlightDropdown();

      const hiddenInput = document.getElementById('profile-edit-deity');
      if (hiddenInput) hiddenInput.value = deityName;
    }

    function updateDeitySpotlightTrigger(deityName) {
      const labelEl = document.getElementById('deity-trigger-label');
      const iconEl = document.getElementById('deity-trigger-icon');
      const hiddenInput = document.getElementById('profile-edit-deity');
      if (hiddenInput) hiddenInput.value = deityName || '';

      const all = getAllDeitiesForSpotlight();
      const found = all.find(d => d.name.toLowerCase() === (deityName || '').toLowerCase());

      if (found) {
        if (labelEl) labelEl.textContent = `${found.name} (${found.title || found.name})`;
        if (iconEl) iconEl.textContent = found.icon || '☀️';
      } else if (deityName && (deityName.toLowerCase().includes('diğer') || deityName.toLowerCase().includes('other'))) {
        if (labelEl) labelEl.textContent = '🔮 Other (Rule Master AI)';
        if (iconEl) iconEl.textContent = '🔮';
      } else if (deityName) {
        if (labelEl) labelEl.textContent = deityName;
        if (iconEl) iconEl.textContent = '✨';
      } else {
        if (labelEl) labelEl.textContent = 'No Deity / Faith Selected';
        if (iconEl) iconEl.textContent = '🌀';
      }
    }

    // =========================================================================
    // 🔮 CUSTOM DEITY & PATRON CREATOR MODAL CONTROLLER
    // =========================================================================
    const CANONICAL_DEITY_ICONS = ['☀️', '⚡', '🥊', '🏹', '🔨', '🦄', '🌾', '🐲', '📖', '🥾', '🍂', '🪓', '🕯️', '🎭', '💎', '⛓️', '💀', '👁️‍🗨️', '🩸', '👁️', '🐉', '🌀', '🔮', '✨'];
    let _customDeitySelectedDomains = new Set();

    function selectCustomDeityIcon(icon) {
      const iconInput = document.getElementById('custom-deity-icon');
      const preview = document.getElementById('custom-deity-selected-icon-preview');
      if (iconInput) iconInput.value = icon;
      if (preview) preview.textContent = icon;

      const grid = document.getElementById('custom-deity-icon-grid');
      if (grid) {
        grid.querySelectorAll('button[data-icon]').forEach(btn => {
          const i = btn.getAttribute('data-icon');
          if (i === icon) {
            btn.className = 'w-8 h-8 rounded-lg flex items-center justify-center text-base border transition bg-amber-500/20 border-amber-400 text-white shadow-sm scale-110 cursor-pointer';
          } else {
            btn.className = 'w-8 h-8 rounded-lg flex items-center justify-center text-base border transition bg-slate-900 border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:border-slate-500 cursor-pointer';
          }
        });
      }
    }

    function toggleCustomDeityDomainChip(domName) {
      if (_customDeitySelectedDomains.has(domName)) {
        _customDeitySelectedDomains.delete(domName);
      } else {
        _customDeitySelectedDomains.add(domName);
      }
      updateCustomDeityDomainChipsUI();
    }

    function updateCustomDeityDomainChipsUI() {
      const grid = document.getElementById('custom-deity-domains-grid');
      const countEl = document.getElementById('custom-deity-domains-count');
      if (countEl) countEl.textContent = `${_customDeitySelectedDomains.size} Selected`;
      if (!grid) return;
      const buttons = grid.querySelectorAll('button[data-domain]');
      buttons.forEach(btn => {
        const d = btn.getAttribute('data-domain');
        if (_customDeitySelectedDomains.has(d)) {
          btn.className = 'px-2 py-1 rounded-lg text-[10px] font-bold border transition text-center truncate cursor-pointer bg-purple-900/80 border-purple-400 text-white shadow-sm';
        } else {
          btn.className = 'px-2 py-1 rounded-lg text-[10px] font-bold border transition text-center truncate cursor-pointer bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200';
        }
      });
    }

    function getAllDomainsWithCustom() {
      let domains = [];
      if (window.SrdCompendium && typeof window.SrdCompendium.getAllDomains === 'function') {
        const comp = window.SrdCompendium.getAllDomains();
        if (Array.isArray(comp) && comp.length) {
          domains.push(...comp);
        }
      }
      if (typeof character !== 'undefined' && Array.isArray(character.customDb)) {
        domains.push(...character.customDb.filter(e => e && (e.type === 'Domain' || e.category === 'Cleric Domain')));
      }
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        domains.push(...masterDb.filter(e => e && (e.type === 'Domain' || e.category === 'Cleric Domain')));
      }
      try {
        const stored = localStorage.getItem('dnd35_custom_domains');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) domains.push(...parsed);
        }
      } catch (e) {}

      if (!domains.length) {
        domains = [
          'Air', 'Animal', 'Chaos', 'Celerity', 'Cold', 'Community', 'Creation', 'Death',
          'Destruction', 'Domination', 'Dragon', 'Earth', 'Evil', 'Fate', 'Fire', 'Force',
          'Glory', 'Good', 'Healing', 'Inquisition', 'Knowledge', 'Law', 'Liberation', 'Luck',
          'Madness', 'Magic', 'Mind', 'Nobility', 'Pact', 'Plant', 'Protection', 'Purification',
          'Repose', 'Strength', 'Sun', 'Time', 'Travel', 'Trickery', 'Tyranny', 'War', 'Water', 'Wrath'
        ].map(n => ({ name: n }));
      }

      // Deduplicate by name (later custom/Master DB entries override earlier static entries)
      const map = new Map();
      domains.forEach(d => {
        const name = typeof d === 'string' ? d : (d.name || d.id || '');
        if (name) {
          map.set(name.toLowerCase(), typeof d === 'string' ? { name: d } : d);
        }
      });
      return Array.from(map.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    let _editingDeityMasterDbIndex = -1;
    let _editingDeityOriginalName = '';
    let _editingDeityOriginalId = '';

    function openCustomDeityEditorModal(initialData = {}, editMasterDbIdx = -1) {
      if (typeof window.ensureModalsMounted === 'function') {
        window.ensureModalsMounted();
      }

      _editingDeityMasterDbIndex = (typeof editMasterDbIdx === 'number' && editMasterDbIdx >= 0) ? editMasterDbIdx : -1;
      _editingDeityOriginalName = initialData.name || '';
      _editingDeityOriginalId = initialData.id || '';

      const modal = document.getElementById('modal-custom-deity-editor');
      if (!modal) return;
      if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
      }

      // 1. Populate Icon Grid
      const iconGrid = document.getElementById('custom-deity-icon-grid');
      if (iconGrid) {
        iconGrid.innerHTML = CANONICAL_DEITY_ICONS.map(ic => `
          <button type="button" data-icon="${ic}" onclick="selectCustomDeityIcon('${ic}')" class="w-8 h-8 rounded-lg flex items-center justify-center text-base border transition bg-slate-900 border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:border-slate-500 cursor-pointer" title="${ic}">
            ${ic}
          </button>
        `).join('');
      }

      // 2. Initialize Favored Weapon input & DB badge
      const weaponInput = document.getElementById('custom-deity-weapon');
      if (weaponInput) {
        weaponInput.value = initialData.favoredWeapon || initialData.weapon || '';
        updateDeityWeaponBadge(weaponInput.value);
      }

      // 3. Populate Domains Grid
      const domainsGrid = document.getElementById('custom-deity-domains-grid');
      if (domainsGrid) {
        const allDoms = getAllDomainsWithCustom();
        const domainNames = allDoms.map(d => d.name || d.id || '').filter(Boolean);
        domainsGrid.innerHTML = domainNames.map(d => `
          <button type="button" data-domain="${escapeDeityHtml(d)}" onclick="toggleCustomDeityDomainChip('${escapeDeityHtml(d).replace(/'/g, "\'")}')" class="px-2 py-1 rounded-lg text-[10px] font-bold border transition text-center truncate cursor-pointer bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200" title="${escapeDeityHtml(d)}">
            ${escapeDeityHtml(d)}
          </button>
        `).join('');
      }

      // 4. Fill Values
      const nameInput = document.getElementById('custom-deity-name');
      const titleInput = document.getElementById('custom-deity-title');
      const rankSelect = document.getElementById('custom-deity-rank');
      const catSelect = document.getElementById('custom-deity-category');
      const alignSelect = document.getElementById('custom-deity-alignment');
      const portInput = document.getElementById('custom-deity-portfolio');
      const descInput = document.getElementById('custom-deity-desc');

      if (nameInput) nameInput.value = initialData.name || '';
      if (titleInput) titleInput.value = initialData.title || '';
      if (rankSelect) rankSelect.value = initialData.rank || 'Lesser Deity';
      if (catSelect) {
        const catVal = initialData.category || initialData.source || 'Custom / AI-Added Deities';
        const hasCat = Array.from(catSelect.options).some(o => o.value === catVal);
        if (!hasCat && catVal) {
          const opt = document.createElement('option');
          opt.value = catVal;
          opt.textContent = catVal;
          catSelect.appendChild(opt);
        }
        catSelect.value = catVal;
      }
      if (alignSelect) alignSelect.value = initialData.alignment || 'True Neutral';
      if (weaponInput && (initialData.favoredWeapon || initialData.weapon)) {
        weaponInput.value = initialData.favoredWeapon || initialData.weapon;
        updateDeityWeaponBadge(weaponInput.value);
      }
      if (portInput) portInput.value = initialData.portfolio || '';
      if (descInput) descInput.value = initialData.description || initialData.desc || initialData.benefit || '';

      // 5. Select Icon
      const chosenIcon = initialData.icon || '☀️';
      selectCustomDeityIcon(chosenIcon);

      // 6. Select Domains
      _customDeitySelectedDomains = new Set(Array.isArray(initialData.domains) ? initialData.domains : []);
      updateCustomDeityDomainChipsUI();

      // Show Modal
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      closeDeitySpotlightDropdown();
      if (nameInput && !initialData.name) {
        setTimeout(() => nameInput.focus(), 100);
      }
    }

    function closeCustomDeityEditorModal() {
      const modal = document.getElementById('modal-custom-deity-editor');
      if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
      }
    }

    async function autofillDeityEditorViaAi() {
      const nameInput = document.getElementById('custom-deity-name');
      const titleInput = document.getElementById('custom-deity-title');
      const nameVal = nameInput ? nameInput.value.trim() : '';
      const titleVal = titleInput ? titleInput.value.trim() : '';
      let q = nameVal;
      if (!q && titleVal) {
        q = titleVal;
      } else if (q && titleVal && !q.toLowerCase().includes(titleVal.toLowerCase())) {
        q = `${nameVal} (${titleVal})`;
      }
      if (!q) {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Rule Master AI',
            breakdown: 'Please enter a deity name in the field first to auto-fill.',
            icon: '⚠️'
          });
        } else {
          alert('Please enter a deity name first.');
        }
        if (nameInput) nameInput.focus();
        return;
      }
      await searchDeityViaRuleMasterAi(q);
    }

    function saveCustomDeityFromEditor() {
      const nameInput = document.getElementById('custom-deity-name');
      const titleInput = document.getElementById('custom-deity-title');
      const iconInput = document.getElementById('custom-deity-icon');
      const rankSelect = document.getElementById('custom-deity-rank');
      const catSelect = document.getElementById('custom-deity-category');
      const alignSelect = document.getElementById('custom-deity-alignment');
      const weaponInput = document.getElementById('custom-deity-weapon');
      const portInput = document.getElementById('custom-deity-portfolio');
      const descInput = document.getElementById('custom-deity-desc');

      const name = nameInput ? nameInput.value.trim() : '';
      if (!name) {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Required Field',
            breakdown: 'Please enter a name for the deity or patron.',
            icon: '⚠️'
          });
        } else {
          alert('Please enter a deity name.');
        }
        if (nameInput) nameInput.focus();
        return;
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'custom';
      const favoredWeapon = weaponInput ? weaponInput.value.trim() : '-';
      const selectedDomains = Array.from(_customDeitySelectedDomains);
      const catVal = catSelect ? catSelect.value : 'Custom / AI-Added Deities';
      const portfolioVal = portInput ? portInput.value.trim() : '';
      const descVal = descInput ? descInput.value.trim() : '';

      const entry = {
        schemaVersion: 2,
        id: _editingDeityOriginalId || ('deity-' + slug),
        type: 'Deity',
        name: name,
        title: titleInput ? titleInput.value.trim() : '',
        category: catVal,
        source: catVal || 'Custom Deity',
        icon: (iconInput && iconInput.value) ? iconInput.value : '🔮',
        rank: rankSelect ? rankSelect.value : 'Lesser Deity',
        alignment: alignSelect ? alignSelect.value : 'True Neutral',
        favoredWeapon: favoredWeapon,
        weapon: favoredWeapon,
        domains: selectedDomains,
        portfolio: portfolioVal,
        benefit: portfolioVal ? `Portfolio: ${portfolioVal}${selectedDomains.length ? ' • Domains: ' + selectedDomains.join(', ') : ''}` : (descVal || `Favored Weapon: ${favoredWeapon} • Domains: ${selectedDomains.join(', ')}`),
        description: descVal,
        modifiers: [],
        damageParts: [],
        modes: [],
        isCustom: true,
        addedAt: new Date().toISOString()
      };

      const matchDeityRecord = (e) => {
        if (!e) return false;
        const isDeity = String(e.type || '').toLowerCase() === 'deity' || String(e.id || '').startsWith('deity-');
        if (!isDeity) return false;
        const eName = String(e.name || '').toLowerCase();
        const origName = String(_editingDeityOriginalName || '').toLowerCase();
        if (_editingDeityOriginalId && e.id === _editingDeityOriginalId) return true;
        if (origName && eName === origName) return true;
        return eName === name.toLowerCase();
      };

      // Auto-register unknown custom weapon in character.customDb & masterDb
      if (favoredWeapon && favoredWeapon !== '-' && favoredWeapon.toLowerCase() !== 'none' && !isWeaponInDb(favoredWeapon)) {
        const weaponSlug = favoredWeapon.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'weapon';
        const autoWeapon = {
          schemaVersion: 2,
          id: 'wpn-' + weaponSlug,
          type: 'Weapon',
          category: 'Weapon',
          name: favoredWeapon,
          source: `${name} Deity Favored Weapon`,
          damageParts: [{ dice: '1d8', bonus: 0, type: 'Slashing', multiplyOnCrit: true, onCritOnly: false, source: favoredWeapon }],
          isCustom: true,
          addedAt: new Date().toISOString()
        };
        if (typeof character !== 'undefined' && Array.isArray(character.customDb)) character.customDb.push(autoWeapon);
        if (typeof masterDb !== 'undefined' && Array.isArray(masterDb) && (!character || character.customDb !== masterDb)) masterDb.push(autoWeapon);
      }

      // 1. Save to character.customDb & masterDb (in-place update when editing)
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        if (_editingDeityMasterDbIndex >= 0 && _editingDeityMasterDbIndex < masterDb.length) {
          masterDb[_editingDeityMasterDbIndex] = entry;
        } else {
          const mIdx = masterDb.findIndex(matchDeityRecord);
          if (mIdx >= 0) {
            masterDb[mIdx] = entry;
          } else {
            masterDb.push(entry);
          }
        }
      }
      if (typeof character !== 'undefined') {
        if (!Array.isArray(character.customDb)) character.customDb = [];
        if (typeof masterDb === 'undefined' || character.customDb !== masterDb) {
          const existingIdx = character.customDb.findIndex(matchDeityRecord);
          if (existingIdx >= 0) {
            character.customDb[existingIdx] = entry;
          } else {
            character.customDb.push(entry);
          }
        }
      }

      // 2. Save to localStorage
      try {
        let customDeities = [];
        const existingSaved = localStorage.getItem('dnd35_custom_deities');
        if (existingSaved) customDeities = JSON.parse(existingSaved) || [];
        const idx = customDeities.findIndex(d => d && (
          (_editingDeityOriginalId && d.id === _editingDeityOriginalId) ||
          (_editingDeityOriginalName && String(d.name || '').toLowerCase() === _editingDeityOriginalName.toLowerCase()) ||
          String(d.name || '').toLowerCase() === name.toLowerCase()
        ));
        if (idx >= 0) customDeities[idx] = entry;
        else customDeities.push(entry);
        localStorage.setItem('dnd35_custom_deities', JSON.stringify(customDeities));
      } catch (e) {
        console.warn('Failed to cache custom deity in localStorage:', e);
      }

      // 3. Save to Master DB via RuleMaster & refresh Master DB Table
      if (typeof RuleMaster !== 'undefined') {
        if (typeof RuleMaster.saveEntryToMasterDb === 'function') {
          try { RuleMaster.saveEntryToMasterDb(entry); } catch (e) {}
        }
        if (typeof RuleMaster.renderTable === 'function') {
          RuleMaster.renderTable();
        }
      }

      // 4. Save state to storage
      if (typeof saveStateToStorage === 'function') {
        saveStateToStorage(true);
      }

      // 5. Close modal & select saved deity + re-sync domain favored weapon feats
      closeCustomDeityEditorModal();
      selectDeityItem(entry.name);
      if (typeof syncClericDomainsToCharacterSpecialAbilities === 'function') {
        syncClericDomainsToCharacterSpecialAbilities();
      }
      if (typeof renderAll === 'function') {
        renderAll();
      }

      // 6. Show official English toast
      if (typeof showDiceTopToast === 'function') {
        showDiceTopToast({
          title: 'Deity Saved to Master DB',
          breakdown: `${entry.name} saved to Master DB and selected.`,
          icon: entry.icon || '💾'
        });
      }
    }

    async function searchDeityViaRuleMasterAi(queryName = null) {
      let q = queryName;
      if (!q) {
        const searchInput = document.getElementById('deity-spotlight-search');
        if (searchInput && searchInput.value.trim()) q = searchInput.value.trim();
      }
      if (!q) {
        const nameInput = document.getElementById('custom-deity-name');
        const titleInput = document.getElementById('custom-deity-title');
        const nameVal = nameInput ? nameInput.value.trim() : '';
        const titleVal = titleInput ? titleInput.value.trim() : '';
        if (nameVal && titleVal && !nameVal.toLowerCase().includes(titleVal.toLowerCase())) {
          q = `${nameVal} (${titleVal})`;
        } else {
          q = nameVal || titleVal;
        }
      }
      if (!q) {
        const entered = prompt('Enter the name of the official D&D 3.5e deity you want to search:\n(e.g., Kelemvor, Mystra, Tempus, Bane, Lolth, Asmodeus, Helm, Sune)');
        if (entered && entered.trim()) {
          q = entered.trim();
        } else {
          return;
        }
      }

      closeDeitySpotlightDropdown();

      // 0ms IMMEDIATE OPEN: Open editor right away with search term
      openCustomDeityEditorModal({ name: q });

      // Show prominent animated loading banner inside editor
      const statusBanner = document.getElementById('deity-editor-ai-status-banner');
      if (statusBanner) {
        statusBanner.className = 'p-3 rounded-xl bg-purple-950/80 border border-purple-500/70 text-purple-200 text-xs flex items-center justify-between gap-2 shadow-lg mb-2 animate-pulse';
        statusBanner.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="text-base animate-spin">⚡</span>
            <span>🔮 Rule Master AI fetching D&amp;D 3.5e RAW data for "<strong>${escapeDeityHtml(q)}</strong>"...</span>
          </div>
          <span class="text-[10px] font-mono text-purple-400">Live AI Search</span>
        `;
        statusBanner.classList.remove('hidden');
      }

      if (typeof showDiceTopToast === 'function') {
        showDiceTopToast({
          title: 'Rule Master AI',
          breakdown: `🔮 Rule Master AI fetching D&D 3.5e RAW data for "${escapeDeityHtml(q)}"...`,
          icon: '⚡'
        });
      }

      try {
        let deityObj = null;
        if (typeof RuleMaster !== 'undefined' && typeof RuleMaster.fetchDeityViaAi === 'function') {
          deityObj = await RuleMaster.fetchDeityViaAi(q);
        } else if (typeof RuleMaster !== 'undefined' && typeof RuleMaster.fetchSingleAiRuleObjects === 'function') {
          const key = RuleMaster.getApiKey();
          if (!key) {
            RuleMaster.promptApiKey();
            throw new Error('Gemini API key not configured.');
          }
          const results = await RuleMaster.fetchSingleAiRuleObjects(q, 'Deity', key);
          if (results && results.length) {
            deityObj = results.find(e => e && (e.type === 'Deity' || String(e.type).toLowerCase() === 'deity')) || results[0];
          }
        } else {
          throw new Error('Rule Master engine could not be loaded.');
        }

        if (!deityObj || !deityObj.name) {
          throw new Error(`No official D&D 3.5e deity data found for "${q}".`);
        }

        deityObj.type = 'Deity';
        if (!deityObj.favoredWeapon && deityObj.weapon) deityObj.favoredWeapon = deityObj.weapon;

        // Re-populate editor fields live
        openCustomDeityEditorModal(deityObj);

        // Update banner to success emerald
        if (statusBanner) {
          statusBanner.className = 'p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/70 text-emerald-200 text-xs flex items-center justify-between gap-2 shadow-lg mb-2';
          statusBanner.innerHTML = `
            <div class="flex items-center gap-2">
              <span class="text-base">✅</span>
              <span>Rule Master AI populated fields for "<strong>${escapeDeityHtml(deityObj.name)}</strong>". Review &amp; click Save.</span>
            </div>
            <button type="button" onclick="this.parentElement.classList.add('hidden')" class="text-emerald-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded cursor-pointer">&times;</button>
          `;
          statusBanner.classList.remove('hidden');
        }

        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Deity Found via AI',
            breakdown: `AI populated fields for ${deityObj.name}. Review & Save to Master DB.`,
            icon: '✨'
          });
        }
      } catch (err) {
        console.warn('AI Deity lookup warning / fallback:', err);
        const errMsg = (err && err.message) ? err.message : 'AI lookup unavailable';
        if (statusBanner) {
          statusBanner.className = 'p-3 rounded-xl bg-amber-950/90 border border-amber-600/70 text-amber-200 text-xs flex items-center justify-between gap-2 shadow-lg mb-2';
          statusBanner.innerHTML = `
            <div class="flex items-center gap-2">
              <span class="text-base">⚠️</span>
              <span>${escapeDeityHtml(errMsg)} — ready for manual setup.</span>
            </div>
            <button type="button" onclick="this.parentElement.classList.add('hidden')" class="text-amber-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded cursor-pointer">&times;</button>
          `;
          statusBanner.classList.remove('hidden');
        }
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Rule Master AI Notice',
            breakdown: `${errMsg} — ready for manual setup.`,
            icon: '⚡'
          });
        }
      }
    }

    window.openCustomDeityEditorModal = openCustomDeityEditorModal;
    window.closeCustomDeityEditorModal = closeCustomDeityEditorModal;
    window.autofillDeityEditorViaAi = autofillDeityEditorViaAi;
    window.selectCustomDeityIcon = selectCustomDeityIcon;
    window.toggleCustomDeityDomainChip = toggleCustomDeityDomainChip;
    window.saveCustomDeityFromEditor = saveCustomDeityFromEditor;

    // =========================================================================
    // ⚜️ CUSTOM CLERIC DOMAIN CREATOR & EDITOR MODAL CONTROLLER
    // =========================================================================
    const CANONICAL_DOMAIN_SKILLS = [
      'Bluff', 'Intimidate', 'Disguise', 'Hide', 'Move Silently', 'Survival', 'Spot',
      'Listen', 'Search', 'Sense Motive', 'Knowledge (arcana)', 'Knowledge (nature)',
      'Knowledge (religion)', 'Knowledge (the planes)', 'Knowledge (dungeoneering)',
      'Knowledge (local)', 'Spellcraft', 'Heal', 'Diplomacy', 'Concentration',
      'Tumble', 'Jump', 'Climb', 'Swim'
    ];
    let _customDomainSelectedSkills = new Set();

    function toggleCustomDomainSkillChip(skillName) {
      if (_customDomainSelectedSkills.has(skillName)) {
        _customDomainSelectedSkills.delete(skillName);
      } else {
        _customDomainSelectedSkills.add(skillName);
      }
      updateCustomDomainSkillsUI();
    }

    function updateCustomDomainSkillsUI() {
      const grid = document.getElementById('custom-domain-skills-grid');
      const countEl = document.getElementById('custom-domain-skills-count');
      if (countEl) countEl.textContent = `${_customDomainSelectedSkills.size} Selected`;
      if (!grid) return;
      grid.querySelectorAll('button[data-skill]').forEach(btn => {
        const s = btn.getAttribute('data-skill');
        if (_customDomainSelectedSkills.has(s)) {
          btn.className = 'px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer bg-purple-900/80 border-purple-400 text-white shadow-sm';
        } else {
          btn.className = 'px-2 py-0.5 rounded text-[10px] font-medium border transition cursor-pointer bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200';
        }
      });
    }

    let _editingDomainMasterDbIndex = -1;
    let _editingDomainOriginalName = '';
    let _editingDomainOriginalId = '';

    function openCustomDomainEditorModal(initialData = {}, editMasterDbIdx = -1) {
      if (typeof window.ensureModalsMounted === 'function') {
        window.ensureModalsMounted();
      }

      _editingDomainMasterDbIndex = (typeof editMasterDbIdx === 'number' && editMasterDbIdx >= 0) ? editMasterDbIdx : -1;
      _editingDomainOriginalName = initialData.name || '';
      _editingDomainOriginalId = initialData.id || '';

      const modal = document.getElementById('modal-custom-domain-editor');
      if (!modal) return;
      if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
      }

      // Interactive pickers handle search on demand (Zero datalist bottleneck)

      // 3. Render Skill Chips
      const skillsGrid = document.getElementById('custom-domain-skills-grid');
      if (skillsGrid) {
        skillsGrid.innerHTML = CANONICAL_DOMAIN_SKILLS.map(sk => `
          <button type="button" data-skill="${escapeDeityHtml(sk)}" onclick="toggleCustomDomainSkillChip('${escapeDeityHtml(sk).replace(/'/g, "\\'")}')" class="px-2 py-0.5 rounded text-[10px] font-medium border transition cursor-pointer bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200" title="${escapeDeityHtml(sk)}">
            ${escapeDeityHtml(sk)}
          </button>
        `).join('');
      }

      // 4. Fill Fields
      const nameInput = document.getElementById('custom-domain-name');
      const srcInput = document.getElementById('custom-domain-source');
      const alignSelect = document.getElementById('custom-domain-alignment');
      const pDescInput = document.getElementById('custom-domain-power-desc');
      const featInput = document.getElementById('custom-domain-feat');
      const slaNameInput = document.getElementById('custom-domain-sla-name');
      const slaUsesSelect = document.getElementById('custom-domain-sla-uses');
      const modTargetSelect = document.getElementById('custom-domain-mod-target');
      const modValInput = document.getElementById('custom-domain-mod-value');
      const modTypeSelect = document.getElementById('custom-domain-mod-type');

      if (nameInput) nameInput.value = initialData.name || '';
      if (srcInput) srcInput.value = initialData.source || 'Spell Compendium';
      if (alignSelect) alignSelect.value = initialData.alignment || 'Any';
      if (pDescInput) {
        pDescInput.value = initialData.grantedPower?.description || initialData.powerDesc || initialData.benefit || initialData.description || '';
      }
      if (featInput) {
        const feat = initialData.grantedPower?.grantedFeats?.[0] || initialData.grantedFeat || initialData.bonusFeat || '';
        featInput.value = feat;
      }
      if (slaNameInput) {
        slaNameInput.value = initialData.grantedPower?.spellLikeAbilities?.[0]?.name || initialData.slaName || '';
      }
      if (slaUsesSelect) {
        slaUsesSelect.value = initialData.grantedPower?.spellLikeAbilities?.[0]?.uses || initialData.slaUses || 'None';
      }

      // Modifiers
      if (Array.isArray(initialData.modifiers) && initialData.modifiers.length > 0) {
        const m = initialData.modifiers[0];
        if (modTargetSelect) modTargetSelect.value = m.target || 'None';
        if (modValInput) modValInput.value = m.value || 0;
        if (modTypeSelect) modTypeSelect.value = m.type || 'Untyped';
      } else {
        if (modTargetSelect) modTargetSelect.value = 'None';
        if (modValInput) modValInput.value = 0;
        if (modTypeSelect) modTypeSelect.value = 'Untyped';
      }

      // Class skills
      const initialSkills = initialData.grantedPower?.classSkills || initialData.classSkills || [];
      _customDomainSelectedSkills = new Set(Array.isArray(initialSkills) ? initialSkills : []);
      updateCustomDomainSkillsUI();

      // Spells 1-9
      const spells = Array.isArray(initialData.spells) ? initialData.spells : [];
      for (let lvl = 1; lvl <= 9; lvl++) {
        const spInput = document.getElementById(`custom-domain-spell-${lvl}`);
        if (spInput) {
          const found = spells.find(s => s && (s.level === lvl || s.level === String(lvl)));
          if (found) {
            spInput.value = found.name || '';
          } else if (spells[lvl - 1] && (typeof spells[lvl - 1] === 'string' || spells[lvl - 1].name)) {
            spInput.value = typeof spells[lvl - 1] === 'string' ? spells[lvl - 1] : (spells[lvl - 1].name || '');
          } else {
            spInput.value = '';
          }
        }
      }

      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      updateAllDomainBadges();
      if (nameInput && !initialData.name) {
        setTimeout(() => nameInput.focus(), 100);
      }
    }

    function closeCustomDomainEditorModal() {
      const modal = document.getElementById('modal-custom-domain-editor');
      if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
      }
    }

    async function autofillDomainEditorViaAi(domainName = null) {
      const nameInput = document.getElementById('custom-domain-name');
      const q = domainName || (nameInput ? nameInput.value.trim() : '');
      if (!q) {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Rule Master AI',
            breakdown: 'Please enter a domain name first to auto-fill.',
            icon: '⚠️'
          });
        } else {
          alert('Please enter a domain name first.');
        }
        if (nameInput) nameInput.focus();
        return;
      }

      // 0ms IMMEDIATE OPEN
      openCustomDomainEditorModal({ name: q });

      const statusBanner = document.getElementById('domain-editor-ai-status-banner');
      if (statusBanner) {
        statusBanner.className = 'p-3 rounded-xl bg-purple-950/80 border border-purple-500/70 text-purple-200 text-xs flex items-center justify-between gap-2 shadow-lg mb-2 animate-pulse';
        statusBanner.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="text-base animate-spin">⚡</span>
            <span>🔮 Rule Master AI fetching D&amp;D 3.5e RAW data for "<strong>${escapeDeityHtml(q)}</strong>" Domain...</span>
          </div>
          <span class="text-[10px] font-mono text-purple-400">Live AI Search</span>
        `;
        statusBanner.classList.remove('hidden');
      }

      if (typeof showDiceTopToast === 'function') {
        showDiceTopToast({
          title: 'Rule Master AI',
          breakdown: `Searching "${escapeDeityHtml(q)}" Domain across official D&D 3.5e sourcebooks...`,
          icon: '⚡'
        });
      }

      try {
        let domainObj = null;
        if (typeof RuleMaster !== 'undefined' && typeof RuleMaster.fetchDomainViaAi === 'function') {
          domainObj = await RuleMaster.fetchDomainViaAi(q);
        } else if (typeof RuleMaster !== 'undefined' && typeof RuleMaster.fetchSingleAiRuleObjects === 'function') {
          const key = RuleMaster.getApiKey();
          if (!key) {
            RuleMaster.promptApiKey();
            throw new Error('Gemini API key not configured.');
          }
          const results = await RuleMaster.fetchSingleAiRuleObjects(q, 'Domain', key);
          if (results && results.length) {
            domainObj = results.find(e => e && (e.type === 'Domain' || String(e.type).toLowerCase() === 'domain')) || results[0];
          }
        }

        if (!domainObj || !domainObj.name) {
          throw new Error(`No official D&D 3.5e domain found for "${q}".`);
        }

        // Live update fields
        openCustomDomainEditorModal(domainObj);

        if (statusBanner) {
          statusBanner.className = 'p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/70 text-emerald-200 text-xs flex items-center justify-between gap-2 shadow-lg mb-2';
          statusBanner.innerHTML = `
            <div class="flex items-center gap-2">
              <span class="text-base">✅</span>
              <span>Rule Master AI populated official fields for "<strong>${escapeDeityHtml(domainObj.name)}</strong>" Domain. Review &amp; click Save.</span>
            </div>
            <button type="button" onclick="this.parentElement.classList.add('hidden')" class="text-emerald-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded cursor-pointer">&times;</button>
          `;
          statusBanner.classList.remove('hidden');
        }

        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Domain Found via AI',
            breakdown: `AI populated fields for ${domainObj.name} Domain. Review & Save to Master DB.`,
            icon: '✨'
          });
        }
      } catch (err) {
        console.warn('AI Domain lookup warning:', err);
        const errMsg = (err && err.message) ? err.message : 'AI lookup unavailable';
        if (statusBanner) {
          statusBanner.className = 'p-3 rounded-xl bg-amber-950/90 border border-amber-600/70 text-amber-200 text-xs flex items-center justify-between gap-2 shadow-lg mb-2';
          statusBanner.innerHTML = `
            <div class="flex items-center gap-2">
              <span class="text-base">⚠️</span>
              <span>${escapeDeityHtml(errMsg)} — ready for manual setup.</span>
            </div>
            <button type="button" onclick="this.parentElement.classList.add('hidden')" class="text-amber-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded cursor-pointer">&times;</button>
          `;
          statusBanner.classList.remove('hidden');
        }
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Rule Master AI Notice',
            breakdown: `${errMsg} — ready for manual setup.`,
            icon: '⚡'
          });
        }
      }
    }

    // =========================================================================
    // ⚜️ DOMAIN PICKER HELPERS & SPOTLIGHT CONTROLLERS
    // =========================================================================
    const CANONICAL_DOMAIN_SLAS = [
      { name: 'Turn Undead', uses: '3 + Cha mod/day', desc: 'Turn or destroy undead as a good cleric.' },
      { name: 'Rebuke Undead', uses: '3 + Cha mod/day', desc: 'Rebuke or command undead as an evil cleric.' },
      { name: 'Smite', uses: '1/day', desc: 'Add Cha bonus to attack and +1 dmg/level against designated foes.' },
      { name: 'Speak with Animals', uses: '1/day', desc: 'Spell-like ability to communicate with natural animals.' },
      { name: 'Protective Ward', uses: '1/day', desc: 'Grant touched creature sacred resistance bonus equal to cleric level.' },
      { name: 'Death Touch', uses: '1/day', desc: 'Roll 1d6 per cleric level; if exceeds victim HP, target dies instantly.' },
      { name: 'Strength Surge', uses: '1/day', desc: 'Perform a feat of strength as an enhancement bonus equal to cleric level.' },
      { name: 'Inspire Allies', uses: '1/day', desc: 'Grant +2 morale bonus on saves against fear and charm.' },
      { name: 'Lightning Stroke', uses: '1/day', desc: 'Call down a stroke of electricity dealing 1d6 electricity damage.' },
      { name: 'Water Breathing', uses: 'At will', desc: 'Breathe freely underwater as a continuous natural ability.' },
      { name: 'Turn Fire Creatures', uses: '3 + Cha mod/day', desc: 'Turn or destroy water creatures; rebuke or command fire creatures.' },
      { name: 'Turn Water Creatures', uses: '3 + Cha mod/day', desc: 'Turn or destroy fire creatures; rebuke or command water creatures.' },
      { name: 'Turn Earth Creatures', uses: '3 + Cha mod/day', desc: 'Turn or destroy air creatures; rebuke or command earth creatures.' },
      { name: 'Turn Air Creatures', uses: '3 + Cha mod/day', desc: 'Turn or destroy earth creatures; rebuke or command air creatures.' },
      { name: 'Free Metamagic', uses: '1/day', desc: 'Apply Extend Spell, Enlarge Spell, or Empower Spell without higher slot.' }
    ];

    function getAllFeatsFromCompendiumAndCustom() {
      let feats = [];
      if (window.SrdCompendium && typeof window.SrdCompendium.getAllFeats === 'function') {
        const fList = window.SrdCompendium.getAllFeats();
        if (Array.isArray(fList)) feats.push(...fList);
      }
      if (typeof character !== 'undefined' && Array.isArray(character.customDb)) {
        feats.push(...character.customDb.filter(e => e && (e.type === 'Feat' || e.category === 'Feat')));
      }
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        feats.push(...masterDb.filter(e => e && (e.type === 'Feat' || e.category === 'Feat')));
      }
      const map = new Map();
      feats.forEach(f => {
        const name = typeof f === 'string' ? f : (f.name || '');
        if (name && !map.has(name.toLowerCase())) {
          map.set(name.toLowerCase(), typeof f === 'string' ? { name: f, category: 'General' } : f);
        }
      });
      return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    function getAllSpellsFromCompendiumAndCustom() {
      let spells = [];
      if (window.SrdCompendium && typeof window.SrdCompendium.getAllSpells === 'function') {
        const sList = window.SrdCompendium.getAllSpells();
        if (Array.isArray(sList)) spells.push(...sList);
      }
      if (typeof character !== 'undefined' && Array.isArray(character.customDb)) {
        spells.push(...character.customDb.filter(e => e && (e.type === 'Spell' || e.category === 'Spell')));
      }
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        spells.push(...masterDb.filter(e => e && (e.type === 'Spell' || e.category === 'Spell')));
      }
      const map = new Map();
      spells.forEach(s => {
        const name = typeof s === 'string' ? s : (s.name || '');
        if (name && !map.has(name.toLowerCase())) {
          map.set(name.toLowerCase(), typeof s === 'string' ? { name: s, school: 'Universal' } : s);
        }
      });
      return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    function isFeatInDb(featName) {
      if (!featName) return false;
      const clean = featName.trim().toLowerCase();
      if (window.SrdCompendium && typeof window.SrdCompendium.getByName === 'function') {
        const item = window.SrdCompendium.getByName(featName);
        if (item && (item.type === 'Feat' || item.category === 'Feat')) return true;
      }
      if (typeof character !== 'undefined' && Array.isArray(character.customDb)) {
        if (character.customDb.some(e => e && String(e.name || '').toLowerCase() === clean && (e.type === 'Feat' || e.category === 'Feat'))) return true;
      }
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        if (masterDb.some(e => e && String(e.name || '').toLowerCase() === clean && (e.type === 'Feat' || e.category === 'Feat'))) return true;
      }
      if (typeof window.BUNDLED_SRD_FEATS !== 'undefined' && window.BUNDLED_SRD_FEATS[featName]) return true;
      return false;
    }

    function isSpellInDb(spellName) {
      if (!spellName) return false;
      const clean = spellName.trim().toLowerCase();
      if (window.SrdCompendium && typeof window.SrdCompendium.getByName === 'function') {
        const item = window.SrdCompendium.getByName(spellName);
        if (item && (item.type === 'Spell' || item.category === 'Spell')) return true;
      }
      if (typeof character !== 'undefined' && Array.isArray(character.customDb)) {
        if (character.customDb.some(e => e && String(e.name || '').toLowerCase() === clean && (e.type === 'Spell' || e.category === 'Spell'))) return true;
      }
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        if (masterDb.some(e => e && String(e.name || '').toLowerCase() === clean && (e.type === 'Spell' || e.category === 'Spell'))) return true;
      }
      if (typeof window.BUNDLED_SRD_SPELLS !== 'undefined' && window.BUNDLED_SRD_SPELLS[spellName]) return true;
      return false;
    }

    const CANONICAL_NATURAL_WEAPONS = [
      { name: 'Unarmed Strike', category: 'Natural Weapon', damage: '1d3', critical: '20/x2', damageType: 'Bludgeoning', desc: 'Standard monk or natural attack.' },
      { name: 'Bite', category: 'Natural Weapon', damage: 'Varies by size', critical: '20/x2', damageType: 'Piercing/Slashing/Bludgeoning', desc: 'Primary or secondary natural weapon.' },
      { name: 'Claw', category: 'Natural Weapon', damage: 'Varies by size', critical: '20/x2', damageType: 'Slashing/Piercing', desc: 'Natural weapon for paws, hands, or talons.' },
      { name: 'Slam', category: 'Natural Weapon', damage: 'Varies by size', critical: '20/x2', damageType: 'Bludgeoning', desc: 'Natural bludgeoning attack using limbs or whole body.' },
      { name: 'Gore', category: 'Natural Weapon', damage: 'Varies by size', critical: '20/x2', damageType: 'Piercing', desc: 'Natural attack using horns or tusks.' },
      { name: 'Tail Slap', category: 'Natural Weapon', damage: 'Varies by size', critical: '20/x2', damageType: 'Bludgeoning', desc: 'Secondary natural sweep attack.' },
      { name: 'Wing', category: 'Natural Weapon', damage: 'Varies by size', critical: '20/x2', damageType: 'Bludgeoning', desc: 'Secondary natural wing buffet.' },
      { name: 'Tentacle', category: 'Natural Weapon', damage: 'Varies by size', critical: '20/x2', damageType: 'Bludgeoning', desc: 'Natural limb with grab potential.' },
      { name: 'Talon', category: 'Natural Weapon', damage: 'Varies by size', critical: '20/x2', damageType: 'Slashing/Piercing', desc: 'Avian or raptor foot claw attack.' },
      { name: 'Sting', category: 'Natural Weapon', damage: 'Varies by size', critical: '20/x2', damageType: 'Piercing', desc: 'Piercing stinger often carrying venom.' }
    ];

    const FALLBACK_SRD_WEAPONS = [
      { name: 'Battleaxe', category: 'Martial One-Handed', damage: '1d8', critical: 'x3', damageType: 'Slashing' },
      { name: 'Club', category: 'Simple One-Handed', damage: '1d6', critical: 'x2', damageType: 'Bludgeoning' },
      { name: 'Dagger', category: 'Simple Light', damage: '1d4', critical: '19-20/x2', damageType: 'Piercing or Slashing' },
      { name: 'Falchion', category: 'Martial Two-Handed', damage: '2d4', critical: '18-20/x2', damageType: 'Slashing' },
      { name: 'Flail', category: 'Martial One-Handed', damage: '1d8', critical: 'x2', damageType: 'Bludgeoning' },
      { name: 'Greataxe', category: 'Martial Two-Handed', damage: '1d12', critical: 'x3', damageType: 'Slashing' },
      { name: 'Greatclub', category: 'Martial Two-Handed', damage: '1d10', critical: 'x2', damageType: 'Bludgeoning' },
      { name: 'Greatsword', category: 'Martial Two-Handed', damage: '2d6', critical: '19-20/x2', damageType: 'Slashing' },
      { name: 'Halberd', category: 'Martial Two-Handed', damage: '1d10', critical: 'x3', damageType: 'Piercing or Slashing' },
      { name: 'Handaxe', category: 'Martial Light', damage: '1d6', critical: 'x3', damageType: 'Slashing' },
      { name: 'Heavy Crossbow', category: 'Simple Ranged', damage: '1d10', critical: '19-20/x2', damageType: 'Piercing' },
      { name: 'Heavy Flail', category: 'Martial Two-Handed', damage: '1d10', critical: '19-20/x2', damageType: 'Bludgeoning' },
      { name: 'Heavy Mace', category: 'Simple One-Handed', damage: '1d8', critical: 'x2', damageType: 'Bludgeoning' },
      { name: 'Heavy Pick', category: 'Martial One-Handed', damage: '1d6', critical: 'x4', damageType: 'Piercing' },
      { name: 'Javelin', category: 'Simple Ranged', damage: '1d6', critical: 'x2', damageType: 'Piercing' },
      { name: 'Kama', category: 'Exotic Light', damage: '1d6', critical: 'x2', damageType: 'Slashing' },
      { name: 'Kukri', category: 'Exotic Light', damage: '1d4', critical: '18-20/x2', damageType: 'Slashing' },
      { name: 'Lance', category: 'Martial Two-Handed', damage: '1d8', critical: 'x3', damageType: 'Piercing' },
      { name: 'Light Crossbow', category: 'Simple Ranged', damage: '1d8', critical: '19-20/x2', damageType: 'Piercing' },
      { name: 'Light Flail', category: 'Martial One-Handed', damage: '1d8', critical: 'x2', damageType: 'Bludgeoning' },
      { name: 'Light Hammer', category: 'Martial Light', damage: '1d4', critical: 'x2', damageType: 'Bludgeoning' },
      { name: 'Light Mace', category: 'Simple Light', damage: '1d6', critical: 'x2', damageType: 'Bludgeoning' },
      { name: 'Light Pick', category: 'Martial Light', damage: '1d4', critical: 'x4', damageType: 'Piercing' },
      { name: 'Longbow', category: 'Martial Ranged', damage: '1d8', critical: 'x3', damageType: 'Piercing' },
      { name: 'Longspear', category: 'Martial Two-Handed', damage: '1d8', critical: 'x3', damageType: 'Piercing' },
      { name: 'Longsword', category: 'Martial One-Handed', damage: '1d8', critical: '19-20/x2', damageType: 'Slashing' },
      { name: 'Morningstar', category: 'Simple One-Handed', damage: '1d8', critical: 'x2', damageType: 'Bludgeoning and Piercing' },
      { name: 'Net', category: 'Exotic Ranged', damage: '-', critical: '-', damageType: '-' },
      { name: 'Nunchaku', category: 'Exotic Light', damage: '1d6', critical: 'x2', damageType: 'Bludgeoning' },
      { name: 'Quarterstaff', category: 'Simple Two-Handed', damage: '1d6/1d6', critical: 'x2', damageType: 'Bludgeoning' },
      { name: 'Rapier', category: 'Martial One-Handed', damage: '1d6', critical: '18-20/x2', damageType: 'Piercing' },
      { name: 'Scimitar', category: 'Martial One-Handed', damage: '1d6', critical: '18-20/x2', damageType: 'Slashing' },
      { name: 'Scythe', category: 'Martial Two-Handed', damage: '2d4', critical: 'x4', damageType: 'Piercing or Slashing' },
      { name: 'Shortbow', category: 'Martial Ranged', damage: '1d6', critical: 'x3', damageType: 'Piercing' },
      { name: 'Shortspear', category: 'Simple One-Handed', damage: '1d6', critical: 'x2', damageType: 'Piercing' },
      { name: 'Short Sword', category: 'Martial Light', damage: '1d6', critical: '19-20/x2', damageType: 'Piercing' },
      { name: 'Siangham', category: 'Exotic Light', damage: '1d6', critical: 'x2', damageType: 'Piercing' },
      { name: 'Sickle', category: 'Simple Light', damage: '1d6', critical: 'x2', damageType: 'Slashing' },
      { name: 'Sling', category: 'Simple Ranged', damage: '1d4', critical: 'x2', damageType: 'Bludgeoning' },
      { name: 'Spear', category: 'Simple Two-Handed', damage: '1d8', critical: 'x3', damageType: 'Piercing' },
      { name: 'Trident', category: 'Martial One-Handed', damage: '1d8', critical: 'x2', damageType: 'Piercing' },
      { name: 'Warhammer', category: 'Martial One-Handed', damage: '1d8', critical: 'x3', damageType: 'Bludgeoning' },
      { name: 'Whip', category: 'Exotic One-Handed', damage: '1d3', critical: 'x2', damageType: 'Slashing' }
    ];

    function getAllWeaponsFromCompendiumAndCustom() {
      let weapons = [];
      if (window.SrdCompendium && typeof window.SrdCompendium.getAllLoaded === 'function') {
        const eqs = window.SrdCompendium.getAllLoaded('Equipment');
        if (Array.isArray(eqs) && eqs.length) {
          weapons.push(...eqs.filter(e => e && e.type === 'Weapon' && e.name));
        }
      }
      if (typeof window.BUNDLED_SRD_EQUIPMENT !== 'undefined' && Array.isArray(window.BUNDLED_SRD_EQUIPMENT)) {
        weapons.push(...window.BUNDLED_SRD_EQUIPMENT.filter(e => e && e.type === 'Weapon' && e.name));
      }
      if (typeof window.BUNDLED_SRD_CORE_CATALOG !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) {
        weapons.push(...window.BUNDLED_SRD_CORE_CATALOG.filter(e => e && e.type === 'Weapon' && e.name));
      }
      if (typeof character !== 'undefined' && Array.isArray(character.customDb)) {
        weapons.push(...character.customDb.filter(e => e && (e.type === 'Weapon' || e.category === 'Weapon')));
      }
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        weapons.push(...masterDb.filter(e => e && (e.type === 'Weapon' || e.category === 'Weapon')));
      }
      weapons.push(...CANONICAL_NATURAL_WEAPONS);
      weapons.push(...FALLBACK_SRD_WEAPONS);

      const map = new Map();
      weapons.forEach(w => {
        if (!w) return;
        if (typeof w === 'object' && (w.isChild || w.parent || String(w.id || '').includes('-sub-'))) return;
        const name = (typeof w === 'string' ? w : (w.name || '')).trim();
        if (!name || name.startsWith('↳')) return;
        if (!map.has(name.toLowerCase())) {
          map.set(name.toLowerCase(), typeof w === 'string' ? { name: name, category: 'Weapon' } : w);
        }
      });
      return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    function isWeaponInDb(weaponName) {
      if (!weaponName) return false;
      const clean = weaponName.trim().toLowerCase();
      if (clean === '-' || clean === 'none') return true;
      if (CANONICAL_NATURAL_WEAPONS.some(w => w.name.toLowerCase() === clean)) return true;
      if (FALLBACK_SRD_WEAPONS.some(w => w.name.toLowerCase() === clean)) return true;
      if (window.SrdCompendium && typeof window.SrdCompendium.getByName === 'function') {
        const item = window.SrdCompendium.getByName(weaponName);
        if (item && (item.type === 'Weapon' || item.category === 'Weapon')) return true;
      }
      if (typeof character !== 'undefined' && Array.isArray(character.customDb)) {
        if (character.customDb.some(e => e && String(e.name || '').toLowerCase() === clean && (e.type === 'Weapon' || e.category === 'Weapon'))) return true;
      }
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        if (masterDb.some(e => e && String(e.name || '').toLowerCase() === clean && (e.type === 'Weapon' || e.category === 'Weapon'))) return true;
      }
      return false;
    }

    function updateDeityWeaponBadge(weaponName) {
      const badgeEl = document.getElementById('custom-deity-weapon-badge');
      if (!badgeEl) return;
      const clean = (weaponName || '').trim();
      if (!clean || clean === '-' || clean.toLowerCase() === 'none') {
        badgeEl.innerHTML = '';
        return;
      }
      const inDb = isWeaponInDb(clean);
      if (inDb) {
        badgeEl.innerHTML = '<span class="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700/80 rounded px-1.5 py-0.5">✓ In DB</span>';
      } else {
        const safe = clean.replace(/'/g, "\\'");
        badgeEl.innerHTML = `<button type="button" onclick="fetchAndAddMissingDomainEntryViaAi('Weapon', '${safe}')" class="text-[9px] font-bold text-amber-300 hover:text-white bg-amber-950/90 hover:bg-amber-900 border border-amber-600/80 rounded px-1.5 py-0.5 transition cursor-pointer flex items-center gap-1 active:scale-95" title="Fetch weapon via Rule Master AI and add to Master DB"><span>➕</span> <span>Fetch via AI</span></button>`;
      }
    }

    function getAllDomainSlasAndAbilitiesFromCompendiumAndCustom() {
      const items = [];
      const seen = new Set();
      const pushUnique = (obj) => {
        if (!obj || !obj.name) return;
        const k = String(obj.name).toLowerCase().trim();
        if (!k || seen.has(k)) return;
        seen.add(k);
        items.push(obj);
      };

      // 1. Canonical 3.5e Domain SLAs
      CANONICAL_DOMAIN_SLAS.forEach(s => pushUnique({ ...s, category: 'Domain SLA' }));

      // 2. Active SLAs from all SRD + Custom Domains
      if (window.SrdCompendium && typeof window.SrdCompendium.getAllDomains === 'function') {
        window.SrdCompendium.getAllDomains().forEach(dom => {
          const slas = dom?.grantedPower?.spellLikeAbilities || dom?.spellLikeAbilities || [];
          slas.forEach(sla => {
            if (!sla || !sla.name) return;
            pushUnique({
              name: sla.name,
              uses: sla.uses || '1/day',
              category: `${dom.name} Domain`,
              desc: sla.desc || dom?.grantedPower?.description || dom?.description || ''
            });
          });
        });
      }

      // 3. Special Abilities & Feats from Master DB & Character Custom DB
      const customPools = [
        ...(typeof masterDb !== 'undefined' && Array.isArray(masterDb) ? masterDb : []),
        ...(typeof character !== 'undefined' && Array.isArray(character.customDb) ? character.customDb : [])
      ];
      customPools.forEach(e => {
        if (!e || !e.name) return;
        const t = String(e.type || e.category || '').toLowerCase();
        if (t === 'special ability' || t.includes('sla') || t === 'active power' || t === 'dm grant') {
          pushUnique({
            name: e.name,
            uses: e.uses || '1/day',
            category: e.source || 'Special Ability',
            desc: e.shortDescription || e.benefit || e.description || e.desc || ''
          });
        }
      });

      // 4. All Spells from Compendium + Master DB (can be granted as Domain SLAs)
      getAllSpellsFromCompendiumAndCustom().forEach(sp => {
        if (!sp || !sp.name) return;
        pushUnique({
          name: sp.name,
          uses: '1/day',
          category: sp.school ? `Spell-Like (${sp.school})` : 'Spell-Like Ability',
          desc: sp.shortDescription || sp.description || sp.benefit || sp.desc || ''
        });
      });

      return items;
    }

    function isSlaInDb(slaName) {
      if (!slaName) return false;
      const clean = slaName.trim().toLowerCase();
      if (CANONICAL_DOMAIN_SLAS.some(s => s.name.toLowerCase() === clean)) return true;
      if (isSpellInDb(slaName) || isFeatInDb(slaName)) return true;
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        if (masterDb.some(e => e && String(e.name || '').toLowerCase() === clean)) return true;
      }
      if (typeof character !== 'undefined' && Array.isArray(character.customDb)) {
        if (character.customDb.some(e => e && String(e.name || '').toLowerCase() === clean)) return true;
      }
      return false;
    }

    function updateDomainSlaBadge(slaName) {
      const badgeEl = document.getElementById('custom-domain-sla-badge');
      if (!badgeEl) return;
      const clean = (slaName || '').trim();
      if (!clean || clean === '-' || clean.toLowerCase() === 'none') {
        badgeEl.innerHTML = '';
        return;
      }
      const inDb = isSlaInDb(clean);
      if (inDb) {
        badgeEl.innerHTML = '<span class="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700/80 rounded px-1.5 py-0.5">✓ In DB</span>';
      } else {
        const safe = clean.replace(/'/g, "\\'");
        badgeEl.innerHTML = `<button type="button" onclick="fetchAndAddMissingDomainEntryViaAi('Special Ability', '${safe}')" class="text-[9px] font-bold text-amber-300 hover:text-white bg-amber-950/90 hover:bg-amber-900 border border-amber-600/80 rounded px-1.5 py-0.5 transition cursor-pointer flex items-center gap-1 active:scale-95" title="Fetch ability via Rule Master AI and add to Master DB"><span>➕</span> <span>Fetch via AI</span></button>`;
      }
    }

    function updateDomainFeatBadge(featName) {
      const badgeEl = document.getElementById('custom-domain-feat-badge');
      if (!badgeEl) return;
      const clean = (featName || '').trim();
      if (!clean) {
        badgeEl.innerHTML = '';
        return;
      }
      const inDb = isFeatInDb(clean);
      if (inDb) {
        badgeEl.innerHTML = '<span class="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700/80 rounded px-1.5 py-0.5">✓ In DB</span>';
      } else {
        const safe = clean.replace(/'/g, "\\'");
        badgeEl.innerHTML = `<button type="button" onclick="fetchAndAddMissingDomainEntryViaAi('Feat', '${safe}')" class="text-[9px] font-bold text-amber-300 hover:text-white bg-amber-950/90 hover:bg-amber-900 border border-amber-600/80 rounded px-1.5 py-0.5 transition cursor-pointer flex items-center gap-1 active:scale-95" title="Fetch feat via Rule Master AI and add to Master DB"><span>➕</span> <span>Fetch via AI</span></button>`;
      }
    }

    function updateDomainSpellBadge(lvl, spellName) {
      const badgeEl = document.getElementById(`custom-domain-spell-badge-${lvl}`);
      if (!badgeEl) return;
      const clean = (spellName || '').trim();
      if (!clean) {
        badgeEl.innerHTML = '';
        return;
      }
      const inDb = isSpellInDb(clean);
      if (inDb) {
        badgeEl.innerHTML = '<span class="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700/80 rounded px-1 py-0.5">✓ DB</span>';
      } else {
        const safe = clean.replace(/'/g, "\\'");
        badgeEl.innerHTML = `<button type="button" onclick="fetchAndAddMissingDomainEntryViaAi('Spell', '${safe}', ${lvl})" class="text-[9px] font-bold text-emerald-300 hover:text-white bg-amber-950/90 hover:bg-amber-900 border border-amber-600/80 rounded px-1 py-0.5 transition cursor-pointer active:scale-95" title="Not in DB — Click to fetch via Rule Master AI & add to Master DB">➕ AI</button>`;
      }
    }

    function updateAllDomainBadges() {
      const featInput = document.getElementById('custom-domain-feat');
      if (featInput) updateDomainFeatBadge(featInput.value);
      const slaInput = document.getElementById('custom-domain-sla-name');
      if (slaInput) updateDomainSlaBadge(slaInput.value);
      for (let lvl = 1; lvl <= 9; lvl++) {
        const spInput = document.getElementById(`custom-domain-spell-${lvl}`);
        if (spInput) updateDomainSpellBadge(lvl, spInput.value);
      }
    }

    async function fetchAndAddMissingDomainEntryViaAi(type, name, lvl = null) {
      const clean = (name || '').trim();
      if (!clean) return;

      if (typeof showDiceTopToast === 'function') {
        showDiceTopToast({
          title: 'Rule Master AI',
          breakdown: `Fetching ${type} "${clean}" across D&D 3.5e rulebooks...`,
          icon: '⚡'
        });
      }

      try {
        let entry = null;
        if (typeof RuleMaster !== 'undefined' && typeof RuleMaster.fetchSingleAiRuleObjects === 'function') {
          const key = RuleMaster.getApiKey();
          if (!key) {
            RuleMaster.promptApiKey();
            throw new Error('Gemini API key not configured.');
          }
          const results = await RuleMaster.fetchSingleAiRuleObjects(clean, type, key);
          if (results && results.length) {
            entry = results.find(e => e && String(e.type || '').toLowerCase() === type.toLowerCase()) || results[0];
          }
        }
        if (!entry || !entry.name) {
          throw new Error(`AI could not locate official D&D 3.5e data for ${type} "${clean}".`);
        }

        entry.type = type;
        entry.isCustom = true;
        entry.addedAt = new Date().toISOString();

        if (typeof character !== 'undefined') {
          if (!Array.isArray(character.customDb)) character.customDb = [];
          const idx = character.customDb.findIndex(e => e && String(e.name || '').toLowerCase() === clean.toLowerCase() && String(e.type || '').toLowerCase() === type.toLowerCase());
          if (idx >= 0) character.customDb[idx] = entry;
          else character.customDb.push(entry);
        }
        if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
          const mIdx = masterDb.findIndex(e => e && String(e.name || '').toLowerCase() === clean.toLowerCase() && String(e.type || '').toLowerCase() === type.toLowerCase());
          if (mIdx >= 0) masterDb[mIdx] = entry;
          else masterDb.push(entry);
        }

        if (typeof RuleMaster !== 'undefined' && typeof RuleMaster.saveEntryToMasterDb === 'function') {
          RuleMaster.saveEntryToMasterDb(entry);
        }

        if (typeof saveStateToStorage === 'function') saveStateToStorage(true);

        if (type === 'Feat') {
          const fInput = document.getElementById('custom-domain-feat');
          if (fInput) fInput.value = entry.name;
          updateDomainFeatBadge(entry.name);
        } else if (type === 'Special Ability') {
          const sInput = document.getElementById('custom-domain-sla-name');
          if (sInput) sInput.value = entry.name;
          updateDomainSlaBadge(entry.name);
        } else if (type === 'Spell' && lvl !== null) {
          const spInput = document.getElementById(`custom-domain-spell-${lvl}`);
          if (spInput) spInput.value = entry.name;
          updateDomainSpellBadge(lvl, entry.name);
        } else if (type === 'Weapon') {
          const wInput = document.getElementById('custom-deity-weapon');
          if (wInput) wInput.value = entry.name;
          updateDeityWeaponBadge(entry.name);
        }
        closeDomainFieldSpotlight();

        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: `${type} Added to Master DB`,
            breakdown: `"${entry.name}" has been verified and stored in Master DB.`,
            icon: '✅'
          });
        }
      } catch (err) {
        console.warn('Failed to fetch missing domain entry:', err);
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Fetch Notice',
            breakdown: err.message || 'AI fetch unavailable.',
            icon: '⚠️'
          });
        }
      }
    }

    let _activeDomainSpotlightCtx = { mode: 'feat', targetLvl: null, items: [] };

    function openDomainFieldSpotlight(mode, targetLvl = null) {
      if (typeof window.ensureModalsMounted === 'function') window.ensureModalsMounted();
      const modal = document.getElementById('modal-domain-field-spotlight');
      if (!modal) return;
      if (modal.parentElement !== document.body) document.body.appendChild(modal);

      _activeDomainSpotlightCtx = { mode, targetLvl, items: [] };

      const titleEl = document.getElementById('domain-spotlight-field-title');
      const iconEl = document.getElementById('domain-spotlight-icon');
      const searchInput = document.getElementById('domain-spotlight-search');

      if (mode === 'feat') {
        if (titleEl) titleEl.textContent = 'Select Granted Bonus Feat (Compendium + Master DB)';
        if (iconEl) iconEl.textContent = '⚔️';
        if (searchInput) searchInput.placeholder = 'Search feats (e.g., Extend Spell, Blind-Fight)...';
        _activeDomainSpotlightCtx.items = getAllFeatsFromCompendiumAndCustom();
      } else if (mode === 'sla') {
        if (titleEl) titleEl.textContent = 'Select Domain Active SLA / Power (Compendium + Master DB)';
        if (iconEl) iconEl.textContent = '⚡';
        if (searchInput) searchInput.placeholder = 'Search domain powers, SLAs, or spells (e.g., Smite, Ward, Clairvoyance)...';
        _activeDomainSpotlightCtx.items = getAllDomainSlasAndAbilitiesFromCompendiumAndCustom();
      } else if (mode === 'weapon') {
        if (titleEl) titleEl.textContent = 'Select Deity Favored Weapon (SRD Compendium + Master DB)';
        if (iconEl) iconEl.textContent = '⚔️';
        if (searchInput) searchInput.placeholder = 'Search weapons (e.g., Greatsword, Warhammer, Scimitar, Claw, Bite)...';
        _activeDomainSpotlightCtx.items = getAllWeaponsFromCompendiumAndCustom();
      } else if (mode === 'spell') {
        if (titleEl) titleEl.textContent = `Select Domain Spell Level ${targetLvl} (Compendium + Master DB)`;
        if (iconEl) iconEl.textContent = '📜';
        if (searchInput) searchInput.placeholder = `Search level ${targetLvl} spells (e.g., Haste, Bless)...`;
        const allSpells = getAllSpellsFromCompendiumAndCustom();
        _activeDomainSpotlightCtx.items = allSpells.sort((a, b) => {
          const aLvl = a.level !== undefined ? Number(a.level) : 99;
          const bLvl = b.level !== undefined ? Number(b.level) : 99;
          const aIsLvl = aLvl === targetLvl ? 0 : 1;
          const bIsLvl = bLvl === targetLvl ? 0 : 1;
          if (aIsLvl !== bIsLvl) return aIsLvl - bIsLvl;
          return a.name.localeCompare(b.name);
        });
      }

      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      if (searchInput) {
        searchInput.value = '';
        setTimeout(() => { searchInput.focus(); }, 50);
      }
      renderDomainSpotlightResults('');
    }

    function closeDomainFieldSpotlight() {
      const modal = document.getElementById('modal-domain-field-spotlight');
      if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
      }
    }

    function onDomainSpotlightFilter(val) {
      renderDomainSpotlightResults(val);
    }

    function renderDomainSpotlightResults(query = '') {
      const resultsEl = document.getElementById('domain-spotlight-results');
      const countEl = document.getElementById('domain-spotlight-count');
      if (!resultsEl) return;

      const q = (query || '').toLowerCase().trim();
      const ctx = _activeDomainSpotlightCtx;
      const filtered = q
        ? ctx.items.filter(item => {
            const name = (item.name || '').toLowerCase();
            const desc = (item.description || item.desc || item.benefit || '').toLowerCase();
            const cat = (item.category || item.school || item.discipline || '').toLowerCase();
            return name.includes(q) || desc.includes(q) || cat.includes(q);
          })
        : ctx.items;

      if (countEl) countEl.textContent = `${filtered.length} matches`;

      if (filtered.length === 0) {
        const aiType = ctx.mode === 'weapon' ? 'Weapon' : (ctx.mode === 'spell' ? 'Spell' : (ctx.mode === 'feat' ? 'Feat' : 'Special Ability'));
        const safeQ = escapeDeityHtml(query).replace(/'/g, "\\'");
        const lvlArg = (ctx.mode === 'spell' && ctx.targetLvl !== null) ? `, ${ctx.targetLvl}` : '';
        resultsEl.innerHTML = `
          <div class="p-6 text-center text-slate-400 space-y-2.5">
            <span class="text-2xl block">🔍</span>
            <p class="text-xs text-slate-300">No match found in local DB for "<strong>${escapeDeityHtml(query)}</strong>".</p>
            <div class="flex items-center justify-center gap-2 pt-1 flex-wrap">
              <button type="button" onclick="fetchAndAddMissingDomainEntryViaAi('${aiType}', '${safeQ}'${lvlArg})" class="px-3 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-extrabold text-xs rounded-lg shadow transition cursor-pointer active:scale-95 flex items-center gap-1">
                <span>🔮</span> <span>Fetch "${escapeDeityHtml(query)}" via Rule Master AI</span>
              </button>
              <button type="button" onclick="selectDomainSpotlightCustom('${safeQ}')" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs rounded-lg shadow transition cursor-pointer active:scale-95">
                Use "${escapeDeityHtml(query)}" (Custom ${aiType})
              </button>
            </div>
          </div>
        `;
        return;
      }

      const clearBtnHtml = !q ? `
        <button type="button" onclick="selectDomainSpotlightItem('')" class="w-full text-left p-2 rounded-xl bg-slate-950/80 hover:bg-rose-950/40 border border-slate-800/80 hover:border-rose-500/50 transition flex items-center justify-between gap-3 group cursor-pointer">
          <span class="font-bold text-slate-400 group-hover:text-rose-200 text-xs">— None (Clear Selection) —</span>
          <span class="text-[10px] text-slate-500 group-hover:text-rose-300 font-mono">Clear ✕</span>
        </button>
      ` : '';

      const display = filtered.slice(0, 30);
      resultsEl.innerHTML = clearBtnHtml + display.map(item => {
        const name = item.name || '';
        const safeName = name.replace(/'/g, "\\'");
        const meta1 = ctx.mode === 'spell' ? (item.school || 'Spell') : (ctx.mode === 'weapon' ? (item.category || 'Weapon') : (item.category || item.source || ''));
        const meta2 = ctx.mode === 'spell' ? (item.level !== undefined ? `Level ${item.level}` : '') : (ctx.mode === 'weapon' ? (item.damage ? `${item.damage}${item.critical ? ' (' + item.critical + ')' : ''}` : '') : (item.uses || ''));
        const desc = item.benefit || item.shortDescription || item.description || item.desc || '';

        return `
          <button type="button" onclick="selectDomainSpotlightItem('${safeName}')" class="w-full text-left p-2 rounded-xl bg-slate-900/60 hover:bg-purple-950/70 border border-slate-800/80 hover:border-purple-500/60 transition flex items-start justify-between gap-3 group cursor-pointer active:scale-[0.99]">
            <div class="space-y-0.5 flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-bold text-white text-xs group-hover:text-purple-200">${escapeDeityHtml(name)}</span>
                ${meta1 ? `<span class="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-purple-300 font-mono">${escapeDeityHtml(meta1)}</span>` : ''}
                ${meta2 ? `<span class="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-700 text-amber-300 font-bold font-mono">${escapeDeityHtml(meta2)}</span>` : ''}
              </div>
              ${desc ? `<p class="text-[10px] text-slate-400 line-clamp-1">${escapeDeityHtml(desc)}</p>` : ''}
            </div>
            <span class="text-xs text-purple-400 group-hover:translate-x-0.5 transition-transform shrink-0 pt-1 font-bold">Select ➔</span>
          </button>
        `;
      }).join('');
    }

    function selectDomainSpotlightItem(name) {
      const ctx = _activeDomainSpotlightCtx;
      const foundItem = name ? ctx.items.find(i => i && String(i.name || '').toLowerCase() === String(name).toLowerCase()) : null;
      const pDescInput = document.getElementById('custom-domain-power-desc');

      if (ctx.mode === 'feat') {
        const featInput = document.getElementById('custom-domain-feat');
        if (featInput) featInput.value = name;
        updateDomainFeatBadge(name);
        if (name && pDescInput && !pDescInput.value.trim()) {
          const fDesc = foundItem?.benefit || foundItem?.shortDescription || foundItem?.description || '';
          pDescInput.value = fDesc ? `Granted Bonus Feat: ${name} — ${fDesc}` : `You gain ${name} as a bonus feat.`;
        }
      } else if (ctx.mode === 'weapon') {
        const weaponInput = document.getElementById('custom-deity-weapon');
        if (weaponInput) weaponInput.value = name || '-';
        updateDeityWeaponBadge(name || '-');
      } else if (ctx.mode === 'sla') {
        const slaInput = document.getElementById('custom-domain-sla-name');
        if (slaInput) slaInput.value = name;
        updateDomainSlaBadge(name);
        const usesSelect = document.getElementById('custom-domain-sla-uses');
        if (!name) {
          if (usesSelect) usesSelect.value = 'None';
        } else {
          if (foundItem && foundItem.uses && usesSelect) {
            usesSelect.value = foundItem.uses;
          } else if (usesSelect && usesSelect.value === 'None') {
            usesSelect.value = '1/day';
          }
          if (pDescInput && !pDescInput.value.trim() && foundItem?.desc) {
            pDescInput.value = `${name} (${usesSelect?.value || '1/day'}): ${foundItem.desc}`;
          }
        }
      } else if (ctx.mode === 'spell' && ctx.targetLvl !== null) {
        const spInput = document.getElementById(`custom-domain-spell-${ctx.targetLvl}`);
        if (spInput) spInput.value = name;
        updateDomainSpellBadge(ctx.targetLvl, name);
      }
      closeDomainFieldSpotlight();
    }

    function selectDomainSpotlightCustom(customName) {
      selectDomainSpotlightItem(customName);
    }

    function saveCustomDomainFromEditor() {
      const nameInput = document.getElementById('custom-domain-name');
      const srcInput = document.getElementById('custom-domain-source');
      const alignSelect = document.getElementById('custom-domain-alignment');
      const pDescInput = document.getElementById('custom-domain-power-desc');
      const featInput = document.getElementById('custom-domain-feat');
      const slaNameInput = document.getElementById('custom-domain-sla-name');
      const slaUsesSelect = document.getElementById('custom-domain-sla-uses');
      const modTargetSelect = document.getElementById('custom-domain-mod-target');
      const modValInput = document.getElementById('custom-domain-mod-value');
      const modTypeSelect = document.getElementById('custom-domain-mod-type');

      const name = nameInput ? nameInput.value.trim() : '';
      if (!name) {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Required Field',
            breakdown: 'Please enter a name for the domain.',
            icon: '⚠️'
          });
        } else {
          alert('Please enter a domain name.');
        }
        if (nameInput) nameInput.focus();
        return;
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'custom';
      const powerDesc = pDescInput ? pDescInput.value.trim() : '';
      const feat = featInput ? featInput.value.trim() : '';
      const slaName = slaNameInput ? slaNameInput.value.trim() : '';
      const slaUses = slaUsesSelect ? slaUsesSelect.value : 'None';
      const modTarget = modTargetSelect ? modTargetSelect.value : 'None';
      const modVal = modValInput ? parseFloat(modValInput.value) || 0 : 0;
      const modType = modTypeSelect ? modTypeSelect.value : 'Untyped';

      const spellsList = [];
      for (let lvl = 1; lvl <= 9; lvl++) {
        const spEl = document.getElementById(`custom-domain-spell-${lvl}`);
        const spName = spEl ? spEl.value.trim() : '';
        if (spName) {
          const spSlug = spName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          spellsList.push({
            level: lvl,
            id: `spl-${spSlug}`,
            name: spName
          });
        }
      }

      // Auto-register any missing feat, SLA, or spell in character.customDb & masterDb
      if (feat && !isFeatInDb(feat)) {
        const featSlug = feat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'feat';
        const autoFeat = {
          schemaVersion: 2,
          id: 'feat-' + featSlug,
          type: 'Feat',
          category: 'General',
          name: feat,
          source: srcInput?.value || 'Domain Bonus',
          benefit: powerDesc || `Granted bonus feat from ${name} Domain.`,
          modifiers: (modTarget && modTarget !== 'None' && modVal !== 0) ? [{ target: modTarget, value: modVal, type: modType }] : [],
          isCustom: true,
          addedAt: new Date().toISOString()
        };
        if (typeof character !== 'undefined' && Array.isArray(character.customDb)) character.customDb.push(autoFeat);
        if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) masterDb.push(autoFeat);
      }

      if (slaName && !isSlaInDb(slaName)) {
        const slaSlug = slaName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'sla';
        const effectiveUses = (slaUses && slaUses !== 'None') ? slaUses : '1/day';
        const autoSla = {
          schemaVersion: 2,
          id: 'abil-' + slaSlug,
          type: 'Special Ability',
          category: 'Special Ability',
          name: slaName,
          action: 'Standard Action',
          uses: effectiveUses,
          source: srcInput?.value || `${name} Domain`,
          benefit: powerDesc || `${name} Domain Active Power (${effectiveUses}).`,
          modifiers: (modTarget && modTarget !== 'None' && modVal !== 0) ? [{ target: modTarget, value: modVal, type: modType }] : [],
          isCustom: true,
          addedAt: new Date().toISOString()
        };
        if (typeof character !== 'undefined' && Array.isArray(character.customDb)) character.customDb.push(autoSla);
        if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) masterDb.push(autoSla);
      }

      const finalSlaUses = (slaName && (!slaUses || slaUses === 'None')) ? '1/day' : slaUses;

      spellsList.forEach(sp => {
        if (sp.name && !isSpellInDb(sp.name)) {
          const autoSpell = {
            schemaVersion: 2,
            id: sp.id,
            type: 'Spell',
            category: 'Spell',
            name: sp.name,
            level: sp.level,
            school: 'Universal',
            source: srcInput?.value || 'Domain Spell',
            description: `Domain spell from ${name} Domain (Level ${sp.level}).`,
            isCustom: true,
            addedAt: new Date().toISOString()
          };
          if (typeof character !== 'undefined' && Array.isArray(character.customDb)) character.customDb.push(autoSpell);
          if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) masterDb.push(autoSpell);
        }
      });

      const grantedPower = {
        description: powerDesc,
        classSkills: Array.from(_customDomainSelectedSkills),
        grantedFeats: feat ? [feat] : [],
        spellLikeAbilities: (slaName && finalSlaUses !== 'None') ? [{ name: slaName, uses: finalSlaUses, desc: powerDesc }] : []
      };

      const modifiers = (modTarget && modTarget !== 'None' && modVal !== 0)
        ? [{ target: modTarget, value: modVal, type: modType }]
        : [];

      const entry = {
        schemaVersion: 2,
        id: _editingDomainOriginalId || ('dom-' + slug),
        type: 'Domain',
        category: 'Cleric Domain',
        name: name,
        alignment: alignSelect ? alignSelect.value : 'Any',
        source: srcInput ? (srcInput.value.trim() || 'Custom Domain') : 'Custom Domain',
        grantedPower: grantedPower,
        benefit: powerDesc || (spellsList.length ? `Domain Spells: ${spellsList.map(s => s.name).join(', ')}` : 'Cleric Domain'),
        description: powerDesc,
        modifiers: modifiers,
        damageParts: [],
        modes: [],
        spells: spellsList,
        isCustom: true,
        addedAt: new Date().toISOString()
      };

      const matchDomainRecord = (e) => {
        if (!e) return false;
        const isDom = String(e.type || '').toLowerCase() === 'domain' || String(e.id || '').startsWith('dom-');
        if (!isDom) return false;
        const eName = String(e.name || '').toLowerCase();
        const origName = String(_editingDomainOriginalName || '').toLowerCase();
        if (_editingDomainOriginalId && e.id === _editingDomainOriginalId) return true;
        if (origName && eName === origName) return true;
        return eName === name.toLowerCase();
      };

      // 1. Save to character.customDb & masterDb (in-place update when editing)
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        if (_editingDomainMasterDbIndex >= 0 && _editingDomainMasterDbIndex < masterDb.length) {
          masterDb[_editingDomainMasterDbIndex] = entry;
        } else {
          const mIdx = masterDb.findIndex(matchDomainRecord);
          if (mIdx >= 0) {
            masterDb[mIdx] = entry;
          } else {
            masterDb.push(entry);
          }
        }
      }
      if (typeof character !== 'undefined') {
        if (!Array.isArray(character.customDb)) character.customDb = [];
        if (typeof masterDb === 'undefined' || character.customDb !== masterDb) {
          const existingIdx = character.customDb.findIndex(matchDomainRecord);
          if (existingIdx >= 0) {
            character.customDb[existingIdx] = entry;
          } else {
            character.customDb.push(entry);
          }
        }
      }

      // 2. Save to localStorage
      try {
        let customDomains = [];
        const existingSaved = localStorage.getItem('dnd35_custom_domains');
        if (existingSaved) customDomains = JSON.parse(existingSaved) || [];
        const idx = customDomains.findIndex(d => d && (
          (_editingDomainOriginalId && d.id === _editingDomainOriginalId) ||
          (_editingDomainOriginalName && String(d.name || '').toLowerCase() === _editingDomainOriginalName.toLowerCase()) ||
          String(d.name || '').toLowerCase() === name.toLowerCase()
        ));
        if (idx >= 0) customDomains[idx] = entry;
        else customDomains.push(entry);
        localStorage.setItem('dnd35_custom_domains', JSON.stringify(customDomains));
      } catch (e) {
        console.warn('Failed to cache custom domain in localStorage:', e);
      }

      // 3. Save to Master DB via RuleMaster & refresh Master DB Table
      if (typeof RuleMaster !== 'undefined') {
        if (typeof RuleMaster.saveEntryToMasterDb === 'function') {
          try { RuleMaster.saveEntryToMasterDb(entry); } catch (e) {}
        }
        if (typeof RuleMaster.renderTable === 'function') {
          RuleMaster.renderTable();
        }
      }

      // 4. Save state to storage
      if (typeof saveStateToStorage === 'function') {
        saveStateToStorage(true);
      }

      // 5. Close domain modal
      closeCustomDomainEditorModal();

      // 6. Refresh deity editor domains grid if deity editor is open
      const deityModal = document.getElementById('modal-custom-deity-editor');
      if (deityModal && !deityModal.classList.contains('hidden')) {
        const dGrid = document.getElementById('custom-deity-domains-grid');
        if (dGrid) {
          const allDoms = getAllDomainsWithCustom();
          const dNames = allDoms.map(d => d.name || d.id || '').filter(Boolean);
          dGrid.innerHTML = dNames.map(d => `
            <button type="button" data-domain="${escapeDeityHtml(d)}" onclick="toggleCustomDeityDomainChip('${escapeDeityHtml(d).replace(/'/g, "\\'")}')" class="px-2 py-1 rounded-lg text-[10px] font-bold border transition text-center truncate cursor-pointer bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200" title="${escapeDeityHtml(d)}">
              ${escapeDeityHtml(d)}
            </button>
          `).join('');
          if (typeof _customDeitySelectedDomains !== 'undefined') {
            _customDeitySelectedDomains.add(entry.name);
            updateCustomDeityDomainChipsUI();
          }
        }
      }

      // 7. Sync Character's Equipped Cleric Domains, Granted Feats, SLAs, Class Skills & Modifiers Live
      if (typeof character !== 'undefined' && character) {
        if (Array.isArray(character.spellcasting?.domains) && _editingDomainOriginalName && _editingDomainOriginalName.toLowerCase() !== entry.name.toLowerCase()) {
          character.spellcasting.domains = character.spellcasting.domains.map(d =>
            String(d || '').toLowerCase() === _editingDomainOriginalName.toLowerCase() ? entry.name : d
          );
        }
        if (typeof syncClericDomainsToCharacterSpecialAbilities === 'function') {
          syncClericDomainsToCharacterSpecialAbilities();
        }
        if (typeof calculateDivineSlots === 'function') {
          calculateDivineSlots();
        }
        if (typeof renderAll === 'function') {
          renderAll();
        }
      }

      // 8. Refresh Cleric domain picker list if open
      if (typeof renderClericDomainPickerList === 'function') {
        renderClericDomainPickerList();
      }

      // 9. Show official English toast
      if (typeof showDiceTopToast === 'function') {
        showDiceTopToast({
          title: 'Domain Saved to Master DB',
          breakdown: `${entry.name} Domain saved to Master DB.`,
          icon: '⚜️'
        });
      }
    }

    window.openCustomDomainEditorModal = openCustomDomainEditorModal;
    window.closeCustomDomainEditorModal = closeCustomDomainEditorModal;
    window.toggleCustomDomainSkillChip = toggleCustomDomainSkillChip;
    window.autofillDomainEditorViaAi = autofillDomainEditorViaAi;
    window.saveCustomDomainFromEditor = saveCustomDomainFromEditor;
    window.getAllDomainsWithCustom = getAllDomainsWithCustom;
    window.openDomainFieldSpotlight = openDomainFieldSpotlight;
    window.closeDomainFieldSpotlight = closeDomainFieldSpotlight;
    window.onDomainSpotlightFilter = onDomainSpotlightFilter;
    window.selectDomainSpotlightItem = selectDomainSpotlightItem;
    window.selectDomainSpotlightCustom = selectDomainSpotlightCustom;
    window.updateDomainFeatBadge = updateDomainFeatBadge;
    window.updateDomainSlaBadge = updateDomainSlaBadge;
    window.updateDomainSpellBadge = updateDomainSpellBadge;
    window.updateDeityWeaponBadge = updateDeityWeaponBadge;
    window.getAllWeaponsFromCompendiumAndCustom = getAllWeaponsFromCompendiumAndCustom;
    window.isWeaponInDb = isWeaponInDb;
    window.fetchAndAddMissingDomainEntryViaAi = fetchAndAddMissingDomainEntryViaAi;

    function onProfileRaceChange(raceName) {
      const card = document.getElementById('profile-race-traits-card');
      if (!card) return;

      const q = (raceName || '').toLowerCase().trim();
      if (!q) {
        card.classList.add('hidden');
        card.innerHTML = '';
        return;
      }

      // Check if user selected "diğer" / "other"
      if (q === 'diğer' || q === 'other' || q.includes('diğer') || q.includes('other')) {
        renderRaceAiSearchCard(card);
        return;
      }

      ensureCustomRacesLoaded();
      const catalog = (typeof window.BUNDLED_SRD_CORE_CATALOG !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG))
        ? window.BUNDLED_SRD_CORE_CATALOG
        : [];

      const raceObj = catalog.find(item => item && item.type === 'Race' && (item.name.toLowerCase() === q || item.name.toLowerCase().includes(q)));
      if (!raceObj) {
        renderRaceNotFoundCard(card, raceName);
        return;
      }

      // Build Stat Bonus Pill (Canonical V2 modifiers[] first, fallback to legacy V1)
      const statChanges = [];
      const getRaceAbilityMod = (key, v1Prop) => {
        if (Array.isArray(raceObj.modifiers)) {
          const mod = raceObj.modifiers.find(m => m && (m.target === `ability.${key}` || m.target === key));
          if (mod && mod.value !== undefined) return Number(mod.value) || 0;
        }
        return Number(raceObj[v1Prop]) || 0;
      };
      const rStr = getRaceAbilityMod('str', 'strBonus');
      const rDex = getRaceAbilityMod('dex', 'dexBonus');
      const rCon = getRaceAbilityMod('con', 'conBonus');
      const rInt = getRaceAbilityMod('int', 'intBonus');
      const rWis = getRaceAbilityMod('wis', 'wisBonus');
      const rCha = getRaceAbilityMod('cha', 'chaBonus');
      if (rStr) statChanges.push(`${rStr > 0 ? '+' : ''}${rStr} STR`);
      if (rDex) statChanges.push(`${rDex > 0 ? '+' : ''}${rDex} DEX`);
      if (rCon) statChanges.push(`${rCon > 0 ? '+' : ''}${rCon} CON`);
      if (rInt) statChanges.push(`${rInt > 0 ? '+' : ''}${rInt} INT`);
      if (rWis) statChanges.push(`${rWis > 0 ? '+' : ''}${rWis} WIS`);
      if (rCha) statChanges.push(`${rCha > 0 ? '+' : ''}${rCha} CHA`);

      const statBadges = statChanges.length > 0
        ? statChanges.map(s => `<span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/40">${s}</span>`).join(' ')
        : '<span class="text-[10px] text-slate-400 italic">No ability adjustments (Flexible)</span>';

      const traitsList = Array.isArray(raceObj.traits)
        ? raceObj.traits.map(t => `
            <div class="text-[10px] text-slate-300">
              <strong class="text-amber-400 font-bold">${t.name}:</strong> <span>${t.desc}</span>
            </div>
          `).join('')
        : `<p class="text-[10px] text-slate-300">${raceObj.benefit || ''}</p>`;

      // Auto-update size & speed inputs in form
      const sizeInput = document.getElementById('profile-edit-size');
      if (sizeInput && raceObj.size) {
        sizeInput.value = raceObj.size;
        updateSizeDropdownTrigger(raceObj.size);
      }
      const speedInput = document.getElementById('profile-edit-speed');
      if (speedInput && raceObj.baseSpeed) speedInput.value = raceObj.baseSpeed;

      const escapedRaceName = raceObj.name.replace(/'/g, "\'");

      card.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <div class="flex items-center gap-1.5">
            <span class="text-sm">🧬</span>
            <span class="text-xs font-black text-amber-400 uppercase tracking-wide">${raceObj.name}</span>
            <span class="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-300 font-bold">${raceObj.size || 'Medium'} Size • ${raceObj.baseSpeed || 30} ft Speed</span>
          </div>
          <span class="text-[9px] font-mono text-slate-500">D&D 3.5e RAW SRD</span>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-[9px] uppercase font-bold text-slate-400">Racial Ability Adjustments:</span>
          ${statBadges}
        </div>

        <div class="max-h-36 overflow-y-auto bg-slate-900/80 border border-slate-800/80 rounded-lg p-2 space-y-1">
          ${traitsList}
        </div>

        <div class="pt-1.5 border-t border-slate-800 flex items-center text-[10px]">
          <span class="text-amber-300 font-medium flex items-center gap-1.5">
            <span>🧬</span>
            <span>Racial ability bonuses/penalties are automatically applied by the rule engine</span>
          </span>
        </div>
      `;

      card.classList.remove('hidden');
    }

    function applyRacialTraitsToCharacter(raceName) {
      if (!character) return;
      const catalog = (typeof window.BUNDLED_SRD_CORE_CATALOG !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG))
        ? window.BUNDLED_SRD_CORE_CATALOG
        : [];

      const raceObj = catalog.find(item => item && item.type === 'Race' && item.name.toLowerCase() === raceName.toLowerCase());
      if (!raceObj) return;

      // Auto racial stats enabled

      // 1. Update basic profile fields
      character.race = raceObj.name;
      if (raceObj.size) character.size = raceObj.size;
      if (raceObj.baseSpeed) character.baseSpeed = raceObj.baseSpeed;

      const raceInput = document.getElementById('profile-edit-race');
      if (raceInput) raceInput.value = raceObj.name;
      const sizeInput = document.getElementById('profile-edit-size');
      if (sizeInput && raceObj.size) {
        sizeInput.value = raceObj.size;
        updateSizeDropdownTrigger(raceObj.size);
      }
      const speedInput = document.getElementById('profile-edit-speed');
      if (speedInput && raceObj.baseSpeed) speedInput.value = raceObj.baseSpeed;

      // 2. Racial ability modifiers are handled automatically by RuleEngine.recalculateCharacter()

      // 3. Inject Racial Traits into character.specialAbilities (duplicate-safe)
      if (!Array.isArray(character.specialAbilities)) character.specialAbilities = [];
      let addedTraitCount = 0;

      if (Array.isArray(raceObj.traits)) {
        raceObj.traits.forEach(t => {
          const traitFullName = `${t.name} (${raceObj.name})`;
          const alreadyExists = character.specialAbilities.some(a => {
            const aName = (typeof a === 'string' ? a : (a.name || '')).toLowerCase();
            return aName === traitFullName.toLowerCase() || aName === t.name.toLowerCase();
          });

          if (!alreadyExists) {
            character.specialAbilities.push({
              name: traitFullName,
              source: `${raceObj.name} Race`,
              benefit: t.desc || '',
              action: 'Passive',
              duration: 'Continuous',
              active: true
            });
            addedTraitCount++;
          }
        });
      }

      saveStateToStorage(true);
      renderAll();

      if (typeof showDiceTopToast === 'function') {
        showDiceTopToast({
          title: `Applied Race: ${raceObj.name}!`,
          breakdown: `${addedTraitCount} racial traits added to special abilities. Size: ${raceObj.size}, Base Speed: ${raceObj.baseSpeed} ft.${includeStats ? ' Ability modifiers applied.' : ''}`,
          icon: '🧬'
        });
      }
    }

    // ====================================================
    // CONTROLLER: DM STATBLOCK & ABILITY STUDIO MODAL
    // Canavar / NPC statblock düzenleme, vitals, serbest hüner,
    // yetenek, büyü ve manevra stüdyosu
    // ====================================================
    let _npcStudioFeats = [];
    let _npcStudioAbilities = [];
    let _npcStudioSpells = [];
    let _npcStudioManeuvers = [];
    let _npcStudioActiveTab = 'vitals';

    function openNpcStatblockModal(initialTab = 'vitals') {
      if (!character) return;

      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = (val !== undefined && val !== null) ? val : '';
      };

      // 1. Identity & Vitals
      setVal('npc-input-name', character.name || '');
      setVal('npc-input-cr', character.cr || character.challengeRating || '');
      setVal('npc-input-race', character.race || '');
      setVal('npc-input-classes', character.classes || (character.class ? `${character.class} ${character.level || 1}` : ''));
      setVal('npc-input-speed', character.speed || (character.baseSpeed ? `${character.baseSpeed} ft.` : '30 ft.'));
      setVal('npc-input-bab', character.bab !== undefined ? character.bab : (character.baseAttackBonus || 0));

      // HP
      setVal('npc-input-max-hp', character.hp?.max ?? 10);
      setVal('npc-input-current-hp', character.hp?.current ?? (character.hp?.max ?? 10));
      setVal('npc-input-temp-hp', character.hp?.temp ?? 0);

      // AC
      setVal('npc-input-ac-total', character.ac?.total ?? (character.acBreakdown?.total ?? 10));
      setVal('npc-input-ac-touch', character.ac?.touch ?? (character.acBreakdown?.touch ?? 10));
      setVal('npc-input-ac-flat', character.ac?.flatFooted ?? (character.acBreakdown?.flat ?? 10));

      // Saves
      setVal('npc-input-save-fort', character.saves?.fort?.total ?? (character.evaluatedSaves?.fort ?? 0));
      setVal('npc-input-save-ref', character.saves?.ref?.total ?? (character.evaluatedSaves?.ref ?? 0));
      setVal('npc-input-save-will', character.saves?.will?.total ?? (character.evaluatedSaves?.will ?? 0));

      // Ability Scores
      ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(stat => {
        const val = character.abilities?.[stat] ?? (character.stats?.[stat.toUpperCase()]?.value ?? 10);
        setVal('npc-input-' + stat, val);
      });
      updateNpcStatModDisplays();

      // Special Defenses
      setVal('npc-input-dr', character.dr || character.damageReduction || '');
      setVal('npc-input-sr', character.sr || character.spellResistance || '');
      const imms = Array.isArray(character.immunities) ? character.immunities.join(', ') : (character.immunities || '');
      setVal('npc-input-immunities', imms);

      // Spellcasting
      const clVal = character.cl ?? character.casterLevel ?? character.spellcasting?.cl ?? 0;
      setVal('npc-input-cl', clVal);
      const spStat = character.spellcasting?.ability || character.spellcastingAbility || 'CHA';
      const spStatEl = document.getElementById('npc-select-spell-stat');
      if (spStatEl) spStatEl.value = spStat.toUpperCase();
      const spClassEl = document.getElementById('npc-input-spell-class');
      if (spClassEl) spClassEl.value = character.spellcasting?.class || character.spellcasting?.primaryClass || 'Sorcerer';

      // Daily Spell Slots (0 - 9)
      for (let lvl = 0; lvl <= 9; lvl++) {
        const slotEl = document.getElementById('npc-slot-' + lvl);
        if (slotEl) {
          let sVal = 0;
          if (character.spellSlots && character.spellSlots[lvl] !== undefined) {
            sVal = character.spellSlots[lvl];
          } else if (Array.isArray(character.spellcasting?.slots)) {
            const found = character.spellcasting.slots.find(s => Number(s.level) === lvl);
            if (found) sVal = found.daily;
          }
          slotEl.value = sVal;
        }
      }

      // Clone lists
      _npcStudioFeats = (character.feats || []).map(f => {
        if (typeof f === 'string') return { name: f, category: 'Feat', benefit: '' };
        return { name: f.name || '', category: f.category || 'Feat', benefit: f.benefit || f.desc || '', source: f.source || '' };
      });

      _npcStudioAbilities = (character.specialAbilities || []).map(a => {
        if (typeof a === 'string') return { name: a, type: 'Ex', benefit: '' };
        return { name: a.name || '', type: a.type || 'Ex', benefit: a.benefit || a.desc || '', source: a.source || '' };
      });

      _npcStudioSpells = (character.spells || character.spellcasting?.knownSpells || []).map(s => {
        if (typeof s === 'string') return { name: s, level: 1 };
        return { ...s };
      });

      _npcStudioManeuvers = (character.maneuvers || []).map(m => {
        if (typeof m === 'string') return { name: m, level: 1 };
        return { ...m };
      });

      renderNpcStudioFeatsList();
      renderNpcStudioAbilitiesList();
      renderNpcStudioSpellsList();
      renderNpcStudioManeuversList();
      populateNpcCatalogs();

      switchNpcStudioTab(initialTab);

      const modal = document.getElementById('npc-statblock-modal');
      if (modal) modal.classList.remove('hidden');
    }

    function closeNpcStatblockModal() {
      const modal = document.getElementById('npc-statblock-modal');
      if (modal) modal.classList.add('hidden');
    }

    function switchNpcStudioTab(tabKey) {
      _npcStudioActiveTab = tabKey;
      const vitalsPane = document.getElementById('npc-studio-pane-vitals');
      const featsPane = document.getElementById('npc-studio-pane-feats');
      const spellsPane = document.getElementById('npc-studio-pane-spells');

      if (vitalsPane) vitalsPane.classList.toggle('hidden', tabKey !== 'vitals');
      if (featsPane) featsPane.classList.toggle('hidden', tabKey !== 'feats');
      if (spellsPane) spellsPane.classList.toggle('hidden', tabKey !== 'spells');

      const setTabBtnStyle = (btnId, isActive) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        if (isActive) {
          btn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow';
        } else {
          btn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800';
        }
      };

      setTabBtnStyle('btn-npc-tab-vitals', tabKey === 'vitals');
      setTabBtnStyle('btn-npc-tab-feats', tabKey === 'feats');
      setTabBtnStyle('btn-npc-tab-spells', tabKey === 'spells');
    }

    function updateNpcStatModDisplays() {
      ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(stat => {
        const input = document.getElementById('npc-input-' + stat);
        const modEl = document.getElementById('npc-mod-' + stat);
        if (input && modEl) {
          const val = parseInt(input.value) || 10;
          const mod = Math.floor((val - 10) / 2);
          modEl.textContent = (mod >= 0 ? '+' : '') + mod;
          modEl.className = `text-[10px] font-mono block mt-0.5 ${mod >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
        }
      });
    }

    function populateNpcCatalogs() {
      if (!Array.isArray(window.masterDb)) return;

      const fillDatalist = (dlId, items) => {
        const dl = document.getElementById(dlId);
        if (!dl) return;
        dl.innerHTML = items.map(it => `<option value="${safeEscapeHtml(it)}"></option>`).join('');
      };

      const feats = [...new Set(masterDb.filter(m => m && (m.type === 'Feat' || m.role?.includes('Feat'))).map(m => m.name).filter(Boolean))];
      fillDatalist('npc-catalog-feats-list', feats);

      const spells = [...new Set(masterDb.filter(m => m && (m.type === 'Spell' || m.role?.includes('Spell'))).map(m => m.name).filter(Boolean))];
      fillDatalist('npc-catalog-spells-list', spells);

      const maneuvers = [...new Set(masterDb.filter(m => m && (m.type === 'Maneuver' || m.type === 'Stance' || m.role?.includes('Maneuver'))).map(m => m.name).filter(Boolean))];
      fillDatalist('npc-catalog-maneuvers-list', maneuvers);
    }

    // FEATS
    function renderNpcStudioFeatsList() {
      const container = document.getElementById('npc-studio-feats-list');
      const badge = document.getElementById('npc-feats-count-badge');
      if (badge) badge.textContent = `${_npcStudioFeats.length} Feat`;
      if (!container) return;

      if (_npcStudioFeats.length === 0) {
        container.innerHTML = '<div class="text-[11px] text-slate-500 italic py-2 w-full text-center">No feats recorded. Add one above.</div>';
        return;
      }

      container.innerHTML = _npcStudioFeats.map((f, idx) => `
        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-indigo-950/80 border border-indigo-700/60 text-indigo-200 shadow-sm">
          <span class="text-amber-400 shrink-0">🎖️</span>
          <span class="font-bold truncate max-w-[140px]" title="${safeEscapeHtml(f.benefit || f.name)}">${safeEscapeHtml(f.name)}</span>
          <button type="button" onclick="removeNpcStudioFeat(${idx})" class="text-slate-400 hover:text-rose-400 ml-1 text-sm font-black transition cursor-pointer" title="Remove feat">&times;</button>
        </div>
      `).join('');
    }

    function addNpcStudioFeat() {
      const input = document.getElementById('npc-add-feat-search');
      if (!input) return;
      const rawName = input.value.trim();
      if (!rawName) return;

      const dbMatch = Array.isArray(window.masterDb) ? masterDb.find(m => m && m.name && m.name.toLowerCase() === rawName.toLowerCase()) : null;
      _npcStudioFeats.push({
        name: dbMatch ? dbMatch.name : rawName,
        category: dbMatch?.category || 'Feat',
        benefit: dbMatch?.benefit || dbMatch?.desc || '',
        source: dbMatch?.source || 'Statblock'
      });

      input.value = '';
      renderNpcStudioFeatsList();
    }

    function removeNpcStudioFeat(idx) {
      if (idx >= 0 && idx < _npcStudioFeats.length) {
        _npcStudioFeats.splice(idx, 1);
        renderNpcStudioFeatsList();
      }
    }

    // SPECIAL ABILITIES
    function renderNpcStudioAbilitiesList() {
      const container = document.getElementById('npc-studio-abilities-list');
      const badge = document.getElementById('npc-abilities-count-badge');
      if (badge) badge.textContent = `${_npcStudioAbilities.length} Abilities`;
      if (!container) return;

      if (_npcStudioAbilities.length === 0) {
        container.innerHTML = '<div class="text-[11px] text-slate-500 italic py-2 w-full text-center">No special abilities recorded. Add one above.</div>';
        return;
      }

      container.innerHTML = _npcStudioAbilities.map((a, idx) => {
        const typeBadge = a.type ? `<span class="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-purple-900/80 text-purple-300 border border-purple-600/50">${safeEscapeHtml(a.type)}</span>` : '';
        return `
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-purple-950/80 border border-purple-700/60 text-purple-200 shadow-sm">
            <span class="shrink-0">⚡</span>
            <span class="font-bold truncate max-w-[140px]" title="${safeEscapeHtml(a.benefit || a.name)}">${safeEscapeHtml(a.name)}</span>
            ${typeBadge}
            <button type="button" onclick="removeNpcStudioAbility(${idx})" class="text-slate-400 hover:text-rose-400 ml-1 text-sm font-black transition cursor-pointer" title="Remove ability">&times;</button>
          </div>
        `;
      }).join('');
    }

    function addNpcStudioAbility() {
      const nameInput = document.getElementById('npc-add-ability-name');
      const typeSelect = document.getElementById('npc-add-ability-type');
      const descInput = document.getElementById('npc-add-ability-desc');
      if (!nameInput) return;

      const rawName = nameInput.value.trim();
      if (!rawName) return;

      _npcStudioAbilities.push({
        name: rawName,
        type: typeSelect ? typeSelect.value : 'Ex',
        benefit: descInput ? descInput.value.trim() : ''
      });

      nameInput.value = '';
      if (descInput) descInput.value = '';
      renderNpcStudioAbilitiesList();
    }

    function removeNpcStudioAbility(idx) {
      if (idx >= 0 && idx < _npcStudioAbilities.length) {
        _npcStudioAbilities.splice(idx, 1);
        renderNpcStudioAbilitiesList();
      }
    }

    // SPELLS
    function renderNpcStudioSpellsList() {
      const container = document.getElementById('npc-studio-spells-list');
      const badge = document.getElementById('npc-spells-count-badge');
      if (badge) badge.textContent = `${_npcStudioSpells.length} Spells`;
      if (!container) return;

      if (_npcStudioSpells.length === 0) {
        container.innerHTML = '<div class="text-[11px] text-slate-500 italic py-2 w-full text-center">No spells recorded. Add spells from the Master DB compendium.</div>';
        return;
      }

      container.innerHTML = _npcStudioSpells.map((s, idx) => {
        const sName = typeof s === 'string' ? s : (s.name || '');
        const sLvl = typeof s === 'object' && s.level !== undefined ? s.level : '';
        return `
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-sky-950/80 border border-sky-700/60 text-sky-200 shadow-sm">
            <span class="shrink-0">🔮</span>
            <span class="font-bold truncate max-w-[140px]">${safeEscapeHtml(sName)}</span>
            ${sLvl !== '' ? `<span class="text-[9px] font-mono text-sky-400">Lvl ${sLvl}</span>` : ''}
            <button type="button" onclick="removeNpcStudioSpell(${idx})" class="text-slate-400 hover:text-rose-400 ml-1 text-sm font-black transition cursor-pointer" title="Remove spell">&times;</button>
          </div>
        `;
      }).join('');
    }

    function addNpcStudioSpell() {
      const input = document.getElementById('npc-add-spell-search');
      if (!input) return;
      const rawName = input.value.trim();
      if (!rawName) return;

      const dbMatch = Array.isArray(window.masterDb) ? masterDb.find(m => m && m.name && m.name.toLowerCase() === rawName.toLowerCase()) : null;
      _npcStudioSpells.push(dbMatch ? { ...dbMatch } : { name: rawName, level: 1 });

      input.value = '';
      renderNpcStudioSpellsList();
    }

    function removeNpcStudioSpell(idx) {
      if (idx >= 0 && idx < _npcStudioSpells.length) {
        _npcStudioSpells.splice(idx, 1);
        renderNpcStudioSpellsList();
      }
    }

    // MANEUVERS
    function renderNpcStudioManeuversList() {
      const container = document.getElementById('npc-studio-maneuvers-list');
      const badge = document.getElementById('npc-maneuvers-count-badge');
      if (badge) badge.textContent = `${_npcStudioManeuvers.length} Maneuvers`;
      if (!container) return;

      if (_npcStudioManeuvers.length === 0) {
        container.innerHTML = '<div class="text-[11px] text-slate-500 italic py-2 w-full text-center">No maneuvers recorded. Add maneuvers from the Master DB compendium.</div>';
        return;
      }

      container.innerHTML = _npcStudioManeuvers.map((m, idx) => {
        const mName = typeof m === 'string' ? m : (m.name || '');
        const mLvl = typeof m === 'object' && m.level !== undefined ? m.level : '';
        return `
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-rose-950/80 border border-rose-700/60 text-rose-200 shadow-sm">
            <span class="shrink-0">⚔️</span>
            <span class="font-bold truncate max-w-[140px]">${safeEscapeHtml(mName)}</span>
            ${mLvl !== '' ? `<span class="text-[9px] font-mono text-rose-400">Lvl ${mLvl}</span>` : ''}
            <button type="button" onclick="removeNpcStudioManeuver(${idx})" class="text-slate-400 hover:text-rose-400 ml-1 text-sm font-black transition cursor-pointer" title="Remove maneuver">&times;</button>
          </div>
        `;
      }).join('');
    }

    function addNpcStudioManeuver() {
      const input = document.getElementById('npc-add-maneuver-search');
      if (!input) return;
      const rawName = input.value.trim();
      if (!rawName) return;

      const dbMatch = Array.isArray(window.masterDb) ? masterDb.find(m => m && m.name && m.name.toLowerCase() === rawName.toLowerCase()) : null;
      _npcStudioManeuvers.push(dbMatch ? { ...dbMatch } : { name: rawName, level: 1 });

      input.value = '';
      renderNpcStudioManeuversList();
    }

    function removeNpcStudioManeuver(idx) {
      if (idx >= 0 && idx < _npcStudioManeuvers.length) {
        _npcStudioManeuvers.splice(idx, 1);
        renderNpcStudioManeuversList();
      }
    }

    // SAVE STATBLOCK STUDIO
    function saveNpcStatblockModal() {
      if (!character) return;

      const getVal = id => document.getElementById(id)?.value?.trim();
      const getNum = (id, fallback = 0) => {
        const parsed = parseInt(document.getElementById(id)?.value);
        return isNaN(parsed) ? fallback : parsed;
      };

      // 1. Identity & Vitals
      const newName = getVal('npc-input-name');
      if (newName) character.name = newName;
      const newCr = getVal('npc-input-cr');
      if (newCr) {
        character.cr = newCr;
        character.challengeRating = newCr;
      }
      const newRace = getVal('npc-input-race');
      if (newRace) character.race = newRace;
      const newClasses = getVal('npc-input-classes');
      if (newClasses) character.classes = newClasses;
      const newSpeed = getVal('npc-input-speed');
      if (newSpeed) {
        character.speed = newSpeed;
        const spdNum = parseInt(newSpeed);
        if (!isNaN(spdNum) && spdNum > 0) character.baseSpeed = spdNum;
      }
      character.bab = getNum('npc-input-bab', 0);
      character.baseAttackBonus = character.bab;

      // 2. HP
      if (!character.hp) character.hp = {};
      character.hp.max = getNum('npc-input-max-hp', 10);
      character.hp.current = getNum('npc-input-current-hp', character.hp.max);
      character.hp.temp = getNum('npc-input-temp-hp', 0);

      // 3. AC
      if (!character.ac) character.ac = {};
      character.ac.total = getNum('npc-input-ac-total', 10);
      character.ac.touch = getNum('npc-input-ac-touch', 10);
      character.ac.flatFooted = getNum('npc-input-ac-flat', 10);

      if (!character.acBreakdown) character.acBreakdown = {};
      character.acBreakdown.total = character.ac.total;
      character.acBreakdown.touch = character.ac.touch;
      character.acBreakdown.flat = character.ac.flatFooted;

      // 4. Saves
      const fortVal = getNum('npc-input-save-fort', 0);
      const refVal = getNum('npc-input-save-ref', 0);
      const willVal = getNum('npc-input-save-will', 0);

      if (!character.saves) character.saves = {};
      character.saves.fort = { total: fortVal, base: fortVal };
      character.saves.ref = { total: refVal, base: refVal };
      character.saves.will = { total: willVal, base: willVal };

      if (!character.evaluatedSaves) character.evaluatedSaves = {};
      character.evaluatedSaves.fort = fortVal;
      character.evaluatedSaves.ref = refVal;
      character.evaluatedSaves.will = willVal;

      // 5. Abilities (6 Stats)
      if (!character.abilities) character.abilities = {};
      ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(stat => {
        character.abilities[stat] = getNum('npc-input-' + stat, 10);
        if (!character.stats) character.stats = {};
        const u = stat.toUpperCase();
        if (!character.stats[u]) character.stats[u] = {};
        character.stats[u].value = character.abilities[stat];
        character.stats[u].mod = Math.floor((character.abilities[stat] - 10) / 2);
      });

      // 6. Special Defenses
      character.dr = getVal('npc-input-dr');
      character.damageReduction = character.dr;
      character.sr = getVal('npc-input-sr');
      character.spellResistance = character.sr;

      const immsStr = getVal('npc-input-immunities');
      character.immunities = immsStr ? immsStr.split(',').map(s => s.trim()).filter(Boolean) : [];

      // 7. Spellcasting
      const clNum = getNum('npc-input-cl', 0);
      character.cl = clNum;
      character.casterLevel = clNum;

      if (!character.spellcasting) character.spellcasting = {};
      character.spellcasting.cl = clNum;
      character.spellcasting.ability = document.getElementById('npc-select-spell-stat')?.value || 'CHA';
      character.spellcasting.class = getVal('npc-input-spell-class') || 'Inherent';
      character.spellcasting.primaryClass = character.spellcasting.class;

      // Slots
      if (!character.spellSlots) character.spellSlots = {};
      const newSlotsArray = [];
      for (let lvl = 0; lvl <= 9; lvl++) {
        const slotCount = getNum('npc-slot-' + lvl, 0);
        character.spellSlots[lvl] = slotCount;
        if (slotCount > 0 || lvl === 0) {
          newSlotsArray.push({
            level: lvl,
            daily: slotCount,
            used: 0
          });
        }
      }
      character.dailySpellSlots = { ...character.spellSlots };
      character.spellcasting.slots = newSlotsArray;

      // 8. Lists (Feats, Abilities, Spells, Maneuvers)
      character.feats = [..._npcStudioFeats];
      character.specialAbilities = [..._npcStudioAbilities];
      character.spells = [..._npcStudioSpells];
      character.spellcasting.knownSpells = [..._npcStudioSpells];
      character.maneuvers = [..._npcStudioManeuvers];

      // Mark as NPC
      character.isNpc = true;

      // Persist and Render
      closeNpcStatblockModal();
      saveStateToStorage(true);
      renderAll();

      if (typeof showDiceTopToast === 'function') {
        showDiceTopToast({
          icon: '⚡',
          title: 'Statblock Updated',
          breakdown: `${character.name} statblock values and ability pools saved successfully.`,
          total: character.cr ? `CR ${character.cr}` : 'Saved'
        });
      }
    }

    // ====================================================
    // CONTROLLER: STAT DISTRIBUTION & POINT BUY MODAL
    // Manuel, Point Buy (3.5e RAW DMG p.169), 4d6 Drop Lowest
    // ====================================================
    const STAT_KEYS = [
      { key: 'str', label: 'STR', name: 'Strength' },
      { key: 'dex', label: 'DEX', name: 'Dexterity' },
      { key: 'con', label: 'CON', name: 'Constitution' },
      { key: 'int', label: 'INT', name: 'Intelligence' },
      { key: 'wis', label: 'WIS', name: 'Wisdom' },
      { key: 'cha', label: 'CHA', name: 'Charisma' }
    ];

    const STAT_KEYS_TWO_COL = [
      { key: 'str', label: 'STR', name: 'Strength' },
      { key: 'int', label: 'INT', name: 'Intelligence' },
      { key: 'dex', label: 'DEX', name: 'Dexterity' },
      { key: 'wis', label: 'WIS', name: 'Wisdom' },
      { key: 'con', label: 'CON', name: 'Constitution' },
      { key: 'cha', label: 'CHA', name: 'Charisma' }
    ];
    if (typeof window !== 'undefined') {
      window.STAT_KEYS_TWO_COL = STAT_KEYS_TWO_COL;
    }

    const POINT_BUY_COST_TABLE = {
      8: 0,
      9: 1,
      10: 2,
      11: 3,
      12: 4,
      13: 5,
      14: 6,
      15: 8,
      16: 10,
      17: 13,
      18: 16
    };

    let statDistState = {
      mode: 'manual', // 'manual' | 'pointbuy' | 'roll'
      workingAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      pointBuyBudget: 28,
      rolledDice: [] // [ { id: 0, rolls: [d1, d2, d3, d4], droppedIndex: minIdx, total: 15, assignedTo: 'str' } ]
    };

    function getCharacterBaseAbility(statKey) {
      if (!character) return 10;
      
      // If character already has an established baseAbilities for this stat and it's not the accidental all-10s wipe
      if (character.baseAbilities && typeof character.baseAbilities[statKey] === 'number') {
        const isAll10s = Object.values(character.baseAbilities).every(v => v === 10);
        const hasDistinctAbilities = character.abilities && Object.values(character.abilities).some(v => v !== 10);
        
        // If not accidentally wiped, return the character's base ability
        if (!isAll10s || !hasDistinctAbilities) {
          return character.baseAbilities[statKey];
        }
      }

      // Fallback: derive base from character.abilities minus net equipment bonuses
      let netBonus = 0;
      if (typeof RuleEngine !== 'undefined' && RuleEngine.resolveBonusStacking && character.abilitySources?.[statKey]) {
        netBonus = RuleEngine.resolveBonusStacking(character.abilitySources[statKey]);
      } else {
        if (statKey === 'str' && character.bodySlots?.belt?.active && (character.bodySlots.belt.name || '').includes('+2')) netBonus = 2;
        if (statKey === 'dex' && character.bodySlots?.gloves?.active && (character.bodySlots.gloves.name || '').includes('+2')) netBonus = 2;
      }

      const total = Number(character.abilities?.[statKey]) || 10;
      return Math.max(1, total - netBonus);
    }

    function openStatDistributionModal(initialMode = null) {
      if (!character) return;
      
      populateProfileInputs();

      // Taban statları karakterin mevcut gerçek taban değerlerinden oku
      statDistState.workingAbilities = {
        str: getCharacterBaseAbility('str'),
        dex: getCharacterBaseAbility('dex'),
        con: getCharacterBaseAbility('con'),
        int: getCharacterBaseAbility('int'),
        wis: getCharacterBaseAbility('wis'),
        cha: getCharacterBaseAbility('cha')
      };

      // Taban statlar nesnesini de senkronize tut
      character.baseAbilities = { ...statDistState.workingAbilities };

      const modal = document.getElementById('stat-distribution-modal');
      if (modal) modal.classList.remove('hidden');

      const target = initialMode || (statDistState.mainTab ? statDistState.mainTab : 'identity');
      setStatDistMode(target);
    }

    function closeStatDistributionModal() {
      const modal = document.getElementById('stat-distribution-modal');
      if (modal) modal.classList.add('hidden');
    }

    function setStatDistMode(tabOrMode) {
      if (tabOrMode === 'manual' || tabOrMode === 'pointbuy' || tabOrMode === 'roll') {
        statDistState.mainTab = 'abilities';
        statDistState.abilityMode = tabOrMode;
      } else if (tabOrMode === 'abilities') {
        statDistState.mainTab = 'abilities';
        if (!statDistState.abilityMode) statDistState.abilityMode = 'manual';
      } else if (tabOrMode === 'portrait') {
        statDistState.mainTab = 'portrait';
      } else {
        statDistState.mainTab = 'identity';
      }

      // 1. Ana Sekme Başlıklarını Güncelle
      const mainTabs = [
        { id: 'tab-stat-dist-identity', panel: 'panel-stat-dist-identity', key: 'identity' },
        { id: 'tab-stat-dist-abilities', panel: 'panel-stat-dist-abilities', key: 'abilities' },
        { id: 'tab-stat-dist-portrait', panel: 'panel-stat-dist-portrait', key: 'portrait' }
      ];

      mainTabs.forEach(t => {
        const tabEl = document.getElementById(t.id);
        const panelEl = document.getElementById(t.panel);
        const isActive = (statDistState.mainTab === t.key);

        if (tabEl) {
          if (isActive) {
            tabEl.className = 'px-3.5 py-1.5 rounded-t-lg font-bold text-xs transition border-b-2 border-purple-500 text-purple-200 bg-purple-950/60 flex items-center gap-1.5 cursor-pointer whitespace-nowrap';
          } else {
            tabEl.className = 'px-3.5 py-1.5 rounded-t-lg font-bold text-xs transition border-b-2 border-transparent text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap';
          }
        }

        if (panelEl) {
          if (isActive) panelEl.classList.remove('hidden');
          else panelEl.classList.add('hidden');
        }
      });

      // 2. Yetenek Skorları sekmesindeyse alt modu işlet
      if (statDistState.mainTab === 'abilities') {
        setStatDistAbilityMode(statDistState.abilityMode || 'manual');
      }
    }

    function setStatDistAbilityMode(subMode) {
      statDistState.abilityMode = subMode;

      const subTabs = [
        { id: 'subtab-ability-manual', panel: 'panel-stat-dist-manual', key: 'manual' },
        { id: 'subtab-ability-pointbuy', panel: 'panel-stat-dist-pointbuy', key: 'pointbuy' },
        { id: 'subtab-ability-roll', panel: 'panel-stat-dist-roll', key: 'roll' }
      ];

      subTabs.forEach(t => {
        const btnEl = document.getElementById(t.id);
        const panelEl = document.getElementById(t.panel);
        const isActive = (t.key === subMode);

        if (btnEl) {
          if (isActive) {
            btnEl.className = 'flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer bg-purple-900/60 text-purple-200 border border-purple-500/50 shadow-sm';
          } else {
            btnEl.className = 'flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200 border border-transparent';
          }
        }

        if (panelEl) {
          if (isActive) panelEl.classList.remove('hidden');
          else panelEl.classList.add('hidden');
        }
      });

      // Yetenek Paneli İçeriğini Render Et
      if (subMode === 'manual') {
        renderManualStatsPanel();
      } else if (subMode === 'pointbuy') {
        STAT_KEYS.forEach(s => {
          let val = Number(statDistState.workingAbilities[s.key]) || 10;
          if (val < 8) val = 8;
          if (val > 18) val = 18;
          statDistState.workingAbilities[s.key] = val;
        });
        renderPointBuyPanel();
      } else if (subMode === 'roll') {
        if (!statDistState.rolledDice || statDistState.rolledDice.length === 0) {
          rollAll4d6Stats();
        } else {
          renderRolledStatsPanel();
        }
      }

      const previewWrapper = document.getElementById('stat-dist-preview-wrapper');
      if (previewWrapper) previewWrapper.classList.remove('hidden');

      renderStatDistPreviewRow();
    }

function renderManualStatsPanel() {
      const container = document.getElementById('manual-stats-container');
      if (!container) return;

      container.innerHTML = STAT_KEYS_TWO_COL.map(s => {
        const val = Number(statDistState.workingAbilities[s.key]) || 10;
        const mod = Math.floor((val - 10) / 2);
        const modStr = (mod >= 0 ? '+' : '') + mod;
        return `
          <div class="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-10 text-center font-black text-xs font-mono px-1.5 py-0.5 rounded bg-purple-950/70 border border-purple-800 text-purple-300">${s.label}</span>
              <div>
                <div class="text-[11px] font-bold text-slate-200 leading-tight">${s.name}</div>
                <div class="text-[10px] text-slate-400 font-mono">Mod: <strong class="${mod >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${modStr}</strong></div>
              </div>
            </div>
            <div class="flex items-center gap-1.5">
              <button type="button" onclick="adjustManualStat('${s.key}', -1)" class="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-sm flex items-center justify-center transition cursor-pointer">－</button>
              <input type="number" min="1" max="50" value="${val}" onchange="setManualStatInput('${s.key}', this.value)" class="w-12 h-7 bg-slate-950 border border-slate-700 rounded text-center text-amber-400 font-mono font-bold text-sm focus:border-purple-500 focus:outline-none">
              <button type="button" onclick="adjustManualStat('${s.key}', 1)" class="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-sm flex items-center justify-center transition cursor-pointer">＋</button>
            </div>
          </div>
        `;
      }).join('');
    }

    function adjustManualStat(key, delta) {
      const current = Number(statDistState.workingAbilities[key]) || 10;
      const next = Math.max(1, Math.min(50, current + delta));
      statDistState.workingAbilities[key] = next;
      renderManualStatsPanel();
      renderStatDistPreviewRow();
    }

    function setManualStatInput(key, value) {
      let val = parseInt(value, 10);
      if (isNaN(val)) val = 10;
      val = Math.max(1, Math.min(50, val));
      statDistState.workingAbilities[key] = val;
      renderManualStatsPanel();
      renderStatDistPreviewRow();
    }

    function setEliteArrayStats() {
      // D&D 3.5e Elite Array: 15, 14, 13, 12, 10, 8
      statDistState.workingAbilities = {
        str: 15,
        dex: 14,
        con: 13,
        int: 12,
        wis: 10,
        cha: 8
      };
      renderManualStatsPanel();
      renderStatDistPreviewRow();
      if (typeof showDiceTopToast === 'function') {
        showDiceTopToast({
          icon: '⭐',
          title: 'Elite Array Applied',
          breakdown: 'STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8'
        });
      }
    }

    function resetStatsToCurrent() {
      statDistState.workingAbilities = {
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10
      };
      if (statDistState.mode === 'manual') {
        renderManualStatsPanel();
      } else if (statDistState.mode === 'pointbuy') {
        renderPointBuyPanel();
      } else if (statDistState.mode === 'roll') {
        if (statDistState.rolledDice) {
          statDistState.rolledDice.forEach(r => r.assignedTo = null);
        }
        renderRolledStatsPanel();
      }
      renderStatDistPreviewRow();
      if (typeof showDiceTopToast === 'function') {
        showDiceTopToast({
          icon: typeof getDiceIconSvg === 'function' ? getDiceIconSvg('20', 'w-6 h-6 text-amber-400') : '↺',
          title: 'Ability Scores Reset',
          breakdown: 'All base ability scores reset to 10.'
        });
      }
    }

    // --- 2. POINT BUY (D&D 3.5e DMG p. 169) ---
    function getPointBuyCost(score) {
      if (score <= 8) return 0;
      if (score >= 18) return 16;
      return POINT_BUY_COST_TABLE[score] ?? 0;
    }

    function onPointBuyPresetChange() {
      const select = document.getElementById('pointbuy-preset-select');
      const customInput = document.getElementById('pointbuy-custom-budget');
      if (!select) return;

      if (select.value === 'custom') {
        if (customInput) customInput.classList.remove('hidden');
        statDistState.pointBuyBudget = parseInt(customInput?.value, 10) || 28;
      } else {
        if (customInput) customInput.classList.add('hidden');
        statDistState.pointBuyBudget = parseInt(select.value, 10) || 28;
      }
      calculatePointBuy();
    }

    function calculatePointBuy() {
      const customInput = document.getElementById('pointbuy-custom-budget');
      const select = document.getElementById('pointbuy-preset-select');
      if (select && select.value === 'custom' && customInput) {
        statDistState.pointBuyBudget = parseInt(customInput.value, 10) || 28;
      }

      let spent = 0;
      STAT_KEYS.forEach(s => {
        const val = Number(statDistState.workingAbilities[s.key]) || 8;
        spent += getPointBuyCost(val);
      });

      const budget = statDistState.pointBuyBudget || 28;
      const remaining = budget - spent;

      const remEl = document.getElementById('pointbuy-remaining-pts');
      const totEl = document.getElementById('pointbuy-total-pts');
      const badgeEl = document.getElementById('pointbuy-summary-badge');

      if (remEl) remEl.textContent = remaining;
      if (totEl) totEl.textContent = budget;

      if (badgeEl) {
        if (remaining === 0) {
          badgeEl.className = 'px-2.5 py-1 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 bg-emerald-950 text-emerald-300 border border-emerald-600';
          badgeEl.innerHTML = `<span>✅ Balanced: <strong>0</strong> / ${budget} Pts</span>`;
        } else if (remaining > 0) {
          badgeEl.className = 'px-2.5 py-1 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 bg-amber-950 text-amber-300 border border-amber-600';
          badgeEl.innerHTML = `<span>⏳ Remaining: <strong>${remaining}</strong> / ${budget} Pts</span>`;
        } else {
          badgeEl.className = 'px-2.5 py-1 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 bg-rose-950 text-rose-300 border border-rose-600 animate-pulse';
          badgeEl.innerHTML = `<span>⚠️ Over Budget: <strong>${remaining}</strong> / ${budget} Points!</span>`;
        }
      }
    }

    function renderPointBuyPanel() {
      const container = document.getElementById('pointbuy-stats-container');
      if (!container) return;

      container.innerHTML = STAT_KEYS_TWO_COL.map(s => {
        const val = Number(statDistState.workingAbilities[s.key]) || 8;
        const mod = Math.floor((val - 10) / 2);
        const modStr = (mod >= 0 ? '+' : '') + mod;
        const cost = getPointBuyCost(val);
        const nextCost = val < 18 ? getPointBuyCost(val + 1) - cost : 0;

        return `
          <div class="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-10 text-center font-black text-xs font-mono px-1.5 py-0.5 rounded bg-purple-950/70 border border-purple-800 text-purple-300">${s.label}</span>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-slate-200">${s.name}</span>
                  <span class="text-[10px] text-slate-400 font-mono">Mod: <strong class="${mod >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${modStr}</strong></span>
                </div>
                <div class="text-[10px] text-purple-300/80 font-mono">Cost: <strong class="text-amber-400">${cost} pt</strong> ${val < 18 ? `(Next +1: ${nextCost} pt)` : '(Max 18)'}</div>
              </div>
            </div>
            <div class="flex items-center gap-1.5">
              <button type="button" onclick="adjustPointBuyStat('${s.key}', -1)" ${val <= 8 ? 'disabled' : ''} class="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 text-slate-200 font-bold text-sm flex items-center justify-center transition cursor-pointer">－</button>
              <span class="w-8 text-center text-amber-400 font-mono font-black text-base">${val}</span>
              <button type="button" onclick="adjustPointBuyStat('${s.key}', 1)" ${val >= 18 ? 'disabled' : ''} class="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 text-slate-200 font-bold text-sm flex items-center justify-center transition cursor-pointer">＋</button>
            </div>
          </div>
        `;
      }).join('');

      calculatePointBuy();
    }

    function adjustPointBuyStat(key, delta) {
      const current = Number(statDistState.workingAbilities[key]) || 8;
      const next = Math.max(8, Math.min(18, current + delta));
      statDistState.workingAbilities[key] = next;
      renderPointBuyPanel();
      renderStatDistPreviewRow();
    }

    // --- 3. 4d6 DROP LOWEST MODE ---
    function rollSingle4d6StatObj(id, assignedTo) {
      let rolls;
      let rerollCount = 0;
      while (true) {
        rolls = [
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1
        ];
        const onesCount = rolls.filter(r => r === 1).length;
        if (onesCount >= 2) {
          rerollCount++;
          continue;
        }
        break;
      }
      let minVal = 7;
      let minIdx = -1;
      rolls.forEach((r, idx) => {
        if (r < minVal) {
          minVal = r;
          minIdx = idx;
        }
      });
      const total = rolls.reduce((acc, cur, idx) => (idx === minIdx ? acc : acc + cur), 0);
      return {
        id,
        rolls,
        droppedIndex: minIdx,
        total,
        assignedTo,
        rerollsDueToDoubleOnes: rerollCount
      };
    }

    function rerollSingle4d6Stat(rollId) {
      const targetId = parseInt(rollId, 10);
      const targetRoll = (statDistState.rolledDice || []).find(r => r.id === targetId);
      if (!targetRoll) return;

      const newRoll = rollSingle4d6StatObj(targetRoll.id, targetRoll.assignedTo);
      const idx = statDistState.rolledDice.findIndex(r => r.id === targetId);
      if (idx !== -1) {
        statDistState.rolledDice[idx] = newRoll;
        if (newRoll.assignedTo) {
          statDistState.workingAbilities[newRoll.assignedTo] = newRoll.total;
        }
      }

      renderRolledStatsPanel();
      renderStatDistPreviewRow();

      if (typeof showDiceTopToast === 'function') {
        const statLabel = targetRoll.assignedTo ? targetRoll.assignedTo.toUpperCase() : 'Stat';
        const rerollNote = newRoll.rerollsDueToDoubleOnes > 0 
          ? ` (Rerolled ${newRoll.rerollsDueToDoubleOnes}x due to double 1s)` 
          : '';
        showDiceTopToast({
          icon: '⚡',
          title: `${statLabel} Rerolled: ${newRoll.total}`,
          breakdown: `New Rolls: [${newRoll.rolls.join(', ')}] (Dropped: ${newRoll.rolls[newRoll.droppedIndex]})${rerollNote}`
        });
      }
    }

    function rollAll4d6Stats() {
      const order = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
      const newPool = [];
      let totalDoubleOneRerolls = 0;
      for (let i = 0; i < 6; i++) {
        const rollObj = rollSingle4d6StatObj(i, order[i]);
        totalDoubleOneRerolls += rollObj.rerollsDueToDoubleOnes;
        newPool.push(rollObj);
        statDistState.workingAbilities[order[i]] = rollObj.total;
      }
      statDistState.rolledDice = newPool;
      renderRolledStatsPanel();
      renderStatDistPreviewRow();

      if (typeof showDiceTopToast === 'function') {
        const rerollNote = totalDoubleOneRerolls > 0 
          ? ` (Auto-rerolled ${totalDoubleOneRerolls}x due to double 1s rule)`
          : '';
        showDiceTopToast({
          icon: '⚡',
          title: 'Rolled 4d6 Drop Lowest',
          breakdown: `Rolled 4d6 (drop lowest) for all six ability scores${rerollNote}.`
        });
      }
    }

    function autoAssignRolledStats(silent = false) {
      if (!statDistState.rolledDice || statDistState.rolledDice.length < 6) return;

      const sortedPool = [...statDistState.rolledDice].sort((a, b) => b.total - a.total);

      const charClass = ((character && character.class) || (character && character.progression?.[0]?.className) || '').toLowerCase();
      let priority = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

      if (charClass.includes('wizard')) priority = ['int', 'con', 'dex', 'wis', 'cha', 'str'];
      else if (charClass.includes('sorcerer')) priority = ['cha', 'con', 'dex', 'wis', 'int', 'str'];
      else if (charClass.includes('cleric')) priority = ['wis', 'con', 'str', 'cha', 'dex', 'int'];
      else if (charClass.includes('druid')) priority = ['wis', 'con', 'dex', 'str', 'int', 'cha'];
      else if (charClass.includes('rogue')) priority = ['dex', 'con', 'int', 'wis', 'str', 'cha'];
      else if (charClass.includes('fighter') || charClass.includes('barbarian')) priority = ['str', 'con', 'dex', 'wis', 'int', 'cha'];
      else if (charClass.includes('paladin')) priority = ['str', 'cha', 'con', 'wis', 'dex', 'int'];
      else if (charClass.includes('monk')) priority = ['wis', 'dex', 'str', 'con', 'int', 'cha'];
      else if (charClass.includes('bard')) priority = ['cha', 'dex', 'con', 'int', 'wis', 'str'];
      else if (charClass.includes('ranger')) priority = ['dex', 'wis', 'con', 'str', 'int', 'cha'];

      priority.forEach((statKey, idx) => {
        const rollObj = sortedPool[idx];
        if (rollObj) {
          rollObj.assignedTo = statKey;
          statDistState.workingAbilities[statKey] = rollObj.total;
        }
      });

      renderRolledStatsPanel();
      renderStatDistPreviewRow();

      if (!silent && typeof showDiceTopToast === 'function') {
        showDiceTopToast({
          icon: '⚡',
          title: 'Scores Auto-Assigned',
          breakdown: `Highest rolls automatically assigned to primary ability scores for class (${character.class || 'General'}).`
        });
      }
    }

    function onRolledStatSelect(targetStatKey, rollId) {
      const targetRollId = parseInt(rollId, 10);
      const chosenRoll = statDistState.rolledDice.find(r => r.id === targetRollId);
      if (!chosenRoll) return;

      const prevOwner = statDistState.rolledDice.find(r => r.assignedTo === targetStatKey);
      const otherStatKey = chosenRoll.assignedTo;

      if (otherStatKey && otherStatKey !== targetStatKey) {
        if (prevOwner) {
          prevOwner.assignedTo = otherStatKey;
          statDistState.workingAbilities[otherStatKey] = prevOwner.total;
        } else {
          chosenRoll.assignedTo = null;
        }
      }

      chosenRoll.assignedTo = targetStatKey;
      statDistState.workingAbilities[targetStatKey] = chosenRoll.total;

      renderRolledStatsPanel();
      renderStatDistPreviewRow();
    }

    function renderRolledStatsPanel() {
      const cardsBox = document.getElementById('rolled-dice-cards-box');
      if (cardsBox && statDistState.rolledDice.length > 0) {
        cardsBox.innerHTML = STAT_KEYS.map(s => {
          const r = statDistState.rolledDice.find(item => item.assignedTo === s.key);
          if (!r) {
            return `
              <div class="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2 flex flex-col items-center justify-between">
                <span class="text-[9px] font-mono text-purple-300 uppercase px-1.5 py-0.2 rounded bg-purple-950 border border-purple-800">${s.label}</span>
                <div class="text-lg font-black text-slate-500 font-mono my-1">-</div>
                <div class="text-[10px] text-slate-500 font-mono">Unassigned</div>
              </div>
            `;
          }
          const diceHtml = r.rolls.map((d, idx) => {
            const isDropped = (idx === r.droppedIndex);
            if (isDropped) {
              return `<span class="line-through text-rose-500/70 font-mono text-[10px] bg-rose-950/40 px-1 rounded" title="Dropped lowest die: ${d}">${d}</span>`;
            }
            return `<span class="text-amber-300 font-mono font-bold text-xs bg-slate-900 border border-slate-700 px-1 rounded">${d}</span>`;
          }).join(' ');

          return `
            <div class="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2 flex flex-col items-center justify-between">
              <div class="w-full flex items-center justify-between">
                <span class="text-[9px] font-mono text-purple-300 uppercase px-1.5 py-0.2 rounded bg-purple-950 border border-purple-800">${s.label}</span>
                <button type="button" onclick="rerollSingle4d6Stat(${r.id})" class="text-slate-400 hover:text-amber-300 active:scale-95 text-xs p-0.5 rounded hover:bg-slate-800 transition cursor-pointer" title="Reroll 4d6 for ${s.label} only (auto-rerolls if two or more 1s are rolled)">⚡</button>
              </div>
              <div class="text-lg font-black text-amber-400 font-mono my-1">${r.total}</div>
              <div class="flex items-center gap-1 justify-center">${diceHtml}</div>
            </div>
          `;
        }).join('');
      }

      const assignBox = document.getElementById('rolled-assign-container');
      if (assignBox) {
        assignBox.innerHTML = STAT_KEYS_TWO_COL.map(s => {
          const assignedRoll = statDistState.rolledDice.find(r => r.assignedTo === s.key);
          const val = assignedRoll ? assignedRoll.total : (Number(statDistState.workingAbilities[s.key]) || 10);
          const mod = Math.floor((val - 10) / 2);
          const modStr = (mod >= 0 ? '+' : '') + mod;

          const optionsHtml = statDistState.rolledDice.map(r => {
            const isSelected = (r.assignedTo === s.key);
            const otherOwner = (r.assignedTo && r.assignedTo !== s.key) ? `(${r.assignedTo.toUpperCase()})` : '';
            return `<option value="${r.id}" ${isSelected ? 'selected' : ''}>Total: ${r.total} [${r.rolls.join(',')}] ${otherOwner}</option>`;
          }).join('');

          return `
            <div class="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-10 text-center font-black text-xs font-mono px-1.5 py-0.5 rounded bg-purple-950/70 border border-purple-800 text-purple-300">${s.label}</span>
                <div>
                  <div class="text-[11px] font-bold text-slate-200 leading-tight">${s.name}</div>
                  <div class="text-[10px] text-slate-400 font-mono">Final: <strong class="text-amber-400 font-bold">${val}</strong> (${modStr})</div>
                </div>
              </div>
              <select onchange="onRolledStatSelect('${s.key}', this.value)" class="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono font-bold cursor-pointer max-w-[130px]">
                ${optionsHtml}
              </select>
            </div>
          `;
        }).join('');
      }
    }

    // --- ORTAK ÖNİZLEME VE KAYIT ---
    function renderStatDistPreviewRow() {
      const previewContainer = document.getElementById('stat-dist-preview-row');
      const totalModEl = document.getElementById('stat-dist-preview-total-mod');
      if (!previewContainer) return;

      let sumMods = 0;

      // Resolve selected race object for accurate preview
      const rawSelectedRace = (document.getElementById('profile-edit-race')?.value || character?.race || '').trim();
      const curSelectedRace = rawSelectedRace.toLowerCase();
      const catalog = (typeof window.BUNDLED_SRD_CORE_CATALOG !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG))
        ? window.BUNDLED_SRD_CORE_CATALOG
        : [];
      const raceObj = (window.SrdCompendium && typeof window.SrdCompendium.getByName === 'function' ? window.SrdCompendium.getByName(rawSelectedRace, 'Race') : null)
        || catalog.find(item => item && item.type === 'Race' && (item.name || '').toLowerCase().trim() === curSelectedRace);

      // Resolve selected template objects for accurate preview
      const selectedTmplEntries = (Array.isArray(_modalSelectedTemplates) ? _modalSelectedTemplates : [])
        .map(id => resolveTemplateEntry(id))
        .filter(Boolean);

      previewContainer.innerHTML = STAT_KEYS.map(s => {
        const baseScore = Number(statDistState.workingAbilities[s.key]) || 10;
        let racialMod = (raceObj && raceObj[`${s.key}Bonus`]) ? Number(raceObj[`${s.key}Bonus`]) : 0;
        if (racialMod === 0 && raceObj && Array.isArray(raceObj.modifiers)) {
          raceObj.modifiers.forEach(m => {
            if (!m || m.condition) return;
            const t = String(m.target || '').toLowerCase();
            if (t === `ability.${s.key}` || t === s.key) racialMod += Number(m.value) || 0;
          });
        }

        let templateMod = 0;
        selectedTmplEntries.forEach(tmpl => {
          if (!tmpl || !Array.isArray(tmpl.modifiers)) return;
          tmpl.modifiers.forEach(m => {
            if (!m || m.condition) return;
            const t = String(m.target || '').toLowerCase();
            if (t === `ability.${s.key}` || t === s.key) templateMod += Number(m.value) || 0;
          });
        });
        
        // Calculate Equipment & Buff bonus difference (excluding Racial and Template ability modifiers)
        let itemBuffBonus = 0;
        if (typeof RuleEngine !== 'undefined' && RuleEngine.resolveBonusStacking && character.abilitySources?.[s.key]) {
          const nonRacialSources = (character.abilitySources[s.key] || []).filter(src => {
            if (!src) return false;
            const st = String(src.type || '').toLowerCase();
            const ss = String(src.source || '').toLowerCase();
            return st !== 'racial' && st !== 'template' && !ss.includes('(template)') && !ss.includes('(race)');
          });
          itemBuffBonus = RuleEngine.resolveBonusStacking(nonRacialSources);
        } else {
          const currentTotal = Number(character.abilities?.[s.key]) || baseScore;
          const currentBase = Number(character.baseAbilities?.[s.key]) || currentTotal;
          itemBuffBonus = currentTotal - currentBase;
        }

        const finalScore = baseScore + racialMod + templateMod + itemBuffBonus;
        const mod = Math.floor((finalScore - 10) / 2);
        const modStr = (mod >= 0 ? '+' : '') + mod;
        sumMods += mod;

        return `
          <div class="bg-slate-900 border border-slate-800 rounded-lg p-1.5 flex flex-col items-center">
            <span class="text-[9px] text-slate-400 font-bold">${s.label}</span>
            <span class="text-sm font-black text-amber-400">${finalScore}</span>
            <span class="text-[10px] font-bold ${mod >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${modStr}</span>
            <div class="text-[8px] text-slate-500 font-mono mt-0.5">
              <span>T:${baseScore}</span>
              ${racialMod !== 0 ? `<span class="${racialMod > 0 ? 'text-emerald-400' : 'text-rose-400'} ml-0.5" title="Racial Ability Adjustment">${racialMod > 0 ? '+' + racialMod : racialMod}</span>` : ''}
              ${templateMod !== 0 ? `<span class="${templateMod > 0 ? 'text-sky-400' : 'text-rose-400'} ml-0.5" title="Template Ability Adjustment">${templateMod > 0 ? '+' + templateMod : templateMod}</span>` : ''}
              ${itemBuffBonus !== 0 ? `<span class="text-purple-400 ml-0.5" title="Gear &amp; Active Buffs">${itemBuffBonus > 0 ? '+' + itemBuffBonus : itemBuffBonus}</span>` : ''}
            </div>
          </div>
        `;
      }).join('');

      if (totalModEl) {
        totalModEl.textContent = `Total Mod: ${sumMods >= 0 ? '+' : ''}${sumMods}`;
      }
    }

    function saveStatDistribution() {
      if (!character) return;

      // 1. Kimlik ve profil alanlarini kaydet
      const getVal = id => document.getElementById(id)?.value?.trim();
      
      const newName = getVal('profile-edit-name');
      if (newName) character.name = newName;

      const newRace = getVal('profile-edit-race');
      if (newRace && !newRace.toLowerCase().includes('diğer')) {
        const oldRace = character.race;
        character.race = newRace;

        // Auto-sync racial traits into character.specialAbilities
        const catalog = (typeof window.BUNDLED_SRD_CORE_CATALOG !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG))
          ? window.BUNDLED_SRD_CORE_CATALOG
          : [];
        const raceObj = (window.SrdCompendium && typeof window.SrdCompendium.getByName === 'function' ? window.SrdCompendium.getByName(newRace, 'Race') : null)
          || catalog.find(item => item && item.type === 'Race' && (item.name.toLowerCase() === newRace.toLowerCase() || item.name.toLowerCase().includes(newRace.toLowerCase())));

        if (raceObj) {
          if (!character.size || (oldRace && oldRace.toLowerCase() !== newRace.toLowerCase())) {
            if (raceObj.size) character.size = raceObj.size;
          }
          if (!character.baseSpeed || (oldRace && oldRace.toLowerCase() !== newRace.toLowerCase())) {
            if (raceObj.baseSpeed) character.baseSpeed = raceObj.baseSpeed;
          }

          if (!Array.isArray(character.specialAbilities)) character.specialAbilities = [];

          // Clean up any traits from an old race if race was changed
          if (oldRace && oldRace.toLowerCase() !== newRace.toLowerCase()) {
            character.specialAbilities = character.specialAbilities.filter(a => {
              const src = typeof a === 'object' && a.source ? a.source.toLowerCase() : '';
              return !src.includes('race') || src.includes(newRace.toLowerCase());
            });
          }

          // Add new race traits (duplicate-safe)
          if (Array.isArray(raceObj.traits)) {
            raceObj.traits.forEach(t => {
              const traitFullName = `${t.name} (${raceObj.name})`;
              const alreadyExists = character.specialAbilities.some(a => {
                const aName = (typeof a === 'string' ? a : (a.name || '')).toLowerCase();
                return aName === traitFullName.toLowerCase() || aName === t.name.toLowerCase();
              });
              if (!alreadyExists) {
                character.specialAbilities.push({
                  name: traitFullName,
                  source: `${raceObj.name} Race`,
                  benefit: t.desc || '',
                  action: 'Passive',
                  duration: 'Continuous',
                  active: true
                });
              }
            });
          }

          // Racial ability modifiers are handled dynamically and automatically by RuleEngine.recalculateCharacter()
        }
      }

      // 1.5. Persist Selected Character Templates & Sync Template Special Abilities
      character.templates = Array.isArray(_modalSelectedTemplates) ? [..._modalSelectedTemplates] : [];
      if (typeof syncCharacterTemplateAbilities === 'function') {
        syncCharacterTemplateAbilities();
      }

      const newAlign = getVal('profile-edit-alignment');
      if (newAlign) character.alignment = newAlign;

      const newDeity = getVal('profile-edit-deity');
      if (newDeity !== undefined) character.deity = newDeity;

      // Sync Cleric Domains, War Domain Favored Weapon, and Spontaneous Channel (Cure/Inflict) when Alignment or Deity changes
      if (typeof syncClericDomainsToCharacterSpecialAbilities === 'function') {
        syncClericDomainsToCharacterSpecialAbilities();
      }
      if (typeof resolveClericEnergyPolicy === 'function' && character.spellcasting) {
        const policy = resolveClericEnergyPolicy(character);
        if (policy.forcedMode) {
          character.spellcasting.clericSpontaneousMode = policy.forcedMode;
        }
      }

      const newSize = document.getElementById('profile-edit-size')?.value;
      if (newSize) character.size = newSize;

      const newGender = getVal('profile-edit-gender');
      if (newGender !== undefined) character.gender = newGender;

      const newAge = parseInt(document.getElementById('profile-edit-age')?.value);
      if (!isNaN(newAge)) character.age = newAge;

      const newHeight = getVal('profile-edit-height');
      if (newHeight !== undefined) character.height = newHeight;

      const newWeight = getVal('profile-edit-weight');
      if (newWeight !== undefined) character.weight = newWeight;

      const newSpeed = parseInt(document.getElementById('profile-edit-speed')?.value);
      if (!isNaN(newSpeed) && newSpeed > 0) character.baseSpeed = newSpeed;

      // 2. Point Buy kontrolü (eğer stat modu pointbuy ise)
      if (statDistState.mode === 'pointbuy') {
        const budget = statDistState.pointBuyBudget || 28;
        let spent = 0;
        STAT_KEYS.forEach(s => {
          spent += getPointBuyCost(Number(statDistState.workingAbilities[s.key]) || 8);
        });
        if (spent > budget) {
          const proceed = confirm(`⚠️ Point Buy budget exceeded! (${spent}/${budget} points spent)\n\nDo you still want to save these ability scores?`);
          if (!proceed) return;
        }
      }

      // 3. Taban statları uygula
      if (!character.baseAbilities) character.baseAbilities = {};
      character.hasCustomBaseAbilities = true;
      STAT_KEYS.forEach(s => {
        character.baseAbilities[s.key] = Number(statDistState.workingAbilities[s.key]) || 10;
      });

      closeStatDistributionModal();

      // Recalculate everything and render
      saveStateToStorage(true);
      renderAll();

      if (typeof showDiceTopToast === 'function') {
        showDiceTopToast({
          icon: typeof getDiceIconSvg === 'function' ? getDiceIconSvg('20', 'w-6 h-6 text-amber-400') : '⚡',
          title: 'Character & Stats Saved',
          breakdown: 'Identity details and base ability scores updated. HP, AC, Attack, Skills, and Saving Throws recalculated by the rule engine.',
          total: 'SAVED'
        });
      } else {
        alert('✅ Character profile and base ability scores updated successfully!');
      }
    }

    // ==========================================
    // HP ADJUSTMENT & DICE EVALUATION HELPER
    // 1d6+5, 2d4, 1d8-1 gibi zar ifadelerini ve standart sayıları işler
    // ==========================================
    function evaluateHpAmount(expr) {
      if (expr === null || expr === undefined) return { total: 0, text: '0', isDice: false, rollDesc: '0' };
      const str = String(expr).trim();
      if (!str) return { total: 0, text: '0', isDice: false, rollDesc: '0' };

      // Zar ifadesi içeriyorsa (örn: 1d6+5, 2d4, 1d8-1)
      if (/[dD]/.test(str)) {
        if (typeof parseAndRollDiceFormula === 'function') {
          const rolled = parseAndRollDiceFormula(str);
          if (rolled && typeof rolled.grandTotal === 'number') {
            const groupStrs = (rolled.diceGroups || []).map(g => `${g.notation}: [${g.rolls.join('+')}]`);
            const modStrs = (rolled.modifiers || []).map(m => (m >= 0 ? `+${m}` : `${m}`));
            const breakdown = [...groupStrs, ...modStrs].join(' ');
            const rollDesc = `${str} (${breakdown} = ${rolled.grandTotal})`;
            return {
              total: Math.max(0, rolled.grandTotal),
              text: str,
              isDice: true,
              rollDesc: rollDesc,
              details: rolled
            };
          }
        }
      }

      // Standart sayısal veya basit aritmetik ifade
      const parsedNum = parseInt(str);
      const total = isNaN(parsedNum) ? 0 : Math.max(0, parsedNum);
      return {
        total: total,
        text: String(total),
        isDice: false,
        rollDesc: String(total)
      };
    }

    function applyDamage() {
      if (!character || !character.hp) return;
      const input = document.getElementById('hp-adjust-input');
      const evaluated = evaluateHpAmount(input?.value || '0');
      if (evaluated.total <= 0) return;
      let dmgLeft = evaluated.total;
      const curTemp = Math.max(0, Number(character.hp.temp) || 0);
      if (curTemp > 0) {
        const absorbed = Math.min(curTemp, dmgLeft);
        character.hp.temp = curTemp - absorbed;
        dmgLeft -= absorbed;
      }
      if (dmgLeft > 0) {
        character.hp.current = Math.max(-10, (Number(character.hp.current) || 0) - dmgLeft);
      }
      character.hp._lastPlayerChangeTs = Date.now();
      saveStateToStorage(true);
      renderAll();
      if (evaluated.isDice) {
        showDiceTopToast({
          icon: '💥',
          title: 'Damage Roll',
          breakdown: `${evaluated.rollDesc} • Remaining HP: ${character.hp.current}/${character.hp.max}${character.hp.temp > 0 ? ` (+${character.hp.temp} Temp)` : ''}`,
          total: `-${evaluated.total} HP`
        });
      }
    }

    function applyHeal() {
      if (!character || !character.hp) return;
      const input = document.getElementById('hp-adjust-input');
      const evaluated = evaluateHpAmount(input?.value || '0');
      if (evaluated.total <= 0) return;
      character.hp.current = Math.min(Number(character.hp.max) || 0, (Number(character.hp.current) || 0) + evaluated.total);
      character.hp._lastPlayerChangeTs = Date.now();
      saveStateToStorage(true);
      renderAll();
      if (evaluated.isDice) {
        showDiceTopToast({
          icon: '💖',
          title: 'Healing Roll',
          breakdown: `${evaluated.rollDesc} • Current HP: ${character.hp.current}/${character.hp.max}`,
          total: `+${evaluated.total} HP`
        });
      }
    }

    function clearTempHp() {
      if (!character || !character.hp) return;
      const curTemp = Number(character.hp.temp) || 0;
      if (curTemp <= 0) return;
      character.hp.temp = 0;
      character.hp._lastPlayerChangeTs = Date.now();
      saveStateToStorage(true);
      renderAll();
      showDiceTopToast({
        icon: '🛡️',
        title: 'Temp HP Cleared',
        breakdown: `Temporary HP (+${curTemp}) removed • Current HP: ${character.hp.current}/${character.hp.max}`,
        total: '0 Temp'
      });
    }

    function applySpellHealToSelf(amount, sourceName = 'Spell Healing') {
      if (!character || !character.hp) return;
      const healVal = Math.max(0, Number(amount) || 0);
      if (healVal <= 0) return;
      const prevHp = Number(character.hp.current) || 0;
      const maxHp = Number(character.hp.max) || 1;
      character.hp.current = Math.min(maxHp, prevHp + healVal);
      character.hp._lastPlayerChangeTs = Date.now();
      const actualGain = character.hp.current - prevHp;
      saveStateToStorage(true);
      renderAll();
      showDiceTopToast({
        icon: '💚',
        title: `${sourceName} Applied`,
        breakdown: `Hit Points: ${prevHp} ➔ ${character.hp.current} / ${maxHp} (+${actualGain} HP)`,
        total: `+${healVal} HP`
      });
    }

    function applySpellTempHpToSelf(amount, sourceName = 'Temp HP') {
      if (!character || !character.hp) return;
      const tempVal = Math.max(0, Number(amount) || 0);
      if (tempVal <= 0) return;
      const prevTemp = Math.max(0, Number(character.hp.temp) || 0);
      character.hp.temp = prevTemp + tempVal;
      character.hp._lastPlayerChangeTs = Date.now();
      let extraBuffNote = '';
      if (typeof window.applySpellBuffToCharacter === 'function' && typeof RuleEngine !== 'undefined' && RuleEngine.resolveSpellBuffSpec) {
        const bSpec = RuleEngine.resolveSpellBuffSpec({ name: sourceName }, character);
        if (bSpec && bSpec.isBuffSpell && Array.isArray(bSpec.modifiers) && bSpec.modifiers.length > 0) {
          window.applySpellBuffToCharacter({ name: sourceName }, bSpec.casterLevel, { skipTempHp: true, silentToast: true });
          extraBuffNote = ` • Buff Active (${bSpec.summaryText})`;
        }
      }
      saveStateToStorage(true);
      renderAll();
      showDiceTopToast({
        icon: '🛡️',
        title: `${sourceName} (Temp HP)`,
        breakdown: `Temporary HP: +${character.hp.temp} Temp HP${extraBuffNote} • Base HP: ${character.hp.current}/${character.hp.max}`,
        total: `+${tempVal} Temp`
      });
    }

    function applySpellSelfDamage(amount, sourceName = 'Blood Sacrifice', showToast = true, toastOptions = { stack: true }) {
      if (!character || !character.hp) return;
      let dmgLeft = Math.max(0, Number(amount) || 0);
      if (dmgLeft <= 0) return;
      const curTemp = Math.max(0, Number(character.hp.temp) || 0);
      if (curTemp > 0) {
        const absorbed = Math.min(curTemp, dmgLeft);
        character.hp.temp = curTemp - absorbed;
        dmgLeft -= absorbed;
      }
      if (dmgLeft > 0) {
        character.hp.current = Math.max(-10, (Number(character.hp.current) || 0) - dmgLeft);
      }
      saveStateToStorage(true);
      renderAll();
      if (showToast) {
        showDiceTopToast({
        icon: '🩸',
        title: `${sourceName} (-${amount} HP)`,
        breakdown: `Self-Damage Applied • Remaining HP: ${character.hp.current}/${character.hp.max}`,
        total: `-${amount} HP`
        }, { stack: true, ...(toastOptions || {}) });
    }
    }

    // ==========================================
    // PERIODIC HP EFFECTS (DoT / HoT - Tur Başı Can Etkileri)
    // DB'ye kaydedilmeden karakter oturum state'inde çalışır
    // 1d6+5 gibi zar formüllerini destekler
    // ==========================================
    const PERIODIC_HP_PRESETS = {
      damage: [
        { name: 'Poison', amount: '1d4', rounds: 3, infinite: false, icon: '🧪' },
        { name: 'Fire / Burn', amount: '1d6', rounds: 2, infinite: false, icon: '🔥' },
        { name: 'Bleed', amount: '1', rounds: 5, infinite: false, icon: '🩸' },
        { name: 'Acid', amount: '1d6+2', rounds: 3, infinite: false, icon: '⚡' },
        { name: 'Hex / Necrotic Damage', amount: '1d6+5', rounds: 3, infinite: false, icon: '💀' }
      ],
      heal: [
        { name: 'Fast Healing 1', amount: '1', rounds: null, infinite: true, icon: '💖' },
        { name: 'Fast Healing 2', amount: '2', rounds: null, infinite: true, icon: '💖' },
        { name: 'Regeneration 1', amount: '1', rounds: null, infinite: true, icon: '✨' },
        { name: 'Lesser Vigor', amount: '1', rounds: 11, infinite: false, icon: '🌿' },
        { name: 'Healing Spirit', amount: '1d8+1', rounds: 5, infinite: false, icon: '🌿' }
      ]
    };

    let currentPeriodicMode = 'damage';

    function openPeriodicHpModal(defaultMode = null) {
      if (defaultMode) {
        setPeriodicMode(defaultMode);
      } else {
        setPeriodicMode(currentPeriodicMode || 'damage');
      }

      // Pre-fill amount from HUD quick input if available
      const hudInput = document.getElementById('hp-adjust-input');
      const inputAmt = document.getElementById('periodic-input-amount');
      if (hudInput && inputAmt && hudInput.value.trim()) {
        inputAmt.value = hudInput.value.trim();
      }

      const applyNowCheck = document.getElementById('periodic-input-apply-now');
      if (applyNowCheck) applyNowCheck.checked = false;

      renderPeriodicModalActiveList();
      const modal = document.getElementById('periodic-hp-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
      }
    }

    function closePeriodicHpModal() {
      const modal = document.getElementById('periodic-hp-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
      }
    }

    function setPeriodicMode(mode) {
      currentPeriodicMode = mode;
      const btnDmg = document.getElementById('btn-periodic-mode-damage');
      const btnHeal = document.getElementById('btn-periodic-mode-heal');
      const lblAmt = document.getElementById('periodic-label-amount');
      const btnSave = document.getElementById('btn-save-periodic');

      if (mode === 'damage') {
        if (btnDmg) {
          btnDmg.className = 'flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition border bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-500 shadow-md cursor-pointer';
        }
        if (btnHeal) {
          btnHeal.className = 'flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition border bg-slate-900 text-slate-400 border-slate-700 hover:text-white cursor-pointer';
        }
        if (lblAmt) {
          lblAmt.textContent = 'Damage per Round (HP / 1d6+5) *';
          lblAmt.className = 'block text-[10px] font-bold text-rose-400 uppercase mb-1';
        }
        if (btnSave) {
          btnSave.className = 'px-4 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-lg text-xs font-bold transition shadow flex items-center gap-1.5 cursor-pointer';
        }
      } else {
        if (btnHeal) {
          btnHeal.className = 'flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition border bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-md cursor-pointer';
        }
        if (btnDmg) {
          btnDmg.className = 'flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition border bg-slate-900 text-slate-400 border-slate-700 hover:text-white cursor-pointer';
        }
        if (lblAmt) {
          lblAmt.textContent = 'Healing per Round (HP / 1d6+5) *';
          lblAmt.className = 'block text-[10px] font-bold text-emerald-400 uppercase mb-1';
        }
        if (btnSave) {
          btnSave.className = 'px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold transition shadow flex items-center gap-1.5 cursor-pointer';
        }
      }

      renderPeriodicPresets();
    }

    function renderPeriodicPresets() {
      const container = document.getElementById('periodic-presets-container');
      if (!container) return;
      const presets = PERIODIC_HP_PRESETS[currentPeriodicMode] || [];
      container.innerHTML = presets.map((p, idx) => {
        const isDmg = currentPeriodicMode === 'damage';
        const colorClass = isDmg 
          ? 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border-rose-700/50 hover:border-rose-500' 
          : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border-emerald-700/50 hover:border-emerald-500';
        const durLabel = p.infinite ? '∞' : `${p.rounds}rd`;
        const sign = isDmg ? '-' : '+';
        return `
          <button type="button" onclick="applyPeriodicPreset(${idx})" class="px-2 py-1 rounded text-[10px] font-bold border transition flex items-center gap-1 ${colorClass} cursor-pointer active:scale-95 shadow-sm">
            <span>${p.icon}</span>
            <span>${p.name}</span>
            <span class="opacity-75 font-mono">(${sign}${p.amount} / ${durLabel})</span>
          </button>
        `;
      }).join('');
    }

    function applyPeriodicPreset(index) {
      const presets = PERIODIC_HP_PRESETS[currentPeriodicMode];
      if (!presets || !presets[index]) return;
      const p = presets[index];

      const nameInput = document.getElementById('periodic-input-name');
      const amtInput = document.getElementById('periodic-input-amount');
      const roundsInput = document.getElementById('periodic-input-rounds');
      const infCheck = document.getElementById('periodic-input-infinite');

      if (nameInput) nameInput.value = p.name;
      if (amtInput) amtInput.value = p.amount;

      if (p.infinite) {
        if (infCheck) infCheck.checked = true;
        togglePeriodicInfinite(true);
      } else {
        if (infCheck) infCheck.checked = false;
        togglePeriodicInfinite(false);
        if (roundsInput) roundsInput.value = p.rounds || 3;
      }
    }

    function togglePeriodicInfinite(isInfinite) {
      const roundsInput = document.getElementById('periodic-input-rounds');
      if (roundsInput) {
        roundsInput.disabled = isInfinite;
        if (isInfinite) {
          roundsInput.classList.add('opacity-40', 'cursor-not-allowed');
        } else {
          roundsInput.classList.remove('opacity-40', 'cursor-not-allowed');
          if (!roundsInput.value || roundsInput.value === '0') roundsInput.value = 3;
        }
      }
    }

    function savePeriodicHpEffect() {
      if (!character) return;
      const nameInput = document.getElementById('periodic-input-name');
      const amtInput = document.getElementById('periodic-input-amount');
      const roundsInput = document.getElementById('periodic-input-rounds');
      const infCheck = document.getElementById('periodic-input-infinite');
      const applyNowCheck = document.getElementById('periodic-input-apply-now');

      const name = (nameInput?.value || '').trim() || (currentPeriodicMode === 'damage' ? 'Damage (DoT)' : 'Healing (HoT)');
      const rawAmount = (amtInput?.value || '1').trim();
      const isInfinite = infCheck?.checked || false;
      const rounds = isInfinite ? null : Math.max(1, parseInt(roundsInput?.value) || 1);
      const applyNow = applyNowCheck?.checked || false;

      if (!Array.isArray(character.periodicHpEffects)) {
        character.periodicHpEffects = [];
      }

      const eff = {
        id: 'pe_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: name,
        type: currentPeriodicMode,
        amount: rawAmount,
        roundsTotal: rounds,
        roundsLeft: rounds,
        createdAtRound: Number(character.encounterRound) || 1
      };

      let initialRollDesc = '';
      if (applyNow) {
        const evalRes = evaluateHpAmount(rawAmount);
        if (evalRes.total > 0) {
          if (currentPeriodicMode === 'damage') {
            character.hp.current = Math.max(-10, (Number(character.hp.current) || 0) - evalRes.total);
          } else {
            character.hp.current = Math.min(Number(character.hp.max) || 0, (Number(character.hp.current) || 0) + evalRes.total);
          }
          initialRollDesc = evalRes.isDice ? ` [Roll: ${evalRes.rollDesc}]` : ` (${evalRes.total} HP)`;
        }
        if (eff.roundsLeft !== null) {
          eff.roundsLeft--;
        }
      }

      if (eff.roundsLeft === null || eff.roundsLeft > 0) {
        character.periodicHpEffects.push(eff);
      }

      // Close modal immediately so user sees popup close
      closePeriodicHpModal();

      // Reset form input for next time
      if (nameInput) nameInput.value = '';

      saveStateToStorage(true);
      renderAll();

      // Clear feedback alert
      const typeText = currentPeriodicMode === 'damage' ? 'Damage (DoT)' : 'Healing (HoT)';
      const icon = currentPeriodicMode === 'damage' ? '🩸' : '💖';
      const durInfo = eff.roundsTotal !== null ? `${eff.roundsTotal} Rounds` : 'Permanent';
      const rateSign = currentPeriodicMode === 'damage' ? '-' : '+';

      let feedback = `✅ ${icon} "${name}" ${typeText} effect added!\n\n` +
                     `• Amount per Round: ${rateSign}${rawAmount} HP\n` +
                     `• Total Duration: ${durInfo}\n` +
                     `• Remaining: ${eff.roundsLeft !== null ? eff.roundsLeft + ' Rounds' : 'Permanent'}`;

      if (applyNow) {
        feedback += `\n• Initial Tick: Applied immediately${initialRollDesc} ➔ Current HP: ${character.hp.current}/${character.hp.max}`;
      }
      feedback += `\n\n📌 This effect triggers automatically each time you advance the round (Turn ⏭️).`;

      alert(feedback);
    }

    function removePeriodicHpEffect(effId) {
      if (!character || !Array.isArray(character.periodicHpEffects)) return;
      character.periodicHpEffects = character.periodicHpEffects.filter(e => e.id !== effId);
      saveStateToStorage(true);
      renderAll();
      renderPeriodicModalActiveList();
    }

    function clearAllPeriodicHpEffects() {
      if (!character || !Array.isArray(character.periodicHpEffects) || character.periodicHpEffects.length === 0) return;
      if (confirm('Are you sure you want to clear all active periodic HP effects (DoT / HoT)?')) {
        character.periodicHpEffects = [];
        saveStateToStorage(true);
        renderAll();
        renderPeriodicModalActiveList();
      }
    }

    function renderPeriodicModalActiveList() {
      const listEl = document.getElementById('periodic-modal-active-list');
      const clearBtn = document.getElementById('btn-clear-all-periodic');
      if (!listEl) return;

      const effects = character?.periodicHpEffects || [];
      if (effects.length === 0) {
        listEl.innerHTML = '<div class="text-[10px] text-slate-500 italic p-1.5 text-center">No active periodic HP effects.</div>';
        if (clearBtn) clearBtn.classList.add('hidden');
        return;
      }

      if (clearBtn) clearBtn.classList.remove('hidden');

      listEl.innerHTML = effects.map(eff => {
        const isDmg = eff.type === 'damage';
        const colorClasses = isDmg 
          ? 'bg-rose-950/60 border-rose-800 text-rose-200' 
          : 'bg-emerald-950/60 border-emerald-800 text-emerald-200';
        const icon = isDmg ? '🩸' : '💖';
        const safeAmount = String(eff.amount || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const rate = isDmg ? `-${safeAmount} HP/rd` : `+${safeAmount} HP/rd`;
        const dur = eff.roundsLeft !== null ? `${eff.roundsLeft} rds left` : 'Permanent';
        const safeName = String(eff.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        return `
          <div class="flex items-center justify-between p-1.5 rounded-lg border ${colorClasses}">
            <div class="flex items-center gap-1.5 truncate">
              <span>${icon}</span>
              <strong class="text-white">${safeName}</strong>
              <span class="font-mono font-bold">${rate}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0 ml-1">
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-slate-900/90 text-slate-300 font-mono font-bold border border-slate-700">${dur}</span>
              <button onclick="removePeriodicHpEffect('${eff.id}')" class="text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded px-1.5 py-0.5 text-xs font-bold transition cursor-pointer" title="Remove">✕</button>
            </div>
          </div>
        `;
      }).join('');
    }

    function renderPeriodicHpEffects() {
      const container = document.getElementById('hp-periodic-list');
      const badge = document.getElementById('hp-periodic-badge');
      if (!container) return;

      const effects = character?.periodicHpEffects || [];
      if (effects.length === 0) {
        container.classList.add('hidden');
        container.innerHTML = '';
        if (badge) badge.classList.add('hidden');
        return;
      }

      container.classList.remove('hidden');
      if (badge) {
        badge.classList.remove('hidden');
        const dotCount = effects.filter(e => e.type === 'damage').length;
        const hotCount = effects.filter(e => e.type === 'heal').length;
        let bText = '';
        if (dotCount > 0 && hotCount > 0) bText = `${effects.length} Effects`;
        else if (dotCount > 0) bText = `🩸 ${dotCount} DoT`;
        else bText = `💖 ${hotCount} HoT`;
        badge.textContent = bText;
      }

      container.innerHTML = effects.map(eff => {
        const isDmg = eff.type === 'damage';
        const icon = isDmg ? '🩸' : '💚';
        const bgClass = isDmg 
          ? 'bg-rose-950/70 border-rose-700/60 text-rose-200' 
          : 'bg-emerald-950/70 border-emerald-700/60 text-emerald-200';
        const textClass = isDmg ? 'text-rose-400' : 'text-emerald-400';
        const safeName = String(eff.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const safeAmount = String(eff.amount || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const rateText = isDmg ? `-${safeAmount} HP/rd` : `+${safeAmount} HP/rd`;
        const durText = eff.roundsLeft !== null && eff.roundsLeft !== undefined 
          ? `${eff.roundsLeft}t` 
          : '∞';

        return `
          <div class="flex items-center justify-between text-[10px] border rounded px-1.5 py-0.5 ${bgClass} shadow-sm">
            <div class="flex items-center gap-1 min-w-0 truncate">
              <span class="text-[11px]">${icon}</span>
              <span class="font-bold truncate text-white" title="${safeName}">${safeName}</span>
              <span class="font-mono font-black ${textClass}">${rateText}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0 ml-1">
              <span class="text-[9px] px-1 py-0.2 rounded bg-slate-900/90 border border-slate-700 text-slate-300 font-mono font-bold">${durText}</span>
              <button onclick="removePeriodicHpEffect('${eff.id}')" class="text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded px-1 transition text-xs font-bold cursor-pointer" title="Remove Effect">✕</button>
            </div>
          </div>
        `;
      }).join('');
    }

    function renderWeapons() {
      const select = document.getElementById('active-weapon-select');
      if (!select) return;
      select.innerHTML = '';
      const weps = (character.weapons && character.weapons.length > 0) ? character.weapons : [{ name: 'Unarmed Strike', dice: '1d3', critMin: 20, critMult: 2, dmgType: 'Bludgeoning', isLight: true }];
      weps.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w.name;
        opt.textContent = w.name;
        if (w.name === character.activeWeapon) opt.selected = true;
        select.appendChild(opt);
      });
      recalculateOffense();
    }

    // ====================================================
    // COMBAT OFFENSE MODE: MELEE vs RANGED (PHYSICAL)
    // ====================================================
    window._combatOffenseMode = 'melee';

    function switchCombatOffenseMode(mode) {
      window._combatOffenseMode = mode;
      const meleePanel = document.getElementById('combat-mode-melee-panel');
      const btnMelee = document.getElementById('btn-mode-melee');
      const btnRanged = document.getElementById('btn-mode-ranged');
      const cardTitle = document.getElementById('combat-card-title');
      const profileBtn = document.getElementById('combat-profile-save-btn');

      const inactiveClass = 'h-8 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer';

      if (btnMelee) btnMelee.className = inactiveClass;
      if (btnRanged) btnRanged.className = inactiveClass;

      if (mode === 'ranged') {
        if (meleePanel) meleePanel.classList.remove('hidden');
        const meleeModsBlock = document.getElementById('combat-modifiers-melee-block');
        const rangedModsBlock = document.getElementById('combat-modifiers-ranged-block');
        if (meleeModsBlock) meleeModsBlock.classList.add('hidden');
        if (rangedModsBlock) rangedModsBlock.classList.remove('hidden');

        if (btnRanged) {
          btnRanged.className = 'h-8 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow cursor-pointer';
        }
        if (cardTitle) {
          cardTitle.innerHTML = '<span>🏹</span> <span class="truncate">ATTACK ROTATION</span>';
          cardTitle.className = 'text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5 truncate min-w-0';
        }
        const wsTitle = document.getElementById('weapon-sets-header-title');
        const wsIcon = document.getElementById('weapon-sets-header-icon');
        if (wsTitle) wsTitle.textContent = 'RANGED WEAPON SETS';
        if (wsIcon) wsIcon.textContent = '🏹';

        // Contextual Weapon Sets Persistence
        if (character && character.tactical) {
          if (character.tactical.weaponSets && (!character.tactical.mode || character.tactical.mode === 'melee')) {
            character.tactical.meleeWeaponSets = JSON.parse(JSON.stringify(character.tactical.weaponSets));
          }
          character.tactical.mode = 'ranged';
          if (character.tactical.rangedWeaponSets) {
            character.tactical.weaponSets = JSON.parse(JSON.stringify(character.tactical.rangedWeaponSets));
          } else {
            character.tactical.weaponSets = null;
          }
        }

        if (profileBtn) profileBtn.classList.remove('hidden');
        ensureWeaponSetsData();
        applyWeaponSetsConfiguration();
        renderWeaponSetsUI();
        if (typeof populateWeaponSetsEditorDropdowns === 'function') populateWeaponSetsEditorDropdowns();
        if (typeof populateRangedWeaponAndAmmoUI === 'function') populateRangedWeaponAndAmmoUI();
        if (typeof renderRangedModifiersGrid === 'function') renderRangedModifiersGrid();
        if (typeof renderCombatPins === 'function') renderCombatPins('offense_ranged');
        if (typeof renderSavedProfiles === 'function') renderSavedProfiles();
        recalculateOffense();
      } else {
        // default: melee (Yakın)
        if (meleePanel) meleePanel.classList.remove('hidden');
        const meleeModsBlock = document.getElementById('combat-modifiers-melee-block');
        const rangedModsBlock = document.getElementById('combat-modifiers-ranged-block');
        if (meleeModsBlock) meleeModsBlock.classList.remove('hidden');
        if (rangedModsBlock) rangedModsBlock.classList.add('hidden');

        if (btnMelee) {
          btnMelee.className = 'h-8 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition bg-gradient-to-r from-red-600 to-rose-600 text-white shadow cursor-pointer';
        }
        if (cardTitle) {
          cardTitle.innerHTML = '<span>⚔️</span> <span class="truncate">ATTACK ROTATION</span>';
          cardTitle.className = 'text-xs font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5 truncate min-w-0';
        }
        const wsTitle = document.getElementById('weapon-sets-header-title');
        const wsIcon = document.getElementById('weapon-sets-header-icon');
        if (wsTitle) wsTitle.textContent = 'QUICK WEAPON SETS (MELEE)';
        if (wsIcon) wsIcon.textContent = '⚔️';

        // Contextual Weapon Sets Persistence
        if (character && character.tactical) {
          if (character.tactical.weaponSets && character.tactical.mode === 'ranged') {
            character.tactical.rangedWeaponSets = JSON.parse(JSON.stringify(character.tactical.weaponSets));
          }
          character.tactical.mode = 'melee';
          if (character.tactical.meleeWeaponSets) {
            character.tactical.weaponSets = JSON.parse(JSON.stringify(character.tactical.meleeWeaponSets));
          } else {
            character.tactical.weaponSets = null;
          }
        }

        if (profileBtn) profileBtn.classList.remove('hidden');
        ensureWeaponSetsData();
        applyWeaponSetsConfiguration();
        renderWeaponSetsUI();
        if (typeof populateWeaponSetsEditorDropdowns === 'function') populateWeaponSetsEditorDropdowns();
        if (typeof renderOffenseModifiersGrid === 'function') renderOffenseModifiersGrid();
        if (typeof renderSavedProfiles === 'function') renderSavedProfiles();
        recalculateOffense();
      }
    }

    // ====================================================
    // 📐 COCKPIT PANELS COLLAPSE & MODULAR SYSTEM
    // ====================================================
    function toggleCockpitPanel(panelKey) {
      if (!character) return;
      if (!character.cockpitCollapsed) character.cockpitCollapsed = {};
      character.cockpitCollapsed[panelKey] = !character.cockpitCollapsed[panelKey];
      renderCockpitPanelsCollapsedState();
      saveStateToStorage(false);
    }

    function renderCockpitPanelsCollapsedState() {
      if (!character) return;
      if (!character.cockpitCollapsed) character.cockpitCollapsed = {};

      const dockEl = document.getElementById('cockpit-collapsed-dock');
      const gridEl = document.getElementById('cockpit-tactical-grid');

      const panels = [
        { key: 'physical', cardId: 'cockpit-physical-card', headerId: 'cockpit-physical-header', bodyId: 'combat-physical-card-body', barId: 'combat-physical-collapsed-bar', btnId: 'btn-collapse-physical', colId: 'cockpit-column-physical' },
        { key: 'companion', cardId: 'cockpit-companion-card', headerId: 'cockpit-companion-header', bodyId: 'combat-companion-card-body', barId: 'combat-companion-collapsed-bar', btnId: 'btn-collapse-companion', colId: 'cockpit-column-physical' },
        { key: 'spell', cardId: 'cockpit-spell-card', headerId: 'cockpit-spell-header', bodyId: 'combat-spell-card-body', barId: 'combat-spell-collapsed-bar', btnId: 'btn-collapse-spell', colId: 'cockpit-column-spell' },
        { key: 'defense', cardId: 'cockpit-defense-card', headerId: 'cockpit-defense-header', bodyId: 'combat-defense-card-body', barId: 'combat-defense-collapsed-bar', btnId: 'btn-collapse-defense', colId: 'cockpit-column-defense-consumables' },
        { key: 'consumables', cardId: 'cockpit-consumables-card', headerId: 'cockpit-consumables-header', bodyId: 'combat-consumables-card-body', barId: 'combat-consumables-collapsed-bar', btnId: 'btn-collapse-consumables', colId: 'cockpit-column-defense-consumables' }
      ];

      let collapsedCount = 0;

      panels.forEach(p => {
        const isCollapsed = !!character.cockpitCollapsed[p.key];
        const cardEl = document.getElementById(p.cardId);
        const headerEl = document.getElementById(p.headerId);
        const bodyEl = document.getElementById(p.bodyId);
        const barEl = document.getElementById(p.barId);
        const btnEl = document.getElementById(p.btnId);
        const colEl = document.getElementById(p.colId);

        if (isCollapsed) collapsedCount++;

        if (cardEl && dockEl && colEl) {
          if (isCollapsed) {
            if (cardEl.parentElement !== dockEl) {
              dockEl.appendChild(cardEl);
            }
            cardEl.classList.remove('bg-dndCard', 'border', 'p-3.5', 'shadow-lg', 'space-y-3');
          } else {
            if (cardEl.parentElement !== colEl) {
              if (p.key === 'defense') {
                colEl.insertBefore(cardEl, colEl.firstChild);
              } else {
                colEl.appendChild(cardEl);
              }
            }
            cardEl.classList.add('bg-dndCard', 'border', 'p-3.5', 'shadow-lg', 'space-y-3');
          }
        }

        if (headerEl) {
          if (isCollapsed) headerEl.classList.add('hidden');
          else headerEl.classList.remove('hidden');
        }
        if (bodyEl) {
          if (isCollapsed) bodyEl.classList.add('hidden');
          else bodyEl.classList.remove('hidden');
        }
        if (barEl) {
          if (isCollapsed) barEl.classList.remove('hidden');
          else barEl.classList.add('hidden');
        }
        if (btnEl) {
          btnEl.innerHTML = isCollapsed ? '<span>▾</span>' : '<span>▴</span>';
          btnEl.title = isCollapsed ? 'Expand Panel' : 'Collapse Panel';
        }
      });

      if (dockEl) {
        if (collapsedCount === 0) {
          dockEl.className = 'hidden';
        } else if (collapsedCount === 1) {
          dockEl.className = 'grid grid-cols-1 gap-2';
        } else if (collapsedCount === 2) {
          dockEl.className = 'grid grid-cols-1 md:grid-cols-2 gap-2';
        } else if (collapsedCount === 3) {
          dockEl.className = 'grid grid-cols-1 md:grid-cols-3 gap-2';
        } else {
          dockEl.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2';
        }
      }

      const colPhys = document.getElementById('cockpit-column-physical');
      const colSpell = document.getElementById('cockpit-column-spell');
      const colDefCons = document.getElementById('cockpit-column-defense-consumables');

      const physVisible = !character.cockpitCollapsed.physical;
      const spellVisible = !character.cockpitCollapsed.spell;
      const defConsVisible = !character.cockpitCollapsed.defense || !character.cockpitCollapsed.consumables;

      if (colPhys) colPhys.classList.toggle('hidden', !physVisible);
      if (colSpell) colSpell.classList.toggle('hidden', !spellVisible);
      if (colDefCons) colDefCons.classList.toggle('hidden', !defConsVisible);

      const visibleCols = (physVisible ? 1 : 0) + (spellVisible ? 1 : 0) + (defConsVisible ? 1 : 0);
      if (gridEl) {
        if (visibleCols === 0) {
          gridEl.className = 'hidden';
        } else if (visibleCols === 1) {
          gridEl.className = 'grid grid-cols-1 gap-3 xl:gap-4 items-start';
        } else if (visibleCols === 2) {
          gridEl.className = 'grid grid-cols-1 md:grid-cols-2 gap-3 xl:gap-4 items-start';
        } else {
          gridEl.className = 'grid grid-cols-1 md:grid-cols-3 gap-3 xl:gap-4 items-start';
        }
      }
    }

    function initCockpitPanelsState() {
      if (!character) return;
      if (!character.cockpitCollapsed) {
        const hasSpells = (character.spellcasting?.knownSpells?.length > 0) || (Number(character.casterLevel) > 0);
        character.cockpitCollapsed = {
          physical: false,
          spell: !hasSpells,
          defense: false,
          consumables: false
        };
      }
      renderCockpitPanelsCollapsedState();
    }

