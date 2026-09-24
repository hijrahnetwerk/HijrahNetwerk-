(function(){
'use strict';

const db=()=>window.hijrahSupabase;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
const slug=s=>String(s||'').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const state={countries:[],cities:[],categories:[],subcategories:[],topics:[],reviewers:[],users:[]};

function msg(text,type='success'){
  const el=$('message'); if(!el)return;
  el.textContent=text; el.className='message show '+type;
  clearTimeout(msg.timer); msg.timer=setTimeout(()=>el.className='message',5000);
}
function withTimeout(p,ms=12000){
  return Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(new Error('De aanvraag duurde te lang.')),ms))]);
}
async function safe(label,fn){
  try{return await withTimeout(fn(),12000)}
  catch(e){console.error('HN Admin '+label,e);msg(label+' kon niet worden geladen. '+(e.message||''),'error');return null}
}
function options(el,items,placeholder='Kies...'){
  if(!el)return;
  const old=el.value;
  el.innerHTML='<option value="">'+placeholder+'</option>'+(items||[]).filter(x=>x.is_active!==false).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('');
  if(old)el.value=old;
}

window.showPage=function(p,remember=true){
  const page=$('page-'+p); if(!page)return;
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.nav-button').forEach(x=>x.classList.remove('active'));
  page.classList.add('active');
  const nav=document.querySelector('.nav-button[data-page="'+p+'"]'); if(nav)nav.classList.add('active');
  const titles={overview:'Overzicht',platform:"Platformpagina's",countries:'Landen',cities:'Steden',categories:'Categorieën',subcategories:'Subcategorieën',topics:'Kennisbank',reviewers:'Reviewers',users:'Gebruikers',submissions:'Inzendingen',sync:'Sync Queue'};
  if($('pageTitle'))$('pageTitle').textContent=titles[p]||'Admin';
  if(remember){
    try{localStorage.setItem('hn_admin_page',p);history.replaceState(null,'','#'+p)}catch(e){}
  }
  const loaders={overview:loadOverview,countries:loadCountries,platform:()=>{},categories:loadCategories,subcategories:loadSubcategories,topics:loadTopics,reviewers:loadReviewers,users:loadUsers,submissions:loadSubmissions,sync:loadSync};
  if(loaders[p])safe(titles[p]||'Pagina',loaders[p]);
};

function wireNavigation(){
  document.querySelectorAll('.nav-button[data-page]').forEach(b=>{
    b.addEventListener('click',e=>{e.preventDefault();window.showPage(b.dataset.page);});
  });
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-admin-page]'); if(!b)return;
    e.preventDefault(); window.showPage(b.getAttribute('data-admin-page'));
  });
}

async function checkAdmin(){
  const {data,error}=await withTimeout(db().auth.getSession(),12000);
  if(error)throw error;
  if(!data?.session){location.href='/login';return false;}
  const r=await withTimeout(db().from('profiles').select('role').eq('id',data.session.user.id).single(),12000);
  if(r.error)throw r.error;
  if(r.data?.role!=='admin'){
    document.body.innerHTML='<div style="padding:60px;text-align:center;font-family:Arial"><h1>Geen toegang</h1><p>Alleen beheerders hebben toegang.</p></div>';
    return false;
  }
  return true;
}

async function loadCountries(){
  const r=await db().from('countries').select('*').order('name');
  if(r.error)throw r.error;
  state.countries=r.data||[];
  if($('countryCount'))$('countryCount').textContent=state.countries.length;
  options($('cityCountry'),state.countries,'Kies een land');
  options($('topicCountry'),state.countries,'Geen land');
  renderCountries();
}
function renderCountries(){
  const t=$('countriesTable'); if(!t)return;
  t.innerHTML=state.countries.length?state.countries.map(x=>'<tr><td><b>'+esc(x.name)+'</b></td><td>'+esc(x.code)+'</td><td><span class="status '+(x.is_active?'status-active':'status-inactive')+'">'+(x.is_active?'Actief':'Inactief')+'</span></td><td><div class="actions"><button class="button-secondary" onclick="editCountry(\''+x.id+'\')">Bewerken</button><button class="button-secondary" onclick="toggleCountry(\''+x.id+'\','+!!x.is_active+')">'+(x.is_active?'Deactiveren':'Activeren')+'</button><button class="button-danger" onclick="deleteCountry(\''+x.id+'\')">Verwijderen</button></div></td></tr>').join(''):'<tr><td colspan="4" class="empty">Nog geen landen.</td></tr>';
}
window.editCountry=id=>{const x=state.countries.find(x=>x.id===id);if(!x)return;$('countryId').value=x.id;$('countryName').value=x.name||'';$('countryCode').value=x.code||'';$('countryDescription').value=x.description||'';$('countryFormTitle').textContent='Land bewerken';$('cancelCountry').hidden=false;showPage('countries')};
window.toggleCountry=async(id,s)=>{const r=await db().from('countries').update({is_active:!s}).eq('id',id);if(r.error)return msg(r.error.message,'error');await loadCountries();await loadCities();msg(s?'Land gedeactiveerd.':'Land geactiveerd.')};
window.deleteCountry=async id=>{if(state.cities.some(x=>x.country_id===id))return msg('Verwijder of verplaats eerst de steden van dit land.','error');if(!confirm('Dit land definitief verwijderen?'))return;const r=await db().from('countries').delete().eq('id',id);if(r.error)return msg(r.error.message,'error');await loadCountries();msg('Land verwijderd.')};
$('countryForm')?.addEventListener('submit',async e=>{e.preventDefault();const id=$('countryId').value,p={name:$('countryName').value.trim(),slug:slug($('countryName').value),code:$('countryCode').value.trim()||null,description:$('countryDescription').value.trim()||null};const r=id?await db().from('countries').update(p).eq('id',id):await db().from('countries').insert(p);if(r.error)return msg(r.error.message,'error');$('countryForm').reset();$('countryId').value='';$('countryFormTitle').textContent='Nieuw land';$('cancelCountry').hidden=true;await loadCountries();msg(id?'Land bijgewerkt.':'Land toegevoegd.')});
$('cancelCountry')?.addEventListener('click',()=>{$('countryForm').reset();$('countryId').value='';$('countryFormTitle').textContent='Nieuw land';$('cancelCountry').hidden=true});

