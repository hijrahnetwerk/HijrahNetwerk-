/* HN public-site upgrade.
   Add this script AFTER the existing Supabase/auth scripts on index.html.
   It turns prototype homepage elements into live Supabase-backed UI without replacing the design. */
(function(){
  const db=()=>window.hijrahSupabase;
  if(!db)return;
  const esc=v=>v==null?'':String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  async function load(){
    const [co,ci,ca,sc,top]=await Promise.all([
      db().from('countries').select('id,name,slug,description,is_active').eq('is_active',true).order('name'),
      db().from('cities').select('id,name,slug,country_id,is_active').eq('is_active',true).order('name'),
      db().from('categories').select('id,name,slug,description,is_active,sort_order').eq('is_active',true).order('sort_order').order('name'),
      db().from('subcategories').select('id,name,category_id,is_active').eq('is_active',true).order('sort_order').order('name'),
      db().from('topic').select('id,title,slug,summary,information_type,updated_at,country_id,city_id,category_id,categories(name),countries(name),cities(name)').eq('published',true).order('updated_at',{ascending:false}).limit(12)
    ]);

    for(const r of [co,ci,ca,sc,top]){
      if(r.error) throw r.error;
    }

    const countries=co.data||[];
    const cities=ci.data||[];
    const cats=ca.data||[];
    const topics=top.data||[];

    const countryGrid=document.querySelector('[data-source="countries"]');

    if(countryGrid){
      countryGrid.innerHTML=countries.map(c=>{
        const count=cities.filter(x=>x.country_id===c.id).length;

        return `
          <article class="card country-card">
            <div class="country-media">
              <span class="flag-emoji">✈</span>
              <span class="city-count">${count} ${count===1?'stad':'steden'}</span>
            </div>
            <div class="country-body">
              <h3>${esc(c.name)}</h3>
              <p>${esc(c.description||'Praktische HN-informatie en kennis uit de database.')}</p>
              <div class="country-footer">
                <span class="badge">${count?'Beschikbaar':'Binnenkort'}</span>
                <a href="kennisbank.html?country=${encodeURIComponent(c.id)}" class="country-link">
                  Bekijk land →
                </a>
              </div>
            </div>
          </article>
        `;
      }).join('') || '<p class="demo-note">Nog geen actieve landen.</p>';
    }

    const note=document.querySelector('.demo-note');
    if(note) note.remove();

    const counts=document.querySelector('.hero-preview');

    if(counts){
      const nums=counts.querySelectorAll('.num');

      if(nums[0]) nums[0].textContent=countries.length+'+';
      if(nums[1]) nums[1].textContent=cities.length+'+';
      if(nums[2]) nums[2].textContent=cats.length;
      if(nums[3]) nums[3].textContent=topics.length+'+';
    }

    const kb=document.querySelector('[data-source="knowledge-categories"]');

    if(kb){
      const categoryCounts=new Map(cats.map(c=>[c.id,0]));

      topics.forEach(t=>{
        categoryCounts.set(
          t.category_id,
          (categoryCounts.get(t.category_id)||0)+1
        );
      });

      kb.innerHTML=cats.slice(0,6).map(c=>`
        <div class="card kb-card">
          <div class="kb-icon">✓</div>
          <div>
            <h4>${esc(c.name)}</h4>
            <p>${esc(c.description||'Praktische HN-informatie per onderwerp.')}</p>
            <span class="count">${categoryCounts.get(c.id)||0} artikelen</span>
          </div>
        </div>
      `).join('') || '<p class="demo-note">Nog geen actieve categorieën.</p>';
    }

    const preview=document.querySelector('.kb-article-preview');

    if(preview&&topics[0]){
      const t=topics[0];

      const tags=preview.querySelector('.tag-row');
      if(tags){
        tags.innerHTML=`
          <span class="badge">${esc(t.categories?.name||'Kennisbank')}</span>
          <span class="badge">${esc(t.cities?.name||t.countries?.name||'HN')}</span>
        `;
      }

      const h=preview.querySelector('h4');
      if(h) h.textContent=t.title;

      const p=preview.querySelector('p');
      if(p) p.textContent=t.summary||'';

      const a=preview.querySelector('a');
      if(a) a.href='kennisbank.html?topic='+encodeURIComponent(t.id);
    }

    const search=document.querySelector('[data-search-source="global"]');

    if(search){
      const form=search.closest('form');

      if(form){
        form.onsubmit=e=>{
          e.preventDefault();
          location.href='kennisbank.html?q='+encodeURIComponent(search.value.trim());
        };
      }

      document.querySelectorAll('.search-chips .chip').forEach(b=>{
        b.onclick=()=>{
          location.href='kennisbank.html?q='+encodeURIComponent(b.textContent.trim());
        };
      });
    }

    document.querySelectorAll('a').forEach(a=>{
      if(a.textContent.trim()==='Start de Smart Search'){
        a.href='smart-search.html';
      }
    });

    const newsletter=document.querySelector('[data-integration="email-service-placeholder"]');

    if(newsletter){
      newsletter.onsubmit=function(e){
        e.preventDefault();
        window.location.href='/ontdek-de-nieuwe-hijrah-navigatie/';
      };
    }
  }

  document.addEventListener(
    'DOMContentLoaded',
    ()=>load().catch(e=>console.error('HN public site:',e))
  );
})();
