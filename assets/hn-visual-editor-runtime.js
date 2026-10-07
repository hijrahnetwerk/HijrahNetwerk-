(function(){
'use strict';
function db(){return window.hijrahSupabase||null}
function esc(v){return String(v==null?'':v).replace(/[&<>"]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]})}
function path(){return location.pathname.replace(/\\/$/,'')||'/'}
function root(){return document.querySelector('main')||document.querySelector('[role="main"]')||document.body}
function applyText(row){
  try{
    var el=document.querySelector(row.selector); if(!el)return;
    if(row.content_text!=null)el.textContent=row.content_text;
  }catch(e){console.warn('HN visual override selector:',e)}
}
async function run(){
  var sup=db(); if(!sup)return;
  var route=path();
  var r=await sup.from('hn_content_overrides').select('selector,content_text').eq('route',route);
  if(!r.error)(r.data||[]).forEach(applyText);
  var l=await sup.from('hn_page_layout_overrides').select('selector,sort_order,is_visible,settings').eq('route',route).order('sort_order');
  if(l.error)return;
  var rows=l.data||[];
  var base=root();
  rows.forEach(function(row){
    try{
      var el=document.querySelector(row.selector); if(!el)return;
      el.hidden=row.is_visible===false;
      if(row.settings&&row.settings.css){
        Object.keys(row.settings.css).forEach(function(k){el.style[k]=row.settings.css[k]});
      }
    }catch(e){console.warn('HN visual layout selector:',e)}
  });
  var ordered=rows.filter(function(x){return x.is_visible!==false&&x.sort_order!=null});
  if(ordered.length&&base){
    ordered.sort(function(a,b){return a.sort_order-b.sort_order}).forEach(function(row){
      var el=document.querySelector(row.selector); if(el&&el.parentElement===base)base.appendChild(el);
    });
  }
}
function start(){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(run,50)});
  else setTimeout(run,50);
}
start();
})();