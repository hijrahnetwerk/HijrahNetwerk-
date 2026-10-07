(function(){
  'use strict';

  const fallbackItems = [
    {label:'Landen & Steden', href:'/landen'},
    {label:'Hijrah Navigatie', href:'/navigatie'},
    {label:'HijrahTools', href:'/orientatie'},
    {label:'Community', href:'/community'},
    {label:'Mijn Hijrah', href:'/dashboard'},
    {label:'Over HN', href:'/#over-ons'}
  ];

  function esc(value){
    return String(value ?? '').replace(/[&<>"']/g,m=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }

  function normalizeItems(rows){
    const items=(rows||[])
       .filter(x=>x && x.is_visible!==false && x.location==='main' && !x.parent_id)
      .filter(x=>String(x.href||'')!=='/' && !['/kennisbank','/kennisbank/','/artikels','/artikels/'].includes(String(x.href||'')))
      .sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));

    return items.length ? items : fallbackItems;
  }

  function renderLinks(items, mobile){
    return items.map(x=>{
      const special=String(x.href||'').replace(/\/$/,'')==='/navigatie';
      if(mobile){
        return special
          ? '<a class="hn-mobile-link hn-mobile-special" href="'+esc(x.href)+'"><span>⌕</span><span><strong>'+esc(x.label)+'</strong><small>Zoek in HN</small></span></a>'
          : '<a class="hn-mobile-link" href="'+esc(x.href)+'">'+esc(x.label)+'</a>';
      }
      return special
        ? '<a class="hn-nav-special" href="'+esc(x.href)+'"><span class="hn-nav-special-icon">⌕</span><span>'+esc(x.label)+'</span><small>Zoek in HN</small></a>'
        : '<a href="'+esc(x.href)+'">'+esc(x.label)+'</a>';
    }).join('');
  }

  function mount(){
    if(document.getElementById('hnPublicNav')) return;

    const root=document.createElement('div');
    root.id='hnPublicNav';

    const items=fallbackItems;

    root.innerHTML=`
      <header class="hn-nav">
        <div class="hn-nav-inner">
          <a class="hn-brand" href="/" aria-label="Hijrah Netwerk">
            <span class="hn-mark"><img src="/assets/logo-color.pngneddkleinn.png" alt="" aria-hidden="true"></span>
            <span>Hijrah Netwerk</span>
          </a>
          <nav class="hn-links" aria-label="Hoofdnavigatie">${renderLinks(items,false)}</nav>
          <div class="hn-actions">
            <a class="hn-action secondary" href="/dashboard">Mijn Hijrah</a>
            <a class="hn-action secondary" href="/bijdragen">Bijdragen</a>
            <a class="hn-action primary" href="/register">Aanmelden</a>
          </div>
          <button class="hn-menu" type="button" aria-label="Open menu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </header>

      <div class="hn-mobile" aria-hidden="true">
        <div class="hn-mobile-panel">
          <div class="hn-mobile-head">
            <strong>Hijrah Netwerk</strong>
            <button class="hn-mobile-close" type="button" aria-label="Sluit menu">×</button>
          </div>
          <div class="hn-mobile-links">${renderLinks(items,true)}</div>
          <div class="hn-mobile-divider"></div>
          <a class="hn-mobile-link" href="/login">Inloggen</a>
          <a class="hn-mobile-primary" href="/register">Aanmelden voor de lancering</a>
        </div>
      </div>
    `;

    document.body.insertBefore(root,document.body.firstChild);

    const mobile=root.querySelector('.hn-mobile');
    const menu=root.querySelector('.hn-menu');
    const close=root.querySelector('.hn-mobile-close');

    function setOpen(open){
      mobile.classList.toggle('open',open);
      mobile.setAttribute('aria-hidden',open?'false':'true');
      menu.setAttribute('aria-expanded',open?'true':'false');
      document.body.style.overflow=open?'hidden':'';
    }

    menu.addEventListener('click',()=>setOpen(true));
    close.addEventListener('click',()=>setOpen(false));
    mobile.addEventListener('click',e=>{if(e.target===mobile)setOpen(false)});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});

    loadDatabaseNavigation(root).catch(()=>{});
  }

  async function loadDatabaseNavigation(root){
    const db=window.hijrahSupabase;
    if(!db || typeof db.from!=='function') return;

    const result=await db
      .from('hn_navigation_items')
      .select('label,href,parent_id,location,sort_order,is_visible')
      .eq('location','main')
      .eq('is_visible',true)
      .is('parent_id',null)
      .order('sort_order',{ascending:true});

    if(result.error) return;

    const items=normalizeItems(result.data);
    const desktop=root.querySelector('.hn-links');
    const mobile=root.querySelector('.hn-mobile-links');

    if(desktop) desktop.innerHTML=renderLinks(items,false);
    if(mobile) mobile.innerHTML=renderLinks(items,true);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',mount);
  }else{
    mount();
  }
})();