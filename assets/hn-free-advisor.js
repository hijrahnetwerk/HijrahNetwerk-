(function(){
function ready(fn){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fn);else fn()}
ready(function(){
 var root=document.getElementById("hnAdvisor"),checks=document.getElementById("hnChecks"),run=document.getElementById("runChecks"),copy=document.getElementById("copyAiPrompt"),focus=document.getElementById("focus");
 if(!root)return;
 function add(text,ok){var d=document.createElement("div");d.className="hn-check "+(ok?"ok":"warn");d.textContent=(ok?"✓ ":"⚠ ")+text;checks.appendChild(d)}
 function inspect(){
   checks.innerHTML="";
   var title=(document.getElementById("title")||{}).value||"";
   var seo=(document.getElementById("seoTitle")||{}).value||"";
   var desc=(document.getElementById("seoDesc")||{}).value||"";
   var slug=(document.getElementById("slug")||{}).value||"";
   add("Paginatitel ingevuld",!!title.trim());
   add("Slug ingevuld",!!slug.trim());
   add("SEO-titel: "+seo.length+" tekens",seo.length>=30&&seo.length<=60);
   add("SEO-beschrijving: "+desc.length+" tekens",desc.length>=120&&desc.length<=165);
   var f=document.getElementById("liveFrame"),doc=f&&f.contentDocument;
   var comps=(window.sections&&Array.isArray(window.sections))?window.sections:[];
   if(comps.length){
     var ids=comps.map(function(s){return s.component_id||(s.content&&s.content.component_id)||"";}).filter(Boolean);
     add("HN-componenten: "+comps.length,true);
     add("Alle HN-component-ID's zijn uniek",new Set(ids).size===ids.length&&ids.length===comps.length);
     comps.forEach(function(s){
       var type=s.component_type||s.section_type||"";
       if(["directory","articles","fiches","cities","categories","navigation"].includes(type)){
         var c=s.content||{},src=c.data_source||(s.data&&s.data.source)||"";
         add((s.title||type)+": databron gekoppeld",!!src||type==="navigation");
         if(c.data_filters){try{JSON.parse(c.data_filters);add((s.title||type)+": filters geldig",true)}catch(e){add((s.title||type)+": filters geldig",false)}}
       }
     });
   } else add("HN-componentstructuur aanwezig",false);
   if(doc){
     var h1=doc.querySelectorAll("h1").length;
     add("Precies één H1 gevonden",h1===1);
     var imgs=[...doc.querySelectorAll("img")];
     add("Alle afbeeldingen hebben alt-tekst",imgs.every(function(x){return x.getAttribute("alt")&&x.getAttribute("alt").trim()}));
     var links=[...doc.querySelectorAll("a[href]")].filter(function(a){return (a.textContent||"").trim()});
     add("Pagina bevat interne links",links.some(function(a){return (a.getAttribute("href")||"").startsWith("/")}));
     add("Pagina heeft inhoud boven de vouw",!!doc.querySelector("h1,h2,p"));
   }
 }
 function prompt(){
   var f=document.getElementById("liveFrame"),doc=f&&f.contentDocument;
   var headings=doc?[...doc.querySelectorAll("h1,h2,h3")].map(function(x){return x.textContent.trim()}).filter(Boolean).slice(0,30):[];
   var page=(document.getElementById("title")||{}).value||"";
   var seo=(document.getElementById("seoTitle")||{}).value||"";
   var desc=(document.getElementById("seoDesc")||{}).value||"";
   var slug=(document.getElementById("slug")||{}).value||"";
   var comps=(window.sections&&Array.isArray(window.sections))?window.sections:[];
   var componentSummary=comps.map(function(s){return (s.component_type||s.section_type)+" ["+(s.component_id||"zonder ID")+"]";}).join(" | ");
   return "Je bent een UX-, SEO- en contentadviseur voor Hijrah Netwerk. Analyseer deze pagina nuchter en concreet. Geef maximaal 7 verbeterpunten, prioriteer ze en leg per punt uit waarom. Geef geen marketingcliches en verander niets automatisch. Houd rekening met HN: zusterlijk, praktisch, betrouwbaar, van orientatie tot integratie. Beoordeel ook de volgorde van HN-componenten, interne links, zoekintentie, mobiele UX, H1/H2-structuur, SEO-titel, meta description, databronnen en ontbrekende component-ID's.\n\nPagina: "+page+"\nURL: "+slug+"\nSEO-titel: "+seo+"\nMeta: "+desc+"\nKoppen: "+headings.join(" | ");
 }
 run.onclick=inspect;
 copy.onclick=function(){
   var p=prompt();
   navigator.clipboard&&navigator.clipboard.writeText(p).then(function(){copy.textContent="Prompt gekopieerd";setTimeout(function(){copy.textContent="AI-advies voorbereiden"},1800)}).catch(function(){window.prompt("Kopieer deze gratis AI-prompt:",p)});
 };
 if(focus)focus.onclick=function(){var b=document.querySelector(".builder");b.classList.toggle("focus-mode");focus.textContent=b.classList.contains("focus-mode")?"Zijpanelen tonen":"Volledig scherm"};
 setTimeout(inspect,700);
});
})();