/* Admin beheer voor de HijrahTools-catalogus. */
(function(){
  'use strict';
  var client=window.hijrahSupabase;
  var $=function(s,r){return (r||document).querySelector(s);};
  var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  var table=$('#toolCatalogTable'), msg=$('#toolCatalogMessage');
  if(!table||!msg)return;
  function message(text,error){
    msg.textContent=text;msg.className='message show '+(error?'error':'success');
  }
  function render(rows){
    if(!rows||!rows.length){table.innerHTML='<tr><td colspan="7" class="empty">Geen tools gevonden. Controleer of de HijrahTools-migratie is uitgevoerd.</td></tr>';return;}
    table.innerHTML=rows.map(function(r){
      return '<tr data-tool-row="'+esc(r.slug)+'">'+
        '<td><input data-field="title" aria-label="Naam van '+esc(r.slug)+'" value="'+esc(r.title)+'" maxlength="140"></td>'+
        '<td><textarea data-field="description" aria-label="Omschrijving van '+esc(r.slug)+'" rows="3" maxlength="1000">'+esc(r.description)+'</textarea><div class="hint">Sleutel: '+esc(r.slug)+'</div></td>'+
        '<td><input data-field="phase" aria-label="Fase van '+esc(r.slug)+'" value="'+esc(r.phase)+'" maxlength="80"></td>'+
        '<td><select data-field="status" aria-label="Status van '+esc(r.slug)+'">'+
          '<option value="beschikbaar"'+(r.status==='beschikbaar'?' selected':'')+'>Beschikbaar</option>'+
          '<option value="beta"'+(r.status==='beta'?' selected':'')+'>Bèta</option>'+
          '<option value="onderhoud"'+(r.status==='onderhoud'?' selected':'')+'>Onderhoud</option></select></td>'+
        '<td><label class="checkbox"><input data-field="is_active" type="checkbox"'+(r.is_active?' checked':'')+'> Zichtbaar</label></td>'+
        '<td><input data-field="sort_order" type="number" min="0" step="1" value="'+Number(r.sort_order||0)+'" aria-label="Volgorde van '+esc(r.slug)+'"></td>'+
        '<td><button type="button" class="button button-primary" data-save-tool="'+esc(r.slug)+'">Opslaan</button></td>'+
        '</tr>';
    }).join('');
  }
  async function verifyAdmin(){
    if(!client||!client.auth){message('Supabase is niet beschikbaar. Controleer de configuratie.',true);return false;}
    var session=await client.auth.getSession();
    var user=session.data&&session.data.session&&session.data.session.user;
    if(!user){message('Log in met een HN-beheerdersaccount om deze instellingen te beheren.',true);return false;}
    var profile=await client.from('profiles').select('role').eq('id',user.id).maybeSingle();
    if(profile.error||!profile.data||profile.data.role!=='admin'){message('Alleen HN-beheerders kunnen de toolcatalogus aanpassen.',true);return false;}
    return true;
  }
  async function load(){
    table.innerHTML='<tr><td colspan="7" class="loading">Catalogus laden…</td></tr>';
    if(!await verifyAdmin())return;
    var res=await client.from('hn_tool_catalog').select('slug,title,description,phase,status,is_active,sort_order').order('sort_order',{ascending:true});
    if(res.error){table.innerHTML='<tr><td colspan="7" class="empty">De catalogus kon niet worden geladen. Controleer of de migratie is uitgevoerd en probeer opnieuw.</td></tr>';message('Laden mislukt: '+res.error.message,true);return;}
    render(res.data||[]);
    message('Catalogus geladen. Wijzigingen zijn pas actief voor leden nadat je op Opslaan klikt.',false);
  }
  async function save(slug,button){
    var row=$('tr[data-tool-row="'+CSS.escape(slug)+'"]',table);
    if(!row)return;
    var get=function(k){return $('[data-field="'+k+'"]',row);};
    var title=get('title').value.trim(),description=get('description').value.trim(),phase=get('phase').value.trim();
    var status=get('status').value,active=get('is_active').checked,order=Number(get('sort_order').value||0);
    if(!title||!description||!phase){message('Vul naam, omschrijving en fase in voor '+slug+'.',true);return;}
    button.disabled=true;button.textContent='Opslaan…';
    var res=await client.from('hn_tool_catalog').update({
      title:title,description:description,phase:phase,status:status,is_active:active,sort_order:Math.max(0,Math.floor(order)),updated_at:new Date().toISOString()
    }).eq('slug',slug);
    button.disabled=false;button.textContent='Opslaan';
    if(res.error){message('Opslaan mislukt voor '+slug+': '+res.error.message,true);return;}
    message('Instellingen opgeslagen voor '+title+'.',false);
  }
  table.addEventListener('click',function(e){
    var btn=e.target.closest('[data-save-tool]');
    if(btn)save(btn.getAttribute('data-save-tool'),btn);
  });
  var reload=$('#toolCatalogReload');if(reload)reload.addEventListener('click',load);
  load();
})();