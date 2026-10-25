/**
 * Vercel Personal Cloud & Vault Synchronization Module (CloudSync / GDriveSync)
 *
 * Syncs BOTH `character` AND `masterDb` (29-column Master_DB) seamlessly across
 * PC, tablet, and mobile browsers via:
 * 1. Vercel Serverless API (`/api/storage`) + Vercel Storage (Upstash Redis / KV)
 * 2. Personal Vault Protection (`APP_PIN` stored in Upstash KV or Vercel Env)
 * 3. Direct Upstash REST API fallback (for offline/local `file://` testing)
 */

const STORAGE_KEY_DIRECT = 'dnd35_universal_state_v1';

const CloudSync = {
  appPin: (localStorage.getItem('dnd35_app_pin') || '').trim(),
  upstashUrl: (localStorage.getItem('dnd35_upstash_url') || '').trim(),
  upstashToken: (localStorage.getItem('dnd35_upstash_token') || '').trim(),

  serverAvailable: false,
  configured: false,
  pinRequired: false,
  authenticated: false,
  isSyncing: false,
  isInitializing: false,
  autoSaveTimer: null,
  lastSyncedAt: null,

  getHeaders(overridePin) {
    const headers = {
      'Content-Type': 'application/json'
    };
    const pinToUse = overridePin !== undefined ? overridePin : this.appPin;
    if (pinToUse) {
      // Always URI-encode header value so Turkish / UTF-8 characters never throw in fetch()
      headers['x-app-pin'] = encodeURIComponent(String(pinToUse).trim());
    }
    if (this.upstashUrl) headers['x-upstash-url'] = this.upstashUrl;
    if (this.upstashToken) headers['x-upstash-token'] = this.upstashToken;
    return headers;
  },

  buildApiUrl(action = '', overridePin) {
    const params = new URLSearchParams();
    if (action) params.set('action', action);
    const pinToUse = overridePin !== undefined ? overridePin : this.appPin;
    if (pinToUse) params.set('pin', String(pinToUse).trim());
    params.set('t', String(Date.now()));
    return `/api/storage?${params.toString()}`;
  },

  hasDirectUpstash() {
    return Boolean(this.upstashUrl && this.upstashUrl.trim() && this.upstashToken && this.upstashToken.trim());
  },

  // Initialize Cloud Sync & check Personal Vault lock status
  async init() {
    this.isInitializing = true;
    this.appPin = (localStorage.getItem('dnd35_app_pin') || '').trim();
    this.upstashUrl = (localStorage.getItem('dnd35_upstash_url') || '').trim();
    this.upstashToken = (localStorage.getItem('dnd35_upstash_token') || '').trim();

    this.populateSettingsInputs();

    try {
      // Check if running on http/https where /api/storage exists
      if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        try {
          const res = await fetch(this.buildApiUrl('status'), {
            method: 'GET',
            headers: this.getHeaders(),
            cache: 'no-store'
          });

          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const status = await res.json();
            this.serverAvailable = true;
            this.configured = Boolean(status.configured);
            this.pinRequired = Boolean(status.pinRequired);
            this.authenticated = Boolean(status.authenticated);

            if (this.pinRequired && !this.authenticated) {
              this.updateStatusUI('locked');
              this.showVaultLockModal();
              return;
            } else {
              this.hideVaultLockModal();
            }

            if (this.configured && this.authenticated) {
              this.updateStatusUI('connected');
              await this.pullFromCloud(true);
              return;
            } else {
              this.updateStatusUI('unconfigured');
              return;
            }
          }
        } catch (err) {
          console.warn('CloudSync: /api/storage check error, checking direct Upstash fallback:', err);
        }
      }

      // Fallback: Direct Upstash REST connection from browser (works even on file://)
      if (this.hasDirectUpstash()) {
        this.configured = true;
        this.authenticated = true;
        this.updateStatusUI('connected');
        await this.pullFromCloud(true);
      } else {
        this.updateStatusUI('unconfigured');
      }
    } finally {
      this.isInitializing = false;
    }
  },

  populateSettingsInputs() {
    const pinInput = document.getElementById('settings-app-pin');
    if (pinInput) pinInput.value = this.appPin;

    const urlInput = document.getElementById('settings-upstash-url');
    if (urlInput) urlInput.value = this.upstashUrl;

    const tokenInput = document.getElementById('settings-upstash-token');
    if (tokenInput) tokenInput.value = this.upstashToken;
  },

  // Show Fullscreen Personal Vault Lock Modal when APP_PIN is required on Vercel
  showVaultLockModal(errorMsg = '') {
    const modal = document.getElementById('vault-lock-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    const errEl = document.getElementById('vault-lock-error');
    if (errEl) {
      if (errorMsg) {
        errEl.textContent = errorMsg;
        errEl.classList.remove('hidden');
      } else {
        errEl.classList.add('hidden');
      }
    }
    const input = document.getElementById('vault-lock-pin-input');
    if (input) {
      if (this.appPin && !input.value) input.value = this.appPin;
      setTimeout(() => input.focus(), 100);
    }
  },

  hideVaultLockModal() {
    const modal = document.getElementById('vault-lock-modal');
    if (modal) modal.classList.add('hidden');
  },

  // Submit PIN from Lock Screen
  async unlockVault() {
    const input = document.getElementById('vault-lock-pin-input');
    const val = (input ? input.value : '').trim();
    if (!val) {
      this.showVaultLockModal('⚠️ Lütfen belirlediğiniz APP_PIN şifresini girin.');
      return;
    }

    this.appPin = val;
    localStorage.setItem('dnd35_app_pin', val);
    this.populateSettingsInputs();

    try {
      const res = await fetch(this.buildApiUrl('status', val), {
        method: 'GET',
        headers: this.getHeaders(val),
        cache: 'no-store'
      });
      const status = await res.json();
      if (status && status.authenticated) {
        this.authenticated = true;
        this.configured = Boolean(status.configured);
        this.hideVaultLockModal();
        if (this.configured) {
          this.updateStatusUI('connected');
          await this.pullFromCloud(true);
        } else {
          this.updateStatusUI('unconfigured');
        }
      } else {
        localStorage.removeItem('dnd35_app_pin');
        this.appPin = '';
        this.showVaultLockModal('❌ Hatalı APP_PIN şifresi! Şifrenizi sıfırlamak isterseniz alttaki "Ayarlar / Şifre Değiştir" butonuna tıklayın.');
      }
    } catch (err) {
      this.showVaultLockModal('❌ Sunucu bağlantı hatası: ' + err.message);
    }
  },

  // Save Cloud Settings from Settings Modal
  async saveCloudSettings() {
    const pinEl = document.getElementById('settings-app-pin');
    const urlEl = document.getElementById('settings-upstash-url');
    const tokenEl = document.getElementById('settings-upstash-token');

    const newPin = (pinEl ? pinEl.value : '').trim();
    this.upstashUrl = (urlEl ? urlEl.value : '').trim().replace(/\/$/, '');
    this.upstashToken = (tokenEl ? tokenEl.value : '').trim();

    if (this.upstashUrl) localStorage.setItem('dnd35_upstash_url', this.upstashUrl);
    else localStorage.removeItem('dnd35_upstash_url');

    if (this.upstashToken) localStorage.setItem('dnd35_upstash_token', this.upstashToken);
    else localStorage.removeItem('dnd35_upstash_token');

    this.appPin = newPin;
    if (this.appPin) localStorage.setItem('dnd35_app_pin', this.appPin);
    else localStorage.removeItem('dnd35_app_pin');

    // If running on Vercel, persist the new PIN into Upstash KV (`dnd35_vault_pin_v1`)
    let setPinError = '';
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      try {
        const pinRes = await fetch(this.buildApiUrl('setPin', newPin), {
          method: 'POST',
          headers: this.getHeaders(newPin),
          cache: 'no-store',
          body: JSON.stringify({ newPin })
        });
        const pinJson = await pinRes.json().catch(() => ({}));
        if (!pinRes.ok && pinJson && pinJson.error) {
          setPinError = pinJson.error;
        }
      } catch (e) {
        console.warn('CloudSync: setPin request error:', e);
      }
    }

    await this.init();

    if (this.configured && this.authenticated) {
      // Ensure current local state is pushed if user just configured their vault
      await this.pushToCloud(true);
      alert(this.appPin
        ? '✅ Vercel Bulut bağlantısı ve Kişisel Kasa Şifreniz (APP_PIN) doğrudan veritabanına kaydedildi ve senkronize edildi!'
        : '✅ Vercel / Upstash Bulut bağlantısı doğrulandı ve aktif edildi!');
    } else if (this.pinRequired && !this.authenticated) {
      alert('❌ Şifre doğrulanamadı: ' + (setPinError || 'Girdiğiniz APP_PIN sunucudaki şifre ile eşleşmedi.'));
    } else {
      alert('ℹ️ Ayarlar kaydedildi. Bulut senkronizasyonu için Vercel panelinden Storage -> Upstash KV bağlayın veya Upstash REST URL/Token bilgilerini girin.');
    }
  },

  // Connect / Diagnose button handler
  async connect() {
    await this.init();
    if (this.pinRequired && !this.authenticated) {
      this.showVaultLockModal();
      return;
    }
    if (this.configured && this.authenticated) {
      await this.pullFromCloud(false);
    } else {
      if (typeof openSettingsModal === 'function') {
        openSettingsModal();
      }
    }
  },

  // Apply cloud payload (character + masterDb + optional hubDb) into active app state
  applyRemotePayload(remotePayload, silent = false) {
    if (!remotePayload) return false;
    if (typeof remotePayload === 'string') {
      try { remotePayload = JSON.parse(remotePayload); } catch (e) { return false; }
    }
    if (!remotePayload || typeof remotePayload !== 'object') return false;

    let applied = false;

    // 0. Sync Hub Database if present in cloud payload
    if (remotePayload.hubDb && typeof remotePayload.hubDb === 'object') {
      try {
        const localHubRaw = localStorage.getItem('dnd35_hub_db');
        if (!localHubRaw) {
          localStorage.setItem('dnd35_hub_db', JSON.stringify(remotePayload.hubDb));
          applied = true;
        } else {
          let localHub = null;
          try { localHub = JSON.parse(localHubRaw); } catch (err) {}
          if (localHub && typeof localHub === 'object') {
            if (!Array.isArray(localHub.characters)) localHub.characters = [];
            if (!Array.isArray(localHub.campaigns)) localHub.campaigns = [];

            const remoteChars = Array.isArray(remotePayload.hubDb.characters) ? remotePayload.hubDb.characters : [];
            const remoteCamps = Array.isArray(remotePayload.hubDb.campaigns) ? remotePayload.hubDb.campaigns : [];

            // Merge campaigns by ID
            remoteCamps.forEach(rc => {
              if (!rc || !rc.id) return;
              const exIdx = localHub.campaigns.findIndex(c => c.id === rc.id);
              if (exIdx >= 0) {
                localHub.campaigns[exIdx] = { ...localHub.campaigns[exIdx], ...rc };
              } else {
                localHub.campaigns.push(rc);
              }
            });

            // Merge characters by ID and signature to prevent duplicate cards
            const seenIds = new Set(localHub.characters.map(c => c.id).filter(Boolean));
            const seenSigs = new Set(localHub.characters.map(c => `${(c.name || '').toLowerCase().trim()}__${(c.classes || '').toLowerCase().trim()}__${c.level || 1}`));

            remoteChars.forEach(rc => {
              if (!rc || !rc.id) return;
              const exIdx = localHub.characters.findIndex(c => c.id === rc.id);
              if (exIdx >= 0) {
                const localC = localHub.characters[exIdx];
                const localHpTs = Number(localC.lastHpUpdateTs) || 0;
                const remoteHpTs = Number(rc.lastHpUpdateTs) || 0;

                // Protect local character HP if local has newer DM HP update
                if (localHpTs > remoteHpTs) {
                  const savedCurrentHp = localC.currentHp;
                  const savedTempHp = localC.tempHp;
                  const savedTs = localC.lastHpUpdateTs;
                  localHub.characters[exIdx] = { ...localC, ...rc, currentHp: savedCurrentHp, tempHp: savedTempHp, lastHpUpdateTs: savedTs };
                } else {
                  localHub.characters[exIdx] = { ...localC, ...rc };
                }
              } else {
                const sig = `${(rc.name || '').toLowerCase().trim()}__${(rc.classes || '').toLowerCase().trim()}__${rc.level || 1}`;
                if (!seenSigs.has(sig) && !seenIds.has(rc.id)) {
                  seenIds.add(rc.id);
                  seenSigs.add(sig);
                  localHub.characters.push(rc);
                }
              }
            });

            localHub.lastSaved = new Date().toISOString();
            localStorage.setItem('dnd35_hub_db', JSON.stringify(localHub));
            applied = true;
          }
        }
        if (typeof initHubStorage === 'function') {
          try {
            initHubStorage();
            if (typeof renderHub === 'function') renderHub();
          } catch (hubErr) {
            console.warn('initHubStorage after sync notice:', hubErr);
          }
        }
      } catch (e) {
        console.warn('CloudSync: hubDb sync notice:', e);
      }
    }

    // Check for real-time DM HP update events (Cross-Device Cloud Sync)
    const incomingDmEvent = remotePayload.latestDmEvent || (remotePayload.hubDb && remotePayload.hubDb.latestDmEvent);
    if (incomingDmEvent && incomingDmEvent.type === 'DM_HP_UPDATE') {
      try {
        localStorage.setItem('dnd35_latest_dm_event', JSON.stringify(incomingDmEvent));
        if (typeof window.handleIncomingDmHpEvent === 'function') {
          window.handleIncomingDmHpEvent(incomingDmEvent);
        }
      } catch (e) {
        console.warn('handleIncomingDmHpEvent error:', e);
      }
    }

    // 1. Restore Character (with strict isolation guard against cross-contamination)
    const remoteChar = remotePayload.character || (remotePayload.name || remotePayload.abilities ? remotePayload : null);
    if (remoteChar && typeof character !== 'undefined' && character) {
      const urlParams = new URLSearchParams(window.location.search);
      const reqId = urlParams.get('id') || localStorage.getItem('dnd35_active_character_id');
      const currentCharId = character._hubId || character.id || reqId;
      const remoteCharId = remoteChar._hubId || remoteChar.id;

      // Check if remote payload has hubDb containing the current character
      let matchedFromHub = false;
      if (remotePayload.hubDb && Array.isArray(remotePayload.hubDb.characters) && currentCharId) {
        const foundInCloudHub = remotePayload.hubDb.characters.find(c => c.id === currentCharId);
        if (foundInCloudHub && foundInCloudHub.fullData) {
          const localDmTs = character.hp?._lastDmUpdateTs || 0;
          const cloudDmTs = Number(foundInCloudHub.lastHpUpdateTs) || 0;
          const currentHpBefore = character.hp?.current;
          const currentTempBefore = character.hp?.temp;

          Object.keys(character).forEach(k => delete character[k]);
          Object.assign(character, foundInCloudHub.fullData);
          character._hubId = currentCharId;

          // Preserve newer local DM HP update if exists
          if (localDmTs > cloudDmTs && currentHpBefore !== undefined) {
            if (!character.hp) character.hp = {};
            character.hp.current = currentHpBefore;
            character.hp.temp = currentTempBefore || 0;
            character.hp._lastDmUpdateTs = localDmTs;
          } else if (foundInCloudHub.currentHp !== undefined) {
            if (!character.hp) character.hp = {};
            character.hp.current = foundInCloudHub.currentHp;
            character.hp.temp = foundInCloudHub.tempHp || 0;
            character.hp._lastDmUpdateTs = cloudDmTs;
          }
          applied = true;
          matchedFromHub = true;
        }
      }

      if (!matchedFromHub) {
        // Guard Clause: If user is viewing a specific Hub character or requested a specific ID:
        // Do NOT overwrite it with an unrelated cloud single-character!
        const isDefaultTestChar = (remoteChar.name === "Kazmil'in Çırağı" || remoteChar.name === "Khazmil'in Çırağı" || !remoteCharId);
        const isCurrentDifferent = (currentCharId && remoteCharId && currentCharId !== remoteCharId) ||
                                   (reqId && isDefaultTestChar && character.name !== remoteChar.name);

        if (isCurrentDifferent) {
          console.warn(`CloudSync: Cloud character (${remoteChar.name || remoteCharId}) does not match current active character (${character.name || currentCharId}). Skipping character overwrite to protect character isolation.`);
        } else {
          const localDmTs = character.hp?._lastDmUpdateTs || 0;
          const currentHpBefore = character.hp?.current;
          const currentTempBefore = character.hp?.temp;

          Object.keys(character).forEach(k => delete character[k]);
          Object.assign(character, remoteChar);

          // Preserve newer local DM HP update if exists
          if (localDmTs > 0 && currentHpBefore !== undefined) {
            if (!character.hp) character.hp = {};
            character.hp.current = currentHpBefore;
            character.hp.temp = currentTempBefore || 0;
            character.hp._lastDmUpdateTs = localDmTs;
          }

          // Clean unowned dummy modifiers (like Boots of Speed or Acid Arrow) from activeModifiers
          if (Array.isArray(character.activeModifiers)) {
            character.activeModifiers = character.activeModifiers.filter(m => {
              if (!m || !m.name) return false;
              const n = m.name.toLowerCase().trim();
              if (n.includes('boots of speed')) {
                const hasBoots = typeof characterHasItem === 'function' ? characterHasItem(character, 'Boots of Speed') : false;
                if (!hasBoots) return false;
              }
              if (n.includes('acid arrow')) return false; // Spell attacks belong in spell drawers, not melee modifiers
              return true;
            });
          }

          localStorage.setItem('dnd35_character', JSON.stringify(character));
          applied = true;
        }
      }
    }

    // 2. Restore & Upgrade Master DB (Intelligent Merge / Never Downgrade Canonical DB)
    if (typeof masterDb !== 'undefined') {
      const canonicalDefaults = Array.isArray(window.BUNDLED_MASTER_DB) && window.BUNDLED_MASTER_DB.length > 0
        ? window.BUNDLED_MASTER_DB
        : (Array.isArray(masterDb) ? masterDb : []);

      const incomingList = Array.isArray(remotePayload.masterDb) && remotePayload.masterDb.length > 0
        ? remotePayload.masterDb
        : [];

      const mergedDb = [];
      const seenNames = new Set();

      // Priority 1: Canonical verified defaults from bundled_data.js / master_db.json
      canonicalDefaults.forEach(item => {
        if (!item || !item.name) return;
        const lower = item.name.toLowerCase().trim();
        seenNames.add(lower);
        mergedDb.push(item);
      });

      // Priority 2: Custom user-created items from remote cloud storage
      incomingList.forEach(item => {
        if (!item || !item.name) return;
        const lower = item.name.toLowerCase().trim();
        if (!seenNames.has(lower)) {
          seenNames.add(lower);
          mergedDb.push(item);
        }
      });

      const needsUpgrade = incomingList.length < mergedDb.length;
      masterDb.length = 0;
      mergedDb.forEach(item => masterDb.push(item));
      localStorage.setItem('dnd35_master_db', JSON.stringify(masterDb));

      if (window.RuleMaster && typeof RuleMaster.renderTable === 'function') {
        try { RuleMaster.renderTable(); } catch (e) { console.warn('RuleMaster.renderTable error:', e); }
      }
      applied = true;

      // Automatically upgrade Cloud DB if local canonical database had more verified entries than cloud
      // GUARD: Upgrade at most ONCE per session and NEVER trigger during background silent polling to avoid ping-pong loops!
      if (needsUpgrade && this.configured && this.authenticated && !silent && !this._cloudDbUpgraded) {
        this._cloudDbUpgraded = true;
        console.log(`CloudSync: Upgrading Cloud DB with canonical entries (${incomingList.length} -> ${mergedDb.length} items)...`);
        setTimeout(() => {
          this.pushToCloud(true);
        }, 1500);
      }
    }

    if (applied && typeof renderAll === 'function') {
      try { renderAll(); } catch (e) { console.warn('renderAll after cloud pull error:', e); }
    }

    return applied;
  },

  // Pull Character + Master DB from Vercel Cloud / Upstash
  async pullFromCloud(silent = false) {
    if (this.isSyncing) return;
    this.isSyncing = true;
    if (!silent) {
      this.updateStatusUI('syncing');
    }

    try {
      let remoteData = null;
      let isEmpty = false;

      if (this.serverAvailable) {
        const res = await fetch(this.buildApiUrl(), {
          method: 'GET',
          headers: this.getHeaders(),
          cache: 'no-store'
        });

        if (res.status === 401) {
          this.authenticated = false;
          this.updateStatusUI('locked');
          this.showVaultLockModal('🔒 Oturum kilidi açık değil. Lütfen APP_PIN girin.');
          return;
        }

        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error || `HTTP ${res.status}`);
        }
        isEmpty = Boolean(json.empty);
        remoteData = json.data;
      } else if (this.hasDirectUpstash()) {
        const res = await fetch(`${this.upstashUrl}/get/${encodeURIComponent(STORAGE_KEY_DIRECT)}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${this.upstashToken}` },
          cache: 'no-store'
        });
        if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);
        const json = await res.json();
        if (!json || json.result === null || json.result === undefined) {
          isEmpty = true;
        } else {
          remoteData = typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
        }
      } else {
        this.updateStatusUI('unconfigured');
        if (!silent) {
          alert('⚠️ Bulut veritabanı henüz yapılandırılmamış.\nLütfen Ayarlar (⚙️) menüsünden Vercel / Upstash kurulum adımlarını takip edin.');
        }
        return;
      }

      if (isEmpty || !remoteData) {
        // First time connecting to a fresh DB -> automatically seed it with current local state!
        console.log('CloudSync: Cloud DB is empty, seeding initial Character + Master DB state...');
        this.isSyncing = false;
        await this.pushToCloud(true);
        return;
      }

      const ok = this.applyRemotePayload(remoteData, silent);
      this.lastSyncedAt = new Date();
      this.updateStatusUI('synced');

      if (!silent && ok) {
        const dbCount = Array.isArray(masterDb) ? masterDb.length : 0;
        alert(`✅ Buluttan başarıyla güncellendi!\n\n• Karakter: ${character?.name || 'Bilinmiyor'}\n• Master DB Kayıt Sayısı: ${dbCount} kayıt`);
      }
    } catch (err) {
      console.error('CloudSync: Pull error:', err);
      this.updateStatusUI('error');
      if (!silent) {
        alert('❌ Buluttan veri çekilirken hata oluştu:\n' + err.message);
      }
    } finally {
      this.isSyncing = false;
    }
  },

  // Push Character + Master DB to Vercel Cloud / Upstash
  async pushToCloud(silent = false) {
    if (this.isSyncing) return;
    this.isSyncing = true;
    if (!silent) {
      this.updateStatusUI('syncing');
    }

    try {
      const nowIso = new Date().toISOString();
      if (typeof character !== 'undefined' && character) {
        character.lastModified = nowIso;
      }

      let hubDb = null;
      try {
        const hubRaw = localStorage.getItem('dnd35_hub_db');
        if (hubRaw) hubDb = JSON.parse(hubRaw);
      } catch (e) {}

      let charObj = {};
      if (typeof character !== 'undefined' && character) {
        charObj = character;
      } else {
        try {
          const rawChar = localStorage.getItem('dnd35_character');
          if (rawChar) charObj = JSON.parse(rawChar);
        } catch (e) {}
      }

      let latestDmEvent = null;
      try {
        const rawEvt = localStorage.getItem('dnd35_latest_dm_event');
        if (rawEvt) latestDmEvent = JSON.parse(rawEvt);
        else if (hubDb && hubDb.latestDmEvent) latestDmEvent = hubDb.latestDmEvent;
      } catch (e) {}

      const payload = {
        version: 2,
        lastModified: nowIso,
        character: charObj,
        masterDb: typeof masterDb !== 'undefined' && Array.isArray(masterDb) ? masterDb : [],
        hubDb: hubDb,
        latestDmEvent: latestDmEvent
      };

      if (this.serverAvailable) {
        const res = await fetch(this.buildApiUrl(), {
          method: 'POST',
          headers: this.getHeaders(),
          cache: 'no-store',
          body: JSON.stringify(payload)
        });

        if (res.status === 401) {
          this.authenticated = false;
          this.updateStatusUI('locked');
          this.showVaultLockModal('🔒 Kaydetmek için geçerli APP_PIN şifresini girin.');
          return;
        }

        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error || `HTTP ${res.status}`);
        }
      } else if (this.hasDirectUpstash()) {
        const res = await fetch(this.upstashUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.upstashToken}`,
            'Content-Type': 'application/json'
          },
          cache: 'no-store',
          body: JSON.stringify(['SET', STORAGE_KEY_DIRECT, JSON.stringify(payload)])
        });
        if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);
      } else {
        this.updateStatusUI('unconfigured');
        if (!silent) {
          alert('⚠️ Bulut veritabanı henüz yapılandırılmamış.\nLütfen Ayarlar (⚙️) menüsünden Vercel / Upstash kurulum adımlarını takip edin.');
        }
        return;
      }

      this.lastSyncedAt = new Date();
      this.updateStatusUI('synced');

      if (!silent) {
        const dbCount = Array.isArray(masterDb) ? masterDb.length : 0;
        alert(`✅ Karakter ve Master DB (${dbCount} kayıt) Vercel Bulut Veritabanına kaydedildi!`);
      }
    } catch (err) {
      console.error('CloudSync: Push error:', err);
      this.updateStatusUI('error');
      if (!silent) {
        alert('❌ Buluta kaydedilirken hata oluştu:\n' + err.message);
      }
    } finally {
      this.isSyncing = false;
    }
  },

  // Backwards-compatible aliases
  async pullFromDrive() {
    return this.pullFromCloud(false);
  },

  async pushToDrive() {
    return this.pushToCloud(false);
  },

  // Debounced auto-save for both Character and Master DB changes
  scheduleAutoSave() {
    if (!this.configured || (this.pinRequired && !this.authenticated)) return;
    clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      this.pushToCloud(true);
    }, 2500);
  },

  saveDataDebounced() {
    return this.scheduleAutoSave();
  },

  // Live polling for cross-device DM updates (Player phone / tablet)
  livePollingInterval: null,

  startLiveSyncPolling(intervalMs = 8000) {
    if (this.livePollingInterval) return;
    this.livePollingInterval = setInterval(async () => {
      if (document.hidden) return; // Ekran kapalıysa veya sekme arka plandaysa kota/pil tasarrufu
      if (!this.configured || (this.pinRequired && !this.authenticated)) return;
      if (this.isSyncing) return;

      if (typeof character !== 'undefined' && character) {
        try {
          await this.pullFromCloud(true);
        } catch (e) {
          // Sessiz devam et
        }
      }
    }, intervalMs);
  },

  stopLiveSyncPolling() {
    if (this.livePollingInterval) {
      clearInterval(this.livePollingInterval);
      this.livePollingInterval = null;
    }
  },

  // Update Top Navbar Pill & Settings Modal Status Badge
  updateStatusUI(status) {
    const pill = document.getElementById('sync-status-pill');
    const text = document.getElementById('sync-status-text');
    if (pill && text) {
      if (status === 'connected' || status === 'synced') {
        pill.className = 'cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-600 w-full h-9 whitespace-nowrap shadow-sm transition';
        text.innerHTML = '🟢 Bulut<span class="hidden md:inline"> Senkron (Karakter + DB)</span>';
      } else if (status === 'syncing') {
        pill.className = 'cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-600 w-full h-9 whitespace-nowrap shadow-sm transition';
        text.innerHTML = '🔄 <span class="hidden sm:inline">Bulut </span>Eşitleniyor...';
      } else if (status === 'locked') {
        pill.className = 'cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-medium bg-rose-950/80 text-rose-300 border border-rose-600 w-full h-9 whitespace-nowrap shadow-sm transition';
        text.innerHTML = '🔒 <span class="hidden sm:inline">Özel </span>Kilitli';
      } else if (status === 'error') {
        pill.className = 'cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-medium bg-rose-950/80 text-rose-300 border border-rose-600 w-full h-9 whitespace-nowrap shadow-sm transition';
        text.innerHTML = '⚠️ <span class="hidden sm:inline">Bulut </span>Hata';
      } else {
        pill.className = 'cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 w-full h-9 whitespace-nowrap shadow-sm transition';
        text.innerHTML = '🟡 <span class="hidden sm:inline">Yerel </span>Kayıtlı';
      }
    }

    const settingsStatus = document.getElementById('settings-gdrive-status');
    if (settingsStatus) {
      if (status === 'connected' || status === 'synced') {
        settingsStatus.innerHTML = '<span class="text-emerald-400 font-bold">🟢 Vercel KV Aktif & Senkron</span>';
      } else if (status === 'syncing') {
        settingsStatus.innerHTML = '<span class="text-indigo-400 font-bold">🔄 Eşitleniyor...</span>';
      } else if (status === 'locked') {
        settingsStatus.innerHTML = '<span class="text-rose-400 font-bold">🔒 PIN Doğrulaması Bekleniyor</span>';
      } else if (status === 'error') {
        settingsStatus.innerHTML = '<span class="text-rose-400 font-bold">❌ Bağlantı Hatası</span>';
      } else if (this.appPin) {
        settingsStatus.innerHTML = '<span class="text-amber-400 font-bold">🟡 PIN Kayıtlı (Bağlantı Kontrol Ediliyor...)</span>';
      } else {
        settingsStatus.innerHTML = '<span class="text-amber-400">🟡 Yerel Mod (Bulut Bağlı Değil)</span>';
      }
    }
  }
};

window.CloudSync = CloudSync;
window.GDriveSync = CloudSync;
