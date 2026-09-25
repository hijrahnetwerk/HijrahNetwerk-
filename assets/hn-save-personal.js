(function(){
'use strict';

const db=()=>window.hijrahSupabase;
const bound=new WeakSet();

async function getUser(){
  const client=db();
  if(!client)return null;
  const r=await client.auth.getUser();
  return r.data?.user||null;
}

function safeExtra(value){
  try{return JSON.parse(value||'{}')||{};}
  catch{return {};}
}

async function findSaved(user,topicId,url,title){
  const client=db();
  if(!client||!user)return null;

  const candidates=[];
  if(topicId){
    const r=await client
      .from('hn_personal_items')
      .select('id,title,data')
      .eq('user_id',user.id)
      .eq('item_type','place')
      .contains('data',{topic_id:topicId})
      .limit(1)
      .maybeSingle();
    if(!r.error&&r.data)return r.data;
  }

  if(url){
    const r=await client
      .from('hn_personal_items')
      .select('id,title,data')
      .eq('user_id',user.id)
      .eq('item_type','place')
      .contains('data',{url})
      .limit(1)
      .maybeSingle();
    if(!r.error&&r.data)return r.data;
  }

  if(title){
    const r=await client
      .from('hn_personal_items')
      .select('id,title,data')
      .eq('user_id',user.id)
      .eq('item_type','place')
      .eq('title',title)
      .limit(1)
      .maybeSingle();
    if(!r.error&&r.data)return r.data;
  }

  return candidates[0]||null;
}

async function syncButton(button){
  const user=await getUser();
  if(!user)return;

  const saved=await findSaved(
    user,
    button.dataset.topicId||'',
    button.dataset.url||'',
    button.dataset.title||''
  );

  button.dataset.savedId=saved?.id||'';
  button.classList.toggle('hn-saved',!!saved);
  button.textContent=saved?'✓ Opgeslagen in Mijn HN':'＋ Opslaan in Mijn HN';
  button.disabled=false;
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

  if(!bound.has(b)){
    bound.add(b);

    b.addEventListener('click',async()=>{
      const user=await getUser();

      if(!user){
        alert('Log eerst in om informatie op te slaan in Mijn HN.');
        return;
      }

      const savedId=b.dataset.savedId||'';

      b.disabled=true;

      if(savedId){
        b.textContent='Verwijderen...';

        const r=await db()
          .from('hn_personal_items')
          .delete()
          .eq('id',savedId)
          .eq('user_id',user.id);

        if(r.error){
          console.error('HN verwijderen:',r.error);
          b.disabled=false;
          b.textContent='✓ Opgeslagen in Mijn HN';
          alert('Verwijderen lukt momenteel niet.');
          return;
        }

        b.dataset.savedId='';
        b.classList.remove('hn-saved');
        b.disabled=false;
        b.textContent='＋ Opslaan in Mijn HN';
        return;
      }

      b.textContent='Opslaan...';

      const extra=safeExtra(b.dataset.extra);

      const payload={
        user_id:user.id,
        item_type:'place',
        title:b.dataset.title,
        description:'Opgeslagen vanuit Hijrah Navigatie.',
        data:{
          topic_id:b.dataset.topicId||null,
          url:b.dataset.url,
          source:'hn',
          ...extra
        }
      };

      const existing=await findSaved(
        user,
        payload.data.topic_id||'',
        payload.data.url||'',
        payload.title||''
      );

      if(existing){
        b.dataset.savedId=existing.id;
        b.classList.add('hn-saved');
        b.disabled=false;
        b.textContent='✓ Opgeslagen in Mijn HN';
        return;
      }

      const r=await db()
        .from('hn_personal_items')
        .insert(payload)
        .select()
        .single();

      if(r.error){
        console.error('HN opslaan:',r.error);
        b.disabled=false;
        b.textContent='＋ Opslaan in Mijn HN';
        alert('Opslaan lukt momenteel niet.');
        return;
      }

      b.dataset.savedId=r.data?.id||'';
      b.classList.add('hn-saved');
      b.disabled=false;
      b.textContent='✓ Opgeslagen in Mijn HN';
    });
  }

  syncButton(b);
}

function scan(){
  document.querySelectorAll('.card').forEach(card=>{
    const link=card.querySelector('a[href*='/locaties/'],a[href*="topic="]');
    if(!link)return;

    const href=link.getAttribute('href')||'';
    const m=href.match(/topic=([^&]+)/);
    const fm=href.match(/\/fiche\/([^/?#]+)/);
    const id=m?decodeURIComponent(m[1]):(fm?decodeURIComponent(fm[1]):'');
    const title=card.querySelector('h2')?.textContent?.trim()||'HN-informatie';
    const actions=card.querySelector('.actions')||card;

    buttonFor(
      actions,
      title,
      id,
      new URL(href,location.origin).href,
      {city:card.querySelector('.card-tag')?.textContent||''}
    );
  });

  const hero=document.querySelector('.hero-actions');

  if(hero){
    const title=document.querySelector('h1')?.textContent?.trim()||document.title;
    const id=(location.pathname.match(/^\/fiche\/([^/]+)/)||[])[1]||
      new URLSearchParams(location.search).get('id')||'';

    buttonFor(hero,title,id,location.href,{type:'fiche'});
  }
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',scan);
}else{
  scan();
}

new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
})();