async function loadCities(){
  const r=await db().from('cities').select('*,countries(name)').order('name');if(r.error)throw r.error;
  state.cities=r.data||[];if($('cityCount'))$('cityCount').textContent=state.cities.length;renderCities();refreshTopicSelects();
}
function renderCities(){const t=$('citiesTable');if(!t)return;t.innerHTML=state.cities.length?state.cities.map(x=>'<tr><td><b>'+esc(x.name)+'</b></td><td>'+esc(x.countries?.name)+'</td><td><span class="status '+(x.is_active?'status-active':'status-inactive')+'">'+(x.is_active?'Actief':'Inactief')+'</span></td><td><div class="actions"><button class="button-secondary" onclick="editCity(\''+x.id+'\')">Bewerken</button><button class="button-secondary" onclick="toggleCity(\''+x.id+'\','+!!x.is_active+')">'+(x.is_active?'Deactiveren':'Activeren')+'</button><button class="button-danger" onclick="deleteCity(\''+x.id+'\')">Verwijderen</button></div></td></tr>').join(''):'<tr><td colspan="4" class="empty">Nog geen steden.</td></tr>'}
window.editCity=id=>{const x=state.cities.find(x=>x.id===id);if(!x)return;$('cityId').value=x.id;$('cityName').value=x.name||'';$('cityCountry').value=x.country_id||'';$('cityDescription').value=x.description||'';$('cityFormTitle').textContent='Stad bewerken';$('cancelCity').hidden=false;showPage('cities')};
window.toggleCity=async(id,s)=>{const r=await db().from('cities').update({is_active:!s}).eq('id',id);if(r.error)return msg(r.error.message,'error');await loadCities();msg(s?'Stad gedeactiveerd.':'Stad geactiveerd.')};
window.deleteCity=async id=>{if(!confirm('Deze stad definitief verwijderen?'))return;const r=await db().from('cities').delete().eq('id',id);if(r.error)return msg(r.error.message,'error');await loadCities();msg('Stad verwijderd.')};
$('cityForm')?.addEventListener('submit',async e=>{e.preventDefault();const id=$('cityId').value,p={name:$('cityName').value.trim(),slug:slug($('cityName').value),country_id:$('cityCountry').value,description:$('cityDescription').value.trim()||null};const r=id?await db().from('cities').update(p).eq('id',id):await db().from('cities').insert(p);if(r.error)return msg(r.error.message,'error');$('cityForm').reset();$('cityId').value='';$('cityFormTitle').textContent='Nieuwe stad';$('cancelCity').hidden=true;await loadCities();msg(id?'Stad bijgewerkt.':'Stad toegevoegd.')});
$('cancelCity')?.addEventListener('click',()=>{$('cityForm').reset();$('cityId').value='';$('cityFormTitle').textContent='Nieuwe stad';$('cancelCity').hidden=true});

async function loadCategories(){const r=await db().from('categories').select('*').order('sort_order').order('name');if(r.error)throw r.error;state.categories=r.data||[];if($('categoryCount'))$('categoryCount').textContent=state.categories.length;renderCategories();options($('subcategoryCategory'),state.categories,'Kies categorie');refreshTopicSelects()}
function renderCategories(){const t=$('categoriesTable');if(!t)return;t.innerHTML=state.categories.length?state.categories.map(x=>'<tr><td><b>'+esc(x.name)+'</b><div class="hint">'+esc(x.description)+'</div></td><td>'+esc(x.sort_order??0)+'</td><td><span class="status '+(x.is_active?'status-active':'status-inactive')+'">'+(x.is_active?'Actief':'Inactief')+'</span></td><td><div class="actions"><button class="button-secondary" onclick="editCategory(\''+x.id+'\')">Bewerken</button><button class="button-secondary" onclick="toggleCategory(\''+x.id+'\','+!!x.is_active+')">'+(x.is_active?'Deactiveren':'Activeren')+'</button><button class="button-danger" onclick="deleteCategory(\''+x.id+'\')">Verwijderen</button></div></td></tr>').join(''):'<tr><td colspan="4" class="empty">Nog geen categorieën.</td></tr>'}
window.editCategory=id=>{const x=state.categories.find(x=>x.id===id);if(!x)return;$('categoryId').value=x.id;$('categoryName').value=x.name||'';$('categoryOrder').value=x.sort_order??0;$('categoryDescription').value=x.description||'';$('categoryFormTitle').textContent='Categorie bewerken';$('cancelCategory').hidden=false;showPage('categories')};
window.toggleCategory=async(id,s)=>{const r=await db().from('categories').update({is_active:!s}).eq('id',id);if(r.error)return msg(r.error.message,'error');await loadCategories();await loadSubcategories();msg(s?'Categorie gedeactiveerd.':'Categorie geactiveerd.')};
window.deleteCategory=async id=>{if(state.subcategories.some(x=>x.category_id===id)||state.topics.some(x=>x.category_id===id))return msg('Deze categorie wordt nog gebruikt.','error');if(!confirm('Deze categorie definitief verwijderen?'))return;const r=await db().from('categories').delete().eq('id',id);if(r.error)return msg(r.error.message,'error');await loadCategories();msg('Categorie verwijderd.')};
$('categoryForm')?.addEventListener('submit',async e=>{e.preventDefault();const id=$('categoryId').value,p={name:$('categoryName').value.trim(),slug:slug($('categoryName').value),description:$('categoryDescription').value.trim()||null,sort_order:Number($('categoryOrder').value)||0};const r=id?await db().from('categories').update(p).eq('id',id):await db().from('categories').insert(p);if(r.error)return msg(r.error.message,'error');$('categoryForm').reset();$('categoryId').value='';$('categoryOrder').value=0;$('categoryFormTitle').textContent='Nieuwe categorie';$('cancelCategory').hidden=true;await loadCategories();msg(id?'Categorie bijgewerkt.':'Categorie toegevoegd.')});
$('cancelCategory')?.addEventListener('click',()=>{$('categoryForm').reset();$('categoryId').value='';$('categoryOrder').value=0;$('categoryFormTitle').textContent='Nieuwe categorie';$('cancelCategory').hidden=true});

async function loadSubcategories(){const r=await db().from('subcategories').select('*,categories(name)').order('sort_order').order('name');if(r.error)throw r.error;state.subcategories=r.data||[];renderSubcategories();options($('topicSubcategory'),state.subcategories,'Geen subcategorie');options($('subcategoryCategory'),state.categories,'Kies categorie')}
function renderSubcategories(){const t=$('subcategoriesTable');if(!t)return;t.innerHTML=state.subcategories.length?state.subcategories.map(x=>'<tr><td><b>'+esc(x.name)+'</b><div class="hint">'+esc(x.description)+'</div></td><td>'+esc(x.categories?.name)+'</td><td>'+esc(x.sort_order??0)+'</td><td><span class="status '+(x.is_active?'status-active':'status-inactive')+'">'+(x.is_active?'Actief':'Inactief')+'</span></td><td><div class="actions"><button class="button-secondary" onclick="editSubcategory(\''+x.id+'\')">Bewerken</button><button class="button-secondary" onclick="toggleSubcategory(\''+x.id+'\','+!!x.is_active+')">'+(x.is_active?'Deactiveren':'Activeren')+'</button><button class="button-danger" onclick="deleteSubcategory(\''+x.id+'\')">Verwijderen</button></div></td></tr>').join(''):'<tr><td colspan="5" class="empty">Nog geen subcategorieën.</td></tr>'}
window.editSubcategory=id=>{const x=state.subcategories.find(x=>x.id===id);if(!x)return;$('subcategoryId').value=x.id;$('subcategoryCategory').value=x.category_id;$('subcategoryName').value=x.name||'';$('subcategoryOrder').value=x.sort_order??0;$('subcategoryDescription').value=x.description||'';$('subcategoryFormTitle').textContent='Subcategorie bewerken';$('cancelSubcategory').hidden=false;showPage('subcategories')};
window.toggleSubcategory=async(id,s)=>{const r=await db().from('subcategories').update({is_active:!s}).eq('id',id);if(r.error)return msg(r.error.message,'error');await loadSubcategories();msg(s?'Subcategorie gedeactiveerd.':'Subcategorie geactiveerd.')};
window.deleteSubcategory=async id=>{if(state.topics.some(x=>x.subcategory_id===id))return msg('Deze subcategorie wordt nog gebruikt door topics.','error');if(!confirm('Deze subcategorie definitief verwijderen?'))return;const r=await db().from('subcategories').delete().eq('id',id);if(r.error)return msg(r.error.message,'error');await loadSubcategories();msg('Subcategorie verwijderd.')};
$('subcategoryForm')?.addEventListener('submit',async e=>{e.preventDefault();const id=$('subcategoryId').value,p={category_id:$('subcategoryCategory').value,name:$('subcategoryName').value.trim(),slug:slug($('subcategoryName').value),description:$('subcategoryDescription').value.trim()||null,sort_order:Number($('subcategoryOrder').value)||0};const r=id?await db().from('subcategories').update(p).eq('id',id):await db().from('subcategories').insert(p);if(r.error)return msg(r.error.message,'error');$('subcategoryForm').reset();$('subcategoryId').value='';$('subcategoryOrder').value=0;$('subcategoryFormTitle').textContent='Nieuwe subcategorie';$('cancelSubcategory').hidden=true;await loadSubcategories();msg(id?'Subcategorie bijgewerkt.':'Subcategorie toegevoegd.')});
$('cancelSubcategory')?.addEventListener('click',()=>{$('subcategoryForm').reset();$('subcategoryId').value='';$('subcategoryOrder').value=0;$('subcategoryFormTitle').textContent='Nieuwe subcategorie';$('cancelSubcategory').hidden=true});

