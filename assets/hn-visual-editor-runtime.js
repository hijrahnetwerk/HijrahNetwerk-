(function(){
'use strict';
function db(){return window.hijrahSupabase||null}
function path(){return location.pathname.replace(/\/$/,'')||'/'}
function root(){return document.querySelector('main')||document.querySelector('[role="main"]')||document.body}
function routeForSlug(s){s=String(s||'').replace(/^\//,'').replace(/\.html$/i,'');var m={'':'/','home':'/','home-oud':'/home-oud','home-huidig':'/home-huidig','landen':'/landen','kennisbank':'/kennisbank','navigatie':'/navigatie','smart-search':'/smart-search','community':'/community','stappenplan':'/stappenplan','orientatie':'/orientatie','orientatietest':'/orientatietest','voorbereiding':'/voorbereiding','vertrek':'/vertrek','integratie':'/integratie','realiteitscheck':'/realiteitscheck','verhalen':'/verhalen','stedengids':'/stedengids','vergelijken':'/vergelijken','hulp':'/hulp','over-hn':'/over-hn'};return m[s]||('/pagina/'+encodeURIComponent(s))}
function applyStableIds(doc,settings){
  var items=settings&&Array.isArray(settings.editor_elements)?settings.editor_elements:[];
  items.forEach(function(item){
    if(!item||!item.id||!item.selector)return;
    var el=null;try{el=doc.querySelector(item.selector)}catch(e){}
    if(!el){
      var all=Array.prototype.filter.call(root().querySelectorAll('*'),function(x){return !x.closest('header,footer,nav,script,style,noscript')});
      for(var i=0;i<all.length;i++){var x=all[i],sig=String(x.textContent||'').trim().slice(0,160);if(x.tagName.toLowerCase()===item.tag&&sig===item.text_signature){el=x;break}}
    }
    if(el)el.setAttribute('data-hn-id',item.id);
  });
}
function applyText(row){try{var el=document.querySelector(row.selector);if(el&&row.content_text!=null)el.textContent=row.content_text}catch(e){console.warn('HN visual override selector:',e)}}
async function run(){
  var sup=db();if(!sup)return;
  var route=path(),settings=null;
  try{var pages=await sup.from('hn_site_pages').select('slug,settings').eq('status','published');if(!pages.error)(pages.data||[]).some(function(p){if(routeForSlug(p.slug)===route){settings=p.settings||{};return true}return false})}catch(e){console.warn('HN stable component mapping:',e)}
  applyStableIds(document,settings);
  var r=await sup.from('hn_content_overrides').select('selector,content_text').eq('route',route);if(!r.error)(r.data||[]).forEach(applyText);
  var l=await sup.from('hn_page_layout_overrides').select('selector,sort_order,is_visible,settings').eq('route',route).order('sort_order');if(l.error)return;
  var rows=l.data||[],base=root();
  rows.forEach(function(row){try{var el=document.querySelector(row.selector);if(!el)return;el.hidden=row.is_visible===false;if(row.settings&&row.settings.css)Object.keys(row.settings.css).forEach(function(k){el.style[k]=row.settings.css[k]})}catch(e){console.warn('HN visual layout selector:',e)}});
  rows.filter(function(x){return x.is_visible!==false&&x.sort_order!=null}).sort(function(a,b){return a.sort_order-b.sort_order}).forEach(function(row){var el=document.querySelector(row.selector);if(el&&el.parentElement===base)base.appendChild(el)});
}
function start(){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(run,50)});else setTimeout(run,50)}
start();
})();