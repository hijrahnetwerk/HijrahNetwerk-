/* Shared CMS navigation shell for all legacy admin pages.
   Keep this markup and its class names aligned with admin-cms.html. */
(() => {
  const init = () => {
    if (document.querySelector('.admin-sidebar[data-shared-admin]')) return;

    const current = location.pathname.replace(/\/$/, '') || '/admin-cms';
    const links = [
      ['/admin-cms#pagesSection', 'Pagina’s', '▤', '/admin-cms'],
      ['/admin-builder', 'Pagina-bouwer', '✳', '/admin-builder'],
      ['/admin-navigation', 'Navigatie', '↕', '/admin-navigation'],
      ['/admin', 'Databasebeheer', '▦', '/admin'],
      ['/admin-kaart', 'HN-kaart', '⌖', '/admin-kaart'],
      ['/admin-bewerkvoorstellen', 'Bewerkvoorstellen', '☷', '/admin-bewerkvoorstellen'],
      ['/werkruimte', 'Mijn werkruimte', '◫', '/werkruimte']
    ];

    const aside = document.createElement('aside');
    aside.className = 'admin-sidebar';
    aside.dataset.sharedAdmin = 'true';
    aside.innerHTML = [
      '<a class="brand" href="/admin-cms" aria-label="HN Beheercentrum startpagina">',
      '<span class="brand-mark">HN</span>',
      '<span><strong>Hijrah Netwerk</strong><small>Beheercentrum</small></span>',
      '</a>',
      '<div class="sidebar-label">WERKRUIMTE</div>',
      '<nav class="sidebar-nav" aria-label="Beheernavigatie"></nav>',
      '<div class="sidebar-bottom">',
      '<div class="sidebar-note"><span class="online-dot"></span><span><strong>Beheeromgeving</strong><small>Jouw wijzigingen, jouw controle</small></span></div>',
      '<a class="back-site" href="/" target="_blank" rel="noopener">Website bekijken <span>↗</span></a>',
      '</div>'
    ].join('');

    const nav = aside.querySelector('.sidebar-nav');
    links.forEach(([href, label, icon, route]) => {
      const link = document.createElement('a');
      link.className = 'nav-link' + (current === route ? ' active' : '');
      link.href = href;
      link.innerHTML = '<span class="nav-icon" aria-hidden="true">' + icon + '</span><span>' + label + '</span>';
      nav.appendChild(link);
    });

    document.body.classList.add('hn-admin-standard');
    document.body.prepend(aside);
    document.querySelectorAll('.layout > .sidebar, .shell > .side').forEach((element) => {
      element.classList.add('hn-legacy-sidebar-hidden');
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
