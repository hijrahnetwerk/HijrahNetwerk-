(function(){
'use strict';
const db=()=>window.hijrahSupabase;
let hnSaveBound=new WeakSet();

async function getUser(){
  const client=db(); if(!client)return null;
  const r=await client.auth.getUser();
  return r.data?.user||null;
}

function buttonFor(container,title,topicId,url,extra){
  if(!container||container.querySelector('.hn-save-personal'))return;
  const b=document.createElement('button');
  b.type='button';
  b.className='button secondary hn-save-personal';
  b.textContent='＋ Opslaan in Mijn HN';
  b.dataset.topicId=topicId||'';
  b.dataset.title=title||'HN-informatie';
  b.dataset.url=url||location.href;
  b.dataset.extra=JSON.stringify(extra||{});
  container.appendChild(b);
  if(!hnSaveBound.has(b)){
    hnSaveBound.add(b);
    b.addEventListener('click',async()=>{
      const user=await getUser();
      if(!user){alert('Log eerst in om informatie op te slaan in Mijn HN.');return;}
      b.disabled=true;b.textContent='Opslaan...';
      const payload={
        user_id:user.id,
        item_type:'place',
        title:b.dataset.title,
        description:'Opgeslagen vanuit Hijrah Navigatie.',
        data:{topic_id:b.dataset.topicId||null,url:b.dataset.url,source:'hn',...(JSON.parse(b.dataset.extra||'{}'))}
      };
      const r=await db().from('hn_personal_items').insert(payload).select().single();
      if(r.error){
        console.error('HN opslaan:',r.error);
        b.disabled=false;b.textContent='＋ Opslaan in Mijn HN';
        alert('Opslaan lukt momenteel niet.');
        return;
      }
      b.textContent='✓ Opgeslagen in Mijn HN';
      b.disabled=true;
    });
  }
}

function scan(){
  document.querySelectorAll('.card').forEach(card=>{
    const link=card.querySelector('a[href*="/fiche/"],a[href*="topic="]');
    if(!link)return;
    const href=link.getAttribute('href')||'';
    const m=href.match(/topic=([^&]+)/);
    const fm=href.match(/\/fiche\/([^/?#]+)/);
    const id=m?decodeURIComponent(m[1]):(fm?decodeURIComponent(fm[1]):'');
    const title=card.querySelector('h2')?.textContent?.trim()||'HN-informatie';
    const actions=card.querySelector('.actions')||card;
    buttonFor(actions,title,id,location.origin+href,{city:card.querySelector('.card-tag')?.textContent||''});
  });

  const hero=document.querySelector('.hero-actions');
  if(hero){
    const title=document.querySelector('h1')?.textContent?.trim()||document.title;
    const id=(location.pathname.match(/^\/fiche\/([^/]+)/)||[])[1]||new URLSearchParams(location.search).get('id')||'';
    buttonFor(hero,title,id,location.href,{type:'fiche'});
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan);else scan();
new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
})();