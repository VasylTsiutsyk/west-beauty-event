// js/modules/animations.js

// ==================== ANIMATIONS ==================== //

import AOS from 'aos';
import 'aos/dist/aos.css';

// -----------------------------------------------------------------------------
function initAosAnimations() {
  AOS.init({
    duration: 800,
    easing: 'ease-out-cubic',
    once: true, // запускати анімацію один раз
    mirror: false, // не анімувати назад при прокрутці вверх
    disable: 'mobile', // кращий варіант, ніж просто 'mobile'
    offset: -380,
  });

  // Додатковий тригер для кастомних функцій при вході елемента
  // document.addEventListener('aos:in', ({ detail }) => {
  //   if (detail.classList.contains('anim-value')) {
  //     animateValue(detail, parseFloat(detail.firstChild.innerText), 600);
  //   }
  // });
}

export { initAosAnimations };
