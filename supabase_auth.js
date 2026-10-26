/**
 * D&D 3.5e Supabase Authentication & Multi-User Campaign Module
 * 
 * Handles Google OAuth, Local/Offline Mode, session persistence, page guards,
 * campaign invitation codes, cloud character sharing, and Realtime WebSocket syncing.
 */

const SUPABASE_CONFIG = {
  url: 'https://hruixcdcckaeizaicrtk.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhydWl4Y2RjY2thZWl6YWljcnRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5MTU0MDEsImV4cCI6MjEwODQ5MTQwMX0.ocOfQ2qwgZmojhwO6dwvMmwQpMPSnuDvafyhWW7AIbI'
};

let _supabaseClient = null;

function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient;
  if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
    _supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    return _supabaseClient;
  }
  return null;
}

const SupabaseAuth = {
  client: null,
  _activeChannels: {},

  getClient() {
    if (!this.client) {
      this.client = getSupabaseClient();
    }
    return this.client;
  },

  isLocalMode() {
    try {
      return localStorage.getItem('dnd35_local_mode') === 'true';
    } catch (e) {
      return false;
    }
  },

  setLocalMode(enabled = true) {
    try {
      if (enabled) {
        localStorage.setItem('dnd35_local_mode', 'true');
      } else {
        localStorage.removeItem('dnd35_local_mode');
      }
    } catch (e) {
      console.warn('LocalStorage setLocalMode error:', e);
    }
  },

  getLocalUser() {
    return {
      id: 'local_offline_user',
      email: 'yerel@cihaz.local',
      user_metadata: {
        name: 'Yerel Mod',
        full_name: 'Yerel Mod (Çevrimdışı)',
        is_local: true
      }
    };
  },

  async getSession() {
    if (this.isLocalMode()) {
      const localUser = this.getLocalUser();
      return { user: localUser, is_local: true };
    }
    const client = this.getClient();
    if (!client) return null;
    try {
      const { data, error } = await client.auth.getSession();
      if (error || !data || !data.session) return null;
      return data.session;
    } catch (e) {
      console.warn('Supabase getSession error:', e);
      return null;
    }
  },

  async getUser() {
    if (this.isLocalMode()) {
      return this.getLocalUser();
    }
    const session = await this.getSession();
    return session ? session.user : null;
  },

  async signInWithGoogle(customRedirectUrl = null) {
    const client = this.getClient();
    if (!client) {
      alert('Supabase istemcisi yüklenemedi. Lütfen internet bağlantınızı kontrol edin.');
      return;
    }

    // Yerel modu kapat
    this.setLocalMode(false);

    // Yönlendirme adresi belirleme
    const origin = window.location.origin;
    const targetUrl = customRedirectUrl || `${origin}/hub`;

    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: targetUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account'
        }
      }
    });

    if (error) {
      console.error('Google sign in error:', error);
      alert('Giriş yapılırken bir hata oluştu: ' + error.message);
    }
  },

  async signOut() {
    this.setLocalMode(false);
    const client = this.getClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (e) {
        console.warn('SignOut error:', e);
      }
    }
    // Yerel oturum önbelleklerini temizle ve giriş ekranına yönlendir
    window.location.href = '/login';
  },

  /**
   * Korumalı Sayfa Kalkanı (Auth Guard)
   */
  async requireAuth(options = {}) {
    // Yerel dosya sistemi (file://) protokolünde doğrudan auth kalkanını atla
    if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
      console.log('SupabaseAuth: file:// protokolünde auth kalkanı atlandı (yerel mod).');
      const localUser = this.getLocalUser();
      this.mountUserProfileUI(localUser, options);
      return localUser;
    }

    // Yerel mod aktifse oturumu sağla ve UI'ı bağla
    if (this.isLocalMode()) {
      const localUser = this.getLocalUser();
      this.mountUserProfileUI(localUser, options);
      return localUser;
    }

    const client = this.getClient();
    if (!client) {
      console.warn('Supabase client not available, waiting 300ms...');
      await new Promise(r => setTimeout(r, 300));
    }

    const session = await this.getSession();
    if (!session || !session.user) {
      // Oturum yok!
      const currentPath = window.location.pathname + window.location.search;
      const redirectParam = encodeURIComponent(currentPath);
      window.location.href = `/login?redirect=${redirectParam}`;
      return null;
    }

    // Oturum var: Kullanıcı arayüz bileşenlerini bağla
    this.mountUserProfileUI(session.user, options);
    return session.user;
  },

  async redirectIfLoggedIn(defaultTarget = '/hub') {
    if (this.isLocalMode()) {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTarget = urlParams.get('redirect') || defaultTarget;
      window.location.href = redirectTarget;
      return true;
    }
    const session = await this.getSession();
    if (session && session.user) {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTarget = urlParams.get('redirect') || defaultTarget;
      window.location.href = redirectTarget;
      return true;
    }
    return false;
  },

  mountUserProfileUI(user, options = {}) {
    if (!user) return;
    const isLocal = !!user.user_metadata?.is_local;
    const meta = user.user_metadata || {};
    const name = meta.full_name || meta.name || (user.email ? user.email.split('@')[0] : 'Kullanıcı');
    const avatar = meta.avatar_url || meta.picture || '';

    let container = document.getElementById('supabase-user-pill-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'supabase-user-pill-container';
      container.className = 'w-full';

      const targetNav = document.getElementById('user-profile-slot') ||
                        document.getElementById('nav-user-actions') || 
                        document.querySelector('header .flex.items-center.gap-2') ||
                        document.getElementById('sync-status-pill')?.parentElement;
      if (targetNav) {
        targetNav.prepend(container);
      } else {
        container.className = 'fixed top-3 right-3 z-40 bg-slate-900/90 border border-slate-700/80 px-2.5 py-1.5 rounded-xl shadow-lg flex items-center gap-2';
        document.body.appendChild(container);
      }
    }

    if (container.parentElement?.id === 'user-profile-slot') {
      container.className = 'w-full';
    } else if (!container.className || container.className.includes('inline-flex')) {
      container.className = 'w-full';
    }

    let avatarHtml;
    if (isLocal) {
      avatarHtml = `<div class="w-6 h-6 rounded-full bg-amber-600/90 border border-amber-400 flex items-center justify-center text-[10px] font-bold text-white shrink-0" title="Yerel Çalışma Modu">💻</div>`;
    } else if (avatar) {
      avatarHtml = `<img src="${avatar}" alt="${name}" class="w-6 h-6 rounded-full border border-indigo-400 object-cover shrink-0">`;
    } else {
      avatarHtml = `<div class="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">${name.charAt(0).toUpperCase()}</div>`;
    }

    const titleAttr = isLocal ? 'Yerel / Çevrimdışı Mod (Veriler Cihazınızda Saklanır)' : (user.email || name);
    const displayName = isLocal ? 'Yerel Mod' : name;
    const badgeColor = isLocal ? 'text-amber-300' : 'text-white';

    container.innerHTML = `
      <div class="w-full h-9 flex items-center justify-between gap-1.5 bg-slate-900/90 border border-slate-700/80 px-2.5 rounded-xl shadow-md">
        <div class="flex items-center gap-2 min-w-0">
          ${avatarHtml}
          <span class="text-xs font-semibold ${badgeColor} max-w-[105px] truncate" title="${titleAttr}">${displayName}</span>
        </div>
        <button onclick="SupabaseAuth.signOut()" class="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-700 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0" title="${isLocal ? 'Yerel Moddan Çık ve Giriş Ekranına Dön' : 'Oturumu Kapat'}">
          <span>🚪</span>
          <span>Çıkış</span>
        </button>
      </div>
    `;

    // Senkronizasyon hapını (sync-status-pill) kullanıcının auth moduna göre otomatik güncelle
    this.updateSyncStatusPill(isLocal ? 'local' : 'cloud_synced');
  },

  /**
   * Üst barda yer alan senkronizasyon hapının (sync-status-pill) görsel durumunu günceller
   * - Supabase bağlı ve yedekliyorsa: Yeşil (🟢 Bulut Senkron)
   * - Yerel modda ise: Sarı (🟡 Yerel Kayıtlı)
   * - Senkronize ediliyorsa: Mavi / İndigo (🔄 Eşitleniyor...)
   */
  updateSyncStatusPill(status = 'local') {
    const pill = document.getElementById('sync-status-pill');
    if (!pill) return;

    const isHub = !!document.getElementById('hub-cards-view');

    if (status === 'cloud_synced' || status === 'connected' || status === 'synced') {
      if (isHub) {
        pill.className = 'cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-600 w-full h-9 whitespace-nowrap shadow-sm transition';
      } else {
        pill.className = 'cursor-pointer flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-600 whitespace-nowrap shadow-sm transition truncate';
      }
      pill.title = 'Supabase Bulut Aktif & Otomatik Yedekleniyor (Ayrıntı için tıklayın)';
      pill.innerHTML = `
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
        <span id="sync-status-text">🟢 <span class="hidden sm:inline">Bulut </span>Senkron</span>
      `;
    } else if (status === 'syncing') {
      if (isHub) {
        pill.className = 'cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-600 w-full h-9 whitespace-nowrap shadow-sm transition';
      } else {
        pill.className = 'cursor-pointer flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-600 whitespace-nowrap shadow-sm transition truncate';
      }
      pill.title = 'Buluta veri eşitleniyor...';
      pill.innerHTML = `
        <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0"></span>
        <span id="sync-status-text">🔄 <span class="hidden sm:inline">Bulut </span>Eşitleniyor...</span>
      `;
    } else if (status === 'local' || status === 'offline' || status === 'unconfigured') {
      if (isHub) {
        pill.className = 'cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-medium bg-amber-950/60 text-amber-300 border border-amber-600/70 w-full h-9 whitespace-nowrap shadow-sm transition';
      } else {
        pill.className = 'cursor-pointer flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium bg-amber-950/60 text-amber-300 border border-amber-600/70 whitespace-nowrap shadow-sm transition truncate';
      }
      pill.title = 'Yerel Mod (Veriler Tarayıcınızda Saklanır - Buluta Bağlanmak İçin Tıklayın)';
      pill.innerHTML = `
        <span class="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
        <span id="sync-status-text">🟡 <span class="hidden sm:inline">Yerel </span>Kayıtlı</span>
      `;
    } else if (status === 'error') {
      if (isHub) {
        pill.className = 'cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-medium bg-rose-950/80 text-rose-300 border border-rose-600 w-full h-9 whitespace-nowrap shadow-sm transition';
      } else {
        pill.className = 'cursor-pointer flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium bg-rose-950/80 text-rose-300 border border-rose-600 whitespace-nowrap shadow-sm transition truncate';
      }
      pill.title = 'Bulut Senkronizasyon Hatası (Tıklayın)';
      pill.innerHTML = `
        <span class="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
        <span id="sync-status-text">⚠️ <span class="hidden sm:inline">Bulut </span>Hata</span>
      `;
    }
  },

  /**
   * Senkronizasyon hapÄ±na tÄ±klandÄ±ÄŸÄ±nda modern bulut yÃ¶netim modalÄ±nÄ± aÃ§ar
   */
  handlePillClick() {
    // Eski aÃ§Ä±k modal varsa kapat
    const existing = document.getElementById('cloud-sync-management-modal');
    if (existing) {
      existing.remove();
      return;
    }

    const isLocal = this.isLocalMode();
    const modal = document.createElement('div');
    modal.id = 'cloud-sync-management-modal';
    modal.className = 'fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm';
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };

    if (isLocal) {
      modal.innerHTML = `
        <div class="bg-[#131d33] border border-amber-500/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-5 sm:p-6 text-slate-100 flex flex-col gap-4 transform transition-all" onclick="event.stopPropagation()">
          <div class="flex items-start justify-between gap-3 border-b border-slate-700/80 pb-3">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">ğŸŸ¡</span>
              <div>
                <h3 class="text-base font-extrabold text-white">Yerel Mod (Ã‡evrimdÄ±ÅŸÄ±)</h3>
                <p class="text-[11px] text-amber-300/90 font-medium">Verileriniz yalnÄ±zca bu tarayÄ±cÄ±da saklanÄ±r</p>
              </div>
            </div>
            <button type="button" class="text-slate-400 hover:text-white p-1 text-sm rounded-lg transition cursor-pointer" onclick="document.getElementById('cloud-sync-management-modal')?.remove()">âœ•</button>
          </div>

          <p class="text-xs text-slate-300 leading-relaxed">
            Karakter ve seferlerinizin Supabase bulutunda otomatik yedeklenmesi, telefon ve bilgisayar arasÄ±nda anÄ±nda eÅŸitlenmesi iÃ§in Google hesabÄ±nÄ±zla giriÅŸ yapabilirsiniz.
          </p>

          <div class="flex flex-col gap-2 pt-2">
            <button type="button" id="modal-btn-login-google" class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50 transition active:scale-95 cursor-pointer">
              <span>ğŸ”‘</span>
              <span>Google ile GiriÅŸ Yap</span>
            </button>
            <button type="button" class="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition cursor-pointer" onclick="document.getElementById('cloud-sync-management-modal')?.remove()">
              âœ• VazgeÃ§ (Yerel Modda Devam Et)
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('#modal-btn-login-google')?.addEventListener('click', () => {
        modal.remove();
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = '/login.html?redirect=' + encodeURIComponent(currentPath);
      });
      return;
    }

    // Bulut Modu Aktif
    const isCharSheet = typeof window.forceCloudSyncPull === 'function';
    modal.innerHTML = `
      <div class="bg-[#131d33] border border-emerald-500/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-5 sm:p-6 text-slate-100 flex flex-col gap-4 transform transition-all" onclick="event.stopPropagation()">
        <!-- BaÅŸlÄ±k -->
        <div class="flex items-start justify-between gap-3 border-b border-slate-700/80 pb-3">
          <div class="flex items-center gap-2.5">
            <span class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <div>
              <h3 class="text-base font-extrabold text-white">Bulut Senkron YÃ¶netimi</h3>
              <p class="text-[11px] text-emerald-300/90 font-medium">Supabase Ã‡oklu Cihaz Senkronizasyonu Aktif</p>
            </div>
          </div>
          <button type="button" class="text-slate-400 hover:text-white p-1 text-sm rounded-lg transition cursor-pointer" onclick="document.getElementById('cloud-sync-management-modal')?.remove()">âœ•</button>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed">
          ${isCharSheet 
            ? 'Bu ekran ile buluttaki kayÄ±tlarÄ±nÄ±z arasÄ±nda senkronizasyon gerÃ§ekleÅŸtirmek iÃ§in bir eylem seÃ§in:' 
            : 'Hub Ã¼zerindeki tÃ¼m karakterleri bulutla anÄ±nda eÅŸitlemek iÃ§in bir eylem seÃ§in:'}
        </p>

        <!-- Eylem ButonlarÄ± -->
        <div class="flex flex-col gap-2.5 pt-1">
          <!-- Buton 1: Buluttan Ä°ndir (Ã‡ek) -->
          <button type="button" id="modal-btn-sync-pull" class="w-full text-left p-3 rounded-xl bg-slate-900/90 hover:bg-emerald-950/50 border border-emerald-600/60 hover:border-emerald-500 text-white transition duration-150 flex items-center justify-between gap-3 group cursor-pointer shadow-md">
            <div class="min-w-0">
              <div class="text-xs font-black text-emerald-300 group-hover:text-emerald-200 flex items-center gap-1.5">
                <span>â¬‡ï¸</span>
                <span>Buluttan Ä°ndir (Ã‡ek)</span>
              </div>
              <div class="text-[10px] text-slate-400 mt-0.5 leading-normal">
                ${isCharSheet ? 'Buluttaki en gÃ¼ncel karakteri indirir ve bu ekranÄ± yeniler.' : 'Buluttaki en son karakter ve seferleri Hub ekranÄ±na Ã§eker.'}
              </div>
            </div>
            <span class="text-emerald-400 font-mono text-xs shrink-0 group-hover:translate-x-0.5 transition">â†’</span>
          </button>

          <!-- Buton 2: Buluta YÃ¼kle (GÃ¶nder) -->
          <button type="button" id="modal-btn-sync-push" class="w-full text-left p-3 rounded-xl bg-slate-900/90 hover:bg-amber-950/50 border border-amber-600/60 hover:border-amber-500 text-white transition duration-150 flex items-center justify-between gap-3 group cursor-pointer shadow-md">
            <div class="min-w-0">
              <div class="text-xs font-black text-amber-300 group-hover:text-amber-200 flex items-center gap-1.5">
                <span>â¬†ï¸</span>
                <span>Buluta YÃ¼kle (GÃ¶nder)</span>
              </div>
              <div class="text-[10px] text-slate-400 mt-0.5 leading-normal">
                ${isCharSheet ? 'Bu ekrandaki gÃ¼ncel karakteri buluta zorla gÃ¶nderir ve bulutu gÃ¼nceller.' : 'Yereldeki tÃ¼m karakterleri bulut veritabanÄ±na zorla yazar.'}
              </div>
            </div>
            <span class="text-amber-400 font-mono text-xs shrink-0 group-hover:translate-x-0.5 transition">â†’</span>
          </button>

          <!-- Buton 3: VazgeÃ§ (Kapat) -->
          <button type="button" class="w-full mt-1 py-2 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5" onclick="document.getElementById('cloud-sync-management-modal')?.remove()">
            <span>âœ•</span>
            <span>VazgeÃ§ / Ä°ptal (DeÄŸiÅŸiklik Yapma)</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event Listener'lar
    modal.querySelector('#modal-btn-sync-pull')?.addEventListener('click', () => {
      modal.remove();
      if (typeof window.forceCloudSyncPull === 'function') {
        window.forceCloudSyncPull();
      } else if (typeof window.syncCloudUserHub === 'function') {
        this.getUser().then(u => {
          if (u && typeof window.syncCloudUserHub === 'function') {
            window.syncCloudUserHub(u).then(() => {
              if (typeof window.showHubDiceToast === 'function') {
                window.showHubDiceToast({ title: 'âš¡ CanlÄ± Senkron', text: 'Hub karakterleri buluttan gÃ¼ncellendi!', color: 'emerald' });
              }
            });
          }
        });
      }
    });

    modal.querySelector('#modal-btn-sync-push')?.addEventListener('click', () => {
      modal.remove();
      if (typeof window.forceCloudSyncPush === 'function') {
        window.forceCloudSyncPush();
      } else if (typeof window.syncCloudUserHub === 'function') {
        this.getUser().then(u => {
          if (u && typeof window.syncCloudUserHub === 'function') {
            window.syncCloudUserHub(u).then(() => {
              if (typeof window.showHubDiceToast === 'function') {
                window.showHubDiceToast({ title: 'âš¡ Bulut Yedek', text: 'Yerel karakterler buluta baÅŸarÄ±yla yÃ¼klendi!', color: 'emerald' });
              }
            });
          }
        });
      }
    });
  },

  // =========================================================================
  // 🏰 ÇOK KULLANICILI KAMPANYA & KARAKTER PAYLAŞIM MOTORU (SUPABASE)
  // =========================================================================

  /**
   * Benzersiz, akılda kalıcı D&D temalı davet kodu üretir (Örn: 'RAVEN-7841')
   */
  generateInviteCode() {
    const words = ['DRAGON', 'RAVEN', 'TIGER', 'EAGLE', 'SHADOW', 'WOLF', 'FROST', 'STORM', 'BLADE', 'SPELL', 'TITAN', 'MYTHIC', 'VALOR', 'FORGE', 'VIPER', 'GRIFFIN'];
    const prefix = words[Math.floor(Math.random() * words.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${num}`;
  },

  /**
   * Bulutta yeni bir DM kampanyası oluşturur
   */
  async createCloudCampaign({ name, description = '', isDmMode = true }) {
    if (this.isLocalMode()) {
      throw new Error('Bulut kampanyası oluşturmak için lütfen Google hesabınızla giriş yapın.');
    }
    const user = await this.getUser();
    if (!user) throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');

    const client = this.getClient();
    if (!client) throw new Error('Supabase istemcisine erişilemedi.');

    const inviteCode = this.generateInviteCode();

    // 1. campaigns tablosuna ekle
    const { data: campaign, error: campErr } = await client
      .from('campaigns')
      .insert({
        dm_user_id: user.id,
        name: name.trim(),
        description: description.trim(),
        invite_code: inviteCode,
        is_dm_mode: isDmMode
      })
      .select()
      .single();

    if (campErr) throw campErr;

    // 2. DM'i campaign_members tablosuna 'dm' rolüyle ekle
    const { error: memberErr } = await client
      .from('campaign_members')
      .insert({
        campaign_id: campaign.id,
        user_id: user.id,
        role: 'dm'
      });

    if (memberErr) {
      console.warn('campaign_members kaydı sırasında hata (kampanya oluşturuldu):', memberErr);
    }

    return campaign;
  },

  /**
   * Davet kodu ile kampanya bilgilerini ve DM adını sorgular
   */
  async getCampaignByInviteCode(inviteCode) {
    if (!inviteCode) return null;
    const cleanCode = String(inviteCode).toUpperCase().trim();

    const client = this.getClient();
    if (!client) return null;

    const { data, error } = await client
      .from('campaigns')
      .select('id, dm_user_id, name, description, invite_code, is_dm_mode, created_at')
      .eq('invite_code', cleanCode)
      .maybeSingle();

    if (error) {
      console.error('getCampaignByInviteCode error:', error);
      return null;
    }
    return data;
  },

  /**
   * Oyuncunun karakterini davet kodu kullanarak bir kampanyaya bağlar (1 Oyuncu = 1 Aktif Karakter)
   */
  async joinCampaignWithCharacter(inviteCode, characterData) {
    if (this.isLocalMode()) {
      throw new Error('Bir kampanyaya katılmak için lütfen Google hesabınızla giriş yapın.');
    }
    const user = await this.getUser();
    if (!user) throw new Error('Oturum açılmamış.');

    const campaign = await this.getCampaignByInviteCode(inviteCode);
    if (!campaign) throw new Error(`"${inviteCode}" koduna ait aktif bir kampanya bulunamadı.`);

    const client = this.getClient();
    const charId = characterData.id || `char_${Date.now()}`;
    const charName = characterData.name || 'İsimsiz Kahraman';
    const curHp = characterData.hp?.current ?? characterData.hp?.max ?? 10;
    const tmpHp = characterData.hp?.temp ?? 0;

    // 1. campaign_members kaydı oluştur / güncelle
    const { error: memberErr } = await client
      .from('campaign_members')
      .upsert({
        campaign_id: campaign.id,
        user_id: user.id,
        role: 'player'
      }, { onConflict: 'campaign_id,user_id' });

    if (memberErr) console.warn('campaign_members upsert warning:', memberErr);

    // 2. Oyuncunun bu kampanyadaki eski karakterlerinin campaign_id'sini null yap (1 oyuncu = 1 aktif karakter kuralı)
    await client
      .from('characters')
      .update({ campaign_id: null })
      .eq('owner_user_id', user.id)
      .eq('campaign_id', campaign.id);

    // 3. Seçilen karakteri kampanyaya bağla
    const { data: charRow, error: charErr } = await client
      .from('characters')
      .upsert({
        id: charId,
        owner_user_id: user.id,
        campaign_id: campaign.id,
        name: charName,
        is_npc: !!characterData.isNpc,
        full_data: characterData,
        current_hp: curHp,
        temp_hp: tmpHp,
        last_player_update_ts: Date.now(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (charErr) throw charErr;

    return {
      campaign,
      character: charRow
    };
  },

  /**
   * Karakteri kampanyadan çıkarır (Karakter silinmez, campaign_id = null yapılır)
   */
  async leaveCampaign(campaignId, characterId) {
    const user = await this.getUser();
    if (!user) return false;
    const client = this.getClient();
    if (!client) return false;

    // Karakterin kampanya bağını kopar
    if (characterId) {
      await client
        .from('characters')
        .update({ campaign_id: null })
        .eq('id', characterId);
    }

    // Üyelik tablosundan kaldır
    if (campaignId) {
      await client
        .from('campaign_members')
        .delete()
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id);
    }
    return true;
  },

  /**
   * Belirli bir kampanyaya bağlı tüm karakterleri çeker (DM masası için)
   */
  async fetchCampaignCharacters(campaignId) {
    if (!campaignId) return [];
    const client = this.getClient();
    if (!client) return [];

    const { data, error } = await client
      .from('characters')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('fetchCampaignCharacters error:', error);
      return [];
    }
    return data || [];
  },

  /**
   * DM Yetkisi: Oyuncunun canını doğrudan ve anında bulutta günceller
   */
  async updateCharacterHpAsDm(characterId, currentHp, tempHp = 0) {
    const client = this.getClient();
    if (!client || !characterId) return false;

    const now = Date.now();
    const { error } = await client
      .from('characters')
      .update({
        current_hp: Number(currentHp),
        temp_hp: Number(tempHp),
        last_dm_hp_update_ts: now,
        updated_at: new Date().toISOString()
      })
      .eq('id', characterId);

    if (error) {
      console.error('updateCharacterHpAsDm error:', error);
      return false;
    }
    return true;
  },

  /**
   * Oturum Açmış Kullanıcının Karakterini Otomatik Buluta Yedekler (Upsert)
   * Kampanyaya bağlı olmasa bile Google hesabı altında kalıcı olarak saklanır.
   */
  async upsertUserCharacter(characterData) {
    if (this.isLocalMode() || !characterData) return null;
    const user = await this.getUser();
    if (!user || user.id === 'local_offline_user') return null;

    const client = this.getClient();
    if (!client) return null;

    const charId = characterData.id || characterData._hubId || `char_${Date.now()}`;
    characterData.id = charId;
    characterData._hubId = charId;
    const curHp = characterData.hp?.current ?? characterData.hp?.max ?? 10;
    const tmpHp = characterData.hp?.temp ?? 0;

    const row = {
      id: charId,
      owner_user_id: user.id,
      campaign_id: characterData.cloudCampaignId || null,
      name: characterData.name || 'İsimsiz Kahraman',
      is_npc: !!characterData.isNpc,
      full_data: characterData,
      current_hp: curHp,
      temp_hp: tmpHp,
      last_player_update_ts: Date.now(),
      updated_at: new Date().toISOString()
    };

    this.updateSyncStatusPill('syncing');

    const { data, error } = await client
      .from('characters')
      .upsert(row, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('upsertUserCharacter warning:', error);
      this.updateSyncStatusPill('error');
      return null;
    }
    this.updateSyncStatusPill('cloud_synced');
    return data;
  },

  /**
   * Oturum açmış kullanıcının karakterini Supabase veritabanından kalıcı olarak siler
   */
  async deleteCharacter(characterId) {
    if (this.isLocalMode() || !characterId) return false;
    const user = await this.getUser();
    if (!user || user.id === 'local_offline_user') return false;

    const client = this.getClient();
    if (!client) return false;

    const { error } = await client
      .from('characters')
      .delete()
      .eq('id', characterId)
      .eq('owner_user_id', user.id);

    if (error) {
      console.warn('deleteCharacter cloud error:', error);
      return false;
    }
    await this.recordTombstone(characterId);
    return true;
  },

  /**
   * Silinen karakter mezar taşlarını (Tombstone) Supabase user_metadata ve yerel depolamadan çeker
   */
  async fetchTombstones() {
    const local = this.getLocalTombstones();
    if (this.isLocalMode()) return local;

    try {
      const client = this.getClient();
      if (!client) return local;

      const user = await this.getUser();
      if (!user || user.id === 'local_offline_user') return local;

      const cloudList = Array.isArray(user.user_metadata?.deleted_character_ids)
        ? user.user_metadata.deleted_character_ids
        : [];

      const merged = Array.from(new Set([...cloudList, ...local]));
      this.saveLocalTombstones(merged);
      return merged;
    } catch (e) {
      console.warn('fetchTombstones warning:', e);
      return local;
    }
  },

  /**
   * Bir karakter silindiğinde hem yerel hem de bulut user_metadata'ya mezar taşı bırakır
   */
  async recordTombstone(characterId) {
    if (!characterId) return;
    const cleanId = String(characterId).trim();

    // 1. Yerel Mezar Taşı Kaydı
    const local = this.getLocalTombstones();
    if (!local.includes(cleanId)) {
      local.push(cleanId);
      if (local.length > 300) local.shift();
      this.saveLocalTombstones(local);
    }

    if (this.isLocalMode()) return;

    try {
      const client = this.getClient();
      if (!client) return;

      const user = await this.getUser();
      if (!user || user.id === 'local_offline_user') return;

      const currentList = Array.isArray(user.user_metadata?.deleted_character_ids)
        ? user.user_metadata.deleted_character_ids
        : [];

      if (!currentList.includes(cleanId)) {
        currentList.push(cleanId);
        if (currentList.length > 300) currentList.shift();

        await client.auth.updateUser({
          data: {
            deleted_character_ids: currentList
          }
        });
      }
    } catch (e) {
      console.warn('recordTombstone cloud warning:', e);
    }
  },

  getLocalTombstones() {
    try {
      const raw = localStorage.getItem('dnd35_tombstones');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  },

  saveLocalTombstones(list) {
    try {
      localStorage.setItem('dnd35_tombstones', JSON.stringify(list || []));
    } catch (e) {}
  },

  /**
   * Oturum açmış kullanıcının sahip olduğu bir kampanyayı Supabase veritabanından kalıcı olarak siler
   */
  async deleteCampaign(campaignId) {
    if (this.isLocalMode() || !campaignId) return false;
    const user = await this.getUser();
    if (!user || user.id === 'local_offline_user') return false;

    const client = this.getClient();
    if (!client) return false;

    // Kampanyayı sil (dm_user_id kontrolü ile güvenli silme)
    const { error } = await client
      .from('campaigns')
      .delete()
      .eq('id', campaignId)
      .eq('dm_user_id', user.id);

    if (error) {
      console.warn('deleteCampaign cloud error:', error);
      return false;
    }

    // Aktif Realtime kanalı varsa kapat
    if (this._activeChannels && this._activeChannels[campaignId]) {
      this.unsubscribeCampaignRealtime(campaignId);
    }

    return true;
  },

  /**
   * Oturum açmış kullanıcının sahip olduğu tüm karakterleri çeker (Çoklu cihaz senkronizasyonu için)
   */
  async fetchUserCharacters() {
    if (this.isLocalMode()) return [];
    const user = await this.getUser();
    if (!user || user.id === 'local_offline_user') return [];

    const client = this.getClient();
    if (!client) return [];

    const { data, error } = await client
      .from('characters')
      .select('*')
      .eq('owner_user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('fetchUserCharacters error:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Oturum açmış kullanıcının DM'i olduğu tüm bulut kampanyalarını çeker
   */
  async fetchUserCampaigns() {
    if (this.isLocalMode()) return [];
    const user = await this.getUser();
    if (!user || user.id === 'local_offline_user') return [];

    const client = this.getClient();
    if (!client) return [];

    const { data, error } = await client
      .from('campaigns')
      .select('*')
      .eq('dm_user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('fetchUserCampaigns error:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Oyuncu Yetkisi: Kendi karakterinin tam verisini buluta kaydeder
   */
  async saveCharacterDataAsPlayer(characterId, fullData) {
    const client = this.getClient();
    if (!client || !characterId || !fullData) return false;

    const curHp = fullData.hp?.current ?? 10;
    const tmpHp = fullData.hp?.temp ?? 0;

    const { error } = await client
      .from('characters')
      .update({
        name: fullData.name || 'İsimsiz Kahraman',
        full_data: fullData,
        current_hp: curHp,
        temp_hp: tmpHp,
        last_player_update_ts: Date.now(),
        updated_at: new Date().toISOString()
      })
      .eq('id', characterId);

    if (error) {
      console.error('saveCharacterDataAsPlayer error:', error);
      return false;
    }
    return true;
  },

  /**
   * DM'in yerel bir kampanyasını tek tıkla Supabase bulutuna taşır
   */
  async migrateLocalCampaignToCloud(localCampaign, localCharacters = []) {
    const user = await this.getUser();
    if (!user || this.isLocalMode()) {
      throw new Error('Kampanyayı buluta taşımak için önce Google hesabınızla giriş yapmalısınız.');
    }

    const cloudCamp = await this.createCloudCampaign({
      name: localCampaign.name || 'İsimsiz Kampanya',
      description: localCampaign.description || '',
      isDmMode: localCampaign.isDmMode !== false
    });

    const client = this.getClient();

    // Yerel karakterleri / canavarları da buluta aktar
    for (const char of localCharacters) {
      const cId = char.id || `char_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      try {
        await client.from('characters').insert({
          id: cId,
          owner_user_id: user.id,
          campaign_id: cloudCamp.id,
          name: char.name || 'Canavar/NPC',
          is_npc: char.isNpc !== false,
          full_data: char.fullData || char,
          current_hp: char.hp?.current ?? 10,
          temp_hp: char.hp?.temp ?? 0,
          last_dm_hp_update_ts: Date.now()
        });
      } catch (e) {
        console.warn('Karakter buluta taşınırken hata:', char.name, e);
      }
    }

    return cloudCamp;
  },

  /**
   * Realtime WebSocket Dinleyicisi
   * Kampanyadaki karakterlerin HP veya durum değişikliklerini canlı dinler
   */
  subscribeCampaignRealtime(campaignId, { onHpChange, onCharacterUpdate, onCharacterJoined, onCharacterLeft } = {}) {
    const client = this.getClient();
    if (!client || !campaignId) return null;

    // Varsa eski kanalı kapat
    if (this._activeChannels[campaignId]) {
      this.unsubscribeCampaignRealtime(campaignId);
    }

    const channelName = `campaign_sync_${campaignId}`;
    const channel = client.channel(channelName);

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'characters',
          filter: `campaign_id=eq.${campaignId}`
        },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload;

          if (eventType === 'UPDATE' && newRow) {
            // HP Değişimi kontrolü
            if (oldRow && (oldRow.current_hp !== newRow.current_hp || oldRow.temp_hp !== newRow.temp_hp)) {
              if (typeof onHpChange === 'function') {
                onHpChange({
                  characterId: newRow.id,
                  currentHp: newRow.current_hp,
                  tempHp: newRow.temp_hp,
                  lastDmHpUpdateTs: newRow.last_dm_hp_update_ts,
                  isDmUpdate: newRow.last_dm_hp_update_ts > (oldRow.last_dm_hp_update_ts || 0)
                });
              }
            }

            // Genel karakter güncellemesi
            if (typeof onCharacterUpdate === 'function') {
              onCharacterUpdate(newRow);
            }
          } else if (eventType === 'INSERT' && newRow) {
            if (typeof onCharacterJoined === 'function') {
              onCharacterJoined(newRow);
            }
          } else if (eventType === 'DELETE' && oldRow) {
            if (typeof onCharacterLeft === 'function') {
              onCharacterLeft(oldRow);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`Supabase Realtime [${channelName}] status:`, status);
      });

    this._activeChannels[campaignId] = channel;
    return channel;
  },

  unsubscribeCampaignRealtime(campaignId) {
    const channel = this._activeChannels[campaignId];
    if (channel) {
      const client = this.getClient();
      if (client) {
        client.removeChannel(channel);
      }
      delete this._activeChannels[campaignId];
    }
  },

  /**
   * Kullanıcının kendi karakterlerini (bağımsız veya kampanyada fark etmeksizin) canlı dinler
   */
  subscribeUserCharactersRealtime(onCharacterChange) {
    if (this.isLocalMode()) return null;
    const client = this.getClient();
    if (!client) return null;

    const channelName = 'user_characters_sync_channel';
    if (this._activeChannels[channelName]) {
      this.unsubscribeCampaignRealtime(channelName);
    }

    const channel = client.channel(channelName);
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'characters'
        },
        (payload) => {
          if (typeof onCharacterChange === 'function') {
            onCharacterChange(payload);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Supabase Realtime [${channelName}] status:`, status);
      });

    this._activeChannels[channelName] = channel;
    return channel;
  }
};

window.SupabaseAuth = SupabaseAuth;
