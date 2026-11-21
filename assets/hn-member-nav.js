
(function(){
'use strict';if(window.__hnMemberNavLoaded)return;window.__hnMemberNavLoaded=true;
var menu=[
['Mijn Hijrah',[['Overzicht','/dashboard','layout'],['Mijn badges','/mijn-badges','award'],['Mijn HN-kaart','/mijn-kaart','map'],['Mijn werkruimte','/werkruimte','briefcase'],['Mijn HN-profiel','/profiel','user']]],
['Mijn traject',[['Stappenplan','/stappenplan','list'],['Oriëntatie','/orientatie','compass'],['Voorbereiding','/voorbereiding','clipboard'],['Vertrek','/vertrek','plane'],['Aankomst & integratie','/integratie','home'],['Realiteitscheck','/realiteitscheck','check']]],
['Ontdekken',[['Hijrah Navigatie','/navigatie','search'],['Landen & steden','/landen','globe'],['Steden vergelijken','/vergelijken','map'],['Stedengids','/stedengids','book'],['Verhalen','/verhalen','message'],['HijrahTools','/hijrahtools','tool']]],
['Bijdragen',[['Informatie insturen','/bijdragen?type=information','file'],['Ervaring delen','/bijdragen?type=experience','heart'],['Correctie melden','/bijdragen?type=correction','edit']]],
['Hulp',[['Hulp & vragen','/hulp','help']]]
];
var $=function(s,r){return(r||document).querySelector(s)},esc=function(v){return String(v||'').replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
function svg(n){var d={layout:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',award:'<circle cx="12" cy="8" r="6"/><path d="m8 13-1 9 5-3 5 3-1-9"/>',map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/>',briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12h18"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',list:'<path d="M9 6h12M9 12h12M9 18h12M3 6h.01M3 12h.01M3 18h.01"/>',compass:'<circle cx="12" cy="12" r="10"/><path d="m16 8-2 6-6 2 2-6z"/>',clipboard:'<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V2h6v2M8 10h8M8 14h8M8 18h5"/>',plane:'<path d="m22 2-7 20-4-9-9-4zM22 2 11 13"/>',home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H10v7H5a2 2 0 0 1-2-2z"/>',check:'<path d="m5 12 4 4L19 6"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',book:'<path d="M4 3h13a3 3 0 0 1 3 3v15H7a3 3 0 0 1-3-3zM7 21V6a3 3 0 0 1 3-3"/>',message:'<path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9 9 0 0 1-4-.9L3 21l1.9-4.7A8.5 8.5 0 1 1 21 11.5Z"/>',tool:'<path d="M14 7a5 5 0 0 0-6 6L3 18l3 3 5-5a5 5 0 0 0 6-6l-3 3-3-3z"/>',file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',edit:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',help:'<circle cx="12" cy="12" r="10"/><path d="M9.5 9a2.5 2.5 0 0 1 4.8 1c0 2-2.3 2-2.3 4M12 17h.01"/>'};return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(d[n]||d.layout)+'</svg>'}
function injectCss(){
if($('#hnm-css'))return;
var s=document.createElement('style');s.id='hnm-css';
s.textContent=`
/* Member navigation uses the exact CMS sidebar geometry and visual language. */
.hnm{position:fixed;left:0;top:0;bottom:0;width:250px;background:#fff;color:#2d2924;border-right:1px solid #e9e3da;box-shadow:none;z-index:1500;display:flex;flex-direction:column;font:13px/1.5 Inter,"Segoe UI",system-ui,sans-serif;transition:transform .22s ease,width .22s ease}
.hnm *{box-sizing:border-box}
.hnm-card{padding:25px 16px 18px;background:#fff;color:#2d2924;border:0;border-bottom:1px solid #e9e3da}
.hnm-profile{display:flex;align-items:center;gap:11px;text-decoration:none;color:#2d2924;padding:3px 10px 12px}
.hnm-av{width:40px;height:40px;display:grid;place-items:center;flex:0 0 40px;border-radius:13px;background:linear-gradient(135deg,#674c2e,#dd842a);color:#fff;font-weight:800;box-shadow:0 5px 12px rgba(103,76,46,.16)}
.hnm-name{font-weight:750;font-size:13px;color:#2d2924}
.hnm-status{font-size:11px;color:#82796f;margin-top:2px}
.hnm-progress{height:5px;border-radius:99px;background:#f0ebe3;overflow:hidden;margin:10px 10px 0}
.hnm-progress span{display:block;height:100%;background:#dd842a;width:0;transition:width .4s}
.hnm-progress-label{display:flex;justify-content:space-between;font-size:10px;color:#82796f;margin:5px 10px 0}
.hnm-body{overflow:auto;padding:12px 16px 18px;flex:1}
.hnm-group{margin:8px 0}
.hnm-group-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;padding:0 12px 10px;border:0;background:none;color:#a49b90;font-size:10px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;cursor:pointer}
.hnm-group-toggle span{display:flex;align-items:center;gap:8px}
.hnm-group-items a{display:flex;align-items:center;gap:12px;min-height:43px;padding:10px 12px;border-radius:11px;color:#625a50;text-decoration:none;font-weight:600;font-size:12.5px;margin:2px 0;transition:background .18s,color .18s}
.hnm-group-items a svg{width:18px;height:18px;flex:0 0 18px;color:#9b8d7b}
.hnm-group-items a:hover{background:#f8f5ef;color:#674c2e}
.hnm-group-items a.active{background:#f8efe3;color:#8d5524;box-shadow:inset 3px 0 #dd842a}
.hnm-group-items a.active svg{color:#dd842a}
.hnm-foot{padding:10px 16px;border-top:1px solid #e9e3da}
.hnm-foot button{width:100%;border:0;background:transparent;color:#74695d;text-align:left;padding:11px 12px;border-radius:9px;cursor:pointer;font-weight:650;font-size:11px}
.hnm-foot button:hover{background:#f8f5ef;color:#dd842a}
.hnm-mini-button{position:absolute;right:-12px;top:12px;width:24px;height:30px;border:1px solid #e9e3da;border-radius:0 8px 8px 0;background:#fff;color:#674c2e;cursor:pointer}
.hnm-scrim{display:none}
.hnm-mobile-button{display:none}
body.hnm-on{padding-left:250px!important}
body.hnm-mini{padding-left:76px!important}
.hnm-mini .hnm{width:76px}
.hnm-mini .hnm-card .hnm-name,.hnm-mini .hnm-card .hnm-status,.hnm-mini .hnm-progress,.hnm-mini .hnm-progress-label,.hnm-mini .hnm-group-toggle .hnm-group-label,.hnm-mini .hnm-group-items a span,.hnm-mini .hnm-foot{display:none}
.hnm-mini .hnm-card{padding:18px 16px}
.hnm-mini .hnm-group-items a{justify-content:center}
.hnm-mini .hnm-group-items a svg{width:20px;height:20px}
body.hnm-on .top{position:sticky;top:0;z-index:1200;margin-left:0!important;width:100%!important;background:rgba(255,255,255,.96)!important;color:#2d2924!important;border-bottom:1px solid #e9e3da!important;box-shadow:none!important;backdrop-filter:blur(16px)}
body.hnm-on .top .nav{max-width:1500px;min-height:62px;padding:0 clamp(20px,3.2vw,48px);margin:0 auto;display:flex;align-items:center;justify-content:space-between}
body.hnm-on .top .brand{font-size:13px;font-weight:750;color:#332d26}
body.hnm-on .top .nav-actions button{min-height:34px;padding:0 12px;border:1px solid #e4ddd3;border-radius:9px;background:#fff;color:#625548;font-size:11px;font-weight:700}
body.hnm-on .top .nav-actions button:hover{border-color:#cbb79f;background:#fffdf9}
body.hnm-on .wrap{max-width:1500px;margin:0 auto;padding:35px clamp(20px,3.2vw,48px) 24px}
body.hnm-on .hero{margin-bottom:26px;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;overflow:visible}
body.hnm-on .hero::after{display:none!important;content:none!important}
body.hnm-on .hero h1{margin:0;color:#332d26;font-size:clamp(23px,2.5vw,32px);font-weight:750;letter-spacing:-.045em;line-height:1.2}
body.hnm-on .hero>p{margin:9px 0 0;color:#82796f;font-size:12px}
body.hnm-on .card,body.hnm-on .panel{background:#fff!important;border:1px solid #e9e3da!important;border-radius:16px!important;box-shadow:0 10px 28px rgba(57,42,25,.045)!important}
body.hnm-on .grid{gap:13px}
body.hnm-on .card{padding:18px}
body.hnm-on .panel{padding:22px 24px;margin-top:20px}
body.hnm-on .label{color:#83796e;font-size:10.5px;font-weight:650}
body.hnm-on .value{color:#342e27}
body.hnm-on .tab.active{background:#f8efe3!important;color:#8b5526!important;border:1px solid #efdfca!important;box-shadow:none!important}
body.hnm-on input,body.hnm-on select,body.hnm-on textarea{border:1px solid #e9e3da!important;border-radius:9px!important;background:#fff!important;color:#2d2924!important}
body.hnm-on input:focus,body.hnm-on select:focus,body.hnm-on textarea:focus{outline:0!important;border-color:#dd842a!important;box-shadow:0 0 0 3px rgba(221,132,42,.10)!important}
body.hnm-on .button.primary,body.hnm-on button.primary{background:#dd842a!important;color:#fff!important;border:1px solid #dd842a!important;box-shadow:0 3px 9px rgba(221,132,42,.14)!important}
@media(max-width:900px){
 body.hnm-on{padding-left:0!important}
 .hnm{top:0;width:min(84vw,290px);transform:translateX(-105%);z-index:1600}
 .hnm-open .hnm{transform:translateX(0)}
 .hnm-scrim{display:block;position:fixed;inset:0;background:#21160e77;z-index:1599;opacity:0;visibility:hidden}
 .hnm-open .hnm-scrim{opacity:1;visibility:visible}
 .hnm-mini-button{display:none}
 .hnm-mobile-button{display:block;position:fixed;z-index:1601;left:12px;bottom:14px;border:0;border-radius:9px;background:#674c2e;color:#fff;padding:11px 14px;box-shadow:0 6px 22px #0002;font-weight:700}
 .hnm-mini .hnm-card .hnm-name,.hnm-mini .hnm-card .hnm-status,.hnm-mini .hnm-progress,.hnm-mini .hnm-progress-label,.hnm-mini .hnm-group-toggle .hnm-group-label,.hnm-mini .hnm-group-items a span{display:initial}
 body.hnm-on .wrap{padding:24px 16px 50px}
 body.hnm-on .top .nav{padding:0 16px}
}
@media(prefers-reduced-motion:reduce){.hnm,.hnm-progress{transition:none}}
`;
document.head.appendChild(s)
}
function active(h){var p=location.pathname.replace(/\/$/,'')||'/';var x=String(h).split('?')[0].replace(/\/$/,'')||'/';return p===x||(x!=='/'&&p.indexOf(x+'/')===0)}
var dashboardMode=/^\/dashboard(?:\.html)?\/?$/.test(location.pathname);
var activeMenu=dashboardMode? [['Mijn dashboard',[['Overzicht','#tab-home','layout'],['Opgeslagen','#tab-saved','book'],['Voortgang','#tab-progress','check'],['Mijn Hijrah Plan','#tab-plan','list'],['Mijn profiel','#tab-profile','user']]]]:menu;
async function start(){if(!document.body||$('.hnm'))return;var db=window.hijrahSupabase;for(var n=0;!db&&n<60;n++){await new Promise(function(r){setTimeout(r,100)});db=window.hijrahSupabase}if(!db||!db.auth)return;var ss=await db.auth.getSession();var user=ss.data&&ss.data.session&&ss.data.session.user;if(!user)return;injectCss();document.body.classList.add('hnm-on');var profile={};try{var pr=await db.from('profiles').select('display_name,first_name,role,hn_status').eq('id',user.id).maybeSingle();profile=pr.data||{}}catch(e){}var total=0,earned=0;try{var rr=await Promise.all([db.from('hn_badges').select('id',{count:'exact',head:true}).eq('active',true),db.from('hn_user_badges').select('badge_id').eq('user_id',user.id)]);total=rr[0].count||0;earned=(rr[1].data||[]).length}catch(e){}var statusName=profile.hn_status||'Lid';try{var sr=await db.from('hn_statuses').select('slug,name').eq('active',true);var row=(sr.data||[]).find(function(x){return x.slug===profile.hn_status});if(row)statusName=row.name}catch(e){}var name=profile.display_name||profile.first_name||'Mijn Hijrah';var initials=name.split(/\s+/).map(function(x){return x.charAt(0)}).join('').slice(0,2).toUpperCase();var root=document.createElement('aside');root.className='hnm';root.setAttribute('aria-label','Mijn ledenmenu');root.innerHTML='<div class="hnm-card"><a class="hnm-profile" href="/mijn-badges"><span class="hnm-av">'+esc(initials)+'</span><span><span class="hnm-name">'+esc(name)+'</span><span class="hnm-status">'+esc(statusName)+'</span></span></a><div class="hnm-progress"><span style="width:'+(total?Math.min(100,earned/total*100):0)+'%"></span></div><div class="hnm-progress-label"><span>Badgevoortgang</span><span>'+earned+' / '+total+'</span></div></div><button class="hnm-mini-button" type="button" aria-label="Menu inklappen">‹</button><nav class="hnm-body">'+activeMenu.map(function(g,i){var key='hnm-group-'+i;return '<section class="hnm-group"><button class="hnm-group-toggle" type="button" aria-expanded="true" aria-controls="'+key+'"><span>'+svg('layout')+'<span class="hnm-group-label">'+esc(g[0])+'</span></span><span class="hnm-chevron">⌄</span></button><div class="hnm-group-items" id="'+key+'">'+g[1].map(function(it){return '<a href="'+it[1]+'" '+(dashboardMode?'data-dashboard-tab="'+esc(it[1].replace('#tab-',''))+'"':'')+' class="'+((dashboardMode&&it[1]==='#tab-home')||(!dashboardMode&&active(it[1]))?'active':'')+'"'+(((dashboardMode&&it[1]==='#tab-home')||(!dashboardMode&&active(it[1])))?' aria-current="page"':'')+'>'+svg(it[2])+'<span>'+esc(it[0])+'</span></a>'}).join('')+'</div></section>'}).join('')+'</nav><div class="hnm-foot"><button type="button" data-hnm-logout>↪ Uitloggen</button></div>';document.body.insertBefore(root,document.body.firstChild);var scrim=document.createElement('div');scrim.className='hnm-scrim';document.body.appendChild(scrim);var mb=document.createElement('button');mb.type='button';mb.className='hnm-mobile-button';mb.textContent='☰ Mijn menu';mb.setAttribute('aria-expanded','false');document.body.appendChild(mb);function mobile(on){document.body.classList.toggle('hnm-open',on);mb.setAttribute('aria-expanded',String(on));document.body.style.overflow=on?'hidden':''}function mini(on){document.body.classList.toggle('hnm-mini',on);localStorage.setItem('hnm:mini',on?'1':'0');root.querySelector('.hnm-mini-button').textContent=on?'›':'‹'}mini(localStorage.getItem('hnm:mini')==='1'||(innerWidth<1180&&innerWidth>900));root.querySelector('.hnm-mini-button').addEventListener('click',function(){mini(!document.body.classList.contains('hnm-mini'))});root.querySelectorAll('.hnm-group-toggle').forEach(function(btn){var id=btn.getAttribute('aria-controls'),closed=localStorage.getItem('hnm:closed:'+id)==='1';if(closed){$('#'+id,root).hidden=true;btn.setAttribute('aria-expanded','false')}btn.addEventListener('click',function(){var on=btn.getAttribute('aria-expanded')!=='true';btn.setAttribute('aria-expanded',String(on));$('#'+id,root).hidden=!on;localStorage.setItem('hnm:closed:'+id,on?'0':'1')})});mb.addEventListener('click',function(){mobile(true)});scrim.addEventListener('click',function(){mobile(false)});document.addEventListener('keydown',function(e){if(e.key==='Escape')mobile(false)});root.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(e){if(dashboardMode&&a.hasAttribute('data-dashboard-tab')){e.preventDefault();var tab=a.getAttribute('data-dashboard-tab');var target=document.querySelector('.tab[data-tab="'+tab+'"]');if(target)target.click();root.querySelectorAll('[data-dashboard-tab]').forEach(function(x){x.classList.toggle('active',x===a);if(x===a)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current')})}mobile(false)})});root.querySelector('[data-hnm-logout]').addEventListener('click',async function(){await db.auth.signOut();location.href='/'});if(window.hijrahSupabase&&db.auth.onAuthStateChange)db.auth.onAuthStateChange(function(ev,s){if(ev==='SIGNED_OUT'&&!document.hidden)root.remove()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();