function refreshTopicSelects(){
  options($('topicCountry'),state.countries,'Geen land');
  const currentCity=$('topicCity')?.value;
  if($('topicCity')){$('topicCity').innerHTML='<option value="">Geen stad</option>'+state.cities.filter(x=>x.is_active).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+' — '+esc(x.countries?.name||'')+'</option>').join('');if(currentCity)$('topicCity').value=currentCity}
  options($('topicCategory'),state.categories,'Geen categorie');
  options($('topicSubcategory'),state.subcategories,'Geen subcategorie');
  options($('topicReviewer'),state.reviewers,'Geen reviewer');
}
$('topicCountry')?.addEventListener('change',()=>{const id=$('topicCountry').value;const cities=state.cities.filter(x=>!id||x.country_id===id);options($('topicCity'),cities,'Geen stad')});

async function loadTopics(){const r=await db().from('topic').select('*,countries(name),cities(name),categories(name),subcategories(name),reviewers(name)').order('updated_at',{ascending:false});if(r.error)throw r.error;state.topics=r.data||[];if($('topicCount'))$('topicCount').textContent=state.topics.filter(x=>x.visibility!=='fiche_only').length;renderTopics();await Promise.all(state.topics.filter(x=>x.visibility!=='fiche_only').map(ensureFicheProposal));await loadFicheProposals();await loadFicheClaims()}
function renderTopics(){const t=$('topicsTable');if(!t)return;const q=($('topicFilter')?.value||'').toLowerCase();const list=state.topics.filter(x=>(x.title||'').toLowerCase().includes(q));t.innerHTML=list.length?list.map(x=>'<tr><td><b>'+esc(x.title)+'</b><div class="hint">'+esc(x.slug)+'</div></td><td>'+esc(x.cities?.name||'')+(x.countries?.name?' ('+esc(x.countries.name)+')':'')+'</td><td>'+esc(x.categories?.name)+(x.subcategories?.name?' / '+esc(x.subcategories.name):'')+'</td><td><span class="status '+(x.visibility==='fiche_only'?'status-draft':'')+'">'+(x.visibility==='fiche_only'?'Fiche':'Artikel')+'</span><div class="hint">'+esc(x.information_type)+'</div></td><td>'+esc(x.status)+'</td><td><span class="status '+(x.published?'status-published':'status-draft')+'">'+(x.published?'Gepubliceerd':'Concept')+'</span></td><td><div class="actions"><button class="button-secondary" onclick="editTopic(\''+x.id+'\')">Bewerken</button><button class="button-secondary" onclick="previewTopic(\''+x.id+'\')">Bekijken</button><button class="button-secondary" onclick="toggleTopicPublished(\''+x.id+'\','+!!x.published+')">'+(x.published?'Offline':'Publiceren')+'</button><button class="button-danger" onclick="deleteTopic(\''+x.id+'\')">Verwijderen</button></div></td></tr>').join(''):'<tr><td colspan="7" class="empty">Geen topics gevonden.</td></tr>'}
$('topicFilter')?.addEventListener('input',renderTopics);

function buildLocalFicheProposal(x){
 const content=String(x.content||'');
 const d={};
 const set=(k,v)=>{if(v&&String(v).trim())d[k]=String(v).trim()};
 set('practice_name',x.title);
 const phone=content.match(/(?:\+212|0)[0-9 .-]{8,}/); if(phone)set('phone',phone[0]);
 const url=String(x.source_url||'').trim(); if(url)set('website',url);
 const addr=content.match(/(?:Adres|address|Adresse)[:\s]+([^\n]{8,120})/i); if(addr)set('address',addr[1]);
 const hours=content.match(/(?:consultatie-uren|openingstijden|horaires)[\s\S]{0,700}/i); if(hours)set('opening_hours',hours[0].replace(/\s+/g,' ').trim());
 if(/volwassenen en kinderen|adultes.*enfants/i.test(content))set('for_children','Ja, volgens het artikel');
 if(/huisbezoeken|visites à domicile/i.test(content))set('home_visits','Wordt vermeld in het artikel');
 if(/teleconsult/i.test(content))set('teleconsultation','Wordt vermeld in het artikel');
 set('short_description',x.summary||'Korte praktische fiche voorgesteld op basis van het bestaande Kennisbankartikel.');
 set('warning','Voorstel uit HN-informatie. Controleer actuele gegevens voordat de fiche wordt gepubliceerd.');
 return d;
}
async function ensureFicheProposal(x){
 if(!x||x.visibility==='fiche_only')return;
 const q=await db().from('hn_fiche_proposals').select('id').eq('topic_id',x.id).maybeSingle();
 if(q.error||q.data)return;
 const d=buildLocalFicheProposal(x);
 await db().from('hn_fiche_proposals').insert({topic_id:x.id,proposed_card_data:d,sources:x.source_url?[{label:x.source||'Bron uit artikel',url:x.source_url,type:'existing'}]:[],notes:'Automatisch voorstel op basis van bestaand HN-artikel. Online bronnen worden afzonderlijk beoordeeld.',status:'proposed'});
}
async function loadFicheClaims(){
 const box=$('ficheClaimsList');if(!box)return;
 const r=await db().from('hn_fiche_claims').select('*,topic:topic_id(id,title,slug)').order('created_at',{ascending:false}).limit(50);
 if(r.error){box.innerHTML='<div class="overview-empty">Claimaanvragen konden niet worden geladen.</div>';return}
 const list=r.data||[];
 box.innerHTML=list.length?list.map(x=>'<div class="overview-item" style="align-items:flex-start;"><div style="flex:1;"><b>'+esc(x.topic?.title||'Vermelding')+'</b><div class="hint">'+esc(x.name)+(x.role?' · '+esc(x.role):'')+' · '+esc(x.email)+' · '+new Date(x.created_at).toLocaleString('nl-NL')+'</div>'+(x.phone?'<div class="hint">Telefoon: '+esc(x.phone)+'</div>':'')+(x.message?'<div style="margin-top:7px;font-size:13px;">'+esc(x.message)+'</div>':'')+'</div><div class="actions"><button class="button button-primary" type="button" onclick="setFicheClaimStatus(\''+x.id+'\',\'reviewing\')">In controle</button><button class="button button-secondary" type="button" onclick="setFicheClaimStatus(\''+x.id+'\',\'approved\')">Goedkeuren</button><button class="button button-danger" type="button" onclick="setFicheClaimStatus(\''+x.id+'\',\'rejected\')">Afwijzen</button></div></div>').join(''):'<div class="overview-empty">Geen claimaanvragen.</div>';
}
window.setFicheClaimStatus=async(id,status)=>{
 const r=await db().from('hn_fiche_claims').update({status,reviewed_at:new Date().toISOString()}).eq('id',id);
 if(r.error)return msg(r.error.message,'error');
 await loadFicheClaims();msg('Claimaanvraag bijgewerkt.');
};

