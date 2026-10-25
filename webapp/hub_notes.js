/**
 * hub_notes.js - Joyful-Fermi Hub & Character Synchronized Notes Engine
 * D&D 3.5e Cockpit
 *
 * Capabilities:
 * 1. Stage 1: Smart Hashtag Autocomplete & Typeahead Popover (Standard & Dynamic tags)
 * 2. Stage 2: Relational Co-occurrence Tag Filtering & Interactive SVG Mindmap Graph
 * 3. Stage 3: AI Campaign Chronicler (Narrative Session Journal, Quest Dossier, NPCs, Loot)
 *
 * Strict Compliance:
 * - Rule #3: STRICT NO 6-SIDED DICE EMOJI (Zero dice emoji).
 * - Rule #7: Handover & Parity between root and webapp.
 */

(function () {
  'use strict';

  // Internal State
  let _activeNoteFilterTag = 'all';
  let _activeNoteSearchQuery = '';
  let _selectedModalNoteId = null;
  let _activePanelTab = 'write'; // 'write' or 'list'
  let _overrideTargetKey = null; // 'campaign:<id>' or 'char:<id>'
  let _activeModalView = 'editor'; // 'editor', 'mindmap', 'ai'
  let _selectedMindmapTag = null;
  let _lastAiGeneratedText = '';

  // Tag extraction regex supporting Turkish and international unicode characters
  const TAG_REGEX = /#[\w\u00C0-\u024F\u1E00-\u1EFFğüşıöçĞÜŞİÖÇ]+/gi;

  // Standard System Tags with Icons & Descriptive Labels
  const STANDARD_TAGS = [
    { tag: '#gorev', icon: '⚔️', label: 'Görev & Hedef' },
    { tag: '#npc', icon: '👤', label: 'Karakter / NPC' },
    { tag: '#yer', icon: '🗺️', label: 'Mekan & Konum' },
    { tag: '#loot', icon: '💎', label: 'Eşya & Hazine' },
    { tag: '#ipucu', icon: '🔍', label: 'İpucu & Gizem' },
    { tag: '#savas', icon: '⚡', label: 'Çatışma & Karşılaşma' },
    { tag: '#bilgi', icon: '📜', label: 'Bilgi & Lore' },
    { tag: '#anlasma', icon: '🤝', label: 'Sözleşme & İttifak' }
  ];

  function extractTags(text) {
    if (!text || typeof text !== 'string') return [];
    const matches = text.match(TAG_REGEX);
    if (!matches) return [];
    return Array.from(new Set(matches.map(t => t.toLowerCase())));
  }

  function getTagIcon(tag) {
    if (!tag) return '🏷️';
    const l = tag.toLowerCase();
    if (l === '#gorev' || l === '#quest') return '⚔️';
    if (l === '#npc') return '👤';
    if (l === '#yer' || l === '#mekan' || l === '#sehir' || l === '#zindan') return '🗺️';
    if (l === '#loot' || l === '#esya' || l === '#hazine' || l === '#altin') return '💎';
    if (l === '#ipucu' || l === '#sir' || l === '#clue') return '🔍';
    if (l === '#savas' || l === '#combat') return '⚡';
    if (l === '#bilgi' || l === '#lore') return '📜';
    if (l === '#anlasma' || l === '#ittifak') return '🤝';
    if (l.startsWith('#lvl') || l.startsWith('#level')) return '⭐';
    if (l.includes('202') || l.includes('ocak') || l.includes('şubat') || l.includes('mart') || l.includes('nisan') || l.includes('mayıs') || l.includes('haziran') || l.includes('temmuz') || l.includes('ağustos') || l.includes('eylül') || l.includes('ekim') || l.includes('kasım') || l.includes('aralık')) return '📅';
    return '🏷️';
  }

  function getTagColorClass(tag) {
    if (!tag) return 'text-indigo-300 bg-indigo-950/40 border-indigo-500/30';
    const l = tag.toLowerCase();
    if (l === '#gorev' || l === '#quest') return 'text-sky-400 bg-sky-950/40 border-sky-500/30';
    if (l === '#npc') return 'text-purple-400 bg-purple-950/40 border-purple-500/30';
    if (l === '#yer' || l === '#mekan' || l === '#sehir') return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
    if (l === '#loot' || l === '#esya' || l === '#altin') return 'text-yellow-400 bg-yellow-950/40 border-yellow-500/30';
    if (l === '#ipucu' || l === '#sir') return 'text-teal-400 bg-teal-950/40 border-teal-500/30';
    if (l === '#savas' || l === '#combat') return 'text-rose-400 bg-rose-950/40 border-rose-500/30';
    if (l.startsWith('#lvl') || l.startsWith('#level')) return 'text-indigo-300 bg-indigo-950/50 border-indigo-500/40';
    if (l.includes('202') || l.includes('ocak') || l.includes('şubat') || l.includes('mart') || l.includes('nisan') || l.includes('mayıs') || l.includes('haziran') || l.includes('temmuz') || l.includes('ağustos') || l.includes('eylül') || l.includes('ekim') || l.includes('kasım') || l.includes('aralık')) return 'text-cyan-300 bg-cyan-950/50 border-cyan-500/40';
    return 'text-amber-300 bg-amber-950/40 border-amber-500/30';
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
      const unassignedChar = state.characters.find(c => !c.campaignId);
      if (unassignedChar) {
        if (!Array.isArray(unassignedChar.notesList)) {
          unassignedChar.notesList = normalizeLegacyNotes(unassignedChar.notes);
        }
        return {
          type: 'character',
          id: unassignedChar.id,
          name: unassignedChar.name || 'Bağımsız Karakter',
          isDm: false,
          titleBadge: `👤 ${unassignedChar.name || 'Karakter'} Notları`,
          targetObj: unassignedChar,
          notesList: unassignedChar.notesList
        };
      }
    }

    // 2. Aktif Kampanya Seçili İse
    const activeCamp = state.campaigns.find(c => c.id === activeCampId);
    if (activeCamp) {
      const hName = getCampaignHierarchyName(activeCamp, state);

      // 2a. DM Modu ise -> Doğrudan Kampanya DM Notları
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

      // 2b. Oyuncu Kampanyası ise -> Kampanyadaki aktif karakterin notları
      const charsInCamp = state.characters.filter(c => c.campaignId === activeCamp.id);
      if (charsInCamp.length > 0) {
        let targetChar = charsInCamp[0];
        try {
          const rawChar = localStorage.getItem('dnd35_character');
          if (rawChar) {
            const parsed = JSON.parse(rawChar);
            const found = charsInCamp.find(c => c.id === parsed.id || c.name === parsed.name);
            if (found) targetChar = found;
          }
        } catch (e) {}

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
        const tags = n.tags && n.tags.length > 0 ? n.tags : extractTags(n.text || '');
        if (!tags.map(t => t.toLowerCase()).includes(_activeNoteFilterTag.toLowerCase())) return false;
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
      const colorClass = getTagColorClass(match);
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
  function openFullNotesModal(selectNoteId = null, initialView = 'editor') {
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

    switchModalView(initialView || 'editor');
    renderFullNotesModalList();
    loadSelectedNoteIntoEditor();
  }

  function closeFullNotesModal() {
    saveModalNote(false);
    hideAutocompletePopover();
    const modal = document.getElementById('hub-full-notes-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    renderInlineNotes();
  }

  function setTargetOverride(targetKey) {
    saveModalNote(false);
    _overrideTargetKey = targetKey;
    try { localStorage.setItem('hub_notes_active_target', targetKey); } catch (e) {}
    const target = getActiveNotesTarget();
    if (target && target.notesList.length > 0) {
      _selectedModalNoteId = target.notesList[0].id;
    } else {
      _selectedModalNoteId = null;
    }
    renderFullNotesModalList();
    loadSelectedNoteIntoEditor();
    if (_activeModalView === 'mindmap') renderMindmap();
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

    let selectHtml = `<select onchange="HubNotes.setTargetOverride(this.value)" class="bg-indigo-950/90 hover:bg-indigo-900/90 text-indigo-200 border border-indigo-700/80 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:border-indigo-400 cursor-pointer shadow-sm max-w-[280px] sm:max-w-[320px] truncate">`;

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

  // =========================================================================
  // STAGE 1: HASHTAG TYPEAHEAD AUTOCOMPLETE & POPOVER
  // =========================================================================

  let _popoverEl = null;
  let _activeInputEl = null;
  let _activeCandidates = [];
  let _selectedIndex = 0;
  let _matchStart = -1;
  let _matchEnd = -1;

  function initAutocompletePopover() {
    if (_popoverEl) return;
    _popoverEl = document.createElement('div');
    _popoverEl.id = 'hub-tag-autocomplete-popover';
    _popoverEl.className = 'fixed hidden z-[9999] bg-[#0c1322] border border-indigo-500/80 rounded-xl shadow-2xl overflow-hidden min-w-[240px] max-w-[320px] text-xs backdrop-blur-md transition-all duration-100 divide-y divide-slate-800/80';
    document.body.appendChild(_popoverEl);

    document.addEventListener('click', (e) => {
      if (_popoverEl && !_popoverEl.classList.contains('hidden')) {
        if (!e.target.closest('#hub-tag-autocomplete-popover') && e.target !== _activeInputEl) {
          hideAutocompletePopover();
        }
      }
    });
  }

  function hideAutocompletePopover() {
    if (_popoverEl) {
      _popoverEl.classList.add('hidden');
      _activeCandidates = [];
      _selectedIndex = 0;
    }
  }

  /**
   * Collect all unique tags across database with counts and metadata
   */
  function getAllUniqueTagsWithCounts() {
    const state = getHubState();
    const tagMap = new Map();

    // 1. Standard Tags
    STANDARD_TAGS.forEach(st => {
      tagMap.set(st.tag.toLowerCase(), {
        tag: st.tag,
        icon: st.icon,
        label: st.label,
        count: 0,
        isStandard: true
      });
    });

    if (!state) return Array.from(tagMap.values());

    // 2. Scan active campaign and all character notes
    const scanNotes = (notesList) => {
      if (!Array.isArray(notesList)) return;
      notesList.forEach(n => {
        const text = n.text || '';
        const tags = n.tags && n.tags.length > 0 ? n.tags : extractTags(text);
        tags.forEach(t => {
          const lower = t.toLowerCase();
          if (tagMap.has(lower)) {
            tagMap.get(lower).count++;
          } else {
            tagMap.set(lower, {
              tag: t,
              icon: getTagIcon(t),
              label: '',
              count: 1,
              isStandard: false
            });
          }
        });
      });
    };

    (state.campaigns || []).forEach(c => scanNotes(c.notesList));
    (state.characters || []).forEach(ch => scanNotes(ch.notesList));

    return Array.from(tagMap.values());
  }

  /**
   * Caret position calculator for input/textarea
   */
  function getCaretCoordinates(element, position) {
    const mirror = document.createElement('div');
    const style = window.getComputedStyle(element);

    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.wordWrap = 'break-word';
    mirror.style.top = '0px';
    mirror.style.left = '-9999px';
    mirror.style.width = style.width;
    mirror.style.font = style.font;
    mirror.style.padding = style.padding;
    mirror.style.border = style.border;
    mirror.style.boxSizing = style.boxSizing;
    mirror.style.lineHeight = style.lineHeight;

    mirror.textContent = element.value.substring(0, position);
    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    mirror.appendChild(span);

    document.body.appendChild(mirror);
    const rect = element.getBoundingClientRect();
    const spanOffsetTop = span.offsetTop;
    const spanOffsetLeft = span.offsetLeft;
    document.body.removeChild(mirror);

    return {
      top: rect.top + spanOffsetTop - element.scrollTop,
      left: rect.left + spanOffsetLeft - element.scrollLeft,
      height: parseInt(style.lineHeight) || 20
    };
  }

  function checkAutocomplete(el) {
    initAutocompletePopover();
    if (!el) return;

    const val = el.value || '';
    const pos = el.selectionStart;
    if (pos === null || pos === undefined) return;

    const textBefore = val.slice(0, pos);
    const match = textBefore.match(/(?:^|\s)(#[\w\u00C0-\u024F\u1E00-\u1EFFğüşıöçĞÜŞİÖÇ]*)$/i);

    if (!match) {
      hideAutocompletePopover();
      return;
    }

    const matchedToken = match[1];
    const query = matchedToken.slice(1).toLowerCase();
    _matchStart = pos - matchedToken.length;
    _matchEnd = pos;
    _activeInputEl = el;

    const allTags = getAllUniqueTagsWithCounts();

    let filtered = [];
    if (!query) {
      // Just typed '#' -> show standard + most used tags
      filtered = allTags.sort((a, b) => {
        if (a.isStandard && !b.isStandard) return -1;
        if (!a.isStandard && b.isStandard) return 1;
        return b.count - a.count;
      }).slice(0, 8);
    } else {
      filtered = allTags.filter(item => {
        const t = item.tag.toLowerCase().slice(1);
        return t.includes(query) || (item.label && item.label.toLowerCase().includes(query));
      }).sort((a, b) => {
        const aStarts = a.tag.toLowerCase().slice(1).startsWith(query);
        const bStarts = b.tag.toLowerCase().slice(1).startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return b.count - a.count;
      }).slice(0, 8);
    }

    if (filtered.length === 0) {
      hideAutocompletePopover();
      return;
    }

    _activeCandidates = filtered;
    _selectedIndex = 0;
    renderAutocompletePopover(el, pos);
  }

  function renderAutocompletePopover(el, pos) {
    if (!_popoverEl) return;
    const coords = getCaretCoordinates(el, pos);

    let html = `
      <div class="px-2.5 py-1.5 bg-slate-950/90 text-[10px] font-bold text-slate-400 flex items-center justify-between border-b border-slate-800">
        <span class="flex items-center gap-1"><span class="text-indigo-400 font-bold">#</span> <span>Etiket Tamamlama</span></span>
        <span class="text-[9px] font-mono text-slate-500">↑↓ Seç • Enter Ekle</span>
      </div>
      <div class="max-h-52 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
    `;

    _activeCandidates.forEach((item, idx) => {
      const isSelected = idx === _selectedIndex;
      const countBadge = item.count > 0 ? `<span class="text-[9px] text-slate-400 font-mono">(${item.count})</span>` : '';
      const labelBadge = item.label ? `<span class="text-[10px] text-slate-400 truncate max-w-[90px]">${item.label}</span>` : '';

      html += `
        <div onmousedown="HubNotes.selectAutocompleteTag(${idx}); event.preventDefault();" class="px-2 py-1.5 rounded-lg flex items-center justify-between gap-1.5 cursor-pointer transition ${isSelected ? 'bg-indigo-600 text-white font-bold shadow' : 'hover:bg-slate-800/80 text-slate-200'}">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="text-xs shrink-0">${item.icon}</span>
            <span class="font-mono text-xs truncate">${escapeHtml(item.tag)}</span>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            ${labelBadge}
            ${countBadge}
          </div>
        </div>
      `;
    });

    html += `</div>`;
    _popoverEl.innerHTML = html;
    _popoverEl.classList.remove('hidden');

    const popoverWidth = 250;
    const popoverHeight = Math.min(240, 36 + _activeCandidates.length * 30);

    let left = coords.left;
    let top = coords.top + coords.height + 4;

    if (left + popoverWidth > window.innerWidth - 16) {
      left = window.innerWidth - popoverWidth - 16;
    }
    if (left < 16) left = 16;

    if (top + popoverHeight > window.innerHeight - 16) {
      top = coords.top - popoverHeight - 6;
    }
    if (top < 16) top = 16;

    _popoverEl.style.left = `${Math.round(left)}px`;
    _popoverEl.style.top = `${Math.round(top)}px`;
  }

  function selectAutocompleteTag(index) {
    if (!_activeInputEl || index < 0 || index >= _activeCandidates.length) return;
    const candidate = _activeCandidates[index];
    const val = _activeInputEl.value;

    const before = val.slice(0, _matchStart);
    const after = val.slice(_matchEnd);
    const inserted = candidate.tag + ' ';

    _activeInputEl.value = before + inserted + after;
    const newPos = before.length + inserted.length;
    _activeInputEl.selectionStart = _activeInputEl.selectionEnd = newPos;
    _activeInputEl.focus();

    hideAutocompletePopover();

    if (_activeInputEl.id === 'hub-modal-note-editor') {
      handleEditorInput();
    }
  }

  function handleAutocompleteKeydown(el, e) {
    if (!_popoverEl || _popoverEl.classList.contains('hidden') || _activeCandidates.length === 0) {
      return false;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      _selectedIndex = (_selectedIndex + 1) % _activeCandidates.length;
      renderAutocompletePopover(el, el.selectionStart);
      return true;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      _selectedIndex = (_selectedIndex - 1 + _activeCandidates.length) % _activeCandidates.length;
      renderAutocompletePopover(el, el.selectionStart);
      return true;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      selectAutocompleteTag(_selectedIndex);
      return true;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      hideAutocompletePopover();
      return true;
    }
    return false;
  }

  // =========================================================================
  // STAGE 2: RELATIONAL CO-OCCURRENCE TAG FILTER & INTERACTIVE MINDMAP
  // =========================================================================

  /**
   * Calculate all tags that appear alongside an active tag across the notes list
   */
  function getCoOccurringTags(activeTag, notesList) {
    if (!activeTag || activeTag === 'all' || !Array.isArray(notesList)) return [];
    const targetTag = activeTag.toLowerCase();
    const relatedMap = new Map();

    notesList.forEach(n => {
      const tags = (n.tags && n.tags.length > 0 ? n.tags : extractTags(n.text || '')).map(t => t.toLowerCase());
      if (tags.includes(targetTag)) {
        tags.forEach(t => {
          if (t !== targetTag) {
            relatedMap.set(t, (relatedMap.get(t) || 0) + 1);
          }
        });
      }
    });

    return Array.from(relatedMap.entries())
      .map(([tag, count]) => ({ tag, count, icon: getTagIcon(tag) }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Render dynamic tags bar in the full modal (Left column)
   */
  function renderModalTagsBar(target) {
    const barEl = document.getElementById('hub-modal-tags-bar');
    if (!barEl) return;

    if (!target || !Array.isArray(target.notesList) || target.notesList.length === 0) {
      barEl.innerHTML = '';
      return;
    }

    // Collect tags in this target
    const counts = new Map();
    target.notesList.forEach(n => {
      const tags = n.tags && n.tags.length > 0 ? n.tags : extractTags(n.text || '');
      tags.forEach(t => {
        const lower = t.toLowerCase();
        counts.set(lower, (counts.get(lower) || 0) + 1);
      });
    });

    const isFiltered = _activeNoteFilterTag !== 'all';
    const relatedTags = isFiltered ? getCoOccurringTags(_activeNoteFilterTag, target.notesList) : [];

    let html = `
      <div class="flex flex-wrap gap-1 text-[10px] font-mono max-h-36 overflow-y-auto custom-scrollbar pr-0.5">
        <button type="button" onclick="HubNotes.setTagFilter('all')" class="px-2 py-0.5 rounded-md transition cursor-pointer ${!isFiltered ? 'bg-indigo-600 text-white font-bold shadow' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}">
          #hepsi (${target.notesList.length})
        </button>
    `;

    Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([tag, count]) => {
        const active = isFiltered && _activeNoteFilterTag.toLowerCase() === tag;
        const colorClass = getTagColorClass(tag);
        html += `
          <button type="button" onclick="HubNotes.setTagFilter('${tag}')" class="px-2 py-0.5 rounded-md border transition cursor-pointer flex items-center gap-1 ${active ? 'bg-indigo-600 border-indigo-400 text-white font-bold shadow' : colorClass}">
            <span>${tag}</span>
            <span class="opacity-75 text-[9px]">(${count})</span>
          </button>
        `;
      });

    html += `</div>`;

    // If an active tag is selected, display related co-occurring tags
    if (isFiltered) {
      html += `
        <div class="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-[11px] space-y-1.5 animate-fadeIn">
          <div class="flex items-center justify-between gap-1 text-indigo-200">
            <span class="flex items-center gap-1 truncate font-semibold">
              <span>Seçili:</span> <strong class="text-white font-mono">${_activeNoteFilterTag}</strong>
            </span>
            <button type="button" onclick="HubNotes.setTagFilter('all')" class="text-indigo-400 hover:text-white text-xs px-1 font-bold cursor-pointer" title="Filtreyi Temizle">✕ Temizle</button>
          </div>
      `;

      if (relatedTags.length > 0) {
        html += `
          <div class="text-[10px] text-slate-400 font-medium">Birlikte Geçen Etiketler:</div>
          <div class="flex flex-wrap gap-1 text-[10px] font-mono">
        `;
        relatedTags.forEach(rt => {
          html += `
            <button type="button" onclick="HubNotes.setTagFilter('${rt.tag}')" class="px-1.5 py-0.5 rounded bg-slate-900/90 hover:bg-indigo-900 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1">
              <span>${rt.icon}</span>
              <span>${rt.tag}</span>
              <span class="text-indigo-300 font-bold">(${rt.count})</span>
            </button>
          `;
        });
        html += `</div>`;
      } else {
        html += `<div class="text-[10px] text-slate-500 italic">Bu etiketle birlikte geçen başka etiket yok.</div>`;
      }

      html += `</div>`;
    }

    barEl.innerHTML = html;
  }

  /**
   * Render SVG Mindmap Network Graph
   */
  function renderMindmap() {
    const svgEl = document.getElementById('hub-mindmap-svg');
    const statsBadge = document.getElementById('hub-mindmap-stats-badge');
    const selectedTitle = document.getElementById('hub-mindmap-selected-title');
    const selectedSub = document.getElementById('hub-mindmap-selected-sub');
    const matchingNotesEl = document.getElementById('hub-mindmap-matching-notes');
    const connectedTagsEl = document.getElementById('hub-mindmap-connected-tags');
    const aiBtn = document.getElementById('hub-mindmap-ai-btn');
    if (!svgEl) return;

    const target = getActiveNotesTarget();
    if (!target || !Array.isArray(target.notesList) || target.notesList.length === 0) {
      svgEl.innerHTML = `
        <text x="400" y="250" text-anchor="middle" fill="#64748b" font-size="14" font-family="sans-serif">
          Etiket haritası oluşturmak için henüz not bulunamadı.
        </text>`;
      if (statsBadge) statsBadge.textContent = '0 Düğüm • 0 Bağlantı';
      return;
    }

    // 1. Build Nodes & Co-occurrence Matrix
    const nodeMap = new Map();
    const edgeMap = new Map();

    target.notesList.forEach(n => {
      const tags = (n.tags && n.tags.length > 0 ? n.tags : extractTags(n.text || '')).map(t => t.toLowerCase());
      const uniqueInNote = Array.from(new Set(tags));

      uniqueInNote.forEach(t => {
        if (!nodeMap.has(t)) {
          nodeMap.set(t, {
            id: t,
            label: t,
            icon: getTagIcon(t),
            count: 0,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            radius: 20
          });
        }
        nodeMap.get(t).count++;
      });

      for (let i = 0; i < uniqueInNote.length; i++) {
        for (let j = i + 1; j < uniqueInNote.length; j++) {
          const t1 = uniqueInNote[i];
          const t2 = uniqueInNote[j];
          const edgeKey = t1 < t2 ? `${t1}|${t2}` : `${t2}|${t1}`;
          edgeMap.set(edgeKey, (edgeMap.get(edgeKey) || 0) + 1);
        }
      }
    });

    const nodes = Array.from(nodeMap.values());
    const edges = [];
    edgeMap.forEach((weight, key) => {
      const [source, target] = key.split('|');
      edges.push({ source, target, weight });
    });

    if (statsBadge) {
      statsBadge.textContent = `${nodes.length} Düğüm • ${edges.length} İlişki Bağlantısı`;
    }

    if (nodes.length === 0) {
      svgEl.innerHTML = `
        <text x="400" y="250" text-anchor="middle" fill="#64748b" font-size="14" font-family="sans-serif">
          Notlarınızda #etiket tespit edilemedi. Notlarınıza #gorev, #yer, #npc gibi etiketler ekleyin.
        </text>`;
      return;
    }

    // 2. Initialize Positions in Circle
    const width = 800;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxCount = Math.max(...nodes.map(n => n.count), 1);

    nodes.forEach((n, idx) => {
      const angle = (idx / nodes.length) * 2 * Math.PI;
      const radius = Math.min(180, 50 + nodes.length * 10);
      n.x = centerX + Math.cos(angle) * radius;
      n.y = centerY + Math.sin(angle) * radius;
      n.radius = Math.max(18, Math.min(36, 18 + (n.count / maxCount) * 16));
    });

    // 3. Fast iterative relaxation layout (Spring & Repulsion)
    const iterations = Math.min(70, Math.max(30, nodes.length * 3));
    for (let iter = 0; iter < iterations; iter++) {
      // Repulsion between all node pairs
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = n1.radius + n2.radius + 35;
          if (dist < minDist * 2.5) {
            const force = (minDist * minDist) / (dist * dist);
            const fx = (dx / dist) * force * 1.5;
            const fy = (dy / dist) * force * 1.5;
            n1.vx -= fx;
            n1.vy -= fy;
            n2.vx += fx;
            n2.vy += fy;
          }
        }
      }

      // Spring attraction along edges
      edges.forEach(e => {
        const n1 = nodeMap.get(e.source);
        const n2 = nodeMap.get(e.target);
        if (!n1 || !n2) return;
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const desiredDist = 90 / (Math.min(e.weight, 4) * 0.5 + 0.5);
        const force = (dist - desiredDist) * 0.05 * Math.min(e.weight, 3);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        n1.vx += fx;
        n1.vy += fy;
        n2.vx -= fx;
        n2.vy -= fy;
      });

      // Center gravity & Dampening
      nodes.forEach(n => {
        n.vx += (centerX - n.x) * 0.025;
        n.vy += (centerY - n.y) * 0.025;

        n.x += n.vx * 0.2;
        n.y += n.vy * 0.2;

        n.vx *= 0.65;
        n.vy *= 0.65;

        // Clamp to SVG bounds
        n.x = Math.max(n.radius + 20, Math.min(width - n.radius - 20, n.x));
        n.y = Math.max(n.radius + 20, Math.min(height - n.radius - 20, n.y));
      });
    }

    // 4. Render SVG
    const selected = _selectedMindmapTag ? _selectedMindmapTag.toLowerCase() : null;

    let svgHtml = `
      <defs>
        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#818cf8" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#4f46e5" stop-opacity="0"/>
        </radialGradient>
        <filter id="glowEffect" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <!-- Edges Layer -->
      <g id="mindmap-edges">
    `;

    edges.forEach(e => {
      const n1 = nodeMap.get(e.source);
      const n2 = nodeMap.get(e.target);
      if (!n1 || !n2) return;

      const isConnected = selected && (e.source === selected || e.target === selected);
      const strokeWidth = Math.min(6, 1.2 + e.weight * 1.2);
      const opacity = selected ? (isConnected ? '0.9' : '0.15') : '0.45';
      const strokeColor = isConnected ? '#818cf8' : '#334155';

      svgHtml += `
        <line x1="${n1.x.toFixed(1)}" y1="${n1.y.toFixed(1)}" x2="${n2.x.toFixed(1)}" y2="${n2.y.toFixed(1)}"
          stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-opacity="${opacity}" stroke-linecap="round"
          class="transition-all duration-200" />
      `;
    });

    svgHtml += `</g><!-- Nodes Layer --><g id="mindmap-nodes">`;

    nodes.forEach(n => {
      const isSelected = selected === n.id;
      const isNeighbor = selected && edges.some(e => (e.source === selected && e.target === n.id) || (e.target === selected && e.source === n.id));
      const opacity = selected ? (isSelected || isNeighbor ? '1' : '0.3') : '1';

      // Colors based on tag category
      let fill = '#1e1b4b'; // indigo
      let stroke = '#6366f1';
      let textColor = '#c7d2fe';

      if (n.id === '#gorev' || n.id === '#quest') { fill = '#082f49'; stroke = '#38bdf8'; textColor = '#bae6fd'; }
      else if (n.id === '#npc') { fill = '#3b0764'; stroke = '#c084fc'; textColor = '#f3e8ff'; }
      else if (n.id === '#yer' || n.id === '#mekan') { fill = '#022c22'; stroke = '#34d399'; textColor = '#d1fae5'; }
      else if (n.id === '#loot' || n.id === '#esya') { fill = '#451a03'; stroke = '#fbbf24'; textColor = '#fef3c7'; }
      else if (n.id === '#savas' || n.id === '#combat') { fill = '#4c0519'; stroke = '#fb7185'; textColor = '#ffe4e6'; }
      else if (n.id === '#ipucu' || n.id === '#sir') { fill = '#134e4a'; stroke = '#2dd4bf'; textColor = '#ccfbf1'; }

      svgHtml += `
        <g class="cursor-pointer transition-all duration-200" onclick="HubNotes.selectMindmapNode('${n.id}')" opacity="${opacity}">
          <!-- Glow Circle when selected -->
          ${isSelected ? `<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${(n.radius + 8).toFixed(1)}" fill="none" stroke="#a855f7" stroke-width="3" stroke-dasharray="4 2" class="animate-pulse" />` : ''}
          <circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${n.radius.toFixed(1)}" fill="${fill}" stroke="${stroke}" stroke-width="${isSelected ? '2.5' : '1.5'}" class="hover:stroke-white transition" />
          <text x="${n.x.toFixed(1)}" y="${(n.y - 2).toFixed(1)}" text-anchor="middle" font-size="12" fill="#ffffff">${n.icon}</text>
          <text x="${n.x.toFixed(1)}" y="${(n.y + 12).toFixed(1)}" text-anchor="middle" font-size="9" font-family="monospace" font-weight="bold" fill="${textColor}">${escapeHtml(n.label.slice(0, 11))}</text>
          <!-- Count badge -->
          <circle cx="${(n.x + n.radius - 3).toFixed(1)}" cy="${(n.y - n.radius + 3).toFixed(1)}" r="7.5" fill="#0f172a" stroke="${stroke}" stroke-width="1" />
          <text x="${(n.x + n.radius - 3).toFixed(1)}" y="${(n.y - n.radius + 6).toFixed(1)}" text-anchor="middle" font-size="8" font-family="monospace" font-weight="bold" fill="#ffffff">${n.count}</text>
        </g>
      `;
    });

    svgHtml += `</g>`;
    svgEl.innerHTML = svgHtml;

    // Update Drawer
    if (selected && nodeMap.has(selected)) {
      const activeNode = nodeMap.get(selected);
      if (selectedTitle) selectedTitle.textContent = `${activeNode.icon} ${activeNode.label} (${activeNode.count} Not)`;
      if (selectedSub) selectedSub.textContent = `Bu etiketle ilişkili notlar ve doğrudan bağlantılar:`;
      if (aiBtn) aiBtn.classList.remove('hidden');

      // Connected tags
      const connected = edges
        .filter(e => e.source === selected || e.target === selected)
        .map(e => {
          const otherId = e.source === selected ? e.target : e.source;
          return { id: otherId, weight: e.weight, node: nodeMap.get(otherId) };
        })
        .sort((a, b) => b.weight - a.weight);

      if (connectedTagsEl) {
        if (connected.length > 0) {
          connectedTagsEl.innerHTML = connected.map(c => `
            <button type="button" onclick="HubNotes.selectMindmapNode('${c.id}')" class="px-2 py-0.5 rounded-md bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 transition cursor-pointer flex items-center gap-1">
              <span>${c.node?.icon || '🏷️'}</span>
              <span>${c.id}</span>
              <span class="text-white font-bold">(${c.weight})</span>
            </button>
          `).join('');
        } else {
          connectedTagsEl.innerHTML = `<span class="text-slate-500 italic text-[10px]">Doğrudan bağlantılı başka etiket yok.</span>`;
        }
      }

      // Matching notes
      const matchingNotes = target.notesList.filter(n => {
        const tags = (n.tags && n.tags.length > 0 ? n.tags : extractTags(n.text || '')).map(t => t.toLowerCase());
        return tags.includes(selected);
      });

      if (matchingNotesEl) {
        matchingNotesEl.innerHTML = matchingNotes.map(n => `
          <div class="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 hover:border-indigo-500/50 transition">
            <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>${formatTimeAgo(n.updatedAt || n.createdAt)}</span>
              <button type="button" onclick="HubNotes.jumpToEditorWithNote('${n.id}')" class="px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-200 hover:text-white transition font-semibold cursor-pointer">
                📝 Düzenle
              </button>
            </div>
            <div class="text-xs text-slate-200 line-clamp-3 leading-snug">
              ${formatNoteTextHtml(n.text)}
            </div>
          </div>
        `).join('');
      }
    } else {
      if (selectedTitle) selectedTitle.textContent = `Etiket Haritası`;
      if (selectedSub) selectedSub.textContent = `Ağdaki herhangi bir düğüme tıklayarak ilişkili notları ve bağlantıları inceleyebilirsiniz.`;
      if (aiBtn) aiBtn.classList.add('hidden');
      if (connectedTagsEl) connectedTagsEl.innerHTML = '';
      if (matchingNotesEl) {
        matchingNotesEl.innerHTML = `
          <div class="p-6 text-center text-slate-500 text-xs italic">
            Bir düğüm seçildiğinde o etikete ait tüm mikro notlar burada listelenecektir.
          </div>`;
      }
    }
  }

  function selectMindmapNode(tagId) {
    _selectedMindmapTag = tagId;
    renderMindmap();
  }

  function handleMindmapSearch(val) {
    const q = (val || '').trim().toLowerCase();
    if (!q) {
      _selectedMindmapTag = null;
      renderMindmap();
      return;
    }
    const target = getActiveNotesTarget();
    if (!target) return;
    const allTags = getAllUniqueTagsWithCounts().map(t => t.tag.toLowerCase());
    const matched = allTags.find(t => t.includes(q));
    if (matched) {
      _selectedMindmapTag = matched;
      renderMindmap();
    }
  }

  function jumpToEditorWithNote(noteId) {
    switchModalView('editor');
    _selectedModalNoteId = noteId;
    renderFullNotesModalList();
    loadSelectedNoteIntoEditor();
  }

  // =========================================================================
  // STAGE 3: AI CAMPAIGN CHRONICLER (NARRATIVE JOURNAL, QUESTS, NPCS, LOOT)
  // =========================================================================

  function renderAiChroniclerView() {
    const scopeTagSelect = document.getElementById('hub-ai-tag-select');
    const target = getActiveNotesTarget();
    if (!scopeTagSelect || !target) return;

    // Populate tag select
    const tags = new Set();
    (target.notesList || []).forEach(n => {
      const tList = n.tags && n.tags.length > 0 ? n.tags : extractTags(n.text || '');
      tList.forEach(t => tags.add(t));
    });

    scopeTagSelect.innerHTML = Array.from(tags).map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
  }

  function openAiChroniclerWithTag(tag) {
    switchModalView('ai');
    const scopeSelect = document.getElementById('hub-ai-scope-select');
    const tagPicker = document.getElementById('hub-ai-scope-tag-picker');
    const tagSelect = document.getElementById('hub-ai-tag-select');

    if (scopeSelect && tag) {
      scopeSelect.value = 'tag';
      if (tagPicker) tagPicker.classList.remove('hidden');
      if (tagSelect) tagSelect.value = tag;
    }
  }

  function openAiChroniclerWithMindmapTag() {
    if (_selectedMindmapTag) {
      openAiChroniclerWithTag(_selectedMindmapTag);
    } else {
      switchModalView('ai');
    }
  }

  function openAiChroniclerWithActiveNote() {
    switchModalView('ai');
  }

  /**
   * Simple and fast Markdown renderer for AI generated synthesis
   */
  function renderMarkdownToHtml(md) {
    if (!md) return '';
    let html = escapeHtml(md);

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-indigo-300 mt-3 mb-1 border-b border-indigo-900/60 pb-1">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-amber-300 mt-4 mb-2 border-b border-slate-700 pb-1">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-lg font-black text-white mt-4 mb-2 pb-1 border-b border-slate-700">$1</h1>');

    // Bold & Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="text-slate-300 italic">$1</em>');

    // Task list items
    html = html.replace(/^- \[ \] (.*$)/gim, '<div class="flex items-start gap-2 text-xs py-0.5"><span class="text-slate-500 font-mono">☐</span> <span>$1</span></div>');
    html = html.replace(/^- \[x\] (.*$)/gim, '<div class="flex items-start gap-2 text-xs py-0.5 text-emerald-400 line-through opacity-80"><span class="text-emerald-400 font-mono">☑</span> <span>$1</span></div>');

    // Bullet points
    html = html.replace(/^[*-] (.*$)/gim, '<li class="ml-4 list-disc text-xs text-slate-300 py-0.5">$1</li>');

    // Blockquote
    html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-2 border-indigo-500 pl-3 py-1 my-1.5 text-xs italic text-indigo-200 bg-indigo-950/30 rounded-r-lg">$1</blockquote>');

    // Paragraph linebreaks
    html = html.replace(/\n\n/g, '<div class="h-2"></div>');

    // Tags
    html = html.replace(TAG_REGEX, (match) => {
      const colorClass = getTagColorClass(match);
      return `<span class="inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border ${colorClass}">${match}</span>`;
    });

    return html;
  }

  async function callGeminiForNotes({ systemPrompt, userPrompt, onProgress }) {
    let apiKey = localStorage.getItem('gemini_api_key') || (window.RuleMaster && typeof window.RuleMaster.getApiKey === 'function' ? window.RuleMaster.getApiKey() : '');
    if (!apiKey) {
      apiKey = prompt('⚡ AI Not Sentezleyici için Google AI Studio Gemini API Anahtarınızı girin:\n(Anahtarınız sadece tarayıcınızda yerel olarak saklanır)');
      if (!apiKey || !apiKey.trim()) throw new Error('API anahtarı girilmedi.');
      apiKey = apiKey.trim();
      localStorage.setItem('gemini_api_key', apiKey);
      if (window.RuleMaster && typeof window.RuleMaster.setApiKey === 'function') {
        window.RuleMaster.setApiKey(apiKey);
      }
    }

    const models = ['gemini-flash-lite-latest', 'gemini-flash-latest'];
    let lastErr = null;

    for (const model of models) {
      try {
        if (typeof onProgress === 'function') onProgress(`Rule Master AI modeline bağlanılıyor (${model})...`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
              temperature: 0.3
            }
          })
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error?.message || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (rawText.trim()) return rawText.trim();
      } catch (e) {
        lastErr = e;
        console.warn(`Model ${model} failed:`, e);
      }
    }

    throw lastErr || new Error('Gemini API yanıt vermedi.');
  }

  /**
   * Run AI Synthesis on the selected notes
   */
  async function runAiChronicler() {
    const target = getActiveNotesTarget();
    if (!target || !Array.isArray(target.notesList) || target.notesList.length === 0) {
      alert('Sentezlenecek not bulunamadı. Lütfen önce birkaç not ekleyin.');
      return;
    }

    const scopeSelect = document.getElementById('hub-ai-scope-select');
    const tagSelect = document.getElementById('hub-ai-tag-select');
    const modeRadios = document.querySelectorAll('input[name="hub-ai-mode"]');
    const runBtn = document.getElementById('hub-ai-run-btn');
    const statusBadge = document.getElementById('hub-ai-status-badge');
    const resultContainer = document.getElementById('hub-ai-result-container');
    const outputActions = document.getElementById('hub-ai-output-actions');

    let selectedMode = 'narrative';
    modeRadios.forEach(r => { if (r.checked) selectedMode = r.value; });

    // Filter notes based on scope
    const scope = scopeSelect ? scopeSelect.value : 'all';
    let sourceNotes = [...target.notesList];

    if (scope === 'tag' && tagSelect && tagSelect.value) {
      const t = tagSelect.value.toLowerCase();
      sourceNotes = sourceNotes.filter(n => {
        const tags = (n.tags && n.tags.length > 0 ? n.tags : extractTags(n.text || '')).map(x => x.toLowerCase());
        return tags.includes(t);
      });
    } else if (scope === 'recent5') {
      sourceNotes = sourceNotes.slice(0, 5);
    } else if (scope === 'recent10') {
      sourceNotes = sourceNotes.slice(0, 10);
    }

    if (sourceNotes.length === 0) {
      alert('Seçilen kapsama uygun not bulunamadı.');
      return;
    }

    // Prepare Notes Corpus
    const notesCorpus = sourceNotes.map((n, idx) => {
      const dateStr = new Date(n.updatedAt || n.createdAt).toLocaleString('tr-TR');
      return `--- NOT ${idx + 1} (${dateStr}) ---\n${n.text}`;
    }).join('\n\n');

    // Build Prompts based on Mode
    let systemPrompt = '';
    let userPrompt = '';

    if (selectedMode === 'narrative') {
      systemPrompt = `Sen usta bir D&D 3.5e fantezi masaüstü rol yapma oyunu vakanüvisisin (kampanya kronikçisisin).
GÖREV: Kullanıcının kısa, parça parça ve dağınık tutulmuş oyuncu/DM notlarını oku. Bu notları bir araya getirerek akıcı, sürükleyici, edebi ve atmosferik bir Türkçe Masaüstü Rol Yapma Oturum Hikayesi / Sefer Günlüğü bölümü haline getir.
KURALLAR:
1. Türkçe yaz. Karakter adlarını, mekanları, kritik olayları ve dövüş detaylarını doğru şekilde yansıt.
2. Anlatı tarzı sürükleyici, fantezi edebiyatı tadında olsun (ör. "Alden ve yoldaşları zindanın nemli dehlizlerine adım attıklarında...").
3. Bölüm başlıkları (##), önemli anlar ve sonuçları yapılandırılmış Markdown formatında ver.
4. Sıradan tavla zarı emojisi KESİNLİKLE KULLANMA.`;
      userPrompt = `Aşağıdaki D&D 3.5e kampanya notlarını edebi bir oturum günlüğüne dönüştür:\n\n${notesCorpus}`;
    } else if (selectedMode === 'quests') {
      systemPrompt = `Sen uzman bir D&D 3.5e DM asistanı ve görev takipçisisin.
GÖREV: Aşağıdaki ham kampanya notlarını analiz et ve yapılandırılmış bir "Görev & İpuçları Takip Dosyası" (Quest & Clues Dossier) hazırla.
KURALLAR:
1. Türkçe yaz.
2. Başlıklar:
   - ## 🎯 Aktif Görevler & Hedefler (maddeler halinde ve - [ ] görev kutusu ile)
   - ## ✅ Tamamlanan Görevler (tamamlanan başarılar)
   - ## 🔍 Toplanan İpuçları & Gizemler (çözülmemiş ipuçları, şüpheler)
   - ## ⚠️ Acil Tehditler & Tehlikeler
3. Sıradan tavla zarı emojisi KESİNLİKLE KULLANMA.`;
      userPrompt = `Aşağıdaki D&D 3.5e notlarını analiz edip görev ve ipucu takip dosyası çıkar:\n\n${notesCorpus}`;
    } else if (selectedMode === 'dramatis') {
      systemPrompt = `Sen bir D&D 3.5e Lore & NPC arşivcisisin.
GÖREV: Aşağıdaki notlarda geçen tüm karakterleri (NPC), loncaları/fraksiyonları ve mekanları (şehir, han, zindan) tespit et.
KURALLAR:
1. Türkçe yaz.
2. Başlıklar:
   - ## 👤 Önemli Karakterler & NPC'ler (İsim, bilinen rol, dost/düşman durumu, son durum)
   - ## 🗺️ Ziyaret Edilen Mekanlar & Konumlar (Mekan adı, özellikleri, yaşanan olaylar)
   - ## 🛡️ Fraksiyonlar & İttifaklar
3. Sıradan tavla zarı emojisi KESİNLİKLE KULLANMA.`;
      userPrompt = `Aşağıdaki D&D 3.5e notlarından NPC ve Mekan dökümü hazırla:\n\n${notesCorpus}`;
    } else if (selectedMode === 'loot') {
      systemPrompt = `Sen bir D&D 3.5e envanter ve hazine uzmanısın.
GÖREV: Notlarda geçen tüm ganimetleri, büyülü eşyaları, altın/para miktarlarını ve envanter değişimlerini derle.
KURALLAR:
1. Türkçe yaz.
2. Başlıklar:
   - ## 💎 Büyülü & Özel Eşyalar
   - ## 💰 Hazine, Altın & Mücevherat
   - ## ⚔️ Silahlar, Zırhlar & Tüketilebilirler (İksir, Parşömen vb.)
3. Sıradan tavla zarı emojisi KESİNLİKLE KULLANMA.`;
      userPrompt = `Aşağıdaki D&D 3.5e notlarından eşya ve hazine envanteri çıkar:\n\n${notesCorpus}`;
    }

    try {
      if (runBtn) {
        runBtn.disabled = true;
        runBtn.classList.add('opacity-50', 'pointer-events-none');
        runBtn.innerHTML = `<span>⏳</span> <span>AI Notları Sentezliyor...</span>`;
      }
      if (statusBadge) {
        statusBadge.innerHTML = `<span class="text-amber-400 animate-pulse">⚡ Analiz Ediliyor...</span>`;
      }
      if (resultContainer) {
        resultContainer.innerHTML = `
          <div class="h-full flex flex-col items-center justify-center text-center gap-3 py-16">
            <div class="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="font-bold text-white text-xs">Rule Master AI notlarınızı analiz ediyor...</p>
            <p class="text-[10px] text-slate-400 font-mono">D&D 3.5e kuralları ve kronik yapısı doğrulanıyor</p>
          </div>
        `;
      }

      const generated = await callGeminiForNotes({
        systemPrompt,
        userPrompt,
        onProgress: (msg) => {
          if (statusBadge) statusBadge.innerHTML = `<span class="text-indigo-400 animate-pulse">${escapeHtml(msg)}</span>`;
        }
      });

      _lastAiGeneratedText = generated;

      if (statusBadge) {
        statusBadge.innerHTML = `<span class="text-emerald-400 font-bold">✓ Sentez Tamamlandı</span>`;
      }
      if (resultContainer) {
        resultContainer.innerHTML = renderMarkdownToHtml(generated);
      }
      if (outputActions) {
        outputActions.classList.remove('hidden');
      }

    } catch (err) {
      console.error('AI Chronicler Hatası:', err);
      if (statusBadge) {
        statusBadge.innerHTML = `<span class="text-rose-400 font-bold">⚠️ Hata</span>`;
      }
      if (resultContainer) {
        resultContainer.innerHTML = `
          <div class="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl text-rose-200 text-xs space-y-2">
            <div class="font-bold flex items-center gap-1.5"><span>❌</span> <span>AI Sentezleme Hatası</span></div>
            <p>${escapeHtml(err.message || 'Gemini servisine ulaşılamadı.')}</p>
            <p class="text-[10px] text-slate-400">Google Gemini API anahtarınızı Sistem Ayarları'ndan kontrol edebilirsiniz.</p>
          </div>
        `;
      }
    } finally {
      if (runBtn) {
        runBtn.disabled = false;
        runBtn.classList.remove('opacity-50', 'pointer-events-none');
        runBtn.innerHTML = `<span>✨</span> <span>Notları Sentezle &amp; Oluştur</span>`;
      }
    }
  }

  /**
   * Save the AI generated synthesis as a pinned master note
   */
  function saveAiSynthesisAsNote() {
    if (!_lastAiGeneratedText) return;
    const target = getActiveNotesTarget();
    if (!target) return;

    const now = new Date();
    const monthsTr = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const dateTag = `#${now.getDate()}_${monthsTr[now.getMonth()]}_${now.getFullYear()}`;

    const newNote = {
      id: 'note_ai_' + Date.now(),
      text: `#kronik #ai_ozet ${dateTag}\n\n${_lastAiGeneratedText}`,
      pinned: true,
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: extractTags(`#kronik #ai_ozet ${dateTag}\n\n${_lastAiGeneratedText}`)
    };

    target.notesList.unshift(newNote);
    if (target.targetObj) {
      target.targetObj.notesList = target.notesList;
      target.targetObj.notes = target.notesList.map(n => n.text).join('\n\n');
    }
    saveNotesChanges(target);

    renderFullNotesModalList();
    renderInlineNotes();

    alert('✅ AI Sentezi başarıyla yeni bir sabitlenmiş not olarak kaydedildi!');
    switchModalView('editor');
    _selectedModalNoteId = newNote.id;
    loadSelectedNoteIntoEditor();
  }

  function copyAiSynthesisToClipboard() {
    if (!_lastAiGeneratedText) return;
    navigator.clipboard.writeText(_lastAiGeneratedText).then(() => {
      alert('📋 AI Sentez metni panoya kopyalandı!');
    }).catch(() => {
      alert('Metin kopyalanamadı.');
    });
  }

  function switchModalView(view) {
    _activeModalView = view;

    const tabEditor = document.getElementById('hub-modal-tab-editor');
    const tabMindmap = document.getElementById('hub-modal-tab-mindmap');
    const tabAi = document.getElementById('hub-modal-tab-ai');

    const viewEditor = document.getElementById('hub-modal-view-editor');
    const viewMindmap = document.getElementById('hub-modal-view-mindmap');
    const viewAi = document.getElementById('hub-modal-view-ai');

    // Reset tab styles
    [tabEditor, tabMindmap, tabAi].forEach(btn => {
      if (btn) btn.className = 'px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 text-slate-400 hover:text-white cursor-pointer';
    });

    if (view === 'editor') {
      if (tabEditor) tabEditor.className = 'px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 bg-indigo-600 text-white shadow cursor-pointer';
      if (viewEditor) viewEditor.classList.remove('hidden');
      if (viewMindmap) viewMindmap.classList.add('hidden');
      if (viewAi) viewAi.classList.add('hidden');
      renderFullNotesModalList();
      loadSelectedNoteIntoEditor();
    } else if (view === 'mindmap') {
      if (tabMindmap) tabMindmap.className = 'px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 bg-indigo-600 text-white shadow cursor-pointer';
      if (viewEditor) viewEditor.classList.add('hidden');
      if (viewMindmap) viewMindmap.classList.remove('hidden');
      if (viewAi) viewAi.classList.add('hidden');
      renderMindmap();
    } else if (view === 'ai') {
      if (tabAi) tabAi.className = 'px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 bg-indigo-600 text-white shadow cursor-pointer';
      if (viewEditor) viewEditor.classList.add('hidden');
      if (viewMindmap) viewMindmap.classList.add('hidden');
      if (viewAi) viewAi.classList.remove('hidden');
      renderAiChroniclerView();
    }
  }

  // =========================================================================
  // MODAL LIST & EDITOR LOADERS
  // =========================================================================

  /**
   * Render Note List inside Full Modal
   */
  function renderFullNotesModalList() {
    const listEl = document.getElementById('hub-modal-notes-list');
    if (!listEl) return;

    const state = getHubState();
    const target = getActiveNotesTarget();
    updateModalTargetSelector(target);
    renderModalTagsBar(target);

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
    saveModalNote(false);
    _selectedModalNoteId = noteId;
    renderFullNotesModalList();
    loadSelectedNoteIntoEditor();
  }

  function loadSelectedNoteIntoEditor() {
    const editor = document.getElementById('hub-modal-note-editor');
    const pinBtn = document.getElementById('hub-modal-pin-btn');
    const deleteBtn = document.getElementById('hub-modal-delete-btn');
    const saveBtn = document.getElementById('hub-modal-save-btn');
    const dateBadge = document.getElementById('hub-modal-date-badge');
    if (!editor) return;

    const target = getActiveNotesTarget();
    if (!target) {
      editor.value = '';
      editor.placeholder = 'Düzenlemek için sol listeden bir not seçin veya yeni not oluşturun.';
      editor.disabled = true;
      if (pinBtn) pinBtn.classList.add('opacity-40', 'pointer-events-none');
      if (deleteBtn) deleteBtn.classList.add('opacity-40', 'pointer-events-none');
      if (saveBtn) saveBtn.classList.add('opacity-40', 'pointer-events-none');
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
      if (saveBtn) saveBtn.classList.add('opacity-40', 'pointer-events-none');
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

    if (deleteBtn) deleteBtn.classList.remove('opacity-40', 'pointer-events-none');
    if (saveBtn) saveBtn.classList.remove('opacity-40', 'pointer-events-none');
  }

  let _editorDebounceTimer = null;

  function handleEditorInput(event) {
    const editor = document.getElementById('hub-modal-note-editor');
    if (!editor || !_selectedModalNoteId) return;

    checkAutocomplete(editor);

    const target = getActiveNotesTarget();
    if (!target) return;

    const note = target.notesList.find(n => n.id === _selectedModalNoteId);
    if (!note) return;

    note.text = editor.value;
    note.tags = extractTags(editor.value);
    note.updatedAt = Date.now();

    if (target.targetObj) {
      target.targetObj.notesList = target.notesList;
    }

    clearTimeout(_editorDebounceTimer);
    _editorDebounceTimer = setTimeout(() => {
      saveModalNote(false);
    }, 1000);
  }

  function handleEditorKeydown(e) {
    const editor = document.getElementById('hub-modal-note-editor');
    if (handleAutocompleteKeydown(editor, e)) {
      return;
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'Enter')) {
      e.preventDefault();
      saveModalNote(true);
    }
  }

  function handleQuickInput(event) {
    const input = document.getElementById('hub-quick-note-input');
    if (input) {
      checkAutocomplete(input);
    }
  }

  function handleQuickKeydown(e) {
    const input = document.getElementById('hub-quick-note-input');
    if (handleAutocompleteKeydown(input, e)) {
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      addQuickNote();
    }
  }

  /**
   * Modal Notunu Kalıcı Olarak Kaydet
   */
  function saveModalNote(showToast = true) {
    clearTimeout(_editorDebounceTimer);
    const editor = document.getElementById('hub-modal-note-editor');
    if (!editor) return;

    const target = getActiveNotesTarget();
    if (!target) return;

    let note = target.notesList.find(n => n.id === _selectedModalNoteId);
    if (!note) {
      if (target.notesList.length > 0) {
        note = target.notesList[0];
        _selectedModalNoteId = note.id;
      } else {
        return;
      }
    }

    note.text = editor.value;
    note.tags = extractTags(editor.value);
    note.updatedAt = Date.now();

    if (target.targetObj) {
      target.targetObj.notesList = target.notesList;
      target.targetObj.notes = target.notesList.map(n => n.text).join('\n\n');
    }

    saveNotesChanges(target);
    renderFullNotesModalList();
    renderInlineNotes();

    const dateBadge = document.getElementById('hub-modal-date-badge');
    const saveBtn = document.getElementById('hub-modal-save-btn');
    const saveText = document.getElementById('hub-modal-save-text');

    if (dateBadge) {
      const state = getHubState();
      const dName = getTargetDisplayName(target, state);
      dateBadge.textContent = `${dName} • Son Güncelleme: ${new Date(note.updatedAt).toLocaleString('tr-TR')}`;
    }

    if (showToast && saveBtn && saveText) {
      const originalText = saveText.textContent;
      saveBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition bg-emerald-500 text-white shadow-md shadow-emerald-900/50 flex items-center gap-1.5 cursor-pointer';
      saveText.textContent = 'Kaydedildi! ✓';
      setTimeout(() => {
        if (saveBtn && saveText) {
          saveBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 flex items-center gap-1.5 cursor-pointer active:scale-95';
          saveText.textContent = originalText;
        }
      }, 1500);
    }
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
    saveModalNote(false);
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
    switchModalView('editor');
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
    handleEditorKeydown,
    handleQuickInput,
    handleQuickKeydown,
    saveModalNote,
    insertTagIntoEditor,
    createNewModalNote,
    setTargetOverride,
    setTagFilter,
    handleSearchInput,
    selectAutocompleteTag,
    switchModalView,
    renderMindmap,
    selectMindmapNode,
    handleMindmapSearch,
    jumpToEditorWithNote,
    openAiChroniclerWithTag,
    openAiChroniclerWithMindmapTag,
    openAiChroniclerWithActiveNote,
    runAiChronicler,
    saveAiSynthesisAsNote,
    copyAiSynthesisToClipboard
  };

  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      try {
        const savedTab = localStorage.getItem('hub_notes_panel_tab');
        if (savedTab) switchPanelTab(savedTab);
      } catch (e) {}
      renderInlineNotes();

      // Attach scope change listener for AI Chronicler
      const aiScope = document.getElementById('hub-ai-scope-select');
      const aiTagPicker = document.getElementById('hub-ai-scope-tag-picker');
      if (aiScope && aiTagPicker) {
        aiScope.addEventListener('change', () => {
          if (aiScope.value === 'tag') {
            aiTagPicker.classList.remove('hidden');
          } else {
            aiTagPicker.classList.add('hidden');
          }
        });
      }
    }, 150);
  });

})();