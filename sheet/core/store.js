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
 * @property {Record<string, any>|null} character   Resolved character (read-only clone in Phase A).
 * @property {{ source: string, requestedId: string|null, notes: string[] }} load
 * @property {{ compendium: 'idle'|'loading'|'ready'|'error', ruleEngine: boolean, migrator: boolean, error?: string }} engine
 * @property {{ activeTab: string }} ui
 * @property {boolean} readOnly                      Phase A: always true. Writes are refused.
 */

/** @returns {SheetState} */
export function createInitialState() {
  return {
    status: 'loading',
    character: null,
    load: { source: 'none', requestedId: null, notes: [] },
    engine: { compendium: 'idle', ruleEngine: false, migrator: false },
    ui: { activeTab: 'character' },
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
