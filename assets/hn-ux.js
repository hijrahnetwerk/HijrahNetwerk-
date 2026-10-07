(function(){
  'use strict';
  if(window.__hnUxLoaded)return; window.__hnUxLoaded=true;
  const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function init(){
    const main=document.querySelector('main')||document.body;
    if(!document.querySelector('.hn-skip')){
      const s=document.createElement('a');s.className='hn-skip';s.href='#main-content';s.textContent='Ga naar inhoud';document.body.prepend(s);
      if(main&&!main.id)main.id='main-content';
    }
    const nav=document.querySelector('.hn-nav');
    if(nav){
      const set=()=>nav.classList.toggle('hn-scrolled',window.scrollY>8);
      set();window.addEventListener('scroll',set,{passive:true});
      const path=location.pathname.replace(/\/$/,'')||'/';
      nav.querySelectorAll('a[href]').forEach(a=>{
        try{const u=new URL(a.href,location.origin);const p=u.pathname.replace(/\/$/,'')||'/';if(p===path&&p!=='/')a.setAttribute('aria-current','page')}catch(e){}
      });
    }
    const candidates=document.querySelectorAll('main section,.card,.country-card,.step,.note,.cta,.story,.city,.topic-card,.result-card,.search-result');
    if('IntersectionObserver' in window&&!reduced){
      const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('hn-visible');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -40px'});
      candidates.forEach((el,i)=>{if(!el.classList.contains('hn-reveal')){el.classList.add('hn-reveal');if(i%5<4)el.dataset.hnDelay=String(i%5)}io.observe(el)});
    }else candidates.forEach(el=>el.classList.add('hn-visible'));
    document.addEventListener('click',e=>{
      const el=e.target.closest('a,button,[role="button"]');if(!el)return;
      if(el.matches('a[href^="#"]'))return;
      if(el.matches('button[type="submit"],input[type="submit"]')){el.dataset.hnOriginalText=el.textContent;setTimeout(()=>{if(el.disabled===false){}},0)}
    },{passive:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();