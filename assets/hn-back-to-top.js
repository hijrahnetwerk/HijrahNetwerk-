/* HN Back to Top — publieke site, zichtbaar na voldoende scrollen. */
(() => {
  'use strict';
  if (document.getElementById('hn-back-to-top')) return;

  const button = document.createElement('button');
  button.id = 'hn-back-to-top';
  button.type = 'button';
  button.className = 'hn-back-to-top';
  button.setAttribute('aria-label', 'Terug naar boven');
  button.setAttribute('title', 'Terug naar boven');
  button.innerHTML = '<span class="hn-back-to-top-icon" aria-hidden="true">↑</span><span class="hn-back-to-top-label">Naar boven</span>';
  button.hidden = true;
  document.body.appendChild(button);

  let ticking = false;
  function updateVisibility() {
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const current = window.scrollY || document.documentElement.scrollTop || 0;
    const threshold = Math.min(420, Math.max(180, maxScroll * 0.42));
    button.hidden = maxScroll < 180 || current < threshold;
    ticking = false;
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateVisibility);
  }
  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('load', updateVisibility);
  updateVisibility();
})();