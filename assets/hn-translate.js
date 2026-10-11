(function(){
  if(window.hnTranslateLoaded)return;
  if(/^\/(admin|werkruimte)/i.test(location.pathname))return;   /* beheeromgeving: geen vertaling */
  window.hnTranslateLoaded=true;

  var SRC='nl';
  var LANGS=[
    {c:'nl',n:'Nederlands',s:'NL'},
    {c:'fr',n:'Français',s:'FR'},
    {c:'en',n:'English',s:'EN'},
    {c:'ar',n:'العربية',s:'AR'}
  ];
  var GLOBE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.7 4 5.7 4 9s-1.4 6.3-4 9c-2.6-2.7-4-5.7-4-9s1.4-6.3 4-9z"/></svg>';
  var TICK='<svg class="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>';

  /* ---------- cookie (Google Translate onthoudt de taal via 'googtrans') ---------- */
  function readCookie(){var m=document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);return m?decodeURIComponent(m[1]):''}
  function current(){var m=readCookie().match(/^\/[^\/]+\/([a-z-]+)$/i);return m&&m[1].toLowerCase()!==SRC?m[1].toLowerCase():SRC}
  function writeCookie(v){var h=location.hostname,b='googtrans='+v+';path=/;max-age=31536000;SameSite=Lax';document.cookie=b;if(h.indexOf('.')>0)document.cookie=b+';domain='+h}
  function clearCookie(){var h=location.hostname,b='googtrans=;path=/;max-age=0';document.cookie=b;document.cookie=b+';domain='+h;document.cookie=b+';domain=.'+h}
  function reload(){location.reload()}

  /* ---------- Google Translate: pas laden wanneer nodig (sneller + minder tracking) ---------- */
  var scriptLoaded=false;
  window.googleTranslateElementInit=function(){
    var el=document.getElementById('google_translate_element');
    if(!el||!window.google||!google.translate)return;
    new google.translate.TranslateElement({
      pageLanguage:SRC,
      includedLanguages:LANGS.map(function(l){return l.c}).join(','),
      autoDisplay:false
    },'google_translate_element');
  };
  function ensureScript(){
    if(scriptLoaded)return;scriptLoaded=true;
    var s=document.createElement('script');
    s.src='https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async=true;document.head.appendChild(s);
  }
  function combo(){return document.querySelector('select.goog-te-combo')}

  /* ---------- UI ---------- */
  var wrap,btn,menu,cur=current();
  function langOf(c){for(var i=0;i<LANGS.length;i++)if(LANGS[i].c===c)return LANGS[i];return LANGS[0]}
  function items(){return Array.prototype.slice.call(menu.querySelectorAll('.hn-lang-item'))}

  function refresh(){
    var l=langOf(cur),code=btn.querySelector('.hn-lang-code');
    wrap.classList.toggle('is-translated',cur!==SRC);
    code.hidden=(cur===SRC);code.textContent=(cur===SRC)?'':l.s;
    btn.setAttribute('aria-label',cur===SRC?'Taal kiezen':'Taal kiezen, nu '+l.n);
    items().forEach(function(it){it.setAttribute('aria-checked',String(it.getAttribute('data-lang')===cur))});
  }
  function open(){
    ensureScript();
    menu.hidden=false;wrap.classList.add('is-open');btn.setAttribute('aria-expanded','true');
    var t=menu.querySelector('[aria-checked="true"]')||items()[0];if(t)t.focus();
  }
  function close(back){
    if(menu.hidden)return;
    menu.hidden=true;wrap.classList.remove('is-open');btn.setAttribute('aria-expanded','false');
    if(back)btn.focus();
  }
  function apply(code){
    if(code===cur){close(true);return}
    var sel=combo();
    if(code===SRC)clearCookie();else writeCookie('/'+SRC+'/'+code);
    cur=code;refresh();close(true);
    if(sel){
      sel.value=(code===SRC)?'':code;
      sel.dispatchEvent(new Event('change',{bubbles:true}));
      if(code===SRC)setTimeout(function(){if(/translated-/.test(document.documentElement.className))reload()},600);
    }else{
      ensureScript();reload();   /* widget nog niet klaar: cookie staat, herladen past de vertaling toe */
    }
  }
  function onKey(e){
    if(menu.hidden)return;
    var list=items(),i=list.indexOf(document.activeElement);
    if(e.key==='Escape'){e.preventDefault();close(true)}
    else if(e.key==='ArrowDown'){e.preventDefault();list[(i+1)%list.length].focus()}
    else if(e.key==='ArrowUp'){e.preventDefault();list[(i-1+list.length)%list.length].focus()}
    else if(e.key==='Home'){e.preventDefault();list[0].focus()}
    else if(e.key==='End'){e.preventDefault();list[list.length-1].focus()}
    else if(e.key==='Tab'){close(false)}
  }
  function mount(){
    if(document.getElementById('hn-language'))return;
    wrap=document.createElement('div');
    wrap.id='hn-language';wrap.className='notranslate';wrap.setAttribute('translate','no');
    wrap.innerHTML=
      '<button type="button" class="hn-lang-btn" aria-haspopup="menu" aria-expanded="false" aria-label="Taal kiezen" title="Taal">'+GLOBE+'<span class="hn-lang-code" hidden></span></button>'+
      '<div class="hn-lang-menu" role="menu" aria-label="Taal" hidden><p class="hn-lang-title">Taal</p>'+
      LANGS.map(function(l){return '<button type="button" class="hn-lang-item" role="menuitemradio" aria-checked="false" data-lang="'+l.c+'" lang="'+l.c+'"><span class="n">'+l.n+'</span><span class="s">'+l.s+'</span>'+TICK+'</button>'}).join('')+
      '</div><div id="google_translate_element" aria-hidden="true"></div>';
    btn=wrap.querySelector('.hn-lang-btn');menu=wrap.querySelector('.hn-lang-menu');
    btn.addEventListener('click',function(){menu.hidden?open():close(true)});
    ['pointerenter','focus','touchstart'].forEach(function(ev){btn.addEventListener(ev,ensureScript,{once:true,passive:true})});
    menu.addEventListener('click',function(e){var it=e.target.closest('.hn-lang-item');if(it)apply(it.getAttribute('data-lang'))});
    wrap.addEventListener('keydown',onKey);
    document.addEventListener('click',function(e){if(!wrap.contains(e.target))close(false)});
    refresh();
    wrap.classList.add('is-pending');            /* verborgen tot de plek bekend is (geen verspringende knop) */
    document.body.appendChild(wrap);
    place();
    var mo=new MutationObserver(function(){
      if(!wrap.isConnected)document.body.appendChild(wrap);      /* nav werd vervangen: knop even redden */
      if(findHost())place();                                     /* (opnieuw) in de nav zetten */
      else if(wrap.classList.contains('in-nav'))setMode('is-floating');
    });
    mo.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(function(){if(wrap.classList.contains('is-pending'))settle()},1200);
    setTimeout(function(){mo.disconnect();if(wrap.classList.contains('is-pending'))settle()},10000);
    if(cur!==SRC)ensureScript();   /* er is al een taal gekozen: vertaling meteen toepassen */
  }
  /* ---------- plek op de site: in de navigatiebalk, zwevend alleen als er geen balk is ---------- */
  function setMode(m){wrap.classList.remove('is-pending','is-floating','in-nav');wrap.classList.add(m)}
  function findHost(){
    var inner=document.querySelector('#hnPublicNav .hn-nav-inner');
    if(inner)return {el:inner,ref:inner.querySelector('.hn-actions')||inner.querySelector('.hn-menu')};
    var own=document.querySelector('header.top .nav');
    if(own)return {el:own,ref:null};
    return null;
  }
  function place(){
    var h=findHost();if(!h)return false;
    if(wrap.parentNode!==h.el||(h.ref&&wrap.nextElementSibling!==h.ref)){
      if(h.ref&&h.ref.parentNode===h.el)h.el.insertBefore(wrap,h.ref);else h.el.appendChild(wrap);
    }
    setMode('in-nav');return true;
  }
  function settle(){
    if(place())return;
    if(wrap.parentNode!==document.body)document.body.appendChild(wrap);
    setMode('is-floating');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
