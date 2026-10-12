(function(){
  'use strict';
  var $=function(id){return document.getElementById(id)};
  var overlay=$('hnDraftPreview'),root=$('hnDraftPreviewContent');
  if(!overlay||!root||!window.HNPublicationEditor)return;
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function safeUrl(value){try{var u=new URL(String(value||''),location.href);return /^https?:$/.test(u.protocol)?u.href:''}catch(_){return ''}}
  function slug(value){return String(value||'hoofdstuk').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'hoofdstuk'}
  function paragraphs(value){return String(value||'').split(/\n\s*\n/).map(function(p){return p.trim()}).filter(Boolean).map(function(p){return '<p>'+esc(p).replace(/\n/g,'<br>')+'</p>'}).join('')}
  function renderBlock(block,index){
    var type=block.type||'paragraph',text=String(block.text||'');
    if(type==='heading')return text.trim()?'<h2 class="hn-preview-heading" id="hn-preview-'+index+'">'+esc(text)+'</h2>':'';
    if(type==='paragraph')return paragraphs(text);
    if(type==='quote')return text.trim()?'<blockquote class="hn-preview-quote">'+esc(text).replace(/\n/g,'<br>')+(block.attribution?'<cite>— '+esc(block.attribution)+'</cite>':'')+'</blockquote>':'';
    if(type==='callout')return '<aside class="hn-preview-callout">'+(block.title?'<h3>'+esc(block.title)+'</h3>':'')+paragraphs(text)+'</aside>';
    if(type==='accordion')return '<details class="hn-preview-accordion"><summary>'+esc(block.title||'Meer informatie')+'</summary><div class="hn-preview-accordion-body">'+paragraphs(text)+'</div></details>';
    if(type==='checklist'){
      var items=Array.isArray(block.items)?block.items:String(block.items||'').split(/\n/);
      items=items.map(function(item){return String(item||'').trim()}).filter(Boolean);
      return '<section class="hn-preview-checklist"><h3>'+esc(block.title||'Checklist')+'</h3><ul>'+items.map(function(item,n){return '<li><label><input type="checkbox" data-hn-preview-check="'+n+'"><span>'+esc(item)+'</span></label></li>'}).join('')+'</ul><div class="hn-preview-progress"><span>Jouw voortgang</span><strong data-hn-preview-progress>0 van '+items.length+' afgevinkt</strong></div></section>';
    }
    if(type==='image'){
      var url=safeUrl(block.url);
      return url?'<figure class="hn-preview-image"><img src="'+esc(url)+'" alt="'+esc(block.alt||'')+'">'+(block.caption?'<figcaption>'+esc(block.caption)+'</figcaption>':'')+'</figure>':'';
    }
    if(type==='divider')return '<hr class="hn-preview-divider">';
    if(type==='budget'){
      return '<section class="hn-preview-budget"><h3>'+esc(block.title||'Gezinsbudget inschatten')+'</h3><p>'+esc(text||'Pas de bedragen aan voor een eerste schatting. Dit zijn voorbeeldwaarden, geen actuele prijsopgave.')+'</p>'+
      budgetControl(index,'rent','Woninghuur',2500,12000,500,4500,'MAD')+
      budgetControl(index,'school','Schoolkosten per kind',0,5000,200,1800,'MAD')+
      budgetControl(index,'kids','Schoolgaande kinderen',0,6,1,2,'kinderen')+
      budgetControl(index,'food','Boodschappen en levensonderhoud',2000,10000,500,3500,'MAD')+
      '<div class="hn-preview-budget-total"><span>Geschat totaal per maand</span><strong data-hn-preview-total>11.600 MAD</strong><small>Exclusief zorg, vervoer, nutsvoorzieningen, borg en eenmalige kosten.</small></div></section>';
    }
    return paragraphs(text);
  }
  function budgetControl(index,key,label,min,max,step,value,unit){
    var id='hn-preview-budget-'+index+'-'+key;
    return '<label class="hn-preview-range"><span>'+esc(label)+' <strong data-hn-preview-label="'+key+'">'+value.toLocaleString('nl-NL')+' '+esc(unit)+'</strong></span><input id="'+id+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+value+'" data-hn-preview-budget="'+key+'"></label>';
  }
  function openPreview(){
    var title=$('fTitle').value.trim()||'Titel van het artikel';
    var intro=$('fIntro').value.trim();
    var author=$('fAuthor').value.trim()||'Hijrah Netwerk';
    var cover=safeUrl($('fCover').value);
    var type=$('fType').selectedOptions[0]?$('fType').selectedOptions[0].textContent:'Interview';
    var blocks=window.HNPublicationEditor.getBlocks();
    var headingBlocks=blocks.map(function(b,i){return {b:b,i:i}}).filter(function(x){return x.b.type==='heading'&&String(x.b.text||'').trim()});
    var toc=headingBlocks.length>=3?'<nav class="hn-preview-toc"><h2>In dit artikel</h2><ol>'+headingBlocks.map(function(x){return '<li><a href="#hn-preview-'+x.i+'">'+esc(x.b.text)+'</a></li>'}).join('')+'</ol></nav>':'';
    var body=blocks.map(renderBlock).join('');
    var savedUrl='/verhalen/'+encodeURIComponent($('fSlug').value||'interview-hijrah-naar-agadir-marokko');
    root.innerHTML='<div class="hn-preview-warning"><strong>Voorbeeldweergave</strong><span>Dit is een voorvertoning van de huidige editorinhoud. Je wijzigingen zijn nog niet opgeslagen of gepubliceerd.</span></div>'+
      '<article class="hn-preview-article">'+
      '<header class="hn-preview-hero">'+(cover?'<img src="'+esc(cover)+'" alt="" class="hn-preview-cover">':'')+
      '<div class="hn-preview-hero-inner"><span class="hn-preview-kicker">'+esc(type)+'</span><h1>'+esc(title)+'</h1><p class="hn-preview-intro">'+esc(intro)+'</p><div class="hn-preview-meta">'+esc(author)+' · Voorbeeld, niet gepubliceerd</div></div></header>'+
      '<div class="hn-preview-layout"><main class="hn-preview-main">'+toc+body+'</main><aside class="hn-preview-aside"><h3>Over dit verhaal</h3><p>'+esc(type)+'</p><p>Een thematisch opgebouwd HN-interview met uitklapbare antwoorden, een persoonlijke checklist en een aanpasbare maandbegroting.</p><a href="'+esc(savedUrl)+'" target="_blank" rel="noopener">Huidige opgeslagen versie openen ↗</a></aside></div></article>';
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    initInteractions();
    var first=overlay.querySelector('.hn-preview-close');
    if(first)first.focus();
  }
  function initInteractions(){
    root.querySelectorAll('.hn-preview-checklist').forEach(function(section){
      var inputs=Array.from(section.querySelectorAll('[data-hn-preview-check]'));
      var output=section.querySelector('[data-hn-preview-progress]');
      function update(){var count=inputs.filter(function(input){return input.checked}).length;if(output)output.textContent=count+' van '+inputs.length+' afgevinkt'}
      inputs.forEach(function(input){input.addEventListener('change',update)});
      update();
    });
    root.querySelectorAll('.hn-preview-budget').forEach(function(section){
      function update(){
        var v={};
        section.querySelectorAll('[data-hn-preview-budget]').forEach(function(input){v[input.dataset.hnPreviewBudget]=Number(input.value)});
        var labels={rent:(v.rent||0).toLocaleString('nl-NL')+' MAD',school:(v.school||0).toLocaleString('nl-NL')+' MAD',kids:(v.kids||0)+' '+((v.kids||0)===1?'kind':'kinderen'),food:(v.food||0).toLocaleString('nl-NL')+' MAD'};
        Object.keys(labels).forEach(function(key){var node=section.querySelector('[data-hn-preview-label="'+key+'"]');if(node)node.textContent=labels[key]});
        var total=(v.rent||0)+(v.school||0)*(v.kids||0)+(v.food||0);
        var totalNode=section.querySelector('[data-hn-preview-total]');
        if(totalNode)totalNode.textContent=total.toLocaleString('nl-NL')+' MAD';
      }
      section.querySelectorAll('[data-hn-preview-budget]').forEach(function(input){input.addEventListener('input',update)});
      update();
    });
  }
  function closePreview(){overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');document.body.style.overflow=''}
  $('btnFullPreview').addEventListener('click',openPreview);
  $('hnDraftPreviewClose').addEventListener('click',closePreview);
  overlay.addEventListener('click',function(event){if(event.target===overlay)closePreview()});
  document.addEventListener('keydown',function(event){if(event.key==='Escape'&&overlay.classList.contains('open'))closePreview()});
})();