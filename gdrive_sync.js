/**
 * Vercel Personal Cloud & Vault Synchronization Module (CloudSync / GDriveSync)
 *
 * Syncs BOTH `character` AND `masterDb` (29-column Master_DB) seamlessly across
 * PC, tablet, and mobile browsers via:
 * 1. Vercel Serverless API (`/api/storage`) + Vercel Storage (Upstash Redis / KV)
 * 2. Personal Vault Protection (`APP_PIN` environment variable on Vercel)
 * 3. Direct Upstash REST API fallback (for offline/local `file://` testing)
 */

const STORAGE_KEY_DIRECT = 'dnd35_universal_state_v1';

const CloudSync = {
  appPin: localStorage.getItem('dnd35_app_pin') || '',
  upstashUrl: localStorage.getItem('dnd35_upstash_url') || '',
  upstashToken: localStorage.getItem('dnd35_upstash_token') || '',

  serverAvailable: false,
  configured: false,
  pinRequired: false,
  authenticated: false,
  isSyncing: false,
  autoSaveTimer: null,
  lastSyncedAt: null,

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.appPin) headers['x-app-pin'] = this.appPin;
    if (this.upstashUrl) headers['x-upstash-url'] = this.upstashUrl;
    if (this.upstashToken) headers['x-upstash-token'] = this.upstashToken;
    return headers;
  },

  hasDirectUpstash() {
    return Boolean(this.upstashUrl && this.upstashUrl.trim() && this.upstashToken && this.upstashToken.trim());
  },

  // Initialize Cloud Sync & check Personal Vault lock status
  async init() {
    this.appPin = localStorage.getItem('dnd35_app_pin') || '';
    this.upstashUrl = localStorage.getItem('dnd35_upstash_url') || '';
    this.upstashToken = localStorage.getItem('dnd35_upstash_token') || '';

    this.populateSettingsInputs();

    // Check if running on http/https where /api/storage may exist
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      try {
        const res = await fetch('/api/storage?action=status', {
          method: 'GET',
          headers: this.getHeaders()
        });

        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
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
        // /api/storage not reachable (e.g., static preview server)
        console.log('CloudSync: /api/storage endpoint not detected, checking direct Upstash fallback.');
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
    let modal = document.getElementById('vault-lock-modal');
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
      this.showVaultLockModal('⚠️ Lütfen Vercel üzerinde tanımladığınız APP_PIN şifresini girin.');
      return;
    }

    this.appPin = val;
    localStorage.setItem('dnd35_app_pin', val);
    this.populateSettingsInputs();

    try {
      const res = await fetch('/api/storage?action=status', {
        method: 'GET',
        headers: this.getHeaders()
      });
      const status = await res.json();
      if (status && status.authenticated) {
        this.authenticated = true;
        this.configured = Boolean(status.configured);
        this.hideVaultLockModal();
        if (this.configured) {
          await this.pullFromCloud(true);
        } else {
          this.updateStatusUI('unconfigured');
        }
      } else {
        localStorage.removeItem('dnd35_app_pin');
        this.appPin = '';
        this.showVaultLockModal('❌ Hatalı APP_PIN şifresi! Lütfen tekrar deneyin.');
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

    this.appPin = (pinEl ? pinEl.value : '').trim();
    this.upstashUrl = (urlEl ? urlEl.value : '').trim().replace(/\/$/, '');
    this.upstashToken = (tokenEl ? tokenEl.value : '').trim();

    if (this.appPin) localStorage.setItem('dnd35_app_pin', this.appPin);
    else localStorage.removeItem('dnd35_app_pin');

    if (this.upstashUrl) localStorage.setItem('dnd35_upstash_url', this.upstashUrl);
    else localStorage.removeItem('dnd35_upstash_url');

    if (this.upstashToken) localStorage.setItem('dnd35_upstash_token', this.upstashToken);
    else localStorage.removeItem('dnd35_upstash_token');

    await this.init();

    if (this.configured && this.authenticated) {
      alert('✅ Vercel / Upstash Bulut bağlantısı doğrulandı ve aktif edildi!');
    } else if (this.pinRequired && !this.authenticated) {
      alert('❌ Girdiğiniz APP_PIN şifresi sunucudaki şifre ile eşleşmedi.');
    } else {
      alert('ℹ️ Ayarlar kaydedildi. Bulut senkronizasyonu için Vercel panelinden Upstash KV bağlayın veya Upstash REST URL/Token bilgilerini girin.');
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

  // Apply cloud payload (character + masterDb) into active app state
  applyRemotePayload(remotePayload) {
    if (!remotePayload || typeof remotePayload !== 'object') return false;

    let applied = false;

    // 1. Restore Character
    const remoteChar = remotePayload.character || (remotePayload.name || remotePayload.abilities ? remotePayload : null);
    if (remoteChar && typeof character !== 'undefined' && character) {
      Object.keys(character).forEach(k => delete character[k]);
      Object.assign(character, remoteChar);
      localStorage.setItem('dnd35_character', JSON.stringify(character));
      applied = true;
    }

    // 2. Restore Master DB (29-column library)
    if (Array.isArray(remotePayload.masterDb) && remotePayload.masterDb.length > 0 && typeof masterDb !== 'undefined') {
      masterDb.length = 0;
      remotePayload.masterDb.forEach(item => masterDb.push(item));
      localStorage.setItem('dnd35_master_db', JSON.stringify(masterDb));
      if (window.RuleMaster && typeof RuleMaster.renderTable === 'function') {
        RuleMaster.renderTable();
      }
      applied = true;
    }

    if (applied && typeof renderAll === 'function') {
      renderAll();
    }

    return applied;
  },

  // Pull Character + Master DB from Vercel Cloud / Upstash
  async pullFromCloud(silent = false) {
    if (this.isSyncing) return;
    this.isSyncing = true;
    this.updateStatusUI('syncing');

    try {
      let remoteData = null;
      let isEmpty = false;

      if (this.serverAvailable) {
        const res = await fetch('/api/storage', {
          method: 'GET',
          headers: this.getHeaders()
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
          headers: { Authorization: `Bearer ${this.upstashToken}` }
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

      const ok = this.applyRemotePayload(remoteData);
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
    this.updateStatusUI('syncing');

    try {
      const nowIso = new Date().toISOString();
      if (typeof character !== 'undefined' && character) {
        character.lastModified = nowIso;
      }

      const payload = {
        version: 2,
        lastModified: nowIso,
        character: typeof character !== 'undefined' ? character : {},
        masterDb: typeof masterDb !== 'undefined' && Array.isArray(masterDb) ? masterDb : []
      };

      if (this.serverAvailable) {
        const res = await fetch('/api/storage', {
          method: 'POST',
          headers: this.getHeaders(),
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

  // Update Top Navbar Pill & Settings Modal Status Badge
  updateStatusUI(status) {
    const pill = document.getElementById('sync-status-pill');
    const text = document.getElementById('sync-status-text');
    if (pill && text) {
      if (status === 'connected' || status === 'synced') {
        pill.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-600';
        text.textContent = '🟢 Vercel Bulut Senkron (Karakter + DB)';
      } else if (status === 'syncing') {
        pill.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-600';
        text.textContent = '🔄 Bulut Eşitleniyor...';
      } else if (status === 'locked') {
        pill.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-950/80 text-rose-300 border border-rose-600 cursor-pointer';
        text.textContent = '🔒 Özel Kasa Kilitli (PIN Girin)';
      } else if (status === 'error') {
        pill.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-950/80 text-rose-300 border border-rose-600';
        text.textContent = '⚠️ Bulut Bağlantı Hatası';
      } else {
        pill.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700';
        text.textContent = '🟡 Yerel Kayıtlı (Çevrimdışı Bellek)';
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
      } else {
        settingsStatus.innerHTML = '<span class="text-amber-400">🟡 Yerel Mod (Bulut Bağlı Değil)</span>';
      }
    }
  }
};

window.CloudSync = CloudSync;
window.GDriveSync = CloudSync;
