(function(){
var w=window;if(!w.hijrahSupabase)return;
var db=w.hijrahSupabase;
var path=location.pathname.replace(/\/$/,"")||"/";
var route=path;
function esc(v){return String(v==null?"":v).replace(/[&<>"]/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]})}
function root(){return document.querySelector("main")||document.querySelector('[role="main"]')||document.body}
function selector(el){var out=[];while(el&&el.nodeType===1&&el!==document.body){if(el.id){out.unshift("#"+CSS.escape(el.id));break}var n=1,s=el;while((s=s.previousElementSibling)){if(s.tagName===el.tagName)n++}out.unshift(el.tagName.toLowerCase()+":nth-of-type("+n+")");el=el.parentElement}return "body>"+out.join(">")}
function baseBlocks(){var r=root();return [...r.children].filter(function(e){return !["SCRIPT","STYLE","NOSCRIPT","HEADER","FOOTER","NAV"].includes(e.tagName)&&e.getBoundingClientRect().height>5&&!e.classList.contains("hn-public-section")})}
async function fetchComponentData(c){
 var source=c.data_source||(c.data&&c.data.source)||"";
 var table=source==="cities"?"cities":source==="categories"?"categories":(["topics","articles","fiches","topic"].indexOf(source)>=0?"topic":"");
 if(!table)return [];
 var limit=Math.min(Math.max(Number(c.data_limit||c.data&&c.data.limit||6)||6,1),50);
 var q=await db.from(table).select("*").limit(limit);
 if(q.error)return [];
 var filters=c.data_filters||(c.data&&c.data.filters)||{};
 var rows=(q.data||[]).filter(function(x){
   if(table==="cities"&&x.is_active===false)return false;
   if(table==="categories"&&x.is_active===false)return false;
   if(table==="topic"&&x.published===false)return false;
   return Object.keys(filters).every(function(k){
     if(filters[k]===null||filters[k]==="")return true;
     var actual=x[k];
     if(Array.isArray(filters[k]))return filters[k].map(String).includes(String(actual));
     return String(actual==null?"":actual).toLowerCase().includes(String(filters[k]).toLowerCase());
   });
 });
 return rows.slice(0,limit);
}
function rowTitle(x){
 return x.name||x.title||x.topic||x.label||x.slug||"Informatie";
}
function rowText(x){
 return x.description||x.summary||x.excerpt||x.content||x.type||"";
}
function rowUrl(x,source){
 if(x.url)return x.url;
 if(source==="cities")return "/stad/"+encodeURIComponent(x.slug||x.name||"");
 if(source==="categories")return "/kennisbank/"+encodeURIComponent(x.slug||x.name||"");
 if(x.slug)return "/artikels/"+encodeURIComponent(x.slug);
 return "#";
}
async function render(s){
 var c=s.content||{},body="";
 var dataSource=c.data_source||(s.data&&s.data.source)||"";
 var dataTypes=["directory","articles","fiches","cities","categories","navigation"];
 if(dataTypes.includes(s.section_type)&&dataSource){
   var rows=await fetchComponentData(c);
   body='<div class="hn-public-data-grid">'+rows.map(function(x){
     var title=rowTitle(x),text=rowText(x),url=rowUrl(x,dataSource);
     return '<article><strong>'+esc(title)+'</strong>'+(text?'<p>'+esc(String(text).slice(0,240))+'</p>':"")+(url&&url!="#"?'<a href="'+esc(url)+'">Bekijk informatie →</a>':"")+'</article>';
   }).join("")+'</div>';
   if(!rows.length)body='<p class="hn-public-empty">Er is momenteel geen informatie gevonden voor deze selectie.</p>';
 } else if(s.section_type==="image") body=c.image?'<img src="'+esc(c.image)+'" alt="'+esc(s.title||"")+'" style="max-width:100%;display:block;margin:auto">':"";
 else if(s.section_type==="cards") body='<div class="hn-public-cards">'+(c.cards||"").split("\n").filter(Boolean).map(function(x){var a=x.split("|");return '<article><strong>'+esc((a[0]||"").trim())+'</strong><p>'+esc((a[1]||"").trim())+'</p></article>'}).join("")+"</div>";
 else if(s.section_type==="links"||s.section_type==="navigation") body=(c.text||"").split("\n").filter(Boolean).map(function(x){var a=x.split("|");return '<a href="'+esc((a[1]||"#").trim())+'">'+esc((a[0]||a[1]||"").trim())+"</a>" }).join("");
 else if(s.section_type==="cta"||["comparison","steps","community"].includes(s.section_type)){
   var target=s.section_type==="comparison"?"/vergelijken":s.section_type==="steps"?"/stappenplan":s.section_type==="community"?"/community":(c.url||"#");
   var label=c.button||(s.section_type==="comparison"?"Vergelijken":s.section_type==="steps"?"Bekijk het stappenplan":s.section_type==="community"?"Naar de community":"Bekijk meer");
   body='<a class="hn-public-cta" href="'+esc(target)+'">'+esc(label)+'</a>';
 } else if(s.section_type==="divider") body='<hr>';
 else if(s.section_type==="spacer") body='<div style="height:80px"></div>';
 else body='<p>'+esc(c.text||"")+"</p>";
 var el=document.createElement("section");el.className="hn-public-section";if(s.id)el.dataset.hnSectionId=s.id;
 el.dataset.hnComponentId=s.component_id||(c.component_id)||"";
 el.dataset.hnComponentType=s.component_type||s.section_type;
 el.innerHTML=(s.title?'<h2>'+esc(s.title)+"</h2>":"")+body;return el;
}
async function run(){
 var style=document.getElementById("hn-component-runtime-style");if(!style){style=document.createElement("style");style.id="hn-component-runtime-style";style.textContent=".hn-public-data-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:18px}.hn-public-data-grid article{padding:18px;border:1px solid rgba(103,76,46,.18);border-radius:14px;background:#fff}.hn-public-data-grid strong{display:block;color:#674C2E;font-size:1.05rem}.hn-public-data-grid p{margin:7px 0;color:#674C2E;font-size:.92rem}.hn-public-data-grid a{display:inline-block;margin-top:6px;color:#DD842A;font-weight:700;text-decoration:none}.hn-public-cta{display:inline-block;margin-top:14px;padding:11px 15px;background:#DD842A;color:#fff;border-radius:8px;text-decoration:none}";document.head.appendChild(style)}
 var slug=path==="/"?"":path.replace(/^\//,"");
 var q=new URLSearchParams(location.search);var builderPreview=q.get("hn_builder_preview")==="1";if(q.get("slug"))slug=q.get("slug");
 var p=await db.from("hn_site_pages").select("id,slug,status,settings").eq("slug",slug).maybeSingle();
 if(p.error||!p.data||p.data.status!=="published")return;
 var sections=await db.from("hn_site_sections").select("*").eq("page_id",p.data.id).eq("is_visible",true).order("sort_order");
 if(!sections.error){
   var r=root();
   var cmsMode=p.data.settings&&p.data.settings.builder_mode==="cms";
   var cmsSections=sections.data||[];
   if(!builderPreview&&cmsMode&&cmsSections.length){
     baseBlocks().forEach(function(el){el.remove();});
   }
   for(var s of cmsSections){
     var el=await render(s),target=null,ins=(s.content||{}).insert_before;
     if(ins&&ins!=="__end__"){try{target=[...r.children].find(function(x){return selector(x)===ins})}catch(e){}}
     if(target)r.insertBefore(el,target);else r.appendChild(el);
   }
 }
 var ov=await db.from("hn_page_layout_overrides").select("selector,sort_order,is_visible").eq("route",route).order("sort_order");
 if(!ov.error){
   var groups=new Map();
   for(var x of ov.data||[]){var el;try{el=document.querySelector(x.selector)}catch(e){continue}if(!el||!el.parentElement)continue;var a=groups.get(el.parentElement)||[];a.push({x:x,el:el});groups.set(el.parentElement,a)}
   for(var a of groups.values()){a.sort(function(u,v){return u.x.sort_order-v.x.sort_order});a.forEach(function(u){u.el.style.display=u.x.is_visible?"":"none"});a.forEach(function(u){u.el.parentElement.appendChild(u.el)})}
 }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run);else run();
})();