(()=>{'use strict';
const db=()=>window.hijrahSupabase;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const slug=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const defs=()=>window.HNComponentRegistry?.definitions||{};
let pages=[],page=null,sections=[],selected=-1,versions=[];
function msg(t,error=false){$('msg').textContent=t;$('msg').hidden=false;$('msg').classList.toggle('error',error);clearTimeout(msg.t);msg.t=setTimeout(()=>$('msg').hidden=true,3500)}
function defaults(type){const d=window.HNComponentRegistry?.create?.(type)||{content:{title:type,text:''},data:{}};return {component_id:d.component_id,component_type:type,section_type:type,title:d.content?.title||defs()[type]?.label||type,content:{...d.content},data:{...d.data},settings:{...d.settings},is_visible:true}}
function normalize(s){const d=defaults(s.component_type||s.section_type||'text');return {...d,...s,component_type:s.component_type||s.section_type||'text',section_type:s.section_type||s.component_type||'text',content:{...d.content,...(s.content||{})},data:{...d.data,...(s.data||{})},settings:{...d.settings,...(s.settings||{})}}}
function routeFor(p){const s=String(p?.slug||'').replace(/^\//,'');return s?'/' + s:'/'}
function renderSection(s,preview=false){
 const c=s.content||{},type=s.component_type||s.section_type||'text';
 let body='';
 if(type==='hero') body='<div class="hn-v2-hero"><div><h1>'+esc(c.title||s.title||'')+'</h1><p>'+esc(c.text||'')+'</p>'+(c.button?'<a href="'+esc(c.url||'#')+'">'+esc(c.button)+'</a>':'')+'</div>'+(c.image?'<img src="'+esc(c.image)+'" alt="">':'')+'</div>';
 else if(type==='image') body=c.image?'<img class="hn-v2-image" src="'+esc(c.image)+'" alt="'+esc(c.title||'')+'"><p>'+esc(c.text||'')+'</p>':'<div class="hn-v2-placeholder">Afbeelding toevoegen</div>';
 else if(type==='cards') body='<div class="hn-v2-cards">'+String(c.cards||'').split('\n').filter(Boolean).map(x=>{const a=x.split('|');return '<article><strong>'+esc(a[0]?.trim())+'</strong><p>'+esc(a[1]?.trim())+'</p></article>'}).join('')+'</div>';
 else if(type==='links'||type==='navigation') body='<div class="hn-v2-links">'+String(c.text||'').split('\n').filter(Boolean).map(x=>{const a=x.split('|');return '<a href="'+esc(a[1]?.trim()||'#')+'">'+esc(a[0]?.trim()||a[1]?.trim()||'Link')+' →</a>'}).join('')+'</div>';
 else if(type==='cta'||type==='comparison'||type==='steps'||type==='community') {const label=c.button||(type==='comparison'?'Vergelijken':type==='steps'?'Bekijk het stappenplan':type==='community'?'Naar de community':'Bekijk meer');const url=c.url||(type==='comparison'?'/vergelijken':type==='steps'?'/stappenplan':type==='community'?'/community':'#');body='<p>'+esc(c.text||'')+'</p><a class="hn-v2-cta" href="'+esc(url)+'">'+esc(label)+'</a>'}
 else if(type==='divider') body='<hr>';
 else if(type==='spacer') body='<div style="height:'+Math.max(8,Number(c.height)||80)+'px"></div>';
 else if(['directory','articles','fiches','cities','categories','smart_search'].includes(type)) body='<div class="hn-v2-data"><span>HN DATA</span><strong>'+esc(c.data_source||type)+'</strong><small>'+esc(c.data_limit||6)+' items · live gekoppeld</small></div>';
 else body='<p class="hn-v2-text">'+esc(c.text||'')+'</p>';
 const title=(type==='hero'||!s.title)?'': '<h2>'+esc(s.title)+'</h2>';
 return '<section class="hn-v2-section '+(s.is_visible===false?'is-hidden':'')+'" draggable="true" data-index="'+sections.indexOf(s)+'" data-id="'+esc(s.component_id||'')+'"><div class="hn-v2-section-tools"><button data-act="up">↑</button><button data-act="down">↓</button><button data-act="select">Bewerken</button><button data-act="delete" class="danger">×</button></div>'+title+body+'</section>';
}
function draw(){
 $('heading').textContent=page?.title||'Pagina';$('route').textContent=routeFor(page);
 $('title').value=page?.title||'';$('slug').value=page?.slug||'';$('status').value=page?.status||'draft';$('seoTitle').value=page?.seo_title||'';$('seoDesc').value=page?.seo_description||'';$('desc').value=page?.description||'';
 const groups={};Object.keys(defs()).forEach(k=>(groups[defs()[k].group]??=[]).push(k));
 $('palette').innerHTML=Object.entries(groups).map(([g,ks])=>'<div class="hn-v2-group"><small>'+esc(g)+'</small>'+ks.map(k=>'<button class="tool" data-type="'+esc(k)+'">'+esc(defs()[k].label)+'</button>').join('')+'</div>').join('');
 $('editor').hidden=false;$('empty').hidden=true;
 $('canvas').innerHTML=sections.map(s=>renderSection(s,true)).join('')||'<div class="hn-v2-empty">Deze pagina is leeg. Voeg links een HN-component toe.</div>';
 bindCanvas();showInspector();
}
function bindCanvas(){
 document.querySelectorAll('.hn-v2-section').forEach(el=>{
  el.onclick=e=>{const i=Number(el.dataset.index);if(e.target.dataset.act==='delete'){sections.splice(i,1);renumber();return}if(e.target.dataset.act==='up'&&i>0){[sections[i-1],sections[i]]=[sections[i],sections[i-1]];renumber();return}if(e.target.dataset.act==='down'&&i<sections.length-1){[sections[i+1],sections[i]]=[sections[i],sections[i+1]];renumber();return}selected=i;showInspector()};
  el.ondragstart=e=>{e.dataTransfer.setData('text/plain',el.dataset.index);el.classList.add('dragging')};el.ondragend=()=>el.classList.remove('dragging');el.ondragover=e=>e.preventDefault();el.ondrop=e=>{e.preventDefault();const from=Number(e.dataTransfer.getData('text/plain')),to=Number(el.dataset.index);if(from!==to){const x=sections.splice(from,1)[0];sections.splice(to,0,x);renumber()}};
 });
}
function renumber(){selected=Math.min(selected,sections.length-1);draw()}
function showInspector(){
 const box=$('blockInspector');if(selected<0||!sections[selected]){box.hidden=true;return}box.hidden=false;const s=sections[selected],c=s.content||{};
 $('kind').textContent=defs()[s.component_type]?.label||s.component_type;$('type').innerHTML=Object.keys(defs()).map(k=>'<option value="'+k+'">'+esc(defs()[k].label)+'</option>').join('');$('type').value=s.component_type;
 $('bt').value=s.title||c.title||'';$('tx').value=c.text||'';$('url').value=c.url||'';$('btn').value=c.button||'';$('img').value=c.image||'';$('visible').checked=s.is_visible!==false;$('cards').value=c.cards||'';$('dataSource').value=c.data_source||'';$('dataLimit').value=c.data_limit||6;$('dataFilters').value=JSON.stringify(c.data_filters||{},null,2);
 $('cardWrap').style.display=s.component_type==='cards'?'block':'none';$('dataWrap').hidden=!['navigation','smart_search','directory','articles','fiches','cities','categories'].includes(s.component_type);
 $('componentId').textContent=s.component_id||c.component_id||'—';$('componentType').textContent=s.component_type;
}
function patchField(id,fn){$(id).oninput=()=>{if(selected<0)return;fn(sections[selected]);draw();selected=Math.min(selected,sections.length-1);showInspector()}}
function setupInspector(){
 ['','cities','categories','topics','fiches','navigation'].forEach((v,i)=>{const s=$('dataSource');if(s&&!s.querySelector('option[value="'+v+'"]'))s.insertAdjacentHTML('beforeend','<option value="'+v+'">'+(v===''?'Geen databron':v==='cities'?'Steden':v==='categories'?'Categorieën':v==='topics'?'Artikelen / onderwerpen':v==='fiches'?'Fiches':'Hijrah Navigatie')+'</option>')});
 $('type').onchange=()=>{if(selected<0)return;const old=sections[selected],n=defaults($('type').value);sections[selected]={...old,...n,component_id:old.component_id,content:{...n.content,...old.content,title:old.title||n.content.title},data:{...n.data,...old.data}};draw();selected=selected;showInspector()};
 patchField('bt',s=>{s.title=$('bt').value;s.content.title=$('bt').value});patchField('tx',s=>s.content.text=$('tx').value);patchField('url',s=>s.content.url=$('url').value);patchField('btn',s=>s.content.button=$('btn').value);patchField('img',s=>s.content.image=$('img').value);patchField('cards',s=>s.content.cards=$('cards').value);patchField('dataSource',s=>s.content.data_source=$('dataSource').value);patchField('dataLimit',s=>s.content.data_limit=Number($('dataLimit').value)||6);patchField('dataFilters',s=>{try{s.content.data_filters=JSON.parse($('dataFilters').value||'{}')}catch{}});
 $('visible').onchange=()=>{if(selected>=0){sections[selected].is_visible=$('visible').checked;draw();showInspector()}};
 $('desktop').onclick=()=>setViewport('desktop');$('mobile').onclick=()=>setViewport('mobile');$('focus').onclick=()=>document.body.classList.toggle('builder-focus');$('open').onclick=()=>window.open(routeFor(page),'_blank');
}
function setViewport(x){$('liveFrameWrap').className=x}
function add(type){const s=defaults(type);s.sort_order=sections.length;sections.push(s);selected=sections.length-1;draw();showInspector();note('Component toegevoegd.')}
async function loadVersions(){if(!page)return;const r=await db().from('hn_site_page_versions').select('id,version_number,created_at').eq('page_id',page.id).order('version_number',{ascending:false}).limit(12);versions=r.data||[];$('versions').innerHTML=versions.length?versions.map(v=>'<div class="version-row"><b>v'+v.version_number+'</b><small>'+new Date(v.created_at).toLocaleString('nl-NL')+'</small><button data-v="'+v.id+'">Herstellen</button></div>').join(''):'<small>Geen opgeslagen versies.</small>';document.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>restoreVersion(b.dataset.v))}
async function restoreVersion(id){const r=await db().from('hn_site_page_versions').select('snapshot,version_number').eq('id',id).maybeSingle();if(r.error||!r.data)return msg('Versie kon niet worden geladen.',true);const s=r.data.snapshot||{};if(s.page)page={...page,...s.page};sections=(s.sections||[]).map(normalize);draw();await syncPageFields();note('v'+r.data.version_number+' geladen als werkversie. Sla op om te bewaren.')}
async function syncPageFields(){draw()}
async function save(publish=false){
 if(!page)return;
 const isCms=page.settings?.builder_mode==='cms';
 if(!isCms && sections.length===0){
  return msg('Deze bestaande pagina gebruikt nog de bestaande HN-pagina-opbouw. Opslaan in deze bouwer zou de pagina leeg kunnen maken. Gebruik eerst de HN-beheermodus om bestaande onderdelen te wijzigen.',true);
 }const now=new Date().toISOString();
 const payload={title:$('title').value.trim()||'Zonder titel',slug:slug($('slug').value||$('title').value),status:publish?'published':($('status').value||'draft'),description:$('desc').value.trim(),seo_title:$('seoTitle').value.trim(),seo_description:$('seoDesc').value.trim(),settings:{...(page.settings||{}),builder_mode:'cms',editor_version:2,updated_in_builder_at:now}};
 let r=await db().from('hn_site_pages').update(payload).eq('id',page.id);if(r.error)return msg(r.error.message,true);
 await db().from('hn_site_sections').delete().eq('page_id',page.id);
 const rows=sections.map((s,i)=>({page_id:page.id,section_type:s.section_type||s.component_type,component_type:s.component_type||s.section_type,component_id:s.component_id,title:s.title||'',content:s.content||{},data:s.data||{},settings:s.settings||{},sort_order:i,is_visible:s.is_visible!==false}));
 if(rows.length){r=await db().from('hn_site_sections').insert(rows);if(r.error)return msg(r.error.message,true)}
 const vr=await db().from('hn_site_page_versions').select('version_number').eq('page_id',page.id).order('version_number',{ascending:false}).limit(1).maybeSingle();const next=(vr.data?.version_number||0)+1;
 await db().from('hn_site_page_versions').insert({page_id:page.id,version_number:next,snapshot:{page:{...page,...payload},sections},created_by:(await db().auth.getUser()).data.user?.id||null});
 await db().from('hn_admin_events').insert({action:publish?'publish_page':'save_page',entity_type:'hn_site_page',entity_id:page.id,route:routeFor({...page,...payload}),metadata:{version:next,section_count:sections.length}});
 page={...page,...payload};await loadVersions();draw();note(publish?'Pagina gepubliceerd.':'Concept opgeslagen.');
}
async function createPage(){const name=prompt('Naam van de nieuwe pagina');if(!name)return;const tr=await db().from('hn_page_templates').select('name,structure').eq('is_active',true).order('name');const templates=tr.data||[];let structure=[];if(templates.length){const choice=prompt('Template: '+templates.map((x,i)=>(i+1)+'. '+x.name).join(' | ')+'\\nVul nummer in of laat leeg voor leeg.','1');const t=templates[Number(choice)-1];if(t&&Array.isArray(t.structure?.sections))structure=t.structure.sections.map(normalize)}const s=slug(name);const r=await db().from('hn_site_pages').insert({title:name,slug:s,status:'draft',page_type:'content',settings:{builder_mode:'cms',editor_version:2}}).select('*').single();if(r.error)return msg(r.error.message,true);pages.unshift(r.data);page=r.data;sections=structure;drawPages();draw();note('Nieuwe pagina aangemaakt.')}
function drawPages(){$('pages').innerHTML=pages.map(p=>'<button class="page '+(p.id===page?.id?'active':'')+'" data-id="'+p.id+'"><b>'+esc(p.title||'Zonder titel')+'</b><small>/'+esc(p.slug||'')+' · '+esc(p.status||'draft')+'</small></button>').join('');document.querySelectorAll('.page').forEach(b=>b.onclick=()=>pick(b.dataset.id))}
async function pick(id){page=pages.find(p=>p.id===id);if(!page)return;const r=await db().from('hn_site_sections').select('*').eq('page_id',page.id).order('sort_order');sections=(r.data||[]).map(normalize);selected=-1;drawPages();draw();await loadVersions()}
async function init(){
 if(!db()){location='/login?next=/admin-builder';return}const ss=await db().auth.getSession();if(!ss.data.session){location='/login?next=/admin-builder';return}const role=await db().from('profiles').select('role').eq('id',ss.data.session.user.id).maybeSingle();if(role.data?.role!=='admin'){document.body.innerHTML='<h1 style="padding:40px">Geen toegang</h1>';return}
 await window.HNComponentRegistry?.load?.();
 const r=await db().from('hn_site_pages').select('*').order('title');pages=r.data||[];drawPages();if(pages.length)await pick(pages.find(p=>p.slug===(new URLSearchParams(location.search).get('slug')||''))?.id||pages[0].id);
 document.querySelectorAll('.tool').forEach(b=>b.onclick=()=>add(b.dataset.type));$('new').onclick=createPage;$('save').onclick=()=>save(false);$('publish').onclick=()=>save(true);setupInspector();$('dup')?.addEventListener('click',()=>{if(selected<0)return;const x=JSON.parse(JSON.stringify(sections[selected]));x.component_id=(window.HNComponentRegistry?.create?.(x.component_type)?.component_id)||('cmp-'+Date.now());sections.splice(selected+1,0,x);selected++;draw();showInspector();});$('remove')?.addEventListener('click',()=>{if(selected<0)return;sections.splice(selected,1);selected=-1;draw();showInspector()});setViewport('desktop');
}
const style=document.createElement('style');style.textContent=`
.builder-layout{grid-template-columns:240px minmax(0,1fr) 330px!important}.canvas-panel{background:#f5f2ee}.canvas-toolbar{position:sticky;top:0;z-index:5}.liveFrameWrap,.canvas-frame,.desktop,.mobile{transition:width .2s ease;margin:auto}.liveFrameWrap.desktop{width:100%}.liveFrameWrap.mobile{width:390px;max-width:100%}#canvas{min-height:70vh;padding:32px}.hn-v2-section{position:relative;background:#fff;border:1px solid #e8e0d6;border-radius:14px;padding:28px;margin:0 auto 14px;max-width:1000px;cursor:pointer;box-shadow:0 2px 8px rgba(50,35,20,.04)}.hn-v2-section:hover{border-color:#dd842a}.hn-v2-section.dragging{opacity:.5}.hn-v2-section.is-hidden{opacity:.45}.hn-v2-section-tools{position:absolute;right:10px;top:10px;display:flex;gap:4px;opacity:0;transition:opacity .15s}.hn-v2-section:hover .hn-v2-section-tools{opacity:1}.hn-v2-section-tools button{border:1px solid #ddd;background:#fff;border-radius:6px;padding:4px 7px;cursor:pointer}.hn-v2-section-tools .danger{color:#9b2d20}.hn-v2-hero{display:grid;grid-template-columns:1fr 280px;gap:25px;align-items:center}.hn-v2-hero h1{font-size:2rem;color:#674c2e;margin:0 0 10px}.hn-v2-hero img,.hn-v2-image{max-width:100%;border-radius:10px}.hn-v2-hero a,.hn-v2-cta{display:inline-block;background:#dd842a;color:#fff;padding:10px 15px;border-radius:8px;text-decoration:none}.hn-v2-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.hn-v2-cards article{padding:16px;background:#faf7f2;border-radius:10px}.hn-v2-links{display:grid;gap:8px}.hn-v2-links a{color:#674c2e;text-decoration:none;padding:10px;border-bottom:1px solid #eee}.hn-v2-data{padding:20px;background:#faf7f2;border:1px dashed #c6a15b;border-radius:10px;display:grid;gap:5px}.hn-v2-data span{font:11px monospace;letter-spacing:.08em;color:#dd842a}.hn-v2-empty,.hn-v2-placeholder{padding:40px;text-align:center;color:#776}.hn-v2-group{margin-bottom:18px}.hn-v2-group>small{display:block;text-transform:uppercase;letter-spacing:.08em;color:#8b7a69;margin-bottom:6px}.hn-v2-group .tool{display:block;width:100%;text-align:left;margin:3px 0}.builder-focus .page-panel,.builder-focus .inspector{display:none}.builder-focus .builder-layout{grid-template-columns:1fr!important}.builder-focus #canvas{max-width:1200px;margin:auto}.version-panel{margin-top:18px;padding-top:18px;border-top:1px solid #eee}.version-row{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #eee}.version-row small{color:#777}.version-row button{font-size:12px}.builder-source-toggle{display:none}
@media(max-width:900px){.builder-layout{grid-template-columns:1fr!important}.page-panel,.inspector{position:relative;max-height:none}.hn-v2-hero{grid-template-columns:1fr}.hn-v2-section-tools{opacity:1}.liveFrameWrap.mobile{width:100%}}`;
document.head.appendChild(style);
const oldCanvas=$('liveFrameWrap');if(oldCanvas){oldCanvas.id='liveFrameWrap';oldCanvas.innerHTML='<div id="canvas"></div>'}
const inspector=$('inspector');if(inspector&&!$('versionPanel')){const v=document.createElement('div');v.id='versionPanel';v.className='version-panel';v.innerHTML='<div class="version-head"><strong>Versies</strong></div><div id="versions"></div>';inspector.appendChild(v)}
document.addEventListener('DOMContentLoaded',init);if(document.readyState!=='loading')init();
})();