/**
 * Google Drive Cross-Platform Synchronization Module
 * Uses Google Identity Services (GIS) and Google Drive REST API v3
 * Syncs dnd35_character.json seamlessly across PC, tablet, and mobile browsers.
 */

const GDriveSync = {
  CLIENT_ID: localStorage.getItem('gdrive_client_id') || '',
  SCOPES: 'https://www.googleapis.com/auth/drive.file',
  FILE_NAME: 'dnd35_character.json',

  tokenClient: null,
  accessToken: null,
  fileId: localStorage.getItem('gdrive_file_id') || null,
  isSyncing: false,
  autoSaveTimer: null,

  // Initialize GIS Token Client
  init(clientId) {
    if (clientId) {
      this.CLIENT_ID = clientId;
      localStorage.setItem('gdrive_client_id', clientId);
    }

    if (!this.CLIENT_ID) {
      console.log('GDriveSync: No Client ID configured yet.');
      this.updateStatusUI('unconfigured');
      return;
    }

    if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
      console.warn('GDriveSync: Google Identity Services library not loaded yet.');
      return;
    }

    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: this.CLIENT_ID,
      scope: this.SCOPES,
      callback: (response) => {
        if (response.error) {
          console.error('GDriveSync: OAuth error', response);
          alert('❌ Google Drive bağlantı hatası: ' + response.error);
          this.updateStatusUI('error');
          return;
        }
        this.accessToken = response.access_token;
        this.updateStatusUI('connected');
        this.findOrCreateFile();
      }
    });

    this.updateStatusUI('ready');
  },

  // Trigger login/consent prompt
  connect() {
    if (!this.CLIENT_ID) {
      const input = prompt('Google Cloud Console Client ID giriniz:\n(Örn: 123456789-xxxx.apps.googleusercontent.com)\n\nNot: Google Drive senkronizasyonu için bir kez Client ID girmeniz yeterlidir.');
      if (input && input.trim()) {
        this.init(input.trim());
      } else {
        return;
      }
    }

    if (this.tokenClient) {
      this.tokenClient.requestAccessToken({ prompt: '' });
    }
  },

  // Disconnect Google Drive
  disconnect() {
    this.accessToken = null;
    this.updateStatusUI('disconnected');
  },

  // Locate or Create dnd35_character.json on Google Drive
  async findOrCreateFile() {
    if (!this.accessToken) return;
    this.isSyncing = true;
    this.updateStatusUI('syncing');

    try {
      const q = encodeURIComponent(`name = '${this.FILE_NAME}' and trashed = false`);
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      const data = await res.json();

      if (data.files && data.files.length > 0) {
        this.fileId = data.files[0].id;
        localStorage.setItem('gdrive_file_id', this.fileId);
        console.log('GDriveSync: Found existing Drive file ID:', this.fileId);
        // Load cloud file content
        await this.pullFromDrive();
      } else {
        // Create new file
        await this.createFileOnDrive();
      }
    } catch (err) {
      console.error('GDriveSync: Error finding file:', err);
      this.updateStatusUI('error');
    } finally {
      this.isSyncing = false;
    }
  },

  // Create new file on Google Drive
  async createFileOnDrive() {
    if (!this.accessToken) return;
    const metadata = {
      name: this.FILE_NAME,
      mimeType: 'application/json'
    };

    const initialData = typeof character !== 'undefined' ? character : {};
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(initialData, null, 2) +
      close_delim;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'multipart/related; boundary="' + boundary + '"'
      },
      body: multipartRequestBody
    });

    const file = await res.json();
    this.fileId = file.id;
    localStorage.setItem('gdrive_file_id', this.fileId);
    this.updateStatusUI('synced');
    console.log('GDriveSync: Created new file on Drive ID:', this.fileId);
  },

  // Pull latest character data from Google Drive
  async pullFromDrive() {
    if (!this.accessToken || !this.fileId) return;
    this.isSyncing = true;
    this.updateStatusUI('syncing');

    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${this.fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      const remoteData = await res.json();

      if (remoteData && (remoteData.name || remoteData.characterName || remoteData.abilities)) {
        if (typeof character !== 'undefined') {
          Object.assign(character, remoteData);
          if (typeof renderAll === 'function') renderAll();
          if (typeof saveStateToStorage === 'function') saveStateToStorage(false); // don't re-trigger loop
        }
        this.updateStatusUI('synced');
        console.log('GDriveSync: Successfully pulled latest character data from Google Drive.');
      }
    } catch (err) {
      console.error('GDriveSync: Error pulling data:', err);
      this.updateStatusUI('error');
    } finally {
      this.isSyncing = false;
    }
  },

  // Push local character data to Google Drive
  async pushToDrive() {
    if (!this.accessToken || !this.fileId) return;
    this.isSyncing = true;
    this.updateStatusUI('syncing');

    try {
      const dataToSave = typeof character !== 'undefined' ? character : {};
      dataToSave.lastModified = new Date().toISOString();

      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${this.fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSave, null, 2)
      });

      this.updateStatusUI('synced');
      console.log('GDriveSync: Successfully pushed update to Google Drive.');
    } catch (err) {
      console.error('GDriveSync: Error pushing data:', err);
      this.updateStatusUI('error');
    } finally {
      this.isSyncing = false;
    }
  },

  // Debounced auto-save to Google Drive
  scheduleAutoSave() {
    if (!this.accessToken || !this.fileId) return;
    clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      this.pushToDrive();
    }, 4000); // 4-second debounce
  },

  // Update UI indicators
  updateStatusUI(status) {
    const pill = document.getElementById('sync-status-pill');
    const text = document.getElementById('sync-status-text');
    if (!pill || !text) return;

    if (status === 'connected' || status === 'synced') {
      pill.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-600';
      text.textContent = '🟢 Google Drive ile Senkron';
    } else if (status === 'syncing') {
      pill.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-600';
      text.textContent = '🔄 Eşitleniyor...';
    } else if (status === 'ready' || status === 'disconnected') {
      pill.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700';
      text.textContent = '🟡 Yerel Kayıtlı (Çevrimdışı)';
    } else {
      pill.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-900 text-slate-400 border border-slate-800';
      text.textContent = '💾 Çevrimdışı Bellek';
    }
  }
};

window.GDriveSync = GDriveSync;
