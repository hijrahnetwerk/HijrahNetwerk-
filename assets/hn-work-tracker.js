/* HN Werkuren Tracker */
(function(){
  'use strict';
  const db=()=>window.hijrahSupabase;
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  let user=null,active=null,sessions=[],timer=null;

  const areas=['Algemeen HN','Mijn Hijrah','Hijrah Navigatie','Kennisbank','HN-kaart','Community','Smart Search','Admin','Techniek / bugs','Content / onderzoek'];

  async function init(){
    if(!db()||!location.pathname.includes('dashboard'))return;
    const r=await db().auth.getUser(); user=r.data?.user||null;
    if(!user)return;
    await load();
    mount();
    refreshTimer();
    timer=setInterval(refreshTimer,1000);
  }

  async function load(){
    const r=await db().from('hn_work_sessions').select('*').eq('user_id',user.id).order('started_at',{ascending:false}).limit(100);
    if(!r.error){
      sessions=r.data||[];
      active=sessions.find(x=>x.status==='running'||x.status==='paused')||null;
    }
  }

  function fmt(sec){
    sec=Math.max(0,Math.floor(sec||0));
    const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;
    return [h,m,s].map((x,i)=>i===0?String(x).padStart(2,'0'):String(x).padStart(2,'0')).join(':');
  }
  function duration(s){
    if(!s)return 0;
    if(s.duration_seconds!=null)return s.duration_seconds;
    const end=s.ended_at?new Date(s.ended_at).getTime():Date.now();
    const pause=s.paused_seconds||0;
    const pausedNow=s.status==='paused'&&s.paused_at?Math.max(0,(Date.now()-new Date(s.paused_at).getTime())/1000):0;
    return Math.max(0,(end-new Date(s.started_at).getTime())/1000-pause-pausedNow);
  }
  function total(filter){
    return sessions.filter(filter).reduce((a,s)=>a+duration(s),0);
  }
  function today(s){return new Date(s.started_at).toDateString()===new Date().toDateString()}
  function week(s){
    const d=new Date(), day=(d.getDay()+6)%7, start=new Date(d); start.setHours(0,0,0,0); start.setDate(d.getDate()-day);
    return new Date(s.started_at)>=start;
  }
  function month(s){const d=new Date(),x=new Date(s.started_at);return x.getFullYear()===d.getFullYear()&&x.getMonth()===d.getMonth()}

  function mount(){
    if(document.getElementById('hnWorkTracker'))return;
    const anchor=document.querySelector('#tab-home')||document.querySelector('main');
    if(!anchor)return;
    const box=document.createElement('section'); box.id='hnWorkTracker';
    box.innerHTML='<style>'+
      '#hnWorkTracker{margin:22px 0}.hwt{border:1px solid #e8e0d6;border-radius:14px;background:#fff;padding:20px}.hwt h2{margin:0 0 6px;color:#684a25;font-size:20px}.hwt-muted{color:#756d63;font-size:13px}.hwt-timer{font-size:42px;font-weight:700;color:#684a25;letter-spacing:1px;margin:14px 0}.hwt-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.hwt input,.hwt select{border:1px solid #e8e0d6;border-radius:8px;padding:10px;font:inherit}.hwt input{min-width:180px}.hwt-btn{border:0;border-radius:8px;padding:10px 14px;cursor:pointer;background:#df842c;color:#fff}.hwt-btn.alt{background:#f1ece5;color:#684a25}.hwt-btn.stop{background:#a63b3b}.hwt-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}.hwt-stat{background:#faf8f5;border:1px solid #e8e0d6;border-radius:10px;padding:12px}.hwt-stat b{display:block;font-size:20px;color:#684a25;margin-top:4px}.hwt-list{display:grid;gap:8px;margin-top:14px}.hwt-item{border:1px solid #e8e0d6;border-radius:10px;padding:12px}.hwt-head{display:flex;justify-content:space-between;gap:10px}.hwt-small{font-size:12px;color:#756d63}.hwt-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}@media(max-width:700px){.hwt-stats{grid-template-columns:1fr 1fr}.hwt-timer{font-size:34px}}'+
      '</style>'+
      '<div class="hwt">'+
      '<h2>HN Werkuren</h2>'+
      '<div class="hwt-muted">Houd objectief bij hoeveel tijd je in HN steekt en wat je in die tijd hebt gedaan.</div>'+
      '<div id="hwtTimer" class="hwt-timer">00:00:00</div>'+
      '<div class="hwt-row"><select id="hwtArea">'+areas.map(x=>'<option>'+esc(x)+'</option>').join('')+'</select><input id="hwtDescription" placeholder="Waar werk je nu aan?"><button id="hwtStart" class="hwt-btn">Start werk</button><button id="hwtPause" class="hwt-btn alt">Pauze</button><button id="hwtStop" class="hwt-btn stop">Stop</button></div>'+
      '<div id="hwtResultRow" class="hwt-row" style="margin-top:8px;display:none"><input id="hwtResult" style="flex:1" placeholder="Wat heb je bereikt of aangepast?"><button id="hwtSaveResult" class="hwt-btn">Opslaan</button></div>'+
      '<div class="hwt-stats"><div class="hwt-stat"><span class="hwt-muted">Vandaag</span><b id="hwtToday">0u</b></div><div class="hwt-stat"><span class="hwt-muted">Deze week</span><b id="hwtWeek">0u</b></div><div class="hwt-stat"><span class="hwt-muted">Deze maand</span><b id="hwtMonth">0u</b></div><div class="hwt-stat"><span class="hwt-muted">HN totaal</span><b id="hwtTotal">0u</b></div></div>'+
      '<div class="hwt-actions"><button id="hwtManual" class="hwt-btn alt">Werkuren handmatig toevoegen</button><button id="hwtExport" class="hwt-btn alt">Exporteer CSV</button></div>'+
      '<div id="hwtManualForm" style="display:none;margin-top:12px"><div class="hwt-row"><input id="hwtManualDate" type="date"><input id="hwtManualHours" type="number" min="0" step="0.25" placeholder="Uren"><select id="hwtManualArea">'+areas.map(x=>'<option>'+esc(x)+'</option>').join('')+'</select><input id="hwtManualDesc" placeholder="Wat heb je gedaan?"><input id="hwtManualResult" placeholder="Resultaat"></div><button id="hwtManualSave" class="hwt-btn" style="margin-top:8px">Toevoegen</button></div>'+
      '<div id="hwtList" class="hwt-list"></div></div>';
    anchor.insertBefore(box,anchor.firstChild);
    $('hwtStart').onclick=start;
    $('hwtPause').onclick=pauseResume;
    $('hwtStop').onclick=stop;
    $('hwtSaveResult').onclick=saveResult;
    $('hwtManual').onclick=()=>{$('hwtManualForm').style.display=$('hwtManualForm').style.display==='none'?'block':'none'};
    $('hwtManualSave').onclick=manualSave;
    $('hwtExport').onclick=exportCsv;
    render();
  }
  const $=id=>document.getElementById(id);

  function refreshTimer(){
    if(!active)return;
    $('hwtTimer').textContent=fmt(duration(active));
    $('hwtPause').textContent=active.status==='paused'?'Hervatten':'Pauze';
    $('hwtStart').disabled=true;
    $('hwtStop').disabled=false;
  }
  async function start(){
    if(active)return;
    const r=await db().from('hn_work_sessions').insert({user_id:user.id,status:'running',area:$('hwtArea').value,description:$('hwtDescription').value.trim()||null}).select().single();
    if(r.error){alert(r.error.message);return}
    active=r.data;sessions.unshift(active);render();
  }
  async function pauseResume(){
    if(!active)return;
    if(active.status==='running'){
      const r=await db().from('hn_work_sessions').update({status:'paused',paused_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',active.id).eq('user_id',user.id);
      if(!r.error){active.status='paused';active.paused_at=new Date().toISOString();render()}
    }else{
      const now=Date.now(),p=active.paused_at?Math.max(0,(now-new Date(active.paused_at).getTime())/1000):0;
      const r=await db().from('hn_work_sessions').update({status:'running',paused_at:null,paused_seconds:Math.round((active.paused_seconds||0)+p),updated_at:new Date().toISOString()}).eq('id',active.id).eq('user_id',user.id);
      if(!r.error){active.status='running';active.paused_seconds=Math.round((active.paused_seconds||0)+p);active.paused_at=null;render()}
    }
  }
  async function stop(){
    if(!active)return;
    const end=new Date();
    const pausedExtra=active.status==='paused'&&active.paused_at?Math.max(0,(end.getTime()-new Date(active.paused_at).getTime())/1000):0;
    const pausedTotal=(active.paused_seconds||0)+pausedExtra;
    const dur=Math.max(0,Math.round((end.getTime()-new Date(active.started_at).getTime())/1000-pausedTotal));
    const r=await db().from('hn_work_sessions').update({status:'completed',ended_at:end.toISOString(),paused_at:null,paused_seconds:Math.round(pausedTotal),duration_seconds:dur,updated_at:end.toISOString()}).eq('id',active.id).eq('user_id',user.id);
    if(r.error){alert(r.error.message);return}
    active={...active,status:'completed',ended_at:end.toISOString(),duration_seconds:dur,paused_seconds:Math.round(pausedTotal),paused_at:null}; active=null;
    $('hwtResultRow').style.display='flex'; render(); await load(); render();
  }
  async function saveResult(){
    const item=sessions.find(x=>x.id===active?.id);
    const last=sessions.find(x=>x.status==='completed'&&!x.result&&(!$('hwtResult').value.trim()?false:true));
    const target=last||sessions.find(x=>x.status==='completed'&&x.result==null);
    if(!target)return;
    const r=await db().from('hn_work_sessions').update({result:$('hwtResult').value.trim()||null,updated_at:new Date().toISOString()}).eq('id',target.id).eq('user_id',user.id);
    if(!r.error){$('hwtResult').value='';$('hwtResultRow').style.display='none';await load();render()}
  }
  async function manualSave(){
    const date=$('hwtManualDate').value||new Date().toISOString().slice(0,10), hours=Number($('hwtManualHours').value||0);
    if(hours<=0)return;
    const start=new Date(date+'T09:00:00'), dur=Math.round(hours*3600), end=new Date(start.getTime()+dur);
    const r=await db().from('hn_work_sessions').insert({user_id:user.id,started_at:start.toISOString(),ended_at:end.toISOString(),duration_seconds:dur,status:'completed',area:$('hwtManualArea').value,description:$('hwtManualDesc').value.trim()||null,result:$('hwtManualResult').value.trim()||null}).select().single();
    if(!r.error){sessions.unshift(r.data);$('hwtManualHours').value='';$('hwtManualDesc').value='';$('hwtManualResult').value='';render()}
  }
  function pretty(sec){const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60);return h+'u '+String(m).padStart(2,'0')+'m'}
  function render(){
    if(!document.getElementById('hwtTimer'))return;
    if(active){$('hwtTimer').textContent=fmt(duration(active));$('hwtPause').textContent=active.status==='paused'?'Hervatten':'Pauze';$('hwtStart').disabled=true;$('hwtStop').disabled=false}
    else{$('hwtTimer').textContent='00:00:00';$('hwtStart').disabled=false;$('hwtStop').disabled=true;$('hwtPause').disabled=true}
    $('hwtPause').disabled=!active;
    $('hwtToday').textContent=pretty(total(today));
    $('hwtWeek').textContent=pretty(total(week));
    $('hwtMonth').textContent=pretty(total(month));
    $('hwtTotal').textContent=pretty(total(()=>true));
    $('hwtList').innerHTML=sessions.slice(0,20).map(s=>'<div class="hwt-item"><div class="hwt-head"><strong>'+esc(s.area||'Algemeen HN')+'</strong><strong>'+pretty(duration(s))+'</strong></div><div class="hwt-small">'+new Date(s.started_at).toLocaleString('nl-NL')+(s.status==='running'?' · Bezig':s.status==='paused'?' · Gepauzeerd':'')+'</div>'+(s.description?'<div style="margin-top:7px">'+esc(s.description)+'</div>':'')+(s.result?'<div class="hwt-small" style="margin-top:5px">Resultaat: '+esc(s.result)+'</div>':'')+'</div>').join('')||'<div class="hwt-muted">Nog geen werkuren geregistreerd.</div>';
  }
  function exportCsv(){
    const rows=[['Datum','Duur','Onderdeel','Werk','Resultaat'],...sessions.filter(s=>s.status==='completed').map(s=>[new Date(s.started_at).toLocaleString('nl-NL'),pretty(duration(s)),s.area||'',s.description||'',s.result||''])];
    const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='hn-werkuren.csv';a.click();URL.revokeObjectURL(a.href);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();