(function(){
var db=null,pages=[],page=null,sections=[],live=[],selected=-1,pendingType=null,drag=null;
var $=function(id){return document.getElementById(id);};
var T={hero:"Hero",text:"Tekst",image:"Afbeelding",cards:"Kaarten",cta:"CTA",links:"Links",directory:"Overzicht",articles:"Artikels",fiches:"Fiches",divider:"Scheidingslijn",spacer:"Ruimte"};
var icons={hero:"H",text:"T",image:"I",cards:"K",cta:"B",links:"L",directory:"O",articles:"A",fiches:"F",divider:"—",spacer:"↕"};
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m];});}
function cleanSlug(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");}
function route(s){s=String(s||"").replace(/^\//,"").replace(/\.html$/i,"");var m={"":"/",home:"/", "home-oud":"/home-oud","home-huidig":"/home-huidig",landen:"/landen",kennisbank:"/kennisbank",navigatie:"/navigatie","smart-search":"/smart-search",community:"/community",stappenplan:"/stappenplan",orientatie:"/orientatie",orientatietest:"/orientatietest",voorbereiding:"/voorbereiding",vertrek:"/vertrek",integratie:"/integratie",realiteitscheck:"/realiteitscheck",verhalen:"/verhalen",stedengids:"/stedengids",vergelijken:"/vergelijken",hulp:"/hulp","over-hn":"/over-hn"};return m[s]||("/pagina/"+encodeURIComponent(s));}
function note(t,error){$("msg").textContent=t;$("msg").hidden=false;setTimeout(function(){$("msg").hidden=true;},3500);}
async function admin(){
 db=window.hijrahSupabase;if(!db){location="/login?next=/admin-builder";return false;}
 var ss=await db.auth.getSession(),session=ss.data&&ss.data.session;if(!session){location="/login?next=/admin-builder";return false;}
 var rr=await db.from("profiles").select("role").eq("id",session.user.id).maybeSingle();
 if(!rr.data||rr.data.role!=="admin"){document.body.innerHTML="<h1 style='padding:40px'>Geen toegang</h1>";return false;}return true;
}
function drawPages(){
 $("pages").innerHTML=pages.map(function(p){return '<button class="page '+(page&&page.id===p.id?"active":"")+'" data-id="'+esc(p.id)+'"><b>'+esc(p.title||"Zonder titel")+'</b><small>'+esc(route(p.slug))+" · "+esc(p.status||"draft")+"</small></button>";}).join("");
 document.querySelectorAll(".page").forEach(function(b){b.onclick=function(){pick(b.getAttribute("data-id"));};});
}
function palette(){
 $("palette").innerHTML=Object.keys(T).map(function(k){return '<button class="tool" data-type="'+k+'">'+icons[k]+" "+T[k]+"</button>";}).join("");
 document.querySelectorAll(".tool").forEach(function(b){b.onclick=function(){pendingType=b.getAttribute("data-type");document.querySelectorAll(".tool").forEach(function(x){x.classList.remove("active");});b.classList.add("active");note("Klik op een oranje + in de pagina waar dit blok moet komen.");};});
}
async function load(){
 var r=await db.from("hn_site_pages").select("*").order("title");if(r.error){note(r.error.message,true);return;}pages=r.data||[];drawPages();
 var raw=new URLSearchParams(location.search).get("slug")||"";raw=raw.replace(/^\//,"").replace(/\.html$/i,"");
 var target=null;for(var i=0;i<pages.length;i++){if(pages[i].slug===raw){target=pages[i];break;}if(!raw&&!pages[i].slug)target=pages[i];}
 if(target)pick(target.id);else if(pages[0])pick(pages[0].id);
}
async function pick(id){
 for(var i=0;i<pages.length;i++)if(pages[i].id===id)page=pages[i];if(!page)return;
 selected=-1;pendingType=null;$("empty").hidden=true;$("editor").hidden=false;
 $("heading").textContent=page.title||"Pagina";$("route").textContent=route(page.slug);
 $("title").value=page.title||"";$("slug").value=page.slug||"";$("status").value=page.status||"draft";
 $("seoTitle").value=page.seo_title||"";$("seoDesc").value=page.seo_description||"";$("desc").value=page.description||"";
 var r=await db.from("hn_site_sections").select("*").eq("page_id",id).order("sort_order");if(r.error){note(r.error.message,true);return;}
 sections=r.data||[];
 var vr=await db.from("hn_site_page_versions").select("snapshot,version_number").eq("page_id",id).order("version_number",{ascending:false}).limit(1).maybeSingle();
 if(!vr.error&&vr.data&&vr.data.snapshot&&Array.isArray(vr.data.snapshot.sections)){
   sections=vr.data.snapshot.sections;
   if(vr.data.snapshot.page){
     var sp=vr.data.snapshot.page;
     $("title").value=sp.title||$("title").value;
     $("slug").value=sp.slug||$("slug").value;
     $("seoTitle").value=sp.seo_title||$("seoTitle").value;
     $("seoDesc").value=sp.seo_description||$("seoDesc").value;
     $("desc").value=sp.description||$("desc").value;
   }
 }
 drawPages();closeInspector();loadLive();
}
function defaults(type){
 var d={hero:["Nieuwe hero","Voeg hier je belangrijkste boodschap toe."],text:["Nieuwe tekst","Schrijf hier je inhoud."],image:["Nieuwe afbeelding",""],cards:["Uitgelicht","Titel | Beschrijving | /link"],cta:["Nieuwe CTA",""],links:["Handige links","Landen | /landen\nKennisbank | /kennisbank"],directory:["Overzicht","Dynamisch HN-overzicht"],articles:["Artikels","Relevante artikels uit HN."],fiches:["Fiches","Relevante lokale fiches uit HN."],divider:["",""],spacer:["",""]}[type]||["Blok",""];
 return {title:d[0],content:{text:d[1],url:type==="cta"?"/landen":"",button:type==="cta"?"Bekijk meer":"",image:"",cards:type==="cards"?d[1]:""}};
}
function addAt(type,before){
 var d=defaults(type),s={id:null,page_id:page.id,section_type:type,title:d.title,content:d.content,sort_order:sections.length,is_visible:true};
 s.content.insert_before=before||"__end__";sections.push(s);selected=sections.length-1;pendingType=null;
 document.querySelectorAll(".tool").forEach(function(x){x.classList.remove("active");});renderPreview();inspect();note("Blok toegevoegd op deze plek.");
}
function sectionHtml(s){
 var c=s.content||{},body="";
 if(s.section_type==="image")body=c.image?'<img src="'+esc(c.image)+'" style="max-width:100%;display:block;margin:auto;border-radius:9px">':"<p>Voeg een afbeelding toe via de rechterkolom.</p>";
 else if(s.section_type==="cards")body='<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px">'+(c.cards||"").split("\n").filter(Boolean).map(function(x){var a=x.split("|");return '<div style="padding:14px;border:1px solid #C6A15B;border-radius:8px"><b>'+esc((a[0]||"").trim())+'</b><p>'+esc((a[1]||"").trim())+"</p></div>";}).join("")+"</div>";
 else if(s.section_type==="links")body=(c.text||"").split("\n").filter(Boolean).map(function(x){var a=x.split("|");return '<a href="'+esc((a[1]||"#").trim())+'" style="display:block;padding:7px;color:#674C2E">'+esc((a[0]||a[1]||"").trim())+" →</a>";}).join("");
 else if(s.section_type==="cta")body=c.button?'<a href="'+esc(c.url||"#")+'" style="display:inline-block;margin-top:14px;padding:11px 15px;background:#DD842A;color:#fff;border-radius:8px;text-decoration:none">'+esc(c.button)+"</a>":"";
 else if(s.section_type==="divider")body='<div style="height:1px;background:#C6A15B"></div>';
 else if(s.section_type==="spacer")body='<div style="height:80px"></div>';
 else body='<p style="white-space:pre-wrap;line-height:1.7">'+esc(c.text||"")+"</p>";
 return '<section class="hn-builder-preview" data-section-id="'+esc(s.id||"new-"+sections.indexOf(s))+'" style="position:relative;padding:34px 42px;border-bottom:1px solid #C6A15B"><button class="block-delete" data-delete-section="'+esc(s.id||"new-"+sections.indexOf(s))+'">Verwijder</button>'+(s.title?'<h2 style="color:#674C2E;margin:0 0 12px">'+esc(s.title)+"</h2>":"")+body+"</section>";
}
function selector(el,doc){
 var out=[];while(el&&el.nodeType===1&&el!==doc.body){if(el.id){out.unshift("#"+CSS.escape(el.id));break;}var n=1,s=el;while((s=s.previousElementSibling)){if(s.tagName===el.tagName)n++;}out.unshift(el.tagName.toLowerCase()+":nth-of-type("+n+")");el=el.parentElement;}return "body>"+out.join(">");
}
function rootOf(doc){return doc.querySelector("main")||doc.querySelector('[role="main"]')||doc.body;}
function existing(doc){var root=rootOf(doc);return Array.prototype.filter.call(root.children,function(e){return ["SCRIPT","STYLE","NOSCRIPT","HEADER","FOOTER","NAV"].indexOf(e.tagName)<0&&e.getBoundingClientRect().height>5&&String(e.textContent||"").trim()&&!e.classList.contains("hn-builder-preview")&&!e.classList.contains("hn-builder-add");});}
function clearPreview(doc){doc.querySelectorAll(".hn-builder-add,.hn-builder-preview").forEach(function(e){e.remove();});}
function renderSaved(doc){
 var root=rootOf(doc);
 sections.forEach(function(s){
  var wrap=doc.createElement("div");wrap.innerHTML=sectionHtml(s);var node=wrap.firstElementChild;if(!node)return;
  var target=null,ins=(s.content||{}).insert_before;
  if(ins&&ins!=="__end__"){var es=existing(doc);for(var i=0;i<es.length;i++){if(selector(es[i],doc)===ins){target=es[i];break;}}}
  if(target)root.insertBefore(node,target);else root.appendChild(node);
 });
}
function addButtons(doc){
 var root=rootOf(doc),els=existing(doc);
 els.forEach(function(el){
  var b=doc.createElement("button");b.className="hn-builder-add";b.type="button";b.innerHTML="<span>+</span>";b.title="Hier blok toevoegen";
  b.onclick=function(){if(!pendingType){note("Kies eerst links een bloktype.");return;}addAt(pendingType,selector(el,doc));};root.insertBefore(b,el);
 });
 var end=doc.createElement("button");end.className="hn-builder-add";end.type="button";end.innerHTML="<span>+</span>";end.onclick=function(){if(!pendingType){note("Kies eerst links een bloktype.");return;}addAt(pendingType,"__end__");};root.appendChild(end);
}
function bindPreview(doc){
 doc.querySelectorAll("[data-delete-section]").forEach(function(b){b.onclick=function(e){e.stopPropagation();var id=b.getAttribute("data-delete-section"),idx=-1;for(var i=0;i<sections.length;i++){if(String(sections[i].id||"new-"+i)===id){idx=i;break;}}if(idx>=0){sections.splice(idx,1);selected=-1;renderPreview();closeInspector();}};});
 doc.querySelectorAll(".hn-builder-preview").forEach(function(e){e.onclick=function(){var id=e.getAttribute("data-section-id");for(var i=0;i<sections.length;i++){if(String(sections[i].id||"new-"+i)===id)selected=i;}inspect();};});
}
function drawExisting(doc){
 live=existing(doc).map(function(el,i){return {el:el,index:i,selector:selector(el,doc)};});
 live.forEach(function(x){x.el.style.outline="1px dashed #C6A15B";x.el.draggable=true;x.el.ondragstart=function(){drag=x;};x.el.ondragover=function(e){e.preventDefault();};x.el.ondrop=function(e){e.preventDefault();if(!drag||drag.el===x.el||drag.el.parentElement!==x.el.parentElement)return;if(drag.index<x.index)x.el.after(drag.el);else x.el.before(drag.el);note("Volgorde aangepast. Klik Opslaan.");};});
}
function renderPreview(){var f=$("liveFrame");if(!f||!f.contentDocument)return;var doc=f.contentDocument;clearPreview(doc);renderSaved(doc);addButtons(doc);bindPreview(doc);drawExisting(doc);}
function loadLive(){var f=$("liveFrame");f.src=route(page.slug);f.onload=function(){setTimeout(renderPreview,350);};}
function inspect(){
 if(selected<0||!sections[selected]){closeInspector();return;}var s=sections[selected],c=s.content||{};
 $("blockInspector").hidden=false;$("kind").textContent=T[s.section_type];
 $("type").innerHTML=Object.keys(T).map(function(k){return '<option value="'+k+'">'+T[k]+"</option>";}).join("");
 $("type").value=s.section_type;$("bt").value=s.title||"";$("tx").value=c.text||"";$("url").value=c.url||"";$("btn").value=c.button||"";$("img").value=c.image||"";$("align").value=c.align||"left";$("cards").value=c.cards||"";$("cardWrap").style.display=s.section_type==="cards"?"block":"none";
}
function closeInspector(){$("blockInspector").hidden=true;selected=-1;}
function edit(k,v){if(selected<0)return;var s=sections[selected];s.content=s.content||{};if(k==="title")s.title=v;else if(k==="type")s.section_type=v;else s.content[k]=v;renderPreview();inspect();}
async function save(pub){
 if(!page)return;
 page.title=$("title").value.trim();
 page.slug=cleanSlug($("slug").value);
 page.seo_title=$("seoTitle").value.trim();
 page.seo_description=$("seoDesc").value.trim();
 page.description=$("desc").value.trim();
 page.status=pub?"published":(page.status||"draft");
 sections.forEach(function(s,i){s.sort_order=i;});
 var ss=await db.auth.getSession(),u=ss.data&&ss.data.session?ss.data.session.user.id:null;
 var last=await db.from("hn_site_page_versions").select("version_number").eq("page_id",page.id).order("version_number",{ascending:false}).limit(1).maybeSingle();
 var version=(last.data&&last.data.version_number||0)+1;
 var snapshotPage=Object.assign({},page,{status:pub?"published":"draft"});
 var r=await db.from("hn_site_page_versions").insert({page_id:page.id,version_number:version,snapshot:{page:snapshotPage,sections:sections},created_by:u});
 if(r.error){note(r.error.message,true);return;}
 if(!pub){
   note("Concept opgeslagen. De live pagina is niet gewijzigd.");
   return;
 }
 r=await db.from("hn_site_pages").update({title:page.title,slug:page.slug,status:"published",seo_title:page.seo_title,seo_description:page.seo_description,description:page.description}).eq("id",page.id);
 if(r.error){note(r.error.message,true);return;}
 var old=await db.from("hn_site_sections").select("id").eq("page_id",page.id);
 if(old.error){note(old.error.message,true);return;}
 var keep={};
 for(var i=0;i<sections.length;i++){
   var s=sections[i],q;
   if(s.id){
     keep[s.id]=true;
     q=await db.from("hn_site_sections").update({section_type:s.section_type,title:s.title,content:s.content,sort_order:s.sort_order,is_visible:true}).eq("id",s.id);
   }else{
     q=await db.from("hn_site_sections").insert({page_id:page.id,section_type:s.section_type,title:s.title,content:s.content,sort_order:s.sort_order,is_visible:true}).select().single();
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
 note("Gepubliceerd.");
 drawPages();
 loadLive();
}function bind(){
 palette();$("save").onclick=function(){save(false);};$("publish").onclick=function(){save(true);};$("open").onclick=function(){if(page)window.open(route(page.slug),"_blank");};
 $("desktop").onclick=function(){$("liveFrameWrap").className="desktop";$("desktop").classList.add("active");$("mobile").classList.remove("active");};
 $("mobile").onclick=function(){$("liveFrameWrap").className="mobile";$("mobile").classList.add("active");$("desktop").classList.remove("active");};
 $("new").onclick=async function(){var r=await db.from("hn_site_pages").insert({slug:"nieuwe-pagina-"+Date.now(),title:"Nieuwe pagina",status:"draft"}).select().single();if(r.error){note(r.error.message,true);return;}pages.push(r.data);drawPages();pick(r.data.id);};
 $("type").onchange=function(e){edit("type",e.target.value);};$("bt").oninput=function(e){edit("title",e.target.value);};$("tx").oninput=function(e){edit("text",e.target.value);};$("url").oninput=function(e){edit("url",e.target.value);};$("btn").oninput=function(e){edit("button",e.target.value);};$("img").oninput=function(e){edit("image",e.target.value);};$("align").onchange=function(e){edit("align",e.target.value);};$("cards").oninput=function(e){edit("cards",e.target.value);};
 ["title","slug","seoTitle","seoDesc","desc"].forEach(function(id){$(id).oninput=function(){if(!page)return;page.title=$("title").value;page.slug=cleanSlug($("slug").value);$("heading").textContent=page.title;$("route").textContent=route(page.slug);};});
}
admin().then(function(ok){if(ok){bind();load();}});
})();