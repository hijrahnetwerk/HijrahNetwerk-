(function(){
  'use strict';

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const setup = function () {
    if (document.documentElement.classList.contains('hn-reveal-ready')) return;

    const selectors = [
      'main > section',
      'main > div > section',
      '.hero',
      '.filters',
      '.results-header',
      '.results > *',
      '.cards > *',
      '.grid > *',
      '.layout > .main > .card',
      '.layout > .side > .card',
      '.layout > .card',
      '.panel',
      '.card'
    ];

    const seen = new Set();
    const elements = [];

    selectors.forEach(function(selector){
      document.querySelectorAll(selector).forEach(function(el){
        if (seen.has(el)) return;
        seen.add(el);
        elements.push(el);
      });
    });

    if (!elements.length) return;

    let delayIndex = 0;

    elements.forEach(function(el){
      if (el.closest('header, nav, footer')) return;
      el.setAttribute('data-reveal', 'true');

      const index = delayIndex++;
      const delay = Math.min((index % 6) * 70, 350);
      el.style.setProperty('--reveal-delay', delay + 'ms');
    });

    document.documentElement.classList.add('hn-reveal-ready');

    const observer = new IntersectionObserver(function(entries, obs){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        entry.target.classList.add('hn-reveal-visible');
        obs.unobserve(entry.target);
      });
    },{
      threshold: 0.08,
      rootMargin: '0px 0px -35px 0px'
    });

    document.querySelectorAll('[data-reveal="true"]').forEach(function(el){
      observer.observe(el);
    });
  };

  const style = document.createElement('style');
  style.textContent = `
    html.hn-reveal-ready [data-reveal="true"]{
      opacity:0;
      transform:translateY(22px);
      transition:
        opacity .55s ease var(--reveal-delay,0ms),
        transform .55s cubic-bezier(.22,.61,.36,1) var(--reveal-delay,0ms);
      will-change:opacity,transform;
    }

    html.hn-reveal-ready [data-reveal="true"].hn-reveal-visible{
      opacity:1;
      transform:none;
    }

    @media (max-width: 680px){
      html.hn-reveal-ready [data-reveal="true"]{
        transform:translateY(15px);
        transition-duration:.45s;
        transition-delay:0ms;
      }
    }
  `;

  document.head.appendChild(style);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup, {once:true});
  } else {
    setup();
  }
})();