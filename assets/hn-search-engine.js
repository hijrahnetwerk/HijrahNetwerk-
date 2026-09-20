/* HN Search Engine
   Herkent zoektaal zonder AI en zonder antwoorden te verzinnen.
   De database blijft de bron van waarheid.
*/
(function(){
  const STOP = new Set([
    'ik','zoek','een','de','het','in','op','voor','naar','met','van','mijn','wat',
    'waar','kan','kun','wil','graag','informatie','over','is','zijn','er','dit','die',
    'dat','een','the','a','an','and','of','to','for','in','je','jouw','mij'
  ]);

  const GROUPS = [
    ['huisarts','dokter','arts','médecin','medecin','generaliste','generaliste'],
    ['ziekenhuis','hospital','hôpital','hopital'],
    ['apotheek','pharmacie','pharmacy'],
    ['school','scholen','école','ecole'],
    ['universiteit','université','universite','university'],
    ['woning','huisvesting','huur','huren','appartement','appartementen','logement','location'],
    ['wijk','buurt','quartier','neighborhood'],
    ['werk','werkgelegenheid','baan','banen','emploi','travail'],
    ['verblijfsvergunning','residentie','residence','titre de séjour','titre de sejour','visum','visa'],
    ['zorg','gezondheidszorg','santé','sante'],
    ['moskee','moskeeën','mosque','mosquée','mosquee'],
    ['kinderen','kind','enfants','enfant'],
    ['tandarts','dentist','dentiste'],
    ['apotheek','pharmacie','pharmacy']
  ];

  const normalize = value => String(value||'')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();

  const groupMap = new Map();
  GROUPS.forEach(group=>{
    const id=normalize(group[0]);
    group.forEach(term=>groupMap.set(normalize(term),id));
  });

  function tokens(query){
    return normalize(query).split(' ').filter(Boolean);
  }

  function concepts(query){
    return tokens(query)
      .filter(t=>!STOP.has(t))
      .map(t=>groupMap.get(t)||t);
  }

  function fieldText(topic){
    const d=topic.card_data && typeof topic.card_data==='object' ? topic.card_data : {};
    return [
      topic.title, topic.summary, topic.content, topic.information_type,
      topic.countries?.name, topic.cities?.name, topic.categories?.name,
      topic.subcategories?.name, topic.neighborhood,
      d.address,d.neighborhood,d.service_type,d.languages,d.warning,
      d.short_description,d.phone,d.website
    ].filter(Boolean).join(' ');
  }

  function score(topic,query,extraTerms){
    const raw=normalize(query);
    const qs=tokens(query).filter(t=>!STOP.has(t));
    const cs=concepts(query);
    if(!qs.length)return 0;

    const fields=[
      [topic.title,12],[topic.cities?.name,10],[topic.countries?.name,9],
      [topic.categories?.name,8],[topic.subcategories?.name,7],
      [topic.neighborhood,7],[topic.summary,5],[topic.information_type,3],
      [topic.content,1], [fieldText(topic),1]
    ];
    let total=0;

    qs.forEach(q=>{
      fields.forEach(([value,weight])=>{
        const n=normalize(value);
        if(n===q) total+=weight*2;
        else if(n.includes(q)) total+=weight;
      });
    });

    cs.forEach(concept=>{
      fields.forEach(([value,weight])=>{
        const n=normalize(value);
        if(n.includes(concept)) total+=Math.max(2,Math.round(weight*.7));
      });
    });

    if(extraTerms){
      extraTerms.forEach(t=>{
        if(t.topic_id!==topic.id)return;
        const n=normalize(t.term);
        qs.forEach(q=>{
          if(n===q) total+=9;
          else if(n.includes(q)||q.includes(n)) total+=5;
        });
      });
    }

    return total;
  }

  async function loadTerms(db){
    try{
      const r=await db().from('topic_search_terms')
        .select('topic_id,term,normalized_term')
        .limit(5000);
      return r.error ? [] : (r.data||[]);
    }catch(e){return []}
  }

  async function logSearch(db,query,resultCount){
    if(!query || !db())return;
    try{
      const normalizedQuery=normalize(query).slice(0,240);
      await db().rpc('log_hn_search_event',{
        p_query:String(query).trim().slice(0,240),
        p_normalized_query:normalizedQuery,
        p_result_count:Math.max(0,Math.min(10000,resultCount||0)),
        p_clicked_topic_id:null,
        p_event_type:'search'
      });
    }catch(e){
      console.debug('HN search analytics unavailable',e);
    }
  }

  async function logClick(db,query,topicId){
    if(!query || !topicId || !db())return;
    try{
      await db().rpc('log_hn_search_event',{
        p_query:String(query).trim().slice(0,240),
        p_normalized_query:normalize(query).slice(0,240),
        p_result_count:0,
        p_clicked_topic_id:topicId,
        p_event_type:'click'
      });
    }catch(e){
      console.debug('HN click analytics unavailable',e);
    }
  }

  window.HNSearchEngine={normalize,tokens,concepts,score,loadTerms,logSearch,logClick};
})();
