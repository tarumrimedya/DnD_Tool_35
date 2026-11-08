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

/**
 * Text and select inputs: `<input data-input="skill-search">`. Handlers receive the value, the
 * element's dataset and the element. `input` fires while typing, `change` for selects.
 * @param {Element} root
 * @param {Record<string, (value: string, data: DOMStringMap, el: HTMLElement) => void>} handlers
 * @returns {() => void} detach
 */
export function delegateInputs(root, handlers) {
  /** @param {Event} event */
  const onInput = event => {
    const el = event.target;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement)) return;
    if (!root.contains(el) || !el.dataset.input) return;
    if (event.type === 'change' && el instanceof HTMLInputElement && el.type === 'text') return; // already handled on input
    const handler = handlers[el.dataset.input];
    if (!handler) {
      console.warn(`[Sheet V3] No handler for data-input="${el.dataset.input}"`);
      return;
    }
    handler(el.value, el.dataset, el);
  };
  root.addEventListener('input', onInput);
  root.addEventListener('change', onInput);
  return () => {
    root.removeEventListener('input', onInput);
    root.removeEventListener('change', onInput);
  };
}