async function loadFicheProposals(){
 const box=$('ficheProposalList'); if(!box)return;
 const r=await db().from('hn_fiche_proposals').select('*,topic:topic_id(id,title,slug,city_id,country_id,category_id,visibility)').order('generated_at',{ascending:false});
 if(r.error){box.innerHTML='<div class="overview-empty">Fichevoorstellen konden niet worden geladen.</div>';return}
 const list=r.data||[];
 box.innerHTML=list.length?list.map(p=>{
   const fields=Object.entries(p.proposed_card_data||{}).filter(([k,v])=>v).slice(0,8);
   const sources=p.sources||[];
   const searchUrl='https://www.google.com/search?q='+encodeURIComponent((p.topic?.title||'')+' '+(p.topic?.city_id?'':'')+' praktische informatie');
   return '<div class="overview-item" style="align-items:flex-start;"><div style="flex:1;"><b>'+esc(p.topic?.title||'Artikel')+'</b><div class="hint">'+(p.status==='accepted'?'Voorstel gebruikt':'Voorstel')+' · '+fields.length+' ingevulde velden</div><div style="margin-top:8px;font-size:13px;">'+fields.map(([k,v])=>'<span style="display:block;"><b>'+esc(k.replaceAll('_',' '))+':</b> '+esc(v)+'</span>').join('')+'</div><div class="hint" style="margin-top:8px;">'+esc(p.notes||'')+'</div><div class="actions" style="margin-top:10px;">'+sources.map(s=>'<a class="button button-secondary" href="'+esc(s.url)+'" target="_blank" rel="noopener">Bron: '+esc(s.label)+'</a>').join('')+'<a class="button button-secondary" href="'+esc(searchUrl)+'" target="_blank" rel="noopener">Online zoeken</a><button class="button button-primary" type="button" onclick="useFicheProposal(\''+p.id+'\')">Gebruik als fiche</button></div></div></div>';
 }).join(''):'<div class="overview-empty">Nog geen fichevoorstellen.</div>';
}
window.useFicheProposal=async id=>{
 const r=await db().from('hn_fiche_proposals').select('*,topic:topic_id(*)').eq('id',id).single();
 if(r.error||!r.data)return msg('Fichevoorstel kon niet worden geladen.','error');
 const p=r.data,x=p.topic;
 $('topicId').value=x.id;$('topicTitle').value=x.title||'';$('topicContentType').value='fiche';
 $('topicCountry').value=x.country_id||'';refreshTopicSelects();$('topicCountry').value=x.country_id||'';$('topicCity').value=x.city_id||'';$('topicCategory').value=x.category_id||'';$('topicSource').value=x.source||'';$('topicSourceUrl').value=x.source_url||'';$('topicSummary').value=x.summary||'';$('topicInformationType').value=x.information_type||'Algemene informatie';$('topicVisibility').value='public';$('topicStatus').value='in_review';$('topicPublished').checked=false;
 setFicheData(p.proposed_card_data||{});syncFicheForm();$('topicFormTitle').textContent='Fichevoorstel bewerken';$('cancelTopic').hidden=false;showPage('topics');
 window.scrollTo({top:0,behavior:'smooth'});msg('Fichevoorstel staat klaar om te controleren. Er wordt niets automatisch gepubliceerd.');
};
const ficheFields=['doctor_name','full_name','practice_name','service_type','specialties','additional_qualification','for_children','languages','phone','email','website','address','neighborhood','maps_url','opening_hours','appointment','home_visits','teleconsultation','price','insurance','emergency','equipment','accreditation','warning','short_description'];
function ficheFieldId(key){return 'fiche'+key.split('_').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join('')}
function getFicheData(){const d={};ficheFields.forEach(k=>{const el=$(ficheFieldId(k));if(el&&el.value.trim())d[k]=el.value.trim()});return d}
function setFicheData(data){const d=data&&typeof data==='object'?data:{};ficheFields.forEach(k=>{const el=$(ficheFieldId(k));if(el)el.value=Array.isArray(d[k])?d[k].map(v=>typeof v==='string'?v:(v?.name||v?.language||'')).filter(Boolean).join(', '):(d[k]??'')})}
function syncFicheForm(){
 const fiche=$('topicContentType')?.value==='fiche';
 if($('ficheFields'))$('ficheFields').style.display=fiche?'block':'none';
 if($('articleContentField'))$('articleContentField').style.display=fiche?'none':'block';
 if($('topicContent'))$('topicContent').required=!fiche;
 if($('topicFicheHint'))$('topicFicheHint').style.display=fiche?'block':'none';
 if(typeof syncTopicContentType==='function')syncTopicContentType();
}
window.editTopic=id=>{const x=state.topics.find(x=>x.id===id);if(!x)return;$('topicId').value=x.id;$('topicTitle').value=x.title||'';$('topicContentType').value=x.visibility==='fiche_only'?'fiche':'article';$('topicCountry').value=x.country_id||'';refreshTopicSelects();$('topicCountry').value=x.country_id||'';$('topicCity').value=x.city_id||'';$('topicCategory').value=x.category_id||'';$('topicSubcategory').value=x.subcategory_id||'';$('topicInformationType').value=x.information_type||'Algemene informatie';$('topicVisibility').value=x.visibility||'public';$('topicStatus').value=x.status||'needs_research';$('topicReviewer').value=x.reviewer_id||'';$('topicSource').value=x.source||'';$('topicSourceUrl').value=x.source_url||'';$('topicSummary').value=x.summary||'';$('topicContent').value=x.content||'';setFicheData(x.card_data);syncFicheForm();$('topicPublished').checked=!!x.published;$('topicFormTitle').textContent='Topic bewerken';$('cancelTopic').hidden=false;showPage('topics')};
window.previewTopic=id=>{const x=state.topics.find(x=>x.id===id);if(!x)return;window.open('/kennisbank?topic='+encodeURIComponent(id),'_blank','noopener');};
window.toggleTopicPublished=async(id,p)=>{const r=await db().from('topic').update({published:!p,status:!p?'verified':'outdated',updated_at:new Date().toISOString()}).eq('id',id);if(r.error)return msg(r.error.message,'error');await loadTopics();msg(!p?'Topic gepubliceerd.':'Topic offline gezet.')};
window.deleteTopic=async id=>{if(!confirm('Dit topic definitief verwijderen?'))return;const r=await db().from('topic').delete().eq('id',id);if(r.error)return msg(r.error.message,'error');await loadTopics();msg('Topic verwijderd.')};
$('topicForm')?.addEventListener('submit',async e=>{e.preventDefault();const id=$('topicId').value;const isFiche=$('topicContentType').value==='fiche';const p={title:$('topicTitle').value.trim(),slug:slug($('topicTitle').value)+'-'+(id||Date.now().toString().slice(-6)),country_id:$('topicCountry').value||null,city_id:$('topicCity').value||null,category_id:$('topicCategory').value||null,subcategory_id:$('topicSubcategory').value||null,information_type:$('topicInformationType').value,visibility:isFiche?'fiche_only':$('topicVisibility').value,status:$('topicStatus').value,reviewer_id:$('topicReviewer').value||null,source:$('topicSource').value.trim()||null,source_url:$('topicSourceUrl').value.trim()||null,summary:$('topicSummary').value.trim()||null,content:isFiche?'':$('topicContent').value.trim(),card_data:isFiche?getFicheData():{},published:$('topicPublished').checked,updated_at:new Date().toISOString()};const r=id?await db().from('topic').update(p).eq('id',id):await db().from('topic').insert({...p,verified_at:p.status==='verified'?new Date().toISOString():null,last_checked_at:new Date().toISOString()});if(r.error)return msg(r.error.message,'error');$('topicForm').reset();$('topicId').value='';$('topicFormTitle').textContent='Nieuw topic';$('cancelTopic').hidden=true;await loadTopics();msg(id?'Topic bijgewerkt.':'Topic toegevoegd.')});
function syncTopicContentType(){
  const fiche=$('topicContentType')?.value==='fiche';
  if($('topicContentLabel'))$('topicContentLabel').textContent=fiche?'Fiche-inhoud':'Inhoud artikel';
  if($('topicFicheHint'))$('topicFicheHint').style.display=fiche?'block':'none';
}
$('topicContentType')?.addEventListener('change',syncFicheForm);

