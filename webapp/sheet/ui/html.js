// @ts-check
/**
 * Safe-by-default HTML templating for Sheet V3.
 *
 * Every `${value}` interpolated into an `html` template is HTML-escaped unless it is itself the
 * result of `html` (a SafeHtml). This removes the need for ad-hoc escaping (`safeIdAttr`,
 * `safeEscapeHtml`) at every call site. Inline event handlers are never used: interactions
 * are declared with `data-action` and handled by ui/delegate.js.
 */

export class SafeHtml {
  /** @param {string} value */
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}

const ESCAPES = /** @type {Record<string, string>} */ ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;'
});

/** @param {unknown} value */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"'`]/g, ch => ESCAPES[ch]);
}

/** @param {unknown} value @returns {string} */
function renderValue(value) {
  if (value === null || value === undefined || value === false) return '';
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(renderValue).join('');
  return escapeHtml(value);
}

/**
 * @param {TemplateStringsArray} strings
 * @param {...unknown} values
 * @returns {SafeHtml}
 */
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    out += renderValue(values[i]) + strings[i + 1];
  }
  return new SafeHtml(out);
}

/**
 * Replace a container's content with a template result. A focused field with an `id` keeps
 * focus and caret across the re-render, so typing in a search box is not interrupted.
 * @param {Element} container
 * @param {SafeHtml} template
 */
export function mount(container, template) {
  const active = typeof document !== 'undefined' ? document.activeElement : null;
  const focusId = active && active.id && container.contains(active) ? active.id : null;
  const caret = active instanceof HTMLInputElement ? [active.selectionStart, active.selectionEnd] : null;
  container.innerHTML = template.value;
  if (!focusId) return;
  const next = document.getElementById(focusId);
  if (!next) return;
  next.focus();
  if (caret && next instanceof HTMLInputElement && caret[0] !== null) next.setSelectionRange(caret[0], caret[1]);
}
