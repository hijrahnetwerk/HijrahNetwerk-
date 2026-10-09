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
    const footer = document.createElement('footer');
    footer.id = 'hnFooter';
    footer.className = 'hn-footer';
    footer.innerHTML = `
      <!-- Decoratieve route SVG -->
      <svg class="hn-footer-deco" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M600,380 C500,340 400,200 300,160 S100,140 0,80" stroke="white" stroke-width="1.5" stroke-dasharray="6 10" fill="none"/>
        <path d="M600,300 C480,260 360,150 240,120 S80,100 -20,50" stroke="white" stroke-width="1" stroke-dasharray="4 8" fill="none" opacity=".5"/>
        <!-- Kompas -->
        <circle cx="480" cy="200" r="70" stroke="white" stroke-width="1" opacity=".35"/>
        <circle cx="480" cy="200" r="50" stroke="white" stroke-width=".8" opacity=".2"/>
        <line x1="480" y1="135" x2="480" y2="265" stroke="white" stroke-width=".8" opacity=".3"/>
        <line x1="415" y1="200" x2="545" y2="200" stroke="white" stroke-width=".8" opacity=".3"/>
        <polygon points="480,138 476,195 484,195" fill="white" opacity=".5"/>
        <text x="477" y="132" fill="white" font-size="11" opacity=".5" font-weight="700">N</text>
        <text x="477" y="278" fill="white" font-size="11" opacity=".3">Z</text>
        <text x="396" y="204" fill="white" font-size="11" opacity=".3">W</text>
        <text x="552" y="204" fill="white" font-size="11" opacity=".3">O</text>
        <!-- Vliegtuig -->
        <g transform="translate(300,160) rotate(-25)">
          <polygon points="12,0 2,-3 -3,-10 -5,-10 -3,-3 -9,-2 -10,-4 -12,-4 -11,0 -12,4 -10,4 -9,2 -3,3 -5,10 -3,10 2,3" fill="white" opacity=".6"/>
        </g>
        <g transform="translate(140,115) rotate(-20)">
          <polygon points="9,0 1.5,-2 -2,-8 -4,-8 -2,-2 -7,-1.5 -7,-3 -9,-3 -8,0 -9,3 -7,3 -7,1.5 -2,2 -4,8 -2,8 1.5,2" fill="white" opacity=".35"/>
        </g>
      </svg>

      <div class="hn-wrap hn-footer-inner">
        <div class="hn-footer-grid">
          <!-- MERK KOLOM -->
          <div>
            <div class="hn-footer-brand">
              <div class="hn-footer-mark">HN</div>
              <span class="hn-footer-name">Hijrah Netwerk</span>
            </div>
            <p class="hn-footer-tagline">
              Verbind met gelijkgestemden. Echte ervaringen, eerlijk advies en een netwerk voor elke fase van jouw emigratie.
            </p>
            <div class="hn-footer-social">
              <a href="https://www.instagram.com/hijrah.netwerk" target="_blank" rel="noopener" aria-label="Instagram">📸</a>
              <a href="https://wa.me/hn" target="_blank" rel="noopener" aria-label="WhatsApp">💬</a>
              <a href="https://www.facebook.com/hijrahnetwerk" target="_blank" rel="noopener" aria-label="Facebook">📘</a>
            </div>
            <div class="hn-footer-phases">
              <a class="hn-footer-phase" href="/verhalen?fase=orienteren">✈ Oriënteren</a>
              <a class="hn-footer-phase" href="/verhalen?fase=voorbereiden">📋 Voorbereiden</a>
              <a class="hn-footer-phase" href="/verhalen?fase=integreren">🏡 Integreren</a>
              <a class="hn-footer-phase" href="/verhalen?fase=terugkeren">↩ Terugkeren</a>
            </div>
          </div>

          <!-- PLATFORM -->
          <div class="hn-footer-col">
            <h4>Platform</h4>
            <ul>
              <li><a href="/landen">Landen & Steden</a></li>
              <li><a href="/kennisbank">Kennisbank</a></li>
              <li><a href="/verhalen">Verhalen & Interviews</a></li>
              <li><a href="/smart-search">Smart Search</a></li>
              <li><a href="/navigatie">Hijrah Navigatie</a></li>
              <li><a href="/vergelijken">Vergelijker</a></li>
            </ul>
          </div>

          <!-- COMMUNITY -->
          <div class="hn-footer-col">
            <h4>Community</h4>
            <ul>
              <li><a href="/community">Over de community</a></li>
              <li><a href="/bijdragen">Bijdragen</a></li>
              <li><a href="/orientatie">HijrahTools</a></li>
              <li><a href="/stappenplan">Stappenplan</a></li>
              <li><a href="/dashboard">Mijn Hijrah</a></li>
              <li><a href="/register">Aanmelden</a></li>
            </ul>
          </div>

          <!-- HN -->
          <div class="hn-footer-col">
            <h4>Hijrah Netwerk</h4>
            <ul>
              <li><a href="/#over-ons">Over ons</a></li>
              <li><a href="/privacy">Privacybeleid</a></li>
              <li><a href="/hulp">Hulp & FAQ</a></li>
              <li><a href="/bijdragen?type=correction">Fout melden</a></li>
            </ul>
          </div>
        </div>

        <div class="hn-footer-bottom">
          <span>© ${new Date().getFullYear()} Hijrah Netwerk — Alle rechten voorbehouden.</span>
          <div class="hn-footer-bottom-links">
            <a href="/privacy">Privacy</a>
            <a href="/hulp">Hulp</a>
            <a href="/bijdragen">Bijdragen</a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(footer);
  }

  /* ── SCROLL REVEAL ── */
  function initReveal() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('hn-in');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: .1, rootMargin: '0px 0px -36px 0px' });

    document.querySelectorAll(
      '.hn-reveal:not(.hn-in), .hn-reveal-left:not(.hn-in), .hn-reveal-scale:not(.hn-in)'
    ).forEach(el => obs.observe(el));

    // Herrun bij dynamisch toegevoegde elementen
    return obs;
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
    document.querySelectorAll('.hn-hero:not([data-plane-done])').forEach(hero => {
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
    injectStripe();
    injectFooter();
    injectPlaneRoutes();
    initReveal();
    initFilterbar();
    initNav();

    // Herrun reveal na dynamisch geladen content
    const mutObs = new MutationObserver(() => initReveal());
    mutObs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