$('cancelTopic')?.addEventListener('click',()=>{$('topicForm').reset();$('topicId').value='';setFicheData({});syncFicheForm();$('topicFormTitle').textContent='Nieuw topic';$('cancelTopic').hidden=true});

async function loadReviewers(){const r=await db().from('reviewers').select('*').order('name');if(r.error)throw r.error;state.reviewers=r.data||[];renderReviewers();refreshTopicSelects()}
function renderReviewers(){const t=$('reviewersTable');if(!t)return;t.innerHTML=state.reviewers.length?state.reviewers.map(x=>'<tr><td><b>'+esc(x.name)+'</b></td><td>'+esc(x.email)+'</td><td>'+esc(x.role)+'</td><td><span class="status '+(x.is_active?'status-active':'status-inactive')+'">'+(x.is_active?'Actief':'Inactief')+'</span></td><td><div class="actions"><button class="button-secondary" onclick="editReviewer(\''+x.id+'\')">Bewerken</button><button class="button-secondary" onclick="toggleReviewer(\''+x.id+'\','+!!x.is_active+')">'+(x.is_active?'Deactiveren':'Activeren')+'</button><button class="button-danger" onclick="deleteReviewer(\''+x.id+'\')">Verwijderen</button></div></td></tr>').join(''):'<tr><td colspan="5" class="empty">Nog geen reviewers.</td></tr>'}
window.editReviewer=id=>{const x=state.reviewers.find(x=>x.id===id);if(!x)return;$('reviewerId').value=x.id;$('reviewerName').value=x.name||'';$('reviewerEmail').value=x.email||'';$('reviewerRole').value=x.role||'';$('reviewerFormTitle').textContent='Reviewer bewerken';$('cancelReviewer').hidden=false;showPage('reviewers')};
window.toggleReviewer=async(id,s)=>{const r=await db().from('reviewers').update({is_active:!s}).eq('id',id);if(r.error)return msg(r.error.message,'error');await loadReviewers();msg(s?'Reviewer gedeactiveerd.':'Reviewer geactiveerd.')};
window.deleteReviewer=async id=>{if(state.topics.some(x=>x.reviewer_id===id))return msg('Deze reviewer is nog gekoppeld aan topics.','error');if(!confirm('Reviewer verwijderen?'))return;const r=await db().from('reviewers').delete().eq('id',id);if(r.error)return msg(r.error.message,'error');await loadReviewers();msg('Reviewer verwijderd.')};
$('reviewerForm')?.addEventListener('submit',async e=>{e.preventDefault();const id=$('reviewerId').value,p={name:$('reviewerName').value.trim(),email:$('reviewerEmail').value.trim()||null,role:$('reviewerRole').value.trim()||null};const r=id?await db().from('reviewers').update(p).eq('id',id):await db().from('reviewers').insert(p);if(r.error)return msg(r.error.message,'error');$('reviewerForm').reset();$('reviewerId').value='';$('reviewerFormTitle').textContent='Nieuwe reviewer';$('cancelReviewer').hidden=true;await loadReviewers();msg(id?'Reviewer bijgewerkt.':'Reviewer toegevoegd.')});
$('cancelReviewer')?.addEventListener('click',()=>{$('reviewerForm').reset();$('reviewerId').value='';$('reviewerFormTitle').textContent='Nieuwe reviewer';$('cancelReviewer').hidden=true});

