// js/modules/accordion.js

/**
 * Accessible Accordion with data-attrs, inert+hidden, animated height via CSS grid,
 * roving focus (↑/↓/Home/End), and options: showOnlyOne (per group) + closeOnClickOutside.
 *
 * Markup contract:
 * - [data-accordion-group] — optional wrapper around a set of accordions
 * - [data-accordion] — root of a single item; optional [data-open] for default-open
 * - [data-accordion-btn] — the toggle button (inside heading is recommended)
 * - [data-accordion-content] — the panel to expand/collapse
 * - [data-accordion-plus] — optional visual “+” element
 */

const SEL = {
  GROUP: '[data-accordion-group]',
  ITEM: '[data-accordion]',
  BTN: '[data-accordion-btn]',
  CONTENT: '[data-accordion-content]',
  PLUS: '[data-accordion-plus]',
};

let uidCounter = 0;
let outsideClickBound = false;

/** Utils */
const uid = (p = 'acc') =>
  `${p}-${Math.random().toString(36).slice(2, 8)}-${uidCounter++}`;

function isOpen(item) {
  return item.getAttribute('data-state') === 'open';
}

function setState(item, state) {
  item.setAttribute('data-state', state); // "open" | "closed" | "closing"
}

function qs(el, sel) {
  return el.querySelector(sel);
}

function qsa(el, sel) {
  return Array.from(el.querySelectorAll(sel));
}

/** ARIA + IDs one-time wiring */
function wireA11y(item, btn, panel) {
  if (!btn.id) btn.id = uid('acc-btn');
  if (!panel.id) panel.id = uid('acc-panel');

  btn.setAttribute('aria-controls', panel.id);
  btn.setAttribute('aria-expanded', 'false');
  btn.type = btn.type || 'button'; // safety

  if (!panel.hasAttribute('role')) panel.setAttribute('role', 'region');
  panel.setAttribute('aria-labelledby', btn.id);
  panel.setAttribute('aria-hidden', 'true');
}

/** Hidden/inert helpers with transition-friendly timing */
function revealPanel(panel) {
  panel.hidden = false;
  panel.removeAttribute('inert');
  panel.setAttribute('aria-hidden', 'false');
}

function concealPanelAfterTransition(item, panel) {
  // wait for CSS transition (grid-template-rows) to finish before hiding
  const onEnd = e => {
    if (e.target !== panel) return;
    panel.hidden = true;
    panel.setAttribute('inert', '');
    panel.setAttribute('aria-hidden', 'true');
    setState(item, 'closed');
    panel.removeEventListener('transitionend', onEnd);
  };

  panel.addEventListener('transitionend', onEnd, { once: true });
}

/** Open/Close core */
function openAccordion(item, btn, panel) {
  if (isOpen(item)) return;

  revealPanel(panel);
  setState(item, 'open');
  btn.setAttribute('aria-expanded', 'true');
}

function closeAccordion(item, btn, panel) {
  if (!isOpen(item)) return;

  setState(item, 'closing'); // allows CSS to animate to 0fr
  btn.setAttribute('aria-expanded', 'false');
  concealPanelAfterTransition(item, panel);
}

/** Toggle with group logic */
function toggleAccordion(item, { showOnlyOne }) {
  const btn = qs(item, SEL.BTN);
  const panel = qs(item, SEL.CONTENT);
  if (!btn || !panel) return;

  const group = item.closest(SEL.GROUP) || document;

  if (!isOpen(item)) {
    if (showOnlyOne) {
      qsa(group, `${SEL.ITEM}[data-state="open"]`).forEach(openItem => {
        if (openItem === item) return;
        const b = qs(openItem, SEL.BTN);
        const p = qs(openItem, SEL.CONTENT);
        closeAccordion(openItem, b, p);
      });
    }

    openAccordion(item, btn, panel);
  } else {
    closeAccordion(item, btn, panel);
  }
}

/** Roving focus across buttons within a group */
function setupRovingFocus(groupEl) {
  const buttons = qsa(groupEl, SEL.BTN);
  if (!buttons.length) return;

  // set initial roving
  buttons.forEach(b => b.setAttribute('tabindex', '-1'));
  (buttons[0] || buttons[0]).setAttribute('tabindex', '0');

  const moveFocus = delta => {
    const list = qsa(groupEl, SEL.BTN);
    const currentIndex = list.findIndex(
      b => b.getAttribute('tabindex') === '0'
    );
    let nextIndex = currentIndex + delta;
    if (nextIndex < 0) nextIndex = list.length - 1;
    if (nextIndex >= list.length) nextIndex = 0;

    list.forEach(b => b.setAttribute('tabindex', '-1'));
    const target = list[nextIndex];
    target.setAttribute('tabindex', '0');
    target.focus({ preventScroll: false });
  };

  groupEl.addEventListener('keydown', e => {
    const isBtn = e.target.matches(SEL.BTN);
    if (!isBtn) return;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        moveFocus(+1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        moveFocus(-1);
        break;
      case 'Home':
        e.preventDefault();
        {
          const list = qsa(groupEl, SEL.BTN);
          list.forEach(b => b.setAttribute('tabindex', '-1'));
          list[0].setAttribute('tabindex', '0');
          list[0].focus();
        }
        break;
      case 'End':
        e.preventDefault();
        {
          const list = qsa(groupEl, SEL.BTN);
          list.forEach(b => b.setAttribute('tabindex', '-1'));
          const last = list[list.length - 1];
          last.setAttribute('tabindex', '0');
          last.focus();
        }
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        e.target.click();
        break;
    }
  });

  // keep roving anchor on pointer activation too
  buttons.forEach(btn => {
    btn.addEventListener('mousedown', () => {
      buttons.forEach(b => b.setAttribute('tabindex', '-1'));
      btn.setAttribute('tabindex', '0');
    });
  });
}

/** Public init */
export default function initAccordions(
  selector = SEL.ITEM,
  { showOnlyOne = false, closeOnClickOutside = false } = {}
) {
  const items = document.querySelectorAll(selector);
  if (!items.length) return;

  // group-level roving focus
  const groups = new Set(
    Array.from(items).map(i => i.closest(SEL.GROUP) || document)
  );
  groups.forEach(g => setupRovingFocus(g));

  items.forEach(item => {
    const btn = qs(item, SEL.BTN);
    const panel = qs(item, SEL.CONTENT);
    if (!btn || !panel) return;

    wireA11y(item, btn, panel);

    // Initial state (from [data-open] or data-state="open")
    const initiallyOpen =
      item.hasAttribute('data-open') ||
      item.getAttribute('data-state') === 'open';
    if (initiallyOpen) {
      revealPanel(panel);
      setState(item, 'open');
      btn.setAttribute('aria-expanded', 'true');
    } else {
      panel.hidden = true;
      panel.setAttribute('inert', '');
      setState(item, 'closed');
    }

    // Click toggle
    btn.addEventListener('click', () => {
      toggleAccordion(item, { showOnlyOne });
    });
  });

  // Click outside (single global listener)
  if (closeOnClickOutside && !outsideClickBound) {
    outsideClickBound = true;
    document.addEventListener('click', e => {
      if (e.target.closest(SEL.ITEM)) return;
      document
        .querySelectorAll(`${SEL.ITEM}[data-state="open"]`)
        .forEach(openItem => {
          const b = qs(openItem, SEL.BTN);
          const p = qs(openItem, SEL.CONTENT);
          closeAccordion(openItem, b, p);
        });
    });
  }
}
