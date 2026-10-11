(function(){'use strict';
const db=()=>window.hijrahSupabase,esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
async function init(){
 if(!db()||!location.pathname.match(/dashboard(?:\.html)?$/))return;
 const {data}=await db().auth.getUser(),u=data?.user;if(!u)return;
 const tabs=document.querySelector('.tabs');if(!tabs||document.getElementById('tab-passport'))return;
 const t=document.createElement('button');t.className='tab';t.type='button';t.textContent='HN Paspoort';
 const v=document.createElement('div');v.className='tabview';v.id='tab-passport';
 v.innerHTML='<h2>HN Paspoort</h2><p class="muted">Je behaalde HN-badges voor betekenisvolle stappen en bijdragen.</p><div id="hnPassportSummary"></div><div id="hnPassportList" class="list"></div><div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap"><a class="button" href="/paspoort">Open mijn HN Paspoort</a><a class="button secondary" href="/profiel?id='+encodeURIComponent(u.id)+'">Mijn HN Profiel bekijken</a><span id="hnBadgesAdminLink"></span></div>';
 tabs.appendChild(t);document.querySelector('#tab-profile')?.parentNode?.appendChild(v);
 t.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.tabview').forEach(x=>x.classList.remove('active'));t.classList.add('active');v.classList.add('active')});
 const[a,e,p,sr]=await Promise.all([db().from('hn_badges').select('id,name,description,category,icon,threshold').eq('active',true).order('sort_order').order('name'),db().from('hn_user_badges').select('badge_id,earned_at').eq('user_id',u.id),db().from('profiles').select('hn_status,role').eq('id',u.id).maybeSingle(),db().from('hn_statuses').select('slug,name,show_on_profile').eq('active',true)]);
 const all=a.data||[],statusMap=Object.fromEntries((sr.data||[]).map(x=>[x.slug,x])),mine=new Map((e.data||[]).map(x=>[x.badge_id,x])),done=all.filter(x=>mine.has(x.id)),pct=all.length?Math.round(done.length/all.length*100):0;
 if(p.data?.role==='admin'){const l=document.getElementById('hnBadgesAdminLink');if(l)l.innerHTML='<a class="button secondary" href="/admin-paspoort">Paspoort beheren</a>'}
 document.getElementById('hnPassportSummary').innerHTML='<div class="summary-box"><div class="summary-item"><div class="summary-label">Badges</div><div class="summary-value">'+done.length+' van '+all.length+' behaald</div></div><div class="summary-item"><div class="summary-label">HN-status</div><div class="summary-value">'+esc(statusMap[p.data?.hn_status]?.name||'Lid')+'</div></div><div class="summary-item" style="grid-column:1/-1"><div class="progressbar"><div class="progressfill" style="width:'+pct+'%"></div></div><div class="muted">'+pct+'% van de beschikbare HN-badges</div></div></div>';
 document.getElementById('hnPassportList').innerHTML=all.length?all.map(b=>'<div class="item" style="display:flex;justify-content:space-between;gap:14px;align-items:center"><div><strong>'+esc(b.icon)+' '+esc(b.name)+'</strong><div class="meta">'+esc(b.category)+' · '+esc(b.description||'')+'</div></div><span class="pill '+(mine.has(b.id)?'verified':'')+'">'+(mine.has(b.id)?'Behaald':'Nog te behalen')+'</span></div>').join(''):'<div class="empty">Er zijn nog geen HN-badges ingesteld.</div>';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();