async function loadUsers(){
  const r=await db().from('profiles').select('*').order('created_at',{ascending:false});if(r.error)throw r.error;
  state.users=r.data||[];if($('totalUsersCount'))$('totalUsersCount').textContent=state.users.length;renderUsers();
}
function renderUsers(){
 const t=$('usersTable');if(!t)return;const q=($('userFilter')?.value||'').toLowerCase();const list=state.users.filter(x=>(x.email||'').toLowerCase().includes(q));
 t.innerHTML=list.length?list.map(x=>'<tr><td><b>'+esc(x.email||'Geen e-mail')+'</b>'+(x.role==='admin'?'<div class="hint">Admin</div>':'')+'</td><td>'+esc(x.application_status||'—')+'</td><td>'+esc(x.updated_at?new Date(x.updated_at).toLocaleString('nl-NL'):'—')+'</td><td>—</td><td>—</td><td><button class="button-secondary" onclick="viewUserPlan(\''+x.id+'\')">Plan bekijken</button></td></tr>').join(''):'<tr><td colspan="6" class="empty">Geen gebruikers gevonden.</td></tr>';
}
window.viewUserPlan=async id=>{
  const x=state.users.find(x=>x.id===id);
  if(!$('userPlanPanel')||!x)return;
  $('userPlanPanel').style.display='block';
  $('selectedUserTitle').textContent='Mijn Hijrah Plan · '+(x.email||'Gebruiker');
  $('userPlanContent').innerHTML='<div class="empty">Plan laden...</div>';
  try{
    const [plan,steps,progress]=await Promise.all([
      db().from('hijrah_plans').select('*').eq('user_id',id).order('updated_at',{ascending:false}).limit(1).maybeSingle(),
      db().from('hijrah_steps').select('*').order('sort_order'),
      db().from('member_progress').select('*').eq('user_id',id)
    ]);
    if(plan.error)throw plan.error;
    if(steps.error)throw steps.error;
    if(progress.error)throw progress.error;
    const p=plan.data;
    if(!p){
      $('userPlanContent').innerHTML='<div class="empty">Deze gebruiker heeft nog geen Mijn Hijrah Plan opgeslagen.</div>';
      return;
    }
    const done=new Set((progress.data||[]).filter(x=>x.completed||x.is_completed).map(x=>x.item_key||x.step_key));
    const list=(steps.data||[]).map(s=>{
      const key=s.key||s.step_key||s.id;
      const label=s.title||s.name||key;
      return '<div class="activity-item"><div><b>'+esc(label)+'</b><div class="activity-description">'+(done.has(key)?'Voltooid':'Nog open')+'</div></div></div>';
    }).join('');
    $('userPlanContent').innerHTML=
      '<div class="activity-details">'+
      '<p><b>Doelland:</b> '+esc(p.target_country_id||'Niet ingevuld')+'</p>'+
      '<p><b>Doelstad:</b> '+esc(p.target_city_id||'Niet ingevuld')+'</p>'+
      '<p><b>Gewenste vertrekdatum:</b> '+esc(p.target_date||p.target_departure_date||'Niet ingevuld')+'</p>'+
      '<p><b>Notities:</b> '+esc(p.notes||'Geen notities')+'</p>'+
      '<p><b>Voortgang:</b> '+done.size+' / '+(steps.data||[]).length+' stappen</p>'+
      '</div><div class="activity-list">'+(list||'<div class="empty">Geen stappen gevonden.</div>')+'</div>';
  }catch(e){
    console.error('HN Admin Mijn Hijrah Plan',e);
    $('userPlanContent').innerHTML='<div class="empty">Het plan kon niet worden geladen: '+esc(e.message||'onbekende fout')+'</div>';
  }
};
$('userFilter')?.addEventListener('input',renderUsers);
$('closeUserPlanButton')?.addEventListener('click',()=>{$('userPlanPanel').style.display='none'});

