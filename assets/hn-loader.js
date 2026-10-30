(function(){'use strict';
if(window.__hnLoaderMain)return;
var w=window,d=document,path=location.pathname.replace(/\/$/,'')||'/',admin=/^\/(admin|werkruimte)/.test(path);
if(w.top!==w||/[?&]noloader\b/.test(location.search))return;
w.__hnLoaderMain=true;
var ORB='<svg class="hn-orbit" viewBox="0 0 64 64" width="{S}" height="{S}" aria-hidden="true"><circle cx="32" cy="32" r="24" fill="none" stroke="#c9a227" stroke-opacity=".28" stroke-width="2.5"/><g class="o"><path d="M20 11.2A24 24 0 0 0 11.2 20" fill="none" stroke="#c9a227" stroke-opacity=".3" stroke-width="2.5" stroke-linecap="round"/><path d="M32 8A24 24 0 0 0 20 11.2" fill="none" stroke="#df842c" stroke-opacity=".6" stroke-width="2.5" stroke-linecap="round"/><g transform="translate(32 8)"><polygon points="10.5,0 2.25,-2.6 -2.25,-9 -4.5,-9 -3,-2.6 -8.25,-1.5 -9,-3.4 -10.5,-3.4 -9.75,0 -10.5,3.4 -9,3.4 -8.25,1.5 -3,2.6 -4.5,9 -2.25,9 2.25,2.6" fill="#df842c" stroke="#684a25" stroke-width=".7" stroke-linejoin="round"/></g></g></svg>';
function orbit(s){return (w.__hnLoader&&w.__hnLoader.orbit||ORB).replace(/\{S\}/g,String(s||24))}
var L=w.__hnLoader||{on:false,show:function(){},hide:function(){}};

/* ---------- ETA-geheugen: leert hoe lang deze pagina/acties gewoonlijk duren ---------- */
var KEY='hnLoadStats';
function stats(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return{}}}
function save(k,ms){try{var s=stats(),keys=Object.keys(s),a;if(keys.length>80&&!s[k])delete s[keys[0]];a=(s[k]=s[k]||[]);a.push(Math.round(ms));if(a.length>5)a.shift();localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}}
function avg(k){var a=stats()[k],t=0,i;if(!a||!a.length)return 0;for(i=0;i<a.length;i++)t+=a[i];return t/a.length}
function etaText(expect,elapsed){
 if(!admin||!expect)return 'Laden…';
 var rem=expect-elapsed;
 return rem>=800?'Laden · nog ±'+Math.ceil(rem/1000)+' s':'Laden · bijna klaar'}
function frac(expect,elapsed){return expect?Math.min(.95,elapsed/expect):Math.min(.9,1-Math.exp(-elapsed/2500))}

/* ---------- UI: pil (data laden) + voortgangsbalk (alleen admin) ---------- */
var pill,pillTxt,bar,ticker,busy=0,busyStart=0,idleT,pillT,firstEpisode=true,loadDone=d.readyState==='complete',loadAt=0;
function ensureUI(){
 if(pill||!d.body)return;
 pill=d.createElement('div');pill.id='hn-loader-pill';pill.setAttribute('role','status');pill.setAttribute('aria-live','polite');
 if(admin)pill.className='is-admin';
 pill.innerHTML=orbit(22)+'<span class="hn-lt">Laden…</span>';d.body.appendChild(pill);pillTxt=pill.firstChild.nextSibling;
 if(admin&&!bar){bar=d.createElement('div');bar.id='hn-loader-bar';d.body.appendChild(bar)}}
function pillOn(){return pill&&/is-on/.test(pill.className)}
function showPill(){ensureUI();if(!pill)return;pill.className=(admin?'is-admin ':'')+'is-on';startTick()}
function hidePill(){if(pill)pill.className=admin?'is-admin':''}
function setText(el,t){if(el&&el.textContent!==t)el.textContent=t}
function update(){
 if(d.hidden)return;
 var now=w.performance.now(),p=0,active=false;
 if(L.on&&L.el){
  active=true;var e1=avg('p:'+path)+avg('d:'+path);setText(L.el.querySelector('.hn-lt'),etaText(e1,now));p=frac(e1,now)}
 else if(pillOn()){
  active=true;var e2=avg('d:'+path)||avg('a:'+path),el2=now-busyStart;setText(pillTxt,etaText(e2,el2));p=frac(e2,el2)}
 if(admin&&!bar&&active&&d.body){bar=d.createElement('div');bar.id='hn-loader-bar';d.body.appendChild(bar)}
 if(bar){bar.className=active?'on':'';bar.style.transform='scaleX('+(active?p:0).toFixed(3)+')'}
 if(!active)stopTick()}
function startTick(){if(!ticker){ticker=setInterval(update,250);update()}}
function stopTick(){if(ticker){clearInterval(ticker);ticker=0}}

/* ---------- overlay verbergen: pas als alles geladen is, nooit korter dan 220ms zichtbaar ---------- */
function maybeHideOverlay(force){
 if(!L.on)return;
 if(!force&&!(loadDone&&busy===0))return;
 var wait=Math.max(0,220-(Date.now()-(L.since||0)));
 setTimeout(function(){if(force||busy===0){L.hide();update()}},wait)}

/* ---------- netwerk-activiteit bijhouden ---------- */
function begin(){if(busy++===0){busyStart=w.performance.now();clearTimeout(idleT);clearTimeout(pillT);pillT=setTimeout(function(){if(busy>0&&loadDone&&!L.on)showPill()},350)}}
function end(){if(--busy<=0){busy=0;clearTimeout(idleT);idleT=setTimeout(settle,180)}}
function settle(){
 if(busy>0)return;
 clearTimeout(pillT);
 if(busyStart){var dur=w.performance.now()-busyStart;if(dur>120)save((firstEpisode?'d:':'a:')+path,dur);firstEpisode=false;busyStart=0}
 hidePill();maybeHideOverlay();update()}
function trackable(u){return /\/(rest|auth|functions|storage)\/v1\//.test(u)&&!/\/auth\/v1\/token/.test(u)}
var of=w.fetch;
if(of&&!of.__hn){
 w.fetch=function(input,init){
  var u='';try{u=typeof input==='string'?input:(input&&input.url)||String(input)}catch(e){}
  if(!trackable(u))return of.apply(this,arguments);
  begin();var p;try{p=of.apply(this,arguments)}catch(e){end();throw e}
  return p.then(function(r){end();return r},function(e){end();throw e})};
 w.fetch.__hn=true}

/* ---------- load-gebeurtenis ---------- */
function onLoad(){
 loadDone=true;loadAt=Date.now();save('p:'+path,w.performance.now());
 if(L.on){startTick();if(busy===0)maybeHideOverlay();setTimeout(function(){maybeHideOverlay(true)},6000)}}
if(loadDone)onLoad();else w.addEventListener('load',onLoad);
L.onshow=function(){startTick()};
if(L.on)startTick();

/* ---------- feedback bij klikken op interne links ---------- */
var navT,navFail;
d.addEventListener('click',function(e){
 if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
 var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a)return;
 if((a.target&&a.target!=='_self')||a.hasAttribute('download'))return;
 var u;try{u=new URL(a.href,location.href)}catch(x){return}
 if(u.origin!==location.origin||u.protocol.indexOf('http')!==0)return;
 if(u.pathname===location.pathname&&u.search===location.search)return;
 clearTimeout(navT);clearTimeout(navFail);
 navT=setTimeout(function(){L.show();startTick()},140);
 navFail=setTimeout(function(){L.hide()},6000)},false);
w.addEventListener('pagehide',function(){clearTimeout(navT);clearTimeout(navFail)});
w.addEventListener('pageshow',function(e){if(e.persisted){busy=0;hidePill();L.hide();stopTick()}});

/* ---------- publieke API voor eigen acties (opslaan, importeren, …) ---------- */
w.HNLoader={
 track:function(p){begin();var f=function(){end()};try{Promise.resolve(p).then(f,f)}catch(e){end()}return p},
 show:function(){L.show();startTick()},hide:function(){L.hide();update()},
 orbit:orbit,_t:{avg:avg,save:save,etaText:etaText,frac:frac,stats:stats}};
})();
