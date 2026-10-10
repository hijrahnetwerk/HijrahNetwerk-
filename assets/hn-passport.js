(function(){'use strict';
const db=()=>window.hijrahSupabase;
async function init(){
 if(!db()||!location.pathname.match(/dashboard(?:\.html)?$/))return;
 const {data}=await db().auth.getUser(),u=data?.user;
 if(!u)return;
 const tabs=document.querySelector('.tabs');
 if(!tabs||document.getElementById('tab-passport'))return;
 const t=document.createElement('button');
 t.className='tab';t.type='button';t.textContent='Mijn Badges';
 const v=document.createElement('div');
 v.className='tabview';v.id='tab-passport';
 v.innerHTML='<h2>Mijn Badges</h2><p class="muted">Bekijk je behaalde stempels, voorwaarden en welke onderdelen je ermee kunt ontgrendelen.</p><p><a class="button secondary" href="/mijn-badges">Mijn Badges bekijken</a></p>';
 tabs.appendChild(t);
 document.querySelector('#tab-profile')?.parentNode?.appendChild(v);
 t.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.tabview').forEach(x=>x.classList.remove('active'));
  t.classList.add('active');v.classList.add('active');
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();