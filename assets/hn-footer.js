/* ═══════════════════════════════════════════════════════════
   HN GLOBAL FOOTER + DESIGN INIT
   Laad dit op elke publieke pagina als laatste script
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── GOLD STRIPE bovenaan ── */
  function injectStripe() {
    if (document.querySelector('.hn-stripe')) return;
    const s = document.createElement('div');
    s.className = 'hn-stripe';
    document.body.insertBefore(s, document.body.firstChild);
  }

  /* ── FOOTER ── */
  function injectFooter() {
    if (document.getElementById('hnFooter')) return;
    // Laad uitsluitend footer-styling; de volledige design stylesheet reset ook globale pagina-elementen.
    if (!document.querySelector('link[data-hn-footer-style]')) {
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = '/assets/hn-footer.css?v=20261013';
      style.dataset.hnFooterStyle = 'true';
      document.head.appendChild(style);
    }
    const footer = document.createElement('footer');
    footer.id = 'hnFooter';
    footer.className = 'hn-footer';
    footer.innerHTML = `
      <svg class="hn-footer-deco" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M600,380 C500,340 400,200 300,160 S100,140 0,80" stroke="white" stroke-width="1.5" stroke-dasharray="6 10"/>
        <circle cx="480" cy="200" r="70" stroke="white" opacity=".35"/>
        <circle cx="480" cy="200" r="50" stroke="white" opacity=".2"/>
      </svg>
      <div class="hn-wrap hn-footer-inner">
        <div class="hn-footer-brand-row">
          <a class="hn-footer-brand" href="/" aria-label="Hijrah Netwerk — home">
            <img class="hn-footer-logo" src="/assets/hn-logo-192.webp" width="96" height="96" decoding="async" alt="" loading="lazy">
            <span class="hn-footer-name">Hijrah Netwerk</span>
          </a>
          <div class="hn-footer-brand-copy">
            <p class="hn-footer-tagline">Een netwerk voor emigranten, van oriëntatie tot integratie. Praktische informatie en herkenning, van zuster tot zuster.</p>
            <nav class="hn-footer-social" aria-label="Volg Hijrah Netwerk">
              <a href="https://www.instagram.com/hijrah.netwerk" target="_blank" rel="noopener noreferrer" aria-label="Volg Hijrah Netwerk op Instagram"><span aria-hidden="true">◎</span><span>Instagram</span></a>
              <a href="https://www.facebook.com/hijrahnetwerk" target="_blank" rel="noopener noreferrer" aria-label="Volg Hijrah Netwerk op Facebook"><span aria-hidden="true">f</span><span>Facebook</span></a>
            </nav>
          </div>
        </div>
        <div class="hn-footer-grid">
          <nav class="hn-footer-col" aria-label="Hijrahfasen"><h3>Hijrahfasen</h3><ul>
            <li><a href="/orientatie">Oriënteren</a></li>
            <li><a href="/voorbereiding">Voorbereiden</a></li>
            <li><a href="/integratie">Integreren</a></li>
            <li><a href="/verhalen?fase=terugkeren">Terugkeren</a></li>
          </ul></nav>
          <nav class="hn-footer-col" aria-label="Algemene HijrahTools"><h3>HijrahTools</h3><ul>
            <li><a href="/navigatie">Hijrah Navigatie</a></li>
            <li><a href="/vergelijken">Landen- en stedenvergelijker</a></li>
            <li><a href="/smart-search">Smart Search</a></li>
            <li><a href="/verhalen">Verhalen &amp; interviews</a></li>
            <li><a href="/hijrahtools">Bekijk alle HijrahTools</a></li>
          </ul></nav>
          <nav class="hn-footer-col" aria-label="Mijn Hijrah Planner"><h3>Mijn Hijrah Planner</h3><ul>
            <li><a href="/dashboard">Mijn Hijrah Planner</a></li>
            <li><a href="/stappenplan">Mijn stappenplan</a></li>
            <li><a href="/paspoort">Mijn paspoort en voortgang</a></li>
            <li><a href="/dashboard">Mijn notities en opgeslagen items</a></li>
          </ul></nav>
          <nav class="hn-footer-col" aria-label="Community"><h3>Community</h3><ul>
            <li><a href="/community">Over de community</a></li>
            <li><a href="/bijdragen">Bijdragen</a></li>
            <li><a href="/verhalen">Verhalen &amp; interviews</a></li>
            <li><a href="/#inschrijven">Wachtlijst voor de community</a></li>
          </ul></nav>
          <nav class="hn-footer-col" aria-label="Hulp en informatie"><h3>Hulp &amp; informatie</h3><ul>
            <li><a href="/hulp">Hulp &amp; veelgestelde vragen</a></li>
            <li><a href="/privacy">Privacybeleid</a></li>
            <li><a href="/auteursrecht">Auteursrecht &amp; gebruik</a></li>
            <li><a href="/bijdragen?type=correction">Fout melden</a></li>
            <li><a href="/#over-ons">Over Hijrah Netwerk</a></li>
          </ul></nav>
        </div>
        <div class="hn-footer-bottom">
          <span>© ${new Date().getFullYear()} Hijrah Netwerk — Alle rechten voorbehouden.</span>
          <div class="hn-footer-bottom-links">
            <a href="/privacy">Privacy</a><a href="/auteursrecht">Auteursrecht &amp; gebruik</a><a href="/hulp">Hulp</a><a href="/bijdragen">Bijdragen</a>
            <a href="https://www.instagram.com/hijrah.netwerk" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://www.facebook.com/hijrahnetwerk" target="_blank" rel="noopener noreferrer">Facebook</a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(footer);
  }

  /* ── SCROLL REVEAL ── één observer, bijgewerkt in batches (geen herberekening bij elke DOM-wijziging) */
  let revealObs = null, revealQueued = false;
  function initReveal() {
    const sel = '.hn-reveal:not(.hn-in), .hn-reveal-left:not(.hn-in), .hn-reveal-scale:not(.hn-in)';
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll(sel).forEach(el => el.classList.add('hn-in'));
      return;
    }
    if (!revealObs) {
      revealObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('hn-in');
            revealObs.unobserve(e.target);
          }
        });
      }, { threshold: .1, rootMargin: '0px 0px -36px 0px' });
    }
    document.querySelectorAll(sel).forEach(el => {
      if (!el.__hnWatched) { el.__hnWatched = true; revealObs.observe(el); }
    });
  }
  function queueReveal() {
    if (revealQueued) return;
    revealQueued = true;
    (window.requestAnimationFrame || setTimeout)(() => { revealQueued = false; initReveal(); });
  }

  /* ── FILTERBAR SCROLL SHADOW ── */
  function initFilterbar() {
    const bar = document.querySelector('.hn-filterbar');
    if (!bar) return;
    const onScroll = () => bar.classList.toggle('scrolled', window.scrollY > 120);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── NAV SCROLL EFFECT ── */
  function initNav() {
    const nav = document.querySelector('.hn-nav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      nav.classList.toggle('hn-scrolled', window.scrollY > 40);
    }, { passive: true });

    // Active nav link
    const path = location.pathname.replace(/\/$/, '');
    document.querySelectorAll('.hn-links a').forEach(a => {
      const href = (a.getAttribute('href') || '').replace(/\/$/, '');
      if (href && href !== '' && path.startsWith(href)) {
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ── TOAST SYSTEEM (globaal) ── */
  window.hnToast = function (msg, type = 'ok') {
    let t = document.getElementById('hnToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'hnToast';
      t.className = 'hn-toast';
      document.body.appendChild(t);
    }
    t.textContent = (type === 'ok' ? '✓ ' : type === 'err' ? '✕ ' : 'ℹ ') + msg;
    t.className = `hn-toast show hn-toast-${type}`;
    clearTimeout(t._t);
    t._t = setTimeout(() => { t.className = 'hn-toast'; }, 3400);
  };

  /* ── VLIEGTUIG ROUTE INJECTIE in heroes ── */
  function injectPlaneRoutes() {
    document.querySelectorAll('.hn-hero:not([data-plane-done]),.hero:not([data-plane-done]),.page-hero:not([data-plane-done]),.hero-section:not([data-plane-done])').forEach(hero => {
      hero.setAttribute('data-plane-done', '1');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 700 320');
      svg.setAttribute('fill', 'none');
      svg.style.cssText = 'position:absolute;right:0;top:50%;transform:translateY(-50%);width:52%;height:auto;pointer-events:none;opacity:.14';
      svg.setAttribute('aria-hidden', 'true');
      svg.innerHTML = `
        <path d="M10,280 C120,220 200,120 320,90 S520,60 690,30"
              stroke="white" stroke-width="1.5" stroke-dasharray="6 9" fill="none"
              class="hn-plane-path"/>
        <path d="M10,230 C100,180 190,100 300,75 S490,48 680,18"
              stroke="white" stroke-width="1" stroke-dasharray="4 7" fill="none" opacity=".5"/>
        <circle cx="10"  cy="280" r="5" fill="white" opacity=".5"/>
        <circle cx="690" cy="30"  r="5" fill="white" opacity=".5"/>
        <!-- Kompas -->
        <circle cx="560" cy="170" r="62" stroke="white" stroke-width="1" opacity=".28"/>
        <circle cx="560" cy="170" r="44" stroke="white" stroke-width=".7" opacity=".15"/>
        <line x1="560" y1="112" x2="560" y2="228" stroke="white" stroke-width=".8" opacity=".25"/>
        <line x1="502" y1="170" x2="618" y2="170" stroke="white" stroke-width=".8" opacity=".25"/>
        <polygon points="560,115 556,165 564,165" fill="white" opacity=".45"/>
        <text x="557" y="110" fill="white" font-size="10" opacity=".5" font-weight="700">N</text>
        <!-- Vliegtuig -->
        <g class="hn-plane-icon" transform="translate(690,30) rotate(-30)">
          <polygon points="14,0 3,-3.5 -3,-12 -6,-12 -4,-3.5 -11,-2 -12,-4.5 -14,-4.5 -13,0 -14,4.5 -12,4.5 -11,2 -4,3.5 -6,12 -3,12 3,3.5" fill="#C6A15B" opacity=".9"/>
        </g>
      `;
      hero.appendChild(svg);
    });
  }

  /* ── INIT ── */
  function init() {
    if (/(^|\/)admin(?:-[^/]+)?\.html$/i.test(location.pathname)) document.body.classList.add('hn-admin-page');
    injectStripe();
    // Admin is an application workspace: keep its shell, but do not append the public footer.
    if (!/(^|\/)admin(?:-[^/]+)?\.html$/i.test(location.pathname)) injectFooter();
    injectPlaneRoutes();
    initReveal();
    initFilterbar();
    initNav();

    // Herrun reveal na dynamisch geladen content
    const mutObs = new MutationObserver(queueReveal);
    mutObs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
