(function(){
'use strict';

var db=null,pages=[],page=null,sections=[],live=[],selected=-1,selectedExisting=null,pendingType=null,drag=null;
var overrides=[],layouts=[],versions=[],editorElements=[];
var $=function(id){return document.getElementById(id);};
var T={
  hero:"Hero",intro:"Intro",text:"Tekst",image:"Afbeelding",cards:"Kaarten",cta:"CTA",links:"Links",navigation:"HN Navigatie",
  directory:"HN Overzicht",articles:"HN Artikelen",fiches:"HN Fiches",cities:"HN Steden",categories:"HN Categorieën",comparison:"HN Vergelijking",steps:"HN Stappen",community:"HN Community",divider:"Scheidingslijn",spacer:"Ruimte"
};
var icons={hero:"H",intro:"I",text:"T",image:"I",cards:"K",cta:"B",links:"L",navigation:"N",directory:"O",articles:"A",fiches:"F",cities:"S",categories:"C",comparison:"V",steps:"ST",community:"CO",divider:"—",spacer:"↕"};

function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m];});}
function cleanSlug(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");}
function route(s){
  s=String(s||"").replace(/^\//,"").replace(/\.html$/i,"");
  var m={"":"/",home:"/",landen:"/landen",kennisbank:"/kennisbank",navigatie:"/navigatie","smart-search":"/smart-search",community:"/community",stappenplan:"/stappenplan",orientatie:"/orientatie",orientatietest:"/orientatietest",voorbereiding:"/voorbereiding",vertrek:"/vertrek",integratie:"/integratie",realiteitscheck:"/realiteitscheck",verhalen:"/verhalen",stedengids:"/stedengids",vergelijken:"/vergelijken",hulp:"/hulp","over-hn":"/over-hn"};
  return m[s]||("/pagina/"+encodeURIComponent(s));
}
function note(t,error){
  $("msg").textContent=t;$("msg").hidden=false;
  $("msg").classList.toggle("error",!!error);
  clearTimeout(note.timer);note.timer=setTimeout(function(){$("msg").hidden=true;},4200);
}
function routeKey(){return route(page&&page.slug||"");}
function pageSettings(){return page&&page.settings&&typeof page.settings==="object"?page.settings:{};}
function stableId(){return "hn-"+String(page.id||"page").replace(/[^a-zA-Z0-9]/g,"").slice(0,12)+"-"+Math.random().toString(36).slice(2,9);}
function baseSelector(el,doc){var old=el.getAttribute("data-hn-id");if(old)el.removeAttribute("data-hn-id");var s=selector(el,doc);if(old)el.setAttribute("data-hn-id",old);return s;}
function stableSelector(id){return '[data-hn-id="' + id.replace(/"/g,"\\\"") + '"]';}
function ensureEditorElements(doc){
  var saved=Array.isArray(pageSettings().editor_elements)?pageSettings().editor_elements:[];
  var bySelector={};saved.forEach(function(x){if(x&&x.selector)bySelector[x.selector]=x;});
  editorElements=[];
  existing(doc).forEach(function(el){
    var current=baseSelector(el,doc), found=bySelector[current], id=found&&found.id;
    if(!id){id=stableId();found={id:id,selector:current,tag:el.tagName.toLowerCase(),text_signature:String(el.textContent||"").trim().slice(0,160)};saved.push(found);}
    el.setAttribute("data-hn-id",id);editorElements.push(found);
  });
  page.settings=Object.assign({},page.settings||{}, {editor_elements:saved});
}
function elementId(el,doc){return el.getAttribute("data-hn-id")||((editorElements.find(function(x){return x.selector===baseSelector(el,doc);})||{}).id)||null;}

async function admin(){
  db=window.hijrahSupabase;
  if(!db){location="/login?next=/admin-builder";return false;}
  var ss=await db.auth.getSession(),session=ss.data&&ss.data.session;
  if(!session){location="/login?next=/admin-builder";return false;}
  var rr=await db.from("profiles").select("role").eq("id",session.user.id).maybeSingle();
  if(!rr.data||rr.data.role!=="admin"){document.body.innerHTML="<h1 style='padding:40px'>Geen toegang</h1>";return false;}
  return true;
}

function ensureBuilderUI(){
  if(!$("versionPanel")){
    var p=document.createElement("div");p.id="versionPanel";p.className="version-panel";
    p.innerHTML='<div class="version-head"><strong>Versies</strong><button id="refreshVersions" type="button">Vernieuwen</button></div><div id="versions"></div>';
    $("inspector").appendChild(p);
    $("refreshVersions").onclick=loadVersions;
  }
  if(!$("existingActions")){
    var a=document.createElement("div");a.id="existingActions";a.className="existing-actions";a.hidden=true;
    a.innerHTML='<button id="saveExisting" type="button" class="primary">Bestaand element opslaan</button><button id="resetExisting" type="button">Origineel herstellen</button><button id="cancelExisting" type="button">Selectie sluiten</button>';
    $("blockInspector").appendChild(a);
  }
  if(!$("dataWrap")){
    var d=document.createElement("div");d.id="dataWrap";d.className="data-wrap";d.hidden=true;
    d.innerHTML='<div class="section-heading">HN-database</div><label>Databron<select id="dataSource"><option value="cities">Steden</option><option value="topic">Topics / artikelen</option><option value="categories">Categorieën</option></select></label><label>Aantal<input id="dataLimit" type="number" min="1" max="50" value="6"></label>';
    $("blockInspector").appendChild(d);
  }
  if(!$("selectionState")){
    var s=document.createElement("div");s.id="selectionState";s.className="selection-state";
    s.innerHTML='<span class="selection-dot"></span><div><b id="selectionTitle">Niets geselecteerd</b><small id="selectionMeta">Klik op een onderdeel in de pagina.</small></div>';
    $("inspector").insertBefore(s,$("inspector").firstElementChild);
  }
}

function drawPages(){
  $("pages").innerHTML=pages.map(function(p){
    return '<button class="page '+(page&&page.id===p.id?"active":"")+'" data-id="'+esc(p.id)+'"><b>'+esc(p.title||"Zonder titel")+'</b><small>'+esc(route(p.slug))+ " · "+esc(p.status||"draft")+"</small></button>";
  }).join("");
  document.querySelectorAll(".page").forEach(function(b){b.onclick=function(){pick(b.getAttribute("data-id"));};});
}

function palette(){
  var keys=window.HNComponentRegistry?Object.keys(window.HNComponentRegistry.definitions):Object.keys(T);
  $("palette").innerHTML=keys.map(function(k){
    return '<button class="tool" data-type="'+k+'"><span class="tool-icon">'+icons[k]+'</span>'+T[k]+"</button>";
  }).join("");
  document.querySelectorAll(".tool").forEach(function(b){
    b.onclick=function(){
      pendingType=b.getAttribute("data-type");
      document.querySelectorAll(".tool").forEach(function(x){x.classList.remove("active");});
      b.classList.add("active");
      note("Klik in de pagina op een oranje + om dit HN-component toe te voegen.");
    };
  });
}

async function load(){
  var r=await db.from("hn_site_pages").select("*").order("title");
  if(r.error){note(r.error.message,true);return;}
  pages=r.data||[];drawPages();
  var raw=new URLSearchParams(location.search).get("slug")||"";
  raw=raw.replace(/^\//,"").replace(/\.html$/i,"");
  var target=null;
  for(var i=0;i<pages.length;i++){
    if(pages[i].slug===raw){target=pages[i];break;}
    if(!raw&&!pages[i].slug)target=pages[i];
  }
  if(target)pick(target.id);else if(pages[0])pick(pages[0].id);
}

async function loadPageData(){
  var r=await db.from("hn_site_sections").select("*").eq("page_id",page.id).order("sort_order");
  if(r.error){note(r.error.message,true);return false;}
  sections=r.data||[];

  editorElements=Array.isArray(page.settings&&page.settings.editor_elements)?page.settings.editor_elements:[];

  var o=await db.from("hn_content_overrides").select("selector,element_type,original_text,content_text").eq("route",routeKey());
  if(!o.error)overrides=o.data||[];else overrides=[];

  var l=await db.from("hn_page_layout_overrides").select("selector,sort_order,is_visible,settings").eq("route",routeKey()).order("sort_order");
  if(!l.error)layouts=l.data||[];else layouts=[];

  await loadVersions();
  return true;
}

async function pick(id){
  for(var i=0;i<pages.length;i++)if(pages[i].id===id)page=pages[i];
  if(!page)return;
  selected=-1;selectedExisting=null;pendingType=null;
  $("empty").hidden=true;$("editor").hidden=false;
  $("heading").textContent=page.title||"Pagina";$("route").textContent=route(page.slug);
  $("title").value=page.title||"";$("slug").value=page.slug||"";$("status").value=page.status||"draft";
  $("seoTitle").value=page.seo_title||"";$("seoDesc").value=page.seo_description||"";$("desc").value=page.description||"";$("cmsMode").checked=page.settings&&page.settings.builder_mode==="cms";
  var ok=await loadPageData();if(!ok)return;
  drawPages();closeInspector();loadLive();
}

async function loadVersions(){
  if(!page||!$("versions"))return;
  var r=await db.from("hn_site_page_versions").select("id,version_number,created_at,created_by").eq("page_id",page.id).order("version_number",{ascending:false}).limit(12);
  versions=r.error?[]:(r.data||[]);
  $("versions").innerHTML=versions.length?versions.map(function(v){
    var d=new Date(v.created_at);
    return '<div class="version-row"><div><b>v'+esc(v.version_number)+'</b><small>'+esc(d.toLocaleString("nl-NL"))+'</small></div><button type="button" data-version="'+esc(v.id)+'">Herstellen</button></div>';
  }).join(""):'<small class="version-empty">Nog geen opgeslagen versies.</small>';
  $("versions").querySelectorAll("[data-version]").forEach(function(b){b.onclick=function(){restoreVersion(b.getAttribute("data-version"));};});
}

async function restoreVersion(id){
  var r=await db.from("hn_site_page_versions").select("snapshot,version_number").eq("id",id).maybeSingle();
  if(r.error||!r.data){note("Versie kon niet worden geladen.",true);return;}
  var snap=r.data.snapshot||{};
  if(snap.page){
    page=Object.assign({},page,snap.page);
    $("title").value=page.title||"";$("slug").value=page.slug||"";
    $("seoTitle").value=page.seo_title||"";$("seoDesc").value=page.seo_description||"";$("desc").value=page.description||"";$("cmsMode").checked=page.settings&&page.settings.builder_mode==="cms";
  }
  sections=Array.isArray(snap.sections)?snap.sections:[];
  overrides=Array.isArray(snap.overrides)?snap.overrides:[];
  layouts=Array.isArray(snap.layouts)?snap.layouts:[];
  editorElements=Array.isArray(snap.editor_elements)?snap.editor_elements:(Array.isArray(snap.page&&snap.page.settings&&snap.page.settings.editor_elements)?snap.page.settings.editor_elements:[]);
  page.settings=Object.assign({},page.settings||{},{editor_elements:editorElements});
  selected=-1;selectedExisting=null;renderPreview();closeInspector();
  note("v"+r.data.version_number+" geladen als werkversie. Klik Opslaan als concept om deze toestand opnieuw vast te leggen.");
}

function defaults(type){
  if(window.HNComponentRegistry){var r=window.HNComponentRegistry.create(type);return Object.assign({title:r.content.title,content:r.content},r,{section_type:type});}
  var d={
    hero:["Nieuwe hero","Voeg hier je belangrijkste boodschap toe."],
    text:["Nieuwe tekst","Schrijf hier je inhoud."],
    image:["Nieuwe afbeelding",""],
    cards:["Uitgelicht","Titel | Beschrijving | /link"],
    cta:["Nieuwe CTA",""],
    links:["Handige links","Landen | /landen\nKennisbank | /kennisbank"],
    directory:["HN Overzicht",""],
    articles:["HN Artikelen",""],
    fiches:["HN Fiches",""],
    divider:["",""],spacer:["",""]
  }[type]||["Blok",""];
  var source=type==="directory"?"cities":type==="articles"?"topic":type==="fiches"?"topic":"";
  return {title:d[0],content:{text:d[1],url:type==="cta"?"/landen":"",button:type==="cta"?"Bekijk meer":"",image:"",cards:type==="cards"?d[1]:"",data_source:source,data_limit:6}};
}

function addAt(type,before){
  var d=defaults(type);
  var s={id:null,page_id:page.id,section_type:type,component_type:type,component_id:d.component_id||null,title:d.title,content:Object.assign({},d.content||{}),data:d.data||{},settings:d.settings||{},sort_order:sections.length,is_visible:true};
  if(s.content)s.content.component_id=s.component_id;
  s.content.insert_before=before||"__end__";
  sections.push(s);selected=sections.length-1;selectedExisting=null;pendingType=null;
  document.querySelectorAll(".tool").forEach(function(x){x.classList.remove("active");});
  renderPreview();inspect();note("HN-component toegevoegd.");
}

function sectionHtml(s){
  var c=s.content||{},body="",cid=s.component_id||(c&&c.component_id)||("new-"+sections.indexOf(s));
  if(s.section_type==="image")body=c.image?'<img src="'+esc(c.image)+'" style="max-width:100%;display:block;margin:auto;border-radius:9px">':"<p>Afbeelding toevoegen via de instellingen.</p>";
  else if(s.section_type==="cards")body='<div class="hn-preview-cards">'+(c.cards||"").split("\n").filter(Boolean).map(function(x){var a=x.split("|");return '<div><b>'+esc((a[0]||"").trim())+'</b><p>'+esc((a[1]||"").trim())+"</p></div>";}).join("")+"</div>";
  else if(s.section_type==="links")body=(c.text||"").split("\n").filter(Boolean).map(function(x){var a=x.split("|");return '<a href="'+esc((a[1]||"#").trim())+'">'+esc((a[0]||a[1]||"").trim())+" →</a>";}).join("");
  else if(s.section_type==="cta")body=c.button?'<a class="hn-preview-cta" href="'+esc(c.url||"#")+'">'+esc(c.button)+"</a>":"";
  else if(s.section_type==="directory"||s.section_type==="articles"||s.section_type==="fiches"){
    body='<div class="hn-db-preview"><span>HN DATA</span><b>'+esc(c.data_source||"database")+'</b><small>'+esc(String(c.data_limit||6))+' items · live gekoppeld bij publicatie</small></div>';
  }else if(s.section_type==="divider")body='<div class="hn-preview-divider"></div>';
  else if(s.section_type==="spacer")body='<div style="height:80px"></div>';
  else body='<p style="white-space:pre-wrap;line-height:1.7">'+esc(c.text||"")+"</p>";
  return '<section draggable="true" class="hn-builder-preview" data-hn-component-id="'+esc(cid)+'" data-section-id="'+esc(s.id||"new-"+sections.indexOf(s))+'"><button class="block-delete" data-delete-section="'+esc(s.id||"new-"+sections.indexOf(s))+'">Verwijder</button>'+(s.title?'<h2>'+esc(s.title)+"</h2>":"")+body+"</section>";
}

function selector(el,doc){
  var stable=el&&el.getAttribute&&el.getAttribute("data-hn-id");
  if(stable)return stableSelector(stable);
  var out=[];
  while(el&&el.nodeType===1&&el!==doc.body){
    if(el.id){out.unshift("#"+CSS.escape(el.id));break;}
    var n=1,s=el;
    while((s=s.previousElementSibling))if(s.tagName===el.tagName)n++;
    out.unshift(el.tagName.toLowerCase()+":nth-of-type("+n+")");el=el.parentElement;
  }
  return "body>"+out.join(">");
}
function rootOf(doc){return doc.querySelector("main")||doc.querySelector('[role="main"]')||doc.body;}
function existing(doc){
  var root=rootOf(doc);
  return Array.prototype.filter.call(root.children,function(e){
    return ["SCRIPT","STYLE","NOSCRIPT","HEADER","FOOTER","NAV"].indexOf(e.tagName)<0 &&
      e.getBoundingClientRect().height>5 &&
      String(e.textContent||"").trim() &&
      !e.classList.contains("hn-builder-preview")&&!e.classList.contains("hn-builder-add");
  });
}
function clearPreview(doc){doc.querySelectorAll(".hn-builder-add,.hn-builder-preview,.hn-editor-marker").forEach(function(e){e.remove();});}

function applyOverrides(doc){
  overrides.forEach(function(o){
    var el;
    try{el=doc.querySelector(o.selector);}catch(e){return;}
    if(!el)return;
    el.setAttribute("data-hn-editor-selector",o.selector);
    if(o.content_text!=null)el.textContent=o.content_text;
  });
}

function applyLayouts(doc){
  layouts.forEach(function(o){
    var el;
    try{el=doc.querySelector(o.selector);}catch(e){return;}
    if(!el)return;
    el.hidden=o.is_visible===false;
    if(o.settings&&o.settings.css)Object.keys(o.settings.css).forEach(function(k){el.style[k]=o.settings.css[k];});
  });
  var root=rootOf(doc);
  layouts.slice().sort(function(a,b){return(a.sort_order||0)-(b.sort_order||0);}).forEach(function(o){
    var el;
    try{el=doc.querySelector(o.selector);}catch(e){return;}
    if(el&&el.parentElement===root)root.appendChild(el);
  });
}

function renderSaved(doc){
  var root=rootOf(doc);
  sections.forEach(function(s){
    var wrap=doc.createElement("div");wrap.innerHTML=sectionHtml(s);var node=wrap.firstElementChild;if(!node)return;
    var target=null,ins=(s.content||{}).insert_before;
    if(ins&&ins!=="__end__"){
      var es=existing(doc);
      for(var i=0;i<es.length;i++)if(selector(es[i],doc)===ins){target=es[i];break;}
    }
    if(target)root.insertBefore(node,target);else root.appendChild(node);
  });
}

function addButtons(doc){
  var root=rootOf(doc),els=existing(doc);
  els.forEach(function(el){
    var b=doc.createElement("button");b.className="hn-builder-add";b.type="button";b.innerHTML="<span>+</span>";
    b.title="HN-component hier toevoegen";
    b.onclick=function(e){e.preventDefault();e.stopPropagation();if(!pendingType){note("Kies eerst links een HN-component.");return;}addAt(pendingType,selector(el,doc));};
    root.insertBefore(b,el);
  });
  var end=doc.createElement("button");end.className="hn-builder-add";end.type="button";end.innerHTML="<span>+</span>";
  end.onclick=function(){if(!pendingType){note("Kies eerst links een HN-component.");return;}addAt(pendingType,"__end__");};
  root.appendChild(end);
}

function selectExisting(el,doc){
  selected=-1;var id=elementId(el,doc);selectedExisting={id:id,selector:stableSelector(id),legacySelector:baseSelector(el,doc),element:el,original:el.textContent||"",tag:el.tagName.toLowerCase()};
  document.querySelectorAll(".hn-builder-preview").forEach(function(x){x.classList.remove("hn-builder-selected");});
  doc.querySelectorAll(".hn-editor-selected").forEach(function(x){x.classList.remove("hn-editor-selected");});
  el.classList.add("hn-editor-selected");
  inspectExisting();
}

function bindExisting(doc){
  existing(doc).forEach(function(el){
    el.setAttribute("data-hn-editor-target","true");
    el.addEventListener("click",function(e){
      if(e.target.closest(".hn-builder-add")||e.target.closest(".block-delete"))return;
      e.preventDefault();e.stopPropagation();selectExisting(el,doc);
    },true);
  });
}

function drawExisting(doc){
  live=existing(doc).map(function(el,i){return{el:el,index:i,selector:selector(el,doc)};});
  live.forEach(function(x){
    x.el.style.outline="1px dashed #C6A15B";
    x.el.draggable=true;
    x.el.ondragstart=function(){drag=x;};
    x.el.ondragover=function(e){e.preventDefault();x.el.classList.add("hn-drop-target");};
    x.el.ondragleave=function(){x.el.classList.remove("hn-drop-target");};
    x.el.ondrop=function(e){
      e.preventDefault();x.el.classList.remove("hn-drop-target");
      if(!drag||drag.el===x.el||drag.el.parentElement!==x.el.parentElement)return;
      if(drag.el.compareDocumentPosition(x.el)&Node.DOCUMENT_POSITION_FOLLOWING)x.el.before(drag.el);else x.el.after(drag.el);
      rebuildLayoutsFromDom(doc);
      note("Volgorde aangepast. Klik Opslaan als concept of Publiceren.");
    };
  });
}

function rebuildLayoutsFromDom(doc){
  var els=existing(doc),map=[];
  els.forEach(function(el,i){var id=elementId(el,doc);if(id)map.push({selector:stableSelector(id),sort_order:i,is_visible:!el.hidden,settings:{component_id:id}});});
  layouts=map;
}

function bindComponentDrag(doc){
  var nodes=[].slice.call(doc.querySelectorAll(".hn-builder-preview[data-hn-component-id]")),active=null;
  nodes.forEach(function(node){
    node.ondragstart=function(e){active=node;node.classList.add("hn-component-dragging");if(e.dataTransfer)e.dataTransfer.setData("text/plain",node.getAttribute("data-hn-component-id"));};
    node.ondragend=function(){node.classList.remove("hn-component-dragging");nodes.forEach(function(x){x.classList.remove("hn-component-drop")});active=null;};
    node.ondragover=function(e){if(!active||active===node)return;e.preventDefault();node.classList.add("hn-component-drop");};
    node.ondragleave=function(){node.classList.remove("hn-component-drop");};
    node.ondrop=function(e){
      e.preventDefault();node.classList.remove("hn-component-drop");if(!active||active===node)return;
      var a=active.getAttribute("data-hn-component-id"),b=node.getAttribute("data-hn-component-id");
      var ai=sections.findIndex(function(s){return (s.component_id||(s.content||{}).component_id)===a}),bi=sections.findIndex(function(s){return (s.component_id||(s.content||{}).component_id)===b});
      if(ai<0||bi<0)return;var item=sections.splice(ai,1)[0];if(ai<bi)bi--;sections.splice(bi,0,item);sections.forEach(function(s,i){s.sort_order=i});
      renderPreview();note("HN-component verplaatst. Klik Opslaan als concept of Publiceren.");
    };
  });
}
function renderPreview(){
  window.sections=sections;
  var f=$("liveFrame");if(!f||!f.contentDocument)return;
  var doc=f.contentDocument;
  clearPreview(doc);
  ensureEditorElements(doc);
  applyOverrides(doc);applyLayouts(doc);renderSaved(doc);addButtons(doc);bindExisting(doc);bindPreview(doc);drawExisting(doc);bindComponentDrag(doc);
}

function loadLive(){
  var f=$("liveFrame");var target=route(page.slug);target+=(target.indexOf("?")>=0?"&":"?")+"hn_builder_preview=1";f.src=target;
  f.onload=function(){setTimeout(renderPreview,250);};
}

function setSelection(kind,title,meta){
  if(!$("selectionTitle"))return;
  $("selectionTitle").textContent=title||"";
  $("selectionMeta").textContent=meta||"";
  $("selectionState").className="selection-state "+kind;
}

function inspectExisting(){
  $("blockInspector").hidden=false;
  $("kind").textContent="Bestaand pagina-element";
  $("type").innerHTML='<option value="existing">Bestaand HN-element</option>';
  $("type").value="existing";
  $("bt").value="";
  $("tx").value=selectedExisting?selectedExisting.element.textContent||"":"";
  $("url").value="";
  $("btn").value="";
  $("img").value="";
  $("align").value="left";
  $("cards").value="";
  $("cardWrap").style.display="none";
  $("existingActions").hidden=false;
  $("dataWrap").hidden=true;
  $("componentMeta").hidden=true;
  setSelection("existing","Bestaand element","Component-ID: "+selectedExisting.id);
}

function inspect(){
  if(selected<0||!sections[selected]){if(!selectedExisting)closeInspector();return;}
  selectedExisting=null;
  var s=sections[selected],c=s.content||{};
  $("blockInspector").hidden=false;
  $("kind").textContent=T[s.section_type]||s.section_type;
  $("type").innerHTML=Object.keys(T).map(function(k){return'<option value="'+k+'">'+T[k]+"</option>";}).join("");
  $("type").value=s.section_type;
  $("bt").value=s.title||"";$("tx").value=c.text||"";$("url").value=c.url||"";
  $("btn").value=c.button||"";$("img").value=c.image||"";$("align").value=c.align||"left";$("visible").checked=s.is_visible!==false;
  $("cards").value=c.cards||"";$("cardWrap").style.display=s.section_type==="cards"?"block":"none";
  $("existingActions").hidden=true;
  $("dataWrap").hidden=!["directory","articles","fiches","cities","categories","navigation"].includes(s.section_type);
  $("dataSource").value=(c.data_source||(s.data&&s.data.source)||"");
  $("dataLimit").value=c.data_limit||(s.data&&s.data.limit)||6;
  $("dataFilters").value=typeof c.data_filters==="string"?c.data_filters:JSON.stringify(c.data_filters||{},null,2);
  $("componentMeta").hidden=false;
  $("componentId").textContent=s.component_id||(c&&c.component_id)||"nog niet opgeslagen";
  $("componentType").textContent=s.component_type||s.section_type;
  setSelection("component","HN-component: "+(T[s.section_type]||s.section_type),"Component-ID: "+(s.component_id||(s.content&&s.content.component_id)||"nog niet opgeslagen"));
}

function closeInspector(){
  $("blockInspector").hidden=true;selected=-1;selectedExisting=null;
  setSelection("page",page?"Pagina: "+page.title:"Niets geselecteerd","Pagina-instellingen");
  if($("liveFrame")&&$("liveFrame").contentDocument)$("liveFrame").contentDocument.querySelectorAll(".hn-editor-selected").forEach(function(x){x.classList.remove("hn-editor-selected");});
}

function edit(k,v){
  if(selected<0||!sections[selected])return;
  var s=sections[selected];s.content=s.content||{};s.data=s.data||{};s.settings=s.settings||{};
  if(k==="title")s.title=v;
  else if(k==="type"){s.section_type=v;s.component_type=v;}
  else if(k==="dataSource"){s.content.data_source=v;s.data.source=v;}
  else if(k==="dataLimit"){s.content.data_limit=Math.max(1,Math.min(50,Number(v)||6));s.data.limit=s.content.data_limit;}
  else if(k==="visible"){s.is_visible=!!v;s.settings.visibility=!!v;} else if(k==="dataFilters"){
    try{s.content.data_filters=JSON.parse(v||"{}");}catch(e){s.content.data_filters={};note("Filters zijn geen geldige JSON.",true);return;}
    s.data.filters=s.content.data_filters;
  } else s.content[k]=v;
  renderPreview();inspect();
}

async function saveExisting(){
  if(!selectedExisting||!page)return;
  var text=$("tx").value;
  var found=null;
  for(var i=0;i<overrides.length;i++)if(overrides[i].selector===selectedExisting.selector)found=overrides[i];
  var ss=await db.auth.getSession(),u=ss.data&&ss.data.session?ss.data.session.user.id:null;
  var payload={route:routeKey(),selector:selectedExisting.selector,element_type:selectedExisting.tag,original_text:selectedExisting.original,content_text:text,updated_by:u};
  var r=found?await db.from("hn_content_overrides").update(payload).eq("route",routeKey()).eq("selector",selectedExisting.selector):await db.from("hn_content_overrides").insert(payload);
  if(r.error){note(r.error.message,true);return;}
  if(found)Object.assign(found,payload);else overrides.push(payload);
  renderPreview();note("Bestaand pagina-element opgeslagen.");
}

async function save(pub){
  if(selectedExisting){await saveExisting();if(!pub)return;}
  if(!page)return;
  page.title=$("title").value.trim();
  page.slug=cleanSlug($("slug").value);
  page.seo_title=$("seoTitle").value.trim();
  page.seo_description=$("seoDesc").value.trim();
  page.description=$("desc").value.trim();
  sections=sections.map(function(s){return window.HNComponentRegistry?window.HNComponentRegistry.normalize(s):s;});
  sections.forEach(function(s,i){s.sort_order=i;s.component_id=s.component_id||(s.content&&s.content.component_id)||stableId();s.content=s.content||{};s.content.component_id=s.component_id;});
  var componentTree=window.HNComponentRegistry?window.HNComponentRegistry.tree(sections):sections.map(function(s,i){return {id:s.component_id,type:s.section_type,order:i,visible:s.is_visible!==false,content:s.content||{},data:s.data||{},settings:s.settings||{}};});
  page.settings=Object.assign({},page.settings||{}, {editor_elements:editorElements,component_tree:componentTree,builder_mode:$("cmsMode").checked?"cms":"legacy"});

  var ss=await db.auth.getSession(),u=ss.data&&ss.data.session?ss.data.session.user.id:null;
  var last=await db.from("hn_site_page_versions").select("version_number").eq("page_id",page.id).order("version_number",{ascending:false}).limit(1).maybeSingle();
  var version=(last.data&&last.data.version_number||0)+1;
  var snapshotPage=Object.assign({},page,{status:pub?"published":"draft",settings:Object.assign({},page.settings,{builder_mode:$("cmsMode").checked?"cms":"legacy"})});
  var snapshot={page:snapshotPage,sections:sections,overrides:overrides,layouts:layouts,editor_elements:editorElements,component_tree:componentTree};
  var r=await db.from("hn_site_page_versions").insert({page_id:page.id,version_number:version,snapshot:snapshot,created_by:u});
  if(r.error){note(r.error.message,true);return;}

  if(!pub){note("Concept v"+version+" opgeslagen. De live pagina is niet gewijzigd.");loadVersions();return;}

  r=await db.from("hn_site_pages").update({title:page.title,slug:page.slug,status:"published",seo_title:page.seo_title,seo_description:page.seo_description,description:page.description,settings:Object.assign({},page.settings||{},{builder_mode:$("cmsMode").checked?"cms":"legacy"})}).eq("id",page.id);
  if(r.error){note(r.error.message,true);return;}

  var old=await db.from("hn_site_sections").select("id").eq("page_id",page.id);
  if(old.error){note(old.error.message,true);return;}
  var keep={};
  for(var i=0;i<sections.length;i++){
    var s=sections[i],q;
    if(s.id){
      keep[s.id]=true;
      q=await db.from("hn_site_sections").update({section_type:s.section_type,title:s.title,content:Object.assign({},s.content,{component_id:s.component_id,data:s.data||{},settings:s.settings||{}}),sort_order:s.sort_order,is_visible:s.is_visible!==false}).eq("id",s.id);
    }else{
      q=await db.from("hn_site_sections").insert({page_id:page.id,section_type:s.section_type,title:s.title,content:Object.assign({},s.content,{component_id:s.component_id,data:s.data||{},settings:s.settings||{}}),sort_order:s.sort_order,is_visible:s.is_visible!==false}).select().single();
      if(!q.error){s.id=q.data.id;keep[s.id]=true;}
    }
    if(q.error){note(q.error.message,true);return;}
  }
  for(var j=0;j<(old.data||[]).length;j++){
    if(!keep[old.data[j].id]){
      q=await db.from("hn_site_sections").delete().eq("id",old.data[j].id);
      if(q.error){note(q.error.message,true);return;}
    }
  }

  r=await persistOverrides(u);if(r.error){note(r.error.message,true);return;}
  r=await persistLayouts(u);if(r.error){note(r.error.message,true);return;}

  note("v"+version+" gepubliceerd.");
  drawPages();loadVersions();loadLive();
}

async function persistOverrides(u){
  var existingRows=await db.from("hn_content_overrides").select("id,selector").eq("route",routeKey());
  if(existingRows.error)return existingRows;
  var keep={};
  for(var i=0;i<overrides.length;i++){
    var o=overrides[i];
    keep[o.selector]=true;
    var q=await db.from("hn_content_overrides").upsert({route:routeKey(),selector:o.selector,element_type:o.element_type||null,original_text:o.original_text||null,content_text:o.content_text||"",updated_by:u},{onConflict:"route,selector"});
    if(q.error)return q;
  }
  for(var j=0;j<(existingRows.data||[]).length;j++)if(!keep[existingRows.data[j].selector]){
    var d=await db.from("hn_content_overrides").delete().eq("id",existingRows.data[j].id);
    if(d.error)return d;
  }
  return {error:null};
}

async function persistLayouts(u){
  var existingRows=await db.from("hn_page_layout_overrides").select("id,selector").eq("route",routeKey());
  if(existingRows.error)return existingRows;
  var keep={};
  for(var i=0;i<layouts.length;i++){
    var o=layouts[i];keep[o.selector]=true;
    var q=await db.from("hn_page_layout_overrides").upsert({route:routeKey(),selector:o.selector,sort_order:i,is_visible:o.is_visible!==false,settings:o.settings||{},updated_by:u},{onConflict:"route,selector"});
    if(q.error)return q;
  }
  for(var j=0;j<(existingRows.data||[]).length;j++)if(!keep[existingRows.data[j].selector]){
    var d=await db.from("hn_page_layout_overrides").delete().eq("id",existingRows.data[j].id);
    if(d.error)return d;
  }
  return {error:null};
}

function bindPreview(doc){
  doc.querySelectorAll("[data-delete-section]").forEach(function(b){
    b.onclick=function(e){
      e.stopPropagation();
      var id=b.getAttribute("data-delete-section"),idx=-1;
      for(var i=0;i<sections.length;i++)if(String(sections[i].id||"new-"+i)===id)idx=i;
      if(idx>=0){sections.splice(idx,1);selected=-1;renderPreview();closeInspector();}
    };
  });
  doc.querySelectorAll(".hn-builder-preview").forEach(function(e){
    e.onclick=function(e2){
      if(e2.target.closest(".block-delete"))return;
      var id=e.getAttribute("data-section-id");
      for(var i=0;i<sections.length;i++)if(String(sections[i].id||"new-"+i)===id)selected=i;
      selectedExisting=null;inspect();
    };
  });
}

function bind(){
  ensureBuilderUI();palette();
  $("save").onclick=function(){save(false);};
  $("publish").onclick=function(){save(true);};
  $("dataSource").onchange=function(){edit("dataSource",this.value);};
  $("dataLimit").oninput=function(){edit("dataLimit",this.value);};
  $("dataFilters").onchange=function(){edit("dataFilters",this.value);};
  $("open").onclick=function(){if(page)window.open(route(page.slug),"_blank");};
  $("focus").onclick=function(){document.querySelector(".builder").classList.toggle("focus-mode");};
  $("desktop").onclick=function(){$("liveFrameWrap").className="desktop";$("desktop").classList.add("active");$("mobile").classList.remove("active");};
  $("mobile").onclick=function(){$("liveFrameWrap").className="mobile";$("mobile").classList.add("active");$("desktop").classList.remove("active");};

  $("new").onclick=async function(){
    var r=await db.from("hn_site_pages").insert({slug:"nieuwe-pagina-"+Date.now(),title:"Nieuwe pagina",status:"draft",settings:{builder_mode:"cms"}}).select().single();
    if(r.error){note(r.error.message,true);return;}pages.push(r.data);drawPages();pick(r.data.id);
  };

  $("type").onchange=function(e){if(e.target.value!=="existing")edit("type",e.target.value);};
  $("bt").oninput=function(e){edit("title",e.target.value);};
  $("tx").oninput=function(e){if(selectedExisting){return;}edit("text",e.target.value);};
  $("url").oninput=function(e){edit("url",e.target.value);};
  $("btn").oninput=function(e){edit("button",e.target.value);};
  $("img").oninput=function(e){edit("image",e.target.value);};
  $("visible").onchange=function(e){edit("visible",e.target.checked);};
  $("align").onchange=function(e){edit("align",e.target.value);};
  $("cards").oninput=function(e){edit("cards",e.target.value);};
  $("dataSource").oninput=function(e){edit("data_source",e.target.value);};
  $("dataLimit").oninput=function(e){edit("data_limit",Math.max(1,Math.min(50,Number(e.target.value)||6)));};
  $("dup").onclick=function(){
    if(selected<0)return;
    var clone=JSON.parse(JSON.stringify(sections[selected]));clone.id=null;clone.component_id=stableId();clone.component_type=clone.component_type||clone.section_type;clone.content=clone.content||{};clone.content.component_id=clone.component_id;clone.title=(clone.title||"Blok")+" kopie";clone.sort_order=sections.length;sections.push(clone);selected=sections.length-1;renderPreview();inspect();
  };
  $("remove").onclick=function(){
    if(selected<0)return;
    sections.splice(selected,1);selected=-1;renderPreview();closeInspector();
  };
  $("saveExisting").onclick=saveExisting;
  $("resetExisting").onclick=async function(){
    if(!selectedExisting)return;
    var r=await db.from("hn_content_overrides").delete().eq("route",routeKey()).eq("selector",selectedExisting.selector);
    if(r.error){note(r.error.message,true);return;}
    overrides=overrides.filter(function(x){return x.selector!==selectedExisting.selector;});
    renderPreview();note("Bestaande tekst teruggezet naar de originele pagina.");
  };
  $("cancelExisting").onclick=function(){closeInspector();};

  $("cmsMode").onchange=function(){if(!page)return;page.settings=Object.assign({},page.settings||{},{builder_mode:this.checked?"cms":"legacy"});note(this.checked?"CMS-opbouw actief. Bij publicatie wordt de componentstructuur de bron van de live pagina.":"Legacy-opbouw actief. De bestaande HTML blijft de bron van de live pagina.");};
  ["title","slug","seoTitle","seoDesc","desc"].forEach(function(id){
    $(id).oninput=function(){
      if(!page)return;
      page.title=$("title").value;page.slug=cleanSlug($("slug").value);
      $("heading").textContent=page.title;$("route").textContent=route(page.slug);
      setSelection("page","Pagina: "+page.title,"Pagina-instellingen");
    };
  });
}

admin().then(function(ok){if(ok){bind();load();}});
})();