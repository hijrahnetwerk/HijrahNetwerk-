(function(){
  if(window.hnEditProposalsLoaded)return;
  window.hnEditProposalsLoaded=true;

  const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const db=()=>window.hijrahSupabase;

  function value(v){
    if(Array.isArray(v))return v.map(x=>typeof x==='string'?x:(x.name||x.language||'')).join(', ');
    return String(v==null?'':v);
  }

  async function getTopic(){
    const params=new URLSearchParams(location.search);
    const id=params.get('topic')||params.get('id');
    const slug=location.pathname.match(/^\/fiche\/([^/]+)/)?.[1]||params.get('slug');
    if(!db()||(!id&&!slug))return null;
    let q=db().from('topic').select('id,title,slug,summary,content,card_data,source,source_url');
    if(slug)q=q.eq('slug',decodeURIComponent(slug));else q=q.eq('id',id);
    const r=await q.maybeSingle();
    return r.error?null:r.data;
  }

  function addField(form,id,label,val,wide){
    const wrap=document.createElement('div');
    if(wide)wrap.style.gridColumn='1/-1';
    wrap.innerHTML='<label style="display:block;font-size:12px;margin-bottom:5px;color:#786f66">'+esc(label)+'</label>'+
      (wide?'<textarea id="'+id+'" rows="3" style="width:100%;padding:10px;border:1px solid #e8e1d8;border-radius:9px">'+esc(val)+'</textarea>':
      '<input id="'+id+'" value="'+esc(val)+'" style="width:100%;padding:10px;border:1px solid #e8e1d8;border-radius:9px">');
    form.appendChild(wrap);
  }

  async function mountFiche(topic){
    if(document.getElementById('hn-edit-proposal-card'))return;
    const app=document.getElementById('app');
    if(!app)return;
    const d=topic.card_data&&typeof topic.card_data==='object'?topic.card_data:{};
    const card=document.createElement('details');
    card.id='hn-edit-proposal-card';
    card.className='card';
    card.style.marginTop='18px';
    card.innerHTML='<summary style="cursor:pointer;font-weight:700;color:#4d3819">Aanvullen of corrigeren</summary><div style="padding-top:12px"><p class="card-sub">Vul alleen in wat jij weet. Dit is een bewerkvoorstel voor HN. De originele fiche wordt niet rechtstreeks aangepast.</p><form id="hnEditFicheForm" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px"></form></div>';
    app.appendChild(card);
    const form=card.querySelector('#hnEditFicheForm');
    const fields=[
      ['name','Naam / titel',d.doctor_name||d.full_name],['full_name','Volledige naam',d.full_name],
      ['practice_name','Praktijk / organisatie',d.practice_name],['service_type','Type dienst',d.service_type],
      ['specialization','Specialisatie',d.specialization||d.specialties],['for_children','Voor kinderen',d.for_children],
      ['languages','Talen',value(d.languages)],['phone','Telefoon',d.phone],['email','E-mail',d.email],
      ['website','Website',d.website],['address','Adres',d.address],['neighborhood','Wijk',d.neighborhood],
      ['opening_hours','Openingstijden',d.opening_hours,true],['appointment','Afspraak nodig',d.appointment],
      ['home_visits','Huisbezoeken',d.home_visits],['teleconsultation','Teleconsultatie',d.teleconsultation],
      ['price','Prijs / kosten',d.price],['insurance','Verzekering / CNSS',d.insurance],
      ['emergency','Spoed',d.emergency],['short_description','Korte beschrijving',d.short_description||topic.summary,true]
    ];
    fields.forEach(f=>addField(form,'hn_'+f[0],f[0]==='name'?'Naam / titel':f[1],value(f[2]),!!f[3]));
    const extra=document.createElement('div');extra.style.gridColumn='1/-1';
    extra.innerHTML='<label style="display:block;font-size:12px;margin-bottom:5px;color:#786f66">Wat wil je nog meegeven?</label><textarea id="hn_edit_message" rows="3" style="width:100%;padding:10px;border:1px solid #e8e1d8;border-radius:9px" placeholder="Bron, eigen ervaring of uitleg bij de wijziging"></textarea>';
    form.appendChild(extra);
    const contact=document.createElement('div');contact.style.gridColumn='1/-1';contact.innerHTML='<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px"><input id="hn_edit_name" placeholder="Jouw naam (optioneel)" style="width:100%;padding:10px;border:1px solid #e8e1d8;border-radius:9px"><input id="hn_edit_email" type="email" placeholder="E-mail (optioneel)" style="width:100%;padding:10px;border:1px solid #e8e1d8;border-radius:9px"></div>';
    form.appendChild(contact);
    const actions=document.createElement('div');actions.style.gridColumn='1/-1';actions.innerHTML='<button class="button primary" type="submit">Bewerkvoorstel insturen</button><span id="hn_edit_result" style="margin-left:10px;font-size:12px;color:#786f66"></span>';
    form.appendChild(actions);
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const result=document.getElementById('hn_edit_result');
      const proposed={};
      fields.forEach(f=>{
        const el=document.getElementById('hn_'+f[0]);const v=el?el.value.trim():'';
        const old=value(f[2]).trim();
        if(v&&v!==old)proposed[f[0]==='name'?'full_name':f[0]]=v;
      });
      if(!Object.keys(proposed).length){result.textContent='Vul minstens één nieuwe of gewijzigde waarde in.';return;}
      result.textContent='Versturen...';
      const r=await db().from('hn_edit_proposals').insert({
        topic_id:topic.id,content_type:'fiche',proposed_changes:proposed,
        message:document.getElementById('hn_edit_message').value.trim()||null,
        submitter_name:document.getElementById('hn_edit_name').value.trim()||null,
        submitter_email:document.getElementById('hn_edit_email').value.trim()||null
      });
      result.textContent=r.error?'Versturen mislukt. Probeer opnieuw.':'Ontvangen. HN controleert het voorstel eerst.';
      if(!r.error)form.reset();
    });
  }

  async function mountArticle(topic){
    if(document.getElementById('hn-edit-proposal-article'))return;
    const view=document.getElementById('articleView');
    if(!view||view.style.display==='none')return;
    const details=document.createElement('details');
    details.id='hn-edit-proposal-article';
    details.className='submission-cta';
    details.style.marginTop='20px';
    details.innerHTML='<summary style="cursor:pointer;font-weight:700;color:#fff">Artikel aanvullen of corrigeren</summary><div style="padding-top:14px"><p>Weet jij iets dat ontbreekt of veranderd is? Dien een bewerkvoorstel in. Het huidige HN-artikel blijft staan tot HN het voorstel heeft gecontroleerd.</p><form id="hnEditArticleForm" style="display:grid;gap:10px"><input id="hn_article_title" placeholder="Titel" value="'+esc(topic.title||'')+'" style="padding:10px;border-radius:9px;border:1px solid #e8e1d8"><input id="hn_article_summary" placeholder="Korte samenvatting" value="'+esc(topic.summary||'')+'" style="padding:10px;border-radius:9px;border:1px solid #e8e1d8"><textarea id="hn_article_content" rows="8" placeholder="Aanvulling of voorgestelde aangepaste tekst" style="padding:10px;border-radius:9px;border:1px solid #e8e1d8">'+esc(topic.content||'')+'</textarea><input id="hn_article_source" placeholder="Bron" value="'+esc(topic.source||'')+'" style="padding:10px;border-radius:9px;border:1px solid #e8e1d8"><input id="hn_article_url" placeholder="Bronlink" value="'+esc(topic.source_url||'')+'" style="padding:10px;border-radius:9px;border:1px solid #e8e1d8"><textarea id="hn_article_message" rows="3" placeholder="Wat is er volgens jou veranderd of toegevoegd?" style="padding:10px;border-radius:9px;border:1px solid #e8e1d8"></textarea><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><input id="hn_article_name" placeholder="Jouw naam (optioneel)" style="padding:10px;border-radius:9px;border:1px solid #e8e1d8"><input id="hn_article_email" type="email" placeholder="E-mail (optioneel)" style="padding:10px;border-radius:9px;border:1px solid #e8e1d8"></div><div><button class="btn btn-primary" type="submit">Bewerkvoorstel insturen</button><span id="hn_article_result" style="margin-left:10px;font-size:12px"></span></div></form></div>';
    const bottom=view.querySelector('.article-bottom');
    view.insertBefore(details,bottom||null);
    details.querySelector('#hnEditArticleForm').addEventListener('submit',async e=>{
      e.preventDefault();
      const result=document.getElementById('hn_article_result');result.textContent='Versturen...';
      const changes={title:document.getElementById('hn_article_title').value.trim(),summary:document.getElementById('hn_article_summary').value.trim(),content:document.getElementById('hn_article_content').value.trim(),source:document.getElementById('hn_article_source').value.trim(),source_url:document.getElementById('hn_article_url').value.trim()};
      const r=await db().from('hn_edit_proposals').insert({topic_id:topic.id,content_type:'article',proposed_changes:changes,message:document.getElementById('hn_article_message').value.trim()||null,submitter_name:document.getElementById('hn_article_name').value.trim()||null,submitter_email:document.getElementById('hn_article_email').value.trim()||null});
      result.textContent=r.error?'Versturen mislukt. Probeer opnieuw.':'Ontvangen. HN controleert het voorstel eerst.';
      if(!r.error)e.target.reset();
    });
  }

  async function run(){
    let tries=0;
    while(!db()&&tries++<100)await new Promise(r=>setTimeout(r,100));
    if(!db())return;
    const topic=await getTopic();
    if(!topic)return;
    if(location.pathname.includes('/fiche'))return setTimeout(()=>mountFiche(topic),300);
    if(location.pathname.includes('/kennisbank')) {
      const wait=setInterval(()=>{
        if(document.getElementById('articleView')?.style.display==='block'){clearInterval(wait);mountArticle(topic);}
      },250);
      setTimeout(()=>clearInterval(wait),15000);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();