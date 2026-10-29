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
    { tag: '#quest', icon: '⚔️', label: 'Quest & Objective' },
    { tag: '#npc', icon: '👤', label: 'Character / NPC' },
    { tag: '#location', icon: '🗺️', label: 'Location & Landmark' },
    { tag: '#loot', icon: '💎', label: 'Loot & Treasure' },
    { tag: '#clue', icon: '🔍', label: 'Clue & Mystery' },
    { tag: '#combat', icon: '⚡', label: 'Combat & Encounter' },
    { tag: '#lore', icon: '📜', label: 'Lore & Knowledge' },
    { tag: '#pact', icon: '🤝', label: 'Pact & Alliance' }
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
    if (l === '#location' || l === '#place' || l === '#yer' || l === '#mekan' || l === '#sehir' || l === '#zindan') return '🗺️';
    if (l === '#loot' || l === '#esya' || l === '#hazine' || l === '#altin') return '💎';
    if (l === '#ipucu' || l === '#sir' || l === '#clue') return '🔍';
    if (l === '#savas' || l === '#combat') return '⚡';
    if (l === '#bilgi' || l === '#lore') return '📜';
    if (l === '#pact' || l === '#alliance' || l === '#anlasma' || l === '#ittifak') return '🤝';
    if (l.startsWith('#lvl') || l.startsWith('#level')) return '⭐';
    if (l.includes('202') || l.includes('ocak') || l.includes('şubat') || l.includes('mart') || l.includes('nisan') || l.includes('mayıs') || l.includes('haziran') || l.includes('temmuz') || l.includes('ağustos') || l.includes('eylül') || l.includes('ekim') || l.includes('kasım') || l.includes('aralık')) return '📅';
    return '🏷️';
  }

  function getTagColorClass(tag) {
    if (!tag) return 'text-indigo-300 bg-indigo-950/40 border-indigo-500/30';
    const l = tag.toLowerCase();
    if (l === '#gorev' || l === '#quest') return 'text-sky-400 bg-sky-950/40 border-sky-500/30';
    if (l === '#npc') return 'text-purple-400 bg-purple-950/40 border-purple-500/30';
    if (l === '#location' || l === '#place' || l === '#yer' || l === '#mekan' || l === '#sehir') return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
    if (l === '#loot' || l === '#esya' || l === '#altin') return 'text-yellow-400 bg-yellow-950/40 border-yellow-500/30';
    if (l === '#clue' || l === '#ipucu' || l === '#sir') return 'text-teal-400 bg-teal-950/40 border-teal-500/30';
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
    if (!camp) return 'Campaign';
    if (!state || !Array.isArray(state.campaigns)) return camp.name || 'Campaign';

    if (camp.parentId) {
      const parentCamp = state.campaigns.find(c => c.id === camp.parentId);
      if (parentCamp) {
        return `${parentCamp.name} › ${camp.name}`;
      }
    }
    return camp.name || 'Campaign';
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
          return `${campHName} › 👤 ${char.name || 'Character'}`;
        }
      }
      return `👤 ${char?.name || target.name || 'Character'}`;
    }
    return target.name || 'Not Defteri';
  }

  /**
   * Resolve standalone Character Sheet instance when running inside index.html
   */
  function getStandaloneCharacterInstance() {
    if (typeof window.getHubState === 'function') return null; // Running inside hub.html
    if (window.character && typeof window.character === 'object') return window.character;
    try {
      if (typeof character !== 'undefined' && character && typeof character === 'object') return character;
    } catch (e) {}
    return null;
  }

  /**
   * Ensure a character or campaign object has synchronized V2 `smartNotes` & `notesList` arrays,
   * migrating legacy plain-text `notes` if needed.
   */
  function ensureSmartNotesArray(obj) {
    if (!obj || typeof obj !== 'object') return [];
    let list = Array.isArray(obj.smartNotes) && obj.smartNotes.length > 0
      ? obj.smartNotes
      : (Array.isArray(obj.notesList) && obj.notesList.length > 0 ? obj.notesList : null);

    if (!list && obj.fullData && typeof obj.fullData === 'object') {
      list = Array.isArray(obj.fullData.smartNotes) && obj.fullData.smartNotes.length > 0
        ? obj.fullData.smartNotes
        : (Array.isArray(obj.fullData.notesList) && obj.fullData.notesList.length > 0 ? obj.fullData.notesList : null);
    }

    if (!list) {
      const rawText = obj.notes || (obj.fullData && obj.fullData.notes) || '';
      list = normalizeLegacyNotes(rawText);
    }

    obj.smartNotes = list;
    obj.notesList = list;
    if (obj.fullData && typeof obj.fullData === 'object') {
      obj.fullData.smartNotes = list;
      obj.fullData.notesList = list;
    }
    return list;
  }

  /**
   * Determine active notes target:
   * -1. Standalone Character Sheet (`index.html`) active character (unless overridden in modal)
   * 0. User override (if selected via modal dropdown)
   * 1. If in unassigned tab: unassigned character or first character
   * 2. If active campaign is DM Mode: Campaign notes
   * 3. If active campaign is player campaign: Character notes in that campaign (or campaign notes)
   * 4. If all/fallback: First character or first campaign
   * 5. Safe creation fallback: Ensures notes can ALWAYS be written
   */
  function resolveStandaloneHubChar(standaloneChar, state) {
    if (!standaloneChar || !state || !Array.isArray(state.characters)) return null;
    let urlId = null;
    try {
      urlId = new URLSearchParams(window.location.search).get('id') || localStorage.getItem('dnd35_active_character_id');
    } catch (e) {}
    const charHubId = standaloneChar._hubId || standaloneChar.id || urlId;
    const charNameLower = (standaloneChar.name || '').trim().toLowerCase();
    return state.characters.find(c =>
      (charHubId && c.id === charHubId) ||
      (standaloneChar.id && c.id === standaloneChar.id) ||
      (charNameLower && (c.name || '').trim().toLowerCase() === charNameLower)
    ) || null;
  }

  function reconcileCharacterAndHubNotes(standaloneChar, hubMatch) {
    const charList = ensureSmartNotesArray(standaloneChar);
    if (!hubMatch) return charList;
    const hubList = ensureSmartNotesArray(hubMatch);

    const charTs = Number(standaloneChar._notesUpdatedAt || 0);
    const hubTs = Number(hubMatch._notesUpdatedAt || hubMatch.fullData?._notesUpdatedAt || 0);

    let resolved = charList;
    if (hubTs > charTs) {
      resolved = hubList;
    } else if (charTs > hubTs) {
      resolved = charList;
    } else if (hubList.length > 0 && charList.length === 0) {
      resolved = hubList;
    } else if (charList.length > 0 && hubList.length === 0) {
      resolved = charList;
    } else if (hubList.length > 0 && charList.length > 0) {
      const mergedMap = new Map();
      [...charList, ...hubList].forEach(n => {
        if (!n || !n.id) return;
        const prev = mergedMap.get(n.id);
        if (!prev || (Number(n.updatedAt || 0) >= Number(prev.updatedAt || 0))) {
          mergedMap.set(n.id, n);
        }
      });
      resolved = Array.from(mergedMap.values());
    }

    const syncedTs = Math.max(charTs, hubTs);
    standaloneChar.smartNotes = resolved;
    standaloneChar.notesList = resolved;
    if (syncedTs > 0) standaloneChar._notesUpdatedAt = syncedTs;

    hubMatch.smartNotes = resolved;
    hubMatch.notesList = resolved;
    if (syncedTs > 0) hubMatch._notesUpdatedAt = syncedTs;
    if (hubMatch.fullData && typeof hubMatch.fullData === 'object') {
      hubMatch.fullData.smartNotes = resolved;
      hubMatch.fullData.notesList = resolved;
      if (syncedTs > 0) hubMatch.fullData._notesUpdatedAt = syncedTs;
    }
    return resolved;
  }

  function getActiveNotesTarget() {
    const standaloneChar = getStandaloneCharacterInstance();
    const state = getHubState();

    // Standalone Character Sheet Mode (index.html)
    if (standaloneChar && !_overrideTargetKey) {
      const hubMatch = resolveStandaloneHubChar(standaloneChar, state);
      const list = reconcileCharacterAndHubNotes(standaloneChar, hubMatch);
      let urlId = null;
      try {
        urlId = new URLSearchParams(window.location.search).get('id') || localStorage.getItem('dnd35_active_character_id');
      } catch (e) {}
      const charId = hubMatch?.id || standaloneChar._hubId || standaloneChar.id || urlId || 'active_char';
      if (!standaloneChar._hubId && hubMatch?.id) standaloneChar._hubId = hubMatch.id;
      const charName = standaloneChar.name || hubMatch?.name || 'Character';
      return {
        type: 'character',
        id: charId,
        name: charName,
        isDm: false,
        titleBadge: `👤 ${charName} Notes`,
        targetObj: standaloneChar,
        notesList: list
      };
    }

    if (!state) {
      if (standaloneChar) {
        const list = ensureSmartNotesArray(standaloneChar);
        const charId = standaloneChar._hubId || standaloneChar.id || 'active_char';
        return {
          type: 'character',
          id: charId,
          name: standaloneChar.name || 'Character',
          isDm: false,
          titleBadge: `👤 ${standaloneChar.name || 'Character'} Notes`,
          targetObj: standaloneChar,
          notesList: list
        };
      }
      return null;
    }

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
          const list = ensureSmartNotesArray(camp);
          const hName = getCampaignHierarchyName(camp, state);
          return {
            type: 'campaign',
            id: camp.id,
            name: hName,
            rawName: camp.name,
            isDm: Boolean(camp.isDmMode),
            titleBadge: camp.isDmMode ? '👑 DM Notes (Secret)' : '🏰 Campaign Notes',
            targetObj: camp,
            notesList: list
          };
        }
      } else if (type === 'char') {
        const hubMatchForStandalone = resolveStandaloneHubChar(standaloneChar, state);
        if (standaloneChar && (standaloneChar.id === id || standaloneChar._hubId === id || hubMatchForStandalone?.id === id || id === 'active_char')) {
          const list = reconcileCharacterAndHubNotes(standaloneChar, hubMatchForStandalone);
          const resolvedId = hubMatchForStandalone?.id || standaloneChar._hubId || standaloneChar.id || 'active_char';
          return {
            type: 'character',
            id: resolvedId,
            name: standaloneChar.name || hubMatchForStandalone?.name || 'Character',
            isDm: false,
            titleBadge: `👤 ${standaloneChar.name || 'Character'} Notes`,
            targetObj: standaloneChar,
            notesList: list
          };
        }
        const char = state.characters.find(c => c.id === id);
        if (char) {
          const list = ensureSmartNotesArray(char);
          return {
            type: 'character',
            id: char.id,
            name: char.name || 'Character',
            isDm: false,
            titleBadge: `👤 ${char.name || 'Character'} Notes`,
            targetObj: char,
            notesList: list
          };
        }
      }
    }

    const activeCampId = state.activeCampaignId;

    // 1. Bağımsız / Atanmamış Sekmesi
    if (activeCampId === 'unassigned') {
      const unassignedChar = state.characters.find(c => !c.campaignId);
      if (unassignedChar) {
        const list = ensureSmartNotesArray(unassignedChar);
        return {
          type: 'character',
          id: unassignedChar.id,
          name: unassignedChar.name || 'Standalone Character',
          isDm: false,
          titleBadge: `👤 ${unassignedChar.name || 'Character'} Notes`,
          targetObj: unassignedChar,
          notesList: list
        };
      }
    }

    // 2. Aktif Kampanya Seçili İse
    const activeCamp = state.campaigns.find(c => c.id === activeCampId);
    if (activeCamp) {
      const hName = getCampaignHierarchyName(activeCamp, state);

      // 2a. DM Modu ise -> Doğrudan Kampanya DM Notları
      if (activeCamp.isDmMode) {
        const list = ensureSmartNotesArray(activeCamp);
        return {
          type: 'campaign',
          id: activeCamp.id,
          name: hName,
          rawName: activeCamp.name,
          isDm: true,
          titleBadge: '👑 DM Notes (Secret)',
          targetObj: activeCamp,
          notesList: list
        };
      }

      // 2b. Oyuncu Kampanyası ise -> Kampanyadaki aktif karakterin notları
      const charsInCamp = state.characters.filter(c => c.campaignId === activeCamp.id);
      if (charsInCamp.length > 0) {
        let targetChar = charsInCamp[0];
        try {
          const activeId = localStorage.getItem('dnd35_active_character_id');
          const rawChar = localStorage.getItem('dnd35_character');
          const parsed = rawChar ? JSON.parse(rawChar) : null;
          const found = charsInCamp.find(c =>
            (activeId && c.id === activeId) ||
            (parsed && (c.id === parsed.id || c.id === parsed._hubId || (parsed.name && c.name === parsed.name)))
          );
          if (found) targetChar = found;
        } catch (e) {}

        const list = ensureSmartNotesArray(targetChar);
        return {
          type: 'character',
          id: targetChar.id,
          name: targetChar.name || 'Character',
          isDm: false,
          titleBadge: `👤 ${targetChar.name || 'Character'} Notes`,
          targetObj: targetChar,
          notesList: list
        };
      }

      // Kampanyada henüz karakter yoksa kampanya not defterini kullan
      const list = ensureSmartNotesArray(activeCamp);
      return {
        type: 'campaign',
        id: activeCamp.id,
        name: hName,
        rawName: activeCamp.name,
        isDm: false,
        titleBadge: '🏰 Campaign Notes',
        targetObj: activeCamp,
        notesList: list
      };
    }

    // 3. Genel ('all') sekmesinde veya eşleşmeme durumunda ilk karakter
    const firstChar = state.characters[0];
    if (firstChar) {
      const list = ensureSmartNotesArray(firstChar);
      return {
        type: 'character',
        id: firstChar.id,
        name: firstChar.name || 'Character',
        isDm: false,
        titleBadge: `👤 ${firstChar.name || 'Character'} Notes`,
        targetObj: firstChar,
        notesList: list
      };
    }

    // 4. Karakter yoksa ilk kampanya
    const firstCamp = state.campaigns[0];
    if (firstCamp) {
      const list = ensureSmartNotesArray(firstCamp);
      const hName = getCampaignHierarchyName(firstCamp, state);
      return {
        type: 'campaign',
        id: firstCamp.id,
        name: hName,
        rawName: firstCamp.name,
        isDm: Boolean(firstCamp.isDmMode),
        titleBadge: firstCamp.isDmMode ? '👑 DM Notes (Secret)' : '🏰 Campaign Notes',
        targetObj: firstCamp,
        notesList: list
      };
    }

    // 5. Hiçbir kampanya ve karakter yoksa dinamik güvenli alan oluştur
    const defaultCamp = {
      id: 'camp_default',
      name: 'Genel Not Defteri',
      notesList: [],
      smartNotes: []
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
      title: 'Character Notes',
      text: text,
      pinned: false,
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: extractTags(text)
    }];
  }

  function formatPlainNotesSummary(notesList) {
    if (!Array.isArray(notesList) || notesList.length === 0) return '';
    return notesList.map(n => {
      const t = (n.title || '').trim();
      const b = (n.text || '').trim();
      return t ? `${t}\n${b}` : b;
    }).filter(Boolean).join('\n\n---\n\n');
  }

  function saveNotesChanges(target) {
    if (!target) return;
    const state = getHubState();
    const standaloneChar = getStandaloneCharacterInstance();
    const plainSummary = formatPlainNotesSummary(target.notesList);
    const nowTs = Date.now();

    // 0. targetObj referansını V2 `smartNotes` + `notesList` + `notes` ile daima senkronize tut
    if (target.targetObj) {
      target.targetObj.smartNotes = target.notesList || [];
      target.targetObj.notesList = target.notesList || [];
      target.targetObj.notes = plainSummary;
      target.targetObj._notesUpdatedAt = nowTs;
      if (target.targetObj.fullData && typeof target.targetObj.fullData === 'object') {
        target.targetObj.fullData.smartNotes = target.notesList || [];
        target.targetObj.fullData.notesList = target.notesList || [];
        target.targetObj.fullData.notes = plainSummary;
        target.targetObj.fullData._notesUpdatedAt = nowTs;
      }
    }

    const hubMatchForStandalone = resolveStandaloneHubChar(standaloneChar, state);
    const isTargetStandaloneChar = Boolean(
      standaloneChar &&
      target.type === 'character' &&
      (target.targetObj === standaloneChar ||
       target.id === standaloneChar.id ||
       target.id === standaloneChar._hubId ||
       (hubMatchForStandalone && target.id === hubMatchForStandalone.id) ||
       target.id === 'active_char' ||
       (target.name && standaloneChar.name && target.name.trim().toLowerCase() === standaloneChar.name.trim().toLowerCase()))
    );

    // 1. HUB State (`dnd35_hub_db`) Depolaması & Eşleştirme
    if (state) {
      if (target.type === 'character' && Array.isArray(state.characters)) {
        const targetNameLower = (target.name || '').trim().toLowerCase();
        const hubChar = (isTargetStandaloneChar && hubMatchForStandalone)
          ? hubMatchForStandalone
          : state.characters.find(c =>
              (target.id && c.id === target.id) ||
              (targetNameLower && (c.name || '').trim().toLowerCase() === targetNameLower)
            );
        if (hubChar) {
          hubChar.smartNotes = target.notesList || [];
          hubChar.notesList = target.notesList || [];
          hubChar.notes = plainSummary;
          hubChar._notesUpdatedAt = nowTs;
          if (hubChar.fullData && typeof hubChar.fullData === 'object') {
            hubChar.fullData.smartNotes = target.notesList || [];
            hubChar.fullData.notesList = target.notesList || [];
            hubChar.fullData.notes = plainSummary;
            hubChar.fullData._notesUpdatedAt = nowTs;
          }
          if (!isTargetStandaloneChar && window.SupabaseAuth && !window.SupabaseAuth.isLocalMode()) {
            const cloudPayload = hubChar.fullData || Object.assign({}, hubChar);
            cloudPayload.id = hubChar.id;
            cloudPayload._hubId = hubChar.id;
            cloudPayload.smartNotes = target.notesList || [];
            cloudPayload.notesList = target.notesList || [];
            cloudPayload.notes = plainSummary;
            cloudPayload._notesUpdatedAt = nowTs;
            window.SupabaseAuth.upsertUserCharacter(cloudPayload).catch(() => {});
          }
        }
      }

      if (typeof window.saveHubStorage === 'function') {
        window.saveHubStorage();
      } else {
        try {
          localStorage.setItem('dnd35_hub_db', JSON.stringify({
            campaigns: state.campaigns || [],
            characters: state.characters || [],
            latestDmEvent: state.latestDmEvent || null,
            lastSaved: new Date().toISOString()
          }));
        } catch (e) {}
      }
    }

    // 2. Standalone Karakter Kâğıdı (`index.html`) üzerinde çalışıyorsa
    if (isTargetStandaloneChar) {
      standaloneChar.smartNotes = target.notesList || [];
      standaloneChar.notesList = target.notesList || [];
      standaloneChar.notes = plainSummary;
      standaloneChar._notesUpdatedAt = nowTs;
      if (typeof window.saveStateToStorage === 'function') {
        try { window.saveStateToStorage(true); } catch (e) {}
      }
    }

    // 3. Karakter ise dnd35_character & dnd35_character_v2 ile Çapraz Senkronizasyon (Kural #6)
    if (target.type === 'character') {
      ['dnd35_character', 'dnd35_character_v2'].forEach(storageKey => {
        try {
          const charRaw = localStorage.getItem(storageKey);
          if (charRaw) {
            const activeChar = JSON.parse(charRaw);
            const isMatch = activeChar && (
              activeChar.id === target.id ||
              activeChar._hubId === target.id ||
              (activeChar.name && target.name && activeChar.name.trim().toLowerCase() === target.name.trim().toLowerCase()) ||
              target.id === 'active_char'
            );
            if (isMatch) {
              activeChar.smartNotes = target.notesList || [];
              activeChar.notesList = target.notesList || [];
              activeChar.notes = plainSummary;
              activeChar._notesUpdatedAt = nowTs;
              localStorage.setItem(storageKey, JSON.stringify(activeChar));
            }
          }
        } catch (e) {
          console.warn(storageKey + ' localStorage sync warning:', e);
        }
      });
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
    const titleInput = document.getElementById('hub-quick-note-title');
    const input = document.getElementById('hub-quick-note-input');
    if (!input) return;

    let title = (titleInput ? titleInput.value : '').trim();
    let body = input.value.trim();

    if (!title && !body) return;

    const target = getActiveNotesTarget();
    if (!target) {
      alert('Please create a campaign or character before adding notes.');
      return;
    }

    if (!title && body) {
      const lines = body.split('\n');
      if (lines.length > 1 && lines[0].trim().length > 0 && lines[0].trim().length <= 60) {
        title = lines[0].trim();
        body = lines.slice(1).join('\n').trim();
      }
    }

    const fullContent = (title ? title + ' ' : '') + body;

    const newNote = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title: title,
      text: body,
      pinned: false,
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: extractTags(fullContent)
    };

    target.notesList.unshift(newNote);
    saveNotesChanges(target);
    if (titleInput) titleInput.value = '';
    input.value = '';
    hideAutocompletePopover();

    renderInlineNotes();
    renderFullNotesModalList();

    const countEl = document.getElementById('hub-notes-tab-count');
    if (countEl) countEl.textContent = String(target.notesList.length);
  }

  function insertTagIntoQuickInput(tag) {
    const titleInput = document.getElementById('hub-quick-note-title');
    const bodyInput = document.getElementById('hub-quick-note-input');
    const targetEl = (document.activeElement === titleInput) ? titleInput : (bodyInput || titleInput);
    if (!targetEl) return;

    const pos = (targetEl.selectionStart !== null && targetEl.selectionStart !== undefined) ? targetEl.selectionStart : targetEl.value.length;
    const textBefore = targetEl.value.substring(0, pos);
    const textAfter = targetEl.value.substring(pos);

    targetEl.value = textBefore + (textBefore.endsWith(' ') || textBefore.length === 0 ? '' : ' ') + tag + ' ' + textAfter;
    targetEl.focus();
    const newPos = pos + tag.length + (textBefore.endsWith(' ') || textBefore.length === 0 ? 0 : 1) + 1;
    targetEl.selectionStart = targetEl.selectionEnd = newPos;
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

    if (!confirm('Are you sure you want to delete this note?')) return;

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
    chipsEl.innerHTML = pinnedNotes.map(n => {
      const pinTitle = (n.title || '').trim() || (n.text || '').slice(0, 26);
      return `
      <div onclick="HubNotes.openFullNotesModal('${n.id}')" class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-200 text-[11px] font-medium hover:border-amber-400 transition cursor-pointer max-w-full truncate" title="${escapeHtml((n.title ? n.title + ': ' : '') + n.text)}">
        <span class="text-amber-400 text-xs shrink-0">📌</span>
        <span class="truncate">${escapeHtml(pinTitle)}</span>
      </div>
    `;
    }).join('');
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
      listEl.innerHTML = `<div class="p-4 text-center text-slate-500 text-xs italic">Select an active campaign to take notes.</div>`;
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
          <span>No saved notes found.</span>
          <span class="text-[10px] text-slate-600">Switch to the "Write Note" tab to compose and save a new note.</span>
        </div>`;
      return;
    }

    let html = '';
    filtered.forEach(note => {
      const isPinned = Boolean(note.pinned);
      const isCompleted = Boolean(note.completed);
      const titleDisplay = (note.title || '').trim();
      const textDisplay = note.text || '';

      html += `
        <div onclick="HubNotes.openFullNotesModal('${note.id}')" class="p-2.5 rounded-xl border transition group cursor-pointer relative ${isPinned ? 'bg-amber-950/20 border-amber-500/40 shadow-sm' : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700'}">
          <div class="flex items-start justify-between gap-1.5">
            <!-- Pin & Checkbox Alanı -->
            <div class="flex items-center gap-1.5 shrink-0 mt-0.5">
              <button type="button" onclick="HubNotes.togglePinNote('${note.id}', event)" class="p-1 rounded text-xs transition cursor-pointer ${isPinned ? 'text-amber-400 hover:text-amber-300' : 'text-slate-600 hover:text-slate-400'}" title="${isPinned ? 'Unpin Note' : 'Pin to Top'}">
                📌
              </button>
              <button type="button" onclick="HubNotes.toggleCompleteNote('${note.id}', event)" class="w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold transition cursor-pointer ${isCompleted ? 'bg-emerald-600 border-emerald-400 text-white' : 'border-slate-600 hover:border-slate-400 text-transparent'}" title="${isCompleted ? 'Marked as Completed' : 'Mark as Completed'}">
                ✓
              </button>
            </div>

            <!-- Not Başlık ve Metni -->
            <div class="flex-1 min-w-0">
              ${titleDisplay ? `<div class="text-xs font-bold text-indigo-300 truncate mb-0.5">${escapeHtml(titleDisplay)}</div>` : ''}
              <div class="text-[11px] text-slate-300 leading-snug line-clamp-2 break-words ${isCompleted ? 'line-through opacity-60' : ''}">
                ${formatNoteTextHtml(textDisplay)}
              </div>
            </div>

            <!-- Hızlı Aksiyonlar -->
            <div class="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
              <button type="button" onclick="HubNotes.deleteNote('${note.id}', event)" class="p-1 text-slate-500 hover:text-rose-400 rounded text-[11px] transition cursor-pointer" title="Delete Note">
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
    ensureModalDom();
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

  /**
   * Open the Smart Campaign Notebook modal directly scoped to the active character on `index.html`,
   * reconciling notes bidirectionally with `dnd35_hub_db` first.
   */
  function openCharacterNotebookModal(initialView = 'editor') {
    _overrideTargetKey = null;
    openFullNotesModal(null, initialView || 'editor');
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
      selectHtml += `<optgroup label="👤 Character Notebooks">`;
      chars.forEach(c => {
        const val = `char:${c.id}`;
        let charContext = '';
        if (c.campaignId) {
          const cp = camps.find(camp => camp.id === c.campaignId);
          if (cp) charContext = ` (${getCampaignHierarchyName(cp, state)})`;
        }
        selectHtml += `<option value="${val}" ${val === currentKey ? 'selected' : ''}>👤 ${escapeHtml((c.name || 'Character') + charContext)}</option>`;
      });
      selectHtml += `</optgroup>`;
    }

    if (camps.length > 0) {
      selectHtml += `<optgroup label="🏰 Campaign Notebooks">`;
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
        <span class="text-[9px] font-mono text-slate-500">↑↓ Select • Enter Insert</span>
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
          #all (${target.notesList.length})
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
              <span>Selected:</span> <strong class="text-white font-mono">${_activeNoteFilterTag}</strong>
            </span>
            <button type="button" onclick="HubNotes.setTagFilter('all')" class="text-indigo-400 hover:text-white text-xs px-1 font-bold cursor-pointer" title="Filtreyi Temizle">✕ Temizle</button>
          </div>
      `;

      if (relatedTags.length > 0) {
        html += `
          <div class="text-[10px] text-slate-400 font-medium">Co-Occurring Tags:</div>
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
        html += `<div class="text-[10px] text-slate-500 italic">No other tags co-occur with this tag.</div>`;
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
          No notes found yet to generate the tag mindmap.
        </text>`;
      if (statsBadge) statsBadge.textContent = '0 Nodes • 0 Links';
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
      statsBadge.textContent = `${nodes.length} Nodes • ${edges.length} Relational Links`;
    }

    if (nodes.length === 0) {
      svgEl.innerHTML = `
        <text x="400" y="250" text-anchor="middle" fill="#64748b" font-size="14" font-family="sans-serif">
          No #tags detected in your notes. Add tags like #quest, #location, #npc to your notes.
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
      if (selectedSub) selectedSub.textContent = `Notes and direct connections associated with this tag:`;
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
          connectedTagsEl.innerHTML = `<span class="text-slate-500 italic text-[10px]">No directly connected tags.</span>`;
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
                📝 Edit
              </button>
            </div>
            <div class="text-xs text-slate-200 line-clamp-3 leading-snug">
              ${formatNoteTextHtml(n.text)}
            </div>
          </div>
        `).join('');
      }
    } else {
      if (selectedTitle) selectedTitle.textContent = `Tag Mindmap`;
      if (selectedSub) selectedSub.textContent = `Click any node in the graph to inspect associated notes and connections.`;
      if (aiBtn) aiBtn.classList.add('hidden');
      if (connectedTagsEl) connectedTagsEl.innerHTML = '';
      if (matchingNotesEl) {
        matchingNotesEl.innerHTML = `
          <div class="p-6 text-center text-slate-500 text-xs italic">
            Select a node to list all micro-notes associated with that tag.
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
      apiKey = prompt('⚡ Enter your Google AI Studio Gemini API Key for the AI Note Synthesizer:\n(Stored locally in your browser only)');
      if (!apiKey || !apiKey.trim()) throw new Error('No API key entered.');
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
        if (typeof onProgress === 'function') onProgress(`Connecting to Rule Master AI (${model})...`);
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

    throw lastErr || new Error('Gemini API did not respond.');
  }

  /**
   * Run AI Synthesis on the selected notes
   */
  async function runAiChronicler() {
    const target = getActiveNotesTarget();
    if (!target || !Array.isArray(target.notesList) || target.notesList.length === 0) {
      alert('No notes found to synthesize. Please add a few notes first.');
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
      alert('No notes match the selected scope.');
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
      systemPrompt = `You are a master D&D 3.5e tabletop RPG campaign chronicler.
TASK: Read the user's fragmented player/DM session micro-notes and synthesize them into an engaging, atmospheric D&D 3.5e Session Chronicle / Campaign Log chapter in English.
RULES:
1. Write in English, preserving official D&D 3.5e terminology, character names, locations, critical events, and combat details.
2. Use an immersive high-fantasy narrative tone.
3. Structure the output in clean Markdown with section headings (##), key events, and consequences.
4. NEVER use the standard 6-sided board game die emoji.`;
      userPrompt = `Synthesize the following D&D 3.5e campaign notes into a narrative session chronicle:\n\n${notesCorpus}`;
    } else if (selectedMode === 'quests') {
      systemPrompt = `You are an expert D&D 3.5e DM assistant and quest tracker.
TASK: Analyze the raw campaign notes below and compile a structured "Quest & Clues Dossier".
RULES:
1. Write in English using official D&D 3.5e terminology.
2. Sections:
   - ## 🎯 Active Quests & Objectives (bulleted with - [ ] checkboxes)
   - ## ✅ Completed Quests & Milestones
   - ## 🔍 Gathered Clues & Mysteries (unresolved leads and hooks)
   - ## ⚠️ Active Threats & Hazards
3. NEVER use the standard 6-sided board game die emoji.`;
      userPrompt = `Analyze the following D&D 3.5e notes and compile a Quest & Clues Dossier:\n\n${notesCorpus}`;
    } else if (selectedMode === 'dramatis') {
      systemPrompt = `You are a D&D 3.5e Lore & Dramatis Personae archivist.
TASK: Extract all NPCs, factions/guilds, and locations (cities, taverns, dungeons) mentioned in the notes below.
RULES:
1. Write in English using official D&D 3.5e terminology.
2. Sections:
   - ## 👤 Notable Characters & NPCs (Name, role, disposition/allegiance, current status)
   - ## 🗺️ Visited Locations & Landmarks (Location name, features, notable events)
   - ## 🛡️ Factions & Alliances
3. NEVER use the standard 6-sided board game die emoji.`;
      userPrompt = `Compile an NPC and Location directory from the following D&D 3.5e notes:\n\n${notesCorpus}`;
    } else if (selectedMode === 'loot') {
      systemPrompt = `You are a D&D 3.5e quartermaster and treasure archivist.
TASK: Compile all loot, magic items, coinage/gems, and inventory changes recorded in the notes below.
RULES:
1. Write in English using official D&D 3.5e terminology.
2. Sections:
   - ## 💎 Magic & Wondrous Items
   - ## 💰 Coinage, Gems & Art Objects
   - ## ⚔️ Weapons, Armor & Consumables (Potions, Scrolls, Wands)
3. NEVER use the standard 6-sided board game die emoji.`;
      userPrompt = `Compile a treasure and loot ledger from the following D&D 3.5e notes:\n\n${notesCorpus}`;
    }

    try {
      if (runBtn) {
        runBtn.disabled = true;
        runBtn.classList.add('opacity-50', 'pointer-events-none');
        runBtn.innerHTML = `<span>⏳</span> <span>Synthesizing Notes...</span>`;
      }
      if (statusBadge) {
        statusBadge.innerHTML = `<span class="text-amber-400 animate-pulse">⚡ Analiz Ediliyor...</span>`;
      }
      if (resultContainer) {
        resultContainer.innerHTML = `
          <div class="h-full flex flex-col items-center justify-center text-center gap-3 py-16">
            <div class="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="font-bold text-white text-xs">Rule Master AI is analyzing your notes...</p>
            <p class="text-[10px] text-slate-400 font-mono">Verifying D&D 3.5e lore and chronicle structure</p>
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
        statusBadge.innerHTML = `<span class="text-emerald-400 font-bold">✓ Synthesis Complete</span>`;
      }
      if (resultContainer) {
        resultContainer.innerHTML = renderMarkdownToHtml(generated);
      }
      if (outputActions) {
        outputActions.classList.remove('hidden');
      }

    } catch (err) {
      console.error('AI Chronicler Error:', err);
      if (statusBadge) {
        statusBadge.innerHTML = `<span class="text-rose-400 font-bold">⚠️ Error</span>`;
      }
      if (resultContainer) {
        resultContainer.innerHTML = `
          <div class="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl text-rose-200 text-xs space-y-2">
            <div class="font-bold flex items-center gap-1.5"><span>❌</span> <span>AI Synthesis Error</span></div>
            <p>${escapeHtml(err.message || 'Could not reach Gemini service.')}</p>
            <p class="text-[10px] text-slate-400">You can check your Google Gemini API key in System Settings.</p>
          </div>
        `;
      }
    } finally {
      if (runBtn) {
        runBtn.disabled = false;
        runBtn.classList.remove('opacity-50', 'pointer-events-none');
        runBtn.innerHTML = `<span>✨</span> <span>Synthesize &amp; Generate</span>`;
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
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateTag = `#${now.getDate()}_${monthsTr[now.getMonth()]}_${now.getFullYear()}`;
    const dateTitle = `AI Session Chronicle (${monthsEn[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()})`;

    const newNote = {
      id: 'note_ai_' + Date.now(),
      title: dateTitle,
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
      target.targetObj.notes = target.notesList.map(n => (n.title ? n.title + '\n\n' : '') + n.text).join('\n\n---\n\n');
    }
    saveNotesChanges(target);

    renderFullNotesModalList();
    renderInlineNotes();

    alert('✅ AI Synthesis saved as a new pinned note!');
    switchModalView('editor');
    _selectedModalNoteId = newNote.id;
    loadSelectedNoteIntoEditor();
  }

  function copyAiSynthesisToClipboard() {
    if (!_lastAiGeneratedText) return;
    navigator.clipboard.writeText(_lastAiGeneratedText).then(() => {
      alert('📋 AI Synthesis copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy text.');
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
      if (btn) btn.className = 'w-full px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 text-slate-400 hover:text-white cursor-pointer text-xs truncate';
    });

    if (view === 'editor') {
      if (tabEditor) tabEditor.className = 'w-full px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 bg-indigo-600 text-white shadow cursor-pointer text-xs truncate';
      if (viewEditor) viewEditor.classList.remove('hidden');
      if (viewMindmap) viewMindmap.classList.add('hidden');
      if (viewAi) viewAi.classList.add('hidden');
      renderFullNotesModalList();
      loadSelectedNoteIntoEditor();
    } else if (view === 'mindmap') {
      if (tabMindmap) tabMindmap.className = 'w-full px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 bg-indigo-600 text-white shadow cursor-pointer text-xs truncate';
      if (viewEditor) viewEditor.classList.add('hidden');
      if (viewMindmap) viewMindmap.classList.remove('hidden');
      if (viewAi) viewAi.classList.add('hidden');
      renderMindmap();
    } else if (view === 'ai') {
      if (tabAi) tabAi.className = 'w-full px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 bg-indigo-600 text-white shadow cursor-pointer text-xs truncate';
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
      listEl.innerHTML = `<div class="p-4 text-slate-500 text-xs italic">No active target found.</div>`;
      return;
    }

    const sorted = sortNotes(target.notesList);
    const filtered = filterNotes(sorted);

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="p-6 text-center text-slate-500 text-xs">No matching notes found.</div>`;
      return;
    }

    let html = '';
    const targetDisplayName = getTargetDisplayName(target, state);

    filtered.forEach((note, idx) => {
      const isSelected = note.id === _selectedModalNoteId;
      const isPinned = Boolean(note.pinned);

      // Kart Başlığı: Eğer note.title varsa onu göster, yoksa metnin ilk satırı
      let cardTitle = (note.title || '').trim();
      let previewText = note.text || '';

      if (!cardTitle) {
        const firstLine = (note.text || '').split('\n')[0].trim();
        cardTitle = firstLine ? firstLine : (filtered.length > 1 ? `${targetDisplayName} • Not ${idx + 1}` : targetDisplayName);
      }

      html += `
        <div onclick="HubNotes.selectNoteInModal('${note.id}')" class="p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${isSelected ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md' : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'}">
          <div class="flex items-center justify-between gap-1.5">
            <div class="flex items-center gap-1.5 min-w-0">
              ${isPinned ? '<span class="text-amber-400 text-xs shrink-0" title="Pinned to Top">📌</span>' : ''}
              <span class="text-xs font-bold truncate text-indigo-200" title="${escapeHtml(cardTitle)}">${escapeHtml(cardTitle)}</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="text-[9px] text-slate-500 font-mono">${formatTimeAgo(note.updatedAt || note.createdAt)}</span>
              <button type="button" onclick="HubNotes.deleteNote('${note.id}', event)" class="p-1 text-slate-500 hover:text-rose-400 rounded text-xs transition cursor-pointer" title="Bu Notu Sil">✕</button>
            </div>
          </div>
          <div class="text-[11px] text-slate-400 line-clamp-2 break-words">
            ${escapeHtml(previewText) || '<span class="italic text-slate-500">Empty note...</span>'}
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
    const titleInput = document.getElementById('hub-modal-note-title');
    const editor = document.getElementById('hub-modal-note-editor');
    const pinBtn = document.getElementById('hub-modal-pin-btn');
    const deleteBtn = document.getElementById('hub-modal-delete-btn');
    const saveBtn = document.getElementById('hub-modal-save-btn');
    const dateBadge = document.getElementById('hub-modal-date-badge');
    if (!editor) return;

    const target = getActiveNotesTarget();
    if (!target) {
      if (titleInput) { titleInput.value = ''; titleInput.disabled = true; }
      editor.value = '';
      editor.placeholder = 'Select a note from the list on the left to edit, or create a new note.';
      editor.disabled = true;
      if (pinBtn) pinBtn.classList.add('opacity-40', 'pointer-events-none');
      if (deleteBtn) deleteBtn.classList.add('opacity-40', 'pointer-events-none');
      if (saveBtn) saveBtn.classList.add('opacity-40', 'pointer-events-none');
      if (dateBadge) dateBadge.textContent = '-';
      return;
    }

    if (target.notesList.length === 0) {
      _selectedModalNoteId = null;
      if (titleInput) { titleInput.value = ''; titleInput.disabled = false; }
      editor.value = '';
      editor.placeholder = 'Write your note here... (Type "#" for tag autocomplete, or click Save Note)';
      editor.disabled = false;
      if (pinBtn) pinBtn.classList.add('opacity-40', 'pointer-events-none');
      if (deleteBtn) deleteBtn.classList.add('opacity-40', 'pointer-events-none');
      if (saveBtn) saveBtn.classList.remove('opacity-40', 'pointer-events-none');
      if (dateBadge) {
        const state = getHubState();
        const dName = getTargetDisplayName(target, state);
        dateBadge.textContent = `${dName} • New Note Draft`;
      }
      return;
    }

    let note = target.notesList.find(n => n.id === _selectedModalNoteId);
    if (!note) {
      note = target.notesList[0];
      _selectedModalNoteId = note.id;
    }

    if (titleInput) {
      titleInput.disabled = false;
      titleInput.value = note.title || '';
    }
    editor.disabled = false;
    editor.value = note.text || '';
    if (dateBadge) {
      const state = getHubState();
      const dName = getTargetDisplayName(target, state);
      dateBadge.textContent = `${dName} • Last Updated: ${new Date(note.updatedAt || note.createdAt).toLocaleString('en-US')}`;
    }

    if (pinBtn) {
      pinBtn.classList.remove('opacity-40', 'pointer-events-none');
      pinBtn.textContent = note.pinned ? '📌 Pinned' : '📌 Pin to Top';
      pinBtn.className = note.pinned 
        ? 'w-full px-3 py-1.5 rounded-lg text-xs font-bold transition bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center gap-1 cursor-pointer truncate'
        : 'w-full px-3 py-1.5 rounded-lg text-xs font-bold transition bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center gap-1 cursor-pointer truncate';
    }

    if (deleteBtn) deleteBtn.classList.remove('opacity-40', 'pointer-events-none');
    if (saveBtn) saveBtn.classList.remove('opacity-40', 'pointer-events-none');
  }

  let _editorDebounceTimer = null;

  function handleEditorInput(event) {
    const titleInput = document.getElementById('hub-modal-note-title');
    const editor = document.getElementById('hub-modal-note-editor');
    if (!editor) return;

    if (document.activeElement === editor) {
      checkAutocomplete(editor);
    }

    const target = getActiveNotesTarget();
    if (!target) return;

    let note = target.notesList.find(n => n.id === _selectedModalNoteId);
    if (!note) {
      const state = getHubState();
      const charRef = resolveCharacterForNote(target, state);
      const charTag = charRef ? toValidHashtag(charRef.name) : '';
      const lvlNum = charRef ? Math.max(1, Number(charRef.level) || (Array.isArray(charRef.levelProgression) ? charRef.levelProgression.filter(l => l.active !== false).length : 1) || 1) : 0;
      const lvlTag = charRef ? `#Lvl${lvlNum}` : '';
      const autoPrefix = [charTag, lvlTag].filter(Boolean).join(' ');
      const rawTitle = titleInput ? (titleInput.value || '').trim() : '';
      const rawText = editor.value || '';
      if (!rawTitle && !rawText.trim()) return;
      note = {
        id: 'note_' + Date.now(),
        title: rawTitle,
        text: rawText || (autoPrefix ? `${autoPrefix} ` : ''),
        pinned: false,
        completed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: extractTags(rawTitle + ' ' + rawText)
      };
      target.notesList.unshift(note);
      _selectedModalNoteId = note.id;
      const pinBtn = document.getElementById('hub-modal-pin-btn');
      const deleteBtn = document.getElementById('hub-modal-delete-btn');
      if (pinBtn) pinBtn.classList.remove('opacity-40', 'pointer-events-none');
      if (deleteBtn) deleteBtn.classList.remove('opacity-40', 'pointer-events-none');
    } else {
      if (titleInput) {
        note.title = (titleInput.value || '').trim();
      }
      note.text = editor.value || '';
      note.tags = extractTags((note.title || '') + ' ' + (note.text || ''));
      note.updatedAt = Date.now();
    }

    if (target.targetObj) {
      target.targetObj.notesList = target.notesList;
    }

    clearTimeout(_editorDebounceTimer);
    _editorDebounceTimer = setTimeout(() => {
      saveModalNote(false);
    }, 1000);
  }

  function handleTitleKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const editor = document.getElementById('hub-modal-note-editor');
      if (editor) {
        editor.focus();
        editor.selectionStart = editor.selectionEnd = 0;
      }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'Enter')) {
      e.preventDefault();
      saveModalNote(true);
    }
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
    const el = event && event.target ? event.target : (document.activeElement || document.getElementById('hub-quick-note-input'));
    if (el) {
      checkAutocomplete(el);
    }
  }

  function handleQuickTitleKeydown(e) {
    const titleInput = document.getElementById('hub-quick-note-title');
    if (handleAutocompleteKeydown(titleInput, e)) {
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const input = document.getElementById('hub-quick-note-input');
      if (input) {
        input.focus();
        input.selectionStart = input.selectionEnd = 0;
      }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'Enter')) {
      e.preventDefault();
      addQuickNote();
    }
  }

  function handleQuickKeydown(e) {
    const input = document.getElementById('hub-quick-note-input');
    if (handleAutocompleteKeydown(input, e)) {
      return;
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'Enter')) {
      e.preventDefault();
      addQuickNote();
    }
  }

  /**
   * Modal Notunu Kalıcı Olarak Kaydet
   */
  function saveModalNote(showToast = true) {
    clearTimeout(_editorDebounceTimer);
    const titleInput = document.getElementById('hub-modal-note-title');
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
        const rawTitle = titleInput ? (titleInput.value || '').trim() : '';
        const rawText = (editor.value || '').trim();
        if (!rawTitle && !rawText) return;
        note = {
          id: 'note_' + Date.now(),
          title: rawTitle,
          text: editor.value || '',
          pinned: false,
          completed: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tags: extractTags(rawTitle + ' ' + rawText)
        };
        target.notesList.unshift(note);
        _selectedModalNoteId = note.id;
      }
    }

    if (titleInput) {
      note.title = (titleInput.value || '').trim();
    }
    note.text = editor.value || '';
    note.tags = extractTags((note.title || '') + ' ' + (note.text || ''));
    note.updatedAt = Date.now();

    if (target.targetObj) {
      target.targetObj.notesList = target.notesList;
      target.targetObj.notes = target.notesList.map(n => (n.title ? n.title + '\n\n' : '') + n.text).join('\n\n---\n\n');
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
      dateBadge.textContent = `${dName} • Last Updated: ${new Date(note.updatedAt).toLocaleString('en-US')}`;
    }

    if (showToast && saveBtn && saveText) {
      const originalText = saveText.textContent;
      saveBtn.className = 'w-full px-3 py-1.5 rounded-lg text-xs font-bold transition bg-emerald-500 text-white shadow-md shadow-emerald-900/50 flex items-center justify-center gap-1.5 cursor-pointer truncate';
      saveText.textContent = 'Saved! ✓';
      setTimeout(() => {
        if (saveBtn && saveText) {
          saveBtn.className = 'w-full px-3 py-1.5 rounded-lg text-xs font-bold transition bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 truncate';
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
    if (!str || typeof str !== 'string') return '#Character';
    const cleaned = str
      .trim()
      .replace(/[^\w\u00C0-\u024F\u1E00-\u1EFFğüşıöçĞÜŞİÖÇ]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
    return cleaned ? `#${cleaned}` : '#Character';
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
      alert('Please select a campaign or character first.');
      return;
    }

    const newNote = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title: '',
      text: '',
      pinned: false,
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: []
    };

    target.notesList.unshift(newNote);
    if (target.targetObj) {
      target.targetObj.notesList = target.notesList;
      target.targetObj.notes = target.notesList.map(n => (n.title ? n.title + '\n\n' : '') + n.text).join('\n\n---\n\n');
    }
    saveNotesChanges(target);

    _selectedModalNoteId = newNote.id;
    switchModalView('editor');
    renderFullNotesModalList();
    loadSelectedNoteIntoEditor();

    const titleInput = document.getElementById('hub-modal-note-title');
    if (titleInput) {
      titleInput.focus();
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
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(ts).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  /**
   * Self-contained Full Notes Modal DOM injector for standalone pages (`index.html`).
   * If `#hub-full-notes-modal` already exists (e.g., on `hub.html`), does nothing.
   */
  function ensureModalDom() {
    if (document.getElementById('hub-full-notes-modal')) return;

    const modalWrapper = document.createElement('div');
    modalWrapper.id = 'hub-full-notes-modal';
    modalWrapper.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 hidden items-center justify-center p-2 sm:p-4 md:p-6';
    modalWrapper.innerHTML = `
      <div class="bg-[#131d33] border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        <!-- Modal Başlığı & Görünüm Sekmeleri (Tam Simetrik Üst Bar + 3 Eşit Sekme) -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-700/80 px-4 sm:px-5 py-3 bg-slate-900/90 shrink-0 gap-2.5">
          <div class="flex items-center justify-between gap-2 w-full lg:w-auto min-w-0">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-xl shrink-0">📝</span>
              <h3 class="text-sm sm:text-base font-bold text-white truncate">Smart Campaign Notebook</h3>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span id="hub-modal-target-title" class="inline-flex items-center text-xs font-normal text-indigo-300 truncate"></span>
              <button type="button" onclick="HubNotes.closeFullNotesModal()" class="lg:hidden text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold px-2.5 py-1.5 cursor-pointer shrink-0 transition">✕</button>
            </div>
          </div>

          <div class="flex items-center gap-2 w-full lg:w-auto">
            <div class="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs w-full lg:w-auto shrink-0">
              <button type="button" id="hub-modal-tab-editor" onclick="HubNotes.switchModalView('editor')" class="w-full px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 bg-indigo-600 text-white shadow cursor-pointer text-xs truncate">
                <span>📝</span><span class="truncate">Notes</span>
              </button>
              <button type="button" id="hub-modal-tab-mindmap" onclick="HubNotes.switchModalView('mindmap')" class="w-full px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 text-slate-400 hover:text-white cursor-pointer text-xs truncate">
                <span>🕸️</span><span class="truncate">Tag Mindmap</span>
              </button>
              <button type="button" id="hub-modal-tab-ai" onclick="HubNotes.switchModalView('ai')" class="w-full px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 text-slate-400 hover:text-white cursor-pointer text-xs truncate">
                <span>✨</span><span class="truncate">AI Chronicler</span>
              </button>
            </div>

            <button type="button" onclick="HubNotes.closeFullNotesModal()" class="hidden lg:inline-flex text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold px-2.5 py-1.5 cursor-pointer shrink-0 transition">✕ Close</button>
          </div>
        </div>

        <!-- 1. GÖRÜNÜM: Notlar & Editör -->
        <div id="hub-modal-view-editor" class="flex-1 flex flex-col sm:flex-row overflow-hidden min-h-0">
          <div class="w-full sm:w-80 border-b sm:border-b-0 sm:border-r border-slate-700/80 flex flex-col bg-slate-900/40 shrink-0 p-3 space-y-2.5 overflow-hidden">
            <div class="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 focus-within:border-indigo-400 transition shrink-0">
              <span class="text-slate-500 text-xs">🔍</span>
              <input type="text" oninput="HubNotes.handleSearchInput(this.value)" placeholder="Search notes..." class="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none">
            </div>
            <button type="button" onclick="HubNotes.createNewModalNote()" class="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95 cursor-pointer shrink-0">
              <span>➕</span><span>Create New Note</span>
            </button>
            <div id="hub-modal-tags-bar" class="shrink-0 space-y-1.5"></div>
            <div id="hub-modal-notes-list" class="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-0"></div>
          </div>

          <div class="flex-1 flex flex-col p-4 space-y-3 bg-[#131d33] overflow-y-auto min-h-0">
            <div class="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-800 pb-2.5 shrink-0 gap-2">
              <div class="text-[11px] text-slate-400 font-mono truncate" id="hub-modal-date-badge">Selected note details</div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto">
                <button type="button" onclick="HubNotes.openAiChroniclerWithActiveNote()" class="w-full px-2.5 py-1.5 rounded-lg text-xs font-bold transition bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800/60 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm truncate">
                  <span>✨</span><span class="truncate">AI Summarize</span>
                </button>
                <button type="button" id="hub-modal-save-btn" onclick="HubNotes.saveModalNote(true)" class="w-full px-3 py-1.5 rounded-lg text-xs font-bold transition bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 truncate">
                  <span>💾</span><span id="hub-modal-save-text" class="truncate">Save Note</span>
                </button>
                <button type="button" id="hub-modal-pin-btn" onclick="HubNotes.togglePinNote(null, event)" class="w-full px-3 py-1.5 rounded-lg text-xs font-bold transition bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center gap-1 cursor-pointer truncate">
                  📌 Pin to Top
                </button>
                <button type="button" id="hub-modal-delete-btn" onclick="HubNotes.deleteNote(null, event)" class="w-full px-3 py-1.5 rounded-lg text-xs font-bold transition bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 flex items-center justify-center gap-1 cursor-pointer truncate">
                  🗑️ Delete
                </button>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center gap-1.5 text-xs font-mono shrink-0">
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">Quick Tag:</span>
                <span class="text-[10px] text-slate-500 italic sm:hidden">💡 Type '#' for tags</span>
              </div>
              <div class="grid grid-cols-5 gap-1.5 w-full sm:flex-1">
                <button type="button" onclick="HubNotes.insertTagIntoEditor('#quest')" class="w-full py-1 px-1 rounded-md bg-sky-950/60 hover:bg-sky-900 text-sky-300 border border-sky-800/60 text-[10px] sm:text-xs font-bold transition flex items-center justify-center cursor-pointer truncate">+ #quest</button>
                <button type="button" onclick="HubNotes.insertTagIntoEditor('#npc')" class="w-full py-1 px-1 rounded-md bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800/60 text-[10px] sm:text-xs font-bold transition flex items-center justify-center cursor-pointer truncate">+ #npc</button>
                <button type="button" onclick="HubNotes.insertTagIntoEditor('#location')" class="w-full py-1 px-1 rounded-md bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 text-[10px] sm:text-xs font-bold transition flex items-center justify-center cursor-pointer truncate">+ #location</button>
                <button type="button" onclick="HubNotes.insertTagIntoEditor('#loot')" class="w-full py-1 px-1 rounded-md bg-yellow-950/60 hover:bg-yellow-900 text-yellow-300 border border-yellow-800/60 text-[10px] sm:text-xs font-bold transition flex items-center justify-center cursor-pointer truncate">+ #loot</button>
                <button type="button" onclick="HubNotes.insertTagIntoEditor('- [ ] ')" class="w-full py-1 px-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] sm:text-xs font-bold transition flex items-center justify-center cursor-pointer truncate">+ To-Do</button>
              </div>
            </div>

            <div class="w-full flex-1 min-h-[300px] bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-2.5 focus-within:border-indigo-500/80 transition shadow-inner">
              <input type="text" id="hub-modal-note-title" placeholder="Note Title (Optional)..."
                class="w-full bg-transparent text-base sm:text-lg font-bold text-white placeholder-slate-600 focus:outline-none border-b border-slate-800/80 pb-2 font-sans tracking-wide"
                oninput="HubNotes.handleEditorInput(event)"
                onkeydown="HubNotes.handleTitleKeydown(event)"
                onblur="HubNotes.saveModalNote(false)">
              <textarea id="hub-modal-note-editor"
                oninput="HubNotes.handleEditorInput(event)"
                onkeydown="HubNotes.handleEditorKeydown(event)"
                onblur="HubNotes.saveModalNote(false)"
                placeholder="Write note details here...&#10;&#10;Tips:&#10;• Type '#' for smart tag autocomplete&#10;• Press Ctrl+S / Ctrl+Enter to save"
                class="w-full flex-1 min-h-[220px] bg-transparent text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none font-sans leading-relaxed resize-none pt-1 custom-scrollbar"></textarea>
            </div>
          </div>
        </div>

        <!-- 2. GÖRÜNÜM: Etiket Haritası (Mindmap) -->
        <div id="hub-modal-view-mindmap" class="hidden flex-1 flex flex-col sm:flex-row overflow-hidden min-h-0 bg-[#0c1322]">
          <div class="flex-1 flex flex-col min-h-0 relative overflow-hidden">
            <div class="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 flex-wrap">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-white flex items-center gap-1.5"><span>🕸️</span><span>Relational Tag Graph</span></span>
                <span id="hub-mindmap-stats-badge" class="text-[10px] text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded-md border border-indigo-800/60 font-mono">0 Nodes • 0 Links</span>
              </div>
              <div class="flex items-center gap-2">
                <input type="text" id="hub-mindmap-search-input" oninput="HubNotes.handleMindmapSearch(this.value)" placeholder="Search nodes..." class="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 w-36 sm:w-44 font-mono">
                <button type="button" onclick="HubNotes.renderMindmap()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold cursor-pointer">🔄 Refresh</button>
              </div>
            </div>
            <div id="hub-mindmap-canvas-container" class="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center p-2">
              <svg id="hub-mindmap-svg" viewBox="0 0 800 500" class="w-full h-full max-h-[500px] select-none"></svg>
            </div>
          </div>
          <div id="hub-mindmap-drawer" class="w-full sm:w-80 border-t sm:border-t-0 sm:border-l border-slate-800 bg-slate-900/60 flex flex-col shrink-0 p-3 space-y-2.5 overflow-hidden">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <div class="min-w-0">
                <h4 id="hub-mindmap-selected-title" class="text-xs font-bold text-white truncate">Select a Node</h4>
                <p id="hub-mindmap-selected-sub" class="text-[10px] text-slate-400 truncate">Click a node in the graph to view its details.</p>
              </div>
              <button type="button" id="hub-mindmap-ai-btn" onclick="HubNotes.openAiChroniclerWithMindmapTag()" class="hidden px-2 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-700/60 text-[10px] font-bold cursor-pointer shrink-0">✨ AI Synthesize</button>
            </div>
            <div id="hub-mindmap-connected-tags" class="flex flex-wrap gap-1 text-[10px] font-mono max-h-20 overflow-y-auto"></div>
            <div id="hub-mindmap-matching-notes" class="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-0"></div>
          </div>
        </div>

        <!-- 3. GÖRÜNÜM: AI Kampanya Günlükçüsü -->
        <div id="hub-modal-view-ai" class="hidden flex-1 flex flex-col overflow-hidden min-h-0 bg-[#0d1629]">
          <div class="flex-1 flex flex-col sm:flex-row overflow-hidden min-h-0">
            <div class="w-full sm:w-80 border-b sm:border-b-0 sm:border-r border-slate-800 bg-slate-900/60 p-4 flex flex-col space-y-3.5 shrink-0 overflow-y-auto">
              <div class="flex items-center gap-2 border-b border-slate-800 pb-2">
                <span class="text-xl">🧙‍♂️</span>
                <div>
                  <h4 class="text-xs font-bold text-white">AI Campaign Chronicler</h4>
                  <p class="text-[10px] text-slate-400">Transforms micro-notes into a narrative session chronicle or quest dossier.</p>
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-[11px] font-bold text-slate-300">Synthesis Scope:</label>
                <select id="hub-ai-scope-select" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400">
                  <option value="all">🌐 All Notes in Active Notebook</option>
                  <option value="tag">🏷️ Selected Tag Group</option>
                  <option value="recent5">⏱️ Last 5 Notes (Latest Session)</option>
                  <option value="recent10">⏱️ Last 10 Notes</option>
                </select>
                <div id="hub-ai-scope-tag-picker" class="hidden pt-1">
                  <select id="hub-ai-tag-select" class="w-full bg-slate-950 border border-indigo-700/60 rounded-lg px-2.5 py-1.5 text-xs text-indigo-300 font-mono focus:outline-none"></select>
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold text-slate-300">Synthesis Format:</label>
                <div class="space-y-1.5" id="hub-ai-modes-container">
                  <label class="flex items-start gap-2.5 p-2 rounded-xl border border-indigo-500/50 bg-indigo-950/40 cursor-pointer transition hover:bg-indigo-950/60">
                    <input type="radio" name="hub-ai-mode" value="narrative" checked class="mt-0.5 text-indigo-500 focus:ring-0">
                    <div><div class="text-xs font-bold text-indigo-200">📖 Session Chronicle &amp; Narrative</div><div class="text-[10px] text-slate-400 leading-tight">Transforms notes into a fluent, atmospheric roleplaying chronicle.</div></div>
                  </label>
                  <label class="flex items-start gap-2.5 p-2 rounded-xl border border-slate-800 bg-slate-900/60 cursor-pointer transition hover:bg-slate-800/60">
                    <input type="radio" name="hub-ai-mode" value="quests" class="mt-0.5 text-indigo-500 focus:ring-0">
                    <div><div class="text-xs font-bold text-sky-300">🎯 Quest &amp; Clues Dossier</div><div class="text-[10px] text-slate-400 leading-tight">Organizes active/completed quests and clues with [ ] checkboxes.</div></div>
                  </label>
                  <label class="flex items-start gap-2.5 p-2 rounded-xl border border-slate-800 bg-slate-900/60 cursor-pointer transition hover:bg-slate-800/60">
                    <input type="radio" name="hub-ai-mode" value="dramatis" class="mt-0.5 text-indigo-500 focus:ring-0">
                    <div><div class="text-xs font-bold text-purple-300">👥 Dramatis Personae &amp; Locations</div><div class="text-[10px] text-slate-400 leading-tight">Compiles an encyclopedic directory of encountered NPCs and locations.</div></div>
                  </label>
                  <label class="flex items-start gap-2.5 p-2 rounded-xl border border-slate-800 bg-slate-900/60 cursor-pointer transition hover:bg-slate-800/60">
                    <input type="radio" name="hub-ai-mode" value="loot" class="mt-0.5 text-indigo-500 focus:ring-0">
                    <div><div class="text-xs font-bold text-amber-300">💎 Treasure &amp; Loot Ledger</div><div class="text-[10px] text-slate-400 leading-tight">Lists acquired loot, coinage, and magic items.</div></div>
                  </label>
                </div>
              </div>
              <button type="button" id="hub-ai-run-btn" onclick="HubNotes.runAiChronicler()" class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/60 transition active:scale-95 cursor-pointer">
                <span>✨</span><span>Synthesize &amp; Generate</span>
              </button>
            </div>
            <div class="flex-1 flex flex-col p-4 space-y-3 bg-[#131d33] overflow-y-auto min-h-0">
              <div class="flex items-center justify-between border-b border-slate-800 pb-2.5 shrink-0 flex-wrap gap-2">
                <span id="hub-ai-status-badge" class="text-xs font-mono text-slate-400">Standby</span>
                <div id="hub-ai-output-actions" class="hidden flex items-center gap-2">
                  <button type="button" onclick="HubNotes.saveAiSynthesisAsNote()" class="px-3 py-1.5 rounded-lg text-xs font-bold transition bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95">
                    <span>📌</span><span>Save as Pinned Note</span>
                  </button>
                  <button type="button" onclick="HubNotes.copyAiSynthesisToClipboard()" class="px-3 py-1.5 rounded-lg text-xs font-bold transition bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer">
                    <span>📋</span><span>Copy</span>
                  </button>
                </div>
              </div>
              <div id="hub-ai-result-container" class="flex-1 overflow-y-auto bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 leading-relaxed font-sans custom-scrollbar min-h-[300px]">
                <div class="h-full flex flex-col items-center justify-center text-center text-slate-500 gap-2 py-12">
                  <span class="text-3xl opacity-50">🧙‍♂️✨</span>
                  <p class="font-semibold text-slate-400">Synthesis has not been started yet.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalWrapper);

    const aiScope = document.getElementById('hub-ai-scope-select');
    const aiTagPicker = document.getElementById('hub-ai-scope-tag-picker');
    if (aiScope && aiTagPicker) {
      aiScope.addEventListener('change', () => {
        if (aiScope.value === 'tag') aiTagPicker.classList.remove('hidden');
        else aiTagPicker.classList.add('hidden');
      });
    }
  }

  /**
   * Mounts the complete Smart Notes inline widget into a container element on `index.html`
   * and ensures the Full Notes Modal (Editor + SVG Mindmap + AI Chronicler) is ready.
   */
  function mountCharacterNotesWidget(containerId) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return;

    ensureModalDom();

    if (!document.getElementById('hub-inline-notes-list')) {
      container.innerHTML = `
        <div class="bg-[#131d33] border border-slate-700/80 rounded-2xl p-3.5 shadow-xl flex flex-col space-y-2.5 relative overflow-hidden">
          <div class="flex items-center justify-between border-b border-slate-700/80 pb-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-6 h-6 rounded-lg bg-indigo-600/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400 shrink-0 text-xs">📜</span>
              <div class="min-w-0">
                <h3 class="text-xs font-black text-white uppercase tracking-wider truncate" id="hub-notes-panel-badge">Smart Character Notes</h3>
                <div class="text-[10px] text-slate-400 font-mono"><span id="hub-notes-panel-count">0</span> Notes • Cloud &amp; HUB Synced 📌</div>
              </div>
            </div>
            <div class="flex items-center gap-1.5">
              <button type="button" onclick="HubNotes.openFullNotesModal(null, 'mindmap')" class="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 hover:text-white transition flex items-center gap-1 text-xs font-bold shadow cursor-pointer" title="Open Relational Tag Mindmap (SVG)">
                <span>🕸️</span><span class="hidden sm:inline text-[10px]">Mindmap</span>
              </button>
              <button type="button" onclick="HubNotes.openFullNotesModal(null, 'ai')" class="px-2.5 py-1 rounded-lg bg-purple-950 hover:bg-purple-900 border border-purple-700/60 text-purple-300 hover:text-white transition flex items-center gap-1 text-xs font-bold shadow cursor-pointer" title="Open AI Campaign Chronicler">
                <span>✨</span><span class="hidden sm:inline text-[10px]">AI Chronicler</span>
              </button>
              <button type="button" onclick="HubNotes.openFullNotesModal(null, 'editor')" class="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/60 border border-indigo-500/50 text-indigo-200 hover:text-white transition flex items-center gap-1 text-xs font-bold shadow cursor-pointer" title="Open Fullscreen Notebook">
                <span>📝</span><span class="text-[10px]">Fullscreen</span>
              </button>
            </div>
          </div>

          <div class="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 shrink-0 text-xs">
            <button type="button" id="hub-notes-tab-write" onclick="HubNotes.switchPanelTab('write')" class="flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition flex items-center justify-center gap-1 bg-indigo-600 text-white shadow cursor-pointer">
              <span>✏️</span><span>Write Note</span>
            </button>
            <button type="button" id="hub-notes-tab-list" onclick="HubNotes.switchPanelTab('list')" class="flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition flex items-center justify-center gap-1 text-slate-400 hover:text-white cursor-pointer">
              <span>📋</span><span>Saved Notes (<span id="hub-notes-tab-count">0</span>)</span>
            </button>
          </div>

          <div id="hub-notes-write-view" class="flex flex-col space-y-2">
            <div id="hub-notes-pinned-strip" class="hidden shrink-0 space-y-1 bg-amber-950/20 border border-amber-500/30 rounded-xl p-2 text-xs">
              <div class="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1"><span>📌</span><span>Pinned Notes:</span></div>
              <div id="hub-notes-pinned-chips" class="flex flex-wrap gap-1 max-h-16 overflow-y-auto"></div>
            </div>

            <div class="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-3 flex flex-col space-y-2 focus-within:border-indigo-400 transition shadow-inner">
              <input type="text" id="hub-quick-note-title" placeholder="Note Title (Optional)..."
                class="w-full bg-transparent text-sm font-bold text-white placeholder-slate-500 focus:outline-none border-b border-slate-700/60 pb-1.5 font-sans"
                oninput="HubNotes.handleQuickInput(event)"
                onkeydown="HubNotes.handleQuickTitleKeydown(event)">
              <textarea id="hub-quick-note-input" rows="4"
                placeholder="Write your note here... (Supports #quest, #npc, #location, #loot tags and - [ ] task checkboxes)"
                class="w-full bg-transparent text-xs text-white placeholder-slate-500 font-sans focus:outline-none resize-y leading-relaxed"
                oninput="HubNotes.handleQuickInput(event)"
                onkeydown="HubNotes.handleQuickKeydown(event)"></textarea>
            </div>

            <div class="flex flex-col space-y-2 pt-0.5">
              <div class="grid grid-cols-5 gap-1.5 w-full text-[10px] font-mono">
                <button type="button" onclick="HubNotes.insertTagIntoQuickInput('#quest')" class="w-full py-1 px-1 rounded bg-sky-950/60 hover:bg-sky-900 border border-sky-800/60 text-sky-300 font-bold transition flex items-center justify-center cursor-pointer truncate">+ #quest</button>
                <button type="button" onclick="HubNotes.insertTagIntoQuickInput('#npc')" class="w-full py-1 px-1 rounded bg-purple-950/60 hover:bg-purple-900 border border-purple-800/60 text-purple-300 font-bold transition flex items-center justify-center cursor-pointer truncate">+ #npc</button>
                <button type="button" onclick="HubNotes.insertTagIntoQuickInput('#location')" class="w-full py-1 px-1 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 font-bold transition flex items-center justify-center cursor-pointer truncate">+ #location</button>
                <button type="button" onclick="HubNotes.insertTagIntoQuickInput('#loot')" class="w-full py-1 px-1 rounded bg-yellow-950/60 hover:bg-yellow-900 border border-yellow-800/60 text-yellow-300 font-bold transition flex items-center justify-center cursor-pointer truncate">+ #loot</button>
                <button type="button" onclick="HubNotes.insertTagIntoQuickInput('- [ ] ')" class="w-full py-1 px-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition flex items-center justify-center cursor-pointer truncate">+ To-Do</button>
              </div>
              <button type="button" onclick="HubNotes.addQuickNote()" class="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer">
                <span>➕</span><span>Save Note (Ctrl+Enter)</span>
              </button>
            </div>
          </div>

          <div id="hub-notes-list-view" class="hidden flex flex-col space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <div class="flex-1 min-w-[180px] flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 focus-within:border-indigo-400 transition">
                <span class="text-slate-500 text-xs">🔍</span>
                <input type="text" id="hub-inline-notes-search" oninput="HubNotes.handleSearchInput(this.value)" placeholder="Search notes or #tags..." class="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono">
              </div>
              <div class="flex items-center gap-1 overflow-x-auto text-[10px] font-mono">
                <button type="button" onclick="HubNotes.setTagFilter('all')" class="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer">#all</button>
                <button type="button" onclick="HubNotes.setTagFilter('#quest')" class="px-2 py-0.5 rounded-md bg-sky-950/60 hover:bg-sky-900 border border-sky-800/60 text-sky-300 transition cursor-pointer">#quest</button>
                <button type="button" onclick="HubNotes.setTagFilter('#npc')" class="px-2 py-0.5 rounded-md bg-purple-950/60 hover:bg-purple-900 border border-purple-800/60 text-purple-300 transition cursor-pointer">#npc</button>
                <button type="button" onclick="HubNotes.setTagFilter('#location')" class="px-2 py-0.5 rounded-md bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 transition cursor-pointer">#location</button>
                <button type="button" onclick="HubNotes.setTagFilter('#loot')" class="px-2 py-0.5 rounded-md bg-yellow-950/60 hover:bg-yellow-900 border border-yellow-800/60 text-yellow-300 transition cursor-pointer">#loot</button>
              </div>
            </div>
            <div id="hub-inline-notes-list" class="max-h-80 overflow-y-auto space-y-2 pr-1"></div>
          </div>
        </div>
      `;
    }

    renderInlineNotes();
  }

  // Global Exports
  window.HubNotes = {
    getActiveNotesTarget,
    ensureSmartNotesArray,
    ensureModalDom,
    mountCharacterNotesWidget,
    renderInlineNotes,
    switchPanelTab,
    addQuickNote,
    insertTagIntoQuickInput,
    togglePinNote,
    toggleCompleteNote,
    deleteNote,
    openFullNotesModal,
    openCharacterNotebookModal,
    closeFullNotesModal,
    selectNoteInModal,
    handleEditorInput,
    handleEditorKeydown,
    handleTitleKeydown,
    handleQuickTitleKeydown,
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

  window.addEventListener('storage', (e) => {
    if (e.key === 'dnd35_hub_db' || e.key === 'dnd35_character' || e.key === 'dnd35_character_v2') {
      try {
        renderInlineNotes();
        const modal = document.getElementById('hub-full-notes-modal');
        if (modal && !modal.classList.contains('hidden')) {
          const target = getActiveNotesTarget();
          if (target && target.notesList.length > 0 && !_selectedModalNoteId) {
            _selectedModalNoteId = target.notesList[0].id;
          }
          renderFullNotesModalList();
          loadSelectedNoteIntoEditor();
          if (_activeModalView === 'mindmap') renderMindmap();
        }
      } catch (err) {}
    }
  });

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