/* HN MOTION & INTERACTIE — v3 */
(function(){
'use strict';
if(window.__HN_MOTION_V3__)return;window.__HN_MOTION_V3__=true;
var reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
var revealObserver=null;
function reveal(el){if(!el||el.closest('.liveFrameWrap'))return;el.classList.add('hn-reveal');if(reduced||!revealObserver){el.classList.add('hn-visible','hn-in');return;}revealObserver.observe(el);}
function scan(root){
 var scope=root&&root.querySelectorAll?root:document;
 var selectors=['.hn-reveal','main>section','.section','.hero','.panel','.card','.country-card','.topic-card','.result-card','.fiche-card','.article-card','.overview-grid>*','.form-grid>*'];
 selectors.forEach(function(sel){if(scope.matches&&scope.matches(sel))reveal(scope);scope.querySelectorAll(sel).forEach(reveal);});
 scope.querySelectorAll('.hn-stagger').forEach(function(el){el.classList.add('hn-visible');});
}
if('IntersectionObserver'in window&&!reduced){
 revealObserver=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('hn-visible','hn-in');revealObserver.unobserve(entry.target);}});},{threshold:.04,rootMargin:'0px 0px 60px 0px'});
}
function refresh(){scan(document);}
function trapFocus(element){
 var selector='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
 var get=function(){return Array.prototype.filter.call(element.querySelectorAll(selector),function(el){return !!(el.offsetWidth||el.offsetHeight||el.getClientRects().length);});};
 var handler=function(e){if(e.key!=='Tab')return;var items=get();if(!items.length){e.preventDefault();return;}var first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}};
 element.addEventListener('keydown',handler);return function(){element.removeEventListener('keydown',handler);};
}
function openOverlay(target){
 var overlay=typeof target==='string'?(document.getElementById(target)||document.querySelector(target)):target;
 if(!overlay)return;
 overlay._hnReturnFocus=document.activeElement;
 overlay.removeAttribute('hidden');
 requestAnimationFrame(function(){overlay.classList.add('open');document.body.classList.add('hn-overlay-open');var panel=overlay.querySelector('.hn-overlay-panel')||overlay;overlay._hnTrapOff=trapFocus(panel);var first=panel.querySelector('button:not([disabled]),[href],input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])');if(first)first.focus();});
}
function closeOverlay(target){
 var overlay=typeof target==='string'?document.getElementById(target):target;
 if(!overlay)return;
 overlay.classList.remove('open');
 if(overlay._hnTrapOff){overlay._hnTrapOff();overlay._hnTrapOff=null;}
 if(!document.querySelector('.hn-overlay.open'))document.body.classList.remove('hn-overlay-open');
 var finish=function(){if(!overlay.classList.contains('open'))overlay.setAttribute('hidden','');};
 overlay.addEventListener('transitionend',finish,{once:true});window.setTimeout(finish,320);
 if(overlay._hnReturnFocus&&overlay._hnReturnFocus.focus)overlay._hnReturnFocus.focus();
}
window.openOverlay=openOverlay;window.closeOverlay=closeOverlay;
window.hnToast=function(message,type,duration){
 type=type||'info';duration=typeof duration==='number'?duration:3500;
 var container=document.querySelector('.hn-toast-container');
 if(!container){container=document.createElement('div');container.className='hn-toast-container';container.setAttribute('aria-live','polite');container.setAttribute('aria-atomic','false');document.body.appendChild(container);}
 var toast=document.createElement('div');toast.className='hn-toast hn-toast-'+type;
 var icons={ok:'✓',fout:'✕',info:'i',goud:'✦',waarsch:'!'};
 var icon=document.createElement('span');icon.textContent=icons[type]||'i';
 var text=document.createElement('span');text.textContent=String(message==null?'':message);
 toast.append(icon,text);container.appendChild(toast);
 var timer=window.setTimeout(remove,duration);
 function remove(){window.clearTimeout(timer);toast.classList.add('out');toast.addEventListener('animationend',function(){toast.remove();},{once:true});window.setTimeout(function(){if(toast.isConnected)toast.remove();},500);}
 toast.addEventListener('click',remove);
};
window.hnSetLoading=function(button,loading){if(!button)return;button.setAttribute('data-loading',loading?'true':'false');button.disabled=!!loading;};
window.hnBadgePop=function(el){if(!el||reduced)return;el.classList.remove('hn-badge-pop');void el.offsetWidth;el.classList.add('hn-badge-pop');};
document.addEventListener('pointerdown',function(e){
 if(reduced)return;var button=e.target.closest('button,.btn,a.button,.hn-ripple');
 if(!button||button.disabled||button.getAttribute('aria-disabled')==='true')return;
 var rect=button.getBoundingClientRect(),size=Math.max(rect.width,rect.height)*2;
 var wave=document.createElement('span');wave.className='hn-ripple-wave';
 wave.style.cssText='position:absolute;width:'+size+'px;height:'+size+'px;left:'+(e.clientX-rect.left-size/2)+'px;top:'+(e.clientY-rect.top-size/2)+'px;border-radius:50%;pointer-events:none;background:rgba(255,255,255,.22);transform:scale(0);animation:hn-ripple .55s ease-out forwards;';
 button.appendChild(wave);wave.addEventListener('animationend',function(){wave.remove();},{once:true});
});
document.addEventListener('click',function(e){
 var opener=e.target.closest('[data-hn-open]');if(opener){e.preventDefault();openOverlay(opener.dataset.hnOpen);}
 var closer=e.target.closest('[data-hn-close]');if(closer){e.preventDefault();closeOverlay(closer.closest('.hn-overlay'));}
 var overlay=e.target.closest('.hn-overlay.open');if(overlay&&e.target===overlay)closeOverlay(overlay);
 var trigger=e.target.closest('.hn-accordion-trigger');if(trigger){var accordion=trigger.closest('.hn-accordion'),body=accordion&&accordion.querySelector('.hn-accordion-body');if(body){var on=accordion.classList.toggle('open');body.style.maxHeight=on?body.scrollHeight+'px':'0';body.style.opacity=on?'1':'0';trigger.setAttribute('aria-expanded',String(on));}}
});
document.addEventListener('keydown',function(e){if(e.key==='Escape')document.querySelectorAll('.hn-overlay.open').forEach(closeOverlay);});
var nav=document.querySelector('#hnPublicNav .hn-nav');if(nav){var updateNav=function(){nav.classList.toggle('scrolled',window.scrollY>2);};updateNav();window.addEventListener('scroll',updateNav,{passive:true});}
if(reduced){document.documentElement.style.setProperty('--hn-t-fast','0ms');document.documentElement.style.setProperty('--hn-t-mid','0ms');document.documentElement.style.setProperty('--hn-t-slow','0ms');}
function init(){refresh();if('MutationObserver'in window){var observer=new MutationObserver(function(records){records.forEach(function(record){record.addedNodes.forEach(function(node){if(node.nodeType===1){reveal(node);scan(node);}});});});observer.observe(document.body,{childList:true,subtree:true});}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.HNMotion={refresh:refresh,openOverlay:openOverlay,closeOverlay:closeOverlay,trapFocus:trapFocus};
})();
