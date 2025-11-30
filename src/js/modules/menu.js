// Ініціалізація мобільного меню (офканвас)
import { CLASSES } from './constants';
import { enableScroll, disableScroll } from './functions';
import {
  BREAKPOINT_QUERY,
  DATA_STATE,
  UI_EVENTS,
  ROOT,
  trapFocus,
  getFocusable,
  setAriaExpanded,
  ensureRoleDialog,
} from './ui-helpers';

/** Ініціалізація меню. Без сайд-ефектів до виклику. */
export function initMenu() {
  const menu = document.querySelector('[data-menu]');
  if (!menu) return;

  const menuBtn = menu.querySelector('[data-menu-burger]');
  const menuBody = menu.querySelector('[data-menu-body]');
  const menuOverlay = menu.querySelector('[data-menu-overlay]');
  const main = document.querySelector('main');

  if (!menuBtn || !menuBody) return;

  // a11y
  if (!menuBody.id) menuBody.id = 'site-menu';

  menuBtn.setAttribute('aria-controls', menuBody.id);
  ensureRoleDialog(menuBody);
  setAriaExpanded(menuBtn, false);

  const isOpen = () => menuBody.getAttribute(DATA_STATE) === 'open';

  function onKeydown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      setMenuOpen(false);
      return;
    }

    if (isOpen()) trapFocus(menuBody, e);
  }

  function setMenuOpen(open) {
    if (open) {
      ROOT.setAttribute('data-scroll-locked', 'true');
      ROOT.dispatchEvent(
        new CustomEvent(UI_EVENTS.SCROLL_LOCK, { detail: { locked: true } })
      );

      menuBody.removeAttribute('inert');
      main?.setAttribute('inert', '');

      disableScroll();
    } else {
      menuBody.setAttribute('inert', '');
      main?.removeAttribute('inert');

      enableScroll();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          ROOT.removeAttribute('data-scroll-locked');
          ROOT.dispatchEvent(
            new CustomEvent(UI_EVENTS.SCROLL_LOCK, {
              detail: { locked: false },
            })
          );
        });
      });
    }

    menuBody.setAttribute(DATA_STATE, open ? 'open' : 'closed');
    menuBtn.classList.toggle(CLASSES.ACTIVE, open);
    menuBody.classList.toggle(CLASSES.ACTIVE, open);
    setAriaExpanded(menuBtn, open);

    if (open) {
      const focusables = getFocusable(menuBody);
      (focusables[0] || menuBody).focus();

      document.addEventListener('keydown', onKeydown, true);
    } else {
      document.removeEventListener('keydown', onKeydown, true);
    }
  }

  // Делегування кліків всередині меню
  menuBody.addEventListener('click', e => {
    const arrow = e.target.closest('[data-menu-arrow]');
    if (arrow && menuBody.contains(arrow)) {
      e.preventDefault();
      e.stopPropagation();

      const parent = arrow.parentElement;
      parent?.classList.toggle(CLASSES.ACTIVE);

      const expanded = parent?.classList.contains(CLASSES.ACTIVE);
      arrow.setAttribute('aria-expanded', String(!!expanded));
      return;
    }

    // Закривати меню при виборі пункту (якщо не позначено [data-menu-noclose])
    const item = e.target.closest('[data-menu-item]');
    if (item && !item.closest('[data-menu-noclose]')) {
      setMenuOpen(false);
    }
  });

  // Тригер
  menuBtn.addEventListener('click', e => {
    e.preventDefault();
    setMenuOpen(!isOpen());
  });

  // Оверлей або клік поза меню
  if (menuOverlay) {
    menuOverlay.addEventListener('click', () => setMenuOpen(false));
    menuOverlay.addEventListener('pointerdown', () => setMenuOpen(false));
  } else {
    document.addEventListener('pointerdown', e => {
      if (!isOpen()) return;
      if (!menuBody.contains(e.target) && e.target !== menuBtn) {
        setMenuOpen(false);
      }
    });
  }

  // Режими мобайл/десктоп
  function setupMenu(isMobile) {
    if (isMobile) {
      menuBody.setAttribute('inert', '');

      setMenuOpen(false);
    } else {
      setMenuOpen(false);

      menuBody.removeAttribute('inert');
    }
  }

  const mql = window.matchMedia(BREAKPOINT_QUERY);
  const applyMql = () => setupMenu(mql.matches);

  // Початковий стан + підписка на зміни
  applyMql();

  if (mql.addEventListener) mql.addEventListener('change', applyMql);
  else mql.addListener(applyMql); // Safari < 14
}
