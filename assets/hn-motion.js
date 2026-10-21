(function(){
'use strict';
if(window.__HN_MOTION__)return;window.__HN_MOTION__=true;
const reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const isAdmin=()=>/^\/admin(?:[-/]|$)/.test(location.pathname)||!!document.querySelector('.admin-shell,.admin-sidebar,.admin-layout,[data-hn-admin="true"]');
function visible(el){return !!(el&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden')}
function focusables(root){return Array.from(root.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(visible)}
function closeLayer(layer){
  if(!layer)return;
  if(layer.matches('dialog[open]')){layer.close();return}
  layer.classList.remove('is-open','open','show');
  layer.setAttribute('aria-hidden','true');
  layer.hidden=true;
  document.body.classList.remove('hn-overlay-open');
  const prior=layer.__hnReturnFocus;if(prior&&prior.isConnected)prior.focus();
}
function openLayer(layer,trigger){
  if(!layer)return;
  layer.__hnReturnFocus=trigger||document.activeElement;
  layer.hidden=false;layer.removeAttribute('hidden');layer.setAttribute('aria-hidden','false');
  if(layer.matches('dialog')&&typeof layer.showModal==='function'&&!layer.open){try{layer.showModal()}catch(e){}}
  else{layer.classList.add('is-open','open');document.body.classList.add('hn-overlay-open')}
  const panel=layer.querySelector('[role="document"],.hn-overlay-panel,[data-hn-dialog-panel]')||layer;
  panel.setAttribute('tabindex','-1');
  requestAnimationFrame(()=>{const first=focusables(panel)[0];(first||panel).focus()});
}
function initMotion(){
  if(reduced)return;
  const targets=[];
  document.querySelectorAll('main > section,.section,.hero,.panel,.card,.country-card,.topic-card,.result-card,.fiche-card,.article-card,.overview-grid > *,.form-grid > *').forEach(el=>{if(!el.closest('.liveFrameWrap')){el.classList.add('hn-reveal');targets.push(el)}});
  document.querySelectorAll('.cards,.grid,.card-grid,.results-grid,.directory-grid,.overview-list').forEach(el=>el.classList.add('hn-stagger'));
  if(!('IntersectionObserver'in window)){targets.forEach(el=>el.classList.add('hn-visible'));document.querySelectorAll('.hn-stagger').forEach(el=>el.classList.add('hn-visible'));return}
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('hn-visible');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -40px 0px'});
  targets.forEach(el=>io.observe(el));document.querySelectorAll('.hn-stagger').forEach(el=>io.observe(el));
}
function initDialogs(){
  document.addEventListener('click',e=>{
    const opener=e.target.closest('[data-hn-open]');
    if(opener){const raw=opener.getAttribute('data-hn-open');const target=document.getElementById(raw&&raw.charAt(0)==='#'?raw.slice(1):raw)||document.querySelector(raw||'');if(target){e.preventDefault();openLayer(target,opener)}return}
    const closer=e.target.closest('[data-hn-close],.hn-overlay-close,[data-close-modal]');
    if(closer){const layer=closer.closest('.hn-overlay,[role="dialog"],dialog,[data-hn-modal]');if(layer){e.preventDefault();closeLayer(layer)}return}
    const backdrop=e.target.closest('.hn-overlay');
    if(backdrop&&e.target===backdrop&&backdrop.dataset.dismiss!=='false')closeLayer(backdrop);
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      const top=document.querySelector('.hn-command-palette-backdrop:not([hidden]),.hn-overlay.is-open,[role="dialog"][aria-modal="true"],dialog[open],[data-hn-modal].is-open');
      if(top){if(top.classList.contains('hn-command-palette-backdrop')){top.hidden=true;const trigger=top.__hnReturnFocus;if(trigger&&trigger.isConnected)trigger.focus()}else closeLayer(top);e.preventDefault()}return;
    }
    if(e.key!=='Tab')return;
    const layer=document.querySelector('.hn-command-palette-backdrop:not([hidden]),.hn-overlay.is-open,[role="dialog"][aria-modal="true"],dialog[open],[data-hn-modal].is-open');
    if(!layer)return;
    const items=focusables(layer);if(!items.length){e.preventDefault();layer.focus();return}
    const first=items[0],last=items[items.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  });
  document.querySelectorAll('.hn-overlay.is-open,[role="dialog"][aria-modal="true"],dialog[open],[data-hn-modal].is-open').forEach(el=>{el.setAttribute('aria-hidden','false');document.body.classList.add('hn-overlay-open')});
}
function initCommandPalette(){
  if(!isAdmin())return;
  const back=document.createElement('div');back.className='hn-command-palette-backdrop';back.hidden=true;back.setAttribute('aria-hidden','true');
  const box=document.createElement('section');box.className='hn-command-palette';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Beheercentrum snelzoeken');box.tabIndex=-1;
  const input=document.createElement('input');input.type='search';input.placeholder='Zoek pagina of onderdeel…';input.setAttribute('aria-label','Zoek in beheercentrum');
  const list=document.createElement('div');list.className='hn-command-palette-list';list.setAttribute('role','listbox');
  box.append(input,list);back.append(box);document.body.append(back);
  let entries=[],active=-1;
  function collect(){
    const seen=new Set();entries=Array.from(document.querySelectorAll('.admin-sidebar a[href],.sidebar-nav a[href],.sidebar a[href],nav[aria-label*="beheer" i] a[href],nav[aria-label*="admin" i] a[href]')).filter(a=>{
      const href=a.getAttribute('href');if(!href||href==='#'||href.startsWith('javascript:')||seen.has(href))return false;seen.add(href);return true
    }).map(a=>({href:a.href,label:(a.innerText||a.textContent||'').replace(/\s+/g,' ').trim()})).filter(x=>x.label&&x.href);
  }
  function render(){
    const q=input.value.trim().toLocaleLowerCase('nl');list.replaceChildren();active=-1;
    const matches=entries.filter(x=>(x.label+' '+x.href).toLocaleLowerCase('nl').includes(q)).slice(0,30);
    if(!matches.length){const empty=document.createElement('div');empty.className='hn-command-palette-empty';empty.textContent='Geen onderdelen gevonden.';list.append(empty);return}
    matches.forEach((item,i)=>{const a=document.createElement('a');a.href=item.href;a.setAttribute('role','option');a.dataset.index=String(i);a.textContent=item.label;a.addEventListener('mouseenter',()=>{active=i;mark()});list.append(a)});
  }
  function mark(){list.querySelectorAll('[role="option"]').forEach((el,i)=>{el.setAttribute('aria-selected',String(i===active))})}
  function open(){
    collect();render();back.hidden=false;back.setAttribute('aria-hidden','false');back.__hnReturnFocus=document.activeElement;requestAnimationFrame(()=>input.focus())
  }
  function close(){back.hidden=true;back.setAttribute('aria-hidden','true');const t=back.__hnReturnFocus;if(t&&t.isConnected)t.focus()}
  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(back.hidden)open();else close();return}
    if(back.hidden)return;
    const opts=Array.from(list.querySelectorAll('[role="option"]'));
    if(e.key==='ArrowDown'&&opts.length){e.preventDefault();active=(active+1)%opts.length;mark();opts[active].scrollIntoView({block:'nearest'})}
    else if(e.key==='ArrowUp'&&opts.length){e.preventDefault();active=(active<=0?opts.length-1:active-1);mark();opts[active].scrollIntoView({block:'nearest'})}
    else if(e.key==='Enter'&&active>=0&&opts[active]){e.preventDefault();location.href=opts[active].href}
    else if(e.key==='Escape'&&!back.hidden){e.preventDefault();close()}
  });
  input.addEventListener('input',render);
  back.addEventListener('click',e=>{if(e.target===back)close()});
  box.addEventListener('keydown',e=>{if(e.key==='Tab'){const items=focusables(box);if(!items.length){e.preventDefault();input.focus()}else if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items[items.length-1].focus()}else if(!e.shiftKey&&document.activeElement===items[items.length-1]){e.preventDefault();items[0].focus()}}});
}
function initAdminDrafts(){
  if(!isAdmin())return;
  document.querySelectorAll('form[data-hn-autosave]').forEach((form,index)=>{
    const key='hn:admin-draft:'+location.pathname+':'+(form.dataset.hnAutosaveKey||form.id||index);
    const fields=Array.from(form.querySelectorAll('input,textarea,select')).filter(el=>!['password','file','hidden','submit','button','reset'].includes((el.type||'').toLowerCase())&&!el.disabled);
    if(!fields.length)return;
    let status=form.querySelector('.hn-local-draft-status');
    if(!status){status=document.createElement('p');status.className='hn-local-draft-status';status.setAttribute('role','status');status.textContent='Lokale conceptopslag staat klaar.';form.append(status)}
    try{
      const saved=JSON.parse(localStorage.getItem(key)||'null');
      if(saved&&typeof saved==='object')fields.forEach((el,i)=>{if(!(String(i)in saved))return;const v=saved[String(i)];if(el.type==='checkbox'||el.type==='radio')el.checked=!!v;else if(el.tagName==='SELECT'||el.type!=='password')el.value=String(v??'')});
      if(saved)status.textContent='Lokaal concept hersteld. Opslaan op de server blijft apart nodig.';
    }catch(e){status.textContent='Lokale conceptopslag is niet beschikbaar in deze browser.'}
    let timer;
    form.addEventListener('input',schedule);form.addEventListener('change',schedule);
    function schedule(){clearTimeout(timer);status.textContent='Concept wordt lokaal opgeslagen…';timer=setTimeout(()=>{
      try{const data={};fields.forEach((el,i)=>{data[String(i)]=(el.type==='checkbox'||el.type==='radio')?el.checked:el.value});localStorage.setItem(key,JSON.stringify(data));status.textContent='Concept lokaal opgeslagen. Serverwijzigingen zijn nog niet opgeslagen.'}
      catch(e){status.textContent='Concept kon niet lokaal worden opgeslagen.'}
    },500)}
    form.addEventListener('submit',()=>{clearTimeout(timer);status.textContent='Verzending gestart. Het lokale concept blijft bewaard totdat de serveropslag bevestigd is.'});
    form.addEventListener('hn:save-success',()=>{try{localStorage.removeItem(key);status.textContent='Serveropslag bevestigd. Lokaal concept gewist.'}catch(e){status.textContent='Serveropslag bevestigd.'}});
  });
}
function initDirtyTracking(){
  const dirtyForms=new Set();
  document.querySelectorAll('form[data-hn-track-dirty]').forEach(form=>{
    const mark=()=>{dirtyForms.add(form);form.dataset.hnDirty='true'};
    form.addEventListener('input',mark);form.addEventListener('change',mark);
    form.addEventListener('submit',()=>{dirtyForms.delete(form);delete form.dataset.hnDirty});
    form.addEventListener('hn:save-success',()=>{dirtyForms.delete(form);delete form.dataset.hnDirty});
  });
  window.addEventListener('beforeunload',e=>{if(dirtyForms.size){e.preventDefault();e.returnValue=''}});
}
function init(){
  if(isAdmin()){document.body.classList.add('hn-admin-page');document.body.setAttribute('data-hn-admin','true')}
  initMotion();initDialogs();initCommandPalette();initAdminDrafts();initDirtyTracking();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();