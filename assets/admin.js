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

window.showPage=function(p){
  const page=$('page-'+p); if(!page)return;
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.nav-button').forEach(x=>x.classList.remove('active'));
  page.classList.add('active');
  const nav=document.querySelector('.nav-button[data-page="'+p+'"]'); if(nav)nav.classList.add('active');
  const titles={overview:'Overzicht',platform:"Platformpagina's",countries:'Landen',cities:'Steden',categories:'Categorieën',subcategories:'Subcategorieën',topics:'Kennisbank',reviewers:'Reviewers',users:'Gebruikers',submissions:'Inzendingen',sync:'Sync Queue'};
  if($('pageTitle'))$('pageTitle').textContent=titles[p]||'Admin';
  const loaders={overview:loadOverview,countries:loadCountries,cities:loadCities,categories:loadCategories,subcategories:loadSubcategories,topics:loadTopics,reviewers:loadReviewers,users:loadUsers,submissions:loadSubmissions,sync:loadSync};
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

async function loadTopics(){const r=await db().from('topic').select('*,countries(name),cities(name),categories(name),subcategories(name),reviewers(name)').order('updated_at',{ascending:false});if(r.error)throw r.error;state.topics=r.data||[];if($('topicCount'))$('topicCount').textContent=state.topics.length;renderTopics()}
function renderTopics(){const t=$('topicsTable');if(!t)return;const q=($('topicFilter')?.value||'').toLowerCase();const list=state.topics.filter(x=>(x.title||'').toLowerCase().includes(q));t.innerHTML=list.length?list.map(x=>'<tr><td><b>'+esc(x.title)+'</b><div class="hint">'+esc(x.slug)+'</div></td><td>'+esc(x.cities?.name||'')+(x.countries?.name?' ('+esc(x.countries.name)+')':'')+'</td><td>'+esc(x.categories?.name)+(x.subcategories?.name?' / '+esc(x.subcategories.name):'')+'</td><td>'+esc(x.information_type)+'</td><td>'+esc(x.status)+'</td><td><span class="status '+(x.published?'status-published':'status-draft')+'">'+(x.published?'Gepubliceerd':'Concept')+'</span></td><td><div class="actions"><button class="button-secondary" onclick="editTopic(\''+x.id+'\')">Bewerken</button><button class="button-secondary" onclick="toggleTopicPublished(\''+x.id+'\','+!!x.published+')">'+(x.published?'Offline':'Publiceren')+'</button><button class="button-danger" onclick="deleteTopic(\''+x.id+'\')">Verwijderen</button></div></td></tr>').join(''):'<tr><td colspan="7" class="empty">Geen topics gevonden.</td></tr>'}
$('topicFilter')?.addEventListener('input',renderTopics);
window.editTopic=id=>{const x=state.topics.find(x=>x.id===id);if(!x)return;$('topicId').value=x.id;$('topicTitle').value=x.title||'';$('topicCountry').value=x.country_id||'';refreshTopicSelects();$('topicCountry').value=x.country_id||'';$('topicCity').value=x.city_id||'';$('topicCategory').value=x.category_id||'';$('topicSubcategory').value=x.subcategory_id||'';$('topicInformationType').value=x.information_type||'Algemene informatie';$('topicVisibility').value=x.visibility||'public';$('topicStatus').value=x.status||'needs_research';$('topicReviewer').value=x.reviewer_id||'';$('topicSource').value=x.source||'';$('topicSourceUrl').value=x.source_url||'';$('topicSummary').value=x.summary||'';$('topicContent').value=x.content||'';$('topicPublished').checked=!!x.published;$('topicFormTitle').textContent='Topic bewerken';$('cancelTopic').hidden=false;showPage('topics')};
window.toggleTopicPublished=async(id,p)=>{const r=await db().from('topic').update({published:!p,status:!p?'verified':'outdated',updated_at:new Date().toISOString()}).eq('id',id);if(r.error)return msg(r.error.message,'error');await loadTopics();msg(!p?'Topic gepubliceerd.':'Topic offline gezet.')};
window.deleteTopic=async id=>{if(!confirm('Dit topic definitief verwijderen?'))return;const r=await db().from('topic').delete().eq('id',id);if(r.error)return msg(r.error.message,'error');await loadTopics();msg('Topic verwijderd.')};
$('topicForm')?.addEventListener('submit',async e=>{e.preventDefault();const id=$('topicId').value;const p={title:$('topicTitle').value.trim(),slug:slug($('topicTitle').value)+'-'+(id||Date.now().toString().slice(-6)),country_id:$('topicCountry').value||null,city_id:$('topicCity').value||null,category_id:$('topicCategory').value||null,subcategory_id:$('topicSubcategory').value||null,information_type:$('topicInformationType').value,visibility:$('topicVisibility').value,status:$('topicStatus').value,reviewer_id:$('topicReviewer').value||null,source:$('topicSource').value.trim()||null,source_url:$('topicSourceUrl').value.trim()||null,summary:$('topicSummary').value.trim()||null,content:$('topicContent').value.trim(),published:$('topicPublished').checked,updated_at:new Date().toISOString()};const r=id?await db().from('topic').update(p).eq('id',id):await db().from('topic').insert({...p,verified_at:p.status==='verified'?new Date().toISOString():null,last_checked_at:new Date().toISOString()});if(r.error)return msg(r.error.message,'error');$('topicForm').reset();$('topicId').value='';$('topicFormTitle').textContent='Nieuw topic';$('cancelTopic').hidden=true;await loadTopics();msg(id?'Topic bijgewerkt.':'Topic toegevoegd.')});
$('cancelTopic')?.addEventListener('click',()=>{$('topicForm').reset();$('topicId').value='';$('topicFormTitle').textContent='Nieuw topic';$('cancelTopic').hidden=true});

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
window.viewUserPlan=async id=>{const x=state.users.find(x=>x.id===id);if(!$('userPlanPanel'))return;$('userPlanPanel').style.display='block';$('selectedUserTitle').textContent='Mijn Hijrah Plan · '+(x?.email||'Gebruiker');$('userPlanContent').innerHTML='<div class="empty">Het plan van deze gebruiker is beschikbaar zodra er een Mijn Hijrah Plan is opgeslagen.</div>'};
$('userFilter')?.addEventListener('input',renderUsers);
$('closeUserPlanButton')?.addEventListener('click',()=>{$('userPlanPanel').style.display='none'});

async function loadSubmissions(){
 const box=$('submissionsList'),reg=$('registrationList');if(!box||!reg)return;
 const [s,p]=await Promise.all([db().from('submissions').select('*').eq('status','pending').order('created_at',{ascending:false}),db().from('profiles').select('*').eq('application_status','pending').order('created_at',{ascending:false})]);
 if(s.error||p.error){box.innerHTML='<div class="empty">Inzendingen konden niet worden geladen.</div>';reg.innerHTML='<div class="empty">Registraties konden niet worden geladen.</div>';return}
 const subs=s.data||[],profiles=p.data||[];if($('submissionBadge')){$('submissionBadge').textContent=subs.length+profiles.length;$('submissionBadge').style.display=(subs.length+profiles.length)?'inline-flex':'none'}
 reg.innerHTML=profiles.length?profiles.map(x=>'<div class="activity-item"><div class="activity-main"><div><div class="activity-user">'+esc([x.first_name,x.last_name].filter(Boolean).join(' ')||x.email)+'</div><div class="activity-description">'+esc(x.email||'')+' · WhatsApp: '+esc(x.whatsapp_number||'Niet ingevuld')+'</div></div><div class="actions"><button class="button button-primary" onclick="approveMember(\''+x.id+'\')">Goedkeuren</button><button class="button button-danger" onclick="rejectMember(\''+x.id+'\')">Afwijzen</button></div></div></div>').join(''):'<div class="empty">Geen openstaande registraties.</div>';
 box.innerHTML=subs.length?subs.map(x=>'<div class="activity-item"><div class="activity-main"><div><div class="activity-user">'+esc(x.title||'Nieuwe inzending')+'</div><div class="activity-description">'+esc(x.submission_type||'Informatie')+' · '+esc(x.content||'')+'</div><div class="activity-details">'+esc(x.submitter_name||'Anoniem')+' · '+esc(x.created_at?new Date(x.created_at).toLocaleString('nl-NL'):'')+'</div></div><div class="actions"><button class="button button-primary" onclick="approveSubmission(\''+x.id+'\')">Goedkeuren & fiche maken</button><button class="button button-danger" onclick="rejectSubmission(\''+x.id+'\')">Afwijzen</button></div></div></div>').join(''):'<div class="empty">Geen openstaande inzendingen.</div>';
}
window.approveMember=async id=>{const r=await db().from('profiles').update({application_status:'approved',verification_status:'verified',approved_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id);if(r.error)return msg(r.error.message,'error');await loadSubmissions();await loadUsers();msg('Lid goedgekeurd.')};
window.rejectMember=async id=>{const r=await db().from('profiles').update({application_status:'rejected',updated_at:new Date().toISOString()}).eq('id',id);if(r.error)return msg(r.error.message,'error');await loadSubmissions();await loadUsers();msg('Registratie afgewezen.')};
window.approveSubmission=async id=>{const r=await db().from('submissions').select('*').eq('id',id).maybeSingle();if(r.error||!r.data)return msg(r.error?.message||'Inzending niet gevonden.','error');const s=r.data;const typeMap={information:'Algemene informatie',correction:'Algemene informatie',experience:'Ervaring',review:'Review',recommendation:'Aanbeveling',warning:'Waarschuwing'};const p={title:s.title||'Nieuwe HN-informatie',slug:slug(s.title||'Nieuwe HN-informatie')+'-'+Date.now().toString().slice(-6),country_id:s.country_id||null,city_id:s.city_id||null,category_id:s.category_id||null,subcategory_id:s.subcategory_id||null,information_type:typeMap[s.submission_type]||'Algemene informatie',visibility:s.requested_visibility||'public',status:'published',source:s.source_name||'HN-community',source_url:s.source_url||null,summary:String(s.content||'').replace(/\s+/g,' ').trim().slice(0,220),content:s.content||'',published:true,submitted_by:s.submitted_by||null,source_type:'community',verified_at:new Date().toISOString(),last_checked_at:new Date().toISOString(),card_data:{source_type:'community'}};const ins=await db().from('topic').insert(p);if(ins.error)return msg('Inzending niet gepubliceerd: '+ins.error.message,'error');const up=await db().from('submissions').update({status:'approved',reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id);if(up.error)return msg(up.error.message,'error');await loadSubmissions();await loadTopics();msg('Inzending goedgekeurd en als fiche toegevoegd.')};
window.rejectSubmission=async id=>{const r=await db().from('submissions').update({status:'rejected',reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id);if(r.error)return msg(r.error.message,'error');await loadSubmissions();msg('Inzending afgewezen.')};
$('refreshSubmissions')?.addEventListener('click',loadSubmissions);

async function loadSync(){const t=$('syncTable');if(!t)return;const r=await db().from('sync_queue').select('*').order('created_at',{ascending:false}).limit(100);if(r.error){t.innerHTML='<tr><td colspan="6" class="empty">Sync Queue kon niet worden geladen.</td></tr>';return}t.innerHTML=(r.data||[]).length?(r.data||[]).map(x=>'<tr><td>'+esc(x.record_id||x.airtable_record_id||'—')+'</td><td>'+esc(x.entity_type||'—')+'</td><td>'+esc(x.action||'—')+'</td><td>'+esc(x.status||'—')+'</td><td>'+esc(x.updated_at||x.created_at||'—')+'</td><td>'+esc(x.error||'')+'</td></tr>').join(''):'<tr><td colspan="6" class="empty">Geen sync-items.</td></tr>'}

async function loadOverview(){
 const [r,s,t,o]=await Promise.all([
  db().from('profiles').select('id').eq('application_status','pending'),
  db().from('submissions').select('id').eq('status','pending'),
  db().from('topic').select('id').in('status',['needs_research','in_review','outdated']),
  db().from('topic').select('id').eq('status','outdated')
 ]);
 if($('overviewRegistrationCount'))$('overviewRegistrationCount').textContent=r.error?'—':(r.data||[]).length;
 if($('overviewSubmissionCount'))$('overviewSubmissionCount').textContent=s.error?'—':(s.data||[]).length;
 if($('overviewReviewCount'))$('overviewReviewCount').textContent=t.error?'—':(t.data||[]).length;
 if($('overviewOutdatedCount'))$('overviewOutdatedCount').textContent=o.error?'—':(o.data||[]).length;
 const newBox=$('overviewNewItems'),reviewBox=$('overviewReviewItems'),recent=$('overviewRecentTopics');
 if(newBox)newBox.innerHTML='<div class="overview-empty">Open Inzendingen om nieuwe registraties en inzendingen te beheren.</div>';
 if(reviewBox)reviewBox.innerHTML='<div class="overview-empty">Open Kennisbank om items te controleren.</div>';
 if(recent)recent.innerHTML='<div class="overview-empty">Recente topics staan in de Kennisbank.</div>';
}

function startUserMonitoring(){if($('onlineUsersCount'))$('onlineUsersCount').textContent='—';if($('activityCount'))$('activityCount').textContent='—'}
function renderMonitoringError(){}
window.toggleRegistrationDetails=id=>{const e=$('registration-details-'+id);if(e)e.hidden=!e.hidden};
window.toggleOlderActivities=()=>{};
window.updateYohanSeedButton=async()=>{};
window.seedYohanGuazzi=async()=>msg('Gebruik de bestaande artsfiche in de Kennisbank.','error');
window.seedNajateHadiBoukoula=async()=>msg('Gebruik de bestaande artsfiche in de Kennisbank.','error');

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
  showPage('overview');
  startUserMonitoring();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();

})();