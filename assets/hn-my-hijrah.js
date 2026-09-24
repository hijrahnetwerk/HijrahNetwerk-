/* HN My Hijrah extension: personal workspace layer on top of the existing dashboard. */
(function(){
  'use strict';
  const db=()=>window.hijrahSupabase;
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  let user=null, items=[], circle=null, layout=null;

  async function init(){
    if(!db()) return;
    const {data}=await db().auth.getUser();
    user=data?.user||null;
    if(!user || !/dashboard(?:\.html)?$/.test(location.pathname)) return;
    await Promise.all([loadItems(),loadCircle(),loadLayout()]);
    mount();
  }

  async function loadItems(){
    const r=await db().from('hn_personal_items').select('*').eq('user_id',user.id).order('due_date',{ascending:true,nullsFirst:false}).order('created_at',{ascending:false});
    if(!r.error) items=r.data||[];
  }
  async function loadCircle(){
    const r=await db().from('hn_hijrah_circle').select('*').eq('user_id',user.id).maybeSingle();
    if(!r.error) circle=r.data||{user_id:user.id,current_stage:'orienteren',completed_stages:[]};
  }
  async function loadLayout(){
    const r=await db().from('hn_dashboard_layouts').select('*').eq('user_id',user.id).maybeSingle();
    layout=r.data||{user_id:user.id,layout:['progress','next_step','target','budget','documents','deadlines','saved','map'],hidden:[]};
  }
  function mount(){
    const anchor=document.querySelector('main')||document.querySelector('.page')||document.body;
    const wrap=document.createElement('section');
    wrap.id='hnPersonalWorkspace';
    wrap.innerHTML='<style>      #hnPersonalWorkspace{margin:28px auto;max-width:1180px;padding:0 18px}      .hnw{background:#fff;border:1px solid #eadfd2;border-radius:18px;padding:22px;margin:16px 0;box-shadow:0 6px 22px rgba(70,45,25,.06)}      .hnw h2,.hnw h3{margin:0 0 8px;color:#684a25}.hnmuted{color:#766b61;font-size:.92rem}.hnrow{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.hninput,.hnselect{border:1px solid #d9cbbd;border-radius:10px;padding:10px 12px;background:#fff}.hnbtn{border:0;border-radius:10px;padding:10px 14px;cursor:pointer;background:#684a25;color:#fff}.hnbtn.alt{background:#f2e8dc;color:#684a25}.hnitems{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.hnitem{border:1px solid #eadfd2;border-radius:13px;padding:14px}.hnitem strong{display:block;margin-bottom:5px}.hnstage{display:flex;gap:6px;flex-wrap:wrap}.hnstage button{border:1px solid #d9cbbd;background:#fff;border-radius:999px;padding:8px 11px;cursor:pointer}.hnstage button.active{background:#684a25;color:#fff;border-color:#684a25}.hnsmall{font-size:.8rem;color:#8a7a6a}.hnempty{padding:12px;background:#faf7f3;border-radius:10px;color:#766b61}    </style>    <div class="hnw"><h2>Mijn Hijrah Werkruimte</h2><div class="hnmuted">Hier bewaar je persoonlijke zaken naast je bestaande Hijrah Stappenplan.</div><div id="hnCircle"></div></div>    <div class="hnw"><h3>Mijn persoonlijke lijst</h3><div class="hnrow" style="margin:12px 0"><select id="hnType" class="hnselect"><option value="deadline">Deadline</option><option value="budget">Budget</option><option value="document">Document</option><option value="person">Belangrijk persoon</option><option value="place">Plaats</option><option value="attention">Aandachtspunt</option><option value="note">Notitie</option></select><input id="hnTitle" class="hninput" placeholder="Titel"><input id="hnDate" class="hninput" type="date"><input id="hnAmount" class="hninput" type="number" step="0.01" placeholder="Bedrag"><button id="hnAdd" class="hnbtn">Toevoegen</button></div><div id="hnItems" class="hnitems"></div></div>';
    anchor.insertBefore(wrap,anchor.firstChild);
    render();
    document.getElementById('hnAdd').onclick=addItem;
  }
  const stages=['orienteren','onderzoeken','voorbereiden','vertrekken','aankomen','integreren','ervaren','delen'];
  const labels={orienteren:'Oriënteren',onderzoeken:'Onderzoeken',voorbereiden:'Voorbereiden',vertrekken:'Vertrekken',aankomen:'Aankomen',integreren:'Integreren',ervaren:'Ervaren',delen:'Delen'};
  function render(){
    const c=document.getElementById('hnCircle');
    if(c)c.innerHTML='<div class="hnmuted" style="margin:14px 0 8px">Mijn Hijrah Cirkel</div><div class="hnstage">'+stages.map(s=>'<button class="'+(circle.current_stage===s?'active':'')+'" data-stage="'+s+'">'+labels[s]+'</button>').join('')+'</div>';
    c?.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>setStage(b.dataset.stage));
    const box=document.getElementById('hnItems');
    if(!box)return;
    if(!items.length){box.innerHTML='<div class="hnempty">Nog geen persoonlijke items toegevoegd.</div>';return;}
    box.innerHTML=items.map(i=>'<div class="hnitem"><strong>'+esc(i.title)+'</strong><div class="hnsmall">'+esc(labels[i.item_type]||i.item_type)+(i.due_date?' · '+esc(i.due_date):'')+(i.amount!=null?' · € '+Number(i.amount).toLocaleString('nl-NL',{minimumFractionDigits:2}):'')+'</div><button class="hnbtn alt" data-del="'+i.id+'" style="margin-top:10px">Verwijderen</button></div>').join('');
    box.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>removeItem(b.dataset.del));
  }
  async function setStage(stage){
    circle={...circle,current_stage:stage,updated_at:new Date().toISOString()};
    const r=await db().from('hn_hijrah_circle').upsert(circle,{onConflict:'user_id'});
    if(!r.error)render();
  }
  async function addItem(){
    const title=document.getElementById('hnTitle').value.trim(); if(!title)return;
    const payload={user_id:user.id,item_type:document.getElementById('hnType').value,title,amount:document.getElementById('hnAmount').value||null,due_date:document.getElementById('hnDate').value||null};
    const r=await db().from('hn_personal_items').insert(payload).select().single();
    if(!r.error){items.unshift(r.data);document.getElementById('hnTitle').value='';document.getElementById('hnDate').value='';document.getElementById('hnAmount').value='';render();}
  }
  async function removeItem(id){
    const r=await db().from('hn_personal_items').delete().eq('id',id).eq('user_id',user.id);
    if(!r.error){items=items.filter(x=>x.id!==id);render();}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();