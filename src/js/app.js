/* eslint-disable import/extensions */
/* eslint-disable node/no-unsupported-features/es-syntax */

import { SELECTORS, CLASSES } from './modules/constants';
import { isWebp, isMobile } from './modules/functions';
import { initMenu } from './modules/menu';
import { initHeader } from './modules/header';
import { initAosAnimations } from './modules/animations';
import initContentTabs from './modules/content-tabs';

document.addEventListener('DOMContentLoaded', () => {
  // IS WEBP TEST
  isWebp();

  // IS MOBILE TEST
  isMobile();

  // HEADER MOBILE MENU
  initMenu();

  // ANIMATIONS
  initAosAnimations();

  // HEADER SCROLLED STATE
  initHeader({
    selector: '.header',
    isScrolled: true,
    isHidden: true,
  });

  // Content Tabs
  initContentTabs();

  SELECTORS.BODY.classList.add(CLASSES.LOADED);
});
