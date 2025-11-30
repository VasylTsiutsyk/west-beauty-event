import { CLASSES } from './constants';
import { UI_EVENTS, ROOT } from './ui-helpers';

export function initHeader(options = {}) {
  const {
    selector = '.header',
    isScrolled = true,
    isHidden = true,
    hideThreshold = 12,
    revealTopOffset = 8,
    respectReducedMotion = true,
  } = options;

  const header = document.querySelector(selector);
  if (!header) return;

  // CSS var через ResizeObserver (без reflow у scroll)
  const setHeaderHeight = h =>
    ROOT.style.setProperty('--header-height', `${h}px`);

  const ro = new ResizeObserver(entries => {
    for (const entry of entries) {
      const h = Math.round(entry.target.getBoundingClientRect().height);
      setHeaderHeight(h);
    }
  });
  ro.observe(header);

  let lastY = window.scrollY;
  let ticking = false;

  // Підтримка заморозки стану під час scroll-lock
  let scrollLocked = ROOT.hasAttribute('data-scroll-locked');
  let forcedScrolled = null; // true/false коли меню відкрите

  ROOT.addEventListener(UI_EVENTS.SCROLL_LOCK, e => {
    scrollLocked = !!e.detail?.locked;

    if (scrollLocked) {
      forcedScrolled =
        header.classList.contains(CLASSES.SCROLLED) ||
        (e.detail?.y ?? window.scrollY) > 0;
      header.classList.toggle(CLASSES.SCROLLED, !!forcedScrolled);
      header.classList.remove(CLASSES.HIDDEN);
    } else {
      forcedScrolled = null;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          onScroll();
        });
      });
    }
  });

  const prefersReduced =
    respectReducedMotion &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function onScroll() {
    const y = window.scrollY;

    if (scrollLocked) {
      if (isScrolled)
        header.classList.toggle(CLASSES.SCROLLED, !!forcedScrolled);
      return;
    }

    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (isScrolled) {
          const headerH =
            parseFloat(
              getComputedStyle(ROOT).getPropertyValue('--header-height')
            ) || header.offsetHeight;

          if (y >= headerH) header.classList.add(CLASSES.SCROLLED);
          else header.classList.remove(CLASSES.SCROLLED);
        }

        if (isHidden && !prefersReduced) {
          const delta = y - lastY;
          const pastTop = y > revealTopOffset;

          if (pastTop && Math.abs(delta) > hideThreshold) {
            if (delta > 0) header.classList.add(CLASSES.HIDDEN);
            else header.classList.remove(CLASSES.HIDDEN);
          }
          if (!pastTop) header.classList.remove(CLASSES.HIDDEN);
        }

        lastY = y;
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  setHeaderHeight(header.offsetHeight);
}