async function loadSubmissions(){
 const box=$('submissionsList'),reg=$('registrationList');if(!box||!reg)return;
 const [s,p]=await Promise.all([db().from('submissions').select('*').eq('status','pending').order('created_at',{ascending:false}),db().from('profiles').select('*').eq('application_status','pending').order('created_at',{ascending:false})]);
 if(s.error||p.error){box.innerHTML='<div class="empty">Inzendingen konden niet worden geladen.</div>';reg.innerHTML='<div class="empty">Registraties konden niet worden geladen.</div>';return}
 const subs=s.data||[],profiles=p.data||[];if($('submissionBadge')){$('submissionBadge').textContent=subs.length+profiles.length;$('submissionBadge').style.display=(subs.length+profiles.length)?'inline-flex':'none'}
 reg.innerHTML=profiles.length?profiles.map(x=>'<div class="activity-item"><div class="activity-main"><div><div class="activity-user">'+esc([x.first_name,x.last_name].filter(Boolean).join(' ')||x.email)+'</div><div class="activity-description">'+esc(x.email||'')+' · WhatsApp: '+esc(x.whatsapp_number||'Niet ingevuld')+'</div></div><div class="actions"><button class="button button-primary" onclick="approveMember(\''+x.id+'\')">Goedkeuren</button><button class="button button-danger" onclick="rejectMember(\''+x.id+'\')">Afwijzen</button></div></div></div>').join(''):'<div class="empty">Geen openstaande registraties.</div>';
 box.innerHTML=subs.length?subs.map(x=>{const names=[[x.country_name||state.countries.find(y=>y.id===x.country_id)?.name,'Land'],[x.city_name||state.cities.find(y=>y.id===x.city_id)?.name,'Stad'],[x.category_name||state.categories.find(y=>y.id===x.category_id)?.name,'Categorie'],[x.subcategory_name||state.subcategories.find(y=>y.id===x.subcategory_id)?.name,'Subcategorie']].filter(y=>y[0]).map(y=>'<span><b>'+y[1]+':</b> '+esc(y[0])+'</span>').join(' · ');return '<div class="activity-item"><div class="activity-main"><div><div class="activity-user">'+esc(x.title||'Nieuwe inzending')+'</div><div class="activity-description">'+esc(x.submission_type||'Informatie')+' · '+esc(x.content||'')+'</div>'+(names?'<div class="activity-details">'+names+'</div>':'')+'<div class="activity-details"><b>Contactgegevens voor HN:</b> '+([x.submitter_name&&'Naam: '+x.submitter_name,x.submitter_email&&'E-mail: '+x.submitter_email,x.submitter_whatsapp&&'WhatsApp: '+x.submitter_whatsapp,x.submitter_social&&'Social media: '+x.submitter_social].filter(Boolean).map(esc).join(' · ')||'Geen contactgegevens opgegeven')+'</div><div class="activity-details">Ontvangen: '+esc(x.created_at?new Date(x.created_at).toLocaleString('nl-NL'):'')+'</div>'</div><div class="actions"><button class="button button-primary" onclick="approveSubmission(\''+x.id+'\')">Goedkeuren & fiche maken</button><button class="button button-danger" onclick="rejectSubmission(\''+x.id+'\')">Afwijzen</button></div></div></div>'}).join(''):'<div class="empty">Geen openstaande inzendingen.</div>';
}
window.approveMember=async id=>{const r=await db().from('profiles').update({application_status:'approved',verification_status:'verified',approved_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id);if(r.error)return msg(r.error.message,'error');await loadSubmissions();await loadUsers();msg('Lid goedgekeurd.')};
window.rejectMember=async id=>{const r=await db().from('profiles').update({application_status:'rejected',updated_at:new Date().toISOString()}).eq('id',id);if(r.error)return msg(r.error.message,'error');await loadSubmissions();await loadUsers();msg('Registratie afgewezen.')};
window.approveSubmission=async id=>{
 const r=await db().from('submissions').select('*').eq('id',id).maybeSingle();
 if(r.error||!r.data)return msg(r.error?.message||'Inzending niet gevonden.','error');
 const s=r.data;
 const publicContent=window.prompt('Controleer de tekst voor anonieme publicatie. Verwijder namen of andere herkenbare persoonsgegevens. Je kunt de tekst hier aanpassen:',String(s.content||''));
 if(publicContent===null)return;
 if(!publicContent.trim())return msg('De openbare tekst mag niet leeg zijn.','error');
 if(s.submission_type==='experience' && s.target_topic_id){
   const t=await db().from('topic').select('id,title,card_data').eq('id',s.target_topic_id).maybeSingle();
   if(t.error||!t.data)return msg(t.error?.message||'De gekoppelde HN-vermelding bestaat niet meer.','error');
   const card={...(t.data.card_data||{})};
   const experiences=Array.isArray(card.experiences)?card.experiences.slice():[];
   experiences.push({
     text:publicContent.trim(),
     name:'Anoniem',
     date:new Date().toLocaleDateString('nl-NL'),
     source:'community',
     rating:0
   });
   const upTopic=await db().from('topic').update({
     card_data:{...card,experiences},
     updated_at:new Date().toISOString()
   }).eq('id',t.data.id);
   if(upTopic.error)return msg('Ervaring kon niet aan de fiche worden toegevoegd: '+upTopic.error.message,'error');
   const up=await db().from('submissions').update({status:'approved',reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString(),admin_notes:'Gepubliceerd als community-ervaring bij de gekoppelde HN-vermelding.'}).eq('id',id);
   if(up.error)return msg(up.error.message,'error');
   await loadSubmissions();await loadTopics();msg('Ervaring goedgekeurd en toegevoegd aan de community-ervaringen van de fiche.');
   return;
 }
 const typeMap={information:'Algemene informatie',correction:'Algemene informatie',review:'Review',recommendation:'Aanbeveling',warning:'Waarschuwing'};
 const normalizeName=v=>String(v||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
 const resolveValue=async(table,cache,name,extra={})=>{
   const value=String(name||'').trim();if(!value)return null;
   const existing=cache.find(x=>normalizeName(x.name)===normalizeName(value));if(existing)return existing.id;
   const valueSlug=slug(value);if(!valueSlug)throw new Error('Deze nieuwe categorie kan niet worden opgeslagen.');
   const found=await db().from(table).select('id,name').eq('slug',valueSlug).maybeSingle();
   if(found.error)throw found.error;if(found.data){cache.push(found.data);return found.data.id}
   const inserted=await db().from(table).insert({name:value,slug:valueSlug,...extra}).select('id,name').single();
   if(inserted.error){const retry=await db().from(table).select('id,name').eq('slug',valueSlug).maybeSingle();if(retry.error||!retry.data)throw inserted.error;cache.push(retry.data);return retry.data.id}
   cache.push(inserted.data);return inserted.data.id;
 };
 let countryId=s.country_id||null,cityId=s.city_id||null,categoryId=s.category_id||null,subcategoryId=s.subcategory_id||null;
 try{
   if(!countryId&&s.country_name)countryId=await resolveValue('countries',state.countries,s.country_name);
   if(!cityId&&s.city_name)cityId=await resolveValue('cities',state.cities,s.city_name,{country_id:countryId});
   if(!categoryId&&s.category_name)categoryId=await resolveValue('categories',state.categories,s.category_name);
   if(!subcategoryId&&s.subcategory_name)subcategoryId=await resolveValue('subcategories',state.subcategories,s.subcategory_name,{category_id:categoryId});
 }catch(error){return msg('Nieuwe locatie/categorie kon niet worden toegevoegd: '+(error.message||''),'error')}
 const p={title:s.title||'Nieuwe HN-informatie',slug:slug(s.title||'Nieuwe HN-informatie')+'-'+Date.now().toString().slice(-6),country_id:countryId,city_id:cityId,category_id:categoryId,subcategory_id:subcategoryId,information_type:typeMap[s.submission_type]||'Algemene informatie',visibility:s.requested_visibility||'public',status:'published',source:s.source_name||'HN-community',source_url:s.source_url||null,summary:publicContent.trim().replace(/\s+/g,' ').slice(0,220),content:publicContent.trim(),published:true,submitted_by:s.submitted_by||null,source_type:'community',verified_at:new Date().toISOString(),last_checked_at:new Date().toISOString(),card_data:{source_type:'community'}};
 const ins=await db().from('topic').insert(p);
 if(ins.error)return msg('Inzending niet gepubliceerd: '+ins.error.message,'error');
 const up=await db().from('submissions').update({status:'approved',reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id);
 if(up.error)return msg(up.error.message,'error');
 await loadSubmissions();await loadTopics();msg('Inzending goedgekeurd en als fiche toegevoegd.')
};
window.rejectSubmission=async id=>{const r=await db().from('submissions').update({status:'rejected',reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id);if(r.error)return msg(r.error.message,'error');await loadSubmissions();msg('Inzending afgewezen.')};
$('refreshSubmissions')?.addEventListener('click',loadSubmissions);

async function loadSync(){const t=$('syncTable');if(!t)return;const r=await db().from('sync_queue').select('*').order('created_at',{ascending:false}).limit(100);if(r.error){t.innerHTML='<tr><td colspan="6" class="empty">Sync Queue kon niet worden geladen.</td></tr>';return}t.innerHTML=(r.data||[]).length?(r.data||[]).map(x=>'<tr><td>'+esc(x.record_id||x.airtable_record_id||'—')+'</td><td>'+esc(x.entity_type||'—')+'</td><td>'+esc(x.action||'—')+'</td><td>'+esc(x.status||'—')+'</td><td>'+esc(x.updated_at||x.created_at||'—')+'</td><td>'+esc(x.error||'')+'</td></tr>').join(''):'<tr><td colspan="6" class="empty">Geen sync-items.</td></tr>'}

async function loadOverview(){
 const [r,s,t,o,w,recent]=await Promise.all([
  db().from('profiles').select('id,first_name,last_name,email,created_at').eq('application_status','pending').order('created_at',{ascending:false}).limit(8),
  db().from('submissions').select('id,title,status,created_at,submitted_by').eq('status','pending').order('created_at',{ascending:false}).limit(8),
  db().from('topic').select('id,title,slug,status,visibility,published,updated_at,created_at').neq('visibility','fiche_only').in('status',['needs_research','in_review']).order('updated_at',{ascending:false}).limit(8),
  db().from('topic').select('id,title,slug,status,updated_at').neq('visibility','fiche_only').eq('status','outdated').order('updated_at',{ascending:false}).limit(8),
  db().from('launch_waitlist').select('id',{count:'exact',head:true}),
  db().from('topic').select('id,title,visibility,published,updated_at,created_at').order('updated_at',{ascending:false}).limit(8)
 ]);
 const pendingProfiles=r.error?[]:(r.data||[]),pendingSubmissions=s.error?[]:(s.data||[]);
 const reviewTopics=t.error?[]:(t.data||[]),outdated=o.error?[]:(o.data||[]);
 if($('overviewRegistrationCount'))$('overviewRegistrationCount').textContent=r.error?'—':pendingProfiles.length;
 if($('overviewSubmissionCount'))$('overviewSubmissionCount').textContent=s.error?'—':pendingSubmissions.length;
 if($('overviewReviewCount'))$('overviewReviewCount').textContent=t.error?'—':reviewTopics.length;
 if($('overviewOutdatedCount'))$('overviewOutdatedCount').textContent=o.error?'—':outdated.length;
 const newBox=$('overviewNewItems'),reviewBox=$('overviewReviewItems'),recentBox=$('overviewRecentTopics');
 if(newBox){
   const items=[
    ...pendingProfiles.map(x=>({type:'Registratie',title:(x.first_name||x.last_name)?[x.first_name,x.last_name].filter(Boolean).join(' '):(x.email||'Nieuwe registratie'),date:x.created_at,page:'submissions'})),
    ...pendingSubmissions.map(x=>({type:'Inzending',title:x.title||'Nieuwe inzending',date:x.created_at,page:'submissions'}))
   ].sort((a,b)=>new Date(b.date||0)-new Date(a.date||0)).slice(0,8);
   newBox.innerHTML=items.length?items.map(x=>'<button type="button" class="overview-item" data-admin-page="'+x.page+'"><div><b>'+esc(x.title)+'</b><div class="hint">'+esc(x.type)+' · '+new Date(x.date).toLocaleString('nl-NL')+'</div></div><span>Openen →</span></button>').join(''):'<div class="overview-empty">Geen nieuwe registraties of inzendingen.</div>';
 }
 if(reviewBox){
   const items=[
    ...reviewTopics.map(x=>({title:x.title,type:x.status,date:x.updated_at||x.created_at})),
    ...outdated.map(x=>({title:x.title,type:'Verouderd',date:x.updated_at}))
   ].slice(0,8);
   reviewBox.innerHTML=items.length?items.map(x=>'<button type="button" class="overview-item" data-admin-page="topics"><div><b>'+esc(x.title||'Zonder titel')+'</b><div class="hint">'+esc(x.type||'Controle nodig')+' · '+(x.date?new Date(x.date).toLocaleDateString('nl-NL'):'')+'</div></div><span>Openen →</span></button>').join(''):'<div class="overview-empty">Geen artikelen die momenteel controle nodig hebben.</div>';
 }
 if(recentBox){
   const items=recent.error?[]:(recent.data||[]);
   recentBox.innerHTML=items.length?items.map(x=>'<button type="button" class="overview-item" data-admin-page="topics"><div><b>'+esc(x.title||'Zonder titel')+'</b><div class="hint">'+(x.visibility==='fiche_only'?'Fiche':'Artikel')+' · '+(x.published?'Gepubliceerd':'Niet gepubliceerd')+' · '+new Date(x.updated_at||x.created_at).toLocaleString('nl-NL')+'</div></div><span>Bekijken →</span></button>').join(''):'<div class="overview-empty">Nog geen content gevonden.</div>';
 }
 if($('launchWaitlistCount'))$('launchWaitlistCount').textContent=w.error?'—':(w.count||0);
}
function startUserMonitoring(){loadActivity().catch(e=>{console.error(e);renderMonitoringError(e)})}
function renderMonitoringError(e){const el=$('monitorError');if(el){el.textContent='Activiteiten konden niet worden geladen: '+(e?.message||'onbekende fout');el.classList.add('show')}}
window.toggleRegistrationDetails=id=>{const e=$('registration-details-'+id);if(e)e.hidden=!e.hidden};
window.toggleOlderActivities=()=>{const el=$('activityList');if(el)el.scrollIntoView({behavior:'smooth',block:'start'})};
async function seedDoctor(data){
 const existing=await db().from('topic').select('id').eq('slug',data.slug).maybeSingle(); if(existing.error)throw existing.error;
 const payload={...data,updated_at:new Date().toISOString()};
 if(existing.data){const r=await db().from('topic').update(payload).eq('id',existing.data.id);if(r.error)throw r.error}
 else {const r=await db().from('topic').insert(payload);if(r.error)throw r.error}
 await loadTopics(); msg(data.title+' opgeslagen.');
}
window.seedYohanGuazzi=async()=>safe('Dr. Yohan Guazzi',()=>seedDoctor({title:'Dr. Yohan Guazzi | Huisarts in Tanger',slug:'dr-yohan-guazzi-huisarts-in-tanger',city_id:'c09cd1f7-4281-4391-b099-79c58b436121',category_id:'f86405a9-cf8c-43fe-98bf-2f1ff46723e7',information_type:'Officiële informatie',status:'verified',visibility:'public',source:'Cabinet Médical Ibn Zuhr',source_url:'https://www.cabmed-iz.ma/',summary:'Dr. Yohan Guazzi is médecin généraliste in Tanger.',content:'Dr. Yohan Guazzi is huisarts / médecin généraliste bij Cabinet Médical Ibn Zuhr in Tanger. Talen: Frans (bron), Arabisch en Engels (community-informatie). Controleer actuele gegevens rechtstreeks bij de praktijk.',published:true,source_type:'official',verification_status:'verified',verified_at:new Date().toISOString(),last_checked_at:new Date().toISOString(),card_data:{doctor_name:'Dr. Yohan Guazzi',practice_name:'Cabinet Médical Ibn Zuhr',service_type:'Huisarts / Médecin généraliste',address:'1, rue 6 Jabel Tarek, Rond point Nawras, Branes 2, 90000 Tanger, Marokko',neighborhood:'Branes 2',phone:'+212 5 39 42 77 77',email:'y.guazzi@cabmed-iz.ma',website:'https://www.cabmed-iz.ma/',maps_url:'https://maps.app.goo.gl/rApDJVfsvFuSYmib6',languages:[{name:'Frans',source:'official'},{name:'Arabisch',source:'community'},{name:'Engels',source:'community'}]}}));
window.seedNajateHadiBoukoula=async()=>safe('Dr. Najate Hadi Boukoula',()=>seedDoctor({title:'Dr. Najate Hadi Boukoula | Huisarts in Tanger',slug:'dr-najate-hadi-boukoula-huisarts-in-tanger',city_id:'c09cd1f7-4281-4391-b099-79c58b436121',category_id:'f86405a9-cf8c-43fe-98bf-2f1ff46723e7',information_type:'Officiële informatie',status:'verified',visibility:'public',source:'Cabinet Médical Ibn Zuhr',source_url:'https://www.cabmed-iz.ma/',summary:'Dr. Najate Hadi Boukoula is médecin généraliste in Tanger met aanvullende opleiding in gynaecologie en verloskunde.',content:'Dr. Najate Hadi Boukoula is médecin généraliste bij Cabinet Médical Ibn Zuhr in Tanger. De praktijk vermeldt daarnaast een diplôme inter-universitaire de formation complémentaire en Gynécologie-Obstétrique. Controleer actuele gegevens rechtstreeks bij de praktijk.',published:true,source_type:'official',verification_status:'verified',verified_at:new Date().toISOString(),last_checked_at:new Date().toISOString(),card_data:{doctor_name:'Dr. Najate Hadi Boukoula',practice_name:'Cabinet Médical Ibn Zuhr',service_type:'Huisarts / Médecin généraliste',additional_qualification:'Gynaecologie & verloskunde',languages:[{name:'Frans',source:'official'},{name:'Arabisch',source:'community'},{name:'Engels',source:'community'}]}}));

async function init(){
  wireNavigation();
  if(!db()){msg('Supabase is niet beschikbaar.','error');return}
  try{
    if(!(await checkAdmin()))return;
  }catch(e){
    console.error(e);
    msg('De beheeromgeving kon niet worden gecontroleerd: '+(e.message||''),'error');
    return;
  }
  const jobs=[
    ['Landen',loadCountries],['Steden',loadCities],['Categorieën',loadCategories],
    ['Subcategorieën',loadSubcategories],['Reviewers',loadReviewers],['Kennisbank',loadTopics],
    ['Gebruikers',loadUsers],['Inzendingen',loadSubmissions],['Sync Queue',loadSync],['Overzicht',loadOverview]
  ];
  await Promise.all(jobs.map(([label,fn])=>safe(label,fn)));
  refreshTopicSelects();
  let start='overview';
  try{start=location.hash.replace('#','')||localStorage.getItem('hn_admin_page')||'overview'}catch(e){}
  if(!$('page-'+start))start='overview';
  showPage(start,false);
  startUserMonitoring();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();

})();