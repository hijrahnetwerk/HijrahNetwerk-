(function(){
'use strict';
var w=window;if(!w.hijrahSupabase)return;
var db=w.hijrahSupabase;
var path=location.pathname.replace(/\/$/,"")||"/";
var route=path;
function esc(v){return String(v==null?"":v).replace(/[&<>"]/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]})}
function root(){return document.querySelector("main")||document.querySelector('[role="main"]')||document.body}
function selector(el){var out=[];while(el&&el.nodeType===1&&el!==document.body){if(el.id){out.unshift("#"+CSS.escape(el.id));break}var n=1,s=el;while((s=s.previousElementSibling)){if(s.tagName===el.tagName)n++}out.unshift(el.tagName.toLowerCase()+":nth-of-type("+n+")");el=el.parentElement}return "body>"+out.join(">")}
function baseBlocks(){var r=root();return [...r.children].filter(function(e){return !["SCRIPT","STYLE","NOSCRIPT","HEADER","FOOTER","NAV"].includes(e.tagName)&&e.getBoundingClientRect().height>5&&!e.classList.contains("hn-public-section")})}
function publicSlug(v){return String(v||"").replace(/-([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i,"")}
function ficheUrl(x){
 var d=x.card_data&&typeof x.card_data==="object"?x.card_data:{};
 var city=x.cities&&x.cities.name||"";
 var parts=["/locaties",city||"onbekend"];
 if(d.neighborhood)parts.push(String(d.neighborhood));
 parts.push(String(x.information_type||"informatie"));
 parts.push(publicSlug(x.slug||x.id));
 return parts.map(function(v){return encodeURIComponent(String(v).toLowerCase().replace(/[^a-z0-9\u00c0-\u024f]+/gi,"-").replace(/^-+|-+$/g,""))}).join("/");
}
async function fetchTopics(mode,limit,filters){
 var q=db.from("topic").select("id,title,slug,summary,content,information_type,status,published,visibility,source_type,verification_status,city_id,country_id,category_id,card_data,updated_at,cities(name),countries(name),categories(name)").eq("published",true).order("updated_at",{ascending:false}).limit(Math.min(Math.max(Number(limit)||6,1),50));
 if(mode==="fiches")q=q.eq("visibility","fiche_only");
 if(filters&&filters.city_id)q=q.eq("city_id",filters.city_id);
 if(filters&&filters.country_id)q=q.eq("country_id",filters.country_id);
 if(filters&&filters.category_id)q=q.eq("category_id",filters.category_id);
 var r=await q;return r.error?[]:(r.data||[]);
}
async function fetchCities(limit,filters){
 var q=db.from("cities").select("id,name,slug,description,country_id,is_active").eq("is_active",true).order("name").limit(Math.min(Math.max(Number(limit)||6,1),50));
 if(filters&&filters.country_id)q=q.eq("country_id",filters.country_id);
 var r=await q;return r.error?[]:(r.data||[]);
}
async function fetchCategories(limit){
 var r=await db.from("categories").select("id,name,slug,description,is_active").eq("is_active",true).order("sort_order").limit(Math.min(Math.max(Number(limit)||20,1),50));
 return r.error?[]:(r.data||[]);
}
function style(){
 if(document.getElementById("hn-component-runtime-style"))return;
 var s=document.createElement("style");s.id="hn-component-runtime-style";s.textContent=
 ".hn-public-data-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:18px}"+
 ".hn-public-data-grid article{padding:18px;border:1px solid rgba(103,76,46,.18);border-radius:14px;background:#fff}"+
 ".hn-public-data-grid strong{display:block;color:#674C2E;font-size:1.05rem}.hn-public-data-grid p{margin:7px 0;color:#674C2E;font-size:.92rem}"+
 ".hn-public-data-grid a{display:inline-block;margin-top:8px;color:#DD842A;font-weight:700;text-decoration:none}"+
 ".hn-public-cta{display:inline-block;margin-top:14px;padding:11px 15px;background:#DD842A;color:#fff;border-radius:8px;text-decoration:none}"+
 ".hn-navigation-component{display:grid;gap:12px}.hn-navigation-component form{display:flex;gap:8px;flex-wrap:wrap}.hn-navigation-component input,.hn-navigation-component select{font:inherit;padding:12px;border:1px solid rgba(103,76,46,.25);border-radius:9px;min-width:180px}.hn-navigation-component button{font:inherit;font-weight:700;padding:12px 16px;border:0;border-radius:9px;background:#DD842A;color:#fff;cursor:pointer}.hn-navigation-results{display:grid;gap:10px}.hn-navigation-result{padding:14px;border:1px solid rgba(103,76,46,.16);border-radius:12px;background:#fff}.hn-navigation-result .meta{font-size:.8rem;color:#674C2E;margin-top:5px}.hn-navigation-result a{color:#DD842A;font-weight:700;text-decoration:none}.hn-status{display:inline-block;margin-left:6px;padding:3px 7px;border-radius:99px;background:rgba(198,161,91,.18);font-size:.75rem;color:#674C2E}.hn-comparison{display:grid;gap:14px}.hn-comparison-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.hn-comparison-controls select{font:inherit;padding:11px;border:1px solid rgba(103,76,46,.25);border-radius:9px}.hn-comparison table{width:100%;border-collapse:collapse}.hn-comparison th,.hn-comparison td{text-align:left;padding:10px;border-top:1px solid rgba(103,76,46,.15);vertical-align:top}.hn-step-list{display:grid;gap:8px}.hn-step{display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px solid rgba(103,76,46,.15);border-radius:10px;background:#fff}.hn-step input{margin-top:4px;accent-color:#DD842A}.hn-public-empty{padding:16px;border:1px dashed rgba(103,76,46,.25);border-radius:10px;color:#674C2E}";
 document.head.appendChild(s);
}
function topicCard(x,mode){
 var d=x.card_data&&typeof x.card_data==="object"?x.card_data:{};
 var title=x.title||d.practice_name||"HN-informatie";
 var text=x.summary||d.short_description||x.content||"";
 var href=mode==="fiches"||x.visibility==="fiche_only"?ficheUrl(x):"/artikels/"+encodeURIComponent(publicSlug(x.slug||x.id));
 var status=x.verification_status||"";
 var statusMap={verified:"Geverifieerd",pending:"Controle nodig",needs_review:"Controle nodig",outdated:"Verouderd"};
 return '<article><strong>'+esc(title)+'</strong>'+(text?'<p>'+esc(String(text).slice(0,240))+'</p>':"")+
   '<div class="meta">'+esc(x.information_type||"HN-informatie")+(status&&statusMap[status]?'<span class="hn-status">'+esc(statusMap[status])+"</span>":"")+
   (x.cities&&x.cities.name?" · "+esc(x.cities.name):"")+'</div><a href="'+esc(href)+'">'+(mode==="fiches"||x.visibility==="fiche_only"?"Fiche bekijken →":"Artikel lezen →")+"</a></article>";
}
async function navigationMarkup(s){
 var c=s.content||{}, limit=c.data_limit||12, filters=c.data_filters||{};
 var topics=await fetchTopics("all",limit,filters);
 var cities=await fetchCities(20,filters);
 var cats=await fetchCategories(20);
 var urlParams=new URLSearchParams(location.search);
 var q=urlParams.get("q")||"";
 var city=urlParams.get("city")||"";
 var category=urlParams.get("category")||"";
 var country=urlParams.get("country")||"";
 var all=topics.map(function(x){return {type:"topic",title:x.title,summary:x.summary,slug:x.slug,id:x.id,city_id:x.city_id,category_id:x.category_id,city:x.cities&&x.cities.name||"",country:x.countries&&x.countries.name||"",information_type:x.information_type,visibility:x.visibility,card_data:x.card_data,verification_status:x.verification_status}});
 cities.forEach(function(x){all.push({type:"city",title:x.name,summary:x.description||"Stad in HN",slug:x.slug,id:x.id,city_id:x.id,city:x.name})});
 cats.forEach(function(x){all.push({type:"category",title:x.name,summary:x.description||"",slug:x.slug,id:x.id})});
 var result=all.filter(function(x){
   if(city&&String(x.city_id)!==String(city))return false;
   if(category&&String(x.category_id)!==String(category))return false;
   if(country&&x.type==="topic"&&String(x.country_id)!==String(country))return false;
   if(!q)return true;
   return String([x.title,x.summary,x.city,x.country,x.information_type].join(" ")).toLowerCase().includes(q.toLowerCase());
 }).slice(0,limit);
 var optionsCity='<option value="">Alle steden</option>'+cities.map(function(x){return '<option value="'+esc(x.id)+'"'+(String(x.id)===String(city)?" selected":"")+'>'+esc(x.name)+"</option>"}).join("");
 var optionsCat='<option value="">Alle categorieën</option>'+cats.map(function(x){return '<option value="'+esc(x.id)+'"'+(String(x.id)===String(category)?" selected":"")+'>'+esc(x.name)+"</option>"}).join("");
 var cards=result.length?result.map(function(x){
   var href=x.type==="city"?"/stad/"+encodeURIComponent(x.slug||x.id):x.type==="category"?"/kennisbank/"+encodeURIComponent(x.slug||x.id):(x.visibility==="fiche_only"?"/fiche?id="+encodeURIComponent(x.id):"/artikels/"+encodeURIComponent(publicSlug(x.slug||x.id)));
   return '<article class="hn-navigation-result"><strong>'+esc(x.title)+'</strong><div class="meta">'+esc(x.city||x.information_type||x.type)+'</div><p>'+esc(String(x.summary||"").slice(0,220))+'</p><a href="'+esc(href)+'">Bekijk informatie →</a></article>';
 }).join(""):'<div class="hn-public-empty">Geen passende HN-informatie gevonden. Probeer een andere zoekterm of filter.</div>';
 return '<div class="hn-navigation-component"><form id="hn-navigation-form"><input id="hn-navigation-q" value="'+esc(q)+'" placeholder="Zoek een stad, onderwerp, school, zorg, wonen..."><select id="hn-navigation-city">'+optionsCity+'</select><select id="hn-navigation-category">'+optionsCat+'</select><button>Zoeken</button></form><div class="hn-navigation-results">'+cards+"</div></div>";
}
async function comparisonMarkup(){
 var cities=await fetchCities(30,{});
 var opts='<option value="">Kies een stad</option>'+cities.map(function(x){return '<option value="'+esc(x.id)+'">'+esc(x.name)+"</option>"}).join("");
 var data=cities.map(function(x){return {id:x.id,name:x.name,description:x.description||"Geen beschrijving beschikbaar."}});
 return '<div class="hn-comparison" data-cities=''+esc(JSON.stringify(data))+''><div class="hn-comparison-controls"><select class="hn-compare-a">'+opts+'</select><select class="hn-compare-b">'+opts+'</select></div><div class="hn-comparison-output"><p>Kies twee steden om ze naast elkaar te bekijken.</p></div></div>';
}
async function stepsMarkup(){
 var r=await db.from("hijrah_steps").select("id,title,description,sort_order").order("sort_order");
 var rows=r.error?[]:(r.data||[]);
 if(!rows.length)return '<div class="hn-public-empty">Het stappenplan is nog niet beschikbaar.</div>';
 return '<div class="hn-step-list">'+rows.map(function(x){return '<label class="hn-step"><input type="checkbox" data-hn-step="'+esc(x.id)+'"><span><strong>'+esc(x.title||"Stap")+'</strong>'+(x.description?'<br><small>'+esc(x.description)+"</small>":"")+"</span></label>"}).join("")+'</div>';
}
async function render(s){
 var c=s.content||{},body="",dataSource=c.data_source||(s.data&&s.data.source)||"";
 if(s.section_type==="navigation")body=await navigationMarkup(s);
 else if(s.section_type==="directory"||s.section_type==="cities"){
   var rows=await fetchCities(c.data_limit,{});
   body='<div class="hn-public-data-grid">'+(rows.length?rows.map(function(x){return '<article><strong>'+esc(x.name)+'</strong>'+(x.description?'<p>'+esc(String(x.description).slice(0,240))+"</p>":"")+'<a href="/stad/'+encodeURIComponent(x.slug||x.id)+'">Stad bekijken →</a></article>'}).join(""):"<div class='hn-public-empty'>Er zijn nog geen steden beschikbaar.</div>")+"</div>";
 } else if(s.section_type==="categories"){
   var cats=await fetchCategories(c.data_limit);
   body='<div class="hn-public-data-grid">'+(cats.length?cats.map(function(x){return '<article><strong>'+esc(x.name)+'</strong>'+(x.description?'<p>'+esc(String(x.description).slice(0,240))+"</p>":"")+'<a href="/kennisbank/'+encodeURIComponent(x.slug||x.id)+'">Categorie bekijken →</a></article>'}).join(""):"<div class='hn-public-empty'>Er zijn nog geen categorieën beschikbaar.</div>")+"</div>";
 } else if(s.section_type==="articles"||s.section_type==="fiches"){
   var rows=await fetchTopics(s.section_type,c.data_limit,c.data_filters||{});
   body='<div class="hn-public-data-grid">'+(rows.length?rows.map(function(x){return topicCard(x,s.section_type)}).join(""):"<div class='hn-public-empty'>Er is momenteel geen informatie gevonden.</div>")+"</div>";
 } else if(s.section_type==="comparison")body=await comparisonMarkup();
 else if(s.section_type==="steps")body=await stepsMarkup();
 else if(s.section_type==="community")body='<p>De HN-community is de plek voor contact, herkenning en ervaringen van anderen.</p><a class="hn-public-cta" href="/community">Naar de community →</a>';
 else if(s.section_type==="image")body=c.image?'<img src="'+esc(c.image)+'" alt="'+esc(s.title||"")+'" style="max-width:100%;display:block;margin:auto">':"";
 else if(s.section_type==="cards")body='<div class="hn-public-data-grid">'+(c.cards||"").split("\n").filter(Boolean).map(function(x){var a=x.split("|");return '<article><strong>'+esc((a[0]||"").trim())+'</strong><p>'+esc((a[1]||"").trim())+"</p></article>"}).join("")+"</div>";
 else if(s.section_type==="links")body=(c.text||"").split("\n").filter(Boolean).map(function(x){var a=x.split("|");return '<a class="hn-public-cta" href="'+esc((a[1]||"#").trim())+'">'+esc((a[0]||a[1]||"").trim())+"</a>"}).join("");
 else if(s.section_type==="cta")body='<a class="hn-public-cta" href="'+esc(c.url||"#")+'">'+esc(c.button||"Bekijk meer")+"</a>";
 else if(s.section_type==="divider")body="<hr>";
 else if(s.section_type==="spacer")body='<div style="height:80px"></div>';
 else body=c.text?'<p>'+esc(c.text)+"</p>":"";
 var el=document.createElement("section");el.className="hn-public-section";if(s.id)el.dataset.hnSectionId=s.id;
 el.dataset.hnComponentId=s.component_id||(c.component_id)||"";el.dataset.hnComponentType=s.component_type||s.section_type;
 el.innerHTML=(s.title?'<h2>'+esc(s.title)+"</h2>":"")+body;return el;
}
function bindInteractive(){
 var f=document.getElementById("hn-navigation-form");if(f)f.addEventListener("submit",function(e){e.preventDefault();var p=new URLSearchParams(location.search);var q=document.getElementById("hn-navigation-q").value.trim(),c=document.getElementById("hn-navigation-city").value,k=document.getElementById("hn-navigation-category").value;if(q)p.set("q",q);else p.delete("q");if(c)p.set("city",c);else p.delete("city");if(k)p.set("category",k);else p.delete("category");location.search=p.toString()});
 document.querySelectorAll("[data-hn-step]").forEach(function(x){var k="hn-public-steps",s=JSON.parse(localStorage.getItem(k)||"{}");x.checked=!!s[x.dataset.hnStep];x.addEventListener("change",function(){s[x.dataset.hnStep]=x.checked;localStorage.setItem(k,JSON.stringify(s));});});
 document.querySelectorAll(".hn-comparison").forEach(function(box){var data=JSON.parse(box.getAttribute("data-cities")||"[]"),a=box.querySelector(".hn-compare-a"),b=box.querySelector(".hn-compare-b"),out=box.querySelector(".hn-comparison-output");function update(){var x=data.find(function(z){return z.id===a.value}),y=data.find(function(z){return z.id===b.value});if(!x||!y){out.innerHTML="<p>Kies twee steden om ze naast elkaar te bekijken.</p>";return}out.innerHTML="<table><thead><tr><th>Onderdeel</th><th>"+esc(x.name)+"</th><th>"+esc(y.name)+"</th></tr></thead><tbody><tr><td>Beschrijving</td><td>"+esc(x.description)+"</td><td>"+esc(y.description)+"</td></tr><tr><td>HN-opmerking</td><td>Vergelijk zelf de concrete fiches en ervaringen.</td><td>Vergelijk zelf de concrete fiches en ervaringen.</td></tr></tbody></table>"}a.addEventListener("change",update);b.addEventListener("change",update)});
}
async function run(){
 style();
 var slug=path==="/"?"":path.replace(/^\//,"");
 var q=new URLSearchParams(location.search),builderPreview=q.get("hn_builder_preview")==="1";if(q.get("slug"))slug=q.get("slug");
 var p=await db.from("hn_site_pages").select("id,slug,status,settings").eq("slug",slug).maybeSingle();
 if(p.error||!p.data||p.data.status!=="published")return;
 var sections=await db.from("hn_site_sections").select("*").eq("page_id",p.data.id).eq("is_visible",true).order("sort_order");
 if(!sections.error){
   var r=root(),cmsMode=p.data.settings&&p.data.settings.builder_mode==="cms",cmsSections=sections.data||[];
   if(!builderPreview&&cmsMode&&cmsSections.length)baseBlocks().forEach(function(el){el.remove()});
   for(var s of cmsSections){var el=await render(s),target=null,ins=(s.content||{}).insert_before;if(ins&&ins!=="__end__"){try{target=[...r.children].find(function(x){return selector(x)===ins})}catch(e){}}if(target)r.insertBefore(el,target);else r.appendChild(el)}
 }
 var ov=await db.from("hn_page_layout_overrides").select("selector,sort_order,is_visible").eq("route",route).order("sort_order");
 if(!ov.error){var groups=new Map();for(var x of ov.data||[]){var el;try{el=document.querySelector(x.selector)}catch(e){continue}if(!el||!el.parentElement)continue;var a=groups.get(el.parentElement)||[];a.push({x:x,el:el});groups.set(el.parentElement,a)}for(var a of groups.values()){a.sort(function(u,v){return u.x.sort_order-v.x.sort_order});a.forEach(function(u){u.el.style.display=u.x.is_visible?"":"none"});a.forEach(function(u){u.el.parentElement.appendChild(u.el)})}}
 bindInteractive();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run);else run();
})();