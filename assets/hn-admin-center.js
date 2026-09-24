(function(){
'use strict';
const db=()=>window.hijrahSupabase;
async function init(){
 if(!db()||!document.querySelector('#page-users'))return;
 const {data}=await db().auth.getUser(); if(!data?.user)return;
 const wrap=document.createElement('section'); wrap.className='page'; wrap.id='hnOpsCenter';
 wrap.innerHTML='<div class="intro"><h2>HN Beheercentrum</h2><p>Centraal overzicht van content, community en controlewerk.</p></div><div class="panel"><div id="hnOps" class="monitor-summary"><div class="monitor-box"><div class="monitor-box-label">Open inzendingen</div><div class="monitor-box-value" id="opsSub">—</div></div><div class="monitor-box"><div class="monitor-box-label">Open edit voorstellen</div><div class="monitor-box-value" id="opsEdit">—</div></div><div class="monitor-box"><div class="monitor-box-label">Open fiche voorstellen</div><div class="monitor-box-value" id="opsFiche">—</div></div><div class="monitor-box"><div class="monitor-box-label">Te controleren topics</div><div class="monitor-box-value" id="opsReview">—</div></div></div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px"><a class="button button-secondary" href="/admin-bewerkvoorstellen">Bewerkvoorstellen</a><a class="button button-secondary" href="/admin-kaart">HN-kaart beheren</a><a class="button button-secondary" href="/admin-wachtlijst">Lanceringslijst</a><a class="button button-secondary" href="/admin-hulp">Beheerhulp</a><a class="button button-secondary" href="/werkruimte">HN Werkruimte</a></div></div>';
 const target=document.querySelector('#page-users'); target.parentNode.insertBefore(wrap,target);
 async function count(table,filter){
  let q=db().from(table).select('id',{count:'exact',head:true}); if(filter)Object.entries(filter).forEach(([k,v])=>q=q.eq(k,v)); const r=await q; return r.count??0;
 }
 const [s,e,f]=await Promise.all([count('submissions',{status:'pending'}),count('hn_edit_proposals',{status:'pending'}),count('hn_fiche_proposals',{status:'pending'})]);
 document.getElementById('opsSub').textContent=s; document.getElementById('opsEdit').textContent=e; document.getElementById('opsFiche').textContent=f;
 const r=await db().from('topic').select('id',{count:'exact',head:true}).or('next_review_at.lte.'+new Date().toISOString()+',verification_status.eq.controleren'); document.getElementById('opsReview').textContent=r.count??0;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();