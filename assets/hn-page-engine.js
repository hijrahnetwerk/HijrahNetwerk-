(function(){
var w=window;if(!w.hijrahSupabase)return;
var db=w.hijrahSupabase;
var path=location.pathname.replace(/\/$/,"")||"/";
var route=path;
function esc(v){return String(v==null?"":v).replace(/[&<>"]/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]})}
function root(){return document.querySelector("main")||document.querySelector('[role="main"]')||document.body}
function selector(el){var out=[];while(el&&el.nodeType===1&&el!==document.body){if(el.id){out.unshift("#"+CSS.escape(el.id));break}var n=1,s=el;while((s=s.previousElementSibling)){if(s.tagName===el.tagName)n++}out.unshift(el.tagName.toLowerCase()+":nth-of-type("+n+")");el=el.parentElement}return "body>"+out.join(">")}
function baseBlocks(){var r=root();return [...r.children].filter(function(e){return !["SCRIPT","STYLE","NOSCRIPT","HEADER","FOOTER","NAV"].includes(e.tagName)&&e.getBoundingClientRect().height>5&&!e.classList.contains("hn-public-section")})}
function render(s){
 var c=s.content||{}, body="";
 if(s.section_type==="image") body=c.image?'<img src="'+esc(c.image)+'" alt="'+esc(s.title||"")+'" style="max-width:100%;display:block;margin:auto">':"";
 else if(s.section_type==="cards") body='<div class="hn-public-cards">'+(c.cards||"").split("\n").filter(Boolean).map(function(x){var a=x.split("|");return '<article><strong>'+esc((a[0]||"").trim())+'</strong><p>'+esc((a[1]||"").trim())+'</p></article>'}).join("")+"</div>";
 else if(s.section_type==="links") body=(c.text||"").split("\n").filter(Boolean).map(function(x){var a=x.split("|");return '<a href="'+esc((a[1]||"#").trim())+'">'+esc((a[0]||a[1]||"").trim())+"</a>" }).join("");
 else if(s.section_type==="cta") body=c.button?'<a class="hn-public-cta" href="'+esc(c.url||"#")+'">'+esc(c.button)+"</a>":"";
 else if(s.section_type==="divider") body='<hr>';
 else if(s.section_type==="spacer") body='<div style="height:80px"></div>';
 else body='<p>'+esc(c.text||"")+"</p>";
 var el=document.createElement("section");el.className="hn-public-section";if(s.id)el.dataset.hnSectionId=s.id;
 el.innerHTML=(s.title?'<h2>'+esc(s.title)+"</h2>":"")+body;return el;
}
async function run(){
 var slug=path==="/"?"":path.replace(/^\//,"");
 var q=new URLSearchParams(location.search);if(q.get("slug"))slug=q.get("slug");
 var p=await db.from("hn_site_pages").select("id,slug,status").eq("slug",slug).maybeSingle();
 if(p.error||!p.data||p.data.status!=="published")return;
 var sections=await db.from("hn_site_sections").select("*").eq("page_id",p.data.id).eq("is_visible",true).order("sort_order");
 if(!sections.error){
   var r=root();
   for(var s of sections.data||[]){
     var el=render(s),target=null,ins=(s.content||{}).insert_before;
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