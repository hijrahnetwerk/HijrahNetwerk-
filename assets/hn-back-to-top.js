/* HN-terug-naar-boven: pictogramknop, pas zichtbaar vlak bij het pagina-einde. */
(() => {
  'use strict';
  if (document.getElementById('hn-back-to-top')) return;
  const button = document.createElement('button');
  button.id = 'hn-back-to-top';
  button.type = 'button';
  button.className = 'hn-back-to-top';
  button.setAttribute('aria-label', 'Terug naar boven');
  button.setAttribute('title', 'Terug naar boven');
  button.setAttribute('aria-hidden', 'true');
  button.innerHTML = '<svg class="hn-back-to-top-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 19V5M6.5 10.5 12 5l5.5 5.5"/></svg>';
  document.body.appendChild(button);
  let ticking = false;
  function updateVisibility() {
    const doc = document.documentElement;
    const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
    const current = Math.max(window.scrollY || 0, doc.scrollTop || 0);
    const remaining = maxScroll - current;
    const nearBottomDistance = Math.max(280, Math.min(560, maxScroll * 0.12));
    const visible = maxScroll > 400 && remaining <= nearBottomDistance;
    button.classList.toggle('is-visible', visible);
    button.setAttribute('aria-hidden', visible ? 'false' : 'true');
    button.tabIndex = visible ? 0 : -1;
    ticking = false;
  }
  function scheduleUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateVisibility);
  }
  button.addEventListener('click', () => {
    window.scrollTo({top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  });
  window.addEventListener('scroll', scheduleUpdate, {passive: true});
  window.addEventListener('resize', scheduleUpdate, {passive: true});
  window.addEventListener('load', scheduleUpdate);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleUpdate).observe(document.body);
  scheduleUpdate();
})();