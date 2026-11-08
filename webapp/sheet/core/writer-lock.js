// @ts-check
/**
 * Sheet V3 writer lock (docs/V3_DATA_SCHEMA.md section 7).
 *
 * One V3 tab at a time may write a character. Uses the Web Locks API: the browser releases the
 * lock when the holding tab closes or crashes, so there is no heartbeat and no stale lock.
 *
 * - `acquire()` takes the lock only if it is free (`ifAvailable`).
 * - `acquire({ takeOver: true })` takes it from another tab (`steal`); that tab is told it lost it.
 * - `release()` gives it back.
 *
 * The classic sheet does not know this lock. Its writes are caught by the stored-copy check in
 * persistence.js `planSave` instead.
 */

/** Lock name per character, so two different characters can be edited in two tabs. */
export const lockName = (/** @type {string} */ characterId) => `dnd35-writer:${characterId}`;

/**
 * @typedef {{ request: (name: string, options: Record<string, any>, cb: (lock: any) => Promise<any>|any) => Promise<any> }} LockManagerLike
 * @typedef {'idle'|'held'|'busy'|'lost'|'unsupported'} LockStatus
 */

/**
 * @param {{ locks: LockManagerLike|undefined|null, characterId: string, onChange?: (status: LockStatus) => void }} options
 */
export function createWriterLock({ locks, characterId, onChange = () => {} }) {
  /** @type {LockStatus} */
  let status = locks ? 'idle' : 'unsupported';
  /** @type {(() => void)|null} */
  let releaseHeld = null;
  let generation = 0;

  /** @param {LockStatus} next */
  const set = next => {
    if (status === next) return;
    status = next;
    onChange(next);
  };

  return {
    /** @returns {LockStatus} */
    get status() {
      return status;
    },

    /**
     * @param {{ takeOver?: boolean }} [options]
     * @returns {Promise<LockStatus>}
     */
    acquire({ takeOver = false } = {}) {
      if (!locks) return Promise.resolve(status);
      if (status === 'held') return Promise.resolve(status);
      const mine = ++generation;
      return new Promise(resolveAcquire => {
        const options = takeOver ? { steal: true } : { ifAvailable: true };
        locks.request(lockName(characterId), options, lock => {
          if (!lock) {
            set('busy');
            resolveAcquire(status);
            return undefined;
          }
          set('held');
          resolveAcquire(status);
          // Hold the lock until release() or until another tab steals it.
          return new Promise(resolveHeld => {
            releaseHeld = () => resolveHeld(undefined);
          });
        }).then(
          () => {
            if (mine === generation && status === 'held') set('idle');
          },
          (/** @type {any} */ err) => {
            // A steal by another tab rejects the holder's request with AbortError.
            releaseHeld = null;
            if (mine !== generation) return;
            if (err && err.name === 'AbortError' && status === 'held') set('lost');
            else if (status !== 'held') { set('busy'); resolveAcquire(status); }
          }
        );
      });
    },

    release() {
      generation++;
      const r = releaseHeld;
      releaseHeld = null;
      if (r) r();
      if (status === 'held' || status === 'busy' || status === 'lost') set('idle');
    }
  };
}
