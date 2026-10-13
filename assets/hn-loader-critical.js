(function(){try{var w=window,d=document;
if(w.top!==w||/[?&]noloader\b/.test(location.search))return;
var ORBIT='__ORBIT_SVG__',admin=/^\/(admin|werkruimte)/.test(location.pathname);
var L=w.__hnLoader={on:false,el:null,orbit:ORBIT,admin:admin};
function show(){if(L.on)return;if(!d.body){setTimeout(show,25);return}
 if(!L.el){var e=d.createElement('div');e.id='hn-loader';e.setAttribute('role','status');e.setAttribute('aria-live','polite');
  e.innerHTML=ORBIT.replace(/\{S\}/g,'60')+'<span class="hn-lt">Laden…</span>';if(admin)e.className='is-admin';d.body.appendChild(e);L.el=e}
 L.on=true;L.since=Date.now();if(L.onshow)L.onshow();w.requestAnimationFrame(function(){if(L.on)L.el.className=(admin?'is-admin ':'')+'is-on'})}
function hide(){if(!L.on)return;L.on=false;if(L.el)L.el.className=admin?'is-admin':''}
L.show=show;L.hide=hide;
L.timer=setTimeout(function(){if(d.readyState!=='complete')show()},180);
w.addEventListener('load',function(){clearTimeout(L.timer);if(!w.__hnLoaderMain)hide()});
w.addEventListener('pageshow',function(e){if(e.persisted)hide()});
setTimeout(hide,12000);
}catch(e){}})();
