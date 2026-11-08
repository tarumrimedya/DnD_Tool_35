// @ts-check
/**
 * One click listener per root instead of inline `onclick="fn(${id})"` strings.
 *
 * Markup declares intent:  <button data-action="select-tab" data-tab="character">
 * Handlers receive the element's dataset, so ids always arrive as strings, never
 * re-parsed JS literals.
 */

/**
 * @typedef {(data: DOMStringMap, el: HTMLElement, event: Event) => void} ActionHandler
 */

/**
 * @param {Element} root
 * @param {Record<string, ActionHandler>} handlers
 * @returns {() => void} detach
 */
export function delegateActions(root, handlers) {
  /** @param {Event} event */
  const onClick = event => {
    const target = event.target instanceof Element ? event.target : null;
    const el = /** @type {HTMLElement|null} */ (target?.closest('[data-action]') ?? null);
    if (!el || !root.contains(el)) return;
    if (el instanceof HTMLButtonElement && el.disabled) return;
    const name = el.dataset.action || '';
    const handler = handlers[name];
    if (!handler) {
      console.warn(`[Sheet V3] No handler for data-action="${name}"`);
      return;
    }
    event.preventDefault();
    handler(el.dataset, el, event);
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}
