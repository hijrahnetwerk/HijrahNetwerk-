(function(){
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
          <a class="hn-mobile-link" href="bijdragen.html">Informatie insturen</a>
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

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);
  else mount();
})();