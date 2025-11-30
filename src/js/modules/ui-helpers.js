// Спільні константи та утиліти для UI-модулів
import { SELECTORS } from './constants';

export const BREAKPOINT_QUERY = '(max-width: 61.99rem)'; // 992px
export const DATA_STATE = 'data-state'; // open | closed
export const UI_EVENTS = { SCROLL_LOCK: 'ui:scroll-lock' };
export const ROOT = SELECTORS?.ROOT || document.documentElement;

export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** @param {HTMLElement} container */
export function getFocusable(container) {
  return container
    ? Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
    : [];
}

/** Trap focus всередині контейнeра */
export function trapFocus(container, e) {
  const nodes = getFocusable(container);
  if (!nodes.length || e.key !== 'Tab') return;

  const first = nodes[0];
  const last = nodes[nodes.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/** aria-expanded + aria-label для кнопок-тригерів */
export function setAriaExpanded(btn, expanded) {
  btn?.setAttribute('aria-expanded', String(expanded));
  btn?.setAttribute('aria-label', expanded ? 'Close Menu' : 'Open Menu');
}

/** role="dialog" + aria-modal для офканвас контейнерів */
export function ensureRoleDialog(el) {
  if (!el) return;
  if (!el.hasAttribute('role')) el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
}
