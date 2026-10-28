/**
 * Joyful-Fermi D&D 3.5e — Character HUD, Cloud Sync, Profile, Race/Size/Deity, NPC Studio & Point Buy
 */
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
            <text x="50" y="66" text-anchor="middle" fill="currentColor" font-size="24" font-weight="900" font-family="system-ui, -apple-system, sans-serif">4</text>
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
      // 0. Fast Pre-Render (Stale-While-Revalidate):
      // Render immediately from localStorage so active character (e.g. test1) appears instantly in 0ms without waiting for network
      try {
        const _urlP = new URLSearchParams(window.location.search);
        const _fastReqId = _urlP.get('id') || localStorage.getItem('dnd35_active_character_id');
        let _fastChar = null;
        if (_fastReqId) {
          const _hRaw = localStorage.getItem('dnd35_hub_db');
          if (_hRaw) {
            const _hDb = JSON.parse(_hRaw);
            const _found = (_hDb.characters || []).find(c => c.id === _fastReqId);
            if (_found && _found.fullData) _fastChar = _found.fullData;
          }
        }
        if (!_fastChar) {
          const _cRaw = localStorage.getItem('dnd35_character');
          if (_cRaw) {
            const _parsed = JSON.parse(_cRaw);
            if (_parsed && (!_fastReqId || _parsed.id === _fastReqId || _parsed._hubId === _fastReqId)) {
              _fastChar = _parsed;
            }
          }
        }
        if (_fastChar) {
          character = (window.SchemaMigrator && typeof window.SchemaMigrator.upgradeCharacterToV2 === 'function')
            ? window.SchemaMigrator.upgradeCharacterToV2(_fastChar)
            : _fastChar;
          try { renderHUD(); } catch (e) {}
          try { renderAbilities(); } catch (e) {}
          try { renderCharacterProfile(); } catch (e) {}
          try { renderCombatCockpit(); } catch (e) {}
          try { renderWeapons(); } catch (e) {}
        }
      } catch (_fastErr) {
        console.warn('Fast pre-render notice:', _fastErr);
      }

      ensureCustomRacesLoaded();
      // Auto-ensure default race traits (e.g. Human Bonus Feat & Skilled) if specialAbilities is empty
      try {
        if (character && character.race && Array.isArray(character.specialAbilities) && character.specialAbilities.length === 0) {
          const catalog = window.BUNDLED_SRD_CORE_CATALOG || [];
          const raceObj = catalog.find(i => i && i.type === 'Race' && i.name.toLowerCase() === character.race.toLowerCase());
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
      // Eğer kök (/) adresine ?id olmadan gelinmişse (login sonrası yönlendirme veya doğrudan giriş), derhal /hub'a yönlendir:
      const _urlParams = new URLSearchParams(window.location.search);
      const _hasCharId = _urlParams.get('id');
      const _isRootPath = window.location.pathname === '/' || window.location.pathname === '';
      if (_isRootPath && !_hasCharId) {
        window.location.replace('/hub' + window.location.hash);
        return;
      }

      if (window.SupabaseAuth) {
        const authUser = await window.SupabaseAuth.requireAuth();
        if (!authUser) return; // Oturum yoksa login'e yönlendirildi, sayfa yüklemesini durdur
      }
      if (window.SrdCompendium && typeof window.SrdCompendium.init === 'function') {
        window.SrdCompendium.init().catch(e => console.warn('SrdCompendium init warning:', e));
      }
      try {
        await loadInitialData();
      } catch (err) {
        console.error('loadInitialData failed, attempting fallback to bundled data:', err);
      }
      if (!character && window.BUNDLED_CHARACTER_DATA) {
        character = JSON.parse(JSON.stringify(window.BUNDLED_CHARACTER_DATA));
      }
      try {
        initSkillFilters();
      } catch (err) {
        console.error('initSkillFilters failed:', err);
      }
      try {
        renderAll();
      } catch (e) {
        console.error('Initial renderAll error:', e);
      }
      try { verifySettingsGeminiApiKey(false); } catch (e) {}
      try { await CloudSync.init(); } catch (e) {}
      if (window.CloudSync && typeof window.CloudSync.startLiveSyncPolling === 'function') {
        window.CloudSync.startLiveSyncPolling(8000);
      }
      try { initDiceColor(); } catch (e) {}
      try { renderCustomTemplates(); } catch (e) {}
      try { restoreActiveTabAndScroll(); } catch (e) {}
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
        const models = window.RuleMaster
          ? await RuleMaster.getAvailableGeminiModels(apiKey, forceRefresh)
          : ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];
        _geminiVerifiedState = 'connected';
        _geminiVerifiedModel = models && models[0] ? models[0] : 'gemini-2.0-flash-lite';

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
      const name = summary.name || 'Yeni Karakter';
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
          clMode: 'Character Level (DM Boon)',
          babSaveSystem: 'standard'
        }
      };
    }

    async function loadInitialData() {
      // Check if a specific character was requested from Hub via URL query or active ID
      let loadedFromHub = false;
      const urlParams = new URLSearchParams(window.location.search);
      const reqId = urlParams.get('id') || localStorage.getItem('dnd35_active_character_id');

      // 0. Cloud-First Senkronizasyon (Supabase oturumu aktifse buluttaki en taze veriyi kontrol et)
      if (window.SupabaseAuth && !window.SupabaseAuth.isLocalMode()) {
        try {
          const cloudChars = await window.SupabaseAuth.fetchUserCharacters();
          if (Array.isArray(cloudChars) && cloudChars.length > 0) {
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

            if (matchedCloud && matchedCloud.full_data) {
              const cloudFd = matchedCloud.full_data;
              cloudFd.id = matchedCloud.id;
              cloudFd._hubId = matchedCloud.id;

              const localSavedRaw = localStorage.getItem('dnd35_character');
              let localSaved = null;
              if (localSavedRaw) {
                try { localSaved = JSON.parse(localSavedRaw); } catch (e) {}
              }

              const cloudLvl = Number(cloudFd.level) || (Array.isArray(cloudFd.progression) ? cloudFd.progression.length : 0);
              const localLvl = localSaved ? (Number(localSaved.level) || (Array.isArray(localSaved.progression) ? localSaved.progression.length : 0)) : 0;
              const cloudTs = new Date(matchedCloud.updated_at || 0).getTime();
              const localTs = localSaved?.lastModified ? new Date(localSaved.lastModified).getTime() : 0;

              const isLocalEmpty = !localSaved ||
                                   (!localSaved.classes && !localSaved.class && localLvl <= 1 && (!localSaved.feats || localSaved.feats.length === 0));

              const shouldAdoptCloud = isLocalEmpty ||
                                       localSaved.id !== matchedCloud.id ||
                                       cloudLvl > localLvl ||
                                       (cloudLvl === localLvl && cloudTs >= localTs);

              if (shouldAdoptCloud) {
                character = cloudFd;
                localStorage.setItem('dnd35_character', JSON.stringify(character));
                localStorage.setItem('dnd35_active_character_id', character.id);
                loadedFromHub = true;

                // Hub yerel DB'sini de bu taze bulut verisiyle senkronize et
                try {
                  const hubRaw = localStorage.getItem('dnd35_hub_db');
                  if (hubRaw) {
                    const hubDb = JSON.parse(hubRaw);
                    if (Array.isArray(hubDb.characters)) {
                      let hIdx = hubDb.characters.findIndex(c => c.id === matchedCloud.id);
                      if (hIdx >= 0) {
                        hubDb.characters[hIdx].fullData = cloudFd;
                        hubDb.characters[hIdx].name = matchedCloud.name || cloudFd.name || hubDb.characters[hIdx].name;
                        hubDb.characters[hIdx].classes = cloudFd.classes || hubDb.characters[hIdx].classes;
                        hubDb.characters[hIdx].level = Number(cloudFd.level) || hubDb.characters[hIdx].level;
                        hubDb.characters[hIdx].maxHp = cloudFd.hp?.max || hubDb.characters[hIdx].maxHp;
                        hubDb.characters[hIdx].currentHp = matchedCloud.current_hp !== undefined ? matchedCloud.current_hp : (cloudFd.hp?.current ?? hubDb.characters[hIdx].currentHp);
                        hubDb.characters[hIdx].tempHp = matchedCloud.temp_hp || 0;
                        localStorage.setItem('dnd35_hub_db', JSON.stringify(hubDb));
                      }
                    }
                  }
                } catch (hErr) {}
              }
            }
          }
        } catch (cloudErr) {
          console.warn('loadInitialData cloud fetch notice:', cloudErr);
        }
      }

      try {
        if (!loadedFromHub && reqId) {
          const hubRaw = localStorage.getItem('dnd35_hub_db');
          if (hubRaw) {
            const hubDb = JSON.parse(hubRaw);
            const found = (hubDb.characters || []).find(c => c.id === reqId);
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
                if (found.cr && !character.cr) character.cr = found.cr;
                // Preserve feats, specialAbilities, spells if passed at top level
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
                // Sync HP from found summary card if found.currentHp is defined
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
        }
      } catch (err) {
        console.warn('Hub character load notice:', err);
      }

      // 1. Try LocalStorage only if not loaded from hub and no specific foreign ID was requested
      if (!loadedFromHub) {
        const queryId = urlParams.get('id');
        const savedChar = localStorage.getItem('dnd35_character');
        let parsedSaved = null;
        if (savedChar) {
          try { parsedSaved = JSON.parse(savedChar); } catch (e) {}
        }

        if (queryId && parsedSaved && parsedSaved.id !== queryId && parsedSaved._hubId !== queryId) {
          // Guard clause: URL requested an ID that does NOT match savedChar, generate clean character
          character = createCleanDnd35Character({ id: queryId, name: 'Yeni Karakter' });
          character._hubId = queryId;
        } else if (parsedSaved) {
          character = parsedSaved;
        }
      }

      // Reconcile HP with Hub DB if available
      try {
        const hubRaw = localStorage.getItem('dnd35_hub_db');
        if (hubRaw && character) {
          const hubDb = JSON.parse(hubRaw);
          if (Array.isArray(hubDb.characters)) {
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
            }
          }
        }
      } catch (reconErr) {
        console.warn('HP reconciliation warning:', reconErr);
      }

      // Fetch bundled character_data.json for fallback or missing schema keys
      try {
        let defaultChar = window.BUNDLED_CHARACTER_DATA || null;
        if (!defaultChar) {
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
            saveStateToStorage(false);
          }
        } else if (defaultChar) {
          let updated = false;
          const isKazmil = !character.isNpc && (character.name === defaultChar.name || character.name === "Kazmil'in Çırağı" || (!character._hubId && !urlParams.get('id')));

          if (isKazmil) {
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
            // Fix legacy unadjusted progression hpGain (sum 23 for level 6) that caused HP misalignment
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
            updated = true;
          }
          if (typeof normalizeCharacterSpellcasting === 'function') {
            normalizeCharacterSpellcasting(character);
            updated = true;
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
        console.error('Error fetching character_data.json:', e);
      }

      // 2. Load Master DB
      let defaultDb = window.BUNDLED_MASTER_DB || [];
      if (!defaultDb || defaultDb.length === 0) {
        try {
          const res = await fetch('master_db.json');
          if (res.ok) defaultDb = await res.json();
        } catch (e) {
          console.error('Error fetching master_db.json:', e);
        }
      }

      const savedDb = localStorage.getItem('dnd35_master_db');
      if (savedDb) {
        try {
          const parsed = JSON.parse(savedDb);
          if (Array.isArray(parsed)) {
            masterDb = parsed.map(item => {
              if (!item || typeof item !== 'object') return item;
              if (item.name) item.name = sanitizeMojibakeString(item.name);
              if (item.parent) item.parent = sanitizeMojibakeString(item.parent);
              if (item.benefit) item.benefit = sanitizeMojibakeString(item.benefit);
              if (item.description) item.description = sanitizeMojibakeString(item.description);
              return item;
            });
            const seen = new Set();
            masterDb = masterDb.filter(item => {
              if (!item || !item.name) return false;
              const k = (item.name || '').toLowerCase().trim();
              if (seen.has(k)) return false;
              seen.add(k);
              return true;
            });
          }
        } catch (e) {}
      } else {
        masterDb = defaultDb;
      }

      // Sync & normalize Master DB entries to Canonical V2 Schema (schemaVersion: 2, modifiers, damageParts, modes)
      try {
        if (!Array.isArray(masterDb)) masterDb = [];
        masterDb = masterDb.filter(m => m && typeof m === 'object');
        let addedCount = 0;
        const canonicalDefaults = Array.isArray(defaultDb) ? defaultDb.filter(m => m && typeof m === 'object' && m.name) : [];
        window.CORE_SPELLS_AND_MANEUVERS_35E = canonicalDefaults.filter(
          m => m && (m.type === 'Spell' || m.type === 'Maneuver' || m.type === 'Stance')
        );
        canonicalDefaults.forEach(defItem => {
          if (!defItem || !defItem.name) return;
          const defName = (defItem.name || '').toLowerCase().trim();
          const existingItem = masterDb.find(m => m && (m.name || '').toLowerCase().trim() === defName);
          if (!existingItem) {
            masterDb.push(defItem);
            addedCount++;
          }
        });
        // Fold legacy child entries into parent.modes[] and upgrade all entries to V2
        if (typeof RuleMaster !== 'undefined' && typeof RuleMaster.normalizeDatabaseList === 'function') {
          const prevLen = masterDb.length;
          masterDb = RuleMaster.normalizeDatabaseList(masterDb);
          if (masterDb.length !== prevLen) addedCount++;
        } else if (window.SchemaMigrator && typeof window.SchemaMigrator.migrateMasterDbEntryToV2 === 'function') {
          masterDb = masterDb.map(m => window.SchemaMigrator.migrateMasterDbEntryToV2(m));
        }
        // Refresh any stale Warlock Invocations & Core Feats in masterDb with canonical English descriptions & prerequisites
        if (Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) {
          const coreByName = new Map();
          window.BUNDLED_SRD_CORE_CATALOG.forEach(c => {
            if (c && c.name) coreByName.set(c.name.toLowerCase().trim(), c);
          });
          masterDb.forEach(m => {
            if (!m || !m.name) return;
            const cMatch = coreByName.get(m.name.toLowerCase().trim());
            if (cMatch && (cMatch.category === 'Warlock Invocation' || cMatch.type === 'Feat')) {
              if (cMatch.category === 'Warlock Invocation' && m.category !== 'Warlock Invocation') {
                m.category = 'Warlock Invocation';
                addedCount++;
              }
              if (cMatch.benefit && m.benefit !== cMatch.benefit) {
                m.benefit = cMatch.benefit;
                m.description = cMatch.description || cMatch.benefit;
                addedCount++;
              }
              if (cMatch.prereq && cMatch.prereq !== '-' && m.prereq !== cMatch.prereq) {
                m.prereq = cMatch.prereq;
                m.prerequisites = cMatch.prereq;
                addedCount++;
              }
            }
          });
        }
        // Ensure cantrips in masterDb have level: 0 explicitly
        masterDb.forEach(m => {
          if (m && (m.type === 'Spell' || (m.category || '').includes('Spell')) && m.level === undefined) {
            if (Array.isArray(m.tags) && m.tags.some(t => String(t).toLowerCase() === 'cantrip')) {
              m.level = 0;
              addedCount++;
            }
          }
        });
        if (addedCount > 0) {
          localStorage.setItem('dnd35_master_db', JSON.stringify(masterDb));
        }
      } catch (syncErr) {
        console.warn('Canonical V2 masterDb sync warning:', syncErr);
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

      // Google ile oturum açılmışsa karakteri otomatik olarak Supabase bulutuna yedekle (Upsert)
      if (character && window.SupabaseAuth && !window.SupabaseAuth.isLocalMode()) {
        window.SupabaseAuth.upsertUserCharacter(character).then(res => {
          if (res) console.log('Karakter Supabase bulutuna otomatik yedeklendi:', character.name);
        }).catch(e => {
          console.warn('Karakter buluta otomatik yedeklenirken hata:', e);
        });
      }
    }

    function saveStateToStorage(triggerCloudSync = true) {
      if (!character) return;
      character.lastModified = new Date().toISOString();
      localStorage.setItem('dnd35_character', JSON.stringify(character));
      localStorage.setItem('dnd35_master_db', JSON.stringify(masterDb));

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
              // Guard clause: ensure we are not overwriting a different character
              if (character._hubId && hubDb.characters[idx].id && character._hubId !== hubDb.characters[idx].id) {
                console.warn(`saveStateToStorage guard: character._hubId (${character._hubId}) !== summary.id (${hubDb.characters[idx].id}). Aborting hub overwrite.`);
                return;
              }
              const hubChar = hubDb.characters[idx];
              const hubHpTs = Number(hubChar.lastHpUpdateTs) || 0;
              const playerHpTs = Number(character.hp?._lastPlayerChangeTs) || 0;

              // Only update Hub's HP if the player explicitly changed it more recently than DM
              if (playerHpTs > hubHpTs) {
                hubChar.currentHp = character.hp?.current ?? hubChar.currentHp;
                hubChar.tempHp = character.hp?.temp ?? 0;
                hubChar.lastHpUpdateTs = playerHpTs;
              } else if (hubHpTs > 0 && hubChar.currentHp !== undefined) {
                // DM HP is authoritative: adopt Hub HP onto character
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
              hubChar.fullData = character;
              localStorage.setItem('dnd35_hub_db', JSON.stringify(hubDb));
            }
          }
        }
      } catch (hubErr) {
        console.warn('Hub auto-sync warning:', hubErr);
      }

      if (triggerCloudSync && window.GDriveSync) {
        window.GDriveSync.scheduleAutoSave();
      }

      // Multi-User Cloud Karakter Senkronizasyonu (Kampanyaya bağlı olsun veya olmasın)
      if (character && window.SupabaseAuth && !window.SupabaseAuth.isLocalMode()) {
        if (!character.id) {
          character.id = character._hubId || 'char_active_player';
          character._hubId = character.id;
        }
        // Boş / henüz başlatılmamış nesnelerin buluttaki dolu karakteri ezmesini önle
        const curLvl = Number(character.level) || (Array.isArray(character.progression) ? character.progression.length : 0);
        if (curLvl === 0 && !character.classes && !character.race && (!character.feats || character.feats.length === 0)) {
          console.warn('saveStateToStorage: Character appears uninitialized/empty, prevented overwriting cloud data.');
        } else {
          window.SupabaseAuth.upsertUserCharacter(character).catch(err => {
            console.warn('upsertUserCharacter background notice:', err);
          });
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

        if (incoming.full_data) {
          const remoteFd = incoming.full_data;
          const remoteLvl = Number(remoteFd.level) || (Array.isArray(remoteFd.progression) ? remoteFd.progression.length : 0);
          const localLvl = Number(character.level) || (Array.isArray(character.progression) ? character.progression.length : 0);
          const remoteTs = new Date(incoming.updated_at || incoming.last_player_update_ts || 0).getTime();
          const localTs = character.lastModified ? new Date(character.lastModified).getTime() : 0;

          // Eğer uzaktaki kopya daha yüksek seviyeliyse veya yerelden daha güncelse:
          if (remoteLvl > localLvl || (remoteLvl === localLvl && remoteTs > localTs + 500)) {
            console.log(`[Realtime Sync] Updated character received from another device: Lvl ${remoteLvl}`);
            remoteFd.id = myCharId;
            remoteFd._hubId = myCharId;
            character = remoteFd;
            localStorage.setItem('dnd35_character', JSON.stringify(character));
            localStorage.setItem('dnd35_active_character_id', myCharId);

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
              showDiceTopToast({
                title: '⚡ Live Cloud Sync',
                text: `Character updated from another device (${character.classes || 'Level ' + character.level})!`,
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
        const myCharId = character._hubId || character.id;
        if (!myCharId) return;

        try {
          const cloudChars = await window.SupabaseAuth.fetchUserCharacters();
          if (!Array.isArray(cloudChars)) return;
          const matched = cloudChars.find(c => c.id === myCharId);
          if (matched && matched.full_data) {
            const remoteFd = matched.full_data;
            const remoteLvl = Number(remoteFd.level) || (Array.isArray(remoteFd.progression) ? remoteFd.progression.length : 0);
            const localLvl = Number(character.level) || (Array.isArray(character.progression) ? character.progression.length : 0);
            const remoteTs = new Date(matched.updated_at || 0).getTime();
            const localTs = character.lastModified ? new Date(character.lastModified).getTime() : 0;

            if (remoteLvl > localLvl || (remoteLvl === localLvl && remoteTs > localTs + 500)) {
              console.log(`[Tab Focus Sync] Pulled latest character from cloud on tab focus: Lvl ${remoteLvl}`);
              remoteFd.id = myCharId;
              remoteFd._hubId = myCharId;
              character = remoteFd;
              localStorage.setItem('dnd35_character', JSON.stringify(character));
              renderAll();
              if (typeof showDiceTopToast === 'function') {
                showDiceTopToast({
                  title: '🔄 Sekme Senkronu',
                  text: `Loaded latest version from cloud (${character.classes || 'Level ' + character.level}).`,
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
          localStorage.setItem('dnd35_character', JSON.stringify(character));
          localStorage.setItem('dnd35_active_character_id', character.id);
          renderAll();
          if (typeof showDiceTopToast === 'function') {
            showDiceTopToast({
              title: '✅ Pulled from Cloud',
              text: `"${character.name}" (${character.classes || 'Level ' + character.level}) loaded successfully!`,
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
          if (typeof showDiceTopToast === 'function') {
            showDiceTopToast({
              title: '☁️ Pushed to Cloud',
              text: `"${character.name}" saved to the cloud successfully!`,
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
      const modal = document.getElementById('join-campaign-modal');
      if (!modal) return;

      const codeInput = document.getElementById('join-campaign-input-code');
      if (codeInput) {
        codeInput.value = prefilledCode || character.campaignInviteCode || '';
      }

      const badgeBox = document.getElementById('current-campaign-badge-box');
      const nameEl = document.getElementById('current-campaign-name');
      const codeEl = document.getElementById('current-campaign-code');

      if (character.campaignInviteCode || character.cloudCampaignId) {
        if (badgeBox) badgeBox.classList.remove('hidden');
        if (nameEl) nameEl.textContent = character.campaignName || 'Aktif Kampanya';
        if (codeEl) codeEl.textContent = `KOD: ${character.campaignInviteCode || 'BULUT'}`;
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
              formula: `Kod: ${result.campaign.invite_code}`,
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
      const badge = document.getElementById('settings-campaign-badge');
      if (character.campaignInviteCode) {
        if (btnText) btnText.textContent = character.campaignInviteCode;
        if (badge) badge.textContent = character.campaignInviteCode;
      } else {
        if (btnText) btnText.textContent = 'Kampanya';
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
      const modal = document.getElementById('settings-modal');
      if (!modal) return;
      modal.classList.remove('hidden');

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
      if (setNoCrit) setNoCrit.checked = character.houseRules?.noCritConfirm ?? true;
      if (setManCrit) setManCrit.checked = character.houseRules?.maneuverCrit ?? false;
      if (noCrit) noCrit.checked = character.houseRules?.noCritConfirm ?? true;
      if (manCrit) manCrit.checked = character.houseRules?.maneuverCrit ?? false;

      const setCritCap = document.getElementById('setting-crit-cap-min');
      if (setCritCap) setCritCap.value = String(character.houseRules?.critCapMin ?? 15);
      const setKeenStack = document.getElementById('setting-keen-imp-stacking');
      if (setKeenStack) setKeenStack.value = character.houseRules?.keenImpCritStacking || 'stack_diminishing';
      const setPrecisionRule = document.getElementById('setting-precision-rule');
      if (setPrecisionRule) setPrecisionRule.value = character.houseRules?.precisionDamageRule || 'once_per_turn';

      updateHouseRuleSkillConsolidationUI();

      // Sync Feat Mode, Caster CL Mode & Ignore ASF in House Rules
      const featModeSel = document.getElementById('setting-feat-mode');
      if (featModeSel && character.settings?.featMode) {
        featModeSel.value = character.settings.featMode;
      }
      const clModeSel = document.getElementById('setting-cl-mode');
      if (clModeSel) {
        clModeSel.value = character.settings?.clMode || 'Character Level (DM Boon)';
      }
      const casterTypeSel = document.getElementById('setting-caster-type');
      if (casterTypeSel) {
        casterTypeSel.value = character.settings?.casterType || 'spontaneous';
      }
      if (typeof updateCasterTypeUIState === 'function') updateCasterTypeUIState();
      const asfChk = document.getElementById('setting-ignore-asf');
      if (asfChk) {
        asfChk.checked = character.settings?.ignoreAsf !== false;
      }
      const babSaveSel = document.getElementById('setting-bab-save-system');
      if (babSaveSel) {
        babSaveSel.value = character.settings?.babSaveSystem || 'standard';
      }

      const pinLimitSel = document.getElementById('setting-pin-drawer-limit');
      if (pinLimitSel) {
        pinLimitSel.value = character.settings?.pinDrawerLimit || 5;
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
          ? 'px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold border transition flex items-center justify-center sm:justify-start gap-1 bg-slate-900 border-slate-700 text-slate-500 line-through opacity-60 cursor-pointer whitespace-nowrap min-w-0'
          : 'px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold border transition flex items-center justify-center sm:justify-start gap-1 bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-sm cursor-pointer whitespace-nowrap min-w-0';
        btnStd.innerHTML = isSpent ? '<span class="w-2 h-2 rounded-full bg-slate-500 inline-block shrink-0"></span><span class="truncate">Standard: Spent</span>' : '<span class="w-2 h-2 rounded-full bg-emerald-400 inline-block shrink-0"></span><span class="truncate">Standard: Ready</span>';
      }

      const btnMove = document.getElementById('btn-action-move');
      if (btnMove) {
        const isSpent = !!spent.move;
        btnMove.className = isSpent
          ? 'px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold border transition flex items-center justify-center sm:justify-start gap-1 bg-slate-900 border-slate-700 text-slate-500 line-through opacity-60 cursor-pointer whitespace-nowrap min-w-0'
          : 'px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold border transition flex items-center justify-center sm:justify-start gap-1 bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-sm cursor-pointer whitespace-nowrap min-w-0';
        btnMove.innerHTML = isSpent ? '<span class="w-2 h-2 rounded-full bg-slate-500 inline-block shrink-0"></span><span class="truncate">Move: Spent</span>' : '<span class="w-2 h-2 rounded-full bg-emerald-400 inline-block shrink-0"></span><span class="truncate">Move: Ready</span>';
      }

      const btnSwift = document.getElementById('btn-action-swift');
      if (btnSwift) {
        const isSpent = !!spent.swift;
        btnSwift.className = isSpent
          ? 'px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold border transition flex items-center justify-center sm:justify-start gap-1 bg-slate-900 border-slate-700 text-slate-500 line-through opacity-60 cursor-pointer whitespace-nowrap min-w-0'
          : 'px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold border transition flex items-center justify-center sm:justify-start gap-1 bg-purple-950/80 border-purple-500/60 text-purple-300 shadow-sm cursor-pointer whitespace-nowrap min-w-0';
        btnSwift.innerHTML = isSpent ? '<span class="w-2 h-2 rounded-full bg-slate-500 inline-block shrink-0"></span><span class="truncate">Swift: Spent</span>' : '<span class="w-2 h-2 rounded-full bg-purple-400 inline-block shrink-0"></span><span class="truncate">Swift: Ready</span>';
      }

      const btnImm = document.getElementById('btn-action-immediate');
      if (btnImm) {
        const isSpent = !!spent.immediate;
        btnImm.className = isSpent
          ? 'px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold border transition flex items-center justify-center sm:justify-start gap-1 bg-rose-950/80 border-rose-500/60 text-rose-300 cursor-pointer whitespace-nowrap min-w-0'
          : 'px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold border transition flex items-center justify-center sm:justify-start gap-1 bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer whitespace-nowrap min-w-0';
        btnImm.innerHTML = isSpent ? '<span class="w-2 h-2 rounded-full bg-rose-500 inline-block shrink-0"></span><span class="truncate">Immediate: Spent</span>' : '<span class="w-2 h-2 rounded-full bg-slate-500 inline-block shrink-0"></span><span class="truncate">Immediate (Reaction)</span>';
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
          badges.push(`<span class="px-2 py-0.5 rounded bg-amber-950 border border-amber-600/50 text-amber-300 font-semibold" title="Manevra Kontrolleri: ${ops}">⚔️ Manevralar: ${ops}</span>`);
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

    function advanceCombatTurn() {
      if (!character.tactical) character.tactical = {};
      character.tactical.round = (Number(character.tactical.round) || 1) + 1;
      character.tactical.spentActions = {
        standard: false,
        move: false,
        swift: false,
        immediate: false
      };
      updateActionEconomyUI();
      saveStateToStorage(false);
      showDiceTopToast({
        icon: '⚔️',
        title: 'New Turn Started',
        breakdown: `Round ${character.tactical.round}: Full action budget (Standard, Move, Swift) refreshed.`,
        total: `Tur ${character.tactical.round}`
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
        total: isMerged ? 'Konsolide' : 'RAW'
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

    function switchTab(tabId, isRestoration = false) {
      try {
        const prevTab = localStorage.getItem('dnd35_active_tab') || 'tab-combat';
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

      if (tabId === 'tab-database' && window.RuleMaster) {
        RuleMaster.init();
      }
      if (tabId === 'tab-defense') {
        renderDefenseBreakdown();
        renderActiveBuffs();
      }
      if (tabId === 'tab-dice') {
        renderDiceHistory();
        updateDicePoolDisplay();
        initDiceColor();
        renderCustomTemplates();
      }
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

    function renderAll() {
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

      // 1. Core Hero HUD & Abilities (Rendered first so top bar and stats never fail)
      try { renderHUD(); } catch (e) { console.error('renderHUD error:', e); }
      try { renderAbilities(); } catch (e) { console.error('renderAbilities error:', e); }
      try { renderCharacterProfile(); } catch (e) { console.error('renderCharacterProfile error:', e); }

      // 2. Combat & Tactical Cockpit
      try { renderWeapons(); } catch (e) { console.error('renderWeapons error:', e); }
      try { renderActiveModifiers(); } catch (e) { console.error('renderActiveModifiers error:', e); }
      try { renderActiveBuffs(); } catch (e) { console.error('renderActiveBuffs error:', e); }
      try { renderCombatCockpit(); } catch (e) { console.error('renderCombatCockpit error:', e); }

      // 3. Spells & Maneuvers
      try { renderSpellSlots(); } catch (e) { console.error('renderSpellSlots error:', e); }
      try { renderManeuvers(); } catch (e) { console.error('renderManeuvers error:', e); }
      try { renderKnownSpells(); } catch (e) { console.error('renderKnownSpells error:', e); }

      // 4. Skills, Defense, Gear & Library
      try { renderSkills(); } catch (e) { console.error('renderSkills error:', e); }
      try { renderCoreFeatsAndSpecialAbilities(); } catch (e) { console.error('renderCoreFeatsAndSpecialAbilities error:', e); }
      try { renderLevelProgression(); } catch (e) { console.error('renderLevelProgression error:', e); }
      try { renderSpecialDefenses(); } catch (e) { console.error('renderSpecialDefenses error:', e); }
      try { renderDefenseBreakdown(); } catch (e) { console.error('renderDefenseBreakdown error:', e); }
      try { renderInventory(); } catch (e) { console.error('renderInventory error:', e); }
      try { renderConsumables(); } catch (e) { console.error('renderConsumables error:', e); }
      if (typeof renderMasterDbTable === 'function') {
        try { renderMasterDbTable(); } catch (e) { console.error('renderMasterDbTable error:', e); }
      }
      if (window.HubNotes && typeof window.HubNotes.mountCharacterNotesWidget === 'function') {
        try { window.HubNotes.mountCharacterNotesWidget('char-smart-notes-container'); } catch (e) { console.error('HubNotes widget error:', e); }
      }
      try { renderDiceHistory(); } catch (e) { console.error('renderDiceHistory error:', e); }
    }

    function renderHUD() {
      const nameEl = document.getElementById('char-name-display');
      if (nameEl) nameEl.textContent = character.name;
      const classEl = document.getElementById('char-classes-display');
      if (classEl) classEl.textContent = character.classes;
      const babEl = document.getElementById('char-bab-display');
      if (babEl) babEl.textContent = '+' + (character.bab || 0);

      // Toggle Level Up vs NPC Statblock button
      const lvlUpBtn = document.getElementById('btn-header-level-up');
      const npcStatBtn = document.getElementById('btn-header-npc-statblock');
      if (character.isNpc) {
        if (lvlUpBtn) lvlUpBtn.classList.add('hidden');
        if (npcStatBtn) npcStatBtn.classList.remove('hidden');
      } else {
        if (lvlUpBtn) lvlUpBtn.classList.remove('hidden');
        if (npcStatBtn) npcStatBtn.classList.add('hidden');
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
          maxHpEl.title = `Maksimum Can: ${maxHp} (Taban: ${Number(character.hp?.baseMax) || (maxHp - conBonus)} ${conBonus >= 0 ? '+' : ''}${conBonus} CON)`;
        } else {
          maxHpEl.title = `Maksimum Can: ${maxHp}`;
        }
      }

      const hpBonusTag = document.getElementById('hp-bonus-tag');
      if (hpBonusTag) {
        hpBonusTag.textContent = '';
        hpBonusTag.title = '';
        hpBonusTag.classList.add('hidden');
      }

      const hpTempTag = document.getElementById('hp-temp-tag');
      if (hpTempTag) {
        const tempHp = Math.max(0, Number(character.hp?.temp) || 0);
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
      if (bar) {
        bar.style.width = pct + '%';
        if (pct > 50) bar.className = 'bg-emerald-500 h-full rounded-full transition-all';
        else if (pct > 25) bar.className = 'bg-amber-500 h-full rounded-full transition-all';
        else bar.className = 'bg-rose-500 h-full rounded-full transition-all';
      }

      const condBadge = document.getElementById('hp-condition-badge');
      const hpCurrentDisplay = document.getElementById('hp-current-display');
      if (condBadge) {
        if (curHp >= maxHp) {
          condBadge.textContent = 'Healthy';
          condBadge.className = 'badge bg-emerald-900/60 text-emerald-300 border border-emerald-600';
          if (hpCurrentDisplay) hpCurrentDisplay.className = 'text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono transition-colors';
        } else if (curHp > maxHp / 2) {
          condBadge.textContent = 'Scratched';
          condBadge.className = 'badge bg-emerald-900/40 text-emerald-200 border border-emerald-700';
          if (hpCurrentDisplay) hpCurrentDisplay.className = 'text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono transition-colors';
        } else if (curHp > 0) {
          condBadge.textContent = 'Bloodied';
          condBadge.className = 'badge bg-amber-900/60 text-amber-300 border border-amber-600';
          if (hpCurrentDisplay) hpCurrentDisplay.className = 'text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono transition-colors';
        } else if (curHp === 0) {
          condBadge.textContent = 'Disabled';
          condBadge.className = 'badge bg-orange-950 text-orange-400 border border-orange-700';
          if (hpCurrentDisplay) hpCurrentDisplay.className = 'text-2xl sm:text-3xl font-extrabold text-orange-400 font-mono transition-colors';
        } else if (curHp > -10) {
          condBadge.textContent = 'Dying';
          condBadge.className = 'badge bg-rose-950 text-rose-400 border border-rose-700 animate-pulse';
          if (hpCurrentDisplay) hpCurrentDisplay.className = 'text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono animate-pulse transition-colors';
        } else {
          condBadge.textContent = 'Dead';
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
          if (bd.shield) detailedParts.push(`Kalkan +${bd.shield}${shieldName ? ` (${shieldName})` : ''}`);
          if (bd.dex !== undefined) detailedParts.push(`Dex ${bd.dex >= 0 ? '+' + bd.dex : bd.dex}`);
          if (bd.natural) detailedParts.push(`Nat +${bd.natural}`);
          if (bd.deflection) detailedParts.push(`Defl +${bd.deflection}`);
          if (bd.dodge) detailedParts.push(`Dodge +${bd.dodge}`);
          if (bd.penalty) detailedParts.push(`Ceza ${bd.penalty}`);

          const shortParts = [];
          if (bd.armor) shortParts.push(`Armor +${bd.armor}`);
          if (bd.shield) shortParts.push(`Kalkan +${bd.shield}`);
          if (bd.dex !== undefined) shortParts.push(`Dex ${bd.dex >= 0 ? '+' + bd.dex : bd.dex}`);
          if (bd.natural) shortParts.push(`Nat +${bd.natural}`);
          if (bd.deflection) shortParts.push(`Defl +${bd.deflection}`);
          if (bd.dodge) shortParts.push(`Dodge +${bd.dodge}`);
          if (bd.penalty) shortParts.push(`Ceza ${bd.penalty}`);

          acNotesEl.textContent = shortParts.join(' • ') || 'Taban AC 10';
          acNotesEl.title = `AC Breakdown: ${detailedParts.join(' • ')} (Base 10) | Click 'Breakdown' for full details.`;
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
          savesSubtitle.textContent = `✨ Aktif: ${activeSaveBuffs.map(b => b.name).join(', ')}`;
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
        coordsBadge.textContent = `📍 X: %${Math.round(parsedPos.x)}, Y: %${Math.round(parsedPos.y)}`;
      }
      if (fitSel) fitSel.value = fit;

      const race = document.getElementById('profile-edit-race')?.value || character?.race || 'Human';
      const gender = document.getElementById('profile-edit-gender')?.value || character?.gender || 'Erkek';
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
          statusBadge.textContent = 'Dinamik Sembol';
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
        const gender = document.getElementById('profile-edit-gender')?.value || character?.gender || 'Erkek';
        const classes = character?.classes || '';
        const emoji = getDynamicCharacterEmoji(race, gender, classes);
        avatarBox.innerHTML = `<span id="profile-modal-avatar-icon">${emoji}</span>`;
      }
    }

    function renderCharacterProfile() {
      if (!character) return;

      const race = character.race || "Human";
      const gender = character.gender || "Erkek";
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
              <span class="text-[10px] text-slate-400 group-hover:text-indigo-300 transition-colors font-medium">✏️ Portre Ekle</span>
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

      const lvlBadge = document.getElementById('core-profile-level-badge');
      const charLevel = (character.levelProgression || []).filter(p => p.active !== false).length || Number(character.level) || 1;
      if (lvlBadge) {
        if (character.isNpc && character.cr) {
          lvlBadge.textContent = `CR ${character.cr}`;
          lvlBadge.className = "badge bg-rose-950 text-rose-300 border border-rose-700/70 text-[10px] font-bold";
        } else if (character.isNpc) {
          lvlBadge.textContent = `NPC • Lvl ${charLevel}`;
          lvlBadge.className = "badge bg-amber-950 text-amber-300 border border-amber-700/70 text-[10px] font-bold";
        } else {
          lvlBadge.textContent = `Seviye ${charLevel}`;
          lvlBadge.className = "badge bg-emerald-950 text-emerald-300 border border-emerald-700/70 text-[10px] font-bold";
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
      if (sizeEl) sizeEl.textContent = character.size || "Medium (Orta)";

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
      setVal('profile-edit-size', character.size || 'Medium');
      updateSizeDropdownTrigger(character.size || 'Medium');
      setVal('profile-edit-gender', character.gender || '');
      setVal('profile-edit-age', character.age || '');
      setVal('profile-edit-height', character.height || '');
      setVal('profile-edit-weight', character.weight || '');
      setVal('profile-edit-speed', character.baseSpeed || 30);

      updateProfileModalAvatar();
      applyPortraitSettings();
      applyWallpaperSettings();
      onProfileRaceChange(character.race || '');
    }

    function openProfileEditModal() {
      openStatDistributionModal('identity');
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
              <span>⚡</span>
              <span>Fetch Race</span>
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
        statusEl.innerHTML = `<span class="animate-spin">⚡</span> <span>Searching and verifying "${escapeRaceHtml(q)}" across D&D 3.5e RAW compendiums...</span>`;
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
            opt.textContent = `${raceObj.name} (AI)`;
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

    document.addEventListener('click', (e) => {
      const container = document.getElementById('race-custom-dropdown-container');
      if (_raceSpotlightOpen && container && !container.contains(e.target)) {
        closeRaceSpotlightDropdown();
      }
      const deityContainer = document.getElementById('deity-custom-dropdown-container');
      if (_deitySpotlightOpen && deityContainer && !deityContainer.contains(e.target)) {
        closeDeitySpotlightDropdown();
      }
      const alignContainer = document.getElementById('alignment-custom-dropdown-container');
      if (_alignmentDropdownOpen && alignContainer && !alignContainer.contains(e.target)) {
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

      dropdown.classList.remove('hidden');
      if (chevron) chevron.classList.add('rotate-180');
      _sizeDropdownOpen = true;

      renderSizeItems();
    }

    function closeSizeDropdown() {
      const dropdown = document.getElementById('size-custom-dropdown');
      const chevron = document.getElementById('size-trigger-chevron');
      if (!dropdown) return;

      dropdown.classList.add('hidden');
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
                  ${s.acMod} • ${s.hideMod} • Alan: ${s.space}
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
        if (labelEl) labelEl.textContent = 'Medium (Orta)';
        if (iconEl) iconEl.textContent = '👤';
      }
    }

    // =========================================================================
    // ⚖️ SPOTLIGHT & SYMBOL ALIGNMENT SELECTOR
    // =========================================================================
    const DND35_ALIGNMENT_DEFINITIONS = [
      // 1. İyilik Ekseni (Good)
      { id: 'Lawful Good', label: 'Lawful Good (Crusader)', shortLabel: 'Lawful Good', category: 'Good Alignment Axis', icon: '⚖️', axis: 'Law & Good', desc: 'Honor, justice, righteousness, and protecting the innocent (Paladin)' },
      { id: 'Neutral Good', label: 'Neutral Good (Benefactor)', shortLabel: 'Neutral Good', category: 'Good Alignment Axis', icon: '🕊️', axis: 'Pure Good', desc: 'Compassion, altruism, and helping others without bias for or against order' },
      { id: 'Chaotic Good', label: 'Chaotic Good (Rebel)', shortLabel: 'Chaotic Good', category: 'Good Alignment Axis', icon: '🏹', axis: 'Freedom & Good', desc: 'Conscience, individual liberty, and kindness above rigid laws' },

      // 2. Denge & Tarafsızlık Ekseni (Neutral)
      { id: 'Lawful Neutral', label: 'Lawful Neutral (Judge)', shortLabel: 'Lawful Neutral', category: 'Neutral Alignment Axis', icon: '📜', axis: 'Pure Order', desc: 'Rule of law, tradition, discipline, and impartial authority (Monk)' },
      { id: 'True Neutral', label: 'True Neutral (Undecided)', shortLabel: 'True Neutral', category: 'Neutral Alignment Axis', icon: '☯️', axis: 'Cosmic Balance', desc: 'Natural balance, impartiality, and pragmatic common sense (Druid)' },
      { id: 'Chaotic Neutral', label: 'Chaotic Neutral (Free Spirit)', shortLabel: 'Chaotic Neutral', category: 'Neutral Alignment Axis', icon: '🎭', axis: 'Pure Freedom', desc: 'Unfettered individualism and following one\'s own whims (Bard)' },

      // 3. Kötülük Ekseni (Evil)
      { id: 'Lawful Evil', label: 'Lawful Evil (Dominator)', shortLabel: 'Lawful Evil', category: 'Evil Alignment Axis', icon: '⛓️', axis: 'Order & Evil', desc: 'Tyranny, strict hierarchy, calculated domination, and methodical rule' },
      { id: 'Neutral Evil', label: 'Neutral Evil (Malefactor)', shortLabel: 'Neutral Evil', category: 'Evil Alignment Axis', icon: '💀', axis: 'Pure Selfishness', desc: 'Unadulterated malice, greed, betrayal, and self-serving ambition' },
      { id: 'Chaotic Evil', label: 'Chaotic Evil (Destroyer)', shortLabel: 'Chaotic Evil', category: 'Evil Alignment Axis', icon: '🩸', axis: 'Chaos & Destruction', desc: 'Savagery, slaughter, unbridled fury, and ruthless destruction' }
    ];

    let _alignmentDropdownOpen = false;

    function toggleAlignmentDropdown() {
      if (_alignmentDropdownOpen) closeAlignmentDropdown();
      else openAlignmentDropdown();
    }

    function openAlignmentDropdown() {
      const dropdown = document.getElementById('alignment-custom-dropdown');
      const chevron = document.getElementById('alignment-trigger-chevron');
      const searchInput = document.getElementById('alignment-spotlight-search');
      if (!dropdown) return;

      dropdown.classList.remove('hidden');
      if (chevron) chevron.classList.add('rotate-180');
      _alignmentDropdownOpen = true;

      const q = searchInput ? searchInput.value.trim() : '';
      renderAlignmentItems(q);

      setTimeout(() => {
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }, 50);
    }

    function closeAlignmentDropdown() {
      const dropdown = document.getElementById('alignment-custom-dropdown');
      const chevron = document.getElementById('alignment-trigger-chevron');
      if (!dropdown) return;

      dropdown.classList.add('hidden');
      if (chevron) chevron.classList.remove('rotate-180');
      _alignmentDropdownOpen = false;
    }

    function onAlignmentFilter(val) {
      const clearBtn = document.getElementById('alignment-clear-btn');
      if (clearBtn) {
        if (val && val.trim()) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');
      }
      renderAlignmentItems(val);
    }

    function clearAlignmentFilter() {
      const searchInput = document.getElementById('alignment-spotlight-search');
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      onAlignmentFilter('');
    }

    function renderAlignmentItems(filterText = '') {
      const listEl = document.getElementById('alignment-options-list');
      if (!listEl) return;

      const q = (filterText || '').toLowerCase().trim();
      const currentVal = (document.getElementById('profile-edit-alignment')?.value || character?.alignment || '').toLowerCase();

      const filtered = q
        ? DND35_ALIGNMENT_DEFINITIONS.filter(a => {
            return a.id.toLowerCase().includes(q) ||
                   a.label.toLowerCase().includes(q) ||
                   a.category.toLowerCase().includes(q) ||
                   a.axis.toLowerCase().includes(q) ||
                   a.desc.toLowerCase().includes(q);
          })
        : DND35_ALIGNMENT_DEFINITIONS;

      if (filtered.length === 0) {
        listEl.innerHTML = `
          <div class="p-3 text-center text-slate-400 italic">
            No alignment found matching "${filterText}".
          </div>
        `;
        return;
      }

      const categories = {};
      filtered.forEach(a => {
        if (!categories[a.category]) categories[a.category] = [];
        categories[a.category].push(a);
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

        items.forEach(a => {
          const isSelected = a.id.toLowerCase() === currentVal;
          const selectedClasses = isSelected
            ? 'bg-purple-900/60 border border-purple-500/80 text-white font-bold'
            : 'bg-slate-900/50 hover:bg-slate-800/80 border border-transparent hover:border-purple-500/30 text-slate-200';

          html += `
            <button type="button" onclick="selectAlignmentItem('${a.id}')" class="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer group active:scale-[0.99] ${selectedClasses}">
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-sm shrink-0">${a.icon}</span>
                <div class="truncate">
                  <div class="text-xs font-bold flex items-center gap-1.5">
                    <span class="truncate">${a.label}</span>
                    ${isSelected ? '<span class="text-[9px] px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-700 font-mono">Selected</span>' : ''}
                  </div>
                  <div class="text-[9px] text-slate-400 font-mono truncate">
                    ${a.axis} • ${a.desc}
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

      listEl.innerHTML = html;
    }

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

      // Custom deities from localStorage
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
                  category: 'Custom / AI-Added Deities',
                  icon: cd.icon || '🔮',
                  alignment: cd.alignment || 'Any',
                  weapon: cd.favoredWeapon || cd.weapon || '-',
                  domains: cd.domains || [],
                  tags: ['custom', 'ai', cd.name.toLowerCase()]
                });
              }
            });
          }
        }
      } catch (e) {
        console.warn('Custom deities read error:', e);
      }

      // Catalog lookup
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
            alignment: item.alignment || 'Any',
            weapon: item.favoredWeapon || item.weapon || '-',
            domains: item.domains || [],
            tags: Array.isArray(item.tags) ? item.tags : ['deity', item.name.toLowerCase()]
          });
        }
      });

      return list;
    }

    function renderDeitySpotlightItems(filterText = '') {
      const listEl = document.getElementById('deity-spotlight-list');
      if (!listEl) return;

      const q = (filterText || '').toLowerCase().trim();
      const currentDeity = (document.getElementById('profile-edit-deity')?.value || character?.deity || '').toLowerCase();
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
          <div class="p-3 text-center space-y-2 bg-purple-950/30 rounded-xl border border-purple-500/40 my-1">
            <span class="text-xl block">🔍</span>
            <div class="text-xs font-bold text-slate-200">"${escapeDeityHtml(filterText)}" not found in pantheon</div>
            <p class="text-[10px] text-slate-400">You can search deities directly from Forgotten Realms, Eberron, or official D&D 3.5e sourcebooks.</p>
            <button type="button" onclick="searchDeityViaRuleMasterAi('${escapeDeityHtml(filterText).replace(/'/g, "\\\'")}'); closeDeitySpotlightDropdown();" class="w-full py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-extrabold text-xs rounded-lg shadow transition flex items-center justify-center gap-1.5 cursor-pointer">
              <span>🔮</span>
              <span>Fetch Deity "${escapeDeityHtml(filterText)}" via Rule Master AI</span>
            </button>
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

          const domainList = Array.isArray(d.domains) && d.domains.length ? d.domains.slice(0, 3).join(', ') : '-';

          html += `
            <button type="button" data-deity-name="${escapeDeityHtml(d.name)}" onclick="selectDeityItem('${escapeDeityHtml(d.name).replace(/'/g, "\\'")}')" class="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer group active:scale-[0.99] ${selectedClasses}">
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-sm shrink-0">${d.icon || '☀️'}</span>
                <div class="truncate">
                  <div class="text-xs font-bold flex items-center gap-1.5">
                    <span class="truncate">${d.name}</span>
                    <span class="text-[9px] text-slate-400 font-normal truncate">(${d.title || d.name})</span>
                    ${isSelected ? '<span class="text-[9px] px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-700 font-mono">Selected</span>' : ''}
                  </div>
                  <div class="text-[9px] text-purple-300/80 font-mono truncate">
                    ${d.alignment || 'Any'} • Silah: ${d.weapon || '-'} • Alanlar: ${domainList}
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
            <button type="button" onclick="selectDeityItem('Diğer')" class="w-full text-left px-2.5 py-2 rounded-lg bg-gradient-to-r from-purple-950/70 to-indigo-950/70 hover:from-purple-900/80 hover:to-indigo-900/80 border border-purple-500/40 hover:border-purple-400 text-purple-200 flex items-center justify-between transition cursor-pointer group active:scale-[0.99]">
              <div class="flex items-center gap-2">
                <span class="text-base shrink-0">🔮</span>
                <div>
                  <div class="text-xs font-bold text-purple-200 group-hover:text-white">Other (Search Custom Deity via Rule Master AI...)</div>
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
      if (deityName === 'Diğer') {
        searchDeityViaRuleMasterAi();
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

    async function searchDeityViaRuleMasterAi(queryName = null) {
      let q = queryName;
      if (!q) {
        const searchInput = document.getElementById('deity-spotlight-search');
        if (searchInput && searchInput.value.trim()) q = searchInput.value.trim();
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

      if (typeof showDiceTopToast === 'function') {
        showDiceTopToast({
          title: 'Rule Master AI',
          breakdown: `Searching "${escapeDeityHtml(q)}" across official D&D 3.5e sourcebooks...`,
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

        // Cache in localStorage
        try {
          let customDeities = [];
          const existingSaved = localStorage.getItem('dnd35_custom_deities');
          if (existingSaved) customDeities = JSON.parse(existingSaved) || [];
          const idx = customDeities.findIndex(d => d.name.toLowerCase() === deityObj.name.toLowerCase());
          if (idx >= 0) customDeities[idx] = deityObj;
          else customDeities.push(deityObj);
          localStorage.setItem('dnd35_custom_deities', JSON.stringify(customDeities));
        } catch (e) {
          console.warn('Failed to cache deity in localStorage:', e);
        }

        // Set input value and update trigger
        const hiddenInput = document.getElementById('profile-edit-deity');
        if (hiddenInput) hiddenInput.value = deityObj.name;
        updateDeitySpotlightTrigger(deityObj.name);

        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: `${deityObj.name} Bulundu!`,
            breakdown: `Alignment: ${deityObj.alignment || '-'} • Favored Weapon: ${deityObj.favoredWeapon || '-'} • Domains: ${(deityObj.domains || []).join(', ')}`,
            icon: '✨'
          });
        }
      } catch (err) {
        console.error(err);
        alert('Deity lookup error: ' + err.message);
      }
    }

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

      // Build Stat Bonus Pill
      const statChanges = [];
      if (raceObj.strBonus) statChanges.push(`${raceObj.strBonus > 0 ? '+' : ''}${raceObj.strBonus} STR`);
      if (raceObj.dexBonus) statChanges.push(`${raceObj.dexBonus > 0 ? '+' : ''}${raceObj.dexBonus} DEX`);
      if (raceObj.conBonus) statChanges.push(`${raceObj.conBonus > 0 ? '+' : ''}${raceObj.conBonus} CON`);
      if (raceObj.intBonus) statChanges.push(`${raceObj.intBonus > 0 ? '+' : ''}${raceObj.intBonus} INT`);
      if (raceObj.wisBonus) statChanges.push(`${raceObj.wisBonus > 0 ? '+' : ''}${raceObj.wisBonus} WIS`);
      if (raceObj.chaBonus) statChanges.push(`${raceObj.chaBonus > 0 ? '+' : ''}${raceObj.chaBonus} CHA`);

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
          <span class="text-[9px] uppercase font-bold text-slate-400">Irksal Statlar:</span>
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
      if (badge) badge.textContent = `${_npcStudioAbilities.length} Yetenek`;
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
      if (badge) badge.textContent = `${_npcStudioManeuvers.length} Manevra`;
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
          total: character.cr ? `CR ${character.cr}` : 'Kaydedildi'
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

      container.innerHTML = STAT_KEYS.map(s => {
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
          badgeEl.innerHTML = `<span>✅ Tam Dengeli: <strong>0</strong> / ${budget} Puan</span>`;
        } else if (remaining > 0) {
          badgeEl.className = 'px-2.5 py-1 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 bg-amber-950 text-amber-300 border border-amber-600';
          badgeEl.innerHTML = `<span>⏳ Kalan: <strong>${remaining}</strong> / ${budget} Puan</span>`;
        } else {
          badgeEl.className = 'px-2.5 py-1 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 bg-rose-950 text-rose-300 border border-rose-600 animate-pulse';
          badgeEl.innerHTML = `<span>⚠️ Over Budget: <strong>${remaining}</strong> / ${budget} Points!</span>`;
        }
      }
    }

    function renderPointBuyPanel() {
      const container = document.getElementById('pointbuy-stats-container');
      if (!container) return;

      container.innerHTML = STAT_KEYS.map(s => {
        const val = Number(statDistState.workingAbilities[s.key]) || 8;
        const mod = Math.floor((val - 10) / 2);
        const modStr = (mod >= 0 ? '+' : '') + mod;
        const cost = getPointBuyCost(val);
        const nextCost = val < 18 ? getPointBuyCost(val + 1) - cost : 0;

        return `
          <div class="bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="w-10 text-center font-black text-xs font-mono px-1.5 py-0.5 rounded bg-purple-950/70 border border-purple-800 text-purple-300">${s.label}</span>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-slate-200">${s.name}</span>
                  <span class="text-[10px] text-slate-400 font-mono">Mod: <strong class="${mod >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${modStr}</strong></span>
                </div>
                <div class="text-[10px] text-purple-300/80 font-mono">Cost: <strong class="text-amber-400">${cost} pt</strong> ${val < 18 ? `(Next +1: ${nextCost} pt)` : '(Max 18)'}</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" onclick="adjustPointBuyStat('${s.key}', -1)" ${val <= 8 ? 'disabled' : ''} class="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 text-slate-200 font-bold text-sm flex items-center justify-center transition cursor-pointer">－</button>
              <span class="w-10 text-center text-amber-400 font-mono font-black text-base">${val}</span>
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
          breakdown: `Yeni Zarlar: [${newRoll.rolls.join(', ')}] (Elenen: ${newRoll.rolls[newRoll.droppedIndex]})${rerollNote}`
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
        assignBox.innerHTML = STAT_KEYS.map(s => {
          const assignedRoll = statDistState.rolledDice.find(r => r.assignedTo === s.key);
          const val = assignedRoll ? assignedRoll.total : (Number(statDistState.workingAbilities[s.key]) || 10);
          const mod = Math.floor((val - 10) / 2);
          const modStr = (mod >= 0 ? '+' : '') + mod;

          const optionsHtml = statDistState.rolledDice.map(r => {
            const isSelected = (r.assignedTo === s.key);
            const otherOwner = (r.assignedTo && r.assignedTo !== s.key) ? `(${r.assignedTo.toUpperCase()})` : '';
            return `<option value="${r.id}" ${isSelected ? 'selected' : ''}>Toplam: ${r.total} [${r.rolls.join(',')}] ${otherOwner}</option>`;
          }).join('');

          return `
            <div class="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-10 text-center font-black text-xs font-mono px-1.5 py-0.5 rounded bg-purple-950/70 border border-purple-800 text-purple-300">${s.label}</span>
                <div>
                  <div class="text-[11px] font-bold text-slate-200 leading-tight">${s.name}</div>
                  <div class="text-[10px] text-slate-400 font-mono">Nihai: <strong class="text-amber-400 font-bold">${val}</strong> (${modStr})</div>
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
      const curSelectedRace = (document.getElementById('profile-edit-race')?.value || character?.race || '').toLowerCase().trim();
      const catalog = (typeof window.BUNDLED_SRD_CORE_CATALOG !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG))
        ? window.BUNDLED_SRD_CORE_CATALOG
        : [];
      const raceObj = catalog.find(item => item && item.type === 'Race' && (item.name || '').toLowerCase().trim() === curSelectedRace);

      previewContainer.innerHTML = STAT_KEYS.map(s => {
        const baseScore = Number(statDistState.workingAbilities[s.key]) || 10;
        const racialMod = (raceObj && raceObj[`${s.key}Bonus`]) ? Number(raceObj[`${s.key}Bonus`]) : 0;
        
        // Ekipman & Buff bonus farkını hesapla (Irksal hariç ekipman/buff bonusları)
        let itemBuffBonus = 0;
        if (typeof RuleEngine !== 'undefined' && RuleEngine.resolveBonusStacking && character.abilitySources?.[s.key]) {
          const nonRacialSources = (character.abilitySources[s.key] || []).filter(src => src && (src.type || '').toLowerCase() !== 'racial');
          itemBuffBonus = RuleEngine.resolveBonusStacking(nonRacialSources);
        } else {
          const currentTotal = Number(character.abilities?.[s.key]) || baseScore;
          const currentBase = Number(character.baseAbilities?.[s.key]) || currentTotal;
          itemBuffBonus = currentTotal - currentBase;
        }

        const finalScore = baseScore + racialMod + itemBuffBonus;
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
              ${racialMod !== 0 ? `<span class="${racialMod > 0 ? 'text-emerald-400' : 'text-rose-400'} ml-0.5">${racialMod > 0 ? '+' + racialMod : racialMod}</span>` : ''}
              ${itemBuffBonus !== 0 ? `<span class="text-purple-400 ml-0.5">${itemBuffBonus > 0 ? '+' + itemBuffBonus : itemBuffBonus}</span>` : ''}
            </div>
          </div>
        `;
      }).join('');

      if (totalModEl) {
        totalModEl.textContent = `Toplam Mod: ${sumMods >= 0 ? '+' : ''}${sumMods}`;
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
        const raceObj = catalog.find(item => item && item.type === 'Race' && (item.name.toLowerCase() === newRace.toLowerCase() || item.name.toLowerCase().includes(newRace.toLowerCase())));

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

      const newAlign = getVal('profile-edit-alignment');
      if (newAlign) character.alignment = newAlign;

      const newDeity = getVal('profile-edit-deity');
      if (newDeity !== undefined) character.deity = newDeity;

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
          title: 'Karakter & Statlar Kaydedildi',
          breakdown: 'Identity details and base ability scores updated. HP, AC, Attack, Skills, and Saving Throws recalculated by the rule engine.',
          total: 'TAMAMLANDI'
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
          breakdown: `${evaluated.rollDesc} • Kalan Can: ${character.hp.current}/${character.hp.max}${character.hp.temp > 0 ? ` (+${character.hp.temp} Temp)` : ''}`,
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
      saveStateToStorage(true);
      renderAll();
      showDiceTopToast({
        icon: '🛡️',
        title: `${sourceName} (Temp HP)`,
        breakdown: `Temporary HP: +${character.hp.temp} Temp HP • Base HP: ${character.hp.current}/${character.hp.max}`,
        total: `+${tempVal} Temp`
      });
    }

    function applySpellSelfDamage(amount, sourceName = 'Kan Fedas\u0131', showToast = true, toastOptions = { stack: true }) {
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
        { name: 'Zehir (Poison)', amount: '1d4', rounds: 3, infinite: false, icon: '🧪' },
        { name: 'Yanma (Fire/Burn)', amount: '1d6', rounds: 2, infinite: false, icon: '🔥' },
        { name: 'Kanama (Bleed)', amount: '1', rounds: 5, infinite: false, icon: '🩸' },
        { name: 'Asit (Acid)', amount: '1d6+2', rounds: 3, infinite: false, icon: '⚡' },
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
        const durLabel = p.infinite ? '∞' : `${p.rounds}t`;
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
          initialRollDesc = evalRes.isDice ? ` [Zar: ${evalRes.rollDesc}]` : ` (${evalRes.total} HP)`;
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
        const rate = isDmg ? `-${safeAmount} HP/tur` : `+${safeAmount} HP/tur`;
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
        if (dotCount > 0 && hotCount > 0) bText = `${effects.length} Etki`;
        else if (dotCount > 0) bText = `🩸 ${dotCount} DoT`;
        else bText = `💖 ${hotCount} HoT`;
        badge.textContent = bText;
      }

      container.innerHTML = effects.map(eff => {
        const isDmg = eff.type === 'damage';
        const bgClass = isDmg 
          ? 'bg-rose-950/70 border-rose-700/60 text-rose-200' 
          : 'bg-emerald-950/70 border-emerald-700/60 text-emerald-200';
        const textClass = isDmg ? 'text-rose-400' : 'text-emerald-400';
        const safeName = String(eff.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const safeAmount = String(eff.amount || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const rateText = isDmg ? `-${safeAmount} HP/tur` : `+${safeAmount} HP/tur`;
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

      const inactiveClass = 'py-1.5 px-2 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer';

      if (btnMelee) btnMelee.className = inactiveClass;
      if (btnRanged) btnRanged.className = inactiveClass;

      if (mode === 'ranged') {
        if (meleePanel) meleePanel.classList.remove('hidden');
        const meleeModsBlock = document.getElementById('combat-modifiers-melee-block');
        const rangedModsBlock = document.getElementById('combat-modifiers-ranged-block');
        if (meleeModsBlock) meleeModsBlock.classList.add('hidden');
        if (rangedModsBlock) rangedModsBlock.classList.remove('hidden');

        if (btnRanged) {
          btnRanged.className = 'py-1.5 px-2 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow cursor-pointer';
        }
        if (cardTitle) {
          cardTitle.innerHTML = '<span>🏹</span> <span class="truncate">SALDIRI ROTASYONU</span>';
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
          btnMelee.className = 'py-1.5 px-2 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition bg-gradient-to-r from-red-600 to-rose-600 text-white shadow cursor-pointer';
        }
        if (cardTitle) {
          cardTitle.innerHTML = '<span>⚔️</span> <span class="truncate">SALDIRI ROTASYONU</span>';
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

      const panels = [
        { key: 'physical', bodyId: 'combat-physical-card-body', barId: 'combat-physical-collapsed-bar', btnId: 'btn-collapse-physical' },
        { key: 'spell', bodyId: 'combat-spell-card-body', barId: 'combat-spell-collapsed-bar', btnId: 'btn-collapse-spell' },
        { key: 'defense', bodyId: 'combat-defense-card-body', barId: 'combat-defense-collapsed-bar', btnId: 'btn-collapse-defense' },
        { key: 'consumables', bodyId: 'combat-consumables-card-body', barId: 'combat-consumables-collapsed-bar', btnId: 'btn-collapse-consumables' }
      ];

      panels.forEach(p => {
        const isCollapsed = !!character.cockpitCollapsed[p.key];
        const bodyEl = document.getElementById(p.bodyId);
        const barEl = document.getElementById(p.barId);
        const btnEl = document.getElementById(p.btnId);

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

