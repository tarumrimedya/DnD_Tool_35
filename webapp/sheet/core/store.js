// @ts-check
/**
 * Sheet V3 store: the single source of state for the page.
 *
 * - State is replaced, never mutated in place: every update produces a new top-level object.
 * - Views subscribe with a selector and re-render only when the selected slice changes (Object.is).
 * - All mutations go through named actions (registered in actions.js) so they can be logged,
 *   undone, and checked against the read-only guard.
 */

/**
 * @typedef {Object} SheetState
 * @property {'loading'|'ready'|'empty'|'error'} status
 * @property {Record<string, any>|null} character   Resolved character, V3 in-memory shape (storage-codec.js).
 * @property {{ source: string, requestedId: string|null, notes: string[] }} load
 * @property {{ compendium: 'idle'|'loading'|'ready'|'error', ruleEngine: boolean, migrator: boolean, error?: string }} engine
 * @property {{ status: 'pending'|'done'|'error', applied: string[], notes: string[], error?: string }} migration
 *   V3 migrations. Applied in memory on load; saved with the first edit.
 * @property {{ activeTab: string, skills: import('./derive-skills.js').SkillView, featsOpen: boolean }} ui
 * @property {WriteState} write
 * @property {boolean} readOnly                      True unless this tab holds the writer lock and has no conflict.
 */

/**
 * @typedef {Object} WriteState
 * @property {import('./writer-lock.js').LockStatus|'requesting'} lock
 * @property {'idle'|'saved'|'conflict'|'error'} save
 * @property {string|null} savedAt
 * @property {string|null} message
 */

/** @returns {SheetState} */
export function createInitialState() {
  return {
    status: 'loading',
    character: null,
    load: { source: 'none', requestedId: null, notes: [] },
    engine: { compendium: 'idle', ruleEngine: false, migrator: false },
    migration: { status: 'pending', applied: [], notes: [] },
    ui: { activeTab: 'character', skills: { filter: 'class', stat: 'all', search: '' }, featsOpen: false },
    write: { lock: 'idle', save: 'idle', savedAt: null, message: null },
    readOnly: true
  };
}

/**
 * @template S
 * @param {S} initialState
 */
export function createStore(initialState) {
  let state = initialState;
  /** @type {Set<() => void>} */
  const listeners = new Set();

  return {
    /** @returns {S} */
    getState() {
      return state;
    },

    /**
     * Replace state with the result of `updater`. The updater must return a new object
     * (or the same object to signal "no change").
     * @param {(prev: S) => S} updater
     */
    setState(updater) {
      const next = updater(state);
      if (next === state) return;
      state = next;
      listeners.forEach(fn => fn());
    },

    /**
     * Subscribe to a derived slice. `onChange` runs immediately and then whenever the slice changes.
     * @template T
     * @param {(s: S) => T} selector
     * @param {(value: T, prev: T|undefined) => void} onChange
     * @returns {() => void} unsubscribe
     */
    select(selector, onChange) {
      let current = selector(state);
      onChange(current, undefined);
      const listener = () => {
        const next = selector(state);
        if (Object.is(next, current)) return;
        const prev = current;
        current = next;
        onChange(next, prev);
      };
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}

/**
 * Writes are allowed only while this tab holds the lock and the last save did not hit a conflict
 * or a storage error (both need a reload first).
 * @param {WriteState} w
 */
export function isReadOnly(w) {
  return w.lock !== 'held' || w.save === 'conflict' || w.save === 'error';
}
