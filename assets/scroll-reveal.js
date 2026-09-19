(function(){
  'use strict';

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const init = function(){
    if (document.documentElement.classList.contains('hn-reveal-ready')) return;
    document.documentElement.classList.add('hn-reveal-ready');

    const seen = new WeakSet();
    let delayIndex = 0;

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

    const reveal = function(el){
      if (!el || seen.has(el) || el.closest('header, nav, footer')) return;
      seen.add(el);
      el.setAttribute('data-reveal','true');
      el.style.setProperty('--reveal-delay', Math.min((delayIndex++ % 6) * 70, 350) + 'ms');

      if (reduced) {
        el.classList.add('hn-reveal-visible');
        return;
      }

      observer.observe(el);
    };

    const scan = function(root){
      const scope = root && root.querySelectorAll ? root : document;
      selectors.forEach(function(selector){
        if (scope.matches && scope.matches(selector)) reveal(scope);
        scope.querySelectorAll(selector).forEach(reveal);
      });
    };

    const observer = reduced ? {observe:function(){}} : new IntersectionObserver(function(entries, obs){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        entry.target.classList.add('hn-reveal-visible');
        obs.unobserve(entry.target);
      });
    },{
      threshold:0.08,
      rootMargin:'0px 0px -35px 0px'
    });

    const style=document.createElement('style');
    style.textContent=`
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
      @media(max-width:680px){
        html.hn-reveal-ready [data-reveal="true"]{
          transform:translateY(15px);
          transition-duration:.45s;
          transition-delay:0ms;
        }
      }
      @media(prefers-reduced-motion:reduce){
        html.hn-reveal-ready [data-reveal="true"]{
          opacity:1!important;
          transform:none!important;
          transition:none!important;
        }
      }
    `;
    document.head.appendChild(style);

    scan(document);

    const mutationObserver = new MutationObserver(function(mutations){
      mutations.forEach(function(mutation){
        mutation.addedNodes.forEach(function(node){
          if(node.nodeType === 1) scan(node);
        });
      });
    });

    mutationObserver.observe(document.body,{childList:true,subtree:true});

    window.HNScrollReveal={refresh:function(){scan(document);}};
  };

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init,{once:true});
  }else{
    init();
  }
})();