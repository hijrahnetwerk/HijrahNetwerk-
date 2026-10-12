(function(){
'use strict';
const db=()=>window.hijrahSupabase;
const waitFor=(promise,label,ms=12000)=>Promise.race([Promise.resolve(promise),new Promise((_,reject)=>setTimeout(()=>reject(new Error(label+' duurde langer dan verwacht.')),ms))]);
async function init(){
 if(!db()||!document.querySelector('#page-users'))return;
 try{
  const session=await waitFor(db().auth.getUser(),'Het controleren van de beheersessie');
  if(session.error)throw session.error;
  if(!session.data?.user)return;
  const wrap=document.createElement('section');wrap.className='page';wrap.id='hnOpsCenter';
  wrap.innerHTML='<div class="intro"><h2>HN Beheercentrum</h2><p>Centraal overzicht van content, community en controlewerk.</p></div><div class="panel"><div id="hnOps" class="monitor-summary"><div class="monitor-box"><div class="monitor-box-label">Open inzendingen</div><div class="monitor-box-value" id="opsSub">—</div></div><div class="monitor-box"><div class="monitor-box-label">Open edit voorstellen</div><div class="monitor-box-value" id="opsEdit">—</div></div><div class="monitor-box"><div class="monitor-box-label">Open fiche voorstellen</div><div class="monitor-box-value" id="opsFiche">—</div></div><div class="monitor-box"><div class="monitor-box-label">Te controleren topics</div><div class="monitor-box-value" id="opsReview">—</div></div></div><div id="hnOpsError" role="status" style="display:none;margin-top:12px;padding:10px;border-radius:8px;background:#fff3e8;color:#674C2E"></div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px"><a class="button button-secondary" href="/admin-bewerkvoorstellen">Bewerkvoorstellen</a><a class="button button-secondary" href="/admin-kaart">HN-kaart beheren</a><a class="button button-secondary" href="/admin-wachtlijst">Lanceringslijst</a><a class="button button-secondary" href="/admin-hulp">Beheerhulp</a><a class="button button-secondary" href="/werkruimte">HN Werkruimte</a></div></div>';
  const target=document.querySelector('#page-users');if(!target||!target.parentNode)return;target.parentNode.insertBefore(wrap,target);
  async function count(table,filter){
   let q=db().from(table).select('id',{count:'exact',head:true});if(filter)Object.entries(filter).forEach(([k,v])=>q=q.eq(k,v));
   const r=await waitFor(q,'Het tellen van '+table);if(r.error)throw r.error;return r.count??0;
  }
  const values=await Promise.all([count('submissions',{status:'pending'}),count('hn_edit_proposals',{status:'pending'}),count('hn_fiche_proposals',{status:'pending'})]);
  document.getElementById('opsSub').textContent=values[0];document.getElementById('opsEdit').textContent=values[1];document.getElementById('opsFiche').textContent=values[2];
  const r=await waitFor(db().from('topic').select('id',{count:'exact',head:true}).or('next_review_at.lte.'+new Date().toISOString()+',verification_status.eq.controleren'),'Het tellen van topics ter controle');
  if(r.error)throw r.error;document.getElementById('opsReview').textContent=r.count??0;
 }catch(error){
  console.error('[HN Beheercentrum] laden mislukt:',error);
  const box=document.getElementById('hnOpsError');if(box){box.textContent='Het beheercentrum kon niet volledig worden geladen. Vernieuw de pagina om opnieuw te proberen.';box.style.display='block'}
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();