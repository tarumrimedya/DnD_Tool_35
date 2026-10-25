/**
 * hub_notes.js - Joyful-Fermi Hub & Character Synchronized Notes Engine
 * D&D 3.5e Cockpit
 *
 * Rules:
 * - Pinned notes always appear first, followed by recently updated notes.
 * - DM Mode: Notes are bound to the campaign (campaign.notesList).
 * - Player Mode: Notes are bound to the active player's character (character.notesList)
 *   and automatically synchronized with dnd35_character storage.
 * - Full parity with Rule #3 (Zero tavla zari emoji).
 */

(function () {
  'use strict';

  // Internal State
  let _activeNoteFilterTag = 'all';
  let _activeNoteSearchQuery = '';
  let _selectedModalNoteId = null;
  let _activePanelTab = 'write'; // 'write' or 'list'
  let _overrideTargetKey = null; // 'campaign:<id>' or 'char:<id>'

  // Tag extraction regex supporting Turkish and international unicode characters
  const TAG_REGEX = /#[\w\u00C0-\u024F\u1E00-\u1EFFğüşıöçĞÜŞİÖÇ]+/gi;

  function extractTags(text) {
    if (!text || typeof text !== 'string') return [];
    const matches = text.match(TAG_REGEX);
    if (!matches) return [];
    return Array.from(new Set(matches.map(t => t.toLowerCase())));
  }

  function getHubState() {
    if (typeof window.getHubState === 'function') {
      const s = window.getHubState();
      if (s && Array.isArray(s.campaigns)) return s;
    }
    if (window.state && Array.isArray(window.state.campaigns)) {
      return window.state;
    }
    if (typeof state !== 'undefined' && state && Array.isArray(state.campaigns)) {
      return state;
    }
    try {
      const raw = localStorage.getItem('dnd35_hub_db');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.campaigns)) return parsed;
      }
    } catch (e) {}
    return null;
  }

  /**
   * Kampanya Hiyerarşik Adını Çözümle
   * Eğer alt kampanya ise (parentId varsa): Ana Kampanya Adı › Alt Kampanya Adı
   */
  function getCampaignHierarchyName(camp, state) {
    if (!camp) return 'Kampanya';
    if (!state || !Array.isArray(state.campaigns)) return camp.name || 'Kampanya';

    if (camp.parentId) {
      const parentCamp = state.campaigns.find(c => c.id === camp.parentId);
      if (parentCamp) {
        return `${parentCamp.name} › ${camp.name}`;
      }
    }
    return camp.name || 'Kampanya';
  }

  /**
   * Hedefin (Kampanya veya Karakter) Tam Görünen Adını Çözümle
   */
  function getTargetDisplayName(target, state) {
    if (!target) return 'Not Defteri';
    if (target.type === 'campaign') {
      const camp = state?.campaigns?.find(c => c.id === target.id) || target.targetObj;
      return getCampaignHierarchyName(camp || target, state);
    } else if (target.type === 'character') {
      const char = state?.characters?.find(c => c.id === target.id) || target.targetObj;
      if (char && char.campaignId) {
        const camp = state?.campaigns?.find(c => c.id === char.campaignId);
        if (camp) {
          const campHName = getCampaignHierarchyName(camp, state);
          return `${campHName} › 👤 ${char.name || 'Karakter'}`;
        }
      }
      return `👤 ${char?.name || target.name || 'Karakter'}`;
    }
    return target.name || 'Not Defteri';
  }

  /**
   * Determine active notes target:
   * 0. User override (if selected via modal dropdown)
   * 1. If in unassigned tab: unassigned character or first character
   * 2. If active campaign is DM Mode: Campaign notes
   * 3. If active campaign is player campaign: Character notes in that campaign (or campaign notes)
   * 4. If all/fallback: First character or first campaign
   * 5. Safe creation fallback: Ensures notes can ALWAYS be written
   */
  function getActiveNotesTarget() {
    const state = getHubState();
    if (!state) return null;

    if (!Array.isArray(state.campaigns)) state.campaigns = [];
    if (!Array.isArray(state.characters)) state.characters = [];

    // 0. Manuel Seçili Hedef (Modal Üzerinden Değiştirilmişse)
    if (_overrideTargetKey) {
      const parts = _overrideTargetKey.split(':');
      const type = parts[0];
      const id = parts[1];
      if (type === 'campaign') {
        const camp = state.campaigns.find(c => c.id === id);
        if (camp) {
          if (!Array.isArray(camp.notesList)) camp.notesList = normalizeLegacyNotes(camp.notes);
          const hName = getCampaignHierarchyName(camp, state);
          return {
            type: 'campaign',
            id: camp.id,
            name: hName,
            rawName: camp.name,
            isDm: Boolean(camp.isDmMode),
            titleBadge: camp.isDmMode ? '👑 DM Notları (Gizli)' : '🏰 Sefer Notları',
            targetObj: camp,
            notesList: camp.notesList
          };
        }
      } else if (type === 'char') {
        const char = state.characters.find(c => c.id === id);
        if (char) {
          if (!Array.isArray(char.notesList)) char.notesList = normalizeLegacyNotes(char.notes);
          return {
            type: 'character',
            id: char.id,
            name: char.name || 'Karakter',
            isDm: false,
            titleBadge: `👤 ${char.name || 'Karakter'} Notları`,
            targetObj: char,
            notesList: char.notesList
          };
        }
      }
    }

    const activeCampId = state.activeCampaignId;

    // 1. Bağımsız / Atanmamış Sekmesi
    if (activeCampId === 'unassigned') {
      const unassignedChar = state.characters.find(c => !c.campaignId || c.campaignId === 'unassigned') || state.characters[0];
      if (unassignedChar) {
        if (!Array.isArray(unassignedChar.notesList)) {
          unassignedChar.notesList = normalizeLegacyNotes(unassignedChar.notes);
        }
        return {
          type: 'character',
          id: unassignedChar.id,
          name: unassignedChar.name || 'Bağımsız Karakter',
          isDm: false,
          titleBadge: `👤 ${unassignedChar.name || 'Karakter'} Notları (Bağımsız)`,
          targetObj: unassignedChar,
          notesList: unassignedChar.notesList
        };
      }
    }

    // 2. Belirli bir Aktif Kampanya Seçili İse
    const activeCamp = state.campaigns.find(c => c.id === activeCampId);
    if (activeCamp) {
      const hName = getCampaignHierarchyName(activeCamp, state);
      if (activeCamp.isDmMode) {
        if (!Array.isArray(activeCamp.notesList)) {
          activeCamp.notesList = normalizeLegacyNotes(activeCamp.notes);
        }
        return {
          type: 'campaign',
          id: activeCamp.id,
          name: hName,
          rawName: activeCamp.name,
          isDm: true,
          titleBadge: '👑 DM Notları (Gizli)',
          targetObj: activeCamp,
          notesList: activeCamp.notesList
        };
      }

      // Oyuncu Kampanyası: Bu kampanyaya bağlı oyuncu karakterini bul
      const campChars = state.characters.filter(c => c.campaignId === activeCamp.id);
      const targetChar = campChars[0] || state.characters[0];

      if (targetChar) {
        if (!Array.isArray(targetChar.notesList)) {
          targetChar.notesList = normalizeLegacyNotes(targetChar.notes);
        }
        return {
          type: 'character',
          id: targetChar.id,
          name: targetChar.name || 'Karakter',
          isDm: false,
          titleBadge: `👤 ${targetChar.name || 'Karakter'} Notları`,
          targetObj: targetChar,
          notesList: targetChar.notesList
        };
      }

      // Kampanyada henüz karakter yoksa kampanya not defterini kullan
      if (!Array.isArray(activeCamp.notesList)) {
        activeCamp.notesList = normalizeLegacyNotes(activeCamp.notes);
      }
      return {
        type: 'campaign',
        id: activeCamp.id,
        name: hName,
        rawName: activeCamp.name,
        isDm: false,
        titleBadge: '🏰 Sefer Notları',
        targetObj: activeCamp,
        notesList: activeCamp.notesList
      };
    }

    // 3. Genel ('all') sekmesinde veya eşleşmeme durumunda ilk karakter
    const firstChar = state.characters[0];
    if (firstChar) {
      if (!Array.isArray(firstChar.notesList)) {
        firstChar.notesList = normalizeLegacyNotes(firstChar.notes);
      }
      return {
        type: 'character',
        id: firstChar.id,
        name: firstChar.name || 'Karakter',
        isDm: false,
        titleBadge: `👤 ${firstChar.name || 'Karakter'} Notları`,
        targetObj: firstChar,
        notesList: firstChar.notesList
      };
    }

    // 4. Karakter yoksa ilk kampanya
    const firstCamp = state.campaigns[0];
    if (firstCamp) {
      if (!Array.isArray(firstCamp.notesList)) {
        firstCamp.notesList = normalizeLegacyNotes(firstCamp.notes);
      }
      const hName = getCampaignHierarchyName(firstCamp, state);
      return {
        type: 'campaign',
        id: firstCamp.id,
        name: hName,
        rawName: firstCamp.name,
        isDm: Boolean(firstCamp.isDmMode),
        titleBadge: firstCamp.isDmMode ? '👑 DM Notları (Gizli)' : '🏰 Sefer Notları',
        targetObj: firstCamp,
        notesList: firstCamp.notesList
      };
    }

    // 5. Hiçbir kampanya ve karakter yoksa dinamik güvenli alan oluştur
    const defaultCamp = {
      id: 'camp_default',
      name: 'Genel Not Defteri',
      notesList: []
    };
    state.campaigns.push(defaultCamp);
    if (typeof window.saveHubStorage === 'function') window.saveHubStorage();

    return {
      type: 'campaign',
      id: defaultCamp.id,
      name: defaultCamp.name,
      isDm: false,
      titleBadge: '📝 Genel Notlar',
      targetObj: defaultCamp,
      notesList: defaultCamp.notesList
    };
  }

  function normalizeLegacyNotes(rawNotes) {
    if (!rawNotes || typeof rawNotes !== 'string') return [];
    const text = rawNotes.trim();
    if (!text) return [];

    return [{
      id: 'note_' + Date.now(),
      text: text,
      pinned: false,
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: extractTags(text)
    }];
  }

  function saveNotesChanges(target) {
    if (!target) return;
    const state = getHubState();

    // 0. targetObj referansını daima senkronize tut
    if (target.targetObj) {
      target.targetObj.notesList = target.notesList || [];
      target.targetObj.notes = (target.notesList || []).map(n => n.text).join('\n\n');
    }

    // 1. HUB State Depolaması
    if (state && typeof window.saveHubStorage === 'function') {
      window.saveHubStorage();
    } else if (state) {
      try {
        localStorage.setItem('dnd35_hub_db', JSON.stringify({
          campaigns: state.campaigns || [],
          characters: state.characters || [],
          latestDmEvent: state.latestDmEvent || null,
          lastSaved: new Date().toISOString()
        }));
      } catch (e) {}
    }

    // 2. Karakter ise dnd35_character ile Çapraz Senkronizasyon (Kural #6)
    if (target.type === 'character' && target.targetObj) {
      try {
        const charRaw = localStorage.getItem('dnd35_character');
        if (charRaw) {
          const activeChar = JSON.parse(charRaw);
          if (activeChar && (activeChar.id === target.id || activeChar.name === target.name)) {
            activeChar.notesList = target.notesList;
            activeChar.notes = (target.notesList || []).map(n => n.text).join('\n\n');
            localStorage.setItem('dnd35_character', JSON.stringify(activeChar));
          }
        }
      } catch (e) {
        console.warn('dnd35_character yerel depolama senkronizasyon uyarısı:', e);
      }
    }
  }

  /**
   * Sort notes: Pinned first, then by updatedAt descending
   */
  function sortNotes(notes) {
    return [...notes].sort((a, b) => {
      const aPin = Boolean(a.pinned);
      const bPin = Boolean(b.pinned);
      if (aPin && !bPin) return -1;
      if (!aPin && bPin) return 1;
      return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
    });
  }

  /**
   * Filter notes by active tag and search query
   */
  function filterNotes(notes) {
    return notes.filter(n => {
      if (_activeNoteFilterTag !== 'all') {
        const tags = n.tags || extractTags(n.text);
        if (!tags.includes(_activeNoteFilterTag.toLowerCase())) return false;
      }
      if (_activeNoteSearchQuery) {
        const q = _activeNoteSearchQuery.toLowerCase();
        if (!n.text.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  /**
   * Switch between Write tab and List tab in side panel
   */
  function switchPanelTab(tab) {
    _activePanelTab = tab;
    const writeBtn = document.getElementById('hub-notes-tab-write');
    const listBtn = document.getElementById('hub-notes-tab-list');
    const writeView = document.getElementById('hub-notes-write-view');
    const listView = document.getElementById('hub-notes-list-view');

    if (tab === 'write') {
      if (writeBtn) {
        writeBtn.className = 'flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 bg-indigo-600 text-white shadow cursor-pointer';
      }
      if (listBtn) {
        listBtn.className = 'flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 text-slate-400 hover:text-white cursor-pointer';
      }
      if (writeView) writeView.classList.remove('hidden');
      if (listView) listView.classList.add('hidden');
      const input = document.getElementById('hub-quick-note-input');
      if (input) input.focus();
    } else {
      if (writeBtn) {
        writeBtn.className = 'flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 text-slate-400 hover:text-white cursor-pointer';
      }
      if (listBtn) {
        listBtn.className = 'flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 bg-indigo-600 text-white shadow cursor-pointer';
      }
      if (writeView) writeView.classList.add('hidden');
      if (listView) listView.classList.remove('hidden');
    }

    try { localStorage.setItem('hub_notes_panel_tab', tab); } catch (e) {}
  }

  /**
   * Quick Add Note from Textarea
   */
  function addQuickNote() {
    const input = document.getElementById('hub-quick-note-input');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;

    const target = getActiveNotesTarget();
    if (!target) {
      alert('Not eklemek için lütfen önce bir kampanya veya karakter oluşturun.');
      return;
    }

    const newNote = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      text: val,
      pinned: false,
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: extractTags(val)
    };

    target.notesList.unshift(newNote);
    saveNotesChanges(target);
    input.value = '';
    
    renderInlineNotes();
    renderFullNotesModalList();

    // Not eklendiğinde kayıtlı notlar listesini güncelle
    const countEl = document.getElementById('hub-notes-tab-count');
    if (countEl) countEl.textContent = String(target.notesList.length);
  }

  function insertTagIntoQuickInput(tag) {
    const input = document.getElementById('hub-quick-note-input');
    if (!input) return;

    const pos = input.selectionStart || input.value.length;
    const textBefore = input.value.substring(0, pos);
    const textAfter = input.value.substring(pos);

    input.value = textBefore + (textBefore.endsWith(' ') || textBefore.length === 0 ? '' : ' ') + tag + ' ' + textAfter;
    input.focus();
  }

  /**
   * Toggle Pin Status
   */
  function togglePinNote(noteId, event) {
    if (event) event.stopPropagation();
    const target = getActiveNotesTarget();
    if (!target) return;

    const actualId = noteId || _selectedModalNoteId;
    const note = target.notesList.find(n => n.id === actualId);
    if (note) {
      note.pinned = !note.pinned;
      note.updatedAt = Date.now();
      saveNotesChanges(target);
      renderInlineNotes();
      renderFullNotesModalList();
      loadSelectedNoteIntoEditor();
    }
  }

  /**
   * Toggle To-Do Completion Status
   */
  function toggleCompleteNote(noteId, event) {
    if (event) event.stopPropagation();
    const target = getActiveNotesTarget();
    if (!target) return;

    const actualId = noteId || _selectedModalNoteId;
    const note = target.notesList.find(n => n.id === actualId);
    if (note) {
      note.completed = !note.completed;
      note.updatedAt = Date.now();
      saveNotesChanges(target);
      renderInlineNotes();
      renderFullNotesModalList();
      loadSelectedNoteIntoEditor();
    }
  }

  /**
   * Delete Note
   */
  function deleteNote(noteId, event) {
    if (event) {
      if (typeof event.preventDefault === 'function') event.preventDefault();
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
    }

    const target = getActiveNotesTarget();
    if (!target) return;

    const actualId = noteId || _selectedModalNoteId || (target.notesList && target.notesList[0] && target.notesList[0].id);
    if (!actualId) return;

    if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;

    // 1. Notu yerel listeden kaldır
    target.notesList = (target.notesList || []).filter(n => n.id !== actualId);

    // 2. targetObj üzerindeki diziyi ve metni kalıcı senkronize et
    if (target.targetObj) {
      target.targetObj.notesList = target.notesList;
      target.targetObj.notes = target.notesList.map(n => n.text).join('\n\n');
    }

    // 3. Seçili ID'yi güncelle
    if (_selectedModalNoteId === actualId || !_selectedModalNoteId) {
      _selectedModalNoteId = target.notesList.length > 0 ? target.notesList[0].id : null;
    }

    // 4. Veritabanına kalıcı yaz
    saveNotesChanges(target);

    // 5. Ekranları anında tazele
    renderInlineNotes();
    renderFullNotesModalList();
    loadSelectedNoteIntoEditor();
  }

  /**
   * Format note text: Highlight tags and handle to-do prefixes
   */
  function formatNoteTextHtml(text) {
    if (!text) return '';
    const safe = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return safe.replace(TAG_REGEX, (match) => {
      const lower = match.toLowerCase();
      let colorClass = 'text-amber-400 bg-amber-950/40 border-amber-500/30';
      if (lower === '#gorev' || lower === '#quest') colorClass = 'text-sky-400 bg-sky-950/40 border-sky-500/30';
      else if (lower === '#npc') colorClass = 'text-purple-400 bg-purple-950/40 border-purple-500/30';
      else if (lower === '#yer' || lower === '#mekan') colorClass = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
      else if (lower === '#loot' || lower === '#esya') colorClass = 'text-yellow-400 bg-yellow-950/40 border-yellow-500/30';
      else if (lower.startsWith('#lvl') || lower.startsWith('#level')) colorClass = 'text-indigo-300 bg-indigo-950/50 border-indigo-500/40';
      else if (lower.includes('202') || lower.includes('ocak') || lower.includes('şubat') || lower.includes('mart') || lower.includes('nisan') || lower.includes('mayıs') || lower.includes('haziran') || lower.includes('temmuz') || lower.includes('ağustos') || lower.includes('eylül') || lower.includes('ekim') || lower.includes('kasım') || lower.includes('aralık')) colorClass = 'text-teal-300 bg-teal-950/50 border-teal-500/40';

      return `<span class="inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border ${colorClass}">${match}</span>`;
    });
  }

  /**
   * Render Pinned Notes Strip in Write View
   */
  function renderPinnedStrip(notes) {
    const stripEl = document.getElementById('hub-notes-pinned-strip');
    const chipsEl = document.getElementById('hub-notes-pinned-chips');
    if (!stripEl || !chipsEl) return;

    const pinnedNotes = notes.filter(n => Boolean(n.pinned));
    if (pinnedNotes.length === 0) {
      stripEl.classList.add('hidden');
      return;
    }

    stripEl.classList.remove('hidden');
    chipsEl.innerHTML = pinnedNotes.map(n => `
      <div onclick="HubNotes.openFullNotesModal('${n.id}')" class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-200 text-[11px] font-medium hover:border-amber-400 transition cursor-pointer max-w-full truncate" title="${escapeHtml(n.text)}">
        <span class="text-amber-400 text-xs shrink-0">📌</span>
        <span class="truncate">${escapeHtml(n.text.slice(0, 28))}</span>
      </div>
    `).join('');
  }

  /**
   * Render Compact Inline Notes List
   */
  function renderInlineNotes() {
    const listEl = document.getElementById('hub-inline-notes-list');
    const badgeEl = document.getElementById('hub-notes-panel-badge');
    const countEl = document.getElementById('hub-notes-panel-count');
    const tabCountEl = document.getElementById('hub-notes-tab-count');
    if (!listEl) return;

    const target = getActiveNotesTarget();
    if (!target) {
      listEl.innerHTML = `<div class="p-4 text-center text-slate-500 text-xs italic">Not almak için aktif kampanya seçin.</div>`;
      if (badgeEl) badgeEl.textContent = '📜 Notlar';
      if (countEl) countEl.textContent = '0';
      if (tabCountEl) tabCountEl.textContent = '0';
      return;
    }

    if (badgeEl) badgeEl.textContent = target.titleBadge;
    if (countEl) countEl.textContent = String(target.notesList.length);
    if (tabCountEl) tabCountEl.textContent = String(target.notesList.length);

    renderPinnedStrip(target.notesList);

    const sorted = sortNotes(target.notesList);
    const filtered = filterNotes(sorted);

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="p-6 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2 h-44">
          <span class="text-2xl opacity-60">📜</span>
          <span>Kayıtlı not bulunamadı.</span>
          <span class="text-[10px] text-slate-600">"Not Defteri" sekmesinden yeni not yazıp kaydedebilirsiniz.</span>
        </div>`;
      return;
    }

    let html = '';
    filtered.forEach(note => {
      const isPinned = Boolean(note.pinned);
      const isCompleted = Boolean(note.completed);

      html += `
        <div onclick="HubNotes.openFullNotesModal('${note.id}')" class="p-2.5 rounded-xl border transition group cursor-pointer relative ${isPinned ? 'bg-amber-950/20 border-amber-500/40 shadow-sm' : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700'}">
          <div class="flex items-start justify-between gap-1.5">
            <!-- Pin & Checkbox Alanı -->
            <div class="flex items-center gap-1.5 shrink-0 mt-0.5">
              <button type="button" onclick="HubNotes.togglePinNote('${note.id}', event)" class="p-1 rounded text-xs transition cursor-pointer ${isPinned ? 'text-amber-400 hover:text-amber-300' : 'text-slate-600 hover:text-slate-400'}" title="${isPinned ? 'Başa Sabitlemeyi Kaldır' : 'Başa Sabitle'}">
                📌
              </button>
              <button type="button" onclick="HubNotes.toggleCompleteNote('${note.id}', event)" class="w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold transition cursor-pointer ${isCompleted ? 'bg-emerald-600 border-emerald-400 text-white' : 'border-slate-600 hover:border-slate-400 text-transparent'}" title="${isCompleted ? 'Tamamlandı olarak işaretlendi' : 'Tamamlandı yap'}">
                ✓
              </button>
            </div>

            <!-- Not Metni -->
            <div class="flex-1 min-w-0">
              <div class="text-xs text-slate-200 leading-snug line-clamp-2 break-words ${isCompleted ? 'line-through opacity-60' : ''}">
                ${formatNoteTextHtml(note.text)}
              </div>
            </div>

            <!-- Hızlı Aksiyonlar -->
            <div class="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
              <button type="button" onclick="HubNotes.deleteNote('${note.id}', event)" class="p-1 text-slate-500 hover:text-rose-400 rounded text-[11px] transition cursor-pointer" title="Notu Sil">
                ✕
              </button>
            </div>
          </div>
        </div>
      `;
    });

    listEl.innerHTML = html;
  }

  /**
   * Open Full Notes Modal
   */
  function openFullNotesModal(selectNoteId = null) {
    const modal = document.getElementById('hub-full-notes-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const target = getActiveNotesTarget();
    if (target && target.notesList.length > 0) {
      _selectedModalNoteId = selectNoteId || target.notesList[0].id;
    } else {
      _selectedModalNoteId = null;
    }

    renderFullNotesModalList();
    loadSelectedNoteIntoEditor();
  }

  function closeFullNotesModal() {
    const modal = document.getElementById('hub-full-notes-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    renderInlineNotes();
  }

  function setTargetOverride(targetKey) {
    _overrideTargetKey = targetKey;
    const target = getActiveNotesTarget();
    if (target && target.notesList.length > 0) {
      _selectedModalNoteId = target.notesList[0].id;
    } else {
      _selectedModalNoteId = null;
    }
    renderFullNotesModalList();
    loadSelectedNoteIntoEditor();
  }

  function updateModalTargetSelector(activeTarget) {
    const titleEl = document.getElementById('hub-modal-target-title');
    if (!titleEl) return;
    const state = getHubState();
    if (!state) {
      titleEl.innerHTML = `<span class="bg-indigo-950/80 text-indigo-300 px-2 py-0.5 rounded-lg border border-indigo-800/60 font-semibold">${escapeHtml(activeTarget ? activeTarget.titleBadge : 'Not Defteri')}</span>`;
      return;
    }

    const camps = state.campaigns || [];
    const chars = state.characters || [];

    if (camps.length + chars.length <= 1) {
      const dName = getTargetDisplayName(activeTarget, state);
      titleEl.innerHTML = `<span class="bg-indigo-950/80 text-indigo-300 px-2 py-0.5 rounded-lg border border-indigo-800/60 font-semibold">${escapeHtml(dName)}</span>`;
      return;
    }

    const currentKey = activeTarget ? `${activeTarget.type === 'character' ? 'char' : 'campaign'}:${activeTarget.id}` : '';

    let selectHtml = `<select onchange="HubNotes.setTargetOverride(this.value)" class="bg-indigo-950/90 hover:bg-indigo-900/90 text-indigo-200 border border-indigo-700/80 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:border-indigo-400 cursor-pointer shadow-sm max-w-[320px] truncate">`;

    if (chars.length > 0) {
      selectHtml += `<optgroup label="👤 Karakter Not Defterleri">`;
      chars.forEach(c => {
        const val = `char:${c.id}`;
        let charContext = '';
        if (c.campaignId) {
          const cp = camps.find(camp => camp.id === c.campaignId);
          if (cp) charContext = ` (${getCampaignHierarchyName(cp, state)})`;
        }
        selectHtml += `<option value="${val}" ${val === currentKey ? 'selected' : ''}>👤 ${escapeHtml((c.name || 'Karakter') + charContext)}</option>`;
      });
      selectHtml += `</optgroup>`;
    }

    if (camps.length > 0) {
      selectHtml += `<optgroup label="🏰 Kampanya Not Defterleri">`;
      camps.forEach(cp => {
        const val = `campaign:${cp.id}`;
        const prefix = cp.isDmMode ? '👑 DM: ' : '🏰 ';
        const hName = getCampaignHierarchyName(cp, state);
        selectHtml += `<option value="${val}" ${val === currentKey ? 'selected' : ''}>${prefix}${escapeHtml(hName)}</option>`;
      });
      selectHtml += `</optgroup>`;
    }

    selectHtml += `</select>`;
    titleEl.innerHTML = selectHtml;
  }

  /**
   * Render Note List inside Full Modal
   */
  function renderFullNotesModalList() {
    const listEl = document.getElementById('hub-modal-notes-list');
    if (!listEl) return;

    const state = getHubState();
    const target = getActiveNotesTarget();
    updateModalTargetSelector(target);

    if (!target) {
      listEl.innerHTML = `<div class="p-4 text-slate-500 text-xs italic">Aktif hedef bulunamadı.</div>`;
      return;
    }

    const sorted = sortNotes(target.notesList);
    const filtered = filterNotes(sorted);

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="p-6 text-center text-slate-500 text-xs">Aramaya uygun not bulunamadı.</div>`;
      return;
    }

    let html = '';
    const targetDisplayName = getTargetDisplayName(target, state);

    filtered.forEach((note, idx) => {
      const isSelected = note.id === _selectedModalNoteId;
      const isPinned = Boolean(note.pinned);
      const isCompleted = Boolean(note.completed);

      // Kart Başlığı: Kampanya Adı (Alt kampanya ise Ana Kampanya › Alt Kampanya)
      const cardTitle = filtered.length > 1
        ? `${targetDisplayName} • Not ${idx + 1}`
        : targetDisplayName;

      html += `
        <div onclick="HubNotes.selectNoteInModal('${note.id}')" class="p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${isSelected ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md' : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'}">
          <div class="flex items-center justify-between gap-1.5">
            <div class="flex items-center gap-1.5 min-w-0">
              ${isPinned ? '<span class="text-amber-400 text-xs shrink-0" title="Başa Sabitlendi">📌</span>' : ''}
              <span class="text-xs font-bold truncate text-indigo-300" title="${escapeHtml(targetDisplayName)}">${escapeHtml(cardTitle)}</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="text-[9px] text-slate-500 font-mono">${formatTimeAgo(note.updatedAt || note.createdAt)}</span>
              <button type="button" onclick="HubNotes.deleteNote('${note.id}', event)" class="p-1 text-slate-500 hover:text-rose-400 rounded text-xs transition cursor-pointer" title="Bu Notu Sil">✕</button>
            </div>
          </div>
          <div class="text-[11px] text-slate-400 line-clamp-2 break-words">
            ${escapeHtml(note.text) || '<span class="italic text-slate-500">Boş not metni...</span>'}
          </div>
        </div>
      `;
    });

    listEl.innerHTML = html;
  }

  function selectNoteInModal(noteId) {
    _selectedModalNoteId = noteId;
    renderFullNotesModalList();
    loadSelectedNoteIntoEditor();
  }

  function loadSelectedNoteIntoEditor() {
    const editor = document.getElementById('hub-modal-note-editor');
    const pinBtn = document.getElementById('hub-modal-pin-btn');
    const deleteBtn = document.getElementById('hub-modal-delete-btn');
    const dateBadge = document.getElementById('hub-modal-date-badge');
    if (!editor) return;

    const target = getActiveNotesTarget();
    if (!target) {
      editor.value = '';
      editor.placeholder = 'Düzenlemek için sol listeden bir not seçin veya yeni not oluşturun.';
      editor.disabled = true;
      if (pinBtn) pinBtn.classList.add('opacity-40', 'pointer-events-none');
      if (deleteBtn) deleteBtn.classList.add('opacity-40', 'pointer-events-none');
      if (dateBadge) dateBadge.textContent = '-';
      return;
    }

    if (target.notesList.length === 0) {
      _selectedModalNoteId = null;
      editor.value = '';
      editor.placeholder = 'Bu defterde henüz not yok. "Yeni Not Oluştur" butonuna tıklayarak ilk notunuzu ekleyebilirsiniz.';
      editor.disabled = true;
      if (pinBtn) pinBtn.classList.add('opacity-40', 'pointer-events-none');
      if (deleteBtn) deleteBtn.classList.add('opacity-40', 'pointer-events-none');
      if (dateBadge) dateBadge.textContent = '-';
      return;
    }

    let note = target.notesList.find(n => n.id === _selectedModalNoteId);
    if (!note) {
      note = target.notesList[0];
      _selectedModalNoteId = note.id;
    }

    editor.disabled = false;
    editor.value = note.text || '';
    if (dateBadge) {
      const state = getHubState();
      const dName = getTargetDisplayName(target, state);
      dateBadge.textContent = `${dName} • Son Güncelleme: ${new Date(note.updatedAt || note.createdAt).toLocaleString('tr-TR')}`;
    }

    if (pinBtn) {
      pinBtn.classList.remove('opacity-40', 'pointer-events-none');
      pinBtn.textContent = note.pinned ? '📌 Sabitlendi' : '📌 Başa Sabitle';
      pinBtn.className = note.pinned 
        ? 'px-3 py-1.5 rounded-lg text-xs font-bold transition bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-pointer'
        : 'px-3 py-1.5 rounded-lg text-xs font-bold transition bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer';
    }

    if (deleteBtn) {
      deleteBtn.classList.remove('opacity-40', 'pointer-events-none');
    }
  }

  function handleEditorInput() {
    const editor = document.getElementById('hub-modal-note-editor');
    if (!editor || !_selectedModalNoteId) return;

    const target = getActiveNotesTarget();
    if (!target) return;

    const note = target.notesList.find(n => n.id === _selectedModalNoteId);
    if (!note) return;

    note.text = editor.value;
    note.tags = extractTags(editor.value);
    note.updatedAt = Date.now();

    saveNotesChanges(target);
    renderFullNotesModalList();
    renderInlineNotes();
  }

  function insertTagIntoEditor(tag) {
    const editor = document.getElementById('hub-modal-note-editor');
    if (!editor || editor.disabled) return;

    const pos = editor.selectionStart || editor.value.length;
    const textBefore = editor.value.substring(0, pos);
    const textAfter = editor.value.substring(pos);

    editor.value = textBefore + (textBefore.endsWith(' ') || textBefore.length === 0 ? '' : ' ') + tag + ' ' + textAfter;
    editor.focus();
    handleEditorInput();
  }

  function toValidHashtag(str) {
    if (!str || typeof str !== 'string') return '#Karakter';
    const cleaned = str
      .trim()
      .replace(/[^\w\u00C0-\u024F\u1E00-\u1EFFğüşıöçĞÜŞİÖÇ]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
    return cleaned ? `#${cleaned}` : '#Karakter';
  }

  function resolveCharacterForNote(target, state) {
    if (target && target.type === 'character' && target.targetObj) {
      return target.targetObj;
    }
    // Eğer hedef kampanya ise bu kampanyaya bağlı ilk karakteri bul
    if (target && target.type === 'campaign' && state && Array.isArray(state.characters)) {
      const campChar = state.characters.find(c => c.campaignId === target.id);
      if (campChar) return campChar;
      if (state.characters.length > 0) return state.characters[0];
    }
    try {
      const raw = localStorage.getItem('dnd35_character');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.name) return parsed;
      }
    } catch (e) {}

    return null;
  }

  function createNewModalNote() {
    const target = getActiveNotesTarget();
    if (!target) {
      alert('Lütfen önce bir kampanya veya karakter seçin.');
      return;
    }

    const state = getHubState();
    const char = resolveCharacterForNote(target, state);
    const charName = char ? (char.name || 'Karakter') : 'Karakter';
    const charLvl = char ? (Number(char.level) || 1) : 1;

    const charTag = toValidHashtag(charName);
    const lvlTag = `#lvl${charLvl}`;

    const now = new Date();
    const monthsTr = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const dateTag = `#${now.getDate()}_${monthsTr[now.getMonth()]}_${now.getFullYear()}`;

    const defaultText = `${charTag} ${lvlTag} ${dateTag}\n\n`;
    const extractedTags = extractTags(defaultText);

    const newNote = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      text: defaultText,
      pinned: false,
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: extractedTags
    };

    target.notesList.unshift(newNote);
    if (target.targetObj) {
      target.targetObj.notesList = target.notesList;
      target.targetObj.notes = target.notesList.map(n => n.text).join('\n\n');
    }
    saveNotesChanges(target);

    _selectedModalNoteId = newNote.id;
    renderFullNotesModalList();
    loadSelectedNoteIntoEditor();

    const editor = document.getElementById('hub-modal-note-editor');
    if (editor) {
      editor.focus();
      editor.selectionStart = editor.selectionEnd = editor.value.length;
    }
  }

  function setTagFilter(tag) {
    _activeNoteFilterTag = tag;
    renderInlineNotes();
    renderFullNotesModalList();
  }

  function handleSearchInput(val) {
    _activeNoteSearchQuery = (val || '').trim();
    renderInlineNotes();
    renderFullNotesModalList();
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function formatTimeAgo(ts) {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'Az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)} dk`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} sa`;
    return new Date(ts).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  }

  // Global Exports
  window.HubNotes = {
    getActiveNotesTarget,
    renderInlineNotes,
    switchPanelTab,
    addQuickNote,
    insertTagIntoQuickInput,
    togglePinNote,
    toggleCompleteNote,
    deleteNote,
    openFullNotesModal,
    closeFullNotesModal,
    selectNoteInModal,
    handleEditorInput,
    insertTagIntoEditor,
    createNewModalNote,
    setTargetOverride,
    setTagFilter,
    handleSearchInput
  };

  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      try {
        const savedTab = localStorage.getItem('hub_notes_panel_tab');
        if (savedTab) switchPanelTab(savedTab);
      } catch (e) {}
      renderInlineNotes();
    }, 150);
  });

})();
