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

  // Tag extraction regex supporting Turkish and international unicode characters
  const TAG_REGEX = /#[\w\u00C0-\u024F\u1E00-\u1EFFğüşıöçĞÜŞİÖÇ]+/gi;

  function extractTags(text) {
    if (!text || typeof text !== 'string') return [];
    const matches = text.match(TAG_REGEX);
    if (!matches) return [];
    return Array.from(new Set(matches.map(t => t.toLowerCase())));
  }

  function getHubState() {
    if (window.state && Array.isArray(window.state.campaigns)) {
      return window.state;
    }
    return null;
  }

  /**
   * Determine active notes target:
   * 1. If active campaign is DM Mode: Campaign notes
   * 2. If active campaign is not DM Mode: Active character in that campaign
   * 3. Fallback: First available character or default campaign
   */
  function getActiveNotesTarget() {
    const state = getHubState();
    if (!state) return null;

    const activeCampId = state.activeCampaignId;
    const activeCamp = state.campaigns.find(c => c.id === activeCampId);

    // 1. DM Kampanyası
    if (activeCamp && activeCamp.isDmMode) {
      if (!Array.isArray(activeCamp.notesList)) {
        activeCamp.notesList = normalizeLegacyNotes(activeCamp.notes);
      }
      return {
        type: 'campaign',
        id: activeCamp.id,
        name: activeCamp.name || 'Ana Kampanya',
        isDm: true,
        titleBadge: '👑 DM Notları (Gizli)',
        targetObj: activeCamp,
        notesList: activeCamp.notesList
      };
    }

    // 2. Oyuncu Kampanyası: Bu kampanyaya bağlı oyuncu karakterini bul
    if (activeCamp && !activeCamp.isDmMode) {
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
        name: activeCamp.name || 'Kampanya',
        isDm: false,
        titleBadge: '🏰 Sefer Notları',
        targetObj: activeCamp,
        notesList: activeCamp.notesList
      };
    }

    // 3. Genel ('all') sekmesinde ilk karakter veya ilk kampanya
    const firstChar = state.characters && state.characters[0];
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

    return null;
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

    // 1. HUB State Depolaması
    if (state && typeof window.saveHubStorage === 'function') {
      window.saveHubStorage();
    }

    // 2. Karakter ise dnd35_character ile Çapraz Senkronizasyon (Kural #6)
    if (target.type === 'character' && target.targetObj) {
      try {
        const charRaw = localStorage.getItem('dnd35_character');
        if (charRaw) {
          const activeChar = JSON.parse(charRaw);
          if (activeChar && (activeChar.id === target.id || activeChar.name === target.name)) {
            activeChar.notesList = target.notesList;
            activeChar.notes = target.notesList.map(n => n.text).join('\n\n');
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
    if (event) event.stopPropagation();
    const actualId = noteId || _selectedModalNoteId;
    if (!actualId) return;

    if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;

    const target = getActiveNotesTarget();
    if (!target) return;

    target.notesList = target.notesList.filter(n => n.id !== actualId);
    saveNotesChanges(target);

    if (_selectedModalNoteId === actualId) {
      _selectedModalNoteId = target.notesList.length > 0 ? target.notesList[0].id : null;
    }

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

  /**
   * Render Note List inside Full Modal
   */
  function renderFullNotesModalList() {
    const listEl = document.getElementById('hub-modal-notes-list');
    const titleEl = document.getElementById('hub-modal-target-title');
    if (!listEl) return;

    const target = getActiveNotesTarget();
    if (!target) {
      listEl.innerHTML = `<div class="p-4 text-slate-500 text-xs italic">Aktif hedef bulunamadı.</div>`;
      return;
    }

    if (titleEl) {
      titleEl.textContent = `${target.name} • ${target.titleBadge}`;
    }

    const sorted = sortNotes(target.notesList);
    const filtered = filterNotes(sorted);

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="p-6 text-center text-slate-500 text-xs">Aramaya uygun not bulunamadı.</div>`;
      return;
    }

    let html = '';
    filtered.forEach(note => {
      const isSelected = note.id === _selectedModalNoteId;
      const isPinned = Boolean(note.pinned);
      const isCompleted = Boolean(note.completed);

      html += `
        <div onclick="HubNotes.selectNoteInModal('${note.id}')" class="p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${isSelected ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md' : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'}">
          <div class="flex items-center justify-between gap-1.5">
            <div class="flex items-center gap-1.5 min-w-0">
              ${isPinned ? '<span class="text-amber-400 text-xs shrink-0" title="Başa Sabitlendi">📌</span>' : ''}
              <span class="text-xs font-bold truncate">${escapeHtml(note.text.slice(0, 30)) || 'Boş Not'}</span>
            </div>
            <span class="text-[9px] text-slate-500 font-mono shrink-0">${formatTimeAgo(note.updatedAt || note.createdAt)}</span>
          </div>
          <div class="text-[11px] text-slate-400 line-clamp-1 break-words">
            ${escapeHtml(note.text.slice(0, 70))}
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
    if (!target || !_selectedModalNoteId) {
      editor.value = '';
      editor.placeholder = 'Düzenlemek için sol listeden bir not seçin veya yeni not oluşturun.';
      editor.disabled = true;
      if (pinBtn) pinBtn.classList.add('opacity-40', 'pointer-events-none');
      if (deleteBtn) deleteBtn.classList.add('opacity-40', 'pointer-events-none');
      if (dateBadge) dateBadge.textContent = '-';
      return;
    }

    const note = target.notesList.find(n => n.id === _selectedModalNoteId);
    if (!note) {
      editor.value = '';
      editor.disabled = true;
      return;
    }

    editor.disabled = false;
    editor.value = note.text || '';
    if (dateBadge) {
      dateBadge.textContent = `Son Güncelleme: ${new Date(note.updatedAt || note.createdAt).toLocaleString('tr-TR')}`;
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

  function createNewModalNote() {
    const target = getActiveNotesTarget();
    if (!target) {
      alert('Lütfen önce bir kampanya veya karakter seçin.');
      return;
    }

    const newNote = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      text: '',
      pinned: false,
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: []
    };

    target.notesList.unshift(newNote);
    saveNotesChanges(target);

    _selectedModalNoteId = newNote.id;
    renderFullNotesModalList();
    loadSelectedNoteIntoEditor();

    const editor = document.getElementById('hub-modal-note-editor');
    if (editor) editor.focus();
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
