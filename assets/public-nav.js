(function(){
  function mountLoader(){
    if(document.getElementById("hnLoader")) return;

    var loader=document.createElement("div");
    loader.id="hnLoader";
    loader.innerHTML=`
      <div class="hn-loader-orbit">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle class="hn-loader-route" cx="60" cy="60" r="43"></circle>
          <circle class="hn-loader-trail" cx="60" cy="60" r="43" transform="rotate(-25 60 60)"></circle>
          <circle class="hn-loader-trail-soft" cx="60" cy="60" r="43" transform="rotate(-25 60 60)"></circle>
          <g class="hn-loader-flight">
            <g transform="translate(60 17) rotate(90)">
              <path d="M0 -13 C2 -8 3 -4 4 1 L15 8 C17 9 16 11 13 10 L4 8 L3 15 L8 19 C9 20 8 22 6 21 L0 18 L-6 21 C-8 22 -9 20 -8 19 L-3 15 L-4 8 L-13 10 C-16 11 -17 9 -15 8 L-4 1 C-3 -4 -2 -8 0 -13Z" fill="#df842c"></path>
            </g>
          </g>
        </svg>
      </div>
    `;

    var style=document.createElement("style");
    style.textContent=`
      #hnLoader{
        position:fixed;
        inset:0;
        z-index:99999;
        display:flex;
        align-items:center;
        justify-content:center;
        background:#fbf8f4;
        opacity:1;
        transition:opacity .28s ease;
        pointer-events:auto;
      }
      #hnLoader.hn-loader-hide{
        opacity:0;
        pointer-events:none;
      }
      .hn-loader-orbit{
        width:124px;
        height:124px;
      }
      .hn-loader-orbit svg{
        width:100%;
        height:100%;
        display:block;
      }
      .hn-loader-route{
        fill:none;
        stroke:rgba(104,74,37,.10);
        stroke-width:1.2;
        stroke-dasharray:2.5 6;
      }
      .hn-loader-trail{
        fill:none;
        stroke:rgba(223,132,44,.25);
        stroke-width:3;
        stroke-linecap:round;
        stroke-dasharray:44 226;
      }
      .hn-loader-trail-soft{
        fill:none;
        stroke:rgba(233,167,75,.12);
        stroke-width:7;
        stroke-linecap:round;
        stroke-dasharray:60 210;
        filter:blur(3px);
      }
      .hn-loader-flight{
        transform-origin:60px 60px;
        animation:hnLoaderSpin 3.2s linear infinite;
      }
      @keyframes hnLoaderSpin{
        from{transform:rotate(0deg)}
        to{transform:rotate(360deg)}
      }
      @media(max-width:600px){
        .hn-loader-orbit{width:104px;height:104px}
        .hn-loader-flight{transform-origin:60px 60px}
      }
      @media(prefers-reduced-motion:reduce){
        .hn-loader-flight{animation:none}
      }
    `;

    document.head.appendChild(style);
    document.body.insertBefore(loader,document.body.firstChild);

    function hide(){
      loader.classList.add("hn-loader-hide");
      setTimeout(function(){if(loader.parentNode)loader.parentNode.removeChild(loader)},320);
    }

    if(document.readyState==="complete"){
      setTimeout(hide,120);
    }else{
      window.addEventListener("load",function(){setTimeout(hide,120)},{once:true});
    }
  }

  function mount(){
    if(document.getElementById("hnPublicNav")) return;

    var root=document.createElement("div");
    root.id="hnPublicNav";
    root.innerHTML=`
      <header class="hn-nav">
        <div class="hn-nav-inner">
          <a class="hn-brand" href="index.html" aria-label="Hijrah Netwerk">
            <span class="hn-mark">HN</span>
            <span>Hijrah Netwerk</span>
          </a>

          <nav class="hn-links" aria-label="Hoofdnavigatie">
            <a href="index.html">Home</a>
            <a href="landen.html">Landen &amp; Steden</a>
            <a href="navigatie.html">Hijrah Navigatie</a>
            <a href="kennisbank.html">Kennisbank</a>
            <a href="smart-search.html">Smart Search</a>
            <a href="community.html">Community</a>
          </nav>

          <div class="hn-actions">
            <a class="hn-action secondary" href="dashboard.html">Mijn Hijrah</a>
            <a class="hn-action secondary" href="bijdragen.html">Bijdragen</a>
            <a class="hn-action primary" href="register.html">Aanmelden</a>
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
          <a class="hn-mobile-link" href="index.html">Home</a>
          <a class="hn-mobile-link" href="landen.html">Landen &amp; Steden</a>
          <a class="hn-mobile-link" href="navigatie.html">Hijrah Navigatie</a>
          <a class="hn-mobile-link" href="kennisbank.html">Kennisbank</a>
          <a class="hn-mobile-link" href="smart-search.html">Smart Search</a>
          <a class="hn-mobile-link" href="community.html">Community</a>
          <a class="hn-mobile-link" href="index.html#over-ons">Over ons</a>
          <a class="hn-mobile-link" href="bijdragen.html">Bijdragen</a>
          <div class="hn-mobile-divider"></div>
          <a class="hn-mobile-link" href="dashboard.html">Mijn Hijrah</a>
          <a class="hn-mobile-link" href="login.html">Inloggen</a>
          <a class="hn-mobile-primary" href="register.html">Aanmelden voor de lancering</a>
        </div>
      </div>
    `;

    document.body.insertBefore(root,document.body.firstChild);

    var mobile=root.querySelector(".hn-mobile");
    var menu=root.querySelector(".hn-menu");
    var close=root.querySelector(".hn-mobile-close");

    function setOpen(open){
      mobile.classList.toggle("open",open);
      mobile.setAttribute("aria-hidden",open?"false":"true");
      menu.setAttribute("aria-expanded",open?"true":"false");
      document.body.style.overflow=open?"hidden":"";
    }

    menu.addEventListener("click",function(){setOpen(true)});
    close.addEventListener("click",function(){setOpen(false)});
    mobile.addEventListener("click",function(e){if(e.target===mobile)setOpen(false)});
    document.addEventListener("keydown",function(e){if(e.key==="Escape")setOpen(false)});
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",function(){
      mountLoader();
      mount();
    });
  }else{
    mountLoader();
    mount();
  }
})();