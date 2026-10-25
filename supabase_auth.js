/**
 * D&D 3.5e Supabase Authentication & Multi-User Module
 * 
 * Handles Google OAuth, session persistence, page guards, and user UI components.
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

  getClient() {
    if (!this.client) {
      this.client = getSupabaseClient();
    }
    return this.client;
  },

  async getSession() {
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
    const session = await this.getSession();
    return session ? session.user : null;
  },

  async signInWithGoogle(customRedirectUrl = null) {
    const client = this.getClient();
    if (!client) {
      alert('Supabase istemcisi yüklenemedi. Lütfen internet bağlantınızı kontrol edin.');
      return;
    }

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
   * Eğer oturum yoksa kullanıcıyı derhal /login sayfasına fırlatır.
   * Oturum varsa kullanıcı nesnesini döner ve sağ üstte profil rozetini çizer.
   */
  async requireAuth(options = {}) {
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

  /**
   * Giriş Sayfası Kontrolü:
   * Zaten oturumu olan bir kullanıcı /login'e gelirse otomatik /hub'a gönder.
   */
  async redirectIfLoggedIn(defaultTarget = '/hub') {
    const session = await this.getSession();
    if (session && session.user) {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTarget = urlParams.get('redirect') || defaultTarget;
      window.location.href = redirectTarget;
      return true;
    }
    return false;
  },

  /**
   * Sayfa Üst Barına Kullanıcı Profil & Çıkış Rozetini Çizer
   */
  mountUserProfileUI(user, options = {}) {
    if (!user) return;
    const meta = user.user_metadata || {};
    const name = meta.full_name || meta.name || user.email.split('@')[0];
    const avatar = meta.avatar_url || meta.picture || '';

    // Varsa mevcut profil konteynerini bul, yoksa oluştur
    let container = document.getElementById('supabase-user-pill-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'supabase-user-pill-container';
      container.className = 'inline-flex items-center gap-2';

      // Sayfadaki hedef yerleşim noktası
      const targetNav = document.getElementById('user-profile-slot') ||
                        document.getElementById('nav-user-actions') || 
                        document.querySelector('header .flex.items-center.gap-2') ||
                        document.getElementById('sync-status-pill')?.parentElement;
      if (targetNav) {
        targetNav.prepend(container);
      } else {
        // En kötü ihtimalle body'e sağ üstte sabit yerleştir
        container.className = 'fixed top-3 right-3 z-40 bg-slate-900/90 border border-slate-700/80 px-2.5 py-1.5 rounded-xl shadow-lg flex items-center gap-2';
        document.body.appendChild(container);
      }
    }

    const avatarHtml = avatar 
      ? `<img src="${avatar}" alt="${name}" class="w-6 h-6 rounded-full border border-indigo-400 object-cover shrink-0">`
      : `<div class="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">${name.charAt(0).toUpperCase()}</div>`;

    container.innerHTML = `
      <div class="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 px-2 py-1 rounded-xl shadow-sm">
        ${avatarHtml}
        <span class="text-xs font-semibold text-white max-w-[120px] truncate hidden sm:inline" title="${user.email}">${name}</span>
        <button onclick="SupabaseAuth.signOut()" class="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-700 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer" title="Oturumu Kapat">
          <span>🚪</span>
          <span class="hidden md:inline">Çıkış</span>
        </button>
      </div>
    `;
  }
};

window.SupabaseAuth = SupabaseAuth;
