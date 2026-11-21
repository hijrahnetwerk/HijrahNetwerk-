/* Shared navigation shell for Hijrah Netwerk admin pages. */
(() => {
  const init = () => {
    if (document.querySelector('.admin-sidebar[data-shared-admin]')) return;
    const links = [
      ['/admin-cms','Overzicht','▤'],
      ['/admin-builder','Pagina-bouwer','✳'],
      ['/admin-navigation','Navigatie','↕'],
      ['/admin','Databasebeheer','▦'],
      ['/admin-kaart','HN-kaart','⌖'],
      ['/admin-bewerkvoorstellen','Bewerkvoorstellen','☷'],
      ['/werkruimte','Mijn werkruimte','◫']
    ];
    const current = location.pathname.replace(/\/$/,'') || '/admin-cms';
    const aside = document.createElement('aside');
    aside.className = 'admin-sidebar';
    aside.dataset.sharedAdmin = 'true';
    aside.innerHTML = '<a class="brand" href="/admin-cms"><span class="brand-mark">HN</span><span><strong>Hijrah Netwerk</strong><small>Beheercentrum</small></span></a><div class="sidebar-label">WERKRUIMTE</div><nav class="sidebar-nav" aria-label="Beheernavigatie"></nav><div class="sidebar-bottom"><div class="sidebar-note"><span class="online-dot"></span><span><strong>Beheeromgeving</strong><small>Jouw wijzigingen, jouw controle</small></span></div><a class="back-site" href="/" target="_blank" rel="noopener">Website bekijken <span>↗</span></a></div>';
    const nav=aside.querySelector('nav');
    links.forEach(([url,label,icon])=>{
      const a=document.createElement('a'); a.className='nav-link'+(current===url?' active':''); a.href=url;
      a.innerHTML='<span class="nav-icon" aria-hidden="true">'+icon+'</span><span>'+label+'</span>'; nav.appendChild(a);
    });
    document.body.classList.add('hn-admin-standard');
    document.body.prepend(aside);
    document.querySelectorAll('.layout > .sidebar, .shell > .side').forEach(el=>el.classList.add('hn-legacy-sidebar-hidden'));
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();