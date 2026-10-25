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
      container.className = 'inline-flex items-center gap-2';

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
      <div class="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 px-2 py-1 rounded-xl shadow-sm">
        ${avatarHtml}
        <span class="text-xs font-semibold ${badgeColor} max-w-[120px] truncate hidden sm:inline" title="${titleAttr}">${displayName}</span>
        <button onclick="SupabaseAuth.signOut()" class="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-700 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer" title="${isLocal ? 'Yerel Moddan Çık ve Giriş Ekranına Dön' : 'Oturumu Kapat'}">
          <span>🚪</span>
          <span class="hidden md:inline">Çıkış</span>
        </button>
      </div>
    `;
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

    const charId = characterData.id || `char_${Date.now()}`;
    characterData.id = charId;
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

    const { data, error } = await client
      .from('characters')
      .upsert(row, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('upsertUserCharacter warning:', error);
      return null;
    }
    return data;
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
  }
};

window.SupabaseAuth = SupabaseAuth;
